import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import {bootAssets} from './boot-assets.mjs';
import {packModels,packStream} from './pack-resources.mjs';
import {writeActorMetrics} from './actor-metrics.mjs';
import {assetPolicyVersion,musicTracks,musicPackage,excludedAssetReason} from './asset-policy.mjs';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'source');
const pub = path.join(source, 'public');
const out = path.join(root, 'minigame');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pokebonk-art-'));
const packs = {art: {}, world: {}, sound: {}, text: {}};
for(const track of musicTracks)packs[musicPackage(track)]??={};
const index = {};
const generatedSprites={};
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
// The forest altar also uses species 201's icon/portrait.
const referencedSpecies = new Set([201]);
for (const file of fs.readdirSync(path.join(source,'src')).filter(f=>f.endsWith('.js'))) {
  const js=fs.readFileSync(path.join(source,'src',file),'utf8');
  for(const match of js.matchAll(/(?:pmd|icons|portraits|cries)\/(\d+)\.(?:png|ogg)/g))referencedSpecies.add(+match[1]);
}
for (const folder of ['assets', 'overrides/assets']) {
  for (const [category, pack] of Object.entries(buckets)) {
    const dir = path.join(pub, folder, category);
    if (!fs.existsSync(dir)) continue;
    for (const file of walk(dir)) {
      const name = path.relative(path.join(pub, folder), file).replaceAll('\\', '/');
      if(excludedAssetReason('assets/'+name))continue;
      const number = parseInt(path.basename(name), 10);
      // The altar's actor (201) uses the same cutout path as the 151 creatures.
      if(category==='pmd'&&((number>=1&&number<=151)||number===201))continue;
      if (['pmd','icons','portraits','cries'].includes(category) && number > 151 && !referencedSpecies.has(number)) continue;
      const key = 'assets/' + name;
      if (selected.has(key)) continue;
      selected.add(key);
      const input = sourceFor(key);
      const original = fs.readFileSync(input);
      if (name.endsWith('.png') && original.length > 3000) {
        const webp = await sharp(original).webp({lossless:true, effort:4}).toBuffer();
        if (webp.length < original.length) { add(pack, key, webp, '.webp'); continue; }
      }
      if (category === 'music') {
        // AAC is supported by the native Web Audio decoders on both mobile OSes.
        const audio = path.join(temp, 'sample.m4a');
        execFileSync(ffmpeg.path, ['-loglevel','error','-y','-i',input,'-vn','-c:a','aac',
          '-ar','44100','-b:a','56k','-movflags','+faststart',audio],{windowsHide:true});
        const track=path.basename(name,'.ogg');
        if(!musicTracks.includes(track))throw Error('Music track has no package: '+name);
        add(musicPackage(track),key,fs.readFileSync(audio),'.m4a'); continue;
      }
      add(pack,key,original);
    }
  }
}
for (const file of walk(path.join(pub,'data'))) {
  const key = path.relative(pub,file).replaceAll('\\','/');
  if(key.startsWith('data/i18n/')&&key!=='data/i18n/zh.json')continue;
  add('text', key, fs.readFileSync(file));
}
for (const file of fs.readdirSync(path.join(pub,'assets'))) {
  const match = /^(zh)-.*\.js$/.exec(file);
  if (match) {
    const words = (await import(pathToFileURL(path.join(pub,'assets',file)).href)).default;
    add('text','locale/'+match[1]+'.json',Buffer.from(JSON.stringify(words)));
  }
}
for (const name of ['version.json','creditos.txt','legal']) add('text',name,fs.readFileSync(path.join(pub,name)));
const python = process.env.POKEBONK_PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
execFileSync(python,[...(python === 'py'?['-3.13']:[]),path.join(import.meta.dirname,'fonts.py'),source,temp],{stdio:'inherit'});
for (const weight of ['regular','bold']) add('text','fonts/'+weight+'.ttf',fs.readFileSync(path.join(temp,weight+'.ttf')));
add('text','fonts/OFL.txt',fs.readFileSync(path.join(pub,'fonts/swei/SIL_Open_Font_License_1.1.txt')));
for (const name of ['LICENSE','THIRD-PARTY-NOTICES.md']) add('text',name,fs.readFileSync(path.join(source,name)),'.txt');
for (const [key,bytes] of Object.entries(bootAssets(root))) add('text',key,bytes);
const meta = {}, rawSizes = {};
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
fs.writeFileSync(path.join(out,'assets.js'),'module.exports = '+JSON.stringify({policyVersion:assetPolicyVersion,packs:meta,rawSizes,files:index,sprites:generatedSprites})+';\n');
fs.rmSync(temp,{recursive:true});
