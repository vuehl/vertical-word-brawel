import test from 'node:test';
import assert from 'node:assert/strict';
import {placeCarriedMarble, updateCarriedMarble, renderCarriedMarble} from '../../source/src/combat/carried-marble.js';

function fixture() {
  const shown = {x: 0, y: 0, z: 0};
  const shadows={rows:[],push(...row){this.rows.push(row);}};
  return {state:'play', camYaw:0, egg:{}, shown,
    player:{pos:{x:0,y:0,z:0},vel:{x:0,y:0,z:0},facing:{x:1,y:0},renderScale:1},
    terrain:{surface:()=>0,propTop:()=>0},sprites:{shadows},
    visiblePlayerPosition:()=>shown,
    carriedMarble:{rows:[],begin(){this.rows.length=0;shadows.rows.length=0;},push(...row){this.rows.push(row);},end(){}},
  };
}

test('hover stays smooth and synchronized with walking and jumping at 30/60/120 Hz', () => {
  const samples=[];
  for (const fps of [30,60,120]) {
    const run=fixture(), heights=[];
    run.player.vel.x=7;run.player.vel.z=-3;
    const offsetX=-21/Math.hypot(7,3),offsetZ=9/Math.hypot(7,3);
    for(let frame=0;frame<fps*2;frame++) {
      const time=frame/fps, tick=Math.floor(time*30+1e-9);
      while((run.egg.floatTime??0)<(tick+1)/30-1e-9)updateCarriedMarble(run,1/30);
      run.renderAlpha=fps===30?1:time*30-tick;
      // 30 Hz shows the current tick; faster displays interpolate one tick behind.
      const displayedTime=fps===30?time+1/30:time;
      run.player.facing={x:Math.cos(frame),y:Math.sin(frame)};
      // Display samples keep moving between the fixed 30 Hz physics ticks.
      run.shown.x=Math.min(time,1)*7;
      run.shown.y=Math.max(0,4*time*(1-time));
      run.shown.z=-time*3;
      run.player.pos.x=tick/30*7;
      renderCarriedMarble(run);
      assert.equal(run.carriedMarble.rows.length,1);
      const [x,y,z,size,,shape,rotation]=run.carriedMarble.rows[0];
      assert.ok(Math.abs(x-run.shown.x-offsetX)<1e-9);
      const height=y-run.shown.y;
      assert.ok(height>=1.2-1e-9&&height<=2.6+1e-9);
      assert.ok(Math.abs(z-run.shown.z-offsetZ)<1e-9);
      assert.equal(size,1.1);assert.equal(shape,138);assert.equal(rotation,0);
      assert.equal(run.sprites.shadows.rows.length,1,'one grounded shadow per displayed marble');
      assert.deepEqual(run.sprites.shadows.rows[0].slice(0,3),[x,0,z]);
      if(frame>0)assert.ok(Math.abs(height-heights.at(-1))<=2.52/fps+1e-9);
      heights.push(height);
      if(Math.abs(displayedTime*30-Math.round(displayedTime*30))<1e-8)
        samples.push({tick:Math.round(displayedTime*30),height});
      const row=run.carriedMarble.rows[0].slice();
      renderCarriedMarble(run);
      assert.deepEqual(run.carriedMarble.rows[0],row,'redrawing must not advance hover time');
      assert.equal(run.sprites.shadows.rows.length,1,'redrawing must not accumulate shadows');
    }
    assert.ok(Math.max(...heights)-Math.min(...heights)>1.38,'hover must remain clearly visible during movement');
    const hover=run.egg.y-run.shown.y;
    run.shown.x=150;run.shown.y=7;run.shown.z=-100;
    renderCarriedMarble(run);
    const [x,y,z]=run.carriedMarble.rows[0];
    assert.ok(Math.abs(x-150-offsetX)<1e-9&&Math.abs(z+100-offsetZ)<1e-9);
    assert.ok(Math.abs(y-7-hover)<1e-9);
  }
  const reference=new Map();
  for(const {tick,height} of samples){
    if(reference.has(tick))assert.ok(Math.abs(height-reference.get(tick))<1e-9,'frame rate must not change the hover path');
    else reference.set(tick,height);
  }
});

