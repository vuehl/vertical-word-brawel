import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewExitGuidance(page,dir){
  const report={settings:[],guidance:[],maps:[]};
  for(const width of [320,390]){
    await page.setViewport({width,height:width===320?568:844,deviceScaleFactor:3});
    await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
    report.settings.push(await page.evaluate(async()=>{
      const s=app.meta.profile.settings,doc=inspected.doc;
      Object.assign(s,{quality:'high',batterySaver:true,lock30Fps:false});app.applySettings();
      app.run.state='paused';app.zixing.settings(()=>{});
      const click=(selector,label)=>[...doc.querySelectorAll(selector)].find(e=>e.textContent===label).click();
      click('.zx-tabs.main button','画面');click('.zx-subtab','性能视野');
      const toggle=()=>doc.querySelector('[aria-label="锁定 30 帧"]');
      const initial={fps:app.fpsCap(),quality:s.quality,legacy:'batterySaver' in s,removed:!doc.querySelector('[aria-label="省电模式"]')};
      toggle().click();const phases=[];
      for(const state of ['play','paused','modal','transition']){app.run.state=state;phases.push(Math.round(1000/realFrameGap()));}
      click('.zx-option','均衡');const changed={quality:s.quality,fps:app.fpsCap()};
      await app.meta.saveNow();
      const saved=JSON.parse(wx.getFileSystemManager().readFileSync('/userdata/pokebonk-save.json','utf8')).accounts[app.meta.account.id].profile.settings;
      click('.zx-plain','恢复本页默认');
      inspected.env.drawUI(app.r.renderer,true);
      doc.querySelector('.zx-body').scrollTop=10000;
      inspected.env.invalidateUI();
      inspected.env.drawUI(app.r.renderer,true);
      const box=inspected.layout.box(toggle());
      return {initial,phases,changed,saved:{quality:saved.quality,locked:saved.lock30Fps,legacy:'batterySaver' in saved},reset:app.fpsCap(),text:doc.querySelector('.zx-body').textContent,visible:box.y>=box.clip.y&&box.y+box.h<=box.clip.b};
    }));
    await page.screenshot({path:path.join(dir,`exit-settings-${width}.png`)});
    const result=await page.evaluate(()=>{
      app.setScreen(null);const r=app.run;r.state='play';
      inspected.doc.querySelectorAll('.zx-intro,.run-hint,.banner').forEach(e=>e.remove());
      const p=r.player.pos,markers=r.interactables.markers;
      const ctx=r.ui.minimap.getContext('2d'),fill=ctx.fillText,labels=[];
      r.interactables.markers=()=>[{kind:'chest',x:p.x-20,z:p.z-10},{kind:'chest',data:{gift:true},x:p.x+20,z:p.z+10},{kind:'portal',x:p.x-15,z:p.z+30}];
      r.ui.mapFacilityKind=null;ctx.fillText=function(text,...args){labels.push(text);return fill.call(this,text,...args);};
      try{r.ui.drawMinimap(r,true);}finally{ctx.fillText=fill;r.interactables.markers=markers;}
      r.renderWorld(0);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
      return {labels,width:innerWidth};
    });
    report.maps.push(result);
    await page.screenshot({path:path.join(dir,`exit-minimap-${width}.png`)});
  }
  report.guidance=await page.evaluate(async()=>{
    const r=app.run,p=r.player.pos,doc=inspected.doc;
    r.spawnBoss(p.x+8,p.z);
    for(let i=0;i<600&&r.state==='cinematic';i++)r.update(1/30);
    if(r.state!=='play')throw Error('Boss entrance did not finish: '+r.state);
    r.combat.killEnemy(r.boss.bossIndex,{type:'normal'});
    r.state='play';r.ui.hud(r);
    const guide=()=>doc.querySelector('.zx-portal-guide');
    const states=[];
    const read=()=>({text:guide().textContent,hidden:guide().hidden});
    states.push({case:'boss killed',cleared:r.stageCleared,portal:r.interactables.markers().some(m=>m.kind==='portal'),...read()});
    // Guidance survives ordinary hint expiry and player settings that suppress banners.
    r.meta.profile.settings.showBanners=false;r.ui.hud(r);states.push({case:'banners disabled',...read()});
    r.mode='single-stage';r.ui.hud(r);states.push({case:'single',...read()});
    r.mode='standard';r.stage=2;r.ui.hud(r);states.push({case:'sanctuary next',...read()});
    r.stage=4;r.ui.hud(r);states.push({case:'final',...read()});
    r.state='paused';r.ui.hud(r);states.push({case:'paused',...read()});
    r.state='play';r.ui.hud(r);states.push({case:'resumed',...read()});
    r.stage=1;r.mode='standard';
    r.ui.hudEl.querySelectorAll('.banner').forEach(node=>node.remove());
    const portal=r.interactables.list.find(m=>m.kind==='portal');
    await portal.modelReady;
    r.player.pos.set(portal.x,portal.y,portal.z+12);r.player.vel.set(0,0,0);
    for(let i=0;i<150;i++)r.update(1/30);
    await new Promise(resolve=>setTimeout(resolve,150));
    r.ui.hud(r);r.ui.drawMinimap(r,true);r.updateCamera(1);
    r.renderWorld(0);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    return states;
  });
  await page.screenshot({path:path.join(dir,'exit-boss-defeated.png')});
  report.notice=await page.evaluate(()=>{
    const doc=inspected.doc,guide=doc.querySelector('.zx-portal-guide').getBoundingClientRect();
    const toast=doc.querySelector('.zx-toast-layer .toast')?.getBoundingClientRect();
    return {guideBottom:guide.bottom,toastTop:toast?.top};
  });
  report.advance=await page.evaluate(async()=>{
    const r=app.run;await r.enterPortal();r.state='play';r.ui.hud(r);
    return {stage:r.stage,cleared:r.stageCleared,hidden:inspected.doc.querySelector('.zx-portal-guide').hidden};
  });
  fs.writeFileSync(path.join(dir,'exit-guidance.json'),JSON.stringify(report,null,2));
  for(const s of report.settings){
    assert.deepEqual(s.initial,{fps:60,quality:'high',legacy:false,removed:true});
    assert.ok(s.phases.every(fps=>fps===30));assert.deepEqual(s.changed,{quality:'medium',fps:30});
    assert.deepEqual(s.saved,{quality:'medium',locked:true,legacy:false});assert.equal(s.reset,60);assert.ok(s.visible);
    assert.match(s.text,/如果手机出现卡顿/);assert.doesNotMatch(s.text,/省电模式/);
  }
  for(const m of report.maps)for(const name of ['红骰子','免费蓝骰子','传送门'])assert.ok(m.labels.includes(name),name);
  const [boss,noBanner,single,sanctuary,final,paused,resumed]=report.guidance;
  assert.ok(boss.cleared&&boss.portal&&!boss.hidden);assert.match(boss.text,/进入下一关/);
  assert.equal(noBanner.hidden,false);assert.match(single.text,/即可通关/);assert.match(sanctuary.text,/圣地/);assert.match(final.text,/即可通关/);
  assert.equal(paused.hidden,true);assert.equal(resumed.hidden,false);
  assert.ok(report.notice.toastTop>=report.notice.guideBottom,'Reward notice must not cover the exit guidance');
  assert.deepEqual(report.advance,{stage:2,cleared:false,hidden:true});
  fs.writeFileSync(path.join(dir,'exit-guidance.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
