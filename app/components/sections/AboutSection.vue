<script setup>
import { computed, ref } from 'vue'
import CategoryCard from '~/components/menu/CategoryCard.vue'
import ScrollRevealText from '~/components/fx/ScrollRevealText.vue'
import { useGsap } from '~/composables/useGsap'
import { gsap, ScrollTrigger } from '~/lib/gsap'
import { count } from '~/lib/format'

/* One sentence (words light up as it scrolls in) and three category cards. */
const FEATURE_IDS = ['just-south', 'biryani-rice-and-noodles', 'tandoor']

const props = defineProps({ menu: { type: Object, default: null } })
const emit = defineEmits(['go'])

const picks = computed(() => {
  const categories = props.menu && Array.isArray(props.menu.categories) ? props.menu.categories : []
  const byId = Object.fromEntries(categories.filter(Boolean).map((c) => [c.id, c]))
  return FEATURE_IDS.map((id) => byId[id]).filter(Boolean)
})

const root = ref(null)
useGsap(root, ({ reduce }) => {
  if (reduce) return
  ScrollTrigger.batch('[data-about-card]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.fromTo(
      els,
      { opacity: 0, y: 28, rotateX: 5, transformPerspective: 900 },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.72, stagger: 0.12, clearProps: 'transform,opacity' },
    ),
  })
})
</script>

<template>
  <section id="about" ref="root" aria-labelledby="about-title" class="relative isolate overflow-hidden bg-cream py-20 text-ink nav:py-28">
    <div class="mx-auto grid max-w-[1240px] items-start gap-8 px-4 sm:px-6 lg:px-8 nav:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] nav:gap-16">
      <div>
        <p class="mb-4 flex items-center gap-3 text-[0.75rem] font-semibold uppercase text-chili"><span class="font-mono tabular-nums">01</span><span class="h-px w-8 bg-chili/45" />The kitchen</p>
        <ScrollRevealText id="about-title" as="h2" text="One menu, from Andhra to Punjab." class="max-w-[16ch] text-section" />
      </div>
      <ul v-if="picks.length" class="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-3">
        <li v-for="(c, index) in picks" :key="c.id" data-about-card class="min-w-0">
          <CategoryCard :category="c" :count="count(c)" :index="index" @open="emit('go', $event)" />
        </li>
      </ul>
    </div>
  </section>
</template>
