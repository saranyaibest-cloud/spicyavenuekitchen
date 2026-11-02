<script setup>
import { computed } from 'vue'
import { Primitive } from 'reka-ui'
import { cn } from '~/lib/utils'
import { buttonVariants } from '.'

/* <Button href="#menu" arrow="right">Explore menu</Button>
   <Button :href="url" external arrow="external" variant="secondary-dark">Directions</Button>
   `as-child` passes the styling to a single child element (Reka UI Primitive). */
const props = defineProps({
  href: { type: String, default: null },
  external: { type: Boolean, default: false },
  variant: { type: String, default: 'primary' },
  arrow: { type: String, default: null }, // 'right' | 'external' | null
  type: { type: String, default: 'button' },
  asChild: { type: Boolean, default: false },
  class: { type: [String, Array, Object], default: null },
})

const tag = computed(() => (props.asChild ? undefined : props.href ? 'a' : 'button'))
const linkAttrs = computed(() => {
  if (props.asChild) return {}
  if (props.href) return props.external ? { href: props.href, target: '_blank', rel: 'noopener noreferrer' } : { href: props.href }
  return { type: props.type }
})
const ROLL = 'block transition-transform duration-[280ms] ease-brand motion-reduce:transition-none'
const arrowMove = computed(() =>
  props.arrow === 'external'
    ? 'group-hover:translate-x-[2px] group-hover:-translate-y-[2px] group-focus-visible:translate-x-[2px] group-focus-visible:-translate-y-[2px]'
    : 'group-hover:translate-x-[3px] group-focus-visible:translate-x-[3px]',
)
</script>

<template>
  <Primitive
    :as="tag"
    :as-child="asChild"
    v-bind="linkAttrs"
    data-slot="button"
    :class="cn(buttonVariants({ variant }), props.class)"
  >
    <template v-if="asChild"><slot /></template>
    <template v-else>
      <span class="relative inline-flex overflow-hidden">
        <span :class="cn(ROLL, 'group-hover:-translate-y-full group-focus-visible:-translate-y-full motion-reduce:translate-y-0!')"><slot /></span>
        <span aria-hidden="true" :class="cn(ROLL, 'absolute inset-x-0 top-0 translate-y-full group-hover:translate-y-0 group-focus-visible:translate-y-0 motion-reduce:hidden')"><slot /></span>
      </span>
      <svg
        v-if="arrow"
        viewBox="0 0 16 16"
        width="14"
        height="14"
        aria-hidden="true"
        focusable="false"
        :class="cn('shrink-0 transition-transform duration-[280ms] ease-brand motion-reduce:transform-none', arrowMove)"
      >
        <path
          :d="arrow === 'external' ? 'M4.5 11.5l7-7M6 4.5h5.5V10' : 'M2.5 8h10M9 4.5L12.5 8 9 11.5'"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="square"
        />
      </svg>
      <span v-if="external" class="sr-only"> (opens in a new tab)</span>
    </template>
  </Primitive>
</template>
