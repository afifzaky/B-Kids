import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest, ForbiddenError } from '../types';

/**
 * Middleware untuk cek role user.
 * Selalu gunakan SETELAH verifyToken.
 *
 * Contoh:
 *   router.post('/chores', verifyToken, checkRole('PARENT'), createChore)
 *   router.post('/chores/:id/submit', verifyToken, checkRole('CHILD'), submitChore)
 */
export function checkRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      const error = new ForbiddenError(
        `Akses ditolak. Endpoint ini hanya untuk: ${allowedRoles.join(', ')}`,
      );
      res.status(403).json({ success: false, message: error.message, code: error.code });
      return;
    }

    next();
  };
}

/**
 * Validasi bahwa child yang diakses adalah anak dari parent yang sedang login.
 * Gunakan untuk semua endpoint parent yang mengakses data anak spesifik.
 * Cegah IDOR (Insecure Direct Object Reference).
 */
export async function validateFamilyAccess(
  parentProfileId: string,
  childProfileId: string,
): Promise<boolean> {
  const { prisma } = await import('../config/database');

  const link = await prisma.familyLink.findFirst({
    where: {
      parentProfileId,
      childProfileId,
    },
  });

  return link !== null;
}
