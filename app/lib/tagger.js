/* Tag lines built ONLY from words in the dish's own description or note.
   Used by scripts/make-tags.mjs (to write app/data/menu-tags.json) and at
   runtime as a fallback for dishes that have no saved tag yet.
   Never adds an ingredient, diet, spice or allergen claim: every word in a tag
   is copied from the source text. Spice-level words are skipped on purpose. */

export const MAX_TAG = 34;

// Texture / method words worth surfacing (only used if present in the text).
const TEXTURE = [
  'crisp', 'crispy', 'crunchy', 'tangy', 'smoky', 'creamy', 'velvety', 'silky', 'fluffy', 'golden', 'tender',
  'juicy', 'buttery', 'aromatic', 'fragrant', 'slow-cooked', 'charred', 'pan-fried', 'fried', 'grilled',
  'roasted', 'steamed', 'layered', 'rich', 'sweet', 'savory', 'savoury', 'hearty', 'zesty', 'fresh', 'soft', 'thin',
];

// Ingredient / component words (multi-word first so they win over parts).
const INGREDIENT = [
  'curry leaves', 'green chilies', 'green chillies', 'mustard seeds', 'basmati rice', 'gongura leaves', 'sugar syrup',
  'potato filling', 'tomato-butter sauce', 'cashews', 'cashew', 'saffron', 'cardamom', 'garlic', 'ginger', 'cream',
  'butter', 'yogurt', 'paneer', 'cheese', 'potato', 'potatoes', 'lentil', 'lentils', 'rice', 'coconut', 'tamarind',
  'mint', 'coriander', 'cumin', 'turmeric', 'onion', 'onions', 'tomato', 'spinach', 'gongura', 'chicken', 'goat',
  'lamb', 'mutton', 'fish', 'shrimp', 'prawns', 'egg', 'eggs', 'mushroom', 'mushrooms', 'cauliflower', 'chickpeas',
  'peas', 'mango', 'rose', 'pistachio', 'almonds', 'milk', 'tea', 'noodles', 'vegetables', 'herbs', 'cutlets',
  'dumplings', 'batter',
];

const SKIP = /\b(spicy|hot|fiery|mild|extra[- ]hot|heat|vegan|vegetarian|gluten|halal|dairy|nut[- ]free|healthy|authentic|best|perfect|perfection|royal|signature)\b/i;

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const has = (text, word) => new RegExp(`(^|[^a-z])${esc(word)}([^a-z]|$)`, 'i').test(text);
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/* Words are taken in the case they appear in the source. */
function pick(text, list, nameText, limit) {
  const out = [];
  for (const w of list) {
    if (out.length >= limit) break;
    if (!has(text, w) || has(nameText, w)) continue;
    if (out.some((o) => o.includes(w) || w.includes(o))) continue; // no "curry leaves" + "curry"
    const m = text.match(new RegExp(`(^|[^a-z])(${esc(w)})([^a-z]|$)`, 'i'));
    out.push(m ? m[2].toLowerCase() : w);
  }
  return out;
}

function fits(parts, joiner) {
  const s = cap(parts.join(joiner));
  return s.length <= MAX_TAG ? s : null;
}

/* First clause of the description, cut at a word boundary. */
export function firstClause(description) {
  const s = String(description || '').trim();
  if (!s) return '';
  let clause = s.split(/[,;:.—–(]/)[0].trim();
  if (SKIP.test(clause)) clause = clause.replace(SKIP, '').replace(/\s{2,}/g, ' ').trim();
  if (clause.length > MAX_TAG) {
    const cut = clause.slice(0, MAX_TAG + 1);
    clause = cut.slice(0, cut.lastIndexOf(' ')).trim();
  }
  clause = clause.replace(/\s+(and|with|of|in|a|an|the|to|from)$/i, '');
  return clause.split(/\s+/).length >= 2 ? cap(clause) : '';
}

/* Build a 2–5 word tag from the item's own text, or '' if nothing safe exists. */
export function makeTag(item) {
  const text = [item && item.description, item && item.note].filter(Boolean).join(' . ');
  if (!text) return '';
  const nameText = String((item && item.name) || '');
  const texture = pick(text, TEXTURE.filter((w) => !SKIP.test(w)), nameText, 1);
  const parts = pick(text, INGREDIENT, nameText, 3);

  // Vary the shape between neighbours (by id), using only source words.
  const variant = hash(String(item.id || nameText)) % 3;
  const candidates = [];
  if (variant === 0) candidates.push([...texture, ...parts], parts);
  if (variant === 1) candidates.push([...parts, ...texture], parts);
  if (variant === 2) candidates.push(parts.slice(0, 2).concat(texture), parts);

  for (const c of candidates) {
    for (let n = c.length; n >= 2; n -= 1) {
      const words = c.slice(0, n).join(' ').split(/\s+/).length;
      if (words < 2 || words > 5) continue;
      const tag = fits(c.slice(0, n), ', ');
      if (tag) return tag;
    }
  }
  return firstClause(item && item.description);
}

/* Checks a saved tag: every word must appear in the dish's description/note. */
export function tagIsGrounded(tag, item) {
  if (!tag) return true;
  const text = [item && item.description, item && item.note].filter(Boolean).join(' ').toLowerCase();
  return tag
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean)
    .every((w) => text.includes(w.replace(/[^a-z0-9-]/g, '')));
}
