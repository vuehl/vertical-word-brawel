import {VFX_SCALE} from '../source/src/effects/visual-scale.js';
import {Rng,clamp,ease,WHITE,flare} from '../source/src/vendor/pixelfx-blink-in.js';
import {blinkDuration,lineAt,openAt,flashAt,flashTail} from '../source/src/effects/ultimate-ready-timing.js';

export const tile=40;

// Flood from outside the tile, so holes in the glyph never catch incoming motes.
export function silhouette(rgba){
  const stride=tile+2,grid=new Uint8Array(stride*stride),ink=[],edge=[];
  let left=tile,right=0,top=tile,bottom=0,mass=0,sumX=0,sumY=0;
  for(let y=0;y<tile;y++)for(let x=0;x<tile;x++){
    const alpha=rgba[(y*tile+x)*4+3]/255;
    if(alpha<.02)continue;
    grid[(y+1)*stride+x+1]=1;ink.push({x,y,alpha});
    left=Math.min(left,x);right=Math.max(right,x);
    top=Math.min(top,y);bottom=Math.max(bottom,y);
    mass+=alpha;sumX+=(x+.5)*alpha;sumY+=(y+.5)*alpha;
  }
  const queue=[0];grid[0]=2;
  function visit(i){if(grid[i]===0){grid[i]=2;queue.push(i);}}
  for(let i=0;i<queue.length;i++){
    const at=queue[i],col=at%stride;
    if(col>0)visit(at-1);
    if(col<stride-1)visit(at+1);
    visit(at-stride);visit(at+stride);
  }
  const cx=mass?sumX/mass:tile/2,cy=mass?sumY/mass:tile/2;
  for(const {x,y} of ink){
    const i=(y+1)*stride+x+1;
    if(grid[i-1]===2||grid[i+1]===2||grid[i-stride]===2||grid[i+stride]===2)
      edge.push({x,y,angle:Math.atan2(y-cy,x-cx)});
  }
  edge.sort((a,b)=>a.angle-b.angle);
  return {ink,edge,cx,cy,span:right-left+1,bounds:{left,right:right+1,top,bottom:bottom+1}};
}

// Timings from Blink In. The short incoming paths end on the outside contour.
const rng=new Rng(12);
const bits=Array.from({length:18},()=>({
  point:rng.next(),distance:rng.range(12,28)*VFX_SCALE,spin:rng.range(.6,1.4)*rng.sign(),
  start:rng.range(0,.1),end:rng.range(lineAt-.02,openAt),shade:rng.pick([4,5,6])
}));

// Launch from an ellipse around the whole figure. Keep each launch point through pose changes.
export function createReadyEmbers(){
  const launches=[],interval=.43,lifetime=.96;
  return function drawEmbers(p,shape,seconds,ramp){
    const elapsed=seconds-.22;
    if(elapsed<0||!shape.edge.length)return;
    const latest=Math.floor(elapsed/interval);
    for(let id=Math.max(0,latest-2);id<=latest;id++){
      const age=elapsed-id*interval;
      if(age>=lifetime)continue;
      const slot=id%3,bit=bits[id%bits.length];
      let launch=launches[slot];
      if(launch?.id!==id){
        const {left,right,top,bottom}=shape.bounds;
        const angle=(bit.point-.48)*1.85,dx=(id%2?1:-1)*Math.cos(angle),dy=Math.sin(angle);
        launch=launches[slot]={id,dx,dy,
          x:(left+right)/2+dx*((right-left)/2+1),
          y:(top+bottom)/2+dy*((bottom-top)/2+1)};
      }
      const life=age/lifetime,alpha=clamp(age/.12)*clamp((1-life)/.38);
      for(let trail=3;trail>=0;trail--){
        const t=life-trail*.065;
        if(t<0)continue;
        const distance=bit.distance*.58*t;
        const x=launch.x+launch.dx*distance+bit.spin*t*t*1.8;
        const y=launch.y+launch.dy*distance-5*t*t;
        const strength=alpha*(1-trail/4)**2;
        p.blend(x,y,ramp[bit.shade],strength);
        if(trail===0)p.glow(x,y,2.5*VFX_SCALE,ramp[5],strength*.32);
      }
    }
  };
}

function outline(p,shape,strength,ramp){
  for(const {x,y} of shape.edge){
    p.glow(x,y,3.1*VFX_SCALE,ramp[4],.23*strength);
    p.blend(x,y,ramp[6],strength);
  }
}

function converge(p,shape,t,ramp){
  for(const bit of bits){
    if(t<=bit.start||t>=bit.end+.02)continue;
    const k=clamp((t-bit.start)/(bit.end-bit.start)),remaining=1-ease.outCubic(k);
    const edge=shape.edge[Math.floor(bit.point*shape.edge.length)];
    const angle=edge.angle+remaining*bit.spin*1.2;
    const x=edge.x+Math.cos(angle)*bit.distance*remaining,y=edge.y+Math.sin(angle)*bit.distance*remaining*.85;
    const alpha=Math.min(1,k*8)*clamp((bit.end+.02-t)/.04);
    p.blend(x,y,ramp[bit.shade],alpha);
    p.glow(x,y,2.5*VFX_SCALE,ramp[5],alpha*.32);
  }
}

