/**
 * POST /api/auth/password/request-reset
 * Initiates the password reset flow by delegating the email-focused logic to authService. The
 * route always returns 200 to avoid leaking user existence information.
 */
import { NextRequest, NextResponse } from "next/server";
import { requestPasswordResetSchema } from "@/lib/validation/auth";
import { requestPasswordReset } from "@/server/services/authService";
import { respondWithError } from "@/lib/api/errorResponse";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const input = requestPasswordResetSchema.parse(payload);
    const result = await requestPasswordReset(input.email);

    return NextResponse.json(
      {
        ok: true,
        requested: result.requested,
        mockResetToken: result.mockResetToken ?? null,
      },
      { status: 202 },
    );
  } catch (error) {
    return respondWithError(error);
  }
}
