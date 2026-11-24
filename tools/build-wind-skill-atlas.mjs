import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {sampleWindInk,unmixWindInk,clarifyWindFrame,windClarity,writeWindAtlas} from './wind-art-clarity.mjs';

const directory=process.argv[2];
if(!directory)throw Error('Pass the directory containing the eleven wind GIFs');
const output=path.resolve(import.meta.dirname,'../source/public/assets/vfx');
const tile=192,columns=8,frames=[],clips={};
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
async function clip(key,file,pages,fps,pivot,crop,matte){
  const input=path.join(directory,file+'.gif');
  const {delay}=await sharp(input,{animated:true}).metadata();
  const times=[0];for(const p of pages)times.push(times.at(-1)+delay[p]);
  const read=page=>sharp(input,{page}).removeAlpha().raw().toBuffer();
  const background=await read(2);
  clips[key]={first:frames.length,count:pages.length,fps,pivot,source:file+'.gif',pages,times,
    sha256:createHash('sha256').update(fs.readFileSync(input)).digest('hex')};
  for(const [index,page] of pages.entries()){
    const rgb=await read(page),{cx,cy,size,angle=0}=crop(page,index);
    if(key==='gust'&&page===5){
      // The camera moves 120 px between exposures. Retain the visible half
      // of the second pose and fill the part outside the recording with pose 1.
      const first=await read(4),edge=120;
      for(let y=310;y<441;y++){
        const moving=Buffer.from(rgb.subarray(y*390*3,(y*390+72)*3));
        first.copy(rgb,(y*390+38)*3,(y*390+38)*3,(y*390+192)*3);
        moving.copy(rgb,(y*390+edge)*3);
      }
    }
    // Remove the thin red targeting reticle where it crosses the green ink.
    if(key==='gust'||key==='attackLoops'){
      const source=Buffer.from(rgb);
      for(let y=318;y<446;y++)for(let x=1;x<225;x++){
        const j=(y*390+x)*3;
        if(source[j]<170||source[j]-source[j+1]<94)continue;
        for(const delta of [3,-3,390*3,-390*3,5,-5,390*5,-390*5]){
          const k=j+delta*3;
          if(source[k+1]-source[k]>28 && source[k+2]-source[k]>4 && source[k+1]>100){
            source.copy(rgb,j,k,k+3);break;
          }
        }
      }
    }
    const pixels=Buffer.alloc(tile*tile*4),native=new Map();
    const readInk=(sx,sy)=>{
      if(sx<0||sx>=390||sy<0||sy>=892)return;
      const pixel=sy*390+sx;
      if(native.has(pixel))return native.get(pixel);
      const j=(sy*390+sx)*3,r=rgb[j],g=rgb[j+1],b=rgb[j+2],br=background[j],bg=background[j+1],bb=background[j+2];
      const diff=Math.abs(r-br)+Math.abs(g-bg)+Math.abs(b-bb);
      const alpha=matte({r,g,b,br,bg,bb,diff,sx,sy,cx,cy,page,index});
      const ink=alpha>0?unmixWindInk([r,g,b],[br,bg,bb],Math.min(255,alpha)):undefined;
      native.set(pixel,ink);return ink;
    };
    for(let y=1;y<tile-1;y++)for(let x=1;x<tile-1;x++){
      const px=(x+.5-tile/2)*size/tile,py=(y+.5-tile/2)*size/tile;
      const sx=cx+px*Math.cos(angle)-py*Math.sin(angle),sy=cy+px*Math.sin(angle)+py*Math.cos(angle);
      const ink=sampleWindInk(sx,sy,readInk);
      if(ink)pixels.set(ink,(y*tile+x)*4);
    }
    const profile=/Halo|Launch/.test(key)?{detail:.3,edge:.05}:
      /wingHit|tackleRush/.test(key)?{detail:.5,edge:.12}:{detail:.65,edge:.22};
    const pose=sharp(clarifyWindFrame(pixels,tile,tile,{...profile,radius:Math.max(1,Math.round(tile/size))}),{raw:{width:tile,height:tile,channels:4}});
    if(key==='gust'&&index>=2)pose.flop();
    frames.push(await pose.png().toBuffer());
  }
}

// The green funnel is fully visible for one exposure; the camera tracks the
// runner in the next exposure and cuts through the left side of the funnel.
await clip('gust','大招/跑得没影',[4,5,4,5],15,.08,()=>({cx:110,cy:371,size:150}),o=>{
  const h=434-o.sy;
  if(h<0||h>116||Math.abs(o.sx-110)>Math.min(70,6+h*.75))return 0;
  return o.b>62&&o.g>90?Math.max(0,Math.min(o.g-o.r-8,o.b-o.r-2))*13:0;
});
await clip('attackLoops','大招/刮倒一片',range(4,14),15,.10,()=>({cx:166,cy:381,size:166}),o=>{
  if(o.sy<320||o.sy>447||Math.abs(o.sx-166)>57)return 0;
  return Math.max(0,Math.min(o.g-o.r-12,o.g-o.b-2))*12;
});
// The reference films obscure the upper part of the moving double funnel with
// the HUD. Use its existing complete isolated spin cycle for both fusions.
const typhoon=path.resolve(import.meta.dirname,'../source/art/wind-vfx/typhoon.png');
clips.typhoon={first:frames.length,count:8,fps:20,pivot:.08,source:'typhoon.png'};
for(let i=0;i<8;i++){
  const pixels=await sharp(typhoon).extract({left:i*256,top:0,width:256,height:256}).resize(tile,tile).ensureAlpha().raw().toBuffer();
  frames.push(await sharp(clarifyWindFrame(pixels,tile,tile),{raw:{width:tile,height:tile,channels:4}}).png().toBuffer());
}

