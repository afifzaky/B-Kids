import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import {
  AppError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  JwtPayload,
} from '../../types';
import * as EmailService from '../../services/email.service';
import type {
  RegisterParentInput,
  LoginParentInput,
  CreateChildInput,
  LoginChildInput,
  ActivateChildDeviceInput,
  LoginAdminInput,
  UpdateParentProfileInput,
  ChangeEmailInput,
  ChangePasswordInput,
  ChangePinInput,
  ChangeChildPasswordInput,
  ChangeChildPinInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ForgotUsernameInput,
  ForgotChildPasswordInput,
} from './auth.validator';

// =============================================
// Internal helpers
// =============================================

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseDurationMs(duration: string): number {
  const match = duration.match(/^(\d+)(ms|s|m|h|d)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
  const val = parseInt(match[1]);
  const units: Record<string, number> = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return val * (units[match[2]] ?? 1_000);
}

async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN));

  await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });

  // Bersihkan token lama yang sudah expired untuk user ini
  await prisma.refreshToken.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });
}

function generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>) {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
  const refreshToken = jwt.sign(
    { sub: payload.sub },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );
  return { accessToken, refreshToken };
}

function generateDummyAccountNumber(): string {
  // crypto.randomInt is a CSPRNG (Node.js ≥14.10) — do not use Math.random()
  // which is a non-cryptographic PRNG and predictable.
  return '7' + crypto.randomInt(1_000_000_000, 10_000_000_000).toString();
}

// =============================================
// Parent: Register
// =============================================

export async function registerParent(input: RegisterParentInput) {
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { phone: input.phone }] },
  });
  if (existingUser) {
    throw new AppError('Email atau nomor HP sudah terdaftar', 409, 'DUPLICATE_USER');
  }

  const existingNIK = await prisma.parentProfile.findFirst({ where: { nik: input.nik } });
  if (existingNIK) {
    throw new AppError('NIK sudah terdaftar', 409, 'DUPLICATE_NIK');
  }

  const existingBSI = await prisma.parentProfile.findFirst({
    where: { bsiAccountNumber: input.bsiAccountNumber },
  });
  if (existingBSI) {
    throw new AppError(
      'Nomor rekening BSI sudah terdaftar dalam sistem',
      409,
      'DUPLICATE_BSI_ACCOUNT',
    );
  }

  const OPENING_BALANCE = BigInt(1_000_000_000); // Rp 10.000.000 dalam sen

  const [passwordHash, pinHash] = await Promise.all([
    bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS),
    bcrypt.hash(input.savingsPin, env.BCRYPT_SALT_ROUNDS),
  ]);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: 'PARENT',
      },
    });

    const parentProfile = await tx.parentProfile.create({
      data: {
        userId: user.id,
        fullName: input.fullName,
        nik: input.nik,
        dateOfBirth: new Date(input.dateOfBirth),
        bsiAccountNumber: input.bsiAccountNumber,
        pinHash,
        dummyBalance: OPENING_BALANCE,
      },
    });

    return { user, parentProfile };
  });

  const tokens = generateTokens({
    sub: result.user.id,
    role: 'PARENT',
    profileId: result.parentProfile.id,
  });

  await storeRefreshToken(result.user.id, tokens.refreshToken);

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
    },
    profile: {
      id: result.parentProfile.id,
      fullName: result.parentProfile.fullName,
    },
    bsiAccount: {
      accountNumber: input.bsiAccountNumber,
      balance: Number(OPENING_BALANCE) / 100,
      currency: 'IDR',
      status: 'DEMO',
      note: 'Saldo awal Rp 10.000.000 (simulasi). Produksi: terhubung ke BSI Open API.',
    },
    ...tokens,
  };
}

// =============================================
// Brute-force helpers
// =============================================

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 menit

async function checkAndHandleLock(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true, loginAttempts: true },
  });
  if (!user) return;
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const waitSec = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
    throw new AppError(
      `Akun dikunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${waitSec} detik.`,
      423,
      'ACCOUNT_LOCKED',
    );
  }
}

async function recordFailedAttempt(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loginAttempts: true },
  });
  if (!user) return;

  const newAttempts = user.loginAttempts + 1;
  const shouldLock = newAttempts >= MAX_ATTEMPTS;

  await prisma.user.update({
    where: { id: userId },
    data: {
      loginAttempts: newAttempts,
      lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : undefined,
    },
  });
}

