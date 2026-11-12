import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Keep the supplied artwork in source control; the phone loads one small atlas.
const root=path.resolve(import.meta.dirname,'..');
const dir=path.join(root,'source/art/glyphs');
const monsterDir=path.join(root,'source/art/monsters');
const supplied=f=>f.startsWith('hero_新角色_');
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort((a,b)=>Number(supplied(a))-Number(supplied(b))||(a<b?-1:a>b?1:0));
const monsterFiles=fs.readdirSync(monsterDir).filter(f=>f.endsWith('.png')).sort();
const size=96,columns=16,words={},enemies={},heroes={},monsters={},layers=[];
files.push(...monsterFiles.map(f=>'monster_'+f));
for(const [index,file] of files.entries()){
  const monster=file.startsWith('monster_');
  const parts=file.replace('.png','').split('_');
  const word=parts[0]==='hero'?parts[3]:parts[1];
  const input=sharp(monster?path.join(monsterDir,file.slice(8)):path.join(dir,file));
  const {data,info}=await input.ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let x0=info.width,y0=info.height,x1=0,y1=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>24){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  const image=await input.extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).resize(80,80,{fit:'contain',background:'#00000000'}).extend({top:8,bottom:8,left:8,right:8,background:'#00000000'}).png().toBuffer();
  layers.push({input:image,left:index%columns*size,top:Math.floor(index/columns)*size});
  const record={index,word};
  if(monster)monsters[word]=record;
  else if(parts[0]==='hero'){words[word]=record;heroes[parts[1]+'-'+parts[2]]=record;}
  else {words[word]=record;enemies[Number(parts[0])]=record;}
}
fs.mkdirSync(path.join(root,'source/public/assets/glyphs'),{recursive:true});
await sharp({create:{width:columns*size,height:Math.ceil(files.length/columns)*size,channels:4,background:'#00000000'}}).composite(layers).png().toFile(path.join(root,'source/public/assets/glyphs/atlas.png'));
fs.writeFileSync(path.join(root,'source/src/glyph-catalog.js'),'// Generated from the user-supplied glyph artwork by tools/glyph-atlas.mjs.\nexport const glyphCatalog='+JSON.stringify({size,columns,words,enemies,heroes,monsters})+';\n');
console.log('Glyph atlas:',files.length,'supplied images.');
