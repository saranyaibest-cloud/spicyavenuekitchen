/* Pure menu logic (no React) so Node can test it: search, diet filter,
   grouping, tab keys, highlight splitting. Menu.jsx only renders these. */

export const DIETS = [
  ['all', 'All'],
  ['veg', 'Veg'],
  ['nonveg', 'Non-veg'],
];

/* Diet used for FILTERING: the item's own value, else its section's value
   (e.g. a "Vegetarian" section). Diet MARKS use item.diet only. */
export function dietOf(item, section) {
  if (item && item.diet) return item.diet;
  if (section && section.diet) return section.diet;
  return null;
}

export function categoriesOf(menu) {
  return menu && Array.isArray(menu.categories) ? menu.categories.filter((c) => c && c.id) : [];
}

export function buildIndex(categories) {
  const map = new Map();
  for (const category of categories) {
    for (const section of category.sections || []) {
      for (const item of section.items || []) {
        if (item && item.id != null) map.set(item.id, { item, section, category });
      }
    }
  }
  return map;
}

function matches(item, q) {
  if (!q) return true;
  return [item.name, item.note, item.description].some((t) => t && String(t).toLowerCase().includes(q));
}

/* With a query: search every category. Without: only the active category.
   Returns { groups: [{ category, section, items }], total, sections }. */
export function filterGroups({ categories, activeId, query, diet }) {
  const q = String(query || '').trim().toLowerCase();
  const pool = q ? categories : categories.filter((c) => c.id === activeId);
  const groups = [];
  let total = 0;
  for (const category of pool) {
    for (const section of category.sections || []) {
      const items = (section.items || []).filter(
        (item) => item && matches(item, q) && (diet === 'all' || dietOf(item, section) === diet)
      );
      if (items.length) {
        groups.push({ category, section, items });
        total += items.length;
      }
    }
  }
  return { groups, total, sections: groups.length };
}

/* Roving-tabindex keys for the category tabs. Returns the new index or null. */
export function nextTabIndex(key, index, length) {
  if (!length) return null;
  if (key === 'ArrowRight') return (index + 1) % length;
  if (key === 'ArrowLeft') return (index - 1 + length) % length;
  if (key === 'Home') return 0;
  if (key === 'End') return length - 1;
  return null;
}

/* Split text into [{ text, hit }] parts for search highlighting. */
export function splitHighlight(text, query) {
  const s = text == null ? '' : String(text);
  const q = String(query || '').trim();
  if (!q || !s) return [{ text: s, hit: false }];
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return s
    .split(new RegExp(`(${safe})`, 'gi'))
    .filter((part) => part !== '')
    .map((part) => ({ text: part, hit: part.toLowerCase() === q.toLowerCase() }));
}

export function summaryText(total, query, sections) {
  const q = String(query || '').trim();
  if (!q) return '';
  return `${total} result${total === 1 ? '' : 's'} for “${q}” across ${sections} section${sections === 1 ? '' : 's'}`;
}

/* FOOD entries may be a URL string or { src, alt }. */
export function photoOf(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') return { src: entry, alt: '' };
  return entry.src ? { src: entry.src, alt: entry.alt || '' } : null;
}
