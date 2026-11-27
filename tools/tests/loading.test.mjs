import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {brotliDecompressSync} from 'node:zlib';
import decodeBrotli from 'brotli/decompress.js';
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
  const archives={world:[['model-parts.bin',pool],['model-map.json',Buffer.from(JSON.stringify(recipes))]],art:[],text:[],
    wind:[['wind.webp',Uint8Array.of(4,8,15,16,23,42)]]};
  let failFile=null,writeError,yields=0,asyncReads=0,syncReads=0,asyncWrites=0,asyncRemovals=0;
  const compressed=filePath=>Uint8Array.of(filePath.includes('world')?1:filePath.includes('text')?3:filePath.includes('wind')?4:2,0,0,0).buffer;
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
  const info={packs:{world:'1111111111111111',art:'2222222222222222',text:'3333333333333333',wind:'4444444444444444'},rawSizes:{world:4,art:4,text:4,wind:4},
    files:Object.fromEntries(Object.keys(recipes).map(file=>['assets/models/'+file,'world/'+file])),sprites:{}};
  info.files['assets/vfx/wind-skills.png']='wind/wind.webp';
  info.packRoots=Object.fromEntries(Object.entries(info.packs).map(([name,revision])=>[name,'packs/'+name+'-'+revision]));
  const archive=name=>info.packRoots[name]+'/assets.bin';
  const runtime={decodeText:bytes=>Buffer.from(bytes).toString(),resourceEntries:raw=>archives[{1:'world',2:'art',3:'text',4:'wind'}[new Uint8Array(raw)[0]]],decodeBrotli};
  // Fault cases deliberately warn with errors from another VM realm. Keep
  // those expected logs out of Node's test-worker error serialization.
  const GameGlobal={pokebonkResourcePackages:{}};
  const context={module:{exports:{}},GameGlobal,console:{warn(){},info(){}},Uint8Array,Date,clearTimeout,
    setTimeout:(fn,ms)=>{if(ms===0)yields++;return setTimeout(fn,ms===30000&&stalledWrite?10:ms);},
    wx:{env:{USER_DATA_PATH:'/userdata'},getFileSystemManager:()=>manager,loadSubpackage(options){
      downloads[options.name]=(downloads[options.name]||0)+1;
      if(loadSubpackage)return loadSubpackage(options);
      queueMicrotask(()=>{GameGlobal.pokebonkResourcePackages[options.name]=info.packs[options.name];options.success();});
    }},
    require(name){if(name==='./assets')return info;if(name==='./resource-codec')return codec;
      if(name==='./resource-runtime')return {...runtime,resourceEntries:(...args)=>runtime.resourceEntries(...args),decodeBrotli:(...args)=>runtime.decodeBrotli(...args)};
      throw Error(name);}
  };
  vm.runInNewContext(fs.readFileSync(new URL('../../platform/files.js',import.meta.url),'utf8'),context);
  return {api:context.module.exports,data,dirs,downloads,info,manager,runtime,archive,GameGlobal,get yields(){return yields;},get asyncRemovals(){return asyncRemovals;},
    get io(){return {asyncReads,syncReads,asyncWrites};},failNext(file,message='simulated disk error'){failFile=file;writeError=message;}};
}

test('a cold launch with obsolete archives completes even if recursive deletion never calls back',{timeout:2000},async()=>{
  const f=installer(),base='/userdata/pokebonk-assets';
  const removed=[base+'/sound-aaaaaaaaaaaaaaaa',base+'/music_boss-bbbbbbbbbbbbbbbb',base+'/text-cccccccccccccccc',base+'/art-89c24aead3d2160a',base+'/wind-aaaaaaaaaaaaaaaa'];
  const kept=['/userdata/saves',base+'/player-data',base+'/world-'+f.info.packs.world,base+'/wind-'+f.info.packs.wind];
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
  f.data.set(f.archive('text'),new Uint8Array(4));
  f.GameGlobal.pokebonkResourcePackages.text=f.info.packs.text;
  await f.api.init();
  assert.deepEqual(f.downloads,{});
  assert.ok(f.data.has('/userdata/pokebonk-assets/text-'+f.info.packs.text+'/.ready'));
});

