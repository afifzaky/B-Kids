import { SpendingLimitPeriod } from '@prisma/client';
import { prisma } from '../../config/database';
import { ForbiddenError } from '../../types';
import { validateFamilyAccess } from '../../middleware/role';
import type { SetLimitsInput } from './limits.validator';

type PeriodKey = 'daily' | 'weekly' | 'monthly';

const PERIOD_MAP: Record<PeriodKey, SpendingLimitPeriod> = {
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
};

export async function getLimits(parentProfileId: string, childProfileId: string) {
  const hasAccess = await validateFamilyAccess(parentProfileId, childProfileId);
  if (!hasAccess) throw new ForbiddenError('Anak tidak terdaftar dalam keluarga Anda');

  const limits = await prisma.spendingLimit.findMany({
    where: { childProfileId, isActive: true },
    orderBy: { period: 'asc' },
  });

  return limits.map(l => ({
    id: l.id,
    period: l.period,
    limitAmount: Number(l.limitAmount) / 100,
    excludeInfaq: l.excludeInfaq,
    updatedAt: l.updatedAt,
  }));
}

export async function setLimits(
  parentProfileId: string,
  childProfileId: string,
  input: SetLimitsInput,
  triggeredBy: string,
) {
  const hasAccess = await validateFamilyAccess(parentProfileId, childProfileId);
  if (!hasAccess) throw new ForbiddenError('Anak tidak terdaftar dalam keluarga Anda');

  await prisma.$transaction(async tx => {
    for (const [key, period] of Object.entries(PERIOD_MAP) as [PeriodKey, SpendingLimitPeriod][]) {
      const amount = input[key];
      if (amount === undefined) continue;

      if (amount === null) {
        await tx.spendingLimit.updateMany({
          where: { childProfileId, period, isActive: true },
          data: { isActive: false },
        });
      } else {
        const existing = await tx.spendingLimit.findFirst({
          where: { childProfileId, period },
        });

        if (existing) {
          await tx.spendingLimit.update({
            where: { id: existing.id },
            data: {
              limitAmount: BigInt(Math.round(amount * 100)),
              isActive: true,
              ...(input.excludeInfaq !== undefined && { excludeInfaq: input.excludeInfaq }),
            },
          });
        } else {
          await tx.spendingLimit.create({
            data: {
              childProfileId,
              setByParentId: parentProfileId,
              period,
              limitAmount: BigInt(Math.round(amount * 100)),
              excludeInfaq: input.excludeInfaq ?? true,
            },
          });
        }
      }
    }

    await tx.auditLog.create({
      data: {
        userId: triggeredBy,
        action: 'SET_SPENDING_LIMIT',
        entityType: 'SpendingLimit',
        entityId: childProfileId,
        newValues: input,
      },
    });
  });

  return getLimits(parentProfileId, childProfileId);
}
