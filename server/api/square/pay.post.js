import { createError, readBody } from 'h3'
import { squareConfig, squareRequest, readCheckoutToken, guardSquareRate } from '../../utils/square.js'

export default defineEventHandler(async (event) => {
  guardSquareRate(event, 'pay')
  const config = squareConfig(event)
  const body = await readBody(event)
  const quote = readCheckoutToken(config, body && body.checkoutToken)
  const sourceId = String(body && body.sourceId || '')
  if (!sourceId || sourceId.length > 2048) throw createError({ statusCode: 400, statusMessage: 'Square did not return a valid payment token.' })

  const orderResponse = await squareRequest(config, `orders/${encodeURIComponent(quote.orderId)}`)
  const order = orderResponse.order
  if (!order || order.location_id !== config.locationId || order.state !== 'OPEN') {
    throw createError({ statusCode: 409, statusMessage: 'This order is no longer available. Please review your cart again.' })
  }
  if (!order.total_money || order.total_money.amount !== quote.amountCents || order.total_money.currency !== quote.currency) {
    throw createError({ statusCode: 409, statusMessage: 'The cart total changed. Please review the updated amount.' })
  }

  const result = await squareRequest(config, 'payments', {
    method: 'POST',
    body: {
      idempotency_key: quote.paymentIdempotencyKey,
      source_id: sourceId,
      amount_money: { amount: order.total_money.amount, currency: order.total_money.currency },
      location_id: config.locationId,
      order_id: order.id,
      autocomplete: true,
    },
  })
  const payment = result.payment
  if (!payment || !payment.id) throw createError({ statusCode: 502, statusMessage: 'Square did not confirm the payment.' })
  return { paymentId: payment.id, status: payment.status, receiptUrl: payment.receipt_url || null }
})