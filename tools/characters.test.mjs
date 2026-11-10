import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {heroWords,enemyWords,enemyWord,configureCharacterData,applyWindBuffs,createCharacterUltimates} from '../source/src/character-rules.js';
import {constrainLiteProfile} from '../source/src/lite-rules.js';
import {glyphCatalog} from '../source/src/glyph-catalog.js';

test('ordinary and elite spawns share all 19 new glyphs, independently of bosses and heroes',()=>{
  for(const flags of [0,1,2]) assert.deepEqual(enemyWords.map((_,i)=>enemyWord(59,flags,()=>i/19)),enemyWords);
  for(const flags of [4,4096,8192])assert.equal(enemyWord(59,flags),'敌');
  assert.equal(enemyWord(16,128),'风');
  assert.deepEqual(new Set(Object.keys(glyphCatalog.words)),new Set([...enemyWords,...Object.values(heroWords)]));
});
test('wind branches have two levels and former starter selections migrate without losing currency',()=>{
  const data=JSON.parse(fs.readFileSync(new URL('../source/public/data/pokemon.json',import.meta.url)));
  configureCharacterData(data);
  assert.deepEqual(data.filter(p=>p.evoFrom===16).map(p=>p.id),[17,58]);
  assert.equal(data.find(p=>p.id===59).evoFrom,58);
  const p=constrainLiteProfile({starter:7,lastSpecies:1,team:[7,1],stardust:1234});
  assert.equal(p.starter,16);assert.equal(p.lastSpecies,132);assert.equal(p.stardust,1234);assert.deepEqual(p.team,[16,132]);
});
test('final wind ultimates grant timed tenfold buffs without using the old damage cast',()=>{
  let casts=0,rings=0;const buffs=new Map(),base={names:['old'],descs:['old'],dur:[1.2],cast:()=>casts++};
  const defs=createCharacterUltimates({4:base,16:base,58:base,132:base},()=>rings++);
  const context={form:2,run:{player:{addBuff:(key,t)=>buffs.set(key,{t})}}};
  defs[16].cast(context);defs[58].cast(context);assert.equal(casts,0);
  assert.ok([...buffs.values()].every(b=>b.t===6));
  const stats={attackSpeed:1.7,moveSpeed:5};applyWindBuffs(stats,buffs);
  assert.equal(stats.attackSpeed,17);assert.equal(stats.moveSpeed,50);
  buffs.clear();const restored={attackSpeed:1.7,moveSpeed:5};applyWindBuffs(restored,buffs);assert.equal(restored.moveSpeed,5);
  defs[16].cast({...context,form:1});assert.equal(rings,1);
});
