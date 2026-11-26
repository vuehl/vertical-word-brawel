import atlas from '../../../resources/public/assets/vfx/wind-replacements.json' with {type:'json'};
import {windFrameAt} from './wind-frame-time.js';
import {WindAtlasBatch} from './wind-vortex.js';

const {clips}=atlas;
// A 144 px cell spans 9.3 world units in the reference gameplay framing,
// including the scale applied by WindAtlasBatch.
const featherCellSize=6.2;

export class WindReplacements extends WindAtlasBatch {
  constructor(owner){
    super(owner.mesh.parent,96,'assets/vfx/wind-replacements.png',atlas.columns,atlas.rows,atlas.tile,'wind-gust-and-feathers');
    this.owner=owner;
    this.events=[];
  }
  play(clip,x,y,z,size){
    if(!this.owner.allowed())return;
    const {time}=this.owner.run;
    const sequence=clips[clip];
    if(clip==='hit'&&this.events.some(e=>e.clip===sequence&&time-e.start<.10&&Math.hypot(e.x-x,e.z-z)<1.2))return;
    if(this.events.length>=64)this.events.shift();
    this.events.push({clip:sequence,x,y,z,size,start:time});
  }
  begin(){
    this.clear();
    if(!this.owner.allowed()){this.reset();return;}
    const {run,vfx}=this.owner;
    this.opacity=vfx.opacity*vfx.ownOpacity*(vfx.calm?.8:1);
    for(let i=this.events.length-1;i>=0;i--){
      const event=this.events[i];
      const frame=windFrameAt(event.clip,run.time-event.start);
      if(frame<0){this.events.splice(i,1);continue;}
      this.push(event.x,event.y,event.z,event.size,event.clip.first+frame,this.opacity);
    }
  }
  gust(pool,id,size){
    const {x,z}=pool;
    const progress=1-pool.life[id]/pool.maxLife[id];
    const frame=windFrameAt(clips.gust,progress*clips.gust.times.at(-1)/1000);
    const floor=pool.run.terrain.surface(x[id],z[id]);
    if(frame>=0)this.push(x[id],floor+.08,z[id],size*2.6,clips.gust.first+frame,this.opacity,14/atlas.tile);
  }
  feather(pool,id){
    const pose=windFrameAt(clips.flight,pool.maxLife[id]-pool.life[id]);
    const frame=pose<0?clips.flight.count-1:pose;
    this.push(pool.x[id],pool.y[id],pool.z[id],featherCellSize,clips.flight.first+frame,this.opacity,.5-14/atlas.tile,pool.vx[id],pool.vz[id]);
  }
  reset(){this.events.length=0;this.clear();}
}

export function installWindReplacements(registry){
  const art=run=>run.vfx.crafted.windReplacementArt();
  registry['wind-gust']={...registry.gust,sourceKey:'gust',trail(){},hit(){},boom(){},
    draw:(pool,id,size)=>art(pool.run).gust(pool,id,size)};
  registry['wind-feather-dance']={...registry['feather-dance'],sourceKey:'feather-dance',trail(){},
    cast:(run,x,y,z)=>art(run).play('launch',x,y-.2,z,featherCellSize),
    draw:(pool,id)=>art(pool.run).feather(pool,id),
    hit:(run,x,y,z)=>art(run).play('hit',x,run.terrain.surface(x,z)+.28,z,featherCellSize),hitCover:true};
}
