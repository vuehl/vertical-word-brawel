// Shared by natural spawns, event waves and summoned ordinary enemies.
// Elites belong to the ordinary budget; bosses, capture actors and allies do not.
export const SPECIAL_ACTORS=2|4|128|2048|4096|8192|16384|32768|65536|131072;
export const MAX_ORDINARY=200;
export const SPAWN_RATE_SCALE=.5;
export const minuteCaps=Object.freeze([5,15,30,50,70,90,115,140,160,180,200]);
export function ordinaryLimit(seconds){
  const minute=Math.max(0,Math.min(10,(Number(seconds)||0)/60)),index=Math.floor(minute);
  return index===10?MAX_ORDINARY:Math.floor(minuteCaps[index]+(minuteCaps[index+1]-minuteCaps[index])*(minute-index));
}
export function runOrdinaryLimit(run){
  return Math.min(ordinaryLimit(run.endless?run.time:run.stageTime),run.enemyCap??MAX_ORDINARY);
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
