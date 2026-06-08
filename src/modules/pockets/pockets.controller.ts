import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as PocketsService from './pockets.service';
import { createPocketSchema, updatePocketSchema, topupPocketSchema } from './pockets.validator';

export async function listPockets(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await PocketsService.listPockets(req.user.profileId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

export async function createPocket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createPocketSchema.parse(req.body);
    const data = await PocketsService.createPocket(req.user.profileId, input, req.user.sub);
    res.status(201).json({ success: true, message: 'Pocket berhasil dibuat', data });
  } catch (error) { next(error); }
}

export async function getPocket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await PocketsService.getPocket(req.params.id, req.user.profileId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

export async function updatePocket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updatePocketSchema.parse(req.body);
    const data = await PocketsService.updatePocket(req.params.id, req.user.profileId, input);
    res.json({ success: true, message: 'Pocket diperbarui', data });
  } catch (error) { next(error); }
}

export async function deletePocket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await PocketsService.deletePocket(req.params.id, req.user.profileId, req.user.sub);
    res.json({ success: true, message: data.message });
  } catch (error) { next(error); }
}

export async function topupPocket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { amount } = topupPocketSchema.parse(req.body);
    const data = await PocketsService.topupPocket(req.params.id, req.user.profileId, amount, req.user.sub);
    res.json({ success: true, message: `Rp ${amount.toLocaleString('id-ID')} berhasil dialokasikan ke pocket`, data });
  } catch (error) { next(error); }
}
