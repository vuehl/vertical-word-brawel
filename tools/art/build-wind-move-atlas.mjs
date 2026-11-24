import path from 'node:path';
import sharp from 'sharp';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {clarifyWindFrame,windClarity,writeWindAtlas} from './wind-art-clarity.mjs';

// Only live consumers: dash ghost and the complete twister sequence.
const directory = process.argv[2];
if (!directory) throw Error('Pass the directory containing the three wind move GIFs');
const tile = 192, columns = 8, layers = [];
async function recording(name) {
  const file = path.join(directory, name + '.gif');
  const read = page => sharp(file, {page}).removeAlpha().raw().toBuffer();
  const background = await read(4);
  return async (page, left, top, select, angle=0) => {
    const frame = await read(page);
    const pixels = Buffer.alloc(tile * tile * 4);
    for (let y = 0; y < tile; y++) for (let x = 0; x < tile; x++) {
      const sx = left+96+Math.round((x-96)*Math.cos(angle)-(y-96)*Math.sin(angle));
      const sy = top+96+Math.round((x-96)*Math.sin(angle)+(y-96)*Math.cos(angle));
      if (sx < 0 || sx >= 390 || sy < 0 || sy >= 892) continue;
      const j = (390 * sy + sx) * 3;
      const r = frame[j], g = frame[j+1], b = frame[j+2];
      const diff = Math.abs(r-background[j])+Math.abs(g-background[j+1])+Math.abs(b-background[j+2]);
      if (diff < 9) continue;
      const rgba = select(sx,sy,r,g,b,diff,background.subarray(j,j+3));
      if (rgba) pixels.set(rgba, (y * tile + x) * 4);
    }
    const index = layers.length;
    layers.push({input:pixels, raw:{width:tile,height:tile,channels:4},
      left:index%columns*tile, top:Math.floor(index/columns)*tile});
  };
}
const twister = await recording('龙卷风');
const dash = await recording('电光一闪');
// The third ghost is isolated on bare paper after the speed lines fade.
await dash(10,267-96,306-96,(x,y,r,g,b,diff,bg) => {
  if (x<242 || x>293 || y<281 || y>329) return;
  const a = Math.max(0,(b-bg[2])/(244-bg[2]));
  if (a<.035) return;
  return [Math.max(0,Math.min(255,bg[0]+(r-bg[0])/a)),Math.max(0,Math.min(255,bg[1]+(g-bg[1])/a)),244,Math.min(255,a*1000)];
});
const first=layers.length,pages=Array.from({length:19},(_,i)=>i+5);
for(const page of pages){
  const cx=Math.round(201+(page-7)*3.45),foot=Math.round(505-(page-7)*7.6);
  await twister(page,cx-96,foot-176,(x,y,r,g,b,diff,bg)=>{
    const h=foot-y;
    if(h<0||h>174||(y<260&&x<210)||Math.abs(x-cx)>Math.min(88,32+h*.49))return;
    // Recover transparency by removing the warm paper tint. Early poses are
    // translucent grey, so a simple neutral-colour threshold loses them.
    const tint=bg[0]-bg[2];
    if(tint<24){
      // An enemy or a white book in the background must not cut a glyph-shaped
      // hole out of the opaque grey funnel drawn in front of it.
      const chroma=Math.max(r,g,b)-Math.min(r,g,b);
      return chroma<32&&Math.min(r,g,b)>65?[r,g,b,Math.min(255,diff*6)]:undefined;
    }
    const alpha=Math.max(0,Math.min(1,1-(r-b)/tint));
    if(alpha<.045||Math.min(r,g,b)<65||b-r>24||g-r>16)return;
    return [r,g,b].map((v,c)=>Math.max(0,Math.min(255,bg[c]+(v-bg[c])/alpha))).concat(Math.round(alpha*255));
  });
  const pixels=layers.at(-1).input;
  if(page===5)pixels.fill(0);
  if(page>=18){
    const clean=layers[first+6+(page-18)%4-5].input;
    clean.copy(pixels);
    const fade=page<21?1:[.9,.65,.4][page-21];
    for(let k=3;k<pixels.length;k+=4)pixels[k]=Math.round(pixels[k]*fade);
  }
}
const rows=Math.ceil(layers.length/columns),file=path.join(directory,'龙卷风.gif');
const {delay}=await sharp(file,{animated:true}).metadata(),times=[0];
for(const page of pages)times.push(times.at(-1)+delay[page]);
fs.writeFileSync(path.resolve(import.meta.dirname,'../../resources/public/assets/vfx/wind-moves.json'),JSON.stringify({tile,columns,rows,dashGhost:0,twister:{first,count:pages.length,pages,times,source:'龙卷风.gif',reconstructedRegions:'Frames 18–23 use registered clean poses to replace the HUD and damage-label occlusion.',sha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex')},clarity:windClarity})+'\n');
for(const layer of layers)layer.input=clarifyWindFrame(layer.input,tile,tile,{detail:.65,edge:.22});
await writeWindAtlas(layers,tile,columns,rows,path.resolve(import.meta.dirname,'../../resources/public/assets/vfx/wind-moves.png'));
