import { onBeforeUnmount, onMounted, shallowRef } from 'vue'

/* Reactive media query. false during SSR, real value after mount. */
export function useMedia(query) {
  const match = shallowRef(false)
  let mq = null
  const on = () => {
    match.value = mq.matches
  }
  onMounted(() => {
    mq = window.matchMedia(query)
    on()
    mq.addEventListener('change', on)
  })
  onBeforeUnmount(() => {
    if (mq) mq.removeEventListener('change', on)
  })
  return match
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)')
