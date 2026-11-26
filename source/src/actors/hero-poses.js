import rigs from '../../../resources/public/config/hero-rigs.json' with {type:'json'};
import {drawBattleOutline,loadGlyphImage} from './paper-glyph-art.js';
import {isPlayableHeroForm} from '../data/starter-characters.js';

const playableRigs=Object.fromEntries(Object.entries(rigs).filter(([id])=>isPlayableHeroForm(id)));
const sheets=new Map();
function rigScale(rig){
  return (80/96)/Math.max(rig.frame.width,rig.frame.height);
}

export function prepareHeroStrokes(species){return prepareStrokeSheet(playableRigs[species]);}
function prepareStrokeSheet(rig){
  const name=rig?.sheet;
  if(!name)return;
  if(!sheets.has(name))sheets.set(name,{});
  const entry=sheets.get(name);
  if(entry.image||Date.now()<entry.retryAfter)return;
  entry.loading??=loadGlyphImage(name+'-strokes.png')
    .then(image=>{entry.image=image;},()=>{entry.retryAfter=Date.now()+15000;})
    .finally(()=>{entry.loading=null;});
  return entry.loading;
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
  let previousRig,previousPose,previousRemoved;
  function drawRig(rig,pose,removed=0){
    const sheet=sheets.get(rig.sheet).image;
    const {left,top,width,height}=rig.frame;
    const scale=size*rigScale(rig);
    ctx.save();
    ctx.translate(size/2,size/2);ctx.scale(scale,scale);
    ctx.translate(-left-width/2,-top-height/2);
    let strokeIndex=0;
    const keep=rig.groups.reduce((n,g)=>n+g.strokes.length,0)-removed;
    for(const group of rig.groups){
      ctx.save();transform(ctx,group,pose?.groups?.[group.name]);
      for(const s of group.strokes){
        if(strokeIndex++>=keep)continue;
        ctx.save();transform(ctx,s,pose?.strokes?.[group.name]?.[s.name]);
        ctx.drawImage(sheet,s.sx,s.sy,s.w,s.h,s.x,s.y,s.w,s.h);ctx.restore();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  function draw(rig,pose,removed=0){
    if(rig===previousRig&&pose===previousPose&&removed===previousRemoved)return;
    ctx.clearRect(0,0,size,size);
    drawRig(rig,pose,removed);
    ink.clearRect(0,0,size,size);
    drawBattleOutline(ink,fill);
    ink.drawImage(fill,0,0);
    texture.needsUpdate=true;
    previousRig=rig;previousPose=pose;previousRemoved=removed;
  }
  return {texture,rect:new Float32Array([0,0,1,1]),draw};
}
export function loadedHeroRig(species){
  const rig=playableRigs[species];
  if(!rig)return;
  if(sheets.get(rig.sheet)?.image)return rig;
  prepareHeroStrokes(species);
}

export function loadedHeroStrokeSheet(species){
  const rig=loadedHeroRig(species);
  return rig?{rig,image:sheets.get(rig.sheet).image}:null;
}

// Capture artwork is selected from configured rigs, independently of the starter roster.
export function loadedCaptureStrokeSheet(species,word){
  const rig=rigs[species]?.word===word?rigs[species]:Object.values(rigs).find(r=>r.word===word);
  if(!rig)return null;
  const image=sheets.get(rig.sheet)?.image;
  if(!image){prepareStrokeSheet(rig);return null;}
  return {rig,image};
}
