import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewDeveloperEvolution(page,dir){
  const report={routes:[],widths:[]};
  const draw=()=>page.evaluate(()=>{const r=app.run;r.update(0);r.renderWorld(0);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);});
  const tap=async(selector,label)=>{
    // Native input intentionally ignores presses while an overlay animates.
    // The controlled runtime is halted, so explicitly paint that transition.
    await draw();
    for(let i=0;i<30&&await page.evaluate(()=>inspected.env.modalAnimating());i++){
      await new Promise(resolve=>setTimeout(resolve,40));await draw();
    }
    await page.evaluate(({selector,label})=>{
      const el=[...inspected.doc.querySelectorAll(selector)].find(n=>!label||n.textContent.includes(label));
      if(!el)throw Error('Missing evolution control: '+selector+' '+label);
      const sc=el.closest('[data-dev-scroll]');if(sc){const b=el.getBoundingClientRect(),s=sc.getBoundingClientRect();if(b.bottom>s.bottom)sc.scrollTop+=b.bottom-s.bottom+8;else if(b.top<s.top)sc.scrollTop+=b.top-s.top-8;}
    },{selector,label});
    await draw();
    const point=await page.evaluate(({selector,label})=>{
      const el=[...inspected.doc.querySelectorAll(selector)].find(n=>!label||n.textContent.includes(label));
      const b=el.getBoundingClientRect(),screen=inspected.doc.getElementById('game').getBoundingClientRect();
      if(b.width<=0||b.height<=0)throw Error('Hidden evolution control: '+JSON.stringify({selector,label,state:app.run.state,hidden:el.hidden,style:el.style.cssText,modal:app.run.ui.modalEl?.textContent,screen:app.screen?.className}));return {x:b.x+b.width/2-screen.x,y:b.y+b.height/2-screen.y};
    },{selector,label});
    await page.touchscreen.tap(point.x,point.y);await new Promise(resolve=>setTimeout(resolve,120));await draw();
  };
  const dev=action=>tap('[data-dev-action="'+action+'"]');
  const state=()=>page.evaluate(()=>{const r=app.run,p=r.player;return {state:r.state,id:p.speciesId,stage:p.evoStage,level:p.level,next:r.nextEvo,ult:r.ult.name,kit:p.roster.kit,ability:p.ability,choices:[...inspected.doc.querySelectorAll('[data-branch-id]')].map(e=>+e.dataset.branchId)};});
  const start=async id=>{
    await page.evaluate(async id=>{
      await app.startRun({species:id,biome:'forest',tier:0,boosts:[],mode:'standard'});app.halted=true;
      const api=inspected.env.__zixingDeveloper;api.options.spawn=false;api.options.lockCount=false;api.options.invincible=true;
    },id);
    await new Promise(resolve=>setTimeout(resolve,180));await draw();
    assert.equal(await page.evaluate(()=>app.run.startSpecies),id);
  };
  const finish=async()=>{
    assert.equal((await state()).state,'evolving');
    await page.evaluate(()=>{for(let i=0;i<600;i++)app.run.update(1/60);});
    await draw();return state();
  };
  // Inspect the action frames submitted by the real renderer after each evolution.
  async function preview(word){
    await page.evaluate(()=>app.run.sprites.prepareHeroForm(app.run.player.speciesId));
    await dev('preview-hero-death');
    const sample=await page.evaluate(()=>{
      const r=app.run,p=r.player,s=r.sprites,get=s.getPlayerGlyph,frames=[];
      s.getPlayerGlyph=(...args)=>{
        const batch=get(...args),frame=args[3];
        frames.push({word:batch.zxGlyph,action:frame?.action,index:frame?.index,species:frame?.species});
        return batch;
      };
      try{
        for(let i=0;i<8;i++){
          r.realTime+=1/24;s.begin(r.r.camera);p.render();s.end();
        }
      }finally{s.getPlayerGlyph=get;}
      return {frames,dead:p.dead,species:p.speciesId};
    });
    assert.equal(sample.dead,false);
    assert.ok(sample.frames.every(f=>f.word===word&&f.action==='faint'&&f.species===sample.species));
    assert.ok(new Set(sample.frames.map(f=>f.index)).size>1);
    await dev('close-hero-death');
    assert.equal((await state()).id,sample.species);
    await dev('open');
  }
  await start(16);
  await preview('风');
  await page.evaluate(()=>inspected.env.__zixingDeveloper.apply({mode:'timed',time:60,count:0,boss:'none'}));
  await dev('close');assert.equal((await state()).state,'play');assert.equal((await state()).id,16);
  await dev('open');await page.evaluate(()=>inspected.env.__zixingDeveloper.apply({mode:'timed',time:180,count:0,boss:'none'}));
  assert.equal((await state()).state,'paused','Applying a preset must keep the test panel paused');
  await dev('close');assert.deepEqual((await state()).choices,[17,58]);
  const waiting=await state();
  await page.evaluate(()=>{window.evoWaitingTime=app.run.time;for(let i=0;i<300;i++)app.run.update(1/60);});
  assert.deepEqual(await state(),waiting,'Waiting for input must never choose a direction');
  assert.equal(await page.evaluate(()=>app.run.time===evoWaitingTime),true);
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:2});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await new Promise(resolve=>setTimeout(resolve,180));await draw();
    const bounds=await page.evaluate(()=>{inspected.layout.refresh(app.run.state);return [...inspected.doc.querySelectorAll('[data-branch-id]')].map(e=>{const b=inspected.layout.box(e);return {x:b.x,y:b.y,w:b.w,h:b.h,clip:b.clip};});});
    for(const b of bounds)assert.ok(b.x>=0&&b.x+b.w<=width+1&&b.y>=b.clip.y-1&&b.y+b.h<=b.clip.b+1);
    await page.screenshot({path:path.join(dir,'dev-evolution-branch-'+width+'.png')});report.widths.push({width,bounds});
  }
  for(const [choice,end] of [[17,18],[58,59]]){
    if(choice===58){await dev('evolve-next');assert.equal((await state()).level,18);assert.deepEqual((await state()).choices,[17,58]);}
    await tap('[data-branch-id="'+choice+'"]');
    assert.deepEqual((await state()).choices,[],'Choosing a route dismisses the only prompt');
    const middle=await finish();assert.equal(middle.id,choice);assert.deepEqual(middle.next,{to:end,level:36});
    await dev('open');await preview(choice===17?'讽':'飒');
    await page.evaluate(()=>inspected.env.__zixingDeveloper.apply({mode:'timed',time:180,count:0,boss:'none'}));
    await dev('close');assert.equal((await state()).id,choice);assert.deepEqual((await state()).choices,[]);
    await dev('open');await dev('evolve-next');assert.equal((await state()).level,36);
    const final=await finish();assert.equal(final.id,end);assert.equal(final.next,null);assert.equal(final.stage,2);
    assert.equal(final.ult,end===18?'刮倒一片':'跑得没影');assert.equal(final.ability,'');
    await dev('open');assert.equal(await page.evaluate(()=>inspected.doc.querySelector('[data-dev-action="evolve-next"]').disabled),true);
    await preview(end===18?'疯':'飙');
    await dev('stop-workload');
    const restored=await state();assert.equal(restored.id,16);assert.equal(restored.level,1);assert.equal(restored.stage,0);assert.equal(restored.ability,'');assert.deepEqual(restored.next,{to:-1,level:18});
    report.routes.push({choice,middle,final,restored});
  }
  await start(4);await page.screenshot({path:path.join(dir,'dev-fire-evolution-panel.png')});
  await preview('炎');
  await dev('evolve-next');assert.equal((await state()).level,18);
  report.fire=[await finish()];assert.equal(report.fire[0].id,5);
  await dev('open');await dev('evolve-next');report.fire.push(await finish());assert.equal(report.fire[1].id,6);assert.equal(report.fire[1].next,null);
  await dev('open');
  assert.equal(await page.evaluate(()=>inspected.doc.querySelector('[data-dev-action="evolve-next"]').disabled),true);
  assert.equal(await page.evaluate(()=>inspected.env.__zixingDeveloper.advanceEvolution()),false);
  await start(16);await page.evaluate(()=>inspected.env.__zixingDeveloper.apply({mode:'stress',time:0,count:0,boss:'none'}));await dev('close');
  report.stress=await state();assert.deepEqual(report.stress.choices,[17,58]);assert.equal(report.stress.id,16);
  await page.evaluate(()=>app.toMenu());assert.equal(await page.evaluate(()=>!!inspected.doc.querySelector('[data-branch-id]')),false);
  fs.writeFileSync(path.join(dir,'developer-evolution.json'),JSON.stringify(report,null,2));
  console.log('Developer evolution passed: player-selected wind paths, both final forms, fire path, restore, stress and 3 screen widths.');
}
