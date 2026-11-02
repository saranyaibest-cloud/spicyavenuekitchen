<script setup>
import { computed } from 'vue'
import { CATEGORY_ICONS, GENERIC_ICON } from '~/lib/categoryIcons'

const props = defineProps({
  id: { type: String, default: '' },
  size: { type: Number, default: 40 },
})
const markup = computed(() => CATEGORY_ICONS[props.id] || GENERIC_ICON)
</script>

<template>
  <svg viewBox="0 0 64 64" :width="size" :height="size" aria-hidden="true" focusable="false" v-html="markup" />
</template>
