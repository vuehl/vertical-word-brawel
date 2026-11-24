import {starterWords as heroWords} from './starter-characters.js';
import {formCopy} from './form-copy.js';
import {glyphCatalog} from '../actors/glyph-catalog.js';
export {heroWords};
export const finalBossSpecies = 149; // 快龙
export const finalBossWord = formCopy[finalBossSpecies].word;
const tierWords = tier => Object.values(glyphCatalog.enemies)
  .filter(entry => entry.tier === tier && entry.word !== finalBossWord).map(entry => entry.word);
export const enemyWords = Object.freeze(tierWords(1));
export const eliteWords = Object.freeze(tierWords(2));
export const minibossWords = Object.freeze(tierWords(3));

export function enemyWordPool(flags) {
  return flags & (2 | 4 | 4096 | 8192) ? minibossWords : flags & 1 ? eliteWords : enemyWords;
}

// Announcements and older co-op packets may only identify the species.
export function enemySpeciesWord(id, flags = 0) {
  const fixed = formCopy[id]?.word;
  if (fixed && glyphCatalog.enemies[fixed]) return fixed;
  const pool = enemyWordPool(flags);
  return pool[id % pool.length];
}

export function enemyWord(id, flags = 0, random = Math.random) {
  if (formCopy[id]) return enemySpeciesWord(id, flags);
  const pool = enemyWordPool(flags);
  return pool[Math.floor(random() * pool.length)];
}

export function remainingStrokes(count, hp, maxHp) {
  if (hp <= 0 || maxHp <= 0) return 0;
  return Math.min(count, Math.ceil(hp / maxHp * count));
}
