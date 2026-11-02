// Regenerate dish tag lines from the menu snapshot.
//   node scripts/make-tags.mjs           keep existing tags, add tags for new dishes, drop removed ids
//   node scripts/make-tags.mjs --all     rebuild every tag from the descriptions
//   node scripts/make-tags.mjs --check   only report problems (exit 1 if any)
// Every tag word must appear in that dish's own description or note.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_TAG, makeTag, tagIsGrounded } from '../app/lib/tagger.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MENU = path.join(root, 'app/data/menu.snapshot.json');
const OUT = path.join(root, 'app/data/menu-tags.json');
const args = new Set(process.argv.slice(2));

const menu = JSON.parse(fs.readFileSync(MENU, 'utf8'));
const items = [];
for (const c of menu.categories || []) for (const s of c.sections || []) for (const it of s.items || []) items.push(it);

const old = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const next = {};
const problems = [];
let added = 0;
let empty = 0;

for (const it of items) {
  const keep = !args.has('--all') && Object.prototype.hasOwnProperty.call(old, it.id);
  const tag = keep ? old[it.id] : makeTag(it);
  if (!keep) added += 1;
  if (!tag) empty += 1;
  if (tag && tag.length > MAX_TAG) problems.push(`${it.id}: longer than ${MAX_TAG} characters ("${tag}")`);
  if (tag && !tagIsGrounded(tag, it)) problems.push(`${it.id}: uses words not in its description ("${tag}")`);
  next[it.id] = tag;
}

const removed = Object.keys(old).filter((id) => !(id in next));
console.log(`${items.length} dishes · ${added} tags generated · ${empty} without a tag · ${removed.length} removed ids`);
if (problems.length) {
  console.log('Problems:');
  problems.forEach((p) => console.log('  - ' + p));
}
if (args.has('--check')) process.exit(problems.length ? 1 : 0);

fs.writeFileSync(OUT, JSON.stringify(next, null, 2) + '\n');
console.log('Wrote ' + path.relative(root, OUT));
