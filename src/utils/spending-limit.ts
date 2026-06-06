import { SpendingLimitPeriod } from '@prisma/client';
import { prisma } from '../config/database';
import { SpendingLimitExceededError } from '../types';

const PERIOD_LABELS: Record<SpendingLimitPeriod, string> = {
  DAILY: 'harian',
  WEEKLY: 'mingguan',
  MONTHLY: 'bulanan',
};

function getPeriodStart(period: SpendingLimitPeriod): Date {
  const now = new Date();
  if (period === 'DAILY') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === 'WEEKLY') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    return d;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Cek apakah transaksi sebesar `amount` masih dalam spending limit anak.
 *
 * Spending dihitung dari AccountLedger (tabungan utama) DEBIT:
 *  - VOUCHER_PURCHASE — selalu dihitung kecuali ada limit per voucherType
 *  - INFAQ           — dihitung jika excludeInfaq = false
 *
 * @param voucherType - tipe voucher yang dibeli (null jika bukan voucher)
 * @param isInfaq     - true jika transaksi ini adalah infaq
 */
export async function assertWithinSpendingLimit(
  childProfileId: string,
  amount: bigint,
  isInfaq = false,
  voucherType: string | null = null,
): Promise<void> {
  const limits = await prisma.spendingLimit.findMany({
    where: { childProfileId, isActive: true },
  });

  if (limits.length === 0) return;

  const account = await prisma.childAccount.findUnique({ where: { childProfileId } });
  if (!account) return;

  for (const limit of limits) {
    // Infaq dikecualikan dari limit ini → skip
    if (isInfaq && limit.excludeInfaq) continue;

    // Limit per voucherType: hanya berlaku untuk tipe voucher yang sesuai
    if (limit.voucherType !== null) {
      if (!voucherType || voucherType !== limit.voucherType) continue;
    }

    const periodStart = getPeriodStart(limit.period);

    // Sumber yang dihitung: VOUCHER_PURCHASE + INFAQ (jika tidak dikecualikan)
    const sources: ('VOUCHER_PURCHASE' | 'INFAQ')[] = ['VOUCHER_PURCHASE'];
    if (!limit.excludeInfaq) sources.push('INFAQ');

    const result = await prisma.accountLedger.aggregate({
      _sum: { amount: true },
      where: {
        accountId: account.id,
        type: 'DEBIT',
        source: { in: sources },
        createdAt: { gte: periodStart },
      },
    });

    const alreadySpent = result._sum.amount ?? 0n;

    if (alreadySpent + amount > limit.limitAmount) {
      const sisa = Number(limit.limitAmount - alreadySpent) / 100;
      const label = limit.voucherType
        ? `${limit.voucherType.toLowerCase().replace('_', ' ')} ${PERIOD_LABELS[limit.period]}`
        : PERIOD_LABELS[limit.period];
      throw new SpendingLimitExceededError(
        `${label} (sisa Rp ${Math.max(0, sisa).toLocaleString('id-ID')})`,
      );
    }
  }
}
