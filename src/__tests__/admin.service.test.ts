const mockTx = {
  user: { update: jest.fn() },
  parentProfile: { update: jest.fn() },
  childProfile: { update: jest.fn() },
  refreshToken: { deleteMany: jest.fn() },
  auditLog: { create: jest.fn() },
  parentLedger: { create: jest.fn().mockResolvedValue({ id: 'ledger-1' }) },
  childAccount: { update: jest.fn() },
  accountLedger: { create: jest.fn() },
};

jest.mock('../config/database', () => ({
  prisma: {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    parentProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    childProfile: {
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    childAccount: { aggregate: jest.fn(), findUnique: jest.fn() },
    accountLedger: { count: jest.fn(), findMany: jest.fn() },
    chore: { count: jest.fn() },
    infaqLog: { aggregate: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    infaqInstitutionConfig: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    voucherCatalog: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    voucherRedemption: { findMany: jest.fn(), count: jest.fn() },
    auditLog: { findMany: jest.fn(), count: jest.fn(), create: jest.fn() },
    parentLedger: { findMany: jest.fn(), count: jest.fn(), create: jest.fn() },
    refreshToken: { deleteMany: jest.fn() },
    // $transaction: simulate callback-style (for functions that use tx.xxx inside)
    $transaction: jest.fn().mockImplementation((cbOrArray: unknown) => {
      if (typeof cbOrArray === 'function') {
        return (cbOrArray as (tx: typeof mockTx) => unknown)(mockTx);
      }
      return Promise.all(cbOrArray as Promise<unknown>[]);
    }),
  },
}));

import { prisma } from '../config/database';
import { AppError, NotFoundError } from '../types';
import {
  getPlatformStats,
  listParents,
  setParentStatus,
  setChildStatus,
  adjustParentBalance,
  createVoucher,
  deleteVoucher,
  getInfaqStats,
  createInstitution,
  setInstitutionStatus,
} from '../modules/admin/admin.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

beforeEach(() => jest.clearAllMocks());

// =============================================
describe('getPlatformStats', () => {
  it('returns aggregated platform metrics', async () => {
    // user.count is called 4 times: totalParents, activeParents, totalChildren, newUsersToday
    (mockPrisma.user.count as jest.Mock)
      .mockResolvedValueOnce(10)  // totalParents
      .mockResolvedValueOnce(8)   // activeParents
      .mockResolvedValueOnce(20)  // totalChildren (role: CHILD)
      .mockResolvedValueOnce(0)   // newUsersToday
    ;
    (mockPrisma.childProfile.count as jest.Mock).mockResolvedValue(18);
    (mockPrisma.accountLedger.count as jest.Mock).mockResolvedValue(5);
    (mockPrisma.chore.count as jest.Mock).mockResolvedValueOnce(3).mockResolvedValueOnce(1);
    (mockPrisma.infaqLog.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: null } });
    (mockPrisma.childAccount.aggregate as jest.Mock).mockResolvedValue({ _sum: { balance: null } });
    (mockPrisma.parentProfile.aggregate as jest.Mock).mockResolvedValue({ _sum: { dummyBalance: null } });

    const result = await getPlatformStats();
    expect(result.users.totalParents).toBe(10);
    expect(result.users.activeParents).toBe(8);
    expect(result.users.inactiveParents).toBe(2);
    expect(result).toHaveProperty('financial');
    expect(result).toHaveProperty('activity');
    expect(result).toHaveProperty('generatedAt');
  });
});

// =============================================
describe('listParents', () => {
  it('returns paginated parent list', async () => {
    // Use mockImplementation to survive jest.clearAllMocks() in Jest 30
    (mockPrisma.user.count as jest.Mock).mockImplementation(() => Promise.resolve(2));
    (mockPrisma.user.findMany as jest.Mock).mockImplementation(() =>
      Promise.resolve([
        {
          parentProfile: {
            id: 'p-1',
            fullName: 'Budi',
            nik: '1234567890123456',
            bsiAccountNumber: '7123456789',
            dummyBalance: BigInt(1_000_000_000),
            user: { id: 'u-1', email: 'budi@test.com', phone: null, isActive: true, createdAt: new Date() },
            familyLinks: [],
          },
        },
      ]),
    );

    const result = await listParents({ page: 1, limit: 20 });
    expect(result.meta.total).toBe(2);
    expect(result.parents).toHaveLength(1);
  });
});

