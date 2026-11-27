import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewBattleLabels(page,dir){
  await page.evaluate(async()=>{
    const r=app.run;app.halted=true;r.state='play';r.godMode=true;
    r.enemies.clear();r.vfx.clear();r.timers.length=0;r.anims.length=0;
    r.capture.state='done';r.capture.index=-1;
    r.ui.endCinematic();r.ui.clearWorldNotices();
    const altar=r.interactables.list.find(a=>a.kind==='altar'&&!a.used);
    await altar.modelReady;
    r.player.pos.set(altar.x-3,altar.y,altar.z+3);
    r.camTarget.copy(r.player.pos);r.updateCamera(1);
    window.labelReview={r,altar,frame(){
      r.renderWorld(0);r.ui.hud(r);app.r.render(0);
      inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    }};
  });
  const report={altars:[],distances:[],arrivals:[]};
  for(const charge of [0,.01,.5,.83,.999]){
    await new Promise(resolve=>setTimeout(resolve,120));
    const sample=await page.evaluate(charge=>{
      const {r,altar,frame}=labelReview;
      altar.charge=charge;altar.charging=true;
      altar.model.userData.setVisualState('charging',.2);frame();
      const label=r.ui.worldLabelNodes.get(altar),box=label.getBoundingClientRect();
      const top=altar.model.localToWorld(altar.model.userData.labelAnchor.clone());
      const anchor=r.ui.project(r,top.x,top.y,top.z);
      return {charge,text:label.getAttribute('aria-valuetext'),size:[box.width,box.height],gap:anchor.y-box.bottom,ring:altar.chargeRing.visible};
    },charge);
    assert.equal(sample.text,Math.floor(charge*100)+'%');assert.ok(sample.ring&&sample.gap>=5);
    assert.deepEqual(sample.size,[48,48]);
    report.altars.push(sample);
    if(charge===.83){
      await page.screenshot({path:path.join(dir,'altar-circle-83-percent.png')});
      const clip=await page.evaluate(()=>{
        const {r,altar}=labelReview,box=r.ui.worldLabelNodes.get(altar).getBoundingClientRect();
        const screen=r.r.canvas.getBoundingClientRect();
        return {x:Math.max(0,Math.min(innerWidth-220,box.left+box.width/2-screen.left-110)),
          y:Math.max(0,Math.min(innerHeight-230,box.top-screen.top-12)),width:220,height:230};
      });
      await page.screenshot({path:path.join(dir,'altar-circle-detail.png'),clip});
    }
  }
  report.movingAltar=await page.evaluate(async()=>{
    const {r,altar,frame}=labelReview;
    r.performance={...r.performance,hudInterval:0};frame();
    // Exercise the intervening camera frames while the HUD text is throttled.
    r.performance.hudInterval=1e9;
    let maxError=0,updates=0,lastX;const samples=[];
    for(let i=0;i<32;i++){
      r.player.pos.set(altar.x-3+i*6/31,altar.y,altar.z+3);
      r.camTarget.copy(r.player.pos);r.updateCamera(1);r.renderWorld(0);r.ui.hud(r);app.r.render(0);
      await Promise.resolve();inspected.env.drawUI(app.r.renderer);
      const label=r.ui.worldLabelNodes.get(altar),box=label.getBoundingClientRect();
      const top=altar.model.localToWorld(altar.model.userData.labelAnchor.clone());
      const anchor=r.ui.project(r,top.x,top.y,top.z);
      maxError=Math.max(maxError,Math.abs(box.left+box.width/2-anchor.x),Math.abs(box.bottom-(anchor.y-6)));
      if(i<2||i===31)samples.push({style:label.style.cssText,box:{x:box.left,y:box.top},anchor,layer:label.parentElement.dataset.uiLayer});
      if(lastX!==undefined&&box.left!==lastX)updates++;lastX=box.left;
    }
    r.performance.hudInterval=0;
    return {maxError,updates,samples};
  });
  assert.ok(report.movingAltar.maxError<.6&&report.movingAltar.updates>20,JSON.stringify(report.movingAltar));
  report.completed=await page.evaluate(()=>{
    const {r,altar,frame}=labelReview,offer=r.offerBlessing;
    let cleanAtReward=false;
    r.offerBlessing=()=>{cleanAtReward=!altar.chargeRing.visible&&!r.ui.worldLabelNodes.has(altar);};
    try{r.interactables.altarDone(altar,altar.data.tier);frame();}
    finally{r.offerBlessing=offer;}
    return {cleanAtReward,charge:altar.charge,ring:altar.chargeRing.visible,label:r.ui.worldLabelNodes.has(altar)};
  });
  assert.deepEqual(report.completed,{cleanAtReward:true,charge:1,ring:false,label:false});
  await page.screenshot({path:path.join(dir,'altar-completed-no-ring.png')});
  for(const state of ['idle','used','paused']){
    await new Promise(resolve=>setTimeout(resolve,120));
    assert.equal(await page.evaluate(state=>{
      const {r,altar,frame}=labelReview;
      altar.charging=state!=='idle';altar.used=state==='used';r.state=state==='paused'?'paused':'play';frame();
      return r.ui.worldLabelNodes.get(altar)?.classList.contains('altar-progress')??false;
    },state),false,'Progress clears on '+state);
  }
  for(const kind of ['elite','capture','boss']){
    await new Promise(resolve=>setTimeout(resolve,120));
    const sample=await page.evaluate(async kind=>{
      const {r,altar,frame}=labelReview;r.state='play';altar.used=false;altar.charging=false;
      r.capture.state='done';r.capture.index=-1;
      const x=r.player.pos.x+7,z=r.player.pos.z;
      r.ui.bigBanners=false;
      if(kind==='elite')r.minibosses.spawnTotem(3,{x,z});
      else if(kind==='capture'){
        r.capture.spawnClassic(r.captureTarget);
        if(r.capture.index<0)throw Error('Capture target did not spawn');
        r.enemies.x[r.capture.index]=x;r.enemies.z[r.capture.index]=z;
      }
      else {r.introBoss=()=>{};r.boss.spawn(149,x,z,false,{hp:1e6});}
      const id=kind==='elite'?r.minibosses.lastIndex:kind==='capture'?r.capture.index:r.boss.bossIndex;
      await r.sprites.prepareGlyphTextures(app.r.renderer);frame();
      const marker=r.ui.arrow,control=r.ui.touch.ult.getBoundingClientRect(),box=marker.children[2].getBoundingClientRect();
      const near={kind,text:marker.children[2].textContent,visible:marker.style.display!=='none',side:marker.dataset.side,
        x:parseFloat(marker.style.left),y:parseFloat(marker.style.top),expectedX:inspected.env.innerWidth-44,
        clearOfControls:box.bottom<control.top||parseFloat(marker.style.top)-32>control.bottom+14+62,
        control:{width:control.width,top:control.top,bottom:control.bottom},box:{top:box.top,bottom:box.bottom}};
      labelReview.enemy=id;return near;
    },kind);
    assert.ok(sample.visible&&sample.side==='right',JSON.stringify(sample));
    assert.equal(sample.x,sample.expectedX);assert.ok(sample.clearOfControls,JSON.stringify(sample));
    assert.match(sample.text,kind==='capture'?/米/:/厘米/);report.distances.push(sample);
    await page.screenshot({path:path.join(dir,kind+'-distance-right.png')});
    const moves=await page.evaluate(()=>{
      const {r,enemy,frame}=labelReview,marker=r.ui.arrow,samples=[];
      for(const [dx,dz] of [[7,20],[70,-70],[1000,0],[.3,30],[-.3,-30],[-7,0],[-1000,100]]){
        r.enemies.x[enemy]=r.player.pos.x+dx;r.enemies.z[enemy]=r.player.pos.z+dz;frame();
        samples.push({side:marker.dataset.side,x:parseFloat(marker.style.left),y:parseFloat(marker.style.top),text:marker.children[2].textContent,
          visible:marker.style.display!=='none',tag:r.ui.markTag.style.display});
      }
      return samples;
    });
    for(let i=0;i<moves.length;i++){
      assert.equal(moves[i].side,i<5?'right':'left');
      assert.equal(moves[i].x,i<5?sample.x:44);assert.equal(moves[i].y,sample.y);
      assert.ok(moves[i].visible&&moves[i].tag==='none');
    }
    assert.ok(new Set(moves.map(m=>m.text)).size>3,'Distance keeps updating in its fixed slot');
    report.distances.push({kind,moves});
    await page.screenshot({path:path.join(dir,kind+'-distance-left.png')});
    if(kind==='elite'){
      report.tracking=await page.evaluate(()=>{
        const {r,enemy,frame}=labelReview;
        r.minibosses.spawnSummoner(9,{x:r.player.pos.x+2,z:r.player.pos.z});frame();
        const locked=r.ui.guideEncounter.i===enemy;
        r.enemies.alive[enemy]=0;frame();
        return {locked,replaced:r.ui.guideEncounter.i!==enemy,side:r.ui.arrow.dataset.side};
      });
      assert.deepEqual(report.tracking,{locked:true,replaced:true,side:'right'});
    }
  }
  await new Promise(resolve=>setTimeout(resolve,120));
  assert.equal(await page.evaluate(()=>{
    const {r,enemy,frame}=labelReview;r.enemies.x[enemy]+=1000;frame();
    return r.ui.markTag.style.display==='none'&&r.ui.arrow.style.display!=='none';
  }),true,'Offscreen enemies keep their compass');
  report.sizes=[];
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:1});
    const sample=await page.evaluate(()=>{
      window.dispatchEvent(new Event('resize'));
      const {r,enemy,frame}=labelReview;
      r.enemies.x[enemy]=r.player.pos.x+7;r.enemies.z[enemy]=r.player.pos.z;
      r.updateCamera(1);frame();frame();
      const marker=r.ui.arrow,control=r.ui.touch.ult.getBoundingClientRect(),label=marker.children[2].getBoundingClientRect();
      const x=parseFloat(marker.style.left),y=parseFloat(marker.style.top);
      return {x,y,width:inspected.env.innerWidth,height:inspected.env.innerHeight,
        clear:label.bottom<control.top||y-32>control.bottom+14+62,
        inside:label.left>=0&&label.right<=inspected.env.innerWidth&&y-32>=0&&label.bottom<=inspected.env.innerHeight};
    });
    assert.equal(sample.x,sample.width-44);assert.ok(sample.clear&&sample.inside,JSON.stringify(sample));
    report.sizes.push(sample);
    await page.screenshot({path:path.join(dir,'fixed-distance-'+width+'.png')});
  }
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));labelReview.r.updateCamera(1);labelReview.frame();});
  for(const state of ['play','cinematic']){
    await page.evaluate(state=>{
      const {r}=labelReview;r.state=state;
      r.ui.bossIntro(3,false,1.4,'森',state==='play'?'精英':'BOSS');
    },state);
    await new Promise(resolve=>setTimeout(resolve,350));
    const sample=await page.evaluate(()=>{
      const {r}=labelReview,gl=app.r.renderer.getContext();
      r.renderWorld(0);app.r.render(0);
      const layer=inspected.hudLayers.find(x=>x.id==='boss-arrival');
      const image=gl.texImage2D,sub=gl.texSubImage2D,draw=gl.drawArrays;
      let arrivalTexture,lastTexture,draws=0;
      const upload=original=>function(...args){
        if(args.at(-1)===layer.canvas)arrivalTexture=gl.getParameter(gl.TEXTURE_BINDING_2D);
        return original.apply(this,args);
      };
      gl.texImage2D=upload(image);gl.texSubImage2D=upload(sub);
      gl.drawArrays=function(...args){draws++;lastTexture=gl.getParameter(gl.TEXTURE_BINDING_2D);return draw.apply(this,args);};
      try{
        inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
        return {state:r.state,draws,top:!!arrivalTexture&&lastTexture===arrivalTexture};
      }finally{gl.texImage2D=image;gl.texSubImage2D=sub;gl.drawArrays=draw;}
    });
    assert.ok(sample.top&&sample.draws>1,JSON.stringify(sample));report.arrivals.push(sample);
    await page.screenshot({path:path.join(dir,state+'-arrival-top.png')});
  }
  await new Promise(resolve=>setTimeout(resolve,1500));
  assert.equal(await page.evaluate(()=>{
    labelReview.frame();return !!inspected.doc.querySelector('.zx-review-arrival');
  }),false,'Arrival is removed after the cut-in');
  fs.writeFileSync(path.join(dir,'battle-labels-report.json'),JSON.stringify(report,null,2));
  console.log('Battle labels and final WebGL arrival layer verified',JSON.stringify(report));
}
