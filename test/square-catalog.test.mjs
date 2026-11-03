import assert from 'node:assert/strict';
import { mergeSquareCatalog } from '../app/lib/squareCatalog.js';

const menu = {
  categories: [{ id: 'south', sections: [{ items: [
    { id: 'masala-dosa', name: 'Masala Dosa', price: 8.99, variants: [] },
    { id: 'cutlet', name: 'Veg Cutlet', price: 5.99, variants: [] },
  ] }] }],
};
const merged = mergeSquareCatalog(menu, [
  { name: 'masala-dosa', variations: [{ id: 'SQ-DOSA', name: 'Regular', priceCents: 1099 }] },
  { name: 'Veg Cutlet', variations: [
    { id: 'SQ-CUTLET-H', name: 'Half', priceCents: 599 },
    { id: 'SQ-CUTLET-F', name: 'Full', priceCents: 999 },
  ] },
]);
const [dosa, cutlet] = merged.categories[0].sections[0].items;
assert.equal(dosa.price, 10.99);
assert.equal(dosa.squareVariationId, 'SQ-DOSA');
assert.equal(cutlet.price, null);
assert.deepEqual(cutlet.variants.map(({ squareVariationId }) => squareVariationId), ['SQ-CUTLET-H', 'SQ-CUTLET-F']);
assert.equal(merged.categories[0].sections[0].items[1].squareCatalogMatched, true);
console.log('square catalog checks passed');