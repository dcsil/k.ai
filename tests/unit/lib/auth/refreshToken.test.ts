/**
 * Sanity checks for refresh token helpers to guarantee token entropy and hashing behavior meet
 * expectations. These tests guard against accidental changes to encoding length or algorithm.
 */
import { describe, expect, it } from "vitest";

describe("refresh token helpers", () => {
  it("generates url-safe refresh tokens of expected length", async () => {
    const { generateRefreshToken } = await import("@/lib/auth/refreshToken");
    const token = generateRefreshToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns unique tokens", async () => {
    const { generateRefreshToken } = await import("@/lib/auth/refreshToken");
    const first = generateRefreshToken();
    const second = generateRefreshToken();
    expect(first).not.toBe(second);
  });

  it("hashes tokens with sha256 producing hex output", async () => {
    const { generateRefreshToken, hashToken } = await import("@/lib/auth/refreshToken");
    const token = generateRefreshToken();
    const hash = hashToken(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(token)).toBe(hash);
  });
});
