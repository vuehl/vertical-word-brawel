import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryCleanup} from '../../platform/memory.mjs';

function fixture(platform='ios'){
  let now=10000,gcs=0,trims=0;const tasks=[];
  const memory=createMemoryCleanup({triggerGC:()=>gcs++},{platform},()=>trims++,{
    now:()=>now,schedule:(fn,delay)=>tasks.push({fn,at:now+delay}),
  });
  return {memory,tasks,get gcs(){return gcs;},get trims(){return trims;},
    flush(){const task=tasks.shift();now=task.at;task.fn();}};
}

test('cinematic and scene cleanup coalesce after the current stack and throttle native GC',()=>{
  const f=fixture();f.memory.request();f.memory.request();
  assert.equal(f.gcs,0);assert.equal(f.trims,0);assert.equal(f.tasks.length,1);
  f.flush();assert.equal(f.gcs,1);assert.equal(f.trims,1);
  f.memory.request();assert.equal(f.tasks[0].at,15000);
  f.memory.request();f.memory.warning();f.memory.warning();
  assert.equal(f.gcs,1);assert.equal(f.trims,3);assert.equal(f.tasks.length,1);
  f.flush();assert.equal(f.gcs,2);
});

test('Android trims unused resources without requesting iOS native GC',()=>{
  const f=fixture('android');f.memory.request();f.flush();f.memory.warning();
  assert.equal(f.gcs,0);assert.equal(f.trims,2);
});

test('missing or rejected native GC does not prevent resource cleanup',()=>{
  for(const wx of [{},{triggerGC(){throw Error('unavailable');}}]){
    let trims=0;const memory=createMemoryCleanup(wx,{platform:'ios'},()=>trims++);
    assert.doesNotThrow(()=>memory.warning());assert.equal(trims,1);
  }
});
