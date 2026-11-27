import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function verifyCarriedMarble(page, dir) {
  const viewport=page.viewport();
  const motion=await page.evaluate(viewport=>{
    const r=app.run;app.halted=true;r.godMode=true;
    const nest=r.interactables.list.find(f=>f.kind==='nest');
    r.player.pos.set(nest.x,nest.y,nest.z);r.interactables.update(1/30);
    if(!r.egg)throw Error('Marble was not picked up');
    const beforeTick=r.egg.floatTime??0;
    r.simulate(1/30);
    const tickAdvance=(r.egg.floatTime??0)-beforeTick;
    const p=r.player, start=p.pos.clone(), projected=p.pos.clone(), samples=[];
    const screenY=(x,y,z)=>(1-projected.set(x,y,z).project(r.r.camera).y)*viewport.height/2;
    const position=time=>({x:start.x+Math.min(time,1)*7,
      y:start.y+(time>.4&&time<1.4?2*Math.sin((time-.4)*Math.PI):0),
      z:start.z-Math.min(time,1)*3});
    for(const fps of [30,60,120]) {
      const angle=Math.atan2(3,-7);
      Object.assign(r.egg,{floatShown:0,followAngle:angle,followPrevious:angle,followTarget:angle,followShown:angle,followTurn:1});
      p.pos.copy(start);p.motionView.reset(start.x,start.y,start.z);
      for(let frame=0;frame<fps*2;frame++) {
        const tick=Math.floor(frame*30/fps),previous=tick/30,current=(tick+1)/30;
        r.egg.floatPrevious=previous;r.egg.floatTime=current;
        const from=position(previous),to=position(current);
        p.facing.set(Math.cos(frame),Math.sin(frame));
        p.pos.set(to.x,to.y,to.z);p.motionView.reset(from.x,from.y,from.z);
        p.motionView.capture(p.pos);r.renderAlpha=fps===30?1:(frame*30/fps)%1;
        r.updateCamera(0);r.renderWorld(0);
        r.r.camera.updateMatrixWorld();
        const shown=r.visiblePlayerPosition(),a=r.carriedMarble.A;
        const time=previous+(current-previous)*r.renderAlpha;
        const heroScreenY=screenY(shown.x,shown.y,shown.z),marbleScreenY=screenY(a[0],a[1],a[2]);
        const shadows=r.sprites.shadows,shadowData=shadows.a.array;
        let shadowCount=0;
        for(let i=0;i<shadows.count;i++)if(Math.abs(shadowData[i*4]-a[0])<.0001&&
          Math.abs(shadowData[i*4+2]-a[2])<.0001)shadowCount++;
        samples.push({fps,time,offset:a[0]-shown.x,back:a[2]-shown.z,
          trailingDot:((a[0]-shown.x)*7-(a[2]-shown.z)*3)/Math.hypot(7,3),
          hover:a[1]-shown.y-1.9,jump:shown.y-start.y,
          screenOffsetY:marbleScreenY-heroScreenY,
          hoverPixels:marbleScreenY-screenY(a[0],shown.y+1.9,a[2]),
          shadowCount,count:r.carriedMarble.mesh.count,size:a[3],rotation:r.carriedMarble.C[1]});
      }
    }
    const shownHover=r.egg.y-r.visiblePlayerPosition().y-1.9;
    r.renderAlpha=1;r.state='paused';r.renderWorld(0);
    const stopped={x:r.egg.x-p.pos.x,z:r.egg.z-p.pos.z,count:r.carriedMarble.mesh.count};
    let pauseStable=true;
    for(const state of ['paused','modal']) {
      r.state=state;
      for(let frame=0;frame<12;frame++) {
        r.renderAlpha=(frame%4)/4;r.renderWorld(0);
        pauseStable&&=Math.abs(r.egg.y-p.pos.y-1.9-shownHover)<1e-9&&r.carriedMarble.mesh.count===1&&
          Math.abs(r.egg.x-p.pos.x-stopped.x)<1e-9&&Math.abs(r.egg.z-p.pos.z-stopped.z)<1e-9;
      }
    }
    p.pos.set(start.x+20,start.y+2,start.z-10);r.renderWorld(0);
    const teleported=Math.abs(r.egg.x-p.pos.x-stopped.x)<1e-9&&Math.abs(r.egg.z-p.pos.z-stopped.z)<1e-9&&
      Math.abs(r.egg.y-p.pos.y-1.9-shownHover)<1e-9;
    p.pos.copy(start);r.state='play';r.renderAlpha=1;p.motionView.reset(start.x,start.y,start.z);r.updateCamera(0);r.renderWorld(0);
    app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    return {samples,stopped,tickAdvance,pauseStable,teleported,groundRemoved:!nest.group.parent,viewport};
  },viewport);
  assert.ok(motion.groundRemoved&&motion.teleported&&motion.pauseStable);
  assert.ok(Math.abs(motion.tickAdvance-1/30)<1e-9,'Gameplay ticks must advance the hover clock');
  assert.ok(Math.abs(Math.hypot(motion.stopped.x,motion.stopped.z)-3)<1e-9&&motion.stopped.count===1);
  assert.ok(motion.samples.every(s=>Math.abs(Math.hypot(s.offset,s.back)-3)<.0001&&Math.abs(s.trailingDot+3)<.0001&&
    Math.abs(s.hover-.7*Math.sin(s.time*3.6))<.0001&&s.count===1&&s.shadowCount===1&&s.rotation===0));
  assert.equal(new Set(motion.samples.map(s=>s.size)).size,1);
  for(const fps of [30,60,120]) {
    const samples=motion.samples.filter(s=>s.fps===fps),hover=samples.map(s=>s.hover);
    assert.ok(Math.max(...hover)-Math.min(...hover)>1.38,'Hover must remain clearly visible');
    const pixelSpan=key=>Math.max(...samples.map(s=>s[key]))-Math.min(...samples.map(s=>s[key]));
    // Normalize only for alternate viewport sizes; the phone fixture is 390 x 844.
    assert.ok(pixelSpan('hoverPixels')*844/viewport.height>12,'Hover must visibly travel at least 12 phone-screen pixels');
    assert.ok(pixelSpan('screenOffsetY')*844/viewport.height>12,'The marble must visibly rise and fall relative to the hero');
    assert.ok(samples.some(s=>s.jump>1.9),'Jump height must be inherited from the displayed hero');
    for(let i=1;i<samples.length;i++)
      assert.ok(Math.abs(samples[i].hover-samples[i-1].hover)<2.53/fps+.0001,'Hover must remain smooth between display frames');
    if(fps>30)assert.ok(new Set(hover.map(y=>y.toFixed(5))).size>fps*1.8,'Hover must update between physics ticks');
  }
  await page.screenshot({path:path.join(dir,'marble-floating-follow.png')});
  const hoverClock=await page.evaluate(()=>{
    const m=app.run.egg;return {floatPrevious:m.floatPrevious,floatTime:m.floatTime,floatShown:m.floatShown};
  });
  for(const [name,time] of [['high',Math.PI/(2*3.6)],['low',3*Math.PI/(2*3.6)]]) {
    await page.evaluate(time=>{
      const r=app.run,m=r.egg;m.floatPrevious=m.floatTime=m.floatShown=time;
      r.renderAlpha=1;r.updateCamera(0);r.renderWorld(0);app.r.render(0);
      inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    },time);
    await page.screenshot({path:path.join(dir,`marble-floating-${name}.png`)});
  }
  await page.evaluate(clock=>{Object.assign(app.run.egg,clock);app.run.renderWorld(0);},hoverClock);

  const trailing=await page.evaluate(()=>{
    const r=app.run,p=r.player,start=p.pos.clone(),velocity=p.vel.clone(),facing=p.facing.clone(),aim=r.lastAim.clone();
    const update=p.update,facilities=r.interactables.update,marble={...r.egg},yaw=r.camYaw;
    const directions=[],turns=[];let vx=0,vz=0;
    // Feed deterministic movement into the real simulation/egg update path.
    p.update=dt=>{p.vel.set(vx,0,vz);p.pos.x+=vx*dt;p.pos.z+=vz*dt;};
    r.interactables.update=()=>{};r.egg.need=Number.MAX_SAFE_INTEGER;
    const draw=(alpha=1,camYaw=0)=>{
      r.renderAlpha=alpha;r.updateCamera(0);r.camYaw=camYaw;r.renderWorld(0);
      const shown=r.visiblePlayerPosition(),a=r.carriedMarble.A,x=a[0]-shown.x,z=a[2]-shown.z;
      return {x,z,radius:Math.hypot(x,z),count:r.carriedMarble.mesh.count};
    };
    try {
      for(let direction=0;direction<8;direction++) {
        const angle=direction*Math.PI/4;vx=Math.cos(angle)*2;vz=Math.sin(angle)*2;
        p.pos.copy(start);p.motionView.reset(start.x,start.y,start.z);
        for(let tick=0;tick<24;tick++)r.simulate(1/30);
        const sample=draw();directions.push({...sample,direction,dot:(sample.x*vx+sample.z*vz)/2});
      }
      for(const fps of [30,60,120])for(const degrees of [90,180]) {
        p.pos.copy(start);p.motionView.reset(start.x,start.y,start.z);
        Object.assign(r.egg,{floatPrevious:0,floatTime:0,floatShown:0,followAngle:Math.PI,
          followPrevious:Math.PI,followTarget:Math.PI,followShown:Math.PI,followTurn:1});
        const samples=[draw()];let ticks=0;
        vx=degrees===90?0:-2;vz=degrees===90?2:0;
        for(let frame=0;frame<fps;frame++) {
          const tick=Math.floor(frame*30/fps);
          while(ticks<=tick){r.simulate(1/30);ticks++;}
          const sample=draw(fps===30?1:(frame*30/fps)%1);
          samples.push({...sample,dot:(sample.x*vx+sample.z*vz)/2});
        }
        // Finish the small easing tail, then stop while aim and camera change.
        vx=vz=0;
        for(let tick=0;tick<15;tick++)r.simulate(1/30);
        const stopped=draw();let idleDrift=0;
        for(let tick=0;tick<6;tick++) {
          p.facing.set(Math.cos(tick),Math.sin(tick));r.lastAim.set(Math.sin(tick),0,Math.cos(tick));
          r.simulate(1/30);
          const sample=draw(1,tick*Math.PI/3);
          idleDrift=Math.max(idleDrift,Math.hypot(sample.x-stopped.x,sample.z-stopped.z));
        }
        turns.push({fps,degrees,samples,idleDrift});
      }
    } finally {
      p.update=update;r.interactables.update=facilities;Object.assign(r.egg,marble);
      p.pos.copy(start);p.vel.copy(velocity);p.facing.copy(facing);r.lastAim.copy(aim);r.camYaw=yaw;
      p.motionView.reset(start.x,start.y,start.z);r.renderAlpha=1;r.updateCamera(0);r.renderWorld(0);
    }
    return {directions,turns};
  });
  assert.ok(trailing.directions.every(s=>Math.abs(s.radius-3)<.0001&&s.dot< -2.999&&s.count===1),
    'All eight movement directions must leave the marble three units behind the hero');
  for(const {fps,degrees,samples,idleDrift} of trailing.turns) {
    assert.ok(samples.every(s=>Math.abs(s.radius-3)<.0001&&s.count===1),'Turns must follow a circle without cutting through the hero');
    assert.ok(samples.at(-1).dot< -2.999,`${degrees}-degree turn must finish behind the new movement direction`);
    assert.ok(new Set(samples.filter(s=>s.dot> -2.95).map(s=>`${s.x.toFixed(5)},${s.z.toFixed(5)}`)).size>=5,
      'Turns must show several distinct positions along the arc');
    for(let i=1;i<samples.length;i++)assert.ok(Math.hypot(samples[i].x-samples[i-1].x,samples[i].z-samples[i-1].z)<=24/fps+.0001,
      'Angular interpolation must remain smooth on every displayed frame');
    if(fps>30)assert.ok(new Set(samples.slice(1,1+fps/4).map(s=>`${s.x.toFixed(5)},${s.z.toFixed(5)}`)).size>=fps/4-1,
      'High-refresh displays must move along the arc between physics ticks');
    assert.ok(idleDrift<.0001,'Stopping must retain the trailing direction despite aim/camera changes');
  }

  const blessing=await page.evaluate(()=>{
    const r=app.run;const altar=r.interactables.list.find(f=>f.kind==='altar');
    // Preserve the real facility callback and reward generation, selecting the
    // three reported stats deterministically only for the presentation check.
    const show=r.ui.showBlessing.bind(r.ui);
    const offers=[{label:'幸运 +18',rarity:1,mods:[{stat:'luck',add:18}]},
      {label:'暴击率 +7%',rarity:1,mods:[{stat:'critChance',add:.07}]},
      {label:'护甲 +10',rarity:1,mods:[{stat:'armor',add:10}]}];
    r.ui.showBlessing=(run,title,generated,choose,help,source)=>show(run,title,offers,choose,help,source);
    r.interactables.altarDone(altar,1);r.ui.showBlessing=show;
    const modal=r.ui.modalEl;
    const images=[...modal.querySelectorAll('.zx-blessing-seal img')].map(img=>img.getAttribute('src'));
    window.marbleBlessingBefore={mods:r.tempMods.length,items:[...r.player.items],luck:r.player.stats.luck};
    return {title:modal.querySelector('h2').textContent,images,text:modal.textContent};
  });
  assert.equal(blessing.title,'时尚小垃圾');
  for(const [i,file] of ['star-piece-v','dire-hit','iron'].entries())assert.ok(blessing.images[i].split('?')[0].endsWith('/items/'+file+'.png'),blessing.images[i]);
  await page.evaluate(()=>{app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);});
  await new Promise(resolve=>setTimeout(resolve,400));
  await page.evaluate(()=>{app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);});
  await page.screenshot({path:path.join(dir,'blessing-current-art.png')});
  const reward=await page.evaluate(()=>{
    const r=app.run,before=window.marbleBlessingBefore;
    r.ui.modalEl.querySelector('[data-offer="0"]').click();
    return {mods:r.tempMods.slice(before.mods),sameItems:JSON.stringify([...r.player.items])===JSON.stringify(before.items),luck:r.player.stats.luck-before.luck,state:r.state};
  });
  assert.deepEqual(reward,{mods:[{stat:'luck',add:18}],sameItems:true,luck:18,state:'play'});
  const hatch=await page.evaluate(()=>{
    const r=app.run,before=r.stats.eggs;
    r.stats.kills=r.egg.from+r.egg.need;
    r.simulate(1/30);r.renderWorld(0);r.simulate(1/30);r.renderWorld(0);
    return {removed:!r.egg,count:r.carriedMarble.mesh.count,eggs:r.stats.eggs-before};
  });
  assert.deepEqual(hatch,{removed:true,count:0,eggs:1});
  assert.deepEqual(await page.evaluate(()=>[...missingAssets]),[]);
  await fs.writeFile(path.join(dir,'marble-blessing-report.json'),JSON.stringify({motion,trailing,blessing,reward,hatch},null,2));
  console.log('Carried marble trailing arcs, hover, jump/render sync and unchanged blessing rewards passed. Screenshots:',dir);
}
