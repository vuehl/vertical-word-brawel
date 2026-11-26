import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {brotliCompressSync,constants} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import {writeDeskMapAtlas} from '../art/desk-map-atlas.mjs';
import {bakeDeskScenery} from '../art/desk-scenery.mjs';
import {bootAssets} from './boot-assets.mjs';
import {buildOpeningAtlas} from '../art/build-journey-opening.mjs';
import {packModels,packStream} from './pack-resources.mjs';
import {isAtlasIcon,packIconAtlases} from './icon-atlases.mjs';
import {writeHeroActions} from '../art/hero-actions.mjs';
import {writeWindGlyphColors} from '../art/wind-glyph-colors.mjs';
import {updateDeskDeviceArt} from '../art/desk-device-art.mjs';
import {assetPolicyVersion,compressedFireAtlases,windClarityAtlases,musicTracks,excludedAssetReason} from './asset-policy.mjs';
import {runtimeData,runtimeSpecies} from './runtime-data.mjs';
import {gameProject} from './project-target.mjs';
import {dragonDirectory,packDragonSummon} from './dragon-summon-pack.mjs';
import {optimizeLosslessImage} from './image-optimizer.mjs';
import {sourceFontText} from './font-text.mjs';
import {compressCapturePage} from './capture-compression.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const source = path.join(root, 'source');
const pub = path.join(root, 'resources/public');
const development=process.argv.includes('--dev');
const projectRoot=gameProject(root,development);
const out=path.join(projectRoot,'minigame');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pokebonk-art-'));
const packs = {art: {}, world: {}, text: {}, dragon_summon: {}, capture_bag: {}};
const filters = {world:{},dragon_summon:{}};
const index = {};
const generatedSprites={};
const fontText=[];
const imageSavings=[];
const captureCompression=[];
const captureFrames=JSON.parse(fs.readFileSync(path.join(pub,'assets/vfx/capture-bag/frames.bin'),'utf8'));
await writeWindGlyphColors(source);
await writeHeroActions(source);
await updateDeskDeviceArt(source);
await writeDeskMapAtlas(pub);
const hash = data => createHash('sha256').update(data).digest('hex').slice(0, 16);
function addPage(pack, data, extension) {
  // Content-address files so repeated UI assets only occupy space once.
  const name = hash(data) + extension;
  packs[pack][name] = new Uint8Array(data);
  return pack + '/' + name;
}
function add(pack, key, data, extension = path.extname(key), filter) {
  const ref=addPage(pack,data,extension);
  index[key]=ref;
  if(filter)filters[pack][ref.split('/')[1]]=filter;
}
function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
function sourceFor(key) {
  const override = path.join(pub, 'overrides', key);
  return fs.existsSync(override) ? override : path.join(pub, key);
}
const buckets = {pmd:'art', icons:'art', portraits:'art', items:'art', front:'art',
  ui:'world', env:'world', models:'world', glyphs:'art', vfx:'art', sfx:'text', music:'sound'};
