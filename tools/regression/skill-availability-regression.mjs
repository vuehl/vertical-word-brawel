import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewSkillAvailability(page, dir) {
  await page.setViewport({width:390, height:844, deviceScaleFactor:1});
  const report = {environment:'Compiled WeChat bundle in Chrome SwiftShader; not a phone FPS measurement.', forms:[]};
  report.retired = await page.evaluate(() => {
    const p=app.run.player, results=[];
    for (const species of [4,5,6,16,17,18,58,59]) {
      vfxSetup(); p.setSpecies(species);
      for (const id of [10,163,225,257,337,394,424,50024,50079,50093,50105]) {
        results.push({species,id,accepted:p.addMove(id)});
      }
      if (species < 7) results.push({species,id:403,accepted:p.addMove(403)});
    }
    return results;
  });
  assert.ok(report.retired.every(r => !r.accepted), 'Retired skills and fire Air Slash must reject old IDs');
  report.windRemovals = await page.evaluate(() => {
    const p=app.run.player, results=[];
    for (const species of [4,5,6,16,17,18,58,59]) {
      vfxSetup();p.setSpecies(species);
      for (const id of [52,53,50080,50099]) {
        p.moves.fill(null);
        results.push({species,id,accepted:p.addMove(id)});
      }
    }
    return results;
  });
  for (const result of report.windRemovals) {
    assert.equal(result.accepted,result.species<7&&result.id!==50099,`Scoped wind removal ${result.species}:${result.id}`);
  }
  await page.evaluate(async()=>{
    if(!await app.startRun({species:16,biome:'forest',tier:0,boosts:[],mode:'standard'})) throw Error('Cannot start wind');
  });
  for (const species of [16,17,18,58,59]) {
    const state=await page.evaluate(species=>{
      vfxSetup();
      const p=app.run.player;
      p.setSpecies(species);
      const accepted=[];
      for (const id of [33,49001,17,332,98,239,50006,50106,16,97,297,403,542,50088]) {
        p.moves.fill(null);
        if (p.addMove(id)) accepted.push(p.moves[0].def.name);
      }
      p.buffs.clear();
      p.recompute();
      const {attackSpeed,moveSpeed}=p.stats;
      app.run.ult.charge=1;
      app.run.ult.fire();
      vfxAdvance(3,1/60);
      return {species,accepted,ability:p.ability,ultimate:app.run.ult.name,
        attack:p.stats.attackSpeed/attackSpeed,move:p.stats.moveSpeed/moveSpeed};
    },species);
    assert.equal(state.ability,'');
    assert.equal(state.ultimate,({16:'阵风',17:'刮倒一片',18:'刮倒一片',58:'跑得没影',59:'跑得没影'})[species]);
    assert.ok(Math.abs(state.attack-([17,18].includes(species)?10:1))<1e-6);
    assert.ok(Math.abs(state.move-([58,59].includes(species)?10:1))<1e-6);
    assert.deepEqual(state.accepted,['撞击','起风','翅膀攻击','羽毛舞','电光一闪','龙卷风','残气乱刮','卷着打转']);
    report.forms.push(state);
  }
  fs.writeFileSync(path.join(dir,'skill-availability.json'),JSON.stringify(report,null,2));
  console.log('Verified wind move availability in all five forms.');
}
