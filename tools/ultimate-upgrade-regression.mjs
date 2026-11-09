import assert from 'node:assert/strict';
import path from 'node:path';

export async function reviewUltimateUpgrade(page,dir){
  const samples=[];
  for(const species of [4,7,1]){
    const sample=await page.evaluate(async species=>{
      await app.startRun({species,biome:'forest',tier:0,boosts:[],mode:'standard'});
      app.halted=true;const run=app.run,p=run.player;
      run.update(1/60);run.director.update=()=>{};
      const realNow=performance.now.bind(performance),descriptor=Object.getOwnPropertyDescriptor(performance,'now');
      let clock=realNow(),frames=0;Object.defineProperty(performance,'now',{configurable:true,value:()=>clock});
      try{
        run.ult.charge=1;run.ult.fire();
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
        return {species,duration,elapsed:(frames+1)/60,simulation:run.time-time,first,paused,readyWhilePlaying,protectedDuringDelay,
          state:run.state,active:run.ult.active,castPending:run.ult.castPending,pending:run.pendingLevels,
          level:p.level,startLevel,overflow,xp:p.xp};
      }finally{if(descriptor)Object.defineProperty(performance,'now',descriptor);else delete performance.now;}
    },species);
    assert.ok(sample.first.advanced&&sample.first.state==='play'&&!sample.first.ringReady,'XP must not freeze the ultimate');
    assert.ok(sample.paused.minimumUnchanged&&sample.paused.activeUnchanged);
    assert.ok(sample.elapsed>=1.5&&sample.simulation>=sample.duration+.19);
    assert.ok(sample.readyWhilePlaying&&sample.protectedDuringDelay);
    assert.equal(sample.active,0);assert.equal(sample.castPending,false);assert.equal(sample.state,'modal');
    assert.equal(sample.pending,1);assert.equal(sample.level,sample.startLevel+1);assert.ok(sample.xp>=sample.overflow);
    samples.push(sample);await page.screenshot({path:path.join(dir,'ultimate-'+species+'-upgrade.png')});
  }
  console.log('Ultimate finish before upgrade:',samples.map(({species,duration,elapsed})=>({species,duration,elapsed})));
  return samples;
}
