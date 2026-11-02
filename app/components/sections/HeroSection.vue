<script setup>
import { computed, ref } from 'vue'
import { SITE } from '~/data/site'
import { Button } from '~/components/ui/button'
import HeatField from '~/components/fx/HeatField.vue'
import BlurText from '~/components/fx/BlurText.vue'
import { useGsap } from '~/composables/useGsap'
import { gsap } from '~/lib/gsap'

/* One short line. Facts only. */
const HEADLINE = 'Andhra heat, dum biryani and a tandoor on the Katy Freeway.'

/* OPEN-TODAY SLOT: set to a verified line (e.g. from real hours) or leave null. */
const OPEN_LINE = null

const props = defineProps({ photo: { type: Object, default: null } })
const hasPhoto = computed(() => Boolean(props.photo && props.photo.src))
const root = ref(null)

/* Entrance: headline words blur in (BlurText), then the buttons rise and the
   image unmasks from the bottom edge. Scroll: the image drifts 60px and the
   heat haze fades as the hero leaves. Reduced motion: everything static. */
useGsap(root, ({ reduce }, el) => {
  const held = el.querySelectorAll('[data-hero-reveal]:not(h1)')
  if (reduce) {
    held.forEach((n) => n.removeAttribute('data-hero-reveal'))
    return
  }
  const actions = el.querySelector('[data-hero-actions]')
  const figure = el.querySelector('[data-hero-figure]')
  gsap.set(held, { opacity: 1 })
  held.forEach((n) => n.removeAttribute('data-hero-reveal'))
  gsap
    .timeline({ delay: 0.15 })
    .from(actions.children, { opacity: 0, y: 14, duration: 0.6, stagger: 0.08 }, 0.55)
    .fromTo(figure, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power3.out' }, 0.2)

  gsap.to('[data-hero-drift]', {
    y: 60,
    ease: 'none',
    scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
  })
  gsap.to('[data-hero-heat]', {
    opacity: 0.35,
    ease: 'none',
    scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
  })
})
</script>

<template>
  <section
    id="top"
    ref="root"
    aria-labelledby="hero-title"
    class="relative isolate flex min-h-[min(100svh,880px)] overflow-hidden bg-slate text-cream"
  >
    <!-- The hero's single ambient effect -->
    <div data-hero-heat class="pointer-events-none absolute inset-0 -z-10">
      <HeatField class="size-full" />
    </div>
    <!-- Hairline grid, fading out to the right (after Aceternity "Grid Background"), decorative -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(244_239_229/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(244_239_229/0.05)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_20%_80%,#000_10%,transparent_70%)]"
    />

    <div
      class="mx-auto grid w-full max-w-[1240px] content-center items-center gap-14 px-4 pt-[calc(var(--nav-h)+48px)] pb-16 sm:px-6 lg:px-8 max-nav:pb-[calc(var(--quickbar-h)+40px)] nav:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] nav:gap-20"
    >
      <div class="max-w-[34rem]">
        <BlurText id="hero-title" as="h1" :text="HEADLINE" trigger="load" :delay="0.15" hold class="text-hero text-cream" />
        <p v-if="OPEN_LINE" data-hero-reveal class="mt-6 text-silver">{{ OPEN_LINE }}</p>
        <div data-hero-actions data-hero-reveal class="mt-10 flex flex-wrap gap-3 max-nav:grid max-nav:grid-cols-2">
          <Button href="#menu" arrow="right">Explore menu</Button>
          <Button :href="SITE.directionsUrl" external arrow="external" variant="secondary-dark">Get directions</Button>
        </div>
      </div>

      <div data-hero-drift class="justify-self-center nav:justify-self-end">
        <figure
          v-if="hasPhoto"
          data-hero-figure
          data-hero-reveal
          class="relative aspect-[4/5] max-h-[min(68svh,600px)] w-[min(100%,460px)] overflow-hidden rounded-sm bg-ink max-nav:aspect-[4/3] max-nav:max-h-[42svh]"
        >
          <img :src="photo.src" :alt="photo.alt || ''" decoding="async" class="size-full object-cover">
        </figure>
        <figure v-else data-hero-figure data-hero-reveal class="w-[min(100%,520px)] rounded-sm border border-silver/20 bg-slate p-3 sm:p-4">
          <img src="/brand/logo.jpg" alt="Spicy Avenue Kitchen" width="1600" height="882" decoding="async" class="h-auto w-full rounded-sm">
        </figure>
      </div>
    </div>
  </section>
</template>
