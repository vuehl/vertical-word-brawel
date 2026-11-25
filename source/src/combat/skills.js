import {chineseText as c} from "../data/chinese-text.js";
import {vl, random as F, I, L, Sl, wl, Fl} from "../effects/battle-particles.js";
import {R, xf, Cf} from "./enemy-population.js";
import {Kp, qp} from "../effects/move-particles.js";
import {typeColors as Ni, typeNames as Pi, gameData as k} from "../data/game-database.js";
import {speedBuff, windBossDamage, windRushMultiplier, windRushDragonBonus} from "../data/starter-characters.js";
import {finalBossSpecies} from "../data/character-rules.js";
import {Br as v, Vn as ct, Bt as y} from "../data/config.js";
import {clamp as Gs} from "../effects/scene-renderer.js";
import {am, em} from "./field-effects.js";
import {moveAvailableForSpecies} from "../data/skill-availability.js";
import {Zg, $g, Qg} from "../data/move-attributes.js";
import {moveCopy} from "../data/form-copy.js";
import {windMoveEffect} from "../effects/wind-move-art.js";
import {castWindAirSlash} from "./wind-air-slash.js";
import {STAMPEDE_FLAME} from "../effects/stylized-effect-atlas.js";
import {_h, Dh, Ah, H, U, W, yh, q, jh, Y} from "./ultimate-moves.js";
import {ls, M, ks} from "./move-sounds.js";

var Ai = Object.defineProperty,
  ji = (e, t) => {
    let n = {};
    for (var r in e) Ai(n, r, { get: e[r], enumerable: !0 });
    return (t || Ai(n, Symbol.toStringTag, { value: `Module` }), n);
  };
var $h = Math.PI * 2,
  eg = (e, ...t) => !!e.player && t.includes(e.player.speciesId),
  tg = null,
  ng = 0,
  rg = null,
  ig = -9,
  ag = {
    "blazing-hooves": {
      name: c(`Cascos Ígneos`),
      desc: c(
        `+15% velocidad. Al moverte dejas huellas de fuego que queman a los enemigos. Como Rapidash, +10% velocidad y huellas más grandes.`,
      ),
      mods: [{ stat: `moveSpeed`, mul: 1.15 }],
    },
    oblivious: {
      name: c(`Despistado`),
      desc: c(
        `+25% PS, +1,5 regeneración y -10% velocidad. Cada 6 s bostezas: los enemigos a 6 m pueden dormirse. Como Slowbro, el Shellder de la cola te da +20 armadura.`,
      ),
      mods: [
        { stat: `maxHp`, mul: 1.25 },
        { stat: `regen`, add: 1.5 },
        { stat: `moveSpeed`, mul: 0.9 },
      ],
      tick: (e, t) => {
        if (e.time % 6 >= 1) return;
        let n = t.pos.x,
          r = t.pos.y,
          i = t.pos.z;
        e.vfx.norm.spawn({
          x: n,
          y: r + 2.2,
          z: i,
          vy: 1.2,
          life: 1,
          size: 0.5,
          endSize: 1.1,
          color: 10148095,
          shape: I.PixSleepZ,
        });
        for (let t = 0; t < 10; t++) {
          let a = (t / 10) * $h;
          e.vfx.norm.spawn({
            x: n,
            y: r + 1.2,
            z: i,
            vx: Math.cos(a) * 6,
            vy: 0.4,
            vz: Math.sin(a) * 6,
            drag: 2,
            life: 0.8,
            size: 0.3,
            endSize: 0.6,
            color: 16777215,
            shape: I.PixBubble,
          });
        }
        e.vfx.ring(n, r, i, 6, 16759e3, 0.4, 0.3, L.Ripple);
        for (let t of e.enemies.within(n, i, 6)) F.chance(0.5) && e.combat.applyStatus(t, `sleep`, 1);
        e.audio.kt(300, 0.5, { v: 0.04, to: 0.7, vib: [4, 0.05], a: 0.1 });
      },
    },
    "magnet-pull": {
      name: c(`Imán`),
      desc: c(
        `+4 rango de recogida. Cada 4 s un pulso magnético atrae a los enemigos a 9 m y puede paralizarlos. Como Magneton, el pulso además los daña.`,
      ),
      mods: [{ stat: `pickupRange`, add: 4 }],
      tick: (e, t) => {
        if (e.time % 4 >= 1) return;
        let n = e.enemies,
          r = t.pos.x,
          i = t.pos.y,
          a = t.pos.z,
          o = t.speciesId === 82;
        e.vfx.ring(r, i, a, 9, 12110048, 0.45, 0.4, L.Dashed);
        for (let t = 0; t < 6; t++) {
          let n = (t / 6) * $h;
          e.vfx.norm.spawn({
            x: r + Math.cos(n) * 8,
            y: i + 1,
            z: a + Math.sin(n) * 8,
            vx: -Math.cos(n) * 14,
            vz: -Math.sin(n) * 14,
            life: 0.5,
            size: 0.7,
            endSize: 0.5,
            color: 16777215,
            shape: vl.PixMagnet,
            rot: n,
          });
        }
        for (let i of n.within(r, a, 9)) {
          let s = r - n.x[i],
            c = a - n.z[i],
            l = Math.hypot(s, c) || 1,
            u = n.flags[i] & R.Boss ? 0.1 : 1;
          (l > 1.5 && ((n.kx[i] += (s / l) * 10 * u), (n.kz[i] += (c / l) * 10 * u)),
            F.chance(0.4) && e.combat.applyStatus(i, `paralysis`, 1),
            o && e.combat.hit(i, 4 + t.level, { type: `electric`, cls: `special`, knock: 0, silent: !0 }));
        }
        e.audio.kt(110, 0.3, { w: `sawtooth`, lp: 900, v: 0.05, vib: [30, 0.2], a: 0.02 });
      },
    },
    "leek-master": {
      name: c(`Puerro Afilado`),
      desc: c(
        `+10% crítico. Siempre llevas un puerro: un 4% de tus golpes son un «¡Bonk!» de ×8 (se suma al objeto Puerro).`,
      ),
      mods: [{ stat: `critChance`, add: 0.1 }],
    },
    "twin-heads": {
      name: c(`Cabezas Gemelas`),
      desc: c(
        `+10% velocidad. Cada ataque tiene un 25% de repetirse al instante con la otra cabeza. Como Dodrio, un 35%.`,
      ),
      mods: [{ stat: `moveSpeed`, mul: 1.1 }],
    },
    "ice-body": {
      name: c(`Sebo Polar`),
      desc: c(
        `+15% PS y +10 armadura. Cada 4 s estallan esquirlas de hielo a tu alrededor (5 m) que congelan poco a poco. Como Dewgong, 6,5 m.`,
      ),
      mods: [
        { stat: `maxHp`, mul: 1.15 },
        { stat: `armor`, add: 10 },
      ],
      tick: (e, t) => {
        if (e.time % 4 >= 1) return;
        let n = t.speciesId === 87 ? 6.5 : 5,
          r = t.pos.x,
          i = t.pos.y,
          a = t.pos.z;
        for (let t = 0; t < 12; t++) {
          let o = (t / 12) * $h + F.range(-0.15, 0.15);
          e.vfx.norm.spawn({
            x: r,
            y: i + 0.6,
            z: a,
            vx: Math.cos(o) * n * 2.4,
            vy: F.range(0.5, 2),
            vz: Math.sin(o) * n * 2.4,
            drag: 2.5,
            life: 0.5,
            size: 0.6,
            endSize: 0.4,
            color: 12577535,
            shape: I.Shard,
            rot: o,
          });
        }
        e.vfx.ring(r, i, a, n, 11071743, 0.35, 0.2, L.Ripple);
        for (let i of e.enemies.within(r, a, n))
          e.combat.hit(i, Rg(`ice-body`, e, t.level), {
            type: `ice`,
            cls: `special`,
            status: `freeze`,
            statusChance: 1,
            knock: 0.5,
            silent: !0,
          });
      },
    },
    "sludge-body": {
      name: c(`Cuerpo de Lodo`),
      desc: c(
        `-15% daño recibido. Al recibir un golpe dejas un charco tóxico 4 s que envenena y atrapa a quien lo pisa. Como Muk, los charcos son mayores.`,
      ),
      dmgTaken: 0.85,
    },
    "skill-link": {
      name: c(`Encadenado`),
      desc: c(`+20 armadura y +1 proyectil. Como Cloyster, +1 proyectil y +10 armadura más.`),
      mods: [
        { stat: `armor`, add: 20 },
        { stat: `projectiles`, add: 1 },
      ],
    },
  };
function og(e, t, n) {
  if ((tg !== e && ((tg = e), (ng = 0)), (ng -= n), ng > 0 || t.speedNow < 1.5 || !t.grounded)) return;
  let r = t.speciesId === 78;
  ((ng = r ? 0.2 : 0.26),
    e.zones.add({
      x: t.pos.x,
      z: t.pos.z,
      y: t.pos.y,
      r: r ? 1.9 : 1.4,
      life: 2.4,
      tick: 0,
      dmg: Rg(`blazing-hooves`, e, t.level),
      type: `fire`,
      cls: `special`,
      status: `burn`,
      chance: 0.4,
      slot: -1,
      color: 16747050,
      fx: Kp(`blazing-hooves`),
    }));
}
var sg = {
    "blazing-hooves": { frame: og, extraMods: (e) => (eg(e, 78) ? [{ stat: `moveSpeed`, mul: 1.1 }] : []) },
    oblivious: { extraMods: (e) => (eg(e, 80) ? [{ stat: `armor`, add: 20 }] : []) },
    "leek-master": {
      hitMul(e, t) {
        if (!F.chance(0.04)) return 1;
        let n = e.enemies;
        return (
          e.ui.popup(n.x[t], n.y[t] + n.hgt[t] + 1.4, n.z[t], c(`¡Bonk!`), `#8ad85a`, 1.1),
          e.vfx.norm.spawn({
            x: n.x[t],
            y: n.y[t] + n.hgt[t] + 1.2,
            z: n.z[t],
            vy: -10,
            life: 0.18,
            size: 1.6,
            endSize: 1.6,
            color: 16777215,
            shape: vl.PixLeek,
            rot: -0.6,
          }),
          e.vfx.ring(n.x[t], n.y[t], n.z[t], 2.6, 9099354, 0.3),
          e.shake(0.06),
          8
        );
      },
    },
    "twin-heads": {
      onMoveFired(e, t) {
        F.chance(e.player.speciesId === 85 ? 0.35 : 0.25) && (t.timer = Math.min(t.timer, 0.12));
      },
    },
    "sludge-body": {
      onHurt(e, t) {
        if ((rg !== e && ((rg = e), (ig = -9)), e.time - ig < 0.6 || t.hp <= 0)) return;
        ig = e.time;
        let n = t.speciesId === 89 ? 3.2 : 2.2,
          r = t.pos.x,
          i = t.pos.z,
          a = t.pos.y;
        (e.vfx.groundN.spawn({
          x: r,
          y: e.terrain.height(r, i) + 0.09,
          z: i,
          life: 4,
          size: n * 1.6,
          endSize: n * 1.7,
          color: 6957706,
          shape: I.PixSludge,
          rot: F.range(0, $h),
        }),
          e.zones.add({
            x: r,
            z: i,
            y: a,
            r: n,
            life: 4,
            tick: 0,
            dmg: Rg(`sludge-body`, e, t.level),
            type: `poison`,
            cls: `special`,
            status: `poison`,
            chance: 0.6,
            slot: -1,
            color: 11553504,
            fx: Kp(`poison-gas`),
          }));
        for (let t of e.enemies.within(r, i, n)) e.combat.applyStatus(t, `root`, 1);
      },
    },
    "skill-link": {
      extraMods: (e) =>
        eg(e, 91)
          ? [
              { stat: `projectiles`, add: 1 },
              { stat: `armor`, add: 10 },
            ]
          : [],
    },
  },
  cg = (e, t) => (t.slot != null && t.slot >= 0 && t.slot < 4 ? e.player.moves[t.slot]?.def : void 0);
function lg(e, t, n) {
  let r = e.enemies,
    i = e.player.pos;
  return r
    .within(i.x, i.z, t)
    .filter((e) => r.isAlive(e))
    .map((e) => ({ j: e, d: (r.x[e] - i.x) ** 2 + (r.z[e] - i.z) ** 2 }))
    .sort((e, t) => e.d - t.d)
    .slice(0, n)
    .map((e) => e.j);
}
var ug = new WeakMap(),
  dg = (e) => {
    let t = ug.get(e);
    return (t || ug.set(e, (t = { pincer: 0, blastT: -1, blasts: 0 })), t);
  },
  fg = {
    "rock-head": {
      name: c(`Cabeza Roca`),
      desc: c(
        `+25 armadura y +15% PS, a cambio de -8% velocidad. Tus Embestidas hacen +30% de daño. Cada 6 s se desprenden rocas sobre los 3 enemigos más cercanos.`,
      ),
      mods: [
        { stat: `armor`, add: 25 },
        { stat: `maxHp`, mul: 1.15 },
        { stat: `moveSpeed`, mul: 0.92 },
      ],
      tick: (e, t) => {
        if (!(e.time % 6 >= 1))
          for (let n of lg(e, 11, 3)) {
            let r = e.enemies,
              i = r.x[n],
              a = r.z[n],
              o = e.terrain.height(i, a),
              s = 0.35;
            (e.vfx.norm.spawn({
              x: i + 1.5,
              y: o + 9,
              z: a - 1,
              vx: -1.5 / s,
              vy: -9 / s,
              vz: 1 / s,
              life: s,
              size: 1.3,
              endSize: 1.4,
              color: 16777215,
              shape: I.PixRock,
              spin: 6,
            }),
              e.later(s, () => {
                if (r.isAlive(n)) {
                  for (let t = 0; t < 5; t++) {
                    let t = F.range(0, Math.PI * 2);
                    e.vfx.norm.spawn({
                      x: i,
                      y: o + 0.4,
                      z: a,
                      vx: Math.cos(t) * 3,
                      vy: F.range(3, 6),
                      vz: Math.sin(t) * 3,
                      gravity: 22,
                      life: 0.5,
                      size: 0.4,
                      endSize: 0.25,
                      color: 16777215,
                      shape: I.PixRock,
                      spin: 6,
                    });
                  }
                  (e.vfx.dust(i, o, a, 13154456, 5, 2.5),
                    e.combat.hit(n, Rg(`rock-head`, e, t.level), {
                      type: `rock`,
                      cls: `physical`,
                      status: `stun`,
                      statusChance: 0.5,
                      knock: 1,
                      silent: !0,
                    }));
                }
              }));
          }
      },
    },
    pendulum: {
      name: c(`Péndulo`),
      desc: c(
        `+10% probabilidad de estados. Cada 7 s tu péndulo duerme a los 3 enemigos más cercanos (Hypno, a 5). Los enemigos dormidos a menos de 6 m te curan un 0,5% de PS por segundo cada uno (hasta 5).`,
      ),
      mods: [{ stat: `statusChance`, mul: 1.1 }],
      tick: (e, t) => {
        let n = e.enemies,
          r = t.pos,
          i = 0;
        for (let t of n.within(r.x, r.z, 6))
          n.isAlive(t) &&
            n.sleep[t] > 0 &&
            (i++,
            i <= 5 &&
              Math.random() < 0.5 &&
              e.vfx.beams.spawn(n.x[t], n.y[t] + 1, n.z[t], r.x, r.y + 1.2, r.z, 0.05, 14199039, 0.25, 0.5));
        if ((i && t.heal(t.maxHp * 0.005 * Math.min(5, i)), !(e.time % 7 >= 1))) {
          (e.vfx.norm.spawn({
            x: r.x,
            y: r.y + 2.8,
            z: r.z,
            life: 0.6,
            size: 0.7,
            endSize: 0.9,
            color: 16777215,
            shape: I.PixCoin,
            spin: 3,
          }),
            e.vfx.ring(r.x, r.y, r.z, 4, 12099839, 0.4, 0.3, L.Runes));
          for (let r of lg(e, 10, t.speciesId === 97 ? 5 : 3))
            (e.combat.applyStatus(r, `sleep`, 1),
              e.vfx.norm.spawn({
                x: n.x[r],
                y: n.y[r] + n.hgt[r] + 0.4,
                z: n.z[r],
                vy: 1,
                life: 0.9,
                size: 0.4,
                endSize: 0.7,
                color: 10148095,
                shape: I.PixSleepZ,
              }));
        }
      },
    },
    "hyper-cutter": {
      name: c(`Pinza Gigante`),
      desc: c(
        `+6 armadura. Tus Golpes hacen +20% de daño. Cada 5.º golpe de un Golpe es una pinza que hace el doble y aturde (Kingler, cada 4.º).`,
      ),
      mods: [{ stat: `armor`, add: 6 }],
    },
    aftermath: {
      name: c(`Detonación`),
      desc: c(
        `+15% velocidad. Los enemigos que derrotas tienen un 12% de explotar (3 m, daño Eléctrico que paraliza); con Electrode, un 20%.`,
      ),
      mods: [{ stat: `moveSpeed`, mul: 1.15 }],
    },
    harvest: {
      name: c(`Cosecha`),
      desc: c(`+20% curación. Cada 15 s aparece una baya a tu lado. Como Exeggutor, +10% de área.`),
      mods: [{ stat: `healing`, mul: 1.2 }],
      tick: (e, t) => {
        if (e.time % 15 >= 1) return;
        let n = F.range(0, Math.PI * 2),
          r = t.pos.x + Math.cos(n) * 2.5,
          i = t.pos.z + Math.sin(n) * 2.5;
        (e.pickups.spawn(`heal`, r, e.terrain.height(r, i) + 0.5, i, 1),
          e.vfx.norm.spawn({
            x: r,
            y: e.terrain.height(r, i) + 1,
            z: i,
            vy: 1,
            life: 0.5,
            size: 0.5,
            endSize: 1,
            color: 16777215,
            shape: I.PixLeaf,
          }));
      },
    },
    "limber-kicks": {
      name: c(`Patadas Elásticas`),
      desc: c(`+20% de área y +1 salto. Tus patadas (los ataques con «patada») hacen +20% de daño.`),
      mods: [
        { stat: `area`, mul: 1.2 },
        { stat: `extraJumps`, add: 1 },
      ],
    },
    "iron-fist": {
      name: c(`Puño Férreo`),
      desc: c(
        `+5% daño físico. Tus puñetazos (los ataques con «puño») hacen +20% de daño. Cada 3 s das un puñetazo automático al enemigo más cercano a menos de 4 m.`,
      ),
      mods: [{ stat: `physical`, mul: 1.05 }],
      tick: (e, t) => {
        if (e.time % 3 >= 1) return;
        let n = e.enemies.nearest(t.pos.x, t.pos.z, 4);
        if (n < 0) return;
        let r = e.enemies;
        (e.vfx.add.spawn({
          x: r.x[n],
          y: r.y[n] + r.hgt[n] * 0.6,
          z: r.z[n],
          life: 0.18,
          size: 0.9,
          endSize: 1.6,
          color: 16758858,
          shape: I.Fist,
          glow: 0.3,
        }),
          e.combat.hit(n, Rg(`iron-fist`, e, t.level), { type: `fighting`, cls: `physical`, knock: 3 }));
      },
    },
    "long-tongue": {
      name: c(`Lengua Larga`),
      desc: c(
        `+4 rango de recogida y +20% PS. Cada 4 s tu lengua atrapa al enemigo más cercano a menos de 8 m, lo trae hacia ti y lo paraliza.`,
      ),
      mods: [
        { stat: `pickupRange`, add: 4 },
        { stat: `maxHp`, mul: 1.2 },
      ],
      tick: (e, t) => {
        if (e.time % 4 >= 1) return;
        let n = e.enemies,
          r = e.enemies.nearest(t.pos.x, t.pos.z, 8);
        if (r < 0) return;
        let i = t.pos,
          a = i.x - n.x[r],
          o = i.z - n.z[r],
          s = Math.hypot(a, o) || 1,
          c = n.flags[r] & (R.Boss | R.Summoner) ? 0 : n.flags[r] & 12290 ? 0.3 : 1;
        (e.vfx.beams.spawn(i.x, i.y + 1, i.z, n.x[r], n.y[r] + 0.8, n.z[r], 0.3, 16747184, 0.25, 0.8),
          e.vfx.beams.spawn(i.x, i.y + 1, i.z, n.x[r], n.y[r] + 0.8, n.z[r], 0.12, 16765152, 0.2, 0.9),
          (n.kx[r] += (a / s) * Math.max(0, s - 1.5) * 4 * c),
          (n.kz[r] += (o / s) * Math.max(0, s - 1.5) * 4 * c),
          e.combat.hit(r, Rg(`long-tongue`, e, t.level), {
            type: `normal`,
            cls: `physical`,
            status: `paralysis`,
            statusChance: 1,
            knock: 0,
          }));
      },
    },
  },
  pg = {
    "rock-head": { hitMul: (e, t, n) => (cg(e, n)?.arch === `dash` ? 1.3 : 1) },
    "hyper-cutter": {
      hitMul: (e, t, n) => {
        if (cg(e, n)?.arch !== `strike`) return 1;
        let r = dg(e);
        if ((r.pincer++, r.pincer < (e.player.speciesId === 99 ? 4 : 5))) return 1.2;
        r.pincer = 0;
        let i = e.enemies;
        return (
          (i.stun[t] = Math.max(i.stun[t], i.flags[t] & R.Boss ? 0.2 : 0.7)),
          e.vfx.norm.spawn({
            x: i.x[t],
            y: i.y[t] + i.hgt[t] * 0.6,
            z: i.z[t],
            life: 0.22,
            size: 1.2,
            endSize: 2,
            color: 16777215,
            shape: I.PixClaw,
            rot: F.range(-0.4, 0.4),
          }),
          2.4
        );
      },
    },
    aftermath: {
      onKill: (e, t) => {
        let n = dg(e);
        if (
          (e.time - n.blastT >= 1 && ((n.blastT = e.time), (n.blasts = 0)),
          n.blasts >= 6 || !F.chance(e.player.speciesId === 101 ? 0.2 : 0.12))
        )
          return;
        n.blasts++;
        let r = e.enemies,
          i = r.x[t],
          a = r.y[t],
          o = r.z[t],
          s = e.player.level;
        e.later(0.05, () => {
          (e.vfx.flash(i, a + 1, o, 16773242, 2.6, 0.12),
            e.vfx.ring(i, a, o, 3, 16769594, 0.3, 0.2, L.Dashed));
          for (let t = 0; t < 3; t++) {
            let t = F.range(0, Math.PI * 2);
            e.vfx.lightning(
              i,
              a + 0.8,
              o,
              i + Math.cos(t) * 3,
              a + 0.3,
              o + Math.sin(t) * 3,
              16769594,
              0.25,
              4,
              0.18,
            );
          }
          for (let t of r.within(i, o, 3))
            e.combat.hit(t, Rg(`aftermath`, e, s), {
              type: `electric`,
              cls: `special`,
              status: `paralysis`,
              statusChance: 0.6,
              knock: 3,
              silent: !0,
              echo: !0,
            });
          e.audio.move(`discharge`, `cast`, { v: 0.4 });
        });
      },
    },
    harvest: { extraMods: (e) => (e.player?.speciesId === 103 ? [{ stat: `area`, mul: 1.1 }] : []) },
    "limber-kicks": { hitMul: (e, t, n) => (cg(e, n)?.key.includes(`kick`) ? 1.2 : 1) },
    "iron-fist": { hitMul: (e, t, n) => (cg(e, n)?.key.includes(`punch`) ? 1.2 : 1) },
  },
  mg = Math.PI * 2,
  hg = new WeakMap();
