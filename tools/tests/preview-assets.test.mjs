import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {brotliCompressSync} from 'node:zlib';
import {verifyAssetPackages} from '../build/preview-files.mjs';

function fixture(t){
  const project=fs.mkdtempSync(path.join(os.tmpdir(),'ziling-preview-assets-'));
  t.after(()=>fs.rmSync(project,{recursive:true,force:true}));
  const info={packs:{},rawSizes:{}};
  const save=()=>fs.writeFileSync(path.join(project,'minigame/assets.js'),'module.exports = '+JSON.stringify(info)+';\n');
  function pack(name,raw){
    const packed=brotliCompressSync(Buffer.from(raw));
    const file=path.join(project,'minigame/packs',name,'assets.br');
    fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(file,packed);
    info.packs[name]=createHash('sha256').update(packed).digest('hex').slice(0,16);
    info.rawSizes[name]=Buffer.byteLength(raw);
    return file;
  }
  pack('text','current text package');
  const world=pack('world','current world package');
  save();
  return {project,info,world,save};
}

test('preview checks every archive against the current index and rejects a stale package',t=>{
  const f=fixture(t);
  assert.doesNotThrow(()=>verifyAssetPackages(f.project));
  fs.writeFileSync(f.world,brotliCompressSync(Buffer.from('older world package')));
  assert.throws(()=>verifyAssetPackages(f.project),/资源包版本与清单不一致：packs\/world\/assets\.br/);
});

test('preview re-reads changed metadata and rejects an incorrect decompressed length',t=>{
  const f=fixture(t);
  assert.doesNotThrow(()=>verifyAssetPackages(f.project));
  f.info.rawSizes.text++;
  f.save();
  assert.throws(()=>verifyAssetPackages(f.project),/资源包解压长度与清单不一致：packs\/text\/assets\.br/);
});

test('preview refuses corrupt bytes even if the index hash matches them',t=>{
  const f=fixture(t),bad=Buffer.from([0]);
  fs.writeFileSync(f.world,bad);
  f.info.packs.world=createHash('sha256').update(bad).digest('hex').slice(0,16);
  f.save();
  assert.throws(()=>verifyAssetPackages(f.project),/资源包无法解压：packs\/world\/assets\.br/);
});

test('preview refuses a missing archive',t=>{
  const f=fixture(t);
  fs.unlinkSync(f.world);
  assert.throws(()=>verifyAssetPackages(f.project),/ENOENT/);
});
