import { NextRequest, NextResponse } from "next/server";
import { requireAccessToken } from "@/lib/api/authHeader";
import { respondWithError } from "@/lib/api/errorResponse";
import { listTasksService, createTaskService } from "@/server/services/taskService";
import { listTasksQuerySchema, createTaskSchema } from "@/lib/validation/task";
import { getTaskCapForRelease, getTaskUsageForRelease } from "@/server/services/releaseService";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub: userId } = requireAccessToken(request);
    const { id: releaseId } = await params;
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const parsed = listTasksQuerySchema.parse(query);
    const result = await listTasksService({ userId, releaseId, query: parsed });
    return NextResponse.json(result);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub: userId } = requireAccessToken(request);
    const { id: releaseId } = await params;
    const body = await request.json();
    const input = createTaskSchema.parse(body);

    // Enforce task cap with headers as per spec
    const [cap, usage] = await Promise.all([
      getTaskCapForRelease(userId, releaseId),
      getTaskUsageForRelease(userId, releaseId),
    ]);
    if (usage >= cap) {
      return NextResponse.json(
        { error: { code: "TASK_LIMIT", message: "Task limit reached for this release", details: { limit: cap } } },
        { status: 409, headers: { "X-Plan-Limit": String(cap), "X-Plan-Usage": String(usage) } },
      );
    }

    const created = await createTaskService({ userId, releaseId, input });
    const response = NextResponse.json(created, { status: 201 });
    response.headers.set("X-Plan-Limit", String(cap));
    response.headers.set("X-Plan-Usage", String(usage + 1));
    return response;
  } catch (error) {
    return respondWithError(error);
  }
}
