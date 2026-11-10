import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {reviewEncounters} from './encounters-regression.mjs';
import {reviewDeveloperSkills} from './skills-regression.mjs';
import {reviewDeveloperEvolution} from './evolution-regression.mjs';

export async function enterDeveloperFromHome(page,dir){
  // Use the user's native-touch route, not a direct app.startRun call.
  for(const selector of ['[data-action="journey"]','.zx-choose .zx-footer .primary','.zx-map .zx-footer .primary','[data-action="enter"]']){
    await page.waitForFunction(selector=>!!inspected.doc.querySelector(selector),{timeout:30000},selector);
    const point=await page.evaluate(selector=>{
      app.r.render(0);inspected.env.drawUI(app.r.renderer);
      const box=inspected.doc.querySelector(selector).getBoundingClientRect();
      const screen=inspected.doc.getElementById('game').getBoundingClientRect();
      if(box.width<=0||box.height<=0)throw Error('Entry control is not visible: '+selector);
      return {x:box.x+box.width/2-screen.x,y:box.y+box.height/2-screen.y};
    },selector);
    await page.touchscreen.tap(point.x,point.y);
  }
  await page.waitForFunction(()=>app.run?.state==='paused'&&inspected.layout.box(inspected.doc.querySelector('#zx-dev-panel'))?.w>0,{timeout:90000});
  await page.evaluate(()=>{app.halted=true;app.run.godMode=true;app.run.queueLevelUp=()=>{};app.run.update(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);});
  await page.screenshot({path:path.join(dir,'dev-from-home-touch.png')});
  console.log('Native home -> character -> map -> difficulty -> automatic developer panel passed.');
}

