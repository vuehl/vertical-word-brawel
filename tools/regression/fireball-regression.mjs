import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import baselines from './fire-vfx-baselines.json' with {type:'json'};

export async function reviewFireball(page,dir,moves){
  const baseline=process.argv.includes('--baseline'),id=moves.find(m=>m.key==='ember').id;
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(async()=>{window.dispatchEvent(new Event('resize'));app.run.player.setSpecies(4);
    await Promise.all([...app.run.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready));
    if(app.run.vfx.crafted.fireball&&!await app.run.vfx.crafted.fireball.ready)throw Error('Fireball atlas failed to load');
  });
  const setup=(quality='high',angle=-Math.PI/2)=>page.evaluate(({id,quality,angle})=>{
    Math.random=()=>.5;app.meta.profile.settings.quality=quality;app.applySettings();vfxSetup();
    const r=app.run,e=r.enemies,dx=Math.cos(angle),dz=Math.sin(angle);
    r.weather=r.baseWeather='clear';r.weatherT=0;
    // The new keyboard blocks the old northbound shot from spawn.
    // Use the same clear stretch of tabletop in both comparison builds.
    const x=-93,z=93;
    r.player.pos.set(x,r.terrain.height(x,z),z);r.camTarget.copy(r.player.pos);
    for(let i=0;i<4;i++){e.x[i]=x+dx*(i===0?8:12)+(i===1?5:i===2?-5:0);e.z[i]=z+dz*(i===0?8:12);}
    e.update();r.lockTarget=0;r.player.facing.set(dx,dz);r.player.addMove(id);r.player.moves[0].timer=0;
    vfxAdvance(1);r.player.moves[0].timer=999;
  },{id,quality,angle});
  const sample=()=>page.evaluate(()=>{
    const r=app.run,p=r.projectiles,f=r.vfx.crafted.fireball,shots=[];
    for(let i=0;i<p.n;i++)if(p.alive[i])shots.push({x:p.x[i],y:p.y[i],z:p.z[i],vx:p.vx[i],vz:p.vz[i],size:p.size[i],radius:p.rad[i],life:p.life[i],damage:p.dmg[i]});
    return {shots,damage:r.player.moves[0].damageDone,hitTargets:[...r.enemies.hp.slice(0,4)].filter(h=>h<1e7).length,
      sprites:f?.mesh.count||0,events:f?.events.length||0,limit:f?.limit||0,oldFire:r.vfx.crafted.entries.filter(e=>e.key?.startsWith?.('fire-shot-')).length,
      camera:r.camDist,pitch:r.camPitch,glError:app.r.renderer.getContext().getError()};
  });
  const report={baseline,environment:'Compiled WeChat game in desktop Chrome SwiftShader, not phone FPS.'};
  await setup();await page.evaluate(()=>vfxAdvance(4));report.flight=await sample();
  await page.screenshot({path:path.join(dir,baseline?'火球-调整前.png':'火球-手绘飞行.png')});
  await page.evaluate(()=>vfxAdvance(35));report.hit=await sample();
  assert.ok(report.flight.shots.length>0&&report.hit.damage>0);
  if(baseline){fs.writeFileSync(path.join(dir,'fireball-baseline.json'),JSON.stringify(report,null,2));return report;}
  const reference=path.join(dir,'fireball-baseline.json');
  const before=fs.existsSync(reference)?JSON.parse(fs.readFileSync(reference)):baselines.fireball;
  assert.deepEqual(report.flight.shots,before.flight.shots);assert.equal(report.hit.damage,before.hit.damage);assert.equal(report.hit.hitTargets,before.hit.hitTargets);
  assert.ok(report.flight.sprites>0);assert.equal(report.flight.oldFire,0);assert.equal(report.flight.glError,0);
  report.directions=[];
  for(const [direction,angle] of [['上',-Math.PI/2],['右',0],['下',Math.PI/2],['左',Math.PI],['斜向',-Math.PI/4]]){
    await setup('high',angle);await page.evaluate(()=>vfxAdvance(4));const state=await sample();assert.ok(state.sprites>0&&state.shots.length>0,JSON.stringify({direction,state}));assert.equal(state.oldFire,0);assert.equal(state.glError,0);
    report.directions.push({direction,...state});await page.screenshot({path:path.join(dir,'火球-方向-'+direction+'.png')});
  }
  report.qualities=[];
  for(const quality of ['low','medium','high']){
    await setup(quality);await page.evaluate(()=>vfxAdvance(4));const state=await sample();assert.ok(state.sprites>0&&state.sprites<=state.limit);assert.equal(state.camera,42);report.qualities.push({quality,...state});
  }
  await setup();const frames=[];report.lifecycle=[];
  for(let i=0;i<30;i++){
    await page.evaluate(()=>vfxAdvance(2));const state=await sample();report.lifecycle.push(state);frames.push(await page.screenshot());
    if([0,2,4,6,9,13].includes(i))fs.writeFileSync(path.join(dir,'火球-阶段-'+String(i).padStart(2,'0')+'.png'),frames.at(-1));
  }
  assert.ok(report.lifecycle.some(s=>s.events>0&&s.damage>0));assert.equal(report.lifecycle.at(-1).sprites,0);
  const buffers=await Promise.all(frames.map(b=>sharp(b).ensureAlpha().raw().toBuffer()));
  await sharp(Buffer.concat(buffers),{raw:{width:390,height:844*buffers.length,channels:4,pageHeight:844}}).gif({delay:Array(buffers.length).fill(67),loop:0}).toFile(path.join(dir,'火球-实战.gif'));
  await setup();await page.evaluate(()=>vfxAdvance(4));
  report.pause=await page.evaluate(()=>{const f=app.run.vfx.crafted.fireball,b=f.attributes.map(a=>Array.from(a.array)).flat().join();f.update(0);return b===f.attributes.map(a=>Array.from(a.array)).flat().join();});assert.ok(report.pause);
  report.hidden=await page.evaluate(()=>{const r=app.run;r.hideOwnFx=true;r.vfx.crafted.fireball.update(0);const count=r.vfx.crafted.fireball.mesh.count;r.hideOwnFx=false;r.vfx.clear();return count;});assert.equal(report.hidden,0);
  await setup();report.propImpact=await page.evaluate(()=>{const r=app.run,p=r.projectiles,id=p.alive.findIndex(a=>a>0),before=p.used;p.impact(id);r.vfx.crafted.fireball.update(1/30);return {removed:p.used===before-1,authored:r.vfx.crafted.fireball.events.some(e=>e.clip==='hit')};});assert.ok(report.propImpact.removed&&report.propImpact.authored);
  await setup();report.enemyVisible=await page.evaluate(()=>{const r=app.run,p=r.projectiles,f=r.vfx.crafted.fireball,id=p.alive.findIndex(a=>a>0);r.vfx.clear();p.flags[id]|=1;r.hideOwnFx=true;f.draw(p,id,p.size[id],1);f.update(1/30);const visible=f.mesh.count>0;r.hideOwnFx=false;r.vfx.clear();return visible;});assert.ok(report.enemyVisible);
  report.pressure=await page.evaluate(id=>{vfxSetup();app.run.player.addMove(id);const m=app.run.player.moves[0];m.timer=0;m.mods.count=110;vfxAdvance(2);const f=app.run.vfx.crafted.fireball,result={count:f.mesh.count,limit:f.limit,finite:f.attributes.every(a=>Array.from(a.array).every(Number.isFinite))};app.run.vfx.clear();result.cleared=f.mesh.count===0&&f.events.length===0&&f.shots.size===0;return result;},id);
  assert.ok(report.pressure.count>0&&report.pressure.count<=report.pressure.limit&&report.pressure.finite&&report.pressure.cleared);
  report.layouts=[];
  for(const [width,height] of [[320,568],[430,932]]){await page.setViewport({width,height,deviceScaleFactor:1});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await setup();await page.evaluate(()=>vfxAdvance(4));const state=await sample();assert.ok(state.sprites>0);assert.equal(state.glError,0);report.layouts.push({width,...state});await page.screenshot({path:path.join(dir,'火球-手机-'+width+'.png')});}
  fs.writeFileSync(path.join(dir,'fireball-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Hand-drawn ember verified: unchanged projectile state/damage, five directions, three qualities, animation lifecycle, pause, hiding, clearing, budgets and phone widths.');
}
