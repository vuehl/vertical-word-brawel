import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import codec from '../platform/resource-codec.js';
import {runLoadingSteps} from '../source/src/loading-work.js';

function models(){
  const pool=Uint8Array.from([3,5,7,11,13,17,19,23]);
  const recipes=Object.fromEntries(Array.from({length:11},(_,i)=>['model-'+i+'.glb',[[i%4,3],[0,2],[6,2]]]));
  return {pool,recipes,read:name=>name==='model-parts.bin'?pool:JSON.stringify(recipes)};
}
test('cooperative model expansion preserves every byte and yields between batches',async()=>{
  const {read}=models(),sync=new Map(),asyncFiles=new Map();let yields=0,previous=0;
  codec.expandResources('world',{read,write:(name,bytes)=>sync.set(name,new Uint8Array(bytes))});
  await codec.expandResourcesAsync('world',{read,write:(name,bytes)=>asyncFiles.set(name,new Uint8Array(bytes))},{now:()=>0,yieldTask:async()=>{
    assert.ok(asyncFiles.size-previous<=4,'No more than four large copies in one task');previous=asyncFiles.size;yields++;
  }});
  assert.equal(yields,2);assert.deepEqual(asyncFiles,sync);
  let clock=0,timedYields=0;
  await codec.expandResourcesAsync('world',{read,write:()=>{clock+=7;}},{now:()=>clock,yieldTask:async()=>{timedYields++;}});
  assert.equal(timedYields,11,'The time budget can yield before the four-file limit');
});

function installer({nativeAsync=true,stalledWrite=false}={}){
  const {pool,recipes}=models(),data=new Map(),dirs=new Set(),downloads={};
  const archives={world:[['model-parts.bin',pool],['model-map.json',Buffer.from(JSON.stringify(recipes))]],art:[],text:[]};
  let failFile=null,yields=0,asyncReads=0,syncReads=0,asyncWrites=0;
  const compressed=filePath=>Uint8Array.of(filePath.includes('world')?1:filePath.includes('text')?3:2,0,0,0).buffer;
  const manager={
    accessSync(p){if(!data.has(p)&&!dirs.has(p))throw Error('ENOENT');},
    mkdirSync(p){dirs.add(p);},
    readdirSync(p){return [...dirs].filter(d=>d.startsWith(p+'/')&&!d.slice(p.length+1).includes('/')).map(d=>d.slice(p.length+1));},
    rmdirSync(p){dirs.delete(p);for(const key of data.keys())if(key.startsWith(p+'/'))data.delete(key);},
    readCompressedFileSync({filePath}){syncReads++;return compressed(filePath);},
    readFileSync(p){const bytes=data.get(p);if(bytes===undefined)throw Error('ENOENT '+p);return Uint8Array.from(typeof bytes==='string'?Buffer.from(bytes):bytes).buffer;},
    writeFileSync(p,bytes){if(failFile&&p.endsWith(failFile)){failFile=null;throw Error('simulated disk error');}data.set(p,typeof bytes==='string'?bytes:new Uint8Array(bytes));},
    renameSync(from,to){data.set(to,data.get(from));data.delete(from);}
  };
  if(nativeAsync){
    manager.readCompressedFile=({filePath,success})=>{asyncReads++;queueMicrotask(()=>success({data:compressed(filePath)}));};
    manager.writeFile=({filePath,data:bytes,success,fail})=>{asyncWrites++;if(stalledWrite)return;
      queueMicrotask(()=>{try{manager.writeFileSync(filePath,bytes);success({});}catch(error){fail(error);}});};
  }
  const info={packs:{world:'1111111111111111',art:'2222222222222222',text:'3333333333333333'},rawSizes:{world:4,art:4,text:4},
    files:Object.fromEntries(Object.keys(recipes).map(file=>['assets/models/'+file,'world/'+file])),sprites:{}};
  const context={module:{exports:{}},console,Uint8Array,Date,clearTimeout,
    setTimeout:(fn,ms)=>{if(ms===0)yields++;return setTimeout(fn,ms===30000&&stalledWrite?10:ms);},
    wx:{env:{USER_DATA_PATH:'/userdata'},getFileSystemManager:()=>manager,loadSubpackage({name,success}){downloads[name]=(downloads[name]||0)+1;queueMicrotask(success);}},
    require(name){if(name==='./assets')return info;if(name==='./resource-codec')return codec;
      if(name==='./resource-runtime')return {decodeText:bytes=>Buffer.from(bytes).toString(),resourceEntries:raw=>archives[{1:'world',2:'art',3:'text'}[new Uint8Array(raw)[0]]]};
      throw Error(name);}
  };
  vm.runInNewContext(fs.readFileSync(new URL('../platform/files.js',import.meta.url),'utf8'),context);
  return {api:context.module.exports,data,dirs,downloads,info,get yields(){return yields;},
    get io(){return {asyncReads,syncReads,asyncWrites};},failNext(file){failFile=file;}};
}

