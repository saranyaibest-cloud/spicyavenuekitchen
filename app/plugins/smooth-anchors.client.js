import { defineNuxtPlugin } from '#imports'
import { ensureGsap, scrollToTarget } from '~/lib/gsap'

/* Smooth in-page navigation with GSAP ScrollToPlugin.
   Every <a href="#id"> on the page glides to its section (offset by the fixed
   header), updates the URL and moves focus to the section. Instant for
   prefers-reduced-motion. Wheel and touch scrolling are left native on purpose:
   scroll-jacking would break the sticky menu bar, browser find and assistive tech. */
export default defineNuxtPlugin(() => {
  ensureGsap()

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null
    if (!a) return
    const id = decodeURIComponent(a.getAttribute('href').slice(1))
    if (id === 'main') return // skip link: native jump + focus is right here
    const el = id ? document.getElementById(id) : null
    if (!el) return
    e.preventDefault()
    if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`)
    scrollToTarget(el)
  })
})
