// DEV ONLY: injected by tools/developer/build-support.mjs, never imported by
// source/. No settings, debug actions or test rewards enter the release save.
import {createWorkload,workloadPreset} from './workload.mjs';
import {createEncounterTest,encounterAt,nextEncounter} from './encounters.mjs';
import {ordinaryLimit} from '../../source/src/spawn-budget.js';
import heroRigs from '../../source/src/hero-rigs.json' with {type:'json'};
const SPECIAL=2|4|128|2048|4096|8192|16384|32768|65536|131072;
const MAX_COUNT=1000;
const ordinary=(enemies,i)=>enemies.alive[i]&&!(enemies.flags[i]&SPECIAL);
const bounded=(value,max)=>Math.max(0,Math.min(max,Number.isFinite(Number(value))?Number(value):0));
const time=seconds=>Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0');

export function seekWave(run,seconds){
  if(run.stage>3||run.sanctuary||run.endless||run.tower)throw Error('时间跳转仅用于普通三区。');
  seconds=bounded(seconds,600);
  const old=run.stageTime,Director=run.director.constructor;
  // Rebuild card draws at their authored times. Encounter restoration happens
  // separately after equipping the test build, without replaying past waves.
  run.stageTime=0;
  const director=new Director(run);
  for(const event of director.timeline){
    if(event.t>seconds)continue;
    run.stageTime=event.t;
    if(event.kind==='card')director.addCard();
    event.done=true;
  }
  run.stageTime=seconds;run.time=Math.max(0,run.time+seconds-old);
  run.nextCp=run.time+30;
  run.director=director;
  if(seconds>=600)director.startFinalSwarm();
  return director;
}

export function ordinaryCount(run){
  let count=0;for(let i=0;i<run.enemies.n;i++)if(ordinary(run.enemies,i))count++;
  return count;
}
export function setEnemyCount(run,count,reset=false){
  count=Math.round(bounded(count,MAX_COUNT));
  const enemies=run.enemies;
  let current=ordinaryCount(run);
  // kill() only releases a slot. It does not grant XP, gold or kill credit.
  for(let i=enemies.n-1;i>=0;i--)if(ordinary(enemies,i)&&(reset||current>count)){enemies.kill(i);current--;}
  const cards=run.director.cards;
  if(!cards.length&&count>current)throw Error('当前区域没有可用怪物。');
  let attempts=0;
  while(current<count&&attempts<count*16+32){
    const index=attempts++,angle=index*2.3999632297,distance=5+Math.sqrt((index%233)/232)*15;
    const x=run.player.pos.x+Math.cos(angle)*distance,z=run.player.pos.z+Math.sin(angle)*distance;
    if(!run.terrain.inBounds(x,z,2)||run.terrain.hitProp(x,.6,z,.55))continue;
    let id;
    run.developerSpawning=true;
    try{id=enemies.spawn(cards[index%cards.length].id,x,z,run.director.hpMult(),run.director.dmgMult());}
    finally{run.developerSpawning=false;}
    if(id<0)break;
    current++;
  }
  enemies.grid.build(enemies.n,enemies.x,enemies.z,enemies.alive,enemies.radius,enemies.dying);
  return current;
}

