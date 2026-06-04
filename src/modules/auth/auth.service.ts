import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
import type {
  RegisterParentInput,
  LoginParentInput,
  CreateChildInput,
  LoginChildInput,
  ActivateChildDeviceInput,
} from './auth.validator';

// =============================================
// Token helpers
// =============================================

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

// Nomor rekening dummy — dalam produksi akan dari core banking BSI
function generateDummyAccountNumber(): string {
  return '7' + Math.floor(Math.random() * 9_000_000_000 + 1_000_000_000).toString();
}

// =============================================
// Parent: Register
// =============================================

export async function registerParent(input: RegisterParentInput) {
  // Cek duplikat email
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { phone: input.phone }] },
  });

  if (existingUser) {
    throw new AppError('Email atau nomor HP sudah terdaftar', 409, 'DUPLICATE_USER');
  }

  // Cek NIK duplikat
  const existingNIK = await prisma.parentProfile.findFirst({
    where: { nik: input.nik },
  });
  if (existingNIK) {
    throw new AppError('NIK sudah terdaftar', 409, 'DUPLICATE_NIK');
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

  // Buat user + parent profile dalam satu transaction
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
        dummyBalance: BigInt(10_000_000_00), // Rp 10.000.000 dummy
      },
    });

    return { user, parentProfile };
  });

  const tokens = generateTokens({
    sub: result.user.id,
    role: 'PARENT',
    profileId: result.parentProfile.id,
  });

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
    ...tokens,
  };
}

// =============================================
// Parent: Login
// =============================================

export async function loginParent(input: LoginParentInput) {
  const user = await prisma.user.findFirst({
    where: { email: input.email, role: 'PARENT', isActive: true },
    include: { parentProfile: true },
  });

  if (!user || !user.parentProfile) {
    // Tetap hash untuk mencegah timing attack
    await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
    throw new AuthError('Email atau password salah');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AuthError('Email atau password salah');
  }

  const tokens = generateTokens({
    sub: user.id,
    role: 'PARENT',
    profileId: user.parentProfile.id,
  });

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
// Parent: Buat Child Profile
// =============================================

export async function createChildProfile(
  parentProfileId: string,
  input: CreateChildInput,
) {
  // Cek berapa anak sudah ditambahkan (batas 5 untuk prototype)
  const existingChildren = await prisma.familyLink.count({
    where: { parentProfileId },
  });

  if (existingChildren >= 5) {
    throw new AppError('Maksimal 5 anak per akun', 422, 'MAX_CHILDREN_REACHED');
  }

  const pinHash = await bcrypt.hash(input.pin, env.BCRYPT_SALT_ROUNDS);
  const childAccountNumber = generateDummyAccountNumber();

  const result = await prisma.$transaction(async (tx) => {
    // Buat user untuk anak (email opsional, role CHILD)
    const childUser = await tx.user.create({
      data: {
        email: `child-${uuidv4()}@byond.internal`, // placeholder email internal
        passwordHash: pinHash, // anak tidak punya password, hanya PIN
        role: 'CHILD',
      },
    });

    const childProfile = await tx.childProfile.create({
      data: {
        userId: childUser.id,
        fullName: input.fullName,
        dateOfBirth: new Date(input.dateOfBirth),
        pinHash,
        createdByParentId: parentProfileId,
        childAccountNumber,
      },
    });

    // Buat rekening anak (saldo awal 0)
    const account = await tx.childAccount.create({
      data: {
        childProfileId: childProfile.id,
        balance: BigInt(0),
        currency: 'IDR',
      },
    });

    // Buat pocket default: Jajan
    await tx.pocket.create({
      data: {
        accountId: account.id,
        name: 'Uang Jajan',
        category: 'JAJAN',
        emoji: '🍜',
        balance: BigInt(0),
      },
    });

    // Link parent-child
    await tx.familyLink.create({
      data: { parentProfileId, childProfileId: childProfile.id },
    });

    return { childUser, childProfile, account };
  });

  return {
    id: result.childProfile.id,
    fullName: result.childProfile.fullName,
    dateOfBirth: result.childProfile.dateOfBirth,
    childAccountNumber,
    accountId: result.account.id,
  };
}

// =============================================
// Parent: Aktifkan anak di perangkat
// =============================================

export async function activateChildDevice(
  parentProfileId: string,
  input: ActivateChildDeviceInput,
) {
  // Validasi anak ini milik parent yang login
  const link = await prisma.familyLink.findFirst({
    where: {
      parentProfileId,
      childProfileId: input.childProfileId,
    },
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
// Child: Login (PIN + device binding)
// =============================================

export async function loginChild(input: LoginChildInput) {
  const childProfile = await prisma.childProfile.findFirst({
    where: {
      id: input.childProfileId,
      isActive: true,
    },
    include: { user: true },
  });

  if (!childProfile) {
    throw new NotFoundError('Profil anak');
  }

  // Cek device binding — anak hanya bisa login dari perangkat terdaftar
  if (childProfile.deviceId && childProfile.deviceId !== input.deviceId) {
    throw new ForbiddenError('Perangkat tidak dikenali. Minta orang tua untuk mengaktifkan perangkat ini.');
  }

  // Validasi PIN
  const isPinValid = await bcrypt.compare(input.pin, childProfile.pinHash);
  if (!isPinValid) {
    throw new AuthError('PIN salah');
  }

  const tokens = generateTokens({
    sub: childProfile.user.id,
    role: 'CHILD',
    profileId: childProfile.id,
  });

  return {
    profile: {
      id: childProfile.id,
      fullName: childProfile.fullName,
    },
    ...tokens,
  };
}

// =============================================
// Refresh Token
// =============================================

export async function refreshAccessToken(refreshToken: string) {
  let payload: { sub: string };

  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
  } catch {
    throw new AuthError('Refresh token tidak valid atau sudah kadaluarsa');
  }

  const user = await prisma.user.findFirst({
    where: { id: payload.sub, isActive: true },
    include: {
      parentProfile: true,
      childProfile: true,
    },
  });

  if (!user) throw new AuthError('User tidak ditemukan');

  const profileId =
    user.parentProfile?.id ?? user.childProfile?.id ?? '';

  const tokens = generateTokens({
    sub: user.id,
    role: user.role,
    profileId,
  });

  return tokens;
}
