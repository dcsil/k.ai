import type { Prisma } from "@/generated/prisma";
import prisma from "@/lib/prisma";

export async function createRefreshToken(data: Prisma.RefreshTokenCreateInput) {
  return prisma.refreshToken.create({ data });
}

export async function findRefreshTokenByHash(tokenHash: string) {
  return prisma.refreshToken.findUnique({ where: { tokenHash } });
}

export async function revokeRefreshToken(id: string) {
  return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
}

export async function revokeUserRefreshTokens(userId: string) {
  return prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function markRefreshTokenReplaced(oldTokenId: string, newTokenId: string) {
  return prisma.refreshToken.update({ where: { id: oldTokenId }, data: { replacedById: newTokenId, revokedAt: new Date() } });
}
