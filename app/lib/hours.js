/* Opening-hours helpers (pure, no React) so Node can test them.

   SITE.hours format (only once verified; null until then):
     [
       { days: 'Mon-Thu', open: '11:00', close: '22:00' },
       { days: 'Fri-Sat', open: '11:00', close: '00:30' },   // closes after midnight
       { days: 'Sun',     open: null,    close: null },      // closed all day
     ]
   days: a day ('Tue'), a range ('Mon-Thu' or 'Mon–Thu'), a list ('Sat, Sun'),
         'Daily' / 'Every day', or an array of day numbers (0 = Sunday).
   open / close: 24-hour 'HH:MM' in the restaurant's time (US Central). */

export const RESTAURANT_TZ = 'America/Chicago';
const NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function dayIndex(token) {
  const t = String(token).trim().toLowerCase().slice(0, 3);
  const i = NAMES.indexOf(t);
  return i === -1 ? null : i;
}

/* -> sorted array of day numbers (0 = Sunday) */
export function parseDays(days) {
  if (Array.isArray(days)) return [...new Set(days.filter((d) => Number.isInteger(d) && d >= 0 && d < 7))].sort();
  const s = String(days || '').trim().toLowerCase();
  if (!s) return [];
  if (s === 'daily' || s === 'every day' || s === 'everyday') return [0, 1, 2, 3, 4, 5, 6];
  const out = new Set();
  for (const part of s.split(',')) {
    const [a, b] = part.split(/\s*[-–—]\s*|\s+to\s+/);
    const start = dayIndex(a);
    if (start === null) continue;
    if (b === undefined) {
      out.add(start);
      continue;
    }
    const end = dayIndex(b);
    if (end === null) continue;
    for (let d = start; ; d = (d + 1) % 7) {
      out.add(d);
      if (d === end) break;
    }
  }
  return [...out].sort();
}

export function toMinutes(hhmm) {
  if (typeof hhmm !== 'string') return null;
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59) return null;
  return (h % 24) * 60 + min;
}

/* '22:00' -> '10:00 PM', '00:30' -> '12:30 AM' */
export function formatTime(hhmm) {
  const mins = toMinutes(hhmm);
  if (mins === null) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

const isClosedEntry = (e) => toMinutes(e.open) === null || toMinutes(e.close) === null;

/* Is the restaurant open at { day (0-6), minutes (0-1439) } restaurant time?
   Returns true / false, or null when hours are unknown. */
export function isOpenAt(hours, at) {
  if (!Array.isArray(hours) || hours.length === 0) return null;
  const { day, minutes } = at;
  for (const entry of hours) {
    if (!entry || isClosedEntry(entry)) continue;
    const o = toMinutes(entry.open);
    const c = toMinutes(entry.close);
    for (const d of parseDays(entry.days)) {
      if (c > o) {
        if (day === d && minutes >= o && minutes < c) return true;
      } else {
        // Crosses midnight (or 24h when open === close): evening part, then early-morning part next day.
        if (day === d && minutes >= o) return true;
        if (day === (d + 1) % 7 && minutes < c) return true;
      }
    }
  }
  return false;
}

/* Current day/minutes in the restaurant's time zone. */
export function restaurantNow(date = new Date(), timeZone = RESTAURANT_TZ) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return { day: dayIndex(get('weekday')), minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

/* Table rows: { label, text, days, isToday } in the order given. */
export function hoursRows(hours, visitorDay) {
  if (!Array.isArray(hours)) return [];
  return hours
    .filter(Boolean)
    .map((e) => {
      const days = parseDays(e.days);
      const label = Array.isArray(e.days) ? days.map((d) => NAMES[d][0].toUpperCase() + NAMES[d].slice(1)).join(', ') : String(e.days);
      const text = isClosedEntry(e) ? 'Closed' : `${formatTime(e.open)} – ${formatTime(e.close)}`;
      return { label, text, days, isToday: days.includes(visitorDay) };
    });
}
