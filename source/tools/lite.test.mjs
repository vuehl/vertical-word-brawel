import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as nativeFs from 'node:fs';
import {localRoute} from '../local/game-routes.mjs';
import {readStore,writeStore} from '../../platform/store.mjs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {roster,biomes,events,heldItems,vitamins} from '../src/data/catalogs.js';
import {Jn as itemInPool} from '../src/data/config.js';
import {createProfile} from '../src/data/progression.js';
import {settleRun,applyAction} from '../local/progression.mjs';
import {constrainLiteProfile} from '../src/data/lite-rules.js';

test('a new profile can roll every configured official item without a research purchase',()=>{
 const profile=createProfile('test');
 assert.equal(heldItems.length,29);
 assert.equal(vitamins.length,26);
 for(const item of heldItems)assert.ok(itemInPool(profile,item.key),item.key);
 for(const key of ['leftovers','fairy-feather','water-stone'])assert.equal(itemInPool(profile,key),false);
 for(const key of ['star-piece','lucky-punch'])assert.ok(itemInPool(profile,key));
 profile.itemsOff.push('star-piece');
 assert.equal(itemInPool(profile,'star-piece'),false);
 assert.ok(itemInPool(profile,'lucky-punch'));
});

test('both forest summoning points and the sanctuary use the same final boss',()=>{
 assert.deepEqual(roster.map(p=>p.id),[4,16]);
 assert.deepEqual(biomes.map(b=>b.id),['forest']);
 assert.equal(events.length,0);
 assert.deepEqual(biomes[0].guardians,[[149],[149]]);
 assert.deepEqual(biomes[0].sanctuary.legendaries,[149]);
 assert.equal(biomes[0].zones.length,2);
 for(const p of roster)assert.equal(p.kit.length,4);
});
test('settlement preserves enemy research and evolution, excludes removed captures and maps',()=>{
 const p=constrainLiteProfile(createProfile('test'));
 const result={species:16,biome:'forest',mode:'standard',tier:0,stage:4,victory:true,kills:100,time:600,level:45,progress:{league:[10,25,132,16],shinies:[25,132,4],classics:[10,132,16],forms:[59,150],seen:[25,151],research:{25:10}}};
 const dust=settleRun(p,result);
 assert.ok(dust>0);assert.deepEqual(p.league,[4,16]);assert.deepEqual(p.unlocked,[4,16]);
 assert.deepEqual(p.shinies,[4]);assert.deepEqual(p.classics,[16]);assert.deepEqual(p.forms,[59]);
 assert.equal(p.research[25],10);assert.ok(p.seen.includes(151));assert.deepEqual(p.biomes,{forest:1});
 const before=p.stardust;assert.equal(applyAction(p,{k:'lab',id:'reroll',lv:99}),false);assert.equal(p.stardust,before);
});
test('manual quits earn zero dust before 30 seconds and normal rewards from 30 seconds',()=>{
 const cases=[
   {time:0,how:'quit',dust:0}, {time:29.999,how:'quit',dust:0},
   {time:30,how:'quit',dust:5}, {time:30.01,how:'quit',dust:5},
   {time:10,how:'died',dust:5}, {time:10,how:'won',dust:130},
 ];
 for(const {time,how,dust} of cases){
   const p=constrainLiteProfile(createProfile('test'));
   p.stardust=12;p.totalStardust=20;
   const result={species:4,biome:'forest',mode:'standard',tier:2,stage:1,kills:200,time,level:2,victory:how==='won',end:{how}};
   assert.equal(settleRun(p,result),dust);
   assert.deepEqual([p.stardust,p.totalStardust,p.counters.runs,p.counters.kills],[12+dust,20+dust,1,200]);
 }
});
test('WeChat local routes reject removed content and restore persisted progress',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'pokebonk-lite-test-'));
 t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const previous=globalThis.wx;
 globalThis.wx={env:{USER_DATA_PATH:dir},getFileSystemManager:()=>nativeFs};
 t.after(()=>{if(previous===undefined)delete globalThis.wx;else globalThis.wx=previous;});
 let token;
 const call=async(route,data,status=200)=>{
   const draft=readStore();
   const {response,dirty}=await localRoute(draft,new URL('/api'+route,'https://minigame.local'),
     data===undefined?'GET':'POST',{Authorization:token?'Bearer '+token:''},JSON.stringify(data));
   if(dirty)writeStore(draft);
   assert.equal(response.status,status,route);
   return response.data;
 };
  token=(await call('/auth/guest',{})).token;
  assert.deepEqual((await call('/profile')).profile.league,[4,16]);await call('/profile/starter',{id:132},400);await call('/profile/starter',{id:16});
  assert.deepEqual(await call('/coop/access'),{show:false,play:false});
  for(const route of ['/coop/rooms','/clans/board','/events/halloween26','/seasons/awards'])await call(route,undefined,404);
  const base={species:16,biome:'forest',tier:0,mode:'standard'};
  for(const overrides of [{species:25},{species:132},{biome:'desert'},{mode:'endless'},{mode:'tower'},{mode:'single-stage',tier:1},{party:'abc'}])await call('/runs',{...base,...overrides},400);
  const run=await call('/runs',base);
  const result={...base,stage:4,kills:100,time:600,level:30,victory:true,progress:{league:[25],research:{25:5},seen:[25]}};
  await call('/runs/'+run.id+'/finish',{result:{...result,species:4}},400);
  const one=await call('/runs/'+run.id+'/finish',{result});const two=await call('/runs/'+run.id+'/finish',{result});
  assert.equal(two.profile.counters.runs,1);assert.equal(two.profile.stardust,one.profile.stardust);assert.deepEqual(two.profile.league,[4,16]);assert.deepEqual(two.profile.biomes,{forest:1});
  const short=await call('/runs',{...base,mode:'single-stage'});
  const finishShort='/runs/'+short.id+'/finish';
  await call(finishShort,{result},400);
  const singleResult={...base,mode:'single-stage',stage:1,bosses:1,kills:40,time:100,splits:[100],victory:true,progress:{league:[132],shinies:[16]}};
  const single=await call(finishShort,{result:singleResult});
  const retry=await call(finishShort,{result:singleResult});
  assert.ok(single.stardust>0);assert.equal(single.profile.stardust,retry.profile.stardust);
  await call('/runs',{...base,species:132},400);
  const saved=(await call('/profile')).profile;
  assert.equal(saved.research[25],5);assert.equal(saved.stardust,single.profile.stardust);
  assert.equal(saved.times['forest-0'].time,600);assert.equal(saved.times['forest-single-stage'].time,100);
  assert.equal(saved.runs[0].mode,'single-stage');assert.equal(saved.counters.runs,2);
  assert.deepEqual(saved.league,[4,16]);assert.deepEqual(saved.shinies,[16]);
});

test('best-time records retain the client object schema and fastest splits',()=>{
 const p=constrainLiteProfile(createProfile('timing'));
 p.times['forest-0']=700;constrainLiteProfile(p);
 assert.deepEqual(p.times['forest-0'],{time:700,splits:[]});
 const r={species:4,biome:'forest',mode:'standard',tier:0,stage:4,victory:true,kills:100,time:600,splits:[100,250,400,600],level:30};
 settleRun(p,r);assert.equal(p.times['forest-0'].time,600);assert.deepEqual(p.times['forest-0'].splits,r.splits);
 settleRun(p,{...r,time:800,splits:[200,400,600,800]});assert.equal(p.times['forest-0'].time,600);assert.deepEqual(p.times['forest-0'].splits,r.splits);
});
test('retired sanctuary GLBs are absent from the source assets',async()=>{
 for(const name of ['sanct_pillar','sanct_gate','shrine']){
  await assert.rejects(fs.access(new URL('../../resources/public/assets/models/'+name+'.glb',import.meta.url)),{code:'ENOENT'});
 }
});