async function resetLoginAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { loginAttempts: 0, lockedUntil: null },
  });
}

// =============================================
// Parent: Login (Email + Password → PIN Tabungan)
// =============================================

export async function loginParent(input: LoginParentInput) {
  const user = await prisma.user.findFirst({
    where: { email: input.email, role: 'PARENT', isActive: true },
    include: { parentProfile: true },
  });

  if (!user || !user.parentProfile) {
    await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS); // anti timing-attack
    throw new AuthError('Email atau password salah');
  }

  await checkAndHandleLock(user.id);

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    await recordFailedAttempt(user.id);
    const remaining = MAX_ATTEMPTS - (user.loginAttempts + 1);
    throw new AuthError(
      remaining > 0
        ? `Email atau password salah. ${remaining} percobaan tersisa sebelum akun dikunci.`
        : 'Email atau password salah. Akun dikunci 15 menit.',
    );
  }

  if (user.parentProfile.pinHash && user.parentProfile.pinHash !== '') {
    const isPinValid = await bcrypt.compare(input.savingsPin, user.parentProfile.pinHash);
    if (!isPinValid) {
      await recordFailedAttempt(user.id);
      throw new AuthError('PIN Tabungan salah');
    }
  }

  await resetLoginAttempts(user.id);

  const tokens = generateTokens({
    sub: user.id,
    role: 'PARENT',
    profileId: user.parentProfile.id,
  });

  await storeRefreshToken(user.id, tokens.refreshToken);

  return {
    user: { id: user.id, email: user.email, role: user.role },
    profile: {
      id: user.parentProfile.id,
      fullName: user.parentProfile.fullName,
    },
    ...tokens,
  };
}

// =============================================
// Parent: Buat Akun Anak (butuh konfirmasi PIN)
// =============================================

export async function createChildProfile(
  parentProfileId: string,
  input: CreateChildInput,
) {
  // 1. Validasi PIN orangtua sebelum buat akun anak
  const parentProfile = await prisma.parentProfile.findUnique({
    where: { id: parentProfileId },
  });
  if (!parentProfile) throw new NotFoundError('Profil orang tua');

  if (parentProfile.pinHash && parentProfile.pinHash !== '') {
    const isPinValid = await bcrypt.compare(input.parentPin, parentProfile.pinHash);
    if (!isPinValid) {
      throw new AuthError('PIN Tabungan orang tua tidak valid. Pembuatan akun anak dibatalkan.');
    }
  }

  // 2. Cek batas anak
  const existingChildren = await prisma.familyLink.count({ where: { parentProfileId } });
  if (existingChildren >= 5) {
    throw new AppError('Maksimal 5 anak per akun', 422, 'MAX_CHILDREN_REACHED');
  }

  // 3. Cek keunikan username
  const existingUsername = await prisma.childProfile.findFirst({
    where: { username: input.username },
  });
  if (existingUsername) {
    throw new AppError('Username sudah digunakan', 409, 'DUPLICATE_USERNAME');
  }

  const [passwordHash, pinHash] = await Promise.all([
    bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS),
    bcrypt.hash(input.pin, env.BCRYPT_SALT_ROUNDS),
  ]);
  const childAccountNumber = generateDummyAccountNumber();

  const result = await prisma.$transaction(async (tx) => {
    const childUser = await tx.user.create({
      data: {
        email: `child-${uuidv4()}@byond.internal`,
        passwordHash, // password asli anak
        role: 'CHILD',
      },
    });

    const childProfile = await tx.childProfile.create({
      data: {
        userId: childUser.id,
        fullName: input.fullName,
        dateOfBirth: new Date(input.dateOfBirth),
        username: input.username,
        pinHash,
        createdByParentId: parentProfileId,
        childAccountNumber,
      },
    });

    // Tabungan Utama anak — saldo awal Rp 0
    // Anak tidak langsung punya saldo; ortu perlu transfer melalui banking
    const account = await tx.childAccount.create({
      data: {
        childProfileId: childProfile.id,
        balance: BigInt(0),
        currency: 'IDR',
      },
    });

    await tx.familyLink.create({
      data: { parentProfileId, childProfileId: childProfile.id },
    });

    return { childUser, childProfile, account };
  });

  return {
    id: result.childProfile.id,
    fullName: result.childProfile.fullName,
    username: result.childProfile.username,
    dateOfBirth: result.childProfile.dateOfBirth,
    childAccountNumber,
    tabunganUtama: {
      id: result.account.id,
      balance: 0,
      currency: 'IDR',
      note: 'Saldo Rp 0. Transfer melalui Banking → Transfer ke Anak untuk mengisi saldo.',
    },
  };
}

