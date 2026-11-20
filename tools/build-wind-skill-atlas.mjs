import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Combat recordings contain HUD, moving enemies and paper: only registered,
// colour-isolated effect pixels are exported, never the recording background.
const directory=process.argv[2];
if(!directory)throw Error('Pass the wind GIF directory');
const tile=256,columns=8,frames=[],clips={};
async function clip(key,file,pages,crop,select){
  const input=path.join(directory,file+'.gif');
  const read=page=>sharp(input,{page}).removeAlpha().raw().toBuffer();
  const background=await read(4),first=frames.length;
  for(const page of pages){
    const rgb=await read(page),{cx,cy,size,angle=0}=crop(page),pixels=Buffer.alloc(tile*tile*4);
    for(let y=2;y<tile-2;y++)for(let x=2;x<tile-2;x++){
      const px=(x-128)*size/252,py=(y-128)*size/252;
      const sx=Math.round(cx+px*Math.cos(angle)-py*Math.sin(angle)),sy=Math.round(cy+px*Math.sin(angle)+py*Math.cos(angle));
      if(sx<0||sx>=390||sy<0||sy>=892)continue;
      const j=(sy*390+sx)*3,[r,g,b]=rgb.subarray(j,j+3),diff=Math.abs(r-background[j])+Math.abs(g-background[j+1])+Math.abs(b-background[j+2]);
      if(diff<12)continue;
      const alpha=select({r,g,b,diff,sx,sy,page,cx,cy});
      if(alpha>0)pixels.set([r,g,b,Math.min(255,alpha)],(y*tile+x)*4);
    }
    frames.push(await sharp(pixels,{raw:{width:tile,height:tile,channels:4}}).png().toBuffer());
  }
  clips[key]={first,count:frames.length-first,fps:20,source:file+'.gif',pages};
}
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
const cyan=({r,g,b,diff})=>Math.min(g-r,b-r)>10?Math.min(255,diff*4):0;
for(const [key,file,size,height] of [['gust','起风',204,165],['hurricane','暴风',288,250],['typhoon','台风',288,250]]){
  await clip(key,file,range(8,15),p=>{const foot=505-(p-7)*(key==='typhoon'?3.8:7.6);return {cx:201+(p-7)*(key==='typhoon'?1.7:3.45),cy:foot-height/2,size};},o=>{
    const foot=o.cy+height/2,h=foot-o.sy;
    if(h<5||h>height||Math.abs(o.sx-o.cx)>Math.min(size*.46,12+h*.75))return 0;
    return key==='typhoon'?(o.b-o.r>4&&o.b-o.g>=-4&&o.r>65?o.diff*4:0):(o.g>85&&o.b>65?cyan(o):0);
  });
}
await clip('wing','翅膀攻击',range(8,11),p=>({cx:220+(p-8)*8,cy:453-(p-8)*22,size:86,angle:.32}),o=>o.b-o.r>18&&o.b-o.g>4||Math.min(o.r,o.g,o.b)>225?o.diff*5:0);
await clip('feather','羽毛舞',range(9,12),p=>({cx:218+(p-10)*8,cy:448-(p-10)*21,size:84,angle:.30}),o=>Math.abs(o.sx-o.cx+(o.sy-o.cy)*.30)<9&&o.sy<500?cyan(o):0);
for(const [key,file,start] of [['wingHit','翅膀攻击',12],['featherHit','羽毛舞',14]]){
  await clip(key,file,range(start,start+8),()=>({cx:250,cy:387,size:128}),o=>{
    if(o.sy<350||Math.hypot(o.sx-250,o.sy-387)>61)return 0;
    return key==='wingHit'?(o.b-o.r>15&&o.b-o.g>3?o.diff*4:0):(o.g>85&&o.b>65?cyan(o):0);
  });
}
await clip('tackleHit','撞击',range(6,10),p=>({cx:220+(p-6)*5,cy:452-(p-6)*8,size:96}),o=>o.r>205&&o.g>200&&o.b>155&&o.r-o.b>8?o.diff*4:0);
const rows=Math.ceil(frames.length/columns),output=path.resolve(import.meta.dirname,'../source/public/assets/vfx');
await sharp({create:{width:columns*tile,height:rows*tile,channels:4,background:'#00000000'}}).composite(frames.map((input,i)=>({input,left:i%columns*tile,top:Math.floor(i/columns)*tile}))).png({palette:true,colours:256,dither:0}).toFile(path.join(output,'wind-skills.png'));
fs.writeFileSync(path.join(output,'wind-skills.json'),JSON.stringify({tile,columns,rows,clips},null,2)+'\n');
console.log('Wind effect frames:',frames.length);
