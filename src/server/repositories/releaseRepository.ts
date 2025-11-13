import type { Prisma } from "@/generated/prisma";
import prisma from "@/lib/prisma";

const releaseSelect = {
  id: true,
  userId: true,
  name: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ReleaseStrategySelect;

export type SafeRelease = Prisma.ReleaseStrategyGetPayload<{ select: typeof releaseSelect }>;

export async function getReleaseById(id: string, userId: string) {
  return prisma.releaseStrategy.findFirst({ where: { id, userId }, select: releaseSelect });
}

export async function listReleases(params: {
  userId: string;
  limit: number;
  archived?: boolean;
  sort: "name" | "createdAt";
  order: "asc" | "desc";
  cursorId?: string | null;
}) {
  const { userId, limit, archived, sort, order, cursorId } = params;

  const where: Prisma.ReleaseStrategyWhereInput = { userId, ...(archived !== undefined ? { isArchived: archived } : {}) };

  const orderBy: Prisma.ReleaseStrategyOrderByWithRelationInput[] = [];
  // Stable sort: primary field then id for tie-breaker
  orderBy.push({ [sort]: order });
  orderBy.push({ id: order });

  const items = await prisma.releaseStrategy.findMany({
    where,
    orderBy,
    take: limit,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    select: releaseSelect,
  });

  return items as SafeRelease[];
}

export async function createRelease(data: { userId: string; name: string }) {
  return prisma.releaseStrategy.create({ data, select: releaseSelect });
}

export async function updateRelease(id: string, userId: string, data: Prisma.ReleaseStrategyUpdateInput) {
  return prisma.releaseStrategy.update({ where: { id, userId }, data, select: releaseSelect });
}

export async function deleteRelease(id: string, userId: string) {
  await prisma.releaseStrategy.delete({ where: { id, userId } });
}

export async function countTasksForRelease(releaseId: string, userId: string) {
  return prisma.task.count({ where: { releaseStrategyId: releaseId, userId } });
}
