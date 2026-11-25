import {vl, random as F, I, L, bl, Sl, wl, El, Ll} from "./battle-particles.js";
import {Ff, If, Lf, Rf, zf, Bf} from "../combat/enemy-population.js";
import {createMoveEffects} from "../combat/move-effects.js";
import {gameData as k} from "../data/game-database.js";

var Vf = {
    "blazing-hooves": {
      zone(e, t, n, r, i, a) {
        Math.random() < Math.min(1, a) &&
          Ep(
            e,
            t,
            e.terrain.height(t, r) + 0.25,
            r,
            F.range(-0.3, 0.3),
            F.range(1.2, 2.4),
            F.range(-0.3, 0.3),
            0.4,
            F.range(0.4, 0.65),
            0.12,
          );
      },
    },
    "flame-charge": {
      dash(e, t, n, r, i, a, o) {
        for (let s = 0; s < 12; s++) {
          let c = s / 12;
          e.later(c * 0.13, () =>
            Ep(
              e,
              t + i * o * c + F.range(-0.4, 0.4),
              n + 0.5,
              r + a * o * c + F.range(-0.4, 0.4),
              -i * 2,
              F.range(2, 4),
              -a * 2,
              0.45,
              F.range(0.8, 1.2),
              0.25,
            ),
          );
        }
        let s = t + i * o,
          c = r + a * o;
        e.later(0.13, () => {
          let t = e.terrain.height(s, c);
          (e.vfx.ring(s, t, c, 2.4, 13647898, 0.3, 0.15, L.Flames), Op(e, s, t + 0.5, c, 6, 5));
        });
      },
    },
    bounce: {
      warn(e, t, n, r, i, a, o) {
        (e.vfx.telegraph(t, n, r, i, 16747050, o), zp(e, t, n, r, o, 16777215, I.PixFlame, i * 0.6, 14, 2));
      },
      sky(e, t, n, r, i) {
        (mp(e, t, r, i * 1.1, 16777215, I.PixCrack, 1.2),
          e.vfx.ring(t, n, r, i, 13647898, 0.35, 0.15, L.Flames));
        for (let a = 0; a < 8; a++) {
          let o = (a / 8) * z;
          Ep(e, t, n + 0.4, r, Math.cos(o) * i * 2, F.range(1, 3), Math.sin(o) * i * 2, 0.4, 0.9, 0.3, 3);
        }
        (e.vfx.dust(t, n, r, 14207144, 8, i * 1.3), e.shake(0.08, t, r));
      },
    },
    inferno: {
      draw(e, t, n, r) {
        (Rp(e, t, n, r, I.PixFlame, 16777215, 6, n * 0.45, !1),
          e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.9, 16777215, I.PixFlame, e.rot[t] * 0.4, 0, r),
          e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.6, V.fireDeep, I.Soft, 0, 0, 0.3 * r));
      },
      trail(e, t, n, r, i, a) {
        Ep(e, t + F.range(-0.3, 0.3), n, r + F.range(-0.3, 0.3), 0, 2, 0, 0.35, a * 0.5, 0.1);
      },
      boom(e, t, n, r, i) {
        let a = e.terrain.height(t, r);
        for (let a = 0; a < 18; a++) {
          let o = (a / 18) * z;
          Ep(e, t, n, r, Math.cos(o) * i * 2.4, F.range(2, 6), Math.sin(o) * i * 2.4, 0.5, 1.2, 0.3, 3);
        }
        (e.vfx.ring(t, a, r, i, 13647898, 0.4, 0.15, L.Flames), mp(e, t, r, i * 1.1, 2759188, I.Soft, 2, 0));
        for (let n = 0; n < 2; n++) Dp(e, t, a + 0.8, r, 1.2);
        (Op(e, t, n, r, 8, 6), e.shake(0.08, t, r));
      },
    },
    "sacred-fire": {
      warn(e, t, n, r, i, a, o) {
        e.vfx.telegraph(t, n, r, i, 16765002, o);
        for (let a = 0; a < 3; a++)
          e.later(o * a * 0.3, () =>
            Ep(e, t + F.range(-i, i) * 0.4, n + 0.3, r + F.range(-i, i) * 0.4, 0, 3, 0, 0.4, 0.6),
          );
      },
      sky(e, t, n, r, i) {
        Hp(e, t, n, r, 2.6, 16747050, 16773792);
        for (let i = 0; i < 22; i++)
          Ep(
            e,
            t + F.range(-0.8, 0.8),
            n + F.range(0, 1),
            r + F.range(-0.8, 0.8),
            F.range(-1, 1),
            F.range(8, 14),
            F.range(-1, 1),
            0.7,
            F.range(1, 1.5),
            0.3,
            1.2,
          );
        e.vfx.ring(t, n, r, i, 13647898, 0.45, 0.15, L.Flames);
        let a = [16738906, 16765002, 8054890, 6994175];
        for (let o = 0; o < 12; o++) {
          let s = (o / 12) * z;
          dp(e).spawn({
            x: t,
            y: n + 1,
            z: r,
            vx: Math.cos(s) * i * 2,
            vy: F.range(2, 5),
            vz: Math.sin(s) * i * 2,
            drag: 2,
            life: 0.5,
            size: 0.35,
            endSize: 0,
            color: a[o % 4],
            shape: I.Twinkle,
            glow: 0.3,
          });
        }
        (mp(e, t, r, i * 1.2, 16777215, I.PixCrack, 1.6),
          e.vfx.flash(t, n + 1, r, 16760944, i, 0.14),
          e.shake(0.25, t, r));
      },
    },
    yawn: {
      draw(e, t, n, r) {
        let i = Math.sin(e.rot[t] * 2) * 0.1;
        (e.pool.push(e.x[t], e.y[t], e.z[t], n * (1.2 + i), 16777215, I.PixBubble, 0, 0, r),
          e.pool.push(
            e.x[t],
            e.y[t],
            e.z[t],
            n * 0.55,
            16759e3,
            I.PixSleepZ,
            Math.sin(e.rot[t]) * 0.3,
            0,
            r,
          ));
      },
      trail(e, t, n, r) {
        Math.random() < 0.25 &&
          e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vy: 0.5,
            life: 0.5,
            size: 0.18,
            endSize: 0.3,
            color: 16777215,
            shape: I.PixBubble,
          });
      },
      hit(e, t, n, r) {
        (e.vfx.norm.spawn({
          x: t,
          y: n + 0.8,
          z: r,
          vy: 1.2,
          life: 0.9,
          size: 0.4,
          endSize: 0.8,
          color: 16759e3,
          shape: I.PixSleepZ,
        }),
          yp(e, t, n, r, 16777215, 4, 2, I.PixBubble, 0.25, 0.4));
      },
    },
    scald: {
      cone(e, t, n, r, i, a, o, s, c) {
        let l = Math.sqrt(c / 7);
        (Math.random() < 0.6 &&
          e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vx: i * 1.05 + F.range(-1, 1),
            vy: a * 0.5 + 1.2,
            vz: o * 1.05 + F.range(-1, 1),
            gravity: 6,
            life: s,
            size: 0.35,
            endSize: 0.5 * l,
            color: 16777215,
            shape: I.PixDrop,
          }),
          Math.random() < 0.25 &&
            e.vfx.norm.spawn({
              x: t + i * s * 0.5,
              y: n + 0.3,
              z: r + o * s * 0.5,
              vx: i * 0.3,
              vy: 1.5,
              vz: o * 0.3,
              drag: 1.5,
              life: 0.7,
              size: 0.5,
              endSize: 1.4 * l,
              color: 15790324,
              endColor: 13158608,
              shape: I.PixPuff,
            }));
      },
    },
    "psychic-noise": {
      draw(e, t, n, r) {
        let i = (e.rot[t] * 3) % 1;
        (e.glow.push(
          e.x[t],
          e.y[t] + 0.4,
          e.z[t],
          n * (0.8 + i * 0.6),
          16743128,
          I.Sound,
          -Math.atan2(e.vz[t], e.vx[t]),
          0.3,
          (1 - i * 0.5) * r,
        ),
          e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.2, 9058954, I.Soft, 0, 0, 0.35 * r));
      },
      trail(e, t, n, r) {
        Math.random() < 0.3 &&
          dp(e).spawn({
            x: t,
            y: n + 0.5,
            z: r,
            life: 0.25,
            size: 0.4,
            endSize: 1,
            color: 16752864,
            shape: I.Ring,
            glow: 0.1,
          });
      },
    },
    "expanding-force": {
      nova(e, t, n, r, i) {
        for (let a = 0; a < 3; a++)
          e.later(a * 0.06, () =>
            e.vfx.ring(t, n, r, i * (0.5 + a * 0.25), a === 1 ? 6994175 : V.psy, 0.4, 0.2, L.Runes),
          );
        (vp(e, t, n + 0.8, r, 16759024, 14, i * 2.2, I.Twinkle, 0.5, 0.4),
          e.vfx.add.spawn({
            x: t,
            y: n + 2.4,
            z: r,
            life: 0.4,
            size: 0.6,
            endSize: 1.6,
            color: V.psy,
            shape: I.Eye,
            glow: 0.2,
          }),
          e.shake(0.12));
      },
    },
    "thunder-wave": {
      link(e, t, n, r, i, a, o, s, c) {
        (e.vfx.lightning(t, n, r, i, a, o, 16773242, 0.25, 6, 0.2),
          e.later(c * 0.03, () => {
            (e.vfx.ring(i, a - 0.6, o, 1.2, V.volt, 0.25, 0.3, L.Dashed),
              B(e, i, a + 0.5, o, I.Bolt, V.volt, 0.8, 0.4, 0.25, F.range(-0.4, 0.4), 0.4));
          }));
      },
    },
    "gyro-ball": {
      nova(e, t, n, r, i) {
        for (let t = 0; t < 10; t++)
          e.later(t * 0.02, () => {
            let n = e.player.pos,
              r = (t / 10) * z,
              a = n.x + Math.cos(r) * i * 0.7,
              o = n.z + Math.sin(r) * i * 0.7;
            (e.vfx.norm.spawn({
              x: a,
              y: n.y + 0.8,
              z: o,
              life: 0.1,
              size: 1,
              endSize: 1,
              color: Rf,
              shape: I.Gem,
              rot: r * 3,
            }),
              dp(e).spawn({
                x: a,
                y: n.y + 0.5,
                z: o,
                vx: -Math.sin(r) * 6,
                vy: F.range(1, 3),
                vz: Math.cos(r) * 6,
                gravity: 14,
                life: 0.3,
                size: 0.14,
                endSize: 0.05,
                color: 16773280,
                shape: I.Square,
                glow: 0.3,
              }));
          });
        e.vfx.ring(t, n, r, i, Rf, 0.35, 0.2, L.Plain);
      },
    },
    "magnet-bomb": {
      draw(e, t, n, r) {
        (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.15, 16777215, vl.PixMagnet, e.rot[t] * 3, 0, r),
          e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.4, Lf, I.Soft, 0, 0, 0.2 * r));
      },
      trail(e, t, n, r) {
        Math.random() < 0.3 &&
          e.vfx.lightning(
            t,
            n,
            r,
            t + F.range(-0.6, 0.6),
            n + F.range(-0.4, 0.4),
            r + F.range(-0.6, 0.6),
            16773242,
            0.1,
            2,
            0.06,
          );
      },
      hit(e, t, n, r) {
        (B(e, t, n, r, I.Star, 16773312, 0.4, 1.5, 0.15, 0, 0.4),
          _p(e, t, n, r, 16777215, 2, 3, vl.PixMagnet, 0.3),
          vp(e, t, n, r, V.volt, 5, 4, I.Spark, 0.35, 0.25));
      },
    },
    "flash-cannon": {
      beam(e, t, n, r, i, a, o, s) {
        (Cp(e, t, n, r, i, a, o, s, Rf, 16777215),
          Sp(e, t, n, r, i, a, o, [15266047, Rf], s * 1.6, 1),
          Tp(e, t, n, r, i, a, o, 15791359, I.Twinkle, 1, 0.4));
      },
    },
    cut: {
      strike(e, t, n, r, i, a, o, s, c) {
        let l = t + i * o * 0.3,
          u = r + a * o * 0.3,
          d = fp(i, a);
        (e.vfx.norm.spawn({
          x: l,
          y: n + 0.7,
          z: u,
          life: 0.16,
          size: o * 0.5,
          endSize: o * 0.5,
          color: 16777215,
          shape: vl.PixLeek,
          rot: (c % 2 ? 1 : -1) * 0.8,
          spin: c % 2 ? -14 : 14,
        }),
          dp(e).spawn({
            x: l,
            y: n + 0.5,
            z: u,
            life: 0.18,
            size: o * 0.4,
            endSize: o * 0.7,
            color: zf,
            shape: I.Crescent,
            rot: d + (c % 2 ? 0.6 : -0.6),
            glow: 0.2,
          }),
          yp(e, l, n + 0.5, u, 16777215, 3, 2.5, I.PixLeaf, 0.3, 0.4));
      },
    },
    "false-swipe": {
      draw(e, t, n, r) {
        e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.4, 16777215, vl.PixLeek, e.rot[t] * 5, 0, r);
      },
      trail(e, t, n, r) {
        Math.random() < 0.3 &&
          e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            life: 0.25,
            size: 0.35,
            endSize: 0.2,
            color: 16777215,
            shape: I.PixLeaf,
            rot: F.range(0, z),
          });
      },
      hit(e, t, n, r) {
        B(e, t, n, r, I.Cross, 14221232, 0.4, 1.4, 0.14, 0, 0.4);
      },
    },
    "brave-bird": {
      dash(e, t, n, r, i, a, o) {
        Tp(e, t, n + 0.8, r, t + i * o, n + 0.8, r + a * o, 9091327, I.Soft, 6, 0.6);
        for (let s = 0; s < 8; s++) {
          let c = s / 8;
          e.later(c * 0.13, () =>
            e.vfx.norm.spawn({
              x: t + i * o * c,
              y: n + 1,
              z: r + a * o * c,
              vx: F.range(-2, 2),
              vy: F.range(1, 3),
              vz: F.range(-2, 2),
              drag: 2,
              life: 0.6,
              size: 0.4,
              endSize: 0.3,
              color: 16777215,
              shape: I.PixFeather,
              spin: 6,
            }),
          );
        }
        let s = t + i * o,
          c = r + a * o;
        e.later(0.13, () => {
          let t = e.terrain.height(s, c);
          (B(e, s, t + 1, c, I.Star, 14215423, 0.7, 3, 0.22, 0, 0.5),
            e.vfx.ring(s, t, c, 3, 6986472, 0.35, 0.15, L.Ripple),
            e.shake(0.12, s, c));
        });
      },
    },
    "meteor-assault": {
      warn(e, t, n, r, i, a, o) {
        (e.vfx.telegraph(t, n, r, i, zf, o), zp(e, t, n, r, o, 16777215, vl.PixLeek, i * 0.7, 24, 5));
      },
      sky(e, t, n, r, i) {
        (B(e, t, n + 1.2, r, vl.PixLeek, 16777215, 2.4, 3, 0.3, -0.6, 0),
          mp(e, t, r, i * 1.3, 16777215, I.PixCrack, 1.8));
        for (let a = 0; a < 2; a++)
          e.later(a * 0.07, () =>
            e.vfx.ring(t, n, r, i * (0.7 + a * 0.35), a ? 16777215 : zf, 0.4, 0.15, L.Jagged),
          );
        (yp(e, t, n + 0.5, r, 16777215, 10, i * 2, I.PixLeaf, 0.5, 0.5, i),
          _p(e, t, n, r, 16777215, 8, i * 1.3, I.PixRock, 0.45),
          e.shake(0.3, t, r));
      },
    },
    pluck: {
      strike(e, t, n, r, i, a, o, s, c) {
        for (let s = 0; s < 2; s++)
          e.later(s * 0.05, () => {
            let s = t + i * o * 0.25 + F.range(-0.5, 0.5),
              l = r + a * o * 0.25 + F.range(-0.5, 0.5);
            (e.vfx.beams.spawn(s - i * 1.3, n + 0.7, l - a * 1.3, s, n + 0.3, l, 0.2, 16756848, 0.1),
              B(e, s, n + 0.3, l, I.Twinkle, V.white, 0.3, o * 0.5, 0.12, c * 0.5, 0.4));
          });
        Math.random() < 0.5 &&
          e.vfx.norm.spawn({
            x: t,
            y: n + 0.5,
            z: r,
            vx: F.range(-2, 2),
            vy: 2,
            vz: F.range(-2, 2),
            gravity: 3,
            drag: 2,
            life: 0.7,
            size: 0.3,
            endSize: 0.25,
            color: 16777215,
            shape: I.PixFeather,
            spin: 4,
          });
      },
    },
    "double-hit": {
      draw(e, t, n, r) {
        let i = Math.hypot(e.vx[t], e.vz[t]) || 1,
          a = (-e.vz[t] / i) * 0.2,
          o = (e.vx[t] / i) * 0.2;
        for (let i of [-1, 1])
          e.pool.push(
            e.x[t] + a * i,
            e.y[t],
            e.z[t] + o * i,
            n * 0.85,
            16756826,
            I.Shard,
            Math.atan2(e.vx[t], e.vz[t]),
            0,
            r,
          );
      },
      trail(e, t, n, r) {
        e.vfx.add.spawn({
          x: t,
          y: n,
          z: r,
          life: 0.1,
          size: 0.22,
          endSize: 0,
          color: 16760960,
          shape: I.Soft,
          glow: 0.1,
        });
      },
      hit(e, t, n, r) {
        B(e, t, n, r, I.Star, 16773312, 0.3, 1.2, 0.12, 0, 0.4);
      },
    },
    uproar: {
      nova(e, t, n, r, i) {
        (bp(e, t, n, r, 16765066, 14, i * 2.3, I.Sound, 1.6, 0.42),
          e.vfx.ring(t, n, r, i, 14198888, 0.35, 0.15, L.Ripple),
          yp(e, t, n + 1, r, 16777215, 5, i * 1.4, I.PixFeather, 0.4, 0.6),
          e.shake(0.06));
      },
    },
    acrobatics: {
      dash(e, t, n, r, i, a, o) {
        let s = -a,
          c = i;
        for (let l = 0; l < 6; l++) {
          let u = (l + 1) / 6,
            d = l % 2 ? 0.8 : -0.8;
          e.later(u * 0.13, () => {
            let l = t + i * o * u + s * d,
              f = r + a * o * u + c * d;
            (e.vfx.dust(l, e.terrain.height(l, f), f, 14207144, 3, 2),
              e.vfx.norm.spawn({
                x: l,
                y: n + 0.8,
                z: f,
                vy: 2,
                gravity: 4,
                life: 0.5,
                size: 0.3,
                endSize: 0.25,
                color: 16777215,
                shape: I.PixFeather,
                spin: 5,
              }));
          });
        }
        let l = t + i * o,
          u = r + a * o;
        e.later(0.13, () => B(e, l, n + 1, u, I.Star, 16773312, 0.5, 2.2, 0.2, 0, 0.4));
      },
    },
    "icy-wind": {
      cone(e, t, n, r, i, a, o, s, c) {
        let l = Math.sqrt(c / 7);
        (Math.random() < 0.5 &&
          e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vx: i * 1.1 + F.range(-1, 1),
            vy: a * 0.3,
            vz: o * 1.1 + F.range(-1, 1),
            drag: 1,
            life: s,
            size: 0.35,
            endSize: 0.6 * l,
            color: 16777215,
            shape: I.PixSnow,
            spin: 4,
          }),
          Math.random() < 0.25 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: i * 0.9,
              vy: 0.3,
              vz: o * 0.9,
              drag: 1.2,
              life: s * 0.9,
              size: 0.6,
              endSize: 1.6 * l,
              color: 15268095,
              endColor: 12574960,
              shape: I.PixPuff,
            }));
      },
    },
    dive: {
      dash(e, t, n, r, i, a, o) {
        Np(e, t, n, r, 1.2, 0.8);
        for (let n = 0; n < 6; n++) {
          let s = n / 6;
          e.later(s * 0.12, () => {
            let c = t + i * o * s,
              l = r + a * o * s;
            (Ap(e, c, e.terrain.height(c, l) + 0.3, l, 1.2, 0.45, -i * 2, 0.4, -a * 2),
              n % 2 && Mp(e, c, l, 1.4, 0.9));
          });
        }
        let s = t + i * o,
          c = r + a * o;
        e.later(0.13, () => {
          let t = e.terrain.height(s, c);
          for (let n = 0; n < 10; n++)
            kp(
              e,
              s + F.range(-0.4, 0.4),
              t + 0.5,
              c + F.range(-0.4, 0.4),
              F.range(-2, 2),
              F.range(8, 13),
              F.range(-2, 2),
              0.75,
              F.range(0.45, 0.7),
              0.25,
              20,
              0,
            );
          (Np(e, s, t + 0.5, c, 2, 1.2), e.shake(0.08, s, c));
        });
      },
    },
    "aurora-beam": {
      beam(e, t, n, r, i, a, o, s) {
        let c = [8060872, 9091327, 16751328],
          l = c[Math.floor(e.time * 8) % 3];
        (Cp(e, t, n, r, i, a, o, s * 0.85, l, 16777215),
          Sp(e, t, n, r, i, a, o, c, s * 1.5, 1),
          Math.random() < 0.4 &&
            e.vfx.norm.spawn({
              x: i,
              y: a,
              z: o,
              vy: 1,
              life: 0.4,
              size: 0.4,
              endSize: 0.2,
              color: 16777215,
              shape: I.PixSnow,
              spin: 3,
            }));
      },
    },
    "sheer-cold": {
      nova(e, t, n, r, i) {
        for (let n = 0; n < 16; n++) {
          let a = (n / 16) * z,
            o = i * F.range(0.5, 0.95),
            s = t + Math.cos(a) * o,
            c = r + Math.sin(a) * o;
          e.later(n * 0.01, () =>
            e.vfx.norm.spawn({
              x: s,
              y: e.terrain.height(s, c) + 0.8,
              z: c,
              vy: 4,
              drag: 7,
              life: 0.9,
              size: 1.3,
              endSize: 1.6,
              color: 12577535,
              shape: I.Shard,
              rot: F.range(-0.3, 0.3),
            }),
          );
        }
        for (let a = 0; a < 3; a++)
          e.later(a * 0.07, () =>
            e.vfx.ring(t, n, r, i * (0.5 + a * 0.25), a === 1 ? 16777215 : Ff, 0.45, 0.2, L.Ripple),
          );
        (yp(e, t, n + 0.6, r, 16777215, 12, i * 2, I.PixSnow, 0.5, 0.6),
          e.vfx.groundN.spawn({
            x: t,
            y: e.terrain.height(t, r) + 0.08,
            z: r,
            life: 1.6,
            size: i * 1.6,
            endSize: i * 1.8,
            color: 14218495,
            shape: I.Soft,
            rot: 0,
          }),
          e.shake(0.16));
      },
    },
    "poison-gas": {
      zone(e, t, n, r, i, a) {
        let o = e.terrain.height(t, r);
        (Math.random() < 0.35 * Math.min(1, a) &&
          e.vfx.norm.spawn({
            x: t,
            y: o + 0.4,
            z: r,
            vx: F.range(-0.4, 0.4),
            vy: F.range(0.5, 1.2),
            vz: F.range(-0.4, 0.4),
            drag: 1,
            life: 0.9,
            size: 0.6,
            endSize: 1.4,
            color: 11569872,
            endColor: 8018570,
            shape: I.PixPuff,
          }),
          Math.random() < 0.25 &&
            e.vfx.norm.spawn({
              x: t,
              y: o + 0.2,
              z: r,
              vy: 1,
              life: 0.5,
              size: 0.2,
              endSize: 0.35,
              color: 16777215,
              shape: I.PixToxic,
            }));
      },
    },
    sludge: {
      draw(e, t, n, r) {
        (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.1, 16777215, I.PixSludge, e.rot[t] * 0.4, 0, r),
          e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.2, V.poison, I.Soft, 0, 0, 0.2 * r));
      },
      trail(e, t, n, r) {
        Math.random() < 0.5 &&
          e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vy: -1,
            gravity: 10,
            life: 0.35,
            size: 0.22,
            endSize: 0.1,
            color: 16777215,
            shape: I.PixToxic,
          });
      },
      boom(e, t, n, r, i) {
        let a = e.terrain.height(t, r);
        e.vfx.groundN.spawn({
          x: t,
          y: a + 0.09,
          z: r,
          life: 1.8,
          size: i * 1.4,
          endSize: i * 1.5,
          color: Bf,
          shape: I.PixSludge,
          rot: F.range(0, z),
        });
        for (let n = 0; n < 10; n++) {
          let o = F.range(0, z),
            s = F.range(2, i * 2);
          e.vfx.norm.spawn({
            x: t,
            y: a + 0.5,
            z: r,
            vx: Math.cos(o) * s,
            vy: F.range(3, 7),
            vz: Math.sin(o) * s,
            gravity: 20,
            life: 0.55,
            size: 0.35,
            endSize: 0.2,
            color: 16777215,
            shape: n % 2 ? I.PixSludge : I.PixToxic,
          });
        }
        e.vfx.ring(t, a, r, i, V.poison, 0.3);
      },
    },
    "shadow-sneak": {
      dash(e, t, n, r, i, a, o) {
        for (let n = 0; n < 8; n++) {
          let s = n / 8;
          e.later(s * 0.12, () => {
            let n = t + i * o * s,
              c = r + a * o * s;
            e.vfx.groundN.spawn({
              x: n,
              y: e.terrain.height(n, c) + 0.08,
              z: c,
              life: 0.5,
              size: 1.6,
              endSize: 1.2,
              color: 2759226,
              shape: I.Soft,
              rot: 0,
            });
          });
        }
        let s = t + i * o,
          c = r + a * o;
        e.later(0.13, () => {
          let t = e.terrain.height(s, c);
          (e.vfx.norm.spawn({
            x: s,
            y: t + 0.6,
            z: c,
            vy: 6,
            drag: 6,
            life: 0.4,
            size: 1.4,
            endSize: 1.8,
            color: 3810384,
            shape: I.Palm,
            rot: 0,
          }),
            vp(e, s, t + 0.8, c, V.ghost, 6, 4, I.Spark, 0.35, 0.3));
        });
      },
    },
    belch: {
      cone(e, t, n, r, i, a, o, s, c) {
        if (Math.random() < 0.3) return;
        let l = Math.sqrt(c / 7);
        (e.vfx.norm.spawn({
          x: t,
          y: n,
          z: r,
          vx: i * 0.95 + F.range(-1, 1),
          vy: a * 0.4 + F.range(0, 1),
          vz: o * 0.95 + F.range(-1, 1),
          drag: 1,
          life: s,
          size: 0.6,
          endSize: 1.9 * l,
          color: 11569872,
          endColor: 6982202,
          shape: I.PixPuff,
        }),
          Math.random() < 0.3 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: i * 1.1,
              vy: a * 0.3 + 1,
              vz: o * 1.1,
              gravity: 4,
              life: s,
              size: 0.3,
              endSize: 0.2,
              color: 16777215,
              shape: I.PixToxic,
            }));
      },
    },
    clamp: {
      strike(e, t, n, r, i, a, o) {
        let s = t + i * o * 0.3,
          c = r + a * o * 0.3;
        for (let t of [-1, 1])
          e.vfx.norm.spawn({
            x: s,
            y: n + 0.7 + t * 0.9,
            z: c,
            vy: -t * 8,
            life: 0.12,
            size: o * 0.4,
            endSize: o * 0.4,
            color: 16777215,
            shape: vl.PixShell,
            rot: t > 0 ? Math.PI : 0,
          });
        e.later(0.12, () => {
          (B(e, s, n + 0.7, c, I.Star, 15786239, 0.4, o * 0.6, 0.16, 0, 0.4),
            yp(e, s, n + 0.6, c, 16777215, 5, 3, I.PixDrop, 0.3, 0.4));
        });
      },
    },
    "icicle-spear": {
      draw(e, t, n, r) {
        (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.2, 12577535, I.Shard, Math.atan2(e.vx[t], e.vz[t]), 0, r),
          e.glow.push(e.x[t], e.y[t], e.z[t], n * 0.9, Ff, I.Soft, 0, 0, 0.2 * r));
      },
      trail(e, t, n, r) {
        Math.random() < 0.3 &&
          e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vy: -0.5,
            life: 0.3,
            size: 0.2,
            endSize: 0.1,
            color: 16777215,
            shape: I.PixSnow,
          });
      },
      hit(e, t, n, r) {
        (_p(e, t, n, r, 14218495, 4, 3, I.Shard, 0.25),
          B(e, t, n, r, I.Twinkle, 15268095, 0.3, 1, 0.12, 0, 0.3));
      },
    },
    "ice-spinner": {
      nova(e, t, n, r, i) {
        for (let a = 0; a < 14; a++) {
          let o = (a / 14) * z;
          e.vfx.norm.spawn({
            x: t + Math.cos(o) * 0.8,
            y: n + 0.6,
            z: r + Math.sin(o) * 0.8,
            vx: Math.cos(o) * i * 2 - Math.sin(o) * 6,
            vy: F.range(0.5, 2),
            vz: Math.sin(o) * i * 2 + Math.cos(o) * 6,
            drag: 2.5,
            life: 0.45,
            size: 0.55,
            endSize: 0.3,
            color: 12577535,
            shape: I.Shard,
            rot: o,
          });
        }
        (e.vfx.norm.spawn({
          x: t,
          y: n + 0.9,
          z: r,
          life: 0.3,
          size: 1.2,
          endSize: 1.4,
          color: 16777215,
          shape: vl.PixShell,
          spin: 25,
        }),
          e.vfx.ring(t, n, r, i, If, 0.35, 0.15, L.Ripple));
      },
    },
    "icicle-crash": {
      warn(e, t, n, r, i, a, o) {
        zp(e, t, n, r, o, 12577535, I.Shard, i * 0.8, 18, 2);
      },
      sky(e, t, n, r, i) {
        (_p(e, t, n, r, 14218495, 10, i * 1.6, I.Shard, 0.4),
          yp(e, t, n + 0.4, r, 16777215, 6, i * 1.6, I.PixSnow, 0.4, 0.5),
          mp(e, t, r, i * 1.1, 16777215, I.PixCrack, 1.2),
          e.vfx.ring(t, n, r, i, Ff, 0.35, 0.15, L.Jagged),
          e.shake(0.08, t, r));
      },
    },
  };
var {Ep, Op, zp, mp, z, Rp, V, Dp, Hp, dp, yp, vp, B, _p, Cp, Sp, Tp, fp, bp, Np, Ap, Mp, kp, Jp, qp, Kp, gp, Fp, jp} =
  createMoveEffects({F, I, L, bl, Sl, wl, El, Ll, Vf, k});

export {
  Jp,
  qp,
  Kp,
  gp,
  Ap,
  Fp,
  Np
};
