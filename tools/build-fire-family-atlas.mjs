import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {writeFireAtlas} from './pack-fire-atlas.mjs';
import {fireFangDrawing} from './fire-fang-drawing.mjs';
import {fireScratchDrawing,fireScratchHitDrawing} from './fire-scratch-drawing.mjs';
const root=path.resolve(import.meta.dirname,'..');
const source=process.argv[2]||String.raw`\\192.168.10.148\aigc-1\AI_project_01\宝可梦轻量版美术资源\素材\外包`;
const output=path.join(root,'source/public/assets/vfx'),qa=path.join(root,'验收/炎喷火爪击蘑菇云-20261117');
// Refresh the existing vector jaw poses without re-quantising unrelated art.
if(process.argv.includes('--fang-only')){
 const file=path.join(output,'fire-family.png'),metaFile=path.join(output,'fire-family.json'),meta=JSON.parse(fs.readFileSync(metaFile)),clip=meta.clips.fang;
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<clip.count;i++){
  const input=await sharp(Buffer.from(fireFangDrawing(i,clip.count))).resize(meta.tile-meta.padding*2,meta.tile-meta.padding*2).extend({top:meta.padding,bottom:meta.padding,left:meta.padding,right:meta.padding,background:'#00000000'}).ensureAlpha().raw().toBuffer(),index=clip.first+i,left=index%meta.columns*meta.tile,top=Math.floor(index/meta.columns)*meta.tile;
  for(let row=0;row<meta.tile;row++)input.copy(data,((top+row)*info.width+left)*4,row*meta.tile*4,(row+1)*meta.tile*4);
 }
 const png=await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png({compressionLevel:9}).toBuffer();fs.writeFileSync(file,png);
 clip.revision='closed-jaw-impact-20261117';fs.writeFileSync(metaFile,JSON.stringify(meta,null,2)+'\n');
 console.log('Updated',clip.count,'jaw poses; other atlas pixels preserved');process.exit(0);
}
// Original drawings, with a shared crop for the entire sequence. Transparent
// export lead-ins are removed; per-frame cropping would make the art wobble.
const sources=[
 ['wake','醉拳-技能04-醉崩肘/火焰喷射',15],
 ['curl','醉拳-技能04-醉崩肘/火焰拖尾',10],
 ['charge','醉拳-技能03-醉乱打/3星/蓄力',7],
 ['burst','醉拳-技能09-醉喷火/爆点02',16],
 ['ring','醉拳-技能11-醉千坛/火圈/huoquan',16],
 ['crack','醉拳-技能05-醉狂舞/地裂',12],
 ['eruption','醉拳-技能11-醉千坛/酒坛爆炸/jiutanbaozha',18],
 ['meteorHit','醉拳-技能11-醉千坛/下落爆炸/xialuobaozha',16],
 ['meteor','醉拳-技能11-醉千坛/子弹/zidan',12],
 ['pillar','醉拳-技能12-醉腾云/龙头受击',24],
 ['shockwave','醉拳-技能12-醉腾云/龙头受击扩散波',12],
 ['seal','醉拳-技能12-醉腾云/上踢牵引',10],
 ['sweepRing','醉拳-技能10-醉旋踢/施法',12],
 ['blade','形意拳-技能6-螳螂削腕/刀光',12],
];
// Keep the atlas within the 4096 texture limit while giving each frame 33%
// more linear detail. Remove unused clips and redundant intermediate poses.
const tile=256,columns=16,padding=4,images=[],clips={},contact=[];
for(const [name,folder,maxFrames] of sources){
 const dir=path.join(source,folder),files=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort();
 let bounds={left:Infinity,top:Infinity,right:0,bottom:0},active=[],reference;
 for(const file of files){
  const {data,info}=await sharp(path.join(dir,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  reference??=info;if(info.width!==reference.width||info.height!==reference.height)throw Error('Unregistered clip '+folder);
  let pixels=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>12){pixels++;bounds.left=Math.min(bounds.left,x);bounds.right=Math.max(bounds.right,x);bounds.top=Math.min(bounds.top,y);bounds.bottom=Math.max(bounds.bottom,y);}
  if(pixels>8)active.push(file);
 }
 if(!active.length)throw Error('Empty sequence '+folder);
 const count=Math.min(maxFrames,active.length),frames=Array.from({length:count},(_,i)=>active[Math.round(i*(active.length-1)/(count-1))]);
 const crop={left:bounds.left,top:bounds.top,width:bounds.right-bounds.left+1,height:bounds.bottom-bounds.top+1};
 const first=images.length;
 for(const file of frames){
  const input=await sharp(path.join(dir,file)).extract(crop).resize(tile-padding*2,tile-padding*2,{fit:'contain',background:'#00000000'}).extend({top:padding,bottom:padding,left:padding,right:padding,background:'#00000000'}).png().toBuffer();images.push(input);
 }
 clips[name]={first,count,fps:24,source:folder,sourceFrames:files.length,activeFrames:active.length,frames,crop};
 console.log(name,count,active.length,crop);
 const row=Object.keys(clips).length-1;
 for(let j=0;j<4;j++)contact.push({input:images[first+Math.min(count-1,Math.floor(count*(j+.4)/4))],left:j*tile,top:row*(tile+24)+24});
 contact.push({input:Buffer.from(`<svg width="768" height="24"><text x="6" y="18" fill="white" font-size="16">${name} / ${count} frames</text></svg>`),left:0,top:row*(tile+24)});
}
const fangFirst=images.length;
for(let i=0;i<14;i++)images.push(await sharp(Buffer.from(fireFangDrawing(i))).resize(tile-padding*2,tile-padding*2).extend({top:padding,bottom:padding,left:padding,right:padding,background:'#00000000'}).png().toBuffer());
clips.fang={first:fangFirst,count:14,fps:40,source:'tools/fire-fang-drawing.mjs; existing game Fang silhouette',width:512,height:512};
const rakeFirst=images.length;
for(let i=0;i<12;i++)images.push(await sharp(Buffer.from(fireScratchDrawing(i))).resize(tile-padding*2,tile-padding*2).extend({top:padding,bottom:padding,left:padding,right:padding,background:'#00000000'}).png().toBuffer());
clips.rake={first:rakeFirst,count:12,fps:30,source:'tools/fire-scratch-drawing.mjs; code-drawn melee ink strokes',width:512,height:512};
const hitFirst=images.length;
for(let i=0;i<10;i++)images.push(await sharp(Buffer.from(fireScratchHitDrawing(i))).resize(tile-padding*2,tile-padding*2).extend({top:padding,bottom:padding,left:padding,right:padding,background:'#00000000'}).png().toBuffer());
clips.scratchHit={first:hitFirst,count:10,fps:40,source:'tools/fire-scratch-drawing.mjs; single wound',width:512,height:512};
// Air Slash uses the library's animated cutting rim, rather than a solid icon.
// Append after the other moves so their frame registration remains unchanged.
for(const [clip,folder] of [['windCut','如来神掌-技能7-金波震岳/如来神掌_技能7_金波震岳/弹道'],['windHit','形意拳-技能6-螳螂削腕/爆点']]){
 const dir=path.join(source,folder),files=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort(),frames=[];
 const bounds={left:Infinity,top:Infinity,right:0,bottom:0};
 for(const file of files){
  const {data,info}=await sharp(path.join(dir,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});let pixels=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>12){pixels++;bounds.left=Math.min(bounds.left,x);bounds.right=Math.max(bounds.right,x);bounds.top=Math.min(bounds.top,y);bounds.bottom=Math.max(bounds.bottom,y);}
  if(pixels>8)frames.push(file);
 }
 if(!frames.length)throw Error('Empty wind clip '+folder);
 const crop={left:bounds.left,top:bounds.top,width:bounds.right-bounds.left+1,height:bounds.bottom-bounds.top+1},first=images.length;
 for(const file of frames)images.push(await sharp(path.join(dir,file)).extract(crop).resize(tile-padding*2,tile-padding*2,{fit:'contain',background:'#00000000'}).extend({top:padding,bottom:padding,left:padding,right:padding,background:'#00000000'}).png().toBuffer());
 clips[clip]={first,count:frames.length,fps:30,source:folder,sourceFrames:files.length,frames,crop};
}
const rows=Math.ceil(images.length/columns);
if(rows*tile>4096)throw Error('Fire atlas exceeds portable texture size');
fs.mkdirSync(output,{recursive:true});fs.mkdirSync(qa,{recursive:true});
await writeFireAtlas(sharp({create:{width:tile*columns,height:tile*rows,channels:4,background:'#00000000'}}).composite(images.map((input,i)=>({input,left:i%columns*tile,top:Math.floor(i/columns)*tile}))),path.join(output,'fire-family.png'));
fs.writeFileSync(path.join(output,'fire-family.json'),JSON.stringify({tile,columns,rows,padding,clips},null,2)+'\n');
await sharp({create:{width:tile*4,height:sources.length*(tile+24),channels:4,background:'#313946'}}).composite(contact).png().toFile(path.join(qa,'selected-clips.png'));
