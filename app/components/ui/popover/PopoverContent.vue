<script setup>
import { PopoverContent, PopoverPortal } from 'reka-ui'
import { cn } from '~/lib/utils'

defineOptions({ inheritAttrs: false })
const props = defineProps({
  class: { type: [String, Array, Object], default: null },
  align: { type: String, default: 'end' },
  side: { type: String, default: 'bottom' },
  sideOffset: { type: Number, default: 4 },
  collisionPadding: { type: Number, default: 12 },
})
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      data-slot="popover-content"
      v-bind="$attrs"
      :align="align"
      :side="side"
      :side-offset="sideOffset"
      :collision-padding="collisionPadding"
      :class="cn(
        'z-[75] w-[min(18rem,calc(100vw-2rem))] rounded-sm bg-popover px-3.5 py-3 text-left text-sm leading-snug text-popover-foreground shadow-[0_16px_32px_-16px_rgb(19_23_28/0.6)] outline-none',
        'data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out',
        props.class,
      )"
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
