import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {brotliCompressSync} from 'node:zlib';
import {buildHashes} from '../build/preview-files.mjs';
import {createPreviewSnapshot,verifyPreviewSnapshot} from '../build/preview-snapshot.mjs';

function fixture(t){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ziling-preview-snapshot-'));
  t.after(()=>{
    assert.ok(path.resolve(temp).startsWith(path.resolve(os.tmpdir())+path.sep));
    fs.rmSync(temp,{recursive:true,force:true});
  });
  const project=path.join(temp,'source'),output=path.join(project,'验收/手机预览');
  fs.mkdirSync(path.join(project,'minigame'),{recursive:true});
  const raw=Buffer.from('verified text and opening'),packed=brotliCompressSync(raw);
  const revision=createHash('sha256').update(packed).digest('hex').slice(0,16),root='packs/text-'+revision;
  fs.mkdirSync(path.join(project,'minigame',root),{recursive:true});
  fs.writeFileSync(path.join(project,'minigame',root,'assets.bin'),packed);
  fs.writeFileSync(path.join(project,'minigame',root,'game.js'),'// text '+revision);
  fs.writeFileSync(path.join(project,'minigame/assets.js'),'module.exports = '+JSON.stringify({
    packs:{text:revision},rawSizes:{text:raw.length},packRoots:{text:root}})+';\n');
  fs.writeFileSync(path.join(project,'minigame/game.json'),JSON.stringify({subpackages:[{name:'text',root}]}));
  fs.writeFileSync(path.join(project,'minigame/game.js'),'// compiled game');
  const config={miniprogramRoot:'minigame/',appid:'wxfixture',compileType:'game',projectname:'开发测试（独立存档）',setting:{es6:false}};
  fs.writeFileSync(path.join(project,'project.config.json'),JSON.stringify(config,null,2));
  fs.writeFileSync(path.join(project,'private-source.js'),'must not ship');
  return {project,output,config};
}

test('snapshot has exactly the compiled game and unchanged release/developer project config',t=>{
  const f=fixture(t),snapshot=createPreviewSnapshot({sourceProject:f.project,output:f.output,stamp:123});
  assert.equal(snapshot.sourceProject,fs.realpathSync(f.project));
  assert.match(path.basename(snapshot.snapshotProject),/^工程快照-123-/);
  assert.deepEqual(fs.readdirSync(snapshot.snapshotProject).sort(),['minigame','project.config.json']);
  assert.deepEqual(buildHashes(snapshot.snapshotProject),snapshot.hashes);
  assert.deepEqual(snapshot.hashes,buildHashes(f.project));
  assert.equal(fs.readFileSync(path.join(snapshot.snapshotProject,'project.config.json'),'utf8'),
    fs.readFileSync(path.join(f.project,'project.config.json'),'utf8'));
  assert.doesNotThrow(()=>verifyPreviewSnapshot(snapshot));
});

test('same timestamp gets unique projects and earlier snapshots remain untouched',t=>{
  const f=fixture(t),first=createPreviewSnapshot({sourceProject:f.project,output:f.output,stamp:'same'});
  const second=createPreviewSnapshot({sourceProject:f.project,output:f.output,stamp:'same'});
  assert.notEqual(first.snapshotProject,second.snapshotProject);
  assert.equal(fs.readdirSync(f.output).length,2);
  assert.doesNotThrow(()=>verifyPreviewSnapshot(first));
});

test('a source change during copying rejects the mixed snapshot and preserves it for diagnosis',t=>{
  const f=fixture(t);let changed=false;
  assert.throws(()=>createPreviewSnapshot({sourceProject:f.project,output:f.output,copyFile(from,to){
    fs.copyFileSync(from,to);
    if(!changed){changed=true;fs.appendFileSync(path.join(f.project,'minigame/game.js'),'\n// concurrent rebuild');}
  }}),/复制预览快照期间运行包发生变化/);
  assert.equal(fs.readdirSync(f.output).length,1,'Do not remove existing or failed snapshot directories');
});

test('later source edits cannot mutate a frozen snapshot, but edits to the snapshot invalidate its QR',t=>{
  const f=fixture(t),snapshot=createPreviewSnapshot({sourceProject:f.project,output:f.output});
  fs.appendFileSync(path.join(f.project,'minigame/game.js'),'\n// next user edit');
  assert.doesNotThrow(()=>verifyPreviewSnapshot(snapshot));
  fs.appendFileSync(path.join(snapshot.snapshotProject,'minigame/game.js'),'\n// unexpected snapshot edit');
  assert.throws(()=>verifyPreviewSnapshot(snapshot),/预览快照发生变化/);
});

test('snapshot config changes and corrupted copies are rejected',t=>{
  const f=fixture(t),snapshot=createPreviewSnapshot({sourceProject:f.project,output:f.output});
  fs.appendFileSync(path.join(snapshot.snapshotProject,'project.config.json'),'\n');
  assert.throws(()=>verifyPreviewSnapshot(snapshot),/预览快照发生变化/);
  assert.throws(()=>createPreviewSnapshot({sourceProject:f.project,output:f.output,copyFile(from,to){
    fs.copyFileSync(from,to);if(from.endsWith('game.js'))fs.appendFileSync(to,'corrupt');
  }}),/预览快照发生变化/);
});

test('unsafe outputs and project roots are rejected without recursively copying the checkout',t=>{
  const f=fixture(t);
  assert.throws(()=>createPreviewSnapshot({sourceProject:f.project,output:path.join(f.project,'minigame/snapshots')}),/运行包目录之外/);
  assert.throws(()=>createPreviewSnapshot({sourceProject:f.project,output:f.output,stamp:'../../elsewhere'}),/Invalid preview snapshot stamp/);
  fs.writeFileSync(path.join(f.project,'project.config.json'),JSON.stringify({...f.config,miniprogramRoot:'../outside'}));
  assert.throws(()=>createPreviewSnapshot({sourceProject:f.project,output:f.output}),/miniprogramRoot/);
});

test('linked input files are refused instead of freezing external mutable content',t=>{
  const f=fixture(t),target=path.join(f.project,'minigame/link.js');
  try{fs.symlinkSync(path.join(f.project,'private-source.js'),target,'file');}
  catch(error){if(error.code==='EPERM'){t.skip('Symlink privilege unavailable');return;}throw error;}
  assert.throws(()=>createPreviewSnapshot({sourceProject:f.project,output:f.output}),/普通文件/);
});