test('pause retains one stable marble; hatch, death and cinematics clear its draw', () => {
  const run=fixture();
  updateCarriedMarble(run,.4);run.renderAlpha=.5;renderCarriedMarble(run);
  const frozen=run.carriedMarble.rows[0].slice();
  for(const state of ['play','paused','modal']) {
    run.state=state;
    for(let frame=0;frame<120;frame++){
      if(state!=='play'){
        run.renderAlpha=(frame%4)/4;
        updateCarriedMarble(run,1/30); // Co-op still simulates behind a modal.
      }
      renderCarriedMarble(run);assert.equal(run.carriedMarble.rows.length,1);
      assert.equal(run.sprites.shadows.rows.length,1);
      assert.deepEqual(run.carriedMarble.rows[0],frozen);
    }
  }
  for(const state of ['capturing','evolving','cinematic']) {
    run.state=state;renderCarriedMarble(run);assert.equal(run.carriedMarble.rows.length,0);
    assert.equal(run.sprites.shadows.rows.length,0);
  }
  run.state='play';run.player.dead=true;renderCarriedMarble(run);assert.equal(run.carriedMarble.rows.length,0);
  assert.equal(run.sprites.shadows.rows.length,0);
  run.player.dead=false;run.egg=null;renderCarriedMarble(run);assert.equal(run.carriedMarble.rows.length,0);
  assert.equal(run.sprites.shadows.rows.length,0);
});

test('shadow remains grounded and shrinks as the marble rises or jumps', () => {
  const run=fixture();
  run.terrain={surface:()=>.1,propTop:()=>.6,workshopGroundY:()=>.9};
  renderCarriedMarble(run);
  const base=run.sprites.shadows.rows[0].slice(),height=run.egg.y;
  assert.deepEqual(base.slice(0,3),[run.egg.x,.9,run.egg.z]);
  updateCarriedMarble(run,Math.PI/(2*3.6));renderCarriedMarble(run);
  const high=run.sprites.shadows.rows[0].slice();
  assert.ok(run.egg.y>height&&high[3]<base[3],'rising hover must shrink its ground shadow');
  run.shown.y=3;renderCarriedMarble(run);
  const jumping=run.sprites.shadows.rows[0];
  assert.deepEqual(jumping.slice(0,3),base.slice(0,3),'jumping must leave the shadow on the surface');
  assert.ok(jumping[3]<high[3]&&run.egg.y-jumping[1]>4,'jump height must separate the marble from its shadow');
});

test('a simulation hold cannot replay the previous hover segment as renderAlpha cycles', () => {
  const run=fixture();placeCarriedMarble(run);
  run.player.vel.z=-7;updateCarriedMarble(run,1/30);
  let previous=0,angle=run.egg.followPrevious;
  for(const alpha of [.25,.5,.75,0,.25,.5,.75,0]){
    run.renderAlpha=alpha;renderCarriedMarble(run);
    assert.ok(run.egg.floatShown>=previous);
    assert.ok(run.egg.followShown<=angle,'a clockwise arc must not replay backwards during a hold');
    previous=run.egg.floatShown;
    angle=run.egg.followShown;
  }
});

test('hover advances with simulation time, including slow motion and new pickups', () => {
  const normal=fixture(), slow=fixture();
  for(let tick=0;tick<30;tick++)updateCarriedMarble(normal,1/30);
  for(let tick=0;tick<60;tick++)updateCarriedMarble(slow,1/60);
  renderCarriedMarble(normal);renderCarriedMarble(slow);
  assert.ok(Math.abs(normal.egg.y-slow.egg.y)<1e-9);
  const height=normal.egg.y;
  normal.shown.y=3;renderCarriedMarble(normal);
  assert.ok(Math.abs(normal.egg.y-height-3)<1e-9,'jump height is inherited immediately');
  normal.egg={};normal.shown.y=0;renderCarriedMarble(normal);
  assert.equal(normal.egg.y,1.9,'a new marble starts with its own hover phase');
});

