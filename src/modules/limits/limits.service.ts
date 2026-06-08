import { SpendingLimitPeriod } from '@prisma/client';
import { prisma } from '../../config/database';
import { ForbiddenError } from '../../types';
import { validateFamilyAccess } from '../../middleware/role';
import type { SetLimitsInput, SetCategoryLimitInput } from './limits.validator';

type PeriodKey = 'daily' | 'weekly' | 'monthly';

const PERIOD_MAP: Record<PeriodKey, SpendingLimitPeriod> = {
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
};

async function requireFamilyAccess(parentProfileId: string, childProfileId: string) {
  const ok = await validateFamilyAccess(parentProfileId, childProfileId);
  if (!ok) throw new ForbiddenError('Anak tidak terdaftar dalam keluarga Anda');
}

export async function getLimits(parentProfileId: string, childProfileId: string) {
  await requireFamilyAccess(parentProfileId, childProfileId);

  const limits = await prisma.spendingLimit.findMany({
    where: { childProfileId, isActive: true },
    orderBy: [{ voucherType: 'asc' }, { period: 'asc' }],
  });

  return limits.map(l => ({
    id: l.id,
    period: l.period,
    limitAmount: Number(l.limitAmount) / 100,
    voucherType: l.voucherType ?? null,
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
  await requireFamilyAccess(parentProfileId, childProfileId);

  await prisma.$transaction(async tx => {
    for (const [key, period] of Object.entries(PERIOD_MAP) as [PeriodKey, SpendingLimitPeriod][]) {
      const amount = input[key];
      if (amount === undefined) continue;

      if (amount === null) {
        await tx.spendingLimit.updateMany({
          where: { childProfileId, period, voucherType: null, isActive: true },
          data: { isActive: false },
        });
      } else {
        const existing = await tx.spendingLimit.findFirst({
          where: { childProfileId, period, voucherType: null },
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

export async function setCategoryLimit(
  parentProfileId: string,
  childProfileId: string,
  input: SetCategoryLimitInput,
  triggeredBy: string,
) {
  await requireFamilyAccess(parentProfileId, childProfileId);

  await prisma.$transaction(async tx => {
    const existing = await tx.spendingLimit.findFirst({
      where: { childProfileId, period: input.period, voucherType: input.voucherType },
    });

    if (input.limitAmount === null) {
      if (existing) {
        await tx.spendingLimit.update({
          where: { id: existing.id },
          data: { isActive: false },
        });
      }
    } else {
      const amountSen = BigInt(Math.round(input.limitAmount * 100));
      if (existing) {
        await tx.spendingLimit.update({
          where: { id: existing.id },
          data: { limitAmount: amountSen, isActive: true },
        });
      } else {
        await tx.spendingLimit.create({
          data: {
            childProfileId,
            setByParentId: parentProfileId,
            period: input.period,
            limitAmount: amountSen,
            voucherType: input.voucherType,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        userId: triggeredBy,
        action: 'SET_CATEGORY_SPENDING_LIMIT',
        entityType: 'SpendingLimit',
        entityId: childProfileId,
        newValues: input,
      },
    });
  });

  return getLimits(parentProfileId, childProfileId);
}
