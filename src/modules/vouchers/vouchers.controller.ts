import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as VouchersService from './vouchers.service';
import { buyVoucherSchema } from './vouchers.validator';

export async function listVouchers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const data = await VouchersService.listVouchers(category);
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

export async function buyVoucher(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = buyVoucherSchema.parse(req.body);
    const data = await VouchersService.buyVoucher(req.user.profileId, input, req.user.sub);
    res.status(201).json({ success: true, message: 'Voucher berhasil dibeli!', data });
  } catch (error) { next(error); }
}

export async function listRedemptions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await VouchersService.listRedemptions(req.user.profileId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
}
