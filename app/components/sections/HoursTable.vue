<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { hoursRows, isOpenAt, restaurantNow } from '~/lib/hours'

/* Renders only when SITE.hours is set (Visit decides). Rechecks every minute
   so the badge flips at opening/closing time. */
const props = defineProps({ hours: { type: Array, required: true } })
const now = ref(null) // null on the server: no badge, no "today" until the browser knows the time
let timer = 0
onMounted(() => {
  now.value = new Date()
  timer = setInterval(() => (now.value = new Date()), 60000)
})
onBeforeUnmount(() => clearInterval(timer))

const open = computed(() => (now.value ? isOpenAt(props.hours, restaurantNow(now.value)) : null))
const rows = computed(() => hoursRows(props.hours, now.value ? now.value.getDay() : -1))
</script>

<template>
  <div class="mt-7 max-w-[26rem]">
    <div class="mb-2 flex items-center gap-3">
      <h3 class="text-[1.125rem]">Hours</h3>
      <span
        v-if="open !== null"
        :class="[
          'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[0.8125rem] font-bold before:size-[7px] before:rounded-full before:bg-current',
          open ? 'bg-[#e2efe5] text-[#1b5e30]' : 'bg-cream-2 text-[#5c2019]',
        ]"
      >{{ open ? 'Open now' : 'Closed now' }}</span>
    </div>
    <table class="w-full border-collapse tabular-nums">
      <caption class="sr-only">Opening hours, Central Time</caption>
      <tbody>
        <tr
          v-for="(r, i) in rows"
          :key="`${r.label}-${i}`"
          :aria-current="r.isToday ? 'date' : undefined"
          :class="r.isToday ? 'bg-cream/10 font-bold' : ''"
        >
          <th scope="row" :class="['border-b border-cream/15 px-2.5 py-2 text-left text-[0.9375rem] font-semibold', r.isToday && 'shadow-[inset_3px_0_0_var(--color-highlight)]']">
            {{ r.label }}<span v-if="r.isToday" class="font-bold text-highlight"> · Today</span>
          </th>
          <td class="border-b border-cream/15 px-2.5 py-2 text-right text-[0.9375rem]">{{ r.text }}</td>
        </tr>
      </tbody>
    </table>
    <p class="mt-2 text-[0.8125rem] text-silver">Times are Central Time (Katy, Texas).</p>
  </div>
</template>
