import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const removed=['cursed','greed','porygon','snorlax','cage','rock'];
const retained=['boss','altar','challenge','fossil','rhydon','bill','nest','meowth','ditto','hypno','magnet','slots','freechest','cursedchest','berry','chest'];

// Exercise the compiled game, including dynamic placement and real NPC callbacks.
export async function reviewScenes({page,tap,resize,dir,sleep}) {
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
  await page.evaluate(()=>{
    const r=app.run,portal=r.interactables.list.find(o=>o.kind==='portal');
    r.interactables.interact(portal);
    if(r.state==='play')r.interactables.interact(portal); // Confirm when boss loot remains.
  });
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

  for(let stage=1;stage<=4;stage++) {
    if(stage>1) {
      if(stage===4)await page.evaluate(()=>{app.meta.profile.settings.showBanners=false;});
      await page.evaluate(async stage=>{
        const r=app.run;r.ui.hideModal();r.state='play';
        if(stage===2){
          await r.enterPortal();
          if(r.stage===1&&r.state==='play')await r.enterPortal();
        }
        else await r.changeZone();
      },stage);
      await page.waitForFunction(stage=>app.run.stage===stage&&(stage===4
        ?app.run.state==='modal'&&!!inspected.doc.querySelector('.zx-sanctuary-guide')
        :app.run.state==='play'),{timeout:90000},stage);
      if(stage===4){
        const before=await page.evaluate(()=>({time:app.run.stageTime,text:app.run.ui.modalEl.textContent}));
        assert.match(before.text,/触碰圣地，召唤最终 Boss/);
        assert.match(before.text,/地图中央/);
        for(const [width,height] of [[320,568],[390,844],[430,932]]){
          await resize(width,height);await shot('sanctuary-guide-'+width);
          const visible=await page.evaluate(()=>[...inspected.doc.querySelectorAll('.zx-sanctuary-guide h2,.zx-sanctuary-guide p,.zx-sanctuary-guide button')].every(el=>{
            const b=inspected.layout.box(el);return b&&b.w>0&&b.h>0&&b.x>=b.clip.x-1&&b.y>=b.clip.y-1&&b.x+b.w<=b.clip.r+1&&b.y+b.h<=b.clip.b+1;
          }));
          assert.ok(visible,'Sanctuary instructions and acknowledgement fit on '+width);
        }
        assert.equal(await page.evaluate(()=>app.run.stageTime),before.time,'Guide pauses the simulation');
        await tap('[data-action="sanctuary-guide-close"]');
        assert.equal(await page.evaluate(()=>app.run.state),'play');
        await resize(390,844);
        report.sanctuaryGuide={text:before.text,paused:true,visibleWidths:[320,390,430],bannersDisabled:true};
      }
    }
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
    assert.deepEqual(Object.keys(inventory.counts).sort(),(stage<=3?retained:['shrine']).slice().sort());
    if(stage<=3)for(const kind of ['meowth','ditto','hypno'])assert.equal(inventory.counts[kind],1);
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

      const stock=await page.evaluate(()=>{
        const r=app.run;r.gold=3000;
        r.interactables.interact(r.interactables.list.find(o=>o.kind==='meowth'));
        const item=r.shop.stock[0];
        return {key:item.key,price:item.price,before:r.player.items.get(item.key)||0,gold:r.gold};
      });
      assert.ok(stock.key);
      await shot('scene-meowth-shop');
      await tap('.shop-modal .cards > button');
      const purchase=await page.evaluate(key=>({count:app.run.player.items.get(key),gold:app.run.gold,sold:app.run.shop.stock[0].sold}),stock.key);
      assert.equal(purchase.count,stock.before+1);assert.equal(purchase.gold,stock.gold-stock.price);assert.equal(purchase.sold,true);
      await tap('.shop-exit');

      await page.evaluate(()=>{
        const r=app.run;r.player.items.clear();r.player.addItem('muscle-band');
        r.interactables.interact(r.interactables.list.find(o=>o.kind==='ditto'));
      });
      await shot('scene-ditto-copy');
      await tap('[data-choice="showDitto"] [data-offer="0"]');
      const copied=await page.evaluate(()=>({count:app.run.player.items.get('muscle-band'),used:app.run.interactables.list.find(o=>o.kind==='ditto').used}));
      assert.deepEqual(copied,{count:2,used:true});

      const forget=await page.evaluate(()=>{
        const r=app.run,p=r.player;
        // Runtime move APIs accept IDs; 33 / 55 / 52 are tackle / water-gun / ember.
        for(const move of [33,55,52])if(!p.hasMove(move)&&p.addMove(move))break;
        r.interactables.interact(r.interactables.list.find(o=>o.kind==='hypno'));
        return {count:p.moves.filter(Boolean).length,gold:r.gold,refund:p.moves.find(Boolean).level*8*r.stage};
      });
      assert.ok(forget.count>=2,'Forget interaction requires at least two moves');
      await shot('scene-hypno-forget');
      await tap('.shop-modal .item-row button');
      const forgotten=await page.evaluate(()=>({count:app.run.player.moves.filter(Boolean).length,gold:app.run.gold}));
      assert.equal(forgotten.count,forget.count-1);assert.equal(forgotten.gold,forget.gold+forget.refund);
      await tap('.shop-exit');
      report.npcs={purchase:{...stock,...purchase},copied,forgotten};

      await page.evaluate(()=>{
        const r=app.run;window.sceneTestCursed=r.interactables.list.find(o=>o.kind==='cursedchest');
        r.interactables.interact(sceneTestCursed);
      });
      await page.waitForFunction(()=>!!inspected.doc.querySelector('.zx-item-dialog'),{timeout:45000});
      report.cursedChest=await page.evaluate(()=>({used:sceneTestCursed.used,hasDifficulty:app.run.tempMods.some(m=>m.stat==='difficulty'&&m.mul===1.05),rewardVisible:!!inspected.doc.querySelector('.zx-item-dialog')}));
      assert.deepEqual(report.cursedChest,{used:true,hasDifficulty:true,rewardVisible:true});
      await shot('scene-cursed-chest-retained');
      await page.evaluate(()=>{app.run.ui.hideModal();app.run.state='paused';});
    }
    if(stage===1||stage===3) {
      const portal=await page.evaluate(()=>{
        const r=app.run,o=r.interactables.spawnPortal(30,30,r.stage===3);
        return {kind:o.kind,sanct:!!o.data.sanct,marked:r.interactables.markers().some(m=>m.kind==='portal')};
      });
      assert.deepEqual(portal,{kind:'portal',sanct:stage===3,marked:true});
      (report.portals??=[]).push(portal);
    }
    if(stage===4) {
      report.sanctuaryNavigation=[];
      for(const z of [39,24,4.8]){
        await page.evaluate(z=>{
          const r=app.run;r.state='play';r.player.pos.set(0,r.terrain.surface(0,z),z);r.player.vel.set(0,0,0);
        },z);
        const handle=await page.waitForFunction(near=>{
          const r=app.run,h=r.ui,shrine=r.interactables.list.find(o=>o.kind==='shrine');
          const distance=Number(Math.hypot(r.player.pos.x-shrine.x,r.player.pos.z-shrine.z).toFixed(2));
          const tag=[h.markTag,h.arrow].find(el=>el.style.display!=='none'&&el.textContent.includes('圣地 · '+distance+' 厘米'));
          return tag&&(!near||h.touch.actText?.includes('触碰圣地'))?{distance,text:tag.textContent,visible:true,kind:h.arrow.dataset.k,prompt:h.touch.actText}:false;
        },{timeout:15000},z<5);
        const marker=await handle.jsonValue();await handle.dispose();
        report.sanctuaryNavigation.push(marker);
        await shot('sanctuary-distance-'+z);
      }
      assert.ok(report.sanctuaryNavigation[0].distance>report.sanctuaryNavigation[1].distance);
      assert.match(report.sanctuaryNavigation.at(-1).prompt,/触碰圣地/);
      await tap('.tc-act','触碰圣地');
      await page.waitForFunction(()=>app.run.bossSpawned&&app.run.boss.alive,{timeout:15000});
      await sleep(300);
      assert.equal(await page.evaluate(()=>{
        const h=app.run.ui;return [h.arrow,h.markTag].some(el=>el.style.display!=='none'&&el.textContent.includes('圣地 ·'));
      }),false,'Shrine navigation ends after summoning');
      assert.equal(await page.evaluate(()=>!!inspected.doc.querySelector('.zx-sanctuary-guide')),false);
      await shot('sanctuary-boss-summoned');
      report.sanctuary=await page.evaluate(()=>{
        const s=app.run.sanctuary;s.onPhase(2);s.onPhase(3);
        return {roots:s.roots.length,brambles:s.brambles.length,columns:s.covers.filter(c=>c.kind==='column').length};
      });
      assert.ok(report.sanctuary.roots>0&&report.sanctuary.brambles>0&&report.sanctuary.columns>0,'Sanctuary cover and phase mechanics must remain');
    }
  }
  fs.writeFileSync(path.join(dir,'scene-regression.json'),JSON.stringify(report,null,2));
  console.log('Scene removal regression passed: four zones, three NPC transactions, cursed chest and portals.');
}
