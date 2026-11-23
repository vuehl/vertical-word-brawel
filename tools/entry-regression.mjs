import assert from 'node:assert/strict';
import path from 'node:path';
import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
import {entryLayout} from '../source/src/entry-layout.js';

export async function verifyEntry({page,tap,dir}){
  const screen=name=>page.waitForFunction(name=>app.screen?.dataset.page===name,{},name);
  const capture=name=>page.screenshot({path:path.join(dir,name+'.png')});
  const hit=async(x,y)=>{
    const {scale,x:left,y:top}=entryLayout(await page.evaluate(()=>({...inspected.env.entryViewport()})));
    await page.evaluate((x,y)=>window.tap(x,y),left+x*scale,top+y*scale);
  };
  await screen('home');
  await page.waitForFunction(()=>GameGlobal.pokebonk.bootDiagnostics.completed);
  await page.evaluate(()=>{window.entryWorld=app.menuScene.terrain;window.entrySprites=app.menuScene.sprites;});
  const fireHeight=await page.evaluate(()=>{
    const batch=[...entrySprites.glyphGroups.values()].find(g=>g.mesh.visible);
    return batch.aSize.array[1];
  });
  const {bootSize,idleSize}=await page.evaluate(async()=>{
    const {image,idle}=await GameGlobal.pokebonk.entryScene.heroArt();
    return {bootSize:idle.worldSize,idleSize:[image.width,image.height]};
  });
  assert.ok(Math.abs(fireHeight-2*bootSize)<.00001,'Cold loading and live menu must use the same two-times hero registration');
  await capture('01-home');
  assert.deepEqual(await page.evaluate(()=>[...app.screen.querySelectorAll('button')].map(b=>b.textContent)),['开始旅程','多人联机','研究所']);
  const initial=await page.screenshot();
  const crop=async image=>sharp(image).extract({left:106,top:210,width:139,height:164}).raw().toBuffer();
  const before=await crop(initial);
  let animated=false;
  for(let i=0;i<6&&!animated;i++){
    await new Promise(r=>setTimeout(r,62));
    animated=!before.equals(await crop(await page.screenshot()));
  }
  assert.ok(animated,'The idle atlas must change the visible hero while the menu stands still');
  await hit(190,650);await screen('map');await capture('02-stages');
  const selected=()=>page.evaluate(()=>Number(app.screen.dataset.tier));
  assert.equal(await selected(),0);
  await hit(240,623);assert.equal(await selected(),0,'A locked tier cannot be started');
  await hit(149,623);assert.equal(await selected(),1);
  await hit(63,743);await screen('home');
  await hit(105,722);await screen('coop');await tap('.zx-footer button','返回首页');
  await hit(276,722);await screen('lab');await tap('.zx-footer button','返回');
  for(const [width,height] of [[320,568],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:1});
    await page.evaluate(()=>{window.phoneLayout=true;window.dispatchEvent(new Event('resize'));});
    await page.waitForFunction(w=>inspected.env.entryViewport().width===w,{},width);
    await hit(190,650);await screen('map');await capture('02-stages-'+width);
    await hit(63,743);await screen('home');
  }
  await page.setViewport({width:382,height:826,deviceScaleFactor:1});
  await page.evaluate(()=>{window.phoneLayout=false;window.dispatchEvent(new Event('resize'));});
  await hit(190,650);await screen('map');
  await page.evaluate(()=>{
    const menu=app.menuScene,draw=menu.drawEntry.bind(menu),overlay=GameGlobal.pokebonk.entryScene;
    const page=overlay.page.bind(overlay),audit=window.departureAudit={frames:[],overlays:[]};
    overlay.page=(...args)=>{
      const result=page(...args);
      if(app.screen?.dataset.entryPage==='departure'){
        audit.overlays.push(args[3]);
        if(!audit.image&&args[3]>0&&args[3]<100)audit.image=GameGlobal.pokebonk.canvas.toDataURL();
      }
      return result;
    };
    menu.drawEntry=()=>{
      const result=draw();
      if(menu.departure){
        const progress=menu.departure.progress;
        audit.frames.push({progress,distance:menu.camDist,buttons:app.screen.querySelectorAll('button').length,
          time:app.run?.time||0,stageTime:app.run?.stageTime||0,state:app.run?.state});
      }
      return result;
    };
    const set=app.setScreen.bind(app);
    app.setScreen=(next,...args)=>{
      if(!next&&app.screen?.dataset.entryPage==='departure'){
        const camera=app.r.camera,position=camera.position.clone(),projection=camera.projectionMatrix.clone();
        app.run.updateCamera(0);
        const bounds=app.run.terrain.deskBounds,ppu=5142/(2*bounds.x);
        audit.finished={sameTerrain:entryWorld===app.run.terrain,sameSprites:entrySprites===app.run.sprites,
          samePosition:position.equals(camera.position),sameProjection:projection.equals(camera.projectionMatrix),
          width:2*ppu/projection.elements[0],height:2*ppu/projection.elements[5],
          distance:app.run.camDist,time:app.run.time,stageTime:app.run.stageTime};
      }
      return set(next,...args);
    };
  });
  await hit(211,746);
  await page.waitForFunction(()=>app.run?.terrain?.desk2d&&app.run.state==='play',{timeout:35000});
  assert.equal(await page.evaluate(()=>app.lastCfg.mode),'standard');
  assert.equal(await page.evaluate(()=>app.lastCfg.species),4);
  const audit=await page.evaluate(()=>departureAudit);
  assert.ok(audit.overlays.includes(0)&&audit.overlays.includes(100));
  assert.ok(audit.overlays.some(value=>value>0&&value<100));
  assert.ok(audit.overlays.every((v,i,a)=>!i||v>=a[i-1]));
  assert.ok(audit.frames.length>=3&&audit.image,'An intermediate live-camera frame was presented');
  for(const [i,f] of audit.frames.entries()){
    assert.ok(!f.buttons&&!f.time&&!f.stageTime&&f.state!=='play','No controls or simulation during departure');
    if(i)assert.ok(f.distance>=audit.frames[i-1].distance);
  }
  assert.ok(audit.frames[0].distance<32&&audit.frames.at(-1).distance===42);
  const {width,height,distance,...handoff}=audit.finished;
  assert.deepEqual(handoff,{sameTerrain:true,sameSprites:true,samePosition:true,sameProjection:true,time:0,stageTime:0});
  assert.ok(Math.abs(width-1165)<2&&Math.abs(height-2520)<2,'First combat frame covers the reference map area: '+[width,height]);
  assert.ok(Math.abs(distance-81.63)<.1,'Use the wider combat camera after the cinematic endpoint');
  const frame=Buffer.from(audit.image.split(',')[1],'base64');
  await writeFile(path.join(dir,'03-camera-departure.png'),frame);
  const pixels=await sharp(frame).removeAlpha().raw().toBuffer();
  let barPixels=0;
  for(let i=0;i<pixels.length;i+=3)if(pixels[i]===53&&pixels[i+1]===134&&pixels[i+2]===185)barPixels++;
  assert.ok(barPixels>20,'The blue progress fill must be visible in the live departure frame');
  await capture('04-entry-play');
  const corners=await page.evaluate(()=>{
    const r=app.run,b=r.terrain.deskBounds,c=r.r.camera,target=r.camTarget.clone();
    const point=(x,y)=>target.clone().set((2*x/5142-1)*b.x,-.05,(2*y/2892-1)*b.z);
    try{
      // Compare the art at the same player location as the supplied reference.
      r.camTarget.copy(point(1982,1379));r.updateCamera(0);c.updateMatrixWorld();
      return [[1453,30],[2618,2549]].map(([x,y])=>{
        const ndc=point(x,y).project(c);
        return [(ndc.x+1)/2,(1-ndc.y)/2];
      });
    }finally{r.camTarget.copy(target);r.updateCamera(0);c.updateMatrixWorld();}
  });
  assert.ok(corners.every((point,i)=>point.every(value=>Math.abs(value-i)<.003)),
    'The play camera frames the same map landmarks as the reference: '+JSON.stringify(corners));
  const loads=await page.evaluate(([w,h])=>nativeImageLoads.filter(i=>i.width===w&&i.height===h).length,idleSize);
  await page.evaluate(()=>app.toMenu());await screen('home');
  await page.waitForFunction((n,[w,h])=>nativeImageLoads.filter(i=>i.width===w&&i.height===h).length>n,{},loads,idleSize);
  const paths=await page.evaluate(()=>nativeImageLoads.filter(i=>i.width>0).map(i=>i.path));
  assert.ok(paths.every(p=>!p.startsWith('entry/')));
  if(process.argv.includes('--entry-file-fallback')){
    for(const name of ['overview.jpg','spawn.jpg','idle.png','home.png','stages.png','ribbon.png']){
      assert.ok(paths.includes('/userdata/zixing-entry-'+name),'Local file recovery '+name);
    }
  }
  await hit(190,650);await screen('map');
  console.log('Entry UI, idle animation, touch targets, co-op/lab and return verified. Sampled '+audit.frames.length+
    ' HUD-free departure frames, then switched to a '+width.toFixed(1)+' x '+height.toFixed(1)+' map-pixel combat view.');
}
