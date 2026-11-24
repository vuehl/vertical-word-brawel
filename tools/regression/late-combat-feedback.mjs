import assert from 'node:assert/strict';

export async function reviewLateFeedback(page) {
  const result = await page.evaluate(async () => {
    const r=app.run, a=r.audio, p=r.player, enemies=r.enemies;
    const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    await a.preloadCombat();
    r.time=r.stageTime=268;
    for(const event of r.director.timeline) if(event.t<268)event.done=true;
    p.iframes=1e5;
    const spawn=(dx,dz)=>{
      const id=enemies.spawn(19,p.pos.x+dx,p.pos.z+dz,1,1,0);
      if(id<0)throw Error('Could not place a local test enemy');
      return id;
    };
    const target=spawn(3,0);
    enemies.hp[target]=enemies.maxHp[target]=1e7;
    const an=a.ctx.createAnalyser(),pcm=new Float32Array(an.fftSize);
    a.master.connect(an);
    async function battle(frames) {
      let peak=0;
      for(let i=0;i<frames;i++) {
        r.update(1/30);r.input.endFrame();
        if(i%4===0)r.combat.hit(target,2,{type:'fire',cls:'special',fixed:true});
        await wait(16);
        an.getFloatTimeDomainData(pcm);
        for(const v of pcm)peak=Math.max(peak,Math.abs(v));
      }
      return peak;
    }
    const before=await battle(45), across=await battle(75), remaining=360-r.stageTime;
    // Keep the game visible and withhold the native interruption-end callback.
    fixtureAudioInterruptionBegin();await a.ctx.suspend();
    await wait(6500);
    const recovered=await battle(24);
    fixtureAudioInterruptionEnd();a.master.disconnect(an);an.disconnect();
    r.state='play';r.pendingLevels=0;r.anims.length=0;r.vfx.clear();enemies.clear();
    p.setSpecies(5);p.level=35;r.nextEvo={to:6,level:p.level};
    const victims=[];
    for(let i=0;i<104;i++){
      const id=spawn(Math.cos(i)*4,Math.sin(i)*4);
      enemies.hp[id]=enemies.maxHp[id]=10;victims.push(id);
    }
    const protectedId=spawn(1,1);enemies.flags[protectedId]|=128;
    const protectedHp=enemies.hp[protectedId];
    enemies.grid.build(enemies.n,enemies.x,enemies.z,enemies.alive,enemies.radius,enemies.dying,enemies.firstAlive);
    let hits=0,peakHits=0,cardCanvases=0,earlyCard=false;
    const hit=r.combat.hit.bind(r.combat),reveal=r.ui.evolutionReveal.bind(r.ui);
    r.combat.hit=(...args)=>{hits++;return hit(...args);};
    r.ui.evolutionReveal=(...args)=>{
      const doc=inspected.doc,create=doc.createElement;
      doc.createElement=function(tag,...rest){if(tag==='canvas')cardCanvases++;return create.call(this,tag,...rest);};
      try{return reveal(...args);}finally{doc.createElement=create;}
    };
    r.startEvolution();
    [...r.ui.modalEl.querySelectorAll('button')].find(b=>b.textContent.includes('确认进阶')).click();
    for(let i=0;i<220&&r.state==='evolving';i++){
      hits=0;r.update(1/30);peakHits=Math.max(hits,peakHits);
      if(r.state==='evolving'&&r.ui.root.querySelector('.zx-evolution-result'))earlyCard=true;
    }
    const killed=victims.filter(id=>!enemies.isAlive(id)).length;
    const captureSafe=enemies.hp[protectedId]===protectedHp;
    r.pendingLevels=1;r.ui.experienceReady=()=>false;
    const landingClock=r.time;r.update(1/30);
    return {before,across,remaining,recovered,peakHits,cardCanvases,earlyCard,form:p.speciesId,
      victims:victims.length,killed,resumed:r.time>landingClock,
      captureSafe,
      shown:!!r.ui.root.querySelector('.zx-evolution-result')};
  });
  console.log('Late countdown and third-form evolution',result);
  assert.ok(result.remaining<90 && result.before>.001 && result.across>.001);
  assert.ok(result.recovered>.001,'Combat output recovers after a missed interruption end');
  assert.ok(result.peakHits>0 && result.peakHits<=6,'Spread the reveal damage across cinematic frames');
  assert.equal(result.killed,result.victims);
  assert.equal(result.captureSafe,true);
  assert.equal(result.form,6);assert.equal(result.shown,true);assert.equal(result.earlyCard,false);
  assert.equal(result.resumed,true,'Queued upgrade feedback cannot freeze the landing');
  assert.equal(result.cardCanvases,0,'Present the prepared result without creating canvases on landing');
}
