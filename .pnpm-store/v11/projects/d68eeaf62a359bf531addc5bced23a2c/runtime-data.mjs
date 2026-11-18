import {actorMetrics} from '../source/src/actor-metrics.js';

// Every enabled actor, including the altar's 201, has verified collision
// metrics. Keep its complete original records; only drop unavailable actors.
export const runtimeSpecies=Object.freeze(Object.keys(actorMetrics).map(Number));
const enabled=new Set(runtimeSpecies);
const select=table=>Object.fromEntries(Object.entries(table).filter(([id])=>enabled.has(Number(id))));
export function runtimeData(key,bytes){
  if(!['data/pokemon.json','data/sprites.json','data/learnsets.json','data/i18n/zh.json'].includes(key))return bytes;
  let data=JSON.parse(bytes.toString('utf8'));
  if(key==='data/pokemon.json'){
    // Enabled actors can belong to a later-generation family. Combat research
    // looks up that root's original stats even though it is not a playable or
    // spawnable actor. Keep metadata only; sprites/learnsets stay restricted.
    const families=new Set(data.filter(actor=>enabled.has(actor.id)).map(actor=>actor.family));
    data=data.filter(actor=>enabled.has(actor.id)||families.has(actor.id));
  }
  else if(key==='data/i18n/zh.json')data={...data,pokemon:select(data.pokemon),flavor:select(data.flavor)};
  else data=select(data);
  return Buffer.from(JSON.stringify(data));
}
