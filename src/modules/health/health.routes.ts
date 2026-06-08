import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';
import * as HealthController from './health.controller';

const router = Router();

// GET /health — publik, tidak perlu token
router.get('/', HealthController.publicHealth);

// GET /health/detailed — internal, SUPER_ADMIN saja
router.get('/detailed', verifyToken, checkRole('SUPER_ADMIN'), HealthController.detailedHealth);

export default router;
