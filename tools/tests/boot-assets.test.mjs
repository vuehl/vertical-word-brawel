import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {brotliDecompressSync} from 'node:zlib';
import {addBootAssets} from '../build/boot-assets.mjs';
import {packStream} from '../build/pack-resources.mjs';
import {resourceEntries} from '../build/resource-stream.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex').slice(0,16);
const entryName=(key,bytes)=>hash(bytes)+path.extname(key);

function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'pokebonk-boot-assets-'));
  const directory=path.join(root,'packs/text'),manifest=path.join(root,'assets.js');
  fs.mkdirSync(directory,{recursive:true});
  t.after(()=>{
    assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('pokebonk-boot-assets-'));
    fs.rmSync(root,{recursive:true,force:true});
  });
  function publish(files,legacy=false){
    const entries=Object.fromEntries(Object.entries(files).map(([key,bytes])=>[entryName(key,bytes),bytes]));
    const {bytes,rawSize}=packStream(entries,'text'),revision=hash(bytes);
    const info={packs:{text:revision},rawSizes:{text:rawSize},archiveFiles:{text:legacy?'assets.br':'assets-'+revision+'.br'},
      files:Object.fromEntries(Object.entries(files).map(([key,data])=>[key,'text/'+entryName(key,data)]))};
    fs.writeFileSync(path.join(directory,info.archiveFiles.text),bytes);
    fs.writeFileSync(manifest,'module.exports = '+JSON.stringify(info)+';\n');
    return info;
  }
  function read(){
    const info=JSON.parse(fs.readFileSync(manifest,'utf8').replace(/^module.exports\s*=\s*/,'').replace(/;\s*$/,''));
    const bytes=fs.readFileSync(path.join(directory,info.archiveFiles.text));
    const raw=brotliDecompressSync(bytes);
    assert.equal(hash(bytes),info.packs.text);
    assert.equal(raw.length,info.rawSizes.text);
    const entries=Object.fromEntries([...resourceEntries(raw)].map(([name,data])=>[name,Buffer.from(data)]));
    const files=Object.fromEntries(Object.entries(info.files).map(([key,name])=>[key,entries[name.slice('text/'.length)]]));
    return {info,bytes,entries,files};
  }
  function assertCurrentOnly(){
    const {info}=read();
    assert.equal(info.archiveFiles.text,'assets-'+info.packs.text+'.br');
    assert.deepEqual(fs.readdirSync(directory),[info.archiveFiles.text]);
    assert.ok(!fs.existsSync(manifest+'.next'));
  }
  return {root,directory,manifest,publish,read,assertCurrentOnly};
}

test('incremental boot assets migrate the fixed archive name even when payloads are unchanged',t=>{
  const f=fixture(t),assets={'engine/styles.json':Buffer.from('[]')};
  f.publish(assets,true);
  addBootAssets(f.root,assets);
  f.assertCurrentOnly();
  assert.deepEqual(f.read().files,assets);
});

test('successive boot updates use the latest disk manifest and remove superseded text archives',t=>{
  const f=fixture(t),keep=Buffer.from('{"saved":true}');
  f.publish({'data/keep.json':keep,'engine/styles.json':Buffer.from('[]'),'assets/ui-paper/old.webp':Buffer.from('old')});
  const assets={'engine/styles.json':Buffer.from('["first"]'),'assets/ui-paper/new.webp':Buffer.from('new')};
  addBootAssets(f.root,assets);
  f.assertCurrentOnly();
  assert.deepEqual(f.read().files,{'data/keep.json':keep,...assets});

  // Simulate a full asset rebuild between two updates in the same Node process.
  const external=Buffer.from('{"rebuilt":true}');
  f.publish({...f.read().files,'data/rebuilt.json':external});
  const second={'engine/styles.json':Buffer.from('["second"]')};
  addBootAssets(f.root,second);
  f.assertCurrentOnly();
  const result=f.read();
  assert.deepEqual(result.files,{'data/keep.json':keep,'data/rebuilt.json':external,...second});
  assert.equal(Object.keys(result.entries).length,3,'Removed and replaced assets must not remain in the stream');
  const before=fs.readFileSync(f.manifest),archive=result.bytes;
  addBootAssets(f.root,second);
  assert.deepEqual(fs.readFileSync(f.manifest),before);
  assert.deepEqual(f.read().bytes,archive);
  f.assertCurrentOnly();
});

test('a failed manifest publish preserves the previous complete boot archive for retry',t=>{
  const f=fixture(t),original=f.publish({'engine/styles.json':Buffer.from('[]')});
  const assets={'engine/styles.json':Buffer.from('["updated"]')};
  const rename=fs.renameSync;
  const mocked=t.mock.method(fs,'renameSync',(from,to)=>{
    if(to===f.manifest)throw Error('simulated manifest write failure');
    return rename(from,to);
  });
  assert.throws(()=>addBootAssets(f.root,assets),/simulated manifest write failure/);
  mocked.mock.restore();
  assert.deepEqual(f.read().info,original);
  assert.ok(!fs.existsSync(f.manifest+'.next'));
  assert.ok(fs.readdirSync(f.directory).every(name=>!name.endsWith('.next')));
  addBootAssets(f.root,assets);
  f.assertCurrentOnly();
  assert.deepEqual(f.read().files,assets);
});
