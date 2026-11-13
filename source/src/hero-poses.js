import rigs from './hero-rigs.json' with {type:'json'};
import windFaint from './faint_01_anim.json' with {type:'json'};
import {drawBattleOutline} from './paper-glyph-art.js';

const sheets=new Map();
function rigScale(rig){
  return (80/96)/Math.max(rig.frame.width,rig.frame.height);
}

// Register the first authored frame to the standing ink. All later frames use
// this same transform so the hold, tilt and collapse keep their original motion.
const windRig=Object.values(rigs).find(rig=>rig.word==='风');
const windStrokes=windRig.groups.flatMap(group=>group.strokes);
const left=Math.min(...windStrokes.map(s=>s.x)),right=Math.max(...windStrokes.map(s=>s.x+s.w));
const bottom=Math.max(...windStrokes.map(s=>s.y+s.h));
const first=windFaint.tiles[windFaint.anims.faint.frames[0]];
const idleScale=rigScale(windRig);
export const windFaintRenderScale=(right-left)*idleScale/(first.w/windFaint.canvas.w);
const centerOffset=((left+right)/2-windRig.frame.left-windRig.frame.width/2)*idleScale;
const footGap=.5-(bottom-windRig.frame.top-windRig.frame.height/2)*idleScale;

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

export function startWindFaint(species){
  if(rigs[species]?.word!=='风')return;
  let lastRenderMs,elapsedMs=0;
  return nowMs=>{
    if(!sheets.get(windFaint.atlas.image)?.image)return;
    if(lastRenderMs!==undefined){
      // A missed draw may extend a pose, but must not skip its successor.
      elapsedMs+=Math.min(windFaint.anims.faint.frameMs,Math.max(0,nowMs-lastRenderMs));
    }
    lastRenderMs=nowMs;
    return windFaintTile(species,elapsedMs);
  };
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
    const scale=size*rigScale(rig);
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
      const scale=size/windFaint.canvas.h;
      const x=size*(.5+centerOffset/windFaintRenderScale)+(tile.ox-first.ox-first.w/2)*scale;
      const y=size*(1-footGap/windFaintRenderScale)+(tile.oy-first.oy-first.h)*scale;
      // The held pose alternates with p4 by only 1–2 source pixels. Give
      // that upward pulse 12 more pixels on the 512px canvas, keeping its feet planted.
      const pulse=tile===windFaint.tiles.p4?12*scale:0;
      ctx.drawImage(sheets.get(windFaint.atlas.image).image,tile.x,tile.y,tile.w,tile.h,
        x,y-pulse,tile.w*scale,tile.h*scale+pulse);
    }else drawRig(rig,pose);
    ink.clearRect(0,0,size,size);
    drawBattleOutline(ink,fill,0,tile?windFaintRenderScale:1);
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
