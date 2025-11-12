import { z } from "zod";

export const listReleasesQuerySchema = z.object({
  limit: z.string().optional(),
  cursor: z.string().optional(),
  archived: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true"))
    .pipe(z.boolean().optional()),
  sort: z.enum(["name", "createdAt"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const createReleaseSchema = z.object({
  name: z.string().trim().min(1).max(200),
  createDefaultTasks: z.boolean().optional().default(false),
});

export const updateReleaseSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  isArchived: z.boolean().optional(),
});
