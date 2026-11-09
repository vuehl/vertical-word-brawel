// DEV ONLY: injected by tools/developer/build-support.mjs, never imported by
// source/. No settings, debug actions or test rewards enter the release save.
const SPECIAL=2|4|128|2048|4096|8192|16384|32768|65536|131072;
const MAX_COUNT=1000;
const ordinary=(enemies,i)=>enemies.alive[i]&&!(enemies.flags[i]&SPECIAL);
const bounded=(value,max)=>Math.max(0,Math.min(max,Number.isFinite(Number(value))?Number(value):0));
const time=seconds=>Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0');

export function seekWave(run,seconds){
  if(run.stage>3||run.sanctuary||run.endless||run.tower)throw Error('时间跳转仅用于普通三区。');
  seconds=bounded(seconds,600);
  const old=run.stageTime,Director=run.director.constructor;
  // Rebuild card draws at their authored times, including the late pool. Past
  // one-shot encounters are marked consumed, not all fired in a single frame.
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
    const id=enemies.spawn(cards[index%cards.length].id,x,z,run.director.hpMult(),run.director.dmgMult());
    if(id<0)break;
    current++;
  }
  enemies.grid.build(enemies.n,enemies.x,enemies.z,enemies.alive,enemies.radius,enemies.dying);
  return current;
}

