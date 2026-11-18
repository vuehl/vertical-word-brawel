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
import {heroActionCatalog} from '../source/src/hero-action-catalog.js';
import {assetPolicyVersion,compressedFireAtlases,excludedAssetReason,musicTracks} from './asset-policy.mjs';
import {biomes,events,heldItems,laboratory,roster,shop,vitamins} from '../source/src/catalogs.js';
import {facilityNames,facilityIconFile,facilityModelFile,isActiveItem} from '../source/src/active-content.js';
import {resolveItemIcon} from '../source/src/item-icons.js';
import {glyphSpeciesFromImage} from '../source/src/zixing-identity.js';
import {runtimeData,runtimeSpecies} from './runtime-data.mjs';
const root=path.resolve(import.meta.dirname,'..'), pub=path.join(root,'source/public');
const packs={};
const digest=b=>createHash('sha256').update(b).digest('hex');
assert.equal(index.policyVersion,assetPolicyVersion,'Rebuild the changed asset policy');
assert.deepEqual(biomes.map(b=>b.id),['forest'],'Review asset exclusions if a map opens');
assert.deepEqual(roster.map(p=>p.id),[4,16]);
assert.deepEqual(Object.keys(index.files).filter(key=>key.startsWith('assets/glyphs/hero-actions/')).sort(),
  Object.keys(heroActionCatalog).map(id=>'assets/glyphs/hero-actions/'+id+'.png').sort());
assert.ok(!index.files['assets/glyphs/copy-strokes.png']);
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
assert.ok(index.files['assets/env/common/hazards.png'],'Combat hazards must remain');
for(const ext of ['png','json'])assert.ok(!index.files['assets/env/common/atlas.'+ext],'Retired facility billboard atlas');
const itemCatalog=JSON.parse(fs.readFileSync(path.join(pub,'data/items.json'),'utf8'));
const itemIconKey=id=>'assets/'+resolveItemIcon(itemCatalog[id]?.icon||'items/'+id+'.png');
const supplyIconIds=[...Object.keys(itemCatalog).filter(isActiveItem),...vitamins.map(v=>v.icon)];
const requiredItemIds=new Set([
  ...supplyIconIds,
  ...heldItems.map(item=>item.key),...shop.map(item=>item.key),
  // The portrait lab draws glyphs. Its legacy "tm" slot uses Q's poke-ball fallback.
  ...laboratory.map(item=>item.icon==='tm'?'poke-ball':item.icon),
]);
for(const id of requiredItemIds){
  const key=itemIconKey(id);
  assert.ok(index.files[key]&&bytes(key)?.length,'Missing gameplay or shared icon: '+id);
}
assert.equal(new Set(supplyIconIds.map(id=>index.files[itemIconKey(id)])).size,supplyIconIds.length,
  'Each active item and vitamin must use its own artwork, including the two four-leaf clovers');
