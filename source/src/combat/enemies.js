import {VFX_SCALE} from '../effects/visual-scale.js';
import {FOREST_COMBAT_ZONES, zoneDuration, wavePace, isSoloNormalOpening, normalOpeningWaves, enemyDifficulty} from "../data/lite-rules.js";
import {enemySpeciesWord} from "../data/character-rules.js";
import {runOrdinaryLimit, countOrdinary, naturalCreditRate, SPAWN_RATE_SCALE} from "../performance/spawn-budget.js";
import {chineseText as c} from "../data/chinese-text.js";
import {
  An as p,
  Bn as _,
  Gn as ce,
  In as he,
  Ln as we,
  Rr as Je,
  Wn as ft,
  _r as Tt,
  kn as un,
  wn as $n,
  Ot as Re,
  bn as jt,
  ln as mn,
  vn as Yn
} from "../data/config.js";
import {gameData as k, typeColors as Ni} from "../data/game-database.js";
import {clamp as Gs} from "../effects/scene-renderer.js";
import {Random as Ol, I, random as F} from "../effects/battle-particles.js";
import {R} from "./enemy-population.js";
import {createBossEncounters} from "./boss-encounters.js";
import {bu} from "../world/terrain.js";
import {em, am, Om} from "./field-effects.js";
import {E as yr, K as Tr, ct as Kr, w as Ei} from "../vendor/three-DmSYIDKK.js";
import {glyphWordForSpecies} from "../actors/paper-glyph-art.js";
import {Lo} from "../ui/controls.js";
import {Qc} from "../actors/sprite-assets.js";