test('removed music caches are evicted without touching saves or current resources',async()=>{
  const f=installer(),base='/userdata/pokebonk-assets';
  const removed=[base+'/sound-aaaaaaaaaaaaaaaa',base+'/music_boss-bbbbbbbbbbbbbbbb',base+'/text-cccccccccccccccc'];
  const kept=['/userdata/saves',base+'/player-data',base+'/world-'+f.info.packs.world];
  for(const dir of [...removed,...kept]){f.dirs.add(dir);f.data.set(dir+'/test',new Uint8Array([42]));}
  await f.api.init();
  for(const dir of removed){assert.ok(!f.dirs.has(dir));assert.ok(!f.data.has(dir+'/test'));}
  for(const dir of kept){assert.ok(f.dirs.has(dir));assert.equal(f.data.get(dir+'/test')[0],42);}
  assert.deepEqual(f.downloads,{text:1});
});
test('native async installs coalesce, report progress and leave unused models on disk as recipes',async()=>{
  const fixture=installer(),progressA=[],progressB=[];
  const a=fixture.api.prepareForest(s=>progressA.push(s)),b=fixture.api.prepareForest(s=>progressB.push(s));
  await Promise.all([a,b]);
  assert.deepEqual(fixture.downloads,{world:1,art:1});
  const prefix='/userdata/pokebonk-assets/world-'+fixture.info.packs.world+'/';
  assert.equal(fixture.data.get(prefix+'.ready'),fixture.info.packs.world);
  assert.equal([...fixture.data.keys()].filter(k=>k.endsWith('.glb')).length,0);
  assert.ok(fixture.data.has(prefix+'model-parts.bin'));assert.ok(fixture.data.has(prefix+'model-map.json'));
  assert.equal(fixture.io.asyncReads,2);assert.equal(fixture.io.syncReads,0);assert.equal(fixture.io.asyncWrites,2);
  for(const events of [progressA,progressB])for(const phase of ['download','unpack','write','ready'])assert.ok(events.some(s=>s.phase===phase),phase);
  await fixture.api.prepareForest();assert.deepEqual(fixture.downloads,{world:1,art:1});
});
test('an interrupted install has no ready marker and can be retried',async()=>{
  const fixture=installer();fixture.failNext('model-map.json');
  await assert.rejects(fixture.api.prepareForest(),/simulated disk error/);
  const ready='/userdata/pokebonk-assets/world-'+fixture.info.packs.world+'/.ready';
  assert.ok(!fixture.data.has(ready));
  await fixture.api.prepareForest();assert.ok(fixture.data.has(ready));
  assert.equal(fixture.downloads.world,2);assert.equal(fixture.downloads.art,1);
});

