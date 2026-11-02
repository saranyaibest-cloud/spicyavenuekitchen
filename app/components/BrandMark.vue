<script setup>
import { cn } from '~/lib/utils'

/* The three tiles (S A K) cropped from /brand/logo.jpg without redrawing it.
   Source 1600×882; tiles span x 140–1453, y 138–748 (1313×610).
   The wrapper has the tiles' aspect ratio; the full image is scaled and
   offset inside it so only the tiles show. Height: 34px mobile, 40px desktop. */
const props = defineProps({ class: { type: [String, Array, Object], default: null } })

const SRC_W = 1600
const SRC_H = 882
const X = 140
const Y = 138
const W = 1313
const H = 610
const imgStyle = {
  position: 'absolute',
  width: `${(SRC_W / W) * 100}%`,
  height: `${(SRC_H / H) * 100}%`,
  left: `${(-X / W) * 100}%`,
  top: `${(-Y / H) * 100}%`,
  maxWidth: 'none',
}
</script>

<template>
  <span
    :class="cn('relative block h-[34px] overflow-hidden rounded-sm nav:h-10', props.class)"
    :style="{ aspectRatio: `${W} / ${H}` }"
  >
    <img src="/brand/logo.jpg" alt="Spicy Avenue Kitchen" :width="SRC_W" :height="SRC_H" decoding="async" :style="imgStyle">
  </span>
</template>
