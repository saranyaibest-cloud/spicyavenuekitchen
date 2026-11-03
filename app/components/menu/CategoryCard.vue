<script setup>
import { computed } from 'vue'
import CategoryIcon from './CategoryIcon.vue'
import { FOOD } from '~/lib/images'

const props = defineProps({
  category: { type: Object, required: true },
  count: { type: Number, default: 0 },
  index: { type: Number, default: 0 },
})
const emit = defineEmits(['open'])
const tag = computed(() => `${props.count} ${props.count === 1 ? 'dish' : 'dishes'}`)
const number = computed(() => String(props.index + 1).padStart(2, '0'))
const photo = computed(() => ({
  'just-south': FOOD.items['masala-dosa'],
  'biryani-rice-and-noodles': FOOD.items['hyderabadi-chicken-dum-biryani'],
  tandoor: FOOD.items['malai-paneer-tikka'],
}[props.category.id] || null))
const tone = computed(() => [
  'border-ink/15 bg-[#fbf8f2] text-ink before:bg-ink/5',
  'border-silver/25 bg-slate-2 text-cream before:bg-cream/5',
  'border-chili-deep bg-chili text-cream before:bg-cream/5',
][props.index % 3])
</script>

<template>
  <a
    href="#menu"
    :class="[
      'group/category relative isolate flex min-h-[13.5rem] flex-col overflow-hidden rounded-sm border p-4 transition-[translate,box-shadow,border-color] duration-300 ease-brand before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:opacity-0 before:transition-opacity before:duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-28px_rgb(19_23_28/0.55)] hover:before:opacity-100 motion-reduce:hover:translate-y-0 sm:p-5',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass',
      tone,
    ]"
    @click="emit('open', category.id)"
  >
    <span v-if="photo" aria-hidden="true" class="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[68%] overflow-hidden">
      <img :src="photo.src" alt="" class="size-full object-cover opacity-75 transition-transform duration-700 ease-brand group-hover/category:scale-105 motion-reduce:transform-none">
      <span class="absolute inset-0 bg-[linear-gradient(90deg,var(--tile-start)_0%,transparent_82%)]" :style="{ '--tile-start': index === 0 ? '#fbf8f2' : index === 1 ? '#1d232b' : '#9e302b' }" />
    </span>
    <span v-if="photo" class="pointer-events-none absolute top-[3.6rem] right-3 z-10 bg-ink/60 px-1.5 py-1 text-[0.5625rem] font-semibold uppercase text-cream">Stock photo</span>
    <span aria-hidden="true" class="pointer-events-none absolute -right-2 -bottom-10 -z-10 font-display text-[8.5rem] leading-none opacity-[0.055]">{{ number }}</span>
    <div class="flex items-center justify-between gap-3">
      <span class="font-mono text-[0.75rem] font-medium tabular-nums">{{ number }} / 03</span>
      <span class="border border-current/20 px-2 py-1 text-[0.75rem] tabular-nums">{{ tag }}</span>
    </div>
    <div class="mt-5 flex size-12 items-center justify-center rounded-full bg-white/10 ring-1 ring-current/15 transition-transform duration-300 group-hover/category:rotate-[-6deg] group-hover/category:scale-105 motion-reduce:transform-none sm:size-14">
      <CategoryIcon :id="category.id" :size="38" />
    </div>
    <div class="mt-auto flex items-end justify-between gap-3 pt-5">
      <span class="category-main min-w-0">
        <span class="mb-1 block text-[0.6875rem] font-semibold uppercase">Avenue {{ number }}</span>
        <span class="block max-w-[18ch] font-display text-title leading-tight">{{ category.title }}</span>
      </span>
      <span aria-hidden="true" class="mb-0.5 inline-flex size-9 shrink-0 items-center justify-center border border-current/30 transition-transform duration-300 group-hover/category:translate-x-1">
        <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
          <path d="M2.5 8h10M9 4.5L12.5 8 9 11.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" />
        </svg>
      </span>
    </div>
  </a>
</template>
