import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';
import { asAuth } from '../../utils/as-auth';
import * as ParentController from './parent.controller';

const router = Router();

// GET /api/parent/summary/:childId
router.get(
  '/summary/:childId',
  verifyToken,
  checkRole('PARENT'),
  asAuth(ParentController.getChildSummary),
);

export default router;
