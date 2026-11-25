import {SINGLE_STAGE,FOREST_COMBAT_ZONES} from '../data/lite-rules.js';

export function portalGuidance(run){
  if(run.mode===SINGLE_STAGE||run.stage>=4||(run.stage>=3&&!run.biome.sanctuary))
    return '走近传送门并停留，即可通关。';
  if(run.biome.sanctuary&&run.stage===FOREST_COMBAT_ZONES)
    return '走近传送门并停留，进入圣地迎战最终 Boss。';
  return '走近传送门并停留，进入下一关。';
}
