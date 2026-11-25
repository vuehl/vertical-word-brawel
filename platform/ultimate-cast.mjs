import {VFX_SCALE} from '../source/src/effects/visual-scale.js';
import {unzlibSync} from 'fflate';
import clip from './ultimate-cast-frames.json' with {type:'json'};
import blade from './nameplate-blade.json' with {type:'json'};
import {bladeEntryOffset,bladeTime,bladeScaleX,bladeScaleY,flameOpeningBand} from '../source/src/effects/ultimate-cast-layout.js';

const bladeMs=blade.ends[blade.ends.length-1];
export const castHudLeadMs=clip.hideAt;
export const castDurationMs=clip.duration;

export function castHidesUI(run,now){
  const cue=run?.ult?.castBanner;
  if(!cue||(cue.tier??2)<2)return false;
  const elapsed=now-cue.start;
  return elapsed>=castHudLeadMs&&elapsed<castDurationMs;
}

function fillContours(ctx,words,offset,color){
  ctx.fillStyle=color;
  ctx.beginPath();
  let count;
  while((count=words[offset++])>0){
    let x=words[offset++]+.5,y=words[offset++]+.5;
    ctx.moveTo(x,y);
    for(let p=1;p<count;p++){
      x+=words[offset++];y+=words[offset++];
      ctx.lineTo(x,y);
    }
    ctx.closePath();
  }
  ctx.fill();
  return offset;
}

export function createUltimateCast(makeImage,makeCanvas,pathFor,readFile){
  let lightAtlas,ink,surface,ctx,last=-1,pending=false,failedCue;
  let bladeAtlas,bladePending=false,bladeFailedCue;
  function loadBlade(){
    const image=makeImage();bladePending=true;
    image.onload=()=>{bladeAtlas=image;bladePending=false;};
    image.onerror=()=>{bladePending=false;};
    image.src=pathFor('assets/vfx/nameplate-blade.webp');
  }
  loadBlade();
  const halves=[-1,-1];
  function load(){
    pending=true;
    try{
      if(!ink){
        const data=unzlibSync(new Uint8Array(readFile(pathFor('assets/vfx/ultimate-cast-ink.bin'))));
        ink=new Int16Array(data.length);
        let count=0,value=0,shift=0;
        for(const byte of data){
          value|=(byte&127)<<shift;
          if(byte&128){shift+=7;continue;}
          ink[count++]=(value>>>1)^-(value&1);
          value=shift=0;
        }
      }
      const image=makeImage();
      image.onload=()=>{lightAtlas=image;pending=false;};
      image.onerror=()=>{pending=false;};
      image.src=pathFor('assets/vfx/ultimate-cast.webp');
    }catch(error){pending=false;console.warn('大招演出资源读取失败',error);}
  }
  load();
  function bladeLayer(cue,band,scale,time){
    if(time>=bladeMs)return null;
    if(!bladeAtlas){
      if(!bladePending&&bladeFailedCue!==cue){bladeFailedCue=cue;loadBlade();}
      return null;
    }
    const exposure=bladeTime(time),i=blade.ends.findIndex(end=>end>exposure),start=i?blade.ends[i-1]:0;
    const {width:w,height:h,pad,columns}=blade;
    // The unoccupied bottom-right tile is the transparent exposure.
    const blank=columns*Math.round(bladeAtlas.height/(h+2*pad))-1;
    const uv=index=>{const n=index>=0?index:blank;return [
      ((n%columns)*(w+2*pad)+pad)/bladeAtlas.width,
      (Math.floor(n/columns)*(h+2*pad)+pad)/bladeAtlas.height];};
    if(blade.frames[i]<0&&!(blade.frames[i+1]>=0))return null;
    const [u,v]=uv(blade.frames[i]),[nextU,nextV]=uv(blade.frames[i+1]);
    // Fit the visible sweep and its glow, excluding the GIF's transparent margins.
    const sx=band.zoom*bladeScaleX,sy=band.zoom*bladeScaleY;
    const x=band.x+band.zoom*bladeEntryOffset(band,time)-(736-355)*sx,du=w/bladeAtlas.width;
    return {slot:30,canvas:bladeAtlas,x:x*scale,y:(band.y-219*sy)*scale,
      width:736*sx*scale,height:414*sy*scale,castColor:cue.color,
      castUV:[u+du,v,-du,-h/bladeAtlas.height],
      bladeNext:[nextU+du,nextV,(exposure-start)/(blade.ends[i]-start)]};
  }
  function flameLayer(cue,rect,scale,time){
    if(!lightAtlas){
      if(!pending&&failedCue!==cue){failedCue=cue;load();}
      return null;
    }
    const next=clip.keyTimes.findIndex(key=>key>time);
    const pair=next<0?clip.keyTimes.length-2:next-1;
    const fraction=Math.min(1,(time-clip.keyTimes[pair])/(clip.keyTimes[pair+1]-clip.keyTimes[pair]));
    const changed=last!==pair;
    const {tileWidth:w,tileHeight:h,columns,pad,width,height,flowWidth,flowHeight}=clip;
    if(!surface){
      surface=makeCanvas();surface.width=width*2;surface.height=height+flowHeight;
      ctx=surface.getContext('2d');
    }
    if(changed){
      for(const index of [pair,pair+1]){
        const half=index%2;
        if(halves[half]===index)continue;
        ctx.save();ctx.translate(half*width,0);
        const u=(index%columns)*(w+2*pad)+pad,v=Math.floor(index/columns)*(h+2*pad)+pad;
        ctx.globalCompositeOperation='source-over';
        ctx.drawImage(lightAtlas,u,v,w,h,0,0,width,height);
        // Red carries soft light. Green and blue carry the full-resolution rim and fill.
        ctx.globalCompositeOperation='multiply';ctx.fillStyle='#ff0000';ctx.fillRect(0,0,width,height);
        ctx.globalCompositeOperation='lighter';
        const inner=fillContours(ctx,ink,clip.offsets[index],'#00ff00');
        fillContours(ctx,ink,inner,'#0000ff');
        ctx.restore();halves[half]=index;
      }
      const stride=flowWidth+pad*2;
      const x=pair%clip.flowColumns*4*stride+pad;
      const y=clip.flowTop+Math.floor(pair/clip.flowColumns)*(flowHeight+pad*2)+pad;
      for(let plane=0;plane<4;plane++)
        ctx.drawImage(lightAtlas,x+plane*stride,y,flowWidth,flowHeight,plane*width/2,height,width/2,flowHeight);
      last=pair;
    }
    return {slot:29,canvas:surface,changed,x:rect.x*scale,y:rect.y*scale,width:rect.width*scale,height:rect.height*scale,
      castUV:[fraction,pair%2,height/surface.height,clip.ranges[pair]],castColor:cue.color};
  }
  return function castLayers(run,view,scale,now){
    const cue=run.ult.castBanner;
    if(!cue)return null;
    const elapsed=now-cue.start;
    if(elapsed>=castDurationMs){run.ult.castBanner=null;return null;}
    const time=Math.floor(Math.max(0,elapsed)*30/1000)*1000/30;
    const band=flameOpeningBand({x:0,y:0,width:view.width,height:view.height});
    const rect={x:band.x*(1-VFX_SCALE),y:band.y*(1-VFX_SCALE),width:view.width*VFX_SCALE,height:view.height*VFX_SCALE};
    const tier=cue.tier??2;
    return {band,
      flame:tier>=2?flameLayer(cue,rect,scale,time):null,
      blade:tier>=1?bladeLayer(cue,band,scale,time):null};
  };
}
