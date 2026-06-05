import { prisma } from '../../config/database';
import { AppError, NotFoundError, toRupiah } from '../../types';
import type { SearchParentsInput, AdjustBalanceInput, AuditLogQueryInput } from './admin.validator';

// =============================================
// Helpers
// =============================================

function serializeParent(p: {
  id: string;
  fullName: string;
  nik: string;
  bsiAccountNumber: string;
  dummyBalance: bigint;
  user: { id: string; email: string; phone: string | null; isActive: boolean; createdAt: Date };
  familyLinks: { childProfile: { id: string; fullName: string; isActive: boolean } }[];
}) {
  return {
    id: p.id,
    fullName: p.fullName,
    nik: p.nik,
    bsiAccountNumber: p.bsiAccountNumber,
    balance: toRupiah(p.dummyBalance),
    user: {
      id: p.user.id,
      email: p.user.email,
      phone: p.user.phone,
      isActive: p.user.isActive,
      createdAt: p.user.createdAt,
    },
    childrenCount: p.familyLinks.length,
    children: p.familyLinks.map(l => ({
      id: l.childProfile.id,
      fullName: l.childProfile.fullName,
      isActive: l.childProfile.isActive,
    })),
  };
}

// =============================================
// GET /api/admin/stats
// =============================================

export async function getPlatformStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalParents,
    activeParents,
    totalChildren,
    activeChildren,
    totalTransactionsMonth,
    totalChoresMonth,
    pendingChores,
    totalInfaqMonth,
    newUsersToday,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'PARENT' } }),
    prisma.user.count({ where: { role: 'PARENT', isActive: true } }),
    prisma.user.count({ where: { role: 'CHILD' } }),
    prisma.childProfile.count({ where: { isActive: true } }),
    prisma.accountLedger.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.chore.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.chore.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.infaqLog.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: monthStart } },
    }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
  ]);

  // Total saldo di seluruh rekening anak
  const childBalanceAgg = await prisma.childAccount.aggregate({ _sum: { balance: true } });
  const parentBalanceAgg = await prisma.parentProfile.aggregate({ _sum: { dummyBalance: true } });

  return {
    users: {
      totalParents,
      activeParents,
      inactiveParents: totalParents - activeParents,
      totalChildren,
      activeChildren,
      inactiveChildren: totalChildren - activeChildren,
      newUsersToday,
    },
    financial: {
      totalChildBalanceRp: toRupiah(childBalanceAgg._sum.balance ?? 0n),
      totalParentBalanceRp: toRupiah(parentBalanceAgg._sum.dummyBalance ?? 0n),
    },
    activity: {
      transactionsThisMonth: totalTransactionsMonth,
      choresThisMonth: totalChoresMonth,
      choresPendingReview: pendingChores,
      infaqThisMonthRp: toRupiah(totalInfaqMonth._sum.amount ?? 0n),
    },
    generatedAt: new Date().toISOString(),
  };
}

// =============================================
// GET /api/admin/parents
// =============================================

