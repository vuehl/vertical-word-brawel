// Keep species IDs stable for saved unlocks and glyph artwork.
export const starterSpecies = Object.freeze([4,132,16]);
export const starterWords = Object.freeze({4:'炎',5:'焱',6:'燚',132:'摹',16:'风',17:'讽',18:'疯',58:'飒',59:'飙'});
export const windRoutes = [
  {middle:17, final:18, role:'A · 攻速', note:'讽的大招向四周环形扩散。疯的大招使攻速 ×10，持续 5 秒。'},
  {middle:58, final:59, role:'B · 移速', note:'飒，本义为翔风。飙的大招使移速 ×10，持续 5 秒。'},
];
export const attackSpeedBuff = 'ziling-wind-attack-speed';
export const speedBuff = 'ziling-wind-speed';
export const speedDuration = 5;
export const characters = [
  {id:4,word:'炎',name:'炎',tone:'fire',color:'#bc3441',role:'火 · 爆发',motto:'二火成炎，三火成焱，四火成燚',move:'火花',ult:'一点火苗',evolution:'炎 → 焱 → 燚'},
  {id:132,word:'摹',name:'摹',tone:'ink',color:'#77629e',role:'基础 · 复制',motto:'摹纸影写，照见谁便成为谁',move:'变身',ult:'照着变',evolution:'单字定形 · 无进化'},
  {id:16,word:'风',name:'风',tone:'wind',color:'#387f87',role:'风 · 分支',motto:'风起分两路，择一而行',move:'电光一闪',ult:'一阵刮来',evolution:windRoutes.map(route=>['风',starterWords[route.middle],starterWords[route.final]].join(' → ')).join(' / ')},
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
  return {...base,word,name:word};
}
export function configureStarterRoster(roster){
  const byId=new Map(roster.map(actor=>[actor.id,actor]));
  return starterSpecies.map(id=>({
    ...byId.get(id),start:true,
    ...(id===16?{branch:windRoutes.map(route=>route.middle),evoLevel:26,evoLevels:[26,44]}:{}),
  }));
}
export function configureStarterSpecies(species){
  const byId=new Map(species.map(actor=>[actor.id,actor]));
  for(const {middle,final} of windRoutes){
    for(const [id,parent,stage] of [[middle,16,1],[final,middle,2]]){
      Object.assign(byId.get(id),{evoFrom:parent,evoStage:stage,family:16,evoLevel:stage===1?18:36,
        evoTrigger:'level-up',evoItem:null,types:['flying']});
    }
  }
  byId.get(16).types=['flying'];
  for(const id of [4,5,6])byId.get(id).types=['fire'];
}
const renamed=(original,name,index=0,cast=original.cast)=>({...original,names:[name],descs:[original.descs[index]],dur:[original.dur[index]],cast});
const ultCache=new Map();
export function starterUltimate(id,original,castWindRing){
  if(ultCache.has(id))return ultCache.get(id);
  let def;
  if([4,5,6].includes(id)){
    const index=id-4;
    def=renamed(original[4],['一点火苗','火圈绕身','满屏是火'][index],index);
  }else if(id===132)def=renamed(original[132],'照着变');
  else if(id===16||id===58){
    const index=id===16?0:1;
    def=renamed(original[16],['一阵刮来','卷着打转'][index],index,ctx=>original[16].cast({...ctx,tier:index,form:index}));
  }else if(id===17){
    def={names:['环形扩散'],descs:['从自身向四周扩散一道风环，对触及的敌人造成风系伤害。'],
      type:'flying',cls:'special',dur:[0.8],tint:0xb8e8e0,cast:castWindRing};
  }else if(id===18||id===59){
    const attack=id===18,key=attack?attackSpeedBuff:speedBuff,name=attack?'攻速 ×10':'移速 ×10';
    def={names:[name],descs:['使当前'+(attack?'攻击':'移动')+'速度变为 10 倍，持续 '+speedDuration+' 秒。重复释放刷新持续时间。'],
      type:'flying',cls:'physical',dur:[speedDuration],tint:0xb8e8e0,
      cast({run}){run.player.addBuff(key,speedDuration,name);run.player.zilingSpeedFx=0;}};
  }
  if(def)ultCache.set(id,def);
  return def;
}
export function applyStarterSpeed(stats,buffs){
  if(buffs.has(attackSpeedBuff))stats.attackSpeed*=10;
  if(buffs.has(speedBuff))stats.moveSpeed*=10;
}
export function updateStarterSpeed(run,delta,shape){
  const p=run.player;
  if(!p.buffs.has(speedBuff)&&!p.buffs.has(attackSpeedBuff))return;
  p.zilingSpeedFx=(p.zilingSpeedFx||0)-delta;
  if(p.zilingSpeedFx>0)return;
  p.zilingSpeedFx=.05;
  run.vfx.trail(p.pos.x,p.pos.y+.65,p.pos.z,0xb8e8e0,.8,shape,.35);
}
export function clearStarterSpeed(run){
  const p=run.player;
  if(!p)return;
  const movement=p.buffs.delete(speedBuff),attack=p.buffs.delete(attackSpeedBuff);
  if(movement||attack)p.recompute();
}
