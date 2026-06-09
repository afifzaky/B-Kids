import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { AppError, InsufficientBalanceError, NotFoundError } from '../../types';
import { assertWithinSpendingLimit } from '../../utils/spending-limit';
import type { BuyVoucherInput } from './vouchers.validator';

export async function listVouchers(category?: string) {
  const now = new Date();
  const vouchers = await prisma.voucherCatalog.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
      OR: [{ validFrom: null }, { validFrom: { lte: now } }],
      AND: [
        { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
        { OR: [{ stock: null }, { stock: { gt: 0 } }] },
      ],
    },
    orderBy: [{ category: 'asc' }, { price: 'asc' }],
  });

  return vouchers.map(v => ({
    id: v.id,
    name: v.name,
    provider: v.provider,
    category: v.category,
    voucherType: v.voucherType,
    price: Number(v.price) / 100,
    faceValue: v.faceValue ? Number(v.faceValue) / 100 : null,
    description: v.description,
    imageUrl: v.imageUrl,
    stock: v.stock,
    validUntil: v.validUntil,
  }));
}

// Voucher dibeli dari Tabungan Utama (ChildAccount.balance)
// Pocket adalah saving goals — BUKAN untuk transaksi
export async function buyVoucher(
  childProfileId: string,
  input: BuyVoucherInput,
  triggeredBy: string,
) {
  const now = new Date();

  const [voucher, account, childProfile] = await Promise.all([
    prisma.voucherCatalog.findFirst({ where: { id: input.voucherId, isActive: true } }),
    prisma.childAccount.findUnique({ where: { childProfileId } }),
    prisma.childProfile.findUnique({ where: { id: childProfileId }, select: { pinHash: true } }),
  ]);

  if (!voucher) throw new NotFoundError('Voucher');
  if (!account) throw new NotFoundError('Rekening anak');

  if (!childProfile?.pinHash) throw new AppError('Data profil anak tidak ditemukan', 404, 'CHILD_NOT_FOUND');
  const pinValid = await bcrypt.compare(input.pin, childProfile.pinHash);
  if (!pinValid) throw new AppError('PIN salah', 401, 'INVALID_PIN');

  if (voucher.validFrom && now < voucher.validFrom)
    throw new AppError('Voucher belum berlaku', 422, 'VOUCHER_NOT_YET_VALID');
  if (voucher.validUntil && now > voucher.validUntil)
    throw new AppError('Voucher sudah kadaluarsa', 422, 'VOUCHER_EXPIRED');
  if (voucher.stock !== null && voucher.stock <= 0)
    throw new AppError('Stok voucher habis', 422, 'VOUCHER_OUT_OF_STOCK');

  if (voucher.maxPerChild !== null) {
    const count = await prisma.voucherRedemption.count({
      where: { childProfileId, voucherId: voucher.id },
    });
    if (count >= voucher.maxPerChild) {
      throw new AppError(
        `Batas pembelian voucher ini sudah tercapai (maks. ${voucher.maxPerChild}x)`,
        422,
        'VOUCHER_MAX_PER_CHILD_REACHED',
      );
    }
  }

  if (account.balance < voucher.price) throw new InsufficientBalanceError();

  // Cek spending limit dari tabungan utama (bukan pocket)
  await assertWithinSpendingLimit(childProfileId, voucher.price, false, voucher.voucherType);

  const newBalance = account.balance - voucher.price;
  const uniqueCode = `${voucher.mockCode}-${childProfileId.slice(0, 8).toUpperCase()}-${Date.now()}`;

  const redemption = await prisma.$transaction(async tx => {
    await tx.childAccount.update({
      where: { id: account.id },
      data: { balance: newBalance },
    });

    await tx.accountLedger.create({
      data: {
        accountId: account.id,
        type: 'DEBIT',
        source: 'VOUCHER_PURCHASE',
        amount: voucher.price,
        balanceAfter: newBalance,
        referenceId: voucher.id,
        triggeredBy,
        notes: `Beli voucher: ${voucher.name}`,
      },
    });

    if (voucher.stock !== null) {
      await tx.voucherCatalog.update({
        where: { id: voucher.id },
        data: { stock: { decrement: 1 } },
      });
    }

    return tx.voucherRedemption.create({
      data: {
        childProfileId,
        voucherId: voucher.id,
        amount: voucher.price,
        mockCodeIssued: uniqueCode,
      },
    });
  });

  return {
    id: redemption.id,
    voucher: {
      id: voucher.id,
      name: voucher.name,
      provider: voucher.provider,
      voucherType: voucher.voucherType,
    },
    amount: Number(voucher.price) / 100,
    faceValue: voucher.faceValue ? Number(voucher.faceValue) / 100 : null,
    redemptionCode: redemption.mockCodeIssued,
    newTabunganBalance: Number(newBalance) / 100,
    redeemedAt: redemption.redeemedAt,
    instruction: getVoucherInstruction(voucher.voucherType),
  };
}

function getVoucherInstruction(voucherType: string): string {
  const map: Record<string, string> = {
    DISCOUNT: 'Salin kode dan masukkan di kolom "Kode Voucher" saat checkout.',
    GAME_TOPUP: 'Masukkan kode di menu Top-Up aplikasi game kamu.',
    E_WALLET: 'Buka aplikasi e-wallet, pilih "Masukkan Kode", lalu tempel kode ini.',
    EDUCATION: 'Login ke platform edukasi, masukkan kode di bagian "Redeem Voucher".',
  };
  return map[voucherType] ?? 'Gunakan kode ini sesuai petunjuk platform tujuan.';
}

export async function listRedemptions(childProfileId: string) {
  const redemptions = await prisma.voucherRedemption.findMany({
    where: { childProfileId },
    include: {
      voucher: { select: { name: true, provider: true, category: true, voucherType: true } },
    },
    orderBy: { redeemedAt: 'desc' },
  });

  return redemptions.map(r => ({
    id: r.id,
    voucher: r.voucher,
    amount: Number(r.amount) / 100,
    redemptionCode: r.mockCodeIssued,
    redeemedAt: r.redeemedAt,
  }));
}
