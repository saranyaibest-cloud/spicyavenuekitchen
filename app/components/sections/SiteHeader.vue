<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { SITE } from '~/data/site'
import BrandMark from '~/components/BrandMark.vue'
import { Button } from '~/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '~/components/ui/sheet'
import { gsap, prefersReducedMotion, scrollToTarget } from '~/lib/gsap'
import { cn } from '~/lib/utils'

/* Fixed header: transparent over the hero, solid cream after 40px.
   Desktop: links with a sliding active bar (GSAP). Mobile: a full-screen
   shadcn-vue Sheet and a bottom action bar. Call buttons render only when
   SITE.phone is set in app/data/site.js. */
/* nav: [['about', 'About'], …] links to sections on this page; an entry that starts
   with '/' (e.g. ['/#visit', 'Visit us']) links to another page and is not spied.
   home: true on the one-page site (the logo jumps to #top), false elsewhere (logo → '/'). */
const props = defineProps({
  nav: { type: Array, default: () => [] },
  home: { type: Boolean, default: true },
})
const hrefOf = (id) => (id.startsWith('/') ? id : `#${id}`)

const PHONE = SITE.phone || null
const SOLID_AFTER = 40

const scrolled = ref(false)
const open = ref(false)
const active = ref(null)
// Pages without the dark hero use the solid header from the top.
const solid = computed(() => (scrolled.value || !props.home) && !open.value)
const navList = ref(null)
const bar = ref(null)
let target = null

/* ---- solid after scrolling ---- */
let frame = 0
const onScroll = () => {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    scrolled.value = window.scrollY > SOLID_AFTER
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2 && ids.value.length) {
      active.value = ids.value[ids.value.length - 1]
    }
  })
}

/* ---- scroll-spy: the section crossing a band ~40% down the viewport ---- */
const ids = computed(() => props.nav.map(([id]) => id).filter((id) => !id.startsWith('/')))
let io = null
function spy() {
  if (io) io.disconnect()
  const els = ids.value.map((id) => document.getElementById(id)).filter(Boolean)
  if (!els.length) return
  const inView = new Set()
  io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? inView.add(e.target.id) : inView.delete(e.target.id)))
      const hit = els.find((el) => inView.has(el.id))
      if (hit) active.value = hit.id
      else if (els[0].getBoundingClientRect().top > window.innerHeight * 0.4) active.value = null
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
  )
  els.forEach((el) => io.observe(el))
}

/* ---- the sliding active bar ---- */
function moveBar(instant = false) {
  const list = navList.value
  const el = bar.value
  if (!list || !el) return
  const link = active.value ? list.querySelector(`a[href="#${active.value}"] > span`) : null
  const quick = instant || prefersReducedMotion()
  if (!link) {
    gsap.to(el, { opacity: 0, duration: quick ? 0 : 0.2 })
    return
  }
  const vars = { x: link.offsetLeft + link.parentElement.offsetLeft, width: link.offsetWidth, opacity: 1 }
  if (quick || gsap.getProperty(el, 'opacity') === 0) gsap.set(el, vars)
  else gsap.to(el, { ...vars, duration: 0.45, ease: 'brand', overwrite: true })
}
watch(active, () => moveBar())
watch(ids, () => nextTick(spy))

const onResize = () => moveBar(true)
onMounted(() => {
  onScroll()
  spy()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  if (document.fonts) document.fonts.ready.then(() => moveBar(true))
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
  if (io) io.disconnect()
  if (frame) cancelAnimationFrame(frame)
})

