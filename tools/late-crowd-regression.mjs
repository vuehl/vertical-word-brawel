import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// Controlled five-minute load, not a replay of five minutes or phone FPS.
export async function reviewLateCrowd(page,dir){
  if(process.argv.includes('--soak'))return soak(page,dir);
  const report={environment:'Chrome / compiled WeChat developer package, CPU timings only; not phone FPS.',samples:[]};
  for(const quality of ['low','high'])for(const count of [200,600,1000]){
    const result=await page.evaluate(async({quality,count})=>{
      const run=app.run,api=inspected.env.__zixingDeveloper;
      api.close();Object.assign(api.options,{lockCount:true,invincible:true,monitor:false});
      app.meta.profile.settings.quality=quality;app.applySettings();
      api.apply({time:300,count,mode:'timed',boss:'none'});
      const e=run.enemies;for(let i=0;i<e.n;i++)if(e.alive[i])e.hp[i]=e.maxHp[i]=1e10;
      for(let i=0;i<60;i++)run.update(1/60);
      // Instrument only meaningful phases; don't allocate one timing per actor.
      const stats={},restore=[];
      function wrap(object,key,label){const original=object[key],s=stats[label]={calls:0,ms:0};
        object[key]=function(...args){const t=performance.now();try{return original.apply(this,args);}finally{s.calls++;s.ms+=performance.now()-t;}};
        restore.push(()=>object[key]=original);}
      for(const [obj,key,label] of [[run,'simulate','simulate'],[run,'renderWorld','renderWorld'],[run.enemies,'update','enemies'],[run.projectiles,'update','projectiles'],[run.zones,'update','zones'],[run.ui,'hud','hud'],[run.vfx,'update','vfx']])wrap(obj,key,label);
      wrap(run.projectiles,'fire','fire');wrap(run.combat,'tickStatus','actorTicks');wrap(e,'within','within');
      let queries=0,candidates=0,separationVisits=0,peakShots=0,peakZones=0;
      const query=e.grid.query;e.grid.query=function(...args){queries++;const n=query.apply(this,args);candidates+=n;return n;};restore.push(()=>e.grid.query=query);
      const frames=[],uploads=auditUIUploads,bytes=auditUploadBytes;
      try{
        for(let i=0;i<240;i++){
          const t=performance.now();run.update(1/60);frames.push(performance.now()-t);
          separationVisits+=e.grid.separationVisits;peakShots=Math.max(peakShots,run.projectiles.used);peakZones=Math.max(peakZones,run.zones.list.length);
          if(i%30===0){app.r.render(1/60);inspected.env.drawUI(app.r.renderer);await new Promise(r=>setTimeout(r,0));}
        }
        frames.sort((a,b)=>a-b);
        return {quality,count,actual:e.count,ordinary:api.snapshot().ordinary,stageTime:run.stageTime,state:run.state,stats,queries,candidates,separationVisits,peakShots,peakZones,
          effectLimits:[run.vfx.add.limit,run.vfx.norm.limit,run.vfx.text.limit],effects:[run.vfx.add.n,run.vfx.norm.n,run.vfx.text.items.length],
          damage:run.player.moves.reduce((n,m)=>n+(m?.damageDone||0),0),meanMs:frames.reduce((a,b)=>a+b,0)/frames.length,p95Ms:frames[Math.floor(frames.length*.95)],
          fullUploads:auditUIUploads-uploads,uploadBytes:auditUploadBytes-bytes};
      }finally{restore.forEach(f=>f());}
    },{quality,count});
    report.samples.push(result);fs.writeFileSync(path.join(dir,'late-crowd.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(result));
    assert.equal(result.state,'play');assert.equal(result.ordinary,count);assert.ok(result.damage>0&&result.stats.fire.calls>0&&result.peakZones>0);
    assert.ok(result.effects.every((n,i)=>n<=result.effectLimits[i]));
    if(quality==='high'&&count>=600)assert.deepEqual(result.effectLimits,[600,300,48]);
  }
  await page.screenshot({path:path.join(dir,'five-minute-crowd.png')});
  return report;
}

async function soak(page,dir){
  await page.evaluate(()=>{
    const r=app.run,api=inspected.env.__zixingDeveloper;api.close();
    Object.assign(api.options,{lockCount:true,invincible:true,monitor:false});
    app.meta.profile.settings.quality='low';app.applySettings();api.apply({time:300,count:600,mode:'timed',boss:'none'});
    for(let i=0;i<r.enemies.n;i++)if(r.enemies.alive[i])r.enemies.hp[i]=r.enemies.maxHp[i]=1e10;
  });
  const samples=[];
  for(let chunk=0;chunk<10;chunk++){
    const sample=await page.evaluate(()=>{
      const r=app.run;for(let i=0;i<900;i++)r.update(1/30);
      const e=r.enemies;let finite=true;
      for(let i=0;i<e.n;i++)if(e.alive[i]&&!Number.isFinite(e.x[i]+e.y[i]+e.z[i]+e.hp[i]))finite=false;
      return {stageTime:r.stageTime,state:r.state,ordinary:inspected.env.__zixingDeveloper.snapshot().ordinary,finite,
        enemySlots:e.n,projectileSlots:r.projectiles.n,pickupSlots:r.pickups.n,particles:r.vfx.add.n+r.vfx.norm.n,
        textures:app.r.renderer.info.memory.textures,damage:r.stats.damage};
    });
    samples.push(sample);console.log('Soak '+(chunk+1)+'/10 '+JSON.stringify(sample));
    assert.equal(sample.state,'play');assert.equal(sample.ordinary,600);assert.ok(sample.finite);
  }
  fs.writeFileSync(path.join(dir,'late-crowd-soak.json'),JSON.stringify({note:'9000 updates at 1/30: five minutes of input dt, rendered frames excluded; not five minutes of phone wall-clock/thermal testing.',samples},null,2));
  assert.ok(samples.at(-1).stageTime>580);
  assert.equal(samples.at(-1).enemySlots,samples[0].enemySlots);
}
