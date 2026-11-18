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
    await tap('[data-action="journey"]');
    assert.deepEqual(await page.evaluate(()=>[...inspected.doc.querySelectorAll('[data-species]')].map(e=>Number(e.dataset.species))),[4,132,16]);
    await snapshot('choose-before-'+width);
    for(const [id,word,ult] of [[4,'炎','一点火苗'],[132,'摹','照着变'],[16,'风','一阵刮来']]){
      await tap('[data-species="'+id+'"]');await snapshot('choose-'+id+'-'+width);
      const data=await page.evaluate(()=>({text:app.screen.textContent,buttons:[...inspected.doc.querySelectorAll('.zx-choices button')].map(e=>{
        const b=inspected.layout.box(e);return {id:e.dataset.species,x:b.x,w:b.w};
      })}));
      assert.ok(data.text.includes(word)&&data.text.includes(ult));assert.ok(!data.text.includes('积蓄能量，释放专属大招'));
      for(const b of data.buttons)assert.ok(b.x>=0&&b.x+b.w<=width+1);
      report.menus.push({width,id,word,ult});
    }
  }
  await resize(390,844);
  await tap('.zx-footer button','选择关卡');await tap('.zx-footer button','选择难度');await tap('[data-action="enter"]');
  await page.waitForFunction(()=>app.run?.state==='play',{timeout:60000});
  await page.evaluate(()=>{
    app.halted=true;
    window.starterTestSetup=()=>{
      const r=app.run;r.ui.hideModal();r.state='play';r.godMode=true;r.director.update=()=>{};r.hitstop=()=>{};
      r.player.moves=Array(4).fill(null);r.pendingLevels=0;r.ult.clear();
    };
    starterTestSetup();
    window.starterTestAdvance=frames=>{for(let i=0;i<frames;i++)app.run.update(1/60);};
  });
  const start=async id=>{
    await page.evaluate(async id=>{await app.startRun({species:id,biome:'forest',tier:0,boosts:[],mode:'standard'});app.halted=true;starterTestSetup();},id);
  };
  for(const [choice,end] of [[17,58],[18,59]]){
    await start(16);
    const plan=await page.evaluate(()=>{
      const r=app.run;r.player.level=26;r.player.xpNext=r.player.xpFor(26);r.player.recompute();
      const next={...r.nextEvo};r.tryEvolve();return next;
    });assert.deepEqual(plan,{to:-1,level:26});
    for(const [width,height] of [[320,568],[390,844],[430,932]]){
      await resize(width,height);await snapshot('branch-'+choice+'-'+width);
      const bounds=await page.evaluate(()=>[...inspected.doc.querySelectorAll('[data-branch-id]')].map(e=>{
        inspected.layout.refresh(app.run.state);const b=inspected.layout.box(e);return {x:b.x,y:b.y,w:b.w,h:b.h,clip:b.clip};
      }));
      for(const b of bounds)assert.ok(b.x>=0&&b.x+b.w<=width+1&&b.y>=b.clip.y-1&&b.y+b.h<=b.clip.b+1,'Both branch choices must be fully visible: '+JSON.stringify({width,b}));
    }
    await resize(390,844);await snapshot('branch-'+choice);
    assert.deepEqual(await page.evaluate(()=>[...inspected.doc.querySelectorAll('[data-branch-id]')].map(e=>Number(e.dataset.branchId))),[17,18]);
    await page.evaluate(()=>{window.staleBranches=[...inspected.doc.querySelectorAll('[data-branch-id]')];});
    await tap('[data-branch-id="'+choice+'"]');
    await page.evaluate(()=>{for(const b of staleBranches)b.click();});
    assert.equal(await page.evaluate(()=>app.run.nextEvo.to),choice,'Removed branch cards cannot switch the selected route');
    await snapshot('confirm-'+choice);
    await tap('.zx-modal button','确认进阶');
    const middle=await page.evaluate(()=>{
      starterTestAdvance(300);const r=app.run;
      return {id:r.player.speciesId,next:r.nextEvo,ult:r.ult.name,types:r.player.types};
    });assert.equal(middle.id,choice);assert.deepEqual(middle.next,{to:end,level:44});
    assert.equal(middle.ult,choice===17?'卷着打转':'刮倒一片');
    await page.evaluate(()=>{const r=app.run;r.player.level=44;r.player.xpNext=r.player.xpFor(44);r.tryEvolve();});
    await draw();await tap('.zx-modal button','确认进阶');
    const final=await page.evaluate(()=>{
      starterTestAdvance(300);const r=app.run;return {id:r.player.speciesId,next:r.nextEvo,ult:r.ult.name,types:r.player.types,kit:r.player.roster.kit,passive:r.player.ability};
    });assert.equal(final.id,end);assert.equal(final.next,null);assert.deepEqual(final.types,['fire']);
    assert.equal(final.ult,end===58?'冲！':'没影了');assert.equal(final.passive,'loyal-guard');
    assert.deepEqual(final.kit,['fire-fang','flame-wheel','extreme-speed','flare-blitz']);
    await draw();
    assert.deepEqual(await page.evaluate(()=>({name:inspected.doc.querySelector('.zx-hud-name').textContent,type:inspected.doc.querySelector('.zx-hud-element').textContent})),{name:end===58?'飒':'飙',type:'火'});
    await snapshot('evolved-'+end);report.routes.push({choice,end,plan,middle,final});
  }
  // Exercise all nine actual ultimate definitions. Keep enemies alive so normal
  // XP and level-up selection cannot alter these controlled observations.
  for(const id of [4,5,6,132,16,17,18,58,59]){
    await start([4,5,6].includes(id)?4:id===132?132:16);
    const sample=await page.evaluate(id=>{
      const r=app.run,p=r.player;
      if(p.speciesId!==id){p.setSpecies(id);p.evoStage=[6,58,59].includes(id)?2:1;p.recompute();r.nextEvo=r.planEvolution(id,1);}
      p.level=30;p.recompute();r.pendingLevels=0;
      for(let j=0;j<12;j++){
        const a=j/12*Math.PI*2,x=p.pos.x+Math.cos(a)*5,z=p.pos.z+Math.sin(a)*5;
        const i=r.enemies.spawn(19,x,z,1,1,0);r.enemies.hp[i]=r.enemies.maxHp[i]=1e7;
      }
      window.starterHp=()=>Array.from({length:r.enemies.n},(_,i)=>r.enemies.alive[i]?r.enemies.hp[i]:0).reduce((a,b)=>a+b,0);
      const before=starterHp(),speed=p.stats.moveSpeed;
      r.ult.charge=1;r.ult.fire();starterTestAdvance(3);
      const active={name:r.ult.name,def:r.ult.def.names,duration:r.ult.def.dur[0],speed:p.stats.moveSpeed,buffs:[...p.buffs].map(([key,b])=>[key,b.t,b.label])};
      return {id,before,speed,active};
    },id);
    await snapshot('ultimate-'+id);
    if(id===18||id===59){
      assert.ok(Math.abs(sample.active.speed/sample.speed-10)<1e-8,'Actual combat movement stat must be exactly tenfold');
      const timers=await page.evaluate(()=>{
        const r=app.run,p=r.player,key='ziling-wind-speed',before=p.buffs.get(key).t;
        r.state='paused';r.update(2);const paused=p.buffs.get(key).t;r.state='play';
        r.ult.def.cast({run:r});const refreshed=p.buffs.get(key).t,speed=p.stats.moveSpeed;
        starterTestAdvance(330);return {before,paused,refreshed,speed,after:p.stats.moveSpeed,buffs:[...p.buffs.keys()]};
      });assert.equal(timers.paused,timers.before);assert.equal(timers.refreshed,5);assert.equal(timers.speed,sample.active.speed);
      assert.ok(Math.abs(timers.after-sample.speed)<1e-8);assert.ok(!timers.buffs.includes('ziling-wind-speed'));sample.timers=timers;
    }else{
      const result=await page.evaluate(()=>{starterTestAdvance(480);return {after:starterHp(),uses:app.run.ult.uses};});
      assert.ok(result.after<sample.before,'Original ultimate must inflict real combat damage for '+id);assert.equal(result.uses,1);sample.result=result;
    }
    report.ultimates.push(sample);
  }
  await start(132);assert.equal(await page.evaluate(()=>app.run.nextEvo),null);
  fs.writeFileSync(path.join(dir,'starter-regression.json'),JSON.stringify(report,null,2));
  console.log('Starter regression passed:',report.menus.length,'menu variants, two complete routes, nine ultimates, 10x speed, pause and expiry');
}
