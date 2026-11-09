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
          const stages=r.stats.stagesCleared,research=JSON.stringify(r.meta.profile.research);
          try{r.combat.killEnemy(actor.index,{type:'normal'});}
          catch(error){throw Error(JSON.stringify({error:error.stack,actor,live,species:e.species[actor.index]}));}
          guardianKill={alive:e.isAlive(actor.index),stageCleared:r.stageCleared,researchUnchanged:research===JSON.stringify(r.meta.profile.research),
            stagesUnchanged:stages===r.stats.stagesCleared,portal:r.interactables.list.some(i=>i.kind==='portal')};
        }
        const cleared=api.apply({boss:'none',time:0,count:0,mode:'none'});
        results.push({kind:actor.kind,peak,telegraphs,live,guardianKill,cleared:cleared.encounter.count,
          followersRemoved:followers.every(([index,gen])=>e.gen[index]!==gen||!e.isAlive(index)),state:r.state});
      }
    }finally{p.moves=savedMoves;api.apply({boss:'timed',time:120,count:200,mode:'none'});}
    return results;
  });
  for(const result of combat){
    assert.ok(result.live?.alive,'Boss must run its actual combat behavior');
    assert.ok(result.peak.particles>0);assert.ok(result.telegraphs>0||result.peak.projectiles>0||result.peak.minions>0,'Boss must attack or summon');
    if(result.kind==='summoner')assert.ok(result.peak.minions>0);
    if(result.guardianKill)assert.deepEqual(result.guardianKill,{alive:false,stageCleared:false,researchUnchanged:true,stagesUnchanged:true,portal:false});
    assert.equal(result.cleared,0);assert.ok(result.followersRemoved);assert.equal(result.state,'play');
  }
  // Select every real guardian pool entry, including families removed from the
  // reduced runtime metadata. This changes selection inputs, not loaded terrain.
  const guardianPools=await page.evaluate(()=>{
    const api=inspected.env.__zixingDeveloper,r=app.run,stage=r.stage,seed=r.seed,results=[];
    try{for(let zone=1;zone<=3;zone++)for(let pick=0;pick<r.biome.guardians[zone-1].length;pick++){
      r.stage=zone;r.seed=pick;
      const snapshot=api.apply({boss:'guardian',mode:'none',time:300,count:0}),actor=snapshot.encounter.current;
      const research=JSON.stringify(r.meta.profile.research);
      r.combat.killEnemy(actor.index,{type:'normal'});
      results.push({zone,species:actor.species,alive:r.enemies.isAlive(actor.index),stageCleared:r.stageCleared,
        expected:r.biome.guardians[zone-1][(pick+zone)%r.biome.guardians[zone-1].length],
        researchUnchanged:research===JSON.stringify(r.meta.profile.research)});
    }}finally{r.stage=stage;r.seed=seed;api.apply({boss:'timed',mode:'none',time:120,count:200});}
    return results;
  });
  for(const result of guardianPools){assert.equal(result.species,result.expected);assert.ok(!result.alive&&!result.stageCleared&&result.researchUnchanged);}
  console.log('Developer boss checks passed: timed waves, rewind, guardian touch entry, attacks, summons and isolated defeat.');
  const report={samples,next,guardian,combat,guardianPools};
  fs.writeFileSync(path.join(dir,'developer-encounters.json'),JSON.stringify(report,null,2)+'\n');
  return report;
}
