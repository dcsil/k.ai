/**
 * Unit tests for GET/POST /api/releases route handlers.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAccessToken = vi.fn();
const mockRespondWithError = vi.fn();
const mockListReleases = vi.fn();
const mockCreateRelease = vi.fn();

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
  listReleasesService: mockListReleases,
  createReleaseService: mockCreateRelease,
}));

function makeRequest(url: string, body?: unknown) {
  return {
    url,
    json: async () => body,
    headers: new Headers(),
  } as unknown;
}

describe("/api/releases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccessToken.mockReturnValue({ sub: "user-1" });
    mockRespondWithError.mockReturnValue(new Response("error", { status: 500 }));
  });

  it("GET returns paginated releases with parsed query", async () => {
    mockListReleases.mockResolvedValue({ items: [{ id: "r1", name: "Alpha" }], nextCursor: null });
    const { GET } = await import("@/app/api/releases/route");
    const req = makeRequest("https://app.local/api/releases?limit=10&archived=false&sort=createdAt&order=desc");

    const res = (await GET(req as never)) as Response;
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ items: [{ id: "r1", name: "Alpha" }], nextCursor: null });
    expect(mockListReleases).toHaveBeenCalledWith({
      userId: "user-1",
      query: { limit: "10", cursor: undefined, archived: false, sort: "createdAt", order: "desc" },
    });
  });

  it("POST creates a release and returns 201", async () => {
    mockCreateRelease.mockResolvedValue({ id: "r1", name: "Beta" });
    const { POST } = await import("@/app/api/releases/route");
    const req = makeRequest("https://app.local/api/releases", { name: "Beta", createDefaultTasks: true });

    const res = (await POST(req as never)) as Response;
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ id: "r1", name: "Beta" });
    expect(mockCreateRelease).toHaveBeenCalledWith({ userId: "user-1", name: "Beta", createDefaultTasks: true });
  });

  it("delegates errors to respondWithError", async () => {
    mockListReleases.mockRejectedValue(new Error("boom"));
    mockRespondWithError.mockReturnValue(new Response("bad", { status: 400 }));
    const { GET } = await import("@/app/api/releases/route");
    const req = makeRequest("https://app.local/api/releases");
    const res = (await GET(req as never)) as Response;
    expect(mockRespondWithError).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(400);
  });
});
