// Mock AdminService entirely — controller tests only check request parsing + response shape
jest.mock('../modules/admin/admin.service');

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as AdminService from '../modules/admin/admin.service';
import {
  getStats,
  listParents,
  getParentDetail,
  setParentStatus,
  adjustBalance,
  getChildDetail,
  getAuditLogs,
  listVouchers,
  createVoucher,
  deleteVoucher,
  listInfaq,
  getInfaqStats,
  listInstitutions,
  createInstitution,
} from '../modules/admin/admin.controller';

const mockService = AdminService as jest.Mocked<typeof AdminService>;

function mockReq(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
  return {
    query: {},
    params: {},
    body: {},
    user: { sub: 'admin-1', role: 'SUPER_ADMIN', profileId: '' },
    ...overrides,
  } as unknown as AuthenticatedRequest;
}

function mockRes(): jest.Mocked<Response> {
  const res: Partial<jest.Mocked<Response>> = {};
  res.json   = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res as jest.Mocked<Response>;
}

const next: NextFunction = jest.fn();

beforeEach(() => jest.clearAllMocks());

// =============================================
describe('getStats', () => {
  it('returns 200 with platform stats', async () => {
    (mockService.getPlatformStats as jest.Mock).mockResolvedValue({ totalParents: 5 });
    const res = mockRes();
    await getStats(mockReq(), res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { totalParents: 5 } });
  });

  it('calls next on service error', async () => {
    (mockService.getPlatformStats as jest.Mock).mockRejectedValue(new Error('DB error'));
    await getStats(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// =============================================
describe('listParents', () => {
  it('returns list with default pagination', async () => {
    (mockService.listParents as jest.Mock).mockResolvedValue({ data: [], meta: {} });
    const res = mockRes();
    await listParents(mockReq({ query: { page: '1', limit: '20' } as unknown as Request['query'] }), res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [], meta: {} });
  });

  it('passes search param to service', async () => {
    (mockService.listParents as jest.Mock).mockResolvedValue({ data: [], meta: {} });
    const req = mockReq({ query: { search: 'budi', page: '1', limit: '20' } as unknown as Request['query'] });
    await listParents(req, mockRes(), next);
    expect(mockService.listParents).toHaveBeenCalledWith(expect.objectContaining({ search: 'budi' }));
  });
});

// =============================================
describe('getParentDetail', () => {
  it('returns parent detail by ID', async () => {
    (mockService.getParentDetail as jest.Mock).mockResolvedValue({ id: 'parent-1', fullName: 'Budi' });
    const res = mockRes();
    await getParentDetail(mockReq({ params: { parentId: 'parent-1' } }), res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: expect.objectContaining({ id: 'parent-1' }) });
  });
});

// =============================================
describe('setParentStatus', () => {
  it('activates a parent account', async () => {
    (mockService.setParentStatus as jest.Mock).mockResolvedValue({ isActive: true });
    const res = mockRes();
    const req = mockReq({ params: { parentId: 'parent-1' }, body: { isActive: true } });
    await setParentStatus(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { isActive: true } });
  });

  it('calls next on validation error', async () => {
    const req = mockReq({ params: { parentId: 'parent-1' }, body: { isActive: 'notabool' } });
    await setParentStatus(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

// =============================================
describe('adjustBalance', () => {
  it('returns 201 on successful balance adjustment', async () => {
    (mockService.adjustParentBalance as jest.Mock).mockResolvedValue({ newBalance: 1000000 });
    const res = mockRes();
    const req = mockReq({
      params: { parentId: 'parent-1' },
      body: { amount: 50000, type: 'CREDIT', notes: 'topup' },
    });
    await adjustBalance(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { newBalance: 1000000 } });
  });
});

// =============================================
describe('getChildDetail', () => {
  it('returns child data', async () => {
    (mockService.getChildDetail as jest.Mock).mockResolvedValue({ id: 'child-1', fullName: 'Aisha' });
    const res = mockRes();
    await getChildDetail(mockReq({ params: { childId: 'child-1' } }), res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: expect.objectContaining({ id: 'child-1' }) });
  });
});

// =============================================
describe('getAuditLogs', () => {
  it('returns audit logs list', async () => {
    (mockService.getAuditLogs as jest.Mock).mockResolvedValue({ data: [], meta: {} });
    const res = mockRes();
    await getAuditLogs(mockReq({ query: { page: '1', limit: '20' } as unknown as Request['query'] }), res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [], meta: {} });
  });
});

// =============================================
describe('listVouchers', () => {
  it('returns voucher list', async () => {
    (mockService.listAdminVouchers as jest.Mock).mockResolvedValue({ data: [], meta: {} });
    const res = mockRes();
    await listVouchers(mockReq({ query: { page: '1' } as unknown as Request['query'] }), res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [], meta: {} });
  });
});

// =============================================
describe('createVoucher', () => {
  it('creates a voucher and returns 201', async () => {
    (mockService.createVoucher as jest.Mock).mockResolvedValue({ id: 'voucher-1' });
    const res = mockRes();
    const req = mockReq({
      body: {
        name: 'Game Topup 50K',
        provider: 'Garena',
        category: 'Games',
        voucherType: 'GAME_TOPUP',
        price: 50000,
        stock: 10,
      },
    });
    await createVoucher(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

// =============================================
describe('deleteVoucher', () => {
  it('deletes voucher by ID', async () => {
    (mockService.deleteVoucher as jest.Mock).mockResolvedValue({ message: 'Voucher dihapus' });
    const res = mockRes();
    await deleteVoucher(mockReq({ params: { voucherId: 'v-1' } }), res, next);
    // Controller uses spread: { success: true, ...data }
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Voucher dihapus' });
  });
});

// =============================================
describe('listInfaq', () => {
  it('returns infaq list', async () => {
    (mockService.listAdminInfaq as jest.Mock).mockResolvedValue({ data: [], meta: {} });
    const res = mockRes();
    await listInfaq(mockReq({ query: { page: '1', limit: '20' } as unknown as Request['query'] }), res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [], meta: {} });
  });
});

// =============================================
describe('getInfaqStats', () => {
  it('returns infaq stats', async () => {
    (mockService.getInfaqStats as jest.Mock).mockResolvedValue({ totalAmount: 500000 });
    const res = mockRes();
    await getInfaqStats(mockReq(), res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { totalAmount: 500000 } });
  });
});

// =============================================
describe('listInstitutions', () => {
  it('returns institution list', async () => {
    (mockService.listAdminInstitutions as jest.Mock).mockResolvedValue([{ id: 'inst-1' }]);
    const res = mockRes();
    await listInstitutions(
      mockReq({ query: { includeInactive: 'false' } as unknown as Request['query'] }),
      res,
      next,
    );
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 'inst-1' }] });
  });
});

// =============================================
describe('createInstitution', () => {
  it('creates institution and returns 201', async () => {
    (mockService.createInstitution as jest.Mock).mockResolvedValue({ id: 'inst-1', name: 'Yayasan A' });
    const res = mockRes();
    const req = mockReq({ body: { code: 'YAYASAN_A', name: 'Yayasan A', description: 'Yayasan amal' } });
    await createInstitution(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
