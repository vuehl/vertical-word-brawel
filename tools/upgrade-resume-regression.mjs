import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewUpgradeResume(page,dir,baseline){
  const result=await page.evaluate(async()=>{
    const r=app.run,layout=inspected.layout,transition=inspected.modalTransition;
    const rt=app.r,realNow=performance.now.bind(performance),descriptor=Object.getOwnPropertyDescriptor(performance,'now');
    const frame=app.loop,initialGap=app.frameGap;let clock=realNow(),phase='warm';
    const phases={},restores=[];
    function work(){return phases[phase]??={frames:0,layouts:0,settingsApplied:0,sceneDraws:0,worldUpdates:0,fullUploads:0,tiles:0,ms:[]};}
    function count(obj,name,key){
      const original=obj[name];obj[name]=function(...args){work()[key]++;return original.apply(this,args);};
      restores.push(()=>{obj[name]=original;});
    }
    count(layout,'refresh','layouts');count(layout,'refreshSubtree','tiles');count(rt,'render','sceneDraws');count(r,'renderWorld','worldUpdates');
    count(app,'applySettings','settingsApplied');
    const tick=async()=>{
      const uploads=auditUIUploads,at=realNow();clock+=1000/60;frame(clock);
      const w=work();w.frames++;w.fullUploads+=auditUIUploads-uploads;w.ms.push(realNow()-at);
      await new Promise(resolve=>setTimeout(resolve,0));
    };
    try{
      r.time=r.stageTime=300;r.nextCp=330;r.nextEvo=null;r.player.iframes=1000;
      r.director.update=()=>{};r.enemies.clear();
      for(let i=0;i<90;i++){const a=i*2.4,d=9+i%18;r.enemies.spawn(19,r.player.pos.x+Math.cos(a)*d,r.player.pos.z+Math.sin(a)*d,1e6,1);}
      delete r.queueLevelUp;app.loop=()=>{};app.frameGap=window.realFrameGap;app.pacer.reset();app.halted=false;
      Object.defineProperty(performance,'now',{configurable:true,value:()=>clock});
      app.last=clock;
      for(let i=0;i<10;i++)await tick();
      r.ui.hudEl.querySelectorAll('.run-hint,.banner').forEach(n=>n.remove());
      r.player.xp=r.player.xpNext*.99;r.ui.hud(r);await tick();
      const moves=r.player.moves.filter(Boolean),initialSkill=inspected.doc.querySelector('.zx-skill-slot.filled');
      const icon=initialSkill.querySelector('img'),cooldown=initialSkill.querySelector('canvas');
      const offered=r.ui.showLevelUp.bind(r.ui);let choice=0,kind;
      r.ui.showLevelUp=function(run,offers,choose){
        choice=Math.max(0,offers.findIndex(o=>o.kind==='upMove'));kind=offers[choice].kind;
        return offered(run,offers,choose);
      };
      phase='enter';r.player.addXp((r.player.xpNext-r.player.xp+2)/(r.player.stats.xpGain*r.diff.xpMult));
      for(let i=0;i<60&&transition.snapshot.phase!=='settled';i++)await tick();
      const btn=inspected.doc.querySelector('[data-offer="'+choice+'"]'),b=layout.box(btn),s=inspected.doc.getElementById('game').getBoundingClientRect();
      phase='exit';const before=r.time,level=r.player.level;
      window.tap(b.x+b.w/2-s.left,b.y+b.h/2-s.top);
      for(let i=0;i<36&&r.state==='modal';i++)await tick();
      const atClose=r.time;phase='resume';
      for(let i=0;i<36;i++)await tick();
      const current=inspected.doc.querySelector('.zx-skill-slot.filled');
      return {phases,choice,kind,moveCountBefore:moves.length,level,pending:r.pendingLevels,state:r.state,
        pauseAdvance:atClose-before,resumeAdvance:r.time-atClose,iconReused:current.querySelector('img')===icon,
        slotReused:initialSkill===current,cooldownReused:current.querySelector('canvas')===cooldown};
    }finally{
      app.halted=true;app.loop=frame;app.frameGap=initialGap;
      for(const restore of restores)restore();
      if(descriptor)Object.defineProperty(performance,'now',descriptor);else delete performance.now;
    }
  });
  for(const phase of Object.values(result.phases)){
    const ms=phase.ms.sort((a,b)=>a-b);delete phase.ms;
    phase.p95Ms=ms[Math.floor(ms.length*.95)];phase.maxMs=ms.at(-1);
  }
  fs.writeFileSync(path.join(dir,'upgrade-resume.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
  assert.equal(result.state,'play');assert.equal(result.pending,0);
  assert.equal(result.pauseAdvance,0);assert.ok(result.resumeAdvance>.5);
  if(!baseline){
    assert.ok(result.slotReused&&result.iconReused&&result.cooldownReused);
    for(const stage of ['enter','exit','resume']){
      assert.equal(result.phases[stage].layouts,0,stage+' should only lay out changed HUD tiles or cards');
      assert.equal(result.phases[stage].fullUploads,0,stage+' should reuse the main HUD texture');
      assert.equal(result.phases[stage].settingsApplied,0,stage+' should preserve render settings');
    }
    assert.equal(result.phases.enter.worldUpdates,1);
    assert.equal(result.phases.exit.worldUpdates,0);
  }
}
