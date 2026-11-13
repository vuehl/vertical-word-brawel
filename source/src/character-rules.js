import {starterWords as heroWords} from './starter-characters.js';
import {glyphCatalog} from './glyph-catalog.js';
export {heroWords};
export const finalBossWord = '龘';
// Reuse the existing forest sanctuary combat and research identity.
export const finalBossSpecies = 151;
const tierWords = tier => Object.values(glyphCatalog.enemies)
  .filter(entry => entry.tier === tier && entry.word !== finalBossWord).map(entry => entry.word);
export const enemyWords = Object.freeze(tierWords(1));
export const eliteWords = Object.freeze(tierWords(2));
export const minibossWords = Object.freeze(tierWords(3));

export function enemyWord(id, flags = 0, random = Math.random) {
  if ((flags & (128 | 65536)) && heroWords[id]) return heroWords[id];
  if ((flags & 4) && id === finalBossSpecies) return finalBossWord;
  const pool = flags & (2 | 4 | 4096 | 8192) ? minibossWords : flags & 1 ? eliteWords : enemyWords;
  return pool[Math.floor(random() * pool.length)];
}

export function remainingStrokes(count, hp, maxHp) {
  if (hp <= 0 || maxHp <= 0) return 0;
  return Math.min(count, Math.ceil(hp / maxHp * count));
}