export async function reviewDeveloper(page,dir){
  const report={environment:'Compiled isolated developer build / Chrome SwiftShader; NOT phone FPS.',widths:[],waves:[]};
  const draw=()=>page.evaluate(()=>{app.run.update(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);});
  const tap=async action=>{
    await page.evaluate(action=>{
      const el=inspected.doc.querySelector('[data-dev-action="'+action+'"]'),sc=el?.closest('[data-dev-scroll]');
      if(sc){const b=el.getBoundingClientRect(),s=sc.getBoundingClientRect();
        if(b.bottom>s.bottom)sc.scrollTop+=b.bottom-s.bottom+8;
        else if(b.top<s.top)sc.scrollTop+=b.top-s.top-8;}
    },action);
    await draw();
    const box=await page.evaluate(action=>{
      const el=inspected.doc.querySelector('[data-dev-action="'+action+'"]');
      const box=el?.getBoundingClientRect();if(!box)throw Error('Missing button: '+action);
      const screen=inspected.doc.getElementById('game').getBoundingClientRect();
      return {x:box.x+box.width/2-screen.x,y:box.y+box.height/2-screen.y};
    },action);
    await page.touchscreen.tap(box.x,box.y);await draw();
  };
  report.firstEntry=await page.evaluate(()=>({state:app.run.state,panel:!!inspected.doc.querySelector('#zx-dev-panel')}));
  assert.deepEqual(report.firstEntry,{state:'paused',panel:true},'First battle must display the minute/count panel automatically');
  await draw();await page.screenshot({path:path.join(dir,'dev-first-entry.png')});
  await tap('close');
  if(process.argv.includes('--boss-only'))return reviewEncounters(page,dir,tap,draw);
  if(process.argv.includes('--skills-only'))return reviewDeveloperSkills(page,dir);
  if(process.argv.includes('--evolution-only'))return reviewDeveloperEvolution(page,dir);
  await page.evaluate(()=>{
    // Performance scenarios below use the fire hero; explicitly confirm its
    // real evolution before measuring the continuing combat workload.
    window.finishDeveloperFireEvolution=()=>{
      const r=app.run;r.update(0);
      if(r.state!=='modal')return;
      if(inspected.doc.querySelector('[data-branch-id]'))throw Error('Performance fixture requires an explicit branch choice');
      const button=[...inspected.doc.querySelectorAll('.zx-modal button')].find(n=>n.textContent.includes('确认进阶'));
      if(!button)throw Error('Unexpected modal during workload setup');button.click();
      for(let i=0;i<300;i++)r.update(1/60);
    };
  });
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:3});
    await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
    // Native pointer coordinates use the safe area, not the browser DOM.
    await draw();
    const layout=await page.evaluate(()=>{
      const b=inspected.doc.querySelector('#zx-dev-button').getBoundingClientRect();
      const p=inspected.doc.querySelector('.zx-hud-pause').getBoundingClientRect();
      const entry=inspected.doc.querySelector('#zx-dev-button'),clip=inspected.layout.box(entry)?.clip;
      return {button:{x:b.x,y:b.y,width:b.width,height:b.height},pause:{x:p.x,y:p.y,width:p.width,height:p.height},
        rootLayer:entry.parentElement===app.run.ui.root,fullyVisible:!!clip&&b.x>=clip.x&&b.y>=clip.y&&b.right<=clip.r&&b.bottom<=clip.b};
    });
    assert.ok(layout.button.x+layout.button.width<=layout.pause.x,'Developer button overlaps pause');
    assert.ok(layout.button.x>=0&&layout.button.y>=0);
    assert.ok(layout.rootLayer&&layout.fullyVisible,'Entry must be on the root layer and wholly inside its clip');
    await page.screenshot({path:path.join(dir,`dev-button-${width}.png`)});
    await tap('open');
    assert.equal(await page.evaluate(()=>app.run.state),'paused');
    assert.ok(await page.evaluate(()=>!!inspected.doc.querySelector('#zx-dev-panel')),'Touch must open developer panel');
    await page.screenshot({path:path.join(dir,`dev-panel-${width}.png`)});
    await tap('minute-2');await tap('count-200');await tap('apply');
    const state=await page.evaluate(()=>inspected.env.__zixingDeveloper.snapshot());
    assert.equal(state.stageTime,120);assert.equal(state.ordinary,200);
    await tap('close');assert.equal(await page.evaluate(()=>app.run.state),'play');
    report.widths.push({width,height,...layout,state});
  }
  // Losing a HUD node must not permanently lose the only test entry.
  await page.evaluate(()=>inspected.doc.querySelector('#zx-dev-button').remove());
  await draw();
  assert.equal(await page.evaluate(()=>inspected.doc.querySelectorAll('#zx-dev-button').length),1);
  await page.evaluate(()=>app.run.pause());await draw();
  await page.screenshot({path:path.join(dir,'dev-pause-entry.png')});
  await tap('pause-open');
  assert.ok(await page.evaluate(()=>!!inspected.doc.querySelector('#zx-dev-panel')),'Pause menu must open developer panel');
  await tap('close');
  report.entryRecovery={remount:true,pauseMenu:true};
  for(const seconds of [0,120,300,480,600,120]){
    const sample=await page.evaluate(seconds=>{
      const api=inspected.env.__zixingDeveloper;
      const before={kills:app.run.stats.kills,gold:app.run.gold,xp:app.run.player.xp};
      const state=api.apply({time:seconds,count:600});
      return {state,before,after:{kills:app.run.stats.kills,gold:app.run.gold,xp:app.run.player.xp},
        pendingPast:app.run.director.timeline.filter(e=>e.t<=seconds&&!e.done).length,
        finalSwarm:app.run.director.finalSwarm};
    },seconds);
    assert.equal(sample.state.stageTime,seconds);assert.equal(sample.state.ordinary,600);
    assert.deepEqual(sample.before,sample.after,'Debug removal must not award rewards');
    assert.equal(sample.pendingPast,0);assert.equal(sample.finalSwarm,seconds>=600);
    report.waves.push(sample);
  }
  assert.ok(report.waves[3].state.hpMultiplier>report.waves[1].state.hpMultiplier,'Jump must change actual monster strength');
  assert.ok(report.waves[3].state.cards.length>report.waves[1].state.cards.length,'Jump must advance the monster pool');
  report.counts=await page.evaluate(()=>{
    const api=inspected.env.__zixingDeveloper,e=app.run.enemies;
    const special=e.spawn(app.run.director.cards[0].id,20,20,1,1,128);
    const values=[0,100,1000].map(count=>api.apply({count,seek:false}));
    const specialPreserved=e.isAlive(special);e.kill(special);
    api.open();app.run.resume();
    return {values,specialPreserved,resumeCloses:!inspected.doc.querySelector('#zx-dev-panel')};
  });
  assert.deepEqual(report.counts.values.map(s=>s.ordinary),[0,100,1000]);
  assert.ok(report.counts.values.every(s=>s.stageTime===120),'Count-only must not change the clock');
  assert.equal(report.counts.specialPreserved,true);assert.equal(report.counts.resumeCloses,true);
  report.encounters=await reviewEncounters(page,dir,tap,draw);
  report.persistence=await page.evaluate(async()=>{
    await app.meta.saveNow();
    const fs=wx.getFileSystemManager(),files=fs.readdirSync('/userdata');
    const keys=Object.keys(localStorage);
    return {files,keys};
  });
  assert.ok(report.persistence.files.includes('pokebonk-dev-save.json'),'Developer save missing');
  assert.ok(!report.persistence.files.includes('pokebonk-save.json'),'Developer build touched production save');
  assert.ok(report.persistence.keys.some(key=>key.startsWith('pokebonk.dev.web.')));
  assert.ok(!report.persistence.keys.some(key=>key.startsWith('pokebonk.web.')));
  report.workloads=await page.evaluate(()=>{
    const api=inspected.env.__zixingDeveloper,r=app.run,p=r.player;
    api.stopWorkload();
    const original={level:p.level,moves:p.moves,items:p.items,vitamins:p.vitamins,addXp:p.addXp,gainLevel:p.gainLevel,xp:p.xp,slots:p.moveSlots};
    const limits=()=>[r.vfx.add.limit,r.vfx.norm.limit,r.vfx.text.limit,r.performance.particleCell];
    const beforeLimits=[r.performance.particles,r.performance.normalParticles,r.performance.damageTexts,r.performance.particleCell],samples=[];
    api.options.lockCount=true;api.options.spawn=false;
    for(const [mode,time] of [['timed',120],['timed',480],['stress',0]]){
      const kills=r.stats.kills,gold=r.gold,ultimates=r.ult.uses;
      const initial=api.apply({mode,time,count:200});
      p.gainLevel(); // Rare candy must not change the fixed workload level.
      const displayedLevel=inspected.doc.querySelector('.zx-hud-level').textContent;
      const appliedWithoutRewards=r.stats.kills===kills&&r.gold===gold&&p.xp===original.xp;
      // Pause must hold all developer producers, not merely stop the monsters.
      api.open();const elapsed=api.snapshot().workload.elapsed,loot=r.pickups.count;
      r.update(.5);const paused=api.snapshot().workload.elapsed===elapsed&&r.pickups.count===loot;
      api.close();finishDeveloperFireEvolution();r.ult.active=0;r.ult.castPending=false;
      const peak={projectiles:0,zones:0,texts:0,particles:0,pickups:0},budgetViolations=[];
      for(let frame=0;frame<360;frame++){
        if(frame%60===0)api.apply({count:200,seek:false});
        r.update(1/30);
        const s=api.snapshot();for(const key in peak)peak[key]=Math.max(peak[key],s[key]);
        const current=limits();
        if(s.texts>current[2]||s.particles>current[0]+current[1])budgetViolations.push({frame,texts:s.texts,particles:s.particles,limits:current});
      }
      samples.push({mode,time,initial,peak,paused,appliedWithoutRewards,displayedLevel,state:r.state,
        damage:p.moves.filter(Boolean).reduce((n,m)=>n+m.damageDone,0),ultimates:r.ult.uses-ultimates,
        limits:limits(),budgetViolations,levelStable:p.level===initial.workload.level});
    }
    const rewind=api.apply({mode:'timed',time:120,count:200});
    api.stopWorkload();
    return {samples,rewind,beforeLimits,restored:p.level===original.level&&p.moves===original.moves&&p.items===original.items&&p.vitamins===original.vitamins&&p.addXp===original.addXp&&p.gainLevel===original.gainLevel&&p.xp===original.xp&&p.moveSlots===original.slots,
      stopped:api.snapshot().workload.mode==='none'};
  });
  for(const sample of report.workloads.samples){
    assert.ok(sample.appliedWithoutRewards,'Preset application must not award gold/XP/kills');
    assert.ok(sample.paused,'Paused developer panel must stop the load producers');
    assert.equal(sample.state,'play');assert.ok(sample.levelStable);
    assert.equal(sample.displayedLevel,'LV.'+sample.initial.workload.level,'HUD must immediately show the applied level');
    assert.ok(sample.damage>0,'Real skills must damage real enemies');
    assert.ok(sample.ultimates>0,'Real ultimate must run');
    for(const key of ['projectiles','texts','particles','pickups'])assert.ok(sample.peak[key]>0,`${sample.mode}: missing ${key}`);
    // A legal character kit need not contain a persistent-area attack.
    assert.ok(sample.limits.every((v,i)=>v<=report.workloads.beforeLimits[i]),'Crowd pressure must stay within production quality budgets');
    // The crowd can cross a budget boundary as it dies. Compare each frame
    // with its own limit, not an earlier peak against the final lower limit.
    assert.deepEqual(sample.budgetViolations,[]);
  }
  assert.equal(report.workloads.rewind.workload.level,8);
  assert.equal(report.workloads.rewind.workload.moves.length,3);
  assert.ok(report.workloads.rewind.pickups<=35,'Rewind must not stack leftover loot');
  assert.ok(report.workloads.restored&&report.workloads.stopped,'Restore original build and XP callback');
  report.qualityWorkloads=[];
  for(const quality of ['low','medium','high']){
    const sample=await page.evaluate(quality=>{
      const api=inspected.env.__zixingDeveloper,r=app.run;
      app.meta.profile.settings.quality=quality;app.applySettings();
      const limits=[r.vfx.add.limit,r.vfx.norm.limit,r.vfx.text.limit];
      api.apply({mode:'stress',time:300,count:200});
      finishDeveloperFireEvolution();
      for(let i=0;i<90;i++)r.update(1/30);
      api.open();api.close();
      app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
      const monitor=inspected.doc.querySelector('#zx-dev-monitor'),box=monitor.getBoundingClientRect();
      return {quality,limits,after:[r.vfx.add.limit,r.vfx.norm.limit,r.vfx.text.limit],snapshot:api.snapshot(),monitor:{hidden:monitor.hidden,width:box.width,height:box.height,text:monitor.textContent}};
    },quality);
    assert.ok(sample.after.every((v,i)=>v<=sample.limits[i]),'Crowd effects may tighten the selected quality budget');
    assert.equal(sample.snapshot.workload.mode,'stress');
    assert.ok(sample.snapshot.texts<=sample.limits[2]);
    assert.ok(!sample.monitor.hidden&&sample.monitor.width>0&&sample.monitor.height>0&&sample.monitor.text.includes('弹道'));
    report.qualityWorkloads.push(sample);
    await page.screenshot({path:path.join(dir,`dev-combat-${quality}.png`)});
  }
  // Exercise the mode and stop controls through actual native touch as well.
  await tap('open');await tap('mode-stress');await tap('minute-5');await tap('apply');
  assert.equal(await page.evaluate(()=>inspected.env.__zixingDeveloper.snapshot().workload.mode),'stress');
  await tap('stop-workload');
  assert.equal(await page.evaluate(()=>inspected.env.__zixingDeveloper.snapshot().workload.mode),'none');
  await tap('close');
  report.lifecycle=await page.evaluate(async()=>{
    const api=inspected.env.__zixingDeveloper;
    api.options.invincible=true;api.options.lockCount=true;api.apply({time:120,count:200});
    const hp=app.run.player.hp;app.run.player.hurt(1e6,'normal',-1);
    const invincible=app.run.player.hp===hp;
    app.run.enemies.clear();
    await new Promise(resolve=>setTimeout(resolve,1050));app.run.update(1/60);
    const maintained=api.snapshot().ordinary;
    api.options.monitor=true;app.run.update(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);
    api.open();app.run.dispose();
    const removed=!inspected.doc.querySelector('#zx-dev-panel')&&!inspected.doc.querySelector('#zx-dev-button');
    app.run=null;
    await app.startRun({species:16,biome:'forest',tier:0,boosts:[],mode:'standard'});
    return {invincible,maintained,removed,buttons:inspected.doc.querySelectorAll('#zx-dev-button').length};
  });
  assert.equal(report.lifecycle.invincible,true);assert.equal(report.lifecycle.maintained,200);
  assert.equal(report.lifecycle.removed,true);assert.equal(report.lifecycle.buttons,1);
  await reviewDeveloperSkills(page,dir);
  await reviewDeveloperEvolution(page,dir);
  fs.writeFileSync(path.join(dir,'developer-regression.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Developer checks passed:',report.widths.length,'viewport sizes,',report.waves.length,'time jumps; isolated save and lifecycle.');
}