const selected = new Set();
await bakeDeskScenery(pub,(file,bytes)=>{
  const key='assets/env/desk2d/'+file;
  add('world',key,bytes);
  selected.add(key);
});
const icons=[];
const excluded = new Map();
for (const folder of ['assets', 'overrides/assets']) {
  for (const [category, pack] of Object.entries(buckets)) {
    const dir = path.join(pub, folder, category);
    if (!fs.existsSync(dir)) continue;
    for (const file of walk(dir)) {
      const name = path.relative(path.join(pub, folder), file).replaceAll('\\', '/');
      const reason=excludedAssetReason('assets/'+name);
      if(reason){excluded.set('assets/'+name,reason);continue;}
      const key = 'assets/' + name;
      // The home and character screens need the atlas before the first tap.
      if(key.startsWith(dragonDirectory))continue;
      const targetPack=key.startsWith('assets/vfx/capture-bag/')?'capture_bag':key==='assets/glyphs/atlas.png'?'text':pack;
      if (selected.has(key)) continue;
      selected.add(key);
      const input = sourceFor(key);
      if(key==='assets/vfx/evolution-screen.webp'){
        // Store the exact sampled channel in GPU row order. Native image decoding
        // otherwise keeps a full RGBA bitmap alive for this single-channel mask.
        const red=await sharp(input).flip().extractChannel(0).raw().toBuffer();
        add(targetPack,'assets/vfx/evolution-screen.r8.br',brotliCompressSync(red,{params:{
          [constants.BROTLI_PARAM_QUALITY]:9,[constants.BROTLI_PARAM_LGWIN]:20
        }}));
        continue;
      }
      if (isAtlasIcon(key)) { icons.push({pack:targetPack,key,input}); continue; }
      const original = fs.readFileSync(input);
      if(/^assets\/vfx\/capture-bag\/p\d+\.webp$/.test(key)){
        const page=Number(path.basename(key,'.webp').slice(1));
        const rects=captureFrames.filter(frame=>frame[0]===page).map(frame=>frame.slice(1,5));
        if(!rects.length)throw Error('Unreferenced capture atlas: '+key);
        const {bytes,error,changed}=await compressCapturePage(original,rects);
        add(targetPack,key,bytes);
        captureCompression.push({key,sourceBytes:original.length,packedImageBytes:bytes.length,changed,error});
        continue;
      }
      if (name.endsWith('.png') && original.length > 3000) {
        const options=key==='assets/vfx/portal-screen.png'
          ? {quality:87,alphaQuality:100,smartSubsample:true,effort:6}
          : {lossless:true,effort:category==='glyphs'||compressedFireAtlases.has(key)||windClarityAtlases.has(key)?6:4};
        const standard = await sharp(original).webp(options).toBuffer();
        const optimized = key==='assets/vfx/portal-screen.png' ? {bytes:standard,extension:'.webp'}
          : await optimizeLosslessImage(original, '.png');
        const webp = standard.length < optimized.bytes.length ? standard : optimized.bytes;
        if (webp.length < original.length) {
          imageSavings.push({key,sourceBytes:original.length,packedImageBytes:webp.length});
          add(targetPack, key, webp, '.webp'); continue;
        }
      }
      add(targetPack,key,original);
    }
  }
}
const iconFrames=await packIconAtlases(icons,addPage,index);
await packDragonSummon(sourceFor,add);
for (const file of walk(path.join(pub,'data'))) {
  const key = path.relative(pub,file).replaceAll('\\','/');
  const data=runtimeData(key,fs.readFileSync(file));
  add('text',key,data);fontText.push(data.toString('utf8'));
}
const uiText=fs.readFileSync(path.join(pub,'text/ui.json'));
add('text','text/ui.json',uiText);fontText.push(uiText.toString('utf8'));
for (const name of ['version.json','creditos.txt']) add('text',name,fs.readFileSync(path.join(pub,name)));
const python = process.env.POKEBONK_PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
const developer=development?await import('../developer/build-support.mjs'):null;
if(developer){
  fontText.push(fs.readFileSync(path.join(import.meta.dirname,'../developer','panel.mjs'),'utf8'));
}
fontText.push(sourceFontText(path.join(source,'src')),sourceFontText(path.join(root,'platform')));
const fontInput=path.join(temp,'font-input.txt');fs.writeFileSync(fontInput,fontText.join('\n'));
execFileSync(python,[...(python === 'py'?['-3.13']:[]),path.join(import.meta.dirname,'../art/fonts.py'),source,temp,fontInput],{stdio:'inherit'});
for (const weight of ['regular','bold']) add('text','fonts/'+weight+'.ttf',fs.readFileSync(path.join(temp,weight+'.ttf')));
add('text','fonts/OFL.txt',fs.readFileSync(path.join(pub,'fonts/swei/SIL_Open_Font_License_1.1.txt')));
for (const name of ['LICENSE','THIRD-PARTY-NOTICES.md']) add('text',name,fs.readFileSync(path.join(source,name)),'.txt');
await buildOpeningAtlas(root);
for (const [key,bytes] of Object.entries(bootAssets(root))) add('text',key,bytes);
const meta = {}, rawSizes = {};
// Remove obsolete generated music packages as well as their index entries.
const packRoot=path.resolve(out,'packs');
if(fs.existsSync(packRoot))for(const entry of fs.readdirSync(packRoot,{withFileTypes:true})){
  if(!entry.isDirectory()||!/^(?:sound|music_(?:boss|ingame[1-4]))$/.test(entry.name))continue;
  const target=path.resolve(packRoot,entry.name);
  if(!target.startsWith(packRoot+path.sep))throw Error('Invalid generated package path');
  fs.rmSync(target,{recursive:true,force:true});
}
filters.world['model-parts.bin']=['indices',packModels(packs.world)];
for (const [name, entries] of Object.entries(packs)) {
  const {bytes,rawSize}=packStream(entries,name,filters[name]);
  const dir=path.join(out,'packs',name);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'assets.br'),bytes);
  fs.rmSync(path.join(dir,'assets.zip'),{force:true});
  fs.writeFileSync(path.join(dir,'game.js'),'// Local resource subpackage.\n');
  meta[name]=hash(bytes);
  rawSizes[name]=rawSize;
  console.log(name, Object.keys(entries).length, (bytes.length/1048576).toFixed(2)+' MiB');
}
const devMetadata=developer?{developerAssetKey:developer.assetKey()}:{};
fs.writeFileSync(path.join(out,'assets.js'),'module.exports = '+JSON.stringify({policyVersion:assetPolicyVersion,...devMetadata,packs:meta,rawSizes,files:index,iconFrames,sprites:generatedSprites})+';\n');
const reportDir=projectRoot===root?path.join(root,'验收'):projectRoot;fs.mkdirSync(reportDir,{recursive:true});
fs.writeFileSync(path.join(reportDir,'资源打包清单.json'),JSON.stringify({
  policyVersion:assetPolicyVersion,mappedResources:Object.keys(index).length,runtimeSpecies:runtimeSpecies.length,musicTracks,
  imageSavings,
  captureCompression,
  packs:Object.fromEntries(Object.keys(meta).map(name=>[name,{files:Object.keys(packs[name]).length,rawBytes:rawSizes[name],packedBytes:fs.statSync(path.join(out,'packs',name,'assets.br')).size}])),
  excluded:[...excluded].sort(([a],[b])=>a.localeCompare(b)).map(([key,reason])=>({key,reason})),
},null,2)+'\n');
fs.rmSync(temp,{recursive:true});