// =============================================
// Parent: Aktifkan Perangkat Anak (opsional)
// =============================================

export async function activateChildDevice(
  parentProfileId: string,
  input: ActivateChildDeviceInput,
) {
  const link = await prisma.familyLink.findFirst({
    where: { parentProfileId, childProfileId: input.childProfileId },
  });
  if (!link) {
    throw new ForbiddenError('Anak tidak terdaftar dalam keluarga ini');
  }

  await prisma.childProfile.update({
    where: { id: input.childProfileId },
    data: { deviceId: input.deviceId },
  });

  return { message: 'Perangkat berhasil terdaftar' };
}

// =============================================
// Child: Login (Username + Password + PIN)
// =============================================

export async function loginChild(input: LoginChildInput) {
  const childProfile = await prisma.childProfile.findFirst({
    where: { username: input.username, isActive: true },
    include: { user: true },
  });

  if (!childProfile) {
    await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS); // anti timing-attack
    throw new AuthError('Username, password, atau PIN salah');
  }

  await checkAndHandleLock(childProfile.user.id);

  const [isPasswordValid, isPinValid] = await Promise.all([
    bcrypt.compare(input.password, childProfile.user.passwordHash),
    bcrypt.compare(input.pin, childProfile.pinHash),
  ]);

  if (!isPasswordValid || !isPinValid) {
    await recordFailedAttempt(childProfile.user.id);
    const remaining = MAX_ATTEMPTS - (childProfile.user.loginAttempts + 1);
    throw new AuthError(
      remaining > 0
        ? `Username, password, atau PIN salah. ${remaining} percobaan tersisa.`
        : 'Terlalu banyak percobaan. Akun dikunci 15 menit.',
    );
  }

  await resetLoginAttempts(childProfile.user.id);

  const tokens = generateTokens({
    sub: childProfile.user.id,
    role: 'CHILD',
    profileId: childProfile.id,
  });

  await storeRefreshToken(childProfile.user.id, tokens.refreshToken);

  return {
    profile: {
      id: childProfile.id,
      fullName: childProfile.fullName,
      username: childProfile.username,
    },
    ...tokens,
  };
}

// =============================================
// Admin: Login (email + password — tanpa savingsPin)
// =============================================

export async function loginAdmin(input: LoginAdminInput) {
  const user = await prisma.user.findFirst({
    where: { email: input.email, role: 'SUPER_ADMIN', isActive: true },
  });

  if (!user) {
    await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS); // anti timing-attack
    throw new AuthError('Email atau password salah');
  }

  await checkAndHandleLock(user.id);

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    await recordFailedAttempt(user.id);
    throw new AuthError('Email atau password salah');
  }

  await resetLoginAttempts(user.id);

  // Admin tidak memiliki profile — profileId diset kosong
  const tokens = generateTokens({ sub: user.id, role: 'SUPER_ADMIN', profileId: '' });
  await storeRefreshToken(user.id, tokens.refreshToken);

  return {
    user: { id: user.id, email: user.email, role: user.role },
    ...tokens,
  };
}

// =============================================
// Logout — Invalidasi refresh token di DB
// =============================================

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);

  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
    await prisma.refreshToken.deleteMany({
      where: { userId: payload.sub, tokenHash },
    });
  } catch {
    // Token expired atau invalid — hapus dari DB jika ada (idempotent)
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }

  return { message: 'Logout berhasil. Sampai jumpa!' };
}

// =============================================
// Refresh Token — Rotasi token + cek DB
// =============================================

