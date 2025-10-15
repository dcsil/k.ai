/**
 * Validates the password hashing helpers, covering both successful verification and failure cases
 * so downstream services can rely on predictable bcrypt behavior.
 */
import { describe, expect, it } from "vitest";

const PASSWORD = "Sup3rS3cret!";

describe("password helpers", () => {
  it("hashes and verifies a password", async () => {
    const { hashPassword, verifyPassword } = await import("@/lib/auth/password");
    const hash = await hashPassword(PASSWORD, 4);
    expect(hash).not.toBe(PASSWORD);
    expect(hash).toMatch(/^[\w.$\/]+$/);

    const ok = await verifyPassword(PASSWORD, hash);
    expect(ok).toBe(true);
  });

  it("returns false for an invalid password", async () => {
    const { hashPassword, verifyPassword } = await import("@/lib/auth/password");
    const hash = await hashPassword(PASSWORD, 4);

    const ok = await verifyPassword("wrong-password", hash);
    expect(ok).toBe(false);
  });
});
