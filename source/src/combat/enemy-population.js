import {chineseText as c} from "../data/chinese-text.js";
import {I, random as F} from "../effects/battle-particles.js";
import {gameData as k} from "../data/game-database.js";
import {CrowdGrid} from "../performance/crowd-grid.js";
import {roomMonster} from "../world/room-monsters.js";
import {enemyWord, enemySpeciesWord, remainingStrokes} from "../data/character-rules.js";
import {glyphWordForSpecies} from "../actors/paper-glyph-art.js";
import {crowdStep, separationBudget} from "../performance/crowd-cadence.js";
import {createActorTypeLookup} from "../actors/actor-types.js";
import {allowOrdinarySpawn, ENEMY_HEALTH_SCALE, SPECIAL_ACTORS} from "../performance/spawn-budget.js";
import {enemyShadow} from "../performance/effect-budget.js";
import {actorMetrics} from "../actors/actor-metrics.js";
import {moveEnemyPastProps, obstacleJumpSpeed} from "../world/paper-collision.js";
import {Xc, Qc} from "../actors/sprite-assets.js";

var nf = [`tm-swords`, `tm-agility`, `tm-iron`, `tm-thunder`, `tm-payday`],
  rf = {
    "tm-swords": {
      name: c(`MT Danza Espada`),
      desc: c(`+50% de daño`),
      icon: `tm-fighting`,
      col: 16734778,
      secs: 10,
    },
    "tm-agility": {
      name: c(`MT Agilidad`),
      desc: c(`+35% de velocidad y +30% de velocidad de ataque`),
      icon: `tm-psychic`,
      col: 16743128,
      secs: 10,
    },
    "tm-iron": {
      name: c(`MT Defensa Férrea`),
      desc: c(`Recibes un 60% menos de daño`),
      icon: `tm-steel`,
      col: 12112104,
      secs: 8,
    },
    "tm-thunder": {
      name: c(`MT Onda Trueno`),
      desc: c(`Paraliza a todos los Pokémon de alrededor`),
      icon: `tm-electric`,
      col: 16769594,
      secs: 4,
    },
    "tm-payday": {
      name: c(`MT Día de Pago`),
      desc: c(`Pokédólares ×2`),
      icon: `tm-normal`,
      col: 16762938,
      secs: 15,
    },
  },
  af = 0.4,
  of = 40,
  sf = (e, t) => rf[t].secs * e.player.stats.powerup;
