import { NextRequest, NextResponse } from "next/server";
import { requireAccessToken } from "@/lib/api/authHeader";
import { respondWithError } from "@/lib/api/errorResponse";
import { computeReleaseProgress } from "@/server/services/releaseService";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub: userId } = requireAccessToken(request);
    const { id } = await params;
    const result = await computeReleaseProgress({ userId, id });
    return NextResponse.json(result);
  } catch (error) {
    return respondWithError(error);
  }
}
