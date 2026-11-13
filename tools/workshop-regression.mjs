import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export async function reviewWorkshop(page,dir){
  await page.evaluate(async()=>{await Promise.all(app.run.terrain.paperAssets.photoJobs);});
  await page.evaluate(()=>{
    inspected.doc.querySelector('[data-dev-action="close"]')?.click();
    const run=app.run;app.halted=true;run.state='play';run.godMode=true;
    run.ui.hideModal();inspected.doc.querySelectorAll('.zx-intro,.run-hint,.banner').forEach(n=>n.remove());
    Object.assign(app.meta.profile.settings,{quality:'high',batterySaver:false});app.applySettings();
    window.workshopFrame=()=>{const r=app.run;app.r.renderer.resetState();r.updateCamera(1);r.renderWorld(0);r.vfx.update(0);r.ui.hud(r);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);};
    workshopFrame();
  });
  const report={environment:'Compiled WeChat bundle / Chrome SwiftShader; staged camera positions, not phone FPS.',screens:[]};
  const frame=()=>page.evaluate(()=>workshopFrame());
  async function shot(name){await frame();await page.screenshot({path:path.join(dir,name+'.png')});report.screens.push(name);}
  async function sceneShot(name){
    await page.evaluate(()=>{for(let i=0;i<3;i++){app.r.renderer.resetState();app.r.render(0);}});
    const screenshot=await page.screenshot({path:path.join(dir,name+'.png')});
    const {data,info}=await sharp(screenshot).resize(160,320).removeAlpha().raw().toBuffer({resolveWithObject:true});let black=0,clipped=0;
    for(let i=0;i<data.length;i+=3){if(data[i]===0&&data[i+1]===0&&data[i+2]===0)black++;if(data[i]>250&&data[i+1]>250&&data[i+2]>250)clipped++;}
    const pixels=info.width*info.height,sample={name,black:black/pixels,clipped:clipped/pixels};
    (report.pixels??=[]).push(sample);assert.ok(sample.black<.02,'HDR bloom must not spread invalid bump normals into black rectangles: '+name);assert.ok(sample.clipped<.04,'Lighting must retain surface detail: '+name);
    report.screens.push(name);
  }
  report.start=await page.evaluate(()=>({lighting:app.run.terrain.workshopLighting,switches:inspected.doc.querySelectorAll('[data-action="room-light"]').length}));
  assert.deepEqual(report.start,{lighting:'daylight',switches:0});
  await shot('01-daylight');
  await sceneShot('01-daylight-scene');
  report.day=await page.evaluate(()=>({on:app.run.terrain.workshopLighting==='daylight',props:app.run.terrain.zxProps.length,lights:app.run.terrain.workshopLamps.length,pointLights:app.run.terrain.workshopPointLights.length,
    boundary:app.run.terrain.workshopBoundary,shadow:app.r.renderer.shadowMap.enabled,materials:[...new Set(app.run.terrain.mats.map(m=>m.type))],spawnClear:!app.run.terrain.hitProp(app.run.player.pos.x,.3,app.run.player.pos.z,.6)}));
  assert.ok(report.day.on&&report.day.props>50&&report.day.lights>100&&report.day.spawnClear);assert.equal(report.day.pointLights,4);assert.equal(report.day.boundary.sides,4);assert.ok(report.day.materials.includes('MeshStandardMaterial'));
  report.craft=await page.evaluate(()=>{
    const r=app.run,t=r.terrain,a=t.paperAssets,hero=r.sprites.get(r.player.speciesId);
    return {photos:[...a.photos].map(([name,p])=>({name,width:p.texture.image.width,height:p.texture.image.height})),failures:a.photoFailures,
      sculpture:t.zxProps.some(p=>/guardian|robot/.test(p.kind)),bevelVertices:a.bevels.getAttribute('position').count,
      tallest:Math.max(...t.zxProps.filter(p=>!p.kind.startsWith('boundary-')).map(p=>p.h)),heroHeight:hero.bodyHeight(r.player.renderScale),
      anchors:t.workshopLayout.anchors,layout:t.workshopLayout.style};
  });
  assert.equal(report.craft.sculpture,false);assert.deepEqual(report.craft.failures,[]);assert.equal(report.craft.photos.length,4);
  assert.ok(report.craft.photos.every(p=>p.width>=600&&p.height>=600));assert.ok(report.craft.bevelVertices>300);
  assert.ok(report.craft.tallest/report.craft.heroHeight<8,'Interior landmarks stay proportional to the glyphs');assert.ok(report.craft.anchors.length>=4,'The smaller map retains scattered toy clusters');
  report.animation=await page.evaluate(()=>{const r=app.run,m=r.terrain.workshopRollingMarbles,before=[...m.instanceMatrix.array.slice(0,16)];r.renderWorld(.1);return {visible:m.count,moved:before.some((n,i)=>n!==m.instanceMatrix.array[i])};});
  assert.ok(report.animation.visible>0&&report.animation.moved);
  report.presets=[];
  for(const quality of ['low','medium','high']){
    const state=await page.evaluate(quality=>{app.meta.profile.settings.quality=quality;app.applySettings();workshopFrame();return {quality,bloom:app.r.bloom.intensity,shadows:app.r.renderer.shadowMap.enabled,lights:app.run.terrain.workshopPointLights.length};},quality);
    assert.equal(state.bloom,0);assert.equal(state.shadows,true);assert.equal(state.lights,4);report.presets.push(state);
  }
  report.collision=await page.evaluate(()=>{const t=app.run.terrain,book=t.zxProps.find(p=>p.kind==='boundary-book');return {props:t.zxProps.length,colliders:t.colliders.length,boundarySolid:t.hitProp(book.x,.3,book.z,.3)};});
  assert.equal(report.collision.props,report.collision.colliders);assert.ok(report.collision.boundarySolid);
  if(process.argv.includes('--boundary-layout')){
    await page.setViewport({width:1200,height:620,deviceScaleFactor:1});
    await page.evaluate(()=>{
      window.dispatchEvent(new Event('resize'));const r=app.run,t=r.terrain,c=app.r.camera;
      r.player.pos.set(0,0,-t.play+18);r.camTarget.copy(r.player.pos);
      const focus={x:0,y:14,z:-t.workshopBoundary.edge+5},pitch=.65,distance=190;
      // The wide inspection camera needs a farther near plane to keep thin
      // paper layers distinguishable at this distance. Gameplay keeps its lens.
      window.boundaryOverviewNear=c.near;c.near=2;c.updateProjectionMatrix();
      c.position.set(0,focus.y+Math.sin(pitch)*distance,focus.z+Math.cos(pitch)*distance);c.lookAt(focus.x,focus.y,focus.z);c.updateMatrixWorld(true);
      app.r.renderer.resetState();r.renderWorld(0);r.vfx.update(0);app.r.render(0);
    });
    await page.screenshot({path:path.join(dir,'boundary-groups-overview.png')});report.screens.push('boundary-groups-overview');
    await page.setViewport({width:390,height:844,deviceScaleFactor:1});
    await page.evaluate(()=>{
      app.r.camera.near=boundaryOverviewNear;app.r.camera.updateProjectionMatrix();
      window.dispatchEvent(new Event('resize'));const r=app.run,t=r.terrain,g=t.workshopBoundary.groups.find(g=>g.side===0&&g.cluster);
      r.player.pos.set((g.start+g.end)/2,0,-t.play+12);r.camTarget.copy(r.player.pos);
    });await shot('boundary-cluster-gameplay');
  }
  const edgeView=await page.evaluate(()=>app.run.terrain.play-10);
  for(const [name,x,z] of [['03-wooden-marble-run',10,-7],['04-giant-storybooks',-20,9],['05-racing-toy',13,26],['06-indoor-boundary',0,-edgeView],['07-south-cutaway',0,edgeView],['08-east-boundary',edgeView,0],['09-west-boundary',-edgeView,0]]){
    await page.evaluate(([x,z])=>{
      const r=app.run,t=r.terrain;let point={x,z};
      search:for(let radius=0;radius<=10;radius++)for(let i=0;i<16;i++){const a=i/16*Math.PI*2,xx=x+Math.cos(a)*radius,zz=z+Math.sin(a)*radius;if(t.isFlatOpen(xx,zz)){point={x:xx,z:zz};break search;}}
      r.player.pos.set(point.x,0,point.z);r.camTarget.copy(r.player.pos);
    },[x,z]);await shot(name);if(name.startsWith('03-')||name.startsWith('04-'))await sceneShot(name+'-scene');

  }
  for(const [w,h] of [[320,568],[430,932]]){
    await page.setViewport({width:w,height:h,deviceScaleFactor:2});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await new Promise(r=>setTimeout(r,250));await frame();
    const p=await page.evaluate(()=>{const b=inspected.doc.querySelector('.zx-hud-pause').getBoundingClientRect();return {x:b.x,r:b.right,b:b.bottom,switches:inspected.doc.querySelectorAll('[data-action="room-light"]').length};});
    assert.equal(p.switches,0);assert.ok(p.x>=0&&p.r<=w+1&&p.b<=h);await shot('hud-layout-'+w);
  }
  report.stages=[];
  for(let stage=2;stage<=4;stage++){
    await page.evaluate(async()=>{app.run.state='play';await app.run.changeZone();app.halted=true;});await page.waitForFunction(stage=>app.run.stage===stage&&app.run.state==='play',{timeout:90000},stage);
    await page.evaluate(async()=>{await Promise.all(app.run.terrain.paperAssets.photoJobs);});
    await frame();const s=await page.evaluate(()=>{let activeLights=0;app.r.scene.traverse(o=>{if(o.isPointLight)activeLights++;});return {stage:app.run.stage,daylight:app.run.terrain.workshopLighting==='daylight',lights:app.run.terrain.workshopPointLights.length,activeLights,clear:!app.run.terrain.hitProp(app.run.player.pos.x,.3,app.run.player.pos.z,.6)};});
    assert.ok(s.daylight&&s.clear);assert.equal(s.lights,4);assert.equal(s.activeLights,4,'Outgoing room lights must be removed');report.stages.push(s);
  }
  fs.writeFileSync(path.join(dir,'workshop-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Workshop verified: daylight-only HUD, lit materials, four local lights, indoor boundary, 320/430 layouts and all four areas.');
}
