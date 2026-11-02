<script setup>
import { PopoverRoot } from 'reka-ui'
</script>

<template>
  <PopoverRoot v-slot="slotProps">
    <slot v-bind="slotProps" />
  </PopoverRoot>
</template>
