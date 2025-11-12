import { NextRequest, NextResponse } from "next/server";
import { requireAccessToken } from "@/lib/api/authHeader";
import { respondWithError } from "@/lib/api/errorResponse";
import { listReleasesService, createReleaseService } from "@/server/services/releaseService";
import { listReleasesQuerySchema, createReleaseSchema } from "@/lib/validation/release";

export async function GET(request: NextRequest) {
  try {
    const { sub: userId } = requireAccessToken(request);
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const { limit, cursor, archived, sort, order } = listReleasesQuerySchema.parse(query);
    const result = await listReleasesService({ userId, query: { limit, cursor, archived, sort, order } });
    return NextResponse.json(result);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sub: userId } = requireAccessToken(request);
    const body = await request.json();
    const input = createReleaseSchema.parse(body);
    const release = await createReleaseService({ userId, name: input.name, createDefaultTasks: input.createDefaultTasks });
    return NextResponse.json(release, { status: 201 });
  } catch (error) {
    return respondWithError(error);
  }
}
