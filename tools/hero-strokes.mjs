import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root=path.resolve(import.meta.dirname,'../source');
const fire=['左点','长撇','右点','右捺'];
const sweepBeforeDot=['左点','长撇','右捺','右点'];
const windFrame=['撇','横斜钩'],windCenter=['捺','撇'];
const wind=['风',[...windFrame,...windCenter]];
const dog=['横','撇','捺','点'];
const families={
  fire:[
    [4,'炎',[['上火',fire],['下火',fire]]],
    [5,'焱',[['上火',fire],['左下火',sweepBeforeDot],['右下火',sweepBeforeDot]]],
    [6,'燚',[['左上火',fire],['右上火',fire],['左下火',fire],['右下火',fire]]]
  ],
  wind:[
    [16,'风',[['外框',windFrame],['内叉',windCenter]]],
    [17,'讽',[['言字旁',['点','横折提']],wind]],
    [18,'疯',[['病字头',['上点','横','长撇','左点','提']],wind]],
    [58,'飒',[['立',['点','上横','左点','撇','提']],wind]],
    [59,'飙',[['上犬',dog],['左下犬',dog],['右下犬',dog],wind]]
  ],
  copy:[
    [132,'摹',[['草字头',['左竖','横','右竖']],['日',['竖','横折','中横','下横']],
      ['大',['横','撇','捺']],['手',['撇','上横','下横','竖钩']]]]
  ]
};

function bounds(data,width,height,threshold){
  let left=width,top=height,right=-1,bottom=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    if(data[(y*width+x)*4+3]<=threshold)continue;
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  if(right<left)throw Error('Empty stroke artwork');
  return {left,top,width:right-left+1,height:bottom-top+1};
}

// Leave room for ink even when a source stroke touches the edge of its canvas.
const border=14;
async function writePortrait(file,layers){
  const size=512+2*border;
  const blank=()=>sharp({create:{width:size,height:size,channels:4,background:'#00000000'}});
  const fill=await blank().composite(layers).png().toBuffer();
  const alpha=await sharp(fill).extract({left:border,top:border,width:512,height:512})
    .extractChannel('alpha').raw().toBuffer();
  const core=await sharp({create:{width:512,height:512,channels:3,background:'#27232f'}})
    .joinChannel(alpha,{raw:{width:512,height:512,channels:1}}).png().toBuffer();
  const outline=Array.from({length:32},(_,i)=>({
    input:core,left:border+Math.round(border*Math.cos(i*Math.PI/16)),top:border+Math.round(border*Math.sin(i*Math.PI/16))
  }));
  await blank().composite([...outline,{input:fill,left:0,top:0}]).png().toFile(file);
}

const rigs={};
for(const [family,forms] of Object.entries(families)){
  const images=[],sheetWidth=1024,padding=2;
  let sx=padding,sy=padding,rowHeight=0;
  for(const [id,word,groups] of forms){
    const file='hero_'+id+'_'+word;
    const sourceDir=path.join(root,'art/hero-strokes',id+'_'+word);
    const layers=[],rig=rigs[id]={word,sheet:family,groups:[]};
    let number=0;
    for(const [name,strokeNames] of groups){
      const strokes=[];
      for(const strokeName of strokeNames){
        number++;
        const input=sharp(path.join(sourceDir,file+'-'+number+'.png'));
        const {data,info}=await input.clone().ensureAlpha().raw().toBuffer({resolveWithObject:true});
        if(info.width!==512||info.height!==512)throw Error('Expected 512px source canvas: '+file);
        const box=bounds(data,512,512,0),{width:w,height:h}=box;
        if(sx+w+padding>sheetWidth){sx=padding;sy+=rowHeight+2*padding;rowHeight=0;}
        const cropped=await input.extract(box).png().toBuffer();
        images.push({input:cropped,left:sx,top:sy});
        const x=box.left,y=box.top;
        layers.push({input:cropped,left:x+border,top:y+border});
        strokes.push({name:strokeName,number,sx,sy,w,h,x,y,px:x+w/2,py:y+h/2});
        sx+=w+2*padding;rowHeight=Math.max(rowHeight,h);
      }
      const left=Math.min(...strokes.map(s=>s.x)),right=Math.max(...strokes.map(s=>s.x+s.w));
      const top=Math.min(...strokes.map(s=>s.y)),bottom=Math.max(...strokes.map(s=>s.y+s.h));
      rig.groups.push({name,px:(left+right)/2,py:(top+bottom)/2,strokes});
    }
    const portrait=path.join(root,'art/glyphs',file+'.png');
    await writePortrait(portrait,layers);
    const whole=await sharp(portrait).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    rig.frame=bounds(whole.data,whole.info.width,whole.info.height,24);
    rig.frame.left-=border;rig.frame.top-=border;
  }
  await sharp({create:{width:sheetWidth,height:sy+rowHeight+padding,channels:4,background:'#00000000'}})
    .composite(images).png().toFile(path.join(root,'public/assets/glyphs',family+'-strokes.png'));
}
await fs.writeFile(path.join(root,'src/hero-rigs.json'),JSON.stringify(rigs,null,2)+'\n');
await import('./glyph-atlas.mjs');
