/* Text shown on cards: tag lines and the "What is this?" info. */
import TAGS from '~/data/menu-tags.json'
import GLOSSARY from '~/data/glossary.json'
import { makeTag } from './tagger.js'
import { clip, findTerm } from './glossary.js'

/* Saved tag (app/data/menu-tags.json) or one built from the dish's own words. */
export function tagFor(item) {
  if (!item) return ''
  return Object.prototype.hasOwnProperty.call(TAGS, item.id) ? TAGS[item.id] : makeTag(item)
}

/* Glossary definition for a term in the name, else the restaurant's own description (≤120 chars). */
export function infoFor(item) {
  const hit = findTerm(item && item.name, GLOSSARY)
  if (hit) {
    return {
      title: hit.term === '65' ? '65' : hit.term[0].toUpperCase() + hit.term.slice(1),
      body: hit.definition,
      reviewed: hit.reviewed,
    }
  }
  if (item && item.description) return { title: null, body: clip(item.description, 120), reviewed: true }
  return null
}
