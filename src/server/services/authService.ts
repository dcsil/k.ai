import type { Prisma, User } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createAccessToken } from "@/lib/auth/jwt";
import { generateRefreshToken, hashToken } from "@/lib/auth/refreshToken";
import { appConfig } from "@/lib/config";
import { ApiError } from "@/lib/apiError";
import { serializeUser } from "@/server/repositories/userRepository";
import {
  createPasswordResetToken,
  findValidPasswordResetToken,
  invalidatePasswordResetTokensForUser,
} from "@/server/repositories/passwordResetTokenRepository";
import {
  createEmailVerificationToken,
  findValidEmailVerificationToken,
  invalidateEmailVerificationTokensForUser,
} from "@/server/repositories/emailVerificationTokenRepository";
import { recordLoginAttempt } from "@/server/repositories/loginAttemptRepository";
import { revokeRefreshToken, markRefreshTokenReplaced } from "@/server/repositories/refreshTokenRepository";

export type RequestContext = {
  ip?: string | null;
  userAgent?: string | null;
};

type AuthSession = {
  user: User;
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

function createSessionPayload(user: User, refreshToken: string, refreshTokenExpiresAt: Date): AuthSession {
  const accessToken = createAccessToken({ sub: user.id, email: user.email, role: user.role });
  return {
    user,
    accessToken,
    accessTokenExpiresIn: appConfig.accessTokenTtlSeconds,
    refreshToken,
    refreshTokenExpiresAt,
  };
}

function getRefreshExpiry() {
  return new Date(Date.now() + appConfig.refreshTokenTtlSeconds * 1000);
}

async function rotateRefreshToken(params: {
  user: User;
  refreshTokenId: string;
  context: RequestContext;
}) {
  const { user, refreshTokenId, context } = params;
  const newToken = generateRefreshToken();
  const newHash = hashToken(newToken);
  const newExpiry = getRefreshExpiry();

  const created = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: newHash,
      expiresAt: newExpiry,
      createdByIp: context.ip ?? undefined,
      userAgent: context.userAgent ?? undefined,
    },
  });

  await markRefreshTokenReplaced(refreshTokenId, created.id);

  return createSessionPayload(user, newToken, newExpiry);
}

export async function signupUser(
  input: { email: string; password: string; displayName?: string | null; timezone?: string | null },
  context: RequestContext,
) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, "EMAIL_EXISTS", "An account with that email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const refreshExpiresAt = getRefreshExpiry();

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        displayName: input.displayName ?? undefined,
        timezone: input.timezone ?? undefined,
      },
    });

    await tx.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: refreshExpiresAt,
        createdByIp: context.ip ?? undefined,
        userAgent: context.userAgent ?? undefined,
      },
    });

    return user;
  });

  return createSessionPayload(result, refreshToken, refreshExpiresAt);
}

function ensurePasswordHash(user: User) {
  if (!user.passwordHash) {
    throw new ApiError(400, "PASSWORD_NOT_SET", "Password login is not available for this account");
  }
}

function isLocked(user: User) {
  return user.lockedUntil !== null && user.lockedUntil.getTime() > Date.now();
}

export async function loginUser(
  input: { email: string; password: string },
  context: RequestContext,
) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const ip = context.ip ?? undefined;

  if (!user) {
    await recordLoginAttempt({ userId: undefined, success: false, reason: "USER_NOT_FOUND", ip });
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  if (isLocked(user)) {
    const retryAfterSeconds = Math.ceil((user.lockedUntil!.getTime() - Date.now()) / 1000);
    const error = new ApiError(423, "ACCOUNT_LOCKED", "Account is temporarily locked due to failed logins");
    error.details = { retryAfterSeconds };
    throw error;
  }

  ensurePasswordHash(user);

  const isValid = await verifyPassword(input.password, user.passwordHash!);
  if (!isValid) {
    const failed = user.failedLoginCount + 1;
    const updates: Prisma.UserUpdateInput = { failedLoginCount: failed };
    let lockoutApplied = false;

    if (failed >= appConfig.maxLoginAttempts) {
      updates.lockedUntil = new Date(Date.now() + appConfig.lockoutDurationSeconds * 1000);
      updates.failedLoginCount = 0;
      lockoutApplied = true;
    }

    await prisma.user.update({ where: { id: user.id }, data: updates });
    await recordLoginAttempt({ userId: user.id, success: false, reason: lockoutApplied ? "LOCKED" : "BAD_PASSWORD", ip });
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
  await recordLoginAttempt({ userId: user.id, success: true, ip });

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const refreshExpiresAt = getRefreshExpiry();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: refreshExpiresAt,
      createdByIp: context.ip ?? undefined,
      userAgent: context.userAgent ?? undefined,
    },
  });

  return createSessionPayload(user, refreshToken, refreshExpiresAt);
}

export async function refreshSession(
  refreshToken: string | undefined,
  context: RequestContext,
): Promise<AuthSession> {
  if (!refreshToken) {
    throw new ApiError(401, "REFRESH_TOKEN_MISSING", "Refresh token cookie is missing");
  }

  const tokenHash = hashToken(refreshToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing || existing.revokedAt) {
    throw new ApiError(401, "REFRESH_TOKEN_INVALID", "Refresh token is invalid or revoked");
  }

  if (existing.expiresAt.getTime() <= Date.now()) {
    await revokeRefreshToken(existing.id);
    throw new ApiError(401, "REFRESH_TOKEN_EXPIRED", "Refresh token has expired");
  }

  const user = await prisma.user.findUnique({ where: { id: existing.userId } });
  if (!user) {
    await revokeRefreshToken(existing.id);
    throw new ApiError(401, "REFRESH_TOKEN_INVALID", "Refresh token is invalid");
  }

  return rotateRefreshToken({ user, refreshTokenId: existing.id, context });
}

export async function logoutUser(refreshToken: string | undefined) {
  if (!refreshToken) {
    return;
  }

  const hashed = hashToken(refreshToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash: hashed } });
  if (!existing) {
    return;
  }

  await revokeRefreshToken(existing.id);
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { requested: false };
  }

  await invalidatePasswordResetTokensForUser(user.id);

  const token = generateRefreshToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + appConfig.passwordResetTtlSeconds * 1000);

  await createPasswordResetToken({ userId: user.id, tokenHash, expiresAt });

  return { requested: true, mockResetToken: token };
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashToken(token);
  const record = await findValidPasswordResetToken(tokenHash);
  if (!record) {
    throw new ApiError(400, "RESET_TOKEN_INVALID", "Password reset token is invalid or expired");
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user) {
    throw new ApiError(400, "RESET_TOKEN_INVALID", "Password reset token is invalid");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash, failedLoginCount: 0, lockedUntil: null } });
    await tx.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await tx.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  });
}

export async function requestEmailVerification(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  if (user.emailVerified) {
    return { alreadyVerified: true };
  }

  await invalidateEmailVerificationTokensForUser(user.id);

  const token = generateRefreshToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + appConfig.emailVerificationTtlSeconds * 1000);

  await createEmailVerificationToken({ userId: user.id, tokenHash, expiresAt });

  return { alreadyVerified: false, mockVerificationToken: token };
}

export async function confirmEmailVerification(token: string) {
  const tokenHash = hashToken(token);
  const record = await findValidEmailVerificationToken(tokenHash);
  if (!record) {
    throw new ApiError(400, "VERIFICATION_TOKEN_INVALID", "Verification token is invalid or expired");
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
    await tx.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  });
}

export function formatUserResponse(user: User) {
  return serializeUser(user);
}