export async function refreshAccessToken(refreshToken: string) {
  let payload: { sub: string };

  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
  } catch {
    throw new AuthError('Refresh token tidak valid atau sudah kadaluarsa');
  }

  // Cek apakah token masih ada di DB (belum di-logout)
  const tokenHash = hashToken(refreshToken);
  const storedToken = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!storedToken) {
    throw new AuthError('Sesi tidak ditemukan. Silakan login ulang');
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { tokenHash } });
    throw new AuthError('Sesi telah berakhir. Silakan login ulang');
  }

  // Cek inaktivitas: jika tidak ada aktivitas selama durasi access token (8 menit),
  // tolak refresh dan paksa login ulang — mencegah sesi tetap hidup tanpa interaksi
  const inactiveMs = Date.now() - storedToken.lastActiveAt.getTime();
  const maxInactiveMs = parseDurationMs(env.JWT_EXPIRES_IN);
  if (inactiveMs > maxInactiveMs) {
    await prisma.refreshToken.delete({ where: { tokenHash } });
    throw new AuthError('Sesi berakhir karena tidak aktif. Silakan login ulang');
  }

  const user = await prisma.user.findFirst({
    where: { id: payload.sub, isActive: true },
    include: { parentProfile: true, childProfile: true },
  });
  if (!user) throw new AuthError('User tidak ditemukan');

  const profileId = user.parentProfile?.id ?? user.childProfile?.id ?? '';
  const tokens = generateTokens({ sub: user.id, role: user.role, profileId });

  // Rotasi token: hapus lama → buat baru (mencegah token reuse)
  const newHash = hashToken(tokens.refreshToken);
  const expiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN));

  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.delete({ where: { tokenHash } });
    await tx.refreshToken.create({ data: { userId: user.id, tokenHash: newHash, expiresAt } });
  });

  return tokens;
}

// =============================================
// Profile Management — Parent: Update Profil
// =============================================

export async function updateParentProfile(
  parentProfileId: string,
  input: UpdateParentProfileInput,
) {
  const updated = await prisma.parentProfile.update({
    where: { id: parentProfileId },
    data: {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    },
    select: { id: true, fullName: true, avatarUrl: true },
  });
  return updated;
}

// =============================================
// Profile Management — Parent: Ganti Email
// =============================================

export async function changeParentEmail(
  userId: string,
  parentProfileId: string,
  input: ChangeEmailInput,
) {
  const parentProfile = await prisma.parentProfile.findUnique({ where: { id: parentProfileId } });
  if (!parentProfile) throw new NotFoundError('Profil orang tua');

  if (!parentProfile.pinHash || parentProfile.pinHash === '') {
    throw new AppError('PIN belum diset. Hubungi dukungan.', 422, 'PIN_NOT_SET');
  }
  const isPinValid = await bcrypt.compare(input.savingsPin, parentProfile.pinHash);
  if (!isPinValid) throw new AuthError('PIN Tabungan salah');

  const existing = await prisma.user.findFirst({ where: { email: input.newEmail } });
  if (existing) throw new AppError('Email sudah digunakan akun lain', 409, 'DUPLICATE_EMAIL');

  await prisma.user.update({
    where: { id: userId },
    data: { email: input.newEmail },
  });

  return { message: 'Email berhasil diubah', newEmail: input.newEmail };
}

// =============================================
// Profile Management — Parent: Ganti Password
// =============================================

export async function changeParentPassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  const isOldPasswordValid = await bcrypt.compare(input.oldPassword, user.passwordHash);
  if (!isOldPasswordValid) throw new AuthError('Password lama salah');

  const newPasswordHash = await bcrypt.hash(input.newPassword, env.BCRYPT_SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newPasswordHash } });

  // Invalidasi semua refresh token — paksa login ulang di semua perangkat
  await prisma.refreshToken.deleteMany({ where: { userId } });

  return { message: 'Password berhasil diubah. Silakan login ulang.' };
}

// =============================================
// Profile Management — Parent: Ganti PIN Tabungan
// =============================================

export async function changeParentPin(parentProfileId: string, input: ChangePinInput) {
  const parentProfile = await prisma.parentProfile.findUnique({ where: { id: parentProfileId } });
  if (!parentProfile) throw new NotFoundError('Profil orang tua');

  if (!parentProfile.pinHash || parentProfile.pinHash === '') {
    throw new AppError('PIN belum diset. Hubungi dukungan.', 422, 'PIN_NOT_SET');
  }
  const isOldPinValid = await bcrypt.compare(input.oldPin, parentProfile.pinHash);
  if (!isOldPinValid) throw new AuthError('PIN lama salah');

  const newPinHash = await bcrypt.hash(input.newPin, env.BCRYPT_SALT_ROUNDS);
  await prisma.parentProfile.update({
    where: { id: parentProfileId },
    data: { pinHash: newPinHash },
  });

  return { message: 'PIN Tabungan berhasil diubah' };
}

// =============================================
// Child Account Mgmt — by Parent: Ganti Password Anak
// =============================================

