const DEFAULT_ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes
const DEFAULT_REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days
const DEFAULT_PASSWORD_RESET_TTL = 60 * 60; // 60 minutes
const DEFAULT_EMAIL_VERIFICATION_TTL = 24 * 60 * 60; // 24 hours
const DEFAULT_MAX_LOGIN_ATTEMPTS = 5;
const DEFAULT_LOCKOUT_DURATION = 15 * 60; // 15 minutes

export const appConfig = {
  accessTokenTtlSeconds: Number(process.env.JWT_ACCESS_TTL ?? DEFAULT_ACCESS_TOKEN_TTL),
  refreshTokenTtlSeconds: Number(process.env.JWT_REFRESH_TTL ?? DEFAULT_REFRESH_TOKEN_TTL),
  passwordResetTtlSeconds: Number(process.env.PASSWORD_RESET_TTL ?? DEFAULT_PASSWORD_RESET_TTL),
  emailVerificationTtlSeconds: Number(process.env.EMAIL_VERIFICATION_TTL ?? DEFAULT_EMAIL_VERIFICATION_TTL),
  maxLoginAttempts: Number(process.env.AUTH_MAX_LOGIN_ATTEMPTS ?? DEFAULT_MAX_LOGIN_ATTEMPTS),
  lockoutDurationSeconds: Number(process.env.AUTH_LOCKOUT_DURATION ?? DEFAULT_LOCKOUT_DURATION),
  refreshTokenCookieName: "refresh_token",
  refreshTokenCookiePath: "/",
  refreshTokenCookieSameSite: (process.env.REFRESH_COOKIE_SAME_SITE ?? "lax") as "lax" | "strict" | "none",
  refreshTokenCookieSecure: process.env.NODE_ENV === "production",
  refreshTokenCookieHttpOnly: true,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
};

export function ensureJwtSecret(): string {
  if (!appConfig.jwtAccessSecret) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }
  return appConfig.jwtAccessSecret;
}
