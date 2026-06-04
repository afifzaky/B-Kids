import { z } from 'zod';

// =============================================
// Parent Registration
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
  fullName: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  nik: z
    .string()
    .length(16, 'NIK harus 16 digit')
    .regex(/^\d+$/, 'NIK hanya boleh angka'),
  dateOfBirth: z.string().datetime({ message: 'Format tanggal tidak valid (ISO 8601)' }),
  bsiAccountNumber: z
    .string()
    .min(10, 'Nomor rekening minimal 10 digit')
    .regex(/^\d+$/, 'Nomor rekening hanya boleh angka'),
});

// =============================================
// Parent Login
// =============================================

export const loginParentSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

// =============================================
// Create Child Profile (oleh Parent)
// =============================================

export const createChildSchema = z.object({
  fullName: z.string().min(2).max(100),
  dateOfBirth: z.string().datetime({ message: 'Format tanggal tidak valid' }),
  pin: z
    .string()
    .length(6, 'PIN harus 6 digit')
    .regex(/^\d+$/, 'PIN hanya boleh angka'),
});

// =============================================
// Child Login
// =============================================

export const loginChildSchema = z.object({
  childProfileId: z.string().uuid('Format ID tidak valid'),
  pin: z
    .string()
    .length(6, 'PIN harus 6 digit')
    .regex(/^\d+$/, 'PIN hanya boleh angka'),
  deviceId: z.string().min(1, 'Device ID wajib untuk keamanan'),
});

// =============================================
// Activate Child on Device (oleh Parent)
// =============================================

export const activateChildDeviceSchema = z.object({
  childProfileId: z.string().uuid(),
  deviceId: z.string().min(1, 'Device ID wajib'),
});

// =============================================
// Change Child PIN (oleh Parent)
// =============================================

export const changeChildPinSchema = z.object({
  childProfileId: z.string().uuid(),
  newPin: z
    .string()
    .length(6, 'PIN baru harus 6 digit')
    .regex(/^\d+$/, 'PIN hanya boleh angka'),
});

// =============================================
// Refresh Token
// =============================================

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token wajib diisi'),
});

export type RegisterParentInput = z.infer<typeof registerParentSchema>;
export type LoginParentInput = z.infer<typeof loginParentSchema>;
export type CreateChildInput = z.infer<typeof createChildSchema>;
export type LoginChildInput = z.infer<typeof loginChildSchema>;
export type ActivateChildDeviceInput = z.infer<typeof activateChildDeviceSchema>;
export type ChangeChildPinInput = z.infer<typeof changeChildPinSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
