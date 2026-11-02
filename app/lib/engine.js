/* Menu assistant engine: a deterministic search over the live menu.
   It is NOT an AI model. It only repeats what the menu data and SITE say,
   and it refuses questions the data cannot answer (hours, phone, ordering,
   allergens, spice levels…) instead of guessing.

   answer(question, menu, SITE) → { text, list?, actions? }
     list:    [{ id, name, price, cat? , category?: true }]
     actions: [{ type: 'link', label, href } | { type: 'category' | 'dish', label, id }] */

const LIST_MAX = 10;

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const singular = (w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
const words = (s) => norm(s).split(' ').filter(Boolean).map(singular);

const isPrice = (p) => typeof p === 'number' && Number.isFinite(p) && p > 0;
const money = (p) => `$${p.toFixed(2)}`;

function priceText(item) {
  if (isPrice(item.price)) return money(item.price);
  const v = (item.variants || []).filter((x) => x && isPrice(x.price));
  if (v.length) return `from ${money(Math.min(...v.map((x) => x.price)))}`;
  return 'no price listed';
}

function priceSentence(item, category) {
  const where = category ? ` (${category.title})` : '';
  if (isPrice(item.price)) return `${item.name}${where}: ${money(item.price)}.`;
  const v = (item.variants || []).filter((x) => x && isPrice(x.price));
  if (v.length) return `${item.name}${where}: ${v.map((x) => `${x.label} ${money(x.price)}`).join(', ')}.`;
  return `${item.name}${where}: no price listed. The menu does not list a price for it.`;
}

const row = ({ item, category }) => ({ id: item.id, name: item.name, price: priceText(item), cat: category.title });

function flatten(menu) {
  const out = [];
  for (const category of (menu && menu.categories) || []) {
    for (const section of category.sections || []) {
      for (const item of section.items || []) out.push({ item, section, category });
    }
  }
  return out;
}

const countOf = (category) => (category.sections || []).reduce((n, s) => n + (s.items || []).length, 0);

/* Words that point at a section even when the dish name doesn't say it. */
const CATEGORY_HINTS = {
  soups: ['soup'],
  appetizers: ['appetizer', 'starter', 'snack'],
  'lunch-bowls': ['lunch', 'bowl', 'rice bowl'],
  curries: ['curry', 'currie', 'gravy', 'entree'],
  tandoor: ['tandoor', 'tandoori', 'tikka', 'kebab', 'kabab'],
  breads: ['bread', 'naan', 'roti', 'kulcha', 'paratha'],
  'biryani-rice-and-noodles': ['biryani', 'rice', 'noodle', 'fried rice'],
  desserts: ['dessert', 'sweet'],
  'smoothies-and-drinks': ['drink', 'smoothie', 'beverage', 'juice', 'lassi', 'chai', 'tea', 'coffee'],
  'ice-cream-rolls': ['ice cream', 'ice cream roll'],
  'weekend-pulao': ['pulao', 'pulav', 'weekend'],
  'just-south': ['dosa', 'idli', 'uttapam', 'vada', 'tiffin', 'south indian', 'just south'],
};

const UNSUPPORTED =
  /\b(hour|hours|open|opening|close|closing|closed|timing|timings|today|tonight|phone|call|number|contact|deliver|delivery|doordash|uber ?eats|order|ordering|online|reserv\w*|booking|book a table|takeout|take out|pickup|pick up|catering|parking|wifi|discount|offer|deal|coupon)\b/;
const DIETARY =
  /\b(gluten|allerg\w*|vegan|halal|kosher|jain|dairy|lactose|nut|nuts|peanut\w*|egg ?free|spicy|spice|spiciness|hot|mild|calorie\w*|keto|healthy|sugar free)\b/;
const LOCATION = /\b(where|address|location|located|direction\w*|how do i get|find you|map)\b/;
const PRICE = /\b(how much|price|prices|cost|costs|rate)\b/;
const OVERVIEW = /\b(whats on the menu|what is on the menu|full menu|the menu|menu sections|sections|categories|what do you (serve|have|offer))\b/;
const VEG = /\b(veg|vegetarian|non veg|nonveg|non vegetarian)\b/;
const GREETING = /^(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/;

function matchDishes(q, all) {
  const qn = ` ${norm(q)} `;
  const qw = new Set(words(q));
  // 1) full dish name inside the question (longest first)
  const exact = all
    .filter(({ item }) => item.name && qn.includes(` ${norm(item.name)} `))
    .sort((a, b) => b.item.name.length - a.item.name.length);
  if (exact.length) return { strong: true, hits: [exact[0]] };
  // 2) every significant word of the name appears in the question
  const scored = [];
  for (const e of all) {
    const nw = words(e.item.name).filter((w) => w.length > 2);
    if (!nw.length) continue;
    const hit = nw.filter((w) => qw.has(w)).length;
    if (hit === nw.length) scored.push({ e, score: 2 + nw.length });
    else if (hit > 0) scored.push({ e, score: hit / nw.length });
  }
  scored.sort((a, b) => b.score - a.score);
  if (scored.length && scored[0].score >= 2) return { strong: true, hits: [scored[0].e] };
  return { strong: false, hits: scored.filter((s) => s.score >= 0.5).map((s) => s.e) };
}

function matchCategory(q, categories) {
  const qn = ` ${words(q).join(' ')} `;
  for (const c of categories) {
    if (qn.includes(` ${words(c.title).join(' ')} `)) return c;
  }
  for (const c of categories) {
    const hints = CATEGORY_HINTS[c.id] || [];
    if (hints.some((h) => qn.includes(` ${words(h).join(' ')} `))) return c;
  }
  return null;
}

function categoryAnswer(category, all) {
  const items = all.filter((e) => e.category.id === category.id);
  const n = items.length;
  const shown = items.slice(0, LIST_MAX).map(row);
  const head =
    n === 0
      ? `${category.title} has no dishes listed right now.`
      : n > LIST_MAX
        ? `${category.title} has ${n} dishes; here are the first ${LIST_MAX}:`
        : `${category.title} has ${n} ${n === 1 ? 'dish' : 'dishes'}:`;
  return {
    text: head,
    list: shown,
    actions: [{ type: 'category', label: `Open ${category.title} in the menu`, id: category.id }],
  };
}

export function answer(question, menu, SITE = {}) {
  const q = norm(question);
  const categories = ((menu && menu.categories) || []).filter((c) => c && c.id);
  const all = flatten(menu);

  if (!q) return { text: 'Ask about a dish, a price or a section of the menu.' };
  if (!categories.length) return { text: 'The menu is still loading. Please try again in a moment.' };
  if (GREETING.test(q) && q.split(' ').length <= 3) return { text: 'Hello. Ask about a dish, a price or a section of the menu.' };

  // Things the data cannot answer: say so, never guess.
  if (UNSUPPORTED.test(q)) {
    if (SITE.phone && /\b(phone|call|number|contact)\b/.test(q)) {
      return { text: `The phone number is ${SITE.phone}.`, actions: [{ type: 'link', label: 'Call', href: `tel:${SITE.phone}` }] };
    }
    return {
      text: "I don't have opening hours, phone, delivery, ordering or reservation details, so I won't guess. The Google Maps listing is the best place to check.",
      actions: SITE.mapsUrl ? [{ type: 'link', label: 'Open Google Maps', href: SITE.mapsUrl }] : undefined,
    };
  }
  // Words inside a dish's own name ("Veg Cutlet", "Hot & Sour Soup") are not questions
  // about diet or spice, so those checks look at the question with that name removed.
  const dishes = matchDishes(q, all);
  const rest = dishes.strong ? q.replace(norm(dishes.hits[0].item.name), ' ') : q;

  if (DIETARY.test(rest)) {
    return {
      text: "The menu data has no allergen, vegan, halal, spice-level or calorie information, so I can't answer that. Please ask the restaurant before ordering.",
    };
  }
  if (LOCATION.test(q)) {
    const address = [SITE.street, SITE.city].filter(Boolean).join(', ');
    return {
      text: address ? `${address}.` : 'The address is on the Google Maps listing.',
      actions: SITE.directionsUrl ? [{ type: 'link', label: 'Get directions', href: SITE.directionsUrl }] : undefined,
    };
  }

  // "Is X vegetarian?" answers only from the dish's own diet field.
  if (VEG.test(rest)) {
    if (dishes.strong) {
      const { item, category } = dishes.hits[0];
      const label = item.diet === 'veg' ? 'marked vegetarian' : item.diet === 'nonveg' ? 'marked non-vegetarian' : null;
      return {
        text: label
          ? `${item.name} (${category.title}) is ${label} on the menu.`
          : `The menu doesn't mark whether ${item.name} is vegetarian. Please ask the restaurant.`,
        list: [row(dishes.hits[0])],
        actions: [{ type: 'dish', label: 'Open dish details', id: item.id }],
      };
    }
    const want = /\bnon ?veg|non vegetarian\b/.test(q) ? 'nonveg' : 'veg';
    const hits = all.filter((e) => (e.item.diet || e.section.diet) === want);
    const label = want === 'veg' ? 'vegetarian' : 'non-vegetarian';
    if (!hits.length) return { text: `No dishes are marked ${label} in the menu data.` };
    return {
      text: hits.length > LIST_MAX ? `${hits.length} dishes are marked ${label}; here are the first ${LIST_MAX}:` : `${hits.length} ${hits.length === 1 ? 'dish is' : 'dishes are'} marked ${label}:`,
      list: hits.slice(0, LIST_MAX).map(row),
    };
  }

  if (dishes.strong) {
    const hit = dishes.hits[0];
    return {
      text: priceSentence(hit.item, hit.category),
      list: [row(hit)],
      actions: [{ type: 'dish', label: 'Open dish details', id: hit.item.id }],
    };
  }

  if (OVERVIEW.test(q) && !matchCategory(q, categories)) {
    const total = categories.reduce((n, c) => n + countOf(c), 0);
    return {
      text: `The menu has ${categories.length} sections and ${total} dishes:`,
      list: categories.map((c) => ({ id: c.id, name: c.title, price: `${countOf(c)} dishes`, category: true })),
    };
  }

  const category = matchCategory(q, categories);
  if (category) return categoryAnswer(category, all);

  if (dishes.hits.length) {
    const hits = dishes.hits.slice(0, LIST_MAX);
    return {
      text:
        dishes.hits.length === 1
          ? 'I found one dish that may match:'
          : `I found ${dishes.hits.length} dishes that may match${dishes.hits.length > LIST_MAX ? `; here are the first ${LIST_MAX}` : ''}:`,
      list: hits.map(row),
    };
  }

  if (PRICE.test(q)) {
    return { text: "I couldn't find that dish on the menu. Try its name as it appears on the menu, e.g. Butter Chicken." };
  }
  return { text: "I couldn't find that on the menu. Try a dish name, a section such as Curries, or ask for a price." };
}
