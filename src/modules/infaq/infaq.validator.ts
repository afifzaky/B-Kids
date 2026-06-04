import { z } from 'zod';

export const createInfaqSchema = z.object({
  institution: z.enum(['BSI_MASLAHAT', 'BAZNAS', 'LAZISNU', 'LAZISMU', 'OTHER']),
  institutionName: z.string().max(100).optional(),
  amount: z.number().positive('Nominal infaq harus lebih dari 0'),
  sourcePocketId: z.string().uuid('ID pocket tidak valid'),
}).refine(
  data => data.institution !== 'OTHER' || !!data.institutionName,
  { message: 'Nama lembaga wajib diisi untuk pilihan "Lainnya"', path: ['institutionName'] },
);

export type CreateInfaqInput = z.infer<typeof createInfaqSchema>;
