import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const removed=['cursed','greed','porygon','snorlax','cage','rock','challenge','fossil','rhydon','meowth','hypno','slots','cursedchest','shroom','shrine','tower'];
const retained=['boss','altar','bill','nest','ditto','magnet','freechest','berry','chest'];

// Exercise the compiled game, including dynamic placement and real NPC callbacks.
export async function reviewScenes({page,tap,dir,sleep}) {
  const report={mode:'Compiled WeChat bundle in Chrome fixture. Controlled zone traversal and isolated NPC transactions, not a natural playthrough or phone test.',removed,stages:[]};
  const shot=async name=>{await sleep(400);await page.screenshot({path:path.join(dir,name+'.png')});};
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
    r.interactables.interact(r.interactables.list.find(o=>o.kind==='boss'));
    return r.diff;
  });
  await playing();
  const cleared=await page.evaluate(()=>{
    const r=app.run;
    r.combat.killEnemy(r.boss.bossIndex,{type:'normal'});
    return {cleared:r.stageCleared,bosses:r.stats.bosses,legendaries:r.stats.legendaries,state:r.state,portals:r.interactables.list.filter(o=>o.kind==='portal').length};
  });
  assert.deepEqual(cleared,{cleared:true,bosses:1,legendaries:0,state:'play',portals:1});
  report.portalWarning=await page.evaluate(()=>{
    const r=app.run,objects=r.interactables,portal=objects.list.find(o=>o.kind==='portal'),p=r.player.pos;
    p.set(portal.x,portal.y,portal.z);r.player.vel.set(0,0,0);
    if(!objects.rewardsLeft())objects.spawnChest(p.x+8,p.z,false,true);
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
      const before={list:interactions.list.length,meshes:interactions.group.children.length,reserved:r.terrain.landmarks.length};
      const rejected=removed.every(kind=>interactions.add(kind,0,0)===null&&interactions.place(kind,1,1)===null&&interactions.spawnNpc(kind,2,2)===null);
      const after={list:interactions.list.length,meshes:interactions.group.children.length,reserved:r.terrain.landmarks.length};
      return {stage:r.stage,counts,rejected,before,after,markers:interactions.markers().map(o=>o.kind)};
    },removed);
    assert.equal(inventory.rejected,true,'Removed types must not be recreated through any placement API');
    assert.deepEqual(inventory.after,inventory.before,'Rejected objects must not reserve terrain or add invisible meshes');
    for(const kind of removed){assert.equal(inventory.counts[kind]||0,0,kind+' must not spawn');assert.ok(!inventory.markers.includes(kind));}
    assert.deepEqual(Object.keys(inventory.counts).sort(),(stage===4?[]:retained).slice().sort());
    if(stage!==4)assert.equal(inventory.counts.ditto,1);
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
      assert.doesNotMatch(mapText,/Snorlax|Porygon|卡比兽|多边兽|诅咒雕像|贪婪|笼子|金矿石|Altar maldito|Jaula|Roca de oro|Altar de Gengar/i);
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
      await page.evaluate(()=>{
        const r=app.run;r.state='play';
        r.interactables.interact(r.interactables.list.find(o=>o.kind==='boss'));
      });
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
