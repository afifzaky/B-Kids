import { prisma } from '../../config/database';
import { NotFoundError } from '../../types';

function toRp(sen: bigint | null | undefined): number {
  return Number(sen ?? 0n) / 100;
}

export async function getChildDashboard(childProfileId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [childProfile, account, pockets, pendingChores, recentTx, monthlySpend, infaqMonth] = await Promise.all([
    prisma.childProfile.findUnique({ where: { id: childProfileId }, select: { childAccountNumber: true } }),
    prisma.childAccount.findUnique({ where: { childProfileId } }),
    prisma.pocket.findMany({
      where: { account: { childProfileId }, isActive: true },
      select: { id: true, name: true, category: true, balance: true, targetAmount: true },
    }),
    prisma.chore.count({
      where: { assignedToId: childProfileId, status: 'PENDING_REVIEW' },
    }),
    prisma.accountLedger.findMany({
      where: { account: { childProfileId }, createdAt: { gte: monthStart } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, type: true, source: true, amount: true, notes: true, createdAt: true },
    }),
    prisma.accountLedger.aggregate({
      _sum: { amount: true },
      where: { account: { childProfileId }, type: 'DEBIT', createdAt: { gte: monthStart } },
    }),
    prisma.infaqLog.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { childProfileId, createdAt: { gte: monthStart } },
    }),
  ]);

  if (!account) throw new NotFoundError('Rekening anak');

  const totalPocketBalance = pockets.reduce((s, p) => s + p.balance, 0n);

  return {
    tabunganUtama: {
      balance: toRp(account.balance),
      accountNumber: childProfile?.childAccountNumber ?? null,
    },
    pockets: {
      total: pockets.length,
      totalBalance: toRp(totalPocketBalance),
      items: pockets.map(p => ({
        id: p.id,
        name: p.name,
        type: p.category,
        balance: toRp(p.balance),
        targetAmount: p.targetAmount ? toRp(p.targetAmount) : null,
        progressPct: p.targetAmount && p.targetAmount > 0n
          ? Math.min(100, Math.round((Number(p.balance) / Number(p.targetAmount)) * 100))
          : null,
      })),
    },
    thisMonth: {
      totalSpend: toRp(monthlySpend._sum.amount),
      infaqAmount: toRp(infaqMonth._sum.amount),
      infaqCount: infaqMonth._count,
    },
    pendingChores,
    recentTransactions: recentTx.map(t => ({
      id: t.id,
      type: t.type,
      source: t.source,
      amount: toRp(t.amount),
      notes: t.notes,
      createdAt: t.createdAt,
    })),
  };
}

export async function getChildProfile(childProfileId: string) {
  const profile = await prisma.childProfile.findUnique({
    where: { id: childProfileId },
    select: {
      id: true,
      fullName: true,
      username: true,
      dateOfBirth: true,
      avatar: true,
      childAccountNumber: true,
      isActive: true,
      createdAt: true,
      user: { select: { email: true } },
      familyLinks: {
        take: 1,
        select: {
          parentProfile: { select: { id: true, fullName: true } },
        },
      },
    },
  });
  if (!profile) throw new NotFoundError('Profil anak');

  const { familyLinks, ...rest } = profile;
  return {
    ...rest,
    parent: familyLinks[0]?.parentProfile ?? null,
  };
}

export async function updateChildAvatar(childProfileId: string, avatar: string) {
  await prisma.childProfile.update({
    where: { id: childProfileId },
    data: { avatar },
  });
  return { avatar };
}

export async function getChildAccount(childProfileId: string) {
  const [childProfile, account, limits] = await Promise.all([
    prisma.childProfile.findUnique({ where: { id: childProfileId }, select: { childAccountNumber: true } }),
    prisma.childAccount.findUnique({ where: { childProfileId } }),
    prisma.spendingLimit.findMany({
      where: { childProfileId, isActive: true },
      orderBy: { period: 'asc' },
    }),
  ]);
  if (!account) throw new NotFoundError('Rekening anak');

  return {
    accountNumber: childProfile?.childAccountNumber ?? null,
    balance: toRp(account.balance),
    spendingLimits: limits.map(l => ({
      id: l.id,
      period: l.period,
      limitAmount: toRp(l.limitAmount),
      voucherType: l.voucherType ?? null,
      excludeInfaq: l.excludeInfaq,
      updatedAt: l.updatedAt,
    })),
  };
}

export async function getChildTransactions(childProfileId: string, page = 1, limit = 20) {
  const account = await prisma.childAccount.findUnique({ where: { childProfileId } });
  if (!account) throw new NotFoundError('Rekening anak');

  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    prisma.accountLedger.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.accountLedger.count({ where: { accountId: account.id } }),
  ]);

  return {
    data: rows.map(r => ({
      id: r.id,
      type: r.type,
      source: r.source,
      amount: toRp(r.amount),
      balanceAfter: toRp(r.balanceAfter),
      notes: r.notes,
      createdAt: r.createdAt,
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getChildPockets(childProfileId: string) {
  const pockets = await prisma.pocket.findMany({
    where: { account: { childProfileId }, isActive: true },
    include: { _count: { select: { ledger: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return pockets.map(p => ({
    id: p.id,
    name: p.name,
    type: p.category,
    balance: toRp(p.balance),
    targetAmount: p.targetAmount ? toRp(p.targetAmount) : null,
    progressPct: p.targetAmount && p.targetAmount > 0n
      ? Math.min(100, Math.round((Number(p.balance) / Number(p.targetAmount)) * 100))
      : null,
    transactionCount: p._count.ledger,
    createdAt: p.createdAt,
  }));
}