export async function changeChildPasswordByParent(
  parentProfileId: string,
  childProfileId: string,
  input: ChangeChildPasswordInput,
) {
  // Validasi: anak harus terdaftar dalam keluarga ini
  const link = await prisma.familyLink.findFirst({ where: { parentProfileId, childProfileId } });
  if (!link) throw new ForbiddenError('Anak tidak terdaftar dalam keluarga ini');

  // Verifikasi PIN orang tua
  const parentProfile = await prisma.parentProfile.findUnique({ where: { id: parentProfileId } });
  if (!parentProfile) throw new NotFoundError('Profil orang tua');

  const isPinValid = await bcrypt.compare(input.parentPin, parentProfile.pinHash);
  if (!isPinValid) throw new AuthError('PIN Tabungan orang tua salah');

  // Update password anak
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childProfileId },
    select: { userId: true, fullName: true },
  });
  if (!childProfile) throw new NotFoundError('Profil anak');

  const newPasswordHash = await bcrypt.hash(input.newPassword, env.BCRYPT_SALT_ROUNDS);
  await prisma.user.update({ where: { id: childProfile.userId }, data: { passwordHash: newPasswordHash } });

  // Invalidasi semua sesi anak
  await prisma.refreshToken.deleteMany({ where: { userId: childProfile.userId } });

  return { message: `Password ${childProfile.fullName} berhasil diubah` };
}

// =============================================
// Child Account Mgmt — by Parent: Ganti PIN Anak
// =============================================

export async function changeChildPinByParent(
  parentProfileId: string,
  childProfileId: string,
  input: ChangeChildPinInput,
) {
  const link = await prisma.familyLink.findFirst({ where: { parentProfileId, childProfileId } });
  if (!link) throw new ForbiddenError('Anak tidak terdaftar dalam keluarga ini');

  const parentProfile = await prisma.parentProfile.findUnique({ where: { id: parentProfileId } });
  if (!parentProfile) throw new NotFoundError('Profil orang tua');

  const isPinValid = await bcrypt.compare(input.parentPin, parentProfile.pinHash);
  if (!isPinValid) throw new AuthError('PIN Tabungan orang tua salah');

  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childProfileId },
    select: { fullName: true },
  });
  if (!childProfile) throw new NotFoundError('Profil anak');

  const newPinHash = await bcrypt.hash(input.newPin, env.BCRYPT_SALT_ROUNDS);
  await prisma.childProfile.update({ where: { id: childProfileId }, data: { pinHash: newPinHash } });

  return { message: `PIN ${childProfile.fullName} berhasil diubah` };
}

// =============================================
// Forgot Password — kirim reset link ke email parent
//
// Security:
// • Selalu return pesan yang sama (anti-enumeration — jangan bocorkan apakah email ada)
// • Token = crypto.randomBytes(32) → 256-bit entropy
// • DB hanya simpan SHA-256(token), bukan raw token
// • Hapus token lama sebelum buat yang baru (satu token aktif per user)
// • Dibatasi hanya untuk role PARENT
// =============================================

