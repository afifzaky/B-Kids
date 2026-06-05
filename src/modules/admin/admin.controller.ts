import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import {
  searchParentsSchema,
  adjustBalanceSchema,
  setStatusSchema,
  auditLogQuerySchema,
  paginationSchema,
} from './admin.validator';
import * as AdminService from './admin.service';

// GET /api/admin/stats
export async function getStats(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await AdminService.getPlatformStats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/parents
export async function listParents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = searchParentsSchema.parse(req.query);
    const data = await AdminService.listParents(input);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/parents/:parentId
export async function getParentDetail(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await AdminService.getParentDetail(req.params.parentId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/parents/:parentId/status
export async function setParentStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { isActive, reason } = setStatusSchema.parse(req.body);
    const data = await AdminService.setParentStatus(
      req.params.parentId,
      isActive,
      req.user.sub,
      reason,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/parents/:parentId/balance/adjust
export async function adjustBalance(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = adjustBalanceSchema.parse(req.body);
    const data = await AdminService.adjustParentBalance(
      req.params.parentId,
      input,
      req.user.sub,
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/parents/:parentId/ledger
export async function getParentLedger(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const data = await AdminService.getParentLedger(req.params.parentId, page, limit);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/children/:childId
export async function getChildDetail(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await AdminService.getChildDetail(req.params.childId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/children/:childId/status
export async function setChildStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { isActive, reason } = setStatusSchema.parse(req.body);
    const data = await AdminService.setChildStatus(
      req.params.childId,
      isActive,
      req.user.sub,
      reason,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/audit-logs
export async function getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = auditLogQuerySchema.parse(req.query);
    const data = await AdminService.getAuditLogs(input);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}
