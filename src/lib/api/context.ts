/**
 * Extracts common metadata (IP + user agent) from incoming requests for auditing/security logic.
 * Services consume this lightweight shape when recording refresh tokens and login attempts.
 */
import { NextRequest } from "next/server";
import { RequestContext } from "@/server/services/authService";

export function extractRequestContext(request: NextRequest): RequestContext {
  return {
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: request.headers.get("user-agent"),
  };
}
