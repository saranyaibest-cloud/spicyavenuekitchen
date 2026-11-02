/* GSAP: the only animation engine on the site.
   - One easing ("brand", the same curve as --ease-brand in CSS) and three durations.
   - Plugins: ScrollTrigger (scroll-linked sections), ScrollToPlugin (smooth anchor
     jumps), SplitText (word reveals), CustomEase (the brand curve).
   - Everything is set up per component with gsap.context + gsap.matchMedia, so it
     is cleaned up on unmount and switched off for prefers-reduced-motion. */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'

export const DUR = { fast: 0.2, base: 0.32, slow: 0.6 }
export const REDUCE = '(prefers-reduced-motion: reduce)'
export const MOTION = '(prefers-reduced-motion: no-preference)'

let ready = false

export function ensureGsap() {
  if (ready || typeof window === 'undefined') return gsap
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText, CustomEase)
  CustomEase.create('brand', '0.22,0.61,0.36,1')
  gsap.defaults({ ease: 'brand', duration: DUR.base })
  ready = true
  return gsap
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia(REDUCE).matches
}

/* Smooth jump to an element (or y), offset by the fixed header.
   Instant for reduced motion. Moves focus to the target for keyboard users. */
export function scrollToTarget(target, { focus = true } = {}) {
  ensureGsap()
  const el = typeof target === 'string' ? document.getElementById(target.replace(/^#/, '')) : target
  if (!el && typeof target !== 'number') return
  const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64
  const done = () => {
    if (!focus || !el) return
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
  }
  if (prefersReducedMotion()) {
    const y = typeof target === 'number' ? target : el.getBoundingClientRect().top + window.scrollY - nav - 8
    window.scrollTo(0, Math.max(0, y))
    done()
    return
  }
  gsap.to(window, {
    duration: 0.9,
    ease: 'power3.inOut',
    overwrite: 'auto',
    scrollTo: typeof target === 'number' ? { y: target, autoKill: true } : { y: el, offsetY: nav + 8, autoKill: true },
    onComplete: done,
  })
}

export { gsap, ScrollTrigger, SplitText }
