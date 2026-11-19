import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewFrameStability(page,dir,baseline=false){
  const report={environment:'Compiled WeChat game / Chrome SwiftShader. Work counts, not phone FPS.',baseline};
  report.fireBuffers=await page.evaluate(async()=>{
    const run=app.run,jet=run.vfx.crafted.fireJet,p=run.player.pos;
    await jet.ready;jet.clear();
    const emitter={x:p.x,y:p.y+1,z:p.z,length:9,artLength:7,angle:.3,age:.35,seed:.2,own:true,type:'fire',def:{key:'flamethrower'}};
    const snapshots=[],instances=jet.instances,hits=jet.hits;
    let replacements=0,samples=0;
    for(let frame=0;frame<120;frame++){
      const before=new Map(jet.packets.map(p=>[p,p.sample]));
      emitter.age+=1/30;emitter.fireTouched=true;
      if(frame%4===0)jet.impact(p.x+frame%3,p.y+1,p.z);
      jet.update(1/30,[emitter]);
      for(const p of jet.packets)if(before.get(p)){samples++;if(before.get(p)!==p.sample)replacements++;}
      if(frame===3||frame===30||frame===90)snapshots.push([jet,jet.legacy,{mesh:jet.hitMesh,attributes:jet.hitAttributes}].map(r=>({count:r.mesh.count,buffers:r.attributes.map(a=>Array.from(a.array.slice(0,r.mesh.count*4)))})));
    }
    const reuse={samples,replacements,instances:instances===jet.instances,hits:hits===jet.hits};
    jet.clear();return {snapshots,reuse};
  });
  console.log('Continuous flame reuse',JSON.stringify(report.fireBuffers.reuse));
  report.burst=await page.evaluate(()=>{
    const run=app.run,p=run.player,enemies=run.enemies,fx=run.vfx;
    run.ult.clear();run.zones.clear();run.projectiles.clear();run.pickups.clear();fx.clear();enemies.clear();
    run.director.update=run.capture.update=run.events.update=run.minibosses.update=()=>{};
    run.nextCp=1e9;run.nextEvo=null;run.pendingLevels=0;run.time=run.stageTime=120;
    run.weather='clear';
    run.renderWorld(0);
    const random=Math.random;Math.random=()=>.43;
    p.stats.critChance=1;p.stats.megaCrit=1;
    const ids=[];
    for(let i=0;i<200;i++){
      const angle=i*2.39996,radius=2+i%40*.2;
      const id=enemies.spawn(19,p.pos.x+Math.cos(angle)*radius,p.pos.z+Math.sin(angle)*radius,1e7,1,131072);
      if(id<0)throw Error('Cannot seed crowded burst');enemies.flags[id]&=~131072;ids.push(id);
    }
    let total=0;const started=performance.now();
    try{for(const id of ids)total+=run.combat.hit(id,100,{type:'fire',cls:'special',slot:8,noReact:true});}
    finally{Math.random=random;}
    return {enemies:enemies.count,damage:total,weather:run.weather,rings:fx.rings.n,particles:fx.add.n,
      impacts:fx.crafted.fireFamily.events.length,cpuMs:performance.now()-started,
      hp:ids.map(id=>enemies.hp[id]),criticalHits:run.stats.crits};
  });
  console.log('Crowded critical burst',JSON.stringify({...report.burst,hp:undefined}));
  if(!baseline){
    assert.equal(report.burst.enemies,200);
    assert.ok(report.burst.rings<=20,'Crowd critical decorations must have a bounded burst cost');
    if(process.env.POKEBONK_FRAME_BASELINE){
      const before=JSON.parse(fs.readFileSync(process.env.POKEBONK_FRAME_BASELINE,'utf8'));
      assert.equal(report.burst.damage,before.burst.damage);assert.deepEqual(report.burst.hp,before.burst.hp);
      assert.deepEqual(report.fireBuffers.snapshots,before.fireBuffers.snapshots,'Flame buffer output must preserve the exact animation');
    }
    assert.equal(report.fireBuffers.reuse.replacements,0);assert.ok(report.fireBuffers.reuse.samples>100);
    assert.ok(report.fireBuffers.reuse.instances&&report.fireBuffers.reuse.hits);
    report.settings=await page.evaluate(async()=>{
      const env=inspected.env,doc=inspected.doc,device=env.nativeDevice,originalDevice={...device},originalSettings={...app.meta.profile.settings};
      const samples=[],click=text=>{const b=[...doc.querySelectorAll('button')].find(b=>b.textContent===text);if(!b)throw Error('Missing '+text);b.click();};
      const show=()=>{app.zixing.settings(()=>{});click('画面');click('性能视野');};
      const state=()=>({fps:app.fpsCap(),checked:doc.querySelector('[aria-label="锁定 30 帧"]')?.getAttribute('aria-checked'),mode:app.meta.profile.settings.frameRateMode});
      try{
        for(const platform of ['android','ios'])for(const modelLevel of [1,2,3]){
          Object.assign(device,{platform,modelLevel,benchmarkLevel:40,model:platform==='ios'?'iPhone 16 Pro':'fixture phone'});
          app.meta.profile.settings={...originalSettings,lock30Fps:false};delete app.meta.profile.settings.frameRateMode;
          app.applySettings();show();const initial=state();
          const phases=[];for(const value of ['play','paused','modal','over','transition']){app.run.state=value;phases.push(Math.round(1000/realFrameGap()));}
          app.run.state='play';app.pacer.reset();app.pacer.ready(5000,realFrameGap());
          const nativeRate=window.fixtureFrameRates.at(-1);
          doc.querySelector('[aria-label="锁定 30 帧"]').click();const manual=state();
          await app.meta.saveNow();await app.meta.load(app.meta.account);app.applySettings();show();const persisted=state();
          // A late device reply cannot override a manual choice.
          device.modelLevel=modelLevel===1?2:1;env.dispatchEvent(new env.Event('deviceperformancechange'));
          const afterReply=state();
          click('恢复本页默认');const reset=state();
          // With auto active, a late reply also synchronizes the visible switch.
          device.modelLevel=modelLevel;env.dispatchEvent(new env.Event('deviceperformancechange'));
          const autoReply=state();
          samples.push({platform,modelLevel,initial,phases,nativeRate,manual,persisted,afterReply,reset,autoReply,quality:app.meta.profile.settings.quality});
        }
      }finally{
        Object.assign(device,originalDevice);app.meta.profile.settings=originalSettings;app.applySettings();show();
        env.drawUI(app.r.renderer,true);
      }
      return samples;
    });
    for(const sample of report.settings){
      const initial=sample.modelLevel===1?60:30,manual=initial===30?60:30;
      assert.equal(sample.initial.fps,initial);assert.equal(sample.initial.checked,String(initial===30));assert.equal(sample.initial.mode,'auto');
      assert.ok(sample.phases.every(fps=>fps===initial));assert.equal(sample.nativeRate,initial);
      for(const key of ['manual','persisted','afterReply'])assert.deepEqual(sample[key],{fps:manual,checked:String(manual===30),mode:'manual'});
      assert.equal(sample.reset.mode,'auto');assert.equal(sample.reset.fps,manual);assert.equal(sample.autoReply.fps,initial);
      assert.equal(sample.autoReply.checked,String(initial===30));assert.equal(sample.quality,'high');
    }
    await page.screenshot({path:path.join(dir,'frame-settings.png')});
    console.log('Device settings',JSON.stringify(report.settings));
  }
  fs.writeFileSync(path.join(dir,'frame-stability.json'),JSON.stringify(report,null,2));
  return report;
}
