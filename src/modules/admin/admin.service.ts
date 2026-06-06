import { prisma } from '../../config/database';
import { AppError, NotFoundError, toRupiah } from '../../types';
import type {
  SearchParentsInput,
  AdjustBalanceInput,
  AuditLogQueryInput,
  CreateVoucherInput,
  UpdateVoucherInput,
  VoucherQueryInput,
  InfaqQueryInput,
  CreateInstitutionInput,
  UpdateInstitutionInput,
} from './admin.validator';

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

// =============================================
// VOUCHER CATALOG — Admin CRUD
// =============================================

function serializeVoucher(v: {
  id: string;
  name: string;
  provider: string;
  category: string;
  voucherType: string;
  price: bigint;
  faceValue: bigint | null;
  description: string | null;
  imageUrl: string | null;
  stock: number | null;
  maxPerChild: number | null;
  validFrom: Date | null;
  validUntil: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: v.id,
    name: v.name,
    provider: v.provider,
    category: v.category,
    voucherType: v.voucherType,
    price: toRupiah(v.price),
    faceValue: v.faceValue ? toRupiah(v.faceValue) : null,
    description: v.description,
    imageUrl: v.imageUrl,
    stock: v.stock,
    maxPerChild: v.maxPerChild,
    validFrom: v.validFrom,
    validUntil: v.validUntil,
    isActive: v.isActive,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

export async function listAdminVouchers(input: VoucherQueryInput) {
  const { page, limit, category, voucherType, isActive, provider } = input;
  const skip = (page - 1) * limit;

  const isActiveFilter =
    isActive === 'true' ? true : isActive === 'false' ? false : undefined;

  const where = {
    ...(category && { category: { contains: category, mode: 'insensitive' as const } }),
    ...(voucherType && { voucherType }),
    ...(isActiveFilter !== undefined && { isActive: isActiveFilter }),
    ...(provider && { provider: { contains: provider, mode: 'insensitive' as const } }),
  };

  const [total, vouchers] = await Promise.all([
    prisma.voucherCatalog.count({ where }),
    prisma.voucherCatalog.findMany({
      where,
      orderBy: [{ category: 'asc' }, { price: 'asc' }],
      skip,
      take: limit,
    }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    vouchers: vouchers.map(serializeVoucher),
  };
}

export async function createVoucher(input: CreateVoucherInput, adminUserId: string) {
  const priceSen = BigInt(Math.round(input.price * 100));
  const faceValueSen = input.faceValue ? BigInt(Math.round(input.faceValue * 100)) : null;

  const voucher = await prisma.voucherCatalog.create({
    data: {
      name: input.name,
      provider: input.provider,
      category: input.category,
      voucherType: input.voucherType,
      price: priceSen,
      faceValue: faceValueSen,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      mockCode: `${input.provider.toUpperCase().replace(/\s+/g, '-')}-BYOND-${Date.now()}`,
      stock: input.stock ?? null,
      maxPerChild: input.maxPerChild ?? null,
      validFrom: input.validFrom ? new Date(input.validFrom) : null,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'ADMIN_CREATE_VOUCHER',
      entityType: 'VoucherCatalog',
      entityId: voucher.id,
      newValues: { name: voucher.name, price: input.price, voucherType: input.voucherType },
    },
  });

  return serializeVoucher(voucher);
}

export async function updateVoucher(
  voucherId: string,
  input: UpdateVoucherInput,
  adminUserId: string,
) {
  const existing = await prisma.voucherCatalog.findUnique({ where: { id: voucherId } });
  if (!existing) throw new NotFoundError('Voucher');

  const priceSen = input.price !== undefined ? BigInt(Math.round(input.price * 100)) : undefined;
  const faceValueSen =
    input.faceValue !== undefined ? BigInt(Math.round(input.faceValue * 100)) : undefined;

  const updated = await prisma.voucherCatalog.update({
    where: { id: voucherId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.provider !== undefined && { provider: input.provider }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.voucherType !== undefined && { voucherType: input.voucherType }),
      ...(priceSen !== undefined && { price: priceSen }),
      ...(faceValueSen !== undefined && { faceValue: faceValueSen }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.stock !== undefined && { stock: input.stock }),
      ...(input.maxPerChild !== undefined && { maxPerChild: input.maxPerChild }),
      ...(input.validFrom !== undefined && { validFrom: new Date(input.validFrom) }),
      ...(input.validUntil !== undefined && { validUntil: new Date(input.validUntil) }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'ADMIN_UPDATE_VOUCHER',
      entityType: 'VoucherCatalog',
      entityId: voucherId,
      oldValues: { name: existing.name, price: toRupiah(existing.price), isActive: existing.isActive },
      newValues: { ...input },
    },
  });

  return serializeVoucher(updated);
}

export async function deleteVoucher(voucherId: string, adminUserId: string) {
  const existing = await prisma.voucherCatalog.findUnique({ where: { id: voucherId } });
  if (!existing) throw new NotFoundError('Voucher');

  // Cek apakah sudah pernah ditukar — soft delete lebih aman
  const redemptionCount = await prisma.voucherRedemption.count({ where: { voucherId } });
  if (redemptionCount > 0) {
    // Tidak bisa hapus voucher yang sudah dipakai — nonaktifkan saja
    await prisma.voucherCatalog.update({
      where: { id: voucherId },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'ADMIN_DEACTIVATE_VOUCHER',
        entityType: 'VoucherCatalog',
        entityId: voucherId,
        newValues: { reason: 'Sudah ada redemption — soft delete (isActive=false)' },
      },
    });

    return { deleted: false, deactivated: true, message: 'Voucher sudah pernah ditukar, status diubah ke nonaktif' };
  }

  await prisma.voucherCatalog.delete({ where: { id: voucherId } });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'ADMIN_DELETE_VOUCHER',
      entityType: 'VoucherCatalog',
      entityId: voucherId,
      oldValues: { name: existing.name },
    },
  });

  return { deleted: true, deactivated: false, message: 'Voucher berhasil dihapus' };
}

