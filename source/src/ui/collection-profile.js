import {glyphCanvas,glyphTone,glyphWordForSpecies} from '../actors/paper-glyph-art.js';
import {starterWords} from '../data/starter-characters.js';
import {classDamageMultiplier} from '../combat/stat-multipliers.js';

const percent=value=>Number((value*100).toFixed(1))+'%';
const flat=value=>String(Number(value.toFixed(1)));
const attributes=[
  ['生命','最大生命',s=>Math.round(s.maxHp).toString()],
  ['物攻','物理伤害倍率',s=>percent(classDamageMultiplier(s,'physical'))],
  ['护甲','护甲',s=>flat(s.armor)],
  ['特攻','特殊伤害倍率',s=>percent(classDamageMultiplier(s,'special'))],
  ['攻速','攻击速度',s=>percent(s.attackSpeed)],
  ['移速','移动速度',s=>percent(s.moveSpeed)],
];
const otherAttributes=[
  ['全局伤害倍率',s=>percent(s.damage)],['暴击率',s=>percent(s.critChance)],
  ['攻击范围',s=>percent(s.area)],['生命回复',s=>Number(s.regen.toFixed(2))+' / 秒'],
  ['拾取范围',s=>flat(s.pickupRange)+' 厘米'],['经验获取',s=>percent(s.xpGain)],
  ['金币获取',s=>percent(s.gold)],['幸运',s=>flat(s.luck)],['大招充能速度',s=>percent(s.ultCharge)],
];
export function startingAttributeDetails(stats){
  return [...attributes.map(([,name,format])=>[name,format]),...otherAttributes]
    .map(([name,format])=>[name,format(stats)]);
}
const wordFor=id=>starterWords[id]||glyphWordForSpecies(id);

