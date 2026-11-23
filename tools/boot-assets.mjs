import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {brotliDecompressSync} from 'node:zlib';
import postcss from 'postcss';
import sharp from 'sharp';
import {packStream} from './pack-resources.mjs';
import {unpackStream} from './resource-stream.mjs';
import {starterSpecies,starterWords} from '../source/src/starter-characters.js';
import {zixingStyle} from '../source/src/zixing-style.js';

const hash = bytes => createHash('sha256').update(bytes).digest('hex').slice(0,16);

export async function writeBootHeroArt(root,out){
  const images={};
  for(const id of starterSpecies){
    const word=starterWords[id];
    // The splash draws these at 72 logical pixels (about 159 physical pixels
    // on a 430px phone at 2x). Keep extra detail without decoding 512px art.
    // Only the generated main-package copy changes; keep the supplied PNGs.
    const image=await sharp(path.join(root,'source/art/glyphs',`hero_${id}_${word}.png`))
      .resize(256,256,{fit:'inside',withoutEnlargement:true})
      .png({compressionLevel:9,adaptiveFiltering:true}).toBuffer();
    images[word]='data:image/png;base64,'+image.toString('base64');
  }
  const file=path.join(out,'boot-hero-art.js'), code='module.exports = '+JSON.stringify(images)+';\n';
  if(fs.existsSync(file)&&fs.readFileSync(file,'utf8')===code)return;
  const pending=file+'.'+process.pid+'.tmp';
  try{
    fs.writeFileSync(pending,code);
    fs.renameSync(pending,file);
  }finally{fs.rmSync(pending,{force:true});}
}

export function bootAssets(root) {
  const read=file=>fs.readFileSync(path.join(root,'source',file),'utf8').replace(/\r\n/g,'\n');
  const css=read('public/assets/main-BnZCGLop-mvlr7rzv.css')+'\n'+read('src/customize.js').split('style.textContent=').pop().split(String.fromCharCode(96))[1]+'\n' + zixingStyle;
  const rules=[];
  postcss.parse(css).walkRules(rule=>{
    let media='';
    for(let p=rule.parent;p;p=p.parent){if(p.type==='atrule'&&p.name!=='media')return;if(p.name==='media')media=p.params;}
    const declarations=rule.nodes.filter(x=>x.type==='decl').map(d=>[d.prop,d.value+(d.important?'!important':'')]);
    for(const sel of rule.selectors){
      if(/::|:(hover|focus-visible|focus-within|active)\b/.test(sel))continue;
      const last=sel.split(/[\s>+~]+/).at(-1);
      const key=(last.split(/[:[]/)[0].match(/[.#][\w-]+/g)||[]).at(-1)||last.match(/^[a-z][\w-]*/i)?.[0]||'*';
      const weight=(sel.match(/#[\w-]+/g)||[]).length*100+(sel.match(/[.:[\]]/g)||[]).length*10+(sel.match(/(?:^|[\s>+~])[a-z][\w-]*/gi)||[]).length;
      rules.push([sel,declarations,key,media,weight,rules.length]);
    }
  });
  const assets={'engine/styles.json':Buffer.from(JSON.stringify(rules))};
  const directory=path.join(root,'source/public/assets/ui-paper');
  for(const name of fs.readdirSync(directory)){
    if(name.endsWith('.png'))assets['assets/ui-paper/'+name]=fs.readFileSync(path.join(directory,name));
  }
  return assets;
}

// Keep incremental builds in sync with the full asset build.
// Put the UI data there too, so it needn't be downloaded before game.js runs.
export function addBootAssets(out, assets) {
  const manifestPath = path.join(out,'assets.js');
  const info = createRequire(import.meta.url)(manifestPath);
  const files = Object.entries(assets).map(([key,data])=>({key,data,name:hash(data)+path.extname(key)}));
  const archive = path.join(out,'packs/text/assets.br');
  const packed = fs.readFileSync(archive);
  if (hash(packed)===info.packs.text && files.every(({key,name})=>info.files[key]==='text/'+name)) return;
  const entries = Object.create(null);
  unpackStream(brotliDecompressSync(packed), (name,bytes)=>{entries[name]=bytes;});
  for (const {key,data,name} of files) {
    const previous = info.files[key];
    entries[name]=data;
    info.files[key]='text/'+name;
    if (previous && !Object.values(info.files).includes(previous)) delete entries[previous.slice('text/'.length)];
  }
  const {bytes,rawSize}=packStream(entries,11);
  info.packs.text=hash(bytes);
  info.rawSizes.text=rawSize;
  fs.writeFileSync(archive+'.next',bytes);
  fs.renameSync(archive+'.next',archive);
  fs.writeFileSync(manifestPath+'.next','module.exports = '+JSON.stringify(info)+';\n');
  fs.renameSync(manifestPath+'.next',manifestPath);
}
