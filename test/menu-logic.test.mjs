// Run: npm test
// Uses a fixture with the real category/section counts (189 dishes, 29 without a price).
import assert from 'node:assert/strict';
import { buildIndex, categoriesOf, dietOf, filterGroups, nextTabIndex, splitHighlight, summaryText } from '../app/lib/menuLogic.js';
import { cleanPrice } from '../app/lib/featuredData.js';

const SHAPE = [
  ['soups', 'Soups', [['Vegetarian', 'veg', 2], ['Non-vegetarian', 'nonveg', 3]]],
  ['appetizers', 'Appetizers', [['Vegetarian', 'veg', 12], ['Non-vegetarian', 'nonveg', 29]]],
  ['lunch-bowls', 'Lunch Bowls', [['Rice bowls', null, 5]]],
  ['curries', 'Curries', [['Vegetarian entrées', 'veg', 14], ['Non-vegetarian entrées', 'nonveg', 20]]],
  ['tandoor', 'Tandoor', [['Vegetarian', 'veg', 6], ['Non-vegetarian', 'nonveg', 9]]],
  ['breads', 'Breads', [['Breads', null, 7]]],
  ['biryani-rice-and-noodles', 'Biryani, Rice & Noodles', [['Vegetarian', 'veg', 12], ['Chicken, goat & seafood', 'nonveg', 12]]],
  ['desserts', 'Desserts', [['Desserts', null, 5]]],
  ['smoothies-and-drinks', 'Smoothies & Drinks', [['Fresh smoothies', null, 4], ['Beverages', null, 4]]],
  ['ice-cream-rolls', 'Ice Cream Rolls', [['Ice cream rolls', null, 6]]],
  ['weekend-pulao', 'Weekend Pulao', [['Vegetarian', 'veg', 4], ['Non-vegetarian', 'nonveg', 5]]],
  ['just-south', 'Just South', [['Tiffins, dosa & uttapam', null, 30]]],
];

let n = 0;
export const menu = {
  meta: {},
  categories: SHAPE.map(([id, title, secs]) => ({
    id,
    title,
    sections: secs.map(([st, diet, k]) => ({
      title: st,
      diet,
      items: Array.from({ length: k }, () => {
        n += 1;
        return {
          id: `${id}-${n}`,
          name: n === 1 ? 'Butter Chicken' : n === 2 ? 'Onion kulcha' : `Dish ${n}`,
          note: n === 3 ? 'SAK Green Bites' : '',
          description: n === 1 ? 'Juicy chicken cooked in a velvety tomato-butter sauce' : '',
          price: n % 6 === 0 && n <= 174 ? null : 9.99, // 29 dishes with no price
          variants: [],
          diet: null,
        };
      }),
    })),
  })),
};

const categories = categoriesOf(menu);
const index = buildIndex(categories);

// 189 dishes, every one reachable from exactly one category tab (no search, all diets).
assert.equal(index.size, 189);
let reachable = 0;
const seen = new Set();
for (const c of categories) {
  const { groups } = filterGroups({ categories, activeId: c.id, query: '', diet: 'all' });
  for (const g of groups) for (const it of g.items) { reachable += 1; seen.add(it.id); }
}
assert.equal(reachable, 189);
assert.equal(seen.size, 189);

// 29 missing prices → null for <Price />, which the card shows as a dash read "Price not listed".
const missing = [...index.values()].filter(({ item }) => cleanPrice(item).price === null);
assert.equal(missing.length, 29);

// Search spans all categories, is case-insensitive, matches name/note/description.
let r = filterGroups({ categories, activeId: 'soups', query: 'BUTTER', diet: 'all' });
assert.equal(r.total, 1);
assert.equal(summaryText(r.total, 'BUTTER', r.sections), '1 result for “BUTTER” across 1 section');
r = filterGroups({ categories, activeId: 'soups', query: 'green bites', diet: 'all' });
assert.equal(r.total, 1);
r = filterGroups({ categories, activeId: 'soups', query: 'dish', diet: 'all' });
assert.equal(r.total, 187); // every dish except Butter Chicken and Onion kulcha
assert.equal(summaryText(0, '', 0), '');

// Diet filter: section diet counts as data; unknown diet is excluded from Veg / Non-veg.
r = filterGroups({ categories, activeId: 'appetizers', query: '', diet: 'veg' });
assert.equal(r.total, 12);
r = filterGroups({ categories, activeId: 'appetizers', query: '', diet: 'nonveg' });
assert.equal(r.total, 29);
r = filterGroups({ categories, activeId: 'breads', query: '', diet: 'veg' });
assert.equal(r.total, 0);
assert.equal(dietOf({ diet: 'veg' }, { diet: 'nonveg' }), 'veg');

// Tab keys: Arrow wraps, Home/End jump, other keys ignored.
assert.equal(nextTabIndex('ArrowRight', 11, 12), 0);
assert.equal(nextTabIndex('ArrowLeft', 0, 12), 11);
assert.equal(nextTabIndex('Home', 7, 12), 0);
assert.equal(nextTabIndex('End', 2, 12), 11);
assert.equal(nextTabIndex('Enter', 2, 12), null);

// Highlight splits on matches, case-insensitive, and escapes regex characters.
assert.deepEqual(splitHighlight('Butter Chicken', 'chick'), [
  { text: 'Butter ', hit: false },
  { text: 'Chick', hit: true },
  { text: 'en', hit: false },
]);
assert.deepEqual(splitHighlight('a+b', '+'), [{ text: 'a', hit: false }, { text: '+', hit: true }, { text: 'b', hit: false }]);

console.log('menu logic checks passed');
