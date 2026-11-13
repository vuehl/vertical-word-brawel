import rigs from './hero-rigs.json' with {type:'json'};
import windDeathData from './wind-death-anim.json' with {type:'json'};
import windIdleData from './wind-idle-anim.json' with {type:'json'};
import windWalkData from './wind-walk-anim.json' with {type:'json'};
import {drawBattleOutline} from './paper-glyph-art.js';

const sheets=new Map();
function rigScale(rig){
  return (80/96)/Math.max(rig.frame.width,rig.frame.height);
}

// Register each clip's first authored frame to the standing ink. Keep that
// registration fixed so later affine frames retain their original motion.
const windRig=Object.values(rigs).find(rig=>rig.word==='风');
const windStrokes=windRig.groups.flatMap(group=>group.strokes);
const left=Math.min(...windStrokes.map(s=>s.x)),right=Math.max(...windStrokes.map(s=>s.x+s.w));
const bottom=Math.max(...windStrokes.map(s=>s.y+s.h));
const idleScale=rigScale(windRig);
const centerOffset=((left+right)/2-windRig.frame.left-windRig.frame.width/2)*idleScale;
const footGap=.5-(bottom-windRig.frame.top-windRig.frame.height/2)*idleScale;

function windClip(data,key,loop,padding=0){
  const sequence=data.anims[key],first=sequence.frames[0],tile=data.tiles[first.tile];
  const [a,b,c,d]=first.m,[tx,ty]=first.t;
  const corners=[[0,0],[tile.w,0],[0,tile.h],[tile.w,tile.h]].map(([x,y])=>[a*x+c*y+tx,b*x+d*y+ty]);
  const x0=Math.min(...corners.map(p=>p[0])),x1=Math.max(...corners.map(p=>p[0]));
  const canvasHeight=data.canvas.h+padding;
  const layout={image:data.atlas.image,canvasHeight,
    centerX:(x0+x1)/2,footY:Math.max(...corners.map(p=>p[1])),
    renderScale:(right-left)*idleScale/((x1-x0)/canvasHeight)};
  return {frameMs:sequence.frameMs,loop,
    frames:sequence.frames.map(frame=>({...frame,tile:data.tiles[frame.tile],layout}))};
}
// idle_N supplies the idle loop; faint_02/faint_01 supplies the death sequence.
const windDeath=windClip(windDeathData,'faint',false);
const windIdle=windClip(windIdleData,'idle',true);
// Wide stride poses need room for their battle outline. Increasing both the
// virtual canvas and render scale adds margin without shrinking the character.
const windWalk=windClip(windWalkData,'walk',true,64);

export function prepareHeroStrokes(species){
  const name=rigs[species]?.sheet;
  if(!name)return;
  const strokes=prepareSheet(name+'-strokes.png');
  return rigs[species].word==='风'
    ?Promise.all([strokes,prepareSheet(windDeathData.atlas.image),prepareSheet(windIdleData.atlas.image),
      prepareSheet(windWalkData.atlas.image,windWalkData.atlas)])
    :strokes;
}

function decodeSheet(image,atlas){
  if(atlas?.mode!=='L')return image;
  // This PNG is an opaque grayscale mask: its red channel, not its PNG alpha,
  // carries coverage. Decode once on load and reuse the colored canvas.
  const canvas=document.createElement('canvas');canvas.width=atlas.w;canvas.height=atlas.h;
  const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),data=pixels.data;
  const [r,g,b]=atlas.color;
  for(let i=0;i<data.length;i+=4){data[i+3]=data[i];data[i]=r;data[i+1]=g;data[i+2]=b;}
  ctx.putImageData(pixels,0,0);
  return canvas;
}