function gg(e) {
  let t = hg.get(e);
  return (t || hg.set(e, (t = { runT: 0, bumpT: 0, eggs: [] })), t);
}
function _g(e, t, n) {
  let r = e.enemies,
    i = e.player.pos;
  return r
    .within(i.x, i.z, t)
    .filter((e) => r.isAlive(e))
    .map((e) => ({ j: e, d: (r.x[e] - i.x) ** 2 + (r.z[e] - i.z) ** 2 }))
    .sort((e, t) => e.d - t.d)
    .slice(0, n)
    .map((e) => e.j);
}
var vg = {
  "toxic-cloud": {
    name: c(`Nube Tóxica`),
    desc: c(
      `Levitas: mantén Saltar para planear y puedes subir paredes. Una nube de gas de 4 m te rodea y envenena cada segundo. Como Weezing, 5,5 m.`,
    ),
    tick: (e, t) => {
      let n = t.speciesId === 110 ? 5.5 : 4,
        r = t.pos.x,
        i = t.pos.y,
        a = t.pos.z;
      for (let t = 0; t < 5; t++) {
        let t = F.range(0, mg),
          o = F.range(0.5, n);
        e.vfx.norm.spawn({
          x: r + Math.cos(t) * o,
          y: i + F.range(0.3, 1.4),
          z: a + Math.sin(t) * o,
          vx: F.range(-0.4, 0.4),
          vy: F.range(0.3, 0.8),
          vz: F.range(-0.4, 0.4),
          drag: 1,
          life: 1.1,
          size: 0.8,
          endSize: 1.6,
          color: 11047096,
          endColor: 8022650,
          shape: I.PixPuff,
        });
      }
      for (let i of e.enemies.within(r, a, n))
        e.combat.hit(i, Rg(`toxic-cloud`, e, t.level), {
          type: `poison`,
          cls: `special`,
          status: `poison`,
          statusChance: 0.7,
          knock: 0,
          silent: !0,
        });
    },
  },
  "rhino-charge": {
    name: c(`Embestida Imparable`),
    desc: c(
      `+15 armadura. Tras 1,5 s corriendo sin parar, arrollas: los enemigos que tocas reciben daño y salen volando.`,
    ),
    mods: [{ stat: `armor`, add: 15 }],
  },
  "natural-cure": {
    name: c(`Huevo Suerte`),
    desc: c(`+40% PS y +40% curación. Cada 10 s pones un huevo a tu lado que te cura un 10% al recogerlo.`),
    mods: [
      { stat: `maxHp`, mul: 1.4 },
      { stat: `healing`, mul: 1.4 },
    ],
    tick: (e, t) => {
      if (e.time % 10 >= 1) return;
      let n = F.range(0, mg),
        r = t.pos.x + Math.cos(n) * 2.5,
        i = t.pos.z + Math.sin(n) * 2.5;
      if (!e.terrain.inBounds(r, i, 2) || e.terrain.inWater(r, i)) return;
      let a = e.terrain.height(r, i),
        o = gg(e).eggs;
      (o.push({ x: r, y: a, z: i, t: 0 }),
        o.length > 4 && o.shift(),
        e.vfx.norm.spawn({
          x: r,
          y: a + 0.6,
          z: i,
          life: 0.3,
          size: 0.4,
          endSize: 1.2,
          color: 16777215,
          shape: I.PixSparkle,
        }));
    },
  },
  regenerator: {
    name: c(`Lianas`),
    desc: c(
      `+2 regeneración. Cada 5 s tus lianas atrapan (enraizar) y dañan a los 4 enemigos más cercanos en 7 m.`,
    ),
    mods: [{ stat: `regen`, add: 2 }],
    tick: (e, t) => {
      if (e.time % 5 >= 1) return;
      let n = e.enemies,
        r = t.pos.x,
        i = t.pos.y + 0.8,
        a = t.pos.z;
      _g(e, 7, 4).forEach((o, s) =>
        e.later(s * 0.06, () => {
          if (!n.isAlive(o)) return;
          let c = n.x[o],
            l = n.y[o] + 0.5,
            u = n.z[o],
            d = c - r,
            f = u - a,
            p = Math.hypot(d, f) || 1,
            m = -f / p,
            h = d / p,
            g = (s % 2 ? 1 : -1) * 1.4,
            _ = r,
            v = i,
            y = a;
          for (let t = 1; t <= 7; t++) {
            let n = t / 7,
              o = Math.sin(n * Math.PI) * g,
              s = r + d * n + m * o,
              c = i + (l - i) * n + Math.sin(n * Math.PI) * 0.6,
              u = a + f * n + h * o;
            (e.vfx.beams.spawn(_, v, y, s, c, u, 0.2 * (1 - n * 0.4), t % 2 ? 2783850 : 4892810, 0.25),
              (_ = s),
              (v = c),
              (y = u));
          }
          (e.vfx.norm.spawn({
            x: c,
            y: l,
            z: u,
            vy: 1,
            life: 0.4,
            size: 0.5,
            endSize: 0.3,
            color: 16777215,
            shape: I.PixLeaf,
            spin: 4,
          }),
            e.combat.hit(o, Rg(`regenerator`, e, t.level), {
              type: `grass`,
              cls: `physical`,
              status: `root`,
              statusChance: 1,
              knock: 0,
              silent: !0,
            }));
        }),
      );
    },
  },
  "parental-bond": {
    name: c(`Amor Filial`),
    desc: c(`Tu cría pelea contigo: cada golpe de tus ataques lo repite al 25% de su daño.`),
  },
  "ink-sniper": {
    name: c(`Tinta`),
    desc: c(
      `+10% crítico y +25% daño crítico. Tus críticos llenan de tinta al enemigo y lo ciegan: hace -40% de daño y los comunes dejan de atacar.`,
    ),
    mods: [
      { stat: `critChance`, add: 0.1 },
      { stat: `critDamage`, add: 0.25 },
    ],
  },
  "water-veil": {
    name: c(`Velo Agua`),
    desc: c(
      `+10% evasión. Cada esquiva te envuelve en agua: escudo del 6% de tus PS. Como Seaking, +5% evasión.`,
    ),
    mods: [{ stat: `evasion`, add: 0.1 }],
  },
  "star-core": {
    name: c(`Núcleo`),
    desc: c(
      `+20% velocidad de proyectiles. Cada 8 s tu núcleo te cura un 5%. Como Starmie, +10% daño especial.`,
    ),
    mods: [{ stat: `projSpeed`, mul: 1.2 }],
    tick: (e, t) => {
      e.time % 8 >= 1 ||
        (t.heal(t.maxHp * 0.05),
        e.vfx.norm.spawn({
          x: t.pos.x,
          y: t.pos.y + 2.2,
          z: t.pos.z,
          life: 0.5,
          size: 0.5,
          endSize: 1.3,
          color: 16777215,
          shape: Sl.PixStarCore,
          spin: 6,
        }),
        e.vfx.ring(t.pos.x, t.pos.y, t.pos.z, 2, 16734826, 0.3, 0.3, L.Runes));
    },
  },
};
function yg(e, t, n) {
  let r = gg(e);
  if (((r.runT = t.speedNow > 3.5 && t.grounded ? r.runT + n : 0), r.runT < 1.5 || (r.bumpT -= n) > 0))
    return;
  r.bumpT = 0.15;
  let i = t.facing.x,
    a = t.facing.y,
    o = t.pos.x + i * 1.1,
    s = t.pos.z + a * 1.1,
    c = e.enemies;
  Math.random() < 0.6 && e.vfx.dust(t.pos.x - i * 0.6, t.pos.y, t.pos.z - a * 0.6, 13150328, 2, 2);
  let l = !1;
  for (let n of c.within(o, s, 1.9)) {
    let r = c.flags[n] & (R.Boss | R.Summoner) ? 0.1 : c.flags[n] & 12290 ? 0.4 : 1;
    (e.combat.hit(n, Rg(`rhino-charge`, e, t.level), {
      type: `rock`,
      cls: `physical`,
      dirX: i,
      dirZ: a,
      knock: 6 * r,
      status: `stun`,
      statusChance: 0.3,
    }),
      (l = !0));
  }
  l && (e.vfx.ring(o, t.pos.y, s, 1.8, 13150328, 0.25, 0.2, L.Jagged), e.shake(0.04));
}
function bg(e, t, n) {
  let r = gg(e).eggs;
  for (let i = r.length - 1; i >= 0; i--) {
    let a = r[i];
    a.t += n;
    let o = Math.sin(a.t * 3) * 0.08;
    (e.vfx.norm.spawn({
      x: a.x,
      y: a.y + 0.55 + o,
      z: a.z,
      life: 0.035,
      size: 0.95,
      endSize: 0.95,
      color: 16777215,
      shape: Sl.PixEgg,
    }),
      Math.random() < 0.05 &&
        e.vfx.add.spawn({
          x: a.x + F.range(-0.3, 0.3),
          y: a.y + 0.9,
          z: a.z + F.range(-0.3, 0.3),
          vy: 0.8,
          life: 0.5,
          size: 0.25,
          endSize: 0,
          color: 16758992,
          shape: I.Twinkle,
          glow: 0.3,
        }),
      Math.hypot(t.pos.x - a.x, t.pos.z - a.z) < 1.5
        ? (t.heal(t.maxHp * 0.1),
          e.vfx.burst(a.x, a.y + 0.8, a.z, 16751296, 10, 3, I.Heart, 0.5),
          e.audio.heal(),
          r.splice(i, 1))
        : a.t > 20 && r.splice(i, 1));
  }
}
var xg = {
    "toxic-cloud": { floats: !0 },
    "rhino-charge": { frame: yg },
    "natural-cure": { frame: bg },
    "parental-bond": {
      afterHit(e, t, n, r) {
        r.slot == null ||
          r.slot < 0 ||
          r.slot > 3 ||
          r.fixed ||
          n <= 0 ||
          e.later(0.09, () => {
            let i = e.enemies;
            i.isAlive(t) &&
              (Math.random() < 0.35 &&
                e.vfx.norm.spawn({
                  x: i.x[t] + F.range(-0.4, 0.4),
                  y: i.y[t] + i.hgt[t] * 0.5,
                  z: i.z[t] + F.range(-0.4, 0.4),
                  life: 0.14,
                  size: 0.45,
                  endSize: 0.7,
                  color: 16769216,
                  shape: I.PixFist,
                  rot: F.range(-0.5, 0.5),
                }),
              e.combat.hit(t, n * 0.25, {
                type: r.type,
                cls: r.cls,
                fixed: !0,
                echo: !0,
                noReact: !0,
                knock: 0.3,
                slot: r.slot,
              }));
          });
      },
    },
    "ink-sniper": {
      afterHit(e, t, n, r, i) {
        if (!i) return;
        let a = e.enemies;
        (e.combat.applyStatus(t, `charm`, 1),
          Math.random() < 0.4 &&
            e.vfx.norm.spawn({
              x: a.x[t],
              y: a.y[t] + a.hgt[t] * 0.7,
              z: a.z[t],
              life: 0.5,
              size: 0.4,
              endSize: 1,
              color: 16777215,
              shape: Sl.PixInk,
              rot: F.range(0, mg),
            }));
      },
    },
    "water-veil": {
      onDodge(e, t) {
        ((t.shield = Math.max(t.shield, Math.min(t.shield + t.maxHp * 0.06, t.maxHp * 0.3))),
          e.vfx.ring(t.pos.x, t.pos.y + 0.6, t.pos.z, 1.6, 6998271, 0.3, 0.3, L.Ripple));
        for (let n = 0; n < 6; n++) {
          let r = (n / 6) * mg;
          e.vfx.norm.spawn({
            x: t.pos.x + Math.cos(r) * 0.8,
            y: t.pos.y + 1,
            z: t.pos.z + Math.sin(r) * 0.8,
            vx: Math.cos(r) * 2,
            vy: 2,
            vz: Math.sin(r) * 2,
            gravity: 10,
            life: 0.4,
            size: 0.3,
            endSize: 0.15,
            color: 16777215,
            shape: I.PixDrop,
          });
        }
      },
      extraMods: (e) => (e.player?.speciesId === 119 ? [{ stat: `evasion`, add: 0.05 }] : []),
    },
    "star-core": { extraMods: (e) => (e.player?.speciesId === 121 ? [{ stat: `special`, mul: 1.1 }] : []) },
  },
  Sg = Math.PI * 2,
  Cg = new WeakMap();
function wg(e) {
  let t = Cg.get(e);
  return (t || Cg.set(e, (t = { motor: 0, motorT: 0, stampT: 0, crits: 0, booms: 0, boomT: 0 })), t);
}
function Tg(e, t, n, r, i, a, o) {
  for (let s = 0; s < a; s++) {
    let c = (s / a) * Sg;
    e.vfx.norm.spawn({
      x: t + Math.cos(c) * i,
      y: n + 1.1,
      z: r + Math.sin(c) * i,
      life: o,
      size: 1.3,
      endSize: 1.5,
      color: 16777215,
      shape: wl.PixPane,
      rot: F.range(-0.08, 0.08),
    });
  }
}
function Eg(e, t, n) {
  let r = e.player,
    i = e.terrain.height(t, n);
  for (let r = 0; r < 8; r++) {
    let a = (r / 8) * Sg;
    e.vfx.norm.spawn({
      x: t,
      y: i + 0.5,
      z: n,
      vx: Math.cos(a) * 5,
      vy: F.range(2, 5),
      vz: Math.sin(a) * 5,
      drag: 2,
      life: 0.45,
      size: 0.9,
      endSize: 0.3,
      color: 16777215,
      endColor: 14707274,
      shape: I.PixFlame,
    });
  }
  e.vfx.ring(t, i, n, 3, 13647898, 0.3, 0.15, L.Flames);
  for (let i of e.enemies.within(t, n, 3))
    e.combat.hit(i, Rg(`flame-body`, e, r.level), {
      type: `fire`,
      cls: `special`,
      status: `burn`,
      statusChance: 1,
      knock: 1.5,
      silent: !0,
      echo: !0,
    });
}
var Dg = {
    "barrier-wall": {
      name: c(`Pared Invisible`),
      desc: c(
        `Cada 6 s levantas una barrera invisible: un escudo del 10% de tus PS y una pared que aparta a los enemigos a menos de 4 m.`,
      ),
      mods: [],
      tick: (e, t) => {
        if (e.time % 6 >= 1) return;
        let n = t.pos.x,
          r = t.pos.y,
          i = t.pos.z;
        ((t.shield = Math.max(t.shield, t.maxHp * 0.1)),
          Tg(e, n, r, i, 2.6, 8, 0.6),
          e.vfx.ring(n, r, i, 4, 12577535, 0.35, 0.2, L.Ripple));
        let a = e.enemies;
        for (let e of a.within(n, i, 4)) {
          let t = a.x[e] - n,
            r = a.z[e] - i,
            o = Math.hypot(t, r) || 1,
            s = a.flags[e] & (R.Boss | R.Summoner) ? 0.1 : a.flags[e] & 12290 ? 0.4 : 1;
          ((a.kx[e] += (t / o) * 22 * s), (a.kz[e] += (r / o) * 22 * s));
        }
        e.audio.move(`barrier`, `cast`);
      },
    },
    "frost-kiss": {
      name: c(`Beso Gélido`),
      desc: c(`Quien te toca queda encantado. Tus golpes a enemigos encantados los congelan poco a poco.`),
      contact: `charm`,
    },
    "motor-drive": {
      name: c(`Electromotor`),
      desc: c(`Cada vez que paralizas a un enemigo ganas +2% de daño durante 4 s (hasta 15 cargas).`),
    },
    "flame-body": {
      name: c(`Cuerpo Llama`),
      desc: c(
        `Quien te toca se quema. Los enemigos quemados que derrotas estallan en llamas (3 m) y queman a los de alrededor.`,
      ),
      contact: `burn`,
      mods: [{ stat: `statusDamage`, mul: 1.1 }],
    },
    "mold-breaker": {
      name: c(`Rompemoldes`),
      desc: c(
        `+15% daño. Ignoras los escudos enemigos (como los ataques de Lucha) y haces +20% a jefes y minijefes. Llave Corsé siempre es crítico.`,
      ),
      mods: [{ stat: `damage`, mul: 1.15 }],
    },
    stampede: {
      name: c(`Estampida`),
      desc: c(
        `+15% velocidad. Mientras corres, cada 0,5 s embistes a los enemigos que tienes delante (2,5 m): daño y un buen empujón.`,
      ),
      mods: [{ stat: `moveSpeed`, mul: 1.15 }],
    },
    imposter: {
      name: c(`Transformación`),
      desc: c(
        `+10% daño, PS y velocidad. Cada 30 s copias los tipos del enemigo más cercano: cambian tu bonificación de tipo y tus debilidades.`,
      ),
      mods: [
        { stat: `damage`, mul: 1.1 },
        { stat: `maxHp`, mul: 1.1 },
        { stat: `moveSpeed`, mul: 1.1 },
      ],
      tick: (e, t) => {
        if (e.time % 30 >= 1) return;
        let n = e.enemies.nearest(t.pos.x, t.pos.z, 25);
        if (n < 0) return;
        let r = [...e.enemies.typesOf(n)];
        if (!r.length) return;
        t.types = r;
        let i = t.pos.x,
          a = t.pos.y,
          o = t.pos.z,
          s = Ni[r[0]];
        for (let t = 0; t < 14; t++) {
          let t = F.range(0, Sg),
            n = F.range(2, 5);
          e.vfx.norm.spawn({
            x: i,
            y: a + 1,
            z: o,
            vx: Math.cos(t) * n,
            vy: F.range(1, 3),
            vz: Math.sin(t) * n,
            drag: 2,
            life: 0.6,
            size: 1,
            endSize: 1.8,
            color: 14201072,
            shape: I.PixPuff,
          });
        }
        (e.vfx.ring(i, a, o, 3, s, 0.4, 0.2, L.Petals),
          e.ui.popup(
            i,
            a + 2.8,
            o,
            t.abilityName + ' · ' + r.map((e) => Pi[e]).join(' / '),
            `#` + s.toString(16).padStart(6, `0`),
            0.9,
          ),
          e.audio.move(`transform`, `cast`));
      },
    },
    download: {
      name: c(`Descarga`),
      desc: c(
        `+12% daño especial y velocidad de proyectiles. Cada 10 s descargas datos: tus 5 próximos golpes son críticos.`,
      ),
      mods: [
        { stat: `special`, mul: 1.12 },
        { stat: `projSpeed`, mul: 1.12 },
      ],
      tick: (e, t) => {
        if (e.time % 10 >= 1) return;
        wg(t).crits = 5;
        let n = t.pos.x,
          r = t.pos.y,
          i = t.pos.z;
        for (let t = 0; t < 6; t++)
          e.later(t * 0.05, () =>
            e.vfx.norm.spawn({
              x: n + F.range(-1, 1),
              y: r + 3.2,
              z: i + F.range(-1, 1),
              vy: -6,
              life: 0.35,
              size: 0.5,
              endSize: 0.4,
              color: 16777215,
              shape: wl.PixCube,
              spin: 4,
            }),
          );
        e.vfx.ring(n, r, i, 2.2, 16747192, 0.35, 0.3, L.Dashed);
      },
    },
  },
  Og = {
    "frost-kiss": {
      afterHit(e, t) {
        e.enemies.charm[t] > 0 && Math.random() < 0.5 && e.combat.applyStatus(t, `freeze`, 1);
      },
    },
    "motor-drive": {
      onStatus(e, t, n) {
        if (n !== `paralysis`) return;
        let r = wg(e.player);
        (r.motor < 15 && r.motor++,
          (r.motorT = 4),
          Math.random() < 0.3 &&
            e.vfx.lightning(
              e.player.pos.x,
              e.player.pos.y + 1,
              e.player.pos.z,
              e.enemies.x[t],
              e.enemies.y[t] + 1,
              e.enemies.z[t],
              16769594,
              0.18,
              4,
              0.12,
            ));
      },
      frame(e, t, n) {
        let r = wg(t);
        (r.motorT > 0 && (r.motorT -= n) <= 0 && (r.motor = 0),
          r.motor >= 10 &&
            Math.random() < 0.2 &&
            e.vfx.add.spawn({
              x: t.pos.x + F.range(-0.5, 0.5),
              y: t.pos.y + F.range(0.4, 1.8),
              z: t.pos.z + F.range(-0.5, 0.5),
              life: 0.12,
              size: 0.5,
              endSize: 0.2,
              color: 16769594,
              shape: I.Bolt,
              rot: F.range(0, Sg),
              glow: 0.3,
            }));
      },
      damageMul(e, t) {
        let n = wg(t);
        return n.motorT > 0 ? 1 + n.motor * 0.02 : 1;
      },
    },
    "flame-body": {
      onKill(e, t) {
        let n = e.enemies,
          r = e.player,
          i = wg(r);
        if (n.burn[t] <= 0 || (e.time - i.boomT >= 1 && ((i.boomT = e.time), (i.booms = 0)), i.booms >= 6))
          return;
        let a = n.x[t],
          o = n.z[t];
        (i.booms++, e.later(0.05, () => Eg(e, a, o)));
      },
    },
    "mold-breaker": {
      breakShields: !0,
      hitMul(e, t) {
        return e.enemies.flags[t] & (R.Boss | 12290) ? 1.2 : 1;
      },
      critAdd(e, t, n) {
        return +(n.slot != null && e.player.moves[n.slot]?.def.key === `storm-throw`);
      },
    },
    stampede: {
      frame(e, t, n) {
        let r = wg(t);
        if ((r.stampT -= n) > 0 || ((r.stampT = 0.5), t.speedNow < 4)) return;
        let i = t.facing.x,
          a = t.facing.y,
          o = t.pos.x,
          s = t.pos.z,
          c = e.enemies,
          l = !1;
        for (let n of c.within(o + i * 1.4, s + a * 1.4, 2.5)) {
          let r = c.x[n] - o,
            u = c.z[n] - s,
            d = Math.hypot(r, u) || 1;
          (r * i + u * a) / d < 0.2 ||
            (e.combat.hit(n, Rg(`stampede`, e, t.level), {
              type: `normal`,
              cls: `physical`,
              dirX: i,
              dirZ: a,
              knock: 5,
              silent: Math.random() < 0.5,
              echo: !0,
            }),
            (l = !0));
        }
        l &&
          (e.vfx.dust(o + i, t.pos.y, s + a, 14207144, 6, 3),
          e.vfx.norm.spawn({
            x: o + i * 1.6,
            y: t.pos.y + 1,
            z: s + a * 1.6,
            life: 0.16,
            size: 1.2,
            endSize: 1.4,
            color: 16777215,
            shape: I.PixHorn,
            rot: -Math.atan2(a, i) + Math.PI * 0.75,
          }),
          e.audio.move(`raging-bull`, `cast`, { v: 0.5 }));
      },
    },
    download: {
      critAdd(e) {
        let t = wg(e.player);
        return t.crits <= 0 ? 0 : (t.crits--, 1);
      },
    },
    imposter: {
      onMoveFired(e, t, n) {
        if (e.player.moves[n]?.def.arch !== `random` || Math.random() > 0.4) return;
        let r = e.player.pos;
        e.vfx.norm.spawn({
          x: r.x + F.range(-0.4, 0.4),
          y: r.y + 1.6,
          z: r.z + F.range(-0.4, 0.4),
          vy: 1.2,
          drag: 2,
          life: 0.5,
          size: 0.6,
          endSize: 1.1,
          color: 14201072,
          shape: I.PixPuff,
        });
      },
    },
  },
  kg = Math.PI * 2,
  Ag = [
    { stat: `damage`, mul: 1.1 },
    { stat: `maxHp`, mul: 1.1 },
    { stat: `moveSpeed`, mul: 1.1 },
  ];
