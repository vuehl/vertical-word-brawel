import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const root=path.resolve(import.meta.dirname,'../..');
const file=path.join(root,'resources/art/fire-breath/reference.gif');
const output=path.join(root,'resources/public/assets/vfx');
const crop={left:80,top:260,width:160,height:160},tile=192,columns=8;
const pages=Array.from({length:23},(_,i)=>i+3),frames=[];
const warm=(r,g,b)=>r>205&&r-b>85&&g-b>42&&g>105;
for(const page of pages){
  const data=await sharp(file,{page}).extract(crop).removeAlpha().raw().toBuffer();
  const rgba=Buffer.alloc(crop.width*crop.height*4);
  for(let i=0;i<data.length/3;i++){
    const [r,g,b]=data.subarray(i*3,i*3+3);
    if(!warm(r,g,b))continue;
    // Separate warm flame pigment from the tan desk and brown characters.
    // Keep yellow highlights; unmatte translucent orange against the desk.
    const alpha=Math.min(1,(r-195)/38,(r-b-75)/55,(g-b-32)/35);
    if(alpha<=0)continue;
    const a=Math.max(.05,alpha);
    rgba.set([Math.min(255,(r-195*(1-a))/a),Math.max(0,Math.min(255,(g-170*(1-a))/a)),
      Math.max(0,Math.min(255,(b-125*(1-a))/a)),Math.round(a*255)],i*4);
  }
  // Repair the 3-pixel pink lock ellipse (centre measured in the GIF).
  // Harmonic interpolation of premultiplied colour avoids spokes or seams.
  const holes=[],pixels=new Float32Array(rgba.length);
  for(let i=0;i<rgba.length;i+=4){const a=rgba[i+3]/255;for(let c=0;c<3;c++)pixels[i+c]=rgba[i+c]*a;pixels[i+3]=rgba[i+3];}
  for(let y=50;y<145;y++)for(let x=15;x<115;x++){
    const r=Math.hypot((x-71)/29,(y-105)/29);
    if(r>.88&&r<1.13)holes.push((y*160+x)*4);
  }
  for(let pass=0;pass<160;pass++)for(const o of holes)for(let c=0;c<4;c++)
    pixels[o+c]=(pixels[o-4+c]+pixels[o+4+c]+pixels[o-640+c]+pixels[o+640+c])*.25;
  for(const o of holes){const a=pixels[o+3]/255;for(let c=0;c<3;c++)rgba[o+c]=a?pixels[o+c]/a:0;rgba[o+3]=pixels[o+3];}
  if(page<5||page>=24)rgba.fill(0);
  frames.push(await sharp(rgba,{raw:{width:160,height:160,channels:4}})
    .extend({left:16,right:16,top:16,bottom:16,background:'#00000000'}).png().toBuffer());
}
const rows=Math.ceil(frames.length/columns);
await sharp({create:{width:columns*tile,height:rows*tile,channels:4,background:'#00000000'}})
  .composite(frames.map((input,i)=>({input,left:i%columns*tile,top:Math.floor(i/columns)*tile})))
  .png().toFile(path.join(output,'fire-breath-reference.png'));
const meta={tile,columns,rows,pages,crop,anchor:[102/192,31/192],fps:15,
  source:'resources/art/fire-breath/reference.gif',sha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  clips:{start:{first:0,count:7},loop:{first:7,count:10},tail:{first:17,count:6}}};
fs.writeFileSync(path.join(output,'fire-breath-reference.json'),JSON.stringify(meta,null,2)+'\n');
console.log('Reference fire breath:',frames.length,'frames');
