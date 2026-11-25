import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export async function reviewFireSpin(page,dir,moves){
  const baseline=process.argv.includes('--baseline'),id=moves.find(m=>m.key==='fire-spin').id;
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(async()=>{
    window.dispatchEvent(new Event('resize'));app.run.player.setSpecies(4);
    await Promise.all([...app.run.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready));
    if(app.run.vfx.crafted.fireSpin)assertReady(await app.run.vfx.crafted.fireSpin.ready);
    function assertReady(ready){if(!ready)throw Error('Authored fire atlas failed to load');}
  });
  const setup=async(quality='high',angle=-Math.PI/2)=>page.evaluate(({quality,angle,id})=>{
    Math.random=()=>.5;
    app.meta.profile.settings.quality=quality;app.applySettings();vfxSetup();
    const r=app.run,e=r.enemies;const dx=Math.cos(angle),dz=Math.sin(angle);
    // The map can start in rain (0.75 fire damage). Compare art under identical weather.
    r.weather=r.baseWeather='clear';r.weatherT=0;
    for(let i=0;i<4;i++){e.x[i]=dx*(4+i*2);e.z[i]=dz*(4+i*2);}
    e.update();r.lockTarget=1;r.player.facing.set(dx,dz);r.player.addMove(id);r.player.moves[0].timer=0;
    vfxAdvance(1);r.player.moves[0].timer=999;
  },{quality,angle,id});
  const sample=()=>page.evaluate(()=>{
    const r=app.run,v=r.vfx.crafted,m=r.player.moves[0],s=v.fireSpin,p=r.projectiles;
    return {damage:m.damageDone,hitTargets:[...r.enemies.hp.slice(0,4)].filter(h=>h<1e7).length,
      projectiles:p.used,entries:v.entries.map(e=>({x:e.x,z:e.z,age:e.age,mode:e.mode,radius:e.radius,height:e.height,handDrawn:!!e.handDrawn})),
      genericMeshes:v.mesh.count,sprites:s?.mesh.count||0,events:s?.events.length||0,limit:s?.limit||0,
      bodyRatios:s?Array.from({length:s.mesh.count},(_,i)=>s.attributes[1].array[i*4+2]===0?s.attributes[1].array[i*4]/s.attributes[0].array[i*4+3]:null).filter(ratio=>ratio!==null):[],
      camera:r.camDist,glError:app.r.renderer.getContext().getError()};
  });
  const cameraBeforeCast=await page.evaluate(()=>{app.run.updateCamera(1);return app.run.camDist;});
  const report={baseline,environment:'Actual compiled WeChat bundle in desktop Chrome SwiftShader, not phone FPS.',qualities:[],directions:[]};
  await setup();await page.evaluate(()=>vfxAdvance(18));report.main=await sample();
  await page.screenshot({path:path.join(dir,baseline?'原版.png':'手绘版.png')});
  if(baseline){fs.writeFileSync(path.join(dir,'baseline.json'),JSON.stringify(report,null,2));return report;}
  assert.ok(report.main.sprites>0);assert.equal(report.main.genericMeshes,0);assert.equal(report.main.glError,0);
  if(fs.existsSync(path.join(dir,'baseline.json'))){
    const original=JSON.parse(fs.readFileSync(path.join(dir,'baseline.json'))).main;
    const oldVortex=original.entries.find(e=>e.mode===3),newVortex=report.main.entries.find(e=>e.mode===3);
    assert.deepEqual([newVortex.radius,newVortex.height],[oldVortex.radius,oldVortex.height]);
    // The live map/collision setup may enter one 30 Hz step apart between boots.
    const positionDelta=Math.hypot(newVortex.x-oldVortex.x,newVortex.z-oldVortex.z);
    assert.ok(positionDelta<=7/30+.001,'Impact must stay within one simulation step of the baseline');
    assert.equal(report.main.hitTargets,original.hitTargets);
    assert.equal(report.main.damage,original.damage);
    report.gameplayComparison={originalDamage:original.damage,newDamage:report.main.damage,sameTargets:true,sameRadius:true,positionDelta};
  }
  for(const quality of ['low','medium','high']){
    await setup(quality);await page.evaluate(()=>vfxAdvance(18));const result=await sample();
    assert.ok(result.sprites>0&&result.sprites<=result.limit);assert.equal(result.camera,cameraBeforeCast);assert.equal(result.glError,0);
    report.qualities.push({quality,...result});await page.screenshot({path:path.join(dir,'画质-'+quality+'.png')});
  }
  for(const [name,angle] of [['上',-Math.PI/2],['右',0],['下',Math.PI/2],['左',Math.PI]]){
    await setup('high',angle);await page.evaluate(()=>vfxAdvance(25));const result=await sample();
    assert.ok(result.damage>0&&result.hitTargets>0);assert.ok(result.entries.some(e=>e.handDrawn));
    report.directions.push({direction:name,...result});await page.screenshot({path:path.join(dir,'方向-'+name+'.png')});
  }
  await setup();const frames=[];report.lifecycle=[];
  for(let i=0;i<60;i++){
    await page.evaluate(()=>vfxAdvance(2));report.lifecycle.push(await sample());frames.push(await page.screenshot());
    if([1,4,7,10,13,18].includes(i))fs.writeFileSync(path.join(dir,'阶段-'+String(i).padStart(2,'0')+'.png'),frames.at(-1));
  }
  assert.ok(report.lifecycle.some(s=>s.damage>0));assert.equal(report.lifecycle.at(-1).sprites,0);
  assert.ok(report.lifecycle.every(s=>s.bodyRatios.every(ratio=>Math.abs(ratio-1)<.00001)),'Flight, impact and growth must keep the authored frame aspect ratio');
  const buffers=await Promise.all(frames.map(b=>sharp(b).ensureAlpha().raw().toBuffer()));
  await sharp(Buffer.concat(buffers),{raw:{width:390,height:844*buffers.length,channels:4,pageHeight:844}}).gif({delay:Array(buffers.length).fill(67),loop:0}).toFile(path.join(dir,'火旋风-实战.gif'));
  await setup();await page.evaluate(()=>vfxAdvance(18));
  report.pause=await page.evaluate(()=>{const v=app.run.vfx.crafted,b=v.fireSpin.attributes.map(a=>Array.from(a.array)).flat().join();v.update(0);return b===v.fireSpin.attributes.map(a=>Array.from(a.array)).flat().join();});assert.ok(report.pause);
  report.hidden=await page.evaluate(()=>{const r=app.run;r.hideOwnFx=true;r.vfx.crafted.update(0);const count=r.vfx.crafted.fireSpin.mesh.count;r.hideOwnFx=false;r.vfx.clear();return count;});assert.equal(report.hidden,0);
  report.enemy=await page.evaluate(()=>{const r=app.run,v=r.vfx.crafted;r.hideOwnFx=true;v.touch('enemy-spin',{x:0,y:.2,z:-4,radius:2,height:6,mode:3,type:'fire',handDrawn:true,own:false});v.update(1/30);const count=v.fireSpin.mesh.count;r.hideOwnFx=false;v.clear();return {count,cleared:v.fireSpin.mesh.count===0&&v.fireSpin.events.length===0};});assert.ok(report.enemy.count>0&&report.enemy.cleared);
  report.layouts=[];
  for(const [width,height] of [[320,568],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:1});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
    await setup();await page.evaluate(()=>vfxAdvance(18));const state=await sample();assert.equal(state.glError,0);assert.ok(state.sprites>0);
    report.layouts.push({width,...state});await page.screenshot({path:path.join(dir,'手机-'+width+'.png')});
  }
  report.pressure=await page.evaluate(()=>{const v=app.run.vfx.crafted;v.clear();for(let i=0;i<100;i++){v.touch('pressure-'+i,{x:i%5,y:.2,z:-Math.floor(i/5),radius:2,height:5,mode:3,type:'fire',handDrawn:true});v.fireSpin.play('impact',0,.2,-4,3);}v.update(1/30);const s=v.fireSpin;const result={count:s.mesh.count,limit:s.limit,emitters:v.spinEmitters.length,bodies:Array.from({length:s.mesh.count},(_,i)=>s.attributes[1].array[i*4+2]).filter(kind=>kind===0).length,finite:s.attributes.every(a=>Array.from(a.array).every(Number.isFinite))};v.clear();return result;});
  assert.ok(report.pressure.count>0&&report.pressure.count<=report.pressure.limit&&report.pressure.finite);
  assert.equal(report.pressure.bodies,Math.min(report.pressure.emitters,report.pressure.limit),'Optional floor artwork must never evict a complete vortex body');
  report.otherMoves=[];
  for(const key of ['flamethrower','water-gun','ember']){
    const other=moves.find(m=>m.key===key);
    const result=await page.evaluate(async id=>{
      vfxSetup();
      const r=app.run,v=r.vfx.crafted;
      if(!r.player.addMove(id))throw Error('Missing comparison move '+id);
      const move=r.player.moves[0];
      await v.prepareMoveTexture(move.def.effectKey??move.def.key);
      move.timer=0;
      let authored=0,other=0;
      for(let frame=0;frame<18;frame++){
        vfxAdvance(1,1/30,false);
        authored=Math.max(authored,v.fireSpin.mesh.count);
        other=Math.max(other,v.fireJet.reference.mesh.count+v.fireball.mesh.count);
      }
      const p=r.vfxPeaks;
      return {authored,other:other+p.volumes+p.firePackets+p.projectiles+p.particles};
    },other.id);
    assert.equal(result.authored,0,key);assert.ok(result.other>0,key+' must render');report.otherMoves.push({key,...result});
  }
  // Inspect all twenty authored poses without enemy silhouettes or damage
  // labels covering the curls. This uses the compiled effect on the real desk.
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(()=>{
    window.dispatchEvent(new Event('resize'));vfxSetup();const r=app.run;r.enemies.clear();r.player.moves=Array(4).fill(null);
    r.projectiles.clear();r.zones.clear();r.vfx.clear();r.anims.length=0;
    r.player.pos.set(0,r.terrain.height(0,2),2);r.camTarget.copy(r.player.pos);
  });
  const shapeFrames=[];report.shapeCycle=[];
  for(let i=0;i<20;i++){
    const state=await page.evaluate(i=>{
      const r=app.run,s=r.vfx.crafted.fireSpin;r.updateCamera(1);r.renderWorld(0);r.vfx.clear();
      s.update(0,[{x:0,y:r.terrain.height(0,-1)+.15,z:-1,radius:2.6,height:6.3,age:(20+i)/24,life:1,own:true}]);
      app.r.render(0);
      const parts=Array.from({length:s.mesh.count},(_,j)=>({kind:s.attributes[1].array[j*4+2],frame:s.attributes[1].array[j*4+1]}));
      return {parts,triangles:s.mesh.geometry.index.count/3,projection:s.mesh.userData.projection,glError:app.r.renderer.getContext().getError()};
    },i);
    assert.equal(state.projection,'isometric-fire-funnel');assert.equal(state.triangles,2*24*24);assert.equal(state.glError,0);
    const body=state.parts.find(p=>p.kind===0),dust=state.parts.find(p=>p.kind===4);
    assert.ok(body&&dust);assert.equal(body.frame,dust.frame,'Ground dust must stay registered to the exact body pose');
    report.shapeCycle.push(state);shapeFrames.push(await page.screenshot());
    if(i%5===0)fs.writeFileSync(path.join(dir,'保形-'+String(i).padStart(2,'0')+'.png'),shapeFrames.at(-1));
  }
  assert.equal(new Set(report.shapeCycle.map(s=>s.parts.find(p=>p.kind===0).frame)).size,20,'Inspect the complete authored animation cycle');
  const shapePixels=await Promise.all(shapeFrames.map(b=>sharp(b).ensureAlpha().raw().toBuffer()));
  await sharp(Buffer.concat(shapePixels),{raw:{width:390,height:844*shapePixels.length,channels:4,pageHeight:844}}).gif({delay:Array(20).fill(42),loop:0}).toFile(path.join(dir,'火旋风-保形循环.gif'));
  await page.evaluate(()=>app.run.vfx.clear());
  fs.writeFileSync(path.join(dir,'fire-spin-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Hand-drawn fire spin verified: real damage/movement, 4 directions, 3 qualities, lifecycle, pause, hiding, cleanup, phone layouts, pressure and other moves.');
  return report;
}