function jg(e, t) {
  return t != null && t >= 0 && t < 4 ? e.player.moves[t]?.def.arch : void 0;
}
var Mg = {
    "spiral-shell": {
      name: c(`Concha Espiral`),
      desc: c(
        `+20 armadura. Tus ataques de Roca y Agua hacen +15% de daño. Cada 5 s, un anillo de rocas sale de tu concha (5 m; Omastar 6,5 m).`,
      ),
      mods: [{ stat: `armor`, add: 20 }],
      tick: (e, t) => {
        if (e.time % 5 >= 1) return;
        let n = t.speciesId === 139 ? 6.5 : 5,
          r = t.pos.x,
          i = t.pos.y,
          a = t.pos.z;
        for (let t = 0; t < 12; t++) {
          let o = (t / 12) * kg;
          e.vfx.norm.spawn({
            x: r + Math.cos(o),
            y: i + 0.6,
            z: a + Math.sin(o),
            vx: Math.cos(o) * n * 2.2,
            vy: F.range(2, 4),
            vz: Math.sin(o) * n * 2.2,
            gravity: 14,
            drag: 1.5,
            life: 0.5,
            size: 0.5,
            endSize: 0.4,
            color: 16777215,
            shape: I.PixRock,
            spin: 6,
          });
        }
        e.vfx.ring(r, i, a, n, 12093514, 0.35, 0.15, L.Jagged);
        for (let i of e.enemies.within(r, a, n))
          e.combat.hit(i, Rg(`spiral-shell`, e, t.level), {
            type: `rock`,
            cls: `physical`,
            knock: 2.5,
            silent: !0,
          });
      },
    },
    "battle-armor": {
      name: c(`Armadura Fósil`),
      desc: c(
        `+15 armadura. Cada golpe que recibes se reduce en 3 + 0,3 por nivel. Como Kabutops, tus Golpes y Bumeranes hacen +20% de daño.`,
      ),
      mods: [{ stat: `armor`, add: 15 }],
    },
    "ancient-wings": {
      name: c(`Alas Prehistóricas`),
      desc: c(
        `+15% velocidad y +1 salto; planeas manteniendo Saltar. En el aire, tus ataques hacen +25% de daño.`,
      ),
      mods: [
        { stat: `moveSpeed`, mul: 1.15 },
        { stat: `extraJumps`, add: 1 },
      ],
    },
    "ice-pressure": {
      name: c(`Presión Gélida`),
      desc: c(
        `Legendario: +10% daño, PS y velocidad. Cada segundo, los enemigos a menos de 6 m se van congelando.`,
      ),
      mods: [...Ag],
      tick: (e, t) => {
        let n = t.pos.x,
          r = t.pos.z;
        for (let i = 0; i < 6; i++) {
          let i = F.range(0, kg),
            a = F.range(1, 6);
          e.vfx.norm.spawn({
            x: n + Math.cos(i) * a,
            y: t.pos.y + F.range(0.3, 2),
            z: r + Math.sin(i) * a,
            vx: F.range(-0.5, 0.5),
            vy: -0.6,
            vz: F.range(-0.5, 0.5),
            life: 0.9,
            size: 0.3,
            endSize: 0.2,
            color: 16777215,
            shape: I.PixSnow,
            spin: 2,
          });
        }
        for (let t of e.enemies.within(n, r, 6)) Math.random() < 0.35 && e.combat.applyStatus(t, `freeze`, 1);
      },
    },
    "volt-pressure": {
      name: c(`Presión Eléctrica`),
      desc: c(
        `Legendario: +10% daño, PS y velocidad. Cada 5 s caen tres rayos sobre enemigos cercanos y los paralizan.`,
      ),
      mods: [...Ag],
      tick: (e, t) => {
        if (e.time % 5 >= 1) return;
        let n = e.enemies,
          r = n.within(t.pos.x, t.pos.z, 13).filter((e) => n.isAlive(e));
        for (let i = 0; i < 3 && r.length; i++) {
          let a = r.splice(Math.floor(Math.random() * r.length), 1)[0],
            o = n.x[a],
            s = n.z[a],
            c = e.terrain.height(o, s);
          e.later(i * 0.12, () => {
            (e.vfx.lightning(o + F.range(-1, 1), c + 24, s, o, c, s, 16769594, 0.45, 8, 0.22),
              e.vfx.norm.spawn({
                x: o,
                y: c + 1.2,
                z: s,
                life: 0.18,
                size: 1.6,
                endSize: 1.2,
                color: 16777215,
                shape: I.PixBolt,
              }));
            for (let r of n.within(o, s, 2.2))
              e.combat.hit(r, Rg(`volt-pressure`, e, t.level), {
                type: `electric`,
                cls: `special`,
                status: `paralysis`,
                statusChance: 0.8,
                knock: 1,
                silent: !0,
              });
          });
        }
      },
    },
    "flame-pressure": {
      name: c(`Presión Ígnea`),
      desc: c(
        `Legendario: +10% daño, PS y velocidad. Cada 6 s un anillo de llamas de 6 m quema a los enemigos.`,
      ),
      mods: [...Ag],
      tick: (e, t) => {
        if (e.time % 6 >= 1) return;
        let n = t.pos.x,
          r = t.pos.y,
          i = t.pos.z;
        e.vfx.ring(n, r, i, 6, 13647898, 0.45, 0.12, L.Flames);
        for (let t = 0; t < 20; t++) {
          let a = (t / 20) * kg;
          e.vfx.norm.spawn({
            x: n + Math.cos(a),
            y: r + 0.5,
            z: i + Math.sin(a),
            vx: Math.cos(a) * 13,
            vy: F.range(1, 3),
            vz: Math.sin(a) * 13,
            drag: 3,
            life: 0.45,
            size: 1.1,
            endSize: 0.4,
            color: 16777215,
            endColor: 14707274,
            shape: I.PixFlame,
          });
        }
        for (let r of e.enemies.within(n, i, 6))
          e.combat.hit(r, Rg(`flame-pressure`, e, t.level), {
            type: `fire`,
            cls: `special`,
            status: `burn`,
            statusChance: 0.9,
            knock: 2,
            silent: !0,
          });
      },
    },
    genome: {
      name: c(`Genoma`),
      desc: c(
        `+15% daño, área y velocidad. Cada 8 s una barrera psíquica te da un escudo del 15% de tus PS. Tus críticos aturden.`,
      ),
      mods: [
        { stat: `damage`, mul: 1.15 },
        { stat: `area`, mul: 1.15 },
        { stat: `moveSpeed`, mul: 1.15 },
      ],
      tick: (e, t) => {
        if (e.time % 8 >= 1) return;
        t.shield = Math.max(t.shield, t.maxHp * 0.15);
        let n = t.pos.x,
          r = t.pos.y,
          i = t.pos.z;
        (e.vfx.ring(n, r + 1, i, 1.8, 12618495, 0.5, 0.6, L.Runes),
          e.vfx.add.spawn({
            x: n,
            y: r + 1,
            z: i,
            life: 0.5,
            size: 1.5,
            endSize: 3.2,
            color: 11563263,
            shape: I.Ring,
            glow: 0.2,
          }));
      },
    },
  },
  Ng = {
    "spiral-shell": { hitMul: (e, t, n) => (n.type === `rock` || n.type === `water` ? 1.15 : 1) },
    "battle-armor": {
      hurtMod: (e, t, n) => Math.max(n * 0.25, n - (3 + t.level * 0.3)),
      hitMul: (e, t, n) => {
        if (e.player.speciesId !== 141) return 1;
        let r = jg(e, n.slot);
        return r === `strike` || r === `boomerang` ? 1.2 : 1;
      },
    },
    "ancient-wings": { hitMul: (e) => (e.player.grounded ? 1 : 1.25) },
    genome: {
      afterHit: (e, t, n, r, i) => {
        i && !r.fixed && e.combat.applyStatus(t, `stun`, 1);
      },
    },
  },
  Pg = [1, 1.8, 3.2, 4],
  Fg = (e) => Pg[e.stage - 1] ?? 4,
  Ig = {
    "blazing-hooves": { a: 3, b: 0.5, status: `burn`, chance: 0.4, life: 2.4, every: 0.26 },
    "mud-trail": { a: 3, b: 0.45, status: `root`, chance: 0.3, life: 2.6, every: 0.32 },
    "sludge-body": { a: 2, b: 0.5, status: `poison`, chance: 0.6, life: 4 },
    "ice-body": { a: 3, b: 0.8, status: `freeze`, chance: 1, every: 4 },
    "rock-head": { a: 8, b: 2, status: `stun`, chance: 0.5, every: 6, n: 3 },
    "iron-fist": { a: 8, b: 2, every: 3, n: 1 },
    "long-tongue": { a: 5, b: 1.2, status: `paralysis`, chance: 1, every: 4, n: 1 },
    aftermath: { a: 6, b: 2, status: `paralysis`, chance: 0.6 },
    "toxic-cloud": { a: 2, b: 0.5, status: `poison`, chance: 0.7, every: 1 },
    regenerator: { a: 5, b: 1.2, status: `root`, chance: 1, every: 5, n: 4 },
    "rhino-charge": { a: 8, b: 2, status: `stun`, chance: 0.3, every: 0.15 },
    "flame-body": { a: 6, b: 1.6, status: `burn`, chance: 1 },
    stampede: { a: 8, b: 2, every: 0.5 },
    "spiral-shell": { a: 5, b: 1.2, every: 5 },
    "volt-pressure": { a: 8, b: 2, status: `paralysis`, chance: 0.8, every: 5, n: 3 },
    "flame-pressure": { a: 6, b: 1.5, status: `burn`, chance: 0.9, every: 6 },
    chlorophyll: { a: 3, b: 0.6, status: `poison`, chance: 1, every: 6 },
    "arena-trap": { a: 4, b: 1.2, status: `root`, chance: 0.8, every: 2 },
    tentacles: { a: 6, b: 1.5, status: `poison`, chance: 0.8, every: 2, n: 2 },
  },
  Lg = (e, t, n) => {
    let r = Ig[e];
    return r ? (r.a + r.b * t) * (Pg[n - 1] ?? 4) : 0;
  },
  Rg = (e, t, n) => Lg(e, n, t.stage),
  zg = { ...sg, ...pg, ...xg, ...Og, ...Ng },
  Bg = (e) => zg[e],
  Vg = 120,
  Hg = 0.85,
  Ug = class {
    win = new Float64Array(xf);
    touched = [];
    best = 0;
    acc = 0;
    hist = [];
    add(e, t) {
      if (!(t > 0) || !Number.isFinite(t)) return;
      this.win[e] === 0 && this.touched.push(e);
      let n = (this.win[e] += t);
      n > this.best && (this.best = n);
    }
    tick(e) {
      if (((this.acc += e), !(this.acc < 1))) {
        (--this.acc,
          this.best > 0 && (this.hist.push(this.best), this.hist.length > Vg && this.hist.shift()));
        for (let e of this.touched) this.win[e] = 0;
        ((this.touched.length = 0), (this.best = 0));
      }
    }
    get dps() {
      let e = this.hist.length;
      return e ? this.hist.slice().sort((e, t) => e - t)[Math.min(e - 1, Math.floor(e * Hg))] : 0;
    }
    budget(e) {
      return this.dps * e;
    }
  },
  Wg = 0.2,
  Gg = -10,
  Kg = 0.5,
  qg = 10,
  Jg = 16,
  Yg = 24,
  Xg = 16;
