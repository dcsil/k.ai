/**
 * POST /api/auth/logout
 * Revokes the refresh token tied to the incoming cookie (if present) and clears the cookie on the
 * response. Returning 204 keeps the contract simple for clients.
 */
import { NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { logoutUser } from "@/server/services/authService";
import { clearRefreshTokenCookie } from "@/lib/api/authCookies";
import { respondWithError } from "@/lib/api/errorResponse";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(appConfig.refreshTokenCookieName)?.value;
    await logoutUser(refreshToken);
    const response = new NextResponse(null, { status: 204 });
    clearRefreshTokenCookie(response);
    return response;
  } catch (error) {
    return respondWithError(error);
  }
}
