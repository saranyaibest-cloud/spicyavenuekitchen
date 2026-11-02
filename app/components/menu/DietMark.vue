<script setup>
import { computed } from 'vue'
import { dietLabel } from '~/lib/featuredData'
import { cn } from '~/lib/utils'

/* Square veg / non-veg mark, only when the menu data says so. */
const props = defineProps({
  diet: { type: String, default: null },
  class: { type: [String, Array, Object], default: null },
})
const label = computed(() => dietLabel(props.diet))
</script>

<template>
  <span
    v-if="label"
    :class="cn(
      'inline-flex size-3.5 items-center justify-center rounded-[2px] border-[1.5px] bg-white',
      diet === 'veg' ? 'text-veg' : 'text-nonveg',
      props.class,
    )"
  >
    <span aria-hidden="true" class="size-1.5 rounded-full bg-current" />
    <span class="sr-only">{{ label }}</span>
  </span>
</template>
