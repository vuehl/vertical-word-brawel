import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewEncounters(page,dir,tap,draw){
  const samples=await page.evaluate(()=>{
    const api=inspected.env.__zixingDeveloper,r=app.run,e=r.enemies;
    api.stopWorkload();api.options.lockCount=true;api.options.invincible=true;
    const waveKinds=['alpha','totem','summoner'];
    const events=r.director.timeline.filter(t=>waveKinds.includes(t.kind));
    const times=[events[0].t-.01,...events.map(t=>t.t),300,120,480,0];
    const protectedIndex=e.spawn(r.director.cards[0].id,20,20,1,1,128),protectedGen=e.gen[protectedIndex];
    const samples=times.map(time=>{
      const before={kills:r.stats.kills,gold:r.gold,xp:r.player.xp};
      const s=api.apply({time,count:200,mode:'none',boss:'timed'}),boss=s.encounter.current;
      const expected=events.filter(t=>t.t<=time).sort((a,b)=>b.t-a.t)[0];
      return {time,expected:expected?.kind??null,snapshot:s,
        before,after:{kills:r.stats.kills,gold:r.gold,xp:r.player.xp},
        protected:e.isAlive(protectedIndex)&&e.gen[protectedIndex]===protectedGen,
        distance:boss?Math.hypot(e.x[boss.index]-r.player.pos.x,e.z[boss.index]-r.player.pos.z):null,
        visible:boss?r.sprites.visible(e.x[boss.index],e.y[boss.index]+e.hgt[boss.index]*.5,e.z[boss.index],3):null};
    });
    e.kill(protectedIndex);return samples;
  });
  for(const sample of samples){
    assert.equal(sample.snapshot.encounter.current?.kind??null,sample.expected);
    assert.equal(sample.snapshot.encounter.count,sample.expected?1:0,'Jump must leave one wave, not stack old bosses');
    assert.equal(sample.snapshot.ordinary,200);assert.ok(sample.protected);
    assert.deepEqual(sample.before,sample.after,'Replacing a boss must not grant rewards');
    if(sample.expected){assert.ok(sample.distance<=12.1&&sample.visible,'Boss should be near the player and inside view');assert.ok(sample.snapshot.encounter.current.hp>0);}
  }
  // Native touch covers the new scrollable controls and the exact next-wave shortcut.
  await tap('open');await tap('minute-2');await tap('boss-timed');await tap('next-boss');await tap('apply');
  const next=await page.evaluate(()=>inspected.env.__zixingDeveloper.snapshot());
  assert.equal(next.encounter.current.kind,'alpha');assert.equal(next.stageTime,next.encounter.current.at);
  await tap('minute-5');await tap('boss-guardian');await tap('apply');
  const guardian=await page.evaluate(()=>({state:app.run.state,bossAlive:app.run.boss.alive,snapshot:inspected.env.__zixingDeveloper.snapshot()}));
  assert.equal(guardian.state,'paused','Boss intro must not steal control from the developer dialog');
  assert.ok(guardian.bossAlive);assert.equal(guardian.snapshot.encounter.current.kind,'guardian');
  await page.screenshot({path:path.join(dir,'dev-boss-panel.png')});
  await tap('close');await draw();
  await page.screenshot({path:path.join(dir,'dev-region-boss.png')});
  const combat=await page.evaluate(()=>{
    const api=inspected.env.__zixingDeveloper,r=app.run,e=r.enemies,p=r.player;
    const savedMoves=p.moves;p.moves=[];
    const results=[];
    try{
      for(const [boss,time] of [['timed',290],['timed',360],['guardian',300]]){
        const initial=api.apply({boss,time,count:0,mode:'none'}),actor=initial.encounter.current;
        let telegraphs=0;const telegraph=r.vfx.telegraph;
        r.vfx.telegraph=function(...args){telegraphs++;return telegraph.apply(this,args);};
        const peak={particles:0,projectiles:0,minions:0};
        try{for(let frame=0;frame<480;frame++){
          r.update(1/30);const s=api.snapshot();
          peak.particles=Math.max(peak.particles,s.particles);peak.projectiles=Math.max(peak.projectiles,s.projectiles);
          peak.minions=Math.max(peak.minions,r.minibosses.list.reduce((n,m)=>n+m.minions.length,0));
        }}finally{r.vfx.telegraph=telegraph;}
        const live=api.snapshot().encounter.current;
        const followers=[...r.boss.escorts,...r.minibosses.list.flatMap(m=>m.minions)];
        let guardianKill=null;
        if(boss==='guardian'){
          const stages=r.stats.stagesCleared,bosses=r.stats.bosses,family=r.meta.family(actor.species);
          const research=r.meta.research(family),goal=r.meta.researchGoal(family);
          try{r.combat.killEnemy(actor.index,{type:'normal'});}
          catch(error){throw Error(JSON.stringify({error:error.stack,actor,live,species:e.species[actor.index]}));}
          guardianKill={alive:e.isAlive(actor.index),stageCleared:r.stageCleared,researchCredited:r.meta.research(family)===Math.min(goal,research+10*(1+r.meta.lab('research')*.25)),
            stagesAdded:r.stats.stagesCleared-stages,bossesAdded:r.stats.bosses-bosses,portal:r.interactables.list.some(i=>i.kind==='portal')};
        }
        const cleared=api.apply({boss:'none',time:0,count:0,mode:'none'});
        results.push({kind:actor.kind,peak,telegraphs,live,guardianKill,cleared:cleared.encounter.count,portalsAfterReset:r.interactables.list.filter(i=>i.kind==='portal').length,
          followersRemoved:followers.every(([index,gen])=>e.gen[index]!==gen||!e.isAlive(index)),state:r.state});
      }
    }finally{p.moves=savedMoves;api.apply({boss:'timed',time:120,count:200,mode:'none'});}
    return results;
  });
  for(const result of combat){
    assert.ok(result.live?.alive,'Boss must run its actual combat behavior');
    assert.ok(result.peak.particles>0);assert.ok(result.telegraphs>0||result.peak.projectiles>0||result.peak.minions>0,'Boss must attack or summon');
    if(result.kind==='summoner')assert.ok(result.peak.minions>0);
    if(result.guardianKill)assert.deepEqual(result.guardianKill,{alive:false,stageCleared:true,researchCredited:true,stagesAdded:1,bossesAdded:1,portal:true});
    assert.equal(result.portalsAfterReset,0);
    assert.equal(result.cleared,0);assert.ok(result.followersRemoved);assert.equal(result.state,'play');
  }
  // Select every real guardian pool entry, including families removed from the
  // reduced runtime metadata. This changes selection inputs, not loaded terrain.
  const guardianPools=await page.evaluate(()=>{
    const api=inspected.env.__zixingDeveloper,r=app.run,stage=r.stage,seed=r.seed,results=[];
    try{for(let zone=1;zone<=3;zone++)for(let pick=0;pick<r.biome.guardians[zone-1].length;pick++){
      r.stage=zone;r.seed=pick;
      const snapshot=api.apply({boss:'guardian',mode:'none',time:300,count:0}),actor=snapshot.encounter.current;
      const family=r.meta.family(actor.species),research=r.meta.research(family),goal=r.meta.researchGoal(family);
      r.combat.killEnemy(actor.index,{type:'normal'});
      results.push({zone,species:actor.species,alive:r.enemies.isAlive(actor.index),stageCleared:r.stageCleared,
        expected:r.biome.guardians[zone-1][(pick+zone)%r.biome.guardians[zone-1].length],
        researchCredited:r.meta.research(family)===Math.min(goal,research+10*(1+r.meta.lab('research')*.25)),
        portals:r.interactables.list.filter(i=>i.kind==='portal').length});
    }}finally{r.stage=stage;r.seed=seed;api.apply({boss:'timed',mode:'none',time:120,count:200});}
    return results;
  });
  for(const result of guardianPools){assert.equal(result.species,result.expected);assert.ok(!result.alive&&result.stageCleared&&result.researchCredited);assert.equal(result.portals,1);}
  const progression=await reviewPortalProgression(page,dir,draw);
  console.log('Developer boss checks passed: timed waves, rewind, attacks, research, rewards and real portal transitions through all three zones.');
  const report={samples,next,guardian,combat,guardianPools,progression};
  fs.writeFileSync(path.join(dir,'developer-encounters.json'),JSON.stringify(report,null,2)+'\n');
  return report;
}

