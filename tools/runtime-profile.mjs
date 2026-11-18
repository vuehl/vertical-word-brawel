import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// Diagnose the compiled native path. CPU timings on desktop SwiftShader are
// comparative only: they are neither GPU timings nor measured phone FPS.
export async function profileRuntime(page,dir){
  const report={environment:'Compiled WeChat game / Chrome SwiftShader; inclusive CPU timings, NOT phone FPS.',samples:[]};
  for(const quality of ['low','high'])for(const count of [0,200]){
    await page.evaluate(({count,quality})=>{
      const run=app.run,p=run.player;
      app.meta.profile.settings.quality=quality;app.applySettings();app.r.setDynRes(1);
      run.director.update=run.director.startFinalSwarm=()=>{};run.queueLevelUp=()=>{};run.pendingLevels=0;
      run.events.update=run.minibosses.update=()=>{};
      run.time=run.stageTime=600;run.nextCp=1e9;
      run.capture.state='done';run.enemies.clear();p.hp=p.maxHp=1e9;
      for(let i=0;i<count;i++){
        const angle=i*2.39996,distance=4+(i%60)*.24;
        run.enemies.spawn([16,19,21][i%3],p.pos.x+Math.cos(angle)*distance,p.pos.z+Math.sin(angle)*distance,1000,1,0);
      }
      for(let i=0;i<15;i++)run.update(1/60);
      app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    },{count,quality});
    await new Promise(resolve=>setTimeout(resolve,300));
    const client=await page.createCDPSession();
    await client.send('Profiler.enable');await client.send('Profiler.setSamplingInterval',{interval:500});await client.send('Profiler.start');
    const sample=await page.evaluate(async ({count,quality})=>{
      const run=app.run,r=app.r,stats={},saved=[],frames=[];
      const wrap=(object,key,label)=>{
        if(typeof object?.[key]!=='function')return;
        const original=object[key],values=stats[label]=[];saved.push(()=>object[key]=original);
        object[key]=function(...args){const start=performance.now();try{return original.apply(this,args);}finally{values.push(performance.now()-start);}};
      };
      for(const name of ['update','simulate','renderWorld','updateCamera','castMove'])wrap(run,name,'run.'+name);
      for(const name of ['enemies','projectiles','pickups','interactables','terrain','player','vfx','zones','allies','mapEvents']){
        for(const method of ['update','render'])wrap(run[name],method,name+'.'+method);
      }
      wrap(run.enemies.grid,'build','grid.build');wrap(run.enemies.grid,'separate','grid.separate');
      for(const name of ['height','surface','waterAt','resolve'])wrap(run.terrain,name,'terrain.'+name);
      for(const name of ['begin','end'])wrap(run.sprites,name,'sprites.'+name);
      wrap(run.ui,'hud','ui.hud');wrap(inspected.layout,'refresh','ui.layout');
      wrap(r,'render','renderer.render');wrap(inspected.env,'drawUI','ui.draw');
      const startUploads=auditUIUploads,startBytes=auditUploadBytes;
      const summarize=values=>{
        const sorted=[...values].sort((a,b)=>a-b),total=values.reduce((a,b)=>a+b,0);
        return {calls:values.length,totalMs:total,meanMs:total/values.length||0,p50Ms:sorted[Math.floor(sorted.length*.5)]||0,p95Ms:sorted[Math.floor(sorted.length*.95)]||0,maxMs:sorted.at(-1)||0};
      };
      try{
        for(let i=0;i<90;i++){
          const before=auditUIUploads,start=performance.now();
          run.update(1/60);r.render(1/60);inspected.env.drawUI(r.renderer);
          frames.push({ms:performance.now()-start,uiUpload:auditUIUploads!==before});
          await new Promise(resolve=>setTimeout(resolve,17));
        }
        const output={quality,enemiesRequested:count,enemies:run.enemies.count,state:run.state,
          phases:Object.fromEntries(Object.entries(stats).map(([key,values])=>[key,summarize(values)])),
          frames:summarize(frames.map(f=>f.ms)),withUIUpload:summarize(frames.filter(f=>f.uiUpload).map(f=>f.ms)),withoutUIUpload:summarize(frames.filter(f=>!f.uiUpload).map(f=>f.ms)),
          uiUploads:auditUIUploads-startUploads,uploadBytes:auditUploadBytes-startBytes,
          worldSize:[r.composer.inputBuffer.width,r.composer.inputBuffer.height],uiSize:[inspected.uiCanvas.width,inspected.uiCanvas.height],
          resources:{...r.renderer.info.memory,programs:r.renderer.info.programs.length},
          music:{enabled:inspected.env.backgroundMusicEnabled,loading:run.audio.trackLoading,cached:run.audio.trackBytes.size,playing:!!run.audio.track}};
        return output;
      }finally{for(const restore of saved)restore();}
    },{count,quality});
    const {profile}=await client.send('Profiler.stop');await client.detach();
    fs.writeFileSync(path.join(dir,'cpu-'+quality+'-'+count+'.cpuprofile'),JSON.stringify(profile));
    report.samples.push(sample);
    fs.writeFileSync(path.join(dir,'runtime-profile.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({quality,enemies:sample.enemies,frames:sample.frames,uiUploads:sample.uiUploads,uploadBytes:sample.uploadBytes,music:sample.music}));
    assert.equal(sample.state,'play');assert.equal(sample.enemies,count);
    assert.equal(sample.music.enabled,false);assert.equal(sample.music.cached,0);assert.equal(sample.music.playing,false);
  }
  return report;
}
