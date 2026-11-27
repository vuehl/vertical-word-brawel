import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewMemorySoak(page,dir){
  const report=await page.evaluate(async()=>{
    const run=app.run,renderer=app.r.renderer,env=inspected.env;
    app.halted=true;run.godMode=true;run.player.hp=run.player.maxHp=1e9;
    run.queueLevelUp=()=>{};run.nextEvo=null;
    // Keep player-driven modal encounters out of the continuous battle sample.
    // Enemy waves, attacks, projectiles, pickups, effects and HUD remain active.
    run.interactables.update=run.capture.update=run.events.update=()=>{};
    run.capture.state='done';
    const samples=[];
    for(let block=0;block<6;block++){
      for(let frame=0;frame<900;frame++){
        run.update(1/30);
        if(frame%30===0){app.r.render(0);env.drawUI(renderer);await new Promise(resolve=>setTimeout(resolve,0));}
      }
      samples.push({seconds:run.stageTime,state:run.state,enemies:run.enemies.count,
        textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries,
        programs:renderer.info.programs.length,gcs:window.fixtureGCs||0});
    }
    const before=window.fixtureGCs||0;
    fixtureMemoryWarning({level:15});fixtureMemoryWarning({level:15});
    app.r.render(0);env.drawUI(renderer);
    return {environment:'WeChat build in Chrome SwiftShader with iOS API fixtures; 180 seconds of simulated combat, not physical iPhone memory.',
      openingRequests:[...window.openingRequests],samples,gcFromWarnings:(window.fixtureGCs||0)-before,glError:renderer.getContext().getError()};
  });
  assert.deepEqual(report.openingRequests,[]);
  assert.ok(report.samples.at(-1).seconds>=179);
  assert.ok(report.samples.every(sample=>sample.state==='play'&&sample.gcs>=1));
  const steady=report.samples.slice(2);
  assert.ok(Math.max(...steady.map(s=>s.textures))-Math.min(...steady.map(s=>s.textures))<=8,'Resident textures stay bounded after warmup');
  assert.ok(report.gcFromWarnings<=1);assert.equal(report.glError,0);
  fs.writeFileSync(path.join(dir,'memory-soak.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
