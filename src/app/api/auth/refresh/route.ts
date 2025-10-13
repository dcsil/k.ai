import { NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { extractRequestContext } from "@/lib/api/context";
import { refreshSession } from "@/server/services/authService";
import { attachRefreshTokenCookie } from "@/lib/api/authCookies";
import { respondWithError } from "@/lib/api/errorResponse";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(appConfig.refreshTokenCookieName)?.value;
    const session = await refreshSession(refreshToken, extractRequestContext(request));

    const response = NextResponse.json({
      accessToken: session.accessToken,
      accessTokenExpiresIn: session.accessTokenExpiresIn,
    });

    attachRefreshTokenCookie(response, session.refreshToken, session.refreshTokenExpiresAt);
    return response;
  } catch (error) {
    return respondWithError(error);
  }
}
