import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const cache=path.resolve(import.meta.dirname,'../../.cache/capture-webp-v1');

// Measure the visible contribution, not invisible RGB under transparent pixels.
// Check each animation frame separately so a small damaged frame cannot hide
// inside the mean of a mostly empty atlas. Never change alpha or dimensions.
export function frameColourError(before,after,width,rects){
  if(before.length!==after.length)throw Error('Capture dimensions changed');
  let maxAlphaError=0,maxCompositeError=0,worstFrameRMSE=0;
  for(const [left,top,w,h] of rects){
    let squared=0,samples=0;
    for(let y=top;y<top+h;y++)for(let x=left;x<left+w;x++){
      const i=(y*width+x)*4,alpha=before[i+3];
      maxAlphaError=Math.max(maxAlphaError,Math.abs(alpha-after[i+3]));
      if(!alpha)continue;
      for(let c=0;c<3;c++){
        const error=Math.abs(before[i+c]-after[i+c])*alpha/255;
        maxCompositeError=Math.max(maxCompositeError,error);squared+=error*error;samples++;
      }
    }
    worstFrameRMSE=Math.max(worstFrameRMSE,Math.sqrt(squared/Math.max(1,samples)));
  }
  return {maxAlphaError,maxCompositeError,worstFrameRMSE};
}
export const acceptableCaptureError=error=>error.maxAlphaError===0&&error.maxCompositeError<=25&&error.worstFrameRMSE<=1.5;

export async function compressCapturePage(original,rects){
  const id=createHash('sha256').update(original).update(JSON.stringify(rects)).digest('hex');
  const file=path.join(cache,id+'.webp'),meta=path.join(cache,id+'.json');
  if(fs.existsSync(file)&&fs.existsSync(meta))return {bytes:fs.readFileSync(file),...JSON.parse(fs.readFileSync(meta))};
  const candidate=await sharp(original).webp({quality:75,alphaQuality:100,smartSubsample:true,effort:6}).toBuffer();
  const [a,b]=await Promise.all([original,candidate].map(bytes=>sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true})));
  if(a.info.width!==b.info.width||a.info.height!==b.info.height)throw Error('Capture atlas size changed');
  const error=frameColourError(a.data,b.data,a.info.width,rects);
  const changed=candidate.length<original.length*.95&&acceptableCaptureError(error);
  const result={bytes:changed?candidate:original,error,changed};
  fs.mkdirSync(cache,{recursive:true});fs.writeFileSync(file,result.bytes);
  fs.writeFileSync(meta,JSON.stringify({error,changed}));
  return result;
}
