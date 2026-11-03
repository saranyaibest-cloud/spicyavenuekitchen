import { computed, onMounted, watch } from 'vue'
import { addCartItem, cartSummary, setCartQuantity } from '~/lib/cart'

const STORAGE_KEY = 'spicy-avenue-kitchen-cart-v1'

export function useCart() {
  const items = useState('shopping-cart-items', () => [])
  const hydrated = useState('shopping-cart-hydrated', () => false)
  const summary = computed(() => cartSummary(items.value))

  onMounted(() => {
    if (hydrated.value) return
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (Array.isArray(saved)) items.value = saved
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    hydrated.value = true
  })

  watch(items, (value) => {
    if (!import.meta.client || !hydrated.value) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  }, { deep: true })

  function add(item) {
    items.value = addCartItem(items.value, item)
  }
  function setQuantity(id, quantity) {
    items.value = setCartQuantity(items.value, id, quantity)
  }
  function clear() {
    items.value = []
  }

  return {
    items,
    count: computed(() => summary.value.count),
    subtotalCents: computed(() => summary.value.subtotalCents),
    add,
    setQuantity,
    clear,
  }
}