export async function listParents(input: SearchParentsInput) {
  const { page, limit, search, isActive } = input;
  const skip = (page - 1) * limit;

  const isActiveFilter =
    isActive === 'true' ? true : isActive === 'false' ? false : undefined;

  const where = {
    role: 'PARENT' as const,
    ...(isActiveFilter !== undefined && { isActive: isActiveFilter }),
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { parentProfile: { fullName: { contains: search, mode: 'insensitive' as const } } },
        { parentProfile: { nik: { contains: search } } },
        { parentProfile: { bsiAccountNumber: { contains: search } } },
      ],
    }),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: {
        parentProfile: {
          include: {
            user: {
              select: { id: true, email: true, phone: true, isActive: true, createdAt: true },
            },
            familyLinks: {
              include: {
                childProfile: {
                  select: { id: true, fullName: true, isActive: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    parents: users
      .filter(u => u.parentProfile)
      .map(u => serializeParent(u.parentProfile!)),
  };
}

// =============================================
// GET /api/admin/parents/:parentId
// =============================================

export async function getParentDetail(parentId: string) {
  const parent = await prisma.parentProfile.findUnique({
    where: { id: parentId },
    include: {
      user: true,
      familyLinks: {
        include: {
          childProfile: {
            include: {
              user: { select: { isActive: true, createdAt: true } },
              account: {
                include: {
                  pockets: {
                    where: { isActive: true },
                    select: { id: true, name: true, category: true, emoji: true, balance: true },
                  },
                },
              },
              spendingLimits: { where: { isActive: true } },
            },
          },
        },
      },
      ledger: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          relatedChild: { select: { fullName: true, childAccountNumber: true } },
        },
      },
    },
  });

  if (!parent) throw new NotFoundError('Profil orang tua');

  return {
    id: parent.id,
    fullName: parent.fullName,
    nik: parent.nik,
    dateOfBirth: parent.dateOfBirth,
    bsiAccountNumber: parent.bsiAccountNumber,
    balance: toRupiah(parent.dummyBalance),
    user: {
      id: parent.user.id,
      email: parent.user.email,
      phone: parent.user.phone,
      isActive: parent.user.isActive,
      createdAt: parent.user.createdAt,
    },
    children: parent.familyLinks.map(link => {
      const child = link.childProfile;
      return {
        id: child.id,
        fullName: child.fullName,
        dateOfBirth: child.dateOfBirth,
        username: child.username,
        childAccountNumber: child.childAccountNumber,
        isActive: child.isActive,
        createdAt: child.user.createdAt,
        account: child.account
          ? {
              id: child.account.id,
              balance: toRupiah(child.account.balance),
              currency: child.account.currency,
              pockets: child.account.pockets.map(p => ({
                id: p.id,
                name: p.name,
                category: p.category,
                emoji: p.emoji,
                balance: toRupiah(p.balance),
              })),
            }
          : null,
        spendingLimits: child.spendingLimits.map(l => ({
          period: l.period,
          limitAmount: toRupiah(l.limitAmount),
          excludeInfaq: l.excludeInfaq,
        })),
      };
    }),
    recentLedger: parent.ledger.map(t => ({
      id: t.id,
      type: t.type,
      source: t.source,
      amount: toRupiah(t.amount),
      balanceAfter: toRupiah(t.balanceAfter),
      relatedChild: t.relatedChild ?? null,
      notes: t.notes,
      createdAt: t.createdAt,
    })),
  };
}

// =============================================
// PATCH /api/admin/parents/:parentId/status
// =============================================

export async function setParentStatus(
  parentId: string,
  isActive: boolean,
  adminUserId: string,
  reason?: string,
) {
  const parent = await prisma.parentProfile.findUnique({
    where: { id: parentId },
    select: { userId: true, fullName: true, user: { select: { isActive: true } } },
  });
  if (!parent) throw new NotFoundError('Profil orang tua');

  if (parent.user.isActive === isActive) {
    throw new AppError(
      `Akun sudah dalam status ${isActive ? 'aktif' : 'nonaktif'}`,
      422,
      'STATUS_UNCHANGED',
    );
  }

  await prisma.$transaction(async tx => {
    await tx.user.update({ where: { id: parent.userId }, data: { isActive } });

    // Jika nonaktifkan parent, invalidasi semua refresh token mereka
    if (!isActive) {
      await tx.refreshToken.deleteMany({ where: { userId: parent.userId } });
    }

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: isActive ? 'ADMIN_ACTIVATE_PARENT' : 'ADMIN_DEACTIVATE_PARENT',
        entityType: 'User',
        entityId: parent.userId,
        newValues: { isActive, reason: reason ?? null },
      },
    });
  });

  return {
    parentId,
    fullName: parent.fullName,
    isActive,
    message: `Akun orang tua berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
  };
}

// =============================================
// PATCH /api/admin/children/:childId/status
// =============================================

export async function setChildStatus(
  childId: string,
  isActive: boolean,
  adminUserId: string,
  reason?: string,
) {
  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
    select: { userId: true, fullName: true, isActive: true },
  });
  if (!child) throw new NotFoundError('Profil anak');

  if (child.isActive === isActive) {
    throw new AppError(
      `Akun sudah dalam status ${isActive ? 'aktif' : 'nonaktif'}`,
      422,
      'STATUS_UNCHANGED',
    );
  }

  await prisma.$transaction(async tx => {
    await tx.childProfile.update({ where: { id: childId }, data: { isActive } });
    await tx.user.update({ where: { id: child.userId }, data: { isActive } });

    if (!isActive) {
      await tx.refreshToken.deleteMany({ where: { userId: child.userId } });
    }

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: isActive ? 'ADMIN_ACTIVATE_CHILD' : 'ADMIN_DEACTIVATE_CHILD',
        entityType: 'ChildProfile',
        entityId: childId,
        newValues: { isActive, reason: reason ?? null },
      },
    });
  });

  return {
    childId,
    fullName: child.fullName,
    isActive,
    message: `Akun anak berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
  };
}

// =============================================
// POST /api/admin/parents/:parentId/balance/adjust
// =============================================

