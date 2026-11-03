import { createError, getHeader, setResponseHeader } from 'h3'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { useRuntimeConfig } from '#imports'
import { clientIp, rateLimit } from '#shared/qr/rate-limit.js'

export function squareConfig(event) {
  const runtime = useRuntimeConfig(event)
  const locationId = runtime.squareLocationId || runtime.public.squareLocationId
  if (!runtime.squareAccessToken || !locationId) {
    throw createError({ statusCode: 503, statusMessage: 'Square ordering is not configured.' })
  }
  const environment = runtime.public.squareEnvironment === 'production' ? 'production' : 'sandbox'
  const feeValue = runtime.squareDeliveryFeeCents === '' ? null : Number(runtime.squareDeliveryFeeCents)
  return {
    accessToken: runtime.squareAccessToken,
    locationId,
    environment,
    baseUrl: environment === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com',
    pickupPrepTime: runtime.squarePickupPrepTime || 'PT30M',
    deliveryBeta: runtime.squareDeliveryBeta === true || runtime.squareDeliveryBeta === 'true',
    deliveryZips: String(runtime.squareDeliveryZips || '').split(',').map((zip) => zip.trim()).filter(Boolean),
    deliveryFeeCents: Number.isInteger(feeValue) && feeValue >= 0 ? feeValue : null,
  }
}

export function guardSquareRate(event, operation, limit = 12) {
  const ip = clientIp((name) => getHeader(event, name))
  const result = rateLimit(`square:${operation}:${ip}`, limit, 60_000)
  if (!result.ok) {
    setResponseHeader(event, 'Retry-After', String(Math.ceil(result.retryAfterMs / 1000)))
    throw createError({ statusCode: 429, statusMessage: 'Too many checkout attempts. Please wait a minute and try again.' })
  }
}

export async function squareRequest(config, path, options = {}) {
  try {
    return await $fetch(`${config.baseUrl}/v2/${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Square-Version': '2026-09-16',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  } catch (error) {
    const errors = error && error.data && Array.isArray(error.data.errors) ? error.data.errors : []
    throw createError({
      statusCode: error && error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 502,
      statusMessage: errors[0] && errors[0].detail ? errors[0].detail : 'Square could not complete the request.',
      data: { squareErrors: errors.map(({ code, category, detail }) => ({ code, category, detail })) },
    })
  }
}

export async function listSquareCatalog(config) {
  const objects = []
  let cursor = ''
  do {
    const query = new URLSearchParams({ types: 'ITEM', ...(cursor ? { cursor } : {}) })
    const page = await squareRequest(config, `catalog/list?${query}`)
    objects.push(...(page.objects || []))
    cursor = page.cursor || ''
  } while (cursor)

  return objects.flatMap((object) => {
    const data = object.item_data
    if (object.type !== 'ITEM' || object.is_deleted || !data || !Array.isArray(data.variations)) return []
    if (object.present_at_all_locations === false && !(object.present_at_location_ids || []).includes(config.locationId)) return []
    const variations = data.variations.flatMap((variation) => {
      const variationData = variation.item_variation_data
      const money = variationData && variationData.price_money
      if (variation.type !== 'ITEM_VARIATION' || variation.is_deleted || !variationData || !money || money.currency !== 'USD' || !Number.isInteger(money.amount)) return []
      if (variation.present_at_all_locations === false && !(variation.present_at_location_ids || []).includes(config.locationId)) return []
      return [{ id: variation.id, name: variationData.name || '', priceCents: money.amount }]
    })
    return variations.length ? [{ id: object.id, name: data.name || '', variations }] : []
  })
}

export async function retrieveSquareVariations(config, ids) {
  const response = await squareRequest(config, 'catalog/batch-retrieve', {
    method: 'POST',
    body: { object_ids: ids, include_related_objects: true },
  })
  const objects = [...(response.objects || []), ...(response.related_objects || [])]
  const byId = new Map(objects.map((object) => [object.id, object]))
  return ids.map((id) => {
    const variation = byId.get(id)
    const data = variation && variation.item_variation_data
    const parent = data && byId.get(data.item_id)
    const money = data && data.price_money
    if (!variation || variation.type !== 'ITEM_VARIATION' || variation.is_deleted || !parent || parent.type !== 'ITEM' || parent.is_deleted || !money || money.currency !== 'USD' || !Number.isInteger(money.amount) || money.amount <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'A cart item is no longer available at the selected Square location.' })
    }
    if (variation.present_at_all_locations === false && !(variation.present_at_location_ids || []).includes(config.locationId)) {
      throw createError({ statusCode: 400, statusMessage: 'A cart item is not available at this restaurant.' })
    }
    return { id, name: parent.item_data && parent.item_data.name || '', priceCents: money.amount }
  })
}

export function validateBuyer(buyer) {
  const name = String(buyer && buyer.name || '').trim().slice(0, 100)
  const email = String(buyer && buyer.email || '').trim().slice(0, 254)
  const phone = String(buyer && buyer.phone || '').trim().slice(0, 24)
  const digits = phone.replace(/\D/g, '')
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || digits.length < 9 || digits.length > 16) {
    throw createError({ statusCode: 400, statusMessage: 'Enter your name, a valid email address, and phone number.' })
  }
  return { name, email, phone: `+${digits.length === 10 ? `1${digits}` : digits}` }
}

export function createCheckoutToken(config, payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', config.accessToken).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

export function readCheckoutToken(config, token) {
  const [encoded, signature] = String(token || '').split('.')
  if (!encoded || !signature) throw createError({ statusCode: 400, statusMessage: 'Checkout session is invalid.' })
  const expected = createHmac('sha256', config.accessToken).update(encoded).digest()
  let actual
  try { actual = Buffer.from(signature, 'base64url') } catch { actual = Buffer.alloc(0) }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw createError({ statusCode: 400, statusMessage: 'Checkout session is invalid.' })
  }
  let payload
  try { payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) } catch {
    throw createError({ statusCode: 400, statusMessage: 'Checkout session is invalid.' })
  }
  if (!payload.orderId || payload.expiresAt < Date.now() || payload.locationId !== config.locationId) {
    throw createError({ statusCode: 410, statusMessage: 'Checkout session expired. Please review your cart again.' })
  }
  return payload
}