import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import codec from '../platform/resource-codec.js';

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

function installer(){
  const {pool,recipes}=models(),data=new Map(),dirs=new Set(),downloads={};
  const archives={world:[['model-parts.bin',pool],['model-map.json',Buffer.from(JSON.stringify(recipes))]],art:[]};
  let failFile=null,yields=0;
  const manager={
    accessSync(p){if(!data.has(p)&&!dirs.has(p))throw Error('ENOENT');},
    mkdirSync(p){dirs.add(p);},
    rmdirSync(p){dirs.delete(p);for(const key of data.keys())if(key.startsWith(p+'/'))data.delete(key);},
    readCompressedFileSync({filePath}){return Uint8Array.of(filePath.includes('world')?1:2,0,0,0).buffer;},
    writeFileSync(p,bytes){if(failFile&&p.endsWith(failFile)){failFile=null;throw Error('simulated disk error');}data.set(p,typeof bytes==='string'?bytes:new Uint8Array(bytes));}
  };
  const info={packs:{world:'1111111111111111',art:'2222222222222222'},rawSizes:{world:4,art:4},files:{},sprites:{}};
  const context={module:{exports:{}},console,Uint8Array,Date,clearTimeout,
    setTimeout:(fn,ms)=>{if(ms===0)yields++;return setTimeout(fn,ms);},
    wx:{env:{USER_DATA_PATH:'/userdata'},getFileSystemManager:()=>manager,loadSubpackage({name,success}){downloads[name]=(downloads[name]||0)+1;queueMicrotask(success);}},
    require(name){if(name==='./assets')return info;if(name==='./resource-codec')return codec;
      if(name==='./resource-runtime')return {decodeText:bytes=>Buffer.from(bytes).toString(),resourceEntries:raw=>archives[new Uint8Array(raw)[0]===1?'world':'art']};
      throw Error(name);}
  };
  vm.runInNewContext(fs.readFileSync(new URL('../platform/files.js',import.meta.url),'utf8'),context);
  return {api:context.module.exports,data,downloads,info,get yields(){return yields;},failNext(file){failFile=file;}};
}
test('install requests coalesce and ready is written only after all models exist',async()=>{
  const fixture=installer(),a=fixture.api.prepareForest(),b=fixture.api.prepareForest();
  await Promise.all([a,b]);
  assert.deepEqual(fixture.downloads,{world:1,art:1});
  const prefix='/userdata/pokebonk-assets/world-'+fixture.info.packs.world+'/';
  assert.equal(fixture.data.get(prefix+'.ready'),fixture.info.packs.world);
  assert.equal([...fixture.data.keys()].filter(k=>k.startsWith(prefix)&&k.endsWith('.glb')).length,11);
  await fixture.api.prepareForest();assert.deepEqual(fixture.downloads,{world:1,art:1});
});
test('an interrupted install has no ready marker and can be retried',async()=>{
  const fixture=installer();fixture.failNext('model-2.glb');
  await assert.rejects(fixture.api.prepareForest(),/simulated disk error/);
  const ready='/userdata/pokebonk-assets/world-'+fixture.info.packs.world+'/.ready';
  assert.ok(!fixture.data.has(ready));
  await fixture.api.prepareForest();assert.ok(fixture.data.has(ready));
  assert.equal(fixture.downloads.world,2);assert.equal(fixture.downloads.art,1);
});
