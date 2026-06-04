import { prisma } from '../../config/database';
import { InsufficientBalanceError, NotFoundError } from '../../types';
import { assertWithinSpendingLimit } from '../../utils/spending-limit';
import type { CreateInfaqInput } from './infaq.validator';

export async function createInfaq(
  childProfileId: string,
  input: CreateInfaqInput,
  triggeredBy: string,
) {
  const amountSen = BigInt(Math.round(input.amount * 100));

  const account = await prisma.childAccount.findUnique({ where: { childProfileId } });
  if (!account) throw new NotFoundError('Rekening anak');

  const pocket = await prisma.pocket.findFirst({
    where: { id: input.sourcePocketId, accountId: account.id, isActive: true },
  });
  if (!pocket) throw new NotFoundError('Pocket');

  if (pocket.balance < amountSen) throw new InsufficientBalanceError();

  // Cek spending limit — isInfaq=true agar parent bisa kecualikan
  await assertWithinSpendingLimit(childProfileId, amountSen, true);

  const infaqLog = await prisma.$transaction(async tx => {
    const newPocketBalance = pocket.balance - amountSen;

    await tx.pocket.update({
      where: { id: pocket.id },
      data: { balance: newPocketBalance },
    });

    await tx.pocketLedger.create({
      data: {
        pocketId: pocket.id,
        type: 'DEBIT',
        source: 'INFAQ',
        amount: amountSen,
        balanceAfter: newPocketBalance,
        triggeredBy,
        notes: `Infaq ke ${input.institution === 'OTHER' ? input.institutionName : input.institution}`,
      },
    });

    return tx.infaqLog.create({
      data: {
        childProfileId,
        institution: input.institution,
        institutionName: input.institutionName ?? null,
        amount: amountSen,
        sourcePocketId: pocket.id,
      },
    });
  });

  return {
    id: infaqLog.id,
    institution: infaqLog.institution,
    institutionName: infaqLog.institutionName,
    amount: Number(infaqLog.amount) / 100,
    pocketName: pocket.name,
    createdAt: infaqLog.createdAt,
  };
}

export async function listInfaq(childProfileId: string) {
  const logs = await prisma.infaqLog.findMany({
    where: { childProfileId },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyTotal =
    logs
      .filter(l => l.createdAt >= monthStart)
      .reduce((sum, l) => sum + Number(l.amount), 0) / 100;

  return {
    monthlyTotal,
    logs: logs.map(l => ({
      id: l.id,
      institution: l.institution,
      institutionName: l.institutionName,
      amount: Number(l.amount) / 100,
      sourcePocketId: l.sourcePocketId,
      createdAt: l.createdAt,
    })),
  };
}