/* ---- drawer link: close first; once Reka restores the page, glide to the section ---- */
function goTo(id) {
  target = id
  open.value = false
}
function onDrawerLink(e, id) {
  if (id.startsWith('/')) {
    open.value = false // another page: let the browser follow the link
    return
  }
  e.preventDefault()
  goTo(id)
}
function onCloseAutoFocus(e) {
  const id = target
  target = null
  if (!id) return // normal close: Reka returns focus to the Menu button
  e.preventDefault()
  if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`)
  scrollToTarget(id)
}

const UNDERLINE =
  'relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current ' +
  'after:transition-transform after:duration-[250ms] after:ease-brand hover:after:scale-x-100 group-focus-visible:after:scale-x-100'
</script>

<template>
  <a
    href="#main"
    class="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded-sm focus:bg-slate focus:px-4 focus:py-3 focus:font-medium focus:text-cream"
  >Skip to content</a>

  <header
    :data-solid="solid"
    :class="cn(
      'fixed inset-x-0 top-0 z-60 h-[var(--nav-h)] text-cream',
      'transition-[background-color,color,box-shadow] duration-[240ms] ease-brand',
      'data-[solid=true]:bg-cream data-[solid=true]:text-ink',
      'data-[solid=true]:shadow-[0_1px_0_rgb(23_25_24/0.08),0_12px_24px_-16px_rgb(23_25_24/0.4)]',
    )"
  >
    <div class="mx-auto flex h-full max-w-[1240px] items-center gap-6 px-4 sm:px-6 lg:px-8">
      <a :href="home ? '#top' : '/'" class="shrink-0 rounded-sm" @click="open = false"><BrandMark /></a>

      <nav aria-label="Primary" class="ml-auto hidden nav:block">
        <ul ref="navList" class="relative flex items-center gap-7">
          <li v-for="[id, label] in nav" :key="id">
            <a
              :href="hrefOf(id)"
              :aria-current="active === id ? 'location' : undefined"
              class="group relative flex h-11 items-center text-[0.9375rem] font-medium"
            >
              <span :class="UNDERLINE">{{ label }}</span>
            </a>
          </li>
          <span ref="bar" aria-hidden="true" class="pointer-events-none absolute bottom-1.5 left-0 h-0.5 w-0 bg-current opacity-0" />
        </ul>
      </nav>

      <div class="ml-auto flex items-center gap-3 nav:ml-0">
        <!-- CALL SLOT (desktop): only when SITE.phone is set -->
        <Button
          v-if="PHONE"
          :href="`tel:${PHONE}`"
          :variant="solid ? 'secondary' : 'secondary-dark'"
          class="hidden nav:inline-flex"
        >Call</Button>
        <Button :href="SITE.directionsUrl" external arrow="external" class="hidden nav:inline-flex">Directions</Button>

        <Sheet v-model:open="open">
          <SheetTrigger
            class="-mr-2 inline-flex h-11 min-w-11 items-center justify-center rounded-sm px-2 text-[0.9375rem] font-medium nav:hidden"
          >Menu</SheetTrigger>
          <SheetContent
            side="right"
            class="max-w-none bg-slate text-cream"
            aria-describedby="undefined"
            @close-auto-focus="onCloseAutoFocus"
          >
            <div class="flex h-[var(--nav-h)] items-center justify-between px-4">
              <BrandMark />
              <SheetClose class="-mr-2 inline-flex h-11 min-w-11 items-center justify-center rounded-sm px-2 text-[0.9375rem] font-medium">
                Close
              </SheetClose>
            </div>
            <SheetTitle class="sr-only">Site navigation</SheetTitle>
            <nav aria-label="Primary" class="flex-1 overflow-y-auto px-6 pt-8">
              <ul class="grid gap-1">
                <li v-for="([id, label], i) in nav" :key="id" class="overflow-hidden">
                  <a
                    :href="hrefOf(id)"
                    :aria-current="active === id ? 'location' : undefined"
                    class="flex min-h-14 items-center font-display text-[2rem] leading-tight motion-safe:animate-sheet-link aria-[current=location]:text-silver"
                    :style="{ animationDelay: `${120 + i * 50}ms` }"
                    @click="onDrawerLink($event, id)"
                  >{{ label }}</a>
                </li>
              </ul>
            </nav>
            <div class="grid gap-3 px-6 pt-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))]">
              <Button :href="SITE.directionsUrl" external arrow="external" class="w-full">Directions</Button>
              <!-- CALL SLOT (drawer) -->
              <Button v-if="PHONE" :href="`tel:${PHONE}`" variant="secondary-dark" class="w-full">Call</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>

  <!-- Mobile action bar -->
  <nav
    aria-label="Quick actions"
    class="fixed inset-x-0 bottom-0 z-50 flex gap-2 border-t border-silver/20 bg-slate px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))] nav:hidden"
  >
    <Button href="#menu" variant="secondary-dark" class="flex-1">Menu</Button>
    <!-- CALL SLOT (action bar) -->
    <Button v-if="PHONE" :href="`tel:${PHONE}`" variant="secondary-dark" class="flex-1">Call</Button>
    <Button :href="SITE.directionsUrl" external arrow="external" class="flex-[1.4]">Directions</Button>
  </nav>
</template>
