import type { Prisma, User } from "@/generated/prisma";
import prisma from "@/lib/prisma";

const userSelect = {
  id: true,
  email: true,
  displayName: true,
  publicArtistName: true,
  avatarUrl: true,
  bio: true,
  timezone: true,
  emailVerified: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type SafeUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data });
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where: { id }, data });
}

export function serializeUser(user: User): SafeUser {
  const { id, email, displayName, publicArtistName, avatarUrl, bio, timezone, emailVerified, role, createdAt, updatedAt } =
    user;
  return { id, email, displayName, publicArtistName, avatarUrl, bio, timezone, emailVerified, role, createdAt, updatedAt };
}
