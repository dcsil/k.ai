import { NextRequest, NextResponse } from "next/server";
import { requireAccessToken } from "@/lib/api/authHeader";
import { respondWithError } from "@/lib/api/errorResponse";
import { updateTaskService, deleteTaskService } from "@/server/services/taskService";
import { updateTaskSchema } from "@/lib/validation/task";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { sub: userId } = requireAccessToken(request);
    const { taskId } = await params;
    const body = await request.json();
    const input = updateTaskSchema.parse(body);
    const updated = await updateTaskService({ userId, taskId, input });
    return NextResponse.json(updated);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { sub: userId } = requireAccessToken(request);
    const { taskId } = await params;
    await deleteTaskService({ userId, taskId });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
