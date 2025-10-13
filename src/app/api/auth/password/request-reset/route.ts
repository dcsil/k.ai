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
