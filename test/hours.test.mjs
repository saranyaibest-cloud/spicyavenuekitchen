// Run: npm test
// Uses EXAMPLE hours only to test the logic; they are not the restaurant's hours.
import assert from 'node:assert/strict';
import { formatTime, hoursRows, isOpenAt, parseDays, restaurantNow } from '../app/lib/hours.js';

const MON = 1, TUE = 2, FRI = 5, SAT = 6, SUN = 0;
const at = (day, hh, mm = 0) => ({ day, minutes: hh * 60 + mm });

const example = [
  { days: 'Tue-Thu', open: '11:00', close: '22:00' },
  { days: 'Fri–Sat', open: '17:00', close: '01:00' }, // crosses midnight, en dash
  { days: 'Sun', open: '11:00', close: '21:00' },
  { days: 'Mon', open: null, close: null }, // closed day
];

// Day parsing
assert.deepEqual(parseDays('Tue-Thu'), [2, 3, 4]);
assert.deepEqual(parseDays('Fri–Sun'), [0, 5, 6]); // wraps past Saturday
assert.deepEqual(parseDays('Sat, Sun'), [0, 6]);
assert.deepEqual(parseDays('Daily'), [0, 1, 2, 3, 4, 5, 6]);
assert.deepEqual(parseDays([1, 1, 9]), [1]);

// Normal day
assert.equal(isOpenAt(example, at(TUE, 10, 59)), false);
assert.equal(isOpenAt(example, at(TUE, 11, 0)), true);
assert.equal(isOpenAt(example, at(TUE, 22, 0)), false); // close time is exclusive

// Across midnight: Friday 17:00 → Saturday 01:00, Saturday 17:00 → Sunday 01:00
assert.equal(isOpenAt(example, at(FRI, 23, 30)), true);
assert.equal(isOpenAt(example, at(SAT, 0, 30)), true); // still Friday's shift
assert.equal(isOpenAt(example, at(SAT, 1, 0)), false);
assert.equal(isOpenAt(example, at(SUN, 0, 45)), true); // Saturday's shift spills into Sunday
assert.equal(isOpenAt(example, at(SUN, 10, 0)), false);

// Closed day
assert.equal(isOpenAt(example, at(MON, 12, 0)), false);
assert.equal(isOpenAt(example, at(MON, 0, 30)), false); // Sunday closes at 21:00, nothing spills

// Unknown hours → null (no badge rendered)
assert.equal(isOpenAt(null, at(TUE, 12)), null);
assert.equal(isOpenAt([], at(TUE, 12)), null);

// Formatting and rows
assert.equal(formatTime('00:30'), '12:30 AM');
assert.equal(formatTime('12:00'), '12:00 PM');
assert.equal(formatTime('22:00'), '10:00 PM');
const rows = hoursRows(example, MON);
assert.equal(rows.find((r) => r.isToday).label, 'Mon');
assert.equal(rows.find((r) => r.isToday).text, 'Closed');
assert.equal(rows[1].text, '5:00 PM – 1:00 AM');

// Time zone: 2026-10-30 05:00 UTC is Friday 00:00 in Katy (CDT, UTC-5).
assert.deepEqual(restaurantNow(new Date('2026-10-30T05:00:00Z')), { day: FRI, minutes: 0 });

console.log('hours checks passed');
