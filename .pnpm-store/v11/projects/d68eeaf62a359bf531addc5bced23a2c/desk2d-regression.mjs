import assert from 'node:assert/strict';
import path from 'node:path';
export async function verifyDesk(page,dir){
 await page.evaluate(()=>{window.holdHomeStatus=false;window.releaseHomeStatus?.();releaseOptionalDownloads();releaseTextDownload();});
 await page.waitForFunction(()=>window.app?.screen?.querySelector('button')||window.problem,{timeout:35000});
 const click=async(selector,match)=>{const el=await page.waitForFunction((sel,txt)=>[...app.screen.querySelectorAll(sel)].find(el=>!txt||el.textContent.includes(txt)),{timeout:15000},selector,match);await el.evaluate(el=>el.click());await el.dispose();};
 console.log('Home',await page.evaluate(()=>app.screen.textContent.slice(0,250)));
 if(await page.evaluate(()=>!!app.screen.querySelector('.auth-body button')))await click('.auth-body button');
 await click('[data-action="journey"]');await click('.zx-footer button','选择关卡');await click('.zx-footer button','选择难度');await click('[data-action="enter"]');
 await page.waitForFunction(()=>app.run?.terrain?.desk2d&&app.run.time>.1,{timeout:30000});
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
   return {cableError,mouseBlocked,stage:t.zxStage,layers:[...new Set(t.group.children.map(c=>c.name))],colliders:t.colliders.length,spawnFree:!t.hitProp(p.x,.3,p.z,1),edges:edges.every(Boolean),wireBlocked:t.colliders.some(c=>c.kind==='wires'),facilities:r.interactables.list.every(f=>f.model?.name.startsWith('desk2d/device-'))};
 });
 assert.equal(stats.layers.length,24);assert.ok(stats.cableError<.001&&stats.mouseBlocked>1&&stats.spawnFree&&stats.edges&&stats.facilities&&!stats.wireBlocked,JSON.stringify(stats));console.log(stats);
 await page.screenshot({path:path.join(dir,'stage1.png')});
 await page.evaluate(async()=>{app.run.state='play';await app.run.changeZone();});
 assert.ok(await page.evaluate(()=>app.run.stage===2&&!app.run.terrain.desk2d));
}
