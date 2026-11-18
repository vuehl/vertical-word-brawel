import {heroActionCatalog} from './hero-action-catalog.js';

const clipsBySpecies=new Map();
for(const [id,{columns,rows,scale,clips}] of Object.entries(heroActionCatalog)){
  const species=Number(id);
  const actions=Object.fromEntries(Object.entries(clips).map(([action,{first,count,fps,loop}])=>{
    const frames=Array.from({length:count},(_,index)=>{
      const tile=first+index,x=tile%columns,y=Math.floor(tile/columns);
      return {species,action,index,renderScale:scale,
        rect:new Float32Array([x/columns,1-(y+1)/rows,(x+1)/columns,1-y/rows])};
    });
    return [action,{frames,frameMs:1000/fps,loop}];
  }));
  clipsBySpecies.set(species,actions);
}

export function playerHeroAction(player){
  if(player.dead)return 'faint';
  if(!player.grounded||player.gliding||player.swimNow||player.slideT>0||player.hurtT>0||
    (player.heroPose??player.firePose))return;
  return player.speedNow>.6?'walk':'idle';
}

export function heroActionFrame(actor,species,action,nowMs){
  const clip=clipsBySpecies.get(species)?.[action];
  if(!clip){actor.heroPlayback=undefined;return;}
  let playback=actor.heroPlayback;
  if(playback?.clip!==clip){
    playback=actor.heroPlayback={clip,elapsed:0,last:nowMs};
  }else{
    // A long render gap can extend a pose. Advance by at most one authored frame.
    playback.elapsed+=Math.min(clip.frameMs,Math.max(0,nowMs-playback.last));
    playback.last=nowMs;
  }
  const {frames,frameMs,loop}=clip;
  const index=Math.floor(playback.elapsed/frameMs+1e-8);
  return frames[loop?index%frames.length:Math.min(index,frames.length-1)];
}
