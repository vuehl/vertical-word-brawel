import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {brotliDecompressSync} from 'node:zlib';
import postcss from 'postcss';
import sharp from 'sharp';
import {packStream} from './pack-resources.mjs';
import {unpackStream} from './resource-stream.mjs';
import {starterSpecies,starterWords} from '../../source/src/data/starter-characters.js';
import {zixingStyle} from '../../source/src/ui/zixing-style.js';

const hash = bytes => createHash('sha256').update(bytes).digest('hex').slice(0,16);

export async function writeBootHeroArt(root,out){
  const words=starterSpecies.map(id=>starterWords[id]);
  const tiles=await Promise.all(starterSpecies.map(id=>
    sharp(path.join(root,'resources/art/glyphs',`hero_${id}_${starterWords[id]}.png`))
      .resize(256,256,{fit:'contain',withoutEnlargement:true,background:'#0000'}).png().toBuffer()));
  const atlas=await sharp(tiles,{join:{across:tiles.length}}).webp({lossless:true,effort:6}).toBuffer();
  const file=path.join(out,'boot-hero-art.js');
  const code='module.exports = '+JSON.stringify({words,src:'data:image/webp;base64,'+atlas.toString('base64')})+';\n';
  if(fs.existsSync(file)&&fs.readFileSync(file,'utf8')===code)return;
  const pending=file+'.'+process.pid+'.tmp';
  try{
    fs.writeFileSync(pending,code);
    fs.renameSync(pending,file);
  }finally{fs.rmSync(pending,{force:true});}
}

export function bootAssets(root) {
  const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
  const css=read('source/src/ui/base.css')+'\n'+read('source/src/ui/portrait.css')+'\n' + zixingStyle;
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
  const assets={'engine/styles.json':Buffer.from(JSON.stringify(rules)),
    'fonts/cast-title.ttf':fs.readFileSync(path.join(root,'resources/public/fonts/cast-title.ttf'))};
  assets['fonts/cast-title-glyphs.webp']=fs.readFileSync(path.join(root,'platform/cast-title-glyphs.webp'));
  // WeChat's preview packager filters loose WebP files. Install the cast assets
  // from the same versioned archive that supplies the HUD and its font.
  for(const name of ['ultimate-cast.webp','nameplate-blade.webp','ultimate-cast-ink.bin']){
    assets['assets/vfx/'+name]=fs.readFileSync(path.join(root,'platform',name));
  }
  const directory=path.join(root,'resources/public/assets/ui-paper');
  for(const name of fs.readdirSync(directory)){
    if(/\.(png|webp)$/.test(name))assets['assets/ui-paper/'+name]=fs.readFileSync(path.join(directory,name));
  }
  return assets;
}

// Keep incremental builds in sync with the full asset build.
// Put the UI data there too, so it needn't be downloaded before game.js runs.
export function addBootAssets(out, assets) {
  const manifestPath = path.join(out,'assets.js');
  // A full asset build may replace the manifest between incremental builds.
  // Read the current file instead of reusing Node's cached module export.
  const info = JSON.parse(fs.readFileSync(manifestPath,'utf8').replace(/^module.exports\s*=\s*/,'').replace(/;\s*$/,''));
  const files = Object.entries(assets).map(([key,data])=>({key,data,name:hash(data)+path.extname(key)}));
  const directory = path.join(out,'packs/text');
  const currentFile = info.archiveFiles.text;
  const archive = path.join(directory,currentFile);
  const packed = fs.readFileSync(archive);
  const removed=Object.keys(info.files).filter(key=>key.startsWith('assets/ui-paper/')&&!Object.hasOwn(assets,key));
  if (!removed.length && currentFile==='assets-'+info.packs.text+'.br' && hash(packed)===info.packs.text && files.every(({key,name})=>info.files[key]==='text/'+name)) return;
  const entries = Object.create(null);
  unpackStream(brotliDecompressSync(packed), (name,bytes)=>{entries[name]=bytes;});
  for(const key of removed){
    const previous=info.files[key];
    delete info.files[key];
    if(!Object.values(info.files).includes(previous))delete entries[previous.slice('text/'.length)];
  }
  for (const {key,data,name} of files) {
    const previous = info.files[key];
    entries[name]=data;
    info.files[key]='text/'+name;
    if (previous && !Object.values(info.files).includes(previous)) delete entries[previous.slice('text/'.length)];
  }
  const {bytes,rawSize}=packStream(entries,'text');
  info.packs.text=hash(bytes);
  info.rawSizes.text=rawSize;
  info.archiveFiles.text='assets-'+info.packs.text+'.br';
  const nextArchive=path.join(directory,info.archiveFiles.text);
  try{
    fs.writeFileSync(nextArchive+'.next',bytes);
    fs.renameSync(nextArchive+'.next',nextArchive);
    fs.writeFileSync(manifestPath+'.next','module.exports = '+JSON.stringify(info)+';\n');
    fs.renameSync(manifestPath+'.next',manifestPath);
  }finally{
    fs.rmSync(nextArchive+'.next',{force:true});
    fs.rmSync(manifestPath+'.next',{force:true});
  }
  // Keep the previous archive available until the manifest points to the new
  // complete payload, then remove obsolete versions from the package.
  for(const filename of fs.readdirSync(directory)){
    if(filename!==info.archiveFiles.text && /^(?:assets\.br|assets-[a-f0-9]{16}\.br)$/.test(filename)){
      fs.rmSync(path.join(directory,filename));
    }
  }
}
