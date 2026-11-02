/* Pure helpers for the Favourites carousel (no React, so Node can test them). */

const isPrice = (p) => typeof p === 'number' && Number.isFinite(p) && p > 0;
const money = (p) => `$${p.toFixed(2)}`;

/* Resolve dish NAMES to { item, category } by case-insensitive name match.
   Unknown names are skipped; duplicates are kept once; FEATURED order is kept. */
export function resolveFeatured(menu, names) {
  const index = new Map();
  const categories = menu && Array.isArray(menu.categories) ? menu.categories : [];
  for (const category of categories) {
    for (const section of (category && category.sections) || []) {
      for (const item of (section && section.items) || []) {
        const key = String((item && item.name) || '').trim().toLowerCase();
        if (key && !index.has(key)) index.set(key, { item, category });
      }
    }
  }

  const out = [];
  const seen = new Set();
  for (const name of Array.isArray(names) ? names : []) {
    const hit = index.get(String(name || '').trim().toLowerCase());
    if (hit && !seen.has(hit.item.id)) {
      seen.add(hit.item.id);
      out.push(hit);
    }
  }
  return out;
}

/* Only real, positive prices survive: null, 0, NaN and strings become "no price",
   so <Price /> shows its dash instead of $0. */
export function cleanPrice(item) {
  const variants = Array.isArray(item && item.variants)
    ? item.variants.filter((v) => v && isPrice(v.price))
    : [];
  return { price: isPrice(item && item.price) ? item.price : null, variants };
}

/* Spoken price for the card's accessible name. */
export function priceLabel(item) {
  const { price, variants } = cleanPrice(item);
  if (price !== null) return money(price);
  if (variants.length) return `from ${money(Math.min(...variants.map((v) => v.price)))}`;
  return 'price not listed';
}

export function dietLabel(diet) {
  if (diet === 'veg') return 'Vegetarian';
  if (diet === 'nonveg') return 'Non-vegetarian';
  return null; // never inferred
}
