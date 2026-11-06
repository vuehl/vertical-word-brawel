import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Run the real packaged game through entry, every forest area and a restart.
// Desktop timings are diagnostics, never an estimate of iPhone frame rates.
export async function reviewLoading({page,dir,sleep}) {
  const baseline=process.argv.includes('--baseline');
  await page.evaluate(async()=>{
    window.loadProbe={requests:[],readbacks:0,builds:[]};
    const files=GameGlobal.pokebonk.files;
    for(const key of ['pathFor','resolvePath']){
      const original=files[key];files[key]=function(url,...args){loadProbe.requests.push(String(url));return original.call(this,url,...args);};
    }
    const read=CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData=function(...args){loadProbe.readbacks++;return read.apply(this,args);};
    const account=await app.backend.guest();await app.meta.load(account);
    Object.assign(app.meta.profile.settings,{quality:'low',fpsLimit:30});app.applySettings();
    await inspected.env.prepareForest();
    const began=performance.now();
    const ok=await app.startRun({species:4,biome:'forest',tier:0,boosts:[],mode:'standard'});
    if(!ok)throw Error('Entry failed');
    loadProbe.entryMs=performance.now()-began;
    const run=app.run,proto=Object.getPrototypeOf(run),build=proto.buildStage;
    proto.buildStage=function(...args){const start=performance.now(),result=build.apply(this,args);loadProbe.builds.push({stage:this.stage,ms:performance.now()-start});return result;};
    run.godMode=true;run.pendingLevels=0;run.queueLevelUp=()=>{};
  });
  const stages=[];
  async function snapshot(){
    await page.waitForFunction(()=>app.run&&app.run.state!=='transition'&&[...app.run.sprites.batches.values()].every(b=>b.ready),{timeout:45000});
    await sleep(700);
    return page.evaluate(()=>{
      const r=app.run,batches=[...r.sprites.batches.values()],t=r.terrain;
      return {stage:r.stage,actors:batches.length,glyphs:batches.filter(b=>b.zxGlyph).length,
        legacyImages:batches.filter(b=>b.url).length,estimatedActorBytes:batches.reduce((n,b)=>n+b.bytes,0),
        feet:Object.fromEntries(batches.map(b=>[b.sid,b.foot])),textures:t.textures.map(t=>t.uuid),
        colliders:t.colliders.length,props:t.zxProps.length,terrainBatches:t.group.children.length,
        readbacks:loadProbe.readbacks,rendererMemory:{...app.r.renderer.info.memory}};
    });
  }
  stages.push(await snapshot());
  for(let stage=2;stage<=4;stage++){
    await page.evaluate(async()=>{const r=app.run;r.ui.hideModal();r.state='play';r.enemies.clear();await r.changeZone();});
    stages.push(await snapshot());assert.equal(stages.at(-1).stage,stage);
  }
  await page.screenshot({path:path.join(dir,baseline?'loading-before.png':'loading-after.png')});
  const probe=await page.evaluate(()=>({...loadProbe,locale:inspected.env.locale,storedLocale:localStorage.getItem('pokebonk.web.pokebonk.lang')}));
  const cleanup=await page.evaluate(async()=>{
    const assets=app.run.paperAssets,watched=[...(assets?.textures.values()||[]),...(assets?.mats.values()||[])];let disposed=0;
    for(const asset of watched)asset.addEventListener('dispose',()=>disposed++);
    app.toMenu();const menuEmpty=!app.menuScene?.terrain&&!app.menuScene?.title;
    await app.startRun({species:7,biome:'forest',tier:0,boosts:[],mode:'standard'});app.run.godMode=true;app.run.queueLevelUp=()=>{};
    return {watched:watched.length,disposed,menuEmpty};
  });
  const restart=await snapshot();
  const report={environment:'Chrome / software WebGL / local WeChat fixture; not iPhone timings',...probe,stages,restart,cleanup};
  fs.writeFileSync(path.join(dir,baseline?'loading-before.json':'loading-after.json'),JSON.stringify(report,null,2));
  if(!baseline){
    assert.equal(probe.locale,'zh');
    assert.equal(probe.storedLocale,'zh','Old non-Chinese preferences must migrate');
    assert.equal(cleanup.disposed,cleanup.watched);assert.ok(cleanup.menuEmpty);
    assert.deepEqual(probe.requests.filter(p=>/assets\/(?:cries|pmd(?:-shiny)?)\//.test(p)),[],'Glyph actors must not request old animation sheets or cries');
    for(const s of [...stages,restart]){assert.equal(s.legacyImages,0);assert.equal(s.glyphs,s.actors);assert.ok(s.estimatedActorBytes<12*1048576);assert.ok(s.colliders>500&&s.props>10);}
    assert.ok(stages[1].textures.filter(id=>stages[0].textures.includes(id)).length>=10,'Area changes must reuse the paper textures');
    const before=path.join(dir,'loading-before.json');
    if(fs.existsSync(before)){
      const previous=JSON.parse(fs.readFileSync(before));
      for(let i=0;i<4;i++){
        assert.equal(stages[i].colliders,previous.stages[i].colliders,'World collider count changed');
        assert.equal(stages[i].props,previous.stages[i].props,'World props changed');
        for(const [id,foot] of Object.entries(stages[i].feet))if(previous.stages[i].feet[id])assert.deepEqual(foot,previous.stages[i].feet[id],'Actor collision dimensions changed: '+id);
      }
    }
  }
  console.log('Loading verification',JSON.stringify({entryMs:report.entryMs,builds:probe.builds,stages:stages.map(({stage,actors,legacyImages,estimatedActorBytes,readbacks})=>({stage,actors,legacyImages,estimatedActorBytes,readbacks}))}));
}
