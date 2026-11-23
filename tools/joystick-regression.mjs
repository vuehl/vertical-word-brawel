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
  const response=await page.evaluate(()=>{
    const r=app.run,p=r.player,env=inspected.env;
    const screen=inspected.doc.getElementById('game').getBoundingClientRect();
    const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.64-screen.y;
    const baseSpeed=p.stats.moveSpeed,results=[];
    for(const fps of [30,60])for(const boost of [1,10])for(const airborne of [false,true]){
      p.stats.moveSpeed=baseSpeed*boost;
      p.pos.copy(r.terrain.spawn);
      if(airborne)p.pos.y+=3;
      p.grounded=!airborne;p.vel.set(0,0,0);p.kx=p.kz=p.crowdX=p.crowdZ=0;
      r.updateCamera(1);r.realDt=1/fps;
      const step=()=>{
        const {x,z}=p.pos;
        p.update(1/fps);r.updateCamera(1/fps);r.input.endFrame();
        return [p.pos.x-x,p.pos.z-z];
      };
      window.tap(x,y,'down',11);window.tap(x+60,y,'move',11);
      const start=step(),held=step();
      window.tap(x-60,y,'move',11);const reverse=step();
      window.tap(x,y+60,'move',11);const turn=step();
      window.tap(x,y,'move',11);const center=step();
      window.tap(x,y-60,'move',11);step();
      const camera=r.r.camera.position.clone();
      window.tap(x,y-60,'up',11);const release=step();
      const cameraDrift=camera.distanceTo(r.r.camera.position);
      results.push({fps,boost,airborne,start,held,reverse,turn,center,release,cameraDrift});
    }
    p.stats.moveSpeed=baseSpeed;
    return results;
  });
  for(const s of response){
    const stride=s.start[0],near=(a,b)=>Math.abs(a-b)<1e-6;
    assert.ok(stride>0&&near(s.held[0],stride)&&near(s.reverse[0],-stride),JSON.stringify(s));
    assert.ok(near(s.turn[0],0)&&near(s.turn[1],stride),JSON.stringify(s));
    assert.ok(Math.hypot(...s.center,...s.release,s.cameraDrift)<1e-6,JSON.stringify(s));
  }
  const southEdge=await page.evaluate(()=>{
    const r=app.run,p=r.player,env=inspected.env,c=r.r.camera;
    const screen=inspected.doc.getElementById('game').getBoundingClientRect();
    const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.64-screen.y;
    const results=[];
    for(const fps of [30,60])for(const [lane,startX] of [['open',0],['tissue',-31],['bell',16]]){
      const dt=1/fps,limit=r.terrain.deskBounds.z-2;
      p.pos.set(startX,0,limit-2);p.vel.set(0,0,0);p.grounded=true;
      p.kx=p.kz=p.crowdX=p.crowdZ=0;r.camTarget.copy(p.pos);
      const advance=frames=>{
        for(let frame=0;frame<frames;frame++){
          r.realDt=dt;p.update(dt);r.updateCamera(dt);r.input.endFrame();
          if(r.terrain.hitProp(p.pos.x,p.pos.y,p.pos.z,p.radius-.001))throw Error(lane+' collision penetration');
        }
      };
      window.tap(x,y,'down',11);window.tap(x,y+60,'move',11);advance(fps);
      const edge=p.pos.z,wallSpeed=p.speedNow,wallCamera=c.position.z;
      window.tap(x,y-60,'move',11);advance(1);
      const cameraReturn=wallCamera-c.position.z;
      advance(fps*3-1);
      r.renderWorld(0);
      const at=p.pos.clone(),speed=p.speedNow,action=p.heroPlayback?.clip.frames[0].action;
      window.tap(x+60,y-60,'move',11);advance(fps);
      window.tap(x,y,'up',11);
      results.push({lane,fps,reachedWall:Math.abs(edge-limit)<.001,wallSpeed,cameraReturn,
        drift:at.x-startX,north:edge-at.z,speed,action,turn:p.pos.x-at.x});
    }
    return results;
  });
  for(const s of southEdge){
    assert.ok(s.reachedWall&&s.wallSpeed<.01&&s.cameraReturn>0,JSON.stringify(s));
    assert.ok(Math.abs(s.drift)<.001&&s.north>1&&s.turn>.5,JSON.stringify(s));
    if(s.lane==='open')assert.ok(s.north>18&&s.action==='walk',JSON.stringify(s));
    else assert.ok(s.speed<.01&&s.action==='idle',JSON.stringify(s));
  }
  const circles=await page.evaluate(()=>{
    const r=app.run,p=r.player,t=r.ui.touch,env=inspected.env;
    const screen=inspected.doc.getElementById('game').getBoundingClientRect();
    const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.64-screen.y;
    return [1,-1].flatMap(turn=>[30,60].map(fps=>{
      const dt=1/fps;
      p.pos.copy(r.terrain.spawn);p.vel.set(0,0,0);p.kx=p.kz=p.crowdX=p.crowdZ=0;
      p.hp=p.maxHp;p.iframes=p.shield=p.overheal=p.stats.evasion=0;p.grounded=true;r.realDt=dt;
      const hits=r.stats.hits;
      let minForward=Infinity,maxAngleError=0,maxPathError=0;
      window.tap(x,y,'down',11);
      for(let frame=0;frame<fps;frame++){
        const angle=turn*frame*2*Math.PI/fps,dx=Math.cos(angle),dz=Math.sin(angle);
        window.tap(x+60*dx,y+60*dz,'move',11);
        if(frame===Math.floor(fps/3)){
          const id=r.enemies.spawn(19,p.pos.x,p.pos.z,1,1);
          if(id<0)throw Error('Failed to place contact enemy');
          r.enemies.x[id]=p.pos.x+dx*.3;r.enemies.z[id]=p.pos.z+dz*.3;
        }
        const px=p.pos.x,pz=p.pos.z;
        p.update(dt);r.enemies.update(dt);r.input.endFrame();
        const forward=(p.pos.x-px)*dx+(p.pos.z-pz)*dz;
        const sideways=(p.pos.z-pz)*dx-(p.pos.x-px)*dz;
        minForward=Math.min(minForward,forward/dt);
        maxPathError=Math.max(maxPathError,Math.abs(Math.atan2(sideways,forward))*180/Math.PI);
        const alignment=dx*r.input.stickX-dz*r.input.stickY;
        maxAngleError=Math.max(maxAngleError,Math.acos(Math.min(1,Math.max(-1,alignment)))*180/Math.PI);
      }
      const held=t.stickId===11,damage=p.maxHp-p.hp;
      window.tap(x,y,'up',11);r.enemies.clear();
      for(let frame=0;frame<fps/2;frame++)p.update(dt);
      return {turn,fps,hits:r.stats.hits-hits,damage,minForward,maxAngleError,maxPathError,held,stopSpeed:Math.hypot(p.vel.x,p.vel.z)};
    }));
  });
  for(const circle of circles){
    assert.ok(circle.hits>0&&circle.damage>0&&circle.held,JSON.stringify(circle));
    assert.ok(circle.minForward>0,'Ordinary contact reversed movement during a circle: '+JSON.stringify(circle));
    assert.ok(circle.maxAngleError<5&&circle.maxPathError<30&&circle.stopSpeed<.01,JSON.stringify(circle));
  }
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
        const vertical=[];
        for(const dy of [-1,1]){
          p.pos.copy(r.terrain.spawn);p.vel.set(0,0,0);p.kx=p.kz=p.crowdX=p.crowdZ=0;
          p.grounded=true;r.autoRun=false;
          const start=p.pos.clone(),headings=[],knobs=[],speeds=[];
          window.tap(x,y,'down',11);
          for(const [offset,reach] of [[0,12],[2,5],[-2,11],[3,16],[-4,18],[1,36],[-2,70]]){
            window.tap(x+offset,y+dy*reach,'move',11);
            headings.push(input());
            env.drawUI(app.r.renderer);
            const knob=inspected.layout.box(t.knob);
            knobs.push([knob.x+knob.w/2-t.sx,knob.y+knob.h/2-t.sy]);
            for(let frame=0;frame<6;frame++){r.realDt=1/60;p.update(1/60);r.input.endFrame();}
            speeds.push(Math.hypot(p.vel.x,p.vel.z));
          }
          const movement=[p.pos.x-start.x,p.pos.z-start.z];
          window.tap(x+24,y+dy*30,'move',11);
          const turn=input();
          window.tap(x,y-dy*30,'move',11);
          const reverse=input();
          window.tap(x,y,'up',11);
          vertical.push({dy,headings,knobs,speeds,movement,turn,reverse});
        }
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[diagonal,-diagonal],[-diagonal,diagonal],[diagonal,diagonal],[-diagonal,-diagonal]]){
          window.tap(x,y,'down',11);
          window.tap(x+1,y+1,'move',11);const jitter=input();
          window.tap(x+dx*100,y+dy*100,'move',11);
          const outward=input(),center=[t.sx,t.sy];
          env.drawUI(app.r.renderer);
          const b=inspected.layout.box(t.stick),k=inspected.layout.box(t.knob);
          const paintedCenter=[b.x+b.w/2,b.y+b.h/2];
          const knobCenter=[k.x+k.w/2,k.y+k.h/2];
          // Pulling inward on the same side must keep the heading. Cross the origin to reverse.
          window.tap(x+dx*45,y+dy*45,'move',11);
          const inward=input();
          window.tap(x-dx*45,y-dy*45,'move',11);
          const reverse=input();
          p.pos.copy(r.terrain.spawn);p.vel.set(0,0,0);p.kx=p.kz=p.crowdX=p.crowdZ=0;
          p.grounded=true;r.autoRun=false;
          const start=p.pos.clone();
          for(let frame=0;frame<12;frame++){r.realDt=1/60;p.update(1/60);r.input.endFrame();}
          const movement=[p.pos.x-start.x,p.pos.z-start.z];
          // A stationary finger and a second finger must not change the heading.
          window.tap(x-dx*45,y-dy*45,'move',11);const held=input();
          window.tap(x-30,y,'down',12);window.tap(x+30,y+20,'move',12);
          window.tap(x+30,y+20,'up',12);const secondFinger=input();
          // Returning to the current disc center stops the character.
          window.tap(t.sx-screen.x,t.sy-screen.y,'move',11);const centered=input();
          window.tap(x,y,'up',11);const stopped=input(),hidden=!t.stick.classList.contains('on');
          samples.push({dx,dy,jitter,outward,center,paintedCenter,knobCenter,
            origin:[x+screen.x,y+screen.y],inward,reverse,movement,held,secondFinger,centered,stopped,hidden});
        }
        p.pos.copy(saved);p.vel.set(0,0,0);
        return {scale,samples,vertical};
      },scale);
      report.push({width,...result});
      // Save the observations even on a failing build.
      await fs.writeFile(path.join(dir,'joystick-regression.json'),JSON.stringify(report,null,2));
      for(const s of result.vertical){
        assert.ok(s.headings.every(([x,y])=>x===0&&y*-s.dy>0),'Vertical hold drifted: '+JSON.stringify(s));
        assert.ok(Math.abs(s.headings[1][1])<Math.abs(s.headings[0][1])&&s.headings.at(-1)[1]===-s.dy,'Short drag must allow a slower walk');
        assert.ok(s.speeds[1]>0&&s.speeds[1]<s.speeds.at(-1)*.5,'Short drag must slow the actual player');
        assert.ok(s.knobs.every(([x,y])=>Math.abs(x)<.01&&y*s.dy>0),'Painted knob drifted: '+JSON.stringify(s));
        assert.ok(Math.abs(s.movement[0])<.001&&s.dy*s.movement[1]>.5,'Vertical player path: '+JSON.stringify(s));
        assert.ok(s.turn[0]>.5&&s.turn[1]*-s.dy>.5&&s.reverse[0]===0&&s.reverse[1]===s.dy,'Deliberate turn or reversal blocked');
      }
      for(const s of result.samples){
        const near=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<.01;
        assert.ok(near(s.jitter,[0,0]),'A light touch must not move');
        assert.ok(near(s.outward,[s.dx,-s.dy]),JSON.stringify(s));
        assert.ok(near(s.reverse,[-s.dx,s.dy]),'Long-drag reversal must follow the finger: '+JSON.stringify(s));
        assert.ok(s.movement[0]*-s.dx+s.movement[1]*-s.dy>.1,'The actual player must reverse');
        assert.ok(near(s.center,s.paintedCenter),'Painted disc must match its input origin');
        assert.ok(near(s.center,s.origin)&&near(s.inward,s.outward),'Origin and heading must stay stable during a long drag');
        const vx=s.knobCenter[0]-s.center[0],vy=s.knobCenter[1]-s.center[1];
        assert.ok(vx*s.dx+vy*s.dy>0&&Math.abs(vx*s.dy-vy*s.dx)<.02,'Knob and movement must point in the same direction');
        assert.ok(near(s.held,s.reverse)&&near(s.secondFinger,s.reverse),'Holding or a second finger must not steer');
        assert.ok(near(s.centered,[0,0])&&near(s.stopped,[0,0])&&s.hidden,'Center and release must stop');
      }
    }
  }
  const interruptions=await page.evaluate(()=>{
    const r=app.run,t=r.ui.touch,env=inspected.env,results=[];
    const screen=inspected.doc.getElementById('game').getBoundingClientRect();
    const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.64-screen.y;
    const stick={identifier:11,clientX:x,clientY:y},second={identifier:12,clientX:x+65,clientY:y};
    inspected.touches('down',{touches:[stick,second],changedTouches:[stick,second]});
    stick.clientX+=45;
    inspected.touches('move',{touches:[stick,second],changedTouches:[stick]});
    inspected.touches('up',{touches:[stick]});
    if(t.stickId!==11||r.input.stickX<.99)throw Error('Ending the second contact released the stick');
    inspected.touches('cancel',{touches:[],changedTouches:[]});
    results.push({kind:'missing-changed-touches',stopped:!r.input.stickX&&!r.input.stickY,hidden:!t.stick.classList.contains('on')});
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
  const cast=await page.evaluate(()=>{
    const r=app.run,t=r.ui.touch,env=inspected.env;
    app.meta.profile.settings.autoUlt=false;
    r.ult.active=0;r.ult.charge=1;r.input.endFrame();
    env.drawUI(app.r.renderer);
    const screen=inspected.doc.getElementById('game').getBoundingClientRect(),button=t.ult.getBoundingClientRect();
    const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.64-screen.y;
    window.tap(x,y,'down',11);window.tap(x+45,y,'move',11);
    const uses=r.ult.uses;
    window.tap(button.x+button.width/2-screen.x,button.y+button.height/2-screen.y,'tap',12);
    r.simulate(1/60);r.input.endFrame();
    const result={casts:r.ult.uses-uses,held:t.stickId===11,heading:r.input.stickX};
    window.tap(x+45,y,'up',11);
    return result;
  });
  assert.deepEqual(cast,{casts:1,held:true,heading:1});
  await fs.writeFile(path.join(dir,'joystick-regression.json'),JSON.stringify({response,southEdge,circles,controls:report,interruptions,cast},null,2));
  console.log('Joystick contact damage during clockwise/counterclockwise turns, short and full drags, reversals, multitouch and release passed:',report.length,'screen/scale combinations');
}
