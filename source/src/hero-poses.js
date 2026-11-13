import rigs from './hero-rigs.json' with {type:'json'};
import windFaint from './faint_01_anim.json' with {type:'json'};
import {drawBattleOutline} from './paper-glyph-art.js';

const sheets=new Map();
export function prepareHeroStrokes(species){
  const name=rigs[species]?.sheet;
  if(!name)return;
  const strokes=prepareSheet(name+'-strokes.png');
  return rigs[species].word==='风'?Promise.all([strokes,prepareSheet(windFaint.atlas.image)]):strokes;
}

function prepareSheet(name){
  if(!sheets.has(name))sheets.set(name,{});
  const entry=sheets.get(name);
  if(entry.image||Date.now()<entry.retryAfter)return;
  if(!entry.loading)entry.loading=new Promise(resolve=>{
    const image=new Image();
    const finish=ok=>{
      clearTimeout(timer);image.onload=image.onerror=null;
      if(ok)entry.image=image;else entry.retryAfter=Date.now()+15000;
      entry.loading=null;resolve();
    };
    const timer=setTimeout(()=>finish(false),12000);
    image.onload=()=>finish(true);image.onerror=()=>finish(false);
    image.src='assets/glyphs/'+name;
  });
  return entry.loading;
}

export function windFaintTile(species,elapsedMs){
  if(rigs[species]?.word!=='风'||!sheets.get(windFaint.atlas.image)?.image)return;
  const {frames,frameMs}=windFaint.anims.faint;
  const index=Math.min(frames.length-1,Math.floor(Math.max(0,elapsedMs)/frameMs));
  return windFaint.tiles[frames[index]];
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
export function createHeroPoseTexture(Texture,colorSpace){
  const size=256;
  const makeCanvas=()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;};
  const canvas=makeCanvas(),ink=canvas.getContext('2d');
  const fill=makeCanvas(),ctx=fill.getContext('2d');
  const texture=new Texture(canvas);texture.colorSpace=colorSpace;
  let previousRig,previousPose,previousTile;
  function drawRig(rig,pose){
    const sheet=sheets.get(rig.sheet+'-strokes.png').image;
    const {left,top,width,height}=rig.frame;
    const scale=size*(80/96)/Math.max(width,height);
    ctx.save();
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
  }
  function draw(rig,pose,tile){
    if(rig===previousRig&&pose===previousPose&&tile===previousTile)return;
    ctx.clearRect(0,0,size,size);
    if(tile){
      // The trimmed frames all share the same bottom-center pivot.
      const scale=size/windFaint.canvas.h;
      const x=size/2+(tile.ox-windFaint.pivot.x)*scale;
      const y=size+(tile.oy-windFaint.pivot.y)*scale;
      ctx.drawImage(sheets.get(windFaint.atlas.image).image,tile.x,tile.y,tile.w,tile.h,
        x,y,tile.w*scale,tile.h*scale);
    }else drawRig(rig,pose);
    ink.clearRect(0,0,size,size);
    drawBattleOutline(ink,fill);
    ink.drawImage(fill,0,0);
    texture.needsUpdate=true;
    previousRig=rig;previousPose=pose;previousTile=tile;
  }
  return {texture,rect:new Float32Array([0,0,1,1]),draw};
}
export function loadedHeroRig(species){
  const rig=rigs[species];
  if(!rig)return;
  if(sheets.get(rig.sheet+'-strokes.png')?.image)return rig;
  prepareHeroStrokes(species);
}