var e_ = class {
    run;
    reactCd = new Map();
    sparkT = 0;
    photoT = -1;
    meter = new Ug();
    constructor(e) {
      this.run = e;
    }
    hit(e, t, n) {
      if (this.hitDepth >= 24) return 0;
      this.hitDepth++;
      try {
        return this.hit0(e, t, n);
      } finally {
        this.hitDepth--;
      }
    }
    hitDepth = 0;
    grpN = new Uint16Array(xf);
    grpDmg = new Float64Array(xf);
    grpX = new Float32Array(xf);
    grpZ = new Float32Array(xf);
    grpList = [];
    groupHit(e, t, n = 0, r = 0) {
      (this.grpN[e]++ || (this.grpList.push(e), (this.grpDmg[e] = 0), (this.grpX[e] = n), (this.grpZ[e] = r)),
        (this.grpDmg[e] += t));
    }
    flushGroup(e) {
      let t = this.grpList;
      this.grpList = [];
      for (let n of t) {
        let t = this.grpN[n];
        ((this.grpN[n] = 0),
          this.hit(n, this.grpDmg[n], { ...e, dirX: this.grpX[n], dirZ: this.grpZ[n], times: t }));
      }
    }
    hit0(e, t, n) {
      if (Fl.own) return this.strike(e, t, n);
      Fl.enter(this.run.hideOwnFx);
      try {
        return this.strike(e, t, n);
      } finally {
        Fl.leave();
      }
    }
    strike(e, t, n) {
      let r = this.run,
        i = r.enemies,
        a = r.player.stats;
      if (!i.isAlive(e) || i.parked(e)) return 0;
      if (i.flags[e] & R.Boss && r.boss.immune)
        return (
          !n.silent &&
            Math.random() < 0.25 &&
            r.vfx.text.spawn(i.x[e], i.y[e] + i.hgt[e] + 0.3, i.z[e], `-`, 11053240, 0.45),
          0
        );
      let o = i.typesOf(e),
        s = t,
        l = 1;
      if (!n.fixed) {
        s *= a.damage * (n.cls === `physical` ? a.physical : a.special);
        let t = r.player.items.get(`thick-club`);
        t && n.cls === `physical` && (s *= 1 + Math.min(0.5, Math.max(0, a.armor) / 200) * t);
        let c = n.slot != null && n.slot >= 10 ? r.allies.typesFor(n.slot) : null;
        ((c ?? r.player.types).includes(n.type) &&
          (s *= c || r.player.ability !== `adaptability` ? 1.25 : 1.5625),
          (s *= a.typeBoost[n.type] ?? 1),
          (l = k.effectiveness(n.type, o)),
          (s *= l),
          l > 1.01 && (s *= a.superEffective));
        let u = v[r.weather];
        (u.boost.includes(n.type) && (s *= 1.3),
          u.nerf.includes(n.type) && (s *= 0.75),
          (s *= r.player.bonusDamageMult()),
          i.flags[e] & (R.Elite | 12290 | R.Boss) && (s *= a.eliteDamage));
        let d = r.player.items.get(`binding-band`);
        d &&
          (i.stun[e] > 0 || i.root[e] > 0 || i.para[e] > 0 || i.frozen[e] > 0 || i.sleep[e] > 0) &&
          (s *= 1 + 0.2 * d);
        let f = r.player.items.get(`full-heal`);
        (f && (s *= 1 + Math.min(0.3, 0.06 * this.statusCount(e)) * f), (s *= r.player.scopeMul(e)));
      }
      let u = !1,
        d = r.player.ability === `pickup` ? Math.min(0.15, r.stats.gold / 1e4) : 0,
        f = Bg(r.player.ability);
      f?.hitMul && !n.fixed && (s *= f.hitMul(r, e, n));
      let p = f?.critAdd && !n.fixed ? f.critAdd(r, e, n) : 0,
        m = !1;
      if (!n.fixed) {
        let e = a.critChance + a.megaCrit + (n.critBonus ?? 0) + d + p;
        F.chance(e) &&
          ((u = !0),
          (s *= a.critDamage),
          e > 1 && F.chance(e - 1) && ((m = !0), (s *= 1 + Kg * (a.critDamage - 1))));
      }
      let h = n.fixed || n.noReact ? 0 : (r.player.items.get(`stick`) ?? 0),
        g = h > 0 && F.chance(0.03 * h);
      (g && (s *= 8), r.endless && !n.fixed && !(i.flags[e] & R.Boss) && (s *= r.endless.siegeMult));
      let _ = i.flags[e] & R.Boss ? r.boss.exhaust(e) : 1;
      if (
        ((s *= _),
        i.flags[e] & R.Boss && r.boss.mech && e === r.boss.bossIndex && (s *= r.boss.mech.hitMul()),
        i.flags[e] & R.Boss && r.boss.kit && e === r.boss.bossIndex && (s *= r.boss.kit.hitMul()),
        i.curse[e] > 0 && (s *= 1.25),
        i.veil[e] === 1 && (s *= 0.25),
        i.frozen[e] > 0)
      ) {
        s *= 1.2;
        let t = r.player.items.get(`ice-heal`);
        if (t && !n.fixed && !n.noReact) {
          ((s *= 1.6 + 0.3 * (t - 1)),
            (i.frozen[e] = 0),
            r.vfx.burst(i.x[e], i.y[e] + i.hgt[e] * 0.5, i.z[e], 14218495, 14, 6, I.Shard, 0.5, 0.5),
            this.canReact(`shatter`) &&
              r.ui.popup(i.x[e], i.y[e] + i.hgt[e] + 1.2, i.z[e], c(`¡Hielo roto!`), `#bff4ff`, 0.8));
          for (let t of i.within(i.x[e], i.z[e], 2.5)) t !== e && this.applyStatus(t, `freeze`, 0);
        }
      }
      if (
        (i.para[e] > 0 && r.player.ability === `beacon` && (s *= 1.25),
        r.player.ability === `venom-sting` &&
          !n.fixed &&
          (i.poison[e] > 0 && (s *= 1.2), u && !n.noReact && this.applyStatus(e, `poison`, s)),
        !n.fixed)
      ) {
        let t = r.player.ability;
        if (
          (t === `effect-spore` &&
            r.player.speciesId === 47 &&
            (i.poison[e] > 0 ||
              i.para[e] > 0 ||
              i.sleep[e] > 0 ||
              i.burn[e] > 0 ||
              i.confuse[e] > 0 ||
              i.root[e] > 0) &&
            (s *= 1.2),
          t === `compound-eyes` && i.confuse[e] > 0 && (s *= 1.25),
          t === `carnivore` && n.slot != null)
        ) {
          let t = r.player.moves[n.slot]?.def.arch;
          (t === `strike` || t === `spin`) &&
            ((s *= 1.15), !n.noReact && F.chance(0.2) && this.applyStatus(e, `root`, s));
        }
      }
      if (i.sleep[e] > 0) {
        ((s *= 1.8),
          !n.noReact &&
            (n.type === `ghost` || n.type === `dark`) &&
            ((s *= 1.7), this.react(e, c(`¡Pesadilla!`), 10115839), r.player.leech(s * 0.04)));
        let t = r.player.items.get(`awakening`);
        (!t || n.fixed || !F.chance(Math.min(0.7, 0.25 + 0.15 * t))) && (i.sleep[e] = 0);
      }
      if ((n.noReact || (s = this.reactions(e, s, n)), i.shield[e] > 0)) {
        let t = n.type === `fighting` || f?.breakShields ? 3 : 1,
          a = Math.min(i.shield[e], s * t);
        ((i.shield[e] -= a),
          (s -= a / t),
          i.shield[e] <= 0 &&
            r.vfx.burst(i.x[e], i.y[e] + i.hgt[e] * 0.5, i.z[e], 9103615, 10, 6, I.Square, 0.35));
      }
      ((s = s >= 0 ? Math.min(s, 1e30) : 0),
        u &&
          (n.echo || (r.meta.count(`crits`, n.times ?? 1), m && r.stats.megaCrits++),
          r.player.ability === `presage` &&
            !(i.flags[e] & (R.Boss | 12290)) &&
            i.hp[e] - s > 0 &&
            i.hp[e] - s < i.maxHp[e] * 0.12 &&
            ((s = i.hp[e]),
            this.canReact(`presage`) &&
              r.ui.popup(i.x[e], i.y[e] + i.hgt[e] + 1.4, i.z[e], c(`¡Desastre!`), `#c8a8ff`, 0.8),
            r.vfx.add.spawn({
              x: i.x[e],
              y: i.y[e] + i.hgt[e] * 0.6,
              z: i.z[e],
              life: 0.3,
              size: 0.6,
              endSize: i.hgt[e] * 2.2,
              color: 12098303,
              shape: I.Crescent,
              rot: F.range(0, 6.28),
              glow: 0.8,
            }))));
      let y = r.player.items.get(`razor-fang`);
      (y &&
        !(i.flags[e] & (R.Boss | 12290)) &&
        i.hp[e] - s > 0 &&
        i.hp[e] - s < i.maxHp[e] * (0.04 + 0.04 * y) &&
        (this.itemDmg(`razor-fang`, i.hp[e] - s),
        (s = i.hp[e]),
        Math.random() < 0.3 &&
          r.vfx.add.spawn({
            x: i.x[e],
            y: i.y[e] + i.hgt[e] * 0.6,
            z: i.z[e],
            life: 0.25,
            size: 0.5,
            endSize: i.hgt[e] * 1.8,
            color: 16777215,
            shape: I.Crescent,
            rot: F.range(0, 6.28),
            glow: 0.6,
          })),
        n.src && this.itemDmg(n.src, s),
        g &&
          (this.itemDmg(`stick`, (s * 7) / 8),
          i.flags[e] & R.Boss && i.hp[e] - s <= 0 && r.meta.count(`bonkBoss`, 1),
          this.canReact(`bonk`) &&
            (r.ui.popup(i.x[e], i.y[e] + i.hgt[e] + 1.4, i.z[e], c(`¡Bonk!`), `#8ad85a`, 1.1), r.shake(0.06)),
          r.vfx.ring(i.x[e], i.y[e], i.z[e], 2.6, 9099354, 0.3)));
      let b = s;
      if (i.flags[e] & R.Boss) s = this.limitWindBossHit(e, s);
      i.capRate[e] > 0 && (s = this.capHit(e, s));
      let x = s < b * 0.7,
        S = Math.min(s, Math.max(0, i.hp[e]));
      (n.slot !== 8 && this.meter.add(e, (i.flags[e] & (R.Boss | 12290) ? s : S / i.wt[e]) / _),
        this.takeHp(e, s),
        i.flags[e] & R.Treasure && r.events.onHit(e),
        i.flags[e] & R.Boss && r.boss.kit?.clampHp(),
        (i.flash[e] = 1),
        (i.squash[e] = 0.6),
        (i.lastHitBy[e] = n.slot ?? -1),
        (r.stats.damage += S),
        n.slot != null && r.player.moves[n.slot]
          ? (r.player.moves[n.slot].damageDone += S)
          : n.slot === 8
            ? (r.stats.ultDamage += S)
            : n.slot != null && n.slot >= 10 && r.allies.credit(n.slot, S));
      let C = r.endless ? ct(r.time / 60) : 1,
        w =
          (i.flags[e] & (R.Boss | R.Summoner)
            ? 0.05
            : i.flags[e] & 12290
              ? 0.2
              : i.flags[e] & R.Elite
                ? 0.6
                : 1) * C,
        T = (n.knock ?? 1.5) * a.knockback * w;
      if ((n.status === `knock` && (T *= 2.5), T > 0 && r.time - i.knockAt[e] >= 0.6)) {
        i.knockAt[e] = r.time;
        let t = Math.hypot(i.kx[e], i.kz[e]);
        if (n.dirX != null && n.dirZ != null) ((i.kx[e] += n.dirX * T * 4), (i.kz[e] += n.dirZ * T * 4));
        else {
          let t = i.x[e] - r.player.pos.x,
            n = i.z[e] - r.player.pos.z,
            a = Math.hypot(t, n) || 1;
          ((i.kx[e] += (t / a) * T * 4), (i.kz[e] += (n / a) * T * 4));
        }
        let o =
            Math.max(3, i.speed[e]) *
            2 *
            C *
            Math.sqrt(Math.max(1, a.knockback)) *
            (n.status === `knock` ? 1.5 : 1),
          s = Math.hypot(i.kx[e], i.kz[e]),
          c = Math.max(t, o);
        s > c && ((i.kx[e] *= c / s), (i.kz[e] *= c / s));
      }
      let E = n.status,
        ee = Math.min(1, (n.statusChance ?? 0.15) * a.statusChance);
      (E && F.chance(n.times && n.times > 1 ? 1 - (1 - ee) ** n.times : ee) && this.applyStatus(e, E, s),
        a.flinch > 0 &&
          r.time - i.flinchAt[e] >= 1.5 &&
          F.chance(a.flinch) &&
          ((i.flinchAt[e] = r.time), (i.stun[e] = Math.max(i.stun[e], 0.35 * this.resist(e)))),
        !n.noReact && !n.fixed && this.itemProcs(e, s, u, n),
        f?.afterHit && !n.echo && f.afterHit(r, e, s, n, u),
        n.drain && r.player.leech(s * n.drain));
      let D = a.lifesteal;
      if (D > 0 && !(n.slot != null && n.slot >= 10)) {
        let e = Math.floor(D) + +!!F.chance(D % 1);
        e && r.player.leech(e * (1 + r.player.maxHp * 0.005));
      }
      if (
        (r.player.ability === `photosynthesis` &&
          n.type === `grass` &&
          n.slot != null &&
          n.slot < 10 &&
          r.time - this.photoT >= 0.2 &&
          ((this.photoT = r.time), r.player.leech(r.player.maxHp * 0.004)),
        r.player.items.has(`shell-bell`) && r.player.leech(s * 0.008 * r.player.items.get(`shell-bell`)),
        !n.silent)
      ) {
        let t = i.x[e],
          a = i.y[e] + i.hgt[e] * 0.55,
          o = i.z[e],
          d = Ni[n.type];
        const continuousFire=n.type==='fire'&&n.slot!=null&&r.player.moves[n.slot]?.def.arch==='cone'&&r.player.moves[n.slot]?.active>0&&!u&&!m;
        const visualMove=n.slot!=null?r.player.moves[n.slot]?.def.key:null;
        const authoredEmber=visualMove==='ember';
        const authoredFeather=n.slot!=null&&r.player.moves[n.slot]?.def.effectKey==='wind-feather-dance';
        const authoredBreath=['flamethrower','dragon-breath'].includes(visualMove);
        const authoredFamily=r.vfx.crafted.fireFamily.supports(visualMove)||n.slot===8&&[4,5,6].includes(r.player.speciesId);
        const criticalFx=(u||m)&&r.vfx.criticalImpact(t,a,o);
        if(authoredBreath){
          // The reference spray already contains its contact flames.
          if(visualMove==='dragon-breath')r.vfx.crafted.fireJet.impact(t,a,o,true,!!(u||m),true);
        }
        else if(authoredFamily)r.vfx.crafted.fireFamily.impact(visualMove||'ultimate',t,a,o);
        else if(!authoredEmber&&!authoredFeather)r.vfx.crafted.impact(n.type,t,a,o,m?1.7:u?1.3:.8,!!(u||m),true,continuousFire);
        (this.fxFrame(),
          !authoredFeather && !continuousFire && !authoredEmber && !authoredBreath && !authoredFamily && Math.random() < 0.6 &&
            (u || this.hitFxN++ < Yg) &&
            r.vfx.burst(t, a, o, d, u ? 9 : 4, u ? 7 : 4, am(n.type), u ? 0.55 : 0.4, 0.3),
          m
            ? criticalFx && (r.vfx.flash(t, a, o, 16730762, 2.4, 0.14),
              r.vfx.ring(t, i.y[e], o, 2.1, 16730762, 0.28, 0.45),
              r.vfx.ring(t, i.y[e] + 0.1, o, 1.2, 16777215, 0.2, 0.4),
              r.vfx.burst(t, a, o, 16743088, 10, 9, I.Star, 0.5, 0.35),
              this.canReact(`mega`) && r.shake(0.05))
            : u && criticalFx &&
              (r.vfx.flash(t, a, o, 16765498, 1.4, 0.1), r.vfx.ring(t, i.y[e], o, 1.3, 16765498, 0.2, 0.3)),
          x &&
            this.canReact(`guard`) &&
            (r.ui.popup(i.x[e], i.y[e] + i.hgt[e] + 1.4, i.z[e], c(`¡Aguanta!`), `#c8d0e0`, 0.8),
            r.vfx.ring(i.x[e], i.y[e] + i.hgt[e] * 0.5, i.z[e], 1.2 + i.hgt[e] * 0.5, 13162736, 0.25, 0.3)));
        let f = x
          ? 10133684
          : m
            ? 16730762
            : u
              ? 16765498
              : l > 1.01
                ? 16751162
                : l < 0.99
                  ? 11053240
                  : 16777215;
        const numberY=i.y[e]+i.hgt[e]+.3,numberKey=e+"/"+i.gen[e];
        r.vfx.number(t,numberY,o,s,f,m?2:u,numberKey);
        (
          l > 1.01 &&
            F.chance(0.25) &&
            this.canReact(`eff`) &&
            r.ui.popup(i.x[e], i.y[e] + i.hgt[e] + 1.2, i.z[e], c(`¡Muy eficaz!`), `#ffb03a`, 0.8),
          r.audio.hit(l, u, m));
      }
      return (i.hp[e] <= 0 && this.killEnemy(e, n), s);
    }
    windBossBudget = new Map();
    windRushContacts(buff, fromX, fromZ) {
      const {player, enemies} = this.run;
      const {x, y, z} = player.pos;
      const dx = x - fromX, dz = z - fromZ, lengthSq = dx * dx + dz * dz;
      const multiplier = windRushMultiplier(player.speciesId);
      if (multiplier === 1 || player.dead) return;
      const contacts = buff.contacts ??= new Map();
      for (const [id, generation] of contacts) {
        if (!enemies.isAlive(id) || enemies.gen[id] !== generation ||
            Math.abs(y - enemies.y[id]) >= enemies.hgt[id] + .8 ||
            (enemies.x[id] - fromX) ** 2 + (enemies.z[id] - fromZ) ** 2 > (player.radius + enemies.radius[id]) ** 2)
          contacts.delete(id);
      }
      if (!lengthSq) return;
      const candidates = enemies.within(fromX + dx / 2, fromZ + dz / 2, player.radius + Math.sqrt(lengthSq) / 2);
      let attack;
      for (const id of candidates) {
        if (contacts.has(id) || enemies.flags[id] & (R.Object | R.Treasure | R.Capture) || enemies.parked(id)) continue;
        if (Math.abs(y - enemies.y[id]) >= enemies.hgt[id] + .8) continue;
        const ex = enemies.x[id] - fromX, ez = enemies.z[id] - fromZ;
        const along = Gs((ex * dx + ez * dz) / lengthSq, 0, 1);
        if ((ex - along * dx) ** 2 + (ez - along * dz) ** 2 > (player.radius + enemies.radius[id]) ** 2) continue;
        contacts.set(id, enemies.gen[id]);
        attack ??= player.moves.find(Boolean) ?? new M_(formMove(98, player.speciesId));
        const dragonBoss = (enemies.flags[id] & R.Boss) && enemies.species[id] === finalBossSpecies;
        const hitMultiplier = dragonBoss ? multiplier + windRushDragonBonus[player.speciesId] : multiplier;
        this.hit(id, Ex(attack.def, attack) * hitMultiplier, {
          type: attack.def.type, cls: attack.def.cls, slot: 8, noReact: true,
        });
        if (player.speciesId === 59) this.run.vfx?.crafted.windRush?.hit(enemies.x[id], enemies.y[id], enemies.z[id]);
      }
    }
    limitWindBossHit(index, damage) {
      const {player, enemies, time} = this.run;
      if (!player.buffs.has(speedBuff)) return damage;
      return windBossDamage(this.windBossBudget, index, enemies.gen[index], enemies.maxHp[index], time, damage);
    }
    capHit(e, t) {
      let n = this.run.enemies,
        r = this.run.time,
        i = n.capRate[e],
        a = Math.min(i * 3, n.capBank[e] + Math.max(0, r - n.capT[e]) * i),
        o = Math.min(t, a);
      return ((n.capBank[e] = a - o), (n.capT[e] = r), o);
    }
    itemDmg(e, t) {
      let n = this.run.stats.itemDamage;
      n[e] = (n[e] ?? 0) + t;
    }
    itemProcs(e, t, n, r) {
      let i = this.run,
        a = i.enemies,
        o = i.player.items,
        s = i.player.stats.statusChance,
        c = (e) => o.get(e) ?? 0;
      (c(`flame-orb`) && F.chance(0.05 * c(`flame-orb`) * s) && this.applyStatus(e, `burn`, t),
        c(`toxic-orb`) && F.chance(0.06 * c(`toxic-orb`) * s) && this.applyStatus(e, `poison`, t),
        c(`snowball`) && F.chance(0.06 * c(`snowball`) * s) && this.applyStatus(e, `freeze`, t),
        c(`grip-claw`) && F.chance(0.04 * c(`grip-claw`) * s) && this.applyStatus(e, `root`, t),
        c(`awakening`) && F.chance(0.025 * c(`awakening`) * s) && this.applyStatus(e, `sleep`, t));
      let l = c(`thunder-stone`);
      if (l && n && i.time - this.sparkT > 0.2) {
        let t = a.nearest(a.x[e], a.z[e], 8, e);
        t >= 0 &&
          ((this.sparkT = i.time),
          i.vfx.lightning(
            a.x[e],
            a.y[e] + a.hgt[e] * 0.5,
            a.z[e],
            a.x[t],
            a.y[t] + a.hgt[t] * 0.5,
            a.z[t],
            16773242,
            0.25,
          ),
          this.hit(t, (10 + i.player.level * 0.8) * l, {
            type: `electric`,
            cls: `special`,
            status: `paralysis`,
            statusChance: 0.3,
            noReact: !0,
            src: `thunder-stone`,
          }));
      }
    }
    statusCount(e) {
      let t = this.run.enemies;
      return (
        +(t.burn[e] > 0) +
        +(t.poison[e] > 0) +
        +(t.para[e] > 0) +
        +(t.wet[e] > 0) +
        +(t.chill[e] > 0 || t.frozen[e] > 0) +
        +(t.sleep[e] > 0) +
        +(t.confuse[e] > 0) +
        +(t.curse[e] > 0) +
        +(t.root[e] > 0)
      );
    }
    resist(e) {
      let t = this.run.enemies.flags[e];
      return t & R.Boss ? 0.35 : t & 12290 ? 0.6 : 1;
    }
    countOnce(e, t, n) {
      let r = this.run.enemies;
      r.counted[e] & t || ((r.counted[e] |= t), this.run.meta.count(n, 1));
    }
    applyStatus(e, t, n) {
      let r = this.run.enemies,
        i = this.run.player.stats;
      t && r.flags[e] & R.Remote && this.run.coop?.statusProxy(e, t, n);
      let a = i.duration,
        o = this.resist(e);
      switch (t) {
        case `burn`:
          (this.countOnce(e, 1, `burned`),
            (r.burn[e] = 3 * a),
            (r.burnDps[e] = Math.max(r.burnDps[e], n * 0.3 * i.statusDamage)));
          break;
        case `poison`:
          (this.countOnce(e, 2, `poisoned`),
            (r.poison[e] = 5 * a * (1 + 0.25 * (this.run.player.items.get(`black-sludge`) ?? 0))),
            (r.poisonStacks[e] = Math.min(10, r.poisonStacks[e] + 1)),
            (r.poisonDps[e] = Math.max(r.poisonDps[e], n * 0.12 * i.statusDamage)),
            (r.healBlock[e] = Math.max(r.healBlock[e], 5)));
          break;
        case `paralysis`:
          (this.countOnce(e, 4, `paralyzed`), (r.para[e] = 3 * a));
          break;
        case `freeze`:
          ((r.chill[e] = Math.min(3, r.chill[e] + 1)),
            (r.chillT[e] = 3),
            r.wet[e] > 0 && (r.chill[e] = 3),
            r.chill[e] >= 3 &&
              r.frozen[e] <= 0 &&
              ((r.frozen[e] = 1.6 * a * o),
              (r.chill[e] = 0),
              (r.wet[e] = 0),
              this.countOnce(e, 8, `frozen`),
              this.run.vfx.burst(r.x[e], r.y[e] + 1, r.z[e], 12580095, 10, 4, I.Flake, 0.5)));
          break;
        case `sleep`:
          (this.countOnce(e, 16, `slept`), (r.sleep[e] = 3 * a * o));
          break;
        case `confusion`:
          (this.countOnce(e, 32, `confused`), (r.confuse[e] = 3 * a * o));
          break;
        case `wet`:
          (this.countOnce(e, 64, `soaked`), (r.wet[e] = 5 * a));
          break;
        case `curse`:
          r.curse[e] = 4 * a;
          break;
        case `healblock`:
          ((r.healBlock[e] = 6 * a), (r.shield[e] *= 0.5));
          break;
        case `charm`:
          r.charm[e] = 3 * a * o;
          break;
        case `root`:
          r.root[e] = 2 * a * o;
          break;
        case `stun`:
          r.stun[e] <= 0 &&
            this.run.time - r.flinchAt[e] >= 1.5 &&
            ((r.flinchAt[e] = this.run.time), (r.stun[e] = 0.5 * o));
      }
      t && Bg(this.run.player.ability)?.onStatus?.(this.run, e, t);
    }
    canReact(e) {
      let t = this.run.time;
      return t - (this.reactCd.get(e) ?? -9) < 0.25 ? !1 : (this.reactCd.set(e, t), !0);
    }
    react(e, t, n) {
      let r = this.run.enemies;
      (this.canReact(`pop` + t) &&
        this.run.ui.popup(
          r.x[e],
          r.y[e] + r.hgt[e] + 1.4,
          r.z[e],
          t,
          `#` + n.toString(16).padStart(6, `0`),
          1.1,
        ),
        this.run.stats.reactions++,
        t === `Electrocutado` && this.run.meta.count(`electro`, 1));
    }
    reactions(e, t, n) {
      let r = this.run,
        i = r.enemies,
        a = r.vfx,
        o = i.x[e],
        s = i.y[e] + i.hgt[e] * 0.5,
        l = i.z[e];
      if (i.wet[e] > 0 && n.type === `electric` && this.canReact(`elec`)) {
        (this.react(e, c(`¡Electrocutado!`), 16769594), (i.wet[e] = 0));
        let r = 0;
        for (let c of i.within(o, l, 9))
          if (!(c === e || i.wet[c] <= 0)) {
            if (++r > 12) break;
            (a.lightning(o, s, l, i.x[c], i.y[c] + i.hgt[c] * 0.5, i.z[c], 16773242, 0.3),
              this.hit(c, t * 0.8, {
                type: `electric`,
                cls: n.cls,
                status: `paralysis`,
                statusChance: 0.6,
                noReact: !0,
                fixed: !0,
                slot: n.slot,
              }));
          }
        return t * 1.5;
      }
      if (i.burn[e] > 0 && n.type === `water` && this.canReact(`steam`)) {
        (this.react(e, c(`¡Vapor!`), 14741759), (i.burn[e] = 0));
        for (let e = 0; e < 14; e++)
          a.norm.spawn({
            x: o + F.range(-2, 2),
            y: s,
            z: l + F.range(-2, 2),
            vy: F.range(1, 3),
            life: F.range(0.8, 1.4),
            size: 1.5,
            endSize: 4,
            color: 16777215,
            shape: I.Soft,
            drag: 2,
          });
        for (let e of i.within(o, l, 6)) {
          let t = this.resist(e);
          ((i.confuse[e] = Math.max(i.confuse[e], 2.5 * t)), (i.root[e] = Math.max(i.root[e], 2 * t)));
        }
        return t * 1.4;
      }
      if (i.burn[e] > 0 && (n.type === `grass` || n.type === `flying`) && this.canReact(`fire`)) {
        (this.react(e, c(`¡Incendio!`), 16738842),
          a.ring(o, i.y[e], l, 7, 16742954, 0.5),
          a.burst(o, s, l, 16742954, 22, 9, I.Flame, 0.8));
        for (let e of i.within(o, l, 7))
          (this.applyStatus(e, `burn`, t),
            (i.burnDps[e] = Math.max(i.burnDps[e], t * 0.39 * r.player.stats.statusDamage)));
        return t * 1.3;
      }
      if (
        i.frozen[e] > 0 &&
        (n.type === `fighting` || n.type === `rock` || n.type === `steel`) &&
        this.canReact(`shatter`)
      ) {
        (this.react(e, c(`¡Destrozo!`), 9103615),
          (i.frozen[e] = 0),
          a.burst(o, s, l, 12580095, 26, 12, I.Flake, 0.6, 0.6, 8));
        for (let r of i.within(o, l, 5))
          r !== e && this.hit(r, t * 0.7, { type: `ice`, cls: n.cls, noReact: !0, fixed: !0, slot: n.slot });
        return t * 2.6;
      }
      if (i.poison[e] > 0 && n.type === `fire` && this.canReact(`gas`)) {
        this.react(e, c(`¡Gas Tóxico!`), 12606207);
        let r = i.poisonStacks[e];
        ((i.poison[e] = 0),
          (i.poisonStacks[e] = 0),
          a.ring(o, i.y[e], l, 6, 12606207, 0.5),
          a.burst(o, s, l, 11557600, 26, 8, I.Soft, 1.2, 0.8));
        for (let a of i.within(o, l, 6))
          a !== e &&
            this.hit(a, t * (0.5 + r * 0.12), {
              type: `poison`,
              cls: n.cls,
              status: `poison`,
              statusChance: 1,
              noReact: !0,
              fixed: !0,
              slot: n.slot,
            });
        return t * (1.4 + r * 0.1);
      }
      return i.para[e] > 0 && n.type === `psychic` && this.canReact(`mind`)
        ? (this.react(e, c(`¡Colapso Mental!`), 16734880),
          (i.para[e] = 0),
          (i.confuse[e] = Math.max(i.confuse[e], 4 * this.resist(e))),
          t * 1.6)
        : i.charm[e] > 0 && n.type === `dragon` && this.canReact(`dragon`)
          ? (this.react(e, c(`¡Furia Dragón!`), 8018687), t * 2)
          : t;
    }
    bumpT = -1;
    bumpN = 0;
    fxT = -1;
    fxN = 0;
    hitFxN = 0;
    deathFxN = 0;
    fxFrame() {
      this.fxT !== this.run.time &&
        ((this.fxT = this.run.time), (this.fxN = this.hitFxN = this.deathFxN = 0));
    }
    statusFx(e) {
      if ((this.fxFrame(), this.fxN >= Jg)) return !1;
      let t = this.run.enemies;
      return this.run.sprites.visible(t.x[e], t.y[e] + t.hgt[e] * 0.5, t.z[e], 2 + t.hgt[e])
        ? (this.fxN++, !0)
        : !1;
    }
    tickStatus(e, t) {
      let n = this.run.enemies,
        r = 0;
      if (
        (n.burn[e] > 0
          ? ((n.burn[e] -= t),
            (r += n.burnDps[e]),
            Math.random() < t * 8 &&
              this.statusFx(e) &&
              this.run.vfx.trail(
                n.x[e] + F.range(-0.4, 0.4),
                n.y[e] + n.hgt[e] * F.range(0.2, 0.9),
                n.z[e] + F.range(-0.4, 0.4),
                16742954,
                0.4,
                I.Flame,
                0.5,
              ))
          : (n.burnDps[e] = 0),
        n.poison[e] > 0
          ? ((n.poison[e] -= t),
            (r += n.poisonDps[e] * (0.6 + n.poisonStacks[e] * 0.2)),
            Math.random() < t * 4 &&
              this.statusFx(e) &&
              this.run.vfx.trail(n.x[e], n.y[e] + n.hgt[e] * 0.7, n.z[e], 12606207, 0.35, I.Bubble, 0.6))
          : ((n.poisonStacks[e] = 0), (n.poisonDps[e] = 0)),
        n.para[e] > 0 &&
          ((n.para[e] -= t),
          Math.random() < t * 1.5 &&
            (n.stun[e] <= 0 &&
              this.run.time - n.flinchAt[e] >= 1.5 &&
              ((n.flinchAt[e] = this.run.time), (n.stun[e] = 0.4 * this.resist(e))),
            this.statusFx(e) &&
              this.run.vfx.burst(
                n.x[e],
                n.y[e] + n.hgt[e] * 0.6,
                n.z[e],
                16769594,
                4,
                3,
                I.Bolt,
                0.4,
                0.25,
              ))),
        n.stun[e] > 0 && (n.stun[e] -= t),
        n.frozen[e] > 0 && (n.frozen[e] -= t),
        n.chillT[e] > 0 && ((n.chillT[e] -= t), n.chillT[e] <= 0 && (n.chill[e] = 0)),
        n.wet[e] > 0 &&
          ((n.wet[e] -= t),
          Math.random() < t * 2 &&
            this.statusFx(e) &&
            this.run.vfx.trail(n.x[e], n.y[e] + n.hgt[e] * 0.8, n.z[e], 5943551, 0.25, I.Drop, 0.5)),
        n.sleep[e] > 0 &&
          ((n.sleep[e] -= t),
          Math.random() < t * 1.5 &&
            this.statusFx(e) &&
            this.run.vfx.norm.spawn({
              x: n.x[e] + 0.2,
              y: n.y[e] + n.hgt[e] + 0.3,
              z: n.z[e],
              vy: 0.9,
              vx: 0.5,
              drag: 0.4,
              life: 1.3,
              size: 0.3,
              endSize: 0.55,
              color: 13154559,
              shape: I.PixSleepZ,
              rot: 0.15,
            })),
        n.confuse[e] > 0 &&
          ((n.confuse[e] -= t),
          this.bumpT !== this.run.time && ((this.bumpT = this.run.time), (this.bumpN = 0)),
          Math.random() < t * 2 && this.bumpN < qg))
      ) {
        this.bumpN++;
        let t = n.nearest(n.x[e], n.z[e], 2.5, e);
        t >= 0 &&
          this.hit(t, n.dmg[e] * 2, { type: `psychic`, cls: `special`, noReact: !0, fixed: !0, silent: !0 });
      }
      if (
        (n.curse[e] > 0 && (n.curse[e] -= t),
        n.healBlock[e] > 0 && (n.healBlock[e] -= t),
        n.charm[e] > 0 &&
          ((n.charm[e] -= t),
          Math.random() < t &&
            this.statusFx(e) &&
            this.run.vfx.trail(n.x[e], n.y[e] + n.hgt[e] + 0.2, n.z[e], 16747224, 0.4, I.Heart, 0.7)),
        n.root[e] > 0 && (n.root[e] -= t),
        r > 0 &&
          (n.flags[e] & R.Boss && t > 0 && (r = this.limitWindBossHit(e, r * t) / t),
          n.capRate[e] > 0 && (r = this.capHit(e, r * t) / t),
          (n.flags[e] & R.Boss && this.run.boss.immune) || this.takeHp(e, r * t),
          this.meter.add(e, (r * t) / n.wt[e]),
          n.flags[e] & R.Boss && this.run.boss.kit?.clampHp(),
          (this.run.stats.damage += r * t),
          Math.random() < t * 2.2 &&
            this.run.vfx.number(
              n.x[e],
              n.y[e] + n.hgt[e],
              n.z[e],
              r * 0.45,
              n.burn[e] > 0 ? 16751194 : 13667071,
            ),
          n.hp[e] <= 0))
      ) {
        let t = n.lastHitBy[e];
        this.killEnemy(e, {
          type: n.burn[e] > 0 ? `fire` : `poison`,
          cls: `special`,
          slot: t >= 0 ? t : void 0,
          remote: t <= Gg ? Gg - t : void 0,
        });
      }
    }
    enemySupport(e) {
      let t = this.run,
        n = t.enemies;
      if (n.healBlock[e] > 0) return;
      let r = (n.flags[e] & R.Healer) !== 0,
        i = n.within(n.x[e], n.z[e], 8),
        a = 0;
      for (let e of i) {
        if (n.healBlock[e] > 0 || a >= 8 || n.flags[e] & R.Boss) continue;
        let i = (n.flags[e] & Cf) !== 0;
        if (i && t.time - n.aidAt[e] < 5) continue;
        let o = i ? 0.03 : 0.15,
          s = i ? 0.06 : 0.2,
          c = i ? 0.12 : 0.4;
        r
          ? n.hp[e] < n.maxHp[e] &&
            ((n.hp[e] = Math.min(n.maxHp[e], n.hp[e] + n.maxHp[e] * o)), a++, i && (n.aidAt[e] = t.time))
          : n.shield[e] < n.maxHp[e] * c &&
            ((n.shield[e] = Math.min(n.maxHp[e] * c, n.shield[e] + n.maxHp[e] * s)),
            a++,
            i && (n.aidAt[e] = t.time));
      }
      (t.vfx.ring(n.x[e], n.y[e], n.z[e], 8, r ? 5963658 : 9103615, 0.6),
        t.vfx.burst(
          n.x[e],
          n.y[e] + 1.5,
          n.z[e],
          r ? 5963658 : 9103615,
          8,
          3,
          r ? I.Heart : I.Square,
          0.4,
          0.8,
        ));
    }
    killEnemy(e, t) {
      let n = this.run,
        r = n.enemies,
        i = n.coop;
      if (r.dying[e] > 0 || !r.alive[e]) return;
      let a = r.flags[e];
      if (a & R.Remote) r.hp[e] = Math.max(1, r.hp[e]);
      else {
        if (i?.isBossMirror(e)) {
          if (!i.bossAuthority && !i.bossDownOk) {
            r.hp[e] = Math.max(1, r.hp[e]);
            return;
          }
          i.bossAuthority && i.bossDefeated();
        }
        a & R.Capture
          ? n.capture.onDefeated(e)
          : a & R.Object
            ? ((r.dying[e] = 0.01), (r.hp[e] = 0))
            : (a & R.Boss && n.mewtwo.intercept(e)) ||
              (a & R.Boss && n.capture.interceptBoss(e)) ||
              (a & R.Alpha && n.allies.intercept(e)) ||
              ((r.dying[e] = 0.35),
              (r.hp[e] = 0),
              i && i.onDeath(e, t.remote ?? i.mySlot),
              t.remote ??
                (n.player.ability === `carnivore` && r.root[e] > 0 && n.player.heal(n.player.maxHp * 0.02),
                Bg(n.player.ability)?.onKill?.(n, e, t),
                a & R.Elite && n.tier >= 2 && this.eliteBurst(e)),
              this.credit(e, t, !0));
      }
    }
    takeHp(e, t) {
      let n = this.run.enemies,
        r = this.run.coop;
      (r && n.flags[e] & R.Remote
        ? (r.hitProxy(e, t), (n.hp[e] = Math.max(1, n.hp[e] - t)))
        : r?.isBossMirror(e) && !r.bossAuthority && !r.bossDownOk
          ? (r.hitBoss(t), (n.hp[e] = Math.max(1, n.hp[e] - t)))
          : (n.hp[e] -= t),
        globalThis.__pbCoop &&
          __pbCoop.damageNumber &&
          __pbCoop.damageNumber(this.run, n.x[e], n.y[e], n.z[e], t));
    }
    remoteHit(e, t, n, r, i, a, o) {
      let s = this.run,
        c = s.enemies;
      if (!c.isAlive(e) || c.parked(e) || (c.flags[e] & R.Boss && s.boss.immune)) return;
      if (c.shield[e] > 0) {
        let n = Math.min(c.shield[e], t);
        ((c.shield[e] -= n), (t -= n));
      }
      (c.capRate[e] > 0 && (t = this.capHit(e, t)),
        (c.hp[e] -= t),
        (c.flash[e] = 1),
        (c.squash[e] = Math.max(c.squash[e], 0.4)),
        (c.lastHitBy[e] = Gg - o));
      for (let t of n) t !== `knock` && this.applyStatus(e, t, r);
      let l =
        c.flags[e] & (R.Boss | R.Summoner) ? 0.05 : c.flags[e] & 12290 ? 0.2 : c.flags[e] & R.Elite ? 0.6 : 1;
      if (Number.isFinite(i + a) && s.time - c.knockAt[e] >= 0.6) {
        c.knockAt[e] = s.time;
        let t = c.x[e] - i,
          r = c.z[e] - a,
          o = Math.hypot(t, r) || 1,
          u = (n.includes(`knock`) ? 3.75 : 1.5) * 4 * l;
        ((c.kx[e] += (t / o) * u), (c.kz[e] += (r / o) * u));
      }
      (t > 0 &&
        s.vfx.enabledText &&
        Math.random() < 0.5 &&
        s.vfx.number(c.x[e], c.y[e] + c.hgt[e] + 0.3, c.z[e], t, 10148095, false, e+"/"+c.gen[e]),
        c.hp[e] <= 0 && this.killEnemy(e, { remote: o }));
    }
    bursts = [];
    eliteBurst(e) {
      let t = this.run,
        n = t.enemies,
        r = t.player.pos;
      if (
        ((this.bursts = this.bursts.filter((e) => e > t.time)),
        this.bursts.length >= 6 || Math.hypot(n.x[e] - r.x, n.z[e] - r.z) > 22)
      )
        return;
      let i = n.x[e],
        a = n.z[e],
        o = t.terrain.height(i, a),
        s = n.typesOf(e)[0],
        c = Ni[s] ?? 16777215,
        l = n.dmg[e] * 1.2,
        u = n.species[e];
      (this.bursts.push(t.time + 0.9),
        t.vfx.telegraph(i, o, a, 3, c, 0.9),
        t.later(0.9, () => {
          (t.vfx.burst(i, o + 0.5, a, c, 14, 7, am(s), 0.6, 0.45),
            t.vfx.ring(i, o, a, 3, c, 0.35),
            t.audio.boom(0.35));
          let e = t.player.pos;
          (e.x - i) ** 2 + (e.z - a) ** 2 < 9 &&
            e.y - o < 2 &&
            t.player.hurt(l * t.diff.enemyDamage, s, -1, i, a, !1, 0.15, { kind: `burst`, species: u });
        }));
    }
    credit(e, t, n) {
      let r = this.run,
        i = r.enemies,
        a = i.flags[e],
        o = t.remote == null;
      o && this.tally(i.species[e], a, t.slot ?? -1, i.wt[e]);
      let s = i.x[e],
        c = i.y[e],
        l = i.z[e];
      if (
        (this.deathFx(
          s,
          c,
          l,
          i.hgt[e],
          i.scale[e],
          Ni[i.typesOf(e)[0]] ?? 16777215,
          (a & (Cf | R.Boss)) !== 0,
        ),
        o)
      ) {
        let t = i.xp[e] * r.diff.xp;
        (r.pickups.spawnXp(s, c, l, t),
          r.coop?.shareXp(t),
          i.lastHitBy[e] >= 10 && r.allies.onAllyKill(i.lastHitBy[e]));
      }
      (a & R.Alpha && r.stats.alphas++,
        n &&
          (o && this.dropCoins(s, c, l, i.wt[e]),
          a & R.Boss && r.onBossKilled(e),
          a & (R.Totem | R.Summoner) && r.minibosses.onKilled(e),
          a & R.Treasure && r.events.onKilled(e),
          o && r.player.onKill(e, t.type ?? `normal`)),
        r.audio.pop());
    }
    creditRemote(e, t, n, r, i, a, o) {
      let s = this.run,
        c = s.enemies,
        l = e >= 0 ? c.lastHitBy[e] : -1;
      (this.tally(t, n, l),
        this.deathFx(
          r,
          i,
          a,
          e >= 0 ? c.hgt[e] : 1.2,
          e >= 0 ? c.scale[e] : 1,
          Ni[k.get(t)?.types[0] ?? `normal`] ?? 16777215,
          (n & Cf) !== 0,
        ));
      let u = o * s.diff.xp;
      (s.pickups.spawnXp(r, i, a, u),
        s.coop?.shareXp(u),
        l >= 10 && s.allies.onAllyKill(l),
        this.dropCoins(r, i, a),
        e >= 0 && s.player.onKill(e, `normal`),
        s.audio.pop());
    }
    tally(e, t, n, r = 1) {
      let i = this.run;
      i.killFrac += r;
      let a = Math.max(1, Math.floor(i.killFrac + 1e-6));
      ((i.killFrac = Math.max(0, i.killFrac - a)), (i.stats.kills += a));
      for (let e = 0; e < a; e++) (i.onKill(), i.ult.onKill(t, n));
      (i.meta.count(`kills_` + i.biome.id, a),
        i.weather === `rain` && i.meta.count(`rainKills`, a),
        (i.stats.killsBy[e] = (i.stats.killsBy[e] ?? 0) + a),
        i.meta.profile.seen.includes(e) || (i.meta.markSeen(e), i.stats.newSeen.push(e)),
        i.research.add(
          e,
          (t & R.Boss ? 10 : t & (R.Alpha | R.Totem) ? 5 : t & R.Summoner ? 4 : t & R.Elite ? 2 : 1) * a,
        ));
    }
    deathFx(e, t, n, r, i, a, o) {
      let s = this.run;
      (this.fxFrame(),
        (o || this.deathFxN++ < Xg) &&
          (s.vfx.burst(e, t + r * 0.5, n, a, o ? 40 : 8, o ? 14 : 6, I.Star, 0.45, 0.5),
          s.vfx.flash(e, t + r * 0.5, n, 16769184, 1.5 * i, 0.12)));
    }
    dropCoins(e, t, n, i = 1) {
      let a = this.run,
        o = a.player.stats;
      if (((a.goldFrac += Wg * o.gold * i), a.goldFrac >= 1)) {
        let r = Math.floor(a.goldFrac);
        ((a.goldFrac -= r), a.pickups.spawnCoin(e, t, n, r));
      }
    }
  },
  t_ = ji({ OVERRIDES: () => n_, SPECIAL: () => r_ }),
  n_ = {
    yawn: `homing`,
    "psychic-noise": `wave`,
    "thunder-wave": `chain`,
    "false-swipe": `boomerang`,
    "meteor-assault": `meteor`,
    "double-hit": `barrage`,
    uproar: `nova`,
    dive: `dash`,
    "poison-gas": `trail`,
    clamp: `strike`,
  },
  r_ = {
    inferno: { status: `burn`, statusChance: 1 },
    yawn: { status: `sleep`, statusChance: 0.5, count: 2 },
    scald: { status: `burn`, statusChance: 0.3 },
    "psychic-noise": { status: `healblock`, statusChance: 0.5 },
    "thunder-wave": { status: `paralysis`, statusChance: 0.6, dmgMul: 0.8 },
    "gyro-ball": { dmgMul: 1.2 },
    "false-swipe": { count: 2, spread: 0.4 },
    "meteor-assault": { dmgMul: 1.2 },
    "double-hit": { count: 2, dmgMul: 1.6 },
    uproar: { pulses: 2, status: `confusion`, statusChance: 0.25 },
    "icy-wind": { status: `freeze`, statusChance: 0.4 },
    "aurora-beam": { status: `freeze`, statusChance: 0.25 },
    "sheer-cold": { dmgMul: 1.15, status: `freeze`, statusChance: 0.9 },
    "poison-gas": { status: `poison`, statusChance: 0.7 },
    "shadow-sneak": { status: `curse`, statusChance: 0.35 },
    belch: { dmgMul: 1.15, status: `poison`, statusChance: 0.5 },
    clamp: { status: `root`, statusChance: 0.5 },
    "icicle-spear": { count: 5, dmgMul: 0.85 },
    "ice-spinner": { status: `freeze`, statusChance: 0.3 },
    "icicle-crash": { count: 3, dmgMul: 0.65, status: `stun`, statusChance: 0.3 },
  },
  i_ = ji({ OVERRIDES: () => a_, SPECIAL: () => o_ }),
  a_ = {
    "stealth-rock": `trap`,
    "head-smash": `dash`,
    psywave: `wave`,
    nightmare: `homing`,
    "dream-eater": `drain`,
    "focus-blast": `orb`,
    "vice-grip": `strike`,
    liquidation: `dash`,
    crabhammer: `smite`,
    guillotine: `meteor`,
    spark: `dash`,
    electroweb: `cone`,
    "rising-voltage": `smite`,
    discharge: `nova`,
    barrage: `barrage`,
    "leech-seed": `drain`,
    "seed-bomb": `lob`,
    "wood-hammer": `strike`,
    "rolling-kick": `spin`,
    "blaze-kick": `strike`,
    "jump-kick": `dash`,
    "high-jump-kick": `smite`,
    "comet-punch": `barrage`,
    "ice-punch": `strike`,
    "drain-punch": `strike`,
    "focus-punch": `meteor`,
    "wring-out": `strike`,
    snore: `nova`,
    strength: `dash`,
    "heavy-slam": `smite`,
  },
  o_ = {
    "rock-tomb": { status: `root`, statusChance: 0.4 },
    "stealth-rock": { count: 3 },
    "head-smash": { dmgMul: 1.3 },
    psywave: { status: `confusion`, statusChance: 0.3 },
    nightmare: { status: `curse`, statusChance: 0.6 },
    "dream-eater": { dmgMul: 1.2 },
    "vice-grip": { status: `root`, statusChance: 0.3 },
    guillotine: { dmgMul: 1.3, status: `stun`, statusChance: 0.6 },
    electroweb: { status: `root`, statusChance: 0.3 },
    barrage: { count: 4 },
    "leech-seed": { status: `root`, statusChance: 0.25 },
    "rolling-kick": { status: `stun`, statusChance: 0.3 },
    "high-jump-kick": { count: 1, dmgMul: 1.35 },
    "comet-punch": { count: 5, dmgMul: 0.8 },
    "focus-punch": { dmgMul: 1.25, status: `stun`, statusChance: 0.7 },
    "wring-out": { status: `paralysis`, statusChance: 0.4 },
    snore: { status: `stun`, statusChance: 0.3 },
    "heavy-slam": { count: 1, dmgMul: 1.3, status: `stun`, statusChance: 0.5 },
  },
  s_ = ji({ OVERRIDES: () => c_, SPECIAL: () => l_ }),
  c_ = {
    smog: `cone`,
    explosion: `meteor`,
    "smack-down": `bolt`,
    "sweet-kiss": `homing`,
    "echoed-voice": `wave`,
    bind: `strike`,
    "solar-blade": `beam`,
    "dizzy-punch": `strike`,
    "mega-kick": `dash`,
    "mega-punch": `meteor`,
    octazooka: `orb`,
    "hydro-cannon": `beam`,
    "aqua-cutter": `boomerang`,
    "horn-leech": `dash`,
    "fishious-rend": `strike`,
    "confuse-ray": `homing`,
  },
  l_ = {
    "self-destruct": { dmgMul: 1.2 },
    explosion: { dmgMul: 1.3 },
    "smack-down": { status: `stun`, statusChance: 0.25 },
    "sweet-kiss": { statusChance: 0.45 },
    bind: { status: `root`, statusChance: 0.35 },
    "grass-knot": { status: `stun`, statusChance: 0.3 },
    octazooka: { status: `charm`, statusChance: 0.3 },
    "scale-shot": { count: 5, dmgMul: 0.85 },
    "confuse-ray": { statusChance: 0.45 },
    "mirror-shot": { status: `charm`, statusChance: 0.25 },
  },
  u_ = ji({ OVERRIDES: () => d_, SPECIAL: () => f_ }),
  d_ = {
    barrier: `orbit`,
    "light-screen": `wave`,
    "trick-room": `vortex`,
    "misty-explosion": `nova`,
    "lovely-kiss": `homing`,
    "heart-stamp": `strike`,
    "perish-song": `meteor`,
    "bolt-strike": `meteor`,
    eruption: `meteor`,
    "storm-throw": `strike`,
    "vital-throw": `spin`,
    payback: `strike`,
    "rock-climb": `spin`,
    "raging-bull": `dash`,
    "headlong-rush": `meteor`,
    transform: `random`,
    mimic: `random`,
    copycat: `random`,
    sketch: `random`,
    "lock-on": `homing`,
    "fusion-bolt": `chain`,
  },
  f_ = {
    barrier: { count: 3 },
    "light-screen": { status: `knock`, statusChance: 1 },
    "trick-room": { status: `stun`, statusChance: 0.5 },
    "misty-explosion": { status: `charm`, statusChance: 0.35, dmgMul: 1.2 },
    "lovely-kiss": { statusChance: 0.5 },
    "frost-breath": { status: `freeze`, statusChance: 0.6 },
    "heart-stamp": { status: `stun`, statusChance: 0.3 },
    "perish-song": { dmgMul: 1.4, status: `curse`, statusChance: 1 },
    "bolt-strike": { status: `paralysis`, statusChance: 0.6 },
    eruption: { dmgMul: 1.1, status: `burn`, statusChance: 0.8 },
    "vital-throw": { status: `knock`, statusChance: 1 },
    superpower: { status: `stun`, statusChance: 0.4 },
    "rock-climb": { status: `confusion`, statusChance: 0.3 },
    "raging-bull": { dmgMul: 1.15 },
    "headlong-rush": { dmgMul: 1.2, status: `stun`, statusChance: 0.5 },
    "lock-on": { count: 3, status: `curse`, statusChance: 0.5 },
    "fusion-bolt": { status: `paralysis`, statusChance: 0.3 },
  },
  p_ = ji({ OVERRIDES: () => m_, SPECIAL: () => h_ }),
  m_ = {
    constrict: `spin`,
    "razor-shell": `strike`,
    "thunder-fang": `strike`,
    "dragon-ascent": `meteor`,
    mist: `aura`,
    "bolt-beak": `dash`,
    "wildbolt-storm": `cone`,
    thunderclap: `smite`,
    "electro-shot": `beam`,
    "searing-shot": `orb`,
    psystrike: `orb`,
    "psycho-boost": `meteor`,
  },
  h_ = {
    constrict: { status: `root`, statusChance: 0.3 },
    "spike-cannon": { count: 5, dmgMul: 0.85 },
    "water-spout": { status: `wet`, statusChance: 0.6 },
    "sacred-sword": { count: 2, spread: 0.3, dmgMul: 0.7 },
    "razor-shell": { count: 2, dmgMul: 0.75 },
    "thunder-fang": { status: `paralysis`, statusChance: 0.35 },
    "dual-wingbeat": { count: 2, dmgMul: 1.8 },
    "iron-head": { status: `stun`, statusChance: 0.3 },
    "dragon-ascent": { dmgMul: 1.1 },
    "freeze-dry": { status: `freeze`, statusChance: 0.4 },
    mist: { status: `freeze`, statusChance: 0.35 },
    "bleakwind-storm": { status: `freeze`, statusChance: 0.3 },
    glaciate: { status: `freeze`, statusChance: 0.6 },
    "bolt-beak": { status: `paralysis`, statusChance: 0.25 },
    "wildbolt-storm": { status: `paralysis`, statusChance: 0.35 },
    thunderclap: { count: 3, dmgMul: 0.65, status: `paralysis`, statusChance: 0.5 },
    "electro-shot": { status: `paralysis`, statusChance: 0.25 },
    incinerate: { status: `burn`, statusChance: 0.4 },
    fly: { dmgMul: 1.1 },
    "searing-shot": { status: `burn`, statusChance: 0.5 },
    overheat: { status: `burn`, statusChance: 0.6 },
    "psycho-cut": { count: 2, spread: 0.25, dmgMul: 0.7 },
    psystrike: { status: `confusion`, statusChance: 0.3 },
    "psycho-boost": { dmgMul: 1.15 },
  },
  g_ = {
    bolt: {
      dmg: 13,
      cd: 1,
      count: 1,
      area: 0.5,
      speed: 24,
      dur: 0.8,
      pierce: 0,
      label: c(`Proyectil`),
      desc: c(`Dispara proyectiles al enemigo más cercano.`),
      stats: [`dmg`, `cd`, `count`, `pierce`, `speed`, `crit`, `bounce`],
    },
    orb: {
      dmg: 15,
      cd: 1.5,
      count: 1,
      area: 2.6,
      speed: 17,
      dur: 1.05,
      pierce: 0,
      label: c(`Esfera explosiva`),
      desc: c(`Lanza una esfera que explota al impactar.`),
      stats: [`dmg`, `cd`, `count`, `area`, `speed`, `status`],
    },
    lob: {
      dmg: 20,
      cd: 1.9,
      count: 1,
      area: 3.2,
      speed: 15,
      dur: 3,
      pierce: 0,
      label: c(`Bomba`),
      desc: c(`Lanza una bomba en parábola que explota en área.`),
      stats: [`dmg`, `cd`, `count`, `area`, `status`],
    },
    barrage: {
      dmg: 5,
      cd: 1.15,
      count: 4,
      area: 0.35,
      speed: 30,
      dur: 0.6,
      pierce: 0,
      label: c(`Ráfaga`),
      desc: c(`Dispara una ráfaga rápida de proyectiles.`),
      stats: [`dmg`, `cd`, `count`, `pierce`, `crit`, `speed`],
    },
    homing: {
      dmg: 9,
      cd: 1.25,
      count: 2,
      area: 0.5,
      speed: 15,
      dur: 1.6,
      pierce: 0,
      label: c(`Teledirigido`),
      desc: c(`Proyectiles que persiguen a sus objetivos. Nunca fallan.`),
      stats: [`dmg`, `cd`, `count`, `speed`, `crit`],
    },
    beam: {
      dmg: 7,
      cd: 2.2,
      count: 1,
      area: 1.1,
      speed: 18,
      dur: 0.45,
      pierce: 99,
      label: c(`Rayo`),
      desc: c(`Dispara un rayo continuo que atraviesa todo.`),
      stats: [`dmg`, `cd`, `area`, `dur`, `count`, `crit`],
    },
    cone: {
      dmg: 3.2,
      cd: 2,
      count: 1,
      area: 7,
      speed: 0,
      dur: 1,
      pierce: 99,
      label: c(`Cono`),
      desc: c(`Lanza un torrente en cono frente a ti.`),
      stats: [`dmg`, `cd`, `area`, `dur`, `status`],
    },
    nova: {
      dmg: 22,
      cd: 2.6,
      count: 1,
      area: 6.5,
      speed: 0,
      dur: 0,
      pierce: 99,
      label: c(`Onda expansiva`),
      desc: c(`Libera una onda que golpea todo a tu alrededor.`),
      stats: [`dmg`, `cd`, `area`, `status`, `crit`],
    },
    aura: {
      dmg: 4.5,
      cd: 0.45,
      count: 1,
      area: 3.6,
      speed: 0,
      dur: 0,
      pierce: 99,
      label: c(`Aura`),
      desc: c(`Un aura que daña continuamente a los cercanos.`),
      stats: [`dmg`, `cd`, `area`, `status`],
    },
    orbit: {
      dmg: 9,
      cd: 5.5,
      count: 2,
      area: 3.2,
      speed: 3.2,
      dur: 4,
      pierce: 99,
      label: c(`Órbita`),
      desc: c(`Objetos que giran a tu alrededor golpeando enemigos.`),
      stats: [`dmg`, `count`, `area`, `dur`, `speed`, `cd`],
    },
    strike: {
      dmg: 17,
      cd: 0.95,
      count: 1,
      area: 3.3,
      speed: 0,
      dur: 0,
      pierce: 99,
      label: c(`Golpe`),
      desc: c(`Un golpe en arco contra el enemigo más cercano.`),
      stats: [`dmg`, `cd`, `area`, `count`, `crit`],
    },
    dash: {
      dmg: 20,
      cd: 2.3,
      count: 1,
      area: 1.8,
      speed: 13,
      dur: 0,
      pierce: 99,
      label: c(`Embestida`),
      desc: c(`Una embestida que arrasa en línea recta.`),
      stats: [`dmg`, `cd`, `area`, `count`, `speed`, `crit`],
    },
    chain: {
      dmg: 13,
      cd: 1.4,
      count: 3,
      area: 8,
      speed: 0,
      dur: 0,
      pierce: 0,
      label: c(`Cadena`),
      desc: c(`Golpea a un enemigo y salta a otros cercanos.`),
      stats: [`dmg`, `cd`, `count`, `area`, `status`],
    },
    smite: {
      dmg: 24,
      cd: 1.7,
      count: 2,
      area: 1.9,
      speed: 0,
      dur: 0,
      pierce: 99,
      label: c(`Impacto celeste`),
      desc: c(`Golpes caen del cielo sobre enemigos cercanos.`),
      stats: [`dmg`, `cd`, `count`, `area`, `crit`],
    },
    meteor: {
      dmg: 45,
      cd: 4,
      count: 1,
      area: 4.2,
      speed: 0,
      dur: 0.7,
      pierce: 99,
      label: c(`Meteoro`),
      desc: c(`Invoca un meteoro devastador tras un instante.`),
      stats: [`dmg`, `cd`, `count`, `area`, `status`],
    },
    boomerang: {
      dmg: 14,
      cd: 1.7,
      count: 1,
      area: 0.8,
      speed: 17,
      dur: 1.3,
      pierce: 99,
      label: c(`Bumerán`),
      desc: c(`Lanza algo que va y vuelve atravesando enemigos.`),
      stats: [`dmg`, `cd`, `count`, `area`, `speed`, `crit`],
    },
    trap: {
      dmg: 30,
      cd: 2.6,
      count: 2,
      area: 3,
      speed: 0,
      dur: 14,
      pierce: 0,
      label: c(`Trampa`),
      desc: c(`Coloca trampas que explotan al contacto.`),
      stats: [`dmg`, `cd`, `count`, `area`, `dur`],
    },
    vortex: {
      dmg: 34,
      cd: 3.6,
      count: 1,
      area: 5,
      speed: 7,
      dur: 2.2,
      pierce: 99,
      label: c(`Vórtice`),
      desc: c(`Un remolino que atrae enemigos y luego estalla.`),
      stats: [`dmg`, `cd`, `area`, `dur`, `count`],
    },
    wave: {
      dmg: 15,
      cd: 2.4,
      count: 1,
      area: 4,
      speed: 13,
      dur: 1.1,
      pierce: 99,
      label: c(`Ola`),
      desc: c(`Una ola ancha que barre todo a su paso.`),
      stats: [`dmg`, `cd`, `area`, `speed`, `count`, `status`],
    },
    trail: {
      dmg: 6,
      cd: 0.28,
      count: 1,
      area: 1.7,
      speed: 0,
      dur: 3,
      pierce: 99,
      label: c(`Estela`),
      desc: c(`Dejas una estela dañina al moverte.`),
      stats: [`dmg`, `area`, `dur`, `status`],
    },
    drain: {
      dmg: 10,
      cd: 1.3,
      count: 1,
      area: 0.5,
      speed: 18,
      dur: 1.1,
      pierce: 0,
      label: c(`Drenaje`),
      desc: c(`Proyectiles que roban vida al impactar.`),
      stats: [`dmg`, `cd`, `count`, `speed`],
    },
    spin: {
      dmg: 9,
      cd: 0.8,
      count: 1,
      area: 3.2,
      speed: 0,
      dur: 0,
      pierce: 99,
      label: c(`Giro`),
      desc: c(`Giras golpeando y empujando a todos a tu alrededor.`),
      stats: [`dmg`, `cd`, `area`, `crit`],
    },
    weather: {
      dmg: 0,
      cd: 32,
      count: 1,
      area: 0,
      speed: 0,
      dur: 14,
      pierce: 0,
      label: c(`Clima`),
      desc: c(`Cambia el clima: potencia ciertos tipos.`),
      stats: [`cd`, `dur`],
    },
    buff: {
      dmg: 0,
      cd: 14,
      count: 1,
      area: 0,
      speed: 0,
      dur: 6,
      pierce: 0,
      label: c(`Potenciador`),
      desc: c(`Te potencia temporalmente.`),
      stats: [`cd`, `dur`],
    },
    random: {
      dmg: 0,
      cd: 4.5,
      count: 0,
      area: 1,
      speed: 1,
      dur: 1,
      pierce: 0,
      label: c(`Aleatorio`),
      desc: c(`Cada pocos segundos se convierte en un ataque al azar de la Liga, con sus mejoras.`),
      stats: [`dmg`, `cd`, `count`, `area`, `dur`, `crit`, `status`],
    },
    fusion: {
      dmg: 17,
      cd: 3,
      count: 0,
      area: 1,
      speed: 1,
      dur: 1,
      pierce: 99,
      label: c(`Fusión`),
      desc: c(`Dos movimientos fundidos en la Máquina de Bill.`),
      stats: [`dmg`, `cd`, `area`, `count`, `dur`, `crit`],
    },
  },
  __ = { "rain-dance": `rain`, "sunny-day": `sun`, sandstorm: `sand`, hail: `hail`, snowscape: `hail` },
  v_ = new Set([
    `swords-dance`,
    `nasty-plot`,
    `calm-mind`,
    `dragon-dance`,
    `quiver-dance`,
    `agility`,
    `bulk-up`,
    `shell-smash`,
    `growth`,
    `work-up`,
    `hone-claws`,
    `coil`,
    `shift-gear`,
    `tail-glow`,
    `rock-polish`,
    `autotomize`,
    `victory-dance`,
    `tidy-up`,
  ]),
  y_ = new Set([`spikes`, `toxic-spikes`, `stealth-rock`, `sticky-web`]),
  b_ = {
    "wind-ring-wave": `vortex`,
    metronome: `random`,
    "cotton-spore": `cone`,
    "razor-wind": `wave`,
    outrage: `nova`,
    "foul-play": `smite`,
    "power-gem": `barrage`,
    "bone-rush": `orbit`,
    "sleep-powder": `cone`,
    sing: `nova`,
    flail: `strike`,
    "low-kick": `spin`,
    "dynamic-punch": `nova`,
    pound: `strike`,
    "force-palm": `strike`,
    "feather-dance": `homing`,
    wrap: `spin`,
    "horn-drill": `dash`,
    gravity: `vortex`,
    "stun-spore": `cone`,
    spore: `trap`,
    supersonic: `homing`,
    fissure: `wave`,
    "pay-day": `barrage`,
    "fake-out": `strike`,
    assurance: `dash`,
    soak: `cone`,
    "seismic-toss": `smite`,
    "final-gambit": `meteor`,
    hypnosis: `homing`,
    "circle-throw": `spin`,
    submission: `dash`,
    slam: `strike`,
    "gastro-acid": `lob`,
    thunderbolt: `chain`,
    discharge: `nova`,
    thunder: `smite`,
    spark: `dash`,
    "thunder-shock": `bolt`,
    "shock-wave": `homing`,
    "volt-switch": `boomerang`,
    "electro-ball": `orb`,
    "zap-cannon": `orb`,
    "thunder-punch": `strike`,
    "charge-beam": `beam`,
    "parabolic-charge": `aura`,
    "wild-charge": `dash`,
    "volt-tackle": `dash`,
    nuzzle: `strike`,
    electroweb: `cone`,
    "rising-voltage": `smite`,
    "thunder-cage": `vortex`,
    flamethrower: `cone`,
    "fire-blast": `orb`,
    ember: `bolt`,
    "fire-spin": `vortex`,
    "heat-wave": `cone`,
    eruption: `nova`,
    overheat: `meteor`,
    "flare-blitz": `dash`,
    "flame-charge": `dash`,
    "fire-punch": `strike`,
    "fire-fang": `strike`,
    "lava-plume": `nova`,
    inferno: `orb`,
    "blast-burn": `meteor`,
    "mystical-fire": `homing`,
    "magma-storm": `vortex`,
    "blue-flare": `meteor`,
    "fiery-dance": `spin`,
    "burn-up": `nova`,
    "pyro-ball": `lob`,
    "flame-burst": `orb`,
    "sacred-fire": `meteor`,
    "will-o-wisp": `homing`,
    incinerate: `cone`,
    "searing-shot": `nova`,
    "torch-song": `homing`,
    "armor-cannon": `beam`,
    "water-gun": `bolt`,
    bubble: `barrage`,
    "bubble-beam": `barrage`,
    "hydro-pump": `beam`,
    surf: `wave`,
    "muddy-water": `wave`,
    "water-pulse": `orb`,
    "aqua-jet": `dash`,
    waterfall: `dash`,
    whirlpool: `vortex`,
    brine: `orb`,
    scald: `cone`,
    "water-spout": `nova`,
    "hydro-cannon": `meteor`,
    "aqua-tail": `strike`,
    liquidation: `strike`,
    "water-shuriken": `barrage`,
    "sparkling-aria": `nova`,
    "origin-pulse": `nova`,
    "steam-eruption": `nova`,
    "snipe-shot": `bolt`,
    "aqua-ring": `aura`,
    "wave-crash": `dash`,
    "jet-punch": `strike`,
    "aqua-step": `spin`,
    "chilling-water": `cone`,
    "vine-whip": `strike`,
    "razor-leaf": `barrage`,
    "solar-beam": `beam`,
    "petal-dance": `orbit`,
    "leaf-storm": `nova`,
    "magical-leaf": `homing`,
    "giga-drain": `drain`,
    "mega-drain": `drain`,
    absorb: `drain`,
    "leech-life": `drain`,
    "energy-ball": `orb`,
    "seed-bomb": `lob`,
    "leaf-blade": `boomerang`,
    "bullet-seed": `barrage`,
    "wood-hammer": `strike`,
    "power-whip": `spin`,
    "frenzy-plant": `meteor`,
    "petal-blizzard": `nova`,
    leafage: `bolt`,
    "grass-knot": `smite`,
    "trop-kick": `strike`,
    "seed-flare": `beam`,
    "horn-leech": `strike`,
    "apple-acid": `lob`,
    "grav-apple": `meteor`,
    "spirit-break": `strike`,
    "leaf-tornado": `vortex`,
    "grassy-glide": `dash`,
    "flower-trick": `homing`,
    "solar-blade": `strike`,
    "ice-beam": `beam`,
    blizzard: `cone`,
    "icy-wind": `cone`,
    "powder-snow": `cone`,
    "ice-shard": `bolt`,
    "icicle-spear": `barrage`,
    "icicle-crash": `smite`,
    avalanche: `meteor`,
    "ice-punch": `strike`,
    "ice-fang": `strike`,
    "frost-breath": `cone`,
    "freeze-dry": `orb`,
    "sheer-cold": `nova`,
    glaciate: `wave`,
    "ice-ball": `boomerang`,
    "aurora-beam": `beam`,
    "triple-axel": `spin`,
    "ice-spinner": `spin`,
    "mountain-gale": `meteor`,
    psychic: `nova`,
    psybeam: `beam`,
    confusion: `bolt`,
    psyshock: `orb`,
    "future-sight": `meteor`,
    "psycho-cut": `boomerang`,
    "zen-headbutt": `dash`,
    extrasensory: `homing`,
    "dream-eater": `drain`,
    "stored-power": `homing`,
    psystrike: `beam`,
    "expanding-force": `nova`,
    "psychic-fangs": `strike`,
    "mist-ball": `orb`,
    "luster-purge": `orb`,
    "prismatic-laser": `beam`,
    "photon-geyser": `beam`,
    "esper-wing": `boomerang`,
    "lumina-crash": `nova`,
    "shadow-ball": `orb`,
    "shadow-claw": `strike`,
    "night-shade": `homing`,
    hex: `chain`,
    "ominous-wind": `cone`,
    "shadow-sneak": `dash`,
    "phantom-force": `dash`,
    poltergeist: `smite`,
    astonish: `bolt`,
    lick: `strike`,
    "shadow-punch": `homing`,
    "spirit-shackle": `boomerang`,
    "moongeist-beam": `beam`,
    "shadow-bone": `boomerang`,
    "bitter-malice": `cone`,
    "infernal-parade": `orbit`,
    "last-respects": `meteor`,
    "dragon-breath": `cone`,
    "dragon-pulse": `beam`,
    "draco-meteor": `meteor`,
    "dragon-claw": `strike`,
    "dragon-rush": `dash`,
    "dragon-rage": `homing`,
    "dual-chop": `strike`,
    "spacial-rend": `wave`,
    "roar-of-time": `nova`,
    "dragon-tail": `strike`,
    "dragon-darts": `homing`,
    "dynamax-cannon": `beam`,
    "breaking-swipe": `strike`,
    "scale-shot": `barrage`,
    "dragon-energy": `beam`,
    "clanging-scales": `nova`,
    "core-enforcer": `wave`,
    "dark-pulse": `nova`,
    "night-slash": `strike`,
    "sucker-punch": `dash`,
    snarl: `cone`,
    "knock-off": `boomerang`,
    "throat-chop": `strike`,
    pursuit: `homing`,
    "feint-attack": `homing`,
    "fiery-wrath": `nova`,
    "darkest-lariat": `spin`,
    "wicked-blow": `strike`,
    "kowtow-cleave": `strike`,
    "ceaseless-edge": `trap`,
    earthquake: `nova`,
    magnitude: `nova`,
    bulldoze: `nova`,
    dig: `dash`,
    "mud-slap": `bolt`,
    "mud-shot": `bolt`,
    "mud-bomb": `lob`,
    "earth-power": `smite`,
    "bone-club": `strike`,
    bonemerang: `boomerang`,
    "sand-tomb": `vortex`,
    "drill-run": `dash`,
    "high-horsepower": `dash`,
    "precipice-blades": `nova`,
    "thousand-arrows": `smite`,
    "thousand-waves": `wave`,
    "scorching-sands": `cone`,
    "stomping-tantrum": `nova`,
    "headlong-rush": `dash`,
    "land-s-wrath": `nova`,
    "sandsear-storm": `vortex`,
    "rock-throw": `lob`,
    "rock-slide": `smite`,
    "stone-edge": `orbit`,
    "rock-tomb": `smite`,
    "rock-blast": `barrage`,
    "ancient-power": `orbit`,
    rollout: `boomerang`,
    "head-smash": `dash`,
    "rock-wrecker": `meteor`,
    "diamond-storm": `nova`,
    "meteor-beam": `beam`,
    "stone-axe": `trap`,
    accelerock: `dash`,
    "salt-cure": `aura`,
    "flash-cannon": `beam`,
    "iron-tail": `strike`,
    "metal-claw": `strike`,
    "steel-wing": `boomerang`,
    "bullet-punch": `barrage`,
    "iron-head": `dash`,
    "meteor-mash": `meteor`,
    "gyro-ball": `spin`,
    "mirror-shot": `orb`,
    "magnet-bomb": `homing`,
    "doom-desire": `meteor`,
    "heavy-slam": `nova`,
    "steel-beam": `beam`,
    "sunsteel-strike": `dash`,
    "behemoth-blade": `strike`,
    "steel-roller": `trail`,
    "make-it-rain": `smite`,
    "gigaton-hammer": `nova`,
    "spin-out": `spin`,
    "smart-strike": `homing`,
    "anchor-shot": `boomerang`,
    gust: `vortex`,
    "wing-attack": `boomerang`,
    "air-slash": `boomerang`,
    "aerial-ace": `homing`,
    hurricane: `vortex`,
    "brave-bird": `dash`,
    peck: `strike`,
    "drill-peck": `smite`,
    fly: `dash`,
    "air-cutter": `barrage`,
    "sky-attack": `meteor`,
    acrobatics: `dash`,
    aeroblast: `beam`,
    "bleakwind-storm": `cone`,
    "dual-wingbeat": `barrage`,
    "oblivion-wing": `drain`,
    bounce: `smite`,
    pluck: `strike`,
    "sludge-bomb": `lob`,
    sludge: `orb`,
    "sludge-wave": `wave`,
    "poison-sting": `bolt`,
    "poison-jab": `strike`,
    "cross-poison": `boomerang`,
    acid: `cone`,
    "acid-spray": `lob`,
    "gunk-shot": `meteor`,
    venoshock: `chain`,
    smog: `aura`,
    "poison-fang": `strike`,
    belch: `cone`,
    "clear-smog": `orb`,
    "mortal-spin": `spin`,
    "barb-barrage": `barrage`,
    "noxious-torque": `dash`,
    toxic: `homing`,
    "poison-gas": `aura`,
    "poison-powder": `cone`,
    "bug-buzz": `nova`,
    "x-scissor": `boomerang`,
    "signal-beam": `beam`,
    "pin-missile": `barrage`,
    twineedle: `barrage`,
    "u-turn": `boomerang`,
    megahorn: `dash`,
    "silver-wind": `cone`,
    "struggle-bug": `cone`,
    "attack-order": `homing`,
    "fury-cutter": `strike`,
    lunge: `dash`,
    "leech-life#": `drain`,
    "fell-stinger": `bolt`,
    "pollen-puff": `lob`,
    "first-impression": `dash`,
    "skitter-smack": `strike`,
    pounce: `dash`,
    "bug-bite": `strike`,
    "string-shot": `cone`,
    "close-combat": `spin`,
    "aura-sphere": `homing`,
    "focus-blast": `orb`,
    "brick-break": `strike`,
    "karate-chop": `strike`,
    "cross-chop": `strike`,
    "mach-punch": `barrage`,
    "vacuum-wave": `bolt`,
    "drain-punch": `drain`,
    "hammer-arm": `nova`,
    "high-jump-kick": `dash`,
    "sky-uppercut": `strike`,
    superpower: `nova`,
    "rock-smash": `strike`,
    "arm-thrust": `barrage`,
    "secret-sword": `boomerang`,
    "sacred-sword": `boomerang`,
    "triple-kick": `barrage`,
    "body-press": `nova`,
    "axe-kick": `smite`,
    "collision-course": `meteor`,
    "rage-fist": `homing`,
    "thunderous-kick": `strike`,
    moonblast: `orb`,
    "dazzling-gleam": `nova`,
    "fairy-wind": `cone`,
    "draining-kiss": `drain`,
    "disarming-voice": `nova`,
    "misty-explosion": `nova`,
    "fleur-cannon": `beam`,
    "strange-steam": `cone`,
    "light-of-ruin": `beam`,
    "spirit-break#": `strike`,
    "magical-torque": `homing`,
    "alluring-voice": `homing`,
    tackle: `dash`,
    "quick-attack": `dash`,
    "body-slam": `nova`,
    "hyper-beam": `beam`,
    "giga-impact": `meteor`,
    swift: `homing`,
    "tri-attack": `chain`,
    "hyper-voice": `nova`,
    boomburst: `nova`,
    "double-edge": `dash`,
    slash: `strike`,
    scratch: `strike`,
    cut: `strike`,
    headbutt: `strike`,
    stomp: `nova`,
    explosion: `nova`,
    "self-destruct": `nova`,
    "rapid-spin": `spin`,
    "egg-bomb": `lob`,
    round: `homing`,
    "echoed-voice": `nova`,
    uproar: `aura`,
    "fury-swipes": `barrage`,
    "fury-attack": `barrage`,
    "double-slap": `barrage`,
    "comet-punch": `barrage`,
    "spike-cannon": `barrage`,
    barrage: `barrage`,
    "tail-slap": `barrage`,
    facade: `strike`,
    return: `strike`,
    frustration: `strike`,
    "crush-claw": `strike`,
    "horn-attack": `strike`,
    "mega-punch": `strike`,
    "mega-kick": `strike`,
    rage: `spin`,
    thrash: `spin`,
    judgment: `nova`,
    "techno-blast": `beam`,
    "relic-song": `nova`,
    "multi-attack": `strike`,
    "last-resort": `meteor`,
    "hyper-fang": `strike`,
    "super-fang": `chain`,
    covet: `strike`,
    "boomburst#": `nova`,
    "blood-moon": `beam`,
    "population-bomb": `barrage`,
    "revelation-dance": `homing`,
    "weather-ball": `orb`,
  },
  x_ = {
    outrage: { pulses: 3 },
    "shadow-bone": { count: 3, spread: 0.32, dmgMul: 0.7 },
    "cotton-spore": { statusChance: 0.3 },
    "string-shot": { status: `root`, statusChance: 0.35 },
    "feather-dance": { count: 3, status: `charm`, statusChance: 0.3 },
    wrap: { statusChance: 0.3 },
    "double-kick": { count: 2, dmgMul: 1.8 },
    "poison-jab": { count: 2, dmgMul: 0.75 },
    "horn-drill": { dmgMul: 1.25 },
    gravity: { status: `stun`, statusChance: 0.4 },
    "petal-dance": { count: 3 },
    "stun-spore": { statusChance: 0.35 },
    spore: { statusChance: 1 },
    supersonic: { statusChance: 0.4 },
    "mud-shot": { status: `root`, statusChance: 0.25 },
    fissure: { dmgMul: 1.3, status: `stun`, statusChance: 0.35 },
    "pay-day": { count: 5, dmgMul: 0.8 },
    "fake-out": { status: `stun`, statusChance: 0.6 },
    soak: { status: `wet`, statusChance: 1, dmgMul: 1.2 },
    "seismic-toss": { status: `stun`, statusChance: 0.5 },
    "final-gambit": { dmgMul: 1.15 },
    hypnosis: { statusChance: 0.45 },
    "circle-throw": { status: `knock`, statusChance: 1 },
    "gastro-acid": { status: `curse`, statusChance: 0.8 },
    "knock-off": { status: `knock`, statusChance: 0.5 },
    venoshock: { status: `poison`, statusChance: 0.35 },
  };
