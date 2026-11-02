<script setup>
import { computed } from 'vue'
import SpecCard from './SpecCard.vue'
import DietMark from './DietMark.vue'
import InfoTip from './InfoTip.vue'
import CardPrice from './CardPrice.vue'
import { infoFor, tagFor } from '~/lib/cards'
import { splitHighlight } from '~/lib/menuLogic'

const props = defineProps({
  item: { type: Object, required: true },
  highlight: { type: String, default: '' }, // search text to mark in the name
  class: { type: [String, Array, Object], default: null },
})
const emit = defineEmits(['open'])
const info = computed(() => infoFor(props.item))
const tag = computed(() => tagFor(props.item))
const parts = computed(() => (props.highlight.trim() ? splitHighlight(props.item.name, props.highlight) : null))
</script>

<template>
  <SpecCard :title="item.name" :tag="tag" :data-dish="item.id" :class="props.class" @open="emit('open', item.id)">
    <template #mark><DietMark :diet="item.diet" /></template>
    <template #info><InfoTip :name="item.name" :info="info" /></template>
    <template v-if="parts" #title>
      <template v-for="(p, i) in parts" :key="i">
        <mark v-if="p.hit" class="rounded-[2px] bg-highlight px-px text-inherit">{{ p.text }}</mark>
        <span v-else>{{ p.text }}</span>
      </template>
    </template>
    <template #corner><CardPrice :item="item" /></template>
  </SpecCard>
</template>
