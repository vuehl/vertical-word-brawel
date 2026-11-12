import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Run the real packaged game through entry, every forest area and a restart.
// Desktop timings are diagnostics, never an estimate of iPhone frame rates.
export async function reviewLoading({page,tap,resize,dir,sleep}) {
  const baseline=process.argv.includes('--baseline');
  await page.evaluate(async()=>{
    window.loadProbe={requests:[],readbacks:0,builds:[]};
    loadProbe.homePackages=[...(window.requestedPackages||[])];
    const files=GameGlobal.pokebonk.files;
    for(const key of ['pathFor','resolvePath']){
      const original=files[key];files[key]=function(url,...args){loadProbe.requests.push(String(url));return original.call(this,url,...args);};
    }
    const read=CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData=function(...args){loadProbe.readbacks++;return read.apply(this,args);};
    const account=await app.backend.guest();await app.meta.load(account);
    Object.assign(app.meta.profile.settings,{quality:'low',fpsLimit:30});app.applySettings();
    const prepareAt=performance.now();await inspected.env.prepareForest();
    loadProbe.assetPrepareMs=performance.now()-prepareAt;
    loadProbe.initialResources=JSON.parse(JSON.stringify(files.diagnostics||{}));
    const began=performance.now();
    const ok=await app.startRun({species:4,biome:'forest',tier:0,boosts:[],mode:'standard'});
    if(!ok)throw Error('Entry failed');
    loadProbe.entryMs=performance.now()-began;
    loadProbe.entryMusic=app.run.music;
    loadProbe.entryPackages=[...(window.requestedPackages||[])];
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
      const hiddenImages=[...inspected.doc.querySelectorAll('[data-ui-hidden="true"] img')].filter(img=>img.complete);
      return {stage:r.stage,actors:batches.length,glyphs:batches.filter(b=>b.zxGlyph).length,
        legacyImages:batches.filter(b=>b.url).length,estimatedActorBytes:batches.reduce((n,b)=>n+b.bytes,0),
        feet:Object.fromEntries(batches.map(b=>[b.sid,b.foot])),textures:t.textures.map(t=>t.uuid),
        colliders:t.colliders.length,props:t.zxProps.length,terrainBatches:t.group.children.length,
        readbacks:loadProbe.readbacks,loadingMetrics:r.loadingMetrics,
        hiddenImages:hiddenImages.map(img=>({src:img.src,width:img.naturalWidth,height:img.naturalHeight})),
        hiddenImageBytes:hiddenImages.reduce((sum,img)=>sum+img.naturalWidth*img.naturalHeight*4,0),
        rendererMemory:{...app.r.renderer.info.memory}};
    });
  }
  stages.push(await snapshot());
  for(let stage=2;stage<=4;stage++){
    await page.evaluate(async()=>{const r=app.run;r.ui.hideModal();r.state='play';r.enemies.clear();await r.changeZone();});
    stages.push(await snapshot());assert.equal(stages.at(-1).stage,stage);
  }
  await page.screenshot({path:path.join(dir,baseline?'loading-before.png':'loading-after.png')});
  const probe=await page.evaluate(()=>({...loadProbe,imageLoads:[...(window.nativeImageLoads||[])],locale:inspected.env.locale,storedLocale:localStorage.getItem('pokebonk.web.pokebonk.lang')}));
  const cleanup=await page.evaluate(async()=>{
    const assets=app.run.paperAssets,watched=[...(assets?.textures.values()||[]),...(assets?.mats.values()||[])];let disposed=0;
    for(const asset of watched)asset.addEventListener('dispose',()=>disposed++);
    app.toMenu();const menuEmpty=!app.menuScene?.terrain&&!app.menuScene?.title;
    await app.startRun({species:16,biome:'forest',tier:0,boosts:[],mode:'standard'});app.run.godMode=true;app.run.queueLevelUp=()=>{};
    return {watched:watched.length,disposed,menuEmpty};
  });
  const restart=await snapshot();
  const resources=await page.evaluate(async()=>{
    const files=GameGlobal.pokebonk.files,requestedBeforeAudit=[...window.requestedPackages];
    const ball=await files.resolvePath('assets/models/ball.glb');
    const bytes=wx.getFileSystemManager().readFileSync(ball),view=new DataView(bytes);
    // Even old playback hooks must not download, decode or retry removed music.
    const tracks=[];
    for(const name of ['menu','boss','ingame1','ingame2','ingame3','ingame4']){
      const data=await app.run.audio.preloadTrack(name);
      app.run.audio.playTrack(name);
      tracks.push({name,bytes:data?.byteLength||0});
    }
    const audio=app.run.audio;
    return {requestedBeforeAudit,tracks,music:{enabled:inspected.env.backgroundMusicEnabled,track:audio.track?.name||null,
      loading:!!audio.trackLoading,cached:audio.trackBytes.size,sequencer:!!audio.musicOn},
      requestsAfterAudit:[...loadProbe.requests],packagesAfterAudit:[...window.requestedPackages],
      ball:{magic:view.getUint32(0,true),size:view.getUint32(8,true),bytes:bytes.byteLength}};
  });
  let entryRecovery;
  if(!baseline){
    await page.evaluate(()=>{app.toMenu();});
    await tap('[data-action="journey"]');
    await tap('.zx-footer button','选择关卡');await tap('.zx-footer button','选择难度');
    await page.evaluate(()=>{
      window.restorePrepare=inspected.env.prepareForest;
      inspected.env.prepareForest=async()=>{throw Error('测试：资源读取失败');};
    });
    await tap('[data-action="enter"]');
    await page.waitForFunction(()=>app.screen?.dataset.page==='entry-error');
    assert.match(await page.evaluate(()=>app.screen.textContent),/测试：资源读取失败/);
    assert.equal(await page.evaluate(()=>!!app.run),false);
    await page.screenshot({path:path.join(dir,'entry-retry.png')});
    // A stalled download still shows real progress without loading controls.
    // External navigation must invalidate a late completion of this entry.
    await page.evaluate(()=>{inspected.env.prepareForest=progress=>new Promise(resolve=>{
      window.entryPaintedBeforeResources=!!inspected.layout.box(inspected.doc.querySelector('.zx-loading-percent'));
      window.reportEntryResource=progress;window.releaseEntry=resolve;
    });});
    await tap('[data-action="retry-entry"]');
    await page.waitForFunction(()=>typeof window.releaseEntry==='function');
    assert.ok(await page.evaluate(()=>entryPaintedBeforeResources),'Entry must paint before resource preparation starts');
    await page.evaluate(()=>{
      reportEntryResource({name:'world',phase:'download',completed:50,total:100});
      reportEntryResource({name:'art',phase:'write',completed:3,total:4});
    });
    assert.ok(await page.evaluate(()=>{
      const value=Number(app.screen.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'));
      return value>0&&value<40&&!inspected.doc.querySelector('.zx-dialog');
    }),'Downloads and writes contribute to the same progress bar');
    await sleep(150);
    await page.screenshot({path:path.join(dir,'entry-progress.png')});
    assert.equal(await page.evaluate(()=>app.screen.querySelectorAll('button,.zx-footer').length),0,'Loading has no return button or footer');
    assert.doesNotMatch(await page.evaluate(()=>app.screen.textContent),/已等待|正在下载|正在处理|准备字灵|返回选择/);
    await page.evaluate(()=>app.zixing.difficulty());
    await page.evaluate(()=>releaseEntry());await sleep(100);
    assert.equal(await page.evaluate(()=>app.screen.dataset.page),'difficulty');
    assert.equal(await page.evaluate(()=>!!app.run),false);
    await page.evaluate(()=>{inspected.env.prepareForest=restorePrepare;});
    // Fail after scene allocation to check disposal and the starting guard.
    await page.evaluate(()=>{
      window.loadError=console.error;console.error=(...args)=>{if(String(args[1]?.message).includes('测试：场景构建失败'))return;loadError(...args);};
      window.originalStage=app.r.setSun;let once=true;
      app.r.setSun=function(...args){if(once){once=false;throw Error('测试：场景构建失败');}return originalStage.apply(this,args);};
    });
    await tap('[data-action="enter"]');
    await page.waitForFunction(()=>app.screen?.dataset.page==='entry-error');
    assert.equal(await page.evaluate(()=>!!app.run||app.starting),false);
    await page.evaluate(()=>{app.r.setSun=originalStage;console.error=loadError;});
    // Hold required glyphs after the world is built. The loading page must
    // remain opaque, responsive and below 100%, without running the game clock.
    await page.evaluate(()=>{
      window.holdEntryGlyphs=true;window.entryFrames=[];window.entryWarmFrames=[];
      window.entryAttach=app.zixing.attachRun;
      app.zixing.attachRun=function(run){
        entryAttach(run);const ready=run.sprites.readyCount.bind(run.sprites);
        run.sprites.readyCount=ids=>holdEntryGlyphs?Math.min(ready(ids),Math.floor(ids.length/2)):ready(ids);
      };
      window.entryDraw=inspected.env.drawUI;
      inspected.env.drawUI=function(...args){
        const result=entryDraw(...args);
        if(app.screen?.dataset.page==='entry'){
          const progress=Number(app.screen.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'));
          entryFrames.push({progress,state:app.run?.state,time:app.run?.time||0,popup:!!inspected.doc.querySelector('.zx-dialog,.run-loading')});
        }
        return result;
      };
      window.entryRender=app.r.render;
      app.r.render=function(...args){
        if(app.screen?.dataset.page==='entry')entryWarmFrames.push({progress:Number(app.screen.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')),state:app.run?.state,time:app.run?.time});
        return entryRender.apply(this,args);
      };
    });
    await tap('[data-action="retry-entry"]');
    await page.waitForFunction(()=>app.run&&app.zixing.entryDiagnostics.phases.some(p=>p.phase==='准备字灵')&&Number(app.screen?.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'))>80,{timeout:45000});
    const beforeFrames=await page.evaluate(()=>entryFrames.length);
    await sleep(300);
    assert.ok(await page.evaluate(n=>entryFrames.length>n,beforeFrames),'Loading UI keeps drawing during a stalled glyph load');
    const loadingLayouts=[];
    for(const [width,height] of [[320,568],[390,844],[430,932]]){
      await resize(width,height);await sleep(150);
      await page.waitForFunction(()=>!!inspected.layout.box(app.screen?.querySelector('.zx-loading-title'))&&!!inspected.layout.box(app.screen?.querySelector('.zx-loading-ring')));
      loadingLayouts.push(await page.evaluate(()=>{
        const boxes=Object.fromEntries(['.zx-loading-percent','.zx-loading-progress','.zx-loading-content','.zx-loading-ring'].map(selector=>{
          const b=inspected.layout.box(app.screen.querySelector(selector));return [selector,b&&{x:b.x,y:b.y,w:b.w,h:b.h,clip:b.clip}];
        }));
        const titles=[...app.screen.querySelectorAll('.zx-loading-title')].map(el=>({text:el.textContent,font:inspected.layout.box(el)?.s.font}));
        const ring=app.screen.querySelector('.zx-loading-ring'),ctx=ring.getContext('2d');
        const alphaAt=(x,y)=>ctx.getImageData(x,y,1,1).data[3];
        return {width:inspected.env.innerWidth,height:inspected.env.innerHeight,boxes,titles,text:app.screen.textContent,buttons:app.screen.querySelectorAll('button').length,
          ring:{static:ring.dataset.static,center:alphaAt(200,200),top:alphaAt(200,28),corner:alphaAt(10,10)}};
      }));
      await page.screenshot({path:path.join(dir,'entry-glyphs-'+width+'.png')});
    }
    fs.writeFileSync(path.join(dir,'loading-layouts.json'),JSON.stringify(loadingLayouts,null,2));
    for(const {width,height,boxes} of loadingLayouts)for(const [selector,b] of Object.entries(boxes)){
      assert.ok(b&&b.w>0&&b.h>0&&b.x>=-1&&b.x+b.w<=width+1&&b.y>=-1&&b.y+b.h<=height+1,'Loading content fits: '+selector);
      assert.ok(Math.abs(b.x+b.w/2-width/2)<2,'Loading content is horizontally centered: '+selector);
      if(selector==='.zx-loading-percent')assert.ok(Math.abs(b.y+b.h/2-height/2)<height*.15,'Percentage stays near the screen center');
    }
    for(const layout of loadingLayouts){
      assert.deepEqual(layout.titles.map(t=>t.text),['正在布置场景']);
      assert.ok(layout.titles.every(t=>t.font===24),'Loading title uses a readable size: '+JSON.stringify(layout.titles));
      assert.equal(layout.buttons,0);assert.doesNotMatch(layout.text,/准备字灵|已等待|返回选择/);
      const progress=layout.boxes['.zx-loading-progress'];assert.equal(progress.w,progress.h);
      assert.deepEqual(layout.ring,{static:'true',center:0,top:255,corner:0},'Progress is a cached ring with a transparent center');
    }
    await resize(390,844);
    await page.evaluate(()=>{window.holdEntryGlyphs=false;});
    await page.waitForFunction(()=>app.run?.state==='play',{timeout:45000});
    entryRecovery=await page.evaluate(()=>{
      inspected.env.drawUI=entryDraw;app.r.render=entryRender;app.zixing.attachRun=entryAttach;
      return {...app.zixing.entryDiagnostics,frames:entryFrames,warmFrames:entryWarmFrames,resources:GameGlobal.pokebonk.files.diagnostics};
    });
    entryRecovery.layouts=loadingLayouts;
    assert.equal(entryRecovery.status,'ready');
    assert.ok(entryRecovery.phases.some(p=>p.phase==='绘制桌面与纸张'));
    assert.ok(entryRecovery.phases.some(p=>p.phase==='摆放场景物件'));
    assert.equal(entryRecovery.percentages.at(-1),100);
    for(let i=1;i<entryRecovery.percentages.length;i++)assert.ok(entryRecovery.percentages[i]>=entryRecovery.percentages[i-1],'Entry progress never goes backwards');
    assert.ok(entryRecovery.frames.some(f=>f.progress===100),'Completed percentage is actually painted');
    assert.ok(entryRecovery.frames.every(f=>!f.popup&&f.state!=='play'&&f.time===0),'No character popup, gameplay or elapsed game time while loading');
    assert.ok(entryRecovery.warmFrames.length>0&&entryRecovery.warmFrames.every(f=>f.state==='transition'&&f.time===0&&f.progress<100),'First scene frame is prepared before revealing gameplay');
    assert.equal(await page.evaluate(()=>app.screen),null);
    await page.screenshot({path:path.join(dir,'entry-complete.png')});
  }
  const report={environment:'Chrome / software WebGL / local WeChat fixture; not iPhone timings',...probe,stages,restart,cleanup,entryRecovery,resources};
  fs.writeFileSync(path.join(dir,baseline?'loading-before.json':'loading-after.json'),JSON.stringify(report,null,2));
  if(!baseline){
    assert.equal(probe.locale,'zh');
    assert.equal(probe.storedLocale,'zh','Old non-Chinese preferences must migrate');
    assert.equal(cleanup.disposed,cleanup.watched);assert.ok(cleanup.menuEmpty);
    for(const packs of [probe.homePackages,probe.entryPackages,resources.packagesAfterAudit])
      assert.deepEqual(packs.filter(p=>p==='sound'||p.startsWith('music_')),[],'No screen may download music');
    assert.deepEqual(resources.requestsAfterAudit.filter(p=>/assets\/music\//.test(p)),[],'No music resource request, including old playback hooks');
    assert.deepEqual(resources.music,{enabled:false,track:null,loading:false,cached:0,sequencer:false});
    assert.equal(resources.ball.magic,0x46546c67);assert.equal(resources.ball.size,resources.ball.bytes);
    for(const track of resources.tracks)assert.equal(track.bytes,0,'Removed track must not load: '+track.name);
    assert.equal(probe.initialResources.modelsRestored,0,'Entry must not expand unrequested legacy models');
    for(const s of [...stages,restart]){
      const metric=s.loadingMetrics.at(-1);assert.ok(metric.terrain.yields>0);
      if(s.stage<4)assert.ok(metric.interactions.yields>0);
    }
    assert.deepEqual(probe.requests.filter(p=>/assets\/(?:cries|pmd(?:-shiny)?|portraits(?:-shiny)?|front|icons)\//.test(p)),[],'Glyph actors must not request any excluded image or cry');
    for(const s of [...stages,restart])assert.deepEqual(s.hiddenImages,[],'Hidden legacy HUD images must never be decoded');
    for(const s of [...stages,restart]){assert.equal(s.legacyImages,0);assert.equal(s.glyphs,s.actors);assert.ok(s.estimatedActorBytes<12*1048576);assert.ok(s.colliders>=s.props&&s.colliders<200&&s.props>10);}
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
