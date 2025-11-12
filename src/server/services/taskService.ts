import type { Prisma } from "@/generated/prisma";
import type { $Enums } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/apiError";
import { decodeCursor, encodeCursor, getLimit } from "@/lib/pagination";
import {
  SafeTask,
  listTasks as repoListTasks,
  getTaskById as repoGetTaskById,
  createTask as repoCreateTask,
  updateTask as repoUpdateTask,
  deleteTask as repoDeleteTask,
  getMaxPositionInRelease,
  bulkUpdatePositions,
} from "@/server/repositories/taskRepository";
import { ensureReleaseOwnership, getTaskCapForRelease, getTaskUsageForRelease } from "./releaseService";

export async function listTasksService(params: {
  userId: string;
  releaseId: string;
  query: {
    limit?: string;
    cursor?: string;
    status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    priority?: "LOW" | "MEDIUM" | "HIGH";
    dueFrom?: string;
    dueTo?: string;
    sort: "position" | "dueAt" | "status" | "priority";
    order: "asc" | "desc";
  };
}) {
  const { userId, releaseId, query } = params;
  await ensureReleaseOwnership(releaseId, userId);

  const limit = getLimit(query.limit, 20, 100);
  const cursor = decodeCursor<{ id: string }>(query.cursor);

  const filters = {
    status: query.status as Prisma.TaskWhereInput["status"],
    priority: query.priority as Prisma.TaskWhereInput["priority"],
    dueFrom: query.dueFrom ? new Date(query.dueFrom) : undefined,
    dueTo: query.dueTo ? new Date(query.dueTo) : undefined,
  };

  const items = await repoListTasks({
    userId,
    releaseId,
    limit: limit + 1,
    sort: query.sort,
    order: query.order,
    filters,
    cursorId: cursor?.id,
  });

  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const next = hasMore ? pageItems[pageItems.length - 1] : null;
  const nextCursor = next ? encodeCursor({ id: next.id }) : null;

  return { items: pageItems, nextCursor } as { items: SafeTask[]; nextCursor: string | null };
}

export async function createTaskService(params: {
  userId: string;
  releaseId: string;
  input: { title: string; notes?: string | null; dueAt?: string | null; status?: string; priority?: string };
}) {
  // Ensure release exists and belongs to user
  await ensureReleaseOwnership(params.releaseId, params.userId);

  const cap = await getTaskCapForRelease(params.userId, params.releaseId);
  const usage = await getTaskUsageForRelease(params.userId, params.releaseId);
  if (usage >= cap) {
    const err = new ApiError(409, "TASK_LIMIT", "You have reached the maximum number of tasks for this release");
    err.details = { limit: cap };
    throw err;
  }

  const maxPos = await getMaxPositionInRelease(params.releaseId, params.userId);
  const position = maxPos + 1;

  const data: Prisma.TaskCreateInput = {
    user: { connect: { id: params.userId } },
    releaseStrategy: { connect: { id: params.releaseId } },
    title: params.input.title,
    notes: params.input.notes ?? undefined,
    dueAt: params.input.dueAt ? new Date(params.input.dueAt) : undefined,
  status: (params.input.status ?? "NOT_STARTED") as $Enums.TaskStatus,
  priority: (params.input.priority ?? "MEDIUM") as $Enums.TaskPriority,
    position,
    completedAt: params.input.status === "COMPLETED" ? new Date() : undefined,
  };

  return repoCreateTask(data);
}

export async function updateTaskService(params: {
  userId: string;
  taskId: string;
  input: { title?: string; notes?: string | null; dueAt?: string | null; status?: string; priority?: string };
}) {
  const existing = await repoGetTaskById(params.taskId, params.userId);
  if (!existing) throw new ApiError(404, "TASK_NOT_FOUND", "Task not found");

  const updates: Prisma.TaskUpdateInput = {};
  if (params.input.title !== undefined) updates.title = params.input.title;
  if (params.input.notes !== undefined) updates.notes = params.input.notes;
  if (params.input.dueAt !== undefined) updates.dueAt = params.input.dueAt ? new Date(params.input.dueAt) : null;
  if (params.input.priority !== undefined) updates.priority = params.input.priority as $Enums.TaskPriority;
  if (params.input.status !== undefined) {
    updates.status = params.input.status as $Enums.TaskStatus;
    // Maintain completedAt timestamp when transitioning to/from COMPLETED
    if (params.input.status === "COMPLETED" && !existing.completedAt) {
      updates.completedAt = new Date();
    } else if (params.input.status !== "COMPLETED" && existing.completedAt) {
      updates.completedAt = null;
    }
  }

  return repoUpdateTask(params.taskId, params.userId, updates);
}

export async function deleteTaskService(params: { userId: string; taskId: string }) {
  const existing = await repoGetTaskById(params.taskId, params.userId);
  if (!existing) throw new ApiError(404, "TASK_NOT_FOUND", "Task not found");
  await repoDeleteTask(params.taskId, params.userId);
}

export async function completeTaskService(params: { userId: string; taskId: string }) {
  const existing = await repoGetTaskById(params.taskId, params.userId);
  if (!existing) throw new ApiError(404, "TASK_NOT_FOUND", "Task not found");
  if (existing.status === "COMPLETED" && existing.completedAt) return existing; // idempotent
  return repoUpdateTask(params.taskId, params.userId, { status: "COMPLETED", completedAt: new Date() });
}

export async function uncompleteTaskService(params: { userId: string; taskId: string }) {
  const existing = await repoGetTaskById(params.taskId, params.userId);
  if (!existing) throw new ApiError(404, "TASK_NOT_FOUND", "Task not found");
  if (existing.status !== "COMPLETED") return existing; // idempotent
  // Prior state isn't stored; default to NOT_STARTED as a safe reset
  return repoUpdateTask(params.taskId, params.userId, { status: "NOT_STARTED", completedAt: null });
}

export async function reorderTasksService(params: {
  userId: string;
  releaseId: string;
  positions: Array<{ taskId: string; position: number }>;
}) {
  // Validate ownership and release
  await ensureReleaseOwnership(params.releaseId, params.userId);

  // Fetch tasks to ensure they belong to release and user
  const ids = params.positions.map((p) => p.taskId);
  const tasks = await prisma.task.findMany({
    where: { id: { in: ids }, userId: params.userId, releaseStrategyId: params.releaseId },
    select: { id: true },
  });
  if (tasks.length !== ids.length) {
    throw new ApiError(404, "TASK_NOT_IN_RELEASE", "One or more tasks do not belong to the specified release");
  }

  // Validate unique positions and contiguous range starting at 0
  const positions = params.positions.map((p) => p.position);
  const uniquePositions = new Set(positions);
  if (uniquePositions.size !== positions.length) {
    throw new ApiError(400, "DUPLICATE_POSITIONS", "Positions must be unique");
  }
  const min = Math.min(...positions);
  const max = Math.max(...positions);
  if (min !== 0 || max !== positions.length - 1) {
    throw new ApiError(400, "INVALID_POSITIONS", "Positions must be contiguous starting at 0");
  }

  await bulkUpdatePositions(
    params.positions.map((p) => ({ id: p.taskId, position: p.position })),
    params.userId,
  );
}