function paper(width,height,cls){
  const art=document.createElement('canvas');art.className=cls;art.dataset.static='true';
  art.width=width*2;art.height=height*2;
  const ctx=art.getContext('2d');ctx.scale(2,2);ctx.textBaseline='middle';
  return {art,ctx};
}
function text(ctx,s,x,y,size,color,weight='normal',align='left'){
  ctx.font=weight+' '+size+'px "Ziling Swei",sans-serif';ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(s,x,y);
}
function shape(ctx,points,fill){
  ctx.beginPath();ctx.moveTo(...points[0]);for(const point of points.slice(1))ctx.lineTo(...point);
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
}
function routes(id,actor,api){
  if(id==null)return [];
  return (actor?.branch||api.evolutionIds(id)).flatMap(mid=>{
    const level=actor?.evoLevels?.[0]??actor?.evoLevel??api.evolutionLevel(id,mid),ends=api.evolutionIds(mid);
    return ends.length?ends.map(last=>({mid,level,last,lastLevel:actor?.evoLevels?.[1]??api.evolutionLevel(mid,last)})):[{mid,level}];
  });
}
// Both faces share the same paper edge and the raised tab in its upper right.
function indexPaper(c){
  c.fillStyle='#F1EBDF';c.fillRect(0,0,360,82);
  c.fillStyle='#BFB6A5';for(let x=4;x<358;x+=5)c.fillRect(x,79,2,1);
}
function drawAttributes(c,stats,base){
  const labels=[];
  attributes.forEach(([label,name,format],i)=>{
    const col=i%3,x=13+col*114,y=i<3?46:66;
    const current=stats?format(stats):'—';
    text(c,label,x,y,12,'#62594D');
    const changed=base&&current!==format(base);
    text(c,current,x+102,y,12,changed?'#356D58':'#302A31','bold','right');
    labels.push(name+' '+current);
  });
  for(const x of [119,233]){c.fillStyle='#CDC1AC';c.fillRect(x,41,1,31);}
  return labels.join('，');
}
function linkMark(c,cx,y){
  shape(c,[[cx-12,y-2],[cx+2,y-3],[cx,y-7],[cx+13,y],[cx,y+7],[cx+2,y+2],[cx-14,y+3]],'#57535E');
}
export function branchRoutePreview(from,route,speed){
  const {art,ctx}=paper(88,116,'zx-branch-preview');
  const first=wordFor(route.middle),last=wordFor(route.final);
  // The next form is the large impression, the final form sits at the end of the strip.
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(88,0);ctx.lineTo(78,116);ctx.lineTo(0,116);ctx.closePath();ctx.clip();
  ctx.fillStyle='#33303C';ctx.fillRect(0,0,88,116);
  ctx.fillStyle='#565765';
  if(speed){
    shape(ctx,[[-10,47],[67,9],[83,8],[19,46]],'#555866');
    shape(ctx,[[-9,65],[69,27],[54,43],[-9,75]],'#737785');
    shape(ctx,[[12,70],[85,36],[65,54],[7,79]],'#4B505F');
  }else{
    ctx.beginPath();ctx.moveTo(-5,53);ctx.bezierCurveTo(6,28,62,3,82,10);
    ctx.bezierCurveTo(50,10,18,36,9,52);ctx.bezierCurveTo(2,64,20,67,44,61);
    ctx.bezierCurveTo(9,80,-14,74,-5,53);ctx.fill();
    ctx.fillStyle='#727582';ctx.beginPath();ctx.moveTo(29,71);ctx.bezierCurveTo(53,62,73,45,77,31);
    ctx.bezierCurveTo(87,40,66,62,29,71);ctx.fill();
  }
  ctx.drawImage(glyphCanvas(first),9,6,66,66);
  shape(ctx,[[0,86],[85,70],[85,116],[0,116]],'#27252F');
  shape(ctx,[[0,85],[76,71],[66,75],[0,88]],'#DABC77');
  text(ctx,'终阶',7,99,11,'#F5E8CA','bold');
  shape(ctx,[[31,97],[37,97],[36,94],[42,99],[36,103],[37,100],[31,100]],'#E5C573');
  ctx.drawImage(glyphCanvas(last),44,81,31,31);
  art.setAttribute('role','img');art.setAttribute('aria-label',[wordFor(from),first,last].join(' → '));
  return art;
}
function drawRoute(c,id,rows){
  const stamp=(species,x,y,size)=>{
    const word=wordFor(species);c.drawImage(glyphCanvas(word,glyphTone(word)),x-size/2,y-size/2,size,size);
  };
  const link=(level,x,y,width)=>{
    if(level!=null)text(c,'Lv.'+level,x,y,11,'#62594D','bold');
    const cx=level==null?x+width/2:x+width-14;
    linkMark(c,cx,y);
  };
  if(!rows.length){
    if(id!=null)stamp(id,34,56,30);
    text(c,id==null?'请先选择字灵':'没有进阶路线',id==null?180:65,56,13,'#62758A','normal',id==null?'center':'left');
    return;
  }
  stamp(id,34,56,32);
  if(rows.length>2&&rows.every(r=>r.last==null)){
    const width=278/rows.length,centers=rows.map((_,i)=>68+width*(i+.5));
    c.strokeStyle='#A0B1C3';c.lineWidth=1;c.beginPath();
    c.moveTo(51,55);c.lineTo(58,55);c.lineTo(58,40);c.lineTo(centers[centers.length-1],40);
    for(const x of centers){c.moveTo(x,40);c.lineTo(x,45);}
    c.stroke();
    rows.forEach((r,i)=>{
      const x=centers[i];stamp(r.mid,x-12,62,25);
      if(r.level!=null)text(c,'Lv.'+r.level,x+4,62,11,'#62594D','bold');
    });
    return;
  }
  const gap=Math.min(21,43/rows.length),size=rows.length===1?32:Math.min(gap+1,25);
  if(rows.length>1){
    const spread=(rows.length-1)*gap/2;c.strokeStyle='#A0B1C3';c.lineWidth=1;c.beginPath();
    c.moveTo(50,56);c.lineTo(56,56);c.moveTo(56,56-spread);c.lineTo(56,56+spread);
    for(let i=0;i<rows.length;i++){const y=56-spread+i*gap;c.moveTo(56,y);c.lineTo(61,y);}
    c.stroke();
  }
  rows.forEach((r,i)=>{
    const y=56+(i-(rows.length-1)/2)*gap;
    link(r.level,64,y,76);stamp(r.mid,167,y,size);
    if(r.last!=null){link(r.lastLevel,196,y,82);stamp(r.last,310,y,size);}
  });
}
export function profilePrint(id,actor,api,face){
  const {art,ctx}=paper(360,82,'journey-profile-print');
  indexPaper(ctx);
  let label;
  if(face==='stats'){
    const stats=id==null?null:api.startingStats(id);
    const base=id==null?null:api.startingStats(id,false);
    label='开局属性，'+drawAttributes(ctx,stats,base);
    if(stats)text(ctx,'›',354,56,13,'#776B5A','bold','center');
  }else{
    const rows=routes(id,actor,api);
    if(actor?.singleStageEvoLevels)for(const row of rows){
      row.level=actor.singleStageEvoLevels[0]+'/'+row.level;
      if(row.last!=null)row.lastLevel=actor.singleStageEvoLevels[1]+'/'+row.lastLevel;
    }
    drawRoute(ctx,id,rows);
    const step=(species,level)=>(level==null?'':'Lv.'+level+' ')+wordFor(species);
    label=rows.length&&actor?.singleStageEvoLevels?'单关 / 多关，':'';
    label+=rows.map(r=>wordFor(id)+' → '+step(r.mid,r.level)+(r.last==null?'':' → '+step(r.last,r.lastLevel))).join(' / ')
      ||(id==null?'请先选择字灵':'没有进阶路线');
  }
  art.setAttribute('role','img');art.setAttribute('aria-label',label);
  return art;
}
