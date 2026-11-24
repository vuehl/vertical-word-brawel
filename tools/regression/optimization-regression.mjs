import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Render the compiled native package, including its Canvas UI compositor.
// Workload/visual checks only: SwiftShader results are not phone FPS.
export async function reviewOptimizations(page,dir){
  const report={environment:'Compiled WeChat package / Chrome SwiftShader; not phone FPS.',hud:[]};
  await page.evaluate(()=>{
    const run=app.run;app.meta.profile.settings.quality='low';app.applySettings();
    run.director.update=()=>{};run.capture.state='done';run.enemies.clear();
    run.ui.hudEl.querySelectorAll('.banner').forEach(el=>el.remove());
    run.time=120;run.ui.hud(run);run.renderWorld(0);run.vfx.update(0);
    app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    window.readScreen=()=>{const gl=app.r.renderer.getContext(),data=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,data);return data;};
    window.comparePixels=(a,b)=>{let sum=0,changed=0;for(let i=0;i<a.length;i+=4){let d=0;for(let k=0;k<3;k++)d+=Math.abs(a[i+k]-b[i+k]);sum+=d;if(d>30)changed++;}return {mean:sum/(a.length/4*3),changedFraction:changed/(a.length/4)};};
  });
  await new Promise(resolve=>setTimeout(resolve,500));
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:3});
    await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
    const data=await page.evaluate(async()=>{
      const run=app.run,r=app.r,env=inspected.env;
      const realNow=env.performance.now.bind(env.performance);let now=Math.max(realNow(),window.hudTestClock||0)+5000;env.performance.now=()=>now;
      run.ui.hud(run);r.render(0);env.invalidateUI();env.drawUI(r.renderer);
      await new Promise(resolve=>setTimeout(resolve,100));now+=120;run.ui.hud(run);env.drawUI(r.renderer);
      const layout=inspected.layout;
      let full=0,local=0;const refresh=layout.refresh,sub=layout.refreshSubtree;
      layout.refresh=function(...args){full++;return refresh.apply(this,args);};
      layout.refreshSubtree=function(...args){local++;return sub.apply(this,args);};
      const before={uploads:auditUIUploads,bytes:auditUploadBytes};
      try{
        for(let i=0;i<30;i++){
          now+=120;run.time=120+i;run.gold=99970+i;run.stats.kills=99970+i;run.ult.charge=(i+1)/31;
          run.ui.hud(run);env.drawUI(r.renderer);
        }
        r.render(0);env.drawUI(r.renderer);window.tileScreen=readScreen();
        return {fullLayouts:full,localLayouts:local,fullUploads:auditUIUploads-before.uploads,uploadBytes:auditUploadBytes-before.bytes,
          fullFrameBytes:inspected.uiCanvas.width*inspected.uiCanvas.height*4*30,
          tiles:inspected.hudLayers.map(l=>l.canvas&&[l.canvas.width,l.canvas.height]),
          labels:[...inspected.doc.querySelectorAll('.zx-hud-counters,.zx-hud-meta')].map(e=>e.textContent)};
      }finally{window.hudTestClock=now;layout.refresh=refresh;layout.refreshSubtree=sub;env.performance.now=realNow;}
    });
    await page.screenshot({path:path.join(dir,`hud-tiles-${width}.png`)});
    data.visual=await page.evaluate(()=>{
      window.tileNodes=[...inspected.doc.querySelectorAll('[data-ui-layer]')].filter(e=>['counters','score','ultimate','skills','items'].includes(e.dataset.uiLayer)).map(e=>[e,e.dataset.uiLayer]);
      for(const [el] of tileNodes)el.removeAttribute('data-ui-layer');
      app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
      return comparePixels(tileScreen,readScreen());
    });
    await page.screenshot({path:path.join(dir,`hud-full-reference-${width}.png`)});
    await page.evaluate(()=>{for(const [el,id] of tileNodes)el.dataset.uiLayer=id;inspected.env.invalidateUI();app.r.render(0);inspected.env.drawUI(app.r.renderer);});
    report.hud.push({width,height,...data});
    console.log('HUD',width,JSON.stringify(data));
    fs.writeFileSync(path.join(dir,'optimization-regression.json'),JSON.stringify(report,null,2));
    assert.equal(data.fullLayouts,0,'Counters/score/charge should not lay out the full screen');
    assert.equal(data.fullUploads,0,'Counters/score/charge should not upload the full screen');
    assert.ok(data.localLayouts>=80);
    assert.ok(data.uploadBytes<data.fullFrameBytes*.2);
    assert.ok(data.visual.changedFraction<.01,'Local layout differs visibly from full layout');
  }
  report.skills=await page.evaluate(async()=>{
    const run=app.run,env=inspected.env,r=app.r,now=env.performance.now.bind(env.performance);
    let clock=(window.hudTestClock||now())+5000;env.performance.now=()=>clock;
    try{
      run.ui.hud(run);r.render(0);env.drawUI(r.renderer);await new Promise(resolve=>setTimeout(resolve,100));env.drawUI(r.renderer);
      const original=inspected.doc.querySelector('[data-skill-slot="0"] img'),uploads=auditUIUploads;
      run.player.moves[0].level=2;run.player.items.set('leftovers',2);clock+=120;
      run.ui.hud(run);env.drawUI(r.renderer);
      await new Promise(resolve=>setTimeout(resolve,200));clock+=300;r.render(0);env.drawUI(r.renderer);
      return {fullUploads:auditUIUploads-uploads,reused:original===inspected.doc.querySelector('[data-skill-slot="0"] img'),
        level:inspected.doc.querySelector('[data-skill-slot="0"]').dataset.level,
        items:[...inspected.doc.querySelectorAll('[data-item]')].map(e=>[e.dataset.item,e.dataset.count]),
        imagesReady:[...inspected.doc.querySelectorAll('[data-ui-layer="skills"] img,[data-ui-layer="items"] img')].every(img=>img.complete)};
    }finally{window.hudTestClock=clock;env.performance.now=now;}
  });
  console.log('Skills',JSON.stringify(report.skills));
  assert.equal(report.skills.fullUploads,0);assert.ok(report.skills.reused&&report.skills.imagesReady);
  assert.equal(report.skills.level,'2');assert.ok(report.skills.items.some(([id,n])=>id==='leftovers'&&n==='2'));
  await page.screenshot({path:path.join(dir,'hud-skills-items.png')});
  report.glyphs=await page.evaluate(async()=>{
    const run=app.run,e=run.enemies,s=run.sprites,r=app.r,p=run.player.pos;
    app.meta.profile.settings.quality='high';app.applySettings();e.clear();
    for(let i=0;i<320;i++){const angle=i*2.39996,d=4+(i%45)*.25;e.spawn([16,17,18,19,20,21,22,23,24,25,26,27,28][i%13],p.x+Math.cos(angle)*d,p.z+Math.sin(angle)*d,1000,1,0);}
    e.grid.build(e.n,e.x,e.z,e.alive,e.radius,e.dying);
    run.renderWorld(0);await Promise.all([...s.batches.values()].map(b=>b.material.uniforms.zxGlyph?.value.userData.ready));run.renderWorld(0);
    const attrs=['aPos','aSize','aUV','aFx','aTint','aLook'];let mismatches=0,speciesDraws=0,pooledDraws=0,instances=0;
    // Exercise the original per-species writer as an independent reference.
    // Only this test allocates source arrays; normal glyph sources stay at 1.
    const sinks=[...s.batches.values()].filter(b=>b.zxGroup).map(b=>[b,b.zxGroup]);
    for(const [b] of sinks)b.zxGroup=null;
    run.renderWorld(0);
    for(const [b,g] of sinks)b.zxGroup=g;
    run.renderWorld(0);
    const rows=(b,count)=>Array.from({length:count},(_,i)=>attrs.flatMap(f=>Array.from(b[f].array.subarray(i*b[f].itemSize,(i+1)*b[f].itemSize))).join(','));
    for(const g of s.glyphGroups.values()){
      if(g.count)pooledDraws++;
      const expected=[];for(const b of g.members){if(b.count)speciesDraws++;expected.push(...rows(b,b.count));}
      const actual=rows(g,g.count);expected.sort();actual.sort();
      if(JSON.stringify(expected)!==JSON.stringify(actual))mismatches++;instances+=g.count;
    }
    const saved=[];r.scene.traverse(o=>{if(o.isMesh){saved.push([o,o.visible]);o.visible=false;}});
    const renderer=r.renderer,info=renderer.info;info.autoReset=false;
    const draw=()=>{info.reset();renderer.render(r.scene,r.camera);return {calls:info.render.calls,triangles:info.render.triangles};};
    try{
      for(const g of s.glyphGroups.values())g.mesh.visible=g.count>0;
      const grouped=draw(),pixels=readScreen();
      for(const g of s.glyphGroups.values())g.mesh.visible=false;
      for(const b of s.batches.values())if(b.zxGlyph){r.scene.add(b.mesh);b.mesh.visible=b.count>0;b.mesh.count=b.count;for(const a of attrs){b[a].clearUpdateRanges();b[a].addUpdateRange(0,b.count*b[a].itemSize);b[a].needsUpdate=true;}}
      const original=draw(),visual=comparePixels(pixels,readScreen());
      return {mismatches,speciesDraws,pooledDraws,instances,grouped,original,visual,gridCells:e.grid.buildCells,fullGridCells:e.grid.counts.length};
    }finally{for(const [b] of sinks){b.mesh.parent?.remove(b.mesh);b.mesh.visible=false;}for(const [o,visible] of saved)o.visible=visible;run.renderWorld(0);r.render(0);run.ui.hud(run);inspected.env.invalidateUI();inspected.env.drawUI(renderer);}
  });
  console.log('Glyphs',JSON.stringify(report.glyphs));
  await page.screenshot({path:path.join(dir,'glyph-batches-320-actors.png')});
  fs.writeFileSync(path.join(dir,'optimization-regression.json'),JSON.stringify(report,null,2));
  assert.equal(report.glyphs.mismatches,0);assert.ok(report.glyphs.grouped.calls<report.glyphs.original.calls);
  assert.equal(report.glyphs.grouped.triangles,report.glyphs.original.triangles);
  assert.ok(report.glyphs.visual.changedFraction<.01);
  report.effects=await page.evaluate(()=>{
    const vfx=app.run.vfx;vfx.clear();
    const p=app.run.player.pos;for(let i=0;i<100;i++)vfx.number(p.x,2,p.z,5,0xffffff,false,111);
    const pending=[...vfx.damagePending.values()].map(v=>v.value),before=vfx.text.items.length;
    vfx.update(.13);return {pending,before,after:vfx.text.items.length};
  });
  assert.deepEqual(report.effects.pending,[500]);assert.equal(report.effects.before,0);assert.equal(report.effects.after,1);
  report.crowd=await page.evaluate(()=>{
    const run=app.run,e=run.enemies,p=run.player.pos,env=inspected.env,now=env.performance.now.bind(env.performance);
    app.meta.profile.settings.quality='low';app.applySettings();e.clear();run.crowdSample=null;
    for(let i=0;i<100;i++)e.spawn(16,p.x+90+(i%5),p.z+90,1,1,0);
    const boss=e.spawn(16,p.x+95,p.z+90,1,1,4),totals=()=>['hp','maxHp','xp','wt'].map(key=>e[key].reduce((sum,v,i)=>sum+(e.alive[i]?v:0),0));
    const before=totals(),rewards=[run.stats.kills,run.gold,run.player.xp];let clock=now()+20000;env.performance.now=()=>clock;
    try{
      for(let i=0;i<=130;i++){clock+=50;run.governHorde();}
      return {fps:run.crowdFps,cap:run.liveCap,count:e.count,mass:e.mass,boss:e.isAlive(boss),before,after:totals(),rewards,afterRewards:[run.stats.kills,run.gold,run.player.xp]};
    }finally{env.performance.now=now;}
  });
  assert.equal(report.crowd.cap,60);assert.equal(report.crowd.count,60);assert.equal(report.crowd.boss,true);
  assert.equal(report.crowd.mass,101);
  assert.ok(report.crowd.before.every((value,i)=>Math.abs(value-report.crowd.after[i])<Math.max(1,value)*1e-6),'HP/XP/weight totals must survive Float32 rounding');
  assert.deepEqual(report.crowd.rewards,report.crowd.afterRewards);
  fs.writeFileSync(path.join(dir,'optimization-regression.json'),JSON.stringify(report,null,2));
  console.log('Optimization checks passed: independent HUD uploads, glyph geometry/pixels, merged damage numbers.');
  return report;
}
