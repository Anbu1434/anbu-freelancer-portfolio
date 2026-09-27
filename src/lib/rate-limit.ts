/** Best-effort, per-instance sliding-window limiter. Good enough to blunt casual abuse on a portfolio. */
export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, number[]>();

  return {
    /** Records an attempt and returns true when the key was already over the limit. */
    hit(key: string, now = Date.now()) {
      if (hits.size > 1000) hits.clear();
      const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
      const limited = recent.length >= max;
      if (!limited) recent.push(now);
      hits.set(key, recent);
      return limited;
    },
    reset(key: string) {
      hits.delete(key);
    },
  };
}
