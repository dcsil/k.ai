import { describe, it, expect } from "vitest";
import { encodeCursor, decodeCursor, getLimit } from "@/lib/pagination";

describe("pagination helpers", () => {
  it("encodes and decodes opaque cursor payloads", () => {
    const payload = { id: "t1", position: 42, createdAt: 0 };
    const cursor = encodeCursor(payload);
    expect(typeof cursor).toBe("string");
    const decoded = decodeCursor<typeof payload>(cursor);
    expect(decoded).toEqual(payload);
  });

  it("returns null for invalid cursors", () => {
    expect(decodeCursor("not-base64")).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor(null)).toBeNull();
  });

  it("getLimit applies defaults and bounds", () => {
    expect(getLimit(undefined)).toBe(20);
    expect(getLimit("10")).toBe(10);
    expect(getLimit("0")).toBe(20);
    expect(getLimit("-5")).toBe(20);
    expect(getLimit(9999, 20, 100)).toBe(100);
    expect(getLimit("101", 20, 100)).toBe(100);
    expect(getLimit(5)).toBe(5);
  });
});
