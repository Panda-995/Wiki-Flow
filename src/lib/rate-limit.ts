type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const buckets = new Map<string, RateLimitEntry>();
let lastCleanup = 0;

function cleanupExpired(now: number) {
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;

  for (const [key, entry] of buckets) {
    if (now > entry.resetTime) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  cleanupExpired(now);

  const entry = buckets.get(key);
  if (!entry || now > entry.resetTime) {
    buckets.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetTime - now) / 1000)),
    };
  }

  entry.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "anonymous"
  );
}
