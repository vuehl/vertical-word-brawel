import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewFloatingControls({page,resize,dir,sleep}){
  const report=[];
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await resize(width,height);
    for(const scale of [.7,1,1.3]){
      await page.evaluate(scale=>{app.meta.profile.settings.touchScale=scale;app.applySettings();},scale);await sleep(180);
      const samples=await page.evaluate(()=>{
        const r=app.run,t=r.ui.touch,s=inspected.doc.getElementById('game').getBoundingClientRect(),samples=[];
        for(const [fx,fy] of [[.25,.55],[.5,.75],[.75,.9]])for(const [dx,dy] of [[35,0],[-35,0],[0,35],[0,-35],[25,-25]]){
          const x=inspected.env.innerWidth*fx-s.x,y=inspected.env.innerHeight*fy-s.y;
          window.tap(x,y,'down');const origin=[t.sx,t.sy],shown=t.stick.classList.contains('on');
          window.tap(x+1,y+1,'move');const jitter=Math.hypot(r.input.stickX,r.input.stickY);
          window.tap(x+dx,y+dy,'move');
          const direction=[r.input.stickX,r.input.stickY],knob=t.knob.style.transform;
          window.tap(x+dx,y+dy,'cancel');
          samples.push({origin,expected:[x+s.x,y+s.y],shown,jitter,direction,dx,dy,knob,hidden:!t.stick.classList.contains('on'),stopped:!r.input.stickX&&!r.input.stickY});
        }
        return samples;
      });
      for(const s of samples){assert.deepEqual(s.origin,s.expected);assert.equal(s.jitter,0);assert.ok(s.shown&&s.hidden&&s.stopped);const length=Math.hypot(s.dx,s.dy);assert.ok(Math.abs(s.direction[0]-s.dx/length)<.001&&Math.abs(s.direction[1]+s.dy/length)<.001,JSON.stringify(s));assert.match(s.knob,/translate/);}
      const point=await page.evaluate(()=>{
        const t=app.run.ui.touch,s=inspected.doc.getElementById('game').getBoundingClientRect(),x=inspected.env.innerWidth*.48-s.x,y=inspected.env.innerHeight*.7-s.y;
        window.tap(x,y,'down');window.tap(x+28,y-28,'move');return {x,y,sx:t.sx,sy:t.sy};
      });await sleep(700);
      const painted=await page.evaluate(()=>{
        const t=app.run.ui.touch,b=inspected.layout.box(t.stick),k=inspected.layout.box(t.knob),canvas=inspected.controls.canvas;
        return {diameter:b.w,center:[b.x+b.w/2,b.y+b.h/2],offset:[k.x+k.w/2-b.x-b.w/2,k.y+k.h/2-b.y-b.h/2],pixels:!!canvas&&canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some((v,i)=>i%4===3&&v>0)};
      });
      assert.ok(painted.pixels);assert.ok(painted.diameter<=96*scale+1);assert.ok(Math.abs(painted.center[0]-point.sx)<1&&Math.abs(painted.center[1]-point.sy)<1,JSON.stringify({width,scale,point,painted}));assert.ok(painted.offset[0]>4&&painted.offset[1]<-4,JSON.stringify(painted));
      if(scale===1)await page.screenshot({path:path.join(dir,'floating-stick-'+width+'.png')});
      await page.evaluate(({x,y})=>window.tap(x+28,y-28,'up'),point);
      report.push({width,scale,gestures:samples.length,painted});
    }
  }
  await resize(390,844);await page.evaluate(()=>{app.meta.profile.settings.touchScale=1;app.meta.profile.settings.autoUlt=false;app.meta.profile.settings.ultQuiet=true;app.applySettings();});await sleep(200);
  const cast=await page.evaluate(()=>{
    const r=app.run,s=inspected.doc.getElementById('game').getBoundingClientRect(),u=r.ui.touch.ult.getBoundingClientRect(),x=180-s.x,y=inspected.env.innerHeight*.75-s.y;
    r.ult.active=0;r.ult.charge=1;window.tap(x,y,'down',11);window.tap(x+30,y,'move',11);window.tap(u.x+u.width/2-s.x,u.y+u.height/2-s.y,'down',12);window.tap(u.x+u.width/2-s.x,u.y+u.height/2-s.y,'up',12);
    return {uses:r.ult.uses,x,y};
  });await page.waitForFunction(n=>app.run.ult.uses>n,{timeout:15000},cast.uses);
  assert.ok(await page.evaluate(()=>app.run.input.stickX>.99));
  await page.evaluate(()=>app.run.pause());await sleep(180);
  assert.ok(await page.evaluate(()=>!app.run.input.stickX&&!app.run.ui.touch.stick.classList.contains('on')));
  await page.evaluate(({x,y})=>{window.tap(x+30,y,'cancel',11);app.run.ui.hideModal();app.run.state='play';},cast);
  return report;
}

