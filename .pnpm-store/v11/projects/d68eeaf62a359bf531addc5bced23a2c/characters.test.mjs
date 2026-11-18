import test from 'node:test';
import assert from 'node:assert/strict';
import {heroWords,enemyWords,enemyWord} from '../source/src/character-rules.js';
import {glyphCatalog} from '../source/src/glyph-catalog.js';

test('ordinary and elite spawns share all 19 new glyphs, independently of bosses and heroes',()=>{
  for(const flags of [0,1,2]) assert.deepEqual(enemyWords.map((_,i)=>enemyWord(59,flags,()=>i/19)),enemyWords);
  for(const flags of [4,4096,8192])assert.equal(enemyWord(59,flags),'敌');
  assert.equal(enemyWord(16,128),'风');
  assert.deepEqual(new Set(Object.keys(glyphCatalog.words)),new Set([...enemyWords,...Object.values(heroWords)]));
});
