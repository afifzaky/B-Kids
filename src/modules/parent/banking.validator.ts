import { z } from 'zod';

export const depositSchema = z.object({
  amount: z
    .number({ required_error: 'Jumlah deposit wajib diisi' })
    .positive('Jumlah deposit harus positif')
    .max(100_000_000, 'Maksimal deposit Rp 100.000.000 per transaksi'),
  notes: z.string().max(255).optional(),
});

export const transferToChildSchema = z.object({
  childProfileId: z.string().uuid('Format ID anak tidak valid'),
  amount: z
    .number({ required_error: 'Jumlah transfer wajib diisi' })
    .positive('Jumlah transfer harus positif')
    .max(50_000_000, 'Maksimal transfer Rp 50.000.000 per transaksi'),
  notes: z.string().max(255).optional(),
});

export const transactionQuerySchema = z.object({
  page: z
    .string()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .default('20')
    .transform(Number)
    .pipe(z.number().int().min(1).max(100)),
});

export type DepositInput = z.infer<typeof depositSchema>;
export type TransferToChildInput = z.infer<typeof transferToChildSchema>;
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;
