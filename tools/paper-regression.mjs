import {FOREST_ROUTE} from '../source/src/lite-rules.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewPaper({page,tap,resize,dir,sleep}){
  const report={screenshots:[],camera:[],pickups:null,stages:[],mode:'Actual WeChat bundle in Chrome fixture; staged art shots are explicitly named.'};
  async function shot(name){await sleep(450);await page.screenshot({path:path.join(dir,name+'.png')});report.screenshots.push(name);}
  await resize(390,844);await shot('01-home');
  await tap('[data-action="journey"]');await tap('[data-species="16"]');await shot('02-wind');
  await tap('.zx-footer button','选择关卡');await shot('03-map');
  await tap('.zx-footer button','选择难度');await tap('[data-mode="standard"][data-tier="0"]');await tap('[data-action="enter"]');
  await page.waitForFunction(()=>app.run?.terrain?.zxPaper&&app.run?.state==='play',{timeout:90000,polling:100});
  await page.evaluate(()=>{app.run.godMode=true;app.run.pendingLevels=0;app.run.queueLevelUp=()=>{};app.r.setDynRes(1);app.r.setQuality({...app.r.quality,dyn:false,pixelRatio:1.5});});
  await shot('04-live-battle');
  report.enemyCollision = await page.evaluate(()=>{
    const run = app.run, terrain = run.terrain, enemies = run.enemies;
    const cube = terrain.zxProps.find(prop=>prop.kind==='color-cube' && !prop.walkable);
    const box = terrain.colliders.find(c=>c.x===cube.x && c.z===cube.z);
    window.paperTestBox=box;
    const across = distance=>({x:box.x+box.sin*distance, z:box.z+box.cos*distance});
    const start = across(-box.halfZ-3), target = across(box.halfZ+3), saved = run.player.pos.clone();
    run.state = 'paused';
    enemies.clear();
    const id = enemies.spawn(129, box.x, box.z, 1, 1);
    const overlaps = ()=>terrain.hitProp(enemies.x[id], enemies.y[id], enemies.z[id], enemies.radius[id]-.00005);
    const spawnClear = !overlaps();
    enemies.flags[id] = 0;
    run.player.pos.set(target.x, 0, target.z);
    enemies.x[id] = start.x;
    enemies.z[id] = start.z;
    enemies.kx[id] = box.sin*220;
    enemies.kz[id] = box.cos*220;
    enemies.update(.08);
    const signedDistance = ()=>(enemies.x[id]-box.x)*box.sin+(enemies.z[id]-box.z)*box.cos;
    const knockbackBlocked = signedDistance() < -box.halfZ && !overlaps();
    enemies.kx[id] = enemies.kz[id] = 0;
    let enteredProp = false, landedOnTop = false, reached = false;
    for(let frame=0; frame<600 && !reached; frame++){
      enemies.update(1/30);
      enteredProp ||= overlaps();
      landedOnTop ||= !enemies.air[id] && Math.abs(enemies.y[id]-box.standY)<.001;
      reached = Math.hypot(enemies.x[id]-target.x,enemies.z[id]-target.z)<2;
    }
    enemies.clear();
    run.player.pos.copy(saved);
    run.state = 'play';
    return {spawnClear,knockbackBlocked,enteredProp,landedOnTop,reached};
  });
  assert.deepEqual(report.enemyCollision,{spawnClear:true,knockbackBlocked:true,enteredProp:false,landedOnTop:true,reached:true});
  report.springShoes=await page.evaluate(()=>{
    const r=app.run,p=r.player,t=r.terrain,dt=1/30;
    const saved=p.pos.clone(),box=paperTestBox;
    const offset=box.halfZ+2.5,x=box.x-box.sin*offset,z=box.z-box.cos*offset;
    p.pos.set(x,t.height(x,z),z);p.vel.set(0,0,0);p.grounded=true;
    const advance=()=>{r.realDt=dt;p.update(dt);r.input.endFrame();};
    r.input.touchKey('Space',true);advance();r.input.touchKey('Space',false);
    const spaceBlocked=p.grounded;
    r.input.stickX=Math.cos(r.camYaw)*box.sin-Math.sin(r.camYaw)*box.cos;
    r.input.stickY=-Math.sin(r.camYaw)*box.sin-Math.cos(r.camYaw)*box.cos;
    for(let i=0;i<45;i++)advance();
    const stopped=p.grounded && Math.hypot(p.pos.x-box.x,p.pos.z-box.z)>box.halfZ;
    p.addItem('air-balloon');
    const buttonHidden=!inspected.doc.querySelector('.tc-jump');
    let jumped=false,onTop=false;
    for(let i=0;i<120;i++){
      advance();
      jumped ||= !p.grounded;
      onTop ||= p.grounded && Math.abs(p.pos.y-box.standY)<.001;
      if(onTop)break;
    }
    r.input.stickX=r.input.stickY=0;
    for(let i=0;i<45;i++)advance();
    const stable=p.grounded && Math.abs(p.pos.y-box.standY)<.001;
    p.removeItem('air-balloon');p.pos.copy(saved);p.vel.set(0,0,0);
    return {spaceBlocked,stopped,buttonHidden,jumped,onTop,stable};
  });
  assert.deepEqual(report.springShoes,{spaceBlocked:true,stopped:true,buttonHidden:true,jumped:true,onTop:true,stable:true});
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
      const screen=inspected.doc.getElementById('game').getBoundingClientRect();
      const x=inspected.env.innerWidth*.5-screen.x,y=inspected.env.innerHeight*.8-screen.y;
      window.tap(x,y,'down');window.tap(x+35,y,'move');window.tap(280,220,'down',2);window.tap(200,280,'move',2);window.tap(200,280,'up',2);
      const stickHeld=Math.hypot(run.input.stickX,run.input.stickY)>0;window.tap(x+35,y,'up');
      run.input.look(400,250);run.input.zoom(10);run.input.mouseDX=500;run.input.mouseDY=400;run.input.wheel=20;run.update(.016);
      const t=run.terrain;
      const matched=t.zxProps.every(p=>(p.walkable?t.workshopGroundSurfaces:t.colliders).some(c=>c.x===p.x&&c.z===p.z));
      return {before,after:{yaw:run.camYaw,pitch:run.camPitch,fov:cam.fov,distance:run.camDist},stickHeld,released:run.input.stickX===0&&run.input.stickY===0,looks:run.ui.touch.looks.size,props:t.zxProps.length,colliders:t.colliders.length,matched};
    });
    assert.deepEqual(camera.after,camera.before);assert.ok(camera.stickHeld&&camera.released);assert.equal(camera.looks,0);assert.ok(camera.props>15);assert.ok(camera.matched,'Each prop has a walkable surface or a solid footprint');report.camera.push({width,...camera});
    await shot('05-camera-'+width);
  }
  await resize(390,844);
  // Reference composition: test-spawned enemies, with their real sprites and
  // unchanged combat sizes, frozen solely for reviewing the new environment.
  await page.evaluate(()=>{
    const r=app.run;r.state='paused';r.enemies.clear();r.projectiles.clear();r.vfx.clear();r.player.pos.set(0,0,0);r.camTarget.copy(r.player.pos);r.updateCamera(.1);
    for(const [id,x,z,flag] of [[121,3.3,-3.1,4],[96,-3.3,-5,0],[96,5,3,0],[129,-4,2,0],[130,-2,4,0],[144,0,-5.5,0],[129,3,6,0]])r.enemies.spawn(id,x,z,1,1,flag);
  });await sleep(1400);await shot('06-staged-reference-composition');
  for(const stage of FOREST_ROUTE.slice(1)){
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
  await tap('.zx-pause-attributes');
  await tap('.zx-tab','成长属性');
  const range=await page.evaluate(()=>[...app.screen.querySelectorAll('.zx-stat-row')]
    .find(row=>row.firstElementChild.textContent==='拾取范围')?.lastElementChild.textContent);
  assert.equal(range,'6 厘米');
  await shot('10-growth-attributes');
  fs.writeFileSync(path.join(dir,'paper-validation.json'),JSON.stringify(report,null,2));
  console.log('Paper art, fixed camera, pickups and all chapters passed:',report.screenshots.length,'screenshots');
}
