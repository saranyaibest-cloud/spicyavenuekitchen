// Run: npm test
// The /q/<code> redirect logic (shared/qr/), with a fake Supabase function.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { classifyUserAgent } from '../shared/qr/device.js';
import { _resetRateLimit, clientIp, rateLimit } from '../shared/qr/rate-limit.js';
import { FALLBACK_PATH, isSafePath, normaliseCode, resolveScan, supabaseRpc } from '../shared/qr/resolve.js';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36';
const headers = (ua, ip = '203.0.113.7') => (n) => ({ 'user-agent': ua, 'x-forwarded-for': `${ip}, 10.0.0.1` })[n];

// Fake record_qr_scan with the database's rules: main → /menu, table-12 → /menu?t=12, the rest unknown.
function fakeDb() {
  const calls = [];
  const dest = { main: '/menu', 'table-12': '/menu?t=12' };
  const rpc = async (args) => {
    calls.push(args);
    return dest[args.p_code] ?? null;
  };
  return { rpc, calls };
}

beforeEach(() => _resetRateLimit());

test('device and OS labels; link-preview bots recognised', () => {
  assert.deepEqual(classifyUserAgent(IPHONE), { device: 'mobile', os: 'ios' });
  assert.deepEqual(classifyUserAgent(ANDROID), { device: 'mobile', os: 'android' });
  assert.deepEqual(classifyUserAgent('Mozilla/5.0 (Linux; Android 14; SM-X710) Safari/537.36'), { device: 'tablet', os: 'android' });
  assert.deepEqual(classifyUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131'), { device: 'desktop', os: 'windows' });
  for (const bot of ['WhatsApp/2.23', 'facebookexternalhit/1.1', 'Slackbot-LinkExpanding', 'HeadlessChrome/131', 'SAK-QR-Verifier/1.0 (bot)']) {
    assert.equal(classifyUserAgent(bot).device, 'bot', bot);
  }
  assert.deepEqual(classifyUserAgent(''), { device: 'unknown', os: 'other' });
});

test('code and path rules match the database', () => {
  assert.equal(normaliseCode('MAIN'), 'main');
  assert.equal(normaliseCode('table-12'), 'table-12');
  for (const bad of ['', 'a', 'main--x', '-main', 'main-', 'ma in', '../x', 'x'.repeat(41)]) assert.equal(normaliseCode(bad), null, bad);
  for (const ok of ['/menu', '/menu?t=12', '/#visit', '/']) assert.ok(isSafePath(ok), ok);
  for (const bad of ['//evil.com', 'https://evil.com', 'menu', '/menu<script>', null, 42]) assert.ok(!isSafePath(bad), String(bad));
});

test('/q/main → /menu and one scan counted with coarse labels only', async () => {
  const db = fakeDb();
  const r = await resolveScan({ code: 'main', getHeader: headers(IPHONE), rpc: db.rpc });
  assert.equal(r.target, '/menu');
  assert.equal(r.counted, true);
  assert.deepEqual(db.calls, [{ p_code: 'main', p_device: 'mobile', p_os: 'ios' }]);
});

test('per-table code goes to its own destination', async () => {
  const r = await resolveScan({ code: 'Table-12', getHeader: headers(ANDROID), rpc: fakeDb().rpc });
  assert.equal(r.target, '/menu?t=12');
});

test('unknown, malformed or unconfigured → /menu, never a dead end', async () => {
  const db = fakeDb();
  assert.equal((await resolveScan({ code: 'nope', getHeader: headers(IPHONE), rpc: db.rpc })).target, FALLBACK_PATH);
  assert.equal((await resolveScan({ code: '../../etc', getHeader: headers(IPHONE), rpc: db.rpc })).target, FALLBACK_PATH);
  assert.equal(db.calls.length, 1, 'malformed codes never reach the database');
  assert.equal((await resolveScan({ code: 'main', getHeader: headers(IPHONE), rpc: null })).target, FALLBACK_PATH);
});

test('database down or slow → /menu', async () => {
  const rpc = async () => { throw new Error('timeout'); };
  const r = await resolveScan({ code: 'main', getHeader: headers(IPHONE), rpc });
  assert.equal(r.target, '/menu');
  assert.equal(r.counted, false);
});

test('an off-site answer is ignored (no open redirect)', async () => {
  for (const evil of ['https://evil.example', '//evil.example', 'javascript:alert(1)']) {
    const r = await resolveScan({ code: 'main', getHeader: headers(IPHONE), rpc: async () => evil });
    assert.equal(r.target, '/menu', evil);
  }
});

test('link-preview bots are redirected but sent as "bot" (not counted)', async () => {
  const db = fakeDb();
  const r = await resolveScan({ code: 'main', getHeader: headers('WhatsApp/2.23.20'), rpc: db.rpc });
  assert.equal(r.target, '/menu');
  assert.equal(r.counted, false);
  assert.equal(db.calls[0].p_device, 'bot');
});

test('more than 20 scans a minute from one address: still redirected, not counted', async () => {
  const db = fakeDb();
  const results = [];
  for (let i = 0; i < 22; i++) results.push(await resolveScan({ code: 'main', getHeader: headers(IPHONE, '198.51.100.9'), rpc: db.rpc }));
  assert.ok(results.every((r) => r.target === '/menu'));
  assert.equal(results.filter((r) => r.counted).length, 20);
  assert.equal(db.calls.at(-1).p_device, 'bot');
  const other = await resolveScan({ code: 'main', getHeader: headers(IPHONE, '198.51.100.10'), rpc: db.rpc });
  assert.equal(other.counted, true, 'other addresses are unaffected');
});

test('rate limiter window resets; client address from x-forwarded-for', () => {
  _resetRateLimit();
  assert.ok(rateLimit('k', 1, 1000, 0).ok);
  assert.ok(!rateLimit('k', 1, 1000, 10).ok);
  assert.ok(rateLimit('k', 1, 1000, 1001).ok);
  assert.equal(clientIp((n) => ({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })[n]), '1.2.3.4');
  assert.equal(clientIp((n) => ({ 'x-real-ip': '9.9.9.9' })[n]), '9.9.9.9');
  assert.equal(clientIp(() => undefined), 'unknown');
});

test('Supabase call: REST endpoint, anon key headers, JSON body; null when not configured', async () => {
  assert.equal(supabaseRpc({ url: '', anonKey: 'k' }), null);
  assert.equal(supabaseRpc({ url: 'https://x.supabase.co', anonKey: '' }), null);
  let seen = null;
  const fetchImpl = async (url, init) => {
    seen = { url, init };
    return { ok: true, json: async () => '/menu' };
  };
  const rpc = supabaseRpc({ url: 'https://abc.supabase.co/', anonKey: 'anon-key', fetchImpl });
  assert.equal(await rpc({ p_code: 'main', p_device: 'mobile', p_os: 'ios' }), '/menu');
  assert.equal(seen.url, 'https://abc.supabase.co/rest/v1/rpc/record_qr_scan');
  assert.equal(seen.init.method, 'POST');
  assert.equal(seen.init.headers.apikey, 'anon-key');
  assert.equal(seen.init.headers.Authorization, 'Bearer anon-key');
  assert.deepEqual(JSON.parse(seen.init.body), { p_code: 'main', p_device: 'mobile', p_os: 'ios' });
  const failing = supabaseRpc({ url: 'https://abc.supabase.co', anonKey: 'k', fetchImpl: async () => ({ ok: false, status: 500 }) });
  await assert.rejects(failing({ p_code: 'main' }));
});
