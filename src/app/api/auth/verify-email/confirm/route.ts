import { NextRequest, NextResponse } from "next/server";
import { confirmEmailVerificationSchema } from "@/lib/validation/auth";
import { confirmEmailVerification } from "@/server/services/authService";
import { respondWithError } from "@/lib/api/errorResponse";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const input = confirmEmailVerificationSchema.parse(payload);
    await confirmEmailVerification(input.token);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
