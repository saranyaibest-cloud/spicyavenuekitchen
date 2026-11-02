<script setup>
import { ref } from 'vue'
import { useGsap } from '~/composables/useGsap'
import { gsap, SplitText } from '~/lib/gsap'

/* Words fade in from a soft blur, one after another.
   After Magic UI "Blur Fade" / Aceternity "Text Generate Effect", rebuilt on
   GSAP SplitText. The element keeps its full text for screen readers
   (SplitText aria: 'auto'). Reduced motion: plain text, no split.
   trigger: 'load' (starts on mount) or 'scroll' (starts at 85% of the viewport).
   hold: pre-hidden by CSS until GSAP runs (above-the-fold text only). */
const props = defineProps({
  as: { type: String, default: 'p' },
  text: { type: String, required: true },
  trigger: { type: String, default: 'scroll' },
  delay: { type: Number, default: 0 },
  stagger: { type: Number, default: 0.06 },
  hold: { type: Boolean, default: false },
})
const root = ref(null)

useGsap(root, ({ reduce }, el) => {
  if (!el) return undefined
  if (reduce) {
    el.removeAttribute('data-hero-reveal')
    return undefined
  }
  const split = SplitText.create(el, { type: 'words', aria: 'auto' })
  const tween = gsap.from(split.words, {
    opacity: 0,
    filter: 'blur(10px)',
    yPercent: 35,
    duration: 0.7,
    stagger: props.stagger,
    delay: props.delay,
    clearProps: 'filter',
    scrollTrigger: props.trigger === 'scroll' ? { trigger: el, start: 'top 85%', once: true } : undefined,
  })
  // The words now hold the hidden state, so the element itself can show.
  el.removeAttribute('data-hero-reveal')
  return () => {
    tween.kill()
    split.revert()
  }
})
</script>

<template>
  <component :is="as" ref="root" :data-hero-reveal="hold ? '' : undefined">{{ text }}</component>
</template>
