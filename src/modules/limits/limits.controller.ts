import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as LimitsService from './limits.service';
import { setLimitsSchema } from './limits.validator';

export async function getLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await LimitsService.getLimits(req.user.profileId, req.params.childId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

export async function setLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = setLimitsSchema.parse(req.body);
    const data = await LimitsService.setLimits(
      req.user.profileId,
      req.params.childId,
      input,
      req.user.sub,
    );
    res.json({ success: true, message: 'Limit berhasil diperbarui', data });
  } catch (error) { next(error); }
}
