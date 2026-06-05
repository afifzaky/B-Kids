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
    message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
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
router.post('/register/parent', AuthController.registerParent);

// POST /api/auth/login/parent
router.post('/login/parent', loginLimiter, AuthController.loginParent);

// POST /api/auth/login/child
router.post('/login/child', loginLimiter, AuthController.loginChild);

// POST /api/auth/refresh
router.post('/refresh', AuthController.refreshToken);

// POST /api/auth/logout — invalidasi sesi (tidak perlu Bearer token)
router.post('/logout', AuthController.logout);

// =============================================
// Protected routes (perlu token)
// =============================================

// GET /api/auth/me
router.get('/me', verifyToken, asAuth(AuthController.getMe));

// POST /api/auth/children — Buat profil anak (parent only)
router.post(
  '/children',
  verifyToken,
  checkRole('PARENT'),
  asAuth(AuthController.createChild),
);

// POST /api/auth/children/activate-device — Aktifkan perangkat anak (parent only)
router.post(
  '/children/activate-device',
  verifyToken,
  checkRole('PARENT'),
  asAuth(AuthController.activateChildDevice),
);

export default router;
