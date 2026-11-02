// Run: npm test
// Checks the content rules: tags are grounded in each dish's own text,
// glossary entries are general one-liners awaiting review, and the menu
// snapshot is well formed (unique ids, no $0 prices).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MAX_TAG, makeTag, tagIsGrounded, firstClause } from '../app/lib/tagger.js';
import { findTerm, clip } from '../app/lib/glossary.js';

const read = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), 'utf8'));
const MENU = read('../app/data/menu.snapshot.json');
const TAGS = read('../app/data/menu-tags.json');
const GLOSSARY = read('../app/data/glossary.json');
const ITEMS = MENU.categories.flatMap((c) => c.sections.flatMap((s) => s.items));

test('tag builder uses only words from the dish text', () => {
  const chicken65 = ITEMS.find((i) => i.id === 'appetizers-chicken-65');
  const tag = makeTag(chicken65);
  assert.equal(tag, 'Crisp, curry leaves, green chilies');
  assert.ok(tagIsGrounded(tag, chicken65));
  assert.equal(makeTag({ id: 'x', name: 'Onion kulcha', description: '' }), '');
  assert.ok(!/spicy|heat|mild|vegan|authentic|perfect/i.test(ITEMS.map(makeTag).join(' ')));
});

test('tag fallback cuts at a word boundary within 34 characters', () => {
  const t = firstClause('Thick yogurt drink blended with mango pulp and a little sugar for sweetness');
  assert.ok(t.length <= MAX_TAG);
  assert.ok(!/\s$/.test(t));
  assert.equal(t, 'Thick yogurt drink blended');
});

test('saved tags are grounded, short and cover every dish', () => {
  for (const it of ITEMS) {
    assert.ok(Object.prototype.hasOwnProperty.call(TAGS, it.id), `missing tag entry for ${it.id}`);
    const tag = TAGS[it.id];
    assert.ok(tag.length <= MAX_TAG, `${it.id} tag too long`);
    assert.ok(tagIsGrounded(tag, it), `${it.id} tag uses words not in its description: "${tag}"`);
  }
});

test('glossary picks the dish type (right-most term) and aliases work', () => {
  assert.equal(findTerm('Masala Dosa', GLOSSARY).term, 'dosa');
  assert.equal(findTerm('Malai paneer tikka', GLOSSARY).term, 'tikka');
  assert.equal(findTerm('Gulab Jamun', GLOSSARY).term, 'gulab jamun');
  assert.equal(findTerm('Chicken 65', GLOSSARY).term, '65');
  assert.equal(findTerm('Dynamite panner', GLOSSARY).term, 'paneer');
  assert.equal(findTerm('Butter Chicken', GLOSSARY), null);
});

test('glossary entries are one short line and still unreviewed', () => {
  for (const [term, e] of Object.entries(GLOSSARY.terms)) {
    assert.equal(typeof e.definition, 'string', term);
    assert.ok(e.definition.length <= 110 && !e.definition.includes('\n'), `${term} definition too long`);
    assert.equal(e.reviewed, false, `${term} should stay reviewed:false until the restaurant approves it`);
    assert.ok(!/\b(our|we|best|authentic|spicy|gluten|vegan|halal)\b/i.test(e.definition), `${term} makes a claim`);
  }
  for (const [alias, target] of Object.entries(GLOSSARY.aliases)) assert.ok(GLOSSARY.terms[target], `${alias} → ${target}`);
});

test('description clip stays under 120 characters at a word boundary', () => {
  const long = ITEMS.find((i) => i.id === 'biryani-rice-and-noodles-hyderabadi-chicken-dum-biryani').description;
  const c = clip(long, 120);
  assert.ok(c.length <= 121);
  assert.ok(c.endsWith('…'));
});

test('menu snapshot: unique ids, valid diets, no zero prices', () => {
  const ids = ITEMS.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const it of ITEMS) {
    assert.ok(it.price === null || (typeof it.price === 'number' && it.price > 0), `${it.id} price`);
    assert.ok([null, 'veg', 'nonveg'].includes(it.diet), `${it.id} diet`);
    for (const v of it.variants || []) assert.ok(v.price === null || v.price > 0, `${it.id} variant price`);
  }
  assert.equal(MENU.categories.length, 12);
});
