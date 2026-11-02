// Compare app/data/glossary.json with the dish names in app/data/menu.snapshot.json.
//   node scripts/check-glossary.mjs
// Lists: terms used by dishes (with counts), terms nobody uses (safe to delete),
// frequent name words with no entry (consider adding), and entries still unreviewed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findTerm, normalise } from '../app/lib/glossary.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const glossary = JSON.parse(fs.readFileSync(path.join(root, 'app/data/glossary.json'), 'utf8'));
const menu = JSON.parse(fs.readFileSync(path.join(root, 'app/data/menu.snapshot.json'), 'utf8'));

const names = [];
for (const c of menu.categories || []) for (const s of c.sections || []) for (const it of s.items || []) names.push(it.name || '');

const used = new Map();
const words = new Map();
for (const name of names) {
  const hit = findTerm(name, glossary);
  if (hit) used.set(hit.term, (used.get(hit.term) || 0) + 1);
  for (const w of normalise(name).split(' ')) if (w.length > 2) words.set(w, (words.get(w) || 0) + 1);
}

const terms = Object.keys(glossary.terms);
const unused = terms.filter((t) => !used.has(t));
const known = new Set([...terms, ...Object.keys(glossary.aliases || {})]);
const COMMON = new Set(['chicken', 'veg', 'vegetable', 'goat', 'fish', 'egg', 'curry', 'fry', 'fried', 'rice', 'with', 'and', 'special', 'plain', 'butter', 'garlic', 'onion', 'cheese', 'mango', 'sweet']);
const candidates = [...words].filter(([w, n]) => n >= 2 && !known.has(w) && !COMMON.has(w)).sort((a, b) => b[1] - a[1]);
const unreviewed = terms.filter((t) => !glossary.terms[t].reviewed);

console.log(`${names.length} dish names · ${used.size} glossary terms in use`);
console.log('In use:', [...used].map(([t, n]) => `${t} (${n})`).join(', ') || 'none');
console.log('Not used by any dish (can delete):', unused.join(', ') || 'none');
console.log('Name words seen 2+ times with no entry:', candidates.map(([w, n]) => `${w} (${n})`).join(', ') || 'none');
console.log(`Unreviewed entries: ${unreviewed.length} of ${terms.length}`);
