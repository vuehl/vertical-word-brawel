import test from 'node:test';
import assert from 'node:assert/strict';
import {encounterAt,nextEncounter} from './encounters.mjs';

test('time jumps select the most recent boss wave, including the exact boundary',()=>{
  const events=[{kind:'alpha',t:480},{kind:'alpha',t:150},{kind:'totem',t:290},{kind:'card',t:299},{kind:'summoner',t:360},{kind:'totem',t:420}];
  assert.equal(encounterAt(events,149.99),null);
  assert.deepEqual(encounterAt(events,150),{kind:'alpha',t:150});
  assert.deepEqual(encounterAt(events,300),{kind:'totem',t:290});
  assert.deepEqual(encounterAt(events,360),{kind:'summoner',t:360});
  assert.deepEqual(encounterAt(events,600),{kind:'alpha',t:480});
  assert.deepEqual(nextEncounter(events,150),{kind:'totem',t:290});
  assert.equal(nextEncounter(events,600),null);
});

test('encounter choice follows the actual difficulty timeline, with explicit guardian and empty overrides',()=>{
  const early=[{kind:'alpha',t:90},{kind:'totem',t:230}];
  assert.deepEqual(encounterAt(early,120),{kind:'alpha',t:90});
  assert.deepEqual(encounterAt(early,0,'guardian'),{kind:'guardian',t:0});
  assert.equal(encounterAt(early,600,'none'),null);
  assert.equal(encounterAt([],600),null);
});
