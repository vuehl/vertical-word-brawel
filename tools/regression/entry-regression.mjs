import assert from 'node:assert/strict';
import path from 'node:path';
import {writeFile} from 'node:fs/promises';

// Menu and co-op scenarios start after the solo introduction.
export async function prepareReturningPlayer(page){
  await page.evaluate(async()=>{
    await app.zixing.prepareProfile();
    app.meta.profile.firstJourneyPlayed=true;
    await app.meta.saveNow(true);
    if(app.screen?.dataset.page==='home')app.zixing.home();
  });
}

export async function verifyMapRefresh({page,tap}){
  // Hold the cloud read while navigating with the saved difficulty limits.
  await page.evaluate(()=>{
    const load=app.backend.loadProfile.bind(app.backend);
    const gate=new Promise(resolve=>{window.releaseMapRead=resolve;});
    window.mapReads=0;
    app.backend.loadProfile=async(...args)=>{
      mapReads++;
      await gate;
      const profile=await load(...args);
      profile.biomes.forest=1;
      app.backend.loadProfile=load;
      return profile;
    };
  });
  await tap('[data-action="collection-next"]');
  await page.waitForFunction(()=>app.screen.dataset.page==='map'&&mapReads===1,{timeout:5000});
  assert.ok(await page.evaluate(()=>app.screen.querySelector('[data-tier="1"]').disabled));
  await tap('[data-action="route-back"]');
  await tap('[data-action="collection-next"]');
  await page.waitForFunction(()=>app.screen.dataset.page==='map');
  await page.evaluate(()=>releaseMapRead());
  await page.waitForFunction(()=>!app.screen.querySelector('[data-tier="1"]').disabled);
  assert.equal(await page.evaluate(()=>mapReads),1);
}

