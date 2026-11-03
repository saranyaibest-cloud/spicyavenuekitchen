import assert from 'node:assert/strict';
import { addCartItem, cartPrice, cartSummary, setCartQuantity } from '../app/lib/cart.js';

const biryani = { id: 'biryani', name: 'Chicken Biryani', price: 15.99, squareVariationId: 'SQ-VAR-1' };
let items = addCartItem([], biryani);
assert.equal(items[0].quantity, 1);
assert.equal(items[0].variationId, 'SQ-VAR-1');
items = addCartItem(items, biryani);
assert.equal(items[0].quantity, 2);
assert.deepEqual(cartSummary(items), { count: 2, subtotalCents: 3198 });
items = setCartQuantity(items, 'biryani', 1);
assert.deepEqual(cartSummary(items), { count: 1, subtotalCents: 1599 });
items = setCartQuantity(items, 'biryani', 0);
assert.deepEqual(items, []);
assert.equal(cartPrice({ price: null, variants: [{ label: 'Half', price: 8.5 }] }), 8.5);
assert.equal(cartPrice({ price: null, variants: [{ label: 'Half', price: 8.5 }, { label: 'Full', price: 15 }] }), null);
assert.deepEqual(addCartItem([], { id: 'free', name: 'Free', price: 0 }), []);

console.log('cart checks passed');