import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const root=path.resolve(import.meta.dirname,'../..');
const input=process.argv[2]||path.join(root,'resources/art/fire-stampede');
const output=path.join(root,'resources/public/assets/vfx');
const tile=128,columns=8,frames=[],forms={};
// Fixed, empty patch of desktop under the isolated middle flame. The HUD,
// character and enemies are outside these crops in all three supplied clips.
async function extract(file,page,crop){
  const {data,info}=await sharp(file,{page}).extract(crop).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const background=await sharp(file,{page:0}).extract(crop).removeAlpha().raw().toBuffer();
  const pixels=Buffer.alloc(info.width*info.height*4);
  for(let i=0;i<info.width*info.height;i++){
    const j=i*3,r=data[j],g=data[j+1],b=data[j+2];
    if(r<190||r-b<65||g-b<25||r-background[j]<18)continue;
    // Unmatte the orange edge against the actual recorded desktop.
    const a=Math.max(0,Math.min(1,(r-background[j])/Math.max(1,255-background[j])));
    if(a<.12)continue;
    pixels.set([255,Math.max(0,Math.min(255,(g-background[j+1]*(1-a))/a)),
      Math.max(0,Math.min(255,(b-background[j+2]*(1-a))/a)),Math.round(a*255)],i*4);
  }
  return sharp(pixels,{raw:{width:info.width,height:info.height,channels:4}})
    .resize(tile-8,tile-8,{fit:'contain',background:'#00000000'})
    .extend({left:4,right:4,top:4,bottom:4,background:'#00000000'}).png().toBuffer();
}
for(const [id,word] of [[4,'炎'],[5,'焱'],[6,'燚']]){
  const name='烈焰狂奔_'+word+'.gif',file=path.join(input,name);
  const pages=Array.from({length:20},(_,i)=>26+i),first=frames.length;
  for(const page of pages)frames.push(await extract(file,page,{left:178,top:391,width:88,height:66}));
  const particle=frames.length;
  frames.push(await extract(file,30,{left:223,top:498,width:23,height:34}));
  forms[id]={word,source:name,sha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex'),first,count:pages.length,particle,fps:20,pages};
}
const rows=Math.ceil(frames.length/columns);
await sharp({create:{width:columns*tile,height:rows*tile,channels:4,background:'#00000000'}})
  .composite(frames.map((input,i)=>({input,left:i%columns*tile,top:Math.floor(i/columns)*tile})))
  .png().toFile(path.join(output,'fire-stampede.png'));
fs.writeFileSync(path.join(output,'fire-stampede.json'),JSON.stringify({tile,columns,rows,forms},null,2)+'\n');
console.log('Stampede:',frames.length,'frames, explicitly bound to 炎 / 焱 / 燚');
