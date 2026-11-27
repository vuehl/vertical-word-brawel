import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewRunSettlement({page,dir}) {
  const before=await page.evaluate(async()=>{
    await app.zixing.prepareProfile();
    const profile=app.meta.profile,initial={dust:profile.stardust,runs:profile.counters.runs||0,kills:profile.counters.kills||0};
    await app.startRun({species:4,biome:'forest',tier:0,boosts:[],mode:'standard'});
    app.halted=true;
    const run=app.run;run.time=30;run.stats.kills=4;
    inspected.env.dispatchEvent(new inspected.env.Event('pagehide'));
    const live=JSON.parse(inspected.env.localStorage.getItem('pb.live'));
    const active=await app.backend.retryNow(app.meta.account);
    return {...initial,id:app.meta.ticket.id,live:live.ticket.id,activeSaved:active.saved};
  });
  assert.equal(before.id,before.live);assert.equal(before.activeSaved,0);
  const checkpoint=await page.evaluate(()=>JSON.parse(inspected.env.localStorage.getItem('pb.live')));
  await page.evaluateOnNewDocument(()=>{window.holdHomeStatus=false;});

  async function reopen() {
    // The fixture keeps its filesystem and cloud in memory. Carry their real
    // contents across reloads as WeChat does when starting a new process.
    const save=await page.evaluate(async()=>({
      file:wx.getFileSystemManager().readFileSync('/userdata/pokebonk-save.json','utf8'),
      progress:(await wx.cloud.callContainer({path:'/v1/progress',method:'GET'})).data.progress,
    }));
    await page.reload();
    await page.waitForFunction(()=>window.releaseTextDownload&&window.wx);
    await page.evaluate(async({file,progress})=>{
      wx.getFileSystemManager().writeFileSync('/userdata/pokebonk-save.json',file);
      await wx.cloud.callContainer({path:'/v1/progress',method:'POST',data:{progress}});
      // Cover an immediate relaunch even when this test machine boots slowly.
      const live=JSON.parse(wx.getStorageSync('pokebonk.web.pb.live')||'null');
      if(live)wx.setStorageSync('pokebonk.web.pb.liveBeat.'+live.ticket.id,String(Date.now()));
      releaseTextDownload();releaseOptionalDownloads();
    },save);
    await page.waitForFunction(()=>window.app?.screen?.dataset.page==='home'&&app.meta.profile&&bootPercentages.includes(100),{timeout:45000});
    // The old confirmation was scheduled 1.5 seconds after saving.
    await new Promise(resolve=>setTimeout(resolve,1800));
    return page.evaluate(id=>{
      const p=app.meta.profile,record=p.runs.find(entry=>entry.id===id);
      return {dust:p.stardust,runs:p.counters.runs,kills:p.counters.kills,matching:p.runs.filter(entry=>entry.id===id).length,
        time:record?.time,runKills:record?.kills,pending:app.meta.hasPending(),home:app.screen.dataset.page,
        confirmation:!!inspected.doc.querySelector('.season-modal,.app-notice')};
    },before.id);
  }
  const first=await reopen();
  assert.deepEqual(first,{dust:before.dust+1,runs:before.runs+1,kills:before.kills+4,matching:1,time:30,runKills:4,pending:false,home:'home',confirmation:false});
  await page.screenshot({path:path.join(dir,'自动结算后的首页.png')});
  // Replay a queued result whose acknowledgement was lost after crediting.
  await page.evaluate(entry=>inspected.env.localStorage.setItem('pb.pending',JSON.stringify([entry])),checkpoint);
  const second=await reopen();
  assert.deepEqual(second,first,'Reopening again must not credit the same run twice');
  fs.writeFileSync(path.join(dir,'run-settlement.json'),JSON.stringify({before,first,second},null,2));
  console.log('Interrupted run settled once, with no confirmation on either launch.');
}

