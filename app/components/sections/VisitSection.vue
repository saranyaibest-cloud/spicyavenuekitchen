<script setup>
import { ref } from 'vue'
import { SITE } from '~/data/site'
import { Button } from '~/components/ui/button'
import HoursTable from './HoursTable.vue'
import { useGsap } from '~/composables/useGsap'
import { gsap } from '~/lib/gsap'

/* ─────────────────────────────────────────────────────────────────────
   UNVERIFIED DATA SLOTS (all read from SITE in app/data/site.js)
   - SITE.phone: '+1…' string → adds a "Call" button (tel: link). null = hidden.
   - SITE.hours: [{ days, open, close }] (format in app/lib/hours.js) → hours
     table, today's row and an Open now / Closed now badge. null = the Google
     Maps line below is shown instead.
   Never fill these with guesses.
   ───────────────────────────────────────────────────────────────────── */
const hasHours = Array.isArray(SITE.hours) && SITE.hours.length > 0
const root = ref(null)

/* Address lines rise out of a mask; the map card unmasks upward and its
   frame comes back from grey as it enters (once). */
useGsap(root, ({ reduce }, el) => {
  if (reduce || !el) return
  const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 70%', once: true } })
  tl.from(el.querySelectorAll('[data-visit-line] > span'), { yPercent: 105, duration: 0.8, stagger: 0.08, ease: 'power3.out' })
    .from(el.querySelectorAll('[data-visit-fade]'), { opacity: 0, y: 12, duration: 0.5, stagger: 0.06 }, 0.3)
    .fromTo(el.querySelector('[data-visit-map]'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut' }, 0.1)
})
</script>

<template>
  <section id="visit" ref="root" aria-labelledby="visit-title" class="relative isolate overflow-hidden bg-cream py-16 text-ink nav:py-28">
    <div class="mx-auto grid max-w-[1240px] items-center gap-10 px-4 sm:px-6 lg:px-8 nav:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] nav:gap-20">
      <div>
        <p data-visit-fade class="mb-3.5 text-sm font-medium text-chili">Katy, Texas</p>
        <h2 id="visit-title" class="mb-4 text-section">Visit us</h2>
        <address class="mb-7 font-display text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] leading-tight not-italic">
          <span data-visit-line class="block overflow-hidden"><span class="block">{{ SITE.street }}</span></span>
          <span data-visit-line class="block overflow-hidden"><span class="block">{{ SITE.city }}</span></span>
        </address>

        <div data-visit-fade class="flex flex-wrap gap-3 max-nav:grid">
          <Button :href="SITE.directionsUrl" external arrow="external">Get directions</Button>
          <Button :href="SITE.mapsUrl" external variant="secondary">Google Maps listing</Button>
          <!-- CALL SLOT: renders only when SITE.phone is set. -->
          <Button v-if="SITE.phone" :href="`tel:${SITE.phone}`" variant="secondary">Call {{ SITE.phone }}</Button>
        </div>

        <!-- HOURS SLOT: table + badge only when SITE.hours is set; otherwise the Maps line. -->
        <HoursTable v-if="hasHours" :hours="SITE.hours" />
        <p v-else data-visit-fade class="mt-6 max-w-[40ch] text-[0.9375rem] leading-relaxed text-[#3a3c3b]">
          Opening hours and contact details are on the
          <a :href="SITE.mapsUrl" target="_blank" rel="noopener noreferrer" class="font-bold text-chili underline underline-offset-[3px]">Google Maps listing<span class="sr-only"> (opens in a new tab)</span></a>.
        </p>
      </div>

      <div>
        <div
          data-visit-map
          class="group relative rounded-sm border border-border bg-card p-2.5 shadow-[0_28px_56px_-36px_rgb(23_25_24/0.6)] focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-brass"
        >
          <span class="absolute -top-px -left-px z-[2] rounded-tl-sm rounded-br-sm bg-chili px-3 py-1.5 text-[0.8125rem] font-bold text-cream">Katy, TX</span>
          <iframe
            :src="SITE.embedUrl"
            :title="`Map showing ${SITE.name}, ${SITE.street}, ${SITE.city}`"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
            class="block aspect-square w-full rounded-sm border-0 bg-cream-2 grayscale transition-[filter] duration-500 ease-brand group-hover:grayscale-0 group-focus-within:grayscale-0 nav:aspect-[4/3]"
          />
        </div>
        <p class="mt-3 text-[0.9375rem] text-[#3a3c3b]">
          Map not loading?
          <a :href="SITE.mapsUrl" target="_blank" rel="noopener noreferrer" class="font-bold text-chili underline underline-offset-[3px]">Open in Google Maps<span class="sr-only"> (opens in a new tab)</span></a>
        </p>
      </div>
    </div>
  </section>
</template>
