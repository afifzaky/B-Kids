import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as ChoresService from './chores.service';
import {
  createChoreSchema,
  updateChoreSchema,
  submitChoreSchema,
  rejectChoreSchema,
} from './chores.validator';

export async function listChores(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await ChoresService.listChores(req.user.profileId, req.user.role);
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

export async function createChore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createChoreSchema.parse(req.body);
    const data = await ChoresService.createChore(req.user.profileId, input);
    res.status(201).json({ success: true, message: 'Chore berhasil dibuat', data });
  } catch (error) { next(error); }
}

export async function updateChore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateChoreSchema.parse(req.body);
    const data = await ChoresService.updateChore(req.params.id, req.user.profileId, input);
    res.json({ success: true, message: 'Chore diperbarui', data });
  } catch (error) { next(error); }
}

export async function deleteChore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await ChoresService.deleteChore(req.params.id, req.user.profileId);
    res.json({ success: true, message: data.message });
  } catch (error) { next(error); }
}

export async function submitChore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = submitChoreSchema.parse(req.body);
    const data = await ChoresService.submitChore(req.params.id, req.user.profileId, input);
    res.json({ success: true, message: data.message });
  } catch (error) { next(error); }
}

export async function approveChore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await ChoresService.approveChore(req.params.id, req.user.profileId, req.user.sub);
    res.json({ success: true, message: data.message, data });
  } catch (error) { next(error); }
}

export async function rejectChore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = rejectChoreSchema.parse(req.body);
    const data = await ChoresService.rejectChore(req.params.id, req.user.profileId, input, req.user.sub);
    res.json({ success: true, message: data.message, data: { status: data.status } });
  } catch (error) { next(error); }
}