export async function verifyEntry({page,tap,dir}){
  const screen=name=>page.waitForFunction(name=>app.screen?.dataset.page===name,{},name);
  const capture=name=>page.screenshot({path:path.join(dir,name+'.png')});
  const journey=()=>tap('[data-action="journey"]');
  await screen('home');
  await page.waitForFunction(()=>GameGlobal.pokebonk.bootDiagnostics.completed);
  await page.waitForFunction(()=>app.screen.querySelector('.journey-scene')?.dataset.word==='炎'&&
    nativeImageLoads.some(img=>img.width===560&&img.height===1212));
  assert.ok(await page.evaluate(()=>!app.run && !nativeImageLoads.some(img=>img.src?.includes('/env/forest'))),'The home artwork must be independent of the battle map');
  const homeActions=()=>page.evaluate(()=>[...app.screen.querySelectorAll('button')].map(b=>b.dataset.action));
  assert.deepEqual(await homeActions(),['settings','journey','help']);
  await capture('00-first-home');
  await page.evaluate(()=>{
    const env=inspected.env,prepare=env.prepareForest;
    env.prepareForest=()=>{env.prepareForest=prepare;throw Error('测试首次资源加载失败');};
  });
  await journey();await screen('entry-error');
  assert.ok(!await page.evaluate(()=>app.meta.profile.firstJourneyPlayed));
  await tap('.paper-back');await screen('home');
  assert.deepEqual(await homeActions(),['settings','journey','help']);
  await journey();
  await page.waitForFunction(()=>app.run?.state==='play'&&!app.screen,{timeout:90000});
  assert.deepEqual(await page.evaluate(()=>{
    const {species,biome,tier,mode}=app.lastCfg;return [species,biome,tier,mode,app.run.stage,!!app.run.coop];
  }),[4,'forest',0,'single-stage',1,false]);
  assert.equal(await page.evaluate(async()=>(await app.backend.loadProfile(app.meta.account)).firstJourneyPlayed),true);
  await tap('.zx-hud-pause');await tap('[data-action="pause-end"]');await tap('[data-action="end-confirm"]');
  await tap('[data-action="report-home"]');await screen('home');
  await capture('01-home');
  assert.deepEqual(await homeActions(),['settings','journey','multiplayer','lab','help']);
  assert.ok(await page.evaluate(()=>app.screen.querySelector('.zx-home-wordmark').offsetHeight>=70));
  // Some input adapters give window x/y at press and an empty touch list at release.
  await page.evaluate(()=>{
    const v=inspected.env.entryViewport(),box=app.screen.querySelector('[data-action="journey"]').getBoundingClientRect();
    const x=v.x+box.x+box.width/2,y=v.y+box.y+box.height/2;
    const touch={identifier:7,x,y};
    const press=()=>inspected.touches('down',{touches:[touch],changedTouches:[touch]});
    const finish=kind=>inspected.touches(kind,{touches:[],changedTouches:[]});
    press();finish('cancel');
    if(app.screen.dataset.page!=='home'||app.screen._journeyCamera)throw Error('Cancelled press started a journey');
    press();
    for(const dy of [-35,0]){
      const moved={...touch,y:y+dy};
      inspected.touches('move',{touches:[moved],changedTouches:[moved]});
    }
    finish('up');
    if(app.screen.dataset.page!=='home'||app.screen._journeyCamera)throw Error('Drag started a journey');
    const draw=inspected.env.drawUI,frames=[],frameGap=app.frameGap;
    const gl=app.r.renderer.getContext(),viewport=gl.viewport;
    let deskWidth=0;
    gl.viewport=(x,y,w,h)=>{deskWidth=Math.max(deskWidth,w);return viewport.call(gl,x,y,w,h);};
    if(window.productionFrameGap)app.frameGap=productionFrameGap;
    window.uiPerf={uploads:0,allocations:0};
    inspected.env.drawUI=(...args)=>{
      const camera=app.screen?._journeyCamera;
      deskWidth=0;
      draw(...args);
      if(camera)frames.push({ms:performance.now(),width:deskWidth,cy:camera.cy,uploads:uiPerf.uploads,page:app.screen.dataset.page});
      else if(app.screen?.dataset.page==='choose'){
        window.journeyFrames=frames;
        app.frameGap=frameGap;
        gl.viewport=viewport;
        inspected.env.drawUI=draw;
        delete window.uiPerf;
      }
    };
    press();finish('up');
    if(!app.screen._journeyCamera)throw Error('Journey tap did not start the camera');
    press();finish('up');
  });
  await page.waitForFunction(()=>window.journeyFrames);
  const frames=await page.evaluate(()=>journeyFrames.filter(f=>f.page==='home'));
  assert.ok(frames.length>=4&&frames.every((f,i)=>!i||f.width>=frames[i-1].width));
  assert.ok(frames.at(-1).width>frames[0].width*1.4&&frames.at(-1).cy<frames[0].cy*.6);
  assert.ok(frames.some((f,i)=>i&&f.width>frames[i-1].width&&f.uploads===frames[i-1].uploads),
    'The camera should advance using cached textures');
  console.log('Journey zoom:',frames.length,'frames,',frames.at(-1).uploads,'UI uploads, longest interval',
    Math.round(Math.max(...frames.slice(1).map((f,i)=>f.ms-frames[i].ms))),'ms');
  const chooseMap=async()=>{
    await screen('choose');
    assert.equal(await page.evaluate(()=>app.screen.querySelector('.journey-scene')?.dataset.shot),'choose');
    await capture('02-choose');await tap('[data-action="collection-next"]');await screen('map');
  };
  const backHome=async()=>{
    await tap('[data-action="route-back"]');await screen('choose');
    await tap('[data-action="collection-back"]');await screen('home');
  };
  await screen('choose');
  await tap('[data-filter="locked"]');
  const locked=await page.evaluate(()=>[...app.screen.querySelectorAll('.zc-character')].map(card=>card.getAttribute('aria-label')));
  assert.equal(locked.length,23);
  assert.ok(locked.every(label=>label.endsWith(' · 未解锁')&&!/[龘罐魁魇摹]/.test(label)));
  await capture('02-locked');
  await tap('.zc-character[data-species="86"]');await screen('collection-unlock');
  await tap('[data-action="collection-back"]');await tap('[data-filter="owned"]');
  assert.equal(await page.evaluate(()=>app.screen.querySelectorAll('.zc-character').length),2);
  await tap('[data-action="collection-moves"]');await screen('collection-moves');
  assert.deepEqual(await page.evaluate(()=>[...app.screen.querySelectorAll('[data-move-group]')].map(b=>b.dataset.moveGroup)),['kit','line','fusion']);
  await tap('[data-action="view-ultimate"]');
  assert.ok(await page.evaluate(()=>inspected.doc.querySelector('.zc-ultimate-dialog')?.textContent.includes('属性相性')));
  await tap('[data-action="move-close"]');
  await tap('[data-action="moves-back"]');await tap('[data-filter="all"]');
  await verifyMapRefresh({page,tap});
  await tap('[data-action="route-back"]');
  await chooseMap();await capture('02-stages');
  await page.waitForFunction(()=>app.screen.querySelector('[data-tier="1"]').disabled);
  const selected=()=>page.evaluate(()=>app.screen.querySelector('.zx-album-mode[aria-pressed="true"]').dataset.mode);
  assert.equal(await selected(),'single-stage');
  assert.ok(await page.evaluate(()=>app.screen.querySelector('[data-tier="1"]').disabled));
  await tap('.zx-album-mode[data-mode="standard"][data-tier="0"]');assert.equal(await selected(),'standard');
  assert.deepEqual(await page.evaluate(()=>[...app.screen.querySelectorAll('[data-tier="0"]')].map(b=>inspected.layout.box(b).s.background.toLowerCase())),['#dde5ef','#47698f']);
  await capture('02-standard');
  await backHome();
  for(const [action,name] of [['multiplayer','coop'],['lab','lab'],['settings','settings']]){
    await tap('[data-action="'+action+'"]');await screen(name);await capture('menu-'+name);await tap('.paper-back');await screen('home');
  }
  await tap('[data-action="help"]');await tap('[data-action="guide-close"]');await screen('home');
  for(const [width,height] of [[320,568],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:1});
    await page.evaluate(()=>{window.phoneLayout=true;window.dispatchEvent(new Event('resize'));});
    await page.waitForFunction(w=>inspected.env.entryViewport().width===w,{},width);
    await capture('01-home-'+width);await journey();await chooseMap();await capture('02-stages-'+width);
    await backHome();
  }
  await page.setViewport({width:382,height:826,deviceScaleFactor:1});
  await page.evaluate(()=>{window.phoneLayout=false;window.dispatchEvent(new Event('resize'));});
  await journey();await chooseMap();
  await page.evaluate(()=>{
    const drawUI=inspected.env.drawUI;
    const audit=window.departureAudit={progress:[]},background=app.screen.querySelector('.journey-scene');
    inspected.env.drawUI=(...args)=>{
      const result=drawUI(...args),entry=app.screen;
      if(entry?.classList.contains('journey-entry')){
        if(entry.querySelector('.journey-scene')!==background)throw Error('Entry discarded the selected journey backdrop');
        const ticket=entry.querySelector('.zx-entry-ticket'),value=Number(ticket.getAttribute('aria-valuenow'));
        audit.progress.push(value);
        if(!audit.image&&value>=40&&value<100){
          const box=inspected.layout.box(ticket);
          if(!box||box.w<240||box.h<44)throw Error('Loading slip is missing or too small');
          // Sample the visible fill and remaining track on the slip.
          const pixels=ticket.getContext('2d').getImageData(122,106,536,1).data;
          let filled=0;
          for(let i=0;i<pixels.length;i+=4)if(pixels[i]===80&&pixels[i+1]===118)filled++;
          if(Math.abs(filled-536*value/100)>1)throw Error('Loading bar disagrees with the percentage');
          audit.image=GameGlobal.pokebonk.canvas.toDataURL();
        }
        if(value===100){
          const canvas=inspected.uiCanvas;
          const pixel=canvas.getContext('2d').getImageData(2,2,1,1).data;
          if(pixel[3]!==255||pixel[0]>80)throw Error('Completed loading poster lost its opaque dark background');
        }
        if(app.run?.time>0)throw Error('Combat started during the menu transition');
      }else if(audit.progress.includes(100)){
        audit.firstMap={state:app.run?.state,time:app.run?.time,page:entry?.dataset.page??null,
          health:!!inspected.layout.box(app.run?.ui.root.querySelector('.zx-player-health'))?.w};
        inspected.env.drawUI=drawUI;
      }
      return result;
    };
  });
  await tap('[data-action="enter"]');
  await page.waitForFunction(()=>app.run?.terrain?.desk2d&&app.run.state==='play',{timeout:35000});
  assert.equal(await page.evaluate(()=>app.lastCfg.mode),'standard');
  assert.equal(await page.evaluate(()=>app.lastCfg.species),4);
  const audit=await page.evaluate(()=>departureAudit);
  assert.ok(audit.progress.includes(100)&&audit.progress.some(n=>n>0&&n<100));
  assert.deepEqual(audit.firstMap,{state:'play',time:0,page:null,health:true});
  assert.ok(audit.image);
  await writeFile(path.join(dir,'03-camera-departure.png'),Buffer.from(audit.image.split(',')[1],'base64'));
  assert.ok(await page.evaluate(()=>!!app.run.ui.root.querySelector('.zx-square-hud .zx-stage-caption')));
  await page.evaluate(()=>{
    const run=app.run;
    run.enemies.clear();
    run.godMode=true;
    run.player.items.clear();
    run.player.vitamins.clear();
    run.streak=7;run.streakT=3;
    run.player.items.set('revive',2);
    run.player.vitamins.set('protein',{level:1});
    run.player.vitamins.set('hp-up',{level:2});
  });
  await page.waitForFunction(()=>{
    const root=app.run.ui.root,combo=root.querySelector('.zx-combo>b');
    const cells=[...root.querySelectorAll('.vitamin-rail .zx-mini-slot,.zx-hud-supplies .zx-mini-slot')];
    if(combo?.textContent!=='×7'||!combo.offsetWidth||cells.length!==3)return false;
    const boxes=cells.map(c=>c.getBoundingClientRect());
    return boxes.every(b=>b.width===25&&b.height===25)&&boxes[1].x>=boxes[0].right&&boxes[2].y>boxes[1].y;
  });
  await capture('04-entry-play');
  await page.evaluate(()=>{app.run.streakT=.9;});
  await page.waitForFunction(()=>{
    const streak=app.run.ui.els.streak;
    const number=inspected.layout.box(streak.children[1].firstChild);
    const remaining=Number(streak.children[2].getAttribute('aria-valuenow'));
    return number?.opacity>0&&number.opacity<.7&&remaining>0&&remaining<=1;
  });
  await page.evaluate(()=>app.run.onKill());
  await page.waitForFunction(()=>{
    const streak=app.run.ui.els.streak;
    return streak.children[1].textContent==='×8'&&Number(streak.children[2].getAttribute('aria-valuenow'))>2.4;
  });
  await page.evaluate(()=>{app.run.streakT=1/60;});
  await page.waitForFunction(()=>!app.run.ui.els.streak.offsetWidth);
  const rainbow=await page.evaluate(()=>{
    const hud=app.run.ui;
    const addStop=CanvasGradient.prototype.addColorStop;
    // Exercise a mobile palette parser that accepts RGB colors but drops HSL stops.
    CanvasGradient.prototype.addColorStop=function(offset,color){
      return addStop.call(this,offset,/^hsla?\(/i.test(color)?'#ffffff':color);
    };
    try{
      hud.streakHud(99,3,2);
      hud.streakHud(100,3,2.5);
      hud.streakHud(101,3,3);
      const canvas=hud.els.streak.querySelector('canvas'),ctx=canvas.getContext('2d');
      function frame(time){
        // An almost empty bar isolates the ink in the digits and caption.
        hud.streakHud(101,.01,time);
        return ctx.getImageData(0,0,canvas.width,canvas.height).data;
      }
      const before=frame(4-1/60),next=frame(4),later=frame(5);
      const dominant=[0,0,0];
      let seamChange=0,moving=0;
      for(let i=0;i<next.length;i+=4){
        const r=next[i],g=next[i+1],b=next[i+2],max=Math.max(r,g,b);
        if(next[i+3]<240||max-Math.min(r,g,b)<100)continue;
        dominant[max===r?0:max===g?1:2]++;
        const delta=p=>Math.max(Math.abs(r-p[i]),Math.abs(g-p[i+1]),Math.abs(b-p[i+2]));
        seamChange=Math.max(seamChange,delta(before));
        if(delta(later)>50)moving++;
      }
      return {dominant,seamChange,moving};
    }finally{
      CanvasGradient.prototype.addColorStop=addStop;
      hud.streakHud(0,0,5);
    }
  });
  assert.ok(rainbow.dominant.every(pixels=>pixels>100)&&rainbow.moving>500&&rainbow.seamChange<24,
    'RGB ink must flow across the combo and wrap smoothly: '+JSON.stringify(rainbow));
  await page.evaluate(()=>{
    for(const id of ['rare-candy','fire-stone','ice-stone','leaf-stone','tm-case','stick','bicycle','full-heal'])app.run.player.items.set(id,1);
  });
  await page.waitForFunction(()=>{
    const root=app.run.ui.root,more=root.querySelector('[data-action="inventory-more"]');
    if(more?.textContent!=='+2')return false;
    const skills=root.querySelector('.zx-skill-slots').getBoundingClientRect();
    const cells=[...root.querySelectorAll('.zx-hud-supplies .zx-mini-slot')].map(c=>c.getBoundingClientRect());
    return cells.length===8&&cells.every((b,i)=>b.top>=skills.bottom&&b.top===cells[0].top&&(!i||b.left>=cells[i-1].right));
  });
  await tap('[data-action="inventory-more"]');
  await page.waitForFunction(()=>app.run.ui.modalEl?.querySelectorAll('[data-pause-section="supplies"] .zx-pause-build-row').length===11);
  await tap('[data-action="pause-resume"]');
  await tap('.zx-minimap');await capture('04-region-map');await tap('.zx-atlas-filter-toggle');await tap('[data-map-filter="chest"]');
  assert.equal(await page.evaluate(()=>app.run.ui.root.querySelector('.zx-battle-map-art').dataset.filter),'chest');
  await tap('[data-action="close-battle-map"]');
  await page.evaluate(()=>{
    const hud=app.run.ui;
    hud.captureStart(4,false,false,false,'炎');hud.captureShake(1);hud.captureResult(true);
    if(hud.capEl.querySelector('.zx-catch-track')?.getAttribute('aria-label')!=='炎 · 抓字成功')throw Error('Capture card did not show the encounter result');
    hud.captureEnd();hud.ultCutIn(4,'一点火苗');
    if(!hud.root.querySelector('.zx-ultimate-call'))throw Error('Ultimate announcement did not render');
  });
  await tap('.zx-hud-pause');await capture('05-pause');
  const startingDust=await page.evaluate(()=>{app.run.time=29.99;return app.meta.profile.stardust;});
  await tap('[data-action="pause-end"]');
  assert.match(await page.evaluate(()=>app.run.ui.modalEl.textContent),/0 星尘/);
  await tap('[data-action="end-confirm"]');
  await page.waitForFunction(()=>app.run.ui.modalEl?.dataset.result==='summary');
  assert.match(await page.evaluate(()=>app.run.ui.modalEl.querySelector('.zx-outcome-reward>b').textContent),/^星尘\s*\+0$/);
  assert.equal(await page.evaluate(()=>app.meta.profile.stardust),startingDust);
  await tap('[data-action="report-home"]');await screen('home');
  await journey();await chooseMap();
  console.log('Verified paper home, collection, route, room, lab and settings, illustrated handoff, original battle terrain and return.');
}
