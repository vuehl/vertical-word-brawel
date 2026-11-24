import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '../..');
const source = 'resources/art/fire-breath/reference.gif';
const output = path.join(root, 'resources/public/assets/vfx');
const gif = await fs.readFile(path.join(root, source));
const {delay} = await sharp(gif, {animated:true}).metadata();
const tile = 224, columns = 8, inset = 2;
const crop = {left:48, top:252, width:tile-2*inset, height:tile-2*inset};
const anchor = [(159-crop.left+inset)/tile, 1-(399-crop.top+inset)/tile];
// Frame 4 is the ignition lead-in. The fire is gone when frame 24 starts.
const pages = Array.from({length:20}, (_,index) => index+4);
const frameEndMs = [];
for (const page of pages) frameEndMs.push((frameEndMs.at(-1) ?? 0)+delay[page]);

const readFrame = page => sharp(gif, {page}).extract(crop).removeAlpha().raw().toBuffer();
const plates = await Promise.all([4,24].map(readFrame));
const clamp = value => Math.max(0, Math.min(1, value));
const alphaBound = (color, background) => color >= background
  ? (color-background)/Math.max(1,255-background)
  : (background-color)/Math.max(1,background);

function closestBackground(x,y,r,g,b) {
  let best, distance = Infinity;
  // A pixel of tolerance covers the movement of the desk and target outlines.
  for (const plate of plates) {
    for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++) {
      const offset = ((y+dy)*crop.width+x+dx)*3;
      const br=plate[offset], bg=plate[offset+1], bb=plate[offset+2];
      const error = (r-br)**2+(g-bg)**2+(b-bb)**2+8*(dx*dx+dy*dy);
      if (error<distance) {
        distance=error;
        best=[br,bg,bb];
      }
    }
  }
  return best;
}

function extractFlame(rgb, page) {
  const stride = crop.width*4;
  const pixels = new Float32Array(stride*crop.height);
  const ring = [];
  const nozzleBottom = page<19 ? 402 : 395;
  for (let y=1;y<crop.height-1;y++) for (let x=1;x<crop.width-1;x++) {
    const sx=x+crop.left, sy=y+crop.top;
    // Only the nozzle crosses the top of the player glyph.
    if (sy>nozzleBottom || sy>394 && Math.abs(sx-159)>11) continue;
    const i=y*crop.width+x, o=i*4;
    const r=rgb[i*3], g=rgb[i*3+1], b=rgb[i*3+2];
    const radius=Math.hypot(sx-151,sy-365);
    if (Math.abs(radius-28.5)<2.6 && r>220 && r-g>75 && g-b<16) {
      ring.push(o);
      continue;
    }
    if (r<158 || r-g<-6 || g-b<21 || sy>395 && g<115) continue;
    const [br,bg,bb]=closestBackground(x,y,r,g,b);
    const red=r-br, green=g-bg, blue=b-bb;
    const warmth=Math.max(red-blue,green-blue);
    if (warmth<10 || red<4 && green<9) continue;
    // Infer alpha against the recorded background. Work in premultiplied
    // colour so the visible flame RGB recomposites to the source pixels.
    const alpha=clamp(1.16*Math.max(alphaBound(r,br),alphaBound(g,bg),alphaBound(b,bb)));
    // The candy wrapper changes colour under the fire. Include the bright
    // flame crossing its edge and suppress the reflected colour on its face.
    const coverage=sy>333 && sx>202 ? clamp((g-b-27)/28)*clamp((221-sx)/5) : 1;
    pixels[o]=(r-br*(1-alpha))*coverage;
    pixels[o+1]=(g-bg*(1-alpha))*coverage;
    pixels[o+2]=(b-bb*(1-alpha))*coverage;
    pixels[o+3]=alpha*coverage;
  }
  // Fill only pixels occupied by the targeting ring, using the adjacent flame.
  for (let pass=0;pass<60;pass++) for (const o of ring) for (let c=0;c<4;c++) {
    pixels[o+c]=(pixels[o+c-4]+pixels[o+c+4]+pixels[o+c-stride]+pixels[o+c+stride])/4;
  }
  const rgba=Buffer.alloc(pixels.length);
  for (let o=0;o<rgba.length;o+=4) {
    const alpha=pixels[o+3];
    if (alpha<1/255) continue;
    for (let c=0;c<3;c++) rgba[o+c]=Math.round(255*clamp(pixels[o+c]/alpha/255));
    rgba[o+3]=Math.round(alpha*255);
  }
  return rgba;
}

const frames = await Promise.all(pages.map(async (page,index) => {
  const rgba = index===0 ? Buffer.alloc(crop.width*crop.height*4) : extractFlame(await readFrame(page),page);
  const input = await sharp(rgba,{raw:{width:crop.width,height:crop.height,channels:4}}).png().toBuffer();
  return {input,left:index%columns*tile+inset,top:Math.floor(index/columns)*tile+inset};
}));
const rows = Math.ceil(frames.length/columns);
await sharp({create:{width:columns*tile,height:rows*tile,channels:4,background:'#00000000'}})
  .composite(frames).png().toFile(path.join(output,'fire-breath-reference.png'));
const meta = {tile,columns,rows,pages,crop,anchor,frameEndMs,source,
  sha256:createHash('sha256').update(gif).digest('hex')};
await fs.writeFile(path.join(output,'fire-breath-reference.json'),JSON.stringify(meta,null,2)+'\n');
console.log('Reference fire breath:',frames.length,'frames,',frameEndMs.at(-1),'ms');
