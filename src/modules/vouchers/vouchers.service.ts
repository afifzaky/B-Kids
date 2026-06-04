import { prisma } from '../../config/database';
import { InsufficientBalanceError, NotFoundError } from '../../types';
import { assertWithinSpendingLimit } from '../../utils/spending-limit';
import type { BuyVoucherInput } from './vouchers.validator';

export async function listVouchers(category?: string) {
  const vouchers = await prisma.voucherCatalog.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
    },
    orderBy: [{ category: 'asc' }, { price: 'asc' }],
  });

  return vouchers.map(v => ({
    id: v.id,
    name: v.name,
    provider: v.provider,
    category: v.category,
    price: Number(v.price) / 100,
    description: v.description,
    imageUrl: v.imageUrl,
  }));
}

export async function buyVoucher(
  childProfileId: string,
  input: BuyVoucherInput,
  triggeredBy: string,
) {
  const voucher = await prisma.voucherCatalog.findFirst({
    where: { id: input.voucherId, isActive: true },
  });
  if (!voucher) throw new NotFoundError('Voucher');

  const account = await prisma.childAccount.findUnique({ where: { childProfileId } });
  if (!account) throw new NotFoundError('Rekening anak');

  const pocket = await prisma.pocket.findFirst({
    where: { id: input.sourcePocketId, accountId: account.id, isActive: true },
  });
  if (!pocket) throw new NotFoundError('Pocket');

  if (pocket.balance < voucher.price) throw new InsufficientBalanceError();

  // Cek spending limit sebelum transaksi
  await assertWithinSpendingLimit(childProfileId, voucher.price, false);

  const redemption = await prisma.$transaction(async tx => {
    const newPocketBalance = pocket.balance - voucher.price;

    await tx.pocket.update({
      where: { id: pocket.id },
      data: { balance: newPocketBalance },
    });

    await tx.pocketLedger.create({
      data: {
        pocketId: pocket.id,
        type: 'DEBIT',
        source: 'VOUCHER_PURCHASE',
        amount: voucher.price,
        balanceAfter: newPocketBalance,
        referenceId: voucher.id,
        triggeredBy,
        notes: `Beli voucher: ${voucher.name}`,
      },
    });

    return tx.voucherRedemption.create({
      data: {
        childProfileId,
        voucherId: voucher.id,
        sourcePocketId: pocket.id,
        amount: voucher.price,
        mockCodeIssued: voucher.mockCode,
      },
    });
  });

  return {
    id: redemption.id,
    voucher: {
      id: voucher.id,
      name: voucher.name,
      provider: voucher.provider,
    },
    amount: Number(voucher.price) / 100,
    mockCode: redemption.mockCodeIssued,
    redeemedAt: redemption.redeemedAt,
  };
}

export async function listRedemptions(childProfileId: string) {
  const redemptions = await prisma.voucherRedemption.findMany({
    where: { childProfileId },
    include: {
      voucher: { select: { name: true, provider: true, category: true } },
    },
    orderBy: { redeemedAt: 'desc' },
  });

  return redemptions.map(r => ({
    id: r.id,
    voucher: r.voucher,
    amount: Number(r.amount) / 100,
    mockCode: r.mockCodeIssued,
    sourcePocketId: r.sourcePocketId,
    redeemedAt: r.redeemedAt,
  }));
}
