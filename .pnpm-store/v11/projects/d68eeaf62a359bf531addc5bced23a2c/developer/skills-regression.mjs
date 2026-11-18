import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewDeveloperSkills(page,dir){
  const report=[];
  for(const id of [4,5,6,132,16,17,18,58,59]){
    const sample=await page.evaluate(async id=>{
      const base=[4,5,6].includes(id)?4:id===132?132:16;
      await app.startRun({species:base,biome:'forest',tier:0,boosts:[],mode:'standard'});
      app.halted=true;
      const api=inspected.env.__zixingDeveloper,r=app.run,p=r.player;
      api.close();api.options.spawn=false;api.options.lockCount=false;
      const starting=p.moves.filter(Boolean).map(m=>({key:m.def.key,level:m.level,mods:{...m.mods}}));
      if(id!==base){p.setSpecies(id);p.evoStage=[6,58,59].includes(id)?2:1;p.recompute();r.nextEvo=r.planEvolution(id,1);}
      const original={moves:p.moves,level:p.level,slots:p.moveSlots,kit:p.roster.kit,ability:p.ability};
      const samples=[];
      for(const [mode,time] of [['timed',0],['timed',120],['timed',300],['timed',600],['stress',0]]){
        const s=api.apply({mode,time,count:0,boss:'none'});
        samples.push({mode,time,build:s.workload,form:p.speciesId,kit:p.roster.kit,ability:p.ability,
          labels:[...inspected.doc.querySelectorAll('[data-skill-slot]')].map(e=>e.getAttribute('aria-label'))});
      }
      api.stopWorkload();
      const restored=p.moves===original.moves&&p.level===original.level&&p.moveSlots===original.slots;
      // Research may unlock the fourth slot; only that actual unlock permits
      // the fourth move. The preset must not unlock it by itself.
      p.moveSlots=4;const unlocked=api.apply({mode:'stress',time:0,count:0,boss:'none'}).workload;
      api.stopWorkload();p.moveSlots=original.slots;
      return {id,base,starting,slots:original.slots,kit:original.kit,ability:original.ability,samples,restored,unlocked};
    },id);
    assert.ok(sample.restored);
    for(const s of sample.samples){
      assert.equal(s.form,id);assert.equal(s.ability,sample.ability);
      assert.equal(s.build.slots,sample.slots);assert.ok(s.build.moves.length<=sample.slots);
      assert.deepEqual(s.build.moves.map(m=>m.key),sample.kit.slice(0,s.build.moves.length));
      assert.ok(s.build.moves.reduce((n,m)=>n+m.level,0)<=s.build.level,'Skill choices must fit the character level');
      for(const [slot,m] of s.build.moves.entries())assert.equal(s.labels[slot],m.name+' 等级 '+m.level);
    }
    if(id===sample.base)assert.deepEqual(sample.samples[0].build.moves.map(({key,level,mods})=>({key,level,mods})),sample.starting,'0-minute build must match an ordinary start');
    assert.deepEqual(sample.unlocked.moves.map(m=>m.key),sample.kit);
    report.push(sample);
  }
  // Compare the preset's first skill against two selections in the actual
  // level-up callback. A fixed RNG makes both common-rarity upgrades identical.
  const upgrade=await page.evaluate(async()=>{
    await app.startRun({species:16,biome:'forest',tier:0,boosts:[],mode:'standard'});
    app.halted=true;const r=app.run,p=r.player,api=inspected.env.__zixingDeveloper;
    api.close();api.options.spawn=false;
    const random=Math.random,show=r.ui.showLevelUp,ready=r.ui.experienceReady;
    const slots=p.moveSlots,vitaminSlots=p.vitaminSlots,skip=app.meta.profile.settings.skipEmptyLevelUp;
    Math.random=()=>0;
    try{
      const preset=api.apply({mode:'timed',time:120,count:0,boss:'none'}).workload.moves[0];
      api.stopWorkload();p.level=8;p.recompute();r.ui.experienceReady=()=>true;
      // Restrict this comparison to the one existing skill so randomized
      // three-card selection cannot hide it behind new moves or vitamins.
      p.moveSlots=1;p.vitaminSlots=0;app.meta.profile.settings.skipEmptyLevelUp=false;
      let selected=0;
      r.ui.showLevelUp=(run,offers,choose)=>{
        const offer=offers.find(o=>o.kind==='upMove'&&o.slot===0);
        if(!offer)throw Error('Missing real upgrade offer');selected++;choose(offer);
      };
      for(let i=0;i<2;i++){r.pendingLevels=1;r.state='play';r.doLevelUp();}
      const m=p.moves[0];return {selected,preset,normal:{key:m.def.key,level:m.level,mods:{...m.mods}}};
    }finally{Math.random=random;r.ui.showLevelUp=show;r.ui.experienceReady=ready;p.moveSlots=slots;p.vitaminSlots=vitaminSlots;app.meta.profile.settings.skipEmptyLevelUp=skip;}
  });
  assert.equal(upgrade.selected,2);
  const {key,level,mods}=upgrade.preset;assert.deepEqual({key,level,mods},upgrade.normal,'Preset must use the actual release upgrade rules');
  await page.evaluate(()=>{
    const r=app.run,api=inspected.env.__zixingDeveloper;
    api.options.monitor=false;api.apply({mode:'timed',time:120,count:0,boss:'none'});
    inspected.doc.querySelectorAll('.zx-intro,.run-hint,.toast').forEach(n=>n.remove());
    r.ui.hud(r);r.renderWorld(0);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
  });
  await page.screenshot({path:path.join(dir,'dev-wind-correct-skills.png')});
  fs.writeFileSync(path.join(dir,'developer-skills.json'),JSON.stringify({forms:report,upgrade},null,2));
  console.log('Developer skills passed: 9 forms, 45 presets, normal upgrade equivalence, slot unlock and restoration.');
}
