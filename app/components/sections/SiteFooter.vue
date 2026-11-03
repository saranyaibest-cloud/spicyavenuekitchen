<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { SITE } from '~/data/site'
import { useGsap } from '~/composables/useGsap'
import { gsap, prefersReducedMotion, scrollToTarget } from '~/lib/gsap'

/* Footer: logo (used as-is), page links, address, and the restaurant name set
   large in the display face, rising into place as the page ends (after the
   oversized footer words in Aceternity / Magic UI templates; text, not the logo).
   Back-to-top: a ring that fills with page progress. */
const props = defineProps({
  nav: { type: Array, default: () => [] },
  home: { type: Boolean, default: true },
})
const hrefOf = (id) => (id.startsWith('/') ? id : `#${id}`)
const year = new Date().getFullYear()
const social = computed(() => (Array.isArray(SITE.social) ? SITE.social.filter((s) => s && s.label && s.url) : []))

const root = ref(null)
const ring = ref(null)
const showTop = ref(false)
const C = 2 * Math.PI * 19

useGsap(root, ({ reduce }, el) => {
  if (!reduce && el) {
    gsap.from(el.querySelector('[data-footer-word]'), {
      yPercent: 60,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
    })
  }
})

// Progress is read from the page itself on every scroll, so it stays right when
// the page height changes (another menu category, the live menu arriving).
let frame = 0
const onScroll = () => {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    showTop.value = window.scrollY > 600
    const max = document.documentElement.scrollHeight - window.innerHeight
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    if (ring.value) ring.value.style.strokeDashoffset = String(C * (1 - p))
  })
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (frame) cancelAnimationFrame(frame)
})

function toTop() {
  if (prefersReducedMotion()) window.scrollTo(0, 0)
  else scrollToTarget(0, { focus: false })
  const main = document.getElementById('main')
  if (main) main.focus({ preventScroll: true })
}

const LINK =
  'relative inline-flex min-h-10 items-center font-semibold text-cream after:absolute after:inset-x-0 after:bottom-2 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-[250ms] after:ease-brand hover:after:scale-x-100 focus-visible:after:scale-x-100 motion-reduce:after:transition-none'
</script>

<template>
  <footer ref="root" class="relative isolate overflow-hidden bg-slate pt-12 text-cream nav:pt-20">
    <div class="mx-auto grid max-w-[1240px] grid-cols-1 items-start gap-7 px-4 sm:px-6 lg:px-8 nav:grid-cols-[minmax(220px,1.2fr)_repeat(auto-fit,minmax(160px,1fr))] nav:gap-x-10 nav:gap-y-8">
      <div>
        <a :href="home ? '#top' : '/'" class="inline-block rounded-sm border border-silver/20 p-2">
          <img src="/brand/logo.jpg" :alt="SITE.name" width="1600" height="882" loading="lazy" decoding="async" class="block h-auto w-[220px] max-w-full">
        </a>
      </div>

      <nav aria-label="Footer">
        <h2 class="mb-3 font-sans text-[0.8125rem] font-bold text-silver">On this page</h2>
        <ul class="grid gap-0.5">
          <li v-for="[id, label] in nav" :key="id"><a :href="hrefOf(id)" :class="LINK">{{ label }}</a></li>
        </ul>
      </nav>

      <div>
        <h2 class="mb-3 font-sans text-[0.8125rem] font-bold text-silver">Find us</h2>
        <address class="mb-2.5 leading-normal not-italic">{{ SITE.street }}<br>{{ SITE.city }}</address>
        <ul class="grid gap-0.5">
          <li><a :href="SITE.directionsUrl" target="_blank" rel="noopener noreferrer" :class="LINK">Get directions<span class="sr-only"> (opens in a new tab)</span></a></li>
          <li><a :href="SITE.mapsUrl" target="_blank" rel="noopener noreferrer" :class="LINK">Google Maps listing<span class="sr-only"> (opens in a new tab)</span></a></li>
          <!-- PHONE SLOT: only when SITE.phone is set. -->
          <li v-if="SITE.phone"><a :href="`tel:${SITE.phone}`" :class="LINK">{{ SITE.phone }}</a></li>
        </ul>
      </div>

      <!-- SOCIAL SLOT: this column renders only when SITE.social has entries. -->
      <div v-if="social.length">
        <h2 class="mb-3 font-sans text-[0.8125rem] font-bold text-silver">Follow</h2>
        <ul class="grid gap-0.5">
          <li v-for="s in social" :key="s.url">
            <a :href="s.url" target="_blank" rel="noopener noreferrer" :class="LINK">{{ s.label }}<span class="sr-only"> (opens in a new tab)</span></a>
          </li>
        </ul>
      </div>
    </div>

    <p
      data-footer-word
      aria-hidden="true"
      class="pointer-events-none mx-auto mt-14 max-w-[1240px] px-4 font-display text-[1.75rem] leading-[0.9] whitespace-nowrap text-cream/10 select-none sm:px-6 sm:text-[4rem] lg:px-8 nav:text-[7rem]"
    >{{ SITE.name }}</p>

    <div class="mx-auto mt-6 max-w-[1240px] border-t border-silver/20 px-4 pt-4.5 pb-[calc(18px+env(safe-area-inset-bottom,0px))] sm:px-6 lg:px-8 max-nav:pr-[calc(1rem+56px)]">
      <p class="text-sm text-silver">© {{ year }} {{ SITE.name }}</p>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-brand"
      leave-active-class="transition duration-200 ease-brand"
      enter-from-class="translate-y-2 opacity-0"
      leave-to-class="translate-y-2 opacity-0"
    >
      <button
        v-show="showTop"
        type="button"
        aria-label="Back to top"
        class="fixed right-[max(16px,env(safe-area-inset-right,0px))] bottom-[calc(var(--bottom-offset)+var(--fab-h)+12px)] z-[55] inline-flex size-11 items-center justify-center rounded-full bg-slate text-cream shadow-[0_8px_20px_-8px_rgb(19_23_28/0.6)]"
        @click="toTop"
      >
        <svg viewBox="0 0 44 44" class="absolute inset-0 size-11 -rotate-90" aria-hidden="true" focusable="false">
          <circle cx="22" cy="22" r="19" fill="none" stroke-width="2.5" class="stroke-silver/25" />
          <circle ref="ring" cx="22" cy="22" r="19" fill="none" stroke-width="2.5" stroke-linecap="round" class="stroke-chili" :stroke-dasharray="C" :stroke-dashoffset="C" />
        </svg>
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false" class="relative">
          <path d="M8 13V3M4 7l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" />
        </svg>
      </button>
    </Transition>
  </footer>
</template>
