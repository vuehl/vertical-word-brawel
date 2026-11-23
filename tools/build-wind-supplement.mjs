import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Update only the supplied clips; retain the other wind recordings' tiles.
const root=path.resolve(import.meta.dirname,'..');
const directory=process.argv[2]||path.join(root,'source/art/wind-supplement');
const output=path.join(root,'source/public/assets/vfx');
const file=path.join(output,'wind-skills.png'),json=path.join(output,'wind-skills.json');
const atlas=JSON.parse(fs.readFileSync(json)),tile=atlas.tile,columns=atlas.columns;
const frames=[];
for(let i=0;i<55;i++)frames.push(await sharp(file).extract({left:i%columns*tile,top:Math.floor(i/columns)*tile,width:tile,height:tile}).png().toBuffer());
async function clip(key,name,pages,crop,select,first=frames.length){
  const input=path.join(directory,name+'.gif');
  for(const [index,page] of pages.entries()){
    const {data,info}=await sharp(input,{page}).removeAlpha().raw().toBuffer({resolveWithObject:true});
    const {cx,cy,size}=crop(page),pixels=Buffer.alloc(tile*tile*4);
    for(let y=2;y<tile-2;y++)for(let x=2;x<tile-2;x++){
      const sx=Math.round(cx+(x-128)*size/252),sy=Math.round(cy+(y-128)*size/252);
      if(sx<0||sx>=info.width||sy<0||sy>=info.height)continue;
      const j=(sy*info.width+sx)*3,r=data[j],g=data[j+1],b=data[j+2];
      const alpha=select({r,g,b,sx,sy,cx,cy});
      if(alpha>0)pixels.set([r,g,b,Math.min(255,alpha)],(y*tile+x)*4);
    }
    frames[first+index]=await sharp(pixels,{raw:{width:tile,height:tile,channels:4}}).png().toBuffer();
  }
  atlas.clips[key]={first,count:pages.length,fps:20,source:'wind-supplement/'+name+'.gif',pages};
}
const cyan=({r,g,b})=>b>110&&g>=b-8&&g-b<65?Math.max(0,Math.min(g-r,b-r)-9)*12:0;
await clip('feather','羽毛舞',[9,10,11,12],p=>({cx:195,cy:465-(p-9)*19,size:84}),o=>Math.abs(o.sx-o.cx)<9?cyan(o):0,28);
await clip('featherHit','羽毛舞',[14,15,16,17,18,19,20,21,22],()=>({cx:184,cy:376,size:128}),o=>o.sy>347&&Math.hypot(o.sx-184,o.sy-376)<61?cyan(o):0,41);
await clip('featherCast','羽毛舞',[6,7,8,9],()=>({cx:195,cy:527,size:128}),o=>{
  const radius=Math.hypot(o.sx-195,(o.sy-527)*1.1);
  return radius>31&&radius<52&&o.sy<554?cyan(o):0;
});
// One clean feather from the expanding ring. Runtime places it in world space
// so the original HUD, hero, health bar and desk never enter the game texture.
await clip('turningFeather','卷着打转',[10],()=>({cx:173,cy:600,size:38}),o=>{
  if(Math.hypot((o.sx-173)/.6,o.sy-600)>16)return 0;
  return o.b-o.r>13&&o.b-o.g>0?Math.min(255,(o.b-o.r-13)*18):0;
});
atlas.rows=Math.ceil(frames.length/columns);
await sharp({create:{width:columns*tile,height:atlas.rows*tile,channels:4,background:'#00000000'}})
  .composite(frames.map((input,i)=>({input,left:i%columns*tile,top:Math.floor(i/columns)*tile})))
  .png({palette:true,colours:256,dither:0}).toFile(file+'.tmp.png');
fs.renameSync(file+'.tmp.png',file);
fs.writeFileSync(json,JSON.stringify(atlas,null,2)+'\n');
console.log('Supplemental wind atlas:',frames.length,'frames');