// A white central filament and a wider, softer colored shoulder. Both fall to
// zero along the ray. Alpha and emitted light remain separate all the way to GL.
function horizontalRay(p,shape,ramp,reach,power,color=WHITE){
  const {cx,cy}=shape;
  reach*=VFX_SCALE;
  if(reach<1||power<=0)return;
  for(let x=-Math.ceil(reach);x<=Math.ceil(reach);x++){
    const u=Math.abs(x)/reach;
    if(u>=1)continue;
    const taper=shape.face?1-u*u:1-u,core=power*taper*taper;
    p.blend(cx+x,cy,color,core*.85);
    p.light(cx+x,cy,ramp[6],core*1.55);
    for(let y=1;y<=2;y++){
      const light=core*(y===1?.41:.1)*(1-u);
      p.light(cx+x,cy-y,ramp[5],light);
      p.light(cx+x,cy+y,ramp[5],light);
    }
  }
}

function drawCharge(p,shape,elapsed,ramp){
  // Give the extra lead time to the incoming motes. Keep the quick opening just before full.
  const gatherDuration=blinkDuration-(flashAt-lineAt);
  const t=elapsed<gatherDuration?lineAt*elapsed/gatherDuration:lineAt+elapsed-gatherDuration;
  const face=shape.face??shape,{cx,cy}=shape;
  if(t<openAt)converge(p,shape,t,ramp);
  if(t<lineAt){
    const point=clamp((t-lineAt+.06)/.06);
    p.glow(cx,cy,7*VFX_SCALE,ramp[6],point*.55);
    return;
  }
  if(t<openAt){
    const q=ease.outCubic((t-lineAt)/(openAt-lineAt));
    horizontalRay(p,shape,ramp,(shape.face ? tile*.95 : face.span*.95+5)*q,shape.face ? .85 : .62,ramp[5]);
    p.glow(cx,cy,26*VFX_SCALE,ramp[5],.76*q);
    p.glow(cx,cy,7*VFX_SCALE,ramp[6],.4*q);
    return;
  }
  const opening=ease.outCubic(clamp((t-openAt)/(flashAt-openAt)));
  for(const {x,y,alpha} of face.ink)p.blend(x,face.cy+(y-face.cy)*opening,ramp[5],alpha*.32*opening);
  horizontalRay(p,shape,ramp,shape.face ? tile*(.95+.12*opening) : face.span*(1+.3*opening)+6,shape.face ? .85 : .62,ramp[5]);
  p.glow(cx,cy,30*VFX_SCALE,ramp[5],.68);
}

export function drawReadyPixels(p,shape,stage,since,ramp){
  if(!shape.edge.length)return;
  if(stage==='charge'){drawCharge(p,shape,since,ramp);return;}
  if(stage==='breath'){outline(p,shape,1,ramp);return;}
  const face=shape.face??shape,{cx,cy}=shape;
  const heat=clamp(1-since/.42),halo=clamp(1-since/.35);
  if(heat>0){
    for(const {x,y,alpha} of face.ink){
      p.blend(x,y,WHITE,alpha*clamp((heat-.45)/.4));
      p.light(x,y,ramp[6],alpha*heat*heat*.8);
    }
    p.glow(cx,cy,29*VFX_SCALE,ramp[5],.5*heat);
    p.glow(cx,cy,46*VFX_SCALE*(.55+.45*halo),ramp[5],.74*halo*halo);
    const core=clamp(1-since/.1);p.glow(cx,cy,21*VFX_SCALE*(.55+.45*core),WHITE,.7*core*core);
    if(since<.2){
      const k=1-since/.2;
      flare(p,cx,cy,18*Math.pow(k,1.5)+2,k,ramp);
    }
    const rayFade=clamp(1-since/(shape.face ? .30 : .20));
    horizontalRay(p,shape,ramp,shape.face?tile*1.07:face.span*1.3+7,rayFade);
  }
  const tail=clamp(1-since/flashTail);
  p.glow(cx,cy,22*VFX_SCALE,ramp[4],.2*tail*tail);
  // As the broad light recedes, leave the same lit contour that starts the breath.
  const settled=1-tail*tail*(3-2*tail);
  outline(p,shape,.55+.45*settled,ramp);
}

// For ONE / ONE_MINUS_SRC_ALPHA blending the shader may emit more RGB than
// the coverage alpha. A 2D canvas would discard that light at alpha zero.
export function packLightPixels(frame,bytes){
  for(let i=0;i<frame.color.length;i++){
    const color=frame.color[i],light=frame.light[i],alpha=color>>>24,k=alpha/255,j=i*4;
    bytes[j]=Math.min(255,Math.round((color&255)*k)+(light&255));
    bytes[j+1]=Math.min(255,Math.round((color>>>8&255)*k)+(light>>>8&255));
    bytes[j+2]=Math.min(255,Math.round((color>>>16&255)*k)+(light>>>16&255));
    bytes[j+3]=alpha;
  }
}
