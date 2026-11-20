import fs from 'node:fs';import path from 'node:path';import sharp from 'sharp';
import {writeFireAtlas} from './pack-fire-atlas.mjs';
const root=path.resolve(import.meta.dirname,'..'),source=String.raw`\\192.168.10.148\aigc-1\AI_project_01\宝可梦轻量版美术资源\素材\外包`,out=path.join(root,'source/public/assets/vfx');
const tile=384,padding=5,columns=8,images=[],clips={};
for(const [key,folder,count] of [['dragon','形意拳_技能1_伏龙探爪/long',16],['goldBurst','如来神掌-技能9-裂地震波/hit',11],['gate','如来神掌-技能4-天光降世/施法',12]]){
 const files=fs.readdirSync(path.join(source,folder)).filter(f=>f.endsWith('.png')).sort(),active=[],bounds={left:Infinity,top:Infinity,right:0,bottom:0};
 for(const file of files){const {data,info}=await sharp(path.join(source,folder,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});let pixels=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){pixels++;bounds.left=Math.min(bounds.left,x);bounds.top=Math.min(bounds.top,y);bounds.right=Math.max(bounds.right,x);bounds.bottom=Math.max(bounds.bottom,y);}if(pixels>8)active.push(file);}
 const frames=Array.from({length:Math.min(count,active.length)},(_,i)=>active[Math.round(i*(active.length-1)/(Math.min(count,active.length)-1))]),crop={left:bounds.left,top:bounds.top,width:bounds.right-bounds.left+1,height:bounds.bottom-bounds.top+1},first=images.length;
 for(const file of frames)images.push(await sharp(path.join(source,folder,file)).extract(crop).resize(tile-padding*2,tile-padding*2,{fit:'contain',background:'#00000000'}).extend({top:padding,bottom:padding,left:padding,right:padding,background:'#00000000'}).png().toBuffer());
 clips[key]={first,count:frames.length,source:folder,frames,crop};
}
// Preserve the existing star symbol as a crisp, flat vector icon;
// the animated light and impact sequences above are unredrawn library artwork.
const points=(outer,inner)=>Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2?inner:outer;return `${256+Math.cos(a)*r},${256+Math.sin(a)*r}`;}).join(' ');
const glyphs={star:`<polygon points="${points(224,101)}" fill="#c67619" stroke="#8d4216" stroke-width="9" stroke-linejoin="round"/><polygon points="${points(199,89)}" fill="#ffd554"/><polygon points="${points(137,65)}" fill="#fff2af"/>`};
for(const [key,body] of Object.entries(glyphs)){clips[key]={first:images.length,count:1,source:'Existing game symbol, vector reconstruction',width:512,height:512};images.push(await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">${body}</svg>`)).resize(tile-padding*2,tile-padding*2).extend({top:padding,bottom:padding,left:padding,right:padding,background:'#00000000'}).png().toBuffer());}
const rows=Math.ceil(images.length/columns);await writeFireAtlas(sharp({create:{width:tile*columns,height:tile*rows,channels:4,background:'#00000000'}}).composite(images.map((input,i)=>({input,left:i%columns*tile,top:Math.floor(i/columns)*tile}))),path.join(out,'fire-completion.png'));
fs.writeFileSync(path.join(out,'fire-completion.json'),JSON.stringify({tile,columns,rows,padding,clips},null,2)+'\n');console.log({frames:images.length,width:tile*columns,height:tile*rows,clips:Object.keys(clips)});