var kv = 12,
  Av = class e {
    run;
    cards = [];
    pool = [];
    credits = 0;
    timeline = [];
    finalSwarm = !1;
    finalSwarmAt = 0;
    rng;
    swarmUntil = 0;
    spawnedTotal = 0;
    // Bound catch-up work after a stall or mass kill, as well as average rate.
    static MAX_SPAWNS_PER_SEC = 24;
    static RIM_MIN = 14;
    spawnAllowance = 0;
    vCap = 0;
    liveCap = 0;
    weight = 1;
    get hordeWeight() {
      return Math.max(2, this.weight);
    }
    beats = [];
    hordes = [];
    constructor(e) {
      ((this.run = e), (this.rng = new Ol(e.seed ^ 859847)), this.buildPool());
      this.pace = wavePace(e.mode);
      this.normalOpening = isSoloNormalOpening(e);
      let t = this.rng;
      for (let e = 0; e < 3; e++) this.addCard();
      this.credits = this.pace > 1 ? 7 : 0;
      if (e.endless) {
        this.beats = [
          { kind: `card`, next: 60, every: [48, 72] },
          { kind: `alpha`, next: 150, every: [150, 150] },
          { kind: `horde`, next: 235, every: [140, 160] },
          { kind: `totem`, next: 290, every: [200, 220] },
          { kind: `elitewave`, next: 330, every: [180, 180] },
          { kind: `summoner`, next: 380, every: [340, 380] },
          { kind: `event`, next: t.range(170, 230), every: [220, 260] },
        ];
        return;
      }
      let n = [];
      for (let e = 1; e < 9.6; e += t.range(0.8, 1.2)) n.push({ t: e * 60, kind: `card` });
      if (this.normalOpening) {
        for (const card of n) card.t /= this.pace;
        n.push(...normalOpeningWaves(e.mode, t.chance(0.5) ? 'swarm' : 'stampede', e.boosts.has('honey')));
      } else {
        (n.push({ t: 150, kind: `alpha` }, { t: 330, kind: `alpha` }, { t: 480, kind: `alpha` }),
          e.boosts.has(`honey`) && n.push({ t: 240, kind: `alpha` }));
        let r = e.stage === 1;
        (n.push(
          { t: r ? 235 : 200, kind: t.chance(0.5) ? `swarm` : `stampede` },
          { t: 390, kind: `swarm` },
          { t: 520, kind: `stampede` },
        ),
          n.push({ t: r ? 330 : 270, kind: `elitewave` }, { t: 450, kind: `elitewave` }),
          n.push({ t: r ? 290 : 255, kind: `totem` }, { t: 420, kind: `totem` }, { t: 360, kind: `summoner` }),
          e.stage === 1
            ? n.push({ t: t.range(170, 300), kind: `event` })
            : n.push({ t: t.range(130, 230), kind: `event` }, { t: t.range(340, 460), kind: `event` }));
        for (const event of n) event.t /= this.pace;
      }
      if (this.pace > 1 && e.stage <= FOREST_COMBAT_ZONES) {
        n.push({ t: zoneDuration(e.mode), kind: 'guardian' });
      }
      this.timeline = n.sort((a, b) => a.t - b.t);
    }
    buildPool() {
      let e = this.run.biome,
        t = this.run.stage,
        n = k.pokemon.filter((e) => !e.legendary && !e.mythical && k.hasSprite(e.id)),
        r = (e, t) => e.types.some((e) => t.includes(e)),
        i = t === 1 ? 0 : t === 2 ? 1 : 2,
        a = +(t === 3),
        o = n.filter((t) => r(t, e.types) && t.evoStage <= i && t.evoStage >= a),
        s = o.filter((e) => k.hasAnimated(e.id));
      (s.length >= 24 && (o = s),
        t === 3 &&
          (o = o.concat(
            n.filter(
              (t) =>
                r(t, e.types) &&
                t.evoStage === 0 &&
                !k.evolutionsOf(t.id).length &&
                t.bst >= 420 &&
                k.hasAnimated(t.id),
            ),
          )),
        (this.pool = this.rng.shuffle(o.slice())));
      let c = n.filter((t) => r(t, e.late) && t.evoStage <= i && t.evoStage >= a && k.hasAnimated(t.id));
      this.latePool = this.rng.shuffle(c);
      let l = new Set(e.residents ?? []),
        u = n.filter((e) => l.has(e.family) && e.evoStage <= i && e.evoStage >= a && k.hasAnimated(e.id));
      this.residentPool = this.rng.shuffle(u);
    }
    upcoming(e) {
      return [...new Set([...this.pool.slice(0, e), ...this.residentPool.slice(0, 2)].map((e) => e.id))];
    }
    everyone() {
      return [...new Set([...this.pool, ...this.residentPool, ...this.latePool].map((e) => e.id))];
    }
    latePool = [];
    residentPool = [];
    cardsDrawn = 0;
    onPhase() {
      (this.buildPool(), this.addCard(), this.addCard());
    }
    addCard() {
      let e = this.cardsDrawn++ % 3 == 1 && this.residentPool.length,
        t = !e && this.run.stageTime * this.pace > 240 && this.latePool.length && this.rng.chance(0.4),
        n = e ? this.residentPool : t ? this.latePool : this.pool,
        r = new Set(this.cards.map((e) => e.id)),
        i = n.find((e) => !r.has(e.id)) ?? this.pool[0];
      if (!i) return;
      if (this.run.endless && this.cards.length >= kv) {
        let e = 0;
        for (let t = 1; t < this.cards.length; t++) this.cards[t].weight < this.cards[e].weight && (e = t);
        this.cards.splice(e, 1);
      }
      let a = 1 + i.bst / 220;
      this.cards.push({ id: i.id, cost: a, weight: 1 });
      for (let e of this.cards) e.weight *= 0.85;
      ((this.cards[this.cards.length - 1].weight = 1.4), this.run.sprites.get(i.id));
    }
    effTime() {
      if (this.run.endless) return we(this.run.time);
      if (this.run.tower) return this.run.tower.vmin * 60;
      let e = this.run.stageTime * this.pace;
      return e + (p[this.run.stage - 1] ?? 0) * Math.min(1, e / 20);
    }
    static hpCurve(e, t) {
      let n = [1, 5.5, 13, 20][e - 1] ?? 20,
        r = [0.15, 0.07, 0.05, 0.05][e - 1] ?? 0.05,
        i = Math.max(0, t - (e === 1 ? 1.5 : 0));
      return (1 + t * 0.3 + i * i * r) * n;
    }
    static BOSS_ZONE_HP = [0.8, 0.55, 0.5, 0.5];
    hpMult(t = 0, minutes) {
      let n = this.run.endless;
      if (n) return _(Math.max(t, this.run.time / 60)) * n.curse.hp * this.run.player.stats.difficulty;
      let r = this.run.tower;
      return r?.beyond
        ? _(Math.max(t, r.vmin)) * r.curse.hp * this.run.player.stats.difficulty
        : e.hpCurve(this.run.stage, Math.max(t, minutes ?? this.effTime() / 60)) *
            this.run.diff.enemyHp *
            this.run.player.stats.difficulty *
            this.swarmMult(4);
    }
    swarmMult(e) {
      return this.finalSwarm ? e ** ((this.run.stageTime - this.finalSwarmAt) / 60) : 1;
    }
    toughness() {
      return 1.35 + 1.05 * Math.max(0, 1 - this.effTime() / 480);
    }
    speedMult() {
      let e = this.run.endless;
      if (e) return ce(this.run.time / 60) * e.curse.speed;
      let t = this.run.tower;
      if (t)
        return (
          (t.beyond ? ce(t.vmin) : Math.min(1.3, 1 + 0.02 * t.vmin + 0.06 * (this.run.stage - 1))) *
          t.curse.speed
        );
      let n = this.effTime() / 60;
      return Math.min(1.3, 1 + 0.02 * n + 0.06 * (this.run.stage - 1));
    }
    danger() {
      let e = this.run.diff;
      return (
        0.5 *
        Math.log2(
          Math.max(
            1,
            this.hpMult() * this.dmgMult() * e.enemyDamage * e.enemyAmount * e.enemySpeed * e.enemySpeed,
          ),
        )
      );
    }
    dmgMult(e = 0) {
      let t = this.run.endless;
      if (t) return he(Math.max(e, this.run.time / 60)) * t.curse.dmg;
      if (this.run.tower?.beyond) return he(Math.max(e, this.run.tower.vmin));
      let n = Math.max(e, this.effTime() / 60),
        r = this.run.stage,
        i = un[r - 1] ?? un[3];
      return (1 + n * 0.13) * i * this.swarmMult(2);
    }
    spawnPoint(t = 24, n = 36) {
      let r = this.run.player.pos,
        i = this.run.terrain.play - 6;
      for (let a = 0; a < 16; a++) {
        let a = this.rng.range(0, Math.PI * 2),
          o = this.rng.range(t, n),
          s = r.x + Math.cos(a) * o,
          c = r.z + Math.sin(a) * o;
        if (
          !(
            !this.run.terrain.inBounds(s, c, 6) &&
            ((s = Gs(s, -i + 0.5, i - 0.5)),
            (c = Gs(c, -i + 0.5, i - 0.5)),
            Math.hypot(s - r.x, c - r.z) < e.RIM_MIN)
          ) &&
          (!this.run.terrain.inWater(s, c) || this.run.terrain.hasWater)
        )
          return { x: s, z: c };
      }
      return null;
    }
    caps(e) {
      let t = this.run;
      ((this.vCap = Math.min(t.maxEnemies, e, runOrdinaryLimit(t))),
        (this.liveCap = Math.max(1, Math.min(t.enemyCap, this.vCap))),
        (this.weight = 1));
    }
    full() {
      let e = this.run.enemies;
      return e.count>=this.liveCap && countOrdinary(e)>=this.liveCap;
    }
    spend() {
      let e = this.weight;
      for (; this.credits > 0 && this.spawnAllowance >= e && !this.full() && this.cards.length; ) {
        let t = this.rng.weighted(this.cards, (e) => e.weight);
        if (this.credits < t.cost * e) break;
        ((this.credits -= t.cost * e), (this.spawnAllowance -= e), this.spawnCard(t, 0, e));
      }
    }
    spawnCard(e, t = 0, n = 1) {
      let r = this.pace > 1 && this.run.stageTime < 45 ? this.spawnPoint(14, 22) : this.spawnPoint();
      if (!r) return;
      let waveTime = this.run.stageTime * this.pace;
      let i = this.run.stage === 1 && waveTime < 90,
        a = this.run.endless,
        o = a
          ? Math.min(0.25, 0.012 + (this.run.time / 60) * 0.004) * a.curse.elite
          : 0.012 + (waveTime / 60) * 0.004 + (this.run.stage - 1) * 0.03,
        s =
          !i &&
          this.rng.chance(
            (o + (this.run.player.stats.difficulty - 1) * 0.05) *
              this.run.player.stats.eliteSpawn,
          )
            ? R.Elite
            : 0;
      (this.run.enemies.spawn(e.id, r.x, r.z, this.hpMult(), this.dmgMult(), t | s, n), this.spawnedTotal++);
    }
    update(t) {
      let n = this.run;
      if (n.dragonDuel) return;
      if (n.endless) {
        this.updateEndless(t);
        return;
      }
      let r = n.stageTime;
      for (const event of this.timeline) {
        if (!event.done && r >= event.t) event.done = this.fire(event.kind, event.sizeScale) !== false;
        if (n.dragonDuel) return;
      }
      let i = this.effTime();
      this.caps(
        Math.round((14 + i * 0.65 + (i / 60) ** 2 * 4.5) * (1 + (n.stage - 1) * 0.6)),
      );
      let a = n.player.stats,
        o =
          naturalCreditRate(Tt(i), r, n.stage, n.mode, this.normalOpening) *
          (1 + (n.stage - 1) * 0.35) *
          a.difficulty *
          a.enemyAmount *
          n.diff.enemyAmount *
          (this.finalSwarm ? 6 : 1);
      this.credits = Math.min(this.credits + o * t, o * 2 + 10 * this.weight);
      let s = e.MAX_SPAWNS_PER_SEC;
      if (((this.spawnAllowance = Math.min(s * 0.1, this.spawnAllowance + s * t)), this.full()))
        this.credits = Math.min(this.credits, 10 * this.weight);
      else if ((this.spend(), this.finalSwarm && Math.random() < t * 2))
        for (let e = 0; e < 3 && !this.full(); e++) this.spawnCard(this.rng.pick(this.cards), R.Elite);
    }
    updateEndless(t) {
      let n = this.run,
        r = n.endless,
        i = n.time;
      for (let e of this.beats)
        i < e.next ||
          ((e.next = i + (e.kind === `alpha` ? r.curse.alphaEvery : this.rng.range(e.every[0], e.every[1]))),
          this.fire(e.kind));
      let a = this.effTime(),
        o = i / 60;
      this.caps(Math.round((10 + a * 0.65 + (a / 60) ** 2 * 4.5) * (1 + 0.012 * o)));
      let s = n.player.stats,
        c = naturalCreditRate(ft(i), i, n.stage, n.mode) * s.difficulty * s.enemyAmount * r.curse.amount * (r.night ? 2 : 1);
      this.credits = Math.min(this.credits + c * t, c * 2 + 10 * this.weight);
      let l = e.MAX_SPAWNS_PER_SEC;
      if (
        ((this.spawnAllowance = Math.min(l * 0.1, this.spawnAllowance + l * t)),
        r.night && this.cards.length && Math.random() < t * 2)
      )
        for (let e = 0; e < 3 && !this.full(); e++)
          this.spawnCard(this.rng.pick(this.cards), R.Elite, this.weight);
      this.full() ? (this.credits = Math.min(this.credits, 10 * this.weight)) : this.spend();
    }
    fire(e, sizeScale = 1) {
      let t = this.run;
      if (t.dragonDuel) return;
      if (e === 'guardian') {
        if (t.bossSpawned || t.stageCleared) return;
        if (t.stageTime < zoneDuration(t.mode) || t.state !== 'play' ||
            t.boss.alive || t.mewtwo.active || (t.coop && (!t.coop.isHost || t.coop.pendingBoss))) return false;
        const vortex = t.interactables.list.find(facility => facility.kind === 'boss');
        t.interactables.summonGuardian(vortex, t.player.pos, 'auto');
        return;
      }
      if (e === `card` || this.cards.length)
        switch (e) {
          case `card`:
            this.addCard();
            break;
          case `horde`:
            (this.hordes.length || (this.hordes = this.rng.shuffle([`swarm`, `stampede`, `river`, `rain`])),
              this.fire(this.hordes.shift()));
            break;
          case `river`:
            this.river();
            break;
          case `rain`:
            this.rockRain();
            break;
          case `alpha`: {
            let e = this.rng.pick(this.cards),
              n = this.spawnPoint(20, 28);
            if (!n) return;
            let r = e.id,
              i = k.evolutionsOf(r);
            if(i.length && t.stage >= 1)r = this.rng.pick(i).id;
            if(!k.hasSprite(r))r = e.id;
            const index=t.enemies.spawn(r, n.x, n.z, this.hpMult(), this.dmgMult(), R.Alpha);
            if(index<0)return;
            const word=t.enemies.glyphWords[index];
            (
              t.ui.banner(
                c(`¡Pokémon Alfa!`),
                c(`Un {name} gigante y furioso ha aparecido`, { name: word }),
                `#ff5a4a`,
                { species: r, glyph: word },
              ),
              t.audio.alarm(),
              t.cry(r),
              t.hints.show(`alpha`));
            break;
          }
          case `swarm`: {
            let e = this.rng.pick(this.cards),
              n = t.player.pos,
              r = Math.round(
                (t.stage === 1 && t.stageTime * this.pace < 300 ? 40 : 46 + t.stage * 12) * SPAWN_RATE_SCALE * sizeScale,
              );
            // Let the opening horde arrive even when natural spawns fill their budget.
            const waveSlots = sizeScale > 1 ? r : 0;
            for (let i = 0; i < r; i++) {
              let a = (i / r) * Math.PI * 2,
                o = 26 + this.rng.range(-2, 2),
                s = n.x + Math.cos(a) * o,
                c = n.z + Math.sin(a) * o;
              t.terrain.inBounds(s, c, 5) &&
                t.enemies.spawn(e.id, s, c, this.hpMult() * 0.6, this.dmgMult(), R.Swarm, 1, waveSlots);
            }
            const word = enemySpeciesWord(e.id);
            (t.ui.banner(
              c(`¡Enjambre!`),
              c(`Un enjambre de {name} te rodea...`, { name: word }),
              `#ffb03a`,
              { species: e.id, glyph: word },
            ),
              t.audio.alarm());
            break;
          }
          case `stampede`: {
            let e = Je([128, 77, 84, 111, 19, 20, 1]).filter((e) => k.hasAnimated(e)),
              n = this.rng.chance(0.5)
                ? this.rng.pick(this.cards).id
                : this.rng.pick(e.length ? e : [this.cards[0].id]);
            t.sprites.get(n);
            let r = t.player.pos,
              i = this.rng.range(0, Math.PI * 2),
              a = Math.cos(i),
              o = Math.sin(i),
              s = -o,
              l = a,
              u = Math.round(
                (t.stage === 1 && t.stageTime * this.pace < 300 ? 30 : 34 + t.stage * 8) * SPAWN_RATE_SCALE * sizeScale,
              );
            const waveSlots = sizeScale > 1 ? u : 0;
            for (let e = 0; e < u; e++) {
              let i = ((e % 17) - 8) * 2.2,
                c = Math.floor(e / 17) * 3 + this.rng.range(0, 2),
                u = r.x - a * (34 + c) + s * i,
                d = r.z - o * (34 + c) + l * i;
              if (!t.terrain.inBounds(u, d, 5)) continue;
              let f = t.enemies.spawn(n, u, d, this.hpMult() * 0.8, this.dmgMult() * 1.3, R.Stampede, 1, waveSlots);
              f >= 0 && ((t.enemies.dirX[f] = a), (t.enemies.dirZ[f] = o));
            }
            const word = enemySpeciesWord(n);
            (t.ui.banner(
              c(`¡Estampida!`),
              c(`¡Una manada de {name}! Apártate de su camino`, { name: word }),
              `#ff8a3a`,
              { species: n, glyph: word },
            ),
              t.audio.alarm(),
              t.shake(0.3));
            break;
          }
          case `totem`:
          case `summoner`: {
            let n = e === `totem` ? t.minibosses.spawnTotem() : t.minibosses.spawnSummoner();
            if (this.normalOpening) break;
            const retryAt = t.stageTime + 20 / this.pace;
            !n && t.endless
              ? this.retry(e, 20)
              : !n &&
                !t.stageCleared &&
                retryAt < 570 / this.pace &&
                this.timeline.push({ t: retryAt, kind: e });
            break;
          }
          case `event`: {
            let n = t.events.startRandom();
            if (this.normalOpening) break;
            const retryAt = t.stageTime + 15 / this.pace;
            !n && t.endless
              ? this.retry(e, 15)
              : !n &&
                !t.stageCleared &&
                retryAt < 540 / this.pace &&
                this.timeline.push({ t: retryAt, kind: e });
            break;
          }
          case `elitewave`:
            if (this.normalOpening && (t.minibosses.has('totem') || t.minibosses.has('summoner'))) break;
            for (let e = 0; e < Math.round((4 + t.stage * 2) * SPAWN_RATE_SCALE); e++)
              this.spawnCard(this.rng.pick(this.cards), R.Elite);
            t.ui.toast(c(`Una oleada de Pokémon élite se acerca`), null);
        }
    }
    retry(e, t) {
      let n = this.beats.find((t) => t.kind === e);
      n && (n.next = Math.min(n.next, this.run.time + t));
    }
    flock() {
      this.river();
    }
    river() {
      let e = this.run,
        t = e.player.pos,
        n = this.cards.filter((e) => k.get(e.id).types.includes(`flying`)).map((e) => e.id),
        r = Je(e.stage === 1 ? [21, 16, 41] : [22, 17, 42]).filter((e) => k.hasAnimated(e)),
        i =
          n.length && this.rng.chance(0.5)
            ? this.rng.pick(n)
            : this.rng.pick(r.length ? r : [this.cards[0].id]);
      e.sprites.get(i);
      let a = this.rng.range(0, Math.PI * 2),
        o = Math.cos(a),
        s = Math.sin(a),
        l = -s,
        u = o,
        d = t.x,
        f = t.z,
        p = this.hpMult() * 0.5,
        m = this.dmgMult();
      for (let t = 0; t < 10; t++)
        e.later(t * 0.5, () => {
          for (let t = 0; t < 3; t++) {
            let t = this.rng.range(-9, 9),
              n = d - o * 36 + l * t,
              r = f - s * 36 + u * t;
            if (!e.terrain.inBounds(n, r, 5)) continue;
            let a = e.enemies.spawn(i, n, r, p, m, R.Stampede);
            a >= 0 && ((e.enemies.dirX[a] = o), (e.enemies.dirZ[a] = s));
          }
        });
      const word = enemySpeciesWord(i);
      (e.ui.banner(
        c(`¡Bandada!`),
        c(`Una bandada de {name} cruza el cielo`, { name: word }),
        `#6ac8ff`,
        { species: i, glyph: word },
      ),
        e.audio.alarm());
    }
    rockRain() {
      let e = this.run,
        t = e.player.pos,
        n = Je(e.stage === 1 ? [74] : e.stage === 2 ? [74, 75] : [75, 76]).filter((e) => k.hasAnimated(e)),
        r = n.length ? this.rng.pick(n) : this.cards[0].id;
      e.sprites.get(r);
      let i = this.hpMult() * 0.8,
        a = this.dmgMult();
      for (let n = 0; n < 14; n++) {
        let o = this.rng.range(0, Math.PI * 2),
          s = n < 2 ? this.rng.range(0, 3) : this.rng.range(5, 17),
          c = t.x + Math.cos(o) * s,
          l = t.z + Math.sin(o) * s;
        if (!e.terrain.inBounds(c, l, 5)) continue;
        let u = e.terrain.height(c, l),
          d = 1.3 + n * 0.12,
          f = 2.6;
        (e.vfx.telegraph(c, u, l, f, 13148272, d),
          e.vfx.norm.spawn({
            x: c,
            y: u + 20,
            z: l,
            vy: -20 / d,
            life: d,
            size: 1.6,
            endSize: 1.8,
            color: 16777215,
            shape: I.PixRock,
          }),
          e.later(d, () => {
            (e.vfx.dust(c, u, l, 13154456, 14, 5),
              e.vfx.ring(c, u, l, f, 13148272, 0.4),
              e.shake(0.12, c, l),
              e.audio.boom(0.5));
            let t = e.player.pos;
            ((t.x - c) ** 2 + (t.z - l) ** 2 < f * f &&
              t.y - u < 2 &&
              e.player.hurt((6 + e.time / 60) * a * 0.6, `rock`, -1, c, l, !1, 0, {
                kind: `event`,
                species: r,
              }),
              n % 4 == 0 && e.enemies.spawn(r, c, l, i, a, R.Swarm));
          }));
      }
      (e.ui.banner(c(`¡Lluvia de rocas!`), c(`Sal de los círculos marcados`), `#c8a070`, { species: r, glyph: enemySpeciesWord(r) }),
        e.audio.alarm());
    }
    startFinalSwarm() {
      if (this.run.dragonDuel || (this.pace > 1 && this.run.stage <= FOREST_COMBAT_ZONES)) return;
      this.finalSwarm ||
        ((this.finalSwarm = !0),
        (this.finalSwarmAt = zoneDuration(this.run.mode)),
        this.run.ui.banner(c(`¡ENJAMBRE FINAL!`), c(`No deberías seguir aquí...`), `#ff3a5a`),
        this.run.audio.alarm());
    }
  },
  jv = { helix: 0.15, dome: 0.2, amber: 0.25 },
  Mv = 1.5,
  Nv = { helix: 138, dome: 140, amber: 142 },
  Pv = { helix: `#4a9ad8`, dome: `#b07a3a`, amber: `#ff9a2a` },
  Fv = { helix: `Helix`, dome: `Dome`, amber: `Amber` },
  Iv = (e) => Math.round(e * 100);
