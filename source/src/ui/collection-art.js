import {drawMenuGlyph,glyphCanvas} from '../actors/paper-glyph-art.js';
// The same channel permutation is used by the in-game player shader.
// Original (normal) cutouts are untouched, including their ink outline.
export function drawAppearanceGlyph(canvas,word,tone,look,large=false){
  drawMenuGlyph(canvas,word,tone,large);
  return tintGlyph(canvas,look);
}
export function tintGlyph(canvas,look){
  if(!look)return canvas;
  const ctx=canvas.getContext('2d'),image=ctx.getImageData(0,0,canvas.width,canvas.height),d=image.data;
  for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];
    if(look==='shiny'){d[i]=g;d[i+1]=b;d[i+2]=r;}
    else if(look==='classic'){d[i]=b;d[i+1]=r;d[i+2]=g;}
  }
  ctx.putImageData(image,0,0);return canvas;
}

// Cache by source canvas so late atlas loads replace any provisional drawing.
// Only the glyph is recoloured; the HUD frame and experience ring stay unchanged.
const appearanceCache=new WeakMap();
export function appearanceGlyphCanvas(word,tone,look){
 const original=glyphCanvas(word,tone);if(!look)return original;
 let looks=appearanceCache.get(original);if(!looks){looks=new Map();appearanceCache.set(original,looks);}
 if(looks.has(look))return looks.get(look);
 const canvas=document.createElement('canvas');canvas.width=original.width;canvas.height=original.height;
 canvas.getContext('2d').drawImage(original,0,0);tintGlyph(canvas,look);looks.set(look,canvas);return canvas;
}