const blue=o=>(o.b-o.r>16&&o.b-o.g>2)||Math.min(o.r,o.g,o.b)>226;
// The wing spell's halo belongs to this 20 fps recording, not to the
// differently timed Aerial Ace recording. Keep every exposure and its opacity.
await clip('wingLaunch','翅膀攻击',range(5,13),20,.5,()=>({cx:194,cy:522,size:128}),o=>{
  const r=Math.hypot(o.sx-194,(o.sy-522)*1.12);
  const strength=(o.b-o.r)-(o.bb-o.br);
  return r>32&&r<53&&o.sy<554&&strength>6&&o.diff>10?strength*4:0;
});
await clip('wing','翅膀攻击',range(8,11),20,.5,p=>({cx:220+(p-8)*8,cy:453-(p-8)*22,size:86,angle:.32}),
  o=>blue(o)&&o.diff>15?o.diff*5:0);
await clip('wingHit','翅膀攻击',range(12,32),20,.5,()=>({cx:249,cy:385,size:128}),o=>{
  // Exclude the feather crossing the wash on its way back. The surrounding
  // splash stays until its original fade ends at 1.65 seconds.
  if(o.page>=24&&o.page<=29&&Math.abs(o.sx-(249-(o.page-25)*7))<13&&Math.abs(o.sy-(385+(o.page-25)*22))<24)return 0;
  const strength=(o.b-o.r)-(o.bb-o.br);
  return o.sy>355&&Math.hypot(o.sx-249,o.sy-385)<56&&Math.min(o.r,o.g,o.b)>130&&strength>8&&o.diff>12?strength*4:0;
});
await clip('fusionFeather','融合/残气乱刮',[7],15,.5,()=>({cx:242,cy:348,size:51,angle:.80}),
  o=>Math.hypot(o.sx-242,o.sy-348)<23&&blue(o)?Math.min(255,o.diff*4):0);
await clip('turningFeather','融合/卷着打转',[6],15,.5,()=>({cx:113,cy:503,size:28,angle:.95}),o=>{
  if(Math.hypot((o.sx-113)/1.3,o.sy-503)>9||o.sy>512)return 0;
  // This isolated feather retains its complete pale outline. The old crop
  // contained only a handful of blue pixels from a later, faded exposure.
  return o.b-o.r>0&&o.b-o.g>-3?Math.min(240,(o.b-o.r+4)*9):0;
});
// Register the entire ivory dust/afterimage sequence along its direction of
// travel. The character and enemy remain rendered and animated by the game.
const heading=.29,span=295,pivot=.10;
await clip('tackleRush','撞击',range(5,20),20,pivot,
  ()=>({cx:195+Math.sin(heading)*span*(.5-pivot),cy:520-Math.cos(heading)*span*(.5-pivot),size:span,angle:heading}),
  o=>{
    const across=(o.sx-195)*Math.cos(heading)+(o.sy-520)*Math.sin(heading);
    if(Math.abs(across)>36||o.sy<256||o.sy>549||o.diff<13)return 0;
    if(o.r>199&&o.g>182&&o.b>145&&o.r-o.b<88&&o.g-o.r<15)return o.diff*3;
    if(o.sy<485&&o.b>148&&Math.min(o.g,o.b)-o.r>0&&o.br-o.bb>25)return o.diff*2;
    return 0;
  });
await clip('quickSpark','电光一闪',range(5,28),20,.5,
  ()=>({cx:201,cy:510,size:72}),o=>{
    if(Math.hypot(o.sx-201,o.sy-510)>31||o.r<140||o.r-o.b<26||o.r-o.g<7||o.diff<10)return 0;
    return Math.min(230,o.diff*2.6);
  });
await clip('quickHalo','电光一闪',range(5,12),20,.5,()=>({cx:204,cy:511,size:144}),o=>{
  const radius=Math.hypot(o.sx-204,(o.sy-511)*1.1);
  return radius>55&&radius<69&&o.sy<533&&o.r-o.g>9&&o.g-o.b>8?Math.min(230,o.diff*2):0;
});
const rows=Math.ceil(frames.length/columns);
await writeWindAtlas(frames.map((input,i)=>({input,left:i%columns*tile,top:Math.floor(i/columns)*tile})),tile,columns,rows,path.join(output,'wind-skills.png'));
fs.writeFileSync(path.join(output,'wind-skills.json'),JSON.stringify({tile,columns,rows,clips,clarity:windClarity},null,2)+'\n');
