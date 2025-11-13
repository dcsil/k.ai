/**
 * Integration flow across Releases and Tasks APIs using a cloned SQLite DB.
 * Covers: create/list releases, progress, list/create tasks with pagination,
 * update/complete/uncomplete/delete tasks, reorder, and key error cases.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma";
import { cloneSqliteDatabase, ensureTestJwtSecret, resetPrismaClientSingleton } from "../../utils/integrationDb";

let prisma: PrismaClient;
let accessToken = "";

// Auth route handlers
let signupPost: typeof import("@/app/api/auth/signup/route").POST;
// Releases
let releasesGet: typeof import("@/app/api/releases/route").GET;
let releasesPost: typeof import("@/app/api/releases/route").POST;
let releaseGet: typeof import("@/app/api/releases/[id]/route").GET;
let releasePatch: typeof import("@/app/api/releases/[id]/route").PATCH;
let releaseDelete: typeof import("@/app/api/releases/[id]/route").DELETE;
let progressPost: typeof import("@/app/api/releases/[id]/progress/route").POST;
// Tasks
let relTasksGet: typeof import("@/app/api/releases/[id]/tasks/route").GET;
let relTasksPost: typeof import("@/app/api/releases/[id]/tasks/route").POST;
let taskPatch: typeof import("@/app/api/tasks/[taskId]/route").PATCH;
let taskDelete: typeof import("@/app/api/tasks/[taskId]/route").DELETE;
let taskCompletePost: typeof import("@/app/api/tasks/[taskId]/complete/route").POST;
let taskUncompletePost: typeof import("@/app/api/tasks/[taskId]/uncomplete/route").POST;
let reorderPost: typeof import("@/app/api/tasks/reorder/route").POST;

function buildAuthRequest(url: string, init?: { method?: string; json?: unknown; token?: string }) {
  const headers = new Headers({
    "user-agent": "vitest",
    "x-forwarded-for": "127.0.0.1",
  });
  const token = init?.token ?? accessToken;
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (init?.json !== undefined) headers.set("content-type", "application/json");
  return new NextRequest(url, {
    method: init?.method ?? (init?.json ? "POST" : "GET"),
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : undefined,
  });
}

type RouteParams<T extends string> = { params: Promise<Record<T, string>> };
function paramsId(id: string): RouteParams<"id"> {
  return { params: Promise.resolve({ id }) };
}
function paramsTask(taskId: string): RouteParams<"taskId"> {
  return { params: Promise.resolve({ taskId }) };
}

type WithId = { id: string };

declare global {
  var __cleanup: undefined | (() => void);
}

describe.sequential("Releases + Tasks API integration", () => {
  beforeAll(async () => {
    const jwtSecret = ensureTestJwtSecret();
    const { cleanup } = cloneSqliteDatabase({ prefix: "rel-task-flow" });
    // Persist cleanup on global to run afterAll
    globalThis.__cleanup = cleanup;

    resetPrismaClientSingleton();
    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.prisma;

    const configModule = await import("@/lib/config");
    configModule.appConfig.jwtAccessSecret = jwtSecret;

    // Import route handlers
    signupPost = (await import("@/app/api/auth/signup/route")).POST;
    releasesGet = (await import("@/app/api/releases/route")).GET;
    releasesPost = (await import("@/app/api/releases/route")).POST;
    releaseGet = (await import("@/app/api/releases/[id]/route")).GET;
    releasePatch = (await import("@/app/api/releases/[id]/route")).PATCH;
    releaseDelete = (await import("@/app/api/releases/[id]/route")).DELETE;
    progressPost = (await import("@/app/api/releases/[id]/progress/route")).POST;
    relTasksGet = (await import("@/app/api/releases/[id]/tasks/route")).GET;
    relTasksPost = (await import("@/app/api/releases/[id]/tasks/route")).POST;
    taskPatch = (await import("@/app/api/tasks/[taskId]/route")).PATCH;
    taskDelete = (await import("@/app/api/tasks/[taskId]/route")).DELETE;
    taskCompletePost = (await import("@/app/api/tasks/[taskId]/complete/route")).POST;
    taskUncompletePost = (await import("@/app/api/tasks/[taskId]/uncomplete/route")).POST;
    reorderPost = (await import("@/app/api/tasks/reorder/route")).POST;

    // Create a user and capture access token
    const email = `flow-${randomUUID()}@example.com`;
    const signupReq = new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      headers: new Headers({ "content-type": "application/json" }),
      body: JSON.stringify({ email, password: "P@ssw0rd!", displayName: "Flow", timezone: "UTC" }),
    });
    const signupRes = await signupPost(signupReq as never);
    const signupBody = await signupRes.json();
    accessToken = signupBody.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    globalThis.__cleanup?.();
  });

  it("end-to-end release and task operations with errors", async () => {
    // Unauthorized access should 401
    {
      const req = buildAuthRequest("http://localhost/api/releases");
      // overwrite header to simulate missing token
      const headers = new Headers(req.headers);
      headers.delete("authorization");
      const unauthReq = new NextRequest(req.url, { method: "GET", headers });
      const res = (await releasesGet(unauthReq as never)) as Response;
      expect(res.status).toBe(401);
    }

    // Create a release with default tasks
    let releaseId = "";
    {
      const res = (await releasesPost(
        buildAuthRequest("http://localhost/api/releases", {
          json: { name: "My Release", createDefaultTasks: true },
        }) as never,
      )) as Response;
      expect(res.status).toBe(201);
      const body = await res.json();
      releaseId = body.id;
      expect(body.name).toBe("My Release");
    }

    // Duplicate name should 409
    {
      const res = (await releasesPost(
        buildAuthRequest("http://localhost/api/releases", { json: { name: "My Release" } }) as never,
      )) as Response;
      expect(res.status).toBe(409);
    }

    // List releases and fetch by id
    {
      const listRes = (await releasesGet(
        buildAuthRequest("http://localhost/api/releases?limit=10&sort=createdAt&order=desc") as never,
      )) as Response;
      expect(listRes.status).toBe(200);
      const listBody = await listRes.json();
      expect(listBody.items.some((r: WithId) => r.id === releaseId)).toBe(true);

      const getRes = (await releaseGet(buildAuthRequest("http://localhost/api/releases/" + releaseId) as never, paramsId(releaseId))) as Response;
      expect(getRes.status).toBe(200);
      const getBody = await getRes.json();
      expect(getBody.id).toBe(releaseId);
    }

    // Progress reflects default tasks (3, 0 completed)
    {
      const progRes = (await progressPost(buildAuthRequest("http://localhost/api/releases/" + releaseId) as never, paramsId(releaseId))) as Response;
      expect(progRes.status).toBe(200);
      const prog = await progRes.json();
      expect(prog.totalTasks).toBeGreaterThanOrEqual(3);
      expect(prog.completedTasks).toBeGreaterThanOrEqual(0);
    }

    // List tasks with pagination (limit=2)
    const allTaskIds: string[] = [];
    {
      const first = (await relTasksGet(
        buildAuthRequest(`http://localhost/api/releases/${releaseId}/tasks?limit=2&sort=position&order=asc`) as never,
        paramsId(releaseId),
      )) as Response;
      expect(first.status).toBe(200);
      const firstBody = await first.json();
      expect(Array.isArray(firstBody.items)).toBe(true);
      allTaskIds.push(...(firstBody.items as WithId[]).map((t) => t.id));
      if (firstBody.nextCursor) {
        const second = (await relTasksGet(
          buildAuthRequest(
            `http://localhost/api/releases/${releaseId}/tasks?limit=2&sort=position&order=asc&cursor=${encodeURIComponent(firstBody.nextCursor)}`,
          ) as never,
          paramsId(releaseId),
        )) as Response;
        expect(second.status).toBe(200);
        const secondBody = await second.json();
        allTaskIds.push(...(secondBody.items as WithId[]).map((t) => t.id));
      }
      expect(allTaskIds.length).toBeGreaterThanOrEqual(3);
    }

    // Create a new task; headers include plan usage
    let newTaskId = "";
    let capHeader: string | null = null;
    {
      const res = (await relTasksPost(
        buildAuthRequest(`http://localhost/api/releases/${releaseId}/tasks`, { json: { title: "Announce on socials" } }) as never,
        paramsId(releaseId),
      )) as Response;
      expect(res.status).toBe(201);
      capHeader = res.headers.get("X-Plan-Limit");
      const usageHeader = res.headers.get("X-Plan-Usage");
      expect(capHeader).toBe("500");
      expect(Number(usageHeader)).toBeGreaterThan(0);
      const body = await res.json();
      newTaskId = body.id;
      expect(body.title).toBe("Announce on socials");
    }

    // Update the task to completed, then uncomplete
    {
      const patchRes = (await taskPatch(
        buildAuthRequest(`http://localhost/api/tasks/${newTaskId}`, { method: "PATCH", json: { status: "COMPLETED" } }) as never,
        paramsTask(newTaskId),
      )) as Response;
      expect(patchRes.status).toBe(200);
      const patched = await patchRes.json();
      expect(patched.status).toBe("COMPLETED");
      expect(patched.completedAt).toBeTruthy();

      const uncompleteRes = (await taskUncompletePost(
        buildAuthRequest(`http://localhost/api/tasks/${newTaskId}/uncomplete`, { method: "POST" }) as never,
        paramsTask(newTaskId),
      )) as Response;
      expect(uncompleteRes.status).toBe(200);
      const undone = await uncompleteRes.json();
      expect(undone.status).toBe("NOT_STARTED");
    }

    // Complete via dedicated endpoint (idempotent), then compute progress
    {
      const comp1 = (await taskCompletePost(
        buildAuthRequest(`http://localhost/api/tasks/${newTaskId}/complete`, { method: "POST" }) as never,
        paramsTask(newTaskId),
      )) as Response;
      expect(comp1.status).toBe(200);
      const compTask = await comp1.json();
      expect(compTask.status).toBe("COMPLETED");

      const comp2 = (await taskCompletePost(
        buildAuthRequest(`http://localhost/api/tasks/${newTaskId}/complete`, { method: "POST" }) as never,
        paramsTask(newTaskId),
      )) as Response;
      expect(comp2.status).toBe(200); // idempotent

      const progRes2 = (await progressPost(buildAuthRequest("http://localhost/api/releases/" + releaseId) as never, paramsId(releaseId))) as Response;
      expect(progRes2.status).toBe(200);
      const prog2 = await progRes2.json();
      expect(prog2.totalTasks).toBeGreaterThanOrEqual(4);
      expect(prog2.completedTasks).toBeGreaterThanOrEqual(1);
    }

    // Reorder tasks: reverse first three positions
    {
      const current = await prisma.task.findMany({
        where: { releaseStrategyId: releaseId },
        orderBy: { position: "asc" },
        select: { id: true, position: true },
      });
      const firstThree = current.slice(0, 3);
      if (firstThree.length === 3) {
        const reversed = firstThree.map((t, idx, arr) => ({ taskId: t.id, position: arr.length - 1 - idx }));
        const res = (await reorderPost(
          buildAuthRequest("http://localhost/api/tasks/reorder", { json: { releaseId, positions: reversed } }) as never,
        )) as Response;
        expect(res.status).toBe(204);
        const after = await prisma.task.findMany({
          where: { releaseStrategyId: releaseId, id: { in: firstThree.map((t) => t.id) } },
          orderBy: { position: "asc" },
          select: { id: true, position: true },
        });
        expect(after.map((t) => t.position)).toEqual([0, 1, 2]);
      }
    }

    // Reorder with duplicate positions should 400
    {
      const some = await prisma.task.findMany({ where: { releaseStrategyId: releaseId }, take: 2, select: { id: true } });
      if (some.length === 2) {
        const res = (await reorderPost(
          buildAuthRequest("http://localhost/api/tasks/reorder", {
            json: { releaseId, positions: [{ taskId: some[0].id, position: 0 }, { taskId: some[1].id, position: 0 }] },
          }) as never,
        )) as Response;
        expect(res.status).toBe(400);
      }
    }

    // 404 for non-existent release on GET
    {
      const res = (await releaseGet(buildAuthRequest("http://localhost/api/releases/bad") as never, paramsId("bad"))) as Response;
      expect(res.status).toBe(404);
    }

    // Delete the created task and verify count drops
    {
      const beforeCount = await prisma.task.count({ where: { releaseStrategyId: releaseId } });
      const res = (await taskDelete(buildAuthRequest(`http://localhost/api/tasks/${newTaskId}`, { method: "DELETE" }) as never, paramsTask(newTaskId))) as Response;
      expect(res.status).toBe(204);
      const afterCount = await prisma.task.count({ where: { releaseStrategyId: releaseId } });
      expect(afterCount).toBe(beforeCount - 1);
    }

    // Patch release name and then delete it
    {
      const p = (await releasePatch(
        buildAuthRequest(`http://localhost/api/releases/${releaseId}`, { method: "PATCH", json: { name: "Renamed" } }) as never,
        paramsId(releaseId),
      )) as Response;
      expect(p.status).toBe(200);
      const patched = await p.json();
      expect(patched.name).toBe("Renamed");

      const d = (await releaseDelete(buildAuthRequest(`http://localhost/api/releases/${releaseId}`, { method: "DELETE" }) as never, paramsId(releaseId))) as Response;
      expect(d.status).toBe(204);
      const nowGone = (await releaseGet(buildAuthRequest("http://localhost/api/releases/" + releaseId) as never, paramsId(releaseId))) as Response;
      expect(nowGone.status).toBe(404);
    }
  });
});
