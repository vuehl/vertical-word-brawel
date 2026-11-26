import assert from 'node:assert/strict';

export async function reviewDifficulty(page) {
  let normal;
  for (const tier of [0, 1, 2]) {
    const zones = await page.evaluate(async tier => {
      app.meta.profile.biomes.forest = 2;
      if (!await app.startRun({species:4, biome:'forest', mode:'standard', tier, boosts:[]}))
        throw app.lastStartError ?? Error('Failed to start difficulty ' + tier);
      const r = app.run, p = r.player, enemies = r.enemies, zones = [];
      for (const stage of [1, 2, 4]) {
        if (stage !== 1) await r.changeZone();
        if (r.stage !== stage || r.tier !== tier)
          throw Error(`Expected tier ${tier} stage ${stage}, got tier ${r.tier} stage ${r.stage} (${r.state})`);
        r.stageTime = 60;
        const scene = {stage, seed:r.terrain.seed, bounds:r.terrain.deskBounds,
          waves:r.director.timeline.map(({t,kind,sizeScale}) => [t,kind,sizeScale]),
          pool:r.director.upcoming(8), xp:r.diff.xpMult, amount:r.diff.enemyAmount};
        const {x,y,z} = p.pos;
        const enemy = enemies.spawn(47, x, z, r.director.hpMult(), r.director.dmgMult(), 0);
        if (enemy < 0) throw Error('Missing comparison enemy');
        scene.monster = [enemies.speed[enemy], enemies.dmg[enemy]];
        const health = {monster:enemies.maxHp[enemy]};
        if (enemies.hp[enemy] !== health.monster) throw Error('Monster did not spawn at full health');
        p.stats.evasion = 0;
        function damage(hit) {
          p.iframes = p.overheal = 0;
          p.hp = p.maxHp;
          // Include shield absorption when comparing resolved hit damage.
          p.shield = p.maxHp / 2;
          const before = p.hp + p.shield;
          hit();
          return before - (p.hp + p.shield);
        }
        const contact = damage(() => enemies.proxyContact(enemy, enemies.x[enemy], enemies.y[enemy], enemies.z[enemy]));
        const projectile = damage(() => {
          r.projectiles.fire({from:enemy, x, y:y+0.8, z, dx:1, dz:0, speed:1, life:1, radius:0.5,
            dmg:enemies.dmg[enemy], type:'normal', cls:'special', flags:1});
          r.projectiles.step(0);
        });
        const hazard = damage(() => p.hurt(10, 'fire', -1, NaN, NaN, true));
        const hits = {contact, projectile};
        // Skip the cinematic so the guardian can attack immediately.
        r.introBoss = () => {};
        r.spawnBoss(x, z);
        const boss = r.boss.bossIndex;
        scene.guardian = enemies.species[boss];
        health.guardian = enemies.maxHp[boss];
        if (enemies.hp[boss] !== health.guardian) throw Error('Guardian did not spawn at full health');
        if (stage === 4) {
          hits.legendary = damage(() => r.boss.kit.hurt(1));
        } else {
          hits.floor = damage(() => r.boss.strike(boss, 0.0001));
          hits.cap = damage(() => r.boss.strike(boss, 10000));
        }
        r.boss.release();
        zones.push({scene,health,hits,hazard});
      }
      return zones;
    }, tier);
    if (tier === 0) normal = zones;
    for (const [index, {scene,health,hits,hazard}] of zones.entries()) {
      const baseline = normal[index];
      assert.deepEqual(scene, baseline.scene);
      for (const [actor, hp] of Object.entries(health)) {
        const expected = baseline.health[actor] * [1,1.5,2][tier];
        assert.ok(hp > 0 && Math.abs(hp - expected) < 1e-9 * expected,
          JSON.stringify({tier, stage:scene.stage, actor, hp, expected}));
      }
      assert.ok(hazard > 0);
      assert.equal(hazard, baseline.hazard);
      for (const [attack, damage] of Object.entries(hits)) {
        assert.ok(damage > 0 && Math.abs(damage - baseline.hits[attack] * [1,2,3][tier]) < 1e-8,
          JSON.stringify({tier, stage:scene.stage, attack, damage, normal:baseline.hits[attack]}));
      }
    }
    console.log('Difficulty', tier, zones.map(({scene,health,hits}) => ({stage:scene.stage,health,...hits})));
  }
}
