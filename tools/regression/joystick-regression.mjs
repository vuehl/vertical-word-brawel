import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {prepareReturningPlayer} from './entry-regression.mjs';

export async function verifyJoystick(page,dir){
  await page.evaluate(()=>{window.holdHomeStatus=false;window.releaseHomeStatus?.();releaseOptionalDownloads();releaseTextDownload();});
  await page.waitForFunction(()=>window.app?.screen?.querySelector('button'),{timeout:35000});
  const click=async selector=>{
    const handle=await page.waitForFunction(sel=>app.screen.querySelector(sel),{timeout:15000},selector);
    await handle.evaluate(el=>el.click());await handle.dispose();
  };
  if(await page.evaluate(()=>!!app.screen.querySelector('.auth-body button')))await click('.auth-body button');
  await prepareReturningPlayer(page);
  await click('[data-action="journey"]');
  await click('[data-action="collection-next"]');
  await click('[data-action="enter"]');
  if(process.argv.includes('--dev')){
    await page.waitForFunction(()=>inspected.doc.getElementById('zx-dev-panel'),{timeout:30000});
    await page.evaluate(()=>{const dev=inspected.env.__zixingDeveloper;dev.options.hideScenery=false;dev.close();});
  }
  await page.waitForFunction(()=>app.run?.terrain?.desk2d&&app.run.time>.1,{timeout:30000});
  await page.evaluate(()=>{
    app.halted=true;const r=app.run;r.enemies.clear();r.state='play';
    r.ui.touch.update(r,'');inspected.env.drawUI(app.r.renderer);
    // Isolated collision/geometry probes run without RAF. Explicitly consume
    // queued events at a simulation boundary, as Run.simulate does in play.
    window.stickStep=dt=>{
      const run=app.run;
      run.walkBudget=run.ui.touch.stickCfg.maxFrameDistance;
      run.ui.touch.driveStick(run.input,dt,performance.now());
      run.stepPlayer(run.player,dt);
      run.renderAlpha=1;
    };
    window.settleStick=()=>{
      for(let i=0;i<16;i++)r.ui.touch.driveStick(r.input,1/30,performance.now());
      return [r.input.stickX,r.input.stickY];
    };
  });
  if(process.argv.includes('--joystick-soak')){
    const {verifyCombatSteering}=await import('./joystick-soak.mjs');
    return verifyCombatSteering(page,dir);
  }
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
        window.stickStep(1/fps);r.updateCamera(1/fps);r.input.endFrame();
        return [p.pos.x-x,p.pos.z-z];
      };
      window.tap(x,y,'down',11);window.tap(x+60,y,'move',11);
      const start=step(),held=step();
      window.tap(x-60,y,'move',11);for(let i=0;i<5;i++)step();const reverse=step();
      window.tap(x,y+60,'move',11);for(let i=0;i<10;i++)step();const turn=step();
      window.tap(x,y,'move',11);for(let i=0;i<25;i++)step();const center=step();
      window.tap(x,y-60,'move',11);for(let i=0;i<5;i++)step();
      const camera=r.r.camera.position.clone();
      window.tap(x,y-60,'up',11);const release=step();
      const cameraDrift=camera.distanceTo(r.r.camera.position);
      for(let i=0;i<30;i++)step();
      results.push({stop:p.speedNow,fps,boost,airborne,start,held,reverse,turn,center,release,cameraDrift});
    }
    p.stats.moveSpeed=baseSpeed;
    return results;
  });
  for(const s of response){
    assert.ok(s.start[0]>0 && s.held[0]>=s.start[0]-1e-6 && s.reverse[0]<0,JSON.stringify(s));
    assert.ok(Math.abs(s.turn[0])<.01 && s.turn[1]>0,JSON.stringify(s));
    assert.ok(Math.hypot(...s.center)<.001 && s.stop===0 && s.release[1]<0,JSON.stringify(s));
  }
  const southEdge=await page.evaluate(()=>{
    const r=app.run,p=r.player,env=inspected.env,c=r.r.camera;
    const screen=inspected.doc.getElementById('game').getBoundingClientRect();
    const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.64-screen.y;
    const results=[];
    for(const fps of [30,60])for(const [lane,startX] of [['open',0],['tissue',-31]]){
      const dt=1/fps,limit=r.terrain.deskBounds.z-2;
      p.pos.set(startX,0,limit-2);p.vel.set(0,0,0);p.grounded=true;
      p.kx=p.kz=p.crowdX=p.crowdZ=0;r.camTarget.copy(p.pos);
      const advance=frames=>{
        for(let frame=0;frame<frames;frame++){
          r.realDt=dt;window.stickStep(dt);r.updateCamera(dt);r.input.endFrame();
          if(r.terrain.hitProp(p.pos.x,p.pos.y,p.pos.z,p.radius-.001,true))throw Error(lane+' collision penetration');
        }
      };
      window.tap(x,y,'down',11);window.tap(x,y+60,'move',11);advance(fps);
      const edge=p.pos.z,wallSpeed=p.speedNow,wallCamera=c.position.z;
      window.tap(x,y-60,'move',11);advance(6);
      const cameraReturn=wallCamera-c.position.z;
      advance(fps*3-6);
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
    assert.ok(s.north>16&&s.speed>0,JSON.stringify(s));
    if(s.lane==='open')assert.equal(s.action,'walk',JSON.stringify(s));
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
        window.stickStep(dt);r.enemies.update(dt);r.input.endFrame();
        const forward=(p.pos.x-px)*dx+(p.pos.z-pz)*dz;
        const sideways=(p.pos.z-pz)*dx-(p.pos.x-px)*dz;
        minForward=Math.min(minForward,forward/dt);
        maxPathError=Math.max(maxPathError,Math.abs(Math.atan2(sideways,forward))*180/Math.PI);
        const alignment=(dx*r.input.stickX-dz*r.input.stickY)/Math.max(.00001,Math.hypot(r.input.stickX,r.input.stickY));
        maxAngleError=Math.max(maxAngleError,Math.acos(Math.min(1,Math.max(-1,alignment)))*180/Math.PI);
      }
      const held=t.stickId===11,damage=p.maxHp-p.hp;
      window.tap(x,y,'up',11);r.enemies.clear();
      for(let frame=0;frame<fps/2;frame++)window.stickStep(dt);
      return {turn,fps,hits:r.stats.hits-hits,damage,minForward,maxAngleError,maxPathError,held,stopSpeed:Math.hypot(p.vel.x,p.vel.z)};
    }));
  });
  for(const circle of circles){
    assert.ok(circle.hits>0&&circle.damage>0&&circle.held,JSON.stringify(circle));
    assert.ok(circle.minForward>0,'Ordinary contact reversed movement during a circle: '+JSON.stringify(circle));
    assert.ok(circle.maxAngleError<25&&circle.maxPathError<30&&circle.stopSpeed<.01,JSON.stringify(circle));
  }
  const testCloseCrowd=()=>page.evaluate(()=>{
    const r=app.run,p=r.player,enemies=r.enemies,env=inspected.env;
    const screen=inspected.doc.getElementById('game').getBoundingClientRect();
    const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.64-screen.y;
    return [30,60].map(fps=>{
      const dt=1/fps,initialHits=r.stats.hits;
      p.pos.copy(r.terrain.spawn);p.vel.set(0,0,0);p.grounded=true;
      p.iframes=p.crowdX=p.crowdZ=p.kx=p.kz=0;p.hp=p.maxHp;
      // Pack one side so contact forces cannot cancel out in a symmetric ring.
      const stageTime=r.stageTime;
      r.stageTime=90;
      for(let i=0;i<12;i++){
        const id=enemies.spawn(19,p.pos.x+(i%3)*.2,p.pos.z+.35+Math.floor(i/3)*.15,1,1);
        if(id<0)throw Error('Failed to place close crowd');
      }
      r.stageTime=stageTime;
      let maxDrift=0,maxSideways=0,minForward=Infinity,loadedSteps=0;
      const advance=(direction,frames)=>{
        for(let i=0;i<frames;i++){
          const oldX=p.pos.x,oldZ=p.pos.z;
          if(Math.hypot(p.crowdX,p.crowdZ)>.001)loadedSteps++;
          r.realDt=dt;window.stickStep(dt);enemies.update(dt);r.input.endFrame();
          const dx=p.pos.x-oldX,dz=p.pos.z-oldZ;
          if(i<Math.min(6,frames-1))continue; // allow the 3-tick turn and braking response
          if(direction){
            maxSideways=Math.max(maxSideways,Math.abs(dz));
            minForward=Math.min(minForward,dx*direction);
          }else if (i===frames-1) maxDrift=Math.max(maxDrift,Math.hypot(dx,dz));
        }
      };
      window.tap(x,y,'down',11);advance(0,3);
      window.tap(x+8,y,'move',11);advance(1,4);
      window.tap(x-8,y,'move',11);advance(-1,10);
      window.tap(x,y,'move',11);advance(0,30);
      window.tap(x+40,y,'move',11);advance(1,2);
      window.tap(x+40,y,'up',11);advance(0,30);
      enemies.clear();
      return {stage:r.stage,fps,hits:r.stats.hits-initialHits,loadedSteps,maxDrift,maxSideways,minForward};
    });
  });
  const closeCrowd=await testCloseCrowd();
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
        const input=window.settleStick;
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
            for(let frame=0;frame<6;frame++){r.realDt=1/60;window.stickStep(1/60);r.input.endFrame();}
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
          for(let frame=0;frame<12;frame++){r.realDt=1/60;window.stickStep(1/60);r.input.endFrame();}
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
        assert.ok(s.headings.every(([x,y])=>Math.abs(x)<.01&&y*-s.dy>=0),'Vertical hold drifted: '+JSON.stringify(s));
        assert.ok(Math.abs(s.headings[1][1])<Math.abs(s.headings[0][1])&&Math.abs(s.headings.at(-1)[1]+s.dy)<.01,'Short drag must allow a slower walk');
        assert.ok(s.speeds[1]>=0&&s.speeds[1]<s.speeds.at(-1)*.5,'Short drag must slow the actual player');
        assert.ok(s.knobs.every(([x,y])=>Math.abs(x)<.01&&y*s.dy>0),'Painted knob drifted: '+JSON.stringify(s));
        assert.ok(Math.abs(s.movement[0])<.001&&s.dy*s.movement[1]>.5,'Vertical player path: '+JSON.stringify(s));
        assert.ok(s.turn[0]>.5&&s.turn[1]*-s.dy>.5&&Math.abs(s.reverse[0])<.01&&Math.abs(s.reverse[1]-s.dy)<.01,'Deliberate turn or reversal blocked');
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
    inspected.touches('up',{touches:[stick]});window.settleStick();
    if(t.stickId!==11||r.input.stickX<.99)throw Error('Ending the second contact released the stick');
    inspected.touches('cancel',{touches:[],changedTouches:[]});
    window.settleStick();results.push({kind:'missing-changed-touches',stopped:!r.input.stickX&&!r.input.stickY,hidden:!t.stick.classList.contains('on')});
    inspected.touches('down',{touches:[stick,second],changedTouches:[stick,second]});
    stick.clientX+=50;
    inspected.touches('move',{touches:[stick,second],changedTouches:[stick]});
    window.settleStick();for(let frame=0;frame<12;frame++)r.input.endFrame();
    if(t.stickId!==11||r.input.stickX<.99)throw Error('Stationary thumb lost its heading');
    inspected.touches('move',{touches:[second],changedTouches:[second]});
    window.settleStick();results.push({kind:'missed-stick-release',stopped:!r.input.stickX&&!r.input.stickY,hidden:!t.stick.classList.contains('on')});
    inspected.touches('up',{touches:[],changedTouches:[second]});
    for(const kind of ['cancel','lostpointercapture','pause','hide']){
      r.state='play';t.update(r,'');env.drawUI(app.r.renderer);
      window.tap(x,y,'down',11);window.tap(x+100,y,'move',11);
      if(kind==='cancel')window.tap(x+100,y,'cancel',11);
      else if(kind==='lostpointercapture')t.el.dispatchEvent(new env.PointerEvent(kind,{pointerId:11}));
      else if(kind==='pause'){r.pause();t.update(r,'');}
      else window.fixtureHide();
      window.settleStick();results.push({kind,stopped:!r.input.stickX&&!r.input.stickY,hidden:!t.stick.classList.contains('on')});
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
  assert.ok(cast.casts===1 && cast.held && cast.heading>0,JSON.stringify(cast));
  const facility=await page.evaluate(()=>{
    const r=app.run,facilities=r.interactables,t=r.ui.touch,env=inspected.env;
    const screen=inspected.doc.getElementById('game').getBoundingClientRect();
    const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.64-screen.y;
    const chest={kind:'freechest',contactTest:()=>true},interact=facilities.interact;
    let opens=0;facilities.interact=()=>opens++;
    try{
      window.tap(x,y,'down',11);window.tap(x+8,y,'move',11);
      window.settleStick();
      for(let i=0;i<100;i++)facilities.updateDwell(chest,1/30,1/30);
      const held=t.stickId===11&&r.input.stickX>0,whileMoving=opens;
      window.tap(x,y,'up',11);
      for(let i=0;i<60;i++)facilities.updateDwell(chest,1/30,1/30);
      return {held,whileMoving,afterRelease:opens};
    }finally{facilities.interact=interact;facilities.updateDwell(null,0,0);}
  });
  assert.deepEqual(facility,{held:true,whileMoving:1,afterRelease:1});
  const stall=await page.evaluate(()=>{
    const r=app.run,p=r.player,env=inspected.env,screen=inspected.doc.getElementById('game').getBoundingClientRect();
    const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.64-screen.y;
    r.enemies.clear();r.godMode=true;r.ult.clear();r.state='play';r.timeScale=1;r.hitstopT=0;
    p.pos.copy(r.terrain.spawn);p.vel.set(0,0,0);p.kx=p.kz=p.crowdX=p.crowdZ=0;p.grounded=true;
    for(let i=0;i<200;i++){
      const angle=i*2.39996;
      const id=r.enemies.spawn(19,p.pos.x+Math.cos(angle)*18,p.pos.z+Math.sin(angle)*18,1e6,1,131072);
      if(id<0)throw Error('Could not seed joystick crowd');
      r.enemies.flags[id]&=~131072;
    }
    const count=r.enemies.count,gap=1000/30,now=performance.now(),loop=app.loop;
    const samples=[],dt=[],simulate=r.simulate,frameGap=app.frameGap;
    let interpolation;
    r.simulate=function(seconds,...args){dt.push(seconds);return simulate.call(this,seconds,...args);};
    app.loop=()=>{};app.pacer.reset();app.combatClock.run=null;app.last=now-gap;app.halted=false;
    try{
      // Use one monotonic test clock for event arrivals, RAF and the simulator.
      let at=now;
      app.frameGap=()=>1000/60;
      performance.now=()=>at;
      window.tap(x,y,'down',11);window.tap(x+60,y,'move',11);
      const sequence=['hold','hold','reverse','hold','hold','hold','release',...Array(15).fill('rest')];
      for(const [i,action] of sequence.entries()){
        at=now+i*gap+(i>=2?250:0);
        if(action==='reverse')window.tap(x-60,y,'move',11);
        if(action==='release')window.tap(x-60,y,'up',11);
        const start=p.pos.x;loop(at);samples.push(p.pos.x-start);
        if(i===4){
          // 60 Hz 下的中间显示帧只插值，物理位置和输入帧号均保持稳定。
          const before=p.pos.x,tick=r.inputTick;
          at+=gap/2;loop(at);
          interpolation={before,after:p.pos.x,prev:p.motionView.px,draw:r.visiblePlayerPosition().x,
            camera:r.camTarget.x,sameTick:tick===r.inputTick};
        }
      }
    }finally{delete performance.now;app.frameGap=frameGap;app.halted=true;app.loop=loop;r.simulate=simulate;}
    return {count,gap,samples,dt,interpolation};
  });
  assert.equal(stall.count,200);
  const view=stall.interpolation;
  assert.ok(view.sameTick && view.before===view.after && Math.abs(view.prev-view.after)>.0001,JSON.stringify(view));
  assert.ok(Math.abs(view.draw-(view.prev+view.after)/2)<.0001 && view.draw===view.camera,JSON.stringify(view));
  assert.equal(stall.dt.length,22,JSON.stringify(stall));
  assert.ok(stall.dt.every(dt=>Math.abs(dt-stall.gap/1000)<1e-6),JSON.stringify(stall));
  assert.ok(stall.samples[1]>0 && stall.samples[5]<0 && stall.samples[6]<0 && stall.samples.at(-1)===0 && stall.samples.every(dx=>Math.abs(dx)<=1.6),JSON.stringify(stall));
  await page.evaluate(async()=>{
    const r=app.run;
    r.enemies.clear();r.godMode=false;
    await r.changeZone();
    if(r.stage!==2||r.state!=='play')throw Error('Could not enter the second combat area');
    r.enemies.clear();r.ui.touch.update(r,'');inspected.env.drawUI(app.r.renderer);
  });
  closeCrowd.push(...await testCloseCrowd());
  const walls=await page.evaluate(()=>{
    const r=app.run,p=r.player,t=r.terrain,env=inspected.env;
    const screen=inspected.doc.getElementById('game').getBoundingClientRect();
    const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.64-screen.y,results=[];
    // Push straight into off-centre faces and corners of real second-area props.
    // A rotated face may stop the stride but must not move an unrequested axis.
    for(const prop of t.colliders){
      if(results.length>=12)break;
      const startZ=prop.z+prop.r*.28,radius=p.radius;
      if(!t.inBounds(prop.x,startZ,4))continue;
      let startX=prop.x-prop.r-radius-1;
      const feet=t.height(startX,startZ);
      if(t.hitProp(startX,feet,startZ,radius))continue;
      while(startX<prop.x&&!t.hitProp(startX+.1,feet,startZ,radius))startX+=.1;
      if(startX>=prop.x)continue;
      p.pos.set(startX,feet,startZ);p.vel.set(0,0,0);p.grounded=true;
      p.kx=p.kz=p.crowdX=p.crowdZ=0;
      window.tap(x,y,'down',11);window.tap(x+45,y,'move',11);
      let side=0,back=0;
      for(let i=0;i<60;i++){
        const px=p.pos.x;r.realDt=1/30;window.stickStep(1/30);
        side=Math.max(side,Math.abs(p.pos.z-startZ));back=Math.max(back,px-p.pos.x);
      }
      const endX=p.pos.x;
      window.tap(x-45,y,'move',11);for(let i=0;i<6;i++)window.stickStep(1/30);
      window.tap(x-45,y,'up',11);
      results.push({side,back,reverse:endX-p.pos.x});
    }
    return results;
  });
  assert.ok(walls.length>=3&&walls.every(w=>w.side<1e-6&&w.back<1e-6&&w.reverse>0),JSON.stringify(walls));
  const retiredCalls=await page.evaluate(()=>{
    const env=inspected.env,Touch=app.run.ui.touch.constructor;
    let calls=0;
    for(let i=0;i<3;i++){
      const retired=new Touch(inspected.doc.createElement('div'));
      retired.destroy();retired.letGo=retired.releaseStick=()=>calls++;
    }
    env.dispatchEvent(new env.Event('resize'));
    const end=new env.Event('touchend');end.touches=[];env.dispatchEvent(end);
    return calls;
  });
  assert.equal(retiredCalls,0,'Retired HUDs still handle global input');
  for(const sample of closeCrowd){
    assert.ok(sample.hits>0&&sample.loadedSteps>4,JSON.stringify(sample));
    assert.ok(sample.maxDrift<1e-6&&sample.maxSideways<1e-6&&sample.minForward>0,JSON.stringify(sample));
  }
  await fs.writeFile(path.join(dir,'joystick-regression.json'),JSON.stringify({response,southEdge,circles,closeCrowd,walls,controls:report,interruptions,cast,stall},null,2));
  console.log('Joystick contact damage during clockwise/counterclockwise turns, short and full drags, reversals, multitouch and release passed:',report.length,'screen/scale combinations');
}
