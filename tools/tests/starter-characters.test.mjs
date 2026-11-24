import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {roster} from '../../source/src/data/catalogs.js';
import {constrainLiteProfile,isLiteFamily,validLiteRun,rosterForMode} from '../../source/src/data/lite-rules.js';
import {characters,configureStarterSpecies,starterWords,starterUltimate,attackSpeedBuff,applyStarterSpeed,clearStarterSpeed,speedBuff,windSpeedDamageBonus,windBossDamage,updateStarterSpeed} from '../../source/src/data/starter-characters.js';
import {glyphWordForSpecies} from '../../source/src/actors/paper-glyph-art.js';
import {glyphCatalog} from '../../source/src/actors/glyph-catalog.js';
import {restoreProgress} from '../../source/src/network/coop-resume.js';

test('both wind paths follow the supplied design, and all nine supplied cutouts override old artwork',()=>{
  const data=JSON.parse(fs.readFileSync(new URL('../../resources/public/data/pokemon.json',import.meta.url)));
  configureStarterSpecies(data);
  const actor=id=>data.find(p=>p.id===id),children=id=>data.filter(p=>p.evoFrom===id).map(p=>p.id);
  assert.deepEqual(children(16),[17,58]);assert.deepEqual(children(17),[18]);assert.deepEqual(children(58),[59]);
  assert.deepEqual(children(18),[]);assert.deepEqual(children(59),[]);assert.deepEqual(children(132),[]);
  assert.deepEqual(children(4),[5]);assert.deepEqual(children(5),[6]);
  for(const id of [4,5,6])assert.deepEqual(actor(id).types,['fire']);
  for(const id of [16,17,18,58,59])assert.deepEqual(actor(id).types,['flying']);
  for(const [id,word] of Object.entries(starterWords)){
    assert.equal(glyphWordForSpecies(id),word);assert.ok(isLiteFamily(id));
    assert.equal(glyphCatalog.words[word].index,glyphCatalog.heroes[id].index);
  }
  assert.deepEqual(characters.map(c=>c.word),['炎','风']);
  assert.equal(glyphCatalog.heroes[132].preview,undefined);
  const wind=roster.find(p=>p.id===16);
  assert.deepEqual(wind.branch,[17,58]);
  assert.equal(wind.passive,'');
});

test('single-stage and multi-stage runs have independent thresholds for both starters',()=>{
  for(const actor of roster){
    const single=rosterForMode(actor,'single-stage');
    for(const mode of ['standard','classic']){
      const multi=rosterForMode(actor,mode);
      assert.deepEqual(single.evoLevels,[12,30]);assert.deepEqual(multi.evoLevels,[18,40]);
      if(actor.branch){assert.equal(single.evoLevel,12);assert.equal(multi.evoLevel,18);}
    }
  }
});

test('legacy starter selection migrates without losing currency, research, settings or records',()=>{
  for(const [old,id] of [[1,4],[132,4],[7,16],[4,4]]){
    const profile={starter:old,lastSpecies:old,team:[old],stardust:987,lab:{dmg:3},research:{59:20},settings:{quality:'high'},times:{'forest-0':321},forms:[4,5,6,9,18,59],classics:[132],captured:{132:123}};
    constrainLiteProfile(profile);assert.equal(profile.starter,id);assert.equal(profile.lastSpecies,id);
    assert.deepEqual(profile.league,[4,16]);assert.equal(profile.stardust,987);assert.deepEqual(profile.lab,{dmg:3});
    assert.deepEqual(profile.research,{59:20});assert.deepEqual(profile.settings,{quality:'high'});assert.equal(profile.times['forest-0'].time,321);
    assert.deepEqual(profile.forms,[4,5,6,18,59]);assert.ok(validLiteRun({species:id,biome:'forest'}));
    assert.deepEqual(profile.classics,[132]);assert.equal(profile.captured[132],123);
    assert.deepEqual(profile.team,[1,132].includes(old)?[]:[id]);
  }
  for(const species of [1,7,17,18,58,59,132])assert.equal(validLiteRun({species,biome:'forest'}),false);
});

test('rejoining restores wave time, keeps a wind branch and migrates only old evolution levels',()=>{
  for(const [version,saved,expected] of [[undefined,26,18],[1,26,18],[2,8,18],[2,22,22],[3,10,18],[3,23,23],[4,24,24]]){
    const cards=[],timeline=[{kind:'card',t:30},{kind:'card',t:60},{kind:'totem',t:145},
      {kind:'guardian',t:250},{kind:'card',t:275}];
    const player={speciesId:16,hp:10,maxHp:10,moves:[],pos:{set(){}},xpFor:()=>30,recompute(){}};
    const run={player,coop:{},camTarget:{copy(){}},planEvolution:()=>({to:-1,level:18}),
      director:{timeline,addCard:()=>cards.push(run.stageTime)}};
    const data={v:version,stage:1,player:{speciesId:16,level:7,hp:10},pos:[1,0,1],
      moves:[],run:{nextEvo:{to:58,level:saved}}};
    restoreProgress(run,data,{stage:1,time:261,stageTime:253});
    assert.deepEqual(run.nextEvo,{to:58,level:expected});
    assert.deepEqual(cards,[30,60]);
    assert.deepEqual(timeline.map(event=>!!event.done),[true,true,true,false,false]);
    assert.deepEqual([run.time,run.stageTime],[261,253]);
  }
});

