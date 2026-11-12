import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export async function reviewDeskPaint(page,dir){
  const report={environment:'Actual compiled WeChat bundle in Chrome SwiftShader; original camera. Not a phone performance test.',screens:[],presets:[],stages:[]};
  await page.setViewport({width:390,height:844,deviceScaleFactor:2});
  await page.evaluate(async()=>{window.dispatchEvent(new Event('resize'));vfxSetup();app.run.enemies.clear();await Promise.all(app.run.terrain.paperAssets.photoJobs);});
  const shot=async name=>{const frame=await page.screenshot({path:path.join(dir,name+'.png')});report.screens.push(name);return frame;};
  const position=async(x,z,ui=false)=>page.evaluate(([x,z,ui])=>{
    const r=app.run;r.player.pos.set(x,0,z);r.camTarget.copy(r.player.pos);
    for(let i=0;i<90;i++)r.renderWorld(1/30);
    vfxDraw(ui);
  },[x,z,ui]);
  await position(0,5,true);
  report.ui=await page.evaluate(()=>({switches:inspected.doc.querySelectorAll('[data-action="room-light"],.zx-room-light').length,lighting:app.run.terrain.workshopLighting}));
  assert.deepEqual(report.ui,{switches:0,lighting:'daylight'});
  await shot('01-daylight-no-switch');
  report.materials=await page.evaluate(()=>{
    const r=app.run,t=r.terrain,a=t.paperAssets,c=a.photos.get('paper').texture.image.getContext('2d'),paper=Array.from(c.getImageData(100,100,1,1).data);
    return {paper,shadowStyle:t.workshopShadowStyle,casters:t.group.children.filter(m=>m.castShadow).length,
      paperContact:{surface:t.workshopGroundY(0,5),shadow:r.sprites.shadows.a.array[1],ring:r.playerFootRing.position.y},
      halos:t.group.children.find(m=>m.name==='steady-lamp-halos').userData.paperInstances.total,
      bulbs:t.workshopLamps.filter(l=>l.reactive).length,colors:[...new Set(t.workshopLamps.filter(l=>l.reactive).map(l=>l.color))]};
  });
  assert.ok(report.materials.paper[2]>report.materials.paper[0]+15);
  assert.equal(report.materials.shadowStyle,'distance-faded-soft-shadows');assert.ok(report.materials.casters>5);
  assert.ok(report.materials.paperContact.shadow>=report.materials.paperContact.surface&&report.materials.paperContact.ring>report.materials.paperContact.surface);
  assert.equal(report.materials.halos,report.materials.bulbs);assert.equal(report.materials.colors.length,5);
  for(const [name,x,z] of [['02-paper-and-mat',0,5],['03-wood-between-mats',23,9],['04-cool-desk',54,50],['05-pale-paper',-54,0],['06-anchored-cable',-18,-14]]){
    await position(x,z);await shot(name);
  }

  // Lock the camera on one real bulb, vary only player distance, and compare
  // rendered pixels. Stationary snapshots must remain identical over time.
  const lamp=await page.evaluate(()=>{
    const r=app.run,l=r.terrain.workshopLamps.filter(l=>l.reactive&&l.y>7&&l.y<12).sort((a,b)=>Math.hypot(a.x,a.z+18.5)-Math.hypot(b.x,b.z+18.5))[0];
    window.sensorTestLamp=l;return l;
  });
  await position(lamp.x,lamp.z+4);
  const crop=await page.evaluate(()=>{
    const r=app.run,l=sensorTestLamp,v=r.player.pos.clone().set(l.x,l.y,l.z).project(app.r.camera);
    return {left:Math.round((v.x+1)*390)-23,top:Math.round((1-v.y)*844)-23,width:46,height:46};
  });
  const lampFrame=async(distance,frames=120)=>{
    await page.evaluate(({distance,frames})=>{
      const r=app.run,l=sensorTestLamp;r.player.pos.set(l.x,0,l.z+distance);
      for(let i=0;i<frames;i++)r.renderWorld(1/30);
      for(const b of r.sprites.batches.values())if(b.mesh)b.mesh.visible=false;
      r.playerFootRing.visible=false;r.sprites.shadows.mesh.visible=false;
      app.r.renderer.resetState();app.r.render(0);
    },{distance,frames});
    return page.screenshot();
  };
  report.proximity=[];
  const cropStats=async frame=>sharp(await sharp(frame).extract(crop).removeAlpha().toBuffer()).stats();
  for(const distance of [18,12,8,4]){
    const frame=await lampFrame(distance),stats=await cropStats(frame);
    report.proximity.push({distance,mean:stats.channels.map(c=>c.mean),brightness:stats.channels.reduce((a,c)=>a+c.mean,0)/3});
    if(distance===18||distance===4){const name=distance===18?'07-lamps-away':'08-lamps-near';fs.writeFileSync(path.join(dir,name+'.png'),frame);report.screens.push(name);}
  }
  console.log('Lamp pixel sample',JSON.stringify({lamp,crop,levels:report.proximity}));
  for(let i=1;i<report.proximity.length;i++)assert.ok(report.proximity[i].brightness>=report.proximity[i-1].brightness-.2,'Approaching should brighten continuously');
  assert.ok(report.proximity.at(-1).brightness-report.proximity[0].brightness>8,'A nearby bulb must visibly brighten in daylight');
  const heldA=await sharp(await lampFrame(4)).extract(crop).removeAlpha().raw().toBuffer();
  const heldB=await sharp(await lampFrame(4,180)).extract(crop).removeAlpha().raw().toBuffer();
  report.stationaryMaxDelta=Math.max(...heldA.map((v,i)=>Math.abs(v-heldB[i])));
  assert.ok(report.stationaryMaxDelta<=1,'Standing beside a lamp must not cause blinking or breathing');
  const leaving=await cropStats(await lampFrame(18));
  assert.ok(Math.abs(leaving.channels.reduce((a,c)=>a+c.mean,0)/3-report.proximity[0].brightness)<1,'Leaving returns smoothly to the same inactive state');

  for(const quality of ['low','medium','high']){
    await page.evaluate(quality=>{app.meta.profile.settings.quality=quality;app.applySettings();},quality);
    await position(lamp.x,lamp.z+4);
    const state=await page.evaluate(()=>{
      const r=app.run,t=r.terrain;
      const lights=JSON.stringify(t.workshopPointLights.map(l=>[...l.position.toArray(),l.intensity]));
      for(let i=0;i<120;i++)r.renderWorld(1/30);
      return {projectedShadows:app.r.renderer.shadowMap.enabled,camera:[r.camDist,app.r.camera.fov,r.camPitch],lighting:t.workshopLighting,stable:lights===JSON.stringify(t.workshopPointLights.map(l=>[...l.position.toArray(),l.intensity]))};
    });
    assert.equal(state.projectedShadows,true);assert.deepEqual(state.camera,[42,37,Math.PI*.3]);assert.ok(state.stable);assert.equal(state.lighting,'daylight');
    report.presets.push({quality,...state});await shot('lamps-'+quality);
  }
  for(const [width,height] of [[320,568],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:2});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
    await position(0,5,true);
    const state=await page.evaluate(()=>{
      const p=inspected.doc.querySelector('.zx-hud-pause').getBoundingClientRect();
      return {switches:inspected.doc.querySelectorAll('[data-action="room-light"]').length,pause:{x:p.x,y:p.y,right:p.right,bottom:p.bottom}};
    });
    assert.equal(state.switches,0);assert.ok(state.pause.x>=0&&state.pause.right<=width+1&&state.pause.bottom<=height);
    await shot('hud-'+width);
  }
  await page.setViewport({width:390,height:844,deviceScaleFactor:2});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
  for(let stage=1;stage<=4;stage++){
    if(stage>1)await page.evaluate(async()=>{app.run.state='play';await app.run.changeZone();app.halted=true;app.run.enemies.clear();});
    const state=await page.evaluate(()=>{
      const r=app.run,t=r.terrain,counts={wood:0,paper:0,cloth:0},quadrants=Array.from({length:4},()=>({wood:0,total:0}));
      for(let z=-t.play+8;z<t.play-8;z+=3)for(let x=-t.play+8;x<t.play-8;x+=3){
        let top=-.12,kind='wood';
        for(const p of t.workshopGroundSurfaces){const dx=x-p.x,dz=z-p.z,c=Math.cos(p.a),s=Math.sin(p.a);if(p.y>top&&Math.abs(c*dx-s*dz)<p.w/2&&Math.abs(s*dx+c*dz)<p.d/2){top=p.y;kind=p.kind;}}
        counts[kind]++;const q=quadrants[(x>=0?1:0)+(z>=0?2:0)];q.total++;if(kind==='wood')q.wood++;
      }
      const sum=Object.values(counts).reduce((a,b)=>a+b,0);
      r.player.pos.copy(t.spawn);r.camTarget.copy(r.player.pos);for(let i=0;i<90;i++)r.renderWorld(1/30);vfxDraw(false);
      return {stage:r.stage,lighting:t.workshopLighting,ratios:Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,v/sum])),quadrantWood:quadrants.map(q=>q.wood/q.total),clear:!t.hitProp(t.spawn.x,.3,t.spawn.z,.6),props:t.zxProps.length,colliders:t.colliders.length,propsSolid:t.zxProps.every(p=>t.hitProp(p.x,.3,p.z,.3))};
    });
    assert.equal(state.stage,stage);assert.equal(state.lighting,'daylight');assert.ok(state.clear&&state.propsSolid);assert.ok(state.colliders>=state.props,'Arena regions may add their own colliders');
    assert.ok(state.ratios.wood>.15&&state.ratios.wood<.4&&state.ratios.paper>.15&&state.ratios.cloth>.2);
    assert.ok(state.quadrantWood.every(v=>v<.45),'Cool surfaces must reach every quadrant, not just spawn');
    report.stages.push(state);await shot('stage-'+stage);
  }
  fs.writeFileSync(path.join(dir,'desk-paint-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Daylight-only HUD, colored proximity lamps with monotonic pixel brightness and no stationary flicker, floor distribution in all four areas, three quality presets and phone layouts passed.');
}
