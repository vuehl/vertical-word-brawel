import {WindAtlasBatch} from './wind-vortex.js';
import {starterForSpecies} from '../data/starter-characters.js';
import {installWindSkillArt} from './wind-skill-art.js';
import atlas from '../../../resources/public/assets/vfx/wind-moves.json' with {type:'json'};
import {windFrameAt} from './wind-frame-time.js';

const moveKeys=new Set(['quick-attack','aerial-ace','twister','wing-attack','tackle']);
export function windMoveEffect(key,species) {
  if(moveKeys.has(key) && starterForSpecies(species).id===16) return 'wind-'+key;
}

export class WindMoveArt extends WindAtlasBatch {
  constructor(owner) {
    super(owner.mesh.parent,96,'assets/vfx/wind-moves.png',atlas.columns,atlas.rows,atlas.tile,'wind-move-frames');
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
    this.owner.windSkillArt().play('quickHalo',x,y+.75,z,4.9);
    this.owner.windSkillArt().play('quickSpark',x+dx*.18,y+1.28,z+dz*.18,2.65);
    for(let step=1;step<=5;step++){
      const t=step/5,xx=x+dx*length*t,zz=z+dz*length*t;
      if(run.player.speciesId===16){
        this.play(atlas.dashGhost,1,1/(.52-.06*t),xx,run.terrain.surface(xx,zz)+.9,zz,5.8,1.05-.65*t);
      }else{
        const p=run.player;
        run.ghosts.push({dashGlyph:true,species:p.speciesId,scale:p.renderScale,x:xx,y:run.terrain.surface(xx,zz),z:zz,
          dir:run.sprites.dirRow(dx,dz),start:run.time,life:.52-.06*t});
      }
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
  reset() {this.events.length=0;this.clear();}
}

export function installWindMoveArt(registry) {
  const art=run=>run.vfx.crafted.windMoveArt();
  registry['wind-quick-attack']={...registry['quick-attack'],sourceKey:'quick-attack',
    replacesDash:true,dash:(run,...args)=>art(run).dash(run,...args)};
  registry['wind-aerial-ace']={...registry['aerial-ace'],sourceKey:'aerial-ace',
    trail(){},cast:(run,x,y,z)=>run.vfx.crafted.windAceArt().play('launch',x,y,z,4.25),
    draw:(pool,id,size)=>pool.run.vfx.crafted.windAceArt().blade(pool,id,size),
    hit:(run,x,y,z)=>run.vfx.crafted.windAceArt().play('hit',x,y,z,4.7),hitCover:true};
  registry['wind-twister']={...registry.twister,sourceKey:'twister',
    trail(){},hit(){},draw:(pool,id,size)=>art(pool.run).twister(pool,id,size),
    boom(){}};
  installWindSkillArt(registry);
}
