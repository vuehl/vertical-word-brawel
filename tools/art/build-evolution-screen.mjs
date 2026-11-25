import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'../..');
const art=path.join(root,'resources/art/upgrade');
const output=path.join(root,'resources/public/assets/vfx');
const width=390,height=844;
const read=async name=>sharp(path.join(art,name),{animated:true}).removeAlpha().raw().toBuffer({resolveWithObject:true});
const [full,base]=await Promise.all([read('进化全屏.gif'),read('jinhua.gif')]);
if(full.info.width!==390||full.info.height!==892*171||base.info.width!==368||base.info.height!==276*171)
  throw Error('Expected the matching 171-frame evolution recordings');


const metadata=await sharp(path.join(art,'进化全屏.gif'),{animated:true}).metadata();
const times=[0];for(const delay of metadata.delay)times.push(times.at(-1)+delay/1000);
const sourceFrames=Array.from({length:143},(_,frame)=>frame);
const flashes=[],liftPixels=[];
for(let frame=0;frame<171;frame++){
  const blues=[];let bottom=0;
  for(let y=20;y<210;y++)for(let x=100;x<270;x++){
    const i=(frame*368*276+y*368+x)*3,r=base.data[i],g=base.data[i+1],b=base.data[i+2];
    if(r>140&&r>g*1.3&&r>b*1.4){blues.push(b);bottom=Math.max(bottom,y);}
  }
  blues.sort((a,b)=>a-b);
  flashes.push(+Math.max(0,Math.min(1,((blues[Math.floor(blues.length*.5)]??255)-51)/204)).toFixed(4));
  liftPixels.push(frame<126?0:bottom?Math.max(0,162-bottom):Math.max(0,(frame-126)*7));
}
const inkHeights={};
for(const id of [4,5,6,16,17,18,58,59]){
  const data=await sharp(path.join(root,`resources/public/assets/glyphs/hero-actions/${id}.png`)).extract({left:0,top:0,width:160,height:160}).ensureAlpha().raw().toBuffer();
  let top=160,bottom=0;
  for(let y=0;y<160;y++)for(let x=0;x<160;x++)if(data[(y*160+x)*4+3]>128){top=Math.min(top,y);bottom=Math.max(bottom,y);}
  inkHeights[id]=(bottom-top+1)/160;
}
// Compare the red ink independently of the desk and gold particles. Trim
// the extreme bins so a single GIF palette speck cannot resize a character.
function inkShape(width,height,isInk){
  const xs=[],ys=[],mask=new Uint8Array(width*height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(isInk(x,y)){
    xs.push(x);ys.push(y);mask[y*width+x]=1;
  }
  if(xs.length<120)return null;
  xs.sort((a,b)=>a-b);ys.sort((a,b)=>a-b);
  const left=xs[Math.floor(xs.length*.015)],right=xs[Math.floor(xs.length*.985)];
  const top=ys[Math.floor(ys.length*.012)],bottom=ys[Math.floor(ys.length*.988)];
  const w=right-left+1,h=bottom-top+1,shape=[];
  for(let y=0;y<20;y++)for(let x=0;x<16;x++){
    shape.push(mask[(top+Math.floor((y+.5)*h/20))*width+left+Math.floor((x+.5)*w/16)]);
  }
  return {w,h,shape,count:xs.length};
}
function glyphSample(frame,clean,lift){
  const w=clean?368:390,h=clean?276:892,buffer=clean?base.data:full.data;
  const left=clean?124:135,top=(clean?55:333)-Math.round(lift);
  return inkShape(120,115,(x,y)=>{
    const i=((frame*h+top+y)*w+left+x)*3;
    const r=buffer[i],g=buffer[i+1],b=buffer[i+2];
    return r-g>52&&g-b<112&&r>78;
  });
}
const poses=[],round=v=>+v.toFixed(4);
for(const [id,start,end,neutral] of [[4,0,126,0],[5,126,171,170]]){
  const frames=[];
  for(let i=0;i<19;i++){
    const image=await sharp(path.join(root,'resources/public/assets/glyphs/hero-actions',id+'.png'))
      .extract({left:i%8*160,top:Math.floor(i/8)*160,width:160,height:160}).ensureAlpha().raw().toBuffer();
    frames.push(inkShape(160,160,(x,y)=>{
      const k=(y*160+x)*4;
      return image[k+3]>160&&image[k]-image[k+1]>52;
    }));
  }
  const measured=[];
  for(let f=start;f<end;f++){
    const plate=glyphSample(f,true,liftPixels[f]),recorded=glyphSample(f,false,liftPixels[f]);
    const ink=recorded&&(!plate||recorded.count>=plate.count*.75)?recorded:plate;
    if(!ink){measured.push(null);continue;}
    const shape=plate??ink;
    const scores=frames.map(tile=>tile.shape.reduce((sum,value,k)=>sum+Math.abs(value-shape.shape[k]),0));
    const index=scores.indexOf(Math.min(...scores));
    measured.push({index,x:ink.w/frames[index].w,y:ink.h/frames[index].h});
  }
  const rest=measured[neutral-start];
  for(let i=0;i<measured.length;i++){
    // When the flash fully covers the ink, borrow the nearest visible pose
    // at the same phase of the recorded three-frame contraction.
    let m=measured[i];
    if(!m)for(let d=3;!m&&d<measured.length;d+=3)m=measured[i-d]||measured[i+d];
    m??=rest;
    poses.push([m.index,round(Math.max(.55,Math.min(1.45,m.x/rest.x))),
      round(Math.max(.55,Math.min(1.45,m.y/rest.y)))]);
  }
}
const python=process.env.POKEBONK_PYTHON||(process.platform==='win32'?'py':'python3');
const paint=JSON.parse(execFileSync(python,['-B',path.join(import.meta.dirname,'evolution-reference-light.py'),
  path.join(output,'evolution-screen.webp')],{encoding:'utf8',windowsHide:true}));
fs.writeFileSync(path.join(output,'evolution-screen.json'),JSON.stringify({...paint,width,height,focus:[.5,1-368/844],
  duration:times.at(-1),reveal:times[126],times,sourceFrames,flashes,liftPixels,poses,
  camera:{inkPixels:80,feetY:402,inkHeights}})+'\n');
console.log('Evolution screen:',fs.statSync(path.join(output,'evolution-screen.webp')).size,'bytes');
