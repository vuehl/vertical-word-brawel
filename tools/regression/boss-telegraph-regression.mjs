import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewBossTelegraphs(page,dir){
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(async()=>{
    const r=app.run,e=r.enemies;
    app.halted=true;r.godMode=true;
    r.director.update=r.events.update=r.minibosses.update=r.player.update=()=>{};
    r.capture.state='done';r.nextCp=1e9;e.clear();
    r.player.pos.set(0,r.terrain.height(0,0),0);
    r.camTarget.copy(r.player.pos);r.updateCamera(1);
    r.introBoss=()=>{};
    r.boss.spawn(149,-8,0,false,{hp:1e6});
    r.boss.t=r.boss.callT=r.boss.moveT=1e6;
    r.timers.length=0;r.anims.length=0;r.state='play';
    r.cine.want=r.cine.blend=0;r.ui.endCinematic();
    await r.sprites.prepareGlyphTextures(app.r.renderer);
    window.teleProbe={r,e,id:r.boss.bossIndex};
    teleProbe.frame=()=>{r.renderWorld(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);};
    teleProbe.step=seconds=>{
      for(let left=seconds;left>1e-9;left-=Math.min(left,1/60))r.update(Math.min(left,1/60));
      teleProbe.frame();
    };
    teleProbe.reset=()=>{r.vfx.clear();r.timers.length=0;r.boss.chargeT=0;r.boss.hold=0;
      e.x[teleProbe.id]=-8;e.z[teleProbe.id]=0;e.y[teleProbe.id]=r.terrain.height(-8,0);
      e.vx[teleProbe.id]=e.vz[teleProbe.id]=e.kx[teleProbe.id]=e.kz[teleProbe.id]=0;};
    teleProbe.frame();
  });
  const report={};
  for(const kind of ['circle','charge','signature']){
    const setup=await page.evaluate(kind=>{
      const {r,e,id,reset,frame}=teleProbe;reset();
      const programsBefore=app.r.renderer.info.programs.length;
      r.vfx.fade=0; // Critical warnings must remain visible with cosmetic effects hidden.
      if(kind==='circle')r.boss.slams(id,0x8a7aff);
      else if(kind==='charge')r.boss.charge(id,false);
      else r.boss.sigCharge(id,0x8a7aff,{},false);
      const mark=r.vfx.danger.active[0];
      teleProbe.mark=mark;teleProbe.duration=mark.duration;
      frame();
      return {count:r.vfx.danger.active.length,duration:mark.duration,
        lane:mark.mesh.material.uniforms.lane.value,width:mark.mesh.material.uniforms.extent.value.y,
        radius:e.radius[id],startX:e.x[id],newPrograms:app.r.renderer.info.programs.length-programsBefore};
    },kind);
    assert.equal(setup.count,kind==='circle'?3:1);
    assert.equal(setup.lane,kind==='circle'?0:1);
    assert.equal(setup.newPrograms,0,'Warning shader is compiled during loading');
    if(kind!=='circle')assert.ok(Math.abs(setup.width-setup.radius-1.3)<1e-6);
    const stages=[];
    for(const [name,step] of [['start',0],['half',.5],['ready',.49],['impact',.01]]){
      const state=await page.evaluate(step=>{
        const {r,e,id,mark,duration}=teleProbe;teleProbe.step(duration*step);
        return {progress:mark.mesh.material.uniforms.progress.value,visible:mark.mesh.visible,
          charge:r.boss.chargeT,x:e.x[id],opacity:mark.mesh.material.uniforms.opacity.value};
      },step);
      stages.push({name,...state});
      if(name!=='impact'){
        assert.equal(state.charge,0,'Charge cannot begin before the warning finishes');
        if(kind!=='circle')assert.ok(Math.abs(state.x-setup.startX)<.001,'Charge origin stays fixed during warning');
      }else{
        assert.equal(state.progress,1);assert.ok(state.visible);
        if(kind!=='circle')assert.ok(state.charge>0,'Full warning starts the charge');
      }
      await page.screenshot({path:path.join(dir,`boss-${kind}-${name}.png`)});
    }
    const paused=await page.evaluate(()=>{
      const {r,mark}=teleProbe;r.state='paused';teleProbe.step(.5);
      const progress=mark.mesh.material.uniforms.progress.value,visible=mark.mesh.visible;
      r.state='play';teleProbe.step(.2);
      return {progress,visible,cleared:!r.vfx.danger.active.length};
    });
    assert.equal(paused.progress,1);assert.ok(paused.visible&&paused.cleared);
    report[kind]={setup,stages,paused};
  }
  report.mini=await page.evaluate(()=>{
    const {r,e,reset}=teleProbe;reset();
    const id=e.spawn(149,-8,6,1e6,1,4096),mini=r.minibosses.make('totem',149,id);
    mini.t=mini.callT=1e6;r.minibosses.list.push(mini);
    r.minibosses.charge(mini);const x=e.x[id],z=e.z[id];
    teleProbe.step(.94);
    const held=Math.abs(e.x[id]-x)<.001&&Math.abs(e.z[id]-z)<.001&&mini.chargeT===0;
    teleProbe.step(.02);
    return {held,started:mini.chargeT>0};
  });
  assert.ok(report.mini.held&&report.mini.started);
  report.altar=await page.evaluate(async()=>{
    const {r,reset}=teleProbe;reset();r.vfx.fade=1;
    const f=r.interactables,a=f.list.find(item=>item.kind==='altar');await a.modelReady;
    r.player.pos.set(a.x+1,a.y,a.z);r.player.vel.set(0,0,0);
    r.camTarget.copy(r.player.pos);r.updateCamera(1);
    for(let i=0;i<6;i++)f.update(.05,.25);
    f.render();teleProbe.frame();
    return {half:a.charge,visible:a.chargeRing.visible,
      sameGeometry:a.chargeRing.geometry===f.dwellRing.geometry,
      sameShader:a.chargeRing.material.fragmentShader===f.dwellRing.material.fragmentShader};
  });
  assert.ok(Math.abs(report.altar.half-.5)<1e-8);
  assert.ok(report.altar.visible&&report.altar.sameGeometry&&report.altar.sameShader);
  await page.screenshot({path:path.join(dir,'altar-half.png')});
  report.altar.completed=await page.evaluate(()=>{
    const {r}=teleProbe,f=r.interactables,a=f.list.find(item=>item.kind==='altar');
    for(let i=0;i<5;i++)f.update(.05,.25);f.update(.05,.24);
    if(a.used)throw Error('Altar completed before 3 seconds');
    f.update(.01,.01);f.render();
    return a.used&&a.charge===1&&a.chargeRing.material.uniforms.dwell.value===1;
  });
  assert.ok(report.altar.completed);
  report.cleanup=await page.evaluate(()=>{
    const {r}=teleProbe,d=r.vfx.danger;
    d.clear();const mesh=d.circle(0,0,0,3,0x8a7aff,1);d.clear();
    const recycled=d.circle(0,0,0,3,0x8a7aff,1)===mesh;
    d.dispose();return {recycled,left:r.r.scene.children.filter(o=>o.name==='enemy-telegraph').length};
  });
  assert.ok(report.cleanup.recycled);assert.equal(report.cleanup.left,0);
  fs.writeFileSync(path.join(dir,'boss-telegraphs.json'),JSON.stringify(report,null,2));
  console.log('Boss warning timing, geometry, pause, cleanup and 3-second altar passed.');
}
