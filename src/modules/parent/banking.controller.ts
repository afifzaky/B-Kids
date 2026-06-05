import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as BankingService from './banking.service';
import {
  depositSchema,
  transferToChildSchema,
  transactionQuerySchema,
} from './banking.validator';

// GET /api/parent/banking/account
export async function getAccount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await BankingService.getParentAccount(req.user.profileId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// GET /api/parent/banking/transactions
export async function getTransactions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit } = transactionQuerySchema.parse(req.query);
    const data = await BankingService.getParentTransactions(req.user.profileId, page, limit);
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
}

// POST /api/parent/banking/deposit
export async function deposit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = depositSchema.parse(req.body);
    const data = await BankingService.depositToParentAccount(
      req.user.profileId,
      input,
      req.user.sub,
    );
    res.status(201).json({
      success: true,
      message: `Deposit Rp ${input.amount.toLocaleString('id-ID')} berhasil`,
      data,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/parent/banking/transfer
export async function transfer(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = transferToChildSchema.parse(req.body);
    const data = await BankingService.transferToChild(
      req.user.profileId,
      input,
      req.user.sub,
    );
    res.status(201).json({
      success: true,
      message: `Transfer Rp ${input.amount.toLocaleString('id-ID')} ke ${data.recipient.fullName} berhasil`,
      data,
    });
  } catch (error) {
    next(error);
  }
}
