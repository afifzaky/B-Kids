import { prisma } from '../../config/database';
import { AppError, ForbiddenError, NotFoundError } from '../../types';
import { validateFamilyAccess } from '../../middleware/role';
import type { CreateChoreInput, UpdateChoreInput, SubmitChoreInput, RejectChoreInput } from './chores.validator';

// ---- Helpers ----

function serializeChore(c: { rewardAmount: bigint; [key: string]: unknown }) {
  return {
    ...c,
    rewardAmount: Number(c.rewardAmount) / 100,
  };
}

async function assertParentOwnsChore(choreId: string, parentProfileId: string) {
  const chore = await prisma.chore.findUnique({ where: { id: choreId } });
  if (!chore) throw new NotFoundError('Tugas');
  if (chore.createdById !== parentProfileId) throw new ForbiddenError('Bukan tugas milik Anda');
  return chore;
}

async function assertChildAssignedToChore(choreId: string, childProfileId: string) {
  const chore = await prisma.chore.findUnique({ where: { id: choreId } });
  if (!chore) throw new NotFoundError('Tugas');
  if (chore.assignedToId !== childProfileId) throw new ForbiddenError('Tugas ini bukan untukmu');
  return chore;
}

// ---- Service ----

export async function listChores(profileId: string, role: string) {
  const where = role === 'PARENT'
    ? { createdById: profileId }
    : { assignedToId: profileId };

  const chores = await prisma.chore.findMany({
    where,
    include: {
      submissions: {
        orderBy: { submittedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return chores.map(c => ({
    ...serializeChore(c),
    latestSubmission: c.submissions[0] ?? null,
    submissions: undefined,
  }));
}

export async function createChore(parentProfileId: string, input: CreateChoreInput) {
  const hasAccess = await validateFamilyAccess(parentProfileId, input.assignedToId);
  if (!hasAccess) throw new ForbiddenError('Anak tidak terdaftar dalam keluarga Anda');

  const chore = await prisma.chore.create({
    data: {
      createdById: parentProfileId,
      assignedToId: input.assignedToId,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      rewardAmount: BigInt(Math.round(input.rewardAmount * 100)),
      deadline: new Date(input.deadline),
      status: 'ACTIVE',
    },
  });

  return serializeChore(chore);
}

export async function updateChore(
  choreId: string,
  parentProfileId: string,
  input: UpdateChoreInput,
) {
  const chore = await assertParentOwnsChore(choreId, parentProfileId);

  if (!['ACTIVE'].includes(chore.status)) {
    throw new AppError(
      'Tugas tidak dapat diubah setelah disubmit anak',
      422,
      'CHORE_NOT_EDITABLE',
    );
  }

  const updated = await prisma.chore.update({
    where: { id: choreId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.rewardAmount !== undefined && {
        rewardAmount: BigInt(Math.round(input.rewardAmount * 100)),
      }),
      ...(input.deadline !== undefined && { deadline: new Date(input.deadline) }),
    },
  });

  return serializeChore(updated);
}

export async function deleteChore(choreId: string, parentProfileId: string) {
  const chore = await assertParentOwnsChore(choreId, parentProfileId);

  // Bisa dihapus selama belum ada submission (ACTIVE atau status awal)
  const cancellableStatuses = ['ACTIVE', 'REVISION_NEEDED'];
  if (!cancellableStatuses.includes(chore.status)) {
    throw new AppError(
      'Tugas tidak dapat dibatalkan setelah disubmit atau disetujui',
      422,
      'CHORE_NOT_CANCELLABLE',
    );
  }

  await prisma.chore.update({
    where: { id: choreId },
    data: { status: 'CANCELLED' },
  });

  return { message: 'Tugas berhasil dibatalkan' };
}

export async function submitChore(
  choreId: string,
  childProfileId: string,
  input: SubmitChoreInput,
) {
  const chore = await assertChildAssignedToChore(choreId, childProfileId);

  const submittableStatuses = ['ACTIVE', 'REVISION_NEEDED'];
  if (!submittableStatuses.includes(chore.status)) {
    throw new AppError('Tugas tidak dapat disubmit saat ini', 422, 'CHORE_NOT_SUBMITTABLE');
  }

  const submissionCount = await prisma.choreSubmission.count({ where: { choreId } });
  if (submissionCount >= 2) {
    throw new AppError('Batas maksimal submit (2x) sudah tercapai', 422, 'MAX_SUBMISSIONS_REACHED');
  }

  await prisma.$transaction(async tx => {
    await tx.choreSubmission.create({
      data: {
        choreId,
        mediaUrl: input.mediaUrl ?? null,
        notes: input.notes ?? null,
        attempt: submissionCount + 1,
      },
    });

    await tx.chore.update({
      where: { id: choreId },
      data: { status: 'PENDING_REVIEW' },
    });
  });

  return { message: 'Bukti penyelesaian berhasil dikirim. Menunggu review orang tua.' };
}

export async function approveChore(
  choreId: string,
  parentProfileId: string,
  triggeredBy: string,
) {
  const chore = await assertParentOwnsChore(choreId, parentProfileId);

  if (chore.status !== 'PENDING_REVIEW') {
    throw new AppError('Tugas belum dalam status menunggu review', 422, 'CHORE_NOT_PENDING');
  }

  const parentProfile = await prisma.parentProfile.findUnique({ where: { id: parentProfileId } });
  if (!parentProfile) throw new NotFoundError('Profil orang tua');

  if (parentProfile.dummyBalance < chore.rewardAmount) {
    throw new AppError(
      'Saldo orang tua tidak mencukupi untuk memberikan reward',
      422,
      'INSUFFICIENT_PARENT_BALANCE',
    );
  }

  const childAccount = await prisma.childAccount.findUnique({
    where: { childProfileId: chore.assignedToId },
  });
  if (!childAccount) throw new NotFoundError('Rekening anak');

  const parentNewBalance = parentProfile.dummyBalance - chore.rewardAmount;
  const childNewBalance = childAccount.balance + chore.rewardAmount;

  await prisma.$transaction(async tx => {
    // 1. Debit saldo parent
    await tx.parentProfile.update({
      where: { id: parentProfileId },
      data: { dummyBalance: parentNewBalance },
    });

    // 2. Catat di ParentLedger
    await tx.parentLedger.create({
      data: {
        parentProfileId,
        type: 'DEBIT',
        source: 'CHORE_REWARD',
        amount: chore.rewardAmount,
        balanceAfter: parentNewBalance,
        relatedChildId: chore.assignedToId,
        notes: `Reward tugas disetujui: "${chore.title}"`,
      },
    });

    // 3. Kredit ke Tabungan Utama anak (SELALU — bukan pocket)
    await tx.childAccount.update({
      where: { id: childAccount.id },
      data: { balance: childNewBalance },
    });

    // 4. Catat di AccountLedger anak
    await tx.accountLedger.create({
      data: {
        accountId: childAccount.id,
        type: 'CREDIT',
        source: 'CHORE_REWARD',
        amount: chore.rewardAmount,
        balanceAfter: childNewBalance,
        referenceId: chore.id,
        triggeredBy,
        notes: `Reward dari tugas: "${chore.title}"`,
      },
    });

    // 5. Update status chore
    await tx.chore.update({
      where: { id: choreId },
      data: { status: 'APPROVED' },
    });

    await tx.choreSubmission.updateMany({
      where: { choreId, reviewedAt: null },
      data: { reviewedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        userId: triggeredBy,
        action: 'APPROVE_CHORE',
        entityType: 'Chore',
        entityId: choreId,
        newValues: {
          rewardAmount: Number(chore.rewardAmount) / 100,
          childNewBalance: Number(childNewBalance) / 100,
          destination: 'TABUNGAN_UTAMA',
        },
      },
    });
  });

  return {
    message: `Tugas disetujui! Reward Rp ${(Number(chore.rewardAmount) / 100).toLocaleString('id-ID')} masuk ke Tabungan Utama anak.`,
    reward: Number(chore.rewardAmount) / 100,
    destination: 'TABUNGAN_UTAMA',
    childNewBalance: Number(childNewBalance) / 100,
  };
}

export async function rejectChore(
  choreId: string,
  parentProfileId: string,
  input: RejectChoreInput,
  triggeredBy: string,
) {
  const chore = await assertParentOwnsChore(choreId, parentProfileId);

  if (chore.status !== 'PENDING_REVIEW') {
    throw new AppError('Tugas belum dalam status menunggu review', 422, 'CHORE_NOT_PENDING');
  }

  const submissionCount = await prisma.choreSubmission.count({ where: { choreId } });
  const nextStatus = submissionCount >= 2 ? 'REJECTED' : 'REVISION_NEEDED';

  await prisma.$transaction(async tx => {
    await tx.chore.update({
      where: { id: choreId },
      data: { status: nextStatus, rejectionNote: input.rejectionNote },
    });

    await tx.choreSubmission.updateMany({
      where: { choreId, reviewedAt: null },
      data: { reviewedAt: new Date(), reviewerNote: input.rejectionNote },
    });

    await tx.auditLog.create({
      data: {
        userId: triggeredBy,
        action: 'REJECT_CHORE',
        entityType: 'Chore',
        entityId: choreId,
        newValues: { status: nextStatus, rejectionNote: input.rejectionNote },
      },
    });
  });

  const message = nextStatus === 'REVISION_NEEDED'
    ? 'Tugas dikembalikan untuk perbaikan. Anak dapat submit ulang 1x lagi.'
    : 'Tugas ditolak final.';

  return { message, status: nextStatus };
}
