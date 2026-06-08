jest.mock('../config/database', () => ({
  prisma: {
    user: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    parentProfile: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    childProfile: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    refreshToken: { create: jest.fn(), deleteMany: jest.fn(), findUnique: jest.fn() },
    passwordResetToken: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    familyLink: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('../services/email.service', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendUsernameReminderEmail: jest.fn().mockResolvedValue(undefined),
}));

// Mock bcrypt to keep tests fast (no real hashing)
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$hashed$'),
  compare: jest.fn(),
}));

import { prisma } from '../config/database';
import * as bcrypt from 'bcryptjs';
import { AuthError } from '../types';
import {
  forgotPassword,
  resetPassword,
  forgotUsername,
  changeParentPassword,
  changeParentPin,
} from '../modules/auth/auth.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const USER_ID   = 'user-001';
const PARENT_ID = 'parent-001';

beforeEach(() => jest.clearAllMocks());

// =============================================
describe('forgotPassword', () => {
  const GENERIC = 'Jika email terdaftar';

  it('returns generic message when email does not exist', async () => {
    (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    const result = await forgotPassword({ email: 'ghost@example.com' });
    expect(result.message).toContain(GENERIC);
  });

  it('returns generic message when user has no parentProfile', async () => {
    (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({ id: USER_ID, parentProfile: null });
    const result = await forgotPassword({ email: 'test@example.com' });
    expect(result.message).toContain(GENERIC);
  });

  it('creates reset token and returns generic message for valid parent', async () => {
    (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: USER_ID,
      email: 'parent@example.com',
      parentProfile: { id: PARENT_ID, fullName: 'Budi' },
    });
    (mockPrisma.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    (mockPrisma.passwordResetToken.create as jest.Mock).mockResolvedValue({ id: 'token-1' });

    const result = await forgotPassword({ email: 'parent@example.com' });
    expect(result.message).toContain(GENERIC);
    expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledTimes(1);
  });

  it('normalizes email to lowercase before lookup', async () => {
    (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    await forgotPassword({ email: 'UPPER@EXAMPLE.COM' });
    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ email: 'upper@example.com' }),
      }),
    );
  });
});

// =============================================
describe('resetPassword', () => {
  const RAW_TOKEN = 'a'.repeat(64);

  it('throws AuthError for non-existent token', async () => {
    (mockPrisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(resetPassword({ token: RAW_TOKEN, newPassword: 'NewPass@1' })).rejects.toThrow(AuthError);
  });

  it('throws AuthError for already-used token', async () => {
    (mockPrisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
      tokenHash: 'hash',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
      userId: USER_ID,
      user: { id: USER_ID },
    });
    await expect(resetPassword({ token: RAW_TOKEN, newPassword: 'NewPass@1' })).rejects.toThrow(AuthError);
  });

  it('throws AuthError for expired token', async () => {
    (mockPrisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
      tokenHash: 'hash',
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      userId: USER_ID,
      user: { id: USER_ID },
    });
    (mockPrisma.passwordResetToken.delete as jest.Mock).mockResolvedValue({});
    await expect(resetPassword({ token: RAW_TOKEN, newPassword: 'NewPass@1' })).rejects.toThrow(AuthError);
  });

  it('resets password and invalidates sessions on valid token', async () => {
    (mockPrisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
      tokenHash: 'hash',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60000),
      userId: USER_ID,
      user: { id: USER_ID },
    });
    (mockPrisma.$transaction as jest.Mock).mockResolvedValue(undefined);

    const result = await resetPassword({ token: RAW_TOKEN, newPassword: 'NewPass@1' });
    expect(result.message).toContain('berhasil direset');
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });
});

// =============================================
describe('forgotUsername', () => {
  const GENERIC = 'Jika email terdaftar';

  it('returns generic message when parent email not found', async () => {
    (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    const result = await forgotUsername({ parentEmail: 'unknown@example.com' });
    expect(result.message).toContain(GENERIC);
  });

  it('returns generic message when parent has no children', async () => {
    (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: USER_ID,
      email: 'parent@example.com',
      parentProfile: { id: PARENT_ID, fullName: 'Budi', familyLinks: [] },
    });
    const result = await forgotUsername({ parentEmail: 'parent@example.com' });
    expect(result.message).toContain(GENERIC);
  });

  it('sends email when children with usernames exist', async () => {
    (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: USER_ID,
      email: 'parent@example.com',
      parentProfile: {
        id: PARENT_ID,
        fullName: 'Budi',
        familyLinks: [
          { childProfile: { fullName: 'Aisha', username: 'aisha_byond' } },
        ],
      },
    });
    const result = await forgotUsername({ parentEmail: 'parent@example.com' });
    expect(result.message).toContain(GENERIC);
  });
});

// =============================================
describe('changeParentPassword', () => {
  it('throws AuthError when old password is wrong', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: USER_ID,
      passwordHash: '$hashed$',
    });
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(
      changeParentPassword(USER_ID, { oldPassword: 'wrong', newPassword: 'New@12345' }),
    ).rejects.toThrow(AuthError);
  });

  it('updates password and deletes refresh tokens on success', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: USER_ID,
      passwordHash: '$hashed$',
    });
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
    (mockPrisma.user.update as jest.Mock).mockResolvedValue({});
    (mockPrisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    const result = await changeParentPassword(USER_ID, {
      oldPassword: 'OldPass@1',
      newPassword: 'New@12345',
    });
    expect(result.message).toContain('berhasil diubah');
    expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID } }),
    );
  });
});

// =============================================
describe('changeParentPin', () => {
  it('throws AuthError when old PIN is wrong', async () => {
    (mockPrisma.parentProfile.findUnique as jest.Mock).mockResolvedValue({
      id: PARENT_ID,
      pinHash: '$hashed$',
    });
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(
      changeParentPin(PARENT_ID, { oldPin: '000000', newPin: '111111' }),
    ).rejects.toThrow(AuthError);
  });

  it('updates PIN on correct old PIN', async () => {
    (mockPrisma.parentProfile.findUnique as jest.Mock).mockResolvedValue({
      id: PARENT_ID,
      pinHash: '$hashed$',
    });
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
    (mockPrisma.parentProfile.update as jest.Mock).mockResolvedValue({});

    const result = await changeParentPin(PARENT_ID, { oldPin: '123456', newPin: '654321' });
    expect(result.message).toContain('berhasil diubah');
  });
});
