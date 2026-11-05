import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewPaper({page,tap,resize,dir,sleep}){
  const report={screenshots:[],camera:[],pickups:null,stages:[],mode:'Actual WeChat bundle in Chrome fixture; staged art shots are explicitly named.'};
  async function shot(name){await sleep(450);await page.screenshot({path:path.join(dir,name+'.png')});report.screenshots.push(name);}
  await resize(390,844);await shot('01-home');
  await tap('[data-action="journey"]');await tap('[data-species="7"]');await shot('02-water');
  await tap('.zx-footer button','选择关卡');await shot('03-map');
  await tap('.zx-footer button','选择难度');await tap('[data-action="enter"]');
  await page.waitForFunction(()=>app.run?.time>2&&app.run?.state==='play',{timeout:90000});
  await page.evaluate(()=>{app.run.godMode=true;app.run.pendingLevels=0;app.run.queueLevelUp=()=>{};app.r.setDynRes(1);app.r.setQuality({...app.r.quality,dyn:false,pixelRatio:1.5});});
  await shot('04-live-battle');
  const pickup=await page.evaluate(()=>{
    const run=app.run,p=run.player,pk=run.pickups;run.state='paused';pk.clear();
    const base=run.gold,pos=p.pos.clone();p.pos.set(0,0,0);
    const spawn=(kind,x,z,value,age=2)=>{pk.spawn(kind,x,0,z,value);const id=pk.n-1;pk.x[id]=x;pk.y[id]=.7;pk.z[id]=z;pk.vx[id]=pk.vy[id]=pk.vz[id]=0;pk.age[id]=age;pk.rest[id]=1;return id;};
    const nearby=spawn('coin',3,0,3),old=spawn('coin',5,0,5,1200),far=spawn('coin',35,0,7),zero=spawn('coin',0,0,11);
    let maxSpeed=0;
    for(let f=0;f<120;f++){pk.update(1/30);maxSpeed=Math.max(maxSpeed,Math.hypot(pk.vx[old],pk.vy[old],pk.vz[old]));}
    const first={gain:run.gold-base,near:pk.alive[nearby],old:pk.alive[old],far:pk.alive[far],zero:pk.alive[zero],maxSpeed};
    pk.collect(nearby);first.duplicateGain=run.gold-base;
    pk.magnetAll=4;for(let f=0;f<180;f++)pk.update(1/30);
    const magnet={gain:run.gold-base,far:pk.alive[far],count:pk.count};
    pk.clear();const chase=spawn('coin',4,0,2);for(let f=0;f<160;f++){p.pos.z+=.10;pk.update(1/30);}
    const result={first,magnet,chasingCollected:!pk.alive[chase],finite:Number.isFinite(pk.x[chase]+pk.y[chase]+pk.z[chase])};
    pk.clear();p.pos.copy(pos);run.state='play';return result;
  });
  assert.equal(pickup.first.gain,19);assert.equal(pickup.first.duplicateGain,19);assert.equal(pickup.first.far,1);
  assert.ok(!pickup.first.near&&!pickup.first.old&&!pickup.first.zero);assert.ok(pickup.first.maxSpeed<70);
  assert.equal(pickup.magnet.gain,26);assert.equal(pickup.magnet.count,0);assert.ok(pickup.chasingCollected&&pickup.finite);report.pickups=pickup;
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await resize(width,height);await sleep(350);
    const camera=await page.evaluate(()=>{
      const run=app.run,cam=run.r.camera;run.state='play';run.updateCamera(.1);
      const before={yaw:run.camYaw,pitch:run.camPitch,fov:cam.fov,distance:run.camDist};
      const screen=inspected.doc.getElementById('game').getBoundingClientRect(),b=inspected.doc.querySelector('.tc-stick').getBoundingClientRect();
      const x=b.x+b.width/2-screen.x,y=b.y+b.height/2-screen.y;
      window.tap(x,y,'down');window.tap(x+35,y,'move');window.tap(280,220,'down',2);window.tap(200,280,'move',2);window.tap(200,280,'up',2);
      const stickHeld=Math.hypot(run.input.stickX,run.input.stickY)>0;window.tap(x+35,y,'up');
      run.input.look(400,250);run.input.zoom(10);run.input.mouseDX=500;run.input.mouseDY=400;run.input.wheel=20;run.update(.016);
      return {before,after:{yaw:run.camYaw,pitch:run.camPitch,fov:cam.fov,distance:run.camDist},stickHeld,released:run.input.stickX===0&&run.input.stickY===0,looks:run.ui.touch.looks.size,props:run.terrain.zxProps.length,colliders:run.terrain.colliders.length};
    });
    assert.deepEqual(camera.after,camera.before);assert.ok(camera.stickHeld&&camera.released);assert.equal(camera.looks,0);assert.ok(camera.props>15&&camera.colliders>100);report.camera.push({width,...camera});
    await shot('05-camera-'+width);
  }
  await resize(390,844);
  // Reference composition: test-spawned enemies, with their real sprites and
  // unchanged combat sizes, frozen solely for reviewing the new environment.
  await page.evaluate(()=>{
    const r=app.run;r.state='paused';r.enemies.clear();r.projectiles.clear();r.vfx.clear();r.player.pos.set(0,0,0);r.camTarget.copy(r.player.pos);r.updateCamera(.1);
    for(const [id,x,z,flag] of [[121,3.3,-3.1,4],[96,-3.3,-5,0],[96,5,3,0],[129,-4,2,0],[130,-2,4,0],[144,0,-5.5,0],[129,3,6,0]])r.enemies.spawn(id,x,z,1,1,flag);
  });await sleep(1400);await shot('06-staged-reference-composition');
  for(let stage=2;stage<=4;stage++){
    await page.evaluate(async()=>{app.run.ui.hideModal();app.run.state='play';app.run.enemies.clear();await app.run.changeZone();});
    await page.waitForFunction(stage=>app.run.stage===stage&&app.run.state==='play',{timeout:90000},stage);
    const data=await page.evaluate(()=>({stage:app.run.stage,paper:app.run.terrain.zxPaper,props:app.run.terrain.zxProps.length,yaw:app.run.camYaw,spawnClear:!app.run.terrain.hitProp(app.run.player.pos.x,.3,app.run.player.pos.z,.5),oldTerrain:!!app.run.terrain.env}));
    assert.ok(data.paper&&!data.oldTerrain&&data.spawnClear);report.stages.push(data);await shot('07-stage-'+stage);
    if(stage===4){
      await page.evaluate(()=>{const r=app.run;r.player.pos.set(7,0,9);r.camTarget.copy(r.player.pos);r.updateCamera(.1);});await shot('08-sanctuary-centre');
      const cover=await page.evaluate(()=>{
        const arena=app.run.sanctuary,c=arena.covers.find(c=>c.kind==='column');arena.damage(c,c.hp+1);
        const broken=!c.alive&&c.group.getObjectByName('Column').visible===false&&c.group.getObjectByName('Stub').visible;
        arena.restoreCovers();const restored=c.alive&&c.group.getObjectByName('Column').visible;
        arena.onPhase(2);arena.onPhase(3);return {broken,restored};
      });
      assert.ok(cover.broken&&cover.restored);await sleep(600);
      const phase=await page.evaluate(()=>({roots:app.run.sanctuary.roots.length,brambles:app.run.sanctuary.brambles.length,paper:app.run.sanctuary.brambles.every(g=>g.children.some(c=>c.name==='paper-sanct_bramble'))}));
      assert.equal(phase.brambles,46);assert.ok(phase.roots>0&&phase.paper);report.sanctuary={cover,phase};await shot('08-sanctuary-phase-3');
    }
  }
  await tap('.zx-hud-pause');await shot('09-pause');
  fs.writeFileSync(path.join(dir,'paper-validation.json'),JSON.stringify(report,null,2));
  console.log('Paper art, fixed camera, pickups and all chapters passed:',report.screenshots.length,'screenshots');
}
