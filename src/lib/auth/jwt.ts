/**
 * JWT helper functions dedicated to access tokens. These wrappers make sure we always source the
 * runtime secret from appConfig and provide typed claims for downstream consumers.
 */
import jwt, { JwtPayload } from "jsonwebtoken";
import { ensureJwtSecret, appConfig } from "@/lib/config";

export interface AccessTokenClaims extends JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export function createAccessToken(claims: { sub: string; email: string; role: string }) {
  const secret = ensureJwtSecret();
  return jwt.sign(claims, secret, { expiresIn: appConfig.accessTokenTtlSeconds });
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const secret = ensureJwtSecret();
  const decoded = jwt.verify(token, secret);
  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }
  return decoded as AccessTokenClaims;
}