export function installDeveloperMode(app,{skills,speciesName}){
  const options={invincible:false,lockCount:false,monitor:false,spawn:true,hideScenery:true};
  let selectedMode='timed',workload=null;
  let bossMode='timed',encounters=null;
  const bossModes={timed:'按时间首领',guardian:'区域 Boss',none:'无首领'};
  const bossNames={alpha:'精英首领',totem:'支配首领',summoner:'召唤首领',guardian:'区域 Boss'};
  try{const saved=window.localStorage.getItem('developer.workload');if(['none','timed','stress'].includes(saved))selectedMode=saved;}catch{}
  const modeNames={none:'只调怪物',timed:'按时间实战',stress:'满负载压测'};
  let run=null,button=null,monitor=null,monitorLayer=null,panel=null,target=30,seconds=120;
  let strokePreview=null;
  let frames=0,since=performance.now(),fps=0,frameMs=0,calls=0,triangles=0,lastSample=0,lastMaintain=0;
  let values=null,error=null;
  let mountEntrance=()=>{};
  const invalidate=()=>window.developerInvalidateUI?.();
  function syncScenery(){
    if(run?.terrain?.zxPaper)run.terrain.group.visible=!options.hideScenery;
  }
  const wiredDirectors=new WeakSet();
  const doc=window.document;
  const node=(tag,text,style='')=>{const el=doc.createElement(tag);if(text)el.textContent=text;el.style.cssText=style;return el;};
  const text=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};
  const action=(label,fn,id)=>{
    const el=node('button',label,'min-height:36px;padding:6px 9px;border:1px solid #c4c9c2;border-radius:9px;background:#fffdf7;color:#36443e;font-size:12px;font-weight:700;pointer-events:auto;');
    el.type='button';if(id)el.dataset.devAction=id;
    el.addEventListener('click',async event=>{event.stopPropagation();try{await fn();}catch(e){text(error,e.message||String(e));console.error('Developer action:',e);}});
    return el;
  };
  const row=(...children)=>{const el=node('div','','display:flex;flex-direction:row;align-items:center;gap:6px;flex-wrap:wrap;');el.append(...children);return el;};
  // Visible identity is deliberately confined to this separately built module.
  const markHome=()=>{
    const home=app.screen;if(!home?.classList.contains('zx-home'))return;
    const label=home.querySelector('.zx-home-top small');
    if(label){text(label,'开发测试版 DEV 8');label.id='zx-dev-version';label.style.cssText='padding:5px 8px;border-radius:8px;background:#ffe0ad;color:#855329;font-weight:700;';}
    text(home.querySelector('.zx-home-foot small'),'分钟 / 怪数 / 全战斗压测');
  };
  const setScreen=app.setScreen.bind(app);
  app.setScreen=(...args)=>{const result=setScreen(...args);Promise.resolve().then(markHome);return result;};
  markHome();let showOnEntry=true;
  function snapshot(){
    if(!run)return null;
    let visible=0,normal=0;
    const e=run.enemies;
    for(let i=0;i<e.n;i++)if(e.alive[i]){
      if(ordinary(e,i))normal++;
      const dt=e.lodDt[i],x=e.x[i]+(dt>0?(e.vx[i]+e.kx[i])*dt:0),z=e.z[i]+(dt>0?(e.vz[i]+e.kz[i])*dt:0);
      if(!(e.flags[i]&32768)&&run.sprites.visible(x,e.y[i]+e.hgt[i]*.5,z,2+Math.max(e.hgt[i],e.radius[i]*2.4)))visible++;
    }
    let projectiles=0;for(let i=0;i<run.projectiles.n;i++)if(run.projectiles.alive[i])projectiles++;
    return {stage:run.stage,stageTime:run.stageTime,total:e.count,ordinary:normal,visible,
      device:window.nativeDevice,simMs:app.perf.sim,submitMs:app.perf.draw,
      fps,frameMs,calls,triangles,particles:run.vfx.add.n+run.vfx.norm.n,pickups:run.pickups.count,
      projectiles,zones:run.zones.list.length,texts:run.vfx.text.items.length,workload:workload?.snapshot(),encounter:encounters?.snapshot(),
      textures:app.r.renderer.info.memory.textures,geometries:app.r.renderer.info.memory.geometries,
      hpMultiplier:run.director.hpMult(),cards:run.director.cards.map(card=>card.id)};
  }
  function summary(){
    const s=snapshot();if(!s)return '';
    const device=s.device||{},mode=device.platform==='ios'?(device.highPerformancePlus===true?'高性能+':device.highPerformance===true?'高性能':device.highPerformance===false?'普通模式':'模式未确认'):device.platform||'未知平台';
    return `区域 ${s.stage} · ${time(s.stageTime)}   FPS ${s.fps.toFixed(1)}\n${device.model||device.platform||'设备未知'} · ${mode}\n逻辑 ${s.simMs.toFixed(1)} ms · 绘制提交 ${s.submitMs.toFixed(1)} ms\n普通怪 ${s.ordinary} / 总数 ${s.total} / 入镜 ${s.visible}\n3D 绘制 ${s.calls} 次 · 三角形 ${s.triangles}\n粒子 ${s.particles} · 掉落 ${s.pickups} · 飘字 ${s.texts}\n弹道 ${s.projectiles} · 范围 ${s.zones} · ${modeNames[s.workload?.mode]||modeNames.none}\n首领 ${s.encounter?.count||0} · ${s.encounter?.current?.alive?s.encounter.current.name:'未在场'}`;
  }
  function writeSummary(element){
    const lines=summary().split('\n');
    // Native text painting collapses embedded newlines. Give each statistic
    // its own row so the iOS mode and timings remain readable on a phone.
    if(element.children.length!==lines.length)element.replaceChildren(...lines.map(line=>node('div',line,'width:100%;')));
    else lines.forEach((line,index)=>text(element.children[index],line));
  }
  function refresh(){
    if(values){
      text(values.seconds,'本区时间 '+time(seconds));text(values.count,'普通怪目标 '+target);
      const preset=workloadPreset(seconds,selectedMode);
      text(values.preset,preset?`时间预设 ${preset.level} 级 · 技能最高 ${preset.rank} 级 · 掉落目标 ${preset.loot}`:'保留当前角色等级、技能和装备');
      text(values.skills,preset?'当前形态预设：'+workload.plan(selectedMode,seconds).map(m=>m.name).join('、'):'技能和升级按正式流程进行');
      const evo=run.nextEvo;
      const current='当前 '+speciesName(run.player.speciesId)+' Lv.'+run.player.level;
      text(values.evolution,evo?current+' · 下次进化 Lv.'+evo.level+(evo.to===-1?' · 自选方向':' → '+speciesName(evo.to)):current+' · 无后续进化');
      values.evolve.disabled=!evo;
      for(const [key,button] of values.modes){button.setAttribute('aria-pressed',String(key===selectedMode));button.style.background=key===selectedMode?'#f7d5a4':'#fffdf7';}
      for(const [key,button] of values.bossModes){button.setAttribute('aria-pressed',String(key===bossMode));button.style.background=key===bossMode?'#e2d5f5':'#fffdf7';}
      const encounter=encounterAt(run.director.timeline,seconds,bossMode),next=nextEncounter(run.director.timeline,seconds);
      text(values.boss,encounter?'将刷新：'+bossNames[encounter.kind]+(encounter.kind==='guardian'?' · 当前区域':' · '+time(encounter.t)+' 波次'):
        bossMode==='none'?'不生成首领':next?'尚未到首领时间 · 下一波 '+time(next.t):'当前没有对应首领');
      for(const update of values.toggles)update();
    }
    if(monitor){monitor.hidden=!options.monitor||run?.state!=='play'||!!app.screen;if(options.monitor)writeSummary(monitor);}
  }
  function wireDirector(){
    const director=run.director;if(wiredDirectors.has(director))return;wiredDirectors.add(director);
    const update=director.update.bind(director);
    director.update=dt=>{if(options.spawn&&!options.lockCount)update(dt);};
  }
  function close(){
    if(!panel)return;panel.remove();panel=null;values=null;error=null;
    if(run&&!run.disposed&&run.state==='paused')run.resume();
    refresh();invalidate();
  }
  function advanceEvolution(){
    if(!run||run.disposed||!['play','paused'].includes(run.state))return false;
    if(!workload.advanceEvolution())return false;
    selectedMode=workload.snapshot().mode;
    close();workload.update(0);refresh();invalidate();return true;
  }
  function apply(jump){
    if(!run||run.disposed||!['play','paused'].includes(run.state))throw Error('请先进入可操作的战斗。');
    if(jump){
      seekWave(run,seconds);wireDirector();workload.apply(selectedMode,seconds);encounters.apply(bossMode);
      if(selectedMode!=='none'){options.invincible=true;options.monitor=true;}
      if(selectedMode==='stress')options.lockCount=true;
      try{window.localStorage.setItem('developer.workload',selectedMode);}catch{}
    }
    const actual=setEnemyCount(run,target,jump);
    if(actual!==target)text(error,`可用位置或容量不足：实际生成 ${actual} 个。`);
    else text(error,jump?(workload.snapshot().evolutionQueued?'已到进化等级，返回战斗选择进化。':'已应用 '+modeNames[selectedMode]+'，返回战斗开始运行。'):'已更新普通怪数量。');
    run.renderWorld(0);refresh();
    return snapshot();
  }
  function open(){
    if(panel||!run||run.state!=='play'||app.screen)return;
    mountEntrance();
    showOnEntry=false;
    run.state='paused';run.input.releaseLock();run.input.pressed.clear();
    run.input.stickX=run.input.stickY=0;
    seconds=Math.round(run.stageTime);target=ordinaryCount(run);
    panel=node('div','','position:absolute;inset:0;z-index:1000;background:#162620b8;display:flex;align-items:center;justify-content:center;padding:12px;pointer-events:auto;');
    panel.id='zx-dev-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','开发者测试');
    const shell=node('div','','width:100%;max-width:360px;max-height:96%;display:flex;flex-direction:column;border:2px solid #df9a56;border-radius:18px;background:#fffaf0;color:#36443e;overflow:hidden;');
    shell.append(node('b','开发者测试','font-size:19px;flex:none;padding:12px 14px 4px;'),node('small','独立测试存档 · 面板打开时暂停','font-size:11px;flex:none;padding:0 14px 8px;color:#886b4c;'));
    const card=node('div','','min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:9px;padding:8px 14px;');
    card.dataset.devScroll='true';shell.append(card);
    values={seconds:node('b','','font-size:14px;'),count:node('b','','font-size:14px;'),preset:node('small','','font-size:11px;'),skills:node('small','','font-size:11px;line-height:1.45;'),boss:node('small','','font-size:11px;'),modes:[],bossModes:[],toggles:[]};
    const modes=row(...Object.entries(modeNames).map(([key,label])=>{
      const button=action(label,()=>{selectedMode=key;refresh();},'mode-'+key);values.modes.push([key,button]);return button;
    }));
    const scenery=action('',()=>{options.hideScenery=!options.hideScenery;syncScenery();refresh();invalidate();},'toggle-scenery');
    values.toggles.push(()=>{
      text(scenery,options.hideScenery?'地图文具：已隐藏':'地图文具：已显示');
      scenery.setAttribute('aria-pressed',String(options.hideScenery));
    });
    card.append(scenery);
    card.append(modes,values.preset,values.skills);
    values.evolution=node('small','','font-size:12px;line-height:1.45;');
    values.evolve=action('升到下次进化',advanceEvolution,'evolve-next');
    card.append(values.evolution,values.evolve);
    const rig=heroRigs[run.player.speciesId];
    if(rig)card.append(action('预览偏旁动作',()=>{
      const group=rig.word==='风'?rig.groups[1]:rig.groups[0];
      const stroke=group.strokes[0];
      // Move edge strokes inward so the preview stays inside the player texture.
      const dx=rig.sheet==='fire'||stroke.px>256?-10:10;
      const dy=rig.sheet==='fire'||stroke.py>256?-1:1;
      const tilt=rig.sheet==='fire'?-12:-7;
      const shift=rig.sheet==='fire'?-8:0;
      const frames=Array.from({length:24},(_,i)=>{
        const lift=(1-Math.cos(i*Math.PI/12))/2;
        return {word:rig.word,groups:{[group.name]:{angle:tilt*lift,y:shift*lift}},
          strokes:{[group.name]:{[stroke.name]:{x:dx*lift,y:dy*38*lift,angle:32*lift}}}};
      });
      strokePreview={start:run.time,id:run.player.speciesId,frames};
      close();
    },'preview-hero-strokes'));
    const selectTime=value=>{seconds=bounded(value,600);if(selectedMode==='timed')target=ordinaryLimit(seconds,run.stage);refresh();};
    const times=row(...[0,2,2.5,3,5,6,7,8,10].map(m=>action(m+'分',()=>selectTime(m*60),'minute-'+m)));
    card.append(values.seconds,times,row(action('−30秒',()=>selectTime(seconds-30),'time-minus'),action('+30秒',()=>selectTime(seconds+30),'time-plus')));
    card.append(values.count,row(...[0,100,200,400,600,1000].map(n=>action(String(n),()=>{target=n;refresh();},'count-'+n))),row(action('−10怪',()=>{target=bounded(target-10,MAX_COUNT);refresh();}),action('+10怪',()=>{target=bounded(target+10,MAX_COUNT);refresh();})));
    card.append(row(...Object.entries(bossModes).map(([key,label])=>{
      const button=action(label,()=>{bossMode=key;refresh();},'boss-'+key);values.bossModes.push([key,button]);return button;
    })),values.boss,action('选下一波首领时间',()=>{const next=nextEncounter(run.director.timeline,seconds);if(next){seconds=next.t;bossMode='timed';refresh();}},'next-boss'));
    const switches=row();
    for(const [key,label] of [['invincible','无敌'],['lockCount','锁定怪数'],['monitor','统计'],['spawn','自然刷怪']]){
      const toggle=action('',()=>{options[key]=!options[key];update();refresh();},'toggle-'+key);
      const update=()=>{text(toggle,label+' '+(options[key]?'开':'关'));toggle.setAttribute('aria-pressed',String(options[key]));if(monitor)monitor.hidden=!options.monitor;};
      update();values.toggles.push(update);switches.append(toggle);
    }
    card.append(switches,node('small','按时间刷新最近一波首领；区域 Boss 可直接召唤，击败后按正式流程开启裂隙、发放奖励并前往下一区域。跳时间会清理旧首领及其随从，不发清理奖励。配装沿用正式技能池与强化规则。达到进化等级后，返回战斗选择方向并确认；也可点「升到下次进化」直接测试。停止预设会恢复原形态与路线。满负载额外加快施放。','font-size:11px;line-height:1.45;color:#796b57;'));
    const stats=node('div','','font-size:11px;line-height:1.5;background:#edf0e6;padding:8px;border-radius:8px;');writeSummary(stats);card.append(stats);
    const footer=node('div','','flex:none;display:flex;flex-direction:column;gap:6px;padding:8px 14px 12px;');shell.append(footer);
    error=node('div','','font-size:11px;color:#b4472d;min-height:16px;');footer.append(error);
    const applyButton=action('应用时间与场景',()=>{apply(true);writeSummary(stats);},'apply');applyButton.style.background='#f7d5a4';
    footer.append(row(applyButton,action('仅改怪数',()=>{apply(false);writeSummary(stats);},'count-only')),
      row(action('停止预设 / 恢复配装',()=>{workload.stop();selectedMode='none';refresh();writeSummary(stats);text(error,'已恢复原配装；已有短时特效自然结束。');},'stop-workload'),action('返回战斗',close,'close')));
    panel.append(shell);run.ui.root.append(panel);refresh();invalidate();
  }
  function attach(next){
    // startRun can route through the loading flow and call itself again.
    if(run===next)return;
    panel?.remove();panel=null;values=null;error=null;button?.remove();monitorLayer?.remove();
    workload?.stop();strokePreview=null;run=next;workload=createWorkload(run,skills);encounters=createEncounterTest(run,speciesName);lastMaintain=0;showOnEntry=true;
    syncScenery();
    const renderWorld=run.renderWorld.bind(run);
    run.renderWorld=dt=>{
      syncScenery();
      if(strokePreview){
        const frame=Math.floor(Math.max(0,run.time-strokePreview.start)*20);
        if(frame>=72||run.player.speciesId!==strokePreview.id){run.player.heroPose=null;strokePreview=null;}
        else run.player.heroPose=strokePreview.frames[frame%24];
      }
      return renderWorld(dt);
    };
    button=action('测试',open,'open');button.id='zx-dev-button';button.setAttribute('aria-label','开发者测试');
    button.style.cssText='position:absolute;z-index:950;right:62px;top:117px;width:58px;height:40px;min-height:40px;padding:0;border:2px solid #fffdf7;border-radius:12px;background:#ffe0ad;color:#855329;font-size:14px;font-weight:700;pointer-events:auto;';
    // Keep the entry out of the HUD's clipping and independently cached groups.
    const reposition=()=>{
      const hidden=!!app.screen||run.state!=='play';
      if(button.hidden!==hidden){button.hidden=hidden;invalidate();}
      const pause=run.ui.root.querySelector('.zx-hud-pause')?.getBoundingClientRect();
      if(pause?.width>0){
        const top=Math.max(8,Math.min(window.innerHeight-48,pause.y))+'px';
        if(button.style.top!==top){button.style.top=top;invalidate();}
      }
    };
    mountEntrance=()=>{if(!button.isConnected){run.ui.root.append(button);invalidate();}reposition();};
    mountEntrance();
    monitor=node('div','','position:absolute;z-index:900;left:12px;top:190px;width:248px;min-height:84px;padding:5px 8px;background:#fffaf0eb;border-radius:8px;color:#71583a;white-space:pre-wrap;font-size:10px;line-height:1.45;pointer-events:none;');
    // Keep a visible anchor so toggling the statistics can refresh locally.
    monitorLayer=node('div','','position:absolute;left:0;top:0;width:0;height:0;overflow:visible;pointer-events:none;');
    monitorLayer.dataset.uiLayer='diagnostics';
    monitor.id='zx-dev-monitor';monitor.hidden=!options.monitor;monitorLayer.append(monitor);run.ui.root.append(monitorLayer);
    const hurt=run.player.hurt.bind(run.player);run.player.hurt=(...args)=>options.invincible?false:hurt(...args);
    const resume=run.resume.bind(run);
    run.resume=()=>{panel?.remove();panel=null;values=null;error=null;const result=resume();mountEntrance();refresh();invalidate();return result;};
    const showPause=run.ui.showPause.bind(run.ui);
    run.ui.showPause=(...args)=>{
      const result=showPause(...args),body=run.ui.modalEl?.querySelector('.zx-pause-body');
      button.hidden=true;monitor.hidden=true;
      if(body&&!body.querySelector('[data-dev-action="pause-open"]')){
        const entry=action('开发者测试 · 分钟 / 怪数',()=>{run.resume();open();},'pause-open');
        entry.style.background='#ffe0ad';entry.style.width='100%';body.append(entry);invalidate();
      }
      return result;
    };
    wireDirector();
    const govern=run.governHorde.bind(run);
    run.governHorde=()=>{if(options.lockCount)run.crowdSample=null;else govern();};
    const update=run.update.bind(run);
    run.update=dt=>{
      if(run.director!==wiredDirector){wireDirector();wiredDirector=run.director;}
      const before=run.time,beforeState=run.state,result=update(dt),now=performance.now();
      if(showOnEntry)open();
      workload.update(Math.max(0,run.time-before));
      // Evolution returns to play without calling resume(). Restore the test
      // entry immediately instead of waiting for the one-second monitor tick.
      if(run.state!==beforeState){mountEntrance();refresh();invalidate();}
      if(run.state==='play'&&options.lockCount&&now-lastMaintain>=1000){lastMaintain=now;setEnemyCount(run,target);}
      if(now-lastSample>=1000){lastSample=now;mountEntrance();if(options.monitor&&!panel)refresh();}
      return result;
    };
    let wiredDirector=run.director;
    const dispose=run.dispose.bind(run);
    run.dispose=()=>{workload.stop();panel?.remove();panel=null;values=null;error=null;button?.remove();monitorLayer?.remove();return dispose();};
  }
  const start=app.startRun.bind(app);
  app.startRun=async(...args)=>{const result=await start(...args);if(result&&app.run){attach(app.run);if(showOnEntry)open();}return result;};
  const render=app.r.render.bind(app.r);
  app.r.render=(...args)=>{
    // Stage introductions may arrive after the automatic test panel opens.
    // Keep the active test controls visible and touchable from the first frame.
    if(panel)doc.querySelectorAll('.zx-intro').forEach(node=>node.remove());
    // Cover entry through a retained callback or a replaced HUD as well as the
    // normal startRun return. Only mount when the stage is fully initialized.
    if(app.run&&!app.run.disposed&&!app.run.buildingStage&&app.run.director){
      if(run!==app.run&&app.run.ui.root.querySelector('.zx-hud-pause'))attach(app.run);
      if(run===app.run){
        if(button&&!button.isConnected)mountEntrance();
        if(showOnEntry)open();
      }
    }
    const now=performance.now(),info=app.r.renderer.info,autoReset=info.autoReset;
    if(run?.state==='play'){
      frames++;const elapsed=now-since;
      if(elapsed>=1000){fps=frames*1000/elapsed;frameMs=elapsed/frames;frames=0;since=now;}
    }else{frames=0;since=now;}
    info.autoReset=false;info.reset();
    try{return render(...args);}finally{calls=info.render.calls;triangles=info.render.triangles;info.autoReset=autoReset;}
  };
  // Test API exists exclusively in the isolated developer build.
  window.__zixingDeveloper={options,open,close,snapshot,attachRun:attach,stopWorkload:()=>workload?.stop(),advanceEvolution,
    apply({time:nextTime,count,seek=true,mode,boss}){
      if(boss!==undefined){if(!Object.prototype.hasOwnProperty.call(bossModes,boss))throw Error('Unknown encounter mode');bossMode=boss;}
      if(mode!==undefined){if(!Object.prototype.hasOwnProperty.call(modeNames,mode))throw Error('Unknown workload mode');selectedMode=mode;}
      if(nextTime!==undefined)seconds=bounded(nextTime,600);if(count!==undefined)target=Math.round(bounded(count,MAX_COUNT));return apply(seek);
    }};
}
