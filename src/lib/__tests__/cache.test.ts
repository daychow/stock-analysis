// src/lib/__tests__/cache.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { CacheHelper } from "../cache";

describe("CacheHelper (in-memory fallback)", () => {
  let cache: CacheHelper;

  beforeEach(() => {
    cache = new CacheHelper(null);
  });

  it("returns null for missing key", async () => {
    const result = await cache.get("missing");
    expect(result).toBeNull();
  });

  it("stores and retrieves a value", async () => {
    await cache.set("key1", { data: "hello" }, 3600);
    const result = await cache.get("key1");
    expect(result).toEqual({ data: "hello" });
  });

  it("returns null for expired key", async () => {
    await cache.set("key2", { data: "old" }, -1);
    const result = await cache.get("key2");
    expect(result).toBeNull();
  });
});
