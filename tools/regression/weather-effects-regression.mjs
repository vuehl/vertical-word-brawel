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
      for(let i=0;i<65;i++){
        r.time+=1/30;
        r.events.update(1/30);maps.update(1/30);r.vfx.update(1/30);
      }
      r.performance={...r.performance,hudInterval:0};
      weatherFrame();
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
      if(r.events.active)r.events.left=.02;
      if(maps.bliz)maps.bliz.t=.02;
      if(maps.spout)maps.spout.t=.02;
      for(let i=0;i<95;i++){r.events.update(1/30);maps.update(1/30);}
      weatherFrame();
      return !maps.paperWeather.mesh.visible&&!funnel?.parent&&r.ui.els.event.style.display==='none';
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
