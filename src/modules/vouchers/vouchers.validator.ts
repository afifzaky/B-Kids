import { z } from 'zod';

// Voucher dibeli dari Tabungan Utama — tidak perlu sourcePocketId
export const buyVoucherSchema = z.object({
  voucherId: z.string().uuid('ID voucher tidak valid'),
});

export type BuyVoucherInput = z.infer<typeof buyVoucherSchema>;