export function installDeveloperMode(app){
  const options={invincible:false,lockCount:false,monitor:false,spawn:true};
  let run=null,button=null,monitor=null,panel=null,target=200,seconds=120;
  let frames=0,since=performance.now(),fps=0,frameMs=0,calls=0,triangles=0,lastSample=0,lastMaintain=0;
  let values=null,error=null;
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
  function snapshot(){
    if(!run)return null;
    let visible=0,normal=0;
    const e=run.enemies;
    for(let i=0;i<e.n;i++)if(e.alive[i]){
      if(ordinary(e,i))normal++;
      const dt=e.lodDt[i],x=e.x[i]+(dt>0?(e.vx[i]+e.kx[i])*dt:0),z=e.z[i]+(dt>0?(e.vz[i]+e.kz[i])*dt:0);
      if(!(e.flags[i]&32768)&&run.sprites.visible(x,e.y[i]+e.hgt[i]*.5,z,2+Math.max(e.hgt[i],e.radius[i]*2.4)))visible++;
    }
    return {stage:run.stage,stageTime:run.stageTime,total:e.count,ordinary:normal,visible,
      fps,frameMs,calls,triangles,particles:run.vfx.add.n+run.vfx.norm.n,pickups:run.pickups.count,
      textures:app.r.renderer.info.memory.textures,geometries:app.r.renderer.info.memory.geometries,
      hpMultiplier:run.director.hpMult(),cards:run.director.cards.map(card=>card.id)};
  }
  function summary(){
    const s=snapshot();if(!s)return '';
    return `区域 ${s.stage} · ${time(s.stageTime)}   FPS ${s.fps.toFixed(1)}\n普通怪 ${s.ordinary} / 总数 ${s.total} / 入镜 ${s.visible}\n3D 绘制 ${s.calls} 次 · 三角形 ${s.triangles}\n粒子 ${s.particles} · 掉落 ${s.pickups} · 纹理 ${s.textures}`;
  }
  function refresh(){
    if(values){text(values.seconds,'本区时间 '+time(seconds));text(values.count,'普通怪目标 '+target);}
    if(monitor){monitor.hidden=!options.monitor;if(options.monitor)text(monitor,summary());}
  }
  function wireDirector(){
    const director=run.director;if(wiredDirectors.has(director))return;wiredDirectors.add(director);
    const update=director.update.bind(director);
    director.update=dt=>{if(options.spawn&&!options.lockCount)update(dt);};
  }
  function close(){
    if(!panel)return;panel.remove();panel=null;values=null;error=null;
    if(run&&!run.disposed&&run.state==='paused')run.resume();
    refresh();
  }
  function apply(jump){
    if(!run||run.disposed||!['play','paused'].includes(run.state))throw Error('请先进入可操作的战斗。');
    if(jump){seekWave(run,seconds);wireDirector();}
    const actual=setEnemyCount(run,target,jump);
    if(actual!==target)text(error,`可用位置或容量不足：实际生成 ${actual} 个。`);
    else text(error,jump?'已更新怪池、强度和时间。':'已更新普通怪数量。');
    run.renderWorld(0);refresh();
    return snapshot();
  }
  function open(){
    if(panel||!run||run.state!=='play'||app.screen)return;
    run.state='paused';run.input.releaseLock();run.input.pressed.clear();
    run.input.stickX=run.input.stickY=0;
    seconds=Math.round(run.stageTime);target=ordinaryCount(run);
    panel=node('div','','position:absolute;inset:0;z-index:1000;background:#162620b8;display:flex;align-items:center;justify-content:center;padding:12px;pointer-events:auto;');
    panel.id='zx-dev-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','开发者测试');
    const shell=node('div','','width:100%;max-width:360px;max-height:96%;display:flex;flex-direction:column;border:2px solid #df9a56;border-radius:18px;background:#fffaf0;color:#36443e;overflow:hidden;');
    shell.append(node('b','开发者测试','font-size:19px;flex:none;padding:12px 14px 4px;'),node('small','独立测试存档 · 面板打开时暂停','font-size:11px;flex:none;padding:0 14px 8px;color:#886b4c;'));
    const card=node('div','','min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:9px;padding:8px 14px;');
    card.dataset.devScroll='true';shell.append(card);
    values={seconds:node('b','','font-size:14px;'),count:node('b','','font-size:14px;')};
    const times=row(...[0,2,3,5,8,10].map(m=>action(m+'分',()=>{seconds=m*60;refresh();},'minute-'+m)));
    card.append(values.seconds,times,row(action('−30秒',()=>{seconds=bounded(seconds-30,600);refresh();},'time-minus'),action('+30秒',()=>{seconds=bounded(seconds+30,600);refresh();},'time-plus')));
    card.append(values.count,row(...[0,100,200,400,600,1000].map(n=>action(String(n),()=>{target=n;refresh();},'count-'+n))),row(action('−10怪',()=>{target=bounded(target-10,MAX_COUNT);refresh();}),action('+10怪',()=>{target=bounded(target+10,MAX_COUNT);refresh();})));
    const switches=row();
    for(const [key,label] of [['invincible','无敌'],['lockCount','锁定怪数'],['monitor','统计'],['spawn','自然刷怪']]){
      const toggle=action('',()=>{options[key]=!options[key];update();refresh();},'toggle-'+key);
      const update=()=>{text(toggle,label+' '+(options[key]?'开':'关'));toggle.setAttribute('aria-pressed',String(options[key]));if(monitor)monitor.hidden=!options.monitor;};
      update();switches.append(toggle);
    }
    card.append(switches,node('small','跳转重建普通怪池与强度；保留角色等级和首领。已过去的特殊事件不补发。锁定怪数暂停自然波次，每秒补齐。','font-size:11px;line-height:1.45;color:#796b57;'));
    const stats=node('div',summary(),'font-size:11px;line-height:1.5;white-space:pre-wrap;background:#edf0e6;padding:8px;border-radius:8px;');card.append(stats);
    const footer=node('div','','flex:none;display:flex;flex-direction:column;gap:6px;padding:8px 14px 12px;');shell.append(footer);
    error=node('div','','font-size:11px;color:#b4472d;min-height:16px;');footer.append(error);
    const applyButton=action('跳转时间并布怪',()=>{apply(true);text(stats,summary());},'apply');applyButton.style.background='#f7d5a4';
    footer.append(row(applyButton,action('仅改怪数',()=>{apply(false);text(stats,summary());},'count-only')),action('返回战斗',close,'close'));
    panel.append(shell);run.ui.root.append(panel);refresh();
  }
  function attach(next){
    panel?.remove();panel=null;values=null;error=null;button?.remove();monitor?.remove();
    run=next;lastMaintain=0;
    const stack=run.ui.root.querySelector('.zx-hud-top');if(!stack)throw Error('Developer HUD anchor missing');
    button=action('测',open,'open');button.id='zx-dev-button';button.setAttribute('aria-label','开发者测试');
    button.style.cssText='position:absolute;right:50px;top:109px;width:36px;height:40px;min-height:40px;padding:0;border:2px solid #fffdf7;border-radius:12px;background:#ffe0ad;color:#855329;font-size:16px;font-weight:700;pointer-events:auto;';
    stack.append(button);
    const reposition=()=>{button.style.top=(window.innerWidth<=350?97:109)+'px';};reposition();
    monitor=node('div','','position:absolute;left:0;top:156px;max-width:248px;padding:5px 8px;background:#fffaf0eb;border-radius:8px;color:#71583a;white-space:pre-wrap;font-size:10px;line-height:1.45;pointer-events:none;');
    monitor.id='zx-dev-monitor';monitor.hidden=!options.monitor;stack.append(monitor);
    const hurt=run.player.hurt.bind(run.player);run.player.hurt=(...args)=>options.invincible?false:hurt(...args);
    const resume=run.resume.bind(run);
    run.resume=()=>{panel?.remove();panel=null;values=null;error=null;return resume();};
    wireDirector();
    const govern=run.governHorde.bind(run);
    run.governHorde=()=>{if(options.lockCount)run.crowdSample=null;else govern();};
    const update=run.update.bind(run);
    run.update=dt=>{
      if(run.director!==wiredDirector){wireDirector();wiredDirector=run.director;}
      const result=update(dt),now=performance.now();
      if(run.state==='play'&&options.lockCount&&now-lastMaintain>=1000){lastMaintain=now;setEnemyCount(run,target);}
      if(now-lastSample>=1000){lastSample=now;reposition();if(options.monitor&&!panel)refresh();}
      return result;
    };
    let wiredDirector=run.director;
    const dispose=run.dispose.bind(run);
    run.dispose=()=>{panel?.remove();panel=null;values=null;error=null;button?.remove();monitor?.remove();return dispose();};
  }
  const start=app.startRun.bind(app);
  app.startRun=async(...args)=>{const result=await start(...args);if(result&&app.run)attach(app.run);return result;};
  const render=app.r.render.bind(app.r);
  app.r.render=(...args)=>{
    const now=performance.now(),info=app.r.renderer.info,autoReset=info.autoReset;
    if(run?.state==='play'){
      frames++;const elapsed=now-since;
      if(elapsed>=1000){fps=frames*1000/elapsed;frameMs=elapsed/frames;frames=0;since=now;}
    }else{frames=0;since=now;}
    info.autoReset=false;info.reset();
    try{return render(...args);}finally{calls=info.render.calls;triangles=info.render.triangles;info.autoReset=autoReset;}
  };
  // Test API exists exclusively in the isolated developer build.
  window.__zixingDeveloper={options,open,close,snapshot,
    apply({time:nextTime,count,seek=true}){if(nextTime!==undefined)seconds=bounded(nextTime,600);if(count!==undefined)target=Math.round(bounded(count,MAX_COUNT));return apply(seek);}};
}
