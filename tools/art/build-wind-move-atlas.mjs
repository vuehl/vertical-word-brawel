import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {unmixWindInk, writeWindAtlas} from './wind-art-clarity.mjs';

const source = new URL('../../resources/art/wind-supplement/空气斩.gif', import.meta.url);
const output = new URL('../../resources/public/assets/vfx/', import.meta.url);
const file = fileURLToPath(source);
const {width, pageHeight, delay} = await sharp(file, {animated:true}).metadata();
const tile = 256, columns = 6, layers = [];
const read = page => sharp(file, {page}).removeAlpha().raw().toBuffer();
const before = await read(5), after = await read(37);
const frames = await Promise.all(Array.from({length:27}, (_, i) => read(i+6)));

// Screen-space registration points along the outbound and returning paths.
// Rotate each pose to face up. The game rotates it back using live velocity.
const centres = [
  [191,498],[200,478],[207,455],[214,432],[220,410],[226,390],[231,369],
  [239,349],[247,330],[253,312],[259,292],[264,276],[270,270],
  [282,255],[279,261],[278,273],[277,287],[275,302],[271,320],[267,340],
  [263,361],[254,385],[246,411],[239,437],[227,460],[221,481],[214,502],
];
function sourcePixel(index, sx, sy) {
  if(sx<0 || sx>=width || sy<0 || sy>=pageHeight)return;
  const k=(sy*width+sx)*3, frame=frames[index], bg=index<6?before:after;
  const base=bg.subarray(k,k+3), rgb=frame.subarray(k,k+3);
  // Rectify the paper matte only where it is visible in both exposures.
  // The HUD, prop edges, glyphs and the contact burst need a clean donor.
  if(sx<132 && sy>340 && sy<453 || sx>157 && sx<225 && sy>483 ||
    sx>216 && sx<294 && sy>308 && sy<358 || sy<258 && (sx<204 || sx>330) ||
    base[0]<145 || base[0]>202 || base[0]-base[1]<8 || base[0]-base[1]>36 ||
    base[1]-base[2]<14 || base[1]-base[2]>40 || rgb[0]<base[0]-5 ||
    (index===6 || index===7) && Math.hypot(sx-251,sy-361)<46)return;
  const blue=rgb[2]-base[2], green=rgb[1]-base[1];
  if(blue<3 || green<1 || rgb[0]+3<base[0])return [0,0,0,0];
  return unmixWindInk([...rgb],base,255*blue/(255-base[2]));
}

function layer(render){
  const pixels=Buffer.alloc(tile*tile*4);
  for(let y=0;y<tile;y++)for(let x=0;x<tile;x++){
    const ink=render(x-tile/2,y-tile/2);
    if(ink)pixels.set(ink,(y*tile+x)*4);
  }
  const index=layers.length;
  layers.push({input:pixels,raw:{width:tile,height:tile,channels:4},
    left:index%columns*tile,top:Math.floor(index/columns)*tile});
}
// Fill the portions hidden behind the glyph, books or HUD from the same
// exposure. Neighbouring samples follow the curvature of the leading edge,
// keeping the three strokes aligned across the occluder.
for(let i=0;i<centres.length;i++){
  const [cx,cy]=centres[i], angle=.235+(i>=13?Math.PI:0);
  const cos=Math.cos(angle),sin=Math.sin(angle);
  const axis=i<13?10:i<17?-10:4;
  const bend=x=>.0037*(x-axis)**2;
  function sample(x,y){
    const sx=cx+x*cos-y*sin, sy=cy+x*sin+y*cos;
    const left=Math.floor(sx), top=Math.floor(sy);
    let alpha=0, rgb=[0,0,0];
    for(let dy=0;dy<=1;dy++)for(let dx=0;dx<=1;dx++){
      const ink=sourcePixel(i,left+dx,top+dy);
      if(!ink)return;
      const weight=(1-Math.abs(sx-left-dx))*(1-Math.abs(sy-top-dy))*ink[3];
      alpha+=weight;
      for(let c=0;c<3;c++)rgb[c]+=ink[c]*weight;
    }
    return alpha>0?[...rgb.map(v=>Math.round(v/alpha)),Math.round(alpha)]:[0,0,0,0];
  }
  layer((x,y)=>{
    const depth=y-bend(x);
    if(Math.abs(x)>106 || depth < -36 || depth>48 || y>73)return;
    const ink=sample(x,y);
    if(ink)return ink;
    const sides=[];
    for(const dir of [-1,1]){
      for(let d=1;d<82;d++){
        const xx=x+dir*d;
        if(Math.abs(xx)>106){sides.push([d,[0,0,0,0]]);break;}
        const value=sample(xx,depth+bend(xx));
        if(value){sides.push([d,value]);break;}
      }
    }
    if(sides.length<2)return sides[0]?.[1];
    const [[dl,l],[dr,r]]=sides;
    const a=l[3]*dr+r[3]*dl;
    if(!a)return;
    return [0,1,2].map(c=>(l[c]*l[3]*dr+r[c]*r[3]*dl)/a).concat(a/(dl+dr));
  });
}
const hitPages=[12,13];
for(const page of hitPages){
  const frame=frames[page-6];
  layer((x,y)=>{
    const sx=250+x,sy=356+y;
    if(Math.abs(x)>45 || Math.abs(y)>49)return;
    const k=(sy*width+sx)*3, rgb=frame.subarray(k,k+3), bg=after.subarray(k,k+3);
    // The hit has cyan flecks with more blue than the silvery blade or desk.
    const excess=rgb[2]-rgb[0];
    if(excess<22 || rgb[2]<155 || rgb[1]<bg[1]+4)return;
    return unmixWindInk([...rgb],bg,255*Math.max(0,rgb[2]-bg[2])/(255-bg[2]||1));
  });
}
const sha256=createHash('sha256').update(fs.readFileSync(source)).digest('hex');
function clip(first,pages){
  const times=[0];
  for(const page of pages)times.push(times.at(-1)+delay[page]);
  return {first,count:pages.length,pages,times,source:'空气斩.gif',sha256};
}
const rows=Math.ceil(layers.length/columns);
const atlas={tile,columns,rows,airSlash:clip(0,centres.map((_,i)=>i+6)),hit:clip(centres.length,hitPages)};
fs.writeFileSync(new URL('wind-moves.json',output),JSON.stringify(atlas)+'\n');
await writeWindAtlas(layers,tile,columns,rows,fileURLToPath(new URL('wind-moves.png',output)));
