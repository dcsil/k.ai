/**
 * Integration coverage for the entire auth journey. This test exercises the real
 * Next.js route handlers against a cloned SQLite database so we validate that sign-up,
 * sign-in, refresh rotation, and logout behave correctly when Prisma, cookies, and
 * JWT creation all run together.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma";
import { hashToken } from "@/lib/auth/refreshToken";
import { cloneSqliteDatabase, ensureTestJwtSecret, resetPrismaClientSingleton } from "../../utils/integrationDb";

let prisma: PrismaClient;
let signupPost: typeof import("@/app/api/auth/signup/route").POST;
let loginPost: typeof import("@/app/api/auth/login/route").POST;
let refreshPost: typeof import("@/app/api/auth/refresh/route").POST;
let logoutPost: typeof import("@/app/api/auth/logout/route").POST;
let cookieName = "refresh_token";
let testDbCleanup: (() => void) | undefined;

function buildRequest(url: string, options: { json?: unknown; cookie?: string } = {}) {
  const headers = new Headers({
    "user-agent": "vitest",
    "x-forwarded-for": "127.0.0.1",
  });

  if (options.json !== undefined) {
    headers.set("content-type", "application/json");
  }

  if (options.cookie) {
    headers.set("cookie", `${cookieName}=${options.cookie}`);
  }

  return new NextRequest(url, {
    method: "POST",
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : undefined,
  });
}

describe.sequential("Auth API integration", () => {
  beforeAll(async () => {
    // Clone the dev database and publish its file URL to DATABASE_URL before we import Prisma.
    // resetPrismaClientSingleton clears the cached client so the subsequent import of @/lib/prisma
    // re-reads DATABASE_URL and binds to the freshly cloned file instead of the developer's local DB.
    const jwtSecret = ensureTestJwtSecret();
    const { cleanup } = cloneSqliteDatabase({ prefix: "auth-flow" });
    testDbCleanup = cleanup;

    resetPrismaClientSingleton();
    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.prisma;

    const configModule = await import("@/lib/config");
  // Overwrite the in-memory config after the module loads so downstream code signs JWTs with
  // the deterministic testing secret (matching ensureTestJwtSecret).
  configModule.appConfig.jwtAccessSecret = jwtSecret;
    cookieName = configModule.appConfig.refreshTokenCookieName;

    signupPost = (await import("@/app/api/auth/signup/route")).POST;
    loginPost = (await import("@/app/api/auth/login/route")).POST;
    refreshPost = (await import("@/app/api/auth/refresh/route")).POST;
    logoutPost = (await import("@/app/api/auth/logout/route")).POST;
  });

  afterEach(async () => {
    // Reset tables between scenarios to keep assertions deterministic.
    await prisma.$transaction([
      prisma.loginAttempt.deleteMany(),
      prisma.refreshToken.deleteMany(),
      prisma.passwordResetToken.deleteMany(),
      prisma.emailVerificationToken.deleteMany(),
      prisma.user.deleteMany(),
    ]);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    testDbCleanup?.();
  });

  it("allows a user to sign up, sign in, refresh, and logout", async () => {
    const email = `integration-${randomUUID()}@example.com`;
    const password = "Sup3rS3cret!";
    // console.log(`Database URL: ${process.env.DATABASE_URL}`);

    const signupRequest = buildRequest("http://localhost/api/auth/signup", {
      json: {
        email,
        password,
        displayName: "Integration Tester",
        timezone: "America/Toronto",
      },
    });

    const signupResponse = await signupPost(signupRequest as never);
    expect(signupResponse.status).toBe(201);

    const signupBody = await signupResponse.json();
    expect(signupBody.user.email).toBe(email);
    expect(signupBody.accessToken).toBeDefined();
    expect(signupBody.accessTokenExpiresIn).toBeGreaterThan(0);

    const initialRefreshCookie = signupResponse.cookies.get(cookieName);
    expect(initialRefreshCookie?.value).toBeTruthy();

    const loginRequest = buildRequest("http://localhost/api/auth/login", {
      json: { email, password },
    });

    const loginResponse = await loginPost(loginRequest as never);
    expect(loginResponse.status).toBe(200);

    const loginBody = await loginResponse.json();
    expect(loginBody.user.email).toBe(email);
    expect(loginBody.accessToken).toBeDefined();

    const loginRefreshCookie = loginResponse.cookies.get(cookieName);
    expect(loginRefreshCookie?.value).toBeTruthy();

    const refreshRequest = buildRequest("http://localhost/api/auth/refresh", {
      cookie: loginRefreshCookie!.value,
    });

    const refreshResponse = await refreshPost(refreshRequest as never);
    expect(refreshResponse.status).toBe(200);

    const refreshBody = await refreshResponse.json();
    expect(refreshBody.accessToken).toBeDefined();
    expect(refreshBody.accessTokenExpiresIn).toBeGreaterThan(0);

    const rotatedCookie = refreshResponse.cookies.get(cookieName);
    expect(rotatedCookie?.value).toBeTruthy();
    expect(rotatedCookie?.value).not.toBe(loginRefreshCookie!.value);

    const oldTokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(loginRefreshCookie!.value) },
    });
    expect(oldTokenRecord?.revokedAt).toBeTruthy();

    const newTokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(rotatedCookie!.value) },
    });
    expect(newTokenRecord?.revokedAt).toBeNull();

    const logoutRequest = buildRequest("http://localhost/api/auth/logout", {
      cookie: rotatedCookie!.value,
    });

    const logoutResponse = await logoutPost(logoutRequest as never);
    expect(logoutResponse.status).toBe(204);

    const clearedCookie = logoutResponse.cookies.get(cookieName);
    expect(clearedCookie?.value).toBe("");

    const revokedNewToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(rotatedCookie!.value) },
    });
    expect(revokedNewToken?.revokedAt).toBeTruthy();

    const loginAttempts = await prisma.loginAttempt.count();
    expect(loginAttempts).toBeGreaterThan(0);
  });
});
