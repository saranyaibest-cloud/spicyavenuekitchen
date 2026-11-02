// Run: npm test
// The menu assistant is a deterministic search. These are the answers from the brief.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { answer } from '../app/lib/engine.js';
import { SITE } from '../app/data/site.js';

const MENU = JSON.parse(fs.readFileSync(new URL('../app/data/menu.snapshot.json', import.meta.url), 'utf8'));

// A bigger fixture for the "first 10" case.
const BIG = structuredClone(MENU);
const js = BIG.categories.find((c) => c.id === 'just-south');
for (let i = 0; i < 29; i += 1) {
  js.sections[0].items.push({ id: `just-south-x${i}`, name: `Test Dosa ${i}`, note: '', description: '', price: 9.99, variants: [], diet: null });
}

test('price of a dish', () => {
  const a = answer('How much is Butter Chicken?', MENU, SITE);
  assert.equal(a.text, 'Butter Chicken (Curries): $13.99.');
  assert.deepEqual(a.list, [{ id: 'curries-butter-chicken', name: 'Butter Chicken', price: '$13.99', cat: 'Curries' }]);
  assert.deepEqual(a.actions, [{ type: 'dish', label: 'Open dish details', id: 'curries-butter-chicken' }]);
});

test('dish with no price says so and never $0', () => {
  const a = answer('How much is the onion kulcha', MENU, SITE);
  assert.equal(a.text, 'Onion kulcha (Breads): no price listed. The menu does not list a price for it.');
  assert.ok(!JSON.stringify(a).includes('$0'));
});

test('a keyword maps to its section and lists the first 10', () => {
  const a = answer('What dosas do you have', BIG, SITE);
  assert.equal(a.text, 'Just South has 30 dishes; here are the first 10:');
  assert.equal(a.list.length, 10);
  assert.deepEqual(a.actions, [{ type: 'category', label: 'Open Just South in the menu', id: 'just-south' }]);
});

test('section by name', () => {
  const a = answer('Show me the tandoor', MENU, SITE);
  assert.equal(a.text, 'Tandoor has 1 dish:');
  assert.equal(a.actions[0].id, 'tandoor');
});

test('location', () => {
  const a = answer('Where is the restaurant?', MENU, SITE);
  assert.equal(a.text, '23519 Katy FWY, Ste#501, Katy, Texas 77494, USA.');
  assert.deepEqual(a.actions, [{ type: 'link', label: 'Get directions', href: SITE.directionsUrl }]);
});

test('hours, phone, ordering: refuses to guess', () => {
  for (const q of ['Opening hours?', 'What is your phone number', 'Do you deliver?', 'Can I book a table']) {
    const a = answer(q, MENU, SITE);
    assert.match(a.text, /^I don't have opening hours, phone, delivery, ordering or reservation details, so I won't guess/);
    assert.equal(a.actions[0].href, SITE.mapsUrl);
  }
});

test('allergens / diet claims: refuses', () => {
  const a = answer('Is the biryani gluten free?', MENU, SITE);
  assert.equal(
    a.text,
    "The menu data has no allergen, vegan, halal, spice-level or calorie information, so I can't answer that. Please ask the restaurant before ordering."
  );
  assert.equal(answer('Is Chicken 65 spicy?', MENU, SITE).text, a.text);
});

test('vegetarian answers only from the diet field', () => {
  assert.equal(answer('Is Malai paneer tikka vegetarian?', MENU, SITE).text, 'Malai paneer tikka (Tandoor) is marked vegetarian on the menu.');
  assert.match(answer('Is the Masala Dosa vegetarian?', MENU, SITE).text, /doesn't mark whether Masala Dosa is vegetarian/);
});

test("what's on the menu", () => {
  const a = answer('What’s on the menu?', MENU, SITE);
  assert.equal(a.text, 'The menu has 12 sections and 10 dishes:');
  assert.equal(a.list.length, 12);
  assert.ok(a.list.every((r) => r.category === true));
});

test('unknown and empty', () => {
  assert.match(answer('Do you have pizza?', MENU, SITE).text, /couldn't find that on the menu/);
  assert.equal(answer('Butter Chicken', null, SITE).text, 'The menu is still loading. Please try again in a moment.');
});

test('a dish whose name contains "veg" gets its price, not a diet answer', () => {
  assert.equal(answer('Veg Cutlet', MENU, SITE).text, 'Veg Cutlet (Appetizers): $5.99.');
  assert.equal(answer('Is the Veg Cutlet vegetarian?', MENU, SITE).text, 'Veg Cutlet (Appetizers) is marked vegetarian on the menu.');
  assert.match(answer('Is the veg cutlet spicy?', MENU, SITE).text, /no allergen, vegan, halal, spice-level/);
});
