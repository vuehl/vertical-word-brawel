// DEV ONLY. Restore one representative encounter, never replay every past wave.
export const ENCOUNTER_MASK=2|4|4096|8192;
const TIMED=new Set(['alpha','totem','summoner']);
export function encounterAt(timeline,seconds,mode='timed'){
  if(mode==='none')return null;
  if(mode==='guardian')return {kind:'guardian',t:seconds};
  let latest=null;
  for(const event of timeline)if(TIMED.has(event.kind)&&event.t<=seconds&&(!latest||event.t>=latest.t))latest={kind:event.kind,t:event.t};
  return latest;
}
export function nextEncounter(timeline,seconds){
  let next=null;
  for(const event of timeline)if(TIMED.has(event.kind)&&event.t>seconds&&(!next||event.t<next.t))next={kind:event.kind,t:event.t};
  return next;
}
export function createEncounterTest(run,speciesName){
  let current=null,guardian=null;
  const originalCredit=run.combat.credit;
  run.combat.credit=function(index,...args){
    if(!current||index!==current.index||run.enemies.gen[index]!==current.gen)return originalCredit.call(this,index,...args);
    // Keep real drops/death effects, but controlled encounters do not research
    // families or unlock progression (some removed families lack metadata).
    const research=run.research.add;
    try{run.research.add=()=>{};return originalCredit.call(this,index,...args);}
    finally{run.research.add=research;}
  };
  const originalKilled=run.onBossKilled;
  run.onBossKilled=function(index){
    // A test guardian must not open a portal or end the stage during a sample.
    if(current?.kind==='guardian'&&run.boss===guardian&&current.index===index&&run.enemies.gen[index]===current.gen){
      run.boss.release();run.projectiles.clearHostile();return;
    }
    return originalKilled.call(this,index);
  };
  function clear(){
    const e=run.enemies,old=run.boss;
    const followers=[...old.escorts,...run.minibosses.list.flatMap(m=>m.minions)];
    for(const [index,gen] of followers)if(e.alive[index]&&e.gen[index]===gen)e.kill(index);
    old.release();old.mech?.dispose();old.mech=null;
    for(let i=0;i<e.n;i++)if(e.alive[i]&&(e.flags[i]&ENCOUNTER_MASK)&&!(e.flags[i]&(128|32768|65536)))e.kill(i);
    run.boss=new old.constructor(run);
    run.minibosses=new run.minibosses.constructor(run);
    run.bossSpawned=false;run.stageCleared=false;
    run.projectiles.clearHostile();run.zones.clear();run.vfx.clear();
    // Remove already-open exits from an earlier natural fight when rewinding.
    for(const item of [...run.interactables.list])if(item.kind==='portal')run.interactables.remove(item);
    current=null;guardian=null;
  }
  function nearby(){
    let best=null,bestScore=Infinity;
    const projected=run.player.pos.clone();
    for(let i=0;i<96;i++){
      const angle=i*2.3999632297,radius=4+Math.floor(i/24)*1.5;
      const x=run.player.pos.x+Math.cos(angle)*radius,z=run.player.pos.z+Math.sin(angle)*radius;
      const y=run.terrain.height(x,z);
      if(!run.terrain.inBounds(x,z,3)||run.terrain.hitProp(x,y+.6,z,2))continue;
      projected.set(x,y+3,z).project(run.r.camera);
      const inside=projected.z>=-1&&projected.z<=1&&Math.abs(projected.x)<.55&&Math.abs(projected.y)<.4;
      const score=(inside?0:100)+(projected.x-.2)**2+(projected.y+.15)**2;
      if(score<bestScore){bestScore=score;best={x,z};}
    }
    if(best)return best;
    throw Error('No open position for developer encounter');
  }
  function apply(mode){
    const plan=encounterAt(run.director.timeline,run.stageTime,mode);
    const point=plan?nearby():null;
    clear();
    if(!plan)return null;
    const e=run.enemies;
    if(plan.kind==='alpha'){
      const spawnPoint=run.director.spawnPoint;
      try{run.director.spawnPoint=()=>point;run.director.fire('alpha');}
      finally{run.director.spawnPoint=spawnPoint;}
    }else if(plan.kind==='guardian'){
      const intro=run.introBoss,randomPoint=run.terrain.randomPoint;
      let first=true;
      try{
        // Preserve the actual guardian selection, HP, attacks and mechanics;
        // skip only the cutscene that would unpause the developer dialog.
        run.introBoss=()=>{};
        run.terrain.randomPoint=function(...args){if(first){first=false;return point;}return randomPoint.apply(this,args);};
        run.spawnBoss(run.player.pos.x,run.player.pos.z);
        guardian=run.boss;
      }finally{run.introBoss=intro;run.terrain.randomPoint=randomPoint;}
    }else{
      const spawn=plan.kind==='totem'?'spawnTotem':'spawnSummoner';
      run.minibosses[spawn](undefined,point);
    }
    for(let i=0;i<e.n;i++)if(e.alive[i]&&(e.flags[i]&ENCOUNTER_MASK)&&!(e.flags[i]&(128|32768|65536))){
      current={kind:plan.kind,at:plan.t,index:i,gen:e.gen[i],species:e.species[i],name:speciesName(e.species[i])};break;
    }
    if(!current)throw Error('Developer encounter spawn failed');
    e.grid.build(e.n,e.x,e.z,e.alive,e.radius,e.dying);
    return snapshot();
  }
  function snapshot(){
    const e=run.enemies;
    let count=0;for(let i=0;i<e.n;i++)if(e.isAlive(i)&&(e.flags[i]&ENCOUNTER_MASK))count++;
    const alive=!!current&&e.gen[current.index]===current.gen&&e.isAlive(current.index);
    return {count,current:current?{...current,alive,hp:alive?e.hp[current.index]:0}:null};
  }
  return {apply,snapshot};
}
