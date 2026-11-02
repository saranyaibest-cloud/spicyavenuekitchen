<script setup>
import { useHead } from '#imports'
import SiteHeader from '~/components/sections/SiteHeader.vue'
import MenuSection from '~/components/sections/MenuSection.vue'
import SiteFooter from '~/components/sections/SiteFooter.vue'
import MenuAssistant from '~/components/sections/MenuAssistant.vue'
import { useSiteState } from '~/composables/useSiteState'

/* /menu: where the table QR codes land (https://<domain>/q/main → 302 → /menu).
   Opens straight on the menu: category strip, search, Veg / Non-veg, cards,
   the dish dialog and the menu assistant. No hero, so a guest at the table
   sees dishes immediately. Links back to the full site. */
const { menu, status, cat, dishId, assistantOpen, seed, askAbout, onAssistantDish, onAssistantCategory } = useSiteState()

const nav = [
  ['/', 'Home'],
  ['menu', 'Menu'],
  ['/#visit', 'Visit us'],
]

useHead({
  title: 'Menu · Spicy Avenue Kitchen, Katy, Texas',
  meta: [{ name: 'description', content: 'The Spicy Avenue Kitchen menu: search dishes, filter Veg or Non-veg, and see prices.' }],
})
</script>

<template>
  <div>
    <SiteHeader :nav="nav" :home="false" />
    <main id="main" tabindex="-1" class="pt-[var(--nav-h)]">
      <MenuSection v-model:cat="cat" v-model:dish-id="dishId" :menu="menu" :status="status" title-tag="h1" class="pt-10! nav:pt-14!" @ask="askAbout" />
    </main>
    <SiteFooter :nav="nav" :home="false" />
    <MenuAssistant v-model:open="assistantOpen" :seed="seed" :menu="menu" @dish="onAssistantDish" @category="onAssistantCategory" />
  </div>
</template>