function cf(e) {
  let t = [];
  return (
    e(`tm-swords`) && t.push({ stat: `damage`, mul: 1.5 }),
    e(`tm-agility`) && t.push({ stat: `moveSpeed`, mul: 1.35 }, { stat: `attackSpeed`, mul: 1.3 }),
    e(`tm-payday`) && t.push({ stat: `gold`, mul: 2 }),
    t
  );
}
function lf(e, t) {
  let n = rf[t],
    r = e.player,
    i = r.pos;
  (e.stats.powerUps++,
    e.ui.toast(c(`¡{name}! {desc}`, { name: n.name, desc: n.desc }), n.icon),
    e.audio.power(),
    e.vfx.flash(i.x, i.y + 1, i.z, n.col, 6, 0.3),
    e.vfx.ring(i.x, i.y + 0.05, i.z, 5, n.col, 0.5, 0.35),
    e.vfx.ring(i.x, i.y + 0.05, i.z, 2.6, 16777215, 0.35, 0.3),
    t === `tm-thunder`
      ? uf(e)
      : (r.addBuff(t, sf(e, t), n.name),
        t === `tm-iron` && e.vfx.burst(i.x, i.y + 1.2, i.z, 15266559, 16, 6, I.Square, 0.45, 0.5)));
}
function uf(e) {
  let t = e.enemies,
    n = e.player.pos,
    r = sf(e, `tm-thunder`),
    i = 0;
  for (let a of t.within(n.x, n.z, of)) {
    if (!t.isAlive(a)) continue;
    let n = e.combat.resist(a);
    ((t.stun[a] = Math.max(t.stun[a], r * n)),
      (t.para[a] = Math.max(t.para[a], r * n + 1)),
      (t.flash[a] = 1),
      i < 28 &&
        (i < 10 || F.chance(0.35)) &&
        (i++,
        e.vfx.lightning(
          t.x[a] + F.range(-1, 1),
          t.y[a] + 11,
          t.z[a],
          t.x[a],
          t.y[a] + t.hgt[a] * 0.5,
          t.z[a],
          16773242,
          0.32,
          6,
          0.3,
        ),
        e.vfx.ring(t.x[a], t.y[a], t.z[a], 1.4, 16769594, 0.3)));
  }
  (e.vfx.flash(n.x, n.y + 2, n.z, 16773242, 45, 0.3),
    e.vfx.ring(n.x, n.y + 0.1, n.z, of * 0.6, 16769594, 0.7, 0.5),
    e.shake(0.25),
    e.audio.zap(),
    e.r.kick(0.01));
}
function df(e, t) {
  if (!e.player.buffs.has(`tm-iron`)) return t;
  let n = e.player.pos;
  return (Math.random() < 0.6 && e.vfx.burst(n.x, n.y + 1.1, n.z, 15266559, 6, 5, I.Spark, 0.3, 0.3), t * af);
}
function ff(e, t) {
  let n = e.player,
    r = n.pos,
    i = e.time;
  if (n.dead) return;
  let a = (e) => n.buffs.get(e)?.t ?? 0,
    o = (e) => e > 2 || Math.floor(i * 8) % 2 == 0,
    s = a(`tm-swords`);
  if (s > 0 && o(s)) {
    for (let n = 0; n < 2; n++) {
      let a = i * 5 + n * Math.PI;
      Math.random() < t * 30 &&
        e.vfx.add.spawn({
          x: r.x + Math.cos(a) * 1.3,
          y: r.y + 1.1,
          z: r.z + Math.sin(a) * 1.3,
          life: 0.25,
          size: 0.6,
          endSize: 0.2,
          color: 16738874,
          shape: I.PixSlash,
          rot: -a,
          glow: 0.7,
        });
    }
    Math.random() < t * 10 &&
      e.vfx.add.spawn({
        x: r.x + F.range(-0.6, 0.6),
        y: r.y + 0.3,
        z: r.z + F.range(-0.6, 0.6),
        vy: 2.5,
        life: 0.6,
        size: 0.3,
        endSize: 0,
        color: 16747066,
        shape: I.Flame,
        glow: 0.6,
      });
  }
  let c = a(`tm-agility`);
  c > 0 &&
    o(c) &&
    n.speedNow > 1 &&
    Math.random() < t * 24 &&
    e.vfx.trail(
      r.x + F.range(-0.3, 0.3),
      r.y + F.range(0.4, 1.5),
      r.z + F.range(-0.3, 0.3),
      16747224,
      0.55,
      I.Soft,
      0.35,
    );
  let l = a(`tm-iron`);
  (l > 0 && o(l) && Math.random() < t * 3 && e.vfx.ring(r.x, r.y + 0.9, r.z, 1.5, 13689588, 0.3, 0.25),
    l > 0 &&
      Math.random() < t * 6 &&
      e.vfx.add.spawn({
        x: r.x + F.range(-0.8, 0.8),
        y: r.y + F.range(0.3, 1.8),
        z: r.z + F.range(-0.8, 0.8),
        life: 0.3,
        size: 0.4,
        endSize: 0,
        color: 16777215,
        shape: I.Twinkle,
        glow: 0.8,
      }));
  let u = a(`tm-payday`);
  u > 0 &&
    o(u) &&
    Math.random() < t * 9 &&
    e.vfx.add.spawn({
      x: r.x + F.range(-2.5, 2.5),
      y: r.y + 4.5,
      z: r.z + F.range(-2.5, 2.5),
      vy: -7,
      life: 0.6,
      size: 0.45,
      endSize: 0.45,
      color: 16777215,
      shape: I.PixCoin,
      rot: F.range(0, 6.28),
      glow: 0.2,
    });
}
var mf = (e) => 200 + 100 * (Math.min(3, e.stage) - 1);
function hf(e) {
  let t = e.director.pool.map((e) => k.root(e.id).id).filter((e) => k.hasAnimated(e));
  return t.length ? F.pick(t) : 133;
}
function gf(e, t) {
  if (e.egg) {
    (e.ui.toast(c(`Ya llevas un Huevo: deja que eclosione primero`), null), e.audio.deny());
    return;
  }
  t.used = !0;
  e.interactables.remove(t);
  let r = hf(e);
  (e.sprites.get(r),
    (e.egg = { from: e.stats.kills, need: mf(e), species: r, x: t.x, y: t.y + 1.6, z: t.z, wob: 0 }),
    e.ui.toast(c(`¡Tienes un Huevo Pokémon! Eclosiona tras {n} bajas`, { n: e.egg.need }), null),
    e.vfx.burst(t.x, t.y + 1.5, t.z, 16774358, 14, 4, I.Twinkle, 0.45, 0.5),
    e.audio.power());
}
var _f = (e) => (e.egg ? Math.min(1, (e.stats.kills - e.egg.from) / e.egg.need) : 0);
function vf(e, t) {
  let n = e.egg;
  if (!n) return;
  let r = e.player.pos,
    i = e.player.facing,
    a = _f(e),
    o = r.x - i.x * 1.1 + i.y * 0.6,
    s = r.z - i.y * 1.1 - i.x * 0.6,
    c = r.y + 2.1 + Math.sin(e.time * 2.4) * 0.15,
    l = 1 - Math.exp(-t * 6);
  ((n.x += (o - n.x) * l),
    (n.y += (c - n.y) * l),
    (n.z += (s - n.z) * l),
    (n.wob =
      a > 0.8
        ? Math.sin(e.time * 26) * 0.35 * (a - 0.6) * 2.5
        : Math.sin(e.time * 3) > 0.97
          ? Math.sin(e.time * 30) * 0.25
          : 0));
  let u = 0.95 + 0.08 * Math.sin(e.time * 3);
  (e.orbitals.push(n.x, n.y, n.z, u * 1.15, 16777215, I.PixEgg, n.wob, 0.04),
    e.orbitalsGlow.push(
      n.x,
      n.y,
      n.z,
      u * 1.7,
      a >= 0.8 ? 16773242 : 16774358,
      I.Soft,
      0,
      0.15,
      0.1 + 0.2 * a,
    ),
    a > 0.6 &&
      Math.random() < t * 8 * a &&
      e.vfx.add.spawn({
        x: n.x + F.range(-0.4, 0.4),
        y: n.y + F.range(-0.3, 0.5),
        z: n.z + F.range(-0.4, 0.4),
        life: 0.35,
        size: 0.3,
        endSize: 0,
        color: 16777215,
        shape: I.Twinkle,
        glow: 0.8,
      }),
    a >= 1 && e.state === `play` && yf(e));
}
function yf(e) {
  let t = e.egg;
  ((e.egg = null),
    e.stats.eggs++,
    e.vfx.flash(t.x, t.y, t.z, 16777215, 8, 0.3),
    e.vfx.ring(t.x, t.y - 1.8, t.z, 4, 16773242, 0.5, 0.4),
    e.vfx.burst(t.x, t.y, t.z, 16774358, 22, 7, I.Shard, 0.5, 0.6, 8),
    e.vfx.burst(t.x, t.y, t.z, 7000154, 12, 6, I.Square, 0.4, 0.6, 8),
    e.vfx.burst(t.x, t.y + 0.4, t.z, 16765498, 16, 5, I.Star, 0.5, 0.5),
    e.audio.levelUp());
  let n = e.player.pos,
    r = k.get(t.species).name;
  (e.ui.banner(c(`¡El Huevo ha eclosionado!`), c(`Ha salido {name}`, { name: r }), `#6ad05a`, {
    species: t.species,
  }),
    e.later(0.5, () =>
      e.allies.recruit(
        t.species,
        n.x + 1.5,
        n.y,
        n.z + 1.5,
        (t) => {
          t || e.rollChestItem(!1, 2);
        },
        c(`{name} se despide y te deja un regalo`, { name: r }),
      ),
    ));
}
var bf = CrowdGrid,
  xf = 2200,
  Sf = 50,
  R = (function (e) {
    return (
      (e[(e.Elite = 1)] = `Elite`),
      (e[(e.Alpha = 2)] = `Alpha`),
      (e[(e.Boss = 4)] = `Boss`),
      (e[(e.Ranged = 8)] = `Ranged`),
      (e[(e.Flying = 16)] = `Flying`),
      (e[(e.Healer = 32)] = `Healer`),
      (e[(e.Shielder = 64)] = `Shielder`),
      (e[(e.Capture = 128)] = `Capture`),
      (e[(e.Charger = 256)] = `Charger`),
      (e[(e.Swarm = 512)] = `Swarm`),
      (e[(e.Stampede = 1024)] = `Stampede`),
      (e[(e.Shiny = 2048)] = `Shiny`),
      (e[(e.Totem = 4096)] = `Totem`),
      (e[(e.Summoner = 8192)] = `Summoner`),
      (e[(e.Treasure = 16384)] = `Treasure`),
      (e[(e.Object = 32768)] = `Object`),
      (e[(e.Remote = 65536)] = `Remote`),
      (e[(e.Classic = 131072)] = `Classic`),
      e
    );
  })({}),
  Cf = 12290,
  wf = 62598,
  Tf = (e) => (e.stage === 1 && !e.endless ? 0.15 : 0.25);
