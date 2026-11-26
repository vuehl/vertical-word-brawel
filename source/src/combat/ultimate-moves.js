import {I, vl, random as F, L, bl, Sl, wl, El} from "../effects/battle-particles.js";
import {chineseText as c} from "../data/chinese-text.js";
import {R} from "./enemy-population.js";
import {Kp, gp, Ap, Fp, Np} from "../effects/move-particles.js";
import {STAMPEDE_FLAME} from "../effects/stylized-effect-atlas.js";
import {em} from "./field-effects.js";
import {specialNames} from "../data/form-copy.js";
import {starterUltimate} from "../data/starter-characters.js";
import {fireRingGrowth} from "../effects/fire-footprint.js";
import {SPECIAL_ACTORS} from "../performance/spawn-budget.js";
import {windTornadoSpeed,windTornadoRate,windTornadoPosition,sweptWindTargets} from "./wind-tornado.js";

const windOrbitDuration = 2.5;

var Im = 11071743,
  Lm = 9099354,
  Rm = 12099696,
  zm = [8060872, 9091327, 16751328];
function Bm(e, t, n) {
  let r = e.run,
    i = r.player;
  return !r.terrain.inBounds(t, n, 3) || r.terrain.inWater(t, n)
    ? !1
    : ((i.pos.x = t), (i.pos.z = n), (i.pos.y = U(r, t, n)), i.vel.set(0, 0, 0), (i.kx = i.kz = 0), !0);
}
function Vm(e, t, n, r, i, a, o, s = {}) {
  let c = e.run,
    l = c.player.pos;
  for (let u = 0; u < t; u++) {
    let d = n + (u / t) * H;
    c.projectiles.fire({
      x: l.x,
      y: l.y + 0.9,
      z: l.z,
      dx: Math.cos(d),
      dz: Math.sin(d),
      speed: o,
      life: 0.75,
      radius: 0.6,
      dmg: e.dmg * a,
      type: e.type,
      cls: e.cls,
      pierce: s.pierce ?? 3,
      status: s.status,
      statusChance: s.statusChance ?? 0,
      size: i,
      shape: r,
      color: s.halo ?? 9079434,
      slot: 8,
      knock: 1.5,
    });
  }
}
function Hm(e, t, n, r) {
  let i = e.run,
    a = i.player.pos.x,
    o = i.player.pos.z,
    s = new Set(),
    c = 0.8;
  W(i, c, (l) => {
    let u = (l / c) * n,
      d = a + Math.cos(t) * u,
      f = o + Math.sin(t) * u,
      p = U(i, d, f);
    (i.vfx.norm.spawn({
      x: d,
      y: p + 1.1,
      z: f,
      life: 0.06,
      size: 2.2,
      endSize: 2.2,
      color: 16777215,
      shape: I.PixRock,
      rot: -l * 14,
    }),
      Math.random() < 0.5 && i.vfx.dust(d, p, f, 13150328, 2, 2),
      Oh(e, s, d, f, 2 * e.R, r, { status: `stun`, statusChance: 0.6, knock: 4 }));
  });
}
var Um = {
    74: {
      names: [c(`Rodada Rocosa`), c(`Alud`), c(`Explosión Golem`)],
      descs: [
        c(`Te enroscas y ruedas 18 m hacia tu objetivo aplastando y aturdiendo todo lo que cruzas.`),
        c(
          `La rodada, una avalancha de catorce rocas sobre los enemigos y seis rocas que ruedan en todas direcciones.`,
        ),
        c(
          `La rodada y la avalancha acaban en una explosión enorme (sin perder tu Pokémon) que agrieta el suelo en estrella.`,
        ),
      ],
      type: `rock`,
      cls: `physical`,
      dur: [1.4, 2.2, 3],
      tint: Rm,
      cast(e) {
        let t = e.run,
          n = 18 * e.R,
          r = e.ax,
          i = e.az,
          a = new Set();
        t.ghostDash(e.x, e.y, e.z, r, i, n, 14207136);
        for (let o = 0; o <= 12; o++)
          t.later(o * 0.03, () => {
            let s = o / 12,
              c = e.x + r * n * s,
              l = e.z + i * n * s,
              u = U(t, c, l);
            (t.vfx.norm.spawn({
              x: c,
              y: u + 1,
              z: l,
              life: 0.2,
              size: 2,
              endSize: 1.6,
              color: 16777215,
              shape: I.PixRock,
              rot: -s * 20,
            }),
              o % 2 == 0 &&
                (G(t, c, l, 2.2, I.PixCrack, 16777215, 2, Math.atan2(i, r)), bh(t, c, u, l, 3, 4)),
              Oh(e, a, c, l, 2.4 * e.R, 2, {
                status: `stun`,
                statusChance: 0.9,
                dirX: r,
                dirZ: i,
                knock: 5,
              }));
          });
        (t.later(0.38, () => {
          Bm(e, e.x + r * n, e.z + i * n);
          let a = t.player.pos;
          (K(t, a.x, a.y, a.z, 5 * e.R, [Rm, 16777215], 2, 0.06, L.Jagged),
            t.shake(0.25),
            J.boom(t.audio, 0.6));
        }),
          J.rumble(t.audio, 0.6, 0.18),
          e.tier !== 0 &&
            (Ih(
              e,
              14,
              1.4,
              16,
              0.5,
              (e, n, r, i) => {
                (Eh(t, e, n, r, i, I.PixRock, 2.6, 24, 6), t.vfx.telegraph(e, n, r, 3.4, Rm, i));
              },
              (n, r, i) => {
                (bh(t, n, r, i, 8, 6),
                  G(t, n, i, 3.4, I.PixCrack),
                  t.vfx.dust(n, r, i, 13154456, 8, 4),
                  q(e, n, i, 3.4 * e.R, 1.3, { status: `stun`, statusChance: 0.8, knock: 3 }),
                  t.shake(0.1, n, i),
                  J.boom(t.audio, 0.4));
              },
            ),
            t.later(0.5, () => {
              for (let t = 0; t < 6; t++) Hm(e, (t / 6) * H + F.range(-0.2, 0.2), 14 * e.R, 1.2);
            }),
            !(e.tier < 2) &&
              t.later(2.3, () => {
                let n = t.player.pos,
                  r = 14 * e.R;
                (t.vfx.flash(n.x, n.y + 1, n.z, 16765066, 5, 0.3),
                  K(t, n.x, n.y, n.z, r, [16758858, Rm, 16777215], 3, 0.07, L.Jagged));
                for (let e = 0; e < 30; e++) {
                  let e = F.range(0, H),
                    i = F.range(r, r * 2.2);
                  _h(
                    t,
                    n.x,
                    n.y + 0.8,
                    n.z,
                    Math.cos(e) * i,
                    F.range(2, 7),
                    Math.sin(e) * i,
                    0.55,
                    1.5,
                    0.4,
                    2.5,
                  );
                }
                bh(t, n.x, n.y, n.z, 24, 14, I.PixRock, 0.7);
                for (let e = 0; e < 4; e++) vh(t, n.x, n.y + 1, n.z, 3, 9075316, 1.4);
                (Nh(e, n.x, n.z, 8, {
                  len: 15 * e.R,
                  glow: 16752714,
                  mul: 0.7,
                  erupt: (e, n, r, i) => Ch(t, e, r, I.PixSpike, 2.2 - i, 0.9, 6),
                }),
                  q(e, n.x, n.z, r, 2.6, { status: `stun`, statusChance: 1, knock: 8 }),
                  t.shake(0.6),
                  J.boom(t.audio, 1.4),
                  J.rumble(t.audio, 1, 0.22));
              })));
      },
    },
    77: {
      names: [c(`Galope Ígneo`), c(`Estampida Sagrada`)],
      descs: [
        c(
          `Galopas en círculo dejando un anillo de fuego de 9 m que arde y, al cerrarse, quema todo lo que encierra.`,
        ),
        c(`El galope, tres estelas de fuego en abanico y columnas de fuego sagrado sobre los enemigos.`),
      ],
      type: `fire`,
      cls: `physical`,
      dur: [1.8, 2.8],
      tint: 16747066,
      cast(e) {
        let t = e.run,
          n = e.x,
          r = e.z,
          i = 9 * e.R,
          a = new Set(),
          o = Math.atan2(e.az, e.ax) + Math.PI,
          s = -1;
        (W(
          t,
          1.4,
          (c) => {
            let l = o + (c / 1.4) * H,
              u = n + Math.cos(l) * i,
              d = r + Math.sin(l) * i,
              f = U(t, u, d);
            (Bm(e, u, d), t.player.facing.set(-Math.sin(l), Math.cos(l)));
            for (let e = 0; e < 2; e++)
              _h(
                t,
                u + F.range(-0.5, 0.5),
                f + 0.3,
                d + F.range(-0.5, 0.5),
                0,
                F.range(4, 8),
                0,
                0.6,
                F.range(1, 1.5),
                0.35,
                1.2,
              );
            let p = Math.floor((c / 1.4) * 16);
            (p !== s &&
              ((s = p),
              t.zones.add({
                x: u,
                z: d,
                y: f,
                r: 2,
                life: 4,
                tick: 0,
                dmg: e.dmg * 0.15,
                type: `fire`,
                cls: `physical`,
                status: `burn`,
                chance: 0.5,
                slot: 8,
                color: Y.fire,
                fx: Kp(`blazing-hooves`),
              })),
              Oh(e, a, u, d, 2.5 * e.R, 1, { status: `burn`, statusChance: 0.9, knock: 3 }));
          },
          () => {
            t.vfx.ring(n, U(t, n, r), r, i, 13647898, 0.6, 0.15, L.Flames);
            for (let e = 0; e < 32; e++) {
              let a = (e / 32) * H;
              _h(
                t,
                n + Math.cos(a) * i,
                U(t, n, r) + 0.5,
                r + Math.sin(a) * i,
                -Math.cos(a) * 6,
                F.range(3, 6),
                -Math.sin(a) * 6,
                0.6,
                1.4,
                0.4,
                2,
              );
            }
            (q(e, n, r, i, 1.5, { status: `burn`, statusChance: 1, knock: 2 }),
              t.shake(0.3),
              J.boom(t.audio, 0.8),
              J.fire(t.audio, 0.8, 0.16));
          },
        ),
          J.fire(t.audio, 1.4, 0.12));
        for (let e = 0; e < 8; e++) t.later(e * 0.17, () => t.audio.kt(130, 0.06, { to: 0.6, v: 0.1 }));
        e.tier !== 0 &&
          (t.later(1.55, () => {
            let i = t.player.pos,
              a = Math.atan2(r - i.z, n - i.x),
              o = 20 * e.R;
            for (let n of [-0.4, 0, 0.4]) {
              let r = Math.cos(a + n),
                s = Math.sin(a + n),
                c = new Set();
              t.ghostDash(i.x, i.y, i.z, r, s, o, 16756826);
              for (let n = 0; n <= 10; n++)
                t.later(n * 0.02, () => {
                  let a = i.x + (r * o * n) / 10,
                    l = i.z + (s * o * n) / 10;
                  (_h(t, a, U(t, a, l) + 0.4, l, 0, F.range(4, 7), 0, 0.5, 1.1, 0.3),
                    Oh(e, c, a, l, 2.2 * e.R, 1.3, {
                      status: `burn`,
                      statusChance: 1,
                      dirX: r,
                      dirZ: s,
                      knock: 4,
                    }));
                });
            }
            J.whoosh(t.audio, 0.4, 0.16, 500);
          }),
          t.later(2, () => {
            let n = t.player.pos,
              r = t.enemies;
            Ah(t, n.x, n.z, 16 * e.R, 8 + e.tier * 2).forEach((i, a) =>
              t.later(a * 0.06, () => {
                let a = r.isAlive(i) ? r.x[i] : n.x,
                  o = r.isAlive(i) ? r.z[i] : n.z,
                  s = U(t, a, o);
                Th(t, a, s, o, 1.8, 16747050, 16773792, 0.5, 18);
                for (let e = 0; e < 8; e++)
                  _h(
                    t,
                    a + F.range(-0.6, 0.6),
                    s + F.range(0, 2),
                    o + F.range(-0.6, 0.6),
                    0,
                    F.range(6, 12),
                    0,
                    0.5,
                    1.2,
                    0.4,
                    1.2,
                  );
                (Sh(t, a, s + 1, o, 16771232, 6, 5),
                  q(e, a, o, 2.8 * e.R, 1.5, { status: `burn`, statusChance: 1, knock: 2 }),
                  J.fire(t.audio, 0.25, 0.1));
              }),
            );
          }),
          t.cry(78, 0.6));
      },
    },
    79: {
      names: [c(`Bostezo Colosal`), c(`Mordisco del Shellder`)],
      descs: [
        c(
          `Un bostezo enorme duerme a todo en 14 m; poco después cae una lluvia psíquica sobre diez dormidos (los dormidos reciben ×1,8).`,
        ),
        c(
          `El bostezo y el Shellder de tu cola muerde a ocho enemigos; acaba en un géiser psíquico que confunde en 13 m.`,
        ),
      ],
      type: `psychic`,
      cls: `special`,
      dur: [2.4, 2.8],
      tint: 16751312,
      cast(e) {
        let t = e.run,
          n = 14 * e.R;
        for (let e = 0; e < 3; e++)
          t.later(e * 0.25, () => {
            let n = t.player.pos;
            t.vfx.norm.spawn({
              x: n.x + (e - 1) * 0.8,
              y: n.y + 2.4 + e * 0.4,
              z: n.z,
              vy: 1.5,
              life: 1.3,
              size: 0.6 + e * 0.2,
              endSize: 1.1 + e * 0.25,
              color: 16759e3,
              shape: I.PixSleepZ,
            });
          });
        (xh(t, e.x, e.y + 1.5, e.z, I.PixBubble, 20, n * 1.2, 0.6, 1, 0, 16777215, 1),
          K(t, e.x, e.y, e.z, n, [16759e3, 14205183], 2, 0.15, L.Ripple));
        for (let r of t.enemies.within(e.x, e.z, n))
          (t.combat.applyStatus(r, `sleep`, 1), t.combat.applyStatus(r, `sleep`, 1));
        if (
          (t.audio.kt(220, 1.2, { v: 0.07, to: 0.55, vib: [3, 0.06], a: 0.25 }),
          t.audio.kt(330, 1, { v: 0.04, to: 0.55, vib: [3.5, 0.05], a: 0.3, d: 0.1 }),
          e.tier === 0)
        ) {
          Ih(
            e,
            10,
            1,
            15,
            0.5,
            (e, n, r, i) => {
              t.later(0.9, () => {
                (Eh(t, e, n, r, i, I.PixSparkle, 1.6, 20, 4, 16751328),
                  t.vfx.telegraph(e, n, r, 2.6, 16739032, i));
              });
            },
            (n, r, i) => {
              t.later(0.9, () => {
                (t.vfx.ring(n, r, i, 2.6, 16739032, 0.3, 0.2, L.Runes),
                  Sh(t, n, r + 0.5, i, 16759024, 6, 5),
                  q(e, n, i, 2.6 * e.R, 1.2, { knock: 2 }),
                  J.zap(t.audio));
              });
            },
          );
          return;
        }
        let r = t.enemies;
        (Ah(t, e.x, e.z, 15 * e.R, 8).forEach((n, i) =>
          t.later(0.5 + i * 0.12, () => {
            if (!r.isAlive(n)) return;
            let i = r.x[n],
              a = r.y[n] + r.hgt[n] * 0.6,
              o = r.z[n];
            for (let e of [-1, 1])
              t.vfx.norm.spawn({
                x: i,
                y: a + e * 1.2,
                z: o,
                vy: -e * 9,
                life: 0.14,
                size: 1.6,
                endSize: 1.6,
                color: 16777215,
                shape: vl.PixShell,
                rot: e > 0 ? Math.PI : 0,
              });
            t.later(0.14, () => {
              (wh(t, i, a, o, I.PixFang, 1.2, 1.8, 0.2),
                Dh(e, n, 1.6, { knock: 3 }),
                t.audio.kt(160, 0.08, { to: 0.6, v: 0.16 }));
            });
          }),
        ),
          t.later(1.9, () => {
            let n = t.player.pos,
              r = 13 * e.R;
            (Th(t, n.x, n.y, n.z, 3, 16739032, 16769279, 0.6, 22),
              K(t, n.x, n.y, n.z, r, [16739032, 6994175, 16777215], 3, 0.07, L.Runes));
            for (let e = 0; e < 16; e++)
              t.vfx.norm.spawn({
                x: n.x + F.range(-1, 1),
                y: n.y + 0.5,
                z: n.z + F.range(-1, 1),
                vx: F.range(-3, 3),
                vy: F.range(8, 14),
                vz: F.range(-3, 3),
                gravity: 16,
                life: 0.9,
                size: 0.45,
                endSize: 0.25,
                color: 16777215,
                shape: I.PixDrop,
              });
            (q(e, n.x, n.z, r, 1.8, { status: `confusion`, statusChance: 1, knock: 5 }),
              t.shake(0.35),
              J.boom(t.audio, 0.9));
          }),
          t.cry(80, 0.6));
      },
    },
    81: {
      names: [c(`Campo Magnético`), c(`Triple Imán`)],
      descs: [
        c(
          `Un campo de imanes en órbita arrastra a todos en 12 m hacia ti y estalla en una descarga que paraliza.`,
        ),
        c(
          `Varios Magnemite te acompañan y descargan rayos sobre los enemigos mientras el campo magnético los arrastra.`,
        ),
      ],
      type: `electric`,
      cls: `special`,
      dur: [2, 3.2],
      tint: 16771178,
      preload: [81],
      cast(e) {
        let t = e.run,
          n = 12 * e.R,
          r = (r) =>
            W(
              t,
              r,
              (e, i) => {
                let a = t.player.pos;
                for (let i = 0; i < 6; i++) {
                  let o = e * 3 + (i / 6) * H,
                    s = n * (1 - (e / r) * 0.5);
                  t.vfx.norm.spawn({
                    x: a.x + Math.cos(o) * s,
                    y: a.y + 1.2,
                    z: a.z + Math.sin(o) * s,
                    life: 0.06,
                    size: 1,
                    endSize: 1,
                    color: 16777215,
                    shape: vl.PixMagnet,
                    rot: o + Math.PI / 2,
                  });
                }
                if (Math.random() < 0.4) {
                  let e = F.range(0, H);
                  t.vfx.lightning(
                    a.x + Math.cos(e) * n * 0.8,
                    a.y + 1,
                    a.z + Math.sin(e) * n * 0.8,
                    a.x,
                    a.y + 1,
                    a.z,
                    16773242,
                    0.15,
                    5,
                    0.1,
                  );
                }
                (t.vfx.staticRing(a.x, a.y, a.z, n, 12110048, 0.5, L.Dashed), kh(t, a.x, a.z, n + 2, 34 * i));
              },
              () => {
                let r = t.player.pos,
                  i = t.enemies;
                for (let e of Ah(t, r.x, r.z, n, 16))
                  t.vfx.lightning(r.x, r.y + 1.2, r.z, i.x[e], i.y[e] + 0.8, i.z[e], Y.volt, 0.4, 6, 0.25);
                (K(t, r.x, r.y, r.z, n * 0.8, [Y.volt, 12110048, 16777215], 3, 0.05, L.Dashed),
                  q(e, r.x, r.z, n, 1.6, { status: `paralysis`, statusChance: 1, knock: 3 }),
                  t.shake(0.3),
                  J.boom(t.audio, 0.7),
                  J.zap(t.audio));
              },
            );
        (t.audio.kt(110, 1.2, { w: `sawtooth`, lp: 900, v: 0.07, vib: [30, 0.2], a: 0.1 }),
          e.tier === 0
            ? r(1.4)
            : (r(2.6),
              t.ult.drones.add(
                81,
                3 + e.tier,
                3,
                0.9,
                (n, r, i) => {
                  let a = U(t, n, i);
                  (t.vfx.lightning(n, a + 4, i, n, a, i, Y.volt, 0.45, 6, 0.2),
                    t.vfx.norm.spawn({
                      x: n,
                      y: a + 1.2,
                      z: i,
                      life: 0.18,
                      size: 1.8,
                      endSize: 1.2,
                      color: 16777215,
                      shape: I.PixBolt,
                    }),
                    G(t, n, i, 2.2, I.PixCrack, 16777215, 1.4),
                    q(e, n, i, 2.6 * e.R, 0.9, { status: `paralysis`, statusChance: 0.7, knock: 2 }),
                    J.zap(t.audio));
                },
                (e, n, r) => {
                  Math.random() < 0.4 &&
                    t.vfx.add.spawn({
                      x: e,
                      y: n,
                      z: r,
                      life: 0.2,
                      size: 0.3,
                      endSize: 0,
                      color: 16773242,
                      shape: I.Bolt,
                      glow: 0.3,
                    });
                },
              ),
              t.cry(82, 0.6)));
      },
    },
    83: {
      names: [c(`Tajo de Puerro`)],
      descs: [
        c(
          `Tres coronas de puerros giratorios salen de ti en todas direcciones. Con la Madurez, además llueven puerros del cielo y al final cae un puerro gigante que agrieta el suelo.`,
        ),
      ],
      type: `normal`,
      cls: `physical`,
      dur: [2.6],
      tint: Lm,
      cast(e) {
        let t = e.run;
        for (let n = 0; n < 3; n++)
          t.later(n * 0.22, () => {
            (Vm(e, 12, n * 0.26, vl.PixLeek, 1.5, 0.9, 24, { pierce: 99, halo: 3836458 }),
              J.whoosh(t.audio, 0.25, 0.12, 800));
          });
        if (
          (xh(t, e.x, e.y + 1, e.z, I.PixLeaf, 16, 10, 0.6, 0.6, 6),
          e.tier >= 1 &&
            Ih(
              e,
              10,
              1.2,
              15,
              0.45,
              (e, n, r, i) => Eh(t, e, n, r, i, vl.PixLeek, 1.6, 20, 4),
              (n, r, i) => {
                (wh(t, n, r + 0.8, i, vl.PixLeek, 1.6, 2, 0.2, -0.6),
                  xh(t, n, r + 0.5, i, I.PixLeaf, 6, 5, 0.5, 0.5),
                  t.vfx.ring(n, r, i, 2.6, Lm, 0.3, 0.2),
                  q(e, n, i, 2.6 * e.R, 1.2, { knock: 3, critBonus: 0.3 }),
                  J.boom(t.audio, 0.25));
              },
            ),
          e.tier < 2)
        )
          return;
        let n = e.x + e.ax * 7,
          r = e.z + e.az * 7,
          i = U(t, n, r);
        (t.vfx.telegraph(n, i, r, 8 * e.R, Lm, 1.6),
          t.later(1, () => Eh(t, n, i, r, 0.6, vl.PixLeek, 6, 28, 6)),
          t.later(1.6, () => {
            (wh(t, n, i + 2.5, r, vl.PixLeek, 6, 6.5, 0.5, -0.6),
              K(t, n, i, r, 8 * e.R, [Lm, 16777215, 14221232], 3, 0.07, L.Jagged),
              Nh(e, n, r, 6, { len: 12 * e.R, glow: Lm, mul: 0.8 }),
              xh(t, n, i + 1, r, I.PixLeaf, 24, 16, 0.8, 0.7, 8),
              bh(t, n, i, r, 14, 9),
              q(e, n, r, 8 * e.R, 2.6, { status: `stun`, statusChance: 1, knock: 7, critBonus: 0.3 }),
              t.shake(0.5),
              J.boom(t.audio, 1.2));
          }));
      },
    },
    84: {
      names: [c(`Carrera Picoteadora`), c(`Triple Embestida`)],
      descs: [
        c(`Corres de enemigo en enemigo dando nueve picotazos dobles, invulnerable mientras dura.`),
        c(
          `Tres embestidas paralelas de 20 m arrasan el frente y después doce picotazos triples de enemigo en enemigo.`,
        ),
      ],
      type: `normal`,
      cls: `physical`,
      dur: [1.4, 2.4],
      tint: 14198888,
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = e.tier >= 1,
          i = new Set(),
          a = (r, a, o) => {
            for (let s = 0; s < r; s++)
              t.later(a + s * 0.11, () => {
                if (t.state !== `play` && t.state !== `dead`) return;
                let r = Hh(t, 14, i);
                if (!(r < 0)) {
                  (i.add(r), Vh(t, r, 16767136));
                  for (let e = 0; e < o; e++) {
                    let e = F.range(-0.6, 0.6),
                      i = F.range(-0.6, 0.6),
                      a = n.x[r] + e,
                      o = n.y[r] + n.hgt[r] * 0.6,
                      s = n.z[r] + i;
                    (t.vfx.beams.spawn(a, o + 1.4, s, a, o, s, 0.25, 16756848, 0.12),
                      wh(t, a, o, s, I.Twinkle, 0.5, 1.4, 0.15));
                  }
                  (Math.random() < 0.6 &&
                    t.vfx.norm.spawn({
                      x: n.x[r],
                      y: n.y[r] + 1,
                      z: n.z[r],
                      vx: F.range(-2, 2),
                      vy: 3,
                      vz: F.range(-2, 2),
                      gravity: 4,
                      drag: 2,
                      life: 0.7,
                      size: 0.35,
                      endSize: 0.3,
                      color: 16777215,
                      shape: I.PixFeather,
                      spin: 5,
                    }),
                    Dh(e, r, 0.7 * o, { knock: 3 }));
                  for (let e = 0; e < o; e++)
                    t.audio.kt(520 + e * 40, 0.05, { w: `triangle`, to: 0.75, v: 0.07, d: e * 0.03 });
                  t.shake(0.04);
                }
              });
          };
        if (!r) {
          a(9, 0, 2);
          return;
        }
        let o = 20 * e.R,
          s = e.ax,
          c = e.az,
          l = -c,
          u = s;
        for (let n of [-2.5, 0, 2.5]) {
          let r = e.x + l * n * e.R,
            i = e.z + u * n * e.R,
            a = new Set();
          t.ghostDash(r, e.y, i, s, c, o, 16767136);
          for (let n = 0; n <= 12; n++)
            t.later(n * 0.02, () => {
              let l = r + (s * o * n) / 12,
                u = i + (c * o * n) / 12;
              (n % 3 == 0 && t.vfx.dust(l, U(t, l, u), u, 14207144, 4, 3),
                Oh(e, a, l, u, 2 * e.R, 1.8, { dirX: s, dirZ: c, knock: 5 }));
            });
        }
        (J.whoosh(t.audio, 0.4, 0.18, 450),
          t.later(0.3, () => {
            Bm(e, e.x + s * o, e.z + c * o);
          }),
          a(12, 0.45, 3),
          t.cry(85, 0.6));
      },
    },
    86: {
      names: [c(`Pista de Hielo`), c(`Aurora Polar`)],
      descs: [
        c(
          `El suelo se cubre de hielo en 13 m: los enemigos patinan hacia fuera, se van congelando y al final estallan esquirlas.`,
        ),
        c(
          `Rayos de aurora caen sobre doce enemigos y los congelan, una onda helada barre 15 m y empieza a granizar.`,
        ),
      ],
      type: `ice`,
      cls: `special`,
      dur: [2, 3],
      tint: Im,
      cast(e) {
        let t = e.run,
          n = 13 * e.R,
          r = e.x,
          i = e.z;
        t.vfx.groundN.spawn({
          x: r,
          y: U(t, r, i) + 0.1,
          z: i,
          life: 2.2,
          size: 2,
          endSize: n * 2,
          color: 10146024,
          shape: I.Soft,
          rot: 0,
        });
        for (let e = 0; e < 20; e++) {
          let a = (e / 20) * H,
            o = n * F.range(0.3, 1),
            s = r + Math.cos(a) * o,
            c = i + Math.sin(a) * o;
          t.later(e * 0.03, () => Ch(t, s, c, I.Shard, 1.4, 1.6, 4, 12577535));
        }
        let a = 0;
        if (
          (W(
            t,
            1.6,
            (o, s) => {
              let c = t.enemies;
              for (let e of c.within(r, i, n)) {
                let t = c.x[e] - r,
                  n = c.z[e] - i,
                  a = Math.hypot(t, n) || 1,
                  o = c.flags[e] & R.Boss ? 0.1 : 1;
                ((c.kx[e] += (t / a) * 12 * s * o), (c.kz[e] += (n / a) * 12 * s * o));
              }
              if (Math.random() < 0.6) {
                let e = F.range(0, H),
                  a = F.range(1, n);
                t.vfx.add.spawn({
                  x: r + Math.cos(e) * a,
                  y: U(t, r, i) + 0.3,
                  z: i + Math.sin(e) * a,
                  life: 0.4,
                  size: 0.4,
                  endSize: 0,
                  color: 15268095,
                  shape: I.Twinkle,
                  glow: 0.3,
                });
              }
              ((a -= s),
                a <= 0 &&
                  ((a = 0.4),
                  q(e, r, i, n, 0.25, { status: `freeze`, statusChance: 1, knock: 0, silent: !0 })));
            },
            () => {
              for (let e = 0; e < 24; e++) {
                let a = (e / 24) * H;
                t.vfx.norm.spawn({
                  x: r,
                  y: U(t, r, i) + 0.8,
                  z: i,
                  vx: Math.cos(a) * n * 2,
                  vy: F.range(1, 4),
                  vz: Math.sin(a) * n * 2,
                  drag: 2,
                  life: 0.6,
                  size: 0.8,
                  endSize: 0.5,
                  color: 12577535,
                  shape: I.Shard,
                  rot: a,
                });
              }
              (K(t, r, U(t, r, i), i, n, [Im, 16777215], 2, 0.06, L.Ripple),
                q(e, r, i, n, 1.5, { status: `freeze`, statusChance: 1, knock: 3 }),
                t.shake(0.25),
                J.boom(t.audio, 0.6));
            },
          ),
          J.whoosh(t.audio, 1.2, 0.08, 1100),
          e.tier === 0)
        )
          return;
        let o = t.enemies;
        (Ah(t, r, i, 16 * e.R, 12).forEach((n, r) =>
          t.later(0.3 + r * 0.1, () => {
            if (!o.isAlive(n)) return;
            let i = o.x[n],
              a = o.z[n],
              s = U(t, i, a),
              c = zm[r % 3];
            (Th(t, i, s, a, 0.9, c, 16777215, 0.45, 12),
              t.vfx.norm.spawn({
                x: i,
                y: s + 1,
                z: a,
                vy: 3,
                drag: 5,
                life: 0.8,
                size: 1.5,
                endSize: 1.9,
                color: 12577535,
                shape: I.Shard,
              }),
              q(e, i, a, 2.6 * e.R, 1.3, { status: `freeze`, statusChance: 1, knock: 1 }));
            for (let e = 0; e < 3; e++) t.combat.applyStatus(n, `freeze`, 1);
            J.chord(t.audio, [659 + (r % 3) * 120], 0.03, 0, 0.4);
          }),
        ),
          t.later(1.9, () => {
            (Ph(
              e,
              15 * e.R,
              0.8,
              1.4,
              { status: `freeze`, statusChance: 1, knock: 4 },
              (e, n, r, i) =>
                t.vfx.norm.spawn({
                  x: e,
                  y: n + 0.8,
                  z: r,
                  vx: Math.cos(i) * 3,
                  vy: F.range(1, 3),
                  vz: Math.sin(i) * 3,
                  drag: 2,
                  life: 0.4,
                  size: 0.6,
                  endSize: 0.3,
                  color: 16777215,
                  shape: I.PixSnow,
                  spin: 3,
                }),
              40,
            ),
              t.later(0.6, () => t.setWeather(`hail`, 10)),
              J.whoosh(t.audio, 0.8, 0.12, 900));
          }),
          t.cry(87, 0.6));
      },
    },
    88: {
      names: [c(`Marea de Lodo`), c(`Engullir`)],
      descs: [
        c(`Una ola de lodo sale de ti en círculo hasta 14 m, envenena a todos y deja charcos tóxicos.`),
        c(
          `Te derrites en un charco gigante de 9 m que arrastra hacia dentro, envenena y atrapa 2 s, y revienta en géiseres de lodo.`,
        ),
      ],
      type: `poison`,
      cls: `special`,
      dur: [1.8, 2.8],
      tint: 10115800,
      cast(e) {
        let t = e.run,
          n = (n, r, i, a) => {
            let o = U(t, n, r);
            (t.vfx.groundN.spawn({
              x: n,
              y: o + 0.09,
              z: r,
              life: a,
              size: i * 1.6,
              endSize: i * 1.7,
              color: 6957706,
              shape: I.PixSludge,
              rot: F.range(0, H),
            }),
              t.zones.add({
                x: n,
                z: r,
                y: o,
                r: i,
                life: a,
                tick: 0,
                dmg: e.dmg * 0.12,
                type: `poison`,
                cls: `special`,
                status: `poison`,
                chance: 0.8,
                slot: 8,
                color: Y.poison,
                fx: Kp(`poison-gas`),
              }));
          };
        if (e.tier === 0) {
          Ph(
            e,
            14 * e.R,
            0.9,
            1.6,
            { status: `poison`, statusChance: 1, knock: 5 },
            (e, n, r, i) => {
              (t.vfx.norm.spawn({
                x: e,
                y: n + 0.7,
                z: r,
                vx: Math.cos(i) * 4,
                vy: 0.5,
                vz: Math.sin(i) * 4,
                life: 0.3,
                size: 1.8,
                endSize: 2,
                color: 14201087,
                shape: I.PixWave,
              }),
                t.vfx.norm.spawn({
                  x: e,
                  y: n + 1.2,
                  z: r,
                  vx: Math.cos(i) * 3,
                  vy: F.range(3, 5),
                  vz: Math.sin(i) * 3,
                  gravity: 16,
                  life: 0.5,
                  size: 0.5,
                  endSize: 0.3,
                  color: 16777215,
                  shape: I.PixSludge,
                }));
            },
            40,
          );
          for (let r = 0; r < 8; r++)
            t.later(0.3 + r * 0.05, () => {
              let t = (r / 8) * H + F.range(-0.2, 0.2),
                i = F.range(4, 11) * e.R;
              n(e.x + Math.cos(t) * i, e.z + Math.sin(t) * i, 2.2, 4);
            });
          (J.goo(t.audio, 0.2), J.water(t.audio, 0.8, 0.12));
          return;
        }
        let r = 9 * e.R,
          i = e.x,
          a = e.z;
        (t.vfx.groundN.spawn({
          x: i,
          y: U(t, i, a) + 0.1,
          z: a,
          life: 2.4,
          size: 2,
          endSize: r * 2.1,
          color: 5906552,
          shape: I.PixSludge,
          rot: F.range(0, H),
        }),
          (t.player.squash = 0.8));
        let o = 0;
        (W(
          t,
          2,
          (n, s) => {
            kh(t, i, a, r + 3, 40 * s);
            for (let e = 0; e < 2; e++) {
              let e = F.range(0, H),
                n = F.range(0.5, r);
              t.vfx.norm.spawn({
                x: i + Math.cos(e) * n,
                y: U(t, i, a) + 0.3,
                z: a + Math.sin(e) * n,
                vy: F.range(1, 2.5),
                gravity: 6,
                life: 0.6,
                size: 0.4,
                endSize: 0.6,
                color: 16777215,
                shape: I.PixToxic,
              });
            }
            if (
              (t.vfx.staticRing(i, U(t, i, a), a, r * Math.min(1, 0.3 + n), 9067208, 0.6), (o -= s), o <= 0)
            ) {
              ((o = 0.25), q(e, i, a, r, 0.35, { status: `poison`, statusChance: 1, knock: 0, silent: !0 }));
              for (let e of t.enemies.within(i, a, r)) t.combat.applyStatus(e, `root`, 1);
            }
          },
          () => {
            for (let e = 0; e < 10; e++) {
              let n = (e / 10) * H,
                o = r * F.range(0.3, 0.9),
                s = i + Math.cos(n) * o,
                c = a + Math.sin(n) * o,
                l = U(t, s, c);
              for (let e = 0; e < 5; e++)
                t.vfx.norm.spawn({
                  x: s + F.range(-0.4, 0.4),
                  y: l + 0.4,
                  z: c + F.range(-0.4, 0.4),
                  vy: F.range(8, 13),
                  gravity: 14,
                  life: 0.8,
                  size: 0.7,
                  endSize: 0.5,
                  color: 16777215,
                  shape: e % 2 ? I.PixToxic : I.PixSludge,
                });
            }
            (K(t, i, U(t, i, a), a, r * 1.2, [10115800, 14201087, 16777215], 3, 0.06),
              q(e, i, a, r * 1.2, 2, { status: `poison`, statusChance: 1, knock: 6 }));
            for (let e = 0; e < 6; e++) {
              let t = (e / 6) * H;
              n(i + Math.cos(t) * r * 0.7, a + Math.sin(t) * r * 0.7, 2.4, 4);
            }
            (t.shake(0.4), J.boom(t.audio, 0.9), J.goo(t.audio, 0.2, 0.05));
          },
        ),
          t.audio.kt(70, 2, { w: `sawtooth`, lp: 380, v: 0.08, vib: [5, 0.1], a: 0.3 }),
          J.goo(t.audio, 0.18),
          t.cry(89, 0.6));
      },
    },
    90: {
      names: [c(`Concha de Perlas`), c(`Lluvia de Carámbanos`)],
      descs: [
        c(
          `Te encierras en la concha (escudo del 30%) y al abrirla disparas dos coronas de 20 perlas que congelan.`,
        ),
        c(
          `La concha, dieciocho carámbanos que caen del cielo sobre los enemigos y un anillo de púas de hielo a tu alrededor.`,
        ),
      ],
      type: `ice`,
      cls: `physical`,
      dur: [1.8, 2.8],
      tint: 13150448,
      cast(e) {
        let t = e.run,
          n = t.player;
        n.shield = Math.max(n.shield, n.maxHp * 0.3);
        for (let n of [-1, 1])
          t.vfx.norm.spawn({
            x: e.x,
            y: e.y + 1.2 + n * 1.6,
            z: e.z,
            vy: -n * 4,
            drag: 5,
            life: 0.8,
            size: 2.4,
            endSize: 2.4,
            color: 16777215,
            shape: vl.PixShell,
            rot: n > 0 ? Math.PI : 0,
          });
        for (let e = 0; e < 3; e++)
          t.later(e * 0.2, () => t.vfx.ring(n.pos.x, n.pos.y, n.pos.z, 4, 13150448, 0.3, 0.3));
        (t.audio.kt(200, 0.6, { w: `triangle`, lp: 900, v: 0.06, to: 0.7, a: 0.1 }),
          t.later(0.75, () => {
            let r = n.pos;
            (wh(t, r.x, r.y + 1.2, r.z, vl.PixShell, 2.4, 3.4, 0.3),
              Sh(t, r.x, r.y + 1.2, r.z, 12095720, 6, 6),
              Vm(e, 20, 0, I.PixBubble, 0.9, 0.7, 26, { status: `freeze`, statusChance: 0.8, halo: 8018616 }),
              t.later(0.18, () =>
                Vm(e, 20, Math.PI / 20, I.PixBubble, 0.9, 0.7, 26, {
                  status: `freeze`,
                  statusChance: 0.8,
                  halo: 8018616,
                }),
              ),
              J.sparkle(t.audio),
              J.whoosh(t.audio, 0.3, 0.12, 900));
          }),
          e.tier !== 0 &&
            (Ih(
              e,
              18,
              1.6,
              16,
              0.45,
              (e, n, r, i) => {
                (Eh(t, e, n, r, i, I.Shard, 2.2, 22, 5, 12577535), t.vfx.telegraph(e, n, r, 2.8, Im, i));
              },
              (n, r, i) => {
                (bh(t, n, r, i, 6, 5, I.Shard, 0.4, 14218495),
                  G(t, n, i, 2.6, I.PixCrack, 16777215, 1.6),
                  t.vfx.ring(n, r, i, 2.8, Im, 0.3, 0.2, L.Jagged),
                  q(e, n, i, 2.8 * e.R, 1.3, { status: `freeze`, statusChance: 1, knock: 2 }),
                  t.audio.kt(1100, 0.12, { w: `triangle`, v: 0.03 }));
              },
            ),
            t.later(1.9, () => {
              let r = n.pos,
                i = 6 * e.R;
              for (let e = 0; e < 16; e++) {
                let n = (e / 16) * H;
                Ch(t, r.x + Math.cos(n) * i, r.z + Math.sin(n) * i, I.Shard, 2.2, 1.2, 8, 12577535);
              }
              (K(t, r.x, r.y, r.z, i + 2, [Im, 13150448, 16777215], 3, 0.06, L.Jagged),
                q(e, r.x, r.z, i + 2, 1.8, { status: `freeze`, statusChance: 1, knock: 6 }),
                t.shake(0.3),
                J.boom(t.audio, 0.7));
            }),
            t.cry(91, 0.6)));
      },
    },
  },
  Wm = (e) => e.run.state === `play` || e.run.state === `dead`;
function Gm(e, t, n, r = 1) {
  let i = e.run,
    a = U(i, t, n);
  for (let e = 0; e < 10; e++)
    i.vfx.norm.spawn({
      x: t + F.range(-0.5, 0.5),
      y: a + 0.4,
      z: n + F.range(-0.5, 0.5),
      vx: F.range(-1.2, 1.2),
      vy: F.range(8, 13) * r,
      vz: F.range(-1.2, 1.2),
      gravity: 18,
      life: 0.9,
      size: 0.5,
      endSize: 0.3,
      color: 16777215,
      shape: I.PixDrop,
    });
  i.vfx.norm.spawn({
    x: t,
    y: a + 1.2,
    z: n,
    vy: 4,
    drag: 4,
    life: 0.5,
    size: 1.8 * r,
    endSize: 2.4 * r,
    color: 16777215,
    shape: I.PixWave,
  });
}
var Km = {
    92: {
      names: [c(`Nube Maldita`), c(`Manos Sombrías`), c(`Sombra de Gengar`)],
      descs: [
        c(
          `Una nube de gas venenoso de 12 m te envuelve 2,5 s: maldice (+25% de daño recibido) y envenena a todo lo que respira.`,
        ),
        c(
          `Catorce manos de sombra salen del suelo bajo los enemigos, los agarran (enraizar) y los maldicen.`,
        ),
        c(
          `Seis Gengar salen de tu sombra y se lanzan sobre los enemigos mientras llueven Bolas Sombra; los malditos reciben el doble.`,
        ),
      ],
      type: `ghost`,
      cls: `special`,
      dur: [2.6, 2, 3.2],
      tint: 6965928,
      preload: [94],
      cast(e) {
        let t = e.run,
          n = t.player;
        if (e.tier === 0) {
          let r = 0;
          (W(t, 2.5, (i, a) => {
            let o = n.pos,
              s = 12 * e.R;
            for (let e = 0; e < 3; e++) {
              let e = F.range(0, H),
                n = F.range(0.5, s);
              t.vfx.norm.spawn({
                x: o.x + Math.cos(e) * n,
                y: o.y + F.range(0.3, 1.6),
                z: o.z + Math.sin(e) * n,
                vx: F.range(-0.6, 0.6),
                vy: F.range(0.3, 1),
                vz: F.range(-0.6, 0.6),
                drag: 1,
                life: 1.1,
                size: 1,
                endSize: 2,
                color: 10119896,
                endColor: 4864618,
                shape: I.PixPuff,
              });
            }
            (Math.random() < 0.25 &&
              t.vfx.add.spawn({
                x: o.x + F.range(-s, s) * 0.6,
                y: o.y + 1.5,
                z: o.z + F.range(-s, s) * 0.6,
                vy: 1,
                life: 0.6,
                size: 0.5,
                endSize: 0.9,
                color: 12618495,
                shape: I.Skull,
                glow: 0.2,
              }),
              t.vfx.staticRing(o.x, o.y, o.z, s, 8018648, 0.5, L.Runes),
              (r -= a),
              r <= 0 &&
                ((r = 0.35),
                q(e, o.x, o.z, s, 0.35, {
                  status: Math.random() < 0.5 ? `curse` : `poison`,
                  statusChance: 0.9,
                  knock: 0,
                  silent: !0,
                })));
          }),
            t.audio.kt(180, 1.6, { w: `triangle`, lp: 700, v: 0.08, to: 0.6, vib: [5, 0.06], a: 0.4 }));
          return;
        }
        if (e.tier === 1) {
          let r = Ah(t, e.x, e.z, 16 * e.R, 14);
          for (let i = 0; i < 14; i++)
            t.later(0.1 + i * 0.06, () => {
              let a = jh(t, n.pos.x, n.pos.z, 12, r, i),
                o = U(t, a.x, a.z);
              (Ch(t, a.x, a.z, I.PixClaw, 2.2, 0.9, 7, 9071320),
                t.vfx.norm.spawn({
                  x: a.x,
                  y: o + 0.1,
                  z: a.z,
                  life: 1,
                  size: 2.4,
                  endSize: 2.6,
                  color: 2364462,
                  shape: I.Soft,
                }),
                q(e, a.x, a.z, 2.6 * e.R, 1.4, { status: `curse`, statusChance: 1, knock: 0.5 }));
              for (let n of t.enemies.within(a.x, a.z, 2.6 * e.R)) t.combat.applyStatus(n, `root`, 1);
              J.whoosh(t.audio, 0.15, 0.06, 300);
            });
          t.audio.kt(120, 1.2, { w: `sawtooth`, lp: 500, v: 0.08, to: 0.7, vib: [6, 0.08], a: 0.2 });
          return;
        }
        let r = t.enemies;
        (t.ult.drones.add(
          94,
          6,
          3,
          1,
          (n, i, a) => {
            (wh(t, n, i + 0.6, a, I.PixDragonFire, 1.4, 2.2, 0.25),
              t.vfx.ring(n, U(t, n, a), a, 2.6, 8018648, 0.3, 0.2, L.Runes));
            for (let t of r.within(n, a, 2.6 * e.R))
              Dh(e, t, r.curse[t] > 0 ? 1.8 : 0.9, { status: `curse`, statusChance: 1, knock: 2 });
            J.whoosh(t.audio, 0.15, 0.06, 400);
          },
          (e, n, r) => {
            Math.random() < 0.5 &&
              t.vfx.norm.spawn({
                x: e,
                y: n,
                z: r,
                life: 0.3,
                size: 0.6,
                endSize: 0.2,
                color: 3809360,
                shape: I.Soft,
              });
          },
        ),
          Ih(
            e,
            12,
            2.2,
            16,
            0.5,
            (e, n, r, i) => {
              (Eh(t, e, n, r, i, I.PixDragonFire, 2, 22, 5, 5913242),
                t.vfx.telegraph(e, n, r, 3, 8018648, i));
            },
            (n, i, a) => {
              (xh(t, n, i + 0.6, a, I.PixDragonFire, 8, 6, 0.7, 0.5), G(t, n, a, 3, I.PixCrack, 16777215, 2));
              for (let t of r.within(n, a, 3 * e.R))
                Dh(e, t, r.curse[t] > 0 ? 2.2 : 1.1, { status: `curse`, statusChance: 0.8, knock: 2 });
              J.boom(t.audio, 0.35);
            },
          ),
          t.cry(94, 0.7));
      },
    },
    95: {
      names: [c(`Serpiente de Roca`)],
      descs: [
        c(
          `Onix asoma del suelo en círculo a tu alrededor, levantando rocas y grietas que aturden. Con la Madurez da dos vueltas y caen rocas del cielo.`,
        ),
      ],
      type: `rock`,
      cls: `physical`,
      dur: [2.8],
      tint: 11047018,
      preload: [95],
      cast(e) {
        let t = e.run,
          n = e.tier >= 1 ? 2 : 1,
          r = Math.atan2(e.az, e.ax);
        for (let i = 0; i < n; i++)
          for (let n = 0; n < 7; n++)
            t.later(i * 1.05 + n * 0.14, () => {
              if (!Wm(e)) return;
              let a = t.player.pos,
                o = (7 + i * 5) * e.R,
                s = r + (n / 7) * H + i * 0.4,
                c = a.x + Math.cos(s) * o,
                l = a.z + Math.sin(s) * o;
              if (!t.terrain.inBounds(c, l, 2)) return;
              let u = U(t, c, l);
              (t.ult.risers.add(95, c, l, 0.9, 1.25),
                bh(t, c, u, l, 10, 6, I.PixRock, 0.5),
                t.vfx.dust(c, u, l, 13154456, 10, 4),
                G(t, c, l, 4, I.PixCrack, 16777215, 2.2),
                Ch(t, c + F.range(-1, 1), l + F.range(-1, 1), I.PixSpike, 2.2, 0.9, 6),
                q(e, c, l, 3.6 * e.R, 1.5, { status: `stun`, statusChance: 0.8, knock: 4 }),
                t.shake(0.12, c, l),
                J.rumble(t.audio, 0.3, 0.14));
            });
        (e.tier >= 2 &&
          Ih(
            e,
            10,
            1.2,
            15,
            0.5,
            (e, n, r, i) => {
              (Eh(t, e, n, r, i, I.PixRock, 2.4, 24, 6), t.vfx.telegraph(e, n, r, 3.4, 11047018, i));
            },
            (n, r, i) => {
              (bh(t, n, r, i, 8, 6),
                G(t, n, i, 3.4, I.PixCrack),
                t.vfx.dust(n, r, i, 13154456, 8, 4),
                q(e, n, i, 3.4 * e.R, 1.3, { status: `stun`, statusChance: 0.6, knock: 3 }),
                J.boom(t.audio, 0.4));
            },
          ),
          t.later(n * 1.05 + 0.1, () => {
            let n = t.player.pos,
              r = (10 + e.tier * 2) * e.R;
            (K(t, n.x, n.y, n.z, r, [11047018, 14207144, 16777215], 3, 0.07, L.Jagged),
              Nh(e, n.x, n.z, 5, {
                len: r,
                mul: 0.8,
                erupt: (e, n, r, i) => Ch(t, e, r, I.PixSpike, 2 - i, 0.8, 6),
              }),
              q(e, n.x, n.z, r, 1.4, { status: `stun`, statusChance: 1, knock: 6 }),
              t.shake(0.4),
              J.boom(t.audio, 1));
          }),
          t.cry(95, 0.7));
      },
    },
    96: {
      names: [c(`Péndulo Hipnótico`), c(`Devorasueños`)],
      descs: [
        c(
          `Un péndulo gigante oscila sobre ti: todo en 14 m se duerme y luego tres ondas psíquicas golpean a los dormidos (+80%).`,
        ),
        c(
          `El péndulo duerme a todos en 16 m y te comes sus sueños: cada dormido recibe un golpe enorme y te cura (hasta un 30%).`,
        ),
      ],
      type: `psychic`,
      cls: `special`,
      dur: [2.2, 2.4],
      tint: 11565784,
      cast(e) {
        let t = e.run,
          n = t.player,
          r = (e.tier >= 1 ? 16 : 14) * e.R;
        W(t, 1.1, (r) => {
          let i = n.pos,
            a = Math.sin(r * 7) * 2.2,
            o = i.y + 7,
            s = i.x - e.az * a,
            c = i.z + e.ax * a,
            l = i.y + 3.4;
          (t.vfx.beams.spawn(i.x, o, i.z, s, l, c, 0.05, 15261936, 0.04, 0.6),
            t.vfx.norm.spawn({
              x: s,
              y: l,
              z: c,
              life: 0.05,
              size: 1.8,
              endSize: 1.8,
              color: 16777215,
              shape: I.PixCoin,
            }),
            Math.random() < 0.4 &&
              t.vfx.add.spawn({
                x: s,
                y: l,
                z: c,
                life: 0.3,
                size: 0.5,
                endSize: 0,
                color: 16773280,
                shape: I.Twinkle,
                glow: 0.3,
              }));
        });
        for (let e = 0; e < 3; e++)
          t.later(e * 0.35, () =>
            t.vfx.ring(n.pos.x, n.pos.y, n.pos.z, r * (0.4 + e * 0.3), 12099839, 0.6, 0.5, L.Runes),
          );
        if (
          (t.later(0.8, () => {
            for (let e of t.enemies.within(n.pos.x, n.pos.z, r))
              (t.combat.applyStatus(e, `sleep`, 1),
                Math.random() < 0.4 &&
                  t.vfx.norm.spawn({
                    x: t.enemies.x[e],
                    y: t.enemies.y[e] + t.enemies.hgt[e] + 0.4,
                    z: t.enemies.z[e],
                    vy: 1,
                    life: 0.9,
                    size: 0.45,
                    endSize: 0.7,
                    color: 10148095,
                    shape: I.PixSleepZ,
                  }));
          }),
          t.audio.kt(330, 1.1, { v: 0.05, to: 0.7, vib: [3, 0.1], a: 0.2 }),
          e.tier === 0)
        )
          for (let r = 0; r < 3; r++)
            t.later(1.2 + r * 0.3, () => {
              let i = n.pos,
                a = (6 + r * 4) * e.R;
              (K(t, i.x, i.y + 0.5, i.z, a, [16739032, 12099839], 2, 0.05, L.Runes),
                q(e, i.x, i.z, a, 0.9, { status: `confusion`, statusChance: 0.5, knock: 2 }),
                t.audio.kt(240 + r * 60, 0.3, { v: 0.06, vib: [8, 0.06], to: 1.4 }));
            });
        else
          (t.later(1.25, () => {
            let i = t.enemies,
              a = n.pos,
              o = 0;
            (i
              .within(a.x, a.z, r)
              .filter((e) => i.isAlive(e) && i.sleep[e] > 0)
              .slice(0, 30)
              .forEach((r, a) =>
                t.later((a % 10) * 0.04, () => {
                  i.isAlive(r) &&
                    (t.vfx.beams.spawn(
                      i.x[r],
                      i.y[r] + 1,
                      i.z[r],
                      n.pos.x,
                      n.pos.y + 1.4,
                      n.pos.z,
                      0.18,
                      13144319,
                      0.3,
                      0.7,
                    ),
                    t.vfx.norm.spawn({
                      x: i.x[r],
                      y: i.y[r] + 1.2,
                      z: i.z[r],
                      vy: 2,
                      life: 0.5,
                      size: 0.6,
                      endSize: 0.2,
                      color: 10148095,
                      shape: I.PixSleepZ,
                    }),
                    Dh(e, r, 1.5, { knock: 1 }),
                    o < 0.3 && ((o += 0.012), n.heal(n.maxHp * 0.012)));
                }),
              ),
              Sh(t, a.x, a.y + 1.5, a.z, 14199039, 16, 5),
              t.audio.heal(),
              J.chord(t.audio, [262, 330, 392], 0.04));
          }),
            e.tier >= 2 &&
              t.later(1.9, () => {
                let i = n.pos;
                (K(t, i.x, i.y, i.z, r, [16739032, 12099839, 16777215], 3, 0.06, L.Runes),
                  q(e, i.x, i.z, r, 1.2, { status: `confusion`, statusChance: 1, knock: 4 }),
                  J.boom(t.audio, 0.7));
              }));
      },
    },
    98: {
      names: [c(`Tijeretazo`), c(`Guillotina Abisal`)],
      descs: [
        c(
          `Dos pinzas gigantes cortan el suelo en X hacia tu objetivo: grietas de 14 m que aturden, y una ola al final.`,
        ),
        c(
          `Las grietas en X y una pinza gigante cae sobre los tres enemigos más fuertes (aturde) entre géiseres de agua.`,
        ),
      ],
      type: `water`,
      cls: `physical`,
      dur: [1.6, 2.4],
      tint: 15231562,
      cast(e) {
        let t = e.run,
          n = Math.atan2(e.az, e.ax),
          r = t.enemies;
        for (let r of [-1, 1]) {
          let i = n + r * 0.45;
          (wh(
            t,
            e.x + Math.cos(i) * 1.5,
            e.y + 1.2,
            e.z + Math.sin(i) * 1.5,
            bl.PixPincer,
            2.2,
            3,
            0.3,
            r > 0 ? Math.PI : 0,
          ),
            Mh(e, e.x, e.z, i, {
              len: 14 * e.R,
              mul: 1.5,
              glow: 8046847,
              o: { status: `stun`, statusChance: 0.8, knock: 3 },
              erupt: (e, n, r) => {
                Math.random() < 0.6 &&
                  t.vfx.norm.spawn({
                    x: e,
                    y: n + 0.4,
                    z: r,
                    vx: F.range(-1, 1),
                    vy: F.range(4, 8),
                    vz: F.range(-1, 1),
                    gravity: 16,
                    life: 0.6,
                    size: 0.4,
                    endSize: 0.2,
                    color: 16777215,
                    shape: I.PixDrop,
                  });
              },
            }));
        }
        (t.audio.kn(0.08, { f: 1800, q: 1.2, v: 0.14, a: 0.001 }),
          J.rumble(t.audio, 0.6, 0.14),
          t.later(0.7, () => {
            (Ph(
              e,
              10 * e.R,
              0.7,
              0.9,
              { status: `wet`, statusChance: 1, knock: 4 },
              (e, n, r, i) =>
                t.vfx.norm.spawn({
                  x: e,
                  y: n + 0.8,
                  z: r,
                  vx: Math.cos(i) * 4,
                  vy: 0.5,
                  vz: Math.sin(i) * 4,
                  life: 0.3,
                  size: 1.8,
                  endSize: 2,
                  color: 16777215,
                  shape: I.PixWave,
                }),
              30,
            ),
              J.water(t.audio, 0.6, 0.14));
          }),
          e.tier !== 0 &&
            (Ah(t, e.x, e.z, 16 * e.R, 14)
              .sort((e, t) => r.hp[t] - r.hp[e])
              .slice(0, 3)
              .forEach((n, i) =>
                t.later(0.5 + i * 0.3, () => {
                  let i = r.isAlive(n) ? r.x[n] : e.x + F.range(-6, 6),
                    a = r.isAlive(n) ? r.z[n] : e.z + F.range(-6, 6),
                    o = U(t, i, a);
                  (Eh(t, i, o, a, 0.35, bl.PixPincer, 3.2, 20, 3),
                    t.vfx.telegraph(i, o, a, 4.5, 15224890, 0.35),
                    t.later(0.35, () => {
                      t.vfx.flash(i, o + 1, a, 16765112, 4.5, 0.15);
                      for (let e = 0; e < 2; e++)
                        G(t, i, a, 6, I.PixCrack, 16777215, 2.5, (e * Math.PI) / 2 + 0.6);
                      (K(t, i, o, a, 4.5 * e.R, [15224890, 16765112, 16777215], 3, 0.05, L.Jagged),
                        bh(t, i, o, a, 10, 7),
                        q(e, i, a, 4.5 * e.R, 2.4, { status: `stun`, statusChance: 1, knock: 6 }),
                        t.shake(0.3, i, a),
                        J.boom(t.audio, 0.9));
                    }));
                }),
              ),
            Ih(
              e,
              8,
              1.4,
              14,
              0.3,
              (e, n, r, i) => G(t, e, r, 2.4, I.PixCrack, 16777215, i + 0.6),
              (n, r, i) => {
                (Gm(e, n, i),
                  q(e, n, i, 2.6 * e.R, 1, { status: `wet`, statusChance: 1, knock: 3 }),
                  J.water(t.audio, 0.25, 0.08));
              },
            ),
            t.cry(99, 0.6)));
      },
    },
    100: {
      names: [c(`Rodada Eléctrica`), c(`Gran Explosión`)],
      descs: [
        c(`Ruedas de enemigo en enemigo ocho veces y cada choque estalla en chispas que paralizan.`),
        c(
          `Te cargas de electricidad y explotas sin debilitarte: una explosión de 15 m con ocho grietas eléctricas; con la Madurez, Voltorb se lanzan en picado y estallan.`,
        ),
      ],
      type: `electric`,
      cls: `special`,
      dur: [1.4, 2.4],
      tint: 16765498,
      preload: [100],
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = t.player;
        if (e.tier === 0) {
          let r = new Set();
          for (let i = 0; i < 8; i++)
            t.later(i * 0.13, () => {
              if (!Wm(e)) return;
              let i = Hh(t, 15, r);
              if (i < 0) return;
              (r.add(i), Vh(t, i, Y.volt));
              let a = n.x[i],
                o = n.z[i],
                s = U(t, a, o);
              t.vfx.flash(a, s + 1, o, Y.volt, 2.4, 0.1);
              for (let e = 0; e < 4; e++) {
                let e = F.range(0, H);
                t.vfx.lightning(
                  a,
                  s + 0.8,
                  o,
                  a + Math.cos(e) * 2.6,
                  s + 0.3,
                  o + Math.sin(e) * 2.6,
                  Y.volt,
                  0.25,
                  4,
                  0.18,
                );
              }
              (G(t, a, o, 2.4, I.PixCrack, 16777215, 1.6),
                q(e, a, o, 2.6 * e.R, 1.2, { status: `paralysis`, statusChance: 0.8, knock: 3 }),
                J.zap(t.audio),
                t.shake(0.06));
            });
        } else
          (W(t, 0.8, (e) => {
            let n = r.pos;
            if (Math.random() < 0.7) {
              let r = F.range(0, H),
                i = 3 - e * 3;
              t.vfx.lightning(
                n.x + Math.cos(r) * i,
                n.y + 1,
                n.z + Math.sin(r) * i,
                n.x,
                n.y + 1,
                n.z,
                Y.volt,
                0.2,
                4,
                0.1,
              );
            }
            r.flash = +(Math.sin(e * 40) > 0);
          }),
            t.audio.kt(110, 0.8, { w: `sawtooth`, lp: 1400, v: 0.08, to: 3, vib: [30, 0.2], a: 0.6 }),
            t.later(0.85, () => {
              let n = r.pos,
                i = 15 * e.R;
              (t.vfx.flash(n.x, n.y + 1, n.z, 16775360, 7, 0.3),
                K(t, n.x, n.y, n.z, i, [Y.volt, 16777215, 16747066], 3, 0.06, L.Dashed));
              for (let e = 0; e < 14; e++) {
                let r = (e / 14) * H;
                t.vfx.lightning(
                  n.x,
                  n.y + 1,
                  n.z,
                  n.x + Math.cos(r) * i,
                  n.y + 0.3,
                  n.z + Math.sin(r) * i,
                  Y.volt,
                  0.35,
                  8,
                  0.3,
                );
              }
              for (let e = 0; e < 24; e++) {
                let e = F.range(0, H),
                  r = F.range(i, i * 2);
                _h(
                  t,
                  n.x,
                  n.y + 0.8,
                  n.z,
                  Math.cos(e) * r,
                  F.range(2, 6),
                  Math.sin(e) * r,
                  0.5,
                  1.4,
                  0.4,
                  2.5,
                );
              }
              (Nh(e, n.x, n.z, 8, {
                len: i,
                glow: Y.volt,
                mul: 0.7,
                o: { status: `paralysis`, statusChance: 0.8 },
              }),
                q(e, n.x, n.z, i, 2.4, { status: `paralysis`, statusChance: 1, knock: 8 }),
                t.shake(0.6),
                J.boom(t.audio, 1.4));
            }),
            e.tier >= 2 &&
              t.later(1, () => {
                (t.ult.drones.add(100, 6, 1.6, 0.8, (n, r, i) => {
                  (t.vfx.flash(n, r + 1, i, Y.volt, 3, 0.12),
                    t.vfx.ring(n, U(t, n, i), i, 3, Y.volt, 0.3, 0.2, L.Dashed),
                    q(e, n, i, 3 * e.R, 1.2, { status: `paralysis`, statusChance: 0.8, knock: 4 }),
                    J.boom(t.audio, 0.35));
                }),
                  t.cry(100, 0.5));
              }));
      },
    },
    102: {
      names: [c(`Lluvia de Huevos`), c(`Palmera Gigante`)],
      descs: [
        c(`Llueven catorce huevos sobre los enemigos: al romperse sueltan una onda psíquica que confunde.`),
        c(
          `Una palmera gigante crece sobre ti, te cura un 15% y deja caer doce huevos gigantes que aturden; las hojas cortan a los cercanos.`,
        ),
      ],
      type: `grass`,
      cls: `special`,
      dur: [1.8, 2.4],
      tint: 11065434,
      cast(e) {
        let t = e.run,
          n = t.player;
        if (e.tier === 0) {
          Ih(
            e,
            14,
            1.4,
            15,
            0.45,
            (e, n, r, i) => {
              (Eh(t, e, n, r, i, bl.PixEgg, 1.6, 20, 4), t.vfx.telegraph(e, n, r, 3, 16767136, i));
            },
            (n, r, i) => {
              (bh(t, n, r, i, 6, 4, I.Shard, 0.35, 16774364),
                t.vfx.ring(n, r, i, 3, 16739032, 0.3, 0.2, L.Runes),
                Sh(t, n, r + 0.5, i, 16759024, 5, 4),
                q(e, n, i, 3 * e.R, 1.2, { status: `confusion`, statusChance: 0.8, knock: 2 }),
                t.audio.kt(300, 0.08, { to: 0.6, v: 0.08 }),
                t.audio.kn(0.05, { f: 1600, q: 2, v: 0.06 }));
            },
          );
          return;
        }
        let r = n.pos;
        Th(t, r.x, r.y, r.z, 2.6, 8050762, 16773792, 1, 14);
        for (let e = 0; e < 10; e++) {
          let n = (e / 10) * H;
          t.vfx.norm.spawn({
            x: r.x,
            y: r.y + 6,
            z: r.z,
            vx: Math.cos(n) * 6,
            vy: -1,
            vz: Math.sin(n) * 6,
            drag: 2.5,
            life: 1.6,
            size: 2.2,
            endSize: 3,
            color: 16777215,
            shape: I.PixLeaf,
            rot: -n,
          });
        }
        (n.heal(n.maxHp * 0.15),
          t.audio.heal(),
          t.later(0.4, () => {
            let r = n.pos,
              i = 7 * e.R;
            (xh(t, r.x, r.y + 1, r.z, I.PixLeaf, 20, i * 2, 0.8, 0.6, i),
              K(t, r.x, r.y, r.z, i, [8050762, 12120186], 2, 0.06, L.Petals),
              q(e, r.x, r.z, i, 1.1, { knock: 4 }));
          }),
          Ih(
            e,
            12 + (e.tier - 1) * 4,
            1.6,
            15,
            0.5,
            (e, n, r, i) => {
              (Eh(t, e, n, r, i, bl.PixEgg, 2.4, 22, 4), t.vfx.telegraph(e, n, r, 3.4, 11040842, i));
            },
            (n, r, i) => {
              (bh(t, n, r, i, 6, 5, I.Shard, 0.4, 13148272),
                G(t, n, i, 3.2, I.PixCrack, 16777215, 2),
                t.vfx.dust(n, r, i, 13154456, 6, 3),
                q(e, n, i, 3.4 * e.R, 1.4, { status: `stun`, statusChance: 0.8, knock: 3 }),
                J.boom(t.audio, 0.35));
            },
          ),
          J.chord(t.audio, [349, 440, 523], 0.04));
      },
    },
    104: {
      names: [c(`Huesomerang Doble`), c(`Garrote Ancestral`)],
      descs: [
        c(
          `Ocho huesos salen girando en espiral hasta 12 m y vuelven a ti, golpeando a la ida y a la vuelta.`,
        ),
        c(
          `Golpeas el suelo con un garrote de hueso gigante: seis grietas con llamas fantasma y una lluvia de huesos sombríos que maldicen.`,
        ),
      ],
      type: `ground`,
      cls: `physical`,
      dur: [1.8, 2.6],
      tint: 14207144,
      cast(e) {
        let t = e.run,
          n = t.player;
        if (e.tier === 0) {
          let r = new Set(),
            i = new Set(),
            a = 1.6;
          (W(t, a, (o) => {
            let s = n.pos,
              c = Math.sin((o / a) * Math.PI) * 12 * e.R + 1,
              l = o < a / 2 ? r : i;
            for (let n = 0; n < 8; n++) {
              let r = (n / 8) * H + o * 3,
                i = s.x + Math.cos(r) * c,
                a = s.z + Math.sin(r) * c;
              (t.vfx.norm.spawn({
                x: i,
                y: s.y + 1,
                z: a,
                life: 0.05,
                size: 1.3,
                endSize: 1.3,
                color: 16777215,
                shape: I.PixBone,
                rot: o * 18 + n,
              }),
                Oh(e, l, i, a, 1.8 * e.R, 1, { knock: 3 }));
            }
          }),
            t.audio.kn(1.4, { f: 600, to: 2, q: 2, v: 0.06, a: 0.3 }));
        } else
          ((n.vel.y = 8),
            (n.squash = -0.5),
            t.later(0.4, () => {
              let r = n.pos,
                i = 9 * e.R;
              (wh(t, r.x, r.y + 2.4, r.z, I.PixBone, 3, 5, 0.3, 0.6),
                K(t, r.x, r.y, r.z, i, [14207144, 10124031, 16777215], 3, 0.06, L.Jagged),
                G(t, r.x, r.z, i * 0.8, I.PixCrack, 16777215, 2.5),
                Nh(e, r.x, r.z, 6, {
                  len: 13 * e.R,
                  glow: 10124031,
                  mul: 1,
                  o: { status: `curse`, statusChance: 0.7 },
                  erupt: (e, n, r) => {
                    Math.random() < 0.6 &&
                      t.vfx.norm.spawn({
                        x: e,
                        y: n + 0.5,
                        z: r,
                        vy: F.range(2, 4),
                        life: 0.6,
                        size: 0.9,
                        endSize: 0.3,
                        color: 16777215,
                        endColor: 11047167,
                        shape: I.PixDragonFire,
                      });
                  },
                }),
                q(e, r.x, r.z, i, 2, { status: `stun`, statusChance: 1, knock: 6 }),
                t.shake(0.45),
                J.boom(t.audio, 1.1));
            }),
            Ih(
              e,
              10 + (e.tier - 1) * 4,
              1.4,
              15,
              0.45,
              (e, n, r, i) => {
                (Eh(t, e, n, r, i, I.PixBone, 1.8, 20, 4, 6965928), t.vfx.telegraph(e, n, r, 3, 10124031, i));
              },
              (n, r, i) => {
                (xh(t, n, r + 0.5, i, I.PixDragonFire, 6, 5, 0.6, 0.5),
                  G(t, n, i, 3, I.PixCrack, 16777215, 1.8),
                  q(e, n, i, 3 * e.R, 1.3, { status: `curse`, statusChance: 1, knock: 2 }),
                  t.audio.kt(380, 0.07, { w: `triangle`, to: 0.75, v: 0.1 }));
              },
            ),
            t.cry(105, 0.6));
      },
    },
    106: {
      names: [c(`Patada Relámpago`)],
      descs: [
        c(
          `Saltas de enemigo en enemigo con seis patadas y acabas con una Patada Salto Alta desde el cielo que agrieta el suelo. Con la Madurez, más patadas y un cráter mayor.`,
        ),
      ],
      type: `fighting`,
      cls: `physical`,
      dur: [2.2],
      tint: 14198906,
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = t.player,
          i = 6 + e.tier * 2,
          a = new Set();
        for (let r = 0; r < i; r++)
          t.later(r * 0.11, () => {
            if (!Wm(e)) return;
            let r = Hh(t, 14, a);
            r < 0 ||
              (a.add(r),
              Vh(t, r, 16763024),
              wh(t, n.x[r], n.y[r] + n.hgt[r] * 0.6, n.z[r], I.Star, 1, 2, 0.16, F.range(-0.4, 0.4)),
              Dh(e, r, 1.2, { status: `stun`, statusChance: 0.5, knock: 4 }),
              t.audio.kt(130, 0.08, { to: 0.5, v: 0.18 }),
              t.audio.kn(0.05, { ft: `lowpass`, f: 1200, v: 0.12 }),
              t.shake(0.04));
          });
        let o = i * 0.11 + 0.05;
        (t.later(o, () => {
          ((r.vel.y = 15), (r.squash = -0.7), J.whoosh(t.audio, 0.4, 0.12, 350));
        }),
          t.later(o + 0.75, () => {
            let n = r.pos,
              i = (9 + e.tier * 2) * e.R;
            for (let e = 0; e < 8; e++) {
              let r = (e / 8) * H;
              t.vfx.beams.spawn(
                n.x + Math.cos(r) * 0.6,
                n.y + 8,
                n.z + Math.sin(r) * 0.6,
                n.x,
                n.y + 0.3,
                n.z,
                0.14,
                16769216,
                0.18,
              );
            }
            ((r.squash = 0.9),
              K(t, n.x, n.y, n.z, i, [16758858, 14203e3, 16777215], 3, 0.06, L.Jagged),
              G(t, n.x, n.z, i * 0.8, I.PixCrack, 16777215, 2.5),
              Nh(e, n.x, n.z, 6, {
                len: i,
                mul: 0.7,
                erupt: (e, n, r, i) => Ch(t, e, r, I.PixSpike, 1.8 - i, 0.8, 6),
              }),
              bh(t, n.x, n.y, n.z, 16, 9),
              q(e, n.x, n.z, i, 2.2, { status: `stun`, statusChance: 1, knock: 7 }),
              t.shake(0.5),
              J.boom(t.audio, 1.2));
          }));
      },
    },
    107: {
      names: [c(`Combo Elemental`)],
      descs: [
        c(
          `Puñetazos de fuego, hielo y rayo caen por turnos sobre nueve enemigos (queman, congelan y paralizan) y acaba con un Puño Certero gigante desde el cielo. Con la Madurez, más golpes.`,
        ),
      ],
      type: `fighting`,
      cls: `physical`,
      dur: [2.4],
      tint: 16758858,
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = 9 + e.tier * 3,
          i = [
            { col: 16747050, st: `burn`, type: `fire` },
            { col: 11071743, st: `freeze`, type: `ice` },
            { col: 16769594, st: `paralysis`, type: `electric` },
          ],
          a = Ah(t, e.x, e.z, 15 * e.R, r);
        for (let n = 0; n < r; n++)
          t.later(0.1 + n * 0.1, () => {
            let r = jh(t, t.player.pos.x, t.player.pos.z, 12, a, n),
              o = U(t, r.x, r.z),
              s = i[n % 3];
            (t.vfx.norm.spawn({
              x: r.x,
              y: o + 3,
              z: r.z,
              vy: -22,
              life: 0.12,
              size: 1.6,
              endSize: 1.8,
              color: s.col,
              shape: I.PixFist,
            }),
              t.later(0.12, () => {
                if (s.type === `fire`)
                  for (let e = 0; e < 6; e++)
                    _h(t, r.x, o + 0.5, r.z, F.range(-3, 3), F.range(3, 6), F.range(-3, 3), 0.4, 0.9, 0.3);
                else if (s.type === `ice`) bh(t, r.x, o, r.z, 6, 4, I.PixSnow, 0.4);
                else
                  for (let e = 0; e < 3; e++) {
                    let e = F.range(0, H);
                    t.vfx.lightning(
                      r.x,
                      o + 0.8,
                      r.z,
                      r.x + Math.cos(e) * 2.5,
                      o + 0.3,
                      r.z + Math.sin(e) * 2.5,
                      s.col,
                      0.25,
                      4,
                      0.16,
                    );
                  }
                (t.vfx.ring(r.x, o, r.z, 2.6, s.col, 0.3, 0.2, L.Jagged),
                  q(e, r.x, r.z, 2.6 * e.R, 1.1, { type: s.type, status: s.st, statusChance: 0.9, knock: 3 }),
                  t.audio.kt(140, 0.09, { to: 0.5, v: 0.18 }),
                  t.shake(0.05, r.x, r.z));
              }));
          });
        t.later(0.2 + r * 0.1, () => {
          let r = Ah(t, t.player.pos.x, t.player.pos.z, 15 * e.R, 12).sort((e, t) => n.hp[t] - n.hp[e])[0],
            i = r != null && n.isAlive(r) ? n.x[r] : t.player.pos.x + e.ax * 6,
            a = r != null && n.isAlive(r) ? n.z[r] : t.player.pos.z + e.az * 6,
            o = U(t, i, a);
          (Eh(t, i, o, a, 0.4, I.PixFist, 4, 24, 4, 16758858),
            t.vfx.telegraph(i, o, a, 6, 16758858, 0.4),
            t.later(0.4, () => {
              (Th(t, i, o, a, 2.6, 16758858, 16773328, 0.5),
                K(t, i, o, a, 6 * e.R, [16758858, 16734778, 16777215], 3, 0.06, L.Jagged),
                G(t, i, a, 7, I.PixCrack, 16777215, 2.5),
                bh(t, i, o, a, 12, 8),
                q(e, i, a, 6 * e.R, 2.6, { status: `stun`, statusChance: 1, knock: 7 }),
                t.shake(0.45, i, a),
                J.boom(t.audio, 1.2));
            }));
        });
      },
    },
    108: {
      names: [c(`Lengüetazo Total`)],
      descs: [
        c(
          `Tu lengua barre 360° a tu alrededor (12 m): arrastra hacia ti y paraliza todo lo que toca. Con la Madurez barre dos veces y acaba con un Cuerpo Pesado que aturde.`,
        ),
      ],
      type: `normal`,
      cls: `physical`,
      dur: [2.4],
      tint: 16751296,
      cast(e) {
        let t = e.run,
          n = t.player,
          r = e.tier >= 1 ? 2 : 1;
        for (let i = 0; i < r; i++)
          t.later(i * 0.9, () => {
            let r = new Set(),
              a = Math.atan2(e.az, e.ax) + i * Math.PI,
              o = i ? -1 : 1;
            (W(t, 0.8, (i) => {
              let s = n.pos,
                c = 12 * e.R,
                l = a + (i / 0.8) * o * H,
                u = s.x + Math.cos(l) * c,
                d = s.z + Math.sin(l) * c;
              Bh(t, s.x, s.y + 1.1, s.z, u, U(t, u, d) + 0.6, d, o * 2, 0.45, [16747184, 16754884], 0.05, 10);
              for (let t = 1; t <= 6; t++) {
                let n = s.x + Math.cos(l) * c * (t / 6),
                  i = s.z + Math.sin(l) * c * (t / 6);
                Oh(e, r, n, i, 1.8 * e.R, 1.1, { status: `paralysis`, statusChance: 0.9, knock: 0 });
              }
              kh(t, s.x, s.z, c, 0.3);
            }),
              t.audio.kt(200, 0.7, { to: 0.5, v: 0.1, a: 0.05 }),
              t.audio.kn(0.6, { ft: `lowpass`, f: 800, v: 0.06, a: 0.1 }));
          });
        e.tier < 2 ||
          (t.later(1.9, () => {
            ((n.vel.y = 12), (n.squash = -0.6));
          }),
          t.later(2.3, () => {
            let r = n.pos,
              i = 11 * e.R;
            ((n.squash = 0.9),
              K(t, r.x, r.y, r.z, i, [16751296, 14207144, 16777215], 3, 0.06, L.Jagged),
              G(t, r.x, r.z, i * 0.8, I.PixCrack, 16777215, 2.5),
              t.vfx.dust(r.x, r.y, r.z, 14207144, 18, i * 1.3),
              q(e, r.x, r.z, i, 2, { status: `stun`, statusChance: 1, knock: 6 }),
              t.shake(0.45),
              J.boom(t.audio, 1.1));
          }));
      },
    },
  },
  qm = 11047096,
  Jm = 15251530,
  Ym = 16726602,
  Xm = [2783850, 4892810, 1989198];
function Zm(e, t, n, r, i) {
  let a = e.run,
    o = U(a, t, n);
  (a.vfx.flash(t, o + 1.2, n, 16765050, r * 1.1, 0.18),
    K(a, t, o, n, r, [13647898, 16756794, qm], 3, 0.06, L.Flames));
  for (let e = 0; e < 18; e++) {
    let e = F.range(0, H),
      i = F.range(r, r * 2.2);
    _h(a, t, o + 0.6, n, Math.cos(e) * i, F.range(2, 6), Math.sin(e) * i, 0.5, 1.3, 0.35, 2.5);
  }
  for (let e = 0; e < 4; e++)
    vh(a, t + F.range(-r, r) * 0.4, o + 1.2, n + F.range(-r, r) * 0.4, 2, 6969962, 1.2);
  (yh(a, t, o + 0.5, n, 8, 6),
    G(a, t, n, r * 1.1, I.Soft, 2759188, 3),
    q(e, t, n, r, i, { status: `burn`, statusChance: 0.6, knock: 5 }),
    a.shake(0.12 + r * 0.02, t, n),
    J.boom(a.audio, 0.4 + r * 0.06));
}
function Qm(e, t, n, r, i, a) {
  let o = e.run,
    s = 0;
  W(o, i, (c, l) => {
    let u = o.player.pos,
      d = a ? u.x : t,
      f = a ? u.z : n,
      p = U(o, d, f),
      m = r * (0.4 + 0.6 * Math.min(1, c / (i * 0.6)));
    for (let e = 0; e < 4; e++) {
      let e = F.range(0, H),
        t = F.range(0.3, m);
      o.vfx.norm.spawn({
        x: d + Math.cos(e) * t,
        y: p + F.range(0.3, 2),
        z: f + Math.sin(e) * t,
        vx: F.range(-0.6, 0.6),
        vy: F.range(0.2, 0.8),
        vz: F.range(-0.6, 0.6),
        drag: 1,
        life: 1,
        size: 1.2,
        endSize: 2.4,
        color: qm,
        endColor: 6969976,
        shape: I.PixPuff,
      });
    }
    (Math.random() < 0.3 &&
      o.vfx.norm.spawn({
        x: d + F.range(-m, m) * 0.6,
        y: p + 1,
        z: f + F.range(-m, m) * 0.6,
        vy: 1.2,
        life: 0.6,
        size: 0.4,
        endSize: 0.7,
        color: 16777215,
        shape: I.PixToxic,
      }),
      o.vfx.staticRing(d, p, f, m, 9071272, 0.5),
      (s -= l),
      s <= 0 &&
        ((s = 0.35), q(e, d, f, m, 0.3, { status: `poison`, statusChance: 1, knock: 0, silent: !0 })));
  });
}
function $m(e, t, n, r, i) {
  let a = e.run;
  (Eh(a, t, n, r, i, Sl.PixEgg, 2.4, 20, 4, 16765152), a.vfx.telegraph(t, n, r, 3.4, 16754888, i));
}
function eh(e, t, n, r, i) {
  let a = e.run,
    o = a.player;
  (bh(a, t, n, r, 10, 6, I.Shard, 0.45, 16774376),
    xh(a, t, n + 0.6, r, I.PixHeart, 8, 7, 0.6, 0.5),
    Sh(a, t, n + 0.6, r, 16763104, 8, 5),
    a.vfx.ring(t, n, r, 3.4, 16754888, 0.35, 0.2, L.Petals),
    q(e, t, r, 3.4 * e.R, 1.3, { status: `charm`, statusChance: 0.6, knock: 3 }),
    o.heal(o.maxHp * i),
    J.boom(a.audio, 0.35));
}
function th(e, t, n, r) {
  let i = e.run,
    a = i.enemies,
    o = new Set(),
    s = e.x,
    c = e.z,
    l = e.y + 1,
    u = (d) => {
      if (d >= t) return;
      let f = -1,
        p = 256;
      for (let e of a.within(s, c, 16)) {
        if (!a.isAlive(e) || o.has(e)) continue;
        let t = (a.x[e] - s) ** 2 + (a.z[e] - c) ** 2;
        t < p && ((p = t), (f = e));
      }
      let m, h;
      if (f >= 0) (o.add(f), (m = a.x[f]), (h = a.z[f]));
      else {
        let e = F.range(0, H);
        ((m = s + Math.cos(e) * 6), (h = c + Math.sin(e) * 6));
      }
      let g = U(i, m, h) + 0.8,
        _ = 0.14;
      (i.vfx.norm.spawn({
        x: s,
        y: l,
        z: c,
        vx: (m - s) / _,
        vy: (g - l) / _,
        vz: (h - c) / _,
        life: _,
        size: r,
        endSize: r,
        color: 16777215,
        shape: Sl.PixStarCore,
        spin: 18,
      }),
        i.vfx.beams.spawn(s, l, c, m, g, h, 0.12, Jm, 0.25, 0.6),
        i.later(_, () => {
          (wh(i, m, g, h, Sl.PixStarCore, r, r * 1.6, 0.2),
            Sh(i, m, g, h, Jm, 6, 6, I.Twinkle, 0.5, 0.35),
            i.vfx.ring(m, U(i, m, h), h, 2.6, Jm, 0.3, 0.2, L.Runes),
            q(e, m, h, 2.6 * e.R, n, { status: `confusion`, statusChance: 0.4, knock: 3 }),
            i.audio.kt(660 + (d % 4) * 80, 0.08, { v: 0.04 }),
            (s = m),
            (c = h),
            (l = g),
            u(d + 1));
        }));
    };
  u(0);
}
function nh(e, t, n, r) {
  let i = e.run,
    a = U(i, t, n);
  Th(i, t, a, n, 1.8, Y.water, Y.foam, 0.45, 18);
  for (let e = 0; e < 10; e++)
    i.vfx.norm.spawn({
      x: t + F.range(-0.7, 0.7),
      y: a + F.range(3, 10),
      z: n + F.range(-0.7, 0.7),
      vy: -16,
      life: 0.4,
      size: 0.5,
      endSize: 0.3,
      color: 16777215,
      shape: I.PixDrop,
    });
  for (let e = 0; e < 8; e++) {
    let r = (e / 8) * H;
    i.vfx.norm.spawn({
      x: t,
      y: a + 0.4,
      z: n,
      vx: Math.cos(r) * 5,
      vy: F.range(3, 6),
      vz: Math.sin(r) * 5,
      gravity: 16,
      life: 0.5,
      size: 0.4,
      endSize: 0.2,
      color: 16777215,
      shape: I.PixDrop,
    });
  }
  (i.vfx.ring(t, a, n, 2.8, Y.water, 0.35, 0.2, L.Ripple),
    q(e, t, n, 2.8 * e.R, r, { status: `wet`, statusChance: 1, knock: 3 }));
}
var rh = {
    109: {
      names: [c(`Nube Explosiva`), c(`Gran Detonación`)],
      descs: [
        c(
          `Una nube tóxica de 9 m crece a tu alrededor 1,6 s envenenando a todos, y luego estalla en una explosión enorme.`,
        ),
        c(
          `Dos nubes (la tuya y otra delante), una detonación gigantesca y ocho explosiones en cadena sobre los enemigos.`,
        ),
      ],
      type: `poison`,
      cls: `special`,
      dur: [2, 2.8],
      tint: 10123960,
      cast(e) {
        let t = e.run,
          n = (9 + e.tier) * e.R,
          r = e.tier >= 1;
        Qm(e, e.x, e.z, n, 1.6, !0);
        let i = e.x + e.ax * 9,
          a = e.z + e.az * 9;
        if (
          (r && Qm(e, i, a, n * 0.8, 1.6, !1),
          J.goo(t.audio, 0.16),
          t.audio.kn(1.4, { ft: `lowpass`, f: 600, to: 2.5, v: 0.12, a: 1 }),
          t.later(1.65, () => {
            let o = t.player.pos;
            (Zm(e, o.x, o.z, n, r ? 2.2 : 1.9),
              r && t.later(0.12, () => Zm(e, i, a, n * 0.8, 1.8)),
              t.shake(0.45),
              J.boom(t.audio, 1.2));
          }),
          !r)
        )
          return;
        let o = Ah(t, e.x, e.z, 16 * e.R, 8);
        for (let n = 0; n < 8; n++)
          t.later(2 + n * 0.08, () => {
            let r = jh(t, t.player.pos.x, t.player.pos.z, 14, o, n);
            Zm(e, r.x, r.z, 3.4 * e.R, 1.1);
          });
        t.cry(110, 0.6);
      },
    },
    111: {
      names: [c(`Carga Rinoceronte`), c(`Taladro Rocoso`)],
      descs: [
        c(
          `Embistes 18 m hacia tu objetivo arrollando todo: lanza por los aires, aturde y deja un surco de rocas.`,
        ),
        c(
          `La carga acaba en un cuerno taladro que perfora el suelo y desata una lluvia de doce rocas sobre los enemigos.`,
        ),
      ],
      type: `ground`,
      cls: `physical`,
      dur: [1.2, 2.6],
      tint: 12099704,
      cast(e) {
        let t = e.run,
          n = t.player,
          r = 18 * e.R,
          i = e.ax,
          a = e.az,
          o = new Set();
        t.ghostDash(e.x, e.y, e.z, i, a, r, 13154456);
        for (let n = 0; n <= 12; n++)
          t.later(n * 0.025, () => {
            let s = n / 12,
              c = e.x + i * r * s,
              l = e.z + a * r * s,
              u = U(t, c, l);
            (t.vfx.dust(c, u, l, 13150328, 4, 3),
              n % 2 == 0 && Ch(t, c - a * 1.6, l + i * 1.6, I.PixSpike, 1.6, 0.9, 6),
              n % 2 == 1 && Ch(t, c + a * 1.6, l - i * 1.6, I.PixSpike, 1.6, 0.9, 6),
              G(t, c, l, 2.2, I.PixCrack, 16777215, 2.2, Math.atan2(a, i)),
              Oh(e, o, c, l, 2.3 * e.R, 2, {
                status: `stun`,
                statusChance: 0.9,
                dirX: i,
                dirZ: a,
                knock: 7,
              }));
          });
        let s = e.x + i * r,
          c = e.z + a * r;
        (t.terrain.inBounds(s, c, 3) &&
          !t.terrain.inWater(s, c) &&
          t.later(0.3, () => {
            ((n.pos.x = s), (n.pos.z = c), (n.pos.y = U(t, s, c)), n.vel.set(0, 0, 0));
          }),
          J.rumble(t.audio, 0.5, 0.18),
          J.whoosh(t.audio, 0.3, 0.14, 300),
          e.tier === 0
            ? t.later(0.32, () => {
                (K(t, s, U(t, s, c), c, 5 * e.R, [13150328, 16777215], 2, 0.06, L.Jagged),
                  bh(t, s, U(t, s, c), c, 10, 6),
                  J.boom(t.audio, 0.6));
              })
            : (t.later(0.35, () => {
                let n = U(t, s, c);
                (W(t, 0.6, (e) => {
                  for (let r = 0; r < 2; r++) {
                    let i = e * 30 + r * Math.PI;
                    t.vfx.norm.spawn({
                      x: s + Math.cos(i) * 1.2,
                      y: n + 0.8,
                      z: c + Math.sin(i) * 1.2,
                      vx: Math.cos(i) * 6,
                      vy: F.range(3, 6),
                      vz: Math.sin(i) * 6,
                      gravity: 18,
                      life: 0.5,
                      size: 0.5,
                      endSize: 0.3,
                      color: 16777215,
                      shape: I.PixRock,
                      spin: 8,
                    });
                  }
                }),
                  t.vfx.norm.spawn({
                    x: s,
                    y: n + 1.6,
                    z: c,
                    life: 0.6,
                    size: 2.4,
                    endSize: 2.4,
                    color: 15261904,
                    shape: I.PixHorn,
                    spin: 25,
                  }),
                  K(t, s, n, c, 7 * e.R, [11047018, 14207144, 16777215], 3, 0.08, L.Jagged),
                  G(t, s, c, 6, I.PixCrack, 16777215, 3),
                  q(e, s, c, 7 * e.R, 1.8, { status: `stun`, statusChance: 1, knock: 6 }),
                  t.shake(0.4),
                  J.rumble(t.audio, 0.8, 0.22));
              }),
              Ih(
                e,
                12,
                1.4,
                16,
                0.5,
                (e, n, r, i) => {
                  (Eh(t, e, n, r, i, I.PixRock, 2.4, 24, 6), t.vfx.telegraph(e, n, r, 3.2, 11047018, i));
                },
                (n, r, i) => {
                  (bh(t, n, r, i, 8, 6),
                    G(t, n, i, 3.2, I.PixCrack),
                    t.vfx.dust(n, r, i, 13154456, 8, 4),
                    q(e, n, i, 3.2 * e.R, 1.3, { status: `stun`, statusChance: 0.7, knock: 3 }),
                    t.shake(0.08, n, i),
                    J.boom(t.audio, 0.4));
                },
              ),
              t.cry(112, 0.6)));
      },
    },
    113: {
      names: [c(`Huevo Milagro`)],
      descs: [
        c(
          `Caen huevos gigantes sobre los enemigos (6, 8 o 10 con la Madurez): estallan, encantan y cada uno te cura un 4%. Al final, una onda de cariño te cura un 15% más.`,
        ),
      ],
      type: `normal`,
      cls: `special`,
      dur: [2.4],
      tint: 16758992,
      cast(e) {
        let t = e.run,
          n = t.player,
          r = [6, 8, 10][e.tier];
        ((n.shield = Math.max(n.shield, n.maxHp * 0.15)),
          wh(t, e.x, e.y + 2.4, e.z, Sl.PixEgg, 1, 2.6, 0.5),
          Sh(t, e.x, e.y + 2, e.z, 16765152, 14, 5),
          Ih(
            e,
            r,
            1.5,
            15,
            0.5,
            (t, n, r, i) => $m(e, t, n, r, i),
            (t, n, r) => eh(e, t, n, r, 0.04),
          ),
          t.later(2.1, () => {
            let r = n.pos,
              i = (11 + e.tier * 2) * e.R;
            (K(t, r.x, r.y, r.z, i, [16754888, 16777215, 16765152], 3, 0.08, L.Petals),
              xh(t, r.x, r.y + 1, r.z, I.PixHeart, 16, i * 1.6, 0.7, 0.6),
              q(e, r.x, r.z, i, 1.2, { status: `charm`, statusChance: 1, knock: 5 }),
              n.heal(n.maxHp * 0.15),
              t.audio.heal(),
              J.chord(t.audio, [523, 659, 784, 1047], 0.05));
          }),
          J.sparkle(t.audio));
      },
    },
    114: {
      names: [c(`Maraña de Lianas`)],
      descs: [
        c(
          `Tus lianas atrapan a todos en 13 m (más con la Madurez), los arrastran hacia ti y los estrujan 1,5 s; luego la maraña estalla en hojas.`,
        ),
      ],
      type: `grass`,
      cls: `physical`,
      dur: [2.4],
      tint: 4892810,
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = (13 + e.tier * 2) * e.R;
        (Ah(t, e.x, e.z, r, 14 + e.tier * 6).forEach((e, r) =>
          t.later(r * 0.03, () => {
            if (!n.isAlive(e)) return;
            let r = t.player.pos;
            (Bh(t, r.x, r.y + 1, r.z, n.x[e], n.y[e] + 0.5, n.z[e], F.range(-2.5, 2.5), 0.42, Xm, 1.6),
              t.combat.applyStatus(e, `root`, 1));
          }),
        ),
          J.whoosh(t.audio, 0.4, 0.12, 700));
        let i = 0;
        W(
          t,
          1.6,
          (n, a) => {
            let o = t.player.pos;
            if ((kh(t, o.x, o.z, r, 22 * a), Math.random() < 0.5)) {
              let e = F.range(0, H),
                n = F.range(2, r * 0.6);
              Bh(
                t,
                o.x,
                o.y + 0.8,
                o.z,
                o.x + Math.cos(e) * n,
                o.y + 0.4,
                o.z + Math.sin(e) * n,
                F.range(-2, 2),
                0.22,
                Xm,
                0.2,
                6,
              );
            }
            ((i -= a),
              i <= 0 &&
                ((i = 0.3),
                q(e, o.x, o.z, r * 0.7, 0.35, { status: `root`, statusChance: 1, knock: 0, silent: !0 }),
                t.audio.kn(0.12, { f: 600, to: 0.6, q: 2, v: 0.05 })));
          },
          () => {
            let n = t.player.pos,
              r = 8 * e.R;
            (K(t, n.x, n.y, n.z, r, [2783850, 8050762, 16777215], 3, 0.06, L.Petals),
              xh(t, n.x, n.y + 1, n.z, I.PixLeaf, 30, r * 2, 0.7, 0.7, r),
              q(e, n.x, n.z, r, 2.2, { knock: 6 }),
              t.player.heal(t.player.maxHp * 0.1),
              t.shake(0.35),
              J.boom(t.audio, 0.9));
          },
        );
      },
    },
    115: {
      names: [c(`Puñetazo Familiar`)],
      descs: [
        c(
          `Madre y cría saltan de enemigo en enemigo: un puñetazo grande y otro pequeño en cada uno (8, 10 o 12). Acaba con un Megapuño que agrieta el suelo.`,
        ),
      ],
      type: `normal`,
      cls: `physical`,
      dur: [2.2],
      tint: 14198904,
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = t.player,
          i = [8, 10, 12][e.tier],
          a = new Set();
        for (let r = 0; r < i; r++)
          t.later(r * 0.15, () => {
            if (t.state !== `play` && t.state !== `dead`) return;
            let r = Hh(t, 14, a);
            if (r < 0) return;
            (a.add(r), Vh(t, r, 15255712));
            let i = n.x[r],
              o = n.y[r] + n.hgt[r] * 0.6,
              s = n.z[r];
            (wh(t, i, o, s, I.PixFist, 1.4, 2.2, 0.16, F.range(-0.3, 0.3)),
              Dh(e, r, 1.2, { knock: 3, status: `confusion`, statusChance: 0.3 }),
              t.audio.kt(120, 0.09, { to: 0.5, v: 0.18 }),
              t.later(0.07, () => {
                (wh(
                  t,
                  i + F.range(-0.4, 0.4),
                  o - 0.2,
                  s + F.range(-0.4, 0.4),
                  I.PixFist,
                  0.7,
                  1.1,
                  0.12,
                  F.range(-0.5, 0.5),
                ),
                  Sh(t, i, o, s, 16771232, 4, 4, I.Star, 0.35, 0.25),
                  n.isAlive(r) && Dh(e, r, 0.5, { knock: 1, silent: !0 }),
                  t.audio.kt(200, 0.06, { to: 0.6, v: 0.1 }));
              }),
              t.shake(0.05));
          });
        (t.later(i * 0.15 + 0.15, () => {
          let n = r.pos,
            i = 9 * e.R;
          (Eh(t, n.x, n.y, n.z, 0.25, I.PixFist, 3.2, 18, 3, 16767152),
            t.later(0.25, () => {
              (K(t, n.x, n.y, n.z, i, [14198904, 16769184, 16777215], 3, 0.06, L.Jagged),
                G(t, n.x, n.z, i * 0.8, I.PixCrack, 16777215, 2.5),
                bh(t, n.x, n.y, n.z, 14, 8),
                q(e, n.x, n.z, i, 2, { status: `stun`, statusChance: 1, knock: 6 }),
                t.shake(0.45),
                J.boom(t.audio, 1.1));
            }));
        }),
          t.cry(115, 0.6));
      },
    },
    116: {
      names: [c(`Nube de Tinta`), c(`Remolino Dragón`)],
      descs: [
        c(
          `Escupes una nube de tinta de 12 m que ciega a todos (encanto) y dispara doce bolas de tinta en todas direcciones.`,
        ),
        c(
          `La tinta, dos remolinos de agua que avanzan hacia tu objetivo y un chorro de agua dragón que cae del cielo sobre el más fuerte.`,
        ),
      ],
      type: `water`,
      cls: `special`,
      dur: [1.4, 2.6],
      tint: 3824296,
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = 12 * e.R;
        for (let n = 0; n < 14; n++) {
          let i = F.range(0, H),
            a = F.range(1, r),
            o = e.x + Math.cos(i) * a,
            s = e.z + Math.sin(i) * a;
          t.later(n * 0.02, () =>
            t.vfx.groundN.spawn({
              x: o,
              y: U(t, o, s) + 0.1,
              z: s,
              life: 2.4,
              size: F.range(2, 3.4),
              endSize: 3.6,
              color: 16777215,
              shape: Sl.PixInk,
              rot: F.range(0, H),
            }),
          );
        }
        for (let n = 0; n < 5; n++)
          vh(t, e.x + F.range(-3, 3), e.y + 1, e.z + F.range(-3, 3), 1.5, 4870264, 1.1);
        for (let i of n.within(e.x, e.z, r)) t.combat.applyStatus(i, `charm`, 1);
        q(e, e.x, e.z, r, 0.8, { status: `wet`, statusChance: 1, knock: 2 });
        for (let n = 0; n < 12; n++) {
          let r = (n / 12) * H;
          t.projectiles.fire({
            x: e.x,
            y: e.y + 0.9,
            z: e.z,
            dx: Math.cos(r),
            dz: Math.sin(r),
            speed: 18,
            life: 0.8,
            radius: 0.7,
            dmg: e.dmg * 0.7,
            type: `water`,
            cls: `special`,
            pierce: 2,
            status: `charm`,
            statusChance: 0.6,
            size: 1.1,
            shape: Sl.PixInk,
            color: 16777215,
            slot: 8,
            knock: 1,
          });
        }
        if ((J.goo(t.audio, 0.16), J.water(t.audio, 0.4, 0.14), e.tier === 0)) return;
        let i = Math.atan2(e.az, e.ax);
        for (let t of [-1, 1]) {
          let n = i + t * 0.35;
          Lh(e, Math.cos(n), Math.sin(n), 15 * e.R, 2, 0.4, 1.9 + e.tier * 0.2, {
            status: `wet`,
            statusChance: 0.5,
          }, 1.9);
        }
        (W(t, 1.8, () => {
          if (Math.random() < 0.7) {
            let e = F.range(0, H),
              n = F.range(3, 12),
              r = t.player.pos;
            t.vfx.norm.spawn({
              x: r.x + Math.cos(e) * n,
              y: r.y + F.range(1, 4),
              z: r.z + Math.sin(e) * n,
              vy: -3,
              gravity: 6,
              life: 0.6,
              size: 0.4,
              endSize: 0.2,
              color: 16777215,
              shape: I.PixDrop,
            });
          }
        }),
          t.later(1.6, () => {
            let r = t.player.pos,
              i = Ah(t, r.x, r.z, 16 * e.R, 12).sort((e, t) => n.hp[t] - n.hp[e])[0],
              a = i == null ? r.x + e.ax * 6 : n.x[i],
              o = i == null ? r.z + e.az * 6 : n.z[i],
              s = U(t, a, o);
            (Th(t, a, s, o, 3, 4881151, 14215423, 0.6, 24),
              t.vfx.beams.spawn(a, s + 24, o, a, s, o, 0.6, 8018687, 0.5, 0.9),
              K(t, a, s, o, 6 * e.R, [Y.water, 8018687, 16777215], 3, 0.06, L.Ripple),
              xh(t, a, s + 0.6, o, I.PixDrop, 20, 12, 0.5, 0.6),
              q(e, a, o, 6 * e.R, 2.4, { status: `wet`, statusChance: 1, knock: 5 }),
              t.shake(0.4, a, o),
              J.water(t.audio, 0.8, 0.22),
              J.boom(t.audio, 0.8));
          }),
          t.cry(117, 0.6));
      },
    },
    118: {
      names: [c(`Cascada de Peces`), c(`Megacuerno Acuático`)],
      descs: [
        c(
          `Seis Goldeen saltan del agua y se lanzan sobre los enemigos 3 s mientras caen cascadas sobre ocho de ellos.`,
        ),
        c(
          `Tres embestidas con el cuerno en tres direcciones, seguidas de seis Seaking en picado y cascadas sobre diez enemigos.`,
        ),
      ],
      type: `water`,
      cls: `physical`,
      dur: [3, 3.2],
      tint: 5941480,
      preload: [118, 119],
      cast(e) {
        let t = e.run,
          n = e.tier >= 1,
          r = n ? 119 : 118,
          i = t.player;
        if (n) {
          let n = Math.atan2(e.az, e.ax);
          for (let r = 0; r < 3; r++)
            t.later(r * 0.25, () => {
              let a = n + (r - 1) * 0.9,
                o = Math.cos(a),
                s = Math.sin(a),
                c = 14 * e.R,
                l = i.pos.x,
                u = i.pos.z,
                d = new Set();
              (t.ghostDash(l, i.pos.y, u, o, s, c, 9095423),
                t.vfx.norm.spawn({
                  x: l + o,
                  y: i.pos.y + 1,
                  z: u + s,
                  vx: (o * c) / 0.2,
                  vz: (s * c) / 0.2,
                  life: 0.2,
                  size: 2.4,
                  endSize: 2.6,
                  color: 16771288,
                  shape: I.PixHorn,
                  rot: -a + Math.PI * 0.75,
                }));
              for (let n = 0; n <= 10; n++)
                t.later(n * 0.02, () => {
                  let r = l + o * c * (n / 10),
                    i = u + s * c * (n / 10),
                    a = U(t, r, i);
                  (t.vfx.norm.spawn({
                    x: r,
                    y: a + 0.8,
                    z: i,
                    vx: -s * 4,
                    vy: F.range(2, 5),
                    vz: o * 4,
                    gravity: 14,
                    life: 0.5,
                    size: 0.45,
                    endSize: 0.2,
                    color: 16777215,
                    shape: I.PixDrop,
                  }),
                    Oh(e, d, r, i, 2.2 * e.R, 1.8, {
                      status: `wet`,
                      statusChance: 1,
                      dirX: o,
                      dirZ: s,
                      knock: 5,
                    }));
                });
              J.whoosh(t.audio, 0.25, 0.14, 600);
            });
        }
        t.later(n ? 0.8 : 0, () =>
          t.ult.drones.add(
            r,
            6,
            n ? 2.4 : 3,
            n ? 0.95 : 0.8,
            (r, i, a) => {
              let o = U(t, r, a);
              (t.vfx.ring(r, o, a, 2.6, Y.water, 0.3, 0.2, L.Ripple),
                xh(t, r, o + 0.5, a, I.PixDrop, 8, 6, 0.4, 0.5),
                q(e, r, a, 2.6 * e.R, n ? 1.2 : 1, { status: `wet`, statusChance: 0.8, knock: 2 }),
                J.water(t.audio, 0.2, 0.08));
            },
            (e, n, r) => {
              Math.random() < 0.5 &&
                t.vfx.norm.spawn({
                  x: e,
                  y: n,
                  z: r,
                  vy: -1,
                  gravity: 8,
                  life: 0.4,
                  size: 0.3,
                  endSize: 0.15,
                  color: 16777215,
                  shape: I.PixDrop,
                });
            },
          ),
        );
        let a = n ? 10 : 8,
          o = Ah(t, e.x, e.z, 16 * e.R, a);
        for (let r = 0; r < a; r++)
          t.later((n ? 1 : 0.3) + r * 0.18, () => {
            let n = jh(t, i.pos.x, i.pos.z, 14, o, r);
            (nh(e, n.x, n.z, 1.2), r % 2 == 0 && J.water(t.audio, 0.3, 0.1));
          });
        t.cry(r, 0.6);
      },
    },
    120: {
      names: [c(`Estrella Rebotadora`), c(`Rayo del Núcleo`)],
      descs: [
        c(
          `Te lanzas girando como una estrella que rebota de enemigo en enemigo diez veces, cada vez más rápido.`,
        ),
        c(
          `La estrella rebota catorce veces y tu núcleo dispara un rayo de luz que barre 360° a tu alrededor.`,
        ),
      ],
      type: `water`,
      cls: `special`,
      dur: [1.8, 3],
      tint: 15251530,
      cast(e) {
        let t = e.run,
          n = e.tier >= 1;
        (th(e, n ? 14 : 10, 1.3, 1.6 + e.tier * 0.2),
          J.whoosh(t.audio, 1.2, 0.1, 900),
          n &&
            (t.later(0.4, () => {
              let n = 0,
                r = Math.atan2(e.az, e.ax),
                i = t.player;
              (t.vfx.norm.spawn({
                x: i.pos.x,
                y: i.pos.y + 2.6,
                z: i.pos.z,
                life: 2.2,
                size: 2,
                endSize: 2.4,
                color: 16777215,
                shape: Sl.PixStarCore,
                spin: 3,
              }),
                W(t, 2, (a, o) => {
                  let s = i.pos,
                    c = 16 * e.R,
                    l = r + (a / 2) * H * 1.2,
                    u = Math.cos(l),
                    d = Math.sin(l),
                    f = s.y + 1.4;
                  if (
                    (t.vfx.beams.spawn(s.x, f, s.z, s.x + u * c, f, s.z + d * c, 1.2, Jm, 0.05),
                    t.vfx.beams.spawn(s.x, f, s.z, s.x + u * c, f, s.z + d * c, 0.45, Ym, 0.05),
                    Math.random() < 0.6 &&
                      Sh(
                        t,
                        s.x + u * c * Math.random(),
                        f,
                        s.z + d * c * Math.random(),
                        Jm,
                        1,
                        2,
                        I.Twinkle,
                        0.4,
                        0.3,
                      ),
                    (n -= o),
                    n <= 0)
                  ) {
                    n = 0.1;
                    for (let n of t.enemies.within(s.x + u * c * 0.5, s.z + d * c * 0.5, c * 0.55)) {
                      let r = t.enemies.x[n] - s.x,
                        i = t.enemies.z[n] - s.z,
                        a = r * u + i * d;
                      a > 0 &&
                        a < c &&
                        Math.abs(r * d - i * u) < 1.5 * e.R &&
                        Dh(e, n, 0.45, {
                          status: `confusion`,
                          statusChance: 0.3,
                          dirX: u,
                          dirZ: d,
                          knock: 1.5,
                          silent: Math.random() < 0.5,
                        });
                    }
                  }
                  t.shake(0.012);
                }),
                t.audio.kt(131, 2, { w: `sawtooth`, lp: 1100, v: 0.06, a: 0.05 }),
                J.chord(t.audio, [523, 784, 1047], 0.03, 0, 2));
            }),
            t.cry(121, 0.6)));
      },
    },
    123: {
      names: [c(`Danza de Espadas`)],
      descs: [
        c(
          `Cruzas a la horda de un tajo tras otro (8, 11 o 14) dejando cortes en el aire; medio segundo después todos los cortes estallan a la vez.`,
        ),
      ],
      type: `bug`,
      cls: `physical`,
      dur: [2.2],
      tint: 9099338,
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = [8, 11, 14][e.tier],
          i = new Set(),
          a = [];
        for (let o = 0; o < r; o++)
          t.later(o * 0.1, () => {
            if (t.state !== `play` && t.state !== `dead`) return;
            let s = Hh(t, 15, i);
            if (s < 0) return;
            (i.add(s), Vh(t, s, 12120186));
            let c = n.x[s],
              l = n.y[s] + n.hgt[s] * 0.6,
              u = n.z[s],
              d = F.range(0, H);
            (t.vfx.norm.spawn({
              x: c,
              y: l,
              z: u,
              life: 0.6 + (r - o) * 0.1,
              size: 2,
              endSize: 2.2,
              color: 16777215,
              shape: I.PixSlash,
              rot: d,
            }),
              Dh(e, s, 0.6, { knock: 0.5, silent: !0 }),
              a.push({ x: c, z: u }),
              t.audio.kn(0.07, { f: 2e3, to: 0.4, q: 1.2, v: 0.1 }));
          });
        (t.later(r * 0.1 + 0.5, () => {
          for (let n of a) {
            let r = U(t, n.x, n.z);
            (wh(t, n.x, r + 1, n.z, I.PixSlash, 2, 3.6, 0.22, F.range(0, H)),
              xh(t, n.x, r + 1, n.z, I.PixLeaf, 6, 6, 0.45, 0.4),
              q(e, n.x, n.z, 2.8 * e.R, 1.9, { knock: 4 }));
          }
          let n = t.player.pos;
          (K(t, n.x, n.y, n.z, 8 * e.R, [9099338, 16777215], 2, 0.06, L.Petals),
            t.shake(0.4),
            J.boom(t.audio, 0.9),
            t.audio.kn(0.3, { f: 2200, to: 0.3, q: 1, v: 0.14 }));
        }),
          J.whoosh(t.audio, 0.3, 0.12, 1200));
      },
    },
  },
  ih = 16769594,
  ah = 11071743,
  oh = 16747208,
  sh = 5941488;
function ch(e, t, n) {
  let r = e.enemies;
  r.stun[t] = Math.max(r.stun[t], n * (r.flags[t] & R.Boss ? 0.3 : r.flags[t] & 12290 ? 0.6 : 1));
}
var lh = {
    122: {
      names: [c(`Caja Invisible`)],
      descs: [
        c(
          `Levantas paredes invisibles en círculo: atrapan a todos los de dentro, los inmovilizan y estallan en cristales que confunden. Con Madurez la caja es mayor y acaba en una explosión de niebla que encanta.`,
        ),
      ],
      type: `psychic`,
      cls: `special`,
      dur: [2.6],
      tint: 12577535,
      cast(e) {
        let t = e.run,
          n = (10 + e.tier * 2) * e.R,
          r = 14 + e.tier * 4,
          i = e.x,
          a = e.z,
          o = e.y;
        for (let e = 0; e < r; e++)
          t.later(e * 0.025, () => {
            let o = (e / r) * H,
              s = i + Math.cos(o) * n,
              c = a + Math.sin(o) * n;
            (t.vfx.norm.spawn({
              x: s,
              y: U(t, s, c) + 1.6,
              z: c,
              life: 1.9,
              size: 2.4,
              endSize: 2.6,
              color: 16777215,
              shape: wl.PixPane,
              rot: F.range(-0.06, 0.06),
            }),
              e % 2 == 0 &&
                t.vfx.add.spawn({
                  x: s,
                  y: U(t, s, c) + 2.4,
                  z: c,
                  life: 0.4,
                  size: 0.5,
                  endSize: 0,
                  color: 16777215,
                  shape: I.Twinkle,
                  glow: 0.3,
                }));
          });
        if (e.tier >= 1)
          for (let e = 0; e < 8; e++)
            t.later(0.3 + e * 0.03, () => {
              let r = (e / 8) * H + 0.2,
                o = i + Math.cos(r) * n * 0.5,
                s = a + Math.sin(r) * n * 0.5;
              t.vfx.norm.spawn({
                x: o,
                y: U(t, o, s) + 1.4,
                z: s,
                life: 1.5,
                size: 2,
                endSize: 2.2,
                color: 16777215,
                shape: wl.PixPane,
              });
            });
        (t.vfx.ring(i, o, a, n, 12577535, 1.8, 0.1, L.Ripple), J.chord(t.audio, [392, 523, 659], 0.04));
        let s = 0;
        W(
          t,
          1.6,
          (r, o) => {
            if ((kh(t, i, a, n, 18 * o), (s -= o), s <= 0)) {
              s = 0.3;
              for (let r of t.enemies.within(i, a, n))
                (ch(t, r, 0.4), Dh(e, r, 0.2, { knock: 0, silent: !0 }));
            }
          },
          () => {
            for (let e = 0; e < r; e++) {
              let o = (e / r) * H,
                s = i + Math.cos(o) * n,
                c = a + Math.sin(o) * n;
              for (let e = 0; e < 3; e++)
                t.vfx.norm.spawn({
                  x: s,
                  y: U(t, s, c) + F.range(0.5, 2.5),
                  z: c,
                  vx: -Math.cos(o) * F.range(6, 14),
                  vy: F.range(1, 4),
                  vz: -Math.sin(o) * F.range(6, 14),
                  gravity: 10,
                  life: 0.6,
                  size: 0.6,
                  endSize: 0.3,
                  color: 14218495,
                  shape: I.Shard,
                  spin: F.range(-8, 8),
                });
            }
            (q(e, i, a, n, 1.8, { status: `confusion`, statusChance: 1, knock: 3 }),
              K(t, i, o, a, n, [12577535, 16777215, 10119896], 3, 0.06, L.Runes),
              t.shake(0.3),
              J.boom(t.audio, 0.8),
              t.audio.kt(1100, 0.3, { w: `triangle`, v: 0.04 }),
              t.audio.kt(1500, 0.25, { w: `triangle`, v: 0.03, d: 0.05 }),
              e.tier >= 2 &&
                t.later(0.35, () => {
                  let r = t.player.pos;
                  for (let e = 0; e < 24; e++) {
                    let i = (e / 24) * H;
                    t.vfx.norm.spawn({
                      x: r.x,
                      y: r.y + 0.6,
                      z: r.z,
                      vx: Math.cos(i) * n * 1.8,
                      vy: F.range(0.5, 2),
                      vz: Math.sin(i) * n * 1.8,
                      drag: 2.5,
                      life: 0.8,
                      size: 1.2,
                      endSize: 2.6,
                      color: 16763112,
                      shape: I.PixPuff,
                    });
                  }
                  (xh(t, r.x, r.y + 1, r.z, I.PixHeart, 12, n * 1.4, 0.6, 0.6),
                    q(e, r.x, r.z, n, 1.4, { status: `charm`, statusChance: 1, knock: 5 }),
                    J.boom(t.audio, 0.7));
                }));
          },
        );
      },
    },
    124: {
      names: [c(`Vals Helado`)],
      descs: [
        c(
          `Bailas un vals helado: lanzas besos a doce enemigos que los encantan y congelan, y una ventisca en círculo los deja helados. Con Madurez, más besos y cristales de hielo que brotan del suelo.`,
        ),
      ],
      type: `ice`,
      cls: `special`,
      dur: [2.4],
      tint: 13166847,
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = 12 + e.tier * 4,
          i = Ah(t, e.x, e.z, 16 * e.R, r);
        (W(t, 1.4, (e) => {
          let n = t.player.pos;
          for (let r = 0; r < 2; r++) {
            let i = e * 8 + r * Math.PI,
              a = 1.6;
            t.vfx.norm.spawn({
              x: n.x + Math.cos(i) * a,
              y: n.y + 1 + Math.sin(e * 6) * 0.3,
              z: n.z + Math.sin(i) * a,
              vy: 0.5,
              life: 0.5,
              size: 0.5,
              endSize: 0.3,
              color: 16777215,
              shape: r ? I.PixSnow : I.PixHeart,
              spin: 3,
            });
          }
        }),
          i.forEach((r, i) =>
            t.later(0.15 + i * 0.07, () => {
              if (!n.isAlive(r)) return;
              let i = t.player.pos,
                a = n.x[r],
                o = n.y[r] + n.hgt[r] * 0.6,
                s = n.z[r],
                c = 0.3;
              (t.vfx.norm.spawn({
                x: i.x,
                y: i.y + 1.4,
                z: i.z,
                vx: (a - i.x) / c,
                vy: (o - i.y - 1.4) / c,
                vz: (s - i.z) / c,
                life: c,
                size: 0.9,
                endSize: 1.1,
                color: 16777215,
                shape: wl.PixLips,
              }),
                t.later(c, () => {
                  if (n.isAlive(r)) {
                    (wh(t, n.x[r], o + 0.3, n.z[r], I.PixHeart, 0.8, 1.6, 0.35),
                      t.vfx.norm.spawn({
                        x: n.x[r],
                        y: o,
                        z: n.z[r],
                        life: 0.5,
                        size: 1.4,
                        endSize: 1.8,
                        color: 14218495,
                        shape: I.Shard,
                      }),
                      Dh(e, r, 1.2, { status: `charm`, statusChance: 1, knock: 1 }));
                    for (let e = 0; e < 3; e++) t.combat.applyStatus(r, `freeze`, 1);
                    t.audio.kt(660, 0.1, { to: 1.3, v: 0.04 });
                  }
                }));
            }),
          ),
          t.later(1.3, () => {
            let n = (13 + e.tier * 2) * e.R;
            if (
              (Ph(
                e,
                n,
                0.8,
                1.1,
                { status: `freeze`, statusChance: 1, knock: 3 },
                (e, n, r, i) => {
                  t.vfx.norm.spawn({
                    x: e,
                    y: n + 0.8,
                    z: r,
                    vx: Math.cos(i) * 4 + F.range(-1, 1),
                    vy: F.range(0, 1.5),
                    vz: Math.sin(i) * 4 + F.range(-1, 1),
                    drag: 1.5,
                    life: 0.5,
                    size: 0.5,
                    endSize: 0.3,
                    color: 16777215,
                    shape: I.PixSnow,
                    spin: 4,
                  });
                },
                40,
              ),
              t.vfx.ring(t.player.pos.x, t.player.pos.y, t.player.pos.z, n, ah, 0.8, 0.08, L.Ripple),
              J.whoosh(t.audio, 0.8, 0.12, 1100),
              e.tier >= 1)
            )
              for (let r = 0; r < 10 + e.tier * 4; r++)
                t.later(0.2 + r * 0.03, () => {
                  let i = t.player.pos,
                    a = (r * 2.4) % H,
                    o = F.range(4, n),
                    s = i.x + Math.cos(a) * o,
                    c = i.z + Math.sin(a) * o;
                  (Ch(t, s, c, I.Shard, 2.4, 1.2, 7, 14218495),
                    q(e, s, c, 2.4 * e.R, 0.8, { status: `freeze`, statusChance: 1, knock: 1, silent: !0 }));
                });
          }),
          J.chord(t.audio, [523, 659, 784], 0.035, 0, 1.4));
      },
    },
    125: {
      names: [c(`Puño Trueno Encadenado`)],
      descs: [
        c(
          `Saltas de enemigo en enemigo dando seis puñetazos trueno que paralizan, y acabas con un rayo enorme sobre ti. Con Madurez, más puñetazos y una tormenta eléctrica final.`,
        ),
      ],
      type: `electric`,
      cls: `physical`,
      dur: [1.6],
      tint: 16769594,
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = 6 + e.tier * 2,
          i = new Set();
        for (let a = 0; a < r; a++)
          t.later(a * 0.12, () => {
            if (t.state !== `play` && t.state !== `dead`) return;
            let r = Hh(t, 15, i);
            if (r < 0) return;
            i.add(r);
            let a = t.player.pos.x,
              o = t.player.pos.y,
              s = t.player.pos.z;
            (Vh(t, r, ih),
              t.vfx.lightning(a, o + 1, s, n.x[r], n.y[r] + 1, n.z[r], ih, 0.45, 6, 0.2),
              wh(
                t,
                n.x[r],
                n.y[r] + n.hgt[r] * 0.6,
                n.z[r],
                I.PixFist,
                1.3,
                2,
                0.16,
                F.range(-0.4, 0.4),
                16773280,
              ),
              Sh(t, n.x[r], n.y[r] + 0.8, n.z[r], ih, 6, 6, I.Bolt, 0.5, 0.3),
              Dh(e, r, 1.3, { status: `paralysis`, statusChance: 0.9, knock: 3 }),
              J.zap(t.audio),
              t.audio.kt(130, 0.08, { to: 0.5, v: 0.16 }),
              t.shake(0.05));
          });
        t.later(r * 0.12 + 0.12, () => {
          let n = t.player.pos,
            r = U(t, n.x, n.z),
            i = (8 + e.tier * 2) * e.R;
          for (let e = 0; e < 3; e++)
            t.vfx.lightning(
              n.x + F.range(-1.5, 1.5),
              r + 34,
              n.z + F.range(-1.5, 1.5),
              n.x,
              r,
              n.z,
              e ? ih : 16775360,
              e ? 0.8 : 0.3,
              12,
              0.32,
            );
          (t.vfx.norm.spawn({
            x: n.x,
            y: r + 2.5,
            z: n.z,
            life: 0.35,
            size: 4,
            endSize: 3,
            color: 16777215,
            shape: I.PixBolt,
          }),
            t.vfx.flash(n.x, r + 1.5, n.z, ih, i * 0.6, 0.2));
          for (let e = 0; e < 8; e++) {
            let a = (e / 8) * H;
            t.vfx.lightning(
              n.x,
              r + 0.3,
              n.z,
              n.x + Math.cos(a) * i,
              r + 0.2,
              n.z + Math.sin(a) * i,
              ih,
              0.3,
              6,
              0.22,
            );
          }
          (G(t, n.x, n.z, i * 0.8, I.PixCrack, 16777215, 2.2),
            q(e, n.x, n.z, i, 2, { status: `paralysis`, statusChance: 1, knock: 5 }),
            t.shake(0.4),
            J.boom(t.audio, 1),
            e.tier >= 1 && Fh(e, 1 + e.tier * 0.4, 0.13, 14, 0.6, [ih, 16775360]));
        });
      },
    },
    126: {
      names: [c(`Volcán`)],
      descs: [
        c(
          `Un volcán revienta bajo tus pies: grietas de magma en estrella y una lluvia de bolas de fuego sobre los enemigos. Con Madurez, más grietas y bolas y una erupción final que lo arrasa todo.`,
        ),
      ],
      type: `fire`,
      cls: `special`,
      dur: [2.4],
      tint: 16734746,
      cast(e) {
        let t = e.run,
          n = e.x,
          r = e.y,
          i = e.z;
        for (let e = 0; e < 30; e++)
          _h(
            t,
            n + F.range(-1, 1),
            r + F.range(0, 1),
            i + F.range(-1, 1),
            F.range(-1.5, 1.5),
            F.range(10, 17),
            F.range(-1.5, 1.5),
            0.8,
            F.range(1.1, 1.8),
            0.4,
            1.2,
          );
        for (let e = 0; e < 4; e++) vh(t, n, r + 2.5, i, 2.2, 5917258, 1.4);
        (G(t, n, i, 6, I.Soft, 2759188, 3),
          Nh(e, n, i, 5 + e.tier * 2, {
            len: (12 + e.tier * 2) * e.R,
            glow: Y.magma,
            mul: 1,
            o: { status: `burn`, statusChance: 0.9 },
            erupt: (e, n, r) => {
              for (let i = 0; i < 2; i++)
                _h(
                  t,
                  e + F.range(-0.3, 0.3),
                  n + 0.4,
                  r + F.range(-0.3, 0.3),
                  0,
                  F.range(6, 10),
                  0,
                  0.5,
                  1.2,
                  0.4,
                  1.5,
                );
            },
          }),
          J.rumble(t.audio, 1.2, 0.2),
          J.fire(t.audio, 1, 0.2),
          Ih(
            e,
            10 + e.tier * 4,
            1.6,
            15,
            0.6,
            (e, n, r, i) => {
              (Eh(t, e, n, r, i, I.PixFlame, 2, 22, 2, 16734746), t.vfx.telegraph(e, n, r, 3, Y.magma, i));
            },
            (n, r, i) => {
              t.vfx.ring(n, r, i, 3, 13647898, 0.35, 0.15, L.Flames);
              for (let e = 0; e < 8; e++) {
                let a = (e / 8) * H;
                _h(t, n, r + 0.5, i, Math.cos(a) * 5, F.range(2, 5), Math.sin(a) * 5, 0.45, 1, 0.3, 3);
              }
              (bh(t, n, r, i, 4, 4, I.PixRock, 0.35, 16756848),
                t.zones.add({
                  x: n,
                  z: i,
                  y: r,
                  r: 2,
                  life: 3,
                  tick: 0.25,
                  dmg: e.dmg * 0.1,
                  type: `fire`,
                  cls: `special`,
                  status: `burn`,
                  chance: 0.5,
                  slot: 8,
                  color: Y.fire,
                }),
                q(e, n, i, 3 * e.R, 1.2, { status: `burn`, statusChance: 1, knock: 2 }),
                t.shake(0.08, n, i),
                J.boom(t.audio, 0.4));
            },
          ),
          e.tier >= 2 &&
            t.later(2, () => {
              let n = t.player.pos,
                r = 13 * e.R;
              (t.vfx.flash(n.x, n.y + 1, n.z, Y.fire, 4.5, 0.25),
                K(t, n.x, n.y, n.z, r, [13647898, 16756794, 13647898], 3, 0.07, L.Flames));
              for (let e = 0; e < 36; e++) {
                let e = F.range(0, H),
                  i = F.range(r, r * 2.4);
                _h(
                  t,
                  n.x,
                  n.y + 0.6,
                  n.z,
                  Math.cos(e) * i,
                  F.range(2, 7),
                  Math.sin(e) * i,
                  0.6,
                  1.5,
                  0.4,
                  2.5,
                );
              }
              (q(e, n.x, n.z, r, 1.8, { status: `burn`, statusChance: 1, knock: 6 }),
                t.shake(0.5),
                J.boom(t.audio, 1.2));
            }));
      },
    },
    127: {
      names: [c(`Llave Tenaza`)],
      descs: [
        c(
          `Tus tenazas atrapan a los tres enemigos más fuertes, los levantan y los estampan contra el suelo con una grieta que aturde. Con Madurez atrapas a más y rematas con una guillotina en X.`,
        ),
      ],
      type: `bug`,
      cls: `physical`,
      dur: [2.2],
      tint: 12109946,
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = 3 + e.tier;
        (Ah(t, e.x, e.z, 15 * e.R, 16)
          .sort((e, t) => n.hp[t] - n.hp[e])
          .slice(0, r)
          .forEach((r, i) =>
            t.later(i * 0.18, () => {
              if (!n.isAlive(r)) return;
              let i = n.x[r],
                a = n.y[r],
                o = n.z[r];
              ch(t, r, 1.2);
              for (let e of [-1, 1])
                t.vfx.norm.spawn({
                  x: i + e * 1.6,
                  y: a + 1,
                  z: o,
                  vx: -e * 10,
                  life: 0.16,
                  size: 1.8,
                  endSize: 1.8,
                  color: 15261896,
                  shape: I.PixHorn,
                  rot: e > 0 ? Math.PI * 0.25 : -Math.PI * 0.25,
                });
              (t.vfx.norm.spawn({
                x: i,
                y: a + 0.5,
                z: o,
                vy: 8,
                drag: 3,
                life: 0.6,
                size: 1.2,
                endSize: 1.6,
                color: 16777215,
                shape: I.PixPuff,
              }),
                t.audio.kt(220, 0.1, { to: 0.6, v: 0.1 }),
                t.later(0.6, () => {
                  let a = n.isAlive(r) ? n.x[r] : i,
                    s = n.isAlive(r) ? n.z[r] : o,
                    c = U(t, a, s);
                  (t.vfx.norm.spawn({
                    x: a,
                    y: c + 5,
                    z: s,
                    vy: -30,
                    life: 0.15,
                    size: 2,
                    endSize: 2,
                    color: 16777215,
                    shape: I.PixHorn,
                    rot: Math.PI * 0.75,
                  }),
                    t.later(0.15, () => {
                      (G(t, a, s, 5, I.PixCrack, 16777215, 2.2),
                        bh(t, a, c, s, 10, 6),
                        t.vfx.dust(a, c, s, 14207144, 12, 5),
                        K(t, a, c, s, 4.5 * e.R, [12109946, 16777215], 2, 0.06, L.Jagged),
                        n.isAlive(r) && Dh(e, r, 2.6, { knock: 2 }),
                        q(e, a, s, 4.5 * e.R, 1, { status: `stun`, statusChance: 1, knock: 4 }),
                        t.shake(0.25, a, s),
                        J.boom(t.audio, 0.7));
                    }));
                }));
            }),
          ),
          e.tier >= 2 &&
            t.later(r * 0.18 + 0.9, () => {
              let n = t.player.pos,
                r = Math.atan2(e.az, e.ax);
              for (let t of [-1, 1])
                for (let i of [0, Math.PI])
                  Mh(e, n.x, n.z, r + (t * Math.PI) / 4 + i, {
                    len: 14 * e.R,
                    glow: 14217328,
                    mul: 1.4,
                    o: { knock: 3 },
                  });
              (wh(t, n.x, n.y + 1.5, n.z, I.Cross, 3, 6, 0.35, 0, 14217376),
                J.whoosh(t.audio, 0.3, 0.16, 1200),
                t.shake(0.3));
            }));
      },
    },
    128: {
      names: [c(`Estampida`)],
      descs: [
        c(
          `Una manada de cinco Tauros fantasma atraviesa el campo a la carrera hacia tu objetivo: arrollan, aturden y lanzan por los aires a todo lo que pillan. Con Madurez la manada es mayor y vuelve en una segunda carga cruzada.`,
        ),
      ],
      type: `normal`,
      cls: `physical`,
      dur: [2.4],
      tint: 14198904,
      preload: [128],
      cast(e) {
        let t = e.run,
          n = 5 + e.tier * 2,
          r = (r, i, a) =>
            t.later(a, () => {
              let a = t.player.pos,
                o = -i,
                s = r,
                c = new Set(),
                l = 1.4;
              for (let u = 0; u < n; u++) {
                let d = (u - (n - 1) / 2) * 2.6 + F.range(-0.6, 0.6),
                  f = 10 + F.range(0, 4) + (u % 2) * 2,
                  p = a.x - r * f + o * d,
                  m = a.z - i * f + s * d;
                t.ult.risers.add(128, p, m, 99, 1.05);
                let h = t.ult.risers.list[t.ult.risers.list.length - 1];
                ((h.fx = r),
                  (h.fz = i),
                  W(
                    t,
                    l,
                    (n) => {
                      let a = (n / l) * 34,
                        o = p + r * a,
                        s = m + i * a;
                      ((h.x = o),
                        (h.z = s),
                        (h.age = 0.2),
                        Math.random() < 0.5 && t.vfx.dust(o - r, U(t, o, s), s - i, 14207144, 2, 2),
                        Oh(e, c, o, s, 2.2 * e.R, 1.4, {
                          status: `stun`,
                          statusChance: 0.7,
                          dirX: r,
                          dirZ: i,
                          knock: 7,
                        }));
                    },
                    () => {
                      h.life = h.age + 0.22;
                    },
                  ));
              }
              (J.rumble(t.audio, l, 0.22), t.cry(128, 0.6));
            });
        (r(e.ax, e.az, 0.1), e.tier >= 1 && r(-e.az, e.ax, 0.9), e.tier >= 2 && r(e.az, -e.ax, 1.3));
      },
    },
    132: {
      names: [c(`Copia Total`)],
      descs: [c(`Te transformas y copias la Ultimate de un miembro de la Liga al azar, con tu fuerza.`)],
      type: `normal`,
      cls: `special`,
      dur: [3.4],
      tint: 13148392,
      cast(e) {
        let t = e.run,
          n = Object.keys(Uh)
            .map(Number)
            .filter((e) => e !== 132),
          r = Uh[F.pick(n)],
          i = t.player.pos;
        for (let e = 0; e < 20; e++) {
          let e = F.range(0, H),
            n = F.range(2, 6);
          t.vfx.norm.spawn({
            x: i.x,
            y: i.y + 1,
            z: i.z,
            vx: Math.cos(e) * n,
            vy: F.range(1, 3),
            vz: Math.sin(e) * n,
            drag: 2,
            life: 0.7,
            size: 1.2,
            endSize: 2.2,
            color: 14201072,
            shape: I.PixPuff,
          });
        }
        if (
          (t.ui.popup(
            i.x,
            i.y + 3,
            i.z,
            c(`¡Copia: {name}!`, { name: r.names[Math.min(e.tier, r.names.length - 1)] }),
            `#c8a0e8`,
            1,
          ),
          t.audio.kt(300, 0.4, { v: 0.06, to: 1.6, vib: [8, 0.06], a: 0.05 }),
          r.preload)
        )
          for (let e of r.preload) t.sprites.get(e);
        t.later(0.25, () =>
          r.cast({
            ...e,
            type: r.type,
            cls: r.cls,
            form: Math.min(e.tier, r.names.length - 1),
            x: t.player.pos.x,
            y: t.player.pos.y,
            z: t.player.pos.z,
          }),
        );
      },
    },
    137: {
      names: [c(`Fallo del Sistema`)],
      descs: [
        c(
          `El mundo falla: líneas de escaneo barren 14 m, todo queda congelado un instante y caen diez cubos de datos que estallan y maldicen. Con Madurez, más cubos y un rayo de datos que barre 360°.`,
        ),
      ],
      type: `normal`,
      cls: `special`,
      dur: [2.6],
      tint: 16747192,
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = 14 * e.R;
        W(t, 0.9, (e) => {
          let n = t.player.pos,
            i = -r + (e / 0.9) * r * 2;
          for (let e of [0, 1]) {
            let a = +!!e,
              o = +!e,
              s = -o,
              c = a,
              l = n.x + a * i,
              u = n.z + o * i,
              d = n.y + 0.6;
            t.vfx.beams.spawn(l - s * r, d, u - c * r, l + s * r, d, u + c * r, 0.18, e ? oh : sh, 0.06, 0.8);
          }
          if (Math.random() < 0.8) {
            let e = F.range(0, H),
              i = F.range(1, r);
            t.vfx.add.spawn({
              x: n.x + Math.cos(e) * i,
              y: n.y + F.range(0.3, 2.5),
              z: n.z + Math.sin(e) * i,
              life: 0.15,
              size: 0.5,
              endSize: 0.5,
              color: Math.random() < 0.5 ? oh : sh,
              shape: I.Square,
              glow: 0.2,
            });
          }
        });
        for (let i of Ah(t, e.x, e.z, r, 40))
          (ch(t, i, 0.9),
            t.vfx.add.spawn({
              x: n.x[i],
              y: n.y[i] + n.hgt[i] + 0.4,
              z: n.z[i],
              life: 0.8,
              size: 0.6,
              endSize: 0.6,
              color: oh,
              shape: I.Cross,
              glow: 0.2,
              rot: Math.PI / 4,
            }));
        (t.audio.kt(220, 0.6, { w: `square`, lp: 1200, v: 0.04, vib: [14, 0.08] }),
          Ih(
            e,
            10 + e.tier * 4,
            1.3,
            15,
            0.45,
            (e, n, r, i) => {
              (Eh(t, e, n, r, i, wl.PixCube, 1.8, 20, 3, 16747192), t.vfx.telegraph(e, n, r, 3, sh, i));
            },
            (n, r, i) => {
              for (let e = 0; e < 10; e++) {
                let a = F.range(0, H),
                  o = F.range(2, 6);
                t.vfx.add.spawn({
                  x: n,
                  y: r + 0.6,
                  z: i,
                  vx: Math.cos(a) * o,
                  vy: F.range(2, 5),
                  vz: Math.sin(a) * o,
                  gravity: 10,
                  life: 0.5,
                  size: 0.3,
                  endSize: 0.1,
                  color: e % 2 ? oh : sh,
                  shape: I.Square,
                  glow: 0.3,
                });
              }
              (t.vfx.ring(n, r, i, 3, oh, 0.3, 0.2, L.Dashed),
                q(e, n, i, 3 * e.R, 1.4, { status: `curse`, statusChance: 1, knock: 2 }),
                t.audio.kt(880, 0.06, { w: `square`, lp: 1600, v: 0.03 }));
            },
          ),
          e.tier >= 2 &&
            t.later(1.5, () => {
              let r = 0,
                i = Math.atan2(e.az, e.ax);
              (W(t, 1, (a, o) => {
                let s = t.player.pos,
                  c = 16 * e.R,
                  l = i + a * H,
                  u = Math.cos(l),
                  d = Math.sin(l),
                  f = s.y + 1;
                if (
                  (t.vfx.beams.spawn(
                    s.x,
                    f,
                    s.z,
                    s.x + u * c,
                    f,
                    s.z + d * c,
                    1.1,
                    (a * 10) % 2 < 1 ? oh : sh,
                    0.05,
                  ),
                  t.vfx.beams.spawn(s.x, f, s.z, s.x + u * c, f, s.z + d * c, 0.4, 16777215, 0.05),
                  (r -= o),
                  r <= 0)
                ) {
                  r = 0.08;
                  for (let t of n.within(s.x + u * c * 0.5, s.z + d * c * 0.5, c * 0.55)) {
                    let r = n.x[t] - s.x,
                      i = n.z[t] - s.z,
                      a = r * u + i * d;
                    a > 0 &&
                      a < c &&
                      Math.abs(r * d - i * u) < 1.4 * e.R &&
                      Dh(e, t, 0.4, { knock: 1, silent: Math.random() < 0.5 });
                  }
                }
              }),
                J.whoosh(t.audio, 1, 0.1, 900));
            }));
      },
    },
    129: {
      names: [c(`Salpicadura Épica`), c(`Furia de Gyarados`)],
      descs: [
        c(
          `Saltas tres veces con todas tus fuerzas: cada caída levanta una ola enorme, y al final llueven Magikarp del cielo.`,
        ),
        c(
          `Gyarados ruge y encanta a todos, dos trombas de agua avanzan hacia tu objetivo y un Hiperrayo barre el frente. Con Madurez empieza a llover y una ola remata.`,
        ),
      ],
      type: `water`,
      cls: `physical`,
      dur: [2.6, 3],
      tint: 4885224,
      preload: [130],
      cast(e) {
        let t = e.run,
          n = t.player;
        if (e.form === 0) {
          for (let r = 0; r < 3; r++)
            t.later(r * 0.55, () => {
              ((n.vel.y = 9),
                (n.squash = -0.7),
                t.later(0.4, () => {
                  let i = n.pos,
                    a = (6 + r * 2.5) * e.R;
                  ((n.squash = 0.8), K(t, i.x, i.y, i.z, a, [Y.water, Y.foam, 16777215], 3, 0.05, L.Ripple));
                  for (let e = 0; e < 20; e++) {
                    let n = (e / 20) * H;
                    t.vfx.norm.spawn({
                      x: i.x,
                      y: i.y + 0.6,
                      z: i.z,
                      vx: Math.cos(n) * a * 1.4,
                      vy: F.range(4, 8),
                      vz: Math.sin(n) * a * 1.4,
                      gravity: 16,
                      life: 0.6,
                      size: 0.45,
                      endSize: 0.25,
                      color: 16777215,
                      shape: I.PixDrop,
                    });
                  }
                  (xh(t, i.x, i.y + 0.8, i.z, I.PixWave, 8, a * 1.4, 1.4, 0.4),
                    q(e, i.x, i.z, a, 1 + r * 0.3, { status: `wet`, statusChance: 1, knock: 5 }),
                    t.shake(0.15 + r * 0.08),
                    J.water(t.audio, 0.4, 0.14 + r * 0.04));
                }));
            });
          t.later(1.7, () =>
            Ih(
              e,
              8 + e.tier * 4,
              1,
              15,
              0.5,
              (e, n, r, i) => Eh(t, e, n, r, i, wl.PixFish, 1.6, 22, 5),
              (n, r, i) => {
                wh(t, n, r + 0.6, i, wl.PixFish, 1.4, 1.8, 0.3, F.range(-0.5, 0.5));
                for (let e = 0; e < 6; e++)
                  t.vfx.norm.spawn({
                    x: n,
                    y: r + 0.4,
                    z: i,
                    vx: F.range(-3, 3),
                    vy: F.range(3, 6),
                    vz: F.range(-3, 3),
                    gravity: 16,
                    life: 0.5,
                    size: 0.35,
                    endSize: 0.2,
                    color: 16777215,
                    shape: I.PixDrop,
                  });
                (q(e, n, i, 2.6 * e.R, 1, { status: `wet`, statusChance: 1, knock: 2 }),
                  t.audio.kt(300, 0.08, { to: 1.6, v: 0.06 }));
              },
            ),
          );
          return;
        }
        t.cry(130, 0.8);
        let r = 15 * e.R;
        for (let n of t.enemies.within(e.x, e.z, r)) t.combat.applyStatus(n, `charm`, 1);
        (K(t, e.x, e.y, e.z, r, [4885224, 16777215], 2, 0.1, L.Ripple),
          t.audio.kt(70, 0.8, { w: `sawtooth`, lp: 500, v: 0.12, vib: [10, 0.08], to: 0.7, a: 0.05 }));
        let i = Math.atan2(e.az, e.ax);
        for (let t of [-0.4, 0.4])
          Lh(e, Math.cos(i + t), Math.sin(i + t), 16 * e.R, 1.8, 0.4, 2, {
            status: `wet`,
            statusChance: 0.5,
          });
        (t.later(1.2, () => {
          let n = 0;
          (J.boom(t.audio, 0.6),
            t.audio.kt(110, 1, { w: `sawtooth`, lp: 900, v: 0.08, a: 0.05 }),
            W(t, 1, (r, a) => {
              let o = t.player.pos,
                s = 20 * e.R,
                c = i - 0.8 + r * 1.6,
                l = Math.cos(c),
                u = Math.sin(c),
                d = o.y + 1.2;
              if (
                (t.vfx.beams.spawn(o.x, d, o.z, o.x + l * s, d, o.z + u * s, 1.6, 16751194, 0.05),
                t.vfx.beams.spawn(o.x, d, o.z, o.x + l * s, d, o.z + u * s, 0.6, 16773312, 0.05),
                Math.random() < 0.6 &&
                  G(
                    t,
                    o.x + l * s * Math.random(),
                    o.z + u * s * Math.random(),
                    2,
                    I.PixCrack,
                    16777215,
                    1.4,
                    c,
                  ),
                (n -= a),
                n <= 0)
              ) {
                n = 0.08;
                for (let n of t.enemies.within(o.x + l * s * 0.5, o.z + u * s * 0.5, s * 0.55)) {
                  let r = t.enemies.x[n] - o.x,
                    i = t.enemies.z[n] - o.z,
                    a = r * l + i * u;
                  a > 0 &&
                    a < s &&
                    Math.abs(r * u - i * l) < 1.8 * e.R &&
                    Dh(e, n, 0.55, { dirX: l, dirZ: u, knock: 2, silent: Math.random() < 0.5 });
                }
              }
              t.shake(0.03);
            }));
        }),
          e.tier >= 2 &&
            t.later(2.3, () => {
              (t.setWeather(`rain`, 12),
                Ph(
                  e,
                  14 * e.R,
                  0.8,
                  1.4,
                  { status: `wet`, statusChance: 1, knock: 6 },
                  (e, n, r, i) =>
                    t.vfx.norm.spawn({
                      x: e,
                      y: n + 0.9,
                      z: r,
                      vx: Math.cos(i) * 4,
                      vy: 0.5,
                      vz: Math.sin(i) * 4,
                      life: 0.3,
                      size: 2,
                      endSize: 2.2,
                      color: 16777215,
                      shape: I.PixWave,
                    }),
                  36,
                ),
                J.water(t.audio, 0.9, 0.2));
            }));
      },
    },
    131: {
      names: [c(`Canto Glacial`)],
      descs: [
        c(
          `Cantas una melodía que adormece: el suelo se cubre de hielo que congela y una gran ola cargada de témpanos barre todo a tu alrededor. Con Madurez la ola es mayor y brotan columnas de hielo.`,
        ),
      ],
      type: `ice`,
      cls: `special`,
      dur: [2.6],
      tint: 10148095,
      cast(e) {
        let t = e.run,
          n = (12 + e.tier * 2) * e.R;
        W(t, 1.2, () => {
          let e = t.player.pos;
          if (Math.random() < 0.7) {
            let n = F.range(0, H),
              r = F.range(2, 6);
            t.vfx.norm.spawn({
              x: e.x,
              y: e.y + 2,
              z: e.z,
              vx: Math.cos(n) * r,
              vy: F.range(0.5, 1.5),
              vz: Math.sin(n) * r,
              drag: 0.8,
              life: 1.3,
              size: 0.6,
              endSize: 0.8,
              color: 16777215,
              shape: I.PixNote,
            });
          }
        });
        for (let r of t.enemies.within(e.x, e.z, n)) t.combat.applyStatus(r, `sleep`, 1);
        (J.chord(t.audio, [330, 415, 494], 0.04, 0, 0.6),
          J.chord(t.audio, [294, 370, 440], 0.04, 0.6, 0.8),
          t.later(0.6, () => {
            let e = t.player.pos;
            for (let r = 0; r < 18; r++) {
              let i = (r / 18) * H,
                a = F.range(2, n),
                o = e.x + Math.cos(i) * a,
                s = e.z + Math.sin(i) * a;
              t.vfx.groundN.spawn({
                x: o,
                y: U(t, o, s) + 0.09,
                z: s,
                life: 2.4,
                size: 3.4,
                endSize: 3.6,
                color: 14218495,
                shape: I.Shard,
                rot: F.range(0, H),
              });
            }
            for (let r of t.enemies.within(e.x, e.z, n))
              for (let e = 0; e < 2; e++) t.combat.applyStatus(r, `freeze`, 1);
            (K(t, e.x, e.y, e.z, n, [ah, 16777215], 2, 0.08, L.Ripple), J.whoosh(t.audio, 0.6, 0.1, 1200));
          }),
          t.later(1.3, () => {
            if (
              (Ph(
                e,
                n + 3,
                0.9,
                1.8,
                { status: `freeze`, statusChance: 1, knock: 6 },
                (e, n, r, i) => {
                  (t.vfx.norm.spawn({
                    x: e,
                    y: n + 0.9,
                    z: r,
                    vx: Math.cos(i) * 4,
                    vy: 0.5,
                    vz: Math.sin(i) * 4,
                    life: 0.3,
                    size: 2.2,
                    endSize: 2.4,
                    color: 16777215,
                    shape: I.PixWave,
                  }),
                    t.vfx.norm.spawn({
                      x: e,
                      y: n + 1.6,
                      z: r,
                      vx: Math.cos(i) * 3,
                      vy: F.range(2, 5),
                      vz: Math.sin(i) * 3,
                      gravity: 14,
                      life: 0.5,
                      size: 0.6,
                      endSize: 0.4,
                      color: 14218495,
                      shape: I.Shard,
                      spin: 6,
                    }));
                },
                40,
              ),
              J.water(t.audio, 1, 0.22),
              e.tier >= 1)
            )
              for (let r = 0; r < 8 + e.tier * 4; r++)
                t.later(0.3 + r * 0.04, () => {
                  let r = t.player.pos,
                    i = F.range(0, H),
                    a = F.range(4, n),
                    o = r.x + Math.cos(i) * a,
                    s = r.z + Math.sin(i) * a;
                  (Th(t, o, U(t, o, s), s, 1.2, ah, 16777215, 0.35, 12),
                    Ch(t, o, s, I.Shard, 2.6, 1.2, 8, 14218495),
                    q(e, o, s, 2.6 * e.R, 1, { status: `freeze`, statusChance: 1, knock: 1 }));
                });
          }));
      },
    },
  },
  uh = 11071743,
  dh = 16769594,
  fh = 12611839,
  ph = 16758858;
function mh(e, t, n, r) {
  for (let i of e.run.enemies.within(t, n, r))
    for (let t = 0; t < 3; t++) e.run.combat.applyStatus(i, `freeze`, 1);
}
var hh = {
    138: {
      names: [c(`Concha Abisal`), c(`Tormenta de Púas`)],
      descs: [
        c(
          `Una espiral de conchas fósiles y rocas brota a tu alrededor, atrapa a lo que toca y acaba en un géiser.`,
        ),
        c(
          `La espiral, los tentáculos de Omastar arrastran a la horda y llueven dieciséis púas de concha del cielo.`,
        ),
      ],
      type: `rock`,
      cls: `special`,
      dur: [1.6, 2.8],
      tint: 13148266,
      cast(e) {
        let t = e.run,
          n = new Set();
        for (let r = 0; r < 14; r++)
          t.later(r * 0.05, () => {
            for (let i = 0; i < 3; i++) {
              let a = (i / 3) * H + r * 0.42,
                o = (1.5 + r * 0.8) * e.R,
                s = e.x + Math.cos(a) * o,
                c = e.z + Math.sin(a) * o;
              (Ch(t, s, c, r % 2 ? El.PixShell : I.PixSpike, 1.6 + r * 0.05, 1, 6),
                Math.random() < 0.5 && bh(t, s, U(t, s, c), c, 2, 3, I.PixRock, 0.35),
                Oh(e, n, s, c, 2 * e.R, 1.1, { status: `root`, statusChance: 0.8, knock: 1 }));
            }
            r % 3 == 0 && J.rumble(t.audio, 0.15, 0.08);
          });
        (t.later(0.8, () => {
          let n = t.player.pos;
          for (let e = 0; e < 24; e++)
            t.vfx.norm.spawn({
              x: n.x + F.range(-0.5, 0.5),
              y: n.y + 1,
              z: n.z + F.range(-0.5, 0.5),
              vx: F.range(-3, 3),
              vy: F.range(10, 17),
              vz: F.range(-3, 3),
              gravity: 18,
              life: 1,
              size: 0.55,
              endSize: 0.3,
              color: 16777215,
              shape: I.PixDrop,
            });
          (K(t, n.x, n.y, n.z, 9 * e.R, [Y.water, 13148266, Y.white], 3, 0.07, L.Ripple),
            q(e, n.x, n.z, 9 * e.R, 1.3, { status: `wet`, statusChance: 1, knock: 5 }),
            t.shake(0.25),
            J.water(t.audio, 0.8, 0.18));
        }),
          e.tier !== 0 &&
            (W(t, 1, (n, r) => {
              let i = t.player.pos,
                a = 14 * e.R;
              if (Math.random() < 0.7) {
                let e = F.range(0, H),
                  r = i.x + Math.cos(e) * a * 0.8,
                  o = i.z + Math.sin(e) * a * 0.8;
                t.vfx.beams.spawn(
                  i.x,
                  i.y + 0.8,
                  i.z,
                  r,
                  U(t, r, o) + 0.4,
                  o,
                  0.25,
                  n < 0.5 ? 8046824 : 5941464,
                  0.12,
                );
              }
              kh(t, i.x, i.z, a, 36 * r);
            }),
            Ih(
              e,
              16,
              1.4,
              16,
              0.45,
              (e, n, r, i) => {
                (Eh(t, e, n, r, i, I.PixSpike, 1.8, 22, 5), t.vfx.telegraph(e, n, r, 2.6, 13148266, i));
              },
              (n, r, i) => {
                (bh(t, n, r, i, 6, 5, I.PixRock, 0.4),
                  G(t, n, i, 2.6, I.PixCrack),
                  q(e, n, i, 2.6 * e.R, 1.2, { status: `stun`, statusChance: 0.5, knock: 2 }),
                  J.boom(t.audio, 0.3));
              },
            ),
            t.cry(139, 0.6)));
      },
    },
    140: {
      names: [c(`Caparazón Giratorio`), c(`Tajo Fósil`)],
      descs: [
        c(
          `Giras dentro del caparazón 1,6 s rodeado de cuatro cuchillas que golpean sin parar, y acabas con una salpicadura.`,
        ),
        c(`Saltas de enemigo en enemigo dando seis tajos y dos grietas en X cortan el suelo a tu alrededor.`),
      ],
      type: `rock`,
      cls: `physical`,
      dur: [1.8, 2.2],
      tint: 10139848,
      preload: [141],
      cast(e) {
        let t = e.run,
          n = t.player;
        if (e.tier === 0) {
          let r = 0;
          (W(
            t,
            1.6,
            (i, a) => {
              let o = n.pos,
                s = 4 * e.R;
              for (let e = 0; e < 4; e++) {
                let n = i * 12 + (e / 4) * H;
                t.vfx.norm.spawn({
                  x: o.x + Math.cos(n) * s * 0.75,
                  y: o.y + 0.8,
                  z: o.z + Math.sin(n) * s * 0.75,
                  life: 0.06,
                  size: 1.3,
                  endSize: 1.3,
                  color: 16777215,
                  shape: El.PixScythe,
                  rot: -n,
                });
              }
              (Math.random() < 0.6 &&
                t.vfx.norm.spawn({
                  x: o.x,
                  y: o.y + 0.6,
                  z: o.z,
                  vx: F.range(-6, 6),
                  vy: F.range(2, 4),
                  vz: F.range(-6, 6),
                  gravity: 14,
                  life: 0.4,
                  size: 0.35,
                  endSize: 0.2,
                  color: 16777215,
                  shape: I.PixDrop,
                }),
                t.vfx.staticRing(o.x, o.y, o.z, s, 10139848, 0.5, L.Ripple),
                (r -= a),
                r <= 0 && ((r = 0.18), q(e, o.x, o.z, s, 0.4, { knock: 2, silent: Math.random() < 0.5 })));
            },
            () => {
              let r = n.pos;
              (K(t, r.x, r.y, r.z, 8 * e.R, [Y.water, Y.foam], 2, 0.08, L.Ripple),
                xh(t, r.x, r.y + 0.6, r.z, I.PixDrop, 18, 14, 0.5, 0.5),
                q(e, r.x, r.z, 8 * e.R, 1.4, { status: `wet`, statusChance: 1, knock: 5 }),
                J.water(t.audio, 0.6, 0.16));
            },
          ),
            J.whoosh(t.audio, 1.6, 0.12, 600));
          return;
        }
        let r = new Set(),
          i = t.enemies;
        for (let n = 0; n < 6; n++)
          t.later(n * 0.12, () => {
            let n = Hh(t, 15, r);
            n < 0 ||
              (r.add(n),
              Vh(t, n, 12112104),
              wh(
                t,
                i.x[n],
                i.y[n] + i.hgt[n] * 0.6,
                i.z[n],
                El.PixScythe,
                1.6,
                2.6,
                0.18,
                F.range(-0.8, 0.8),
              ),
              Dh(e, n, 1.4, { knock: 3 }),
              t.audio.kn(0.12, { f: 1600, to: 0.4, q: 1.2, v: 0.12, a: 0.02 }));
          });
        (t.later(0.85, () => {
          let r = n.pos,
            i = Math.atan2(e.az, e.ax) + Math.PI / 4;
          for (let n = 0; n < 4; n++)
            Mh(e, r.x, r.z, i + (n / 4) * H, {
              len: 14 * e.R,
              step: 1.3,
              glow: 6994175,
              mul: 1.2,
              o: { knock: 3 },
              erupt: (e, n, r) => {
                Math.random() < 0.5 &&
                  t.vfx.norm.spawn({
                    x: e,
                    y: n + 0.4,
                    z: r,
                    vy: F.range(4, 8),
                    gravity: 16,
                    life: 0.5,
                    size: 0.4,
                    endSize: 0.2,
                    color: 16777215,
                    shape: I.PixDrop,
                  });
              },
            });
          (G(t, r.x, r.z, 6, I.PixCrack, 16777215, 2.4), t.shake(0.35), J.boom(t.audio, 0.9));
        }),
          t.cry(141, 0.6));
      },
    },
    142: {
      names: [c(`Picado Prehistórico`)],
      descs: [
        c(
          `Subes muy alto y caes en picado con una onda de rocas antiguas; con Madurez, tres picados y una bandada de Aerodactyl.`,
        ),
      ],
      type: `rock`,
      cls: `physical`,
      dur: [2.6],
      tint: 13152400,
      preload: [142],
      cast(e) {
        let t = e.run,
          n = t.player,
          r = e.tier >= 1 ? 3 : 1;
        for (let i = 0; i < r; i++)
          t.later(i * 0.7, () => {
            (n.pos.y - U(t, n.pos.x, n.pos.z) < 5 && (n.vel.y = 15),
              (n.squash = -0.6),
              J.whoosh(t.audio, 0.4, 0.12, 400),
              t.later(0.55, () => {
                let r = n.pos,
                  a = (9 + i * 2) * e.R;
                ((n.squash = 0.8), K(t, r.x, r.y, r.z, a, [ph, 11047018, Y.white], 3, 0.06, L.Jagged));
                for (let e = 0; e < 12; e++) {
                  let n = (e / 12) * H;
                  t.vfx.norm.spawn({
                    x: r.x,
                    y: r.y + 0.8,
                    z: r.z,
                    vx: Math.cos(n) * a * 1.8,
                    vy: F.range(2, 5),
                    vz: Math.sin(n) * a * 1.8,
                    gravity: 10,
                    drag: 1.5,
                    life: 0.6,
                    size: 0.7,
                    endSize: 0.5,
                    color: 16777215,
                    shape: e % 3 ? I.PixRock : El.PixAmber,
                    spin: 6,
                  });
                }
                (G(t, r.x, r.z, a * 0.7, I.PixCrack, 16777215, 2.4),
                  t.vfx.dust(r.x, r.y, r.z, 13154456, 14, a),
                  q(e, r.x, r.z, a, 1.8, { status: `stun`, statusChance: 0.8, knock: 6 }),
                  t.shake(0.35),
                  J.boom(t.audio, 1));
              }));
          });
        (e.tier >= 2 &&
          t.ult.drones.add(142, 4, 3, 1, (n, r, i) => {
            (wh(t, n, r + 0.7, i, I.PixFang, 1.2, 1.8, 0.18),
              bh(t, n, U(t, n, i), i, 4, 4),
              q(e, n, i, 2.8 * e.R, 1.1, { knock: 3 }),
              J.boom(t.audio, 0.25));
          }),
          t.cry(142, 0.7));
      },
    },
    144: {
      names: [c(`Ventisca Eterna`)],
      descs: [
        c(
          `Una ventisca de 3 s cubre el mapa: carámbanos caen sobre los enemigos, todo en 18 m se va congelando y al final se congela de golpe; empieza a granizar. Con Madurez, tres Articuno barren el campo.`,
        ),
      ],
      type: `ice`,
      cls: `special`,
      dur: [3.4],
      tint: 10150143,
      preload: [144],
      cast(e) {
        let t = e.run,
          n = t.player,
          r = 18 * e.R;
        t.setWeather(`hail`, 14);
        let i = 0;
        (W(t, 3, (e, a) => {
          let o = n.pos;
          for (let e = 0; e < 5; e++) {
            let n = F.range(0, H),
              i = F.range(1, r);
            t.vfx.norm.spawn({
              x: o.x + Math.cos(n) * i,
              y: o.y + F.range(2, 7),
              z: o.z + Math.sin(n) * i,
              vx: 7,
              vy: -6,
              vz: 2,
              life: 0.7,
              size: 0.4,
              endSize: 0.3,
              color: 16777215,
              shape: e % 2 ? I.PixSnow : El.PixIceFeather,
              spin: 4,
            });
          }
          if (((i -= a), i <= 0)) {
            i = 0.5;
            for (let e of t.enemies.within(o.x, o.z, r)) t.combat.applyStatus(e, `freeze`, 1);
          }
        }),
          Ih(
            e,
            18,
            2.4,
            17,
            0.4,
            (e, n, r, i) => {
              (Eh(t, e, n, r, i, I.Shard, 1.8, 20, 4, uh), t.vfx.telegraph(e, n, r, 2.6, uh, i));
            },
            (n, r, i) => {
              for (let e = 0; e < 6; e++) {
                let a = (e / 6) * H;
                t.vfx.norm.spawn({
                  x: n,
                  y: r + 0.4,
                  z: i,
                  vx: Math.cos(a) * 5,
                  vy: F.range(2, 4),
                  vz: Math.sin(a) * 5,
                  gravity: 14,
                  life: 0.5,
                  size: 0.5,
                  endSize: 0.3,
                  color: 12577535,
                  shape: I.Shard,
                  spin: 6,
                });
              }
              (q(e, n, i, 2.6 * e.R, 1.1, { status: `freeze`, statusChance: 1, knock: 1 }),
                J.boom(t.audio, 0.2));
            },
          ),
          t.later(3, () => {
            let i = n.pos;
            (K(t, i.x, i.y, i.z, r, [uh, Y.white, 6994152], 3, 0.08, L.Ripple),
              xh(t, i.x, i.y + 1, i.z, El.PixIceFeather, 20, r * 1.6, 0.9, 0.7, r),
              mh(e, i.x, i.z, r),
              q(e, i.x, i.z, r, 1.6, { knock: 3 }),
              t.shake(0.35),
              J.boom(t.audio, 0.9));
          }),
          J.whoosh(t.audio, 3, 0.12, 900),
          e.tier >= 1 &&
            t.ult.drones.add(
              144,
              e.tier >= 2 ? 4 : 3,
              3,
              1.1,
              (n, r, i) => {
                (t.vfx.ring(n, U(t, n, i), i, 3, uh, 0.3, 0.2, L.Ripple),
                  xh(t, n, r + 0.5, i, El.PixIceFeather, 8, 6, 0.6, 0.5),
                  q(e, n, i, 3 * e.R, 1.2, { status: `freeze`, statusChance: 1, knock: 2 }));
              },
              (e, n, r) => {
                Math.random() < 0.5 &&
                  t.vfx.norm.spawn({
                    x: e,
                    y: n,
                    z: r,
                    vy: -1,
                    life: 0.5,
                    size: 0.3,
                    endSize: 0.2,
                    color: 16777215,
                    shape: I.PixSnow,
                  });
              },
            ),
          t.cry(144, 0.8));
      },
    },
    145: {
      names: [c(`Tormenta Legendaria`)],
      descs: [
        c(
          `Zapdos desata una tormenta de 3 s: caen rayos sin parar y cinco truenos enormes golpean a los más fuertes. Con Madurez, tres Zapdos en picado y lluvia.`,
        ),
      ],
      type: `electric`,
      cls: `special`,
      dur: [3.4],
      tint: 16769594,
      preload: [145],
      cast(e) {
        let t = e.run,
          n = t.enemies;
        Fh(e, 3, 0.07, 18, 0.7, [dh, 16775360]);
        for (let r = 0; r < 5; r++)
          t.later(0.5 + r * 0.5, () => {
            let i = t.player.pos,
              a = Ah(t, i.x, i.z, 18 * e.R, 14).sort((e, t) => n.hp[t] - n.hp[e]),
              o = a[r % Math.max(1, a.length)];
            if (o == null) return;
            let s = n.x[o],
              c = n.z[o],
              l = U(t, s, c);
            for (let e = 0; e < 3; e++)
              t.vfx.lightning(
                s + F.range(-2, 2),
                l + 34,
                c + F.range(-2, 2),
                s,
                l,
                c,
                e ? dh : 16775360,
                e ? 0.8 : 0.3,
                12,
                0.3,
              );
            (t.vfx.flash(s, l + 1, c, dh, 5, 0.2),
              t.vfx.norm.spawn({
                x: s,
                y: l + 1.5,
                z: c,
                life: 0.3,
                size: 3,
                endSize: 2,
                color: 16777215,
                shape: I.PixBolt,
              }),
              G(t, s, c, 5, I.PixCrack, 16777215, 2.5));
            for (let e = 0; e < 6; e++) {
              let n = (e / 6) * H;
              t.vfx.lightning(
                s,
                l + 0.3,
                c,
                s + Math.cos(n) * 5,
                l + 0.2,
                c + Math.sin(n) * 5,
                dh,
                0.3,
                5,
                0.2,
              );
            }
            (q(e, s, c, 5 * e.R, 2.2, { status: `paralysis`, statusChance: 1, knock: 4 }),
              t.shake(0.3),
              J.boom(t.audio, 0.8));
          });
        (e.tier >= 1 &&
          (t.later(0.4, () => t.setWeather(`rain`, 12)),
          t.ult.drones.add(
            145,
            e.tier >= 2 ? 4 : 3,
            3,
            1.1,
            (n, r, i) => {
              let a = U(t, n, i);
              (t.vfx.lightning(n, a + 8, i, n, a, i, dh, 0.4, 6, 0.2),
                t.vfx.ring(n, a, i, 3, dh, 0.3, 0.2, L.Dashed),
                q(e, n, i, 3 * e.R, 1.2, { status: `paralysis`, statusChance: 0.9, knock: 2 }),
                J.zap(t.audio));
            },
            (e, n, r) => {
              Math.random() < 0.4 &&
                t.vfx.lightning(
                  e,
                  n,
                  r,
                  e + F.range(-1, 1),
                  n + F.range(-1, 1),
                  r + F.range(-1, 1),
                  dh,
                  0.15,
                  3,
                  0.08,
                );
            },
          )),
          t.cry(145, 0.8));
      },
    },
    146: {
      names: [c(`Fénix Renacido`)],
      descs: [
        c(
          `Moltres extiende las alas: llueven dieciséis bolas de fuego, la tierra se agrieta en magma y renaces con un 30% de PS. Con Madurez, tres Moltres en picado.`,
        ),
      ],
      type: `fire`,
      cls: `special`,
      dur: [3],
      tint: 16742954,
      preload: [146],
      cast(e) {
        let t = e.run,
          n = t.player;
        for (let n = 0; n < 30; n++) {
          let r = n % 2 ? 1 : -1,
            i = Math.floor(n / 2) / 15,
            a = Math.atan2(e.az, e.ax) + r * (Math.PI / 2 + i * 0.8);
          _h(
            t,
            e.x + Math.cos(a) * i * 6,
            e.y + 1.5 + i * 2.5,
            e.z + Math.sin(a) * i * 6,
            Math.cos(a) * 2,
            3,
            Math.sin(a) * 2,
            0.8,
            1.6,
            0.5,
            1,
          );
        }
        (J.fire(t.audio, 1.2, 0.2),
          Nh(e, e.x, e.z, 6, {
            len: 14 * e.R,
            glow: Y.magma,
            mul: 0.9,
            o: { status: `burn`, statusChance: 0.8 },
            erupt: (e, n, r) => _h(t, e, n + 0.4, r, 0, F.range(5, 9), 0, 0.5, 1.1, 0.4, 1.5),
          }),
          Ih(
            e,
            16,
            2,
            17,
            0.5,
            (e, n, r, i) => {
              (Eh(t, e, n, r, i, I.PixFlame, 2.2, 26, 7, 16734746),
                t.vfx.telegraph(e, n, r, 3.2, Y.magma, i));
            },
            (n, r, i) => {
              t.vfx.ring(n, r, i, 3.2, 13647898, 0.35, 0.15, L.Flames);
              for (let e = 0; e < 8; e++) {
                let a = (e / 8) * H;
                _h(t, n, r + 0.5, i, Math.cos(a) * 6, F.range(2, 5), Math.sin(a) * 6, 0.45, 1, 0.3, 3);
              }
              (yh(t, n, r + 0.5, i, 6, 6),
                q(e, n, i, 3.2 * e.R, 1.2, { status: `burn`, statusChance: 0.9, knock: 2 }),
                J.boom(t.audio, 0.35));
            },
          ),
          t.later(2.5, () => {
            let r = n.pos,
              i = 13 * e.R;
            (n.heal(n.maxHp * 0.3),
              t.audio.heal(),
              Th(t, r.x, r.y, r.z, 2.6, 16747050, 16773280, 0.8),
              K(t, r.x, r.y, r.z, i, [13647898, 16756794, 13647898], 3, 0.07, L.Flames),
              xh(t, r.x, r.y + 1, r.z, I.PixFeather, 16, i * 1.5, 0.7, 0.6, i, 16756848),
              q(e, r.x, r.z, i, 1.6, { status: `burn`, statusChance: 1, knock: 5 }),
              t.shake(0.4),
              J.boom(t.audio, 1.1));
          }),
          e.tier >= 1 &&
            t.ult.drones.add(
              146,
              e.tier >= 2 ? 4 : 3,
              2.8,
              1.1,
              (n, r, i) => {
                let a = U(t, n, i);
                for (let e = 0; e < 8; e++) {
                  let r = (e / 8) * H;
                  _h(t, n, a + 0.5, i, Math.cos(r) * 5, F.range(2, 5), Math.sin(r) * 5, 0.45, 1, 0.3, 3);
                }
                q(e, n, i, 3 * e.R, 1.2, { status: `burn`, statusChance: 1, knock: 2 });
              },
              (e, n, r) => {
                Math.random() < 0.6 && _h(t, e, n, r, 0, 1, 0, 0.3, 0.7, 0.2);
              },
            ),
          t.cry(146, 0.8));
      },
    },
    150: {
      names: [c(`Onda Mental`)],
      descs: [
        c(
          `Todo en 22 m se detiene 1,2 s marcado por tu mente; luego columnas psíquicas aplastan a dieciséis enemigos y una onda mental estalla. Con Madurez, esferas de Onda Mental persiguen a los más fuertes y una barrera te protege.`,
        ),
      ],
      type: `psychic`,
      cls: `special`,
      dur: [2.8],
      tint: 10510591,
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = t.player,
          i = 22 * e.R,
          a = Ah(t, e.x, e.z, i, 60);
        for (let e of a)
          ((n.stun[e] = Math.max(n.stun[e], n.flags[e] & R.Boss ? 0.4 : n.flags[e] & 12290 ? 0.8 : 1.3)),
            t.vfx.norm.spawn({
              x: n.x[e],
              y: n.y[e] + n.hgt[e] + 0.6,
              z: n.z[e],
              life: 1.1,
              size: 0.5,
              endSize: 1,
              color: 16777215,
              shape: I.PixEye,
            }));
        (K(t, e.x, e.y, e.z, i, [fh, 15255807, 6957744], 3, 0.12, L.Runes),
          t.vfx.add.spawn({
            x: e.x,
            y: e.y + 1.2,
            z: e.z,
            life: 1,
            size: 2,
            endSize: 9,
            color: fh,
            shape: I.Ring,
            glow: 0.2,
          }),
          t.audio.kt(110, 1.2, { v: 0.1, to: 1.6, vib: [5, 0.05], a: 0.4 }),
          t.audio.kt(165, 1.2, { v: 0.05, to: 1.6, vib: [6, 0.04], a: 0.5 }),
          a.slice(0, 16).forEach((r, i) =>
            t.later(1 + i * 0.04, () => {
              if (!n.isAlive(r)) return;
              let i = n.x[r],
                a = n.z[r],
                o = U(t, i, a);
              (Th(t, i, o, a, 1.6, fh, 16769279, 0.4, 18),
                G(t, i, a, 2.6, I.PixCrack, 16777215, 1.8),
                q(e, i, a, 2.6 * e.R, 1.8, { status: `confusion`, statusChance: 1, knock: 2 }));
            }),
          ),
          t.later(1.9, () => {
            let n = r.pos;
            (t.vfx.flash(n.x, n.y + 1, n.z, fh, 6, 0.25),
              K(t, n.x, n.y, n.z, 15 * e.R, [16777215, fh, 6957744], 3, 0.07, L.Runes),
              xh(t, n.x, n.y + 1, n.z, I.PixSparkle, 20, 30 * e.R, 0.8, 0.6, 10),
              q(e, n.x, n.z, 15 * e.R, 2, { knock: 6 }),
              t.shake(0.5),
              J.boom(t.audio, 1.3));
          }),
          e.tier !== 0 &&
            ((r.shield = Math.max(r.shield, r.maxHp * 0.4)),
            a
              .slice()
              .sort((e, t) => n.hp[t] - n.hp[e])
              .slice(0, 4 + e.tier * 2)
              .forEach((i, a) =>
                t.later(0.3 + a * 0.1, () => {
                  if (!n.isAlive(i)) return;
                  let a = r.pos,
                    o = a.x,
                    s = a.y + 1.5,
                    c = a.z,
                    l = n.x[i],
                    u = n.y[i] + 0.8,
                    d = n.z[i],
                    f = 0.5;
                  (t.vfx.add.spawn({
                    x: o,
                    y: s,
                    z: c,
                    vx: (l - o) / f,
                    vy: (u - s) / f,
                    vz: (d - c) / f,
                    life: f,
                    size: 1.2,
                    endSize: 1,
                    color: fh,
                    shape: I.Soft,
                    glow: 0.2,
                  }),
                    t.vfx.norm.spawn({
                      x: o,
                      y: s,
                      z: c,
                      vx: (l - o) / f,
                      vy: (u - s) / f,
                      vz: (d - c) / f,
                      life: f,
                      size: 0.6,
                      endSize: 0.6,
                      color: 16777215,
                      shape: I.PixSparkle,
                      spin: 6,
                    }),
                    t.later(f, () => {
                      (K(t, l, U(t, l, d), d, 3.6, [fh, Y.white], 2, 0.05, L.Runes),
                        q(e, l, d, 3.6 * e.R, 2.2, { status: `stun`, statusChance: 1, knock: 3 }),
                        J.zap(t.audio));
                    }));
                }),
              ),
            t.cry(150, 0.8)));
      },
    },
    133: {
      names: [c(`Carga Adaptable`), c(`Evolución Elemental`)],
      descs: [
        c(
          `Una lluvia de estrellas de Rapidez cae sobre doce enemigos y acaba en una embestida que agrieta el suelo.`,
        ),
        c(
          `Depende de tu evolución. Vaporeon: un maremoto y Armadura Ácida (te curas un 25%). Jolteon: misiles de púas eléctricas y una tormenta. Flareon: una estrella de fuego y llamaradas.`,
        ),
      ],
      type: `normal`,
      cls: `special`,
      dur: [1.8, 2.6],
      tint: 15255696,
      cast(e) {
        let t = e.run,
          n = t.player,
          r = n.speciesId;
        if (r === 134)
          (Ph(
            { ...e, type: `water` },
            16 * e.R,
            0.9,
            1.8,
            { status: `wet`, statusChance: 1, knock: 6 },
            (e, n, r, i) => {
              t.vfx.norm.spawn({
                x: e,
                y: n + 0.9,
                z: r,
                vx: Math.cos(i) * 4,
                vy: 0.5,
                vz: Math.sin(i) * 4,
                life: 0.3,
                size: 2.2,
                endSize: 2.4,
                color: 16777215,
                shape: I.PixWave,
              });
            },
            40,
          ),
            t.vfx.ring(e.x, e.y, e.z, 16 * e.R, Y.water, 0.9, 0.08, L.Ripple),
            n.heal(n.maxHp * 0.25),
            t.later(0.9, () => t.setWeather(`rain`, 12)),
            J.water(t.audio, 1, 0.22));
        else if (r === 135) {
          let r = { ...e, type: `electric` };
          for (let r = 0; r < 36; r++) {
            let i = (r / 36) * H;
            t.later((r % 12) * 0.03, () =>
              t.projectiles.fire({
                x: n.pos.x,
                y: n.pos.y + 0.9,
                z: n.pos.z,
                dx: Math.cos(i),
                dz: Math.sin(i),
                speed: 28,
                life: 0.65,
                radius: 0.5,
                dmg: e.dmg * 0.55,
                type: `electric`,
                cls: `special`,
                pierce: 3,
                status: `paralysis`,
                statusChance: 0.6,
                size: 1,
                shape: I.PixBolt,
                color: 16777215,
                slot: 8,
                knock: 1,
              }),
            );
          }
          Fh(r, 2.2, 0.1, 15, 0.7, [dh, 16775360]);
        } else if (r === 136) {
          let r = { ...e, type: `fire` };
          for (let n = 0; n < 5; n++)
            Mh(r, e.x, e.z, Math.atan2(e.az, e.ax) + (n / 5) * H, {
              len: 15 * e.R,
              glow: Y.magma,
              mul: 1.3,
              o: { status: `burn`, statusChance: 0.9 },
              erupt: (e, n, r) => {
                for (let i = 0; i < 2; i++) _h(t, e, n + 0.4, r, 0, F.range(6, 10), 0, 0.5, 1.2, 0.4, 1.5);
              },
            });
          (t.later(0.5, () => {
            let i = n.pos,
              a = 11 * e.R;
            t.vfx.ring(i.x, i.y, i.z, a, 13647898, 0.5, 0.12, L.Flames);
            for (let e = 0; e < 30; e++) {
              let n = (e / 30) * H;
              _h(
                t,
                i.x,
                i.y + 0.5,
                i.z,
                Math.cos(n) * a * 2.2,
                F.range(1, 3),
                Math.sin(n) * a * 2.2,
                0.45,
                1.3,
                0.5,
                3.5,
              );
            }
            (q(r, i.x, i.z, a, 1.6, { status: `burn`, statusChance: 1, knock: 5 }), J.boom(t.audio, 0.9));
          }),
            J.fire(t.audio, 1.2, 0.2));
        } else
          (Ih(
            e,
            12,
            1.2,
            15,
            0.4,
            (e, n, r, i) => Eh(t, e, n, r, i, I.PixStar, 1.6, 22, 5, 16771178),
            (n, r, i) => {
              (t.vfx.ring(n, r, i, 3, 16771232, 0.3, 0.2),
                xh(t, n, r + 0.5, i, I.PixSparkle, 6, 6, 0.6, 0.4),
                q(e, n, i, 3 * e.R, 1.2, { knock: 2 }),
                J.sparkle(t.audio));
            },
          ),
            t.later(1.4, () => {
              let r = n.pos,
                i = 9 * e.R;
              (K(t, r.x, r.y, r.z, i, [14203e3, 16771232, Y.white], 3, 0.07, L.Jagged),
                G(t, r.x, r.z, i * 0.7, I.PixCrack, 16777215, 2.2),
                q(e, r.x, r.z, i, 1.6, { knock: 5 }),
                t.shake(0.3),
                J.boom(t.audio, 0.8));
            }));
      },
    },
    143: {
      names: [c(`Gigaplancha`)],
      descs: [
        c(
          `Bostezas (duerme a los cercanos), saltas y caes con todo tu peso: un terremoto que agrieta el suelo. Con Madurez, dos planchas, grietas y Descanso (te curas un 30%).`,
        ),
      ],
      type: `normal`,
      cls: `physical`,
      dur: [2.8],
      tint: 6982312,
      cast(e) {
        let t = e.run,
          n = t.player,
          r = e.tier >= 1 ? 2 : 1;
        for (let n of t.enemies.within(e.x, e.z, 10 * e.R)) t.combat.applyStatus(n, `sleep`, 1);
        for (let n = 0; n < 3; n++)
          t.vfx.norm.spawn({
            x: e.x + F.range(-1, 1),
            y: e.y + 2.5,
            z: e.z,
            vy: 1.2,
            life: 1,
            size: 0.5,
            endSize: 0.9,
            color: 10148095,
            shape: I.PixSleepZ,
          });
        t.audio.kt(120, 0.6, { w: `triangle`, lp: 600, v: 0.08, to: 0.7, a: 0.2 });
        for (let i = 0; i < r; i++)
          t.later(0.4 + i * 0.9, () => {
            ((n.vel.y = 13),
              (n.squash = -0.7),
              t.later(0.6, () => {
                let r = n.pos,
                  a = (12 + i * 3) * e.R;
                ((n.squash = 1),
                  K(t, r.x, r.y, r.z, a, [14207144, 6982312, Y.white], 3, 0.07, L.Jagged),
                  G(t, r.x, r.z, a * 0.8, I.PixCrack, 16777215, 3),
                  t.vfx.dust(r.x, r.y, r.z, 14207144, 24, a * 1.3),
                  bh(t, r.x, r.y, r.z, 16, 10),
                  e.tier >= 1 &&
                    Nh(e, r.x, r.z, 6, {
                      len: a,
                      mul: 0.7,
                      erupt: (e, n, r, i) => Ch(t, e, r, I.PixSpike, 2 - i, 0.8, 6),
                    }),
                  q(e, r.x, r.z, a, 2.2, { status: `stun`, statusChance: 1, knock: 7 }),
                  t.shake(0.6),
                  J.boom(t.audio, 1.4),
                  J.rumble(t.audio, 0.8, 0.2));
              }));
          });
        (e.tier >= 1 &&
          t.later(2.2, () => {
            (n.heal(n.maxHp * 0.3),
              t.audio.heal(),
              Sh(t, n.pos.x, n.pos.y + 1.5, n.pos.z, 10148095, 10, 3, I.Twinkle, 0.5, 0.6));
          }),
          t.cry(143, 0.7));
      },
    },
    147: {
      names: [c(`Ciclón Dragón`), c(`Aro Dragón`), c(`Cometa Draco Final`)],
      descs: [
        c(`Un ciclón de llama dracónica avanza 16 m hacia tu objetivo arrastrando y golpeando.`),
        c(
          `Los orbes de Dragonair: tres anillos de dragón salen de ti, cambia el tiempo a lluvia y dos ciclones barren el frente.`,
        ),
        c(
          `Dragonite llama a los cometas: doce Cometas Draco caen del cielo, tres Dragonite se lanzan en picado y un huracán lo remata.`,
        ),
      ],
      type: `dragon`,
      cls: `special`,
      dur: [2, 2.4, 3.2],
      tint: 8018687,
      preload: [149],
      cast(e) {
        let t = e.run,
          n = Math.atan2(e.az, e.ax),
          r = e.tier === 0 ? 1 : 2;
        for (let t = 0; t < r; t++) {
          let i = n + (t - (r - 1) / 2) * 0.5;
          Lh(e, Math.cos(i), Math.sin(i), 16 * e.R, 2, 0.45, 1.9 + e.tier * 0.3, {
            status: `confusion`,
            statusChance: 0.2,
          }, 1.9);
        }
        if (
          (W(t, 1.6, (e) => {
            let n = t.player.pos;
            for (let r = 0; r < 2; r++) {
              let i = e * 6 + r * Math.PI;
              t.vfx.norm.spawn({
                x: n.x + Math.cos(i) * 2.5,
                y: n.y + 1.2,
                z: n.z + Math.sin(i) * 2.5,
                life: 0.1,
                size: 1,
                endSize: 1,
                color: 16777215,
                shape: I.PixDragonFire,
              });
            }
          }),
          J.whoosh(t.audio, 2, 0.14, 300),
          e.tier >= 1)
        ) {
          for (let n = 0; n < 3; n++)
            t.later(0.2 + n * 0.3, () => {
              let r = t.player.pos,
                i = (7 + n * 3) * e.R;
              K(t, r.x, r.y, r.z, i, [8018687, 10148095, Y.white], 2, 0.06, L.Runes);
              for (let e = 0; e < 12; e++) {
                let n = (e / 12) * H;
                t.vfx.norm.spawn({
                  x: r.x,
                  y: r.y + 0.8,
                  z: r.z,
                  vx: Math.cos(n) * i * 2,
                  vy: F.range(0, 1.5),
                  vz: Math.sin(n) * i * 2,
                  drag: 2.5,
                  life: 0.5,
                  size: 1,
                  endSize: 0.5,
                  color: 16777215,
                  shape: I.PixDragonFire,
                });
              }
              (q(e, r.x, r.z, i, 0.9, { knock: 4 }), J.boom(t.audio, 0.4));
            });
          e.tier === 1 && t.later(0.9, () => t.setWeather(`rain`, 12));
        }
        e.tier >= 2 &&
          (Ih(
            e,
            12,
            1.6,
            17,
            0.6,
            (e, n, r, i) => {
              (Eh(t, e, n, r, i, I.PixDragonFire, 2.6, 28, 9, 8018687),
                t.vfx.telegraph(e, n, r, 3.8, 10124031, i));
            },
            (n, r, i) => {
              for (let e = 0; e < 10; e++) {
                let a = (e / 10) * H;
                t.vfx.norm.spawn({
                  x: n,
                  y: r + 0.5,
                  z: i,
                  vx: Math.cos(a) * 7,
                  vy: F.range(2, 5),
                  vz: Math.sin(a) * 7,
                  drag: 3,
                  life: 0.5,
                  size: 1.1,
                  endSize: 0.4,
                  color: 16777215,
                  shape: I.PixDragonFire,
                });
              }
              (bh(t, n, r, i, 6, 5),
                G(t, n, i, 4, I.PixCrack),
                t.vfx.ring(n, r, i, 3.8, 8018687, 0.35, 0.2, L.Runes),
                q(e, n, i, 3.8 * e.R, 1.5, { knock: 3 }),
                t.shake(0.12, n, i),
                J.boom(t.audio, 0.5));
            },
          ),
          t.ult.drones.add(149, 3, 2.8, 1.1, (n, r, i) => {
            (t.vfx.ring(n, U(t, n, i), i, 3, 16758858, 0.3, 0.2, L.Jagged),
              bh(t, n, U(t, n, i), i, 5, 5),
              q(e, n, i, 3 * e.R, 1.4, { knock: 3 }),
              J.boom(t.audio, 0.3));
          }),
          t.cry(149, 0.7));
      },
    },
    151: {
      names: [c(`Gen Ancestral`)],
      descs: [
        c(
          `Una burbuja psíquica te protege (escudo del 30%) y Mew copia la Ultimate de otro miembro de la Liga al azar; con Madurez, dos y luego tres seguidas.`,
        ),
      ],
      type: `psychic`,
      cls: `special`,
      dur: [3.6],
      tint: 16751328,
      cast(e) {
        let t = e.run,
          n = t.player;
        ((n.shield = Math.max(n.shield, n.maxHp * 0.3)),
          t.vfx.add.spawn({
            x: e.x,
            y: e.y + 1,
            z: e.z,
            life: 1.2,
            size: 2.5,
            endSize: 4,
            color: 16751328,
            shape: I.Ring,
            glow: 0.2,
          }),
          Sh(t, e.x, e.y + 1.5, e.z, 16759024, 16, 4),
          J.chord(t.audio, [523, 659, 784], 0.04));
        let r = Object.keys(Uh)
            .map(Number)
            .filter((e) => e !== 151),
          i = 1 + e.tier;
        for (let a = 0; a < i; a++)
          t.later(0.3 + a * 1.1, () => {
            let i = Uh[F.pick(r)],
              a = n.pos;
            if (!i) return;
            let o = Math.min(e.tier, i.names.length - 1);
            (t.ui.toast(c(`Mew copia: {name}`, { name: i.names[o] }), null),
              Th(t, a.x, a.y, a.z, 1.6, 16751328, 16769272, 0.4, 14),
              i.cast({ ...e, x: a.x, y: a.y, z: a.z, form: o, type: i.type, cls: i.cls }));
          });
      },
    },
  },
  H = Math.PI * 2,
  U = (e, t, n) => e.terrain.height(t, n),
  gh = (e, t) => e[Math.min(t, e.length - 1)];
function W(e, t, n, r) {
  let i = 0;
  e.animate(
    t,
    (e) => {
      let r = e * t,
        a = r - i;
      ((i = r), n(r, a, e));
    },
    r,
  );
}
function _h(e, t, n, r, i, a, o, s, c, l = c * 0.35, u = 2, shape = I.PixFlame, fireSpecies=e.player?.speciesId) {
  const particle={
    x: t,
    y: n,
    z: r,
    vx: i,
    vy: a,
    vz: o,
    life: s,
    size: c,
    endSize: l,
    color: 16777215,
    endColor: 14707274,
    shape,
    drag: u,
    rot: F.range(-0.15, 0.15),
  };
  if(shape===STAMPEDE_FLAME)e.vfx.crafted.stampedeArt().emit(particle,fireSpecies);
  else e.vfx.norm.spawn(particle);
}
function vh(e, t, n, r, i, a = 9075316, o = 0.9) {
  e.vfx.norm.spawn({
    x: t + F.range(-0.4, 0.4),
    y: n,
    z: r + F.range(-0.4, 0.4),
    vx: F.range(-0.6, 0.6),
    vy: F.range(1.2, 2.4),
    vz: F.range(-0.6, 0.6),
    life: o,
    size: i * 0.6,
    endSize: i * 1.5,
    color: a,
    endColor: 6972002,
    shape: I.PixPuff,
    drag: 1.5,
  });
}
function yh(e, t, n, r, i, a, o = 16747050, s = 0.6) {
  for (let c = 0; c < i; c++) {
    let i = F.range(0, H),
      c = a * F.range(0.4, 1);
    e.vfx.add.spawn({
      x: t,
      y: n,
      z: r,
      vx: Math.cos(i) * c,
      vy: F.range(2, 6),
      vz: Math.sin(i) * c,
      gravity: 7,
      drag: 1.5,
      life: s * F.range(0.6, 1.2),
      size: 0.17,
      endSize: 0.06,
      color: o,
      shape: I.Square,
      glow: 0.15,
    });
  }
}
function bh(e, t, n, r, i, a, o = I.PixRock, s = 0.5, c = 16777215) {
  for (let l = 0; l < i; l++) {
    let i = F.range(0, H),
      l = a * F.range(0.4, 1);
    e.vfx.norm.spawn({
      x: t,
      y: n + 0.3,
      z: r,
      vx: Math.cos(i) * l,
      vy: F.range(5, 10),
      vz: Math.sin(i) * l,
      gravity: 24,
      life: F.range(0.6, 0.95),
      size: s * F.range(0.7, 1.3),
      endSize: s * 0.6,
      color: c,
      shape: o,
      spin: F.range(-8, 8),
    });
  }
}
function xh(e, t, n, r, i, a, o, s = 0.7, c = 0.6, l = 0, u = 16777215, d = 1.5) {
  for (let f = 0; f < a; f++) {
    let p = (f / a) * H + F.range(-0.15, 0.15),
      m = o * F.range(0.8, 1.1);
    e.vfx.norm.spawn({
      x: t,
      y: n,
      z: r,
      vx: Math.cos(p) * m - Math.sin(p) * l,
      vy: F.range(0, d),
      vz: Math.sin(p) * m + Math.cos(p) * l,
      life: c,
      size: s,
      endSize: s * 0.5,
      color: u,
      shape: i,
      drag: 2.2,
      spin: F.range(-5, 5),
    });
  }
}
function Sh(e, t, n, r, i, a, o, s = I.Twinkle, c = 0.5, l = 0.5) {
  for (let u = 0; u < a; u++) {
    let a = F.range(0, H),
      u = o * F.range(0.5, 1);
    e.vfx.add.spawn({
      x: t,
      y: n,
      z: r,
      vx: Math.cos(a) * u,
      vy: F.range(0, 3),
      vz: Math.sin(a) * u,
      drag: 2.5,
      life: l,
      size: c,
      endSize: 0,
      color: i,
      shape: s,
      glow: 0.3,
      spin: F.range(-5, 5),
    });
  }
}
function G(e, t, n, r, i, a = 16777215, o = 2, s = F.range(0, H)) {
  gp(e, t, n, r, a, i, o, s, 0.09);
}
function Ch(e, t, n, r, i, a = 0.9, o = 6, s = 16777215) {
  e.vfx.norm.spawn({
    x: t,
    y: U(e, t, n) + i * 0.4,
    z: n,
    vy: o,
    drag: 7,
    life: a,
    size: i * 0.8,
    endSize: i,
    color: s,
    shape: r,
    rot: F.range(-0.25, 0.25),
  });
}
function wh(e, t, n, r, i, a, o, s = 0.3, c = 0, l = 16777215) {
  e.vfx.norm.spawn({ x: t, y: n, z: r, life: s, size: a, endSize: o, color: l, shape: i, rot: c });
}
function K(e, t, n, r, i, a, o = 3, s = 0.08, c) {
  for (let l = 0; l < o; l++)
    e.later(l * s, () =>
      e.vfx.ring(t, n, r, i * (0.55 + (l / Math.max(1, o - 1)) * 0.5), a[l % a.length], 0.5, 0.12, c),
    );
}
function Th(e, t, n, r, i, a, o, s = 0.35, c = 26) {
  (e.vfx.beams.spawn(t, n + c, r, t, n, r, i, a, s, 0.75),
    e.vfx.beams.spawn(t, n + c, r, t, n, r, i * 0.4, o, s * 0.8, 0.9));
}
function Eh(e, t, n, r, i, a, o, s = 24, c = 6, l = 0) {
  let u = e.r.camera.position,
    d = t - u.x,
    f = r - u.z,
    p = Math.hypot(d, f) || 1,
    m = d / p,
    h = f / p,
    g = t + m * c - h * c * 0.5,
    _ = r + h * c + m * c * 0.5,
    v = n + s;
  (e.vfx.norm.spawn({
    x: g,
    y: v,
    z: _,
    vx: (t - g) / i,
    vy: (n - v) / i,
    vz: (r - _) / i,
    life: i,
    size: o,
    endSize: o * 1.1,
    color: 16777215,
    shape: a,
    spin: 4,
  }),
    l &&
      e.vfx.add.spawn({
        x: g,
        y: v,
        z: _,
        vx: (t - g) / i,
        vy: (n - v) / i,
        vz: (r - _) / i,
        life: i,
        size: o * 1.3,
        endSize: o * 1.4,
        color: l,
        shape: I.Soft,
        glow: 0,
      }));
}
function Dh(e, t, n, r = {}) {
  e.run.combat.hit(t, e.dmg * n, { type: e.type, cls: e.cls, slot: 8, knock: 2, ...e.base, ...r });
}
function q(e, t, n, r, i, a = {}) {
  for (let o of e.run.enemies.within(t, n, r)) Dh(e, o, i, a);
}
function Oh(e, t, n, r, i, a, o = {}) {
  let s = e.run.enemies;
  for (let c of s.within(n, r, i)) {
    let n = c * 4096 + (s.gen[c] & 4095);
    t.has(n) || (t.add(n), Dh(e, c, a, o));
  }
}
function castStarterFireRing(ctx, x, y, z) {
  const {run} = ctx, enemies = run.enemies;
  const radius = 12 * ctx.R, duration = .6;
  const hit = new Map(), candidates = [];
  const specialFlags = (SPECIAL_ACTORS & ~R.Remote) | R.Elite;
  let previousRadius = 0;
  run.vfx.crafted.fireFamily.ring(x, y, z, radius, duration, 1);
  run.animate(duration, progress => {
    const outer = radius * fireRingGrowth(progress);
    // Sweep from the previous rim so a slow frame cannot jump over a target.
    const inner = previousRadius * .85;
    for (const id of enemies.within(x, z, outer, candidates)) {
      if (hit.get(id) === enemies.gen[id]) continue;
      if (Math.hypot(enemies.x[id] - x, enemies.z[id] - z) + enemies.radius[id] < inner) continue;
      hit.set(id, enemies.gen[id]);
      Dh(ctx, id, enemies.flags[id] & specialFlags ? 1.3 : 4, {status:'burn', statusChance:.9, knock:4});
    }
    previousRadius = outer;
  });
}
function kh(e, t, n, r, i) {
  let a = e.enemies;
  for (let e of a.within(t, n, r)) {
    let r = t - a.x[e],
      o = n - a.z[e],
      s = Math.hypot(r, o) || 1,
      c = a.flags[e] & (R.Boss | R.Summoner) ? 0.08 : a.flags[e] & 12290 ? 0.35 : 1;
    s > 0.8 && ((a.kx[e] += (r / s) * i * c), (a.kz[e] += (o / s) * i * c));
  }
}
function Ah(e, t, n, r, i) {
  let a = e.enemies;
  return a
    .within(t, n, r)
    .filter((e) => a.isAlive(e))
    .map((e) => ({ j: e, d: Math.hypot(a.x[e] - t, a.z[e] - n) * F.range(0.8, 1.2) }))
    .sort((e, t) => e.d - t.d)
    .slice(0, i)
    .map((e) => e.j);
}
function jh(e, t, n, r, i, a) {
  let o = e.enemies,
    s = i[a % Math.max(1, i.length)];
  if (s != null && o.isAlive(s)) return { x: o.x[s] + F.range(-0.6, 0.6), z: o.z[s] + F.range(-0.6, 0.6) };
  let c = F.range(0, H),
    l = F.range(3, r);
  return { x: t + Math.cos(c) * l, z: n + Math.sin(c) * l };
}
function Mh(e, t, n, r, i) {
  let a = e.run,
    o = i.step ?? 1.5,
    s = i.speed ?? 24,
    c = Math.max(2, Math.ceil(i.len / o)),
    l = new Set(),
    u = t,
    d = n,
    f = r;
  for (let t = 1; t <= c; t++) {
    f = r + (f - r) * 0.6 + F.range(-0.55, 0.55);
    let n = u,
      p = d,
      m = u + Math.cos(f) * o,
      h = d + Math.sin(f) * o,
      g = f,
      _ = t / c;
    (a.later((t * o) / s, () => {
      if (!a.terrain.inBounds(m, h, 1)) return;
      let t = U(a, n, p),
        r = U(a, m, h);
      if(i.authoredFire&&Math.round(_*c)%2===0)a.vfx.crafted.fireFamily.crack((n+m)/2,(t+r)/2,(p+h)/2,o*2);
      (!i.authoredFire&&a.vfx.groundN.spawn({
        x: (n + m) / 2,
        y: (t + r) / 2 + 0.09,
        z: (p + h) / 2,
        life: i.life ?? 2.6,
        size: o * 1.7,
        endSize: o * 1.7,
        color: 16777215,
        shape: I.PixCrack,
        rot: g + F.range(-0.3, 0.3),
      }),
        !i.authoredFire && i.glow != null &&
          a.vfx.beams.spawn(n, t + 0.16, p, m, r + 0.16, h, 0.2, i.glow, (i.life ?? 2.6) * 0.6, 0.85),
        i.erupt?.(m, r, h, _),
        Oh(e, l, m, h, (i.width ?? 1.9) * e.R, i.mul ?? 1, i.o));
    }),
      (u = m),
      (d = h));
  }
}
function Nh(e, t, n, r, i, a = F.range(0, H)) {
  for (let o = 0; o < r; o++) Mh(e, t, n, a + (o / r) * H + F.range(-0.15, 0.15), i);
}
function Ph(e, t, n, r, i, a, o = 30) {
  let s = e.run,
    c = new Set(),
    l = e.x,
    u = e.z;
  W(s, n, (d) => {
    let f = 1 + (t - 1) * (d / n);
    for (let t of s.enemies.within(l, u, f + 0.8))
      Math.hypot(s.enemies.x[t] - l, s.enemies.z[t] - u) > f - 2.2 &&
        Oh(e, c, s.enemies.x[t], s.enemies.z[t], 0.05, r, i);
    if (Math.random() < 0.7)
      for (let e = 0; e < Math.ceil(o / 10); e++) {
        let e = F.range(0, H),
          t = l + Math.cos(e) * f,
          n = u + Math.sin(e) * f;
        a(t, U(s, t, n), n, e, f);
      }
  });
}
function Fh(e, t, n, r, i, a) {
  let o = e.run,
    s = 0;
  W(o, t, (t, c) => {
    for (s -= c; s <= 0; ) {
      s += n;
      let t = o.player.pos,
        c = Ah(o, t.x, t.z, r * e.R, 6),
        l = jh(o, t.x, t.z, r, c, Math.floor(F.range(0, 6))),
        u = U(o, l.x, l.z);
      (o.vfx.lightning(l.x + F.range(-1.5, 1.5), u + 30, l.z, l.x, u, l.z, a[0], 0.6, 10, 0.24),
        o.vfx.lightning(l.x, u + 30, l.z, l.x, u, l.z, a[1], 0.2, 8, 0.18),
        o.vfx.norm.spawn({
          x: l.x,
          y: u + 1.4,
          z: l.z,
          life: 0.2,
          size: 2.4,
          endSize: 1.6,
          color: 16777215,
          shape: I.PixBolt,
        }),
        G(o, l.x, l.z, 2.4, I.PixCrack, 16777215, 1.6),
        Sh(o, l.x, u + 0.5, l.z, a[0], 6, 6, I.Bolt, 0.5, 0.3),
        q(e, l.x, l.z, 2.6 * e.R, i, { status: `paralysis`, statusChance: 0.5, knock: 1 }),
        o.shake(0.06, l.x, l.z),
        J.zap(o.audio));
    }
  });
}
function Ih(e, t, n, r, i, a, o) {
  let s = e.run;
  for (let c = 0; c < t; c++)
    s.later((c / t) * n, () => {
      let n = s.player.pos,
        l = Ah(s, n.x, n.z, r * e.R, t),
        u = jh(s, n.x, n.z, r, l, c),
        d = U(s, u.x, u.z);
      (a(u.x, d, u.z, i), s.later(i, () => o(u.x, U(s, u.x, u.z), u.z)));
    });
}
function Lh(e, t, n, r, i, a, o, s = {}, artRadius = o, openingVortex = false) {
  let c = e.run,
    l = e.x,
    u = e.z,
    d = new Map(),
    f = 0;
  const rate=windTornadoRate(c.player.speciesId),wind=rate>1,targets=[];
  let previous=windTornadoPosition(l,u,t,n,r,0,i,c.terrain.arenaR,openingVortex);
  W(c, i/rate, (p, m) => {
    const position=windTornadoPosition(l,u,t,n,r,p*rate,i,c.terrain.arenaR,openingVortex);
    const {x:v,z:y,progress:h}=position;
    let S = U(c, v, y);
    if (openingVortex) c.vfx.crafted.openingVortex(d,v,S+.12,y,artRadius*1.05,artRadius*3.4,h);
    else if([16,17,18,58,59].includes(c.player.speciesId)) c.vfx.crafted.windSkillArt().track(d,'typhoon',v,S+.12,y,artRadius*4.6);
    else c.vfx.crafted.tornado(d,v,S+.12,y,artRadius*1.05,artRadius*3.4,'flying');
    kh(c, v, y, (5 * e.R * o) / 2, 30 * m * rate);
    f -= m;
    if (wind || openingVortex || f <= 0) {
      f = 0.16;
      const radius=(2.2*e.R*o)/2;
      const contacts=wind?sweptWindTargets(c.enemies,previous.x,previous.z,v,y,radius,targets):c.enemies.within(v,y,radius);
      for(const target of contacts){
        const key=target*4096+(c.enemies.gen[target]&4095);
        if(p-(d.get(key)??-9)<.3/rate)continue;
        d.set(key,p);
        Dh(e,target,a,{knock:wind?1.2:.4,silent:wind?false:Math.random()<.5,...s,windTornado:wind});
      }
    }
    previous=position;
  });
}
var Rh = class {
    run;
    list = [];
    constructor(e) {
      this.run = e;
    }
    add(e, t, n, r, i, a) {
      let o = this.run.player.pos;
      this.run.sprites.get(e);
      for (let s = 0; s < t; s++) {
        let c = (s / t) * H;
        this.list.push({
          sp: e,
          x: o.x + Math.cos(c) * 2,
          y: o.y + 1,
          z: o.z + Math.sin(c) * 2,
          fx: 1,
          fz: 0,
          age: 0,
          life: n,
          scale: r,
          st: 0,
          t: 0,
          ang: c,
          wait: 0.25 + s * 0.08,
          fromX: 0,
          fromY: 0,
          fromZ: 0,
          toX: 0,
          toY: 0,
          toZ: 0,
          land: i,
          trail: a,
        });
      }
    }
    update(e) {
      let t = this.run,
        n = t.enemies,
        r = t.player.pos;
      for (let i = this.list.length - 1; i >= 0; i--) {
        let a = this.list[i];
        if (((a.age += e), a.age >= a.life && a.st === 0)) {
          this.list.splice(i, 1);
          continue;
        }
        let o = a.x,
          s = a.z;
        if (a.st === 0) {
          a.ang += e * 1.8;
          let o = 3.2 + (i % 3) * 0.8,
            s = r.x + Math.cos(a.ang) * o,
            c = r.z + Math.sin(a.ang) * o,
            l = r.y + 4.2 + Math.sin(a.age * 3 + i) * 0.4,
            u = Math.min(1, e * 6);
          if (
            ((a.x += (s - a.x) * u),
            (a.y += (l - a.y) * u),
            (a.z += (c - a.z) * u),
            (a.wait -= e),
            a.wait <= 0 && a.age < a.life - 0.5)
          ) {
            let e = Ah(t, r.x, r.z, 18, 8),
              i = e.length ? F.pick(e) : -1;
            i >= 0
              ? ((a.st = 1),
                (a.t = 0),
                (a.fromX = a.x),
                (a.fromY = a.y),
                (a.fromZ = a.z),
                (a.toX = n.x[i]),
                (a.toY = n.y[i] + 0.4),
                (a.toZ = n.z[i]))
              : (a.wait = 0.2);
          }
        } else if (a.st === 1) {
          a.t += e;
          let t = Math.min(1, a.t / 0.26),
            n = t * t;
          ((a.x = a.fromX + (a.toX - a.fromX) * n),
            (a.y = a.fromY + (a.toY - a.fromY) * n),
            (a.z = a.fromZ + (a.toZ - a.fromZ) * n),
            a.trail?.(a.x, a.y + 0.6, a.z),
            t >= 1 &&
              (a.land(a.toX, a.toY, a.toZ),
              (a.st = 2),
              (a.t = 0),
              (a.fromX = a.x),
              (a.fromY = a.y),
              (a.fromZ = a.z)));
        } else {
          a.t += e;
          let t = Math.min(1, a.t / 0.35);
          ((a.y = a.fromY + t * 3.5),
            (a.x = a.fromX + (r.x - a.fromX) * t * 0.3),
            (a.z = a.fromZ + (r.z - a.fromZ) * t * 0.3),
            t >= 1 && ((a.st = 0), (a.wait = F.range(0.12, 0.35))));
        }
        let c = a.x - o,
          l = a.z - s,
          u = Math.hypot(c, l);
        u > 0.01 && ((a.fx = c / u), (a.fz = l / u));
      }
    }
    render() {
      let e = this.run;
      for (let t of this.list) {
        let n =
          t.age < 0.25
            ? 1 - t.age / 0.25
            : t.age > t.life - 0.3
              ? Math.min(1, (t.age - (t.life - 0.3)) / 0.3)
              : 0;
        (e.sprites
          .get(t.sp)
          .push(
            t.x,
            t.y,
            t.z,
            t.st === 1 ? `attack` : `walk`,
            t.age,
            e.sprites.dirRow(t.fx, t.fz),
            t.scale,
            t.st === 1 ? 0.35 : 0.1,
            n,
            0,
            0,
            1,
            1,
            1,
            0,
            !1,
          ),
          e.sprites.shadows.push(t.x, e.terrain.surface(t.x, t.z), t.z, 1.1 * t.scale));
      }
    }
    clear() {
      this.list.length = 0;
    }
  },
  zh = class {
    run;
    list = [];
    constructor(e) {
      this.run = e;
    }
    add(e, t, n, r = 0.8, i = 1) {
      let a = this.run.player.pos,
        o = a.x - t,
        s = a.z - n,
        c = Math.hypot(o, s) || 1;
      (this.run.sprites.get(e),
        this.list.push({ sp: e, x: t, z: n, fx: -o / c, fz: -s / c, age: 0, life: r, scale: i }));
    }
    update(e) {
      for (let t = this.list.length - 1; t >= 0; t--)
        (this.list[t].age += e) >= this.list[t].life && this.list.splice(t, 1);
    }
    render() {
      let e = this.run;
      for (let t of this.list) {
        let n = Math.min(1, t.age / 0.18),
          r = Math.min(1, Math.max(0, (t.life - t.age) / 0.22)),
          i = Math.min(n, r),
          a = e.terrain.height(t.x, t.z) - (1 - i) * 1.3 * t.scale;
        e.sprites
          .get(t.sp)
          .push(
            t.x,
            a,
            t.z,
            `attack`,
            Math.min(1, t.age / (t.life * 0.7)),
            e.sprites.dirRow(t.fx, t.fz),
            t.scale,
            0.1,
            1 - i,
            0,
            0,
            1,
            1,
            1,
            0,
            !0,
          );
      }
    }
    clear() {
      this.list.length = 0;
    }
  };
function Bh(e, t, n, r, i, a, o, s, c, l, u, d = 8) {
  let f = i - t,
    p = o - r,
    m = Math.hypot(f, p) || 1,
    h = -p / m,
    g = f / m,
    _ = t,
    v = n,
    y = r;
  for (let i = 1; i <= d; i++) {
    let o = i / d,
      m = Math.sin(o * Math.PI) * s,
      b = t + f * o + h * m,
      x = n + (a - n) * o + Math.sin(o * Math.PI) * Math.abs(s) * 0.5,
      S = r + p * o + g * m;
    (e.vfx.beams.spawn(_, v, y, b, x, S, c * (1 - o * 0.45), l[i % l.length], u), (_ = b), (v = x), (y = S));
  }
}
function Vh(e, t, n) {
  let r = e.player,
    i = e.enemies,
    a = r.pos.x,
    o = r.pos.z,
    s = i.x[t] - a,
    c = i.z[t] - o,
    l = Math.hypot(s, c) || 1,
    u = i.x[t] - (s / l) * 1.1,
    d = i.z[t] - (c / l) * 1.1;
  (e.ghostDash(a, r.pos.y, o, s / l, c / l, Math.max(0.5, l - 1.1), n),
    e.terrain.inBounds(u, d, 3) &&
      !e.terrain.inWater(u, d) &&
      ((r.pos.x = u), (r.pos.z = d), (r.pos.y = U(e, u, d)), r.vel.set(0, 0, 0), (r.kx = r.kz = 0)),
    r.facing.set(s / l, c / l));
}
function Hh(e, t, n) {
  let r = e.enemies,
    i = e.player.pos,
    a = -1,
    o = t * t;
  for (let e of r.within(i.x, i.z, t)) {
    if (!r.isAlive(e) || n.has(e)) continue;
    let t = (r.x[e] - i.x) ** 2 + (r.z[e] - i.z) ** 2;
    t < o && ((o = t), (a = e));
  }
  return a;
}
var J = {
    start(e) {
      (e.kt(110, 0.5, { w: `triangle`, lp: 1200, to: 2.6, v: 0.09, a: 0.45 }),
        e.kn(0.5, { f: 260, to: 5, q: 2.5, v: 0.1, a: 0.45 }),
        e.kt(55, 0.7, { to: 0.6, v: 0.2, d: 0.45, a: 0.003 }),
        e.kn(0.6, { ft: `lowpass`, f: 1200, to: 0.15, v: 0.2, d: 0.45 }));
    },
    boom(e, t = 1, n = 0) {
      (e.kt(64, 0.4 + t * 0.4, { to: 0.4, v: 0.24 * t + 0.08, d: n, a: 0.003 }),
        e.kn(0.45 + t * 0.5, { ft: `lowpass`, f: 1400, to: 0.12, v: 0.22 * t + 0.08, d: n }));
    },
    rumble(e, t, n = 0.2, r = 0) {
      (e.kn(t, { ft: `lowpass`, f: 300, to: 0.5, v: n, d: r, a: 0.04 }),
        e.kt(44, t, { to: 0.8, v: n * 0.9, d: r, a: 0.05 }));
    },
    zap(e) {
      (e.kt(96, 0.2, { w: `sawtooth`, lp: 1400, v: 0.08, vib: [33, 0.3], a: 0.004 }),
        e.kn(0.06, { f: 2200, q: 1.5, v: 0.06, a: 0.001 }));
    },
    whoosh(e, t = 0.6, n = 0.14, r = 350) {
      e.kn(t, { f: r, to: 2.6, q: 2, v: n, a: t * 0.4 });
    },
    chord(e, t, n = 0.05, r = 0, i = 1.2) {
      t.forEach((t, a) => e.kt(t, i, { w: `triangle`, v: n, d: r + a * 0.03, a: 0.05 }));
    },
    fire(e, t = 0.8, n = 0.18) {
      (e.kn(t, { ft: `lowpass`, f: 2200, to: 0.2, v: n, a: 0.05 }),
        e.kt(70, t, { w: `sawtooth`, lp: 380, v: n * 0.4, a: 0.06 }));
    },
    water(e, t = 0.8, n = 0.18) {
      (e.kn(t, { f: 900, to: 0.6, q: 0.7, v: n, a: 0.05 }), e.kt(180, 0.2, { to: 2, v: 0.08, sl: 0.15 }));
    },
    goo(e, t = 0.14, n = 0) {
      (e.kt(150, 0.2, { to: 1.7, v: t, d: n }), e.kn(0.2, { ft: `lowpass`, f: 650, v: t * 0.8, d: n }));
    },
    sparkle(e, t = 0) {
      [523, 659, 784, 1047].forEach((n, r) => e.kt(n, 0.4, { v: 0.035, d: t + r * 0.06, a: 0.01 }));
    },
  },
  Y = {
    leaf: 8050762,
    sun: 16773792,
    fire: 16747050,
    magma: 16738842,
    water: 4892927,
    foam: 15267583,
    volt: 16769594,
    poison: 11553504,
    sand: 14203e3,
    fairy: 16751320,
    moon: 16773280,
    bug: 12116042,
    air: 13166847,
    white: 16777215,
  },
  Uh = {
    1: {
      names: [c(`Raíces Furiosas`), c(`Planta Feroz`), c(`Gigalátigo Floral`)],
      descs: [
        c(`Seis raíces espinosas revientan el suelo en estrella y enraízan todo lo que cruzan.`),
        c(`Ocho raíces y un rayo de sol que te cura un 20% mientras las esporas duermen a los cercanos.`),
        c(`Diez raíces, el sol y una flor gigante que se abre a tu alrededor en tres oleadas de pétalos.`),
      ],
      type: `grass`,
      cls: `special`,
      dur: [1.6, 2, 2.6],
      tint: 7002186,
      cast(e) {
        let t = e.run,
          n = [6, 8, 10][e.tier];
        if (
          (Nh(e, e.x, e.z, n, {
            len: [12, 15, 17][e.tier] * e.R,
            mul: 1.1,
            o: { status: `root`, statusChance: 0.9, knock: 1 },
            erupt: (e, n, r, i) => {
              (Ch(t, e, r, I.PixRoot, 2.2 - i * 0.6, 1.1, 7),
                Math.random() < 0.5 &&
                  t.vfx.norm.spawn({
                    x: e,
                    y: U(t, e, r) + 1.4,
                    z: r,
                    vx: F.range(-2, 2),
                    vy: F.range(2, 4),
                    vz: F.range(-2, 2),
                    gravity: 3,
                    drag: 1.5,
                    life: 0.9,
                    size: 0.55,
                    endSize: 0.45,
                    color: 16777215,
                    shape: I.PixLeaf,
                    spin: 5,
                  }));
            },
          }),
          J.rumble(t.audio, 1.2, 0.18),
          e.tier >= 1 &&
            t.later(0.35, () => {
              let n = t.player.pos;
              (Th(t, n.x, n.y, n.z, 2.4, 10157914, Y.sun, 0.9),
                Sh(t, n.x, n.y + 1.5, n.z, Y.sun, 18, 5),
                t.player.heal(t.player.maxHp * 0.2));
              for (let e = 0; e < 40; e++) {
                let r = F.range(0, H),
                  i = F.range(3, 9);
                t.vfx.norm.spawn({
                  x: n.x,
                  y: n.y + 1,
                  z: n.z,
                  vx: Math.cos(r) * i,
                  vy: F.range(0.5, 2),
                  vz: Math.sin(r) * i,
                  drag: 1.2,
                  gravity: 0.6,
                  life: 1.4,
                  size: 0.3,
                  endSize: 0.55,
                  color: e % 2 ? 11072708 : 13286655,
                  shape: I.PixSpore,
                  spin: 1.5,
                });
              }
              (q(e, n.x, n.z, 9 * e.R, 0.3, { status: `sleep`, statusChance: 0.6, knock: 0 }),
                J.chord(t.audio, [392, 494, 587]));
            }),
          e.tier >= 2)
        )
          for (let n = 0; n < 3; n++)
            t.later(0.7 + n * 0.32, () => {
              let r = t.player.pos,
                i = (9 + n * 3) * e.R;
              (xh(t, r.x, r.y + 0.8, r.z, I.PixPetal, 26, i * 2, 0.8, 0.6, i * 1.2),
                K(t, r.x, r.y, r.z, i, [16751312, Y.leaf], 2, 0.07, L.Petals),
                q(e, r.x, r.z, i, 0.9, { knock: 3 }),
                J.whoosh(t.audio, 0.4, 0.1, 500),
                n === 2 && (wh(t, r.x, r.y + 2.5, r.z, I.PixPetal, 2, 5, 0.6), t.shake(0.25)));
            });
      },
    },
    4: {
      names: [c(`Llamarada Ascendente`), c(`Anillo Ígneo`), c(`Gigallamarada`)],
      descs: [
        c(`Una columna de fuego te envuelve y estalla en un anillo que quema y deja el suelo ardiendo.`),
        c(`Tres anillos de fuego y seis grietas de magma que escupen llamas.`),
        c(
          `Llueven catorce bolas de fuego sobre los enemigos y todo acaba en una explosión enorme con grietas de magma.`,
        ),
      ],
      type: `fire`,
      cls: `special`,
      dur: [1.2, 1.8, 3],
      tint: 16738858,
      cast(e) {
        const t=e.run, art=t.vfx.crafted.fireFamily, n=e.x, i=e.z;
        J.fire(t.audio,1,.2);
        const rings=e.tier>=1?3:1;
        for(let index=0;index<rings;index++)t.later(.18+index*.22,()=>{
          const p=t.player.pos, ringRadius=8+index*3, radius=ringRadius*e.R;
          if(e.tier===0)castStarterFireRing(e,p.x,p.y,p.z);
          else {
            art.ring(p.x,p.y,p.z,ringRadius,.6);
            q(e,p.x,p.z,radius,1.3,{status:'burn',statusChance:.9,knock:4});
          }
          for(let j=0;j<8;j++){
            const angle=j/8*H+index, x=p.x+Math.cos(angle)*radius*.6,z=p.z+Math.sin(angle)*radius*.6;
            t.zones.add({x,z,y:U(t,x,z),r:2.2,life:4,tick:.2,dmg:e.dmg*.18,type:'fire',cls:'special',status:'burn',chance:.5,slot:8,color:Y.fire,authoredFire:true});
          }
          t.shake(.18);J.boom(t.audio,.6);
        });
        if(e.tier>=1)Nh(e,n,i,6,{len:13*e.R,glow:Y.magma,mul:.9,o:{status:'burn',statusChance:.8},authoredFire:true});
        if(e.tier>=2){
          Ih(e,14,1.8,16,.55,(x,y,z,delay)=>{
            art.meteor(x,y,z,delay);t.vfx.telegraph(x,y,z,3.4,Y.magma,delay);
          },(x,y,z)=>{
            art.meteorImpact(x,y,z);
            q(e,x,z,3.6*e.R,1.2,{status:'burn',statusChance:.8});
            t.shake(.12,x,z);J.boom(t.audio,.5);
          });
          t.later(2.55,()=>{
            const p=t.player.pos, ringRadius=13, radius=ringRadius*e.R;
            art.finale(p.x,p.y,p.z,ringRadius);
            for(let j=0;j<3;j++)t.later(j*.07,()=>art.ring(p.x,p.y,p.z,ringRadius*(.55+j/2*.5),.5));
            Nh(e,p.x,p.z,8,{len:15*e.R,glow:Y.magma,mul:.6,life:3.5,authoredFire:true});
            q(e,p.x,p.z,radius,2,{status:'burn',statusChance:1,knock:6});
            t.shake(.5);J.boom(t.audio,1.3);J.fire(t.audio,1.2,.2);
          });
        }
      },
    },
    7: {
      names: [c(`Torbellino Caparazón`), c(`Maremoto`), c(`Hidrocañón`)],
      descs: [
        c(
          `Giras dentro del caparazón: un remolino arrastra a los cercanos, los golpea sin parar y acaba en una ola.`,
        ),
        c(`Una ola gigante sale de ti en círculo, arrastra a todos y deja lluvia.`),
        c(`Una ola y dos cañones de agua que barren 360° a tu alrededor.`),
      ],
      type: `water`,
      cls: `special`,
      dur: [2.4, 1.6, 2.8],
      tint: 4892927,
      cast(e) {
        let t = e.run,
          n = (n, r) => {
            (Ph(
              e,
              n,
              0.9,
              r,
              { status: `wet`, statusChance: 1, knock: 6 },
              (e, n, r, i) => {
                (t.vfx.norm.spawn({
                  x: e,
                  y: n + 0.9,
                  z: r,
                  vx: Math.cos(i) * 4,
                  vy: 0.5,
                  vz: Math.sin(i) * 4,
                  life: 0.3,
                  size: 2.2,
                  endSize: 2.4,
                  color: 16777215,
                  shape: I.PixWave,
                }),
                  t.vfx.norm.spawn({
                    x: e,
                    y: n + 1.6,
                    z: r,
                    vx: Math.cos(i) * 3 + F.range(-1, 1),
                    vy: F.range(3, 6),
                    vz: Math.sin(i) * 3 + F.range(-1, 1),
                    gravity: 16,
                    life: 0.5,
                    size: 0.4,
                    endSize: 0.2,
                    color: 16777215,
                    shape: I.PixDrop,
                  }),
                  Ap(t, e, n + 0.5, r, 1.5, 0.4, Math.cos(i) * 4, 0.6, Math.sin(i) * 4));
              },
              40,
            ),
              t.vfx.ring(e.x, e.y, e.z, n, Y.water, 0.9, 0.08, L.Ripple),
              J.water(t.audio, 1, 0.22));
          };
        if (e.tier === 0) {
          t.vfx.groundN.spawn({
            x: e.x,
            y: U(t, e.x, e.z) + 0.1,
            z: e.z,
            life: 2.3,
            size: 5,
            endSize: 11,
            color: 16777215,
            shape: I.PixWaterSwirl,
            spin: -9,
          });
          let r = 0;
          (W(
            t,
            2.2,
            (n, i) => {
              let a = t.player.pos,
                o = 5 * e.R;
              for (let e = 0; e < 3; e++) {
                let r = n * 10 + (e / 3) * H,
                  i = 1 + ((n * 3) % 1) * o;
                t.vfx.norm.spawn({
                  x: a.x + Math.cos(r) * i,
                  y: a.y + 0.4,
                  z: a.z + Math.sin(r) * i,
                  vx: -Math.sin(r) * 6,
                  vy: 1.5,
                  vz: Math.cos(r) * 6,
                  gravity: 10,
                  life: 0.4,
                  size: 0.45,
                  endSize: 0.2,
                  color: 16777215,
                  shape: I.PixDrop,
                });
              }
              (t.vfx.staticRing(a.x, a.y, a.z, o, Y.water, 0.6, L.Ripple),
                kh(t, a.x, a.z, o + 2, 26 * i),
                (r -= i),
                r <= 0 &&
                  ((r = 0.25),
                  q(e, a.x, a.z, o, 0.32, {
                    status: `wet`,
                    statusChance: 0.6,
                    knock: 0.3,
                    silent: Math.random() < 0.5,
                  })));
            },
            () => n(9 * e.R, 1.4),
          ),
            J.whoosh(t.audio, 2, 0.12, 300));
        } else
          (n((e.tier >= 2 ? 12 : 16) * e.R, 1.8),
            e.tier === 1
              ? t.later(0.9, () => t.setWeather(`rain`, 12))
              : t.later(0.5, () => {
                  let n = 0,
                    r = Math.atan2(e.az, e.ax);
                  (J.water(t.audio, 2.2, 0.16),
                    W(t, 2.2, (i, a) => {
                      let o = t.player.pos,
                        s = 17 * e.R,
                        c = r + (i / 2.2) * H * 1.1;
                      n -= a;
                      for (let r of [0, Math.PI]) {
                        let i = Math.cos(c + r),
                          a = Math.sin(c + r),
                          l = o.x + i * 0.8,
                          u = o.z + a * 0.8,
                          d = o.y + 1;
                        if ((Fp(t, l, d, u, l + i * s, d, u + a * s, 1.6 * e.R, 1.4), n <= 0))
                          for (let n of t.enemies.within(l + i * s * 0.5, u + a * s * 0.5, s * 0.55)) {
                            let r = t.enemies.x[n] - l,
                              o = t.enemies.z[n] - u,
                              c = r * i + o * a;
                            c > 0 &&
                              c < s &&
                              Math.abs(r * a - o * i) < 1.6 * e.R &&
                              Dh(e, n, 0.42, {
                                status: `wet`,
                                statusChance: 0.5,
                                dirX: i,
                                dirZ: a,
                                knock: 1.5,
                                silent: Math.random() < 0.4,
                              });
                          }
                      }
                      (n <= 0 && (n = 0.1), t.shake(0.015));
                    }));
                }));
      },
    },
    10: {
      names: [c(`Red de Seda`), c(`Fortaleza`), c(`Tormenta de Escamas`)],
      descs: [
        c(`Lanzas ocho redes de seda alrededor: atrapan y dañan a quien las pisa durante 4 s.`),
        c(
          `El capullo se endurece: 4 s de invulnerabilidad, un escudo del 40% y ondas que repelen, con un estallido al final.`,
        ),
        c(
          `Una nube de mariposas y escamas de colores duerme, paraliza y envenena en un área enorme y acaba en un vendaval.`,
        ),
      ],
      type: `bug`,
      cls: `special`,
      dur: [1.2, 4, 3.2],
      tint: 13166698,
      preload: [12],
      cast(e) {
        let t = e.run,
          n = (n, r) => {
            for (let i = 0; i < n; i++) {
              let a = (i / n) * H + F.range(-0.2, 0.2),
                o = F.range(r * 0.4, r),
                s = e.x + Math.cos(a) * o,
                c = e.z + Math.sin(a) * o;
              (t.vfx.beams.spawn(e.x, e.y + 1, e.z, s, U(t, s, c) + 0.3, c, 0.08, Y.white, 0.25, 0.8),
                t.later(0.15, () => {
                  t.vfx.groundN.spawn({
                    x: s,
                    y: U(t, s, c) + 0.1,
                    z: c,
                    life: 4,
                    size: 0.5,
                    endSize: 4.6,
                    color: 16777215,
                    shape: I.PixWeb,
                    rot: F.range(0, H),
                  });
                  let n = 0;
                  W(t, 4, (t, r) => {
                    ((n -= r),
                      n <= 0 &&
                        ((n = 0.5),
                        q(e, s, c, 2.3 * e.R, 0.3, {
                          status: `root`,
                          statusChance: 1,
                          knock: 0,
                          silent: !0,
                        })));
                  });
                }));
            }
            J.whoosh(t.audio, 0.4, 0.1, 700);
          };
        if (e.tier === 0) {
          n(8, 10 * e.R);
          return;
        }
        if (e.tier === 1) {
          let n = t.player;
          n.shield = Math.max(n.shield, n.maxHp * 0.4);
          let r = 0;
          W(
            t,
            4,
            (i, a) => {
              let o = n.pos;
              for (let e = 0; e < 2; e++) {
                let n = i * 3 + e * Math.PI;
                t.orbitals.push(
                  o.x + Math.cos(n) * 1.3,
                  o.y + 0.9 + Math.sin(i * 4 + e) * 0.3,
                  o.z + Math.sin(n) * 1.3,
                  0.6,
                  14217344,
                  I.Shard,
                  n,
                  0.3,
                );
              }
              ((r -= a),
                r <= 0 &&
                  ((r = 0.5),
                  t.vfx.ring(o.x, o.y, o.z, 4.5 * e.R, 12116042, 0.35, 0.3),
                  q(e, o.x, o.z, 4.5 * e.R, 0.45, { knock: 4 }),
                  J.boom(t.audio, 0.2)));
            },
            () => {
              let r = n.pos;
              (K(t, r.x, r.y, r.z, 9 * e.R, [12116042, Y.white], 3),
                bh(t, r.x, r.y + 0.5, r.z, 14, 8, I.Shard, 0.5, 14217344),
                q(e, r.x, r.z, 9 * e.R, 2, { knock: 6 }),
                t.shake(0.3),
                J.boom(t.audio, 1));
            },
          );
          return;
        }
        n(6, 8 * e.R);
        let r = [
            [10150132, `sleep`],
            [16771178, `paralysis`],
            [13144319, `poison`],
          ],
          i = 0;
        (W(
          t,
          3,
          (n, a) => {
            let o = t.player.pos,
              s = 14 * e.R;
            for (let e = 0; e < 3; e++) {
              let e = F.range(0, H),
                n = F.range(1, s),
                [i] = F.pick(r);
              t.vfx.norm.spawn({
                x: o.x + Math.cos(e) * n,
                y: o.y + F.range(0.5, 3),
                z: o.z + Math.sin(e) * n,
                vx: F.range(-1, 1),
                vy: F.range(-0.5, 0.5),
                vz: F.range(-1, 1),
                drag: 0.8,
                life: 1.2,
                size: 0.3,
                endSize: 0.6,
                color: i,
                shape: I.PixSpore,
                spin: 2,
              });
            }
            if (Math.random() < 0.5) {
              let e = n * 2 + F.range(0, H),
                r = F.range(2, s * 0.8);
              t.vfx.norm.spawn({
                x: o.x + Math.cos(e) * r,
                y: o.y + F.range(1, 3.5),
                z: o.z + Math.sin(e) * r,
                vx: -Math.sin(e) * 4,
                vy: F.range(-0.5, 1),
                vz: Math.cos(e) * 4,
                life: 1,
                size: 0.9,
                endSize: 0.8,
                color: 16777215,
                shape: I.PixButterfly,
                rot: F.range(-0.3, 0.3),
              });
            }
            if (((i -= a), i <= 0)) {
              i = 0.4;
              let [, t] = F.pick(r);
              q(e, o.x, o.z, s, 0.4, { status: t, statusChance: 0.5, knock: 0, silent: !0 });
            }
          },
          () => {
            let n = t.player.pos,
              r = 14 * e.R;
            (kh(t, n.x, n.z, r, 60),
              K(t, n.x, n.y, n.z, r, [Y.air, Y.white, 13154559], 3, 0.06, L.Ripple),
              xh(t, n.x, n.y + 1, n.z, I.PixButterfly, 16, r * 1.6, 0.9, 0.7, r * 1.5),
              q(e, n.x, n.z, r, 1.5, { knock: 1 }),
              J.whoosh(t.audio, 0.7, 0.16, 300));
          },
        ),
          J.sparkle(t.audio));
      },
    },
    13: {
      names: [c(`Picotazo Venenoso`), c(`Coraza Tóxica`), c(`Enjambre Letal`)],
      descs: [
        c(`Dos coronas de 24 aguijones salen disparadas en todas direcciones y envenenan.`),
        c(`El capullo se endurece con un escudo del 35% y una nube tóxica de 6 m te rodea 4 s.`),
        c(`Ocho Beedrill fantasma vuelan contigo 4 s y se lanzan en picado con sus aguijones.`),
      ],
      type: `poison`,
      cls: `physical`,
      dur: [1, 4, 4.2],
      tint: 11553504,
      preload: [15],
      cast(e) {
        let t = e.run,
          n = (n, r, i) =>
            t.later(r, () => {
              let r = t.player.pos;
              for (let a = 0; a < n; a++) {
                let o = i + (a / n) * H;
                t.projectiles.fire({
                  x: r.x,
                  y: r.y + 0.9,
                  z: r.z,
                  dx: Math.cos(o),
                  dz: Math.sin(o),
                  speed: 26,
                  life: 0.7,
                  radius: 0.5,
                  dmg: e.dmg * 0.65,
                  type: `poison`,
                  cls: `physical`,
                  pierce: 3,
                  status: `poison`,
                  statusChance: 0.8,
                  size: 1.1,
                  shape: I.PixStinger,
                  color: 16777215,
                  slot: 8,
                  knock: 1,
                });
              }
              (t.vfx.ring(r.x, r.y, r.z, 4, Y.poison, 0.3, 0.2), J.whoosh(t.audio, 0.25, 0.12, 900));
            });
        if (e.tier === 0) (n(24, 0, 0), n(24, 0.25, Math.PI / 24));
        else if (e.tier === 1) {
          let r = t.player;
          r.shield = Math.max(r.shield, r.maxHp * 0.35);
          let i = 0;
          (W(t, 4, (n, a) => {
            let o = r.pos,
              s = 6 * e.R;
            for (let e = 0; e < 3; e++) {
              let e = F.range(0, H),
                n = F.range(0.5, s);
              t.vfx.norm.spawn({
                x: o.x + Math.cos(e) * n,
                y: o.y + 0.3,
                z: o.z + Math.sin(e) * n,
                vy: F.range(0.8, 1.6),
                drag: 1,
                life: 0.8,
                size: 0.4,
                endSize: 0.7,
                color: 16777215,
                shape: I.PixToxic,
              });
            }
            (t.vfx.staticRing(o.x, o.y, o.z, s, Y.poison, 0.5),
              (i -= a),
              i <= 0 &&
                ((i = 0.4),
                q(e, o.x, o.z, s, 0.35, { status: `poison`, statusChance: 1, knock: 0.5, silent: !0 })));
          }),
            n(16, 3.9, 0),
            J.goo(t.audio));
        } else
          (n(16, 0, 0),
            t.ult.drones.add(
              15,
              8,
              4,
              0.9,
              (n, r, i) => {
                (wh(t, n, r + 0.6, i, I.PixStinger, 1.2, 1.8, 0.2, F.range(-0.4, 0.4)),
                  t.vfx.ring(n, U(t, n, i), i, 2.2, Y.poison, 0.3, 0.2),
                  bh(t, n, r, i, 3, 3, I.PixToxic, 0.35),
                  q(e, n, i, 2.4 * e.R, 0.75, { status: `poison`, statusChance: 0.9, knock: 2 }),
                  J.goo(t.audio, 0.08));
              },
              (e, n, r) => {
                Math.random() < 0.5 &&
                  t.vfx.add.spawn({
                    x: e,
                    y: n,
                    z: r,
                    life: 0.2,
                    size: 0.3,
                    endSize: 0,
                    color: 14725375,
                    shape: I.Soft,
                    glow: 0.2,
                  });
              },
            ),
            t.cry(15, 0.6));
      },
    },
    16: {
      names: [c(`Remolino`), c(`Tornado`), c(`Huracán`)],
      descs: [
        c(`Un remolino avanza 16 m hacia tu objetivo, arrastrando y golpeando a todo lo que encuentra.`),
        c(`Dos tornados en abanico y una ráfaga de viento que empuja a los cercanos.`),
        c(`Tres tornados y una bandada de Pidgeot que se lanza en picado sobre los enemigos.`),
      ],
      type: `flying`,
      cls: `special`,
      dur: [windOrbitDuration/windTornadoSpeed, 2.2, 3.2],
      tint: 12114160,
      preload: [18],
      cast(e) {
        if(e.run.player.speciesId===16){
          const range=16*e.R,heading=-Math.PI/2-e.run.camYaw;
          for(let i=0;i<3;i++){
            const direction=heading+i*H/3;
            Lh(e,Math.cos(direction),Math.sin(direction),range,windOrbitDuration,.4,1.8,
              {status:'confusion',statusChance:.2},1.8,true);
          }
          J.whoosh(e.run.audio,2,.16,260);
          return;
        }
        let t = e.run,
          n = [1, 2, 3][e.tier],
          r = Math.atan2(e.az, e.ax);
        for (let index = 0; index < n; index++) {
          let i = r + (index - (n - 1) / 2) * 0.55;
          Lh(e, Math.cos(i), Math.sin(i), 16*e.R, 2.2, 0.4, 1.8 + e.tier * 0.35, {
            status: `confusion`,
            statusChance: 0.2,
          }, 1.8);
        }
        if ((J.whoosh(t.audio, 2, 0.16, 260), e.tier >= 1)) {
          (xh(t, e.x, e.y + 1, e.z, I.PixFeather, 24, 14, 0.7, 0.7, 6),
            K(t, e.x, e.y, e.z, 7 * e.R, [Y.air, Y.white], 2, 0.06, L.Ripple));
          for (let n of t.enemies.within(e.x, e.z, 7 * e.R)) {
            let r = t.enemies.x[n] - e.x,
              i = t.enemies.z[n] - e.z,
              a = Math.hypot(r, i) || 1;
            ((t.enemies.kx[n] += (r / a) * 24), (t.enemies.kz[n] += (i / a) * 24));
          }
        }
        e.tier >= 2 &&
          (t.ult.drones.add(
            18,
            5,
            3,
            1,
            (n, r, i) => {
              (t.vfx.ring(n, U(t, n, i), i, 2.8, Y.air, 0.3, 0.2, L.Ripple),
                xh(t, n, r + 0.5, i, I.PixFeather, 8, 7, 0.55, 0.6),
                q(e, n, i, 2.8 * e.R, 1, { knock: 3 }),
                J.whoosh(t.audio, 0.2, 0.08, 700));
            },
            (e, n, r) => t.vfx.beams.spawn(e, n, r, e, n + 1.2, r, 0.12, Y.white, 0.1, 0.6),
          ),
          t.cry(18, 0.6));
      },
    },
    19: {
      names: [c(`Ataque Frenético`), c(`Superdiente Feroz`)],
      descs: [
        c(`Saltas de enemigo en enemigo mordiendo a 7 seguidos, invulnerable mientras dura.`),
        c(
          `Doce mordiscos seguidos; los que quedan por debajo del 30% de PS caen al momento (no los jefes). Acaba con un mordisco que agrieta el suelo.`,
        ),
      ],
      type: `normal`,
      cls: `physical`,
      dur: [1.2, 1.9],
      tint: 11569880,
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = t.player,
          i = e.tier >= 1 ? 12 : 7,
          a = new Set(),
          o = (i) => {
            if (t.state !== `play` && t.state !== `dead`) return;
            let o = -1,
              s = 196;
            for (let e of n.within(r.pos.x, r.pos.z, 14)) {
              if (!n.isAlive(e) || a.has(e)) continue;
              let t = (n.x[e] - r.pos.x) ** 2 + (n.z[e] - r.pos.z) ** 2;
              t < s && ((s = t), (o = e));
            }
            if (o < 0) return;
            a.add(o);
            let c = r.pos.x,
              l = r.pos.z,
              u = n.x[o],
              d = n.z[o],
              f = u - c,
              p = d - l,
              m = Math.hypot(f, p) || 1,
              h = u - (f / m) * 1.1,
              g = d - (p / m) * 1.1;
            (t.ghostDash(c, r.pos.y, l, f / m, p / m, Math.max(0.5, m - 1.1), 14203135),
              t.terrain.inBounds(h, g, 3) &&
                !t.terrain.inWater(h, g) &&
                ((r.pos.x = h), (r.pos.z = g), (r.pos.y = U(t, h, g)), r.vel.set(0, 0, 0), (r.kx = r.kz = 0)),
              r.facing.set(f / m, p / m),
              wh(t, u, n.y[o] + n.hgt[o] * 0.6, d, I.PixFang, 1, 1.7, 0.18),
              Sh(t, u, n.y[o] + 0.8, d, 16769264, 5, 5, I.Star, 0.4, 0.3),
              e.tier >= 1 && !(n.flags[o] & (R.Boss | 12290)) && n.hp[o] < n.maxHp[o] * 0.3
                ? t.combat.hit(o, n.hp[o] + 1, {
                    type: `normal`,
                    cls: `physical`,
                    fixed: !0,
                    slot: 8,
                    knock: 3,
                  })
                : Dh(e, o, 1.3, { knock: 3 }),
              t.audio.kt(160, 0.08, { to: 0.6, v: 0.18 }),
              t.audio.kn(0.04, { f: 900, q: 2, v: 0.12 }),
              t.shake(0.05));
          };
        for (let e = 0; e < i; e++) t.later(e * 0.12, () => o(e));
        e.tier >= 1 &&
          t.later(i * 0.12 + 0.1, () => {
            let n = r.pos;
            (wh(t, n.x, n.y + 1.5, n.z, I.PixFang, 2.2, 4.2, 0.35),
              G(t, n.x, n.z, 6, I.PixCrack, 16777215, 2.2),
              K(t, n.x, n.y, n.z, 7 * e.R, [11569880, Y.white], 2, 0.07, L.Jagged),
              q(e, n.x, n.z, 7 * e.R, 1.6, { knock: 5 }),
              t.shake(0.3),
              J.boom(t.audio, 0.8));
          });
      },
    },
    21: {
      names: [c(`Pico Taladro`), c(`Picotazo Celeste`)],
      descs: [
        c(`Un taladro de viento de 20 m perfora todo lo que hay en línea recta y agrieta el suelo.`),
        c(`El taladro y cinco Fearow que caen en picado desde el cielo.`),
      ],
      type: `flying`,
      cls: `physical`,
      dur: [1, 3],
      tint: 14195290,
      preload: [22],
      cast(e) {
        let t = e.run,
          n = 20 * e.R,
          r = e.ax,
          i = e.az,
          a = new Set();
        t.ghostDash(e.x, e.y, e.z, r, i, n, 16767136);
        for (let o = 0; o <= 16; o++)
          t.later(o * 0.018, () => {
            let s = o / 16,
              c = e.x + r * n * s,
              l = e.z + i * n * s,
              u = U(t, c, l);
            for (let e = 0; e < 3; e++) {
              let n = s * 30 + (e / 3) * H;
              t.vfx.norm.spawn({
                x: c - i * Math.cos(n) * 1.1,
                y: u + 1.2 + Math.sin(n) * 1.1,
                z: l + r * Math.cos(n) * 1.1,
                life: 0.22,
                size: 0.9,
                endSize: 0.5,
                color: 16777215,
                shape: I.PixFeather,
                rot: n,
              });
            }
            (o % 2 == 0 && G(t, c, l, 2.2, I.PixCrack, 16777215, 2, Math.atan2(i, r)),
              Oh(e, a, c, l, 2 * e.R, 2, { dirX: r, dirZ: i, knock: 4 }));
          });
        (t.later(0.3, () => {
          let a = e.x + r * n,
            o = e.z + i * n;
          (bh(t, a, U(t, a, o), o, 10, 6), t.vfx.ring(a, U(t, a, o), o, 3.5, 14195290, 0.35), t.shake(0.2));
        }),
          J.whoosh(t.audio, 0.4, 0.18, 500),
          e.tier >= 1 &&
            (t.ult.drones.add(22, 5, 2.8, 1, (n, r, i) => {
              let a = U(t, n, i);
              for (let e = 0; e < 6; e++) {
                let r = (e / 6) * H;
                t.vfx.beams.spawn(
                  n + Math.cos(r) * 0.8,
                  a + 7,
                  i + Math.sin(r) * 0.8,
                  n + Math.cos(r) * 0.8,
                  a + 2,
                  i + Math.sin(r) * 0.8,
                  0.1,
                  Y.white,
                  0.18,
                );
              }
              (G(t, n, i, 3.4, I.PixCrack, 16777215, 2),
                bh(t, n, a, i, 6, 5),
                t.vfx.ring(n, a, i, 3, 14195290, 0.3, 0.2, L.Jagged),
                q(e, n, i, 3 * e.R, 1.4, { knock: 3 }),
                t.shake(0.08, n, i),
                J.boom(t.audio, 0.35));
            }),
            t.cry(22, 0.6)));
      },
    },
    23: {
      names: [c(`Constricción Letal`), c(`Mirada Venenosa`)],
      descs: [
        c(`Una espiral de veneno arrastra a todos hacia ti y los estruja: daño, veneno y enraizar.`),
        c(`El ojo de Arbok paraliza 3 s a todos en 20 m; luego tres oleadas de lodo y géiseres tóxicos.`),
      ],
      type: `poison`,
      cls: `special`,
      dur: [1.6, 2.6],
      tint: 10510544,
      cast(e) {
        let t = e.run,
          n = (n, r) => {
            W(
              t,
              1.1,
              (e, r) => {
                let i = t.player.pos,
                  a = n * (1 - (e / 1.1) * 0.8);
                for (let n = 0; n < 4; n++) {
                  let r = e * 7 + (n / 4) * H,
                    o = i.x + Math.cos(r) * a,
                    s = i.z + Math.sin(r) * a;
                  t.vfx.norm.spawn({
                    x: o,
                    y: U(t, o, s) + 0.5,
                    z: s,
                    life: 0.25,
                    size: 1.2,
                    endSize: 0.9,
                    color: 16777215,
                    shape: I.PixSludge,
                    rot: r,
                  });
                }
                (t.vfx.staticRing(i.x, i.y, i.z, a, Y.poison, 0.6), kh(t, i.x, i.z, n + 2, 40 * r));
              },
              () => {
                let n = t.player.pos;
                (K(t, n.x, n.y, n.z, 5 * e.R, [Y.poison, 14725375], 2, 0.05),
                  bh(t, n.x, n.y + 0.4, n.z, 12, 6, I.PixToxic, 0.45),
                  q(e, n.x, n.z, 5.5 * e.R, r, { status: `poison`, statusChance: 1, knock: 0.5 }));
                for (let r of t.enemies.within(n.x, n.z, 5.5 * e.R)) t.combat.applyStatus(r, `root`, 1);
                (t.shake(0.25), J.goo(t.audio, 0.2));
              },
            );
          };
        if (e.tier === 0) {
          (n(10 * e.R, 1.9), J.whoosh(t.audio, 1, 0.1, 250));
          return;
        }
        let r = t.player.pos;
        (t.vfx.norm.spawn({
          x: r.x,
          y: r.y + 4.5,
          z: r.z,
          life: 1.2,
          size: 2,
          endSize: 5.5,
          color: 16777215,
          shape: I.PixEye,
        }),
          t.vfx.add.spawn({
            x: r.x,
            y: r.y + 4.5,
            z: r.z,
            life: 0.6,
            size: 4,
            endSize: 9,
            color: 16765498,
            shape: I.Soft,
            glow: 0,
          }));
        for (let n of t.enemies.within(r.x, r.z, 20 * e.R))
          ((t.enemies.para[n] = Math.max(t.enemies.para[n], 3 * (t.enemies.flags[n] & R.Boss ? 0.35 : 1))),
            t.combat.applyStatus(n, `poison`, e.dmg * 0.4));
        t.audio.kt(70, 0.9, { w: `sawtooth`, lp: 500, v: 0.12, vib: [9, 0.06], to: 0.7, a: 0.05 });
        for (let n = 0; n < 3; n++)
          t.later(0.5 + n * 0.35, () => {
            (Ph(
              e,
              (10 + n * 3) * e.R,
              0.6,
              0.9,
              { status: `poison`, statusChance: 0.8, knock: 2.5 },
              (e, n, r, i) =>
                t.vfx.norm.spawn({
                  x: e,
                  y: n + 0.4,
                  z: r,
                  vx: Math.cos(i) * 3,
                  vy: F.range(1, 3),
                  vz: Math.sin(i) * 3,
                  gravity: 10,
                  life: 0.45,
                  size: 1,
                  endSize: 0.7,
                  color: 16777215,
                  shape: I.PixSludge,
                }),
            ),
              J.goo(t.audio, 0.14));
          });
        Ih(
          e,
          8,
          0.8,
          16,
          0.05,
          () => {},
          (n, r, i) => {
            t.later(1.4, () => {
              G(t, n, i, 3, I.PixCrack, 16777215, 2);
              for (let e = 0; e < 8; e++)
                t.vfx.norm.spawn({
                  x: n + F.range(-0.4, 0.4),
                  y: r + 0.5,
                  z: i + F.range(-0.4, 0.4),
                  vy: F.range(6, 11),
                  gravity: 14,
                  life: 0.8,
                  size: 0.7,
                  endSize: 0.5,
                  color: 16777215,
                  shape: I.PixToxic,
                });
              q(e, n, i, 2.8 * e.R, 1.4, { status: `poison`, statusChance: 1, knock: 1 });
            });
          },
        );
      },
    },
    25: {
      names: [c(`Gigatronada`), c(`Voltio Cruel`)],
      descs: [
        c(
          `El cielo se carga: durante 2,4 s caen rayos sin parar sobre los enemigos cercanos y al final tres truenos enormes.`,
        ),
        c(`Cruzas a los enemigos en zigzag envuelto en electricidad y desatas una tormenta aún más larga.`),
      ],
      type: `electric`,
      cls: `special`,
      dur: [2.6, 3.2],
      tint: 16769594,
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = (r) =>
            t.later(r, () => {
              let r = t.player.pos,
                i = Ah(t, r.x, r.z, 16 * e.R, 12)
                  .sort((e, t) => n.hp[t] - n.hp[e])
                  .slice(0, 3);
              for (let r of i) {
                let i = n.x[r],
                  a = n.z[r],
                  o = U(t, i, a);
                for (let e = 0; e < 3; e++)
                  t.vfx.lightning(
                    i + F.range(-2, 2),
                    o + 34,
                    a + F.range(-2, 2),
                    i,
                    o,
                    a,
                    e ? Y.volt : 16775360,
                    e ? 0.7 : 0.25,
                    12,
                    0.3,
                  );
                (t.vfx.flash(i, o + 1, a, Y.volt, 4.5, 0.2), G(t, i, a, 5, I.PixCrack, 16777215, 2.5));
                for (let e = 0; e < 4; e++) {
                  let e = F.range(0, H);
                  t.vfx.lightning(
                    i,
                    o + 0.3,
                    a,
                    i + Math.cos(e) * 4,
                    o + 0.2,
                    a + Math.sin(e) * 4,
                    Y.volt,
                    0.3,
                    5,
                    0.2,
                  );
                }
                q(e, i, a, 4.5 * e.R, 2.2, { status: `paralysis`, statusChance: 1, knock: 3 });
              }
              (t.shake(0.4), J.boom(t.audio, 1));
            });
        if (e.tier === 0) {
          (Fh(e, 2.4, 0.12, 15, 0.75, [Y.volt, 16775360]), r(2.45));
          return;
        }
        let i = t.player,
          a = new Set();
        for (let r = 0; r < 8; r++)
          t.later(r * 0.07, () => {
            let r = Ah(t, i.pos.x, i.pos.z, 12, 6).filter((e) => !a.has(e));
            if (!r.length) return;
            let o = r[0],
              s = i.pos.x,
              c = i.pos.z,
              l = n.x[o],
              u = n.z[o],
              d = l - s,
              f = u - c,
              p = Math.hypot(d, f) || 1;
            (a.add(o),
              t.vfx.lightning(s, i.pos.y + 1, c, l, n.y[o] + 1, u, Y.volt, 0.6, 7, 0.3),
              t.ghostDash(s, i.pos.y, c, d / p, f / p, p, Y.volt));
            let m = l - (d / p) * 1.1,
              h = u - (f / p) * 1.1;
            (t.terrain.inBounds(m, h, 3) &&
              !t.terrain.inWater(m, h) &&
              ((i.pos.x = m), (i.pos.z = h), (i.pos.y = U(t, m, h)), i.vel.set(0, 0, 0)),
              G(t, l, u, 2.4, I.PixCrack, 16777215, 1.6),
              q(e, l, u, 2.6 * e.R, 1.1, { status: `paralysis`, statusChance: 0.8, knock: 3 }),
              J.zap(t.audio));
          });
        (Fh(e, 2.8, 0.09, 17, 0.75, [Y.volt, 16775360]), r(2.9));
      },
    },
    27: {
      names: [c(`Excavar Sísmico`), c(`Fisura Abismal`)],
      descs: [
        c(
          `Te hundes bajo tierra (invisible) y emerges con un temblor que aturde, cuatro grietas y púas de roca.`,
        ),
        c(
          `Ocho grietas de 16 m recorren el suelo levantando púas de roca, y se desata una tormenta de arena.`,
        ),
      ],
      type: `ground`,
      cls: `physical`,
      dur: [1.4, 2.4],
      tint: 14203e3,
      cast(e) {
        let t = e.run,
          n = (e, n, r, i) => {
            (Ch(t, e, r, I.PixSpike, 2.4 - i, 1, 6),
              Math.random() < 0.5 &&
                t.vfx.norm.spawn({
                  x: e,
                  y: U(t, e, r) + 0.4,
                  z: r,
                  vx: F.range(-2, 2),
                  vy: F.range(1, 3),
                  vz: F.range(-2, 2),
                  drag: 2,
                  life: 0.7,
                  size: 1,
                  endSize: 2,
                  color: 15255696,
                  shape: I.PixPuff,
                }));
          };
        if (e.tier === 0) {
          let r = t.player;
          ((r.invisT = Math.max(r.invisT, 0.6)),
            t.vfx.dust(e.x, e.y, e.z, 13150328, 14, 4),
            bh(t, e.x, e.y, e.z, 8, 4, I.PixSand, 0.5),
            t.later(0.6, () => {
              let i = r.pos;
              (K(t, i.x, i.y, i.z, 9 * e.R, [14203e3, 11044954], 3, 0.08, L.Jagged),
                bh(t, i.x, i.y, i.z, 14, 8),
                G(t, i.x, i.z, 7, I.PixCrack, 16777215, 2.5),
                Nh(e, i.x, i.z, 4, {
                  len: 10 * e.R,
                  mul: 0.9,
                  o: { status: `stun`, statusChance: 0.8 },
                  erupt: n,
                }),
                q(e, i.x, i.z, 9 * e.R, 1.9, { status: `stun`, statusChance: 1, knock: 5 }),
                t.shake(0.45),
                J.boom(t.audio, 1.1),
                J.rumble(t.audio, 0.8, 0.2));
            }),
            J.rumble(t.audio, 0.6, 0.12));
        } else {
          for (let n = 0; n < 2; n++)
            t.later(n * 0.08, () => wh(t, e.x, e.y + 1.6, e.z, I.PixClaw, 2.6, 4, 0.3, n ? 0.6 : -0.6));
          (Nh(e, e.x, e.z, 8, {
            len: 16 * e.R,
            mul: 1.6,
            glow: 16767120,
            o: { status: `stun`, statusChance: 0.9, knock: 2 },
            erupt: n,
          }),
            t.later(0.2, () => {
              (q(e, e.x, e.z, 6 * e.R, 1.2, { knock: 5 }),
                K(t, e.x, e.y, e.z, 7 * e.R, [14203e3, 16777215], 2, 0.08, L.Jagged),
                t.shake(0.5));
            }),
            t.later(0.9, () => t.setWeather(`sand`, 12)),
            J.rumble(t.audio, 1.6, 0.24),
            J.boom(t.audio, 0.9, 0.2));
        }
      },
    },
    29: {
      names: [c(`Púas Reales`), c(`Muro Tóxico`), c(`Furia de la Reina`)],
      descs: [
        c(`Siembras 14 púas tóxicas a tu alrededor que estallan al contacto, y ganas un escudo del 20%.`),
        c(`Un anillo de géiseres tóxicos te protege 4 s y ganas un escudo del 30%.`),
        c(
          `Plancha Corporal que agrieta el suelo y aturde, géiseres de Tierra Viva bajo 12 enemigos y un escudo del 40%.`,
        ),
      ],
      type: `poison`,
      cls: `physical`,
      dur: [1, 4, 2.4],
      tint: 6986464,
      cast(e) {
        let t = e.run,
          n = t.player;
        if (
          ((n.shield = Math.max(n.shield, n.maxHp * [0.2, 0.3, 0.4][e.tier])),
          t.vfx.ring(e.x, e.y, e.z, 3, 9091327, 0.5, 0.3),
          e.tier === 0)
        ) {
          for (let n = 0; n < 14; n++) {
            let r = (n / 14) * H + F.range(-0.2, 0.2),
              i = F.range(3, 9) * e.R;
            t.projectiles.fire({
              x: e.x,
              y: e.y + 0.9,
              z: e.z,
              dx: Math.cos(r),
              dz: Math.sin(r),
              speed: i * 4,
              life: 10,
              radius: 1.1,
              dmg: e.dmg * 1.1,
              type: `poison`,
              cls: `physical`,
              flags: em.Mine | em.Explode,
              explodeR: 3 * e.R,
              explosionArtRadius: 3,
              status: `poison`,
              statusChance: 1,
              size: 1.2,
              shape: I.PixStinger,
              color: 16777215,
              slot: 8,
            });
          }
          J.whoosh(t.audio, 0.3, 0.1, 800);
          return;
        }
        let r = (e, n, r = 1) => {
          let i = U(t, e, n);
          for (let a = 0; a < 5; a++)
            t.vfx.norm.spawn({
              x: e + F.range(-0.4, 0.4),
              y: i + 0.4,
              z: n + F.range(-0.4, 0.4),
              vy: F.range(7, 12) * r,
              gravity: 14,
              life: 0.8,
              size: 0.8 * r,
              endSize: 0.5,
              color: 16777215,
              shape: a % 2 ? I.PixToxic : I.PixSludge,
            });
        };
        if (e.tier === 1) {
          let i = 0;
          (W(t, 4, (a, o) => {
            let s = n.pos,
              c = 6 * e.R;
            for (let e = 0; e < 2; e++) {
              let e = a * 1.5 + F.range(0, H);
              r(s.x + Math.cos(e) * c, s.z + Math.sin(e) * c, 0.7);
            }
            if ((t.vfx.staticRing(s.x, s.y, s.z, c, 9067224, 0.7), (i -= o), i <= 0)) {
              i = 0.3;
              for (let n of t.enemies.within(s.x, s.z, c + 1.2))
                Math.hypot(t.enemies.x[n] - s.x, t.enemies.z[n] - s.z) > c - 1.6 &&
                  Dh(e, n, 0.5, { status: `poison`, statusChance: 1, knock: 5, silent: !0 });
            }
          }),
            J.goo(t.audio, 0.18));
        } else
          ((n.vel.y = 10),
            (n.squash = -0.6),
            t.later(0.45, () => {
              let r = n.pos;
              (K(t, r.x, r.y, r.z, 10 * e.R, [6986464, 14203e3, Y.white], 3, 0.07, L.Jagged),
                bh(t, r.x, r.y, r.z, 16, 9),
                G(t, r.x, r.z, 8, I.PixCrack, 16777215, 3),
                Nh(e, r.x, r.z, 6, { len: 9 * e.R, glow: 11819752, mul: 0.6 }),
                q(e, r.x, r.z, 10 * e.R, 2.2, { status: `stun`, statusChance: 1, knock: 6 }),
                t.shake(0.5),
                J.boom(t.audio, 1.2));
            }),
            Ih(
              e,
              12,
              1.2,
              16,
              0.5,
              (e, n, r, i) => {
                (t.vfx.telegraph(e, n, r, 2.8, 11819752, i), G(t, e, r, 2.4, I.PixCrack, 16777215, i + 1));
              },
              (n, i, a) => {
                (r(n, a, 1.4),
                  Ch(t, n, a, I.PixSpike, 2.6, 1, 7),
                  t.vfx.ring(n, i, a, 2.8, 11819752, 0.3, 0.2),
                  q(e, n, a, 2.8 * e.R, 1.6, { status: `poison`, statusChance: 1, knock: 2 }),
                  J.goo(t.audio, 0.1));
              },
            ));
      },
    },
    32: {
      names: [c(`Cornada Tóxica`), c(`Perforador`), c(`Terremoto Rey`)],
      descs: [
        c(`Una embestida de 16 m con el cuerno envenenado atraviesa todo lo que hay delante.`),
        c(
          `La embestida termina en un taladro que remata a los que quedan por debajo del 25% de PS (no a los jefes).`,
        ),
        c(
          `Tres pisotones: cada uno un terremoto mayor y tres grietas venenosas hacia delante; el último, un Megacuerno.`,
        ),
      ],
      type: `ground`,
      cls: `physical`,
      dur: [1, 1.6, 2.6],
      tint: 13138656,
      cast(e) {
        let t = e.run,
          n = t.enemies,
          r = (n, r) => {
            let i = new Set(),
              a = e.ax,
              o = e.az;
            (t.ghostDash(e.x, e.y, e.z, a, o, n, 13138656),
              t.vfx.norm.spawn({
                x: e.x + a,
                y: e.y + 1,
                z: e.z + o,
                vx: (a * n) / 0.2,
                vz: (o * n) / 0.2,
                life: 0.2,
                size: 2.4,
                endSize: 2.6,
                color: 14199039,
                shape: I.PixHorn,
                rot: -Math.atan2(o, a) + Math.PI * 0.75,
              }));
            for (let s = 0; s <= 10; s++)
              t.later(s * 0.02, () => {
                let c = e.x + a * n * (s / 10),
                  l = e.z + o * n * (s / 10);
                (Oh(e, i, c, l, 2 * e.R, r, {
                  status: `poison`,
                  statusChance: 0.9,
                  dirX: a,
                  dirZ: o,
                  knock: 4,
                }),
                  s % 2 && G(t, c, l, 2, I.PixCrack, 16777215, 1.8, Math.atan2(o, a)));
              });
            return (J.whoosh(t.audio, 0.3, 0.16, 400), { x: e.x + a * n, z: e.z + o * n });
          };
        if (e.tier <= 1) {
          let i = r(16 * e.R, 2.2);
          e.tier === 1 &&
            t.later(0.25, () => {
              let r = U(t, i.x, i.z),
                a = 5 * e.R;
              for (let e = 0; e < 20; e++) {
                let n = (e / 20) * H;
                t.vfx.norm.spawn({
                  x: i.x + Math.cos(n) * a * 0.3,
                  y: r + 0.6,
                  z: i.z + Math.sin(n) * a * 0.3,
                  vx: -Math.sin(n) * 9,
                  vy: F.range(2, 5),
                  vz: Math.cos(n) * 9,
                  gravity: 12,
                  life: 0.6,
                  size: 0.5,
                  endSize: 0.3,
                  color: 16777215,
                  shape: I.PixRock,
                  spin: 8,
                });
              }
              G(t, i.x, i.z, a * 1.5, I.PixCrack, 16777215, 2.5);
              for (let r of n.within(i.x, i.z, a))
                !(n.flags[r] & (R.Boss | 12290)) && n.hp[r] < n.maxHp[r] * 0.25
                  ? t.combat.hit(r, n.hp[r] + 1, {
                      type: `ground`,
                      cls: `physical`,
                      fixed: !0,
                      slot: 8,
                      knock: 4,
                    })
                  : Dh(e, r, 1.4, { knock: 3 });
              (t.shake(0.3), J.rumble(t.audio, 0.6, 0.2));
            });
          return;
        }
        let i = Math.atan2(e.az, e.ax);
        for (let n = 0; n < 3; n++)
          t.later(n * 0.55, () => {
            let a = t.player.pos,
              o = (8 + n * 3) * e.R;
            ((t.player.squash = 0.6),
              K(t, a.x, a.y, a.z, o, [14203e3, 13138656, Y.white], 3, 0.06, L.Jagged),
              t.vfx.dust(a.x, a.y, a.z, 13150328, 18, o * 1.4),
              G(t, a.x, a.z, o * 0.8, I.PixCrack, 16777215, 2.5),
              q(e, a.x, a.z, o, 1.1, { status: `stun`, statusChance: 0.7, knock: 4 }));
            for (let r = -1; r <= 1; r++)
              Mh(e, a.x, a.z, i + r * 0.4, {
                len: (12 + n * 3) * e.R,
                glow: 11819752,
                mul: 0.9,
                o: { status: `poison`, statusChance: 0.9 },
                erupt: (e, n, r, i) => {
                  (Ch(t, e, r, I.PixSpike, 2.2 - i * 0.8, 0.9, 6),
                    Math.random() < 0.4 &&
                      t.vfx.norm.spawn({
                        x: e,
                        y: U(t, e, r) + 0.5,
                        z: r,
                        vy: F.range(4, 7),
                        gravity: 12,
                        life: 0.6,
                        size: 0.5,
                        endSize: 0.3,
                        color: 16777215,
                        shape: I.PixToxic,
                      }));
                },
              });
            (t.shake(0.3 + n * 0.12),
              J.boom(t.audio, 0.7 + n * 0.25),
              n === 2 && (r(14 * e.R, 1.6), Th(t, a.x, a.y, a.z, 2, 13138656, 16769279, 0.5)));
          });
      },
    },
    35: {
      names: [c(`Luz Lunar`), c(`Danza Lunar`)],
      descs: [
        c(
          `Una luna enorme aparece sobre ti: ocho rayos de luna caen sobre los enemigos (encanto) y recuperas un 20% de PS.`,
        ),
        c(
          `La luna trae una lluvia de 16 estrellas y acaba en una onda lunar enorme; recuperas un 30% de PS.`,
        ),
      ],
      type: `fairy`,
      cls: `special`,
      dur: [1.8, 3],
      tint: 16751320,
      cast(e) {
        let t = e.run,
          n = t.player;
        (((e) => {
          let r = n.pos,
            i = t.r.camera.position,
            a = r.x - i.x,
            o = r.z - i.z,
            s = Math.hypot(a, o) || 1,
            c = r.x + (a / s) * 7,
            l = r.z + (o / s) * 7;
          (t.vfx.norm.spawn({
            x: c,
            y: r.y + 11,
            z: l,
            vy: -0.4,
            life: e,
            size: 3.6,
            endSize: 4.2,
            color: 16777215,
            shape: I.PixMoon,
          }),
            t.vfx.add.spawn({
              x: c,
              y: r.y + 11,
              z: l,
              life: e,
              size: 5.5,
              endSize: 6.5,
              color: 16765168,
              shape: I.Soft,
              glow: 0,
            }));
        })(e.tier ? 3 : 1.8),
          n.heal(n.maxHp * (e.tier ? 0.3 : 0.2)),
          t.audio.heal(),
          Ah(t, e.x, e.z, 16 * e.R, 8).forEach((n, r) =>
            t.later(0.25 + r * 0.1, () => {
              let r = t.enemies;
              if (!r.isAlive(n)) return;
              let i = r.x[n],
                a = r.z[n],
                o = U(t, i, a);
              (Th(t, i, o, a, 1.6, Y.fairy, 16773370, 0.4, 16),
                Sh(t, i, o + 0.6, a, Y.moon, 8, 5, I.Twinkle, 0.5, 0.5),
                t.vfx.ring(i, o, a, 2.6, Y.fairy, 0.35, 0.2),
                q(e, i, a, 2.6 * e.R, 1.5, { status: `charm`, statusChance: 1, knock: 1 }),
                J.sparkle(t.audio));
            }),
          ),
          e.tier !== 0 &&
            (Ih(
              e,
              16,
              1.8,
              16,
              0.5,
              (e, n, r, i) => {
                (Eh(t, e, n, r, i, I.PixStar, 1.8, 24, 6, 16771178),
                  t.vfx.telegraph(e, n, r, 3, 16767082, i));
              },
              (n, r, i) => {
                (t.vfx.ring(n, r, i, 3.2, 16767082, 0.35, 0.2, L.Petals),
                  xh(t, n, r + 0.6, i, I.PixStar, 6, 6, 0.6, 0.5),
                  Sh(t, n, r + 0.5, i, 16771178, 6, 6),
                  q(e, n, i, 3.2 * e.R, 1.2, { status: `charm`, statusChance: 0.5, knock: 2 }),
                  J.boom(t.audio, 0.3));
              },
            ),
            t.later(2.4, () => {
              let r = n.pos,
                i = 14 * e.R;
              (K(t, r.x, r.y, r.z, i, [Y.fairy, 16773280, Y.white], 3, 0.08, L.Petals),
                xh(t, r.x, r.y + 1, r.z, I.PixHeart, 18, i * 1.8, 0.8, 0.6),
                xh(t, r.x, r.y + 1.5, r.z, I.PixMoon, 8, i * 1.4, 0.9, 0.6),
                q(e, r.x, r.z, i, 2, { status: `charm`, statusChance: 1, knock: 5 }),
                t.shake(0.35),
                J.boom(t.audio, 0.9),
                J.chord(t.audio, [523, 659, 784, 1047], 0.05));
            })));
      },
    },
  };
function Wh(e, t, n, r, i, a, o, s) {
  let c = e.run,
    l = c.enemies,
    u = l.x[i],
    d = l.y[i] + l.hgt[i] * 0.5,
    f = l.z[i];
  (c.vfx.add.spawn({
    x: t,
    y: n,
    z: r,
    vx: (u - t) / a,
    vy: (d - n) / a,
    vz: (f - r) / a,
    life: a,
    size: 0.9,
    endSize: 0.7,
    color: 8042751,
    shape: I.Wisp,
    glow: 0.3,
  }),
    c.vfx.norm.spawn({
      x: t,
      y: n,
      z: r,
      vx: (u - t) / a,
      vy: (d - n) / a,
      vz: (f - r) / a,
      life: a,
      size: 0.8,
      endSize: 0.6,
      color: 16777215,
      shape: I.PixFlame,
    }),
    c.later(a, () => {
      let t = l.isAlive(i) ? l.x[i] : u,
        n = l.isAlive(i) ? l.z[i] : f,
        r = U(c, t, n);
      for (let e = 0; e < 6; e++)
        _h(c, t, r + 0.5, n, F.range(-2, 2), F.range(3, 6), F.range(-2, 2), 0.45, 0.9, 0.3);
      (c.vfx.ring(t, r, n, 2.4, 5933823, 0.3, 0.2, L.Flames), q(e, t, n, 2.4 * e.R, o, s));
    }));
}
((Uh[37] = {
  names: [c(`Fuegos Fatuos`), c(`Nueve Colas`)],
  descs: [
    c(`Nueve fuegos fatuos giran a tu alrededor y se lanzan cada uno contra un enemigo: queman y maldicen.`),
    c(
      `Nueve colas de fuego barren el suelo en estrella, dieciocho fuegos fatuos buscan enemigos y un rencor milenario maldice y confunde todo en 15 m.`,
    ),
  ],
  type: `fire`,
  cls: `special`,
  dur: [1.4, 2.4],
  tint: 16747082,
  cast(e) {
    let t = e.run,
      n = e.tier >= 1 ? 18 : 9;
    (W(
      t,
      0.5,
      (e) => {
        let n = t.player.pos;
        for (let r = 0; r < 9; r++) {
          let i = e * 9 + (r / 9) * H;
          t.vfx.add.spawn({
            x: n.x + Math.cos(i) * 2.2,
            y: n.y + 1.2 + Math.sin(e * 8 + r) * 0.3,
            z: n.z + Math.sin(i) * 2.2,
            life: 0.06,
            size: 0.8,
            endSize: 0.8,
            color: 8042751,
            shape: I.Wisp,
            glow: 0.3,
          });
        }
      },
      () => {
        let r = t.player.pos,
          i = Ah(t, r.x, r.z, 16 * e.R, n);
        for (let a = 0; a < n; a++) {
          let o = i[a % Math.max(1, i.length)];
          if (o == null) break;
          let s = (a / n) * H;
          t.later((a % 9) * 0.04, () => {
            t.enemies.isAlive(o) &&
              Wh(e, r.x + Math.cos(s) * 2.2, r.y + 1.2, r.z + Math.sin(s) * 2.2, o, 0.35, 1.2, {
                status: `burn`,
                statusChance: 1,
                knock: 2,
              });
          });
        }
        for (let e of i) t.later(0.4, () => t.combat.applyStatus(e, `curse`, 1));
        J.fire(t.audio, 0.6, 0.12);
      },
    ),
      t.audio.kt(330, 0.5, { w: `triangle`, lp: 900, v: 0.05, vib: [6, 0.05], to: 1.4, a: 0.15 }),
      e.tier !== 0 &&
        (Nh(e, e.x, e.z, 9, {
          len: (12 + e.tier * 2) * e.R,
          glow: 5933823,
          mul: 0.9,
          o: { status: `burn`, statusChance: 0.8 },
          erupt: (e, n, r) => {
            (_h(t, e, n + 0.4, r, 0, F.range(5, 9), 0, 0.5, 1.1, 0.4, 1.5),
              Math.random() < 0.3 &&
                t.vfx.add.spawn({
                  x: e,
                  y: n + 1.2,
                  z: r,
                  vy: 2,
                  life: 0.5,
                  size: 0.5,
                  endSize: 0.2,
                  color: 8042751,
                  shape: I.Wisp,
                  glow: 0.2,
                }));
          },
        }),
        t.later(1.9, () => {
          let n = t.player.pos,
            r = 15 * e.R;
          (K(t, n.x, n.y, n.z, r, [5913256, 16747082, 8042751], 3, 0.08, L.Runes),
            t.vfx.norm.spawn({
              x: n.x,
              y: n.y + 4,
              z: n.z,
              life: 0.9,
              size: 2,
              endSize: 5,
              color: 16777215,
              shape: I.PixEye,
            }));
          for (let e of t.enemies.within(n.x, n.z, r))
            (t.combat.applyStatus(e, `curse`, 1), t.combat.applyStatus(e, `confusion`, 1));
          (q(e, n.x, n.z, r, 1.4, { status: `burn`, statusChance: 1, knock: 4 }),
            t.shake(0.35),
            J.boom(t.audio, 0.9));
        })));
  },
}),
  (Uh[39] = {
    names: [c(`Nana`), c(`Globo Rebotón`)],
    descs: [
      c(
        `Cantas una nana que duerme a todos en 15 m durante 2 s; luego un grito final despierta a golpes a los dormidos (+80% de daño).`,
      ),
      c(
        `La nana duerme a todos y te inflas como un globo: tres botes enormes aplastan a los dormidos con ondas cada vez mayores.`,
      ),
    ],
    type: `fairy`,
    cls: `special`,
    dur: [2.4, 3],
    tint: 16752848,
    cast(e) {
      let t = e.run,
        n = t.player,
        r = 15 * e.R;
      W(t, 1.8, (e) => {
        let i = n.pos;
        if (Math.random() < 0.8) {
          let n = F.range(0, H),
            r = F.range(2, 6);
          t.vfx.norm.spawn({
            x: i.x,
            y: i.y + 1.8,
            z: i.z,
            vx: Math.cos(n) * r,
            vy: F.range(0.5, 1.5),
            vz: Math.sin(n) * r,
            drag: 0.8,
            life: 1.4,
            size: 0.6,
            endSize: 0.8,
            color: 16777215,
            shape: I.PixNote,
            rot: Math.sin(e * 6) * 0.3,
          });
        }
        Math.random() < 0.15 &&
          t.vfx.ring(i.x, i.y, i.z, r * (0.4 + Math.random() * 0.6), 16759008, 0.6, 0.6, L.Petals);
      });
      for (let n of t.enemies.within(e.x, e.z, r))
        (t.combat.applyStatus(n, `sleep`, 1), t.combat.applyStatus(n, `sleep`, 1));
      if (
        (t.later(0.6, () => {
          for (let e of t.enemies.within(n.pos.x, n.pos.z, r)) t.combat.applyStatus(e, `sleep`, 1);
        }),
        J.chord(t.audio, [392, 523, 659], 0.04, 0, 0.6),
        J.chord(t.audio, [349, 440, 587], 0.04, 0.6, 0.6),
        J.chord(t.audio, [330, 392, 523], 0.04, 1.2, 0.8),
        e.tier === 0)
      )
        t.later(2, () => {
          let i = n.pos;
          (Gh(t, i.x, i.y, i.z, r), q(e, i.x, i.z, r, 1.6, { knock: 5 }), t.shake(0.3), J.boom(t.audio, 0.8));
        });
      else
        for (let r = 0; r < 3; r++)
          t.later(1.1 + r * 0.55, () => {
            n.pos;
            let i = (8 + r * 3 + (e.tier - 1) * 2) * e.R;
            ((n.vel.y = 9),
              (n.squash = -0.7),
              t.later(0.35, () => {
                let a = n.pos;
                ((n.squash = 0.8),
                  K(t, a.x, a.y, a.z, i, [16752848, 16777215, 16765160], 3, 0.06, L.Petals),
                  xh(t, a.x, a.y + 0.6, a.z, I.PixHeart, 10, i * 1.6, 0.6, 0.5),
                  G(t, a.x, a.z, i * 0.6, I.PixCrack, 16777215, 2),
                  q(e, a.x, a.z, i, 1.1 + r * 0.3, { knock: 5 }),
                  t.shake(0.2 + r * 0.1),
                  J.boom(t.audio, 0.5 + r * 0.25));
              }));
          });
    },
  }));
function Gh(e, t, n, r, i) {
  for (let a = 0; a < 16; a++) {
    let o = (a / 16) * H;
    e.vfx.ground.spawn({
      x: t,
      y: n + 0.5,
      z: r,
      vx: Math.cos(o) * i * 2.2,
      vz: Math.sin(o) * i * 2.2,
      life: 0.45,
      size: 0.8,
      endSize: 2.6,
      color: 16751312,
      shape: I.Sound,
      rot: o,
      glow: 0.4,
    });
  }
  K(e, t, n, r, i, [16751312, 16777215, 16765160], 3, 0.07, L.Petals);
}
((Uh[41] = {
  names: [c(`Enjambre Vampiro`), c(`Colmillo Sangriento`)],
  descs: [
    c(
      `Siete Zubat salen de la oscuridad y muerden sin parar durante 3,5 s: envenenan y cada mordisco te cura.`,
    ),
    c(`Una nube de Golbat confunde con Supersónico y muerde 4 s; al final recuperas un 25% de PS.`),
  ],
  type: `poison`,
  cls: `physical`,
  dur: [3.6, 4.2],
  tint: 9067208,
  preload: [41, 42],
  cast(e) {
    let t = e.run,
      n = t.player,
      r = e.tier >= 1,
      i = r ? 42 : 41;
    if (
      (t.ult.drones.add(
        i,
        r ? 8 + e.tier : 7,
        r ? 4 : 3.5,
        r ? 0.85 : 0.75,
        (r, i, a) => {
          (wh(t, r, i + 0.7, a, I.PixFang, 1, 1.6, 0.18),
            t.vfx.norm.spawn({
              x: r,
              y: i + 0.6,
              z: a,
              vx: F.range(-1, 1),
              vy: 2,
              vz: F.range(-1, 1),
              gravity: 6,
              life: 0.4,
              size: 0.35,
              endSize: 0.2,
              color: 16777215,
              shape: I.PixToxic,
            }),
            q(e, r, a, 2.2 * e.R, 0.6, { status: `poison`, statusChance: 0.8, knock: 1.5 }),
            n.heal(n.maxHp * 0.008),
            t.audio.kt(170, 0.07, { to: 0.6, v: 0.1 }));
        },
        (e, n, r) => {
          Math.random() < 0.4 &&
            t.vfx.add.spawn({
              x: e,
              y: n,
              z: r,
              life: 0.25,
              size: 0.35,
              endSize: 0,
              color: 12618495,
              shape: I.Soft,
              glow: 0.2,
            });
        },
      ),
      t.cry(i, 0.6),
      r)
    ) {
      for (let r = 0; r < 3; r++)
        t.later(0.3 + r * 0.9, () => {
          let r = n.pos,
            i = 12 * e.R;
          for (let e = 0; e < 2; e++)
            t.later(e * 0.08, () =>
              t.vfx.ring(r.x, r.y + 1, r.z, i * (0.6 + e * 0.4), 13148400, 0.4, 0.2, L.Ripple),
            );
          for (let e of t.enemies.within(r.x, r.z, i)) t.combat.applyStatus(e, `confusion`, 1);
          t.audio.kt(620, 0.25, { w: `triangle`, lp: 1500, v: 0.04, vib: [20, 0.05], a: 0.02 });
        });
      t.later(3.9, () => {
        (n.heal(n.maxHp * 0.25),
          t.audio.heal(),
          Sh(t, n.pos.x, n.pos.y + 1, n.pos.z, 16743080, 14, 4, I.Heart, 0.5, 0.6));
      });
    }
  },
}),
  (Uh[43] = {
    names: [c(`Polen Nocturno`), c(`Hedor Pestilente`), c(`Tormenta Floral`)],
    descs: [
      c(
        `Una nube de polen de 12 m te rodea 2,5 s: envenena, paraliza y duerme al azar a todo lo que respira.`,
      ),
      c(`Un hedor espantoso de 10 m te acompaña 4 s: envenena, confunde y aparta a los enemigos.`),
      c(`Una flor gigante se abre a tus pies, llueve polen sobre catorce enemigos y te cura un 15%.`),
    ],
    type: `grass`,
    cls: `special`,
    dur: [2.6, 4, 2.8],
    tint: 10124e3,
    cast(e) {
      let t = e.run,
        n = t.player,
        r = [
          [10150132, `sleep`],
          [16771178, `paralysis`],
          [13144319, `poison`],
        ];
      if (e.tier === 0) {
        let i = 0;
        (W(t, 2.5, (a, o) => {
          let s = n.pos,
            c = 12 * e.R;
          for (let e = 0; e < 4; e++) {
            let e = F.range(0, H),
              n = F.range(1, c),
              [i] = F.pick(r);
            t.vfx.norm.spawn({
              x: s.x + Math.cos(e) * n,
              y: s.y + F.range(0.3, 2.5),
              z: s.z + Math.sin(e) * n,
              vx: F.range(-0.8, 0.8),
              vy: F.range(-0.3, 0.4),
              vz: F.range(-0.8, 0.8),
              drag: 0.6,
              life: 1.3,
              size: 0.3,
              endSize: 0.65,
              color: i,
              shape: I.PixSpore,
              spin: 2,
            });
          }
          if ((t.vfx.staticRing(s.x, s.y, s.z, c, 11569880, 0.5, L.Petals), (i -= o), i <= 0)) {
            i = 0.35;
            let [, t] = F.pick(r);
            q(e, s.x, s.z, c, 0.35, { status: t, statusChance: 0.6, knock: 0, silent: !0 });
          }
        }),
          J.whoosh(t.audio, 1.2, 0.08, 900));
      } else if (e.tier === 1) {
        let r = 0;
        (W(t, 4, (i, a) => {
          let o = n.pos,
            s = 10 * e.R;
          for (let e = 0; e < 3; e++) {
            let e = F.range(0, H),
              n = F.range(0.5, s);
            t.vfx.norm.spawn({
              x: o.x + Math.cos(e) * n,
              y: o.y + 0.4,
              z: o.z + Math.sin(e) * n,
              vx: F.range(-0.5, 0.5),
              vy: F.range(0.6, 1.4),
              vz: F.range(-0.5, 0.5),
              drag: 1,
              life: 1,
              size: 0.9,
              endSize: 1.8,
              color: 11045568,
              endColor: 8022618,
              shape: I.PixPuff,
            });
          }
          (Math.random() < 0.3 &&
            t.vfx.norm.spawn({
              x: o.x + F.range(-1, 1),
              y: o.y + 2.2,
              z: o.z + F.range(-1, 1),
              vy: 1,
              life: 0.6,
              size: 0.4,
              endSize: 0.7,
              color: 16777215,
              shape: I.PixToxic,
            }),
            t.vfx.staticRing(o.x, o.y, o.z, s, 9071272, 0.6));
          for (let e of t.enemies.within(o.x, o.z, s)) {
            let n = t.enemies,
              r = n.x[e] - o.x,
              i = n.z[e] - o.z,
              s = Math.hypot(r, i) || 1,
              c = n.flags[e] & (R.Boss | 12290) ? 0.1 : 1;
            ((n.kx[e] += (r / s) * 14 * a * c), (n.kz[e] += (i / s) * 14 * a * c));
          }
          ((r -= a),
            r <= 0 &&
              ((r = 0.4),
              q(e, o.x, o.z, s, 0.4, {
                status: Math.random() < 0.5 ? `poison` : `confusion`,
                statusChance: 0.8,
                knock: 0,
                silent: !0,
              })));
        }),
          J.goo(t.audio, 0.16),
          t.audio.kt(90, 1, { w: `sawtooth`, lp: 400, v: 0.07, vib: [4, 0.08], a: 0.2 }));
      } else {
        for (let n = 0; n < 8; n++) {
          let r = (n / 8) * H;
          t.vfx.norm.spawn({
            x: e.x + Math.cos(r) * 2,
            y: e.y + 0.6,
            z: e.z + Math.sin(r) * 2,
            vx: Math.cos(r) * 3,
            vz: Math.sin(r) * 3,
            drag: 3,
            life: 1.6,
            size: 1.5,
            endSize: 3.2,
            color: 16743034,
            shape: I.PixPetal,
            rot: -r + Math.PI / 2,
          });
        }
        (K(t, e.x, e.y, e.z, 6 * e.R, [16743034, 16771178], 2, 0.08, L.Petals),
          q(e, e.x, e.z, 6 * e.R, 1.2, { knock: 5 }),
          n.heal(n.maxHp * 0.15),
          t.audio.heal(),
          Ih(
            e,
            14,
            1.6,
            16,
            0.5,
            (e, n, r, i) => {
              (Eh(t, e, n, r, i, I.PixSpore, 1.8, 22, 5, 16771178), t.vfx.telegraph(e, n, r, 3, 14207050, i));
            },
            (n, i, a) => {
              let [o, s] = F.pick(r);
              for (let e = 0; e < 10; e++) {
                let e = F.range(0, H),
                  r = F.range(1, 5);
                t.vfx.norm.spawn({
                  x: n,
                  y: i + 0.5,
                  z: a,
                  vx: Math.cos(e) * r,
                  vy: F.range(0.5, 2),
                  vz: Math.sin(e) * r,
                  drag: 1.5,
                  life: 0.9,
                  size: 0.3,
                  endSize: 0.7,
                  color: o,
                  shape: I.PixSpore,
                });
              }
              (xh(t, n, i + 0.4, a, I.PixPetal, 6, 6, 0.6, 0.5),
                t.vfx.ring(n, i, a, 3.2, o, 0.35, 0.2, L.Petals),
                q(e, n, a, 3.2 * e.R, 1.3, { status: s, statusChance: 1, knock: 2 }),
                J.whoosh(t.audio, 0.2, 0.06, 900));
            },
          ),
          J.chord(t.audio, [349, 440, 523, 698], 0.04));
      }
    },
  }),
  (Uh[46] = {
    names: [c(`Bosque de Setas`), c(`Espora Parásita`)],
    descs: [
      c(`Brotan doce setas a tu alrededor y revientan en nubes de esporas que duermen y dañan.`),
      c(
        `Brotan setas bajo dieciséis enemigos: los infectados quedan dormidos y durante 4 s el hongo les roba vida para ti.`,
      ),
    ],
    type: `grass`,
    cls: `special`,
    dur: [1.6, 4.2],
    tint: 15231546,
    cast(e) {
      let t = e.run,
        n = t.player,
        r = (n, r, i, a = 1) => {
          (Ch(t, n, r, I.PixShroom, 1.8 * a, i + 0.25, 5),
            t.later(i, () => {
              let i = U(t, n, r);
              for (let e = 0; e < 12; e++) {
                let a = F.range(0, H),
                  o = F.range(1, 4.5);
                t.vfx.norm.spawn({
                  x: n,
                  y: i + 1,
                  z: r,
                  vx: Math.cos(a) * o,
                  vy: F.range(0.5, 2.5),
                  vz: Math.sin(a) * o,
                  drag: 1.5,
                  life: 1,
                  size: 0.3,
                  endSize: 0.75,
                  color: e % 2 ? 16756848 : 10150132,
                  shape: I.PixSpore,
                  spin: 2,
                });
              }
              (t.vfx.norm.spawn({
                x: n,
                y: i + 1.4,
                z: r,
                vy: 1,
                life: 0.8,
                size: 0.4,
                endSize: 0.7,
                color: 10148095,
                shape: I.PixSleepZ,
              }),
                t.vfx.ring(n, i, r, 3 * a, 15239770, 0.3, 0.2, L.Petals),
                q(e, n, r, 3 * e.R * a, 1, { status: `sleep`, statusChance: 1, knock: 1.5 }),
                J.whoosh(t.audio, 0.2, 0.06, 700));
            }));
        };
      if (e.tier === 0) {
        for (let t = 0; t < 12; t++) {
          let n = (t / 12) * H + F.range(-0.2, 0.2),
            i = F.range(3, 10) * e.R;
          r(e.x + Math.cos(n) * i, e.z + Math.sin(n) * i, 0.5 + (t % 4) * 0.12);
        }
        return;
      }
      let i = Ah(t, e.x, e.z, 16 * e.R, 16);
      (Ch(t, e.x, e.z, I.PixShroom, 3.4, 4, 4),
        i.forEach((e, n) => {
          let i = t.enemies;
          r(i.x[e], i.z[e], 0.4 + (n % 6) * 0.06, 0.8);
        }));
      let a = new Set(i),
        o = 0.6;
      (W(t, 4, (r, i) => {
        if (((o -= i), o > 0)) return;
        o = 0.5;
        let s = t.enemies,
          c = n.pos;
        for (let r of a)
          s.isAlive(r)
            ? (t.vfx.beams.spawn(s.x[r], s.y[r] + 0.8, s.z[r], c.x, c.y + 1, c.z, 0.06, 16752752, 0.2, 0.6),
              Dh(e, r, 0.35, { knock: 0, silent: !0 }),
              n.heal(n.maxHp * 0.004))
            : a.delete(r);
      }),
        t.cry(47, 0.5));
    },
  }),
  (Uh[48] = {
    names: [c(`Ojos Radar`), c(`Polvo de Escamas`)],
    descs: [
      c(`Tus ojos compuestos marcan a doce enemigos y les disparas un psicorrayo a cada uno: confunden.`),
      c(
        `Seis Venomoth te rodean y sueltan escamas que confunden y envenenan; acaba en un viento plateado de 18 m.`,
      ),
    ],
    type: `bug`,
    cls: `special`,
    dur: [1.6, 3.4],
    tint: 11565792,
    preload: [49],
    cast(e) {
      let t = e.run,
        n = t.enemies;
      if (e.tier === 0) {
        let r = Ah(t, e.x, e.z, 16 * e.R, 12);
        for (let e of r)
          t.vfx.norm.spawn({
            x: n.x[e],
            y: n.y[e] + n.hgt[e] + 0.8,
            z: n.z[e],
            life: 0.7,
            size: 0.5,
            endSize: 1.1,
            color: 16777215,
            shape: I.PixEye,
          });
        (r.forEach((r, i) =>
          t.later(0.55 + i * 0.05, () => {
            if (!n.isAlive(r)) return;
            let a = t.player.pos;
            (t.vfx.beams.spawn(
              a.x,
              a.y + 1.2,
              a.z,
              n.x[r],
              n.y[r] + 0.8,
              n.z[r],
              0.35,
              [16739032, 7002367, 14221162][i % 3],
              0.18,
            ),
              t.vfx.beams.spawn(a.x, a.y + 1.2, a.z, n.x[r], n.y[r] + 0.8, n.z[r], 0.12, 16777215, 0.14),
              q(e, n.x[r], n.z[r], 2 * e.R, 1.6, { status: `confusion`, statusChance: 1, knock: 2 }),
              J.zap(t.audio));
          }),
        ),
          t.audio.kt(260, 0.5, { w: `triangle`, lp: 1200, v: 0.05, vib: [9, 0.05], to: 1.5, a: 0.2 }));
      } else
        (t.ult.drones.add(49, 6, 3, 0.85, (n, r, i) => {
          for (let e = 0; e < 8; e++) {
            let a = F.range(0, H),
              o = F.range(1, 4);
            t.vfx.norm.spawn({
              x: n,
              y: r + 0.8,
              z: i,
              vx: Math.cos(a) * o,
              vy: F.range(0, 1.5),
              vz: Math.sin(a) * o,
              drag: 1.4,
              life: 0.8,
              size: 0.25,
              endSize: 0.5,
              color: e % 2 ? 14203135 : 15265023,
              shape: I.PixSpore,
            });
          }
          q(e, n, i, 2.6 * e.R, 0.8, {
            status: Math.random() < 0.5 ? `confusion` : `poison`,
            statusChance: 0.9,
            knock: 1,
          });
        }),
          t.cry(49, 0.6),
          t.later(2.6, () => {
            let r = t.player.pos,
              i = Math.atan2(e.az, e.ax),
              a = 18 * e.R;
            for (let e = 0; e < 40; e++) {
              let e = i + F.range(-0.5, 0.5),
                n = F.range(a * 1.2, a * 2.2);
              t.vfx.norm.spawn({
                x: r.x,
                y: r.y + F.range(0.5, 2),
                z: r.z,
                vx: Math.cos(e) * n,
                vy: F.range(-0.5, 1),
                vz: Math.sin(e) * n,
                drag: 1.6,
                life: 0.7,
                size: 0.3,
                endSize: 0.5,
                color: 15265023,
                shape: I.PixSpore,
                spin: 6,
              });
            }
            for (let t of n.within(r.x, r.z, a)) {
              let a = n.x[t] - r.x,
                o = n.z[t] - r.z,
                s = Math.hypot(a, o) || 1;
              (a * Math.cos(i) + o * Math.sin(i)) / s > 0.6 &&
                Dh(e, t, 1.8, { status: `confusion`, statusChance: 1, dirX: a / s, dirZ: o / s, knock: 6 });
            }
            (J.whoosh(t.audio, 0.6, 0.16, 500), t.shake(0.2));
          }));
    },
  }),
  (Uh[50] = {
    names: [c(`Topos Sorpresa`), c(`Terremoto Trío`)],
    descs: [
      c(`Diez Diglett asoman uno tras otro bajo los enemigos y los lanzan por los aires (aturden).`),
      c(
        `Tres grietas avanzan hacia tu objetivo, veinte Dugtrio asoman bajo la horda y el suelo tiembla tres veces.`,
      ),
    ],
    type: `ground`,
    cls: `physical`,
    dur: [1.6, 2.6],
    tint: 13146202,
    preload: [50, 51],
    cast(e) {
      let t = e.run;
      t.enemies;
      let n = e.tier >= 1,
        r = n ? 20 : 10,
        i = n ? 51 : 50,
        a = (r, a, o) => {
          t.ult.risers.add(i, r, a, 0.75, o);
          let s = U(t, r, a);
          (bh(t, r, s, a, 6, 4, I.PixRock, 0.4),
            t.vfx.dust(r, s, a, 13150328, 6, 2.5),
            G(t, r, a, 2.4, I.PixCrack, 16777215, 1.8),
            q(e, r, a, 2.4 * e.R, n ? 1.1 : 1.4, { status: `stun`, statusChance: 0.9, knock: 3 }));
        },
        o = Ah(t, e.x, e.z, 16 * e.R, r);
      for (let e = 0; e < r; e++)
        t.later(0.15 + e * (n ? 0.07 : 0.11), () => {
          let r = jh(t, t.player.pos.x, t.player.pos.z, 12, o, e);
          (a(r.x, r.z, n ? 1 : 0.9),
            t.audio.kt(200, 0.08, { to: 1.6, v: 0.08 }),
            t.audio.kn(0.06, { ft: `lowpass`, f: 900, v: 0.1 }));
        });
      if ((t.cry(i, 0.5), !n)) return;
      let s = Math.atan2(e.az, e.ax);
      for (let n = -1; n <= 1; n++)
        Mh(e, e.x, e.z, s + n * 0.35, {
          len: 18 * e.R,
          glow: 16760944,
          mul: 1.2,
          o: { status: `stun`, statusChance: 0.7 },
          erupt: (e, n, r, i) => Ch(t, e, r, I.PixSpike, 2.2 - i, 0.9, 6),
        });
      for (let n = 0; n < 3; n++)
        t.later(0.4 + n * 0.6, () => {
          let r = t.player.pos,
            i = (10 + n * 3) * e.R;
          (K(t, r.x, r.y, r.z, i, [13146202, 14203e3, 16777215], 3, 0.06, L.Jagged),
            t.vfx.dust(r.x, r.y, r.z, 13150328, 14, i * 1.2),
            q(e, r.x, r.z, i, 0.8, { status: `stun`, statusChance: 0.5, knock: 3 }),
            t.shake(0.3 + n * 0.1),
            J.rumble(t.audio, 0.5, 0.18));
        });
    },
  }),
  (Uh[52] = {
    names: [c(`Lluvia de Monedas`), c(`Joya Real`)],
    descs: [
      c(
        `Llueven veinte monedas de oro sobre los enemigos: golpean, aturden un instante y dejan ₽ en el suelo.`,
      ),
      c(
        `La joya de tu frente brilla: seis rayos de joya giran a tu alrededor y llueven monedas sobre los enemigos.`,
      ),
    ],
    type: `normal`,
    cls: `physical`,
    dur: [1.8, 2.8],
    tint: 16767050,
    cast(e) {
      let t = e.run;
      if (
        (Ih(
          e,
          e.tier >= 1 ? 16 : 20,
          1.4,
          15,
          0.45,
          (e, n, r, i) => Eh(t, e, n, r, i, I.PixCoin, 1.4, 20, 4, 16771178),
          (n, r, i) => {
            (wh(t, n, r + 0.6, i, I.PixSparkle, 0.8, 1.8, 0.25),
              bh(t, n, r, i, 3, 3, I.PixCoin, 0.35),
              t.vfx.ring(n, r, i, 2.6, 16767050, 0.3, 0.2),
              q(e, n, i, 2.6 * e.R, 1.1, { status: `stun`, statusChance: 0.5, knock: 2 }),
              Math.random() < 0.5 && t.pickups.spawn(`coin`, n, r + 0.5, i, Math.ceil(2 * t.stage)),
              t.audio.kt(1175, 0.12, { v: 0.03 }),
              t.audio.kt(1568, 0.1, { v: 0.02, d: 0.04 }));
          },
        ),
        e.tier === 0)
      )
        return;
      let n = t.player,
        r = Math.atan2(e.az, e.ax);
      (t.vfx.norm.spawn({
        x: e.x,
        y: e.y + 3,
        z: e.z,
        life: 2.4,
        size: 1.6,
        endSize: 2.2,
        color: 16777215,
        shape: I.PixGem,
      }),
        t.vfx.add.spawn({
          x: e.x,
          y: e.y + 3,
          z: e.z,
          life: 2.4,
          size: 3,
          endSize: 3.6,
          color: 16738938,
          shape: I.Soft,
          glow: 0,
        }));
      let i = 0;
      (W(t, 2.2, (a, o) => {
        let s = n.pos,
          c = 15 * e.R,
          l = s.y + 1.4;
        i -= o;
        for (let n = 0; n < 6; n++) {
          let o = r + (n / 6) * H + a * 1.6,
            u = Math.cos(o),
            d = Math.sin(o),
            f = [16726602, 4901119, 8060810, 16767050][n % 4];
          if (
            (t.vfx.beams.spawn(s.x, l, s.z, s.x + u * c, l, s.z + d * c, 0.5, f, 0.05),
            t.vfx.beams.spawn(s.x, l, s.z, s.x + u * c, l, s.z + d * c, 0.18, 16777215, 0.05),
            i <= 0)
          )
            for (let n of t.enemies.within(s.x + u * c * 0.5, s.z + d * c * 0.5, c * 0.55)) {
              let r = t.enemies.x[n] - s.x,
                i = t.enemies.z[n] - s.z,
                a = r * u + i * d;
              a > 0 &&
                a < c &&
                Math.abs(r * d - i * u) < 1.3 * e.R &&
                Dh(e, n, 0.35, { knock: 1, silent: Math.random() < 0.5 });
            }
        }
        i <= 0 && (i = 0.12);
      }),
        J.chord(t.audio, [523, 659, 784, 1047], 0.04, 0, 2));
    },
  }),
  (Uh[54] = {
    names: [c(`Jaqueca Explosiva`), c(`Géiser Mental`)],
    descs: [
      c(`Te sujetas la cabeza y estallan tres ondas psíquicas cada vez mayores que confunden.`),
      c(
        `Las ondas psíquicas y doce géiseres de agua que revientan bajo los enemigos, los empapan y los lanzan por los aires.`,
      ),
    ],
    type: `psychic`,
    cls: `special`,
    dur: [1.8, 2.6],
    tint: 6994175,
    cast(e) {
      let t = e.run,
        n = t.player;
      t.vfx.norm.spawn({
        x: e.x,
        y: e.y + 2.6,
        z: e.z,
        life: 1.6,
        size: 1,
        endSize: 1.8,
        color: 16777215,
        shape: I.PixSpiral,
        spin: 8,
      });
      for (let r = 0; r < 3; r++)
        t.later(0.3 + r * 0.4, () => {
          let i = n.pos,
            a = (7 + r * 4) * e.R;
          K(t, i.x, i.y + 0.5, i.z, a, [16739032, 6994175, 16777215], 3, 0.05, L.Runes);
          for (let e = 0; e < 12; e++) {
            let n = (e / 12) * H;
            t.vfx.add.spawn({
              x: i.x,
              y: i.y + 1.5,
              z: i.z,
              vx: Math.cos(n) * a * 2,
              vz: Math.sin(n) * a * 2,
              drag: 2,
              life: 0.4,
              size: 0.5,
              endSize: 0,
              color: 16751328,
              shape: I.Twinkle,
              glow: 0.3,
            });
          }
          (q(e, i.x, i.z, a, 0.9 + r * 0.2, { status: `confusion`, statusChance: 1, knock: 4 }),
            t.shake(0.15 + r * 0.08),
            t.audio.kt(220 + r * 60, 0.35, { v: 0.07, vib: [8, 0.06], to: 1.4, a: 0.03 }));
        });
      e.tier !== 0 &&
        Ih(
          e,
          12,
          1.4,
          15,
          0.45,
          (e, n, r, i) => {
            (t.vfx.telegraph(e, n, r, 2.8, 4892927, i), G(t, e, r, 2.4, I.PixCrack, 16777215, i + 0.8));
          },
          (n, r, i) => {
            for (let e = 0; e < 14; e++)
              t.vfx.norm.spawn({
                x: n + F.range(-0.5, 0.5),
                y: r + 0.4,
                z: i + F.range(-0.5, 0.5),
                vx: F.range(-1.5, 1.5),
                vy: F.range(9, 15),
                vz: F.range(-1.5, 1.5),
                gravity: 18,
                life: 0.9,
                size: 0.5,
                endSize: 0.3,
                color: 16777215,
                shape: I.PixDrop,
              });
            (t.vfx.norm.spawn({
              x: n,
              y: r + 1.2,
              z: i,
              vy: 4,
              drag: 4,
              life: 0.5,
              size: 2,
              endSize: 2.6,
              color: 16777215,
              shape: I.PixWave,
            }),
              Np(t, n, r + 0.4, i, 2.2, 1),
              q(e, n, i, 2.8 * e.R, 1.5, { status: `wet`, statusChance: 1, knock: 3 }),
              J.water(t.audio, 0.3, 0.1));
          },
        );
    },
  }),
  (Uh[56] = {
    names: [c(`Rabieta`), c(`Puño Furia Final`)],
    descs: [
      c(
        `Saltas de enemigo en enemigo dando ocho puñetazos furiosos que aturden, invulnerable mientras dura.`,
      ),
      c(
        `Doce puñetazos encadenados, una lluvia de puños de rabia y un pisotón final que agrieta el suelo; cuanto más dañado estés, más fuerte.`,
      ),
    ],
    type: `fighting`,
    cls: `physical`,
    dur: [1.2, 2.8],
    tint: 16742986,
    cast(e) {
      let t = e.run,
        n = t.enemies,
        r = t.player,
        i = e.tier >= 1,
        a = i ? 12 : 8,
        o = new Set(),
        s = i ? 1 + (1 - r.hp / r.maxHp) * 0.8 : 1;
      for (let r = 0; r < a; r++)
        t.later(r * 0.11, () => {
          if (t.state !== `play` && t.state !== `dead`) return;
          let r = Hh(t, 14, o);
          r < 0 ||
            (o.add(r),
            Vh(t, r, 16751210),
            wh(t, n.x[r], n.y[r] + n.hgt[r] * 0.6, n.z[r], I.PixFist, 1.2, 2, 0.16, F.range(-0.4, 0.4)),
            Sh(t, n.x[r], n.y[r] + 0.8, n.z[r], 16765088, 5, 5, I.Star, 0.4, 0.3),
            Dh(e, r, 1.3 * s, { status: `stun`, statusChance: 0.7, knock: 3 }),
            t.audio.kt(130, 0.09, { to: 0.5, v: 0.2 }),
            t.audio.kn(0.05, { ft: `lowpass`, f: 1200, v: 0.14 }),
            t.shake(0.05));
        });
      i &&
        (Ih(
          e,
          10,
          1,
          15,
          0.4,
          (e, n, r, i) => {
            (Eh(t, e, n, r, i, I.PixFist, 2, 18, 3, 16734778), t.vfx.telegraph(e, n, r, 3, 16742986, i));
          },
          (n, r, i) => {
            (wh(t, n, r + 1, i, I.PixFist, 2.2, 2.6, 0.2),
              G(t, n, i, 3, I.PixCrack),
              t.vfx.ring(n, r, i, 3, 16742986, 0.3, 0.2, L.Jagged),
              q(e, n, i, 3 * e.R, 1.2 * s, { knock: 4 }),
              J.boom(t.audio, 0.35));
          },
        ),
        t.later(2.3, () => {
          let n = r.pos,
            i = 11 * e.R;
          ((r.squash = 0.8),
            K(t, n.x, n.y, n.z, i, [16742986, 14203e3, 16777215], 3, 0.06, L.Jagged),
            G(t, n.x, n.z, i * 0.8, I.PixCrack, 16777215, 2.5),
            t.vfx.dust(n.x, n.y, n.z, 13150328, 18, i * 1.3),
            q(e, n.x, n.z, i, 1.8 * s, { status: `stun`, statusChance: 1, knock: 6 }),
            t.shake(0.45),
            J.boom(t.audio, 1.1));
        }),
        t.cry(57, 0.6));
    },
  }),
  (Uh[58] = {
    names: [c(`Carga Leal`), c(`Velocidad Legendaria`)],
    descs: [
      c(`Seis embestidas a velocidad extrema de enemigo en enemigo, dejando el suelo en llamas.`),
      c(
        `Diez embestidas en llamas, columnas de fuego sagrado sobre doce enemigos y un anillo de fuego final.`,
      ),
    ],
    type: `fire`,
    cls: `physical`,
    dur: [1.2, 2.6],
    tint: 16751162,
    cast(e) {
      let t = e.run,
        n = t.enemies,
        r = t.player,
        i = e.tier >= 1,
        a = i ? 10 : 6,
        o = new Set();
      for (let i = 0; i < a; i++)
        t.later(i * 0.12, () => {
          if (t.state !== `play` && t.state !== `dead`) return;
          let i = Hh(t, 16, o);
          if (i < 0) return;
          o.add(i);
          let a = r.pos.x,
            s = r.pos.z;
          Vh(t, i, 16756826);
          let c = r.pos.x - a,
            l = r.pos.z - s,
            u = Math.hypot(c, l);
          for (let n = 0; n <= Math.min(4, Math.floor(u / 2)); n++) {
            let r = n / Math.max(1, Math.floor(u / 2)),
              i = a + c * r,
              o = s + l * r;
            t.zones.add({
              x: i,
              z: o,
              y: U(t, i, o),
              r: 1.6,
              life: 3,
              tick: 0.25,
              dmg: e.dmg * 0.12,
              type: `fire`,
              cls: `physical`,
              status: `burn`,
              chance: 0.4,
              slot: 8,
              color: Y.fire,
              fx: Kp(`will-o-wisp`),
            });
          }
          for (let e = 0; e < 6; e++)
            _h(t, n.x[i], n.y[i] + 0.5, n.z[i], F.range(-3, 3), F.range(2, 6), F.range(-3, 3), 0.45, 1, 0.3);
          (Dh(e, i, 1.4, { status: `burn`, statusChance: 0.8, knock: 4 }),
            J.whoosh(t.audio, 0.12, 0.1, 700),
            t.shake(0.05));
        });
      i &&
        (t.later(1.3, () => {
          let i = r.pos;
          Ah(t, i.x, i.z, 16 * e.R, 12).forEach((r, i) =>
            t.later(i * 0.06, () => {
              if (!n.isAlive(r)) return;
              let i = n.x[r],
                a = n.z[r],
                o = U(t, i, a);
              Th(t, i, o, a, 1.8, 16747050, 16773280, 0.5, 18);
              for (let e = 0; e < 8; e++)
                _h(
                  t,
                  i + F.range(-0.6, 0.6),
                  o + F.range(0, 2),
                  a + F.range(-0.6, 0.6),
                  0,
                  F.range(6, 12),
                  0,
                  0.5,
                  1.2,
                  0.4,
                  1.2,
                );
              (q(e, i, a, 2.6 * e.R, 1.5, { status: `burn`, statusChance: 1, knock: 2 }),
                J.fire(t.audio, 0.3, 0.1));
            }),
          );
        }),
        t.later(2.2, () => {
          let n = r.pos,
            i = 12 * e.R;
          K(t, n.x, n.y, n.z, i, [13647898, 16756794, 13647898], 3, 0.07, L.Flames);
          for (let e = 0; e < 30; e++) {
            let r = (e / 30) * H;
            _h(
              t,
              n.x,
              n.y + 0.5,
              n.z,
              Math.cos(r) * i * 2.2,
              F.range(1, 3),
              Math.sin(r) * i * 2.2,
              0.45,
              1.3,
              0.4,
              3.5,
            );
          }
          (q(e, n.x, n.z, i, 1.6, { status: `burn`, statusChance: 1, knock: 5 }),
            t.shake(0.4),
            J.boom(t.audio, 1));
        }),
        t.cry(59, 0.6));
    },
  }),
  (Uh[60] = {
    names: [c(`Espiral Hipnótica`), c(`Remolino Espiral`), c(`Marea Dinámica`)],
    descs: [
      c(`Una espiral gigante gira bajo tus pies: duerme a todos en 13 m y acaba en una ola.`),
      c(`La espiral se convierte en un remolino que arrastra y golpea 2 s y duerme a los que atrapa.`),
      c(
        `El remolino, tres Puños Dinámicos enormes sobre los enemigos más fuertes (confunden) y una ola final.`,
      ),
    ],
    type: `water`,
    cls: `special`,
    dur: [1.8, 2.6, 3.2],
    tint: 5933800,
    cast(e) {
      let t = e.run,
        n = t.player,
        r = 13 * e.R;
      (t.vfx.groundN.spawn({
        x: e.x,
        y: U(t, e.x, e.z) + 0.12,
        z: e.z,
        life: 1.6,
        size: 2,
        endSize: r * 1.8,
        color: 16777215,
        shape: I.PixSpiral,
        spin: -4,
      }),
        t.later(0.5, () => {
          for (let n of t.enemies.within(e.x, e.z, r))
            (t.combat.applyStatus(n, `sleep`, 1), t.combat.applyStatus(n, `wet`, 1));
        }),
        t.audio.kt(330, 1, { v: 0.05, to: 0.6, vib: [3, 0.08], a: 0.2 }));
      let i = (n, r) => {
        (Ph(
          e,
          n,
          0.8,
          r,
          { status: `wet`, statusChance: 1, knock: 5 },
          (e, n, r, i) => {
            (t.vfx.norm.spawn({
              x: e,
              y: n + 0.9,
              z: r,
              vx: Math.cos(i) * 4,
              vy: 0.5,
              vz: Math.sin(i) * 4,
              life: 0.3,
              size: 2,
              endSize: 2.2,
              color: 16777215,
              shape: I.PixWave,
            }),
              Ap(t, e, n + 0.5, r, 1.4, 0.4, Math.cos(i) * 4, 0.6, Math.sin(i) * 4));
          },
          36,
        ),
          t.vfx.ring(t.player.pos.x, t.player.pos.y, t.player.pos.z, n, Y.water, 0.8, 0.08, L.Ripple),
          J.water(t.audio, 0.9, 0.2));
      };
      if (e.tier === 0) {
        t.later(1.1, () => i(12 * e.R, 1.6));
        return;
      }
      let a = 0;
      (W(t, 2, (r, i) => {
        let o = n.pos,
          s = 6 * e.R;
        for (let e = 0; e < 3; e++) {
          let n = -r * 9 + (e / 3) * H,
            i = 1 + ((r * 2.5) % 1) * s;
          t.vfx.norm.spawn({
            x: o.x + Math.cos(n) * i,
            y: o.y + 0.4,
            z: o.z + Math.sin(n) * i,
            vx: Math.sin(n) * 6,
            vy: 1.5,
            vz: -Math.cos(n) * 6,
            gravity: 10,
            life: 0.4,
            size: 0.45,
            endSize: 0.2,
            color: 16777215,
            shape: I.PixDrop,
          });
        }
        (t.vfx.staticRing(o.x, o.y, o.z, s, Y.water, 0.6, L.Ripple),
          kh(t, o.x, o.z, s + 3, 28 * i),
          (a -= i),
          a <= 0 &&
            ((a = 0.25),
            q(e, o.x, o.z, s, 0.35, {
              status: `sleep`,
              statusChance: 0.3,
              knock: 0.3,
              silent: Math.random() < 0.5,
            })));
      }),
        J.whoosh(t.audio, 1.8, 0.1, 300),
        e.tier !== 1 &&
          (t.later(1.6, () => {
            let r = t.enemies,
              i = n.pos;
            Ah(t, i.x, i.z, 16 * e.R, 14)
              .sort((e, t) => r.hp[t] - r.hp[e])
              .slice(0, 3)
              .forEach((n, a) =>
                t.later(a * 0.2, () => {
                  let a = r.isAlive(n) ? r.x[n] : i.x,
                    o = r.isAlive(n) ? r.z[n] : i.z,
                    s = U(t, a, o);
                  (Eh(t, a, s, o, 0.25, I.PixFist, 3, 16, 3, 6982360),
                    t.later(0.25, () => {
                      (t.vfx.flash(a, s + 1, o, 16758858, 4, 0.18),
                        K(t, a, s, o, 5 * e.R, [16758858, 4885208, 16777215], 3, 0.05, L.Jagged),
                        bh(t, a, s, o, 10, 7),
                        G(t, a, o, 5, I.PixCrack, 16777215, 2.5),
                        q(e, a, o, 5 * e.R, 2.2, { status: `confusion`, statusChance: 1, knock: 6 }),
                        t.shake(0.3, a, o),
                        J.boom(t.audio, 0.9));
                    }));
                }),
              );
          }),
          t.later(2.6, () => i(14 * e.R, 1.4))));
    },
  }),
  (Uh[63] = {
    names: [c(`Teletransporte Múltiple`), c(`Cuchara Torcida`), c(`Premonición Absoluta`)],
    descs: [
      c(`Te teletransportas cinco veces junto a los enemigos y cada vez estalla una onda psíquica.`),
      c(
        `Una cuchara gigante se dobla sobre ti: todo en 15 m queda inmóvil 1 s y luego es aplastado contra el suelo.`,
      ),
      c(
        `Dos cucharas, todo en 16 m queda inmóvil y dieciséis columnas de Premonición caen sobre los enemigos.`,
      ),
    ],
    type: `psychic`,
    cls: `special`,
    dur: [1.4, 1.8, 2.6],
    tint: 16739032,
    cast(e) {
      let t = e.run,
        n = t.enemies,
        r = t.player;
      if (e.tier === 0) {
        let i = new Set();
        for (let a = 0; a < 5; a++)
          t.later(a * 0.24, () => {
            let a = Hh(t, 16, i);
            if (a < 0) return;
            i.add(a);
            let o = r.pos.x,
              s = r.pos.z;
            t.vfx.burst(o, r.pos.y + 1, s, 16743128, 12, 4, I.Swirl, 0.5, 0.3);
            let c = F.range(0, H),
              l = n.x[a] + Math.cos(c) * 1.5,
              u = n.z[a] + Math.sin(c) * 1.5;
            t.terrain.inBounds(l, u, 3) &&
              !t.terrain.inWater(l, u) &&
              ((r.pos.x = l), (r.pos.z = u), (r.pos.y = U(t, l, u)), r.vel.set(0, 0, 0));
            let d = r.pos;
            (K(t, d.x, d.y, d.z, 6 * e.R, [16739032, 16759024], 2, 0.05, L.Runes),
              q(e, d.x, d.z, 6 * e.R, 1.3, { status: `confusion`, statusChance: 0.7, knock: 4 }),
              t.audio.kt(440, 0.15, { v: 0.05, to: 1.8, vib: [10, 0.05] }));
          });
        return;
      }
      let i = e.tier >= 2 ? 2 : 1,
        a = (e.tier >= 2 ? 16 : 15) * e.R;
      for (let n = 0; n < i; n++) {
        let r = i === 1 ? 0 : n ? 1.2 : -1.2;
        t.vfx.norm.spawn({
          x: e.x - e.az * r,
          y: e.y + 4.5,
          z: e.z + e.ax * r,
          life: 1.4,
          size: 2.6,
          endSize: 3,
          color: 16777215,
          shape: I.PixSpoon,
          rot: r * 0.2,
          spin: 0.4 * (r || 1),
        });
      }
      t.vfx.add.spawn({
        x: e.x,
        y: e.y + 4.5,
        z: e.z,
        life: 1.2,
        size: 4,
        endSize: 6,
        color: 16751328,
        shape: I.Soft,
        glow: 0,
      });
      let o = Ah(t, e.x, e.z, a, 40);
      for (let e of o)
        ((n.stun[e] = Math.max(n.stun[e], n.flags[e] & R.Boss ? 0.3 : 1)),
          t.vfx.add.spawn({
            x: n.x[e],
            y: n.y[e] + n.hgt[e] + 0.4,
            z: n.z[e],
            vy: 1.5,
            life: 0.8,
            size: 0.6,
            endSize: 1.2,
            color: 16743128,
            shape: I.Ring,
            glow: 0.2,
          }));
      (K(t, e.x, e.y, e.z, a, [16739032, 16759024], 2, 0.1, L.Runes),
        t.audio.kt(220, 1, { v: 0.07, to: 1.5, vib: [6, 0.04], a: 0.3 }),
        t.later(0.9, () => {
          for (let r of o)
            n.isAlive(r) &&
              (G(t, n.x[r], n.z[r], 2, I.PixCrack, 16777215, 1.6),
              t.vfx.norm.spawn({
                x: n.x[r],
                y: n.y[r] + 1.5,
                z: n.z[r],
                vy: -12,
                life: 0.12,
                size: 1,
                endSize: 0.6,
                color: 16765168,
                shape: I.PixSparkle,
              }),
              Dh(e, r, 1.5, { status: `confusion`, statusChance: 0.6, knock: 1 }));
          (t.shake(0.35), J.boom(t.audio, 0.8));
        }),
        !(e.tier < 2) &&
          Ih(
            e,
            16,
            1.2,
            16,
            0.4,
            (e, n, r, i) => t.vfx.telegraph(e, n, r, 3, 16739032, i),
            (n, r, i) => {
              (Th(t, n, r, i, 1.5, 16739032, 16769279, 0.4, 18),
                Sh(t, n, r + 0.5, i, 16759024, 6, 5),
                t.vfx.ring(n, r, i, 3, 16739032, 0.3, 0.2, L.Runes),
                q(e, n, i, 3 * e.R, 1.4, { knock: 2 }),
                J.zap(t.audio));
            },
          ));
    },
  }),
  (Uh[66] = {
    names: [c(`Mil Golpes`), c(`Sísmico Colosal`), c(`Cuatro Brazos`)],
    descs: [
      c(`Tres ráfagas de golpes kárate barren el frente en abanico y empujan a todos.`),
      c(`Saltas muy alto y caes con todo tu peso: una grieta enorme aturde y lanza a todos en 11 m.`),
      c(
        `Cuatro brazos golpean en las cuatro direcciones tres veces y todo acaba en un Puño Dinámico que confunde.`,
      ),
    ],
    type: `fighting`,
    cls: `physical`,
    dur: [1.2, 1.6, 2.8],
    tint: 13148320,
    cast(e) {
      let t = e.run,
        n = t.player,
        r = Math.atan2(e.az, e.ax),
        i = (r, i, a, o) =>
          t.later(o, () => {
            let o = n.pos,
              s = new Set();
            for (let n = 0; n < 6; n++) {
              let c = (n + 1) / 6,
                l = o.x + Math.cos(r) * i * c,
                u = o.z + Math.sin(r) * i * c,
                d = U(t, l, u);
              t.later(n * 0.03, () => {
                (wh(t, l, d + 1, u, I.PixFist, 1.4, 1.8, 0.14, r),
                  Oh(e, s, l, u, 2.2 * e.R, a, { dirX: Math.cos(r), dirZ: Math.sin(r), knock: 4 }));
              });
            }
            t.audio.kt(140, 0.08, { to: 0.5, v: 0.14 });
          });
      if (e.tier === 0)
        for (let t = 0; t < 3; t++)
          for (let n = -2; n <= 2; n++) i(r + n * 0.28, 12 * e.R, 1.1, t * 0.3 + (n + 2) * 0.03);
      else if (e.tier === 1)
        ((n.vel.y = 16),
          (n.squash = -0.7),
          J.whoosh(t.audio, 0.5, 0.12, 350),
          t.later(0.75, () => {
            let r = n.pos,
              i = 11 * e.R;
            ((n.squash = 0.9),
              K(t, r.x, r.y, r.z, i, [13148320, 14203e3, 16777215], 3, 0.06, L.Jagged),
              G(t, r.x, r.z, i, I.PixCrack, 16777215, 3),
              Nh(e, r.x, r.z, 6, {
                len: i,
                mul: 0.6,
                erupt: (e, n, r, i) => Ch(t, e, r, I.PixSpike, 2 - i, 0.8, 6),
              }),
              bh(t, r.x, r.y, r.z, 18, 10),
              t.vfx.dust(r.x, r.y, r.z, 13150328, 20, i * 1.4),
              q(e, r.x, r.z, i, 2.4, { status: `stun`, statusChance: 1, knock: 8 }),
              t.shake(0.55),
              J.boom(t.audio, 1.3));
          }));
      else {
        for (let t = 0; t < 3; t++)
          for (let n = 0; n < 4; n++) i(r + (n / 4) * H + t * 0.4, 13 * e.R, 1.2, t * 0.45 + n * 0.05);
        (t.later(1.6, () => {
          let r = n.pos,
            i = 12 * e.R;
          (t.vfx.flash(r.x, r.y + 1, r.z, 16758858, 6, 0.25),
            K(t, r.x, r.y, r.z, i, [16758858, 16734778, 16777215], 3, 0.07, L.Jagged));
          for (let e = 0; e < 24; e++) {
            let e = F.range(0, H),
              n = F.range(i, i * 2);
            _h(t, r.x, r.y + 0.8, r.z, Math.cos(e) * n, F.range(2, 6), Math.sin(e) * n, 0.55, 1.4, 0.4, 2.5);
          }
          (G(t, r.x, r.z, i * 0.8, I.PixCrack, 16777215, 2.5),
            q(e, r.x, r.z, i, 2.4, { status: `confusion`, statusChance: 1, knock: 7 }),
            t.shake(0.5),
            J.boom(t.audio, 1.3));
        }),
          t.cry(68, 0.6));
      }
    },
  }),
  (Uh[69] = {
    names: [c(`Látigo Voraz`), c(`Lluvia Ácida`), c(`Trampa Carnívora`)],
    descs: [
      c(`Diez látigos de liana salen en estrella y azotan todo lo que tocan: dañan y enraízan.`),
      c(
        `Los látigos y una lluvia de ácido gástrico sobre doce enemigos que deja charcos: quien los pisa recibe +25% de daño.`,
      ),
      c(
        `Una boca gigante aparece delante, se traga a todos los cercanos de un bocado y deja un charco de ácido.`,
      ),
    ],
    type: `grass`,
    cls: `physical`,
    dur: [1.2, 2.2, 2.4],
    tint: 10147914,
    cast(e) {
      let t = e.run,
        n = t.player,
        r = (r, i) => {
          for (let a = 0; a < r; a++)
            t.later(a * 0.04, () => {
              let o = n.pos,
                s = (a / r) * H + F.range(-0.15, 0.15),
                c = o.x + Math.cos(s) * i,
                l = o.z + Math.sin(s) * i,
                u = new Set();
              Bh(t, o.x, o.y + 1, o.z, c, U(t, c, l) + 0.3, l, F.range(-2, 2), 0.3, [3840570, 8050762], 0.3);
              for (let t = 1; t <= 5; t++) {
                let n = t / 5;
                Oh(e, u, o.x + Math.cos(s) * i * n, o.z + Math.sin(s) * i * n, 1.8 * e.R, 1.1, {
                  status: `root`,
                  statusChance: 0.8,
                  knock: 3,
                });
              }
              (G(t, c, l, 1.8, I.PixCrack, 16777215, 1.4, s), Kh(t, c, U(t, c, l) + 0.5, l));
            });
          J.whoosh(t.audio, 0.3, 0.14, 900);
        },
        i = (n, r, i) => {
          (t.vfx.groundN.spawn({
            x: n,
            y: r + 0.09,
            z: i,
            life: 4,
            size: 3.6,
            endSize: 3.8,
            color: 9084970,
            shape: I.PixSludge,
            rot: F.range(0, H),
          }),
            t.zones.add({
              x: n,
              z: i,
              y: r,
              r: 2,
              life: 4,
              tick: 0.3,
              dmg: e.dmg * 0.1,
              type: `poison`,
              cls: `physical`,
              status: `curse`,
              chance: 0.8,
              slot: 8,
              color: 12111946,
            }));
        };
      if ((e.tier <= 1 && r(10, 11 * e.R), e.tier === 0)) return;
      if (e.tier === 1) {
        Ih(
          e,
          12,
          1.4,
          15,
          0.45,
          (e, n, r, i) => {
            (Eh(t, e, n, r, i, I.PixToxic, 1.4, 20, 4, 14217306), t.vfx.telegraph(e, n, r, 2.8, 12111946, i));
          },
          (n, r, a) => {
            for (let e = 0; e < 8; e++) {
              let e = F.range(0, H),
                i = F.range(2, 5);
              t.vfx.norm.spawn({
                x: n,
                y: r + 0.4,
                z: a,
                vx: Math.cos(e) * i,
                vy: F.range(3, 6),
                vz: Math.sin(e) * i,
                gravity: 18,
                life: 0.5,
                size: 0.3,
                endSize: 0.2,
                color: 14741616,
                shape: I.PixToxic,
              });
            }
            (i(n, r, a),
              q(e, n, a, 2.8 * e.R, 1.2, { status: `curse`, statusChance: 1, knock: 1 }),
              J.goo(t.audio, 0.1));
          },
        );
        return;
      }
      let a = e.x + e.ax * 6,
        o = e.z + e.az * 6,
        s = U(t, a, o),
        c = 14 * e.R;
      t.vfx.add.spawn({
        x: a,
        y: s + 2,
        z: o,
        life: 1.2,
        size: 5,
        endSize: 7,
        color: 12116042,
        shape: I.Soft,
        glow: 0,
      });
      for (let e = 0; e < 8; e++) {
        let n = (e / 8) * H;
        Bh(
          t,
          a,
          s + 1,
          o,
          a + Math.cos(n) * c * 0.8,
          s + 0.3,
          o + Math.sin(n) * c * 0.8,
          F.range(-2, 2),
          0.3,
          [3840570, 8050762],
          1.2,
        );
      }
      (W(
        t,
        1.2,
        (e, n) => {
          if ((kh(t, a, o, c, 48 * n), Math.random() < 0.6)) {
            let e = F.range(0, H);
            t.vfx.norm.spawn({
              x: a + Math.cos(e) * c * 0.8,
              y: s + 0.6,
              z: o + Math.sin(e) * c * 0.8,
              vx: -Math.cos(e) * c,
              vz: -Math.sin(e) * c,
              life: 0.8,
              size: 0.5,
              endSize: 0.3,
              color: 16777215,
              shape: I.PixLeaf,
              spin: 6,
            });
          }
        },
        () => {
          for (let n of [-1, 1])
            for (let r = -1; r <= 1; r++)
              t.vfx.norm.spawn({
                x: a - e.az * r * 1.3,
                y: s + 1.4 + n * 2.4,
                z: o + e.ax * r * 1.3,
                vy: -n * 11,
                life: 0.18,
                size: 1.8,
                endSize: 1.8,
                color: 16777215,
                shape: I.PixFang,
                rot: n > 0 ? Math.PI : 0,
              });
          t.later(0.18, () => {
            (wh(t, a, s + 1.2, o, I.PixFang, 3, 5, 0.3),
              K(t, a, s, o, 7 * e.R, [12116042, 14741616, 16777215], 3, 0.05, L.Petals),
              i(a, s, o),
              q(e, a, o, 7 * e.R, 3, { status: `curse`, statusChance: 1, knock: 1 }),
              t.shake(0.45),
              J.boom(t.audio, 1.1),
              J.goo(t.audio, 0.2, 0.05));
          });
        },
      ),
        t.cry(71, 0.6));
    },
  }));
function Kh(e, t, n, r) {
  for (let i = 0; i < 3; i++) {
    let i = F.range(0, H);
    e.vfx.norm.spawn({
      x: t,
      y: n,
      z: r,
      vx: Math.cos(i) * 3,
      vy: F.range(1, 3),
      vz: Math.sin(i) * 3,
      gravity: 6,
      life: 0.5,
      size: 0.4,
      endSize: 0.3,
      color: 16777215,
      shape: I.PixLeaf,
      spin: 5,
    });
  }
}
((Uh[72] = {
  names: [c(`Tentáculos Abisales`), c(`Marea Venenosa`)],
  descs: [
    c(`Diez tentáculos brotan del suelo bajo los enemigos, los azotan, envenenan y atrapan.`),
    c(`Dieciséis tentáculos, una marea venenosa que sale de ti en círculo y empieza a llover.`),
  ],
  type: `poison`,
  cls: `special`,
  dur: [1.6, 2.6],
  tint: 5937880,
  cast(e) {
    let t = e.run,
      n = e.tier >= 1,
      r = n ? 16 : 10,
      i = Ah(t, e.x, e.z, 16 * e.R, r);
    for (let n = 0; n < r; n++)
      t.later(0.15 + n * 0.06, () => {
        let r = jh(t, t.player.pos.x, t.player.pos.z, 13, i, n),
          a = U(t, r.x, r.z);
        Ch(t, r.x, r.z, I.PixTentacle, 2.6, 0.9, 8);
        for (let e of [-1, 1]) Ch(t, r.x + e * 0.6, r.z + F.range(-0.4, 0.4), I.PixTentacle, 1.7, 0.75, 6);
        G(t, r.x, r.z, 2.6, I.PixCrack, 16777215, 1.6);
        for (let e = 0; e < 4; e++)
          t.vfx.norm.spawn({
            x: r.x,
            y: a + 0.8,
            z: r.z,
            vx: F.range(-2, 2),
            vy: F.range(3, 6),
            vz: F.range(-2, 2),
            gravity: 14,
            life: 0.5,
            size: 0.35,
            endSize: 0.2,
            color: 16777215,
            shape: e % 2 ? I.PixDrop : I.PixToxic,
          });
        q(e, r.x, r.z, 2.6 * e.R, 1.3, { status: `poison`, statusChance: 1, knock: 1 });
        for (let n of t.enemies.within(r.x, r.z, 2.6 * e.R)) t.combat.applyStatus(n, `root`, 1);
        J.goo(t.audio, 0.08);
      });
    n &&
      (t.later(1.2, () => {
        let n = 15 * e.R;
        (Ph(
          e,
          n,
          0.9,
          1.5,
          { status: `poison`, statusChance: 1, knock: 6 },
          (e, n, r, i) => {
            (t.vfx.norm.spawn({
              x: e,
              y: n + 0.9,
              z: r,
              vx: Math.cos(i) * 4,
              vy: 0.5,
              vz: Math.sin(i) * 4,
              life: 0.3,
              size: 2,
              endSize: 2.2,
              color: 14201087,
              shape: I.PixWave,
            }),
              t.vfx.norm.spawn({
                x: e,
                y: n + 1.4,
                z: r,
                vx: Math.cos(i) * 3,
                vy: F.range(3, 5),
                vz: Math.sin(i) * 3,
                gravity: 16,
                life: 0.5,
                size: 0.4,
                endSize: 0.2,
                color: 16777215,
                shape: I.PixToxic,
              }));
          },
          40,
        ),
          t.vfx.ring(t.player.pos.x, t.player.pos.y, t.player.pos.z, n, 9067208, 0.9, 0.08, L.Ripple),
          J.water(t.audio, 1, 0.2),
          t.later(0.8, () => t.setWeather(`rain`, 12)));
      }),
      t.cry(73, 0.6));
  },
}),
  Object.assign(Uh, Um, Km, rh, lh, hh));
for (const def of Object.values(Uh)) {
  def.names = def.names.map(name => specialNames.ultimate.get(name) ?? name);
}
function qh(e, t, n, r, i, a, o) {
  return { names: [t], descs: [n], type: e, cls: i, dur: [a], tint: r, cast: o };
}
function Jh(e, t, n, r, i, a = {}) {
  let o = e.run,
    s = o.player.pos;
  (K(o, s.x, s.y, s.z, t, r, 3, 0.07, i),
    G(o, s.x, s.z, t * 0.7, I.PixCrack, 16777215, 2.5),
    q(e, s.x, s.z, t, n, { knock: 6, ...a }),
    o.shake(0.4),
    J.boom(o.audio, 1));
}
var Yh = {
  normal: qh(
    `normal`,
    c(`Gigaimpacto`),
    c(`Una onda de choque enorme agrieta el suelo a tu alrededor; luego caen estrellas.`),
    15259832,
    `physical`,
    1.8,
    (e) => {
      (Jh(e, 12 * e.R, 2.2, [14207144, 16771232, Y.white], L.Jagged),
        Ih(
          e,
          8,
          1,
          14,
          0.45,
          (t, n, r, i) => Eh(e.run, t, n, r, i, I.PixStar, 1.6, 22, 5),
          (t, n, r) => {
            (e.run.vfx.ring(t, n, r, 3, 16771232, 0.3, 0.2),
              xh(e.run, t, n + 0.5, r, I.PixSparkle, 6, 6, 0.6, 0.4),
              q(e, t, r, 3 * e.R, 1.1));
          },
        ));
    },
  ),
  fire: qh(
    `fire`,
    c(`Erupción`),
    c(`Seis grietas de magma escupen fuego y un anillo de llamas quema todo a tu alrededor.`),
    16738858,
    `special`,
    1.8,
    (e) => {
      let t = e.run;
      (Nh(e, e.x, e.z, 6, {
        len: 14 * e.R,
        glow: Y.magma,
        mul: 1.1,
        o: { status: `burn`, statusChance: 0.9 },
        erupt: (e, n, r) => {
          for (let i = 0; i < 2; i++) _h(t, e, n + 0.4, r, 0, F.range(6, 11), 0, 0.5, 1.2, 0.4, 1.5);
        },
      }),
        t.later(0.3, () => {
          let n = t.player.pos;
          t.vfx.ring(n.x, n.y, n.z, 10 * e.R, 13647898, 0.5, 0.12, L.Flames);
          for (let e = 0; e < 30; e++) {
            let r = (e / 30) * H;
            _h(t, n.x, n.y + 0.5, n.z, Math.cos(r) * 22, 2, Math.sin(r) * 22, 0.45, 1.3, 0.4, 3.5);
          }
          (q(e, n.x, n.z, 10 * e.R, 1.4, { status: `burn`, statusChance: 1, knock: 4 }),
            J.boom(t.audio, 0.8));
        }),
        J.fire(t.audio, 1.2));
    },
  ),
  water: qh(
    `water`,
    c(`Maremoto`),
    c(`Una ola gigante sale de ti en círculo y arrastra a todos; empieza a llover.`),
    4892927,
    `special`,
    1.6,
    (e) => Uh[7].cast({ ...e, tier: 1 }),
  ),
  grass: qh(
    `grass`,
    c(`Planta Feroz`),
    c(
      `Ocho raíces espinosas revientan el suelo en estrella y enraízan todo lo que cruzan; el sol te cura un 20%.`,
    ),
    7002186,
    `special`,
    2,
    (e) => Uh[1].cast({ ...e, tier: 1 }),
  ),
  electric: qh(
    `electric`,
    c(`Tormenta Eléctrica`),
    c(`Durante 2,4 s caen rayos sin parar sobre los enemigos cercanos y al final tres truenos enormes.`),
    16769594,
    `special`,
    2.6,
    (e) => Uh[25].cast({ ...e, tier: 0 }),
  ),
  ice: qh(
    `ice`,
    c(`Era Glacial`),
    c(`Brotan cristales de hielo en espiral y congelan todo en 14 m.`),
    11071743,
    `special`,
    1.8,
    (e) => {
      let t = e.run;
      for (let n = 0; n < 36; n++)
        t.later(n * 0.025, () => {
          let r = n * 0.55,
            i = 1.5 + n * 0.36 * e.R,
            a = e.x + Math.cos(r) * i,
            o = e.z + Math.sin(r) * i,
            s = U(t, a, o);
          (t.vfx.norm.spawn({
            x: a,
            y: s + 1,
            z: o,
            vy: 5,
            drag: 7,
            life: 1.4,
            size: 1.6,
            endSize: 2,
            color: 12577535,
            shape: I.Shard,
            rot: F.range(-0.3, 0.3),
          }),
            bh(t, a, s, o, 2, 3, I.PixSnow, 0.4),
            q(e, a, o, 2.2 * e.R, 0.55, {
              status: `freeze`,
              statusChance: 1,
              knock: 0.5,
              silent: Math.random() < 0.5,
            }));
        });
      (t.later(0.95, () => {
        let n = t.player.pos;
        for (let r of t.enemies.within(n.x, n.z, 14 * e.R))
          (e.run.combat.applyStatus(r, `freeze`, 1),
            e.run.combat.applyStatus(r, `freeze`, 1),
            e.run.combat.applyStatus(r, `freeze`, 1));
        (K(t, n.x, n.y, n.z, 14 * e.R, [11071743, Y.white], 2, 0.08, L.Ripple), J.boom(t.audio, 0.6));
      }),
        J.whoosh(t.audio, 1, 0.1, 1100));
    },
  ),
  fighting: qh(
    `fighting`,
    c(`Ráfaga Final`),
    c(`Una lluvia de doce puños cae del cielo sobre los enemigos y remata con una onda de aura.`),
    16758858,
    `physical`,
    2,
    (e) => {
      let t = e.run;
      (Ih(
        e,
        12,
        1.2,
        15,
        0.4,
        (e, n, r, i) => {
          (Eh(t, e, n, r, i, I.PixFist, 2.2, 18, 2), t.vfx.telegraph(e, n, r, 3, 16758858, i));
        },
        (n, r, i) => {
          (wh(t, n, r + 1, i, I.PixFist, 2.4, 2.8, 0.2),
            G(t, n, i, 3, I.PixCrack),
            t.vfx.ring(n, r, i, 3, 16758858, 0.3, 0.2, L.Jagged),
            q(e, n, i, 3 * e.R, 1.3, { knock: 4 }),
            t.shake(0.08, n, i),
            J.boom(t.audio, 0.35));
        },
      ),
        t.later(1.7, () => Jh(e, 10 * e.R, 1.4, [4885247, 12574975], L.Plain)));
    },
  ),
  poison: qh(
    `poison`,
    c(`Diluvio Tóxico`),
    c(`Llueve lodo tóxico sobre doce enemigos y deja charcos que envenenan.`),
    11553504,
    `special`,
    1.8,
    (e) => {
      let t = e.run;
      Ih(
        e,
        12,
        1.2,
        15,
        0.45,
        (e, n, r, i) => {
          (Eh(t, e, n, r, i, I.PixSludge, 1.8, 20, 4), t.vfx.telegraph(e, n, r, 3, Y.poison, i));
        },
        (n, r, i) => {
          (bh(t, n, r, i, 8, 5, I.PixToxic, 0.5),
            t.vfx.groundN.spawn({
              x: n,
              y: r + 0.09,
              z: i,
              life: 4,
              size: 4,
              endSize: 4.2,
              color: 6957722,
              shape: I.Soft,
              rot: 0,
            }),
            t.zones.add({
              x: n,
              z: i,
              y: r,
              r: 2.4,
              life: 4,
              tick: 0.2,
              dmg: e.dmg * 0.15,
              type: `poison`,
              cls: `special`,
              status: `poison`,
              chance: 0.8,
              slot: 8,
              color: Y.poison,
            }),
            q(e, n, i, 3 * e.R, 1.2, { status: `poison`, statusChance: 1 }),
            J.goo(t.audio, 0.1));
        },
      );
    },
  ),
  ground: qh(
    `ground`,
    c(`Fisura`),
    c(`Ocho grietas recorren el suelo levantando púas de roca y aturdiendo.`),
    14203e3,
    `physical`,
    2,
    (e) => Uh[27].cast({ ...e, tier: 1 }),
  ),
  flying: qh(
    `flying`,
    c(`Huracán`),
    c(`Dos tornados avanzan hacia tu objetivo arrastrando y golpeando a todo lo que encuentran.`),
    12114160,
    `special`,
    2.2,
    (e) => Uh[16].cast({ ...e, tier: 1 }),
  ),
  psychic: qh(
    `psychic`,
    c(`Psicoruptura`),
    c(`Todo en 15 m queda inmóvil un instante y luego es aplastado por columnas psíquicas.`),
    16739032,
    `special`,
    1.8,
    (e) => {
      let t = e.run,
        n = t.enemies,
        r = Ah(t, e.x, e.z, 15 * e.R, 40);
      for (let e of r)
        ((n.stun[e] = Math.max(n.stun[e], n.flags[e] & R.Boss ? 0.3 : 0.9)),
          t.vfx.add.spawn({
            x: n.x[e],
            y: n.y[e] + n.hgt[e] + 0.6,
            z: n.z[e],
            life: 0.8,
            size: 0.6,
            endSize: 1.4,
            color: 16739032,
            shape: I.Eye,
            glow: 0.2,
          }));
      (K(t, e.x, e.y, e.z, 15 * e.R, [16739032, 16759024], 2, 0.1, L.Runes),
        t.later(0.8, () => {
          for (let i of r.slice(0, 14))
            n.isAlive(i) &&
              (Th(t, n.x[i], n.y[i], n.z[i], 1.4, 16739032, 16769279, 0.35, 14),
              q(e, n.x[i], n.z[i], 2.4 * e.R, 1.5, { status: `confusion`, statusChance: 1, knock: 2 }));
          (t.shake(0.35), J.boom(t.audio, 0.8));
        }),
        t.audio.kt(220, 0.8, { v: 0.08, to: 1.35, vib: [7, 0.035], a: 0.2 }));
    },
  ),
  bug: qh(
    `bug`,
    c(`Enjambre`),
    c(`Coronas de aguijones en todas direcciones y una nube de mariposas que envenena.`),
    12116042,
    `physical`,
    1.6,
    (e) => Uh[13].cast({ ...e, tier: 0 }),
  ),
  rock: qh(
    `rock`,
    c(`Avalancha Rocosa`),
    c(`Caen doce rocas gigantes sobre los enemigos y los aturden.`),
    11047018,
    `physical`,
    1.8,
    (e) => {
      let t = e.run;
      Ih(
        e,
        12,
        1.2,
        15,
        0.5,
        (e, n, r, i) => {
          (Eh(t, e, n, r, i, I.PixRock, 2.4, 24, 6), t.vfx.telegraph(e, n, r, 3.4, 11047018, i));
        },
        (n, r, i) => {
          (bh(t, n, r, i, 8, 6),
            G(t, n, i, 3.4, I.PixCrack),
            t.vfx.dust(n, r, i, 13154456, 8, 4),
            q(e, n, i, 3.4 * e.R, 1.4, { status: `stun`, statusChance: 0.8, knock: 3 }),
            t.shake(0.1, n, i),
            J.boom(t.audio, 0.45));
        },
      );
    },
  ),
  ghost: qh(
    `ghost`,
    c(`Desfile Espectral`),
    c(`Un corro de fantasmas sale de ti en espiral, maldice y golpea a todo lo que toca.`),
    10115839,
    `special`,
    2.2,
    (e) => {
      let t = e.run,
        n = new Set();
      (W(t, 2, (r) => {
        let i = t.player.pos;
        for (let a = 0; a < 6; a++) {
          let o = r * 3 + (a / 6) * H,
            s = (1.5 + r * 7) * e.R,
            c = i.x + Math.cos(o) * s,
            l = i.z + Math.sin(o) * s;
          (t.vfx.norm.spawn({
            x: c,
            y: i.y + 1.2 + Math.sin(r * 6 + a) * 0.4,
            z: l,
            life: 0.08,
            size: 1.2,
            endSize: 1.2,
            color: 16777215,
            shape: I.PixDragonFire,
          }),
            Math.random() < 0.3 &&
              t.vfx.add.spawn({
                x: c,
                y: i.y + 1.6,
                z: l,
                vy: 1,
                life: 0.5,
                size: 0.5,
                endSize: 0.8,
                color: 12618495,
                shape: I.Skull,
                glow: 0.2,
              }),
            Oh(e, n, c, l, 2 * e.R, 1.4, { status: `curse`, statusChance: 1, knock: 2 }));
        }
      }),
        t.audio.kt(200, 1.6, { w: `triangle`, lp: 800, v: 0.1, to: 0.65, vib: [5.5, 0.06], a: 0.4 }));
    },
  ),
  dragon: qh(
    `dragon`,
    c(`Cometa Draco`),
    c(`Diez cometas de llama dracónica caen sobre los enemigos y agrietan el suelo.`),
    8018687,
    `special`,
    2,
    (e) => {
      let t = e.run;
      Ih(
        e,
        10,
        1.3,
        16,
        0.6,
        (e, n, r, i) => {
          (Eh(t, e, n, r, i, I.PixDragonFire, 2.6, 28, 9, 8018687),
            t.vfx.telegraph(e, n, r, 3.8, 10124031, i));
        },
        (n, r, i) => {
          for (let e = 0; e < 10; e++) {
            let a = (e / 10) * H;
            t.vfx.norm.spawn({
              x: n,
              y: r + 0.5,
              z: i,
              vx: Math.cos(a) * 7,
              vy: F.range(2, 5),
              vz: Math.sin(a) * 7,
              drag: 3,
              life: 0.5,
              size: 1.1,
              endSize: 0.4,
              color: 16777215,
              shape: I.PixDragonFire,
            });
          }
          (bh(t, n, r, i, 6, 5),
            G(t, n, i, 4, I.PixCrack),
            t.vfx.ring(n, r, i, 3.8, 8018687, 0.35, 0.2, L.Runes),
            q(e, n, i, 3.8 * e.R, 1.5, { knock: 3 }),
            t.shake(0.12, n, i),
            J.boom(t.audio, 0.5));
        },
      );
    },
  ),
  dark: qh(
    `dark`,
    c(`Noche Eterna`),
    c(`La noche cae de golpe y cortes de sombra hieren a todo en 15 m; los que quedan con poca vida caen.`),
    3810384,
    `physical`,
    1.6,
    (e) => {
      let t = e.run,
        n = t.enemies;
      (Ah(t, e.x, e.z, 15 * e.R, 30).forEach((r, i) =>
        t.later(0.2 + (i % 10) * 0.05, () => {
          if (!n.isAlive(r)) return;
          let i = n.x[r],
            a = n.y[r] + n.hgt[r] * 0.6,
            o = n.z[r],
            s = F.range(0, H);
          (t.vfx.norm.spawn({
            x: i,
            y: a,
            z: o,
            life: 0.26,
            size: 1.2,
            endSize: 3,
            color: 2364462,
            shape: I.Crescent,
            rot: s,
          }),
            t.vfx.add.spawn({
              x: i,
              y: a,
              z: o,
              life: 0.18,
              size: 1,
              endSize: 2.6,
              color: 14205183,
              shape: I.Crescent,
              rot: s,
              glow: 0.2,
            }),
            !(n.flags[r] & (R.Boss | 12290)) && n.hp[r] < n.maxHp[r] * 0.15
              ? t.combat.hit(r, n.hp[r] + 1, { type: `dark`, cls: `physical`, fixed: !0, slot: 8 })
              : Dh(e, r, 1.6, { status: `healblock`, statusChance: 1, knock: 2 }));
        }),
      ),
        K(t, e.x, e.y, e.z, 15 * e.R, [3810384, 6965914], 2, 0.1, L.Runes),
        t.audio.kt(60, 1, { w: `sawtooth`, lp: 520, v: 0.12, vib: [13, 0.08], to: 0.75, a: 0.05 }));
    },
  ),
  steel: qh(
    `steel`,
    c(`Lluvia de Acero`),
    c(`Puños de acero caen como meteoros sobre diez enemigos y estallan en chispas.`),
    12110048,
    `physical`,
    1.8,
    (e) => {
      let t = e.run;
      Ih(
        e,
        10,
        1.2,
        15,
        0.5,
        (e, n, r, i) => {
          (Eh(t, e, n, r, i, I.PixFist, 2.2, 26, 8, 14214399), t.vfx.telegraph(e, n, r, 3.4, 12110048, i));
        },
        (n, r, i) => {
          for (let e = 0; e < 8; e++) {
            let e = F.range(0, H);
            t.vfx.add.spawn({
              x: n,
              y: r + 0.4,
              z: i,
              vx: Math.cos(e) * 7,
              vy: F.range(3, 6),
              vz: Math.sin(e) * 7,
              gravity: 18,
              life: 0.4,
              size: 0.16,
              endSize: 0.05,
              color: 16773280,
              shape: I.Square,
              glow: 0.3,
            });
          }
          (G(t, n, i, 3.6, I.PixCrack),
            t.vfx.ring(n, r, i, 3.4, 12110048, 0.3, 0.2),
            q(e, n, i, 3.4 * e.R, 1.5, { knock: 3 }),
            t.shake(0.1, n, i),
            J.boom(t.audio, 0.45));
        },
      );
    },
  ),
  fairy: qh(
    `fairy`,
    c(`Luz Lunar`),
    c(
      `Una luna enorme aparece sobre ti: ocho rayos de luna caen sobre los enemigos y recuperas un 20% de PS.`,
    ),
    16751320,
    `special`,
    1.8,
    (e) => Uh[35].cast({ ...e, tier: 0 }),
  ),
};
function castWindRing(ctx) {
  const {run,x,y,z}=ctx, radius=9*ctx.R, duration=0.8, hit=new Set();
  const heading=Math.atan2(ctx.az,ctx.ax);
  for(const offset of [-.275,.275])Lh(ctx,Math.cos(heading+offset),Math.sin(heading+offset),16*ctx.R,2.2,.4,2.15,{status:'confusion',statusChance:.2},1.8);
  run.vfx.crafted.windSkillArt().featherRing(x,y,z,radius);
  for(let i=0;i<3;i++)run.later(i*.13,()=>run.vfx.ring(x,y+.05,z,radius,0x92d8ff,duration,0,L.Plain));
  J.whoosh(run.audio,1,0.16,260);
  run.animate(duration,progress=>Oh(ctx,hit,x,z,radius*progress,1,{knock:4}));
}
function Xh(e, t) {
  return starterUltimate(e,Uh) ?? (e == null ? void 0 : Uh[e]) ?? Yh[t] ?? Yh.normal;
}
var Zh = (e, t) => gh(e.names, t),
  Qh = (e, t) => gh(e.dur, t);

export {
  _h,
  Dh,
  Ah,
  H,
  U,
  W,
  q,
  kh,
  Lh,
  castWindRing,
  yh,
  jh,
  Y,
  Rh,
  zh,
  J,
  Xh,
  Zh,
  Qh,
  gh
};
