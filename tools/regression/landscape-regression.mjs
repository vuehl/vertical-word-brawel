import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import {deskPlayFrame} from '../../source/src/world/desk-framing.js';

async function measureCombatCamera(page){
  const view=await page.evaluate(()=>{
    const run=app.run,camera=run.r.camera;
    run.updateCamera(0);
    const focus=run.camTarget.clone();
    focus.y+=.5;
    const projection=camera.projectionMatrix.elements;
    return {aspect:camera.aspect,bounds:run.terrain.deskBounds,orthographic:projection[15]===1,
      w:1/projection[0],h:1/projection[5],distance:camera.position.distanceTo(focus)};
  });
  const reference=deskPlayFrame(view.aspect,view.bounds.x,view.bounds.z);
  const scale=view.distance/reference.distance;
  assert.ok(view.orthographic && scale>=.60 && scale<=.70,JSON.stringify(view));
  assert.ok(Math.abs(view.w/reference.w-scale)<1e-6 && Math.abs(view.h/reference.h-scale)<1e-6,
    'The orthographic view must shrink in proportion to the camera distance');
  return view;
}

export async function reviewLandscape(page,dir){
  await page.waitForFunction(()=>window.__host?.bootDiagnostics.completed&&!app.starting);
  const boot=await page.evaluate(()=>({state:app.run?.state,species:app.run?.player.speciesId,
    mode:app.run?.mode,error:app.zixing.entryDiagnostics?.error,film:typeof inspected.env.playJourneyOpening,
    movieReads:openingRequests.length}));
  assert.equal(boot.state,'play',JSON.stringify(boot));assert.equal(boot.species,4);
  assert.equal(boot.mode,'single-stage');assert.equal(boot.movieReads,0);assert.equal(boot.film,'undefined');
  async function draw(name){
    await page.waitForFunction(()=>!app.screen?._journeyFade&&!app.screen?._journeyCamera);
    await page.evaluate(()=>{app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);});
    await page.screenshot({path:path.join(dir,name+'.png')});
  }
  async function tap(selector){
    await page.evaluate(selector=>{
      inspected.layout.refresh();
      const node=inspected.doc.querySelector(selector),rect=node?.getBoundingClientRect();
      if(!rect?.width || !rect?.height)throw Error('Missing target '+selector);
      const v=inspected.env.entryViewport(),x=v.x+rect.x+rect.width/2,y=v.y+rect.y+rect.height/2;
      if(x<v.x||x>v.x+v.w||y<v.y||y>v.y+v.h)throw Error(selector+' outside safe area '+JSON.stringify(rect));
      const f={identifier:9,clientX:x,clientY:y};
      inspected.touches('down',{touches:[f],changedTouches:[f],timeStamp:performance.now()});
      inspected.touches('up',{touches:[],changedTouches:[f],timeStamp:performance.now()+20});
    },selector);
  }
  const movement=await page.evaluate(()=>{
    const r=app.run,t=r.ui.touch,v=inspected.env.entryViewport(),p=r.player.pos.clone();
    app.halted=true;r.godMode=true;r.state='play';r.renderAlpha=1;
    r.ui.hud(r);inspected.env.drawUI(app.r.renderer);
    const f={identifier:2,clientX:v.x+v.w*.23,clientY:v.y+v.h*.78};
    function send(kind,held){inspected.touches(kind,{touches:held?[f]:[],changedTouches:[f],timeStamp:performance.now()});}
    send('down',true);f.clientX+=46;send('move',true);
    for(let i=0;i<12;i++){
      r.walkBudget=t.stickCfg.maxFrameDistance;t.driveStick(r.input,1/30,performance.now()+i*34);r.stepPlayer(r.player,1/30);
    }
    send('up',false);
    return {distance:p.distanceTo(r.player.pos),released:t.stickId<0};
  });
  assert.ok(movement.distance>.1&&movement.released,JSON.stringify(movement));
  const models=await page.evaluate(()=>{
    const r=app.run,p=r.player.pos,s=r.sprites,en=r.enemies;
    const words=['冰','弹','魁','龘'];
    const hp=[];
    for(const [i,word] of words.entries()){
      const id=en.spawn(i===3?149:19,p.x+(i-1.5)*3,p.z-3-(i%2)*2,100,1,0);
      en.glyphWords[id]=word;en.hp[id]=en.maxHp[id]*(i===1?.5:1);
      hp.push({word,id});
    }
    r.updateCamera(1);r.renderWorld(0);r.ui.hud(r);
    return hp.map(({word,id})=>{
      const b=s.get(en.species[id],false,word),g=b.zxGroup,geo=g.geometry;
      geo.computeBoundingBox();
      return {word,bones:b.zxModel.rig.skeleton.bones.length,visible:g.aPose.array[1],drawn:g.mesh.count,
        triangles:geo.index.count/3,depth:geo.boundingBox.max.z-geo.boundingBox.min.z};
    });
  });
  assert.ok(models.every(m=>m.drawn>0&&m.triangles>12&&m.depth),JSON.stringify(models));
  assert.equal(models[1].visible,Math.ceil(models[1].bones/2));assert.equal(models[3].bones,48);
  const cameras=[await measureCombatCamera(page)];
  await draw('战斗-844x390');
  await tap('.zx-hud-pause');await page.waitForFunction(()=>!!inspected.doc.querySelector('[data-action="pause-resume"]'));
  await draw('暂停');await tap('[data-action="pause-resume"]');
  await page.waitForFunction(()=>app.run.state==='play');
  await page.evaluate(()=>{
    const r=app.run;app.halted=false;r.player.level=3;r.pendingLevels=1;r.doLevelUp();
  });
  await page.waitForFunction(()=>inspected.doc.querySelectorAll('[data-offer]').length===3&&!inspected.modalTransition.active);
  const cards=await page.evaluate(()=>[...inspected.doc.querySelectorAll('[data-offer]')].map(el=>{
    const box=el.getBoundingClientRect();return {x:box.x,y:box.y,w:box.width,h:box.height};
  }));
  assert.ok(cards.every((card,i)=>card.w>40&&card.h>=44&&(!i||card.x>=cards[i-1].x+cards[i-1].w-1)),JSON.stringify(cards));
  await draw('升级选项');await tap('[data-offer="0"]');await page.waitForFunction(()=>app.run.state==='play');
  await page.evaluate(()=>{app.toMenu();app.halted=false;});
  await page.waitForFunction(()=>app.screen?.dataset.page==='home');
  await draw('首页');
  await tap('[data-action="settings"]');await page.waitForFunction(()=>app.screen?.dataset.page==='settings');
  await draw('设置');await tap('.zx-settings .paper-back');
  await page.waitForFunction(()=>app.screen?.dataset.page==='home');
  await tap('[data-action="lab"]');await page.waitForFunction(()=>app.screen?.dataset.page==='lab');
  await tap('[data-action="dust-help"]');await tap('[data-action="dust-close"]');
  await draw('研究所');await tap('.zx-lab .paper-back');
  await tap('[data-action="multiplayer"]');await page.waitForFunction(()=>app.screen?.dataset.page==='coop');
  await draw('双人大厅');await tap('.zx-coop .paper-back');
  await tap('[data-action="help"]');await tap('[data-action="guide-close"]');
  await tap('[data-action="journey"]');
  await page.waitForFunction(()=>!!app.screen?.querySelector('[data-action="collection-next"]'));
  await draw('选择字灵');
  await tap('[data-action="collection-next"]');await page.waitForFunction(()=>app.screen?.dataset.page==='map');
  await draw('选择关卡');
  for(const [width,height] of [[667,375],[1280,720]]){
    await page.setViewport({width,height,deviceScaleFactor:1});
    await page.waitForFunction(width=>inspected.env.entryViewport().width===width,{},width);
    await draw('关卡-'+width+'x'+height);
  }
  await tap('[data-action="enter"]');await page.waitForFunction(()=>app.run?.state==='play'&&!app.starting,{timeout:75000});
  cameras.push(await measureCombatCamera(page));
  await draw('战斗-1280x720');
  const report={boot,movement,models,cards,cameras,sizes:[[844,390],[667,375],[1280,720]]};
  fs.writeFileSync(path.join(dir,'横屏验收.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
}
