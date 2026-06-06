import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import {
  searchParentsSchema,
  adjustBalanceSchema,
  setStatusSchema,
  auditLogQuerySchema,
  paginationSchema,
  createVoucherSchema,
  updateVoucherSchema,
  voucherQuerySchema,
  infaqQuerySchema,
  createInstitutionSchema,
  updateInstitutionSchema,
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

// =============================================
// Voucher Management
// =============================================

// GET /api/admin/vouchers
export async function listVouchers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = voucherQuerySchema.parse(req.query);
    const data = await AdminService.listAdminVouchers(input);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/vouchers
export async function createVoucher(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = createVoucherSchema.parse(req.body);
    const data = await AdminService.createVoucher(input, req.user.sub);
    res.status(201).json({ success: true, message: 'Voucher berhasil dibuat', data });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/vouchers/:voucherId
export async function updateVoucher(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = updateVoucherSchema.parse(req.body);
    const data = await AdminService.updateVoucher(req.params.voucherId, input, req.user.sub);
    res.json({ success: true, message: 'Voucher berhasil diperbarui', data });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/vouchers/:voucherId
export async function deleteVoucher(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await AdminService.deleteVoucher(req.params.voucherId, req.user.sub);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/vouchers/redemptions
export async function listRedemptions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const voucherId = typeof req.query.voucherId === 'string' ? req.query.voucherId : undefined;
    const data = await AdminService.listVoucherRedemptions(page, limit, voucherId);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

// =============================================
// Infaq Management
// =============================================

// GET /api/admin/infaq
export async function listInfaq(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = infaqQuerySchema.parse(req.query);
    const data = await AdminService.listAdminInfaq(input);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/infaq/stats
export async function getInfaqStats(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await AdminService.getInfaqStats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// =============================================
// Infaq Institution Config Management
// =============================================

// GET /api/admin/infaq/institutions
export async function listInstitutions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const data = await AdminService.listAdminInstitutions(includeInactive);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/infaq/institutions
export async function createInstitution(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = createInstitutionSchema.parse(req.body);
    const data = await AdminService.createInstitution(input, req.user.sub);
    res.status(201).json({ success: true, message: 'Lembaga infaq berhasil dibuat', data });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/infaq/institutions/:institutionId
export async function updateInstitution(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = updateInstitutionSchema.parse(req.body);
    const data = await AdminService.updateInstitution(req.params.institutionId, input, req.user.sub);
    res.json({ success: true, message: 'Lembaga infaq berhasil diperbarui', data });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/infaq/institutions/:institutionId/status
export async function setInstitutionStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { isActive } = setStatusSchema.parse(req.body);
    const data = await AdminService.setInstitutionStatus(req.params.institutionId, isActive, req.user.sub);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