test('rejoining preserves the one-time spring shoe draw and normalizes older stacks',()=>{
  for(const [items,savedRun,expected,state] of [
    [[], {springShoesSeen:true}, 0,'offered'],
    [[['air-balloon',13]], {}, 1,'claimed'],
    [[], {springShoesState:'claimed'}, 0,'claimed'],
    [[], {springShoesState:'offered'}, 0,'offered'],
    [[], {}, 0,'available'],
  ]){
    const player={speciesId:4,moves:[],pos:{set(){}},xpFor:()=>30,recompute(){}};
    const run={player,coop:{},camTarget:{copy(){}},director:{timeline:[]}};
    const data={stage:1,player:{speciesId:4},items,pos:[0,0,0],moves:[],run:{nextEvo:null,...savedRun}};
    restoreProgress(run,data,{stage:1,time:60,stageTime:60});
    assert.equal(player.items.get('air-balloon')??0,expected);
    assert.equal(run.springShoesState,state);
  }
});

test('borrowed ultimates keep the original cast, while wind forms use the correct source stage',()=>{
  const calls=[],original={};
  for(const id of [4,16,58,132])original[id]={names:['a','b','c'],descs:['d0','d1','d2'],dur:[1.2,1.8,3],cast:ctx=>calls.push([id,ctx])};
  for(const [id,name,source,index] of [[4,'一点火苗',4,0],[5,'一点火苗',4,1],[6,'一点火苗',4,2],[132,'照着变',132,0],[16,'一阵风刮来',16,0]]){
    const def=starterUltimate(id,original);assert.deepEqual(def.names,[name]);assert.equal(def.dur[0],original[source].dur[index]);
    def.cast({tier:2,form:2});const [actual,ctx]=calls.at(-1);assert.equal(actual,source);
    assert.equal(ctx.tier,[16,58].includes(id)?index:2);
    if([4,5,6,132].includes(id))assert.equal(def.cast,original[source].cast);
  }
});

test('wind ultimates multiply attack speed by ten or movement speed by form, refresh without stacking, and clean up',()=>{
  for(const [id,name,key,stat,other] of [[17,'刮倒一片',attackSpeedBuff,'attackSpeed','moveSpeed'],[58,'跑得没影',speedBuff,'moveSpeed','attackSpeed'],[18,'刮倒一片',attackSpeedBuff,'attackSpeed','moveSpeed'],[59,'跑得没影',speedBuff,'moveSpeed','attackSpeed']]){
    const p={buffs:new Map(),stats:{moveSpeed:1.7,attackSpeed:1.7},recompute(){this.stats.moveSpeed=this.stats.attackSpeed=1.7;applyStarterSpeed(this.stats,this.buffs,id);},addBuff(key,t,label){this.buffs.set(key,{t,label});this.recompute();}};
    const def=starterUltimate(id,{});assert.deepEqual(def.names,[name]);assert.equal(def.dur[0],5);
    const expected=1.7*({17:10,18:10,58:2,59:3}[id]);
    def.cast({run:{player:p}});assert.ok(Math.abs(p.stats[stat]-expected)<1e-10);assert.equal(p.buffs.get(key).t,5);assert.equal(p.stats[other],1.7);
    p.buffs.get(key).t=2;def.cast({run:{player:p}});assert.ok(Math.abs(p.stats[stat]-expected)<1e-10);assert.equal(p.buffs.size,1);assert.equal(p.buffs.get(key).t,5);
    clearStarterSpeed({player:p});assert.equal(p.stats[stat],1.7);assert.equal(p.buffs.size,0);
  }
});

test('movement bonus rises with speed and remains below forty percent',()=>{
  for(const id of [58,59])for(const [speed,bonus] of [[.8,0],[1,0],[1.2,1/15],[2,.2],[10,.36],[100,.396]]){
    assert.ok(Math.abs(windSpeedDamageBonus(id,speed*1.07,1.07)-bonus)<1e-10);
  }
  for(const id of [4,5,6,16,17,18,132])assert.equal(windSpeedDamageBonus(id,10,1),0);
});

test('one full speed ultimate cannot burst down a fresh boss, including simultaneous hits',()=>{
  const budgets=new Map();
  const hit=(time,gen=1)=>windBossDamage(budgets,0,gen,10000,time,1e12);
  assert.equal(hit(0),800);
  assert.equal(hit(0),0);
  let total=800;
  for(let frame=1;frame<=300;frame++) total+=hit(frame/60)+hit(frame/60);
  assert.ok(Math.abs(total-3800)<1e-6);
  assert.equal(hit(5,2),800);
});

test('speed afterimages follow travelled positions, retain the casting glyph, stay bounded and clear',()=>{
  let allowed=true;
  const player={speciesId:59,renderScale:1.3,pos:{x:0,y:0,z:0},buffs:new Map([[speedBuff,{}]]),recompute(){}};
  const run={player,time:0,ghosts:[],sprites:{dirRow:()=>2},vfx:{crafted:{allowed:()=>allowed}}};
  updateStarterSpeed(run,1/60,0);assert.equal(run.ghosts.length,0);
  for(let frame=0;frame<20;frame++){
    player.pos.x+=1.4;run.time+=1/60;updateStarterSpeed(run,1/60,0);
    assert.ok(run.ghosts.length<=5);
    assert.ok(run.ghosts.every(g=>g.x<=player.pos.x&&g.species===59&&g.scale===1.3));
  }
  const count=run.ghosts.length;
  updateStarterSpeed(run,1/60,0);assert.equal(run.ghosts.length,count,'Standing still emits nothing');
  allowed=false;player.pos.x+=5;updateStarterSpeed(run,1/60,0);assert.equal(run.ghosts.length,count);
  run.ghosts.push({fireGlyph:true});clearStarterSpeed(run);
  assert.deepEqual(run.ghosts,[{fireGlyph:true}]);assert.equal(player.zilingSpeedPosition,null);
});
