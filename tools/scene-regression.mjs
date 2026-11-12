import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const removed=['cursed','greed','porygon','snorlax','cage','rock'];
const retained=['boss','altar','challenge','fossil','rhydon','bill','nest','meowth','ditto','hypno','magnet','slots','freechest','cursedchest','berry','chest'];

// Exercise the compiled game, including dynamic placement and real NPC callbacks.
export async function reviewScenes({page,tap,dir,sleep}) {
  const report={mode:'Compiled WeChat bundle in Chrome fixture. Controlled zone traversal and isolated NPC transactions, not a natural playthrough or phone test.',removed,stages:[]};
  const shot=async name=>{await sleep(400);await page.screenshot({path:path.join(dir,name+'.png')});};
  await tap('[data-action="journey"]');
  await tap('.zx-footer button','选择关卡');
  await tap('.zx-footer button','选择难度');
  await tap('[data-action="enter"]');
  await page.waitForFunction(()=>app.run?.time>1&&app.run.state==='play',{timeout:90000});
  await page.evaluate(()=>{app.run.godMode=true;app.run.queueLevelUp=()=>{};app.run.pendingLevels=0;app.run.hints.show=()=>{};});

  for(let stage=1;stage<=4;stage++) {
    if(stage>1) {
      await page.evaluate(async()=>{app.run.ui.hideModal();app.run.state='play';await app.run.changeZone();});
      await page.waitForFunction(stage=>app.run.stage===stage&&app.run.state==='play',{timeout:90000},stage);
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
      await tap('.zx-minimap');
      assert.equal(await page.evaluate(()=>app.run.ui.mapOpen()),true);
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
