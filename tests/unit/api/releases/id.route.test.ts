/**
 * Unit tests for /api/releases/[id] route handlers (GET, PATCH, DELETE).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAccessToken = vi.fn();
const mockRespondWithError = vi.fn();
const mockGetRelease = vi.fn();
const mockPatchRelease = vi.fn();
const mockDeleteRelease = vi.fn();

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
vi.mock("@/server/services/releaseService", () => ({
  getReleaseService: mockGetRelease,
  patchReleaseService: mockPatchRelease,
  deleteReleaseService: mockDeleteRelease,
}));

function params(id: string) {
  return { params: Promise.resolve({ id }) } as any;
}

describe("/api/releases/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccessToken.mockReturnValue({ sub: "user-1" });
    mockRespondWithError.mockReturnValue(new Response("error", { status: 500 }));
  });

  it("GET returns a release", async () => {
    mockGetRelease.mockResolvedValue({ id: "r1", name: "Alpha" });
    const { GET } = await import("@/app/api/releases/[id]/route");
    const res = (await GET({} as never, params("r1"))) as Response;
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "r1", name: "Alpha" });
    expect(mockGetRelease).toHaveBeenCalledWith({ userId: "user-1", id: "r1" });
  });

  it("PATCH updates a release", async () => {
    mockPatchRelease.mockResolvedValue({ id: "r1", name: "New" });
    const { PATCH } = await import("@/app/api/releases/[id]/route");
    const req = { json: async () => ({ name: "New" }) } as any;
    const res = (await PATCH(req, params("r1"))) as Response;
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "r1", name: "New" });
    expect(mockPatchRelease).toHaveBeenCalledWith({ userId: "user-1", id: "r1", data: { name: "New" } });
  });

  it("DELETE removes a release and returns 204", async () => {
    mockDeleteRelease.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/releases/[id]/route");
    const res = (await DELETE({} as never, params("r1"))) as Response;
    expect(res.status).toBe(204);
    expect(mockDeleteRelease).toHaveBeenCalledWith({ userId: "user-1", id: "r1" });
  });
});
