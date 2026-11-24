import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import os from 'node:os';

const root=process.argv[2]||process.env.WIND_REFERENCE_DIR||path.join(os.homedir(),'Desktop','fff','fff');
const out=path.resolve('验收/风系逐帧校准/原始检查');
fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync(root,{recursive:true}).filter(f=>f.endsWith('.gif'));
for(const file of files){
  const input=path.join(root,file),meta=await sharp(input,{animated:true}).metadata();
  const starts=[];let total=0;
  meta.delay.forEach(dt=>{starts.push(total);total+=dt;});
  const pages=[4,6,8,11,15,20,27,36,Math.min(meta.pages-1,60)].filter((p,i,a)=>p<meta.pages&&a.indexOf(p)===i);
  const layers=[];const w=390,h=420;
  for(const [i,p] of pages.entries()){
    const top=meta.pageHeight===892?240:180;
    layers.push({input:await sharp(input,{page:p}).extract({left:0,top,width:w,height:h-24}).png().toBuffer(),left:i%3*w,top:Math.floor(i/3)*h+24});
    layers.push({input:Buffer.from(`<svg width="390" height="24"><text x="8" y="18" font-size="16" fill="white">frame ${p} / ${meta.pages} — ${starts[p]}ms</text></svg>`),left:i%3*w,top:Math.floor(i/3)*h});
  }
  await sharp({create:{width:w*3,height:h*Math.ceil(pages.length/3),channels:3,background:'#222'}}).composite(layers).png().toFile(path.join(out,path.basename(file)+'.png'));
  console.log(JSON.stringify({file,width:meta.width,height:meta.pageHeight,frames:meta.pages,total,delays:[...new Set(meta.delay)]}));
}
