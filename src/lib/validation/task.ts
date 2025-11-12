import { z } from "zod";

export const listTasksQuerySchema = z.object({
  limit: z.string().optional(),
  cursor: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueFrom: z.string().datetime({ offset: true }).optional(),
  dueTo: z.string().datetime({ offset: true }).optional(),
  sort: z.enum(["position", "dueAt", "status", "priority"]).optional().default("position"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(300),
  notes: z.string().trim().max(5000).optional().nullable(),
  dueAt: z.string().datetime({ offset: true }).optional().nullable(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).optional().default("NOT_STARTED"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  notes: z.string().trim().max(5000).optional().nullable(),
  dueAt: z.string().datetime({ offset: true }).optional().nullable(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

export const reorderTasksSchema = z.object({
  releaseId: z.string().min(1),
  positions: z
    .array(
      z.object({
        taskId: z.string().min(1),
        position: z.number().int().min(0),
      }),
    )
    .min(1),
});

export const emptyBodySchema = z.object({});
