import type { Prisma } from "@/generated/prisma";
import prisma from "@/lib/prisma";

const taskSelect = {
  id: true,
  userId: true,
  releaseStrategyId: true,
  title: true,
  notes: true,
  dueAt: true,
  status: true,
  priority: true,
  position: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TaskSelect;

export type SafeTask = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;

export async function listTasks(params: {
  userId: string;
  releaseId: string;
  limit: number;
  sort: "position" | "dueAt" | "status" | "priority";
  order: "asc" | "desc";
  filters?: { status?: Prisma.TaskWhereInput["status"]; priority?: Prisma.TaskWhereInput["priority"]; dueFrom?: Date; dueTo?: Date };
  cursorId?: string | null;
}) {
  const { userId, releaseId, limit, sort, order, filters, cursorId } = params;

  const where: Prisma.TaskWhereInput = {
    userId,
    releaseStrategyId: releaseId,
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.priority ? { priority: filters.priority } : {}),
    ...(filters?.dueFrom || filters?.dueTo
      ? { dueAt: { gte: filters?.dueFrom, lte: filters?.dueTo } as Prisma.DateTimeFilter }
      : {}),
  };

  const orderBy: Prisma.TaskOrderByWithRelationInput[] = [];
  orderBy.push({ [sort]: order });
  orderBy.push({ id: order });

  const items = await prisma.task.findMany({
    where,
    orderBy,
    take: limit,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    select: taskSelect,
  });

  return items as SafeTask[];
}

export async function getTaskById(taskId: string, userId: string) {
  return prisma.task.findFirst({ where: { id: taskId, userId }, select: taskSelect });
}

export async function countTasksInRelease(releaseId: string, userId: string) {
  return prisma.task.count({ where: { releaseStrategyId: releaseId, userId } });
}

export async function getMaxPositionInRelease(releaseId: string, userId: string) {
  const last = await prisma.task.findFirst({
    where: { releaseStrategyId: releaseId, userId },
    orderBy: [{ position: "desc" }],
    select: { position: true },
  });
  return last?.position ?? -1;
}

export async function createTask(data: Prisma.TaskCreateInput) {
  return prisma.task.create({ data, select: taskSelect });
}

export async function updateTask(id: string, userId: string, data: Prisma.TaskUpdateInput) {
  return prisma.task.update({ where: { id, userId }, data, select: taskSelect });
}

export async function deleteTask(id: string, userId: string) {
  await prisma.task.delete({ where: { id, userId } });
}

export async function bulkUpdatePositions(updates: Array<{ id: string; position: number }>, userId: string) {
  return prisma.$transaction(
    updates.map((u) => prisma.task.update({ where: { id: u.id, userId }, data: { position: u.position } })),
  );
}
