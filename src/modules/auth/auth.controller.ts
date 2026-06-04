import { Request, Response, NextFunction } from 'express';
import {
  registerParentSchema,
  loginParentSchema,
  createChildSchema,
  loginChildSchema,
  activateChildDeviceSchema,
  refreshTokenSchema,
} from './auth.validator';
import * as AuthService from './auth.service';
import { AuthenticatedRequest } from '../../types';

// =============================================
// POST /api/auth/register/parent
// =============================================

export async function registerParent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = registerParentSchema.parse(req.body);
    const result = await AuthService.registerParent(input);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Selamat datang di Byond!',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================
// POST /api/auth/login/parent
// =============================================

export async function loginParent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = loginParentSchema.parse(req.body);
    const result = await AuthService.loginParent(input);

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================
// POST /api/auth/children — Buat profil anak (parent only)
// =============================================

export async function createChild(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createChildSchema.parse(req.body);
    const result = await AuthService.createChildProfile(req.user.profileId, input);

    res.status(201).json({
      success: true,
      message: `Profil anak ${result.fullName} berhasil dibuat`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================
// POST /api/auth/children/activate-device (parent only)
// =============================================

export async function activateChildDevice(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = activateChildDeviceSchema.parse(req.body);
    const result = await AuthService.activateChildDevice(req.user.profileId, input);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================
// POST /api/auth/login/child
// =============================================

export async function loginChild(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = loginChildSchema.parse(req.body);
    const result = await AuthService.loginChild(input);

    res.status(200).json({
      success: true,
      message: `Halo ${result.profile.fullName}! 👋`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================
// POST /api/auth/refresh
// =============================================

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const result = await AuthService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token diperbarui',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================
// GET /api/auth/me
// =============================================

export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { prisma } = await import('../../config/database');

    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      include: {
        parentProfile: true,
        childProfile: {
          include: {
            account: {
              select: { id: true, balance: true, currency: true },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      return;
    }

    // Serialisasi BigInt sebelum kirim
    const data = {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.parentProfile ?? {
        ...user.childProfile,
        account: user.childProfile?.account
          ? {
              ...user.childProfile.account,
              balance: Number(user.childProfile.account.balance) / 100,
            }
          : null,
      },
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
