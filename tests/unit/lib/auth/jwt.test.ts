import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_PAYLOAD = {
  sub: "user-123",
  email: "artist@example.com",
  role: "USER",
};

describe("auth jwt helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.JWT_ACCESS_SECRET;
  });

  it("signs and verifies an access token", async () => {
    process.env.JWT_ACCESS_SECRET = "test-secret";
    const { createAccessToken, verifyAccessToken } = await import("@/lib/auth/jwt");

    const token = createAccessToken(USER_PAYLOAD);
    const claims = verifyAccessToken(token);

    expect(claims.sub).toBe(USER_PAYLOAD.sub);
    expect(claims.email).toBe(USER_PAYLOAD.email);
    expect(claims.role).toBe(USER_PAYLOAD.role);
    expect(typeof claims.iat).toBe("number");
    expect(typeof claims.exp).toBe("number");
    expect(claims.exp).toBeGreaterThan(claims.iat!);
  });

  it("throws when JWT secret is missing", async () => {
    const { createAccessToken } = await import("@/lib/auth/jwt");
    expect(() => createAccessToken(USER_PAYLOAD)).toThrowError("JWT_ACCESS_SECRET is not configured");
  });

  it("rejects tokens signed with a different secret", async () => {
    process.env.JWT_ACCESS_SECRET = "signing-secret";
    const { createAccessToken } = await import("@/lib/auth/jwt");
    const token = createAccessToken(USER_PAYLOAD);

    vi.resetModules();
    process.env.JWT_ACCESS_SECRET = "other-secret";
    const { verifyAccessToken } = await import("@/lib/auth/jwt");

    expect(() => verifyAccessToken(token)).toThrow();
  });

  it("rejects malformed tokens", async () => {
    process.env.JWT_ACCESS_SECRET = "test-secret";
    const { verifyAccessToken } = await import("@/lib/auth/jwt");
    expect(() => verifyAccessToken("not-a-token")).toThrow();
  });
});
