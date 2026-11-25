import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {brotliDecompressSync} from 'node:zlib';
import {packStream} from '../build/pack-resources.mjs';
import {resourceEntries} from '../build/resource-stream.mjs';
import codec from '../../platform/resource-codec.js';
import {runLoadingSteps} from '../../source/src/performance/loading-work.js';

test('archive filters preserve PCM headers, wrapped 16-bit indices, mesh padding and ordinary files',()=>{
  const samples=Buffer.alloc(16);
  [0,65535,1,32768,32767,2,2,0].forEach((value,i)=>samples.writeUInt16LE(value,2*i));
  const wav=Buffer.concat([Buffer.from('524946460000000057415645666d74201000000001000100c05d000080bb0000020010006461746100000000','hex'),samples]);
  wav.writeUInt32LE(wav.length-8,4);
  wav.writeUInt32LE(samples.length,40);
  const stereo=Buffer.from(wav);
  stereo.writeUInt16LE(2,22);
  const pool=Buffer.concat([Buffer.from([32]),samples,Buffer.from([1,2,3]),samples]);
  const entries={'mono.wav':wav,'stereo.wav':stereo,'model.bin':pool,'mesh.bin':pool,'extra.txt':Buffer.from('text')};
  const ranges=[[1,8],[20,8]];
  const filters={'model.bin':['indices',ranges],'mesh.bin':['mesh',ranges]};
  const packed=packStream(entries,'text',filters);
  const raw=brotliDecompressSync(packed.bytes);
  const manifest=JSON.parse(raw.toString('utf8',4,4+raw.readUInt32LE()));
  assert.deepEqual(manifest.find(([name])=>name==='mono.wav')[2],['pcm16']);
  assert.equal(manifest.find(([name])=>name==='stereo.wav').length,2);
  for(const [name,bytes] of resourceEntries(raw))assert.deepEqual(Buffer.from(bytes),entries[name],name);
  assert.throws(()=>packStream(entries,'world',{'model.bin':['indices',[[1,8],[15,2]]]}),/range/);
});

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

