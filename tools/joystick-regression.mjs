import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function verifyJoystick(page,dir){
  await page.evaluate(()=>{window.holdHomeStatus=false;window.releaseHomeStatus?.();releaseOptionalDownloads();releaseTextDownload();});
  await page.waitForFunction(()=>window.app?.screen?.querySelector('button'),{timeout:35000});
  const click=async selector=>{
    const handle=await page.waitForFunction(sel=>app.screen.querySelector(sel),{timeout:15000},selector);
    await handle.evaluate(el=>el.click());await handle.dispose();
  };
  if(await page.evaluate(()=>!!app.screen.querySelector('.auth-body button')))await click('.auth-body button');
  await click('[data-action="journey"]');await click('[data-action="enter"]');
  await page.waitForFunction(()=>app.run?.terrain?.desk2d&&app.run.time>.1,{timeout:30000});
  await page.evaluate(()=>{
    app.halted=true;const r=app.run;r.enemies.clear();r.state='play';
    r.ui.touch.update(r,'');inspected.env.drawUI(app.r.renderer);
  });
  const report=[];
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:2});
    await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
    await page.waitForFunction(w=>inspected.env.innerWidth===w,{},width);
    for(const scale of [.7,1,1.3]){
      const result=await page.evaluate(scale=>{
        const r=app.run,t=r.ui.touch,p=r.player,env=inspected.env;
        app.meta.profile.settings.touchScale=scale;app.applySettings();
        t.update(r,'');env.drawUI(app.r.renderer);
        const screen=inspected.doc.getElementById('game').getBoundingClientRect();
        const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.64-screen.y;
        const samples=[],saved=p.pos.clone();
        const input=()=>[r.input.stickX,r.input.stickY];
        const diagonal=Math.SQRT1_2;
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[diagonal,-diagonal],[-diagonal,diagonal],[diagonal,diagonal],[-diagonal,-diagonal]]){
          window.tap(x,y,'down',11);
          window.tap(x+1,y+1,'move',11);const jitter=input();
          window.tap(x+dx*100,y+dy*100,'move',11);
          const outward=input(),center=[t.sx,t.sy];
          env.drawUI(app.r.renderer);
          const b=inspected.layout.box(t.stick),k=inspected.layout.box(t.knob);
          const paintedCenter=[b.x+b.w/2,b.y+b.h/2];
          const knobCenter=[k.x+k.w/2,k.y+k.h/2];
          // Reverse while still on the original side of the initial press.
          window.tap(x+dx*45,y+dy*45,'move',11);
          const reverse=input();
          p.pos.copy(r.terrain.spawn);p.vel.set(0,0,0);p.kx=p.kz=p.crowdX=p.crowdZ=0;
          p.grounded=true;r.autoRun=false;
          const start=p.pos.clone();
          for(let frame=0;frame<12;frame++){r.realDt=1/60;p.update(1/60);r.input.endFrame();}
          const movement=[p.pos.x-start.x,p.pos.z-start.z];
          // A stationary finger and a second finger must not change the heading.
          window.tap(x+dx*45,y+dy*45,'move',11);const held=input();
          window.tap(x-30,y,'down',12);window.tap(x+30,y+20,'move',12);
          window.tap(x+30,y+20,'up',12);const secondFinger=input();
          // Returning to the current disc center stops the character.
          window.tap(t.sx-screen.x,t.sy-screen.y,'move',11);const centered=input();
          window.tap(x,y,'up',11);const stopped=input(),hidden=!t.stick.classList.contains('on');
          samples.push({dx,dy,jitter,outward,center,paintedCenter,knobCenter,
            finger:[x+dx*100+screen.x,y+dy*100+screen.y],reverse,movement,held,secondFinger,centered,stopped,hidden});
        }
        p.pos.copy(saved);p.vel.set(0,0,0);
        return {scale,samples};
      },scale);
      report.push({width,...result});
      // Save the observations even on a failing build.
      await fs.writeFile(path.join(dir,'joystick-regression.json'),JSON.stringify(report,null,2));
      for(const s of result.samples){
        const near=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<.01;
        assert.ok(near(s.jitter,[0,0]),'A light touch must not move');
        assert.ok(near(s.outward,[s.dx,-s.dy]),JSON.stringify(s));
        assert.ok(near(s.reverse,[-s.dx,s.dy]),'Long-drag reversal must follow the finger: '+JSON.stringify(s));
        assert.ok(s.movement[0]*-s.dx+s.movement[1]*-s.dy>.1,'The actual player must reverse');
        assert.ok(near(s.center,s.paintedCenter),'Painted disc must match its input origin');
        assert.ok(near(s.knobCenter,s.finger),'Thumb must stay under the finger during a long drag');
        assert.ok(near(s.held,s.reverse)&&near(s.secondFinger,s.reverse),'Holding or a second finger must not steer');
        assert.ok(near(s.centered,[0,0])&&near(s.stopped,[0,0])&&s.hidden,'Center and release must stop');
      }
    }
  }
  const interruptions=await page.evaluate(()=>{
    const r=app.run,t=r.ui.touch,env=inspected.env,results=[];
    const screen=inspected.doc.getElementById('game').getBoundingClientRect();
    const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.64-screen.y;
    for(const kind of ['cancel','lostpointercapture','pause','hide']){
      r.state='play';t.update(r,'');env.drawUI(app.r.renderer);
      window.tap(x,y,'down',11);window.tap(x+100,y,'move',11);
      if(kind==='cancel')window.tap(x+100,y,'cancel',11);
      else if(kind==='lostpointercapture')t.el.dispatchEvent(new env.PointerEvent(kind,{pointerId:11}));
      else if(kind==='pause'){r.pause();t.update(r,'');}
      else window.fixtureHide();
      results.push({kind,stopped:!r.input.stickX&&!r.input.stickY,hidden:!t.stick.classList.contains('on')});
      window.tap(x+100,y,'cancel',11);
      if(kind==='hide')window.fixtureShow({});
      r.ui.hideModal();r.state='play';t.update(r,'');
    }
    return results;
  });
  for(const result of interruptions)assert.ok(result.stopped&&result.hidden,JSON.stringify(result));
  await fs.writeFile(path.join(dir,'joystick-regression.json'),JSON.stringify({controls:report,interruptions},null,2));
  console.log('Joystick long drags, reversals, actual movement, hold, multitouch, release and interruptions passed:',report.length,'screen/scale combinations');
}
