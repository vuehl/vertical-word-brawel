import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {verifyDeveloperBundle,verifyDeveloperPreview} from './preview-support.mjs';
import {buildHashes} from '../preview-files.mjs';

test('developer preview refuses release, mismatched and incomplete gameplay packages',()=>{
  const main='if(api.developerBuild==="dev8-fixture")resolve(api);';
  const play='box.api={developerBuild:"dev8-fixture"};__zixingDeveloper;"zx-dev-button";"zx-dev-panel";"开发测试版 DEV 8";"pokebonk-dev-save.json";';
  assert.equal(verifyDeveloperBundle(main,play),'dev8-fixture');
  assert.throws(()=>verifyDeveloperBundle('resolve(api);',play),/标识不匹配/);
  assert.throws(()=>verifyDeveloperBundle(main,play.replace('dev8-fixture','dev8-stale')),/标识不匹配/);
  assert.throws(()=>verifyDeveloperBundle(main,play.replace('zx-dev-button','missing')),/缺少测试模块/);
  assert.throws(()=>verifyDeveloperBundle(main,play.replace('pokebonk-dev-save.json','pokebonk-save.json')),/缺少测试模块/);
});

test('preview validates split builds without removed legacy files and tracks every chunk',t=>{
  const project=fs.mkdtempSync(path.join(os.tmpdir(),'ziling-preview-'));
  t.after(()=>fs.rmSync(project,{recursive:true,force:true}));
  const write=(name,content)=>{
    const file=path.join(project,'minigame',name);
    fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(file,content);
  };
  write('game.js','if(api.developerBuild==="dev8-fixture")resolve(api);');
  write('play/game.js','box.api={developerBuild:"dev8-fixture"};');
  write('play/gameplay.js','__zixingDeveloper;"zx-dev-button";"zx-dev-panel";"开发测试版 DEV 8";');
  write('play/host.js','"pokebonk-dev-save.json";');
  write('packs/text/assets.br','fixture');
  assert.equal(verifyDeveloperPreview(project),'dev8-fixture');
  const before=buildHashes(project);
  assert.ok(before['play/gameplay.js']);
  assert.ok(before['packs/text/assets.br']);
  assert.deepEqual(buildHashes(project),before);
  write('play/gameplay.js','changed');
  assert.notDeepEqual(buildHashes(project),before);
  assert.throws(()=>verifyDeveloperPreview(project),/缺少测试模块/);
  write('play/extra.js','extra');
  const added=buildHashes(project);
  assert.ok(added['play/extra.js']);
  fs.unlinkSync(path.join(project,'minigame/play/extra.js'));
  assert.notDeepEqual(buildHashes(project),added);
  write('play/game.js','box.api={developerBuild:"dev8-stale"};');
  assert.throws(()=>verifyDeveloperPreview(project),/标识不匹配/);
});
