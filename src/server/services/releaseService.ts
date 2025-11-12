import type { Prisma } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/apiError";
import { decodeCursor, encodeCursor, getLimit } from "@/lib/pagination";
import {
  SafeRelease,
  createRelease as repoCreateRelease,
  deleteRelease as repoDeleteRelease,
  getReleaseById as repoGetReleaseById,
  listReleases as repoListReleases,
  updateRelease as repoUpdateRelease,
  countTasksForRelease,
} from "@/server/repositories/releaseRepository";

export async function listReleasesService(params: {
  userId: string;
  query: { limit?: string; cursor?: string; archived?: boolean; sort: "name" | "createdAt"; order: "asc" | "desc" };
}) {
  const { userId, query } = params;
  const limit = getLimit(query.limit, 20, 50);
  const cursor = decodeCursor<{ id: string }>(query.cursor);
  const items = await repoListReleases({
    userId,
    limit: limit + 1, // over-fetch by 1 to know if there's a next page
    archived: query.archived,
    sort: query.sort,
    order: query.order,
    cursorId: cursor?.id,
  });

  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const next = hasMore ? pageItems[pageItems.length - 1] : null;
  const nextCursor = next ? encodeCursor({ id: next.id }) : null;
  return { items: pageItems, nextCursor } as { items: SafeRelease[]; nextCursor: string | null };
}

export async function createReleaseService(params: { userId: string; name: string; createDefaultTasks?: boolean }) {
  try {
    const release = await repoCreateRelease({ userId: params.userId, name: params.name });

    if (params.createDefaultTasks) {
      // Seed a few helpful tasks at sensible positions
      await prisma.task.createMany({
        data: [
          { userId: params.userId, releaseStrategyId: release.id, title: "Plan release timeline", position: 0 },
          { userId: params.userId, releaseStrategyId: release.id, title: "Design cover art", position: 1 },
          { userId: params.userId, releaseStrategyId: release.id, title: "Upload to distributor", position: 2 },
        ],
      });
    }

    return release;
  } catch (e: unknown) {
    // Handle unique constraint on (userId, name)
    const code = typeof e === "object" && e && "code" in e ? String((e as { code?: unknown }).code) : null;
    if (code === "P2002") {
      throw new ApiError(409, "RELEASE_NAME_EXISTS", "A release with that name already exists");
    }
    throw e;
  }
}

export async function getReleaseService(params: { userId: string; id: string }) {
  const release = await repoGetReleaseById(params.id, params.userId);
  if (!release) throw new ApiError(404, "RELEASE_NOT_FOUND", "Release not found");
  return release;
}

export async function patchReleaseService(params: { userId: string; id: string; data: Prisma.ReleaseStrategyUpdateInput }) {
  try {
    // Ensure existence + ownership first for clearer 404
    const existing = await repoGetReleaseById(params.id, params.userId);
    if (!existing) throw new ApiError(404, "RELEASE_NOT_FOUND", "Release not found");
    return await repoUpdateRelease(params.id, params.userId, params.data);
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? String((e as { code?: unknown }).code) : null;
    if (code === "P2002") {
      throw new ApiError(409, "RELEASE_NAME_EXISTS", "A release with that name already exists");
    }
    throw e;
  }
}

export async function deleteReleaseService(params: { userId: string; id: string }) {
  const existing = await repoGetReleaseById(params.id, params.userId);
  if (!existing) throw new ApiError(404, "RELEASE_NOT_FOUND", "Release not found");
  await repoDeleteRelease(params.id, params.userId);
}

export async function computeReleaseProgress(params: { userId: string; id: string }) {
  const release = await repoGetReleaseById(params.id, params.userId);
  if (!release) throw new ApiError(404, "RELEASE_NOT_FOUND", "Release not found");

  const totalTasks = await prisma.task.count({ where: { userId: params.userId, releaseStrategyId: params.id } });
  const completedTasks = await prisma.task.count({
    where: { userId: params.userId, releaseStrategyId: params.id, status: "COMPLETED" },
  });
  const percent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  return { totalTasks, completedTasks, percent };
}

export async function ensureReleaseOwnership(releaseId: string, userId: string) {
  const rel = await repoGetReleaseById(releaseId, userId);
  if (!rel) throw new ApiError(404, "RELEASE_NOT_FOUND", "Release not found");
  return rel;
}

export async function getTaskCapForRelease(userId: string, releaseId: string): Promise<number> {
  // TODO: integrate with billing/subscription in future; default to schema's max (500)
  // Reference params to appease linter until implemented
  void userId;
  void releaseId;
  return 500;
}

export async function getTaskUsageForRelease(userId: string, releaseId: string) {
  return countTasksForRelease(releaseId, userId);
}
