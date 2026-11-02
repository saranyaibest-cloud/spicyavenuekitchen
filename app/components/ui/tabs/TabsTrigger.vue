<script setup>
import { TabsTrigger } from 'reka-ui'
</script>

<template>
  <TabsTrigger v-slot="slotProps" data-slot="tabs-trigger">
    <slot v-bind="slotProps" />
  </TabsTrigger>
</template>
