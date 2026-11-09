import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewDeveloper(page,dir){
  const report={environment:'Compiled isolated developer build / Chrome SwiftShader; NOT phone FPS.',widths:[],waves:[]};
  const draw=()=>page.evaluate(()=>{app.run.update(0);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);});
  const tap=async action=>{
    await page.evaluate(action=>{
      const el=inspected.doc.querySelector('[data-dev-action="'+action+'"]'),sc=el?.closest('[data-dev-scroll]');
      if(sc){const b=el.getBoundingClientRect(),s=sc.getBoundingClientRect();
        if(b.bottom>s.bottom)sc.scrollTop+=b.bottom-s.bottom+8;
        else if(b.top<s.top)sc.scrollTop+=b.top-s.top-8;}
    },action);
    await draw();
    const box=await page.evaluate(action=>{
      const el=inspected.doc.querySelector('[data-dev-action="'+action+'"]');
      const box=el?.getBoundingClientRect();if(!box)throw Error('Missing button: '+action);
      const screen=inspected.doc.getElementById('game').getBoundingClientRect();
      return {x:box.x+box.width/2-screen.x,y:box.y+box.height/2-screen.y};
    },action);
    await page.touchscreen.tap(box.x,box.y);await draw();
  };
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:3});
    await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
    // Native pointer coordinates use the safe area, not the browser DOM.
    await draw();
    const layout=await page.evaluate(()=>{
      const b=inspected.doc.querySelector('#zx-dev-button').getBoundingClientRect();
      const p=inspected.doc.querySelector('.zx-hud-pause').getBoundingClientRect();
      return {button:{x:b.x,y:b.y,width:b.width,height:b.height},pause:{x:p.x,y:p.y,width:p.width,height:p.height}};
    });
    assert.ok(layout.button.x+layout.button.width<=layout.pause.x,'Developer button overlaps pause');
    assert.ok(layout.button.x>=0&&layout.button.y>=0);
    await page.screenshot({path:path.join(dir,`dev-button-${width}.png`)});
    await tap('open');
    assert.equal(await page.evaluate(()=>app.run.state),'paused');
    assert.ok(await page.evaluate(()=>!!inspected.doc.querySelector('#zx-dev-panel')),'Touch must open developer panel');
    await page.screenshot({path:path.join(dir,`dev-panel-${width}.png`)});
    await tap('minute-2');await tap('count-200');await tap('apply');
    const state=await page.evaluate(()=>inspected.env.__zixingDeveloper.snapshot());
    assert.equal(state.stageTime,120);assert.equal(state.ordinary,200);
    await tap('close');assert.equal(await page.evaluate(()=>app.run.state),'play');
    report.widths.push({width,height,...layout,state});
  }
  for(const seconds of [0,120,300,480,600,120]){
    const sample=await page.evaluate(seconds=>{
      const api=inspected.env.__zixingDeveloper;
      const before={kills:app.run.stats.kills,gold:app.run.gold,xp:app.run.player.xp};
      const state=api.apply({time:seconds,count:600});
      return {state,before,after:{kills:app.run.stats.kills,gold:app.run.gold,xp:app.run.player.xp},
        pendingPast:app.run.director.timeline.filter(e=>e.t<=seconds&&!e.done).length,
        finalSwarm:app.run.director.finalSwarm};
    },seconds);
    assert.equal(sample.state.stageTime,seconds);assert.equal(sample.state.ordinary,600);
    assert.deepEqual(sample.before,sample.after,'Debug removal must not award rewards');
    assert.equal(sample.pendingPast,0);assert.equal(sample.finalSwarm,seconds>=600);
    report.waves.push(sample);
  }
  assert.ok(report.waves[3].state.hpMultiplier>report.waves[1].state.hpMultiplier,'Jump must change actual monster strength');
  assert.ok(report.waves[3].state.cards.length>report.waves[1].state.cards.length,'Jump must advance the monster pool');
  report.counts=await page.evaluate(()=>{
    const api=inspected.env.__zixingDeveloper,e=app.run.enemies;
    const special=e.spawn(app.run.director.cards[0].id,20,20,1,1,128);
    const values=[0,100,1000].map(count=>api.apply({count,seek:false}));
    const specialPreserved=e.isAlive(special);e.kill(special);
    api.open();app.run.resume();
    return {values,specialPreserved,resumeCloses:!inspected.doc.querySelector('#zx-dev-panel')};
  });
  assert.deepEqual(report.counts.values.map(s=>s.ordinary),[0,100,1000]);
  assert.ok(report.counts.values.every(s=>s.stageTime===120),'Count-only must not change the clock');
  assert.equal(report.counts.specialPreserved,true);assert.equal(report.counts.resumeCloses,true);
  report.persistence=await page.evaluate(async()=>{
    await app.meta.saveNow();
    const fs=wx.getFileSystemManager(),files=fs.readdirSync('/userdata');
    const keys=Object.keys(localStorage);
    return {files,keys};
  });
  assert.ok(report.persistence.files.includes('pokebonk-dev-save.json'),'Developer save missing');
  assert.ok(!report.persistence.files.includes('pokebonk-save.json'),'Developer build touched production save');
  assert.ok(report.persistence.keys.some(key=>key.startsWith('pokebonk.dev.web.')));
  assert.ok(!report.persistence.keys.some(key=>key.startsWith('pokebonk.web.')));
  report.lifecycle=await page.evaluate(async()=>{
    const api=inspected.env.__zixingDeveloper;
    api.options.invincible=true;api.options.lockCount=true;api.apply({time:120,count:200});
    const hp=app.run.player.hp;app.run.player.hurt(1e6,'normal',-1);
    const invincible=app.run.player.hp===hp;
    app.run.enemies.clear();app.run.update(1/60);
    const maintained=api.snapshot().ordinary;
    api.options.monitor=true;app.run.update(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);
    api.open();app.run.dispose();
    const removed=!inspected.doc.querySelector('#zx-dev-panel')&&!inspected.doc.querySelector('#zx-dev-button');
    app.run=null;
    await app.startRun({species:7,biome:'forest',tier:0,boosts:[],mode:'standard'});
    return {invincible,maintained,removed,buttons:inspected.doc.querySelectorAll('#zx-dev-button').length};
  });
  assert.equal(report.lifecycle.invincible,true);assert.equal(report.lifecycle.maintained,200);
  assert.equal(report.lifecycle.removed,true);assert.equal(report.lifecycle.buttons,1);
  fs.writeFileSync(path.join(dir,'developer-regression.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Developer checks passed:',report.widths.length,'viewport sizes,',report.waves.length,'time jumps; isolated save and lifecycle.');
}
