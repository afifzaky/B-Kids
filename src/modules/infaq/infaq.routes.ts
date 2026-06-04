import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';
import { asAuth } from '../../utils/as-auth';
import * as InfaqController from './infaq.controller';

const router = Router();
const childOnly = [verifyToken, checkRole('CHILD')] as const;

router.post('/', ...childOnly, asAuth(InfaqController.createInfaq));
router.get('/', ...childOnly, asAuth(InfaqController.listInfaq));

export default router;
