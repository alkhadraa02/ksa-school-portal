export interface LimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/** Fixed-window in-memory limiter. Good enough for a single-node deployment. */
export function createLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  function check(key: string, now: number = Date.now()): LimitResult {
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
    }
    entry.count += 1;
    if (entry.count > limit) {
      return { ok: false, remaining: 0, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
    }
    return { ok: true, remaining: limit - entry.count, retryAfterSec: 0 };
  }

  function reset() {
    hits.clear();
  }

  return { check, reset };
}

export const loginLimiter = createLimiter(8, 10 * 60 * 1000);
export const publicFormLimiter = createLimiter(10, 10 * 60 * 1000);
export const lookupLimiter = createLimiter(20, 10 * 60 * 1000);

export function clientKey(headers: Headers) {
  const fwd = headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? headers.get("x-real-ip") ?? "local").trim();
}
