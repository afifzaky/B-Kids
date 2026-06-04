import { z } from 'zod';

export const buyVoucherSchema = z.object({
  voucherId: z.string().uuid('ID voucher tidak valid'),
  sourcePocketId: z.string().uuid('ID pocket tidak valid'),
});

export type BuyVoucherInput = z.infer<typeof buyVoucherSchema>;
