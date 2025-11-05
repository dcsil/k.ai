import { NextRequest } from "next/server";
import { verifyAccessToken, AccessTokenClaims } from "@/lib/auth/jwt";
import { ApiError } from "@/lib/apiError";

export function requireAccessToken(request: NextRequest): AccessTokenClaims {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHORIZED", "Authorization header with Bearer token is required");
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    return verifyAccessToken(token);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ApiError(401, "UNAUTHORIZED", `Access token is invalid or expired: ${message}`);
  }
}
