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
    const dow = d.getDay(); // 0=Minggu
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1)); // mundur ke Senin
    return d;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Cek apakah transaksi sebesar `amount` masih dalam batas spending limit anak.
 * Spending dihitung dari PocketLedger DEBIT (VOUCHER_PURCHASE + INFAQ jika tidak dikecualikan).
 *
 * @param isInfaq - true jika transaksi ini adalah infaq (untuk menerapkan excludeInfaq)
 */
export async function assertWithinSpendingLimit(
  childProfileId: string,
  amount: bigint,
  isInfaq = false,
): Promise<void> {
  const limits = await prisma.spendingLimit.findMany({
    where: { childProfileId, isActive: true },
  });

  if (limits.length === 0) return;

  const account = await prisma.childAccount.findUnique({
    where: { childProfileId },
    include: { pockets: { select: { id: true } } },
  });

  if (!account || account.pockets.length === 0) return;

  const pocketIds = account.pockets.map(p => p.id);

  for (const limit of limits) {
    // Jika infaq dikecualikan dari limit DAN ini adalah transaksi infaq → skip
    if (isInfaq && limit.excludeInfaq) continue;

    const periodStart = getPeriodStart(limit.period);

    // Hitung pengeluaran aktual (voucher + infaq jika dihitung)
    const sources = limit.excludeInfaq
      ? (['VOUCHER_PURCHASE'] as const)
      : (['VOUCHER_PURCHASE', 'INFAQ'] as const);

    const result = await prisma.pocketLedger.aggregate({
      _sum: { amount: true },
      where: {
        pocketId: { in: pocketIds },
        type: 'DEBIT',
        source: { in: [...sources] },
        createdAt: { gte: periodStart },
      },
    });

    const alreadySpent = result._sum.amount ?? BigInt(0);

    if (alreadySpent + amount > limit.limitAmount) {
      const sisa = Number(limit.limitAmount - alreadySpent) / 100;
      throw new SpendingLimitExceededError(
        `${PERIOD_LABELS[limit.period]} (sisa Rp ${sisa.toLocaleString('id-ID')})`,
      );
    }
  }
}
