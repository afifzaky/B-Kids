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
  if (!chore) throw new NotFoundError('Chore');
  if (chore.createdById !== parentProfileId) throw new ForbiddenError('Bukan chore milik Anda');
  return chore;
}

async function assertChildAssignedToChore(choreId: string, childProfileId: string) {
  const chore = await prisma.chore.findUnique({ where: { id: choreId } });
  if (!chore) throw new NotFoundError('Chore');
  if (chore.assignedToId !== childProfileId) throw new ForbiddenError('Chore ini bukan untukmu');
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
      targetPocket: {
        select: { id: true, name: true, emoji: true },
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

  if (input.targetPocketId) {
    const childAccount = await prisma.childAccount.findUnique({
      where: { childProfileId: input.assignedToId },
    });
    if (childAccount) {
      const pocket = await prisma.pocket.findFirst({
        where: { id: input.targetPocketId, accountId: childAccount.id, isActive: true },
      });
      if (!pocket) throw new AppError('Pocket tujuan tidak valid atau tidak aktif', 422, 'INVALID_POCKET');
    }
  }

  const chore = await prisma.chore.create({
    data: {
      createdById: parentProfileId,
      assignedToId: input.assignedToId,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      rewardAmount: BigInt(Math.round(input.rewardAmount * 100)),
      deadline: new Date(input.deadline),
      targetPocketId: input.targetPocketId ?? null,
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

  if (!['DRAFT', 'ACTIVE'].includes(chore.status)) {
    throw new AppError('Chore tidak dapat diubah setelah disubmit anak', 422, 'CHORE_NOT_EDITABLE');
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
      ...(input.targetPocketId !== undefined && { targetPocketId: input.targetPocketId }),
    },
  });

  return serializeChore(updated);
}

export async function deleteChore(choreId: string, parentProfileId: string) {
  const chore = await assertParentOwnsChore(choreId, parentProfileId);

  if (chore.status !== 'DRAFT') {
    throw new AppError('Hanya chore berstatus DRAFT yang dapat dihapus', 422, 'CHORE_NOT_DELETABLE');
  }

  await prisma.chore.delete({ where: { id: choreId } });
  return { message: 'Chore berhasil dihapus' };
}

export async function submitChore(
  choreId: string,
  childProfileId: string,
  input: SubmitChoreInput,
) {
  const chore = await assertChildAssignedToChore(choreId, childProfileId);

  const submittableStatuses = ['ACTIVE', 'REJECTED', 'REVISION_NEEDED'];
  if (!submittableStatuses.includes(chore.status)) {
    throw new AppError('Chore tidak dapat disubmit saat ini', 422, 'CHORE_NOT_SUBMITTABLE');
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
    throw new AppError('Chore belum dalam status menunggu review', 422, 'CHORE_NOT_PENDING');
  }

  const parentProfile = await prisma.parentProfile.findUnique({
    where: { id: parentProfileId },
  });
  if (!parentProfile) throw new NotFoundError('Profil orang tua');

  if (parentProfile.dummyBalance < chore.rewardAmount) {
    throw new AppError(
      'Saldo dummy orang tua tidak mencukupi untuk memberikan reward',
      422,
      'INSUFFICIENT_PARENT_BALANCE',
    );
  }

  await prisma.$transaction(async tx => {
    // Debit dari saldo dummy orang tua
    await tx.parentProfile.update({
      where: { id: parentProfileId },
      data: { dummyBalance: parentProfile.dummyBalance - chore.rewardAmount },
    });

    if (chore.targetPocketId) {
      // Kredit langsung ke pocket target
      const pocket = await tx.pocket.findUnique({ where: { id: chore.targetPocketId } });
      if (pocket) {
        const newPocketBalance = pocket.balance + chore.rewardAmount;
        await tx.pocket.update({
          where: { id: chore.targetPocketId },
          data: {
            balance: newPocketBalance,
            isGoalCompleted: pocket.targetAmount
              ? newPocketBalance >= pocket.targetAmount
              : false,
          },
        });

        await tx.pocketLedger.create({
          data: {
            pocketId: chore.targetPocketId,
            type: 'CREDIT',
            source: 'CHORE_REWARD',
            amount: chore.rewardAmount,
            balanceAfter: newPocketBalance,
            referenceId: chore.id,
            triggeredBy,
            notes: `Reward dari chore: "${chore.title}"`,
          },
        });
      }
    } else {
      // Kredit ke rekening utama anak
      const childAccount = await tx.childAccount.findUnique({
        where: { childProfileId: chore.assignedToId },
      });
      if (childAccount) {
        const newBalance = childAccount.balance + chore.rewardAmount;
        await tx.childAccount.update({
          where: { id: childAccount.id },
          data: { balance: newBalance },
        });

        await tx.accountLedger.create({
          data: {
            accountId: childAccount.id,
            type: 'CREDIT',
            source: 'CHORE_REWARD',
            amount: chore.rewardAmount,
            balanceAfter: newBalance,
            referenceId: chore.id,
            triggeredBy,
            notes: `Reward dari chore: "${chore.title}"`,
          },
        });
      }
    }

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
        newValues: { rewardAmount: Number(chore.rewardAmount) / 100, targetPocketId: chore.targetPocketId },
      },
    });
  });

  return {
    message: `Chore disetujui! Reward Rp ${(Number(chore.rewardAmount) / 100).toLocaleString('id-ID')} berhasil dikirim.`,
    reward: Number(chore.rewardAmount) / 100,
    targetPocketId: chore.targetPocketId,
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
    throw new AppError('Chore belum dalam status menunggu review', 422, 'CHORE_NOT_PENDING');
  }

  const submissionCount = await prisma.choreSubmission.count({ where: { choreId } });
  // Jika sudah 2x submit dan masih ditolak → final REJECTED; jika baru 1x → bisa revisi
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
    ? 'Chore dikembalikan untuk perbaikan. Anak dapat submit ulang 1x lagi.'
    : 'Chore ditolak.';

  return { message, status: nextStatus };
}
