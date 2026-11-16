import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root=path.resolve(import.meta.dirname,'..');
const source=process.argv[2]||String.raw`\\192.168.10.148\aigc-1\AI_project_01\宝可梦轻量版美术资源\素材\外包`;
const output=path.join(root,'source/public/assets/vfx');
const sequences=[['stream','醉拳-技能09-醉喷火/喷火',20],['hit','醉拳-技能09-醉喷火/爆点01',20]];
const tile=192,columns=8,rows=5,padding=3,composite=[],clips={};let first=0;
for(const [name,folder,count] of sequences){
  const dir=path.join(source,folder),files=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort();
  if(files.length!==count)throw Error('Unexpected frame count: '+dir);
  const meta=await sharp(path.join(dir,files[0])).metadata();
  for(const [i,file] of files.entries()){
    const frame=sharp(path.join(dir,file)),m=await frame.metadata();
    if(m.width!==meta.width||m.height!==meta.height)throw Error('Registration mismatch: '+file);
    // Identical canvas and padding for every pose; never trim individual frames.
    const input=await frame.resize(tile-padding*2,tile-padding*2,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).extend({top:padding,bottom:padding,left:padding,right:padding,background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
    composite.push({input,left:(first+i)%columns*tile,top:Math.floor((first+i)/columns)*tile});
  }
  clips[name]={first,count,fps:24,source:folder,width:meta.width,height:meta.height};first+=count;
}
fs.mkdirSync(output,{recursive:true});
await sharp({create:{width:columns*tile,height:rows*tile,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composite).png({compressionLevel:9}).toFile(path.join(output,'fire-breath.png'));
fs.writeFileSync(path.join(output,'fire-breath.json'),JSON.stringify({columns,rows,tile,padding,clips},null,2)+'\n');
console.log('Packed '+first+' authored fire-breath frames. Original registration retained.');