// =============================================
describe('setParentStatus', () => {
  it('deactivates active parent and invalidates sessions', async () => {
    (mockPrisma.parentProfile.findUnique as jest.Mock).mockResolvedValue({
      userId: 'u-1',
      fullName: 'Budi',
      user: { isActive: true },
    });
    (mockPrisma.$transaction as jest.Mock).mockResolvedValue(undefined);

    const result = await setParentStatus('p-1', false, 'admin-1', 'fraud');
    expect(result.isActive).toBe(false);
    expect(result.message).toContain('dinonaktifkan');
  });

  it('throws NotFoundError when parent not found', async () => {
    (mockPrisma.parentProfile.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(setParentStatus('p-999', false, 'admin-1')).rejects.toThrow(NotFoundError);
  });

  it('throws AppError when status is already the same', async () => {
    (mockPrisma.parentProfile.findUnique as jest.Mock).mockResolvedValue({
      userId: 'u-1',
      fullName: 'Budi',
      user: { isActive: false },
    });
    await expect(setParentStatus('p-1', false, 'admin-1')).rejects.toThrow(AppError);
  });
});

// =============================================
describe('setChildStatus', () => {
  it('activates inactive child', async () => {
    (mockPrisma.childProfile.findUnique as jest.Mock).mockResolvedValue({
      userId: 'u-2',
      fullName: 'Aisha',
      isActive: false,
    });
    (mockPrisma.$transaction as jest.Mock).mockResolvedValue(undefined);

    const result = await setChildStatus('c-1', true, 'admin-1');
    expect(result.isActive).toBe(true);
    expect(result.message).toContain('diaktifkan');
  });

  it('throws NotFoundError when child not found', async () => {
    (mockPrisma.childProfile.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(setChildStatus('c-999', true, 'admin-1')).rejects.toThrow(NotFoundError);
  });

  it('throws AppError when status unchanged', async () => {
    (mockPrisma.childProfile.findUnique as jest.Mock).mockResolvedValue({
      userId: 'u-2',
      fullName: 'Aisha',
      isActive: true,
    });
    await expect(setChildStatus('c-1', true, 'admin-1')).rejects.toThrow(AppError);
  });
});

// =============================================
describe('adjustParentBalance', () => {
  it('throws NotFoundError when parent not found', async () => {
    (mockPrisma.parentProfile.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(
      adjustParentBalance('p-999', { amount: 50000, notes: 'test topup' }, 'admin-1'),
    ).rejects.toThrow(NotFoundError);
  });

  it('applies balance adjustment via transaction', async () => {
    (mockPrisma.parentProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'p-1',
      fullName: 'Budi',
      dummyBalance: BigInt(1_000_000_000),
      userId: 'u-1',
    });
    const ledgerEntry = { id: 'ledger-1', createdAt: new Date() };
    // Override $transaction inline — clearAllMocks() wipes the factory implementation
    (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => unknown) => {
      const tx = {
        parentProfile: { update: jest.fn().mockResolvedValue({}) },
        parentLedger: { create: jest.fn().mockResolvedValue(ledgerEntry) },
        auditLog: { create: jest.fn().mockResolvedValue({}) },
      };
      return cb(tx);
    });
    const result = await adjustParentBalance(
      'p-1',
      { amount: 50000, notes: 'topup test admin' },
      'admin-1',
    );
    expect(result).toHaveProperty('newBalance');
    expect(result).toHaveProperty('transactionId');
  });
});

// =============================================
describe('createVoucher', () => {
  it('creates a voucher with correct price in sen', async () => {
    (mockPrisma.voucherCatalog.create as jest.Mock).mockResolvedValue({
      id: 'v-1',
      name: 'Topup 50K',
      category: 'GAME_TOPUP',
      price: BigInt(5_000_000),
      faceValue: null,
      stock: 10,
      isActive: true,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createVoucher(
      {
        name: 'Topup 50K',
        provider: 'Garena',
        category: 'Games',
        voucherType: 'GAME_TOPUP',
        price: 50000,
        stock: 10,
      },
      'admin-1',
    );
    expect(result.price).toBe(50000); // converted back from sen
  });
});

// =============================================
describe('deleteVoucher', () => {
  it('throws NotFoundError when voucher not found', async () => {
    (mockPrisma.voucherCatalog.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(deleteVoucher('v-999', 'admin-1')).rejects.toThrow(NotFoundError);
  });

  it('soft-deactivates voucher when it has existing redemptions', async () => {
    (mockPrisma.voucherCatalog.findUnique as jest.Mock).mockResolvedValue({ id: 'v-1', name: 'Topup' });
    (mockPrisma.voucherRedemption.count as jest.Mock).mockResolvedValue(3);
    (mockPrisma.voucherCatalog.update as jest.Mock).mockResolvedValue({});
    const result = await deleteVoucher('v-1', 'admin-1');
    expect(result.deactivated).toBe(true);
    expect(result.deleted).toBe(false);
  });

  it('deletes voucher with no redemptions', async () => {
    (mockPrisma.voucherCatalog.findUnique as jest.Mock).mockResolvedValue({ id: 'v-1', name: 'Topup' });
    (mockPrisma.voucherRedemption.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.voucherCatalog.delete as jest.Mock).mockResolvedValue({ id: 'v-1' });

    const result = await deleteVoucher('v-1', 'admin-1');
    expect(result.message).toContain('berhasil');
  });
});

// =============================================
describe('getInfaqStats', () => {
  it('returns infaq statistics', async () => {
    (mockPrisma.infaqLog.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { amount: BigInt(500_000) }, _count: 5 })  // allTime
      .mockResolvedValueOnce({ _sum: { amount: BigInt(100_000) }, _count: 2 })  // thisMonth
      .mockResolvedValueOnce({ _sum: { amount: BigInt(50_000) }, _count: 1 });  // thisYear
    (mockPrisma.infaqInstitutionConfig.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getInfaqStats();
    expect(result).toHaveProperty('summary.allTime');
  });
});

// =============================================
describe('createInstitution', () => {
  it('throws AppError on duplicate code', async () => {
    (mockPrisma.infaqInstitutionConfig.findUnique as jest.Mock).mockResolvedValue({ id: 'inst-1', name: 'Yayasan A' });
    await expect(
      createInstitution({ code: 'YAYASAN_A', name: 'Yayasan A' }, 'admin-1'),
    ).rejects.toThrow(AppError);
  });

  it('creates institution when code is unique', async () => {
    (mockPrisma.infaqInstitutionConfig.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.infaqInstitutionConfig.create as jest.Mock).mockResolvedValue({
      id: 'inst-2',
      code: 'YAYASAN_B',
      name: 'Yayasan B',
      description: 'desc',
      isActive: true,
      logoUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createInstitution({ code: 'YAYASAN_B', name: 'Yayasan B', description: 'desc' }, 'admin-1');
    expect(result.name).toBe('Yayasan B');
  });
});

// =============================================
describe('setInstitutionStatus', () => {
  it('throws NotFoundError when institution not found', async () => {
    (mockPrisma.infaqInstitutionConfig.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(setInstitutionStatus('inst-999', true, 'admin-1')).rejects.toThrow(NotFoundError);
  });

  it('updates institution status regardless of current status', async () => {
    // Service always applies the update — no idempotency guard
    (mockPrisma.infaqInstitutionConfig.findUnique as jest.Mock).mockResolvedValue({
      id: 'inst-1',
      name: 'Yayasan A',
      isActive: true,
    });
    (mockPrisma.infaqInstitutionConfig.update as jest.Mock).mockResolvedValue({});

    const result = await setInstitutionStatus('inst-1', true, 'admin-1');
    expect(result.isActive).toBe(true);
    expect(result.message).toContain('diaktifkan');
  });

  it('updates institution status', async () => {
    (mockPrisma.infaqInstitutionConfig.findUnique as jest.Mock).mockResolvedValue({
      id: 'inst-1',
      name: 'Yayasan A',
      isActive: true,
    });
    (mockPrisma.infaqInstitutionConfig.update as jest.Mock).mockResolvedValue({
      id: 'inst-1',
      name: 'Yayasan A',
      isActive: false,
    });

    const result = await setInstitutionStatus('inst-1', false, 'admin-1');
    expect(result.isActive).toBe(false);
  });
});
