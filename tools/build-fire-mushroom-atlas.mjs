import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {writeFireAtlas} from './pack-fire-atlas.mjs';
import family from '../source/public/assets/vfx/fire-family.json' with {type:'json'};
const root=path.resolve(import.meta.dirname,'..'),source=process.argv[2]||String.raw`\\192.168.10.148\aigc-1\AI_project_01\宝可梦轻量版美术资源\素材\外包`;
const output=path.join(root,'source/public/assets/vfx'),tile=512,columns=8,padding=4,images=[],clips={};
for(const name of ['pillar','eruption']){
 const original=family.clips[name];
 // Preserve the complete painted decay, including the thin late curls.
 // Interpolation in the renderer gives these registered frames a smooth tail.
 const frames=Array.from({length:16},(_,i)=>original.frames[Math.round(i*(original.frames.length-1)/15)]);
 const clip={...original,frames,count:frames.length},first=images.length;
 for(const file of clip.frames){
  // Rebuild from the original 1K art, never upscale the 256px family atlas.
  const input=await sharp(path.join(source,clip.source,file)).extract(clip.crop).resize(tile-padding*2,tile-padding*2,{fit:'contain',background:'#00000000'}).extend({top:padding,bottom:padding,left:padding,right:padding,background:'#00000000'}).png().toBuffer();images.push(input);
 }
 clips[name]={...clip,first};
}
const rows=Math.ceil(images.length/columns);
await writeFireAtlas(sharp({create:{width:columns*tile,height:rows*tile,channels:4,background:'#00000000'}}).composite(images.map((input,i)=>({input,left:i%columns*tile,top:Math.floor(i/columns)*tile}))),path.join(output,'fire-mushroom.png'));
fs.writeFileSync(path.join(output,'fire-mushroom.json'),JSON.stringify({tile,columns,rows,padding,clips},null,2)+'\n');console.log({frames:images.length,tile,width:columns*tile,height:rows*tile});
