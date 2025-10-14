/**
 * Unit tests focused on the refresh token API route. The suite simulates cookie extraction,
 * service success, and various failure conditions to ensure we rotate tokens and surface errors
 * consistently.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAttachRefreshTokenCookie = vi.fn();
const mockExtractRequestContext = vi.fn();
const mockRefreshSession = vi.fn();
const mockRespondWithError = vi.fn();

const requestContext = { ip: "192.0.2.55", userAgent: "vitest" };

vi.mock("next/server", () => {
  const createCookies = () => ({
    set: vi.fn(),
    get: vi.fn(),
  });

  class MockNextResponse extends Response {
    cookies = createCookies();

    constructor(body: BodyInit | null = null, init?: ResponseInit) {
      super(body, init);
    }

    static json(data: unknown, init?: ResponseInit) {
      const headers = new Headers(init?.headers);
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
      return new MockNextResponse(JSON.stringify(data), {
        ...init,
        headers,
      });
    }
  }

  class MockNextRequest extends Request {}

  return {
    NextResponse: MockNextResponse,
    NextRequest: MockNextRequest,
  };
});

vi.mock("@/lib/api/authCookies", () => ({
  attachRefreshTokenCookie: mockAttachRefreshTokenCookie,
}));

vi.mock("@/lib/api/context", () => ({
  extractRequestContext: mockExtractRequestContext,
}));

vi.mock("@/server/services/authService", () => ({
  refreshSession: mockRefreshSession,
}));

vi.mock("@/lib/api/errorResponse", () => ({
  respondWithError: mockRespondWithError,
}));

function createRequest(options?: { refreshToken?: string }) {
  const headers = new Headers({
    "x-forwarded-for": "192.0.2.55",
    "user-agent": "vitest",
  });

  const cookieValue = options?.refreshToken;

  return {
    json: async () => ({}),
    headers,
    cookies: {
      get: (name: string) => (name === "refresh_token" && cookieValue ? { value: cookieValue } : undefined),
    },
  } as unknown;
}

describe("POST /api/auth/refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExtractRequestContext.mockReturnValue(requestContext);
    mockRespondWithError.mockReturnValue(new Response("error", { status: 500 }));
  });

  it("returns new access token and rotates refresh cookie", async () => {
    const session = {
      accessToken: "new-access",
      accessTokenExpiresIn: 900,
      refreshToken: "rotated-refresh",
      refreshTokenExpiresAt: new Date("2025-03-01T00:00:00Z"),
    };

    mockRefreshSession.mockResolvedValue(session);

    const { POST } = await import("@/app/api/auth/refresh/route");
    const request = createRequest({ refreshToken: "existing-refresh" });

    const response = (await POST(request as never)) as Response;

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      accessToken: "new-access",
      accessTokenExpiresIn: 900,
    });

    expect(mockExtractRequestContext).toHaveBeenCalledWith(request);
    expect(mockRefreshSession).toHaveBeenCalledWith("existing-refresh", requestContext);
    expect(mockAttachRefreshTokenCookie).toHaveBeenCalledWith(response, "rotated-refresh", session.refreshTokenExpiresAt);
  });

  it("delegates to respondWithError when refreshSession throws", async () => {
    const failure = new Error("invalid token");
    mockRefreshSession.mockRejectedValue(failure);
    mockRespondWithError.mockReturnValue(new Response("unauthorized", { status: 401 }));

    const { POST } = await import("@/app/api/auth/refresh/route");
    const request = createRequest();

    const response = (await POST(request as never)) as Response;

    expect(mockExtractRequestContext).toHaveBeenCalledWith(request);
    expect(mockRefreshSession).toHaveBeenCalledWith(undefined, requestContext);
    expect(mockRespondWithError).toHaveBeenCalledWith(failure);
    expect(response.status).toBe(401);
  });

  it("returns error response when refresh cookie is missing", async () => {
    const missingCookieError = new Error("No refresh token");
    mockRefreshSession.mockRejectedValue(missingCookieError);
    mockRespondWithError.mockReturnValue(new Response("bad request", { status: 400 }));

    const { POST } = await import("@/app/api/auth/refresh/route");
    const request = createRequest();

    const response = (await POST(request as never)) as Response;

    expect(mockExtractRequestContext).toHaveBeenCalledWith(request);
    expect(mockRefreshSession).toHaveBeenCalledWith(undefined, requestContext);
    expect(mockRespondWithError).toHaveBeenCalledWith(missingCookieError);
    expect(response.status).toBe(400);
  });
});
