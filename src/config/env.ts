import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  APP_NAME: z.string().default('Byond Kids'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL wajib diisi'),

  SUPABASE_URL: z.string().url('SUPABASE_URL harus berupa URL valid'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY wajib diisi'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY wajib diisi'),
  SUPABASE_STORAGE_BUCKET: z.string().default('chore-submissions'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET minimal 32 karakter'),
  // Access token 8 menit — auto-logout jika tidak aktif lebih dari 8 menit
  JWT_EXPIRES_IN: z.string().default('8m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET minimal 32 karakter'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

 
  CAPTCHA_ENABLED: z.string().default('false').transform(v => v === 'true'),
  HCAPTCHA_SECRET_KEY: z.string().default(''),
  HCAPTCHA_VERIFY_URL: z.string().default('https://api.hcaptcha.com/siteverify'),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  LOGIN_RATE_LIMIT_MAX: z.string().default('5').transform(Number),

  BCRYPT_SALT_ROUNDS: z.string().default('12').transform(Number),

  // Email / SMTP — kosongkan SMTP_HOST di dev untuk pakai Ethereal (preview URL di console)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_SECURE: z.string().default('false').transform(v => v === 'true'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('Byond Kids <noreply@byondkids.id>'),
  // URL frontend — digunakan untuk membuat link reset password di email
  APP_URL: z.string().default('http://localhost:3000'),

  // Durasi reset token — default 15 menit
  PASSWORD_RESET_EXPIRES_MS: z.string().default('900000').transform(Number),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment variables tidak valid:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
