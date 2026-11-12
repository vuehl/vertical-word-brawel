import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export async function reviewFlatSurfaces(page,dir){
  const report={environment:'Compiled WeChat bundle in Chrome SwiftShader; original game camera. No phone performance claim.',uniformSurfaces:[],screens:[],stages:[]};
  await page.setViewport({width:320,height:690,deviceScaleFactor:2});
  await page.evaluate(async()=>{window.dispatchEvent(new Event('resize'));vfxSetup();app.run.enemies.clear();await Promise.all(app.run.terrain.paperAssets.photoJobs);});
  const shot=async name=>{await page.screenshot({path:path.join(dir,name+'.png')});report.screens.push(name);};

  // Render each real scene material on the actual desktop plane, under fixed
  // directional lighting without textures/occluders. A flat pigment must be
  // spatially uniform; the former sinusoidal lighting fails this pixel test.
  const keys=await page.evaluate(()=>[...app.run.terrain.paperAssets.mats.entries()].filter(([k,m])=>m.isMeshStandardMaterial&&(k.startsWith('bookcloth')||k.startsWith('spread-')||['maple-desktop','notebook-paper','teal-desk-pad','maple-joinery','paper-edges','gilt-storybook','workshop-plastic'].includes(k))).map(([k])=>k));
  for(const key of keys){
    await page.evaluate(({key})=>{
      const r=app.run,t=r.terrain;r.pushLook();r.player.pos.set(0,0,0);r.camTarget.copy(r.player.pos);vfxDraw(false);
      const floor=t.group.children.find(o=>o.material===t.paperAssets.mats.get('maple-desktop'));
      const mat=t.paperAssets.mats.get(key),states=[];
      app.r.scene.traverse(o=>{if(o.isMesh&&o!==floor){states.push([o,o.visible]);o.visible=false;}});
      const original={map:mat.map,material:floor.material,receive:floor.receiveShadow,lights:t.workshopPointLights.map(l=>l.intensity)};
      floor.visible=true;floor.material=mat;floor.receiveShadow=false;mat.map=null;mat.needsUpdate=true;t.workshopPointLights.forEach(l=>l.intensity=0);
      window.restoreSurface=()=>{mat.map=original.map;mat.needsUpdate=true;floor.material=original.material;floor.receiveShadow=original.receive;states.forEach(([o,v])=>o.visible=v);t.workshopPointLights.forEach((l,i)=>l.intensity=original.lights[i]);};
      app.r.renderer.resetState();app.r.render(0);
    },{key});
    const frame=await page.screenshot();
    await page.evaluate(()=>{restoreSurface();delete window.restoreSurface;});
    const stats=await sharp(await sharp(frame).extract({left:170,top:370,width:300,height:500}).removeAlpha().toBuffer()).stats();
    const range=stats.channels.map(c=>c.max-c.min),stdev=stats.channels.map(c=>c.stdev);
    report.uniformSurfaces.push({key,range,stdev});
    assert.ok(range.every(n=>n<=2),`${key} has unintended surface modulation: ${range}`);
  }
  report.paper=await page.evaluate(()=>{
    const image=app.run.terrain.paperAssets.photos.get('paper').texture.image,data=image.getContext('2d').getImageData(0,0,image.width,image.height).data;
    let different=0;for(let i=4;i<data.length;i+=4)if(data[i]!==data[0]||data[i+1]!==data[1]||data[i+2]!==data[2])different++;
    return {different,width:image.width,height:image.height};
  });assert.equal(report.paper.different,0,'Paper base must not introduce a second set of lines');
  for(const quality of ['low','medium','high']){
    await page.evaluate(quality=>{app.meta.profile.settings.quality=quality;app.applySettings();app.run.pushLook();},quality);
    for(const [name,x,z] of [['paper',0,10],['wood',24,9],['cloth-books',-10,-8]]){
      await page.evaluate(([x,z])=>{const r=app.run;r.player.pos.set(x,0,z);r.camTarget.copy(r.player.pos);vfxDraw(false);},[x,z]);await shot(`${quality}-${name}`);
    }
  }
  await page.evaluate(()=>{app.meta.profile.settings.quality='high';app.applySettings();app.run.pushLook();});
  for(let stage=1;stage<=4;stage++){
    if(stage>1)await page.evaluate(async()=>{app.run.state='play';await app.run.changeZone();app.halted=true;});
    const state=await page.evaluate(()=>{
      const r=app.run,t=r.terrain;r.player.pos.copy(t.spawn);r.camTarget.copy(r.player.pos);vfxDraw(false);
      const mats=[...t.paperAssets.mats.values()].filter(m=>m.isMeshStandardMaterial);
      return {stage:r.stage,materials:mats.length,flat:mats.every(m=>!m.bumpMap&&!m.normalMap&&!m.displacementMap),camera:[r.camDist,app.r.camera.fov,r.camPitch]};
    });assert.ok(state.flat);assert.equal(state.stage,stage);assert.deepEqual(state.camera,[42,37,Math.PI*.3]);report.stages.push(state);await shot('stage-'+stage);
  }
  fs.writeFileSync(path.join(dir,'flat-surfaces-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`Flat surfaces: ${report.uniformSurfaces.length} uniform pixel checks, clean paper, three presets, daylight and all four areas passed.`);
}
