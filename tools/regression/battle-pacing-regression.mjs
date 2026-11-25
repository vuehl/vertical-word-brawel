import assert from 'node:assert/strict';

// Fire kites normally for the opening minute. Use invulnerability for the
// rest of the timing comparison and automate menus without drawing frames.
export async function reviewBattlePacing(page) {
  const zones = [['single-stage', 4, 1, 360], ['standard', 16, 1, 360], ['standard', 16, 2, 360]];
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
        if ((p.freeMoveSlot()<0 && offers.some(o=>o.kind==='newMove')) || new Set(offers.map(o=>o.key)).size!==offers.length)
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
      let requiredLevel = r.nextEvo?.level;
      const vortex = r.interactables.list.find(o => o.kind === 'boss');
      let holdingAtDeadline = false;
      for (let frame = 0; frame < (duration + 180) * 25 && r.stageTime < duration + 120; frame++) {
        if (kiteOpening && !movesAtMinute) {
          r.input.stickX = Math.cos(r.stageTime * 0.3);
          r.input.stickY = Math.sin(r.stageTime * 0.3);
        }
        if (stage === 2 && !r.bossSpawned && r.stageTime >= duration - 1) {
          p.pos.set(vortex.x, vortex.y, vortex.z);
          holdingAtDeadline = r.interactables.nearest === vortex && r.interactables.dwellProgress > 0;
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
          forms.push({at:r.time, level:p.level, requiredLevel, id:p.speciesId});
          oldForm = p.speciesId;
          requiredLevel = r.nextEvo?.level;
        }
        if (r.bossSpawned && bossAt == null) {
          bossAt = r.stageTime;
          await r.dragonHdAssets?.loading;
          if (!r.dragonDuel || !r.ui.dragonChant || r.boss.name !== '龘' || r.director.finalSwarm)
            throw Error('Expected the summoned dragon cinematic at the zone deadline');
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
      const portal = r.interactables.list.find(o => o.kind === 'portal');
      return {mode,stage:r.stage,firstClock,timeline,drafts,movesAtMinute,openingHp,openingCount,forms,minutes,bossAt,bossHp,
        holdingAtDeadline,cleared:r.stageCleared,at:r.stageTime,level:p.level,kills:r.stats.kills,vortexUsed:vortex?.used,portal:!!portal};
    }, {mode,species,stage,duration});
    const {timeline, ...summary} = sample;
    console.log('Battle pacing', JSON.stringify(summary));
    assert.equal(sample.stage, stage);
    assert.equal(sample.firstClock, '06:00');
    assert.ok(sample.openingCount > 0 && sample.openingCount <= 10);
    if (stage === 1) {
      assert.equal(sample.drafts[0].offers.length,3);
      assert.ok(sample.drafts[0].time <= 19);
      assert.ok(sample.openingHp > 0);
      const levels=mode==='single-stage'?[12,30]:[18,40];
      const attained=levels.filter(level=>sample.level>=level);
      assert.deepEqual(sample.forms.map(f => f.id), (species === 4 ? [5,6] : [17,18]).slice(0,attained.length));
      assert.deepEqual(sample.forms.map(f => f.requiredLevel), attained);
      assert.ok(sample.forms.every(f => f.level >= f.requiredLevel));
    }
    assert.ok(timeline.filter(event => event.kind !== 'guardian').every(event => event.t < duration));
    assert.deepEqual(timeline.filter(event => event.kind === 'guardian'), [{kind:'guardian',t:duration}]);
    assert.ok(sample.bossAt >= duration && sample.bossAt < duration + .1);
    if (stage === 2) assert.ok(sample.holdingAtDeadline);
    assert.ok(sample.cleared && sample.portal && sample.vortexUsed);
    assert.ok(sample.at <= duration + 120);
  }
  assert.deepEqual(await page.evaluate(async () => {
    const r = app.run;
    await r.enterPortal();
    r.update(0);
    return [r.stage, r.boss.alive];
  }), [4, true]);

  const balance = await page.evaluate(async () => {
    await app.startRun({mode:'standard',species:4,tier:0,biome:'forest',boosts:[]});
    const r = app.run, p = r.player;
    const id = r.enemies.spawn(19, p.pos.x + 3, p.pos.z, 1, 1);
    if (id < 0) throw Error('Missing enemy for balance check');
    p.stats.armor = p.stats.evasion = 0;
    p.maxHp = 100;
    function damage(raw, source, cap = 0, floor = 0) {
      p.hp = p.maxHp;
      p.iframes = p.shield = p.overheal = 0;
      p.hurt(raw, null, -1, NaN, NaN, false, cap, source, {floor});
      return p.maxHp - p.hp;
    }
    const contact = damage(20, id);
    const projectile = damage(20, {kind:'common',species:19});
    const capped = damage(100, id, .3);
    const floored = damage(1, id, 0, .2);
    const terrain = damage(20, -1);
    const dragon = r.enemies.spawn(149, p.pos.x+8, p.pos.z, 1, 1, 4);
    const dragonShot = {kind:'boss', species:149};
    for (const mode of ['single-stage','standard']) {
      r.mode = mode;
      if (damage(20, dragon) !== 5 || damage(100, dragonShot, .3) !== 7.5 ||
          damage(1, dragon, 0, .2) !== 5) throw Error('Incorrect opening guardian damage in '+mode);
    }
    r.stage = 2;
    const secondZone = {
      contact:damage(20,id), projectile:damage(20,{kind:'common',species:19}),
      capped:damage(100,id,.3), floored:damage(1,id,0,.2),
      guardian:damage(20,dragon), guardianShot:damage(100,dragonShot,.3),
      terrain:damage(20,-1), event:damage(20,{kind:'event',species:19}),
    };
    r.stage = 4;
    const finalZone = {contact:damage(20,id),guardian:damage(20,dragon),guardianShot:damage(100,dragonShot,.3)};
    r.stage = 1;
    const xpPerKill = () => {
      let xp = 0;
      for (let i = 0; i < r.pickups.n; i++)
        if (r.pickups.alive[i] && r.pickups.kind[i] === 0) xp += r.pickups.value[i];
      return xp;
    };
    r.enemies.xp[id] = 8;
    r.pickups.clear();
    r.combat.hit(id, 30000, {type:'normal',cls:'physical',fixed:true,noReact:true});
    const localXp = xpPerKill();
    r.pickups.clear();
    r.combat.creditRemote(-1, 19, 0, p.pos.x, p.pos.y, p.pos.z, 8);
    return {contact,projectile,capped,floored,terrain,localXp,remoteXp:xpPerKill(),secondZone,finalZone};
  });
  assert.deepEqual(balance, {contact:10,projectile:10,capped:15,floored:10,terrain:20,localXp:10,remoteXp:10,
    secondZone:{contact:15,projectile:15,capped:22.5,floored:15,guardian:15,guardianShot:22.5,terrain:20,event:20},
    finalZone:{contact:10,guardian:10,guardianShot:15}});
  console.log('Battle damage balance passed:',JSON.stringify(balance));
}
