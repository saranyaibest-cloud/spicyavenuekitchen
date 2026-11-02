import { onBeforeUnmount, onMounted, unref } from 'vue'
import { ensureGsap, gsap, MOTION, REDUCE } from '~/lib/gsap'

/* Runs `setup({ motion, reduce }, scopeEl)` after mount inside a gsap.context
   scoped to `scope` (a template ref), under gsap.matchMedia so it re-runs when
   the reduced-motion setting (or any extra query in `queries`, e.g.
   { desktop: '(min-width: 900px)' }) changes. Everything it creates is reverted on
   unmount. Returns `{ add }` to create animations later (e.g. on click) in the
   same context. */
export function useGsap(scope, setup, queries = {}) {
  let ctx = null

  onMounted(() => {
    ensureGsap()
    const el = unref(scope)
    ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add({ motion: MOTION, reduce: REDUCE, ...queries }, (c) => setup(c.conditions, el))
    }, el || undefined)
  })

  onBeforeUnmount(() => {
    if (ctx) ctx.revert()
    ctx = null
  })

  return {
    add(fn) {
      if (ctx) return ctx.add(fn)
      return fn()
    },
  }
}
