import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as ChildService from './child.service';

export async function getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await ChildService.getChildDashboard(req.user.profileId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await ChildService.getChildProfile(req.user.profileId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await ChildService.getChildAccount(req.user.profileId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const result = await ChildService.getChildTransactions(req.user.profileId, page, limit);
    res.json({ success: true, message: 'Riwayat transaksi berhasil diambil', ...result });
  } catch (err) { next(err); }
}

export async function getPockets(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await ChildService.getChildPockets(req.user.profileId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function updateAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { avatar } = req.body as { avatar: string };
    if (!avatar || typeof avatar !== 'string' || avatar.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Avatar wajib diisi', code: 'VALIDATION_ERROR' });
      return;
    }
    const data = await ChildService.updateChildAvatar(req.user.profileId, avatar.trim());
    res.json({ success: true, message: 'Avatar berhasil diperbarui', data });
  } catch (err) { next(err); }
}
