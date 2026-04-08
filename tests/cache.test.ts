import { describe, it, expect } from "vitest";
import { cached } from "../app/lib/cache";

describe("cache", () => {
  it("returns cached value within ttl", async () => {
    let count = 0;
    const f = async () => ++count;
    const a = await cached("k1", f, 1000);
    const b = await cached("k1", f, 1000);
    expect(a).toBe(1);
    expect(b).toBe(1);
  });
});
