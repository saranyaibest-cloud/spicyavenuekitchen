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
    squareAccessToken: '',
    squareLocationId: process.env.NUXT_SQUARE_LOCATION_ID || process.env.NUXT_PUBLIC_SQUARE_LOCATION_ID || '',
    squarePickupPrepTime: process.env.NUXT_SQUARE_PICKUP_PREP_TIME || 'PT30M',
    squareDeliveryBeta: process.env.NUXT_SQUARE_DELIVERY_BETA === 'true',
    squareDeliveryZips: process.env.NUXT_SQUARE_DELIVERY_ZIPS || '',
    squareDeliveryFeeCents: process.env.NUXT_SQUARE_DELIVERY_FEE_CENTS || '',
    public: {
      menuUrl: process.env.VITE_MENU_URL || '',
      squareApplicationId: process.env.NUXT_PUBLIC_SQUARE_APPLICATION_ID || '',
      squareLocationId: process.env.NUXT_PUBLIC_SQUARE_LOCATION_ID || '',
      squareEnvironment: process.env.NUXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox',
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
