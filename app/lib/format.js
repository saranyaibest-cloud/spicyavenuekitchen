/* Small shared helpers (no Vue, so Node tests can import them). */

export const isPrice = (p) => typeof p === 'number' && Number.isFinite(p) && p > 0
export const money = (p) => `$${p.toFixed(2)}`

/* "Prices updated Oct 30, 2026" from menu.meta.updated (ISO date). Empty when unknown. */
export function stampText(meta) {
  if (!meta || !meta.updated) return ''
  const d = new Date(meta.updated)
  if (Number.isNaN(d.getTime())) return ''
  return `Prices updated ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`
}

/* Number of dishes in a category. */
export function count(category) {
  if (!category || !Array.isArray(category.sections)) return 0
  return category.sections.reduce((n, s) => n + (Array.isArray(s.items) ? s.items.length : 0), 0)
}

/* "Chicken, goat & seafood" → "chicken-goat-seafood" */
export function slug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
