import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';
import { asAuth } from '../../utils/as-auth';
import * as AdminController from './admin.controller';

const router = Router();

// Semua route admin: wajib token + role SUPER_ADMIN
router.use(verifyToken, checkRole('SUPER_ADMIN'));

// =============================================
// Platform Overview
// =============================================

// GET /api/admin/stats — statistik seluruh platform
router.get('/stats', asAuth(AdminController.getStats));

// =============================================
// Manajemen Akun Orang Tua
// =============================================

// GET  /api/admin/parents            — daftar semua parent (paginated + search)
// GET  /api/admin/parents/:parentId  — detail parent + semua anak
router.get('/parents', asAuth(AdminController.listParents));
router.get('/parents/:parentId', asAuth(AdminController.getParentDetail));

// PATCH /api/admin/parents/:parentId/status             — aktif / nonaktifkan akun
// POST  /api/admin/parents/:parentId/balance/adjust     — penyesuaian saldo manual
// GET   /api/admin/parents/:parentId/ledger             — riwayat transaksi parent
router.patch('/parents/:parentId/status', asAuth(AdminController.setParentStatus));
router.post('/parents/:parentId/balance/adjust', asAuth(AdminController.adjustBalance));
router.get('/parents/:parentId/ledger', asAuth(AdminController.getParentLedger));

// =============================================
// Manajemen Akun Anak
// =============================================

// GET   /api/admin/children/:childId         — detail anak + rekening + pockets
// PATCH /api/admin/children/:childId/status  — aktif / nonaktifkan akun anak
router.get('/children/:childId', asAuth(AdminController.getChildDetail));
router.patch('/children/:childId/status', asAuth(AdminController.setChildStatus));

// =============================================
// Audit Log
// =============================================

// GET /api/admin/audit-logs — riwayat semua aksi (filterable)
router.get('/audit-logs', asAuth(AdminController.getAuditLogs));

export default router;
