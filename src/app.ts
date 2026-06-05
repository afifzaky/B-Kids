import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Modules
import authRoutes from './modules/auth/auth.routes';
import familyRoutes from './modules/family/family.routes';
import pocketsRoutes from './modules/pockets/pockets.routes';
import choresRoutes from './modules/chores/chores.routes';
import limitsRoutes from './modules/limits/limits.routes';
import infaqRoutes from './modules/infaq/infaq.routes';
import vouchersRoutes from './modules/vouchers/vouchers.routes';
import parentRoutes from './modules/parent/parent.routes';

export function createApp(): Application {
  const app = express();

  // =============================================
  // Global BigInt serializer — safety net
  // Semua BigInt harus sudah dikonversi di service/controller,
  // ini hanya mencegah crash jika ada yang terlewat.
  // =============================================
  app.set('json replacer', (_key: string, value: unknown) => {
    if (typeof value === 'bigint') return Number(value);
    return value;
  });

  // =============================================
  // Security headers (wajib untuk banking)
  // =============================================
  app.use(
    helmet({
      contentSecurityPolicy: true,
      crossOriginEmbedderPolicy: true,
      crossOriginResourcePolicy: { policy: 'same-origin' },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    }),
  );

  // =============================================
  // CORS — hanya izinkan origin dari .env
  // =============================================
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
        // izinkan request tanpa origin (curl, Postman) hanya di development
        if (!origin && env.NODE_ENV === 'development') return callback(null, true);
        if (!origin || allowed.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} tidak diizinkan`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // =============================================
  // Body parser
  // =============================================
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // =============================================
  // Global rate limiter
  // =============================================
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Terlalu banyak request. Coba lagi nanti.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    }),
  );

  // =============================================
  // Health check (untuk monitoring)
  // =============================================
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      app: env.APP_NAME,
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // =============================================
  // Routes
  // =============================================
  app.use('/api/auth', authRoutes);
  app.use('/api/family', familyRoutes);
  app.use('/api/pockets', pocketsRoutes);
  app.use('/api/chores', choresRoutes);
  app.use('/api/limits', limitsRoutes);
  app.use('/api/infaq', infaqRoutes);
  app.use('/api/vouchers', vouchersRoutes);
  app.use('/api/parent', parentRoutes);

  // =============================================
  // Error handlers (harus paling bawah)
  // =============================================
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
