// Shared boundaries for the standalone forest edition.
import {starterSpecies,starterWords} from './starter-characters.js';
export const LITE_SPECIES = starterSpecies;
export const LITE_BIOME = 'forest';
export const isLiteSpecies = id => LITE_SPECIES.includes(Number(id));
export const isLiteFamily = id => Object.hasOwn(starterWords,Number(id));
export function validLiteRun(run) {
  return !!run && isLiteSpecies(run.species) && run.biome === LITE_BIOME &&
    (!run.mode || run.mode === 'standard' || run.mode === 'classic') && !run.party &&
    Number.isInteger(run.tier ?? 0) && (run.tier ?? 0) >= 0 && (run.tier ?? 0) <= 2;
}
export function constrainLiteProfile(p) {
  const migrate=id=>({1:132,7:16})[id]??id;
  p.lastSpecies=migrate(p.lastSpecies);
  p.starter=migrate(p.starter);
  if(p.starter&&!isLiteSpecies(p.starter))p.starter=0;
  p.league = [...LITE_SPECIES];
  p.unlocked = [...LITE_SPECIES];
  p.lastSpecies = isLiteSpecies(p.lastSpecies) ? p.lastSpecies : 4;
  p.lastBiome = LITE_BIOME;
  p.biomes = {forest: p.biomes?.forest ?? 0};
  p.times ??= {};
  for(const [key,value] of Object.entries(p.times)) {
    if(!key.startsWith('forest-')){delete p.times[key];continue;}
    if(typeof value==='number')p.times[key]={time:value,splits:[]};
    else if(value && !Array.isArray(value.splits))value.splits=[];
  }
  p.team = [...new Set((p.team ?? []).map(migrate).filter(isLiteSpecies))];
  for (const key of ['shinies', 'classics', 'forms']) p[key] = (p[key] ?? []).filter(isLiteFamily);
  p.captured = Object.fromEntries(Object.entries(p.captured ?? {}).filter(([id]) => isLiteSpecies(id)));
  return p;
}
