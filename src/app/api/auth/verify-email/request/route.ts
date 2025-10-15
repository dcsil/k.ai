/**
 * POST /api/auth/verify-email/request
 * Triggers generation of an email verification token for the authenticated user. Downstream
 * delivery mechanisms (email, notifications) will hook into the service layer; the route just
 * serialises the outcome.
 */
import { NextRequest, NextResponse } from "next/server";
import { respondWithError } from "@/lib/api/errorResponse";
import { requireAccessToken } from "@/lib/api/authHeader";
import { requestEmailVerification } from "@/server/services/authService";

export async function POST(request: NextRequest) {
  try {
    const claims = requireAccessToken(request);
    const result = await requestEmailVerification(claims.sub);
    return NextResponse.json(
      {
        ok: true,
        alreadyVerified: result.alreadyVerified,
        mockVerificationToken: result.mockVerificationToken ?? null,
      },
      { status: 202 },
    );
  } catch (error) {
    return respondWithError(error);
  }
}
