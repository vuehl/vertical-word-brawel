import {formCopy, moveCopy} from './form-copy.js';

// Keep species IDs stable for saved unlocks and glyph artwork.
export const starterSpecies = Object.freeze([4,16]);
export const starterEvolutionLevels = Object.freeze([10,20]);
export const starterWords = Object.freeze(Object.fromEntries(
  [4,5,6,132,16,17,18,58,59].map(id=>[id,formCopy[id].word])
));
export const windRoutes = [
  {middle:17, final:18, role:'A · 攻速', note:'「卷着打转」双龙卷伴随风环与羽毛扩散。「刮倒一片」攻速十倍，持续5秒。'},
  {middle:58, final:59, role:'B · 移速', note:'「叫完就冲」卷起旋风。「跑得没影」移速十倍，持续5秒。飒、飙被动：移速每增加 2%，伤害 +1%，大招加速同样生效。'},
];
export const attackSpeedBuff = 'ziling-wind-attack-speed';
export const speedBuff = 'ziling-wind-speed';
export const speedDuration = 5;
export const windSpeedPassive = '移速每增加 2%，伤害 +1%（相对当前形态基础移速，含大招加速）。';
export const hasWindSpeedPassive = id => id === 58 || id === 59;
export function windSpeedDamageBonus(id,speed,baseSpeed){
  return hasWindSpeedPassive(id)&&baseSpeed>0 ? Math.max(0,speed/baseSpeed-1)*.5 : 0;
}
const characterDefinitions = [
  {id:4,word:'炎',name:'炎',tone:'fire',color:'#bc3441',role:'火 · 爆发',motto:'二火成炎，三火成焱，四火成燚',move:moveCopy(4,'火花','ember'),ult:formCopy[4].ultimate[1],evolution:'炎 → 焱 → 燚'},
  {id:132,word:'摹',name:'摹',tone:'ink',color:'#77629e',role:'基础 · 复制',motto:'摹纸影写，照见谁便成为谁',move:moveCopy(132,'变身','transform'),ult:formCopy[132].ultimate[1],evolution:'单字定形 · 无进化'},
  {id:16,word:'风',name:'风',tone:'wind',color:'#387f87',role:'风 · 分支',motto:'风起分两路，择一而行',move:moveCopy(16,'电光一闪','quick-attack'),ult:formCopy[16].ultimate[1],evolution:windRoutes.map(route=>['风',starterWords[route.middle],starterWords[route.final]].join(' → ')).join(' / ')},
];
const starterById = new Map(characterDefinitions.map(character=>[character.id,character]));
export const characters = starterSpecies.map(id=>starterById.get(id));
export function starterForSpecies(id){
  id=Number(id);
  if([17,18,58,59].includes(id))return starterById.get(16);
  return starterById.get(id)??starterById.get(4);
}
export function isPlayableHeroForm(id){
  return Object.hasOwn(starterWords,id)&&starterSpecies.includes(starterForSpecies(id).id);
}
export function characterForSpecies(id){
  const base=starterForSpecies(id),form=formCopy[id],word=form?.word??base.word;
  const move=form?.starterAttack?form.moves[form.starterAttack[1]]:base.move;
  return {...base,word,name:word,move,ult:form?.ultimate[1]??base.ult};
}
export function configureStarterRoster(roster){
  const byId=new Map(roster.map(actor=>[actor.id,actor]));
  return starterSpecies.map(id=>({
    ...byId.get(id),start:true,evoLevels:starterEvolutionLevels,
    ...(id===16?{branch:windRoutes.map(route=>route.middle),evoLevel:starterEvolutionLevels[0]}:{}),
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
  const name=formCopy[id]?.ultimate[1];
  if([4,5,6].includes(id)){
    const index=id-4;
    def=renamed(original[4],name,index);
  }else if(id===132)def=renamed(original[132],name);
  else if(id===16||id===58){
    const index=id===16?0:1;
    def=renamed(original[16],name,index,ctx=>original[16].cast({...ctx,tier:index,form:index}));
  }else if(id===17){
    def={names:[name],descs:['两道龙卷向前推进，牵引并持续击打敌人；周身风环和羽毛向外扩散。'],
      type:'flying',cls:'special',dur:[2.2],tint:0xb8e8e0,cast:castWindRing};
  }else if(id===18||id===59){
    const attack=id===18,key=attack?attackSpeedBuff:speedBuff;
    def={names:[name],descs:['使当前'+(attack?'攻击':'移动')+'速度变为 10 倍，持续 '+speedDuration+' 秒。重复释放刷新持续时间。'+(attack?'':'被动：'+windSpeedPassive)],
      type:'flying',cls:'physical',dur:[speedDuration],tint:0xb8e8e0,
      cast({run}){run.player.addBuff(key,speedDuration,name);run.player.zilingSpeedFx=0;run.player.zilingSpeedPosition=null;}};
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
  if(p.buffs.has(speedBuff)){
    const previous=p.zilingSpeedPosition;
    p.zilingSpeedPosition={x:p.pos.x,y:p.pos.y,z:p.pos.z};
    if(!previous||p.dead||!run.vfx.crafted.allowed())return;
    const dx=p.pos.x-previous.x,dz=p.pos.z-previous.z,distance=Math.hypot(dx,dz);
    if(distance<.08)return;
    const steps=Math.min(5,Math.max(1,Math.ceil(distance/.7)));
    for(let i=0;i<steps;i++){
      // Sample actual travelled positions. No afterimages beyond walls or
      // ahead of the player, and no new samples while standing still.
      const f=i/steps;
      const old=run.ghosts.findIndex(g=>g.windGlyph);
      if(run.ghosts.filter(g=>g.windGlyph).length>=5)run.ghosts.splice(old,1);
      if(run.ghosts.length>=96)run.ghosts.shift();
      run.ghosts.push({windGlyph:true,species:p.speciesId,scale:p.renderScale,x:previous.x+dx*f,
        y:previous.y+(p.pos.y-previous.y)*f,z:previous.z+dz*f,dir:run.sprites.dirRow(dx,dz),
        start:run.time,life:.24});
    }
    return;
  }
  p.zilingSpeedPosition=null;
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
  p.zilingSpeedPosition=null;
  if(run.ghosts)for(let i=run.ghosts.length-1;i>=0;i--)if(run.ghosts[i].windGlyph)run.ghosts.splice(i,1);
  if(movement||attack)p.recompute();
}
