import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as FamilyService from './family.service';

export async function getChildren(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await FamilyService.getChildren(req.user.profileId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
