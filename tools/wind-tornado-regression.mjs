import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Called after the common VFX fixture by --vfx --wind-tornado. Every pictured
// vortex comes from an actual wind ultimate in the compiled WeChat game.
export async function reviewWindTornado(page,dir){
  const report={environment:'Actual compiled WeChat game / Chrome SwiftShader; controlled inputs and original gameplay camera. Not phone FPS.',lights:{},ultimates:[],budgets:[],screens:[]};
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));vfxDraw(true);});
  const shot=async name=>{await page.screenshot({path:path.join(dir,name+'.png')});report.screens.push(name);};
  const lightState=()=>page.evaluate(()=>({on:app.run.roomLightsOn,label:inspected.doc.querySelector('[data-action="room-light"]')?.textContent,night:app.run.terrain.workshopNight}));
  const toggleLight=()=>page.evaluate(()=>{
    const button=inspected.doc.querySelector('[data-action="room-light"]');if(!button)throw Error('Room light switch is missing');
    button.click();vfxDraw(true);
    return {on:app.run.roomLightsOn,label:button.textContent,night:app.run.terrain.workshopNight};
  });
  report.lights.initial=await lightState();
  assert.deepEqual(report.lights.initial,{on:false,label:'开灯',night:true},'A new run starts with room lights off and an available light switch');
  await shot('01-start-with-lights-off');
  report.lights.manualOn=await toggleLight();
  assert.deepEqual(report.lights.manualOn,{on:true,label:'关灯',night:false},'Player can turn on the room with the existing button');
  await shot('02-player-turns-lights-on');
  report.propClearance=await page.evaluate(()=>{
    const props=app.run.terrain.zxProps;
    const nearest=(kind,x,z)=>{
      const candidates=props.filter(p=>p.kind===kind).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z));
      if(!candidates[0])throw Error('Missing scene prop '+kind);return candidates[0];
    };
    const axes=p=>{const a=p.angle||0;return [[Math.cos(a),-Math.sin(a)],[Math.sin(a),Math.cos(a)]];};
    // Project both oriented footprints onto each rectangle's axes. A positive
    // separation proves the actual props leave a gap, regardless of rotation.
    const clearance=(a,b)=>{
      const aa=axes(a),bb=axes(b),dx=b.x-a.x,dz=b.z-a.z;
      const projection=(p,basis,axis)=>p.w/2*Math.abs(basis[0][0]*axis[0]+basis[0][1]*axis[1])+p.d/2*Math.abs(basis[1][0]*axis[0]+basis[1][1]*axis[1]);
      const separation=Math.max(...[...aa,...bb].map(axis=>Math.abs(dx*axis[0]+dz*axis[1])-projection(a,aa,axis)-projection(b,bb,axis)));
      return {a:{...a},b:{...b},separation};
    };
    const pencil=nearest('colored-pencil',-12,15),handheld=nearest('brick-game',-6,6),car=nearest('mini-4wd',10,9);
    return {handheldPencil:clearance(handheld,pencil),eraserCar:clearance(nearest('eraser',5,1),car),tapeCar:clearance(nearest('masking-tape',4,20),car)};
  });
  assert.ok(report.propClearance.handheldPencil.separation>1,'Handheld must sit beside the pencil with a visible footprint gap');
  assert.ok(report.propClearance.eraserCar.separation>0,'Eraser must not intersect the racing car');
  assert.ok(report.propClearance.tapeCar.separation>0,'Tape roll must not intersect the racing car');
  for(const [name,x,z] of [['03-handheld-and-pencil-clearance',-9,10],['04-wood-floor-surface',39,-1]]){
    await page.evaluate(([x,z])=>{
      vfxSetup();const r=app.run;r.enemies.clear();r.player.pos.set(x,0,z);r.camTarget.copy(r.player.pos);vfxDraw(false);
    },[x,z]);
    await shot(name);
  }
  await page.evaluate(()=>{vfxSetup();vfxDraw(true);});
  report.lights.manualOff=await toggleLight();
  assert.deepEqual(report.lights.manualOff,{on:false,label:'开灯',night:true});

  const startUltimate=async(species,quality='high')=>page.evaluate(async({species,quality})=>{
    Object.assign(app.meta.profile.settings,{quality,batterySaver:false});app.applySettings();
    // 17 is an evolved stage, not a selectable starter. Enter through the
    // actual wind starter and then exercise the controlled evolved character.
    if(!await app.startRun({species:16,biome:'forest',tier:0,boosts:[],mode:'standard'}))throw Error('Could not start wind character '+species);
    app.halted=true;app.run.player.setSpecies(species);vfxSetup();
    await Promise.all([...app.run.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready));
    app.run.ult.charge=1;app.run.ult.fire();vfxAdvance(5);
    return {species:app.run.player.speciesId,initialLights:app.run.roomLightsOn,camera:app.run.camDist};
  },{species,quality});
  const windState=()=>page.evaluate(()=>{
    const r=app.run,v=r.vfx.crafted,e=v.entries.find(e=>e.mode===1&&e.type==='flying'&&typeof e.key==='object');
    return {species:r.player.speciesId,active:r.ult.active,camera:r.camDist,wind:e?{x:e.x,y:e.y,z:e.z,age:e.age,radius:e.radius,height:e.height}:null,
      volumes:v.mesh.count,volumeLimit:v.limit,particles:r.vfx.add.n,normal:r.vfx.norm.n,particleLimit:r.performance.particles,normalLimit:r.performance.normalParticles,damage:r.stats.damage};
  });
  for(const species of [16,17]){
    const initial=await startUltimate(species);assert.equal(initial.initialLights,false);assert.equal(initial.camera,42);
    await page.evaluate(()=>vfxAdvance(6));const before=await windState();
    assert.equal(before.species,species);assert.ok(before.wind,'Real wind ultimate creates a continuous tornado');
    assert.equal(before.camera,42);assert.ok(before.wind.height>before.wind.radius*2,'Vortex is vertically proportioned');
    await shot('wind-'+species+'-night');
    await toggleLight();await shot('wind-'+species+'-day');await toggleLight();
    await page.evaluate(()=>vfxAdvance(3));const after=await windState();assert.ok(after.wind);
    assert.ok(Math.hypot(after.wind.x-before.wind.x,after.wind.z-before.wind.z)>.05,'The real ultimate must advance through the arena');
    assert.ok(after.wind.age>before.wind.age,'Wind ribbon time must advance');
    report.ultimates.push({species,before,after});
  }

  await startUltimate(16);const frames=[];
  for(let i=0;i<20;i++){
    await page.evaluate(()=>vfxAdvance(1,1/20));
    frames.push(await page.screenshot());
  }
  const buffers=await Promise.all(frames.map(frame=>sharp(frame).ensureAlpha().raw().toBuffer()));
  await sharp(Buffer.concat(buffers),{raw:{width:390,height:844*buffers.length,channels:4,pageHeight:844}})
    .gif({delay:Array(buffers.length).fill(50),loop:0}).toFile(path.join(dir,'wind-tornado-in-game.gif'));

  for(const quality of ['low','medium','high']){
    const sample=await page.evaluate(quality=>{
      Object.assign(app.meta.profile.settings,{quality,batterySaver:false});app.applySettings();vfxSetup();
      const r=app.run,v=r.vfx.crafted;
      for(let i=0;i<90;i++)v.volume({x:(i%7-3)*.6,y:.25,z:-Math.floor(i/7)*.35,radius:1.4,height:5.5,mode:1,type:'flying',color:0x5dd7d6,duration:1.2});
      vfxAdvance(6);
      const e=v.entries[0],age=e.age,life=e.life;v.update(0);
      return {quality,volumes:v.mesh.count,volumeLimit:v.limit,particles:r.vfx.add.n,normal:r.vfx.norm.n,particleLimit:r.performance.particles,normalLimit:r.performance.normalParticles,
        pointLights:r.terrain.workshopPointLights.length,paused:e.age===age&&e.life===life};
    },quality);
    assert.ok(sample.volumes>0&&sample.volumes<=sample.volumeLimit);assert.ok(sample.particles<=sample.particleLimit&&sample.normal<=sample.normalLimit);
    assert.equal(sample.pointLights,4);assert.ok(sample.paused);report.budgets.push(sample);
  }
  report.cleanup=await page.evaluate(()=>{
    const r=app.run;r.vfx.clear();r.projectiles.clear();r.zones.clear();vfxDraw(false);const v=r.vfx.crafted;
    return {entries:v.entries.length,keys:v.keys.size,lights:v.lightSources.length,count:v.mesh.count,normal:r.vfx.norm.n,add:r.vfx.add.n};
  });
  assert.deepEqual(report.cleanup,{entries:0,keys:0,lights:0,count:0,normal:0,add:0});
  fs.writeFileSync(path.join(dir,'wind-tornado-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Wind tornado verified: two actual moving ultimates, night start and manual light switch, day/night renders, prop clearance, floor surface, three quality budgets, pause and cleanup.');
  return report;
}
