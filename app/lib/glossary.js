/* Finds the glossary term in a dish name. Dish names put the dish type last
   ("Masala Dosa", "Malai Paneer Tikka"), so the right-most match wins; on a
   tie the longer term wins ("gulab jamun" over "jamun"). Aliases allowed.
   Pure functions so the scripts can share them. */

export function normalise(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findTerm(name, glossary) {
  if (!glossary || !glossary.terms) return null;
  const words = ` ${normalise(name)} `;
  const aliases = glossary.aliases || {};
  let best = null;
  for (const key of [...Object.keys(glossary.terms), ...Object.keys(aliases)]) {
    const needle = ` ${normalise(key)} `;
    const at = words.lastIndexOf(needle);
    if (at === -1) continue;
    const end = at + needle.length;
    const term = glossary.terms[key] ? key : aliases[key];
    if (!glossary.terms[term]) continue;
    if (!best || end > best.end || (end === best.end && needle.length > best.len)) {
      best = { term, end, len: needle.length };
    }
  }
  return best ? { term: best.term, ...glossary.terms[best.term] } : null;
}

/* The restaurant's own description, clipped at a word boundary. */
export function clip(text, max = 120) {
  const s = String(text || '').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:—–-]+$/, '')}…`;
}