test('file metadata or an old executed entry cannot skip loading the current resource package',async()=>{
  for(const entry of [undefined,'aaaaaaaaaaaaaaaa']){
    const f=installer();
    f.data.set(f.archive('text'),new Uint8Array(4));
    f.GameGlobal.pokebonkResourcePackages.text=entry;
    await f.api.init();
    assert.deepEqual(f.downloads,{text:1});
  }
});

test('a successful load is reusable while the native resource entry is still being scheduled',async()=>{
  const f=realTextInstaller({loadSubpackage({success}){queueMicrotask(success);}});
  f.manager.readCompressedFile=({success})=>success({data:f.raw});
  f.failNext('test.txt');
  await assert.rejects(f.api.init(),/simulated disk error/);
  await f.api.init();
  assert.deepEqual(f.downloads,{text:1});
  assert.deepEqual(Buffer.from(f.data.get(f.installed+'test.txt')),f.contents);
});

test('an obsolete mounted path cannot finish a new revision download timer',async t=>{
  t.mock.timers.enable({apis:['Date','setTimeout']});
  const f=installer({loadSubpackage(){}});
  f.data.set('packs/text/assets.br',new Uint8Array(4));
  f.data.set('packs/text-aaaaaaaaaaaaaaaa/assets.br',new Uint8Array(4));
  let finished=false;
  const ready=f.api.loadPackage('text').then(()=>{finished=true;});
  t.mock.timers.tick(1500);
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(f.downloads,{text:1});
  assert.equal(finished,false,'The old package must not satisfy the availability poll');
  f.data.set(f.archive('text'),new Uint8Array(4));
  f.GameGlobal.pokebonkResourcePackages.text=f.info.packs.text;
  t.mock.timers.tick(1500);
  await ready;
  assert.equal(finished,true,'A mounted current revision still handles a missing callback');
});

