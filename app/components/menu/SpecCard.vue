<script setup>
import { computed } from 'vue'
import { cn } from '~/lib/utils'

/* ONE card spec, used by the menu grid, the favourites row and About.
   Fixed structure so every card is the same height:
   [top row 32px: mark · info] [name: 2 lines reserved] [tag: 1 line reserved] [corner: bottom right].
   Hover: a soft light follows the pointer (after Aceternity "Card Spotlight"),
   mouse only, CSS-driven, off for reduced motion. The main action is a real
   <button> or <a>; its ::after covers the card so the whole card is clickable. */
const props = defineProps({
  title: { type: String, default: '' },
  tag: { type: String, default: '' },
  href: { type: String, default: null },
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
      'group/card relative isolate flex h-full min-h-[10.25rem] flex-col overflow-hidden rounded-sm border border-border bg-card p-4 text-card-foreground',
      'transition-[border-color,translate,box-shadow] duration-300 ease-brand hover:-translate-y-0.5 hover:border-ink/35 hover:shadow-[0_18px_36px_-24px_rgb(19_23_28/0.55)] motion-reduce:hover:translate-y-0',
      'before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:opacity-0 before:transition-opacity before:duration-300',
      'before:bg-[radial-gradient(240px_circle_at_var(--mx,50%)_var(--my,50%),rgb(158_48_43/0.10),transparent_70%)] hover:before:opacity-100 motion-reduce:before:hidden',
      'has-[.card-main:focus-visible]:outline-2 has-[.card-main:focus-visible]:outline-offset-2 has-[.card-main:focus-visible]:outline-brass',
      props.class,
    )"
    @pointermove="spot"
  >
    <div class="flex h-8 items-center justify-between">
      <span class="flex items-center"><slot name="mark" /></span>
      <slot name="info" />
    </div>
    <component
      :is="main"
      v-bind="href ? { href } : { type: 'button' }"
      class="card-main mt-2 text-left outline-none after:absolute after:inset-0 after:rounded-sm after:content-['']"
      @click="emit('open', $event)"
    >
      <span class="line-clamp-2 min-h-[2.6em] font-display text-title leading-[1.3]"><slot name="title">{{ title }}</slot></span>
    </component>
    <p class="mt-1 h-[1.5em] overflow-hidden whitespace-nowrap text-sm leading-[1.5] text-muted">{{ tag }}</p>
    <div class="mt-auto flex h-10 items-end justify-end text-[1.0625rem] leading-7"><slot name="corner" /></div>
  </div>
</template>
