/**
 * Unit tests for the signup API handler, validating success responses, validation failures, and
 * error propagation without touching the database. Mocks keep the focus on HTTP-level behavior.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAttachRefreshTokenCookie = vi.fn();
const mockExtractRequestContext = vi.fn();
const mockSignupUser = vi.fn();
const mockFormatUserResponse = vi.fn();
const mockRespondWithError = vi.fn();

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
  signupUser: mockSignupUser,
  formatUserResponse: mockFormatUserResponse,
}));

vi.mock("@/lib/api/errorResponse", () => ({
  respondWithError: mockRespondWithError,
}));

function createRequest(body: unknown) {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.1",
    "user-agent": "vitest",
  });

  return {
    json: async () => body,
    headers,
    cookies: {
      get: () => undefined,
    },
  } as unknown;
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRespondWithError.mockReturnValue(new Response("error", { status: 500 }));
  });

  it("returns 201 with user payload and sets refresh cookie", async () => {
    const session = {
      user: { id: "user-1", email: "artist@example.com" },
      accessToken: "access-token",
      accessTokenExpiresIn: 900,
      refreshToken: "refresh-token",
      refreshTokenExpiresAt: new Date("2025-01-01T00:00:00Z"),
    };

    mockExtractRequestContext.mockReturnValue({ ip: "203.0.113.1", userAgent: "vitest" });
    mockSignupUser.mockResolvedValue(session);
    mockFormatUserResponse.mockReturnValue({ id: "user-1", email: "artist@example.com" });

    const { POST } = await import("@/app/api/auth/signup/route");
    const request = createRequest({
      email: "artist@example.com",
      password: "P@ssw0rd!",
      displayName: "Artist",
    });

    const response = (await POST(request as never)) as Response;

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({
      user: { id: "user-1", email: "artist@example.com" },
      accessToken: "access-token",
      accessTokenExpiresIn: 900,
    });

    expect(mockSignupUser).toHaveBeenCalledWith(
      {
        email: "artist@example.com",
        password: "P@ssw0rd!",
        displayName: "Artist",
        timezone: undefined,
      },
      { ip: "203.0.113.1", userAgent: "vitest" },
    );
    expect(mockAttachRefreshTokenCookie).toHaveBeenCalledTimes(1);
    expect(mockAttachRefreshTokenCookie.mock.calls[0][1]).toBe("refresh-token");
    expect(mockFormatUserResponse).toHaveBeenCalledWith(session.user);
  });

  it("delegates to respondWithError when validation fails", async () => {
    mockRespondWithError.mockReturnValue(new Response("validation", { status: 422 }));

    const { POST } = await import("@/app/api/auth/signup/route");
    const request = createRequest({ email: "not-an-email" });

    const response = (await POST(request as never)) as Response;

    expect(mockRespondWithError).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(422);
  });

  it("delegates to respondWithError when signup service throws", async () => {
    mockExtractRequestContext.mockReturnValue({ ip: null, userAgent: null });
    mockSignupUser.mockRejectedValue(new Error("boom"));
    mockRespondWithError.mockReturnValue(new Response("boom", { status: 500 }));

    const { POST } = await import("@/app/api/auth/signup/route");
    const request = createRequest({
      email: "artist@example.com",
      password: "P@ssw0rd!",
    });

    const response = (await POST(request as never)) as Response;

    expect(mockSignupUser).toHaveBeenCalled();
    expect(mockRespondWithError).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(500);
  });
});
