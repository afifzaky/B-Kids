import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchParentsSchema = paginationSchema.extend({
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
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

export type SearchParentsInput = z.infer<typeof searchParentsSchema>;
export type AdjustBalanceInput = z.infer<typeof adjustBalanceSchema>;
export type SetStatusInput = z.infer<typeof setStatusSchema>;
export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
