<script setup>
import { ref } from 'vue'
import { useGsap } from '~/composables/useGsap'
import { gsap, ScrollTrigger } from '~/lib/gsap'

/* An endless, slow row of words.
   After Magic UI "Marquee", rebuilt on GSAP: one linear tween on a doubled
   track, paused off-screen and on hover. Decorative (aria-hidden): the same
   names are in the cards below it. Reduced motion: a still, wrapped row. */
const props = defineProps({
  items: { type: Array, default: () => [] },
  speed: { type: Number, default: 40 }, // px per second
})
const root = ref(null)
const track = ref(null)

useGsap(root, ({ reduce }, el) => {
  if (!el || reduce || !track.value) return undefined
  const width = track.value.scrollWidth / 2
  const tween = gsap.to(track.value, { x: -width, duration: width / props.speed, ease: 'none', repeat: -1 })
  const st = ScrollTrigger.create({
    trigger: el,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (self.isActive ? tween.play() : tween.pause()),
  })
  const slow = () => gsap.to(tween, { timeScale: 0.15, duration: 0.6 })
  const resume = () => gsap.to(tween, { timeScale: 1, duration: 0.6 })
  el.addEventListener('pointerenter', slow)
  el.addEventListener('pointerleave', resume)
  return () => {
    el.removeEventListener('pointerenter', slow)
    el.removeEventListener('pointerleave', resume)
    st.kill()
    tween.kill()
  }
})
</script>

<template>
  <div ref="root" aria-hidden="true" class="overflow-hidden motion-reduce:overflow-visible">
    <div ref="track" class="flex w-max motion-reduce:w-auto motion-reduce:flex-wrap">
      <span v-for="copy in 2" :key="copy" :class="['flex shrink-0 items-center', copy === 2 && 'motion-reduce:hidden']">
        <template v-for="(item, i) in items" :key="`${copy}-${i}`">
          <span class="whitespace-nowrap px-5"><slot :item="item">{{ item }}</slot></span>
          <span class="size-1.5 shrink-0 rounded-full bg-current opacity-50" />
        </template>
      </span>
    </div>
  </div>
</template>
