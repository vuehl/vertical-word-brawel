/*! Combo counter adapted from patch-gg/pixelfx, src/fx/ui/combo-counter.js.
 * Copyright (c) 2026 Patch and Hugo Duprez. MIT (see pixelfx-blink-in.js). */
import {castTitleLayout,castTitleLeft,castTitlePose,titleCenter,titleFont,titleLine,titleWidth} from '../source/src/effects/ultimate-cast-layout.js';
import {paintCastRow} from './cast-title-rows.mjs';
import {castDurationMs} from './ultimate-cast.mjs';
import {Rng} from '../source/src/vendor/pixelfx-blink-in.js';

const padLeft=24,padRight=12,canvasWidth=padLeft+titleWidth+padRight;

function rampColor(rgb,target,k){
  const channel=n=>Math.round((rgb>>n&255)*(1-k)+target*k);
  return 'rgb('+[channel(16),channel(8),channel(0)].join(',')+')';
}

export function createComboNameplate(makeCanvas,font,makeImage,atlasPath){
  let canvas,ctx,owner,lastStep=-1,layout,shade,base,tip,atlas,rows;
  const image=makeImage();
  image.onload=()=>{atlas=image;owner=null;};
  image.onerror=()=>console.warn('大招招名字形图集未加载',atlasPath);
  image.src=atlasPath;
  return (run,band,scale,now)=>{
    const cue=run?.ult?.castBanner;
    if(!cue?.name||now-cue.start>=castDurationMs)return null;
    const step=Math.floor(Math.max(0,now-cue.start)*30/1000),ms=step*1000/30;
    const fresh=owner!==cue;
    if(fresh){
      owner=cue;layout=castTitleLayout(cue.name);
      shade=rampColor(cue.color,0,.48);base=rampColor(cue.color,0,0);tip=rampColor(cue.color,255,.85);
      rows=atlas?layout.rows.map(text=>paintCastRow(makeCanvas,atlas,text,shade,base,tip)):[];
    }
    if(!canvas){canvas=makeCanvas();ctx=canvas.getContext('2d');}
    const pixels=Math.min(3,Math.max(1,band.zoom*scale));
    const w=Math.ceil(canvasWidth*pixels),h=Math.ceil(layout.height*pixels);
    const resize=w!==canvas.width||h!==canvas.height,changed=fresh||resize||step!==lastStep;
    if(changed){
      if(resize){canvas.width=w;canvas.height=h;}
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);
      const {offset,reveal,alpha}=castTitlePose(band,ms,castDurationMs);
      const edgeX=titleWidth-reveal;
      if(reveal>0&&alpha>0){
        const clipLeft=reveal>=titleWidth?-padLeft:edgeX;
        ctx.save();ctx.setTransform(w/canvasWidth,0,0,h/layout.height,padLeft*w/canvasWidth,0);
        ctx.beginPath();ctx.rect(clipLeft,0,titleWidth+padRight-clipLeft,layout.height);ctx.clip();
        ctx.globalAlpha=alpha;ctx.font=titleFont+'px '+font;
        ctx.textBaseline='middle';ctx.textAlign='center';ctx.lineJoin='round';
        const fullCast=(cue.tier??2)>=2,hit=(ms-500)/320;
        if(fullCast&&ms<500){
          const rng=new Rng(step+1);
          ctx.fillStyle=tip;
          for(let i=0;i<9;i++)ctx.fillRect(edgeX+rng.range(8,60),layout.height/2+rng.range(-44,44),-rng.range(4,21),1.5);
        }else if(fullCast&&hit<1){
          ctx.save();ctx.globalAlpha=(1-hit)*.65;ctx.strokeStyle=tip;ctx.lineWidth=2;
          ctx.beginPath();
          ctx.save();ctx.translate(titleCenter,layout.height/2);ctx.scale(36+60*hit,18+32*hit);
          ctx.arc(0,0,1,0,2*Math.PI);ctx.restore();ctx.stroke();
          ctx.restore();
        }
        for(let row=0;row<layout.rows.length;row++){
          const y=(layout.height-(layout.rows.length-1)*titleLine)/2+row*titleLine;
          ctx.save();ctx.translate(titleCenter+offset,y);ctx.rotate(.0774);
          const sprite=rows[row],flash=hit>=0&&hit<.18;
          if(sprite){
            ctx.drawImage(sprite.canvas,0,flash?sprite.h:0,sprite.w,sprite.h,
              -sprite.width/2,-sprite.height/2,sprite.width,sprite.height);
          }else{
            const fill=ctx.createLinearGradient(0,-36,0,39);
            fill.addColorStop(0,'white');fill.addColorStop(.66,tip);fill.addColorStop(1,base);
            ctx.lineWidth=10;ctx.strokeStyle=shade;ctx.strokeText(layout.rows[row],0,1);
            ctx.fillStyle=flash?'white':fill;ctx.fillText(layout.rows[row],0,0);
          }
          ctx.restore();
        }
        if(fullCast&&ms>600&&ms<castDurationMs-200){
          const length=Math.min(2,Array.from(cue.name).length)*titleFont;
          const x=titleCenter+offset-length/2,y=layout.height-8;
          ctx.fillStyle=shade;ctx.fillRect(x,y,length,4);
          ctx.fillStyle=tip;ctx.fillRect(x,y+1,length*(1-(ms-600)/(castDurationMs-800)),2);
        }
        if(reveal<titleWidth){
          const edge=ctx.createLinearGradient(edgeX+4,0,edgeX,0);
          edge.addColorStop(0,'transparent');edge.addColorStop(1,'white');
          ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-out';
          ctx.fillStyle=edge;ctx.fillRect(edgeX,0,4,layout.height);
        }
        ctx.restore();
      }
      lastStep=step;
    }
    return {slot:21,canvas,changed,x:(castTitleLeft(band)-padLeft*band.zoom)*scale,y:(band.y-layout.height*band.zoom/2)*scale,
      width:canvasWidth*band.zoom*scale,height:layout.height*band.zoom*scale};
  };
}
