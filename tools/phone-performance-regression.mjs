import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function reviewPhonePerformance(page,dir){
  const report={environment:'Compiled WeChat game in Chrome SwiftShader. Shader/clock work counts; not iPhone FPS.'};
  report.warmup=await page.evaluate(async()=>{
    const run=app.run,r=app.r,gl=r.renderer.getContext(),p=run.player.pos;
    inspected.env.__zixingDeveloper?.close();
    app.halted=true;run.director.update=run.director.startFinalSwarm=()=>{};
    run.capture.state='done';run.time=run.stageTime=600;run.enemies.clear();
    for(let i=0;i<200;i++){
      const a=i*2.4,d=2+(i%20)*.14;
      run.enemies.spawn([16,19,21][i%3],p.x+Math.cos(a)*d,p.z+Math.sin(a)*d,1e9,1,0);
    }
    await run.sprites.prepareGlyphTextures(r.renderer);
    const create=gl.createProgram;let created=0;
    gl.createProgram=function(...args){created++;return create.apply(this,args);};
    try{
      run.renderWorld(0);
      const spec={x:p.x+1,y:p.y+1,z:p.z,size:.6,endSize:.8,life:1,color:0xff8844};
      for(const pool of [run.vfx.add,run.vfx.norm,run.vfx.ground,run.vfx.groundN])pool.spawn(spec);
      run.vfx.beams.spawn(p.x,p.y+1,p.z,p.x+3,p.y+1,p.z-1,.3,0xffcc22,1);
      run.vfx.ring(p.x,p.y,p.z,3,0xff8844,1);
      run.vfx.text.spawn(p.x,p.y+2,p.z,'123',0xffffff);
      run.vfx.update(1/60);r.render(0);
      return {programsCreated:created,pools:[run.vfx.add,run.vfx.norm,run.vfx.ground,run.vfx.groundN,run.vfx.beams,run.vfx.rings,run.vfx.text].map(p=>p.mesh.count),enemies:run.enemies.count};
    }finally{gl.createProgram=create;}
  });
  assert.equal(report.warmup.enemies,200);
  assert.ok(report.warmup.pools.every(n=>n>0));
  assert.equal(report.warmup.programsCreated,0,'First use of prepared battle pools must not compile shaders');
  report.glyphClock=await page.evaluate(()=>{
    const run=app.run,r=app.r,perf=inspected.env.performance,original=perf.now;
    let reads=0;perf.now=function(){reads++;return original.call(this);};
    try{
      run.sprites.begin(r.camera);run.enemies.render();reads=0;run.sprites.end();
      return {readsDuringFlush:reads,activeSources:[...run.sprites.batches.values()].filter(b=>b.count>0).length};
    }finally{perf.now=original;}
  });
  assert.ok(report.glyphClock.activeSources>=19);
  assert.equal(report.glyphClock.readsDuringFlush,0);
  report.diagnostics=await page.evaluate(async()=>{
    const api=inspected.env.__zixingDeveloper;if(!api)return null;
    api.options.monitor=true;api.apply({time:600,count:200,mode:'none',boss:'none'});api.close();
    await app.run.sprites.prepareGlyphTextures(app.r.renderer);
    await new Promise(resolve=>setTimeout(resolve,100));
    inspected.env.developerInvalidateUI();
    app.run.renderWorld(0);app.run.ui.hud(app.run);app.r.render(0);inspected.env.drawUI(app.r.renderer);
    const node=inspected.doc.querySelector('#zx-dev-monitor');
    return {rows:[...node.children].map(e=>({text:e.textContent,y:inspected.layout.box(e)?.y})),device:api.snapshot().device};
  });
  if(report.diagnostics){
    const rows=report.diagnostics.rows;assert.equal(rows.length,8);
    assert.ok(rows.every((row,i)=>Number.isFinite(row.y)&&(!i||row.y>rows[i-1].y)));
    assert.match(rows[2].text,/逻辑.*绘制提交/);
  }
  await page.evaluate(()=>{app.r.render(0);inspected.env.drawUI(app.r.renderer);});
  await page.screenshot({path:path.join(dir,'prepared-effects-200.png')});
  fs.writeFileSync(path.join(dir,'phone-performance.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
}
