import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';
import { asAuth } from '../../utils/as-auth';
import * as FamilyController from './family.controller';

const router = Router();

// GET /api/family/children
router.get('/children', verifyToken, checkRole('PARENT'), asAuth(FamilyController.getChildren));

export default router;
