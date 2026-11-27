import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {brotliCompressSync} from 'node:zlib';
import {verifyAssetPackages,verifyPreviewResult} from '../build/preview-files.mjs';

function fixture(t){
  const project=fs.mkdtempSync(path.join(os.tmpdir(),'ziling-preview-assets-'));
  t.after(()=>fs.rmSync(project,{recursive:true,force:true}));
  const info={packs:{},rawSizes:{},packRoots:{}},config={subpackages:[]};
  const save=()=>{
    fs.writeFileSync(path.join(project,'minigame/assets.js'),'module.exports = '+JSON.stringify(info)+';\n');
    fs.writeFileSync(path.join(project,'minigame/game.json'),JSON.stringify(config));
  };
  function pack(name,raw){
    const packed=brotliCompressSync(Buffer.from(raw));
    info.packs[name]=createHash('sha256').update(packed).digest('hex').slice(0,16);
    info.packRoots[name]='packs/'+name+'-'+info.packs[name];
    config.subpackages.push({name,root:info.packRoots[name]});
    const file=path.join(project,'minigame',info.packRoots[name],'assets.bin');
    fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(file,packed);
    fs.writeFileSync(path.join(path.dirname(file),'game.js'),'// Resource subpackage.\n');
    info.rawSizes[name]=Buffer.byteLength(raw);
    return file;
  }
  pack('text','current text package');
  const world=pack('world','current world package');
  save();
  return {project,info,config,world,save};
}

test('preview checks every archive against the current index and rejects a stale package',t=>{
  const f=fixture(t);
  assert.doesNotThrow(()=>verifyAssetPackages(f.project));
  fs.writeFileSync(f.world,brotliCompressSync(Buffer.from('older world package')));
  assert.throws(()=>verifyAssetPackages(f.project),/资源包版本与清单不一致：packs\/world-[a-f0-9]{16}\/assets\.bin/);
});

test('preview re-reads changed metadata and rejects an incorrect decompressed length',t=>{
  const f=fixture(t);
  assert.doesNotThrow(()=>verifyAssetPackages(f.project));
  f.info.rawSizes.text++;
  f.save();
  assert.throws(()=>verifyAssetPackages(f.project),/资源包解压长度与清单不一致：packs\/text-[a-f0-9]{16}\/assets\.bin/);
});

test('preview refuses corrupt bytes even if the index hash matches them',t=>{
  const f=fixture(t),bad=Buffer.from([0]);
  fs.writeFileSync(f.world,bad);
  f.info.packs.world=createHash('sha256').update(bad).digest('hex').slice(0,16);
  f.info.packRoots.world='packs/world-'+f.info.packs.world;
  f.config.subpackages.find(pack=>pack.name==='world').root=f.info.packRoots.world;
  fs.renameSync(path.dirname(f.world),path.join(f.project,'minigame',f.info.packRoots.world));
  f.save();
  assert.throws(()=>verifyAssetPackages(f.project),/资源包无法解压：packs\/world-[a-f0-9]{16}\/assets\.bin/);
});

test('preview refuses a missing archive',t=>{
  const f=fixture(t);
  fs.unlinkSync(f.world);
  assert.throws(()=>verifyAssetPackages(f.project),/ENOENT/);
});

test('preview refuses a missing or non-file subpackage entry before upload',t=>{
  const f=fixture(t),entry=path.join(path.dirname(f.world),'game.js');
  fs.unlinkSync(entry);
  assert.throws(()=>verifyAssetPackages(f.project),/资源分包入口缺失：packs\/world-[a-f0-9]{16}\/game\.js/);
  fs.mkdirSync(entry);
  assert.throws(()=>verifyAssetPackages(f.project),/资源分包入口缺失/);
});

test('preview refuses an unversioned or wrong-version resource root',t=>{
  const f=fixture(t);
  for(const root of ['packs/text','packs/text-0000000000000000']){
    f.info.packRoots.text=root;
    f.save();
    assert.throws(()=>verifyAssetPackages(f.project),/资源包路径与版本不一致：text/);
  }
});

test('preview refuses stale or duplicate subpackage declarations',t=>{
  const f=fixture(t),text=f.config.subpackages.find(pack=>pack.name==='text');
  text.root='packs/text';f.save();
  assert.throws(()=>verifyAssetPackages(f.project),/资源分包声明与清单不一致：text/);
  text.root=f.info.packRoots.text;
  f.config.subpackages.push({...text});f.save();
  assert.throws(()=>verifyAssetPackages(f.project),/资源分包声明与清单不一致：text/);
});

test('preview refuses leftover canonical directories even beside valid versioned packages',t=>{
  const f=fixture(t);
  fs.mkdirSync(path.join(f.project,'minigame/packs/text'));
  assert.throws(()=>verifyAssetPackages(f.project),/仍存在旧的固定资源包路径：packs\/text/);
});

function previewResult(f){
  const packages=[{name:'main',size:1024},...f.config.subpackages.map(pack=>({
    name:'/'+pack.root+'/',size:fs.statSync(path.join(f.project,'minigame',pack.root,'assets.bin')).size+128
  }))];
  const total=packages.reduce((sum,pack)=>sum+pack.size,0);
  return {size:{total,packages:[{name:'TOTAL',size:total},...packages]}};
}

test('uploaded preview accepts current roots and archives, independent of report order',t=>{
  const f=fixture(t),preview=previewResult(f);
  preview.size.packages.reverse();
  assert.doesNotThrow(()=>verifyPreviewResult(f.project,preview));
});

test('uploaded preview refuses stale roots, missing packages and duplicate entries',t=>{
  const f=fixture(t);
  for(const change of [
    preview=>{preview.size.packages[2].name='/packs/text-0000000000000000/';},
    preview=>{preview.size.packages.pop();},
    preview=>{preview.size.packages.push({...preview.size.packages[2]});}
  ]){
    const preview=previewResult(f);change(preview);
    assert.throws(()=>verifyPreviewResult(f.project,preview),/预览分包清单仍是旧版或不完整/);
  }
});

test('uploaded preview refuses omitted archive payload even with correct roots and positive sizes',t=>{
  const f=fixture(t),preview=previewResult(f);
  const pack=preview.size.packages.find(pack=>pack.name==='/'+f.info.packRoots.world+'/');
  const previous=pack.size;
  pack.size=fs.statSync(f.world).size-1;
  preview.size.total-=previous-pack.size;
  preview.size.packages.find(pack=>pack.name==='TOTAL').size=preview.size.total;
  assert.throws(()=>verifyPreviewResult(f.project,preview),/预览资源分包内容缺失：packs\/world-[a-f0-9]{16}\/assets\.bin/);
});

test('uploaded preview refuses malformed or inconsistent size reports',t=>{
  const f=fixture(t);
  for(const preview of [undefined,{}, {size:{total:1}}, {size:{total:0,packages:[]}}])
    assert.throws(()=>verifyPreviewResult(f.project,preview),/微信预览结果不完整/);
  for(const invalid of [undefined,0,-1,NaN,Infinity,1.5,'1000']){
    const preview=previewResult(f);preview.size.packages[2].size=invalid;
    assert.throws(()=>verifyPreviewResult(f.project,preview),/分包大小无效/);
  }
  const preview=previewResult(f);preview.size.total++;
  assert.throws(()=>verifyPreviewResult(f.project,preview),/总包大小不一致/);
});