const excludedCatalogIcons={};
let verifiedCatalogItems=0;
for(const [id,item] of Object.entries(itemCatalog)){
  const key=itemIconKey(id);
  if(excludedAssetReason(key)){
    assert.ok(!index.files[key],'Excluded item icon still in the package: '+key);
    excludedCatalogIcons[key]=item.name;
  }else{
    assert.ok(index.files[key]&&bytes(key)?.length,'Missing retained catalog icon: '+id);
    verifiedCatalogItems++;
  }
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
// The three painted fire atlases use lossy RGB. Check alpha exactly and bound
// visible colour error in every animation tile, including small impact poses.
const fireColorError={};
for(const key of Object.keys(index.files).filter(key=>key.endsWith('.png'))){
  const category=key.split('/')[1];
  const source=fs.existsSync(path.join(pub,'overrides',key))?path.join(pub,'overrides',key):path.join(pub,key);
  const decode=b=>sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const [a,b]=await Promise.all([decode(source),decode(bytes(key))]);
  assert.deepEqual(a.info,b.info,key);
  if(compressedFireAtlases.has(key)){
    const {tile,rows,columns}=JSON.parse(fs.readFileSync(source.replace(/\.png$/,'.json'),'utf8'));
    assert.equal(a.info.width,columns*tile);assert.equal(a.info.height,rows*tile);
    let worst=0;
    for(let frame=0;frame<rows*columns;frame++){
      let error=0,weight=0;
      for(let y=0;y<tile;y++){
        let i=((Math.floor(frame/columns)*tile+y)*a.info.width+frame%columns*tile)*4;
        for(let x=0;x<tile;x++,i+=4){
          const alpha=a.data[i+3];
          if(alpha!==b.data[i+3])throw Error('Changed alpha: '+key+' @ '+i/4);
          for(let c=0;c<3;c++)error+=alpha*Math.abs(a.data[i+c]-b.data[i+c]);
          weight+=3*alpha;
        }
      }
      if(weight)worst=Math.max(worst,error/weight);
    }
    assert.ok(worst<=10,'Visible colour error in '+key+': '+worst);
    fireColorError[key]=worst;
  }else for(let i=0;i<a.data.length;i+=4){
    if(a.data[i+3]!==b.data[i+3]||(a.data[i+3]&&a.data.readUIntBE(i,3)!==b.data.readUIntBE(i,3)))throw Error('Changed visible pixel: '+key+' @ '+i/4);
  }
  count[category]=(count[category]||0)+1;
}
const models=Object.keys(index.files).filter(k=>k.startsWith('assets/models/'));
const deviceKeys=Object.keys(facilityNames).map(kind=>'assets/models/'+facilityModelFile(kind)+'.glb');
assert.equal(deviceKeys.length,10);
assert.deepEqual(models.sort(),['assets/models/ball.glb',...deviceKeys].sort());
for(const key of models)assert.equal(digest(bytes(key)),digest(fs.readFileSync(fs.existsSync(path.join(pub,'overrides',key))?path.join(pub,'overrides',key):path.join(pub,key))),key);
const adapterHash=digest(fs.readFileSync(path.join(root,'source/src/DeviceScreenFx.mjs')));
for(const kind of Object.keys(facilityNames)){
  const key='assets/models/'+facilityModelFile(kind)+'.glb',glb=Buffer.from(bytes(key));
  const gltf=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12)));
  const adapter=gltf.asset.extras.deviceScreenFxAdapter,scene=gltf.scenes[gltf.scene??0].extras;
  assert.equal(adapter.sha256,adapterHash,key);
  assert.equal(digest(adapter.source),adapterHash,key);
  assert.equal(scene.deviceModel,({bill:'billpc',boss:'portal',portal:'boss'})[kind]??kind,key);
  if(kind==='boss'||kind==='portal')assert.equal(facilityIconFile(kind),'ui/devices/'+scene.deviceModel+'.png');
  assert.ok(index.files['assets/'+facilityIconFile(kind)],'Missing model thumbnail for '+kind);
  assert.equal(adapter.apiVersion,2,key);
  assert.equal(scene.deviceScreenFx.version,2,key);
  assert.equal(scene.deviceScreenFx.cycleSeconds,3,key);
  assert.equal(scene.deviceScreenFx.stars.sharedOrigin,true,key);
  assert.equal(scene.deviceScreenFx.stars.scatter.tracks,8,key);
  assert.ok(scene.deviceScreenFx.supportXYZ.length>=12,key);
}
for(const key of Object.keys(index.files).filter(k=>k.startsWith('data/')||k.startsWith('assets/env/'))) {
  const source=fs.existsSync(path.join(pub,'overrides',key))?path.join(pub,'overrides',key):path.join(pub,key);
  if(!key.endsWith('.png'))assert.equal(digest(bytes(key)),digest(runtimeData(key,fs.readFileSync(source))),key);
}
const report={mappedResources:Object.keys(index.files).length,RGBA:count,fireColorError,originalModels:models.length-deviceKeys.length,
  deviceModels:deviceKeys.length,deviceAdapterSha256:adapterHash,
  assetPolicyVersion: index.policyVersion,musicTracks:musicTracks.length,musicPackages:[],
  removedSceneAssetsVerified:removedSceneAssets.length,
  actorBoundsVerified:152,itemIconsVerified:verifiedCatalogItems,excludedCatalogIcons,cries:0,locales:['zh'],legacyActorImages:0,
  altarGlyphIncluded:!!actorMetrics[201],allArchiveHashesVerified:true};
report.runtimeSpecies=runtimeSpecies.length;
const out=path.join(root,'验收');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'资源核验.json'),JSON.stringify(report,null,2));
console.log(report);
