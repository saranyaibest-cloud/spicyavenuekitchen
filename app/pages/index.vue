<script setup>
import { computed } from 'vue'
import SiteHeader from '~/components/sections/SiteHeader.vue'
import HeroSection from '~/components/sections/HeroSection.vue'
import AboutSection from '~/components/sections/AboutSection.vue'
import FavouritesSection from '~/components/sections/FavouritesSection.vue'
import MenuSection from '~/components/sections/MenuSection.vue'
import GallerySection from '~/components/sections/GallerySection.vue'
import VisitSection from '~/components/sections/VisitSection.vue'
import SiteFooter from '~/components/sections/SiteFooter.vue'
import MenuAssistant from '~/components/sections/MenuAssistant.vue'
import { FOOD } from '~/lib/images'
import { FEATURED } from '~/data/site'
import { resolveFeatured } from '~/lib/featuredData'
import { useSiteState } from '~/composables/useSiteState'

/* The one-page site: / */
const { menu, status, cat, dishId, assistantOpen, seed, openDish, askAbout, onAssistantDish, onAssistantCategory } = useSiteState()
const hasFeatured = computed(() => resolveFeatured(menu.value, FEATURED).length > 0)

// Links only to sections that render.
const nav = computed(() => [
  ['about', 'About'],
  ...(hasFeatured.value ? [['start', 'Favourites']] : []),
  ['menu', 'Menu'],
  ...(FOOD.gallery.length ? [['gallery', 'Gallery']] : []),
  ['visit', 'Visit us'],
])
</script>

<template>
  <div>
    <SiteHeader :nav="nav" />
    <main id="main" tabindex="-1">
      <HeroSection :photo="FOOD.hero" />
      <AboutSection :menu="menu" @go="cat = $event" />
      <FavouritesSection :menu="menu" @open="openDish" />
      <MenuSection v-model:cat="cat" v-model:dish-id="dishId" :menu="menu" :status="status" @ask="askAbout" />
      <GallerySection />
      <VisitSection />
    </main>
    <SiteFooter :nav="nav" />
    <MenuAssistant v-model:open="assistantOpen" :seed="seed" :menu="menu" @dish="onAssistantDish" @category="onAssistantCategory" />
  </div>
</template>
