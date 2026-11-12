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
import {assetPolicyVersion,excludedAssetReason,musicTracks} from './asset-policy.mjs';
import {biomes,events,roster} from '../source/src/catalogs.js';
import {resolveItemIcon} from '../source/src/item-icons.js';
import {glyphSpeciesFromImage} from '../source/src/zixing-identity.js';
import {runtimeData,runtimeSpecies} from './runtime-data.mjs';
const root=path.resolve(import.meta.dirname,'..'), pub=path.join(root,'source/public');
const packs={};
const digest=b=>createHash('sha256').update(b).digest('hex');
assert.equal(index.policyVersion,assetPolicyVersion,'Rebuild the changed asset policy');
assert.deepEqual(biomes.map(b=>b.id),['forest'],'Review asset exclusions if a map opens');
assert.deepEqual(roster.map(p=>p.id),[4,132,16]);
assert.equal(events.length,0,'Review excluded event assets if events are enabled');
const declaredPacks=new Set(JSON.parse(fs.readFileSync(path.join(root,'game.json'))).subpackages.map(p=>p.name));
for(const pack of Object.keys(index.packs))assert.ok(declaredPacks.has(pack),'Missing subpackage '+pack);
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
  assert.equal(excludedAssetReason(key),null,'Unused asset still packaged: '+key);
  const data=bytes(key);assert.ok(data,'Missing '+key);assert.equal(digest(data).slice(0,16),path.basename(ref,path.extname(ref)));
}
assert.equal(musicTracks.length,0);
assert.deepEqual([...declaredPacks].filter(name=>name==='sound'||name.startsWith('music_')),[]);
assert.deepEqual(fs.readdirSync(path.join(root,'minigame/packs')).filter(name=>name==='sound'||name.startsWith('music_')),[],'Old generated music archives must be removed');
assert.equal(Object.keys(index.files).filter(k=>k.startsWith('assets/music/')).length,musicTracks.length);
assert.ok(index.files['assets/env/common/atlas.png']&&index.files['assets/env/common/hazards.png'],'Shared berries and combat hazards must remain');
const itemCatalog=JSON.parse(fs.readFileSync(path.join(pub,'data/items.json'),'utf8'));
for(const [id,item] of Object.entries(itemCatalog)){
  const key='assets/'+resolveItemIcon(item.icon||'items/'+id+'.png');
  assert.ok(index.files[key]&&bytes(key)?.length,'Every item must have a loadable image: '+id);
}
const count={};
const removedSceneAssets=[
  'assets/models/cursed.glb','assets/models/greed.glb','assets/models/porygon.glb',
  'assets/models/cage.glb','assets/models/goldrock.glb',
  'assets/ui/icons/map-cursed.png','assets/ui/icons/map-cage.png','assets/ui/icons/map-rock.png'
];
for(const key of removedSceneAssets){
  assert.ok(!fs.existsSync(path.join(pub,key))&&!fs.existsSync(path.join(pub,'overrides',key)),'Removed scene source asset must stay absent: '+key);
  assert.ok(!index.files[key],'Removed scene asset must not ship; rebuild with npm run build:assets: '+key);
}
assert.equal(Object.keys(index.files).filter(k=>k.startsWith('assets/cries/')).length,0,'Creature cries must not ship');
assert.deepEqual(Object.keys(index.files).filter(k=>k.startsWith('locale/')),[]);
assert.deepEqual(Object.keys(index.files).filter(k=>k.startsWith('data/i18n/')),[]);
assert.ok(index.files['text/ui.json']);
assert.equal(Object.keys(index.sprites).length,0,'Actor atlases must not be reconstructed on the phone');
assert.ok(!index.files['engine/layout.bin'],'Unused desktop layout references must not ship');
// Research reads family roots even when the root is not a spawnable actor.
const sourceSpecies=JSON.parse(fs.readFileSync(path.join(pub,'data/pokemon.json'),'utf8'));
const requiredSpecies=new Set(runtimeSpecies);
for(const actor of sourceSpecies)if(runtimeSpecies.includes(actor.id))requiredSpecies.add(actor.family);
assert.deepEqual(JSON.parse(Buffer.from(bytes('data/pokemon.json'))).map(p=>p.id),
  sourceSpecies.filter(actor=>requiredSpecies.has(actor.id)).map(actor=>actor.id));
for(const id of [...Array.from({length:151},(_,i)=>i+1),201]){
  assert.ok(!index.files['assets/pmd/'+id+'.png'],'Legacy actor atlas must not ship: '+id);
  const file='assets/pmd/'+id+'.png',override=path.join(pub,'overrides',file);
  const meta=JSON.parse(fs.readFileSync(path.join(pub,'data/sprites.json')))[id];
  assert.deepEqual(actorMetrics[id],await measureActor(fs.existsSync(override)?override:path.join(pub,file),meta,id),'Actor collision bounds: '+id);
}
for(const key of Object.keys(index.files))assert.equal(glyphSpeciesFromImage(key),null,'Legacy actor image must not ship: '+key);
assert.match(index.files['assets/glyphs/atlas.png'],/^text\//,'Character selection needs the atlas in the startup package');
// Compare every retained bitmap, including items, map/UI icons, hazards and
// glyphs. Packing may change the encoding, never the visible pixels.
for(const key of Object.keys(index.files).filter(key=>key.endsWith('.png'))){
  const category=key.split('/')[1];
  const source=fs.existsSync(path.join(pub,'overrides',key))?path.join(pub,'overrides',key):path.join(pub,key);
  const decode=b=>sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const [a,b]=await Promise.all([decode(source),decode(bytes(key))]);
  assert.deepEqual(a.info,b.info,key);
  for(let i=0;i<a.data.length;i+=4){
    if(a.data[i+3]!==b.data[i+3]||(a.data[i+3]&&a.data.readUIntBE(i,3)!==b.data.readUIntBE(i,3)))throw Error('Changed visible pixel: '+key+' @ '+i/4);
  }
  count[category]=(count[category]||0)+1;
}
const models=Object.keys(index.files).filter(k=>k.startsWith('assets/models/'));
assert.deepEqual(models,['assets/models/ball.glb'],'The paper edition needs only the original capture-ball model');
for(const key of models)assert.equal(digest(bytes(key)),digest(fs.readFileSync(fs.existsSync(path.join(pub,'overrides',key))?path.join(pub,'overrides',key):path.join(pub,key))),key);
for(const key of Object.keys(index.files).filter(k=>k.startsWith('data/')||k.startsWith('assets/env/'))) {
  const source=fs.existsSync(path.join(pub,'overrides',key))?path.join(pub,'overrides',key):path.join(pub,key);
  if(!key.endsWith('.png'))assert.equal(digest(bytes(key)),digest(runtimeData(key,fs.readFileSync(source))),key);
}
const report={mappedResources:Object.keys(index.files).length,RGBA:count,originalModels:models.length,
  assetPolicyVersion: index.policyVersion,musicTracks:musicTracks.length,musicPackages:[],
  removedSceneAssetsVerified:removedSceneAssets.length,
  actorBoundsVerified:152,itemIconsVerified:Object.keys(itemCatalog).length,cries:0,locales:['zh'],legacyActorImages:0,
  altarGlyphIncluded:!!actorMetrics[201],allArchiveHashesVerified:true};
report.runtimeSpecies=runtimeSpecies.length;
const out=path.join(root,'验收');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'资源核验.json'),JSON.stringify(report,null,2));
console.log(report);
