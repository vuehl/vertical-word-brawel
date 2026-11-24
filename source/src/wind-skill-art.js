import {WindAtlasBatch} from './wind-vortex.js';
import atlas from '../public/assets/vfx/wind-skills.json' with {type:'json'};
import {windFrameAt} from './wind-frame-time.js';

export class WindSkillArt extends WindAtlasBatch {
  constructor(owner){
    super(owner.mesh.parent,128,'assets/vfx/wind-skills.png',atlas.columns,atlas.rows,atlas.tile,'wind-skill-frames');
    this.owner=owner;this.events=[];this.tracked=new Map();
  }
  play(clip,x,y,z,size,dx=0,dz=0){
    if(!this.owner.allowed())return;
    if(this.events.length>=64)this.events.shift();
    this.events.push({clip,x,y,z,size,dx,dz,start:this.owner.run.time});
  }
  track(key,clip,x,y,z,size){
    if(!this.owner.allowed())return;
    const now=this.owner.run.time,old=this.tracked.get(key);
    if(!old&&this.tracked.size>=32)return;
    this.tracked.set(key,{clip,x,y,z,size,start:old?.start??now,touched:now});
  }
  featherRing(x,y,z,radius){
    this.play('turningFeather',x,y,z,radius);
  }
  drawPose(e,age,loop=false){
    if(e.clip==='turningFeather'){
      if(age>=1.05)return false;
      const progress=Math.max(0,age/1.05),radius=e.size*(.22+.78*progress);
      const alpha=this.owner.vfx.opacity*this.owner.vfx.ownOpacity*(1-progress)*(this.owner.vfx.calm?.8:1);
      for(let i=0;i<32;i++){
        const angle=i*Math.PI/16+age*.6,x=e.x+Math.cos(angle)*radius,z=e.z+Math.sin(angle)*radius;
        this.push(x,this.owner.run.terrain.surface(x,z)+.65,z,1.15,atlas.clips.turningFeather.first,alpha,.5,Math.cos(angle+.6),Math.sin(angle+.6));
      }
      return true;
    }
    const c=atlas.clips[e.clip],frame=windFrameAt(c,age,loop);
    if(frame<0)return false;
    const opacity=this.owner.vfx.opacity*this.owner.vfx.ownOpacity*(this.owner.vfx.calm?.8:1);
    if(!this.owner.vfx.view||this.owner.vfx.view.visible(e.x,e.y,e.z,e.size))
      this.push(e.x,e.y,e.z,e.size,c.first+frame,opacity,c.pivot,e.dx||0,e.dz||0);
    return true;
  }
  begin(){
    this.clear();
    if(!this.owner.allowed()){this.reset();return;}
    const now=this.owner.run.time;
    for(let i=this.events.length-1;i>=0;i--)if(!this.drawPose(this.events[i],now-this.events[i].start))this.events.splice(i,1);
    for(const [key,e] of this.tracked){if(now-e.touched>.16)this.tracked.delete(key);else this.drawPose(e,now-e.start,true);}
  }
  wingProjectile(pool,id,size,clip='wing'){
    if(!this.owner.allowed())return;
    this.drawPose({clip,x:pool.x[id],y:pool.y[id],z:pool.z[id],size:size*3.2,
      dx:pool.vx[id],dz:pool.vz[id]},pool.maxLife[id]-pool.life[id],true);
  }
  reset(){this.events.length=0;this.tracked.clear();this.clear();}
}

export function installWindSkillArt(registry){
  const art=run=>run.vfx.crafted.windSkillArt();
  registry['wind-wing-attack']={...registry['wing-attack'],sourceKey:'wing-attack',trail(){},cast:(run,x,y,z)=>art(run).play('wingLaunch',x,y,z,4.25),
    draw:(pool,id,size)=>art(pool.run).wingProjectile(pool,id,size),
    hit:(run,x,y,z)=>art(run).play('wingHit',x,y,z,3.8),hitCover:true,boom(){}};
  registry['wind-fusion-feather']={...registry['wind-wing-attack'],
    draw:(pool,id,size)=>art(pool.run).wingProjectile(pool,id,size*.36,'fusionFeather')};
  registry['wind-tackle']={...registry.tackle,sourceKey:'tackle',replacesDash:true,
    dash(run,x,y,z,dx,dz,length){
      art(run).play('tackleRush',x,y+1.3,z,length*.90,dx,dz);
    }};
}
