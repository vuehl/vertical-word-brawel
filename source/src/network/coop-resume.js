import {jr as heldItemRules, Nr as vitaminRules, vitaminKindLimit} from '../data/config.js';
import {finalBossSpecies} from '../data/character-rules.js';
import {springShoesKey} from '../data/active-content.js';
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
export function worldProgress(run) {
  const portal=run.interactables.list.find(i=>i.kind==='portal');
  const index=run.boss.bossIndex;
  return {stage:run.stage,stageTime:run.stageTime,time:run.time,x:run.player.pos.x,z:run.player.pos.z,
    portal:portal ? {x:portal.x,z:portal.z,sanct:!!portal.data?.sanct} : null,
    boss:run.coop.bossShared && run.boss.alive ? {x:run.enemies.x[index],z:run.enemies.z[index],
      slot:run.coop.bossAuth,hp:run.enemies.hp[index],maxHp:run.enemies.maxHp[index]} : run.coop.resumeBoss || null};
}
export function saveProgress(run) {
  const {coop,player:p}=run;
  if(!p || !coop || coop.ended || run.state==='over' || run.state==='transition' || run.buildingStage)return;
  const fields=(object,keys)=>Object.fromEntries(keys.map(key=>[key,object[key]]));
  const world=worldProgress(run);
  const data={v:4,seat:coop.room.me,party:coop.party,stage:run.stage,world,
    run:fields(run,['stats','gold','keys','goldSpent','springShoesState','splits','pendingLevels','rerolls','skips','tempMods','curses','nextEvo']),
    player:fields(p,['speciesId','evoStage','level','xp','growth','hp','shield','overheal','revives','dead']),
    bleed:coop.bleed,out:coop.out,pos:[p.pos.x,p.pos.y,p.pos.z],
    items:[...p.items],vitamins:[...p.vitamins],chosenVitamins:[...p.chosenVitamins],
    moves:p.moves.map(m=>m && {id:m.def.id,...fields(m,['level','mods','parents','extra','damageDone'])})};
  localStorage.setItem(progressKey,JSON.stringify(data));
  if(coop.room.open)coop.room.send({op:'checkpoint',party:coop.party,data:world});
}
export function restoreProgress(run,data,world) {
  const p=run.player,coop=run.coop;
  if(data){
    Object.assign(run,data.run);
    if(data.player.speciesId!==p.speciesId)p.setSpecies(data.player.speciesId);
    Object.assign(p,data.player);
    p.items=new Map((data.items ?? []).filter(([key])=>heldItemRules.has(key)));
    if (p.items.has(springShoesKey)) {
      p.items.set(springShoesKey, 1);
      run.springShoesState = 'claimed';
    } else {
      run.springShoesState = data.run.springShoesState ?? (data.run.springShoesSeen ? 'offered' : 'available');
    }
    p.vitamins=new Map((data.vitamins ?? []).filter(([key])=>vitaminRules.has(key)));
    // Older saves keep every owned bonus. Their first four choices form the upgrade pool.
    const chosen = new Set([...(data.chosenVitamins ?? []), ...p.vitamins.keys()]);
    p.chosenVitamins = new Set([...chosen].filter(key=>vitaminRules.has(key)).slice(0,vitaminKindLimit));
    const openingMoveId=p.moves[0]?.def.id;
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
    // Older loadouts can contain only retired moves.
    if(openingMoveId!=null && !p.moves.some(Boolean))p.addMove(openingMoveId);
    p.recompute();p.hp=Math.min(data.player.hp,p.maxHp);p.xpNext=p.xpFor(p.level);
    if(!('nextEvo' in data.run))run.nextEvo=run.planEvolution(p.speciesId,1);
    else if((data.v ?? 1)<4 && run.nextEvo){
      // Keep the chosen branch. Versions 2 and 3 can also have a later threshold
      // when the player confirmed the preceding evolution several levels late.
      const plan=run.planEvolution(p.speciesId,1);
      if(plan)run.nextEvo={...run.nextEvo,level:data.v>=2?Math.max(run.nextEvo.level,plan.level):plan.level};
    }
    if(data.stage===world.stage){
      p.pos.set(...data.pos);coop.bleed=data.bleed;coop.out=data.out;
    }else if(p.dead)coop.revive(null);
  }
  if(data?.stage!==world.stage)p.pos.set(world.x,run.terrain.height(world.x,world.z),world.z);
  run.camTarget.copy(p.pos);
  run.time=world.time;
  for(const event of run.director.timeline){
    if(event.t>world.stageTime)continue;
    run.stageTime=event.t;
    if(event.kind==='card')run.director.addCard();
    event.done=event.kind!=='guardian'||!!(world.boss||world.portal);
  }
  run.stageTime=world.stageTime;
  if(world.portal){
    run.dragonDuel=run.stageBossSpecies===finalBossSpecies;
    run.stageCleared=true;run.bossSpawned=true;coop.wakeAltars();
    run.interactables.spawnPortal(world.portal.x,world.portal.z,world.portal.sanct,true);
  }else if(world.boss){
    const owner=coop.room.room.members.find(m=>m.slot===world.boss.slot);
    coop.onBossCall(null,world.stage,world.boss.x,world.boss.z,owner && !owner.offline && !owner.away?world.boss.slot:coop.mySlot);
    coop.resumeBoss=world.boss;
  }
}
