import test from 'node:test';
import assert from 'node:assert/strict';
import {ExperienceRing} from '../source/src/experience-ring.js';
import {UpgradeTiming} from '../source/src/upgrade-timing.js';

test('upgrade waits for the entire ultimate, a minimum presentation and its tail',()=>{
  const timing=new UpgradeTiming(),ult={active:0,castPending:false};
  assert.equal(timing.waiting(ult),false);
  timing.beginUltimate();ult.castPending=true;timing.update(.5,ult,true);
  assert.equal(timing.waiting(ult),true);
  ult.castPending=false;ult.active=2;timing.update(2,ult,true);
  assert.equal(timing.waiting(ult),true,'A long skill cannot be cut short by the minimum delay');
  ult.active=0;timing.update(.1,ult,true);assert.equal(timing.waiting(ult),true);
  timing.update(.11,ult,true);assert.equal(timing.waiting(ult),false);
  timing.beginUltimate();timing.update(1.4,ult,true);assert.equal(timing.waiting(ult),true);
  timing.update(10,ult,false);assert.equal(timing.waiting(ult),true,'Pause/background cannot consume the delay');
  timing.update(.11,ult,true);assert.equal(timing.waiting(ult),false);
  timing.beginUltimate();timing.clear();assert.equal(timing.waiting(ult),false);
});

test('experience fills completely before the displayed level changes or upgrades can open',()=>{
  assert.ok(new ExperienceRing({level:1,xp:99.99999999999,xpNext:100}).progress<1,'Rounding must not show a completed lap below the threshold');
  const player={level:1,xp:99,xpNext:100},ring=new ExperienceRing(player,0);
  assert.equal(ring.progress,.99);assert.ok(ring.ready);
  Object.assign(player,{level:2,xp:12,xpNext:120});
  ring.update(player,10);assert.equal(ring.level,1);assert.equal(ring.ready,false);
  ring.update(player,80);assert.ok(ring.progress>.99&&ring.progress<1);
  ring.update(player,150);assert.equal(ring.progress,1);assert.equal(ring.level,1);assert.equal(ring.ready,false);
  ring.update(player,329);assert.equal(ring.progress,1);assert.equal(ring.ready,false);
  ring.update(player,330);assert.equal(ring.level,2);assert.equal(ring.progress,.1);assert.ok(ring.ready);
});

test('low FPS cannot skip the full ring, and paused time cannot consume its hold',()=>{
  const player={level:1,xp:20,xpNext:100},ring=new ExperienceRing(player,0);
  player.level=2;player.xp=0;
  ring.update(player,1000);ring.update(player,2000);
  assert.equal(ring.progress,1);assert.equal(ring.ready,false);
  ring.update(player,8000,false);assert.equal(ring.level,1);assert.equal(ring.ready,false);
  ring.update(player,8100);assert.equal(ring.level,1);
  ring.update(player,8200);assert.equal(ring.level,2);assert.ok(ring.ready);
});

test('multiple earned levels each complete a lap and preserve the final overflow',()=>{
  const player={level:1,xp:80,xpNext:100},ring=new ExperienceRing(player,0);
  Object.assign(player,{level:4,xp:25,xpNext:200});
  const complete=[];let now=0;
  while(!ring.ready||ring.level!==player.level){
    ring.update(player,now+=200);
    if(ring.progress===1)complete.push(ring.level);
    assert.ok(now<3000);
  }
  assert.deepEqual(complete,[1,2,3]);assert.equal(ring.level,4);assert.equal(ring.progress,.125);
});
