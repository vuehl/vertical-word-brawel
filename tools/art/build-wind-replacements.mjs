import path from 'node:path';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {clarifyWindFrame,unmixWindInk,windClarity,writeWindAtlas} from './wind-art-clarity.mjs';

const references=path.resolve(import.meta.dirname,'../../resources/art/wind-supplement');
const output=path.resolve(import.meta.dirname,'../../resources/public/assets/vfx');
const tile=144,columns=8,layers=[],clips={};
const range=(first,last)=>Array.from({length:last-first+1},(_,i)=>first+i);

async function recording(source){
  const file=await fs.readFile(path.join(references,source));
  const {width,delay}=await sharp(file,{animated:true}).metadata();
  const read=page=>sharp(file,{page}).removeAlpha().raw().toBuffer();
  return {source,sha256:createHash('sha256').update(file).digest('hex'),width,delay,read,background:await read(4)};
}

async function clip(key,source,pages,crop,matte){
  const {width,delay,background,read}=source;
  const times=[0];
  clips[key]={first:layers.length,count:pages.length,times,source:source.source,sha256:source.sha256,pages};
  for(const page of pages){
    const {left,top,readPage=page,opacity=1}=crop(page);
    const rgb=await read(readPage),pixels=Buffer.alloc(tile*tile*4);
    for(let y=1;y<tile-1;y++)for(let x=1;x<tile-1;x++){
      const k=((top+y)*width+left+x)*3;
      const r=rgb[k],g=rgb[k+1],b=rgb[k+2],br=background[k],bg=background[k+1],bb=background[k+2];
      const alpha=matte({r,g,b,br,bg,bb,x,y,page});
      if(alpha<=0)continue;
      const ink=unmixWindInk([r,g,b],[br,bg,bb],alpha);
      ink[3]=Math.round(ink[3]*opacity);
      pixels.set(ink,(y*tile+x)*4);
    }
    const index=layers.length;
    layers.push({input:clarifyWindFrame(pixels,tile,tile),raw:true,left:index%columns*tile,top:Math.floor(index/columns)*tile});
    times.push(times.at(-1)+delay[page]);
  }
}

const gust=await recording('起风.gif');
await clip('gust',gust,range(6,25),page=>{
  // The damage number covers the funnel near the end. Use the preceding
  // unobscured spin poses for those exposures and retain the recorded fade.
  const readPage=page===6?8:page<=13?page:8+(page-14)%6;
  return {left:Math.round(127+(readPage-6)*3.15),top:382-Math.round((readPage-6)*9.4),
    readPage,opacity:page===6?.45:page<21?1:[.78,.59,.38,.21,.1][page-21]};
},({r,g,b,br,bg,bb,x,y})=>{
  if(Math.abs(x-72)>Math.min(65,12+(130-y)*.7)||y>130)return 0;
  const diff=Math.abs(r-br)+Math.abs(g-bg)+Math.abs(b-bb);
  if(diff<12||g<68||g-b< -8||g-b>61)return 0;
  if(g-r>8&&b-r>0)return Math.min(255,diff*1.7);
  return g>190&&b>170&&g-r>=0?Math.min(255,diff*1.4):0;
});

const feather=await recording('羽毛舞.gif');
const cyan=({r,g,b,br,bg,bb})=>{
  const diff=Math.abs(r-br)+Math.abs(g-bg)+Math.abs(b-bb);
  return diff>11&&g-r>8&&b-r>3&&g-b> -17&&g-b<70?Math.min(255,diff*1.7):0;
};
await clip('launch',feather,range(6,9),()=>({left:123,top:450}),o=>{
  const radius=Math.hypot(o.x-72,(o.y-75)*1.15);
  if(radius<30||radius>56||o.y<41)return 0;
  return cyan(o);
});
await clip('flight',feather,range(10,12),page=>({left:123,top:[374,357,337][page-10]}),o=>{
  if(Math.abs(o.x-72)>8||Math.abs(o.y-72)>36)return 0;
  return cyan(o);
});
await clip('hit',feather,range(13,29),()=>({left:123,top:305}),o=>{
  if(o.y<41||o.y>112||Math.hypot((o.x-72)/55,(o.y-73)/43)>1)return 0;
  return cyan(o);
});

const rows=Math.ceil(layers.length/columns);
await writeWindAtlas(layers,tile,columns,rows,path.join(output,'wind-replacements.png'));
await fs.writeFile(path.join(output,'wind-replacements.json'),JSON.stringify({tile,columns,rows,clips,clarity:windClarity})+'\n');
