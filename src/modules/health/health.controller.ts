import { Request, Response, NextFunction } from 'express';
import { getPublicHealthSummary, getHealthReport } from './health.service';

// GET /health — publik, response ringkas
export async function publicHealth(_req: Request, res: Response, next: NextFunction) {
  try {
    const report = await getPublicHealthSummary();
    const httpStatus = report.status === 'down' ? 503 : report.status === 'degraded' ? 207 : 200;
    res.status(httpStatus).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

// GET /health/detailed — admin only, full report
export async function detailedHealth(_req: Request, res: Response, next: NextFunction) {
  try {
    const report = await getHealthReport();
    const httpStatus = report.status === 'down' ? 503 : report.status === 'degraded' ? 207 : 200;
    res.status(httpStatus).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}
