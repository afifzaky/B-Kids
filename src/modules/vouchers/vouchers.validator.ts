import { z } from 'zod';

// Voucher dibeli dari Tabungan Utama — tidak perlu sourcePocketId
export const buyVoucherSchema = z.object({
  voucherId: z.string().uuid('ID voucher tidak valid'),
  pin: z
    .string()
    .length(6, 'PIN harus tepat 6 digit')
    .regex(/^\d+$/, 'PIN hanya boleh angka'),
});

export type BuyVoucherInput = z.infer<typeof buyVoucherSchema>;
