import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
export async function reviewFireFusions(page,dir){
 const baseline=process.argv.includes('--record-fire-fusions'),report={samples:[]};
 await page.setViewport({width:390,height:844,deviceScaleFactor:1});
 await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));window.fusionRandom=Math.random;Math.random=()=>.43;const rng=Object.values(app.run).find(x=>x?.rng?.next)?.rng;window.fusionRngProto=Object.getPrototypeOf(rng);window.fusionRngNext=fusionRngProto.next;fusionRngProto.next=()=>.43;});
 for(const [key,id] of [['fu-t-fire',50080]])for(const level of [1,5]){
  const sample=await page.evaluate(async({key,id,level})=>{
   const r=app.run,p=r.player;p.buffs.clear();p.setSpecies(4);vfxSetup();r.time=r.realTime=0;r.weather=r.baseWeather='clear';r.weatherT=0;
   p.level=1;p.evoStage=0;p.growth=0;p.recompute();p.stats.critChance=p.stats.megaCrit=0;p.kx=p.kz=0;
   p.pos.set(-28,r.terrain.height(-28,32),32);r.camTarget.copy(p.pos);p.facing.set(0,-1);
   for(let i=0;i<4;i++){const e=r.enemies;e.x[i]=-28+(i===0?0:i%2?3:-3);e.z[i]=27-i*2;e.y[i]=r.terrain.height(e.x[i],e.z[i]);}r.enemies.update();r.lockTarget=0;
   await Promise.all([r.vfx.crafted.fireFamily?.ready,r.vfx.crafted.fireSpin.ready,...[...r.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready)]);
   for(let i=0;i<r.enemies.n;i++)if(r.enemies.alive[i]){const e=r.enemies,b=r.sprites.get(e.species[i],false,e.glyphWords[i]);e.radius[i]=Math.max(.45,Math.min(4,b.bodyWidth(e.scale[i])*.42));e.hgt[i]=Math.max(.8,b.bodyHeight(e.scale[i]));e.sized[i]=1;}r.enemies.update();
   p.addMove(id);const m=p.moves[0];m.level=level;m.timer=0;return {key,level,trace:[]};
  },{key,id,level});
  for(let frame=0;frame<40;frame++)sample.trace.push(await page.evaluate(()=>{
   vfxAdvance(12,1/60);const r=app.run,m=r.player.moves[0],round=x=>Math.round(x*1e5)/1e5;
   const result={damage:round(m.damageDone||0),hp:[...r.enemies.hp.slice(0,4)],active:round(m.active||0),timer:round(m.timer),position:[r.player.pos.x,r.player.pos.y,r.player.pos.z].map(round),zones:r.zones.list.map(z=>({x:z.x,z:z.z,r:z.r,life:round(z.life),dmg:z.dmg,type:z.type,status:z.status}))};m.timer=999;return result;
  }));
  assert.equal(await page.evaluate(()=>app.r.renderer.getContext().getError()),0);assert.ok(sample.trace.at(-1).damage>0);report.samples.push(sample);
 }
 await page.evaluate(()=>{Math.random=fusionRandom;fusionRngProto.next=fusionRngNext;});
 const file=new URL('./fire-fusion-baseline.json',import.meta.url);
 if(baseline)fs.writeFileSync(file,JSON.stringify({samples:report.samples.map(({key,level,trace})=>({key,level,trace}))})+'\n');
 else {
  const old=JSON.parse(fs.readFileSync(file));for(let i=0;i<report.samples.length;i++)assert.deepEqual(report.samples[i].trace,old.samples[i].trace,report.samples[i].key+'/'+report.samples[i].level);
  report.lifecycle=await page.evaluate(()=>{
   const r=app.run,v=r.vfx.crafted,f=v.fireFamily,p=r.player.pos;v.clear();
   f.sun({},p.x,p.y+5,p.z,.6);f.sunRain(p.x,p.y+5,p.z,p.y);v.update(.04);
   const count=f.mesh.count+f.topMesh.count+v.fireSpin.mesh.count,finite=[...f.attributes,...f.topAttributes,...v.fireSpin.attributes].every(a=>[...a.array].every(Number.isFinite)),before=JSON.stringify([f.events,v.entries]);v.update(0);const paused=before===JSON.stringify([f.events,v.entries]);
   r.hideOwnFx=true;v.update(0);const hidden=f.mesh.count+f.topMesh.count+v.fireSpin.mesh.count===0&&f.keys.size===0;r.hideOwnFx=false;
   f.sunBurst(p.x,p.y,p.z,5);v.update(3);const expired=f.events.length===0;v.clear();return {count,finite,paused,hidden,expired,cleared:f.keys.size===0&&f.events.length===0};
  });assert.ok(report.lifecycle.count>=2);for(const key of ['finite','paused','hidden','expired','cleared'])assert.ok(report.lifecycle[key],key);
 }
 fs.writeFileSync(path.join(dir,'fusion-gameplay.json'),JSON.stringify(report,null,2));console.log('Fusion traces verified:',report.samples.map(s=>s.key+'/'+s.level).join(', '));
}
