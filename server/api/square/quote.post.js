import { createError, readBody } from 'h3'
import { randomUUID } from 'node:crypto'
import { squareConfig, squareRequest, retrieveSquareVariations, validateBuyer, createCheckoutToken, guardSquareRate } from '../../utils/square.js'

function requestedLines(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 30) {
    throw createError({ statusCode: 400, statusMessage: 'Your cart is empty or too large.' })
  }
  const quantities = new Map()
  for (const item of items) {
    const id = String(item && item.variationId || '')
    const quantity = Number(item && item.quantity)
    if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw createError({ statusCode: 400, statusMessage: 'A cart quantity is invalid.' })
    }
    quantities.set(id, Math.min(20, (quantities.get(id) || 0) + quantity))
  }
  if (quantities.size > 30) throw createError({ statusCode: 400, statusMessage: 'Your cart is too large.' })
  return [...quantities].map(([variationId, quantity]) => ({ variationId, quantity }))
}

function fulfillmentFor(config, value, buyer) {
  if (value && value.type === 'delivery') {
    if (!config.deliveryBeta || config.deliveryFeeCents === null || !config.deliveryZips.length) {
      throw createError({ statusCode: 403, statusMessage: 'Online delivery is not enabled for this location yet.' })
    }
    const address = value.address || {}
    const zip = String(address.postalCode || '').trim()
    if (!config.deliveryZips.includes(zip)) {
      throw createError({ statusCode: 400, statusMessage: 'Delivery is not available for that ZIP code.' })
    }
    const line1 = String(address.line1 || '').trim().slice(0, 100)
    const city = String(address.city || '').trim().slice(0, 50)
    if (!line1 || !city) throw createError({ statusCode: 400, statusMessage: 'Enter a delivery street address and city.' })
    return {
      type: 'DELIVERY',
      delivery_details: {
        schedule_type: 'ASAP',
        prep_time_duration: config.pickupPrepTime,
        recipient: {
          display_name: buyer.name,
          email_address: buyer.email,
          phone_number: buyer.phone,
          address: {
            address_line_1: line1,
            locality: city,
            administrative_district_level_1: 'TX',
            postal_code: zip,
            country: 'US',
          },
        },
      },
    }
  }
  if (!value || value.type !== 'pickup') throw createError({ statusCode: 400, statusMessage: 'Choose pickup or delivery.' })
  return {
    type: 'PICKUP',
    pickup_details: {
      schedule_type: 'ASAP',
      prep_time_duration: config.pickupPrepTime,
      recipient: { display_name: buyer.name, email_address: buyer.email, phone_number: buyer.phone },
    },
  }
}

export default defineEventHandler(async (event) => {
  guardSquareRate(event, 'quote')
  const config = squareConfig(event)
  const body = await readBody(event)
  const buyer = validateBuyer(body && body.buyer)
  const lines = requestedLines(body && body.items)
  const variations = await retrieveSquareVariations(config, lines.map((line) => line.variationId))
  const fulfillment = fulfillmentFor(config, body && body.fulfillment, buyer)
  const order = {
    location_id: config.locationId,
    reference_id: randomUUID().replace(/-/g, '').slice(0, 40),
    line_items: lines.map((line, index) => ({ catalog_object_id: variations[index].id, quantity: String(line.quantity) })),
    fulfillments: [fulfillment],
    pricing_options: { auto_apply_taxes: true },
  }
  if (fulfillment.type === 'DELIVERY' && config.deliveryFeeCents > 0) {
    order.service_charges = [{
      name: 'Delivery fee',
      calculation_phase: 'TOTAL_PHASE',
      amount_money: { amount: config.deliveryFeeCents, currency: 'USD' },
      taxable: false,
      scope: 'ORDER',
    }]
  }

  const result = await squareRequest(config, 'orders', {
    method: 'POST',
    body: { idempotency_key: randomUUID(), order },
  })
  const created = result.order
  if (!created || !created.id || !created.total_money || created.total_money.currency !== 'USD') {
    throw createError({ statusCode: 502, statusMessage: 'Square did not return a payable order total.' })
  }
  const payload = {
    orderId: created.id,
    locationId: config.locationId,
    amountCents: created.total_money.amount,
    currency: created.total_money.currency,
    paymentIdempotencyKey: randomUUID(),
    expiresAt: Date.now() + 10 * 60 * 1000,
  }

  return {
    checkoutToken: createCheckoutToken(config, payload),
    amountCents: payload.amountCents,
    currency: payload.currency,
    expiresAt: payload.expiresAt,
  }
})