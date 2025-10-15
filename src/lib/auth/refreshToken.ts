/**
 * Utilities for creating and hashing refresh tokens. We generate URL-safe random bytes and persist
 * only the SHA-256 hash so leaked databases remain safe.
 */
import crypto from "node:crypto";

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
