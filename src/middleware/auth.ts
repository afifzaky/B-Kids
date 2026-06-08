import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticatedRequest, JwtPayload, AuthError } from '../types';

export function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthError('Token tidak ditemukan');
    }

    const token = authHeader.split(' ')[1];
    if (!token) throw new AuthError('Token tidak valid');

    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (req as AuthenticatedRequest).user = payload;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token sudah kadaluarsa, silakan login ulang',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token tidak valid',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    if (error instanceof AuthError) {
      res.status(401).json({ success: false, message: error.message });
      return;
    }

    next(error);
  }
}
