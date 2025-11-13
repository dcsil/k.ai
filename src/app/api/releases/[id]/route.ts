import { NextRequest, NextResponse } from "next/server";
import { requireAccessToken } from "@/lib/api/authHeader";
import { respondWithError } from "@/lib/api/errorResponse";
import { getReleaseService, patchReleaseService, deleteReleaseService } from "@/server/services/releaseService";
import { updateReleaseSchema } from "@/lib/validation/release";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub: userId } = requireAccessToken(_request);
    const { id } = await params;
    const release = await getReleaseService({ userId, id });
    return NextResponse.json(release);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub: userId } = requireAccessToken(request);
    const body = await request.json();
    const input = updateReleaseSchema.parse(body);
    const { id } = await params;
    const updated = await patchReleaseService({ userId, id, data: input });
    return NextResponse.json(updated);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub: userId } = requireAccessToken(request);
    const { id } = await params;
    await deleteReleaseService({ userId, id });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
