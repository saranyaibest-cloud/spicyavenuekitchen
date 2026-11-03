<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRuntimeConfig } from '#imports'
import { useCart } from '~/composables/useCart'
import { useSquareCatalog } from '~/composables/useSquareCatalog'
import { money } from '~/lib/format'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '~/components/ui/sheet'

const config = useRuntimeConfig().public
const cart = useCart()
const squareCatalog = useSquareCatalog()
const open = ref(false)
const buyer = ref({ name: '', email: '', phone: '' })
const fulfillment = ref('pickup')
const address = ref({ line1: '', city: '', postalCode: '' })
const busy = ref(false)
const message = ref('')
const checkoutQuote = ref(null)
const payment = ref(null)
const squareCard = ref(null)
const cardError = ref('')
const total = computed(() => money(cart.subtotalCents.value / 100))
const catalogReady = computed(() => squareCatalog.data.value && squareCatalog.data.value.enabled === true)
const sdkReady = computed(() => Boolean(config.squareApplicationId && config.squareLocationId))
const allItemsMapped = computed(() => cart.items.value.length > 0 && cart.items.value.every((line) => line.variationId))
const deliveryEnabled = computed(() => squareCatalog.data.value && squareCatalog.data.value.deliveryEnabled === true)
const canQuote = computed(() => catalogReady.value && sdkReady.value && allItemsMapped.value && !busy.value)
const sdkUrl = computed(() => config.squareEnvironment === 'production'
  ? 'https://web.squarecdn.com/v1/square.js'
  : 'https://sandbox.web.squarecdn.com/v1/square.js')

let sdkPromise = null

function setQuantity(id, quantity) {
  cart.setQuantity(id, quantity)
}
function loadSquareSdk() {
  if (window.Square) return Promise.resolve()
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = sdkUrl.value
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Square payment form could not be loaded.'))
    document.head.appendChild(script)
  })
  return sdkPromise
}

async function attachCard() {
  await loadSquareSdk()
  await nextTick()
  if (squareCard.value) return
  const payments = window.Square.payments(config.squareApplicationId, config.squareLocationId)
  squareCard.value = await payments.card()
  await squareCard.value.attach('#square-card-container')
}

async function requestQuote(event) {
  event.preventDefault()
  if (!canQuote.value) return
  message.value = ''
  cardError.value = ''
  busy.value = true
  try {
    const result = await $fetch('/api/square/quote', {
      method: 'POST',
      body: {
        items: cart.items.value.map(({ variationId, quantity }) => ({ variationId, quantity })),
        buyer: buyer.value,
        fulfillment: { type: fulfillment.value, address: address.value },
      },
    })
    checkoutQuote.value = result
    await attachCard()
  } catch (error) {
    checkoutQuote.value = null
    message.value = error.data?.statusMessage || error.message || 'Could not prepare your order.'
  } finally {
    busy.value = false
  }
}

function billingContact() {
  const parts = buyer.value.name.trim().split(/\s+/)
  const contact = {
    givenName: parts[0] || '',
    familyName: parts.slice(1).join(' '),
    email: buyer.value.email,
    phone: buyer.value.phone,
    countryCode: 'US',
  }
  if (fulfillment.value === 'delivery') {
    contact.addressLines = [address.value.line1]
    contact.city = address.value.city
    contact.state = 'TX'
    contact.postalCode = address.value.postalCode
  }
  return contact
}

async function pay() {
  if (!checkoutQuote.value || !squareCard.value || busy.value) return
  busy.value = true
  cardError.value = ''
  message.value = ''
  try {
    const token = await squareCard.value.tokenize({
      amount: (checkoutQuote.value.amountCents / 100).toFixed(2),
      currencyCode: checkoutQuote.value.currency,
      intent: 'CHARGE',
      customerInitiated: true,
      sellerKeyedIn: false,
      billingContact: billingContact(),
    })
    if (token.status !== 'OK') throw new Error('Card verification did not complete. Please check the card details and retry.')
    const result = await $fetch('/api/square/pay', {
      method: 'POST',
      body: { checkoutToken: checkoutQuote.value.checkoutToken, sourceId: token.token },
    })
    payment.value = result
    cart.clear()
    checkoutQuote.value = null
    await destroyCard()
  } catch (error) {
    message.value = error.data?.statusMessage || error.message || 'Payment was not completed. Review the cart and try again.'
    checkoutQuote.value = null
    await destroyCard()
  } finally {
    busy.value = false
  }
}

async function destroyCard() {
  const card = squareCard.value
  squareCard.value = null
  if (card && typeof card.destroy === 'function') {
    try { await card.destroy() } catch { /* The SDK can already be detached when the drawer closes. */ }
  }
}

watch(open, async (value) => {
  if (value) return
  checkoutQuote.value = null
  cardError.value = ''
  await destroyCard()
})
onBeforeUnmount(() => { destroyCard() })
</script>

