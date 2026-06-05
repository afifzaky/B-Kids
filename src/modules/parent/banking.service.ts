import { prisma } from '../../config/database';
import { ForbiddenError, InsufficientBalanceError, NotFoundError } from '../../types';
import { validateFamilyAccess } from '../../middleware/role';
import type { DepositInput, TransferToChildInput } from './banking.validator';

// =============================================
// Helpers
// =============================================

function serializeLedgerEntry(t: {
  id: string;
  type: string;
  source: string;
  amount: bigint;
  balanceAfter: bigint;
  notes: string | null;
  createdAt: Date;
  relatedChild?: { fullName: string; childAccountNumber: string } | null;
}) {
  return {
    id: t.id,
    type: t.type,
    source: t.source,
    amount: Number(t.amount) / 100,
    balanceAfter: Number(t.balanceAfter) / 100,
    relatedChild: t.relatedChild ?? null,
    notes: t.notes,
    createdAt: t.createdAt,
  };
}

// =============================================
// GET /api/parent/banking/account
// =============================================

export async function getParentAccount(parentProfileId: string) {
  const parent = await prisma.parentProfile.findUnique({
    where: { id: parentProfileId },
    include: {
      familyLinks: {
        include: {
          childProfile: {
            select: {
              id: true,
              fullName: true,
              childAccountNumber: true,
              isActive: true,
              account: { select: { balance: true, currency: true } },
            },
          },
        },
      },
      ledger: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!parent) throw new NotFoundError('Profil orang tua');

  return {
    id: parent.id,
    fullName: parent.fullName,
    bsiAccountNumber: parent.bsiAccountNumber,
    balance: Number(parent.dummyBalance) / 100,
    currency: 'IDR',
    children: parent.familyLinks.map(link => ({
      id: link.childProfile.id,
      fullName: link.childProfile.fullName,
      childAccountNumber: link.childProfile.childAccountNumber,
      isActive: link.childProfile.isActive,
      balance: link.childProfile.account
        ? Number(link.childProfile.account.balance) / 100
        : 0,
      currency: link.childProfile.account?.currency ?? 'IDR',
    })),
    recentTransactions: parent.ledger.map(serializeLedgerEntry),
  };
}

// =============================================
// POST /api/parent/banking/deposit
// =============================================

export async function depositToParentAccount(
  parentProfileId: string,
  input: DepositInput,
  triggeredBy: string,
) {
  const parent = await prisma.parentProfile.findUnique({ where: { id: parentProfileId } });
  if (!parent) throw new NotFoundError('Profil orang tua');

  const amountSen = BigInt(Math.round(input.amount * 100));
  const newBalance = parent.dummyBalance + amountSen;

  const entry = await prisma.$transaction(async tx => {
    await tx.parentProfile.update({
      where: { id: parentProfileId },
      data: { dummyBalance: newBalance },
    });

    const ledgerEntry = await tx.parentLedger.create({
      data: {
        parentProfileId,
        type: 'CREDIT',
        source: 'DEPOSIT',
        amount: amountSen,
        balanceAfter: newBalance,
        notes: input.notes ?? 'Top-up saldo rekening',
      },
    });

    await tx.auditLog.create({
      data: {
        userId: triggeredBy,
        action: 'PARENT_DEPOSIT',
        entityType: 'ParentProfile',
        entityId: parentProfileId,
        newValues: {
          amount: input.amount,
          newBalance: Number(newBalance) / 100,
        },
      },
    });

    return ledgerEntry;
  });

  return {
    transactionId: entry.id,
    amount: input.amount,
    newBalance: Number(newBalance) / 100,
    notes: entry.notes,
    createdAt: entry.createdAt,
  };
}

// =============================================
// POST /api/parent/banking/transfer
// =============================================

export async function transferToChild(
  parentProfileId: string,
  input: TransferToChildInput,
  triggeredBy: string,
) {
  const hasAccess = await validateFamilyAccess(parentProfileId, input.childProfileId);
  if (!hasAccess) throw new ForbiddenError('Anak tidak terdaftar dalam keluarga Anda');

  const [parent, childAccount, childProfile] = await Promise.all([
    prisma.parentProfile.findUnique({ where: { id: parentProfileId } }),
    prisma.childAccount.findUnique({ where: { childProfileId: input.childProfileId } }),
    prisma.childProfile.findUnique({
      where: { id: input.childProfileId },
      select: { fullName: true, childAccountNumber: true },
    }),
  ]);

  if (!parent) throw new NotFoundError('Profil orang tua');
  if (!childAccount || !childProfile) throw new NotFoundError('Rekening anak');

  const amountSen = BigInt(Math.round(input.amount * 100));

  if (parent.dummyBalance < amountSen) {
    throw new InsufficientBalanceError();
  }

  const parentNewBalance = parent.dummyBalance - amountSen;
  const childNewBalance = childAccount.balance + amountSen;

  const entry = await prisma.$transaction(async tx => {
    await tx.parentProfile.update({
      where: { id: parentProfileId },
      data: { dummyBalance: parentNewBalance },
    });

    await tx.childAccount.update({
      where: { id: childAccount.id },
      data: { balance: childNewBalance },
    });

    const parentLedgerEntry = await tx.parentLedger.create({
      data: {
        parentProfileId,
        type: 'DEBIT',
        source: 'TRANSFER_TO_CHILD',
        amount: amountSen,
        balanceAfter: parentNewBalance,
        relatedChildId: input.childProfileId,
        notes: input.notes ?? `Transfer ke ${childProfile.fullName}`,
      },
    });

    await tx.accountLedger.create({
      data: {
        accountId: childAccount.id,
        type: 'CREDIT',
        source: 'TOP_UP_FROM_PARENT',
        amount: amountSen,
        balanceAfter: childNewBalance,
        triggeredBy,
        notes: input.notes ?? 'Kiriman dari orang tua',
      },
    });

    await tx.auditLog.create({
      data: {
        userId: triggeredBy,
        action: 'PARENT_TRANSFER_TO_CHILD',
        entityType: 'ChildAccount',
        entityId: childAccount.id,
        newValues: {
          amount: input.amount,
          childId: input.childProfileId,
          childNewBalance: Number(childNewBalance) / 100,
          parentNewBalance: Number(parentNewBalance) / 100,
        },
      },
    });

    return parentLedgerEntry;
  });

  return {
    transactionId: entry.id,
    recipient: {
      id: input.childProfileId,
      fullName: childProfile.fullName,
      accountNumber: childProfile.childAccountNumber,
    },
    amount: input.amount,
    parentNewBalance: Number(parentNewBalance) / 100,
    childNewBalance: Number(childNewBalance) / 100,
    notes: entry.notes,
    createdAt: entry.createdAt,
  };
}

// =============================================
// GET /api/parent/banking/transactions
// =============================================

export async function getParentTransactions(
  parentProfileId: string,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;

  const [total, transactions] = await Promise.all([
    prisma.parentLedger.count({ where: { parentProfileId } }),
    prisma.parentLedger.findMany({
      where: { parentProfileId },
      include: {
        relatedChild: {
          select: { fullName: true, childAccountNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    transactions: transactions.map(serializeLedgerEntry),
  };
}
