import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";

export function attachRefreshTokenCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(appConfig.refreshTokenCookieName, token, {
    httpOnly: appConfig.refreshTokenCookieHttpOnly,
    sameSite: appConfig.refreshTokenCookieSameSite,
    secure: appConfig.refreshTokenCookieSecure,
    path: appConfig.refreshTokenCookiePath,
    expires: expiresAt,
  });
}

export function clearRefreshTokenCookie(response: NextResponse) {
  response.cookies.set(appConfig.refreshTokenCookieName, "", {
    httpOnly: appConfig.refreshTokenCookieHttpOnly,
    sameSite: appConfig.refreshTokenCookieSameSite,
    secure: appConfig.refreshTokenCookieSecure,
    path: appConfig.refreshTokenCookiePath,
    maxAge: 0,
  });
}
