import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function verifyCombatSteering(page,dir){
  const trace=await page.evaluate(async()=>{
    const r=app.run,p=r.player,enemies=r.enemies,ui=r.ui.touch;
    const env=inspected.env,screen=inspected.doc.getElementById('game').getBoundingClientRect();
    const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.64-screen.y;
    // Start just south of the tissue box, on the same approach as the edge test.
    p.pos.set(-31,0,r.terrain.deskBounds.z-3);p.vel.set(0,0,0);p.grounded=true;
    p.hp=p.maxHp=1e6;p.xpNext=1e9;p.stats.evasion=0;r.camTarget.copy(p.pos);
    r.director.update=()=>{};r.events.update=()=>{};
    const frames=[],start=performance.now(),update=r.update,simulate=r.simulate,drawUI=env.drawUI;
    const projectiles=r.projectiles,updateShots=projectiles.update;
    let scheduledShot=false,shotHits=0;
    let command=null,lastFrame=null,enemySerial=0,lastShot=-1,latestTouch=start,steps=[];
    let down=false,serial=0;
    const commands=[[0,-45],[0,-8],[8,0],[0,0],[-8,0],[0,8],null,[0,-45]];
    function gesture(next){
      if(r.state!=='play'){down=false;return;}
      if(down && ui.stickId!==11)down=false;
      if(next===command && (!!next===down))return;
      if(next){
        if(!down)window.tap(x,y,'down',11);
        window.tap(x+next[0],y+next[1],'move',11);
      }else if(down)window.tap(x,y,'up',11);
      down=!!next;command=next;latestTouch=performance.now();serial++;
    }
    r.simulate=function(dt,...args){steps.push(dt);return simulate.call(this,dt,...args);};
    r.update=function(...args){
      const now=app.last,seconds=(performance.now()-start)/1000;
      // 掉落和道具可能重算基础属性。保持测试角色存活，同时保留真实命中、
      // 击退和碰撞；死亡/升级界面会合法地解除摇杆，不能混入持续操控样本。
      p.hp=p.maxHp=1e6;
      p.xp=0;p.xpNext=1e9;
      const cap=seconds<20||seconds>=106?12:Math.min(200,12+Math.floor((seconds-20)*5));
      while(enemies.count>cap){
        let id=enemies.n-1;while(!enemies.alive[id])id--;
        enemies.kill(id);
      }
      for(let i=0;i<6&&enemies.count<cap;i++){
        const a=enemySerial++*2.4;
        const id=enemies.spawn(19,p.pos.x+Math.cos(a)*5,p.pos.z-5+Math.sin(a)*4,1e6,1,131072);
        if(id<0)break;
        enemies.flags[id]&=~131072;
      }
      // A normal hostile shot arriving from the side while steering or at rest.
      const shot=Math.floor(seconds/1.3);
      if(shot!==lastShot&&enemies.alive[0]){
        lastShot=shot;scheduledShot=true;
        r.projectiles.fire({x:p.pos.x-.45,y:p.pos.y+.8,z:p.pos.z,dx:1,dz:0,speed:11,
          life:.4,radius:.45,dmg:2,type:'normal',flags:1,from:0});
      }
      const beforeX=p.pos.x,beforeZ=p.pos.z,beforeHits=r.stats.hits,beforeShots=shotHits;
      steps=[];
      const result=update.apply(this,args);
      frames.push({seconds,interval:lastFrame==null?0:now-lastFrame,count:enemies.count,slots:enemies.n,
        timers:r.timers.length,command,serial,touchAge:performance.now()-latestTouch,
        stick:[r.input.stickX,r.input.stickY],velocity:[p.vel.x,p.vel.z],impulse:[p.kx,p.kz],
        delta:[p.pos.x-beforeX,p.pos.z-beforeZ],ticks:steps,hits:r.stats.hits-beforeHits,shotHits:shotHits-beforeShots,
        state:r.state,owner:ui.stickId,facility:r.interactables.nearest?.kind,
        wall:r.terrain.hitProp(p.pos.x,p.pos.y,p.pos.z-.3,p.radius)});
      lastFrame=now;return result;
    };
    projectiles.update=function(...args){
      if(scheduledShot)p.iframes=0;
      const hits=r.stats.hits,result=updateShots.apply(this,args);
      shotHits+=r.stats.hits-hits;scheduledShot=false;
      return result;
    };
    env.drawUI=function(...args){
      const result=drawUI.apply(this,args),frame=frames.at(-1);
      // 纯插值绘制可能落在下一次手势和下一步逻辑之间。
      if(frame&&frame.serial===serial&&frame.owner===11&&ui.stickId===11){
        const b=inspected.layout.box(ui.stick),k=inspected.layout.box(ui.knob);
        frame.knob=[k.x+k.w/2-(b.x+b.w/2),k.y+k.h/2-(b.y+b.h/2)];
      }
      return result;
    };
    // Keep the real RAF, HUD, renderer and WeChat touch dispatch active throughout.
    const timer=setInterval(()=>{
      const phase=(performance.now()-start)%8000;
      // Hold at the wall for several seconds. Lift and centre briefly so this
      // steering test never deliberately completes an interaction dwell.
      const index=phase<4000?0:1+Math.min(6,Math.floor((phase-4000)/575));
      gesture(commands[index]);
    },30);
    try{
      gesture(commands[0]);app.halted=false;
      await new Promise(resolve=>setTimeout(resolve,122000));
    }finally{
      clearInterval(timer);gesture(null);app.halted=true;
      r.update=update;r.simulate=simulate;env.drawUI=drawUI;projectiles.update=updateShots;
    }
    return frames;
  });
  const phases=[['opening',0,20],['ramp',20,60],['crowd',60,106],['reduced',106,123]];
  const summary=phases.map(([phase,from,to])=>{
    const rows=trace.filter(f=>f.seconds>=from&&f.seconds<to);
    const intervals=rows.map(f=>f.interval).sort((a,b)=>a-b);
    let inputErrors=0,knobErrors=0,maxWrongStep=0,settled=0,age=0,serial=-1;
    for(const f of rows){
      const [cx,cz]=f.command||[0,0],[sx,sy]=f.stick,[dx,dz]=f.delta;
      // A real upgrade/facility modal releases the captured finger. Verify
      // cancellation there; directional assertions apply during combat.
      if(f.state!=='play'){
        assert.equal(f.owner,-1);
        assert.deepEqual(f.stick,[0,0]);
        serial=-1;continue;
      }
      if(serial!==f.serial){serial=f.serial;age=0;}
      age+=f.ticks.length;
      if(f.knob&&(Math.abs(f.knob[0])>.01&&Math.sign(f.knob[0])!==Math.sign(cx)||
        Math.abs(f.knob[1])>.01&&Math.sign(f.knob[1])!==Math.sign(cz)))knobErrors++;
      // 滤波和刹车需要若干物理步。所有过渡帧仍要满足位移上限。
      assert.ok(Math.hypot(dx,dz)<=1.600001);
      if(age<8)continue;
      settled++;
      const sign=v=>Math.abs(v)<.01?0:Math.sign(v);
      if(sign(sx)!==Math.sign(cx)||sign(-sy)!==Math.sign(cz))inputErrors++;
      maxWrongStep=Math.max(maxWrongStep, cx?Math.max(0,-Math.sign(cx)*dx):Math.abs(dx),
        cz?Math.max(0,-Math.sign(cz)*dz):Math.abs(dz));
    }
    return {phase,frames:rows.length,settled,peak:Math.max(...rows.map(f=>f.count)),p95Ms:intervals[Math.floor(intervals.length*.95)],
      over60ms:intervals.filter(n=>n>60).length,maxTick:Math.max(...rows.flatMap(f=>f.ticks)),
      hits:rows.reduce((a,f)=>a+f.hits,0),shotHits:rows.reduce((a,f)=>a+f.shotHits,0),wallFrames:rows.filter(f=>f.wall).length,inputErrors,knobErrors,maxWrongStep};
  });
  await fs.writeFile(path.join(dir,'combat-steering.json'),JSON.stringify({summary,trace}));
  console.log('Combat steering soak',JSON.stringify(summary));
  assert.ok(summary.every(s=>s.settled>0&&s.inputErrors===0&&s.knobErrors===0&&s.maxWrongStep<.002&&s.maxTick<=1/30+.00001));
  assert.ok(summary[2].peak===200&&summary[2].shotHits>0&&summary[2].wallFrames>0&&summary[3].peak<=12);
}
