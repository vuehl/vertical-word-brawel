import sharp from 'sharp';
import {encodeLosslessAtlas} from './lossless-atlas.mjs';

export const isAtlasIcon = key => /^assets\/(?:items|ui\/(?:devices|icons|types))\/[^/]+\.png$/.test(key);

// Keep each original pixel coordinate. Copy RGBA directly so translucent
// edges never go through a premultiply/unpremultiply round trip at build time.
export async function packIconAtlases(icons, addPage, index) {
  const groups = new Map(), pages = {};
  for (const icon of icons.sort((a,b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0)) {
    const {width,height} = await sharp(icon.input).metadata();
    const cell = 2 ** Math.ceil(Math.log2(Math.max(width,height,icon.pack==='world'?64:32))) + 2;
    const groupKey = [icon.pack,cell].join('/');
    if (!groups.has(groupKey)) groups.set(groupKey,{pack:icon.pack,cell,images:[]});
    groups.get(groupKey).images.push({...icon,width,height});
  }
  for (const {pack,cell,images} of groups.values()) {
    const columns = Math.min(Math.ceil(Math.sqrt(images.length)), Math.max(1,Math.floor((pack==='art'?2048:1024)/cell)));
    const capacity = columns*columns;
    for (let start=0; start<images.length; start+=capacity) {
      const tiles=images.slice(start,start+capacity), pageWidth=Math.min(columns,tiles.length)*cell;
      const pageHeight=Math.ceil(tiles.length/columns)*cell;
      const rgba=Buffer.alloc(pageWidth*pageHeight*4);
      const frames=[];
      for (const [tile,{input,width,height}] of tiles.entries()) {
        // Repeat edge pixels in a one-pixel gutter for scaled canvas draws.
        const pixels=await sharp(input).toColourspace('srgb').ensureAlpha()
          .extend({left:1,right:1,top:1,bottom:1,extendWith:'copy'}).raw().toBuffer();
        // Bound the RGB error of illustrated inventory art at four levels
        // per channel. A lossless encoder then preserves alpha exactly.
        if(pack==='art' && width===256 && height===256){
          for(let i=0;i<pixels.length;i+=4)for(let c=0;c<3;c++){
            pixels[i+c]=Math.min(255,Math.round(pixels[i+c]/8)*8);
          }
        }
        const x=tile%columns*cell, y=Math.floor(tile/columns)*cell, stride=4*(width+2);
        for (let row=0; row<height+2; row++) {
          pixels.copy(rgba,4*((y+row)*pageWidth+x),row*stride,(row+1)*stride);
        }
        frames.push([x+1,y+1,width,height]);
      }
      const raw={width:pageWidth,height:pageHeight,channels:4};
      const bytes=await encodeLosslessAtlas(rgba,raw);
      const ref=addPage(pack,bytes,'.webp');
      pages[ref.split('/')[1]]=frames;
      tiles.forEach(({key},tile)=>{index[key]=ref+'#'+tile;});
    }
  }
  return pages;
}
