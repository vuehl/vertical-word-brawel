import assert from 'node:assert/strict';

// Fire kites normally for the opening minute. Use invulnerability for the
// rest of the timing comparison and automate menus without drawing frames.
export async function reviewBattlePacing(page) {
  const zones = [['single-stage', 4, 1, 360], ['standard', 16, 1, 300], ['standard', 16, 2, 300]];
  for (const [mode, species, stage, duration] of zones) {
    const sample = await page.evaluate(async ({mode, species, stage, duration}) => {
      if (stage === 1) await app.startRun({mode, species, tier:0, biome:'forest', boosts:[]});
      else await app.run.enterPortal();
      app.halted = true;
      const r = app.run, p = r.player, drafts = [], forms = [], minutes = [];
      const clock = () => inspected.doc.querySelector('.zx-hud-clock').textContent;
      r.ui.hud(r);
      const firstClock = clock(), timeline = r.director.timeline.map(({kind,t}) => ({kind,t}));
      const renderWorld = r.renderWorld, hud = r.ui.hud;
      const kiteOpening = mode === 'single-stage';
      if (!kiteOpening) p.iframes = 100000;
      r.renderWorld = () => {};
      r.ui.experienceReady = () => true;
      r.ui.showLevelUp = (run, offers, choose) => {
        if (offers.filter(o=>!o.vit).length>1 || new Set(offers.map(o=>o.key)).size!==offers.length)
          throw Error('Invalid upgrade panel: '+JSON.stringify(offers));
        if (stage===1 && run.stageTime<90) drafts.push({time:run.stageTime, offers:offers.map(o=>o.kind)});
        choose(offers.find(o => o.kind === 'newMove') ?? offers.find(o=>o.kind==='upMove') ?? offers[0]);
      };
      r.ui.showBranch = (run, ids, choose) => choose(ids[0]);
      r.ui.hud = () => {};
      // Exercise the existing early XP catch-up for wind. Neither draft forces a move.
      const addXp = p.addXp.bind(p);
      if (species === 16 && stage === 1) p.addXp = amount => { if (r.time > 85) addXp(amount); };
      let openingCount = 0, movesAtMinute, openingHp, oldForm = p.speciesId, bossAt, bossHp;
      for (let frame = 0; frame < (duration + 90) * 25 && r.stageTime < duration + 30; frame++) {
        if (kiteOpening && !movesAtMinute) {
          r.input.stickX = Math.cos(r.stageTime * 0.3);
          r.input.stickY = Math.sin(r.stageTime * 0.3);
        }
        r.update(1/20);
        if (r.state === 'modal') {
          const button = r.ui.modalEl.querySelector('[data-offer]') ??
            [...r.ui.modalEl.querySelectorAll('button')].find(b => /确认进阶|拾取|领取/.test(b.textContent));
          if (!button) throw Error('Unexpected battle modal: ' + r.ui.modalEl.textContent);
          button.click();
        }
        if (r.stageTime <= 10) openingCount = Math.max(openingCount, r.enemies.count);
        if (!movesAtMinute && r.stageTime >= 60) {
          movesAtMinute = p.moves.filter(Boolean).map(m => m.def.id);
          openingHp = Math.round(p.hp);
          if (kiteOpening) {
            r.input.stickX = r.input.stickY = 0;
            p.iframes = 100000;
          }
        }
        if (p.speciesId !== oldForm && r.state === 'play') {
          forms.push({at:r.time, level:p.level, id:p.speciesId});
          oldForm = p.speciesId;
        }
        if (r.bossSpawned && bossAt == null) {
          bossAt = r.stageTime;
          bossHp = r.enemies.maxHp[r.boss.bossIndex];
        }
        if (r.stageTime >= (minutes.length + 1) * 60) minutes.push({level:p.level, kills:r.stats.kills,
          bossRemaining:r.boss.alive ? Math.round(r.enemies.hp[r.boss.bossIndex]) : undefined});
        if (r.state === 'play' && r.ult.charge >= 1 && !r.ult.active && !r.ult.castPending) r.ult.fire();
        if (r.stageCleared || r.state === 'over') break;
        if (frame % 240 === 0) await new Promise(resolve => setTimeout(resolve,0));
      }
      r.renderWorld = renderWorld;
      r.ui.hud = hud;
      p.addXp = addXp;
      const vortex = r.interactables.list.find(o => o.kind === 'boss');
      const portal = r.interactables.list.find(o => o.kind === 'portal');
      return {mode,stage:r.stage,firstClock,timeline,drafts,movesAtMinute,openingHp,openingCount,forms,minutes,bossAt,bossHp,
        cleared:r.stageCleared,at:r.stageTime,level:p.level,kills:r.stats.kills,vortexUsed:vortex?.used,portal:!!portal};
    }, {mode,species,stage,duration});
    const {timeline, ...summary} = sample;
    console.log('Battle pacing', JSON.stringify(summary));
    assert.equal(sample.stage, stage);
    assert.equal(sample.firstClock, duration === 360 ? '06:00' : '05:00');
    assert.ok(sample.openingCount > 0 && sample.openingCount <= 10);
    if (stage === 1) {
      assert.equal(sample.drafts[0].offers.length,3);
      assert.ok(sample.drafts[0].time <= 19);
      assert.ok(sample.openingHp > 0);
      assert.deepEqual(sample.forms.map(f => f.id), species === 4 ? [5,6] : [17,18]);
      assert.deepEqual(sample.forms.map(f => f.level), [8,16]);
    }
    assert.ok(timeline.every(event => event.t < duration));
    const guardianAt = stage === 2 ? 243 : duration - 50;
    assert.ok(Math.abs(sample.bossAt - guardianAt) < .1);
    assert.ok(sample.cleared && sample.portal && sample.vortexUsed);
    assert.ok(sample.at <= duration + 30);
  }
  assert.deepEqual(await page.evaluate(async () => {
    const r = app.run;
    await r.enterPortal();
    r.update(0);
    return [r.stage, r.boss.alive];
  }), [4, true]);
}
