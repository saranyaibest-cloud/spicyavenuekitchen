<script setup>
import { ref } from 'vue'
import { useGsap } from '~/composables/useGsap'
import { gsap, SplitText } from '~/lib/gsap'

/* Words light up as the text scrolls through the viewport.
   After Magic UI "Text Reveal", rebuilt on GSAP SplitText + ScrollTrigger (scrub).
   Dim words stay at 22% opacity, so the sentence is always readable.
   Reduced motion: plain, fully visible text. */
const props = defineProps({
  as: { type: String, default: 'h2' },
  text: { type: String, required: true },
})
const root = ref(null)

useGsap(root, ({ reduce }, el) => {
  if (!el || reduce) return undefined
  const split = SplitText.create(el, { type: 'words', aria: 'auto' })
  const tween = gsap.fromTo(
    split.words,
    { opacity: 0.22 },
    {
      opacity: 1,
      ease: 'none',
      stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
    },
  )
  return () => {
    tween.kill()
    split.revert()
  }
})
</script>

<template>
  <component :is="as" ref="root">{{ text }}</component>
</template>
