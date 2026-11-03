<script setup>
import { computed } from 'vue'
import { cn } from '~/lib/utils'

const props = defineProps({
  title: { type: String, default: '' },
  tag: { type: String, default: '' },
  href: { type: String, default: null },
  variant: { type: String, default: 'menu' },
  class: { type: [String, Array, Object], default: null },
})
const emit = defineEmits(['open'])
const main = computed(() => (props.href ? 'a' : 'button'))

function spot(e) {
  if (e.pointerType !== 'mouse') return
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
}
</script>

<template>
  <div
    data-card
    :class="cn(
      'group/card relative isolate flex h-full min-h-[12rem] flex-col overflow-hidden rounded-sm border border-border bg-card text-card-foreground',
      'transition-[border-color,translate,box-shadow] duration-300 ease-brand hover:-translate-y-0.5 hover:border-ink/35 hover:shadow-[0_18px_36px_-24px_rgb(19_23_28/0.55)] motion-reduce:hover:translate-y-0',
      'before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:opacity-0 before:transition-opacity before:duration-300',
      'before:bg-[radial-gradient(240px_circle_at_var(--mx,50%)_var(--my,50%),rgb(158_48_43/0.10),transparent_70%)] hover:before:opacity-100 motion-reduce:before:hidden',
      variant === 'featured' && 'min-h-[23rem]',
      props.class,
    )"
    @pointermove="spot"
  >
    <div class="flex h-8 items-center justify-between px-4 pt-3">
      <span class="flex items-center"><slot name="mark" /></span>
      <slot name="info" />
    </div>
    <component
      :is="main"
      v-bind="href ? { href } : { type: 'button' }"
      class="card-main block flex-1 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brass"
      @click="emit('open', $event)"
    >
      <div v-if="variant === 'featured'" class="relative aspect-[16/10] overflow-hidden bg-cream-2">
        <slot name="photo" />
        <span class="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgb(19_25_24/0.72),transparent)] px-3 pt-8 pb-2 text-[0.6875rem] font-semibold uppercase text-cream">Illustrative photo</span>
      </div>
      <div class="flex min-h-[8.75rem] gap-3 p-4 pt-2">
        <div class="flex min-w-0 flex-1 flex-col">
          <span class="line-clamp-2 min-h-[2.6em] font-display text-title leading-[1.3]"><slot name="title">{{ title }}</slot></span>
          <p class="mt-1 min-h-[1.5em] overflow-hidden text-sm leading-[1.5] text-muted">{{ tag }}</p>
          <div class="mt-auto pt-3 text-[1.0625rem] leading-7"><slot name="corner" /></div>
        </div>
        <div v-if="variant !== 'featured'" class="relative aspect-square w-[38%] max-w-36 shrink-0 self-center overflow-hidden rounded-sm bg-cream-2">
          <slot name="photo" />
          <span class="absolute inset-x-0 bottom-0 bg-ink/70 px-1.5 py-1 text-center text-[0.5625rem] font-semibold uppercase leading-tight text-cream">Illustrative</span>
        </div>
      </div>
    </component>
    <div v-if="$slots.action" class="relative z-10 px-4 pb-4">
      <slot name="action" />
    </div>
  </div>
</template>
