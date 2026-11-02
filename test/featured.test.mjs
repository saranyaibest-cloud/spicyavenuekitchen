// Run: npm test
import assert from 'node:assert/strict';
import { cleanPrice, dietLabel, priceLabel, resolveFeatured } from '../app/lib/featuredData.js';

const menu = {
  categories: [
    {
      id: 'appetizers',
      title: 'Appetizers',
      sections: [
        { title: 'Non-vegetarian', diet: 'nonveg', items: [{ id: 'appetizers-chicken-65', name: 'Chicken 65', price: 12.99, variants: [], diet: 'nonveg' }] },
      ],
    },
    {
      id: 'just-south',
      title: 'Just South',
      sections: [
        { title: 'Dosa', items: [{ id: 'just-south-masala-dosa', name: 'Masala Dosa', price: null, variants: [], diet: null }] },
        { title: 'Test', items: [{ id: 'zero', name: 'Zero Dish', price: 0, variants: [{ label: 'Small', price: 0 }], diet: null }] },
      ],
    },
  ],
};

// 1. Unknown names are skipped; case and spaces don't matter; order follows FEATURED.
const found = resolveFeatured(menu, ['  masala DOSA ', 'Not On The Menu', 'chicken 65', 'Chicken 65']);
assert.deepEqual(found.map((f) => f.item.id), ['just-south-masala-dosa', 'appetizers-chicken-65']);
assert.equal(found[0].category.id, 'just-south');
assert.deepEqual(resolveFeatured(null, ['Chicken 65']), []);
assert.deepEqual(resolveFeatured(menu, undefined), []);

// 2. A null price reaches <Price /> as null (so it renders its dash) and is never "$0".
const dosa = found[0].item;
assert.deepEqual(cleanPrice(dosa), { price: null, variants: [] });
assert.equal(priceLabel(dosa), 'price not listed');

// 3. A zero price (and zero-priced variants) are treated as missing, never "$0.00".
const zero = menu.categories[1].sections[1].items[0];
assert.deepEqual(cleanPrice(zero), { price: null, variants: [] });
assert.ok(!priceLabel(zero).includes('$0'));

// 4. Real prices and variants format correctly.
assert.equal(priceLabel(found[1].item), '$12.99');
assert.equal(priceLabel({ price: null, variants: [{ label: 'Half', price: 9.5 }, { label: 'Full', price: 15 }] }), 'from $9.50');

// 5. Diet is never inferred.
assert.equal(dietLabel(null), null);
assert.equal(dietLabel('veg'), 'Vegetarian');

console.log('featured checks passed');
