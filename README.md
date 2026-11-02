# Spicy Avenue Kitchen website

This is the website for Spicy Avenue Kitchen, an Indian restaurant at 23519 Katy FWY, Ste#501, Katy, Texas. It has three addresses:

- `/` is the one-page site.
- `/menu` is a menu-only page, where the table QR codes land.
- `/q/<code>` is the permanent QR address. It counts a scan and redirects (see [docs/qr-system.md](docs/qr-system.md)).

**Stack:** Nuxt 4 (Vue 3), Tailwind CSS v4, shadcn-vue components on Reka UI (the Vue port of Radix primitives), and GSAP for all motion. The motion effects are Vue/GSAP versions of patterns from Aceternity UI and Magic UI.

## Run it (Windows PowerShell)

You need Node 22.22 or newer (or Node 24.11+).

```powershell
npm.cmd install
powershell -ExecutionPolicy Bypass -File scripts\get-fonts.ps1   # optional, see public/fonts/README.md
npm.cmd test
npm.cmd run dev          # http://localhost:3000  (try http://localhost:3000/q/main)
npm.cmd run build        # production build (Vercel runs this)
npm.cmd run preview      # serve the production build locally
```

**Hosting:** Vercel. The pages are prerendered, and `/q/<code>` runs as a Vercel function. To count scans, set `NUXT_SUPABASE_URL` and `NUXT_SUPABASE_ANON_KEY` in Vercel (see `.env.example`). Without them, every QR code still redirects to `/menu`; the scans just aren't counted. `npm run generate` (static only) would drop the `/q/` redirect, so don't use it for the live site.

## Where things are

| Path | What it holds |
|---|---|
| `app/pages/index.vue`, `app/pages/menu.vue` | The one-page site and the menu-only page (QR landing) |
| `app/composables/useSiteState.js` | Shared page state: the active category, the open dish and the assistant |
| `server/routes/q/[code].get.js`, `shared/qr/` | The QR redirect and its logic (device labels, rate limit, safe paths, the Supabase call) |
| `docs/qr-system.md`, `supabase/qr-database-excerpt.sql` | How the QR system works with the existing dashboard, and how to go live |
| `app/components/sections/` | Header, Hero, About, Favourites, Menu, Gallery, Visit, Footer and the Menu assistant |
| `app/components/menu/` | The single card spec (`SpecCard`) plus dish, category, info and dialog parts |
| `app/components/ui/` | shadcn-vue parts on Reka UI: Button (cva), Sheet, Tabs, Popover |
| `app/components/fx/` | Effects: BlurText, ScrollRevealText, Marquee, HeatField (WebGL) |
| `app/lib/gsap.js`, `app/composables/useGsap.js` | GSAP setup: the brand ease, plugins, reduced-motion handling and cleanup |
| `app/plugins/smooth-anchors.client.js` | Smooth in-page jumps for every `#` link (GSAP ScrollToPlugin) |
| `app/data/site.js` | Verified business facts. `phone`, `hours` and `social` stay empty until confirmed. |
| `app/data/menu.snapshot.json` | Menu used when no live URL is set. **It is partial: replace it with the full export.** |
| `app/data/menu-tags.json`, `app/data/glossary.json` | Card tag lines and the "What is this?" glossary (all `reviewed:false`) |
| `app/assets/food/{hero,categories,items,gallery}/` | Drop photos here. Sections pick them up automatically. |
| `scripts/` | Tag and glossary checks, plus the font download script |
| `test/` | `node --test` suites for the menu logic, the assistant engine, the QR redirect, content and copy rules |

## Motion

| Where | Effect | After |
|---|---|---|
| Hero | Headline words blur in; the buttons rise; the image unmasks upward; the image drifts slightly as you scroll; the WebGL heat haze fades as you scroll | Magic UI Blur Fade / Aceternity Text Generate Effect |
| Hero background | Hairline grid fading out | Aceternity Grid Background |
| About | Heading words light up as they scroll in; category cards stagger in | Magic UI Text Reveal |
| Cards | A soft light follows the mouse; 2px lift on hover | Aceternity Card Spotlight |
| Favourites | Slow marquee of the five dish names (slows on hover, pauses off-screen); cards slide in | Magic UI Marquee |
| Menu | The tab indicator slides between categories; cards settle in after each change | |
| Gallery | On desktop with 4+ photos, the section pins and the row scrolls sideways | Horizontal scroll sections |
| Visit | Address lines rise from a mask; the map card unmasks | |
| Footer | The restaurant name, in large type, rises into place; the back-to-top ring fills with scroll progress | Oversized footer type |

Every effect turns off for `prefers-reduced-motion`. Wheel and touch scrolling stay native. Smooth-scroll libraries move the page with a transform, which would break the sticky menu bar, the browser's find-in-page and screen-reader scrolling. Only anchor jumps are smoothed.

Dialogs, the drawer and the popover animate in and out with CSS keyframes, because Reka UI waits for those to finish before removing the element.

## Content rules

- Never invent hours, a phone number, reviews, offers, prices, or diet, allergen or spice claims. A missing price shows a dash, never $0.
- The assistant is a deterministic search (`app/lib/engine.js`). It must say "Answers come from the live menu. It is not an AI model, and it can't take orders." `test/copy.test.mjs` enforces this.
- Use the logo as it is: never redraw or recolour it.
- Fontshare fonts may not be redistributed (see `public/fonts/README.md`).

## Credits

- The shadcn-vue component patterns are © unovue, under the MIT licence.
- Reka UI is under the MIT licence.
- GSAP is under GreenSock's "no charge" standard licence (gsap.com/standard-license).
- Aceternity UI and Magic UI are credited as design references. No source code from either is included.
