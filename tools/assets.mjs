import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {bootAssets} from './boot-assets.mjs';
import {packModels,packStream} from './pack-resources.mjs';
import {writeActorMetrics} from './actor-metrics.mjs';
import {assetPolicyVersion,musicTracks,excludedAssetReason} from './asset-policy.mjs';
import {runtimeData,runtimeSpecies} from './runtime-data.mjs';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'source');
const pub = path.join(source, 'public');
const development=process.argv.includes('--dev');
const out = path.join(root, ...(development?['验收','开发者工程']:[]), 'minigame');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pokebonk-art-'));
const packs = {art: {}, world: {}, text: {}};
const index = {};
const generatedSprites={};
const fontText=[];
await writeActorMetrics(source);
const hash = data => createHash('sha256').update(data).digest('hex').slice(0, 16);
function add(pack, key, data, extension = path.extname(key)) {
  // Content-address files so repeated UI assets only occupy space once.
  const name = hash(data) + extension;
  packs[pack][name] = new Uint8Array(data);
  index[key] = pack + '/' + name;
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
  ui:'world', env:'world', models:'world', glyphs:'art', music:'sound'};
const selected = new Set();
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
      if (selected.has(key)) continue;
      selected.add(key);
      const input = sourceFor(key);
      const original = fs.readFileSync(input);
      if (name.endsWith('.png') && original.length > 3000) {
        const webp = await sharp(original).webp({lossless:true, effort:4}).toBuffer();
        if (webp.length < original.length) { add(pack, key, webp, '.webp'); continue; }
      }
      add(pack,key,original);
    }
  }
}
for (const file of walk(path.join(pub,'data'))) {
  const key = path.relative(pub,file).replaceAll('\\','/');
  if(key.startsWith('data/i18n/')&&key!=='data/i18n/zh.json')continue;
  const data=runtimeData(key,fs.readFileSync(file));
  add('text',key,data);fontText.push(data.toString('utf8'));
}
for (const file of fs.readdirSync(path.join(pub,'assets'))) {
  const match = /^(zh)-.*\.js$/.exec(file);
  if (match) {
    const words = (await import(pathToFileURL(path.join(pub,'assets',file)).href)).default;
    add('text','locale/'+match[1]+'.json',Buffer.from(JSON.stringify(words)));
    fontText.push(JSON.stringify(words));
  }
}
for (const name of ['version.json','creditos.txt','legal']) add('text',name,fs.readFileSync(path.join(pub,name)));
const python = process.env.POKEBONK_PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
if(development)fontText.push(fs.readFileSync(path.join(import.meta.dirname,'developer','panel.mjs'),'utf8'));
const fontInput=path.join(temp,'font-input.txt');fs.writeFileSync(fontInput,fontText.join('\n'));
execFileSync(python,[...(python === 'py'?['-3.13']:[]),path.join(import.meta.dirname,'fonts.py'),source,temp,fontInput],{stdio:'inherit'});
for (const weight of ['regular','bold']) add('text','fonts/'+weight+'.ttf',fs.readFileSync(path.join(temp,weight+'.ttf')));
add('text','fonts/OFL.txt',fs.readFileSync(path.join(pub,'fonts/swei/SIL_Open_Font_License_1.1.txt')));
for (const name of ['LICENSE','THIRD-PARTY-NOTICES.md']) add('text',name,fs.readFileSync(path.join(source,name)),'.txt');
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
packModels(packs.world);
for (const [name, entries] of Object.entries(packs)) {
  const {bytes,rawSize}=packStream(entries), dir=path.join(out,'packs',name);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'assets.br'),bytes);
  fs.rmSync(path.join(dir,'assets.zip'),{force:true});
  fs.writeFileSync(path.join(dir,'game.js'),'// Local resource subpackage.\n');
  meta[name]=hash(bytes);
  rawSizes[name]=rawSize;
  console.log(name, Object.keys(entries).length, (bytes.length/1048576).toFixed(2)+' MiB');
}
const devMetadata=development?{developerFontKey:(await import('./developer/build-support.mjs')).fontKey()}:{};
fs.writeFileSync(path.join(out,'assets.js'),'module.exports = '+JSON.stringify({policyVersion:assetPolicyVersion,...devMetadata,packs:meta,rawSizes,files:index,sprites:generatedSprites})+';\n');
const reportDir=path.join(root,'验收',...(development?['开发者工程']:[]));fs.mkdirSync(reportDir,{recursive:true});
fs.writeFileSync(path.join(reportDir,'资源打包清单.json'),JSON.stringify({
  policyVersion:assetPolicyVersion,mappedResources:Object.keys(index).length,runtimeSpecies:runtimeSpecies.length,musicTracks,
  packs:Object.fromEntries(Object.keys(meta).map(name=>[name,{files:Object.keys(packs[name]).length,rawBytes:rawSizes[name],packedBytes:fs.statSync(path.join(out,'packs',name,'assets.br')).size}])),
  excluded:[...excluded].sort(([a],[b])=>a.localeCompare(b)).map(([key,reason])=>({key,reason})),
},null,2)+'\n');
fs.rmSync(temp,{recursive:true});
