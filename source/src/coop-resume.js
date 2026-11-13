const seatKey='ziling.coop.seat.1', progressKey='ziling.coop.progress.1';
function read(key) {
  try {return JSON.parse(localStorage.getItem(key));} catch {return null;}
}
export function savedSeat() {
  const seat=read(seatKey);
  return seat && /^\d{6}$/.test(seat.code) && typeof seat.seat==='string' ? seat : null;
}
export function rememberSeat(room) {
  localStorage.setItem(seatKey,JSON.stringify({code:room.code,seat:room.me,party:room.room.state==='started'?room.room.party:''}));
}
export function forgetSeat(id) {
  if(savedSeat()?.seat!==id)return;
  localStorage.removeItem(seatKey);
  localStorage.removeItem(progressKey);
}
export function savedProgress(room) {
  const data=read(progressKey);
  return data?.seat===room.me && data.party===room.room.party ? data : null;
}
export function saveProgress(run) {
  const {coop,player:p}=run;
  if(!p || !coop || coop.ended || run.state==='over' || run.buildingStage)return;
  const fields=(object,keys)=>Object.fromEntries(keys.map(key=>[key,object[key]]));
  const data={seat:coop.room.me,party:coop.party,stage:run.stage,
    run:fields(run,['stats','gold','keys','goldSpent','splits','pendingLevels','rerolls','skips','tempMods','curses','nextEvo']),
    player:fields(p,['speciesId','evoStage','level','xp','growth','hp','shield','overheal','revives','dead']),
    bleed:coop.bleed,out:coop.out,pos:[p.pos.x,p.pos.y,p.pos.z],
    items:[...p.items],vitamins:[...p.vitamins],
    moves:p.moves.map(m=>m && {id:m.def.id,...fields(m,['level','mods','parents','extra','damageDone'])})};
  localStorage.setItem(progressKey,JSON.stringify(data));
}
export function restoreProgress(run,data,world) {
  const p=run.player,coop=run.coop;
  if(data){
    Object.assign(run,data.run);
    if(data.player.speciesId!==p.speciesId)p.setSpecies(data.player.speciesId);
    Object.assign(p,data.player);
    p.items=new Map(data.items);p.vitamins=new Map(data.vitamins);
    p.moves.fill(null);
    for(const [i,saved] of data.moves.entries()){
      if(!saved)continue;
      const index=p.moves.findIndex(m=>!m);
      if(!p.addMove(saved.id))continue;
      const move=p.moves[index];
      p.moves[index]=null;
      p.moves[i]=move;
      const {id,...attributes}=saved;Object.assign(move,attributes);
    }
    p.recompute();p.hp=Math.min(data.player.hp,p.maxHp);p.xpNext=p.xpFor(p.level);
    if(!('nextEvo' in data.run))run.nextEvo=run.planEvolution(p.speciesId,p.level);
    if(data.stage===world.stage){
      p.pos.set(...data.pos);coop.bleed=data.bleed;coop.out=data.out;
    }else if(p.dead)coop.revive(null);
  }
  if(data?.stage!==world.stage)p.pos.set(world.x,run.terrain.height(world.x,world.z),world.z);
  run.camTarget.copy(p.pos);
  run.time=world.time;run.stageTime=world.stageTime;
  for(const event of run.director.timeline)if(event.t<=run.stageTime)event.done=true;
  if(world.portal){
    run.stageCleared=true;run.bossSpawned=true;coop.wakeAltars();
    run.interactables.spawnPortal(world.portal.x,world.portal.z,world.portal.sanct,true);
  }else if(world.boss)coop.onBossCall(null,world.stage,world.boss.x,world.boss.z,world.boss.slot);
}
