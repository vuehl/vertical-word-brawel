import {roster} from '../data/catalogs.js';
import {starterSpecies,starterWords,characters} from '../data/starter-characters.js';
import {isLiteSpecies,heroAppearanceOwned} from '../data/lite-rules.js';
import {familyOf} from './collection-species.js';
import {glyphWordForSpecies,glyphTone} from '../actors/paper-glyph-art.js';
import {formCopy} from '../data/form-copy.js';
import {glyphCatalog} from '../actors/glyph-catalog.js';
// The album can preview authored glyphs before a playable kit is available.
const previewGlyphs=Object.entries(formCopy).filter(([id,{word}])=>{
  const tier=glyphCatalog.enemies[word]?.tier;
  return (tier===1||tier===2)&&!roster.some(actor=>actor.id===Number(id));
}).map(([id,{word,type}])=>({id:Number(id),word,type,tone:glyphTone(word),previewOnly:true}))
  .sort((a,b)=>glyphCatalog.enemies[a.word].index-glyphCatalog.enemies[b.word].index);
export const collectionRoster=[...starterSpecies.map(id=>roster.find(c=>c.id===id)),...roster.filter(c=>!starterSpecies.includes(c.id)),...previewGlyphs];
export const appearanceName=look=>look==='shiny'?'异色':look==='classic'?'经典异色':'普通';
export const canDeploy=(profile,id)=>isLiteSpecies(id);
export function appearanceOwned(profile,id,look){
  return look?heroAppearanceOwned(profile,id,look):canDeploy(profile,id);
}
export function collectionCharacter(id,api){
  id=Number(id);
  const preview=previewGlyphs.find(c=>c.id===id);
  if(preview)return preview;
  const actor=roster.find(c=>c.id===id)||roster.find(c=>familyOf(c.id)===familyOf(id));
  const base=characters.find(c=>familyOf(c.id)===familyOf(id));
  const word=starterWords[id]||glyphWordForSpecies(id),tone=glyphTone(word);
  return {id:actor?.id??id,tone,role:base?.role||api.typeName(api.speciesType(id)),move:base?.move||api.moveTitle(actor?.id??id),ult:base?.ult||api.ultTitle(actor?.id??id),...base,word,name:word};
}
export function collectionState(profile,id,progress){
  if(previewGlyphs.some(c=>c.id===id))return 'locked';
  if(canDeploy(profile,id))return 'owned';
  if(progress.done)return 'ready';
  if((profile.seen??[]).some(s=>familyOf(s)===familyOf(id))||progress.parts.some(p=>p.value>0)||appearanceOwned(profile,id,'shiny')||appearanceOwned(profile,id,'classic'))return 'locked';
  return 'unknown';
}
export const collectionPageSize=height=>height<650?6:9;
export function pageOf(items,index,size){
  const pages=Math.max(1,Math.ceil(items.length/size)),page=Math.max(0,Math.min(pages-1,index));
  return {pages,page,items:items.slice(page*size,(page+1)*size)};
}
// Each tally uses the unit the player earns. Personal bests never add up across runs.
const challengeActions={
 runs:'完成 # 局对局',league:'收录 # 位可出战字灵',speciesPlayed:'使用 # 位不同字灵出战',
 evolutions:'完成 # 次进阶',kills:'击败 # 位字灵',crits:'造成 # 次暴击',paralyzed:'使 # 位字灵麻痹',
 rainKills:'在雨天击败 # 位字灵',dodges:'闪避 # 次攻击',healed:'恢复 # 点生命',
 alphas:'击败 # 位精英字灵',ultimates:'释放 # 次大招',burned:'使 # 位字灵灼烧',
 slept:'使 # 位字灵睡眠',poisoned:'使 # 位字灵中毒',confused:'使 # 位字灵混乱',
 rocks:'击碎 # 块岩石',gold:'获得 # 枚金币',soaked:'使 # 位字灵浸湿',bosses:'击败 # 位首领',
 frozen:'使 # 位字灵冰冻',reactions:'触发 # 次元素反应',chests:'开启 # 个道具宝箱',
 berries:'拾取 # 个回复道具',alphaCaught:'抓获 # 位支援精英',legendaries:'击败 # 位传说字灵',
};
export function challengePresentation(part){
 const key=part.counter,goal=part.goal,value=Math.min(goal,Math.max(0,part.value??0)),complete=value>=goal;
 const best=key.startsWith('best_'),action=challengeActions[best?key.slice(5):key];
 const format=n=>n.toLocaleString('zh-CN');
 let target=part.desc,remaining='',caption='挑战进度',tally=format(value)+' / '+format(goal);
 if(action){
   const phrase=n=>action.replace('#',format(n));
   target=(best?'单局':'累计')+phrase(goal);
   caption=best?'单局最佳':'累计进度';
   if(!best&&!complete)remaining='再'+phrase(goal-value);
 }else if(key==='maxLevel'||key==='maxTime'){
   const duration=n=>Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
   target=key==='maxLevel'?'单局达到 '+format(goal)+' 级':'单局存活 '+Math.floor(goal/60)+' 分钟';
   caption='单局最佳';if(key==='maxTime')tally=duration(value)+' / '+duration(goal);
 }else if(key==='birds'){
   target='收录三位传说鸟系字灵';
 }else if(key==='win_forest'){
   target='通关桌上世界';
 }else if(key.startsWith('tier_')){
   target='通关'+(key==='tier_forest'?'桌上世界':'沙漠关卡')+' · '+(['普通','困难','噩梦'][goal-1]||format(goal));
   caption='已通关难度';tally=['尚未通关','普通','困难','噩梦'][value]??format(value);
 }else if(key.endsWith('_desert')){
   target='在沙漠关卡击败 '+format(goal)+(key.startsWith('kills')?' 位字灵':' 位首领');
 }
 return {target,headline:remaining||target,caption,tally,complete};
}
export const collectionCondition=part=>challengePresentation(part).target;

// Newly collected alternate colours unlock their base and their appearance.
// Repeated captures never produce duplicate collection rewards.
export function collectionRewards(profile,before){
 if(!before)return [];
 const items=collectionRoster.filter(c=>canDeploy(profile,c.id)&&!canDeploy(before,c.id)).map(c=>({id:c.id,look:null,kind:'base'}));
 for(const look of ['shiny','classic'])for(const c of roster)if(appearanceOwned(profile,c.id,look)&&!appearanceOwned(before,c.id,look))items.push({id:c.id,look,kind:'look'});
 return items;
}

