import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAttachRefreshTokenCookie = vi.fn();
const mockExtractRequestContext = vi.fn();
const mockLoginUser = vi.fn();
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
  loginUser: mockLoginUser,
  formatUserResponse: mockFormatUserResponse,
}));

vi.mock("@/lib/api/errorResponse", () => ({
  respondWithError: mockRespondWithError,
}));

function createRequest(body: unknown) {
  const headers = new Headers({
    "x-forwarded-for": "198.51.100.10",
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

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRespondWithError.mockReturnValue(new Response("error", { status: 500 }));
  });

  it("returns 200 with access token and user snapshot", async () => {
    const session = {
      user: { id: "user-1", email: "artist@example.com" },
      accessToken: "access-token",
      accessTokenExpiresIn: 900,
      refreshToken: "refresh-token",
      refreshTokenExpiresAt: new Date("2025-02-01T00:00:00Z"),
    };

    mockExtractRequestContext.mockReturnValue({ ip: "198.51.100.10", userAgent: "vitest" });
    mockLoginUser.mockResolvedValue(session);
    mockFormatUserResponse.mockReturnValue({ id: "user-1", email: "artist@example.com" });

    const { POST } = await import("@/app/api/auth/login/route");
    const request = createRequest({ email: "artist@example.com", password: "P@ssw0rd!" });

    const response = (await POST(request as never)) as Response;

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      accessToken: "access-token",
      accessTokenExpiresIn: 900,
      user: { id: "user-1", email: "artist@example.com" },
    });

    expect(mockLoginUser).toHaveBeenCalledWith(
      { email: "artist@example.com", password: "P@ssw0rd!" },
      { ip: "198.51.100.10", userAgent: "vitest" },
    );
    expect(mockAttachRefreshTokenCookie).toHaveBeenCalledWith(expect.any(Response), "refresh-token", expect.any(Date));
  });

  it("delegates to respondWithError when login fails", async () => {
    mockExtractRequestContext.mockReturnValue({});
    mockLoginUser.mockRejectedValue(new Error("bad creds"));
    mockRespondWithError.mockReturnValue(new Response("unauthorized", { status: 401 }));

    const { POST } = await import("@/app/api/auth/login/route");
    const request = createRequest({ email: "artist@example.com", password: "wrong" });

    const response = (await POST(request as never)) as Response;

    expect(mockLoginUser).toHaveBeenCalled();
    expect(mockRespondWithError).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(401);
  });
});
