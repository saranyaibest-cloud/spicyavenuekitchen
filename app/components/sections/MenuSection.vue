<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { DIETS, buildIndex, categoriesOf, filterGroups, summaryText } from '~/lib/menuLogic'
import { count, slug, stampText } from '~/lib/format'
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Button } from '~/components/ui/button'
import CategoryIcon from '~/components/menu/CategoryIcon.vue'
import DietMark from '~/components/menu/DietMark.vue'
import DishCard from '~/components/menu/DishCard.vue'
import CardSkeleton from '~/components/menu/CardSkeleton.vue'
import DishDialog from '~/components/menu/DishDialog.vue'
import { useCart } from '~/composables/useCart'
import { ensureGsap, gsap, prefersReducedMotion, ScrollTrigger } from '~/lib/gsap'

/* The menu: category icon strip (shadcn-vue Tabs on Reka UI: roving focus,
   arrow keys, Home/End), search, Veg / Non-veg filter, equal cards, and the
   dish dialog. On every change the visible cards settle in with a short GSAP
   stagger. `cat` and `dishId` are shared with the page (v-model). */
const props = defineProps({
  menu: { type: Object, default: null },
  status: { type: String, default: 'ready' },
  cat: { type: String, default: null },
  dishId: { type: String, default: null },
  titleTag: { type: String, default: 'h2' }, // 'h1' on the /menu page
})
const emit = defineEmits(['update:cat', 'update:dishId', 'ask'])
const cart = useCart()
const quantity = (id) => cart.items.value.find((line) => line.id === id)?.quantity || 0

const query = ref('')
const diet = ref('all')
const input = ref(null)
const strip = ref(null)
const panel = ref(null)

const categories = computed(() => categoriesOf(props.menu))
const index = computed(() => buildIndex(categories.value))
// With no category chosen yet, open the first one that has dishes.
const active = computed(
  () => categories.value.find((c) => c.id === props.cat) || categories.value.find((c) => count(c) > 0) || categories.value[0] || null,
)
const activeId = computed({
  get: () => (active.value ? active.value.id : null),
  set: (id) => {
    query.value = ''
    emit('update:cat', id)
  },
})
const result = computed(() => filterGroups({ categories: categories.value, activeId: activeId.value, query: query.value, diet: diet.value }))
const searching = computed(() => query.value.trim() !== '')
const openEntry = computed(() => (props.dishId != null ? index.value.get(props.dishId) || null : null))
const stamp = computed(() => (props.menu ? stampText(props.menu.meta) : ''))
const secId = (catId, title) => `sec-${catId}-${slug(title)}`

/* Keep the active tab in view inside the strip. */
watch(activeId, async () => {
  await nextTick()
  const s = strip.value
  const tab = s && s.querySelector('[role="tab"][data-state="active"]')
  if (!tab) return
  const left = tab.offsetLeft - 16
  const right = tab.offsetLeft + tab.offsetWidth + 16 - s.clientWidth
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth'
  if (s.scrollLeft > left) s.scrollTo({ left, behavior })
  else if (s.scrollLeft < right) s.scrollTo({ left: right, behavior })
})

/* Cards settle in after a category, search or filter change. The page height
   changes too, so scroll-linked effects further down (gallery pin, Visit, footer)
   re-measure their start and end points. */
let refreshTimer = 0
watch([activeId, () => result.value.total, diet, () => props.status], async () => {
  await nextTick()
  clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => {
    ensureGsap()
    ScrollTrigger.refresh()
  }, 120)
  if (prefersReducedMotion() || !panel.value) return
  const cards = panel.value.querySelectorAll('[data-dish]')
  if (!cards.length) return
  gsap.fromTo(cards, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, stagger: { each: 0.025, amount: 0.3 }, overwrite: true, clearProps: 'transform,opacity' })
})

onBeforeUnmount(() => clearTimeout(refreshTimer))

function clearFilters() {
  query.value = ''
  diet.value = 'all'
  if (input.value) input.value.focus()
}
function clearSearch() {
  query.value = ''
  if (input.value) input.value.focus()
}
function ask(item) {
  emit('update:dishId', null)
  emit('ask', item)
}
</script>

