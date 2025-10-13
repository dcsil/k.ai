import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/auth";
import { extractRequestContext } from "@/lib/api/context";
import { loginUser, formatUserResponse } from "@/server/services/authService";
import { attachRefreshTokenCookie } from "@/lib/api/authCookies";
import { respondWithError } from "@/lib/api/errorResponse";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const input = loginSchema.parse(payload);
    const session = await loginUser(input, extractRequestContext(request));

    const response = NextResponse.json({
      accessToken: session.accessToken,
      accessTokenExpiresIn: session.accessTokenExpiresIn,
      user: formatUserResponse(session.user),
    });

    attachRefreshTokenCookie(response, session.refreshToken, session.refreshTokenExpiresAt);
    return response;
  } catch (error) {
    return respondWithError(error);
  }
}
