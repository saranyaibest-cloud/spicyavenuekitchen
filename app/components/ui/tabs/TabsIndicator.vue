<script setup>
import { TabsIndicator } from 'reka-ui'
</script>

<template>
  <TabsIndicator v-slot="slotProps" data-slot="tabs-indicator">
    <slot v-bind="slotProps" />
  </TabsIndicator>
</template>
