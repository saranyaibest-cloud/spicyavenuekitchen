<script setup>
import { computed, shallowRef, watch } from 'vue'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '~/components/ui/sheet'
import { Button } from '~/components/ui/button'
import DietMark from './DietMark.vue'
import { cleanPrice, dietLabel } from '~/lib/featuredData'
import { money } from '~/lib/format'
import { tagFor } from '~/lib/cards'

/* Minimal dish details: shadcn-vue Sheet (Reka UI Dialog). Bottom sheet on
   phones, centred dialog from 900px. Reka traps focus, closes on Escape or an
   outside tap and returns focus to the card that opened it. */
const props = defineProps({ entry: { type: Object, default: null } })
const emit = defineEmits(['close', 'ask'])

let asking = false
// Keep showing the last dish while the close animation runs.
const shown = shallowRef(null)
watch(() => props.entry, (e) => { if (e) shown.value = e }, { immediate: true })
const item = computed(() => (shown.value ? shown.value.item : null))
const diet = computed(() => (item.value ? dietLabel(item.value.diet) : ''))
const tag = computed(() => (item.value ? tagFor(item.value) : ''))
const price = computed(() => (item.value ? cleanPrice(item.value) : { price: null, variants: [] }))

function onOpenChange(v) {
  if (!v) emit('close')
}
function ask() {
  asking = true
  emit('ask', item.value)
}
// Going to the assistant: let it take focus instead of returning to the card.
function onCloseAutoFocus(e) {
  if (asking) e.preventDefault()
  asking = false
}
</script>

<template>
  <Sheet :open="!!entry" @update:open="onOpenChange">
    <SheetContent
      v-if="item"
      side="responsive"
      v-bind="tag ? {} : { 'aria-describedby': 'undefined' }"
      class="overflow-y-auto rounded-t-sm bg-cream px-5 pt-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] text-ink nav:rounded-sm nav:p-7"
      @close-auto-focus="onCloseAutoFocus"
    >
      <div class="flex items-start justify-between gap-4">
        <p class="text-sm text-muted">{{ shown.category.title }}</p>
        <SheetClose aria-label="Close" class="-mt-2 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-cream-2">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" />
          </svg>
        </SheetClose>
      </div>
      <SheetTitle as="h3" class="font-display text-section">{{ item.name }}</SheetTitle>
      <SheetDescription v-if="tag" class="mt-1 text-muted">{{ tag }}</SheetDescription>

      <div class="mt-5">
        <span v-if="price.variants.length" class="grid gap-1 tabular-nums">
          <span v-for="(v, i) in price.variants" :key="`${v.label}-${i}`" class="flex items-baseline gap-3">
            <span class="text-sm text-muted">{{ v.label }}</span>
            <span class="text-[1.375rem] font-medium">{{ money(v.price) }}</span>
          </span>
        </span>
        <span v-else-if="price.price === null" class="text-[1.375rem] text-muted">
          <span aria-hidden="true">–</span><span class="sr-only">Price not listed</span>
        </span>
        <span v-else class="text-[1.625rem] font-medium tabular-nums">{{ money(price.price) }}</span>
      </div>

      <p v-if="item.description" class="mt-5 max-w-[60ch] leading-relaxed">{{ item.description }}</p>
      <p v-if="diet" class="mt-4 flex items-center gap-2 text-sm">
        <DietMark :diet="item.diet" />
        <span aria-hidden="true">{{ diet }}</span>
      </p>
      <div class="mt-7">
        <Button variant="secondary" arrow="right" @click="ask">Ask the menu assistant</Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
