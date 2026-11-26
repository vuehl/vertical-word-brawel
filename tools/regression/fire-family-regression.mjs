import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import fireAtlas from '../../resources/public/assets/vfx/fire-family.json' with {type:'json'};

async function checkStarterFireRing(page,area){
 const result=await page.evaluate(area=>{
  const r=app.run,p=r.player,e=r.enemies;
  p.setSpecies(4);vfxSetup();placeFireTargets();e.clear();
  p.evoStage=p.growth=0;p.level=1;p.recompute();p.stats.critChance=0;p.stats.area=area;
  r.time=r.stageTime=45;
  const {x,z}=p.pos,radius=12*Math.sqrt(area);
  function spawn(distance,flags=0){
   const id=e.spawn(7,x,z,r.director.hpMult(),r.director.dmgMult(),flags);
   if(id<0)throw Error('Missing fire ring test target');
   e.x[id]=x;e.z[id]=z-distance;
   return id;
  }
  // Use a full-health, fire-resistant ordinary enemy at the first natural recharge.
  const near=spawn(1),entering=spawn(radius+4),outside=spawn(radius+4),elite=spawn(radius-1,1);
  e.z[outside]=z-radius-e.radius[outside]-.25;e.update();
  const hits=[],original=r.combat.hit;
  r.combat.hit=function(id,damage,options){
   const full=e.hp[id]===e.maxHp[id],dealt=original.call(this,id,damage,options);
   if(options.slot===8&&options.knock===4)hits.push({id,full,killed:!e.isAlive(id),dealt});
   return dealt;
  };
  try{
   r.ult.charge=1;r.ult.fire();
   vfxAdvance(9,1/30,false);
   const early=hits.map(hit=>hit.id);
   e.z[entering]=z-radius-e.radius[entering]+.1;e.update();
   vfxAdvance(20,1/30,false);
   return {near,entering,elite,early,hits,outsideUntouched:e.hp[outside]===e.maxHp[outside]};
  }finally{r.combat.hit=original;}
 },area);
 const {near,entering,elite,early,hits,outsideUntouched}=result;
 assert.deepEqual(early,[near],'The near target is hit before the rim reaches the outer targets');
 assert.deepEqual(hits.map(hit=>hit.id).sort((a,b)=>a-b),[near,entering,elite],'Each touched target receives one direct ring hit');
 for(const hit of hits){
  assert.ok(hit.full&&hit.dealt>0,'Hit a full-health target directly');
  assert.equal(hit.killed,hit.id!==elite,'Opening ordinary mobs fall on contact and the elite survives');
 }
 assert.ok(outsideUntouched,'An enemy just beyond contact keeps full health');
}

