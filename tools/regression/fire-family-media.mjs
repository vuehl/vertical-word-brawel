import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
export async function reviewFireFamilyMedia(page,dir,moves){
 await page.setViewport({width:390,height:844,deviceScaleFactor:1});
 await page.evaluate(async()=>{window.dispatchEvent(new Event('resize'));vfxSetup();await Promise.all(['fireFamily','fireJet','fireSpin'].map(key=>app.run.vfx.crafted[key].ready));});
 const report={pictures:[],budgets:[]};
 report.dragon=await page.evaluate(()=>{
  const r=app.run,v=r.vfx.crafted,j=v.fireJet;vfxSetup();
  const render=type=>{
   v.clear();v.clock=0;v.refreshes=0;j.clock=0;j.serial=0;
   const key={def:{key:type==='dragon'?'dragon-breath':'flamethrower'}};
   for(let frame=0;frame<15;frame++){v.cone(key,0,1,0,0,-1,7,type,.7);v.update(1/30);}
   return {samples:j.packets.map(p=>j.sample(p)),origin:Array.from(j.attributes[0].array.slice(0,j.mesh.count*4)),motion:Array.from(j.attributes[1].array.slice(0,j.mesh.count*4)),life:Array.from(j.attributes[2].array.slice(0,j.mesh.count*4))};
  };
  const orange=render('fire'),purple=render('dragon');
  const same=JSON.stringify(orange.samples)===JSON.stringify(purple.samples)&&JSON.stringify(orange.origin)===JSON.stringify(purple.origin)&&JSON.stringify(orange.life)===JSON.stringify(purple.life);
  const tintOnly=orange.motion.every((n,i)=>purple.motion[i]===n+(i%4===3?4:0));
  const a={def:{key:'flamethrower'}},b={def:{key:'dragon-breath'}};v.clear();
  for(let i=0;i<8;i++){v.cone(a,-2,1,0,0,-1,7,'fire',.7);v.cone(b,2,1,0,0,-1,7,'dragon',.7);v.update(1/30);}
  const kinds=Array.from(j.attributes[1].array.slice(0,j.mesh.count*4)).filter((_,i)=>i%4===3);
  j.impact(-2,1,-2,true,false,false);j.impact(2,1,-2,true,false,true);j.updateHits(0);
  const hitKinds=Array.from(j.hitAttributes[1].array.slice(0,j.hitMesh.count*4)).filter((_,i)=>i%4===3);
  const before=JSON.stringify(j.packets);v.update(0);const paused=before===JSON.stringify(j.packets);
  vfxDraw();return {same,tintOnly,mixed:kinds.some(n=>n<4)&&kinds.some(n=>n>=4),mixedHits:hitKinds.includes(2)&&hitKinds.includes(6),paused};
 });assert.deepEqual(report.dragon,{same:true,tintOnly:true,mixed:true,mixedHits:true,paused:true});
 await page.screenshot({path:path.join(dir,'orange-and-purple.png')});
 report.claws=await page.evaluate(()=>{
  const f=app.run.vfx.crafted.fireFamily;vfxSetup();
  const sample=key=>{f.clear();f.strike(key,0,1,-2,0,-1,3);f.impact(key,0,1,-2);return f.events.map(({clip,size,life,angle,palette})=>({clip,size,life,angle,palette}));};
  const scratch=sample('scratch'),dragon=sample('dragon-claw');f.clear();
  return {scratch,dragon};
 });
 assert.equal(report.claws.scratch.length,2);assert.equal(report.claws.scratch[0].clip,'rake');assert.equal(report.claws.scratch[1].clip,'scratchHit');
 assert.ok(report.claws.scratch[1].size<report.claws.scratch[0].size/2);
 assert.deepEqual(report.claws.scratch.map(({palette,...shape})=>shape),report.claws.dragon.map(({palette,...shape})=>shape));
 assert.ok(report.claws.dragon.every(e=>e.palette===3));
 const keys=['air-slash','inferno'];
 for(const key of keys){
  const id=moves.find(m=>m.key===key).id;
  const result=await page.evaluate(async({id,key})=>{
   const r=app.run;r.player.setSpecies(key==='air-slash'?16:4);vfxSetup();r.ghosts.length=0;r.enemies.x[1]=0;r.enemies.z[1]=key==='inferno'?-8:-2.4;r.enemies.update();r.lockTarget=1;r.player.pos.y=r.terrain.height(0,0);
   await Promise.all([...r.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready));
   r.player.addMove(id);r.player.moves[0].timer=0;vfxAdvance(4);vfxDraw();
   const f=r.vfx.crafted.fireFamily,j=r.vfx.crafted.fireJet;
   return {key,count:f.mesh.count,jet:j.mesh.count,ball:r.vfx.crafted.fireball.mesh.count,ghosts:r.ghosts.length,damage:r.player.moves[0].damageDone,gl:app.r.renderer.getContext().getError()};
  },{key,id});
  assert.ok(result.count+result.jet+result.ball>0,'Missing visual '+key);assert.equal(result.gl,0);report.pictures.push(result);
  if(key==='inferno')assert.ok(result.ball>0,'Inferno must fly as the Ember fireball');
  if(key==='flare-blitz')assert.equal(result.ghosts,0,'Flame charge must not draw white glyph ghosts');
  await page.screenshot({path:path.join(dir,'review-'+key+'.png')});
 }
 report.airSlash=await page.evaluate(()=>{
  const r=app.run,f=r.vfx.crafted.fireFamily;vfxSetup();r.player.setSpecies(19);r.player.pos.y=r.terrain.height(0,0);
  r.player.addMove(403);r.player.moves[0].timer=0;vfxAdvance(12,1/60);r.player.moves[0].timer=999;vfxDraw(false);
  const wake=f.events.filter(e=>e.clip==='windCut'&&!e.key),head=f.events.find(e=>e.clip==='windCut'&&e.key);
  const moving=!!head&&wake.length>0,shortWake=wake.every(e=>e.life<=.10);
  const before=JSON.stringify(f.events);for(let i=0;i<30;i++){vfxDraw(false);f.update(0);}const paused=JSON.stringify(f.events)===before;
  r.projectiles.clear();vfxAdvance(15,1/60);const expired=f.events.length===0&&f.keys.size===0;
  f.clear();const pool={flags:[0],vx:[1],vz:[0],x:[0],y:[1],z:[0]};
  f.play('seal',0,1,0,4,{spin:1.7});f.shot(pool,0,1,1,'air-slash');f.update(.01);
  const wind=f.events.find(e=>e.clip==='windCut'),fire=f.events.find(e=>e.clip==='seal');
  const isolated=!!wind&&!!fire&&!wind.spin&&fire.spin===1.7&&wind.palette===5&&fire.palette===0;
  f.clear();return {moving,shortWake,paused,expired,isolated};
 });for(const [key,value] of Object.entries(report.airSlash))assert.ok(value,'Air Slash '+key);
 report.mushroom=await page.evaluate(()=>{
  const r=app.run,f=r.vfx.crafted.fireFamily;vfxSetup();f.mushroom(0,0,0);f.update(.3);
  const count=f.topMesh.count,depth=f.topMesh.material.depthTest,order=f.topMesh.renderOrder;
  const stem=f.events.find(e=>e.foreground&&e.layer===0),cap=f.events.find(e=>e.foreground&&e.layer===2);
  const ratio=cap.size/stem.size,finite=f.topAttributes.every(a=>Array.from(a.array.slice(0,count*4)).every(Number.isFinite));
  const before=JSON.stringify(f.events);f.update(0);const paused=before===JSON.stringify(f.events);
  r.hideOwnFx=true;f.update(0);const hidden=f.topMesh.count===0;r.hideOwnFx=false;f.clear();const cleared=f.topMesh.count===0&&f.events.length===0;
  for(let i=0;i<f.limit;i++)f.play('burst',0,1,0,3,{priority:2});f.mushroom(0,0,0);f.update(.3);const reserved=f.topMesh.count===2&&f.events.length<=f.limit;f.clear();
  const image=f.mushroomTexture.image;
  f.mushroom(0,0,0);const capLife=f.events.find(e=>e.mushroomPart==='cap').life,noExtraLife=f.events.find(e=>e.mushroomPart==='stem').life===1.4;
  const fadeSamples=[];for(const dt of [1,.15,.15,.14]){f.update(dt);for(let i=0;i<f.topMesh.count;i++)if(f.topAttributes[0].array[i*4+1]>4)fadeSamples.push(f.topAttributes[1].array[i*4+1]);}
  const tail=fadeSamples.length===4&&fadeSamples.every((v,i)=>i===0||v<fadeSamples[i-1])&&fadeSamples.at(-1)<.04;f.update(2);const expired=f.topMesh.count===0;f.clear();
  f.finale(0,0,0,13);f.update(.25);const noRepeatedCloud=!f.events.some(e=>e.mushroomPart),largeBlast=f.events.some(e=>e.clip==='eruption'&&e.foreground&&e.size>=24);f.clear();
  return {count,depth,order,ratio,finite,paused,hidden,cleared,reserved,texture:[image.width,image.height],tail,fadeSamples,noExtraLife,expired,noRepeatedCloud,largeBlast};
 });assert.equal(report.mushroom.count,2);assert.equal(report.mushroom.depth,false);assert.equal(report.mushroom.order,1000);assert.ok(report.mushroom.ratio>2);assert.deepEqual(report.mushroom.texture,[4096,2048]);for(const k of ['finite','paused','hidden','cleared','reserved','tail','noExtraLife','expired','noRepeatedCloud','largeBlast'])assert.ok(report.mushroom[k]);
 report.continuity=await page.evaluate(fangRange=>{
  const v=app.run.vfx.crafted,f=v.fireFamily,p=app.run.player.pos;v.clear();
  const fangAlpha=()=>{const a=f.attributes[1].array;for(let i=0;i<f.mesh.count;i++)if(a[i*4]>=fangRange.first&&a[i*4]<fangRange.first+fangRange.count)return a[i*4+1];return 0;};
  f.strike('fire-fang',p.x,p.y,p.z,0,-1,3);f.update(.005);const fangBorn=fangAlpha();f.update(.145);const fangFull=fangAlpha();f.update(.245);const fangTail=fangAlpha();f.clear();
  const sun={};f.sun(sun,p.x,p.y+5,p.z,.8);v.update(.10);const opening=f.events.some(e=>e.clip==='eruption'&&e.foreground);const count=f.events.length;f.sun(sun,p.x,p.y+5,p.z,.9);const once=f.events.length===count;v.clear();
  f.sun(sun,p.x,p.y+5,p.z,.01);v.update(.10);const sunRecast=f.events.some(e=>e.clip==='eruption'&&e.foreground);v.clear();
  f.sunBurst(p.x,p.y,p.z,5);v.update(.10);const infernoSun=opening&&once&&f.events.some(e=>e.clip==='eruption'&&e.foreground)&&f.events.some(e=>e.clip==='pillar')&&!f.events.some(e=>e.clip==='sun');v.clear();
  return {fangBorn,fangFull,fangTail,fangEnvelope:fangBorn<fangFull*.1&&fangTail<fangFull*.25,infernoSun,sunRecast};
 },JSON.parse(fs.readFileSync('resources/public/assets/vfx/fire-family.json')).clips.fang);for(const k of ['fangEnvelope','infernoSun','sunRecast'])assert.ok(report.continuity[k],k);
 for(const quality of ['low','medium','high']){
  const sample=await page.evaluate(quality=>{
   app.meta.profile.settings.quality=quality;app.applySettings();vfxSetup();const r=app.run,f=r.vfx.crafted.fireFamily;
   for(let i=0;i<160;i++)f.play(i%2?'eruption':'rake',(i%10)-5,.3,-Math.floor(i/10),4,{priority:i%3===0?0:1});f.update(.1);
   const count=f.mesh.count,limit=f.limit,finite=f.attributes.every(a=>Array.from(a.array.slice(0,count*4)).every(Number.isFinite));
   const before=JSON.stringify(f.events);f.update(0);const paused=before===JSON.stringify(f.events);
   r.hideOwnFx=true;f.update(0);const hidden=f.mesh.count===0;
   f.play('burst',0,1,-4,3,{own:false});f.update(.1);const enemyVisible=f.mesh.count>0;
   r.hideOwnFx=false;f.update(5);const expired=f.mesh.count===0&&f.events.length===0;f.clear();
   return {quality,count,limit,finite,paused,hidden,enemyVisible,expired,cleared:f.keys.size===0&&f.hitTimes.size===0};
  },quality);assert.ok(sample.count>0&&sample.count<=sample.limit);for(const k of ['finite','paused','hidden','enemyVisible','expired','cleared'])assert.ok(sample[k],quality+' '+k);report.budgets.push(sample);
 }
 await page.evaluate(async()=>{app.meta.profile.settings.quality='high';app.applySettings();const r=app.run;r.player.setSpecies(6);vfxSetup();r.player.growth=0;r.player.pos.y=r.terrain.height(0,0);await Promise.all([...r.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready));r.ult.charge=1;r.ult.fire();});
 const frames=[];
 for(let i=0;i<36;i++){await page.evaluate(()=>{vfxAdvance(3);vfxDraw();});frames.push(await page.screenshot());if([3,7,14,27].includes(i))fs.writeFileSync(path.join(dir,'ultimate-phase-'+i+'.png'),frames.at(-1));}
 const buffers=await Promise.all(frames.map(frame=>sharp(frame).ensureAlpha().raw().toBuffer()));
 await sharp(Buffer.concat(buffers),{raw:{width:390,height:844*buffers.length,channels:4,pageHeight:844}}).gif({delay:Array(buffers.length).fill(100),loop:0}).toFile(path.join(dir,'fire-ultimate.gif'));
 report.cloudSizes=await page.evaluate(()=>{
  const r=app.run;
  return [4,5,6].map(species=>{
   r.player.setSpecies(species);vfxSetup();r.ult.charge=1;r.ult.fire();
   return r.vfx.crafted.fireFamily.events.filter(e=>e.mushroomPart).map(e=>[e.size,e.height]);
  });
 });
 assert.equal(report.cloudSizes[0].length,2);
 for(const sizes of report.cloudSizes)assert.deepEqual(sizes,report.cloudSizes[0]);
 fs.writeFileSync(path.join(dir,'fire-family-visual-report.json'),JSON.stringify(report,null,2));console.log('Visual checks:',JSON.stringify(report));return report;
}