function Ef(e, t) {
  let n = e.enemies;
  if (t < 0 || t >= n.n) return { kind: `other`, species: 0 };
  let r = n.flags[t];
  return {
    kind:
      r & 4
        ? e.boss.kit
          ? `legendary`
          : `boss`
        : r & 2
          ? `alpha`
          : r & 4096
            ? `totem`
            : r & 8192
              ? `summoner`
              : r & 1
                ? `elite`
                : r & 512
                  ? `swarm`
                  : r & 1024
                    ? `stampede`
                    : `common`,
    species: n.species[t],
  };
}
var Df = 0.4,
  Of = 0.6,
  kf = 0.6,
  Af = 0.08,
  jf = new Set([35, 36, 113, 242, 301, 440, 531, 594, 700, 764, 856, 857, 858]),
  Mf = new Set([11, 14, 90, 91, 95, 213, 436, 437, 703, 304, 305, 306, 374, 375, 376]),
  Nf = 26,
  Pf = class {
    run;
    n = 0;
    firstAlive = 0;
    alive = new Uint8Array(xf);
    species = new Int32Array(xf);
    x = new Float32Array(xf);
    y = new Float32Array(xf);
    z = new Float32Array(xf);
    vx = new Float32Array(xf);
    vz = new Float32Array(xf);
    vy = new Float32Array(xf);
    air = new Uint8Array(xf);
    kx = new Float32Array(xf);
    kz = new Float32Array(xf);
    capRate = new Float32Array(xf);
    capBank = new Float32Array(xf);
    capT = new Float32Array(xf);
    hp = new Float64Array(xf);
    maxHp = new Float64Array(xf);
    shield = new Float64Array(xf);
    speed = new Float32Array(xf);
    dmg = new Float32Array(xf);
    radius = new Float32Array(xf);
    scale = new Float32Array(xf);
    hgt = new Float32Array(xf);
    flags = new Int32Array(xf);
    t1 = new Uint8Array(xf);
    t2 = new Uint8Array(xf);
    xp = new Float32Array(xf);
    flash = new Float32Array(xf);
    squash = new Float32Array(xf);
    anim = new Float32Array(xf);
    atk = new Float32Array(xf);
    atkAnim = new Float32Array(xf);
    dying = new Float32Array(xf);
    fx = new Float32Array(xf);
    fz = new Float32Array(xf);
    burn = new Float32Array(xf);
    burnDps = new Float32Array(xf);
    poison = new Float32Array(xf);
    poisonStacks = new Uint8Array(xf);
    poisonDps = new Float32Array(xf);
    para = new Float32Array(xf);
    stun = new Float32Array(xf);
    chill = new Uint8Array(xf);
    chillT = new Float32Array(xf);
    frozen = new Float32Array(xf);
    wet = new Float32Array(xf);
    sleep = new Float32Array(xf);
    confuse = new Float32Array(xf);
    curse = new Float32Array(xf);
    healBlock = new Float32Array(xf);
    charm = new Float32Array(xf);
    root = new Float32Array(xf);
    pull = new Float32Array(xf);
    hazSlow = new Float32Array(xf).fill(1);
    alt = new Float32Array(xf);
    lastHitBy = new Int32Array(xf);
    counted = new Uint8Array(xf);
    veil = new Uint8Array(xf);
    sized = new Uint8Array(xf);
    supportT = new Float32Array(xf);
    knockAt = new Float32Array(xf);
    flinchAt = new Float32Array(xf);
    ccT = new Float32Array(xf);
    ccImmune = new Float32Array(xf);
    aidAt = new Float32Array(xf);
    gen = new Uint32Array(xf);
    grid = new bf(xf, 3);
    free = [];
    count = 0;
    remotes = 0;
    wt = new Float32Array(xf);
    mass = 0;
    hordeCarry = 0;
    lastHorde = -1;
    typeIdx = new Map();
    dirX = new Float32Array(xf);
    dirZ = new Float32Array(xf);
    sepX = new Float32Array(xf);
    sepZ = new Float32Array(xf);
    sepOdd = 0;
    lodDt = new Float32Array(xf);
    propSide = new Int8Array(xf);
    deskNavUntil = new Float32Array(xf);
    deskNavActive = new Uint8Array(xf);
    deskNavX = new Float32Array(xf);
    deskNavZ = new Float32Array(xf);
    propPosition = {x:0, z:0, side:0};
    lodFrame = 0;
    gnd = new Float32Array(xf);
    constructor(e) {
      ((this.run = e), k.types?.types.forEach((e, t) => this.typeIdx.set(e, t + 1)));
      this.lookupTypes=createActorTypeLookup(k.types?.types);
    }
    hasType(e, t) {
      let n = k.types?.types;
      return (
        !!n && ((this.t1[e] > 0 && n[this.t1[e] - 1] === t) || (this.t2[e] > 0 && n[this.t2[e] - 1] === t))
      );
    }
    typesOf(e) {
      return this.lookupTypes(this.t1[e],this.t2[e]);
    }
    glyphWords = new Array(2200);
    spawn(e, t, n, r, i, a = 0, o = 1, waveSlots = 0) {
      if (this.run.dragonDuel && !(a & R.Object)) return -1;
      if(!allowOrdinarySpawn(this.run,a,waveSlots))return -1;
      if (a & 1536) {
        let e = this.run;
        if (this.mass >= e.maxEnemies + 200) return -1;
        if (e.coop) {
          if (this.count >= e.enemyCap + 200) return -1;
        } else if (this.count >= e.enemyCap) {
          if (((this.hordeCarry += o), this.hordeCarry < (e.director?.hordeWeight ?? 2))) return -1;
          if (((o = this.hordeCarry), (this.hordeCarry = 0), this.count >= e.enemyCap + Sf))
            return (
              this.isAlive(this.lastHorde) &&
                this.flags[this.lastHorde] & 1536 &&
                this.addWeight(this.lastHorde, o),
              -1
            );
        }
      }
      const captureCandidate = !!(a & R.Capture) && !!(a & (R.Shiny | R.Classic)) &&
        !this.run.captureEncounter && e === this.run.captureTarget;
      if ((a & R.Capture) && !captureCandidate) return -1;
      const word = captureCandidate ? glyphWordForSpecies(e) : enemyWord(e,a);
      let c = k.get(e),
        l = this.run.sprites.get(e, false, word),
        u = a & 1,
        d = a & 2,
        f = a & 4,
        p = a & 4096,
        m = a & 8192,
        h = f ? 2.6 : p ? 2.2 : d ? 2 : m ? 1.9 : u ? 1.35 : 1;
      a & 128 && (h = 1.25);
      // Glyph textures can finish loading after spawn. Their authored collision
      // dimensions are already available during placement.
      const measured=!!actorMetrics[e] || l.ready;
      const width=measured ? l.bodyWidth(h) : 1.4*h;
      const radius=Math.max(.45,Math.min(4,width*.42));
      const terrain=this.run.terrain;
      if(terrain.placeSpawn && !(a & (R.Object | R.Remote))){
        if(!terrain.placeSpawn(t,n,radius,this.propPosition))return -1;
        t=this.propPosition.x;n=this.propPosition.z;
      }
      let s;
      if (this.free.length) s = this.free.pop();
      else if (this.n < 2200) s = this.n++;
      else return -1;
      this.glyphWords[s]=word;
      if (captureCandidate) {
        this.run.captureEncounter = {index:s, generation:(this.gen[s]+1) >>> 0, stage:this.run.stage};
      }
      let g = c.stats,
        _ = (12 + c.bst * 0.055) * r * ENEMY_HEALTH_SCALE,
        v = a & 28806 ? 1 : (this.run.director?.toughness() ?? 1);
      ((_ *= v * o),
        u && (_ *= 4.5),
        d && (_ *= 22),
        f && (_ *= 70),
        p && (_ *= 30),
        m && (_ *= 14),
        a & 16384 && (_ *= 9),
        (this.alive[s] = 1),
        (this.firstAlive = Math.min(this.firstAlive,s)),
        this.gen[s]++,
        (this.species[s] = e),
        (this.x[s] = t),
        (this.z[s] = n),
        (this.y[s] = this.run.terrain.height(t, n)),
        (this.vx[s] = this.vz[s] = this.vy[s] = this.kx[s] = this.kz[s] = 0),
        (this.air[s] = 0),
        (this.dirX[s] = this.dirZ[s] = 0),
        (this.sepX[s] = this.sepZ[s] = 0),
        (this.lodDt[s] = 0),
        (this.gnd[s] = NaN),
        (this.hp[s] = this.maxHp[s] = _),
        (this.shield[s] = 0),
        (this.capRate[s] = 0));
      let y = c.weight > 2500 ? 0.8 : 1;
      ((this.speed[s] =
        Math.min(6.2, (3 + g.spe / 55) * y) *
        (f ? 0.85 : d || p ? 0.9 : 1) *
        this.run.diff.enemySpeed *
        (this.run.director?.speedMult() ?? 1)),
        (this.dmg[s] =
          (5 + g.atk / 16 + g.spa / 24) * i * (f ? 2.2 : d ? 1.8 : p ? 1.6 : m ? 1.2 : u ? 1.4 : 1)),
        (this.scale[s] = h));
      let x = measured ? l.bodyHeight(h) : 1.6 * h;
      ((this.radius[s] = radius),
        (this.hgt[s] = Math.max(0.8, x)),
        (this.sized[s] = +measured));
      let S = a;
      this.propSide[s] = 0;
      this.deskNavUntil[s] = this.deskNavActive[s] = 0;
      if (!(a & 32768)) {
        const pos = this.run.terrain.resolve(t, n, this.radius[s], this.y[s], this.propPosition);
        this.x[s] = pos.x;
        this.z[s] = pos.z;
        this.y[s] = this.run.terrain.height(pos.x, pos.z);
      }
      return (
        (c.types.includes(`flying`) || c.abilities.includes(Nf)) && (S |= 16),
        g.spa > g.atk * 1.15 && g.spa >= 60 && !(S & 1024) && (S |= 8),
        g.spe >= 95 && g.atk >= g.spa && !(S & 8) && (S |= 256),
        jf.has(e) && (S |= 32),
        Mf.has(e) && (S |= 64),
        (this.flags[s] = S),
        (this.t1[s] = this.typeIdx.get(c.types[0]) ?? 0),
        (this.t2[s] = c.types[1] ? (this.typeIdx.get(c.types[1]) ?? 0) : 0),
        (this.xp[s] =
          (1 + c.bst / 300) * (1 + (v - 1) * 0.35) * (f ? 60 : p ? 35 : d ? 25 : m ? 20 : u ? 6 : 1) * o),
        (this.wt[s] = o),
        (this.flash[s] = 0),
        (this.squash[s] = 0),
        (this.anim[s] = F.range(0, 5)),
        (this.atk[s] = F.range(1, 3)),
        (this.atkAnim[s] = 0),
        (this.dying[s] = 0),
        (this.fx[s] = 0),
        (this.fz[s] = 1),
        (this.burn[s] =
          this.poison[s] =
          this.para[s] =
          this.stun[s] =
          this.frozen[s] =
          this.wet[s] =
          this.sleep[s] =
          this.confuse[s] =
            0),
        (this.curse[s] = this.healBlock[s] = this.charm[s] = this.root[s] = this.pull[s] = 0),
        (this.poisonStacks[s] = 0),
        (this.chill[s] = 0),
        (this.chillT[s] = 0),
        (this.burnDps[s] = 0),
        (this.poisonDps[s] = 0),
        (this.supportT[s] = F.range(1, 4)),
        (this.knockAt[s] = this.flinchAt[s] = -99),
        (this.ccT[s] = this.ccImmune[s] = 0),
        (this.alt[s] = 0),
        (this.aidAt[s] = -99),
        (this.lastHitBy[s] = -1),
        (this.counted[s] = 0),
        (this.veil[s] = 0),
        this.count++,
        (this.mass += o),
        a & 1536 && (this.lastHorde = s),
        s
      );
    }
    addWeight(e, t) {
      let n = (this.wt[e] + t) / this.wt[e];
      ((this.hp[e] *= n), (this.maxHp[e] *= n), (this.xp[e] *= n), (this.wt[e] += t), (this.mass += t));
    }
    kill(e) {
      if (!this.alive[e]) return;
      this.alive[e] = 0;
      if (this.flags[e] & 65536) this.remotes--;
      else { this.count--; this.mass -= this.wt[e]; }
      this.free.push(e);
      if (e === this.firstAlive) {
        while (this.firstAlive < this.n && !this.alive[this.firstAlive]) this.firstAlive++;
      }
    }
    spawnProxy(e, t, n, r, i, a, word = enemySpeciesWord(e,i)) {
      if (this.run.dragonDuel) return -1;
      let o;
      if (this.free.length) o = this.free.pop();
      else if (this.n < 2200) o = this.n++;
      else return -1;
      this.glyphWords[o] = word;
      let s = k.get(e),
        c = this.run.sprites.get(e,false,word);
      return (
        (this.alive[o] = 1),
        (this.firstAlive = Math.min(this.firstAlive,o)),
        this.gen[o]++,
        (this.species[o] = e),
        (this.x[o] = t),
        (this.y[o] = n),
        (this.z[o] = r),
        (this.vx[o] = this.vz[o] = this.vy[o] = this.kx[o] = this.kz[o] = 0),
        (this.air[o] = 0),
        (this.dirX[o] = this.dirZ[o] = 0),
        (this.sepX[o] = this.sepZ[o] = 0),
        (this.lodDt[o] = 0),
        (this.gnd[o] = NaN),
        (this.hp[o] = this.maxHp[o] = 1),
        (this.shield[o] = 0),
        (this.capRate[o] = 0),
        (this.speed[o] = 0),
        (this.dmg[o] = 0),
        (this.scale[o] = a > 0 ? a : 1),
        (this.radius[o] = Math.max(
          0.45,
          Math.min(4, (c.ready ? c.bodyWidth(this.scale[o]) : 1.4 * this.scale[o]) * 0.42),
        )),
        (this.hgt[o] = Math.max(0.8, c.ready ? c.bodyHeight(this.scale[o]) : 1.6 * this.scale[o])),
        (this.sized[o] = +!!c.ready),
        (this.flags[o] = i | 65536),
        (this.t1[o] = this.typeIdx.get(s.types[0]) ?? 0),
        (this.t2[o] = s.types[1] ? (this.typeIdx.get(s.types[1]) ?? 0) : 0),
        (this.xp[o] = 0),
        (this.flash[o] = 0),
        (this.squash[o] = 0),
        (this.anim[o] = F.range(0, 5)),
        (this.atk[o] = 0),
        (this.atkAnim[o] = 0),
        (this.dying[o] = 0),
        (this.fx[o] = 0),
        (this.fz[o] = 1),
        (this.burn[o] =
          this.poison[o] =
          this.para[o] =
          this.stun[o] =
          this.frozen[o] =
          this.wet[o] =
          this.sleep[o] =
          this.confuse[o] =
            0),
        (this.curse[o] = this.healBlock[o] = this.charm[o] = this.root[o] = this.pull[o] = 0),
        (this.poisonStacks[o] = 0),
        (this.chill[o] = 0),
        (this.chillT[o] = 0),
        (this.burnDps[o] = 0),
        (this.poisonDps[o] = 0),
        (this.supportT[o] = 99),
        (this.knockAt[o] = this.flinchAt[o] = -99),
        (this.ccT[o] = this.ccImmune[o] = 0),
        (this.alt[o] = 0),
        (this.aidAt[o] = -99),
        (this.lastHitBy[o] = -1),
        (this.counted[o] = 0),
        (this.veil[o] = 0),
        (this.wt[o] = 1),
        this.remotes++,
        o
      );
    }
    isAlive(e) {
      return e >= 0 && this.alive[e] === 1 && this.dying[e] <= 0;
    }
    update(e) {
      let t = this.run,
        n = t.player,
        r = t.terrain,
        i = t.coop,
        a = n.pos.x,
        o = n.pos.z,
        s = n.pos.y,
        l = i ? i.targets : null,
        u = l ? l.length : 0;
      r.steerDeskEnemy?.advance();
      this.grid.build(this.n, this.x, this.z, this.alive, this.radius, this.dying, this.firstAlive);
      let d = this.grid,
        f = (this.sepOdd ^= 1),
        p = ++this.lodFrame;
      const proxySquashDecay = this.remotes || t.coop?.monsters ? Math.exp(-e * 10) : 1;
      const warmth = t.mapEvents?.bliz && t.mapEvents.speech;
      for (let i = this.firstAlive; i < this.n; i++) {
        if (!this.alive[i]) continue;
        if (this.dying[i] > 0) {
          ((this.dying[i] -= e), this.dying[i] <= 0 && this.kill(i));
          continue;
        }
        if(t.coop?.monsters && (this.flags[i]&R.Object)){
          t.combat.tickStatus(i,e);
          continue;
        }
        if(t.coop?.monsters && (this.flags[i]&R.Boss) && t.coop.isBossMirror(i)){
          t.coop.monsters.updateBoss(i,e);
          continue;
        }
        if (t.coop?.monsters && roomMonster(this.flags[i])) {
          t.combat.tickStatus(i,e);
          if(this.isAlive(i) && !this.parked(i)) {
            if(this.flags[i]&12292)this.canMoveAfterControl(i,e);
            t.coop.monsters.place(i,e);
            this.flash[i]=Math.max(0,this.flash[i]-e*6);
            this.squash[i]*=proxySquashDecay;
            this.atkAnim[i]=Math.max(0,this.atkAnim[i]-e);
            this.proxyContact(i,a,s,o);
          }
          continue;
        }
        if (this.flags[i] & 65536) {
          this.updateProxy(i, e, a, s, o, proxySquashDecay);
          continue;
        }
        let m = this.lodDt[i] + e,
          h = !1,
          g = a,
          _ = o,
          targetSlot = 0;
        const seekingWarmth = warmth && i === warmth.speaker && this.gen[i] === warmth.generation;
        if (!seekingWarmth && u > 2) {
          let e = 1 / 0;
          for (let t = 0; t < u; t += 2) {
            let n = (l[t] - this.x[i]) ** 2 + (l[t + 1] - this.z[i]) ** 2;
            n < e && ((e = n), (g = l[t]), (_ = l[t + 1]), (targetSlot=t/2));
          }
        } else !seekingWarmth && u === 2 && ((g = l[0]), (_ = l[1]));
        let v = g !== a || _ !== o;
        if (!(this.flags[i] & wf)) {
          let e = this.x[i] - g,
            t = this.z[i] - _,
            n = e * e + t * t,
            r = crowdStep(n,this.radius[i],this.count,this.run.performance);
          if (((h = r > 1), h && (i + p) % r !== 0 && m < Af)) {
            this.lodDt[i] = m;
            continue;
          }
        }
        ((this.lodDt[i] = 0),
          (this.flash[i] = Math.max(0, this.flash[i] - m * 6)),
          (this.squash[i] *= Math.exp(-m * 10)),
          (this.atkAnim[i] = Math.max(0, this.atkAnim[i] - m)));
        let y = this.flags[i];
        if (
          ((!Number.isFinite(this.x[i]) || !Number.isFinite(this.z[i]) || !Number.isFinite(this.y[i])) &&
            ((this.x[i] = a + 30),
            (this.z[i] = o),
            (this.y[i] = r.height(this.x[i], this.z[i])),
            (this.vx[i] = this.vz[i] = this.vy[i] = this.kx[i] = this.kz[i] = 0)),
          !this.sized[i])
        ) {
          let e = t.sprites.get(this.species[i], false, this.glyphWords[i]);
          e.ready &&
            ((this.sized[i] = 1),
            (this.radius[i] = Math.max(0.45, Math.min(4, e.bodyWidth(this.scale[i]) * 0.42))),
            (this.hgt[i] = Math.max(0.8, e.bodyHeight(this.scale[i]))));
        }
        if ((t.combat.tickStatus(i, m), !this.alive[i] || this.dying[i] > 0)) continue;
        if (y & 32768) {
          this.vx[i] = this.vz[i] = this.kx[i] = this.kz[i] = 0;
          continue;
        }
        let b = this.speed[i], x = this.canMoveAfterControl(i,m);
        (
          this.para[i] > 0 && (b *= 0.5),
          this.root[i] > 0 && (b *= 0.35),
          this.chill[i] > 0 && (b *= 1 - this.chill[i] * 0.15),
          this.hazSlow[i] < 1 && ((b *= this.hazSlow[i]), (this.hazSlow[i] = 1)));
        let S = 0,
          C = NaN;
        if (!(y & 32788)) {
          if(r.hasWater){
            let e = r.waterAt(this.x[i], this.z[i]),
              n = r.height(this.x[i], this.z[i]);
            if (n < e) {
              if (r.frozen) S = +!this.hasType(i, `ice`);
              else if (n < e - 0.55) {
                let n = this.hasType(i, `water`);
                ((b *= n ? 1.2 : 0.6),
                  (C = e - (n ? 0.2 : Math.min(0.6, this.hgt[i] * 0.3))),
                  Math.random() < m * 2.5 &&
                    (this.vx[i] !== 0 || this.vz[i] !== 0) &&
                    t.vfx.ring(this.x[i], e + 0.03, this.z[i], this.radius[i] + 0.6, 9099519, 0.5, 0.35));
              }
            }
          }
          let a = t.sanctuary?.slipAt(this.x[i], this.z[i]) ?? 0;
          a > S && !this.hasType(i, `ice`) && (S = a);
        }
        let w = g - this.x[i],
          E = _ - this.z[i],
          ee = Math.sqrt(w * w + E * E) || 1;
        ((w /= ee), (E /= ee));
        let D = v ? Math.hypot(a - this.x[i], o - this.z[i]) || 1 : ee,
          O = w,
          te = E;
        if (y & 4 && t.boss.kit && i === t.boss.bossIndex) {
          let e = t.boss.kit.steer(m);
          ((O = e.x), (te = e.z), (b *= e.speed / Math.max(0.1, this.speed[i])));
        } else if (y & 4 && i === t.boss.bossIndex && t.boss.hold > 0) b = 0;
        else if (y & (R.Totem | R.Summoner) && t.minibosses.get(i)?.windupUntil > t.time) b = 0;
        else if (y & 1024) ((O = this.dirX[i]), (te = this.dirZ[i]), (b *= 1.9));
        else if (this.confuse[i] > 0) {
          let e = this.anim[i] * 2.3;
          ((O = Math.cos(e)), (te = Math.sin(e)));
        } else if (y & 128) ((O = -w), (te = -E), D > 22 && ((O = E), (te = -w)), (b *= 0.85));
        else if (y & 16384) {
          let e = Math.sin(this.anim[i] * 1.7) * 0.8;
          ((O = -w + E * e), (te = -E - w * e), D > 18 && ((O = E), (te = -w)));
        }
        if (y & 16512) {
          let e = r.play - 10,
            t = Math.abs(this.x[i]) - e,
            n = Math.abs(this.z[i]) - e;
          (t > 0 && (O -= Math.sign(this.x[i]) * Math.min(2, t / 3)),
            n > 0 && (te -= Math.sign(this.z[i]) * Math.min(2, n / 3)));
          let a = Math.hypot(O, te) || 1;
          ((O /= a), (te /= a));
        } else if (y & 8) D < 8 ? ((O = -w), (te = -E)) : D < 13 && ((O = E * 0.6), (te = -w * 0.6));
        else if (y & 256) {
          let e = this.atk[i];
          e > Of && e <= 1
            ? (this.dirX[i] === 0 &&
                this.dirZ[i] === 0 &&
                D < 14 &&
                ((this.dirX[i] = w),
                (this.dirZ[i] = E),
                (this.atkAnim[i] = Df),
                (this.squash[i] = 0.4),
                t.vfx.dust(this.x[i], this.y[i], this.z[i], 13154456, 6, 2.5)),
              (this.dirX[i] !== 0 || this.dirZ[i] !== 0) && (b *= 0.15))
            : e > 0 && e <= Of && (this.dirX[i] !== 0 || this.dirZ[i] !== 0)
              ? ((O = this.dirX[i]), (te = this.dirZ[i]), (b *= 2.4))
              : e <= 0 && (this.dirX[i] !== 0 || this.dirZ[i] !== 0) && (b *= 0.6);
        }
        if (seekingWarmth) { O = w; te = E; }
        if(x && O===w && te===E && r.steerDeskEnemy){
          if(t.time>=this.deskNavUntil[i]){
            const interval=this.count>=100 && ee>24 ? .48 : .18;
            this.deskNavUntil[i]=t.time+interval+(i%5)*.015;
            this.deskNavActive[i]=+r.steerDeskEnemy(this.x[i],this.z[i],g,_,this.radius[i],this.propPosition,targetSlot);
            this.deskNavX[i]=this.propPosition.x;this.deskNavZ[i]=this.propPosition.z;
          }
          if(this.deskNavActive[i]){O=this.deskNavX[i];te=this.deskNavZ[i];}
        }else{
          this.deskNavUntil[i]=0;
        }
        let ne = this.radius[i];
        (h || (i & 1) === f) &&
          (d.separate(i, this.x[i], this.z[i], ne, y & wf ? Infinity : separationBudget(this.count,this.run.performance.enemySeparation)), (this.sepX[i] = d.sepX), (this.sepZ[i] = d.sepZ));
        let re = this.sepX[i],
          ie = this.sepZ[i],
          ae = S > 0 ? 10 - 8.4 * S : 10;
        (x
          ? ((this.vx[i] += (O * b - this.vx[i]) * Math.min(1, ae * m)),
            (this.vz[i] += (te * b - this.vz[i]) * Math.min(1, ae * m)))
          : ((this.vx[i] *= 0.8), (this.vz[i] *= 0.8)),
          this.pull[i] > 0 && (this.pull[i] -= m));
        let oe = Math.exp(-m * (S > 0 ? 7 - 5 * S : 7));
        (S > 0 &&
          Math.abs(this.vx[i]) + Math.abs(this.vz[i]) + Math.abs(this.kx[i]) + Math.abs(this.kz[i]) > 4 &&
          Math.random() < m * 4 &&
          t.vfx.burst(this.x[i], this.y[i] + 0.1, this.z[i], 16777215, 2, 2.5, I.Square, 0.15, 0.4, 14),
          (this.kx[i] *= oe),
          (this.kz[i] *= oe));
        let se = y & 8192 ? 0 : 6,
          ce = this.x[i],
          le = this.z[i],
          ue = this.x[i] + (this.vx[i] + this.kx[i] + re * se) * m,
          de = this.z[i] + (this.vz[i] + this.kz[i] + ie * se) * m;
        if (r.arenaR < 1 / 0) {
          let e = Math.min(r.arenaR - 0.5, r.ringR - 1.5),
            t = Math.hypot(ue, de);
          t > e && ((ue *= e / t), (de *= e / t));
        }
        let fe = y & 16512 ? r.play - 4 : r.walkLim;
        if (y & 1024 && (Math.abs(ue) > fe || Math.abs(de) > fe)) {
          this.dying[i] = 0.35;
          continue;
        }
        if (
          ((this.x[i] = Math.max(-fe, Math.min(fe, ue))),
          (this.z[i] = Math.max(-(r.deskBounds?.z-2||fe), Math.min(r.deskBounds?.z-2||fe, de))),
          r.solidBoxes.length &&
            r.inSolid(this.x[i], this.z[i]) &&
            (r.inSolid(this.x[i], le)
              ? r.inSolid(ce, this.z[i])
                ? ((this.x[i] = ce), (this.z[i] = le))
                : (this.x[i] = ce)
              : (this.z[i] = le),
            r.inSolid(this.x[i], this.z[i])))
        ) {
          let e = Math.sign(this.x[i]) || 1;
          ((this.x[i] = e * 4), (this.z[i] *= 0.8));
        }
        const steerDistance = x && !(y & 1024) ? Math.hypot(O, te) * b * m : 0;
        this.moveAcrossProps(i,ce,le,this.x[i],this.z[i],m,x,steerDistance);
        if (x && Math.abs(this.vx[i]) + Math.abs(this.vz[i]) > 0.2) {
          let e = Math.sqrt(this.vx[i] * this.vx[i] + this.vz[i] * this.vz[i]);
          ((this.fx[i] = this.vx[i] / e), (this.fz[i] = this.vz[i] / e), (this.anim[i] += m * (0.6 + b / 4)));
        }
        const ground = this.floorAt(i);
        if ((y & 8 && D < 18 && ((this.fx[i] = w), (this.fz[i] = E)), (y & 16) && !this.air[i])) {
          let e =
            (this.gnd[i] = ground) +
            1.1 +
            Math.max(0, this.scale[i] - 1) * 0.55 +
            this.alt[i] +
            Math.sin(this.anim[i] * 2) * 0.2 * this.scale[i];
          this.y[i] += (e - this.y[i]) * Math.min(1, m * (this.alt[i] > 0 ? 3 : 6));
        } else {
          let e = Number.isNaN(C) ? (this.gnd[i] = ground) : C;
          (Number.isNaN(C) || (this.gnd[i] = NaN),
            this.air[i]
              ? ((this.vy[i] -= 30 * m),
                (this.y[i] += this.vy[i] * m),
                this.vy[i] <= 0 &&
                  this.y[i] <= e &&
                  ((this.y[i] = e), (this.vy[i] = 0), (this.air[i] = 0), (this.squash[i] = 0.5)))
              : e > this.y[i] + 0.45
                ? ((this.vy[i] = Math.sqrt(60 * (e - this.y[i] + 0.9))),
                  (this.air[i] = 1),
                  (this.squash[i] = -0.5))
                : e < this.y[i] - 0.6
                  ? ((this.air[i] = 1), (this.vy[i] = 0))
                  : (this.y[i] = e));
        }
        if (!(y & 16512)) {
          let e = this.x[i] - a,
            t = this.z[i] - o,
            c = (ne + n.radius) * 0.8,
            l = e * e + t * t;
          if (l < c * c && s < this.y[i] + this.hgt[i] * 0.8 && s > this.y[i] - 1) {
            let a = Math.sqrt(l),
              o = a > 0.001 ? e / a : -this.fx[i],
              s = a > 0.001 ? t / a : -this.fz[i],
              u = c - a,
              d = y & 8196 ? 1e3 : ne * ne,
              f = d / (d + kf),
              p = this.x[i] + o * u * (1 - f),
              m = this.z[i] + s * u * (1 - f);
            if (r.inBounds(p, m, 3)) {
              const pushed = moveEnemyPastProps(r, this.x[i], this.z[i], p, m, ne, this.y[i], 0, 0, this.propPosition);
              this.x[i] = pushed.x;
              this.z[i] = pushed.z;
            }
            ((n.crowdX -= o * u * f),
              (n.crowdZ -= s * u * f));
          }
        }
        this.atk[i] -= m;
        let pe = y & 12294;
        (!x && y & 4 && i === t.boss.bossIndex && t.boss.kit?.idle(m),
          x &&
            (this.charm[i] <= 0 || pe) &&
            !(y & 16512) &&
            (y & 4
              ? t.boss.update(i, m, D)
              : y & 12288
                ? t.minibosses.act(i, m, D)
                : y & 8 && this.atk[i] <= 0 && D < 18
                  ? r.lineClear(this.x[i], this.y[i] + this.hgt[i] * 0.6, this.z[i], a, s + 0.8, o)
                    ? ((this.atk[i] = 3 + F.range(0, 1.8)),
                      (this.atkAnim[i] = 0.4),
                      t.projectiles.enemyShot(i, a, s + 0.8, o))
                    : (this.atk[i] = 0.4)
                  : y & 256 &&
                    this.atk[i] <= -1.2 &&
                    ((this.atk[i] = 2.5 + F.range(0, 2)), (this.dirX[i] = this.dirZ[i] = 0))),
          y & 96 &&
            x &&
            ((this.supportT[i] -= m),
            this.supportT[i] <= 0 && ((this.supportT[i] = 4.5), t.combat.enemySupport(i))));
        let me = ne + n.radius;
        if (!(y & 16512) && D < me && Math.abs(this.y[i] - s) < this.hgt[i] + 0.8 && x) {
          let e = y & 2 ? Tf(t) : pe ? 0.25 : 0;
          n.hurt(
            this.dmg[i] * (this.charm[i] > 0 ? 0.6 : 1),
            this.typesOf(i)[0],
            i,
            NaN,
            NaN,
            !1,
            e,
            i,
            y & 4 ? { floor: 0.05 } : {ordinaryContact: !(y & (SPECIAL_ACTORS | R.Elite))},
          ) && this.pushOnContact(i);
        }
      }
    }
    canMoveAfterControl(id,dt){
      const controlled=this.frozen[id]>0 || this.sleep[id]>0 || this.stun[id]>0;
      if(!(this.flags[id]&12292))return !controlled;
      if(this.ccImmune[id]>0){
        this.ccImmune[id]-=dt;
      }else if(!controlled){
        this.ccT[id]=Math.max(0,this.ccT[id]-dt*.5);
        return true;
      }else{
        this.ccT[id]+=dt;
        if(this.ccT[id]<2)return false;
        this.ccT[id]=0;this.ccImmune[id]=5;
        this.run.ui.popup(this.x[id],this.y[id]+this.hgt[id]+1.2,this.z[id],c(`¡Se libera!`),`#ffd23a`,.9);
        this.run.vfx.ring(this.x[id],this.y[id],this.z[id],4,16765498,.4);
      }
      this.frozen[id]=this.sleep[id]=this.stun[id]=this.chill[id]=0;
      return true;
    }
    floorAt(id,ceiling=this.y[id]+.0001) {
      const terrain=this.run.terrain,x=this.x[id],z=this.z[id];
      return Math.max(terrain.surface(x,z),terrain.propTop(x,z,this.radius[id],ceiling));
    }
    moveAcrossProps(id,fromX,fromZ,x,z,dt,canJump,steerDistance=0) {
      const feet=this.y[id];
      const pos=moveEnemyPastProps(this.run.terrain,fromX,fromZ,x,z,this.radius[id],feet,
        steerDistance,this.propSide[id],this.propPosition,canJump);
      this.x[id]=pos.x;
      this.z[id]=pos.z;
      this.propSide[id]=pos.side;
      if(!this.air[id] && pos.jumpTop>feet){
        this.vy[id]=obstacleJumpSpeed(pos.jumpTop-feet,0,30,dt);
        this.air[id]=1;
        this.squash[id]=-.5;
      }
    }
    updateProxy(e, t, n, r, i, squashDecay) {
      let a = this.run,
        o = a.player;
      if (
        ((this.flash[e] = Math.max(0, this.flash[e] - t * 6)),
        (this.squash[e] *= squashDecay),
        (this.atkAnim[e] = Math.max(0, this.atkAnim[e] - t)),
        !this.sized[e])
      ) {
        let t = a.sprites.get(this.species[e], false, this.glyphWords[e]);
        t.ready &&
          ((this.sized[e] = 1),
          (this.radius[e] = Math.max(0.45, Math.min(4, t.bodyWidth(this.scale[e]) * 0.42))),
          (this.hgt[e] = Math.max(0.8, t.bodyHeight(this.scale[e]))));
      }
      if(a.coop?.monsters?.ownsProxy(e)){
        a.coop.monsters.place(e,t);
        this.proxyContact(e,n,r,i);
        return;
      }
      (a.coop?.placeProxy(e),
        (this.burn[e] -= t),
        (this.poison[e] -= t),
        (this.para[e] -= t),
        (this.frozen[e] -= t),
        (this.sleep[e] -= t),
        (this.wet[e] -= t),
        (this.curse[e] -= t),
        (this.stun[e] -= t),
        (this.root[e] -= t),
        (this.charm[e] -= t),
        (this.confuse[e] -= t));
      this.proxyContact(e,n,r,i);
    }
    proxyContact(e,n,r,i){
      const a=this.run,o=a.player;
      let s = this.flags[e],
        c = this.radius[e];
      if (s & 16512) return;
      let l = this.x[e] - n,
        u = this.z[e] - i,
        d = l * l + u * u,
        f = (c + o.radius) * 0.8;
      if (d >= (c + o.radius) ** 2) return;
      if (d < f * f && r < this.y[e] + this.hgt[e] * 0.8 && r > this.y[e] - 1) {
        let t = Math.sqrt(d),
          n = t > 0.001 ? l / t : -this.fx[e],
          r = t > 0.001 ? u / t : -this.fz[e],
          i = f - t,
          a = s & 8196 ? 1e3 : c * c,
          p = a / (a + kf);
        ((o.crowdX -= n * i * p), (o.crowdZ -= r * i * p));
      }
      let p = Math.sqrt(d) || 1,
        m = !(this.frozen[e] > 0 || this.sleep[e] > 0 || this.stun[e] > 0);
      if (p < c + o.radius && Math.abs(this.y[e] - r) < this.hgt[e] + 0.8 && m) {
        let t = s & (Cf|R.Boss),
          n = s & 2 ? Tf(a) : t ? 0.25 : 0;
        o.hurt(
          this.dmg[e] * (this.charm[e] > 0 ? 0.6 : 1),
          this.typesOf(e)[0],
          e,
          NaN,
          NaN,
          !1,
          n,
          e,
          s & R.Boss ? {floor:0.05} : {ordinaryContact: !(s & (SPECIAL_ACTORS | R.Elite))},
        ) && this.pushOnContact(e);
      }
    }
    pushOnContact(id) {
      this.atkAnim[id] = 0.35;
      const player = this.run.player, flags = this.flags[id];
      const dx = player.pos.x - this.x[id], dz = player.pos.z - this.z[id];
      const distance = Math.hypot(dx, dz) || 1;
      const heavy = flags & (Cf | R.Boss);
      if (this.run.terrain.zxPaper && !heavy) {
        // Light contact contributes to crowd resistance on every portrait stage.
        player.crowdX += 0.1 * dx / distance;
        player.crowdZ += 0.1 * dz / distance;
      } else {
        player.shove(dx / distance, dz / distance, heavy ? 9 : 3 + Math.min(4, this.radius[id] * 2.5));
      }
    }
    render() {
      let e = this.run,
        t = e.sprites,
        n = e.focusIdx;
      const speech = e.mapEvents?.speech;
      const trackSpeech = speech?.beginFrame();
      (e.enemyShadowCells??=new Set()).clear();
      for (let r = this.firstAlive; r < this.n; r++) {
        if (!this.alive[r] || this.flags[r] & 32768) continue;
        if (e.dragonHd?.hides(r) || e.dragonHdPending?.id === r) continue;
        let s = this.lodDt[r],
          separation = this.flags[r] & 8192 ? 0 : 6,
          c = this.x[r] + (s > 0 ? (this.vx[r] + this.kx[r] + this.sepX[r]*separation) * s : 0),
          l = this.z[r] + (s > 0 ? (this.vz[r] + this.kz[r] + this.sepZ[r]*separation) * s : 0);
        if (s > 0) {
          const pos = moveEnemyPastProps(e.terrain, this.x[r], this.z[r], c, l, this.radius[r],
            this.y[r], 0, 0, this.propPosition);
          c = pos.x;
          l = pos.z;
        }
        // Cull by the actual camera and body/shadow bounds. A fixed player
        // radius can hide visible enemies on tall screens; old saves no longer
        // decide visibility. Simulation, targeting and warnings run separately.
        if (!t.visible(c, this.y[r] + this.hgt[r] * 0.5, l, 2 + Math.max(this.hgt[r], this.radius[r] * 2.4)))
          continue;
        let u = this.flags[r],
          d = t.get((u & 131072 ? Qc : 0) + this.species[r], false, this.glyphWords[r]),
          f = this.dying[r] > 0,
          p = d.zxGlyph ? 0 : t.dirRow(this.fx[r], this.fz[r]),
          m = `walk`,
          h = this.anim[r],
          g = !1;
        f
          ? ((m = `hurt`), (h = 0.5), (g = !0))
          : this.atkAnim[r] > 0
            ? ((m = `attack`), (h = 1 - this.atkAnim[r] / 0.4), (g = !0))
            : (this.frozen[r] > 0 || this.sleep[r] > 0) && ((m = `idle`), (h = 0));
        let _ =
          u & 131072
            ? 1
            : u & 2048
              ? 5 + Math.min(0.99, Xc(this.species[r]))
              : u & 128
                ? 4
                : u & 4096
                  ? 7
                  : u & 8192
                    ? 0
                    : u & 6
                      ? 2
                      : u & 16384
                        ? 1
                        : 0;
        (u & 2048 &&
          !f &&
          Math.random() < 0.12 &&
          e.vfx.add.spawn({
            x: this.x[r] + F.range(-0.8, 0.8),
            y: this.y[r] + F.range(0.3, this.hgt[r] + 0.4),
            z: this.z[r] + F.range(-0.8, 0.8),
            vy: 0.6,
            life: 0.5,
            size: 0.55,
            endSize: 0,
            color: [16777215, 16773754, 16751328, 10152191][Math.floor(Math.random() * 4)],
            shape: I.Twinkle,
            glow: 1,
            spin: 4,
          }),
          u & 131072 &&
            !f &&
            Math.random() < 0.14 &&
            e.vfx.add.spawn({
              x: this.x[r] + F.range(-0.8, 0.8),
              y: this.y[r] + F.range(0.3, this.hgt[r] + 0.4),
              z: this.z[r] + F.range(-0.8, 0.8),
              vy: 0.7,
              life: 0.55,
              size: 0.6,
              endSize: 0,
              color: [16777215, 16769658, 16763192, 16774328][Math.floor(Math.random() * 4)],
              shape: I.Twinkle,
              glow: 1,
              spin: 3,
            }));
        let v = 1,
          y = 1,
          b = 1,
          x = 0;
        (this.frozen[r] > 0
          ? ((v = 0.6), (y = 0.9), (b = 1.3), (x = 0.8))
          : this.burn[r] > 0
            ? ((v = 1.3), (y = 0.6), (b = 0.4), (x = 0.35 + 0.15 * Math.sin(e.time * 20)))
            : this.poison[r] > 0
              ? ((v = 0.9), (y = 0.5), (b = 1.2), (x = 0.4))
              : this.para[r] > 0
                ? ((v = 1.3), (y = 1.2), (b = 0.3), (x = Math.random() < 0.2 ? 0.7 : 0.15))
                : this.wet[r] > 0
                  ? ((v = 0.6), (y = 0.8), (b = 1.3), (x = 0.25))
                  : this.curse[r] > 0
                    ? ((v = 0.7), (y = 0.5), (b = 1), (x = 0.4))
                    : this.chill[r] > 0 && ((v = 0.8), (y = 1), (b = 1.3), (x = 0.15 * this.chill[r])),
          u & 16384 && ((v = 1.45), (y = 1.15), (b = 0.35), (x = 0.45 + 0.15 * Math.sin(e.time * 9))));
        let S = this.veil[r];
        (S === 1
          ? ((v = 0.16), (y = 0.1), (b = 0.3), (x = 0.93 + 0.05 * Math.sin(e.time * 9 + r)))
          : S === 3 && ((v = 0.75), (y = 1.05), (b = 1.45), (x = 0.55 + 0.15 * Math.sin(e.time * 3 + r))),
          S === 1 &&
            !f &&
            Math.random() < 0.05 &&
            e.vfx.add.spawn({
              x: this.x[r] + F.range(-0.6, 0.6),
              y: this.y[r] + F.range(0.3, this.hgt[r]),
              z: this.z[r] + F.range(-0.6, 0.6),
              vy: 0.5,
              life: 0.8,
              size: 0.6,
              endSize: 0,
              color: 6965928,
              shape: I.Wisp,
              glow: 0.4,
            }));
        let C = f ? 0 : this.flash[r];
        if (C > 0) {
          let e = C * 0.75;
          ((v += (1.5 - v) * e), (y += (0.45 - y) * e), (b += (0.4 - b) * e), (x = Math.max(x, e)));
        }
        n >= 0 && r !== n && ((v *= 0.42), (y *= 0.42), (b *= 0.5), (x = Math.max(x, 0.85)));
        let w = f ? 1 - this.dying[r] / 0.35 : 0;
        let glyphRect=d.zxGlyphRect;
        if(d.zxStrokeFrames){
          const remaining=remainingStrokes(d.zxStrokeFrames.length,this.hp[r],this.maxHp[r]);
          if(!remaining||f)continue;
          glyphRect=d.zxStrokeFrames[remaining-1];
        }
        if (trackSpeech && !f && d.ready && !(u & (R.Object | R.Capture | R.Treasure | R.Boss | R.Alpha | R.Totem | R.Summoner))) {
          speech.observe(r,c,this.y[r]+Math.max(0,this.scale[r]-1.2)*.1+.08,l,d);
        }
        if (
          (d.push(
            c,
            this.y[r] + Math.max(0, this.scale[r] - 1.2) * 0.1,
            l,
            m,
            h,
            p,
            this.scale[r],
            f ? this.flash[r] : 0,
            w,
            _,
            this.squash[r],
            v,
            y,
            b,
            x,
            g,
            0,
            glyphRect,
          ),
          !f && S !== 2 && enemyShadow(e,c,l,!!(u & wf)))
        ) {
          let n = this.gnd[r];
          t.shadows.push(c, Number.isNaN(n) ? e.terrain.surface(c, l) : n, l, this.radius[r] * 2.4);
        }
      }
      speech?.endFrame();
    }
    clear() {
      (this.alive.fill(0),
        (this.n = 0),
        (this.count = 0),
        (this.mass = 0),
        (this.firstAlive = 0),
        (this.remotes = 0),
        (this.free.length = 0));
    }
    parked(e) {
      let t = this.flags[e],
        n = this.run;
      return (
        (!!(t & 2) && n.allies.isDown(e)) ||
        (!!(t & 128) && n.capture.state === `weakened` && n.capture.index === e)
      );
    }
    nearest(e, t, n, r = -1) {
      let i = -1,
        a = n * n,
        o = this.grid.query(e, t, n),
        s = this.grid.result;
      for (let n = 0; n < o; n++) {
        let o = s[n];
        if (o === r || !this.alive[o] || this.dying[o] > 0 || this.parked(o)) continue;
        let c = this.x[o] - e,
          l = this.z[o] - t,
          u = c * c + l * l;
        u < a && ((a = u), (i = o));
      }
      if (i < 0 && n > 40)
        for (let n = 0; n < this.n; n++) {
          if (n === r || !this.alive[n] || this.dying[n] > 0 || this.parked(n)) continue;
          let o = this.x[n] - e,
            s = this.z[n] - t,
            c = o * o + s * s;
          c < a && ((a = c), (i = n));
        }
      return i;
    }
    within(e, t, n, r = []) {
      return this.grid.within(e,t,n,this,r);
    }
  },
  Ff = 11071743,
  If = 6998256,
  Lf = 15223370,
  Rf = 12110048,
  zf = 9099354,
  Bf = 6957706;

export {
  Ff,
  If,
  Lf,
  Rf,
  zf,
  Bf,
  R,
  Tf,
  Ef,
  rf,
  lf,
  xf,
  Cf,
  cf,
  df,
  mf,
  gf,
  ff,
  vf,
  Pf as EnemyPopulation,
  nf,
  _f
};
