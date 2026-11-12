import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// The common VFX harness has already entered the actual compiled game. These
// captures inspect authored machinery; the 60-unit views are explicitly staged
// to show the complete tall models rather than changing the gameplay camera.
export async function reviewMarbleFactories(page,dir){
  const kinds=['helix','switchback','funnel','twin'];
  const report={environment:'Compiled WeChat game / Chrome SwiftShader; controlled player locations. Gameplay captures use camera 42; labelled overview captures stage camera 60. Not phone FPS.',screens:[],factories:[]};
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(async()=>{
    window.dispatchEvent(new Event('resize'));
    Object.assign(app.meta.profile.settings,{quality:'high',batterySaver:false});app.applySettings();vfxSetup();app.run.enemies.clear();
    await Promise.all(app.run.terrain.paperAssets.photoJobs);
    if(app.run.roomLightsOn===false){const button=inspected.doc.querySelector('[data-action="room-light"]');if(!button)throw Error('Missing player light switch');button.click();}
    vfxDraw(false);
    window.marbleFactoryKind=kind=>kind==='marble-factory'||kind==='factory'||!kind?'helix':kind.replace(/^marble-/,'');
  });
  const shot=async name=>{await page.screenshot({path:path.join(dir,name+'.png')});report.screens.push(name);};
  report.layout=await page.evaluate(()=>{
    const t=app.run.terrain,tracks=t.workshopMarbleRuns,sites=t.workshopMarbleSites||[];
    const counts={};for(const track of tracks){const kind=marbleFactoryKind(track.kind);counts[kind]=(counts[kind]||0)+1;}
    let activeLights=0;app.r.scene.traverse(object=>{if(object.isPointLight)activeLights++;});
    return {counts,total:tracks.length,nearby:tracks.filter(t=>Math.hypot(t.x,t.z)<=80).length,
      sites:sites.map(s=>({...s,kind:marbleFactoryKind(s.kind)})),rollingUUID:t.workshopRollingMarbles.uuid,
      rollingCapacity:t.workshopRollingMarbles.instanceMatrix.count,pointLights:t.workshopPointLights.length,activeLights,
      colliders:t.colliders.length,props:t.zxProps.length};
  });
  for(const kind of kinds){assert.ok(report.layout.counts[kind]>0,'Authored machinery must include '+kind);assert.ok(report.layout.sites.some(s=>s.kind===kind),'Scene metadata must identify '+kind);}
  assert.ok(report.layout.nearby>=4,'At least four mechanisms should be accessible around the starting area');
  assert.equal(report.layout.rollingCapacity,report.layout.total*3,'All mechanisms share one bounded rolling-marble mesh');
  assert.equal(report.layout.pointLights,4);assert.equal(report.layout.activeLights,4);assert.equal(report.layout.colliders,report.layout.props);

  for(const kind of kinds){
    await page.setViewport({width:390,height:844,deviceScaleFactor:1});
    const view=await page.evaluate(kind=>{
      window.dispatchEvent(new Event('resize'));vfxSetup();const r=app.run,t=r.terrain;r.enemies.clear();
      const sites=t.workshopMarbleSites.filter(s=>marbleFactoryKind(s.kind)===kind).sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z)),site=sites[0];
      if(!site)throw Error('Missing machinery site '+kind);
      const angle=site.angle||0,southExtent=Math.abs(Math.sin(angle))*site.w/2+Math.abs(Math.cos(angle))*site.d/2;
      let point;
      // Start just south of the machine, then search nearby clear ground. The
      // camera retains its normal yaw, pitch, distance and player focus.
      search:for(let row=0;row<18;row++)for(const dx of [0,-2,2,-4,4,-6,6,-9,9,-12,12]){
        const x=site.x+dx,z=site.z+southExtent+2+row;
        if(Math.abs(x)<t.play-3&&Math.abs(z)<t.play-3&&t.isFlatOpen(x,z)){point={x,z};break search;}
      }
      if(!point)throw Error('No walkable ground south of '+kind);
      r.player.pos.set(point.x,t.height(point.x,point.z),point.z);r.camTarget.copy(r.player.pos);vfxDraw(false);
      const tracks=t.workshopMarbleRuns,track=tracks.filter(run=>marbleFactoryKind(run.kind)===kind).sort((a,b)=>Math.hypot(a.x-site.x,a.z-site.z)-Math.hypot(b.x-site.x,b.z-site.z))[0];
      const visible=tracks.filter(run=>Math.abs(run.x-point.x)<=46&&Math.abs(run.z-point.z)<=46),slot=visible.indexOf(track)*3;
      if(slot<0)throw Error('Selected machinery is outside the active marble radius: '+kind);
      window.marbleFactorySelected={site,track,slot,point};
      const mesh=t.workshopRollingMarbles;
      return {kind,site:{...site},point,slot,camera:r.camDist,walkable:t.isFlatOpen(point.x,point.z),floor:t.height(point.x,point.z),solid:t.hitProp(site.x,.3,site.z,.3),visibleMarbles:mesh.count,uuid:mesh.uuid};
    },kind);
    assert.equal(view.camera,42);assert.ok(view.walkable&&Number.isFinite(view.floor));assert.ok(view.solid,'Machinery footprint must retain collision: '+kind);
    assert.ok(view.visibleMarbles>=view.slot+3);assert.equal(view.uuid,report.layout.rollingUUID);
    await shot(kind+'-gameplay-camera');

    const motion=await page.evaluate(()=>{
      const r=app.run,t=r.terrain,mesh=t.workshopRollingMarbles,{slot}=marbleFactorySelected;
      const positions=()=>Array.from({length:3},(_,i)=>Array.from(mesh.instanceMatrix.array.slice((slot+i)*16+12,(slot+i)*16+15)));
      const before=positions(),uuid=mesh.uuid;
      for(let i=0;i<3;i++)r.renderWorld(.1);
      const after=positions();
      return {before,after,distances:before.map((p,i)=>Math.hypot(...p.map((value,j)=>value-after[i][j]))),sameMesh:mesh===t.workshopRollingMarbles&&uuid===mesh.uuid,finite:after.flat().every(Number.isFinite),count:mesh.count,lights:t.workshopPointLights.length};
    });
    assert.ok(motion.sameMesh&&motion.finite,'Animation must reuse the same valid instance buffer: '+kind);
    assert.ok(motion.distances.every(distance=>distance>1.e-4),'All three marbles must advance on '+kind+' machinery');assert.equal(motion.lights,4);

    await page.setViewport({width:640,height:760,deviceScaleFactor:1});
    const overview=await page.evaluate(()=>{
      window.dispatchEvent(new Event('resize'));const r=app.run,{site}=marbleFactorySelected,c=app.r.camera,pitch=r.camPitch,focus={x:site.x,y:site.h*.38,z:site.z};
      c.position.set(focus.x,focus.y+Math.sin(pitch)*60,focus.z+Math.cos(pitch)*60);c.lookAt(focus.x,focus.y,focus.z);c.updateMatrixWorld(true);
      app.r.renderer.resetState();r.renderWorld(0);r.vfx.update(0);app.r.render(0);
      return {staged:true,distance:60,focus,width:640,height:760};
    });
    await shot(kind+'-staged-overview');report.factories.push({kind,view,motion,overview});
  }
  // A compact comparison assembled solely from the four actual game captures.
  const tiles=await Promise.all(kinds.map(kind=>sharp(path.join(dir,kind+'-staged-overview.png')).resize(320,380).png().toBuffer()));
  await sharp({create:{width:640,height:760,channels:4,background:'#17283a'}}).composite(tiles.map((input,i)=>({input,left:i%2*320,top:Math.floor(i/2)*380}))).png().toFile(path.join(dir,'four-marble-mechanisms.png'));
  report.screens.push('four-marble-mechanisms');
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));vfxSetup();vfxDraw(true);});
  fs.writeFileSync(path.join(dir,'marble-factory-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Marble mechanisms verified: four distinct nearby models, same moving instance pool on every path, walkable approaches, solid footprints and four local lights.');
  return report;
}