for (let e of [t_, i_, s_, u_, p_]) (Object.assign(b_, e.OVERRIDES), Object.assign(x_, e.SPECIAL));
var S_ = [
    [/beam|laser|cannon|ray$/, `beam`],
    [/punch|claw|slash|fang|bite|kick|chop|cut|tail|horn|jab|hammer|smash|strike|blade|edge$/, `strike`],
    [/quake|wave$|burst|eruption|explosion|blast$/, `nova`],
    [/breath|wind$|powder|spray/, `cone`],
    [/meteor|comet|star|fall/, `meteor`],
    [/storm|tornado|spin$|whirl|vortex|tomb/, `vortex`],
    [/bomb/, `lob`],
    [/ball|orb|sphere|pulse/, `orb`],
    [/rush|charge|tackle|dash|impact|crash|ram|slam/, `dash`],
    [/spike|trap|mine/, `trap`],
    [/thunder|bolt|lightning/, `chain`],
    [/drain|leech|absorb/, `drain`],
    [/rang|boomerang|disc/, `boomerang`],
  ],
  C_ = {
    normal: [`strike`, `homing`],
    fighting: [`strike`, `homing`],
    flying: [`boomerang`, `vortex`],
    poison: [`strike`, `lob`],
    ground: [`strike`, `nova`],
    rock: [`strike`, `smite`],
    bug: [`strike`, `barrage`],
    ghost: [`strike`, `homing`],
    steel: [`strike`, `beam`],
    fire: [`strike`, `orb`],
    water: [`dash`, `bolt`],
    grass: [`strike`, `barrage`],
    electric: [`strike`, `chain`],
    psychic: [`dash`, `homing`],
    ice: [`strike`, `bolt`],
    dragon: [`strike`, `beam`],
    dark: [`strike`, `orb`],
    fairy: [`strike`, `orb`],
  },
  w_ = new Map(),
  T_ = new Map();
