import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Exercise the returning-player path: a fresh guest never reads cloud progress
// until the first tap, so a cold-only smoke test cannot catch this startup stall.
export async function reviewStartupLatency({page,dir,baseline=false}) {
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
      else if(args[0]==='[宝可梦启动] 游戏首页已绘制')startupAudit.events.push({stage:'游戏首页已绘制',ms:args[1]});
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
    releaseTextDownload();
  },saved.local);
  await page.waitForFunction(()=>window.releaseStartupCloud,{timeout:30000});
  // Hold the server response independently of local loading and rendering.
  await new Promise(resolve=>setTimeout(resolve,3000));
  const before=await page.evaluate(()=>({home:!!app.zixing&&app.screen?.dataset.page==='home',
    complete:bootPercentages.includes(100),profile:!!app.meta.profile,percent:bootPercentages.at(-1)}));
  await page.screenshot({path:path.join(dir,baseline?'startup-before.png':'startup-after.png')});
  if(!baseline){
    assert.ok(before.home&&before.complete,'Home must be usable while cloud progress is still pending');
    assert.equal(before.profile,false,'Do not fabricate a profile before cloud progress arrives');
    await page.evaluate(()=>inspected.doc.querySelector('[data-action="journey"]').click());
    assert.equal(await page.evaluate(()=>app.screen?.dataset.page),'request','Entering gameplay must wait for the shared profile request');
    await page.evaluate(()=>app.zixing.help());
  }
  await page.evaluate(()=>releaseStartupCloud());
  await page.waitForFunction(()=>app.meta.profile?.stardust===321&&bootPercentages.includes(100),{timeout:15000});
  if(!baseline)assert.equal(await page.evaluate(()=>app.screen?.dataset.page),'help','A late save must not navigate away from the current page');
  const report=await page.evaluate(()=>({...startupAudit,packages:requestedPackages,percentages:[...new Set(bootPercentages)]}));
  report.beforeCloudReturned=before;
  if(!baseline){
    assert.equal(report.unsupportedCalls,0,'Native rendering must never submit unsupported color-space pixelStore calls');
    assert.equal(report.cloudRequests,1,'Home and gameplay entry must share one profile request');
    assert.deepEqual([...new Set(report.packages)].sort(),['play','text'],'Optional art/world packages must not delay the home screen');
  }
  await page.evaluate(()=>{releaseOptionalDownloads();app.zixing.home();});
  fs.writeFileSync(path.join(dir,baseline?'startup-before.json':'startup-after.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Returning-player startup:',JSON.stringify(report));
}
