<script setup>
import { computed } from 'vue'
import SpecCard from './SpecCard.vue'
import DietMark from './DietMark.vue'
import InfoTip from './InfoTip.vue'
import CardPrice from './CardPrice.vue'
import { cleanPrice } from '~/lib/featuredData'
import { infoFor, tagFor } from '~/lib/cards'
import { splitHighlight } from '~/lib/menuLogic'
import { FOOD } from '~/lib/images'
import { slug } from '~/lib/format'

const props = defineProps({
  item: { type: Object, required: true },
  highlight: { type: String, default: '' }, // search text to mark in the name
  layout: { type: String, default: 'menu' },
  quantity: { type: Number, default: 0 },
  class: { type: [String, Array, Object], default: null },
})
const emit = defineEmits(['open', 'add', 'quantity'])
const info = computed(() => infoFor(props.item))
const tag = computed(() => tagFor(props.item))
const parts = computed(() => (props.highlight.trim() ? splitHighlight(props.item.name, props.highlight) : null))
const photo = computed(() => FOOD.items[slug(props.item.name)] || null)
const canAdd = computed(() => cleanPrice(props.item).price !== null || cleanPrice(props.item).variants.length === 1)

function add() {
  emit('add', { ...props.item, photo: photo.value && photo.value.src })
}
function setQuantity(value) {
  emit('quantity', props.item.id, value)
}
</script>

<template>
  <SpecCard :title="item.name" :tag="tag" :variant="layout" :data-dish="item.id" :class="props.class" @open="emit('open', item.id)">
    <template #mark><DietMark :diet="item.diet" /></template>
    <template #info><InfoTip :name="item.name" :info="info" /></template>
    <template #photo>
      <img v-if="photo" :src="photo.src" :alt="''" loading="lazy" decoding="async" class="absolute inset-0 size-full object-cover transition-transform duration-700 ease-brand group-hover/card:scale-105 motion-reduce:transform-none">
      <span v-else class="absolute inset-0 grid place-items-center bg-slate-2 text-cream"><span class="font-display text-3xl">SAK</span></span>
    </template>
    <template v-if="parts" #title>
      <template v-for="(p, i) in parts" :key="i">
        <mark v-if="p.hit" class="rounded-[2px] bg-highlight px-px text-inherit">{{ p.text }}</mark>
        <span v-else>{{ p.text }}</span>
      </template>
    </template>
    <template #corner><CardPrice :item="item" /></template>
    <template #action>
      <div class="flex items-center justify-end">
        <div v-if="quantity > 0" role="group" :aria-label="`Quantity for ${item.name}`" class="inline-flex h-10 items-center border border-ink/25 bg-white">
          <button type="button" class="inline-flex size-10 items-center justify-center text-lg hover:bg-cream-2" :aria-label="`Remove one ${item.name}`" @click.stop="setQuantity(quantity - 1)">−</button>
          <span class="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{{ quantity }}</span>
          <button type="button" class="inline-flex size-10 items-center justify-center text-lg hover:bg-cream-2" :aria-label="`Add one ${item.name}`" :disabled="quantity >= 20" @click.stop="setQuantity(quantity + 1)">+</button>
        </div>
        <button
          v-else
          type="button"
          class="inline-flex h-10 items-center gap-3 border border-chili px-4 text-sm font-semibold text-chili transition-colors hover:bg-chili hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!canAdd"
          :aria-label="canAdd ? `Add ${item.name} to cart` : `Choose an option for ${item.name} in details`"
          @click.stop="canAdd ? add() : emit('open', item.id)"
        >{{ canAdd ? 'Add' : 'View options' }}<span aria-hidden="true">{{ canAdd ? '+' : '→' }}</span></button>
      </div>
    </template>
  </SpecCard>
</template>