function E_(e) {
  let t = k.movesByKey.get(e)?.id;
  if (t != null) return O_(t);
  if (e.startsWith(`fu-`)) {
    for (let t of w_.values()) if (t.key === e) return t;
  }
  return null;
}
function D_(e) {
  if (e.cls === `status`)
    return __[e.key]
      ? `weather`
      : v_.has(e.key)
        ? `buff`
        : y_.has(e.key)
          ? `trap`
          : b_[e.key]
            ? b_[e.key]
            : null;
  if (b_[e.key]) return b_[e.key];
  if ((e.power ?? 0) <= 0 && !e.key.includes(`drain`) && e.cls === `physical`) return `strike`;
  if (e.drain > 0) return `drain`;
  if ((e.maxHits ?? 1) >= 2) return `barrage`;
  for (let [t, n] of S_) if (t.test(e.key)) return n;
  if (e.accuracy == null && e.cls === `special`) return `homing`;
  let t = C_[e.type] ?? [`strike`, `bolt`];
  return e.cls === `physical` ? t[0] : t[1];
}
function O_(e) {
  if (!moveAvailableForSpecies(e)) return null;
  let t = w_.get(e);
  if (t) return t;
  if (T_.has(e)) return T_.get(e);
  let n = k.moves.get(e);
  if (!n) return (T_.set(e, null), null);
  let r = D_(n);
  if (!r) return (T_.set(e, null), null);
  let i = g_[r],
    a = n.power ?? 70,
    o = Gs(0.72 + a / 260, 0.85, 1.3),
    s = Gs(0.88 + (a - 60) / 500, 0.85, 1.15) * (n.priority > 0 ? 0.85 : 1),
    c = $g(n.ailment),
    l = c ? Gs(((n.ailmentChance || 30) / 100) * 1.6, 0.15, 0.8) : 0;
  (c || ((c = Zg[n.type]), (l = 0.12)), n.cls === `status` && (l = 0.8));
  let u = {
    id: e,
    key: n.key,
    name: n.name,
    type: n.type,
    cls: n.cls === `status` ? `special` : n.cls,
    arch: r,
    dmg: i.dmg * o,
    cd: i.cd * s,
    count: i.count,
    area: i.area,
    speed: i.speed,
    dur: i.dur,
    pierce: i.pierce,
    status: c,
    statusChance: l,
    drain: n.drain > 0 ? Gs((n.drain / 100) * 0.3, 0.05, 0.25) : r === `drain` ? 0.12 : 0,
    critBonus: n.crit >= 1 ? 0.15 : 0,
    flinch: n.flinch / 100,
    power: a,
    weather: __[n.key],
    buff: v_.has(n.key) ? n.key : void 0,
    desc: ``,
  };
  n.cls === `status` && r === `trap` && (u.dmg = i.dmg * 0.9);
  let d = x_[n.key];
  return (
    d &&
      (d.count && (u.count = d.count),
      d.spread && (u.spread = d.spread),
      d.pulses && (u.pulses = d.pulses),
      d.dmgMul && (u.dmg *= d.dmgMul),
      d.status !== void 0 && (u.status = d.status),
      d.statusChance != null && (u.statusChance = d.statusChance)),
    (u.desc = k_(u)),
    T_.set(e, u),
    u
  );
}
function formMove(id, species) {
  if (!moveAvailableForSpecies(id, species)) return null;
  const def = O_(id);
  if (!def || def.fusion) return def;
  if(id===488&&[4,5,6].includes(Number(species)))return {...def,name:"烈焰狂奔",
    desc:"放出当前字形的烈焰残影，在敌人间折返冲刺，沿途留下燃烧火焰，末端爆炸。",
    dmg:g_.fusion.dmg*.94,cd:fireStampedeRecipe.cd,castRecipe:fireStampedeRecipe};
  const name = moveCopy(species, def.name, def.key);
  const effectKey = windMoveEffect(def.key,species);
  if(effectKey==='wind-air-slash')return {...def,name,effectKey,arch:'strike',area:6,dur:.42,speed:0,count:1,desc:'横斩出一道与字形同色的弧形风波，向远处飞行，沿途每个敌人只受击一次。'};
  if(effectKey==='wind-gust')return {...def,name,effectKey,dur:1.2,speed:10,desc:'向前吹出一道旋风，牵引并伤害沿途的敌人。'};
  if(effectKey==='wind-feather-dance')return {...def,name:'羽毛舞',effectKey,count:3,spread:.28,desc:'射出三枚青色羽毛追击敌人，命中时迸开碎羽。'};
  if(effectKey)return {...def,name,effectKey};
  return name === def.name ? def : {...def, name};
}
function k_(e) {
  let t = g_[e.arch].desc;
  return (
    e.weather &&
      (t = {
        rain: c(`Invoca lluvia: potencia Agua y Eléctrico, moja a los enemigos.`),
        sun: c(`Invoca sol: potencia Fuego y Planta.`),
        sand: c(`Tormenta de arena: daña a los enemigos y potencia Roca/Tierra.`),
        hail: c(`Granizo: daña y congela poco a poco a los enemigos.`),
      }[e.weather]),
    e.buff && (t = c(`Te potencia: +daño, +velocidad de ataque y +velocidad durante unos segundos.`)),
    e.arch === `random` ||
      (e.pulses && (t = c(`Libera {n} ondas expansivas seguidas a tu alrededor.`, { n: e.pulses })),
      e.count > 1 &&
        e.arch === `boomerang` &&
        (t = c(`Lanza {n} proyectiles en abanico que van y vuelven atravesando enemigos.`, { n: e.count })),
      e.status &&
        e.statusChance >= 0.12 &&
        e.arch !== `weather` &&
        e.arch !== `buff` &&
        (t += ` ` + c(`Puede causar {status}.`, { status: Qg[e.status]?.toLowerCase() ?? e.status })),
      e.drain > 0 && e.arch !== `drain` && (t += ` ` + c(`Roba vida.`)),
      e.critBonus > 0 && (t += ` ` + c(`Crítico elevado.`))),
    t
  );
}
function A_(e) {
  let t = new Set(),
    n = k.get(e),
    r = [n];
  for (; n.evoFrom != null && k.byId.has(n.evoFrom); ) ((n = k.get(n.evoFrom)), r.push(n));
  for (let e of r) for (let [n] of k.learnset(e.id)) O_(n) && t.add(n);
  return [...t];
}
function j_(e) {
  let t = k.get(e),
    n = [...k.learnset(e)],
    r = t;
  for (; r.evoFrom != null && k.byId.has(r.evoFrom); ) ((r = k.get(r.evoFrom)), n.push(...k.learnset(r.id)));
  let i = -1,
    a = -1;
  for (let [e, r] of n) {
    let n = O_(e);
    if (!n || n.arch === `weather` || n.arch === `buff` || n.arch === `trap`) continue;
    let o = k.moves.get(e),
      s = (t.types.includes(o.type) ? 100 : 0) - r * 1.5 + (o.power ?? 40) * 0.2;
    (o.type === `normal` && !t.types.includes(`normal`) && (s -= 40), s > a && ((a = s), (i = e)));
  }
  if (i < 0) {
    for (let e of k.moves.values()) {
      let n = O_(e.id);
      if (n && e.type === t.types[0] && n.arch !== `weather` && n.arch !== `buff`) return e.id;
    }
    return 33;
  }
  return i;
}
var M_ = class {
    def;
    level = 1;
    _timer = 0.4;
    cooldownTotal = 0.4;
    waitingForTarget = false;
    get timer() { return this._timer; }
    set timer(value) {
      if(value>this._timer&&value>0){this.cooldownTotal=value;this.waitingForTarget=false;}
      this._timer=value;
    }
    damageDone = 0;
    mods = { dmg: 1, cd: 1, count: 0, area: 1, speed: 1, dur: 1, pierce: 0, crit: 0, status: 1, bounce: 0 };
    phase = 0;
    active = 0;
    tick = 0;
    aimX = 0;
    aimZ = 1;
    charging = !1;
    orbHits = new Map();
    burst = [];
    sub = null;
    swapT = 0;
    parents = [];
    extra = [];
    constructor(e) {
      this.def = e;
    }
    get name() {
      return this.def.name;
    }
  },
  N_ = {
    dmg: (e) => c(`+{pct}% daño`, { pct: Math.round(e * 100) }),
    cd: (e) => c(`-{pct}% recarga`, { pct: Math.round(e * 100) }),
    count: (e) => c(e === 1 ? `+{n} proyectil` : `+{n} proyectiles`, { n: e }),
    area: (e) => c(`+{pct}% área`, { pct: Math.round(e * 100) }),
    speed: (e) => c(`+{pct}% velocidad`, { pct: Math.round(e * 100) }),
    dur: (e) => c(`+{pct}% duración`, { pct: Math.round(e * 100) }),
    pierce: (e) => c(`+{n} perforación`, { n: e }),
    crit: (e) => c(`+{pct}% crítico`, { pct: Math.round(e * 100) }),
    status: (e) => c(`+{pct}% prob. de estado`, { pct: Math.round(e * 100) }),
    bounce: (e) => c(`+{n} rebote`, { n: e }),
  };
