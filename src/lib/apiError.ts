export type ErrorDetails = Record<string, unknown> | undefined;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: ErrorDetails,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorResponseBody(error: ApiError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details ?? null,
    },
  };
}
