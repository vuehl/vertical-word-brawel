import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {deskTilt} from '../../source/src/world/desk-framing.js';
import {deskLayers,deskAtlasFile} from '../../source/src/world/desk-stage-layout.js';
import {deskPrintLayers} from './desk-scenery.mjs';

// Print the north-up plan from the battle layers before shipping it to phones.
export async function writeDeskMapAtlas(pub){
  const {width,height,layers}=JSON.parse(await fs.readFile(path.join(pub,'config/desk2d-layout.json')));
  for(const stage of [1,4]){
    await printDesk(pub,width,height,deskLayers(stage,layers),deskAtlasFile(stage));
  }
}

async function printDesk(pub,width,height,layers,file){
  const furnished=layers.some(layer=>layer.name==='toy0');
  const tiles=deskPrintLayers(pub,layers,furnished).flatMap(({parts})=>
    parts.map(({input,left,top})=>({input,left,top})));
  const {data:scene,info}=await sharp({create:{width,height,channels:4,background:'#e7dfcd'}})
    .composite(tiles).raw().toBuffer({resolveWithObject:true});
  const density=640/Math.max(width,height/deskTilt);
  const w=Math.round(width*density),h=Math.round(height*density/deskTilt);
  const pixels=await sharp(scene,{raw:info}).resize(w,h,{fit:'fill'}).raw().toBuffer();
  function edgeAlpha(distance,band){
    const t=distance/band;
    if(t<.25)return t*.14/.25;
    if(t<.65)return .14+(t-.25)*.58/.40;
    return Math.min(1,.72+(t-.65)*.28/.35);
  }
  const shortSide=Math.min(w,h);
  for(let y=0;y<h;y++){
    const vertical=edgeAlpha(Math.min(y+.5,h-y-.5),shortSide*.15);
    for(let x=0;x<w;x++){
      const i=(y*w+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];
      const light=(.24*r+.59*g+.17*b)/255;
      pixels[i]=Math.round(129+light*106+r*.045);
      pixels[i+1]=Math.round(151+light*82+g*.045);
      pixels[i+2]=Math.round(166+light*62+b*.045);
      pixels[i+3]=Math.round(255*vertical*edgeAlpha(Math.min(x+.5,w-x-.5),shortSide*.075));
    }
  }
  const output=path.join(pub,'assets/ui-paper',file);
  const next=await sharp(pixels,{raw:{width:w,height:h,channels:4}}).webp({quality:95,alphaQuality:100}).toBuffer();
  const previous=await fs.readFile(output).catch(error=>{if(error.code!=='ENOENT')throw error;});
  if(previous?.equals(next))return;
  const temporary=output+'.'+process.pid+'.tmp';
  try{
    await fs.writeFile(temporary,next);
    await fs.rename(temporary,output);
  }finally{
    await fs.rm(temporary,{force:true});
  }
}