test('an obsolete mounted archive cannot suppress retry after a failed download',async t=>{
  t.mock.timers.enable({apis:['Date','setTimeout']});
  const f=installer({loadSubpackage({success,fail}){
    if(f.downloads.text===1)queueMicrotask(()=>fail({errMsg:'temporary network failure'}));
    else {f.data.set(f.archive('text'),new Uint8Array(4));queueMicrotask(success);}
  }});
  f.data.set('packs/text/assets.br',new Uint8Array(4));
  const ready=f.api.loadPackage('text');
  await new Promise(resolve=>setImmediate(resolve));
  t.mock.timers.tick(500);
  await ready;
  assert.deepEqual(f.downloads,{text:2});
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
  const f=installer({loadSubpackage(){queueMicrotask(()=>{
    f.data.set(f.archive('text'),new Uint8Array(4));
    f.GameGlobal.pokebonkResourcePackages.text=f.info.packs.text;
  });}});
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
test('fire entry installs no wind art, while wind entry joins an in-flight background download',async()=>{
  let finishWind,windRequested;
  const requested=new Promise(resolve=>{windRequested=resolve;});
  const f=installer({loadSubpackage({name,success}){
    if(name==='wind'){finishWind=success;windRequested();}
    else queueMicrotask(success);
  }});
  await f.api.init();await f.api.prepareForest();
  assert.deepEqual(f.downloads,{text:1,world:1,art:1});
  const background=f.api.preloadDeferred();
  await requested;
  let entered=false;
  const states=[];
  const entering=f.api.prepareForest(s=>states.push(s),{wind:true}).then(()=>{entered=true;});
  const image=f.api.resolvePath('assets/vfx/wind-skills.png');
  await Promise.resolve();
  assert.equal(entered,false,'Wind entry must wait before starting image decode');
  assert.deepEqual(f.downloads,{text:1,world:1,art:1,wind:1});
  finishWind();
  const [, , file]=await Promise.all([background,entering,image]);
  assert.equal(entered,true);
  assert.deepEqual([...f.data.get(file)],[4,8,15,16,23,42]);
  for(const phase of ['download','unpack','write','ready'])assert.ok(states.some(s=>s.name==='wind'&&s.phase===phase),phase);
  assert.deepEqual(f.downloads,{text:1,world:1,art:1,wind:1});
});

test('wind entry downloads all required packs together and retries a failed deferred installation',async()=>{
  const pending={};
  const f=installer({loadSubpackage({name,success}){pending[name]=success;}});
  f.failNext('wind.webp');
  const entering=f.api.prepareForest(undefined,{wind:true});
  assert.deepEqual(f.downloads,{world:1,art:1,wind:1});
  for(const finish of Object.values(pending))finish();
  await assert.rejects(entering,/simulated disk error/);
  const dir='/userdata/pokebonk-assets/wind-'+f.info.packs.wind+'/';
  assert.ok(!f.data.has(dir+'.ready'));
  const retry=f.api.resolvePath('assets/vfx/wind-skills.png');
  pending.wind();
  assert.equal(await retry,dir+'wind.webp');
  assert.ok(f.data.has(dir+'.ready'));
  assert.deepEqual(f.downloads,{world:1,art:1,wind:2});
  await f.api.preloadDeferred();
  assert.deepEqual(f.downloads,{world:1,art:1,wind:2});
});

test('installed wind art skips downloading and decoding after a process restart',async()=>{
  const f=installer(),dir='/userdata/pokebonk-assets/wind-'+f.info.packs.wind+'/';
  f.dirs.add('/userdata/pokebonk-assets');f.dirs.add(dir.slice(0,-1));
  f.data.set(dir+'.ready',f.info.packs.wind);f.data.set(dir+'wind.webp',Uint8Array.of(9,8,7));
  await f.api.preloadDeferred();
  const file=await f.api.resolvePath('assets/vfx/wind-skills.png');
  assert.equal(file,dir+'wind.webp');assert.deepEqual([...f.data.get(file)],[9,8,7]);
  assert.equal(f.api.diagnostics.packs.wind.cached,true);
  assert.deepEqual(f.downloads,{});assert.deepEqual(f.io,{asyncReads:0,syncReads:0,asyncWrites:0});
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

function realTextInstaller(options){
  const f=installer(options),contents=Buffer.from('开场资源 '.repeat(80));
  const packed=packStream({'test.txt':contents},'text');
  const raw=brotliDecompressSync(packed.bytes);
  f.data.set(f.archive('text'),packed.bytes);
  f.info.rawSizes.text=packed.rawSize;
  f.runtime.resourceEntries=resourceEntries;
  const installed='/userdata/pokebonk-assets/text-'+f.info.packs.text+'/';
  return {...f,contents,packed,raw,installed};
}

test('a cold launch downloads and reads the required revision while old iOS mounts remain',async()=>{
  const f=realTextInstaller({loadSubpackage({success}){
    f.data.set(f.archive('text'),f.packed.bytes);
    queueMicrotask(success);
  }});
  const old=packStream({'old.txt':Buffer.from('previous preview')},'text');
  f.data.delete(f.archive('text'));
  f.data.set('packs/text/assets.br',old.bytes);
  f.data.set('packs/text-aaaaaaaaaaaaaaaa/assets.br',old.bytes);
  const reads=[];
  f.manager.readCompressedFile=({filePath,success})=>{
    reads.push(filePath);success({data:brotliDecompressSync(f.data.get(filePath))});
  };
  await f.api.init();
  assert.deepEqual(f.downloads,{text:1});
  assert.deepEqual(reads,[f.archive('text')]);
  assert.deepEqual(Buffer.from(f.data.get(f.installed+'test.txt')),f.contents);
  assert.ok(!f.data.has(f.installed+'old.txt'));
  assert.ok(f.data.has(f.installed+'.ready'));
});

test('a manifest cannot point a new revision at a legacy or older archive path',async()=>{
  for(const root of [undefined,'packs/text','packs/text-aaaaaaaaaaaaaaaa']){
    const f=installer();f.info.packRoots.text=root;
    f.data.set('packs/text/assets.br',new Uint8Array(4));
    await assert.rejects(f.api.init(),/资源分包版本路径无效 text/);
    assert.ok(![...f.data.keys()].some(file=>file.endsWith('/.ready')));
    assert.deepEqual(f.downloads,{});
  }
});

test('native decompression accepts direct buffers, wrapped buffers and exact binary views',async t=>{
  for(const mode of ['async-direct','async-wrapped','async-view','sync-wrapped','sync-view'])await t.test(mode,async()=>{
    const f=realTextInstaller();
    const padded=new Uint8Array(f.raw.length+16);padded.set(f.raw,7);
    const value=mode.endsWith('view')?new DataView(padded.buffer,7,f.raw.length):f.raw.buffer.slice(f.raw.byteOffset,f.raw.byteOffset+f.raw.byteLength);
    if(mode.startsWith('async')){
      f.manager.readCompressedFile=({success})=>success(mode==='async-direct'?value:{data:value});
      f.manager.readCompressedFileSync=()=>{throw Error('unnecessary sync decode');};
    }else{
      delete f.manager.readCompressedFile;
      f.manager.readCompressedFileSync=()=>mode==='sync-wrapped'?{data:value}:value;
    }
    f.runtime.decodeBrotli=()=>{throw Error('unnecessary JS decode');};
    await f.api.init();
    assert.deepEqual(Buffer.from(f.data.get(f.installed+'test.txt')),f.contents);
  });
});

test('fallback reads compressed or already-expanded files without decoding a payload twice',async t=>{
  for(const expanded of [false,true])for(const wrapped of [false,true])await t.test(JSON.stringify({expanded,wrapped}),async()=>{
    const f=realTextInstaller(),bytes=expanded?f.raw:f.packed.bytes;
    // Both native methods can exist yet return an unusable result.
    f.manager.readCompressedFile=({success})=>success({data:new ArrayBuffer(0)});
    f.manager.readCompressedFileSync=()=>new ArrayBuffer(1);
    const padded=new Uint8Array(bytes.length+9);padded.set(bytes,4);
    f.manager.readFile=({success})=>{
      const view=new DataView(padded.buffer,4,bytes.length);
      success(wrapped?{data:view}:view);
    };
    let decodes=0;
    f.runtime.decodeBrotli=(...args)=>{decodes++;return decodeBrotli(...args);};
    await f.api.init();
    assert.equal(decodes,expanded?0:1);
    assert.deepEqual(Buffer.from(f.data.get(f.installed+'test.txt')),f.contents);
  });
});

test('a device reporting readFile:fail file info not exit recovers through the synchronous reader',async()=>{
  const f=realTextInstaller();
  f.manager.readCompressedFile=({fail})=>fail({errMsg:'readCompressedFile:fail not supported'});
  f.manager.readCompressedFileSync=()=>{throw Error('readCompressedFileSync:fail not supported');};
  f.manager.readFile=({fail})=>fail({errMsg:'readFile:fail file info not exit'});
  await f.api.init();
  assert.deepEqual(Buffer.from(f.data.get(f.installed+'test.txt')),f.contents);
  assert.ok(f.data.has(f.installed+'.ready'));
});

test('an indexed package whose bytes are missing is remounted automatically before retrying',async()=>{
  let loads=0,readable=false;
  const f=realTextInstaller({loadSubpackage({success}){loads++;if(loads===2)readable=true;queueMicrotask(success);}});
  const originalRead=f.manager.readFileSync;
  f.manager.readCompressedFile=({fail})=>fail({errMsg:'readCompressedFile:fail file info not exit'});
  f.manager.readCompressedFileSync=()=>{throw Error('readCompressedFileSync:fail file info not exit');};
  f.manager.readFile=({fail})=>fail({errMsg:'readFile:fail file info not exit'});
  f.manager.readFileSync=p=>{if(!readable)throw Error('readFileSync:fail file info not exit');return originalRead(p);};
  await f.api.init();
  assert.equal(loads,2);
  assert.deepEqual(Buffer.from(f.data.get(f.installed+'test.txt')),f.contents);
  assert.ok(f.data.has(f.installed+'.ready'));
});

test('package file reads support the rooted code-package path without changing user file paths',async()=>{
  const f=realTextInstaller(),read=f.manager.readFileSync,paths=[];
  delete f.manager.readCompressedFile;
  delete f.manager.readCompressedFileSync;
  f.manager.readFile=({filePath,fail})=>{paths.push(filePath);fail({errMsg:'readFile:fail file info not exit'});};
  f.manager.readFileSync=p=>{
    paths.push(p);
    if(p===f.archive('text'))throw Error('readFileSync:fail file info not exit');
    return read(p.startsWith('/packs/')?p.slice(1):p);
  };
  await f.api.init();
  assert.ok(paths.includes('/'+f.archive('text')));
  assert.deepEqual(Buffer.from(f.data.get(f.installed+'test.txt')),f.contents);
});

test('a late file mount after loadSubpackage success is given bounded time to become readable',async()=>{
  const f=realTextInstaller();let readAttempts=0;
  delete f.manager.readCompressedFile;
  delete f.manager.readCompressedFileSync;
  const read=f.manager.readFileSync;
  f.manager.readFile=({fail})=>fail({errMsg:'readFile:fail file info not exit'});
  f.manager.readFileSync=p=>{
    if(++readAttempts<=4)throw Error('readFileSync:fail file info not exit');
    return read(p);
  };
  await f.api.init();
  assert.deepEqual(f.downloads,{text:2});
  assert.equal(f.api.diagnostics.packs.text.readFailures,2);
  assert.deepEqual(Buffer.from(f.data.get(f.installed+'test.txt')),f.contents);
});

test('permanently missing package bytes stop after bounded recovery and remain retryable',async()=>{
  const f=realTextInstaller();
  delete f.manager.readCompressedFile;
  delete f.manager.readCompressedFileSync;
  const read=f.manager.readFileSync;
  f.manager.readFile=({fail})=>fail({errMsg:'readFile:fail file info not exit'});
  f.manager.readFileSync=()=>{throw Error('readFileSync:fail file info not exit');};
  await assert.rejects(f.api.init(),error=>error.message.includes(f.archive('text'))&&error.message.includes('file info not exit'));
  assert.deepEqual(f.downloads,{text:2});
  assert.equal(f.api.diagnostics.packs.text.readFailures,3);
  assert.ok(!f.data.has(f.installed+'.ready'));
  assert.ok(!f.data.has(f.installed+'test.txt'));
  f.manager.readFileSync=read;
  await f.api.init();
  assert.ok(f.data.has(f.installed+'.ready'));
  assert.deepEqual(Buffer.from(f.data.get(f.installed+'test.txt')),f.contents);
});

test('forced remount failure cannot be hidden by stale file metadata and an executed entry',async()=>{
  const f=realTextInstaller({loadSubpackage({fail}){queueMicrotask(()=>fail({errMsg:'remount failed'}));}});
  f.GameGlobal.pokebonkResourcePackages.text=f.info.packs.text;
  delete f.manager.readCompressedFile;
  delete f.manager.readCompressedFileSync;
  f.manager.readFileSync=()=>{throw Error('readFileSync:fail file info not exit');};
  await assert.rejects(f.api.init(),/remount failed/);
  assert.deepEqual(f.downloads,{text:2});
  assert.ok(!f.data.has(f.installed+'.ready'));
});

test('an older mounted archive fails length validation without committing its cache, then retries',async()=>{
  const f=realTextInstaller(),expected=f.info.rawSizes.text;
  const old=packStream({'test.txt':Buffer.from('old')},'text');
  f.data.set(f.archive('text'),old.bytes);
  f.manager.readCompressedFile=({success})=>success({data:brotliDecompressSync(old.bytes)});
  f.manager.readCompressedFileSync=()=>brotliDecompressSync(old.bytes);
  await assert.rejects(f.api.init(),error=>error.message.includes('预期 '+expected)&&error.message.includes('js='+old.rawSize));
  assert.ok(!f.data.has(f.installed+'.ready'));
  assert.ok(!f.data.has(f.installed+'test.txt'));
  f.data.set(f.archive('text'),f.packed.bytes);
  await f.api.init();
  assert.ok(f.data.has(f.installed+'.ready'));
  assert.deepEqual(Buffer.from(f.data.get(f.installed+'test.txt')),f.contents);
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