function installer({nativeAsync=true,stalledWrite=false,lockedCache=false,loadSubpackage}={}){
  const {pool,recipes}=models(),data=new Map(),dirs=new Set(),downloads={};
  const archives={world:[['model-parts.bin',pool],['model-map.json',Buffer.from(JSON.stringify(recipes))]],art:[],text:[]};
  let failFile=null,writeError,yields=0,asyncReads=0,syncReads=0,asyncWrites=0,asyncRemovals=0;
  const compressed=filePath=>Uint8Array.of(filePath.includes('world')?1:filePath.includes('text')?3:2,0,0,0).buffer;
  const manager={
    accessSync(p){if(!data.has(p)&&!dirs.has(p))throw Error('ENOENT');},
    mkdirSync(p){dirs.add(p);},
    readdirSync(p){return [...dirs,...data.keys()].filter(d=>d.startsWith(p+'/')&&!d.slice(p.length+1).includes('/')).map(d=>d.slice(p.length+1));},
    unlinkSync(p){data.delete(p);},
    rmdirSync(p){if(lockedCache)throw Error('busy');assert.equal(manager.readdirSync(p).length,0);dirs.delete(p);},
    readCompressedFileSync({filePath}){syncReads++;return compressed(filePath);},
    readFileSync(p){const bytes=data.get(p);if(bytes===undefined)throw Error('ENOENT '+p);return Uint8Array.from(typeof bytes==='string'?Buffer.from(bytes):bytes).buffer;},
    writeFileSync(p,bytes){if(failFile&&p.endsWith(failFile)){failFile=null;throw Error(writeError);}data.set(p,typeof bytes==='string'?bytes:new Uint8Array(bytes));},
    renameSync(from,to){data.set(to,data.get(from));data.delete(from);}
  };
  if(nativeAsync){
    // Reproduce a native recursive deletion that never delivers a callback.
    manager.rmdir=()=>{asyncRemovals++;};
    manager.readCompressedFile=({filePath,success})=>{asyncReads++;queueMicrotask(()=>success({data:compressed(filePath)}));};
    manager.writeFile=({filePath,data:bytes,success,fail})=>{asyncWrites++;if(stalledWrite)return;
      queueMicrotask(()=>{try{manager.writeFileSync(filePath,bytes);success({});}catch(error){fail(error);}});};
  }
  const info={packs:{world:'1111111111111111',art:'2222222222222222',text:'3333333333333333'},rawSizes:{world:4,art:4,text:4},
    files:Object.fromEntries(Object.keys(recipes).map(file=>['assets/models/'+file,'world/'+file])),sprites:{}};
  const context={module:{exports:{}},console,Uint8Array,Date,clearTimeout,
    setTimeout:(fn,ms)=>{if(ms===0)yields++;return setTimeout(fn,ms===30000&&stalledWrite?10:ms);},
    wx:{env:{USER_DATA_PATH:'/userdata'},getFileSystemManager:()=>manager,loadSubpackage(options){
      downloads[options.name]=(downloads[options.name]||0)+1;
      if(loadSubpackage)return loadSubpackage(options);
      queueMicrotask(options.success);
    }},
    require(name){if(name==='./assets')return info;if(name==='./resource-codec')return codec;
      if(name==='./resource-runtime')return {decodeText:bytes=>Buffer.from(bytes).toString(),resourceEntries:raw=>archives[{1:'world',2:'art',3:'text'}[new Uint8Array(raw)[0]]]};
      throw Error(name);}
  };
  vm.runInNewContext(fs.readFileSync(new URL('../../platform/files.js',import.meta.url),'utf8'),context);
  return {api:context.module.exports,data,dirs,downloads,info,get yields(){return yields;},get asyncRemovals(){return asyncRemovals;},
    get io(){return {asyncReads,syncReads,asyncWrites};},failNext(file,message='simulated disk error'){failFile=file;writeError=message;}};
}