test('all movement directions trail behind with hero clearance, independent of camera and aim', () => {
  for(let direction=0;direction<8;direction++) {
    const run=fixture(),angle=direction*Math.PI/4;
    run.player.renderScale=2;
    run.player.vel.x=Math.cos(angle)*7;run.player.vel.z=Math.sin(angle)*7;
    for(const yaw of [0,Math.PI/2,Math.PI,3*Math.PI/2]) {
      run.camYaw=yaw;run.player.facing={x:Math.cos(yaw),y:Math.sin(yaw)};placeCarriedMarble(run);
      assert.ok(Math.abs(Math.hypot(run.egg.x,run.egg.z)-6)<1e-9);
      assert.ok(Math.abs(run.egg.x*Math.cos(angle)+run.egg.z*Math.sin(angle)+6)<1e-9);
    }
  }
});

test('90 and 180 degree turns trace a smooth fixed-radius arc at 30/60/120 Hz', () => {
  const reference=new Map();
  for(const fps of [30,60,120]) {
    const run=fixture();let steps=0,previous=null,quarterArc=0,halfArc=0;
    for(let frame=0;frame<fps*3;frame++) {
      const time=frame/fps,tick=Math.floor(time*30+1e-9);
      while(steps<=tick){
        const t=steps/30;
        run.player.vel.x=t<.5?7:0;
        run.player.vel.z=t<.5?0:t<1.5?7:t<2.5?-7:0;
        updateCarriedMarble(run,1/30);steps++;
      }
      run.renderAlpha=fps===30?1:time*30-tick;
      run.shown.x=time*2;run.shown.z=-time;run.shown.y=Math.sin(time)*2;
      run.camYaw=time*6;run.player.facing={x:Math.cos(time*20),y:Math.sin(time*20)};
      renderCarriedMarble(run);
      const x=run.egg.x-run.shown.x,z=run.egg.z-run.shown.z;
      assert.ok(Math.abs(Math.hypot(x,z)-3)<1e-9,'turns must never cut through the hero');
      if(previous){
        const delta=Math.atan2(previous.x*z-previous.z*x,previous.x*x+previous.z*z);
        assert.ok(delta>=-1e-9&&delta<=8/fps+1e-9,'turn direction and angular speed must remain continuous');
      }
      previous={x,z};
      if(time>.5&&time<1.3&&Math.abs(x)>.2&&Math.abs(z)>.2)quarterArc++;
      if(time>1.5&&time<2.3&&Math.abs(x)>.2&&Math.abs(z)>.2)halfArc++;
      if(time>1.3&&time<1.5)assert.ok(z<-2.99,'quarter turn settles behind the new velocity');
      if(time>2.3)assert.ok(z>2.99,'reversal and stop retain the new trailing direction');
      const displayedTick=(fps===30?time+1/30:time)*30;
      if(Math.abs(displayedTick-Math.round(displayedTick))<1e-8){
        const key=Math.round(displayedTick),sample=reference.get(key);
        if(sample)assert.ok(Math.hypot(x-sample.x,z-sample.z)<1e-9,'display rate must not change the arc');
        else reference.set(key,{x,z});
      }
    }
    assert.ok(quarterArc>=4&&halfArc>=8,'both turns must visibly travel around the hero');
  }
});

test('stopping finishes the turn; idle aim, pauses and teleports cannot rotate the trailing direction', () => {
  const run=fixture();placeCarriedMarble(run);
  run.player.vel.z=7;updateCarriedMarble(run,1/30);
  run.player.vel.z=0;
  for(let tick=0;tick<30;tick++)updateCarriedMarble(run,1/30);
  renderCarriedMarble(run);assert.ok(run.egg.z<-2.99);
  const angle=run.egg.followAngle;
  run.state='paused';run.player.vel.x=-7;run.player.facing={x:-1,y:0};
  for(let tick=0;tick<30;tick++){updateCarriedMarble(run,1/30);renderCarriedMarble(run);}
  assert.equal(run.egg.followAngle,angle);
  const x=run.egg.x,z=run.egg.z;
  run.shown.x=100;run.shown.z=-80;renderCarriedMarble(run);
  assert.ok(Math.abs(run.egg.x-100-x)<1e-9&&Math.abs(run.egg.z+80-z)<1e-9);
});
