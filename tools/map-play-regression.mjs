import {FOREST_ROUTE} from '../source/src/lite-rules.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const boundaryKinds=['boundary-alarm-clock','boundary-bookcase','boundary-dinosaur','boundary-pencil-case'];

export async function reviewMapPlay(page,dir){
  const report={environment:'Compiled WeChat package in Chrome SwiftShader; controlled gameplay checks, not a phone test.',stages:[]};
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(async()=>{
    window.dispatchEvent(new Event('resize'));app.halted=true;
    const r=app.run;r.state='play';r.ui.hideModal();r.godMode=true;r.pendingLevels=0;
    // The preset is frozen. Give this controlled run a fresh map sample on every draw.
    r.performance={...r.performance,mapInterval:0};
    r.player.moves=Array(4).fill(null);r.ult.clear();r.director.update=()=>{};r.events.update=()=>{};r.minibosses.update=()=>{};
    r.enemies.clear();r.timers.length=0;r.anims.length=0;
    inspected.doc.querySelectorAll('.zx-intro,.run-hint,.banner').forEach(n=>n.remove());
    await Promise.all(r.terrain.paperAssets.photoJobs);
    window.mapPlayFrame=()=>{const r=app.run;app.r.renderer.resetState();r.updateCamera(1);r.renderWorld(0);r.vfx.update(0);r.ui.hud(r);r.ui.drawMinimap(r);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);};
    window.mapPlayLayout=()=>{const r=app.run,t=r.terrain;return {stage:r.stage,world:t.world,play:t.play,walk:t.walkLim,
      camera:r.camDist,marbles:t.workshopLooseMarbles.length,kinds:[...new Set(t.zxProps.filter(p=>p.kind.startsWith('boundary-')).map(p=>p.kind))].sort(),
      reference:t.workshopLayout.reference,boundary:t.workshopBoundary.style,boundaryCount:t.workshopBoundary.groups.length,
      twin:t.workshopMarbleRuns.find(p=>p.kind==='twin')?.s,spawnClear:!t.hitProp(r.player.pos.x,.3,r.player.pos.z,.6),
      buildings:r.interactables.list.map(p=>({kind:p.kind,x:p.x,z:p.z,inside:t.inBounds(p.x,p.z)}))};};
    mapPlayFrame();
  });
  report.stages.push(await page.evaluate(()=>mapPlayLayout()));
  assert.equal(report.stages[0].world,240);assert.equal(report.stages[0].camera,42);assert.equal(report.stages[0].twin,.33*1.2);
  assert.ok(report.stages[0].marbles>=4);
  assert.ok(report.stages[0].buildings.every(b=>b.inside));
  assert.equal(report.stages[0].buildings.filter(b=>b.kind==='chest').length,1);
  // Inspect the native image submitted to Canvas for the selected building.
  await page.evaluate(()=>{
    const r=app.run,b=r.interactables.list.find(b=>b.kind==='bill');if(!b)throw Error('Missing skill fusion building');
    r.player.pos.set(b.x,r.terrain.height(b.x,b.z+10),b.z+10);r.camTarget.copy(r.player.pos);
    r.openMap();
    inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer,true);
  });
  await page.waitForFunction(()=>app.run.ui.mapFacilityIcon('bill').naturalWidth>0);
  await page.evaluate(()=>{inspected.env.drawUI(app.r.renderer,true);});
  await page.screenshot({path:path.join(dir,'gacha-map.png')});
  await page.evaluate(()=>{
    const r=app.run;
    window.mapPlayIconPosition=canvas=>{
      const icon=r.ui.mapFacilityIcon('bill'),proto=CanvasRenderingContext2D.prototype,draw=proto.drawImage;
      let drawn=null;
      proto.drawImage=function(image,...args){
        if(this.canvas===canvas._surface&&image===icon._surface){
          const [x,y,w,h]=args;drawn={x:x+w/2,y:y+h/2};
        }
        return draw.call(this,image,...args);
      };
      delete canvas._contexts['2d'];
      try{
        if(canvas===r.ui.minimap)r.ui.drawMinimap(r,true);
        else icon.onload();
      }finally{proto.drawImage=draw;delete canvas._contexts['2d'];}
      return drawn;
    };
  });
  report.pan=await page.evaluate(()=>{
    const r=app.run,p=r.player.pos,canvas=inspected.doc.querySelector('.zx-battle-map-art');
    const rect=canvas.getBoundingClientRect(),screen=inspected.doc.getElementById('game').getBoundingClientRect();
    const first=mapPlayIconPosition(canvas),playerX=p.x,playerZ=p.z;
    const x=rect.x+rect.width/2-screen.x,y=rect.y+rect.height/2-screen.y;
    const dx=p.x>0?45:-45,dy=p.z>0?30:-30;
    window.tap(x,y,'down');window.tap(x+dx,y+dy,'move');window.tap(x+dx,y+dy,'up');
    const after=mapPlayIconPosition(canvas);
    if(!after||Math.abs(after.x-first.x)<5)throw Error('Dragging did not pan the building');
    window.tap(rect.x-screen.x+after.x*rect.width/120,rect.y-screen.y+after.y*rect.height/120);
    const selection=r.ui.mapFacilityKind;
    const text=inspected.doc.querySelector('.zx-battle-map').textContent;
    inspected.env.drawUI(app.r.renderer,true);
    return {first,after,selection,text,stationary:p.x===playerX&&p.z===playerZ};
  });
  assert.equal(report.pan.selection,'bill');assert.ok(report.pan.stationary);
  assert.doesNotMatch(report.pan.text,/骰子|点击类别|附近 \d+ 处/);
  await page.screenshot({path:path.join(dir,'map-after-pan.png')});
  await page.evaluate(()=>app.run.resume());
  report.icons=[];
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:1});
    await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));mapPlayFrame();});
    await page.waitForFunction(()=>mapPlayIconPosition(app.run.ui.minimap));
    report.icons.push({width,kind:'bill'});
    await page.screenshot({path:path.join(dir,`building-icon-${width}.png`)});
  }
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(()=>{
    window.dispatchEvent(new Event('resize'));
    const r=app.run;
    r.events.start('fog');r.events.k=1;
    if(!r.events.blind||!mapPlayIconPosition(r.ui.minimap))throw Error('Fog hid the tracked facility on the HUD');
    r.openMap();mapPlayFrame();
  });
  assert.equal(await page.evaluate(()=>app.run.ui.mapOpen()),true);
  assert.equal(await page.evaluate(()=>app.run.ui.mapFacilityKind),'bill');
  assert.deepEqual(await page.evaluate(()=>mapPlayIconPosition(inspected.doc.querySelector('.zx-battle-map-art'))),report.pan.first);
  await page.screenshot({path:path.join(dir,'building-icon-expanded.png')});
  await page.evaluate(()=>{app.run.resume();app.run.events.end(true);});
  // Contact occurs through the actual player update and simulation path. The
  // stationary high-HP target isolates marble kills from ordinary attacks.
  report.marble=await page.evaluate(()=>{
    const r=app.run,t=r.terrain;let chosen;
    for(const marble of t.workshopLooseMarbles){
      if(Array.from({length:21},(_,i)=>marble.x+i*.5-2).every(x=>t.inBounds(x,marble.z,1)&&!t.inSolid(x,marble.z)&&!t.hitProp(x,t.height(x,marble.z)+marble.r,marble.z,1))) {chosen=marble;break;}
    }
    if(!chosen)throw Error('No unobstructed marble lane');
    const start={x:chosen.x,z:chosen.z};window.mapPlayMarble=chosen;window.mapPlayStart=start;
    r.enemies.clear();r.player.pos.set(start.x-.8,t.height(start.x-.8,start.z),start.z);r.player.vel.set(0,0,0);r.camTarget.copy(r.player.pos);
    const index=r.enemies.spawn(r.director.cards[0].id,start.x+4,start.z,1,1,0);
    r.enemies.x[index]=start.x+4;r.enemies.z[index]=start.z;r.enemies.y[index]=t.height(start.x+4,start.z);r.enemies.hp[index]=r.enemies.maxHp[index]=1e9;
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
  for(const kind of [...boundaryKinds,'marble-twin']){
    await page.evaluate(kind=>{
      const r=app.run,t=r.terrain;r.enemies.clear();
      const p=t.zxProps.filter(p=>p.kind===kind).sort((a,b)=>a.z-b.z)[0];if(!p)throw Error('Missing '+kind);
      window.mapPlaySubject=p;
      const z=kind.startsWith('boundary-')?-t.workshopBoundary.inner+8:p.z+14;
      r.player.pos.set(p.x,t.height(p.x,z),z);r.camTarget.copy(r.player.pos);mapPlayFrame();
    },kind);await page.screenshot({path:path.join(dir,kind+'.png')});
    await page.setViewport({width:640,height:760,deviceScaleFactor:1});
    await page.evaluate(()=>{
      window.dispatchEvent(new Event('resize'));const r=app.run,p=mapPlaySubject,c=app.r.camera,pitch=r.camPitch;
      const focus={x:p.x,y:p.h*.4,z:p.z};c.position.set(focus.x,focus.y+Math.sin(pitch)*65,focus.z+Math.cos(pitch)*65);c.lookAt(focus.x,focus.y,focus.z);c.updateMatrixWorld(true);
      app.r.renderer.resetState();r.renderWorld(0);r.vfx.update(0);app.r.render(0);
    });await page.screenshot({path:path.join(dir,kind+'-overview.png')});
    await page.setViewport({width:390,height:844,deviceScaleFactor:1});
    await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
  }
  report.respawns=await page.evaluate(async()=>{
    const r=app.run,f=r.interactables,terrain=r.terrain;
    const kind=chest=>chest.data?.gift?'freechest':chest.kind;
    const chests=()=>f.markers().filter(chest=>['freechest','chest'].includes(kind(chest)));
    const counts=()=>['chest','freechest'].map(k=>chests().filter(c=>kind(c)===k).length);
    const rounds=[],reserved=terrain.clearZones.length,slotCount=f.list.length;
    const time=r.time;
    const gift=f.spawnChest(0,0,false,true);
    if(kind(gift)!=='freechest'||counts().join()!=='6,6')throw Error('Gift exceeded the free machine cap');
    for(let round=0;round<6;round++){
      const batch=chests(),start=r.time;
      for(const chest of batch){r.gold=f.interactionCost(chest);f.interact(chest);}
      if(chests().length||f.spawnChest(0,0,true))throw Error('Opened slot became available during cooldown');
      r.time=start+29.99;f.update(0,0);
      if(chests().length)throw Error('Machine respawned early');
      r.time=start+30;f.update(0,0);
      const next=chests();
      await Promise.all(next.map(c=>c.modelReady));
      if(batch.some(c=>f.list.includes(c)||terrain.clearZones.includes(c.reservation))||
         !next.every(c=>f.hasVisual(c)&&terrain.inBounds(c.x,c.z,6)&&f.fitsOnDesk(c.x,c.z,c.r))||
         reserved!==terrain.clearZones.length||slotCount!==f.list.length)throw Error('Invalid respawn or stale site');
      rounds.push(counts());
    }
    r.time=time;
    r.timers.length=r.anims.length=0;
    return rounds;
  });
  assert.deepEqual(report.respawns,Array.from({length:6},()=>[6,6]));
  report.berry=await page.evaluate(()=>{
    const r=app.run,f=r.interactables,p=r.player,start=r.time;
    const berries=f.list.filter(b=>b.kind==='berry'),berry=berries[0];
    const before=p.pos.clone();
    p.pos.copy(berry.group.position);r.camTarget.copy(p.pos);r.updateCamera(0);
    const eat=()=>{p.hp=1;f.interact(berry);return p.hp>1;};
    if(!eat()||berries.slice(1).some(b=>b.used))throw Error('Berry heal or independent availability failed');
    f.update(.45,.45);r.time=start+59.99;f.update(0,0);
    if(eat()||f.markers().includes(berry))throw Error('Berry available before cooldown');
    r.time=start+60;f.update(0,0);
    if(berry.originalMaterials||!f.markers().includes(berry)||!eat())throw Error('Berry did not recharge');
    const cooldown=berry.data.regenAt-r.time;r.time=start;p.pos.copy(before);
    return {count:berries.length,cooldown};
  });
  assert.deepEqual(report.berry,{count:4,cooldown:60});
  for(const stage of FOREST_ROUTE.slice(1)){
    await page.evaluate(async()=>{app.run.state='play';await app.run.changeZone();app.halted=true;});
    await page.waitForFunction(stage=>app.run.stage===stage&&app.run.state==='play',{timeout:90000},stage);
    const layout=await page.evaluate(()=>{mapPlayFrame();return mapPlayLayout();});report.stages.push(layout);
    assert.equal(layout.world,stage===4?150:240);assert.ok(layout.spawnClear);assert.ok(layout.marbles>0);
    assert.ok(layout.buildings.every(b=>b.inside));
  }
  for(const stage of report.stages){
    for(const [kind,count] of [['chest',6],['freechest',6],['berry',4]])
      assert.equal(stage.buildings.filter(b=>b.kind===kind).length,stage.stage===4?0:count);
    assert.equal(stage.reference,'desk-clearance-20261117');assert.equal(stage.boundary,'giant-desk-objects');
    assert.deepEqual(stage.kinds,boundaryKinds);assert.equal(stage.boundaryCount,stage.stage===4?20:32);
  }
  fs.writeFileSync(path.join(dir,'map-play-report.json'),JSON.stringify(report,null,2));
  console.log('Map play verified: desktop layouts, building icons at three phone widths, four giant boundary objects, twin track, marble kills and rewards, pause and area transitions.');
}
