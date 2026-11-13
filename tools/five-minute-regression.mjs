import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewFiveMinute(page,dir,baseline){
  const result=await page.evaluate(async()=>{
    const r=app.run,e=r.enemies,p=r.player,terrain=r.terrain;
    r.time=r.stageTime=289;r.nextCp=300;p.iframes=1000;
    for(const event of r.director.timeline)event.done=event.t<289;
    e.clear();
    for(let i=0;i<86;i++){
      const radius=4+(i%24),angle=i*2.4;
      e.spawn([16,19,21][i%3],p.pos.x+radius*Math.cos(angle),p.pos.z+radius*Math.sin(angle),1e7,1);
    }
    const initial=e.count;
    const times=[],events=[],checkpoints=[],peaks=[];
    let costs={};
    for(const [object,key,label] of [[r,'simulate','simulation'],[e,'update','enemies'],[r,'renderWorld','scene'],[r.ui,'hud','hud'],[r.vfx,'update','effects'],
      [r.minibosses,'update','miniboss'],[r,'castMove','weapon'],[r.projectiles,'update','projectiles'],[r.zones,'update','zones']]){
      const fn=object[key];
      object[key]=function(...args){const at=performance.now();try{return fn.apply(this,args);}finally{costs[label]=(costs[label]||0)+performance.now()-at;}};
    }
    const fire=r.director.fire.bind(r.director),checkpoint=r.checkpoint.bind(r);
    r.director.fire=kind=>{events.push(kind);return fire(kind);};
    r.checkpoint=()=>{checkpoints.push(r.time);return checkpoint();};
    for(let i=0;i<400;i++){
      costs={};const at=performance.now();r.update(1/30);const ms=performance.now()-at;times.push(ms);
      if(ms>8)peaks.push({frame:i,stageTime:r.stageTime,ms,costs});
      if(i%30===0){app.r.render(1/30);inspected.env.drawUI(app.r.renderer);await new Promise(resolve=>setTimeout(resolve,0));}
    }
    times.sort((a,b)=>a-b);
    // Measure work separately so counting property reads cannot distort timings.
    const surfaces=terrain.workshopGroundSurfaces,grid=terrain.colGrid;
    let planeTests=0,bucketReads=0,heightCalls=0;
    const get=grid.get,height=terrain.workshopGroundY;
    grid.get=function(key){bucketReads++;return get.call(this,key);};
    terrain.workshopGroundY=(x,z)=>{heightCalls++;return height(x,z);};
    for(const surface of surfaces){
      const width=surface.w;
      Object.defineProperty(surface,'w',{configurable:true,get(){planeTests++;return width;}});
    }
    const measuredFrames=60;
    for(let i=0;i<measuredFrames;i++)r.update(1/30);
    return {initial,final:e.count,state:r.state,stageTime:r.stageTime,events,checkpoints,surfaces:surfaces.length,
      measuredFrames,planeTests,heightCalls,bucketReads,frames:times.length,p50Ms:times[200],p95Ms:times[380],maxMs:times.at(-1),
      slowest:peaks.sort((a,b)=>b.ms-a.ms).slice(0,3)};
  });
  result.geometry=await page.evaluate(()=>{
    const r=app.run,t=r.terrain,p=r.player.pos,sh=app.r.sun.shadow;
    let mismatches=0,points=0;
    for(let x=-t.play;x<=t.play;x+=1.25)for(let z=-t.play;z<=t.play;z+=1.25){
      let y=0;
      for(const s of t.workshopGroundSurfaces){
        const dx=x-s.x,dz=z-s.z;
        if(Math.abs(s.cos*dx-s.sin*dz)<s.w/2&&Math.abs(s.sin*dx+s.cos*dz)<s.d/2)y=Math.max(y,s.y);
      }
      points++;if(t.height(x,z)!==y)mismatches++;
    }
    const start=p.clone(),target=r.camTarget.clone();let shadowUpdates=0;
    for(let frame=0;frame<60;frame++){
      p.x=start.x+frame*.035;r.camTarget.copy(p);r.updateCamera(0);sh.needsUpdate=false;r.renderWorld(0);
      if(sh.needsUpdate)shadowUpdates++;
    }
    p.copy(start);r.camTarget.copy(target);r.updateCamera(0);r.renderWorld(0);
    const x=t.play+8,z=8;
    t.resolve(x,z,.5,1000,{});
    const prop={x,z,h:1002,r:.5};t.addCollider(prop);
    const hit=t.hitProp(x,1000,z,.5),pushed=t.resolve(x,z,.5,1000,{}).x>x;
    prop.off=true;
    return {points,mismatches,shadowUpdates,lateCollider:hit&&pushed&&!t.hitProp(x,1000,z,.5)};
  });
  result.upgrade=await page.evaluate(()=>{
    const r=app.run,p=r.player,rt=app.r,transition=inspected.modalTransition;
    const frame=app.loop,render=rt.render,descriptor=Object.getOwnPropertyDescriptor(performance,'now');
    let now=performance.now(),sceneDraws=0,shade=0;
    const start=now,cue=transition.cue,frames=[];
    Object.defineProperty(performance,'now',{configurable:true,value:()=>now});
    try{
      app.loop=()=>{};app.frameGap=()=>1000/60;app.halted=false;app.pacer.reset();app.last=now;
      rt.render=function(...args){sceneDraws++;return render.apply(this,args);};
      if(cue)transition.cue=function(...args){const layer=cue.apply(this,args);if(layer)shade=layer.opacity;return layer;};
      delete r.queueLevelUp;r.pendingLevels=0;p.xp=p.xpNext*.99;r.ui.hud(r);
      p.addXp((p.xpNext-p.xp+2)/(p.stats.xpGain*r.diff.xpMult));r.ui.hud(r);
      const time=r.time;
      for(let i=0;i<60;i++){
        now=start+(i+1)*1000/60;frame(now);
        frames.push({ms:Math.round(now-start),shade,state:r.state,draws:sceneDraws});
        if(transition.snapshot.phase==='enter'&&transition.snapshot.progress>0)break;
      }
      return {firstCueMs:frames.find(f=>f.shade>0)?.ms??null,firstModalMs:frames.find(f=>f.state==='modal')?.ms,
        firstCardPixelsMs:transition.snapshot.progress>0?frames.at(-1).ms:null,draws:sceneDraws,combatAdvanced:r.time-time};
    }finally{
      app.halted=true;app.loop=frame;rt.render=render;
      if(cue)transition.cue=cue;
      if(descriptor)Object.defineProperty(performance,'now',descriptor);else delete performance.now;
    }
  });
  fs.writeFileSync(path.join(dir,'five-minute.json'),JSON.stringify(result,null,2));
  console.log('Five-minute solo forest',result);
  assert.equal(result.initial,86);assert.equal(result.state,'play');assert.ok(result.stageTime>300);
  assert.ok(result.events.includes('totem')&&result.checkpoints.some(t=>t>=300&&t<301));
  assert.ok(result.heightCalls>500);
  assert.equal(result.geometry.mismatches,0);
  assert.ok(result.geometry.lateCollider);
  if(!baseline){
    assert.ok(result.planeTests<result.heightCalls*result.surfaces*.2,'Height queries should inspect only overlapping map cells');
    assert.ok(result.bucketReads<result.measuredFrames*90,'Warm actors should reuse their collider neighborhood');
    assert.equal(result.upgrade.firstCueMs,17);
    assert.ok(result.upgrade.firstModalMs<=120&&result.upgrade.firstCardPixelsMs<=150);
    assert.equal(result.upgrade.draws,1);assert.equal(result.upgrade.combatAdvanced,0);
    assert.ok(result.geometry.shadowUpdates<40,'Sub-cell camera movement should reuse the shadow map while casters are unchanged');
  }
}

