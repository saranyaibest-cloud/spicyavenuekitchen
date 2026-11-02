<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { answer } from '~/lib/engine'
import { SITE } from '~/data/site'
import { stampText } from '~/lib/format'
import { useMedia } from '~/composables/useMedia'
import { gsap, prefersReducedMotion } from '~/lib/gsap'

/* This assistant is a deterministic search over the live menu (app/lib/engine.js).
   It is not an AI model. Keep the header line below as it is. */
const DISCLAIMER = 'Answers come from the live menu. It is not an AI model, and it can’t take orders.'

const SUGGESTIONS = [
  'What’s on the menu?',
  'How much is Butter Chicken?',
  'Show me the tandoor',
  'Where is the restaurant?',
]
const TYPING_MS = 350
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

const props = defineProps({
  open: { type: Boolean, default: false },
  seed: { type: Object, default: null },
  menu: { type: Object, default: null },
})
const emit = defineEmits(['update:open', 'dish', 'category'])

const mobile = useMedia('(max-width: 899.98px)')
const messages = ref([])
const pending = ref(0)
const value = ref('')
const fab = ref(null)
const panel = ref(null)
const input = ref(null)
const log = ref(null)
let timers = []
let lastSeed = null

const ready = computed(() => Boolean(props.menu && Array.isArray(props.menu.categories) && props.menu.categories.length))
const typing = computed(() => pending.value > 0)
const setOpen = (v) => emit('update:open', v)

/* ---- send: answer(q, menu, SITE) → user + bot messages ---- */
function send(q) {
  const text = String(q || '').trim()
  if (!text || !ready.value) return
  const reply = answer(text, props.menu, SITE)
  messages.value = [...messages.value, { role: 'user', text }]
  if (prefersReducedMotion()) {
    messages.value = [...messages.value, { role: 'bot', ...reply }]
    return
  }
  // Short typing beat (350ms), never a long fake delay.
  pending.value += 1
  const id = setTimeout(() => {
    messages.value = [...messages.value, { role: 'bot', ...reply }]
    pending.value = Math.max(0, pending.value - 1)
    timers = timers.filter((t) => t !== id)
  }, TYPING_MS)
  timers.push(id)
}
function submit() {
  send(value.value)
  value.value = ''
}

/* ---- seed {q, n}: automatic question (e.g. from the dish dialog) ---- */
watch(
  () => [props.seed, ready.value],
  () => {
    const s = props.seed
    if (!s || !s.q || s.n === lastSeed || !ready.value) return
    lastSeed = s.n
    if (!props.open) setOpen(true)
    send(s.q)
  },
)

/* ---- open/close: focus, Escape, Tab trap (mobile), scroll lock (mobile) ---- */
let prevOverflow = ''
function onKey(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    setOpen(false)
    return
  }
  if (e.key !== 'Tab' || !mobile.value || !panel.value) return
  const list = Array.from(panel.value.querySelectorAll(FOCUSABLE))
  if (!list.length) return
  const first = list[0]
  const last = list[list.length - 1]
  if (!list.includes(document.activeElement)) {
    e.preventDefault()
    first.focus()
  } else if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}
watch(
  () => props.open,
  async (open, was) => {
    if (open) {
      document.addEventListener('keydown', onKey)
      if (mobile.value) {
        prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
      }
      await nextTick()
      requestAnimationFrame(() => {
        if (input.value && !input.value.disabled) input.value.focus({ preventScroll: true })
        else if (panel.value) panel.value.focus({ preventScroll: true })
      })
    } else {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      if (was && fab.value) fab.value.focus({ preventScroll: true })
    }
  },
)
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  timers.forEach(clearTimeout)
})

/* ---- the log follows new messages ---- */
watch([() => messages.value.length, pending, () => props.open], async () => {
  await nextTick()
  const l = log.value
  if (l) l.scrollTo({ top: l.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
})

/* ---- GSAP enter/leave: card scales up from the button on desktop,
   sheet slides up on phones; instant for reduced motion ---- */
function enterPanel(el, done) {
  if (prefersReducedMotion()) return done()
  const from = mobile.value ? { yPercent: 100 } : { opacity: 0, scale: 0.96, y: 12 }
  gsap.fromTo(el, from, { opacity: 1, scale: 1, y: 0, yPercent: 0, duration: mobile.value ? 0.42 : 0.32, ease: 'power3.out', onComplete: done })
}
function leavePanel(el, done) {
  if (prefersReducedMotion()) return done()
  const to = mobile.value ? { yPercent: 100, y: 0 } : { opacity: 0, scale: 0.96, y: 12 }
  gsap.to(el, { ...to, duration: 0.2, ease: 'power2.in', onComplete: done })
}
function enterMsg(el, done) {
  if (prefersReducedMotion()) return done()
  gsap.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.24, onComplete: done })
}

