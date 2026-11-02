import { onMounted, shallowRef } from 'vue'
import { useRuntimeConfig } from '#imports'
import SNAPSHOT from '~/data/menu.snapshot.json'

/* Loads the menu.
   - If VITE_MENU_URL (or NUXT_PUBLIC_MENU_URL) is set, fetches the live menu JSON
     from it in the browser; the page shows a skeleton until it arrives.
   - Otherwise, or if that request fails, uses app/data/menu.snapshot.json.
   Shape: { categories: [{ id, title, sections: [{ title, diet, items: [...] }] }], meta } */
export function useMenu() {
  const url = useRuntimeConfig().public.menuUrl || ''
  const menu = shallowRef(url ? null : SNAPSHOT)
  const status = shallowRef(url ? 'loading' : 'ready')

  onMounted(async () => {
    if (!url) return
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!r.ok) throw new Error(`Menu request failed: ${r.status}`)
      menu.value = await r.json()
    } catch (err) {
      console.warn('[menu] falling back to the bundled snapshot:', err)
      menu.value = SNAPSHOT
    }
    status.value = 'ready'
  })

  return { menu, status }
}
