import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import {verifyBillGaze} from './bill-gaze-regression.mjs';
import {verifyBerryPickup} from './berry-pickup-regression.mjs';
import {verifyDeskShelf} from './desk-shelf-regression.mjs';
export async function verifyDesk(page,dir){
 await page.evaluate(()=>{window.holdHomeStatus=false;window.releaseHomeStatus?.();releaseOptionalDownloads();releaseTextDownload();});
 await page.waitForFunction(()=>window.app?.screen?.querySelector('button')||window.problem,{timeout:35000});
 const click=async(selector,match)=>{const el=await page.waitForFunction((sel,txt)=>[...app.screen.querySelectorAll(sel)].find(el=>!txt||el.textContent.includes(txt)),{timeout:15000},selector,match);await el.evaluate(el=>el.click());await el.dispose();};
 console.log('Home',await page.evaluate(()=>app.screen.textContent.slice(0,250)));
 if(await page.evaluate(()=>!!app.screen.querySelector('.auth-body button')))await click('.auth-body button');
 await click('[data-action="journey"]');await click('[data-action="enter"]');
 await page.waitForFunction(()=>app.run?.terrain?.desk2d&&app.run.time>.1,{timeout:30000});
 const placement=await page.evaluate(()=>{
   const r=app.run,t=r.terrain,f=r.interactables;
   const spawn={x:Math.round((t.spawn.x/t.deskBounds.x+1)*5142/2),z:Math.round((t.spawn.z/t.deskBounds.z+1)*2892/2)};
   const sites=t.facilitySites.map(s=>{
     const occupants=f.list.filter(b=>b.x===s.x&&b.z===s.z);
     const radius=occupants[0]?.kind==='altar'?6.5:4.5;
     return {surface:s.surface,kinds:occupants.map(b=>b.kind),clear:f.fitsOnDesk(s.x,s.z,radius,s.surface),
       walkable:!t.hitProp(s.x,0,s.z,r.player.radius),spawnDistance:Math.hypot(s.x-t.spawn.x,s.z-t.spawn.z)};
   });
   const boss=f.list.find(b=>b.kind==='boss');
   return {spawn,sites,bossDefault:f.fitsOnDesk(boss.x,boss.z,6.5)&&Math.hypot(boss.x-t.spawn.x,boss.z-t.spawn.z)>=(t.play-9)*.55};
 });
 assert.deepEqual(placement.spawn,{x:1820,z:1320});
 assert.equal(placement.sites.length,2);
 assert.ok(placement.bossDefault&&placement.sites.every(s=>s.kinds.length===1&&s.kinds[0]!=='boss'&&s.clear&&s.walkable&&s.spawnDistance>=14),JSON.stringify(placement));
 console.log('Desk placement',placement);
 const seedChecks=await page.evaluate(()=>{
   const run=app.run,live=run.interactables,t=run.terrain;
   const terrain=Object.create(t),probe=Object.create(live);
   probe.run={terrain,player:run.player};probe.add=(kind,x,z,options)=>{
     const r=kind==='altar'?[6,5.5,5,4.5][options.data.tier]:({boss:4,bill:3.4,nest:2.8}[kind]??2.6);
     const f={kind,x,z,r};probe.list.push(f);return f;
   };
   for(let seed=1;seed<=64;seed++){
     terrain.seed=seed;probe.list=[];probe.populate();
     for(const s of terrain.facilitySites){
       const match=probe.list.filter(f=>f.x===s.x&&f.z===s.z);
       if(match.length!==1||match[0].kind==='boss')throw Error('指定点分配失败 '+seed+' / '+s.surface);
     }
     for(const f of probe.list){
       const surface=terrain.facilitySites.find(s=>s.x===f.x&&s.z===f.z)?.surface;
       if(!probe.fitsOnDesk(f.x,f.z,['boss','altar'].includes(f.kind)?6.5:4.5,surface))throw Error('设施轮廓越界 '+seed);
     }
   }
   return 64;
 });
 console.log('Verified placement seeds:',seedChecks);
 const stats=await page.evaluate(()=>{
   const r=app.run,t=r.terrain;r.state='paused';const p=r.player.pos,cam=r.r.camera;
   const original=p.clone(),bounds=t.deskBounds,edges=[];
   for(const sx of [-1,1])for(const sz of [-1,1]){
     p.set(bounds.x*sx,0,bounds.z*sz);r.camTarget.copy(p);r.updateCamera(1);cam.updateMatrixWorld();
     for(const u of [-1,1])for(const v of [-1,1]){
       const a=p.clone().set(u,v,-1).unproject(cam),b=p.clone().set(u,v,1).unproject(cam);const d=b.sub(a);a.addScaledVector(d,-a.y/d.y);
       edges.push(Math.abs(a.x)<=bounds.x+.01&&Math.abs(a.z)<=bounds.z+.01);
     }
   }
   p.copy(original);r.camTarget.copy(p);r.updateCamera(1);r.renderWorld(0);r.r.render(0);
   // Sample the actual cable crossing near the mouse, then walk into its silhouette.
   const pixel=(x,y)=>({x:(x/5142*2-1)*bounds.x,z:(y/2892*2-1)*bounds.z});
   function walk(ax,ay,bx,by){
     const start=pixel(ax,ay),goal=pixel(bx,by),out={...start},steps=100;
     const dx=(goal.x-start.x)/steps,dz=(goal.z-start.z)/steps;
     for(let i=0;i<steps;i++)t.resolve(out.x+dx,out.z+dz,r.player.radius,0,out);
     return Math.hypot(out.x-goal.x,out.z-goal.z);
   }
   const cableError=walk(4485,1720,4485,1880);
   const mouseBlocked=walk(4200,2200,4160,1940);
   return {cableError,mouseBlocked,stage:t.zxStage,layers:[...new Set(t.group.children.map(c=>c.name))],colliders:t.colliders.length,spawnFree:!t.hitProp(p.x,.3,p.z,1),edges:edges.every(Boolean),wireBlocked:t.colliders.some(c=>c.kind==='wires'),facilities:r.interactables.list.every(f=>f.kind==='boss'?!!f.dock&&f.model?.userData.portalDock?.version===1:f.model?.name.startsWith('desk2d/device-'))};
 });
 assert.equal(stats.layers.length,24);assert.ok(stats.cableError<.001&&stats.mouseBlocked>1&&stats.spawnFree&&stats.edges&&stats.facilities&&!stats.wireBlocked,JSON.stringify(stats));console.log(stats);
 await page.screenshot({path:path.join(dir,'stage1.png')});
 await verifyDeskShelf(page,dir);
 const ringPixels=await page.evaluate(()=>{
   const r=app.run, facilities=r.interactables;
   for(const f of facilities.list){
     if(f.kind==='bill'||f.kind==='berry'){if(f.halo||f.chargeRing)throw Error('Unexpected ring on '+f.kind);continue;}
     if(!Number.isFinite(f.ringRadius)||f.ringRadius<f.r||(f.chargeRing??f.halo)?.scale.x!==f.ringRadius)
       throw Error('Invalid desk facility ring on '+f.kind+': '+f.ringRadius);
   }
   const chest=facilities.list.find(f=>f.kind==='chest'&&!f.used);
   r.player.pos.copy(chest.group.position);
   r.player.pos.z+=4;
   r.camTarget.copy(r.player.pos);r.updateCamera(1);r.renderWorld(0);
   if(!chest.halo.visible)throw Error('Idle chest ring is hidden');
   const gl=r.r.renderer.getContext();
   function frame(){
     r.r.render(0);
     const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,pixels=new Uint8Array(w*h*4);
     gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
     return pixels;
   }
   chest.halo.visible=false;
   const without=frame();
   chest.halo.visible=true;
   const withRing=frame();
   let changed=0;
   for(let i=0;i<without.length;i+=4){
     if(Math.abs(withRing[i]-without[i])+Math.abs(withRing[i+1]-without[i+1])+Math.abs(withRing[i+2]-without[i+2])>30)changed++;
   }
   return changed;
 });
 assert.ok(ringPixels>30,'Idle chest ring should change visible pixels: '+ringPixels);
 await page.screenshot({path:path.join(dir,'desk-facility-ring.png')});
 const altarFrames=await page.evaluate(async()=>{
   const r=app.run,f=r.interactables,t=r.terrain,p=r.player.pos;
   const original=f.list.find(b=>b.kind==='altar'), result=[];
   const {x,z}=t.facilitySites.find(s=>s.surface==='wacom');
   for(const entry of f.list.slice())if(entry===original||Math.hypot(entry.x-x,entry.z-z)<9)f.remove(entry);
   for(let tier=0;tier<4;tier++){
     const a=f.add('altar',x,z,{data:{tier}});await a.modelReady;
     p.set(x,0,z+1);r.camTarget.copy(p);r.updateCamera(1);
     const layers=()=>a.model.children.filter(m=>m.visible).map(m=>m.name.split('/').pop()).sort();
     f.render();
     const idle=layers();
     if(a.chargeRing.visible||a.halo)throw Error('Idle altar has a ground ring');
     let idleFrame;
     if(tier===1){
       r.r.render(0);
       idleFrame=r.r.renderer.getContext().canvas.toDataURL('image/png').split(',')[1];
     }
     // Exercise the normal in-range and out-of-range update, including WebGL compilation.
     const tintMesh=a.model.getObjectByName('device-altar/color_alter.png'),tint=tintMesh.material;
     const ringOpacity=a.chargeRing.material.uniforms.breathOpacity;
     f.altarUpdate(a,1,0);f.render();r.r.render(0);
     if(tint.opacity!==0||tintMesh.visible||ringOpacity.value!==0)throw Error('Altar and ring must start transparent');
     f.altarUpdate(a,1,.375);
     if(Math.abs(tint.opacity-.5)>.001||ringOpacity.value!==tint.opacity)throw Error('Altar and ring must rise together');
     f.altarUpdate(a,1,.375);f.render();r.r.render(0);
     const active=layers(),radius=a.chargeRing.scale.x,ring=a.chargeRing.visible,gl=r.r.renderer.getContext();
     const frame=gl.canvas.toDataURL('image/png').split(',')[1];
     if(tint.opacity!==1||ringOpacity.value!==1||!tintMesh.visible||tint.color.getHex()!==0xffffff)throw Error('Expected full-opacity tint and ring at the peak');
     if(tier===1){
       const pixels=()=>{
         r.r.render(0);
         const data=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
         gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,data);
         return data;
       };
       const bright=pixels();
       a.chargeRing.visible=false;
       const peakWithoutRing=pixels();
       a.chargeRing.visible=true;
       if(!bright.some((v,i)=>Math.abs(v-peakWithoutRing[i])>10))throw Error('Ring missing at the breath peak');
       f.altarUpdate(a,1,.75);
       if(tint.opacity!==0||tintMesh.visible||ringOpacity.value!==0)throw Error('Tint and ring did not disappear together after 1.5 seconds');
       const dim=pixels();
       a.chargeRing.visible=false;
       if(!pixels().every((v,i)=>v===dim[i]))throw Error('Ring still paints pixels at zero breath opacity');
       a.chargeRing.visible=true;
       f.altarUpdate(a,1,.75);
       const next=pixels();
       let changed=0,repeatError=0;
       for(let i=0;i<dim.length;i+=4){
         if(Math.abs(bright[i]-dim[i])+Math.abs(bright[i+1]-dim[i+1])+Math.abs(bright[i+2]-dim[i+2])>30)changed++;
         if(Math.max(Math.abs(next[i]-bright[i]),Math.abs(next[i+1]-bright[i+1]),Math.abs(next[i+2]-bright[i+2]))>3)repeatError++;
       }
       if(changed<30 || repeatError>3)throw Error('Altar breath frame mismatch '+JSON.stringify({changed,repeatError}));
     }
     const compiled=r.r.renderer.info.programs.every(b=>b.diagnostics?.runnable!==false);
     f.altarUpdate(a,a.r+1,.1);f.render();
     if(a.chargeRing.visible||a.charge<=0)throw Error('Leaving the altar should immediately hide its ring during charge decay');
     result.push({tier,idle,active,exit:layers(),ring,radius,color:a.altarColor,interaction:a.r,compiled,error:gl.getError(),frame,idleFrame});
     f.altarUpdate(a,1,0);
     if(tint.opacity!==0)throw Error('Altar breath did not restart on re-entry');
     const offer=r.offerBlessing;
     try{r.offerBlessing=()=>{};f.altarDone(a,tier,true);}finally{r.offerBlessing=offer;}
     if(tintMesh.visible||a.chargeRing.visible)throw Error('Used altar still shows tint or ground ring');
     a.data.regenAt=r.time;f.regen(a);
     if(!tintMesh.visible||tint.opacity!==1||a.used)throw Error('Refreshed altar lacks its idle grayscale layer');
     f.remove(a);
   }
   return result;
 });
 for(const a of altarFrames){
   assert.deepEqual(a.idle,['color_alter.png','device-altar_0.png','device-altar_default.png']);
   assert.deepEqual(a.active,['color_alter.png','device-altar_0.png','device-altar_active.png']);
   assert.deepEqual(a.exit,a.idle);assert.equal(a.error,0);assert.ok(a.ring&&a.compiled);assert.equal(a.radius,a.interaction);
   await fs.writeFile(path.join(dir,'desk-altar-tier-'+(a.tier+1)+'.png'),Buffer.from(a.frame,'base64'));
   if(a.idleFrame)await fs.writeFile(path.join(dir,'desk-altar-idle.png'),Buffer.from(a.idleFrame,'base64'));
 }
 assert.deepEqual(altarFrames.map(a=>a.color),[0x5de4da,0xf07d9b,0xf07d9b,0xe1e074]);
 console.log('Desk altar states, colours and ring radii passed');
 const sweep=await page.evaluate(async()=>{
   const r=app.run,f=r.interactables,host=r.r,renderer=host.renderer,clock=host.shared.uTime;
   app.halted=true;r.state='play';
   const site=r.terrain.facilitySites.find(s=>s.surface==='wacom');
   const berry=f.add('berry',site.x,site.z);await berry.modelReady;
   r.player.pos.set(site.x,0,site.z);r.camTarget.copy(r.player.pos);r.updateCamera(1);
   host.scene.updateMatrixWorld(true);host.camera.updateMatrixWorld(true);
   const gl=renderer.getContext(),before=clock.value,target=renderer.getRenderTarget(),auto=renderer.autoClear;
   function read(time){
     clock.value=time;
     renderer.render(berry.model,host.camera);
     const bytes=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
     gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
     return bytes;
   }
   function compare(a,b){
     let count=0,along=0;
     for(let i=0;i<a.length;i+=4){
       if(Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))<5)continue;
       const p=i/4;
       count++;along+=Math.floor(p/gl.drawingBufferWidth)+.32*(p%gl.drawingBufferWidth);
     }
     return {count,center:count?along/count:0};
   }
   try{
     renderer.setRenderTarget(null);renderer.autoClear=true;
     const rest=read(0),earlyTime=.35,lateTime=.6;
     const early=read(earlyTime),low=compare(rest,early),high=compare(rest,read(lateTime));
     const repeat=compare(early,read(1.2+earlyTime)),hold=compare(rest,read(1.1));
     f.interact(berry);
     const cooldown=compare(read(earlyTime),read(lateTime));
     berry.data.regenAt=r.time;f.regen(berry);
     return {low,high,repeat,hold,cooldown,refreshed:compare(rest,read(lateTime)),glError:gl.getError()};
   }finally{
     renderer.setRenderTarget(target);renderer.autoClear=auto;clock.value=before;f.remove(berry);
   }
 });
 assert.ok(sweep.low.count>10 && sweep.high.count>10 && sweep.high.center>sweep.low.center+2,JSON.stringify(sweep));
 assert.equal(sweep.repeat.count,0);assert.equal(sweep.hold.count,0);assert.equal(sweep.cooldown.count,0);assert.deepEqual(sweep.refreshed,sweep.high);
 assert.equal(sweep.glError,0);console.log('Berry sweep, cooldown and regeneration passed',sweep);
 await verifyBillGaze(page,dir,'desk');
 await verifyBerryPickup(page,dir);
 await page.evaluate(async()=>{app.run.state='play';await app.run.changeZone();});
 assert.ok(await page.evaluate(()=>app.run.stage===2&&!app.run.terrain.desk2d));
 assert.ok(await page.evaluate(()=>{
   const r=app.run;r.renderWorld(0);
   return [...r.sprites.glyphGroups.values()].every(g=>!g.material.uniforms.uShelfActive.value&&g.material.uniforms.uShelfDepth.value===null);
 }));
 await verifyBillGaze(page,dir,'stage2');
 await verifyBerryPickup(page,dir);
}
