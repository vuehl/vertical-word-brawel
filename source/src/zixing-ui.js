import {glyphAtlasReady,glyphCanvas,glyphWordForSpecies} from './paper-glyph-art.js';
import {drawPaperIllustration} from './paper-ui-art.js';
import {drawBattlePortrait,drawBattleMinimap} from './paper-hud-art.js';
import {paperStages} from './paper-world.js';
import {zixingStyle} from './zixing-style.js';
import {laboratory} from './catalogs.js';
import {waitForLoadingPaint} from './loading-work.js';

export const characters = [
  {id:4,word:'火',name:'灼行者',tone:'fire',color:'#bc3441',role:'爆发',motto:'以攻为守，燎原不息',move:'火弹',ult:'燎原'},
  {id:7,word:'水',name:'溯游者',tone:'water',color:'#3278ba',role:'均衡',motto:'行若流水，进退有度',move:'水环',ult:'惊涛'},
  {id:1,word:'木',name:'立木者',tone:'wood',color:'#28874e',role:'续航',motto:'生生不息，积势而发',move:'飞叶',ult:'森息'},
];
const character=id=>characters.find(c=>id>=c.id&&id<=c.id+2)||characters[0];
const number=n=>Math.round(Number(n)||0).toLocaleString('en-US');
const percent=n=>Number(((Number(n)||0)*100).toFixed(1))+'%';
const time=n=>Math.floor((n||0)/60).toString().padStart(2,'0')+':'+Math.floor((n||0)%60).toString().padStart(2,'0');
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
const small=s=>el('small','zx-note',s);
const row=(...nodes)=>el('div','zx-row',nodes);
const col=(...nodes)=>el('div','zx-col',nodes);
const card=(...nodes)=>el('div','zx-card',nodes);
function glyph(c,large=false){
  const word=c.word||c,node=el('div','zx-glyph '+(c.tone||'')+(large?' large':''),[],{'aria-label':word});
  const canvas=el('canvas','zx-glyph-image',[],{width:192,height:192});canvas.dataset.static='true';node.append(canvas);
  const draw=()=>{canvas.getContext('2d').clearRect(0,0,192,192);canvas.getContext('2d').drawImage(glyphCanvas(word,c.tone),0,0);canvas.dataset.glyphReady='true';};
  draw();glyphAtlasReady().then(draw).catch(()=>{});return node;
}
const statRow=(label,value)=>el('div','zx-stat-row',[el('b','',label),el('span','',value)]);
// Paths keep icons independent of the device's font and emoji support.
function icon(name,size=24,color='#766a88') {
  const canvas=el('canvas','zx-icon',[],{width:size*2,height:size*2,'data-icon':name,'aria-hidden':true});
  canvas.dataset.static='true';canvas.style.width=size+'px';canvas.style.height=size+'px';
  const ctx=canvas.getContext('2d');ctx.scale(size/12,size/12);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1.7;ctx.lineCap='round';ctx.lineJoin='round';
  if(name==='lock'){
    ctx.beginPath();ctx.roundRect(5.5,10,13,11,2.5);ctx.stroke();
    ctx.beginPath();ctx.moveTo(8,10);ctx.lineTo(8,7);ctx.arc(12,7,4,Math.PI,Math.PI*2);ctx.lineTo(16,10);ctx.stroke();
  }else if(name==='check'){
    ctx.fillStyle='#326bd4';ctx.beginPath();ctx.arc(12,12,11,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(6.5,12);ctx.lineTo(10,15.5);ctx.lineTo(17,8.5);ctx.stroke();
  }else if(name==='target'){
    ctx.beginPath();ctx.arc(12,12,6,0,Math.PI*2);ctx.moveTo(12,3);ctx.lineTo(12,8);ctx.moveTo(12,16);ctx.lineTo(12,21);ctx.moveTo(3,12);ctx.lineTo(8,12);ctx.moveTo(16,12);ctx.lineTo(21,12);ctx.stroke();
  }else if(name==='jump'){
    ctx.beginPath();ctx.moveTo(6,12);ctx.lineTo(12,6);ctx.lineTo(18,12);ctx.moveTo(6,18);ctx.lineTo(12,12);ctx.lineTo(18,18);ctx.stroke();
  }else if(name==='dash'){
    ctx.beginPath();ctx.moveTo(4,7);ctx.lineTo(12,7);ctx.moveTo(2,12);ctx.lineTo(15,12);ctx.moveTo(4,17);ctx.lineTo(12,17);ctx.moveTo(15,6);ctx.lineTo(21,12);ctx.lineTo(15,18);ctx.stroke();
  }else if(name==='settings'){
    ctx.lineWidth=1.6;ctx.beginPath();
    for(let i=0;i<48;i++){
      const angle=-Math.PI/2+i*Math.PI/24,r=[8,8,9.7,9.7,8,8][i%6];
      const x=12+Math.cos(angle)*r,y=12+Math.sin(angle)*r;
      if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
    }
    ctx.closePath();ctx.stroke();ctx.beginPath();ctx.arc(12,12,3.1,0,Math.PI*2);ctx.stroke();
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
function mapThumbnail(index){return drawPaperIllustration(el('canvas','zx-map-thumb',[],{width:228,height:150}),false,index+1);}
function button(label,action,kind='',attrs={}) {
  const node=el('button','zx-button '+kind,label,{type:'button',...attrs});
  node.addEventListener('click',async()=>{
    if(node.disabled||node._busy)return;
    node._busy=true;
    try{await action();}catch(error){window.__zixingApp?.notice(error.message||String(error));}
    finally{node._busy=false;}
  });
  return node;
}
const link=(label,action)=>button(label,action,'zx-link');
function tabs(labels,index,change,kind='') {
  return el('div','zx-tabs '+kind,labels.map((label,i)=>el('button','zx-tab'+(index===i?' on':''),label,
    {type:'button','aria-pressed':index===i,onclick:()=>change(i)})));
}
function forestArt(){return drawPaperIllustration(el('canvas','zx-forest',[],{width:780,height:300}));}
function homeArt(){return drawPaperIllustration(el('canvas','zx-home-illustration',[],{width:780,height:600,'aria-label':'字行 · 纸上世界，字灵同行'}),true);}
const labNames={dmg:['攻','伤害'],atkspd:['速','攻击速度'],spd:['移','移动速度'],area:['域','攻击范围'],crit:['暴','暴击率'],hp:['生','最大生命'],armor:['甲','护甲'],regen:['复','生命回复'],magnet:['拾','拾取范围'],xp:['悟','经验获取'],gold:['财','金币获取'],luck:['运','幸运'],ult:['极','大招充能']};
const labGroups=[['dmg','atkspd','spd','area','crit'],['hp','armor','regen','magnet'],['xp','gold','luck','ult']];
export function createZixingUI(app,api) {
  if(app.zixing)return app.zixing;
  document.documentElement.classList.add('zixing');
  const style=el('style','',zixingStyle);document.head.append(style);
  window.__zixingApp=app;
  let selected=4,tier=0,labTab=0,settingsTab=0,settingsSub=0,returnTo=null,authPromise=null,activeEntry=null;
  const ui=app.zixing={home,choose,map,difficulty,lab,settings,help,stats,attachRun,loading,start};
  const current=()=>character(selected);
  const profile=()=>app.meta.profile;
  const goBack=()=>returnTo?returnTo():home();
  function screen(name,title,subtitle,body,actions=[],color='') {
    const node=el('section','screen zx zx-'+name,[],{'data-page':name,'data-fullscreen':'true'});
    if(title)node.append(el('header','zx-header '+color,[el('h1','',title),el('small','',subtitle)]));
    node.append(el('div','zx-body',body));
    if(actions.length)node.append(el('footer','zx-footer',actions));
    app.setScreen(node);applyTheme();return node;
  }
  function applyTheme(){
    const theme=profile()?.settings.zxTheme||'auto';
    const systemDark=window.nativeUI?window.prefersDark:window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark=theme==='dark'||theme==='auto'&&systemDark;
    document.documentElement.classList.toggle('zx-dark',dark);
    const s=app.screen;
    if(s){s.style.setProperty('--paper',dark?'#252235':'#f8f5ea');s.style.setProperty('--ink',dark?'#eee9f8':'#29263c');}
  }
  async function ready() {
    if(profile())return;
    if(!authPromise)authPromise=(async()=>{const account=await app.backend.guest();await app.meta.load(account);app.applySettings();})().finally(()=>{authPromise=null;});
    return authPromise;
  }
  function home() {
    returnTo=null;
    if(profile())selected=character(profile().lastSpecies||profile().starter||4).id;
    const root=screen('home','','',[
      el('div','zx-home-copy',[el('h2','','从一个字开始'),text('走位避险，自动出招。'),text('在五行之间，写下你的这一局。')]),
      el('div','zx-home-types',characters.map(c=>row(glyph(c),el('span','',c.role)))),
      button([el('span','','开始旅程'),el('span','','→')],async()=>{await ready();choose();},'primary zx-home-start',{'data-action':'journey'}),
      button(row(glyph('研'),col(el('b','','研究所'),el('small','','永久强化 · 每次出发更进一步')),el('span','','›')),async()=>{await ready();lab();},'purple zx-home-lab',{'data-action':'lab'}),
      el('div','zx-home-foot',[button([icon('book',16,'#61567b'),el('span','','玩法说明')],()=>help(),'zx-plain'),small('单人 · 经典')]),
    ]);
    const body=root.querySelector('.zx-body');body.classList.add('zx-home-body');
    const art=el('div','zx-home-art',homeArt());
    root.replaceChildren(el('div','zx-home-top',row(small('单人冒险 · 字灵同行'),button(icon('settings',21,'#382c4e'),async()=>{await ready();settings();},'zx-gear',{'aria-label':'设置'}))),el('div','zx-home-scroll',[art,body]));
  }
  function choose() {
    const c=current();
    screen('choose','选择文字','01 / 03 · 选择你的起点',[
      el('div','zx-hero',[small('字灵 · '+c.word),glyph(c,true),text(c.motto,'zx-note')]),
      el('div','zx-choices',characters.map(ch=>button([glyph(ch),el('b','',ch.word),small(ch.role)],()=>{selected=ch.id;choose();},'zx-choice '+ch.tone+(selected===ch.id?' on':''),{'data-species':ch.id,'aria-pressed':selected===ch.id}))),
      card(row(glyph(c),col(el('b','',c.move+'  ·  自动攻击'),small(api.moveDescription(c.id)))),row(glyph('极'),col(el('b','',c.ult+'  ·  大招'),small(api.ultDescription(c.id))))),
      link('▥ 查看属性                         基础 + 研究加成 ›',()=>stats(null,()=>choose())),
    ],[button('选择关卡  →',async()=>{if(!profile().starter)await app.meta.chooseStarter(selected);profile().lastSpecies=selected;app.meta.save();map();},'primary'),button('返回',home)]);
  }
  function map() {
    const hero=card(forestArt(),el('div','zx-row zx-map-caption',[col(small('第一站'),el('h2','','桌上世界')),icon('check',28)]));
    hero.classList.add('zx-map-card');
    screen('map','选择关卡','02 / 03 · 经典旅程',[
      hero,
      el('div','zx-map-summary',[text('裁切垫 · 手帐纸 · 巨型文具','zx-note'),text('3 个区域 → 圣地终战')]),
      row(el('b','','后续关卡'),small('等待开放')),
      el('div','zx-lock-list',['玩具阁楼','画室奇境','书架云端'].map((name,i)=>el('div','zx-lock',[mapThumbnail(i),col(small('第 0'+(i+2)+' 站'),el('b','',name),small('暂未开放')),icon('lock',22)]))),
    ],[button('选择难度  →',()=>difficulty(),'primary'),button('返回',choose)]);
  }
  function difficulty() {
    const max=Math.min(2,Math.max(0,app.meta.biomeTier('forest')));tier=Math.min(tier,max);
    const descriptions=['熟悉走位与招式，完成旅程。','敌人更强，首领带来更多挑战。','更高强度的进阶挑战。'];
    screen('difficulty','选择难度','03 / 03 · 最后一步',[
      card(row(glyph(current()),col(el('b','',current().word+' · 桌上世界'),small('单人 / 经典')))),
      ...['普通','困难','噩梦'].map((name,i)=>button([glyph(['壹','贰','叁'][i]),col(el('h3','',name),small(descriptions[i]),i>max?small('通关上一难度后解锁'):null),i>max?icon('lock',22):tier===i?icon('check',24):null],()=>{tier=i;difficulty();},'zx-difficulty'+(tier===i?' on':''),{disabled:i>max,'data-tier':i})),
      small('难度按地图分别解锁，无需额外携带消耗品。'),
    ],[button('进入桌上世界  →',start,'primary',{'data-action':'enter'}),button('返回',map)]);
  }
  function loadingScreen(name,actions=[]) {
    const phase=text('正在准备场景资源','zx-note'),detail=text('准备完成后自动进入','zx-note');
    const value=el('b','zx-loading-percent','0%'),fill=el('div','zx-loading-fill');
    const track=el('div','zx-loading-track',fill,{role:'progressbar','aria-label':'场景加载进度','aria-valuemin':0,'aria-valuemax':100,'aria-valuenow':0});
    const elapsed=small('已等待 0 秒');
    const node=screen(name,'','',[el('div','zx-loading-content',[
      small('桌上世界'),el('h1','','正在布置场景'),value,track,phase,detail,elapsed,
    ])],actions);
    node.classList.add('zx-loading-screen');
    let shown=0;
    return {node,elapsed,update({phase:title,detail:message='',progress=0}){
      shown=Math.max(shown,Math.min(100,Math.floor(progress*100)));
      if(value.textContent!==shown+'%'){
        value.textContent=shown+'%';fill.style.width=shown+'%';track.setAttribute('aria-valuenow',shown);
      }
      if(phase.textContent!==title)phase.textContent=title;
      if(detail.textContent!==message)detail.textContent=message;
      return shown;
    }};
  }
  async function start(config={species:selected,biome:'forest',tier,boosts:[],mode:'standard'}) {
    if(activeEntry||app.starting)return false;
    let cancelled=false,canCancel=true,lastPhase='',lastDetailAt=0;
    const began=performance.now(),phases=[],packs=new Map(),percentages=[0];
    const back=button('返回选择',()=>{if(canCancel){cancelled=true;activeEntry=null;diagnostics.status='cancelled';clearInterval(timer);difficulty();}},'',{'data-action':'cancel-entry'});
    const view=loadingScreen('entry',[back]),{node,elapsed}=view;
    activeEntry=node;
    const diagnostics=ui.entryDiagnostics={phases,percentages,status:'loading'};
    const update=({phase:title,detail:message='',progress=0})=>{
      if(cancelled)return;
      const now=performance.now();
      const changed=lastPhase!==title;
      if(changed){lastPhase=title;phases.push({phase:title,atMs:Math.round(now-began)});}
      if(app.screen!==node)return;
      if(changed||now-lastDetailAt>120||!message||progress*100>percentages[percentages.length-1]){
        const value=view.update({phase:title,detail:message,progress});lastDetailAt=now;
        if(value!==percentages[percentages.length-1])percentages.push(value);
      }
    };
    const timer=setInterval(()=>{
      if(app.screen===node)elapsed.textContent='已等待 '+Math.floor((performance.now()-began)/1000)+' 秒';
    },1000);
    try {
      // Give the loading screen a frame before disk/decoder work starts.
      await waitForLoadingPaint(app.r.renderer);
      if(cancelled||node!==app.screen)return false;
      await window.prepareForest?.(state=>{
        packs.set(state.name,state);
        const pending=[...packs.values()].find(s=>s.phase!=='ready')||state;
        const name=pending.name==='world'?'场景':'字灵';
        const action={download:'下载',unpack:'解压',write:'保存',ready:'已准备',error:'准备失败'}[pending.phase];
        // Each pack has download, unpack and write work. Reserve the remaining
        // 60% for the scene, actors and first rendered frame, including cache hits.
        const fraction=s=>!s?0:s.phase==='ready'?1:s.phase==='download' ? .55*(s.total?s.completed/s.total:0):s.phase==='unpack' ? .55:s.phase==='write' ? .7+.3*(s.total?s.completed/s.total:0):0;
        const progress=.2*(fraction(packs.get('world'))+fraction(packs.get('art')));
        update({phase:action+name+'资源',detail:pending.phase==='download'?'正在下载所需资源':pending.total?pending.completed+' / '+pending.total:'正在处理资源',progress});
      });
      if(cancelled||node!==app.screen)return false;
      canCancel=false;back.disabled=true;
      update({phase:'保存出发设置',progress:.4});
      await waitForLoadingPaint(app.r.renderer);
      profile().lastBiome=config.biome;profile().lastSpecies=config.species;await app.meta.saveNow();
      const ok=await app.startRun(config,update);
      if(!ok)throw app.lastStartError||Error('对局未能开始，请重试');
      diagnostics.status='ready';
      return true;
    }catch(error){
      diagnostics.status='error';diagnostics.error=error.message||String(error);
      if(!cancelled)screen('entry-error','暂时未能进入',lastPhase,[card(text(diagnostics.error,'zx-note'))],
        [button('重试进入桌上世界',()=>start(config),'primary',{'data-action':'retry-entry'}),button('返回选择',difficulty)]);
      return false;
    }finally{
      clearInterval(timer);diagnostics.totalMs=Math.round(performance.now()-began);
      if(cancelled)diagnostics.status='cancelled';
      if(activeEntry===node)activeEntry=null;
    }
  }
  function wallet() {
    return el('div','zx-wallet',[row(el('small','','星尘 · 永久研究资源'),button('如何获得 ⓘ',dustHelp,'zx-plain')),el('strong','',number(profile().stardust)),el('small','','对局结算获得 · 与金币独立')]);
  }
  function labValue(item,level) {
    const value=(item.per??(item.id==='ult'?.04:0))*level;
    return '+ '+(['maxHp','armor','luck','pickupRange','regen'].includes(item.stat)?Number(value.toFixed(2))+(item.stat==='regen'?' / 秒':item.stat==='pickupRange'?' 米':''):percent(value));
  }
  function lab(message='') {
    const list=labGroups[labTab].map(id=>laboratory.find(item=>item.id===id));
    screen('lab','研究所','永久强化 · 对所有文字生效',[
      wallet(),tabs(['战斗','生存','成长'],labTab,i=>{labTab=i;lab();},'research'),
      row(el('b','','训练 · '+['战斗','生存','成长'][labTab]+'强化'),small('当前 → 下一级')),
      el('div','zx-card',list.map(item=>{
        const level=app.meta.lab(item.id),max=level>=item.max,cost=max?0:item.cost(level),can=profile().stardust>=cost;
        return el('div','zx-lab-row',[glyph(labNames[item.id][0]),col(row(el('b','',labNames[item.id][1]),small('Lv.'+level+'/'+item.max)),text(labValue(item,level)+(max?' · 已满级':' → '+labValue(item,level+1)),'zx-note'),el('div','zx-pips',Array.from({length:item.max},(_,i)=>el('i',i<level?'on':'')))),
          button([el('b','',max?'满':number(cost)),el('small','','星尘')],()=>research(item),'zx-buy'+(can?'':' poor'),{disabled:max,'data-research':item.id})]);
      })),
      small('研究加成用于下一次新对局。'),message?el('div','zx-success',message):null,
    ],[button('返回',home)],'purple');
  }
  function overlay(title,subtitle,body,actions=[],hud=null,kind='') {
    if(hud)document.querySelectorAll('.run-hint').forEach(node=>node.remove());
    const heading=[subtitle?small(subtitle):null,el('h2','',title)];
    const content=el('section','zx zx-modal '+kind,kind==='zx-pause'?
      [el('div','zx-pause-body',[...heading,...body]),el('footer','zx-pause-footer',actions)]:[...heading,...body,...actions]);
    let wrap;
    if(hud){wrap=hud.modal(content);wrap.className='zx zx-modal-wrap';}
    else {document.querySelector('.zx-dialog')?.remove();wrap=el('div','zx zx-modal-wrap zx-dialog',content);app.ui.append(wrap);}
    if(kind==='zx-pause'){wrap.classList.add('zx-pause-screen');wrap.dataset.fullscreen='true';}
    return wrap;
  }
  function research(item) {
    const level=app.meta.lab(item.id),cost=item.cost(level),dust=profile().stardust,can=dust>=cost;
    let popup;const close=()=>popup.remove();
    const act=button(can?'确认研究 · '+cost+' 星尘  →':'星尘不足 · 无法研究',async()=>{
      act.disabled=true;
      if(!app.meta.buyLab(item.id)){close();lab('星尘或研究等级已变化，请重新选择。');return;}
      app.meta.flush();await app.meta.queue;
      close();lab(app.meta.lab(item.id)>level?'升级成功 · '+labNames[item.id][1]+' '+labValue(item,level+1)+'，下一次新对局生效。':'研究未保存，请重试。');
    },'primary',{disabled:!can,'data-action':'confirm-research'});
    popup=overlay(can?'提升一级':'再积累一些星尘','永久研究 / '+labNames[item.id][1],[
      el('div','zx-center',glyph(labNames[item.id][0],true)),small('强化适用于所有文字，下一次新对局生效。'),
      card(row(col(small('当前'),el('h2','',labValue(item,level))),el('b','','→'),col(small('升级后'),el('h2','',labValue(item,level+1))))),
      statRow('持有星尘',number(dust)),statRow(can?'本次消耗':'升级需要',number(cost)),statRow(can?'升级后剩余':'还差',number(Math.abs(dust-cost))),
    ],[act,...(!can?[button('去冒险获取星尘  →',()=>{close();choose();},'primary')]:[]),button('返回',close)]);
  }
  function dustHelp() {
    screen('dust','星尘从哪里来','研究所资源 · 跨局保留',[
      walletSimple(),card(el('h3','','完成一局冒险'),text('探索、击败敌人与区域镇守，在结算时获得星尘。'),small('最终收益以本局结算为准，每局只结算一次。')),
      card(el('h3','','失败也保留已获收益'),text('按已完成的探索与挑战结算。'),small('未完成的关卡进度不会算作通关。')),
      card(el('b','','星尘 ≠ 局内金币'),text('星尘：跨局保留，用于研究所永久强化。'),text('金币：本局使用，用于场景内消费。')),
      small('暂停不结算，收益仅在结束对局时发放。研究加成用于下一次新对局。'),
    ],[button('返回',()=>lab())],'purple');
  }
  function walletSimple(){return el('div','zx-wallet',[small('星尘 · 永久研究资源'),el('strong','',number(profile().stardust)),text('对局结算获得 · 与金币独立')]);}
  function settings(back=home) {
    returnTo=back;renderSettings();
  }
  function renderSettings() {
    const s=profile().settings,fields=[];
    const save=()=>{app.applySettings();app.meta.save();applyTheme();};
    const toggle=(label,key,note='')=>{
      fields.push(key);const b=el('button','zx-switch'+(s[key]?' on':''),el('i'),{type:'button',role:'switch','aria-label':label,'aria-checked':!!s[key]});
      b.addEventListener('click',()=>{s[key]=!s[key];b.classList.toggle('on',s[key]);b.setAttribute('aria-checked',s[key]);save();});
      return el('div','zx-setting',[row(col(el('b','',label),note?small(note):null),b)]);
    };
    const range=(label,key,min,max,step,format=percent,note='')=>{
      fields.push(key);const v=s[key]??api.defaults[key]??min,labelNode=small(format(v));
      const input=el('input','zx-range',[],{type:'range',min,max,step,value:v,'aria-label':label});
      input.addEventListener('input',()=>{s[key]=Number(input.value);labelNode.textContent=format(s[key]);save();});
      return el('div','zx-setting',[row(el('b','',label),labelNode),input,note?small(note):null]);
    };
    const options=(label,key,values,note='')=>{
      fields.push(key);const group=el('div','zx-options');
      const fill=()=>group.replaceChildren(...values.map(([v,label])=>el('button','zx-option'+((s[key]??api.defaults[key])===v?' on':''),label,{type:'button',onclick:()=>{s[key]=v;save();fill();}})));fill();
      return el('div','zx-setting',[row(el('b','',label),group),note?small(note):null]);
    };
    const sublabels=settingsTab===1?['性能视野','震动闪光','特效强度','攻击拾取']:settingsTab===3?['显示设置','战斗提示','流程提示']:[];
    let title='',content=[];
    if(settingsTab===0) {
      title='声音与后台播放';content=[card(range('总音量','master',0,1,.01),range('音乐','music',0,1,.01),range('音效','sfx',0,1,.01)),card(toggle('切到后台时静音','muteHidden','后台不播放声音')),small('返回游戏后恢复声音，不影响设备本身的音量。')];
    }else if(settingsTab===1&&settingsSub===0) {
      title='画质与性能';content=[card(options('画质','quality',[['low','低'],['medium','中'],['high','高']]),toggle('省电模式','batterySaver','固定 30 帧，降低分辨率'),options('帧率上限','fpsLimit',[[30,'30'],[60,'60']])),card(options('显示的敌人','enemyView',[['all','全部'],['near','近处'],['close','很近']],'仅减少绘制，不移除敌人。'))];
    }else if(settingsTab===1&&settingsSub===1) {
      title='镜头与闪光反馈';content=[card(toggle('屏幕震动','shakeOn'),range('震动强度','screenShake',0,1,.05),toggle('减少闪光','reduceFlashes','减少全屏闪光与高亮特效'))];
    }else if(settingsTab===1&&settingsSub===2) {
      title='攻击特效强度';content=[card(range('特效不透明度','fxOpacity',.2,1,.05,percent,'仅影响特效，不影响危险预警。'),range('我的攻击不透明度','ownFxOpacity',.1,1,.05),range('特效亮度','fxGlow',.2,1,.05)),small('战斗预警不受透明度和隐藏攻击设置影响。')];
    }else if(settingsTab===1) {
      title='自身攻击与拾取';content=[card(toggle('隐藏我的攻击','hideOwnFx','仅隐藏特效，伤害正常生效。'),toggle('简化经验掉落','calmCandies','减少掉落表现，拾取规则不变。'),options('拾取特效','pickupFx',[['full','完整'],['simple','简单']])),small('战斗预警不受透明度和隐藏攻击设置影响。')];
    }else if(settingsTab===2) {
      title='触控与大招';content=[card(range('按钮大小','touchScale',.7,1.3,.05,percent,'调整摇杆、大招等操作按钮的大小。'),toggle('自动大招','autoUlt','就绪且附近有敌人时自动释放。'),small('固定俯视镜头 · 自动跟随字灵')),card(toggle('扩展操作按钮','zxExtraControls','需要手动跳跃、冲刺或切换瞄准时开启。'),small('拖动大招左侧的圆形摇杆控制方向，松手停止；也可在空白处滑动移动。'))];
    }else if(settingsSub===0) {
      title='界面外观';content=[card(options('主题','zxTheme',[['auto','自动'],['light','浅色'],['dark','深色']]),range('界面大小','hudScale',.6,1.3,.05),range('界面不透明度','hudOpacity',.3,1,.05)),card(range('首领血条不透明度','bossBarOpacity',.2,1,.05),options('首领体力','zxBossHealth',[['value','数值'],['percent','百分比']]))];
    }else if(settingsSub===1) {
      title='战斗信息提示';content=[card(toggle('伤害数字','damageNumbers'),toggle('浮动文字','floatText','保留治疗等即时反馈。'),toggle('大幅提示','showBanners'),toggle('道具与事件提示','showToasts')),small('危险范围提示等必要战斗信息始终保留。')];
    }else {
      title='对局流程提示';content=[card(toggle('显示本局道具','showItems','暂停页仍保留本局道具。'),toggle('仅一项升级时自动选择','skipEmptyLevelUp'),toggle('前几局玩法提示','tips')),small('危险范围提示等必要战斗信息始终保留。')];
    }
    screen('settings','设置','仅调整当前设备的体验',[
      tabs(['声音','画面','操作','界面'],settingsTab,i=>{settingsTab=i;settingsSub=0;renderSettings();},'main'),
      sublabels.length?el('div','zx-subtabs',sublabels.map((label,i)=>el('button','zx-subtab'+(settingsSub===i?' on':''),label,{onclick:()=>{settingsSub=i;renderSettings();}}))):null,
      row(small(title),button('恢复本页默认',()=>{for(const key of fields)s[key]=api.defaults[key]??({fpsLimit:60,batterySaver:false}[key]);save();renderSettings();},'zx-plain')),
      ...content,
    ],[small('调整即时生效'),button('返回',async()=>{await app.meta.saveNow();const back=returnTo;app.setScreen(null);back();})]);
  }
  function help(back=home) {
    const chart=el('canvas','zx-help-map',[],{width:680,height:470}),ctx=chart.getContext('2d');
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 62px "Ziling Swei", sans-serif';
    const symbols=['金','木','土','水','火'],colors=['#a58a2c','#28874e','#94703d','#3278ba','#bc3441'];
    const coords=symbols.map((_,i)=>[340+180*Math.sin(i*Math.PI*2/5),230-175*Math.cos(i*Math.PI*2/5)]);
    ctx.strokeStyle='#aaa3b7';ctx.lineWidth=2;ctx.beginPath();coords.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.stroke();
    coords.forEach(([x,y],i)=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,46,0,Math.PI*2);ctx.fill();ctx.fillStyle=colors[i];ctx.fillText(symbols[i],x,y);});
    ctx.fillStyle='#62586f';ctx.font='36px "Ziling Swei", sans-serif';ctx.fillText('字灵',340,230);chart.dataset.static='true';
    screen('help','一字入局','走位避险，把握大招时机',[
      chart,...[['移动与避险','拖动大招左侧的大圆摇杆控制方向，松手停止。也可在空白处滑动移动；镜头固定跟随，移动时可用另一根手指释放大招。'],['攻击与拾取','靠近掉落的经验、金币与道具就会自动吸附拾取，进入吸附范围后无需停留。宝箱等场景互动仍使用交互按钮。'],['把握大招','大招就绪后点击释放，也可在设置中开启自动大招。']].map(([title,desc],i)=>el('div','zx-help-row',[el('h3','',String(i+1).padStart(2,'0')+'  '+title),text(desc)])),
      button('署名与法律声明',()=>{const popup=overlay('署名与法律声明','素材与代码来源',[api.credits()],[button('返回',()=>popup.remove())]);},'zx-plain'),
    ],[button('返回',()=>{app.setScreen(null);back();})]);
  }
  function stats(run=null,back=choose,tab=0) {
    const c=run?character(run.startSpecies):current(),s=run?run.player.stats:api.baseStats(selected,app.meta.labStats());
    const item=(label,value,note,click)=>{const a=card(small(label),el('strong','',value),small(note));if(click){a.setAttribute('role','button');a.addEventListener('click',click);}return a;};
    const preview=()=>stats(run,back,tab);
    const body=[card(row(glyph(c),col(el('b','',c.word+' · '+(run?'Lv.'+run.player.level:'开局属性')),small(run?'桌上世界 · 已暂停':'基础 + 永久研究')))),
      ...(run?[tabs(['战斗属性','成长属性'],tab,i=>stats(run,back,i))]:[])];
    if(tab===0)body.push(el('div','zx-stat-grid',[
      row(item('全局伤害倍率',percent(s.damage),'查看加成来源',()=>damageSources(run,preview)),item('最大生命',number(s.maxHp),run?'当前生命 '+Math.ceil(run.player.hp)+' / '+Math.round(run.player.maxHp):'角色基础生命')),
      row(item('攻击速度',percent(s.attackSpeed),'含永久研究加成'),item('移动速度',percent(s.moveSpeed),'含永久研究加成')),
    ]),card(statRow('暴击率',percent(s.critChance)),statRow('攻击范围',percent(s.area)),statRow('护甲',Number(s.armor.toFixed(1))),statRow('生命回复',Number(s.regen.toFixed(2))+' / 秒')));
    else body.push(card(statRow('经验获取',percent(s.xpGain)),statRow('金币获取',percent(s.gold)),statRow('幸运',number(s.luck)),statRow('拾取范围',Number(s.pickupRange.toFixed(1))+' 米')),small('金币获取影响局内金币，与研究所星尘收益独立。'));
    body.push(small(run?'查看时保持暂停，返回不改变本局强化。':'研究加成用于下一次新对局。'));
    screen('stats',run?'当前属性':'文字属性',run?'查看时保持暂停 · 本局属性':'开局预览 · 不包含局内临时强化',body,[button('返回',()=>{app.setScreen(null);back();})],'blue');
  }
  function damageSources(run,back) {
    const total=run?run.player.stats.damage:api.baseStats(selected,app.meta.labStats()).damage;
    const base=run?api.baseStats(run.player.speciesId,{},run.player.evoStage+run.player.growth).damage:1;
    const research=app.meta.labStats().damage||0;
    screen('damage','伤害加成来源','当前属性 / 全局伤害倍率',[
      el('div','zx-hero',[el('h1','',percent(total)),small('当前全局伤害倍率')]),
      card(statRow('文字基础与成长',percent(base)),statRow('研究所 · 伤害',percent(research)),statRow('本局招式、道具与临时加成',run?'已计入当前倍率':'未计入')),
      el('div','zx-banner','基础与研究加成先合并，再由现有战斗规则计算道具、被动与临时效果。'),
      small('倍率不等于最终伤害，还受招式、暴击、敌方防御与属性关系影响。'),
    ],[button('返回',back)],'blue');
  }
  function pause(run) {
    overlay('片刻休整','单人对局 · 已暂停',[
      el('div','zx-row zx-pause-profile',[glyph(character(run.startSpecies)),col(el('b','',character(run.startSpecies).word+' · Lv.'+run.player.level),small('桌上世界 / '+['普通','困难','噩梦'][run.tier]))]),
      el('div','zx-build-tags',buildLabels(run).map(label=>el('span','zx-build-tag',label))),
      el('div','zx-pause-stats',[[time(run.time),'已用时间'],[number(run.stats.kills),'击败'],[number(run.gold),'本局金币']].map(([v,k])=>col(el('b','',v),small(k)))),
      button([el('span','zx-pause-attribute-title',[icon('stats',16,'#2e6ddb'),el('span','','查看属性')]),el('span','zx-pause-attribute-note','当前数值 · 加成来源 ›')],()=>stats(run,()=>pause(run)),'zx-link zx-pause-attributes'),
      el('div','zx-row zx-pause-actions',[
        button([icon('settings',18,'#61577b'),el('span','','设置')],()=>settings(()=>pause(run)),'zx-pause-action'),
        button([icon('book',18,'#61577b'),el('span','','玩法说明')],()=>help(()=>pause(run)),'zx-pause-action')
      ]),
    ],[button('结束本局',()=>confirmEnd(run),'danger'),button('返回',()=>run.resume())],run.ui,'zx-pause');
  }
  function confirmEnd(run) {
    overlay('结束这次旅程？','确认结束',[
      small('本局金币和临时强化将结束，未完成的关卡不会解锁下一难度。'),statRow('当前旅程',character(run.startSpecies).word+' · 桌上世界'),small(time(run.time)+' · Lv.'+run.player.level),
    ],[button('确认结束本局',async()=>{run.endHow='quit';await run.finish(false);},'danger'),button('返回',()=>pause(run))],run.ui);
  }
  function buildLabels(run) {
    return [...run.player.moves.filter(Boolean).map(move=>api.moveName(move.def)+' Lv.'+move.level),
      ...[...run.player.vitamins].map(([id,value])=>api.vitaminName(id)+' ×'+value.level),
      ...[...run.player.items].map(([id,count])=>api.itemName(id)+' ×'+count)];
  }
  function build(run) {
    return card(small('本局构筑'),...buildLabels(run).map(label=>text(label,'zx-note')));
  }
  function loadout(run) {
    const p=run.player;
    const image=(src,name)=>el('img','zx-loadout-icon',[],{src,alt:name,draggable:false});
    const slots=Array.from({length:Math.max(4,p.moveSlots)},(_,index)=>{
      const move=p.moves[index],locked=index>=p.moveSlots;
      const node=el('div','zx-skill-slot'+(locked?' locked':move?' filled':' empty'),locked?[icon('lock',17)]:move?[
        image(api.moveIcon(move.def),api.moveName(move.def)),el('b','zx-slot-level',String(move.level)),
      ]:[],{'data-skill-slot':index,'data-level':move?.level||0,'aria-label':locked?'技能槽未解锁':move?api.moveName(move.def)+' 等级 '+move.level:'空技能槽'});
      if(move&&!locked)node.style.background='linear-gradient(180deg,#effbff,'+api.moveColor(move.def)+')';
      return node;
    });
    const vitamins=[...p.vitamins],vits=el('div','zx-vitamin-slots',Array.from({length:vitamins.length},(_,index)=>{
      const entry=vitamins[index];return el('div','zx-mini-slot'+(entry?' filled':''),entry?[image(api.vitaminIcon(entry[0]),api.vitaminName(entry[0])),el('b','zx-slot-count',String(entry[1].level))]:[],{'data-vitamin':entry?.[0]||'',title:entry?api.vitaminName(entry[0]):'空强化槽'});
    }));
    const narrow=innerWidth<=350,available=innerWidth-(narrow?70:78)-(profile().settings.zxExtraControls?136:18);
    const capacity=Math.max(2,Math.min(12,Math.floor((available+4)/((narrow?24:28)+4))));
    const ownedItems=[...p.items],visible=ownedItems.length>capacity?capacity-1:capacity;
    const items=el('div','zx-inventory-items',ownedItems.slice(0,visible).map(([id,count])=>el('div','zx-mini-slot filled',[
      image(api.itemIcon(id),api.itemName(id)),el('b','zx-slot-count','×'+count),
    ],{'data-item':id,'data-count':count,title:api.itemName(id)+' ×'+count})));
    if(ownedItems.length>visible)items.append(button('+'+(ownedItems.length-visible),()=>run.pause(),'zx-mini-slot zx-loadout-more',{'aria-label':'查看全部道具','data-action':'inventory-more'}));
    const inventory=el('div','zx-inventory',[small('道具'),items]);
    inventory.hidden=!profile().settings.showItems||!p.items.size;
    return [el('div','zx-skill-slots',slots),el('div','zx-hud-supplies',[vits,inventory])];
  }
  function offerContent(symbol,title,notes) {
    return row(glyph(symbol),col(el('b','',title),...notes));
  }
  function offerBody(cards,onStats) {
    return [button([el('span','','查看当前属性'),icon('stats',15,'#65577b'),el('span','','›')],onStats,'zx-upgrade-stats',{'data-action':'upgrade-stats'}),...cards];
  }
  function levelUp(run,offers,chooseOffer) {
    const cards=offers.map((offer,index)=>{const desc=api.offer(run,offer);return button(offerContent(index===0?current():'升',desc.title,[small(desc.sub),...desc.lines.map(small)]),()=>chooseOffer(offer),'zx-offer',{'data-offer':index});});
    overlay('择一而进','',offerBody(cards,()=>stats(run,()=>levelUp(run,offers,chooseOffer))),
      [button([icon('refresh',17,'#65577b'),el('span','','重抽 · 剩余 '+run.rerolls+' 次')],()=>chooseOffer(null,'reroll'),'zx-reroll',{disabled:run.rerolls<=0})],run.ui,'zx-upgrade');
  }
  function restyleChoice(run,method,args,symbol) {
    const hud=run.ui,wrap=hud.modalEl,cards=[...wrap.querySelectorAll('.cards > .card')];
    if(!cards.length)return;
    const title=wrap.querySelector('h1')?.textContent||'择一而进';
    const help=[...wrap.children].filter(node=>node.classList.contains('help')).map(node=>text(node.textContent,'zx-note zx-choice-help'));
    cards.forEach((node,index)=>{
      const body=node.querySelector('.bd'),heading=body.querySelector('h3'),tag=node.querySelector('.rar,.kind');
      const notes=tag?[small(tag.textContent)]:[];
      for(const detail of body.children){
        if(detail===heading||/^\[\d+\]$/.test(detail.textContent.trim()))continue;
        const value=detail.classList.contains('pact-line')?[...detail.children].map(part=>part.textContent).join('：'):detail.textContent;
        if(value.trim())notes.push(small(value));
      }
      // Keep the original buttons: their reward callbacks and unavailable-choice
      // guards also serve the original keyboard shortcuts.
      const opacity=node.style.opacity,locked=node.classList.contains('locked');
      node.removeAttribute('style');node.style.cssText='';
      node.className='zx-button zx-offer';
      if(opacity)node.style.opacity=opacity;
      else if(locked)node.style.opacity='.45';
      node.dataset.offer=String(index);
      node.replaceChildren(offerContent(symbol,heading.textContent,notes));
    });
    const actions=[...wrap.querySelectorAll('.actions > button')];
    actions.forEach(node=>{node.className='zx-button zx-reroll';node.querySelectorAll('kbd').forEach(key=>key.remove());});
    const back=()=>{hud.hideModal();stats(run,()=>hud[method](...args));};
    document.querySelectorAll('.run-hint').forEach(node=>node.remove());
    wrap.className='zx zx-modal-wrap';
    wrap.replaceChildren(el('section','zx zx-modal zx-upgrade zx-choice-dialog',[
      el('h2','',title),...help,...offerBody(cards,back),...actions,
    ],{'data-choice':method}));
  }
  function restyleItems(run,keys,choice=false) {
    const wrap=run.ui.modalEl;
    const cards=choice?[...wrap.querySelectorAll('.cards > .card')]:[...wrap.children].filter(node=>node.classList.contains('card'));
    if(!cards.length)return;
    const title=wrap.querySelector('h1')?.textContent||'发现一件道具';
    const notes=[...wrap.children].filter(node=>node.classList.contains('help')).map(node=>text(node.textContent,'zx-item-note'));
    cards.forEach((node,index)=>{
      const body=node.querySelector('.bd'),heading=body.querySelector('h3'),rarity=node.querySelector('.rar');
      const details=[...body.children].filter(detail=>detail!==heading&&!detail.classList.contains('key')&&detail.textContent.trim()).map(detail=>
        text(detail.textContent,detail.classList.contains('muted')||detail.classList.contains('cap')?'zx-item-description':'zx-item-effect'));
      const picture=el('img','zx-item-image',[],{src:api.itemIcon(keys[index]),alt:heading.textContent,draggable:false});
      // Reuse the choice nodes and original action buttons to retain their
      // reward callbacks, keyboard bindings and protection against double taps.
      node.removeAttribute('style');node.style.cssText='';node.className='zx-item-card'+(choice?' zx-item-option':'');
      node.dataset.itemChoice=keys[index];
      node.replaceChildren(el('div','zx-item-hero',[el('span','zx-item-rarity',rarity?.textContent||'道具'),picture]),
        el('div','zx-item-copy',[el('h3','',heading.textContent),...details]));
    });
    const actions=[...wrap.querySelectorAll('.actions > button')];
    actions.forEach((node,index)=>{
      node.querySelectorAll('kbd').forEach(key=>key.remove());
      const label=node.textContent.trim().replace(/₽/g,'金币').replace(/^无\s*[（(]/,'放弃拾取（');
      node.replaceChildren(label);node.className='zx-button'+(!choice&&index===0?' primary':' zx-item-sell');
      node.dataset.itemAction=!choice&&index===0?'take':'sell';
    });
    document.querySelectorAll('.run-hint').forEach(node=>node.remove());
    wrap.className='zx zx-modal-wrap';
    wrap.replaceChildren(el('section','zx zx-modal zx-item-dialog',[
      el('h2','',title),el('div','zx-item-body',choice?[...notes,...cards]:[...cards,...notes]),el('footer','zx-item-actions',actions),
    ],{'data-choice':choice?'showItemChoice':'showItem'}));
  }
  function summary(run,result,reward,error) {
    const win=result.victory,amount=reward?.stardust,leave=()=>{app.setScreen(null);app.toMenu();};
    run.ui.hideModal();
    screen('summary','','',[
      el('div','zx-hero',[small('桌上世界 · '+['普通','困难','噩梦'][result.tier]),el('div',win?'zx-banner':'zx-card',win?'破境':'未竟'),el('h2','',win?'这一程，已写成':'落字未成，再来一程'),small(win?'圣地镇守已被击败':'止步于区域 '+result.stage),row(glyph(character(result.species)),small(character(result.species).word+' · Lv.'+result.level))]),
      el('div','zx-summary-grid',[[time(result.time),win?'通关时间':'生存时间'],[number(result.kills),'击败敌人'],[Math.min(3,result.bosses||0)+' / 3','区域镇守']].map(([v,k])=>col(el('b','',v),small(k)))),
      card(el('b','',win?'新的挑战已开放':'避其锋芒'),small(win?(app.meta.biomeTier('forest')>result.tier?'桌上世界下一难度已开放。':'已完成当前桌面挑战。'):'调整走位与强化，寻找更好的出手机会。')),
      button(row(col(el('b','',amount!==undefined?'星尘 +'+number(amount):'结算尚未保存'),small('当前 '+number(profile().stardust))),el('span','','去研究所 ›')),()=>{leave();lab();},'zx-banner'),
      error?small(error):null,build(run),
    ],[row(button(win?'再来一局':'再试一次',()=>app.startRun(app.lastCfg),'primary'),button('调整文字与关卡',()=>{leave();choose();})),button('返回',leave)]);
  }
  function attachRun(run) {
    const hud=run.ui;selected=character(run.startSpecies).id;
    api.glyphs(run);run.input.fixedCamera=true;run.input.mouseDX=run.input.mouseDY=run.input.wheel=0;
    const hint=run.hints.show.bind(run.hints);
    run.hints.show=key=>{if(run.state==='play'&&!app.screen&&!hud.hasModal())hint(key);};
    hud.showPause=pause;hud.showLevelUp=levelUp;hud.showSummary=summary;hud.showSlots=slots;
    for(const method of ['showItem','showItemChoice']){
      const render=hud[method].bind(hud);
      hud[method]=(r,items,...args)=>{const result=render(r,items,...args);restyleItems(r,method==='showItem'?[items]:items,method==='showItemChoice');return result;};
    }
    for(const [method,symbol] of Object.entries({showBlessing:'祝',showTrade:'易',showPact:'契',showBranch:'变',showFusion:'合',showDitto:'复',showParty:'伴',showShinySwap:'伴'})){
      const render=hud[method].bind(hud);
      hud[method]=(...args)=>{const result=render(...args);restyleChoice(run,method,args,symbol);return result;};
    }
    hud.stageIntro=r=>intro(paperStages[Math.min(3,r.stage-1)],'小小字灵，漫游桌上世界。');
    hud.showEvolution=()=>intro('字意更进一步','进阶中 · 保留当前招式与强化');
    const evolve=run.startEvolution.bind(run);
    run.startEvolution=()=>{
      run.state='modal';
      overlay('字意更进一步','文字进阶',[
        el('div','zx-hero',[glyph(character(run.startSpecies),true),el('b','',character(run.startSpecies).word+' · 进阶')]),
        small('保留当前招式与已有强化。'),card(statRow('基础成长','提升伤害与生命'),statRow('进阶次数',String(run.player.evoStage+1))),
      ],[button('确认进阶  →',()=>{hud.hideModal();run.state='play';evolve();},'primary')],hud);
    };
    const node=el('div','zx zx-hud');node.dataset.hud='true';
    // Separate Latin prefix glyphs: the bundled Swei font has overly tight LV.
    // kerning, which otherwise merges the reference label into a single mark.
    const hp=el('span','zx-hud-hp',''),levelValue=el('span','','');
    const level=el('b','zx-hud-level',[...['L','V','.'].map(ch=>el('span','',ch)),levelValue]),fill=el('div','zx-hud-fill');
    const area=el('b','zx-hud-area',''),clock=el('b','zx-hud-clock',''),gold=el('b','zx-hud-gold',''),inventory=el('div','zx-loadout');
    const stageLabel=el('small','zx-hud-stage',''),score=el('span','zx-hud-score',''),c=character(run.startSpecies);
    node.classList.add('zx-hud-'+c.tone);
    const portrait=el('canvas','zx-profile-art',[],{width:160,height:168,'aria-label':c.name}),xp=el('div','zx-hud-xp');
    const xpTrack=el('div','zx-hud-xp-track',xp,{role:'progressbar','aria-label':'升级经验','aria-valuemin':0,'aria-valuemax':100});
    portrait.dataset.static='true';
    const refreshPortrait=()=>drawBattlePortrait(portrait,glyphWordForSpecies(run.player.speciesId??run.startSpecies),c.tone);
    refreshPortrait();glyphAtlasReady().then(refreshPortrait).catch(()=>{});
    const minimap=hud.minimap;minimap.classList.add('zx-minimap');minimap.width=minimap.height=240;minimap.dataset.static='true';
    minimap.setAttribute('aria-label','附近地图，点击查看完整地图');
    node.append(el('div','zx-hud-top',[
      el('div','zx-hud-location',[icon('pin',14,'#5277a4'),area]),
      el('div','zx-hud-counters',[
        el('div','zx-hud-counter',[icon('clock',14,'#637ca3'),clock],{'aria-label':'关卡时间'}),
        el('div','zx-hud-counter',[icon('coin',15,'#b68a37'),gold],{'aria-label':'本局金币'}),
      ]),
      el('div','zx-hud-profile',[
        el('div','zx-hud-card-back'),el('div','zx-hud-card'),portrait,
        el('div','zx-hud-identity',[
          el('div','zx-hud-name-row',[el('b','zx-hud-name',c.name),el('span','zx-hud-element',c.word)]),
          row(el('span','zx-hud-hp-label','生命'),hp),el('div','zx-hud-track',fill),xpTrack,
        ]),level,
      ]),minimap,
    ]),el('div','zx-hud-meta',[icon('score',18,'#637fae'),score,stageLabel]),button(icon('pause',22,'#6176a3'),()=>run.pause(),'zx-hud-pause',{'aria-label':'暂停'}),inventory);
    // Touch controls live beside #hud. Place the new bar above their gesture
    // surface so the pause button receives an actual native pointer event.
    hud.root.append(node);
    const look=hud.look.bind(hud);
    hud.touch.swipeMove=true;hud.touch.centeredStick=true;hud.touch.el.classList.add('zx-touch');
    hud.touch.el.setAttribute('aria-label','拖动摇杆或滑动空白处移动，松手停止');
    hud.touch.stick.setAttribute('aria-label','移动摇杆');
    hud.look=s=>{
      look(s);hud.touch.fixed=true;
      hud.touch.el.classList.toggle('zx-extra-controls',!!s.zxExtraControls);
      node.classList.toggle('zx-extra-controls',!!s.zxExtraControls);minimap.hidden=s.showMinimap===false;
      node.style.opacity=String(s.hudOpacity??1);node.style.fontSize=(13*(s.hudScale??1))+'px';
    };
    hud.look(profile().settings);
    const touchUpdate=hud.touch.update.bind(hud.touch);let lastInteraction='';
    hud.touch.update=(r,prompt)=>{
      touchUpdate(r,prompt);
      const raw=hud.touch.actText,target=r.interactables.nearest,key=raw+'|'+(target?.kind||'');
      if(!raw){lastInteraction='';return;}
      if(key===lastInteraction)return;lastInteraction=key;
      let title=raw.replace(/₽/g,'金币'),detail='',poor=false;
      const itemTarget=['chest','freechest','cursedchest'].includes(target?.kind);
      hud.touch.act.classList.toggle('zx-item-act',itemTarget);
      if(itemTarget){
        const free=target.kind!=='chest'||target.data?.gift,cost=r.interactables.chestCost();
        poor=!free&&r.gold<cost;
        title=poor?'金币不足':target.kind==='cursedchest'?'开启咒箱':'开启宝箱';
        detail=free?(target.kind==='cursedchest'?'附带诅咒':'免费'):number(cost)+' 金币';
      }
      if(itemTarget)hud.touch.act.firstChild.replaceChildren(icon('interact',18,'#76684e'));
      hud.touch.act.lastChild.replaceChildren(el('b','zx-act-title',title),...(detail?[el('small','zx-act-detail',detail)]:[]));
      hud.touch.act.classList.toggle('zx-act-poor',poor);hud.touch.act.setAttribute('aria-label',raw.replace(/₽/g,'金币'));
    };
    for(const element of hud.hudEl.querySelectorAll('.hud-tl,.under,.hud-party,.hud-top,.hud-tr,.hud-bl,.hud-br,.lock-hint'))element.dataset.uiHidden='true';
    hud.fitTop=()=>{};
    let mapAt=-Infinity,mapFrame=0;
    hud.drawMinimap=r=>{
      const now=performance.now();if(minimap.hidden||now-mapAt<120)return;
      mapAt=now;drawBattleMinimap(minimap,r);minimap.dataset.frame=String(++mapFrame);
    };
    for(const [selector,name,title] of [['.tc-jump','jump','跳跃'],['.tc-dash','dash','冲刺'],['.tc-lock','target','锁定目标']]){
      const control=hud.touch.el.querySelector(selector);
      control.replaceChildren(icon(name,26));control.setAttribute('aria-label',title);
    }
    hud.touch.aim.querySelector('img')?.remove();
    const originalUlt=hud.ultHud.bind(hud);
    hud.ultHud=r=>{
      originalUlt(r);
      const core=hud.touch.ult.children[1];
      if(!core.querySelector('.zx-ult-label'))core.replaceChildren(el('div','zx-ult-label',[el('span','','✧'),el('span','','大招'),el('small','','蓄能')]));
      const label=core.querySelector('small'),value=r.ult.ready?'就绪':percent(r.ult.charge);
      if(label.textContent!==value)label.textContent=value;
    };
    const original=hud.hud.bind(hud);
    const updateText=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
    let last=-Infinity,lastState='',lastLoadout='',lastExperience=-1;
    hud.hud=function(...args){
      const now=performance.now();
      if(lastState===run.state&&(now-last<80||run.state==='paused'||run.state==='modal'||run.state==='over'))return;
      last=now;lastState=run.state;
      original(...args);
      if(profile().settings.zxBossHealth==='percent'&&run.boss.alive){const index=run.boss.bossIndex;hud.els.bossBar.children[4].textContent=percent(Math.max(0,run.enemies.hp[index]/run.enemies.maxHp[index]));}
      const p=run.player;updateText(levelValue,String(p.level));updateText(hp,Math.ceil(p.hp)+'/'+Math.round(p.maxHp));
      updateText(area,paperStages[Math.min(3,run.stage-1)]+' · '+(run.sanctuary?'圣地':run.stage+'区'));updateText(stageLabel,['普通','困难','噩梦'][run.tier]);
      updateText(score,'积分 '+number(run.stats.kills));updateText(clock,time(run.time));updateText(gold,number(run.gold));
      const evolved=glyphWordForSpecies(p.speciesId??run.startSpecies);if(portrait.dataset.word!==evolved)refreshPortrait();
      const loadoutKey=JSON.stringify([p.moves.map(m=>m&&[m.def.key,m.level]),p.moveSlots,[...p.vitamins].map(([id,v])=>[id,v.level]),p.vitaminSlots,[...p.items],profile().settings.showItems,profile().settings.zxExtraControls,innerWidth]);
      if(loadoutKey!==lastLoadout){lastLoadout=loadoutKey;inventory.replaceChildren(...loadout(run));}
      const health=percent(Math.max(0,Math.min(1,p.hp/p.maxHp))),exp=Math.round(Math.max(0,Math.min(1,p.xp/Math.max(1,p.xpNext)))*1000)/1000;
      if(fill.style.width!==health)fill.style.width=health;
      if(exp!==lastExperience){lastExperience=exp;xp.style.width=percent(exp);xpTrack.dataset.progress=String(exp);xpTrack.setAttribute('aria-valuenow',Math.round(exp*100));}
    };
  }
  function intro(title,subtitle) {
    if(profile()?.settings.showBanners===false)return;
    const node=el('div','zx zx-intro',[el('b','',title),small(subtitle)]);app.ui.append(node);setTimeout(()=>node.remove(),1800);
  }
  async function loading(total,loaded,onProgress) {
    // Entry owns its loading screen until the first scene frame is ready.
    // Later area changes use the same plain progress view, with no hero popup.
    const view=onProgress?null:loadingScreen('stage-loading');
    const began=performance.now();
    try {
      for(;;){
        const n=loaded(),ratio=total?Math.min(1,n/total):1;
        const state={phase:'准备字灵',detail:'文字就绪 '+n+' / '+total,progress:onProgress ? .8+.14*ratio:ratio};
        if(onProgress)onProgress(state);else {view.update(state);view.elapsed.textContent='已等待 '+Math.floor((performance.now()-began)/1000)+' 秒';}
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
    overlay(result?(result.prize==='none'?'字运未至':'好运入字'):'老虎机',result?'结果已生效':'场景设施 · 已暂停',[
      small('◎ 本局金币 '+number(run.gold)),el('div','zx-slot',(result?.reels||['pikachu','meowth','berry']).map(s=>el('b','',symbols[s]))),
      text('字 运 当 头','zx-note'),el('b','',result?prizes[result.prize]:'本次投入 '+machine.cost()+' 金币'),
      small('每次消耗以按钮显示为准，金币仅限本局使用。'),
    ],[mustResume?button('继续旅程  →',resume,'primary'):button((result?'继续 · ':'')+'投入 '+machine.cost()+' 金币  →',spin,'primary',{disabled:run.gold<machine.cost()}),button('返回',resume)],run.ui);
  }
  return ui;
}