function Lv(e) {
  let t = e.allies.team.length >= e.allies.cap;
  return Object.keys(jv).map((e) => ({
    key: e,
    color: Pv[e],
    species: Nv[e],
    name: c(e === `helix` ? `Fósil Hélix` : e === `dome` ? `Fósil Domo` : `Ámbar Viejo`),
    tag: c(e === `helix` ? `Objeto` : e === `dome` ? `Bendición` : `Compañero`),
    boon: c(
      e === `helix`
        ? `Elige entre 2 objetos épicos o mejores`
        : e === `dome`
          ? `Elige una bendición ancestral (legendaria ×1,5)`
          : t
            ? `Aerodactyl revive y lucha contigo (tu equipo está lleno: elegirás a quién sueltas)`
            : `Aerodactyl revive y lucha contigo el resto de la partida`,
    ),
    bane: c(`−{n} % de PS máx.`, { n: Iv(jv[e]) }),
  }));
}
function Rv(e, t) {
  (e.tempMods.push({ stat: `maxHp`, mul: 1 - jv[t] }), e.player.recompute(), e.shrines.fossil.push(t));
}
function zv(e, t, n) {
  ((t.used = !0), e.interactables.dim(t));
  let r = t.group?.getObjectByName(Fv[n]),
    i = parseInt(Pv[n].slice(1), 16);
  if (r) {
    let t = r.position.y;
    e.animate(1.1, (e) => {
      ((r.position.y = t + Math.sin(Math.min(1, e * 1.3) * Math.PI * 0.5) * 0.9),
        (r.rotation.z = e * Math.PI * 2));
    });
  }
  (e.vfx.ring(t.x, t.y, t.z, 7, 16763002, 0.8),
    e.vfx.dust(t.x, t.y, t.z, 13154456, 22, 7),
    e.later(0.35, () => {
      (e.vfx.flash(t.x, t.y + 2.2, t.z, i, 6, 0.3),
        e.vfx.burst(t.x, t.y + 2.2, t.z, i, 40, 9, I.Twinkle, 0.7, 0.9));
    }),
    e.shake(0.35, t.x, t.z),
    e.audio.power(),
    e.later(0.5, () => e.cry(Nv[n])));
  for (let r of [`helix`, `dome`, `amber`])
    if (r !== n) {
      let n = t.group?.getObjectByName(Fv[r]);
      n &&
        e.later(0.6, () => {
          ((n.visible = !1), e.vfx.dust(t.x, t.y + 1, t.z, 11049610, 8, 3));
        });
    }
  n === `helix`
    ? (Rv(e, n), e.later(0.8, () => e.rollChestItem(!1, 3, 2)))
    : n === `dome`
      ? (Rv(e, n), e.later(0.8, () => e.offerBlessing(c(`Bendición ancestral del Fósil Domo`), 4, 3, 1, Mv)))
      : e.later(0.8, () =>
          e.allies.recruit(142, t.x, t.y, t.z + 2.5, (t) => {
            t && Rv(e, `amber`);
          }),
        );
}
var Bv = 0.3,
  Vv = 0.12;
