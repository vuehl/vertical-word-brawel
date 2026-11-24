import path from 'node:path';
import sharp from 'sharp';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {clarifyWindFrame,windClarity,writeWindAtlas} from './wind-art-clarity.mjs';

// Input is the artist's full-screen GIF recording of 一阵刮来.
const input = process.argv[2];
if (!input) throw Error('Pass the path to the 一阵刮来 recording');
const read = page => sharp(input, {page}).removeAlpha().raw().toBuffer();
const background = await read(4);
const tile = 224, columns=5, layers = [],pages=[],times=[0];
const {delay}=await sharp(input,{animated:true}).metadata();
const cleanPoses=new Map();
for (let page = 5; page <= 24; page++) {
  pages.push(page);times.push(times.at(-1)+delay[page]);
  const rgb = await read(page);
  const pixels = Buffer.alloc(tile * tile * 4);
  // Track the travelling tip so the game can supply its own world trajectory.
  const left = Math.round(103 + (page - 11) * 3.55);
  const top = Math.round(272 - (page - 11) * 7.6);
  for (let y = 0; y < tile; y++) for (let x = 0; x < tile; x++) {
    const src = ((top + y) * 390 + left + x) * 3;
    const [r, g, b] = rgb.subarray(src, src + 3);
    const difference = Math.abs(r-background[src])+Math.abs(g-background[src+1])+Math.abs(b-background[src+2]);
    const gold = r>198 && g>113 && r-b>55 && g-b>35;
    const chroma = Math.min(g-r, b-r);
    if (difference < 40 || (!gold && chroma < 12 && !(r > 225 && g > 240 && b > 235))) continue;
    // The camera is fixed, but the hero and enemies also animate in the recording.
    if (y > 90 && Math.abs(x - tile / 2) > (tile-y)*.84 || y > 210) continue;
    const bg=background.subarray(src,src+3);
    const alpha=gold?1:Math.max(.01,Math.min(1,Math.max((b-bg[2])/Math.max(8,255-bg[2]),(bg[0]-r)/Math.max(8,bg[0]))));
    const color=gold?[r,g,b]:[r,g,b].map((v,c)=>Math.max(0,Math.min(255,bg[c]+(v-bg[c])/alpha)));
    pixels.set([...color,Math.round(alpha*255)], (y * tile + x) * 4);
  }
  if(page>=8&&page<=11)cleanPoses.set(page,Buffer.from(pixels));
  if(page===5)pixels.fill(0); // Only the actor moves in the pre-effect exposure.
  if(page>=16){
    const clean=cleanPoses.get(8+(page-8)%4),fade=page<21?1:[.8,.60,.40,.23][page-21];
    // A whole registered rotation pose avoids a rectangular seam where the
    // top goes behind the HUD. Keep the late exposure's measured fade.
    clean.copy(pixels);for(let k=3;k<pixels.length;k+=4)pixels[k]=Math.round(pixels[k]*fade);
  }
  const frame = page - 5;
  layers.push({input:clarifyWindFrame(pixels,tile,tile,{detail:.65,edge:.22}),raw:{width:tile,height:tile,channels:4},left:frame%columns*tile,top:Math.floor(frame/columns)*tile});
}
const rows=Math.ceil(layers.length/columns);
await writeWindAtlas(layers,tile,columns,rows,path.resolve(import.meta.dirname,'../source/public/assets/vfx/wind-vortex.png'));
fs.writeFileSync(path.resolve(import.meta.dirname,'../source/public/assets/vfx/wind-vortex.json'),JSON.stringify({tile,columns,rows,pages,times,count:pages.length,source:'大招/一阵风刮来.gif',reconstructedRegions:'Frames 16–24 are occluded by HUD/damage numbers; replay registered clean rotation poses with the source fade. Not exact recovered pixels.',sha256:createHash('sha256').update(fs.readFileSync(input)).digest('hex'),clarity:windClarity})+'\n');
