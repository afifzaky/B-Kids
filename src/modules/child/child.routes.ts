import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';
import { asAuth } from '../../utils/as-auth';
import * as ChildController from './child.controller';

const router = Router();
const childOnly = [verifyToken, checkRole('CHILD')] as const;

// GET   /api/child/dashboard      — ringkasan: saldo, pocket, chores pending, transaksi terakhir
// GET   /api/child/profile        — data profil anak
// GET   /api/child/account        — rekening tabungan utama + spending limits
// GET   /api/child/transactions   — riwayat transaksi tabungan utama (paginated)
// GET   /api/child/pockets        — semua pocket saving goals anak
// PATCH /api/child/avatar         — anak ubah avatar sendiri (emoji atau URL)
router.get('/dashboard', ...childOnly, asAuth(ChildController.getDashboard));
router.get('/profile', ...childOnly, asAuth(ChildController.getProfile));
router.get('/account', ...childOnly, asAuth(ChildController.getAccount));
router.get('/transactions', ...childOnly, asAuth(ChildController.getTransactions));
router.get('/pockets', ...childOnly, asAuth(ChildController.getPockets));
router.patch('/avatar', ...childOnly, asAuth(ChildController.updateAvatar));

export default router;
