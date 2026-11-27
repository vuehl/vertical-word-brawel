import {journeyScene} from './journey-scene.js';
import {paintLoadingSlip} from './menu-scene.js';
import {headerCutout,titleRibbon,hudPaperIcon,paperIcon,rewardPaper,arrivalPennant,evolutionResult,settlementTicket,battleDialogHeading,battleDialogFrame,stagePortrait,choiceMark} from './first-batch-art.js';
import {albumTab,setAlbumTabActive,profileSwitch,dockDialogClose,mountMenuDialog,openPaperPrompt,paperDecisionPanel,paperDecisionActions,paperDialogTitle,standardButton,fitPaperActionLabels,standardFooter,freePaperActions} from './paper-system.js';
import {upgradeStocks,choiceQuality,choiceModel,effectScope,frameChoiceCards} from './choice-presentation.js';
import {createCollectionUI} from './collection-ui.js';
import {canDeploy,collectionRewards} from './collection-rules.js';
import {installReviewBattle,itemOffer,qualityBadge,planBadge} from './battle-review-ui.js';
import {runPlan,planIncludes,plannedUpgrade} from '../combat/battle-plan.js';
import {savedSeat,rememberSeat,forgetSeat,savedProgress,saveProgress} from '../network/coop-resume.js';
import {RelayRoom} from '../network/multiplayer.js';
import {askCoopCode} from '../network/coop-join-dialog.js';
import {createPeerHud} from '../network/coop-peer-hud.js';
import {drawMenuGlyph,drawRouteGlyph,glyphWordForSpecies,releaseGlyphCanvasCache} from '../actors/paper-glyph-art.js';
import {homeEntryFace,menuSymbol,itineraryStamp} from './menu-paper-art.js';
import {drawBattleMinimap,drawBattleHealth,drawBattleCooldown,mapWorldScale,drawBattleStatus,drawStageCaption,drawUltimateSeal,drawHudClock} from './paper-hud-art.js';
import {readyDiamondFrame} from '../effects/ultimate-ready-diamonds.js';
import {regionAtlas} from './region-atlas-art.js';
import {paperStages} from '../world/paper-world.js';
import {laboratory} from '../data/catalogs.js';
import {ultimateResearchBonus} from '../combat/stat-multipliers.js';
import {prepareHudImage,waitForLoadingPaint} from '../performance/loading-work.js';
import {selectGraphicsQuality} from '../performance/performance-profile.js';
import {ExperienceRing} from '../combat/experience-ring.js';
import {characters,characterForSpecies,windRoutes,hasWindSpeedPassive,windSpeedDamageBonus,windRushMultiplier,windRushDragonBonus} from '../data/starter-characters.js';
import {SINGLE_STAGE,enemyDifficultyText,defaultStarter,isLiteSpecies,playableStarter,FOREST_COMBAT_ZONES,QUIT_REWARD_MIN_SECONDS,remainingZoneSeconds,formatGameTime as time} from '../data/lite-rules.js';
import {sceneAction} from '../combat/scene-action.js';
import {COOP_ROOM_SIZE} from '../network/multiplayer-config.js';
import {setFrameRateLock,frameRateHelp} from '../performance/frame-policy.js';
import {portalGuidance} from '../world/portal-guidance.js';

export {characters,icon as paperIcon};

