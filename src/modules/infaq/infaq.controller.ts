import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as InfaqService from './infaq.service';
import { createInfaqSchema } from './infaq.validator';

export async function createInfaq(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createInfaqSchema.parse(req.body);
    const data = await InfaqService.createInfaq(req.user.profileId, input, req.user.sub);
    res.status(201).json({
      success: true,
      message: 'Infaq berhasil dikirim. Semoga Allah menerima sedekahmu. 🤲',
      data,
    });
  } catch (error) { next(error); }
}

export async function listInfaq(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await InfaqService.listInfaq(req.user.profileId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
}
