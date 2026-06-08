import { Router } from 'express';
import multer from 'multer';
import { verifyToken } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';
import { asAuth } from '../../utils/as-auth';
import * as ChoresController from './chores.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Kedua role bisa list (auto-filter di service)
router.get('/', verifyToken, asAuth(ChoresController.listChores));

// Parent only
router.post('/', verifyToken, checkRole('PARENT'), asAuth(ChoresController.createChore));
router.put('/:id', verifyToken, checkRole('PARENT'), asAuth(ChoresController.updateChore));
router.delete('/:id', verifyToken, checkRole('PARENT'), asAuth(ChoresController.deleteChore));
router.patch('/:id/approve', verifyToken, checkRole('PARENT'), asAuth(ChoresController.approveChore));
router.patch('/:id/reject', verifyToken, checkRole('PARENT'), asAuth(ChoresController.rejectChore));

// Child only
router.post('/:choreId/upload-evidence', verifyToken, checkRole('CHILD'), upload.single('file'), asAuth(ChoresController.uploadEvidence));
router.post('/:id/submit', verifyToken, checkRole('CHILD'), asAuth(ChoresController.submitChore));

export default router;