export async function adjustParentBalance(
  parentId: string,
  input: AdjustBalanceInput,
  adminUserId: string,
) {
  const parent = await prisma.parentProfile.findUnique({ where: { id: parentId } });
  if (!parent) throw new NotFoundError('Profil orang tua');

  const amountSen = BigInt(Math.round(input.amount * 100));
  const newBalance = parent.dummyBalance + amountSen;

  if (newBalance < 0n) {
    throw new AppError('Penyesuaian akan membuat saldo negatif', 422, 'BALANCE_NEGATIVE');
  }

  const entry = await prisma.$transaction(async tx => {
    await tx.parentProfile.update({
      where: { id: parentId },
      data: { dummyBalance: newBalance },
    });

    const ledger = await tx.parentLedger.create({
      data: {
        parentProfileId: parentId,
        type: amountSen >= 0n ? 'CREDIT' : 'DEBIT',
        source: 'ADJUSTMENT',
        amount: amountSen < 0n ? -amountSen : amountSen,
        balanceAfter: newBalance,
        notes: input.notes,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'ADMIN_BALANCE_ADJUSTMENT',
        entityType: 'ParentProfile',
        entityId: parentId,
        oldValues: { balance: toRupiah(parent.dummyBalance) },
        newValues: { balance: toRupiah(newBalance), adjustment: input.amount, notes: input.notes },
      },
    });

    return ledger;
  });

  return {
    transactionId: entry.id,
    adjustment: input.amount,
    previousBalance: toRupiah(parent.dummyBalance),
    newBalance: toRupiah(newBalance),
    notes: input.notes,
    createdAt: entry.createdAt,
  };
}

// =============================================
// GET /api/admin/parents/:parentId/ledger
// =============================================

export async function getParentLedger(
  parentId: string,
  page: number,
  limit: number,
) {
  const parent = await prisma.parentProfile.findUnique({
    where: { id: parentId },
    select: { id: true, fullName: true },
  });
  if (!parent) throw new NotFoundError('Profil orang tua');

  const skip = (page - 1) * limit;

  const [total, transactions] = await Promise.all([
    prisma.parentLedger.count({ where: { parentProfileId: parentId } }),
    prisma.parentLedger.findMany({
      where: { parentProfileId: parentId },
      include: {
        relatedChild: { select: { fullName: true, childAccountNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    parent: { id: parent.id, fullName: parent.fullName },
    transactions: transactions.map(t => ({
      id: t.id,
      type: t.type,
      source: t.source,
      amount: toRupiah(t.amount),
      balanceAfter: toRupiah(t.balanceAfter),
      relatedChild: t.relatedChild ?? null,
      notes: t.notes,
      createdAt: t.createdAt,
    })),
  };
}

// =============================================
// GET /api/admin/children/:childId
// =============================================

export async function getChildDetail(childId: string) {
  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
    include: {
      user: { select: { id: true, email: true, isActive: true, createdAt: true } },
      account: {
        include: {
          pockets: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
          ledger: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      },
      spendingLimits: { where: { isActive: true } },
      choresAssigned: {
        where: { status: { in: ['ACTIVE', 'PENDING_REVIEW'] } },
        orderBy: { deadline: 'asc' },
        take: 10,
      },
      familyLinks: {
        include: {
          parentProfile: { select: { id: true, fullName: true, bsiAccountNumber: true } },
        },
      },
    },
  });

  if (!child) throw new NotFoundError('Profil anak');

  return {
    id: child.id,
    fullName: child.fullName,
    username: child.username,
    dateOfBirth: child.dateOfBirth,
    childAccountNumber: child.childAccountNumber,
    isActive: child.isActive,
    createdAt: child.user.createdAt,
    parent: child.familyLinks[0]?.parentProfile ?? null,
    account: child.account
      ? {
          id: child.account.id,
          balance: toRupiah(child.account.balance),
          currency: child.account.currency,
          pockets: child.account.pockets.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            emoji: p.emoji,
            balance: toRupiah(p.balance),
            targetAmount: p.targetAmount ? toRupiah(p.targetAmount) : null,
            isGoalCompleted: p.isGoalCompleted,
            deadline: p.deadline,
          })),
          recentTransactions: child.account.ledger.map(t => ({
            id: t.id,
            type: t.type,
            source: t.source,
            amount: toRupiah(t.amount),
            balanceAfter: toRupiah(t.balanceAfter),
            notes: t.notes,
            createdAt: t.createdAt,
          })),
        }
      : null,
    spendingLimits: child.spendingLimits.map(l => ({
      period: l.period,
      limitAmount: toRupiah(l.limitAmount),
      excludeInfaq: l.excludeInfaq,
    })),
    activeChores: child.choresAssigned.map(c => ({
      id: c.id,
      title: c.title,
      category: c.category,
      rewardAmount: toRupiah(c.rewardAmount),
      status: c.status,
      deadline: c.deadline,
    })),
  };
}

// =============================================
// GET /api/admin/audit-logs
// =============================================

export async function getAuditLogs(input: AuditLogQueryInput) {
  const { page, limit, userId, action, entityType, from, to } = input;
  const skip = (page - 1) * limit;

  const where = {
    ...(userId && { userId }),
    ...(action && { action: { contains: action, mode: 'insensitive' as const } }),
    ...(entityType && { entityType }),
    ...(from || to
      ? {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
      : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            role: true,
            parentProfile: { select: { fullName: true } },
            childProfile: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    logs: logs.map(l => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      actor: {
        userId: l.userId,
        email: l.user.email,
        role: l.user.role,
        fullName:
          l.user.parentProfile?.fullName ?? l.user.childProfile?.fullName ?? null,
      },
      oldValues: l.oldValues,
      newValues: l.newValues,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt,
    })),
  };
}
