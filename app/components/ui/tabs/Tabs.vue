<script setup>
import { TabsRoot } from 'reka-ui'
</script>

<template>
  <TabsRoot v-slot="slotProps" data-slot="tabs">
    <slot v-bind="slotProps" />
  </TabsRoot>
</template>
