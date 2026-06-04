import { prisma } from '../../config/database';

export async function getChildren(parentProfileId: string) {
  const links = await prisma.familyLink.findMany({
    where: { parentProfileId },
    include: {
      childProfile: {
        include: {
          account: {
            select: { id: true, balance: true, currency: true },
          },
        },
      },
    },
    orderBy: { linkedAt: 'asc' },
  });

  return links.map(({ childProfile }) => ({
    id: childProfile.id,
    fullName: childProfile.fullName,
    dateOfBirth: childProfile.dateOfBirth,
    isActive: childProfile.isActive,
    account: childProfile.account
      ? {
          id: childProfile.account.id,
          balance: Number(childProfile.account.balance) / 100,
          currency: childProfile.account.currency,
        }
      : null,
  }));
}
