import {WindAtlasBatch} from './wind-vortex.js';
import atlas from '../public/assets/vfx/fire-stampede.json' with {type:'json'};

// Visuals only: zones and hit tests continue to belong to ordinary move 488.
export class FireStampedeArt extends WindAtlasBatch {
  constructor(owner){
    super(owner.mesh.parent,576,'assets/vfx/fire-stampede.png',atlas.columns,atlas.rows,atlas.tile,'fire-stampede-supplement');
    this.owner=owner;this.particles=[];
  }
  emit(p,species){
    if(!this.owner.allowed()||!atlas.forms[species])return;
    if(this.particles.length>=512)this.particles.shift();
    this.particles.push({...p,species,start:this.owner.run.time});
  }
  trail(x,z,dx,dz,from,to,species){
    // Sample travelled distance, not render frames. The reference's thin fire
    // line stays continuous on long dashes and at both 30 and 60 simulation Hz.
    const first=Math.floor(from/.17)+1,last=Math.floor(to/.17);
    for(let i=first;i<=last;i++){
      const side=Math.sin(i*2.399)*.16,distance=i*.17;
      const px=x+dx*distance-dz*side,pz=z+dz*distance+dx*side;
      this.emit({x:px,y:this.owner.run.terrain.surface(px,pz)+.42,z:pz,
        vx:-dx*1.1,vy:.9+(i%4)*.28,vz:-dz*1.1,life:.38+(i%3)*.025,
        size:.95+(i%4)*.12,endSize:.30,drag:2,trail:true,pose:i*7%16},species);
    }
  }
  update(){
    this.clear();
    if(!this.owner.allowed()){this.particles.length=0;return;}
    const {run,vfx}=this.owner,opacity=vfx.opacity*vfx.ownOpacity*(vfx.calm?.8:1);
    for(let i=this.particles.length-1;i>=0;i--){
      const p=this.particles[i],age=Math.max(0,run.time-p.start);
      if(age>=p.life){this.particles.splice(i,1);continue;}
      const t=age/p.life,travel=p.drag?(1-Math.exp(-p.drag*age))/p.drag:age;
      const size=p.size+(p.endSize-p.size)*t;
      const clip=atlas.forms[p.species],frame=p.trail?clip.first+(p.pose+Math.floor(age*clip.fps))%16:clip.particle;
      this.push(p.x+p.vx*travel,p.y+p.vy*travel,p.z+p.vz*travel,size*1.05,
        frame,opacity*Math.min(1,(1-t)*4));
    }
    for(const zone of run.zones.list){
      const clip=zone.stampedeFire&&atlas.forms[zone.stampedeSpecies];
      if(!clip||zone.life<=0)continue;
      const age=Math.max(0,run.time-zone.stampedeStart);
      const frame=zone.life>.2?Math.floor(age*clip.fps)%(clip.count-4):Math.min(clip.count-1,clip.count-4+Math.floor((.2-zone.life)*clip.fps));
      this.push(zone.x,run.terrain.surface(zone.x,zone.z)+.12,zone.z,zone.r*1.75,
        clip.first+frame,opacity*Math.min(1,zone.life/.25),.20);
    }
    this.end();
  }
  reset(){this.particles.length=0;this.clear();}
}
