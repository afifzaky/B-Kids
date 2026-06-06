import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

// Update lastActiveAt pada refresh token milik user ini.
// Fire-and-forget: tidak memblok request. Hanya update jika belum diupdate
// dalam 60 detik terakhir untuk mengurangi write ke DB.
export function trackActivity(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const userId = req.user?.sub;
  if (userId) {
    const sixtySecondsAgo = new Date(Date.now() - 60_000);
    void prisma.refreshToken
      .updateMany({
        where: {
          userId,
          expiresAt: { gt: new Date() },
          lastActiveAt: { lt: sixtySecondsAgo },
        },
        data: { lastActiveAt: new Date() },
      })
      .catch(() => {
        // Gagal update activity tidak boleh crash request
      });
  }
  next();
}
