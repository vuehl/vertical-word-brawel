import {captureSoulTiming} from '../source/src/actors/capture-soul-timing.js';
import {draw,drawBack,meta} from './pixelfx-soul-drain.mjs';

export function createSmoothSoulDrain(){
  const canvas=wx.createCanvas();
  canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');
  const options={...meta.options,palette:['#f4a7ad','#ffb6bd','#ffc4cb','#ffd4d9','#ffe1e4','#ffedf0','#fff6f7','#ffffff'],soul:['#ffb8c5','#ffd2da','#fff1f3','#ffffff']};
  let strokes=[],angle=0,glyphLocalSize=0;
  const rgba=(color,alpha=1)=>`rgba(${color&255},${(color>>>8)&255},${(color>>>16)&255},${Math.max(0,Math.min(1,alpha))})`;
  const painter={
    stroke(index,x,y,alpha,remaining=1){
      const image=strokes[index]?._surface||strokes[index];
      if(!image || alpha<=0)return;
      const size=glyphLocalSize*(strokes[index].captureSizeRatio||1)*remaining;
      if(size<=0)return;
      const scale=size/Math.max(image.width,image.height);
      ctx.save();ctx.translate(x,y);ctx.rotate(-angle);
      ctx.globalAlpha*=alpha;ctx.shadowColor='#ffc2d0';ctx.shadowBlur=16*remaining;
      ctx.drawImage(image,-image.width*scale/2,-image.height*scale/2,image.width*scale,image.height*scale);
      ctx.shadowBlur=0;
      ctx.drawImage(image,-image.width*scale/2,-image.height*scale/2,image.width*scale,image.height*scale);
      ctx.restore();
    },
    disc(x,y,r,color,alpha=1){
      // The original dark core is translucent over the game scene.
      if((color&255)<35 && ((color>>>8)&255)<35 && ((color>>>16)&255)<35)alpha*=.12;
      ctx.fillStyle=rgba(color,alpha);ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,Math.PI*2);ctx.fill();
    },
    px(x,y,color){this.dot(x,y,color);},
    light(x,y,color,alpha){this.dot(x,y,color,alpha);},
    circle(x,y,r,color){this.disc(x,y,r,color);},
    dot(x,y,color,alpha=1){this.disc(x,y,.55,color,alpha);},
    line(x,y,tx,ty,color,alpha=1){
      alpha*=.82;
      if(typeof color==='function'){
        const gradient=ctx.createLinearGradient(x,y,tx,ty);
        gradient.addColorStop(0,rgba(color(0),alpha));
        gradient.addColorStop(1,rgba(color(1),alpha));ctx.strokeStyle=gradient;
      }else ctx.strokeStyle=rgba(color,alpha);
      ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();
    },
    ring(x,y,r,width,color,alpha=1){
      ctx.strokeStyle=rgba(color,alpha);ctx.lineWidth=width;
      ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,Math.PI*2);ctx.stroke();
    },
    glow(x,y,r,color,alpha=1){
      if(r<=0)return;
      const gradient=ctx.createRadialGradient(x,y,0,x,y,r);
      gradient.addColorStop(0,rgba(color,alpha));gradient.addColorStop(.35,rgba(color,alpha*.35));
      gradient.addColorStop(1,rgba(color,0));ctx.fillStyle=gradient;
      ctx.fillRect(x-r,y-r,r*2,r*2);
    },
    glowRing(x,y,r,width,color,alpha=1){
      for(let i=3;i>=1;i--)this.ring(x,y,r,width*i,color,alpha*.16);
    }
  };
  return {
    draw(phase,dx,dy,images,glyphWidth,origins=[]){
      strokes=images||[];options.count=strokes.length;
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,512,512);
      // Local (0,-50) is the vessel and (128,-50) is the spirit.
      const length=Math.hypot(dx,dy),extent=length+100,scale=512/extent;
      glyphLocalSize=(glyphWidth||26)*128/Math.max(length,.001);
      const ax=-dx*scale/128,ay=-dy*scale/128;
      angle=Math.atan2(ay,ax);
      const localPerPixel=128/Math.max(length,.001),cos=Math.cos(angle),sin=Math.sin(angle);
      options.origins=origins.map(({x,y})=>({sx:128+(x*cos+y*sin)*localPerPixel,sy:-50+(-x*sin+y*cos)*localPerPixel}));
      const tx=256+dx*scale/2,ty=256+dy*scale/2;
      ctx.setTransform(ax,ay,-ay,ax,tx-ay*50,ty+ax*50);
      ctx.lineCap='round';
      ctx.globalAlpha=Math.min(1,phase*10,(1-phase)*12);
      const time=phase*captureSoulTiming.duration;
      drawBack(painter,time,options);
      draw(painter,time,options);
      ctx.globalAlpha=1;
      return {canvas,extent};
    }
  };
}
