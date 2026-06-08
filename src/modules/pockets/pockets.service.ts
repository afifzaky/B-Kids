import { Pocket } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError, InsufficientBalanceError, NotFoundError } from '../../types';
import type { CreatePocketInput, UpdatePocketInput } from './pockets.validator';

const MAX_ACTIVE_POCKETS = 5;

// ---- Helpers ----

async function getChildAccount(childProfileId: string) {
  const account = await prisma.childAccount.findUnique({ where: { childProfileId } });
  if (!account) throw new NotFoundError('Rekening anak');
  return account;
}

async function assertPocketOwnership(pocketId: string, childProfileId: string) {
  const account = await getChildAccount(childProfileId);
  const pocket = await prisma.pocket.findFirst({
    where: { id: pocketId, accountId: account.id },
  });
  if (!pocket) throw new NotFoundError('Pocket');
  return { pocket, account };
}

function serialize(p: Pocket) {
  const balance = Number(p.balance) / 100;
  const target = p.targetAmount ? Number(p.targetAmount) / 100 : null;
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    balance,
    targetAmount: target,
    progressPercent: target && target > 0 ? Math.min(100, Math.round((balance / target) * 100)) : null,
    intentionText: p.intentionText,
    emoji: p.emoji,
    deadline: p.deadline,
    isActive: p.isActive,
    isGoalCompleted: p.isGoalCompleted,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// ---- Service ----

export async function listPockets(childProfileId: string) {
  const account = await getChildAccount(childProfileId);

  const pockets = await prisma.pocket.findMany({
    where: { accountId: account.id, isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  return {
    account: {
      id: account.id,
      balance: Number(account.balance) / 100,
      currency: account.currency,
    },
    pockets: pockets.map(serialize),
  };
}

export async function createPocket(
  childProfileId: string,
  input: CreatePocketInput,
  triggeredBy: string,
) {
  const account = await getChildAccount(childProfileId);

  const activeCount = await prisma.pocket.count({
    where: { accountId: account.id, isActive: true },
  });
  if (activeCount >= MAX_ACTIVE_POCKETS) {
    throw new AppError(`Maksimal ${MAX_ACTIVE_POCKETS} pocket aktif`, 422, 'MAX_POCKETS_REACHED');
  }

  const pocket = await prisma.pocket.create({
    data: {
      accountId: account.id,
      name: input.name,
      category: input.category,
      targetAmount: input.targetAmount ? BigInt(Math.round(input.targetAmount * 100)) : null,
      deadline: input.deadline ? new Date(input.deadline) : null,
      intentionText: input.intentionText ?? null,
      emoji: input.emoji ?? '💰',
      balance: BigInt(0),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: triggeredBy,
      action: 'CREATE_POCKET',
      entityType: 'Pocket',
      entityId: pocket.id,
      newValues: { name: pocket.name, category: pocket.category },
    },
  });

  return serialize(pocket);
}

export async function getPocket(pocketId: string, childProfileId: string) {
  const { pocket } = await assertPocketOwnership(pocketId, childProfileId);

  const ledger = await prisma.pocketLedger.findMany({
    where: { pocketId: pocket.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return {
    ...serialize(pocket),
    ledger: ledger.map(l => ({
      id: l.id,
      type: l.type,
      source: l.source,
      amount: Number(l.amount) / 100,
      balanceAfter: Number(l.balanceAfter) / 100,
      notes: l.notes,
      createdAt: l.createdAt,
    })),
  };
}

export async function updatePocket(
  pocketId: string,
  childProfileId: string,
  input: UpdatePocketInput,
) {
  const { pocket } = await assertPocketOwnership(pocketId, childProfileId);

  const updated = await prisma.pocket.update({
    where: { id: pocket.id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.targetAmount !== undefined && {
        targetAmount: input.targetAmount != null
          ? BigInt(Math.round(input.targetAmount * 100))
          : null,
      }),
      ...(input.deadline !== undefined && {
        deadline: input.deadline ? new Date(input.deadline) : null,
      }),
      ...(input.intentionText !== undefined && { intentionText: input.intentionText }),
      ...(input.emoji !== undefined && { emoji: input.emoji }),
    },
  });

  return serialize(updated);
}

export async function deletePocket(
  pocketId: string,
  childProfileId: string,
  triggeredBy: string,
) {
  const { pocket, account } = await assertPocketOwnership(pocketId, childProfileId);

  await prisma.$transaction(async tx => {
    if (pocket.balance > BigInt(0)) {
      const newAccountBalance = account.balance + pocket.balance;

      await tx.childAccount.update({
        where: { id: account.id },
        data: { balance: newAccountBalance },
      });

      await tx.pocketLedger.create({
        data: {
          pocketId: pocket.id,
          type: 'DEBIT',
          source: 'POCKET_DEALLOCATE',
          amount: pocket.balance,
          balanceAfter: BigInt(0),
          triggeredBy,
          notes: `Pocket "${pocket.name}" dihapus, saldo dikembalikan`,
        },
      });

      await tx.accountLedger.create({
        data: {
          accountId: account.id,
          type: 'CREDIT',
          source: 'POCKET_DEALLOCATE',
          amount: pocket.balance,
          balanceAfter: newAccountBalance,
          triggeredBy,
          notes: `Saldo dari pocket "${pocket.name}" dikembalikan`,
        },
      });
    }

    await tx.pocket.update({
      where: { id: pocket.id },
      data: { isActive: false },
    });
  });

  return { message: `Pocket "${pocket.name}" berhasil dihapus. Saldo dikembalikan ke rekening utama.` };
}

export async function topupPocket(
  pocketId: string,
  childProfileId: string,
  amountRp: number,
  triggeredBy: string,
) {
  const { pocket, account } = await assertPocketOwnership(pocketId, childProfileId);

  if (!pocket.isActive) {
    throw new AppError('Pocket tidak aktif', 422, 'POCKET_INACTIVE');
  }

  const amountSen = BigInt(Math.round(amountRp * 100));

  if (account.balance < amountSen) {
    throw new InsufficientBalanceError();
  }

  const result = await prisma.$transaction(async tx => {
    const newAccountBalance = account.balance - amountSen;
    const newPocketBalance = pocket.balance + amountSen;
    const goalCompleted = pocket.targetAmount
      ? newPocketBalance >= pocket.targetAmount
      : false;

    await tx.childAccount.update({
      where: { id: account.id },
      data: { balance: newAccountBalance },
    });

    await tx.pocket.update({
      where: { id: pocket.id },
      data: { balance: newPocketBalance, isGoalCompleted: goalCompleted },
    });

    await tx.accountLedger.create({
      data: {
        accountId: account.id,
        type: 'DEBIT',
        source: 'POCKET_ALLOCATE',
        amount: amountSen,
        balanceAfter: newAccountBalance,
        triggeredBy,
        notes: `Alokasi ke pocket "${pocket.name}"`,
      },
    });

    await tx.pocketLedger.create({
      data: {
        pocketId: pocket.id,
        type: 'CREDIT',
        source: 'POCKET_ALLOCATE',
        amount: amountSen,
        balanceAfter: newPocketBalance,
        triggeredBy,
        notes: 'Top-up dari saldo utama',
      },
    });

    return { newAccountBalance, newPocketBalance, goalCompleted };
  });

  return {
    pocket: pocket.name,
    amount: amountRp,
    newPocketBalance: Number(result.newPocketBalance) / 100,
    newAccountBalance: Number(result.newAccountBalance) / 100,
    goalCompleted: result.goalCompleted,
  };
}
