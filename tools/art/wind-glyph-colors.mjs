import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {glyphCatalog} from '../../source/src/actors/glyph-catalog.js';
import {windGlyphFill} from '../../source/src/data/starter-characters.js';

// Use 风's #87bbff fill for both evolution routes. Keep alpha and dark ink.
export function blueWindPixels(pixels,width,regions){
  let changed=false;
  for(const {left,top,width:w,height:h} of regions){
    for(let y=top;y<top+h;y++)for(let x=left;x<left+w;x++){
      const i=(y*width+x)*4;
      if(!pixels[i+3]||pixels[i]<=pixels[i+2])continue;
      const fill=(pixels[i]-pixels[i+2])/(255-51);
      pixels[i]=Math.round(pixels[i]+(windGlyphFill[0]-255)*fill);
      pixels[i+1]=Math.round(pixels[i+1]+(windGlyphFill[1]-89)*fill);
      pixels[i+2]=Math.round(pixels[i+2]+(windGlyphFill[2]-51)*fill);
      changed=true;
    }
  }
  return changed;
}

// Normalize the shared portraits and pose strokes before either web or phone
// loads them. Repeated builds leave already-blue pixels untouched.
export async function writeWindGlyphColors(source){
  const {size,columns,heroes}=glyphCatalog;
  const regions=[16,17,18,58,59].map(id=>({
    left:heroes[id].index%columns*size,top:Math.floor(heroes[id].index/columns)*size,
    width:size,height:size,
  }));
  for(const [name,tiles] of [['atlas.png',regions],['wind-strokes.png',null]]){
    const file=path.join(source,'../resources/public/assets/glyphs',name);
    const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    if(!blueWindPixels(data,info.width,tiles??[{left:0,top:0,width:info.width,height:info.height}]))continue;
    const png=await sharp(data,{raw:info}).png().toBuffer();
    fs.writeFileSync(file,png);
  }
}
