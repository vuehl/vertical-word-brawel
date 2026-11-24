import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewMapWind(page,dir){
  const report={maps:[],damage:[],environment:'Compiled WeChat package in Chrome; simulated touch and combat.'};
  const draw=()=>page.evaluate(()=>{app.run.renderWorld(0);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);});
  const tap=async selector=>{
    const point=await page.evaluate(selector=>{
      const b=inspected.doc.querySelector(selector).getBoundingClientRect(),s=inspected.doc.getElementById('game').getBoundingClientRect();
      return {x:b.x+b.width/2-s.x,y:b.y+b.height/2-s.y};
    },selector);
    await page.touchscreen.tap(point.x,point.y);await draw();
  };
  const camera=await page.evaluate(async()=>{
    const run=app.run,facilities=run.interactables;
    const camera=facilities.list.find(f=>f.kind==='ditto');
    await camera.modelReady;
    const player=run.player,position=player.pos.clone();
    const key='razor-claw',before=player.items.get(key)??0;
    player.addItem(key);
    player.pos.set(camera.x,camera.y,camera.z);
    for(let i=0;i<90;i++)facilities.update(0,1/60);
    const dialog=run.ui.modalEl.querySelector('[data-choice="showDitto"]');
    const title=dialog.querySelector('h2').textContent;
    const index=[...player.items.keys()].indexOf(key);
    dialog.querySelector('[data-offer="'+index+'"]').click();
    const result={title,visible:!!camera.model,used:camera.used,copied:player.items.get(key)===before+2,state:run.state};
    player.removeItem(key);player.removeItem(key);
    player.pos.copy(position);
    return result;
  });
  assert.deepEqual(camera,{title:'拍立得 · 选择要复制的道具',visible:true,used:true,copied:true,state:'play'});
  await page.evaluate(()=>{
    const r=app.run,p=r.player.pos;
    const kinds=['chest','freechest','altar','boss','portal','magnet','berry','ditto','nest','bill'];
    const markers=kinds.map((kind,i)=>({kind,x:p.x+Math.cos(i/kinds.length*Math.PI*2)*36,z:p.z+Math.sin(i/kinds.length*Math.PI*2)*36}));
    markers.push({kind:'chest',data:{gift:true},x:p.x-5,z:p.z+7});
    r.interactables.markers=()=>markers;
    window.mapNames=['红骰子','免费蓝骰子','时尚小垃圾','传送门','门？','磁铁','QQ糖','拍立得','鹌鹑蛋','订书机'];
  });
  const compact=process.argv.includes('--map-compact');
  for(const [width,height] of (compact?[[320,568]]:[[320,568],[390,844],[430,932]])){
    await page.setViewport({width,height,deviceScaleFactor:3});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
    await draw();await tap('.zx-minimap');
    await page.evaluate(()=>{
      const canvas=inspected.doc.querySelector('.zx-battle-map-art'),ctx=canvas.getContext('2d'),fill=ctx.fillText.bind(ctx);
      window.drawnNames=[];
      ctx.fillText=(name,...args)=>{if(mapNames.includes(name))drawnNames.push(name);return fill(name,...args);};
    });
    await tap('[data-map-filter="all"]');
    const layout=await page.evaluate(()=>{
      const box=node=>{const b=node.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height};};
      return {modal:box(inspected.doc.querySelector('.zx-battle-map')),buttons:[...inspected.doc.querySelectorAll('[data-map-filter],[data-action="close-battle-map"]')].map(box),names:[...new Set(drawnNames)],state:app.run.state};
    });
    assert.equal(layout.state,'paused');assert.equal(layout.names.length,10);
    for(const b of layout.buttons)assert.ok(b.w>0&&b.h>=30&&b.x>=0&&b.x+b.w<=width+1&&b.y>=0&&b.y+b.h<=height+1,JSON.stringify({width,b}));
    const close=layout.buttons.at(-1);assert.ok(close.y+close.h<=layout.modal.y+layout.modal.h-6,JSON.stringify(layout));
    console.log('Map controls fit at '+width+'px.');
    await page.screenshot({path:path.join(dir,`map-names-${width}.png`)});
    for(const [kind,name] of [['chest','红骰子'],['freechest','免费蓝骰子'],['altar','时尚小垃圾'],['boss','传送门'],['portal','门？'],['magnet','磁铁'],['berry','QQ糖'],['ditto','拍立得'],['nest','鹌鹑蛋'],['bill','订书机']]){
      await page.evaluate(()=>drawnNames.length=0);
      await tap(`[data-map-filter="${kind}"]`);
      const filtered=await page.evaluate(()=>({names:[...new Set(drawnNames)],filter:inspected.doc.querySelector('.zx-battle-map-art').dataset.filter,selected:inspected.doc.querySelectorAll('.zx-map-filter.on').length,tracked:app.run.ui.mapFacilityKind}));
      assert.deepEqual(filtered,{names:[name],filter:kind,selected:1,tracked:kind});
    }
    await tap('[data-map-filter="freechest"]');await page.screenshot({path:path.join(dir,`map-filter-${width}.png`)});
    await tap('[data-map-filter="all"]');
    const mapBox=await page.evaluate(()=>{const b=inspected.doc.querySelector('.zx-battle-map-art').getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2};});
    await page.touchscreen.touchStart(mapBox.x,mapBox.y);await page.touchscreen.touchMove(mapBox.x+60,mapBox.y+40);await page.touchscreen.touchEnd();
    await draw();assert.equal(await page.evaluate(()=>inspected.doc.querySelector('.zx-battle-map-art').dataset.filter),'all');
    await tap('[data-action="close-battle-map"]');assert.equal(await page.evaluate(()=>app.run.state),'play');
    // Map opened from pause returns to pause, and reopening starts at All.
    await page.evaluate(()=>{app.run.pause();app.run.ui.showMap(app.run,true);});await draw();
    assert.equal(await page.evaluate(()=>inspected.doc.querySelector('.zx-battle-map-art').dataset.filter),'all');
    await tap('[data-action="close-battle-map"]');assert.equal(await page.evaluate(()=>app.run.state),'paused');
    await page.evaluate(()=>app.run.resume());report.maps.push({width,height,...layout});
  }
  if(compact){
    fs.writeFileSync(path.join(dir,'map-compact.json'),JSON.stringify(report,null,2));
    console.log('Compact map layout and all ten filters verified.');return;
  }
  await page.evaluate(async()=>{await app.startRun({species:16,biome:'forest',tier:0,boosts:[],mode:'standard'});app.halted=true;});
  report.damage=await page.evaluate(()=>{
    const r=app.run,p=r.player,results=[];
    r.director.update=()=>{};r.pendingLevels=0;r.godMode=true;r.hitstop=()=>{};
    p.moves.fill(null);p.items.clear();p.vitamins.clear();p.buffs.clear();p.ability='none';
    const target=r.enemies.spawn(19,p.pos.x+4,p.pos.z,1,1,0);
    r.enemies.hp[target]=r.enemies.maxHp[target]=1e7;
    const hit=()=>{p.stats.critChance=p.stats.megaCrit=0;return r.combat.hit(target,100,{type:'normal',cls:'physical',noReact:true,silent:true});};
    for(const id of [16,17,18,58,59]){
      p.setSpecies(id);p.ability='none';r.tempMods=[];p.buffs.clear();p.recompute();
      const base=p.stats.damage,before=hit();
      r.tempMods=[{stat:'moveSpeed',mul:1.2}];p.recompute();const boosted={stat:p.stats.damage/base,hit:hit()/before};
      p.recompute();const repeat=p.stats.damage/base;
      r.tempMods=[];p.recompute();const removed=p.stats.damage/base;
      if(id===59){
        r.ult.charge=1;r.ult.fire();for(let i=0;i<3;i++)r.update(1/60);
        const active={speed:p.stats.moveSpeed/p.baseSpeed,stat:p.stats.damage/base,hit:hit()/before};
        r.state='paused';r.update(2);const paused=p.stats.damage/base;r.state='play';
        r.ult.def.cast({run:r});const refresh=p.stats.damage/base;
        for(let i=0;i<310;i++)p.update(1/60);
        results.push({id,boosted,repeat,removed,active,paused,refresh,expired:p.stats.damage/base});
      }else results.push({id,boosted,repeat,removed});
    }
    return results;
  });
  const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<.001,`${actual} != ${expected}`);
  for(const sample of report.damage){
    const expected=[58,59].includes(sample.id)?1.1:1;
    near(sample.boosted.stat,expected);near(sample.boosted.hit,expected);near(sample.repeat,expected);near(sample.removed,1);
    if(sample.id===59){near(sample.active.speed,10);near(sample.active.stat,5.5);near(sample.active.hit,5.5);near(sample.paused,5.5);near(sample.refresh,5.5);near(sample.expired,1);}
  }
  fs.writeFileSync(path.join(dir,'map-wind.json'),JSON.stringify(report,null,2));
  console.log('Map names, ten filters, three phone sizes and movement-passive combat verified.');
}
