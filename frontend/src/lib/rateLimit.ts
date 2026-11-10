/**
 * Simple, efficient sliding-window in-memory rate limiter for Next.js App Router.
 * Prevents DDoS and brute-force attacks on public endpoints (/api/checkout, /api/contacto).
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired records every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((record, key) => {
      if (record.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60 * 1000, max: 20 }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || record.resetAt <= now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    rateLimitMap.set(identifier, newRecord);
    return {
      allowed: true,
      remaining: options.max - 1,
      resetAt: newRecord.resetAt,
    };
  }

  if (record.count >= options.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: options.max - record.count,
    resetAt: record.resetAt,
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