export async function forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
  const GENERIC_MESSAGE = 'Jika email terdaftar, link reset password telah dikirim ke inbox kamu.';

  const user = await prisma.user.findFirst({
    where: { email: input.email.toLowerCase(), role: 'PARENT', isActive: true },
    include: { parentProfile: true },
  });

  // Selalu return pesan sama — tidak bocorkan apakah email ada
  if (!user || !user.parentProfile) return { message: GENERIC_MESSAGE };

  // Hapus semua reset token lama milik user ini (satu token aktif per user)
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  // Buat raw token (256-bit), simpan hash-nya
  const rawToken  = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_MS);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}`;

  // Fire-and-forget — jangan await agar respons tidak terlambat jika SMTP lambat
  // Error email tidak boleh membocorkan info ke client
  EmailService.sendPasswordResetEmail(user.email, user.parentProfile.fullName, resetUrl).catch(
    (err: unknown) => console.error('[forgotPassword] Email failed:', err instanceof Error ? err.message : String(err)),
  );

  return { message: GENERIC_MESSAGE };
}

// =============================================
// Reset Password — terapkan password baru dengan token
//
// Security:
// • Validasi token, expiry, dan usedAt (single-use)
// • Hash password baru dengan bcrypt
// • Tandai token sebagai terpakai (usedAt)
// • Invalidasi SEMUA sesi (hapus semua refresh token user)
// =============================================

export async function resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
  const tokenHash = hashToken(input.token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken) {
    throw new AuthError('Token tidak valid atau sudah kadaluarsa');
  }

  if (resetToken.usedAt !== null) {
    throw new AuthError('Token ini sudah digunakan. Minta reset password baru jika diperlukan.');
  }

  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { tokenHash } });
    throw new AuthError('Token sudah kadaluarsa. Silakan minta reset password baru.');
  }

  const newPasswordHash = await bcrypt.hash(input.newPassword, env.BCRYPT_SALT_ROUNDS);

  // Semua perubahan dalam satu transaksi
  await prisma.$transaction([
    // 1. Update password
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: newPasswordHash, loginAttempts: 0, lockedUntil: null },
    }),
    // 2. Tandai token sebagai terpakai
    prisma.passwordResetToken.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    }),
    // 3. Invalidasi semua sesi aktif (force logout dari semua device)
    prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } }),
  ]);

  return { message: 'Password berhasil direset. Silakan login dengan password baru.' };
}

// =============================================
// Forgot Username — kirim username anak ke email parent
//
// Security:
// • Selalu return pesan sama (anti-enumeration)
// • Hanya kirim ke email parent yang terdaftar — bukan arbitrary email
// =============================================

export async function forgotUsername(input: ForgotUsernameInput): Promise<{ message: string }> {
  const GENERIC_MESSAGE = 'Jika email terdaftar, informasi username anak telah dikirim ke inbox kamu.';

  const parent = await prisma.user.findFirst({
    where: { email: input.parentEmail.toLowerCase(), role: 'PARENT', isActive: true },
    include: {
      parentProfile: {
        include: {
          familyLinks: {
            include: {
              childProfile: { select: { fullName: true, username: true } },
            },
          },
        },
      },
    },
  });

  if (!parent?.parentProfile) return { message: GENERIC_MESSAGE };

  const children = parent.parentProfile.familyLinks
    .map(fl => fl.childProfile)
    .filter((c): c is { fullName: string; username: string | null } => c !== null)
    .filter(c => c.username !== null)
    .map(c => ({ fullName: c.fullName, username: c.username as string }));

  if (children.length === 0) return { message: GENERIC_MESSAGE };

  EmailService.sendUsernameReminderEmail(parent.email, parent.parentProfile.fullName, children).catch(
    (err: unknown) => console.error('[forgotUsername] Email failed:', err instanceof Error ? err.message : String(err)),
  );

  return { message: GENERIC_MESSAGE };
}

// =============================================
// POST /api/auth/forgot-child-password
// Kirim link reset password anak ke email parent terkait.
// Security:
// • Selalu return pesan sama (anti-enumeration)
// • Token terikat ke userId anak — tidak bisa dipakai reset password parent
// =============================================

export async function forgotChildPassword(input: ForgotChildPasswordInput): Promise<{ message: string }> {
  const GENERIC_MESSAGE = 'Jika username terdaftar, link reset password telah dikirim ke email orang tua.';

  // Cari akun anak berdasarkan username
  const child = await prisma.childProfile.findFirst({
    where: { username: input.childUsername, isActive: true },
    include: {
      user: true,
      familyLinks: {
        include: {
          parentProfile: {
            include: { user: { select: { email: true } } },
          },
        },
        take: 1,
      },
    },
  });

  if (!child) return { message: GENERIC_MESSAGE };

  const parentLink = child.familyLinks[0];
  if (!parentLink?.parentProfile?.user?.email) return { message: GENERIC_MESSAGE };

  const parentEmail    = parentLink.parentProfile.user.email;
  const parentFullName = parentLink.parentProfile.fullName;

  // Hapus token lama milik anak ini
  await prisma.passwordResetToken.deleteMany({ where: { userId: child.userId } });

  const rawToken  = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_MS);

  await prisma.passwordResetToken.create({
    data: { userId: child.userId, tokenHash, expiresAt },
  });

  const resetUrl = `${env.APP_URL}/auth/child/reset-password?token=${rawToken}`;

  EmailService.sendChildPasswordResetEmail(parentEmail, parentFullName, child.fullName, resetUrl).catch(
    (err: unknown) => console.error('[forgotChildPassword] Email failed:', err instanceof Error ? err.message : String(err)),
  );

  return { message: GENERIC_MESSAGE };
}
