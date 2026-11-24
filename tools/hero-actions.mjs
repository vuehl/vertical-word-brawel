import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import rigs from '../source/src/hero-rigs.json' with {type:'json'};
import {isPlayableHeroForm,starterWords} from '../source/src/starter-characters.js';
import {blueWindPixels} from './wind-glyph-colors.mjs';

const size=160, columns=8;
const inkRadius=14/192, margin=inkRadius+.025;
const actions=['idle','walk','faint'];

function pose(frame,sprite){
  const angle=(frame.rotation??0)*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
  const sx=frame.scaleX??1,sy=frame.scaleY??1,x=frame.x,y=frame.y;
  const a=cos*sx,b=sin*sx,c=-sin*sy,d=cos*sy,det=a*d-b*c;
  const corners=[[x,y],[x+a*sprite.w,y+b*sprite.w],[x+c*sprite.h,y+d*sprite.h],
    [x+a*sprite.w+c*sprite.h,y+b*sprite.w+d*sprite.h]];
  const xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]);
  return {sprite,x,y,inverse:[d/det,-b/det,-c/det,a/det],
    left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
}

// Align the first idle pose with the existing standing rig. Share its scale
// and position across clips so a step or fall retains the authored motion.
function layout(rig,frames){
  const strokes=rig.groups.flatMap(group=>group.strokes);
  const left=Math.min(...strokes.map(s=>s.x)),right=Math.max(...strokes.map(s=>s.x+s.w));
  const bottom=Math.max(...strokes.map(s=>s.y+s.h)),{frame}=rig;
  const rigScale=(80/96)/Math.max(frame.width,frame.height);
  const center=((left+right)/2-frame.left-frame.width/2)*rigScale;
  const feet=.5-(bottom-frame.top-frame.height/2)*rigScale;
  const idle=frames[0],unit=(right-left)*rigScale/(idle.right-idle.left);
  const x=(idle.left+idle.right)/2-center/unit,y=idle.bottom+feet/unit;
  const floor=y-margin/unit;
  let scale=1;
  for(const frame of frames){
    const lift=Math.max(0,frame.bottom-floor);
    const halfWidth=Math.max(x-frame.left,frame.right-x)*unit;
    scale=Math.max(scale,2*(halfWidth+margin),(y+lift-frame.top)*unit+margin);
  }
  return {x,y,floor,factor:size*unit/scale,scale};
}

function rasterize(frame,layout,atlas,cell=size){
  const {sprite,inverse:[a,b,c,d]}=frame,{x,y,factor,floor}=layout;
  const lift=Math.max(0,frame.bottom-floor);
  const fill=Buffer.alloc(cell*cell*4),source=atlas.data,width=atlas.info.width;
  for(let row=0;row<cell;row++)for(let col=0;col<cell;col++){
    const dx=x+(col+.5-cell/2)/factor-frame.x,dy=y+lift+(row+.5-cell)/factor-frame.y;
    const sx=a*dx+c*dy,sy=b*dx+d*dy;
    if(sx<0||sx>=sprite.w||sy<0||sy>=sprite.h)continue;
    const px=Math.max(0,sx-.5),py=Math.max(0,sy-.5),ix=Math.floor(px),iy=Math.floor(py);
    const offset=((sprite.y+iy)*width+sprite.x+ix)*4;
    const nextX=ix+1<sprite.w?4:0,nextY=iy+1<sprite.h?width*4:0;
    const rx=px-ix,ry=py-iy;
    const p=source[offset+3]*(1-rx)*(1-ry),q=source[offset+nextX+3]*rx*(1-ry);
    const r=source[offset+nextY+3]*(1-rx)*ry,s=source[offset+nextY+nextX+3]*rx*ry;
    const alpha=p+q+r+s;
    if(alpha<.5)continue;
    const target=(row*cell+col)*4;
    for(let channel=0;channel<3;channel++){
      const i=offset+channel;
      fill[target+channel]=Math.round((source[i]*p+source[i+nextX]*q+source[i+nextY]*r+source[i+nextY+nextX]*s)/alpha);
    }
    fill[target+3]=Math.round(alpha);
  }
  return fill;
}

