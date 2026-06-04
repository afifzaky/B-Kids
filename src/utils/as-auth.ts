import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

export function asAuth(
  handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) =>
    handler(req as AuthenticatedRequest, res, next);
}
