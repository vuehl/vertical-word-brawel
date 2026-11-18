// Shared boundaries for the standalone forest edition.
import {starterForSpecies,starterSpecies,starterWords as heroWords} from './starter-characters.js';
export const LITE_SPECIES = starterSpecies;
export const LITE_BIOME = 'forest';
// Stage 4 identifies the sanctuary in scenery, saved runs and co-op messages.
export const FOREST_ROUTE = Object.freeze([1, 2, 4]);
export const FOREST_COMBAT_ZONES = FOREST_ROUTE.length - 1;
export const SINGLE_STAGE = 'single-stage';
// Encounter tables are authored on a ten-minute clock. Only wave progression
// uses that clock. Movement, cooldowns, drops and run records use game seconds.
export const WAVE_SECONDS = 600;
export function zoneDuration(mode = 'standard') {
  if (mode === SINGLE_STAGE) return 360;
  if (mode === 'standard' || mode === 'classic') return 300;
  return WAVE_SECONDS;
}
export const wavePace = mode => WAVE_SECONDS / zoneDuration(mode);
export function isSoloNormalOpening(run) {
  return run.stage === 1 && run.tier === 0 && !run.coop &&
    (run.mode === SINGLE_STAGE || run.mode === 'standard');
}
// Times are elapsed game seconds. Leave one final recovery interval before the guardian.
export function normalOpeningWaves(mode, firstHorde, honey) {
  const waves = mode === SINGLE_STAGE
    ? [[90,'alpha'],[115,'event'],[141,firstHorde],[170,'totem'],[198,'alpha'],
       [226,'elitewave'],[254,'summoner'],[282,'swarm']]
    : [[75,'alpha'],[100,'event'],[125,firstHorde],[150,'totem'],[175,'elitewave'],
       [200,'summoner'],[225,'swarm']];
  if (honey) waves.unshift([waves[0][0] - 25,'alpha']);
  return waves.map(([t,kind]) => ({t,kind}));
}
export const remainingZoneSeconds = run => Math.ceil(zoneDuration(run.mode) - run.stageTime);
export const runRecordKey = run => run.biome + '-' + (run.mode === SINGLE_STAGE ? SINGLE_STAGE : (run.tier ?? 0));
export const isLiteSpecies = id => LITE_SPECIES.includes(Number(id));
export const defaultStarter = LITE_SPECIES[0];
export function playableStarter(id) {
  const migrated = Number(id) === 7 ? 16 : starterForSpecies(id).id;
  return isLiteSpecies(migrated) ? migrated : defaultStarter;
}
export const isLiteFamily = id => Object.hasOwn(heroWords, Number(id));
export function validLiteRun(run) {
  return !!run && isLiteSpecies(run.species) && run.biome === LITE_BIOME &&
    (!run.mode || run.mode === 'standard' || run.mode === 'classic' || (run.mode === SINGLE_STAGE && (run.tier ?? 0) === 0)) &&
    (!run.party || (run.mode === 'standard' && /^room-[a-f0-9]{32}$/.test(run.party) &&
      Number.isInteger(run.coopSeed) && run.coopSeed > 0 && run.coopSeed < 2 ** 31)) &&
    Number.isInteger(run.tier ?? 0) && (run.tier ?? 0) >= 0 && (run.tier ?? 0) <= 2;
}
export function constrainLiteProfile(p) {
  if (p.settings) delete p.settings.autoUlt;
  if (p.starter) p.starter = playableStarter(p.starter);
  p.lastSpecies = playableStarter(p.lastSpecies || p.starter);
  p.league = [...LITE_SPECIES];
  p.unlocked = [...LITE_SPECIES];
  p.lastBiome = LITE_BIOME;
  p.biomes = {forest: p.biomes?.forest ?? 0};
  p.times ??= {};
  for(const [key,value] of Object.entries(p.times)) {
    if(!key.startsWith('forest-')){delete p.times[key];continue;}
    if(typeof value==='number')p.times[key]={time:value,splits:[]};
    else if(value && !Array.isArray(value.splits))value.splits=[];
  }
  p.team = (p.team ?? []).map(id => Number(id) === 7 ? 16 : Number(id)).filter(isLiteSpecies);
  for (const key of ['shinies', 'classics', 'forms']) p[key] = (p[key] ?? []).filter(isLiteFamily);
  p.captured = Object.fromEntries(Object.entries(p.captured ?? {}).filter(([id]) => isLiteFamily(id)));
  return p;
}