function withInk(fill,radius,ink=[39,35,47],cell=size){
  // Bake the same dark contour as the stroke renderer before packing frames.
  const offsets=[];
  for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++)if(x*x+y*y<=radius*radius)offsets.push(y*cell+x);
  const mask=Buffer.alloc(cell*cell);
  for(let i=0;i<mask.length;i++){
    const alpha=fill[i*4+3];
    if(alpha)for(const offset of offsets)mask[i+offset]=Math.max(mask[i+offset],alpha);
  }
  for(let i=0;i<mask.length;i++){
    const j=i*4,alpha=fill[j+3],border=mask[i]*(1-alpha/255),total=alpha+border;
    if(!border)continue;
    for(let channel=0;channel<3;channel++)fill[j+channel]=Math.round((fill[j+channel]*alpha+ink[channel]*border)/total);
    fill[j+3]=Math.round(total);
  }
  return fill;
}

// Reuse the authored poses and battle registration at menu resolution. The
// art direction for the entry screens uses a fine warm edge on the orange ink.
export async function makeEntryIdle(source){
  const stem=path.join(source,'art/hero-actions/4',starterWords[4]+'_待机行走死亡_优化');
  const data=JSON.parse(fs.readFileSync(stem+'.json','utf8'));
  const atlas=await sharp(stem+'.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const frames=actions.flatMap(action=>data.animations[action].frames.map(f=>pose(f,data.sprites[f.sprite])));
  const framing=layout(rigs[4],frames),cell=256,columns=5;
  framing.factor*=cell/size;
  const {frameCount:count,fps}=data.animations.idle,rows=Math.ceil(count/columns);
  const tiles=frames.slice(0,count).map((frame,i)=>({
    input:withInk(rasterize(frame,framing,atlas,cell),5,[111,43,22],cell),raw:{width:cell,height:cell,channels:4},
    left:i%columns*cell,top:Math.floor(i/columns)*cell,
  }));
  const image=await sharp({create:{width:columns*cell,height:rows*cell,channels:4,background:'#0000'}}).composite(tiles).png().toBuffer();
  return {image,idle:{first:0,count,fps,columns,rows,tile:size}};
}

export async function writeHeroActions(source){
  const art=path.join(source,'art','hero-actions'),output=path.join(source,'public','assets','glyphs','hero-actions');
  fs.mkdirSync(output,{recursive:true});
  const catalog={};
  for(const id of fs.readdirSync(art).filter(isPlayableHeroForm)){
    const stem=path.join(art,id,starterWords[id]+'_待机行走死亡_优化');
    const data=JSON.parse(fs.readFileSync(stem+'.json','utf8'));
    const atlas=await sharp(stem+'.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
    if(rigs[id].sheet==='wind')blueWindPixels(atlas.data,atlas.info.width,
      [{left:0,top:0,width:atlas.info.width,height:atlas.info.height}]);
    if(data.name!==rigs[id].word||data.size.w!==atlas.info.width||data.size.h!==atlas.info.height)
      throw Error('动作图集与角色不匹配：'+id);
    const clips={},frames=[];
    for(const action of actions){
      const {frames:sequence,fps,loop,frameCount}=data.animations[action];
      if(!frameCount||frameCount!==sequence.length||!fps)throw Error('动作帧数据无效：'+id+' '+action);
      clips[action]={first:frames.length,count:frameCount,fps,loop};
      for(const frame of sequence)frames.push(pose(frame,data.sprites[frame.sprite]));
    }
    const framing=layout(rigs[id],frames),rows=Math.ceil(frames.length/columns);
    const width=columns*size,height=rows*size,pixels=Buffer.alloc(width*height*4);
    const radius=Math.round(size*inkRadius/framing.scale);
    for(const [index,frame] of frames.entries()){
      const tile=withInk(rasterize(frame,framing,atlas),radius);
      const left=(index%columns)*size,top=Math.floor(index/columns)*size;
      for(let row=0;row<size;row++)tile.copy(pixels,((top+row)*width+left)*4,row*size*4,(row+1)*size*4);
    }
    await sharp(pixels,{raw:{width,height,channels:4}}).png().toFile(path.join(output,id+'.png'));
    catalog[id]={columns,rows,scale:framing.scale,clips};
  }
  fs.writeFileSync(path.join(source,'src','hero-action-catalog.js'),
    '// Generated by tools/hero-actions.mjs from the supplied character motions.\nexport const heroActionCatalog='+JSON.stringify(catalog)+';\n');
}
