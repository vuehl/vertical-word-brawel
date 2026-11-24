import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {sampleWindInk,clarifyWindFrame,windClarity,writeWindAtlas} from './wind-art-clarity.mjs';

// Registered luminous tips in 燕返.gif, in source pixels. Left/right identify
// the launch side; the blades cross and return on the opposite sides.
const tips=[
  [194,522,194,522],[173,501,211,522],[162,488,224,521],[156,474,237,517],
  [151,459,250,509],[149,445,261,500],[149,430,272,490],[151,415,281,480],
  [156,401,290,469],[164,388,298,457],[174,377,304,445],[186,367,310,432],
  [199,360,313,419],[212,353,313,405],[225,348,310,391],[239,352,305,378],
  [247,358,297,367],[256,362,286,360],[265,367,274,359],[272,374,263,359],
  [279,380,253,359],[285,388,242,360],[290,397,231,362],[294,406,220,365],
  [297,416,210,369],[299,425,201,376],[300,436,192,382],[298,446,183,390],
  [294,455,175,398],[290,464,169,407],[284,472,164,417],[278,480,160,427],
  [272,488,157,438],[266,496,154,448],[259,503,151,459],[252,511,149,470],
  [247,517,149,481],[239,525,149,492],[232,531,149,503],[228,534,150,512]
];
const file=process.argv[2];
if(!file)throw Error('Pass the path to 燕返.gif');
const {data,info}=await sharp(file,{animated:true}).removeAlpha().raw().toBuffer({resolveWithObject:true});
const {delay}=await sharp(file,{animated:true}).metadata(),time=[0];
for(const dt of delay)time.push(time.at(-1)+dt);
const output=path.resolve(import.meta.dirname,'../../resources/public/assets/vfx'),tile=128,columns=8,layers=[];
const index=(x,y,page)=>((page*info.pageHeight+y)*info.width+x)*3;
function rgba(x,y,page,bg=4){
  if(x<0||y<0||x>=info.width||y>=info.pageHeight)return;
  const j=index(x,y,page),k=index(x,y,bg),r=data[j],g=data[j+1],b=data[j+2];
  if(Math.abs(r-data[k])+Math.abs(g-data[k+1])+Math.abs(b-data[k+2])<10)return;
  // Unmix the paper colour from the translucent blue trail and wash.
  const alpha=Math.min(1,Math.max((b-data[k+2])/Math.max(8,250-data[k+2]),(data[k]-r)/Math.max(12,data[k]-57)));
  if(alpha<.035 || b<g-3 || b<r+1 && Math.min(r,g,b)<223)return;
  return [r,g,b].map((v,c)=>Math.min(255,Math.max(0,Math.round(data[k+c]+(v-data[k+c])/alpha)))).concat(Math.round(alpha*255));
}
function frame(paint,onlyBlade=false){
  const pixels=Buffer.alloc(tile*tile*4);
  for(let y=1;y<tile-1;y++)for(let x=1;x<tile-1;x++){
    const ink=paint(x,y);
    if(ink)pixels.set(ink,(y*tile+x)*4);
  }
  if(onlyBlade){
    // Only keep the continuous stroke connected to the tip. A pale edge of
    // the book occasionally enters the bounding box of the left blade.
    const keep=new Uint8Array(tile*tile),open=[];
    for(let y=17;y<=31;y++)for(let x=60;x<=68;x++){
      const k=y*tile+x;
      if(pixels[k*4+3]){keep[k]=1;open.push(k);}
    }
    for(let i=0;i<open.length;i++)for(const offset of [-tile-1,-tile,-tile+1,-1,1,tile-1,tile,tile+1]){
      const k=open[i]+offset;
      if(k>=0&&k<keep.length&&!keep[k]&&pixels[k*4+3]){keep[k]=1;open.push(k);}
    }
    for(let k=0;k<keep.length;k++)if(!keep[k])pixels[k*4+3]=0;
  }
  const slot=layers.length;
  layers.push({input:clarifyWindFrame(pixels,tile,tile,{detail:.6,edge:onlyBlade?.22:.08}),raw:{width:tile,height:tile,channels:4},left:slot%columns*tile,top:Math.floor(slot/columns)*tile});
}
function tip(page,side){return tips[page-5].slice(side*2,side*2+2);}
const origin=[194,522],contact=[249,359],groundRatio=.81;
const dx=contact[0]-origin[0],dz=(origin[1]-contact[1])/groundRatio,length2=dx*dx+dz*dz;
function coordinates(x,y){
  const across=x-origin[0],forward=(origin[1]-y)/groundRatio;
  return [(across*dx+forward*dz)/length2,(across*dz-forward*dx)/length2].map(v=>+v.toFixed(5));
}
const pathFrames=tips.map(([lx,ly,rx,ry],i)=>[time[5+i]-time[5],...coordinates(lx,ly),...coordinates(rx,ry)]);
const flightShots=[6,7,8,9,10,11,12,13,14,15,16,17,18,36,37,38,39,40,41];
for(let side=0;side<2;side++)for(const pose of flightShots){
  const page=Math.max(13,pose);
  const [x0,y0]=tip(page,side),[x1,y1]=tip(page-1,side),[x2,y2]=tip(page+1,side);
  const angle=Math.atan2(x2-x1,y1-y2),cos=Math.cos(angle),sin=Math.sin(angle);
  frame((x,y)=>{
    const u=x-64,v=y-24;
    if(v < -12 || v>Math.min(87,(pose-5)*12) || Math.abs(u)>8+Math.max(0,v)*.67)return;
    const sx=x0+u*cos-v*sin,sy=y0+u*sin+v*cos;
    if(Math.hypot(sx-194,(sy-524)*1.12)<51 || sy<343&&sx>228)return;
    if(page>=36 && sy<404 && sx>194 && sx<291)return;
    return sampleWindInk(sx,sy,(x,y)=>rgba(x,y,page));
  },true);
}
const haloFirst=layers.length;
for(let page=6;page<=13;page++)frame((x,y)=>{
  const sx=x+130,sy=y+460,radius=Math.hypot(sx-194,(sy-524)*1.15);
  if(radius<32||radius>56)return;
  const sideAngle=Math.PI*.16;
  const samples=[[sx,sy],[388-sx,sy],[sx,1048-sy],[388-sx,1048-sy],
    [Math.round(194+radius*Math.cos(sideAngle)),Math.round(524+radius*Math.sin(sideAngle)/1.15)]];
  for(const [px,py] of samples){
    const k=index(px,py,4),j=index(px,py,page);
    if(py>=554 || data[k]-data[k+2]<28 || (px>168&&px<220&&py>489&&py<535))continue;
    if(px<183&&py<512 || px>219&&py>503&&py<528)continue;
    const a=Math.min(1,Math.max(0,(data[j+2]-data[k+2])/Math.max(8,243-data[k+2])));
    if(a<.025)return;
    return [0,1,2].map(c=>Math.max(0,Math.min(255,data[k+c]+(data[j+c]-data[k+c])/a))).concat(Math.round(a*255));
  }
});
const hitFirst=layers.length;
for(let page=20;page<=52;page++)frame((x,y)=>{
  const sx=x+184,sy=y+313,rx=sx-248,ry=sy-377;
  if(sy<344||Math.hypot(rx/1.20,ry)>58)return;
  if(page>=24 && sx>=242 && sy<358){
    if(sx<248)return;
    return rgba(496-sx,sy,page>=30&&page<40?40:page,55);
  }
  if(page<24&&(sx>294||sx<208&&sy<371))return;
  if(page>=30&&page<40)return rgba(sx,sy,40,55);
  const j=index(sx,sy,page);
  // The late clean wash supplies the small areas crossed by the bright tips
  // and their tails, so a returning blade never gets stamped on the ground.
  if(page>=22&&page<=36&&Math.hypot(rx/1.25,ry)>16){
    for(let prev=Math.max(6,page-6);prev<=page;prev++)for(let side=0;side<2;side++){
      const [tx,ty]=tip(prev,side);
      if(Math.hypot(sx-tx,sy-ty)<8 && (data[j+2]-data[j]>49 || data[j]>206&&data[j+2]>235))
        return rgba(sx,sy,40,55);
    }
  }
  return rgba(sx,sy,page,55);
});
const rows=Math.ceil(layers.length/columns);
await writeWindAtlas(layers,tile,columns,rows,path.join(output,'wind-ace.png'));
const json={tile,columns,rows,flightShots,pathFrames,
  launch:{first:haloFirst,times:time.slice(6,15).map(t=>t-time[5])},
  hit:{first:hitFirst,times:time.slice(20,54).map(t=>t-time[20])},clarity:windClarity};
fs.writeFileSync(path.join(output,'wind-ace.json'),JSON.stringify(json)+'\n');
