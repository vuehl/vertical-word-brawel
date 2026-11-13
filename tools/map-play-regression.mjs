import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewMapPlay(page,dir){
  const report={environment:'Compiled WeChat package in Chrome SwiftShader; controlled gameplay checks, not a phone test.',stages:[]};
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(async()=>{
    window.dispatchEvent(new Event('resize'));app.halted=true;
    const r=app.run;r.state='play';r.ui.hideModal();r.godMode=true;r.pendingLevels=0;r.performance.mapInterval=0;
    r.player.moves=Array(4).fill(null);r.ult.clear();r.director.update=()=>{};r.events.update=()=>{};r.minibosses.update=()=>{};
    r.enemies.clear();r.timers.length=0;r.anims.length=0;
    inspected.doc.querySelectorAll('.zx-intro,.run-hint,.banner').forEach(n=>n.remove());
    await Promise.all(r.terrain.paperAssets.photoJobs);
    window.mapPlayFrame=()=>{const r=app.run;app.r.renderer.resetState();r.updateCamera(1);r.renderWorld(0);r.vfx.update(0);r.ui.hud(r);r.ui.drawMinimap(r);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);};
    window.mapPlayLayout=()=>{const r=app.run,t=r.terrain;return {stage:r.stage,world:t.world,play:t.play,walk:t.walkLim,
      camera:r.camDist,marbles:t.workshopLooseMarbles.length,kinds:[...new Set(t.zxProps.filter(p=>p.kind.startsWith('boundary-')).map(p=>p.kind))],
      twin:t.workshopMarbleRuns.find(p=>p.kind==='twin')?.s,spawnClear:!t.hitProp(r.player.pos.x,.3,r.player.pos.z,.6),
      buildings:r.interactables.list.map(p=>({kind:p.kind,x:p.x,z:p.z,inside:t.inBounds(p.x,p.z)}))};};
    mapPlayFrame();
  });
  report.stages.push(await page.evaluate(()=>mapPlayLayout()));
  assert.equal(report.stages[0].world,240);assert.equal(report.stages[0].camera,42);assert.equal(report.stages[0].twin,.48);
  assert.ok(report.stages[0].kinds.length>=6);assert.ok(report.stages[0].marbles>=4);
  assert.ok(report.stages[0].buildings.every(b=>b.inside));
  // Actual generated fusion building, with labels captured from the map draw.
  await page.evaluate(()=>{
    const r=app.run,b=r.interactables.list.find(b=>b.kind==='bill');if(!b)throw Error('Missing skill fusion building');
    r.player.pos.set(b.x,0,b.z+10);r.camTarget.copy(r.player.pos);
    const proto=CanvasRenderingContext2D.prototype,fill=proto.fillText;window.mapPlayLabels=[];
    proto.fillText=function(text,...args){mapPlayLabels.push(text);return fill.call(this,text,...args);};
    // The WeChat DOM facade caches bound native methods on first use.
    delete r.ui.minimap._contexts['2d'];mapPlayFrame();
  });
  report.labels=[];
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:1});
    const labels=await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));mapPlayLabels.length=0;mapPlayFrame();return mapPlayLabels;});
    assert.ok(labels.includes('技能融合'));report.labels.push({width,labels:labels.filter(t=>/融合|祭坛|商店|遗忘|复制/.test(t))});
    await page.screenshot({path:path.join(dir,`building-label-${width}.png`)});
  }
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));app.run.openMap();mapPlayFrame();});
  assert.equal(await page.evaluate(()=>app.run.ui.mapOpen()),true);
  await page.screenshot({path:path.join(dir,'building-label-expanded.png')});
  await page.evaluate(()=>app.run.resume());
  // Contact occurs through the actual player update and simulation path. The
  // stationary high-HP target isolates marble kills from ordinary attacks.
  report.marble=await page.evaluate(()=>{
    const r=app.run,t=r.terrain;let chosen;
    for(const marble of t.workshopLooseMarbles){
      if(Array.from({length:21},(_,i)=>i*.5-2).every(dx=>!t.hitProp(marble.x+dx,.3,marble.z,1))) {chosen=marble;break;}
    }
    if(!chosen)throw Error('No unobstructed marble lane');
    const start={x:chosen.x,z:chosen.z};window.mapPlayMarble=chosen;window.mapPlayStart=start;
    r.enemies.clear();r.player.pos.set(start.x-.8,0,start.z);r.player.vel.set(0,0,0);r.camTarget.copy(r.player.pos);
    const index=r.enemies.spawn(r.director.cards[0].id,start.x+4,start.z,1,1,0);
    r.enemies.x[index]=start.x+4;r.enemies.z[index]=start.z;r.enemies.y[index]=0;r.enemies.hp[index]=r.enemies.maxHp[index]=1e9;
    r.enemies.update=()=>{const e=r.enemies;e.grid.build(e.n,e.x,e.z,e.alive,e.radius,e.dying);};
    window.mapPlayTarget=index;window.mapPlayKills=r.stats.kills;mapPlayFrame();
    return {start,index,hp:r.enemies.hp[index],kills:r.stats.kills};
  });
  await page.screenshot({path:path.join(dir,'marble-before.png')});
  report.marble.after=await page.evaluate(()=>{
    const r=app.run;for(let i=0;i<30;i++)r.simulate(1/60);mapPlayFrame();
    return {x:mapPlayMarble.x,z:mapPlayMarble.z,vx:mapPlayMarble.vx,dying:r.enemies.dying[mapPlayTarget],hp:r.enemies.hp[mapPlayTarget],kills:r.stats.kills,pickups:r.pickups.n};
  });
  assert.ok(report.marble.after.x>report.marble.start.x+3);assert.equal(report.marble.after.hp,0);
  assert.equal(report.marble.after.kills,report.marble.kills+1);assert.ok(report.marble.after.pickups>0);
  await page.screenshot({path:path.join(dir,'marble-after.png')});
  report.paused=await page.evaluate(()=>{
    const r=app.run;r.pause();const before=mapPlayMarble.x;for(let i=0;i<5;i++)r.update(.05);
    const result={before,after:mapPlayMarble.x};r.resume();return result;
  });assert.equal(report.paused.before,report.paused.after);
  for(const kind of ['boundary-pencil-cup','boundary-thread-spool','boundary-toy-blocks','boundary-crayon-box','marble-twin']){
    await page.evaluate(kind=>{
      const r=app.run;r.enemies.clear();const p=r.terrain.zxProps.find(p=>p.kind===kind&&p.z<0);if(!p)throw Error('Missing '+kind);
      r.player.pos.set(p.x,0,p.z+14);r.camTarget.copy(r.player.pos);mapPlayFrame();
    },kind);await page.screenshot({path:path.join(dir,kind+'.png')});
    await page.setViewport({width:640,height:760,deviceScaleFactor:1});
    await page.evaluate(kind=>{
      window.dispatchEvent(new Event('resize'));const r=app.run,p=r.terrain.zxProps.find(p=>p.kind===kind&&p.z<0),c=app.r.camera,pitch=r.camPitch;
      const focus={x:p.x,y:p.h*.4,z:p.z};c.position.set(focus.x,focus.y+Math.sin(pitch)*65,focus.z+Math.cos(pitch)*65);c.lookAt(focus.x,focus.y,focus.z);c.updateMatrixWorld(true);
      app.r.renderer.resetState();r.renderWorld(0);r.vfx.update(0);app.r.render(0);
    },kind);await page.screenshot({path:path.join(dir,kind+'-overview.png')});
    await page.setViewport({width:390,height:844,deviceScaleFactor:1});
    await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
  }
  for(let stage=2;stage<=4;stage++){
    await page.evaluate(async()=>{app.run.state='play';await app.run.changeZone();app.halted=true;});
    await page.waitForFunction(stage=>app.run.stage===stage&&app.run.state==='play',{timeout:90000},stage);
    const layout=await page.evaluate(()=>{mapPlayFrame();return mapPlayLayout();});report.stages.push(layout);
    assert.equal(layout.world,stage===4?150:240);assert.ok(layout.spawnClear);assert.ok(layout.marbles>0);
    assert.ok(layout.buildings.every(b=>b.inside));
  }
  fs.writeFileSync(path.join(dir,'map-play-report.json'),JSON.stringify(report,null,2));
  console.log('Map play verified: 240-unit combat maps, all building positions, labels at three phone widths, six boundary styles, 20% larger twin track, marble kill/rewards, pause and four-stage transitions.');
}