function Hv(e, t) {
  if (e.bossSpawned) {
    (e.ui.toast(c(`El guardián ya ha despertado: Rhydon no responde`), null), e.audio.deny());
    return;
  }
  let n = ++e.roars;
  ((e.shrines.roars = Math.max(e.shrines.roars, n)),
    (t.data = { ...(t.data ?? {}), roars: n }),
    n >= 3 && (t.used = !0));
  let r = t.group?.getObjectByName(`Rune` + (n - 1));
  r?.material && ((r.material = r.material.clone()), (r.material.emissiveIntensity = 3.2));
  let i = t.group?.getObjectByName(`Horn`);
  (i &&
    e.animate(0.9, (e) => {
      i.rotation.z = e * Math.PI * 4 * (1 - e * 0.5);
    }),
    e.vfx.ring(t.x, t.y, t.z, 10 + n * 3, 13138490, 0.9),
    e.later(0.15, () => e.vfx.ring(t.x, t.y, t.z, 6 + n * 2, 16765088, 0.7)),
    e.vfx.dust(t.x, t.y, t.z, 11045482, 24 + n * 8, 9),
    e.vfx.burst(t.x, t.y + 3.6, t.z, 16742970, 18 + n * 6, 7, I.Rock, 0.6, 0.6, 14),
    e.shake(0.35 + n * 0.12, t.x, t.z),
    e.hitstop(0.08),
    e.cry(112),
    e.audio.boom(0.5 + n * 0.15),
    e.ui.banner(
      c(`¡Grito de Rhydon! ({n}/{max})`, { n, max: 3 }),
      c(
        `El guardián saldrá con +{hp} % de PS, +{dmg} % de daño y más escoltas élite; al vencerlo dejará {balls} Super Balls más`,
        { hp: Iv(Bv * n), dmg: Iv(Vv * n), balls: n },
      ),
      `#c8783a`,
      { species: 112 },
    ));
}
var {wy, ay, gy, Iy, sb, ub, Gy, ab} =
  createBossEncounters({k, F, Ni, I, Gs, em, am, R, bu, Bv, Av, Vv, Ol});
