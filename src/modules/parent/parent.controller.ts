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

// GET /api/parent/children/:childId/pockets — read-only view
export async function getChildPockets(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await ParentService.getChildPockets(req.user.profileId, req.params.childId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// GET /api/parent/children/:childId/pockets/:pocketId — detail pocket anak
export async function getChildPocketDetail(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await ParentService.getChildPocketDetail(
      req.user.profileId,
      req.params.childId,
      req.params.pocketId,
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
