<script setup>
import { TabsList } from 'reka-ui'
</script>

<template>
  <TabsList v-slot="slotProps" data-slot="tabs-list">
    <slot v-bind="slotProps" />
  </TabsList>
</template>
