import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as ParentService from './parent.service';

export async function getChildSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await ParentService.getChildSummary(req.user.profileId, req.params.childId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
