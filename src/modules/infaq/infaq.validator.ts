import { z } from 'zod';

export const createInfaqSchema = z.object({
  institutionId: z.string().uuid('ID lembaga tidak valid'),
  amount: z.number().positive('Nominal infaq harus lebih dari 0'),
  notes: z.string().max(200).optional(),
});

export type CreateInfaqInput = z.infer<typeof createInfaqSchema>;
