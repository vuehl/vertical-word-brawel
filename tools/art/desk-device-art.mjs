import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {altarLayers} from '../../source/src/world/desk-altar-art.js';
import {berryLayers} from '../../source/src/world/desk-berry-art.js';
import {billLayers} from '../../source/src/effects/bill-layers.js';
import {deskPitch} from '../../source/src/world/desk-framing.js';
import {facilityIconFile} from '../../source/src/data/active-content.js';

// Compose at the artist's original coordinates before trimming the transparent
// margins so the map markers remain legible at HUD size.
async function writeDeviceIcon(source,kind,base,layers=[]){
  const composed=layers.length?await sharp(base).composite(layers).png().toBuffer():base;
  await sharp(composed).trim({background:'#0000'}).resize(128,128,{fit:'contain',background:'#0000'})
    .png().toFile(path.join(source,'../resources/public/assets',facilityIconFile(kind)));
}

async function prepareBill(source){
  const originals=path.join(source,'../resources/art/device-bill'),out=path.join(source,'../resources/public/assets/env/desk2d');
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
  const [x,y,w,h]=frame.socket;
  await writeDeviceIcon(source,'bill',art('base'),[
    {input:art('face')},
    {input:art('pupil'),left:Math.round(x+(w-pupil.width)/2),top:Math.round(y+(h-pupil.height)/2)},
    {input:art('highlight')},
  ]);
  return {frame,silhouette};
}

// The postprocessing masks use actual geometry, so their silhouettes must
// change along with the PNGs. Keep world sizes from the original models.
export async function updateDeskDeviceArt(root) {
  const manifest = path.join(root,'../resources/public/config/desk2d-devices.json');
  const original = await fs.readFile(manifest,'utf8');
  const devices = JSON.parse(original);
  async function strips(file,resolution=128,threshold=8) {
    const alpha = await sharp(Buffer.isBuffer(file)?file:path.join(root,'../resources/public/assets/env/desk2d',file))
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
  const {width,height}=await sharp(path.join(root,'../resources/public/assets/env/desk2d',berryLayers.base)).metadata();
  if(width!==height)throw Error('QQ糖图层需要使用相同的正方形画布');
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
  devices.bill.frame=bill.frame;
  devices.bill.strips=await strips(bill.silhouette);
  delete devices.altar.strips;
  devices.altar.layers = {};
  for (const [name,file] of Object.entries(altarLayers)) devices.altar.layers[name]=await strips(file);
  // Project the painted outline for highlights and stars in every camera view.
  for(const [kind,device] of Object.entries(devices)){
    if(!['altar','berry','bill'].includes(kind))await writeDeviceIcon(root,kind,art('device-'+kind+'.png'));
    const outline=device.strips??Object.values(device.layers).flat();
    const aspect=kind==='bill'?device.frame.width/device.frame.height:1;
    const lift = kind === 'bill' ? 0.39 : 0.3;
    const points=outline.flatMap(([l,y,r])=>[[l,y],[r,y],[l,y+1],[r,y+1]]);
    const toModel=([x,y])=>{
      const height=(.5+lift-y/128)*device.size;
      return [(x/128-.5)*device.size*aspect,height*Math.cos(deskPitch),-height*Math.sin(deskPitch)]
        .map(value=>Number(value.toFixed(5)));
    };
    const boundary=new Set();
    for(let i=0;i<32;i++){
      const angle=i*Math.PI/16,dx=aspect*Math.cos(angle),dy=Math.sin(angle);
      const tip=points.reduce((a,b)=>(b[0]-a[0])*dx+(b[1]-a[1])*dy>0?b:a);
      boundary.add(tip);
    }
    device.fx.supportXYZ=Array.from(boundary).flatMap(toModel);
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    device.fx.centerXYZ=toModel([(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2]);
  }
  const updated = JSON.stringify(devices);
  if (updated!==original) await fs.writeFile(manifest,updated);
}