<template>
  <section id="menu" aria-labelledby="menu-title" :aria-busy="status === 'loading'" class="surface-paper py-20 text-ink nav:py-28">
    <div class="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
      <header class="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          <p class="mb-2 flex items-center gap-3 text-[0.75rem] font-semibold uppercase text-chili"><span class="h-px w-8 bg-chili/45" />At the table</p>
          <component :is="titleTag" id="menu-title" class="text-section">Menu</component>
        </div>
        <span v-if="stamp" class="text-sm text-muted">{{ stamp }}</span>
      </header>

      <!-- Loading skeleton -->
      <div v-if="status === 'loading'" aria-hidden="true">
        <div class="flex gap-3 overflow-hidden pt-3 pb-4">
          <span v-for="i in 8" :key="i" class="flex min-w-[76px] flex-col items-center gap-2 nav:min-w-[84px]">
            <span class="size-14 animate-pulse rounded-full bg-cream-2 motion-reduce:animate-none nav:size-16" />
            <span class="h-3 w-12 animate-pulse rounded-sm bg-cream-2 motion-reduce:animate-none" />
          </span>
        </div>
        <span class="mt-8 mb-6 block h-8 w-56 max-w-[60%] animate-pulse rounded-sm bg-cream-2 motion-reduce:animate-none" />
        <div class="grid auto-rows-fr grid-cols-1 gap-3 nav:grid-cols-2">
          <CardSkeleton v-for="i in 8" :key="i" />
        </div>
      </div>

      <p v-else-if="!categories.length" class="text-muted">The menu couldn’t be loaded. Please refresh the page.</p>

      <Tabs v-else v-model="activeId" activation-mode="automatic">
        <!-- Category icon strip -->
        <div class="sticky top-[var(--nav-h)] z-20 -mx-4 border-b border-border bg-cream/95 backdrop-blur-md sm:-mx-6 lg:-mx-8">
          <div
            ref="strip"
            class="overflow-x-auto overscroll-x-contain px-4 pt-3 pb-2 [scrollbar-width:none] sm:px-6 lg:px-8 max-nav:[mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-28px),transparent)] [&::-webkit-scrollbar]:hidden"
          >
            <TabsList aria-label="Menu categories" class="relative flex w-max gap-1 nav:gap-2">
              <TabsTrigger
                v-for="c in categories"
                :key="c.id"
                :value="c.id"
                :data-cat="c.id"
                class="group relative flex min-w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-sm px-1.5 pt-1 pb-2.5 nav:min-w-[84px]"
              >
                <span
                  class="flex size-14 items-center justify-center rounded-full bg-cream-2 transition-[box-shadow,scale] duration-300 ease-brand group-hover:ring-1 group-hover:ring-ink/25 group-data-[state=active]:scale-105 group-data-[state=active]:ring-2 group-data-[state=active]:ring-chili group-data-[state=active]:ring-offset-2 group-data-[state=active]:ring-offset-cream nav:size-16 motion-reduce:group-data-[state=active]:scale-100"
                >
                  <CategoryIcon :id="c.id" class="size-10 nav:size-12" />
                </span>
                <span class="whitespace-nowrap text-[0.8125rem] leading-tight font-normal text-muted group-hover:text-ink group-data-[state=active]:font-semibold group-data-[state=active]:text-ink">
                  {{ c.title }}
                </span>
              </TabsTrigger>
              <TabsIndicator
                class="absolute bottom-0 left-0 h-0.5 w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position) transition-[width,translate] duration-[400ms] ease-brand motion-reduce:transition-none"
              >
                <span class="mx-4 block h-full rounded-full bg-chili" />
              </TabsIndicator>
            </TabsList>
          </div>
        </div>

        <!-- Search + diet filter -->
        <div class="mt-6 flex flex-wrap items-center gap-3">
          <div class="relative min-w-0 flex-[1_1_280px] nav:max-w-[30rem]">
            <label for="menu-search" class="sr-only">Search the menu</label>
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">
              <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6" />
              <path d="m13 13 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" />
            </svg>
            <input
              id="menu-search"
              ref="input"
              v-model="query"
              type="search"
              autocomplete="off"
              spellcheck="false"
              placeholder="Search dishes"
              class="h-11 w-full rounded-sm border border-input bg-white pr-11 pl-10 text-base text-ink transition-[border-color,box-shadow] duration-200 placeholder:text-muted focus:border-ink/60 [&::-webkit-search-cancel-button]:appearance-none"
            >
            <button
              v-if="query"
              type="button"
              aria-label="Clear search"
              class="absolute top-0 right-0 inline-flex size-11 items-center justify-center rounded-sm"
              @click="clearSearch"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" />
              </svg>
            </button>
          </div>

          <div role="group" aria-label="Filter by diet" class="flex overflow-hidden rounded-sm border border-input max-nav:w-full">
            <button
              v-for="[value, label] in DIETS"
              :key="value"
              type="button"
              :aria-pressed="diet === value"
              class="flex h-11 items-center justify-center gap-2 border-l border-border bg-white px-4 text-label font-medium transition-colors duration-200 first:border-l-0 aria-pressed:bg-ink aria-pressed:text-cream max-nav:flex-1"
              @click="diet = value"
            >
              <DietMark v-if="value !== 'all'" :diet="value" />
              <span :aria-hidden="value !== 'all' ? 'true' : undefined">{{ label }}</span>
            </button>
          </div>
        </div>

        <p class="mt-3 min-h-6 text-sm text-muted" aria-live="polite">{{ summaryText(result.total, query, result.sections) }}</p>

        <component
          :is="searching ? 'div' : TabsContent"
          v-bind="searching ? { role: 'region', 'aria-label': 'Search results' } : { value: activeId }"
          class="outline-none"
        >
          <div id="menu-panel" ref="panel">
            <div v-if="!searching && active" class="mt-4 mb-2">
              <h3 class="text-section">{{ active.title }}</h3>
              <nav v-if="(active.sections || []).length > 1" :aria-label="`Sections in ${active.title}`" class="mt-3 flex flex-wrap gap-2">
                <a
                  v-for="s in active.sections"
                  :key="s.title"
                  :href="`#${secId(active.id, s.title)}`"
                  class="inline-flex h-11 items-center rounded-sm border border-border px-4 text-label transition-colors duration-200 hover:border-ink/40 hover:bg-cream-2"
                >{{ s.title }}</a>
              </nav>
            </div>

            <div v-if="result.groups.length === 0" class="mt-6 rounded-sm border border-dashed border-ink/30 p-6">
              <p class="font-display text-title">No dishes match.</p>
              <p class="mt-1 mb-4 text-muted">
                {{ searching ? `Nothing found for “${query.trim()}”` : 'Nothing in this category' }}{{ diet !== 'all' ? ` with the ${diet === 'veg' ? 'Veg' : 'Non-veg'} filter.` : '.' }}
              </p>
              <Button @click="clearFilters">Clear search and filters</Button>
            </div>

            <template v-else>
            <div
              v-for="g in result.groups"
              :id="searching ? undefined : secId(g.category.id, g.section.title)"
              :key="`${g.category.id}-${g.section.title}`"
              class="mt-8 scroll-mt-[calc(var(--nav-h)+120px)]"
            >
              <h4 class="mb-3 border-b border-border pb-2 font-sans text-sm font-medium text-muted">
                {{ searching ? `${g.category.title} · ${g.section.title}` : g.section.title }}
              </h4>
              <ul class="grid auto-rows-fr grid-cols-1 gap-3 nav:grid-cols-2">
                <li v-for="item in g.items" :key="item.id" class="min-w-0">
                  <DishCard :item="item" :highlight="searching ? query : ''" layout="menu" :quantity="quantity(item.id)" @open="emit('update:dishId', $event)" @add="cart.add" @quantity="cart.setQuantity" />
                </li>
              </ul>
            </div>
            </template>

            <p class="mt-10 text-sm text-muted">Dishes with a dash (–) have no price listed.</p>
          </div>
        </component>
      </Tabs>
    </div>

    <DishDialog :entry="openEntry" @close="emit('update:dishId', null)" @ask="ask" />
  </section>
</template>
