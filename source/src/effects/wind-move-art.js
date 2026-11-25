import {WindAtlasBatch} from './wind-vortex.js';
import {starterForSpecies} from '../data/starter-characters.js';
import {installWindSkillArt} from './wind-skill-art.js';
import {installWindReplacements} from './wind-replacements.js';
import atlas from '../../../resources/public/assets/vfx/wind-moves.json' with {type:'json'};
import {windFrameAt} from './wind-frame-time.js';

const moveKeys=new Set(['quick-attack','air-slash','wing-attack','tackle']);
export function windMoveEffect(key,species) {
  if(starterForSpecies(species).id!==16)return;
  if(key==='wind-ring-wave')return 'wind-gust';
  if(key==='aerial-ace')return 'wind-feather-dance';
  if(moveKeys.has(key))return 'wind-'+key;
}

function dash(run,x,y,z,dx,dz,length) {
  if(!run.vfx.crafted.allowed())return;
  run.vfx.crafted.windSkillArt().play('quickHalo',x,y+.75,z,4.9);
  const p=run.player,ghostCount=p.speciesId===16?3:5;
  for(let step=1;step<=ghostCount;step++){
    const t=step/ghostCount,xx=x+dx*length*t,zz=z+dz*length*t;
    run.ghosts.push({dashGlyph:true,species:p.speciesId,scale:p.renderScale,x:xx,y:run.terrain.surface(xx,zz),z:zz,
      dir:run.sprites.dirRow(dx,dz),start:run.time,life:.52-.06*t});
  }
  const endY=run.terrain.surface(x+dx*length,z+dz*length);
  for(const side of [-.075,.075]){
    run.vfx.beams.spawn(x-dz*side,y+.75,z+dx*side,
      x+dx*length-dz*side,endY+.75,z+dz*length+dx*side,.065,0xffedc7,.15,.68);
  }
}

export class WindMoveArt extends WindAtlasBatch {
  constructor(owner) {
    super(owner.mesh.parent,96,'assets/vfx/wind-moves.png',atlas.columns,atlas.rows,atlas.tile,'wind-move-frames');
    this.owner=owner;
    this.hits=[];
  }
  begin() {
    this.clear();
    if(!this.owner.allowed()){this.hits.length=0;return;}
    const {vfx,run}=this.owner;
    this.opacity=vfx.opacity*vfx.ownOpacity*(vfx.calm?.8:1);
    for(let i=this.hits.length-1;i>=0;i--){
      const hit=this.hits[i], frame=windFrameAt(atlas.hit,run.time-hit.start);
      if(frame<0)this.hits.splice(i,1);
      else this.push(hit.x,hit.y,hit.z,8.25,atlas.hit.first+frame,this.opacity);
    }
  }
  hit(run,target) {
    if(!this.owner.allowed() || target==null)return;
    const enemies=run.enemies;
    if(this.hits.length>=32)this.hits.shift();
    this.hits.push({x:enemies.x[target],y:enemies.y[target]+enemies.hgt[target]*.5,z:enemies.z[target],start:run.time});
  }
  airSlash(pool,id,size) {
    const progress=1-pool.life[id]/pool.maxLife[id];
    const clip=atlas.airSlash, frame=windFrameAt(clip,progress*clip.times.at(-1)/1000);
    if(frame>=0)this.push(pool.x[id],pool.y[id],pool.z[id],size*5.9,clip.first+frame,
      this.opacity,.5,pool.vx[id],pool.vz[id]);
  }
  reset(){this.hits.length=0;this.clear();}
}

export function installWindMoveArt(registry) {
  const art=run=>run.vfx.crafted.windMoveArt();
  registry['wind-quick-attack']={...registry['quick-attack'],sourceKey:'quick-attack',
    replacesDash:true,dash};
  registry['wind-air-slash']={...registry['air-slash'],sourceKey:'air-slash',
    hit:(run,x,y,z,color,target)=>art(run).hit(run,target),
    draw:(pool,id,size)=>art(pool.run).airSlash(pool,id,size)};
  installWindSkillArt(registry);
  installWindReplacements(registry);
}
