import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewClarity(page,dir){
  const baseline=process.argv.includes('--baseline');
  const report=await page.evaluate(()=>{
    const r=app.r,run=app.run,s=app.meta.profile.settings;
    app.setScreen(null);run.state='play';
    inspected.doc.querySelectorAll('.zx-intro,.run-hint,.banner').forEach(e=>e.remove());
    const state=()=>({dyn:r.dynRes,dynamic:r.quality.dyn,pixelScale:r.pixelScale,world:[r.composer.inputBuffer.width,r.composer.inputBuffer.height],
      ui:[inspected.uiCanvas.width,inspected.uiCanvas.height],bloom:r.bloom.intensity,outline:r.outlinePass.enabled});
    window.clarityFrame=()=>{run.updateCamera(1);run.renderWorld(0);run.vfx.update(0);run.ui.hud(run);r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(r.renderer);};
    Object.assign(s,{quality:'low',batterySaver:false,pixel:0});app.applySettings();r.setDynRes(.6);clarityFrame();
    const low=state();
    s.quality='high';app.applySettings();clarityFrame();const high=state();
    const original=run.sprites.get(run.player.speciesId),tex=original.material.uniforms.zxGlyph.value;
    const glyph={rect:[...original.zxGlyphRect],atlas:[tex.image.width,tex.image.height]};
    return {low,high,glyph};
  });
  await page.screenshot({path:path.join(dir,'battle-high.png')});
  const clip=await page.evaluate(()=>{
    const r=app.run,p=r.player.pos,b=r.ui.project(r,p.x,p.y+1,p.z),screen=inspected.doc.getElementById('game').getBoundingClientRect();
    return {x:Math.max(0,Math.min(innerWidth-130,b.x-screen.x-65)),y:Math.max(0,Math.min(innerHeight-150,b.y-screen.y-85)),width:130,height:150};
  });
  await page.screenshot({path:path.join(dir,'hero-high.png'),clip});
  report.stress=await page.evaluate(()=>{
    const r=app.r,s=app.meta.profile.settings,states=[];
    const state=()=>({dyn:r.dynRes,world:[r.composer.inputBuffer.width,r.composer.inputBuffer.height],pixelScale:r.pixelScale});
    app.dyn={t:0,frames:0,js:0,good:0,wait:8,lastUp:-1e9};delete inspected.env.__dynFps;
    for(let i=0;i<200;i++)app.adaptRes(75,1/12,100000+i*1000/12);
    clarityFrame();states.push({case:'slow-high',...state()});
    s.pixel=3;app.applySettings();clarityFrame();states.push({case:'legacy-pixel',...state()});
    r.setDynRes(.6);clarityFrame();states.push({case:'forced-scale',...state()});
    s.quality='medium';s.pixel=0;app.applySettings();r.setDynRes(1);
    app.dyn={t:0,frames:0,js:0,good:0,wait:8,lastUp:-1e9};
    for(let i=0;i<200;i++)app.adaptRes(75,1/12,200000+i*1000/12);
    clarityFrame();states.push({case:'slow-medium',...state()});
    return states;
  });
  report.selection=await page.evaluate(async()=>{
    const s=app.meta.profile.settings;s.quality='high';s.batterySaver=true;app.applySettings();
    app.run.state='paused';app.zixing.settings(()=>{});
    const click=(selector,label)=>[...inspected.doc.querySelectorAll(selector)].find(e=>e.textContent===label).click();
    click('.zx-tabs.main button','画面');click('.zx-subtab','性能视野');click('.zx-option','精致');
    await app.meta.saveNow();
    const saved=JSON.parse(wx.getFileSystemManager().readFileSync('/userdata/pokebonk-save.json','utf8')).accounts[app.meta.account.id].profile.settings;
    return {saver:s.batterySaver,quality:s.quality,saved:{quality:saved.quality,saver:saved.batterySaver},switch:inspected.doc.querySelector('[aria-label="省电模式"]').getAttribute('aria-checked'),
      profile:app.run.performance.name,dyn:app.r.dynRes,note:inspected.doc.querySelector('.zx-performance-status').textContent};
  });
  if(!baseline){
    assert.equal(report.high.dyn,1);assert.equal(report.high.dynamic,false);
    assert.deepEqual(report.high.world,[780,1688]);
    for(const state of report.stress.slice(0,3)){assert.equal(state.dyn,1);assert.equal(state.pixelScale,1);assert.deepEqual(state.world,report.high.world);}
    assert.ok(report.stress[3].dyn<1,'Balanced still supports adaptive resolution');
    assert.equal(report.selection.saver,false);assert.equal(report.selection.profile,'精致');assert.equal(report.selection.switch,'false');
    assert.deepEqual(report.selection.saved,{quality:'high',saver:false});assert.equal(report.selection.dyn,1);
  }
  fs.writeFileSync(path.join(dir,'clarity-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