// A restored account reads cloud progress before the automatic entry. Scene
// downloads must overlap that read, while the single boot bar still covers it.
export async function reviewStartupLatency({page,dir,baseline=false}) {
  // Automatic first-launch handoff is covered by opening-regression.mjs.
  const saved=await page.evaluate(async()=>{
    const account=await app.backend.guest();await app.meta.load(account);
    const p=app.meta.profile;
    return {local:wx.getFileSystemManager().readFileSync('/userdata/pokebonk-save.json','utf8'),
      cloud:{owner:'fixture',revision:2,progress:{stardust:321,totalStardust:321,lab:{...p.lab},stages:{...p.stageUnlocks,forest:p.biomes.forest}}}};
  });
  await page.evaluateOnNewDocument(saved=>{
    window.holdHomeStatus=false;
    window.startupAudit={events:[],unsupportedCalls:0};
    const info=console.info;
    console.info=function(...args){
      if(args[0]==='[宝可梦启动]')startupAudit.events.push({stage:args[1],ms:args[2]});
      else if(args[0]==='[宝可梦启动] 游戏首页已绘制'){
        startupAudit.events.push({stage:'游戏首页已绘制',ms:args[1]});
        startupAudit.completedAt=performance.now();
      }
      return info.apply(this,args);
    };
    const proto=WebGL2RenderingContext.prototype,store=proto.pixelStorei;
    proto.pixelStorei=function(parameter,value){
      if(parameter===0x9243){startupAudit.unsupportedCalls++;return;}
      return store.call(this,parameter,value);
    };
    window.fixtureProgress=async()=>{
      startupAudit.cloudRequests=(startupAudit.cloudRequests||0)+1;
      startupAudit.cloudRequested=performance.now();
      await new Promise(resolve=>{window.releaseStartupCloud=resolve;});
      startupAudit.cloudReturned=performance.now();
      return {statusCode:200,data:saved};
    };
  },saved.cloud);
  await page.reload();
  await page.waitForFunction(()=>window.releaseTextDownload);
  await page.evaluate(local=>{
    wx.getFileSystemManager().writeFileSync('/userdata/pokebonk-save.json',local);
    releaseTextDownload();releaseOptionalDownloads();
  },saved.local);
  await page.waitForFunction(()=>window.releaseStartupCloud,{timeout:30000});
  // Hold the server response independently of local loading and rendering.
  await new Promise(resolve=>setTimeout(resolve,3000));
  const before=await page.evaluate(()=>({home:!!app.zixing&&app.screen?.dataset.page==='home',
    complete:bootPercentages.includes(100),profile:!!app.meta.profile,percent:bootPercentages.at(-1),
    sceneReady:['world','art'].every(name=>Number.isFinite(GameGlobal.pokebonk.files.diagnostics.packs[name]?.totalMs)),
    sceneDownloads:requestedPackages.filter(name=>name==='world'||name==='art'),
    deferredRequested:requestedPackages.includes('wind')}));
  await page.screenshot({path:path.join(dir,baseline?'startup-before.png':'startup-after.png')});
  if(!baseline){
    // Every launch now prepares the saved profile before automatic entry. The
    // earlier menu-first contract must not require revealing incomplete state.
    assert.equal(before.complete,false,'Boot cannot report completion while the saved profile is pending');
    assert.equal(before.profile,false,'Do not fabricate a profile before cloud progress arrives');
    assert.equal(before.sceneReady,true,'Scene installation must finish independently of the pending cloud response');
    assert.deepEqual(before.sceneDownloads.sort(),['art','world'],'Early preload and entry must share one install per scene package');
    assert.equal(before.deferredRequested,false,'Later character resources must not compete with startup');
  }
  await page.evaluate(()=>releaseStartupCloud());
  await page.waitForFunction(()=>app.meta.profile?.stardust===321&&bootPercentages.includes(100),{timeout:15000});
  if(!baseline){
    await page.waitForFunction(()=>app.screen?.querySelector('[data-action="multiplayer"]'));
    assert.equal(await page.evaluate(()=>app.screen?.dataset.page),'home','The menu fixture must finish after the profile arrives');
    // The full bar stays visible briefly before boot completion. Deferred
    // preparation also yields once, so wait for its actual request boundary.
    await page.waitForFunction(()=>GameGlobal.pokebonk.bootDiagnostics.completed&&requestedPackages.includes('wind'));
  }
  const report=await page.evaluate(()=>({...startupAudit,packages:requestedPackages,packageTimings,
    percentages:[...new Set(bootPercentages)]}));
  report.beforeCloudReturned=before;
  if(!baseline){
    assert.equal(report.unsupportedCalls,0,'Native rendering must never submit unsupported color-space pixelStore calls');
    assert.equal(report.cloudRequests,1,'Home and gameplay entry must share one profile request');
    assert.deepEqual([...new Set(report.packages)].sort(),['art','play','text','wind','world'],'Startup must use the packaged desk and character art, with wind prefetched after boot');
    assert.equal(report.packages.filter(name=>name==='wind').length,1);
    assert.ok(report.packageTimings.find(event=>event.name==='wind').requestedAt>=report.completedAt,
      'Deferred downloads must start after the full boot bar is submitted');
  }
  await page.evaluate(()=>app.zixing.home());
  fs.writeFileSync(path.join(dir,baseline?'startup-before.json':'startup-after.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Returning-player startup:',JSON.stringify(report));
}