/* ---- mobile: drag the header down to close ---- */
let drag = null
function onDragStart(e) {
  if (!mobile.value || prefersReducedMotion() || !panel.value) return
  if (e.target instanceof Element && e.target.closest('button')) return
  drag = { y: e.clientY, t: performance.now(), id: e.pointerId }
  e.currentTarget.setPointerCapture(e.pointerId)
}
function onDragMove(e) {
  if (!drag || e.pointerId !== drag.id) return
  gsap.set(panel.value, { y: Math.max(0, e.clientY - drag.y) })
}
function onDragEnd(e) {
  if (!drag || e.pointerId !== drag.id) return
  const dy = Math.max(0, e.clientY - drag.y)
  const v = dy / Math.max(1, performance.now() - drag.t)
  drag = null
  if (dy > 90 || v > 0.5) setOpen(false)
  else gsap.to(panel.value, { y: 0, duration: 0.3, ease: 'power3.out' })
}

function onRow(row) {
  if (row.category) emit('category', row.id)
  else emit('dish', row.id)
}
function onAction(a) {
  if (a.type === 'category') emit('category', a.id)
  else if (a.type === 'dish') emit('dish', a.id)
}

const asked = computed(() => new Set(messages.value.filter((m) => m.role === 'user').map((m) => m.text)))
const another = computed(() => SUGGESTIONS.filter((s) => !asked.value.has(s)).slice(0, 2))
const showAnother = computed(() => {
  const last = messages.value[messages.value.length - 1]
  return messages.value.length > 0 && !typing.value && last && last.role === 'bot' && another.value.length > 0
})
const stamp = computed(() => (props.menu ? stampText(props.menu.meta) : ''))

const CHIP =
  'inline-flex min-h-11 items-center rounded-sm border border-ink/45 bg-transparent px-3.5 text-sm font-semibold text-ink transition-colors duration-150 hover:not-disabled:border-ink hover:not-disabled:bg-ink hover:not-disabled:text-cream disabled:opacity-50'
</script>

