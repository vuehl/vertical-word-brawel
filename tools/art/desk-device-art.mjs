import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {artImage} from './art-source.mjs';
import {altarLayers} from '../../source/src/world/desk-altar-art.js';
import {berryLayers} from '../../source/src/world/desk-berry-art.js';
import {billLayers} from '../../source/src/effects/bill-layers.js';
import {deskPixelsPerUnit} from '../../source/src/world/desk-framing.js';
import {facilityIconFile,illustratedFacilityFiles,isContactFacility} from '../../source/src/data/active-content.js';

async function writePng(file,pipeline){
  const bytes=await pipeline.png().toBuffer();
  const current=await fs.readFile(file).catch(error=>{if(error.code!=='ENOENT')throw error;});
  if(!current?.equals(bytes))await fs.writeFile(file,bytes);
}

// Compose at the artist's original coordinates before trimming the transparent
// margins so the map markers remain legible at HUD size.
async function writeDeviceIcon(source,kind,base,layers=[]){
  const composed=layers.length?await sharp(base).composite(layers).png().toBuffer():base;
  await writePng(path.join(source,'../resources/public/assets',facilityIconFile(kind)),
    sharp(composed).trim({background:'#0000'}).resize(128,128,{fit:'contain',background:'#0000'}));
}

async function prepareBill(source){
  const originals=path.join(source,'../resources/art/device-bill'),out=path.join(source,'../resources/public/assets/env/desk2d');
  const art=name=>artImage(path.join(originals,path.basename(billLayers[name])));
  await fs.mkdir(path.join(out,'device-bill'),{recursive:true});
  for(const name of ['base','pupil'])await writePng(path.join(out,billLayers[name]),sharp(art(name)));
  const {width,height}=await sharp(art('base')).metadata();
  const pupil=await sharp(art('pupil')).metadata();
  const frame={width,height,pupil:[pupil.width,pupil.height]};
  for(const name of ['face','highlight']){
    const {data,info}=await sharp(art(name)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    if(info.width!==width||info.height!==height)throw Error('订书机图层画布尺寸不一致：'+name);
    let l=width,t=height,r=0,b=0,eyeL=width,eyeT=height,eyeR=0,eyeB=0;
    for(let i=0;i<data.length;i+=4){
      if(!data[i+3])continue;
      const x=i/4%width,y=Math.floor(i/4/width);
      l=Math.min(l,x);r=Math.max(r,x+1);t=Math.min(t,y);b=Math.max(b,y+1);
      if(name==='face'&&data[i+3]>240&&data[i+1]-data[i]>90&&data[i+1]-data[i+2]>12){
        eyeL=Math.min(eyeL,x);eyeR=Math.max(eyeR,x+1);eyeT=Math.min(eyeT,y);eyeB=Math.max(eyeB,y+1);
      }
    }
    frame[name]=[l,t,r-l,b-t];
    if(name==='face'){
      if(eyeR-eyeL<pupil.width||eyeB-eyeT<pupil.height)throw Error('订书机脸部的亮青色区域无法容纳眼球');
      frame.socket=[eyeL,eyeT,eyeR-eyeL,eyeB-eyeT];
    }
    await sharp(art(name)).extract({left:l,top:t,width:r-l,height:b-t}).png().toFile(path.join(out,billLayers[name]));
  }
  const silhouette=await sharp(art('base')).composite([{input:art('face')}]).png().toBuffer();
  const [x,y,w,h]=frame.socket;
  await writeDeviceIcon(source,'bill',art('base'),[
    {input:art('face')},
    {input:art('pupil'),left:Math.round(x+(w-pupil.width)/2),top:Math.round(y+(h-pupil.height)/2)},
    {input:art('highlight')},
  ]);
  return {frame,silhouette};
}

// Remove the painted 300 from the master before adding the live display. Only
// fill the ink and its antialiased border, interpolating the adjacent blue glass.
async function prepareClock(root){
  const {data,info}=await sharp(artImage(path.join(root,'../resources/art/device-boss.png'))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width,height}=info,mask=new Uint8Array(width*height),inside=[];
  const det=44.04*77.5+31.15*27.3;
  // Leave the underline, bezel, reflected highlights and alpha intact.
  for(let y=130;y<347;y++)for(let x=66;x<258;x++){
    const dx=x-126.3,dy=y-171.7,col=(77.5*dx+27.3*dy)/det,row=(44.04*dy-31.15*dx)/det;
    if(col<-.53||col>2.53||row<-.103||row>1.108)continue;
    mask[y*width+x]=1;inside.push((y*width+x)*4);
  }
  const glass=Float32Array.from(data);
  for(let y=130;y<347;y++)for(let x=66;x<258;x++){
    if(!mask[y*width+x])continue;
    const start=x;while(mask[y*width+x])x++;
    for(let px=start;px<x;px++){
      const t=(px-start+1)/(x-start+1);
      for(let c=0;c<3;c++)glass[(y*width+px)*4+c]=
        (1-t)*data[(y*width+start-1)*4+c]+t*data[(y*width+x)*4+c];
    }
  }
  // Relax the interior to a smooth colour field bounded by the original glass.
  const stride=4*width;
  for(let pass=0;pass<160;pass++)for(const i of inside)for(let k=i;k<i+3;k++)
    glass[k]+=.4*(glass[k-4]+glass[k+4]+glass[k-stride]+glass[k+stride]-4*glass[k]);
  for(const i of inside)for(let c=0;c<3;c++)data[i+c]=Math.round(glass[i+c]);
  await writePng(path.join(root,'../resources/public/assets/env/desk2d/device-boss.png'),sharp(data,{raw:{width,height,channels:4}}));
}

// Regenerate the render silhouettes, contact geometry and UI art from the same bitmaps.
export async function updateDeskDeviceArt(root) {
  const manifest = path.join(root,'../resources/public/config/desk2d-devices.json');
  const original = await fs.readFile(manifest,'utf8');
  const devices = JSON.parse(original);
  async function strips(file,resolution=128,threshold=8,rows=resolution) {
    const alpha = await sharp(Buffer.isBuffer(file)?file:path.join(root,'../resources/public/assets/env/desk2d',file))
      .resize(resolution,rows,{fit:'fill'}).ensureAlpha().extractChannel('alpha').raw().toBuffer();
    const runs = [];
    for (let y=0; y<rows; y++) {
      let start=-1;
      for (let x=0; x<=resolution; x++) {
        const visible=x<resolution && alpha[y*resolution+x]>threshold;
        if (visible && start<0) start=x;
        if (!visible && start>=0) { runs.push([start,y,x]); start=-1; }
      }
    }
    return runs;
  }
  // One source pixel in these originals equals one pixel in the desk master.
  // The size reference shows the desk master at 50%.
  await prepareClock(root);
  devices.boss??={footprintRadius:6.5,height:5};
  for (const [kind,stem] of Object.entries(illustratedFacilityFiles)) {
    const file='device-'+stem+'.png';
    const {width,height}=await sharp(path.join(root,'../resources/public/assets/env/desk2d',file)).metadata();
    Object.assign(devices[kind],{frame:{width,height},size:height/deskPixelsPerUnit,strips:await strips(file)});
    if(kind==='magnet')devices[kind].shadowStrips=await strips('device-magnet-shadow.png');
    if(isContactFacility(kind))
      devices[kind].pickup={resolution:width,height,strips:await strips(file,width,203,height)};
    await writePng(path.join(root,'../resources/public/assets/ui/devices',stem+'.png'),sharp(path.join(root,'../resources/public/assets/env/desk2d',file))
      .trim({background:'#0000'}).resize(128,128,{fit:'contain',background:'#0000'}));
  }
  const {width,height}=await sharp(path.join(root,'../resources/public/assets/env/desk2d',berryLayers.base)).metadata();
  if(width!==height)throw Error('QQ糖图层需要使用相同的正方形画布');
  devices.berry.size=2*height/deskPixelsPerUnit; // The shared pickup renderer applies a 0.5 scale.
  devices.berry.strips=await strips(berryLayers.base);
  // The wrapper is opaque. The painted drop shadow peaks at alpha 171.
  const opaque=await strips(berryLayers.base,width,203);
  const left=Math.min(...opaque.map(row=>row[0])),right=Math.max(...opaque.map(row=>row[2]));
  devices.berry.pickupCenter=[(left+right)/(2*width),(opaque[0][1]+opaque.at(-1)[1]+1)/(2*height)];
  const bill=await prepareBill(root);
  const art=file=>path.join(root,'../resources/public/assets/env/desk2d',file);
  await writeDeviceIcon(root,'berry',art(berryLayers.base),[{input:art(berryLayers.spiral)}]);
  await writeDeviceIcon(root,'altar',art(altarLayers.base),[
    {input:art(altarLayers.idle)}, {input:art(altarLayers.tint)},
  ]);
  devices.bill.size=bill.frame.height*.375/deskPixelsPerUnit;
  devices.altar.size=269/deskPixelsPerUnit;
  for(const device of Object.values(devices))delete device.fx;
  devices.bill.frame=bill.frame;
  devices.bill.strips=await strips(bill.silhouette);
  delete devices.altar.strips;
  devices.altar.layers = {};
  for (const [name,file] of Object.entries(altarLayers)) devices.altar.layers[name]=await strips(file);
  const updated = JSON.stringify(devices);
  if (updated!==original) await fs.writeFile(manifest,updated);
}
