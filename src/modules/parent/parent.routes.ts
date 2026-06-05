import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';
import { asAuth } from '../../utils/as-auth';
import * as ParentController from './parent.controller';
import * as BankingController from './banking.controller';

const router = Router();

// Semua route di sini membutuhkan token + role PARENT
router.use(verifyToken, checkRole('PARENT'));

// =============================================
// Monitoring Anak
// =============================================

// GET /api/parent/summary/:childId
router.get('/summary/:childId', asAuth(ParentController.getChildSummary));

// =============================================
// Banking Orang Tua
// =============================================

// GET /api/parent/banking/account       — ringkasan rekening + saldo
// GET /api/parent/banking/transactions  — riwayat transaksi (paginated)
// POST /api/parent/banking/deposit      — top-up saldo (simulasi BSI)
// POST /api/parent/banking/transfer     — kirim ke rekening anak

router.get('/banking/account', asAuth(BankingController.getAccount));
router.get('/banking/transactions', asAuth(BankingController.getTransactions));
router.post('/banking/deposit', asAuth(BankingController.deposit));
router.post('/banking/transfer', asAuth(BankingController.transfer));

export default router;
