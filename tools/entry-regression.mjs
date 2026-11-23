import assert from 'node:assert/strict';
import path from 'node:path';
import {writeFile} from 'node:fs/promises';

export async function verifyEntry({page,tap,dir}){
  const screen=name=>page.waitForFunction(name=>app.screen?.dataset.page===name,{},name);
  const capture=name=>page.screenshot({path:path.join(dir,name+'.png')});
  const journey=()=>tap('[data-action="journey"]');
  await screen('home');
  await page.waitForFunction(()=>GameGlobal.pokebonk.bootDiagnostics.completed);
  await page.waitForFunction(()=>app.screen.querySelector('.journey-scene')?.dataset.word==='炎'&&
    nativeImageLoads.some(img=>img.width===560&&img.height===1212));
  assert.ok(await page.evaluate(()=>!app.menuScene.terrain),'The home artwork must be independent of the battle map');
  await capture('01-home');
  assert.deepEqual(await page.evaluate(()=>[...app.screen.querySelectorAll('button')].map(b=>b.dataset.action)),['settings','journey','multiplayer','lab','help']);
  assert.ok(await page.evaluate(()=>app.screen.querySelector('.zx-home-wordmark').offsetHeight>=70));
  // Some input adapters give window x/y at press and an empty touch list at release.
  await page.evaluate(()=>{
    const v=inspected.env.entryViewport(),box=app.screen.querySelector('[data-action="journey"]').getBoundingClientRect();
    const x=v.x+box.x+box.width/2,y=v.y+box.y+box.height/2;
    const touch={identifier:7,x,y};
    const press=()=>inspected.touches('down',{touches:[touch],changedTouches:[touch]});
    const finish=kind=>inspected.touches(kind,{touches:[],changedTouches:[]});
    press();finish('cancel');
    if(app.screen.dataset.page!=='home')throw Error('Cancelled press opened a page');
    press();
    for(const dy of [-35,0]){
      const moved={...touch,y:y+dy};
      inspected.touches('move',{touches:[moved],changedTouches:[moved]});
    }
    finish('up');
    if(app.screen.dataset.page!=='home')throw Error('Drag opened a page');
    press();finish('up');
  });
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
  await chooseMap();await capture('02-stages');
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
    const audit=window.departureAudit={progress:[],fade:[]},background=app.screen.querySelector('.journey-scene');
    inspected.env.drawUI=(...args)=>{
      const result=drawUI(...args),entry=app.screen;
      if(entry?.classList.contains('journey-entry')){
        if(entry.querySelector('.journey-scene')!==background)throw Error('Entry discarded the selected journey backdrop');
        const value=Number(entry.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'));
        audit.progress.push(value);
        if(!audit.image&&value>=40&&!entry.querySelector('.zx-loading-content').hidden)audit.image=GameGlobal.pokebonk.canvas.toDataURL();
        if(entry._journeyFade)audit.fade.push(entry._journeyFade.scene);
        if(app.run?.time>0)throw Error('Combat started during the menu transition');
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
  assert.ok(audit.fade.some(n=>n<1)&&audit.fade.includes(0),'Paper scene must reveal the original battle map');
  if(audit.image)await writeFile(path.join(dir,'03-camera-departure.png'),Buffer.from(audit.image.split(',')[1],'base64'));
  assert.ok(await page.evaluate(()=>!!app.run.ui.root.querySelector('.zx-square-hud .zx-stage-caption')));
  await page.evaluate(()=>{
    const run=app.run;
    run.streak=7;run.streakT=3;
    run.player.items.set('revive',2);
    run.player.vitamins.set('protein',{level:1});
    run.player.vitamins.set('hp-up',{level:2});
  });
  await page.waitForFunction(()=>{
    const root=app.run.ui.root,combo=root.querySelector('.zx-combo>b'),cells=[...root.querySelectorAll('.zx-supply-row .zx-mini-slot')];
    if(combo?.textContent!=='×7'||!combo.offsetWidth||cells.length!==3)return false;
    const boxes=cells.map(c=>c.getBoundingClientRect());
    return boxes.every((b,i)=>b.width===25&&b.height===25&&b.y===boxes[0].y&&(!i||b.x>=boxes[i-1].right));
  });
  await capture('04-entry-play');
  await page.evaluate(()=>{app.run.streak=0;app.run.streakT=0;});
  await page.waitForFunction(()=>!app.run.ui.els.streak.offsetWidth);
  await page.evaluate(()=>{
    for(const id of ['rare-candy','fire-stone','ice-stone','leaf-stone'])app.run.player.items.set(id,1);
  });
  await page.waitForFunction(()=>{
    const root=app.run.ui.root,more=root.querySelector('[data-action="inventory-more"]');
    if(more?.textContent!=='+2')return false;
    const skills=root.querySelector('.zx-skill-slots').getBoundingClientRect();
    const cells=[...root.querySelectorAll('.zx-supply-row .zx-mini-slot')].map(c=>c.getBoundingClientRect());
    return cells.length===6&&cells.every((b,i)=>b.top>=skills.bottom&&b.top===cells[0].top&&(!i||b.left>=cells[i-1].right));
  });
  await tap('[data-action="inventory-more"]');
  await page.waitForFunction(()=>app.run.ui.modalEl?.querySelectorAll('[data-pause-section="supplies"] .zx-pause-build-row').length===7);
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
  await page.evaluate(()=>app.toMenu());await screen('home');
  await journey();await chooseMap();
  console.log('Verified paper home, collection, route, room, lab and settings, illustrated handoff, original battle terrain and return.');
}
