import { NextRequest } from "next/server";
import { RequestContext } from "@/server/services/authService";

export function extractRequestContext(request: NextRequest): RequestContext {
  return {
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: request.headers.get("user-agent"),
  };
}
