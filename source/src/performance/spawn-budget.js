import {isSoloNormalOpening,wavePace} from '../data/lite-rules.js';

// Shared by natural spawns, event waves and summoned ordinary enemies.
// Elites belong to the ordinary budget; bosses, capture actors and allies do not.
export const SPECIAL_ACTORS=2|4|128|2048|4096|8192|16384|32768|65536|131072;
export const MAX_ORDINARY=200;
export const SPAWN_RATE_SCALE=.5;
export const ENEMY_HEALTH_SCALE = 0.5;
export const ENEMY_DAMAGE_SCALE = 0.5;
export const ENEMY_XP_SCALE = 1.25;
const zoneCaps=Object.freeze([14,32,44,56,72,90,115,140,160,180,200]);
const normalMultiOpeningCaps=Object.freeze([14,32,44,56,72,83,98,115,135,162,200]);
const longRunCaps=Object.freeze([5,15,30,50,70,90,115,140,160,180,200]);
const longRunFirstCaps=Object.freeze([5,25,...longRunCaps.slice(2)]);
// Halve the opening density and refill rate, then restore both over 30 seconds.
const openingScale = seconds => .5 + .5 * Math.max(0, Math.min(1, ((Number(seconds)||0) - 30) / 30));
export function ordinaryLimit(seconds,stage=1,mode='standard',normalOpening=false){
  const pace=wavePace(mode);
  const minute=Math.max(0,Math.min(10,(Number(seconds)||0)*pace/60)),index=Math.floor(minute);
  const shortZoneCaps=normalOpening && mode==='standard' ? normalMultiOpeningCaps : zoneCaps;
  const caps=pace>1?shortZoneCaps:stage===1?longRunFirstCaps:longRunCaps;
  const limit = index===10 ? MAX_ORDINARY : caps[index]+(caps[index+1]-caps[index])*(minute-index);
  return Math.floor(limit * (pace > 1 ? openingScale(seconds) : 1));
}
export function naturalCreditRate(baseRate,seconds,stage,mode='standard',normalOpening=false){
  const pace=wavePace(mode);
  if(pace>1){
    const openingBonus=(stage===1?3.2:2.4)*Math.max(0,Math.min(1,(90-seconds)/45));
    const refillScale=normalOpening && mode==='standard'
      ? 1 - .2 * Math.max(0,Math.min(1,(seconds-120)/120)) : 1;
    return (baseRate*SPAWN_RATE_SCALE*pace+openingBonus)*openingScale(seconds)*refillScale;
  }
  const openingBonus = stage === 1 ? 0.65 * Math.max(0, Math.min(1, (120 - seconds) / 60)) : 0;
  return baseRate*SPAWN_RATE_SCALE+openingBonus;
}
export function runOrdinaryLimit(run){
  const total=Math.min(ordinaryLimit(run.endless?run.time:run.stageTime,run.stage,run.mode,isSoloNormalOpening(run)),run.enemyCap??MAX_ORDINARY);
  if(!run.coop)return total;
  const {size,budgetRank:rank}=run.coop;
  return Math.floor(total/size)+(rank<total%size?1:0);
}
export function countOrdinary(enemies){
  let count=0;
  for(let i=0;i<enemies.n;i++)if(enemies.alive[i]&&!(enemies.flags[i]&SPECIAL_ACTORS))count++;
  return count;
}
export function allowOrdinarySpawn(run,flags=0){
  if(flags&SPECIAL_ACTORS)return true;
  const limit=runOrdinaryLimit(run);
  return run.enemies.count<limit||countOrdinary(run.enemies)<limit;
}
