import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../types';
import { env } from '../config/env';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Log error di server (tidak expose ke client)
  console.error(`[${new Date().toISOString()}] ERROR:`, {
    name: error.name,
    message: error.message,
    path: req.path,
    method: req.method,
    stack: env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  // ZodError = validasi input gagal → 400
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Data yang dikirim tidak valid',
      code: 'VALIDATION_ERROR',
      errors: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // AppError = error yang kita lempar sendiri (expected)
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
    });
    return;
  }

  // Prisma errors
  if (error.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as unknown as { code: string; meta?: { target?: string[] } };

    if (prismaError.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'Data sudah ada, tidak bisa duplikasi',
        code: 'DUPLICATE_ENTRY',
      });
      return;
    }

    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
        code: 'NOT_FOUND',
      });
      return;
    }
  }

  // Fallback — jangan expose detail error di production
  res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === 'production'
        ? 'Terjadi kesalahan pada server'
        : error.message,
    code: 'INTERNAL_SERVER_ERROR',
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} tidak ditemukan`,
    code: 'ROUTE_NOT_FOUND',
  });
}
