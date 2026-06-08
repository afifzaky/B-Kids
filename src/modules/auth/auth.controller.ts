import { Request, Response, NextFunction } from 'express';
import {
  registerParentSchema,
  loginParentSchema,
  createChildSchema,
  loginChildSchema,
  activateChildDeviceSchema,
  loginAdminSchema,
  refreshTokenSchema,
  logoutSchema,
  updateParentProfileSchema,
  changeEmailSchema,
  changePasswordSchema,
  changePinSchema,
  changeChildPasswordSchema,
  changeChildPinSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  forgotUsernameSchema,
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
// POST /api/auth/login/admin
// =============================================

export async function loginAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = loginAdminSchema.parse(req.body);
    const result = await AuthService.loginAdmin(input);
    res.status(200).json({ success: true, message: 'Login admin berhasil', data: result });
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
// POST /api/auth/logout
// =============================================

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refreshToken } = logoutSchema.parse(req.body);
    const result = await AuthService.logout(refreshToken);
    res.status(200).json({ success: true, message: result.message });
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

    // Serialize setiap field BigInt secara eksplisit.
    // JANGAN spread raw Prisma object — BigInt tidak bisa di-JSON.stringify,
    // dan field sensitif (pinHash, nik) tidak boleh bocor ke client.
    let profile: Record<string, unknown> | null = null;

    if (user.role === 'SUPER_ADMIN') {
      profile = null; // admin tidak punya profile
    } else if (user.parentProfile) {
      profile = {
        id: user.parentProfile.id,
        fullName: user.parentProfile.fullName,
        avatarUrl: user.parentProfile.avatarUrl ?? null,
        bsiAccountNumber: user.parentProfile.bsiAccountNumber,
        balance: Number(user.parentProfile.dummyBalance) / 100,
        currency: 'IDR',
      };
    } else if (user.childProfile) {
      profile = {
        id: user.childProfile.id,
        fullName: user.childProfile.fullName,
        username: user.childProfile.username,
        avatar: user.childProfile.avatar ?? null,
        childAccountNumber: user.childProfile.childAccountNumber,
        isActive: user.childProfile.isActive,
        account: user.childProfile.account
          ? {
              id: user.childProfile.account.id,
              balance: Number(user.childProfile.account.balance) / 100,
              currency: user.childProfile.account.currency,
            }
          : null,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
}

// =============================================
// PATCH /api/auth/me/profile — ubah nama & foto (parent only)
// =============================================

export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = updateParentProfileSchema.parse(req.body);
    const data = await AuthService.updateParentProfile(req.user.profileId, input);
    res.json({ success: true, message: 'Profil berhasil diperbarui', data });
  } catch (error) { next(error); }
}

// =============================================
// PATCH /api/auth/me/email — ganti email (parent only, butuh PIN)
// =============================================

export async function changeEmail(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = changeEmailSchema.parse(req.body);
    const data = await AuthService.changeParentEmail(req.user.sub, req.user.profileId, input);
    res.json({ success: true, ...data });
  } catch (error) { next(error); }
}

// =============================================
// PATCH /api/auth/me/password — ganti password (parent only, butuh old password)
// =============================================

export async function changePassword(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = changePasswordSchema.parse(req.body);
    const data = await AuthService.changeParentPassword(req.user.sub, input);
    res.json({ success: true, ...data });
  } catch (error) { next(error); }
}

// =============================================
// PATCH /api/auth/me/pin — ganti PIN tabungan (parent only, butuh old PIN)
// =============================================

export async function changePin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = changePinSchema.parse(req.body);
    const data = await AuthService.changeParentPin(req.user.profileId, input);
    res.json({ success: true, ...data });
  } catch (error) { next(error); }
}

// =============================================
// PATCH /api/auth/children/:childId/password — parent ganti password anak
// =============================================

export async function changeChildPassword(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = changeChildPasswordSchema.parse(req.body);
    const data = await AuthService.changeChildPasswordByParent(
      req.user.profileId,
      req.params.childId,
      input,
    );
    res.json({ success: true, ...data });
  } catch (error) { next(error); }
}

// =============================================
// PATCH /api/auth/children/:childId/pin — parent ganti PIN anak
// =============================================

export async function changeChildPin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = changeChildPinSchema.parse(req.body);
    const data = await AuthService.changeChildPinByParent(
      req.user.profileId,
      req.params.childId,
      input,
    );
    res.json({ success: true, ...data });
  } catch (error) { next(error); }
}

// =============================================
// POST /api/auth/forgot-password [PUBLIC]
// Kirim link reset password ke email — anti-enumeration (selalu 200)
// =============================================

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = forgotPasswordSchema.parse(req.body);
    const data  = await AuthService.forgotPassword(input);
    res.status(200).json({ success: true, ...data });
  } catch (error) { next(error); }
}

// =============================================
// POST /api/auth/reset-password [PUBLIC]
// Terapkan password baru menggunakan token dari email
// =============================================

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = resetPasswordSchema.parse(req.body);
    const data  = await AuthService.resetPassword(input);
    res.status(200).json({ success: true, ...data });
  } catch (error) { next(error); }
}

// =============================================
// POST /api/auth/forgot-username [PUBLIC]
// Kirim daftar username anak ke email parent — anti-enumeration (selalu 200)
// =============================================

export async function forgotUsername(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = forgotUsernameSchema.parse(req.body);
    const data  = await AuthService.forgotUsername(input);
    res.status(200).json({ success: true, ...data });
  } catch (error) { next(error); }
}
