import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const removed=['ditto','cursed','greed','porygon','snorlax','cage','rock','challenge','fossil','rhydon','meowth','hypno','slots','cursedchest','shroom','shrine','tower'];
const retained=['boss','altar','bill','nest','magnet','freechest','berry','chest'];

// Exercise the compiled game, including dynamic placement and real NPC callbacks.
export async function reviewScenes({page,tap,dir,sleep}) {
  const report={mode:'Compiled WeChat bundle in Chrome fixture. Controlled zone traversal and isolated NPC transactions, not a natural playthrough or phone test.',removed,stages:[],summons:[]};
  const shot=async name=>{await sleep(400);await page.screenshot({path:path.join(dir,name+'.png')});};
  async function checkBlessingArt() {
    const {hero,cards}=await page.evaluate(()=>{
      const hero=app.run.ui.root.querySelector('.zx-hud-name').textContent;
      return {hero,cards:[...app.run.ui.modalEl.querySelectorAll('[data-offer]')].map(card=>
        card.querySelector('canvas.zx-glyph-image')?.parentNode.getAttribute('aria-label'))};
    });
    assert.ok(cards.length>=3);
    assert.deepEqual(cards,Array(cards.length).fill(hero));
  }
  async function checkSpringShoes(choice) {
    const result=await page.evaluate(choice=>{
      const run=app.run, shoes='air-balloon', other='razor-claw';
      const pool=run.meta.itemInPool;
      try {
        run.meta.itemInPool=key=>key===shoes || (choice && key===other);
        run.rollChestItem(false,1,choice?2:1);
        const cards=[...run.ui.root.querySelectorAll('[data-item-choice]')].map(card=>card.dataset.itemChoice);
        const action=choice?'[data-item-choice="razor-claw"]':'[data-item-action="sell"]';
        run.ui.root.querySelector(action).dispatchEvent(new inspected.env.Event('click'));
        run.meta.itemInPool=key=>key===shoes;
        const gold=run.gold;
        run.rollChestItem(false,1,2);
        return {cards:cards.sort(),goldFallback:run.state==='play' && run.gold>gold,owned:run.player.items.has(shoes)};
      } finally {run.meta.itemInPool=pool;}
    },choice);
    assert.deepEqual(result,{cards:choice?['air-balloon','razor-claw']:['air-balloon'],goldFallback:true,owned:false});
  }
  async function summonAtBuilding(captureIntro=false) {
    const timing=await page.evaluate(async()=>{
      const run=app.run,facilities=run.interactables;
      const building=facilities.list.find(o=>o.kind==='boss');
      await building.modelReady;
      run.state='play';
      const pos=run.player.pos,beside=building.x+1,outside=building.x+building.r+2;
      const stay=frames=>{for(let i=0;i<frames;i++)facilities.update(0,1/60);};
      pos.set(outside,building.y,building.z);
      run.player.vel.set(0,0,0);
      facilities.update(0,0);
      pos.x=beside;
      run.time=run.stage===2?650:299.875;
      run.stageTime=299.875;
      stay(240);
      facilities.interact(building);
      const earlyEvent=run.director.fire('guardian');
      facilities.render();
      const sealed=!building.used&&!run.bossSpawned&&!facilities.dwellRing.visible&&facilities.dwellTime===0;
      const sealedLabel=facilities.label(building);
      run.stageTime=300;facilities.update(.125,.125);
      const atUnlock=facilities.dwellTime;
      run.time+=.25;run.stageTime=300.125;facilities.update(.25,.25);
      const crossed=facilities.dwellTime;
      facilities.interact(building);
      const stillWaiting=!building.used&&!run.bossSpawned;
      const readyLabel=facilities.label(building);
      pos.x=outside;stay(1);pos.x=beside;
      stay(90);
      const halfway=facilities.dwellProgress,target=facilities.nearest?.kind,visible=facilities.hasVisual(building);
      run.stageTime=304;
      const eventWhileHolding=run.director.fire('guardian');
      facilities.render();
      const ring=facilities.dwellRing;
      const ringAtDoor=ring.visible&&ring.position.x===building.x&&ring.position.z===building.z&&
        ring.material.uniforms.dwell.value===halfway;
      pos.x=outside;
      stay(1);
      facilities.render();
      const left=facilities.nearest!==building&&!ring.visible;
      pos.x=beside;
      stay(179);
      const before=facilities.dwellProgress,waiting=!run.bossSpawned&&!building.used;
      const enemies=run.enemies, kills=run.stats.kills, xp=run.player.xp;
      const victims=[0,1,4096,8192,128].map((flag,i)=>
        enemies.spawn(19,beside+i-2,building.z+4,1,1,flag));
      victims.push(enemies.spawnProxy(19,beside+3,building.y,building.z-3,0,1));
      if(victims.some(id=>id<0))throw Error('Could not populate the area before summoning');
      run.later(.05,()=>{
        if(enemies.spawn(19,beside,building.z,1,1,1024)>=0)throw Error('A delayed wave joined the duel');
      });
      stay(1);
      const index=run.boss.bossIndex,previousBurn=run.enemies.burn[index];
      const blocked=[0,1,2,4,128,512,4096,8192,16384].every(flag=>
        enemies.spawn(19,beside,building.z,1,1,flag)===-1) && enemies.spawnProxy(19,0,0,0,1,1)===-1;
      const wasHalted=app.halted;
      app.halted=true;
      const batch=run.sprites.get(enemies.species[index],false,enemies.glyphWords[index]);
      const ready=batch.ready;
      try{
        batch.ready=false;
        run.renderWorld(0);
        if(run.sprites.standIn.count)throw Error('A loading ball appeared in the dragon intro');
      }finally{batch.ready=ready;}
      run.enemies.burn[index]=1;run.ui.bossSt.update(run.enemies,index);
      const burnIcon=[...run.ui.bossSt.el.querySelectorAll('img')].some(img=>img.src.includes('/ui/types/fire.png'));
      run.enemies.burn[index]=previousBurn;run.ui.bossSt.update(run.enemies,index);
      return {stage:run.stage,sealed,sealedLabel,atUnlock,crossed,stillWaiting,readyLabel,earlyEvent,eventWhileHolding,halfway,target,visible,ringAtDoor,model:building.model.userData.deviceModel,
        left,before,waiting,burnIcon,blocked,kills,xp,victims,wasHalted,summoned:building.used&&run.bossSpawned&&run.boss.alive};
    });
    const beats=[],frames=[];
    let peakBeamSegments=0;
    try{
      for(let frame=0;frame<58;frame++){
        const state=await page.evaluate(({victims,captureIntro,sampleEdges})=>{
          const r=app.run, e=r.enemies, id=r.boss.bossIndex;
          r.update(1/30);r.update(1/30);
          const chant=r.ui.hudEl.querySelector('.zx-dragon-chant');
          if(r.ui.hudEl.querySelector('.bossintro'))throw Error('Unexpected dragon intro card');
          if(!r.ui.root.querySelector('.zx-hud').hidden)throw Error('Combat HUD covered the dragon cinematic');
          if(chant && !victims.every(i=>e.alive[i]))throw Error('Sacrifice began during the incantation');
          if(!chant && (e.count!==1||e.remotes||!r.boss.live(id)))throw Error('Unexpected sacrifice survivors');
          const focus=r.player.pos.clone().set(e.x[id],e.y[id]+e.hgt[id]*.55,e.z[id]).project(app.r.camera);
          if(captureIntro){
            app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
            if(chant){
              const box=inspected.layout.box(chant);
              const screen=inspected.doc.getElementById('game').getBoundingClientRect();
              if(!box||box.opacity<.9||box.x!==screen.x||box.y!==screen.y||box.w!==screen.width||box.h!==screen.height)
                throw Error('Incantation overlay must fill the game screen');
              if(sampleEdges){
                const ui=inspected.uiCanvas,context=ui.getContext('2d');
                for(const x of [0,Math.floor(ui.width/2),ui.width-1])for(const y of [0,ui.height-1]){
                  if(context.getImageData(x,y,1,1).data[3]<90)throw Error('Unshaded screen edge at '+[x,y]);
                }
              }
            }
          }
          const focused=!chant && Math.abs(focus.x)<.1 && Math.abs(focus.y)<.1 && e.count===1;
          return {word:chant?.dataset.word,beams:focused?r.vfx.beams.mesh.count:0,
            kills:r.stats.kills,xp:r.player.xp};
        },{victims:timing.victims,captureIntro,sampleEdges:[2,9,15,21].includes(frame)});
        if(state.word && state.word!==beats.at(-1))beats.push(state.word);
        peakBeamSegments=Math.max(peakBeamSegments,state.beams);
        assert.equal(state.kills,timing.kills);assert.equal(state.xp,timing.xp);
        if(captureIntro){
          const png=await page.screenshot();
          frames.push(await sharp(png).resize(320,692,{fit:'contain'}).ensureAlpha().raw().toBuffer());
          if(frame===41)fs.writeFileSync(path.join(dir,'万字归一.png'),png);
        }
      }
      assert.deepEqual(beats,['万','字','归','一']);
      assert.ok(peakBeamSegments>=72,'Expected a dense convergence on the dragon, saw '+peakBeamSegments+' beam segments');
      if(captureIntro)await sharp(Buffer.concat(frames),{raw:{width:320,height:692*frames.length,channels:4,pageHeight:692}})
        .gif({delay:67,loop:0}).toFile(path.join(dir,'万字归一.gif'));
    }finally{await page.evaluate(halted=>{app.halted=halted;},timing.wasHalted);}
    assert.ok(Math.abs(timing.halfway-.5)<1e-6,'The summon ring should be half full at 1.5 seconds: '+JSON.stringify(timing));
    assert.ok(timing.sealed&&timing.stillWaiting&&timing.earlyEvent===false&&timing.eventWhileHolding===false);
    assert.equal(timing.atUnlock,0);
    assert.equal(timing.sealedLabel,'距可提前召唤 00:01');assert.match(timing.readyLabel,/3 秒.*唤醒镇守/);
    assert.equal(timing.crossed,.125);
    assert.ok(timing.ringAtDoor&&timing.visible&&timing.model==='portal');
    assert.ok(timing.left&&timing.waiting&&Math.abs(timing.before-179/180)<1e-6,'Leaving should require three fresh seconds');
    assert.ok(timing.summoned,'The boss should appear on the frame that completes three seconds');
    assert.ok(timing.blocked);
    assert.ok(timing.burnIcon,'The boss status row must use the installed fire icon');
    report.summons.push({...timing,peakBeamSegments});
  }
  await tap('[data-action="journey"]');
  await tap('.zx-footer button','选择关卡');
  await tap('.zx-footer button','选择难度');
  assert.deepEqual(await page.evaluate(()=>[...inspected.doc.querySelectorAll('button.zx-difficulty h3')].map(el=>el.textContent)),['普通（单关）','普通','困难','噩梦']);
  await tap('[data-mode="single-stage"]');
  await shot('single-stage-selection');
  await tap('[data-action="enter"]');
  const playing=()=>page.waitForFunction(()=>app.run?.time>1&&app.run.state==='play',{timeout:90000});
  await playing();
  await checkSpringShoes(false);
  const singleDiff=await page.evaluate(async()=>{
    const r=app.run;
    if(r.interactables.list.filter(o=>o.kind==='altar').length!==1)throw Error('Expected one guardian altar in single-stage mode');
    await r.enterPortal();
    if(r.stage!==1||r.state!=='play'||r.interactables.list.some(o=>o.kind==='portal'))throw Error('Premature portal or victory');
    r.godMode=true;
    r.queueLevelUp=()=>{}; // Jumping to the summon clock would trigger the opening catch-up draft.
    return r.diff;
  });
  const previousHalt=await page.evaluate(async()=>{
    const r=app.run,f=r.interactables,door=f.list.find(o=>o.kind==='boss');
    await door.modelReady;
    const previous=app.halted;app.halted=true;
    r.time=r.stageTime=288;
    r.player.pos.set(door.x,door.y,door.z+2.5);r.player.vel.set(0,0,0);r.camTarget.copy(r.player.pos);
    f.update(0,0);r.hints.tick(r,1);r.updateCamera(1);r.renderWorld(0);r.ui.hud(r);r.ui.worldLabels(r);
    app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    if(!r.hints.el?.textContent.includes('距可提前召唤 00:12')||r.ui.worldLabelNodes.has(door))
      throw Error('The door tutorial must present the countdown once');
    return previous;
  });
  await page.waitForFunction(()=>{
    const img=app.run.hints.el?.querySelector('img');
    return img?.complete&&img.naturalWidth>0&&img.src.split('?')[0].endsWith('/ui/devices/portal.png');
  },{timeout:6000,polling:50});
  await page.evaluate(()=>{app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);});
  await shot('提前召唤倒计时');
  await page.evaluate(previous=>{
    const r=app.run,door=r.hints.site;
    r.hints.el.remove();r.ui.worldLabels(r);
    if(r.ui.worldLabelNodes.get(door)?.textContent!=='距可提前召唤 00:12')throw Error('Missing countdown after the tutorial closes');
    app.halted=previous;
  },previousHalt);
  await summonAtBuilding(true);
  await playing();
  const cleared=await page.evaluate(()=>{
    const r=app.run;
    if(r.ui.root.querySelector('.zx-hud').hidden)throw Error('Combat HUD was not restored after the cinematic');
    r.combat.killEnemy(r.boss.bossIndex,{type:'normal'});
    return {cleared:r.stageCleared,bosses:r.stats.bosses,legendaries:r.stats.legendaries,state:r.state,portals:r.interactables.list.filter(o=>o.kind==='portal').length};
  });
  assert.deepEqual(cleared,{cleared:true,bosses:1,legendaries:0,state:'play',portals:1});
  report.portalWarning=await page.evaluate(async()=>{
    const r=app.run,objects=r.interactables,portal=objects.list.find(o=>o.kind==='portal'),p=r.player.pos;
    await portal.modelReady;
    if(portal.model.userData.deviceModel!=='boss')throw Error('The exit must use the wooden door');
    const gap=target=>Math.min(...objects.list.filter(f=>f!==target&&f.group.visible)
      .map(f=>Math.hypot(f.x-target.x,f.z-target.z)-f.r-target.r));
    if(gap(portal)<5||!objects.fitsOnDesk(portal.x,portal.z,portal.r))throw Error('Obstructed exit');
    p.set(portal.x,portal.y,portal.z);r.player.vel.set(0,0,0);
    const gift=objects.spawnChest(p.x,p.z,false,true);
    if(gap(gift)<5||!objects.fitsOnDesk(gift.x,gift.z,gift.r))throw Error('Crowded reward chest');
    const stay=frames=>{for(let i=0;i<frames&&r.state==='play';i++)objects.update(0,1/30);};
    stay(45);
    const warned=r.state==='play'&&objects.warnedPortal===portal;
    p.x+=20;stay(1);
    const cleared=objects.warnedPortal===null;
    p.x=portal.x;stay(45);
    const warnedAgain=r.state==='play'&&objects.warnedPortal===portal;
    stay(44);const waiting=r.state==='play';stay(1);
    return {warned,cleared,warnedAgain,waiting};
  });
  assert.deepEqual(report.portalWarning,{warned:true,cleared:true,warnedAgain:true,waiting:true});
  await page.waitForFunction(()=>!!inspected.doc.querySelector('.zx-summary'),{timeout:30000});
  report.singleStage=await page.evaluate(()=>{
    const p=app.meta.profile,record=p.runs[0];
    return {mode:record.mode,stage:record.stage,victory:record.victory,tier:p.biomes.forest,text:app.screen.textContent};
  });
  assert.equal(report.singleStage.mode,'single-stage');assert.equal(report.singleStage.stage,1);assert.ok(report.singleStage.victory);
  assert.equal(report.singleStage.tier,0);assert.match(report.singleStage.text,/1 \/ 1/);assert.match(report.singleStage.text,/单关通关/);
  await shot('single-stage-victory');
  await tap('.zx-footer button','调整文字与关卡');
  await tap('.zx-footer button','选择关卡');
  await tap('.zx-footer button','选择难度');
  await tap('[data-mode="standard"][data-tier="0"]');
  await tap('[data-action="enter"]');
  await playing();
  assert.deepEqual(await page.evaluate(()=>app.run.diff),singleDiff);
  await checkSpringShoes(true);
  await page.evaluate(()=>{app.run.godMode=true;app.run.queueLevelUp=()=>{};app.run.pendingLevels=0;app.run.hints.show=()=>{};});

  for(const stage of [1,2,4]) {
    await page.waitForFunction(stage=>{
      const r=app.run;
      return r?.stage===stage && r.state==='play' && (stage!==4 || r.boss.alive);
    },{timeout:90000},stage);
    if(stage===2){
      assert.ok(await page.evaluate(()=>{
        const run=app.run, pool=run.meta.itemInPool, gold=run.gold;
        try {
          run.meta.itemInPool=key=>key==='air-balloon';
          run.rollChestItem(false);
          return run.state==='play' && run.gold>gold;
        } finally {run.meta.itemInPool=pool;}
      }),'Changing zones must not offer skipped shoes again');
    }
    const inventory=await page.evaluate(removed=>{
      const r=app.run,interactions=r.interactables;r.state='paused';
      const counts={};for(const o of interactions.list)counts[o.kind]=(counts[o.kind]||0)+1;
      const before={list:interactions.list.length,meshes:interactions.group.children.length,reserved:r.terrain.clearZones.length};
      const rejected=removed.every(kind=>interactions.add(kind,0,0)===null&&interactions.place(kind,1,1)===null&&interactions.spawnNpc(kind,2,2)===null);
      const after={list:interactions.list.length,meshes:interactions.group.children.length,reserved:r.terrain.clearZones.length};
      const sites=interactions.list;
      let spacing=null;
      if(sites.length){
        let minGap=Infinity,minCenters=Infinity;
        for(let i=0;i<sites.length;i++)for(let j=0;j<i;j++){
          const a=sites[i],b=sites[j],d=Math.hypot(a.x-b.x,a.z-b.z);
          minCenters=Math.min(minCenters,d);
          minGap=Math.min(minGap,d-a.r-b.r);
        }
        spacing={minGap,minCenters,quadrants:new Set(sites.map(s=>(s.x>0)+2*(s.z>0))).size,
          outsideOldCircle:sites.filter(s=>Math.hypot(s.x,s.z)>r.terrain.play-5).length,
          accessible:sites.every(s=>r.terrain.inBounds(s.x,s.z,6)&&r.terrain.isFlatOpen(s.x,s.z)&&
            interactions.fitsOnDesk(s.x,s.z,s.ringRadius))};
      }
      return {stage:r.stage,counts,rejected,before,after,spacing,markers:interactions.markers().map(o=>o.kind)};
    },removed);
    assert.equal(inventory.rejected,true,'Removed types must not be recreated through any placement API');
    assert.deepEqual(inventory.after,inventory.before,'Rejected objects must not reserve terrain or add invisible meshes');
    for(const kind of removed){assert.equal(inventory.counts[kind]||0,0,kind+' must not spawn');assert.ok(!inventory.markers.includes(kind));}
    assert.deepEqual(Object.keys(inventory.counts).sort(),(stage===4?[]:retained).slice().sort());
    if(stage!==4){
      assert.equal(inventory.counts.altar,1);
      const s=inventory.spacing;
      assert.ok(s.accessible&&s.quadrants===4&&s.minGap>10&&s.outsideOldCircle>0,JSON.stringify(s));
    }
    report.stages.push(inventory);
    console.log('Scene inventory',stage,JSON.stringify(inventory.counts));
    await shot('scene-zone-'+stage);

    if(stage===1) {
      await page.evaluate(()=>{app.run.state='play';});
      const point=await page.evaluate(()=>{
        const r=app.run.ui.minimap.getBoundingClientRect(),screen=inspected.doc.getElementById('game').getBoundingClientRect();
        return {x:r.x+r.width/2-screen.x,y:r.y+r.height/2-screen.y};
      });
      await page.touchscreen.tap(point.x,point.y);
      await page.waitForFunction(()=>app.run.ui.mapOpen());
      const mapText=await page.evaluate(()=>app.run.ui.modalEl.textContent);
      assert.match(mapText,/附近地图/);
      assert.match(mapText,/守护者祭坛/);
      assert.doesNotMatch(mapText,/拍立得/);
      assert.doesNotMatch(mapText,/Snorlax|Porygon|卡比兽|多边兽|诅咒雕像|诅咒祭坛|贪婪|笼子|金矿石|Altar maldito|Jaula|Roca de oro|Altar de Gengar/i);
      await shot('scene-full-map');
      await page.evaluate(()=>{app.run.ui.hideModal();app.run.state='paused';});

      report.blessing=await page.evaluate(()=>{
        const r=app.run,f=r.interactables;
        const altar=f.list.find(o=>o.kind==='altar');
        r.state='play';r.player.pos.set(altar.x+1,altar.y,altar.z);r.player.vel.set(0,0,0);
        const timers=r.timers.length,mods=r.tempMods.length,curses=r.curses;
        for(let i=0;i<6;i++)f.update(.05,.25);
        if(Math.abs(altar.charge-.5)>1e-8)throw Error('Expected half charge after 1.5 seconds inside the ring');
        const waveTimers=r.timers.length-timers;
        let orbitGlyphs=0;
        const get=r.sprites.get;
        r.sprites.get=function(id,...args){if(id===201)orbitGlyphs++;return get.call(this,id,...args);};
        try{f.render();}finally{r.sprites.get=get;}
        const ring=altar.chargeRing,atPlant=ring.visible&&ring.parent===altar.group&&
          ring.position.y>0&&ring.material.uniforms.dwell.value===altar.charge&&!f.dwellRing.visible;
        for(let i=0;i<5;i++)f.update(.05,.25);
        f.update(.05,.24);
        if(altar.used)throw Error('Blessing granted before three seconds');
        f.update(.01,.01);
        f.render();
        return {tier:altar.data.tier,atPlant,complete:ring.visible&&ring.material.uniforms.dwell.value===1,
          orbitGlyphs,waveTimers,used:altar.used,mods,curses,
          boss:r.bossSpawned,title:r.ui.modalEl.querySelector('h2')?.textContent};
      });
      const blessing=report.blessing;
      assert.ok([0,1,2,3].includes(blessing.tier)&&blessing.atPlant&&blessing.complete&&blessing.used&&!blessing.boss);
      assert.equal(blessing.title,'守护者祭坛');assert.equal(blessing.orbitGlyphs,0);assert.equal(blessing.waveTimers,0);
      await checkBlessingArt();
      await shot('祭坛祝福角色图');
      for(let i=0;i<(blessing.tier===3?2:1);i++)await tap('[data-choice="showBlessing"] [data-offer="0"]');
      const reward=await page.evaluate(before=>({mods:app.run.tempMods.slice(before),curses:app.run.curses}),blessing.mods);
      assert.equal(reward.curses,blessing.curses);
      assert.ok(reward.mods.length>0&&reward.mods.every(m=>m.mul>1||m.add>0));
      const oldSpecies=await page.evaluate(()=>{
        const r=app.run,old=r.player.speciesId;
        r.player.setSpecies(5);
        if(!r.minibosses.spawnTotem())throw Error('Could not spawn the blessing boss');
        r.combat.killEnemy(r.minibosses.lastIndex,{type:'normal'});
        r.update(0);
        return old;
      });
      await page.waitForFunction(()=>app.run.ui.modalEl?.querySelector('[data-choice="showBlessing"]'));
      await checkBlessingArt();
      await shot('霸主祝福角色图');
      await tap('[data-choice="showBlessing"] [data-offer="0"]');
      await page.evaluate(id=>app.run.player.setSpecies(id),oldSpecies);
    }
    const area=await page.evaluate(()=>inspected.doc.querySelector('.zx-hud-area').textContent);
    assert.match(area,stage===4?/星灯书庭.*圣地/:new RegExp(stage+'/2区'));
    if(stage===4){
      report.sanctuary=await page.evaluate(()=>{
        const {sanctuary:s,boss}=app.run;boss.kit.enterPhase(2);boss.kit.enterPhase(3);
        return {species:boss.kit.species,phase:boss.kit.phase,ultimate:boss.kit.ultimateName,roots:s.roots.length,brambles:s.brambles.length,columns:s.covers.filter(c=>c.kind==='column').length};
      });
      assert.equal(report.sanctuary.species,149);assert.equal(report.sanctuary.phase,3);assert.equal(report.sanctuary.ultimate,'满天乱砸');
      assert.ok(report.sanctuary.roots && report.sanctuary.brambles && report.sanctuary.columns);
    } else {
      await summonAtBuilding();
      await playing();
    }
    const defeated=await page.evaluate(()=>{
      const r=app.run;
      const name=r.boss.name,final=!!r.boss.kit;
      if(r.enemies.count!==1||r.enemies.remotes)throw Error('An enemy joined the dragon duel');
      const bossCount=Array.from(r.enemies.flags.subarray(0,r.enemies.n)).filter((flag,i)=>
        (flag&4) && r.enemies.isAlive(i)).length;
      r.state='play';r.combat.killEnemy(r.boss.bossIndex,{type:'normal'});
      if(r.enemies.spawn(19,0,0,1,1)!==-1)throw Error('Enemy waves resumed at the exit');
      const portals=r.interactables.list.filter(o=>o.kind==='portal');
      return {name,final,bossCount,portals:portals.length,sanct:portals[0]?.data.sanct,cleared:r.stageCleared,
        bosses:r.stats.bosses,legendaries:r.stats.legendaries};
    });
    assert.deepEqual(defeated,{name:'龘',final:stage===4,bossCount:1,portals:1,sanct:stage!==1,cleared:true,
      bosses:stage===4?3:stage,legendaries:stage===4?1:0});
    (report.defeats??=[]).push(defeated);
    await page.evaluate(()=>{
      const r=app.run,portal=r.interactables.list.find(o=>o.kind==='portal');
      r.player.pos.set(portal.x,portal.y,portal.z);r.player.vel.set(0,0,0);
      for(let i=0;i<92&&r.state==='play';i++)r.interactables.update(0,1/30);
    });
  }
  await page.waitForFunction(()=>!!inspected.doc.querySelector('.zx-summary'),{timeout:30000});
  const result=await page.evaluate(()=>({run:app.meta.profile.runs[0],text:app.screen.textContent}));
  assert.ok(result.run.victory);assert.equal(result.run.splits.length,3);
  assert.match(result.text,/2 \/ 2/);
  fs.writeFileSync(path.join(dir,'scene-regression.json'),JSON.stringify(report,null,2));
  console.log('Scene regression passed for combat zones, final boss, victory, facility pools, unique spring shoe offers and portals.');
}
