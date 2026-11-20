import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyDeveloperBundle} from './preview-support.mjs';

test('developer preview refuses release, mismatched and incomplete gameplay packages',()=>{
  const main='if(api.developerBuild==="dev8-fixture")resolve(api);';
  const play='box.api={developerBuild:"dev8-fixture"};__zixingDeveloper;"zx-dev-button";"zx-dev-panel";"开发测试版 DEV 8";"pokebonk-dev-save.json";';
  assert.equal(verifyDeveloperBundle(main,play),'dev8-fixture');
  assert.throws(()=>verifyDeveloperBundle('resolve(api);',play),/标识不匹配/);
  assert.throws(()=>verifyDeveloperBundle(main,play.replace('dev8-fixture','dev8-stale')),/标识不匹配/);
  assert.throws(()=>verifyDeveloperBundle(main,play.replace('zx-dev-button','missing')),/缺少测试模块/);
  assert.throws(()=>verifyDeveloperBundle(main,play.replace('pokebonk-dev-save.json','pokebonk-save.json')),/缺少测试模块/);
});