<template>
  <Sheet v-model:open="open">
    <SheetTrigger as-child>
      <button
        type="button"
        :aria-label="`Open cart, ${cart.count.value} ${cart.count.value === 1 ? 'item' : 'items'}`"
        class="relative inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-sm border border-current/25 px-2.5 text-[0.9375rem] font-semibold transition-colors hover:bg-current/5"
      >
        <svg viewBox="0 0 20 20" width="19" height="19" aria-hidden="true" focusable="false">
          <path d="M2.5 3.5h2l1.8 9.1a1.5 1.5 0 0 0 1.5 1.2h7.4a1.5 1.5 0 0 0 1.5-1.2l1.1-5.8H5.2M8 17h.1M15 17h.1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" />
        </svg>
        <span class="max-nav:sr-only">Cart</span>
        <span v-if="cart.count.value" class="inline-flex min-w-5 items-center justify-center rounded-full bg-chili px-1 text-[0.6875rem] font-bold leading-5 text-cream">{{ cart.count.value }}</span>
      </button>
    </SheetTrigger>
    <SheetContent side="right" aria-describedby="cart-description" class="max-w-none gap-0 bg-cream text-ink sm:max-w-[28rem]">
      <header class="flex items-start justify-between gap-4 border-b border-border px-5 py-5">
        <div>
          <SheetTitle class="font-display text-[1.75rem]">Your order</SheetTitle>
          <SheetDescription id="cart-description" class="mt-1 text-sm text-muted">{{ cart.count.value }} {{ cart.count.value === 1 ? 'item' : 'items' }} in your cart</SheetDescription>
        </div>
        <SheetClose aria-label="Close cart" class="inline-flex size-10 items-center justify-center rounded-sm border border-border hover:bg-cream-2">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3.5 3.5l9 9m0-9l-9 9" fill="none" stroke="currentColor" stroke-width="1.6" /></svg>
        </SheetClose>
      </header>

      <div v-if="payment" class="grid flex-1 content-center gap-4 p-6 text-center">
        <span class="mx-auto grid size-14 place-items-center rounded-full bg-[#e2efe5] text-[#1b5e30]">
          <svg viewBox="0 0 20 20" width="24" height="24" aria-hidden="true"><path d="m4 10 4 4 8-8" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>
        </span>
        <h3 class="font-display text-[1.5rem]">Payment complete</h3>
        <p class="text-sm text-muted">Your payment is {{ payment.status?.toLowerCase() || 'complete' }}.</p>
        <a v-if="payment.receiptUrl" :href="payment.receiptUrl" target="_blank" rel="noopener noreferrer" class="text-sm font-bold text-chili underline underline-offset-4">View Square receipt</a>
        <SheetClose class="mx-auto mt-2 inline-flex h-11 items-center border border-ink/40 px-5 text-sm font-semibold">Done</SheetClose>
      </div>

      <template v-else>
        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p v-if="!catalogReady" class="mb-4 border-l-2 border-chili bg-white px-3 py-2.5 text-sm leading-relaxed text-muted">
            Preview cart only. Connect the Square Catalog to verify prices and enable payments; the bundled menu is a partial sample.
          </p>
          <p v-else-if="!allItemsMapped && cart.items.value.length" class="mb-4 border-l-2 border-chili bg-white px-3 py-2.5 text-sm leading-relaxed text-muted">
            Some dishes do not match an active Square item yet. Those items cannot be checked out.
          </p>

          <div v-if="!cart.items.value.length" class="grid min-h-48 place-items-center text-center">
            <div><p class="font-display text-[1.35rem]">Your cart is waiting.</p><p class="mt-1 text-sm text-muted">Add a dish from Favorites or the menu.</p></div>
          </div>
          <ul v-else class="divide-y divide-border">
            <li v-for="item in cart.items.value" :key="item.id" class="flex gap-3 py-4 first:pt-1">
              <img v-if="item.photo" :src="item.photo" alt="" class="size-[4.25rem] shrink-0 rounded-sm object-cover">
              <span v-else class="grid size-[4.25rem] shrink-0 place-items-center bg-slate-2 font-display text-cream">SAK</span>
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <p class="font-display text-[1.0625rem] leading-tight">{{ item.name }}</p>
                  <p class="shrink-0 text-sm font-semibold tabular-nums">{{ money(Math.round(item.price * 100) * item.quantity / 100) }}</p>
                </div>
                <p class="mt-1 text-xs text-muted">{{ money(item.price) }} each</p>
                <div class="mt-2 inline-flex h-8 items-center border border-ink/20 bg-white">
                  <button type="button" class="inline-flex size-8 items-center justify-center hover:bg-cream-2" :aria-label="`Remove one ${item.name}`" @click="setQuantity(item.id, item.quantity - 1)">−</button>
                  <span class="min-w-7 text-center text-xs font-semibold tabular-nums">{{ item.quantity }}</span>
                  <button type="button" class="inline-flex size-8 items-center justify-center hover:bg-cream-2 disabled:opacity-40" :aria-label="`Add one ${item.name}`" :disabled="item.quantity >= 20" @click="setQuantity(item.id, item.quantity + 1)">+</button>
                </div>
              </div>
            </li>
          </ul>

          <form v-if="cart.items.value.length && !checkoutQuote" class="mt-5 grid gap-3" @submit="requestQuote">
            <fieldset class="grid grid-cols-2 gap-2">
              <legend class="mb-2 text-sm font-semibold">Fulfillment</legend>
              <button type="button" :aria-pressed="fulfillment === 'pickup'" class="h-10 border px-3 text-sm font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-cream" @click="fulfillment = 'pickup'">Pickup</button>
              <button type="button" :aria-pressed="fulfillment === 'delivery'" :disabled="!deliveryEnabled" :title="deliveryEnabled ? 'Choose delivery' : 'Delivery requires Square beta access and restaurant service-area setup'" class="h-10 border px-3 text-sm font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-cream disabled:cursor-not-allowed disabled:opacity-45" @click="fulfillment = 'delivery'">Delivery</button>
            </fieldset>
            <label class="grid gap-1 text-sm font-semibold">Name<input v-model="buyer.name" autocomplete="name" required maxlength="100" class="h-11 border border-input bg-white px-3 font-normal"></label>
            <label class="grid gap-1 text-sm font-semibold">Email<input v-model="buyer.email" type="email" autocomplete="email" required maxlength="254" class="h-11 border border-input bg-white px-3 font-normal"></label>
            <label class="grid gap-1 text-sm font-semibold">Phone<input v-model="buyer.phone" type="tel" autocomplete="tel" required class="h-11 border border-input bg-white px-3 font-normal"></label>
            <template v-if="fulfillment === 'delivery'">
              <label class="grid gap-1 text-sm font-semibold">Street address<input v-model="address.line1" autocomplete="address-line1" required class="h-11 border border-input bg-white px-3 font-normal"></label>
              <label class="grid gap-1 text-sm font-semibold">City<input v-model="address.city" autocomplete="address-level2" required class="h-11 border border-input bg-white px-3 font-normal"></label>
              <label class="grid gap-1 text-sm font-semibold">ZIP code<input v-model="address.postalCode" autocomplete="postal-code" inputmode="numeric" required class="h-11 border border-input bg-white px-3 font-normal"></label>
            </template>
            <p v-if="message" role="alert" class="text-sm text-chili">{{ message }}</p>
            <button type="submit" :disabled="!canQuote" class="mt-1 inline-flex h-12 items-center justify-center gap-2 bg-chili px-5 text-sm font-bold text-cream hover:bg-chili-deep disabled:cursor-not-allowed disabled:opacity-45">
              {{ busy ? 'Preparing secure checkout…' : 'Continue to payment' }}<span aria-hidden="true">→</span>
            </button>
          </form>

          <div v-else-if="checkoutQuote" class="mt-5 grid gap-4">
            <div class="border-y border-border py-3">
              <p class="text-sm text-muted">Square-calculated total</p>
              <p class="font-display text-[1.75rem] tabular-nums">{{ money(checkoutQuote.amountCents / 100) }}</p>
              <p class="text-xs text-muted">Includes Square-calculated taxes and configured fees.</p>
            </div>
            <div id="square-card-container" class="min-h-12 rounded-sm border border-input bg-white p-3" />
            <p v-if="cardError" role="alert" class="text-sm text-chili">{{ cardError }}</p>
            <button type="button" :disabled="busy || !squareCard" class="inline-flex h-12 items-center justify-center bg-chili px-5 text-sm font-bold text-cream hover:bg-chili-deep disabled:cursor-not-allowed disabled:opacity-45" @click="pay">
              {{ busy ? 'Processing securely…' : `Pay ${money(checkoutQuote.amountCents / 100)}` }}
            </button>
            <button type="button" class="text-sm font-semibold text-muted underline underline-offset-4" @click="checkoutQuote = null; destroyCard()">Back to cart</button>
          </div>
        </div>

        <footer v-if="cart.items.value.length && !payment" class="border-t border-border bg-cream px-5 pt-4 pb-[calc(20px+env(safe-area-inset-bottom,0px))]">
          <div class="flex items-baseline justify-between gap-3">
            <span class="text-sm font-semibold">{{ catalogReady ? 'Cart subtotal' : 'Preview subtotal' }}</span>
            <span class="font-display text-[1.5rem] tabular-nums">{{ total }}</span>
          </div>
          <p class="mt-1 text-xs text-muted">Final tax and any configured fulfillment fee are calculated by Square.</p>
          <p v-if="!catalogReady" class="mt-2 text-xs font-semibold text-chili">Online payment is disabled until Square is configured.</p>
        </footer>
      </template>
    </SheetContent>
  </Sheet>
</template>