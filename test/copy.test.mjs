// Run: npm test
// Guards the copy rules in every Vue file: the assistant line stays exact,
// and no component calls the assistant "AI", "smart", a chef or a person.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../app/', import.meta.url));
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.vue') && files.push(path.join(d, e.name))));
walk(root);
const templateOf = (src) => src.slice(src.indexOf('<template>'), src.lastIndexOf('</template>'));

test('assistant disclaimer is exact', () => {
  const src = fs.readFileSync(path.join(root, 'components/sections/MenuAssistant.vue'), 'utf8');
  assert.ok(src.includes("'Answers come from the live menu. It is not an AI model, and it can’t take orders.'"));
});

test('no "AI", "smart" or "chef" in any template', () => {
  for (const f of files) {
    const t = templateOf(fs.readFileSync(f, 'utf8'));
    assert.ok(!/\bAI\b|\bsmart\b|\bchef\b/i.test(t), path.relative(root, f));
  }
});
