<script setup>
import { TabsContent } from 'reka-ui'
</script>

<template>
  <TabsContent v-slot="slotProps" data-slot="tabs-content">
    <slot v-bind="slotProps" />
  </TabsContent>
</template>
