import test from 'node:test';
import assert from 'node:assert/strict';
import {placeCarriedMarble, renderCarriedMarble} from '../../source/src/combat/carried-marble.js';

function fixture() {
  const shown = {x: 0, y: 0, z: 0};
  return {state:'play', camYaw:0, egg:{}, shown,
    player:{pos:{x:0,y:0,z:0},facing:{x:1,y:0},renderScale:1},
    visiblePlayerPosition:()=>shown,
    carriedMarble:{rows:[],begin(){this.rows.length=0;},push(...row){this.rows.push(row);},end(){}},
  };
}

test('marble follows every displayed frame at 30/60/120 Hz without aiming drift or accumulating copies', () => {
  for (const fps of [30,60,120]) {
    const run=fixture();
    for(let frame=0;frame<fps*2;frame++) {
      run.player.facing={x:Math.cos(frame),y:Math.sin(frame)};
      // Display samples keep moving between the fixed 30 Hz physics ticks.
      run.shown.x=Math.min(frame/fps,1)*7;
      run.player.pos.x=Math.floor(frame*30/fps)/30*7;
      renderCarriedMarble(run);
      assert.equal(run.carriedMarble.rows.length,1);
      const [x,y,z,size,,shape,rotation]=run.carriedMarble.rows[0];
      assert.ok(Math.abs(x-run.shown.x-3)<1e-9);
      assert.equal(y,1.3);assert.equal(z,-1.2);
      assert.equal(size,1.1);assert.equal(shape,138);assert.equal(rotation,0);
    }
    run.shown.x=150;run.shown.y=7;run.shown.z=-100;
    renderCarriedMarble(run);
    assert.deepEqual(run.carriedMarble.rows[0].slice(0,3),[153,8.3,-101.2]);
  }
});

test('pause retains one stable marble; hatch, death and cinematics clear its draw', () => {
  const run=fixture();
  for(const state of ['play','paused','modal']) {
    run.state=state;renderCarriedMarble(run);assert.equal(run.carriedMarble.rows.length,1);
  }
  for(const state of ['capturing','evolving','cinematic']) {
    run.state=state;renderCarriedMarble(run);assert.equal(run.carriedMarble.rows.length,0);
  }
  run.state='play';run.player.dead=true;renderCarriedMarble(run);assert.equal(run.carriedMarble.rows.length,0);
  run.player.dead=false;run.egg=null;renderCarriedMarble(run);assert.equal(run.carriedMarble.rows.length,0);
});

test('larger heroes retain side clearance and camera-relative placement', () => {
  const run=fixture();run.player.renderScale=2;
  for(const yaw of [0,Math.PI/2,Math.PI,3*Math.PI/2]) {
    run.camYaw=yaw;placeCarriedMarble(run);
    const right=run.egg.x*Math.cos(yaw)-run.egg.z*Math.sin(yaw);
    assert.ok(Math.abs(right-6)<1e-9);
  }
});
