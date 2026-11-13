import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export async function reviewStylizedVFX(page,dir){
  const moves=JSON.parse(fs.readFileSync(new URL('../source/public/data/moves.json',import.meta.url),'utf8'));
  const report={environment:'Actual compiled WeChat bundle in Chrome SwiftShader; controlled inputs and enemies, original gameplay camera. Not phone FPS.',moves:[],ultimates:[],screens:[]};
  await page.evaluate(()=>{
    app.halted=true;inspected.doc.querySelector('[data-dev-action="close"]')?.click();
    Object.assign(app.meta.profile.settings,{quality:'high',batterySaver:false,autoUlt:false,ultQuiet:true,damageNumbers:true});app.applySettings();
    window.vfxSetup=()=>{
      const r=app.run,p=r.player;app.halted=true;r.state='play';r.ui.hideModal();r.godMode=true;r.pendingLevels=0;
      r.director.update=()=>{};r.events.update=()=>{};r.minibosses.update=()=>{};r.enemies.clear();r.ult.clear();r.projectiles.clear();r.zones.clear();r.vfx.clear();r.timers.length=0;r.anims.length=0;r.aimMode='auto';
      p.moves=Array(4).fill(null);p.pos.set(0,0,0);p.vel.set(0,0,0);p.facing.set(0,-1);r.camTarget.copy(p.pos);p.stats.critChance=0;
      r.queueLevelUp=()=>{};r.enemies.update=()=>{const e=r.enemies;e.grid.build(e.n,e.x,e.z,e.alive,e.radius,e.dying);};
      r.ult.charge=0;r.ult.active=0;r.hitstopT=0;r.lockTarget=-1;
      inspected.doc.querySelectorAll('.zx-intro,.run-hint,.banner').forEach(n=>n.remove());
      for(const [i,x,z] of [[74,-4,-7],[4,0,-4],[1,4,-7],[46,-4,3]]){
        const n=r.enemies.spawn(i,x,z,1,1,0);r.enemies.hp[n]=r.enemies.maxHp[n]=1e7;r.enemies.y[n]=0;
      }r.enemies.update();r.vfxPeaks={particles:0,volumes:0,firePackets:0,projectiles:0,modes:[]};
    };
    window.vfxDraw=(ui=true)=>{const r=app.run;app.r.renderer.resetState();r.updateCamera(1/30);r.renderWorld(0);r.vfx.update(0);app.r.render(0);if(ui){r.ui.hud(r);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);}};
    window.vfxAdvance=(frames,dt=1/30)=>{const r=app.run;for(let i=0;i<frames;i++){r.realTime+=dt;r.simulate(dt);r.updateCamera(dt);r.renderWorld(dt);r.vfx.update(dt);r.vfxPeaks.particles=Math.max(r.vfxPeaks.particles,r.vfx.add.n+r.vfx.norm.n);r.vfxPeaks.volumes=Math.max(r.vfxPeaks.volumes,r.vfx.crafted.mesh.count);r.vfxPeaks.firePackets=Math.max(r.vfxPeaks.firePackets,r.vfx.crafted.fireJet.mesh.count);r.vfxPeaks.projectiles=Math.max(r.vfxPeaks.projectiles,r.projectiles.used);for(const e of r.vfx.crafted.entries)if(!r.vfxPeaks.modes.includes(e.mode))r.vfxPeaks.modes.push(e.mode);}vfxDraw(false);};
    vfxSetup();vfxDraw();
  });
  report.base=await page.evaluate(()=>{
    const r=app.run,c=app.r.camera,t=r.vfx.atlas,ctx=t.image.getContext('2d'),pixels=ctx.getImageData(0,0,128,128).data;
    let partial=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>0&&pixels[i]<255)partial++;
    return {camera:{distance:r.camDist,fov:c.fov,pitch:r.camPitch},atlas:{width:t.image.width,height:t.image.height,partial,style:t.userData.style},maps:[...r.terrain.paperAssets.photos.values()].map(p=>p.style),pointLights:r.terrain.workshopPointLights.length,volumeVertices:r.vfx.crafted.mesh.geometry.getAttribute('position').count};
  });
  assert.equal(report.base.camera.distance,42);assert.equal(report.base.camera.fov,37);assert.ok(Math.abs(report.base.camera.pitch-Math.PI*.3)<1e-9);
  assert.equal(report.base.atlas.width,1024);assert.ok(report.base.atlas.partial>100);assert.ok(report.base.maps.every(p=>p==='painted-toy'));assert.equal(report.base.pointLights,4);assert.ok(report.base.volumeVertices>800);
  if(process.argv.includes('--lighting')){
    const {reviewLighting}=await import('./lighting-regression.mjs');return reviewLighting(page,dir);
  }
  if(process.argv.includes('--desk-paint')){
    const {reviewDeskPaint}=await import('./desk-paint-regression.mjs');return reviewDeskPaint(page,dir);
  }
  if(process.argv.includes('--flat-surfaces')){
    const {reviewFlatSurfaces}=await import('./flat-surfaces-regression.mjs');return reviewFlatSurfaces(page,dir);
  }
  if(process.argv.includes('--ink-style')){
    const {reviewInkStyle}=await import('./ink-style-regression.mjs');return reviewInkStyle(page,dir,moves);
  }
  if(process.argv.includes('--marble-factories')){
    const {reviewMarbleFactories}=await import('./marble-factory-regression.mjs');
    return reviewMarbleFactories(page,dir,moves);
  }
  if(process.argv.includes('--fire-breath')){
    const {reviewFireBreath}=await import('./fire-breath-regression.mjs');
    return reviewFireBreath(page,dir,moves);
  }
  const screenshot=async name=>{await page.screenshot({path:path.join(dir,name+'.png')});report.screens.push(name);};
  async function recordElements(){
    const elementFrames=[];
    for(const key of ['flamethrower','hydro-pump']){
      const id=moves.find(m=>m.key===key).id;
      await page.evaluate(async({id,key})=>{
        vfxSetup();app.run.player.setSpecies(4);vfxDraw(false);
        await Promise.all([...app.run.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready));vfxDraw(false);
        app.run.player.addMove(id);const m=app.run.player.moves[0];m.timer=0;m.mods.dur=2;if(key==='hydro-pump')vfxAdvance(17);
      },{id,key});
      for(let i=0;i<16;i++){await page.evaluate(()=>vfxAdvance(2));elementFrames.push(await page.screenshot());}
    }
    const buffers=await Promise.all(elementFrames.map(frame=>sharp(frame).resize(390,844).ensureAlpha().raw().toBuffer()));
    await sharp(Buffer.concat(buffers),{raw:{width:390,height:844*buffers.length,channels:4,pageHeight:844}}).gif({delay:Array(buffers.length).fill(85),loop:0}).toFile(path.join(dir,'burning-fire-flowing-water.gif'));
  }
  if(process.argv.includes('--vfx-media')){await recordElements();console.log('Recorded actual fire fan and water flow; all actor art ready, 32 frames with explicit frame delays.');return report;}
  await screenshot('00-close-camera-painted-materials');
  const keys=['ember','flamethrower','fire-spin','water-gun','hydro-pump','icy-wind','razor-leaf','ice-beam','thunderbolt','psychic','tackle','flame-wheel','rock-slide','poison-sting','shadow-ball','draining-kiss','swords-dance','sand-tomb'];
  for(const key of keys){
    const id=moves.find(m=>m.key===key)?.id;assert.ok(id,key);
    const sample=await page.evaluate(({id,key})=>{
      vfxSetup();const r=app.run,before=r.vfx.crafted.impacts;
      if(!r.player.addMove(id))throw Error('Could not add '+key);
      if(key==='flamethrower'){
        r.enemies.x[0]=-3;r.enemies.z[0]=-4;r.enemies.x[1]=0;r.enemies.z[1]=-5.5;r.enemies.x[2]=3;r.enemies.z[2]=-4;
        r.enemies.update();r.lockTarget=1;
      }
      const move=r.player.moves[0];move.timer=0;move.mods.dur=1.5;
      vfxAdvance(key==='hydro-pump'?28:key==='flamethrower'||key==='water-gun'?15:19);
      return {key,id,arch:move.def.arch,type:move.def.type,damage:move.damageDone,hitTargets:[...r.enemies.hp.slice(0,4)].filter(h=>h<1e7).length,particles:r.vfx.add.n+r.vfx.norm.n,peaks:r.vfxPeaks,ground:r.vfx.groundN.n,volumes:r.vfx.crafted.entries.map(e=>({mode:e.mode,type:e.type,height:e.height,radius:e.radius})),impacts:r.vfx.crafted.impacts-before,projectiles:r.projectiles.used,lights:r.vfx.crafted.lightSources.length};
    },{id,key});
    assert.ok(sample.peaks.particles+sample.peaks.volumes+sample.peaks.projectiles>0,'Skill must render: '+key);report.moves.push(sample);
    fs.writeFileSync(path.join(dir,'stylized-vfx-report.json'),JSON.stringify(report,null,2)+'\n');
    if(['flamethrower','fire-spin','water-gun','hydro-pump','thunderbolt','razor-leaf','ice-beam'].includes(key))await screenshot('move-'+key);
  }
  assert.ok(report.moves.find(m=>m.key==='flamethrower').volumes.some(v=>v.mode===8),'Flamethrower must have a continuous broad radial fan');
  assert.ok(report.moves.find(m=>m.key==='flamethrower').hitTargets>=3,'Both sides and the centre of the real damage fan must hit');
  assert.ok(report.moves.find(m=>m.key==='icy-wind').volumes.some(v=>v.mode===4));
  assert.ok(report.moves.find(m=>m.key==='hydro-pump').peaks.modes.includes(4),'Water beam must use a flowing fluid surface');
  assert.ok(report.moves.find(m=>m.key==='water-gun').peaks.modes.includes(6),'Water shots must have a moving liquid surface');
  assert.ok(report.moves.find(m=>m.key==='fire-spin').peaks.modes.includes(3),'Fire spin must deform as a 3D flame vortex');
  assert.ok(report.moves.filter(m=>m.damage>0).length>=8,'Actual skills must still damage their targets');
  for(const species of [4,5,6,16,17,18,58,59,132]){
    await page.evaluate(async species=>{if(!await app.startRun({species:[4,5,6].includes(species)?4:species===132?132:16,biome:'forest',tier:0,boosts:[],mode:'standard'}))throw Error('Could not start form '+species);app.halted=true;app.run.player.setSpecies(species);vfxSetup();await Promise.all([...app.run.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready));app.run.ult.charge=1;app.run.ult.fire();vfxAdvance(14);},species);
    const state=await page.evaluate(()=>{const r=app.run;return {species:r.player.speciesId,name:r.ult.name,active:r.ult.active,volumes:r.vfx.crafted.entries.map(e=>({mode:e.mode,type:e.type,age:e.age,x:e.x,z:e.z})),particles:r.vfx.add.n+r.vfx.norm.n,damage:r.stats.damage,vertices:r.vfx.crafted.mesh.count,camera:r.camDist,rings:r.vfx.rings.n};});
    if(species===17){assert.equal(state.name,'环形扩散');assert.ok(state.rings>0);}
    assert.equal(state.species,species);assert.equal(state.camera,42);assert.ok(state.particles+state.volumes.length>0);if([4,5,6].includes(species))assert.ok(state.volumes.some(v=>v.mode===3));if([16,58].includes(species))assert.ok(state.volumes.some(v=>v.mode===1));
    report.ultimates.push(state);if([4,6,16,17,58].includes(species))await screenshot('ultimate-'+species);
  }
  // Replay the real moving wind ultimate: these frames are the actual game
  // camera and combat update, not a separate VFX preview renderer.
  await page.evaluate(async()=>{await app.startRun({species:16,biome:'forest',tier:0,boosts:[],mode:'standard'});app.halted=true;vfxSetup();await Promise.all([...app.run.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready));app.run.ult.charge=1;app.run.ult.fire();});
  await page.evaluate(()=>vfxAdvance(36));
  report.motion=await page.evaluate(()=>{const r=app.run,v=r.vfx.crafted;return {age:v.entries[0]?.age,x:v.entries[0]?.x,positions:v.attributes[0].array.slice(0,4),emitted:v.emitted};});
  // Both lighting modes, three presets and native phone widths exercise the
  // same surface shaders. The room continues to contain exactly four lights.
  report.budgets=[];
  for(const quality of ['low','medium','high']){
    const state=await page.evaluate(quality=>{
      app.meta.profile.settings.quality=quality;app.applySettings();vfxSetup();const r=app.run,v=r.vfx.crafted;
      for(let i=0;i<90;i++)v.volume({x:(i%9-4)*1.2,y:.25,z:-Math.floor(i/9)*.9,radius:1.1,height:4,mode:i%2?3:1,type:i%2?'fire':'flying',color:i%2?0xff803e:0x92cfcc,duration:2});
      vfxAdvance(7);return {quality,volumes:v.entries.length,limit:v.limit,mesh:v.mesh.count,particles:r.vfx.add.n,normal:r.vfx.norm.n,pointLights:r.terrain.workshopPointLights.length,particleLimit:r.performance.particles,normalLimit:r.performance.normalParticles};
    },quality);assert.ok(state.volumes>0&&state.volumes<=state.limit&&state.mesh<=state.limit);assert.ok(state.particles<=state.particleLimit&&state.normal<=state.normalLimit);assert.equal(state.pointLights,4);report.budgets.push(state);
  }
  report.feedback=await page.evaluate(()=>{
    app.meta.profile.settings.quality='high';app.applySettings();vfxSetup();const r=app.run,v=r.vfx.crafted;
    r.player.stats.critChance=1;r.combat.hit(1,10,{type:'fire',cls:'special',noReact:true,slot:0});
    const critical={hitstop:r.hitstopT,trauma:r.trauma,impacts:v.impacts,squash:r.enemies.squash[1]};
    const e=v.volume({x:0,y:.25,z:-3,radius:1.5,height:5,mode:3,type:'fire',color:0xff803e,duration:2});
    v.update(.1);const age=e.age;for(let i=0;i<60;i++)v.update(0);const paused=e.age===age;
    r.renderWorld(0);const light=r.terrain.workshopPointLights[0];
    const shading={count:r.terrain.workshopPointLights.length,x:light.position.x,y:light.position.y,z:light.position.z,intensity:light.intensity};
    r.vfx.norm.spawn({x:0,y:1,z:0,vy:-5,gravity:12,life:2,size:.3,endSize:.1,color:0xffefce,shape:4});
    for(let i=0;i<9;i++)r.vfx.norm.update(.1);
    const floor=r.vfx.norm.n?Math.min(...r.vfx.norm.py.slice(0,r.vfx.norm.n)):0;
    r.hideOwnFx=true;v.update(0);const hidden=v.entries.length===0;r.hideOwnFx=false;
    return {critical,paused,shading,floor,hidden};
  });
  assert.ok(report.feedback.critical.hitstop>=.03&&report.feedback.critical.trauma>0&&report.feedback.critical.squash!==0);
  assert.ok(report.feedback.paused&&report.feedback.hidden);assert.ok(report.feedback.floor>=.239);assert.equal(report.feedback.shading.count,4);assert.ok(report.feedback.shading.intensity>0);
  report.cleanup=await page.evaluate(()=>{const r=app.run;r.vfx.clear();r.projectiles.clear();r.zones.clear();vfxDraw(false);return {entries:r.vfx.crafted.entries.length,keys:r.vfx.crafted.keys.size,lights:r.vfx.crafted.lightSources.length,count:r.vfx.crafted.mesh.count};});
  assert.deepEqual(report.cleanup,{entries:0,keys:0,lights:0,count:0});
  report.steadyLighting=await page.evaluate(()=>{
    const r=app.run,t=r.terrain;r.vfx.clear();r.pushLook();
    const capture=()=>JSON.stringify([t.workshopPointLights.map(l=>[...l.position.toArray(),l.intensity]),t.workshopGlows.map(m=>m.emissiveIntensity),app.r.bloom.intensity]);
    const before=capture();for(let j=0;j<40;j++){r.player.pos.x=j*.3;r.renderWorld(.05);}
    r.vfx.crafted.nova('fire',0,.3,0,5);r.vfx.update(.05);r.renderWorld(.05);
    return {unchanged:before===capture(),sensors:t.workshopLamps.filter(l=>l.reactive).length};
  });assert.ok(report.steadyLighting.unchanged && report.steadyLighting.sensors>0,'Fixed lights must stay stable while distance-sensitive bulbs remain available');
  await screenshot('steady-room-lights');
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:2});await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));vfxSetup();app.run.ult.charge=1;app.run.ult.fire();vfxAdvance(9);});
    await screenshot('wind-screen-'+width);
  }
  await page.evaluate(()=>{app.run.pushLook();vfxSetup();app.run.vfx.crafted.cone('daylight-demo',0,.8,0,0,-1,7,'fire',1);vfxAdvance(2);app.run.vfx.crafted.cone('daylight-demo',0,.8,0,0,-1,7,'fire',1);vfxDraw(false);});
  await screenshot('daylight-fire-lights');
  const pixels=await sharp(path.join(dir,'daylight-fire-lights.png')).resize(160,320).removeAlpha().raw().toBuffer();let black=0;for(let i=0;i<pixels.length;i+=3)if(pixels[i]+pixels[i+1]+pixels[i+2]===0)black++;
  assert.ok(black/(pixels.length/3)<.02,'No NaN/bloom black regions');
  fs.writeFileSync(path.join(dir,'stylized-vfx-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Stylized VFX verified: 18 actual moves, nine actual ultimates, burning/fluid shaders, stable room lights, ink-painted maps, original camera, three quality budgets and cleanup.');
  return report;
}
