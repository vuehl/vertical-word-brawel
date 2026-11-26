import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewStarters({page,tap,resize,dir,sleep}){
  const report={mode:'compiled WeChat runtime in Chrome; controlled combat and real touch selection',menus:[],routes:[],ultimates:[]};
  const draw=()=>page.evaluate(()=>{
    const r=app.run;if(r){r.ui.hud(r);r.renderWorld(0);}app.r.render(0);inspected.env.drawUI(app.r.renderer);
  });
  const snapshot=async name=>{await draw();await sleep(300);await page.screenshot({path:path.join(dir,name+'.png')});};
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await resize(width,height);await page.evaluate(()=>app.zixing.home());
    assert.deepEqual(await page.evaluate(()=>[...app.screen.querySelectorAll('.zx-home-types .zx-glyph')].map(e=>e.getAttribute('aria-label'))),['炎','风']);
    await snapshot('home-'+width);
    await tap('[data-action="journey"]');
    assert.deepEqual(await page.evaluate(()=>[...inspected.doc.querySelectorAll('[data-species]')].map(e=>Number(e.dataset.species))),[4,16]);
    await snapshot('choose-before-'+width);
    for(const [id,word,ult] of [[4,'炎','一点火苗'],[16,'风','阵风']]){
      await tap('[data-species="'+id+'"]');await snapshot('choose-'+id+'-'+width);
      const data=await page.evaluate(()=>{
        const canvas=app.screen.querySelector('.zx-glyph.large canvas'),box=canvas.getBoundingClientRect();
        const buttons=[...inspected.doc.querySelectorAll('.zx-choices button')].map(e=>{
          const b=inspected.layout.box(e);return {id:e.dataset.species,x:b.x,w:b.w};
        });
        return {text:app.screen.textContent,buttons,preview:{pixels:canvas.width,width:box.width}};
      });
      assert.ok(data.preview.width>0&&data.preview.pixels>=3*data.preview.width,'Large starter art must cover a 3x display');
      assert.ok(data.text.includes(word)&&data.text.includes(ult));
      assert.ok(data.text.includes(({4:'火点拍',16:'电光一闪'})[id]+'  ·  自动攻击'));assert.ok(!data.text.includes('积蓄能量，释放专属大招'));
      for(const b of data.buttons)assert.ok(b.x>=0&&b.x+b.w<=width+1);
      report.menus.push({width,id,word,ult,preview:data.preview});
    }
  }
  await resize(390,844);
  await tap('.zx-footer button','选择关卡');await tap('.zx-footer button','选择难度');await tap('[data-action="enter"]');
  await page.waitForFunction(()=>app.run?.state==='play',{timeout:60000});
  // Reproduce the reported card using the opening wind hero's real offer pool.
  const ringCard=await page.evaluate(()=>{
    app.halted=true;
    const r=app.run,ui=r.ui,{showLevelUp,experienceReady}=ui;
    const random=Math.random;
    let seed=16,options,pick;
    try{
      Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
      ui.experienceReady=()=>true;
      ui.showLevelUp=(_run,offers,choose)=>{options=offers;pick=choose;};
      r.player.level=2;r.pendingLevels=1;r.rerolls=100;r.doLevelUp();
      const ring=offer=>offer.kind==='newMove'&&offer.id===49001;
      while(!options.some(ring)&&r.rerolls>0)pick(null,'reroll');
      const index=options.findIndex(ring);
      if(index<0)throw Error('Ring Wave missing from wind hero draft');
      showLevelUp(r,options,pick);
      const card=ui.modalEl.querySelector('[data-offer="'+index+'"]');
      return {index,title:card.querySelector('b').textContent,text:card.textContent};
    }finally{Object.assign(ui,{showLevelUp,experienceReady});Math.random=random;}
  });
  assert.equal(ringCard.title,'起风');
  assert.doesNotMatch(ringCard.text,/新招式/);
  assert.match(ringCard.text,/扩散|波/);
  await page.waitForFunction(()=>{
    inspected.env.drawUI(app.r.renderer);
    return !inspected.modalTransition.active;
  });
  await snapshot('wind-ring-wave-offer');
  await tap('[data-offer="'+ringCard.index+'"]');
  await draw(); // The halted game needs a UI frame to complete the exit and apply the choice.
  assert.deepEqual(await page.evaluate(()=>app.run.player.moves.filter(Boolean).map(m=>m.def.name)),['电光一闪','起风']);
  await page.evaluate(()=>{
    app.halted=true;
    window.starterTestSetup=()=>{
      const r=app.run;r.ui.hideModal();r.state='play';r.godMode=true;r.director.update=()=>{};r.hitstop=()=>{};
      r.player.moves=Array(4).fill(null);r.pendingLevels=0;r.ult.clear();
    };
    starterTestSetup();
    window.starterTestAdvance=frames=>{for(let i=0;i<frames;i++)app.run.update(1/60);};
  });
  const start=async (id,mode='standard')=>{
    await page.evaluate(async ({id,mode})=>{await app.startRun({species:id,biome:'forest',tier:0,boosts:[],mode});app.halted=true;starterTestSetup();},{id,mode});
  };
  for(const [choice,end] of [[17,18],[58,59]]){
    const single=choice===17;
    await start(16,single?'single-stage':'standard');
    const plan=await page.evaluate(()=>{
      const r=app.run;r.player.level=r.nextEvo.level;r.player.xpNext=r.player.xpFor(r.player.level);r.player.recompute();
      const next={...r.nextEvo};r.tryEvolve();return next;
    });assert.deepEqual(plan,{to:-1,level:single?12:18});
    for(const [width,height] of [[320,568],[390,844],[430,932]]){
      await resize(width,height);await snapshot('branch-'+choice+'-'+width);
      const bounds=await page.evaluate(()=>[...inspected.doc.querySelectorAll('[data-branch-id]')].map(e=>{
        inspected.layout.refresh(app.run.state);const b=inspected.layout.box(e);return {x:b.x,y:b.y,w:b.w,h:b.h,clip:b.clip};
      }));
      for(const b of bounds)assert.ok(b.x>=0&&b.x+b.w<=width+1&&b.y>=b.clip.y-1&&b.y+b.h<=b.clip.b+1,'Both branch choices must be fully visible: '+JSON.stringify({width,b}));
    }
    await resize(390,844);await snapshot('branch-'+choice);
    assert.deepEqual(await page.evaluate(()=>[...inspected.doc.querySelectorAll('[data-branch-id]')].map(e=>Number(e.dataset.branchId))),[17,58]);
    await page.evaluate(()=>{window.staleBranches=[...inspected.doc.querySelectorAll('[data-branch-id]')];});
    await tap('[data-branch-id="'+choice+'"]');
    await page.evaluate(()=>{for(const b of staleBranches)b.click();});
    assert.equal(await page.evaluate(()=>app.run.nextEvo.to),choice,'Removed branch cards cannot switch the selected route');
    await snapshot('confirm-'+choice);
    await tap('.zx-modal button','确认进阶');
    const middle=await page.evaluate(()=>{
      starterTestAdvance(300);const r=app.run;
      return {id:r.player.speciesId,next:r.nextEvo,ult:r.ult.name,types:r.player.types,kit:r.player.roster.kit};
    });assert.equal(middle.id,choice);assert.deepEqual(middle.next,{to:end,level:single?24:36});
    assert.equal(middle.ult,choice===17?'刮倒一片':'跑得没影');
    await page.evaluate(()=>{const r=app.run;r.player.level=r.nextEvo.level;r.player.xpNext=r.player.xpFor(r.player.level);r.tryEvolve();});
    await draw();await tap('.zx-modal button','确认进阶');
    const final=await page.evaluate(()=>{
      starterTestAdvance(300);const r=app.run;return {id:r.player.speciesId,next:r.nextEvo,ult:r.ult.name,types:r.player.types,kit:r.player.roster.kit,passive:r.player.ability};
    });assert.equal(final.id,end);assert.equal(final.next,null);assert.deepEqual(final.types,['flying']);
    assert.equal(final.ult,end===18?'刮倒一片':'跑得没影');assert.equal(final.passive,'');
    assert.deepEqual(final.kit,middle.kit);
    await draw();
    assert.deepEqual(await page.evaluate(()=>({name:inspected.doc.querySelector('.zx-hud-name').textContent,type:inspected.doc.querySelector('.zx-hud-element').textContent})),{name:end===18?'疯':'飙',type:'风'});
    await snapshot('evolved-'+end);report.routes.push({choice,end,plan,middle,final});
  }
  // Exercise all playable ultimate definitions. Keep enemies alive so normal
  // XP and level-up selection cannot alter these controlled observations.
  for(const id of [4,5,6,16,17,18,58,59]){
    await start([4,5,6].includes(id)?4:16);
    const sample=await page.evaluate(id=>{
      const r=app.run,p=r.player;
      if(p.speciesId!==id){p.setSpecies(id);p.evoStage=[6,18,59].includes(id)?2:1;p.recompute();r.nextEvo=r.planEvolution(id,1);}
      p.level=30;p.recompute();r.pendingLevels=0;
      for(let j=0;j<12;j++){
        const a=j/12*Math.PI*2,x=p.pos.x+Math.cos(a)*5,z=p.pos.z+Math.sin(a)*5;
        const i=r.enemies.spawn(19,x,z,1,1,0);r.enemies.hp[i]=r.enemies.maxHp[i]=1e7;
      }
      const opening = [4,5,6].includes(id)?52:98;
      p.addMove(opening);
      const basic = p.moves[0].def.name;
      r.ui.hud(r);
      const label = inspected.doc.querySelector('[data-skill-slot]').getAttribute('aria-label');
      p.moves.fill(null);
      window.starterHp=()=>Array.from({length:r.enemies.n},(_,i)=>r.enemies.alive[i]?r.enemies.hp[i]:0).reduce((a,b)=>a+b,0);
      const before=starterHp(),speed=p.stats[[17,18].includes(id)?"attackSpeed":"moveSpeed"];
      r.ult.charge=1;r.ult.fire();starterTestAdvance(3);
      const active={name:r.ult.name,def:r.ult.def.names,duration:r.ult.def.dur[0],speed:p.stats[[17,18].includes(id)?"attackSpeed":"moveSpeed"],buffs:[...p.buffs].map(([key,b])=>[key,b.t,b.label])};
      return {id,before,speed,active,basic,label,passive:p.abilityName};
    },id);
    const basic=({4:'火点拍',5:'火点拍',6:'火点拍',16:'电光一闪',17:'电光一闪',18:'电光一闪',58:'电光一闪',59:'电光一闪'})[id];
    assert.equal(sample.basic,basic);
    assert.ok(sample.label.includes(basic),sample.label);
    if([4,5,6].includes(id))assert.equal(sample.passive,'');
    await snapshot('ultimate-'+id);
    if([17,18,58,59].includes(id)){
      const multiplier=({17:10,18:10,58:2,59:3})[id];
      assert.ok(Math.abs(sample.active.speed/sample.speed-multiplier)<1e-8,'Unexpected wind ultimate multiplier for '+id);
      const timers=await page.evaluate(id=>{
        const r=app.run,p=r.player,key=[17,18].includes(id)?'ziling-wind-attack-speed':'ziling-wind-speed',before=p.buffs.get(key).t;
        r.state='paused';r.update(2);const paused=p.buffs.get(key).t;r.state='play';
        r.ult.def.cast({run:r});const refreshed=p.buffs.get(key).t,speed=p.stats[[17,18].includes(id)?'attackSpeed':'moveSpeed'];
        starterTestAdvance(330);return {before,paused,refreshed,speed,after:p.stats[[17,18].includes(id)?'attackSpeed':'moveSpeed'],buffs:[...p.buffs.keys()]};
      },id);assert.equal(timers.paused,timers.before);assert.equal(timers.refreshed,5);assert.equal(timers.speed,sample.active.speed);
      assert.ok(Math.abs(timers.after-sample.speed)<1e-8);assert.ok(!timers.buffs.some(key=>key.startsWith('ziling-wind-')));sample.timers=timers;
    }else{
      const result=await page.evaluate(()=>{starterTestAdvance(480);return {after:starterHp(),uses:app.run.ult.uses};});
      assert.ok(result.after<sample.before,'Original ultimate must inflict real combat damage for '+id);assert.equal(result.uses,1);sample.result=result;
    }
    report.ultimates.push(sample);
  }
  await page.evaluate(()=>{app.meta.profile.lab['slot-move']=1;});
  await start(4);
  report.slots=await page.evaluate(async()=>{
    const r=app.run;
    const count=()=>{r.ui.hud(r);return [r.stage,r.player.moveSlots,inspected.doc.querySelectorAll('[data-skill-slot]').length];};
    const first=count();await r.changeZone();return [first,count()];
  });
  assert.deepEqual(report.slots,[[1,3,3],[2,4,4]]);
  fs.writeFileSync(path.join(dir,'starter-regression.json'),JSON.stringify(report,null,2));
  console.log('Starter regression passed:',report.menus.length,'menu variants, two complete routes, eight ultimates, speed multipliers, pause and expiry');
}
