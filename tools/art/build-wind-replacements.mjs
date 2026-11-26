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
// Register each exposure to the caster, the projectile, or the contact point.
// All coordinates below are in pixels of the 390 x 844 reference recording.
const plate=await feather.read(12);
async function featherClip(key,first,last,sample){
  const pages=range(first,last), times=[0];
  clips[key]={first:layers.length,count:pages.length,times,source:feather.source,sha256:feather.sha256,pages};
  for(const page of pages){
    const rgb=await feather.read(page), pixels=Buffer.alloc(tile*tile*4);
    for(let y=0;y<tile;y++)for(let x=0;x<tile;x++){
      const ink=sample(page,x-tile/2,y-tile/2,rgb);
      if(ink)pixels.set(ink,(y*tile+x)*4);
    }
    const index=layers.length;
    layers.push({input:pixels,raw:true,left:index%columns*tile,top:Math.floor(index/columns)*tile});
    times.push(times.at(-1)+feather.delay[page]);
  }
}

function liftInk(frame,x,y,overActor=false){
  const k=(y*feather.width+x)*3;
  const rgb=frame.subarray(k,k+3),bg=plate.subarray(k,k+3);
  const [r,g,b]=rgb;
  // The moving glyph has no clean plate. Only its overlapping feather colours
  // are recoverable. On the static desk the colour difference preserves fades.
  if(overActor){
    if(g-r<14||b-r<12||b-g>35||g-b>30||g<95)return;
    return [r,g,b,Math.min(255,Math.round((g-r)*4.5))];
  }
  const diff=Math.max(...rgb.map((v,i)=>Math.abs(v-bg[i])));
  if(diff<7)return;
  const chroma=(b-r)-(bg[2]-bg[0]);
  if(chroma<4&&!(g>=r&&b>=r&&diff>15))return;
  const targetChroma=50;
  const alpha=Math.min(1, Math.max(diff/160,chroma/Math.max(35,targetChroma-bg[2]+bg[0])));
  return unmixWindInk([r,g,b],bg,alpha*255);
}

await featherClip('launch',13,19,(page,dx,dy,frame)=>{
  const radius=Math.hypot(dx,dy/.84);
  if(radius<23||radius>38)return;
  // The health bar covers the bottom arc, and the three departing tips cross
  // the top. Sample an unobstructed arc at the same elliptical radius there.
  if(dy>=18||(dy<0&&dx>=-8&&dx<=15)){
    const angle=Math.atan2(dy/.84,dx)+(dy>=18?Math.PI*.65:-Math.PI*.35);
    dx=Math.round(radius*Math.cos(angle));dy=Math.round(radius*.84*Math.sin(angle));
  }
  return liftInk(frame,195+dx,420+dy);
});

const tipX=[197,197,198,198,199,199,199,200,200,201,201,201,202,202,203,203,203,203,204,204];
const tipY=[391,388,384,381,378,373,370,366,364,360,354,350,349,345,342,335,333,329,326,323];
await featherClip('flight',13,32,(page,dx,dy,frame)=>{
  const row=dy+15;
  if(row<0||row>31||Math.abs(dx)>3)return;
  const index=page-13;
  // Unshear the middle feather to face up. The billboard then uses its live
  // velocity, including when a surviving shot acquires a different enemy.
  const x=tipX[index]+dx-Math.round(row*.11), y=tipY[index]+row;
  if(page<20&&y>=392){
    const k=(y*feather.width+x)*3,[r,g,b]=frame.subarray(k,k+3);
    if(g-r<18||b-r<12||g-b< -35||g-b>30||Math.abs(dx)>Math.max(0,3-row*.09))return;
    return [r,g,b,255];
  }
  if(Math.abs(dx)>Math.min(3,1+row,Math.max(.55,(32-row)*.17)))return;
  const k=(y*feather.width+x)*3,[r,g,b]=frame.subarray(k,k+3);
  if((r>190&&g>=r&&b>r+4)||(g-r>42&&b-r>35))return [r,g,b,255];
  return liftInk(frame,x,y);
});

await featherClip('hit',33,72,(page,dx,dy,frame)=>{
  const x=203+dx,y=350+dy;
  if(x<146||x>246||y<314||y>378)return;
  // The damage popup crosses the top edge for seven exposures.
  if(page>=39&&page<=45&&y<[322,322,323,323,320,318,316][page-39])return;
  const overActor=x>=178&&x<=223&&y<328+Math.max(0,page-38)*.82;
  return liftInk(frame,x,y,overActor);
});

const rows=Math.ceil(layers.length/columns);
await writeWindAtlas(layers,tile,columns,rows,path.join(output,'wind-replacements.png'));
await fs.writeFile(path.join(output,'wind-replacements.json'),JSON.stringify({tile,columns,rows,clips,clarity:windClarity})+'\n');
