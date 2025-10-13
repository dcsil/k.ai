import { NextRequest, NextResponse } from "next/server";
import { signupSchema } from "@/lib/validation/auth";
import { extractRequestContext } from "@/lib/api/context";
import { signupUser, formatUserResponse } from "@/server/services/authService";
import { attachRefreshTokenCookie } from "@/lib/api/authCookies";
import { respondWithError } from "@/lib/api/errorResponse";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const input = signupSchema.parse(payload);
    const session = await signupUser(input, extractRequestContext(request));

    const response = NextResponse.json(
      {
        user: formatUserResponse(session.user),
        accessToken: session.accessToken,
        accessTokenExpiresIn: session.accessTokenExpiresIn,
      },
      { status: 201 },
    );

    attachRefreshTokenCookie(response, session.refreshToken, session.refreshTokenExpiresAt);
    return response;
  } catch (error) {
    return respondWithError(error);
  }
}
