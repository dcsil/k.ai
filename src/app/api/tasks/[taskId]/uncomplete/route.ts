import { NextRequest, NextResponse } from "next/server";
import { requireAccessToken } from "@/lib/api/authHeader";
import { respondWithError } from "@/lib/api/errorResponse";
import { uncompleteTaskService } from "@/server/services/taskService";

export async function POST(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { sub: userId } = requireAccessToken(request);
    const { taskId } = await params;
    const updated = await uncompleteTaskService({ userId, taskId });
    return NextResponse.json(updated);
  } catch (error) {
    return respondWithError(error);
  }
}
