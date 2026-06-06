import { prisma } from '../../config/database';
import { InsufficientBalanceError, NotFoundError } from '../../types';
import { assertWithinSpendingLimit } from '../../utils/spending-limit';
import type { CreateInfaqInput } from './infaq.validator';

export async function listInstitutions() {
  const institutions = await prisma.infaqInstitutionConfig.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, code: true, name: true, description: true, logoUrl: true, bankInfo: true },
  });
  return institutions;
}

// Infaq dibayar dari Tabungan Utama (ChildAccount.balance)
export async function createInfaq(
  childProfileId: string,
  input: CreateInfaqInput,
  triggeredBy: string,
) {
  const amountSen = BigInt(Math.round(input.amount * 100));

  const [institution, account] = await Promise.all([
    prisma.infaqInstitutionConfig.findFirst({
      where: { id: input.institutionId, isActive: true },
    }),
    prisma.childAccount.findUnique({ where: { childProfileId } }),
  ]);

  if (!institution) throw new NotFoundError('Lembaga infaq');
  if (!account) throw new NotFoundError('Rekening anak');
  if (account.balance < amountSen) throw new InsufficientBalanceError();

  // Cek spending limit (isInfaq=true → bisa dikecualikan oleh parent)
  await assertWithinSpendingLimit(childProfileId, amountSen, true, null);

  const newBalance = account.balance - amountSen;

  const infaqLog = await prisma.$transaction(async tx => {
    await tx.childAccount.update({
      where: { id: account.id },
      data: { balance: newBalance },
    });

    await tx.accountLedger.create({
      data: {
        accountId: account.id,
        type: 'DEBIT',
        source: 'INFAQ',
        amount: amountSen,
        balanceAfter: newBalance,
        triggeredBy,
        notes: `Infaq ke ${institution.name}${input.notes ? ': ' + input.notes : ''}`,
      },
    });

    return tx.infaqLog.create({
      data: {
        childProfileId,
        institutionConfigId: institution.id,
        amount: amountSen,
        notes: input.notes ?? null,
      },
    });
  });

  return {
    id: infaqLog.id,
    institution: { id: institution.id, name: institution.name },
    amount: Number(infaqLog.amount) / 100,
    newTabunganBalance: Number(newBalance) / 100,
    notes: infaqLog.notes,
    createdAt: infaqLog.createdAt,
  };
}

export async function listInfaq(childProfileId: string) {
  const logs = await prisma.infaqLog.findMany({
    where: { childProfileId },
    include: {
      institutionConfig: { select: { name: true, code: true, logoUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyTotal =
    logs.filter(l => l.createdAt >= monthStart).reduce((s, l) => s + Number(l.amount), 0) / 100;

  return {
    monthlyTotal,
    logs: logs.map(l => ({
      id: l.id,
      institution: l.institutionConfig,
      amount: Number(l.amount) / 100,
      notes: l.notes,
      createdAt: l.createdAt,
    })),
  };
}
