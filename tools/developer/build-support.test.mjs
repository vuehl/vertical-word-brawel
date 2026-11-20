import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stampRuntime} from './build-support.mjs';

test('developer startup accepts the matching gameplay package and rejects stale/release packages',async()=>{
  const main=fs.readFileSync(new URL('../../game.js',import.meta.url),'utf8');
  const play='const box={};box.api={setup,run};';
  const stamped=stampRuntime(main,play);
  const make=api=>new Function('GameGlobal',stamped.main.replace(/\nstart\(\);\s*$/,'')+'\nreturn waitForPlayEntry();')({pokebonkPlayEntry:{api}});
  const api={setup(){},run(){},developerBuild:stamped.id};
  assert.equal(await make(api),api);
  await assert.rejects(make({...api,developerBuild:undefined}),/开发测试包版本不一致/);
  await assert.rejects(make({...api,developerBuild:'old'}),/开发测试包版本不一致/);
  assert.ok(stamped.play.includes(JSON.stringify(stamped.id)));
  assert.deepEqual(stampRuntime(main,play),stamped,'Identical builds keep a reproducible identity');
  assert.notEqual(stampRuntime(main,play+'\n// changed').id,stamped.id);
});