function prepareSheet(name,atlas){
  if(!sheets.has(name))sheets.set(name,{});
  const entry=sheets.get(name);
  if(entry.image||Date.now()<entry.retryAfter)return;
  if(!entry.loading)entry.loading=new Promise(resolve=>{
    const image=new Image();
    const finish=ok=>{
      clearTimeout(timer);image.onload=image.onerror=null;
      if(ok){try{entry.image=decodeSheet(image,atlas);}catch{ok=false;}}
      if(!ok)entry.retryAfter=Date.now()+15000;
      entry.loading=null;resolve();
    };
    const timer=setTimeout(()=>finish(false),12000);
    image.onload=()=>finish(true);image.onerror=()=>finish(false);
    image.src='assets/glyphs/'+name;
  });
  return entry.loading;
}

export function windFaintTile(species,elapsedMs){
  return windClipFrame(species,windDeath,elapsedMs);
}

function windClipFrame(species,clip,elapsedMs){
  if(rigs[species]?.word!=='风'||!sheets.get(clip.frames[0].layout.image)?.image)return;
  const {frames,frameMs,loop}=clip;
  const frame=Math.floor(Math.max(0,elapsedMs)/frameMs);
  const index=loop?frame%frames.length:Math.min(frame,frames.length-1);
  return frames[index];
}

export function startWindFaint(species){
  return startWindClip(species,windDeath);
}

function startWindClip(species,clip){
  if(rigs[species]?.word!=='风')return;
  let lastRenderMs,elapsedMs=0;
  return nowMs=>{
    if(!sheets.get(clip.frames[0].layout.image)?.image)return;
    if(lastRenderMs!==undefined){
      // A missed draw may extend a pose, but must not skip its successor.
      elapsedMs+=Math.min(clip.frameMs,Math.max(0,nowMs-lastRenderMs));
    }
    lastRenderMs=nowMs;
    return windClipFrame(species,clip,elapsedMs);
  };
}

export function windHeroFrame(player){
  // Attacks and ultimates keep the current idle/walk playback and its clock.
  const locomotion=rigs[player.speciesId]?.word==='风'&&!player.dead&&player.grounded&&
    !player.gliding&&!player.swimNow&&!(player.slideT>0)&&!(player.hurtT>0)&&
    !(player.heroPose??player.firePose);
  const idle=locomotion&&player.speedNow<=.6,walking=locomotion&&player.speedNow>.6;
  if(!idle)player.windIdle=undefined;
  if(!walking)player.windWalk=undefined;
  if(player.dead)return player.windFaint?.(player.run.realTime*1000);
  if(walking){
    player.windWalk??=startWindClip(player.speciesId,windWalk);
    return player.windWalk(player.run.time*1000);
  }
  if(!idle)return;
  player.windIdle??=startWindClip(player.speciesId,windIdle);
  // Gameplay time freezes with pause; death uses unscaled time above.
  return player.windIdle(player.run.time*1000);
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
  let previousRig,previousPose,previousFrame;
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
  function draw(rig,pose,frame){
    if(rig===previousRig&&pose===previousPose&&frame===previousFrame)return;
    ctx.clearRect(0,0,size,size);
    if(frame){
      const {tile,layout,m,t}=frame,scale=size/layout.canvasHeight;
      ctx.save();
      ctx.translate(size*(.5+centerOffset/layout.renderScale)-layout.centerX*scale,
        size*(1-footGap/layout.renderScale)-layout.footY*scale);
      ctx.scale(scale,scale);
      ctx.transform(...m,...t);
      ctx.drawImage(sheets.get(layout.image).image,tile.x,tile.y,tile.w,tile.h,0,0,tile.w,tile.h);
      ctx.restore();
    }else drawRig(rig,pose);
    ink.clearRect(0,0,size,size);
    drawBattleOutline(ink,fill,0,frame?frame.layout.renderScale:1);
    ink.drawImage(fill,0,0);
    texture.needsUpdate=true;
    previousRig=rig;previousPose=pose;previousFrame=frame;
  }
  return {texture,rect:new Float32Array([0,0,1,1]),draw};
}
export function loadedHeroRig(species){
  const rig=rigs[species];
  if(!rig)return;
  if(sheets.get(rig.sheet+'-strokes.png')?.image)return rig;
  prepareHeroStrokes(species);
}