export async function playFiveMinutes(page,dir){
  await page.evaluate(()=>{
    const r=app.run;
    // Advance gameplay and presentation clocks together. Choose through the
    // actual upgrade buttons and keep the player alive for the full encounter.
    delete r.queueLevelUp;r.player.iframes=1e5;r.nextEvo=null;
    const perf=inspected.env.performance,realNow=perf.now.bind(perf);
    window.soloSoak={clock:realNow(),realNow,choices:0,frames:0,peak:0,events:[],checkpoints:[],choosing:false};
    Object.defineProperty(perf,'now',{configurable:true,value:()=>soloSoak.clock});
    const fire=r.director.fire.bind(r.director),checkpoint=r.checkpoint.bind(r);
    r.director.fire=kind=>{soloSoak.events.push({kind,at:r.stageTime});return fire(kind);};
    r.checkpoint=()=>{soloSoak.checkpoints.push(r.time);return checkpoint();};
  });
  const samples=[];
  for(let batch=0;batch<36;batch++){
    const s=await page.evaluate(async()=>{
      const r=app.run,a=soloSoak;
      for(let i=0;i<300&&r.stageTime<305;i++){
        a.clock+=1000/30;a.frames++;
        r.update(1/30);a.peak=Math.max(a.peak,r.enemies.count);
        if(i%30===0||r.state==='modal'){
          if(!inspected.env.drawFrozenModal(app.r.renderer)){
            app.r.render(1/30);inspected.env.drawUI(app.r.renderer);
          }
        }
        if(r.state==='modal'&&inspected.modalTransition.snapshot.phase==='settled'){
          const card=inspected.doc.querySelector('[data-offer]');
          if(card){card.click();a.choices++;}
        }
      }
      await new Promise(resolve=>setTimeout(resolve,0));
      return {time:r.stageTime,state:r.state,kills:r.stats.kills,enemies:r.enemies.count,level:r.player.level,
        frames:a.frames,peak:a.peak,choices:a.choices,checkpoints:a.checkpoints,events:a.events};
    });
    samples.push(s);
    if(s.time>=305)break;
    assert.ok(batch===0||s.time>samples[batch-1].time,'Unexpected blocked gameplay '+JSON.stringify(s));
  }
  const end=samples.at(-1);
  fs.writeFileSync(path.join(dir,'five-minute-soak.json'),JSON.stringify(samples,null,2));
  console.log('Single-player simulation from game start',end);
  assert.ok(end.time>=305&&end.kills>0&&end.choices>0&&end.state==='play');
  assert.ok(end.checkpoints.some(t=>t>=300)&&end.events.some(e=>e.kind==='totem'));
}
