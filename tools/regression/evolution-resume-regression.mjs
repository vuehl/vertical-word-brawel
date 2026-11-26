import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// The frame loop catches render errors and ends a run after 60 failures;
// pageerror alone cannot detect a broken evolution callback.
export async function reviewEvolutionResume(page,dir){
  const samples=[];
  for(const [from,to] of [[4,5],[5,6],[16,17],[17,18],[16,58],[58,59]]){
    const sample=await page.evaluate(async({from,to})=>{
      const r=app.run,p=r.player;
      app.setScreen(null);app.halted=true;
      r.ui.hideModal();r.ui.endCinematic();r.state='play';r.anims.length=0;r.vfx.clear();
      r.enemies.clear();r.projectiles.clear();r.pickups.clear();
      r.director.update=()=>{};r.capture.update=()=>{};r.events.update=()=>{};
      r.godMode=true;r.pendingLevels=1;r.pendingBlessings.length=0;r.evoHold=0;
      r.time=r.stageTime=30;r.nextCp=330;
      p.setSpecies(from);p.dead=false;p.hp=p.maxHp;p.renderScale=1;
      p.moves.forEach(m=>{if(m)m.timer=999;});
      await r.sprites.prepareHeroForm(from);await r.sprites.prepareHeroForm(to);
      r.nextEvo={to,level:p.level};r.ui.experienceReady=()=>true;
      r.upgradeTiming.clear();r.ult.active=0;r.ult.castPending=false;
      const frame=app.loop,gap=app.frameGap,descriptor=Object.getOwnPropertyDescriptor(performance,'now');
      const onError=inspected.env.onBootRenderError;
      const errors=[];let now=performance.now(),choices=0,resultSeen=false,stampSeen=false;
      inspected.env.onBootRenderError=error=>errors.push(error.stack||String(error));
      app.loop=()=>{};app.frameGap=()=>1000/30;app.pacer.reset();app.combatClock.run=null;
      app.last=null;app.halted=false;app.failing=0;
      Object.defineProperty(performance,'now',{configurable:true,value:()=>now});
      try{
        r.doLevelUp();
        r.ui.modalEl?.querySelector('[data-action="confirm-wind-evolution"]')?.click();
        for(let i=0;i<300&&r.state!=='over';i++){
          now+=1000/30;frame(now);
          resultSeen ||= !!r.ui.root.querySelector('.zx-evolution-result');
          stampSeen ||= !!r.ui.root.querySelector('.zx-evolution-stamp');
          const card=r.ui.modalEl?.querySelector('[data-offer]');
          if(card&&inspected.modalTransition.snapshot.phase==='settled'){
            card.click();choices++;
          }
        }
        const time=r.time;
        // The countdown also reads the same animation preference.
        r.stageTime=355;
        for(let i=0;i<12&&r.state!=='over';i++){now+=1000/30;frame(now);}
        return {from,to,species:p.speciesId,state:r.state,pending:r.pendingLevels,choices,
          resultSeen,stampSeen,alive:!p.dead,advanced:r.time>time,errors,
          cleared:!r.ui.root.querySelector('.zx-evolution-result,.zx-evolution-stamp'),
          screenCleared:!r.vfx.upgrade.screen.mesh.visible};
      }finally{
        app.halted=true;app.loop=frame;app.frameGap=gap;
        inspected.env.onBootRenderError=onError;
        if(descriptor)Object.defineProperty(performance,'now',descriptor);else delete performance.now;
      }
    },{from,to});
    samples.push(sample);
    fs.writeFileSync(path.join(dir,'evolution-resume.json'),JSON.stringify(samples,null,2));
    assert.equal(sample.errors.length,0,`${from} -> ${to}: ${sample.errors[0]||'unexpected frame errors'}`);
    assert.equal(sample.species,to);assert.equal(sample.state,'play');assert.equal(sample.pending,0);
    assert.equal(sample.choices,1);assert.ok(sample.alive&&sample.advanced);
    assert.ok(sample.resultSeen&&sample.stampSeen&&sample.cleared&&sample.screenCleared);
    console.log('Evolution resumed safely:',from,'->',to);
  }
}
