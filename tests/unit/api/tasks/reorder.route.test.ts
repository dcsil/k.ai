/**
 * Unit tests for POST /api/tasks/reorder.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAccessToken = vi.fn();
const mockRespondWithError = vi.fn();
const mockReorderTasks = vi.fn();

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
vi.mock("@/server/services/taskService", () => ({ reorderTasksService: mockReorderTasks }));

type MinimalJsonRequest = { json: () => Promise<unknown> };
function makeRequest(body: unknown): MinimalJsonRequest {
  return { json: async () => body };
}

describe("POST /api/tasks/reorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccessToken.mockReturnValue({ sub: "user-1" });
    mockRespondWithError.mockReturnValue(new Response("error", { status: 500 }));
  });

  it("reorders tasks and returns 204", async () => {
    mockReorderTasks.mockResolvedValue(undefined);
    const { POST } = await import("@/app/api/tasks/reorder/route");
    const req = makeRequest({ releaseId: "r1", positions: [{ taskId: "t1", position: 1 }] });
    const res = (await POST(req as never)) as Response;
    expect(res.status).toBe(204);
    expect(mockReorderTasks).toHaveBeenCalledWith({ userId: "user-1", releaseId: "r1", positions: [{ taskId: "t1", position: 1 }] });
  });

  it("delegates to respondWithError for validation errors", async () => {
    // Missing releaseId should trigger validation in route.
    const { POST } = await import("@/app/api/tasks/reorder/route");
    mockRespondWithError.mockReturnValue(new Response("validation", { status: 422 }));
    const req = makeRequest({ positions: [] });
    const res = (await POST(req as never)) as Response;
    expect(mockRespondWithError).toHaveBeenCalled();
    expect(res.status).toBe(422);
  });
});
