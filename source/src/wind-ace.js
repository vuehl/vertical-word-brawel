import atlas from '../public/assets/vfx/wind-ace.json' with {type:'json'};
import {WindAtlasBatch} from './wind-vortex.js';
import {windFrameAt} from './wind-frame-time.js';

const path=atlas.pathFrames;
const referenceMs=path[path.length-1][0];
export function createWindAceCast(run,aim,speed,maxLife){
  const {player,enemies}=run,{x,y,z}=player.pos,target=aim.target;
  const locked=enemies.isAlive(target);
  const tx=locked?enemies.x[target]:x+aim.x*7,tz=locked?enemies.z[target]:z+aim.z*7;
  const ty=locked?enemies.y[target]+enemies.hgt[target]*.5:y+.9;
  const range=Math.hypot(tx-x,tz-z);
  return {x,y:y+.9,z,tx,ty,tz,target,generation:locked?enemies.gen[target]:-1,
    duration:Math.min(maxLife,Math.max(.52,Math.min(1.6,.5+range/15))*15/Math.max(1,speed)),
    impacts:new Set(),turned:false};
}

export function advanceWindAce(pool,id,flight,dt){
  const {cast,side,bend}=flight,{player,enemies}=pool.run;
  const ms=(1-pool.life[id]/pool.maxLife[id])*referenceMs;
  let i=flight.index;
  while(i<path.length-2 && ms>=path[i+1][0])i++;
  flight.index=i;
  const a=path[i],b=path[i+1],frac=Math.min(1,(ms-a[0])/(b[0]-a[0]));
  const col=1+side*2,along=a[col]+(b[col]-a[col])*frac;
  const across=(a[col+1]+(b[col+1]-a[col+1])*frac)*bend;
  // Once the blades have crossed, the return starts from that point even
  // if the target dies or its enemy slot is subsequently reused.
  if(ms>=path[23-5][0])cast.turned=true;
  if(!cast.turned && enemies.isAlive(cast.target) && enemies.gen[cast.target]===cast.generation){
    cast.tx=enemies.x[cast.target];cast.ty=enemies.y[cast.target]+enemies.hgt[cast.target]*.5;cast.tz=enemies.z[cast.target];
  }
  const follow=Math.min(1,Math.max(0,(ms-path[23-5][0])/(referenceMs-path[23-5][0])));
  const ox=cast.x+(player.pos.x-cast.x)*follow,oz=cast.z+(player.pos.z-cast.z)*follow;
  const oy=cast.y+(player.pos.y+.9-cast.y)*follow;
  const dx=cast.tx-ox,dz=cast.tz-oz;
  const x=ox+dx*along-dz*across,z=oz+dz*along+dx*across,y=oy+(cast.ty-oy)*Math.max(0,Math.min(1,along));
  // The ordinary projectile step integrates these velocities and handles cover.
  pool.vx[id]=(x-pool.x[id])/dt;pool.vz[id]=(z-pool.z[id])/dt;pool.vy[id]=(y-pool.y[id])/dt;
}

export class WindAceArt extends WindAtlasBatch {
  constructor(owner){
    super(owner.mesh.parent,112,'assets/vfx/wind-ace.png',atlas.columns,atlas.rows,atlas.tile,'wind-aerial-ace');
    this.owner=owner;this.events=[];
  }
  play(clip,x,y,z,size){
    if(!this.owner.allowed())return;
    if(this.events.length>=72)this.events.shift();
    this.events.push({clip:atlas[clip],x,y,z,size,start:this.owner.run.time,index:0});
  }
  begin(){
    this.clear();
    if(!this.owner.allowed()){this.reset();return;}
    const {run,vfx}=this.owner;
    this.opacity=vfx.opacity*vfx.ownOpacity*(vfx.calm?.8:1);
    for(let i=this.events.length-1;i>=0;i--){
      const e=this.events[i],age=run.time-e.start;
      if(age*1000+1e-5>=e.clip.times.at(-1)){this.events.splice(i,1);continue;}
      e.index=windFrameAt(e.clip,age);
      if(e.index<0)continue;
      this.push(e.x,e.y,e.z,e.size,e.clip.first+e.index,this.opacity);
    }
  }
  blade(pool,id,size){
    const flight=pool.aceFlights.get(id);
    if(!flight||flight.index<1)return;
    const page=flight.index+5,shots=atlas.flightShots;
    const pick=page<=18?page-6:page<27?12:page<36?13:Math.min(shots.length-1,13+page-36);
    const fade=Math.min(1,pool.life[id]/pool.maxLife[id]*20);
    this.push(pool.x[id],pool.y[id],pool.z[id],size*6.05,flight.side*shots.length+pick,this.opacity*fade,
      1-24/atlas.tile,pool.vx[id],pool.vz[id]);
  }
  reset(){this.events.length=0;this.clear();}
}

export function windAceImpact(run,cast,enemy){
  const e=run.enemies,key=enemy*65536+e.gen[enemy];
  if(cast.impacts.has(key))return;
  cast.impacts.add(key);
  // The recorded splash is on the ground just in front of the struck glyph.
  const dx=cast.x-e.x[enemy],dz=cast.z-e.z[enemy];
  const inset=Math.min(.20,.78/Math.max(.01,Math.hypot(dx,dz)));
  const x=e.x[enemy]+dx*inset,z=e.z[enemy]+dz*inset;
  run.vfx.crafted.windAceArt().play('hit',x,run.terrain.surface(x,z)+.18,z,4.7);
}
