import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {reviewShadowFalloff} from './shadow-falloff-regression.mjs';

export async function reviewLighting(page,dir){
  const baseline=process.argv.includes('--lighting-baseline');
  const report={environment:'Compiled WeChat bundle in Chrome SwiftShader, original gameplay camera; not phone FPS.',screens:[],presets:[],stages:[]};
  await page.setViewport({width:390,height:844,deviceScaleFactor:2});
  await page.evaluate(async()=>{window.dispatchEvent(new Event('resize'));vfxSetup();app.run.enemies.clear();await Promise.all(app.run.terrain.paperAssets.photoJobs);});
  const draw=async(x=0,z=5,ui=false)=>page.evaluate(([x,z,ui])=>{const run=app.run;run.player.pos.set(x,0,z);run.camTarget.copy(run.player.pos);vfxDraw(ui);},[x,z,ui]);
  const shot=async name=>{const frame=await page.screenshot({path:path.join(dir,name+'.png')});report.screens.push(name);return frame;};
  for(const [name,x,z] of [['paper',0,5],['wood',23,9],['books',-10,-8],['book-gradient',-3,-7]]){await draw(x,z);await shot((baseline?'before-':'after-')+name);}
  if(baseline)return;

  // A/B the actual scene output. Edge filtering must change contour pixels
  // while leaving almost all of the flat paper/wood pigment untouched.
  await draw();const filtered=await page.screenshot();
  await page.evaluate(()=>{
    const r=app.r,pass=r.finalPass.enabled?r.finalPass:r.finalLite;
    r.antiAliasPass.enabled=false;pass.renderToScreen=true;
    window.restoreSceneAA=()=>{r.antiAliasPass.enabled=true;pass.renderToScreen=false;r.renderer.resetState();r.render(0);};
    r.renderer.resetState();r.render(0);
  });
  let unfiltered;
  try{unfiltered=await page.screenshot();}finally{await page.evaluate(()=>{restoreSceneAA();delete window.restoreSceneAA;});}
  const edgeA=await sharp(filtered).removeAlpha().raw().toBuffer(),edgeB=await sharp(unfiltered).removeAlpha().raw().toBuffer();
  let changed=0,total=0;
  for(let i=0;i<edgeA.length;i+=3){const delta=Math.abs(edgeA[i]-edgeB[i])+Math.abs(edgeA[i+1]-edgeB[i+1])+Math.abs(edgeA[i+2]-edgeB[i+2]);total+=delta;if(delta>12)changed++;}
  report.antialias={edgePixels:changed,meanChannelDelta:total/edgeA.length};
  console.log('Scene edge AA pixel comparison',JSON.stringify(report.antialias));
  assert.ok(changed>1000,'Scene outlines must receive actual edge filtering');
  assert.ok(report.antialias.meanChannelDelta<3,'Antialiasing must not blur the whole image');

  // Use the real scene paper on the real desktop, with all occluders hidden.
  // The two pixel samples must change from warm light to cool shade.
  await draw();
  await page.evaluate(()=>{
    const t=app.run.terrain,floor=t.group.children.find(m=>m.material===t.paperAssets.mats.get('maple-desktop'));
    const states=[];app.r.scene.traverse(m=>{if(m.isMesh&&m!==floor){states.push([m,m.visible]);m.visible=false;}});
    const material=floor.material,paper=t.paperAssets.mats.get('notebook-paper'),map=paper.map,receive=floor.receiveShadow,sun=app.r.sun.intensity;
    floor.material=paper;floor.receiveShadow=false;paper.map=null;paper.needsUpdate=true;
    window.restoreLightingProbe=()=>{floor.material=material;floor.receiveShadow=receive;paper.map=map;paper.needsUpdate=true;app.r.sun.intensity=sun;states.forEach(([m,v])=>m.visible=v);};
  });
  report.pigment={};
  for(const mode of ['light','shade']){
    await page.evaluate(mode=>{if(mode==='shade')app.r.sun.intensity=0;app.r.renderer.resetState();app.r.render(0);},mode);
    const frame=await page.screenshot();
    const stats=await sharp(await sharp(frame).extract({left:270,top:600,width:200,height:400}).removeAlpha().toBuffer()).stats();
    report.pigment[mode]=stats.channels.map(c=>c.mean);
  }
  await page.evaluate(()=>{restoreLightingProbe();delete window.restoreLightingProbe;});
  const [lr,lg,lb]=report.pigment.light,[sr,sg,sb]=report.pigment.shade;
  console.log('Light / shade paper pixels',JSON.stringify(report.pigment));
  assert.ok(lr>lb+8,'Lit paper should visibly reflect warm light');
  assert.ok(sb>sr+12,'Paper in shade should remain cool');
  assert.ok((lr+lg+lb)/(sr+sg+sb)>1.35,'Light/shade contrast should remain strong');
  assert.ok(Math.max(lr,lg,lb)<252,'Pale pigment should keep highlight headroom');

  // Compare actual occlusion against the same frame with shadow receiving off.
  await draw();
  const withShadow=await page.screenshot();
  await page.evaluate(()=>{window.lightingReceivers=[];app.r.scene.traverse(m=>{if(m.isMesh&&m.receiveShadow){lightingReceivers.push(m);m.receiveShadow=false;}});app.r.renderer.resetState();app.r.render(0);});
  const withoutShadow=await page.screenshot();
  await page.evaluate(()=>{lightingReceivers.forEach(m=>m.receiveShadow=true);delete window.lightingReceivers;});
  const raw=async f=>sharp(f).removeAlpha().raw().toBuffer();
  const a=await raw(withShadow),b=await raw(withoutShadow);let darkened=0;
  for(let i=0;i<a.length;i+=3)if(b[i]+b[i+1]+b[i+2]-a[i]-a[i+1]-a[i+2]>45)darkened++;
  report.projectedPixels=darkened;assert.ok(darkened>1500,'Scene objects must visibly cast shadows onto other surfaces');
  report.falloff=await reviewShadowFalloff(page);

  // Count actual shadow submissions: a held view reuses the map, moving or
  // reapplying the look keeps exactly the same sun direction.
  report.stability=await page.evaluate(()=>{
    const run=app.run,sun=app.r.sun;let draws=0;
    const meshes=run.terrain.group.children.filter(m=>m.castShadow);
    meshes.forEach(m=>m.onBeforeShadow=()=>draws++);
    vfxDraw(false);draws=0;vfxDraw(false);const stationaryDraws=draws;
    run.player.pos.x+=1;run.camTarget.copy(run.player.pos);vfxDraw(false);const movingDraws=draws;
    const before=sun.position.clone().sub(sun.target.position).normalize();
    run.pushLook();vfxDraw(false);const after=sun.position.clone().sub(sun.target.position).normalize();
    meshes.forEach(m=>m.onBeforeShadow=()=>{});
    return {stationaryDraws,movingDraws,directionDelta:before.distanceTo(after)};
  });
  assert.equal(report.stability.stationaryDraws,0);assert.ok(report.stability.movingDraws>0);assert.ok(report.stability.directionDelta<1e-8);

  for(const quality of ['low','medium','high']){
    await page.evaluate(quality=>{app.meta.profile.settings.quality=quality;app.applySettings();app.run.pushLook();},quality);
    await draw();
    const state=await page.evaluate(()=>({enabled:app.r.renderer.shadowMap.enabled,casts:app.r.sun.castShadow,size:app.r.sun.shadow.mapSize.x,antialias:app.r.antiAliasPass.enabled,glError:app.r.renderer.getContext().getError(),camera:[app.run.camDist,app.r.camera.fov,app.run.camPitch],lights:app.run.terrain.workshopPointLights.length}));
    assert.ok(state.enabled&&state.casts);assert.deepEqual(state.camera,[42,37,Math.PI*.3]);assert.equal(state.lights,4);
    assert.ok(state.antialias);assert.equal(state.glError,0,'Every quality preset must render without GL errors');
    if(quality!=='high'){state.falloff=await reviewShadowFalloff(page);await draw();}
    report.presets.push({quality,...state});await shot('quality-'+quality);
  }
  await draw(0,5,true);await shot('gameplay-hud');
  for(const [width,height] of [[320,568],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:2});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await draw(0,5,true);await shot('phone-'+width);
  }
  await page.setViewport({width:390,height:844,deviceScaleFactor:2});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
  for(let stage=1;stage<=4;stage++){
    if(stage>1)await page.evaluate(async()=>{app.run.state='play';await app.run.changeZone();app.halted=true;app.run.enemies.clear();});
    await draw();
    const state=await page.evaluate(()=>{const r=app.run,t=r.terrain;let points=0;app.r.scene.traverse(o=>{if(o.isPointLight)points++;});return {stage:r.stage,shadows:app.r.renderer.shadowMap.enabled,casters:t.group.children.filter(m=>m.castShadow).length,points,clear:!t.hitProp(t.spawn.x,.3,t.spawn.z,.6)};});
    assert.equal(state.stage,stage);assert.ok(state.shadows&&state.casters>5&&state.clear);assert.equal(state.points,4);report.stages.push(state);await shot('area-'+stage);
  }
  report.disposal=await page.evaluate(()=>{const sun=app.r.sun;app.run.dispose();app.run=null;return {casts:sun.castShadow,mapReleased:sun.shadow.map===null,target:sun.target.position.toArray(),enabled:app.r.renderer.shadowMap.enabled};});
  assert.deepEqual(report.disposal,{casts:false,mapReleased:true,target:[0,0,0],enabled:false});
  fs.writeFileSync(path.join(dir,'lighting-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Warm light / cool shade pixels, real projected shadows, three quality presets, three phone widths and four areas passed.');
}
