import path from 'node:path';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import layout from '../../resources/public/config/desk2d-layout.json' with {type:'json'};
import {deskBattleLayers,deskOverlayLayers} from '../../source/src/world/desk-stage-layout.js';

// Match the linear-light composition of the battle renderer.
const linear=Float32Array.from({length:256},(_,i)=>{
  const v=i/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
});
const srgb=Uint8Array.from({length:65536},(_,i)=>{
  const v=i/65535;return Math.round(255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055));
});
const encode=v=>srgb[Math.round(Math.min(1,Math.max(0,v))*65535)];

function composite(floor,{data,info},left,top){
  for(let y=0;y<info.height;y++){
    let dst=((top+y)*layout.width+left)*3;
    for(let src=y*info.width*4,end=src+info.width*4;src<end;src+=4,dst+=3){
      const opacity=data[src+3]/255;
      if(!opacity)continue;
      for(let c=0;c<3;c++)floor[dst+c]=opacity===1?data[src+c]:
        encode(linear[data[src+c]]*opacity+linear[floor[dst+c]]*(1-opacity));
    }
  }
}

// Both the battle and the map print from this same stack. The perimeter
// tint belongs to the ground, and the narrow rear edge belongs to the shelf.
export function deskPrintLayers(pub,layers,furnished){
  const root=path.join(pub,'assets/env/desk2d');
  const art=path.join(pub,'../art/desk-exterior');
  const stack=layers.map(layer=>{
    const parts=layer.parts.map(([file,left,top])=>({file,input:path.join(root,file),left,top}));
    if(furnished&&layer.name==='desk')parts.push({input:path.join(art,'desk-inset.webp'),left:0,top:0});
    if(furnished&&layer.name==='shelf')parts.push({input:path.join(art,'shelf-back.webp'),left:layout.width-1024,top:0});
    return {layer,parts};
  });
  if(furnished)stack.push({layer:{name:'frame'},parts:[
    {input:path.join(art,'frame-edge.webp'),left:layout.width-12,top:0},
  ]});
  return stack;
}

export async function bakeDeskScenery(pub,emit){
  const overlays=new Set(deskOverlayLayers(layout.layers));
  const {width,height}=layout,info={width,height,channels:3};
  const floor=Buffer.alloc(width*height*3);
  for(const {layer,parts} of deskPrintLayers(pub,layout.layers,true)){
    for(const {file,input,left,top} of parts){
      if(overlays.has(layer)){
        emit('furnished/'+file,await readFile(input));
      }else{
        const tile=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
        composite(floor,tile,left,top);
      }
    }
  }
  for(const [file,left,top,w,h] of deskBattleLayers(1,layout)[0].parts){
    const bytes=await sharp(floor,{raw:info}).extract({left,top,width:w,height:h})
      .webp({quality:97,smartSubsample:true}).toBuffer();
    emit(file,bytes);
  }
}
