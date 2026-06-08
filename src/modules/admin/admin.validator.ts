import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const voucherTypeEnum = z.enum(['DISCOUNT', 'GAME_TOPUP', 'E_WALLET', 'EDUCATION']);

const voucherBaseShape = {
  name: z.string().min(3, 'Nama voucher minimal 3 karakter').max(100),
  provider: z.string().min(1, 'Provider wajib diisi').max(50),
  category: z.string().min(1, 'Kategori wajib diisi').max(50),
  voucherType: voucherTypeEnum,
  price: z.number().positive('Harga harus lebih dari 0'),
  faceValue: z.number().positive().optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  stock: z.number().int().positive().optional(),
  maxPerChild: z.number().int().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
};

const validDateRange = (data: { validFrom?: string; validUntil?: string }) =>
  !data.validFrom || !data.validUntil || new Date(data.validFrom) < new Date(data.validUntil);

export const createVoucherSchema = z.object(voucherBaseShape).refine(validDateRange, {
  message: 'validFrom harus sebelum validUntil',
  path: ['validFrom'],
});

export const updateVoucherSchema = z
  .object({ ...voucherBaseShape, isActive: z.boolean().optional() })
  .partial()
  .refine(
    data => !data.validFrom || !data.validUntil || validDateRange(data),
    { message: 'validFrom harus sebelum validUntil', path: ['validFrom'] },
  );

export const voucherQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  voucherType: voucherTypeEnum.optional(),
  isActive: z.enum(['true', 'false']).optional(),
  provider: z.string().optional(),
});

export const infaqQuerySchema = paginationSchema.extend({
  institutionId: z.string().uuid().optional(),
  childProfileId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const createInstitutionSchema = z.object({
  code: z.string().min(2).max(50).regex(/^[A-Z0-9_]+$/, 'Code hanya boleh huruf kapital, angka, underscore'),
  name: z.string().min(2, 'Nama lembaga wajib diisi').max(100),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional(),
  bankInfo: z.string().max(200).optional(),
});

export const updateInstitutionSchema = createInstitutionSchema.partial();

export type CreateVoucherInput      = z.infer<typeof createVoucherSchema>;
export type UpdateVoucherInput      = z.infer<typeof updateVoucherSchema>;
export type VoucherQueryInput       = z.infer<typeof voucherQuerySchema>;
export type InfaqQueryInput         = z.infer<typeof infaqQuerySchema>;
export type CreateInstitutionInput  = z.infer<typeof createInstitutionSchema>;
export type UpdateInstitutionInput  = z.infer<typeof updateInstitutionSchema>;

export const searchParentsSchema = paginationSchema.extend({
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export const searchChildrenSchema = paginationSchema.extend({
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  parentId: z.string().uuid().optional(),
});

export const adjustBalanceSchema = z.object({
  amount: z.number().refine(v => v !== 0, 'Jumlah tidak boleh 0'),
  notes: z.string().min(5, 'Catatan minimal 5 karakter wajib diisi untuk audit'),
});

export const setStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().min(5, 'Alasan perubahan status wajib diisi').optional(),
});

export const auditLogQuerySchema = paginationSchema.extend({
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type SearchParentsInput  = z.infer<typeof searchParentsSchema>;
export type SearchChildrenInput = z.infer<typeof searchChildrenSchema>;
export type AdjustBalanceInput = z.infer<typeof adjustBalanceSchema>;
export type SetStatusInput = z.infer<typeof setStatusSchema>;
export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