async function reviewPortalProgression(page,dir,draw){
  await page.evaluate(async()=>{
    await app.startRun({species:132,biome:'forest',tier:0,boosts:[],mode:'standard'});
    app.halted=true;
    const api=inspected.env.__zixingDeveloper;
    api.options.invincible=true;api.options.lockCount=true;
    api.close();
  });
  const results=[];
  for(let zone=1;zone<=3;zone++){
    const defeat=await page.evaluate(()=>{
      const api=inspected.env.__zixingDeveloper,r=app.run;
      const snapshot=api.apply({boss:'guardian',mode:'stress',time:600,count:0}),actor=snapshot.encounter.current;
      // Advance past 10:00 with the ordinary fixed-build tools still active.
      for(let frame=0;frame<31;frame++)r.update(1/30);
      const stages=r.stats.stagesCleared,bosses=r.stats.bosses,splits=r.splits.length;
      const chests=r.interactables.list.filter(i=>i.kind==='freechest').length;
      r.combat.killEnemy(actor.index,{type:'normal'});
      const portals=r.interactables.list.filter(i=>i.kind==='portal'),portal=portals[0];
      r.player.pos.set(portal.x,r.terrain.height(portal.x,portal.z),portal.z);
      r.camTarget.copy(r.player.pos);r.updateCamera(1);
      return {stage:r.stage,time:r.stageTime,stageCleared:r.stageCleared,stagesAdded:r.stats.stagesCleared-stages,
        bossesAdded:r.stats.bosses-bosses,splitsAdded:r.splits.length-splits,portals:portals.length,
        portalInBounds:r.terrain.inBounds(portal.x,portal.z,6),
        sanctuaryExit:!!portal.data?.sanct,chestsAdded:r.interactables.list.filter(i=>i.kind==='freechest').length-chests};
    });
    assert.equal(defeat.stage,zone);assert.ok(defeat.time>600&&defeat.stageCleared);
    assert.equal(defeat.stagesAdded,1);assert.equal(defeat.bossesAdded,1);assert.equal(defeat.splitsAdded,1);
    assert.equal(defeat.portals,1);assert.ok(defeat.portalInBounds&&defeat.chestsAdded>=1);
    assert.equal(defeat.sanctuaryExit,zone===3);
    await page.evaluate(()=>{
      const r=app.run;inspected.env.__zixingDeveloper.options.monitor=false;
      for(let frame=0;frame<150;frame++)r.update(1/30);
      r.renderWorld(0);app.r.render(0);
    });
    // Portal models load asynchronously; allow that load and the opening
    // animation to finish before capturing the actual rendered exit.
    await new Promise(resolve=>setTimeout(resolve,300));
    await draw();await page.screenshot({path:path.join(dir,'dev-portal-zone-'+zone+'.png')});
    const warning=await page.evaluate(()=>{
      const r=app.run,portal=r.interactables.list.find(i=>i.kind==='portal');
      const rewards=r.interactables.rewardsLeft();
      r.interactables.interact(portal);
      return {rewards,stage:r.stage,state:r.state,warnAt:r.rewardWarnAt,time:r.realTime};
    });
    assert.ok(warning.rewards>0);assert.equal(warning.stage,zone);assert.equal(warning.state,'play');
    assert.equal(warning.warnAt,warning.time,'The normal unclaimed-reward warning must still run');
    await page.evaluate(()=>app.run.interactables.interact(app.run.interactables.list.find(i=>i.kind==='portal')));
    await page.waitForFunction(zone=>app.run.stage===zone+1&&app.run.state==='play',{timeout:90000},zone);
    const arrived=await page.evaluate(()=>{
      const r=app.run;r.update(0);
      return {stage:r.stage,stageTime:r.stageTime,stageCleared:r.stageCleared,bossSpawned:r.bossSpawned,
        sanctuary:!!r.sanctuary,testEntry:!!inspected.doc.querySelector('#zx-dev-button')?.isConnected};
    });
    assert.equal(arrived.stage,zone+1);assert.equal(arrived.stageTime,0);assert.equal(arrived.stageCleared,false);
    assert.ok(arrived.testEntry);assert.equal(arrived.sanctuary,zone===3);
    results.push({defeat,warning,arrived});
  }
  return results;
}