export async function reviewBattleFeedback(context){
  const {page,tap,dir,sleep}=context,report={environment:'Compiled WeChat package in Chrome fixture; not iOS/Android hardware.'};
  await tap('[data-action="journey"]');await tap('[data-species="132"]');await tap('.zx-footer button','选择关卡');await tap('.zx-footer button','选择难度');await tap('[data-action="enter"]');
  await page.waitForFunction(()=>app.run?.time>2&&app.run.state==='play',{timeout:90000});
  await page.evaluate(()=>{app.run.godMode=true;app.run.queueLevelUp=()=>{};app.run.pendingLevels=0;});
  assert.equal(await page.evaluate(()=>inspected.doc.querySelector('.zx-hud-element').textContent),'基');
  report.controls=await reviewFloatingControls(context);
  // Freeze simulation while independently inspecting actual HUD canvas pixels.
  await sleep(700);
  await page.evaluate(()=>{app.run.update=()=>{};app.run.state='play';app.run.ui.touch.update(app.run,'');});
  report.ultimates=[];
  for(const charge of [0,.25,.65,1]){
    const data=await page.evaluate(charge=>{
      const r=app.run;r.ult.active=0;r.ult.charge=charge;r.ui.ultHud(r);
      const canvas=inspected.doc.querySelector('.zx-ult-progress'),pixels=canvas.getContext('2d').getImageData(0,0,168,168).data;let blue=0;
      for(let i=0;i<pixels.length;i+=4)if(pixels[i+2]>pixels[i]*1.25&&pixels[i+1]>pixels[i]+20&&pixels[i+3]>200)blue++;
      return {charge,progress:Number(canvas.dataset.progress),ready:r.ui.touch.ult.classList.contains('ready'),disabled:r.ui.touch.ult.getAttribute('aria-disabled'),blue};
    },charge);assert.equal(data.progress,charge);assert.equal(data.ready,charge===1);assert.equal(data.disabled,String(charge!==1));report.ultimates.push(data);
    await sleep(700);await page.screenshot({path:path.join(dir,'ultimate-'+Math.round(charge*100)+'.png')});
  }
  assert.ok(report.ultimates[1].blue>report.ultimates[0].blue&&report.ultimates[2].blue>report.ultimates[1].blue);
  report.ultimateLayout=await page.evaluate(()=>{
    const u=app.run.ui.touch.ult,b=inspected.layout.box(u),c=inspected.layout.box(u.querySelector('.zx-ult-progress')),label=inspected.layout.box(u.querySelector('.ult-core'));
    return {button:[b.x,b.y,b.w,b.h],ring:[c.x,c.y,c.w,c.h],label:[label.x,label.y,label.w,label.h],legacyVisible:!!inspected.layout.box(u.querySelector('.ult-ring'))?.w};
  });
  assert.deepEqual(report.ultimateLayout.ring,report.ultimateLayout.button);assert.deepEqual(report.ultimateLayout.label,report.ultimateLayout.button);assert.equal(report.ultimateLayout.legacyVisible,false);
  report.maps=[];
  await page.evaluate(()=>{
    const r=app.run,p=r.player.pos;
    r.enemies.clear();
    for(const [flags,dx,dz] of [[2,3,4],[4096,-100,0],[8192,0,20]]){
      const i=r.enemies.spawn(16,p.x+dx,p.z+dz,1,1,flags);
      // Terrain can displace a spawn. Pin the frozen actors at known distances.
      r.enemies.x[i]=p.x+dx;r.enemies.z[i]=p.z+dz;
    }
  });
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await context.resize(width,height);
    const labels=await page.evaluate(()=>{
      const r=app.run,labels=[],proto=CanvasRenderingContext2D.prototype,fill=proto.fillText;
      proto.fillText=function(text,...args){if(text.endsWith?.(' 厘米'))labels.push(text);return fill.call(this,text,...args);};
      try{r.pause();r.ui.showMap(r);}finally{proto.fillText=fill;}
      return labels;
    });
    assert.deepEqual(labels.sort(),['100 厘米','20 厘米','5 厘米']);
    await sleep(700);
    const map=await page.evaluate(()=>{
      const panel=inspected.doc.querySelector('.zx-battle-map'),canvas=panel.querySelector('canvas'),b=panel.getBoundingClientRect(),scale=canvas.width/120;
      return {text:panel.textContent,bottom:b.bottom,shadowPixel:Array.from(canvas.getContext('2d').getImageData(Math.floor(60*scale),Math.floor(116*scale),1,1).data)};
    });
    assert.equal(map.text,'附近地图返回战斗');assert.equal(map.shadowPixel[3],0);assert.ok(map.bottom<=height);
    await page.screenshot({path:path.join(dir,'clean-map-'+width+'.png')});report.maps.push({width,...map});
    await tap('[data-action="close-battle-map"]');assert.equal(await page.evaluate(()=>app.run.state),'play');
  }
  await context.resize(390,844);
  report.skills=await page.evaluate(()=>{
    const r=app.run,move=r.player.moves[0],m=move.def.arch==='random'&&move.sub?move.sub:move,samples=[];m.timer=0;m.timer=2;
    for(const timer of [2,1,.1,0]){
      m.timer=timer;r.state='paused';r.ui.hud(r);r.state='play';r.ui.hud(r);
      const canvas=inspected.doc.querySelector('.zx-skill-cooldown');samples.push({timer,progress:Number(canvas.dataset.progress)});
    }return samples;
  });assert.deepEqual(report.skills.map(s=>s.progress),[0,.5,.95,1]);
  report.automaticCast=await page.evaluate(()=>{
    const r=app.run,p=r.player,e=r.enemies;p.moves=Array(Math.max(4,p.moveSlots)).fill(null);p.addMove(52);e.clear();
    const target=e.spawn(16,p.pos.x+3,p.pos.z,1,1,0);e.hp[target]=e.maxHp[target]=100000;
    const move=p.moves[0];move.timer=.15;let resets=0;
    for(let i=0;i<180;i++){const before=move.timer;r.simulate(1/60);if(move.timer>before)resets++;}
    return {resets,damage:move.damageDone,timer:move.timer,total:move.cooldownTotal};
  });assert.ok(report.automaticCast.resets>0&&report.automaticCast.damage>0,JSON.stringify(report.automaticCast));
  await page.evaluate(()=>{const r=app.run,m=r.player.moves[0];m.waitingForTarget=false;m.timer=0;m.timer=2;m.timer=1;r.state='paused';r.ui.hud(r);r.state='play';r.ui.hud(r);});
  await sleep(700);await page.screenshot({path:path.join(dir,'skill-cooldown-half.png')});
  report.markers=await page.evaluate(async()=>{
    const r=app.run,e=r.enemies,p=r.player.pos;e.clear();r.ult.charge=.65;r.ui.ultHud(r);
    const a=e.spawn(16,p.x+15,p.z-15,1,1,128),b=e.spawn(16,p.x-100,p.z+30,1,1,2048);
    await new Promise(resolve=>setTimeout(resolve,200));r.ui.drawMinimap(r);
    const c=r.ui.minimap,pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    let cyan=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]<65&&pixels[i+1]>130&&pixels[i+2]>140&&pixels[i+3]>200)cyan++;
    e.kill(a);e.kill(b);await new Promise(resolve=>setTimeout(resolve,200));r.ui.drawMinimap(r);
    const gone=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let after=0;for(let i=0;i<gone.length;i+=4)if(gone[i]<65&&gone[i+1]>130&&gone[i+2]>140&&gone[i+3]>200)after++;
    e.spawn(16,p.x+15,p.z-15,1,1,128);e.spawn(16,p.x-100,p.z+30,1,1,2048);return {cyan,after};
  });assert.ok(report.markers.cyan>100);assert.equal(report.markers.after,0);
  await sleep(200);await page.evaluate(()=>{app.run.ui.drawMinimap(app.run);app.run.ui.hud(app.run);});await sleep(200);await page.screenshot({path:path.join(dir,'special-markers.png')});
  report.quality=await page.evaluate(()=>{
    const r=app.run,s=app.meta.profile.settings;s.quality='low';s.batterySaver=false;app.applySettings();app.r.setDynRes(.6);r.liveCap=60;
    s.quality='high';app.applySettings();const cap=r.liveCap;
    for(let i=0;i<100;i++){app.r.setDynRes(.6);app.adaptRes(.1,.1,i*100);r.governHorde();}
    const pool=r.vfx.add,oldLimit=pool.limit,oldView=pool.view,random=Math.random;let emitted;
    try{
      pool.limit=pool.cap;pool.view=null;pool.densityBudget.next();pool.n=Math.floor(pool.cap*.85);const before=pool.n;
      Math.random=()=>.99;for(let i=0;i<10;i++)pool.spawn({x:r.player.pos.x,y:1,z:r.player.pos.z,life:1,size:.2});emitted=pool.n-before;
    }finally{Math.random=random;pool.limit=oldLimit;pool.view=oldView;r.vfx.clear();}
    return {selected:s.quality,dynamic:app.r.quality.dyn,resolution:app.r.dynRes,cap,after:r.liveCap,locked:r.performance.lockVisualQuality,emitted};
  });assert.equal(report.quality.resolution,1);assert.equal(report.quality.dynamic,false);assert.equal(report.quality.cap,report.quality.after);assert.ok(report.quality.locked);assert.equal(report.quality.emitted,10);
  fs.writeFileSync(path.join(dir,'battle-feedback.json'),JSON.stringify(report,null,2));console.log('Battle feedback passed',JSON.stringify(report));
}
