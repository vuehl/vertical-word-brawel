import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {EVOLUTION_DURATION,evolutionFrameTimes} from '../../source/src/effects/evolution-timing.js';

export async function reviewUpgradeEffects(page,dir){
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  const report={environment:'Compiled WeChat bundle / Chrome SwiftShader',forms:[],evolutions:[]};
  await page.evaluate(()=>{
    const r=app.run;r.director.update=()=>{};r.capture.update=()=>{};r.enemies.clear();r.godMode=true;
    r.ui.experienceReady=()=>true;r.hints.show=()=>{};r.player.moves.forEach(m=>{if(m)m.timer=999;});
    const t=r.terrain;
    for(let z=-15;z<=15;z+=3)for(let x=-15;x<=15;x+=3){
      if(t.inBounds(x,z,4)&&t.isFlatOpen(x,z)&&!t.hitProp(x,t.surface(x,z)+.5,z,3)){
        r.player.pos.set(x,t.surface(x,z),z);r.camTarget.copy(r.player.pos);return;
      }
    }
    throw Error('No clear upgrade location');
  });
  const draw=async name=>{
    await page.evaluate(()=>{
      const r=app.run;
      inspected.doc.querySelectorAll('.zx-intro').forEach(n=>n.remove());
      r.updateCamera(1/60);r.renderWorld(0);r.ui.hud(r);app.r.render(0);inspected.env.drawUI(app.r.renderer);
      // Give projected HUD elements the card and button bounds from the first layout.
      r.ui.hud(r);app.r.render(0);inspected.env.drawUI(app.r.renderer);
    });
    await page.screenshot({path:path.join(dir,name+'.png')});
  };
  for(const species of [4,5,6,16,17,18,58,59]){
    const result=await page.evaluate(async species=>{
      const r=app.run,p=r.player;r.ui.hideModal();r.ui.endCinematic();r.state='play';r.anims.length=0;
      r.vfx.clear();r.nextEvo=null;r.pendingLevels=1;r.evoHold=0;r.ult.castPending=false;p.setSpecies(species);p.renderScale=1;p.flash=0;p.iframes=0;
      await r.sprites.prepareHeroForm(species);
      p.moves.forEach(m=>{if(m)m.timer=999;});
      const show=r.ui.showLevelUp;let offered,choose;
      r.ui.showLevelUp=(run,offers,callback)=>{offered=offers;choose=callback;};
      try{r.doLevelUp();if(!choose)throw Error('Upgrade choices not shown');choose(offered[0]);}finally{r.ui.showLevelUp=show;}
      const fx=r.vfx.upgrade;
      if(fx.events.length!==0||fx.mesh.visible||fx.rearMesh.visible||fx.light.mesh.visible||fx.screen.mesh.visible)throw Error('Ordinary upgrade must not create an evolution effect');
      for(let i=0;i<20;i++)r.update(1/60);
      return {species,word:r.sprites.get(species).zxGlyph,state:r.state,pending:r.pendingLevels,count:fx.mesh.count,
        events:fx.events.length,visible:fx.mesh.visible||fx.rearMesh.visible,programs:app.r.renderer.info.programs.length};
    },species);
    assert.equal(result.state,'play');assert.equal(result.pending,0);assert.equal(result.count,0);assert.equal(result.events,0);assert.equal(result.visible,false);
    await draw('upgrade-'+species);
    report.forms.push(result);console.log('Upgrade without orbit',result.word);
  }
  for(const [from,to] of [[4,5],[5,6],[16,17],[17,18],[16,58],[58,59]]){
    const [width,height]=to===58?[320,568]:to===6?[430,932]:[390,844];
    await page.setViewport({width,height,deviceScaleFactor:1});
    await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
    await page.waitForFunction(({width,height})=>Math.abs(app.run.r.camera.aspect-width/height)<1e-6&&innerWidth===width&&innerHeight===height,{}, {width,height});
    const start=await page.evaluate(async({from,to})=>{
      const r=app.run,p=r.player;r.state='play';r.pendingLevels=0;r.anims.length=0;r.vfx.clear();p.setSpecies(from);p.renderScale=1;p.iframes=0;p.flash=0;
      await r.sprites.prepareHeroForm(from);await r.sprites.prepareHeroForm(to);
      p.moves.forEach(m=>{if(m)m.timer=999;});
      r.nextEvo={to,level:p.level};const before=r.stats.evolutions,oldHp=Math.round(p.maxHp);
      r.startEvolution();
      [...r.ui.modalEl.querySelectorAll('button')].find(b=>b.textContent.includes('确认进阶')).click();
      const {reveal,duration}=r.vfx.upgrade.events[0],steps=Math.ceil(reveal*.5*30);
      const frames=[],get=r.sprites.getPlayerGlyph,clock=r.time,position=p.pos.clone();
      const speed=p.speedNow,hurt=p.hurtT;p.speedNow=4;p.hurtT=.2;
      r.sprites.getPlayerGlyph=(...args)=>{
        const frame=args[3];frames.push({action:frame?.action,index:frame?.index,species:frame?.species});
        return get(...args);
      };
      try{for(let i=0;i<steps;i++)r.update(reveal*.5/steps);}
      finally{r.sprites.getPlayerGlyph=get;p.speedNow=speed;p.hurtT=hurt;}
      const camera=r.r.camera,rig=r.vfx.upgrade.camera,point=p.pos.clone();point.y+=.08;
      const view=point.clone().applyMatrix4(camera.matrixWorldInverse),projection=camera.projectionMatrix.elements;
      const clipW=projection[3]*view.x+projection[7]*view.y+projection[11]*view.z+projection[15];
      const focus=p.pos.clone().setY(p.pos.y+.5).project(camera);
      const framing={x:(focus.x+1)*.5*innerWidth,y:(1-focus.y)*.5*innerHeight,
        inkPixels:rig.inkHeight*projection[5]/clipW*.5*innerHeight};
      return {from,to,before,oldHp,reveal,duration,state:r.state,species:p.speciesId,count:r.vfx.upgrade.mesh.count,
        front:r.vfx.upgrade.mesh.visible,rear:r.vfx.upgrade.rearMesh.visible,
        lightFrame:r.vfx.upgrade.screen.mesh.visible?r.vfx.upgrade.screen.uniforms.frame.value:-1,
        fullScreen:r.vfx.upgrade.screen.loaded&&!r.vfx.upgrade.light.mesh.visible,
        overlay:!!r.ui.root.querySelector('.zx-evolution-stamp,.zx-evolution-cutin,.zx-evolution-result'),
        frames,framing,worldPaused:r.time===clock,stationary:p.pos.equals(position)};
    },{from,to});
    assert.equal(start.state,'evolving');assert.equal(start.species,from);assert.equal(start.count,0);assert.ok(!start.front&&!start.rear);assert.equal(start.overlay,false);
    assert.equal(start.lightFrame,55,'Golden spiral is loaded and playing on the original form');
    assert.ok(Math.abs(start.duration-4.2)<1e-8,'Evolution finishes two seconds sooner');
    assert.ok(Math.abs(start.reveal/start.duration-4.4/6.2)<1e-8,'Keep the original GIF charge/release ratio');
    assert.ok(start.fullScreen,'The supplied full-screen atlas replaces the cropped light');
    const cover=Math.max(width/390,height/844);
    assert.ok(Math.abs(start.framing.x-width/2)<.1,'Center the evolution camera on the character');
    assert.ok(Math.abs(start.framing.y-height/2)<.1,'Keep the gameplay camera center during evolution: '+JSON.stringify({width,height,framing:start.framing}));
    assert.ok(Math.abs(start.framing.inkPixels-80*cover)<.1,'Match the reference character size');
    await draw(`evolution-${from}-${to}-orbit`);
    assert.ok(start.worldPaused&&start.stationary,'Idle animation must not resume combat or movement');
    assert.ok(start.frames.length>1&&start.frames.every(f=>f.action==='idle'&&f.species===from));
    assert.ok(new Set(start.frames.map(f=>f.index)).size>1,'Original form idle frames must advance during evolution');
    const burst=await page.evaluate(reveal=>{
      const r=app.run,steps=Math.ceil(reveal*.5*30);for(let i=0;i<steps;i++)r.update(reveal*.5/steps);
      return r.vfx.upgrade.screen.sourceFrame;
    },start.reveal);
    assert.equal(burst,126,'The expanding ring coincides with the form change');
    if(from===4||to===58)await draw(`evolution-${from}-${to}-burst`);
    const landing=await page.evaluate(()=>{
      const r=app.run;for(let i=0;i<4;i++)r.update(1/30);
      return {species:r.player.speciesId,lift:r.player.evolutionLift,scale:r.player.renderScale,state:r.state,
        overlay:!!r.ui.root.querySelector('.zx-evolution-cutin,.zx-evolution-result')};
    });
    assert.equal(landing.species,to);assert.equal(landing.scale,1);assert.ok(landing.lift>0&&!landing.overlay,'Let the character finish its animation');
    assert.equal(landing.state,'evolving','Combat stays paused through the full-screen release');
    const stamped=await page.evaluate(dt=>{
      const r=app.run,root=r.ui.root,frames=new Set();
      let card,landedAt;
      for(let i=0;i<150;i++){
        r.update(dt);
        if(r.player.renderScale!==1||root.querySelector('.zx-evolution-cutin'))throw Error('Unexpected enlarged evolution glyph');
        card=root.querySelector('.zx-evolution-result');
        if(r.state==='evolving'){
          if(card)throw Error('Result appeared while the character was airborne');
          continue;
        }
        if(!card)throw Error('Missing result on the landing frame');
        if(!frames.size){
          landedAt=r.realTime;
          if(card.dataset.frame!=='0')throw Error('Expected the first painted result frame on landing');
          app.r.render(0);inspected.env.drawUI(app.r.renderer);
        }
        frames.add(card.dataset.frame);
        if(card.dataset.frame==='1')break;
      }
      const seal=root.querySelector('.zx-evolution-stamp');
      function inkCount(image){
        let count=0;
        for(let i=0;i<image.length;i+=4)if(image[i]===156&&image[i+1]===51&&image[i+2]===35)count++;
        return count;
      }
      const sealInk=inkCount(seal.getContext('2d').getImageData(0,0,seal.width,seal.height).data);
      const cardInk=inkCount(card.getContext('2d').getImageData(238*2,0,58*2,64*2).data);
      return {lift:r.player.evolutionLift,sealInk,cardInk,frames:frames.size,settleTime:r.realTime-landedAt,cards:root.querySelectorAll('.zx-evolution-result').length,
        healthHidden:root.querySelector('.zx-player-health').hidden};
    },from===16?1/60:1/30);
    assert.ok(stamped.settleTime<=.24,'Stamp should settle within the short entrance animation');
    assert.equal(stamped.lift,0);assert.equal(stamped.cards,1);assert.equal(stamped.cardInk,0);assert.ok(!stamped.healthHidden&&stamped.sealInk>100&&stamped.frames>1);
    await page.evaluate(()=>app.run.ui.toast('终极技已就绪！',null));
    await draw(`evolution-${from}-${to}-result`);
    const result=await page.evaluate(()=>{
      const r=app.run,slip=r.ui.root.querySelector('.zx-evolution-result');
      const bounds=slip.getBoundingClientRect(),toast=r.ui.toastsEl.getBoundingClientRect();
      const pause=r.ui.root.querySelector('.zx-hud-pause').getBoundingClientRect();
      const stamp=r.ui.root.querySelector('.zx-evolution-stamp').getBoundingClientRect(),button=r.ui.touch.ult.getBoundingClientRect();
      const hp=r.ui.root.querySelector('.zx-player-health').getBoundingClientRect();
      const separate=b=>stamp.left>=b.right||stamp.right<=b.left||stamp.top>=b.bottom||stamp.bottom<=b.top;
      return {label:slip.getAttribute('aria-label'),hp:Math.round(r.player.maxHp),width:bounds.width,
        stamp,button,card:bounds,placed:stamp.top>=bounds.bottom&&stamp.width>=100&&stamp.right<=inspected.env.innerWidth&&stamp.left>hp.x+hp.width/2&&separate(button)&&separate(hp),
        stacked:toast.top>=bounds.bottom-1,clearOfPause:bounds.right<=pause.left||bounds.top>=pause.bottom,
        legacy:!!r.ui.root.querySelector('.evo-reveal,.zx-evolution-cutin,.zx-evolution-stage')};
    });
    assert.ok(result.label.endsWith('最大生命 '+start.oldHp+' → '+result.hp));
    assert.ok(result.label.startsWith('进阶完成，'));
    assert.ok(result.width>190&&result.stacked&&result.clearOfPause&&result.placed&&!result.legacy,JSON.stringify(result));
    const end=await page.evaluate(()=>{
      const r=app.run;for(let i=0;i<78;i++)r.update(1/30);
      return {species:r.player.speciesId,state:r.state,evolutions:r.stats.evolutions,scale:r.player.renderScale,
        expired:!r.ui.root.querySelector('.zx-evolution-stamp,.zx-evolution-result'),screenCleared:!r.vfx.upgrade.screen.mesh.visible,
        gl:app.r.renderer.getContext().getError()};
    });
    assert.equal(end.species,to);assert.equal(end.state,'play');assert.equal(end.evolutions,start.before+1);assert.equal(end.scale,1);assert.ok(end.expired);assert.equal(end.gl,0);
    assert.ok(end.screenCleared);
    report.evolutions.push({...start,end});console.log('Shared evolution',from,to);
  }
  report.settings=await page.evaluate(()=>{
    const r=app.run,fx=r.vfx.upgrade;
    fx.play(r.player,true);fx.play(r.player,true);const coalesced=fx.events.length===1;
    r.hideOwnFx=true;fx.update(.1);fx.play(r.player,true);const hidden=fx.events.length===0&&!fx.mesh.visible&&!fx.light.mesh.visible&&!fx.screen.mesh.visible;
    r.hideOwnFx=false;r.vfx.calm=true;r.vfx.ownFade=.4;r.vfx.fade=.5;fx.play(r.player,true);fx.update(.2);
    const calm=fx.mesh.material.uniforms.calm.value,opacity=fx.screen.uniforms.strength.value/.55;
    fx.update(fx.events[0].reveal-.2);const calmBurst=fx.screen.uniforms.strength.value;
    r.vfx.clear();const cleared=fx.events.length===0&&!fx.mesh.visible&&!fx.light.mesh.visible&&!fx.screen.mesh.visible;
    r.vfx.calm=false;r.vfx.ownFade=1;r.vfx.fade=1;
    // Ordinary upgrades must stay free of orbits in coop and chained choices.
    const coop=r.coop,show=r.ui.showLevelUp;r.coop={};r.nextEvo=null;r.state='play';r.pendingLevels=1;r.ui.showLevelUp=()=>{};
    try{r.doLevelUp();}finally{r.coop=coop;r.ui.showLevelUp=show;r.pendingLevels=0;r.state='play';}
    const cooperative=fx.events.length===0&&!fx.mesh.visible&&!fx.rearMesh.visible;r.vfx.clear();
    r.pendingLevels=3;let choices=0,earlyEffects=0;
    r.ui.showLevelUp=(run,offers,choose)=>{choices++;earlyEffects+=fx.events.length;choose(offers[0]);};
    try{r.doLevelUp();}finally{r.ui.showLevelUp=show;}
    const chained=choices===3&&earlyEffects===0&&fx.events.length===0&&r.pendingLevels===0;r.vfx.clear();
    return {coalesced,hidden,calm,opacity,calmBurst,cleared,cooperative,chained};
  });
  assert.ok(report.settings.coalesced&&report.settings.hidden&&report.settings.cleared&&report.settings.cooperative&&report.settings.chained);
  assert.equal(report.settings.calm,1);assert.ok(Math.abs(report.settings.opacity-.14)<1e-6);
  assert.ok(Math.abs(report.settings.calmBurst-.14*.18)<1e-6);
  report.lowFps=await page.evaluate(duration=>{
    const r=app.run,p=r.player,fx=r.vfx.upgrade;r.state='play';r.anims.length=0;r.ui.showEvolution();
    p.setSpecies(4);p.renderScale=1;p.evolutionLift=0;r.nextEvo={to:5,level:p.level};
    const count=r.stats.evolutions,clock=r.time;
    r.startEvolution();[...r.ui.modalEl.querySelectorAll('button')].find(b=>b.textContent.includes('确认进阶')).click();
    for(let i=0;i<Math.round(duration*10)-1;i++)r.update(.1);
    r.update(.0999);
    const paused=r.state==='evolving'&&r.time===clock;
    r.update(.0002);
    const complete=r.state==='play'&&p.speciesId===5&&p.evolutionLift===0&&p.flash===0&&r.stats.evolutions===count+1&&!fx.screen.mesh.visible;
    // A missing optional full-screen texture retains the already loaded local effect.
    const loaded=fx.screen.loaded;fx.screen.loaded=false;
    fx.play(p,true);fx.update(.9);
    const fallback=fx.light.mesh.visible&&!fx.screen.mesh.visible;
    fx.screen.loaded=loaded;fx.clear();
    return {paused,complete,fallback};
  },EVOLUTION_DURATION);
  assert.ok(report.lowFps.paused&&report.lowFps.complete&&report.lowFps.fallback);
  if(process.argv.includes('--evolution-preview')){
    const {default:sharp}=await import('sharp');
    await page.setViewport({width:390,height:844,deviceScaleFactor:1});
    await page.evaluate(()=>{
      const r=app.run,p=r.player;r.state='play';r.anims.length=0;r.vfx.clear();r.ui.showEvolution();
      r.ui.toastsEl.replaceChildren();p.setSpecies(4);p.renderScale=1;p.evolutionLift=0;p.flash=0;
      p.moves.forEach(m=>{if(m)m.timer=999;});r.nextEvo={to:5,level:p.level};
      r.startEvolution();[...r.ui.modalEl.querySelectorAll('button')].find(b=>b.textContent.includes('确认进阶')).click();
    });
    const frames=[],delays=[];
    // GIFs use centiseconds. Round the cumulative clock to prevent drift.
    const ticks=evolutionFrameTimes.map(t=>Math.round(t*100));
    for(let i=0;i<evolutionFrameTimes.length-1;i++){
      await page.evaluate(dt=>{
        const r=app.run;r.update(dt);app.r.render(0);inspected.env.drawUI(app.r.renderer);
      },i===0?0:evolutionFrameTimes[i]-evolutionFrameTimes[i-1]);
      const screenshot=await page.screenshot();
      if([0,20,60,120,123,126,136,170].includes(i))fs.writeFileSync(path.join(dir,'preview-'+i+'.png'),screenshot);
      frames.push(await sharp(screenshot).ensureAlpha().raw().toBuffer());
      delays.push((ticks[i+1]-ticks[i])*10);
    }
    const file='evolution-reference-timing.gif';
    await sharp(Buffer.concat(frames),{raw:{width:390,height:844*frames.length,channels:4,pageHeight:844}})
      .gif({delay:delays,loop:0,effort:4,dither:.5}).toFile(path.join(dir,file));
    const metadata=await sharp(path.join(dir,file),{animated:true}).metadata();
    assert.equal(metadata.delay.reduce((total,delay)=>total+delay,0),4200,'Preview must match the game clock');
    report.preview={file,duration:EVOLUTION_DURATION};console.log('Evolution preview:',file);
  }
  report.dispose=await page.evaluate(()=>{
    const r=app.run,fx=r.vfx.upgrade;fx.play();app.toMenu();
    return {disposed:fx.disposed&&fx.light.disposed&&fx.screen.disposed,
      detached:!fx.mesh.parent&&!fx.rearMesh.parent&&!fx.light.mesh.parent&&!fx.screen.mesh.parent&&!app.r.evolutionScreen,empty:fx.events.length===0};
  });
  assert.ok(report.dispose.disposed&&report.dispose.detached&&report.dispose.empty);
  fs.writeFileSync(path.join(dir,'upgrade-effects.json'),JSON.stringify(report,null,2));
}
