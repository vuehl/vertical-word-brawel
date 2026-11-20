import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewExperience(page,dir){
  const initial=await page.evaluate(()=>{
    const r=app.run,p=r.player;
    window.experienceAudit={halted:app.halted,state:r.state,level:p.level,xp:p.xp,next:p.xpNext,pending:r.pendingLevels,queue:r.queueLevelUp};
    app.halted=true;r.state='play';r.pendingLevels=0;r.queueLevelUp=()=>r.pendingLevels++;
    p.xp=0;r.ui.hud(r);
    window.readExperience=()=>{
      const canvas=inspected.doc.querySelector('.zx-profile-art'),ctx=canvas.getContext('2d');
      // Bottom-left, top-left, top-right, bottom-right: fill from the bottom.
      const quadrants=[3/4,5/4,7/4,1/4].map(a=>{
        const [red,green,blue,alpha]=ctx.getImageData(Math.round((40+34*Math.cos(a*Math.PI))*2),Math.round((39+34*Math.sin(a*Math.PI))*2),1,1).data;
        return blue>red*1.25&&green>red+30&&alpha>200;
      });
      return {progress:Number(canvas.dataset.progress),level:inspected.doc.querySelector('.zx-hud-level').textContent,ready:r.ui.experienceReady(),state:r.state,quadrants};
    };
    return {level:p.level,next:p.xpNext};
  });
  const report={initial,gains:[],transition:[]};
  try{
    for(const target of [.25,.5,.75,.99]){
      const data=await page.evaluate(target=>{
        const r=app.run,p=r.player,gain=p.stats.xpGain*r.diff.xpMult;
        p.addXp((p.xpNext*target-p.xp)/gain);r.ui.hud(r);
        app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);return readExperience();
      },target);
      assert.equal(data.progress,target);assert.equal(data.level,'LV.'+initial.level);assert.equal(data.state,'play');
      report.gains.push(data);
      if(target<=.75)await page.screenshot({path:path.join(dir,'experience-bottom-start-'+Math.round(target*100)+'.png')});
    }
    assert.deepEqual(report.gains.map(s=>s.quadrants),[[true,false,false,false],[true,true,false,false],[true,true,true,false],[true,true,true,true]]);
    report.threshold=await page.evaluate(()=>{
      const r=app.run,p=r.player,gain=p.stats.xpGain*r.diff.xpMult,overflow=p.xpNext*.05;
      p.addXp((p.xpNext-p.xp+overflow)/gain);r.ui.hud(r);r.doLevelUp();
      const time=r.time;r.update(.1);
      return {...readExperience(),actualLevel:p.level,pending:r.pendingLevels,overflow:p.xp,expectedOverflow:overflow,next:p.xpNext,simulationAdvance:r.time-time};
    });
    assert.equal(report.threshold.actualLevel,initial.level+1);assert.equal(report.threshold.level,'LV.'+initial.level);
    assert.equal(report.threshold.pending,1);assert.equal(report.threshold.state,'play');assert.equal(report.threshold.ready,false);
    assert.equal(report.threshold.simulationAdvance,0,'Full-ring presentation must pause combat before the upgrade choice');
    assert.ok(Math.abs(report.threshold.overflow-report.threshold.expectedOverflow)<1e-6);
    let sawFull=false;
    for(let step=0;step<24;step++){
      await new Promise(resolve=>setTimeout(resolve,50));
      const data=await page.evaluate(()=>{
        const r=app.run;r.ui.hud(r);r.doLevelUp();app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
        return readExperience();
      });
      report.transition.push(data);
      if(data.progress===1&&!sawFull){
        assert.equal(data.level,'LV.'+initial.level);assert.equal(data.state,'play');assert.deepEqual(data.quadrants,[true,true,true,true]);
        sawFull=true;await page.screenshot({path:path.join(dir,'experience-full-before-upgrade.png')});
      }
      if(data.state==='modal'){
        assert.ok(sawFull,'Upgrade must follow a rendered complete ring');assert.equal(data.level,'LV.'+(initial.level+1));
        assert.equal(data.progress,Math.floor(report.threshold.overflow/report.threshold.next*1000+1e-7)/1000);
        await page.screenshot({path:path.join(dir,'experience-upgrade-after-full.png')});break;
      }
    }
    assert.equal(report.transition.at(-1).state,'modal');
    fs.writeFileSync(path.join(dir,'experience-cycle.json'),JSON.stringify(report,null,2));
  }finally{
    await page.evaluate(()=>{
      const r=app.run,p=r.player,s=experienceAudit;r.ui.hideModal();
      p.level=s.level;p.xp=s.xp;p.xpNext=s.next;r.pendingLevels=s.pending;r.queueLevelUp=s.queue;
      r.state=s.state;r.ui.hud(r);app.halted=s.halted;
      delete window.experienceAudit;delete window.readExperience;
    });
  }
}
