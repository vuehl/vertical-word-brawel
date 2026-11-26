import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {sampleWindInk,unmixWindInk,writeWindAtlas} from './wind-art-clarity.mjs';

const root=path.resolve(import.meta.dirname,'../..');
const source=path.join(root,'resources/art/air-slash-reference/空气斩.gif');
const output=path.join(root,'resources/public/assets/vfx');
const review=path.join(root,'验收/空气斩参考还原');
const metadata=await sharp(source,{animated:true}).metadata();
if(metadata.width!==390||metadata.pageHeight!==844||metadata.pages!==50||metadata.delay.some(ms=>ms!==20))
  throw Error('Air Slash extraction expects the supplied 390 × 844, 50-frame, 20 ms recording.');
const width=metadata.width,height=metadata.pageHeight;
const read=page=>sharp(source,{page}).removeAlpha().raw().toBuffer();
const background=await read(7);
const pages=Array.from({length:21},(_,i)=>i+7);
const exposures=await Promise.all(pages.map(read));
const tile=160,columns=7,rows=3;
// The reference uses a horizontal world-space wave viewed through the desk's
// fixed orthographic camera. Rectify its projected depth, not its silhouette.
const centreX=195,screenWidth=130.8,screenDepth=screenWidth*.62/1.44*Math.sin(Math.PI*.3);
const nose=224/232;
const {data:shape,info}=await sharp(path.join(output,'air-slash-wave.webp')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
function brush(u,v,progress){
  u+=.029*(1-u)*Math.sin(v*49-progress*19);
  const px=clamp(u)*info.width-.5,py=(1-clamp(v))*info.height-.5;
  return sampleWindInk(px,py,(x,y)=>{
    if(x<0||y<0||x>=info.width||y>=info.height)return;
    const k=(y*info.width+x)*4;return [...shape.subarray(k,k+4)];
  })??[0,0,0,0];
}
function masked(page,x,y){
  // Animated actors, hit flashes and floating numbers are not part of the blade.
  if(page<=12&&x>179&&x<213&&y>393&&y<435)return true;
  if(page>=13&&page<=20&&Math.hypot(x-194,y-349)<24)return true;
  if(page>=21&&Math.hypot(x-228,y-276)<37)return true;
  if(page>=19&&x>169&&x<231&&y>302&&y<342)return true;
  return false;
}
function coverage(x,y,frame){
  const k=(y*width+x)*3,base=background.subarray(k,k+3),rgb=frame.subarray(k,k+3);
  const blue=rgb[2]-base[2];
  if(blue<3||rgb[1]<base[1]-18)return 0;
  return clamp(blue/Math.max(1,255-base[2]));
}
// Fit only the moving edge against the unchanged desktop. Each GIF exposure
// retains its measured position, including uneven render/physics cadence.
const fronts=[null],fits=[];
for(let i=1;i<pages.length;i++){
  const frame=exposures[i],page=pages[i],expected=405-(i-1)*9.6;
  let best={error:Infinity,front:expected};
  for(let front=expected-8;front<=expected+8;front+=.25){
    let error=0,count=0;
    for(let y=Math.floor(expected-8);y<expected+48;y++)for(let x=132;x<260;x+=2){
      if(masked(page,x,y))continue;
      const u=nose-(y-front)/screenDepth,v=.5+(x-centreX)/screenWidth;
      const a=brush(u,v,i*.02/.42)[3]/255;
      const observed=coverage(x,y,frame);
      // Fit the leading contour. Interior colour/coverage is recovered below.
      if(u>.77){error+=(smooth(.06,.25,a)-smooth(.03,.14,observed))**2;count++;}
    }
    error/=Math.max(1,count);
    if(error<best.error)best={error,front};
  }
  fronts.push(best.front);fits.push({page,front:best.front,error:best.error});
}
function pixel(index,u,v){
  const x=centreX+(v-.5)*screenWidth,y=fronts[index]+(nose-u)*screenDepth;
  const page=pages[index],frame=exposures[index];
  if(masked(page,x,y))return;
  const bx=Math.floor(x),by=Math.floor(y);
  // Masking is checked on the whole sample footprint to avoid halo remnants.
  if(masked(page,bx-2,by-2)||masked(page,bx+2,by+2))return;
  return sampleWindInk(x,y,(sx,sy)=>{
    if(sx<0||sy<0||sx>=width||sy>=height)return;
    const k=(sy*width+sx)*3,base=background.subarray(k,k+3),rgb=frame.subarray(k,k+3);
    const a=coverage(sx,sy,frame);
    return a?unmixWindInk([...rgb],base,a*255):[0,0,0,0];
  })??[0,0,0,0];
}
const layers=[],counts=[];
const donorOrder=pages.map((_,i)=>Array.from({length:pages.length-1},(_,j)=>j+1)
  .sort((a,b)=>Math.abs(a-i)-Math.abs(b-i)));
for(let i=0;i<pages.length;i++){
  const rgba=Buffer.alloc(tile*tile*4);let donorPixels=0,visiblePixels=0;
  if(i)for(let y=0;y<tile;y++){
    const v=1-(y+.5)/tile;
    let leading=tile-1;
    while(leading>=0&&brush((leading+.5)/tile,v,i*.02/.42)[3]<3)leading--;
    if(leading>=0)leading=Math.min(tile-1,leading+4);
    for(let x=0;x<=leading;x++){
      const u=(x+.5)/tile;
      // Gate only ahead of the clean leading edge. The new reference's longer
      // translucent wake must not be clipped to the old, thinner sprite.
      let ink=pixel(i,u,v);
      if(!ink){
        for(const donor of donorOrder[i]){ink=pixel(donor,u,v);if(ink)break;}
        donorPixels++;
      }
      if(ink?.[3]){rgba.set(ink,(y*tile+x)*4);visiblePixels++;}
    }
  }
  counts.push({page:pages[i],visiblePixels,donorPixels});
  layers.push({input:rgba,raw:{width:tile,height:tile,channels:4},left:i%columns*tile,top:Math.floor(i/columns)*tile});
}
const times=[0];for(const page of pages)times.push(times.at(-1)+metadata.delay[page]);
const atlas={tile,columns,rows,first:0,count:pages.length,pages,times,
  source:'air-slash-reference/空气斩.gif',sha256:createHash('sha256').update(fs.readFileSync(source)).digest('hex'),
  sourceSize:[width,height],sourceStartMs:metadata.delay.slice(0,pages[0]).reduce((a,b)=>a+b,0),
  registration:{centreX,screenWidth,screenDepth,fronts},
  extraction:'Original GIF RGB/coverage, desktop unmatted; occluded pixels borrowed from the nearest clear exposure; clean leading contour gates background.'};
fs.writeFileSync(path.join(output,'air-slash-reference.json'),JSON.stringify(atlas,null,2)+'\n');
await writeWindAtlas(layers,tile,columns,rows,path.join(output,'air-slash-reference.png'));
fs.mkdirSync(review,{recursive:true});
fs.writeFileSync(path.join(review,'extraction.json'),JSON.stringify({fits,counts},null,2)+'\n');
console.log('Air Slash:',pages.length,'exposures,',times.at(-1),'ms;',tile*columns,'x',tile*rows);
