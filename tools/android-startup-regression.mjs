import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function reviewAndroidStartup(page,dir,baseline=false){
  const report=await page.evaluate(async()=>{
    const run=app.run,r=app.r,renderer=r.renderer,env=inspected.env;
    app.halted=true;run.godMode=true;run.queueLevelUp=()=>{};
    run.player.hp=run.player.maxHp=1e9;
    const rates=[];
    for(const state of ['play','paused','modal','over']){
      run.state=state;rates.push({state,fps:Math.round(1000/realFrameGap())});
    }
    run.state='play';
    const facility=run.interactables.list.find(f=>f.kind==='boss');
    await facility.modelReady;
    run.player.pos.set(facility.x,facility.y,facility.z+5);run.camTarget.copy(run.player.pos);run.updateCamera(1);
    // Keep automatic facility/capture dialogs out of the fixed-step soak.
    // Natural enemy spawning, movement, attacks, drops and HUD remain active.
    run.interactables.update=run.capture.update=run.events.update=()=>{};
    run.nextEvo=null;run.capture.state='done';
    const frames=[],samples=[];
    const render=renderer.render,originalAutoReset=renderer.info.autoReset;
    renderer.info.autoReset=false;
    renderer.render=function(scene,camera){
      const before=renderer.info.render.calls;
      const result=render.call(this,scene,camera);
      frames.push({name:scene.name||scene.children[0]?.material?.name||'scene',objects:scene.children.length,
        calls:renderer.info.render.calls-before});return result;
    };
    try{
      run.update(0);r.render(0);env.drawUI(renderer);
      frames.length=0;renderer.info.reset();r.render(0);
      const passes=frames.splice(0),calls=renderer.info.render.calls;
      for(let block=0;block<6;block++){
        for(let frame=0;frame<600;frame++){
          run.update(1/60);
          if(frame%30===0){r.render(0);env.drawUI(renderer);await new Promise(resolve=>setTimeout(resolve,0));}
        }
        samples.push({seconds:run.stageTime,enemies:run.enemies.count,geometry:renderer.info.memory.geometries,
          textures:renderer.info.memory.textures,programs:renderer.info.programs.length,state:run.state});
        frames.length=0;
      }
      return {platform:env.nativeDevice.platform,rates,world:[r.composer.inputBuffer.width,r.composer.inputBuffer.height],
        passes,calls,samples,error:renderer.getContext().getError()};
    }finally{renderer.render=render;renderer.info.autoReset=originalAutoReset;}
  });
  report.environment='Compiled WeChat game / Chrome SwiftShader. 60 seconds of fixed-step combat with sampled WebGL draws; NOT Android phone FPS.';
  fs.writeFileSync(path.join(dir,'android-startup.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  assert.equal(report.platform,'android');assert.equal(report.error,0);
  assert.ok(report.samples.every(s=>s.state==='play'));
  assert.ok(report.samples.at(-1).seconds>=60);
  assert.ok(Math.max(...report.samples.map(s=>s.textures))-report.samples[0].textures<=2,'Opening combat must not keep allocating textures');
  assert.ok(Math.max(...report.samples.map(s=>s.programs))-report.samples[0].programs<=2,'Opening combat must not keep compiling shaders');
  if(!baseline)assert.ok(report.rates.every(s=>s.fps===60));
}
