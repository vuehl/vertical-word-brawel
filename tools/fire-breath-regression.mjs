import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Called by runtime-performance.mjs --vfx --fire-breath. Exercise the real
// compiled move, damage fan and game renderer, with deterministic enemy inputs.
export async function reviewFireBreath(page,dir,moves){
  const id=moves.find(m=>m.key==='flamethrower').id;
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(async()=>{
    window.dispatchEvent(new Event('resize'));app.run.player.setSpecies(4);
    await Promise.all([...app.run.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready));
  });
  const setup=async(angle=-Math.PI/2,quality='high',frames=15,duration=3)=>page.evaluate(({id,angle,quality,frames,duration})=>{
    app.meta.profile.settings.quality=quality;app.applySettings();vfxSetup();
    const r=app.run,e=r.enemies,dx=Math.cos(angle),dz=Math.sin(angle);
    const positions=[[-3,4],[0,5.5],[3,4],[0,-4]];
    positions.forEach(([side,forward],i)=>{e.x[i]=dx*forward-dz*side;e.z[i]=dz*forward+dx*side;});
    e.update();r.lockTarget=1;r.player.facing.set(dx,dz);
    r.player.addMove(id);r.player.moves[0].timer=0;r.player.moves[0].mods.dur=duration;
    vfxAdvance(frames);
    return {hits:[...e.hp.slice(0,4)].map(h=>h<1e7),damage:r.player.moves[0].damageDone,
      volumes:r.vfx.crafted.entries.map(e=>({mode:e.mode,type:e.type,length:e.length})),
      camera:r.camDist,particles:r.vfx.norm.n+r.vfx.add.n,limit:r.performance.particles+r.performance.normalParticles,
      fire:{count:r.vfx.crafted.fireJet.mesh.count,limit:r.vfx.crafted.fireJet.limit,textured:Object.values(r.vfx.crafted.fireJet.mesh.material.uniforms).some(u=>u.value?.isTexture)}};
  },{id,angle,quality,frames,duration});
  const report={environment:'Actual compiled WeChat game in Chrome SwiftShader; controlled targets, original gameplay camera. Not phone FPS.',directions:[],qualities:[]};
  for(const quality of ['low','medium','high']){
    const sample=await setup(-Math.PI/2,quality);
    assert.deepEqual(sample.hits,[true,true,true,false],'Both sides and centre hit; target behind caster stays unharmed');
    assert.ok(sample.damage>0&&sample.volumes.some(e=>e.mode===8));
    assert.equal(sample.camera,42);assert.ok(sample.particles<=sample.limit);
    assert.ok(sample.fire.count>0&&sample.fire.count<=sample.fire.limit);assert.equal(sample.fire.textured,false);
    report.qualities.push({quality,...sample});
    await page.screenshot({path:path.join(dir,'fire-'+quality+'.png')});
  }
  for(const [direction,angle] of [['up',-Math.PI/2],['right',0],['down',Math.PI/2],['left',Math.PI],['diagonal',-Math.PI/4]]){
    const sample=await setup(angle);assert.deepEqual(sample.hits,[true,true,true,false]);
    report.directions.push({direction,...sample});
    await page.screenshot({path:path.join(dir,'fire-'+direction+'.png')});
  }
  await setup(-Math.PI/2,'high',0,1);
  const active=await page.evaluate(()=>{vfxAdvance(1);const m=app.run.player.moves[0];m.timer=999;return m.active;});
  assert.ok(active>0&&active<5);
  const frames=[];
  report.lifecycle=[];report.packet=[];
  const filmFrames=Math.ceil((active+.95)*15);
  for(let i=0;i<filmFrames;i++){
    const sample=await page.evaluate(()=>{
      vfxAdvance(2);const v=app.run.vfx.crafted,jet=v.fireJet;
      const first=jet.packets.find(p=>p.id===window.firstFlamePacket)||jet.packets.reduce((a,b)=>!a||b.id<a.id?b:a,null);
      if(window.firstFlamePacket==null&&first)window.firstFlamePacket=first.id;
      const tracked=jet.packets.find(p=>p.id===window.firstFlamePacket);
      return {active:app.run.player.moves[0].active,count:jet.mesh.count,spawned:jet.spawned,
        first:tracked?{age:tracked.age,life:tracked.life,...jet.sample(tracked)}:null};
    });
    sample.time=(i+1)*2/30;report.lifecycle.push(sample);if(sample.first)report.packet.push(sample.first);
    frames.push(await page.screenshot());
    if([0,2,5,Math.floor(active*15),Math.floor((active+.35)*15),filmFrames-1].includes(i))fs.writeFileSync(path.join(dir,'phase-'+String(i).padStart(2,'0')+'.png'),frames.at(-1));
  }
  const buffers=await Promise.all(frames.map(frame=>sharp(frame).ensureAlpha().raw().toBuffer()));
  await sharp(Buffer.concat(buffers),{raw:{width:390,height:844*buffers.length,channels:4,pageHeight:844}})
    .gif({delay:Array(buffers.length).fill(67),loop:0}).toFile(path.join(dir,'fire-breath-in-game.gif'));
  const packet=report.packet,peak=Math.max(...packet.map(p=>p.radius));
  assert.ok(peak>packet[0].radius*1.8,'A born flame must visibly grow');
  assert.ok(packet.at(-1).radius<peak*.75&&packet.at(-1).alpha<.15,'A mature flame must shrink and dissolve');
  assert.ok(packet.at(-1).p>packet[0].p+.6,'The same flame must advance through its own life');
  assert.ok(report.lifecycle.some(p=>p.time>active+.2&&p.count>0),'Existing tongues must continue after emission stops');
  assert.equal(report.lifecycle.at(-1).count,0,'The final tail must extinguish completely');
  await setup();
  report.motion=await page.evaluate(()=>{
    const v=app.run.vfx.crafted,e=v.entries.find(e=>e.mode===8),age=e.age;
    const before=v.fireJet.packets.map(p=>p.age).join('/'),births=v.fireJet.spawned;
    v.update(0);const paused=e.age===age&&before===v.fireJet.packets.map(p=>p.age).join('/')&&births===v.fireJet.spawned;
    app.run.player.moves.fill(null);for(let i=0;i<30;i++)v.update(1/30);
    return {paused,expired:v.entries.length===0,count:v.mesh.count,keys:v.keys.size,fire:v.fireJet.mesh.count};
  });
  assert.deepEqual(report.motion,{paused:true,expired:true,count:0,keys:0,fire:0});
  await setup();report.hidden=await page.evaluate(()=>{app.run.hideOwnFx=true;app.run.vfx.crafted.update(0);const count=app.run.vfx.crafted.fireJet.mesh.count;app.run.hideOwnFx=false;app.run.vfx.clear();return count;});assert.equal(report.hidden,0);
  report.enemy=await page.evaluate(()=>{
    const r=app.run,v=r.vfx.crafted;v.cone('enemy-fire-check',0,1,-5,0,1,6,'fire',.7,false);v.update(1/30);
    r.hideOwnFx=true;v.update(0);const own=v.fireJet.packets.filter(p=>p.own).length,enemy=v.fireJet.packets.filter(p=>!p.own).length;
    r.hideOwnFx=false;r.vfx.clear();return {own,enemy,cleared:v.fireJet.mesh.count===0};
  });assert.equal(report.enemy.own,0);assert.ok(report.enemy.enemy>0&&report.enemy.cleared);
  report.layouts=[];
  for(const [width,height] of [[320,568],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:1});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
    const sample=await setup();const error=await page.evaluate(()=>app.r.renderer.getContext().getError());
    assert.equal(error,0);assert.ok(sample.fire.count>0&&sample.fire.count<=sample.fire.limit);
    report.layouts.push({width,height,fire:sample.fire,glError:error});await page.screenshot({path:path.join(dir,'fire-phone-'+width+'.png')});
  }
  report.pressure=[];
  for(const quality of ['low','medium','high']){
    const sample=await page.evaluate(quality=>{
      app.meta.profile.settings.quality=quality;app.applySettings();const v=app.run.vfx.crafted;app.run.vfx.clear();
      for(let frame=0;frame<18;frame++){
        for(let i=0;i<36;i++)v.cone('pressure-'+i,(i%4)-2,1,-Math.floor(i/4)*.35,0,-1,7,'fire',.7);
        v.update(1/30);
      }
      const j=v.fireJet,result={quality,count:j.mesh.count,limit:j.limit,emitters:v.entries.length,finite:j.attributes.every(a=>Array.from(a.array.slice(0,j.mesh.count*4)).every(Number.isFinite))};
      app.run.vfx.clear();return result;
    },quality);
    assert.ok(sample.count>0&&sample.count<=sample.limit&&sample.finite);report.pressure.push(sample);
  }
  report.otherMoves=[];
  for(const key of ['ember','fire-spin','heat-wave','hydro-pump']){
    const move=moves.find(m=>m.key===key);assert.ok(move);
    const sample=await page.evaluate(({id,key})=>{
      app.meta.profile.settings.quality='high';app.applySettings();vfxSetup();const r=app.run;r.player.addMove(id);r.player.moves[0].timer=0;
      vfxAdvance(key==='hydro-pump'?28:19);return {key,particles:r.vfx.norm.n+r.vfx.add.n,volumes:r.vfx.crafted.mesh.count,fire:r.vfx.crafted.fireJet.mesh.count,projectiles:r.projectiles.used};
    },{id:move.id,key});
    assert.ok(sample.particles+sample.volumes+sample.fire+sample.projectiles>0,key);report.otherMoves.push(sample);
  }
  report.ultimate=await page.evaluate(()=>{vfxSetup();const r=app.run;r.ult.charge=1;r.ult.fire();vfxAdvance(14);const mode=r.vfx.crafted.entries.some(e=>e.mode===3&&e.type==='fire');r.vfx.clear();return {mode,fireCleared:r.vfx.crafted.fireJet.mesh.count===0};});
  assert.ok(report.ultimate.mode&&report.ultimate.fireCleared);
  fs.writeFileSync(path.join(dir,'fire-breath-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Fire breath verified: real move, five directions, three quality levels, front/side damage, individual birth/growth/extinction, full cast movie, pause, own/enemy hiding, cleanup and shaders.');
  return report;
}
