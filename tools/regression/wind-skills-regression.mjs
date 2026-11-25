import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import windMoves from '../../resources/public/assets/vfx/wind-moves.json' with {type:'json'};
import replacements from '../../resources/public/assets/vfx/wind-replacements.json' with {type:'json'};

export async function reviewWindSkills(page,dir){
  await page.setViewport({width:390,height:844,deviceScaleFactor:process.env.WIND_REFERENCE_DIR?2:1});
  await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));app.r.sizeKey='';app.r.dynRes=1;app.r.resize();});
  const report={moves:[],fire:[],ultimates:[]};
  await page.evaluate(async()=>{
    if(!await app.startRun({species:16,biome:'forest',tier:0,boosts:[],mode:'standard',seed:20261123}))throw Error('Wind run failed');
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
  if(process.env.WIND_REFERENCE_DIR){
    const {recordWindReference}=await import('./wind-reference-review.mjs');
    await recordWindReference(page,process.env.WIND_REFERENCE_DIR,
      process.env.WIND_REFERENCE_OUT||path.join(import.meta.dirname,'../../验收/风系GIF逐项对照'));
    if(process.argv.includes('--wind-record-only'))return;
  }
  report.rushContacts=await page.evaluate(()=>{
    const samples=[];
    for(const species of [58,59]){
      setupWind();
      const r=app.run,p=r.player,e=r.enemies,{x,z}=windLane;
      p.setSpecies(species);p.addMove(98);
      const move=p.moves[0];
      move.mods.dmg=1.5;move.level=3;
      const baseSpeed=p.stats.moveSpeed;
      e.clear();const target=e.spawn(19,x,z-2,1,1,0);
      e.hp[target]=e.maxHp[target]=5000;e.radius[target]=.6;e.y[target]=p.pos.y;
      e.update();r.camYaw=0;
      const reset=()=>{p.pos.set(x,r.terrain.surface(x,z),z);p.vel.set(0,0,0);p.grounded=true;};
      const walk=frames=>{r.input.stickY=1;for(let i=0;i<frames;i++)p.update(1/120);r.input.stickY=0;};
      reset();walk(50);
      const beforeCast=5000-e.hp[target];
      reset();r.ult.def.cast({run:r});
      const speed=p.stats.moveSpeed/baseSpeed;
      p.stats.critChance=p.stats.megaCrit=0;
      const base=move.def.dmg*1.3*move.mods.dmg*(1+(move.level-1)*.04);
      const basic=r.combat.hit(target,base,{type:move.def.type,cls:move.def.cls,noReact:true,knock:0});
      const before=e.hp[target];
      for(let frame=0;frame<60&&e.hp[target]===before;frame++)walk(1);
      const first=before-e.hp[target];
      r.ult.def.cast({run:r});walk(4);
      const sustained=before-e.hp[target]-first;
      reset();walk(45);
      const second=before-e.hp[target]-first-sustained;
      reset();p.vel.set(0,0,0);
      for(let i=0;i<601;i++)p.update(1/120);
      const expiredSpeed=p.stats.moveSpeed/baseSpeed,after=e.hp[target];
      reset();walk(50);
      samples.push({species,speed,basic,first,sustained,second,beforeCast,expiredSpeed,afterExpiry:after-e.hp[target]});
    }
    return samples;
  });
  for(const sample of report.rushContacts){
    const multiplier=sample.species===58?2:3;
    assert.equal(sample.speed,multiplier);assert.ok(sample.basic>0);
    for(const damage of [sample.first,sample.second])
      assert.ok(Math.abs(damage-sample.basic*multiplier)<.002,JSON.stringify(sample));
    assert.equal(sample.beforeCast,0);assert.equal(sample.sustained,0);
    assert.equal(sample.expiredSpeed,1);assert.equal(sample.afterExpiry,0);
  }
  console.log('Wind rush speed and collision damage verified',report.rushContacts);
  report.airSlash=await page.evaluate(async(hitFrame)=>{
    setupWind();
    const r=app.run,p=r.player,e=r.enemies,pool=r.projectiles;
    p.setSpecies(16);p.addMove(403);
    const move=p.moves[0];
    move.mods.count+=2;
    const duration=move.def.dur*move.mods.dur*p.stats.duration;
    await r.vfx.crafted.prepareMoveTexture(move.def.effectKey);
    e.clear();
    const targets=[2,6].map(distance=>{
      const id=e.spawn(74,p.pos.x,p.pos.z-distance,1,1,0);
      e.y[id]=r.terrain.surface(e.x[id],e.z[id]);
      e.hp[id]=e.maxHp[id]=1e7;
      return id;
    });
    e.update();r.lockTarget=targets[0];move.timer=0;
    vfxAdvance(1,1/60,false);move.timer=999;
    const shots=Array.from({length:pool.n},(_,id)=>id).filter(id=>pool.slot[id]===0);
    const center=shots.reduce((a,b)=>Math.abs(pool.vx[a])<Math.abs(pool.vx[b])?a:b);
    for(let frame=0;frame<duration*60 && pool.alive[center] && pool.z[center]>p.pos.z-6.5;frame++)
      vfxAdvance(1,1/60,false);
    const mesh=r.vfx.crafted.windMoves;
    const poses=Array.from({length:mesh.mesh.count},(_,i)=>mesh.pose.getX(i));
    const result={count:shots.length,fullLifetime:shots.every(id=>Math.abs(pool.maxLife[id]-duration)<.001),
      allAlive:shots.every(id=>pool.alive[id]),visible:poses.filter(pose=>pose<hitFrame).length,
      passedBoth:pool.z[center]<p.pos.z-6,
      hitBoth:targets.every(id=>pool.alreadyHit(center,id)&&e.hp[id]<e.maxHp[id])};
    for(let frame=0;frame<duration*60 && pool.alive[center];frame++){
      vfxAdvance(1,1/60,false);
      if(pool.alive[center] && pool.vz[center]>1)result.returned=true;
    }
    vfxAdvance(Math.ceil(duration*60)+1,1/60,false);
    return {...result,remaining:pool.used,remainingArt:r.vfx.crafted.windMoves.mesh.count};
  },windMoves.hit.first);
  assert.ok(report.airSlash.count>=3 && report.airSlash.fullLifetime && report.airSlash.allAlive && report.airSlash.returned &&
    report.airSlash.visible===report.airSlash.count && report.airSlash.passedBoth && report.airSlash.hitBoth,
    JSON.stringify(report.airSlash));
  assert.equal(report.airSlash.remaining,0);assert.equal(report.airSlash.remainingArt,0);
  for(const hz of [30,60]){
    const flight=await page.evaluate(async ({hz,clips})=>{
      setupWind();const r=app.run,e=r.enemies,p=r.player,pool=r.projectiles;
      p.setSpecies(16);p.addMove(332);p.moves[0].timer=0;
      await r.vfx.crafted.prepareMoveTexture('wind-feather-dance');
      for(let i=0;i<e.n;i++){
        e.x[i]=p.pos.x+(i?14:0);e.z[i]=p.pos.z+(i?12:-5.8);e.y[i]=r.terrain.surface(e.x[i],e.z[i]);
      }
      e.update();r.lockTarget=0;
      const stats={shots:0,launch:false,flight:false,hit:false,maxDamage:0};
      for(let frame=0;frame<hz*2.6;frame++){
        vfxAdvance(1,1/hz);p.moves[0].timer=999;
        stats.shots=Math.max(stats.shots,pool.used);
        const art=r.vfx.crafted.windReplacements;
        for(let i=0;i<art.mesh.count;i++){
          const pose=art.pose.getX(i);
          for(const key of ['launch','flight','hit']){
            if(pose>=clips[key].first&&pose<clips[key].first+clips[key].count)stats[key]=true;
          }
        }
        stats.maxDamage=Math.max(stats.maxDamage,p.moves[0].damageDone);
      }
      stats.remaining=pool.used+r.vfx.crafted.windReplacements.mesh.count;
      return stats;
    },{hz,clips:replacements.clips});
    assert.ok(flight.shots===3&&flight.launch&&flight.flight&&flight.hit&&flight.maxDamage>0,JSON.stringify({hz,...flight}));
    assert.equal(flight.remaining,0);
    (report.featherDance??=[]).push({hz,...flight});
  }
  for(const id of [98,332,403,17,33,49001,50006,50106]){
    const def=await page.evaluate(async id=>{
      setupWind();const r=app.run;r.player.setSpecies(16);
      if(!r.player.addMove(id))throw Error('Missing '+id);
      const m=r.player.moves[0];m.timer=0;
      await r.vfx.crafted.prepareMoveTexture(m.def.effectKey??m.def.key);
      return {id,key:m.def.key,name:m.def.name};
    },id);
    let visible=0;const poses=new Set();
    if(id===98){
      const dash=await page.evaluate(()=>{
        vfxAdvance(1,1/60);
        const r=app.run,glyph=r.sprites.getHeroGhostGlyph(16,'wind');
        r.player.moves[0].timer=999;
        return {count:r.ghosts.filter(g=>g.dashGlyph).length,word:glyph?.zxGlyph,
          visible:glyph?.zxGroup.mesh.count,clips:r.vfx.crafted.windSkills.events.map(e=>e.clip)};
      });
      assert.deepEqual(dash,{count:3,word:'风',visible:3,clips:['quickHalo']});
      report.openingDash=dash;
    }
    for(let i=0;i<32;i++){
      const state=await page.evaluate(()=>{
        vfxAdvance(2,1/60);const r=app.run;r.player.moves[0].timer=999;
        return [r.vfx.crafted.windMoves,r.vfx.crafted.windSkills,r.vfx.crafted.windReplacements].filter(Boolean).flatMap(a=>Array.from({length:a.mesh.count},(_,j)=>a.pose.getX(j)));
      });
      visible=Math.max(visible,state.length);state.forEach(p=>poses.add(p));
      if(i===2||i===6||i===14){await page.evaluate(()=>vfxDraw());await page.screenshot({path:path.join(dir,`wind-${id}-${i}.png`)});}
    }
    const result=await page.evaluate(()=>{
      const r=app.run,ghost=r.sprites.getHeroGhostGlyph(16,'wind');
      vfxAdvance(180,1/30);
      return {damage:r.player.moves[0].damageDone,remaining:[r.vfx.crafted.windMoves,r.vfx.crafted.windSkills,
        r.vfx.crafted.windReplacements,ghost?.zxGroup].reduce((n,art)=>n+(art?.mesh.count??0),0),
        gl:app.r.renderer.getContext().getError()};
    });
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
      const before={attack:p.stats.attackSpeed,move:p.stats.moveSpeed},targets=[];
      if(species===16){
        const e=r.enemies;
        r.camYaw=0;e.clear();
        for(let i=0;i<3;i++){
          const angle=-Math.PI/6+i*2*Math.PI/3;
          const id=e.spawn(19,p.pos.x+Math.cos(angle)*4,p.pos.z+Math.sin(angle)*4,1,1,0);
          e.hp[id]=e.maxHp[id]=5000;targets.push(id);
        }
        e.update();r.lockTarget=targets[1];
      }
      r.ult.charge=1;r.ult.fire();vfxAdvance(12,1/60);
      const orbit=()=>r.vfx.crafted.windEmitters.map(e=>{
        const dx=e.x-p.pos.x,dz=e.z-p.pos.z;
        return {angle:Math.atan2(dz,dx),radius:Math.hypot(dx,dz)};
      });
      const samples=[];
      if(species===16){
        const framesPerSample=Math.floor((r.ult.def.dur[0]*60-12)/5);
        samples.push(orbit());
        for(let i=0;i<5;i++){
          vfxAdvance(framesPerSample,1/60);
          samples.push(orbit());
        }
      }
      return {species,name:r.ult.name,attack:p.stats.attackSpeed/before.attack,move:p.stats.moveSpeed/before.move,
        samples,targetsHit:targets.filter(id=>r.enemies.hp[id]<5000).length,
        opening:r.vfx.crafted.windSkills?.events.map(e=>e.clip)??[]};
    },species);
    if(species===16){
      assert.equal(result.name,'阵风');
      for(const [index,sample] of result.samples.entries()){
        assert.equal(sample.length,3);
        for(const [i,vortex] of sample.entries()){
          const next=sample[(i+1)%3];
          assert.ok(Math.abs(vortex.radius-next.radius)<.01);
          assert.ok(Math.abs(Math.cos(vortex.angle-next.angle)+.5)<.01,'Vortices stay 120 degrees apart');
          if(index){
            const previous=result.samples[index-1][i];
            assert.ok(vortex.radius>previous.radius);
            const turn=(vortex.angle-previous.angle+2*Math.PI)%(2*Math.PI);
            assert.ok(turn>.1&&turn<Math.PI,'Each vortex keeps circling outward');
            if(index>=2){
              const earlier=result.samples[index-2][i];
              const priorTurn=(previous.angle-earlier.angle+2*Math.PI)%(2*Math.PI);
              assert.ok(turn<priorTurn,'Angular speed drops as the orbit expands');
            }
          }
        }
      }
      assert.equal(result.targetsHit,3);
    }
    else {
      const attack=[17,18].includes(species);
      assert.equal(result.name,attack?'刮倒一片':'跑得没影');
      assert.ok(result.opening.includes(attack?'attackLoops':'gust'));
      assert.ok(Math.abs(result.move-({17:1,18:1,58:2,59:3})[species])<1e-6);
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
  assert.ok(Math.abs(report.speed.boosted/report.speed.base-3)<1e-8,JSON.stringify(report.speed));
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
