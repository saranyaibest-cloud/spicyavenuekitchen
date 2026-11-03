const validPrice = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0

export function cartPrice(item) {
  if (validPrice(item && item.price)) return item.price
  const variants = Array.isArray(item && item.variants) ? item.variants : []
  return variants.length === 1 && validPrice(variants[0].price) ? variants[0].price : null
}

export function addCartItem(items, item) {
  const price = cartPrice(item)
  if (!item || !item.id || price === null) return items

  const variation = item.squareVariations && item.squareVariations.length === 1
    ? item.squareVariations[0]
    : null
  const variationId = item.squareVariationId || (variation && variation.id) || null
  const existing = items.find((line) => line.id === item.id && line.variationId === variationId)

  if (existing) {
    return items.map((line) => (
      line === existing ? { ...line, quantity: Math.min(20, line.quantity + 1) } : line
    ))
  }

  return [...items, {
    id: item.id,
    name: item.name,
    price,
    quantity: 1,
    variationId,
    photo: item.photo || null,
  }]
}

export function setCartQuantity(items, id, quantity) {
  const next = Math.trunc(Number(quantity))
  if (!Number.isFinite(next)) return items
  if (next <= 0) return items.filter((line) => line.id !== id)
  return items.map((line) => (line.id === id ? { ...line, quantity: Math.min(20, next) } : line))
}

export function cartSummary(items) {
  return items.reduce((summary, line) => {
    const quantity = Math.max(0, Math.trunc(Number(line.quantity) || 0))
    const unitCents = validPrice(line.price) ? Math.round(line.price * 100) : 0
    summary.count += quantity
    summary.subtotalCents += unitCents * quantity
    return summary
  }, { count: 0, subtotalCents: 0 })
}