import {WindAtlasBatch} from './wind-vortex.js';
import {starterForSpecies} from './starter-characters.js';
import {installWindSkillArt} from './wind-skill-art.js';

const moveKeys=new Set(['quick-attack','aerial-ace','twister','wing-attack','tackle']);
export function windMoveEffect(key,species) {
  if(moveKeys.has(key) && starterForSpecies(species).id===16) return 'wind-'+key;
}

export class WindMoveArt extends WindAtlasBatch {
  constructor(owner) {
    super(owner.mesh.parent,96,'assets/vfx/wind-moves.png',8,5,192,'wind-move-frames');
    this.owner=owner;
    this.events=[];
  }
  play(first,count,fps,x,y,z,size,alpha=1) {
    if(!this.owner.allowed() || !this.loaded) return;
    if(this.events.length>=64)this.events.shift();
    this.events.push({first,count,fps,x,y,z,size,alpha,start:this.owner.run.time});
  }
  begin() {
    super.clear();
    const owner=this.owner;
    this.opacity=owner.vfx.opacity*owner.vfx.ownOpacity*(owner.vfx.calm?.8:1);
    for(let i=this.events.length-1;i>=0;i--){
      const e=this.events[i],frame=(owner.run.time-e.start)*e.fps;
      if(frame>=e.count || !owner.allowed()){
        this.events.splice(i,1);
        continue;
      }
      if(owner.vfx.view && !owner.vfx.view.visible(e.x,e.y,e.z,e.size))continue;
      const fade=1-frame/e.count;
      this.push(e.x,e.y,e.z,e.size,e.first+Math.floor(frame),this.opacity*e.alpha*fade);
    }
  }
  dash(run,x,y,z,dx,dz,length) {
    if(!this.owner.allowed())return;
    this.play(35,4,20,x,y+.75,z,6.5);
    for(let step=1;step<=5;step++){
      const t=step/5,xx=x+dx*length*t,zz=z+dz*length*t;
      this.play(30,1,2.8+t*2,xx,run.terrain.surface(xx,zz)+.9,zz,5.8,1.05-.65*t);
    }
    const endY=run.terrain.surface(x+dx*length,z+dz*length);
    for(const side of [-.075,.075]){
      run.vfx.beams.spawn(x-dz*side,y+.75,z+dx*side,
        x+dx*length-dz*side,endY+.75,z+dz*length+dx*side,.065,0xffedc7,.15,.68);
    }
  }
  projectile(pool,id,size,twister) {
    const age=pool.maxLife[id]-pool.life[id],x=pool.x[id],z=pool.z[id];
    const alpha=this.opacity*Math.min(1,pool.life[id]*8);
    if(twister){
      this.push(x,pool.run.terrain.height(x,z)+.1,z,Math.max(4,size*2.7),Math.floor(age*20)%12,alpha,.085);
    }else{
      // Reverse the pose sequence smoothly during longer flights.
      const step=Math.floor(age*40)%18;
      this.push(x,pool.y[id],z,7.5*size,12+Math.min(step,18-step),alpha,.5,pool.vx[id],pool.vz[id]);
    }
  }
  reset() {this.events.length=0;this.clear();}
}

export function installWindMoveArt(registry) {
  const art=run=>run.vfx.crafted.windMoveArt();
  registry['wind-quick-attack']={...registry['quick-attack'],sourceKey:'quick-attack',
    replacesDash:true,dash:(run,...args)=>art(run).dash(run,...args)};
  registry['wind-aerial-ace']={...registry['aerial-ace'],sourceKey:'aerial-ace',
    trail(){},cast:(run,x,y,z)=>art(run).play(31,4,30,x,y,z,5.6),
    draw:(pool,id,size)=>art(pool.run).projectile(pool,id,size,false),
    hit:(run,x,y,z)=>art(run).play(22,8,28,x,y,z,6.5),hitCover:true};
  registry['wind-twister']={...registry.twister,sourceKey:'twister',
    trail(){},hit(){},draw:(pool,id,size)=>art(pool.run).projectile(pool,id,size,true),
    boom:(run,x,y,z)=>art(run).play(4,8,24,x,run.terrain.height(x,z)+2.7,z,6.3)};
  installWindSkillArt(registry);
}
