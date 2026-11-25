import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Run against the built WeChat package, including its native-canvas adapter.
export async function reviewSummonModes(page, dir) {
  const report={environment:'Chrome WeChat API fixture; not a physical phone',cases:[]};
  const cases=[
    {name:'manual',trigger:'manual',expected:'manual',art:true},
    {name:'auto',trigger:'auto',expected:'auto',art:true},
    {name:'zone2-manual',trigger:'manual',expected:'manual',stage:2},
    {name:'zone2-auto',trigger:'auto',expected:'auto',stage:2},
    {name:'manual-first',trigger:'manual-first',expected:'manual'},
    {name:'timer-first',trigger:'timer-first',expected:'auto'},
    {name:'coop-manual',trigger:'manual',expected:'manual',coop:true},
    {name:'coop-auto',trigger:'auto',expected:'auto',coop:true},
    {name:'coop-legacy',trigger:'remote',expected:'manual',coop:true},
    {name:'coop-remote-auto',trigger:'remote',expected:'auto',coop:true,remoteMode:'auto'},
  ];
  for (const spec of cases) {
    const started=await page.evaluate(async spec=>{
      // Use the real cooperative controller with an in-memory transport. This
      // isolates message compatibility from account access and relay availability.
      window.summonPackets=[];
      const config={species:4,biome:'forest',tier:0,boosts:[],mode:'standard'};
      const begin=app.meta.beginRun;
      if(spec.coop){
        const me={id:'summon-local',slot:0,name:'本机',species:4};
        const peer={id:'summon-peer',slot:1,name:'队友',species:16};
        const room={me:me.id,mine:me,others:[peer],open:true,room:{members:[me,peer],state:'started',party:'summon-qa'},
          mesh:{broadcast:packet=>window.summonPackets.push(packet),sendCtl:()=>{}},
          linkState:()=> 'closed',waitForBattleStart:async()=>{},request:async()=>{},send:()=>{},leave:()=>{}};
        config.coop={party:'summon-qa',room};
        app.meta.beginRun=async cfg=>({...await begin.call(app.meta,{...cfg,party:undefined}),party:cfg.party,offline:false});
      }
      try {
        if(!await app.startRun(config))throw app.lastStartError||Error('Could not start summon case');
      } finally {app.meta.beginRun=begin;}
      app.halted=true;
      if(spec.stage===2)await app.run.enterPortal();
      const r=app.run, facilities=r.interactables, door=facilities.list.find(o=>o.kind==='boss');
      await door.modelReady;
      r.godMode=true;r.queueLevelUp=()=>{};r.capture.update=()=>{};r.enemies.clear();
      if(spec.art){
        const id=r.enemies.spawn(47,door.x+2,door.z,1,1);
        if(id<0)throw Error('Could not stage a sacrifice');
        r.enemies.hp[id]=r.enemies.maxHp[id]*.75;
      }
      r.player.moves.fill(null);r.nextCp=1e9;r.state='play';
      r.hints.el?.remove();r.ui.hudEl.querySelectorAll('.banner,.run-hint,.zx-intro').forEach(n=>n.remove());
      r.director.timeline=r.director.timeline.filter(event=>event.kind==='guardian');
      const deadline=r.director.timeline[0].t;
      window.summonRenderWorld=r.renderWorld.bind(r);r.renderWorld=()=>{};
      r.player.vel.set(0,0,0);r.input.stickX=r.input.stickY=0;
      const inside=()=>r.player.pos.set(door.x+1,door.y,door.z);
      const outside=()=>r.player.pos.set(door.x+door.r+3,door.y,door.z);
      const hold=count=>{for(let i=0;i<count;i++)facilities.update(0,1/60);};
      let locked,waiting,received;
      if(spec.trigger.startsWith('manual')){
        const unlock=spec.stage===2?180:300;
        r.time=600;r.stageTime=0;
        if(facilities.label(door)!=='距可提前召唤 '+(spec.stage===2?'03:00':'05:00'))throw Error('Incorrect local zone unlock clock');
        inside();r.stageTime=unlock-.1;hold(200);facilities.interact(door);
        locked=!r.bossSpawned&&facilities.dwellTime===0;
        outside();facilities.update(0,0);
        r.stageTime=spec.trigger==='manual-first'?deadline-.01:unlock;
        if(facilities.label(door)!=='靠近即可唤醒镇守')throw Error('Door did not unlock');
        hold(1);waiting=!r.bossSpawned;
        inside();hold(1);
        if(spec.trigger==='manual-first'){r.stageTime=deadline;r.director.fire('guardian');}
      }else if(spec.trigger==='remote'){
        r.state='paused';
        r.coop.room.ev.ctl('summon-peer',{t:'boss',st:r.stage,x:door.x,z:door.z,a:1,summonMode:spec.remoteMode});
        received={mode:r.coop.pendingBoss?.summonMode,waiting:!r.bossSpawned};
        r.state='play';r.coop.tick(0);
      }else{
        outside();facilities.update(0,0);
        r.time=r.stageTime=deadline-.02;
        r.update(.01);waiting=!r.bossSpawned;
        r.update(.02);
        if(spec.trigger==='timer-first'){inside();hold(1);}
      }
      await r.dragonHdAssets?.loading;
      if(!r.dragonHd)throw Error('Missing HD summon in '+spec.name);
      const canvas=r.ui.hudEl.querySelector('.zx-dragon-chant'), boss=r.boss.bossIndex;
      if(!canvas)throw Error('Missing summon animation in '+spec.name);
      window.summonCanvas=canvas;
      const mode=canvas.dataset.summonMode;
      // A duplicate of the opposite trigger must not replace the running effect.
      facilities.summonGuardian(door,door,mode==='manual'?'auto':'manual');
      if(spec.coop)r.coop.room.ev.ctl('summon-peer',{t:'boss',st:r.stage,x:door.x,z:door.z,a:1,summonMode:'auto'});
      return {deadline,locked,waiting,received,mode,boss:r.boss.name,alive:r.boss.live(boss),used:door.used,
        state:r.state,hidden:r.ui.root.querySelector('.zx-hud').hidden,
        once:r.boss.bossIndex===boss&&r.ui.hudEl.querySelectorAll('.zx-dragon-chant').length===1&&canvas.dataset.summonMode===mode,
        packets:window.summonPackets.filter(p=>p.t==='boss')};
    },spec);
    assert.equal(started.deadline,360);
    assert.equal(started.mode,spec.expected,spec.name);
    assert.equal(started.boss,'龘');assert.equal(started.state,'cinematic');
    assert.ok(started.alive&&started.used&&started.hidden&&started.once);
    if(spec.trigger.startsWith('manual'))assert.ok(started.locked&&started.waiting);
    if(spec.trigger==='auto'||spec.trigger==='timer-first')assert.ok(started.waiting);
    if(spec.trigger==='remote'){
      assert.deepEqual(started.received,{mode:spec.expected,waiting:true});
      assert.equal(started.packets.length,0,'Remote summon must not echo');
    }else if(spec.coop){
      assert.equal(started.packets.length,1);assert.equal(started.packets[0].summonMode,spec.expected);
    }
    const frames=[];
    if(spec.art){
      for(const seconds of [.12,.55,.9,1.4,1.68,1.78]){
        const frame=await page.evaluate(seconds=>{
          const r=app.run,canvas=window.summonCanvas;
          for(let i=0;i<120&&r.dragonHd.time+1e-6<seconds;i++)r.update(Math.min(1/60,seconds-r.dragonHd.time));
          if(Math.abs(r.dragonHd.time-seconds)>.001)throw Error('Summon clock stalled during the chant');
          const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
          let blue=0,red=0,visible=0,hash=0;
          for(let i=0;i<pixels.length;i+=4){
            const [r,g,b,a]=pixels.subarray(i,i+4);
            if(a){visible++;hash=(Math.imul(hash,31)+r+g*3+b*7+a*11)|0;}
            if(a>100&&b>90&&b-r>30&&b-g>15)blue++;
            if(a>100&&r>90&&r-b>30&&r-g>15)red++;
          }
          window.summonRenderWorld(0);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
          return {seconds,blue,red,visible,hash,word:canvas.dataset.word};
        },seconds);
        frames.push(frame);
        if([.12,.55,1.68].includes(seconds))await page.screenshot({path:path.join(dir,`summon-${spec.name}-${seconds}.png`)});
      }
      const main=frames[1],colour=spec.expected==='auto'?'red':'blue',other=colour==='red'?'blue':'red';
      assert.ok(main[colour]>1000&&main[colour]>main[other]*3,JSON.stringify(main));
      assert.equal(frames[2].hash,frames[3].hash,'Hold the complete artwork without redrawing');
      assert.notEqual(frames[4].hash,frames[3].hash,'Artwork retracts to the left');
      assert.equal(frames[5].visible,0,'The overlay must fully clear after retraction');
      for(const seconds of [2.04,2.85,3.34,3.46,3.82]){
        const frame=await page.evaluate(seconds=>{
          const r=app.run,fx=r.dragonHd;
          for(let i=0;i<180&&fx.time+1e-6<seconds;i++)r.update(1/60);
          window.summonRenderWorld(0);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
          const pixelCheck=seconds===3.34;
          let allWhite=false;
          if(pixelCheck){
            const gl=app.r.renderer.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
            const pixels=new Uint8Array(w*h*4);
            gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
            allWhite=pixels.every(v=>v===255);
          }
          const projected=fx.center.clone().project(r.r.camera);
          return {seconds,time:fx.time,centered:Math.abs(projected.x)<.02&&Math.abs(projected.y)<.02,
            arc:fx.arc.layers[1].visible,after:fx.after.mesh.visible,
            hidden:fx.hides(fx.id),allWhite,hd:!!r.restoreDragonGlyph,
            draining:fx.victims.some(v=>v.removed>0&&r.enemies.alive[v.id]&&!fx.hides(v.id)),
            allDrained:fx.victims.length>0&&fx.victims.every(v=>!r.enemies.alive[v.id])};
        },seconds);
        frames.push(frame);
        assert.ok(Math.abs(frame.time-seconds)<.018&&frame.hd&&frame.centered,JSON.stringify(frame));
        assert.equal(frame.hidden,seconds<3.68);
        assert.equal(frame.after,seconds>=3.41);
        if(seconds===2.04)assert.ok(frame.arc&&frame.draining,JSON.stringify(frame));
        if(seconds===2.85)assert.ok(frame.allDrained,JSON.stringify(frame));
        if(seconds===3.34)assert.ok(frame.allWhite,'Flash must cover the whole composited viewport');
        await page.screenshot({path:path.join(dir,`summon-${spec.name}-${seconds}.png`)});
      }
    }
    const ended=await page.evaluate(()=>{
      const r=app.run;
      for(let i=0;i<330&&r.state==='cinematic';i++)r.update(1/60);
      r.renderWorld=window.summonRenderWorld;
      r.ui.hud(r);r.renderWorld(0);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
      return {state:r.state,alive:r.boss.alive,chant:!!r.ui.dragonChant,
        canvas:!!r.ui.hudEl.querySelector('.zx-dragon-chant'),cinematic:r.ui.hudEl.classList.contains('cinematic'),
        hidden:r.ui.root.querySelector('.zx-hud').hidden};
    });
    assert.deepEqual(ended,{state:'play',alive:true,chant:false,canvas:false,cinematic:false,hidden:false});
    if(spec.name==='zone2-manual'){
      const finalZone=await page.evaluate(async()=>{
        const r=app.run;
        r.enemies.hp[r.boss.bossIndex]=0;r.combat.killEnemy(r.boss.bossIndex,{});
        const portal=r.interactables.list.find(o=>o.kind==='portal');
        if(!r.stageCleared||!portal)throw Error('Defeating zone 2 did not open the exit');
        await r.enterPortal();r.update(0);
        if(r.bossSpawned)throw Error('Final boss started before the clock was reached');
        const [clock]=r.interactables.list;
        r.player.pos.set(clock.x,clock.y,clock.z);r.interactables.update(1/30,1/30);
        return {stage:r.stage,sanctuary:!!r.sanctuary,boss:r.boss.name,alive:r.boss.alive};
      });
      assert.deepEqual(finalZone,{stage:4,sanctuary:true,boss:'龘',alive:true});
    }
    if(spec.art)await page.screenshot({path:path.join(dir,`summon-${spec.name}-battle.png`)});
    report.cases.push({name:spec.name,started,frames,ended});
    console.log('Summon mode passed:',spec.name);
  }
  fs.writeFileSync(path.join(dir,'summon-modes.json'),JSON.stringify(report,null,2)+'\n');
}
