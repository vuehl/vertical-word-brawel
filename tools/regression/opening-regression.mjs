import assert from 'node:assert/strict';
import path from 'node:path';
import {writeFile} from 'node:fs/promises';

export async function verifyOpening({page,dir}){
  const retrying=await page.evaluate(()=>!!window.failOpeningResources);
  if(retrying){
    await page.evaluate(()=>releaseOptionalDownloads());
    await page.waitForFunction(()=>app.screen?.dataset.page==='entry-error'&&!app.starting);
    assert.equal(await page.evaluate(()=>!!app.meta.profile.firstJourneyPlayed),false);
    await page.evaluate(()=>app.screen.querySelector('[data-action="retry-entry"]').click());
  }else{
    await page.waitForFunction(()=>window.openingProfileRequested&&requestedPackages.includes('world')&&requestedPackages.includes('art'));
    assert.equal(await page.evaluate(()=>GameGlobal.pokebonk.bootDiagnostics.completed||bootPercentages.includes(100)),false);
    await page.evaluate(()=>releaseOptionalDownloads());
    await page.waitForFunction(()=>['world','art'].every(n=>GameGlobal.pokebonk.files.diagnostics.packs[n]?.totalMs!==undefined));
    assert.equal(await page.evaluate(()=>GameGlobal.pokebonk.bootDiagnostics.completed),false);
    await page.evaluate(()=>releaseOpeningProfile());
  }
  async function checkPlay(){
    await page.waitForFunction(()=>GameGlobal.pokebonk.bootDiagnostics.completed&&app.run?.state==='play'&&!app.screen&&!app.starting,{timeout:90000});
    const result=await page.evaluate(()=>({mode:app.run.mode,species:app.run.player.speciesId,film:typeof inspected.env.playJourneyOpening,
      saved:app.meta.profile.firstJourneyPlayed,complete:bootLabels.includes('100%'),missing:[...missingAssets]}));
    assert.deepEqual(result,{mode:'single-stage',species:4,film:'undefined',saved:true,complete:true,missing:[]});
    return result;
  }
  const fresh=await checkPlay();
  await page.evaluate(()=>app.run.finish(true));
  await page.waitForFunction(()=>inspected.doc.querySelector('[data-action="report-home"]'));
  await page.evaluate(()=>inspected.doc.querySelector('[data-action="report-home"]').click());
  await page.waitForFunction(()=>app.screen?.dataset.page==='home');
  await page.evaluate(()=>app.screen.querySelector('[data-action="multiplayer"]').click());
  await page.waitForFunction(()=>app.screen?.dataset.page==='coop');
  await page.evaluate(()=>{app.zixing.home();fixtureHide();fixtureShow();});

  const saved=await page.evaluate(async()=>{
    await app.meta.saveNow();const p=await app.backend.loadProfile(app.meta.account);
    return {file:wx.getFileSystemManager().readFileSync('/userdata/pokebonk-save.json','utf8'),
      progress:(await wx.cloud.callContainer({path:'/v1/progress',method:'GET'})).data.progress,
      retained:{dust:p.stardust,lab:p.lab,biomes:p.biomes,starter:p.starter,runs:p.counters.runs}};
  });
  await page.evaluateOnNewDocument(()=>{window.holdHomeStatus=false;window.failOpeningResources=false;});
  await page.reload();
  await page.waitForFunction(()=>window.releaseTextDownload&&window.wx);
  await page.evaluate(async saved=>{
    wx.getFileSystemManager().writeFileSync('/userdata/pokebonk-save.json',saved.file);
    await wx.cloud.callContainer({path:'/v1/progress',method:'POST',data:{progress:saved.progress}});
    releaseTextDownload();releaseOptionalDownloads();
  },saved);
  const returning=await checkPlay();
  assert.deepEqual(await page.evaluate(()=>{
    const p=app.meta.profile;return {dust:p.stardust,lab:p.lab,biomes:p.biomes,starter:p.starter,runs:p.counters.runs};
  }),saved.retained);
  await writeFile(path.join(dir,'opening-result.json'),JSON.stringify({fresh,returning,retrying},null,2));
  console.log('Direct entry verified for new and saved profiles, including settlement and the co-op menu.');
}
