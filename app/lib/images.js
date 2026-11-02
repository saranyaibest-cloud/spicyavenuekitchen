/* Food photos, picked up automatically from app/assets/food/:
     hero/<any-name>.jpg             → FOOD.hero (first file)
     categories/<category-id>.jpg    → FOOD.categories[id]
     items/<item-id>.jpg             → FOOD.items[id]
     gallery/<words-with-dashes>.jpg → FOOD.gallery[]  (alt = file name, dashes → spaces)
   Every folder may be empty; every section looks right without photos.
   Use .jpg, .jpeg, .png, .webp or .avif. */

const files = import.meta.glob('../assets/food/**/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const base = (path) => path.split('/').pop().replace(/\.[^.]+$/, '')
const altOf = (path) => base(path).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()

export const FOOD = { hero: null, categories: {}, items: {}, gallery: [] }

for (const path of Object.keys(files).sort()) {
  const src = files[path]
  const rel = path.replace(/^.*assets\/food\//, '')
  const [folder] = rel.split('/')
  if (folder === 'hero' && !FOOD.hero) FOOD.hero = { src, alt: altOf(path) }
  else if (folder === 'categories') FOOD.categories[base(path)] = { src, alt: altOf(path) }
  else if (folder === 'items') FOOD.items[base(path)] = { src, alt: altOf(path) }
  else if (folder === 'gallery') FOOD.gallery.push({ src, alt: altOf(path) })
}
