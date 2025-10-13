import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError, errorResponseBody } from "@/lib/apiError";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function respondWithError(error: unknown) {
  if (error instanceof ApiError) {
    const response = NextResponse.json(errorResponseBody(error), { status: error.status });

    if (error.code === "ACCOUNT_LOCKED" && error.details) {
      const retry = (error.details as Record<string, unknown>).retryAfterSeconds;
      if (isNumber(retry)) {
        response.headers.set("Retry-After", Math.max(1, Math.ceil(retry)).toString());
      }
    }

    return response;
  }

  if (error instanceof ZodError) {
    const flattened = (error as ZodError).flatten();
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: flattened,
        },
      },
      { status: 422 },
    );
  }

  console.error("Unhandled API error", error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
        details: null,
      },
    },
    { status: 500 },
  );
}
