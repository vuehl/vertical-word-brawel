import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {starterSpecies} from '../source/src/starter-characters.js';

// Keep the supplied artwork in source control; the phone loads one small atlas.
const root=path.resolve(import.meta.dirname,'..');
const dir=path.join(root,'source/art/glyphs');
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort();
const size=96,columns=16,words={},enemies={},heroes={},layers=[];
const previewSize=384,previewTop=Math.ceil(files.length/columns)*size;
let previews=0;
for(const [index,file] of files.entries()){
  const parts=file.replace('.png','').split('_');
  const word=parts.at(-1);
  const input=sharp(path.join(dir,file));
  const {data,info}=await input.ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let x0=info.width,y0=info.height,x1=0,y1=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>24){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  const crop=input.extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1});
  function tile(side){
    const pad=side/12,content=side-2*pad;
    return crop.clone().resize(content,content,{fit:'contain',background:'#00000000'})
      .extend({top:pad,bottom:pad,left:pad,right:pad,background:'#00000000'}).png().toBuffer();
  }
  layers.push({input:await tile(size),left:index%columns*size,top:Math.floor(index/columns)*size});
  const record={index,word};words[word]=record;
  if(parts[0]==='hero'){
    const id=Number(parts[1]);
    heroes[id]=record;
    if(starterSpecies.includes(id)){
      const left=previews++*previewSize;
      record.preview={left,top:previewTop,size:previewSize};
      layers.push({input:await tile(previewSize),left,top:previewTop});
    }
  }
  else enemies[word]=record;
}
fs.mkdirSync(path.join(root,'source/public/assets/glyphs'),{recursive:true});
await sharp({create:{width:Math.max(columns*size,previews*previewSize),height:previewTop+previewSize,channels:4,background:'#00000000'}}).composite(layers).png().toFile(path.join(root,'source/public/assets/glyphs/atlas.png'));
fs.writeFileSync(path.join(root,'source/src/glyph-catalog.js'),'// Generated from the user-supplied glyph artwork by tools/glyph-atlas.mjs.\nexport const glyphCatalog='+JSON.stringify({size,columns,words,enemies,heroes})+';\n');
console.log('Glyph atlas:',files.length,'supplied images.');
