import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';
import { verifyToken } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';
import * as AuthController from './auth.controller';
import { AuthenticatedRequest } from '../../types';

const router = Router();

// Rate limiter khusus untuk login — cegah brute force
const loginLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Coba lagi dalam 5 menit.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter untuk password reset — diaktifkan kembali saat fitur di-enable
// const passwordResetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, ... });

// Helper untuk casting req ke AuthenticatedRequest di routes yang butuh auth
function asAuth(
  handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) =>
    handler(req as AuthenticatedRequest, res, next);
}

// =============================================
// Public routes (tidak perlu token)
// =============================================

// POST /api/auth/register/parent
router.post('/register/parent', AuthController.registerParent);

// POST /api/auth/login/parent
router.post('/login/parent', loginLimiter, AuthController.loginParent);

// POST /api/auth/login/child
router.post('/login/child', loginLimiter, AuthController.loginChild);

// POST /api/auth/login/admin
router.post('/login/admin', loginLimiter, AuthController.loginAdmin);

// POST /api/auth/refresh
router.post('/refresh', AuthController.refreshToken);

// POST /api/auth/logout — invalidasi sesi (tidak perlu Bearer token)
router.post('/logout', AuthController.logout);

// Fitur password/username recovery — dinonaktifkan sementara, aktifkan kembali setelah
// email service (SMTP) dikonfigurasi di environment production.
// router.post('/forgot-password',       passwordResetLimiter, AuthController.forgotPassword);
// router.post('/reset-password',        passwordResetLimiter, AuthController.resetPassword);
// router.post('/forgot-username',       passwordResetLimiter, AuthController.forgotUsername);
// router.post('/forgot-child-password', passwordResetLimiter, AuthController.forgotChildPassword);

// =============================================
// Protected routes (perlu token)
// =============================================

// GET /api/auth/me
router.get('/me', verifyToken, asAuth(AuthController.getMe));

// =============================================
// Profile Management — Parent
// =============================================

// PATCH /api/auth/me/profile   — ubah nama & foto profil
// PATCH /api/auth/me/email     — ganti email (butuh PIN konfirmasi)
// PATCH /api/auth/me/password  — ganti password (butuh password lama)
// PATCH /api/auth/me/pin       — ganti PIN tabungan (butuh PIN lama)
router.patch('/me/profile',  verifyToken, checkRole('PARENT'), asAuth(AuthController.updateProfile));
router.patch('/me/email',    verifyToken, checkRole('PARENT'), asAuth(AuthController.changeEmail));
router.patch('/me/password', verifyToken, checkRole('PARENT'), asAuth(AuthController.changePassword));
router.patch('/me/pin',      verifyToken, checkRole('PARENT'), asAuth(AuthController.changePin));

// =============================================
// Manajemen Akun Anak oleh Orang Tua
// =============================================

// POST  /api/auth/children                        — buat profil anak
// PATCH /api/auth/children/:childId/password      — ganti password anak (butuh PIN ortu)
// PATCH /api/auth/children/:childId/pin           — ganti PIN anak (butuh PIN ortu)

router.post(
  '/children',
  verifyToken,
  checkRole('PARENT'),
  asAuth(AuthController.createChild),
);

router.patch(
  '/children/:childId/password',
  verifyToken,
  checkRole('PARENT'),
  asAuth(AuthController.changeChildPassword),
);

router.patch(
  '/children/:childId/pin',
  verifyToken,
  checkRole('PARENT'),
  asAuth(AuthController.changeChildPin),
);

export default router;
