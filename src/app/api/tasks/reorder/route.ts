import { NextRequest, NextResponse } from "next/server";
import { requireAccessToken } from "@/lib/api/authHeader";
import { respondWithError } from "@/lib/api/errorResponse";
import { reorderTasksService } from "@/server/services/taskService";
import { reorderTasksSchema } from "@/lib/validation/task";

export async function POST(request: NextRequest) {
  try {
    const { sub: userId } = requireAccessToken(request);
    const body = await request.json();
    const input = reorderTasksSchema.parse(body);
    await reorderTasksService({ userId, releaseId: input.releaseId, positions: input.positions });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
