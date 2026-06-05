import { z } from 'zod';

const pinSchema = z
  .string()
  .length(6, 'PIN harus tepat 6 digit')
  .regex(/^\d+$/, 'PIN hanya boleh angka');

// =============================================
// Parent: Register
// =============================================

export const registerParentSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  phone: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Format nomor HP Indonesia tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  savingsPin: pinSchema.describe('PIN Tabungan 6 digit — digunakan sebagai 2nd factor saat login'),
  fullName: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  nik: z
    .string()
    .length(16, 'NIK harus 16 digit')
    .regex(/^\d+$/, 'NIK hanya boleh angka'),
  dateOfBirth: z.string().datetime({ message: 'Format tanggal tidak valid (ISO 8601)' }),
  bsiAccountNumber: z
    .string()
    .regex(/^7\d{9}$/, 'Nomor rekening BSI harus 10 digit diawali angka 7'),
});

// =============================================
// Parent: Login
// =============================================

export const loginParentSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
  savingsPin: pinSchema.describe('PIN Tabungan yang dibuat saat registrasi'),
});

// =============================================
// Create Child Profile (oleh Parent — butuh PIN konfirmasi)
// =============================================

export const createChildSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  dateOfBirth: z.string().datetime({ message: 'Format tanggal tidak valid' }),
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(30, 'Username maksimal 30 karakter')
    .regex(/^[a-z0-9_]+$/, 'Username hanya boleh huruf kecil, angka, dan underscore'),
  password: z
    .string()
    .min(6, 'Password anak minimal 6 karakter')
    .max(100),
  pin: pinSchema.describe('PIN 6 digit untuk login anak'),
  parentPin: pinSchema.describe('PIN Tabungan orang tua — konfirmasi otorisasi buat akun anak'),
});

// =============================================
// Child: Login
// =============================================

export const loginChildSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
  pin: pinSchema.describe('PIN 6 digit anak'),
});

// =============================================
// Activate Child on Device (oleh Parent — opsional)
// =============================================

export const activateChildDeviceSchema = z.object({
  childProfileId: z.string().uuid(),
  deviceId: z.string().min(1, 'Device ID wajib'),
});

// =============================================
// Refresh Token
// =============================================

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token wajib diisi'),
});

// =============================================
// Logout
// =============================================

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token wajib untuk invalidasi sesi'),
});

export type RegisterParentInput    = z.infer<typeof registerParentSchema>;
export type LoginParentInput       = z.infer<typeof loginParentSchema>;
export type CreateChildInput       = z.infer<typeof createChildSchema>;
export type LoginChildInput        = z.infer<typeof loginChildSchema>;
export type ActivateChildDeviceInput = z.infer<typeof activateChildDeviceSchema>;
export type RefreshTokenInput      = z.infer<typeof refreshTokenSchema>;
export type LogoutInput            = z.infer<typeof logoutSchema>;
