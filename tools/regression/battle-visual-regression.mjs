import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewBattleVisual(page,dir){
  const report={overlays:[]};
  report.effects=await page.evaluate(()=>{
    const run=app.run,r=app.r;app.meta.profile.settings.quality='high';app.applySettings();
    const dimensions=()=>[r.composer.inputBuffer.width,r.composer.inputBuffer.height];
    const states=[];
    for(const count of [0,179,180,150,119]){r.setCombatLoad(count);states.push({count,busy:r.combatBusy,bloom:r.bloom.intensity,dimensions:dimensions()});}
    r.setCombatLoad(420);r.setLook(false,1);app.applySettings();
    const staysBusy=r.bloom.intensity>0;r.setCombatLoad(0);
    run.director.update=()=>{};run.enemies.clear();run.capture.state='done';run.vfx.clear();
    const add=run.vfx.add,ground=run.vfx.ground,view=add.view,density=add.densityBudget;
    add.view=null;add.densityBudget=null;add.ownAreaLimit=48;add.limit=240;
    const effect={x:0,y:1,z:0,size:4,endSize:4,color:0xffa040,life:.4};
    for(let i=0;i<100;i++)add.spawn(effect);
    const saturated={count:add.n,area:add.ownArea};
    add.ownAreaLimit=16;add.trimTo(add.n);const trimmed={count:add.n,area:add.ownArea};
    add.update(1);const expired={count:add.n,area:add.ownArea,ownCount:add.ownCount};
    add.ownAreaLimit=48;add.spawn(effect);const recovered=add.n===1;
    add.spawn(effect);add.spawn(effect);add.trimTo(1);
    const countTrim={count:add.n,area:add.ownArea,ownCount:add.ownCount};
    ground.ownAreaLimit=0;ground.ownCountLimit=0;
    run.vfx.telegraph(0,0,0,4,0xff0000,2);ground.trimTo(ground.n);
    const warning=ground.n===1&&ground.ownCount===0;
    add.view=view;add.densityBudget=density;run.vfx.clear();app.applySettings();
    return {states,staysBusy,saturated,trimmed,expired,recovered,countTrim,warning};
  });
  assert.deepEqual(report.effects.states.map(s=>s.busy),[false,false,false,false,false]);
  assert.ok(report.effects.states.every(s=>s.bloom>0));
  assert.ok(report.effects.states.every(s=>JSON.stringify(s.dimensions)===JSON.stringify(report.effects.states[0].dimensions)));
  assert.ok(report.effects.staysBusy&&report.effects.recovered&&report.effects.warning);
  assert.equal(report.effects.saturated.area,48);assert.equal(report.effects.trimmed.area,16);
  assert.deepEqual(report.effects.expired,{count:0,area:0,ownCount:0});
  assert.deepEqual(report.effects.countTrim,{count:1,area:16,ownCount:1});
  report.boundsReuse=await page.evaluate(()=>{
    const env=inspected.env,renderer=app.r.renderer,root=inspected.doc.querySelector('[data-ui-layer="counters"]');
    app.run.ui.hud(app.run);env.drawUI(renderer);
    const boxes=[root,...root.querySelectorAll('*')].map(el=>inspected.layout.box(el)).filter(Boolean),restore=[];
    let reads=0;
    for(const box of boxes){
      const descriptor=Object.getOwnPropertyDescriptor(box,'x');let value=box.x;
      if(!descriptor?.configurable)continue;
      Object.defineProperty(box,'x',{configurable:true,get(){reads++;return value;},set(v){value=v;}});
      restore.push(()=>Object.defineProperty(box,'x',{...descriptor,value}));
    }
    try{for(let frame=0;frame<30;frame++)env.drawUI(renderer);return {boxes:boxes.length,reads};}
    finally{restore.forEach(f=>f());}
  });
  assert.ok(report.boundsReuse.boxes>0);assert.equal(report.boundsReuse.reads,0,'Unchanged HUD tiles reuse their bounds');
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:3});
    await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
    const sample=await page.evaluate(async()=>{
      const run=app.run,env=inspected.env,doc=inspected.doc,r=app.r;
      run.ui.popupRoot.replaceChildren();run.ui.pins.forEach(p=>p.style.display='none');run.ui.markTag.style.display='none';
      const marker=run.ui.arrow;marker.style.cssText='position:absolute;display:block;left:160px;top:360px';
      const popup=doc.createElement('div');popup.className='popup';popup.style.cssText='position:absolute;left:160px;top:300px;color:#d06020;font-size:20px';popup.textContent='效果绝佳';run.ui.popupRoot.append(popup);
      const draw=()=>{run.renderWorld(0);r.render(0);env.drawUI(r.renderer);};
      const read=()=>{const gl=r.renderer.getContext(),data=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,data);return data;};
      env.invalidateUI();await new Promise(r=>setTimeout(r,100));draw();
      const before=auditUIUploads;
      for(let i=0;i<5;i++){
        marker.style.left=(130+i*5)+'px';marker.children[2].textContent=(25+i)+' 米';
        popup.style.top=(300-i*3)+'px';popup.textContent='效果绝佳 '+i;
        await new Promise(r=>setTimeout(r,100));draw();
      }
      const fullUploads=auditUIUploads-before,local=read();
      const roots=[...doc.querySelectorAll('[data-ui-layer="markers"],[data-ui-layer="notices"]')];
      roots.forEach(el=>el.removeAttribute('data-ui-layer'));env.invalidateUI();draw();
      const full=read();let changed=0,sum=0;
      for(let i=0;i<full.length;i+=4){let d=0;for(let c=0;c<3;c++)d+=Math.abs(full[i+c]-local[i+c]);sum+=d;if(d>30)changed++;}
      roots.forEach((el,i)=>el.dataset.uiLayer=i?'notices':'markers');env.invalidateUI();draw();
      const markerBox=inspected.layout.box(marker),popupBox=inspected.layout.box(popup);
      const tiles=inspected.hudLayers.filter(l=>l.owns(marker)||l.owns(popup)).map(l=>l.canvas&&[l.canvas.width,l.canvas.height]);
      const removeBefore=auditUIUploads;popup.remove();marker.style.display='none';await new Promise(r=>setTimeout(r,100));draw();
      const removedUploads=auditUIUploads-removeBefore;
      return {fullUploads,removedUploads,meanPixelDifference:sum/(full.length/4*3),changedFraction:changed/(full.length/4),
        marker:[markerBox.x,markerBox.y],popup:[popupBox.x,popupBox.y],tiles};
    });
    assert.equal(sample.fullUploads,0);assert.equal(sample.removedUploads,0);
    assert.equal(sample.tiles.length,2);
    assert.ok(sample.changedFraction<.005,JSON.stringify(sample));
    report.overlays.push({width,height,...sample});
    await page.screenshot({path:path.join(dir,`overlay-${width}.png`)});
  }
  fs.writeFileSync(path.join(dir,'battle-visual.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
