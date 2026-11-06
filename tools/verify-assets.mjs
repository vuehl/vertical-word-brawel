import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {brotliDecompressSync} from 'node:zlib';
import sharp from 'sharp';
import index from '../minigame/assets.js';
import codec from '../platform/resource-codec.js';
import {restoreSprite} from './sprite-png.mjs';
import {unpackStream} from './resource-stream.mjs';
import {measureActor} from './actor-metrics.mjs';
import {actorMetrics} from '../source/src/actor-metrics.js';
const root=path.resolve(import.meta.dirname,'..'), pub=path.join(root,'source/public');
const packs={};
const digest=b=>createHash('sha256').update(b).digest('hex');
for(const [group,expected] of Object.entries(index.packs)){
  const raw=fs.readFileSync(path.join(root,'minigame/packs',group,'assets.br'));
  assert.equal(digest(raw).slice(0,16),expected);
  const decoded=brotliDecompressSync(raw);
  assert.equal(decoded.length,index.rawSizes[group]);
  const files=packs[group]=Object.create(null);
  unpackStream(decoded,(name,data)=>{files[name]=data;});
  codec.expandResources(group,{
    read:(name,encoding)=>encoding?Buffer.from(files[name]).toString(encoding):files[name],
    write:(name,data,encoding)=>{files[name]=Buffer.from(data,encoding);}
  });
  if(group==='art')for(const [name,recipe] of Object.entries(index.sprites))files[name]=restoreSprite(files[recipe]);
}
function bytes(key){const [group,file]=index.files[key].split('/');return packs[group][file];}
for(const [key,ref] of Object.entries(index.files)){
  const data=bytes(key);assert.ok(data,'Missing '+key);assert.equal(digest(data).slice(0,16),path.basename(ref,path.extname(ref)));
}
const count={};
assert.equal(Object.keys(index.files).filter(k=>k.startsWith('assets/cries/')).length,0,'Creature cries must not ship');
assert.deepEqual(Object.keys(index.files).filter(k=>k.startsWith('locale/')),['locale/zh.json']);
assert.deepEqual(Object.keys(index.files).filter(k=>k.startsWith('data/i18n/')),['data/i18n/zh.json']);
assert.equal(Object.keys(index.sprites).length,0,'Actor atlases must not be reconstructed on the phone');
for(const id of [...Array.from({length:151},(_,i)=>i+1),201]){
  assert.ok(!index.files['assets/pmd/'+id+'.png'],'Legacy actor atlas must not ship: '+id);
  const file='assets/pmd/'+id+'.png',override=path.join(pub,'overrides',file);
  const meta=JSON.parse(fs.readFileSync(path.join(pub,'data/sprites.json')))[id];
  assert.deepEqual(actorMetrics[id],await measureActor(fs.existsSync(override)?override:path.join(pub,file),meta,id),'Actor collision bounds: '+id);
}
for(const category of ['portraits','icons']){
  count[category]=0;
  for(let n=1;n<=151;n++){
    const key='assets/'+category+'/'+n+'.png';
    const source=fs.existsSync(path.join(pub,'overrides',key))?path.join(pub,'overrides',key):path.join(pub,key);
    const decode=b=>sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const [a,b]=await Promise.all([decode(source),decode(bytes(key))]);
    assert.deepEqual(a.info,b.info,key);
    for(let i=0;i<a.data.length;i+=4){
      if(a.data[i+3]!==b.data[i+3]||(a.data[i+3]&&a.data.readUIntBE(i,3)!==b.data.readUIntBE(i,3)))throw Error('Changed visible pixel: '+key+' @ '+i/4);
    }
    count[category]++;
  }
}
const models=Object.keys(index.files).filter(k=>k.startsWith('assets/models/'));
for(const key of models)assert.equal(digest(bytes(key)),digest(fs.readFileSync(fs.existsSync(path.join(pub,'overrides',key))?path.join(pub,'overrides',key):path.join(pub,key))),key);
for(const key of Object.keys(index.files).filter(k=>k.startsWith('data/')||k.startsWith('assets/env/'))) {
  const source=fs.existsSync(path.join(pub,'overrides',key))?path.join(pub,'overrides',key):path.join(pub,key);
  if(!key.endsWith('.png'))assert.equal(digest(bytes(key)),digest(fs.readFileSync(source)),key);
}
const report={mappedResources:Object.keys(index.files).length,RGBA:count,originalModels:models.length,
  actorBoundsVerified:152,cries:0,locales:['zh'],legacyActorAtlases:0,
  altarGlyphIncluded:!!actorMetrics[201],allArchiveHashesVerified:true};
const out=path.join(root,'验收');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'资源核验.json'),JSON.stringify(report,null,2));
console.log(report);
