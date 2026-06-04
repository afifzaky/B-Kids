import { Role } from '@prisma/client';
import { Request } from 'express';

// =============================================
// JWT Payload
// =============================================

export interface JwtPayload {
  sub: string;      // user.id
  role: Role;
  profileId: string; // parent_profile.id atau child_profile.id
  iat?: number;
  exp?: number;
}

// =============================================
// Express Request dengan user terautentikasi
// =============================================

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

// =============================================
// API Response Standar
// =============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// =============================================
// Money helpers — semua saldo disimpan dalam sen
// Rp 10.000 = 1_000_000 sen
// Konversi: Rp → sen = * 100, sen → Rp = / 100
// =============================================

export type Rupiah = bigint; // dalam sen

export function toRupiah(sen: bigint): number {
  return Number(sen) / 100;
}

export function toSen(rupiah: number): bigint {
  return BigInt(Math.round(rupiah * 100));
}

export function formatRupiah(sen: bigint): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(sen) / 100);
}

// =============================================
// Error types
// =============================================

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message = 'Tidak terautentikasi') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Akses ditolak') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(entity = 'Data') {
    super(`${entity} tidak ditemukan`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class InsufficientBalanceError extends AppError {
  constructor() {
    super('Saldo tidak mencukupi', 422, 'INSUFFICIENT_BALANCE');
    this.name = 'InsufficientBalanceError';
  }
}

export class SpendingLimitExceededError extends AppError {
  constructor(period: string) {
    super(`Limit pengeluaran ${period} terlampaui`, 422, 'SPENDING_LIMIT_EXCEEDED');
    this.name = 'SpendingLimitExceededError';
  }
}