test('models restore on demand with identical bytes, coalesce, and retry failed writes',async()=>{
  const fixture=installer();await fixture.api.prepareForest();
  const url='assets/models/model-2.glb';fixture.failNext('model-2.glb.next');
  await assert.rejects(fixture.api.resolvePath(url),/simulated disk error/);
  assert.equal(fixture.api.diagnostics.modelsRestored,0);
  const paths=await Promise.all([fixture.api.resolvePath(url),fixture.api.resolvePath(url)]);
  assert.equal(paths[0],paths[1]);assert.equal(fixture.api.diagnostics.modelsRestored,1);
  assert.deepEqual([...fixture.data.get(paths[0])],[7,11,13,3,5,19,23]);
  await fixture.api.resolvePath(url);assert.equal(fixture.api.diagnostics.modelsRestored,1);
  assert.equal([...fixture.data.keys()].filter(k=>k.endsWith('.glb')).length,1);
});

test('older native file APIs can still install and materialize a model',async()=>{
  const fixture=installer({nativeAsync:false});await fixture.api.prepareForest();
  const file=await fixture.api.resolvePath('assets/models/model-0.glb');
  assert.equal(fixture.io.syncReads,2);assert.ok(fixture.data.has(file));assert.ok(fixture.yields>0);
});

test('previously installed models work without recipes or another download',async()=>{
  const fixture=installer(),prefix='/userdata/pokebonk-assets/world-'+fixture.info.packs.world+'/';
  fixture.data.set(prefix+'.ready',fixture.info.packs.world);
  fixture.data.set(prefix+'model-0.glb',Uint8Array.of(3,5,7,3,5,19,23));
  assert.equal(await fixture.api.resolvePath('assets/models/model-0.glb'),prefix+'model-0.glb');
  assert.deepEqual(fixture.downloads,{});assert.equal(fixture.api.diagnostics.modelsRestored,0);
});

test('a missing native write callback times out without marking a partial cache ready',async()=>{
  const fixture=installer({stalledWrite:true});
  await assert.rejects(fixture.api.prepareForest(),/保存超时/);
  assert.ok(![...fixture.data.keys()].some(k=>k.endsWith('/.ready')&&k.includes('/world-')));
});

test('model recipes reject out of bounds data instead of silently producing corrupt GLBs',()=>{
  assert.throws(()=>codec.restoreModel(new Uint8Array(8),[[7,2]]),/损坏/);
  assert.throws(()=>codec.restoreModel(new Uint8Array(8),undefined),/缺失/);
});

test('scene work gives timers a turn and stops disposed runs between batches',async()=>{
  let count=0,timerRan=false;setTimeout(()=>{timerRan=true;},0);
  function* steps(){for(let i=0;i<30;i++){count++;yield;}}
  const stats=await runLoadingSteps(steps(),{maxSteps:3,onProgress:()=>{if(count>3)assert.ok(timerRan);}});
  assert.equal(count,30);assert.ok(stats.yields>=10);
  count=0;let cancelled=false;setTimeout(()=>{cancelled=true;},0);
  await assert.rejects(runLoadingSteps(steps(),{maxSteps:3,check:()=>{if(cancelled)throw Error('disposed');}}),/disposed/);
  assert.equal(count,3);
});

test('a native atlas image with no callback times out and can be loaded on retry',async()=>{
  const images=[];
  const context={Image:class {constructor(){images.push(this);}},clearTimeout,
    setTimeout:(fn,ms)=>setTimeout(fn,ms===12000?10:ms),
  };
  const code=fs.readFileSync(new URL('../source/src/paper-glyph-art.js',import.meta.url),'utf8')
    .replace(/^import .*;\r?\n/gm,'').replaceAll('export function ','function ');
  vm.runInNewContext(code+'\nthis.load=glyphAtlasReady;',context);
  await assert.rejects(context.load(),/读取超时/);
  assert.equal(images[0].onload,null);
  const retried=context.load();images[1].onload();
  assert.equal(await retried,images[1]);assert.equal(await context.load(),images[1]);
});
