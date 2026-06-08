import { z } from 'zod';

const voucherTypeEnum = z.enum(['DISCOUNT', 'GAME_TOPUP', 'E_WALLET', 'EDUCATION']);

export const setLimitsSchema = z.object({
  daily: z.number().positive().nullable().optional(),
  weekly: z.number().positive().nullable().optional(),
  monthly: z.number().positive().nullable().optional(),
  excludeInfaq: z.boolean().optional(),
}).refine(
  data => data.daily !== undefined || data.weekly !== undefined || data.monthly !== undefined,
  { message: 'Setidaknya satu limit (daily, weekly, atau monthly) harus diisi' },
);

// Limit per kategori voucher (misal: gaming max 50k/hari)
export const setCategoryLimitSchema = z.object({
  voucherType: voucherTypeEnum,
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  limitAmount: z.number().positive('Jumlah limit harus lebih dari 0').nullable(),
});

export type SetLimitsInput = z.infer<typeof setLimitsSchema>;
export type SetCategoryLimitInput = z.infer<typeof setCategoryLimitSchema>;
