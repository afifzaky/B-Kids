import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';
import { asAuth } from '../../utils/as-auth';
import * as VouchersController from './vouchers.controller';

const router = Router();
const childOnly = [verifyToken, checkRole('CHILD')] as const;

router.get('/', ...childOnly, asAuth(VouchersController.listVouchers));
router.post('/buy', ...childOnly, asAuth(VouchersController.buyVoucher));
router.get('/history', ...childOnly, asAuth(VouchersController.listRedemptions));

export default router;
