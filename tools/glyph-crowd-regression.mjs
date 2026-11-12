import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';

export async function reviewGlyphCrowd(page,dir){
  const report={};
  report.ring=await page.evaluate(()=>{
    const run=app.run,p=run.player,position=p.pos.clone(),dead=p.dead,ring=run.playerFootRing,material=ring.material;
    const samples=[];let particleSpawns=0;
    const spawn=run.vfx.ground.spawn;
    run.vfx.ground.spawn=function(...args){particleSpawns++;return spawn.apply(this,args);};
    try{
      for(const quality of ['low','medium','high']){
        app.meta.profile.settings.quality=quality;app.applySettings();
        for(const fps of [15,30,60]){
          for(let frame=0;frame<fps;frame++){
            p.pos.x=position.x+frame/fps;p.pos.z=position.z-.5;
            run.sprites.begin(app.r.camera);p.render();run.vfx.update(1/fps);
            if(!ring.visible||ring!==run.playerFootRing||ring.material!==material)throw Error('Foot ring blinked/reallocated');
            if(Math.abs(ring.position.y-run.terrain.surface(p.pos.x,p.pos.z)-.09)>.001)throw Error('Foot ring left the ground');
            if(ring.position.x!==p.pos.x||ring.position.z!==p.pos.z)throw Error('Foot ring did not follow');
          }
          samples.push({quality,fps,visible:ring.visible});
        }
      }
      p.dead=true;p.render();const hiddenWhenDead=!ring.visible;p.dead=false;p.render();
      return {samples,particleSpawns,hiddenWhenDead,restored:ring.visible,hasTimeUniform:Object.keys(material.uniforms).some(k=>/time/i.test(k))};
    }finally{run.vfx.ground.spawn=spawn;p.pos.copy(position);p.dead=dead;p.render();}
  });
  assert.equal(report.ring.particleSpawns,0);assert.ok(report.ring.hiddenWhenDead&&report.ring.restored);assert.equal(report.ring.hasTimeUniform,false);

  report.encounters=[];
  for(const [id,word] of [[4,'炎'],[132,'摹'],[16,'风']]){
    const data=await page.evaluate(async id=>{
      const run=app.run;run.enemies.clear();run.capture.state='done';run.capture.spawnEncounter(id);
      const index=run.capture.index;
      run.enemies.x[index]=run.player.pos.x+3;run.enemies.z[index]=run.player.pos.z-3;
      run.ui.hud(run);run.renderWorld(0);run.vfx.update(0);
      inspected.env.invalidateUI();app.r.render(0);inspected.env.drawUI(app.r.renderer);
      await new Promise(resolve=>setTimeout(resolve,200));
      const banner=inspected.doc.querySelector('.banner'),icon=banner?.querySelector('canvas');
      return {text:banner?.textContent,word:icon?.dataset.glyph,static:icon?.dataset.static,species:run.enemies.species[index],imageSources:[...inspected.doc.querySelectorAll('img')].map(el=>el.getAttribute('src')).filter(s=>/(?:portraits|icons|front|pmd)\/\d+\.png/.test(s||''))};
    },id);
    assert.ok(data.text.includes('字灵「'+word+'」现身'));assert.equal(data.word,word);assert.equal(data.static,'true');assert.equal(data.species,id);assert.deepEqual(data.imageSources,[]);
    report.encounters.push(data);
    await page.screenshot({path:path.join(dir,'glyph-encounter-'+id+'.png')});
  }
  report.map=await page.evaluate(async()=>{
    const run=app.run;run.capture.state='done';run.capture.index=-1;run.enemies.clear();
    run.ui.hudEl.querySelectorAll('.banner').forEach(e=>e.remove());
    run.openMap();run.ui.hud(run);await new Promise(resolve=>setTimeout(resolve,250));
    app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    run.ui.showMapLegend(run);run.ui.hud(run);await new Promise(resolve=>setTimeout(resolve,250));
    inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    const modal=run.ui.modalEl;
    return {text:modal.textContent,glyphs:[...modal.querySelectorAll('canvas[data-glyph]')].map(c=>c.dataset.glyph),legacyLoads:(window.nativeImageLoads||[]).filter(r=>/(?:portraits(?:-shiny)?|icons|front|pmd(?:-shiny)?)\/\d+\.png/.test(r.path)).map(r=>r.path)};
  });
  assert.ok(report.map.glyphs.includes('又')&&report.map.glyphs.includes('春'));
  assert.ok(!/妙蛙种子|小火龙|杰尼龟|喵喵|宝可梦|百变怪/.test(report.map.text));assert.deepEqual(report.map.legacyLoads,[]);
  await page.screenshot({path:path.join(dir,'glyph-map-legend.png')});
  await page.evaluate(()=>app.run.resume());

  report.crowd=await page.evaluate(()=>{
    const run=app.run,enemies=run.enemies,grid=enemies.grid,p=run.player,position=p.pos.clone(),hp=p.hp,maxHp=p.maxHp;
    app.meta.profile.settings.quality='low';app.applySettings();enemies.clear();
    p.hp=p.maxHp=1e9;
    for(let i=0;i<600;i++){
      const a=i*2.4,d=(i%19)/10;
      // Ordinary spawns bypass the director's weighted horde budget, allowing
      // a deterministic 600-actor stress scene without changing production caps.
      enemies.spawn([16,19,21][i%3],p.pos.x+8+Math.cos(a)*d,p.pos.z+Math.sin(a)*d,1000,1,0);
    }
    grid.build(enemies.n,enemies.x,enemies.z,enemies.alive,enemies.radius,enemies.dying);
    const queried=grid.query(p.pos.x+8,p.pos.z,5);
    for(let i=0;i<enemies.n;i++)if(enemies.alive[i])grid.separate(i,enemies.x[i],enemies.z[i],enemies.radius[i],64);
    const candidates=grid.separationCandidates,visits=grid.separationVisits;
    for(let frame=0;frame<90;frame++)enemies.update(1/60);
    let finite=true,maxDistance=0;
    for(let i=0;i<enemies.n;i++)if(enemies.alive[i]){finite&&=Number.isFinite(enemies.x[i]+enemies.y[i]+enemies.z[i]);maxDistance=Math.max(maxDistance,Math.hypot(enemies.x[i]-position.x,enemies.z[i]-position.z));}
    p.hp=hp;p.maxHp=maxHp;p.pos.copy(position);
    run.updateCamera(1);run.renderWorld(0);run.vfx.update(0);app.r.render(0);run.ui.hud(run);inspected.env.drawUI(app.r.renderer);
    return {count:enemies.count,queried,candidates,visits,saved:1-visits/candidates,finite,maxDistance,state:run.state};
  });
  fs.writeFileSync(path.join(dir,'glyph-crowd.json'),JSON.stringify(report,null,2));
  assert.equal(report.crowd.count,600);assert.equal(report.crowd.queried,600);assert.ok(report.crowd.visits<=600*64&&report.crowd.saved>.75);
  assert.ok(report.crowd.finite&&report.crowd.maxDistance<45);assert.equal(report.crowd.state,'play');
  await page.screenshot({path:path.join(dir,'controlled-600-enemies.png')});
  return report;
}
