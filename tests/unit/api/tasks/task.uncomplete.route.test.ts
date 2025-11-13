/**
 * Unit tests for POST /api/tasks/[taskId]/uncomplete.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAccessToken = vi.fn();
const mockRespondWithError = vi.fn();
const mockUncompleteTask = vi.fn();

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
vi.mock("@/server/services/taskService", () => ({ uncompleteTaskService: mockUncompleteTask }));

function params(taskId: string): { params: Promise<{ taskId: string }> } {
  return { params: Promise.resolve({ taskId }) };
}

describe("POST /api/tasks/[taskId]/uncomplete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccessToken.mockReturnValue({ sub: "user-1" });
    mockRespondWithError.mockReturnValue(new Response("error", { status: 500 }));
  });

  it("uncompletes the task and returns updated payload", async () => {
    mockUncompleteTask.mockResolvedValue({ id: "t1", status: "IN_PROGRESS", completedAt: null });
    const { POST } = await import("@/app/api/tasks/[taskId]/uncomplete/route");
    const res = (await POST({} as never, params("t1"))) as Response;
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "t1", status: "IN_PROGRESS", completedAt: null });
    expect(mockUncompleteTask).toHaveBeenCalledWith({ userId: "user-1", taskId: "t1" });
  });
});
