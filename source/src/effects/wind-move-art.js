import {WindAtlasBatch} from './wind-vortex.js';
import {starterForSpecies} from '../data/starter-characters.js';
import {installWindSkillArt} from './wind-skill-art.js';
import {installWindReplacements} from './wind-replacements.js';
import atlas from '../../../resources/public/assets/vfx/wind-moves.json' with {type:'json'};
import {windFrameAt} from './wind-frame-time.js';

const moveKeys=new Set(['quick-attack','twister','wing-attack','tackle']);
export function windMoveEffect(key,species) {
  if(starterForSpecies(species).id!==16)return;
  if(key==='wind-ring-wave')return 'wind-gust';
  if(key==='aerial-ace')return 'wind-feather-dance';
  if(moveKeys.has(key))return 'wind-'+key;
}

export class WindMoveArt extends WindAtlasBatch {
  constructor(owner) {
    super(owner.mesh.parent,96,'assets/vfx/wind-moves.png',atlas.columns,atlas.rows,atlas.tile,'wind-move-frames');
    this.owner=owner;
  }
  begin() {
    this.clear();
    const {vfx}=this.owner;
    this.opacity=vfx.opacity*vfx.ownOpacity*(vfx.calm?.8:1);
  }
  dash(run,x,y,z,dx,dz,length) {
    if(!this.owner.allowed())return;
    this.owner.windSkillArt().play('quickHalo',x,y+.75,z,4.9);
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
  twister(pool,id,size) {
    const age=pool.maxLife[id]-pool.life[id],x=pool.x[id],z=pool.z[id];
    const clip=atlas.twister;
    const frame=windFrameAt(clip,age);
    // Startup appears once; longer upgraded projectiles loop only the fully
    // formed poses, never jumping back to the transparent opening.
    const pose=frame<0?2+Math.floor((age-clip.times.at(-1)/1000)*20)%12:frame;
    this.push(x,pool.run.terrain.height(x,z)+.1,z,Math.max(4,size*2.7),clip.first+pose,
      this.opacity*Math.min(1,pool.life[id]*8),.085);
  }
}

export function installWindMoveArt(registry) {
  const art=run=>run.vfx.crafted.windMoveArt();
  registry['wind-quick-attack']={...registry['quick-attack'],sourceKey:'quick-attack',
    replacesDash:true,dash:(run,...args)=>art(run).dash(run,...args)};
  registry['wind-twister']={...registry.twister,sourceKey:'twister',
    trail(){},hit(){},draw:(pool,id,size)=>art(pool.run).twister(pool,id,size),
    boom(){}};
  installWindSkillArt(registry);
  installWindReplacements(registry);
}
