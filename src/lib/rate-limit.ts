const MAX_KEYS = 5000;

/** Best-effort, per-instance sliding-window limiter. Good enough to blunt casual abuse on a portfolio. */
export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, number[]>();

  // Drop only keys whose hits have all expired; wiping the map would hand every limited key a fresh budget.
  function prune(now: number) {
    for (const [key, times] of hits) if (times.every((time) => now - time >= windowMs)) hits.delete(key);
    // Still too many live keys: drop the oldest-inserted ones (memory bound under a flood).
    for (const key of hits.keys()) {
      if (hits.size <= MAX_KEYS) break;
      hits.delete(key);
    }
  }

  return {
    /** Records an attempt and returns true when the key was already over the limit. */
    hit(key: string, now = Date.now()) {
      if (hits.size > 1000) prune(now);
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
