/* Resolves a scanned QR code to an on-site page and records one anonymous scan.
   Same behaviour as the QR system's src/app/q/[code]/route.ts:
     1. classify the device from the user agent (mobile/tablet/desktop/bot + OS family)
     2. more than 20 hits a minute from one address → treated as "bot" (redirected, not counted)
     3. call the Supabase function record_qr_scan(code, device, os)
          unknown/inactive code → null, bot → path without storing a scan, else store 1 scan
     4. redirect to the returned path; anything else (unknown code, bad answer,
        database down, not configured) → /menu, so a guest never hits a dead end
   Kept free of Nuxt/Nitro so `npm test` can run it. */
import { classifyUserAgent } from './device.js'
import { clientIp, rateLimit } from './rate-limit.js'

export const FALLBACK_PATH = '/menu'
export const SCANS_PER_MINUTE = 20
const CODE_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

/* The database only accepts on-site paths; this repeats the check so a code can
   never become an open redirect, even if the database answer were tampered with. */
export function isSafePath(p) {
  return typeof p === 'string' && /^\/[A-Za-z0-9/_\-]*(\?[A-Za-z0-9=&_\-]*)?(#[A-Za-z0-9_\-]*)?$/.test(p) && !p.startsWith('//')
}

export function normaliseCode(code) {
  const c = String(code || '').trim().toLowerCase()
  return c.length >= 2 && c.length <= 40 && CODE_RE.test(c) ? c : null
}

/* Calls record_qr_scan through Supabase's REST API (PostgREST) with the public
   anon key; row-level security means that key can only run this one function. */
export function supabaseRpc({ url, anonKey, fetchImpl = fetch, timeoutMs = 2500 }) {
  if (!url || !anonKey) return null
  const endpoint = `${url.replace(/\/+$/, '')}/rest/v1/rpc/record_qr_scan`
  return async (args) => {
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) throw new Error(`record_qr_scan failed: HTTP ${res.status}`)
    return res.json()
  }
}

/* getHeader(name) → string | undefined.  rpc(args) → Promise<string | null> or null when not configured.
   Returns { target, code, device, os, counted }. */
export async function resolveScan({ code, getHeader, rpc }) {
  const c = normaliseCode(code)
  const ua = classifyUserAgent(getHeader('user-agent'))
  let device = ua.device
  if (!rateLimit(`scan:${clientIp(getHeader)}`, SCANS_PER_MINUTE, 60_000).ok) device = 'bot'

  let target = FALLBACK_PATH
  let counted = false
  if (c && rpc) {
    try {
      const data = await rpc({ p_code: c, p_device: device, p_os: ua.os })
      if (isSafePath(data)) {
        target = data
        counted = device !== 'bot'
      }
    } catch {
      // Database unreachable or slow: still get the guest to the menu.
    }
  }
  return { target, code: c, device, os: ua.os, counted }
}