export async function listVoucherRedemptions(page: number, limit: number, voucherId?: string) {
  const skip = (page - 1) * limit;
  const where = voucherId ? { voucherId } : {};

  const [total, redemptions] = await Promise.all([
    prisma.voucherRedemption.count({ where }),
    prisma.voucherRedemption.findMany({
      where,
      include: {
        voucher: { select: { name: true, provider: true, voucherType: true } },
        childProfile: { select: { fullName: true, username: true } },
      },
      orderBy: { redeemedAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    redemptions: redemptions.map(r => ({
      id: r.id,
      child: { id: r.childProfileId, fullName: r.childProfile.fullName, username: r.childProfile.username },
      voucher: r.voucher,
      amount: toRupiah(r.amount),
      mockCode: r.mockCodeIssued,
      redeemedAt: r.redeemedAt,
    })),
  };
}

// =============================================
// INFAQ — Admin Read + Stats
// =============================================

// =============================================
// INFAQ INSTITUTION CONFIG — Admin CRUD
// =============================================

export async function listAdminInstitutions(includeInactive = false) {
  const institutions = await prisma.infaqInstitutionConfig.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      _count: { select: { infaqLogs: true } },
      infaqLogs: { select: { amount: true } },
    },
    orderBy: { name: 'asc' },
  });

  return institutions.map(inst => ({
    id: inst.id,
    code: inst.code,
    name: inst.name,
    description: inst.description,
    logoUrl: inst.logoUrl,
    bankInfo: inst.bankInfo,
    isActive: inst.isActive,
    createdAt: inst.createdAt,
    stats: {
      totalDonors: inst._count.infaqLogs,
      totalRp: toRupiah(inst.infaqLogs.reduce((s, l) => s + l.amount, 0n)),
    },
  }));
}

export async function createInstitution(input: CreateInstitutionInput, adminUserId: string) {
  const existing = await prisma.infaqInstitutionConfig.findUnique({ where: { code: input.code } });
  if (existing) {
    throw new AppError(`Kode lembaga "${input.code}" sudah digunakan`, 409, 'DUPLICATE_CODE');
  }

  const institution = await prisma.infaqInstitutionConfig.create({
    data: {
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      logoUrl: input.logoUrl ?? null,
      bankInfo: input.bankInfo ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'ADMIN_CREATE_INSTITUTION',
      entityType: 'InfaqInstitutionConfig',
      entityId: institution.id,
      newValues: { code: institution.code, name: institution.name },
    },
  });

  return institution;
}

export async function updateInstitution(
  institutionId: string,
  input: UpdateInstitutionInput,
  adminUserId: string,
) {
  const existing = await prisma.infaqInstitutionConfig.findUnique({ where: { id: institutionId } });
  if (!existing) throw new NotFoundError('Lembaga infaq');

  if (input.code && input.code !== existing.code) {
    const conflict = await prisma.infaqInstitutionConfig.findUnique({ where: { code: input.code } });
    if (conflict) throw new AppError(`Kode "${input.code}" sudah digunakan`, 409, 'DUPLICATE_CODE');
  }

  const updated = await prisma.infaqInstitutionConfig.update({
    where: { id: institutionId },
    data: {
      ...(input.code && { code: input.code }),
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
      ...(input.bankInfo !== undefined && { bankInfo: input.bankInfo }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'ADMIN_UPDATE_INSTITUTION',
      entityType: 'InfaqInstitutionConfig',
      entityId: institutionId,
      oldValues: { name: existing.name },
      newValues: input,
    },
  });

  return updated;
}

export async function setInstitutionStatus(
  institutionId: string,
  isActive: boolean,
  adminUserId: string,
) {
  const existing = await prisma.infaqInstitutionConfig.findUnique({ where: { id: institutionId } });
  if (!existing) throw new NotFoundError('Lembaga infaq');

  await prisma.infaqInstitutionConfig.update({
    where: { id: institutionId },
    data: { isActive },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: isActive ? 'ADMIN_ACTIVATE_INSTITUTION' : 'ADMIN_DEACTIVATE_INSTITUTION',
      entityType: 'InfaqInstitutionConfig',
      entityId: institutionId,
    },
  });

  return {
    id: institutionId,
    name: existing.name,
    isActive,
    message: `Lembaga "${existing.name}" berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
  };
}

export async function listAdminInfaq(input: InfaqQueryInput) {
  const { page, limit, institutionId, childProfileId, from, to } = input;
  const skip = (page - 1) * limit;

  const where = {
    ...(institutionId && { institutionConfigId: institutionId }),
    ...(childProfileId && { childProfileId }),
    ...((from || to) && {
      createdAt: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    }),
  };

  const [total, logs] = await Promise.all([
    prisma.infaqLog.count({ where }),
    prisma.infaqLog.findMany({
      where,
      include: {
        childProfile: { select: { fullName: true, username: true } },
        institutionConfig: { select: { name: true, code: true } },
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
      child: { id: l.childProfileId, fullName: l.childProfile.fullName, username: l.childProfile.username },
      institution: l.institutionConfig,
      amount: toRupiah(l.amount),
      notes: l.notes,
      createdAt: l.createdAt,
    })),
  };
}

export async function getInfaqStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [totalAllTime, totalMonth, totalYear, institutions] = await Promise.all([
    prisma.infaqLog.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.infaqLog.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { createdAt: { gte: monthStart } },
    }),
    prisma.infaqLog.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { createdAt: { gte: yearStart } },
    }),
    prisma.infaqInstitutionConfig.findMany({
      include: {
        infaqLogs: { select: { amount: true } },
        _count: { select: { infaqLogs: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    summary: {
      allTime: { totalRp: toRupiah(totalAllTime._sum.amount ?? 0n), count: totalAllTime._count },
      thisMonth: { totalRp: toRupiah(totalMonth._sum.amount ?? 0n), count: totalMonth._count },
      thisYear: { totalRp: toRupiah(totalYear._sum.amount ?? 0n), count: totalYear._count },
    },
    byInstitution: institutions.map(inst => ({
      id: inst.id,
      code: inst.code,
      name: inst.name,
      isActive: inst.isActive,
      totalRp: toRupiah(inst.infaqLogs.reduce((s, l) => s + l.amount, 0n)),
      count: inst._count.infaqLogs,
    })),
    generatedAt: new Date().toISOString(),
  };
}