<template>
  <button
    ref="fab"
    type="button"
    :aria-expanded="open"
    aria-controls="assistant-panel"
    :class="[
      'asst-fab group fixed right-[max(16px,env(safe-area-inset-right,0px))] bottom-[var(--bottom-offset)] z-[56] inline-flex h-[var(--fab-h)] items-center gap-2.5 rounded-sm border border-silver/25 bg-slate pr-[18px] pl-4 text-[0.9375rem] font-bold text-cream shadow-[0_12px_28px_-14px_rgb(19_23_28/0.7)] transition-colors hover:bg-slate-2 max-nav:pr-3.5 max-nav:pl-3 max-nav:text-sm',
      open && 'max-nav:invisible',
    ]"
    @click="setOpen(!open)"
  >
    <span aria-hidden="true" class="relative flex size-2">
      <span class="absolute inset-0 rounded-full bg-chili opacity-60 motion-safe:animate-ping motion-safe:[animation-duration:2.4s]" />
      <span class="relative size-2 rounded-full bg-chili" />
    </span>
    Ask about the menu
  </button>

  <Transition enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-200" enter-from-class="opacity-0" leave-to-class="opacity-0">
    <div v-if="open && mobile" aria-hidden="true" class="fixed inset-0 z-[65] bg-slate/50" @click="setOpen(false)" />
  </Transition>

  <Transition :css="false" @enter="enterPanel" @leave="leavePanel">
    <div
      v-if="open"
      id="assistant-panel"
      ref="panel"
      role="dialog"
      :aria-modal="mobile ? 'true' : undefined"
      aria-label="Menu assistant"
      tabindex="-1"
      class="asst-panel fixed right-[max(16px,env(safe-area-inset-right,0px))] bottom-[calc(var(--bottom-offset)+var(--fab-h)+12px)] z-[66] flex h-[min(600px,calc(100svh-var(--bottom-offset)-var(--fab-h)-var(--nav-h)-40px))] w-[380px] max-w-[calc(100vw-32px)] origin-bottom-right flex-col rounded-sm border border-border bg-cream font-sans text-ink shadow-[0_30px_70px_-30px_rgb(19_23_28/0.65)] outline-none max-nav:inset-x-0 max-nav:bottom-0 max-nav:h-[70svh] max-nav:w-full max-nav:max-w-none max-nav:origin-bottom max-nav:rounded-b-none max-nav:border-0 max-nav:pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div
        class="relative flex items-start gap-3 rounded-t-sm bg-slate py-3.5 pr-2 pl-4 text-cream max-nav:cursor-grab max-nav:touch-none max-nav:pt-5"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
      >
        <span aria-hidden="true" class="absolute top-[7px] left-1/2 hidden h-1 w-10 -translate-x-1/2 rounded-sm bg-silver/60 max-nav:block" />
        <div class="min-w-0 flex-1">
          <h2 class="mb-1 font-display text-[1.0625rem]">Menu assistant</h2>
          <p class="asst-note text-[0.8125rem] leading-snug text-silver">{{ DISCLAIMER }}</p>
        </div>
        <button
          type="button"
          aria-label="Close menu assistant"
          class="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-cream transition-colors hover:bg-cream/10"
          @click="setOpen(false)"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" />
          </svg>
        </button>
      </div>

      <div ref="log" role="log" aria-live="polite" aria-relevant="additions" class="asst-log flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto overscroll-contain p-4">
        <div v-if="messages.length === 0">
          <p class="mb-2.5 text-[0.9375rem] text-[#3a3c3b]">{{ ready ? 'Ask about a dish, a price or a section of the menu.' : 'Menu is still loading.' }}</p>
          <div class="flex flex-wrap gap-2">
            <button v-for="s in SUGGESTIONS" :key="s" type="button" :class="CHIP" :disabled="!ready" @click="send(s)">{{ s }}</button>
          </div>
        </div>

        <TransitionGroup :css="false" @enter="enterMsg">
          <div
            v-for="(m, i) in messages"
            :key="i"
            :class="m.role === 'user' ? 'max-w-[85%] self-end rounded-sm bg-ink px-3 py-2 text-cream' : 'self-stretch text-ink'"
          >
            <p class="text-[0.9375rem] leading-normal [overflow-wrap:anywhere]">{{ m.text }}</p>
            <template v-if="m.role === 'bot'">
              <ul v-if="m.list && m.list.length" class="mt-2 border-t border-ink/12">
                <li v-for="(row, k) in m.list" :key="`${row.id}-${k}`">
                  <button
                    type="button"
                    class="asst-row group relative flex min-h-11 w-full items-baseline justify-between gap-3 border-b border-ink/12 py-2.5 pr-2.5 pl-3 text-left text-[0.9375rem] transition-colors duration-150 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-chili before:opacity-0 before:transition-opacity hover:bg-cream-2 hover:before:opacity-100 focus-visible:bg-cream-2 focus-visible:outline-offset-[-2px] focus-visible:before:opacity-100"
                    @click="onRow(row)"
                  >
                    <span class="min-w-0 font-semibold">
                      {{ row.name }}
                      <span v-if="row.cat" class="block text-[0.8125rem] font-normal text-muted">{{ row.cat }}</span>
                    </span>
                    <span class="shrink-0 font-bold whitespace-nowrap tabular-nums">{{ row.price }}</span>
                  </button>
                </li>
              </ul>
              <div v-if="m.actions && m.actions.length" class="mt-2.5 flex flex-wrap gap-2">
                <template v-for="(a, k) in m.actions" :key="k">
                  <a v-if="a.type === 'link'" :href="a.href" target="_blank" rel="noopener noreferrer" :class="[CHIP, 'border-ink']">
                    {{ a.label }}<span class="sr-only"> (opens in a new tab)</span>
                  </a>
                  <button v-else type="button" :class="[CHIP, 'border-ink']" @click="onAction(a)">{{ a.label }}</button>
                </template>
              </div>
            </template>
          </div>
        </TransitionGroup>

        <div v-if="typing" aria-hidden="true" class="inline-flex gap-[5px] self-start px-0.5 py-2.5">
          <span v-for="d in 3" :key="d" class="size-[7px] animate-dot rounded-full bg-ink" :style="{ animationDelay: `${(d - 1) * 120}ms` }" />
        </div>

        <div v-if="showAnother" class="flex flex-wrap items-center gap-2 border-t border-dashed border-ink/18 pt-1">
          <span class="w-full pt-2 text-xs font-bold text-muted">Ask another</span>
          <button v-for="s in another" :key="s" type="button" :class="[CHIP, 'border-ink/25 text-[#333634]']" @click="send(s)">{{ s }}</button>
        </div>
      </div>

      <form class="flex gap-2 border-t border-ink/12 px-3 pt-3 pb-1.5" @submit.prevent="submit">
        <label for="assistant-input" class="sr-only">Ask about the menu</label>
        <input
          id="assistant-input"
          ref="input"
          v-model="value"
          type="text"
          autocomplete="off"
          enterkeyhint="send"
          :placeholder="ready ? 'e.g. How much is the masala dosa?' : 'Menu is still loading'"
          :disabled="!ready"
          class="min-h-[46px] min-w-0 flex-1 rounded-sm border border-input bg-white px-3 text-base text-ink placeholder:text-[#6a6c6b] disabled:bg-cream-2"
        >
        <button
          type="submit"
          :disabled="!ready || !value.trim()"
          class="min-h-[46px] min-w-16 rounded-sm bg-chili px-4 font-bold text-cream transition-colors hover:bg-chili-deep disabled:bg-[#b9a7a2] disabled:text-ink"
        >Ask</button>
      </form>
      <div class="flex justify-between gap-3 px-3 pb-2.5 text-xs text-muted">
        <span class="[@media(hover:none)]:hidden">Press Enter to send</span>
        <span v-if="stamp">{{ stamp }}</span>
      </div>
    </div>
  </Transition>
</template>
