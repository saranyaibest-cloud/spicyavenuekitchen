<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { FOOD } from '~/lib/images'
import { Sheet, SheetContent, SheetTitle } from '~/components/ui/sheet'
import { useGsap } from '~/composables/useGsap'
import { gsap, prefersReducedMotion } from '~/lib/gsap'
import { cn } from '~/lib/utils'

/* "From the kitchen": renders only when app/assets/food/gallery/ has photos.
   - Desktop with motion and 4+ photos: the section pins and the photo row
     slides sideways as you scroll (GSAP ScrollTrigger, scrubbed), after the
     Aceternity / Magic UI horizontal-scroll sections.
   - Phones, reduced motion or fewer photos: a two/three-column masonry grid.
   - Any photo opens a full-screen viewer (shadcn-vue Sheet on Reka UI Dialog):
     arrows, swipe, Escape, focus trap; focus returns to the photo. */
const SWIPE_PX = 50
const photos = FOOD.gallery.filter((p) => p && typeof p.src === 'string' && p.src)
const total = photos.length
const rowMode = total >= 4

const root = ref(null)
const track = ref(null)
const open = ref(false)
const index = ref(0)
const failed = ref(new Set())
const loaded = ref(new Set())
const stageImg = ref(null)
let swipe = null

const photo = computed(() => photos[index.value] || null)
const wrap = (i) => ((i % total) + total) % total

function openAt(i) {
  index.value = i
  open.value = true
}
function move(dir) {
  if (total > 1) index.value = wrap(index.value + dir)
}
function onKey(e) {
  if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1) }
  else if (e.key === 'ArrowRight') { e.preventDefault(); move(1) }
}
function onDown(e) {
  swipe = { x: e.clientX, y: e.clientY, id: e.pointerId }
}
function onUp(e) {
  const s = swipe
  swipe = null
  if (!s || s.id !== e.pointerId || total < 2) return
  const dx = e.clientX - s.x
  const dy = e.clientY - s.y
  if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.2) move(dx < 0 ? 1 : -1)
}
function add(set, i) {
  if (set.value.has(i)) return
  const next = new Set(set.value)
  next.add(i)
  set.value = next
}
const markLoaded = (i) => add(loaded, i)
const markFailed = (i) => add(failed, i)
// With server rendering an image can finish loading before Vue hydrates and
// attaches @load, so check what is already complete once mounted.
onMounted(() => {
  if (!track.value) return
  track.value.querySelectorAll('img[data-i]').forEach((img) => {
    if (!img.complete) return
    if (img.naturalWidth) markLoaded(Number(img.dataset.i))
    else markFailed(Number(img.dataset.i))
  })
})

/* Crossfade the viewer image and preload its neighbours. */
watch(index, async () => {
  await nextTick()
  if (stageImg.value && !prefersReducedMotion()) gsap.fromTo(stageImg.value, { opacity: 0, scale: 0.985 }, { opacity: 1, scale: 1, duration: 0.35 })
  if (total < 2) return
  ;[wrap(index.value - 1), wrap(index.value + 1)].forEach((i) => {
    const img = new Image()
    img.decoding = 'async'
    img.src = photos[i].src
  })
})

useGsap(
  root,
  ({ desktop, reduce }, el) => {
    if (!el || reduce || !desktop || !rowMode || !track.value) return
    const row = track.value
    const distance = () => Math.max(0, row.scrollWidth - row.parentElement.clientWidth)
    gsap.to(row, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    })
    gsap.from(row.children, { opacity: 0, x: 80, stagger: 0.06, duration: 0.8, scrollTrigger: { trigger: el, start: 'top 75%', once: true } })
  },
  { desktop: '(min-width: 900px)' },
)
</script>

