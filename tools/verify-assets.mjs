import {deskBattleLayers} from '../source/src/world/desk-stage-layout.js';
import {bakeDeskScenery} from './art/desk-scenery.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {brotliDecompressSync} from 'node:zlib';
import sharp from 'sharp';
import index from '../minigame/assets.js';
import codec from '../platform/resource-codec.js';
import {restoreSprite} from './build/sprite-png.mjs';
import {unpackStream} from './build/resource-stream.mjs';
import {actorMetrics} from '../source/src/actors/actor-metrics.js';
import {heroActionCatalog} from '../source/src/actors/hero-action-catalog.js';
import {assetPolicyVersion,compressedFireAtlases,windClarityAtlases,excludedAssetReason,musicTracks,requiredItemIcons} from './build/asset-policy.mjs';
import {biomes,events,roster,vitamins} from '../source/src/data/catalogs.js';
import {facilityNames,facilityIconFile,illustratedFacilityFiles,isContactFacility,isActiveItem} from '../source/src/data/active-content.js';
import {resolveItemIcon} from '../source/src/data/item-icons.js';
import {glyphSpeciesFromImage} from '../source/src/data/zixing-identity.js';
import {runtimeData,runtimeSpecies} from './build/runtime-data.mjs';
import {unpackMeshBytes} from '../source/src/effects/dragon-summon-hd/mesh-bytes.js';
import {dragonDirectory} from './build/dragon-summon-pack.mjs';
import {isAtlasIcon} from './build/icon-atlases.mjs';
import {portalScreenAtlas} from '../source/src/effects/portal-screen-atlas.js';
import {frameColourError,acceptableCaptureError} from './build/capture-compression.mjs';
const root=path.resolve(import.meta.dirname,'..'), pub=path.join(root,'resources/public');
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
const iconErrors={tiles:0,maxVisibleChannelError:0};
const captureFrames=JSON.parse(fs.readFileSync(path.join(pub,'assets/vfx/capture-bag/frames.bin'),'utf8'));
const captureErrors=[];
for(const key of Object.keys(index.files).filter(key=>/^assets\/vfx\/capture-bag\/p\d+\.webp$/.test(key))){
  const [a,b]=await Promise.all([fs.readFileSync(path.join(pub,key)),bytes(key)].map(data=>sharp(data).ensureAlpha().raw().toBuffer({resolveWithObject:true})));
  assert.deepEqual(a.info,b.info,key);
  const page=Number(path.basename(key,'.webp').slice(1)),rects=captureFrames.filter(frame=>frame[0]===page).map(frame=>frame.slice(1,5));
  assert.ok(rects.length,key);
  const error=frameColourError(a.data,b.data,a.info.width,rects);
  assert.ok(acceptableCaptureError(error),'Capture colour/alpha changed beyond the visual budget: '+key);
  captureErrors.push({key,...error});
}
for(const [key,ref] of Object.entries(index.files)){
  if(!isAtlasIcon(key))continue;
  const [group,entry]=ref.split('/'),[page,tile]=entry.split('#');
  assert.ok(/^\d+$/.test(tile),key);
  const [left,top,width,height]=index.iconFrames[page][tile];
  const atlas=packs[group][page];
  assert.equal(digest(atlas).slice(0,16),path.basename(page,'.webp'));
  packs[group][entry]=await sharp(atlas).extract({left,top,width,height}).png().toBuffer();
  iconErrors.tiles++;
}
for(const key of windClarityAtlases){
  const source=await sharp(path.join(pub,key)).ensureAlpha().raw().toBuffer();
  const decoded=await sharp(bytes(key)).ensureAlpha().raw().toBuffer();
  assert.equal(decoded.length,source.length,key);
  // Lossless WebP may choose any RGB underneath exactly zero alpha. Compare
  // every alpha byte and every visible RGB byte, including the faint edges.
  for(let k=0;k<source.length;k+=4)if(source[k+3]===0){source.fill(0,k,k+3);decoded.fill(0,k,k+3);}
  assert.equal(digest(decoded),digest(source),'Keep wind coverage and visible colours in the runtime pack: '+key);
}
for(const name of ['ultimate-cast.webp','nameplate-blade.webp','ultimate-cast-ink.bin']){
  const key='assets/vfx/'+name;
  assert.match(index.files[key],/^text\//,'Cast resources must be installed before the first battle');
  assert.equal(digest(bytes(key)),digest(fs.readFileSync(path.join(root,'platform',name))),key);
}
const opening=JSON.parse(fs.readFileSync(path.join(pub,'assets/opening/frames.json'),'utf8'));
assert.equal(opening.frames,169);assert.equal(opening.files.length,Math.ceil(opening.frames/opening.perPage));
for(const name of opening.files){
  const key='assets/opening/'+name;
  assert.match(index.files[key],/^text\//,'Opening pages must survive QR preview packaging');
  assert.equal(digest(bytes(key)),digest(fs.readFileSync(path.join(pub,key))),key);
  assert.equal(fs.existsSync(path.join(root,'minigame/play/opening',name)),false,'Do not rely on loose WebP pages');
}
// This WebP encodes palette indices as pixels. Any transcoding corrupts both themes.
const chantAsset='assets/vfx/dragon-chant.webp';
const evoKey='assets/vfx/evolution-screen.webp';
const evoInput=fs.existsSync(path.join(pub,'overrides',evoKey))?path.join(pub,'overrides',evoKey):path.join(pub,evoKey);
const {data:red,info:evo}=await sharp(evoInput).extractChannel(0).raw().toBuffer({resolveWithObject:true});
const mask=brotliDecompressSync(bytes('assets/vfx/evolution-screen.r8.br'));
assert.ok(!index.files[evoKey]);assert.equal(mask.length,evo.width*evo.height);
for(let y=0;y<evo.height;y++){
  const src=(evo.height-1-y)*evo.width;
  assert.ok(mask.subarray(y*evo.width,(y+1)*evo.width).equals(red.subarray(src,src+evo.width)),'Evolution mask row '+y);
}
const meshAsset='assets/vfx/dragon-summon-hd/arc-mesh.bin';
assert.equal(digest(unpackMeshBytes(bytes(meshAsset))),digest(fs.readFileSync(path.join(pub,meshAsset))));
const sourceDragon=JSON.parse(fs.readFileSync(path.join(pub,dragonDirectory,'manifest.json')));
const packedDragon=JSON.parse(Buffer.from(bytes(dragonDirectory+'manifest.json')));
const dragonFiles=['manifest.json',packedDragon.arc.mesh,packedDragon.boss.file,...packedDragon.arc.pages,
  packedDragon.orb.background.file,...packedDragon.orb.pages,...packedDragon.burst.pages];
assert.deepEqual(Object.keys(index.files).filter(k=>k.startsWith(dragonDirectory)).sort(),dragonFiles.map(f=>dragonDirectory+f).sort());
for(const name of dragonFiles)assert.ok(index.files[dragonDirectory+name].startsWith('dragon_summon/'),name);
async function checkColorFrame(file,packed,width,height) {
  const original=await sharp(path.join(pub,dragonDirectory,file)).removeAlpha().raw().toBuffer();
  const rgb=await packed.resize(width,height).removeAlpha().raw().toBuffer();
  assert.equal(rgb.length,original.length,file);
  let squared=0;
  for(let i=0;i<rgb.length;i++)squared+=(rgb[i]-original[i])**2;
  assert.ok(Math.sqrt(squared/rgb.length)<11,'Summon color frame error: '+file);
}
for(const kind of ['orb','burst']){
  const src=sourceDragon[kind],atlas=packedDragon[kind],{width,height,columns,rows}=atlas;
  assert.equal(atlas.frames.length,src.frames.length);
  for(let i=0;i<src.frames.length;i++){
    const frame=atlas.frames[i];
    if(!src.frames[i]){assert.equal(frame,null);continue;}
    assert.ok(frame.tile>=0&&frame.tile<columns*rows);
    const page=sharp(bytes(dragonDirectory+atlas.pages[frame.page]));
    const rect={left:(frame.tile%columns)*width,top:Math.floor(frame.tile/columns)*height,width,height};
    await checkColorFrame(src.pages[src.frames[i].page],page.extract(rect),src.width,src.height);
  }
}
const orbBg=sourceDragon.orb.background;
await checkColorFrame(orbBg.file,sharp(bytes(dragonDirectory+packedDragon.orb.background.file)),
  sourceDragon.orb.width*orbBg.columns,sourceDragon.orb.height*orbBg.rows);
assert.ok(index.files[chantAsset], 'Missing summon animation data atlas');
assert.equal(digest(bytes(chantAsset)),digest(fs.readFileSync(path.join(pub,chantAsset))),
  'Keep the summon data atlas byte-for-byte');
for(const [key,ref] of Object.entries(index.files)){
  assert.equal(excludedAssetReason(key),null,'Unused asset still packaged: '+key);
  const data=bytes(key);assert.ok(data,'Missing '+key);
  if(!isAtlasIcon(key))assert.equal(digest(data).slice(0,16),path.basename(ref,path.extname(ref)));
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
const sourceItemIcons = fs.readdirSync(path.join(pub,'assets/items')).filter(name=>name.endsWith('.png'));
assert.deepEqual(sourceItemIcons.map(name=>'assets/items/'+name).sort(),[...requiredItemIcons].sort(),
  'Item image directory must match the current inventory, HUD and particle textures');
for(const key of requiredItemIcons){
  assert.ok(index.files[key]&&bytes(key)?.length,'Missing gameplay or shared icon: '+key);
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
for(const key of ['index.html','index-0.8.13.html','legal','manifest.webmanifest','favicon.ico']){
  assert.ok(!index.files[key],'Legacy web asset must not ship: '+key);
}
assert.equal(Object.keys(index.sprites).length,0,'Actor atlases must not be reconstructed on the phone');
assert.ok(!index.files['engine/layout.bin'],'Unused desktop layout references must not ship');
// Research reads family roots even when the root is not a spawnable actor.
const sourceSpecies=JSON.parse(fs.readFileSync(path.join(pub,'data/pokemon.json'),'utf8'));
const requiredSpecies=new Set(runtimeSpecies);
for(const actor of sourceSpecies)if(runtimeSpecies.includes(actor.id))requiredSpecies.add(actor.family);
assert.deepEqual(JSON.parse(Buffer.from(bytes('data/pokemon.json'))).map(p=>p.id),
  sourceSpecies.filter(actor=>requiredSpecies.has(actor.id)).map(actor=>actor.id));
// Snapshot verified against every original walk frame before retiring the sprite sheets.
assert.equal(digest(JSON.stringify(actorMetrics)),'7cc64bc744f11178d73e6bd4aa3d55fd743f314ebed7d7d8cfda3239bc0117aa');
for(const id of [...Array.from({length:151},(_,i)=>i+1),201]){
  assert.ok(!index.files['assets/pmd/'+id+'.png'],'Legacy actor atlas must not ship: '+id);
  const bounds=actorMetrics[id];
  assert.ok(bounds && Number.isFinite(bounds.top) && bounds.foot>bounds.top && bounds.width>0,
    'Missing actor collision bounds: '+id);
}
for(const key of Object.keys(index.files))assert.equal(glyphSpeciesFromImage(key),null,'Legacy actor image must not ship: '+key);
assert.match(index.files['assets/glyphs/atlas.png'],/^text\//,'Character selection needs the atlas in the startup package');
// Check visible color and alpha in every tile of the portal screen loop.
const fireColorError={};
for(const key of Object.keys(index.files).filter(key=>key.endsWith('.png'))){
  const category=key.split('/')[1];
  const source=fs.existsSync(path.join(pub,'overrides',key))?path.join(pub,'overrides',key):path.join(pub,key);
  const decode=b=>sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const [a,b]=await Promise.all([decode(source),decode(bytes(key))]);
  if(packedDragon.arc.pages.some(file=>dragonDirectory+file===key)){
    const {width,height}=b.info;
    assert.equal(a.info.width,width*2);assert.equal(a.info.height,height*2);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)for(let c=0;c<3;c++){
      const i=4*(2*y*a.info.width+2*x)+c,below=i+4*a.info.width;
      const expected=Math.round((a.data[i]+a.data[i+4]+a.data[below]+a.data[below+4])/4);
      assert.equal(b.data[4*(y*width+x)+c],expected,key);
    }
    continue;
  }
  assert.deepEqual(a.info,b.info,key);
  if(isAtlasIcon(key)&&category==='items'&&a.info.width===256&&a.info.height===256){
    for(let i=0;i<a.data.length;i+=4){
      const alpha=a.data[i+3];
      if(b.data[i+3]!==alpha)throw Error('Changed alpha: '+key+' @ '+i/4);
      if(!alpha)continue;
      for(let c=0;c<3;c++){
        const error=Math.abs(b.data[i+c]-a.data[i+c]);
        if(error>4)throw Error('Changed visible colour beyond four levels: '+key+' @ '+i/4);
        iconErrors.maxVisibleChannelError=Math.max(iconErrors.maxVisibleChannelError,error);
      }
    }
  }else if(key==='assets/vfx/portal-screen.png'){
    const {rows,columns,pad}=portalScreenAtlas,w=portalScreenAtlas.width+2*pad,h=portalScreenAtlas.height+2*pad;
    assert.equal(a.info.width,columns*w);assert.equal(a.info.height,rows*h);
    let worst=0;
    for(let frame=0;frame<rows*columns;frame++){
      let error=0,weight=0;
      for(let y=0;y<h;y++){
        let i=((Math.floor(frame/columns)*h+y)*a.info.width+frame%columns*w)*4;
        for(let x=0;x<w;x++,i+=4){
          const alpha=a.data[i+3];
          if(alpha!==b.data[i+3])throw Error('Changed alpha: '+key+' @ '+i/4);
          for(let c=0;c<3;c++)error+=alpha*Math.abs(a.data[i+c]-b.data[i+c]);
          weight+=3*alpha;
        }
      }
      if(weight)worst=Math.max(worst,error/weight);
    }
    assert.ok(worst<3,'Visible colour error in '+key+': '+worst);
  }else for(let i=0;i<a.data.length;i+=4){
    if(a.data[i+3]!==b.data[i+3]||(a.data[i+3]&&a.data.readUIntBE(i,3)!==b.data.readUIntBE(i,3)))throw Error('Changed visible pixel: '+key+' @ '+i/4);
  }
  if(compressedFireAtlases.has(key))fireColorError[key]=0; // Exact visible pixels verified above.
  count[category]=(count[category]||0)+1;
}
const models=Object.keys(index.files).filter(k=>k.startsWith('assets/models/'));
assert.deepEqual(models,['assets/models/ball.glb']);
for(const key of models)assert.equal(digest(bytes(key)),digest(fs.readFileSync(fs.existsSync(path.join(pub,'overrides',key))?path.join(pub,'overrides',key):path.join(pub,key))),key);
const deskDevices=JSON.parse(fs.readFileSync(path.join(pub,'config/desk2d-devices.json'),'utf8'));
const deskLayout=JSON.parse(fs.readFileSync(path.join(pub,'config/desk2d-layout.json'),'utf8'));
const exterior=JSON.parse(fs.readFileSync(path.join(pub,'config/desk-exterior.json'),'utf8'));
const deskFiles=stage=>deskBattleLayers(stage,deskLayout).flatMap(layer=>layer.parts.map(([name])=>'assets/env/desk2d/'+name));
const deskTiles=[...deskFiles(4),...deskFiles(1),...exterior.parts.map(([name])=>'assets/env/desk2d/'+name)];
assert.deepEqual(Object.keys(index.files).filter(key=>/^assets\/env\/desk2d\/(?:[^/]+-\d+\.webp|(?:furnished|exterior)\/.*)$/.test(key)).sort(),
  deskTiles.sort(),'Packed map tiles must match the current layout');
for(const key of [...deskFiles(4),...exterior.parts.map(([file])=>'assets/env/desk2d/'+file)])
  assert.equal(digest(bytes(key)),digest(fs.readFileSync(path.join(pub,key))),'Stale packed map tile '+key);
await bakeDeskScenery(pub,(file,data)=>assert.equal(digest(bytes('assets/env/desk2d/'+file)),digest(data),'Stale baked tile '+file));
for(const {name,parts} of deskLayout.layers.filter(layer=>['cup','zhi'].includes(layer.name))){
  for(const [file] of parts)assert.equal(digest(bytes('assets/env/desk2d/furnished/'+file)),
    digest(fs.readFileSync(path.join(pub,'assets/env/desk2d',file))),name+' must keep its original sprite');
}
const paperDirectory='assets/ui-paper/';
const paperImages=fs.readdirSync(path.join(pub,paperDirectory)).filter(name=>/\.(png|webp)$/.test(name));
assert.ok(paperImages.includes('journey-desk.webp'),'Missing menu backdrop');
assert.deepEqual(Object.keys(index.files).filter(key=>key.startsWith(paperDirectory)).sort(),
  paperImages.map(name=>paperDirectory+name).sort());
for(const name of paperImages){
  const key=paperDirectory+name;
  assert.ok(index.files[key].startsWith('text/'),key);
  assert.equal(digest(bytes(key)),digest(fs.readFileSync(path.join(pub,key))),key);
}
assert.ok(index.files['assets/env/desk2d/shelf-depth.png'],'Missing shelf occlusion texture');
const billPrefix='assets/env/desk2d/device-bill/';
assert.deepEqual(Object.keys(index.files).filter(key=>key.startsWith(billPrefix)).map(key=>key.slice(billPrefix.length)).sort(),
  ['device-bill_default.png','eyeball.png','face.png','highlight_eye.png']);
assert.deepEqual(Object.keys(deskDevices).sort(),Object.keys(facilityNames).sort());
assert.ok(index.files['assets/env/desk2d/device-magnet-shadow.png']&&deskDevices.magnet.shadowStrips.length);
for(const [kind,stem] of Object.entries(illustratedFacilityFiles)){
  const key='assets/env/desk2d/device-'+stem+'.png',device=deskDevices[kind];
  assert.ok(index.files[key],key);
  const {width,height}=await sharp(bytes(key)).metadata();
  assert.deepEqual(device.frame,{width,height},key);
  assert.ok(device.strips.length>0,key);
  if(isContactFacility(kind)){
    assert.equal(device.pickup.resolution,width,key);
    assert.equal(device.pickup.height,height,key);
    assert.ok(device.pickup.strips.length>0,key);
  }
}
for(const kind of Object.keys(facilityNames)){
  assert.ok(index.files['assets/'+facilityIconFile(kind)],'Missing facility thumbnail for '+kind);
  if(kind==='altar'){
    const prefix='assets/env/desk2d/device-altar/';
    assert.deepEqual(Object.keys(index.files).filter(k=>k.startsWith(prefix)).map(k=>k.slice(prefix.length)).sort(),
      ['color_alter.png','device-altar_0.png','device-altar_active.png','device-altar_default.png']);
  }else if(kind==='berry'){
    const prefix='assets/env/desk2d/device-berry/';
    assert.deepEqual(Object.keys(index.files).filter(k=>k.startsWith(prefix)).map(k=>k.slice(prefix.length)).sort(),
      ['RGB_flash.png','device-berry_basic.png','fuzzy.png','fuzzy_flash.png']);
    assert.ok(!index.files['assets/env/desk2d/device-berry.png']);
  }
}
for(const key of Object.keys(index.files).filter(k=>k.startsWith('data/')||k.startsWith('assets/env/'))) {
  if(deskTiles.includes(key))continue; // Checked against the bare or baked artwork above.
  const source=fs.existsSync(path.join(pub,'overrides',key))?path.join(pub,'overrides',key):path.join(pub,key);
  if(!key.endsWith('.png'))assert.equal(digest(bytes(key)),digest(runtimeData(key,fs.readFileSync(source))),key);
}
const report={mappedResources:Object.keys(index.files).length,RGBA:count,iconErrors,fireColorError,captureErrors,originalModels:models.length,
  deviceModels:0,illustratedDevices:Object.keys(facilityNames).length,
  assetPolicyVersion: index.policyVersion,musicTracks:musicTracks.length,musicPackages:[],
  removedSceneAssetsVerified:removedSceneAssets.length,
  actorBoundsVerified:152,itemIconsVerified:verifiedCatalogItems,excludedCatalogIcons,cries:0,locales:['zh'],legacyActorImages:0,
  altarGlyphIncluded:!!actorMetrics[201],allArchiveHashesVerified:true};
report.runtimeSpecies=runtimeSpecies.length;
const out=path.join(root,'验收');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'资源核验.json'),JSON.stringify(report,null,2));
console.log(report);
