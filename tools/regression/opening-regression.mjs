import assert from 'node:assert/strict';
import path from 'node:path';
import {writeFile} from 'node:fs/promises';

export async function verifyOpening({page,dir}){
  const retrying=await page.evaluate(()=>!!window.failOpeningResources||!!window.testOpeningImageFailure);
  if(!retrying){
    // Keep scene downloads blocked after the engine is ready. The original
    // bar must keep ownership, with no second progressbar or movie playback.
    await page.waitForFunction(()=>app.entryOpening?.frameCount===1&&requestedPackages.includes('world')&&requestedPackages.includes('art'));
    await new Promise(resolve=>setTimeout(resolve,250));
    assert.deepEqual(await page.evaluate(()=>({complete:GameGlobal.pokebonk.bootDiagnostics.completed,
      full:bootLabels.includes('100%'),frames:app.entryOpening.frameCount,
      secondBar:!!app.screen.querySelector('[role="progressbar"]')})),
    {complete:false,full:false,frames:1,secondBar:false});
    await page.evaluate(()=>releaseOptionalDownloads());
  }
  if(await page.evaluate(()=>!!window.testOpeningImageFailure))await page.evaluate(()=>releaseOptionalDownloads());
  if(await page.evaluate(()=>!!window.failOpeningResources||!!window.testOpeningImageFailure)){
    await page.waitForFunction(()=>app.screen?.dataset.page==='entry-error',{timeout:60000});
    assert.equal(await page.evaluate(()=>!!app.meta.profile.firstJourneyPlayed),false);
    assert.ok(await page.evaluate(()=>openingDecoders.every(d=>d.removed)));
    await page.evaluate(()=>app.screen.querySelector('[data-action="retry-entry"]').click());
  }
  // No tap is sent at any point in this cold-launch scenario.
  // Install the audit and hide in the same browser task that observes the first
  // frame. Separate CDP calls can arrive after the whole film under GPU load.
  await page.waitForFunction(()=>{
    if(!GameGlobal.pokebonk.bootDiagnostics.completed||!(app.entryOpening?.frameCount>0))return false;
    const env=inspected.env,draw=env.drawUI;
    window.openingAudit={fadeFrames:0,times:[],images:{},framesBeforeHide:app.entryOpening.frameCount,
      entryScreen:app.screen?.dataset.page,scenePrepared:app.zixing.entryDiagnostics.phases.at(-1)?.phase,
      secondBar:!!app.screen?.querySelector('[role="progressbar"]'),timeAtHandoff:app.run?.time};
    env.drawUI=(...args)=>{
      const result=draw(...args),film=app.entryOpening;
      if(film?.revealing){openingAudit.fadeFrames++;openingAudit.times.push(app.run.time);}
      const key=film?.revealing&&openingAudit.fadeFrames===6?'fade':film?.frameCount===90?'movie':null;
      if(key&&!openingAudit.images[key])openingAudit.images[key]=app.r.canvas._surface.toDataURL('image/png');
      return result;
    };
    fixtureHide();
    return true;
  },{timeout:60000});
  assert.ok(await page.evaluate(()=>bootLabels.includes('100%')));
  assert.equal(await page.evaluate(()=>openingAudit.entryScreen),'entry');
  if(!retrying){
    assert.deepEqual(await page.evaluate(()=>[openingAudit.scenePrepared,openingAudit.secondBar,openingAudit.timeAtHandoff]),
      ['准备完成',false,0],'Boot completes only with a prepared scene, no second bar and no elapsed battle time');
  }
  await new Promise(resolve=>setTimeout(resolve,300));
  assert.ok(await page.evaluate(()=>app.entryOpening.frameCount===openingAudit.framesBeforeHide));
  await page.evaluate(()=>{fixtureShow();releaseOptionalDownloads();});
  await page.waitForFunction(()=>app.run?.state==='play'&&!app.screen&&!app.entryOpening,{timeout:90000});
  const result=await page.evaluate(()=>{
    const paths=new Set(Array.from({length:29},(_,i)=>__host.files.pathFor('assets/opening/p'+String(i).padStart(2,'0')+'.webp')));
    const loads=nativeImageLoads.filter(image=>paths.has(image.path)),ids=new Set(loads.map(image=>image.id));
    return {audit:openingAudit,decoders:openingDecoders,
      openingMemory:{pages:loads.length,nativeImages:ids.size,retained:nativeImageStates.filter(image=>ids.has(image.id)&&image.path).length},
      saved:app.meta.profile.firstJourneyPlayed,config:app.lastCfg,time:app.run.time};
  });
  assert.equal(result.openingMemory.retained,0,'Completed opening releases every native page source');
  if(!retrying)assert.deepEqual(result.openingMemory,{pages:29,nativeImages:2,retained:0});
  assert.equal(result.decoders.at(-1).frames,169);
  assert.ok(result.decoders.every(d=>d.removed));assert.equal(result.saved,true);
  assert.equal(result.config.mode,'single-stage');assert.equal(result.config.species,4);
  assert.ok(result.audit.fadeFrames>3);assert.ok(result.audit.times.every(t=>t===0));
  for(const [name,url] of Object.entries(result.audit.images))
    await writeFile(path.join(dir,'opening-'+name+'.png'),Buffer.from(url.split(',')[1],'base64'));
  await page.screenshot({path:path.join(dir,'opening-game.png')});
  // Exercise the actual settlement/home path, rather than restarting the app.
  await page.evaluate(()=>app.run.finish(true));
  await page.waitForFunction(()=>inspected.doc.querySelector('[data-action="report-home"]'));
  await page.evaluate(()=>inspected.doc.querySelector('[data-action="report-home"]').click());
  await page.evaluate(()=>app.zixing.prepareBoot(app.meta.account));
  assert.equal(await page.evaluate(()=>app.screen.dataset.page),'home');
  assert.equal(await page.evaluate(()=>openingDecoders.length),result.decoders.length,'Same session does not replay opening');
  assert.equal(await page.evaluate(async()=>(await app.backend.loadProfile(app.meta.account)).firstJourneyPlayed),true);
  await page.evaluate(()=>app.screen.querySelector('[data-action="journey"]').click());
  await page.waitForFunction(()=>app.screen?.dataset.page==='choose'&&app.screen._journeyIdle);
  await page.evaluate(()=>app.screen.querySelector('[data-action="collection-next"]').click());
  await page.waitForFunction(()=>app.screen?.dataset.page==='map'&&app.screen._journeyIdle);
  assert.ok(await page.evaluate(()=>!!app.screen.querySelector('[data-mode="single-stage"]')));
  await page.evaluate(()=>app.screen.querySelector('[data-mode="standard"][data-tier="0"]').click());
  await page.evaluate(()=>app.screen.querySelector('[data-action="enter"]').click());
  await page.waitForFunction(()=>app.run?.state==='play'&&!app.screen&&!app.starting,{timeout:90000});
  assert.equal(await page.evaluate(()=>app.lastCfg.mode),'standard');
  assert.equal(await page.evaluate(()=>openingDecoders.length),result.decoders.length,'Multi-stage does not replay opening');
  await page.evaluate(async()=>{await app.run.finish(false);inspected.doc.querySelector('[data-action="report-home"]').click();});
  await page.evaluate(()=>app.screen.querySelector('[data-action="multiplayer"]').click());
  await page.waitForFunction(()=>app.screen?.dataset.page==='coop');
  await page.evaluate(()=>{app.zixing.home();fixtureHide();fixtureShow();});
  assert.equal(await page.evaluate(()=>app.screen.dataset.page),'home');
  assert.equal(await page.evaluate(()=>openingDecoders.length),result.decoders.length,'Co-op menu and foreground resume do not replay opening');

  // The fixture filesystem/cloud are in memory. Carry the real save across
  // a browser reload to simulate exiting and scanning into the game again.
  const saved=await page.evaluate(async()=>{
    await app.meta.saveNow();
    const p=await app.backend.loadProfile(app.meta.account);
    return {file:wx.getFileSystemManager().readFileSync('/userdata/pokebonk-save.json','utf8'),
      progress:(await wx.cloud.callContainer({path:'/v1/progress',method:'GET'})).data.progress,
      retained:{stardust:p.stardust,totalStardust:p.totalStardust,lab:p.lab,biomes:p.biomes,
        unlocked:p.unlocked,starter:p.starter,runs:p.counters.runs}};
  });
  await page.evaluateOnNewDocument(()=>{window.holdHomeStatus=false;window.failOpeningResources=false;window.failOpeningPageOnce=false;});
  await page.reload();
  await page.waitForFunction(()=>window.releaseTextDownload&&window.wx);
  await page.evaluate(async saved=>{
    wx.getFileSystemManager().writeFileSync('/userdata/pokebonk-save.json',saved.file);
    await wx.cloud.callContainer({path:'/v1/progress',method:'POST',data:{progress:saved.progress}});
    releaseTextDownload();releaseOptionalDownloads();
  },saved);
  await page.waitForFunction(()=>GameGlobal.pokebonk.bootDiagnostics.completed&&app.entryOpening?.frameCount>0,{timeout:60000});
  assert.equal(await page.evaluate(()=>app.meta.profile.firstJourneyPlayed),true,'Experienced player also gets the opening');
  await page.waitForFunction(()=>app.run?.state==='play'&&!app.screen&&!app.entryOpening,{timeout:90000});
  assert.equal(await page.evaluate(()=>app.lastCfg.mode),'single-stage');
  const retained=await page.evaluate(()=>{
    const p=app.meta.profile;
    return {stardust:p.stardust,totalStardust:p.totalStardust,lab:p.lab,biomes:p.biomes,
      unlocked:p.unlocked,starter:p.starter,runs:p.counters.runs};
  });
  assert.deepEqual(retained,saved.retained,'Relaunching the opening must preserve existing progress');
  assert.equal(await page.evaluate(()=>openingDecoders.at(-1).frames),169);
  await writeFile(path.join(dir,'opening-result.json'),JSON.stringify({...result,retained,relaunchOpening:true,
    audit:{...result.audit,images:Object.keys(result.audit.images)}},null,2));
  console.log('Session opening passed: new and saved players auto-enter single-stage; settlement, multi-stage, co-op menu and foreground resume stay normal; full relaunch replays the film and preserves progress.');
}
