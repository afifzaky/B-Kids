// Mock database and role middleware before importing the service
jest.mock('../config/database', () => ({
  prisma: {
    chore: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    choreSubmission: {
      count: jest.fn(),
    },
    parentProfile: { findUnique: jest.fn() },
    childAccount: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('../middleware/role', () => ({
  validateFamilyAccess: jest.fn(),
}));

import { prisma } from '../config/database';
import { validateFamilyAccess } from '../middleware/role';
import {
  listChores,
  createChore,
  deleteChore,
  submitChore,
  approveChore,
} from '../modules/chores/chores.service';
import { AppError, ForbiddenError, NotFoundError } from '../types';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockValidateFamily = validateFamilyAccess as jest.Mock;

const PARENT_ID  = 'parent-001';
const CHILD_ID   = 'child-001';
const CHORE_ID   = 'chore-001';

const baseChore = {
  id: CHORE_ID,
  createdById: PARENT_ID,
  assignedToId: CHILD_ID,
  title: 'Cuci Piring',
  description: null,
  category: 'HOUSEHOLD',
  rewardAmount: BigInt(5000),
  deadline: new Date('2026-12-31'),
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

// =============================================
describe('listChores', () => {
  it('returns chores for PARENT role', async () => {
    (mockPrisma.chore.findMany as jest.Mock).mockResolvedValue([
      { ...baseChore, submissions: [] },
    ]);
    const result = await listChores(PARENT_ID, 'PARENT');
    expect(result).toHaveLength(1);
    expect(result[0].rewardAmount).toBe(50); // sen → Rp
  });

  it('returns chores for CHILD role', async () => {
    (mockPrisma.chore.findMany as jest.Mock).mockResolvedValue([]);
    const result = await listChores(CHILD_ID, 'CHILD');
    expect(result).toEqual([]);
  });
});

// =============================================
describe('createChore', () => {
  const input = {
    assignedToId: CHILD_ID,
    title: 'Bersih Kamar',
    description: 'Sapu dan pel kamar',
    category: 'Pekerjaan Rumah' as const,
    rewardAmount: 20000,
    deadline: '2026-12-31T00:00:00.000Z',
  };

  it('creates a chore when family access is valid', async () => {
    mockValidateFamily.mockResolvedValue(true);
    (mockPrisma.chore.create as jest.Mock).mockResolvedValue({
      ...baseChore,
      rewardAmount: BigInt(2_000_000),
    });
    const result = await createChore(PARENT_ID, input);
    expect(result.rewardAmount).toBe(20000);
  });

  it('throws ForbiddenError when child is not in family', async () => {
    mockValidateFamily.mockResolvedValue(false);
    await expect(createChore(PARENT_ID, input)).rejects.toThrow(ForbiddenError);
  });
});

// =============================================
describe('deleteChore', () => {
  it('cancels an ACTIVE chore', async () => {
    (mockPrisma.chore.findUnique as jest.Mock).mockResolvedValue({ ...baseChore, status: 'ACTIVE' });
    (mockPrisma.chore.update as jest.Mock).mockResolvedValue({ ...baseChore, status: 'CANCELLED' });
    const result = await deleteChore(CHORE_ID, PARENT_ID);
    expect(result.message).toContain('berhasil dibatalkan');
  });

  it('throws NotFoundError when chore does not exist', async () => {
    (mockPrisma.chore.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(deleteChore(CHORE_ID, PARENT_ID)).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when parent does not own the chore', async () => {
    (mockPrisma.chore.findUnique as jest.Mock).mockResolvedValue({
      ...baseChore,
      createdById: 'other-parent',
    });
    await expect(deleteChore(CHORE_ID, PARENT_ID)).rejects.toThrow(ForbiddenError);
  });

  it('throws AppError when chore is already in PENDING_REVIEW', async () => {
    (mockPrisma.chore.findUnique as jest.Mock).mockResolvedValue({
      ...baseChore,
      status: 'PENDING_REVIEW',
    });
    await expect(deleteChore(CHORE_ID, PARENT_ID)).rejects.toThrow(AppError);
  });
});

// =============================================
describe('submitChore', () => {
  const submitInput = { mediaUrl: 'https://example.com/bukti.jpg', notes: 'Sudah selesai' };

  it('throws ForbiddenError when child is not assigned to chore', async () => {
    (mockPrisma.chore.findUnique as jest.Mock).mockResolvedValue({
      ...baseChore,
      assignedToId: 'other-child',
    });
    await expect(submitChore(CHORE_ID, CHILD_ID, submitInput)).rejects.toThrow(ForbiddenError);
  });

  it('throws AppError when chore is not in submittable status', async () => {
    (mockPrisma.chore.findUnique as jest.Mock).mockResolvedValue({
      ...baseChore,
      assignedToId: CHILD_ID,
      status: 'APPROVED',
    });
    await expect(submitChore(CHORE_ID, CHILD_ID, submitInput)).rejects.toThrow(AppError);
  });

  it('throws AppError when max submissions reached', async () => {
    (mockPrisma.chore.findUnique as jest.Mock).mockResolvedValue({
      ...baseChore,
      assignedToId: CHILD_ID,
      status: 'ACTIVE',
    });
    (mockPrisma.choreSubmission.count as jest.Mock).mockResolvedValue(2);
    await expect(submitChore(CHORE_ID, CHILD_ID, submitInput)).rejects.toThrow(AppError);
  });

  it('submits chore successfully', async () => {
    (mockPrisma.chore.findUnique as jest.Mock).mockResolvedValue({
      ...baseChore,
      assignedToId: CHILD_ID,
      status: 'ACTIVE',
    });
    (mockPrisma.choreSubmission.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.$transaction as jest.Mock).mockResolvedValue(undefined);
    const result = await submitChore(CHORE_ID, CHILD_ID, submitInput);
    expect(result.message).toContain('berhasil dikirim');
  });
});

// =============================================
describe('approveChore', () => {
  it('throws AppError when chore is not PENDING_REVIEW', async () => {
    (mockPrisma.chore.findUnique as jest.Mock).mockResolvedValue({
      ...baseChore,
      status: 'ACTIVE',
    });
    await expect(approveChore(CHORE_ID, PARENT_ID, PARENT_ID)).rejects.toThrow(AppError);
  });

  it('throws AppError when parent balance is insufficient', async () => {
    (mockPrisma.chore.findUnique as jest.Mock).mockResolvedValue({
      ...baseChore,
      status: 'PENDING_REVIEW',
      rewardAmount: BigInt(100_000_000),
    });
    (mockPrisma.parentProfile.findUnique as jest.Mock).mockResolvedValue({
      id: PARENT_ID,
      dummyBalance: BigInt(100),
    });
    (mockPrisma.childAccount.findUnique as jest.Mock).mockResolvedValue({ id: 'acc-1', balance: BigInt(0) });
    await expect(approveChore(CHORE_ID, PARENT_ID, PARENT_ID)).rejects.toThrow(AppError);
  });
});
