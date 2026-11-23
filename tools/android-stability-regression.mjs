import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function reviewAndroidStability(page,dir,baseline=false){
  const report={environment:'Compiled WeChat game / Chrome SwiftShader. Fixed 30 Hz steps and WebGL work counts; NOT Android phone FPS.',baseline,ultimates:[]};
  report.coldEffects=await page.evaluate(()=>{
    const run=app.run,host=app.r,renderer=host.renderer,gl=renderer.getContext(),env=inspected.env;
    const createBuffer=gl.createBuffer,createProgram=gl.createProgram;let buffers=0,programs=0;
    gl.createBuffer=function(...args){buffers++;return createBuffer.apply(this,args);};
    gl.createProgram=function(...args){programs++;return createProgram.apply(this,args);};
    const p=run.player.pos;
    try{
      run.vfx.crafted.fireFamily.ultimate({x:p.x,y:p.y,z:p.z,tier:2});
      run.vfx.update(.35);host.render(0);
      const effects={buffers,programs,main:run.vfx.crafted.fireFamily.mesh.count,cloud:run.vfx.crafted.fireFamily.topMesh.count};
      env.drawUI(renderer);const before=auditUIUploads;
      const timeout=env.setTimeout;env.setTimeout=()=>0;
      try{run.ui.ultCutIn(run.player.speciesId,run.ult.name,0xff8833);}finally{env.setTimeout=timeout;}
      env.drawUI(renderer);
      const layer=inspected.hudLayers.find(tile=>tile.id==='ultimate-cutin');
      return {...effects,cutInFullUploads:auditUIUploads-before,cutInSize:layer?.canvas?[layer.canvas.width,layer.canvas.height]:null,error:gl.getError()};
    }finally{gl.createBuffer=createBuffer;gl.createProgram=createProgram;}
  });
  await page.screenshot({path:path.join(dir,'ultimate-cutin.png')});
  report.coldEffects.removeFullUploads=await page.evaluate(()=>{
    const before=auditUIUploads;
    app.run.ui.hudEl.querySelectorAll('.ultcut').forEach(node=>node.remove());
    inspected.env.drawUI(app.r.renderer);app.run.vfx.clear();app.run.renderWorld(0);
    return auditUIUploads-before;
  });
  console.log('Cold ultimate effects',JSON.stringify(report.coldEffects));
  if(!baseline){
    assert.equal(report.coldEffects.buffers,0,'Prepared ultimate batches must not allocate GPU buffers on first use');
    assert.equal(report.coldEffects.programs,0);assert.equal(report.coldEffects.cutInFullUploads,0);
    assert.equal(report.coldEffects.removeFullUploads,0);assert.ok(report.coldEffects.main>0&&report.coldEffects.cloud>0);
  }
  if(!baseline){
    report.settings=await page.evaluate(()=>{
      const settings=app.meta.profile.settings,run=app.run,doc=inspected.doc;
      app.zixing.settings(()=>{});
      const click=(selector,text)=>{const button=[...doc.querySelectorAll(selector)].find(e=>e.textContent===text);if(!button)throw Error('Missing '+text);button.click();};
      const toggle=()=>doc.querySelector('[aria-label="锁定 30 帧"]');
      const initial=toggle().getAttribute('aria-checked');toggle().click();
      const quality=settings.quality,phases=[];
      for(const state of ['play','paused','modal','over','transition']){
        run.state=state;phases.push(Math.round(1000/realFrameGap()));
      }
      for(const text of ['流畅','均衡','精致']){click('.zx-option',text);phases.push(app.fpsCap());}
      if(doc.querySelector('[aria-label="省电模式"]'))throw Error('Removed power option is still visible');
      const afterQuality=app.fpsCap();
      click('.zx-option','精致');
      inspected.env.drawUI(app.r.renderer,true);
      return {initial,quality,phases,afterQuality,selected:toggle().getAttribute('aria-checked')};
    });
    await page.screenshot({path:path.join(dir,'lock-30-settings.png')});
    report.settings.unlocked=await page.evaluate(()=>{
      const doc=inspected.doc;
      doc.querySelector('[aria-label="锁定 30 帧"]').click();
      const result={fps:app.fpsCap(),enabled:app.meta.profile.settings.lock30Fps,quality:app.meta.profile.settings.quality};
      app.setScreen(null);app.run.state='play';app.run.update(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);
      return result;
    });
    assert.equal(report.settings.initial,'false');assert.equal(report.settings.selected,'true');
    assert.equal(report.settings.quality,'high');assert.ok(report.settings.phases.every(fps=>fps===30));
    assert.equal(report.settings.afterQuality,30);assert.deepEqual(report.settings.unlocked,{fps:60,enabled:false,quality:'high'});
  }
  await page.evaluate(async()=>{
    const run=app.run,renderer=app.r.renderer;
    app.halted=true;run.godMode=true;run.queueLevelUp=()=>{};
    run.director.update=run.director.startFinalSwarm=run.capture.update=run.events.update=run.minibosses.update=()=>{};
    run.interactables.update=()=>{};run.capture.state='done';run.nextCp=1e9;
    run.player.hp=run.player.maxHp=1e9;run.player.moves=[];
    run.time=run.stageTime=120;run.timers.length=0;run.anims.length=0;
    const gl=renderer.getContext(),saved=[],counts={programs:0,uploads:0,bytes:0,buffers:0};
    const wrap=(key,fn)=>{const original=gl[key];saved.push(()=>gl[key]=original);gl[key]=function(...args){fn(args);return original.apply(this,args);};};
    wrap('createProgram',()=>counts.programs++);wrap('createBuffer',()=>counts.buffers++);
    for(const key of ['texImage2D','texSubImage2D'])wrap(key,args=>{
      counts.uploads++;const src=args.at(-1),explicit=args.length>=9;
      counts.bytes+=(explicit?(key==='texImage2D'?args[3]*args[4]:args[4]*args[5]):(src?.width||0)*(src?.height||0))*4;
    });
    window.stability={counts,restore:()=>saved.reverse().forEach(fn=>fn())};
  });
  try{
    report.gameplay=await page.evaluate(()=>{
      const run=app.run,generator=Object.values(run).find(value=>value?.rng?.next)?.rng;
      if(!generator)throw Error('Missing gameplay RNG');
      const prototype=Object.getPrototypeOf(generator),next=prototype.next,random=Math.random;
      const renderWorld=run.renderWorld,hud=run.ui.hud;
      const samples=[];
      prototype.next=Math.random=()=>.43;
      // The complete combat simulation runs; skip scene submission for this
      // deterministic damage/timing check so software GPU speed cannot affect it.
      run.renderWorld=()=>{};run.ui.hud=()=>{};
      try{
        for(const species of [4,5,6]){
          run.ult.clear();run.zones.clear();run.projectiles.clear();run.pickups.clear();run.vfx.clear();run.enemies.clear();
          run.timers.length=0;run.anims.length=0;run.time=run.stageTime=120;
          run.player.setSpecies(species);run.player.evoStage=species-4;run.player.growth=0;
          run.player.pos.copy(run.terrain.spawn);run.player.vel.set(0,0,0);run.player.kx=run.player.kz=0;
          run.stats.damage=run.stats.ultDamage=0;
          const p=run.player.pos;
          for(let i=0;i<200;i++){
            const angle=i*2.39996,radius=2+(i%40)*.22;
            const id=run.enemies.spawn([16,19,21][i%3],p.x+Math.cos(angle)*radius,p.z+Math.sin(angle)*radius,1e7,1,131072);
            if(id<0)throw Error('Cannot seed 200 enemies');run.enemies.flags[id]&=~131072;
          }
          run.ult.charge=1;run.ult.fire();const trace=[];
          for(let frame=0;frame<180;frame++){
            run.update(1/30);
            if(frame%30===29)trace.push({damage:Math.round(run.stats.ultDamage*1e4)/1e4,
              active:Math.round(run.ult.active*1e4)/1e4,zones:run.zones.list.length,enemies:run.enemies.count});
          }
          samples.push({species,trace});
        }
      }finally{prototype.next=next;Math.random=random;run.renderWorld=renderWorld;run.ui.hud=hud;}
      run.ult.clear();run.zones.clear();run.vfx.clear();run.enemies.clear();run.player.setSpecies(4);run.player.evoStage=0;
      run.timers.length=0;run.anims.length=0;
      return samples;
    });
    if(!baseline&&process.env.POKEBONK_STABILITY_BASELINE){
      const previous=JSON.parse(fs.readFileSync(process.env.POKEBONK_STABILITY_BASELINE,'utf8'));
      assert.deepEqual(report.gameplay,previous.gameplay,'Ultimate damage, duration and burn zones must remain unchanged');
    }
    console.log('Ultimate gameplay',JSON.stringify(report.gameplay));
    if(!baseline){
      report.chests=await page.evaluate(async()=>{
        const run=app.run,m=run.interactables,chest=m.list.find(f=>f.kind==='freechest');
        await chest.modelReady;
        const model=chest.model,group=chest.group,reservation=chest.reservation,slots=m.list.length;
        const award=run.rollChestItem;let rewards=0;run.rollChestItem=()=>{rewards++;};
        const refills=[];
        try{
          for(let cycle=0;cycle<5;cycle++){
            const old={x:chest.x,z:chest.z};
            m.openChest(chest,true);m.openChest(chest,true);
            for(let step=0;step<60;step++)run.update(1/30);
            if(chest.group.visible)throw Error('Consumed machine should hide before refill');
            if(chest.model!==model)throw Error('Consumed machine released its prepared model');
            run.time=chest.respawnAt;run.renderWorld(0);
            for(let attempt=0;chest.used&&attempt<Math.ceil(m.chestSites.length/24)+1;attempt++)m.respawnChest(chest);
            refills.push({used:chest.used,fromOld:Math.hypot(chest.x-old.x,chest.z-old.z),
              fromPlayer:Math.hypot(chest.x-run.player.pos.x,chest.z-run.player.pos.z),
              visible:run.sprites.visible(chest.x,chest.y+2,chest.z,8),sameModel:chest.model===model,
              sameGroup:chest.group===group,sameReservation:chest.reservation===reservation,slots:m.list.length,
              reserved:run.terrain.isReserved(chest.x,chest.z,1),halo:chest.halo.visible});
          }
          const sites=m.chestSites,fit=m.fitsOnDesk,visible=run.sprites.visible,reserved=run.terrain.isReserved;
          let collisionChecks=0;
          try{
            chest.used=true;chest.respawnAt=run.time;chest.refillCursor=0;chest.refillChecked=0;
            m.chestSites=Array.from({length:500},()=>({x:1000,z:1000}));
            m.fitsOnDesk=()=>{collisionChecks++;return false;};run.sprites.visible=()=>false;run.terrain.isReserved=()=>false;
            m.respawnChest(chest);
          }finally{m.chestSites=sites;m.fitsOnDesk=fit;run.sprites.visible=visible;run.terrain.isReserved=reserved;}
          return {refills,rewards,slots,collisionChecks,checked:chest.refillChecked};
        }finally{run.rollChestItem=award;}
      });
      assert.equal(report.chests.rewards,5);assert.equal(report.chests.collisionChecks,24);assert.equal(report.chests.checked,24);
      for(const refill of report.chests.refills){
        assert.equal(refill.used,false);assert.ok(refill.fromOld>=32&&refill.fromPlayer>=32);
        assert.equal(refill.visible,false);assert.ok(refill.sameModel&&refill.sameGroup&&refill.sameReservation&&refill.reserved&&refill.halo);
        assert.equal(refill.slots,report.chests.slots);
      }
      console.log('Chest stability',JSON.stringify(report.chests));
    }
    for(const species of process.argv.includes('--stability-probes')?[]:[4,5,6]){
      const sample=await page.evaluate(async species=>{
        const run=app.run,host=app.r,renderer=host.renderer,counts=stability.counts;
        run.ult.clear();run.zones.clear();run.projectiles.clear();run.pickups.clear();run.vfx.clear();run.enemies.clear();
        run.timers.length=0;run.anims.length=0;run.player.setSpecies(species);run.player.evoStage=species-4;run.player.growth=0;
        const p=run.player.pos;
        for(let i=0;i<200;i++){
          const angle=i*2.39996,radius=2+(i%40)*.22;
          const id=run.enemies.spawn([16,19,21][i%3],p.x+Math.cos(angle)*radius,p.z+Math.sin(angle)*radius,1e7,1,131072);
          if(id<0)throw Error('Cannot seed 200 enemies');run.enemies.flags[id]&=~131072;
        }
        await run.sprites.prepareGlyphTextures(renderer,run.player.speciesId);
        run.update(0);host.render(0);inspected.env.drawUI(renderer);
        const before={...counts},fullUploads=auditUIUploads,start=performance.now();run.ult.charge=1;run.ult.fire();
        const fireMs=performance.now()-start,frames=[];
        const reset=renderer.info.autoReset;renderer.info.autoReset=false;
        try{
          for(let frame=0;frame<150;frame++){
            const previous={...counts};renderer.info.reset();
            const begin=performance.now();run.update(1/30);const updated=performance.now();
            host.render(1/30);const drawn=performance.now();inspected.env.drawUI(renderer);
            frames.push({updateMs:updated-begin,renderMs:drawn-updated,uiMs:performance.now()-drawn,
              calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
              programs:counts.programs-previous.programs,bytes:counts.bytes-previous.bytes,
              zones:run.zones.list.length,events:run.vfx.crafted.fireFamily.events.length});
            if(frame%10===0)await new Promise(resolve=>setTimeout(resolve,0));
          }
        }finally{renderer.info.autoReset=reset;}
        return {species,fireMs,counts:Object.fromEntries(Object.keys(counts).map(key=>[key,counts[key]-before[key]])),
          fullUploads:auditUIUploads-fullUploads,damage:run.stats.ultDamage,active:run.ult.active,error:renderer.getContext().getError(),frames};
      },species);
      const summary={...sample};delete summary.frames;
      for(const key of ['updateMs','renderMs','uiMs','calls','triangles','zones','events']){
        const values=sample.frames.map(f=>f[key]).sort((a,b)=>a-b);
        summary[key]={mean:values.reduce((a,b)=>a+b,0)/values.length,p95:values[Math.floor(values.length*.95)],max:values.at(-1)};
      }
      console.log('Ultimate stability',JSON.stringify(summary));report.ultimates.push({...summary,frames:sample.frames});
      fs.writeFileSync(path.join(dir,'android-stability.json'),JSON.stringify(report,null,2));
      assert.equal(sample.error,0);assert.equal(sample.active,0);assert.ok(sample.damage>0);
      if(!baseline)assert.equal(sample.counts.programs,0,'Ultimate casts must not compile shaders');
    }
  }finally{
    await page.evaluate(()=>stability.restore());
    fs.writeFileSync(path.join(dir,'android-stability.json'),JSON.stringify(report,null,2));
  }
  return report;
}
