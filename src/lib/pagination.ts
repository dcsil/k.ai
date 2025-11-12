/**
 * Minimal opaque cursor helpers for cursor-based pagination.
 * We encode a small JSON payload as base64 to keep cursors opaque to clients.
 *
 * Shape is flexible per list: commonly includes id and a sort field (e.g., createdAt or position).
 */
export type CursorPayload = Record<string, string | number | null>;

export function encodeCursor(payload: CursorPayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeCursor<T extends CursorPayload>(cursor: string | null | undefined): T | null {
  if (!cursor) return null;
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function getLimit(input: unknown, defaultLimit = 20, maxLimit = 100): number {
  const n = typeof input === "string" ? Number(input) : typeof input === "number" ? input : NaN;
  if (!Number.isFinite(n) || n <= 0) return defaultLimit;
  return Math.min(Math.floor(n), maxLimit);
}
