import test from 'node:test';
import assert from 'node:assert/strict';
import {deviceFramePolicy,applyFrameRatePolicy,setFrameRateLock,resetFrameRatePolicy} from '../source/src/frame-policy.js';
import {readRuntimeInfo,readDevicePerformance} from '../platform/device.mjs';
import {CriticalImpactBudget} from '../source/src/effect-budget.js';

test('Android and iOS prefer the current WeChat tier, with conservative fallbacks',()=>{
  for(const platform of ['android','ios']){
    for(const [modelLevel,tier,lock] of [[1,'high',false],[2,'medium',true],[3,'low',true]]){
      assert.deepEqual(deviceFramePolicy({platform,modelLevel,benchmarkLevel:40,model:'iPhone 16 Pro'}),{tier,lock30Fps:lock,source:'modelLevel'});
    }
    for(const [score,lock] of [[1,true],[9,true],[10,true],[29,true],[30,false],[50,false]])
      assert.equal(deviceFramePolicy({platform,benchmarkLevel:score}).lock30Fps,lock);
    for(const score of [-2,-1,0,NaN,undefined,Infinity])
      assert.deepEqual(deviceFramePolicy({platform,benchmarkLevel:score}),{tier:'unknown',lock30Fps:true,source:'fallback'});
  }
  for(const platform of ['devtools','windows','mac',''])assert.equal(deviceFramePolicy({platform}).lock30Fps,false);
  // Runtime high-performance mode is a container flag, not a hardware tier.
  assert.equal(deviceFramePolicy({platform:'ios',highPerformance:true}).lock30Fps,true);
});

test('old iOS clients recognize phone names and hardware identifiers',()=>{
  for(const model of ['iPhone SE','iPhone 11','iPhone 13 Pro','iPhone 14','iPhone 14 Plus','iPhone14,7','iPhone14,8'])
    assert.equal(deviceFramePolicy({platform:'ios',model}).lock30Fps,true,model);
  for(const model of ['iPhone 14 Pro','iPhone 14 Pro Max','iPhone 15','iPhone 16 Pro','iPhone 17','iPhone15,2','iPhone15,3','iPhone15,4','iPhone16,1'])
    assert.equal(deviceFramePolicy({platform:'ios',model}).lock30Fps,false,model);
  assert.equal(deviceFramePolicy({platform:'ios',model:'iPhone unknown'}).lock30Fps,true);
});

test('first defaults, migration, manual choices, persistence and reset stay distinct',()=>{
  const mid={platform:'android',modelLevel:2},high={platform:'ios',modelLevel:1};
  const settings={quality:'high',lock30Fps:false};
  assert.equal(applyFrameRatePolicy(settings,mid),true);assert.equal(settings.lock30Fps,true);assert.equal(settings.frameRateMode,'auto');
  assert.equal(applyFrameRatePolicy(settings,mid),false);
  applyFrameRatePolicy(settings,high);assert.equal(settings.lock30Fps,false);
  setFrameRateLock(settings,true);applyFrameRatePolicy(settings,high);assert.equal(settings.lock30Fps,true);
  setFrameRateLock(settings,false);
  const saved=JSON.parse(JSON.stringify(settings));applyFrameRatePolicy(saved,mid);
  assert.equal(saved.lock30Fps,false);assert.equal(saved.frameRateMode,'manual');assert.equal(saved.quality,'high');
  resetFrameRatePolicy(saved,mid);assert.equal(saved.lock30Fps,true);assert.equal(saved.frameRateMode,'auto');
  resetFrameRatePolicy(saved,high);assert.equal(saved.lock30Fps,false);
  for(const lock30Fps of [true,'true',1]){
    const legacy={lock30Fps};applyFrameRatePolicy(legacy,high);assert.equal(legacy.frameRateMode,'manual');assert.equal(legacy.lock30Fps,lock30Fps);
  }
});

test('benchmark query handles successful, absent, failed, throwing, malformed and late hosts',async()=>{
  const device=readRuntimeInfo({getDeviceInfo:()=>({platform:'iOS',model:'iPhone 16',benchmarkLevel:35})});
  assert.equal(device.benchmarkLevel,35);
  await readDevicePerformance({getDeviceBenchmarkInfo({success}){success({benchmarkLevel:31,modelLevel:2});}},device);
  assert.equal(device.modelLevel,2);assert.equal(device.benchmarkLevel,31);
  for(const api of [{},{getDeviceBenchmarkInfo(){throw Error();}},{getDeviceBenchmarkInfo({fail}){fail({});}},{getDeviceBenchmarkInfo({success}){success({benchmarkLevel:-1,modelLevel:99});}}]){
    const fallback={platform:'android',benchmarkLevel:32,modelLevel:0};
    assert.equal(await readDevicePerformance(api,fallback),fallback);
    assert.equal(fallback.benchmarkLevel,32);assert.equal(fallback.modelLevel,0);
  }
  let callback;const unknown={platform:'android',modelLevel:0};
  await readDevicePerformance({getDeviceBenchmarkInfo({success}){callback=success;}},unknown,5);
  callback({modelLevel:1});assert.equal(unknown.modelLevel,0);
});

test('critical decorations have spatial and time budgets that recover after stalls and reset',()=>{
  for(const limit of [4,6,8]){
    const budget=new CriticalImpactBudget(limit);let allowed=0;
    for(let i=0;i<200;i++)allowed+=+budget.allow(0,i*4,0);
    assert.equal(allowed,limit);assert.equal(budget.allow(.1,1000,0),false);
    assert.equal(budget.allow(.13,0,0),true);assert.equal(budget.allow(.13,1,1),false);
    assert.equal(budget.allow(20,0,0),true);budget.clear();assert.equal(budget.allow(20,0,0),true);
  }
});
