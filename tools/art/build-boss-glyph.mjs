import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {artImage} from './art-source.mjs';
import {bossGlyphArt as style} from '../../source/src/actors/boss-glyph-art.js';
import {glyphCatalog} from '../../source/src/actors/glyph-catalog.js';

const root=path.resolve(import.meta.dirname,'../..');
const source=path.join(root,'resources/art/monsters/三阶');
const output=path.join(root,'resources/public/assets/glyphs');
const {word,bakeSize:size}=style;
const record=glyphCatalog.enemies[word];
const {data,info}=await sharp(artImage(path.join(source,word+'.png'))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
let left=info.width,top=info.height,right=0,bottom=0;
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]){
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
}
const crop={left,top,width:right-left+1,height:bottom-top+1};

// Exact squared Euclidean distance to the silhouette. A circular distance
// contour avoids the spikes left by stamping a finite set of offset masks.
function distances(mask){
  const field=new Float64Array(size*size),far=1e12;
  for(let y=0;y<size;y++){
    let nearest=-size*2;
    for(let x=0;x<size;x++){
      if(mask[y*size+x]>=128)nearest=x;
      field[y*size+x]=nearest<0?far:(x-nearest)**2;
    }
    nearest=size*3;
    for(let x=size-1;x>=0;x--){
      if(mask[y*size+x]>=128)nearest=x;
      if(nearest<size)field[y*size+x]=Math.min(field[y*size+x],(x-nearest)**2);
    }
  }
  const v=new Int32Array(size),z=new Float64Array(size+1),f=new Float64Array(size);
  for(let x=0;x<size;x++){
    for(let y=0;y<size;y++)f[y]=field[y*size+x];
    let k=0;v[0]=0;z[0]=-Infinity;z[1]=Infinity;
    for(let q=1;q<size;q++){
      let s;
      do{
        const p=v[k];s=((f[q]+q*q)-(f[p]+p*p))/(2*(q-p));
        if(s>z[k])break;
        k--;
      }while(k>=0);
      k++;v[k]=q;z[k]=s;z[k+1]=Infinity;
    }
    k=0;
    for(let q=0;q<size;q++){
      while(z[k+1]<q)k++;
      field[q*size+x]=(q-v[k])**2+f[v[k]];
    }
  }
  return field;
}
const clamp=x=>Math.max(0,Math.min(1,x));
async function paint(alpha){
  // Smooth subpixel noise in the original cutout before outlining it. Keep
  // a narrow coverage ramp so small holes and individual strokes stay crisp.
  const resized=await sharp(alpha,{raw:{width:info.width,height:info.height,channels:1}})
    .extract(crop).resize(480,480,{fit:'contain',background:'black'})
    .extend({left:48,right:48,top:48,bottom:48,background:'black'})
    .greyscale().raw().toBuffer();
  const blurred=await sharp(resized,{raw:{width:size,height:size,channels:1}}).blur(.7).greyscale().raw().toBuffer();
  const mask=Uint8Array.from(blurred,a=>Math.round(clamp((a-96)/64)*255));
  const distance=distances(mask),rgba=Buffer.alloc(size*size*4);
  for(let i=0;i<mask.length;i++){
    const fill=mask[i]/255,coverage=Math.max(fill,clamp(style.outline+.5-Math.sqrt(distance[i])));
    for(let c=0;c<3;c++)rgba[i*4+c]=coverage?Math.round(style.color[c]*fill/coverage):0;
    rgba[i*4+3]=Math.round(coverage*255);
  }
  return sharp(rgba,{raw:{width:size,height:size,channels:4}}).png().toBuffer();
}

const alpha=Buffer.alloc(info.width*info.height),layers=[];
let full;
for(let frame=0;frame<record.strokes;frame++){
  const stroke=record.strokes-frame;
  const pixels=await sharp(artImage(path.join(source,word,word+'-'+stroke+'.png'))).ensureAlpha().raw().toBuffer();
  for(let i=0;i<alpha.length;i++)alpha[i]=Math.round(pixels[i*4+3]+alpha[i]*(1-pixels[i*4+3]/255));
  const frameAlpha=frame===record.strokes-1?Uint8Array.from({length:alpha.length},(_,i)=>data[i*4+3]):alpha;
  full=await paint(frameAlpha);
  layers.push({input:await sharp(full).resize(style.size,style.size).png().toBuffer(),
    left:frame%style.columns*style.size,top:Math.floor(frame/style.columns)*style.size});
}
await sharp({create:{width:style.size*style.columns,height:style.size*style.rows,channels:4,background:'#00000000'}})
  .composite(layers).png().toFile(path.join(output,style.file));

// Keep HUD portraits and the cinematic source consistent with every HP frame.
const portrait=await sharp(full).resize(glyphCatalog.size,glyphCatalog.size).png().toBuffer();
const atlasFile=path.join(output,'atlas.png'),atlas=await sharp(atlasFile).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const tile=await sharp(portrait).raw().toBuffer();
const tileX=record.index%glyphCatalog.columns*glyphCatalog.size,tileY=Math.floor(record.index/glyphCatalog.columns)*glyphCatalog.size;
for(let y=0;y<glyphCatalog.size;y++)tile.copy(atlas.data,((tileY+y)*atlas.info.width+tileX)*4,y*glyphCatalog.size*4,(y+1)*glyphCatalog.size*4);
await sharp(atlas.data,{raw:atlas.info}).png().toFile(atlasFile);
fs.writeFileSync(path.join(root,'resources/public/assets/vfx/dragon-summon-hd/boss-original-hd.png'),full);
console.log('Boss: 48 smooth red/black HP frames, HUD portrait and cinematic source rebuilt.');
