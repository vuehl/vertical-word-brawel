import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root=path.resolve(import.meta.dirname,'../source');
const forms=[
  [4,'炎',['上火','下火']],
  [5,'焱',['上火','左下火','右下火']],
  [6,'燚',['左上火','右上火','左下火','右下火']]
];
const names=['左点','长撇','右点','右捺'];
function bounds(data,width,height,threshold){
  let left=width,top=height,right=-1,bottom=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    if(data[(y*width+x)*4+3]<=threshold)continue;
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  if(right<left)throw Error('Empty fire artwork');
  return {left,top,width:right-left+1,height:bottom-top+1};
}
const images=[],rigs={};
const sheetWidth=1024,padding=2;
let sx=padding,sy=padding,rowHeight=0;
for(const [id,word,groupNames] of forms){
  const file='hero_'+id+'_'+word;
  const whole=await sharp(path.join(root,'art/glyphs',file+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const frame=bounds(whole.data,whole.info.width,whole.info.height,24);
  const rig=rigs[id]={word,frame,groups:[]};
  for(const [g,name] of groupNames.entries()){
    const strokes=[];
    for(let j=0;j<4;j++){
      const number=g*4+j+1;
      const input=sharp(path.join(root,'art/fire-strokes',id+'_'+word,file+'-'+number+'.png'));
      const {data,info}=await input.clone().ensureAlpha().raw().toBuffer({resolveWithObject:true});
      if(info.width!==512||info.height!==512)throw Error('Expected 512px source canvas: '+file);
      const box=bounds(data,512,512,0),{width:w,height:h}=box;
      if(sx+w+padding>sheetWidth){sx=padding;sy+=rowHeight+2*padding;rowHeight=0;}
      images.push({input:await input.extract(box).png().toBuffer(),left:sx,top:sy});
      const x=box.left+(id===4?0:1),y=box.top;
      // The lower-left fire of 焱 has the right dot and sweep in reverse file order.
      const label=id===5&&g===1&&j>=2?names[5-j]:names[j];
      strokes.push({name:label,number,sx,sy,w,h,x,y,px:x+w/2,py:y+h/2});
      sx+=w+2*padding;rowHeight=Math.max(rowHeight,h);
    }
    const left=Math.min(...strokes.map(s=>s.x)),right=Math.max(...strokes.map(s=>s.x+s.w));
    const top=Math.min(...strokes.map(s=>s.y)),bottom=Math.max(...strokes.map(s=>s.y+s.h));
    rig.groups.push({name,px:(left+right)/2,py:(top+bottom)/2,strokes});
  }
}
await sharp({create:{width:sheetWidth,height:sy+rowHeight+padding,channels:4,background:'#00000000'}})
  .composite(images).png().toFile(path.join(root,'public/assets/glyphs/fire-strokes.png'));
await fs.writeFile(path.join(root,'src/fire-rigs.json'),JSON.stringify(rigs,null,2)+'\n');
