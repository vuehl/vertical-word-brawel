import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyDeveloperBundle} from './preview-support.mjs';

test('developer preview refuses release, mismatched and incomplete gameplay packages',()=>{
  const main='if(api.developerBuild==="dev7-fixture")resolve(api);';
  const play='box.api={developerBuild:"dev7-fixture"};__zixingDeveloper;"zx-dev-button";"zx-dev-panel";"开发测试版 DEV 7";"pokebonk-dev-save.json";';
  assert.equal(verifyDeveloperBundle(main,play),'dev7-fixture');
  assert.throws(()=>verifyDeveloperBundle('resolve(api);',play),/标识不匹配/);
  assert.throws(()=>verifyDeveloperBundle(main,play.replace('dev7-fixture','dev7-stale')),/标识不匹配/);
  assert.throws(()=>verifyDeveloperBundle(main,play.replace('zx-dev-button','missing')),/缺少测试模块/);
  assert.throws(()=>verifyDeveloperBundle(main,play.replace('pokebonk-dev-save.json','pokebonk-save.json')),/缺少测试模块/);
});