function P_(e, t) {
  let n = e.def.effectKey==='wind-air-slash' ? ['dmg','cd','area','crit'] : g_[e.def.arch].stats.slice(),
    r = [],
    i = t >= 1.6 ? 3 : 2;
  for (let e = 0; e < i && n.length; e++) {
    let e = n.splice(Math.floor(Math.random() * n.length), 1)[0],
      i;
    switch (e) {
      case `dmg`:
        i = 0.22 * t;
        break;
      case `cd`:
        i = Math.min(0.25, 0.08 * t);
        break;
      case `count`:
        i = t >= 1.6 ? 2 : 1;
        break;
      case `pierce`:
      case `bounce`:
        i = Math.max(1, Math.round(t));
        break;
      case `area`:
        i = 0.15 * t;
        break;
      case `speed`:
        i = 0.15 * t;
        break;
      case `dur`:
        i = 0.2 * t;
        break;
      case `crit`:
        i = 0.05 * t;
        break;
      case `status`:
        i = 0.25 * t;
    }
    r.push({ key: e, value: i, label: N_[e](i) });
  }
  return r;
}
function F_(e, t) {
  (e.level >= (e.def.fusion ? 5 : 8) && e.extra.push(t.map((e) => ({ key: e.key, value: e.value }))),
    e.level++,
    (e.mods.dmg += 0.08));
  for (let n of t)
    switch (n.key) {
      case `dmg`:
        e.mods.dmg += n.value;
        break;
      case `cd`:
        e.mods.cd *= 1 - n.value;
        break;
      case `count`:
        e.mods.count += n.value;
        break;
      case `pierce`:
        e.mods.pierce += n.value;
        break;
      case `bounce`:
        e.mods.bounce += n.value;
        break;
      case `area`:
        e.mods.area += n.value;
        break;
      case `speed`:
        e.mods.speed += n.value;
        break;
      case `dur`:
        e.mods.dur += n.value;
        break;
      case `crit`:
        e.mods.crit += n.value;
        break;
      case `status`:
        e.mods.status += n.value;
    }
}
function I_(e, t) {
  let n = !1;
  for (; e.level > t && e.extra.length; ) {
    let t = e.extra.pop();
    (e.level--, (e.mods.dmg -= 0.08));
    for (let n of t)
      switch (n.key) {
        case `dmg`:
          e.mods.dmg -= n.value;
          break;
        case `cd`:
          e.mods.cd /= 1 - n.value;
          break;
        case `count`:
          e.mods.count -= n.value;
          break;
        case `pierce`:
          e.mods.pierce -= n.value;
          break;
        case `bounce`:
          e.mods.bounce -= n.value;
          break;
        case `area`:
          e.mods.area -= n.value;
          break;
        case `speed`:
          e.mods.speed -= n.value;
          break;
        case `dur`:
          e.mods.dur -= n.value;
          break;
        case `crit`:
          e.mods.crit -= n.value;
          break;
        case `status`:
          e.mods.status -= n.value;
      }
    n = !0;
  }
  return n;
}
var L_ = 3.4;
const baseFusionScale = 1.25;
function R_(e) {
  return Math.min(L_, baseFusionScale * (Math.max(0.3, e) || 1) ** 0.9);
}
var z_ = (e) => baseFusionScale * (Math.max(0.3, e) || 1) ** 0.9 >= L_,
  B_ = [],
  V_ = -1,
  H_ = 0;
function U_(e) {
  return ((e.time - V_ > 0.15 || e.time < V_) && ((V_ = e.time), (H_ = 8)), H_--);
}
var W_ = 0.45,
  G_ = class {
    run;
    list = [];
    constructor(e) {
      this.run = e;
    }
    add(e) {
      this.list.length < 260 && this.list.push(e);
    }
    update(e) {
      let t = this.run;
      for (let n = this.list.length - 1; n >= 0; n--) {
        let r = this.list[n];
        ((r.life -= e), (r.tick -= e));
        t.vfx.crafted.field(r);
        let i = r.fx ? qp(r.fx) : null;
        if (Math.random() < e * 6 && !r.authoredFire) {
          let e = r.x + F.range(-r.r, r.r) * 0.6,
            n = r.z + F.range(-r.r, r.r) * 0.6;
          r.stampedeFire
            ? _h(t,e,r.y+.3,n,0,1.5,0,.4,.65,.12,2,STAMPEDE_FLAME,r.stampedeSpecies)
            : i?.zone
            ? i.zone(t, e, r.y, n, r.artRadius ?? r.r, r.life)
            : t.vfx.trail(e, r.y + 0.3, n, r.color, 0.5, am(r.type), 0.5);
        }
        if (r.tick <= 0) {
          r.tick = W_;
          for (let e of t.enemies.within(r.x, r.z, r.r))
            t.combat.hit(e, r.dmg, {
              type: r.type,
              cls: r.cls,
              status: r.status,
              statusChance: r.chance,
              slot: r.slot,
              knock: 0.2,
              silent: Math.random() < 0.5,
            });
        }
        r.life <= 0 && this.list.splice(n, 1);
      }
    }
    clear() {
      this.list.length = 0;
    }
  },
  K_ = null;
function q_() {
  if (!K_) {
    let e = new Set();
    for (let t of y)
      for (let n of t.kit) {
        let t = k.movesByKey.get(n)?.id,
          r = t == null ? null : O_(t);
        r && r.arch !== `random` && r.arch !== `weather` && r.arch !== `buff` && e.add(r.id);
      }
    K_ = [...e];
  }
  return K_;
}
function J_(e, t, n, r) {
  n.swapT -= r;
  let i = n.sub,
    a = !!i && (i.active > 0 || i.burst.length > 0 || i.charging);
  if (!i || (n.swapT <= 0 && (!a || n.swapT < -4))) {
    let t = q_().filter(id => moveAvailableForSpecies(id, e.player.speciesId)),
      r = F.pick(t);
    if (i && t.length > 1) for (; r === i.def.id; ) r = F.pick(t);
    ((i = n.sub = new M_(formMove(r, e.player.speciesId))),
      (i.mods = n.mods),
      (i.timer = 0.25),
      (n.swapT = Math.max(2.2, (g_.random.cd * n.mods.cd) / e.player.stats.attackSpeed)));
    let a = e.player.pos;
    (qp(Kp(`metronome`)).cast?.(e, a.x, a.y + 0.9, a.z, 0, 0, Ni[i.def.type], 1),
      Y_(e, `metronome`, `cast`),
      e.ui.popup(a.x, a.y + 2.8, a.z, i.def.name, `#` + Ni[i.def.type].toString(16).padStart(6, `0`), 0.75));
  }
  ((i.level = n.level), e.castMove(t, i, r));
}
function Y_(e, t, n, r, i) {
  e.audio.move(t, n, r) || i?.();
}
var X_ = new Set([`bone-club`, `bonemerang`, `bone-rush`, `shadow-bone`]),
  Z_ = 9;
