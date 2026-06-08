import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';
import { asAuth } from '../../utils/as-auth';
import * as AdminController from './admin.controller';
import * as AdminLearningController from './admin.learning.controller';

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

// GET   /api/admin/children                  — daftar semua anak (paginated + search)
// GET   /api/admin/children/:childId         — detail anak + rekening + pockets
// PATCH /api/admin/children/:childId/status  — aktif / nonaktifkan akun anak
router.get('/children', asAuth(AdminController.listChildren));
router.get('/children/:childId', asAuth(AdminController.getChildDetail));
router.patch('/children/:childId/status', asAuth(AdminController.setChildStatus));

// =============================================
// Audit Log
// =============================================

// GET /api/admin/audit-logs — riwayat semua aksi (filterable)
router.get('/audit-logs', asAuth(AdminController.getAuditLogs));

// =============================================
// Voucher Management
// =============================================

// GET    /api/admin/vouchers                   — list semua voucher (termasuk nonaktif, paginated)
// POST   /api/admin/vouchers                   — buat voucher baru
// PUT    /api/admin/vouchers/:voucherId         — update voucher
// DELETE /api/admin/vouchers/:voucherId         — hapus / soft-delete voucher
// GET    /api/admin/vouchers/redemptions        — riwayat semua redemption

// PENTING: route statis (/redemptions) harus di atas route dinamis (/:voucherId)
router.get('/vouchers/redemptions', asAuth(AdminController.listRedemptions));
router.get('/vouchers', asAuth(AdminController.listVouchers));
router.post('/vouchers', asAuth(AdminController.createVoucher));
router.put('/vouchers/:voucherId', asAuth(AdminController.updateVoucher));
router.delete('/vouchers/:voucherId', asAuth(AdminController.deleteVoucher));

// =============================================
// Infaq Management
// =============================================

// GET  /api/admin/infaq       — semua log infaq (filterable)
// GET  /api/admin/infaq/stats — statistik infaq per lembaga + periode
router.get('/infaq/stats', asAuth(AdminController.getInfaqStats));
router.get('/infaq', asAuth(AdminController.listInfaq));

// =============================================
// Infaq Institution Config Management
// =============================================

// GET   /api/admin/infaq/institutions                            — daftar lembaga (includeInactive=true untuk semua)
// POST  /api/admin/infaq/institutions                            — tambah lembaga baru
// PUT   /api/admin/infaq/institutions/:institutionId             — update data lembaga
// PATCH /api/admin/infaq/institutions/:institutionId/status      — aktifkan / nonaktifkan lembaga

// Statis sebelum dinamis
router.get('/infaq/institutions', asAuth(AdminController.listInstitutions));
router.post('/infaq/institutions', asAuth(AdminController.createInstitution));
router.put('/infaq/institutions/:institutionId', asAuth(AdminController.updateInstitution));
router.patch('/infaq/institutions/:institutionId/status', asAuth(AdminController.setInstitutionStatus));

// =============================================
// E-Learning Content Management
// =============================================

// GET  /api/admin/learning/stats                               — statistik engagement
// GET  /api/admin/learning/modules                             — daftar semua modul
// POST /api/admin/learning/modules                             — buat modul baru
// PUT  /api/admin/learning/modules/:moduleId                   — update modul
// DELETE /api/admin/learning/modules/:moduleId                 — hapus modul (hanya jika kosong)

router.get('/learning/stats', asAuth(AdminLearningController.getLearningStats));
router.get('/learning/modules', asAuth(AdminLearningController.listModules));
router.post('/learning/modules', asAuth(AdminLearningController.createModule));
router.put('/learning/modules/:moduleId', asAuth(AdminLearningController.updateModule));
router.delete('/learning/modules/:moduleId', asAuth(AdminLearningController.deleteModule));

// GET    /api/admin/learning/articles                          — daftar semua artikel
// POST   /api/admin/learning/articles                          — buat artikel baru
// GET    /api/admin/learning/articles/:articleId               — detail artikel + kuis
// PUT    /api/admin/learning/articles/:articleId               — update artikel
// DELETE /api/admin/learning/articles/:articleId               — hapus artikel + kuis
// PUT    /api/admin/learning/articles/:articleId/quiz          — buat atau ganti kuis
// DELETE /api/admin/learning/articles/:articleId/quiz          — hapus kuis dari artikel

router.get('/learning/articles', asAuth(AdminLearningController.listArticles));
router.post('/learning/articles', asAuth(AdminLearningController.createArticle));
router.get('/learning/articles/:articleId', asAuth(AdminLearningController.getArticleDetail));
router.put('/learning/articles/:articleId', asAuth(AdminLearningController.updateArticle));
router.delete('/learning/articles/:articleId', asAuth(AdminLearningController.deleteArticle));
router.put('/learning/articles/:articleId/quiz', asAuth(AdminLearningController.upsertQuiz));
router.delete('/learning/articles/:articleId/quiz', asAuth(AdminLearningController.deleteQuiz));

export default router;
