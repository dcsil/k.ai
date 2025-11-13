/**
 * Unit tests for POST /api/tasks/[taskId]/complete.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAccessToken = vi.fn();
const mockRespondWithError = vi.fn();
const mockCompleteTask = vi.fn();

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
vi.mock("@/server/services/taskService", () => ({ completeTaskService: mockCompleteTask }));

function params(taskId: string): { params: Promise<{ taskId: string }> } {
  return { params: Promise.resolve({ taskId }) };
}

describe("POST /api/tasks/[taskId]/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccessToken.mockReturnValue({ sub: "user-1" });
    mockRespondWithError.mockReturnValue(new Response("error", { status: 500 }));
  });

  it("completes the task and returns updated payload", async () => {
    mockCompleteTask.mockResolvedValue({ id: "t1", status: "COMPLETED", completedAt: "2025-01-01T00:00:00Z" });
    const { POST } = await import("@/app/api/tasks/[taskId]/complete/route");
    const res = (await POST({} as never, params("t1"))) as Response;
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "t1", status: "COMPLETED", completedAt: "2025-01-01T00:00:00Z" });
    expect(mockCompleteTask).toHaveBeenCalledWith({ userId: "user-1", taskId: "t1" });
  });
});
