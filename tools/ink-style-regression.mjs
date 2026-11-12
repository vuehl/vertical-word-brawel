import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewInkStyle(page,dir,moves){
  const baseline=process.argv.includes('--baseline');
  const report={environment:'Compiled WeChat bundle / Chrome SwiftShader, original gameplay camera. Not a phone FPS measurement.',screens:[],moves:[],stages:[]};
  await page.setViewport({width:390,height:844,deviceScaleFactor:2});
  await page.evaluate(async()=>{window.dispatchEvent(new Event('resize'));await Promise.all(app.run.terrain.paperAssets.photoJobs);app.run.pushLook();vfxSetup();await Promise.all([...app.run.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready));});
  const shot=async name=>{await page.screenshot({path:path.join(dir,name+'.png')});report.screens.push(name);};
  for(const [name,x,z] of [['01-scene',0,0],['02-books',-7,-4],['03-toys',13,16]]){
    await page.evaluate(([x,z])=>{vfxSetup();app.run.enemies.clear();app.run.player.pos.set(x,0,z);app.run.camTarget.copy(app.run.player.pos);vfxDraw(false);},[x,z]);await shot(name);
  }
  for(const key of ['flamethrower','hydro-pump','fire-spin','thunderbolt','razor-leaf','ice-beam','shadow-ball','psychic','tackle','water-gun','icy-wind','ember','flame-wheel','rock-slide','poison-sting','draining-kiss','swords-dance','sand-tomb']){
    const id=moves.find(m=>m.key===key).id;
    const state=await page.evaluate(({id,key})=>{vfxSetup();const r=app.run;r.player.addMove(id);r.player.moves[0].timer=0;r.player.moves[0].mods.dur=2;vfxAdvance(key==='hydro-pump'?28:19);return {key,damage:r.player.moves[0].damageDone,peaks:r.vfxPeaks};},{id,key});
    assert.ok(state.peaks.particles+state.peaks.volumes+state.peaks.projectiles>0,key);report.moves.push(state);
    if(['flamethrower','hydro-pump','fire-spin','thunderbolt','razor-leaf'].includes(key))await shot('skill-'+key);
    if(baseline&&key==='hydro-pump')break;
  }
  if(baseline)return report;
  report.scene=await page.evaluate(()=>{
    vfxSetup();const r=app.run,t=r.terrain;
    const material=[...t.paperAssets.mats.values()].filter(m=>m.isMeshStandardMaterial);
    return {camera:[r.camDist,app.r.camera.fov,r.camPitch],props:t.zxProps.filter(p=>!p.kind.startsWith('boundary')),boundary:t.zxProps.filter(p=>p.kind.startsWith('boundary')),toon:material.every(m=>m.userData.inkPaint),specular:material.some(m=>m.metalness>0),outline:app.r.outlinePass.enabled,lights:t.workshopPointLights.map(l=>({pos:l.position.toArray(),intensity:l.intensity})),text:t.workshopLayout.sceneText};
  });
  assert.deepEqual(report.scene.camera,[42,37,Math.PI*.3]);assert.ok(report.scene.toon&&report.scene.outline&&!report.scene.specular);assert.equal(report.scene.text,false);
  assert.ok(Math.max(...report.scene.props.map(p=>p.h))<12,'Interior height cap');assert.ok(Math.max(...report.scene.boundary.map(p=>p.h))>20,'Boundary landmarks');
  report.stability=await page.evaluate(()=>{
    const r=app.run,t=r.terrain;const sample=()=>JSON.stringify({light:t.workshopPointLights.map(l=>[...l.position.toArray(),l.intensity]),emissive:t.workshopGlows.map(m=>m.emissiveIntensity),bloom:app.r.bloom.intensity});
    const before=sample();for(let i=0;i<60;i++){r.player.pos.x=i*.15;r.renderWorld(1/30);}r.vfx.crafted.nova('fire',0,.3,0,5);r.vfx.update(.05);r.renderWorld(.05);return {stable:before===sample()};
  });assert.ok(report.stability.stable,'Movement/time/skills must not flicker scene lights');
  await page.evaluate(()=>{vfxSetup();app.run.pushLook();vfxDraw(false);});await shot('04-daylight');
  await page.evaluate(()=>{app.run.pushLook();vfxSetup();const r=app.run;r.player.pos.set(0,0,-r.terrain.play+16);r.camTarget.copy(r.player.pos);vfxDraw(false);});await shot('05-boundary');
  report.ultimates=[];
  for(const species of [4,5,6,16,17,18,58,59,132]){
    const state=await page.evaluate(async species=>{await app.startRun({species,biome:'forest',tier:0,boosts:[],mode:'standard'});app.halted=true;app.run.player.setSpecies(species);vfxSetup();await Promise.all([...app.run.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready));app.run.ult.charge=1;app.run.ult.fire();vfxAdvance(14);return {species,particles:app.run.vfx.add.n+app.run.vfx.norm.n,volumes:app.run.vfx.crafted.entries.length,camera:app.run.camDist};},species);
    assert.ok(state.particles+state.volumes>0);assert.equal(state.camera,42);report.ultimates.push(state);if([6,16].includes(species))await shot('ultimate-'+species);
  }
  report.budgets=[];
  for(const quality of ['low','medium','high']){
    const state=await page.evaluate(quality=>{app.meta.profile.settings.quality=quality;app.applySettings();vfxSetup();const r=app.run,v=r.vfx.crafted;for(let i=0;i<90;i++)v.volume({x:i%9-4,y:.3,z:-Math.floor(i/9),radius:1.2,height:4,mode:3,type:'fire',color:0xff803e,duration:1});vfxAdvance(3);const result={quality,count:v.entries.length,limit:v.limit,particles:r.vfx.norm.n,max:r.performance.normalParticles};const age=v.entries[0].age;v.update(0);result.paused=age===v.entries[0].age;r.hideOwnFx=true;v.update(0);result.hidden=v.entries.length===0;r.hideOwnFx=false;r.vfx.clear();result.cleared=v.keys.size===0&&v.mesh.count===0;return result;},quality);
    assert.ok(state.count<=state.limit&&state.particles<=state.max&&state.paused&&state.hidden&&state.cleared);report.budgets.push(state);
  }
  for(const [width,height] of [[320,568],[390,844],[430,932]]){await page.setViewport({width,height,deviceScaleFactor:2});await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));vfxSetup();vfxDraw();});await shot('phone-'+width);}
  for(let stage=1;stage<=4;stage++){
    if(stage>1)await page.evaluate(async()=>{app.run.ui.hideModal();app.run.state='play';await app.run.changeZone();app.halted=true;});
    const state=await page.evaluate(()=>{const r=app.run,t=r.terrain;r.pushLook();r.player.pos.copy(t.spawn);r.camTarget.copy(r.player.pos);vfxDraw(false);return {stage:r.stage,spawnFree:!t.hitProp(t.spawn.x,.3,t.spawn.z,.6),inkBatches:t.group.children.filter(m=>m.name==='painted-prop-contour').length,lights:t.workshopPointLights.length,finite:t.group.children.filter(m=>m.isInstancedMesh).every(m=>Array.from(m.instanceMatrix.array).every(Number.isFinite)),props:t.zxProps.length};});
    assert.equal(state.stage,stage);assert.ok(state.spawnFree&&state.inkBatches>0&&state.finite);assert.equal(state.lights,4);report.stages.push(state);await shot('stage-'+stage);
  }
  fs.writeFileSync(path.join(dir,'ink-style-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Ink style: camera, all material finishes, interior/boundary scale, stable lighting, 18 moves, nine ultimates, pause/hide/cleanup and three quality budgets passed.');return report;
}
