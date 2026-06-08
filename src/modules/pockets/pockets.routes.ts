import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';
import { asAuth } from '../../utils/as-auth';
import * as PocketsController from './pockets.controller';

const router = Router();
const childOnly = [verifyToken, checkRole('CHILD')] as const;

router.get('/', ...childOnly, asAuth(PocketsController.listPockets));
router.post('/', ...childOnly, asAuth(PocketsController.createPocket));
router.get('/:id', ...childOnly, asAuth(PocketsController.getPocket));
router.put('/:id', ...childOnly, asAuth(PocketsController.updatePocket));
router.delete('/:id', ...childOnly, asAuth(PocketsController.deletePocket));
router.post('/:id/topup', ...childOnly, asAuth(PocketsController.topupPocket));

export default router;
