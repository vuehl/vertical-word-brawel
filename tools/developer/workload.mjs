// DEV ONLY. Controlled load presets, not a replay or an estimate of natural
// progression. All attacks use the game's real move/ultimate implementation.
const PRESETS=[
  {at:0,level:1,skills:1,rank:1,loot:0,items:0},
  {at:120,level:8,skills:3,rank:3,loot:35,items:1},
  {at:180,level:12,skills:3,rank:4,loot:55,items:2},
  {at:300,level:20,skills:4,rank:5,loot:85,items:3},
  {at:480,level:32,skills:4,rank:7,loot:130,items:4},
  {at:600,level:40,skills:4,rank:8,loot:170,items:5},
];
export function workloadPreset(seconds,mode){
  if(mode==='none')return null;
  if(mode==='stress')return {at:seconds,level:40,skills:4,rank:8,loot:220,items:5};
  let preset=PRESETS[0];for(const candidate of PRESETS)if(candidate.at<=seconds)preset=candidate;
  return {...preset};
}

export function createWorkload(run,moveId){
  let saved=null,mode='none',preset=null,elapsed=0,refill=0,ultimate=0,serial=0;
  const p=run.player;
  function stop(){
    mode='none';preset=null;
    if(!saved)return;
    // Restore the pre-test build and callbacks. Short-lived effects already
    // scheduled by a real ultimate may finish normally after stopping.
    Object.assign(p,saved.player);run.pendingLevels=saved.pendingLevels;
    p.recompute();p.hp=Math.min(saved.player.hp,p.maxHp);
    run.ui.developerSyncExperience();run.ui.hud(run);
    saved=null;
  }
  function fillLoot(budget){
    if(!preset)return;
    const count=Math.min(budget,Math.max(0,preset.loot-run.pickups.count));
    // Bounded attempts and the normal merge path prevent unbounded piles.
    for(let i=0;i<count;i++){
      const index=serial++,a=index*2.3999632297,r=3+Math.sqrt((index%97)/96)*10;
      const x=p.pos.x+Math.cos(a)*r,z=p.pos.z+Math.sin(a)*r;
      if(!run.terrain.inBounds(x,z,1)||run.terrain.hitProp(x,.6,z,.25))continue;
      const y=run.terrain.height(x,z);
      run.pickups.spawnMerged(index%4===0?1:0,x,y,z,1);
    }
  }
  function apply(nextMode,seconds){
    const next=workloadPreset(seconds,nextMode);
    if(!next){stop();return;}
    // Resolve before mutation so a renamed/missing move cannot leave half a build.
    const keys=['razor-leaf','fire-spin','thunderbolt','petal-dance'].slice(0,next.skills);
    const ids=keys.map(key=>{const id=moveId(key);if(id===undefined)throw Error('Missing developer move: '+key);return id;});
    if(!saved){
      saved={player:Object.fromEntries(['moves','moveSlots','vitamins','items','level','xp','xpNext','hp','addXp','gainLevel'].map(k=>[k,p[k]])),pendingLevels:run.pendingLevels};
    }
    // Every application starts clean; rewinding does not stack old upgrades/loot.
    run.projectiles.clear();run.zones.clear();run.vfx.clear();run.pickups.clear();
    mode=nextMode;preset=next;elapsed=refill=ultimate=serial=0;
    p.moves=[null,null,null,null];p.moveSlots=4;p.vitamins=new Map();
    p.items=new Map(next.items?[['leftovers',Math.min(3,next.items)],['muscle-band',Math.min(3,next.items)]]:[]);
    p.level=next.level;p.xpNext=p.xpFor(p.level);
    // Boss candy bypasses addXp; freeze both upgrade routes in a fixed build.
    // Existing XP is preserved and restored with the original build.
    p.addXp=()=>{};p.gainLevel=()=>{};run.pendingLevels=0;
    for(const id of ids){
      if(!p.addMove(id))throw Error('Developer move could not be equipped: '+id);
      const m=p.moves.find(m=>m?.def.id===id),n=next.rank-1;
      m.level=next.rank;m.timer=.1;
      Object.assign(m.mods,{dmg:1+.08*n,cd:Math.pow(.92,n),count:Math.floor(n/2),area:1+.08*n,dur:1+.06*n});
    }
    p.recompute();p.hp=p.maxHp;
    run.ui.developerSyncExperience();run.ui.hud(run);
    fillLoot(next.loot);
  }
  function update(dt){
    if(!preset||run.state!=='play'||!Number.isFinite(dt)||dt<=0)return;
    elapsed+=dt;refill-=dt;ultimate-=dt;
    if(refill<=0){refill=1;fillLoot(mode==='stress'?40:12);}
    // Normal attacks run in run.update. Stress shortens cooldowns within a
    // bounded four-slot build; no extra render loop or uncapped particle spam.
    if(mode==='stress')for(const m of p.moves)if(m)m.timer=Math.min(m.timer,.35);
    if((mode==='stress'||preset.at>=120)&&ultimate<=0&&run.ult.active<=0&&!run.ult.castPending){
      run.ult.charge=1;run.ult.fire();ultimate=mode==='stress'?8:25;
    }
  }
  return {apply,update,stop,snapshot:()=>({mode,elapsed,preset:preset&&{...preset},
    level:p.level,moves:p.moves.filter(Boolean).map(m=>({key:m.def.key,level:m.level,damage:m.damageDone}))})};
}
