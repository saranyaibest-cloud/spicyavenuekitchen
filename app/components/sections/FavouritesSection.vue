<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { FEATURED } from '~/data/site'
import { resolveFeatured } from '~/lib/featuredData'
import DishCard from '~/components/menu/DishCard.vue'
import Marquee from '~/components/fx/Marquee.vue'
import { useGsap } from '~/composables/useGsap'
import { useCart } from '~/composables/useCart'
import { gsap, ScrollTrigger, prefersReducedMotion } from '~/lib/gsap'

/* Favourites: a slow marquee of the five names (decorative), then the
   site-wide cards in a native scroll-snap row: swipe, Previous/Next, arrow
   keys, a progress bar and "1 of 5" for screen readers. Cards slide in once. */
const props = defineProps({ menu: { type: Object, default: null } })
const emit = defineEmits(['open'])

const entries = computed(() => resolveFeatured(props.menu, FEATURED))
const total = computed(() => entries.value.length)
const heading = computed(() => (total.value === 5 ? 'Five to start with' : 'Where to begin'))
const names = computed(() => entries.value.map((e) => e.item.name))
const cart = useCart()
const quantity = (id) => cart.items.value.find((line) => line.id === id)?.quantity || 0

const root = ref(null)
const track = ref(null)
const progress = ref(0)
const current = ref(1)
const overflow = ref(true)

function step() {
  const t = track.value
  const first = t && t.firstElementChild
  if (!first) return 1
  return first.getBoundingClientRect().width + (parseFloat(getComputedStyle(t).columnGap) || 0)
}
function measure() {
  const t = track.value
  if (!t) return
  const max = t.scrollWidth - t.clientWidth
  overflow.value = max > 2
  const p = max > 2 ? Math.min(1, Math.max(0, t.scrollLeft / max)) : 1
  progress.value = p
  current.value = Math.max(1, p >= 0.995 ? total.value : Math.min(total.value, Math.round(t.scrollLeft / step()) + 1))
}

let frame = 0
let ro = null
const onScroll = () => {
  if (!frame) frame = requestAnimationFrame(() => { frame = 0; measure() })
}
// The row can appear after mount (live menu), so attach whenever the element changes.
function detach(t) {
  if (t) t.removeEventListener('scroll', onScroll)
  if (ro) ro.disconnect()
  ro = null
}
watch(
  track,
  (t, old) => {
    detach(old)
    if (!t) return
    t.addEventListener('scroll', onScroll, { passive: true })
    ro = new ResizeObserver(measure)
    ro.observe(t)
    measure()
  },
  { flush: 'post' },
)
onBeforeUnmount(() => {
  detach(track.value)
  if (frame) cancelAnimationFrame(frame)
})

const behavior = () => (prefersReducedMotion() ? 'auto' : 'smooth')
const page = (dir) => track.value && track.value.scrollBy({ left: dir * step(), behavior: behavior() })

function onKeydown(e) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const cards = Array.from(track.value.querySelectorAll('.card-main'))
  const at = cards.indexOf(document.activeElement)
  if (at === -1) return
  const next = e.key === 'ArrowRight' ? Math.min(cards.length - 1, at + 1) : Math.max(0, at - 1)
  if (next === at) return
  e.preventDefault()
  cards[next].focus({ preventScroll: true })
  cards[next].closest('li').scrollIntoView({ behavior: behavior(), block: 'nearest', inline: 'start' })
}
function open(id) {
  const hit = entries.value.find((e) => e.item.id === id)
  if (hit) emit('open', hit.category.id, id)
}

useGsap(root, ({ reduce }, el) => {
  if (reduce || !el) return
  const cards = el.querySelectorAll('#favs-track > li')
  gsap.set(cards, { opacity: 0, x: 48 })
  ScrollTrigger.create({
    trigger: el.querySelector('#favs-track'),
    start: 'top 85%',
    once: true,
    onEnter: () => gsap.to(cards, { opacity: 1, x: 0, duration: 0.7, stagger: 0.07, clearProps: 'transform' }),
  })
})
</script>

<template>
  <section v-if="total" id="start" ref="root" aria-labelledby="favs-title" class="surface-dark relative isolate overflow-hidden bg-slate py-20 text-cream nav:py-28">
    <Marquee :items="names" class="mb-12 border-y border-cream/20 py-3 font-display text-[1.375rem] text-cream/75 nav:mb-16 nav:text-[1.625rem]" />

    <div class="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="mb-2 flex items-center gap-3 text-[0.75rem] font-semibold uppercase text-highlight"><span class="h-px w-8 bg-highlight/60" />From our table</p>
          <h2 id="favs-title" class="text-section">{{ heading }}</h2>
        </div>
        <div v-if="overflow" class="flex items-center gap-2">
          <p class="mr-2 text-sm tabular-nums" aria-live="polite" aria-atomic="true">{{ current }} of {{ total }}</p>
          <button
            v-for="dir in ['prev', 'next']"
            :key="dir"
            type="button"
            :aria-label="dir === 'prev' ? 'Previous dishes' : 'Next dishes'"
            aria-controls="favs-track"
            :disabled="dir === 'prev' ? progress <= 0.005 : progress >= 0.995"
            class="inline-flex size-11 items-center justify-center rounded-sm border border-cream/55 text-cream transition-colors duration-200 hover:border-cream hover:bg-cream/10 disabled:opacity-40"
            @click="page(dir === 'prev' ? -1 : 1)"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
              <path :d="dir === 'prev' ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" />
            </svg>
          </button>
        </div>
      </div>

      <div role="region" aria-roledescription="carousel" :aria-label="heading">
        <ul
          id="favs-track"
          ref="track"
          class="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pt-1 pb-3 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
          @keydown="onKeydown"
        >
          <li v-for="{ item } in entries" :key="item.id" class="w-[min(82vw,340px)] shrink-0 snap-start nav:w-80">
            <DishCard :item="item" layout="featured" :quantity="quantity(item.id)" @open="open" @add="cart.add" @quantity="cart.setQuantity" />
          </li>
        </ul>
        <div v-if="overflow" class="relative mt-4 h-0.5 overflow-hidden rounded-full bg-cream/30" aria-hidden="true">
          <span
            class="absolute inset-0 origin-left bg-cream transition-transform duration-150 ease-linear motion-reduce:transition-none"
            :style="{ transform: `scaleX(${Math.max(progress, 1 / total)})` }"
          />
        </div>
      </div>
    </div>
  </section>
</template>
