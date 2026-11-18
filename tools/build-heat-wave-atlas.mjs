import fs from 'node:fs';import path from 'node:path';import sharp from 'sharp';
import {writeFireAtlas} from './pack-fire-atlas.mjs';
const root=path.resolve(import.meta.dirname,'..'),folder='醉拳-技能08-醉倒钩/醉倒钩120度子弹';
const dir=path.join(String.raw`\\192.168.10.148\aigc-1\AI_project_01\宝可梦轻量版美术资源\素材\外包`,folder),out=path.join(root,'source/public/assets/vfx');
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort(),bounds={left:Infinity,top:Infinity,right:0,bottom:0};
for(const file of files){const {data,info}=await sharp(path.join(dir,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){bounds.left=Math.min(bounds.left,x);bounds.top=Math.min(bounds.top,y);bounds.right=Math.max(bounds.right,x);bounds.bottom=Math.max(bounds.bottom,y);}}
const crop={left:bounds.left,top:bounds.top,width:bounds.right-bounds.left+1,height:bounds.bottom-bounds.top+1},tile=384,columns=4,rows=Math.ceil(files.length/columns),padding=5,layers=[];
for(const [i,file] of files.entries())layers.push({input:await sharp(path.join(dir,file)).extract(crop).resize(tile-padding*2,tile-padding*2,{fit:'contain',background:'#00000000'}).extend({top:padding,bottom:padding,left:padding,right:padding,background:'#00000000'}).png().toBuffer(),left:i%columns*tile,top:Math.floor(i/columns)*tile});
await writeFireAtlas(sharp({create:{width:tile*columns,height:tile*rows,channels:4,background:'#00000000'}}).composite(layers),path.join(out,'heat-wave.png'));
fs.writeFileSync(path.join(out,'heat-wave.json'),JSON.stringify({tile,columns,rows,padding,clips:{front:{first:0,count:files.length,source:folder,frames:files,crop}}},null,2)+'\n');
console.log({source:folder,frames:files.length,tile,crop});