export async function reviewFireFamily(page,dir,moves){
 const baseline=process.argv.includes('--record-fire-family'), report={moves:[],ultimates:[]};
 await page.setViewport({width:390,height:844,deviceScaleFactor:1});
 await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));window.familyRandom=Math.random;Math.random=()=>.43;
  const generator=Object.values(app.run).find(x=>x?.rng?.next)?.rng;if(!generator)throw Error('Gameplay RNG missing');
  window.familyRngPrototype=Object.getPrototypeOf(generator);window.familyRngNext=familyRngPrototype.next;familyRngPrototype.next=()=>.43;
  const r=app.run,t=r.terrain;
  // The reference traces include absolute positions. Cast from their recorded lane.
  const x=-24,z=-15;
  if(Array.from({length:28},(_,i)=>z-i*.4).every(zz=>t.inBounds(x,zz,2)&&t.isFlatOpen(x,zz)&&!t.hitProp(x,t.surface(x,zz)+.5,zz,2))){
   window.placeFireTargets=()=>{
    const p=r.player,e=r.enemies;
    p.pos.set(x,t.surface(x,z),z);r.camTarget.copy(p.pos);p.facing.set(0,-1);
    for(let i=0;i<e.n;i++){
     e.x[i]=x;e.z[i]=z-2.4-i*2;e.y[i]=t.surface(e.x[i],e.z[i]);
     const batch=r.sprites.get(e.species[i],false,e.glyphWords[i]);
     e.radius[i]=Math.max(.45,Math.min(4,batch.bodyWidth(e.scale[i])*.42));
     e.hgt[i]=Math.max(.8,batch.bodyHeight(e.scale[i]));e.sized[i]=1;
    }
    e.update();r.lockTarget=0;
   };
   return;
  }
  throw Error('The reference lane for fire skill targets is obstructed');
 });
 const keys=['growl','ember','flamethrower','fire-spin','smokescreen','scary-face','inferno'];
 keys.push('fu-4');
 for(const key of keys){
  const id=key==='fu-4'?50001:moves.find(m=>m.key===key).id;
  const sample=await page.evaluate(async({id,key})=>{
   const r=app.run;r.weather=r.baseWeather='clear';r.weatherT=0;r.player.setSpecies(4);vfxSetup();
   // setSpecies increments evolution scaling; each sample must start clean.
   const p=r.player;p.level=1;p.evoStage=0;p.growth=0;p.buffs.clear();p.recompute();p.hp=p.maxHp;p.kx=p.kz=0;
   r.time=0;r.realTime=0;placeFireTargets();
   if(!r.player.addMove(id))return {key,available:false};
   await Promise.all([r.vfx.crafted.fireFamily?.ready,r.vfx.crafted.fireJet.ready,r.vfx.crafted.fireSpin.ready,r.vfx.crafted.fireball.ready,...[...r.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready)]);
   const m=r.player.moves[0];m.timer=0;window.familyTrace=[];
   return {key,available:true,arch:m.def.arch,jetBefore:r.vfx.crafted.fireJet.spawned};
  },{id,key});
  if(sample.available){
   for(let i=0;i<8;i++){
    const frame=await page.evaluate(()=>{vfxAdvance(12);const r=app.run,m=r.player.moves[0];const round=x=>Math.round(x*1e5)/1e5;return {damage:round(m.damageDone||0),hp:[...r.enemies.hp.slice(0,4)],active:round(m.active||0),timer:round(m.timer),projectiles:r.projectiles.used,zones:r.zones.list?.length,position:[r.player.pos.x,r.player.pos.y,r.player.pos.z].map(round)};});
    (sample.trace??=[]).push(frame);
    if(i===0||i===2)await page.screenshot({path:path.join(dir,(baseline?'before-':'after-')+key+'-'+i+'.png')});
   }
   sample.visual=await page.evaluate(before=>{const v=app.run.vfx.crafted;return {family:v.fireFamily?.played||0,jet:v.fireJet.spawned-before,generic:v.mesh.count,gl:app.r.renderer.getContext().getError()};},sample.jetBefore);
   delete sample.jetBefore;
  }
  report.moves.push(sample);
 }
 for(const species of [4,5,6]){
  const info=await page.evaluate(async species=>{
   const r=app.run;r.weather=r.baseWeather='clear';r.weatherT=0;r.player.setSpecies(species);vfxSetup();r.time=0;r.realTime=0;placeFireTargets();r.player.evoStage=species-4;r.player.growth=0;
   r.player.level=1;r.player.buffs.clear();r.player.recompute();r.player.hp=r.player.maxHp;r.player.kx=r.player.kz=0;
   await Promise.all([...r.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready));r.ult.charge=1;r.ult.fire();
   return {species,name:r.ult.name,tier:r.ult.tier,duration:r.ult.active};
  },species);
  info.trace=[];
  let sawFireRing=false;
  for(let i=0;i<12;i++){
   info.trace.push(await page.evaluate(()=>{vfxAdvance(12);const r=app.run;return {active:Math.round(r.ult.active*1e5)/1e5,hp:[...r.enemies.hp.slice(0,4)],zones:r.zones.list?.length,timers:r.timers.length};}));
   if(!baseline){
    const sample=await page.evaluate(()=>{
     const art=app.run.vfx.crafted.fireFamily;
     return {clips:art.events.map(e=>e.clip),frames:Array.from({length:art.mesh.count},(_,j)=>art.attributes[1].array[j*4])};
    });
    assert.ok(!sample.clips.some(clip=>['seal','sweepRing','shockwave'].includes(clip)),'Legacy ring in fire ultimate '+species);
    const {first,count}=fireAtlas.clips.ring;
    sawFireRing ||= sample.frames.some(index=>index>=first&&index<first+count);
   }
   if([0,2,6].includes(i))await page.screenshot({path:path.join(dir,(baseline?'before-':'after-')+'ultimate-'+species+'-'+i+'.png')});
  }
  if(!baseline)assert.ok(sawFireRing,'Missing rendered fire ring in form '+species);
  assert.equal(info.tier,species-4);report.ultimates.push(info);
 }
 for(const area of [1,2.25])await checkStarterFireRing(page,area);
 await page.evaluate(()=>{Math.random=window.familyRandom;familyRngPrototype.next=window.familyRngNext;});
 const baselineFile=process.env.POKEBONK_FIRE_BASELINE||new URL('./fire-family-baseline.json',import.meta.url);
 fs.writeFileSync(path.join(dir,'fire-family-report.json'),JSON.stringify(report,null,2));
 const gameplay={moves:report.moves.map(({key,available,trace})=>available?{key,available,trace}:{key,available}),ultimates:report.ultimates};
 for(const move of gameplay.moves.filter(move=>move.available))assert.ok(move.trace.at(-1).damage>0,move.key+' must hit the targets');
 for(const ult of gameplay.ultimates){
  assert.equal(ult.name,'一点火苗');
  assert.ok(ult.trace.at(-1).hp.some(hp=>hp<1e7),'ultimate must hit the targets');
 }
 if(baseline)fs.writeFileSync(baselineFile,JSON.stringify(gameplay)+'\n');
 else {
  const previous=JSON.parse(fs.readFileSync(baselineFile));
  for(const move of gameplay.moves){
    if(move.key==='fu-4'){assert.ok(move.trace.at(-1).damage>0);assert.equal(report.moves.find(m=>m.key==='fu-4').visual.jet,0,'Vortex no longer feeds a flame jet');}
    else assert.deepEqual(move,previous.moves.find(old=>old.key===move.key),move.key+' gameplay');
  }
  assert.deepEqual(report.ultimates,previous.ultimates,'Ultimate gameplay');
  for(const m of report.moves)if(m.available)assert.equal(m.visual.gl,0,m.key+' shader');
 }
 fs.writeFileSync(path.join(dir,'fire-family-report.json'),JSON.stringify(report,null,2));console.log('Fire family:',JSON.stringify(report.moves.map(m=>({key:m.key,available:m.available,arch:m.arch,visual:m.visual}))));
 return report;
}
