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
  await page.setViewport({width:320,height:568,deviceScaleFactor:3});
  const inventory=await page.evaluate(async()=>{
    const r=app.run,p=r.player,f=r.interactables,camera=f.list.find(building=>building.kind==='ditto');
    await camera.modelReady;
    window.cameraStart={position:p.pos.clone(),time:r.time,items:new Map(p.items)};
    for(const key of ['razor-claw','stick','big-root','bicycle','repel','smoke-ball','honey','lucky-punch'])p.addItem(key);
    for(let copy=0;copy<12;copy++)if(!p.addItem('stick'))throw Error('Could not stack sticks');
    p.pos.set(camera.x,camera.y,camera.z);
    f.update(0,0);
    await new Promise(resolve=>setTimeout(resolve,f.dwellDuration*1000));
    f.update(0,f.dwellDuration);
    return [...p.items.keys()].filter(key=>key!=='air-balloon');
  });
  await draw();
  const copyLayout=()=>page.evaluate(()=>{
    const modal=app.run.ui.modalEl,list=modal.querySelector('.zx-item-body'),close=modal.querySelector('.paper-dismiss-button');
    return {title:modal.querySelector('h1').textContent,keys:[...list.children].map(card=>card.dataset.itemChoice),
      full:list.querySelector('[data-item-choice="stick"]').disabled,team:!!modal.querySelector('.pk-btn'),
      close:close.getBoundingClientRect(),list:list.getBoundingClientRect(),offset:list.scrollTop,max:list.scrollHeight-list.clientHeight,
      outside:!list.contains(close)};
  });
  const before=await copyLayout();
  assert.equal(before.title,'道具复制');assert.deepEqual(before.keys,inventory);
  const artwork=await page.evaluate(()=>{
    const modal=app.run.ui.modalEl,style=inspected.env.getComputedStyle;
    return {subtitle:!!modal.querySelector('.zx-paper-upgrade-head small'),
      cards:[...modal.querySelectorAll('[data-item-choice]')].map(card=>{
        const picture=card.querySelector('.zx-item-image'),name=card.querySelector('.zx-pick-name>b');
        const box=picture.getBoundingClientRect(),key=card.dataset.itemChoice;
        return {key,loaded:picture.complete&&picture.naturalWidth>0&&picture.src.includes('/items/'+key+'.png'),
          iconOnLeft:box.width>0&&box.right<=card.querySelector('.zx-pick-copy').getBoundingClientRect().left,
          opacity:Number(style(card).opacity||1),quality:card.dataset.quality,ink:style(name).color};
      })};
  });
  assert.equal(artwork.subtitle,false);
  for(const card of artwork.cards){
    assert.ok(card.loaded&&card.iconOnLeft,JSON.stringify(card));
    if(card.quality==='rare'){assert.equal(card.opacity,1);assert.equal(card.ink.toLowerCase(),'#244e7e');}
  }
  assert.ok(!before.full&&!before.team&&before.outside&&before.max>0&&before.close.height>0&&before.close.y>=before.list.bottom);
  const origin=await page.evaluate(()=>inspected.doc.getElementById('game').getBoundingClientRect());
  const x=before.list.x+before.list.width/2-origin.x,y=before.list.bottom-12-origin.y;
  await page.screenshot({path:path.join(dir,'polaroid-inventory.png')});
  await page.touchscreen.touchStart(x,y);await page.touchscreen.touchMove(x,y-120);await page.touchscreen.touchEnd();
  await draw();
  const after=await copyLayout();
  assert.ok(after.offset>before.offset);assert.deepEqual(after.close,before.close);
  await tap('.zx-review-copy .paper-dismiss-button');
  const canceled=await page.evaluate(()=>{
    const run=app.run,f=run.interactables,camera=f.list.find(b=>b.kind==='ditto');
    const result={state:run.state,used:camera.used};f.interact(camera);return result;
  });
  assert.deepEqual(canceled,{state:'play',used:false});await draw();
  const quantity=await page.evaluate(()=>app.run.player.items.get('stick'));
  await tap('.zx-review-copy [data-item-choice="stick"]');
  const copied=await page.evaluate(()=>{
    const r=app.run,p=r.player,f=r.interactables,camera=f.list.find(b=>b.kind==='ditto');
    const result={count:p.items.get('stick'),seconds:camera.data.regenAt-r.time,used:camera.used};
    r.time=camera.data.regenAt-.01;f.update(0,0);f.interact(camera);result.beforeExpiry=r.state;
    r.time+=.01;f.update(0,0);f.interact(camera);result.reopened=!!r.ui.modalEl?.querySelector('.zx-item-body');
    r.ui.modalEl?.querySelector('.paper-dismiss-button')?.click();
    p.pos.copy(cameraStart.position);r.time=cameraStart.time;p.items=new Map(cameraStart.items);p.recompute();
    return result;
  });
  assert.deepEqual(copied,{count:quantity+1,seconds:60,used:true,beforeExpiry:'play',reopened:true});
  console.log('Polaroid inventory, touch scrolling, fixed close and 60-second cooldown verified.');
  if(process.argv.includes('--polaroid'))return;
  await page.evaluate(()=>{
    const r=app.run,p=r.player.pos;
    const kinds=['chest','freechest','altar','boss','portal','magnet','berry','ditto','nest','bill'];
    const markers=kinds.map((kind,i)=>({kind,x:p.x+Math.cos(i/kinds.length*Math.PI*2)*36,z:p.z+Math.sin(i/kinds.length*Math.PI*2)*36}));
    markers.push({kind:'chest',data:{gift:true},x:p.x-5,z:p.z+7});
    r.interactables.markers=()=>markers;
    window.mapNames=['红骰子','免费蓝骰子','时尚小垃圾','传送门','门','磁铁','QQ糖','拍立得','鹌鹑蛋','订书机'];
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
    for(const [kind,name] of [['chest','红骰子'],['freechest','免费蓝骰子'],['altar','时尚小垃圾'],['boss','传送门'],['portal','门'],['magnet','磁铁'],['berry','QQ糖'],['ditto','拍立得'],['nest','鹌鹑蛋'],['bill','订书机']]){
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
    const expected=[58,59].includes(sample.id)?1+1/15:1;
    near(sample.boosted.stat,expected);near(sample.boosted.hit,expected);near(sample.repeat,expected);near(sample.removed,1);
    if(sample.id===59){
      const damage=1+.4*(1-1/3);
      near(sample.active.speed,3);near(sample.active.stat,damage);near(sample.active.hit,damage);near(sample.paused,damage);near(sample.refresh,damage);near(sample.expired,1);
    }
  }
  fs.writeFileSync(path.join(dir,'map-wind.json'),JSON.stringify(report,null,2));
  console.log('Map names, ten filters, three phone sizes and movement-passive combat verified.');
}
