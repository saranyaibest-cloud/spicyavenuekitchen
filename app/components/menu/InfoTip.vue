<script setup>
import { ref } from 'vue'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'

/* "What is this?" on a card: a shadcn-vue Popover (Reka UI).
   Opens on hover (mouse), tap (touch) and Enter/Space (keyboard).
   Reka handles positioning, Escape, outside taps and focus return.
   Hover never moves focus; a keyboard open moves focus into the text
   so screen readers read it, and Escape returns to the button. */
const props = defineProps({
  name: { type: String, required: true },
  info: { type: Object, default: null },
})
const open = ref(false)
const byHover = ref(false)
let timer = 0
const showFlag = import.meta.dev && props.info && props.info.reviewed === false

function enter(e) {
  if (e.pointerType !== 'mouse') return
  clearTimeout(timer)
  if (!open.value) {
    byHover.value = true
    open.value = true
  }
}
function leave(e) {
  if (e.pointerType !== 'mouse' || !byHover.value) return
  clearTimeout(timer)
  timer = setTimeout(() => {
    open.value = false
  }, 140)
}
// Reka toggles on click. A click on a hover-opened tip pins it open instead of closing it.
let pinNext = false
function onTriggerDown() {
  pinNext = byHover.value && open.value
}
function setOpen(v) {
  if (!v && pinNext) {
    pinNext = false
    byHover.value = false
    return
  }
  pinNext = false
  if (!v) byHover.value = false
  open.value = v
}
function onAutoFocus(e) {
  if (byHover.value) e.preventDefault()
}
</script>

<template>
  <span v-if="!info" class="size-8" aria-hidden="true" />
  <span v-else class="relative z-10 -m-1.5 inline-flex" @pointerenter="enter" @pointerleave="leave">
    <Popover :open="open" @update:open="setOpen">
      <PopoverTrigger
        :aria-label="`What is ${name}?`"
        class="inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:text-ink data-[state=open]:text-ink"
        @pointerdown="onTriggerDown"
        @click.stop
      >
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" stroke-width="1.5" />
          <path d="M10 9v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          <circle cx="10" cy="6.2" r="1" fill="currentColor" />
        </svg>
      </PopoverTrigger>
      <PopoverContent
        :aria-label="info.title ? `${info.title}: ${info.body}` : info.body"
        @open-auto-focus="onAutoFocus"
        @pointerenter="enter"
        @pointerleave="leave"
      >
        <span v-if="info.title" class="mb-0.5 block font-medium">{{ info.title }}</span>
        <span class="block text-cream/90">{{ info.body }}</span>
        <span v-if="showFlag" class="mt-2 inline-block rounded-sm border border-cream/40 px-1.5 text-xs text-cream/80">Unreviewed</span>
      </PopoverContent>
    </Popover>
  </span>
</template>
