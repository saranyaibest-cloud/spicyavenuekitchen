import { computed, ref } from 'vue'
import { useMenu } from '~/composables/useMenu'
import { buildIndex, categoriesOf } from '~/lib/menuLogic'
import { scrollToTarget } from '~/lib/gsap'

/* State shared by the menu, the dish dialog and the assistant on a page:
   the active category, the open dish and the assistant (open + seed question). */
export function useSiteState() {
  const { menu, status } = useMenu()
  const cat = ref(null)
  const dishId = ref(null)
  const assistantOpen = ref(false)
  const seed = ref(null)
  const index = computed(() => buildIndex(categoriesOf(menu.value)))

  function openDish(categoryId, itemId) {
    cat.value = categoryId
    dishId.value = itemId
  }
  // "Ask the menu assistant" in the dish dialog.
  function askAbout(item) {
    seed.value = { q: item.name, n: (seed.value ? seed.value.n : 0) + 1 }
    assistantOpen.value = true
  }
  // Rows and actions inside the assistant.
  function onAssistantDish(id) {
    const entry = index.value.get(id)
    if (entry) cat.value = entry.category.id
    dishId.value = id
  }
  function onAssistantCategory(id) {
    cat.value = id
    scrollToTarget('menu', { focus: false })
  }

  return { menu, status, cat, dishId, assistantOpen, seed, openDish, askAbout, onAssistantDish, onAssistantCategory }
}
