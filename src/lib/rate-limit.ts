/**
 * Simple in-memory rate limiter for auth routes.
 * Uses a sliding window approach with configurable limits.
 *
 * For production at scale, replace with Redis-based rate limiting.
 * This is sufficient for a single-instance deployment.
 */

type RateEntry = { count: number; resetAt: number };

const store = new Map<string, RateEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Check if a request should be rate-limited.
 * @param key - Unique identifier (e.g., IP + route)
 * @param maxRequests - Max requests per window
 * @param windowMs - Window size in milliseconds
 * @returns null if allowed, or { retryAfterSeconds } if rate-limited
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { retryAfterSeconds: number } | null {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { retryAfterSeconds };
  }

  return null;
}
