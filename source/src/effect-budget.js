// Decorative particles only. Telegraph rings, projectiles and damage are not
// routed through this budget. Stamps avoid clearing a world-sized grid/frame.
export class ParticleBudget {
  constructor(limit=6){this.limit=limit;this.turn=1;this.stamps=new Uint32Array(128*128);this.counts=new Uint16Array(128*128);}
  next(){if(++this.turn>=0xffffffff){this.stamps.fill(0);this.turn=1;}}
  remaining(x,z){
    const col=Math.max(0,Math.min(127,Math.floor(x/4)+64)),row=Math.max(0,Math.min(127,Math.floor(z/4)+64)),key=row*128+col;
    return Math.max(0,this.limit-(this.stamps[key]===this.turn?this.counts[key]:0));
  }
  allow(x,z){
    const col=Math.max(0,Math.min(127,Math.floor(x/4)+64)),row=Math.max(0,Math.min(127,Math.floor(z/4)+64)),key=row*128+col;
    if(this.stamps[key]!==this.turn){this.stamps[key]=this.turn;this.counts[key]=0;}
    if(this.counts[key]>=this.limit)return false;this.counts[key]++;return true;
  }
}
export function accumulateDamage(vfx,target,x,y,z,value,color,critical){
  const pending=vfx.damagePending??=new Map(),key=target+'/'+color+'/'+critical;
  const entry=pending.get(key);
  if(entry){entry.value+=value;entry.x=x;entry.y=y;entry.z=z;}
  else if(pending.size<vfx.text.limit)pending.set(key,{x,y,z,value,color,critical});
}
export function flushDamage(vfx,dt){
  vfx.damageClock=(vfx.damageClock||0)+dt;
  if(vfx.damageClock<.12)return;vfx.damageClock=0;
  if(vfx.enabledText)for(const d of vfx.damagePending?.values()||[])vfx.number(d.x,d.y,d.z,d.value,d.color,d.critical);
  vfx.damagePending?.clear();
}
export function enemyShadow(run,x,z,important){
  const cell=run.performance.enemyShadowCell;
  if(important||!cell)return true;
  const key=(Math.floor(x/cell)+1024)*2048+Math.floor(z/cell)+1024;
  if(run.enemyShadowCells.has(key))return false;run.enemyShadowCells.add(key);return true;
}

// Resolution is independent of crowd load. Cap only decorative particles and
// damage labels. Ground budgets apply only to player decoration; hostile cues,
// persistent zone boundaries, projectiles and damage are not reduced.
export function applyCrowdEffects(vfx,profile,count){
  // High quality locks resolution/enemy density, not decorative workload.
  const dense=count>=360,busy=count>=180;
  const add=Math.min(profile.particles,dense?240:busy?360:Infinity);
  const normal=Math.min(profile.normalParticles,dense?120:busy?180:Infinity);
  const text=Math.min(profile.damageTexts,dense?32:busy?48:Infinity);
  vfx.add.limit=add;vfx.norm.limit=normal;vfx.text.limit=text;
  vfx.add.ownAreaLimit=Math.min(profile.particles*.2,dense?48:busy?72:Infinity);
  vfx.norm.ownAreaLimit=Math.min(profile.normalParticles*.2,dense?24:busy?36:Infinity);
  if(vfx.add.trimTo)vfx.add.trimTo(add);else vfx.add.n=Math.min(vfx.add.n,add);
  if(vfx.norm.trimTo)vfx.norm.trimTo(normal);else vfx.norm.n=Math.min(vfx.norm.n,normal);
  if(vfx.text.trimTo)vfx.text.trimTo(text);
  else if(vfx.text.items.length>text)vfx.text.items.splice(0,vfx.text.items.length-text);
  vfx.particleBudget.limit=Math.min(profile.particleCell,dense?3:busy?5:Infinity);
  const area=Math.min(profile.groundArea,dense?240:busy?400:Infinity);
  for(const pool of [vfx.ground,vfx.groundN])if(pool){pool.ownAreaLimit=area;pool.ownCountLimit=Math.min(profile.groundParticles,dense?48:busy?80:Infinity);pool.trimTo?.(pool.n);}
}
