// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { count, money, slug, stampText } from '../app/lib/format.js';

test('price stamp is the same date on server and browser (UTC)', () => {
  assert.equal(stampText({ updated: '2026-10-30' }), 'Prices updated Oct 30, 2026');
  assert.equal(stampText({}), '');
  assert.equal(stampText({ updated: 'not a date' }), '');
});

test('small helpers', () => {
  assert.equal(money(9), '$9.00');
  assert.equal(slug('Chicken, goat & seafood'), 'chicken-goat-and-seafood');
  assert.equal(count({ sections: [{ items: [1, 2] }, { items: [3] }] }), 3);
  assert.equal(count(null), 0);
});
