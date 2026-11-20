import assert from 'node:assert/strict';
import path from 'node:path';

export async function reviewUltimateUpgrade(page,dir){
  const samples=[];
  for(const species of [4,16]){
    const sample=await page.evaluate(async species=>{
      await app.startRun({species,biome:'forest',tier:0,boosts:[],mode:'standard'});
      app.halted=true;const run=app.run,p=run.player;
      run.update(1/60);run.director.update=()=>{};
      const realNow=performance.now.bind(performance),descriptor=Object.getOwnPropertyDescriptor(performance,'now');
      let clock=realNow(),frames=0;Object.defineProperty(performance,'now',{configurable:true,value:()=>clock});
      try{
        const ult=run.ult;
        ult.charge=0;
        run.input.touchKey('KeyR',true);
        ult.update(0);
        run.input.endFrame();
        let ticks=0;
        while(!ult.ready && ticks<46*60){ult.update(1/60);ticks++;}
        const rechargeSeconds=ticks/60;
        run.input.touchKey('KeyR',false);
        // Old clients can still send a saved auto-cast preference.
        const settings=run.meta.profile.settings,nearest=run.enemies.nearest;
        try{
          settings.autoUlt=true;
          run.enemies.nearest=()=>0;
          ult.update(1/60);
          if(ult.uses || !ult.ready)throw Error('Full charge must wait for a fresh press');
        }finally{delete settings.autoUlt;run.enemies.nearest=nearest;}
        run.input.touchKey('KeyR',true);
        ult.update(0);
        run.input.touchKey('KeyR',false);
        run.input.endFrame();
        if(ult.uses!==1 || ult.charge!==0)throw Error('Fresh press must spend the charge exactly once');
        const duration=run.ult.active,time=run.time,startLevel=p.level;
        p.addXp((p.xpNext-p.xp+5)/(p.stats.xpGain*run.diff.xpMult));
        const overflow=p.xp;run.ui.hud(run);
        const beforeGate=run.time;clock+=1000/60;run.update(1/60);
        const first={advanced:run.time>beforeGate,state:run.state,pending:run.pendingLevels,ringReady:run.ui.experienceReady()};
        const minimum=run.upgradeTiming.minimum,active=run.ult.active;
        run.state='paused';clock+=5000;run.update(.1);
        const paused={minimumUnchanged:run.upgradeTiming.minimum===minimum,activeUnchanged:run.ult.active===active};
        run.state='play';
        let readyWhilePlaying=false,protectedDuringDelay=true;
        while(run.state==='play'&&frames++<400){
          clock+=1000/60;run.update(1/60);
          if(run.ui.experienceReady()&&run.ult.active>0)readyWhilePlaying=true;
          if(run.upgradeTiming.waiting(run.ult)&&run.player.iframes<=0)protectedDuringDelay=false;
        }
        run.ui.hud(run);app.r.render(0);inspected.env.drawUI(app.r.renderer);
        return {species,duration,rechargeSeconds,elapsed:(frames+1)/60,simulation:run.time-time,first,paused,readyWhilePlaying,protectedDuringDelay,
          state:run.state,active:run.ult.active,castPending:run.ult.castPending,pending:run.pendingLevels,
          level:p.level,startLevel,overflow,xp:p.xp};
      }finally{if(descriptor)Object.defineProperty(performance,'now',descriptor);else delete performance.now;}
    },species);
    assert.ok(Math.abs(sample.rechargeSeconds-45)<=1/60+1e-8,'Base ultimate recharge should take 45 seconds');
    assert.ok(sample.first.advanced&&sample.first.state==='play'&&!sample.first.ringReady,'XP must not freeze the ultimate');
    assert.ok(sample.paused.minimumUnchanged&&sample.paused.activeUnchanged);
    assert.ok(sample.elapsed>=1.5&&sample.simulation>=sample.duration+.19);
    assert.ok(sample.readyWhilePlaying&&sample.protectedDuringDelay);
    assert.equal(sample.active,0);assert.equal(sample.castPending,false);assert.equal(sample.state,'modal');
    assert.equal(sample.pending,1);assert.equal(sample.level,sample.startLevel+1);assert.ok(sample.xp>=sample.overflow);
    samples.push(sample);await page.screenshot({path:path.join(dir,'ultimate-'+species+'-upgrade.png')});
  }
  console.log('Manual ultimate recharge and finish before upgrade:',samples.map(({species,rechargeSeconds,duration,elapsed})=>({species,rechargeSeconds,duration,elapsed})));
  return samples;
}
