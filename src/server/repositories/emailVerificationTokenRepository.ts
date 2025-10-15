import prisma from "@/lib/prisma";

export async function createEmailVerificationToken({
  userId,
  tokenHash,
  expiresAt,
}: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  return prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
}

export async function findValidEmailVerificationToken(tokenHash: string) {
  return prisma.emailVerificationToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}

export async function markEmailVerificationTokenUsed(id: string) {
  return prisma.emailVerificationToken.update({ where: { id }, data: { usedAt: new Date() } });
}

export async function invalidateEmailVerificationTokensForUser(userId: string) {
  return prisma.emailVerificationToken.updateMany({
    where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
}
