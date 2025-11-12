/**
 * Unit tests for /api/tasks/[taskId] PATCH, DELETE.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAccessToken = vi.fn();
const mockRespondWithError = vi.fn();
const mockUpdateTask = vi.fn();
const mockDeleteTask = vi.fn();

vi.mock("next/server", () => {
  class MockNextResponse extends Response {
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
  updateTaskService: mockUpdateTask,
  deleteTaskService: mockDeleteTask,
}));

function params(taskId: string) {
  return { params: Promise.resolve({ taskId }) } as any;
}

describe("/api/tasks/[taskId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccessToken.mockReturnValue({ sub: "user-1" });
    mockRespondWithError.mockReturnValue(new Response("error", { status: 500 }));
  });

  it("PATCH updates a task and returns 200", async () => {
    mockUpdateTask.mockResolvedValue({ id: "t1", title: "New" });
    const { PATCH } = await import("@/app/api/tasks/[taskId]/route");
    const req = { json: async () => ({ title: "New" }) } as any;
    const res = (await PATCH(req, params("t1"))) as Response;
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "t1", title: "New" });
    expect(mockUpdateTask).toHaveBeenCalledWith({ userId: "user-1", taskId: "t1", input: { title: "New" } });
  });

  it("DELETE removes a task and returns 204", async () => {
    mockDeleteTask.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/tasks/[taskId]/route");
    const res = (await DELETE({} as never, params("t1"))) as Response;
    expect(res.status).toBe(204);
    expect(mockDeleteTask).toHaveBeenCalledWith({ userId: "user-1", taskId: "t1" });
  });
});