function fb(e, t = 1.4, n = 5, r = 70, i = {}) {
  let [a, o] = i.near ?? [14, 40],
    s = new yr(t * VFX_SCALE, t * 1.3 * VFX_SCALE, r * VFX_SCALE, 18, 1, !0).translate(0, n + r * VFX_SCALE / 2, 0),
    c = new Kr({
      transparent: !0,
      depthWrite: !1,
      side: 2,
      uniforms: { uTime: { value: 0 }, uColor: { value: new Ei(e) }, uAlpha: { value: 1 } },
      vertexShader: `varying vec2 vUv; varying float vNear;
      void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.);
        vec3 axis = (modelMatrix * vec4(0., 0., 0., 1.)).xyz;
        vNear = smoothstep(${a.toFixed(1)}, ${o.toFixed(1)}, length(cameraPosition.xz - axis.xz));
        gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform float uTime; uniform vec3 uColor; uniform float uAlpha; varying vec2 vUv; varying float vNear;
      void main(){
        float y = vUv.y;
        float fade = pow(1. - y, ${(i.fadePow ?? 1.6).toFixed(2)}) * smoothstep(0., .08, y);
        float streak = step(.62, fract(vUv.x * 9. + floor((y * 30. - uTime * 3.)) * .37)) * .5;
        float pulse = .75 + .25 * sin(uTime * 2.4 - y * 18.);
        float a = min(1., fade * (.45 + streak) * pulse) * vNear * uAlpha * ${(i.gain ?? 0.8).toFixed(2)};
        vec3 base = uColor;
        ${i.rainbow ? `float hh = fract(y * 1.4 - uTime * .35); base = clamp(abs(mod(hh * 6. + vec3(0., 4., 2.), 6.) - 3.) - 1., 0., 1.);` : ``}
        gl_FragColor = vec4(mix(base, vec3(1.), .15 + streak * .4), a);
      }`,
    }),
    l = new Tr(s, c);
  return ((l.frustumCulled = !1), (l.renderOrder = 40), l);
}
var mb = /^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{4}$/,
  hb = (e) => (typeof e == `string` ? e.trim().toUpperCase() : ``),
  gb = [`stun:stun.cloudflare.com:3478`, `stun:stun.l.google.com:19302`, `stun:stun1.l.google.com:19302`],
  _b = 2500,
  vb = (e) =>
    typeof e == `string`
      ? e
          .replace(/[\u0000-\u001f\u007f]+/g, ` `)
          .replace(/\s+/g, ` `)
          .trim()
          .slice(0, 140)
      : ``,
  yb = { 1: 1, 2: 0.85, 3: 0.8, 4: 0.75 },
  bb = { 1: 1, 2: 1.25, 3: 1.5, 4: 1.75 },
  xb = (e) => 1 + 0.8 * Math.max(0, e - 1),
  Sb = 0.25,
  Cb = 3.5,
  wb = 0.5,
  Tb = (e) => $n.floor + ((1 - $n.floor) * e.captureRate) / 255,
  Eb = class {
    run;
    state = `idle`;
    index = -1;
    species = -1;
    get word() {
      const enemies = this.run.enemies;
      if (enemies.species[this.index] === this.species) return enemies.glyphWords[this.index];
      return glyphWordForSpecies(this.species);
    }
    family = -1;
    weakT = 0;
    attempts = 0;
    escapeT = 0;
    ball;
    mode = `league`;
    classic = !1;
    classicAt = 1 / 0;
    shiny = !1;
    sure = !1;
    mirror = !1;
    shinyAt = 1 / 0;
    shinyStage = 0;
    constructor(e) {
      this.run = e;
      this.ball = new Om(e);
    }
    beam = null;
    beamShiny = !1;
    beamFx() {
      let e = this.run,
        t = e.enemies,
        n = this.index;
      if (
        !(
          (this.state === `roaming` || this.state === `weakened`) &&
          n >= 0 &&
          t.alive[n] === 1 &&
          t.species[n] === this.species
        )
      ) {
        this.dropBeam();
        return;
      }
      let r = (t.flags[n] & R.Classic) !== 0,
        i = r || (t.flags[n] & R.Shiny) !== 0;
      (this.beam && this.beamShiny !== i && this.dropBeam(),
        this.beam ||
          ((this.beam = fb(r ? 16765498 : i ? 16751328 : 16771488, i ? 1.3 : 0.9, 1.2, i ? 42 : 30, {
            rainbow: i && !r,
            near: [5, 16],
            fadePow: 0.9,
            gain: i ? 1.4 : 1,
          })),
          (this.beamShiny = i),
          e.r.scene.add(this.beam)),
        this.beam.position.set(t.x[n], t.y[n], t.z[n]),
        (this.beam.material.uniforms.uTime.value = e.time));
    }
    dropBeam() {
      this.beam &&=
        (this.beam.parent?.remove(this.beam),
        this.beam.geometry.dispose(),
        this.beam.material.dispose(),
        null);
    }
    update(e) {
      let t = this.run,
        n = t.enemies;
      if (t.captureEncounter && (this.state === 'idle' || this.state === 'done')) return;
      if (this.shinyStage !== t.stage) {
        ((this.shinyStage = t.stage),
          (this.shinyAt =
            Math.random() <
            (Yn.zone + Math.min(Yn.zone, t.player.stats.luck / Yn.luckDiv)) * t.meta.shinyRate()
              ? F.range(40, 420) / wavePace(t.mode)
              : 1 / 0),
          t.stage === 1 &&
            t.boosts.has(`shiny-stone`) &&
            (this.shinyAt = Math.min(this.shinyAt, F.range(40, 150) / wavePace(t.mode))));
        let e = !t.coop && this.classicPool().length > 0;
        this.classicAt =
          e &&
          Math.random() < (mn.zone + Math.min(mn.zone, t.player.stats.luck / mn.luckDiv)) * t.meta.shinyRate()
            ? F.range(60, 420) / wavePace(t.mode)
            : 1 / 0;
      }
      if ((this.state === `idle` || this.state === `done`) && t.stageTime >= this.shinyAt)
        ((this.shinyAt = 1 / 0), this.spawnShiny());
      else if ((this.state === `idle` || this.state === `done`) && t.stageTime >= this.classicAt)
        ((this.classicAt = 1 / 0), this.spawnClassic());
      else if (this.state === `roaming`) {
        if (!n.alive[this.index] || n.species[this.index] !== this.species) {
          this.state = `done`;
          return;
        }
        ((this.escapeT -= e),
          Math.random() < e * 3 &&
            t.vfx.trail(n.x[this.index], n.y[this.index] + 1, n.z[this.index], 9109503, 0.6, I.Star, 0.7),
          this.escapeT <= 0 &&
            (t.ui.banner(
              c(`{name} ha huido...`, { name: this.word }),
              this.classic
                ? c(`El variocolor clásico se ha esfumado`)
                : this.shiny
                  ? c(`El variocolor se ha esfumado`)
                  : c(`Volverá a aparecer en otra partida`),
              `#8a90a8`,
              { species: this.species, glyph: this.word, shiny: this.shiny },
            ),
            t.vfx.burst(n.x[this.index], n.y[this.index] + 1, n.z[this.index], 16777215, 20, 6, I.Star, 0.6),
            n.kill(this.index),
            (this.state = `done`)));
      } else
        this.state === `weakened` &&
          (this.sure || (this.weakT -= e),
          (n.stun[this.index] = 0.5),
          (n.vx[this.index] = 0),
          (n.vz[this.index] = 0),
          Math.random() < e * 4 &&
            t.vfx.trail(n.x[this.index], n.y[this.index] + 1.5, n.z[this.index], 9109503, 0.5, I.Star, 0.6),
          this.weakT <= 0 && (this.mirror ? this.fadeMirror() : this.recover()));
    }
    spawnShiny() {
      let t = this.run;
      if (t.captureEncounter) return;
      const o = t.captureTarget;
      t.sprites.get(o);
      let s = t.terrain.randomPoint(F, t.player.pos.x, t.player.pos.z, 18, 32),
        l = t.enemies.spawn(
          o,
          s.x,
          s.z,
          t.director.hpMult() * 2.5,
          t.director.dmgMult(),
          R.Capture | R.Shiny,
        );
      l < 0 ||
        ((this.mode = `shiny`),
        (this.sure = !1),
        (this.mirror = !1),
        (this.shiny = !0),
        (this.classic = !1),
        (this.index = l),
        (this.species = o),
        (this.family = o),
        (this.state = `roaming`),
        (this.escapeT = t.meta.shinyFlee()),
        (this.attempts = 0),
        t.coop?.captureFound(o),
        t.ui.banner(
          c(`¡Un {name} variocolor!`, { name: this.word }),
          c(`Es rarísimo: debilítalo y captúralo antes de que huya`),
          `#ff9ae0`,
          { species: o, glyph: this.word, shiny: !0 },
        ),
        this.shinyEntrance(o, s.x, t.enemies.y[l], s.z));
    }
    classicPool() {
      let e = this.run.meta,
        t = (t) => e.family(t),
        n = new Set();
      for (let r of e.profile.classics ?? []) for (let e of Re(r, t)) n.add(e);
      return [k.get(this.run.captureTarget)].filter(
        (e) => !e.legendary && !e.mythical && k.hasAnimated(e.id) && Re(e.id, t).some((e) => !n.has(e)),
      );
    }
    spawnClassic(e) {
      if(this.run.captureEncounter || (e !== undefined && e !== this.run.captureTarget))return;
      let t = this.run;
      if (
        this.state === `roaming` ||
        this.state === `weakened` ||
        this.state === `throwing` ||
        (e === void 0 && t.coop)
      )
        return;
      let n = e === void 0 ? this.classicPool() : [];
      if (e === void 0 && !n.length) return;
      let r = e === void 0 ? F.weighted(n, Tb).id : e;
      (t.sprites.get(r), t.sprites.get(Qc + r));
      let i = t.terrain.randomPoint(F, t.player.pos.x, t.player.pos.z, 18, 32),
        a = t.enemies.spawn(
          r,
          i.x,
          i.z,
          t.director.hpMult() * 2.5,
          t.director.dmgMult(),
          R.Capture | R.Classic,
        );
      a < 0 ||
        ((this.mode = `classic`),
        (this.sure = !1),
        (this.mirror = !1),
        (this.shiny = !1),
        (this.classic = !0),
        (this.index = a),
        (this.species = r),
        (this.family = r),
        (this.state = `roaming`),
        (this.escapeT = t.meta.shinyFlee()),
        (this.attempts = 0),
        t.ui.banner(
          c(`¡{name} variocolor clásico!`, { name: this.word }),
          c(`Un brillo de los de antes, rarísimo: debilítalo y captúralo antes de que huya`),
          `#ffc938`,
          { species: r, glyph: this.word, classic: !0 },
        ),
        t.meta.markSeen(r),
        t.ui.shinyFlash(!0),
        t.vfx.burst(i.x, t.enemies.y[a] + 1.2, i.z, 16765498, 44, 9, I.Star, 1.1),
        t.vfx.burst(i.x, t.enemies.y[a] + 1.2, i.z, 16777215, 22, 6, I.Star, 0.9),
        t.audio.duck(0.25, 2.2),
        t.audio.classic(),
        t.cry(r));
    }
    rollLegendShiny() {
      return false; // Forest bosses stay enemies.
    }
    shinyEntrance(e, t, n, r, i) {
      let a = this.run;
      const word = this.species === e ? this.word : enemySpeciesWord(e);
      (a.meta.markSeen(e),
        i &&
          a.ui.banner(c(`¡{name} legendario variocolor!`, { name: word }), i, `#ff9ae0`, {
            species: e,
            glyph: word,
            shiny: !0,
          }),
        a.ui.shinyFlash(),
        a.vfx.burst(t, n + 1.2, r, 16751328, 40, 9, I.Star, 1.1),
        a.vfx.burst(t, n + 1.2, r, 10152191, 24, 6, I.Star, 0.9),
        a.audio.duck(0.25, 2.2),
        a.audio.shiny(!0),
        a.cry(e));
    }
    shinyBoss(e) {
      let t = this.run,
        n = t.enemies,
        r = n.gen[e];
      ((n.flags[e] |= R.Shiny),
        t.later(3.4, () => {
          n.gen[e] === r &&
            n.alive[e] &&
            this.shinyEntrance(
              n.species[e],
              n.x[e],
              n.y[e],
              n.z[e],
              c(`Derrótalo y te esperará para que lo captures`),
            );
        }));
    }
    interceptBoss(e) {
      let t = this.run,
        n = t.enemies;
      return t.endless || t.captureEncounter || n.species[e] !== t.captureTarget || !(n.flags[e] & R.Shiny) || e !== t.boss.bossIndex
        ? !1
        : (t.onBossKilled(e), t.boss.release(), this.takeOver(e, n.species[e], `shiny`), !0);
    }
    takeOver(e, t, n = `league`) {
      if(this.run.captureEncounter || t !== this.run.captureTarget || this.run.enemies.species[e] !== t || !(this.run.enemies.flags[e] & R.Shiny))return;
      this.run.captureEncounter = {index:e, generation:this.run.enemies.gen[e], stage:this.run.stage};
      this.run.enemies.glyphWords[e] = glyphWordForSpecies(t);
      let r = this.run,
        i = r.enemies;
      (this.state === `roaming` || this.state === `weakened`) &&
        this.index !== e &&
        i.alive[this.index] &&
        i.kill(this.index);
      let a = (i.flags[e] & R.Shiny) !== 0;
      ((i.flags[e] = R.Capture | (i.flags[e] & (R.Flying | R.Shiny)) | (n === `league` ? R.Flying : 0)),
        (i.hp[e] = i.maxHp[e] * 0.01),
        (this.mode = n),
        (this.sure = !0),
        (this.mirror = !1),
        (this.shiny = a),
        (this.classic = !1),
        (this.index = e),
        (this.species = t),
        (this.family = t),
        (this.state = `weakened`),
        (this.weakT = 10),
        (this.attempts = 0),
        r.ui.banner(
          c(`¡{name} está debilitado!`, { name: this.word }),
          c(`Acércate y {key} para lanzar la Poké Ball`, { key: Lo(`E`, !0) }),
          a ? `#ff9ae0` : `#c08aff`,
          { species: t, glyph: this.word, shiny: a },
        ));
    }
    onDefeated(e) {
      let t = this.run,
        n = t.enemies;
      this.state === `roaming` &&
        ((n.hp[e] = n.maxHp[e] * 0.01),
        (this.state = `weakened`),
        (this.weakT = 10),
        (n.flash[e] = 1),
        t.ui.banner(
          c(`¡{name} está debilitado!`, { name: this.word }),
          c(`Acércate y {key} para lanzar la Poké Ball`, { key: Lo(`E`, !0) }),
          `#5af0ff`,
          { species: this.species, glyph: this.word, shiny: this.shiny },
        ),
        t.audio.power(),
        t.coop?.captureWeak(this.species, this.family, this.mode, this.shiny, n.x[e], n.z[e]));
    }
    coopWeak(e, t, n, r, i, a) {
      let o = this.run,
        s = o.enemies;
      if (
        this.state === `roaming` ||
        this.state === `weakened` ||
        this.state === `throwing` ||
        o.captureEncounter || e !== o.captureTarget || t !== e || n !== 'shiny' || !r ||
        !Number.isFinite(i + a)
      )
        return !1;
      o.sprites.get(e);
      let u = s.spawn(e, i, a, enemyDifficulty(o.tier).enemyHp, 1, R.Capture | R.Shiny);
      return u < 0
        ? !1
        : ((s.hp[u] = s.maxHp[u] * 0.01),
          (this.mode = `shiny`),
          (this.sure = !1),
          (this.mirror = !0),
          (this.shiny = r),
          (this.classic = !1),
          (this.index = u),
          (this.species = e),
          (this.family = e),
          (this.state = `weakened`),
          (this.weakT = 20),
          (this.attempts = 0),
          o.meta.markSeen(e),
          o.ui.banner(
            c(`¡{name} está debilitado!`, { name: this.word }),
            c(`Acércate y {key} para lanzar la Poké Ball`, { key: Lo(`E`, !0) }),
            r ? `#ff9ae0` : `#5af0ff`,
            { species: e, glyph: this.word, shiny: r },
          ),
          o.audio.power(),
          !0);
    }
    fadeMirror() {
      let e = this.run,
        t = e.enemies,
        n = this.index;
      ((this.mirror = !1),
        (this.state = `done`),
        t.alive[n] &&
          t.species[n] === this.species &&
          t.flags[n] & R.Capture &&
          (e.vfx.burst(t.x[n], t.y[n] + 1, t.z[n], 16777215, 16, 6, I.Star, 0.5), t.kill(n)),
        e.ui.toast(c(`{name} se ha escapado`, { name: this.word }), null));
    }
    canWait() {
      return (
        (this.state === `weakened` || this.state === `throwing`) && this.run.enemies.alive[this.index] === 1
      );
    }
    get throwing() {
      return this.state === `throwing`;
    }
    canThrow() {
      if (this.state !== `weakened`) return !1;
      let e = this.run.enemies,
        t = this.run.player.pos;
      return Math.hypot(e.x[this.index] - t.x, e.z[this.index] - t.z) < 9;
    }
    throwBall() {
      if (!this.canThrow()) return;
      let e = this.run,
        t = e.enemies;
      ((this.state = `throwing`), this.dropBeam());
      let n = 0.55 + (k.get(this.species).captureRate / 255) * 0.35 + this.attempts * 0.2;
      (t.para[this.index] > 0 || t.sleep[this.index] > 0 || t.frozen[this.index] > 0) && (n += 0.15);
      let r = !this.sure && e.useMasterBall();
      ((r || this.sure) && (n = 1),
        this.ball.start(
          this.index,
          Math.random() < Math.min(0.97, n) || n >= 1,
          () => this.caught(),
          () => this.breakFree(),
          r,
        ));
    }
    breakFree() {
      let e = this.run,
        t = e.enemies;
      (this.attempts++,
        e.cry(this.species),
        this.attempts >= 3
          ? (e.vfx.burst(t.x[this.index], t.y[this.index] + 1, t.z[this.index], 16777215, 16, 6, I.Star, 0.5),
            t.kill(this.index),
            (this.state = `done`),
            e.ui.banner(
              c(`{name} ha huido...`, { name: this.word }),
              c(`Volverá a aparecer en otra partida`),
              `#8a90a8`,
              { species: this.species, glyph: this.word, shiny: this.shiny },
            ))
          : (e.ui.toast(c(`¡Se ha escapado! Inténtalo otra vez: cada lanzamiento es más fácil`), `poke-ball`),
            (this.state = `weakened`),
            (this.weakT = 6)));
    }
    recover() {
      let e = this.run,
        t = e.enemies;
      ((t.hp[this.index] = t.maxHp[this.index] * 0.4),
        (this.state = `roaming`),
        e.ui.toast(c(`¡{name} se ha recuperado y huye!`, { name: this.word }), null));
    }
    caught() {
      let e = this.run,
        t = e.enemies;
      (t.kill(this.index), (this.state = `done`));
      let n = this.mode === `league`;
      if (
        (n && (e.meta.joinLeague(this.family), e.stats.captured.push(this.family), e.keepLive()),
        this.classic)
      )
        this.caughtClassic();
      else if (this.shiny) {
        let r = e.meta.shinyPerks().length,
          i = e.meta.addShiny(this.species);
        (e.stats.shinies.push(this.species), e.keepLive());
        let a = i ? jt.first : jt.repeat;
        ((e.meta.profile.stardust += a), (e.meta.profile.totalStardust += a), e.meta.save());
        let o = e.allies.makeShiny(this.species, t.x[this.index], t.y[this.index], t.z[this.index]),
          s = e.meta.shinyPerks()[r],
          l = (t) => {
            let r = [
                n ? c(`Se une a tu Liga`) : ``,
                i ? c(`Nuevo en tu Pokédex`) : ``,
                c(`+{dust} Polvo Estelar`, { dust: a }),
                t ? c(`Luchará a tu lado: {label}`, { label: e.allies.shinyLabel(this.species) }) : ``,
              ].filter(Boolean),
              l = e.meta.skinMember(this.species),
              u = l
                ? e.meta.inLeague(l.id)
                  ? c(`Aspecto variocolor de {name} desbloqueado en la Liga`, { name: k.get(l.id).name })
                  : c(`Desbloqueará el aspecto variocolor de {name} cuando se una a tu Liga`, {
                      name: k.get(l.id).name,
                    })
                : void 0;
            (e.ui.caught(
              this.species,
              c(`¡{name} variocolor atrapado!`, { name: o.name }),
              r.join(` · `),
              `#ff9ae0`,
              !0,
              u,
            ),
              s &&
                e.ui.toast(
                  c(`Colección variocolor: {name} · {desc}`, { name: s.name, desc: s.desc }),
                  `shiny-stone`,
                ));
          };
        (e.cry(this.species), e.audio.caught(), e.audio.shiny());
        let u = e.allies.shinyAlly;
        if (!u) {
          (e.allies.setShiny(o), l(!0));
          return;
        }
        ((e.state = `modal`),
          e.ui.showShinySwap(e, u, o, a, (t) => {
            (e.ui.hideModal(),
              t
                ? (e.allies.setShiny(o),
                  e.ui.toast(
                    c(`{name} variocolor vuelve al bosque y deja su sitio al nuevo`, { name: u.name }),
                    null,
                  ))
                : e.ui.toast(c(`{name} variocolor vuelve al bosque. ¡Hasta pronto!`, { name: o.name }), null),
              e.resume(),
              l(t));
          }));
      } else
        (e.ui.caught(
          this.family,
          c(`¡{name} se une a tu Liga!`, { name: k.get(this.family).name }),
          c(`Ya puedes elegirlo al empezar una partida`),
          `#ffb21a`,
        ),
          e.cry(this.species),
          e.audio.caught());
    }
    caughtClassic() {
      let e = this.run,
        t = this.species,
        n = e.meta,
        r = n.addClassic(t);
      (e.stats.classics.push(t), e.keepLive());
      let i = r ? 200 : 0;
      ((n.profile.stardust += i), (n.profile.totalStardust += i), n.save());
      let a = Re(t, (e) => n.family(e)),
        o = a.filter((e) => n.inLeague(e)),
        s = a.filter((e) => !n.inLeague(e)),
        l = (e) => e.map((e) => k.get(e).name).join(`, `),
        u = o.length
          ? c(`Variocolor clásico de {name} desbloqueado en la Liga`, { name: l(o) })
          : c(`Desbloqueará el variocolor clásico de {name} cuando se una a tu Liga`, { name: l(s) });
      (e.cry(t),
        e.audio.caught(),
        e.audio.classic(),
        e.ui.caught(
          t,
          c(`¡{name} variocolor clásico atrapado!`, { name: k.get(t).name }),
          i ? c(`+{dust} Polvo Estelar`, { dust: i }) : c(`Ya lo tenías: su aspecto sigue abierto`),
          `#ffc938`,
          !1,
          u,
          !1,
          !0,
        ));
    }
    dispose() {
      (this.ball.dispose(), this.dropBeam());
    }
    get marker() {
      return this.state === `roaming` || this.state === `weakened`
        ? { x: this.run.enemies.x[this.index], z: this.run.enemies.z[this.index], i: this.index }
        : null;
    }
  },
  Db = 150,
  Ob = 22,
  kb = {
    top: 1181215,
    bottom: 3807832,
    fog: 2363962,
    near: 8,
    far: 44,
    light: 0.4,
    sun: 12618495,
    clouds: [0.32, 0.2, 0.5],
    cover: 0.9,
    vignette: 0.8,
    tint: [0.46, 0.37, 0.76],
  },
  Ab = class {
    run;
    force;
    endless;
    state = `wait`;
    cx = 0;
    cz = 0;
    r = Ob;
    k = 0;
    at;
    bounceT = 0;
    berryT = 14;
    out = {
      k: 0,
      flash: 0,
      top: new Ei(),
      bottom: new Ei(),
      fog: new Ei(),
      near: 0,
      far: 0,
      light: 1,
      sun: new Ei(),
      clouds: kb.clouds,
      cover: 0,
      vignette: 0.4,
      tint: kb.tint,
    };
    flash = 0;
    introT = 0;
    constructor(e, t = !1, n = !1) {
      ((this.run = e),
        (this.force = t),
        (this.endless = n),
        (this.at = t ? e.stageTime + 0.5 : F.range(70, 150) / wavePace(e.mode)),
        !t &&
        (e.endless ||
          (e.stage !== 2 && e.stage !== 3) ||
          e.mewtwoFought ||
          !e.meta.leagueReady().includes(Db))
          ? (this.state = `done`)
          : e.sprites.get(Db));
    }
    get active() {
      return this.state === `intro` || this.state === `fight`;
    }
    update(e) {
      let t = this.run,
        n = this.k,
        r = this.flash;
      if (this.state === `wait`) {
        let e =
          t.boss.alive ||
          t.bossSpawned ||
          t.stageCleared ||
          t.events.active ||
          t.director.finalSwarm ||
          t.capture.state === `roaming` ||
          t.capture.state === `weakened` ||
          t.capture.state === `throwing`;
        t.stageTime >= this.at && (!e || this.force) && t.state === `play` && this.start();
      }
      (this.state === `intro` && (this.introT += e) > 6 && this.spawn(!0),
        this.active
          ? ((this.k = Math.min(1, this.k + e / 2.5)),
            this.hold(e),
            this.ambience(e),
            this.state === `fight` && (this.berryT -= e) <= 0 && ((this.berryT = 20), this.berry()))
          : (this.k = Math.max(0, this.k - e / 3)),
        (this.flash = Math.max(0, this.flash - e * 4)),
        (this.k !== n || this.flash > 0 || r > 0) && t.pushLook());
    }
    start() {
      let e = this.run,
        t = e.enemies,
        n = e.player.pos,
        r = e.terrain;
      ((this.state = `intro`), (this.introT = 0), (e.mewtwoFought = !0));
      let i = n.x,
        a = n.z;
      for (let e = 0; e < 20 && !r.inBounds(i, a, 26); e++) ((i *= 0.9), (a *= 0.9));
      ((this.cx = i), (this.cz = a), e.projectiles.clearHostile());
      for (let n = 0; n < t.n; n++)
        !t.alive[n] ||
          t.dying[n] > 0 ||
          (t.flags[n] & (R.Alpha | R.Totem | R.Summoner | R.Treasure | R.Capture | R.Boss | R.Object)
            ? this.banish(n)
            : ((t.dying[n] = 0.35 + Math.random() * 0.4),
              Math.random() < 0.15 &&
                e.vfx.add.spawn({
                  x: t.x[n],
                  y: t.y[n] + 1,
                  z: t.z[n],
                  vy: 2,
                  life: 0.8,
                  size: 0.6,
                  endSize: 0,
                  color: 12618495,
                  shape: I.Twinkle,
                  glow: 1,
                })));
      (e.ui.banner(
        c(`Todo se queda en silencio...`),
        c(`Una presencia psíquica te ha encontrado`),
        `#c08aff`,
        { species: Db },
      ),
        e.audio.duck(0.3, 600),
        e.audio.alarm(),
        e.shake(0.4),
        (this.flash = 1));
      for (let t = 0; t < 3; t++)
        e.later(0.4 + t * 0.35, () =>
          e.vfx.ring(this.cx, r.height(this.cx, this.cz), this.cz, Ob * (0.4 + t * 0.3), 12618495, 0.8),
        );
      e.later(2.6, () => this.spawn());
    }
    spawn(e = !1) {
      let t = this.run;
      if (!(this.state !== `intro` || (t.player.dead && !e))) {
        if (t.player.dead) this.state = `done`;
        else
          try {
            this.spawnNow();
          } catch (e) {
            (console.error(`[pokebonk] Mewtwo no pudo aparecer`, e), (this.state = `done`));
          }
      }
    }
    spawnNow() {
      let e = this.run,
        t = e.player.pos,
        n = Math.max(5, e.stageTime * wavePace(e.mode) / 60),
        r = this.endless
          ? e.director.hpMult() * 3
          : Av.hpCurve(e.stage, n) *
            Av.BOSS_ZONE_HP[e.stage - 1] *
            e.diff.enemyHp *
            e.player.stats.difficulty *
            2,
        i = this.endless ? e.director.dmgMult() * 0.3 : (1 + 0.13 * n) * (un[e.stage - 1] ?? un[3]) * 0.3,
        a = e.camYaw + Math.PI,
        o = this.confine(t.x + Math.sin(a) * 10, t.z + Math.cos(a) * 10, 4, { x: 0, z: 0 }),
        s = e.boss.spawn(Db, o.x, o.z, !0, { hp: r, dmg: i, kit: !0, secs: wy.mewtwo });
      s < 0
        ? (this.state = `done`)
        : (e.capture.rollLegendShiny() && e.capture.shinyBoss(s),
          (this.state = `fight`),
          (e.audio.intensity = 1));
    }
    intercept(e) {
      let t = this.run;
      if (this.state !== `fight` || e !== t.boss.bossIndex || !(t.boss.kit instanceof ay)) return !1;
      if (((this.state = `done`), this.endless || t.captureEncounter || Db !== t.captureTarget)) return (t.projectiles.clearHostile(), !1);
      (t.boss.release(),
        t.projectiles.clearHostile(),
        t.capture.takeOver(e, Db),
        t.audio.duck(0.3, 0.1),
        t.hitstop(0.5),
        t.shake(0.8),
        t.audio.victory());
      let n = t.enemies,
        r = n.x[e],
        i = n.z[e];
      t.vfx.flash(r, n.y[e] + 1, i, 16777215, 20, 0.4);
      for (let e = 0; e < 3; e++)
        t.later(e * 0.15, () =>
          t.vfx.ring(r, t.terrain.height(r, i), i, 10 + e * 10, e === 1 ? 16777215 : 12618495, 0.7),
        );
      for (let a = 0; a < 16; a++)
        t.pickups.spawn(`coin`, r, n.y[e], i, Math.ceil(6 * t.stage * t.player.stats.gold));
      return !0;
    }
    onPhase(e) {
      this.flash = 1;
      let t = this.run.terrain;
      this.run.vfx.ring(this.cx, t.height(this.cx, this.cz), this.cz, Ob, e === 3 ? 16734858 : 12618495, 0.9);
    }
    confine(e, t, n, r) {
      let i = e - this.cx,
        a = t - this.cz,
        o = Math.hypot(i, a),
        s = Ob - n;
      return (
        o > s ? ((r.x = this.cx + (i / o) * s), (r.z = this.cz + (a / o) * s)) : ((r.x = e), (r.z = t)),
        r
      );
    }
    atmos() {
      if (this.k <= 0 && this.flash <= 0) return null;
      let e = this.out;
      return (
        (e.k = this.k * this.k * (3 - 2 * this.k)),
        (e.flash = this.flash),
        e.top.set(kb.top),
        e.bottom.set(kb.bottom),
        e.fog.set(kb.fog),
        e.sun.set(kb.sun),
        (e.near = kb.near),
        (e.far = kb.far),
        (e.light = kb.light),
        (e.cover = kb.cover),
        (e.vignette = kb.vignette),
        e
      );
    }
    berry() {
      let e = this.run,
        t = e.player.pos,
        n = e.terrain;
      for (let r = 0; r < 30; r++) {
        let r = F.range(0, Math.PI * 2),
          i = F.range(4, 19),
          a = this.cx + Math.cos(r) * i,
          o = this.cz + Math.sin(r) * i;
        if (Math.hypot(a - t.x, o - t.z) < 8 || !n.isFlatOpen(a, o)) continue;
        let s = n.height(a, o);
        (e.pickups.spawn(`heal`, a, s, o, 1),
          e.vfx.beams.spawn(a, s, o, a, s + 9, o, 0.8, 7012234, 1.2),
          e.vfx.ring(a, s, o, 2.5, 7012234, 0.6));
        return;
      }
    }
    banish(e) {
      let t = this.run,
        n = t.enemies;
      if (t.boss.bossIndex === e) return;
      let r = n.x[e] - this.cx,
        i = n.z[e] - this.cz;
      if (!((Math.hypot(r, i) || 1) > 40))
        for (let a = 0; a < 12; a++) {
          let a = Math.atan2(i, r) + F.range(-1, 1),
            o = 44 + F.range(0, 10),
            s = this.cx + Math.cos(a) * o,
            c = this.cz + Math.sin(a) * o;
          if (t.terrain.inBounds(s, c, 4)) {
            ((n.x[e] = s), (n.z[e] = c), (n.y[e] = t.terrain.height(s, c)));
            return;
          }
        }
    }
    hold(e) {
      let t = this.run,
        n = t.enemies,
        r = t.player,
        i = r.pos,
        a = t.boss.bossIndex;
      for (let e = 0; e < n.n; e++) n.alive[e] && e !== a && (n.stun[e] = Math.max(n.stun[e], 0.3));
      if (a >= 0 && n.isAlive(a)) {
        let e = this.confine(n.x[a], n.z[a], 2, { x: 0, z: 0 });
        ((n.x[a] = e.x), (n.z[a] = e.z));
      }
      let o = i.x - this.cx,
        s = i.z - this.cz,
        c = Math.hypot(o, s) || 1;
      ((this.bounceT -= e),
        c > 21.2 &&
          ((r.vel.x -= (o / c) * 40 * e),
          (r.vel.z -= (s / c) * 40 * e),
          c > 22.6 && ((i.x = this.cx + (o / c) * 22.6), (i.z = this.cz + (s / c) * 22.6)),
          this.bounceT <= 0 &&
            ((this.bounceT = 0.6),
            t.vfx.burst(i.x, i.y + 1, i.z, 12618495, 10, 5, I.PixSparkle, 0.4, 0.4),
            t.audio.zap())));
    }
    ambience(e) {
      let t = this.run,
        n = t.terrain,
        r = this.k;
      for (let i = 0, a = Math.floor(e * 70 * r + Math.random()); i < a; i++) {
        let e = F.range(0, Math.PI * 2),
          r = this.cx + Math.cos(e) * Ob,
          i = this.cz + Math.sin(e) * Ob;
        t.vfx.add.spawn({
          x: r,
          y: n.height(r, i) + F.range(0, 1),
          z: i,
          vy: F.range(2, 5),
          life: F.range(0.8, 1.4),
          size: F.range(0.3, 0.6),
          endSize: 0,
          color: Math.random() < 0.7 ? 11561727 : 16777215,
          shape: I.Twinkle,
          glow: 1,
        });
      }
      if (this.active)
        for (let i = 0; i < 56; i++) {
          let a = (i / 56) * Math.PI * 2 + t.time * 0.05,
            o = this.cx + Math.cos(a) * Ob,
            s = this.cz + Math.sin(a) * Ob,
            c = n.height(o, s),
            l = 4.5 + Math.sin(t.time * 2.4 + i * 0.7) * 1.2;
          t.vfx.beams.spawn(o, c - 0.5, s, o, c + l, s, 0.9, i % 7 ? 9063167 : 14201087, e * 1.5, 0.28 * r);
        }
      for (let i = 0, a = Math.floor(e * 6 * r + Math.random()); i < a; i++) {
        let e = F.range(0, Math.PI * 2),
          r = F.range(3, Ob),
          i = this.cx + Math.cos(e) * r,
          a = this.cz + Math.sin(e) * r;
        t.vfx.norm.spawn({
          x: i,
          y: n.height(i, a) + 0.2,
          z: a,
          vy: F.range(0.6, 1.4),
          life: F.range(2.5, 4),
          size: F.range(0.3, 0.7),
          endSize: 0.2,
          color: 6969978,
          shape: I.Rock,
          spin: F.range(-2, 2),
        });
      }
    }
  },
  jb = 20,
  Mb = `#other`,
  Nb = `#ult`,
  Pb = `#allies`,
  Fb = 3,
  Ib = class e {
    times = [];
    rows = [];
    last = -9;
    born = {};
    static totals(e) {
      let t = {},
        n = 0;
      for (let r of e.player.moves)
        r && ((t[r.def.key] = (t[r.def.key] ?? 0) + r.damageDone), (n += r.damageDone));
      for (let [r, i] of Object.entries(e.stats.forgotten)) ((t[r] = (t[r] ?? 0) + i.dmg), (n += i.dmg));
      return (
        (t[Nb] = e.stats.ultDamage),
        (n += t[Nb]),
        (t[Pb] = e.allies.list.reduce((e, t) => e + t.damage, 0)),
        (n += t[Pb]),
        (t[Mb] = Math.max(0, e.stats.damage - n)),
        t
      );
    }
    tick(t) {
      if (t.time - this.last < 1) return;
      this.last = t.time;
      let n = e.totals(t);
      for (let e of Object.keys(n)) this.born[e] ??= t.time;
      for (this.times.push(t.time), this.rows.push(n); this.times.length > jb; )
        (this.times.shift(), this.rows.shift());
    }
    rates(t) {
      let n = e.totals(t),
        r = {},
        i = {},
        a = this.times.findIndex((e) => e >= t.time - 15);
      a < 0 && (a = this.times.length - 1);
      let o = a >= 0 ? this.times[a] : 0,
        s = a >= 0 ? this.rows[a] : {};
      for (let e of Object.keys(n)) {
        let a = (this.born[e] ??= t.time),
          c = a > o || s[e] === void 0,
          l = Math.max(Fb, t.time - (c ? Math.max(a, o) : o));
        ((i[e] = Math.round(l)), (r[e] = Math.max(0, n[e] - (c ? 0 : s[e])) / l));
      }
      return { totals: n, dps: r, span: i };
    }
  };

export {
  Bv,
  Hv,
  fb,
  wy,
  Ab,
  yb,
  bb,
  xb,
  Sb,
  Cb,
  wb,
  Av,
  Lv,
  zv,
  gy,
  Iy,
  sb,
  ub,
  Gy,
  ab,
  Eb,
  Ib,
  Mb,
  Nb,
  Pb,
  gb,
  _b,
  mb,
  hb
};
