/* Small fixed-window rate limiter (ported unchanged from the QR system).
   State is per server instance (in memory). On Vercel that bounds abuse per warm
   instance, which is adequate for scan counting. For a strict global limit,
   swap this for a shared store (e.g. Upstash Redis) behind the same API. */
const buckets = new Map()
const MAX_KEYS = 10_000

export function rateLimit(key, limit, windowMs, now = Date.now()) {
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_KEYS) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
      if (buckets.size >= MAX_KEYS) buckets.clear()
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterMs: 0 }
  }
  bucket.count += 1
  if (bucket.count > limit) return { ok: false, retryAfterMs: bucket.resetAt - now }
  return { ok: true, retryAfterMs: 0 }
}

/* First address in x-forwarded-for (set by Vercel), else x-real-ip. Used only as a
   short-lived in-memory key; never stored. `get` reads one request header. */
export function clientIp(get) {
  const fwd = get('x-forwarded-for')
  return (fwd && fwd.split(',')[0].trim()) || get('x-real-ip') || 'unknown'
}

export function _resetRateLimit() {
  buckets.clear()
}