test('a cold launch with obsolete archives completes even if recursive deletion never calls back',{timeout:2000},async()=>{
  const f=installer(),base='/userdata/pokebonk-assets';
  const removed=[base+'/sound-aaaaaaaaaaaaaaaa',base+'/music_boss-bbbbbbbbbbbbbbbb',base+'/text-cccccccccccccccc',base+'/art-89c24aead3d2160a'];
  const kept=['/userdata/saves',base+'/player-data',base+'/world-'+f.info.packs.world];
  for(const dir of [...removed,...kept]){f.dirs.add(dir);f.data.set(dir+'/test',new Uint8Array([42]));}
  await f.api.init();
  for(const dir of removed)assert.ok(f.dirs.has(dir));
  assert.equal(await f.api.cleanObsoletePacks(),removed.length);
  assert.equal(f.asyncRemovals,0);
  for(const dir of removed){assert.ok(!f.dirs.has(dir));assert.ok(!f.data.has(dir+'/test'));}
  for(const dir of kept){assert.ok(f.dirs.has(dir));assert.equal(f.data.get(dir+'/test')[0],42);}
  assert.deepEqual(f.downloads,{text:1});
});
test('a locked obsolete cache does not prevent text installation, and byte-only downloads report progress',async()=>{
  const f=installer({lockedCache:true,loadSubpackage({success}){
    return {onProgressUpdate(notify){
      notify({totalBytesWritten:50,totalBytesExpectedToWrite:200});
      queueMicrotask(success);
    }};
  }});
  f.dirs.add('/userdata/pokebonk-assets/text-cccccccccccccccc');
  const progress=[],states=[];
  await f.api.init(percent=>progress.push(percent),state=>states.push(state));
  assert.equal(await f.api.cleanObsoletePacks(),0);
  assert.deepEqual(progress,[25]);
  assert.deepEqual([...new Set(states.map(s=>s.phase))],['download','unpack','write','ready']);
});
test('an already mounted archive installs without requesting the package again',async()=>{
  const f=installer();
  f.data.set('packs/text/assets.br',new Uint8Array(4));
  await f.api.init();
  assert.deepEqual(f.downloads,{});
  assert.ok(f.data.has('/userdata/pokebonk-assets/text-'+f.info.packs.text+'/.ready'));
});
test('a second launch skips downloads, decoding, writes and obsolete cache cleanup until home',async()=>{
  const f=installer(),base='/userdata/pokebonk-assets',old=base+'/world-aaaaaaaaaaaaaaaa';
  f.dirs.add(base);f.dirs.add(old);
  f.data.set(base+'/text-'+f.info.packs.text+'/.ready',f.info.packs.text);
  await f.api.init();
  assert.equal(f.api.diagnostics.packs.text.cached,true);
  assert.deepEqual(f.downloads,{});
  assert.deepEqual(f.io,{asyncReads:0,syncReads:0,asyncWrites:0});
  assert.equal(f.asyncRemovals,0);
  await f.api.preloadForest();
  await f.api.cleanObsoletePacks();
  assert.ok(!f.dirs.has(old));
});
test('a full disk reclaims obsolete pack files and retries the interrupted install once',async()=>{
  const f=installer(),old='/userdata/pokebonk-assets/art-89c24aead3d2160a';
  f.dirs.add(old);f.data.set(old+'/old.webp',new Uint8Array(4));
  f.failNext('model-map.json','ENOSPC: no space left on device');
  await f.api.prepareForest();
  assert.ok(!f.dirs.has(old));
  assert.equal(f.api.diagnostics.packs.world.writes,2);
  assert.equal(f.asyncRemovals,0);
});
test('an archive mounted without a completion callback is picked up during the first download',{timeout:5000},async()=>{
  const f=installer({loadSubpackage(){queueMicrotask(()=>f.data.set('packs/text/assets.br',new Uint8Array(4)));}});
  await f.api.init();
  assert.deepEqual(f.downloads,{text:1});
  assert.ok(f.data.has('/userdata/pokebonk-assets/text-'+f.info.packs.text+'/.ready'));
});
test('download progress resets the ten-second inactivity limit before a single retry',async t=>{
  t.mock.timers.enable({apis:['Date','setTimeout']});
  let notify;
  const f=installer({loadSubpackage({success}){
    if(f.downloads.text===2)queueMicrotask(success);
    return {onProgressUpdate(fn){notify=fn;}};
  }});
  const ready=f.api.loadPackage('text');
  t.mock.timers.tick(9000);
  notify({progress:30});
  t.mock.timers.tick(9999);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.downloads.text,1);
  t.mock.timers.tick(1);
  await new Promise(resolve=>setImmediate(resolve));
  t.mock.timers.tick(500);
  await ready;
  assert.equal(f.downloads.text,2);
});
test('entering during background preparation joins the download and starts the remaining pack',async()=>{
  const pending={};
  const f=installer({loadSubpackage({name,success}){pending[name](success);}});
  const world=new Promise(resolve=>{pending.world=resolve;});
  const art=new Promise(resolve=>{pending.art=resolve;});
  const background=f.api.preloadForest();
  const finishWorld=await world;
  assert.deepEqual(f.downloads,{world:1});
  const entering=f.api.prepareForest();
  const finishArt=await art;
  finishWorld();finishArt();
  await Promise.all([background,entering]);
  assert.deepEqual(f.downloads,{world:1,art:1});
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
  const code=fs.readFileSync(new URL('../../source/src/actors/paper-glyph-art.js',import.meta.url),'utf8')
    .replace(/^import .*;\r?\n/,'const glyphCatalog={};\n').replace(/^import .*;\r?\n/gm,'').replaceAll('export function ','function ');
  vm.runInNewContext(code+'\nthis.load=glyphAtlasReady;',context);
  await assert.rejects(context.load(),/读取超时/);
  assert.equal(images[0].onload,null);
  const retried=context.load();images[1].onload();
  assert.equal(await retried,images[1]);assert.equal(await context.load(),images[1]);
});
