import {FOREST_ROUTE} from '../source/src/lite-rules.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewIllustratedDesk(page,dir){
  await page.setViewport({width:390,height:844,deviceScaleFactor:2});
  await page.evaluate(()=>{
    window.dispatchEvent(new Event('resize'));app.halted=true;
    window.deskPrepare=()=>{
      const dev=inspected.env.__zixingDeveloper;if(dev){dev.options.hideScenery=false;dev.close();}
      const r=app.run;r.state='play';r.godMode=true;r.pendingLevels=0;r.autoRun=false;r.ui.hideModal();
      r.player.moves=Array(4).fill(null);r.ult.clear();r.enemies.clear();r.director.update=()=>{};r.events.update=()=>{};r.minibosses.update=()=>{};
      r.timers.length=0;r.anims.length=0;r.input.releaseAll();r.input.endFrame();r.weather=r.baseWeather='clear';r.weatherT=0;
      inspected.doc.querySelectorAll('.zx-intro,.run-hint,.banner').forEach(n=>n.remove());
    };
    window.deskFrame=()=>{const r=app.run;app.r.renderer.resetState();r.updateCamera(1);r.renderWorld(0);r.vfx.update(0);r.ui.hud(r);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);};
    window.deskPlace=(x,z)=>{const r=app.run,p=r.player,t=r.terrain;
      if(t.hitProp(x,t.height(x,z)+.03,z,p.radius+.1)){
        search:for(let radius=.5;radius<10;radius+=.5)for(let i=0;i<32;i++){
          const xx=x+Math.cos(i/32*Math.PI*2)*radius,zz=z+Math.sin(i/32*Math.PI*2)*radius;
          if(t.isFlatOpen(xx,zz)&&!t.hitProp(xx,t.height(xx,zz)+.03,zz,p.radius+.1)){x=xx;z=zz;break search;}
        }
      }
      p.pos.set(x,t.height(x,z),z);p.vel.set(0,0,0);p.grounded=true;p.kx=p.kz=p.crowdX=p.crowdZ=0;p.slideT=0;p.stuckT=0;r.camTarget.copy(p.pos);};
    deskPrepare();deskFrame();
  });
  if(process.argv.includes('--tabletop-edge')){
    const {reviewTabletopEdge}=await import('./tabletop-edge-regression.mjs');await reviewTabletopEdge(page,dir);
    if(process.argv.includes('--edge-only'))return;
    await page.setViewport({width:390,height:844,deviceScaleFactor:2});
    await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));deskPlace(app.run.terrain.spawn.x,app.run.terrain.spawn.z);deskFrame();});
  }
  const baseline=process.argv.includes('--baseline'),prefix=baseline?'调整前':'新版';
  const report={environment:'Compiled WeChat bundle, Chrome SwiftShader. Visual/collision verification; not phone FPS.',stages:[],screens:[]};
  async function shot(name){await page.evaluate(()=>deskFrame());await page.screenshot({path:path.join(dir,prefix+'-'+name+'.png')});report.screens.push(prefix+'-'+name+'.png');}
  await shot('出生点');
  for(const [name,x,z] of [['绘图桌',0,0],['旅行手帐',-27,9],['生活收纳',28,3],['远处桌面',42,47]]){
    await page.evaluate(([x,z])=>deskPlace(x,z),[x,z]);await shot(name);
  }
  report.initial=await page.evaluate(()=>{const t=app.run.terrain;return {play:t.play,spawn:t.spawn.toArray(),arena:t.arena,props:t.zxProps.length,surfaces:t.workshopGroundSurfaces.length,layout:t.workshopLayout};});
  fs.writeFileSync(path.join(dir,baseline?'before.json':'illustrated-desk-report.json'),JSON.stringify(report,null,2));
  if(baseline)return;
  await page.evaluate(()=>{
    window.deskAudit=()=>{
      const r=app.run,t=r.terrain,step=1.25,limit=t.play-4,n=Math.floor(limit*2/step)+1,open=new Uint8Array(n*n),reached=new Uint8Array(n*n);
      const coord=i=>-limit+i*step;
      let openCount=0,surfaceCount=0,solidCount=0,validCount=0,inlayCount=0;
      for(let j=0;j<n;j++)for(let i=0;i<n;i++){
        const x=coord(i),z=coord(j);if(!t.inBounds(x,z,1))continue;
        if((t.workshopDesktopInlays||[]).some(p=>Math.abs(x-p.x)<=p.w/2&&Math.abs(z-p.z)<=p.d/2))inlayCount++;
        validCount++;const ground=t.height(x,z),solid=t.hitProp(x,ground+.05,z,r.player.radius+.1)||t.inSolid(x,z);
        if(solid)solidCount++;if(ground>.03)surfaceCount++;
        if(!solid){open[j*n+i]=1;openCount++;}
      }
      let start=-1,distance=Infinity;
      for(let j=0;j<n;j++)for(let i=0;i<n;i++)if(open[j*n+i]){
        const d=Math.hypot(coord(i)-t.spawn.x,coord(j)-t.spawn.z);if(d<distance){distance=d;start=j*n+i;}
      }
      const queue=[start];reached[start]=1;
      for(let head=0;head<queue.length;head++){
        const q=queue[head],x=q%n,z=Math.floor(q/n);
        for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const xx=x+dx,zz=z+dz,j=zz*n+xx;if(xx<0||zz<0||xx>=n||zz>=n||!open[j]||reached[j])continue;
          if(!t.walkClear(coord(x),coord(z),dx,dz,step,r.player.radius+.03))continue;
          reached[j]=1;queue.push(j);
        }
      }
      const reachable=(x,z,radius)=>{
        const i=Math.round((x+limit)/step),j=Math.round((z+limit)/step),range=Math.ceil(radius/step);
        for(let dy=-range;dy<=range;dy++)for(let dx=-range;dx<=range;dx++){
          const xx=i+dx,zz=j+dy;if(xx<0||zz<0||xx>=n||zz>=n)continue;
          if(reached[zz*n+xx]&&Math.hypot(coord(xx)-x,coord(zz)-z)<radius)return true;
        }return false;
      };
      let activeLights=0;app.r.scene.traverse(o=>{if(o.isPointLight)activeLights++;});
      const coloredContours=t.group.children.filter(o=>o.name==='painted-prop-contour');
      const buildings=r.interactables.list.map(b=>({kind:b.kind,x:b.x,z:b.z,inside:t.inBounds(b.x,b.z),reachable:reachable(b.x,b.z,5),groundError:Math.abs(b.y-t.height(b.x,b.z))}));
      const sampleProps=t.zxProps.filter(p=>['mechanical-keyboard','milk-bottle','rangefinder-camera','storage-crate','smartphone'].includes(p.kind));
      return {stage:r.stage,world:t.world,play:t.play,props:t.zxProps.length,colliders:t.colliders.length,surfaces:t.workshopGroundSurfaces.length,anchors:t.workshopLayout.anchors.length,
        spawn:t.spawn.toArray(),spawnClear:!t.hitProp(t.spawn.x,t.spawn.y+.03,t.spawn.z,r.player.radius),reachableFraction:queue.length/openCount,
        matchedColliders:t.zxProps.every(p=>t.colliders.some(c=>c.paperBox&&Math.abs(c.x-p.x)<.001&&Math.abs(c.z-p.z)<.001&&Math.abs(c.halfX*2-p.w)<.001&&Math.abs(c.halfZ*2-p.d)<.001)),
        solidFraction:solidCount/validCount,surfaceFraction:surfaceCount/validCount,reachableAnchors:t.workshopLayout.anchors.every(a=>reachable(a.x,a.z,8)),
        buildings,activeLights,contourBatches:coloredContours.length,coloredContours:coloredContours.every(o=>!!o.instanceColor&&o.material.name==='own-colour-hand-drawn-contour'),
        solidExamples:sampleProps.every(p=>t.hitProp(p.x,p.baseY+.05,p.z,.3)),marbles:t.workshopLooseMarbles.length,
        render:{width:app.r.composer.inputBuffer.width,height:app.r.composer.inputBuffer.height,calls:app.r.renderer.info.render.calls,triangles:app.r.renderer.info.render.triangles},
        textFailures:t.paperAssets.photoFailures,desktopInlays:{regions:t.workshopDesktopInlays||[],changedFraction:inlayCount/validCount},
        stationery:{pencils:t.zxProps.filter(p=>/pencil/.test(p.kind)).length,ballpoints:t.zxProps.filter(p=>p.kind==='ballpoint-pen').length,gelPens:t.zxProps.filter(p=>p.kind==='gel-pen').length,penCups:t.zxProps.filter(p=>p.kind==='pen-cup').length}};
    };
  });
  const audit=async()=>{
    const result=await page.evaluate(()=>deskAudit());report.stages.push(result);
    fs.writeFileSync(path.join(dir,'illustrated-desk-report.json'),JSON.stringify(report,null,2));
    assert.ok(result.spawnClear,'Spawn must remain clear');
    assert.ok(result.matchedColliders,'Each tall prop needs its matching footprint (arena columns add their own colliders)');
    assert.ok(result.reachableFraction>.97,'Walkable routes must form one connected space');
    assert.ok(result.reachableAnchors,'Every authored activity must be reachable');
    assert.ok(result.buildings.every(b=>b.inside&&b.reachable&&b.groundError<.05),'Functional buildings must be reachable and grounded');
    assert.ok(result.coloredContours&&result.contourBatches>5,'Scene silhouettes use per-object pigment colors');
    assert.ok(result.solidExamples,'New objects need real collisions');assert.equal(result.activeLights,4);assert.deepEqual(result.textFailures,[]);
    if(process.argv.includes('--pens')){assert.equal(result.stationery.pencils,0);assert.ok(result.stationery.ballpoints>0&&result.stationery.gelPens>0&&result.stationery.penCups>0);}
    if(process.argv.includes('--tabletop-inlays')){
      assert.equal(result.desktopInlays.regions.length,3);
      assert.ok(result.desktopInlays.changedFraction>.12&&result.desktopInlays.changedFraction<.26,'Keep at least three quarters of the existing tabletop');
    }
    return result;
  };
  await audit();
  if(process.argv.includes('--tabletop-inlays')){
    report.inlayViews=[];
    for(const kind of ['weathered-oak','warm-slats','golden-ash']){
      const view=await page.evaluate(kind=>{
        const r=app.run,t=r.terrain,p=t.workshopDesktopInlays.find(p=>p.kind===kind);
        let best=null;
        for(let j=-3;j<=3;j++)for(let i=-3;i<=3;i++){
          const x=p.x+i*p.w*.10,z=p.z+j*p.d*.10;if(t.height(x,z)>.025||t.hitProp(x,.1,z,r.player.radius+.1))continue;
          let score=0;for(let dz=-12;dz<=9;dz+=3)for(let dx=-8;dx<=8;dx+=4){
            const xx=x+dx,zz=z+dz;
            if(Math.abs(xx-p.x)<p.w/2&&Math.abs(zz-p.z)<p.d/2&&t.height(xx,zz)<.025&&!t.hitProp(xx,.1,zz,.2))score++;
          }
          if(!best||score>best.score)best={x,z,score};
        }
        if(!best)throw Error('No exposed tabletop at '+kind);
        deskPlace(best.x,best.z);deskFrame();return {...p,player:r.player.pos.toArray(),visibleFloorScore:best.score};
      },kind);report.inlayViews.push(view);await shot('木纹-'+kind);
    }
    await page.evaluate(()=>{const p=app.run.terrain.workshopDesktopInlays[0];deskPlace(p.x-p.w*.15,p.z-p.d*.5+2);});await shot('木纹-自然接缝');
  }
  if(process.argv.includes('--pens')){
    report.pens=[];
    for(const kind of ['ballpoint-pen','gel-pen','pen-cup']){
      const state=await page.evaluate(kind=>{
        const t=app.run.terrain,p=t.zxProps.find(p=>p.kind===kind);if(!p)throw Error('Missing '+kind);
        deskPlace(p.x-3,p.z+3);deskFrame();return {kind,x:p.x,z:p.z,count:t.zxProps.filter(p=>p.kind===kind).length};
      },kind);report.pens.push(state);await shot(kind);
    }
  }
  // Real player movement crosses the tablet lip and stops at the keyboard.
  report.movement=await page.evaluate(()=>{
    const r=app.run,p=r.player,t=r.terrain;deskPlace(0,0);
    const walk=(dx,dz,frames)=>{
      r.input.stickX=dx;r.input.stickY=-dz;let maxError=0;
      for(let i=0;i<frames;i++){r.realDt=1/60;p.update(1/60);r.input.endFrame();if(p.grounded)maxError=Math.max(maxError,Math.abs(p.pos.y-t.height(p.pos.x,p.pos.z)));}
      r.input.stickX=r.input.stickY=0;return {x:p.pos.x,y:p.pos.y,z:p.pos.z,maxError,inside:t.hitProp(p.pos.x,p.pos.y+.03,p.pos.z,p.radius-.04)};
    };
    const exit=walk(0,1,120);deskPlace(0,0);const blocked=walk(0,-1,180);return {exit,blocked};
  });
  assert.ok(report.movement.exit.z>8,'The player must walk off the drawing tablet');assert.ok(report.movement.exit.maxError<.36);
  assert.equal(report.movement.blocked.inside,false,'Keyboard collision must stop the player outside its silhouette');assert.ok(report.movement.blocked.z>-10&&report.movement.blocked.z<-3);
  report.workloads=[];
  for(const quality of ['low','medium','high']){
    const sample=await page.evaluate(quality=>{
      app.meta.profile.settings.quality=quality;app.applySettings();deskPlace(0,0);deskFrame();
      const info=app.r.renderer.info,auto=info.autoReset;info.autoReset=false;info.reset();app.r.render(0);
      const result={quality,calls:info.render.calls,triangles:info.render.triangles,geometries:info.memory.geometries,textures:info.memory.textures,bloom:app.r.bloom.intensity};info.autoReset=auto;return result;
    },quality);report.workloads.push(sample);assert.equal(sample.bloom,0);
    assert.ok(sample.calls<300&&sample.triangles<1000000,'Keep the authored desk within a bounded render workload');
  }
  const moves=JSON.parse(fs.readFileSync(new URL('../source/public/data/moves.json',import.meta.url),'utf8'));
  report.skills=[];
  for(const key of ['ember','fire-spin']){
    const skill=await page.evaluate(async({id,key})=>{
      deskPrepare();deskPlace(0,0);const r=app.run,p=r.player,f=r.vfx.crafted,e=r.enemies;
      const art=key==='ember'?f.fireball:f.fireSpin;if(!await art.ready)throw Error('Hand drawn atlas failed to load');
      r.projectiles.clear();r.zones.clear();r.vfx.clear();p.stats.critChance=0;r.ult.charge=0;r.ult.active=0;r.hitstopT=0;r.aimMode='auto';
      const enemy=e.spawn(4,-2.8,-2.5,1,1,0);e.hp[enemy]=e.maxHp[enemy]=1e7;e.y[enemy]=r.terrain.height(-2.8,-2.5);
      e.update=()=>e.grid.build(e.n,e.x,e.z,e.alive,e.radius,e.dying);e.update();r.lockTarget=enemy;
      p.facing.set(-2.8,-2.5).normalize();p.addMove(id);p.moves[0].timer=0;
      let peak=0;
      for(let i=0;i<50;i++){r.realTime+=1/30;r.simulate(1/30);if(i===0)p.moves[0].timer=999;r.renderWorld(1/30);r.vfx.update(1/30);peak=Math.max(peak,art.mesh.count);}
      const result={key,atlasReady:true,peak,damage:p.moves[0].damageDone};r.projectiles.clear();r.zones.clear();r.vfx.clear();deskPrepare();return result;
    },{id:moves.find(m=>m.key===key).id,key});
    report.skills.push(skill);assert.ok(skill.atlasReady&&skill.peak>0&&skill.damage>0,'The existing hand drawn skill must render and hit in the new scene');
  }
  for(const [width,height] of [[320,568],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:2});await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));deskPlace(0,0);});await shot('手机-'+width);
    const ui=await page.evaluate(()=>{const b=inspected.doc.querySelector('.zx-hud-pause').getBoundingClientRect();return {right:b.right,bottom:b.bottom};});
    assert.ok(ui.right<=width+1&&ui.bottom<=height);
  }
  await page.setViewport({width:1200,height:1000,deviceScaleFactor:1});
  await page.evaluate(()=>{
    window.dispatchEvent(new Event('resize'));deskPlace(0,0);const r=app.run,c=app.r.camera;c.near=1;c.updateProjectionMatrix();
    c.position.set(0,65,46);c.lookAt(0,0,0);c.updateMatrixWorld(true);r.renderWorld(0);r.vfx.update(0);app.r.render(0);
  });await page.screenshot({path:path.join(dir,'新版-桌面全景.png')});
  await page.setViewport({width:390,height:844,deviceScaleFactor:2});await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));app.r.camera.near=.1;app.r.camera.updateProjectionMatrix();});
  for(const stage of FOREST_ROUTE.slice(1)){
    await page.evaluate(async()=>{app.run.state='play';await app.run.changeZone();app.halted=true;deskPrepare();});
    await page.waitForFunction(s=>app.run.stage===s&&app.run.state==='play',{timeout:90000},stage);
    await shot('区域-'+stage);await audit();
  }
  fs.writeFileSync(path.join(dir,'illustrated-desk-report.json'),JSON.stringify(report,null,2));
  console.log('Illustrated desk: three areas, connected routes, matching collisions, actual player movement, colored outlines, 320/430 layouts verified.');
}
