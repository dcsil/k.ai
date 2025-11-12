/**
 * Unit tests for /api/releases/[id]/tasks (GET, POST with plan cap headers).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAccessToken = vi.fn();
const mockRespondWithError = vi.fn();
const mockListTasks = vi.fn();
const mockCreateTask = vi.fn();
const mockGetCap = vi.fn();
const mockGetUsage = vi.fn();

vi.mock("next/server", () => {
  const createCookies = () => ({ set: vi.fn(), get: vi.fn() });
  class MockNextResponse extends Response {
    cookies = createCookies();
    static json(data: unknown, init?: ResponseInit) {
      const headers = new Headers(init?.headers);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
      return new MockNextResponse(JSON.stringify(data), { ...init, headers });
    }
  }
  class MockNextRequest extends Request {}
  return { NextResponse: MockNextResponse, NextRequest: MockNextRequest };
});

vi.mock("@/lib/api/authHeader", () => ({ requireAccessToken: mockRequireAccessToken }));
vi.mock("@/lib/api/errorResponse", () => ({ respondWithError: mockRespondWithError }));
vi.mock("@/server/services/taskService", () => ({
  listTasksService: mockListTasks,
  createTaskService: mockCreateTask,
}));
vi.mock("@/server/services/releaseService", () => ({
  getTaskCapForRelease: mockGetCap,
  getTaskUsageForRelease: mockGetUsage,
}));

function params(id: string) {
  return { params: Promise.resolve({ id }) } as any;
}
function makeRequest(url: string, body?: unknown) {
  return { url, json: async () => body, headers: new Headers() } as any;
}

describe("/api/releases/[id]/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccessToken.mockReturnValue({ sub: "user-1" });
    mockRespondWithError.mockReturnValue(new Response("error", { status: 500 }));
  });

  it("GET returns tasks with parsed filter and sorting", async () => {
    mockListTasks.mockResolvedValue({ items: [], nextCursor: null });
    const { GET } = await import("@/app/api/releases/[id]/tasks/route");
    const req = makeRequest(
      "https://app.local/api/releases/r1/tasks?limit=5&status=NOT_STARTED&sort=position&order=asc",
    );
    const res = (await GET(req, params("r1"))) as Response;
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [], nextCursor: null });
    expect(mockListTasks).toHaveBeenCalledWith({
      userId: "user-1",
      releaseId: "r1",
      query: expect.objectContaining({ limit: "5", status: "NOT_STARTED", sort: "position", order: "asc" }),
    });
  });

  it("POST enforces plan cap and returns 409 with headers when exceeded", async () => {
    mockGetCap.mockResolvedValue(500);
    mockGetUsage.mockResolvedValue(500);
    const { POST } = await import("@/app/api/releases/[id]/tasks/route");
    const req = makeRequest("https://app.local/api/releases/r1/tasks", { title: "Task" });
    const res = (await POST(req, params("r1"))) as Response;
    expect(res.status).toBe(409);
    const headers = res.headers;
    expect(headers.get("X-Plan-Limit")).toBe("500");
    expect(headers.get("X-Plan-Usage")).toBe("500");
    const body = await res.json();
    expect(body).toEqual({
      error: { code: "TASK_LIMIT", message: "Task limit reached for this release", details: { limit: 500 } },
    });
    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it("POST creates task and sets plan headers", async () => {
    mockGetCap.mockResolvedValue(500);
    mockGetUsage.mockResolvedValue(123);
    mockCreateTask.mockResolvedValue({ id: "t1", title: "Task" });
    const { POST } = await import("@/app/api/releases/[id]/tasks/route");
    const req = makeRequest("https://app.local/api/releases/r1/tasks", { title: "Task" });
    const res = (await POST(req, params("r1"))) as Response;
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "t1", title: "Task" });
    expect(res.headers.get("X-Plan-Limit")).toBe("500");
    expect(res.headers.get("X-Plan-Usage")).toBe("124");
    expect(mockCreateTask).toHaveBeenCalledWith({
      userId: "user-1",
      releaseId: "r1",
      input: expect.objectContaining({ title: "Task" }),
    });
  });
});
