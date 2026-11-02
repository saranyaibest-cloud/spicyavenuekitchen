<script setup>
import { DialogRoot } from 'reka-ui'
/* v-model:open, default-open, modal pass through as attributes. */
</script>

<template>
  <DialogRoot v-slot="slotProps">
    <slot v-bind="slotProps" />
  </DialogRoot>
</template>
