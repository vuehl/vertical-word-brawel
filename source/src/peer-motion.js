// Snapshot times and frame deltas are in seconds. The render cursor may slow
// down to absorb jitter, but never plays received positions backwards in time.
export function acceptPeerSample(peer,sample,stage,arrival) {
  const last=peer.buf.at(-1);
  if(last && sample.ts<=last.ts)return false;
  const gap=last?sample.ts-last.ts:0;
  const discontinuity=!last || stage!==peer.stage || gap>.75 ||
    Math.hypot(sample.x-last.x,sample.z-last.z)>Math.max(8,45*gap);
  if(discontinuity){
    peer.buf.length=0;peer.cursor=undefined;peer.cadence=1/15;
    peer.x=sample.x;peer.y=sample.y;peer.z=sample.z;
    peer.off=arrival-sample.ts;peer.jit=0;peer.delay=.12;
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
  const targetDelay=Math.max(.10,Math.min(.38,peer.cadence*1.6+peer.jit*1.6));
  peer.delay+=Math.max(-.10*dt,Math.min(.45*dt,targetDelay-peer.delay));
  const target=now-peer.off-peer.delay;
  peer.cursor=Math.max(peer.cursor??buf[0].ts,target);
  let end=buf.length-1;
  while(end>1&&buf[end-1].ts>peer.cursor)end--;
  const a=buf[Math.max(0,end-1)],b=buf[end],span=b.ts-a.ts;
  // Extrapolate briefly for a missing packet, then hold instead of running
  // ahead through a wall and snapping back when the next packet arrives.
  const t=span>0?Math.max(0,Math.min(1+.065/span,(peer.cursor-a.ts)/span)):1;
  const blend=buf.length===1||dt>.18?1:1-Math.exp(-Math.max(0,dt)/.029);
  peer.x+=(a.x+(b.x-a.x)*t-peer.x)*blend;
  peer.y+=(a.y+(b.y-a.y)*t-peer.y)*blend;
  peer.z+=(a.z+(b.z-a.z)*t-peer.z)*blend;
  const angle=b.face/256*Math.PI*2;
  peer.fx=Math.cos(angle);peer.fz=Math.sin(angle);
}

