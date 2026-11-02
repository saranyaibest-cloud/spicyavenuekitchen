<script setup>
import { computed } from 'vue'
import SpecCard from './SpecCard.vue'
import CategoryIcon from './CategoryIcon.vue'

const props = defineProps({
  category: { type: Object, required: true },
  count: { type: Number, default: 0 },
})
const emit = defineEmits(['open'])
const tag = computed(() => `${props.count} ${props.count === 1 ? 'dish' : 'dishes'}`)
</script>

<template>
  <SpecCard :title="category.title" :tag="tag" href="#menu" @open="emit('open', category.id)">
    <template #mark><CategoryIcon :id="category.id" :size="32" /></template>
    <template #info><span class="size-8" aria-hidden="true" /></template>
    <template #corner>
      <svg
        viewBox="0 0 16 16"
        width="16"
        height="16"
        aria-hidden="true"
        focusable="false"
        class="text-ink transition-transform duration-300 ease-brand group-hover/card:translate-x-1 motion-reduce:transform-none"
      >
        <path d="M2.5 8h10M9 4.5L12.5 8 9 11.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" />
      </svg>
    </template>
  </SpecCard>
</template>
