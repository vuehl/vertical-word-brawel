import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

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
      frame(force=true){r.updateCamera(0);r.renderWorld(0);r.ui.hud(r);app.r.render(0);if(force)inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);},
      clearWeather(){r.events.end(true);r.mapEvents.clear();r.weatherT=0;r.weather=r.baseWeather;},
      rect(el){const b=el.getBoundingClientRect(),v=inspected.env.entryViewport();return {left:b.left+v.x,top:b.top+v.y,right:b.right+v.x,bottom:b.bottom+v.y,width:b.width,height:b.height};},
      weather(){
        const el=r.ui.els.event,canvas=el.querySelector('.zx-weather-time'),ctx=canvas.getContext('2d');
        // Sample above the lettering to verify that the colored background
        // retreats left while the icon and numeric countdown stay visible.
        const background=[16,Math.floor(canvas.width/2),canvas.width-16].map(x=>Array.from(ctx.getImageData(x,4,1,1).data));
        return {visible:el.style.display!=='none',label:el.getAttribute('aria-label'),clock:canvas.dataset.frame,
          progressBars:el.querySelectorAll('.zx-weather-fill').length,background};
      },
    };
    hudReview.frame();
  });
  const report={weather:[],sizes:[],boss:[],arrivals:[],pause:[]};
  const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  for(const kind of ['storm','fog','blizzard','spout']){
    const result=await page.evaluate(kind=>{
      const h=hudReview,r=h.r;h.clearWeather();
      if(kind==='storm'||kind==='fog')r.events.start(kind);else r.mapEvents.start(kind);
      h.frame();const start=h.weather();
      const advance=dt=>{r.time+=dt;r.events.update(dt);r.mapEvents.update(dt);h.frame();return h.weather();};
      return {kind,start,half:advance(7.5),last:advance(7.49),end:advance(.02)};
    },kind);
    assert.equal(result.start.clock,'15秒');assert.equal(result.start.progressBars,0);
    assert.equal(result.half.clock,'8秒');
    assert.ok(result.start.background[0].every((value,i)=>Math.abs(value-result.half.background[0][i])<=2),
      'The filled side keeps its weather color, allowing canvas channel rounding');
    assert.notDeepEqual(result.start.background[2],result.half.background[2]);
    assert.notDeepEqual(result.half.background[0],result.last.background[0]);
    assert.deepEqual(result.half.background[2],result.last.background[2]);
    for(const pixel of result.last.background)assert.equal(pixel[3],255,'Dark paper remains behind the countdown');
    assert.equal(result.last.clock,'1秒');assert.equal(result.end.visible,false);
    report.weather.push(result);
  }
  report.temporary=await page.evaluate(()=>{
    const h=hudReview,r=h.r;h.clearWeather();r.setWeather('rain');h.frame();const start=h.weather();
    r.weatherT=7.5;h.frame();const half=h.weather();
    r.weatherT=.01;r.update(.02);h.frame();return {start,half,end:h.weather(),restored:r.weather===r.baseWeather};
  });
  assert.equal(report.temporary.start.clock,'15秒');assert.equal(report.temporary.half.clock,'8秒');
  assert.equal(report.temporary.start.progressBars,0);
  assert.notDeepEqual(report.temporary.start.background[2],report.temporary.half.background[2]);
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
      assert.equal(sample.canvas.width,sample.event.width,'The weather artwork fills the whole label');
      const available=sample.map.left-sample.clock.right-4-8;
      assert.equal(sample.event.width,Math.min(116,available),'Weather fills its lane up to the preferred width');
      assert.equal(sample.event.left-sample.clock.right,4);
      assert.equal(sample.event.top,sample.clock.top);
      assert.equal(sample.canvas.height,29);
      for(const other of ['map','boss','clock'])assert.ok(!overlap(sample.event,sample[other]),JSON.stringify({width,kind,other,sample}));
      assert.ok(sample.event.left>=0&&sample.event.right<=width,JSON.stringify({width,kind,sample}));
      assert.ok(sample.profile.top>=sample.caption.bottom&&sample.profile.top-sample.caption.bottom<=8);
      assert.ok(sample.bar.left>sample.badge.right,'Health must stay beside the yellow portrait');
      assert.equal(sample.bar.left,sample.name.left,'The health track starts under the boss name');
      assert.ok(sample.bar.right<=sample.boss.right);
      report.sizes.push({width,height,kind,...sample});
      await page.screenshot({path:path.join(dir,`顶部-${width}-${kind}.png`),clip:{x:0,y:20,width,height:250}});
    }
    const pause=await page.evaluate(()=>{
      const h=hudReview,r=h.r,doc=inspected.doc;
      h.frame();
      const button=doc.querySelector('.zx-hud-pause'),icon=button.querySelector('.zx-pause-print');
      const target=icon.getBoundingClientRect(),screen=doc.getElementById('game').getBoundingClientRect();
      const x=target.left+target.width/2,y=target.top+target.height/2;
      const hit=button.contains(inspected.layout.hit(x,y));
      window.tap(x-screen.left,y-screen.top);
      const paused=r.state,menu=Boolean(doc.querySelector('[data-action="pause-resume"]'));
      const result={button:h.rect(button),icon:h.rect(icon),hit,paused,menu};
      r.resume();h.frame();return {...result,resumed:r.state};
    });
    assert.ok(pause.button.width>=44&&pause.button.height>=44);
    assert.equal(pause.icon.width,32);assert.equal(pause.icon.height,29);
    assert.ok(pause.hit&&pause.menu);assert.equal(pause.paused,'paused');assert.equal(pause.resumed,'play');
    report.pause.push({width,...pause});
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
  // Record the normal cached compositor, without forcing UI invalidation.
  // Verify the final screen pixels as well as the source canvas countdown.
  await page.evaluate(()=>{
    const h=hudReview,r=h.r;h.clearWeather();r.events.start('storm');
    r.ui.bossLag=.638;r.enemies.hp[r.boss.bossIndex]=r.enemies.maxHp[r.boss.bossIndex]*.638;
    h.frame();
  });
  const frames=[],clip={x:0,y:20,width:390,height:225};report.weatherPlayback=[];
  for(let frame=0;frame<=30;frame++){
    await new Promise(resolve=>setTimeout(resolve,100));
    const sample=await page.evaluate(frame=>{
      const h=hudReview,r=h.r;
      if(frame){r.time+=.5;r.events.update(.5);}
      h.frame(false);
      return {...h.weather(),rect:h.rect(r.ui.els.event)};
    },frame);
    if(frame<30){assert.ok(sample.visible);assert.equal(sample.clock,Math.ceil(15-frame/2)+'秒');}
    else assert.equal(sample.visible,false);
    const png=await page.screenshot({clip});
    const raw=await sharp(png).removeAlpha().raw().toBuffer();frames.push(raw);
    if(sample.visible){
      const y=Math.round(sample.rect.top-clip.y+2),left=Math.ceil(sample.rect.left+5),right=Math.floor(sample.rect.right-5);
      sample.coloredPixels=0;
      for(let x=left;x<right;x++){
        const p=(y*clip.width+x)*3;
        if(Math.abs(raw[p]-48)+Math.abs(raw[p+1]-43)+Math.abs(raw[p+2]-52)>12)sample.coloredPixels++;
      }
    }
    report.weatherPlayback.push({seconds:15-frame/2,...sample});
    if([0,15,28].includes(frame))fs.writeFileSync(path.join(dir,'天气-'+sample.clock+'.png'),png);
  }
  const playback=report.weatherPlayback;
  assert.ok(playback[0].coloredPixels>playback[15].coloredPixels&&playback[15].coloredPixels>playback[28].coloredPixels,
    'The rendered weather background must shrink with the displayed countdown');
  for(let frame=1;frame<30;frame++)assert.ok(playback[frame].coloredPixels<=playback[frame-1].coloredPixels,
    'Cached screen pixels must never move the countdown background backwards');
  await sharp(Buffer.concat(frames),{raw:{width:clip.width,height:clip.height*frames.length,channels:3,pageHeight:clip.height}})
    .gif({delay:500,loop:0,effort:3,dither:.2}).toFile(path.join(dir,'天气倒计时与背景消退.gif'));
  fs.writeFileSync(path.join(dir,'hud-reference-report.json'),JSON.stringify(report,null,2));
  console.log('HUD reference: numeric countdowns and receding weather backgrounds through 4 lifecycles and temporary weather, 31 cached screen frames, 8 phone layouts, 4 pause touch targets, 5 health levels and both queued arrivals passed.');
}
