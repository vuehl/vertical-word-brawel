// Snapshot times and frame deltas are in seconds. The render cursor may slow
// down to absorb jitter, but never plays received positions backwards in time.
import {gameStick} from '../virtual-stick/stick-config.js';

export function acceptPeerSample(peer,sample,stage,arrival) {
  const last=peer.buf.at(-1);
  if(last && sample.ts<=last.ts)return false;
  const gap=last?sample.ts-last.ts:0;
  const discontinuity=!last || stage!==peer.stage ||
    Math.hypot(sample.x-last.x,sample.z-last.z)>Math.max(8,45*gap);
  if(discontinuity){
    peer.buf.length=0;peer.cursor=undefined;peer.cadence=1/15;
    peer.x=sample.x;peer.y=sample.y;peer.z=sample.z;
    peer.off=arrival-sample.ts;peer.jit=0;peer.delay=gameStick.interpBufferMs/1000;
  }else{
    peer.cadence+=.16*(gap-peer.cadence);
    // Slow drift tracks independent device clocks without following one late packet.
    peer.off=Math.min(arrival-sample.ts,peer.off+.001*gap);
    const excess=Math.max(0,arrival-sample.ts-peer.off);
    const gain = excess > peer.jit ? 0.45 : 0.025;
    peer.jit += (excess - peer.jit) * gain;
  }
  peer.buf.push(sample);
  if(peer.buf.length>18)peer.buf.shift();
  return true;
}
export function advancePeerMotion(peer,now,dt){
  const buf=peer.buf;
  if(!buf.length)return;
  const targetDelay=Math.min(gameStick.maxBufferMs/1000,Math.max(gameStick.interpBufferMs/1000,peer.cadence)+peer.jit*1.6);
  peer.delay+=Math.max(-.10*dt,Math.min(.45*dt,targetDelay-peer.delay));
  const target=now-peer.off-peer.delay;
  peer.cursor=Math.max(peer.cursor??buf[0].ts,target);
  let end=buf.length-1;
  while(end>1&&buf[end-1].ts>peer.cursor)end--;
  const a=buf[Math.max(0,end-1)],b=buf[end],span=b.ts-a.ts;
  // Extrapolate briefly for a missing packet, then hold instead of running
  // ahead through a wall and snapping back when the next packet arrives.
  const t=span>0?Math.max(0,Math.min(1+.065/span,(peer.cursor-a.ts)/span)):1;
  let blend=buf.length===1?1:1-Math.exp(-Math.min(.05,Math.max(0,dt))/.029);
  let x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
  if (peer.stickFrames && span>0 && span<.3) {
    const speed=Math.min(gameStick.maxSpeed,Math.hypot(b.x-a.x,b.z-a.z)/span);
    const part=peer.inputPart??={}, full=peer.inputFull??={};
    if (peer.stickFrames.displacement(a.ts,a.ts+t*span,speed,part) &&
        peer.stickFrames.displacement(a.ts,b.ts,speed,full)) {
      // Keep both authoritative endpoints exact. Between them the filtered
      // input frames supply the turn; after the endpoint only predict briefly.
      x=a.x+part.x+(b.x-a.x-full.x)*Math.min(t,1);
      z=a.z+part.z+(b.z-a.z-full.z)*Math.min(t,1);
    }
  }
  const distance=Math.hypot(x-peer.x,z-peer.z);
  if (distance*blend>gameStick.maxFrameDistance) blend=gameStick.maxFrameDistance/distance;
  peer.x+=(x-peer.x)*blend;
  peer.y+=(a.y+(b.y-a.y)*t-peer.y)*blend;
  peer.z+=(z-peer.z)*blend;
  const angle=b.face/256*Math.PI*2;
  peer.fx=Math.cos(angle);peer.fz=Math.sin(angle);
}

