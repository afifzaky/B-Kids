import { z } from 'zod';

export const createPocketSchema = z.object({
  name: z.string().min(1, 'Nama pocket wajib diisi').max(50),
  category: z.enum(['JAJAN', 'HAJI', 'QURBAN', 'INFAQ', 'CUSTOM']),
  targetAmount: z.number().positive('Target harus lebih dari 0').optional(),
  deadline: z.string().datetime({ message: 'Format tanggal tidak valid (ISO 8601)' }).optional(),
  intentionText: z.string().max(500).optional(),
  emoji: z.string().max(10).optional(),
});

export const updatePocketSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  targetAmount: z.number().positive().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  intentionText: z.string().max(500).nullable().optional(),
  emoji: z.string().max(10).optional(),
});

export const topupPocketSchema = z.object({
  amount: z.number().positive('Nominal harus lebih dari 0'),
});

export type CreatePocketInput = z.infer<typeof createPocketSchema>;
export type UpdatePocketInput = z.infer<typeof updatePocketSchema>;
export type TopupPocketInput = z.infer<typeof topupPocketSchema>;