const destinations=[
  {id:'forest',name:'桌上世界',art:'desk',station:'第一站',regions:FOREST_COMBAT_ZONES,released:true},
  {id:'attic',name:'玩具阁楼',art:'attic',released:false},
  {id:'studio',name:'画室奇境',art:'studio',released:false},
  {id:'bookshelf',name:'书架云端',art:'bookshelf',released:false},
];
const difficulties=[
  {name:'普通（单关）',tier:0,mode:SINGLE_STAGE,note:['击败首区镇守后','进门通关']},
  {name:'普通',tier:0,mode:'standard',note:['完成全部区域','挑战圣地镇守']},
  {name:'困难',tier:1,mode:'standard',note:[enemyDifficultyText(1)],locked:'完整通关普通后解锁'},
  {name:'噩梦',tier:2,mode:'standard',note:[enemyDifficultyText(2)],locked:'通关困难后解锁'},
];
const difficultyName=run=>run.mode===SINGLE_STAGE?difficulties[0].name:difficulties[1+run.tier].name;
const number=n=>Math.round(Number(n)||0).toLocaleString('en-US');
function compactCounter(value){
  if(value>=1e16)return value.toExponential(1).replace('e+','e');
  for(const [unit,suffix] of [[1e12,'万亿'],[1e8,'亿'],[1e4,'万']]){
    if(value>=unit){
      const scale=value<unit*100?10:1;
      return Math.floor(value/unit*scale)/scale+suffix;
    }
  }
  return String(value);
}
const percent=n=>Number(((Number(n)||0)*100).toFixed(1))+'%';
function el(tag,cls='',children=[],attrs={}) {
  const node=document.createElement(tag);if(cls)node.className=cls;
  for(const [k,v] of Object.entries(attrs)) {
    if(k.startsWith('on'))node.addEventListener(k.slice(2),v);
    else if(k==='disabled')node.disabled=!!v;
    else if(tag==='canvas'&&(k==='width'||k==='height'))node[k]=Number(v);
    else node.setAttribute(k,String(v));
  }
  for(const child of [children].flat())if(child!==null&&child!==undefined)node.append(typeof child==='object'?child:String(child));
  return node;
}
const text=(s,cls='')=>el('p',cls,s);
const updateText=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
const small=s=>el('small','zx-note',s);
const row=(...nodes)=>el('div','zx-row',nodes);
const col=(...nodes)=>el('div','zx-col',nodes);
export function itemCardContent(picture,rarity,heading,details){
  return [el('div','zx-item-hero',[el('span','zx-item-rarity',rarity),picture]),
    el('div','zx-item-copy',[el('h3','',heading),...details])];
}
export function itemDialog(title,body,actions,attrs={}){
  return el('section','zx zx-modal zx-item-dialog',[
    el('h2','',title),el('div','zx-item-body',body),el('footer','zx-item-actions',actions),
  ],attrs);
}
const card=(...nodes)=>el('div','zx-card',nodes);
function glyph(c,draw=drawMenuGlyph){
  const word=c.word||c,node=el('div','zx-glyph paper-portrait '+(c.tone||''),[],{'aria-label':word});
  const canvas=el('canvas','zx-glyph-image');canvas.dataset.static='true';node.append(canvas);
  draw(canvas,word,c.tone);
  canvas.dataset.glyphReady='true';return node;
}
const statRow=(label,value)=>el('div','zx-stat-row',[el('b','',label),el('span','',value)]);
// Paths keep icons independent of the device's font and emoji support.
function icon(name,size=24,color='#766a88') {
  if(name==='settings')return menuSymbol('settings',size);
  const canvas=el('canvas','zx-icon',[],{width:size*2,height:size*2,'data-icon':name,'aria-hidden':true});
  canvas.dataset.static='true';canvas.style.width=size+'px';canvas.style.height=size+'px';
  const ctx=canvas.getContext('2d');ctx.scale(size/12,size/12);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1.7;ctx.lineCap='round';ctx.lineJoin='round';
  if(name==='moves'){
    ctx.beginPath();ctx.moveTo(4,20);ctx.lineTo(9,15);ctx.moveTo(5,12);ctx.lineTo(12,19);ctx.moveTo(8,13);ctx.lineTo(18,3);ctx.lineTo(21,3);ctx.lineTo(20,9);ctx.lineTo(11,17);ctx.stroke();
  }else if(name==='plan'){
    ctx.strokeRect(5,3,14,18);ctx.beginPath();for(const y of [8,12,16]){ctx.moveTo(8,y);ctx.lineTo(16,y);}ctx.stroke();
  }else if(name==='looks'){
    ctx.beginPath();for(const [index,[x,y]] of [[8,3],[10,5],[14,5],[16,3],[22,8],[19,12],[16,11],[16,21],[8,21],[8,11],[5,12],[2,8]].entries())index?ctx.lineTo(x,y):ctx.moveTo(x,y);
    ctx.closePath();ctx.stroke();
  }else if(name==='eye'){
    ctx.beginPath();ctx.moveTo(2,12);ctx.bezierCurveTo(7,3,17,3,22,12);ctx.bezierCurveTo(17,21,7,21,2,12);ctx.stroke();ctx.beginPath();ctx.arc(12,12,3,0,Math.PI*2);ctx.stroke();
  }else if(name==='spark'){
    ctx.beginPath();ctx.moveTo(12,2);ctx.lineTo(15,9);ctx.lineTo(22,12);ctx.lineTo(15,15);ctx.lineTo(12,22);ctx.lineTo(9,15);ctx.lineTo(2,12);ctx.lineTo(9,9);ctx.closePath();ctx.stroke();
  }else if(name==='search'){
    ctx.beginPath();ctx.arc(10,10,6,0,Math.PI*2);ctx.moveTo(15,15);ctx.lineTo(21,21);ctx.stroke();
  }else if(name==='fire'){
    ctx.beginPath();ctx.moveTo(12,2);ctx.bezierCurveTo(13,8,21,9,19,16);ctx.bezierCurveTo(17,25,3,23,5,14);ctx.lineTo(8,8);ctx.lineTo(9,13);ctx.bezierCurveTo(12,11,12,6,12,2);ctx.stroke();
  }else if(name==='lock'){
    ctx.beginPath();ctx.roundRect(5.5,10,13,11,2.5);ctx.stroke();
    ctx.beginPath();ctx.moveTo(8,10);ctx.lineTo(8,7);ctx.arc(12,7,4,Math.PI,Math.PI*2);ctx.lineTo(16,10);ctx.stroke();
  }else if(name==='radio-empty'){
    ctx.beginPath();ctx.arc(12,12,10,0,Math.PI*2);ctx.stroke();
  }else if(name==='saved'){
    ctx.beginPath();ctx.moveTo(5,12);ctx.lineTo(10,17);ctx.lineTo(20,7);ctx.stroke();
  }else if(name==='check'){
    ctx.fillStyle='#F04B60';ctx.beginPath();ctx.arc(12,12,11,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#F3F1FA';ctx.beginPath();ctx.moveTo(6.5,12);ctx.lineTo(10,15.5);ctx.lineTo(17,8.5);ctx.stroke();
  }else if(name==='target'){
    ctx.beginPath();ctx.arc(12,12,6,0,Math.PI*2);ctx.moveTo(12,3);ctx.lineTo(12,8);ctx.moveTo(12,16);ctx.lineTo(12,21);ctx.moveTo(3,12);ctx.lineTo(8,12);ctx.moveTo(16,12);ctx.lineTo(21,12);ctx.stroke();
  }else if(name==='jump'){
    ctx.beginPath();ctx.moveTo(6,12);ctx.lineTo(12,6);ctx.lineTo(18,12);ctx.moveTo(6,18);ctx.lineTo(12,12);ctx.lineTo(18,18);ctx.stroke();
  }else if(name==='dash'){
    ctx.beginPath();ctx.moveTo(4,7);ctx.lineTo(12,7);ctx.moveTo(2,12);ctx.lineTo(15,12);ctx.moveTo(4,17);ctx.lineTo(12,17);ctx.moveTo(15,6);ctx.lineTo(21,12);ctx.lineTo(15,18);ctx.stroke();
  }else if(name==='book'){
    ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(12,5);ctx.quadraticCurveTo(7,2,2.5,4);ctx.lineTo(2.5,19);ctx.quadraticCurveTo(7,17,12,20);ctx.quadraticCurveTo(17,17,21.5,19);ctx.lineTo(21.5,4);ctx.quadraticCurveTo(17,2,12,5);ctx.lineTo(12,20);ctx.stroke();
  }else if(name==='stats'){
    ctx.beginPath();ctx.moveTo(5,20);ctx.lineTo(5,13);ctx.moveTo(12,20);ctx.lineTo(12,7);ctx.moveTo(19,20);ctx.lineTo(19,3);ctx.stroke();
  }else if(name==='refresh'){
    ctx.beginPath();ctx.arc(12,12,7.5,Math.PI*.2,Math.PI*1.85);ctx.stroke();ctx.beginPath();ctx.moveTo(19,3.5);ctx.lineTo(19,8.5);ctx.lineTo(14,8.5);ctx.stroke();
  }else if(name==='interact'){
    ctx.beginPath();ctx.roundRect(3,6,18,15,3);ctx.stroke();
    ctx.beginPath();ctx.moveTo(3,12);ctx.lineTo(21,12);ctx.moveTo(9,6);ctx.lineTo(9,3);ctx.lineTo(15,3);ctx.lineTo(15,6);ctx.stroke();
    ctx.fillRect(10,10,4,5);
  }else if(name==='clock'){
    ctx.beginPath();ctx.arc(12,13,8,0,Math.PI*2);ctx.moveTo(12,8);ctx.lineTo(12,13);ctx.lineTo(16,15);ctx.moveTo(9,2);ctx.lineTo(15,2);ctx.stroke();
  }else if(name==='coin'){
    ctx.fillStyle='#f5cd70';ctx.beginPath();ctx.arc(12,12,9,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(12,12,5.8,0,Math.PI*2);ctx.moveTo(12,8.5);ctx.lineTo(12,15.5);ctx.stroke();
  }else if(name==='pin'){
    ctx.beginPath();ctx.moveTo(12,22);ctx.bezierCurveTo(8,17,4,13,4,9);ctx.arc(12,9,8,Math.PI,Math.PI*2);ctx.bezierCurveTo(20,13,16,17,12,22);ctx.closePath();ctx.stroke();
    ctx.beginPath();ctx.arc(12,9,2.5,0,Math.PI*2);ctx.stroke();
  }else if(name==='score'){
    ctx.beginPath();ctx.moveTo(7,3);ctx.lineTo(10,8);ctx.moveTo(17,3);ctx.lineTo(14,8);ctx.stroke();
    ctx.beginPath();ctx.arc(12,14,7,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(12,10);ctx.lineTo(15,14);ctx.lineTo(12,18);ctx.lineTo(9,14);ctx.closePath();ctx.fill();
  }else if(name==='pause'){
    ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(8,6);ctx.lineTo(8,18);ctx.moveTo(16,6);ctx.lineTo(16,18);ctx.stroke();
  }
  return canvas;
}
function stagePrint(name,style){return el('img',style,[],{src:'assets/ui-paper/'+name+'.webp',alt:'','aria-hidden':true});}
function button(label,action,kind='',attrs={}) {
  const node=el('button','zx-button '+kind,label,{type:'button',...attrs});
  standardButton(node,label);
  if(['journey','collection-next','enter'].includes(attrs['data-action']))node.dataset.printAngle='-3';
  else if(kind.includes('zx-home-entry'))node.dataset.printAngle='-2';
  node.addEventListener('click',async()=>{
    if(node.disabled||node._busy)return;
    node._busy=true;
    try{await action();}catch(error){window.__zixingApp?.notice(error.message||String(error));}
    finally{node._busy=false;}
  });
  return node;
}
const link=(label,action)=>button(label,action,'zx-link');
function requestIndicator(message,compact=false) {
  const art=el('canvas','zx-request-art',[],{width:240,height:152,'aria-hidden':true});
  const status=el('div','zx-request-status'+(compact?' compact':''),[art,el('b','',message)],{role:'status'});
  const ctx=art.getContext('2d');
  function pageEdge(direction,width,lift,fill) {
    ctx.beginPath();ctx.moveTo(60,30);
    ctx.quadraticCurveTo(60+direction*width*.48,20-lift,60+direction*width,27-lift);
    ctx.lineTo(60+direction*width,57-lift);
    ctx.quadraticCurveTo(60+direction*width*.48,51-lift,60,61);
    ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.stroke();
  }
  function draw(){
    const phase=(Date.now()%1600)/1600,turn=Math.cos(phase*Math.PI);
    ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,120,76);
    ctx.fillStyle='#dde3d5';ctx.beginPath();ctx.ellipse(60,65,45,4,0,0,2*Math.PI);ctx.fill();
    ctx.lineJoin='round';ctx.lineWidth=1.7;ctx.strokeStyle='#495b59';
    for(const side of [-1,1]){
      ctx.save();ctx.translate(0,4);pageEdge(side,42,0,'#94b4ab');ctx.restore();
      pageEdge(side,38,0,'#fff9e6');
      ctx.strokeStyle='#c7c8ad';
      for(const y of [36,42,48]){
        ctx.beginPath();ctx.moveTo(60+side*8,y);ctx.quadraticCurveTo(60+side*21,y-5,60+side*30,y-3);ctx.stroke();
      }
      ctx.strokeStyle='#495b59';
    }
    pageEdge(Math.sign(turn),Math.abs(turn)*37,13*Math.sin(phase*Math.PI),turn>0?'#fff6d8':'#f0e5c5');
    for(const [x,y,offset] of [[20,17,0],[95,12,.32],[105,23,.64]]){
      const r=2.5+1.6*Math.sin(2*Math.PI*(phase+offset));
      ctx.fillStyle='#c09b50';ctx.beginPath();ctx.moveTo(x,y-r*1.4);ctx.lineTo(x+r,y);
      ctx.lineTo(x,y+r*1.4);ctx.lineTo(x-r,y);ctx.closePath();ctx.fill();
    }
  }
  draw();
  function tick(){
    if(!art.isConnected)return;
    if(!document.hidden)draw();
    setTimeout(tick,80);
  }
  setTimeout(tick,80);
  return status;
}
function tabs(labels,index,change,kind='') {
  return el('div','zx-tabs '+kind,labels.map((label,i)=>el('button','zx-tab'+(index===i?' on':''),label,
    {type:'button','aria-pressed':index===i,onclick:()=>change(i)})));
}
function albumRows(cards,columns,kind){
  const rows=[];
  for(let i=0;i<cards.length;i+=columns){
    const children=cards.slice(i,i+columns);
    while(children.length<columns)children.push(el('span','zx-album-spacer',[],{'aria-hidden':true}));
    rows.push(el('div','zx-album-row',children));
  }
  return el('div',kind,rows);
}
const labNames={dmg:['攻','伤害'],atkspd:['速','攻击速度'],spd:['移','移动速度'],area:['域','攻击范围'],crit:['暴','暴击率'],hp:['生','最大生命'],armor:['甲','护甲'],regen:['复','生命回复'],magnet:['拾','拾取范围'],xp:['悟','经验获取'],gold:['财','金币获取'],luck:['运','幸运'],ult:['极','大招充能']};
const labGroups=[['dmg','atkspd','spd','area','crit'],['hp','armor','regen','magnet'],['xp','gold','luck','ult']];
export function createZixingUI(app,api) {
  if(app.zixing)return app.zixing;
  document.documentElement.classList.add('zixing');
  window.__zixingApp=app;
  let selected=defaultStarter,selectedDestination=destinations[0],selectedDifficulty=difficulties[window.entryViewport?0:1],labTab=0,authPromise=null,activeEntry=null,bootJourneyStarted=false;
  const scene=journeyScene();
  const ui=app.zixing={home,choose,map,difficulty:map,multiplayer:()=>openProfilePage(coopTitle,()=>multiplayer()),lab,settings,help,stats,attachRun,loading,start,prepareBoot,prepareProfile:ready,savedCard,settlementSaved};
  const character=characterForSpecies;
  window.addEventListener('memorywarning',()=>{
    releaseGlyphCanvasCache();
    app.run?.sprites?.discardUnusedWarmGlyphs?.();
  });
  const current=()=>character(selected);
  const profile=()=>app.meta.profile;
  // Older local saves have run history. A restored cloud save may only have dust or stage progress.
  const hasJourneyProgress=p=>!!(p?.firstJourneyPlayed||p?.runs?.length||p?.counters?.runs>0||
    p?.totalStardust>0||p?.biomes?.forest>0);
  async function prepareBoot(account){
    if(bootJourneyStarted){await ready(account);return home();}
    // Every fresh game process gets the opening, including existing saves.
    // Returning to menus or resuming from the background keeps this session.
    bootJourneyStarted=true;
    // Prepare the scene and decode the first movie frame under the original
    // startup poster. Its single bar owns all work until playback can begin.
    const opening=window.playJourneyOpening?.({paused:true});
    const config={species:defaultStarter,biome:'forest',tier:0,boosts:[],mode:SINGLE_STAGE};
    if(!opening){
      await ready(account);
      window.onBootReady=()=>{void start(config,null,null,true);};
      return;
    }
    let sceneReady;
    const prepared=new Promise(resolve=>{sceneReady=resolve;});
    const entering=start(config,null,opening,true,({progress,phase})=>{
      window.bootStage?.(phase||'正在准备场景',60+39*progress);
      if(progress===1)sceneReady();
    },()=>ready(account));
    window.onBootReady=()=>opening.resume();
    // Entry waits for the film to finish; boot only waits for the prepared
    // scene and first frame. Failed entry must also uncover its retry page.
    await Promise.race([Promise.all([prepared,opening.ready]),entering]);
  }
  let battleRecovery=null;
  function recoverBattle(session,reason){
    const current=app.run;
    if(battleRecovery || current?.coop?.room!==session)return;
    current.coop.reconnecting=true;
    current.state='paused';
    const seat={code:session.code,seat:session.me,party:current.coop.party};
    let stopped=false,busy=false,unavailable=false,timer,next,attempts=0;
    const stop=()=>{
      stopped=true;clearTimeout(timer);window.removeEventListener('pageshow',attempt);
      if(battleRecovery===stop)battleRecovery=null;
    };
    battleRecovery=stop;
    const later=()=>{
      stop();next?.end('稍后重连',false);app.coopRoom=null;app.toMenu();
    };
    function show(message){
      const actions=[...(!unavailable?[button('重试连接',attempt,'primary')]:[]),button(unavailable?'返回首页':'稍后重连',later)];
      const body=[text(message),small('房间 '+seat.code+(unavailable?' · 原对局已无法恢复。':' · 席位与进度已保留。在线队友可以继续战斗。'))];
      if(app.run?.ui){
        app.setScreen(null);
        overlay('正在重连房间','网络暂时中断',body,actions,app.run.ui,'zx-reconnect');
      }else screen('coop-reconnect','正在重连房间','房间 '+seat.code,body,actions);
    }
    async function attempt(){
      if(stopped || busy || unavailable || document.hidden)return;
      busy=true;clearTimeout(timer);show('正在恢复连接并同步队友进度…');
      try{
        next=await RelayRoom.connect({code:seat.code,resume:seat,species:session.mine.species,
          name:app.meta.account?.name||'伙伴',factory:window.createCoopSocket});
        if(stopped || document.hidden){next.end('等待返回游戏',false);return;}
        if(!next.returning || next.room.party!==seat.party)throw Error('原对局已结束');
        const world=await next.currentWorld();
        if(stopped || document.hidden){next.end('等待返回游戏',false);return;}
        next.onInterrupted=message=>recoverBattle(next,message);
        app.coopRoom=next;rememberSeat(next);
        const ok=await start({species:next.mine.species,biome:'forest',tier:next.room.tier,mode:'standard',boosts:[],
          coop:{room:next,party:next.room.party,seed:next.room.seed,world,progress:savedProgress(next),reconnecting:true}});
        if(!ok || !next.open)throw Error(ui.entryDiagnostics?.error||'暂时无法恢复对局，请重试');
        stop();
      }catch(error){
        next?.end(error.message,false);
        if(stopped)return;
        const expired=/房间不存在|席位已失效|原对局已结束|房间已开局/.test(error.message);
        unavailable=expired;
        if(expired)forgetSeat(seat.seat);
        show(expired?error.message:'连接暂未恢复，将自动重试。'+error.message);
        if(!expired)timer=setTimeout(attempt,[2000,5000,10000,20000,30000][Math.min(attempts++,4)]);
      }finally{busy=false;}
    }
    window.addEventListener('pageshow',attempt);
    show(document.hidden?'返回游戏后将恢复原房间。':reason);
    void attempt();
  }
  function screen(name,title,subtitle,body,actions=[],color='') {
    document.querySelectorAll('.run-hint,.zx-intro').forEach(node=>node.remove());
    const previous=app.screen;
    const shared=previous?.classList.contains('journey-prep')&&previous.dataset.page!=='entry'&&
      (['home','choose','map'].includes(name)||(name==='entry'&&previous.dataset.page==='map'));
    const node=shared?previous:el('section','',[],{'data-fullscreen':'true'});
    if(shared){
      for(const child of Array.from(node.children))if(!child.classList.contains('journey-scene'))child.remove();
      node.style.opacity='';node.style.pointerEvents='';
    }
    node.className='screen zx zx-'+(name==='difficulty'?'difficulty-page':name);
    node.dataset.page=name;
    if(title){
      const ribbon=titleRibbon(),textMetrics=ribbon.getContext('2d');
      textMetrics.font='bold 32px "Ziling Swei", sans-serif';
      const flag=el('div','paper-title-label',[ribbon,el('h1','',title)],{'data-print-angle':'-3'});
      flag.style.width=(Math.ceil(textMetrics.measureText(title).width)+65)+'px';
      node.classList.add('paper-menu-page');
      const family=['choose','map','difficulty','collection-moves','collection-move-detail','collection-looks','collection-plan'].includes(name)?'sail':'wave';
      const journal=['collection-moves','collection-looks','collection-plan','settings','lab','collection-unlock','collection-rewards','coop','request','request-error'].includes(name);
      if(journal){node.classList.add('collection-journal');node.dataset.paperSurface='journal-cover';}
      node.append(el('header','zx-header '+color,[journal?null:headerCutout(family),flag,subtitle?el('small','',subtitle):null],{'data-paper-surface':'flat'}));
    }
    const content=el('div','zx-body',body);
    if(name==='request'||name==='request-error')content.dataset.paperSurface='flat';
    if(content.firstElementChild?.matches('.paper-stage-slip,.zc-detail-hero,.zx-help-intro,.zx-wallet')){
      content.classList.add('paper-mounted-body');node.classList.add('paper-masthead-page');
    }
    node.append(content);
    if(actions.length){
      const footer=standardFooter(el('footer','zx-footer',actions));
      footer.classList.add('paper-screen-footer');
      node.append(footer);
      if(title&&!footer.classList.contains('paper-single-back'))freePaperActions(node);
    }
    if(!shared)app.setScreen(node);return node;
  }
  async function ready(account) {
    if(authPromise)return authPromise;
    if(profile())return;
    authPromise=(async()=>{
      await app.meta.load(account||await app.backend.guest());
      app.applySettings();
      selected=playableStarter(profile().lastSpecies||profile().starter);
    })().finally(()=>{authPromise=null;});
    return authPromise;
  }
  async function loadPage(title,message,load,show,back,name='request') {
    const indicator=requestIndicator(message);
    const node=screen(name,title,'',[indicator],back?[button('返回',back)]:[]);
    node.classList.add('zx-request-page');
    if(name==='choose')scene.mount(node,current(),null);
    // Journey pages reuse their root. The indicator belongs to this request only.
    const active=()=>app.screen===node&&node.contains(indicator);
    try {
      await load();
    }catch(error){
      if(active())screen('request-error',title,'',[card(text(error.message||'读取失败，请重试。'))],[
        button('重试',()=>loadPage(title,message,load,show,back,name),'primary'),button('返回',back)
      ]);
      return;
    }
    if(active())show();
  }
  function openProfilePage(title,show) {
    if(profile())return show();
    return loadPage(title,'正在读取存档',ready,show,home);
  }
  function openLab() {
    return loadPage('研究所','正在读取星尘与研究进度',()=>profile()?app.meta.resync(true):ready(),lab,home);
  }
  const coopTitle='双人前行';
  const invites=window.roomInvites;
  let checkedSeat=false,joinLobbyInvite=null;
  function openInvite(){
    if(!invites?.code)return false;
    if(app.coopRoom?.open && app.coopRoom.code===invites.code){
      invites.code='';
    }else if(app.run || app.starting || activeEntry || (app.screen?.dataset.page==='coop' && app.coopRoom?.room.state==='started')){
      app.notice('收到房间 '+invites.code+' 的邀请，返回首页后将自动加入。');
    }else if(app.screen?.dataset.page==='coop' && joinLobbyInvite){
      joinLobbyInvite();
    }else{
      document.querySelector('.zx-dialog')?.remove();
      openProfilePage(coopTitle,()=>multiplayer());
    }
    return true;
  }
  function home() {
    if(invites)invites.onInvite=openInvite;
    if(openInvite()){checkedSeat=true;return;}
    if(!checkedSeat){
      checkedSeat=true;
      const seat=savedSeat();
      if(seat)return openProfilePage(coopTitle,()=>multiplayer(seat));
    }
    const p=profile();
    const last=Number(p?.collection?.lastSelected??p?.lastSpecies??p?.starter??4);
    selected=p&&canDeploy(p,last)?last:4;
    const root=screen('home','','',[]);
    root.classList.add('zx-home-fixed');
    let departing=false;
    const startButton=button('开始旅程',async()=>{
      if(departing||activeEntry||app.starting)return;
      if(profile()&&hasJourneyProgress(profile()))return scene.travel('choose',()=>choose());
      departing=true;startButton.disabled=true;
      try{
        await ready();
        if(app.screen!==root)return;
        if(!hasJourneyProgress(profile()))
          return await start({species:defaultStarter,biome:'forest',tier:0,boosts:[],mode:SINGLE_STAGE});
        return await scene.travel('choose',()=>choose());
      }catch(error){app.notice(error.message||'读取存档失败，请重试');}
      finally{departing=false;startButton.disabled=false;}
    },'primary zx-home-start',{'data-action':'journey'});
    const entry=(symbol,label,action,open)=>button([
      homeEntryFace(),el('span','paper-entry-content',[menuSymbol(symbol,32,true),el('span','paper-button-divider',[],{'aria-hidden':true}),el('span','paper-entry-label',label)]),
    ],open,'zx-home-entry zx-home-'+(action==='multiplayer'?'coop':action),{'data-action':action,'data-paper-surface':'flat'});
    const coopButton=entry('duo',coopTitle,'multiplayer',()=>openProfilePage(coopTitle,()=>multiplayer()));
    const labButton=entry('lab','研究所','lab',openLab);
    const helpButton=button([homeEntryFace(),el('span','paper-entry-content',[icon('book',18,'#FFF8E9'),el('span','paper-entry-label','玩法说明')])],()=>help(),'zx-plain zx-home-entry',{'data-action':'help','data-paper-surface':'flat'});
    // Only artwork absorbs height changes. Navigation stays outside any scroll container.
    root.querySelector('.zx-body').remove();
    root.append(
      el('div','zx-home-top',row(button(paperIcon('settings'),()=>openProfilePage('设置',settings),'zx-gear',{'aria-label':'设置','data-action':'settings','data-paper-surface':'flat'}))),
      el('div','zx-home-visual',[],{'aria-hidden':'true'}),
      el('footer','zx-home-dock',[
        startButton,el('div','zx-home-secondary',[coopButton,labButton]),el('div','zx-home-foot',helpButton),
      ],{'data-paper-surface':'flat'}),
    );
    scene.mount(root,current(),p?app.meta.skinFor(selected):null);
  }

  function multiplayer(resume=savedSeat()) {
    let room=null, view=null, busy=false, starting=false, status='', pending='', joiningCode='';
    let reconnectAttempts=0,reconnectTimer;
    let pick=selected;
    async function perform(fn) {
      if(busy || starting)return;
      busy=true;
      clearTimeout(reconnectTimer);
      status='';render();
      try { await fn(); }
      catch(error) { status=error.message || error.errMsg || String(error); }
      finally {
        joiningCode='';busy=false;if(!starting)pending='';
        if(!starting && view.node===app.screen){render();joinInvite();}
        if(!room && resume && !starting && view.node===app.screen && reconnectAttempts<4){
          const delay=[2000,5000,10000,20000][reconnectAttempts++];
          reconnectTimer=setTimeout(()=>{
            if(view.node===app.screen && !room && !busy && !starting)perform(()=>connect(true,resume));
          },delay);
        }
      }
    }
    function action(label,fn,kind='') {
      return button(label,()=>perform(fn),kind);
    }
    function joinInvite(){
      const code=invites?.code;
      if(!code)return false;
      if(code===joiningCode || code===room?.code){invites.code='';return true;}
      if(busy || starting)return true;
      invites.code='';
      const seat=savedSeat();
      perform(()=>connect(true,seat?.code===code?seat:null,code));
      return true;
    }
    async function connect(join,restore=null,inviteCode='') {
      const code=inviteCode || restore?.code;
      if(code===null)return;
      if(join && !/^\d{6}$/.test(code))throw Error('请输入完整的六位房间号');
      joiningCode=code;
      pending=restore?'正在重连原房间':join?'正在加入房间':'正在创建房间';render();
      await ready();
      const options={code,species:pick,name:app.meta.account?.name || '伙伴',factory:window.createCoopSocket};
      let next;
      try {
        next=await RelayRoom.connect({...options,resume:restore});
      }catch(error){
        if(restore && /房间不存在|席位已失效|房间已开局/.test(error.message)){forgetSeat(restore.seat);resume=null;}
        if(inviteCode && restore && /席位已失效/.test(error.message))next=await RelayRoom.connect(options);
        else throw error;
      }
      if(!isLiteSpecies(next.mine?.species)){
        if(next.room.state!=='lobby'){
          next.end('原对局使用已隐藏的字灵',false);
          forgetSeat(next.me);resume=null;
          throw Error('原对局使用已隐藏的字灵，请重新组队');
        }
        try { await next.setPick(pick); }
        catch(error) { await next.leave();throw error; }
      }
      // Keep the old lobby if the invited room is full, closed or already playing.
      if(starting){await next.leave();return;}
      if(room?.open){room.ev={};room.leave();}
      room=next;
      if(next.room.state==='lobby')reconnectAttempts=0;
      rememberSeat(room);
      room.onInterrupted=reason=>recoverBattle(next,reason);
      app.coopRoom=room; status='';
      room.ev={
        change:()=>{rememberSeat(room);if(!starting)render();},
        closed:reason=>{
          if(/移出/.test(reason))forgetSeat(room.me);
          resume=savedSeat();app.coopRoom=null;room=null;status=reason;
          if(!starting){
            render();
            if(resume)reconnectTimer=setTimeout(()=>{
              if(view.node===app.screen && !room)perform(()=>connect(true,resume));
            },2000);
          }
        },
        start:async state=>{
          if(starting)return;
          starting=true;view?.cancelLeave?.();
          const session=room;
          try {
            if(!profile().starter)await app.meta.chooseStarter(session.mine.species);
            rememberSeat(session);
            const world=session.returning?await session.currentWorld():null;
            const ok=await start({species:session.mine.species,biome:'forest',tier:state.tier,mode:'standard',boosts:[],
              coop:{room:session,party:state.party,seed:state.seed,world,progress:world?savedProgress(session):null}});
            if(!ok)throw Error(ui.entryDiagnostics?.error || '开局已取消，请重新组队');
            reconnectAttempts=0;
          } catch(error) {
            if(session.returning){session.end(error.message,false);resume=savedSeat();}
            else {session.cancelStart(error.message);forgetSeat(session.me);await session.leave();}
            room=null;app.coopRoom=null;starting=false;pending='';status=error.message;render();
          }
        },
      };
      if(room.room.state==='started')await room.ev.start(room.room);
    }
    function mountLobby() {
      const roomNumber=el('b','coop-number'),count=el('small','coop-count');
      const note=el('p','coop-note',[],{'role':'status','aria-live':'polite'});
      const roomTag=el('small','coop-room-tag','待组队');
      const ticket=el('div','coop-ticket',[col(el('small','','房间号'),roomNumber),roomTag],{'data-paper-surface':'bound-index'});
      const section=(title,extra=null)=>el('div','coop-section',[el('b','',title),el('i','',[],{'aria-hidden':true}),extra]);
      function wordArt(c){
        const canvas=el('canvas','coop-word',[],{'data-static':true,'aria-hidden':true});
        drawMenuGlyph(canvas,c.word,c.tone,false);return canvas;
      }
      const seats=Array.from({length:COOP_ROOM_SIZE},()=>{
        const tag=el('small','coop-role'),art=el('div','coop-seat-art'),name=el('b','coop-name'),state=el('small','coop-state');
        const tile=el('div','coop-seat zx-stat-row',[tag,art,name,state],{'data-paper-surface':'coop-seat'});
        return {tag,art,name,state,tile};
      });
      const roster=el('div','coop-roster zx zx-collection zc-library',[],{'data-paper-surface':'bound-index'});
      let filter='all',shownPick=null,shownFilter=null;
      function selectRoomCharacter(id){
        return perform(async()=>{
          if(!canDeploy(profile(),id)){
            getCollection().unlock(id,()=>{
              if(starting)return;
              shownPick=null;app.setScreen(node);render();
            });
            return;
          }
          if(room && room.mine?.species!==id)await room.setPick(id);
          pick=id;
        });
      }
      function updatePicker(active){
        if(active===shownPick&&filter===shownFilter)return;
        const oldScroll=filter===shownFilter?roster.querySelector('.zc-library-scroll')?.scrollTop||0:0;
        shownPick=active;shownFilter=filter;
        roster.replaceChildren(getCollection().rosterPicker(active,filter,key=>{
          filter=key;updatePicker(room?.mine?.species??pick);
        },selectRoomCharacter));
        if(oldScroll)roster.querySelector('.zc-library-scroll').scrollTop=oldScroll;
      }
      async function join(){
        let code='',error='';
        while(!room && app.screen===node){
          code=await askCoopCode({el,button,parent:app.ui,screen:node,trigger:second,previous:code,error});
          if(code===null)return;
          try{await connect(true,null,code);return;}
          catch(cause){error=cause.message||cause.errMsg||'加入失败，请重试';status='';render();}
        }
      }
      let cancelLeave=null;
      function confirmLeave(){
        return new Promise(resolve=>{
          const finish=value=>{prompt.close();cancelLeave=null;resolve(value);};
          const confirm=button('确认离开',()=>finish(true),'primary',{'data-action':'coop-confirm-leave'});
          const prompt=openPaperPrompt({el,button,parent:app.ui,screen:node,trigger:node.querySelector('.paper-back'),
            title:'离开房间？',hint:el('p','paper-prompt-hint','离开后将释放你的席位，返回联机大厅。'),
            confirm,onCancel:()=>finish(false),closeAction:'coop-leave-close',cancelLabel:'留在房间'});
          cancelLeave=()=>finish(false);
        });
      }
      async function back(){
        if(!room){home();return;}
        const session=room;
        if(!await confirmLeave()||room!==session||starting)return;
        session.ev={};forgetSeat(session.me);resume=null;
        status='正在离开房间…';render();
        await session.leave();
        room=null;app.coopRoom=null;status='';
      }
      const reconnect=action('重连原房间',()=>connect(true,resume),'zx-plain coop-aux');
      const first=action('',async()=>room?room.setReady(!room.mine.ready):connect(false),'primary');
      const second=action('',async()=>room?room.start():join());
      first.dataset.action='coop-first';second.dataset.action='coop-second';
      first.dataset.paperSurface='trade-action';second.dataset.paperSurface='trade-action';
      const body=[ticket,section('队伍席位',count),el('div','coop-seats',seats.map(s=>s.tile)),
        section('我的字灵'),roster,el('div','coop-status',[note,reconnect])];
      const node=screen('coop',coopTitle,'和队友一起探索桌上世界',body,[action('返回',back),first,second]);
      node.querySelector('.zx-footer').classList.add('coop-actions');
      node.querySelector('.zx-body').dataset.paperSurface='flat';freePaperActions(node);
      function update(){
        const session=room,members=session?.room.members||[],mine=session?.mine;
        if(!session)cancelLeave?.();
        const active=mine?.species??pick;
        const online=members.filter(m=>!m.offline);
        const allReady=online.length>=2&&online.every(m=>m.ready);
        node.dataset.roomState=!session?'lobby':allReady?'ready':online.length<2?'waiting':'preparing';
        node.setAttribute('aria-busy',String(busy||starting));
        node.querySelector('.paper-back').setAttribute('aria-label',session?'离开房间，返回大厅':'返回首页');
        updateText(roomNumber,session?session.code.slice(0,3)+' '+session.code.slice(3):'尚未进入房间');
        updateText(roomTag,!session?'待组队':allReady?'已就绪':online.length<2?'待队友':'待准备');
        updateText(count,session?members.length+' / '+COOP_ROOM_SIZE+' 人':'组队前');
        seats.forEach(({tag,art,name,state,tile},index)=>{
          const member=members.find(m=>m.slot===index);
          const preview=!session&&index===0;
          const local=preview||!!member&&member.id===session.me;
          const actor=member?character(member.species):preview?character(pick):null;
          updateText(tag,preview?'自己':member?(member.id===session.room.host?'房主':'队员'):'');
          if(art.dataset.word!==(actor?.word||'')){
            art.replaceChildren(actor?wordArt(actor):el('span','coop-vacancy','＋',{'aria-hidden':true}));art.dataset.word=actor?.word||'';
          }
          updateText(name,local?'你':member?(member.name||'队友'):'等待队友');
          updateText(state,member?(member.offline?'暂离':member.ready?'已准备':'未准备'):preview?'待入房':'');
          tile.classList.toggle('empty',!actor);state.classList.toggle('ready',!!member?.ready&&!member.offline);
          tile.classList.toggle('local',local);tile.classList.toggle('is-ready',!!member?.ready&&!member.offline);
          tile.classList.toggle('offline',!!member?.offline);
          let kick=tile.querySelector('button');
          if(session?.isHost&&member?.offline){
            if(kick?.dataset.seat!==member.id){kick?.remove();kick=action('移出',()=>session.kick(member.id),'zx-plain coop-kick');kick.dataset.seat=member.id;tile.append(kick);}
          }else kick?.remove();
        });
        updatePicker(active);
        reconnect.hidden=!!session||!resume;
        const hint=!session?'创建房间，或输入六位房间号加入队友。':online.length<2?'把六位房间号发给队友，等对方加入。':allReady?(session.isHost?'队伍已就绪，可以出发。':'队伍已就绪，等待房主开始。'):'两人都准备好后，由房主开始冒险。';
        updateText(note,pending||status||hint);
        note.classList.toggle('error',!!status&&!pending);
        updateText(first,session?(mine?.ready?'取消准备':'准备'):'创建房间');
        first.classList.toggle('primary',!session||!mine?.ready);
        updateText(second,!session?'加入房间':session.isHost?'开始冒险':'等待房主');
        second.disabled=!!session&&(!session.isHost||!allReady);
        second.classList.toggle('primary',!!session&&!second.disabled);
        second.dataset.paperSurface='trade-action';
      }
      return {node,update,cancelLeave:()=>cancelLeave?.()};
    }
    function render() {
      if(!view||view.node!==app.screen)view=mountLobby();
      if(view.node===app.screen)view.update();
    }
    render();
    joinLobbyInvite=joinInvite;
    if(!joinInvite()&&resume)perform(()=>connect(true,resume));
  }
  let collection;
  function getCollection() {
    collection??=createCollectionUI(app,api,{el,button,icon,screen,home,scene,confirm:id=>{
      if(!canDeploy(profile(),id))return;
      selected=id;
      if(profile().lastSpecies!==id){
        profile().lastSpecies=id;
        void app.meta.saveNow();
      }
      return scene.travel('map',map);
    }});
    ui.collection=collection;return collection;
  }
  function choose(preserve=false) {
    if(!profile())return loadPage('选择字灵','正在读取存档',ready,()=>choose(preserve),home,'choose');
    getCollection().open(!preserve);
  }
  let mapRead=null;
  function map() {
    const tierLimit=()=>Math.max(0,Math.min(2,app.meta.biomeTier(selectedDestination.id)));
    function stateMark(node,state){
      const prev=node.querySelector('.paper-choice-mark');
      if(prev?.dataset.icon!==state){prev?.remove();node.append(choiceMark(state));}
    }
    const itinerary=el('span','zx-route-distance');

    const feature=el('div','zx-destination-feature'),otherStations=el('div','zx-destination-others');
    const modeHint=el('small','zx-difficulty-hint');
    const indexHeading=el('div','journey-station-key',el('b','','后续关卡'));

    const syncNote=small('');
    const stations=destinations.map(stage=>el('button','zx-album-station',[stagePrint(stage.art,'zx-station-print'),
      el('small','journey-station-label'),el('div','zx-destination-caption',el('b','zx-destination-title',stage.name))],{type:'button','data-stage':stage.id,
      'data-paper-surface':'route-station',disabled:!stage.released,
      onclick:()=>{if(stage.released&&stage!==selectedDestination){selectedDestination=stage;refresh();}}}));
    const modes=difficulties.map(option=>el('button','zx-album-mode',[
      el('h3','',option.name),
    ],{type:'button','data-tier':option.tier,'data-mode':option.mode,
      onclick:()=>{if(option.tier<=tierLimit()){selectedDifficulty=option;refresh();}}}));
    let departing=false;
    const enter=button('',async()=>{
      if(departing)return;
      if(!selectedDestination.released||selectedDifficulty.tier>tierLimit()){refresh();return;}
      departing=true;
      const page=app.screen,config={species:selected,biome:selectedDestination.id,tier:selectedDifficulty.tier,boosts:[],mode:selectedDifficulty.mode};
      try{
        await scene.travel('entry',()=>app.screen===page&&page.dataset.page==='map'?start(config,synced):false);
      }finally{departing=false;}
    },'primary',{'data-action':'enter'});
    let stamp,stampMode;
    function refresh(){
      const progress=profile().stageUnlocks??profile().biomes??{};
      syncNote.hidden=!profile().cloudSaveError;
      updateText(syncNote,syncNote.hidden?'':'当前显示本机进度 · '+profile().cloudSaveError);
      const max=tierLimit();
      if(selectedDifficulty.tier>max)selectedDifficulty=difficulties[1+max];
      stations.forEach((node,i)=>{
        const stage=destinations[i],chosen=stage===selectedDestination;
        node.setAttribute('aria-pressed',String(chosen));
        node.classList.toggle('zx-destination-hero',chosen);
        node.dataset.paperSurface=chosen?'destination-cover':'station-index-row';
        const parent=chosen?feature:otherStations;
        if(node.parentNode!==parent)parent.append(node);
        const stationTag=node.querySelector('.journey-station-label');
        const status=stage.released?stage.station:stage.id in progress?'内容待开放':'暂未开放';
        updateText(stationTag,status);
        node.setAttribute('aria-label',stage.name+' · '+(!stage.released&&stage.id in progress?'进度已解锁 · 内容待开放':status));
        stationTag.dataset.paperSurface=chosen?'destination-ribbon':'flat';
        stationTag.hidden=false;

        if(chosen&&!node.contains(itinerary))node.querySelector('.zx-destination-caption').append(itinerary);
        stateMark(node,chosen?'check':stage.released?'radio-empty':'lock');
      });
      modes.forEach((node,i)=>{
        const option=difficulties[i],locked=option.tier>max,chosen=option===selectedDifficulty;
        node.dataset.paperSurface='difficulty-segment';
        node.disabled=locked;
        node.setAttribute('aria-pressed',String(chosen));
        const description=locked?option.locked:option.note.join('，');
        node.setAttribute('aria-label',option.name+'，'+description);
        if(chosen)updateText(modeHint,description);
        stateMark(node,locked?'lock':chosen?'check':'radio-empty');
      });
      const stampKey=selectedDestination.id+'/'+selectedDifficulty.mode;
      if(stampMode!==stampKey){
        stamp?.remove();stamp=itineraryStamp(selectedDestination.regions,selectedDifficulty.mode===SINGLE_STAGE);
        const cover=feature.firstElementChild;
        cover.insertBefore(stamp,cover.querySelector('.journey-station-label'));
        stampMode=stampKey;
      }
      updateText(itinerary,selectedDifficulty.mode===SINGLE_STAGE?'1 个区域 / 进门通关':selectedDestination.regions+' 个区域 / 圣地终战');
      updateText(enter,'进入'+selectedDestination.name);
    }
    refresh();
    const node=screen('map','选择关卡','',[
      el('section','zx-station-list',[feature,el('div','journey-station-index',[indexHeading,otherStations],{'data-paper-surface':'journey-stations'})],{'aria-label':'出发地点'}),
      el('section','zx-route-paper',[el('div','zx-difficulty-heading',[el('h2','zx-album-heading','挑战难度'),modeHint]),
        albumRows(modes,4,'zx-mode-list')],{'aria-label':'挑战难度'}),
      syncNote,
    ],[enter,button('返回',()=>scene.travel('choose',()=>choose(true)),'',{'data-action':'route-back'})]);
    node.classList.add('zx-route-page');
    const body=node.querySelector('.zx-body');
    const sheet=el('div','route-binding',[],{'data-paper-surface':'bound-index'});
    sheet.append(node.querySelector('.zx-station-list'),node.querySelector('.zx-route-paper'));
    body.insertBefore(sheet,body.firstChild);
    body.insertBefore(el('div','journey-air',[],{'aria-hidden':'true'}),sheet);
    scene.mount(node,current(),app.meta.skinFor(selected));
    node.querySelector('.zx-body').dataset.paperSurface='flat';
    freePaperActions(node);
    // Reuse an in-flight read if the player goes back and opens the map again.
    mapRead??=app.meta.resync().finally(()=>{mapRead=null;});
    const synced=mapRead;
    synced.then(()=>{if(enter.isConnected)refresh();});
  }
  function loadingScreen(name,coop=false,onBootProgress=null){
    const ticket=onBootProgress?null:el('canvas','zx-entry-ticket',[],{width:780,height:152,'data-static':'true',
      role:'progressbar','aria-label':'场景加载进度','aria-valuemin':0,'aria-valuemax':100});
    const node=screen(name,'','',ticket?[ticket]:[]);
    node.classList.add('zx-loading-screen','journey-entry');
    node.querySelector('.zx-body').dataset.paperSurface='flat';
    scene.mount(node);
    const captions={
      '同步关卡进度':'正在同步关卡进度','保存出发设置':'正在保存出发设置','准备对局':'正在布置桌上世界',
      '绘制桌面与纸张':'正在绘制桌面','准备角色与场景物件':'正在布置桌上世界','摆放场景物件':'正在摆放桌面物件',
      '准备字灵':'正在准备字灵','准备战斗特效':'正在准备战斗特效','准备场景特效':'正在准备场景特效',
      '准备进入场景':'正在绘制首帧','准备完成':'桌上世界已就绪',
    };
    let shown=-1,caption='';
    function update({progress=0,phase,teamReady=false,teamStatus=''}){
      if(coop)progress=teamReady?1:Math.min(.9,progress);
      const next=Math.max(shown,Math.min(100,Math.max(0,Math.floor(progress*100))));
      const label=teamStatus||captions[phase]||'正在布置场景';
      if(next===shown&&label===caption)return shown;
      shown=next;caption=label;
      if(onBootProgress){onBootProgress({progress:shown/100,phase});return shown;}
      const ctx=ticket.getContext('2d');
      ctx.setTransform(2,0,0,2,0,100);ctx.clearRect(0,-50,390,76);
      paintLoadingSlip(ctx,shown,caption);
      ticket.setAttribute('aria-valuenow',shown);ticket.setAttribute('aria-valuetext',caption+' '+shown+'%');
      window.invalidateUI?.();return shown;
    }
    update({});return {node,update};
  }
  async function start(config={species:selected,biome:'forest',tier:selectedDifficulty.tier,boosts:[],mode:selectedDifficulty.mode},mapProgress=null,preparedOpening=null,forceOpening=false,onBootProgress=null,prepareProfile=null) {
    if(activeEntry||app.starting)return false;
    const firstJourney=!config.coop&&config.mode===SINGLE_STAGE&&(forceOpening||!hasJourneyProgress(profile()));
    let cancelled=false,lastPhase='',lastDetailAt=0;
    const began=performance.now(),phases=[],packs=new Map(),percentages=[0];
    const view=loadingScreen('entry',!!config.coop,onBootProgress),{node}=view;
    activeEntry=node;
    const opening=firstJourney?(preparedOpening||window.playJourneyOpening?.()):null;
    app.entryOpening=opening;
    const diagnostics=ui.entryDiagnostics={phases,percentages,status:'loading'};
    const update=({phase:title,detail:message='',progress=0,teamReady,teamStatus})=>{
      if(cancelled)return;
      const now=performance.now();
      const changed=lastPhase!==title;
      if(changed){lastPhase=title;phases.push({phase:title,atMs:Math.round(now-began)});}
      if(app.screen!==node)return;
      if(changed||now-lastDetailAt>120||!message||progress*100>percentages[percentages.length-1]){
        const value=view.update({progress,teamReady,teamStatus,phase:title});lastDetailAt=now;
        if(value!==percentages[percentages.length-1])percentages.push(value);
      }
    };
    const abandoned=()=>{if(app.screen===node)return false;cancelled=true;return true;};
    try {
      // Give the loading screen a frame before disk/decoder work starts.
      await waitForLoadingPaint(app.r.renderer);
      if(abandoned())return false;
      // Profile sync can wait on the network. Install scene packs alongside
      // it, but join both before choosing a starter or writing any progress.
      const profileWeight=prepareProfile ? .05 : 0;
      // Install wind artwork before native texture loading starts its timeout.
      // Co-op can include a wind teammate regardless of the local starter.
      const needsWind=!!config.coop||character(config.species).tone==='wind';
      const requiredPacks=['world','art',...(needsWind?['wind']:[])];
      let profileDone=!prepareProfile,packProgress=0;
      await Promise.all([prepareProfile?Promise.resolve().then(prepareProfile).then(()=>{
        profileDone=true;update({phase:'存档已就绪',progress:profileWeight+packProgress});
      }):null,Promise.resolve().then(()=>window.prepareForest?.(state=>{
        packs.set(state.name,state);
        const pending=[...packs.values()].find(s=>s.phase!=='ready')||state;
        const name=pending.name==='world'?'场景':pending.name==='wind'?'风系特效':'字灵';
        const action={download:'下载',unpack:'解压',write:'保存',ready:'已准备',error:'准备失败'}[pending.phase];
        // Each pack has download, unpack and write work. Reserve the remaining
        // 60% for the scene, actors and first rendered frame, including cache hits.
        const fraction=s=>!s?0:s.phase==='ready'?1:s.phase==='download' ? .55*(s.total?s.completed/s.total:0):s.phase==='unpack' ? .55:s.phase==='write' ? .7+.3*(s.total?s.completed/s.total:0):0;
        packProgress=(.4-profileWeight)/requiredPacks.length*requiredPacks.reduce((sum,name)=>sum+fraction(packs.get(name)),0);
        const waiting=!profileDone&&packProgress>=.4-profileWeight;
        update({phase:waiting?'同步存档':action+name+'资源',detail:pending.phase==='download'?'正在下载所需资源':pending.total?pending.completed+' / '+pending.total:'正在处理资源',progress:packProgress+(profileDone?profileWeight:0)});
      },{wind:needsWind}))]);
      if(abandoned())return false;
      if(mapProgress){
        if(mapRead===mapProgress)update({phase:'同步关卡进度',progress:.4});
        await mapProgress;
        if(abandoned())return false;
        if(config.tier>Math.max(0,app.meta.biomeTier(config.biome))){
          diagnostics.status='cancelled';
          map();
          app.notice('关卡进度已更新，请重新选择难度。');
          return false;
        }
      }
      update({phase:'保存出发设置',progress:.4});
      if(!profile().starter)await app.meta.chooseStarter(config.species);
      if(abandoned())return false;
      profile().lastBiome=config.biome;profile().lastSpecies=config.species;await app.meta.saveNow();
      if(abandoned())return false;
      const ok=await app.startRun(config,update);
      if(!ok)throw app.lastStartError||Error('对局未能开始，请重试');
      if(firstJourney){
        profile().firstJourneyPlayed=true;
        app.meta.saveNow();
      }
      diagnostics.status='ready';
      return true;
    }catch(error){
      diagnostics.status='error';diagnostics.error=error.message||String(error);
      if(!cancelled&&!config.coop){
        const destination=destinations.find(stage=>stage.id===config.biome)?.name??selectedDestination.name;
        const errorPage=screen('entry-error','暂时未能进入','',[
          el('div','zx-entry-slip',[menuSymbol('disconnected',48),el('div','zc-copy',[
            el('b','',destination),small(lastPhase||'准备场景')]),text(diagnostics.error,'zx-entry-message')],{'data-paper-surface':'album-page'}),
        ],[button('返回选择',map),button('重新进入',()=>start(config,mapProgress,null,forceOpening,null,prepareProfile),'primary',{'data-action':'retry-entry'})]);
        errorPage.querySelector('.zx-body').dataset.paperSurface='flat';
      }
      return false;
    }finally{
      opening?.dispose();
      if(app.entryOpening===opening)app.entryOpening=null;
      diagnostics.totalMs=Math.round(performance.now()-began);
      if(cancelled)diagnostics.status='cancelled';
      if(activeEntry===node)activeEntry=null;
    }
  }
  function wallet() {
    return el('div','zx-wallet lab-balance',[menuSymbol('stardust',45),el('div','lab-funds',[
      el('small','','持有星尘'),el('strong','',number(profile().stardust))]),
      el('i','lab-help-rule',[],{'aria-hidden':true}),
      button('如何获得  ›',dustHelp,'zx-plain',{'data-action':'dust-help','data-paper-surface':'flat'})],{'data-paper-surface':'lab-balance'});
  }
  function labValue(item,level) {
    const value=item.id==='ult'?ultimateResearchBonus(level):item.per*level;
    return '+'+(['maxHp','armor','luck','pickupRange','regen'].includes(item.stat)?Number(value.toFixed(2))+(item.stat==='regen'?'/秒':item.stat==='pickupRange'?' 厘米':''):percent(value));
  }
  function researchRow(item) {
    const [word,name]=labNames[item.id],level=app.meta.lab(item.id),full=level>=item.max;
    const cost=full?0:item.cost(level),shortfall=Math.max(0,cost-profile().stardust);
    const price=button(full?'已满级':[menuSymbol('star',16),el('b','',number(cost))],()=>research(item),'lab-price',
      {disabled:full,'data-research':item.id,'data-paper-surface':full?'flat':'lab-price','data-poor':shortfall>0,
        'aria-label':full?name+'已满级':name+'，升级消耗 '+number(cost)+' 星尘'+(shortfall?'，还差 '+number(shortfall):'')});
    return el('div','lab-record',[stagePortrait({word},null,false,'move-stamp'),
      el('div','lab-item-copy',[
        el('div','lab-item-head',[el('b','',name),el('small','','Lv.'+level+'/'+item.max)]),
        el('div','lab-values',[el(full?'b':'span','lab-current',labValue(item,level)),
          full?null:el('span','lab-arrow','→'),full?null:el('b','',labValue(item,level+1))]),
        el('div','lab-pips',Array.from({length:item.max},(_,i)=>el('i',i<level?'on':'')),{'aria-hidden':true}),
      ]),el('div','lab-price-slot',[price,shortfall?el('small','','差 '+number(shortfall)):null])]);
  }
  function lab(message='') {
    const names=['战斗','生存','成长'],list=labGroups[labTab].map(id=>laboratory.find(item=>item.id===id));
    const node=screen('lab','研究所','永久强化 · 对所有字灵生效',[
      wallet(),el('div','zx-lab-tabs zc-album-tabs',names.map((name,i)=>albumTab(el,button,name,i===labTab,()=>{labTab=i;lab();},{'data-paper-surface':'profile-switch'}))),
      el('section','lab-register',[
        el('div','lab-columns',[el('b','',names[labTab]+'研究'),el('small','','升级消耗')]),
        el('div','lab-rows',list.map(researchRow)),
        el('p','lab-footnote',message||(profile().cloudSaveError?'本机进度 · '+profile().cloudSaveError:'研究加成从下一局生效'),{role:'status'}),
      ],{'data-paper-surface':'bound-index'}),
    ],[button('返回',home)]);
    node.querySelector('.zx-body').dataset.paperSurface='flat';
    freePaperActions(node);
  }
  function overlay(title,subtitle,body,actions=[],hud=null,kind='') {
    if(hud)document.querySelectorAll('.run-hint,.zx-intro').forEach(node=>node.remove());
    const titleNode=el('h2','',title);
    const framed=!!hud&&!kind.includes('zx-first-batch-upgrade');
    if(!framed&&!kind.includes('zx-first-batch-upgrade'))paperDialogTitle(titleNode);
    const heading=framed?[]:[subtitle?small(subtitle):null,titleNode];
    const content=el('section','zx zx-modal '+kind,[...heading,...body,...actions]);
    frameChoiceCards(content);
    let wrap;
    if(hud){wrap=hud.modal(framed?battleDialogFrame(content,titleNode,subtitle):content);wrap.className='zx zx-modal-wrap';}
    else {document.querySelector('.zx-dialog')?.remove();wrap=el('div','zx zx-modal-wrap zx-dialog',content);mountMenuDialog(app.ui,wrap,app.screen);}
    const dismiss=actions.find(action=>action?.classList.contains('paper-back')||action?.dataset.action==='close-battle-map');
    if(dismiss)dockDialogClose(wrap,dismiss);
    if(kind.split(' ').includes('zx-upgrade')){
      if(window.animateModal)window.animateModal(wrap);
      else{
        wrap.animate([{opacity:0},{opacity:1}],{duration:200,easing:'ease-out'});
        content.animate([{transform:'translateY(12px) scale(.97)'},{transform:'translateY(0) scale(1)'}],{duration:200,easing:'ease-out'});
      }
    }
    return wrap;
  }
  function savedCard(result={},rescued=false) {
    // A delayed acknowledgement must not dismiss a new run or its current modal.
    if(app.run&&!['over','dead'].includes(app.run.state)){
      app.notice('上局结算已完成，奖励已保存。');return null;
    }
    document.querySelectorAll('.zx-saved-wrap').forEach(node=>node.remove());
    const count=value=>Number.isFinite(Number(value))?Math.max(0,Math.floor(Number(value))):0;
    const captures=new Set(result.progress?.league||[]).size,shinies=new Set(result.progress?.shinies||[]).size;
    const metrics=[['时长',time(count(result.time))],['击败',number(count(result.kills))],['等级','Lv.'+Math.max(1,count(result.level))]];
    const rewards=[];
    if(captures)rewards.push(el('span','zx-saved-reward','新收录字灵 +'+captures));
    if(shinies)rewards.push(el('span','zx-saved-reward shiny','异色字灵 +'+shinies));
    const classics=new Set(result.progress?.classics||[]).size;
    if(classics)rewards.push(el('span','zx-saved-reward','经典异色 +'+classics));
    const homePage=app.screen?.dataset.page==='home';
    let wrap;
    const close=()=>wrap.remove();
    const panel=el('section','zx zx-modal zx-saved-run',[
      battleDialogHeading(el('h2','','上局结算')),
      el('div','zx-saved-body',[
        el('div','zx-receipt',[
          settlementTicket(),el('div','zx-receipt-content',[
            el('b','zx-receipt-status','旅程已归档'),
            el('div','zx-receipt-metrics',metrics.map(([label,value])=>el('div','zx-receipt-stat',[
              el('span','',label),el('b','',value),
            ]))),
            text(rescued?'按离开时的进度结算，奖励已保存。':'奖励与收录进度已保存。','zx-receipt-note'),
          ]),
        ]),
        ...(rewards.length?[el('div','zx-saved-rewards',rewards)]:[]),
      ]),
    ],{role:'dialog','aria-modal':'true','aria-label':'上局结算已完成','data-paper-surface':'flat','data-saved-state':rescued?'recovered':'saved'});
    wrap=el('div','zx zx-modal-wrap zx-saved-wrap',panel);
    dockDialogClose(wrap,button([],close,'',{'data-action':'saved-return'}),homePage?'关闭结算并返回首页':'关闭结算');
    mountMenuDialog(app.ui,wrap,app.screen);return wrap;
  }
  function research(item) {
    const level=app.meta.lab(item.id),cost=item.cost(level),dust=profile().stardust,can=dust>=cost;
    if(level>=item.max)return;
    const [word,name]=labNames[item.id],title=can?'提升一级':'星尘不足';
    let popup;const close=()=>popup.remove();
    const errorNote=el('p','lab-research-error','',{role:'alert'});
    errorNote.hidden=true;
    const dismiss=button('取消',close,'',{'data-action':'research-close'});
    const act=can?button('确认研究',async()=>{
      act.disabled=true;dismiss.disabled=true;errorNote.hidden=true;
      try {
        app.meta.flush();await app.meta.queue;
        app.meta.adopt(await app.backend.buyLab(app.meta.account,item.id,level+1));
        close();lab(name+'已升至 Lv.'+(level+1)+'，下一局加成 '+labValue(item,level+1));
      } catch(error) {
        try{await app.meta.resync();}catch{/* A failed refresh still leaves the purchase retryable. */}
        if(!popup.isConnected)return;
        if(app.meta.lab(item.id)>level){close();lab(name+'已升至 Lv.'+app.meta.lab(item.id));return;}
        errorNote.textContent=error.message||'这次研究未保存，请重试。';errorNote.hidden=false;
        act.textContent='重试研究';act.disabled=false;dismiss.disabled=false;
      }
    },'primary',{'data-action':'confirm-research'}):
      button('去获取星尘',()=>{close();choose();},'primary',{'data-action':'research-adventure'});
    dismiss.dataset.paperSurface='trade-action';act.dataset.paperSurface='trade-action';
    const summary=(label,value,cls='')=>el('div','lab-total '+cls,[el('span','',label),el('b','',number(value))]);
    const panel=el('section','zx lab-dialog',[
      el('div','lab-dialog-head',[el('div','lab-dialog-heading',[el('small','','永久研究'),el('h2','',title)]),stagePortrait({word},null,false,'move-stamp')]),
      el('div','lab-preview',[el('b','',name+'   Lv.'+level+' → '+(level+1)),el('b','',labValue(item,level)+' → '+labValue(item,level+1))]),
      summary('持有星尘',dust),summary(can?'本次消耗':'升级需要',cost),summary(can?'升级后剩余':'还差星尘',Math.abs(dust-cost),can?'':'shortfall'),
      el('small','lab-dialog-note','对所有字灵生效，从下一局起应用。'),errorNote,paperDecisionActions(el,dismiss,act),
    ],{role:'dialog','aria-modal':true,'aria-label':title,'data-paper-surface':'bound-index'});
    document.querySelector('.zx-dialog')?.remove();
    popup=el('div','zx zx-modal-wrap zx-dialog lab-overlay',panel);
    mountMenuDialog(app.ui,popup,app.screen);
  }
  function dustHelp() {
    readingDialog(app.ui,app.screen,app.screen.querySelector('[data-action="dust-help"]'),'星尘从哪里来',[
      ['stardust','旅程结算','探索、击败敌人和镇守可获得星尘。每局结算一次，可在研究所使用。'],
      ['collect','挑战失败也有收益','按已完成的探索和挑战结算星尘。通关进度需击败关卡镇守。'],
    ],'dust-close');
  }
  function settings(back=home) {
    const s=profile().settings;
    const save=()=>{app.applySettings();app.meta.save();};
    function volume(label,key){
      const value=s[key]??api.defaults[key];
      const readout=small(percent(value));
      const slider=el('input','zx-range',[],{type:'range',min:0,max:1,step:.01,value,'aria-label':label});
      slider.addEventListener('input',()=>{
        s[key]=Number(slider.value);
        readout.textContent=percent(s[key]);
        save();
      });
      return el('div','zx-setting',[row(el('b','',label),readout),slider]);
    }

    const presets=[
      ['low','流畅','降低场景分辨率，简化阴影、光效和掉落表现。'],
      ['medium','均衡','固定中等场景清晰度，保留柔和阴影。'],
      ['high','精致','固定高清场景，保留完整光效与更多特效细节。'],
    ];
    const choices=el('div','zx-options');
    const description=small('');
    function showQuality(){
      const selected=s.quality??api.defaults.quality;
      for(const [i,[value,,note]] of presets.entries()){
        const active=value===selected;
        choices.children[i].classList.toggle('on',active);
        choices.children[i].setAttribute('aria-pressed',String(active));
        if(active)description.textContent=note;
      }
    }
    for(const [value,label] of presets){
      choices.append(el('button','zx-option',label,{type:'button',onclick:()=>{
        selectGraphicsQuality(s,value);showQuality();save();
      }}));
    }
    showQuality();

    const lock=el('button','zx-switch'+(s.lock30Fps?' on':''),el('i'),{
      type:'button',role:'switch','aria-label':'锁定 30 帧','aria-checked':!!s.lock30Fps,
      onclick:()=>{
        setFrameRateLock(s,!s.lock30Fps);
        lock.classList.toggle('on',s.lock30Fps);
        lock.setAttribute('aria-checked',String(s.lock30Fps));
        save();
      },
    });
    const scroll=el('div','zx-settings-scroll',[
      card(volume('总音量','master'),volume('音效','sfx')),
      card(el('div','zx-setting',[row(el('b','','画质'),choices),description]),
        el('div','zx-setting',row(col(el('b','','锁定 30 帧'),small(frameRateHelp)),lock))),
    ],{'aria-label':'设置选项'});
    for(const section of scroll.children)section.dataset.paperSurface='flat';
    const page=screen('settings','设置','仅调整当前设备的体验',[scroll],
      [small('调整即时生效'),button('返回',async()=>{await app.meta.saveNow();app.setScreen(null);back();})]);
    page.querySelector('.zx-body').dataset.paperSurface='bound-index';
    freePaperActions(page);
  }
  function help() {
    if(document.querySelector('.zx-guide-overlay'))return;
    const pauseSheet=app.run?.ui?.modalEl;
    const host=pauseSheet?.classList.contains('zx-pause-screen')?pauseSheet:app.ui;
    const trigger=host.querySelector('[data-action="help"]');
    const instructions=[
      ['move','移动','按住空白处拖动，松手停下。移动时也能用另一只手点大招。'],
      ['collect','攻击与拾取',`招式自动释放，靠近即可拾取经验、金币和道具。碰到蓝骰子即可免费抽取道具，红骰子消耗标价金币。`],
      ['burst','释放大招','大招就绪后，点大招按钮释放。'],
    ];
    readingDialog(host,host===pauseSheet?pauseSheet:app.screen,trigger,'玩法说明',instructions,'guide-close',true);
  }
  function journalDialog(panel){
    panel.classList.add('zx-journal-dialog');
    panel.dataset.paperSurface='bound-index';
    panel.querySelector('h2').dataset.paperSurface='destination-ribbon';
    return panel;
  }
  function readingDialog(host,screenNode,trigger,title,instructions,action){
    if(host.querySelector('.zx-guide-overlay'))return;
    const panel=el('section','zx-guide-paper',[
      el('h2','',title),
      el('div','zx-guide-scroll',instructions.map(([symbol,title,desc])=>el('div','zx-guide-row',[
        el('span','zx-guide-mark',menuSymbol(symbol,25)),el('div','zx-guide-copy',[el('b','',title),text(desc)])]))),
    ],{role:'dialog','aria-modal':true,'aria-label':title,'data-paper-surface':'bound-index'});
    const wrap=el('div','zx zx-modal-wrap zx-guide-overlay',panel);
    const close=()=>{wrap.remove();trigger?.focus?.({preventScroll:true});};
    const dismiss=button([],close,'',{'data-action':action});
    dockDialogClose(wrap,dismiss,'关闭'+title);
    wrap.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}
      if(event.key!=='Tab')return;
      const focusable=[...wrap.querySelectorAll('button,a[href]')].filter(n=>!n.closest('[hidden]'));
      const i=focusable.indexOf(document.activeElement);
      event.preventDefault();focusable[(i+(event.shiftKey?-1:1)+focusable.length)%focusable.length]?.focus();
    });
    mountMenuDialog(host,wrap,screenNode);dismiss.focus();
  }
  function stats(run=null,back=choose,tab=0) {
    const c=run?character(run.player.speciesId):current(),s=run?run.player.stats:api.startingStats(selected);
    const item=(label,value,note,click)=>{const a=card(small(label),el('strong','',value),small(note));if(click){a.setAttribute('role','button');a.addEventListener('click',click);}return a;};
    const preview=()=>stats(run,back,tab);
    const body=[el('div','paper-info-hero',[glyph(c),col(el('b','',c.word+' · '+(run?'Lv.'+run.player.level:'开局属性')),small(run?'桌上世界 · 已暂停':'基础 + 永久研究'))]),
      ...(run?[el('nav','zx-team-tabs zx-lab-tabs zc-album-tabs',['战斗属性','成长属性'].map((name,i)=>albumTab(el,button,name,i===tab,()=>stats(run,back,i),{'data-stat-tab':i})))]:[])];
    if(tab===0)body.push(el('div','zx-stat-grid',[
      row(item('全局伤害倍率',percent(s.damage),'查看加成来源',()=>damageSources(run,preview)),item('最大生命',number(s.maxHp),run?'当前生命 '+Math.ceil(run.player.hp)+' / '+Math.round(run.player.maxHp):'角色基础生命')),
      row(item('攻击速度',percent(s.attackSpeed),'含永久研究加成'),item('移动速度',percent(s.moveSpeed),'含永久研究加成')),
    ]),card(statRow('暴击率',percent(s.critChance)),statRow('攻击范围',percent(s.area)),statRow('护甲',Number(s.armor.toFixed(1))),statRow('生命回复',Number(s.regen.toFixed(2))+' / 秒')));
    else body.push(card(statRow('经验获取',percent(s.xpGain)),statRow('金币获取',percent(s.gold)),statRow('幸运',number(s.luck)),statRow('拾取范围',Number(s.pickupRange.toFixed(1))+' 厘米')),small('金币获取影响局内金币，与研究所星尘收益独立。'));
    body.push(small(run?'查看时保持暂停，返回不改变本局强化。':'研究加成用于下一次新对局。'));
    screen('stats',run?'当前属性':'文字属性',run?'查看时保持暂停 · 本局属性':'开局预览 · 不包含局内临时强化',body,[button('返回',()=>{app.setScreen(null);back();})],'blue');
  }
  function damageSources(run,back) {
    const total=run?run.player.stats.damage:api.startingStats(selected).damage;
    const base=run?api.baseStats(run.player.speciesId,{},run.player.evoStage+run.player.growth).damage:api.startingStats(selected,false).damage;
    const research=app.meta.labStats().damage||0;
    screen('damage','伤害加成来源','当前属性 / 全局伤害倍率',[
      el('div','zx-hero',[el('h1','',percent(total)),small('当前全局伤害倍率')]),
      card(statRow('文字基础与成长',percent(base)),statRow('研究所 · 伤害',percent(research)),statRow('本局招式、道具与临时加成',run?'已计入当前倍率':'未计入')),
      el('div','zx-banner','基础与研究加成先合并，再由现有战斗规则计算道具、被动与临时效果。'),
      small('倍率不等于最终伤害，还受招式、暴击、敌方防御与属性关系影响。'),
    ],[button('返回',back)],'blue');
  }
  function pauseAttributes(run) {
    const p=run.player,s=p.stats;
    const pairs=[
      ['全局伤害',percent(s.damage)],['当前生命',Math.ceil(p.hp)+' / '+Math.round(p.maxHp)],
      ['攻击速度',percent(s.attackSpeed)],['移动速度',percent(s.moveSpeed)],
      ['暴击率',percent(s.critChance)],['攻击范围',percent(s.area)],
      ['护甲',Number(s.armor.toFixed(1))],['生命回复',Number(s.regen.toFixed(2))+' / 秒'],
      ['经验获取',percent(s.xpGain)],['金币获取',percent(s.gold)],
      ['幸运',number(s.luck)],['拾取范围',Number(s.pickupRange.toFixed(1))+' 厘米'],
    ];
    const pair=([name,value])=>el('div','zx-pause-stat-pair',[small(name),el('i','zx-pause-leader',[],{'aria-hidden':true}),el('b','',String(value))]);
    const rows=[];
    for(let i=0;i<pairs.length;i+=2)rows.push(el('div','zx-pause-stat-row',[pair(pairs[i]),pair(pairs[i+1])]));
    const base=api.baseStats(p.speciesId,{},p.evoStage+p.growth).damage;
    if(hasWindSpeedPassive(p.speciesId))rows.push(el('div','zx-pause-stat-row',[
      pair(['移速被动伤害加成','+'+percent(windSpeedDamageBonus(p.speciesId,s.moveSpeed,p.baseSpeed))]),
    ]));
    const source=el('section','zx-pause-sources',[
      el('b','zx-pause-index','伤害来源'),
      el('div','zx-pause-stat-row',[pair(['字灵基础与成长',percent(base)]),pair(['研究加成',percent(app.meta.labStats().damage||0)])]),
      small('全局伤害包含本局招式、道具与临时加成。'),
    ]);
    return el('section','zx-pause-attrs',[...rows,source]);
  }
  function pause(run,initialTab='attrs') {
    if(run.coop)saveProgress(run);
    document.querySelectorAll('.run-hint,.zx-intro').forEach(node=>node.remove());
    const p=run.player,c=character(p.speciesId);
    const region=run.sanctuary?'圣地':'第'+run.stage+'区';
    const identity=el('header','zx-pause-identity',[
      stagePortrait(c,run.skinLook),
      el('div','zx-pause-name',[el('b','',paperStages[Math.min(3,run.stage-1)]),small(region+' · '+difficultyName(run)+' · '+c.word+' Lv.'+p.level)]),
      run.coop?small('队友仍在战斗'):null,
    ]);
    const metrics=el('div','zx-pause-metrics',[
      ['clock','用时',time(run.time)],['score','击败',compactCounter(run.stats.kills)],['coin','金币',compactCounter(Math.round(run.gold))],
    ].map(([symbol,label,value])=>el('div','zx-pause-metric',[hudPaperIcon(symbol,15),small(label),el('b','',value)])));
    const entries=buildEntries(run);
    function inventory(label,items,key){
      const rows=items.map(item=>el('div','zx-pause-build-row',[loadoutIcon(item.src,item.name),el('span','',item.name),el('b','',item.move?'Lv.'+item.count:'×'+item.count)]));
      return el('section','zx-pause-inventory',[el('b','zx-pause-index',label),...(rows.length?rows:[small('暂无')])],{'data-pause-section':key});
    }
    const pane=el('div','zx-pause-pane'),body=el('div','zx-pause-body',[pane]);
    let active=initialTab;
    const tabs=el('div','zx-pause-tabs',[['attrs','属性'],['build','本局构筑']].map(([key,label])=>
      profileSwitch(button,label,()=>show(key),'zx-pause-switch',{'data-pause-tab':key})),{role:'group','aria-label':'暂停资料'});
    function show(key){
      active=key;
      for(const tab of tabs.children)tab.setAttribute('aria-pressed',String(tab.dataset.pauseTab===key));
      if(key==='attrs')pane.replaceChildren(pauseAttributes(run));
      else pane.replaceChildren(inventory('招式',entries.filter(item=>item.move),'moves'),inventory('BUFF',entries.filter(item=>item.vitamin),'buffs'),inventory('道具',entries.filter(item=>!item.move&&!item.vitamin),'supplies'));
      body.scrollTop=0;
    }
    show(active);
    const tools=el('div','zx-row zx-pause-actions',[
      button([menuSymbol('settings',18),el('span','','设置')],()=>settings(()=>pause(run,active)),'zx-plain zx-pause-action',{'data-action':'pause-settings'}),
      button([icon('book',18,'#485E82'),el('span','','玩法说明')],help,'zx-plain zx-pause-action',{'data-action':'help'}),
    ]);
    if(run.coop)tools.append(button('暂离房间',()=>{
      saveProgress(run);run.coop.room.end('已暂离',false);app.coopRoom=null;app.toMenu();
    },'zx-plain zx-pause-action',{'data-action':'pause-leave-room'}));
    const footer=el('footer','zx-pause-footer',[
      button('结束本局',()=>confirmEnd(run,active),'danger zx-pause-end',{'data-action':'pause-end'}),
      button('继续战斗',()=>run.resume(),'primary',{'data-action':'pause-resume'}),
    ]);
    for(const action of footer.children){
      action.dataset.paperSurface='trade-action';action.replaceChildren(el('span','zx-trade-label',action.textContent));
    }
    const paper=el('div','zx-pause-leaf',[el('div','zx-pause-paper',[identity,metrics,tabs,body,tools,footer])]);
    const sheet=el('section','zx-pause-sheet',[battleDialogHeading(el('h2','','片刻休整')),paper],{role:'dialog','aria-modal':true,'aria-label':'片刻休整'});
    const wrap=run.ui.modal(el('div','zx zx-modal zx-pause',sheet,{'data-paper-surface':'flat'}));
    wrap.className='zx zx-modal-wrap zx-pause-screen';
  }
  function outcomeDialog(run,title,subtitle,body,actions=[]){
    for(const action of actions){
      action.dataset.paperSurface='trade-action';action.replaceChildren(el('span','zx-trade-label',action.textContent));
    }
    const panel=el('section','zx zx-outcome',[
      battleDialogHeading(el('h2','',title),subtitle),body,
      actions.length?el('footer','zx-outcome-actions',actions):null,
    ],{role:'dialog','aria-modal':'true','aria-label':title,'data-paper-surface':'flat'});
    const wrap=run.ui.modal(panel);
    wrap.className='zx zx-modal-wrap zx-outcome-overlay';
    run.ui.root.classList.add('zx-showing-outcome');
    return wrap;
  }
  function confirmEnd(run,tab) {
    const cancel=button('继续休整',()=>pause(run,tab),'',{'data-action':'end-cancel'});
    const confirm=button('结束本局',()=>{run.endHow='quit';return run.finish(false);},'danger',{'data-action':'end-confirm'});
    const hint=el('p','paper-prompt-hint',run.time<QUIT_REWARD_MIN_SECONDS
      ? '本局未满 '+QUIT_REWARD_MIN_SECONDS+' 秒，现在结束将获得 0 星尘。'
      : '结束后将按当前进度结算，本局临时强化随旅程结束。');
    const details=el('div','zx-end-state',[
      el('b','',character(run.player.speciesId).word+' · Lv.'+run.player.level),
      el('span','',time(run.time)),
    ]);
    const wrap=run.ui.modal(paperDecisionPanel(el,'结束本局？',hint,[details],cancel,confirm));
    wrap.className='zx zx-modal-wrap zx-dialog paper-prompt-overlay';
    run.ui.pauseBack=()=>pause(run,tab);
  }
  function buildEntries(run) {
    const moves=run.player.moves.filter(Boolean).map(move=>{
      const name=api.moveName(move.def);
      return {move:true,count:move.level,name,label:name+' Lv.'+move.level,src:api.moveIcon(move.def)};
    });
    const vitamins=[...run.player.vitamins].map(([id,value])=>{
      const name=api.vitaminName(id);
      return {vitamin:true,count:value.level,name,label:name+' ×'+value.level,src:api.vitaminIcon(id)};
    });
    const items=[...run.player.items].map(([id,count])=>{
      const name=api.itemName(id);
      return {count,name,label:name+' ×'+count,src:api.itemIcon(id)};
    });
    return [...moves,...vitamins,...items];
  }
  const loadoutIcon=(src,name)=>el('img','zx-loadout-icon',[],{src,alt:name,draggable:false});
  function updateSkillSlots(slots,run){
    const p=run.player,count=run.stage===1?p.moveSlots:Math.max(4,p.moveSlots);
    while(slots.children.length>count)slots.lastElementChild.remove();
    for(let index=0;index<count;index++){
      const move=p.moves[index],locked=index>=p.moveSlots;
      const key=locked?'locked':move?move.def.key:'empty',level=String(move?.level||0);
      let slot=slots.children[index];
      if(!slot){
        slot=el('div','zx-skill-slot',[],{'data-skill-slot':index});slots.append(slot);
      }
      const name=move?api.moveName(move.def):'';
      if(slot.dataset.move===key&&slot.dataset.level===level&&slot.dataset.name===name)continue;
      if(slot.dataset.move!==key||slot.dataset.name!==name){
        slot.dataset.name=name;
        slot.dataset.move=key;slot.className='zx-skill-slot '+(locked?'locked':move?'filled':'empty');
        slot.dataset.paperSurface='hud-cell';
        slot.replaceChildren(...(locked?[icon('lock',17)]:move?[
          loadoutIcon(api.moveIcon(move.def),api.moveName(move.def)),
          el('canvas','zx-skill-cooldown',[],{width:84,height:84,'data-static':'true'}),el('b','zx-slot-level',level),
        ]:[]));
      }else if(move&&!locked)updateText(slot.lastElementChild,level);
      slot.dataset.level=level;
      slot.setAttribute('aria-label',locked?'技能槽未解锁':move?api.moveName(move.def)+' 等级 '+level:'空技能槽');
    }
  }
  function supplyIcons(run) {
    const p=run.player;
    const vitamins=Array.from(p.vitamins,([id,value])=>({
      id,count:value.level,kind:'vitamin',name:api.vitaminName(id),src:api.vitaminIcon(id),
    }));
    const cells=entries=>entries.map(({id,count,kind,name,src})=>el('div','zx-mini-slot filled',[
      loadoutIcon(src,name),count>1?el('b','zx-slot-count',String(count)):null,
    ],{'data-paper-surface':'hud-cell',['data-'+kind]:id,'data-count':count,'aria-label':name+' ×'+count}));
    return cells(vitamins);
  }
  function effectRow(value,tone='neutral',scope='') {
    const label=tone==='boon'?'增益':tone==='bane'?'代价':'效果';
    const sign=tone==='boon'?'＋':tone==='bane'?'－':'·';
    return el('div','zx-choice-effect '+tone,[
      el('span','zx-effect-sign',sign,{'aria-hidden':true}),
      el('span','zx-effect-value',value),
      scope?el('span','zx-effect-scope',effectScope(scope)):null,
    ],{'data-effect':tone,'aria-label':label+'：'+value+(scope?'，'+effectScope(scope):'')});
  }
  function paintQuality(node,quality){node.dataset.quality=quality.key;node.dataset.rarity=quality.label;}
  function offerContent(art,title,meta,notes=[]) {
    return [el('div','zx-deal-art',[art,qualityBadge(meta.quality)],{'data-paper-surface':meta.off?'record-paper':'level-art','data-quality':meta.quality.key}),
      el('div','zx-deal-copy',[el('div','zx-deal-title',el('b','zx-choice-title',title),{'data-paper-surface':'short-ink'}),
        meta.kind?el('small','zx-choice-kind',meta.kind):null,...notes])];
  }
  function offerBody(cards,onStats) {
    return [button([el('span','','查看当前属性'),icon('stats',15,'#65577b'),el('span','','›')],onStats,'zx-upgrade-stats',{'data-action':'upgrade-stats'}),...cards];
  }
  function choiceList(className,cards){
    const list=el('div',className,cards);
    frameChoiceCards(list);
    if(cards.length<2)return list;
    list.dataset.equalCards='true';
    // Measure the mounted cards so both renderers share the same choice height.
    let width=0,attempts=0;
    const fit=()=>{
      // Native modal transitions can attach the new choices a few frames later.
      if(!list.isConnected){
        if(window.nativeUI&&attempts++<90)requestAnimationFrame(fit);
        return;
      }
      width=list.clientWidth;
      if(!window.nativeUI)for(const card of cards)card.style.height='';
      const height=Math.max(...cards.map(card=>card.offsetHeight));
      // Native layout is recorded during drawing, after the initial RAF callbacks.
      if(!height&&window.nativeUI&&attempts++<90){requestAnimationFrame(fit);return;}
      if(height){
        for(const card of cards)card.style.height=height+'px';
        // Explicitly invalidate the native modal texture after applying the measured heights.
        if(window.nativeUI)list.dataset.equalHeight=String(height);
      }
    };
    requestAnimationFrame(()=>requestAnimationFrame(fit));
    document.fonts?.ready.then(fit);
    list.addEventListener('load',fit,true);
    if(!window.nativeUI&&typeof ResizeObserver==='function'){
      const observer=new ResizeObserver(()=>{
        if(!list.isConnected){observer.disconnect();return;}
        if(list.clientWidth!==width)fit();
      });
      observer.observe(list);
    }
    return list;
  }
  function levelUp(run,offers,chooseOffer) {
    let choosing=false;
    const choose=(offer,action)=>{
      if(choosing)return;choosing=true;
      const done=()=>chooseOffer(offer,action);
      if(window.closeAnimatedModal)window.closeAnimatedModal(run.ui.modalEl,done,action==='reroll'||run.pendingLevels>1);
      else done();
    };
    const cards=offers.map((offer,index)=>{
      const desc=api.offer(run,offer),quality=choiceQuality(offer.rarity);
      const level=desc.sub.match(/★?(\d+)\s*→\s*★?(\d+)/);
      const buff=offer.kind==='upVit'||offer.kind==='newVit';
      const kind=buff?'BUFF':offer.kind==='upMove'?'招式升级':'新招式';
      const meta=level?kind+' · '+(desc.sub.includes('★')?'融合 ':'等级 ')+level[1]+' → '+level[2]:kind;
      const effects=desc.lines.map((line,i)=>{
        const label=line.replace(/₽/g,'金币').replace(/维生素/g,'BUFF');
        const m=label.match(/^([+−-]\s*\d+(?:[.,]\d+)?\s*%?)\s*(.+)$/);
        if(m)return el('div','zx-upgrade-metric',[
          el('span','',m[2].trim()),el('i','zx-metric-leader',[],{'aria-hidden':'true'}),el('strong','',m[1].trim()),
        ]);
        return text(label,i?'zx-choice-description zx-offer-note':'zx-choice-description');
      });
      const src=offer.vit?api.vitaminIcon(offer.vit):desc.type?api.moveIcon({type:desc.type}):null;
      const rail=el('div','zx-upgrade-art',[src?loadoutIcon(src,desc.title):glyph('升'),
        el('span','zx-level-stamp',quality.label),
      ],{'data-paper-surface':'level-art','data-quality':quality.key});
      const head=el('div','zx-level-head'+(buff?' buff':''),[
        el('small','zx-level-kind',meta,{title:desc.sub}),el('b','zx-choice-title',desc.title),
      ],{'data-paper-surface':buff?'short-ink':'level-title'});
      const node=button([rail,el('div','zx-upgrade-copy',[head,el('div','zx-upgrade-effects',[
        plannedUpgrade(runPlan(run),offer)?planBadge():null,...effects,
      ])])],()=>choose(offer),'zx-offer zx-quality-card',{'data-offer':index,'data-paper-surface':'level-offer','data-kind':offer.kind});
      paintQuality(node,quality);node.style.backgroundColor=upgradeStocks[quality.key][0];return node;
    });
    const popup=overlay('等级'+run.player.level+'！','',[],[],run.ui,'zx-upgrade zx-choice-dialog zx-first-batch-upgrade zx-level-up');
    const dialog=popup.querySelector('.zx-modal'),title=dialog.querySelector('h2');
    popup.classList.add('zx-upgrade-scrim');
    const header=battleDialogHeading(title,'选择 1 项强化');
    dialog.append(header,choiceList('zx-choice-list',cards),el('footer','zx-choice-actions',[
      button([icon('refresh',17,'#EEC659'),el('span','','重抽 · 剩余 '+run.rerolls+' 次')],()=>choose(null,'reroll'),'zx-reroll',{'data-paper-surface':'upgrade-reroll',disabled:run.rerolls<=0}),
    ]));
  }
  function restyleChoice(run,method,args,symbol) {
    const hud=run.ui,wrap=hud.modalEl;
    if(!wrap||wrap.querySelector('.zx-review-dialog'))return;
    const cards=[...wrap.querySelectorAll('.cards > .card')];
    if(!cards.length)return;
    const title=wrap.querySelector('h1')?.textContent||'选择强化';
    const help=[...wrap.children].filter(node=>node.classList.contains('help')).map(node=>text(node.textContent,'zx-note zx-choice-help'));
    cards.forEach((node,index)=>{
      const body=node.querySelector('.bd'),heading=body.querySelector('h3'),tag=node.querySelector('.rar,.kind');
      const art=method==='showPact'&&run.endless?glyph(characterForSpecies(run.player.speciesId)):
        node.querySelector('.top img,.top canvas')||glyph(symbol);
      const meta=choiceModel(method,args,index,tag?.textContent||'');
      if(method==='showTrade'&&args[1]?.kind==='fossil')meta.kind='';
      const notes=[];
      const hasBoon=!!body.querySelector('.pact-line.boon');
      const cost=body.querySelector('.pact-line.bane b')?.textContent.trim()||'';
      const splitEffects=hasBoon&&!!cost&&!/^(无代价|没有代价|无须担心|无需担心)/.test(cost);
      for(const detail of body.children){
        if(detail===heading||/^\[\d+\]$/.test(detail.textContent.trim()))continue;
        if(detail.classList.contains('pact-line')){
          const value=detail.querySelector('b')?.textContent||detail.textContent;
          const noCost=/^(无代价|没有代价|无须担心|无需担心)/.test(value.trim());
          const tone=noCost?'neutral':detail.classList.contains('boon')?'boon':detail.classList.contains('bane')?'bane':'neutral';
          if(splitEffects)notes.push(effectRow(value,tone,tone==='bane'?(detail.querySelector('small')?.textContent||''):''));
          else notes.push(text(value,'zx-choice-description'));
        }else if(detail.textContent.trim())notes.push(text(detail.textContent,'zx-choice-note'));
      }
      // Preserve the original node and handlers, including unavailable-choice guards.
      const opacity=node.style.opacity,locked=node.classList.contains('locked');
      node.removeAttribute('style');node.style.cssText='';node.className='zx-button zx-offer zx-quality-card';
      if(opacity)node.style.opacity=opacity;else if(locked)node.style.opacity='.45';
      node.dataset.offer=String(index);paintQuality(node,meta.quality);
      if(meta.off){node.dataset.unavailable='true';node.setAttribute('aria-disabled','true');}
      if(meta.blessing){
        node.classList.add('zx-blessing-option');
        const label=heading.textContent.trim();
        const leading=label.match(/^([+−-]\d+(?:[.,]\d+)?%?)\s*(.+)$/);
        const trailing=leading?null:label.match(/^(.+?)\s*([+−-]\d+(?:[.,]\d+)?%?)$/);
        const stat=leading?leading[2]:trailing?trailing[1]:label;
        const value=leading?leading[1]:trailing?.[2];
        const mark=args[5]==='boss'?glyph(characterForSpecies(run.player.speciesId)):
          loadoutIcon(api.blessingIcon(args[2]?.[index]?.mods?.[0]?.stat),stat);
        const badge=qualityBadge(meta.quality);
        node.dataset.paperSurface='level-offer';
        node.replaceChildren(el('div','zx-blessing-row',[
          el('div','zx-blessing-seal',mark,{'data-paper-surface':'level-art','data-quality':meta.quality.key}),el('div','zx-blessing-label',[badge,el('b','',stat)]),
          el('div','zx-blessing-amount',el('b','',value||'✦'),{'data-paper-surface':'altar-value'}),
        ]));
      }else{
        node.classList.add('zx-deal-card');node.dataset.paperSurface=meta.off?'record-paper':'level-offer';
        if(meta.off){node.style.opacity='1';node.disabled=true;}
        node.replaceChildren(...offerContent(art,heading.textContent,meta,notes));
      }
    });
    const actions=[...wrap.querySelectorAll('.actions > button')];
    actions.forEach(node=>{node.className='zx-button zx-reroll';node.querySelectorAll('kbd').forEach(key=>key.remove());standardButton(node,node.textContent.trim());});
    const back=()=>{hud.hideModal();stats(run,()=>hud[method](...args));};
    const statsButton=button(method==='showTrade'?'查看属性':[icon('stats',16,'#65577b'),el('span','','查看属性')],back,'zx-choice-stats',{'data-action':'upgrade-stats'});
    document.querySelectorAll('.run-hint').forEach(node=>node.remove());
    wrap.className='zx zx-modal-wrap';
    if(method==='showBlessing'){
      wrap.classList.add('zx-upgrade-scrim');
      statsButton.classList.add('zx-reroll');statsButton.dataset.paperSurface='trade-action';
      const content=el('section','zx zx-modal zx-upgrade zx-choice-dialog zx-first-batch-upgrade zx-blessing-dialog',[
        battleDialogHeading(el('h2','',title),help.map(n=>n.textContent).join(' ')),
        choiceList('zx-choice-list',cards),el('footer','zx-choice-actions',[...actions,statsButton]),
      ],{role:'dialog','aria-label':title,'data-choice':method,'data-paper-surface':'flat'});
      wrap.replaceChildren(content);return;
    }
    wrap.classList.add('zx-loot-scrim');
    for(const action of [statsButton,...actions]){
      action.dataset.paperSurface='trade-action';action.replaceChildren(el('span','zx-trade-label',action.textContent.trim()));
    }
    const content=el('section','zx zx-modal zx-upgrade zx-choice-dialog zx-scene-offers',[
      ...(help.length?[el('div','zx-scene-caption',help)]:[]),choiceList('zx-choice-list',cards),
      el('footer','zx-choice-actions',[statsButton,...actions]),
    ],{'data-choice':method,'data-paper-surface':'flat'});
    if(method==='showTrade'&&args[1]?.kind==='fossil')content.classList.add('zx-fossil-offers');
    wrap.replaceChildren(battleDialogFrame(content,el('h2','',title)));
  }
  function restyleItems(run,keys,choice=false) {
    const wrap=run.ui.modalEl;
    const cards=choice?[...wrap.querySelectorAll('.cards > .card')]:[...wrap.children].filter(node=>node.classList.contains('card'));
    if(!cards.length)return;
    const title='发现道具';
    const notes=[...wrap.children].filter(node=>node.classList.contains('help')&&!/^选择一项[。！!]?$/.test(node.textContent.trim())).map(node=>text(node.textContent,'zx-item-note'));
    cards.forEach((node,index)=>{
      const body=node.querySelector('.bd'),heading=body.querySelector('h3');
      const quality=choiceQuality(api.itemRarity(keys[index]));
      const picture=el('img','zx-item-image',[],{src:api.itemIcon(keys[index]),alt:heading.textContent,draggable:false});
      // Reuse the choice nodes and original action buttons to retain their
      // reward callbacks, keyboard bindings and protection against double taps.
      node.removeAttribute('style');node.style.cssText='';node.className='zx-item-card zx-quality-card'+(choice?' zx-item-option':'');paintQuality(node,quality);
      node.dataset.itemChoice=keys[index];
      const planned=planIncludes(runPlan(run),'items',keys[index]);
      if(!choice){
        node.className='zx-loot-display';node.dataset.paperSurface='level-offer';
        const badge=qualityBadge(quality);
        const affects=body.querySelector('.affects'),unused=affects?.classList.contains('none');
        const story=body.querySelector('.muted')?.textContent.trim();
        const effect=body.querySelector('p')?.textContent.trim(),count=run.player.items.get(keys[index])??0;
        const warning=unused?el('span','zx-loot-fit','当前招式用不到',{'aria-label':affects.textContent}):null;
        const held=el('div','zx-loot-limit',[el('span','','当前持有'),el('b','','×'+count)]);
        node.replaceChildren(el('div','zx-loot-stage',[picture,badge,warning],{'data-paper-surface':'level-art','data-quality':quality.key}),
          el('div','zx-loot-leaf',[el('div','zx-loot-name',el('h3','',heading.textContent),{'data-paper-surface':'short-ink'}),
            el('div','zx-loot-copy',[planned?planBadge():null,effect?text(effect,'zx-choice-description zx-loot-effect'):null,
              affects&&!unused?text(affects.textContent,'zx-loot-beneficiaries'):null,story?text(story,'zx-loot-story'):null]),held]));
        return;
      }
      const held=body.querySelector('.cap');
      const effects=[...body.children].filter(n=>n!==heading&&n!==held&&!n.classList.contains('key')&&n.textContent.trim()).map(n=>n.textContent);
      itemOffer(node,{key:keys[index],name:heading.textContent,picture,quality,planned,effects,held:held?.textContent.replace(/^你有\s*/,'持有 ')});
    });
    const actions=[...wrap.querySelectorAll('.actions > button')];
    actions.forEach((node,index)=>{
      node.querySelectorAll('kbd').forEach(key=>key.remove());
      const label=node.textContent.trim().replace(/₽/g,'金币').replace(/^无\s*[（(]/,'放弃拾取（');
      node.replaceChildren(label);node.className='zx-button'+(!choice&&index===0?' primary':' zx-item-sell');
      standardButton(node,label);
      node.dataset.itemAction=!choice&&index===0?'take':'sell';node.dataset.paperSurface='trade-action';
      node.setAttribute('aria-label',label);
      const amount=label.match(/\+(\d+)/);
      if(amount&&node.dataset.itemAction==='sell')node.replaceChildren(el('span','',choice?'放弃拾取':'出售'),hudPaperIcon('coin',16),el('strong','','+'+amount[1]));
    });
    document.querySelectorAll('.run-hint').forEach(node=>node.remove());
    wrap.className='zx zx-modal-wrap';
    const footer=el('footer','zx-item-actions',choice?actions:actions.reverse(),{'data-paper-surface':'flat'});
    const content=el('section','zx zx-modal zx-item-dialog '+(choice?'zx-item-pick':'zx-loot-dialog'),[
      choiceList('zx-item-body',cards),footer,
    ],{'data-choice':choice?'showItemChoice':'showItem','data-paper-surface':'flat'});
    wrap.classList.add('zx-loot-scrim');
    wrap.replaceChildren(battleDialogFrame(content,el('h2','',choice?'选择道具':title),choice?(notes.map(n=>n.textContent).join(' ')||'选择 1 件拾取'):''));
  }
  function settlementSaved(ticketId,receipt){
    const dialog=app.run?.ui.modalEl;
    if(!ticketId||!dialog?.isConnected||dialog.dataset.pendingTicket!==ticketId)return false;
    dialog.acceptReceipt(receipt);return true;
  }
  function summary(run,result,reward,error){
    const leave=()=>{app.setScreen(null);app.toMenu();};
    const win=result.victory,single=result.mode===SINGLE_STAGE,guardians=single?1:FOREST_COMBAT_ZONES;
    const pending=!!(!reward&&result.id&&app.meta.hasPending(result.id));
    const c=character(result.species);
    const captured=reward?collectionRewards(reward.profile??profile(),run.collectionStart):[];
    const entries=buildEntries(run);
    const pendingMessage=small(error||'');
    const retry=button('重试同步',async()=>{
      retry.disabled=true;retry.textContent='正在同步';
      try{
        const state=await app.meta.retryPending();
        if(run.ui.modalEl!==dialog||!dialog.isConnected)return;
        if(!app.meta.hasPending(result.id)){summary(run,result,null,state.error||'这局的结算未能确认。');return;}
        pendingMessage.textContent=state.error||'暂时无法同步，请稍后重试。';
      }finally{
        if(run.ui.modalEl===dialog&&dialog.isConnected){
          retry.disabled=false;retry.textContent='重试同步';
        }
      }
    },'zx-plain',{'data-action':'retry-settlement'});
    const metrics=[[time(result.time),win?'通关时间':'生存时间'],[compactCounter(result.kills),'击败敌人'],[Math.min(guardians,result.bosses||0)+' / '+guardians,'区域镇守']];
    const buildGroup=(name,items)=>{
      if(!items.length)return null;
      const rows=[];
      for(let i=0;i<items.length;i+=2){
        rows.push(el('div','zx-build-pair',items.slice(i,i+2).map(item=>
          el('div','zx-build-entry',[
            el('span','zx-build-stamp',loadoutIcon(item.src,item.name)),
            el('span','zx-build-name',item.name),el('b','zx-build-quantity',(item.move?'Lv.':'×')+item.count),
          ],{'aria-label':item.label}))));
      }
      return el('section','zx-build-group',[el('div','zx-build-index',[el('b','',name),el('i')]),...rows]);
    };
    const build=entries.length?el('section','zx-outcome-build',[
      el('b','','本局构筑'),el('div','zx-outcome-stash',[
        buildGroup('招式',entries.filter(i=>i.move)),buildGroup('BUFF',entries.filter(i=>i.vitamin)),buildGroup('道具',entries.filter(i=>!i.move&&!i.vitamin)),
      ]),
    ]):null;
    const receipt=el('div','zx-outcome-body',[
      el('div','zx-outcome-reward',[
        el('b','',reward?(reward.stardust!=null?'星尘  +'+number(reward.stardust):'结算已保存'):(pending?'结算待同步':'结算未保存')),
        reward?.profile?small('当前持有 '+number(reward.profile.stardust)):null,
        !reward?pendingMessage:null,pending?retry:null,
      ]),
      el('div','zx-outcome-metrics',metrics.map(([v,k])=>el('div','zx-outcome-stat',[el('b','',v),el('small','',k)]))),
      win?text(single?'完整通关普通模式可解锁困难。':(app.meta.biomeTier('forest')>result.tier?'桌上世界下一难度已开放。':'已完成当前桌面挑战。'),'zx-outcome-note'):null,
      captured.length?text('新收录 · '+captured.map(entry=>glyphWordForSpecies(entry.id)+(entry.look==='shiny'?'（异色）':entry.look==='classic'?'（经典异色）':'')).join('、'),'zx-outcome-note'):null,
      build,
    ]);
    const playAgain=run.coop?()=>{leave();multiplayer();}:()=>app.startRun(app.lastCfg);
    const subtitle=(win?(single?'单关通关':'旅程通关'):'止步于第 '+result.stage+' 区')+'  ·  '+c.word+' Lv.'+result.level+'  ·  '+difficultyName(result);
    const dialog=outcomeDialog(run,'最终结算',subtitle,receipt,[
      button('回到首页',leave,'',{'data-action':'report-home'}),
      button(run.coop?'重新组队':win?'再来一局':'再试一次',playAgain,'primary',{'data-action':'report-again'}),
    ]);
    dialog.dataset.result='summary';
    if(pending){
      dialog.dataset.pendingTicket=result.id;
      dialog.acceptReceipt=ack=>summary(run,ack?.record??result,ack??{},'');
    }
  }
  function attachRun(run) {
    run.collectionStart={league:[...profile().league],shinies:[...profile().shinies],classics:[...(profile().classics??[])]};
    const hud=run.ui;selected=character(run.startSpecies).id;
    api.glyphs(run);run.input.fixedCamera=true;run.input.mouseDX=run.input.mouseDY=run.input.wheel=0;
    const hint=run.hints.show.bind(run.hints);
    run.hints.show=(key,site)=>{if(run.state==='play'&&!run.stageCleared&&!app.screen&&!hud.hasModal())hint(key,site,run);};
    hud.showPause=pause;hud.showLevelUp=levelUp;
    hud.showSummary=summary;hud.showSlots=slots;
    const hideBattleModal=hud.hideModal.bind(hud);
    hud.hideModal=(...args)=>{
      hud.root.classList.remove('zx-showing-outcome','zx-showing-atlas');
      return hideBattleModal(...args);
    };
    hud.saving=active=>{
      hud.savingEl?.remove();hud.savingEl=null;
      if(!active)return;
      hud.savingEl=outcomeDialog(run,'旅程结束','',el('div','zx-outcome-confirm',el('b','','正在保存本局结算'),{role:'status'}));
    };
    let expandedMap=null;
    hud.mapFacilityKind='chest';
    const mapIcons=new Map();
    hud.mapFacilityIcon=kind=>{
      if(!mapIcons.has(kind)){
        const image=new Image();
        image.onload=()=>{
          if(expandedMap?.canvas.isConnected){expandedMap.paint();window.invalidateUI?.();}
        };
        mapIcons.set(kind,image);
        image.src=api.facilityIcon(kind);
      }
      return mapIcons.get(kind);
    };
    hud.showMap=(r,fromPause=false)=>{
      const close=fromPause?()=>pause(r):()=>r.resume();
      const atlas=regionAtlas(r.terrain);
      const aspect=Math.max(.75,Math.min(1,atlas.z/atlas.x+.08));
      const side=Math.max(100,Math.floor(Math.min(472,window.innerWidth-30,(window.innerHeight-195)/aspect)));
      const height=Math.round(side*aspect);
      const canvas=el('canvas','zx-battle-map-art',[],{width:side*2,height:height*2,'data-static':'true',role:'img','aria-label':'全区设施与当前位置，地图上方为北'});
      const frame=el('div','zx-battle-map-frame',canvas);
      frame.style.width=side+'px';frame.style.height=height+'px';
      const panel=el('section','zx zx-battle-map zx-atlas',[
        el('header','zx-atlas-key',[el('div','zx-atlas-titles',[
          el('small','','区域地图'),el('h2','',paperStages[Math.min(3,r.stage-1)])]),
          el('b','zx-atlas-zone','第 '+r.stage+' 区',{'data-paper-surface':'atlas-zone'})],{'data-paper-surface':'atlas-heading'}),
        el('small','zx-atlas-north','▲ N',{'aria-hidden':'true'}),frame,
      ],{role:'dialog','aria-label':'区域地图','data-paper-surface':'atlas-sheet'});
      panel.style.width=(side+14)+'px';
      const wrap=hud.modal(panel);wrap.className='zx zx-modal-wrap zx-atlas-overlay';
      hud.root.classList.add('zx-showing-atlas');
      dockDialogClose(wrap,button('返回',close,'',{'data-action':'close-battle-map'}),'关闭区域地图');
      const viewRatio=Math.max(1,Math.max(atlas.x,atlas.z/aspect)*2*mapWorldScale/94);
      const center={x:0,z:0};
      function paint(){
        drawBattleMinimap(canvas,r,{shadow:false,square:true,atlas,viewRatio,center,facilityKind:null});
      }
      paint();
      expandedMap={canvas,paint,at:performance.now()};
      hud.pauseBack=close;
    };
    hud.mapOpen=()=>!!hud.root.querySelector('.zx-battle-map');
    for(const method of ['showItem','showItemChoice']){
      const render=hud[method].bind(hud);
      hud[method]=(r,items,...args)=>{const result=render(r,items,...args);restyleItems(r,method==='showItem'?[items]:items,method==='showItemChoice');return result;};
    }
    for(const [method,symbol] of Object.entries({showBlessing:'祝',showTrade:'易',showPact:'契'})){
      const render=hud[method].bind(hud);
      hud[method]=(...args)=>{const result=render(...args);restyleChoice(run,method,args,symbol);return result;};
    }
    function routePrint(ids){
      const nodes=[];
      for(const id of ids){
        if(nodes.length)nodes.push(el('span','zx-evo-arrow','→'));
        const actor=character(id);
        const portrait=glyph(actor,drawRouteGlyph);
        portrait.dataset.paperSurface='flat';
        nodes.push(el('span','zx-evo-form',portrait,{'aria-label':actor.word}));
      }
      return el('div','zx-evo-line',nodes);
    }
    const routeHeading=route=>route.role.split(' · ')[1];
    function windEvolutionDialog(title,subtitle,body,actions=[]){
      const wrap=overlay(title,subtitle,body,actions,hud,'zx-evo-dialog');
      wrap.classList.add('zx-wind-scrim');
      wrap.querySelector('.zx-evo-dialog').dataset.paperSurface='journal-cover';
    }
    hud.showBranch=(r,ids,choose)=>{
      let chosen=false;
      windEvolutionDialog('风起两路','为本局选择一条进阶路线',windRoutes.filter(route=>ids.includes(route.middle)).map(route=>{
        const trait=routeHeading(route);
        const speedRoute=hasWindSpeedPassive(route.middle);
        const benefit=speedRoute?`移速 ×${windRushMultiplier(route.middle)} → ×${windRushMultiplier(route.final)}`:trait+' ×10';
        return button([el('div','zx-evo-choice-head',[el('b','',trait+'路线',{'data-paper-surface':'journal-button'}),routePrint([16,route.middle,route.final])]),
          el('div','zx-evo-benefit',[el('b','',benefit),el('small','',speedRoute?`持续 5 秒 · 撞龘额外 ×${windRushDragonBonus[route.middle]} → ×${windRushDragonBonus[route.final]}`:'持续 5 秒')]),
          el('small','zx-evo-note','首次进阶  ·  '+character(route.middle).word+'  ·  '+character(route.middle).ult),
        ],()=>{if(chosen)return;chosen=true;choose(route.middle);},'zx-branch-choice',{'data-branch-id':route.middle,'data-paper-surface':'move-paper'});
      }));
    };
    function intro(title,subtitle) {
      if(profile()?.settings.showBanners===false)return;
      const feed=app.ui.querySelector('.zx-combat-feed');
      if(!feed)return;
      feed.querySelector('.zx-intro')?.remove();
      const banner=el('div','zx zx-intro zx-arrival',[arrivalPennant(),el('div','zx-arrival-copy',[el('small','',subtitle),el('b','',title)])],
        {role:'status','aria-live':'polite','data-ui-layer':'stage-intro'});
      feed.append(banner);
      setTimeout(()=>banner.remove(),1800);
    }
    hud.stageIntro=r=>{
      if(r.terrain.bossSite)intro(paperStages[r.stage-1],'桌上世界 · 圣地');
      else if(!r.sanctuary)intro(paperStages[r.stage-1],'桌上世界 · 第 '+r.stage+' 区');
    };
    const evolve=run.startEvolution.bind(run);
    run.startEvolution=()=>{
      const route=windRoutes.find(route=>route.middle===run.nextEvo.to||route.final===run.nextEvo.to);
      if(!route)return evolve();
      run.state='modal';
      run.sprites.prepareHeroForm(run.nextEvo.to,run.r.renderer);
      const details=card(statRow('基础成长','提升伤害与生命'),statRow('进阶次数',String(run.player.evoStage+1)));
      details.dataset.paperSurface='move-paper';
      windEvolutionDialog('字意更进一步',routeHeading(route)+'路线',[
        routePrint([run.player.speciesId,run.nextEvo.to]),
        el('b','zx-evo-confirm-name',character(run.player.speciesId).word+' → '+character(run.nextEvo.to).word),
        small('保留当前招式与已有强化。'),details,
      ],[button('确认进阶  →',()=>{hud.hideModal();run.state='play';evolve();},'primary',{'data-action':'confirm-wind-evolution','data-paper-surface':'journal-button'})]);
      evolutionCard(run.player.speciesId,run.nextEvo.to);
    };
    hud.compact=true;
    const node=el('div','zx zx-hud');node.dataset.hud='true';
    const levelValue=el('b','zx-hud-level'),gold=el('b','zx-hud-gold'),score=el('b','zx-hud-score');
    const clock=el('b','zx-hud-clock'),inventory=el('div','zx-loadout');
    const skillSlots=el('div','zx-skill-slots',[],{'data-ui-layer':'skills','aria-label':'本局技能'});
    const c=character(run.startSpecies),coin=hudPaperIcon('coin',18);
    const stageCaption=el('canvas','zx-stage-caption',[],{width:368,height:52,role:'img','data-ui-region':'hud-top','data-static':'true'});
    const vitamins=el('div','zx-hud-vitamins vitamin-rail',[],{'aria-label':'本局BUFF','data-ui-layer':'items'});
    inventory.append(el('div','zx-loadout-top',[skillSlots,vitamins]));
    const health=el('canvas','zx-player-health',[],{width:176,height:40,'data-static':'true','data-ui-layer':'health',role:'progressbar','aria-label':'角色生命','aria-valuemin':0});
    node.classList.add('zx-hud-'+c.tone,'zx-hud-paper','zx-square-hud');
    const portrait=el('canvas','zx-profile-art',[],{width:372,height:104,role:'progressbar','aria-label':c.name+' · 升级经验','aria-valuemin':0,'aria-valuemax':100});
    portrait.dataset.static='true';
    portrait.dataset.uiLayer='portrait';
    const xpRing=new ExperienceRing(run.player,performance.now());
    const experience=()=>xpRing.progress;
    hud.experienceReady=()=>xpRing.ready;
    let portraitFrame=0,statusKey='',stageKey='';
    const refreshPortrait=()=>{
      const progress=experience(),word=glyphWordForSpecies(run.player.speciesId??run.startSpecies);
      const level=compactCounter(xpRing.level),coins=compactCounter(Math.round(run.gold)),kills=compactCounter(run.stats.kills);
      const key=[progress,level,coins,kills,word,run.skinLook].join('|');
      if(key===statusKey)return;
      statusKey=key;
      drawBattleStatus(portrait,{word,tone:character(run.player.speciesId).tone,look:run.skinLook,level,progress,gold:coins,kills},coin);
      portrait.dataset.progress=String(progress);portrait.dataset.frame=String(++portraitFrame);
      portrait.setAttribute('aria-valuenow',Math.floor(progress*100+1e-7));
      updateText(levelValue,'Lv.'+xpRing.level);
      updateText(gold,coins);updateText(score,kills);
      gold.dataset.total=String(Math.round(run.gold));score.dataset.total=String(run.stats.kills);
    };
    refreshPortrait();
    const minimap=hud.minimap;minimap.classList.add('zx-minimap');minimap.width=minimap.height=240;minimap.dataset.static='true';
    minimap.dataset.uiLayer='minimap';
    minimap.setAttribute('aria-label','附近地图，点击查看更大范围');
    const timePrint=el('canvas','zx-timer-print',[],{width:184,height:58,'data-static':'true','aria-hidden':'true'});
    const clockDock=el('div','zx-map-clock',[clock,timePrint],{'data-ui-layer':'counters','aria-label':'关卡时间'});
    const pauseButton=button(paperIcon('hud-pause'),()=>run.pause(),'zx-hud-pause zx-plain',{'data-paper-surface':'flat','aria-label':'暂停'});
    node.append(stageCaption,el('div','zx-hud-top',[
      el('div','zx-hud-profile',[portrait,
        el('div','zx-status-values',[levelValue,gold,score],{'data-ui-hidden':'true'})]),
      inventory,minimap,el('div','zx-status-row',[clockDock]),pauseButton,
    ],{'data-ui-region':'hud-stack'}),health);
    // Touch controls live beside #hud. Place the new bar above their gesture
    // surface so the pause button receives an actual native pointer event.
    const portalCopy=small('');
    const portalGuide=el('div','zx-portal-guide',[el('b','','Boss 已击败 · 门已开启'),portalCopy],{'aria-live':'polite'});
    portalGuide.hidden=true;
    hud.root.append(node);
    const combo=hud.els.streak;
    combo.dataset.uiLayer='streak';
    combo.classList.add('zx-combo');combo.firstElementChild.textContent='连击';
    combo.firstElementChild.dataset.paperText=combo.children[1].dataset.paperText='outlined';
    hud.hudEl.append(combo);
    const updatePeers=run.coop?createPeerHud(run,node,el):null;
    const combatFeed=installReviewBattle(hud,run,node.querySelector('.zx-hud-top'),{wordFor:glyphWordForSpecies,typeName:api.typeName,typeOf:api.speciesType});
    // Shared by evolution results, the ultimate indicator and the final countdown.
    const stillMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let resultSlip=null, preparedResult=null;
    function clearEvolution(){
      resultSlip?.node.remove();resultSlip?.stamp.remove();resultSlip=null;
    }
    function evolutionCard(from,to){
      if(preparedResult?.from!==from || preparedResult?.to!==to){
        preparedResult={...evolutionResult(character(from),character(to),run.skinLook),from,to};
      }
      return preparedResult;
    }
    hud.showEvolution=(from,to)=>{
      combatFeed.clearAnnouncement();
      clearEvolution();
      if(from==null)preparedResult=null;
      else evolutionCard(from,to);
    };
    hud.prepareEvolutionResult=(from,to,before,after)=>{
      const card=evolutionCard(from,to);
      card.setHealth(before,after);
      const animate=!run.hideOwnFx&&profile()?.settings.showBanners!==false&&!run.vfx.calm&&!stillMotion?.matches;
      card.paint(animate?0:1);
      card.settled=!animate;
    };
    hud.evolutionReveal=(from,to,before,after)=>{
      clearEvolution();
      if(evolutionCard(from,to).settled==null)hud.prepareEvolutionResult(from,to,before,after);
      resultSlip=preparedResult;preparedResult=null;
      resultSlip.start=run.realTime;
      combatFeed.lane.insertBefore(resultSlip.node,toastLayer);
    };
    function placeEvolutionStamp(feet){
      const {node:card,stamp}=resultSlip;
      const size=Math.min(132,Math.round(window.innerWidth*.33));
      const x=Math.min(window.innerWidth-size-8,Math.max(feet.x+50,window.innerWidth*.80-size/2));
      const bounds=card.getBoundingClientRect();
      // The native HUD measures a newly mounted card on its first draw.
      if(!bounds.height)return;
      const minY=bounds.bottom+8,maxY=window.innerHeight-size-8;
      let y=Math.max(minY,Math.min(maxY,feet.y-36-size/2));
      // Short screens can put the ultimate button level with the hero.
      // Prefer the marked spot above the button whenever the card leaves room.
      const button=hud.touch.ult.getBoundingClientRect();
      if(button.width&&x+size>button.left-6&&x<button.right+6&&y+size>button.top-6&&y<button.bottom+6){
        y=button.top-size-6>=minY?button.top-size-6:Math.min(maxY,button.bottom+6);
      }
      if(stamp.style.width!==size+'px')stamp.style.width=stamp.style.height=size+'px';
      const position='translate('+Math.round(x)+'px, '+Math.round(y)+'px)';
      if(stamp.style.transform!==position)stamp.style.transform=position;
      if(!stamp.parentElement)node.append(stamp);
    }
    function updateEvolution(feet){
      const elapsed=run.realTime-resultSlip.start;
      if(elapsed>=2.4){clearEvolution();return;}
      placeEvolutionStamp(feet);
      if(resultSlip.settled||elapsed===0)return;
      const progress=Math.min(1,elapsed/.2);
      resultSlip.paint(progress);
      resultSlip.settled=progress===1;
    }
    hud.touch.ult.dataset.uiLayer='ultimate';
    // Feedback follows the persistent status, health bars and team instead of sharing their screen coordinates.
    const toastLayer=el('div','zx-toast-layer',[],{'data-ui-layer':'toasts'});
    combatFeed.lane.append(toastLayer);toastLayer.append(hud.toastsEl);
    combatFeed.lane.append(el('div','zx-hint-slot',[portalGuide]));
    hud.placeToasts=()=>{};
    // Preserve absolute HUD coordinates, but refresh only the visible overlay.
    for(const id of ['markers','notices']){
      const layer=el('div','zx-combat-overlay',[],{'data-ui-layer':id});
      layer.style.cssText='position:absolute;left:0;top:0;width:0;height:0;overflow:visible;pointer-events:none';
      hud.hudEl.append(layer);
      if(id==='markers')layer.append(hud.arrow,hud.markTag,...hud.pins);
      else hud.popupRoot=layer;
    }
    const look=hud.look.bind(hud);
    hud.touch.swipeMove=false;hud.touch.centeredStick=false;hud.touch.floatingStick=true;hud.touch.el.classList.add('zx-touch','zx-paper-touch');
    hud.touch.el.setAttribute('aria-label','拖动摇杆或滑动空白处移动，松手停止');
    hud.touch.stick.setAttribute('aria-label','移动摇杆');
    hud.touch.stick.dataset.uiLayer='stick';
    hud.look=s=>{
      look(s);hud.touch.fixed=false;
      minimap.hidden=s.showMinimap===false;
      node.style.opacity=String(s.hudOpacity??1);node.style.fontSize=(13*(s.hudScale??1))+'px';
    };
    hud.look(profile().settings);
    const controls=el('div','zx-field-controls');
    const prompts=el('div','zx-field-prompts'),release=hud.releaseEl,releaseHome=release.parentElement;
    hud.touch.ult.parentElement.append(controls);controls.append(hud.touch.ult,prompts);prompts.append(hud.touch.act);
    const actionButton=hud.touch.act;
    actionButton.dataset.paperSurface='scene-action';
    actionButton.setAttribute('role','button');
    const actionPrint=()=>el('img','zx-interact-print',[],{src:'assets/ui-paper/scene-ticket.png',alt:'','aria-hidden':'true','data-paper-tilt':'-3'});
    const actionMark=actionPrint();
    const actionTitle=text=>el('b','zx-act-title',text,{'data-paper-text':'ticket'});
    const touchUpdate=hud.touch.update.bind(hud.touch);let lastInteraction='';
    hud.touch.update=(r,prompt)=>{
      touchUpdate(r,prompt);
      if(hud.touch.shown&&release.parentElement!==prompts){
        release.dataset.paperSurface='scene-action';release.setAttribute('aria-label','放生伙伴');
        release.replaceChildren(actionPrint(),el('span','zx-ticket-label',actionTitle('放生伙伴'),{'data-print-angle':'-3'}));
        prompts.append(release);
      }else if(!hud.touch.shown&&r.state==='play'&&release.parentElement===prompts){
        delete release.dataset.paperSurface;release.replaceChildren(el('kbd','', 'G',{'data-nokbd':'1'}),'放生伙伴');
        releaseHome.append(release);
      }
      if(!hud.touch.shown||!prompt){lastInteraction='';return;}
      const raw=hud.touch.actText,action=sceneAction(r,r.interactables.nearest,raw);
      if(!action)return;
      const {title,detail,unavailable}=action,key=[raw,title,detail,unavailable].join('|');
      if(key===lastInteraction)return;
      lastInteraction=key;
      actionButton.firstChild.replaceChildren(actionMark);
      actionButton.lastChild.classList.add('zx-ticket-label');
      actionButton.lastChild.dataset.printAngle='-3';
      actionButton.lastChild.replaceChildren(actionTitle(title),...(detail?[el('small','zx-act-detail',detail,{'data-paper-text':'ticket'})]:[]));
      actionButton.classList.toggle('zx-act-poor',unavailable);
      actionButton.setAttribute('aria-label',raw.replace(/₽/g,'金币'));
    };
    for(const element of hud.hudEl.querySelectorAll('.hud-tl,.under,.hud-party,.hud-top,.hud-tr,.hud-bl,.hud-br,.lock-hint'))element.dataset.uiHidden='true';
    hud.fitTop=()=>{};
    let mapAt=-Infinity,mapFrame=0;
    hud.drawMinimap=(r,force=false)=>{
      const now=performance.now();if(minimap.hidden||(!force&&now-mapAt<(run.performance?.mapInterval??120)))return;
      mapAt=now;drawBattleMinimap(minimap,r,{hanging:true,atlas:regionAtlas(r.terrain),facilityKind:r.stageCleared?'portal':hud.mapFacilityKind});minimap.dataset.frame=String(++mapFrame);
    };
    const ultimateRing=el('canvas','zx-ult-progress',[],{width:168,height:168,'data-static':'true'});
    hud.touch.ult.append(ultimateRing);
    hud.touch.ult.setAttribute('role','button');
    let lastSeal='',lastActionLabel='';
    const ultimateIcons=new Map();
    const ultimateType=r=>r.player.types[0];
    const ultimateIcon=r=>{
      const type=ultimateType(r);
      if(!ultimateIcons.has(type)){
        const image=new Image();
        image.alt=api.typeName(type)+'属性';
        image.src=api.moveIcon({type});
        ultimateIcons.set(type,image);
      }
      return ultimateIcons.get(type);
    };
    hud.ultHud=r=>{
      const active=r.ult.active>0,ready=r.ult.ready&&!active&&!r.player.dead;
      for(const [name,on] of [['ready',ready],['active',active],['deny',r.ult.denyT>0]])hud.touch.ult.classList.toggle(name,on);
      const rounded=Math.round(Math.max(0,Math.min(1,r.ult.charge))*1000)/1000;
      const progress=r.ult.ready?rounded:Math.min(.999,rounded);
      const word=glyphWordForSpecies(r.player.speciesId??r.startSpecies);
      const state=active?'active':ready?'ready':'charging',type=ultimateType(r),icon=ultimateIcon(r);
      const image=icon.complete&&icon.naturalWidth?icon:null;
      const palette=ready?r.ult.readyPalette:null;
      ultimateRing.readyStill=!!stillMotion?.matches;
      const elapsed=r.time-(r.ult.readyFlashAt??r.time);
      const diamond=ready?readyDiamondFrame(ultimateRing.readyStill ? .52 : elapsed):0;
      const key=[type,!!image,state,progress,diamond,palette?.base].join('/');
      if(lastSeal!==key){
        lastSeal=key;
        drawUltimateSeal(ultimateRing,image,progress,state,palette,diamond);
        ultimateRing.dataset.frame=key;ultimateRing.dataset.progress=String(progress);ultimateRing.dataset.type=type;
      }
      const label=word+'的大招，'+(ready?'可释放':active?'释放中':Math.floor(progress*100)+'%');
      if(lastActionLabel!==label){
        lastActionLabel=label;hud.touch.ult.setAttribute('aria-label',label);
        hud.touch.ult.setAttribute('aria-disabled',String(!ready));
      }
    };
    hud.prepareEntryIcons=async()=>{
      await Promise.all([...Array.from(node.querySelectorAll('.zx-loadout-icon'),prepareHudImage),
        prepareHudImage(ultimateIcon(run))]);
      hud.ultHud(run);
    };
    const original=hud.hud.bind(hud);
    let last=-Infinity,lastState='',lastSupplies='',lastHealth='',healthFrame=0;
    let previousArrangement='';
    const updateHealth=(point)=>{
      const p=run.player;
      health.hidden=!point.vis||p.dead;
      if(health.hidden)return;
      // Project after the camera update on every frame, independent of the
      // slower top HUD. Native rendering moves this small cached texture only.
      const position='translate('+Math.round(point.x-44)+'px, '+Math.round(point.y+10)+'px)';
      if(health.style.transform!==position)health.style.transform=position;
      const current=Math.max(0,Math.ceil(p.hp)),maximum=Math.max(1,Math.round(p.maxHp));
      const fraction=Math.round(Math.max(0,Math.min(1,p.hp/Math.max(1,p.maxHp)))*1000)/1000;
      const bonus=Math.max(0,Math.round(p.shield+p.overheal)),key=[current,maximum,fraction,bonus].join('/');
      if(key===lastHealth)return;
      drawBattleHealth(health,fraction,current,maximum,bonus);
      lastHealth=key;
      health.dataset.progress=String(fraction);health.dataset.frame=String(++healthFrame);
      health.setAttribute('aria-valuenow',current);health.setAttribute('aria-valuemax',maximum);
      health.setAttribute('aria-label','生命 '+current+' / '+maximum+(bonus?'，护盾与额外生命 '+bonus:''));
    };
    // Keep the combo in the upper-right area, clear of the player and release button.
    // On short screens use the button's left side if the pause button limits headroom.
    function placeCombo(){
      let top='',right='';
      if(run.streak>=20 && run.streakT>0){
        const area=hud.hudEl.getBoundingClientRect(),ult=hud.touch.ult.getBoundingClientRect();
        if(area.height && ult.height){
          const gap=16,comboHeight=108;
          const pauseBottom=pauseButton.getBoundingClientRect().bottom;
          const above=Math.min(Math.max(area.height*.24-46,pauseBottom-area.top+gap),ult.top-area.top-gap-comboHeight);
          if(area.top+above>=pauseBottom+gap){
            top=Math.round(above)+'px';
          }else{
            top=Math.round(Math.max(0,Math.min(area.height-comboHeight,ult.top-area.top)))+'px';
            right=Math.ceil(area.right-ult.left+gap)+'px';
          }
        }
      }
      if((combo.style.top||'')===top && (combo.style.right||'')===right)return;
      combo.style.top=top;combo.style.right=right;
      combo.dataset.placement=top+'/'+right;
    }
    hud.hud=function(...args){
      placeCombo();
      hud.streakHud(run.streak,run.streakT,run.realTime);
      hud.updateEffectivePopups(run);
      const pos=run.player.pos,feet=hud.project(run,pos.x,pos.y-.15,pos.z);
      if(resultSlip)updateEvolution(feet);
      updateHealth(feet);
      const guideVisible=run.stageCleared&&!run.endless&&!run.tower&&run.state==='play'&&!app.screen&&!hud.hasModal();
      if(portalGuide.hidden===guideVisible)portalGuide.hidden=!guideVisible;
      toastLayer.classList.toggle('zx-exit-guidance',guideVisible);
      if(guideVisible){
        run.hints.el?.remove();
        updateText(portalCopy,portalGuidance(run));
      }
      const now=performance.now();
      updatePeers?.();
      if(expandedMap){
        if(!expandedMap.canvas.isConnected)expandedMap=null;
        else if(run.coop&&now-expandedMap.at>=(run.performance?.mapInterval??120)){
          expandedMap.paint();
          expandedMap.at=now;window.invalidateUI?.();
        }
      }
      xpRing.update(run.player,now,run.state==='play');
      refreshPortrait();
      const remaining=remainingZoneSeconds(run);
      const timeLabel=run.sanctuary?time(run.stageTime):run.endless||run.tower?time(run.time):remaining>=0?time(remaining):'+'+time(-remaining);
      updateText(clock,timeLabel);
      const urgent=!run.sanctuary&&!run.tower&&!run.endless&&remaining>0&&remaining<=10;
      const phase=urgent&&run.state==='play'&&!stillMotion?.matches&&!run.meta.profile.settings.reduceFlashes?Math.floor((run.stageTime%1)*12):0;
      const timeKey=timeLabel+'/'+urgent+'/'+phase;
      if(timePrint.dataset.frame!==timeKey){
        drawHudClock(timePrint,timeLabel,urgent,phase);timePrint.dataset.frame=timeKey;
      }
      if(lastState===run.state&&(now-last<(run.performance?.hudInterval??80)||run.state==='paused'||run.state==='modal'||run.state==='over')){
        hud.updateWorldLabelPositions(run);
        if(run.state==='play'&&(run.ult.ready||hud.touch.ult.classList.contains('ready')))hud.ultHud(run);
        return;
      }
      last=now;lastState=run.state;
      original(...args);
      combatFeed.syncEvent();
      combatFeed.placeTeam(hud.coopHud);
      combatFeed.placeMarkers();
      const p=run.player;
      const stage=paperStages[Math.min(3,run.stage-1)],region=run.sanctuary?'圣地':run.stage+(run.mode===SINGLE_STAGE?'/1区':'/'+FOREST_COMBAT_ZONES+'区');
      const detail=region+' · '+difficultyName(run)+'难度';
      if(stageKey!==stage+detail){
        stageKey=stage+detail;drawStageCaption(stageCaption,stage,detail);stageCaption.setAttribute('aria-label',stage+' · '+detail);
      }
      updateSkillSlots(skillSlots,run);
      const supplyKey=JSON.stringify([...p.vitamins].map(([id,v])=>[id,v.level]));
      if(lastSupplies!==supplyKey){
        lastSupplies=supplyKey;vitamins.replaceChildren(...supplyIcons(run));
        vitamins.hidden=!vitamins.children.length;
      }
      const compact=window.innerWidth<=350;
      const arrangement=[vitamins.children.length,skillSlots.children.length,compact].join('/');
      if(arrangement!==previousArrangement){
        const width=n=>Math.max(0,n*((compact?22:24)+2)-2)+'px';
        vitamins.style.width=width(vitamins.children.length);
        skillSlots.style.width=width(skillSlots.children.length);
        inventory.dataset.arrangement=arrangement;previousArrangement=arrangement;
      }
      for(const slot of skillSlots.children){
        const move=p.moves[Number(slot.dataset.skillSlot)],canvas=slot.querySelector('.zx-skill-cooldown');
        if(!move||!canvas)continue;
        const m=move.def.arch==='random'&&move.sub?move.sub:move;
        const active=m.active>0||m.charging||m.burst.length>0,ready=m.waitingForTarget||m.timer<=0;
        const progress=ready?1:Math.round(Math.max(0,1-m.timer/Math.max(.001,m.cooldownTotal||m.timer))*1000)/1000;
        const key=[progress,ready,active].join('/');
        if(canvas.dataset.frame!==key){drawBattleCooldown(canvas,progress,{ready,active});canvas.dataset.frame=key;canvas.dataset.progress=String(progress);}
      }
    };
  }
  async function loading(total,loaded,onProgress) {
    // Entry owns its loading screen until the first scene frame is ready.
    // A portal keeps the previous battle frame visible while the glyphs load.
    const view=onProgress||app.run?.changingZone?null:loadingScreen('stage-loading');
    const began=performance.now();
    try {
      for(;;){
        const n=loaded(),ratio=total?Math.min(1,n/total):1;
        const state={phase:'准备字灵',detail:'文字就绪 '+n+' / '+total,progress:onProgress ? .8+.14*ratio:ratio};
        if(onProgress)onProgress(state);else view?.update(state);
        if(n>=total)return;
        if(performance.now()-began>30000)throw Error('字灵准备超时（'+n+'/'+total+'），请重试进入');
        await new Promise(resolve=>setTimeout(resolve,80));
      }
    }finally{if(view&&app.screen===view.node)app.setScreen(null);}
  }
  function slots(run,machine,resume,result=null,mustResume=false) {
    const symbols={seven:'极',pikachu:'攻',berry:'生',meowth:'财',voltorb:'震',gengar:'厄',magikarp:'空'};
    const prizes={seven:'获得三个道具，包含高品质奖励。',pikachu:'获得稀有或更高品质的道具。',berry:'恢复 25% 生命，并获得道具。',meowth:'获得本次投入 2.5 倍的金币。',voltorb:'触发伏击，准备迎战。',gengar:'本局敌人数量与难度提升。',none:'这次未中奖，可以继续挑战。'};
    const spin=()=>{const next=machine.spin();if(!next)return;const exit=machine.pay(next);slots(run,machine,resume,next,exit);};
    const reelWords=result?.reels||['pikachu','meowth','berry'];
    const machineFace=el('section','zx zx-arcade',[
      el('header','zx-arcade-header',[el('h2','','老虎机'),el('span','',[hudPaperIcon('coin',19),el('b','',compactCounter(run.gold))])]),
      el('div','zx-arcade-window',reelWords.map(key=>el('div','zx-arcade-reel',[
        el('i','zx-arcade-notch'),el('b','',symbols[key]),el('i','zx-arcade-notch'),
      ]))),
      el('div','zx-arcade-tray',[
        el('b','',result?(result.prize==='none'?'字运未至':'好运入字'):'字运当头'),
        text(result?prizes[result.prize]:'本次投入 '+machine.cost()+' 金币','zx-arcade-caption'),
      ]),
      el('footer','zx-arcade-controls',[
        button('返回',resume,'',{'data-action':'slot-back'}),
        mustResume?button('继续旅程',resume,'primary'):button((result?'继续 · ':'')+'投入 '+machine.cost()+' 金币',spin,'primary',{disabled:run.gold<machine.cost(),'data-action':'slot-spin'}),
      ]),
    ],{role:'dialog','aria-label':'老虎机','data-paper-surface':'arcade'});
    const wrap=run.ui.modal(machineFace);wrap.className='zx zx-modal-wrap zx-arcade-overlay';

  }
  return ui;
}
