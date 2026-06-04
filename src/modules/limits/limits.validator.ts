import { z } from 'zod';

export const setLimitsSchema = z.object({
  daily: z.number().positive().nullable().optional(),
  weekly: z.number().positive().nullable().optional(),
  monthly: z.number().positive().nullable().optional(),
  excludeInfaq: z.boolean().optional(),
}).refine(
  data => data.daily !== undefined || data.weekly !== undefined || data.monthly !== undefined,
  { message: 'Setidaknya satu limit (daily, weekly, atau monthly) harus diisi' },
);

export type SetLimitsInput = z.infer<typeof setLimitsSchema>;
