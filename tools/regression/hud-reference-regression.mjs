import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewHudReference(page,dir){
  fs.mkdirSync(dir,{recursive:true});
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(()=>{
    window.dispatchEvent(new Event('resize'));
    const r=app.run;app.halted=true;r.state='play';r.godMode=true;
    r.ui.endCinematic();r.ui.clearWorldNotices?.();r.ui.bigBanners=true;
    r.enemies.clear();r.vfx.clear();r.timers.length=0;r.anims.length=0;
    r.capture.state='done';r.capture.index=-1;
    r.performance={...r.performance,hudInterval:0};
    r.meta.profile.settings.reduceFlashes=true;r.mapEvents.update(0);
    window.hudReview={r,
      frame(){r.updateCamera(0);r.renderWorld(0);r.ui.hud(r);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);},
      clearWeather(){r.events.end(true);r.mapEvents.clear();r.weatherT=0;r.weather=r.baseWeather;},
      rect(el){const b=el.getBoundingClientRect(),v=inspected.env.entryViewport();return {left:b.left+v.x,top:b.top+v.y,right:b.right+v.x,bottom:b.bottom+v.y,width:b.width,height:b.height};},
      weather(){const el=r.ui.els.event;return {visible:el.style.display!=='none',label:el.getAttribute('aria-label'),clock:el.querySelector('.zx-weather-time').dataset.frame,fill:el.querySelector('.zx-weather-fill').style.width};},
    };
    hudReview.frame();
  });
  const report={weather:[],sizes:[],boss:[],arrivals:[]};
  const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  for(const kind of ['storm','fog','blizzard','spout']){
    const result=await page.evaluate(kind=>{
      const h=hudReview,r=h.r;h.clearWeather();
      if(kind==='storm'||kind==='fog')r.events.start(kind);else r.mapEvents.start(kind);
      h.frame();const start=h.weather();
      const advance=dt=>{r.time+=dt;r.events.update(dt);r.mapEvents.update(dt);h.frame();return h.weather();};
      return {kind,start,half:advance(7.5),last:advance(7.49),end:advance(.02)};
    },kind);
    assert.equal(result.start.clock,'15秒');assert.equal(result.start.fill,'100%');
    assert.equal(result.half.clock,'8秒');assert.equal(result.half.fill,'50%');
    assert.equal(result.last.clock,'1秒');assert.equal(result.end.visible,false);
    report.weather.push(result);
  }
  report.temporary=await page.evaluate(()=>{
    const h=hudReview,r=h.r;h.clearWeather();r.setWeather('rain');h.frame();const start=h.weather();
    r.weatherT=7.5;h.frame();const half=h.weather();
    r.weatherT=.01;r.update(.02);h.frame();return {start,half,end:h.weather(),restored:r.weather===r.baseWeather};
  });
  assert.equal(report.temporary.start.clock,'15秒');assert.equal(report.temporary.half.fill,'50%');
  assert.equal(report.temporary.end.visible,false);assert.ok(report.temporary.restored);

  // Use the real encounter entry points. Two spawns in one frame must each
  // receive their full banner, without changing the combat state.
  const spawned=await page.evaluate(()=>{
    const h=hudReview,r=h.r;h.clearWeather();r.enemies.clear();r.minibosses.list.length=0;
    // Keep banner age deterministic while SwiftShader renders screenshots.
    h.realNow=performance.now.bind(performance);h.now=h.realNow();performance.now=()=>h.now;
    const p=r.player.pos;
    const totem=r.minibosses.spawnTotem(3,{x:p.x+5,z:p.z-3});
    const summoner=r.minibosses.spawnSummoner(9,{x:p.x-5,z:p.z-3});
    h.frame();return {totem,summoner};
  });
  assert.deepEqual(spawned,{totem:true,summoner:true});
  for(const kind of ['totem','summoner']){
    await page.waitForFunction(kind=>inspected.doc.querySelector('.zx-review-arrival')?.dataset.kind===kind,{timeout:8000},kind);
    await page.evaluate(()=>{hudReview.now+=320;});
    await new Promise(resolve=>setTimeout(resolve,80));
    const arrival=await page.evaluate(()=>{
      hudReview.frame();const el=inspected.doc.querySelector('.zx-review-arrival');
      return {kind:el.dataset.kind,label:el.getAttribute('aria-label'),state:app.run.state,rect:hudReview.rect(el),layer:el.dataset.uiLayer,
        bars:app.run.ui.minis.filter(mini=>mini.el.style.display!=='none').map(mini=>({bar:hudReview.rect(mini.bar),badge:hudReview.rect(mini.pt),name:hudReview.rect(mini.name)}))};
    });
    assert.equal(arrival.kind,kind);assert.equal(arrival.state,'play');
    assert.match(arrival.label,kind==='totem'?/^霸主来袭/:/^召唤者来袭/);
    for(const mini of arrival.bars){assert.ok(mini.bar.left>mini.badge.right);assert.equal(mini.bar.left,mini.name.left);}
    assert.equal(arrival.layer,'boss-arrival');report.arrivals.push(arrival);
    await page.screenshot({path:path.join(dir,kind==='totem'?'霸主出场.png':'召唤者出场.png')});
    await page.evaluate(()=>{hudReview.now+=1401;});
  }
  await page.waitForFunction(()=>!inspected.doc.querySelector('.zx-review-arrival'),{timeout:8000});
  await page.evaluate(()=>{performance.now=hudReview.realNow;});
  await page.evaluate(async()=>{
    const h=hudReview,r=h.r;h.clearWeather();r.minibosses.list.length=0;r.enemies.clear();r.vfx.clear();
    r.introBoss=()=>{};r.boss.spawn(149,r.player.pos.x+5,r.player.pos.z-4,false,{hp:10000});
    r.state='play';r.ui.endCinematic();r.time=8;r.stageTime=352;r.gold=12000;r.stats.kills=1999;
    r.player.level=32;r.player.xp=r.player.xpNext*.83;
    // Settle the normal level animation before comparing the two-digit layout.
    const realNow=performance.now.bind(performance);let now=realNow()-10000;performance.now=()=>now;
    for(let i=0;i<96;i++){now+=100;r.ui.hud(r);}performance.now=realNow;
    await r.sprites.prepareGlyphTextures(app.r.renderer);h.frame();
  });
  for(const [width,height] of [[320,568],[375,812],[390,844],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:1});
    for(const kind of ['storm','fog']){
      const sample=await page.evaluate(kind=>{
        window.dispatchEvent(new Event('resize'));
        const h=hudReview,r=h.r;h.clearWeather();r.events.start(kind);r.events.left=7.5;
        r.enemies.hp[r.boss.bossIndex]=r.enemies.maxHp[r.boss.bossIndex]*.638;r.ui.bossLag=.638;h.frame();
        const doc=inspected.doc,event=r.ui.els.event;
        return {event:h.rect(event),canvas:h.rect(event.querySelector('.zx-weather-time')),map:h.rect(r.ui.minimap),
          boss:h.rect(r.ui.els.boss),clock:h.rect(doc.querySelector('.zx-map-clock')),profile:h.rect(doc.querySelector('.zx-profile-art')),
          caption:h.rect(doc.querySelector('.zx-stage-caption')),weather:h.weather(),
          bar:h.rect(r.ui.els.bossBar),badge:h.rect(r.ui.els.bossPt),name:h.rect(r.ui.els.bossName)};
      },kind);
      assert.ok(sample.canvas.width>0&&sample.canvas.height>0);
      for(const other of ['map','boss','clock'])assert.ok(!overlap(sample.event,sample[other]),JSON.stringify({width,kind,other,sample}));
      assert.ok(sample.event.left>=0&&sample.event.right<=width,JSON.stringify({width,kind,sample}));
      assert.ok(sample.profile.top>=sample.caption.bottom&&sample.profile.top-sample.caption.bottom<=8);
      assert.ok(sample.bar.left>sample.badge.right,'Health must stay beside the yellow portrait');
      assert.equal(sample.bar.left,sample.name.left,'The health track starts under the boss name');
      assert.ok(sample.bar.right<=sample.boss.right);
      report.sizes.push({width,height,kind,...sample});
      await page.screenshot({path:path.join(dir,`顶部-${width}-${kind}.png`),clip:{x:0,y:20,width,height:250}});
    }
  }
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  let barTop;
  for(const fraction of [1,.638,.5,.01,0]){
    const sample=await page.evaluate(fraction=>{
      window.dispatchEvent(new Event('resize'));
      const h=hudReview,r=h.r;h.clearWeather();r.events.start('storm');r.events.left=7.5;
      r.ui.bossLag=fraction;r.enemies.hp[r.boss.bossIndex]=r.enemies.maxHp[r.boss.bossIndex]*fraction;h.frame();
      const el=r.ui.els.bossBar;
      return {fraction,label:el.lastElementChild.textContent,fill:el.children[1].style.transform,bar:h.rect(el),card:h.rect(r.ui.els.boss),
        filled:h.rect(el.children[1]),badge:h.rect(r.ui.els.bossPt),name:h.rect(r.ui.els.bossName),body:h.rect(el.parentElement),percent:h.rect(el.lastElementChild)};
    },fraction);
    assert.equal(sample.label,(fraction*100).toFixed(1)+'%');assert.equal(sample.fill,`scaleX(${fraction})`);
    assert.ok(sample.bar.left>sample.badge.right,JSON.stringify(sample));
    assert.equal(sample.bar.left,sample.name.left);
    assert.ok(sample.bar.right<=sample.body.right&&sample.percent.bottom<=sample.bar.top,JSON.stringify(sample));
    assert.ok(Math.abs(sample.filled.width-sample.bar.width*fraction)<1,JSON.stringify(sample));
    if(barTop!==undefined)assert.equal(sample.bar.top,barTop);barTop=sample.bar.top;
    report.boss.push(sample);
    if(fraction===.638)await page.screenshot({path:path.join(dir,'顶部细节效果.png'),clip:{x:0,y:20,width:390,height:225}});
  }
  fs.writeFileSync(path.join(dir,'hud-reference-report.json'),JSON.stringify(report,null,2));
  console.log('HUD reference: 4 weather lifecycles, temporary weather, 8 phone layouts, 5 health levels and both queued arrivals passed.');
}
