import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows up to max hits in the window, then limits", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
    expect(limiter.hit("a", 0)).toBe(false);
    expect(limiter.hit("a", 10)).toBe(false);
    expect(limiter.hit("a", 20)).toBe(true);
    expect(limiter.hit("b", 20)).toBe(false);
  });

  it("forgets hits older than the window", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    expect(limiter.hit("a", 0)).toBe(false);
    expect(limiter.hit("a", 500)).toBe(true);
    expect(limiter.hit("a", 1001)).toBe(false);
  });

  it("reset clears a key", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    limiter.hit("a", 0);
    limiter.reset("a");
    expect(limiter.hit("a", 1)).toBe(false);
  });
});
