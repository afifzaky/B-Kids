import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';
import { asAuth } from '../../utils/as-auth';
import * as LimitsController from './limits.controller';

const router = Router();


router.get('/:childId', verifyToken, checkRole('PARENT'), asAuth(LimitsController.getLimits));
router.put('/:childId', verifyToken, checkRole('PARENT'), asAuth(LimitsController.setLimits));
router.post('/:childId/category', verifyToken, checkRole('PARENT'), asAuth(LimitsController.setCategoryLimit));

export default router;
