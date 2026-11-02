<script setup>
/* Skeleton with the exact card frame and row heights. */
const bar = 'block animate-pulse rounded-sm bg-cream-2 motion-reduce:animate-none'
</script>

<template>
  <div aria-hidden="true" class="relative flex h-full min-h-[10.25rem] flex-col rounded-sm border border-border bg-card p-4">
    <div class="h-8" />
    <div class="mt-2 min-h-[2.6em] text-title leading-[1.3]"><span :class="[bar, 'mt-1 h-5 w-3/5']" /></div>
    <div class="mt-1 h-[1.5em] text-sm leading-[1.5]"><span :class="[bar, 'mt-1 h-3.5 w-4/5']" /></div>
    <div class="mt-auto flex h-10 items-end justify-end"><span :class="[bar, 'mb-1.5 h-4 w-14']" /></div>
  </div>
</template>
