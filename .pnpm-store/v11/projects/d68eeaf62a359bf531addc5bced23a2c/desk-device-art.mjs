import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {altarLayers} from '../source/src/desk-altar-art.js';
import {berryLayers} from '../source/src/desk-berry-art.js';
import {billLayers} from '../source/src/bill-layers.js';

async function prepareBill(source){
  const originals=path.join(source,'art/device-bill'),out=path.join(source,'public/assets/env/desk2d');
  const art=name=>path.join(originals,path.basename(billLayers[name]));
  await fs.mkdir(path.join(out,'device-bill'),{recursive:true});
  for(const name of ['base','pupil'])await fs.copyFile(art(name),path.join(out,billLayers[name]));
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
  await sharp(art('base')).trim({background:'#0000'}).resize(128,128,{fit:'contain',background:'#0000'})
    .png().toFile(path.join(source,'public/assets/ui/devices/bill.png'));
  return {frame,silhouette};
}

// The postprocessing masks use actual geometry, so their silhouettes must
// change along with the PNGs. Keep world sizes from the original models.
export async function updateDeskDeviceArt(root) {
  const manifest = path.join(root,'src/desk2d-devices.json');
  const original = await fs.readFile(manifest,'utf8');
  const devices = JSON.parse(original);
  async function strips(file,resolution=128,threshold=8) {
    const alpha = await sharp(Buffer.isBuffer(file)?file:path.join(root,'public/assets/env/desk2d',file))
      .resize(resolution,resolution,{fit:'fill'}).ensureAlpha().extractChannel('alpha').raw().toBuffer();
    const runs = [];
    for (let y=0; y<resolution; y++) {
      let start=-1;
      for (let x=0; x<=resolution; x++) {
        const visible=x<resolution && alpha[y*resolution+x]>threshold;
        if (visible && start<0) start=x;
        if (!visible && start>=0) { runs.push([start,y,x]); start=-1; }
      }
    }
    return runs;
  }
  const {width,height}=await sharp(path.join(root,'public/assets/env/desk2d',berryLayers.base)).metadata();
  if(width!==height)throw Error('QQ糖图层需要使用相同的正方形画布');
  devices.berry.strips=await strips(berryLayers.base);
  // The wrapper is opaque. The painted drop shadow peaks at alpha 171.
  devices.berry.pickup={resolution:width,strips:await strips(berryLayers.base,width,203)};
  const bill=await prepareBill(root);
  devices.bill.frame=bill.frame;
  devices.bill.strips=await strips(bill.silhouette);
  delete devices.altar.strips;
  devices.altar.layers = {};
  for (const [name,file] of Object.entries(altarLayers)) devices.altar.layers[name]=await strips(file);
  const updated = JSON.stringify(devices);
  if (updated!==original) await fs.writeFile(manifest,updated);
}
