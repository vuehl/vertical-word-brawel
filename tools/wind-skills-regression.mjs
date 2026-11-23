import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewWindSkills(page,dir){
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  const report={moves:[],fire:[],ultimates:[]};
  await page.evaluate(async()=>{
    if(!await app.startRun({species:16,biome:'forest',tier:0,boosts:[],mode:'standard'}))throw Error('Wind run failed');
    const t=app.run.terrain;
    for(let z=-24;z<=24;z+=3)for(let x=-24;x<=24;x+=3){
      if(Array.from({length:28},(_,i)=>z-i*.4).every(zz=>t.inBounds(x,zz,2)&&t.isFlatOpen(x,zz)&&!t.hitProp(x,t.surface(x,zz)+.5,zz,2))){window.windLane={x,z};return;}
    }
    throw Error('No open lane');
  });
  await page.evaluate(()=>{
    window.setupWind=()=>{
      vfxSetup();const r=app.run,p=r.player,e=r.enemies,{x,z}=windLane;r.ghosts.length=0;
      p.pos.set(x,r.terrain.surface(x,z),z);r.camTarget.copy(p.pos);
      for(let i=0;i<e.n;i++){e.x[i]=x+(i%2?.4:-.4);e.z[i]=z-3-i*2;e.y[i]=r.terrain.surface(e.x[i],e.z[i]);e.kx[i]=e.kz[i]=0;}
      e.update();r.lockTarget=0;
    };
  });
  for(const id of [98,332,239,17,33,49001,50006,50106]){
    const def=await page.evaluate(async id=>{
      setupWind();const r=app.run;r.player.setSpecies(16);
      if(!r.player.addMove(id))throw Error('Missing '+id);
      const m=r.player.moves[0];m.timer=0;
      await r.vfx.crafted.prepareMoveTexture(m.def.effectKey??m.def.key);
      return {id,key:m.def.key,name:m.def.name};
    },id);
    let visible=0;const poses=new Set();
    for(let i=0;i<32;i++){
      const state=await page.evaluate(()=>{
        vfxAdvance(2,1/60);const r=app.run;r.player.moves[0].timer=999;
        if(r.player.moves[0].def.key==='wind-ring-wave')return Array.from({length:r.vfx.rings.n},(_,j)=>j);
        return [r.vfx.crafted.windMoves,r.vfx.crafted.windSkills].filter(Boolean).flatMap(a=>Array.from({length:a.mesh.count},(_,j)=>a.pose.getX(j)));
      });
      visible=Math.max(visible,state.length);state.forEach(p=>poses.add(p));
      if(i===2||i===6||i===14){await page.evaluate(()=>vfxDraw());await page.screenshot({path:path.join(dir,`wind-${id}-${i}.png`)});}
    }
    const result=await page.evaluate(()=>{vfxAdvance(180,1/30);const r=app.run;return {damage:r.player.moves[0].damageDone,remaining:(r.vfx.crafted.windMoves?.mesh.count||0)+(r.vfx.crafted.windSkills?.mesh.count||0),gl:app.r.renderer.getContext().getError()};});
    assert.ok(visible>0,def.key+' visible');assert.ok(poses.size>=2,def.key+' animated');assert.ok(result.damage>0,def.key+' damage');assert.equal(result.remaining,0);assert.equal(result.gl,0);
    report.moves.push({...def,...result,visible,poses:poses.size});fs.writeFileSync(path.join(dir,'wind-skills.json'),JSON.stringify(report,null,2));console.log('Wind skill',def.key,result.damage);
  }
  for(const species of [4,5,6]){
    const result=await page.evaluate(async species=>{
      setupWind();const r=app.run,p=r.player;p.setSpecies(species);await r.sprites.prepareHeroForm(species);
      if(!p.addMove(488))throw Error('Missing stampede');p.moves[0].timer=0;
      vfxAdvance(4,1/60);p.moves[0].timer=999;
      const ghosts=r.ghosts.filter(g=>g.fireGlyph),batch=r.sprites.getHeroGhostGlyph(species);
      return {species,name:p.moves[0].def.name,ghosts:ghosts.map(g=>g.species),word:batch?.zxGlyph,visible:batch?.zxGroup.mesh.count,shader:batch?.zxGroup.material.fragmentShader};
    },species);
    await page.evaluate(()=>vfxDraw());await page.screenshot({path:path.join(dir,`stampede-${species}.png`)});
    assert.equal(result.name,'烈焰狂奔');assert.ok(result.ghosts.length>0);assert.ok(result.ghosts.every(id=>id===species));assert.equal(result.word,{4:'炎',5:'焱',6:'燚'}[species]);assert.ok(result.visible>0);assert.ok(result.shader.includes('c.a*='));delete result.shader;
    Object.assign(result,await page.evaluate(()=>{vfxAdvance(150,1/30);return {damage:app.run.player.moves[0].damageDone,remaining:app.run.ghosts.filter(g=>g.fireGlyph).length};}));
    assert.ok(result.damage>0);assert.equal(result.remaining,0);report.fire.push(result);
    fs.writeFileSync(path.join(dir,'wind-skills.json'),JSON.stringify(report,null,2));
  }
  for (const species of [16,17,18,58,59]) {
    const result=await page.evaluate(async species=>{
      setupWind();const r=app.run,p=r.player;p.setSpecies(species);p.buffs.clear();p.recompute();
      await r.vfx.crafted.prepareMoveTexture('wind-ultimate');
      const before={attack:p.stats.attackSpeed,move:p.stats.moveSpeed};
      r.ult.charge=1;r.ult.fire();vfxAdvance(12,1/60);
      return {species,name:r.ult.name,attack:p.stats.attackSpeed/before.attack,move:p.stats.moveSpeed/before.move,
        vortex:r.vfx.crafted.windVortex?.mesh.count||0};
    },species);
    if(species===16){assert.equal(result.name,'一阵风刮来');assert.ok(result.vortex>0);}
    else {
      const attack=[17,18].includes(species);
      assert.equal(result.name,attack?'刮倒一片':'跑得没影');
      assert.ok(Math.abs(result.move-(attack?1:10))<1e-6);
      assert.ok(Math.abs(result.attack-(attack?10:1))<1e-6);
    }
    report.ultimates.push(result);
    await page.screenshot({path:path.join(dir,`ultimate-${species}.png`)});
  }
  report.boss=await page.evaluate(()=>{
    setupWind();const r=app.run,p=r.player,e=r.enemies;
    p.setSpecies(58);p.buffs.clear();p.recompute();r.ult.def.cast({run:r});
    const target=0;
    e.flags[target]|=4; // Boss
    const opts={type:'flying',cls:'physical',slot:0,noReact:true,fixed:true,silent:true};
    const hp=e.hp[target];
    for(let j=0;j<40;j++)r.combat.hit(target,hp*100,opts);
    return {before:hp,after:e.hp[target]};
  });
  assert.ok(Math.abs(report.boss.after/report.boss.before-.92)<.00001,JSON.stringify(report.boss));
  report.speed=await page.evaluate(async()=>{
    setupWind();const r=app.run,p=r.player;p.setSpecies(59);p.buffs.clear();p.recompute();await r.sprites.prepareHeroForm(59);
    const key='ziling-wind-speed',base=p.stats.moveSpeed;
    r.ult.charge=1;r.ult.fire();vfxAdvance(4,1/60);
    const boosted=p.stats.moveSpeed;
    r.input.stickX=1;
    vfxAdvance(10,1/60);r.input.stickX=0;
    const ghosts=r.ghosts.filter(g=>g.windGlyph),batch=r.sprites.getHeroGhostGlyph(59,'wind');
    window.windSpeedReview={base,boosted,ghosts:ghosts.map(g=>({species:g.species,scale:g.scale,x:g.x,z:g.z})),word:batch.zxGlyph,visible:batch.zxGroup.mesh.count,opening:r.vfx.crafted.windSkills.events.some(e=>e.clip==='gust'),oldVolume:r.vfx.crafted.entries.some(e=>e.mode===1)};
    vfxDraw();return window.windSpeedReview;
  });
  fs.writeFileSync(path.join(dir,'wind-skills.json'),JSON.stringify(report,null,2));
  assert.ok(Math.abs(report.speed.boosted/report.speed.base-10)<1e-8,JSON.stringify(report.speed));
  assert.ok(report.speed.ghosts.length>0&&report.speed.ghosts.length<=5);
  assert.ok(report.speed.ghosts.every(g=>g.species===59&&Number.isFinite(g.scale)));
  assert.equal(report.speed.word,'飙');assert.ok(report.speed.visible>0);
  assert.ok(report.speed.opening);assert.equal(report.speed.oldVolume,false);
  await page.screenshot({path:path.join(dir,'ultimate-59-speed.png')});
  Object.assign(report.speed,await page.evaluate(()=>{
    const r=app.run,p=r.player,key='ziling-wind-speed',timer=p.buffs.get(key).t;
    r.state='paused';r.update(1);r.renderWorld(1);const paused=p.buffs.get(key).t;
    r.state='play';r.vfx.opacity=.25;r.renderWorld(0);
    const opacity=r.sprites.getHeroGhostGlyph(59,'wind').zxGroup.mesh.count;
    r.hideOwnFx=true;r.renderWorld(0);const hidden=r.ghosts.filter(g=>g.windGlyph).length;
    r.hideOwnFx=false;r.vfx.opacity=1;
    r.ult.def.cast({run:r});const refreshed=p.buffs.get(key).t,refreshSpeed=p.stats.moveSpeed;
    vfxAdvance(330,1/60);
    return {timer,paused,opacity,hidden,refreshed,refreshSpeed,expired:!p.buffs.has(key),after:p.stats.moveSpeed,remaining:r.ghosts.filter(g=>g.windGlyph).length,gl:r.r.renderer.getContext().getError()};
  }));
  assert.equal(report.speed.timer,report.speed.paused);assert.ok(report.speed.opacity>0);assert.equal(report.speed.hidden,0);
  assert.equal(report.speed.refreshed,5);assert.equal(report.speed.refreshSpeed,report.speed.boosted);
  assert.ok(report.speed.expired);assert.equal(report.speed.after,report.speed.base);assert.equal(report.speed.remaining,0);assert.equal(report.speed.gl,0);
  report.lifecycle=await page.evaluate(()=>{const r=app.run,a=r.vfx.crafted.windSkillArt();a.play('wingHit',0,1,0,3);r.hideOwnFx=true;a.begin();a.end();const hidden=a.mesh.count===0&&a.events.length===0;r.hideOwnFx=false;a.track({},'typhoon',0,0,0,6);r.vfx.crafted.clear();return {hidden,cleared:a.events.length===0&&a.tracked.size===0,gl:app.r.renderer.getContext().getError()};});
  assert.ok(report.lifecycle.hidden&&report.lifecycle.cleared);assert.equal(report.lifecycle.gl,0);
  fs.writeFileSync(path.join(dir,'wind-skills.json'),JSON.stringify(report,null,2));
}
