import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export function installNativePerformanceFixture(){
  window.fixturePluginLoads=[];
  window.requirePlugin=name=>{
    fixturePluginLoads.push(name);
    throw Error('This game must run without a power-mode plugin');
  };
}

export async function reviewNativePerformance(page,dir){
  const report=await page.evaluate(async()=>{
    const {env,doc}=inspected,r=app.r,renderer=r.renderer,gl=renderer.getContext();
    const settings=app.meta.profile.settings;
    const firstRequest=fixtureFrameRates.length;
    const frame=()=>app.pacer.ready(performance.now(),realFrameGap());
    app.pacer.reset();app.run.state='play';frame();frame();
    app.run.state='paused';frame();app.run.state='play';frame();
    settings.frameRateMode='manual';settings.lock30Fps=true;app.applySettings();frame();
    settings.lock30Fps=false;app.applySettings();frame();
    const requestedFrameRates=fixtureFrameRates.slice(firstRequest);
    app.run.ui.hud(app.run);r.render(0);env.drawUI(renderer);
    app.run.state='paused';app.zixing.settings(()=>{});
    const graphics=[...doc.querySelectorAll('.zx-tabs.main button')].find(el=>el.textContent==='画面');
    graphics.click();await new Promise(resolve=>setTimeout(resolve,0));
    const hasPowerSetting=!!doc.querySelector('[aria-label="iPhone 温控模式"]');
    const hasPowerControl='iosPowerMode' in env;
    env.drawUI(renderer,true);
    const remove=gl.deleteTexture,create=gl.createTexture;let released=0,recreated=0;
    gl.deleteTexture=function(texture){released++;return remove(texture);};
    gl.createTexture=function(){recreated++;return create();};
    try{
      fixtureMemoryWarning({level:10});fixtureMemoryWarning({level:10});
      app.setScreen(null);app.run.state='play';app.run.ui.hud(app.run);r.render(0);env.drawUI(renderer);
    }finally{gl.deleteTexture=remove;gl.createTexture=create;}
    return {platform:env.nativeDevice.platform,pluginLoads:fixturePluginLoads,hasPowerSetting,hasPowerControl,
      requestedFrameRates,gc:fixtureGCs,released,recreated,glError:gl.getError()};
  });
  assert.equal(report.platform,'ios');assert.deepEqual(report.pluginLoads,[]);
  assert.equal(report.hasPowerSetting,false);assert.equal(report.hasPowerControl,false);
  assert.deepEqual(report.requestedFrameRates,[60,30,60]);
  assert.equal(report.gc,1);assert.ok(report.released>0&&report.recreated>0);assert.equal(report.glError,0);
  fs.writeFileSync(path.join(dir,'native-performance.json'),JSON.stringify(report,null,2));console.log(report);
}

