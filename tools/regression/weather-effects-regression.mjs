import assert from 'node:assert/strict';
import path from 'node:path';

export async function reviewWeatherEffects(page,dir){
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(()=>{
    window.dispatchEvent(new Event('resize'));
    app.meta.profile.settings.quality='low';app.applySettings();
    window.weatherFrame=()=>{
      const r=app.run;
      r.updateCamera(0);r.renderWorld(0);r.vfx.update(0);r.ui.hud(r);
      app.r.render(0);
    };
    window.weatherPixels=()=>{
      const gl=app.r.renderer.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
      const data=new Uint8Array(w*h*4),samples=[];
      gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,data);
      for(let y=.12;y<.90;y+=.015)for(let x=.07;x<.94;x+=.02){
        const i=(Math.floor(y*h)*w+Math.floor(x*w))*4;
        samples.push(data[i],data[i+1],data[i+2]);
      }
      return samples;
    };
  });
  const report=[];
  async function show(kind,stage){
    const result=await page.evaluate(kind=>{
      const r=app.run,maps=r.mapEvents;
      maps.update(0);r.enemies.clear();
      r.events.done=new Set(['fog','storm','meowth','blizzard','spout'].filter(name=>name!==kind));
      r.director.fire('event');
      if(maps.speech){
        const enemies=r.enemies,p=r.player.pos;
        if(kind==='blizzard')r.player.setSpecies(5);
        enemies.clear();
        const actor=enemies.spawn(19,p.x+3,p.z-2,1,1,8);
        if(actor<0)throw Error('Missing weather speaker fixture');
        const x=enemies.x[actor];
        enemies.x[actor]=p.x+200;
        r.time+=1;weatherFrame();
        if(maps.speech.bubble)throw Error('An offscreen monster spoke');
        enemies.x[actor]=x;
      }
      for(let i=0;i<65;i++){
        r.time+=1/30;
        r.events.update(1/30);maps.update(1/30);r.vfx.update(1/30);
      }
      r.performance={...r.performance,hudInterval:0};
      weatherFrame();
      if(maps.speech){
        const speech=maps.speech,actors=r.enemies;
        const expected=kind==='blizzard'?'好冷啊，你们都去找焱取暖嘛？':'这风是从海里拧上来的？';
        if(speech.bubble?.getAttribute('aria-label')!==expected)throw Error('Missing weather line: '+expected);
        const id=speech.speaker,originalX=actors.x[id],firstLeft=speech.bubble.style.left;
        actors.x[id]+=.8;weatherFrame();
        if(speech.bubble.style.left===firstLeft)throw Error('Weather bubble did not follow its speaker');
        if(kind==='blizzard'){
          const p=r.player.pos,distance=()=>Math.hypot(actors.x[id]-p.x,actors.z[id]-p.z);
          const before=distance();
          for(let i=0;i<6;i++){r.time+=1/30;actors.update(1/30);}
          if(distance()>=before)throw Error('Blizzard speaker did not approach the hero');
          r.player.setSpecies(6);weatherFrame();
          if(speech.bubble.getAttribute('aria-label')!=='好冷啊，你们都去找燚取暖嘛？')throw Error('Stale hero form');
          r.player.setSpecies(5);weatherFrame();
        }
        actors.spawn(19,r.player.pos.x-3,r.player.pos.z,1,1);
        actors.x[id]=originalX+200;weatherFrame();
        if(speech.bubble.style.display!=='none'||speech.speaker!==id)throw Error('Offscreen speaker kept or transferred its bubble');
        actors.x[id]=originalX;weatherFrame();
      }
      const layer=maps.paperWeather?.mesh,funnel=maps.spout?.mesh;
      if(!layer?.visible||kind==='spout'&&!funnel?.visible)throw Error('Missing '+kind+' in the world scene');
      const active=weatherPixels();
      const activeMesh=funnel??layer;
      activeMesh.visible=false;app.r.render(0);
      const hidden=weatherPixels();
      activeMesh.visible=true;app.r.render(0);
      let changed=0;
      for(let i=0;i<active.length;i+=3){
        if(Math.max(...[0,1,2].map(c=>Math.abs(active[i+c]-hidden[i+c])))>=10)changed++;
      }
      const event=r.ui.els.event;
      inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
      return {stage:r.stage,kind:event.dataset.kind,seconds:event.children[1].textContent,coverage:changed*3/active.length};
    },kind);
    assert.equal(result.stage,stage);
    assert.equal(result.kind,kind==='fog'?'spectral-fog':kind);
    assert.match(result.seconds,/^\d+ 秒$/);
    assert.ok(result.coverage>(kind==='spout'?.018:.24),JSON.stringify(result));
    report.push(result);
    await page.screenshot({path:path.join(dir,`weather-${stage}-${kind}.png`)});
  }
  async function expire(){
    const clean=await page.evaluate(()=>{
      const r=app.run,maps=r.mapEvents,funnel=maps.spout?.mesh;
      if(maps.speech?.bubble){
        const {speaker,bubble}=maps.speech;
        r.enemies.kill(speaker);
        const next=r.enemies.spawn(19,r.player.pos.x,r.player.pos.z-2,1,1);
        if(next!==speaker)throw Error('Expected recycled speaker slot');
        maps.update(0);weatherFrame();
        if(bubble.parentNode||maps.speech)throw Error('Recycled enemy inherited weather dialogue');
      }
      if(r.events.active)r.events.left=.02;
      if(maps.bliz)maps.bliz.t=.02;
      if(maps.spout)maps.spout.t=.02;
      for(let i=0;i<95;i++){r.events.update(1/30);maps.update(1/30);}
      weatherFrame();
      return !maps.paperWeather.mesh.visible&&!funnel?.parent&&r.ui.els.event.style.display==='none'&&
        !r.ui.hudEl.querySelector('.weather-speech');
    });
    assert.ok(clean,'Expired weather should disappear from the scene and HUD');
  }
  for(const kind of ['fog','blizzard','spout']){await show(kind,1);await expire();}
  await page.evaluate(async()=>{
    const r=app.run;r.mapEvents.start('blizzard');weatherFrame();
    await r.changeZone();weatherFrame();
  });
  assert.ok(await page.evaluate(()=>!app.run.mapEvents.paperWeather.mesh.visible&&!app.run.mapEvents.busy));
  await show('spout',2);await expire();
  console.log('Scene weather verified on the low graphics preset:',JSON.stringify(report));
}
