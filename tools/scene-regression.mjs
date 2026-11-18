import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const removed=['cursed','greed','porygon','snorlax','cage','rock','challenge','fossil','rhydon','meowth','hypno','slots','cursedchest','shroom','shrine','tower'];
const retained=['boss','altar','bill','nest','ditto','magnet','freechest','berry','chest'];

// Exercise the compiled game, including dynamic placement and real NPC callbacks.
export async function reviewScenes({page,tap,dir,sleep}) {
  const report={mode:'Compiled WeChat bundle in Chrome fixture. Controlled zone traversal and isolated NPC transactions, not a natural playthrough or phone test.',removed,stages:[],summons:[]};
  const shot=async name=>{await sleep(400);await page.screenshot({path:path.join(dir,name+'.png')});};
  async function summonAtBuilding() {
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
      run.time=run.stage===2?650:239.875;
      run.stageTime=239.875;
      stay(240);
      facilities.interact(building);
      const earlyEvent=run.director.fire('guardian');
      facilities.render();
      const sealed=!building.used&&!run.bossSpawned&&!facilities.dwellRing.visible&&facilities.dwellTime===0;
      const sealedLabel=facilities.label(building);
      run.stageTime=240;facilities.update(.125,.125);
      const atUnlock=facilities.dwellTime;
      run.time+=.25;run.stageTime=240.125;facilities.update(.25,.25);
      const crossed=facilities.dwellTime;
      facilities.interact(building);
      const stillWaiting=!building.used&&!run.bossSpawned;
      const readyLabel=facilities.label(building);
      pos.x=outside;stay(1);pos.x=beside;
      stay(90);
      const halfway=facilities.dwellProgress,target=facilities.nearest?.kind,visible=facilities.hasVisual(building);
      run.stageTime=244;
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
      stay(1);
      const index=run.boss.bossIndex,previousBurn=run.enemies.burn[index];
      run.enemies.burn[index]=1;run.ui.bossSt.update(run.enemies,index);
      const burnIcon=[...run.ui.bossSt.el.querySelectorAll('img')].some(img=>img.src.includes('/ui/types/fire.png'));
      run.enemies.burn[index]=previousBurn;run.ui.bossSt.update(run.enemies,index);
      return {stage:run.stage,sealed,sealedLabel,atUnlock,crossed,stillWaiting,readyLabel,earlyEvent,eventWhileHolding,halfway,target,visible,ringAtDoor,model:building.model.userData.deviceModel,
        left,before,waiting,burnIcon,summoned:building.used&&run.bossSpawned&&run.boss.alive};
    });
    assert.ok(Math.abs(timing.halfway-.5)<1e-6,'The summon ring should be half full at 1.5 seconds: '+JSON.stringify(timing));
    assert.ok(timing.sealed&&timing.stillWaiting&&timing.earlyEvent===false&&timing.eventWhileHolding===false);
    assert.equal(timing.atUnlock,0);
    assert.equal(timing.sealedLabel,'距漩涡解封 00:01');assert.match(timing.readyLabel,/3 秒.*唤醒镇守/);
    assert.equal(timing.crossed,.125);
    assert.ok(timing.ringAtDoor&&timing.visible&&timing.model==='portal');
    assert.ok(timing.left&&timing.waiting&&Math.abs(timing.before-179/180)<1e-6,'Leaving should require three fresh seconds');
    assert.ok(timing.summoned,'The boss should appear on the frame that completes three seconds');
    assert.ok(timing.burnIcon,'The boss status row must use the installed fire icon');
    report.summons.push(timing);
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
  const singleDiff=await page.evaluate(async()=>{
    const r=app.run;
    await r.enterPortal();
    if(r.stage!==1||r.state!=='play'||r.interactables.list.some(o=>o.kind==='portal'))throw Error('Premature portal or victory');
    r.godMode=true;
    return r.diff;
  });
  const previousHalt=await page.evaluate(async()=>{
    const r=app.run,f=r.interactables,door=f.list.find(o=>o.kind==='boss');
    await door.modelReady;
    const previous=app.halted;app.halted=true;
    r.time=r.stageTime=228;
    r.player.pos.set(door.x,door.y,door.z+2.5);r.player.vel.set(0,0,0);r.camTarget.copy(r.player.pos);
    f.update(0,0);r.hints.tick(r,1);r.updateCamera(1);r.renderWorld(0);r.ui.hud(r);r.ui.worldLabels(r);
    app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    if(!r.hints.el?.textContent.includes('距漩涡解封 00:12')||r.ui.worldLabelNodes.has(door))
      throw Error('The door tutorial must present the countdown once');
    return previous;
  });
  await page.waitForFunction(()=>{
    const img=app.run.hints.el?.querySelector('img');
    return img?.complete&&img.naturalWidth>0&&img.src.split('?')[0].endsWith('/ui/devices/portal.png');
  },{timeout:6000,polling:50});
  await page.evaluate(()=>{app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);});
  await shot('漩涡解封倒计时');
  await page.evaluate(previous=>{
    const r=app.run,door=r.hints.site;
    r.hints.el.remove();r.ui.worldLabels(r);
    if(r.ui.worldLabelNodes.get(door)?.textContent!=='距漩涡解封 00:12')throw Error('Missing countdown after the tutorial closes');
    app.halted=previous;
  },previousHalt);
  await summonAtBuilding();
  await playing();
  const cleared=await page.evaluate(()=>{
    const r=app.run;
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
  await page.evaluate(()=>{app.run.godMode=true;app.run.queueLevelUp=()=>{};app.run.pendingLevels=0;app.run.hints.show=()=>{};});

  for(const stage of [1,2,4]) {
    await page.waitForFunction(stage=>{
      const r=app.run;
      return r?.stage===stage && r.state==='play' && (stage!==4 || r.boss.alive);
    },{timeout:90000},stage);
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
      assert.equal(inventory.counts.ditto,1);
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
      assert.match(mapText,/守护者祭坛/);
      assert.doesNotMatch(mapText,/Snorlax|Porygon|卡比兽|多边兽|诅咒雕像|诅咒祭坛|贪婪|笼子|金矿石|Altar maldito|Jaula|Roca de oro|Altar de Gengar/i);
      await shot('scene-full-map');
      await page.evaluate(()=>{app.run.ui.hideModal();app.run.state='paused';});

      await page.evaluate(()=>{
        const r=app.run;r.player.items.clear();r.player.addItem('razor-claw');
        r.interactables.interact(r.interactables.list.find(o=>o.kind==='ditto'));
      });
      await shot('scene-ditto-copy');
      await tap('[data-choice="showDitto"] [data-offer="0"]');
      const copied=await page.evaluate(()=>({count:app.run.player.items.get('razor-claw'),used:app.run.interactables.list.find(o=>o.kind==='ditto').used}));
      assert.deepEqual(copied,{count:2,used:true});

      report.copied=copied;
      await page.evaluate(()=>{app.run.ui.hideModal();app.run.state='paused';});
      report.blessing=await page.evaluate(()=>{
        const r=app.run,f=r.interactables;
        const altar=f.list.filter(o=>o.kind==='altar').sort((a,b)=>b.data.tier-a.data.tier)[0];
        r.state='play';r.player.pos.set(altar.x+1,altar.y,altar.z);r.player.vel.set(0,0,0);
        const timers=r.timers.length,mods=r.tempMods.length,curses=r.curses;
        while(altar.charge<.5&&!altar.used){
          const previous=altar.charge;
          f.update(.25);
          if(altar.charge<=previous)throw Error('The guardian altar did not charge on approach');
        }
        const waveTimers=r.timers.length-timers;
        let orbitGlyphs=0;
        const get=r.sprites.get;
        r.sprites.get=function(id,...args){if(id===201)orbitGlyphs++;return get.call(this,id,...args);};
        try{f.render();}finally{r.sprites.get=get;}
        const ring=altar.chargeRing,atPlant=ring.visible&&ring.parent===altar.group&&
          ring.position.y>0&&ring.material.uniforms.dwell.value===altar.charge&&!f.dwellRing.visible;
        for(let i=0;i<200&&!altar.used;i++)f.update(.25);
        f.render();
        return {tier:altar.data.tier,atPlant,complete:ring.visible&&ring.material.uniforms.dwell.value===1,
          orbitGlyphs,waveTimers,used:altar.used,mods,curses,
          boss:r.bossSpawned,title:r.ui.modalEl.querySelector('h2')?.textContent};
      });
      const blessing=report.blessing;
      assert.ok(blessing.tier>=2&&blessing.atPlant&&blessing.complete&&blessing.used&&!blessing.boss);
      assert.equal(blessing.title,'守护者祭坛');assert.equal(blessing.orbitGlyphs,0);assert.equal(blessing.waveTimers,0);
      for(let i=0;i<(blessing.tier===3?2:1);i++)await tap('[data-choice="showBlessing"] [data-offer="0"]');
      const reward=await page.evaluate(before=>({mods:app.run.tempMods.slice(before),curses:app.run.curses}),blessing.mods);
      assert.equal(reward.curses,blessing.curses);
      assert.ok(reward.mods.length>0&&reward.mods.every(m=>m.mul>1||m.add>0));
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
      const bossCount=Array.from(r.enemies.flags.subarray(0,r.enemies.n)).filter((flag,i)=>
        (flag&4) && r.enemies.isAlive(i)).length;
      r.state='play';r.combat.killEnemy(r.boss.bossIndex,{type:'normal'});
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
  console.log('Scene removal regression passed: two combat zones, automatic final boss, victory, official facility pools, item copying and portals.');
}
