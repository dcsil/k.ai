/**
 * POST /api/auth/password/reset
 * Exchanges a reset token for a new password by invoking authService. On success we simply return
 * 204 and let clients decide how to proceed; errors funnel through respondWithError.
 */
import { NextRequest, NextResponse } from "next/server";
import { passwordResetSchema } from "@/lib/validation/auth";
import { resetPassword } from "@/server/services/authService";
import { respondWithError } from "@/lib/api/errorResponse";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const input = passwordResetSchema.parse(payload);
    await resetPassword(input.token, input.newPassword);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