function Q_(e, t, n, r) {
  let i = e.player,
    a = i.stats,
    o = n.def,
    s = g_[o.arch];
  if(o.castRecipe){Ox(o.castRecipe,e,t,n,r);return;}
  if (o.arch === `random`) {
    J_(e, t, n, r);
    return;
  }
  if (o.fusion) {
    o.fusion.update(e, t, n, r);
    return;
  }
  let c = Ni[o.type],
    l = am(o.type),
    u =
      o.dmg *
      1.3 *
      n.mods.dmg *
      (1 + (n.level - 1) * 0.04) *
      (i.ability === `bone-keeper` && X_.has(o.key) ? 1.2 : 1),
    d = o.area * n.mods.area * a.area,
    f = Math.max(1, Math.floor(o.count + n.mods.count + (s.stats.includes(`count`) ? a.projectiles : 0))),
    p = o.dur * n.mods.dur * a.duration,
    m = o.speed * n.mods.speed * a.projSpeed,
    h = Math.max(0.12, (o.cd * n.mods.cd) / a.attackSpeed),
    g = o.critBonus + n.mods.crit,
    _ = o.statusChance * n.mods.status,
    v = i.pos.x,
    y = i.pos.y + 0.9,
    b = i.pos.z,
    x = {
      type: o.type,
      cls: o.cls,
      status: o.status,
      statusChance: _,
      critBonus: g,
      slot: t,
      drain: o.drain,
    },
    S = Kp(o.effectKey ?? o.key),
    C = qp(S),
    w = C.shape ?? l,
    T = C.size ?? 1;
  // Range upgrades move the hit boundary and the points where effects appear.
  // Each painted frame keeps the dimensions authored for the base move.
  const artRadius = o.area;
  if (o.arch === `orbit`) {
    if (((n.timer -= r), n.active > 0)) {
      ((n.active -= r), (n.phase += r * m));
      let t = d;
      for (let r = 0; r < f; r++) {
        let i = n.phase + (r / f) * Math.PI * 2,
          o = v + Math.cos(i) * t,
          s = b + Math.sin(i) * t,
          d = y + Math.sin(i * 2) * 0.2;
        C.orbit
          ? C.orbit(e, o, d, s, i, 0.9, c)
          : (e.orbitals.push(o, d, s, 0.9, c, l, i * 3, 0.5),
            e.orbitalsGlow.push(o, d, s, 2, c, I.Soft, 0, 0.2, 0.5),
            Math.random() < 0.4 && e.vfx.trail(o, d, s, c, 0.35, I.Soft, 0.25));
        for (let t of e.enemies.within(o, s, 0.8, B_)) {
          let r = n.orbHits.get(t) ?? -9;
          e.time - r < 0.5 ||
            (n.orbHits.set(t, e.time),
            e.combat.hit(t, u, { ...x, dirX: -Math.sin(i), dirZ: Math.cos(i), knock: 1.5 }));
        }
      }
      n.orbHits.size > 300 && n.orbHits.clear();
    } else
      n.timer <= 0 &&
        ((n.active = p), (n.timer = h + p), Y_(e, o.key, `cast`, void 0, () => e.audio.whoosh()));
    return;
  }
  if (o.arch === `aura`) {
    n.phase += r;
    let t = d,
      a = qp(Kp(o.key));
    if (a.aura) a.aura(e, v, i.pos.y, b, t, c, !1);
    else if (Math.random() < 0.5) {
      let n = Math.random() * Math.PI * 2;
      e.vfx.trail(v + Math.cos(n) * t, i.pos.y + 0.3, b + Math.sin(n) * t, c, 0.5, l, 0.6);
    }
    if ((e.auraRing(v, i.pos.y, b, t, c), (n.timer -= r), n.timer <= 0)) {
      ((n.timer = h), a.aura?.(e, v, i.pos.y, b, t, c, !0, artRadius), Y_(e, o.key, `cast`));
      for (let n of e.enemies.within(v, b, t))
        e.combat.hit(n, u, { ...x, knock: 0.3, silent: Math.random() < 0.3 });
    }
    return;
  }
  if (o.arch === `trail`) {
    ((n.timer -= r),
      n.timer <= 0 &&
        i.speedNow > 1.5 &&
        ((n.timer = h),
        e.zones.add({
          x: v,
          z: b,
          y: i.pos.y,
          r: d,
          artRadius,
          life: p,
          tick: 0,
          dmg: u,
          type: o.type,
          cls: o.cls,
          status: o.status,
          chance: _,
          slot: t,
          color: c,
          fx: S,
        }),
        Y_(e, o.key, `cast`)));
    return;
  }
  if (o.arch === `cone` && n.active > 0) {
    ((n.active -= r), (n.tick -= r));
    let t = e.aimDir(13, n),
      i = t.x,
      a = t.z;
    e.vfx.crafted.cone(n,v+i*.8,y,b+a*.8,i,a,d,o.type,.7*Math.sqrt(artRadius/7),true,true,artRadius);
    if (n.tick <= 0) {
      n.tick = 0.1;
      for (let t of e.enemies.within(v, b, d)) {
        let n = e.enemies.x[t] - v,
          r = e.enemies.z[t] - b,
          o = Math.hypot(n, r) || 1;
        (n * i + r * a) / o > 0.72 &&
          e.combat.hit(t, u, { ...x, dirX: i, dirZ: a, knock: 0.4, silent: Math.random() < 0.6 });
      }
    }
    return;
  }
  if (o.arch === `beam` && n.active > 0) {
    ((n.active -= r), (n.tick -= r));
    let t = 14 * Math.sqrt(a.area) * (1 + (n.mods.area - 1) * 0.5),
      i = n.aimX,
      s = n.aimZ;
    n.phase;
    for (let r = 0; r < n.burst.length; r++) {
      let a = n.burst[r],
        f = Math.cos(a),
        p = Math.sin(a),
        m = i * f - s * p,
        h = i * p + s * f;
      if (C.beam) C.beam(e, v + m * 0.6, y, b + h * 0.6, v + m * t, y, b + h * t, artRadius, c);
      else {
        (e.vfx.beams.spawn(v + m * 0.6, y, b + h * 0.6, v + m * t, y, b + h * t, artRadius * 1.1, c, 0.05),
          e.vfx.beams.spawn(v + m * 0.6, y, b + h * 0.6, v + m * t, y, b + h * t, artRadius * 0.45, c, 0.05));
        for (let n = 0; n < 2; n++) {
          let n = Math.random(),
            r = F.range(4, 9);
          e.vfx.add.spawn({
            x: v + m * t * n,
            y: y + F.range(-0.3, 0.3),
            z: b + h * t * n,
            vx: m * r + F.range(-2, 2),
            vy: F.range(-1, 2),
            vz: h * r + F.range(-2, 2),
            life: 0.35,
            size: 0.6,
            endSize: 0,
            color: c,
            shape: l,
            glow: 0.5,
            spin: 6,
          });
        }
        (o.type === `electric` &&
          Math.random() < 0.4 &&
          e.vfx.lightning(
            v + m * t * Math.random(),
            y,
            b + h * t * Math.random(),
            v + m * t * Math.random(),
            y + F.range(-1, 1),
            b + h * t * Math.random(),
            c,
            0.2,
            3,
            0.08,
          ),
          Math.random() < 0.6 &&
            e.vfx.trail(v + m * t * Math.random(), y, b + h * t * Math.random(), c, 0.6, I.Spark, 0.3));
      }
      if (n.tick <= 0)
        for (let n of e.enemies.within(v + m * t * 0.5, b + h * t * 0.5, t * 0.55)) {
          let r = e.enemies.x[n] - v,
            i = e.enemies.z[n] - b,
            a = r * m + i * h;
          a < 0 ||
            a > t ||
            (Math.abs(r * h - i * m) < d + e.enemies.radius[n] &&
              e.combat.hit(n, u, { ...x, dirX: m, dirZ: h, knock: 0.5, silent: Math.random() < 0.4 }));
        }
    }
    n.tick <= 0 && (n.tick = 0.09);
    return;
  }
  if (n.burst.length && o.arch === `barrage` && ((n.tick -= r), n.tick <= 0)) {
    ((n.tick = 0.06), n.burst.pop());
    let r = e.aimDir(15, n),
      i = (Math.random() - 0.5) * 0.3,
      s = Math.cos(i),
      c = Math.sin(i);
    (e.projectiles.fire({
      x: v,
      y,
      z: b,
      dx: r.x * s - r.z * c,
      dz: r.x * c + r.z * s,
      dy: r.y,
      speed: m,
      life: p,
      radius: d + 0.15,
      dmg: u,
      type: o.type,
      cls: o.cls,
      pierce: o.pierce + n.mods.pierce,
      bounce: n.mods.bounce + a.bounces,
      status: o.status,
      statusChance: _,
      size: 0.55 * T,
      shape: w,
      color: C.color,
      slot: t,
      knock: 0.5,
      trail: 0.5,
      fx: S,
    }),
      Y_(e, o.key, `cast`, { k: n.burst.length }, () => e.audio.shot(o.type, 0.4)));
  }
  if (((n.timer -= r), n.timer > 0)) return;
  n.timer = h;
  let E = e.enemies;
  switch ((i.attackAnim(), Bg(i.ability)?.onMoveFired?.(e, n, t), o.arch)) {
    case `bolt`:
    case `drain`:
    case `homing`:
    case `orb`:
    case `boomerang`: {
      let r = e.aimDir(o.arch === `homing` ? 20 : 16, n);
      if (!r.has && o.arch !== `boomerang`) {
        n.timer = 0.2; n.waitingForTarget = true;
        return;
      }
      let i = o.arch === `homing` && o.effectKey !== 'wind-feather-dance' ? 0.9 : (o.spread ?? 0.18);
      for (let s = 0; s < f; s++) {
        let c = (s - (f - 1) / 2) * i,
          l = Math.cos(c),
          h = Math.sin(c),
          g =
            o.arch === `homing` || o.arch === `drain`
              ? em.Homing
              : o.arch === `orb`
                ? em.Explode
                : o.arch === `boomerang`
                  ? em.Boomerang | em.Spin
                  : 0;
        e.projectiles.fire({
          x: v,
          y,
          z: b,
          dx: r.x * l - r.z * h,
          dz: r.x * h + r.z * l,
          dy: r.y,
          speed: m,
          life: p,
          radius: o.arch === `boomerang` ? d : o.arch === `orb` ? 0.55 : d,
          dmg: u,
          type: o.type,
          cls: o.cls,
          pierce: o.pierce + n.mods.pierce,
          bounce: o.arch === `bolt` ? n.mods.bounce + a.bounces : 0,
          flags: g,
          explodeR: o.arch === `orb` ? d : 0,
          explosionArtRadius: artRadius,
          status: o.status,
          statusChance: _,
          size: (o.arch === `boomerang` ? 1.3 * Math.sqrt(artRadius) : o.arch === `orb` ? 1 : 0.7) * T,
          shape: o.arch === `orb` ? (C.shape ?? I.Soft) : w,
          color: C.color,
          slot: t,
          drain: o.drain,
          target: r.target,
          fx: S,
        });
      }
      (C.cast?.(e, v, y, b, r.x, r.z, c, artRadius),
        o.key !== 'ember' && o.effectKey !== 'wind-feather-dance' && o.effectKey !== 'wind-wing-attack' && o.effectKey !== 'wind-air-slash' && e.vfx.flash(v + r.x, y, b + r.z, c, 1.4, 0.1),
        Y_(e, o.key, `cast`, { k: f }, () => e.audio.shot(o.type, 0.6)));
      break;
    }
    case `lob`:
      for (let n = 0; n < f; n++) {
        let r = E.nearest(v, b, 15),
          i = v + F.range(-6, 6),
          a = b + F.range(-6, 6);
        r >= 0 && ((i = E.x[r] + F.range(-1.5, 1.5) * n), (a = E.z[r] + F.range(-1.5, 1.5) * n));
        let s = i - v,
          c = a - b,
          l = Math.hypot(s, c) || 1,
          f = 0.75;
        e.projectiles.fire({
          x: v,
          y: y + 0.5,
          z: b,
          dx: s / f,
          dz: c / f,
          dy: 11 * f * 0.75,
          speed: Math.hypot(l / f, 11 * f * 0.75),
          life: 3,
          radius: 0.6,
          dmg: u,
          type: o.type,
          cls: o.cls,
          flags: em.Arc | em.Explode,
          explodeR: d,
          explosionArtRadius: artRadius,
          status: o.status,
          statusChance: _,
          size: 1.1 * T,
          shape: C.shape ?? I.Soft,
          color: C.color,
          slot: t,
          fx: S,
        });
      }
      Y_(e, o.key, `cast`, void 0, () => e.audio.shot(o.type, 0.5));
      break;
    case `barrage`:
      for (let e = 0; e < f; e++) n.burst.push(e);
      n.tick = 0;
      break;
    case `beam`: {
      let t = e.aimDir(15, n);
      if (!t.has) {
        n.timer = 0.2; n.waitingForTarget = true;
        return;
      }
      ((n.aimX = t.x), (n.aimZ = t.z), (n.active = p), (n.tick = 0), (n.burst = []));
      for (let e = 0; e < f; e++) n.burst.push((e - (f - 1) / 2) * 0.35);
      if ((o.power ?? 0) >= 110) {
        ((n.active = 0), (n.timer = h + 0.55));
        for (let t = 0; t < 26; t++) {
          let t = Math.random() * Math.PI * 2,
            n = F.range(2.5, 4);
          e.vfx.add.spawn({
            x: v + Math.cos(t) * n,
            y: y + F.range(-1, 1.5),
            z: b + Math.sin(t) * n,
            vx: -Math.cos(t) * n * 2,
            vy: 0,
            vz: -Math.sin(t) * n * 2,
            life: 0.5,
            size: 0.5,
            endSize: 0.1,
            color: c,
            shape: I.Star,
            glow: 0.8,
          });
        }
        (C.cast?.(e, v, y, b, t.x, t.z, c, artRadius),
          Y_(e, o.key, `charge`),
          (n.charging = !0),
          e.later(0.5, () => {
            ((n.charging = !1),
              (n.active = p * 1.3),
              (n.tick = 0),
              e.vfx.flash(v, y, b, 16777215, 4, 0.25),
              e.shake(0.25),
              Y_(e, o.key, `cast`, { dur: p * 1.3 }, () => e.audio.beam(o.type)));
          }));
        break;
      }
      (e.vfx.flash(v, y, b, c, 2.5, 0.2),
        e.shake(0.08),
        Y_(e, o.key, `cast`, { dur: p }, () => e.audio.beam(o.type)));
      break;
    }
    case `cone`:
      ((n.active = p),
        (n.tick = 0),
        C.cast?.(e, v, y, b, n.aimX, n.aimZ, c, artRadius),
        Y_(e, o.key, `cast`, { dur: p }, () => e.audio.cone(o.type, p)));
      break;
    case `nova`:
    case `spin`: {
      let t = d,
        n = o.pulses ?? 1,
        r = n > 1 ? u * 0.4 : u,
        a = (n) => {
          let a = i.pos.x,
            s = i.pos.y,
            u = i.pos.z,
            d = t * (1 + n * 0.12);
          if (C.nova) C.nova(e, a, s, u, d, c, artRadius * (1 + n * 0.12));
          else {
            (e.vfx.ring(a, s, u, d, c, 0.45), e.vfx.ring(a, s, u, d * 0.7, 16777215, 0.3));
            for (let t = 0; t < (o.arch === `nova` ? 28 : 14); t++) {
              let n = (t / 28) * Math.PI * 2;
              e.vfx.add.spawn({
                x: a,
                y: s + 0.4,
                z: u,
                vx: Math.cos(n) * d * 2.6,
                vz: Math.sin(n) * d * 2.6,
                vy: F.range(0, 2),
                life: 0.35,
                size: 0.9,
                endSize: 0.3,
                color: c,
                shape: l,
                drag: 4,
                glow: 0.4,
              });
            }
            (o.type === `ground` || o.type === `rock`) && e.vfx.dust(a, s, u, 13150328, 14, d * 1.5);
          }
          for (let t of E.within(a, u, d)) e.combat.hit(t, r, { ...x, knock: o.arch === `spin` ? 3 : 2 });
          (e.shake(o.arch === `nova` ? 0.18 : 0.06),
            Y_(e, o.key, `cast`, { k: n }, () => e.audio.nova(o.type)));
        };
      a(0);
      for (let t = 1; t < n; t++) e.later(t * 0.22, () => a(t));
      break;
    }
    case `strike`: {
      if (o.effectKey === 'wind-air-slash') {
        castWindAirSlash(e,d,p,u,x);
        Y_(e,o.key,'cast',void 0,()=>e.audio.slash(o.type));
        break;
      }
      let t = e.aimTarget(Math.max(6, d + 3));
      if (t < 0 && e.aimMode !== `manual`) {
        n.timer = 0.15; n.waitingForTarget = true;
        return;
      }
      for (let r = 0; r < f; r++) {
        let i,
          a,
          o = e.aimDir(d + 4, n);
        if (t >= 0 && r === 0) ((i = E.x[t]), (a = E.z[t]));
        else {
          let e = E.nearest(v + o.x * 3, b + o.z * 3, d + 4, t);
          ((i = e >= 0 ? E.x[e] : v + o.x * 2.5), (a = e >= 0 ? E.z[e] : b + o.z * 2.5));
        }
        let s = i - v,
          l = a - b,
          f = Math.hypot(s, l) || 1,
          p = s / f,
          m = l / f,
          h = v + p * Math.min(f, d * 0.6),
          g = b + m * Math.min(f, d * 0.6);
        C.strike ? C.strike(e, h, y, g, p, m, artRadius, c, r) : e.slash(h, y, g, p, m, artRadius, c, r % 2 == 1);
        for (let t of E.within(h, g, d * 0.75)) e.combat.groupHit(t, u, p, m);
      }
      (e.combat.flushGroup({ ...x, knock: 2.2 }), Y_(e, o.key, `cast`, void 0, () => e.audio.slash(o.type)));
      break;
    }
    case `dash`: {
      let t = e.aimDir(13, n);
      if (!t.has) {
        n.timer = 0.2; n.waitingForTarget = true;
        return;
      }
      const drawGhost=o.key!=='flare-blitz' && !C.replacesDash;
      const artLength=o.speed;
      for (let n = 0; n < f; n++) {
        let r = (n - (f - 1) / 2) * 0.35,
          a = Math.cos(r),
          o = Math.sin(r),
          s = t.x * a - t.z * o,
          l = t.x * o + t.z * a,
          p = m;
        if(drawGhost)e.ghostDash(v, i.pos.y, b, s, l, p, c);
        C.dash?.(e, v, i.pos.y, b, s, l, p, c, artLength);
        for (let t of E.within(v + s * p * 0.5, b + l * p * 0.5, p * 0.55)) {
          let n = E.x[t] - v,
            r = E.z[t] - b,
            i = n * s + r * l;
          i < -1 || i > p || (Math.abs(n * l - r * s) < d + E.radius[t] && e.combat.groupHit(t, u, s, l));
        }
      }
      (e.combat.flushGroup({ ...x, knock: 2.5 }), Y_(e, o.key, `cast`, void 0, () => e.audio.whoosh()));
      break;
    }
    case `chain`: {
      let t = e.aimTarget(14);
      if (t < 0) {
        n.timer = 0.2; n.waitingForTarget = true;
        return;
      }
      let r = v,
        i = y,
        a = b,
        s = 0,
        p = new Set();
      for (let n = 0; n < f + 1 && t >= 0; n++) {
        p.add(t);
        let f = E.x[t],
          m = E.y[t] + E.hgt[t] * 0.5,
          h = E.z[t];
        (C.link
          ? C.link(e, r, i, a, f, m, h, c, n)
          : (o.type === `electric`
              ? e.vfx.lightning(r, i, a, f, m, h, c, 0.38)
              : e.vfx.beams.spawn(r, i, a, f, m, h, 0.4, c, 0.2),
            e.vfx.burst(f, m, h, c, 6, 4, l, 0.4, 0.3)),
          e.combat.hit(t, u * 0.9 ** n, { ...x }),
          (s = n),
          (r = f),
          (i = m),
          (a = h));
        let g = -1,
          _ = d * d;
        for (let e of E.within(f, h, d, B_)) {
          if (p.has(e)) continue;
          let t = E.x[e] - f,
            n = E.z[e] - h,
            r = t * t + n * n;
          r < _ && ((_ = r), (g = e));
        }
        t = g;
      }
      Y_(e, o.key, `cast`, { k: s }, () => e.audio.zap());
      break;
    }
    case `smite`:
    case `meteor`: {
      let t = E.within(v, b, 14, B_),
        r = Math.min(f, t.length);
      for (let e = 0; e < r; e++) {
        let n = e + ((Math.random() * (t.length - e)) | 0),
          r = t[e];
        ((t[e] = t[n]), (t[n] = r));
      }
      let i = t.slice(0, r),
        a = e.boss.bossIndex;
      if (a >= 0 && e.boss.alive && t.includes(a)) {
        let e = i.indexOf(a);
        (e > 0 && (i[e] = i[0]), e !== 0 && (i[0] = a));
      }
      if (!i.length) {
        n.timer = 0.25; n.waitingForTarget = true;
        return;
      }
      for (let t of i) {
        let n = E.x[t] + F.range(-0.5, 0.5),
          r = E.z[t] + F.range(-0.5, 0.5),
          i = e.terrain.height(n, r),
          a = o.arch === `meteor` ? p : 0.22;
        (e.vfx.telegraph(n, i, r, d, c, a),
          C.warn?.(e, n, i, r, d, c, a),
          o.arch === `meteor` && Y_(e, o.key, `warn`, { dur: a }),
          e.later(a, () => {
            let t = U_(e) <= 0;
            (C.sky
              ? C.sky(e, n, i, r, d, c, artRadius)
              : o.arch === `meteor`
                ? (t
                    ? e.vfx.burst(n, i + 0.5, r, c, 8, d * 3, l, 1, 0.5, 10)
                    : (e.vfx.beams.spawn(n + 6, i + 30, r - 4, n, i, r, d * 0.5, c, 0.15, 0.7),
                      e.vfx.burst(n, i + 0.5, r, c, 34, d * 3, l, 1, 0.7, 10),
                      e.vfx.dust(n, i, r, 10127994, 16, d * 2)),
                  e.vfx.flash(n, i + 1, r, c, artRadius * 2.2, 0.2),
                  t || e.shake(0.35, n, r))
                : (o.type === `electric`
                    ? e.vfx.lightning(n + F.range(-1, 1), i + 22, r, n, i, r, c, 0.5, 8)
                    : e.vfx.beams.spawn(n, i + 18, r, n, i, r, d * 0.4, c, 0.15, 0.7),
                  e.vfx.burst(n, i + 0.4, r, c, 14, d * 3, l, 0.6, 0.45, 6),
                  e.shake(0.07, n, r)),
              !C.sky && !t && e.vfx.ring(n, i, r, d, c, 0.35),
              t ||
                Y_(e, o.key, `impact`, void 0, () =>
                  o.arch === `meteor` ? e.audio.boom(1) : e.audio.zap(),
                ));
            for (let t of E.within(n, r, d)) e.combat.hit(t, u, { ...x, knock: 1.5 });
          }));
      }
      break;
    }
    case `trap`:
      for (let n = 0; n < f; n++) {
        let n = F.range(0, Math.PI * 2),
          r = F.range(2, 7);
        e.projectiles.fire({
          x: v,
          y,
          z: b,
          dx: Math.cos(n),
          dz: Math.sin(n),
          speed: r * 5,
          life: p,
          radius: 1,
          dmg: u,
          type: o.type,
          cls: o.cls,
          flags: em.Mine | em.Explode,
          explodeR: d,
          explosionArtRadius: artRadius,
          status: o.status,
          statusChance: _,
          size: 0.9 * T,
          shape: w,
          color: C.color,
          slot: t,
          trail: 0.1,
          fx: S,
        });
      }
      Y_(e, o.key, `cast`, void 0, () => e.audio.shot(o.type, 0.3));
      break;
    case `vortex`: {
      let r = e.aimDir(14, n);
      if(o.effectKey==='wind-gust'&&!r.has){
        n.timer=.2;n.waitingForTarget=true;
        return;
      }
      const windPassThrough=o.effectKey==='wind-gust';
      const flags = em.Pull | em.Explode | em.Spin | (windPassThrough ? em.PassThroughEnemies : 0);
      for (let n = 0; n < f; n++) {
        let i = (n - (f - 1) / 2) * 0.6,
          a = Math.cos(i),
          s = Math.sin(i);
        e.projectiles.fire({
          x: v,
          y,
          z: b,
          dx: r.x * a - r.z * s,
          dz: r.x * s + r.z * a,
          speed: m,
          life: p,
          radius: 1.2,
          dmg: u,
          type: o.type,
          cls: o.cls,
          flags,
          explodeR: d,
          explosionArtRadius: artRadius,
          pierce: 99,
          status: o.status,
          statusChance: _,
          size: 2.4 * T,
          shape: C.shape ?? I.Swirl,
          color: C.color,
          slot: t,
          knock: 0.2,
          fx: S,
        });
      }
      Y_(e, o.key, `cast`, void 0, () => e.audio.whoosh());
      break;
    }
    case `wave`: {
      let r = e.aimDir(14, n),
        a = Math.min(f, 12),
        s = (Math.max(3, Math.round(d * 1.4)) - 1) * 0.9,
        c = Math.min(Z_, Math.max(3, Math.round(d * 1.4))),
        l = s / (c - 1),
        h = Math.max(0.9, l * 0.6);
      for (let n = 0; n < a; n++) {
        let s = (n - (a - 1) / 2) * 0.5,
          d = Math.cos(s),
          f = Math.sin(s),
          g = r.x * d - r.z * f,
          y = r.x * f + r.z * d,
          x = -y,
          w = g;
        for (let n = 0; n < c; n++) {
          let r = (n - (c - 1) / 2) * l;
          e.projectiles.fire({
            x: v + x * r,
            y: i.pos.y + 0.6,
            z: b + w * r,
            dx: g,
            dz: y,
            speed: m,
            life: p,
            radius: h,
            dmg: u,
            type: o.type,
            cls: o.cls,
            flags: em.Wave,
            pierce: 99,
            status: o.status,
            statusChance: _,
            size: 1.4 * T,
            shape: C.shape ?? I.Soft,
            color: C.color,
            slot: t,
            knock: 2.5,
            fx: S,
          });
        }
      }
      Y_(e, o.key, `cast`, void 0, () => e.audio.whoosh());
      break;
    }
    case `weather`:
      (e.setWeather(o.weather, p), e.vfx.ring(v, i.pos.y, b, 12, c, 0.8), e.audio.power());
      break;
    case `buff`:
      (i.addBuff(`move-buff`, p, o.name),
        e.vfx.ring(v, i.pos.y, b, 3, c, 0.5),
        e.vfx.burst(v, y, b, c, 18, 4, I.Star, 0.5, 0.6),
        e.audio.power());
  }
}
function $_(e) {
  return `${e.type2 && e.type2 !== e.type ? `${Pi[e.type]} / ${Pi[e.type2]}` : Pi[e.type]} · ${e.cls === `physical` ? c(`Físico`) : c(`Especial`)} · ${g_[e.arch].label}`;
}
var fx = Math.PI * 2;
var mx = (e, t = 1, n = 4) => Math.min(n, Math.floor(e.n * t));
function gx(e, t, n, r, i, a, o = null, s = 0, c, l = e.type, visuals) {
  e.run.zones.add({
    x: t,
    z: n,
    y: e.run.terrain.height(t, n),
    r,
    life: i * e.D,
    tick: 0.2,
    dmg: e.dmg * a,
    type: l,
    cls: e.cls,
    status: o,
    chance: s,
    slot: e.slot,
    color: e.col,
    fx: c ? Kp(c) : void 0,
    ...visuals,
  });
}
function vx(e, t = 2.2, n = 10) {
  let r = e.run,
    i = r.player.pos;
  for (let a = 0; a < n; a++) {
    let o = a / n,
      s = o * fx * 1.6;
    for (let [n, a] of [
      [0, e.col],
      [Math.PI, e.col2],
    ])
      r.vfx.add.spawn({
        x: i.x + Math.cos(s + n) * 0.7,
        y: i.y + 0.2 + o * t,
        z: i.z + Math.sin(s + n) * 0.7,
        vx: -Math.sin(s + n) * 1.5,
        vy: 1.2,
        vz: Math.cos(s + n) * 1.5,
        life: 0.3 + o * 0.2,
        size: 0.32,
        endSize: 0,
        color: a,
        shape: I.Twinkle,
        glow: 0.25,
      });
  }
  r.vfx.add.spawn({
    x: i.x,
    y: i.y + t + 0.3,
    z: i.z,
    life: 0.22,
    size: 0.4,
    endSize: 1.4,
    color: 16774360,
    shape: I.Twinkle,
    glow: 0.4,
    spin: 4,
  });
}
function xx(e, t, n, r, i, a, o, s = {}) {
  let c = e.run.enemies,
    l = r - t,
    u = i - n,
    d = Math.hypot(l, u) || 1,
    f = l / d,
    p = u / d;
  for (let l of c.within((t + r) / 2, (n + i) / 2, d * 0.55 + a)) {
    let r = c.x[l] - t,
      i = c.z[l] - n,
      u = r * f + i * p;
    u < -0.5 ||
      u > d + 0.5 ||
      (Math.abs(r * p - i * f) < a + c.radius[l] &&
        Dh(e, l, o, { dirX: f, dirZ: p, knock: 0.6, silent: Math.random() < 0.5, ...s }));
  }
}
function Ex(e, t) {
  return e.dmg * 1.3 * t.mods.dmg * (1 + (t.level - 1) * 0.04);
}
function Dx(e, t, n) {
  return Math.max(0.6, (e.cd * t.mods.cd) / n);
}
function Ox(e, t, n, r, i) {
  if (((r.timer -= i), r.timer > 0)) return;
  let a = t.player,
    o = a.stats,
    s = t.aimTarget(e.range ?? 16);
  if (s < 0 && t.aimMode !== `manual`) {
    r.timer = 0.25; r.waitingForTarget = true;
    return;
  }
  r.timer = Dx(e, r, o.attackSpeed);
  let c = t.aimDir(e.range ?? 16, r),
    l = a.pos,
    u = kx(e, t, n, r, s, c.x, c.z);
  if (
    (a.attackAnim(),
    Bg(a.ability)?.onMoveFired?.(t, r, n),
    vx(u),
    e.sfx?.(t.audio, u),
    e.cast(u),
    e.repeats && u.n > 0)
  ) {
    let i = Ah(t, l.x, l.z, e.range ?? 16, 3);
    for (let a = 1; a <= Math.min(2, u.n); a++)
      t.later(0.3 * a, () => {
        let o = t.player.pos,
          l = i[a] ?? -1,
          u = l >= 0 && t.enemies.isAlive(l),
          d = (a % 2 ? 1 : -1) * 0.5 * Math.ceil(a / 2),
          f = Math.cos(d),
          p = Math.sin(d),
          m = kx(e, t, n, r, u ? l : s, c.x * f - c.z * p, c.x * p + c.z * f);
        ((m.dmg *= 0.7),
          u || ((m.tx = o.x + m.ax * 8), (m.tz = o.z + m.az * 8), (m.target = -1)),
          e.sfx?.(t.audio, m),
          e.cast(m));
      });
  }
}
function kx(e, t, n, r, i, a, o) {
  let s = t.player,
    c = s.stats,
    l = r.def,
    u = s.pos,
    d = t.enemies,
    f = i >= 0 ? d.x[i] : u.x + a * 8,
    p = i >= 0 ? d.z[i] : u.z + o * 8,
    m = e.type2 ?? e.type;
  return {
    run: t,
    x: u.x,
    y: u.y,
    z: u.z,
    ax: a,
    az: o,
    tier: Math.min(2, s.evoStage + s.growth),
    form: s.evoStage,
    dmg: Ex(l, r),
    R: R_(c.area * r.mods.area),
    type: e.type,
    cls: e.cls,
    base: { slot: n, critBonus: l.critBonus + r.mods.crit },
    slot: n,
    mi: r,
    n: Math.max(0, Math.floor(r.mods.count + c.projectiles)) || 0,
    D: Math.max(0.3, c.duration * r.mods.dur) || 1,
    star: r.level,
    type2: m,
    target: i,
    tx: f,
    tz: p,
    col: Ni[e.type],
    col2: Ni[m],
  };
}
// Ordinary Flame Charge owns this implementation; no retired fusion dependency.
const fireStampedeRecipe = {
  "type": "fire",
  "type2": "fire",
  "cls": "physical",
  "cd": 3.6,
  "range": 15,
  "sfx": e => e.move('stampede', 'cast'),
  "cast": function cast(e) {
        let t = e.run;
        const ghostForm={species:t.player.speciesId,scale:t.player.renderScale};
        t.enemies;
        let n = t.player.pos,
          r = 4 + mx(e, 1, 3),
          i = Ah(t, n.x, n.z, 14 * e.R, r),
          a = n.x,
          o = n.z,
          s = 0,
          c = () => {
            if (s >= r) {
              let n = U(t, a, o),
                r = 4 * e.R;
              (t.vfx.flash(a, n + 1, o, Y.fire, 4, 0.2),
                t.vfx.ring(a, n, o, r, 13647898, 0.5, 0.12, L.Flames));
              for (let e = 0; e < 22; e++) {
                let i = (e / 22) * H;
                _h(
                  t,
                  a,
                  n + 0.6,
                  o,
                  Math.cos(i) * r * 2.2,
                  F.range(1, 4),
                  Math.sin(i) * r * 2.2,
                  0.45,
                  1.2,
                  0.4,
                  3,
                  STAMPEDE_FLAME,
                  ghostForm.species,
                );
              }
              (yh(t, a, n + 1, o, 10, 6),
                q(e, a, o, r, 1.5, { status: `burn`, statusChance: 0.7, knock: 4 }),
                t.shake(0.2, a, o),
                M(t.audio, 0.6));
              return;
            }
            let n = jh(t, a, o, 8, i, s),
              l = n.x - a,
              u = n.z - o,
              d = Math.hypot(l, u) || 1,
              f = l / d,
              p = u / d,
              m = a,
              h = o,
              g = Math.min(0.18, d / 50),
              flameDistance = 0;
            (t.ghostDash(m, U(t, m, h), h, f, p, d, 16747050, ghostForm),
              W(
                t,
                g,
                (e) => {
                  let n = e / g,
                    r = m + l * n,
                    i = h + u * n,
                    a = U(t, r, i);
                  t.vfx.crafted.stampedeArt().trail(m,h,f,p,flameDistance,d*n,ghostForm.species);
                  flameDistance=d*n;
                  t.vfx.add.spawn({
                    x: r,
                    y: a + 0.9,
                    z: i,
                    life: 0.15,
                    size: 1.6,
                    endSize: 0.6,
                    color: 16756794,
                    shape: I.Soft,
                    glow: 0.2,
                  });
                },
                () => {
                  (xx(e, m, h, n.x, n.z, 1.3 * e.R, 0.75, { status: `burn`, statusChance: 0.35, knock: 2 }),
                    gx(e, (m + n.x) / 2, (h + n.z) / 2, 1.4 * e.R, 1.6, 0.1, `burn`, 0.3, `will-o-wisp`, e.type, {stampedeFire:true,stampedeSpecies:ghostForm.species,stampedeStart:t.time}),
                    ls(t.audio, 900, 0.08, 0.1),
                    (a = n.x),
                    (o = n.z),
                    s++,
                    c());
                },
              ));
          };
        (c(), ks(t.audio, 0.3, 120, 0.06));
      }
};

export {
  Rg,
  ag,
  fg,
  vg,
  Dg,
  Mg,
  Bg,
  Fg,
  formMove,
  M_,
  I_,
  O_,
  A_,
  P_ as upgradeMoveStats,
  F_,
  g_,
  fx,
  Ox,
  baseFusionScale,
  mx,
  gx,
  w_,
  e_,
  j_,
  G_,
  Q_,
  R_,
  z_,
  Ig,
  Lg,
  $_
};
