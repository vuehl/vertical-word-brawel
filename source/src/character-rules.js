// Shared new-monster pool; hero identities follow the reference project.
import {starterWords as heroWords} from './starter-characters.js';
export {heroWords};
export const enemyWords = Object.freeze(['苞','冰','虫','弹','罐','烬','驹','锯','菌','鲤','寐','恼','逆','瓶','拳','蛇','贪','藤','岩']);
export function enemyWord(id, flags = 0, random = Math.random) {
  if (flags & (4 | 4096 | 8192)) return '敌';
  if (flags & (128 | 65536)) return heroWords[id] || '敌';
  return enemyWords[Math.min(enemyWords.length - 1, Math.floor(random() * enemyWords.length))];
}
