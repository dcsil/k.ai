/**
 * Unit tests for POST /api/releases/[id]/progress.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAccessToken = vi.fn();
const mockRespondWithError = vi.fn();
const mockComputeProgress = vi.fn();

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
vi.mock("@/server/services/releaseService", () => ({ computeReleaseProgress: mockComputeProgress }));

function params(id: string) {
  return { params: Promise.resolve({ id }) } as any;
}

describe("POST /api/releases/[id]/progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccessToken.mockReturnValue({ sub: "user-1" });
    mockRespondWithError.mockReturnValue(new Response("error", { status: 500 }));
  });

  it("returns computed progress", async () => {
    mockComputeProgress.mockResolvedValue({ total: 10, completed: 4, percent: 40 });
    const { POST } = await import("@/app/api/releases/[id]/progress/route");
    const res = (await POST({} as never, params("r1"))) as Response;
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ total: 10, completed: 4, percent: 40 });
    expect(mockComputeProgress).toHaveBeenCalledWith({ userId: "user-1", id: "r1" });
  });
});
