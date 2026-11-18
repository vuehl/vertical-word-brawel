import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom/worker';
import {rangeBounds,rangeValueAt,repairVolumeSettings} from '../platform/range.mjs';
const input=html=>parseHTML(html).document.querySelector('input');

test('volume touch uses HTML limits and decimal steps',()=>{
  const el=input('<input type="range" min="0" max="1" step="0.05" value="0.8">');
  assert.deepEqual(rangeBounds(el),{min:0,max:1,step:0.05});
  assert.equal(rangeValueAt(el,.81),.8);
  assert.equal(rangeValueAt(el,.65),.65);
  assert.equal(rangeValueAt(el,-1),0);
  assert.equal(rangeValueAt(el,2),1);
});
test('camera ranges and continuous ranges retain their own limits',()=>{
  const fov=input('<input type="range" min="60" max="100" step="1">');
  assert.equal(rangeValueAt(fov,.25),70);
  const scale=input('<input type="range" min="0.6" max="1.3" step="0.05">');
  assert.equal(rangeValueAt(scale,.5),.95);
  const continuous=input('<input type="range" min="-1" max="1" step="any">');
  assert.equal(rangeValueAt(continuous,.625),.25);
});
test('legacy percentage volumes are repaired without touching other preferences',()=>{
  const settings={master:81,music:65,sfx:.7,cries:.6,fov:70,quality:'high'};
  assert.equal(repairVolumeSettings(settings),true);
  assert.deepEqual(settings,{master:.81,music:.65,sfx:.7,cries:.6,fov:70,quality:'high'});
  assert.equal(repairVolumeSettings(settings),false);
});
