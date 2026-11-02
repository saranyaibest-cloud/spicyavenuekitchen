<script setup>
import { computed } from 'vue'
import { cleanPrice } from '~/lib/featuredData'
import { money } from '~/lib/format'
import { cn } from '~/lib/utils'

/* Single-line price for cards: $12.99 · from $9.50 · dash (read "Price not listed"). Never $0. */
const props = defineProps({
  item: { type: Object, required: true },
  class: { type: [String, Array, Object], default: null },
})
const text = computed(() => {
  const { price, variants } = cleanPrice(props.item)
  if (price !== null) return money(price)
  if (variants.length) return `from ${money(Math.min(...variants.map((v) => v.price)))}`
  return null
})
</script>

<template>
  <span :class="cn('font-medium tabular-nums', props.class)">
    <template v-if="text">{{ text }}</template>
    <template v-else><span aria-hidden="true">–</span><span class="sr-only">Price not listed</span></template>
  </span>
</template>
