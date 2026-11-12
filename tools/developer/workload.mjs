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
export function workloadPreset(seconds,mode,level){
  if(mode==='none')return null;
  if(mode==='stress')return {at:seconds,level:level??40,skills:4,rank:8,loot:220,items:5};
  let preset=PRESETS[0];for(const candidate of PRESETS)if(candidate.at<=seconds)preset=candidate;
  if(level!==undefined){for(const candidate of PRESETS)if(candidate.level<=level)preset=candidate;return {...preset,level};}
  return {...preset};
}

export function workloadMoves(run,preset,skills){
  const p=run.player,pool=skills.pool(run),seen=new Set();
  // The same kit, lineage and unlocked shared moves shown by the release
  // move catalogue. Prefer the current form's kit and respect level/slot gates.
  return [...pool.kit,...pool.line,...pool.shared.filter(m=>m.open),...(pool.any||[])]
    .filter(m=>{
      if(m.level>preset.level||seen.has(m.id)||run.banished.has('m'+m.id))return false;
      seen.add(m.id);return !!skills.move(m.id);
    }).slice(0,Math.min(preset.skills,p.moveSlots)).map(m=>({...m,...skills.move(m.id)}));
}

export function createWorkload(run,skills){
  let saved=null,mode='none',preset=null,elapsed=0,refill=0,ultimate=0,serial=0,evolutionQueued=false;
  const p=run.player;
  function stop(){
    mode='none';preset=null;evolutionQueued=false;
    if(!saved)return;
    // Restore the pre-test build and callbacks. Short-lived effects already
    // scheduled by a real ultimate may finish normally after stopping.
    Object.assign(p,saved.player);run.pendingLevels=saved.pendingLevels;run.nextEvo=saved.nextEvo;
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
  function apply(nextMode,seconds,level){
    const next=workloadPreset(seconds,nextMode,level);
    if(!next){stop();return;}
    // Resolve before mutation so a renamed/missing move cannot leave half a build.
    const moves=workloadMoves(run,next,skills);
    if(!moves.length)throw Error('当前形态没有已解锁的可用技能。');
    if(!saved){
      saved={player:Object.fromEntries(['moves','moveSlots','vitamins','items','level','xp','xpNext','hp','addXp','gainLevel','speciesId','data','types','roster','ability','evoStage','growth'].map(k=>[k,p[k]])),pendingLevels:run.pendingLevels,nextEvo:run.nextEvo&&{...run.nextEvo}};
    }
    // Every application starts clean; rewinding does not stack old upgrades/loot.
    run.projectiles.clear();run.zones.clear();run.vfx.clear();run.pickups.clear();
    mode=nextMode;preset=next;elapsed=refill=ultimate=serial=0;
    p.moves=[null,null,null,null];p.vitamins=new Map();
    p.items=new Map(next.items?[['leftovers',Math.min(3,next.items)],['muscle-band',Math.min(3,next.items)]]:[]);
    p.level=next.level;p.xpNext=p.xpFor(p.level);
    p.xp=Math.min(saved.player.xp,p.xpNext-1);
    p.growth=Math.max(0,p.growthStage()-p.evoStage);
    // Only the fixed stress benchmark suppresses XP and rare candy.
    p.addXp=mode==='stress'?()=>{}:saved.player.addXp;
    p.gainLevel=mode==='stress'?()=>{}:saved.player.gainLevel;
    run.pendingLevels=0;
    for(const {id} of moves){
      if(!p.addMove(id))throw Error('Developer move could not be equipped: '+id);
    }
    // Learn/upgrade within the normal number of level-up choices. Each rank
    // uses the release upgrade roll and application, with common rarity.
    let choices=Math.max(0,next.level-moves.length);
    for(let rank=2;rank<=next.rank&&choices>0;rank++)for(let slot=0;slot<p.moveSlots&&choices>0;slot++){
      const m=p.moves[slot];
      if(m&&m.level<rank&&m.level<p.capOf(m)){skills.upgrade(run,slot);choices--;}
    }
    for(const m of p.moves)if(m)m.timer=.1;
    p.recompute();p.hp=p.maxHp;
    evolutionQueued=!!run.nextEvo&&p.level>=run.nextEvo.level;
    run.ui.developerSyncExperience();run.ui.hud(run);
    fillLoot(next.loot);
  }
  function update(dt){
    if(!preset||run.state!=='play')return;
    // Jumping straight to a preset level doesn't enqueue upgrade choices.
    // Once the test panel closes, reuse the real branch choice, confirmation
    // and animation. Never pick a branch or evolve silently for the player.
    if(evolutionQueued){
      if(!run.nextEvo||p.level<run.nextEvo.level)evolutionQueued=false;
      else if(run.ult.active>0||run.ult.castPending||run.upgradeTiming.waiting(run.ult))return;
      else if(run.tryEvolve()){evolutionQueued=false;return;}
    }
    if(!Number.isFinite(dt)||dt<=0)return;
    elapsed+=dt;refill-=dt;ultimate-=dt;
    if(refill<=0){refill=1;fillLoot(mode==='stress'?40:12);}
    // Normal attacks run in run.update. Stress shortens cooldowns within a
    // bounded four-slot build; no extra render loop or uncapped particle spam.
    if(mode==='stress')for(const m of p.moves)if(m)m.timer=Math.min(m.timer,.35);
    if((mode==='stress'||preset.at>=120)&&ultimate<=0&&!run.pendingLevels&&run.ult.active<=0&&!run.ult.castPending){
      run.ult.charge=1;run.ult.fire();ultimate=mode==='stress'?8:25;
    }
  }
  function prepareUltimateTest(){
    if(mode==='stress'){
      mode='timed';preset=workloadPreset(run.stageTime,mode,p.level);
      p.addXp=saved.player.addXp;p.gainLevel=saved.player.gainLevel;
    }
    ultimate=25;
    return mode;
  }
  return {apply,update,stop,prepareUltimateTest,advanceEvolution:()=>{
    if(!run.nextEvo)return false;
    apply(mode==='none'?'timed':mode,run.stageTime,Math.max(p.level,run.nextEvo.level));return true;
  },plan:(mode,seconds)=>{
    const preset=workloadPreset(seconds,mode);return preset?workloadMoves(run,preset,skills):[];
  },snapshot:()=>({mode,elapsed,preset:preset&&{...preset},
    level:p.level,slots:p.moveSlots,evolutionQueued,moves:p.moves.filter(Boolean).map(m=>({key:m.def.key,name:m.def.name,level:m.level,mods:{...m.mods},damage:m.damageDone}))})};
}
