import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {roster} from '../source/src/catalogs.js';
import {constrainLiteProfile,isLiteFamily,validLiteRun} from '../source/src/lite-rules.js';
import {configureStarterSpecies,starterWords,starterUltimate,rosterForStarterForm,applyStarterSpeed,clearStarterSpeed,speedBuff} from '../source/src/starter-characters.js';
import {glyphWordForSpecies} from '../source/src/paper-glyph-art.js';
import {glyphCatalog} from '../source/src/glyph-catalog.js';

test('both wind paths follow the supplied design, and all nine supplied cutouts override old artwork',()=>{
  const data=JSON.parse(fs.readFileSync(new URL('../source/public/data/pokemon.json',import.meta.url)));
  configureStarterSpecies(data);
  const actor=id=>data.find(p=>p.id===id),children=id=>data.filter(p=>p.evoFrom===id).map(p=>p.id);
  assert.deepEqual(children(16),[17,18]);assert.deepEqual(children(17),[58]);assert.deepEqual(children(18),[59]);
  assert.deepEqual(children(58),[]);assert.deepEqual(children(59),[]);assert.deepEqual(children(132),[]);
  assert.deepEqual(children(4),[5]);assert.deepEqual(children(5),[6]);
  for(const id of [4,5,6,58,59])assert.deepEqual(actor(id).types,['fire']);
  for(const id of [16,17,18])assert.deepEqual(actor(id).types,['flying']);
  for(const [id,word] of Object.entries(starterWords)){
    assert.equal(glyphWordForSpecies(id),word);assert.ok(isLiteFamily(id));
    assert.equal(glyphCatalog.words[word].index,glyphCatalog.heroes['新角色-'+word].index);
  }
  assert.deepEqual(roster.find(p=>p.id===16).branch,[17,18]);
  const fire=rosterForStarterForm(roster.find(p=>p.id===16),58);
  assert.deepEqual(fire.kit,['fire-fang','flame-wheel','extreme-speed','flare-blitz']);assert.equal(fire.passive,'loyal-guard');
});

test('legacy starter selection migrates without losing currency, research, settings or records',()=>{
  for(const [old,id] of [[1,132],[7,16],[4,4]]){
    const profile={starter:old,lastSpecies:old,team:[old,4],stardust:987,lab:{dmg:3},research:{59:20},settings:{quality:'high'},times:{'forest-0':321},forms:[4,5,6,9,18,59]};
    constrainLiteProfile(profile);assert.equal(profile.starter,id);assert.equal(profile.lastSpecies,id);
    assert.deepEqual(profile.league,[4,132,16]);assert.equal(profile.stardust,987);assert.deepEqual(profile.lab,{dmg:3});
    assert.deepEqual(profile.research,{59:20});assert.deepEqual(profile.settings,{quality:'high'});assert.equal(profile.times['forest-0'].time,321);
    assert.deepEqual(profile.forms,[4,5,6,18,59]);assert.ok(validLiteRun({species:id,biome:'forest'}));
  }
  for(const species of [1,7,17,18,58,59])assert.equal(validLiteRun({species,biome:'forest'}),false);
});

test('borrowed ultimates keep the original cast, while wind and Growlithe use the correct source stage',()=>{
  const calls=[],original={};
  for(const id of [4,16,58,132])original[id]={names:['a','b','c'],descs:['d0','d1','d2'],dur:[1.2,1.8,3],cast:ctx=>calls.push([id,ctx])};
  for(const [id,name,source,index] of [[4,'一点火苗',4,0],[5,'火圈绕身',4,1],[6,'满屏是火',4,2],[132,'照着变',132,0],[16,'一阵刮来',16,0],[17,'卷着打转',16,1],[58,'冲！',58,0]]){
    const def=starterUltimate(id,original);assert.deepEqual(def.names,[name]);assert.equal(def.dur[0],original[source].dur[index]);
    def.cast({tier:2,form:2});const [actual,ctx]=calls.at(-1);assert.equal(actual,source);
    assert.equal(ctx.tier,[16,17,58].includes(id)?index:2);
    if([4,5,6,132].includes(id))assert.equal(def.cast,original[source].cast);
  }
});

test('original speed buffs multiply current speed by ten, refresh without stacking, and clean up',()=>{
  for(const [id,name] of [[18,'刮倒一片'],[59,'没影了']]){
    const p={buffs:new Map(),stats:{moveSpeed:1.7},recompute(){this.stats.moveSpeed=1.7;applyStarterSpeed(this.stats,this.buffs);},addBuff(key,t,label){this.buffs.set(key,{t,label});this.recompute();}};
    const def=starterUltimate(id,{});assert.deepEqual(def.names,[name]);assert.equal(def.dur[0],5);
    def.cast({run:{player:p}});assert.equal(p.stats.moveSpeed,17);assert.equal(p.buffs.get(speedBuff).t,5);
    p.buffs.get(speedBuff).t=2;def.cast({run:{player:p}});assert.equal(p.stats.moveSpeed,17);assert.equal(p.buffs.size,1);assert.equal(p.buffs.get(speedBuff).t,5);
    clearStarterSpeed({player:p});assert.equal(p.stats.moveSpeed,1.7);assert.equal(p.buffs.size,0);
  }
});
