import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';
import { verifyToken } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';
import { requireCaptcha } from '../../middleware/captcha';
import * as AuthController from './auth.controller';
import { AuthenticatedRequest } from '../../types';

const router = Router();

// Rate limiter khusus untuk login — cegah brute force
const loginLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter untuk password reset & forgot-username — lebih ketat (5 req / 15 min)
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan. Coba lagi dalam 15 menit.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

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
router.post('/register/parent', requireCaptcha, AuthController.registerParent);

// POST /api/auth/login/parent
router.post('/login/parent', loginLimiter, requireCaptcha, AuthController.loginParent);

// POST /api/auth/login/child
router.post('/login/child', loginLimiter, requireCaptcha, AuthController.loginChild);

// POST /api/auth/login/admin
router.post('/login/admin', loginLimiter, requireCaptcha, AuthController.loginAdmin);

// POST /api/auth/refresh
router.post('/refresh', AuthController.refreshToken);

// POST /api/auth/logout — invalidasi sesi (tidak perlu Bearer token)
router.post('/logout', AuthController.logout);

// POST /api/auth/forgot-password — kirim link reset ke email (rate-limited, anti-enumeration)
router.post('/forgot-password', passwordResetLimiter, AuthController.forgotPassword);

// POST /api/auth/reset-password — terapkan password baru via token
router.post('/reset-password', passwordResetLimiter, AuthController.resetPassword);

// POST /api/auth/forgot-username — kirim username anak ke email parent (rate-limited)
router.post('/forgot-username', passwordResetLimiter, AuthController.forgotUsername);

// POST /api/auth/forgot-child-password — kirim link reset password anak ke email parent (rate-limited)
router.post('/forgot-child-password', passwordResetLimiter, AuthController.forgotChildPassword);

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
