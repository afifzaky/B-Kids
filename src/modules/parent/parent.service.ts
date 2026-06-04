import { prisma } from '../../config/database';
import { ForbiddenError, NotFoundError } from '../../types';
import { validateFamilyAccess } from '../../middleware/role';

export async function getChildSummary(parentProfileId: string, childProfileId: string) {
  const hasAccess = await validateFamilyAccess(parentProfileId, childProfileId);
  if (!hasAccess) throw new ForbiddenError('Anak tidak terdaftar dalam keluarga Anda');

  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childProfileId },
    include: {
      account: {
        include: {
          pockets: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });
  if (!childProfile) throw new NotFoundError('Profil anak');

  const pocketIds = childProfile.account?.pockets.map(p => p.id) ?? [];

  // Monthly stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    monthlyInfaq,
    monthlyRewards,
    pendingReviews,
    limits,
    recentTransactions,
  ] = await Promise.all([
    prisma.infaqLog.aggregate({
      _sum: { amount: true },
      where: { childProfileId, createdAt: { gte: monthStart } },
    }),
    prisma.pocketLedger.aggregate({
      _sum: { amount: true },
      where: {
        pocketId: { in: pocketIds },
        source: 'CHORE_REWARD',
        type: 'CREDIT',
        createdAt: { gte: monthStart },
      },
    }),
    prisma.chore.count({
      where: { createdById: parentProfileId, assignedToId: childProfileId, status: 'PENDING_REVIEW' },
    }),
    prisma.spendingLimit.findMany({
      where: { childProfileId, isActive: true },
    }),
    prisma.pocketLedger.findMany({
      where: { pocketId: { in: pocketIds } },
      include: { pocket: { select: { name: true, emoji: true } } },
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
  ]);

  return {
    profile: {
      id: childProfile.id,
      fullName: childProfile.fullName,
      isActive: childProfile.isActive,
    },
    account: childProfile.account
      ? {
          id: childProfile.account.id,
          balance: Number(childProfile.account.balance) / 100,
          currency: childProfile.account.currency,
          pockets: childProfile.account.pockets.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            emoji: p.emoji,
            balance: Number(p.balance) / 100,
            targetAmount: p.targetAmount ? Number(p.targetAmount) / 100 : null,
            progressPercent: p.targetAmount && Number(p.targetAmount) > 0
              ? Math.min(100, Math.round((Number(p.balance) / Number(p.targetAmount)) * 100))
              : null,
            isGoalCompleted: p.isGoalCompleted,
          })),
        }
      : null,
    monthlyStats: {
      infaqTotal: Number(monthlyInfaq._sum.amount ?? 0) / 100,
      choreRewards: Number(monthlyRewards._sum.amount ?? 0) / 100,
    },
    pendingChoreReviews: pendingReviews,
    limits: limits.map(l => ({
      period: l.period,
      limitAmount: Number(l.limitAmount) / 100,
      excludeInfaq: l.excludeInfaq,
    })),
    recentTransactions: recentTransactions.map(t => ({
      id: t.id,
      pocket: t.pocket,
      type: t.type,
      source: t.source,
      amount: Number(t.amount) / 100,
      notes: t.notes,
      createdAt: t.createdAt,
    })),
  };
}
