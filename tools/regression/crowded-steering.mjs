import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewCrowdedSteering(page,dir,baseline){
  const report=await page.evaluate(async()=>{
    const run=app.run,p=run.player,e=run.enemies,ui=run.ui.touch,renderer=app.r.renderer;
    app.halted=true;
    run.stageTime=run.time=300;
    run.director.update=run.capture.update=run.events.update=()=>{};
    run.nextCp=Infinity;run.nextEvo=null;run.pendingLevels=0;p.level=3;
    p.hp=p.maxHp=1e8;p.iframes=1e6;
    e.clear();
    for(let i=0;i<200;i++){
      const angle=i*2.39996,distance=4+i%24*.7;
      if(e.spawn([16,19,21][i%3],p.pos.x+Math.cos(angle)*distance,p.pos.z+Math.sin(angle)*distance,1e9,1)<0)
        throw Error('Failed to place the late wave');
    }
    await run.sprites.prepareGlyphTextures(renderer);
    ui.update(run,'');inspected.env.invalidateUI();inspected.env.drawUI(renderer);
    const env=inspected.env,screen=inspected.doc.getElementById('game').getBoundingClientRect();
    const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.65-screen.y;
    window.tap(x,y,'down',11);env.drawUI(renderer);
    const uploadStart=auditControlUploads;
    let inputErrors=0,steeringUploads=0;
    const jsTimes=[];
    let knobErrors=0;
    for(let frame=0;frame<1800;frame++){
      const phase=Math.floor(frame/16)%3,sign=frame%16<8?1:-1,angle=Math.sin(frame*Math.PI/16)*Math.PI/3;
      const dx=phase===0?sign:phase===1?0:Math.sin(angle),dy=phase===0?0:phase===1?sign:-Math.cos(angle);
      window.tap(x+60*dx,y+60*dy,'move',11);
      const start=performance.now();
      run.update(1/30,1/30,1/30);run.input.endFrame();
      jsTimes.push(performance.now()-start);
      if(run.input.stickX*dx-run.input.stickY*dy<.98)inputErrors++;
      if(frame<48){
        env.drawUI(renderer);
        const b=inspected.layout.box(ui.stick),k=inspected.layout.box(ui.knob);
        const kx=k.x+k.w/2-b.x-b.w/2,ky=k.y+k.h/2-b.y-b.h/2;
        if(kx*dx+ky*dy<.98*Math.hypot(kx,ky)||Math.hypot(kx,ky)<1)knobErrors++;
      }
      if(frame===47)steeringUploads=auditControlUploads-uploadStart;
      if(frame%90===0){app.r.render(0);env.drawUI(renderer);await new Promise(resolve=>setTimeout(resolve,0));}
    }
    const thumb=inspected.controls.knobCanvas;
    const thumbAlpha=thumb?.getContext('2d').getImageData(thumb.width>>1,thumb.height>>1,1,1).data[3];
    window.tap(x,y,'up',11);env.drawUI(renderer);
    jsTimes.sort((a,b)=>a-b);
    // Use the original broad phase as an oracle at open floor, silhouettes and shelf edges.
    // Count candidates separately from the timed combat loop.
    const terrain=run.terrain,full=terrain.nearbyColliders.bind(terrain);
    const narrowed=terrain.collisionCandidates?.bind(terrain)??full;
    let broadCandidates=0,localCandidates=0;
    const point={},reference={};
    for(let i=0;i<4096;i++){
      const px=((i*.61803398875%1)*2-1)*terrain.deskBounds.x,pz=((i*.75487766625%1)*2-1)*terrain.deskBounds.z;
      const radius=[.45,1,2,2.4][i%4],feet=i%3*.7,passage=i%2===0;
      const nearby=full(px,pz);
      broadCandidates+=nearby.length;localCandidates+=narrowed(px,pz,radius).length;
      terrain.resolve(px,pz,radius,feet,point,passage);
      const hit=terrain.hitProp(px,feet,pz,radius,passage),top=terrain.propTop(px,pz,radius,feet);
      // Non-desk terrain uses the original collider list for all three operations.
      terrain.desk2d=false;
      try{
        terrain.resolve(px,pz,radius,feet,reference,passage);
        if(point.x!==reference.x||point.z!==reference.z||hit!==terrain.hitProp(px,feet,pz,radius,passage)||
          top!==terrain.propTop(px,pz,radius,feet))throw Error('Desk collision mismatch at '+[px,pz,radius]);
      }finally{terrain.desk2d=true;}
    }
    return {broadCandidates,localCandidates,platform:env.nativeDevice.platform,enemies:e.count,stageTime:run.stageTime,state:run.state,
      damage:run.stats.damage,inputErrors,knobErrors,thumbAlpha,steeringUploads,frames:jsTimes.length,
      updateP95Ms:jsTimes[Math.floor(jsTimes.length*.95)],updateP99Ms:jsTimes[Math.floor(jsTimes.length*.99)]};
  });
  console.log('Crowded steering',report);
  fs.writeFileSync(path.join(dir,'crowded-steering.json'),JSON.stringify(report,null,2));
  assert.equal(report.platform,'ios');assert.equal(report.state,'play');assert.equal(report.enemies,200);
  assert.ok(report.stageTime>359&&report.damage>0);assert.equal(report.inputErrors,0);
  if(!baseline){
    assert.ok(report.steeringUploads<=4);assert.equal(report.knobErrors,0);assert.ok(report.thumbAlpha>0);
    assert.ok(report.localCandidates<report.broadCandidates*.6);
  }
}