<template>
  <section v-if="total" id="gallery" ref="root" aria-labelledby="gal-title" class="overflow-hidden bg-cream py-16 text-ink nav:py-24">
    <div class="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
      <header class="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="gal-title" class="text-section">From the kitchen</h2>
        <p class="text-sm font-medium text-muted tabular-nums">{{ total }} {{ total === 1 ? 'photo' : 'photos' }}</p>
      </header>

      <div :class="rowMode ? 'nav:motion-safe:overflow-visible' : ''">
        <ul
          ref="track"
          :class="cn(
            'columns-2 gap-2.5 nav:columns-3 nav:gap-3',
            rowMode && 'nav:motion-safe:flex nav:motion-safe:w-max nav:motion-safe:gap-4 nav:motion-safe:[columns:auto]',
          )"
        >
          <li
            v-for="(p, i) in photos"
            v-show="!failed.has(i)"
            :key="`${p.src}-${i}`"
            :class="cn('mb-2.5 break-inside-avoid nav:mb-3', rowMode && 'nav:motion-safe:mb-0 nav:motion-safe:w-[min(30vw,420px)] nav:motion-safe:shrink-0')"
          >
            <button
              type="button"
              :data-gal="i"
              :aria-label="`View photo: ${p.alt || 'untitled'}`"
              class="group relative block w-full cursor-zoom-in overflow-hidden rounded-sm text-left"
              @click="openAt(i)"
            >
              <span :class="cn('relative block overflow-hidden bg-cream-2', rowMode && 'nav:motion-safe:aspect-[4/5]')">
                <img
                  :src="p.src"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  :class="cn(
                    'block size-full object-cover transition-[opacity,filter,scale] duration-700 ease-brand group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100',
                    loaded.has(i) ? 'opacity-100 blur-none' : 'opacity-0 blur-md',
                  )"
                  :data-i="i"
                  @load="markLoaded(i)"
                  @error="markFailed(i)"
                >
              </span>
              <span
                aria-hidden="true"
                class="absolute inset-x-0 bottom-0 translate-y-full bg-ink px-3.5 py-2.5 text-[0.8125rem] font-medium leading-snug text-cream transition-transform duration-300 ease-brand first-letter:uppercase group-hover:translate-y-0 group-focus-visible:translate-y-0 nav:text-[0.9375rem] [@media(hover:none)]:translate-y-0"
              >{{ p.alt }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <Sheet v-model:open="open">
      <SheetContent
        side="full"
        aria-describedby="undefined"
        class="z-[80] grid grid-rows-[auto_minmax(0,1fr)_auto] bg-[rgb(13_15_18/0.96)] text-cream pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
        overlay-class="z-[79] bg-transparent"
        @keydown="onKey"
      >
        <SheetTitle class="sr-only">Photo viewer</SheetTitle>
        <div class="flex items-center justify-between gap-3 px-4 py-3">
          <p class="font-bold tabular-nums" aria-live="polite" aria-atomic="true">{{ index + 1 }} / {{ total }}</p>
          <button
            type="button"
            aria-label="Close photo viewer"
            class="inline-flex size-[52px] items-center justify-center rounded-sm border border-cream/45 transition-colors hover:border-cream hover:bg-cream/10 max-nav:size-14"
            @click="open = false"
          >
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
              <path d="M4.5 4.5l11 11M15.5 4.5l-11 11" stroke="currentColor" stroke-width="1.9" stroke-linecap="square" />
            </svg>
          </button>
        </div>
        <div
          class="relative flex min-h-0 touch-pan-y items-center justify-center overflow-hidden px-2 select-none nav:px-4"
          @pointerdown="onDown"
          @pointerup="onUp"
          @pointercancel="swipe = null"
          @click.self="open = false"
        >
          <img v-if="photo" ref="stageImg" :key="photo.src" :src="photo.src" :alt="photo.alt || ''" draggable="false" class="block h-auto max-h-full w-auto max-w-full rounded-sm object-contain">
        </div>
        <div class="flex items-center justify-center gap-3 px-4 py-3">
          <button
            v-if="total > 1"
            type="button"
            aria-label="Previous photo"
            class="inline-flex size-[52px] items-center justify-center rounded-sm border border-cream/45 transition-colors hover:border-cream hover:bg-cream/10 max-nav:size-14"
            @click="move(-1)"
          >
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square" /></svg>
          </button>
          <p class="max-w-[48ch] flex-1 text-center leading-snug first-letter:uppercase">{{ photo && photo.alt }}</p>
          <button
            v-if="total > 1"
            type="button"
            aria-label="Next photo"
            class="inline-flex size-[52px] items-center justify-center rounded-sm border border-cream/45 transition-colors hover:border-cream hover:bg-cream/10 max-nav:size-14"
            @click="move(1)"
          >
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><path d="M7.5 4l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square" /></svg>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  </section>
</template>
