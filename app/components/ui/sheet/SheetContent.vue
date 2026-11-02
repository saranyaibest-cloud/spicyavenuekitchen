<script setup>
import { DialogContent, DialogOverlay, DialogPortal } from 'reka-ui'
import { cn } from '~/lib/utils'

/* side: 'right' (full-height drawer), 'bottom' (sheet), 'responsive'
   (bottom sheet on phones, centred dialog from 900px), 'full' (whole screen). Other props and
   events (@open-auto-focus, @close-auto-focus, @escape-key-down…) pass
   through to Reka's DialogContent. */
defineOptions({ inheritAttrs: false })
const props = defineProps({
  side: { type: String, default: 'right' },
  class: { type: [String, Array, Object], default: null },
  overlayClass: { type: [String, Array, Object], default: null },
})

const SIDES = {
  right:
    'inset-y-0 right-0 h-full w-full max-w-md data-[state=open]:animate-sheet-in-right data-[state=closed]:animate-sheet-out-right',
  bottom:
    'inset-x-0 bottom-0 max-h-[90svh] w-full data-[state=open]:animate-sheet-in-bottom data-[state=closed]:animate-sheet-out-bottom',
  responsive:
    'inset-x-0 bottom-0 max-h-[90svh] w-full data-[state=open]:animate-sheet-in-bottom data-[state=closed]:animate-sheet-out-bottom ' +
    'nav:inset-auto nav:left-1/2 nav:top-1/2 nav:bottom-auto nav:max-w-[30rem] nav:-translate-x-1/2 nav:-translate-y-1/2 ' +
    'nav:data-[state=open]:animate-dialog-in nav:data-[state=closed]:animate-dialog-out',
  full: 'inset-0 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
}
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      data-slot="sheet-overlay"
      :class="cn('fixed inset-0 z-[70] bg-slate/60 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out', overlayClass)"
    />
    <DialogContent
      data-slot="sheet-content"
      v-bind="$attrs"
      :class="cn('fixed z-[71] flex flex-col outline-none', SIDES[side] || SIDES.right, props.class)"
    >
      <slot />
    </DialogContent>
  </DialogPortal>
</template>
