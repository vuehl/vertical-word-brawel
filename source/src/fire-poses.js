import rigs from './fire-rigs.json' with {type:'json'};
import {drawBattleOutline} from './paper-glyph-art.js';

let sheet,loading,retryAfter=0;
export function prepareFireStrokes(species){
  if(!rigs[species]||sheet||Date.now()<retryAfter)return;
  if(!loading)loading=new Promise(resolve=>{
    const image=new Image();
    const finish=ok=>{
      clearTimeout(timer);image.onload=image.onerror=null;
      if(ok)sheet=image;else retryAfter=Date.now()+15000;
      loading=null;resolve();
    };
    const timer=setTimeout(()=>finish(false),12000);
    image.onload=()=>finish(true);image.onerror=()=>finish(false);
    image.src='assets/glyphs/fire-strokes.png';
  });
  return loading;
}

function transform(ctx,node,pose){
  if(!pose)return;
  const px=pose.px??node.px,py=pose.py??node.py;
  ctx.translate(px+(pose.x??0),py+(pose.y??0));
  if(pose.angle)ctx.rotate(pose.angle*Math.PI/180);
  ctx.scale(pose.scaleX??1,pose.scaleY??1);
  ctx.translate(-px,-py);
}

// One private player texture. Other actors and portraits keep their own UVs.
// A pose is an immutable keyframe in original 512px artwork coordinates.
export function createFirePoseTexture(Texture,colorSpace){
  const size=256;
  const makeCanvas=()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;};
  const canvas=makeCanvas(),ink=canvas.getContext('2d');
  const fill=makeCanvas(),ctx=fill.getContext('2d');
  const texture=new Texture(canvas);texture.colorSpace=colorSpace;
  let previousRig,previousPose;
  function draw(rig,pose){
    if(rig===previousRig&&pose===previousPose)return;
    const {left,top,width,height}=rig.frame;
    const scale=size*(80/96)/Math.max(width,height);
    ctx.clearRect(0,0,size,size);ctx.save();
    ctx.translate(size/2,size/2);ctx.scale(scale,scale);
    ctx.translate(-left-width/2,-top-height/2);
    for(const group of rig.groups){
      ctx.save();transform(ctx,group,pose?.groups?.[group.name]);
      for(const s of group.strokes){
        ctx.save();transform(ctx,s,pose?.strokes?.[group.name]?.[s.name]);
        ctx.drawImage(sheet,s.sx,s.sy,s.w,s.h,s.x,s.y,s.w,s.h);ctx.restore();
      }
      ctx.restore();
    }
    ctx.restore();
    ink.clearRect(0,0,size,size);
    drawBattleOutline(ink,fill);
    ink.drawImage(fill,0,0);
    texture.needsUpdate=true;
    previousRig=rig;previousPose=pose;
  }
  return {texture,rect:new Float32Array([0,0,1,1]),draw};
}
export function loadedFireRig(species){
  const rig=rigs[species];
  if(rig&&!sheet&&!loading)prepareFireStrokes(species);
  return sheet&&rig;
}
