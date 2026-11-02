# Table QR codes on the Nuxt site

This site uses the same QR method as the restaurant's existing app. A printed code never points straight at the menu. It encodes a permanent short address on the restaurant's own domain, `https://<domain>/q/main`. The server looks up where that code should go, counts one anonymous scan and redirects. So the menu, a code's destination, or even the hosting can change without reprinting any table cards.

```
 Guest's phone camera
        │  scans the printed code: https://<domain>/q/main
        ▼
 GET /q/main  ─────►  server/routes/q/[code].get.js  (a Vercel function)
        │              └─ shared/qr/resolve.js
        │                 1. device type + OS family from the user agent (shared/qr/device.js)
        │                 2. >20 hits/min from one address → treated as "bot", not counted (shared/qr/rate-limit.js)
        │                 3. Supabase function record_qr_scan(code, device, os)
        │                      unknown/inactive code → null · bot → path, no scan stored · else 1 scan stored
        │                 4. 302 to the returned on-site path; otherwise /menu
        │                    (Cache-Control: no-store, X-Robots-Tag: noindex)
        ▼
 /menu  (app/pages/menu.vue: opens straight on the menu, with no hero)
```

## How the pieces fit

| Part | Where it lives |
|---|---|
| Public site, `/menu` page, `/q/<code>` redirect | **This Nuxt project**, on the restaurant's domain (e.g. `menu.<domain>`) |
| Database: `qr_destinations`, `qr_scan_events`, `record_qr_scan`, `qr_scan_summary` | The existing **Supabase** project. `supabase/qr-database-excerpt.sql` is a reference copy; the migrations in the existing app are the source. |
| Staff dashboard: edit destinations, add table codes, scan analytics, artwork downloads | The **existing app**, moved to its own address (e.g. `admin.<domain>`) |
| Artwork: plain, branded 150 × 200 mm, print PDF, decode checks, proof/final gate | The **existing app** (`src/lib/qr/artwork.ts`, `npm run qr:generate`) |

Both apps talk to the same Supabase project. A destination changed in the dashboard takes effect on this site at once. Scans counted here show up in the dashboard's analytics.

## Rules that stay in force

- **On-site paths only.** The database refuses anything that isn't an on-site path. `shared/qr/resolve.js` checks the answer again and ignores it otherwise, so `https://…` or `//…` can never become a redirect.
- **Unknown, deactivated or malformed codes** go to `/menu`, so a guest never hits a dead end. Malformed codes are never sent to the database.
- **If the database is slow (2.5 s timeout), down or not configured**, the guest still goes to `/menu`. The scan is simply not counted.
- **Privacy:** only the time, the code, the device type and the OS family are stored, by the database function. No IP address, user-agent string, cookie or identifier is stored. The rate limiter keeps the address in memory for a minute only.
- **Not counted:** link-preview bots and crawlers (WhatsApp, Slack, Facebook, headless browsers, the dashboard's own "Test live destination" check), and repeat hits from one address within a minute.
- **Search engines:** `/q/` is disallowed in `public/robots.txt` and sent with `X-Robots-Tag: noindex`.

## Settings (Vercel → Project → Environment Variables)

| Variable | Value |
|---|---|
| `NUXT_SUPABASE_URL` | The Supabase project URL, the same as the dashboard's `NEXT_PUBLIC_SUPABASE_URL` |
| `NUXT_SUPABASE_ANON_KEY` | The anon key, the same as the dashboard's `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Both are server-only here and never sent to the browser. The anon key is public by design: row-level security lets it run `record_qr_scan` and nothing else. **Never use the service-role key here.**

## Pages a destination can point to

`/menu` (the default), `/`, `/#visit` and `/#menu`. A query such as `/menu?t=12` is allowed and is ignored by the page. Any other path would show Nuxt's 404 page, so pick one of these in the dashboard.

## Going live

1. **Deploy this project to Vercel.** Import the repo; the build command is `nuxt build`. Set the two variables above.
2. **Point the restaurant's domain** (e.g. `menu.<domain>`) at this Vercel project. Move the existing app to `admin.<domain>`, and keep its `NEXT_PUBLIC_QR_BASE_URL=https://menu.<domain>`.
3. **Check from any computer:** `curl -I https://menu.<domain>/q/main` must show `302`, `location: /menu` and `cache-control: no-store`.
4. **In the dashboard (QR codes → Test live destination)**, it must say "Verified". The check is sent as a bot, so it is not counted.
5. **Download the Print PDF from the dashboard.** Its file name must not start with `PROOF-`.
6. **Scan a printed copy** with an iPhone and an Android phone, land on `/menu`, then confirm the scan appears in the dashboard's analytics.

The `PROOF-` artwork in the QR bundle encodes the placeholder `https://menu.example.com/q/main`. **Do not print it.**

## Tests

- `test/qr.test.mjs` (`npm test`) covers:
  - device and OS labels, and bot detection;
  - the code and path rules;
  - `/q/main → /menu` with one scan counted, and a per-table code going to its own destination;
  - unknown, malformed or unconfigured codes, and a down database, all going to `/menu`;
  - off-site answers being ignored;
  - bots and more than 20 hits a minute from one address not being counted;
  - the exact Supabase REST call.