export async function reviewIOSBudget(page,dir){
  const report={environment:'Compiled WeChat developer build; iOS API fixture in Chrome SwiftShader. This does not measure iPhone FPS.',waves:[],combat:[]};
  report.device=await page.evaluate(()=>{
    app.halted=true;
    const api=inspected.env.__zixingDeveloper;
    if(!api)throw Error('Use --dev --ios-budget');
    api.close();Object.assign(api.options,{invincible:true,lockCount:false,spawn:true});
    app.meta.profile.settings.quality='high';app.applySettings();
    const r=app.r;
    app.run.state='play';app.dyn={t:0,frames:0,js:0,good:0,wait:8,lastUp:-1e9};
    for(let i=0;i<4;i++)app.adaptRes(2200,2.2,10000+i*2200);
    const slowScale=r.dynRes;r.setDynRes(1);r.render(0);
    return {platform:inspected.env.nativeDevice.platform,profile:app.run.performance,slowScale,
      world:[r.composer.inputBuffer.width,r.composer.inputBuffer.height],ui:[inspected.uiCanvas.width,inspected.uiCanvas.height]};
  });
  assert.equal(report.device.platform,'ios');assert.equal(report.device.slowScale,1);
  assert.equal(report.device.profile.bloom,true);assert.deepEqual(report.device.world,[780,1688]);
  report.qualityLock=await page.evaluate(()=>{
    const samples=[],r=app.r,run=app.run,s=app.meta.profile.settings;
    const state=()=>({quality:s.quality,dyn:r.dynRes,world:[r.composer.inputBuffer.width,r.composer.inputBuffer.height],
      bloom:r.bloom.intensity,outline:r.outlinePass.enabled,particles:[run.vfx.add.limit,run.vfx.norm.limit],texts:run.vfx.text.limit,cap:run.liveCap});
    for(const platform of ['ios','android'])for(const quality of ['low','medium','high']){
      inspected.env.nativeDevice.platform=platform;Object.assign(s,{quality});app.applySettings();r.render(0);
      const before=state();app.dyn={t:0,frames:0,js:0,good:0,wait:8,lastUp:-1e9};
      for(let frame=0;frame<60;frame++)app.adaptRes(2200,2.2,10000+frame*2200);
      for(const count of [0,200,600,1000])r.setCombatLoad(count);
      r.setDynRes(.6);r.render(0);
      samples.push({platform,quality,before,after:state()});
    }
    inspected.env.nativeDevice.platform='ios';s.quality='high';app.applySettings();
    return samples;
  });
  for(const sample of report.qualityLock){assert.deepEqual(sample.after,sample.before);assert.equal(sample.after.dyn,1);}
  assert.deepEqual(report.qualityLock.slice(0,3).map(s=>s.before),report.qualityLock.slice(3).map(s=>s.before));
  report.capShadows=await page.evaluate(()=>{
    const run=app.run,s=app.meta.profile.settings;
    return ['high','locked','off','high'].map(action=>{
      s.frameRateMode='manual';s.lock30Fps=action==='locked';if(action==='high')s.quality='high';
      app.applySettings();run.renderWorld(0);app.r.render(0);
      return {quality:s.quality,size:app.r.sun.shadow.map.width};
    });
  });
  assert.deepEqual(report.capShadows,[{quality:'high',size:2048},{quality:'high',size:2048},{quality:'high',size:2048},{quality:'high',size:2048}]);
  report.panel=await page.evaluate(()=>{
    const api=inspected.env.__zixingDeveloper,doc=inspected.doc;
    api.open();
    const click=id=>doc.querySelector('[data-dev-action="'+id+'"]').click();
    click('mode-timed');click('boss-none');
    const values=[];
    for(const minute of [2,5,10]){click('minute-'+minute);click('apply');values.push(api.snapshot().ordinary);}
    click('count-600');click('apply');const stress=api.snapshot().ordinary;
    api.close();return {values,stress};
  });
  assert.deepEqual(report.panel.values,[72,200,200]);assert.equal(report.panel.stress,600);
  const caps=[14,44,72,115,160,200,200,200,200,200,200];
  for(let minute=0;minute<=10;minute++){
    const wave=await page.evaluate(minute=>{
      const run=app.run,api=inspected.env.__zixingDeveloper;
      api.apply({time:minute*60,count:0,mode:'none',boss:'none'});
      const e=run.enemies,id=run.director.cards[0].id;
      // Exercise production spawn(), not the developer count override.
      for(let i=0;i<240;i++)e.spawn(id,run.player.pos.x+10,run.player.pos.z+10,1,1,[0,1,512,1024][i%4]);
      const ordinary=api.snapshot().ordinary;
      for(const kind of ['swarm','stampede','elitewave'])run.director.fire(kind);
      const afterEvents=api.snapshot().ordinary;
      const boss=e.spawn(id,run.player.pos.x+14,run.player.pos.z,1,1,2);
      const bossAllowed=boss>=0;if(boss>=0)e.kill(boss);
      run.director.update(0);
      return {minute,ordinary,afterEvents,bossAllowed,cap:run.director.liveCap,weight:run.director.weight};
    },minute);
    assert.equal(wave.ordinary,caps[minute]);assert.equal(wave.afterEvents,caps[minute]);assert.ok(wave.bossAllowed);
    assert.equal(wave.cap,caps[minute]);assert.equal(wave.weight,1);report.waves.push(wave);
  }
  report.spawnBurst=await page.evaluate(()=>{
    const run=app.run,api=inspected.env.__zixingDeveloper;
    api.apply({time:600,count:0,mode:'none',boss:'none'});
    run.director.finalSwarm=false;
    let peak=0;
    for(let frame=0;frame<120;frame++){
      run.director.credits=1e6;
      const before=api.snapshot().ordinary;
      run.director.update(1/60);peak=Math.max(peak,api.snapshot().ordinary-before);
    }
    return {peak,total:api.snapshot().ordinary};
  });
  assert.ok(report.spawnBurst.peak<=3&&report.spawnBurst.total<=48&&report.spawnBurst.total>0);
  for(const [seconds,count] of [[120,72],[300,200],[600,200]]){
    const sample=await page.evaluate(async({seconds,count})=>{
      const run=app.run,api=inspected.env.__zixingDeveloper,renderer=app.r.renderer;
      Object.assign(api.options,{invincible:true,lockCount:true,monitor:false});
      api.apply({time:seconds,count,mode:'timed',boss:'none'});run.nextEvo=null;
      for(let i=0;i<run.enemies.n;i++)if(run.enemies.alive[i])run.enemies.hp[i]=run.enemies.maxHp[i]=1e10;
      const damage=run.stats.damage,draws=[];let particles=0,texts=0;
      for(let frame=0;frame<240;frame++){
        run.update(1/60);particles=Math.max(particles,run.vfx.add.n+run.vfx.norm.n);texts=Math.max(texts,run.vfx.text.items.length);
        if(frame%20===0){await new Promise(r=>setTimeout(r,0));app.r.render(1/60);inspected.env.drawUI(renderer);draws.push(renderer.info.render.calls);}
      }
      return {seconds,count,ordinary:api.snapshot().ordinary,state:run.state,damage:run.stats.damage-damage,particles,texts,draws,
        limits:[run.vfx.add.limit,run.vfx.norm.limit,run.vfx.text.limit],presetBloom:run.performance.bloom,bloom:app.r.bloom.intensity,
        textures:renderer.info.memory.textures,geometry:renderer.info.memory.geometries};
    },{seconds,count});
    assert.equal(sample.ordinary,count);assert.equal(sample.state,'play');assert.ok(sample.damage>0);
    assert.ok(sample.particles<=4800&&sample.texts<=160);assert.deepEqual(sample.limits,[3000,1800,160]);
    // The illustrated desk explicitly disables scene bloom in every preset.
    assert.equal(sample.presetBloom,true);assert.equal(sample.bloom,0);report.combat.push(sample);
    await page.screenshot({path:path.join(dir,`ios-${seconds}.png`)});
  }
  report.longRun=await page.evaluate(async()=>{
    const run=app.run,api=inspected.env.__zixingDeveloper,checkpoints=[];
    for(let block=0;block<20;block++){
      for(let frame=0;frame<300;frame++)run.update(1/30);
      await new Promise(r=>setTimeout(r,0));app.r.render(0);inspected.env.drawUI(app.r.renderer);
      checkpoints.push({time:run.stageTime,ordinary:api.snapshot().ordinary,slots:run.enemies.n,
        projectiles:run.projectiles.n,pickups:run.pickups.count,textures:app.r.renderer.info.memory.textures});
    }
    let finite=true;for(let i=0;i<run.enemies.n;i++)if(run.enemies.alive[i])finite&&=Number.isFinite(run.enemies.x[i]+run.enemies.z[i]+run.enemies.hp[i]);
    return {checkpoints,finite,state:run.state};
  });
  assert.ok(report.longRun.finite);assert.equal(report.longRun.state,'play');
  assert.ok(report.longRun.checkpoints.every(s=>s.ordinary<=200));
  const textures=report.longRun.checkpoints.map(s=>s.textures);assert.ok(Math.max(...textures)-Math.min(...textures)<=4);
  fs.writeFileSync(path.join(dir,'ios-budget.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
