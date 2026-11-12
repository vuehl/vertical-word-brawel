// Character design supplied on 2026-11-09. IDs keep the original combat data.
export const starterSpecies = Object.freeze([4,132,16]);
export const starterWords = Object.freeze({4:'炎',5:'焱',6:'燚',132:'摹',16:'风',17:'讽',18:'疯',58:'飒',59:'飙'});
export const speedBuff = 'ziling-wind-speed';
export const speedDuration = 5;
export const characters = [
  {id:4,word:'炎',name:'炎',tone:'fire',color:'#bc3441',role:'火 · 爆发',motto:'二火成炎，三火成焱，四火成燚',move:'火花',ult:'一点火苗',evolution:'炎 → 焱 → 燚'},
  {id:132,word:'摹',name:'摹',tone:'ink',color:'#77629e',role:'基础 · 复制',motto:'摹纸影写，照见谁便成为谁',move:'变身',ult:'照着变',evolution:'单字定形 · 无进化'},
  {id:16,word:'风',name:'风',tone:'wind',color:'#387f87',role:'风 · 分支',motto:'风起分两路，择一而行',move:'电光一闪',ult:'一阵刮来',evolution:'风 → 讽 → 飒 / 风 → 疯 → 飙'},
];
export function starterForSpecies(id){
  id=Number(id);
  if([4,5,6].includes(id))return characters[0];
  if(id===132)return characters[1];
  if([16,17,18,58,59].includes(id))return characters[2];
  return characters[0];
}
export function characterForSpecies(id){
  const base=starterForSpecies(id),word=starterWords[id]||base.word;
  return {...base,word,name:word,tone:[58,59].includes(Number(id))?'fire':base.tone};
}
let windRoster,fireWindRoster;
export function configureStarterRoster(roster){
  const byId=new Map(roster.map(actor=>[actor.id,actor]));
  windRoster={...byId.get(16),start:true,branch:[17,18],evoLevel:26,evoLevels:[26,44]};
  fireWindRoster={...windRoster,kit:[...byId.get(58).kit],passive:byId.get(58).passive};
  return starterSpecies.map(id=>id===16?windRoster:{...byId.get(id),start:true});
}
export function rosterForStarterForm(roster,id){
  if(roster?.id!==16)return roster;
  return [58,59].includes(id)?fireWindRoster:windRoster;
}
export function configureStarterSpecies(species){
  const byId=new Map(species.map(actor=>[actor.id,actor]));
  // The design's rows and evolution edges are intentionally independent:
  // 疯 uses Pidgeot; 飒 uses Growlithe; 讽→飒 and 疯→飙.
  for(const [id,parent,stage] of [[17,16,1],[18,16,1],[58,17,2],[59,18,2]]){
    Object.assign(byId.get(id),{evoFrom:parent,evoStage:stage,family:16,evoLevel:stage===1?18:36,evoTrigger:'level-up',evoItem:null});
  }
  for(const id of [4,5,6])byId.get(id).types=['fire'];
  for(const id of [16,17,18])byId.get(id).types=['flying'];
}
const renamed=(original,name,index=0,cast=original.cast)=>({...original,names:[name],descs:[original.descs[index]],dur:[original.dur[index]],cast});
const ultCache=new Map();
export function starterUltimate(id,original){
  if(ultCache.has(id))return ultCache.get(id);
  let def;
  if([4,5,6].includes(id)){
    const index=id-4;
    def=renamed(original[4],['一点火苗','火圈绕身','满屏是火'][index],index);
  }else if(id===132)def=renamed(original[132],'照着变');
  else if(id===16||id===17){
    const index=id===16?0:1;
    def=renamed(original[16],['一阵刮来','卷着打转'][index],index,ctx=>original[16].cast({...ctx,tier:index,form:index}));
  }else if(id===58){
    def=renamed(original[58],'冲！',0,ctx=>original[58].cast({...ctx,tier:0,form:0}));
  }else if(id===18||id===59){
    const name=id===18?'刮倒一片':'没影了',type=id===18?'flying':'fire';
    def={names:[name],descs:[`移动速度变为当前速度的 10 倍，持续 ${speedDuration} 秒。重复释放刷新持续时间，不叠加倍率。`],
      type,cls:'physical',dur:[speedDuration],tint:id===18?0xb8e8e0:0xffb54a,
      cast({run}){run.player.addBuff(speedBuff,speedDuration,name);run.player.zilingSpeedFx=0;}};
  }
  if(def)ultCache.set(id,def);
  return def;
}
export function applyStarterSpeed(stats,buffs){
  if(buffs.has(speedBuff))stats.moveSpeed*=10;
}
export function updateStarterSpeed(run,delta,shape){
  const p=run.player;
  if(!p.buffs.has(speedBuff))return;
  p.zilingSpeedFx=(p.zilingSpeedFx||0)-delta;
  if(p.zilingSpeedFx>0)return;
  p.zilingSpeedFx=.05;
  const color=p.buffs.get(speedBuff).label==='刮倒一片'?0xb8e8e0:0xffb54a;
  run.vfx.trail(p.pos.x,p.pos.y+.65,p.pos.z,color,.8,shape,.35);
}
export function clearStarterSpeed(run){
  if(run.player?.buffs.delete(speedBuff))run.player.recompute();
}
