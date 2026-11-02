import tailwindcss from '@tailwindcss/vite'

// Two pages: / (the one-page site) and /menu (where table QR codes land), plus the
// server route /q/<code> that counts a scan and redirects (server/routes/q/[code].get.js).
// Components are imported explicitly in every file (auto-registration is off),
// which keeps each section self-describing and avoids name clashes with shadcn-vue.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },

  css: ['~/assets/css/main.css'],
  components: false,

  vite: {
    plugins: [tailwindcss()],
  },

  // VITE_MENU_URL is kept from the previous version so .env files keep working.
  // At runtime it can also be overridden with NUXT_PUBLIC_MENU_URL.
  runtimeConfig: {
    // Server-only. Used by /q/<code> to call the Supabase function record_qr_scan.
    // Set on Vercel as NUXT_SUPABASE_URL and NUXT_SUPABASE_ANON_KEY (the same project
    // and anon key as the admin dashboard). Unset: every code still redirects to /menu.
    supabaseUrl: '',
    supabaseAnonKey: '',
    public: {
      menuUrl: process.env.VITE_MENU_URL || '',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Spicy Avenue Kitchen · Indian restaurant in Katy, Texas',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content: 'Spicy Avenue Kitchen, 23519 Katy FWY, Ste#501, Katy, Texas. Andhra and South Indian dishes, dum biryani and tandoor. See the menu and get directions.',
        },
        { name: 'theme-color', content: '#13171c' },
      ],
      link: [
        { rel: 'icon', href: '/brand/chili.jpg' },
        // Remove these two preloads if you switch to Fontshare's hosted CSS (see public/fonts/README.md).
        { rel: 'preload', href: '/fonts/Satoshi-Variable.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
        { rel: 'preload', href: '/fonts/Gambetta-Variable.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
      ],
      // Marks JS as on before first paint, so the hero can hold its pre-animation state
      // (see "Pre-animation state" in app/assets/css/main.css).
      script: [{ innerHTML: "document.documentElement.classList.add('js')", tagPosition: 'head' }],
    },
  },

  // Pages are prerendered to static HTML; /q/** always runs on the server and is never cached.
  // Deploy to Vercel with `nuxt build` (the Vercel preset is picked automatically there).
  routeRules: {
    '/': { prerender: true },
    '/menu': { prerender: true },
    '/q/**': { headers: { 'cache-control': 'no-store, max-age=0', 'x-robots-tag': 'noindex' } },
  },
})
