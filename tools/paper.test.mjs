import test from 'node:test';
import assert from 'node:assert/strict';
import {pickupRadius,inPickupRange,pickupSpeed,pickupArrived} from '../source/src/paper-pickups.js';

test('automatic pickup includes the range boundary and tolerates falling loot',()=>{
  assert.ok(inPickupRange(6,2,0,pickupRadius(6)));
  assert.ok(!inPickupRange(6.01,0,0,6));
  assert.ok(!inPickupRange(0,12,0,6));
  assert.equal(pickupRadius(NaN),6);assert.equal(pickupRadius(14),14);
});
test('attraction catches moving players without overshooting at 15/30/60 FPS',()=>{
  for(const fps of [15,30,60]){
    let distance=6,age=0,collected=false;
    for(let frame=0;frame<fps*2;frame++){
      const dt=1/fps;age+=dt;distance+=8*dt;
      const speed=pickupSpeed(age,8);
      if(pickupArrived(distance,speed,dt)){collected=true;break;}
      distance-=speed*dt;assert.ok(distance>0);
    }
    assert.ok(collected,'loot must catch the moving player at '+fps+' FPS');
  }
  assert.ok(pickupArrived(0,pickupSpeed(0,8),1/60));
  assert.ok(pickupSpeed(1200,8)<40,'old loot must not acquire unbounded velocity');
});
