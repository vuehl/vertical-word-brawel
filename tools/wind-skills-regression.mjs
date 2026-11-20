import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewWindSkills(page,dir){
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  const supplement=process.argv.includes('--wind-supplement');
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
  for(const id of (supplement?[297]:process.argv.includes('--wind-skills-updated')?[16,542,17,297,33,50006,50088]:[98,332,239,16,542,17,297,33,50006,50088])){
    const def=await page.evaluate(async id=>{
      setupWind();const r=app.run;r.player.setSpecies(16);
      if(id===297){for(let i=0;i<r.enemies.n;i++)r.enemies.z[i]-=4;r.enemies.update();}
      if(!r.player.addMove(id))throw Error('Missing '+id);
      const m=r.player.moves[0];m.timer=0;
      await r.vfx.crafted.prepareMoveTexture(m.def.effectKey??m.def.key);
      return {id,key:m.def.key,name:m.def.name};
    },id);
    let visible=0;const poses=new Set();
    for(let i=0;i<32;i++){
      const state=await page.evaluate(()=>{
        vfxAdvance(2,1/60);const r=app.run;r.player.moves[0].timer=999;
        return [r.vfx.crafted.windMoves,r.vfx.crafted.windSkills].filter(Boolean).flatMap(a=>Array.from({length:a.mesh.count},(_,j)=>a.pose.getX(j)));
      });
      visible=Math.max(visible,state.length);state.forEach(p=>poses.add(p));
      if(i===2||i===6||i===14){await page.evaluate(()=>vfxDraw());await page.screenshot({path:path.join(dir,`wind-${id}-${i}.png`)});}
    }
    const result=await page.evaluate(()=>{vfxAdvance(180,1/30);const r=app.run;return {damage:r.player.moves[0].damageDone,remaining:(r.vfx.crafted.windMoves?.mesh.count||0)+(r.vfx.crafted.windSkills?.mesh.count||0),gl:app.r.renderer.getContext().getError()};});
    assert.ok(visible>0,def.key+' visible');assert.ok(poses.size>=2,def.key+' animated');assert.ok(result.damage>0,def.key+' damage');assert.equal(result.remaining,0);assert.equal(result.gl,0);
    report.moves.push({...def,...result,visible,poses:poses.size});fs.writeFileSync(path.join(dir,'wind-skills.json'),JSON.stringify(report,null,2));console.log('Wind skill',def.key,result.damage);
  }
  for(const species of (supplement?[]:[4,5,6])){
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
  for(const species of (supplement?[17]:[16,17,58])){
    const result=await page.evaluate(async species=>{
      setupWind();const r=app.run;r.player.setSpecies(species);await r.sprites.prepareHeroForm(species);
      await r.vfx.crafted.prepareMoveTexture('wind-ultimate');r.ult.charge=1;r.ult.fire();vfxAdvance(12,1/60);
      return {species,rings:r.vfx.rings.n,vortex:(r.vfx.crafted.windVortex?.mesh.count||0)+(r.vfx.crafted.windSkills?.mesh.count||0)};
    },species);
    assert.ok(species===17?result.rings>=3&&result.vortex>=26:result.vortex>0,JSON.stringify(result));report.ultimates.push(result);
    await page.evaluate(()=>vfxDraw());await page.screenshot({path:path.join(dir,`ultimate-${species}.png`)});
    if(species===17){
      const travel=await page.evaluate(()=>{
        const r=app.run,a=r.vfx.crafted.windSkills;
        const before=[...a.tracked.values()].map(e=>[e.x,e.z]);
        vfxAdvance(35,1/60);
        const after=[...a.tracked.values()].map(e=>[e.x,e.z]);
        const hp=Array.from(r.enemies.hp).reduce((a,b)=>a+b,0);
        vfxAdvance(120,1/60);
        return {before,after,damage:hp-Array.from(r.enemies.hp).reduce((a,b)=>a+b,0),remaining:a.mesh.count};
      });
      assert.equal(travel.before.length,2);assert.equal(travel.after.length,2);
      assert.notDeepEqual(travel.before,travel.after);assert.ok(travel.damage>0,'Travelling tornadoes still hit after the initial ring');assert.equal(travel.remaining,0);
      result.travel=travel;
    }
    fs.writeFileSync(path.join(dir,'wind-skills.json'),JSON.stringify(report,null,2));
  }
  report.speed=await page.evaluate(async()=>{
    setupWind();const r=app.run,p=r.player;p.setSpecies(59);await r.sprites.prepareHeroForm(59);
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
