import {installStylizedMoveVFX} from './stylized-skill-vfx.js';

export function createMoveEffects({F, I, L, bl, Sl, wl, El, Ll, Vf, k}) {
  function Hf(e, t, n, r, i, a, o, s = 0.22, c = 0, l = 16777215) {
    e.vfx.norm.spawn({ x: t, y: n, z: r, life: s, size: a, endSize: o, color: l, shape: i, rot: c });
  }
  function Uf(e, t, n, r, i, a) {
    for (let o = 0; o < i; o++) {
      let i = F.range(0, z);
      e.vfx.lightning(
        t,
        n,
        r,
        t + Math.cos(i) * a,
        n + F.range(-0.4, 0.6),
        r + Math.sin(i) * a,
        V.volt,
        0.18,
        3,
        0.12,
      );
    }
  }
  var Wf = { fire: 16747050, ice: 11071743, volt: 16769594 },
    Gf = {
      "rock-tomb": {
        warn(e, t, n, r, i, a, o) {
          for (let a = 0; a < 3; a++) {
            let s = (a / 3) * z;
            zp(e, t + Math.cos(s) * i * 0.5, n, r + Math.sin(s) * i * 0.5, o, 16777215, I.PixRock, 1.2, 18, 4);
          }
        },
        sky(e, t, n, r, i) {
          for (let a = 0; a < 5; a++) {
            let o = (a / 5) * z,
              s = i * 0.6;
            e.later(a * 0.02, () =>
              e.vfx.norm.spawn({
                x: t + Math.cos(o) * s,
                y: n + 0.6,
                z: r + Math.sin(o) * s,
                vy: 5,
                drag: 7,
                life: 0.9,
                size: 1.2,
                endSize: 1.5,
                color: 16777215,
                shape: I.PixSpike,
              }),
            );
          }
          (_p(e, t, n, r, 16777215, 8, i * 1.2, I.PixRock, 0.4),
            e.vfx.dust(t, n, r, 13154456, 8, i * 1.3),
            e.vfx.ring(t, n, r, i, V.rock, 0.35, 0.15, L.Jagged),
            e.shake(0.08, t, r));
        },
      },
      "stealth-rock": {
        draw(e, t, n, r) {
          let i = Math.sin(e.rot[t] * 2 + t) * 0.15;
          (e.pool.push(e.x[t], e.y[t] + 0.2 + i, e.z[t], n * 0.85, 16777215, I.PixRock, e.rot[t] * 0.6, 0, r),
            e.glow.push(e.x[t], e.y[t] + i, e.z[t], n * 1.1, 14207144, I.Soft, 0, 0, 0.15 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.06 &&
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.2,
              z: r,
              vy: -0.5,
              life: 0.4,
              size: 0.2,
              endSize: 0.12,
              color: 16777215,
              shape: I.PixSand,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          for (let n = 0; n < 8; n++) {
            let o = (n / 8) * z;
            e.vfx.norm.spawn({
              x: t,
              y: a + 0.8,
              z: r,
              vx: Math.cos(o) * i * 2.4,
              vy: F.range(2, 5),
              vz: Math.sin(o) * i * 2.4,
              gravity: 18,
              drag: 1,
              life: 0.5,
              size: 0.5,
              endSize: 0.35,
              color: 16777215,
              shape: I.Shard,
              spin: 8,
            });
          }
          (_p(e, t, a, r, 16777215, 5, i, I.PixRock, 0.35),
            e.vfx.ring(t, a, r, i, V.rock, 0.3, 0.15, L.Jagged));
        },
      },
      "iron-tail": {
        strike(e, t, n, r, i, a, o, s, c) {
          let l = t + i * o * 0.3,
            u = r + a * o * 0.3,
            d = c % 2 ? 1 : -1,
            f = e.player.pos;
          (xp(e, f.x, f.y + 1.6, f.z, l, n + 0.2, u, d * o * 0.4, 0.45, 10135744, 0.16),
            xp(e, f.x, f.y + 1.6, f.z, l, n + 0.2, u, d * o * 0.4, 0.18, 15265528, 0.14),
            e.later(0.08, () => {
              (B(e, l, n + 0.3, u, I.Star, 15266047, 0.4, o * 0.7, 0.16, 0, 0.4),
                vp(e, l, n + 0.3, u, 16773280, 6, 5, I.Square, 0.16, 0.3),
                mp(e, l, u, o * 0.45, 16777215, I.PixCrack, 1, fp(i, a)));
            }));
        },
      },
      "head-smash": {
        dash(e, t, n, r, i, a, o) {
          Tp(e, t, n + 0.9, r, t + i * o, n + 0.9, r + a * o, 14207144, I.Shard, 6, 0.4);
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => {
            let t = e.terrain.height(s, c);
            (Hf(e, s, t + 1, c, I.PixRock, 1.4, 2.4, 0.2),
              e.vfx.ring(s, t, c, 3.2, V.rock, 0.4, 0.15, L.Jagged),
              mp(e, s, c, 3, 16777215, I.PixCrack, 1.4),
              _p(e, s, t, c, 16777215, 10, 5, I.PixRock, 0.45),
              e.vfx.dust(s, t, c, 13154456, 10, 4),
              e.shake(0.15, s, c));
          });
        },
      },
      psywave: {
        draw(e, t, n, r) {
          let i = Math.sin(e.rot[t] * 6) * 0.15;
          (e.glow.push(e.x[t], e.y[t] + 0.4, e.z[t], n * (1.3 + i), V.psy, I.Ring, e.rot[t], 0.2, 0.7 * r),
            e.glow.push(e.x[t], e.y[t] + 0.4, e.z[t], n * (0.9 - i), 12099839, I.Ring, -e.rot[t], 0.2, 0.6 * r),
            e.glow.push(e.x[t], e.y[t] + 0.4, e.z[t], n * 1.5, V.psy, I.Soft, 0, 0, 0.18 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.4 &&
            dp(e).spawn({
              x: t,
              y: n + 0.5,
              z: r,
              vy: 0.8,
              life: 0.35,
              size: 0.3,
              endSize: 0,
              color: 16759024,
              shape: I.Twinkle,
              glow: 0.2,
            });
        },
      },
      nightmare: {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.2, 3809360, I.Soft, 0, 0, 0.9 * r),
            e.pool.push(
              e.x[t],
              e.y[t] + 0.05,
              e.z[t],
              n * 0.8,
              16777215,
              I.PixDragonFire,
              Math.sin(e.rot[t] * 3) * 0.2,
              0,
              r,
            ));
          for (let i of [-1, 1])
            e.glow.push(e.x[t] + i * n * 0.18, e.y[t] + n * 0.15, e.z[t], n * 0.2, 16734888, I.Soft, 0, 0.3, r);
        },
        trail(e, t, n, r) {
          e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vy: 0.4,
            life: 0.4,
            size: 0.5,
            endSize: 0.9,
            color: 3809360,
            shape: I.Soft,
            drag: 2,
          });
        },
        hit(e, t, n, r) {
          (B(e, t, n + 0.6, r, I.Skull, 12618495, 0.4, 1.3, 0.35, 0, 0.3),
            e.vfx.norm.spawn({
              x: t,
              y: n + 1,
              z: r,
              vy: 1,
              life: 0.7,
              size: 0.4,
              endSize: 0.7,
              color: 13144319,
              shape: I.PixSleepZ,
            }));
        },
      },
      "dream-eater": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.5, 10119896, I.Soft, 0, 0.2, 0.4 * r),
            e.pool.push(
              e.x[t],
              e.y[t],
              e.z[t],
              n * 0.9,
              16777215,
              I.PixSleepZ,
              Math.sin(e.rot[t] * 4) * 0.3,
              0,
              r,
            ));
        },
        trail(e, t, n, r) {
          Math.random() < 0.4 && e.vfx.trail(t, n, r, 13148415, 0.3, I.Twinkle, 0.3);
        },
        hit(e, t, n, r) {
          (pp(e, t, n, r, 14199039, 6, I.Twinkle),
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.7,
              z: r,
              vy: 1.5,
              life: 0.6,
              size: 0.4,
              endSize: 0.6,
              color: 10148095,
              shape: I.PixSleepZ,
            }));
        },
      },
      "focus-blast": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.6, V.punch, I.Soft, 0, 0.2, 0.45 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.9, 16762992, I.Soft, 0, 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.2, 16773312, I.Ring, 0, 0.1, 0.6 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.6 &&
            dp(e).spawn({
              x: t,
              y: n,
              z: r,
              life: 0.2,
              size: 0.5,
              endSize: 0,
              color: 16758858,
              shape: I.Soft,
              glow: 0.1,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          e.vfx.flash(t, n, r, 16758858, i * 0.9, 0.14);
          for (let n = 0; n < 2; n++)
            e.later(n * 0.07, () =>
              e.vfx.ring(t, a, r, i * (0.7 + n * 0.3), n ? 16773312 : V.punch, 0.35, 0.15),
            );
          (vp(e, t, n, r, 16762992, 10, i * 2, I.Spark, 0.5, 0.35),
            mp(e, t, r, i, 16777215, I.PixCrack, 1.2),
            e.shake(0.1, t, r));
        },
      },
      "vice-grip": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3;
          (e.vfx.norm.spawn({
            x: s - i * 0.8,
            y: n + 0.6,
            z: c - a * 0.8,
            vx: i * 6,
            vz: a * 6,
            life: 0.14,
            size: o * 0.5,
            endSize: o * 0.42,
            color: 16777215,
            shape: bl.PixPincer,
            rot: -fp(i, a) * 0.2,
          }),
            e.later(0.13, () => {
              (B(e, s, n + 0.5, c, I.Cross, 16769232, 0.4, o * 0.6, 0.14, 0, 0.4),
                yp(e, s, n + 0.4, c, 16777215, 4, 3, I.PixDrop, 0.3, 0.4));
            }));
        },
      },
      liquidation: {
        dash(e, t, n, r, i, a, o) {
          for (let s = 0; s < 10; s++) {
            let c = s / 10;
            e.later(c * 0.12, () => {
              let s = t + i * o * c,
                l = r + a * o * c;
              e.vfx.norm.spawn({
                x: s,
                y: n + 0.9,
                z: l,
                vx: i * 3 - a * F.range(-2, 2),
                vy: F.range(2, 4),
                vz: a * 3 + i * F.range(-2, 2),
                gravity: 14,
                life: 0.4,
                size: 0.4,
                endSize: 0.2,
                color: 16777215,
                shape: I.PixDrop,
              });
            });
          }
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => {
            let t = e.terrain.height(s, c);
            (Hf(e, s, t + 0.9, c, I.PixWave, 1.8, 2.4, 0.24),
              Np(e, s, t + 0.5, c, 2, 1),
              Pp(e, s, t, c, 3, 0.35, fp(i, a), 2.4));
          });
        },
      },
      crabhammer: {
        warn(e, t, n, r, i, a, o) {
          zp(e, t, n, r, o, 16777215, bl.PixPincer, i * 0.7, 14, 3);
        },
        sky(e, t, n, r, i) {
          (Hf(e, t, n + 0.8, r, bl.PixPincer, i * 0.8, i * 0.9, 0.2, Math.PI),
            Np(e, t, n, r, i * 0.8, 1.3),
            Pp(e, t, n, r, i * 1.1, 0.4),
            mp(e, t, r, i * 1.1, 16777215, I.PixCrack, 1.2),
            e.shake(0.1, t, r));
        },
      },
      guillotine: {
        warn(e, t, n, r, i, a, o) {
          e.vfx.telegraph(t, n, r, i, 15224890, o);
          for (let a of [-1, 1])
            e.later(o * 0.4, () =>
              e.vfx.norm.spawn({
                x: t + a * i * 0.9,
                y: n + 1.6,
                z: r,
                vx: (-a * i * 0.9) / (o * 0.6),
                life: o * 0.6,
                size: i * 0.8,
                endSize: i * 0.8,
                color: 16777215,
                shape: bl.PixPincer,
                rot: a > 0 ? Math.PI : 0,
              }),
            );
        },
        sky(e, t, n, r, i) {
          e.vfx.flash(t, n + 1, r, 16765112, i * 1.1, 0.14);
          for (let n = 0; n < 2; n++) mp(e, t, r, i * 1.6, 16777215, I.PixCrack, 1.8, (n * Math.PI) / 2 + 0.6);
          (B(e, t, n + 1, r, I.Cross, 16773344, 0.8, i * 1.4, 0.22, 0, 0.4),
            _p(e, t, n, r, 16777215, 10, i * 1.4, I.PixRock, 0.45),
            e.vfx.ring(t, n, r, i, 15224890, 0.45, 0.15, L.Jagged),
            e.shake(0.3, t, r));
        },
      },
      spark: {
        dash(e, t, n, r, i, a, o) {
          for (let s = 0; s < 6; s++) {
            let c = s / 6;
            e.later(c * 0.12, () => Uf(e, t + i * o * c, n + 0.6, r + a * o * c, 2, 1.2));
          }
          Tp(e, t, n + 0.6, r, t + i * o, n + 0.6, r + a * o, V.volt, I.Bolt, 5, 0.4);
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => {
            (Hf(e, s, n + 1, c, I.PixBolt, 1, 1.8, 0.2),
              e.vfx.ring(s, e.terrain.height(s, c), c, 2.4, V.volt, 0.3, 0.15, L.Dashed));
          });
        },
      },
      electroweb: {
        cone(e, t, n, r, i, a, o, s) {
          if (
            (Math.random() < 0.5 &&
              e.vfx.lightning(
                t,
                n,
                r,
                t + i * s * 0.6 + F.range(-1, 1),
                n + a * s * 0.3,
                r + o * s * 0.6 + F.range(-1, 1),
                V.volt,
                0.12,
                3,
                0.12,
              ),
            Math.random() < 0.12)
          ) {
            let a = t + i * s * 0.9,
              c = r + o * s * 0.9;
            e.vfx.norm.spawn({
              x: a,
              y: n,
              z: c,
              life: 0.4,
              size: 0.6,
              endSize: 1.4,
              color: 16773242,
              shape: I.PixWeb,
              rot: F.range(0, z),
            });
          }
        },
      },
      "rising-voltage": {
        warn(e, t, n, r, i) {
          mp(e, t, r, i, 16773242, I.PixCrack, 0.5);
        },
        sky(e, t, n, r, i) {
          (e.vfx.lightning(t, n, r, t + F.range(-1, 1), n + 14, r + F.range(-1, 1), V.volt, 0.55, 8, 0.28),
            e.vfx.lightning(t, n, r, t, n + 14, r, 16775360, 0.2, 6, 0.2),
            Hf(e, t, n + 1.2, r, I.PixBolt, 1.4, 2.4, 0.2),
            Uf(e, t, n + 0.3, r, 4, i),
            mp(e, t, r, i * 1.1, 16777215, I.PixCrack, 1.2),
            e.vfx.ring(t, n, r, i, V.volt, 0.35, 0.15, L.Dashed),
            e.shake(0.07, t, r));
        },
      },
      discharge: {
        nova(e, t, n, r, i) {
          for (let a = 0; a < 10; a++) {
            let o = (a / 10) * z + F.range(-0.1, 0.1);
            e.vfx.lightning(
              t,
              n + 0.8,
              r,
              t + Math.cos(o) * i,
              n + 0.3,
              r + Math.sin(o) * i,
              V.volt,
              0.3,
              6,
              0.2,
            );
          }
          (e.vfx.flash(t, n + 1, r, V.volt, i * 0.6, 0.12),
            e.vfx.ring(t, n, r, i, V.volt, 0.4, 0.15, L.Dashed),
            vp(e, t, n + 0.6, r, 16775360, 10, i * 2, I.Bolt, 0.5, 0.3));
        },
      },
      barrage: {
        draw(e, t, n, r) {
          e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.15, 16777215, bl.PixEgg, e.rot[t] * 3, 0, r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            dp(e).spawn({
              x: t,
              y: n,
              z: r,
              life: 0.15,
              size: 0.3,
              endSize: 0,
              color: 16773312,
              shape: I.Soft,
              glow: 0.1,
            });
        },
        hit(e, t, n, r) {
          (_p(e, t, n, r, 16774364, 5, 3, I.Shard, 0.25),
            B(e, t, n, r, I.Star, 16773280, 0.35, 1.3, 0.14, 0, 0.4));
        },
      },
      "leech-seed": {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.7, 9071162, I.Soft, 0, 0, r),
            e.pool.push(e.x[t], e.y[t] + n * 0.25, e.z[t], n * 0.6, 16777215, I.PixLeaf, e.rot[t], 0, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 && e.vfx.trail(t, n, r, 12120186, 0.25, I.Twinkle, 0.3);
        },
        hit(e, t, n, r) {
          let i = e.terrain.height(t, r);
          for (let n = 0; n < 3; n++)
            e.vfx.norm.spawn({
              x: t + F.range(-0.4, 0.4),
              y: i + 0.4,
              z: r + F.range(-0.4, 0.4),
              vy: 3,
              drag: 6,
              life: 0.8,
              size: 0.6,
              endSize: 0.8,
              color: 16777215,
              shape: I.PixRoot,
              rot: F.range(-0.3, 0.3),
            });
          pp(e, t, n, r, 10157946, 4, I.Twinkle);
        },
      },
      "seed-bomb": {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.05, 10123834, I.Soft, 0, 0, r),
            e.pool.push(e.x[t] - 0.1, e.y[t] + 0.1, e.z[t], n * 0.55, 8050762, I.Soft, 0, 0, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: -0.5,
              life: 0.4,
              size: 0.3,
              endSize: 0.2,
              color: 16777215,
              shape: I.PixLeaf,
              spin: 4,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          (yp(e, t, a + 0.6, r, 16777215, 12, i * 2.2, I.PixLeaf, 0.5, 0.5, i),
            _p(e, t, a, r, 11040842, 8, i * 1.5, I.Shard, 0.3));
          for (let n = 0; n < 2; n++) Dp(e, t, a + 0.6, r, 1, 10127962, 0.6);
          e.vfx.ring(t, a, r, i, V.leaf, 0.35, 0.15, L.Petals);
        },
      },
      "wood-hammer": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3,
            l = e.terrain.height(s, c);
          (e.vfx.norm.spawn({
            x: s,
            y: l + 3,
            z: c,
            vy: -24,
            life: 0.12,
            size: o * 0.55,
            endSize: o * 0.6,
            color: 13146714,
            shape: I.PixBone,
            rot: fp(i, a) + Math.PI / 2,
          }),
            e.later(0.12, () => {
              (mp(e, s, c, o * 0.7, 16777215, I.PixCrack, 1.3),
                yp(e, s, l + 0.5, c, 16777215, 8, o * 1.6, I.PixLeaf, 0.45, 0.5),
                _p(e, s, l, c, 11040842, 6, 4, I.Shard, 0.3),
                e.vfx.ring(s, l, c, o * 0.7, 10123834, 0.35, 0.15, L.Jagged),
                e.shake(0.1, s, c));
            }));
        },
      },
      "rolling-kick": {
        nova(e, t, n, r, i) {
          for (let t = 0; t < 8; t++)
            e.later(t * 0.02, () => {
              let n = e.player.pos,
                r = (t / 8) * z,
                a = n.x + Math.cos(r) * i * 0.7,
                o = n.z + Math.sin(r) * i * 0.7;
              B(e, a, n.y + 0.8, o, I.Star, 16773312, 0.3, 1, 0.12, 0, 0.3);
            });
          (e.vfx.ring(t, n, r, i, 14203040, 0.35, 0.2, L.Plain), e.vfx.dust(t, n, r, 14207144, 10, i * 1.2));
        },
      },
      "blaze-kick": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3;
          for (let s = 0; s < 8; s++) {
            let c = s / 7 - 0.5,
              l = fp(i, a) + c * 1.4;
            Ep(
              e,
              t + Math.cos(l) * o * 0.5,
              n + 0.6 + c * 0.4,
              r + Math.sin(l) * o * 0.5,
              Math.cos(l) * 3,
              2,
              Math.sin(l) * 3,
              0.35,
              0.9,
              0.3,
            );
          }
          e.later(0.06, () => {
            (B(e, s, n + 0.5, c, I.Star, 16765066, 0.4, o * 0.7, 0.16, 0, 0.4), Op(e, s, n + 0.4, c, 6, 4));
          });
        },
      },
      "jump-kick": {
        dash(e, t, n, r, i, a, o) {
          for (let s = 0; s <= 8; s++) {
            let c = s / 8;
            e.later(c * 0.12, () =>
              dp(e).spawn({
                x: t + i * o * c,
                y: n + 0.8 + Math.sin(c * Math.PI) * 2,
                z: r + a * o * c,
                life: 0.2,
                size: 0.5,
                endSize: 0,
                color: 16767152,
                shape: I.Soft,
                glow: 0.1,
              }),
            );
          }
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => {
            let t = e.terrain.height(s, c);
            (B(e, s, t + 0.8, c, I.Star, 16773312, 0.5, 2.4, 0.2, 0, 0.4),
              mp(e, s, c, 2.2, 16777215, I.PixCrack, 1.1),
              e.vfx.dust(s, t, c, 14207144, 8, 3),
              e.shake(0.08, s, c));
          });
        },
      },
      "high-jump-kick": {
        warn(e, t, n, r, i, a, o) {
          (zp(e, t, n, r, o, 16767152, I.Star, i * 0.5, 20, 2), e.vfx.telegraph(t, n, r, i, 16758858, o));
        },
        sky(e, t, n, r, i) {
          for (let i = 0; i < 6; i++) {
            let a = (i / 6) * z;
            e.vfx.beams.spawn(
              t + Math.cos(a) * 0.5,
              n + 6,
              r + Math.sin(a) * 0.5,
              t,
              n + 0.2,
              r,
              0.12,
              16769216,
              0.14,
            );
          }
          (B(e, t, n + 0.6, r, I.Star, 16769184, 0.6, i * 1.2, 0.2, 0, 0.4),
            mp(e, t, r, i * 1.2, 16777215, I.PixCrack, 1.4),
            _p(e, t, n, r, 16777215, 8, i * 1.3, I.PixRock, 0.4),
            e.vfx.ring(t, n, r, i, V.punch, 0.4, 0.15, L.Jagged),
            e.shake(0.15, t, r));
        },
      },
      "comet-punch": {
        draw(e, t, n, r) {
          e.pool.push(
            e.x[t],
            e.y[t],
            e.z[t],
            n * 1.05,
            16767152,
            I.PixFist,
            Math.atan2(e.vx[t], e.vz[t]) * 0.1,
            0,
            r,
          );
        },
        trail(e, t, n, r) {
          dp(e).spawn({
            x: t,
            y: n,
            z: r,
            life: 0.14,
            size: 0.4,
            endSize: 0,
            color: 16765088,
            shape: I.Soft,
            glow: 0.1,
          });
        },
        hit(e, t, n, r) {
          B(e, t, n, r, I.Star, 16773312, 0.3, 1.2, 0.12, 0, 0.3);
        },
      },
      "ice-punch": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3;
          (Hf(e, s - i * 0.6, n + 0.6, c - a * 0.6, I.PixFist, o * 0.4, o * 0.45, 0.12, 0, 13168895),
            e.later(0.1, () => {
              _p(e, s, n, c, Wf.ice, 6, 4, I.Shard, 0.3);
              for (let t = 0; t < 3; t++)
                e.vfx.norm.spawn({
                  x: s,
                  y: n + 0.6,
                  z: c,
                  vx: F.range(-2, 2),
                  vy: F.range(1, 3),
                  vz: F.range(-2, 2),
                  drag: 2,
                  life: 0.6,
                  size: 0.4,
                  endSize: 0.3,
                  color: 16777215,
                  shape: I.PixSnow,
                  spin: 3,
                });
              B(e, s, n + 0.5, c, I.Star, 14219519, 0.4, o * 0.6, 0.16, 0, 0.3);
            }));
        },
      },
      "drain-punch": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3;
          (Hf(e, s - i * 0.6, n + 0.6, c - a * 0.6, I.PixFist, o * 0.4, o * 0.45, 0.12, 0, 13172656),
            e.later(0.1, () => {
              (B(e, s, n + 0.5, c, I.Star, 14221248, 0.4, o * 0.6, 0.16, 0, 0.3),
                pp(e, s, n + 0.6, c, 10157946, 5, I.Twinkle));
            }));
        },
      },
      "focus-punch": {
        warn(e, t, n, r, i, a, o) {
          (zp(e, t, n, r, o, 16763024, I.PixFist, i * 0.7, 20, 4), e.vfx.telegraph(t, n, r, i, V.punch, o));
        },
        sky(e, t, n, r, i) {
          (Hp(e, t, n, r, 1.8, V.punch, 16773328), Hf(e, t, n + 1, r, I.PixFist, i * 0.6, i * 0.8, 0.22));
          for (let a = 0; a < 3; a++)
            e.later(a * 0.06, () =>
              e.vfx.ring(t, n, r, i * (0.6 + a * 0.25), a === 1 ? 16773312 : V.punch, 0.4, 0.15, L.Jagged),
            );
          (mp(e, t, r, i * 1.3, 16777215, I.PixCrack, 1.6),
            _p(e, t, n, r, 16777215, 10, i * 1.4, I.PixRock, 0.45),
            e.shake(0.25, t, r));
        },
      },
      "wring-out": {
        strike(e, t, n, r, i, a, o) {
          let s = e.player.pos,
            c = t + i * o * 0.3,
            l = r + a * o * 0.3;
          (xp(e, s.x, s.y + 1, s.z, c, n + 0.5, l, F.range(-1, 1) * o * 0.3, 0.3, 16747184, 0.18),
            xp(e, s.x, s.y + 1, s.z, c, n + 0.5, l, F.range(-1, 1) * o * 0.2, 0.12, 16765152, 0.16),
            e.later(0.1, () => {
              (e.vfx.ring(c, n, l, o * 0.35, 16747184, 0.3, 0.3),
                B(e, c, n + 0.6, l, I.Heart, 16751296, 0.3, 1.2, 0.25, 0, 0.3));
            }));
        },
      },
      snore: {
        nova(e, t, n, r, i) {
          bp(e, t, n, r, 13154559, 10, i * 2.2, I.Sound, 1.6, 0.42);
          for (let i = 0; i < 3; i++)
            e.vfx.norm.spawn({
              x: t + F.range(-0.5, 0.5),
              y: n + 2,
              z: r + F.range(-0.5, 0.5),
              vx: F.range(-1, 1),
              vy: 1.5,
              vz: F.range(-1, 1),
              life: 0.9,
              size: 0.6,
              endSize: 1.1,
              color: 10148095,
              shape: I.PixSleepZ,
            });
          (e.vfx.ring(t, n, r, i, 12101864, 0.35, 0.15, L.Ripple), e.shake(0.06));
        },
      },
      strength: {
        dash(e, t, n, r, i, a, o) {
          e.vfx.dust(t, n, r, 14207144, 10, 4);
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => {
            let t = e.terrain.height(s, c);
            (B(e, s, t + 1, c, I.Star, 16771248, 0.6, 2.6, 0.2, 0, 0.4),
              e.vfx.ring(s, t, c, 2.8, 14207144, 0.35, 0.15, L.Jagged),
              _p(e, s, t, c, 16777215, 6, 4, I.PixRock, 0.35),
              e.shake(0.1, s, c));
          });
        },
      },
      "heavy-slam": {
        warn(e, t, n, r, i, a, o) {
          (e.vfx.telegraph(t, n, r, i, 16747184, o),
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.1,
              z: r,
              life: o,
              size: i * 0.4,
              endSize: i * 1.4,
              color: 5913162,
              shape: I.Soft,
            }));
        },
        sky(e, t, n, r, i) {
          (e.vfx.flash(t, n + 1, r, 16765152, i, 0.12),
            mp(e, t, r, i * 1.4, 16777215, I.PixCrack, 1.6),
            e.vfx.ring(t, n, r, i, 16747184, 0.45, 0.15, L.Jagged),
            e.vfx.dust(t, n, r, 14207144, 14, i * 1.5),
            _p(e, t, n, r, 16777215, 8, i * 1.2, I.PixRock, 0.4),
            e.shake(0.2, t, r));
        },
      },
    },
    Kf = 11047096,
    qf = 6969976,
    Jf = 16754888,
    Yf = 2783850,
    Xf = 4892810,
    Zf = 1975360,
    Qf = 15251530,
    $f = 16726602,
    ep = {
      smog: {
        cone(e, t, n, r, i, a, o, s, c) {
          if (Math.random() < 0.35) return;
          let l = Math.sqrt(c / 7);
          (e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vx: i * 0.8 + F.range(-1, 1),
            vy: a * 0.3 + F.range(0, 0.6),
            vz: o * 0.8 + F.range(-1, 1),
            drag: 1,
            life: s * 1.1,
            size: 0.6,
            endSize: 1.8 * l,
            color: Kf,
            endColor: qf,
            shape: I.PixPuff,
          }),
            Math.random() < 0.12 &&
              e.vfx.norm.spawn({
                x: t + i * s * 0.5,
                y: n + 0.3,
                z: r + o * s * 0.5,
                vy: 0.6,
                life: 0.6,
                size: 0.3,
                endSize: 0.5,
                color: 16777215,
                shape: I.PixToxic,
              }));
        },
      },
      "clear-smog": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.5, 14213360, I.Soft, 0, 0.1, 0.35 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.05, 15265012, I.PixPuff, e.rot[t], 0, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.5 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: 0.4,
              life: 0.5,
              size: 0.4,
              endSize: 0.8,
              color: 14212328,
              shape: I.PixPuff,
              drag: 1.5,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          for (let n = 0; n < 12; n++) {
            let o = (n / 12) * z;
            e.vfx.norm.spawn({
              x: t,
              y: a + 0.8,
              z: r,
              vx: Math.cos(o) * i * 2,
              vy: F.range(0.3, 1),
              vz: Math.sin(o) * i * 2,
              drag: 2.5,
              life: 0.7,
              size: 0.9,
              endSize: 1.8,
              color: 15265012,
              endColor: 12107984,
              shape: I.PixPuff,
            });
          }
          e.vfx.ring(t, a, r, i, 13160680, 0.35, 0.15, L.Ripple);
        },
      },
      "self-destruct": {
        nova(e, t, n, r, i) {
          e.vfx.flash(t, n + 1, r, 16763002, i * 0.9, 0.12);
          for (let a = 0; a < 16; a++) {
            let o = (a / 16) * z;
            Ep(e, t, n + 0.7, r, Math.cos(o) * i * 2.4, F.range(1, 3), Math.sin(o) * i * 2.4, 0.4, 1.1, 0.3, 3);
          }
          for (let i = 0; i < 6; i++) Dp(e, t + F.range(-1, 1), n + 1, r + F.range(-1, 1), 1.4, Kf, 0.9);
          (e.vfx.ring(t, n, r, i, 13656090, 0.4, 0.15, L.Flames),
            mp(e, t, r, i * 0.8, 2759188, I.Soft, 1.6),
            e.shake(0.14));
        },
      },
      explosion: {
        warn(e, t, n, r, i, a, o) {
          (zp(e, t, n, r, o, Kf, I.PixPuff, i * 0.55, 18, 4), e.vfx.telegraph(t, n, r, i, 16742954, o));
        },
        sky(e, t, n, r, i) {
          e.vfx.flash(t, n + 1.5, r, 16765050, i * 1.4, 0.18);
          for (let a = 0; a < 3; a++)
            e.later(a * 0.06, () =>
              e.vfx.ring(t, n, r, i * (0.6 + a * 0.25), a === 1 ? 16756794 : 13647898, 0.45, 0.15, L.Flames),
            );
          for (let a = 0; a < 24; a++) {
            let a = F.range(0, z),
              o = F.range(i, i * 2.4);
            Ep(e, t, n + 0.6, r, Math.cos(a) * o, F.range(2, 7), Math.sin(a) * o, 0.55, 1.4, 0.4, 2.5);
          }
          for (let a = 0; a < 8; a++)
            Dp(e, t + F.range(-i, i) * 0.4, n + 1.2, r + F.range(-i, i) * 0.4, 2, 6969962, 1.2);
          (_p(e, t, n, r, 16777215, 10, i * 1.4, I.PixRock, 0.45),
            Op(e, t, n + 0.5, r, 10, 7),
            mp(e, t, r, i * 1.3, 16777215, I.PixCrack, 2),
            e.shake(0.35, t, r));
        },
      },
      "smack-down": {
        draw(e, t, n, r) {
          e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.2, 16777215, I.PixRock, e.rot[t] * 2, 0, r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.35 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: -0.5,
              life: 0.3,
              size: 0.35,
              endSize: 0.7,
              color: 14207144,
              shape: I.PixPuff,
            });
        },
        hit(e, t, n, r) {
          (_p(e, t, n, r, 16777215, 4, 3, I.PixRock, 0.3),
            B(e, t, n, r, I.Star, 16773312, 0.4, 1.4, 0.14, 0, 0.4));
        },
      },
      "rock-blast": {
        draw(e, t, n, r) {
          e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.05, 16777215, I.PixRock, e.rot[t] * 3, 0, r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.25 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              life: 0.2,
              size: 0.25,
              endSize: 0.45,
              color: 14207144,
              shape: I.PixPuff,
            });
        },
        hit(e, t, n, r) {
          _p(e, t, n, r, 16777215, 3, 2.5, I.PixRock, 0.22);
        },
      },
      "high-horsepower": {
        dash(e, t, n, r, i, a, o) {
          for (let n = 0; n < 8; n++) {
            let s = n / 8;
            e.later(s * 0.13, () => {
              let c = t + i * o * s,
                l = r + a * o * s;
              (e.vfx.dust(c, e.terrain.height(c, l), l, 13150328, 3, 2.5),
                n % 2 == 0 &&
                  mp(
                    e,
                    c - a * (n % 4 ? 0.5 : -0.5),
                    l + i * (n % 4 ? 0.5 : -0.5),
                    1.1,
                    16777215,
                    I.PixCrack,
                    1,
                    fp(i, a),
                  ));
            });
          }
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => {
            let t = e.terrain.height(s, c);
            (e.vfx.ring(s, t, c, 2.8, 13150328, 0.35, 0.15, L.Jagged),
              _p(e, s, t, c, 16777215, 6, 4, I.PixRock, 0.35),
              e.shake(0.1, s, c));
          });
        },
      },
      "rock-wrecker": {
        warn(e, t, n, r, i, a, o) {
          (zp(e, t, n, r, o, 16777215, I.PixRock, i * 0.7, 24, 6), e.vfx.telegraph(t, n, r, i, 13150328, o));
        },
        sky(e, t, n, r, i) {
          _p(e, t, n, r, 16777215, 16, i * 1.6, I.PixRock, 0.6);
          for (let a = 0; a < 6; a++) {
            let o = (a / 6) * z + F.range(-0.2, 0.2),
              s = i * F.range(0.3, 0.7);
            e.later(a * 0.02, () =>
              e.vfx.norm.spawn({
                x: t + Math.cos(o) * s,
                y: n + 0.6,
                z: r + Math.sin(o) * s,
                vy: 5,
                drag: 6,
                life: 0.8,
                size: F.range(1.2, 1.7),
                endSize: 1.1,
                color: 16777215,
                shape: I.PixSpike,
              }),
            );
          }
          (mp(e, t, r, i * 1.3, 16777215, I.PixCrack, 2), e.vfx.dust(t, n, r, 13154456, 16, i * 1.5));
          for (let a = 0; a < 2; a++)
            e.later(a * 0.08, () =>
              e.vfx.ring(t, n, r, i * (0.7 + a * 0.3), a ? 14207144 : 11047018, 0.45, 0.15, L.Jagged),
            );
          e.shake(0.3, t, r);
        },
      },
      "sweet-kiss": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.5, Jf, I.Soft, 0, 0.2, 0.3 * r),
            e.pool.push(
              e.x[t],
              e.y[t] + Math.sin(e.rot[t] * 3) * 0.12,
              e.z[t],
              n * 1.1,
              16777215,
              I.PixHeart,
              Math.sin(e.rot[t] * 2) * 0.3,
              0,
              r,
            ));
        },
        trail(e, t, n, r) {
          Math.random() < 0.35 && e.vfx.trail(t, n, r, 16763104, 0.25, I.Heart, 0.35);
        },
        hit(e, t, n, r) {
          (B(e, t, n + 0.6, r, I.Swirl, 16763112, 0.3, 1.1, 0.35, 0, 0.3),
            vp(e, t, n, r, Jf, 4, 2.5, I.Heart, 0.35, 0.35));
        },
      },
      "echoed-voice": {
        draw(e, t, n, r) {
          let i = -Math.atan2(e.vz[t], e.vx[t]);
          (e.glow.push(e.x[t], e.y[t] + 0.4, e.z[t], n * 1.4, 16751312, I.Sound, i, 0.3, 0.9 * r),
            e.glow.push(e.x[t], e.y[t] + 0.4, e.z[t], n * 0.9, 16777215, I.Sound, i, 0.2, 0.6 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.2 &&
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.8,
              z: r,
              vy: 1,
              life: 0.6,
              size: 0.4,
              endSize: 0.5,
              color: 16777215,
              shape: I.PixNote,
              rot: F.range(-0.3, 0.3),
            });
        },
      },
      "egg-bomb": {
        draw(e, t, n, r) {
          e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.15, 16777215, Sl.PixEgg, e.rot[t] * 1.5, 0, r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            e.vfx.add.spawn({
              x: t,
              y: n,
              z: r,
              life: 0.25,
              size: 0.25,
              endSize: 0,
              color: 16769260,
              shape: I.Twinkle,
              glow: 0.2,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          (_p(e, t, n, r, 16774376, 10, i * 1.6, I.Shard, 0.4),
            yp(e, t, a + 0.6, r, 16777215, 8, i * 2, I.PixStar, 0.5, 0.5),
            e.vfx.flash(t, n, r, 16773336, i * 0.8, 0.1),
            e.vfx.ring(t, a, r, i, Jf, 0.35, 0.15, L.Petals));
        },
      },
      boomburst: {
        nova(e, t, n, r, i) {
          bp(e, t, n, r, 16751312, 16, i * 2.4, I.Sound, 2, 0.45);
          for (let a = 0; a < 3; a++)
            e.later(a * 0.07, () =>
              e.vfx.ring(t, n, r, i * (0.5 + a * 0.25), a === 1 ? 16777215 : 16751312, 0.4, 0.15, L.Ripple),
            );
          (yp(e, t, n + 1.2, r, 16777215, 10, i * 2, I.PixNote, 0.6, 0.55), e.shake(0.18));
        },
      },
      bind: {
        strike(e, t, n, r, i, a, o) {
          let s = e.player.pos,
            c = t + i * o * 0.3,
            l = r + a * o * 0.3;
          (xp(e, s.x, s.y + 1, s.z, c, n + 0.6, l, F.range(-1.2, 1.2), 0.18, Yf, 0.2),
            e.later(0.08, () => {
              for (let t = 0; t < 10; t++) {
                let r = (t / 10) * z * 1.5,
                  i = ((t + 1) / 10) * z * 1.5,
                  a = o * 0.22;
                e.vfx.beams.spawn(
                  c + Math.cos(r) * a,
                  n + 0.2 + t * 0.09,
                  l + Math.sin(r) * a,
                  c + Math.cos(i) * a,
                  n + 0.29 + t * 0.09,
                  l + Math.sin(i) * a,
                  0.14,
                  t % 2 ? Yf : Xf,
                  0.3,
                );
              }
              yp(e, c, n + 0.6, l, 16777215, 3, 2, I.PixLeaf, 0.3, 0.4);
            }));
        },
      },
      "giga-drain": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.7, V.leaf, I.Soft, 0, 0.25, 0.4 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.05, 16777215, I.PixLeaf, e.rot[t] * 2, 0, r),
            Rp(e, t, n, r, I.Twinkle, 12124042, 3, n * 0.6));
        },
        trail(e, t, n, r) {
          Math.random() < 0.45 && e.vfx.trail(t, n, r, 10157946, 0.3, I.Twinkle, 0.3);
        },
        hit(e, t, n, r) {
          (pp(e, t, n, r, 10157946, 7, I.Twinkle), B(e, t, n, r, I.Ring, 12124042, 0.3, 1.4, 0.2, 0, 0.3));
        },
      },
      "grass-knot": {
        warn(e, t, n, r, i) {
          mp(e, t, r, i * 0.9, 3836474, I.Ring, 0.4);
        },
        sky(e, t, n, r, i) {
          for (let a = 0; a < 6; a++) {
            let o = (a / 6) * z;
            e.vfx.norm.spawn({
              x: t + Math.cos(o) * i * 0.5,
              y: n + 0.3,
              z: r + Math.sin(o) * i * 0.5,
              vx: -Math.cos(o) * 3,
              vy: 5,
              vz: -Math.sin(o) * 3,
              drag: 4,
              life: 0.5,
              size: 0.9,
              endSize: 0.6,
              color: 16777215,
              shape: I.PixLeaf,
              spin: 6,
            });
          }
          (xp(e, t - i * 0.5, n + 0.1, r, t + i * 0.5, n + 0.1, r, i * 0.6, 0.18, V.leafDark, 0.4),
            e.vfx.dust(t, n, r, 13154456, 6, i),
            B(e, t, n + 1, r, I.Star, 14221232, 0.4, i, 0.18, 0, 0.4),
            e.shake(0.05, t, r));
        },
      },
      "solar-blade": {
        beam(e, t, n, r, i, a, o, s) {
          (Cp(e, t, n, r, i, a, o, s * 0.75, 10149962, V.sun),
            Tp(e, t, n, r, i, a, o, 12124010, I.Leaf, 2, 0.45),
            Math.random() < 0.3 &&
              e.vfx.norm.spawn({
                x: i,
                y: a,
                z: o,
                vx: F.range(-2, 2),
                vy: F.range(1, 3),
                vz: F.range(-2, 2),
                life: 0.5,
                size: 0.5,
                endSize: 0.3,
                color: 16777215,
                shape: I.PixLeaf,
                spin: 6,
              }));
        },
      },
      "dizzy-punch": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.25,
            c = r + a * o * 0.25;
          (e.vfx.norm.spawn({
            x: s - i,
            y: n + 0.6,
            z: c - a,
            vx: i * 10,
            vz: a * 10,
            life: 0.1,
            size: o * 0.4,
            endSize: o * 0.45,
            color: 16769216,
            shape: I.PixFist,
            rot: fp(i, a) * 0.1,
          }),
            e.later(0.1, () => {
              B(e, s, n + 0.6, c, I.Star, 16773280, 0.4, o * 0.7, 0.16, 0, 0.4);
              for (let t = 0; t < 3; t++) {
                let r = (t / 3) * z;
                dp(e).spawn({
                  x: s + Math.cos(r) * 0.6,
                  y: n + 1.6,
                  z: c + Math.sin(r) * 0.6,
                  vx: -Math.sin(r) * 3,
                  vz: Math.cos(r) * 3,
                  life: 0.5,
                  size: 0.4,
                  endSize: 0.2,
                  color: 16771178,
                  shape: I.Star,
                  glow: 0.2,
                });
              }
            }));
        },
      },
      "mega-kick": {
        dash(e, t, n, r, i, a, o) {
          Tp(e, t, n + 0.8, r, t + i * o, n + 0.8, r + a * o, 16769184, I.Spark, 6, 0.4);
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => {
            let t = e.terrain.height(s, c);
            (e.vfx.norm.spawn({
              x: s,
              y: t + 1,
              z: c,
              life: 0.2,
              size: 2,
              endSize: 2.4,
              color: 16767152,
              shape: I.PixFist,
              rot: fp(i, a) * 0.1,
            }),
              B(e, s, t + 1, c, I.Star, 16769162, 0.8, 2.8, 0.2, 0, 0.5),
              e.vfx.ring(s, t, c, 2.6, 14200968, 0.35, 0.15, L.Jagged),
              e.shake(0.1, s, c));
          });
        },
      },
      reversal: {
        nova(e, t, n, r, i) {
          for (let t = 0; t < 8; t++)
            e.later(t * 0.03, () => {
              let n = e.player.pos,
                r = (t / 8) * z,
                a = i * 0.6;
              e.vfx.norm.spawn({
                x: n.x + Math.cos(r) * a,
                y: n.y + 0.9,
                z: n.z + Math.sin(r) * a,
                vx: Math.cos(r) * 5,
                vz: Math.sin(r) * 5,
                life: 0.16,
                size: t % 2 ? 0.7 : 1.2,
                endSize: t % 2 ? 0.8 : 1.4,
                color: 16765104,
                shape: I.PixFist,
                rot: r,
              });
            });
          for (let a = 0; a < 2; a++)
            e.later(a * 0.08, () =>
              e.vfx.ring(t, n, r, i * (0.6 + a * 0.4), a ? 16756848 : 13650490, 0.4, 0.15, L.Jagged),
            );
          (e.vfx.dust(t, n, r, 14207144, 8, i), e.shake(0.12));
        },
      },
      "mega-punch": {
        warn(e, t, n, r, i, a, o) {
          (zp(e, t, n, r, o, 16767152, I.PixFist, i * 0.65, 20, 4), e.vfx.telegraph(t, n, r, i, 14191194, o));
        },
        sky(e, t, n, r, i) {
          (e.vfx.flash(t, n + 1, r, 16769200, i, 0.14),
            mp(e, t, r, i * 1.2, 16777215, I.PixCrack, 1.8),
            _p(e, t, n, r, 16777215, 8, i * 1.3, I.PixRock, 0.4));
          for (let a = 0; a < 2; a++)
            e.later(a * 0.08, () =>
              e.vfx.ring(t, n, r, i * (0.6 + a * 0.4), a ? 16769184 : 14191194, 0.4, 0.15, L.Jagged),
            );
          (e.later(0.14, () => {
            (B(e, t + 0.8, n + 0.8, r, I.Fist, 16769216, 1, 1.8, 0.18, 0, 0.3), e.shake(0.06, t, r));
          }),
            e.shake(0.25, t, r));
        },
      },
      "snipe-shot": {
        draw(e, t, n, r) {
          let i = Math.hypot(e.vx[t], e.vz[t]) || 1,
            a = e.vx[t] / i,
            o = e.vz[t] / i;
          for (let i = 4; i >= 0; i--)
            e.pool.push(
              e.x[t] - a * i * n * 0.3,
              e.y[t],
              e.z[t] - o * i * n * 0.3,
              n * (0.75 - i * 0.11),
              16777215,
              I.PixWaterBlob,
              0,
              0,
              r * (1 - i * 0.12),
            );
          e.pool.push(
            e.x[t] + a * n * 0.1,
            e.y[t],
            e.z[t] + o * n * 0.1,
            n * 0.4,
            16777215,
            I.PixFoam,
            0,
            0,
            r,
          );
        },
        trail(e, t, n, r) {
          Math.random() < 0.35 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: F.range(0, 1),
              gravity: 14,
              life: 0.3,
              size: 0.2,
              endSize: 0.1,
              color: 16777215,
              shape: I.PixDrop,
              rot: 0,
            });
        },
        hit(e, t, n, r) {
          Np(e, t, n, r, 0.7, 0.6);
        },
      },
      octazooka: {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.1, 16777215, Sl.PixInk, e.rot[t] * 1.5, 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.3, 3820170, I.Soft, 0, 0, 0.2 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.5 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: -1,
              gravity: 8,
              life: 0.35,
              size: 0.3,
              endSize: 0.15,
              color: Zf,
              shape: I.Drop,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          e.vfx.groundN.spawn({
            x: t,
            y: a + 0.09,
            z: r,
            life: 2,
            size: i * 1.5,
            endSize: i * 1.6,
            color: 16777215,
            shape: Sl.PixInk,
            rot: F.range(0, z),
          });
          for (let n = 0; n < 10; n++) {
            let n = F.range(0, z),
              o = F.range(2, i * 2);
            e.vfx.norm.spawn({
              x: t,
              y: a + 0.5,
              z: r,
              vx: Math.cos(n) * o,
              vy: F.range(3, 7),
              vz: Math.sin(n) * o,
              gravity: 20,
              life: 0.6,
              size: 0.35,
              endSize: 0.2,
              color: Zf,
              shape: I.Drop,
            });
          }
          for (let n = 0; n < 3; n++) Dp(e, t, a + 0.6, r, 1.2, 3816026, 0.8);
          e.vfx.ring(t, a, r, i, 3820170, 0.35);
        },
      },
      "scale-shot": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.2, V.dragon, I.Soft, 0, 0.1, 0.3 * r),
            e.pool.push(
              e.x[t],
              e.y[t],
              e.z[t],
              n * 0.95,
              9091327,
              I.Shard,
              Math.atan2(e.vx[t], e.vz[t]),
              0,
              r,
            ));
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            dp(e).spawn({
              x: t,
              y: n,
              z: r,
              life: 0.15,
              size: 0.25,
              endSize: 0,
              color: 11061503,
              shape: I.Twinkle,
              glow: 0.2,
            });
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Twinkle, 13162751, 0.3, 1.1, 0.12, 0, 0.3),
            _p(e, t, n, r, 9091327, 2, 2, I.Shard, 0.2));
        },
      },
      "hydro-cannon": {
        beam(e, t, n, r, i, a, o, s) {
          Fp(e, t, n, r, i, a, o, s * 1.05, 1.35);
        },
      },
      "aqua-cutter": {
        draw(e, t, n, r) {
          let i = e.rot[t] * 6;
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.5, 16777215, I.PixWaterArc, i, 0, r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.5, 16777215, I.PixWaterArc, i + Math.PI, 0, r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.45, 16777215, I.PixWaterBlob, 0, 0, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.5 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: F.range(-1, 1),
              vy: F.range(0, 2),
              vz: F.range(-1, 1),
              gravity: 10,
              life: 0.35,
              size: 0.25,
              endSize: 0.12,
              color: 16777215,
              shape: I.PixDrop,
              rot: 0,
            });
        },
        hit(e, t, n, r) {
          (e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            life: 0.16,
            size: 1,
            endSize: 1.8,
            color: 16777215,
            shape: I.PixWaterArc,
            rot: F.range(0, z),
          }),
            Np(e, t, n, r, 0.7, 0.6));
        },
      },
      "smart-strike": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.3, 13162736, I.Soft, 0, 0.1, 0.3 * r),
            e.pool.push(
              e.x[t],
              e.y[t],
              e.z[t],
              n * 1.15,
              14739711,
              I.PixHorn,
              -Math.atan2(e.vz[t], e.vx[t]) + Math.PI * 0.75,
              0,
              r,
            ));
        },
        trail(e, t, n, r) {
          dp(e).spawn({
            x: t,
            y: n,
            z: r,
            life: 0.14,
            size: 0.3,
            endSize: 0,
            color: 14214399,
            shape: I.Soft,
            glow: 0.1,
          });
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Twinkle, 16777215, 0.4, 1.4, 0.14, 0, 0.4),
            vp(e, t, n, r, V.steel, 4, 3, I.Spark, 0.3, 0.25));
        },
      },
      "horn-leech": {
        dash(e, t, n, r, i, a, o) {
          e.vfx.norm.spawn({
            x: t + i,
            y: n + 1,
            z: r + a,
            vx: (i * o) / 0.15,
            vz: (a * o) / 0.15,
            life: 0.15,
            size: 1.8,
            endSize: 2,
            color: 16769232,
            shape: I.PixHorn,
            rot: -fp(i, a) + Math.PI * 0.75,
          });
          for (let s = 0; s < 8; s++) {
            let c = s / 8;
            e.later(c * 0.13, () =>
              e.vfx.norm.spawn({
                x: t + i * o * c,
                y: n + 0.8,
                z: r + a * o * c,
                vx: F.range(-2, 2),
                vy: F.range(2, 4),
                vz: F.range(-2, 2),
                gravity: 14,
                life: 0.4,
                size: 0.35,
                endSize: 0.2,
                color: 16777215,
                shape: I.PixDrop,
              }),
            );
          }
          let s = t + i * o,
            c = r + a * o;
          e.later(0.14, () => {
            (pp(e, s, n + 1, c, 10157946, 5, I.Twinkle),
              B(e, s, n + 1, c, I.Star, 14221264, 0.5, 2, 0.18, 0, 0.4));
          });
        },
      },
      "fishious-rend": {
        strike(e, t, n, r, i, a, o, s, c) {
          let l = t + i * o * 0.3,
            u = r + a * o * 0.3;
          for (let t of [-1, 1])
            e.vfx.norm.spawn({
              x: l,
              y: n + 0.6 + t * 0.9,
              z: u,
              vy: -t * 8,
              life: 0.11,
              size: o * 0.35,
              endSize: o * 0.35,
              color: 16777215,
              shape: I.PixFang,
              rot: t > 0 ? Math.PI : 0,
            });
          e.later(0.11, () => {
            (e.vfx.norm.spawn({
              x: l,
              y: n + 0.6,
              z: u,
              life: 0.2,
              size: o * 0.6,
              endSize: o * 0.75,
              color: 16777215,
              shape: I.PixWave,
              rot: c % 2 ? 0.3 : -0.3,
            }),
              yp(e, l, n + 0.6, u, 16777215, 6, 4, I.PixDrop, 0.3, 0.4),
              e.shake(0.04, l, u));
          });
        },
      },
      "water-shuriken": {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.3, 16777215, I.PixWaterSwirl, e.rot[t] * 10, 0, r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.05, 11065599, I.Star, e.rot[t] * 10, 0.2, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.4 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: -0.5,
              gravity: 6,
              life: 0.3,
              size: 0.2,
              endSize: 0.1,
              color: 16777215,
              shape: I.PixDrop,
            });
        },
        hit(e, t, n, r) {
          Np(e, t, n, r, 0.6, 0.5);
        },
      },
      "confuse-ray": {
        draw(e, t, n, r) {
          let i = e.rot[t] * 3,
            a = [16743128, 8050943, 16771178][Math.floor(i) % 3];
          (e.glow.push(
            e.x[t] + Math.sin(i * 2) * 0.15,
            e.y[t] + Math.cos(i * 3) * 0.12,
            e.z[t],
            n * 1.4,
            a,
            I.Wisp,
            i,
            0.3,
            0.8 * r,
          ),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 0.5, 16777215, I.Soft, 0, 0.5, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.4 &&
            dp(e).spawn({
              x: t,
              y: n,
              z: r,
              life: 0.3,
              size: 0.3,
              endSize: 0,
              color: 14199039,
              shape: I.Twinkle,
              glow: 0.2,
            });
        },
        hit(e, t, n, r) {
          B(e, t, n + 0.7, r, I.Swirl, 15255807, 0.3, 1.2, 0.35, 0, 0.3);
        },
      },
      "mirror-shot": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.5, 14215423, I.Soft, 0, 0.2, 0.35 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.9, 13687016, I.Gem, e.rot[t] * 2, 0, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.4 &&
            dp(e).spawn({
              x: t,
              y: n,
              z: r,
              life: 0.2,
              size: 0.3,
              endSize: 0,
              color: 16777215,
              shape: I.Twinkle,
              glow: 0.2,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          (e.vfx.flash(t, n, r, 15266047, i, 0.12),
            _p(e, t, n, r, 14214399, 8, i * 1.6, I.Shard, 0.35),
            vp(e, t, n, r, 16777215, 8, i * 2, I.Twinkle, 0.45, 0.35),
            e.vfx.ring(t, a, r, i, V.steel, 0.35));
        },
      },
      "photon-geyser": {
        beam(e, t, n, r, i, a, o, s) {
          (Cp(e, t, n, r, i, a, o, s * 0.9, Qf, 16773312),
            e.vfx.beams.spawn(t, n, r, i, a, o, s * 0.25, $f, 0.05),
            Sp(e, t, n, r, i, a, o, [Qf, $f], s * 1.6, 1),
            Math.random() < 0.25 && Hp(e, i, e.terrain.height(i, o), o, 0.8, Qf, 16773312));
        },
      },
    },
    tp = 11071743,
    np = 16769594,
    rp = 16747208,
    ip = 5941488,
    ap = {
      barrier: {
        orbit(e, t, n, r, i, a) {
          (e.orbitals.push(t, n, r, a * 1.3, 16777215, wl.PixPane, Math.sin(i * 2) * 0.1, 0),
            e.orbitalsGlow.push(t, n, r, a * 1.8, 12577535, I.Soft, 0, 0.2, 0.3),
            Math.random() < 0.15 && e.vfx.trail(t, n + 0.4, r, 16777215, 0.3, I.Twinkle, 0.3));
        },
      },
      "light-screen": {
        draw(e, t, n, r) {
          let i = Math.hypot(e.vx[t], e.vz[t]) || 1,
            a = -e.vz[t] / i,
            o = e.vx[t] / i;
          for (let i = -1; i <= 1; i++)
            e.pool.push(
              e.x[t] + a * i * n * 0.75,
              e.y[t] + 0.3,
              e.z[t] + o * i * n * 0.75,
              n * 0.8,
              16777215,
              wl.PixPane,
              0,
              0,
              r * 0.9,
            );
          e.glow.push(e.x[t], e.y[t] + 0.3, e.z[t], n * 2.2, 14218495, I.Soft, 0, 0.1, 0.25 * r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            dp(e).spawn({
              x: t + F.range(-1, 1),
              y: n + F.range(0, 1.2),
              z: r + F.range(-1, 1),
              life: 0.25,
              size: 0.35,
              endSize: 0,
              color: 16777215,
              shape: I.Twinkle,
              glow: 0.2,
            });
        },
      },
      "trick-room": {
        draw(e, t, n, r) {
          let i = e.rot[t];
          for (let a = 0; a < 4; a++) {
            let o = i * 1.4 + (a / 4) * z;
            e.pool.push(
              e.x[t] + Math.cos(o) * n * 0.7,
              e.y[t],
              e.z[t] + Math.sin(o) * n * 0.7,
              n * 0.6,
              16777215,
              wl.PixPane,
              0,
              0,
              r * 0.85,
            );
          }
          e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.1, 12618495, I.Swirl, -i * 2, 0.3, 0.6 * r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            dp(e).spawn({
              x: t,
              y: n,
              z: r,
              life: 0.3,
              size: 0.4,
              endSize: 1,
              color: 14203135,
              shape: I.Ring,
              glow: 0.1,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          for (let n = 0; n < 10; n++) {
            let o = (n / 10) * z;
            e.vfx.norm.spawn({
              x: t,
              y: a + 1,
              z: r,
              vx: Math.cos(o) * i * 2,
              vy: F.range(2, 5),
              vz: Math.sin(o) * i * 2,
              gravity: 14,
              life: 0.55,
              size: 0.5,
              endSize: 0.3,
              color: 14218495,
              shape: I.Shard,
              spin: F.range(-8, 8),
            });
          }
          for (let n = 0; n < 3; n++)
            e.later(n * 0.07, () =>
              e.vfx.ring(t, a, r, i * (1 - n * 0.25), n === 1 ? 16759024 : 10119896, 0.4, 0.6, L.Runes),
            );
          e.shake(0.1, t, r);
        },
      },
      "misty-explosion": {
        nova(e, t, n, r, i) {
          for (let a = 0; a < 16; a++) {
            let o = (a / 16) * z;
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.6,
              z: r,
              vx: Math.cos(o) * i * 2,
              vy: F.range(0.5, 2),
              vz: Math.sin(o) * i * 2,
              drag: 2.5,
              life: 0.7,
              size: 1,
              endSize: 2.2,
              color: 16763112,
              shape: I.PixPuff,
            });
          }
          (yp(e, t, n + 1, r, 16777215, 8, i * 1.6, I.PixHeart, 0.5, 0.5),
            vp(e, t, n + 1, r, rp, 10, i * 2.2, I.Twinkle, 0.45, 0.4),
            e.vfx.flash(t, n + 1, r, 16759008, i, 0.12));
          for (let a = 0; a < 2; a++)
            e.later(a * 0.08, () =>
              e.vfx.ring(t, n, r, i * (0.7 + a * 0.3), a ? 16777215 : V.fairy, 0.4, 0.15, L.Petals),
            );
          e.shake(0.12);
        },
      },
      "lovely-kiss": {
        draw(e, t, n, r) {
          (e.pool.push(
            e.x[t],
            e.y[t] + Math.sin(e.rot[t] * 3) * 0.1,
            e.z[t],
            n * 1.15,
            16777215,
            wl.PixLips,
            Math.sin(e.rot[t] * 2) * 0.25,
            0,
            r,
          ),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.5, 16743096, I.Soft, 0, 0.2, 0.25 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.35 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: 0.5,
              life: 0.45,
              size: 0.3,
              endSize: 0.2,
              color: 16777215,
              shape: I.PixHeart,
            });
        },
        hit(e, t, n, r) {
          (B(e, t, n + 0.5, r, I.Heart, 16747208, 0.4, 1.4, 0.3, 0, 0.3),
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.9,
              z: r,
              vy: 1.2,
              life: 0.8,
              size: 0.4,
              endSize: 0.7,
              color: 10148095,
              shape: I.PixSleepZ,
            }));
        },
      },
      "frost-breath": {
        cone(e, t, n, r, i, a, o, s, c) {
          let l = Math.sqrt(c / 7);
          (Math.random() < 0.55 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: i * 1.05 + F.range(-1, 1),
              vy: a * 0.3 + F.range(-0.3, 0.6),
              vz: o * 1.05 + F.range(-1, 1),
              drag: 1.3,
              life: s,
              size: 0.3,
              endSize: 0.7 * l,
              color: 16777215,
              shape: I.PixSnow,
              spin: F.range(-4, 4),
            }),
            Math.random() < 0.3 &&
              dp(e).spawn({
                x: t,
                y: n,
                z: r,
                vx: i * 1.1,
                vy: a * 0.2,
                vz: o * 1.1,
                life: s * 0.8,
                size: 0.6,
                endSize: 1.4 * l,
                color: tp,
                shape: I.Soft,
                glow: 0.1,
              }));
        },
      },
      "heart-stamp": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.25,
            c = r + a * o * 0.25;
          (e.vfx.norm.spawn({
            x: s,
            y: n + 1.6,
            z: c,
            vy: -14,
            life: 0.1,
            size: o * 0.5,
            endSize: o * 0.55,
            color: 16777215,
            shape: I.PixHeart,
          }),
            e.later(0.1, () => {
              (B(e, s, n + 0.4, c, I.Star, 16765160, 0.4, o * 0.7, 0.16, 0, 0.4),
                yp(e, s, n + 0.5, c, 16777215, 5, 3, I.PixHeart, 0.3, 0.45),
                mp(e, s, c, o * 0.4, 16759e3, I.Heart, 0.8, fp(i, a)));
            }));
        },
      },
      "perish-song": {
        warn(e, t, n, r, i, a, o) {
          for (let a = 0; a < 5; a++)
            e.later(a * o * 0.18, () =>
              e.vfx.norm.spawn({
                x: t + F.range(-i, i) * 0.4,
                y: n + 5 + F.range(0, 2),
                z: r + F.range(-i, i) * 0.4,
                vy: -2,
                life: o * 0.8,
                size: 0.7,
                endSize: 0.9,
                color: 11569880,
                shape: I.PixNote,
                rot: F.range(-0.3, 0.3),
              }),
            );
        },
        sky(e, t, n, r, i) {
          for (let a = 0; a < 12; a++) {
            let o = (a / 12) * z;
            e.vfx.norm.spawn({
              x: t,
              y: n + 1,
              z: r,
              vx: Math.cos(o) * i * 2,
              vy: F.range(1, 3),
              vz: Math.sin(o) * i * 2,
              drag: 2,
              life: 0.6,
              size: 0.7,
              endSize: 0.5,
              color: 13148400,
              shape: I.PixNote,
              rot: o,
            });
          }
          B(e, t, n + 1.2, r, I.Skull, 13148415, 0.6, i, 0.4, 0, 0.3);
          for (let a = 0; a < 3; a++)
            e.later(a * 0.07, () =>
              e.vfx.ring(t, n, r, i * (0.6 + a * 0.25), a === 1 ? 16747208 : 6965914, 0.45, 0.2, L.Runes),
            );
          e.shake(0.18, t, r);
        },
      },
      "thunder-punch": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3,
            l = e.player.pos;
          (e.vfx.norm.spawn({
            x: l.x + i * 0.8,
            y: n + 0.6,
            z: l.z + a * 0.8,
            vx: (s - l.x) / 0.08,
            vz: (c - l.z) / 0.08,
            life: 0.08,
            size: o * 0.4,
            endSize: o * 0.45,
            color: 16773280,
            shape: I.PixFist,
          }),
            e.later(0.08, () => {
              for (let t = 0; t < 4; t++) {
                let t = F.range(0, z);
                e.vfx.lightning(
                  s,
                  n + 0.5,
                  c,
                  s + Math.cos(t) * o * 0.6,
                  n + F.range(0, 1),
                  c + Math.sin(t) * o * 0.6,
                  np,
                  0.25,
                  4,
                  0.14,
                );
              }
              (B(e, s, n + 0.5, c, I.Bolt, np, 1.4, 0.6, 0.18, F.range(-0.4, 0.4), 0.6), e.shake(0.04, s, c));
            }));
        },
      },
      "wild-charge": {
        dash(e, t, n, r, i, a, o) {
          for (let s = 0; s < 6; s++) {
            let c = s / 6,
              l = t + i * o * c,
              u = r + a * o * c;
            e.later(c * 0.12, () =>
              e.vfx.lightning(l, n + 1.6, u, l + F.range(-1, 1), n + 0.2, u + F.range(-1, 1), np, 0.3, 4, 0.16),
            );
          }
          Tp(e, t, n + 0.9, r, t + i * o, n + 0.9, r + a * o, np, I.Bolt, 6, 0.4);
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => {
            (vp(e, s, n + 0.8, c, np, 10, 6, I.Spark, 0.45, 0.3),
              mp(e, s, c, 2, 3815962, I.PixCrack, 1),
              e.shake(0.08, s, c));
          });
        },
      },
      "thunder-cage": {
        draw(e, t, n, r) {
          let i = e.rot[t];
          for (let a = 0; a < 6; a++) {
            let o = i + (a / 6) * z;
            e.glow.push(
              e.x[t] + Math.cos(o) * n * 0.7,
              e.y[t],
              e.z[t] + Math.sin(o) * n * 0.7,
              n * 0.5,
              np,
              I.Bolt,
              o,
              0.4,
              r * 0.9,
            );
          }
          e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.3, 16773280, I.Ring, 0, 0.2, 0.5 * r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            e.vfx.lightning(
              t,
              n + 1,
              r,
              t + F.range(-1.5, 1.5),
              n - 0.5,
              r + F.range(-1.5, 1.5),
              np,
              0.18,
              3,
              0.1,
            );
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          for (let n = 0; n < 6; n++) {
            let o = (n / 6) * z;
            e.vfx.lightning(t, a + 1, r, t + Math.cos(o) * i, a + 0.2, r + Math.sin(o) * i, np, 0.35, 6, 0.22);
          }
          (e.vfx.flash(t, a + 1, r, np, i, 0.12),
            e.vfx.ring(t, a, r, i, np, 0.4, 0.15, L.Dashed),
            e.shake(0.1, t, r));
        },
      },
      "bolt-strike": {
        warn(e, t, n, r, i, a, o) {
          zp(e, t, n, r, o, 16777215, I.PixBolt, i * 0.6, 24, 3);
        },
        sky(e, t, n, r, i) {
          (e.vfx.lightning(t, n + 32, r, t, n, r, np, 0.8, 10, 0.32),
            e.vfx.lightning(t + F.range(-1, 1), n + 32, r, t, n, r, 13166847, 0.3, 8, 0.26),
            e.vfx.norm.spawn({
              x: t,
              y: n + 2,
              z: r,
              life: 0.3,
              size: 3.4,
              endSize: 2.6,
              color: 16777215,
              shape: I.PixBolt,
            }),
            e.vfx.flash(t, n + 1.5, r, np, i * 1.3, 0.16),
            mp(e, t, r, i * 1.3, 16777215, I.PixCrack, 1.6),
            vp(e, t, n + 0.4, r, np, 14, i * 3, I.Spark, 0.5, 0.4),
            e.vfx.ring(t, n, r, i, np, 0.45, 0.15, L.Dashed),
            e.shake(0.25, t, r));
        },
      },
      "fire-punch": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3,
            l = e.player.pos;
          (e.vfx.norm.spawn({
            x: l.x + i * 0.8,
            y: n + 0.6,
            z: l.z + a * 0.8,
            vx: (s - l.x) / 0.08,
            vz: (c - l.z) / 0.08,
            life: 0.08,
            size: o * 0.4,
            endSize: o * 0.45,
            color: 16765088,
            shape: I.PixFist,
          }),
            e.later(0.08, () => {
              for (let t = 0; t < 8; t++) {
                let r = (t / 8) * z;
                Ep(e, s, n + 0.5, c, Math.cos(r) * 4, F.range(2, 4), Math.sin(r) * 4, 0.4, 0.9, 0.3, 3);
              }
              (Op(e, s, n + 0.5, c, 5, 4), e.shake(0.04, s, c));
            }));
        },
      },
      "mystical-fire": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.6, 16738970, I.Soft, 0, 0.2, 0.35 * r),
            e.pool.push(
              e.x[t],
              e.y[t],
              e.z[t],
              n * 1.15,
              16777215,
              I.PixFlame,
              Math.sin(e.rot[t] * 4) * 0.2,
              0,
              r,
            ),
            e.glow.push(e.x[t], e.y[t] + n * 0.1, e.z[t], n * 0.45, 16765168, I.Soft, 0, 0.6, r));
        },
        trail(e, t, n, r) {
          (Math.random() < 0.4 && e.vfx.trail(t, n, r, 16747192, 0.3, I.Twinkle, 0.3),
            Math.random() < 0.3 && Ep(e, t, n, r, 0, 1.5, 0, 0.3, 0.4, 0.1));
        },
        hit(e, t, n, r) {
          for (let i = 0; i < 5; i++)
            Ep(e, t, n, r, F.range(-3, 3), F.range(1, 4), F.range(-3, 3), 0.35, 0.7, 0.2, 3);
          B(e, t, n, r, I.Twinkle, 16761056, 0.3, 1.3, 0.16, 0, 0.4);
        },
      },
      "lava-plume": {
        nova(e, t, n, r, i) {
          for (let a = 0; a < 18; a++) {
            let o = (a / 18) * z;
            Ep(
              e,
              t + Math.cos(o) * 0.8,
              n + 0.4,
              r + Math.sin(o) * 0.8,
              Math.cos(o) * i * 2.2,
              F.range(2, 5),
              Math.sin(o) * i * 2.2,
              0.5,
              1.2,
              0.4,
              3,
            );
          }
          for (let a = 0; a < 4; a++)
            Dp(e, t + F.range(-i, i) * 0.4, n + 0.8, r + F.range(-i, i) * 0.4, 1.4, 6969946, 0.9);
          (_p(e, t, n, r, 16747082, 8, i * 1.2, I.PixRock, 0.4),
            e.vfx.ring(t, n, r, i, 13647898, 0.4, 0.15, L.Flames),
            mp(e, t, r, i, 2759188, I.Soft, 1.4, 0),
            e.shake(0.12));
        },
      },
      eruption: {
        warn(e, t, n, r, i, a, o) {
          mp(e, t, r, i * 1.1, 16742970, I.PixCrack, o + 0.2);
          for (let a = 0; a < 4; a++)
            e.later(a * o * 0.22, () =>
              e.vfx.norm.spawn({
                x: t + F.range(-i, i) * 0.4,
                y: n + 0.2,
                z: r + F.range(-i, i) * 0.4,
                vy: 1.5,
                life: 0.5,
                size: 0.6,
                endSize: 1.2,
                color: 8022634,
                shape: I.PixPuff,
              }),
            );
        },
        sky(e, t, n, r, i) {
          for (let i = 0; i < 24; i++)
            Ep(
              e,
              t + F.range(-0.8, 0.8),
              n + F.range(0, 1),
              r + F.range(-0.8, 0.8),
              F.range(-1.5, 1.5),
              F.range(9, 16),
              F.range(-1.5, 1.5),
              0.7,
              F.range(1, 1.7),
              0.4,
              1.2,
            );
          for (let a = 0; a < 10; a++) {
            let a = F.range(0, z),
              o = F.range(2, i * 2);
            e.vfx.norm.spawn({
              x: t,
              y: n + 1,
              z: r,
              vx: Math.cos(a) * o,
              vy: F.range(8, 13),
              vz: Math.sin(a) * o,
              gravity: 22,
              life: 0.9,
              size: 0.6,
              endSize: 0.4,
              color: 16756848,
              shape: I.PixRock,
              spin: 6,
            });
          }
          for (let i = 0; i < 3; i++) Dp(e, t, n + 2, r, 2, 5917258, 1.2);
          (Op(e, t, n + 1, r, 12, 8),
            e.vfx.ring(t, n, r, i, 13647898, 0.45, 0.15, L.Flames),
            mp(e, t, r, i * 1.4, 2759188, I.Soft, 2.4, 0),
            e.shake(0.3, t, r));
        },
      },
      "storm-throw": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.25,
            c = r + a * o * 0.25;
          for (let t of [-1, 1])
            e.vfx.norm.spawn({
              x: s - a * t * 1,
              y: n + 0.6,
              z: c + i * t * 1,
              vx: a * t * 7,
              vz: -i * t * 7,
              life: 0.13,
              size: o * 0.45,
              endSize: o * 0.45,
              color: 15261896,
              shape: I.PixHorn,
              rot: t > 0 ? 0.6 : -0.6 + Math.PI,
            });
          e.later(0.13, () => {
            B(e, s, n + 0.6, c, I.Star, 16773312, 0.5, o * 0.8, 0.2, 0, 0.5);
            for (let t = 0; t < 8; t++) {
              let r = (t / 8) * z;
              e.vfx.norm.spawn({
                x: s,
                y: n + 0.3,
                z: c,
                vx: -Math.sin(r) * 6 + Math.cos(r) * 2,
                vy: 1,
                vz: Math.cos(r) * 6 + Math.sin(r) * 2,
                drag: 3,
                life: 0.4,
                size: 0.8,
                endSize: 1.4,
                color: 14733488,
                shape: I.PixPuff,
              });
            }
            e.shake(0.05, s, c);
          });
        },
      },
      lunge: {
        dash(e, t, n, r, i, a, o) {
          let s = 0.13;
          (e.vfx.norm.spawn({
            x: t + i,
            y: n + 1,
            z: r + a,
            vx: (i * o) / s,
            vz: (a * o) / s,
            life: s,
            size: 2,
            endSize: 2.2,
            color: 15261896,
            shape: I.PixHorn,
            rot: -fp(i, a) + Math.PI * 0.75,
          }),
            e.vfx.dust(t, n, r, 14207144, 8, 3));
          let c = t + i * o,
            l = r + a * o;
          e.later(s, () => {
            (B(e, c, n + 1, l, I.Star, 14217376, 0.6, 2.6, 0.2, 0, 0.4),
              _p(e, c, e.terrain.height(c, l), l, 16777215, 6, 4, I.PixRock, 0.35),
              e.shake(0.08, c, l));
          });
        },
      },
      "vital-throw": {
        nova(e, t, n, r, i) {
          for (let t = 0; t < 10; t++)
            e.later(t * 0.02, () => {
              let n = e.player.pos,
                r = (t / 10) * z,
                a = n.x + Math.cos(r) * i * 0.75,
                o = n.z + Math.sin(r) * i * 0.75;
              (e.vfx.norm.spawn({
                x: a,
                y: n.y + 0.9,
                z: o,
                vx: -Math.sin(r) * 8,
                vz: Math.cos(r) * 8,
                life: 0.12,
                size: 1.1,
                endSize: 1,
                color: 15261896,
                shape: I.PixHorn,
                rot: r,
              }),
                e.vfx.dust(a, n.y, o, 14209216, 2, 2));
            });
          (e.vfx.ring(t, n, r, i, 12109946, 0.35, 0.2, L.Jagged), e.shake(0.06));
        },
      },
      superpower: {
        nova(e, t, n, r, i) {
          e.vfx.flash(t, n + 1, r, 16758858, i * 1.1, 0.14);
          for (let a = 0; a < 3; a++)
            e.later(a * 0.06, () =>
              e.vfx.ring(t, n, r, i * (0.5 + a * 0.25), a === 1 ? 16767120 : V.punch, 0.45, 0.15, L.Jagged),
            );
          (mp(e, t, r, i * 1.2, 16777215, I.PixCrack, 1.6),
            _p(e, t, n, r, 16777215, 10, i * 1.3, I.PixRock, 0.45),
            e.vfx.dust(t, n, r, 14207144, 16, i * 1.4),
            e.shake(0.22));
        },
      },
      payback: {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3;
          (e.vfx.norm.spawn({
            x: s,
            y: n + 0.8,
            z: c,
            life: 0.2,
            size: o * 0.6,
            endSize: o * 0.7,
            color: 5917290,
            shape: I.PixPuff,
          }),
            B(e, s, n + 0.6, c, I.Crescent, 14205183, 0.5, o * 0.7, 0.18, fp(i, a), 0.3),
            vp(e, s, n + 0.6, c, V.dark, 5, 4, I.Spark, 0.35, 0.25));
        },
      },
      "rock-climb": {
        nova(e, t, n, r, i) {
          for (let a = 0; a < 12; a++) {
            let o = (a / 12) * z;
            e.vfx.norm.spawn({
              x: t + Math.cos(o) * 1.2,
              y: n + 0.4,
              z: r + Math.sin(o) * 1.2,
              vx: Math.cos(o) * i * 2,
              vy: F.range(3, 6),
              vz: Math.sin(o) * i * 2,
              gravity: 18,
              life: 0.5,
              size: 0.45,
              endSize: 0.3,
              color: 16777215,
              shape: I.PixRock,
              spin: 6,
            });
          }
          (e.vfx.dust(t, n, r, 14207144, 12, i * 1.2),
            e.vfx.ring(t, n, r, i, 13150328, 0.35, 0.15, L.Jagged),
            e.shake(0.08));
        },
      },
      "raging-bull": {
        dash(e, t, n, r, i, a, o) {
          for (let s = 0; s < 8; s++) {
            let c = s / 8;
            e.later(c * 0.12, () => {
              let s = t + i * o * c,
                l = r + a * o * c;
              (e.vfx.dust(s, n, l, 14207144, 2, 2), mp(e, s, l, 1, 3811866, I.Soft, 1, 0));
            });
          }
          let s = 0.13;
          e.vfx.norm.spawn({
            x: t + i,
            y: n + 1.1,
            z: r + a,
            vx: (i * o) / s,
            vz: (a * o) / s,
            life: s,
            size: 2,
            endSize: 2.2,
            color: 16777215,
            shape: I.PixHorn,
            rot: -fp(i, a) + Math.PI * 0.75,
          });
          let c = t + i * o,
            l = r + a * o;
          e.later(s, () => {
            (B(e, c, n + 1, l, I.Star, 16765088, 0.6, 2.8, 0.2, 0, 0.5),
              e.vfx.ring(c, e.terrain.height(c, l), l, 2.8, 16742986, 0.35, 0.15, L.Jagged),
              e.shake(0.1, c, l));
          });
        },
      },
      "headlong-rush": {
        warn(e, t, n, r, i) {
          e.vfx.dust(t, n, r, 13150328, 6, i);
        },
        sky(e, t, n, r, i) {
          (e.vfx.norm.spawn({
            x: t,
            y: n + 4,
            z: r,
            vy: -24,
            life: 0.15,
            size: i * 0.7,
            endSize: i * 0.8,
            color: 16777215,
            shape: I.PixHorn,
            rot: Math.PI * 0.75,
          }),
            e.later(0.15, () => {
              (mp(e, t, r, i * 1.3, 16777215, I.PixCrack, 1.8),
                _p(e, t, n, r, 16777215, 10, i * 1.3, I.PixRock, 0.45),
                e.vfx.dust(t, n, r, 14207144, 16, i * 1.6));
              for (let a = 0; a < 3; a++)
                e.later(a * 0.06, () =>
                  e.vfx.ring(t, n, r, i * (0.6 + a * 0.25), a === 1 ? 16777215 : 13150328, 0.4, 0.15, L.Jagged),
                );
              e.shake(0.25, t, r);
            }));
        },
      },
      "lock-on": {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.9, 16777215, wl.PixCube, e.rot[t], 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.6, rp, I.Cross, e.rot[t] * 0.5, 0.2, 0.5 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.5 &&
            dp(e).spawn({
              x: t,
              y: n,
              z: r,
              life: 0.18,
              size: 0.3,
              endSize: 0,
              color: ip,
              shape: I.Square,
              glow: 0.2,
            });
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Cross, rp, 0.4, 1.6, 0.25, Math.PI / 4, 0.3),
            yp(e, t, n, r, 16777215, 3, 2, wl.PixCube, 0.25, 0.35));
        },
      },
      "fusion-bolt": {
        link(e, t, n, r, i, a, o, s, c) {
          (e.vfx.lightning(t, n, r, i, a, o, c % 2 ? ip : np, 0.45, 7, 0.24),
            e.vfx.lightning(t, n, r, i, a, o, 16777215, 0.15, 5, 0.18));
          for (let t = 0; t < 4; t++)
            dp(e).spawn({
              x: i + F.range(-0.6, 0.6),
              y: a + F.range(-0.4, 0.8),
              z: o + F.range(-0.6, 0.6),
              life: 0.3,
              size: 0.25,
              endSize: 0,
              color: t % 2 ? rp : ip,
              shape: I.Square,
              glow: 0.3,
            });
        },
      },
      "techno-blast": {
        beam(e, t, n, r, i, a, o, s) {
          let c = [rp, ip, 16777215];
          (Cp(e, t, n, r, i, a, o, s * 0.9, c[Math.floor(e.time * 10) % 2], 16777215),
            Sp(e, t, n, r, i, a, o, c, s * 1.6, 2),
            Tp(e, t, n, r, i, a, o, ip, I.Square, 2, 0.3));
        },
      },
      "parabolic-charge": {
        aura(e, t, n, r, i, a, o) {
          if (Math.random() < 0.35) {
            let a = F.range(0, z),
              o = F.range(1, i);
            e.vfx.lightning(
              t + Math.cos(a) * o,
              n + 0.6,
              r + Math.sin(a) * o,
              t,
              n + 1,
              r,
              V.volt,
              0.12,
              4,
              0.1,
            );
          }
          o &&
            (e.vfx.ring(t, n, r, i, V.volt, 0.25, 0.3, L.Dashed),
            B(e, t, n + 1.2, r, I.Bolt, V.volt, 0.4, 1.2, 0.2, 0, 0.3));
        },
      },
    },
    op = 11071743,
    sp = 16769594,
    cp = 12611839,
    lp = 16758858,
    up = {
      constrict: {
        nova(e, t, n, r, i) {
          for (let a = 0; a < 8; a++) {
            let o = (a / 8) * z + F.range(-0.2, 0.2),
              s = t + Math.cos(o) * i,
              c = r + Math.sin(o) * i;
            (e.vfx.beams.spawn(
              t,
              n + 0.6,
              r,
              s,
              e.terrain.height(s, c) + 0.4,
              c,
              0.22,
              a % 2 ? 8046824 : 5941464,
              0.2,
            ),
              B(e, s, e.terrain.height(s, c) + 0.5, c, I.Twinkle, V.white, 0.3, 1, 0.12));
          }
          e.vfx.ring(t, n, r, i, 5941464, 0.3, 0.2, L.Ripple);
        },
      },
      "spike-cannon": {
        draw(e, t, n, r) {
          e.pool.push(
            e.x[t],
            e.y[t],
            e.z[t],
            n * 1.1,
            15784096,
            I.PixSpike,
            -Math.atan2(e.vz[t], e.vx[t]) + Math.PI / 2,
            0,
            r,
          );
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              life: 0.2,
              size: 0.25,
              endSize: 0.1,
              color: 16777215,
              shape: I.PixSand,
            });
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Cross, 16773328, 0.3, 1, 0.12), _p(e, t, n, r, 16777215, 2, 2, I.PixRock, 0.22));
        },
      },
      "water-spout": {
        nova(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          for (let i = 0; i < 16; i++)
            kp(
              e,
              t + F.range(-0.4, 0.4),
              n + 1,
              r + F.range(-0.4, 0.4),
              F.range(-1.5, 1.5),
              F.range(11, 17),
              F.range(-1.5, 1.5),
              0.9,
              F.range(0.6, 0.95),
              0.35,
              18,
              0,
            );
          for (let n = 0; n < 5; n++) Ap(e, t, a + 0.5 + n * 0.9, r, 1.4 - n * 0.12, 0.5, 0, 6 + n * 2, 0);
          for (let n = 0; n < 2; n++) jp(e, t, a + 1, r, 2);
          (Np(e, t, n, r, 1.4, 1),
            e.later(0.35, () => {
              for (let n = 0; n < 9; n++) {
                let a = (n / 9) * z + F.range(-0.2, 0.2),
                  o = F.range(i * 0.35, i),
                  s = t + Math.cos(a) * o,
                  c = r + Math.sin(a) * o,
                  l = e.terrain.height(s, c);
                (kp(e, s, l + 6, c, 0, -16, 0, 0.36, 0.7, 0.55, 0, 0),
                  e.later(0.34, () => Np(e, s, l + 0.4, c, 1, 0.7)));
              }
              Pp(e, t, n, r, i, 0.5);
            }),
            e.shake(0.1));
        },
      },
      "meteor-beam": {
        beam(e, t, n, r, i, a, o, s) {
          (Cp(e, t, n, r, i, a, o, s * 0.95, lp, 16773312),
            Tp(e, t, n, r, i, a, o, 16767120, I.Shard, 2, 0.4),
            Sp(e, t, n, r, i, a, o, [lp, 14203e3], s * 1.5, 1),
            Math.random() < 0.4 && _p(e, i, e.terrain.height(i, o), o, 16777215, 2, 4, I.PixRock, 0.35));
        },
      },
      "aqua-jet": {
        dash(e, t, n, r, i, a, o) {
          for (let s = 0; s < 10; s++) {
            let c = s / 10;
            e.later(c * 0.12, () => {
              let l = t + i * o * c,
                u = r + a * o * c;
              (kp(
                e,
                l,
                n + 0.7,
                u,
                -i * 7 + F.range(-1.5, 1.5),
                F.range(1.5, 3.5),
                -a * 7 + F.range(-1.5, 1.5),
                0.4,
                F.range(0.5, 0.75),
                0.2,
                16,
              ),
                s % 2 && Ap(e, l, n + 0.5, u, 0.9, 0.35, -i * 3, 0.6, -a * 3));
            });
          }
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => Np(e, s, n + 0.5, c, 1.6, 1));
        },
      },
      "sacred-sword": {
        draw(e, t, n, r) {
          e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.3, 16777215, El.PixScythe, e.rot[t] * 5, 0, r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.4 &&
            dp(e).spawn({
              x: t,
              y: n,
              z: r,
              life: 0.16,
              size: 0.6,
              endSize: 0.2,
              color: 14213360,
              shape: I.Crescent,
              rot: F.range(0, z),
              glow: 0.1,
            });
        },
        hit(e, t, n, r) {
          B(e, t, n, r, I.Cross, 15791359, 0.4, 1.5, 0.14, F.range(0, 1), 0.4);
        },
      },
      "stone-axe": {
        draw(e, t, n, r) {
          e.pool.push(e.x[t], e.y[t] - 0.2, e.z[t], n * 0.9, 16777215, I.PixSpike, 0, 0, r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.06 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: 0.6,
              life: 0.4,
              size: 0.2,
              endSize: 0.1,
              color: 16777215,
              shape: I.PixSand,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          _p(e, t, a, r, 16777215, 10, i * 1.6, I.PixRock, 0.4);
          for (let n = 0; n < 5; n++) {
            let o = (n / 5) * z;
            e.vfx.norm.spawn({
              x: t + Math.cos(o) * i * 0.5,
              y: a + 0.6,
              z: r + Math.sin(o) * i * 0.5,
              vy: 5,
              drag: 6,
              life: 0.7,
              size: 1.1,
              endSize: 0.9,
              color: 16777215,
              shape: I.PixSpike,
            });
          }
          (mp(e, t, r, i * 1.1, 16777215, I.PixCrack, 1.4),
            e.vfx.ring(t, a, r, i, 11047018, 0.35, 0.15, L.Jagged));
        },
      },
      "razor-shell": {
        strike(e, t, n, r, i, a, o, s, c) {
          let l = t + i * o * 0.25,
            u = r + a * o * 0.25;
          (e.vfx.norm.spawn({
            x: l,
            y: n + 0.6,
            z: u,
            life: 0.2,
            size: o * 0.75,
            endSize: o * 0.85,
            color: 16777215,
            shape: El.PixScythe,
            rot: c % 2 ? -0.6 : 0.6,
          }),
            e.later(0.06, () => {
              (mp(e, l, u, o * 0.6, 16777215, I.PixCrack, 1, fp(i, a) + (c % 2 ? 0.5 : -0.5)),
                yp(e, l, n + 0.4, u, 16777215, 3, 3, I.PixDrop, 0.3, 0.35));
            }));
        },
      },
      "thunder-fang": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3;
          (e.vfx.norm.spawn({
            x: s,
            y: n + 1.6,
            z: c,
            vy: -14,
            life: 0.1,
            size: o * 0.55,
            endSize: o * 0.6,
            color: 16777215,
            shape: I.PixFang,
          }),
            e.later(0.1, () => {
              for (let t = 0; t < 3; t++) {
                let t = F.range(0, z);
                e.vfx.lightning(
                  s,
                  n + 0.5,
                  c,
                  s + Math.cos(t) * 2,
                  n + F.range(0, 1),
                  c + Math.sin(t) * 2,
                  sp,
                  0.25,
                  4,
                  0.15,
                );
              }
              B(e, s, n + 0.4, c, I.Bolt, sp, 0.5, o * 0.6, 0.16, 0, 0.4);
            }));
        },
      },
      "dual-wingbeat": {
        draw(e, t, n, r) {
          (e.pool.push(
            e.x[t],
            e.y[t],
            e.z[t],
            n * 1.4,
            13156560,
            I.Crescent,
            -Math.atan2(e.vz[t], e.vx[t]),
            0,
            r,
          ),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.2, 12114160, I.Soft, 0, 0, 0.2 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: -0.4,
              drag: 1.5,
              life: 0.4,
              size: 0.3,
              endSize: 0.25,
              color: 14209248,
              shape: I.PixFeather,
              spin: 3,
            });
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Star, 15790335, 0.4, 1.6, 0.15, 0, 0.3), e.vfx.dust(t, n - 0.5, r, 14209216, 3, 2));
        },
      },
      "iron-head": {
        dash(e, t, n, r, i, a, o) {
          Tp(e, t, n + 0.9, r, t + i * o, n + 0.9, r + a * o, V.steel, I.Spark, 5, 0.4);
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => {
            B(e, s, n + 1, c, I.Star, 15266047, 0.6, 2.6, 0.2, 0, 0.4);
            for (let t = 0; t < 8; t++) {
              let t = F.range(0, z);
              dp(e).spawn({
                x: s,
                y: n + 1,
                z: c,
                vx: Math.cos(t) * 6,
                vy: F.range(2, 5),
                vz: Math.sin(t) * 6,
                gravity: 16,
                life: 0.35,
                size: 0.15,
                endSize: 0.05,
                color: 16773280,
                shape: I.Square,
                glow: 0.3,
              });
            }
            e.shake(0.08, s, c);
          });
        },
      },
      "dragon-ascent": {
        warn(e, t, n, r, i, a, o) {
          (zp(e, t, n, r, o, 16777215, El.PixAmber, i * 0.45, 22, 5), e.vfx.telegraph(t, n, r, i, 12114160, o));
        },
        sky(e, t, n, r, i) {
          for (let i = 0; i < 6; i++) {
            let a = (i / 6) * z;
            e.vfx.beams.spawn(
              t + Math.cos(a) * 0.6,
              n + 6,
              r + Math.sin(a) * 0.6,
              t,
              n + 0.3,
              r,
              0.14,
              i % 2 ? 16777215 : 12114160,
              0.18,
            );
          }
          e.vfx.flash(t, n + 1, r, 14215423, i, 0.12);
          for (let a = 0; a < 2; a++)
            e.later(a * 0.08, () =>
              e.vfx.ring(t, n, r, i * (0.7 + a * 0.35), a ? 16777215 : 10139864, 0.4, 0.15, L.Ripple),
            );
          (yp(e, t, n + 0.5, r, 16777215, 10, i * 2, I.PixFeather, 0.5, 0.55, i),
            mp(e, t, r, i * 1.1, 16777215, I.PixCrack, 1.4),
            _p(e, t, n, r, 16777215, 6, i, I.PixRock, 0.4),
            e.shake(0.18, t, r));
        },
      },
      "freeze-dry": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.5, op, I.Soft, 0, 0.2, 0.4 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.1, 16777215, I.PixSnow, e.rot[t] * 2, 0, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.4 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: -0.5,
              life: 0.4,
              size: 0.2,
              endSize: 0.12,
              color: 16777215,
              shape: I.PixSnow,
              spin: 3,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          for (let n = 0; n < 8; n++) {
            let o = (n / 8) * z;
            e.vfx.norm.spawn({
              x: t + Math.cos(o) * i * 0.5,
              y: a + 0.6,
              z: r + Math.sin(o) * i * 0.5,
              vy: 4,
              drag: 6,
              life: 0.8,
              size: 1,
              endSize: 1.2,
              color: 12577535,
              shape: I.Shard,
              rot: o,
            });
          }
          (yp(e, t, n, r, 16777215, 10, i * 2, I.PixSnow, 0.4, 0.5),
            e.vfx.ring(t, a, r, i, op, 0.35, 0.15, L.Ripple));
        },
      },
      "bleakwind-storm": {
        cone(e, t, n, r, i, a, o, s, c) {
          let l = Math.sqrt(c / 7);
          (Math.random() < 0.5 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: i * 1.15 + F.range(-1, 1),
              vy: a * 0.3 + F.range(-0.3, 0.6),
              vz: o * 1.15 + F.range(-1, 1),
              drag: 1,
              life: s,
              size: 0.35,
              endSize: 0.6 * l,
              color: 16777215,
              shape: El.PixIceFeather,
              spin: F.range(-4, 4),
            }),
            Math.random() < 0.4 &&
              e.vfx.norm.spawn({
                x: t,
                y: n,
                z: r,
                vx: i * 1.2,
                vy: a * 0.2,
                vz: o * 1.2,
                life: s * 0.8,
                size: 0.2,
                endSize: 0.3,
                color: 16777215,
                shape: I.PixSnow,
                spin: 5,
              }));
        },
      },
      glaciate: {
        draw(e, t, n, r) {
          e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.4, op, I.Soft, 0, 0, 0.35 * r);
          for (let i = -1; i <= 1; i++)
            e.pool.push(
              e.x[t] + i * n * 0.35,
              e.y[t] + 0.5 + Math.abs(i) * -0.2,
              e.z[t],
              n * (i ? 0.6 : 0.85),
              12577535,
              I.Shard,
              i * 0.4,
              0,
              r,
            );
        },
        trail(e, t, n, r) {
          (Math.random() < 0.5 &&
            e.vfx.norm.spawn({
              x: t,
              y: n + 1,
              z: r,
              vx: F.range(-1, 1),
              vy: F.range(1, 3),
              vz: F.range(-1, 1),
              gravity: 6,
              life: 0.5,
              size: 0.3,
              endSize: 0.2,
              color: 16777215,
              shape: I.PixSnow,
            }),
            Math.random() < 0.2 && mp(e, t, r, 1.6, 14218495, I.Soft, 1.4, 0));
        },
      },
      "bolt-beak": {
        dash(e, t, n, r, i, a, o) {
          (e.vfx.lightning(t, n + 1, r, t + i * o, n + 1, r + a * o, sp, 0.5, 8, 0.2),
            Tp(e, t, n + 1, r, t + i * o, n + 1, r + a * o, 16777215, I.PixFeather, 3, 0.4));
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => {
            (B(e, s, n + 1, c, I.PixBolt, 16777215, 0.6, 2.4, 0.2),
              vp(e, s, n + 1, c, sp, 8, 6, I.Bolt, 0.5, 0.3));
          });
        },
      },
      "wildbolt-storm": {
        cone(e, t, n, r, i, a, o, s, c) {
          let l = Math.sqrt(c / 7);
          if (Math.random() < 0.18) {
            let a = t + i * s * F.range(0.4, 1),
              c = r + o * s * F.range(0.4, 1);
            e.vfx.lightning(
              t,
              n + 0.3,
              r,
              a + F.range(-1, 1),
              n + F.range(-0.5, 1),
              c + F.range(-1, 1),
              sp,
              0.25,
              5,
              0.12,
            );
          }
          Math.random() < 0.35 &&
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.5,
              z: r,
              vx: i * 0.9,
              vy: a * 0.2 + 0.5,
              vz: o * 0.9,
              drag: 1.2,
              life: s,
              size: 0.5,
              endSize: 1.4 * l,
              color: 9079456,
              endColor: 5921392,
              shape: I.PixPuff,
            });
        },
      },
      thunderclap: {
        warn(e, t, n, r, i) {
          e.vfx.telegraph(t, n, r, i, sp, 0.25);
        },
        sky(e, t, n, r, i) {
          (e.vfx.lightning(t + F.range(-1.5, 1.5), n + 26, r, t, n, r, sp, 0.55, 9, 0.26),
            e.vfx.lightning(t, n + 26, r, t, n, r, 16775360, 0.18, 7, 0.2),
            e.vfx.norm.spawn({
              x: t,
              y: n + 1.2,
              z: r,
              life: 0.2,
              size: 2,
              endSize: 1.4,
              color: 16777215,
              shape: I.PixBolt,
            }),
            mp(e, t, r, i * 1.1, 16777215, I.PixCrack, 1.2),
            vp(e, t, n + 0.4, r, sp, 8, i * 2.5, I.Bolt, 0.5, 0.35),
            e.shake(0.06, t, r));
        },
      },
      "electro-shot": {
        beam(e, t, n, r, i, a, o, s) {
          if ((Cp(e, t, n, r, i, a, o, s * 1.1, sp, 16776160), Math.random() < 0.5)) {
            let a = Math.random();
            e.vfx.lightning(
              t + (i - t) * a,
              n + 0.6,
              r + (o - r) * a,
              t + (i - t) * (a + 0.15),
              n - 0.4,
              r + (o - r) * (a + 0.15),
              16777215,
              0.2,
              4,
              0.08,
            );
          }
          Sp(e, t, n, r, i, a, o, [sp, 16774304], s * 1.6, 2);
        },
      },
      incinerate: {
        cone(e, t, n, r, i, a, o, s, c) {
          let l = Math.sqrt(c / 7);
          (Ep(e, t, n, r, i * 1.2, a * 0.4 + 0.8, o * 1.2, s, 0.5, 1.6 * l, 0.5),
            Math.random() < 0.25 && Op(e, t + i * s * 0.6, n, r + o * s * 0.6, 2, 3, 0.5),
            Math.random() < 0.06 && Dp(e, t + i * s, n + 0.5, r + o * s, 1, 8022628, 0.7));
        },
      },
      fly: {
        dash(e, t, n, r, i, a, o) {
          for (let s = 0; s < 8; s++) {
            let c = s / 8;
            e.later(c * 0.12, () => {
              (Ep(
                e,
                t + i * o * c,
                n + 1.2,
                r + a * o * c,
                F.range(-1, 1),
                F.range(1, 3),
                F.range(-1, 1),
                0.45,
                1,
                0.3,
              ),
                s % 2 &&
                  e.vfx.norm.spawn({
                    x: t + i * o * c,
                    y: n + 1.4,
                    z: r + a * o * c,
                    vy: -1,
                    gravity: 2,
                    drag: 2,
                    life: 0.7,
                    size: 0.4,
                    endSize: 0.3,
                    color: 16760944,
                    shape: I.PixFeather,
                    spin: 4,
                  }));
            });
          }
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => {
            (e.vfx.ring(s, e.terrain.height(s, c), c, 2.6, 13647898, 0.35, 0.15, L.Flames),
              Op(e, s, n + 0.6, c, 6, 5));
          });
        },
      },
      "searing-shot": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.4, V.fireDeep, I.Soft, 0, 0.1, 0.4 * r),
            e.pool.push(
              e.x[t],
              e.y[t],
              e.z[t],
              n * 1.2,
              16777215,
              I.PixFlame,
              Math.sin(e.rot[t] * 6) * 0.2,
              0,
              r,
            ));
        },
        trail(e, t, n, r) {
          Ep(e, t, n, r, F.range(-0.5, 0.5), F.range(1, 2), F.range(-0.5, 0.5), 0.35, 0.6, 0.2);
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          for (let n = 0; n < 14; n++) {
            let o = (n / 14) * z;
            Ep(e, t, a + 0.5, r, Math.cos(o) * i * 2, F.range(2, 5), Math.sin(o) * i * 2, 0.45, 1, 0.3, 3);
          }
          (Op(e, t, a + 0.5, r, 8, 5),
            mp(e, t, r, i * 1.2, 2759188, I.Soft, 2, 0),
            e.vfx.ring(t, a, r, i, 13647898, 0.35, 0.15, L.Flames));
        },
      },
      overheat: {
        warn(e, t, n, r, i, a, o) {
          (zp(e, t, n, r, o, 16777215, I.PixFlame, i * 0.6, 24, 6), e.vfx.telegraph(t, n, r, i, V.fireDeep, o));
        },
        sky(e, t, n, r, i) {
          Hp(e, t, n, r, 2.2, 16738842, 16773280);
          for (let a = 0; a < 22; a++) {
            let a = F.range(0, z),
              o = F.range(i, i * 2.4);
            Ep(e, t, n + 0.6, r, Math.cos(a) * o, F.range(2, 7), Math.sin(a) * o, 0.55, 1.4, 0.4, 2.5);
          }
          for (let a = 0; a < 3; a++)
            e.later(a * 0.07, () =>
              e.vfx.ring(t, n, r, i * (0.6 + a * 0.25), a === 1 ? 16756794 : 13647898, 0.4, 0.15, L.Flames),
            );
          mp(e, t, r, i * 1.4, 2759188, I.Soft, 2.4, 0);
          for (let i = 0; i < 3; i++) Dp(e, t, n + 1, r, 1.4, 8022628, 0.9);
          e.shake(0.3, t, r);
        },
      },
      "psycho-cut": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.6, cp, I.Soft, 0, 0.2, 0.4 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.3, 15255807, I.Crescent, e.rot[t] * 6, 0, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.5 &&
            dp(e).spawn({
              x: t,
              y: n,
              z: r,
              life: 0.18,
              size: 0.7,
              endSize: 0.2,
              color: cp,
              shape: I.Crescent,
              rot: F.range(0, z),
              glow: 0.2,
            });
        },
        hit(e, t, n, r) {
          B(e, t, n, r, I.Cross, 15784191, 0.4, 1.6, 0.14, F.range(0, 1), 0.4);
        },
      },
      psystrike: {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.7, cp, I.Soft, 0, 0.3, 0.5 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.9, 6957744, I.Soft, 0, 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.3, 15255807, I.Ring, 0, 0.2, 0.6 * r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.1, 14199039, I.Swirl, -e.rot[t] * 3, 0.2, 0.6 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.4 && e.vfx.trail(t, n, r, 13148415, 0.35, I.Twinkle, 0.3);
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          for (let n = 0; n < 3; n++)
            e.later(n * 0.06, () =>
              e.vfx.ring(t, a, r, i * (1 - n * 0.25), n === 1 ? 16777215 : cp, 0.4, 0.9, L.Runes),
            );
          (mp(e, t, r, i * 1.1, 16777215, I.PixCrack, 1.4),
            vp(e, t, n, r, cp, 10, i * 2, I.Twinkle, 0.5, 0.4),
            e.shake(0.1, t, r));
        },
      },
      "prismatic-laser": {
        beam(e, t, n, r, i, a, o, s) {
          let c = Math.min(s, 2.2) * (e.vfx.calm ? 0.5 : 1),
            l = [16738954, 16767050, 8060810, 6994175, 12618495],
            u = l[Math.floor(e.time * 5) % l.length];
          (e.vfx.beams.spawn(t, n, r, i, a, o, c * 1.4, u, 0.05),
            Cp(e, t, n, r, i, a, o, c * 0.7, 15259903, 16777215),
            Sp(e, t, n, r, i, a, o, l, c * 1.8, 2),
            Tp(e, t, n, r, i, a, o, u, I.Twinkle, 1, 0.45));
        },
      },
      "psycho-boost": {
        warn(e, t, n, r, i, a, o) {
          (e.vfx.add.spawn({
            x: t,
            y: n + 6,
            z: r,
            life: o,
            size: 1,
            endSize: i * 0.9,
            color: cp,
            shape: I.Soft,
            glow: 0,
          }),
            e.vfx.norm.spawn({
              x: t,
              y: n + 6,
              z: r,
              life: o,
              size: 0.5,
              endSize: 1.6,
              color: 16777215,
              shape: I.PixSparkle,
              spin: 6,
            }),
            e.vfx.telegraph(t, n, r, i, cp, o));
        },
        sky(e, t, n, r, i) {
          (Hp(e, t, n, r, 2, cp, 16769279), e.vfx.flash(t, n + 1, r, cp, i * 1.2, 0.14));
          for (let a = 0; a < 3; a++)
            e.later(a * 0.07, () =>
              e.vfx.ring(t, n, r, i * (0.55 + a * 0.25), a === 1 ? 16777215 : cp, 0.45, 0.6, L.Runes),
            );
          (bp(e, t, n, r, 14199039, 10, i * 2.2, I.Crescent, 1.2, 0.4),
            mp(e, t, r, i * 1.3, 16777215, I.PixCrack, 1.8),
            e.shake(0.25, t, r));
        },
      },
      mist: {
        aura(e, t, n, r, i, a, o) {
          if (Math.random() < 0.5) {
            let a = F.range(0, z),
              o = F.range(0.5, i);
            e.vfx.norm.spawn({
              x: t + Math.cos(a) * o,
              y: n + F.range(0.2, 1.2),
              z: r + Math.sin(a) * o,
              vx: -Math.sin(a) * 1.5,
              vz: Math.cos(a) * 1.5,
              drag: 1,
              life: 0.9,
              size: 0.6,
              endSize: 1.4,
              color: 14217471,
              shape: I.PixPuff,
            });
          }
          if (o)
            for (let a = 0; a < 4; a++) {
              let a = F.range(0, z),
                o = F.range(1, i);
              e.vfx.norm.spawn({
                x: t + Math.cos(a) * o,
                y: n + 1,
                z: r + Math.sin(a) * o,
                vy: -0.5,
                life: 0.6,
                size: 0.35,
                endSize: 0.25,
                color: 16777215,
                shape: I.PixSnow,
                spin: 2,
              });
            }
        },
      },
    },
    z = Math.PI * 2,
    dp = (e) => e.vfx.add,
    fp = (e, t) => Math.atan2(t, e);
  function pp(e, t, n, r, i, a = 4, o = I.Soft) {
    let s = e.player.pos;
    for (let c = 0; c < a; c++) {
      let a = F.range(0.35, 0.55),
        c = F.range(-0.4, 0.4),
        l = F.range(-0.4, 0.4);
      dp(e).spawn({
        x: t + c,
        y: n,
        z: r + l,
        vx: (s.x - t - c) / a,
        vy: (s.y + 1 - n) / a + 2,
        vz: (s.z - r - l) / a,
        gravity: 4,
        life: a,
        size: 0.45,
        endSize: 0.2,
        color: i,
        shape: o,
        glow: 0.8,
      });
    }
  }
  function mp(e, t, n, r, i, a, o = 1.2, s = F.range(0, z)) {
    gp(e, t, n, r, i, a, o, s, 0.08);
  }
  var hp = 6;
  function gp(e, t, n, r, i, a, o, s, c) {
    let l = (t, n, r, s) =>
      e.vfx.groundN.spawn({
        x: t,
        y: e.terrain.height(t, n) + c,
        z: n,
        life: o,
        size: r,
        endSize: r,
        color: i,
        shape: a,
        rot: s,
      });
    if (r <= hp) {
      l(t, n, r, s);
      return;
    }
    l(t, n, hp, s);
    let u = Math.min(9, Math.round((r / hp) ** 2 * 0.7));
    for (let e = 0; e < u; e++) {
      let i = (e / u) * z + F.range(-0.3, 0.3),
        a = (r * 0.5 - hp * 0.35) * F.range(0.55, 1);
      l(t + Math.cos(i) * a, n + Math.sin(i) * a, hp * F.range(0.6, 0.95), F.range(0, z));
    }
  }
  function _p(e, t, n, r, i, a, o, s = I.Rock, c = 0.45) {
    a=Math.min(Math.ceil(a),e.vfx.norm.available(t,n+.3,r,c*1.3));
    for (let l = 0; l < a; l++) {
      let a = F.range(0, z),
        l = o * F.range(0.4, 1);
      e.vfx.norm.spawn({
        x: t,
        y: n + 0.3,
        z: r,
        vx: Math.cos(a) * l,
        vy: F.range(4, 9),
        vz: Math.sin(a) * l,
        gravity: 22,
        life: F.range(0.5, 0.8),
        size: c * F.range(0.6, 1.3),
        endSize: c * 0.6,
        color: i,
        shape: s,
        spin: F.range(-8, 8),
      });
    }
  }
  function vp(e, t, n, r, i, a, o, s, c = 0.6, l = 0.45, u = 0, d = 0.4) {
    a=Math.min(Math.ceil(a),e.vfx.add.available(t,n,r,c));
    for (let f = 0; f < a; f++) {
      let p = (f / a) * z + F.range(-0.1, 0.1),
        m = o * F.range(0.8, 1.1);
      dp(e).spawn({
        x: t,
        y: n,
        z: r,
        vx: Math.cos(p) * m - Math.sin(p) * u,
        vy: F.range(0, 1.5),
        vz: Math.sin(p) * m + Math.cos(p) * u,
        life: l,
        size: c,
        endSize: c * 0.3,
        color: i,
        shape: s,
        drag: 2.5,
        glow: d,
        spin: F.range(-5, 5),
      });
    }
  }
  function yp(e, t, n, r, i, a, o, s, c = 0.6, l = 0.45, u = 0) {
    a=Math.min(Math.ceil(a),e.vfx.norm.available(t,n,r,c));
    for (let d = 0; d < a; d++) {
      let f = (d / a) * z + F.range(-0.1, 0.1),
        p = o * F.range(0.8, 1.1);
      e.vfx.norm.spawn({
        x: t,
        y: n,
        z: r,
        vx: Math.cos(f) * p - Math.sin(f) * u,
        vy: F.range(0, 1.5),
        vz: Math.sin(f) * p + Math.cos(f) * u,
        life: l,
        size: c,
        endSize: c * 0.5,
        color: i,
        shape: s,
        drag: 2.5,
        spin: F.range(-5, 5),
      });
    }
  }
  function bp(e, t, n, r, i, a, o, s, c, l, u = 0, d = z) {
    for (let f = 0; f < a; f++) {
      let p = u + (d >= z ? (f / a) * z : (f / Math.max(1, a - 1) - 0.5) * d);
      e.vfx.ground.spawn({
        x: t,
        y: n + 0.5,
        z: r,
        vx: Math.cos(p) * o,
        vz: Math.sin(p) * o,
        life: l,
        size: c * 0.5,
        endSize: c * 1.6,
        color: i,
        shape: s,
        rot: p,
        glow: 0.5,
      });
    }
  }
  function xp(e, t, n, r, i, a, o, s, c, l, u, d = 8) {
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
        x = n + (a - n) * o + Math.sin(o * Math.PI) * Math.abs(s) * 0.4,
        S = r + p * o + g * m;
      (e.vfx.beams.spawn(_, v, y, b, x, S, c * (1 - o * 0.4), l, u), (_ = b), (v = x), (y = S));
    }
  }
  function B(e, t, n, r, i, a, o, s, c = 0.22, l = 0, u = 0.7) {
    dp(e).spawn({
      x: t,
      y: n,
      z: r,
      life: c,
      size: o,
      endSize: Math.min(s, 3.2),
      color: a,
      shape: i,
      rot: l,
      glow: Math.min(u, 0.3),
    });
  }
  function Sp(e, t, n, r, i, a, o, s, c, l = 1) {
    let u = i - t,
      d = a - n,
      f = o - r,
      p = Math.hypot(u, f) || 1;
    for (let i = 0; i < l; i++) {
      if (Math.random() < 0.55) continue;
      let i = Math.random() * 0.9;
      dp(e).spawn({
        x: t + u * i,
        y: n + d * i,
        z: r + f * i,
        vx: (u / p) * 14,
        vz: (f / p) * 14,
        life: 0.22,
        size: c * 0.7,
        endSize: c,
        color: s[Math.floor(Math.random() * s.length)],
        shape: I.Ring,
        glow: 0,
      });
    }
  }
  function Cp(e, t, n, r, i, a, o, s, c, l) {
    (e.vfx.beams.spawn(t, n, r, i, a, o, s * 1.15, c, 0.05),
      e.vfx.beams.spawn(t, n, r, i, a, o, s * 0.5, wp(c, l, 0.5), 0.05));
  }
  function wp(e, t, n) {
    let r = (r) => Math.round(((e >> r) & 255) * (1 - n) + ((t >> r) & 255) * n);
    return (r(16) << 16) | (r(8) << 8) | r(0);
  }
  function Tp(e, t, n, r, i, a, o, s, c, l, u = 0.6, d = 0, f = 1.5) {
    let p = i - t,
      m = o - r,
      h = Math.hypot(p, m) || 1;
    for (let i = 0; i < l; i++) {
      let i = Math.random(),
        o = F.range(5, 10);
      dp(e).spawn({
        x: t + p * i,
        y: n + (a - n) * i + F.range(-0.3, 0.3),
        z: r + m * i,
        vx: (p / h) * o + F.range(-f, f),
        vy: F.range(-0.5, 2),
        vz: (m / h) * o + F.range(-f, f),
        gravity: d,
        life: 0.4,
        size: u,
        endSize: 0,
        color: s,
        shape: c,
        glow: 0.5,
        spin: 6,
      });
    }
  }
  function Ep(e, t, n, r, i, a, o, s, c, l = c * 0.35, u = 2) {
    e.vfx.norm.spawn({
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
      shape: I.PixFlame,
      drag: u,
      rot: F.range(-0.15, 0.15),
    });
  }
  function Dp(e, t, n, r, i, a = 9075316, o = 0.9) {
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
  function Op(e, t, n, r, i, a, o = 0.6) {
    for (let s = 0; s < i; s++) {
      let i = F.range(0, z),
        c = a * F.range(0.4, 1);
      dp(e).spawn({
        x: t,
        y: n,
        z: r,
        vx: Math.cos(i) * c,
        vy: F.range(2, 6),
        vz: Math.sin(i) * c,
        gravity: 7,
        drag: 1.5,
        life: o * F.range(0.6, 1.2),
        size: 0.16,
        endSize: 0.06,
        color: s % 3 ? V.fire : V.fireCore,
        endColor: V.fireDeep,
        shape: I.Square,
        glow: 0.15,
      });
    }
  }
  function kp(e, t, n, r, i, a, o, s, c, l = c * 0.5, u = 18, d = 0.6) {
    e.vfx.norm.spawn({
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
      shape: I.PixWaterBall,
      gravity: u,
      drag: d,
      rot: 0,
    });
  }
  function Ap(e, t, n, r, i, a = 0.5, o = 0, s = 0.8, c = 0) {
    e.vfx.norm.spawn({
      x: t,
      y: n,
      z: r,
      vx: o,
      vy: s,
      vz: c,
      drag: 3,
      life: a,
      size: i * 0.55,
      endSize: i,
      color: 16777215,
      endColor: 13691124,
      shape: I.PixFoam,
      rot: F.range(-0.3, 0.3),
    });
  }
  function jp(e, t, n, r, i, a = 0.8) {
    e.vfx.norm.spawn({
      x: t + F.range(-0.4, 0.4),
      y: n,
      z: r + F.range(-0.4, 0.4),
      vx: F.range(-0.6, 0.6),
      vy: F.range(0.8, 1.8),
      vz: F.range(-0.6, 0.6),
      drag: 1.5,
      life: a,
      size: i * 0.6,
      endSize: i * 1.4,
      color: 15004927,
      endColor: 12114156,
      shape: I.PixPuff,
    });
  }
  function Mp(e, t, n, r, i = 1.2) {
    e.vfx.groundN.spawn({
      x: t,
      y: e.terrain.height(t, n) + 0.07,
      z: n,
      life: i,
      size: r * 0.7,
      endSize: r * 1.15,
      color: 16777215,
      shape: I.PixPuddle,
      rot: F.range(0, z),
    });
  }
  function Np(e, t, n, r, i, a = 1) {
    let o = Math.min(n, e.terrain.height(t, r) + 0.6),
      s = e.terrain.height(t, r);
    e.vfx.norm.spawn({
      x: t,
      y: s + i * 0.42,
      z: r,
      life: 0.26,
      size: i * 0.55,
      endSize: i * 1.2,
      color: 16777215,
      shape: I.PixSplash,
      rot: 0,
    });
    let c = Math.round(5 + i * 3 * a);
    for (let n = 0; n < c; n++) {
      let s = (n / c) * z + F.range(-0.2, 0.2),
        l = F.range(i * 1.1, i * 2.4);
      kp(
        e,
        t,
        o + 0.3,
        r,
        Math.cos(s) * l,
        F.range(5, 9) * a,
        Math.sin(s) * l,
        F.range(0.5, 0.75),
        F.range(0.3, 0.55) * Math.min(1.6, 0.7 + i * 0.25),
        0.18,
        22,
      );
    }
    for (let n = 0; n < Math.round(2 + 2 * a); n++)
      kp(
        e,
        t + F.range(-0.3, 0.3),
        o + 0.5,
        r + F.range(-0.3, 0.3),
        F.range(-1, 1),
        F.range(9, 13) * a,
        F.range(-1, 1),
        0.6,
        F.range(0.45, 0.7),
        0.25,
        24,
      );
    for (let n = 0; n < 4; n++) {
      let a = (n / 4) * z + F.range(0, 1);
      Ap(
        e,
        t + Math.cos(a) * i * 0.3,
        s + 0.35,
        r + Math.sin(a) * i * 0.3,
        i * 0.55 + 0.3,
        0.5,
        Math.cos(a) * i * 1.4,
        0.6,
        Math.sin(a) * i * 1.4,
      );
    }
    if ((Mp(e, t, r, i * 1.1), i >= 1.4)) for (let n = 0; n < 2; n++) jp(e, t, s + 0.8, r, i * 0.6);
  }
  function Pp(e, t, n, r, i, a = 0.45, o = 0, s = z) {
    let c = e.terrain.height(t, r),
      l = Math.round(((10 + i * 3) * s) / z),
      u = (i * 0.85) / a;
    for (let n = 0; n < l; n++) {
      let d = o + (s >= z ? (n / l) * z : (n / Math.max(1, l - 1) - 0.5) * s) + F.range(-0.08, 0.08),
        f = Math.cos(d),
        p = Math.sin(d);
      (e.vfx.norm.spawn({
        x: t + f * i * 0.15,
        y: c + 0.45,
        z: r + p * i * 0.15,
        vx: f * u,
        vz: p * u,
        life: a,
        size: 0.7 + i * 0.04,
        endSize: 1.1 + i * 0.09,
        color: 16777215,
        endColor: 13691124,
        shape: I.PixFoam,
        rot: F.range(-0.3, 0.3),
      }),
        n % 3 == 0 &&
          kp(
            e,
            t + f * i * 0.2,
            c + 0.6,
            r + p * i * 0.2,
            f * u * 0.9,
            F.range(4, 7),
            p * u * 0.9,
            a * 1.1,
            0.4,
            0.15,
            20,
            0,
          ));
    }
  }
  function Fp(e, t, n, r, i, a, o, s, c = 1) {
    let l = i - t,
      u = a - n,
      d = o - r,
      f = Math.hypot(l, d) || 1,
      p = l / f,
      m = d / f,
      h = -m,
      g = p,
      _ = Math.max(32, f / 0.28),
      v = f / _,
      y = e.time,
      b = (e, i) => {
        let a = Math.sin(e * 7 - y * 18) * s * 0.18 * e;
        ((i[0] = t + l * e + h * a), (i[1] = n + u * e), (i[2] = r + d * e + g * a));
      },
      x = [t, n, r],
      S = [0, 0, 0];
    for (let t = 1; t <= 14; t++) {
      let n = t / 14;
      (b(n, S),
        e.vfx.beams.spawn(
          x[0],
          x[1],
          x[2],
          S[0],
          S[1],
          S[2],
          s * 0.55 * c * (0.75 + n * 0.35) * (1 + 0.28 * Math.sin(n * 18 - y * 46)),
          V.water,
          0.05,
        ),
        (x[0] = S[0]),
        (x[1] = S[1]),
        (x[2] = S[2]));
    }
    for (let t = 0; t < 3; t++) {
      let n = (y * 3.2 + t / 3) % 1,
        r = Math.min(1, n + 0.12);
      (b(n, x), b(r, S));
      let i = (t - 1) * s * 0.08;
      e.vfx.beams.spawn(x[0], x[1] + i, x[2], S[0], S[1] + i, S[2], s * 0.1 * c, 14218495, 0.05);
    }
    for (let i = 0; i < 2; i++) {
      let a = y * 21 + i * Math.PI,
        o = Math.sin(a) * s * 0.28 * c;
      e.vfx.norm.spawn({
        x: t + h * o,
        y: n + Math.cos(a) * s * 0.18 * c,
        z: r + g * o,
        vx: p * _,
        vy: (u / f) * _ + 0.6,
        vz: m * _,
        gravity: 3,
        life: v * 0.95,
        size: s * 0.32 * c,
        endSize: s * 0.5 * c,
        color: 16777215,
        shape: I.PixWaterBlob,
        rot: 0,
      });
    }
    for (let i = 0; i < 4; i++) {
      let a = y * 28 + (Math.PI / 2) * i + (i % 2) * 0.4,
        o = s * 0.34 * c,
        l = Math.cos(a) * o;
      e.vfx.norm.spawn({
        x: t + h * l,
        y: n + Math.sin(a) * o,
        z: r + g * l,
        vx: p * _,
        vy: (u / f) * _ + 0.6,
        vz: m * _,
        gravity: 3,
        life: v,
        size: s * 0.16 * c,
        endSize: s * 0.26 * c,
        color: 16777215,
        endColor: 14216952,
        shape: I.PixFoam,
        rot: F.range(-0.3, 0.3),
      });
    }
    if (Math.random() < 0.7) {
      let i = Math.random(),
        a = Math.random() < 0.5 ? -1 : 1;
      e.vfx.norm.spawn({
        x: t + l * i + h * a * s * 0.5,
        y: n + u * i,
        z: r + d * i + g * a * s * 0.5,
        vx: p * _ * 0.25 + h * a * F.range(2, 4),
        vy: F.range(2, 5),
        vz: m * _ * 0.25 + g * a * F.range(2, 4),
        gravity: 20,
        life: 0.4,
        size: 0.3,
        endSize: 0.14,
        color: 16777215,
        shape: I.PixDrop,
        rot: 0,
      });
    }
    let C = e.terrain.height(i, o),
      w = Math.max(a, C + 0.5);
    for (let t = 0; t < 2; t++) {
      let t = F.range(0, z),
        n = F.range(2, 5);
      kp(
        e,
        i - p * 0.5,
        w,
        o - m * 0.5,
        Math.cos(t) * n - p * 3,
        F.range(5, 10),
        Math.sin(t) * n - m * 3,
        F.range(0.45, 0.7),
        F.range(0.3, 0.5) * c,
        0.15,
        22,
      );
    }
    (Math.random() < 0.35 && Ap(e, i, w, o, s * 1.4 * c, 0.4, F.range(-1, 1), 2, F.range(-1, 1)),
      Math.random() < 0.04 && Mp(e, i, o, s * 2.4 * c, 1.2),
      Math.random() < 0.08 && jp(e, i, w + 0.5, o, s * 1.8 * c),
      Math.random() < 0.4 && Ap(e, t + p * 0.3, n, r + m * 0.3, s * 0.9 * c, 0.16, p * 4, 0.5, m * 4));
  }
  function Ip(e, t, n, r, i, a, o, s = e.rot[t], c = 0) {
    (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.9, o, I.Soft, 0, 0.3, 0.55 * r),
      e.pool.push(e.x[t], e.y[t], e.z[t], n, a, i, s, 0.3),
      c && e.glow.push(e.x[t], e.y[t], e.z[t], n * 0.5, c, I.Soft, 0, 0.8, r));
  }
  function Lp(e, t, n, r, i, a, o = 4) {
    for (let s = 0; s < o; s++) {
      let c = s / (o - 1),
        l = e.rot[t] * (1.4 + s * 0.3) + s;
      e.glow.push(
        e.x[t],
        e.y[t] - 0.6 + c * n * 1.2,
        e.z[t],
        n * (0.55 + c * 0.6),
        s === o - 1 ? a : i,
        I.Swirl,
        l,
        0.4,
        0.8 * r,
      );
    }
    e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.6, i, I.Soft, 0, 0.2, 0.3 * r);
  }
  function Rp(e, t, n, r, i, a, o, s, c = !0) {
    for (let l = 0; l < o; l++) {
      let u = e.rot[t] * 0.8 + (l / o) * z,
        d = ((l * 0.37 + e.rot[t] * 0.15) % 1) * n;
      (c ? e.glow : e.pool).push(
        e.x[t] + Math.cos(u) * s,
        e.y[t] - 0.4 + d,
        e.z[t] + Math.sin(u) * s,
        n * 0.35,
        a,
        i,
        u,
        0.5,
        r,
      );
    }
  }
  function zp(e, t, n, r, i, a, o, s, c = 26, l = 6) {
    s = Math.min(s, 2.4);
    let u = t + l,
      d = r - l * 0.6,
      f = n + c;
    (e.vfx.norm.spawn({
      x: u,
      y: f,
      z: d,
      vx: (t - u) / i,
      vy: (n - f) / i,
      vz: (r - d) / i,
      life: i,
      size: s,
      endSize: s * 1.15,
      color: a,
      shape: o,
      spin: 6,
    }),
      e.vfx.add.spawn({
        x: u,
        y: f,
        z: d,
        vx: (t - u) / i,
        vy: (n - f) / i,
        vz: (r - d) / i,
        life: i,
        size: s * 1.3,
        endSize: s * 1.5,
        color: a,
        shape: I.Soft,
        glow: 0,
      }));
  }
  var V = {
      leaf: 8050762,
      leafDark: 3840570,
      sun: 16773792,
      fire: 16747050,
      fireCore: 16769162,
      fireDeep: 16726554,
      blueFire: 6982399,
      water: 4892927,
      foam: 15267583,
      volt: 16769594,
      ice: 11071743,
      snow: 16055295,
      psy: 16739032,
      ghost: 10115839,
      shadow: 2756672,
      dragon: 8018687,
      rock: 11047018,
      dirt: 9071178,
      sand: 14203e3,
      aura: 4885247,
      fairy: 16751320,
      moon: 16767220,
      poison: 11553504,
      bug: 12116042,
      air: 13166847,
      white: 16777215,
      punch: 16758858,
      dark: 10124031,
      darkDeep: 2364462,
      gemGold: 16767050,
      steel: 12110048,
      steelDark: 5925504,
      mud: 9071162,
      mudDark: 5914664,
      wool: 16775400,
      horn: 9085160,
    },
    Bp = [16730730, 4901119, 8060810, 16767050],
    Vp = {
      "vine-whip": {
        strike(e, t, n, r, i, a, o, s, c) {
          let l = e.player.pos,
            u = c % 2 ? -1 : 1;
          for (let s of [u, -u * 0.6])
            xp(e, l.x, l.y + 0.9, l.z, t + i * o * 0.3, n, r + a * o * 0.3, s * 1.1, 0.22, V.leafDark, 0.2);
          (B(e, t + i * o * 0.3, n + 0.2, r + a * o * 0.3, I.Twinkle, V.white, 0.4, 2.2, 0.15),
            vp(e, t, n, r, V.leaf, 6, 5, I.Leaf, 0.45, 0.4));
        },
      },
      "razor-leaf": {
        shape: I.Leaf,
        color: V.leaf,
        size: 1.2,
        trail(e, t, n, r) {
          Math.random() < 0.5 && e.vfx.trail(t, n, r, V.leafDark, 0.3, I.Leaf, 0.3);
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Cross, V.leaf, 0.4, 1.4, 0.15), vp(e, t, n, r, V.leaf, 4, 4, I.Leaf, 0.3, 0.3));
        },
      },
      "sleep-powder": {
        cone(e, t, n, r, i, a, o, s, c) {
          if (Math.random() < 0.5) return;
          let l = Math.sqrt(c / 7),
            u = Math.random(),
            d = u < 0.45 ? 11072708 : u < 0.85 ? 13286655 : 10150132;
          (e.vfx.norm.spawn({
            x: t,
            y: n + F.range(-0.2, 0.5),
            z: r,
            vx: i * 0.95 + F.range(-1.5, 1.5),
            vy: a * 0.3 + 1,
            vz: o * 0.95 + F.range(-1.5, 1.5),
            gravity: 0.9,
            drag: 0.7,
            life: s * 1.5,
            size: 0.28,
            endSize: 0.55 * l,
            color: d,
            shape: I.PixSpore,
            spin: F.range(-1.5, 1.5),
          }),
            Math.random() < 0.12 &&
              dp(e).spawn({
                x: t + i * s * 0.4,
                y: n + 0.3,
                z: r + o * s * 0.4,
                vx: i * 0.3,
                vy: 0.5,
                vz: o * 0.3,
                drag: 1,
                life: 0.5,
                size: 0.3,
                endSize: 0,
                color: 10158024,
                shape: I.Twinkle,
                glow: 0.1,
                spin: 4,
              }));
        },
      },
      "solar-beam": {
        beam(e, t, n, r, i, a, o, s) {
          (Cp(e, t, n, r, i, a, o, s * 1.2, 10157914, V.sun),
            Tp(e, t, n, r, i, a, o, V.sun, I.Twinkle, 2, 0.7),
            Math.random() < 0.4 && Tp(e, t, n, r, i, a, o, V.leaf, I.Leaf, 1, 0.5));
        },
        cast(e, t, n, r) {
          vp(e, t, n + 2.5, r, V.sun, 10, 4, I.Twinkle, 0.6, 0.5);
        },
      },
      absorb: {
        shape: I.Spore,
        color: 10157946,
        size: 1,
        hit(e, t, n, r) {
          pp(e, t, n, r, 10157946, 4, I.Twinkle);
        },
      },
      "leech-life": {
        shape: I.Drop,
        color: 16734842,
        size: 1,
        trail(e, t, n, r) {
          e.vfx.trail(t, n, r, 11545162, 0.3, I.Soft, 0.25);
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Fang, 16767200, 0.9, 0.4, 0.18), pp(e, t, n, r, 16734842, 4, I.Drop));
        },
      },
      "leaf-blade": {
        shape: I.Crescent,
        color: 10157930,
        size: 1.15,
        trail(e, t, n, r, i, a) {
          e.vfx.add.spawn({
            x: t,
            y: n,
            z: r,
            life: 0.18,
            size: a * 0.9,
            endSize: a * 0.6,
            color: V.leafDark,
            shape: I.Crescent,
            rot: F.range(0, z),
            glow: 0.3,
          });
        },
        hit(e, t, n, r) {
          B(e, t, n, r, I.Cross, 14221232, 0.5, 1.8, 0.14);
        },
      },
      "leaf-storm": {
        nova(e, t, n, r, i) {
          (e.vfx.ring(t, n, r, i, V.leaf, 0.5),
            yp(e, t, n + 0.6, r, V.leaf, 22, i * 2.2, I.Leaf, 0.7, 0.55, i * 2.5),
            yp(e, t, n + 1.6, r, V.leafDark, 14, i * 1.6, I.Leaf, 0.6, 0.6, -i * 2),
            e.later(0.12, () => e.vfx.ring(t, n, r, i * 0.75, 14221232, 0.35)));
        },
      },
      "magical-leaf": {
        shape: I.Leaf,
        color: 12124042,
        size: 1,
        trail(e, t, n, r) {
          e.vfx.trail(
            t,
            n,
            r,
            [16747224, 9099519, 16771178][Math.floor(Math.random() * 3)],
            0.3,
            I.Twinkle,
            0.35,
          );
        },
        hit(e, t, n, r) {
          vp(e, t, n, r, 16771178, 5, 4, I.Twinkle, 0.4, 0.3);
        },
      },
      ember: {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.3, V.fire, I.Soft, 0, 0, 0.25 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.95, 16777215, I.PixFlame, 0, 0, r));
        },
        trail(e, t, n, r) {
          e.vfx.add.spawn({
            x: t,
            y: n,
            z: r,
            vx: F.range(-1, 1),
            vy: F.range(0, 1.5),
            vz: F.range(-1, 1),
            gravity: 6,
            life: 0.35,
            size: 0.15,
            endSize: 0,
            color: V.fire,
            shape: I.Square,
            glow: 0.15,
          });
        },
        hit(e, t, n, r) {
          for (let i = 0; i < 4; i++) {
            let i = F.range(0, z);
            Ep(e, t, n, r, Math.cos(i) * 3, F.range(1, 3), Math.sin(i) * 3, 0.35, 0.55);
          }
          Op(e, t, n, r, 3, 3, 0.4);
        },
      },
      "fire-spin": {
        draw(e, t, n, r) {
          (Rp(e, t, n, r, I.PixFlame, 16777215, 7, n * 0.55, !1),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 0.9, V.fireDeep, I.Swirl, e.rot[t], 0.1, 0.45 * r));
        },
        trail(e, t, n, r, i, a) {
          Ep(e, t + F.range(-1, 1), n - 0.4, r + F.range(-1, 1), 0, 3, 0, 0.45, a * 0.35, 0);
        },
        boom(e, t, n, r, i) {
          e.vfx.ring(t, e.terrain.height(t, r), r, i, V.fireDeep, 0.4);
          for (let a = 0; a < 14; a++) {
            let o = (a / 14) * z;
            Ep(
              e,
              t + Math.cos(o) * i * 0.5,
              n,
              r + Math.sin(o) * i * 0.5,
              -Math.sin(o) * 6,
              F.range(5, 9),
              Math.cos(o) * 6,
              0.5,
              0.9,
              0.2,
            );
          }
          Op(e, t, n, r, 6, 4);
        },
      },
      flamethrower: {
        cone(e, t, n, r, i, a, o, s, c) {
          let l = Math.sqrt(c / 7);
          (Ep(e, t, n, r, i * 1.15, a * 0.5 + 0.6, o * 1.15, s, 0.45, 1.7 * l, 0.4),
            Math.random() < 0.2 && Op(e, t + i * s * 0.5, n, r + o * s * 0.5, 1, 2, 0.4),
            Math.random() < 0.06 && Dp(e, t + i * s * 0.8, n + 0.5, r + o * s * 0.8, 0.9, 9075316, 0.6));
        },
      },
      "fire-blast": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.5, V.fireDeep, I.Soft, 0, 0, 0.3 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.15, 16777215, I.PixFlame, 0, 0, r));
        },
        trail(e, t, n, r, i, a) {
          Ep(e, t + F.range(-0.3, 0.3), n, r + F.range(-0.3, 0.3), 0, 1.5, 0, 0.3, a * 0.5, 0.1);
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          (e.vfx.ring(t, a, r, i, V.fireDeep, 0.45), e.vfx.flash(t, a + 1, r, V.fire, i * 0.7, 0.12));
          for (let n = 0; n < 5; n++) {
            let o = (n / 5) * z - Math.PI / 2;
            for (let n = 0; n < 5; n++) {
              let s = i * (0.25 + n * 0.22),
                c = 1.35 - n * 0.14;
              e.later(n * 0.035, () =>
                Ep(
                  e,
                  t + Math.cos(o) * s,
                  a + 0.6,
                  r + Math.sin(o) * s,
                  Math.cos(o) * 2,
                  F.range(2, 4),
                  Math.sin(o) * 2,
                  0.45,
                  c,
                  c * 0.3,
                  3,
                ),
              );
            }
          }
          for (let n = 0; n < 5; n++)
            Ep(e, t, a + 0.4, r, F.range(-1, 1), 5 + n * 1.5, F.range(-1, 1), 0.5, 1.3, 0.3, 2.5);
          Op(e, t, a + 0.6, r, 10, i * 1.4, 0.7);
          for (let n = 0; n < 2; n++) e.later(0.2 + n * 0.08, () => Dp(e, t, a + 1.4, r, 0.9, 10128518, 0.7));
          mp(e, t, r, i * 1.6, 2759188, I.Soft, 1.5);
        },
      },
      "will-o-wisp": {
        shape: I.Wisp,
        color: V.blueFire,
        size: 1.3,
        trail(e, t, n, r) {
          e.vfx.add.spawn({
            x: t,
            y: n,
            z: r,
            vy: 1.5,
            life: 0.4,
            size: 0.45,
            endSize: 0,
            color: 9071359,
            shape: I.Flame,
            glow: 0.6,
          });
        },
        hit(e, t, n, r) {
          vp(e, t, n, r, V.blueFire, 7, 3, I.Flame, 0.5, 0.45);
        },
      },
      "heat-wave": {
        cone(e, t, n, r, i, a, o, s, c) {
          (Math.random() < 0.25 &&
            e.vfx.ground.spawn({
              x: t,
              y: n - 0.3,
              z: r,
              vx: i * 0.8,
              vz: o * 0.8,
              life: s * 1.1,
              size: 0.8,
              endSize: 2.2 * Math.sqrt(c / 7),
              color: 12077082,
              shape: I.Crescent,
              rot: fp(i, o),
              glow: 0,
            }),
            dp(e).spawn({
              x: t,
              y: n,
              z: r,
              vx: i * 0.9,
              vy: F.range(0, 1.5),
              vz: o * 0.9,
              life: s,
              size: 0.3,
              endSize: 0.8,
              color: 16756842,
              endColor: 16734762,
              shape: I.Soft,
              glow: 0.2,
            }));
        },
      },
      "water-gun": {
        draw(e, t, n, r) {
          let i = Math.hypot(e.vx[t], e.vz[t]) || 1,
            a = e.vx[t] / i,
            o = e.vz[t] / i;
          for (let i = 3; i >= 0; i--)
            e.pool.push(
              e.x[t] - a * i * n * 0.42,
              e.y[t] + Math.sin(e.rot[t] * 9 + i * 1.3) * 0.05,
              e.z[t] - o * i * n * 0.42,
              n * (1.05 - i * 0.2),
              16777215,
              I.PixWaterBall,
              0,
              0,
              r * (1 - i * 0.12),
            );
          e.pool.push(
            e.x[t] + a * n * 0.15,
            e.y[t] + n * 0.18,
            e.z[t] + o * n * 0.15,
            n * 0.5,
            16777215,
            I.PixFoam,
            0,
            0,
            r,
          );
        },
        trail(e, t, n, r) {
          Math.random() < 0.45 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: F.range(-1, 1),
              vy: F.range(0, 1.5),
              vz: F.range(-1, 1),
              gravity: 18,
              life: 0.4,
              size: 0.24,
              endSize: 0.1,
              color: 16777215,
              shape: I.PixDrop,
              rot: 0,
            });
        },
        hit(e, t, n, r) {
          Np(e, t, n, r, 0.8, 0.6);
        },
      },
      bubble: {
        shape: I.PixBubble,
        color: 16777215,
        size: 1.2,
        draw(e, t, n, r) {
          let i = e.rot[t],
            a = Math.sin(i * 2.2) * 0.12,
            o = e.y[t] + Math.sin(i * 1.7) * 0.18;
          e.pool.push(e.x[t], o, e.z[t], n * (1 + a), 16777215, I.PixBubble, 0, 0, r);
          for (let a = 0; a < 2; a++) {
            let s = i * 1.3 + a * Math.PI,
              c = n * 0.62;
            e.pool.push(
              e.x[t] + Math.cos(s) * c,
              o + Math.sin(i * 2.6 + a * 2) * n * 0.35,
              e.z[t] + Math.sin(s) * c,
              n * (0.32 - a * 0.08),
              16777215,
              I.PixBubble,
              0,
              0,
              r,
            );
          }
          e.glow.push(
            e.x[t] - n * 0.18,
            o + n * 0.2,
            e.z[t],
            n * 0.35,
            V.foam,
            I.Twinkle,
            i * 0.5,
            0.1,
            0.5 * r,
          );
        },
        trail(e, t, n, r, i, a) {
          Math.random() < 0.3 &&
            e.vfx.norm.spawn({
              x: t + F.range(-0.3, 0.3),
              y: n,
              z: r + F.range(-0.3, 0.3),
              vx: F.range(-0.4, 0.4),
              vy: F.range(1, 2),
              vz: F.range(-0.4, 0.4),
              drag: 1.5,
              life: 0.45,
              size: a * 0.22,
              endSize: a * 0.3,
              color: 16777215,
              shape: I.PixBubble,
            });
        },
        hit(e, t, n, r) {
          (e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            life: 0.18,
            size: 0.5,
            endSize: 1.3,
            color: 16777215,
            shape: I.PixSplash,
            rot: 0,
          }),
            Ap(e, t, n, r, 0.7, 0.3),
            _p(e, t, n, r, 16777215, 4, 3, I.PixDrop, 0.28));
          for (let i = 0; i < 4; i++) {
            let i = F.range(0, z);
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: Math.cos(i) * 2.5,
              vy: F.range(1, 2.5),
              vz: Math.sin(i) * 2.5,
              drag: 3,
              life: F.range(0.35, 0.55),
              size: F.range(0.2, 0.32),
              endSize: 0.1,
              color: 16777215,
              shape: I.PixBubble,
            });
          }
        },
      },
      "rapid-spin": {
        nova(e, t, n, r, i) {
          e.vfx.groundN.spawn({
            x: t,
            y: e.terrain.height(t, r) + 0.09,
            z: r,
            life: 0.5,
            size: i * 1.5,
            endSize: i * 2.1,
            color: 16777215,
            shape: I.PixWaterSwirl,
            rot: F.range(0, z),
            spin: -16,
          });
          let a = F.range(0, z);
          for (let t = 0; t < 9; t++)
            e.later(t * 0.035, () => {
              let n = e.player.pos,
                r = e.terrain.height(n.x, n.z);
              for (let o = 0; o < 3; o++) {
                let s = a - t * 0.7 - (o / 3) * z,
                  c = i * (0.45 + t * 0.03),
                  l = Math.cos(s),
                  u = Math.sin(s);
                (e.vfx.groundN.spawn({
                  x: n.x,
                  y: r + 0.35 + o * 0.02,
                  z: n.z,
                  life: 0.07,
                  size: c * 2.2,
                  endSize: c * 2.2,
                  color: 16777215,
                  shape: I.PixWaterArc,
                  rot: s,
                }),
                  t % 2 == 0 &&
                    kp(
                      e,
                      n.x + l * c,
                      r + 0.6,
                      n.z + u * c,
                      u * 9 + l * 3,
                      F.range(2, 4),
                      -l * 9 + u * 3,
                      0.45,
                      0.4,
                      0.15,
                      16,
                      0.5,
                    ));
              }
            });
          e.later(0.3, () => {
            let t = e.player.pos;
            Pp(e, t.x, t.y, t.z, i, 0.35);
          });
        },
      },
      "hydro-pump": {
        beam(e, t, n, r, i, a, o, s) {
          Fp(e, t, n, r, i, a, o, s * 0.9, 1.15);
        },
        cast(e, t, n, r, i, a) {
          for (let o = 0; o < 5; o++)
            Ap(
              e,
              t + i,
              n + 1,
              r + a,
              1.3,
              0.35,
              i * 5 + F.range(-2, 2),
              F.range(0, 2),
              a * 5 + F.range(-2, 2),
            );
          jp(e, t + i, n + 1, r + a, 1.6, 0.6);
        },
      },
      waterfall: {
        dash(e, t, n, r, i, a, o) {
          for (let n = 0; n < 10; n++)
            e.later(n * 0.012, () => {
              let s = n / 10,
                c = t + i * o * s,
                l = r + a * o * s,
                u = e.terrain.height(c, l);
              for (let t = 0; t < 2; t++)
                kp(
                  e,
                  c + F.range(-0.5, 0.5),
                  u + F.range(3, 4.5),
                  l + F.range(-0.5, 0.5),
                  i * 3,
                  -12,
                  a * 3,
                  0.3,
                  F.range(0.6, 0.9),
                  0.5,
                  10,
                  0,
                );
              Ap(e, c, u + 0.4, l, 1.1, 0.4, -i * 2, 1, -a * 2);
            });
          let s = t + i * o,
            c = r + a * o;
          e.later(0.14, () => {
            (Np(e, s, e.terrain.height(s, c) + 0.5, c, 2.2, 1.2), e.shake(0.06, s, c));
          });
        },
      },
      "water-pulse": {
        draw(e, t, n, r) {
          let i = e.rot[t],
            a = 1 + Math.sin(i * 6) * 0.1;
          e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.1 * a, 16777215, I.PixWaterBall, 0, 0, r);
          for (let a = 0; a < 4; a++) {
            let o = i * 2.5 + (a / 4) * z,
              s = n * (0.75 + Math.sin(i * 6 + a) * 0.12);
            e.pool.push(
              e.x[t] + Math.cos(o) * s,
              e.y[t] + Math.sin(o * 1.3) * s * 0.5,
              e.z[t] + Math.sin(o) * s,
              n * 0.32,
              16777215,
              I.PixFoam,
              0,
              0,
              r,
            );
          }
        },
        trail(e, t, n, r) {
          Math.random() < 0.4 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: -0.5,
              gravity: 10,
              life: 0.35,
              size: 0.26,
              endSize: 0.1,
              color: 16777215,
              shape: I.PixDrop,
              rot: 0,
            });
        },
        boom(e, t, n, r, i) {
          (Np(e, t, n, r, i * 0.7, 1),
            Pp(e, t, n, r, i, 0.4),
            e.later(0.12, () => Pp(e, t, n, r, i * 0.65, 0.35)));
        },
      },
      surf: {
        draw(e, t, n, r) {
          let i = Math.sin(e.rot[t] * 2 + e.x[t]) * 0.2;
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.4, V.water, I.Soft, 0, 0, 0.4 * r),
            e.pool.push(e.x[t], e.y[t] + 0.7 + i, e.z[t], n * 1.05, 16777215, I.PixWave, 0, 0, r),
            e.pool.push(
              e.x[t] + Math.sin(e.rot[t] * 3) * n * 0.3,
              e.y[t] + 1.3 + i,
              e.z[t],
              n * 0.25,
              16777215,
              I.PixBubble,
              0,
              0,
              r,
            ));
        },
        trail(e, t, n, r) {
          (e.vfx.norm.spawn({
            x: t,
            y: n + 1,
            z: r,
            vx: F.range(-1, 1),
            vy: F.range(2, 4),
            vz: F.range(-1, 1),
            gravity: 14,
            life: 0.4,
            size: 0.3,
            endSize: 0.15,
            color: 16777215,
            shape: I.PixDrop,
          }),
            Math.random() < 0.3 &&
              Ap(e, t + F.range(-1, 1), e.terrain.height(t, r) + 0.4, r + F.range(-1, 1), 1.1, 0.45));
        },
      },
      "thunder-shock": {
        shape: I.Bolt,
        color: V.volt,
        size: 1.1,
        trail(e, t, n, r) {
          Math.random() < 0.4 &&
            e.vfx.lightning(
              t,
              n,
              r,
              t + F.range(-0.8, 0.8),
              n + F.range(-0.6, 0.6),
              r + F.range(-0.8, 0.8),
              V.volt,
              0.12,
              2,
              0.06,
            );
        },
        hit(e, t, n, r) {
          (vp(e, t, n, r, V.volt, 6, 5, I.Bolt, 0.4, 0.25), B(e, t, n, r, I.Ring, V.white, 0.3, 1.4, 0.12));
        },
      },
      thunderbolt: {
        link(e, t, n, r, i, a, o) {
          (e.vfx.lightning(t, n, r, i, a, o, V.volt, 0.55, 8, 0.25),
            e.vfx.lightning(t, n, r, i, a, o, V.white, 0.18, 6, 0.18),
            B(e, i, a, o, I.Bolt, V.volt, 1.6, 0.6, 0.2, F.range(-0.4, 0.4), 0.9));
        },
      },
      thunder: {
        sky(e, t, n, r, i) {
          (e.vfx.lightning(t + F.range(-2, 2), n + 32, r, t, n, r, V.volt, 0.6, 10, 0.32),
            e.vfx.lightning(t, n + 32, r, t, n, r, 16775360, 0.2, 8, 0.22));
          for (let a = 0; a < 3; a++) {
            let a = F.range(0, z);
            e.vfx.lightning(
              t,
              n + F.range(8, 18),
              r,
              t + Math.cos(a) * i * 1.4,
              n,
              r + Math.sin(a) * i * 1.4,
              V.volt,
              0.3,
              5,
              0.2,
            );
          }
          (e.vfx.flash(t, n + 1.5, r, V.volt, i * 1.2, 0.12),
            vp(e, t, n + 0.4, r, V.volt, 12, i * 3, I.Bolt, 0.6, 0.4),
            mp(e, t, r, i * 1.3, 2763290, I.Crack, 1.2),
            e.shake(0.18, t, r));
        },
      },
      "quick-attack": {
        dash(e, t, n, r, i, a, o) {
          let s = -a,
            c = i;
          for (let l = 0; l < 5; l++) {
            let l = F.range(-1, 1),
              u = F.range(0.3, 1.6),
              d = F.range(0, 0.4);
            e.vfx.beams.spawn(
              t + i * o * d + s * l,
              n + u,
              r + a * o * d + c * l,
              t + i * o * (d + 0.5) + s * l,
              n + u,
              r + a * o * (d + 0.5) + c * l,
              0.1,
              16773296,
              0.2,
              0.7,
            );
          }
          B(e, t + i * o, n + 1, r + a * o, I.Twinkle, V.white, 0.5, 2.6, 0.2);
        },
      },
      swift: {
        shape: I.Star,
        color: 16771178,
        size: 1.1,
        trail(e, t, n, r) {
          e.vfx.trail(t, n, r, Math.random() < 0.5 ? 16771178 : 16775376, 0.3, I.Twinkle, 0.3);
        },
        hit(e, t, n, r) {
          vp(e, t, n, r, 16771178, 6, 5, I.Star, 0.35, 0.3);
        },
      },
      bite: {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3;
          (B(e, s, n + 0.3, c, I.Fang, V.white, o * 0.75, o * 0.3, 0.2, 0, 0.9),
            B(e, s, n + 0.3, c, I.Soft, 5913210, o * 0.9, o * 0.4, 0.2, 0, 0),
            vp(e, s, n + 0.3, c, 6965898, 5, 4, I.Spark, 0.4, 0.25));
        },
      },
      crunch: {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3;
          (B(e, s, n + 0.4, c, I.Fang, V.white, o * 1.05, o * 0.35, 0.24, 0, 1),
            B(e, s, n + 0.4, c, I.Soft, 3809360, o * 1.2, o * 0.5, 0.24, 0, 0),
            _p(e, s, n, c, 4864602, 6, 4, I.Shard, 0.4),
            e.shake(0.05, s, c));
        },
      },
      "last-resort": {
        warn(e, t, n, r, i, a, o) {
          zp(e, t, n, r, o, 16771178, I.Star, i * 0.8, 24, 4);
        },
        sky(e, t, n, r, i) {
          e.vfx.flash(t, n + 1, r, 16767050, i * 1.4, 0.18);
          for (let a of [16767050, 16739016, 5949695, 8056666])
            vp(e, t, n + 0.6, r, a, 6, i * 2.6, I.Star, 0.6, 0.55, 0, 0.1);
          (e.vfx.ring(t, n, r, i, 16767050, 0.4, 0.15, L.Runes),
            e.vfx.ring(t, n, r, i * 0.7, 16739016, 0.3, 0.15, L.Dashed),
            e.shake(0.3, t, r));
        },
      },
      tackle: {
        dash(e, t, n, r, i, a, o) {
          e.vfx.dust(t, n, r, 14207144, 8, 3);
          let s = t + i * o,
            c = r + a * o;
          e.later(0.12, () => {
            (B(e, s, n + 0.8, c, I.Star, 16771232, 0.5, 1.8, 0.18),
              e.vfx.ring(s, e.terrain.height(s, c), c, 1.8, 14207144, 0.25));
          });
        },
      },
      "body-slam": {
        nova(e, t, n, r, i) {
          (e.vfx.ring(t, n, r, i, 14207144, 0.45, 0.15, L.Jagged),
            e.vfx.ring(t, n, r, i * 0.6, 16767136, 0.3),
            e.vfx.dust(t, n, r, 14207144, 18, i * 1.6),
            mp(e, t, r, i * 1.2, 3811866, I.Crack, 1.4),
            e.shake(0.12));
        },
      },
      stomp: {
        nova(e, t, n, r, i) {
          for (let t = 0; t < 2; t++)
            e.later(t * 0.16, () => {
              let n = e.player.pos;
              (e.vfx.ring(n.x, n.y, n.z, i * (0.7 + t * 0.3), t ? V.white : 16767136, 0.3),
                e.vfx.dust(n.x, n.y, n.z, 14207144, 10, i),
                mp(e, n.x + F.range(-1, 1), n.z + F.range(-1, 1), i * 0.7, 3811866, I.Crack, 1),
                e.shake(0.06));
            });
        },
      },
      "giga-impact": {
        warn(e, t, n, r, i, a, o) {
          zp(e, t, n, r, o, 16747066, I.Twinkle, i * 0.7, 22, 7);
        },
        sky(e, t, n, r, i) {
          e.vfx.flash(t, n + 1, r, 16767136, i * 2, 0.25);
          for (let a = 0; a < 3; a++)
            e.later(a * 0.07, () =>
              e.vfx.ring(t, n, r, i * (0.6 + a * 0.3), a === 1 ? 11557631 : 16747066, 0.45),
            );
          (vp(e, t, n + 0.5, r, 16747066, 20, i * 3, I.Spark, 0.8, 0.5),
            _p(e, t, n, r, V.rock, 10, i * 1.5),
            mp(e, t, r, i * 1.8, 2759188, I.Crack, 1.6),
            e.shake(0.4, t, r));
        },
      },
      "hyper-beam": {
        beam(e, t, n, r, i, a, o, s) {
          (Cp(e, t, n, r, i, a, o, s * 1.3, 16754746, 16773312),
            Sp(e, t, n, r, i, a, o, [16767082, 16747066], s * 2.2, 1),
            Math.random() < 0.6 && e.vfx.trail(i, a, o, 16767082, 1.4, I.Twinkle, 0.2));
        },
      },
      pound: {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3;
          (B(e, s, n + 0.4, c, I.Palm, 16769264, o * 0.4, o * 0.75, 0.2, fp(i, a) * 0.2, 0.6),
            vp(e, s, n + 0.6, c, 16771178, 4, 4, I.Star, 0.35, 0.35));
        },
      },
      round: {
        shape: I.Note,
        color: V.fairy,
        size: 1.25,
        trail(e, t, n, r) {
          Math.random() < 0.4 && e.vfx.trail(t, n, r, 16765168, 0.3, I.Note, 0.4);
        },
        hit(e, t, n, r) {
          B(e, t, n, r, I.Sound, V.fairy, 0.5, 1.8, 0.2);
        },
      },
      "hyper-voice": {
        nova(e, t, n, r, i) {
          bp(e, t, n, r, 16759016, 10, i * 2.4, I.Sound, 2, 0.45);
          for (let t = 0; t < 3; t++)
            e.later(t * 0.08, () =>
              e.vfx.ring(
                e.player.pos.x,
                e.player.pos.y,
                e.player.pos.z,
                i * (0.5 + t * 0.25),
                t % 2 ? 16763116 : V.fairy,
                0.35,
                0.15,
                L.Ripple,
              ),
            );
          e.shake(0.1);
        },
      },
      sing: {
        nova(e, t, n, r, i) {
          let a = [16747224, 9099519, 16771178, 12124042];
          for (let o = 0; o < 14; o++) {
            let s = (o / 14) * z,
              c = i * 1.1;
            dp(e).spawn({
              x: t,
              y: n + 1.2,
              z: r,
              vx: Math.cos(s) * c - Math.sin(s) * 2,
              vy: F.range(0.5, 1.5),
              vz: Math.sin(s) * c + Math.cos(s) * 2,
              drag: 1.2,
              life: 0.9,
              size: 0.7,
              endSize: 0.4,
              color: a[o % 4],
              shape: I.Note,
              glow: 0.5,
              rot: F.range(-0.4, 0.4),
            });
          }
          e.vfx.ring(t, n, r, i, 16759016, 0.7, 0.4);
        },
      },
      flail: {
        strike(e, t, n, r, i, a, o) {
          for (let i = 0; i < 3; i++) {
            let a = F.range(0, z),
              s = o * 0.45;
            e.vfx.beams.spawn(
              t - Math.cos(a) * s,
              n + F.range(-0.3, 0.6),
              r - Math.sin(a) * s,
              t + Math.cos(a) * s,
              n + F.range(-0.3, 0.6),
              r + Math.sin(a) * s,
              0.3,
              i ? V.white : 16758858,
              0.14,
            );
          }
          (_p(e, t, n, r, V.water, 5, 3, I.Drop, 0.3),
            vp(e, t, n + 0.4, r, V.white, 3, 3, I.Twinkle, 0.4, 0.25));
        },
      },
      "karate-chop": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.25,
            c = r + a * o * 0.25,
            l = e.terrain.height(s, c);
          (e.vfx.beams.spawn(s - i * 0.3, l + 3.2, c - a * 0.3, s, l + 0.1, c, 0.5, V.punch, 0.16),
            e.vfx.beams.spawn(s - i * 0.3, l + 3.2, c - a * 0.3, s, l + 0.1, c, 0.18, V.white, 0.12),
            mp(e, s, c, o * 0.6, 3811866, I.Crack, 0.7),
            vp(e, s, l + 0.3, c, V.punch, 6, 5, I.Spark, 0.45, 0.25));
        },
      },
      "cross-chop": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.25,
            c = r + a * o * 0.25,
            l = -a,
            u = i,
            d = o * 0.5;
          for (let t of [-1, 1])
            e.vfx.beams.spawn(
              s + l * d * t,
              n + d,
              c + u * d * t,
              s - l * d * t,
              n - d * 0.6,
              c - u * d * t,
              0.4,
              V.punch,
              0.18,
            );
          (B(e, s, n, c, I.Cross, V.white, o * 0.4, o * 0.9, 0.2, 0, 0.9), e.shake(0.05, s, c));
        },
      },
      "low-kick": {
        nova(e, t, n, r, i) {
          let a = F.range(0, z);
          for (let o = 0; o < 14; o++) {
            let s = a + (o / 14) * z,
              c = a + ((o + 1) / 14) * z;
            e.vfx.beams.spawn(
              t + Math.cos(s) * i * 0.8,
              n + 0.35,
              r + Math.sin(s) * i * 0.8,
              t + Math.cos(c) * i * 0.8,
              n + 0.35,
              r + Math.sin(c) * i * 0.8,
              (o / 14) * 0.35,
              V.punch,
              0.16,
            );
          }
          e.vfx.dust(t, n, r, 14207144, 12, i * 1.4);
        },
      },
      "dynamic-punch": {
        nova(e, t, n, r, i) {
          let a = e.player.facing,
            o = a.x,
            s = a.y;
          (B(e, t + o, n + 1, r + s, I.Fist, V.punch, 1, i * 0.7, 0.25, 0, 0.8),
            e.later(0.08, () => {
              e.vfx.flash(t, n + 1, r, 16767136, i * 1.6, 0.2);
              for (let a = 0; a < 20; a++) {
                let a = F.range(0, z),
                  o = F.range(i, i * 2.6);
                dp(e).spawn({
                  x: t,
                  y: n + 0.8,
                  z: r,
                  vx: Math.cos(a) * o,
                  vy: F.range(1, 5),
                  vz: Math.sin(a) * o,
                  drag: 3.5,
                  life: 0.5,
                  size: 1.2,
                  endSize: 0.3,
                  color: 16767082,
                  endColor: V.fireDeep,
                  shape: I.Flame,
                  glow: 0.4,
                });
              }
              (e.vfx.ring(t, n, r, i, V.punch, 0.45),
                vp(e, t, n + 1.6, r, 16771178, 5, 2, I.Swirl, 0.6, 0.6, 2),
                e.shake(0.2));
            }));
        },
      },
      "force-palm": {
        strike(e, t, n, r, i, a, o) {
          let s = e.player.pos,
            c = 0.14;
          (dp(e).spawn({
            x: s.x + i,
            y: n,
            z: s.z + a,
            vx: (t - s.x - i) / c,
            vz: (r - s.z - a) / c,
            life: c,
            size: 1,
            endSize: o * 0.6,
            color: 12574975,
            shape: I.Palm,
            glow: 0.8,
          }),
            e.later(c, () => {
              (e.vfx.ring(t, e.terrain.height(t, r), r, o * 0.7, V.aura, 0.3),
                vp(e, t, n, r, V.aura, 6, 5, I.Spark, 0.45, 0.3));
            }));
        },
      },
      "aura-sphere": {
        draw(e, t, n, r) {
          (Ip(e, t, n * 1.1, r, I.Ring, 12574975, V.aura, e.rot[t], V.white),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.5, V.aura, I.Swirl, -e.rot[t] * 1.5, 0.4, 0.6 * r));
        },
        trail(e, t, n, r) {
          e.vfx.trail(t, n, r, V.aura, 0.55, I.Soft, 0.3);
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Ring, V.aura, 0.6, 2.6, 0.22), vp(e, t, n, r, 12574975, 6, 5, I.Spark, 0.4, 0.3));
        },
      },
      "close-combat": {
        nova(e, t, n, r, i) {
          for (let t = 0; t < 8; t++)
            e.later(t * 0.035, () => {
              let n = e.player.pos,
                r = F.range(0, z),
                a = F.range(0.8, i * 0.85),
                o = n.x + Math.cos(r) * a,
                s = n.z + Math.sin(r) * a;
              (B(
                e,
                o,
                n.y + F.range(0.6, 1.4),
                s,
                t % 2 ? I.Fist : I.Palm,
                V.punch,
                0.5,
                1.5,
                0.16,
                F.range(-0.6, 0.6),
                0.7,
              ),
                B(e, o, n.y + 1, s, I.Twinkle, V.white, 0.3, 1.4, 0.12));
            });
          e.vfx.ring(e.player.pos.x, e.player.pos.y, e.player.pos.z, i, V.punch, 0.35);
        },
      },
      lick: {
        strike(e, t, n, r, i, a, o) {
          let s = e.player.pos,
            c = t + i * o * 0.2,
            l = r + a * o * 0.2;
          (xp(e, s.x + i * 0.5, s.y + 0.8, s.z + a * 0.5, c, n, l, 0.4, 0.45, 16743088, 0.2, 6),
            B(e, c, n, l, I.Tongue, 16751304, 0.6, 1.4, 0.2, Math.PI),
            _p(e, c, n, l, 13146879, 4, 2, I.Drop, 0.25));
        },
      },
      "night-shade": {
        shape: I.Eye,
        color: 16730730,
        size: 1.4,
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 2, V.ghost, I.Soft, 0, 0.2, 0.5 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n, 16730730, I.Eye, 0, 0.4, r));
        },
        trail(e, t, n, r) {
          e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vy: 0.5,
            life: 0.4,
            size: 0.5,
            endSize: 1,
            color: 2759226,
            shape: I.Soft,
            drag: 2,
          });
        },
        hit(e, t, n, r) {
          B(e, t, n, r, I.Ring, V.ghost, 0.5, 2, 0.2);
        },
      },
      "shadow-ball": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 2.2, V.ghost, I.Soft, 0, 0.3, 0.6 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.9, V.shadow, I.Soft, 0, 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.2, 12618495, I.Swirl, e.rot[t] * 2, 0.4, 0.8 * r));
        },
        trail(e, t, n, r) {
          e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vx: F.range(-0.5, 0.5),
            vy: F.range(0, 1),
            vz: F.range(-0.5, 0.5),
            life: 0.4,
            size: 0.6,
            endSize: 0.1,
            color: 3807834,
            shape: I.Soft,
            drag: 2,
          });
        },
        boom(e, t, n, r, i) {
          e.vfx.ring(t, e.terrain.height(t, r), r, i, V.ghost, 0.45);
          for (let a = 0; a < 12; a++) {
            let a = F.range(0, z),
              o = F.range(2, i * 2);
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: Math.cos(a) * o,
              vy: F.range(0, 3),
              vz: Math.sin(a) * o,
              drag: 3,
              life: 0.6,
              size: 1.2,
              endSize: 2,
              color: 2756672,
              shape: I.Soft,
            });
          }
          (vp(e, t, n, r, 12618495, 8, i * 2, I.Spark, 0.6, 0.35),
            B(e, t, n + 1, r, I.Skull, 12618495, 0.6, 1.6, 0.4));
        },
      },
      hex: {
        link(e, t, n, r, i, a, o, s, c) {
          (xp(e, t, n, r, i, a, o, c % 2 ? 1.2 : -1.2, 0.35, V.ghost, 0.25, 7),
            B(e, i, a + 0.8, o, I.Eye, 16730762, 0.4, 1.4, 0.35),
            dp(e).spawn({
              x: i,
              y: a + 0.5,
              z: o,
              vy: 2.5,
              life: 0.6,
              size: 0.8,
              endSize: 0.4,
              color: 12618495,
              shape: I.Skull,
              glow: 0.5,
            }));
        },
      },
      confusion: {
        shape: I.Swirl,
        color: V.psy,
        size: 1.2,
        trail(e, t, n, r) {
          e.vfx.trail(t, n, r, 16759024, 0.35, I.Ring, 0.25);
        },
        hit(e, t, n, r) {
          vp(e, t, n, r, V.psy, 5, 3, I.Swirl, 0.5, 0.4, 3);
        },
      },
      psybeam: {
        beam(e, t, n, r, i, a, o, s) {
          (Cp(e, t, n, r, i, a, o, s, V.psy, 16769279),
            Sp(e, t, n, r, i, a, o, [16739032, 7002367, 16771178, 10157946], s * 1.8, 2));
        },
      },
      psychic: {
        nova(e, t, n, r, i) {
          for (let a = 0; a < 3; a++)
            e.later(a * 0.1, () => e.vfx.ring(t, n, r, i * (0.55 + a * 0.25), a % 2 ? 16759024 : V.psy, 0.5));
          B(e, t, n + 3, r, I.Eye, V.psy, 1, 2.6, 0.45);
          for (let a = 0; a < 16; a++) {
            let a = F.range(0, z),
              o = F.range(1, i);
            dp(e).spawn({
              x: t + Math.cos(a) * o,
              y: n + 0.2,
              z: r + Math.sin(a) * o,
              vy: F.range(3, 6),
              life: 0.6,
              size: 0.5,
              endSize: 0,
              color: 16759024,
              shape: I.Twinkle,
              glow: 0.6,
            });
          }
        },
      },
      "future-sight": {
        warn(e, t, n, r, i, a, o) {
          dp(e).spawn({
            x: t,
            y: n + 4,
            z: r,
            life: o,
            size: 1.2,
            endSize: 2.4,
            color: V.psy,
            shape: I.Eye,
            glow: 0.6,
          });
        },
        sky(e, t, n, r, i) {
          Hp(e, t, n, r, i * 0.6, V.psy, 16769279);
          for (let a = 0; a < 3; a++)
            e.later(a * 0.08, () => e.vfx.ring(t, n, r, i * (0.6 + a * 0.25), a % 2 ? V.white : V.psy, 0.4));
          (vp(e, t, n + 0.5, r, 16759024, 14, i * 2.5, I.Twinkle, 0.6, 0.5), e.shake(0.25, t, r));
        },
      },
      "ancient-power": {
        orbit(e, t, n, r, i, a) {
          (e.orbitals.push(t, n, r, a * 0.9, 14735544, I.Rock, i * 2, 0.5),
            e.orbitalsGlow.push(t, n, r, a * 2, 16773312, I.Soft, 0, 0.3, 0.45),
            Math.random() < 0.3 && e.vfx.trail(t, n, r, 16773312, 0.4, I.Twinkle, 0.35));
        },
      },
      moonblast: {
        shape: I.Moon,
        color: V.moon,
        size: 1.5,
        draw(e, t, n, r) {
          Ip(e, t, n * 1.3, r, I.Moon, V.moon, 16747224, 0.3);
        },
        trail(e, t, n, r) {
          e.vfx.trail(t, n, r, 16767220, 0.35, I.Twinkle, 0.35);
        },
        boom(e, t, n, r, i) {
          (e.vfx.flash(t, n, r, 16739016, i * 1.1, 0.2),
            e.vfx.ring(t, e.terrain.height(t, r), r, i, 16747224, 0.45),
            vp(e, t, n, r, V.moon, 14, i * 2.4, I.Twinkle, 0.6, 0.5),
            B(e, t, n + 1.5, r, I.Moon, V.moon, 1, 2.4, 0.4, 0.4));
        },
      },
      "disarming-voice": {
        nova(e, t, n, r, i) {
          (bp(e, t, n, r, V.fairy, 8, i * 2.2, I.Sound, 1.6, 0.4),
            vp(e, t, n + 1, r, 16747224, 10, i * 2, I.Heart, 0.6, 0.45),
            e.vfx.ring(t, n, r, i, V.fairy, 0.4));
        },
      },
      twister: {
        draw(e, t, n, r) {
          (Lp(e, t, n, r, 7002288, 13172720, 5), Rp(e, t, n, r, I.Leaf, 5943402, 4, n * 0.5, !1));
        },
        trail(e, t, n, r) {
          e.vfx.dust(t, n - 1, r, 11061408, 1, 2);
        },
        boom(e, t, n, r, i) {
          (vp(e, t, n, r, 7002288, 14, i * 2.2, I.Swirl, 0.8, 0.5, i * 2),
            e.vfx.ring(t, e.terrain.height(t, r), r, i, 7002288, 0.4));
        },
      },
      "dragon-rage": {
        shape: I.Flame,
        color: 9071359,
        size: 1.3,
        trail(e, t, n, r) {
          e.vfx.add.spawn({
            x: t,
            y: n,
            z: r,
            vy: 1,
            life: 0.35,
            size: 0.5,
            endSize: 0,
            color: 5917439,
            endColor: 16730762,
            shape: I.Flame,
            glow: 0.5,
          });
        },
        hit(e, t, n, r) {
          vp(e, t, n, r, 9071359, 7, 4, I.Flame, 0.5, 0.35);
        },
      },
      "dragon-pulse": {
        beam(e, t, n, r, i, a, o, s) {
          (Cp(e, t, n, r, i, a, o, s * 1.1, V.dragon, 14207231),
            Sp(e, t, n, r, i, a, o, [V.dragon, 5949695], s * 2.4, 1),
            Math.random() < 0.5 && Tp(e, t, n, r, i, a, o, 10124031, I.Flame, 1, 0.6));
        },
      },
      "draco-meteor": {
        warn(e, t, n, r, i, a, o) {
          zp(e, t, n, r, o, 16747066, I.Rock, i * 0.5, 28, 9);
        },
        sky(e, t, n, r, i) {
          (e.vfx.flash(t, n + 1, r, 16767136, i * 1.8, 0.2),
            e.vfx.ring(t, n, r, i, 16747066, 0.45),
            e.vfx.ring(t, n, r, i * 0.6, V.dragon, 0.3),
            _p(e, t, n, r, 14182970, 10, i * 1.6),
            vp(e, t, n + 0.5, r, 16754762, 16, i * 2.6, I.Flame, 0.9, 0.5),
            mp(e, t, r, i * 1.7, 2759188, I.Crack, 1.6),
            e.shake(0.35, t, r));
        },
      },
      "dragon-claw": {
        strike(e, t, n, r, i, a, o, s, c) {
          (e.slash(t, n, r, i, a, o, s, c % 2 == 1),
            B(
              e,
              t + i * o * 0.2,
              n,
              r + a * o * 0.2,
              I.Claw,
              9109456,
              o * 0.4,
              o * 0.85,
              0.2,
              c % 2 ? -0.4 : 0.4,
              0.8,
            ));
        },
      },
      "rock-throw": {
        draw(e, t, n, r) {
          e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.1, V.rock, I.Rock, e.rot[t], 0, r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 && e.vfx.dust(t, n, r, 12101768, 1, 1);
        },
        boom(e, t, n, r, i) {
          (_p(e, t, n, r, V.rock, 9, i * 1.6),
            e.vfx.dust(t, n, r, 13154456, 10, i * 1.4),
            e.vfx.ring(t, e.terrain.height(t, r), r, i, 14207144, 0.35));
        },
      },
      rollout: {
        draw(e, t, n, r) {
          e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.9, 10127994, I.Rock, e.rot[t] * 2, 0, r);
        },
        trail(e, t, n, r) {
          e.vfx.dust(t, e.terrain.height(t, r), r, 13154456, 1, 2);
        },
        hit(e, t, n, r) {
          _p(e, t, n, r, V.rock, 3, 3, I.Rock, 0.3);
        },
      },
      magnitude: {
        nova(e, t, n, r, i) {
          let a = 4 + Math.floor(Math.random() * 7);
          for (let n = 0; n < 4; n++) {
            let n = F.range(0, z),
              a = F.range(0, i * 0.6);
            mp(e, t + Math.cos(n) * a, r + Math.sin(n) * a, i * 0.6, 3811866, I.Crack, 1.2);
          }
          for (let a = 0; a < 4; a++)
            e.later(a * 0.07, () =>
              e.vfx.ring(t + F.range(-1, 1), n, r + F.range(-1, 1), i * F.range(0.5, 1), 14203e3, 0.3),
            );
          (e.vfx.dust(t, n, r, 13150328, 14, i * 1.5), _p(e, t, n, r, V.dirt, 6, i), e.shake((0.05 * a) / 4));
        },
      },
      "rock-slide": {
        warn(e, t, n, r, i, a, o) {
          for (let i = 0; i < 2; i++)
            e.vfx.norm.spawn({
              x: t + F.range(-0.6, 0.6),
              y: n + 8,
              z: r + F.range(-0.6, 0.6),
              vy: -8 / o,
              life: o,
              size: 1.1,
              endSize: 1.1,
              color: V.rock,
              shape: I.Rock,
              spin: 5,
            });
        },
        sky(e, t, n, r, i) {
          (_p(e, t, n, r, V.rock, 7, i * 1.4),
            e.vfx.dust(t, n, r, 13154456, 8, i),
            e.vfx.ring(t, n, r, i, 14207144, 0.3),
            e.shake(0.06, t, r));
        },
      },
      "sand-tomb": {
        draw(e, t, n, r) {
          (Lp(e, t, n, r, V.sand, 15786160, 4), Rp(e, t, n, r, I.Rock, 12098154, 6, n * 0.5, !1));
        },
        trail(e, t, n, r) {
          e.vfx.dust(t, n - 1, r, V.sand, 1, 2.5);
        },
        boom(e, t, n, r, i) {
          (e.vfx.dust(t, n, r, V.sand, 18, i * 1.8),
            _p(e, t, n, r, 12098154, 6, i),
            e.vfx.ring(t, e.terrain.height(t, r), r, i, V.sand, 0.4));
        },
      },
      dig: {
        dash(e, t, n, r, i, a, o) {
          e.vfx.dust(t, n, r, 11044954, 10, 3);
          for (let n = 1; n <= 5; n++) {
            let s = n / 5,
              c = t + i * o * s,
              l = r + a * o * s;
            (mp(e, c, l, 1.6, 4864554, I.Crack, 0.9, fp(i, a)),
              e.later(s * 0.15, () => _p(e, c, e.terrain.height(c, l), l, V.dirt, 2, 2, I.Rock, 0.35)));
          }
          let s = t + i * o,
            c = r + a * o;
          e.later(0.18, () => {
            (_p(e, s, e.terrain.height(s, c), c, V.dirt, 8, 4),
              e.vfx.dust(s, e.terrain.height(s, c), c, 11044954, 10, 4));
          });
        },
      },
      earthquake: {
        nova(e, t, n, r, i) {
          for (let n = 0; n < 6; n++) {
            let a = (n / 6) * z + F.range(-0.3, 0.3),
              o = i * F.range(0.3, 0.8);
            mp(e, t + Math.cos(a) * o, r + Math.sin(a) * o, i * 0.7, 2759178, I.Crack, 1.6, a);
          }
          for (let a = 0; a < 3; a++)
            e.later(a * 0.12, () => {
              (e.vfx.ring(t, n, r, i * (0.6 + a * 0.2), 14203e3, 0.45),
                e.vfx.dust(t, n, r, 13150328, 10, i * (1 + a * 0.4)));
            });
          for (let a = 0; a < 10; a++) {
            let a = F.range(0, z),
              o = F.range(1, i);
            _p(e, t + Math.cos(a) * o, n, r + Math.sin(a) * o, V.dirt, 1, 1.5);
          }
          e.shake(0.3);
        },
      },
      "stone-edge": {
        orbit(e, t, n, r, i, a) {
          (e.orbitals.push(t, n, r, a * 1.1, 10133680, I.Shard, i + Math.PI / 2, 0.4),
            e.orbitalsGlow.push(t, n, r, a * 1.4, 14213375, I.Soft, 0, 0.2, 0.3),
            Math.random() < 0.2 && e.vfx.trail(t, n + 0.4, r, V.white, 0.35, I.Twinkle, 0.2));
        },
      },
      "powder-snow": {
        cone(e, t, n, r, i, a, o, s, c) {
          Math.random() < 0.3 ||
            (e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: i * 0.8 + F.range(-1, 1),
              vy: a * 0.4 + 0.3,
              vz: o * 0.8 + F.range(-1, 1),
              gravity: 1.2,
              life: s * 1.2,
              size: 0.3,
              endSize: 0.5 * Math.sqrt(c / 7),
              color: 16777215,
              shape: I.PixSnow,
              spin: F.range(-4, 4),
              drag: 0.5,
            }),
            Math.random() < 0.1 &&
              dp(e).spawn({
                x: t,
                y: n,
                z: r,
                vx: i * 0.6,
                vy: 0.4,
                vz: o * 0.6,
                life: s * 0.8,
                size: 0.25,
                endSize: 0,
                color: V.ice,
                shape: I.Twinkle,
                glow: 0.1,
                spin: 4,
              }));
        },
      },
      "ice-shard": {
        shape: I.Shard,
        color: V.ice,
        size: 1.2,
        trail(e, t, n, r) {
          Math.random() < 0.4 && e.vfx.trail(t, n, r, V.snow, 0.25, I.Flake, 0.3);
        },
        hit(e, t, n, r) {
          _p(e, t, n, r, V.ice, 5, 3, I.Shard, 0.35);
        },
      },
      "ice-ball": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.3, 4894952, I.Soft, 0, 0, 0.3 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.95, 12115184, I.PixPuff, e.rot[t] * 0.5, 0, r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.55, 16777215, I.PixSnow, e.rot[t], 0, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.5 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: F.range(-0.6, 0.6),
              vy: 0.6,
              vz: F.range(-0.6, 0.6),
              gravity: 2,
              life: 0.4,
              size: 0.28,
              endSize: 0.15,
              color: 16777215,
              shape: I.PixSnow,
              spin: 4,
            });
        },
        hit(e, t, n, r) {
          (_p(e, t, n, r, 16777215, 5, 3, I.PixSnow, 0.3), _p(e, t, n, r, V.ice, 3, 3, I.Shard, 0.3));
        },
      },
      avalanche: {
        warn(e, t, n, r, i, a, o) {
          for (let a = 0; a < 3; a++)
            e.vfx.norm.spawn({
              x: t + F.range(-i * 0.5, i * 0.5),
              y: n + 10 + a * 2,
              z: r + F.range(-i * 0.5, i * 0.5),
              vy: -(10 + a * 2) / o,
              life: o,
              size: 1.3 - a * 0.2,
              endSize: 1.3,
              color: 14742783,
              shape: I.Rock,
              spin: 4,
            });
        },
        sky(e, t, n, r, i) {
          for (let a = 0; a < 10; a++) {
            let a = F.range(0, z),
              o = F.range(2, i * 2);
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.4,
              z: r,
              vx: Math.cos(a) * o,
              vy: F.range(1, 4),
              vz: Math.sin(a) * o,
              drag: 3,
              life: 0.8,
              size: 0.9,
              endSize: 1.6,
              color: 13163756,
              shape: I.PixPuff,
            });
          }
          for (let a = 0; a < 10; a++) {
            let a = F.range(0, z),
              o = F.range(2, i * 2.4);
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.6,
              z: r,
              vx: Math.cos(a) * o,
              vy: F.range(2, 6),
              vz: Math.sin(a) * o,
              gravity: 6,
              drag: 2,
              life: 0.8,
              size: 0.45,
              endSize: 0.3,
              color: 16777215,
              shape: I.PixSnow,
              spin: F.range(-5, 5),
            });
          }
          (_p(e, t, n, r, V.ice, 8, i * 1.4, I.Shard, 0.5),
            e.vfx.ring(t, n, r, i, V.ice, 0.45),
            e.shake(0.3, t, r));
        },
      },
      "ice-beam": {
        beam(e, t, n, r, i, a, o, s) {
          if (
            (Cp(e, t, n, r, i, a, o, s, 7002367, 15269887),
            Tp(e, t, n, r, i, a, o, V.snow, I.Flake, 1, 0.5),
            Math.random() < 0.35)
          ) {
            let n = Math.random(),
              a = t + (i - t) * n,
              s = r + (o - r) * n;
            dp(e).spawn({
              x: a,
              y: e.terrain.height(a, s) + 0.4,
              z: s,
              life: 0.7,
              size: 0.2,
              endSize: 0.9,
              color: V.ice,
              shape: I.Shard,
              rot: F.range(-0.4, 0.4),
              glow: 0.4,
            });
          }
        },
      },
      blizzard: {
        cone(e, t, n, r, i, a, o, s, c) {
          let l = Math.sqrt(c / 7);
          (e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vx: i * 1.2 + F.range(-2, 2),
            vy: a * 0.6,
            vz: o * 1.2 + F.range(-2, 2),
            life: s,
            size: 0.3,
            endSize: 0.6 * l,
            color: 16777215,
            shape: I.PixSnow,
            spin: F.range(-8, 8),
          }),
            Math.random() < 0.15 &&
              dp(e).spawn({
                x: t,
                y: n,
                z: r,
                vx: i * 1.3,
                vy: a * 0.4,
                vz: o * 1.3,
                life: s * 0.7,
                size: 0.22,
                endSize: 0,
                color: V.ice,
                shape: I.Twinkle,
                glow: 0.1,
                spin: 6,
              }));
        },
      },
      "air-slash": {
        shape: I.Crescent,
        color: 10142964,
        size: 1.2,
        trail(e, t, n, r, i, a) {
          Math.random() < 0.5 &&
            e.vfx.add.spawn({
              x: t,
              y: n,
              z: r,
              life: 0.14,
              size: a * 0.9,
              endSize: a * 0.6,
              color: 4881104,
              shape: I.Crescent,
              rot: F.range(0, z),
              glow: 0,
            });
        },
        hit(e, t, n, r) {
          B(e, t, n, r, I.Cross, 9091312, 0.4, 1.4, 0.14);
        },
      },
      "wing-attack": {
        draw(e, t, n, r) {
          for (let i of [-1, 1])
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.75, 11056360, I.Feather, e.rot[t] * 0.5 + i * 0.6, 0, r);
          e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.2, 6982360, I.Soft, 0, 0, 0.25 * r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.25 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: F.range(-1, 1),
              vy: 0.5,
              vz: F.range(-1, 1),
              gravity: 1.5,
              life: 0.8,
              size: 0.4,
              endSize: 0.35,
              color: 12109040,
              shape: I.Feather,
              spin: 3,
            });
        },
        hit(e, t, n, r) {
          vp(e, t, n, r, V.air, 4, 3, I.Feather, 0.4, 0.4);
        },
      },
      "air-cutter": {
        shape: I.Crescent,
        color: 14217471,
        size: 0.9,
        trail() {},
        hit(e, t, n, r) {
          B(e, t, n, r, I.Cross, V.air, 0.3, 1.2, 0.12);
        },
      },
      "fury-cutter": {
        strike(e, t, n, r, i, a, o, s, c) {
          (e.slash(t, n, r, i, a, o, V.bug, c % 2 == 1),
            B(e, t, n + 0.3, r, I.Crescent, 14745482, o * 0.35, o * 0.8, 0.18, c % 2 ? 2.4 : 0.6, 0.7));
        },
      },
      "x-scissor": {
        shape: I.Cross,
        color: V.bug,
        size: 1.25,
        trail(e, t, n, r, i, a) {
          e.vfx.add.spawn({
            x: t,
            y: n,
            z: r,
            life: 0.14,
            size: a,
            endSize: a * 0.6,
            color: 9095226,
            shape: I.Cross,
            rot: F.range(0, z),
            glow: 0.2,
          });
        },
        hit(e, t, n, r) {
          B(e, t, n, r, I.Cross, V.white, 0.5, 2, 0.15);
        },
      },
      "poison-fang": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3;
          (B(e, s, n + 0.3, c, I.Fang, 14727423, o * 0.75, o * 0.3, 0.2, 0, 0.8),
            _p(e, s, n, c, V.poison, 5, 2.5, I.Bubble, 0.35));
        },
      },
      "night-slash": {
        strike(e, t, n, r, i, a, o, s, c) {
          let l = fp(i, a) + (c % 2 ? -0.7 : 0.7);
          (e.vfx.norm.spawn({
            x: t,
            y: n + 0.3,
            z: r,
            life: 0.24,
            size: o * 0.55,
            endSize: o * 1.15,
            color: V.darkDeep,
            shape: I.Crescent,
            rot: l,
          }),
            B(e, t, n + 0.3, r, I.Crescent, 14205183, o * 0.45, o * 1.05, 0.16, l, 0.5),
            vp(e, t, n + 0.3, r, V.dark, 5, 5, I.Spark, 0.35, 0.25));
        },
      },
      "razor-wind": {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.15, 12112112, I.Crescent, e.rot[t] * 0.15 + 1.57, 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.2, 6986464, I.Soft, 0, 0, 0.18 * r));
        },
        trail(e, t, n, r, i, a) {
          Math.random() < 0.3 &&
            e.vfx.add.spawn({
              x: t,
              y: n,
              z: r,
              life: 0.14,
              size: a * 0.7,
              endSize: a * 0.35,
              color: 6986464,
              shape: I.Crescent,
              rot: 1.57,
              glow: 0,
            });
        },
        hit(e, t, n, r) {
          B(e, t, n, r, I.Cross, V.white, 0.4, 1.6, 0.14);
        },
      },
      "sucker-punch": {
        dash(e, t, n, r, i, a, o) {
          for (let s = 0; s < 6; s++) {
            let c = s / 6;
            e.vfx.norm.spawn({
              x: t + i * o * c,
              y: n + 0.9,
              z: r + a * o * c,
              life: 0.3 + c * 0.15,
              size: 1.2,
              endSize: 0.4,
              color: V.darkDeep,
              shape: I.Soft,
            });
          }
          let s = t + i * o,
            c = r + a * o;
          e.later(0.1, () => {
            (e.vfx.norm.spawn({
              x: s,
              y: n + 1,
              z: c,
              life: 0.22,
              size: 0.8,
              endSize: 2.2,
              color: 3809360,
              shape: I.Fist,
              rot: fp(i, a),
            }),
              B(e, s, n + 1, c, I.Twinkle, 13150463, 0.5, 2.2, 0.16));
          });
        },
      },
      "dark-pulse": {
        nova(e, t, n, r, i) {
          for (let n = 0; n < 3; n++)
            e.later(n * 0.09, () =>
              e.vfx.ring(
                t,
                e.terrain.height(t, r),
                r,
                i * (1 - n * 0.15),
                n === 1 ? 6965914 : 3810384,
                0.4,
                0.2,
                L.Runes,
              ),
            );
          bp(e, t, n, r, 12098303, 12, i * 2.2, I.Crescent, 1.2, 0.4);
          for (let a = 0; a < 10; a++) {
            let a = F.range(0, z),
              o = F.range(i, i * 2.2);
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.8,
              z: r,
              vx: Math.cos(a) * o,
              vy: F.range(0, 2),
              vz: Math.sin(a) * o,
              drag: 3,
              life: 0.5,
              size: 1,
              endSize: 1.8,
              color: 2759226,
              shape: I.Soft,
            });
          }
          e.shake(0.12);
        },
      },
      astonish: {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.8, V.ghost, I.Soft, 0, 0.2, 0.45 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.1, V.gemGold, I.Eye, 0, 0.5, r));
        },
        trail(e, t, n, r) {
          e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vy: 0.4,
            life: 0.35,
            size: 0.45,
            endSize: 0.9,
            color: 3811930,
            shape: I.Soft,
            drag: 2,
          });
        },
        hit(e, t, n, r) {
          (B(e, t, n + 0.4, r, I.Wisp, 13150463, 0.5, 1.6, 0.3),
            vp(e, t, n, r, V.gemGold, 4, 3, I.Twinkle, 0.35, 0.3));
        },
      },
      "shadow-claw": {
        strike(e, t, n, r, i, a, o, s, c) {
          let l = c % 2 ? -0.4 : 0.4,
            u = t + i * o * 0.2,
            d = r + a * o * 0.2;
          (e.vfx.norm.spawn({
            x: u,
            y: n + 0.2,
            z: d,
            life: 0.24,
            size: o * 0.5,
            endSize: o * 0.95,
            color: 2756672,
            shape: I.Claw,
            rot: l,
          }),
            B(e, u, n + 0.2, d, I.Claw, 12094207, o * 0.4, o * 0.85, 0.16, l, 0.6),
            e.vfx.norm.spawn({
              x: u,
              y: n + 0.4,
              z: d,
              vy: 1.5,
              life: 0.5,
              size: 0.8,
              endSize: 1.6,
              color: 3807834,
              shape: I.Soft,
              drag: 2,
            }));
        },
      },
      "power-gem": {
        size: 1,
        draw(e, t, n, r) {
          let i = Bp[t % Bp.length];
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.6, i, I.Soft, 0, 0.2, 0.35 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.1, i, I.Gem, e.rot[t] * 0.5, 0.3, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.5 &&
            e.vfx.trail(t, n, r, Bp[Math.floor(Math.random() * Bp.length)], 0.3, I.Twinkle, 0.3);
        },
        hit(e, t, n, r) {
          let i = Bp[Math.floor(Math.random() * Bp.length)];
          (_p(e, t, n, r, i, 4, 3, I.Shard, 0.3), B(e, t, n, r, I.Twinkle, V.white, 0.4, 1.6, 0.15));
        },
      },
      "foul-play": {
        warn(e, t, n, r, i) {
          e.vfx.groundN.spawn({
            x: t,
            y: n + 0.1,
            z: r,
            life: 0.25,
            size: i * 0.4,
            endSize: i * 1.6,
            color: V.darkDeep,
            shape: I.Soft,
            rot: 0,
          });
        },
        sky(e, t, n, r, i) {
          for (let a = 0; a < 3; a++) {
            let o = (a / 3) * z + F.range(-0.3, 0.3),
              s = t + Math.cos(o) * i * 0.35,
              c = r + Math.sin(o) * i * 0.35;
            e.vfx.norm.spawn({
              x: s,
              y: n + 0.2,
              z: c,
              vy: 9,
              gravity: 26,
              life: 0.45,
              size: 0.9,
              endSize: 1.4,
              color: 2756672,
              shape: I.Palm,
              rot: F.range(-0.4, 0.4),
            });
          }
          (B(e, t, n + 1.2, r, I.Eye, 16734858, 0.6, 1.8, 0.35),
            e.vfx.groundN.spawn({
              x: t,
              y: n + 0.1,
              z: r,
              life: 0.7,
              size: i * 1.6,
              endSize: i * 2,
              color: 1706538,
              shape: I.Soft,
              rot: 0,
            }),
            vp(e, t, n + 0.5, r, 10119935, 8, i * 2, I.Spark, 0.45, 0.35),
            e.shake(0.06, t, r));
        },
      },
      "take-down": {
        dash(e, t, n, r, i, a, o) {
          (e.vfx.dust(t, n, r, 13158608, 10, 4),
            Tp(e, t, n + 0.8, r, t + i * o, n + 0.8, r + a * o, V.steel, I.Square, 6, 0.25, 0, 2));
          let s = t + i * o,
            c = r + a * o;
          e.later(0.12, () => {
            (B(e, s, n + 0.9, c, I.Twinkle, V.white, 0.7, 2.8, 0.2),
              e.vfx.ring(s, e.terrain.height(s, c), c, 2.2, V.steel, 0.3),
              _p(e, s, n, c, V.steelDark, 5, 4, I.Square, 0.3));
          });
        },
      },
      "metal-claw": {
        strike(e, t, n, r, i, a, o, s, c) {
          let l = c % 2 ? -0.35 : 0.35,
            u = t + i * o * 0.2,
            d = r + a * o * 0.2;
          (e.vfx.norm.spawn({
            x: u,
            y: n + 0.2,
            z: d,
            life: 0.22,
            size: o * 0.45,
            endSize: o * 0.9,
            color: V.steelDark,
            shape: I.Claw,
            rot: l,
          }),
            B(e, u, n + 0.2, d, I.Claw, 15267071, o * 0.35, o * 0.8, 0.14, l, 0.6));
          for (let t = 0; t < 6; t++) {
            let t = F.range(0, z);
            dp(e).spawn({
              x: u,
              y: n + 0.3,
              z: d,
              vx: Math.cos(t) * 6,
              vy: F.range(2, 5),
              vz: Math.sin(t) * 6,
              gravity: 16,
              life: 0.3,
              size: 0.14,
              endSize: 0.05,
              color: 16773280,
              shape: I.Square,
              glow: 0.3,
            });
          }
        },
      },
      "bullet-punch": {
        shape: I.Fist,
        color: V.steel,
        size: 1.1,
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n, 12110048, I.PixFist, 0, 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.2, V.steelDark, I.Soft, 0, 0, 0.25 * r));
        },
        trail(e, t, n, r) {
          e.vfx.add.spawn({
            x: t,
            y: n,
            z: r,
            life: 0.12,
            size: 0.5,
            endSize: 0.1,
            color: 11057360,
            shape: I.Soft,
            glow: 0.1,
          });
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Twinkle, V.steel, 0.35, 1.2, 0.12), _p(e, t, n, r, 16767082, 3, 4, I.Square, 0.12));
        },
      },
      "meteor-mash": {
        warn(e, t, n, r, i, a, o) {
          (zp(e, t, n, r, o, 14214399, I.Fist, i * 0.55, 26, 8),
            zp(e, t, n, r, o, 16773754, I.Star, i * 0.35, 27, 8.5));
        },
        sky(e, t, n, r, i) {
          (e.vfx.flash(t, n + 1, r, 15266047, i * 1.8, 0.2),
            e.vfx.ring(t, n, r, i, V.steel, 0.45),
            e.vfx.ring(t, n, r, i * 0.6, 16773754, 0.3),
            vp(e, t, n + 0.6, r, 16773754, 12, i * 2.6, I.Star, 0.6, 0.5),
            _p(e, t, n, r, V.steelDark, 8, i * 1.4, I.Shard, 0.45),
            _p(e, t, n, r, V.rock, 6, i * 1.2),
            mp(e, t, r, i * 1.8, 2763316, I.Crack, 1.6),
            e.shake(0.35, t, r));
        },
      },
      "dragon-breath": {
        cone(e, t, n, r, i, a, o, s, c) {
          let l = Math.sqrt(c / 7);
          (e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vx: i * 1.1,
            vy: a * 0.5 + 0.6,
            vz: o * 1.1,
            life: s,
            size: 0.45,
            endSize: 1.6 * l,
            color: 16777215,
            endColor: 12101887,
            shape: I.PixDragonFire,
            drag: 0.4,
            rot: F.range(-0.15, 0.15),
          }),
            Math.random() < 0.25 &&
              dp(e).spawn({
                x: t,
                y: n,
                z: r,
                vx: i * 0.9,
                vy: 1,
                vz: o * 0.9,
                life: s * 0.8,
                size: 0.14,
                endSize: 0.05,
                color: 9109456,
                shape: I.Square,
                glow: 0.3,
              }));
        },
      },
      headbutt: {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.25,
            c = r + a * o * 0.25;
          (B(e, s, n + 0.5, c, I.Star, 16773792, o * 0.3, o * 0.8, 0.18, 0, 0.6),
            e.vfx.ring(s, e.terrain.height(s, c), c, o * 0.6, V.white, 0.25));
          for (let t = 0; t < 3; t++) {
            let r = (t / 3) * z;
            dp(e).spawn({
              x: s + Math.cos(r) * 0.6,
              y: n + 1.4,
              z: c + Math.sin(r) * 0.6,
              vx: -Math.sin(r) * 3,
              vy: 0.6,
              vz: Math.cos(r) * 3,
              life: 0.5,
              size: 0.35,
              endSize: 0.2,
              color: 16771178,
              shape: I.Star,
              glow: 0.4,
              spin: 6,
            });
          }
          e.shake(0.04, s, c);
        },
      },
      "dragon-rush": {
        dash(e, t, n, r, i, a, o) {
          for (let s = 0; s < 10; s++) {
            let s = Math.random();
            e.vfx.norm.spawn({
              x: t + i * o * s + F.range(-0.5, 0.5),
              y: n + F.range(0.3, 1.3),
              z: r + a * o * s + F.range(-0.5, 0.5),
              vx: i * 3,
              vy: 2,
              vz: a * 3,
              life: 0.35,
              size: 0.7,
              endSize: 0.2,
              color: 16777215,
              endColor: 12101887,
              shape: I.PixDragonFire,
            });
          }
          let s = t + i * o,
            c = r + a * o;
          e.later(0.14, () => {
            (mp(e, s, c, 2.6, 2759188, I.Crack, 1.1, fp(i, a)),
              e.vfx.ring(s, e.terrain.height(s, c), c, 2.6, V.dragon, 0.35),
              _p(e, s, n, c, V.dirt, 6, 4),
              e.shake(0.06, s, c));
          });
        },
      },
      outrage: {
        nova(e, t, n, r, i) {
          (e.vfx.ring(t, n, r, i, 16734778, 0.4),
            e.later(0.06, () =>
              e.vfx.ring(t, e.terrain.height(t, r), r, i * 0.8, 10103338, 0.35, 0.25, L.Flames),
            ));
          for (let a = 0; a < 16; a++) {
            let o = (a / 16) * z;
            e.vfx.norm.spawn({
              x: t + Math.cos(o) * i * 0.3,
              y: n + 0.6,
              z: r + Math.sin(o) * i * 0.3,
              vx: Math.cos(o) * i * 2.2,
              vy: F.range(1, 3),
              vz: Math.sin(o) * i * 2.2,
              drag: 3,
              life: 0.4,
              size: 0.8,
              endSize: 0.3,
              color: 16760992,
              endColor: 13642282,
              shape: I.PixFlame,
            });
          }
          B(e, t, n + 2.2, r, I.Cross, 16726586, 0.5, 1.4, 0.25, 0, 0.5);
        },
      },
      "bone-club": {
        strike(e, t, n, r, i, a, o, s, c) {
          let l = t + i * o * 0.25,
            u = r + a * o * 0.25,
            d = fp(i, a),
            f = c % 2 ? -1 : 1;
          for (let t = 0; t < 3; t++)
            e.later(t * 0.03, () =>
              e.vfx.norm.spawn({
                x: l,
                y: n + 0.6 - t * 0.2,
                z: u,
                life: 0.1,
                size: o * 0.55,
                endSize: o * 0.55,
                color: V.white,
                shape: I.PixBone,
                rot: d + f * (0.9 - t * 0.8),
              }),
            );
          e.later(0.09, () => {
            (B(e, l, n + 0.3, u, I.Star, 16773824, 0.4, o * 0.7, 0.16, 0, 0.5),
              e.vfx.dust(l, e.terrain.height(l, u), u, 14207144, 6, 3));
          });
        },
      },
      bonemerang: {
        draw(e, t, n, r) {
          e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.1, V.white, I.PixBone, e.rot[t] * 1.6, 0, r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: 0.3,
              life: 0.3,
              size: 0.3,
              endSize: 0.6,
              color: 15260864,
              shape: I.PixPuff,
            });
        },
        hit(e, t, n, r) {
          B(e, t, n, r, I.Star, 16773824, 0.3, 1.4, 0.14, 0, 0.4);
        },
      },
      "bone-rush": {
        orbit(e, t, n, r, i, a) {
          (e.orbitals.push(t, n, r, a * 1.2, V.white, I.PixBone, i * 3, 0),
            Math.random() < 0.15 &&
              e.vfx.norm.spawn({
                x: t,
                y: n - 0.3,
                z: r,
                vy: 0.4,
                life: 0.35,
                size: 0.3,
                endSize: 0.6,
                color: 15260864,
                shape: I.PixPuff,
              }));
        },
      },
      "shadow-bone": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.6, V.ghost, I.Soft, 0, 0.2, 0.45 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.1, 13150463, I.PixBone, e.rot[t] * 1.6, 0.2, r));
        },
        trail(e, t, n, r) {
          e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vy: 1.4,
            life: 0.35,
            size: 0.4,
            endSize: 0.1,
            color: 16777215,
            endColor: 11047167,
            shape: I.PixDragonFire,
          });
        },
        hit(e, t, n, r) {
          (B(e, t, n + 0.5, r, I.Skull, 13150463, 0.4, 1.3, 0.35),
            vp(e, t, n, r, V.ghost, 5, 3, I.Flame, 0.4, 0.35));
        },
      },
      "shock-wave": {
        shape: I.Bolt,
        color: V.volt,
        size: 1,
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.7, V.volt, I.Soft, 0, 0.2, 0.4 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n, 16774832, I.Bolt, Math.sin(e.rot[t] * 3) * 0.5, 0.4, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.35 &&
            e.vfx.lightning(
              t,
              n,
              r,
              t + F.range(-0.6, 0.6),
              n + F.range(-0.5, 0.5),
              r + F.range(-0.6, 0.6),
              V.volt,
              0.1,
              2,
              0.06,
            );
        },
        hit(e, t, n, r) {
          vp(e, t, n, r, V.volt, 5, 4, I.Bolt, 0.35, 0.22);
        },
      },
      "cotton-spore": {
        cone(e, t, n, r, i, a, o, s, c) {
          let l = Math.sqrt(c / 7);
          (e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vx: i * 0.5,
            vy: a * 0.25 + 0.5,
            vz: o * 0.5,
            life: s * 1.3,
            size: 0.35,
            endSize: 0.9 * l,
            color: 16050900,
            shape: I.PixPuff,
            drag: 0.6,
            spin: 0.6,
          }),
            Math.random() < 0.3 &&
              dp(e).spawn({
                x: t,
                y: n,
                z: r,
                vx: i * 0.6,
                vy: 0.4,
                vz: o * 0.6,
                life: s * 1.4,
                size: 0.4,
                endSize: 0.2,
                color: 16774848,
                shape: I.Spore,
                glow: 0.2,
                drag: 0.8,
              }));
        },
      },
      "charge-beam": {
        beam(e, t, n, r, i, a, o, s) {
          (Cp(e, t, n, r, i, a, o, s * 0.9, 16765498, 16775376),
            Math.random() < 0.5 && e.vfx.lightning(t, n, r, i, a, o, V.volt, 0.16, 10, 0.06),
            Tp(e, t, n, r, i, a, o, 16773754, I.Square, 2, 0.15, 0, 2.5));
        },
        cast(e, t, n, r) {
          for (let i = 0; i < 4; i++) {
            let i = F.range(0, z);
            e.vfx.lightning(
              t + Math.cos(i) * 1.4,
              n + F.range(-0.5, 1),
              r + Math.sin(i) * 1.4,
              t,
              n,
              r,
              V.volt,
              0.12,
              3,
              0.12,
            );
          }
        },
      },
      "zap-cannon": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 2.2, 16762938, I.Soft, 0, 0.3, 0.6 * r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.1, 16775376, I.Soft, 0, 0.8, r));
          for (let i = 0; i < 3; i++)
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.5, V.volt, I.Bolt, e.rot[t] * 2 + i * 2.1, 0.5, 0.8 * r);
          e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.7, 16773754, I.Ring, 0, 0.3, 0.5 * r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.6 &&
            e.vfx.lightning(
              t,
              n,
              r,
              t + F.range(-1.4, 1.4),
              n + F.range(-1, 1),
              r + F.range(-1.4, 1.4),
              V.volt,
              0.14,
              3,
              0.07,
            );
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          (e.vfx.flash(t, n, r, 16774848, i * 1.5, 0.15), e.vfx.ring(t, a, r, i, V.volt, 0.45));
          for (let o = 0; o < 7; o++) {
            let s = (o / 7) * z + F.range(-0.3, 0.3);
            e.vfx.lightning(
              t,
              n,
              r,
              t + Math.cos(s) * i * 1.2,
              a + 0.2,
              r + Math.sin(s) * i * 1.2,
              V.volt,
              0.3,
              6,
              0.22,
            );
          }
          (vp(e, t, n, r, 16773754, 10, i * 2.4, I.Bolt, 0.6, 0.4),
            mp(e, t, r, i * 1.3, 2763290, I.Crack, 1.2),
            e.shake(0.14, t, r));
        },
      },
      "electro-ball": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.9, V.volt, I.Soft, 0, 0.3, 0.5 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.85, 16774848, I.Bolt, e.rot[t] * 3, 0.5, r));
        },
        trail(e, t, n, r) {
          dp(e).spawn({
            x: t,
            y: n,
            z: r,
            vx: F.range(-1.5, 1.5),
            vy: F.range(-1, 1),
            vz: F.range(-1.5, 1.5),
            life: 0.2,
            size: 0.14,
            endSize: 0.05,
            color: 16773754,
            shape: I.Square,
            glow: 0.3,
          });
        },
        boom(e, t, n, r, i) {
          e.vfx.ring(t, e.terrain.height(t, r), r, i, V.volt, 0.35);
          for (let a = 0; a < 4; a++) {
            let a = F.range(0, z);
            e.vfx.lightning(
              t,
              n,
              r,
              t + Math.cos(a) * i,
              n + F.range(-0.5, 1),
              r + Math.sin(a) * i,
              V.volt,
              0.22,
              4,
              0.15,
            );
          }
          vp(e, t, n, r, 16773754, 8, i * 2, I.Bolt, 0.45, 0.3);
        },
      },
      "fire-fang": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3;
          B(e, s, n + 0.3, c, I.Fang, 16773328, o * 0.75, o * 0.3, 0.2, 0, 0.6);
          for (let t = 0; t < 6; t++) {
            let t = F.range(0, z);
            Ep(
              e,
              s + Math.cos(t) * 0.4,
              n + 0.2,
              c + Math.sin(t) * 0.4,
              Math.cos(t) * 2.5,
              F.range(2, 4),
              Math.sin(t) * 2.5,
              0.35,
              0.6,
            );
          }
          Op(e, s, n + 0.3, c, 3, 3, 0.4);
        },
      },
      "flame-wheel": {
        zone(e, t, n, r, i, a) {
          Math.random() < Math.min(1, a) &&
            Ep(
              e,
              t,
              e.terrain.height(t, r) + 0.3,
              r,
              F.range(-0.4, 0.4),
              F.range(1.5, 3),
              F.range(-0.4, 0.4),
              0.45,
              F.range(0.5, 0.8),
              0.15,
            );
        },
      },
      "extreme-speed": {
        dash(e, t, n, r, i, a, o) {
          let s = -a,
            c = i;
          for (let l = 0; l < 9; l++) {
            let u = F.range(-1.2, 1.2),
              d = F.range(0.2, 1.8),
              f = F.range(0, 0.3);
            e.vfx.beams.spawn(
              t + i * o * f + s * u,
              n + d,
              r + a * o * f + c * u,
              t + i * o * (f + 0.7) + s * u,
              n + d,
              r + a * o * (f + 0.7) + c * u,
              l % 3 ? 0.1 : 0.16,
              l % 3 ? V.white : 16769162,
              0.18,
            );
          }
          (e.vfx.flash(t + i * o, n + 1, r + a * o, 16774352, 2.4, 0.1),
            B(e, t + i * o, n + 1, r + a * o, I.Twinkle, V.white, 0.6, 3, 0.18));
        },
      },
      "flare-blitz": {
        dash(e, t, n, r, i, a, o) {
          for (let s = 0; s < 14; s++) {
            let c = s / 14;
            e.later(c * 0.12, () =>
              Ep(
                e,
                t + i * o * c + F.range(-0.5, 0.5),
                n + F.range(0.3, 1.2),
                r + a * o * c + F.range(-0.5, 0.5),
                i * 2,
                F.range(2, 4),
                a * 2,
                0.5,
                1.1,
                0.3,
              ),
            );
          }
          let s = t + i * o,
            c = r + a * o;
          e.later(0.15, () => {
            let t = e.terrain.height(s, c);
            e.vfx.ring(s, t, c, 3, V.fireDeep, 0.4);
            for (let n = 0; n < 12; n++) {
              let r = (n / 12) * z;
              Ep(e, s, t + 0.5, c, Math.cos(r) * 7, F.range(2, 5), Math.sin(r) * 7, 0.45, 1, 0.3, 3);
            }
            (Op(e, s, t + 0.6, c, 10, 6, 0.7),
              Dp(e, s, t + 1.2, c, 1, 10128518, 0.7),
              mp(e, s, c, 3.4, 2759188, I.Soft, 1.4),
              e.shake(0.1, s, c));
          });
        },
      },
      "flame-burst": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.3, V.fire, I.Soft, 0, 0, 0.25 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.9, 16777215, I.PixFlame, 0, 0, r));
        },
        trail(e, t, n, r) {
          Op(e, t, n, r, 1, 1.5, 0.35);
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          e.vfx.ring(t, a, r, i, V.fireDeep, 0.35);
          for (let n = 0; n < 8; n++)
            Ep(e, t, a + 0.6, r, F.range(-2, 2), F.range(3, 5), F.range(-2, 2), 0.4, 1, 0.3, 2.5);
          for (let n = 0; n < 6; n++) {
            let o = (n / 6) * z;
            e.vfx.norm.spawn({
              x: t,
              y: a + 1,
              z: r,
              vx: Math.cos(o) * i * 1.4,
              vy: 6,
              vz: Math.sin(o) * i * 1.4,
              gravity: 18,
              life: 0.6,
              size: 0.45,
              endSize: 0.3,
              color: 16777215,
              shape: I.PixFlame,
            });
          }
          Op(e, t, a + 0.6, r, 6, i * 1.2, 0.6);
        },
      },
      "mud-slap": {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.9, V.mud, I.Soft, 0, 0, r),
            e.pool.push(e.x[t] - 0.1, e.y[t] + 0.12, e.z[t], n * 0.35, 13150328, I.Soft, 0, 0, r));
        },
        trail(e, t, n, r) {
          e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vx: F.range(-1, 1),
            vy: F.range(0, 1.5),
            vz: F.range(-1, 1),
            gravity: 14,
            life: 0.35,
            size: 0.22,
            endSize: 0.1,
            color: V.mud,
            shape: I.Drop,
          });
        },
        hit(e, t, n, r) {
          for (let i = 0; i < 6; i++) {
            let i = F.range(0, z);
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: Math.cos(i) * 3,
              vy: F.range(2, 5),
              vz: Math.sin(i) * 3,
              gravity: 18,
              life: 0.4,
              size: 0.3,
              endSize: 0.15,
              color: V.mud,
              shape: I.Drop,
            });
          }
        },
      },
      "mud-bomb": {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.05, V.mudDark, I.Soft, 0, 0, r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.8, V.mud, I.Soft, 0, 0, r),
            e.pool.push(e.x[t] - 0.15, e.y[t] + 0.2, e.z[t], n * 0.3, 14203016, I.Soft, 0, 0, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.5 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: -1,
              gravity: 10,
              life: 0.3,
              size: 0.25,
              endSize: 0.1,
              color: V.mud,
              shape: I.Drop,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          e.vfx.groundN.spawn({
            x: t,
            y: a + 0.09,
            z: r,
            life: 2.2,
            size: i * 1.5,
            endSize: i * 1.6,
            color: V.mudDark,
            shape: I.Soft,
            rot: 0,
          });
          for (let n = 0; n < 14; n++) {
            let o = F.range(0, z),
              s = F.range(2, i * 2);
            e.vfx.norm.spawn({
              x: t,
              y: a + 0.5,
              z: r,
              vx: Math.cos(o) * s,
              vy: F.range(4, 8),
              vz: Math.sin(o) * s,
              gravity: 22,
              life: 0.6,
              size: 0.4,
              endSize: 0.25,
              color: n % 3 ? V.mud : V.mudDark,
              shape: I.Drop,
            });
          }
          for (let n = 0; n < 3; n++) Dp(e, t, a + 0.6, r, 1.1, 10123866, 0.6);
          e.vfx.ring(t, a, r, i, 13150328, 0.3);
        },
      },
      "muddy-water": {
        draw(e, t, n, r) {
          let i = Math.sin(e.rot[t] * 2 + e.x[t]) * 0.2;
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.5, 9071162, I.Soft, 0, 0, 0.75 * r),
            e.pool.push(e.x[t], e.y[t] + 0.7 + i, e.z[t], n * 0.9, 12098152, I.Soft, 0, 0, r),
            e.pool.push(e.x[t], e.y[t] + 1.1 + i, e.z[t], n * 0.45, 15260864, I.Bubble, e.rot[t], 0, r));
        },
        trail(e, t, n, r) {
          e.vfx.norm.spawn({
            x: t,
            y: n + 1,
            z: r,
            vx: F.range(-1, 1),
            vy: F.range(2, 4),
            vz: F.range(-1, 1),
            gravity: 14,
            life: 0.4,
            size: 0.3,
            endSize: 0.1,
            color: 11044442,
            shape: I.Drop,
          });
        },
      },
      "hammer-arm": {
        nova(e, t, n, r, i) {
          let a = e.player.facing,
            o = t + a.x * 1.2,
            s = r + a.y * 1.2;
          (e.vfx.norm.spawn({
            x: o,
            y: n + 4,
            z: s,
            vy: -26,
            life: 0.14,
            size: 2.2,
            endSize: 2.6,
            color: 14727312,
            shape: I.PixFist,
            rot: Math.PI / 2,
          }),
            e.later(0.14, () => {
              e.vfx.flash(t, n + 1, r, 16769200, i * 1.2, 0.15);
              for (let n = 0; n < 3; n++) {
                let a = (n / 3) * z + F.range(-0.3, 0.3);
                mp(e, t + Math.cos(a) * i * 0.3, r + Math.sin(a) * i * 0.3, i * 0.5, 3811866, I.Crack, 1.2, a);
              }
              (e.vfx.ring(t, n, r, i, V.punch, 0.45, 0.15, L.Jagged),
                e.vfx.ring(t, n, r, i * 0.6, 13150328, 0.3, 0.15, L.Jagged),
                e.vfx.dust(t, n, r, 13150328, 18, i * 1.6),
                _p(e, t, n, r, V.dirt, 8, i * 1.2),
                e.shake(0.25));
            }));
        },
      },
      "mud-trail": {
        zone(e, t, n, r) {
          Math.random() < 0.3 &&
            e.vfx.norm.spawn({
              x: t,
              y: e.terrain.height(t, r) + 0.2,
              z: r,
              vy: F.range(1, 2),
              gravity: 8,
              life: 0.4,
              size: 0.22,
              endSize: 0.1,
              color: V.mud,
              shape: I.Drop,
            });
        },
      },
      "horn-attack": {
        strike(e, t, n, r, i, a, o) {
          let s = e.player.pos,
            c = 0.12,
            l = -fp(i, a) + Math.PI * 0.75;
          (e.vfx.norm.spawn({
            x: s.x + i * 0.6,
            y: n + 0.2,
            z: s.z + a * 0.6,
            vx: (t - s.x) / c,
            vz: (r - s.z) / c,
            life: c,
            size: o * 0.45,
            endSize: o * 0.55,
            color: V.horn,
            shape: I.PixHorn,
            rot: l,
          }),
            e.later(c, () => {
              (B(e, t, n + 0.3, r, I.Twinkle, V.white, 0.5, o * 0.8, 0.16),
                vp(e, t, n + 0.3, r, 12112127, 6, 5, I.Spark, 0.4, 0.25));
            }));
        },
      },
      "pin-missile": {
        shape: I.Shard,
        color: 13693050,
        size: 0.8,
        trail(e, t, n, r) {
          e.vfx.add.spawn({
            x: t,
            y: n,
            z: r,
            life: 0.14,
            size: 0.25,
            endSize: 0,
            color: V.bug,
            shape: I.Soft,
            glow: 0.2,
          });
        },
        hit(e, t, n, r) {
          B(e, t, n, r, I.Cross, 15269808, 0.3, 1.2, 0.12);
        },
      },
      "brick-break": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.25,
            c = r + a * o * 0.25,
            l = e.terrain.height(s, c);
          (e.vfx.norm.spawn({
            x: s,
            y: l + 3,
            z: c,
            vy: -24,
            life: 0.12,
            size: o * 0.5,
            endSize: o * 0.55,
            color: 16769216,
            shape: I.Palm,
            rot: Math.PI,
          }),
            e.later(0.12, () => {
              for (let t = 0; t < 8; t++) {
                let n = F.range(0, z);
                e.vfx.norm.spawn({
                  x: s,
                  y: l + 0.5,
                  z: c,
                  vx: Math.cos(n) * 5,
                  vy: F.range(4, 8),
                  vz: Math.sin(n) * 5,
                  gravity: 22,
                  life: 0.55,
                  size: 0.32,
                  endSize: 0.28,
                  color: t % 2 ? 13134394 : 11029034,
                  shape: I.Square,
                  spin: F.range(-8, 8),
                });
              }
              (mp(e, s, c, o * 0.6, 3811866, I.Crack, 0.8),
                B(e, s, l + 0.6, c, I.Twinkle, V.punch, 0.5, o * 0.8, 0.15));
            }));
        },
      },
      megahorn: {
        dash(e, t, n, r, i, a, o) {
          let s = -fp(i, a) + Math.PI * 0.75,
            c = 0.18;
          (e.vfx.norm.spawn({
            x: t + i,
            y: n + 1,
            z: r + a,
            vx: (i * o) / c,
            vz: (a * o) / c,
            life: c,
            size: 2.4,
            endSize: 2.6,
            color: V.horn,
            shape: I.PixHorn,
            rot: s,
          }),
            Tp(e, t, n + 1, r, t + i * o, n + 1, r + a * o, V.bug, I.Spark, 6, 0.4));
          let l = t + i * o,
            u = r + a * o;
          e.later(c, () => {
            (e.vfx.flash(l, n + 1, u, 15269808, 3, 0.15),
              e.vfx.ring(l, e.terrain.height(l, u), u, 3, V.bug, 0.4),
              _p(e, l, n, u, V.dirt, 8, 5),
              mp(e, l, u, 2.2, 2759178, I.Crack, 1.2, fp(i, a)),
              e.shake(0.16, l, u),
              e.audio.move(`megahorn`, `impact`));
          });
        },
      },
      "aerial-ace": {
        shape: I.Crescent,
        color: 15267071,
        size: 1.1,
        trail(e, t, n, r, i, a) {
          e.vfx.add.spawn({
            x: t,
            y: n,
            z: r,
            life: 0.14,
            size: a * 0.8,
            endSize: a * 0.4,
            color: 10143999,
            shape: I.Crescent,
            rot: F.range(0, z),
            glow: 0.2,
          });
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Cross, V.white, 0.45, 1.8, 0.14),
            vp(e, t, n, r, V.air, 4, 4, I.Feather, 0.35, 0.35));
        },
      },
      "mach-punch": {
        shape: I.Fist,
        color: V.punch,
        size: 1,
        trail(e, t, n, r) {
          e.vfx.add.spawn({
            x: t,
            y: n,
            z: r,
            life: 0.12,
            size: 0.45,
            endSize: 0.1,
            color: 16765066,
            shape: I.Soft,
            glow: 0.15,
          });
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Twinkle, V.white, 0.4, 1.8, 0.14), vp(e, t, n, r, V.punch, 4, 4, I.Spark, 0.3, 0.2));
        },
      },
      "bullet-seed": {
        shape: I.Drop,
        color: 13162608,
        size: 0.7,
        trail() {},
        hit(e, t, n, r) {
          (vp(e, t, n, r, V.leaf, 3, 3, I.Leaf, 0.25, 0.25), _p(e, t, n, r, 11057232, 2, 2, I.Drop, 0.15));
        },
      },
      extrasensory: {
        shape: I.Eye,
        color: 16747240,
        size: 1.2,
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.8, V.psy, I.Soft, 0, 0.3, 0.5 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n, 16763124, I.Eye, 0, 0.5, r),
            e.glow.push(
              e.x[t],
              e.y[t],
              e.z[t],
              n * 1.4,
              V.psy,
              I.Ring,
              0,
              0.3,
              0.4 * r * (0.5 + 0.5 * Math.sin(e.rot[t] * 4)),
            ));
        },
        trail(e, t, n, r) {
          e.vfx.trail(t, n, r, 16759024, 0.3, I.Ring, 0.25);
        },
        hit(e, t, n, r) {
          (B(e, t, n + 0.5, r, I.Eye, V.psy, 0.5, 1.6, 0.3),
            vp(e, t, n, r, V.psy, 5, 3, I.Swirl, 0.45, 0.4, 3));
        },
      },
      metronome: {
        cast(e, t, n, r, i, a, o) {
          for (let t = 0; t < 4; t++)
            e.later(t * 0.09, () => {
              let n = e.player.pos;
              e.vfx.norm.spawn({
                x: n.x,
                y: n.y + 2.3,
                z: n.z,
                life: 0.1,
                size: 1.1,
                endSize: 1.1,
                color: V.white,
                shape: I.PixFinger,
                rot: t % 2 ? 0.45 : -0.45,
              });
            });
          e.later(0.36, () => {
            let t = e.player.pos;
            (vp(e, t.x, t.y + 2.3, t.z, o, 8, 4, I.Twinkle, 0.4, 0.4),
              B(e, t.x, t.y + 2.3, t.z, I.Ring, o, 0.4, 2, 0.25));
          });
        },
      },
      "fairy-wind": {
        cone(e, t, n, r, i, a, o, s, c) {
          let l = Math.sqrt(c / 7);
          (dp(e).spawn({
            x: t,
            y: n,
            z: r,
            vx: i * 0.95 + F.range(-1.5, 1.5),
            vy: a * 0.4 + 0.4,
            vz: o * 0.95 + F.range(-1.5, 1.5),
            life: s,
            size: 0.35,
            endSize: 0.6 * l,
            color: Math.random() < 0.5 ? V.fairy : V.moon,
            shape: Math.random() < 0.6 ? I.Twinkle : I.Heart,
            glow: 0.3,
            spin: 5,
            drag: 0.4,
          }),
            Math.random() < 0.3 &&
              e.vfx.ground.spawn({
                x: t,
                y: n - 0.4,
                z: r,
                vx: i * 0.7,
                vz: o * 0.7,
                life: s * 1.1,
                size: 0.8,
                endSize: 2.4 * l,
                color: 16763116,
                shape: I.Crescent,
                rot: fp(i, o),
                glow: 0.2,
              }));
        },
      },
      "dazzling-gleam": {
        nova(e, t, n, r, i) {
          e.vfx.flash(t, n + 1, r, 16773370, i * 1.4, 0.18);
          let a = [16747224, 9099519, 16771178, 12124042, 16777215];
          for (let o = 0; o < 3; o++)
            e.later(o * 0.07, () => e.vfx.ring(t, n, r, i * (0.5 + o * 0.25), a[o], 0.4));
          for (let o = 0; o < 20; o++) {
            let s = (o / 20) * z;
            dp(e).spawn({
              x: t,
              y: n + 0.8,
              z: r,
              vx: Math.cos(s) * i * 2.4,
              vy: F.range(0, 2),
              vz: Math.sin(s) * i * 2.4,
              drag: 3,
              life: 0.5,
              size: 0.7,
              endSize: 0.2,
              color: a[o % a.length],
              shape: I.Twinkle,
              glow: 0.6,
              spin: 4,
            });
          }
        },
      },
      "sky-attack": {
        warn(e, t, n, r, i, a, o) {
          (zp(e, t, n, r, o, 16773824, I.Feather, i * 0.6, 30, 10),
            zp(e, t, n, r, o, 16767082, I.Twinkle, i * 0.4, 31, 10.5));
        },
        sky(e, t, n, r, i) {
          (e.vfx.flash(t, n + 1, r, 16774352, i * 2, 0.22),
            e.vfx.ring(t, n, r, i, 16767082, 0.45),
            e.vfx.ring(t, n, r, i * 0.65, V.white, 0.3));
          for (let a = 0; a < 14; a++) {
            let a = F.range(0, z),
              o = F.range(i, i * 2.4);
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.8,
              z: r,
              vx: Math.cos(a) * o,
              vy: F.range(3, 7),
              vz: Math.sin(a) * o,
              gravity: 3,
              drag: 2,
              life: 1.1,
              size: 0.55,
              endSize: 0.45,
              color: 16775400,
              shape: I.Feather,
              spin: F.range(-4, 4),
            });
          }
          (vp(e, t, n + 0.6, r, 16767082, 12, i * 2.6, I.Twinkle, 0.7, 0.5),
            mp(e, t, r, i * 1.5, 2760724, I.Crack, 1.4),
            e.shake(0.35, t, r));
        },
      },
      "string-shot": {
        cone(e, t, n, r, i, a, o, s, c) {
          if (
            (Math.random() < 0.55 &&
              e.vfx.beams.spawn(
                t,
                n,
                r,
                t + i * s * 0.6,
                n + a * s * 0.3,
                r + o * s * 0.6,
                0.05,
                16053503,
                0.12,
                0.8,
              ),
            Math.random() < 0.18)
          ) {
            let l = Math.sqrt(c / 7),
              u = t + i * s,
              d = r + o * s;
            (e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: i * 0.9,
              vy: a * 0.3,
              vz: o * 0.9,
              drag: 1.2,
              life: s * 0.9,
              size: 0.3,
              endSize: 0.9 * l,
              color: 16777215,
              shape: I.PixWeb,
              spin: F.range(-2, 2),
            }),
              Math.random() < 0.35 && mp(e, u, d, 1.2 * l, 16777215, I.PixWeb, 1.4));
          }
        },
      },
      "bug-bite": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3;
          for (let t of [-1, 1])
            e.vfx.norm.spawn({
              x: s - a * t * 0.9,
              y: n + 0.3,
              z: c + i * t * 0.9,
              vx: a * t * 6,
              vz: -i * t * 6,
              life: 0.14,
              size: o * 0.4,
              endSize: o * 0.35,
              color: 14215280,
              shape: I.Crescent,
              rot: fp(i, a) + (t > 0 ? 0 : Math.PI),
            });
          e.later(0.12, () => {
            (B(e, s, n + 0.3, c, I.Cross, 15794096, 0.4, o * 0.7, 0.14, 0, 0.5),
              _p(e, s, n, c, 10147898, 5, 3, I.PixDrop, 0.25));
          });
        },
      },
      gust: {
        draw(e, t, n, r) {
          let i = e.rot[t];
          for (let a = 0; a < 3; a++)
            e.pool.push(
              e.x[t] + Math.sin(i * 2 + a) * 0.1,
              e.y[t] - 0.5 + a * n * 0.45,
              e.z[t],
              n * (0.6 + a * 0.25),
              16777215,
              I.PixTornado,
              Math.sin(i * 3 + a) * 0.12,
              0,
              r * (0.75 + a * 0.08),
            );
          Rp(e, t, n, r, I.PixLeaf, 16777215, 3, n * 0.6, !1);
        },
        trail(e, t, n, r) {
          Math.random() < 0.4 && e.vfx.dust(t, n - 1, r, 14209208, 1, 2);
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          (e.vfx.ring(t, a, r, i, 13166847, 0.4, 0.15, L.Ripple),
            yp(e, t, n, r, 16777215, 8, i * 2, I.PixLeaf, 0.5, 0.55, i * 2.4),
            e.vfx.dust(t, a, r, 14209208, 8, i * 1.4));
        },
      },
      "bug-buzz": {
        nova(e, t, n, r, i) {
          bp(e, t, n, r, 13168762, 12, i * 2.3, I.Sound, 1.6, 0.42);
          for (let t = 0; t < 2; t++)
            e.later(t * 0.08, () =>
              e.vfx.ring(
                e.player.pos.x,
                e.player.pos.y,
                e.player.pos.z,
                i * (0.6 + t * 0.4),
                t ? 15269808 : V.bug,
                0.35,
                0.15,
                L.Ripple,
              ),
            );
          for (let a = 0; a < 10; a++) {
            let o = (a / 10) * z;
            e.vfx.norm.spawn({
              x: t,
              y: n + 1,
              z: r,
              vx: Math.cos(o) * i * 1.8,
              vy: F.range(1, 3),
              vz: Math.sin(o) * i * 1.8,
              drag: 3,
              life: 0.6,
              size: 0.45,
              endSize: 0.3,
              color: 16777215,
              shape: I.PixButterfly,
              spin: F.range(-3, 3),
            });
          }
          e.shake(0.08);
        },
      },
      "poison-sting": {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.15, 16777215, I.PixStinger, Ll(e.vx[t], e.vz[t]), 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.2, V.poison, I.Soft, 0, 0, 0.2 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.4 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: -0.6,
              gravity: 4,
              life: 0.3,
              size: 0.18,
              endSize: 0.1,
              color: 16777215,
              shape: I.PixToxic,
            });
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Cross, 14727423, 0.3, 1.1, 0.12), _p(e, t, n, r, 16777215, 3, 2, I.PixToxic, 0.22));
        },
      },
      twineedle: {
        draw(e, t, n, r) {
          let i = Math.hypot(e.vx[t], e.vz[t]) || 1,
            a = (-e.vz[t] / i) * 0.22,
            o = (e.vx[t] / i) * 0.22;
          for (let i of [-1, 1])
            e.pool.push(
              e.x[t] + a * i,
              e.y[t],
              e.z[t] + o * i,
              n * 0.9,
              16777215,
              I.PixStinger,
              Math.PI / 2,
              0,
              r,
            );
        },
        trail(e, t, n, r) {
          e.vfx.add.spawn({
            x: t,
            y: n,
            z: r,
            life: 0.12,
            size: 0.22,
            endSize: 0,
            color: 14212328,
            shape: I.Soft,
            glow: 0.1,
          });
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Twinkle, 16767200, 0.3, 1.1, 0.12),
            Math.random() < 0.4 && _p(e, t, n, r, 16777215, 2, 2, I.PixToxic, 0.2));
        },
      },
      "toxic-spikes": {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t] - 0.2, e.z[t], n * 0.8, 14199039, I.PixSpike, 0, 0, r),
            e.glow.push(
              e.x[t],
              e.y[t] - 0.3,
              e.z[t],
              n * 1.1,
              V.poison,
              I.Soft,
              0,
              0,
              (0.15 + 0.1 * Math.sin(e.rot[t] * 3)) * r,
            ));
        },
        trail(e, t, n, r) {
          Math.random() < 0.1 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: 0.8,
              life: 0.4,
              size: 0.2,
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
            life: 1.6,
            size: i * 1.3,
            endSize: i * 1.4,
            color: 6957706,
            shape: I.PixSludge,
            rot: F.range(0, z),
          });
          for (let n = 0; n < 8; n++) {
            let n = F.range(0, z),
              o = F.range(2, i * 2);
            e.vfx.norm.spawn({
              x: t,
              y: a + 0.4,
              z: r,
              vx: Math.cos(n) * o,
              vy: F.range(3, 7),
              vz: Math.sin(n) * o,
              gravity: 20,
              life: 0.6,
              size: 0.35,
              endSize: 0.2,
              color: 16777215,
              shape: I.PixToxic,
            });
          }
          e.vfx.ring(t, a, r, i, V.poison, 0.35);
        },
      },
      "poison-jab": {
        strike(e, t, n, r, i, a, o, s, c) {
          let l = e.player.pos,
            u = 0.1,
            d = c % 2 ? -0.5 : 0.5,
            f = l.x - a * d,
            p = l.z + i * d;
          (e.vfx.norm.spawn({
            x: f + i * 0.6,
            y: n + 0.2,
            z: p + a * 0.6,
            vx: (t - f) / u,
            vz: (r - p) / u,
            life: u,
            size: o * 0.45,
            endSize: o * 0.5,
            color: 16777215,
            shape: I.PixStinger,
            rot: -fp(i, a) + Math.PI / 2,
          }),
            e.later(u, () => {
              (B(e, t, n + 0.3, r, I.Twinkle, 14727423, 0.4, o * 0.75, 0.14),
                _p(e, t, n, r, 16777215, 4, 3, I.PixToxic, 0.28));
            }));
        },
      },
      "feather-dance": {
        draw(e, t, n, r) {
          e.pool.push(
            e.x[t],
            e.y[t] + Math.sin(e.rot[t] * 2) * 0.15,
            e.z[t],
            n * 1.2,
            16777215,
            I.PixFeather,
            Math.sin(e.rot[t] * 1.5) * 0.6,
            0,
            r,
          );
        },
        trail(e, t, n, r) {
          Math.random() < 0.25 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: F.range(-0.6, 0.6),
              vy: -0.4,
              vz: F.range(-0.6, 0.6),
              drag: 1.5,
              life: 0.7,
              size: 0.35,
              endSize: 0.3,
              color: 16777215,
              shape: I.PixFeather,
              spin: F.range(-3, 3),
            });
        },
        hit(e, t, n, r) {
          (yp(e, t, n, r, 16777215, 4, 2.5, I.PixFeather, 0.35, 0.5),
            B(e, t, n + 0.6, r, I.Heart, 16759e3, 0.3, 0.9, 0.3, 0, 0.2));
        },
      },
      hurricane: {
        draw(e, t, n, r) {
          let i = e.rot[t];
          for (let a = 0; a < 5; a++)
            e.pool.push(
              e.x[t] + Math.sin(i * 2.5 + a * 0.8) * 0.18 * a,
              e.y[t] - 0.8 + a * n * 0.42,
              e.z[t],
              n * (0.55 + a * 0.2),
              16777215,
              I.PixTornado,
              Math.sin(i * 4 + a) * 0.1,
              0,
              r * 0.9,
            );
          Rp(e, t, n * 1.2, r, I.PixFeather, 16777215, 5, n * 0.7, !1);
        },
        trail(e, t, n, r) {
          e.vfx.dust(t, n - 1.2, r, 14209208, 1, 3);
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          for (let n = 0; n < 2; n++)
            e.later(n * 0.1, () =>
              e.vfx.ring(t, a, r, i * (0.7 + n * 0.35), n ? 16777215 : 11061488, 0.4, 0.15, L.Ripple),
            );
          (yp(e, t, n, r, 16777215, 14, i * 2.2, I.PixFeather, 0.6, 0.7, i * 3),
            e.vfx.dust(t, a, r, 14209208, 12, i * 1.6),
            e.shake(0.12, t, r));
        },
      },
      "hyper-fang": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3;
          (e.vfx.norm.spawn({
            x: s,
            y: n + 1.6,
            z: c,
            vy: -14,
            life: 0.1,
            size: o * 0.55,
            endSize: o * 0.6,
            color: 16777215,
            shape: I.PixFang,
          }),
            e.later(0.1, () => {
              (B(e, s, n + 0.3, c, I.Star, 16773824, 0.4, o * 0.8, 0.16, 0, 0.5),
                vp(e, s, n + 0.3, c, 16771232, 5, 4, I.Spark, 0.35, 0.25),
                e.shake(0.04, s, c));
            }));
        },
      },
      pursuit: {
        draw(e, t, n, r) {
          e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.1, 2758720, I.Soft, 0, 0, r);
          for (let i of [-1, 1])
            e.glow.push(e.x[t] + i * n * 0.18, e.y[t] + n * 0.1, e.z[t], n * 0.25, 16734858, I.Soft, 0, 0.3, r);
        },
        trail(e, t, n, r) {
          e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vy: 0.3,
            life: 0.35,
            size: 0.5,
            endSize: 0.9,
            color: 2759226,
            shape: I.Soft,
            drag: 2,
          });
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Fang, 14207231, 0.6, 0.3, 0.16), vp(e, t, n, r, V.dark, 4, 3, I.Spark, 0.3, 0.25));
        },
      },
      "double-edge": {
        dash(e, t, n, r, i, a, o) {
          (e.vfx.dust(t, n, r, 14207144, 12, 4),
            Tp(e, t, n + 0.8, r, t + i * o, n + 0.8, r + a * o, 16769184, I.Spark, 6, 0.4));
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => {
            let t = e.terrain.height(s, c);
            (B(e, s, t + 1, c, I.Star, 16769162, 0.8, 3, 0.22, 0, 0.5),
              e.vfx.ring(s, t, c, 2.8, 14207144, 0.35, 0.15, L.Jagged),
              mp(e, s, c, 2.4, 3811866, I.PixCrack, 1.2),
              _p(e, s, t, c, 16777215, 6, 4, I.PixRock, 0.35),
              e.shake(0.12, s, c));
          });
        },
      },
      "super-fang": {
        link(e, t, n, r, i, a, o, s, c) {
          (e.vfx.beams.spawn(t, n, r, i, a, o, 0.08, 16773824, 0.12, 0.6),
            e.later(c * 0.05, () => {
              (e.vfx.norm.spawn({
                x: i,
                y: a + 1.2,
                z: o,
                vy: -10,
                life: 0.1,
                size: 1.4,
                endSize: 1.5,
                color: 16777215,
                shape: I.PixFang,
              }),
                e.later(0.1, () => {
                  (B(e, i, a, o, I.Star, 16771232, 0.35, 1.6, 0.14, 0, 0.4),
                    _p(e, i, a, o, 16773824, 3, 2, I.Shard, 0.2));
                }));
            }));
        },
      },
      peck: {
        strike(e, t, n, r, i, a, o, s, c) {
          let l = t + i * o * 0.25 + F.range(-0.4, 0.4),
            u = r + a * o * 0.25 + F.range(-0.4, 0.4);
          (e.vfx.beams.spawn(l - i * 1.4, n + 0.6, u - a * 1.4, l, n + 0.3, u, 0.22, 16760944, 0.1),
            B(e, l, n + 0.3, u, I.Twinkle, V.white, 0.3, o * 0.55, 0.12, c * 0.4, 0.4),
            Math.random() < 0.5 &&
              e.vfx.norm.spawn({
                x: l,
                y: n + 0.5,
                z: u,
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
              }));
        },
      },
      "fury-attack": {
        shape: I.Shard,
        color: 16756826,
        size: 0.75,
        trail(e, t, n, r) {
          e.vfx.add.spawn({
            x: t,
            y: n,
            z: r,
            life: 0.1,
            size: 0.2,
            endSize: 0,
            color: 16760960,
            shape: I.Soft,
            glow: 0.1,
          });
        },
        hit(e, t, n, r) {
          B(e, t, n, r, I.Twinkle, 16773328, 0.25, 1, 0.1);
        },
      },
      "drill-run": {
        dash(e, t, n, r, i, a, o) {
          for (let s = 0; s < 10; s++) {
            let c = s / 10,
              l = c * 20,
              u = t + i * o * c,
              d = r + a * o * c;
            e.later(c * 0.12, () => {
              (e.vfx.norm.spawn({
                x: u - a * Math.cos(l) * 0.7,
                y: n + 0.8 + Math.sin(l) * 0.7,
                z: d + i * Math.cos(l) * 0.7,
                life: 0.25,
                size: 0.6,
                endSize: 1.1,
                color: 15255696,
                shape: I.PixPuff,
              }),
                s % 2 == 0 && mp(e, u, d, 1.5, 16777215, I.PixCrack, 1, fp(i, a)));
            });
          }
          let s = t + i * o,
            c = r + a * o;
          e.later(0.14, () => {
            (_p(e, s, e.terrain.height(s, c), c, 16777215, 7, 4, I.PixRock, 0.4),
              e.vfx.dust(s, e.terrain.height(s, c), c, 14203e3, 8, 4));
          });
        },
      },
      "drill-peck": {
        warn(e, t, n, r, i, a, o) {
          zp(e, t, n, r, o, 16760944, I.Shard, i * 0.5, 16, 4);
          for (let i = 0; i < 3; i++)
            e.later(o * i * 0.25, () =>
              e.vfx.norm.spawn({
                x: t + F.range(-0.5, 0.5),
                y: n + 8 - i * 2,
                z: r + F.range(-0.5, 0.5),
                vy: -6,
                life: 0.4,
                size: 0.4,
                endSize: 0.35,
                color: 16777215,
                shape: I.PixFeather,
                spin: 8,
              }),
            );
        },
        sky(e, t, n, r, i) {
          for (let i = 0; i < 6; i++) {
            let a = (i / 6) * z;
            e.vfx.beams.spawn(
              t + Math.cos(a) * 0.4,
              n + 3.5,
              r + Math.sin(a) * 0.4,
              t,
              n + 0.2,
              r,
              0.12,
              i % 2 ? 16777215 : 16760944,
              0.14,
            );
          }
          (B(e, t, n + 0.6, r, I.Star, 16769184, 0.5, i * 1.1, 0.18, 0, 0.4),
            mp(e, t, r, i * 1.1, 16777215, I.PixCrack, 1.2),
            yp(e, t, n + 0.4, r, 16777215, 6, i * 2, I.PixFeather, 0.4, 0.6),
            e.vfx.ring(t, n, r, i, 16760944, 0.3),
            e.shake(0.07, t, r));
        },
      },
      wrap: {
        nova(e, t, n, r, i) {
          let a = F.range(0, z);
          for (let o = 0; o < 18; o++) {
            let s = o / 18,
              c = a + s * z * 1.2,
              l = a + ((o + 1) / 18) * z * 1.2,
              u = i * (0.35 + s * 0.55),
              d = i * (0.35 + ((o + 1) / 18) * 0.55);
            e.vfx.beams.spawn(
              t + Math.cos(c) * u,
              n + 0.4,
              r + Math.sin(c) * u,
              t + Math.cos(l) * d,
              n + 0.4,
              r + Math.sin(l) * d,
              0.35 - s * 0.15,
              o % 3 ? 10115784 : 15255658,
              0.18,
            );
          }
          (e.vfx.ring(t, n, r, i, 10115784, 0.35, 0.5), e.vfx.dust(t, n, r, 14207144, 6, i));
        },
      },
      acid: {
        cone(e, t, n, r, i, a, o, s) {
          if (
            !(Math.random() < 0.4) &&
            (e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: i * 0.9 + F.range(-1, 1),
              vy: a * 0.5 + 2,
              vz: o * 0.9 + F.range(-1, 1),
              gravity: 7,
              life: s,
              size: 0.3,
              endSize: 0.25,
              color: 16777215,
              shape: I.PixToxic,
            }),
            Math.random() < 0.08)
          ) {
            let n = t + i * s,
              a = r + o * s;
            e.later(s, () => {
              e.vfx.groundN.spawn({
                x: n,
                y: e.terrain.height(n, a) + 0.08,
                z: a,
                life: 1,
                size: 1,
                endSize: 1.2,
                color: 8010408,
                shape: I.PixSludge,
                rot: F.range(0, z),
              });
            });
          }
        },
      },
      "sludge-bomb": {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.15, 16777215, I.PixSludge, e.rot[t] * 0.5, 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.3, V.poison, I.Soft, 0, 0, 0.2 * r));
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
              size: 0.25,
              endSize: 0.12,
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
            life: 2,
            size: i * 1.5,
            endSize: i * 1.6,
            color: 6957706,
            shape: I.PixSludge,
            rot: F.range(0, z),
          });
          for (let n = 0; n < 12; n++) {
            let o = F.range(0, z),
              s = F.range(2, i * 2.2);
            e.vfx.norm.spawn({
              x: t,
              y: a + 0.5,
              z: r,
              vx: Math.cos(o) * s,
              vy: F.range(4, 8),
              vz: Math.sin(o) * s,
              gravity: 22,
              life: 0.6,
              size: 0.4,
              endSize: 0.25,
              color: 16777215,
              shape: n % 3 ? I.PixToxic : I.PixSludge,
            });
          }
          for (let n = 0; n < 2; n++) Dp(e, t, a + 0.6, r, 1, 10123952, 0.7);
          e.vfx.ring(t, a, r, i, V.poison, 0.35);
        },
      },
      "gunk-shot": {
        warn(e, t, n, r, i, a, o) {
          zp(e, t, n, r, o, 16777215, I.PixSludge, i * 0.6, 22, 6);
        },
        sky(e, t, n, r, i) {
          e.vfx.groundN.spawn({
            x: t,
            y: n + 0.09,
            z: r,
            life: 2.6,
            size: i * 1.8,
            endSize: i * 1.9,
            color: 5906552,
            shape: I.PixSludge,
            rot: F.range(0, z),
          });
          for (let a = 0; a < 18; a++) {
            let o = F.range(0, z),
              s = F.range(2, i * 2.4);
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.5,
              z: r,
              vx: Math.cos(o) * s,
              vy: F.range(5, 10),
              vz: Math.sin(o) * s,
              gravity: 24,
              life: 0.7,
              size: F.range(0.35, 0.6),
              endSize: 0.25,
              color: 16777215,
              shape: a % 2 ? I.PixToxic : I.PixSludge,
            });
          }
          for (let a = 0; a < 6; a++)
            e.later(0.2 + a * 0.15, () =>
              e.vfx.norm.spawn({
                x: t + F.range(-i, i) * 0.6,
                y: n + 0.3,
                z: r + F.range(-i, i) * 0.6,
                vy: 1.5,
                life: 0.8,
                size: 0.4,
                endSize: 0.6,
                color: 16777215,
                shape: I.PixToxic,
              }),
            );
          (e.vfx.ring(t, n, r, i, V.poison, 0.45, 0.15, L.Jagged), e.shake(0.3, t, r));
        },
      },
      "fury-swipes": {
        draw(e, t, n, r) {
          e.pool.push(
            e.x[t],
            e.y[t],
            e.z[t],
            n * 1.2,
            16777215,
            I.PixClaw,
            Math.atan2(e.vx[t], e.vz[t]) * 0.2 + (t % 2 ? 0.4 : -0.4),
            0,
            r,
          );
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              life: 0.25,
              size: 0.3,
              endSize: 0.5,
              color: 16777215,
              shape: I.PixSand,
            });
        },
        hit(e, t, n, r) {
          B(e, t, n, r, I.Claw, 16773328, 0.4, 1.3, 0.12, F.range(-0.4, 0.4), 0.4);
        },
      },
      "crush-claw": {
        strike(e, t, n, r, i, a, o, s, c) {
          let l = t + i * o * 0.25,
            u = r + a * o * 0.25,
            d = e.terrain.height(l, u);
          (e.vfx.norm.spawn({
            x: l,
            y: n + 0.6,
            z: u,
            life: 0.26,
            size: o * 0.75,
            endSize: o * 0.85,
            color: 16777215,
            shape: I.PixClaw,
            rot: c % 2 ? -0.3 : 0.3,
          }),
            e.later(0.08, () => {
              mp(e, l, u, o * 0.75, 16777215, I.PixClaw, 1.4, fp(i, a));
              for (let t = 0; t < 6; t++)
                e.vfx.norm.spawn({
                  x: l,
                  y: d + 0.3,
                  z: u,
                  vx: F.range(-3, 3),
                  vy: F.range(2, 4),
                  vz: F.range(-3, 3),
                  drag: 2,
                  life: 0.6,
                  size: 0.5,
                  endSize: 0.8,
                  color: 16777215,
                  shape: I.PixSand,
                });
              e.shake(0.05, l, u);
            }));
        },
      },
      bulldoze: {
        nova(e, t, n, r, i) {
          for (let a = 0; a < 2; a++)
            e.later(a * 0.12, () =>
              e.vfx.ring(t, n, r, i * (0.7 + a * 0.3), a ? 15255696 : 13148272, 0.4, 0.15, L.Jagged),
            );
          for (let a = 0; a < 14; a++) {
            let o = (a / 14) * z;
            e.vfx.norm.spawn({
              x: t + Math.cos(o) * 1.2,
              y: n + 0.3,
              z: r + Math.sin(o) * 1.2,
              vx: Math.cos(o) * i * 2,
              vy: 1,
              vz: Math.sin(o) * i * 2,
              drag: 3,
              life: 0.55,
              size: 0.7,
              endSize: 1.4,
              color: 15255696,
              shape: I.PixPuff,
            });
          }
          (_p(e, t, n, r, 16777215, 6, i, I.PixSand, 0.5),
            mp(e, t, r, i * 0.9, 16777215, I.PixCrack, 1.2),
            e.shake(0.14));
        },
      },
      toxic: {
        draw(e, t, n, r) {
          let i = Math.sin(e.rot[t] * 3) * 0.1;
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * (1.1 + i), 16777215, I.PixToxic, 0, 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.6, V.poison, I.Soft, 0, 0.2, 0.3 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.35 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: F.range(-0.4, 0.4),
              vy: 0.6,
              vz: F.range(-0.4, 0.4),
              life: 0.4,
              size: 0.18,
              endSize: 0.1,
              color: 16777215,
              shape: I.PixToxic,
            });
        },
        hit(e, t, n, r) {
          (_p(e, t, n, r, 16777215, 5, 3, I.PixToxic, 0.25),
            B(e, t, n + 0.6, r, I.Skull, 12618495, 0.35, 1.2, 0.35, 0, 0.3));
        },
      },
      "double-kick": {
        shape: I.Fist,
        color: 14203112,
        size: 1.2,
        draw(e, t, n, r) {
          (e.pool.push(
            e.x[t],
            e.y[t],
            e.z[t],
            n * 1.15,
            15255807,
            I.PixFist,
            Math.atan2(e.vx[t], e.vz[t]) * 0.1,
            0,
            r,
          ),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.3, 11565784, I.Soft, 0, 0, 0.2 * r));
        },
        trail(e, t, n, r) {
          e.vfx.add.spawn({
            x: t,
            y: n,
            z: r,
            life: 0.14,
            size: 0.45,
            endSize: 0.1,
            color: 14199039,
            shape: I.Soft,
            glow: 0.1,
          });
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Star, 16773312, 0.45, 1.8, 0.16, 0, 0.4),
            vp(e, t, n, r, V.punch, 5, 4, I.Spark, 0.35, 0.25),
            e.shake(0.03, t, r));
        },
      },
      "body-press": {
        nova(e, t, n, r, i) {
          (e.vfx.flash(t, n + 1, r, 16769216, i * 1.2, 0.14),
            mp(e, t, r, i * 1.2, 16777215, I.PixCrack, 1.6),
            e.vfx.ring(t, n, r, i, 11565784, 0.45, 0.15, L.Jagged),
            e.vfx.ring(t, n, r, i * 0.6, V.punch, 0.3),
            e.vfx.dust(t, n, r, 14207144, 18, i * 1.5),
            _p(e, t, n, r, 16777215, 8, i * 1.2, I.PixRock, 0.45),
            e.shake(0.22));
        },
      },
      "sludge-wave": {
        draw(e, t, n, r) {
          let i = Math.sin(e.rot[t] * 2 + e.x[t]) * 0.2;
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.4, 6957706, I.Soft, 0, 0, 0.75 * r),
            e.pool.push(
              e.x[t],
              e.y[t] + 0.6 + i,
              e.z[t],
              n * 0.95,
              16777215,
              I.PixSludge,
              e.rot[t] * 0.3,
              0,
              r,
            ),
            e.pool.push(
              e.x[t] + Math.sin(e.rot[t] * 3) * n * 0.3,
              e.y[t] + 1.2 + i,
              e.z[t],
              n * 0.3,
              16777215,
              I.PixToxic,
              0,
              0,
              r,
            ));
        },
        trail(e, t, n, r) {
          e.vfx.norm.spawn({
            x: t,
            y: n + 1,
            z: r,
            vx: F.range(-1, 1),
            vy: F.range(2, 4),
            vz: F.range(-1, 1),
            gravity: 14,
            life: 0.4,
            size: 0.28,
            endSize: 0.12,
            color: 16777215,
            shape: I.PixToxic,
          });
        },
      },
      thrash: {
        nova(e, t, n, r, i) {
          for (let t = 0; t < 6; t++)
            e.later(t * 0.04, () => {
              let n = e.player.pos,
                r = F.range(0, z),
                a = F.range(0.8, i * 0.8),
                o = n.x + Math.cos(r) * a,
                s = n.z + Math.sin(r) * a;
              (e.vfx.norm.spawn({
                x: o,
                y: n.y + 0.9,
                z: s,
                life: 0.16,
                size: 1.1,
                endSize: 1.3,
                color: t % 2 ? 14201087 : 16777215,
                shape: t % 2 ? I.PixHorn : I.PixFist,
                rot: F.range(-0.6, 0.6),
              }),
                B(e, o, n.y + 1, s, I.Twinkle, V.white, 0.3, 1.3, 0.12));
            });
          (e.vfx.ring(t, n, r, i, 10115784, 0.35, 0.15, L.Flames),
            e.vfx.dust(t, n, r, 14207144, 8, i),
            e.shake(0.08));
        },
      },
      "horn-drill": {
        dash(e, t, n, r, i, a, o) {
          let s = 0.16,
            c = -fp(i, a) + Math.PI * 0.75;
          e.vfx.norm.spawn({
            x: t + i,
            y: n + 1,
            z: r + a,
            vx: (i * o) / s,
            vz: (a * o) / s,
            life: s,
            size: 2,
            endSize: 2.2,
            color: 14199039,
            shape: I.PixHorn,
            rot: c,
            spin: 30,
          });
          for (let c = 0; c < 8; c++) {
            let l = c / 8;
            e.later(l * s, () => {
              let s = t + i * o * l,
                c = r + a * o * l;
              for (let t = 0; t < 2; t++) {
                let t = F.range(0, z);
                dp(e).spawn({
                  x: s,
                  y: n + 1,
                  z: c,
                  vx: Math.cos(t) * 5,
                  vy: F.range(1, 4),
                  vz: Math.sin(t) * 5,
                  gravity: 14,
                  life: 0.3,
                  size: 0.14,
                  endSize: 0.05,
                  color: 16767231,
                  shape: I.Square,
                  glow: 0.3,
                });
              }
              mp(e, s, c, 1.3, 16777215, I.PixCrack, 0.9, fp(i, a));
            });
          }
          let l = t + i * o,
            u = r + a * o;
          e.later(s, () => {
            (B(e, l, n + 1, u, I.Twinkle, V.white, 0.6, 2.6, 0.18),
              _p(e, l, e.terrain.height(l, u), u, 16777215, 6, 4, I.PixRock, 0.35),
              e.shake(0.08, l, u));
          });
        },
      },
      "earth-power": {
        warn(e, t, n, r, i) {
          mp(e, t, r, i * 1.1, 16756848, I.PixCrack, 0.3);
        },
        sky(e, t, n, r, i) {
          mp(e, t, r, i * 1.2, 16777215, I.PixCrack, 1.6);
          for (let a = 0; a < 7; a++) {
            let o = (a / 7) * z + F.range(-0.2, 0.2),
              s = i * F.range(0.2, 0.6);
            e.later(a * 0.02, () =>
              e.vfx.norm.spawn({
                x: t + Math.cos(o) * s,
                y: n + 0.6,
                z: r + Math.sin(o) * s,
                vy: 5,
                drag: 6,
                life: 0.7,
                size: F.range(1.1, 1.6),
                endSize: 1,
                color: 16777215,
                shape: I.PixSpike,
              }),
            );
          }
          (_p(e, t, n, r, 16777215, 8, i * 1.2, I.PixRock, 0.45), e.vfx.dust(t, n, r, 13150328, 10, i * 1.4));
          for (let i = 0; i < 3; i++)
            dp(e).spawn({
              x: t + F.range(-0.5, 0.5),
              y: n + 0.3,
              z: r + F.range(-0.5, 0.5),
              vy: F.range(4, 7),
              gravity: 8,
              life: 0.5,
              size: 0.18,
              endSize: 0.05,
              color: 16752714,
              shape: I.Square,
              glow: 0.3,
            });
          (e.vfx.ring(t, n, r, i, 14198888, 0.35, 0.15, L.Jagged), e.shake(0.1, t, r));
        },
      },
      "draining-kiss": {
        draw(e, t, n, r) {
          (e.pool.push(
            e.x[t],
            e.y[t] + Math.sin(e.rot[t] * 3) * 0.1,
            e.z[t],
            n * 1.1,
            16777215,
            I.PixHeart,
            Math.sin(e.rot[t] * 2) * 0.2,
            0,
            r,
          ),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.4, V.fairy, I.Soft, 0, 0.2, 0.25 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.4 && e.vfx.trail(t, n, r, 16763112, 0.25, I.Twinkle, 0.3);
        },
        hit(e, t, n, r) {
          (B(e, t, n + 0.4, r, I.Heart, 16751312, 0.4, 1.4, 0.25, 0, 0.3),
            pp(e, t, n, r, 16751312, 4, I.Heart));
        },
      },
      "stored-power": {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.05, 16777215, I.PixStar, e.rot[t] * 1.5, 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.5, V.psy, I.Soft, 0, 0.2, 0.3 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.45 &&
            e.vfx.trail(t, n, r, Math.random() < 0.5 ? 16771178 : 16759024, 0.3, I.Twinkle, 0.3);
        },
        hit(e, t, n, r) {
          yp(e, t, n, r, 16777215, 4, 3, I.PixSparkle, 0.35, 0.35);
        },
      },
      gravity: {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.75, 2758720, I.Soft, 0, 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.2, 12618495, I.Swirl, -e.rot[t] * 2, 0.3, 0.7 * r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.5, V.psy, I.Ring, 0, 0.2, 0.4 * r),
            Rp(e, t, n, r, I.PixStar, 16777215, 4, n * 0.75, !1));
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            e.vfx.norm.spawn({
              x: t + F.range(-1.5, 1.5),
              y: n + F.range(-0.5, 1),
              z: r + F.range(-1.5, 1.5),
              vx: 0,
              vy: -2,
              vz: 0,
              life: 0.3,
              size: 0.2,
              endSize: 0.1,
              color: 16777215,
              shape: I.PixSparkle,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          for (let n = 0; n < 3; n++)
            e.later(n * 0.07, () =>
              e.vfx.ring(t, a, r, i * (1 - n * 0.25), n === 1 ? 16759024 : 10115800, 0.4, 0.9, L.Runes),
            );
          mp(e, t, r, i * 1.1, 16777215, I.PixCrack, 1.4);
          for (let n = 0; n < 8; n++) {
            let n = F.range(0, z),
              o = F.range(0.5, i);
            e.vfx.norm.spawn({
              x: t + Math.cos(n) * o,
              y: a + 3,
              z: r + Math.sin(n) * o,
              vy: -16,
              life: 0.18,
              size: 0.5,
              endSize: 0.4,
              color: 16777215,
              shape: I.PixStar,
            });
          }
          e.shake(0.14, t, r);
        },
      },
      "mega-drain": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.5, V.leaf, I.Soft, 0, 0.2, 0.35 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.9, 16777215, I.PixLeaf, e.rot[t] * 2, 0, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.4 && e.vfx.trail(t, n, r, 12120186, 0.25, I.Twinkle, 0.3);
        },
        hit(e, t, n, r) {
          (pp(e, t, n, r, 10157946, 5, I.Twinkle), yp(e, t, n, r, 16777215, 3, 2.5, I.PixLeaf, 0.3, 0.4));
        },
      },
      "poison-powder": {
        cone(e, t, n, r, i, a, o, s, c) {
          if (Math.random() < 0.35) return;
          let l = Math.sqrt(c / 7);
          (e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vx: i * 0.85 + F.range(-1, 1),
            vy: a * 0.3 + F.range(0, 0.8),
            vz: o * 0.85 + F.range(-1, 1),
            drag: 0.9,
            life: s * 1.1,
            size: 0.25,
            endSize: 0.7 * l,
            color: 13144319,
            shape: I.PixSpore,
            spin: 2,
          }),
            Math.random() < 0.15 &&
              e.vfx.norm.spawn({
                x: t + i * s * 0.6,
                y: n,
                z: r + o * s * 0.6,
                vy: 0.4,
                life: 0.7,
                size: 0.5,
                endSize: 1.2 * l,
                color: 11569872,
                shape: I.PixPuff,
                drag: 1.5,
              }));
        },
      },
      "petal-blizzard": {
        nova(e, t, n, r, i) {
          (yp(e, t, n + 0.7, r, 16777215, 22, i * 2.2, I.PixPetal, 0.6, 0.55, i * 1.6),
            yp(e, t, n + 1.2, r, 16777215, 8, i * 1.6, I.PixLeaf, 0.5, 0.5, -i));
          for (let a = 0; a < 2; a++)
            e.later(a * 0.08, () =>
              e.vfx.ring(t, n, r, i * (0.65 + a * 0.35), a ? 8050762 : 16751312, 0.35, 0.15, L.Petals),
            );
          e.shake(0.06);
        },
      },
      "petal-dance": {
        orbit(e, t, n, r, i, a) {
          (e.orbitals.push(t, n, r, a * 1.4, 16777215, I.PixPetal, i * 2 + Math.PI / 2, 0),
            Math.random() < 0.2 &&
              e.vfx.norm.spawn({
                x: t,
                y: n - 0.2,
                z: r,
                vx: F.range(-0.5, 0.5),
                vy: -0.6,
                vz: F.range(-0.5, 0.5),
                life: 0.6,
                size: 0.25,
                endSize: 0.4,
                color: 16771178,
                shape: I.PixSpore,
              }));
        },
      },
      slash: {
        strike(e, t, n, r, i, a, o, s, c) {
          let l = t + i * o * 0.25,
            u = r + a * o * 0.25;
          (e.vfx.norm.spawn({
            x: l,
            y: n + 0.5,
            z: u,
            life: 0.2,
            size: o * 0.7,
            endSize: o * 0.8,
            color: 16769216,
            shape: I.PixClaw,
            rot: c % 2 ? -0.5 : 0.5,
          }),
            e.later(0.06, () => {
              (B(e, l, n + 0.4, u, I.Cross, 16773328, 0.4, o * 0.6, 0.12, 0, 0.4),
                yp(e, l, n + 0.4, u, 16756848, 4, 3, I.PixSpore, 0.3, 0.45));
            }));
        },
      },
      "stun-spore": {
        cone(e, t, n, r, i, a, o, s, c) {
          if (Math.random() < 0.35) return;
          let l = Math.sqrt(c / 7);
          (e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vx: i * 0.85 + F.range(-1, 1),
            vy: a * 0.3 + F.range(0, 0.8),
            vz: o * 0.85 + F.range(-1, 1),
            drag: 0.9,
            life: s * 1.1,
            size: 0.25,
            endSize: 0.7 * l,
            color: 16771178,
            shape: I.PixSpore,
            spin: 2,
          }),
            Math.random() < 0.08 &&
              dp(e).spawn({
                x: t + i * s * 0.5,
                y: n + 0.3,
                z: r + o * s * 0.5,
                life: 0.12,
                size: 0.5,
                endSize: 0.2,
                color: V.volt,
                shape: I.Bolt,
                rot: F.range(0, z),
                glow: 0.3,
              }));
        },
      },
      spore: {
        draw(e, t, n, r) {
          let i = Math.sin(e.rot[t] * 2) * 0.06;
          e.pool.push(e.x[t], e.y[t] - 0.15 + i, e.z[t], n * 0.95, 16777215, I.PixShroom, 0, 0, r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.08 &&
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.3,
              z: r,
              vy: 0.6,
              life: 0.6,
              size: 0.2,
              endSize: 0.35,
              color: 10150132,
              shape: I.PixSpore,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          for (let n = 0; n < 16; n++) {
            let o = F.range(0, z),
              s = F.range(1, i * 1.4);
            e.vfx.norm.spawn({
              x: t,
              y: a + 0.6,
              z: r,
              vx: Math.cos(o) * s,
              vy: F.range(0.5, 2),
              vz: Math.sin(o) * s,
              drag: 1.6,
              life: 1,
              size: 0.3,
              endSize: 0.7,
              color: n % 2 ? 10150132 : 11072708,
              shape: I.PixSpore,
              spin: 2,
            });
          }
          for (let n = 0; n < 3; n++)
            e.vfx.norm.spawn({
              x: t + F.range(-0.6, 0.6),
              y: a + 1,
              z: r + F.range(-0.6, 0.6),
              vy: 1.2,
              life: 0.9,
              size: 0.4,
              endSize: 0.7,
              color: 10148095,
              shape: I.PixSleepZ,
            });
          e.vfx.ring(t, a, r, i, 9097448, 0.35, 0.15, L.Petals);
        },
      },
      "energy-ball": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.6, V.leaf, I.Soft, 0, 0.25, 0.45 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.95, 10149962, I.Soft, 0, 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.1, 14221216, I.Swirl, e.rot[t] * 2, 0.2, 0.6 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.5 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: F.range(-0.6, 0.6),
              vy: F.range(-0.3, 0.6),
              vz: F.range(-0.6, 0.6),
              life: 0.35,
              size: 0.3,
              endSize: 0.1,
              color: 16777215,
              shape: I.PixLeaf,
              spin: 4,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          (e.vfx.flash(t, n, r, V.leaf, i * 0.9, 0.12),
            yp(e, t, n, r, 16777215, 12, i * 2.4, I.PixLeaf, 0.5, 0.5, i),
            e.vfx.ring(t, a, r, i, V.leaf, 0.35, 0.15, L.Petals),
            vp(e, t, n, r, 14221216, 6, i * 1.5, I.Twinkle, 0.45, 0.4));
        },
      },
      supersonic: {
        draw(e, t, n, r) {
          let i = (e.rot[t] * 2) % 1;
          (e.glow.push(
            e.x[t],
            e.y[t],
            e.z[t],
            n * (0.6 + i * 0.9),
            14199039,
            I.Ring,
            0,
            0.2,
            (1 - i) * 0.8 * r,
          ),
            e.glow.push(
              e.x[t],
              e.y[t],
              e.z[t],
              n * 0.45,
              16777215,
              I.Sound,
              -Math.atan2(e.vz[t], e.vx[t]),
              0.2,
              r,
            ));
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            dp(e).spawn({
              x: t,
              y: n,
              z: r,
              life: 0.25,
              size: 0.3,
              endSize: 0.9,
              color: 13148400,
              shape: I.Ring,
              glow: 0.1,
            });
        },
        hit(e, t, n, r) {
          B(e, t, n + 0.7, r, I.Swirl, 15255807, 0.3, 1.1, 0.35, 0, 0.3);
        },
      },
      "u-turn": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.5, 10119896, I.Soft, 0, 0.1, 0.35 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.1, 16777215, I.PixButterfly, e.rot[t] * 3, 0, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.4 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: -0.4,
              life: 0.4,
              size: 0.2,
              endSize: 0.35,
              color: 14203135,
              shape: I.PixSpore,
            });
        },
        hit(e, t, n, r) {
          B(e, t, n, r, I.Star, 15786239, 0.3, 1.3, 0.14, 0, 0.4);
        },
      },
      "silver-wind": {
        cone(e, t, n, r, i, a, o, s, c) {
          let l = Math.sqrt(c / 7);
          (Math.random() < 0.5 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vx: i * 1.1 + F.range(-1, 1),
              vy: a * 0.3 + F.range(-0.3, 0.6),
              vz: o * 1.1 + F.range(-1, 1),
              drag: 1.2,
              life: s,
              size: 0.22,
              endSize: 0.4 * l,
              color: 15265023,
              shape: I.PixSpore,
              spin: 6,
            }),
            Math.random() < 0.25 &&
              dp(e).spawn({
                x: t,
                y: n,
                z: r,
                vx: i * 1.2,
                vy: a * 0.2,
                vz: o * 1.2,
                life: s * 0.8,
                size: 0.35,
                endSize: 0,
                color: 14213375,
                shape: I.Twinkle,
                glow: 0.2,
                spin: 5,
              }));
        },
      },
      "signal-beam": {
        beam(e, t, n, r, i, a, o, s) {
          let c = [16739032, 7002367, 14221162],
            l = c[Math.floor(e.time * 12) % 3];
          (Cp(e, t, n, r, i, a, o, s * 0.8, l, V.white),
            Sp(e, t, n, r, i, a, o, c, s * 1.6, 2),
            Tp(e, t, n, r, i, a, o, l, I.Twinkle, 1, 0.4));
        },
      },
      scratch: {
        strike(e, t, n, r, i, a, o, s, c) {
          let l = t + i * o * 0.25,
            u = r + a * o * 0.25,
            d = e.terrain.height(l, u);
          (e.vfx.norm.spawn({
            x: l,
            y: d + 0.4,
            z: u,
            vy: 6,
            drag: 6,
            life: 0.24,
            size: o * 0.55,
            endSize: o * 0.7,
            color: 16777215,
            shape: I.PixClaw,
            rot: c % 2 ? -0.4 : 0.4,
          }),
            _p(e, l, d, u, 16777215, 4, 3, I.PixRock, 0.3),
            e.vfx.dust(l, d, u, 13150328, 4, 2));
        },
      },
      "mud-shot": {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.05, V.mudDark, I.Soft, 0, 0, r),
            e.pool.push(e.x[t] - 0.08, e.y[t] + 0.08, e.z[t], n * 0.65, V.mud, I.Soft, 0, 0, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.5 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: -1,
              gravity: 10,
              life: 0.3,
              size: 0.22,
              endSize: 0.1,
              color: V.mud,
              shape: I.Drop,
            });
        },
        hit(e, t, n, r) {
          (_p(e, t, n, r, V.mud, 5, 3, I.Drop, 0.3), mp(e, t, r, 1.1, V.mudDark, I.Soft, 1.2, 0));
        },
      },
      "tri-attack": {
        link(e, t, n, r, i, a, o, s, c) {
          let l = c % 3;
          (l === 0
            ? (e.vfx.beams.spawn(t, n, r, i, a, o, 0.22, V.fire, 0.16), Ep(e, i, a, o, 0, 3, 0, 0.4, 0.9))
            : l === 1
              ? (e.vfx.beams.spawn(t, n, r, i, a, o, 0.22, V.ice, 0.16),
                e.vfx.norm.spawn({
                  x: i,
                  y: a + 0.3,
                  z: o,
                  life: 0.35,
                  size: 0.6,
                  endSize: 0.9,
                  color: 16777215,
                  shape: I.PixSnow,
                  spin: 3,
                }))
              : (e.vfx.lightning(t, n, r, i, a, o, V.volt, 0.35, 6, 0.2),
                B(e, i, a, o, I.Bolt, V.volt, 1.2, 0.5, 0.18, 0, 0.5)),
            B(e, i, a, o, I.Twinkle, V.white, 0.3, 1.2, 0.12, 0, 0.3));
        },
      },
      fissure: {
        draw(e, t, n, r) {
          let i = e.y[t] - 0.9;
          (e.pool.push(
            e.x[t],
            i + 0.2,
            e.z[t],
            n * 0.9,
            16777215,
            I.PixSpike,
            Math.sin(e.rot[t] * 6) * 0.2,
            0,
            r,
          ),
            e.glow.push(e.x[t], i, e.z[t], n * 1.2, 16752714, I.Soft, 0, 0, 0.2 * r));
        },
        trail(e, t, n, r) {
          let i = e.terrain.height(t, r);
          (Math.random() < 0.5 && mp(e, t, r, 2, 16777215, I.PixCrack, 1.6),
            Math.random() < 0.3 && _p(e, t, i, r, 16777215, 2, 2, I.PixRock, 0.35),
            Math.random() < 0.3 && e.vfx.dust(t, i, r, 13150328, 2, 2));
        },
      },
      "pay-day": {
        draw(e, t, n, r) {
          let i = Math.floor(e.rot[t] * 6) % 4,
            a = i === 0 ? I.PixCoin : i === 2 ? I.PixCoinEdge : I.PixCoinMid;
          e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.05, 16777215, a, 0, 0, r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            dp(e).spawn({
              x: t,
              y: n,
              z: r,
              life: 0.2,
              size: 0.25,
              endSize: 0,
              color: 16771178,
              shape: I.Twinkle,
              glow: 0.2,
            });
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Twinkle, 16773280, 0.3, 1.1, 0.12, 0, 0.4),
            _p(e, t, n, r, 16777215, 2, 2.5, I.PixCoin, 0.3));
        },
      },
      "fake-out": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.2,
            c = r + a * o * 0.2;
          for (let t of [-1, 1])
            e.vfx.norm.spawn({
              x: s - a * t * 1.1,
              y: n + 0.7,
              z: c + i * t * 1.1,
              vx: a * t * 9,
              vz: -i * t * 9,
              life: 0.12,
              size: o * 0.35,
              endSize: o * 0.35,
              color: 16773336,
              shape: I.PixFist,
              rot: t > 0 ? 0.3 : -0.3,
            });
          e.later(0.12, () => {
            (B(e, s, n + 0.8, c, I.Star, 16773792, 0.4, o * 0.75, 0.2, 0, 0.5),
              vp(e, s, n + 0.8, c, 16771232, 6, 5, I.Spark, 0.35, 0.25),
              e.shake(0.04, s, c));
          });
        },
      },
      assurance: {
        dash(e, t, n, r, i, a, o) {
          Tp(e, t, n + 0.8, r, t + i * o, n + 0.8, r + a * o, 6967368, I.Soft, 5, 0.5);
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => {
            let t = e.terrain.height(s, c);
            (e.vfx.norm.spawn({
              x: s,
              y: t + 1,
              z: c,
              life: 0.22,
              size: 2,
              endSize: 2.3,
              color: 15259903,
              shape: I.PixClaw,
              rot: -0.4,
            }),
              mp(e, s, c, 1.8, 16777215, I.PixClaw, 1, fp(i, a)),
              vp(e, s, t + 0.8, c, V.dark, 5, 4, I.Spark, 0.35, 0.25));
          });
        },
      },
      "play-rough": {
        nova(e, t, n, r, i) {
          for (let t = 0; t < 6; t++)
            e.later(t * 0.03, () => {
              let n = e.player.pos,
                r = F.range(0, z),
                a = F.range(0.6, i * 0.7);
              (e.vfx.norm.spawn({
                x: n.x + Math.cos(r) * a,
                y: n.y + 0.8,
                z: n.z + Math.sin(r) * a,
                vy: 1.5,
                drag: 2,
                life: 0.4,
                size: 1.1,
                endSize: 1.8,
                color: 15786224,
                shape: I.PixPuff,
              }),
                B(
                  e,
                  n.x + Math.cos(r) * a,
                  n.y + 1.1,
                  n.z + Math.sin(r) * a,
                  t % 2 ? I.Star : I.Heart,
                  t % 2 ? 16773280 : 16752856,
                  0.3,
                  1,
                  0.2,
                  0,
                  0.3,
                ));
            });
          (e.vfx.ring(t, n, r, i, V.fairy, 0.3, 0.15, L.Petals), e.shake(0.05));
        },
      },
      soak: {
        cone(e, t, n, r, i, a, o, s, c) {
          if (Math.random() < 0.3) return;
          let l = Math.sqrt(c / 7);
          (e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vx: i * 1.05 + F.range(-1, 1),
            vy: a * 0.5 + 1.5,
            vz: o * 1.05 + F.range(-1, 1),
            gravity: 6,
            life: s,
            size: 0.35,
            endSize: 0.5 * l,
            color: 16777215,
            shape: I.PixDrop,
          }),
            Math.random() < 0.1 &&
              e.vfx.norm.spawn({
                x: t + i * s,
                y: n,
                z: r + o * s,
                vy: 0.4,
                life: 0.5,
                size: 0.3,
                endSize: 0.5,
                color: 16777215,
                shape: I.PixBubble,
              }));
        },
      },
      "zen-headbutt": {
        dash(e, t, n, r, i, a, o) {
          for (let s = 0; s < 5; s++) {
            let c = s / 5;
            e.later(c * 0.12, () =>
              e.vfx.ring(
                t + i * o * c,
                n + 0.9,
                r + a * o * c,
                1.2,
                s % 2 ? V.psy : 6994175,
                0.2,
                0.25,
                L.Runes,
              ),
            );
          }
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => {
            (B(e, s, n + 1, c, I.Star, 16763120, 0.5, 2.4, 0.2, 0, 0.5),
              vp(e, s, n + 1, c, V.psy, 6, 5, I.Twinkle, 0.4, 0.3),
              e.shake(0.06, s, c));
          });
        },
      },
      "aqua-tail": {
        strike(e, t, n, r, i, a, o) {
          let s = t + i * o * 0.3,
            c = r + a * o * 0.3;
          e.vfx.norm.spawn({
            x: s,
            y: n + 0.6,
            z: c,
            life: 0.24,
            size: o * 0.7,
            endSize: o * 0.85,
            color: 16777215,
            shape: I.PixWave,
            rot: F.range(-0.2, 0.2),
          });
          for (let t = 0; t < 6; t++)
            e.vfx.norm.spawn({
              x: s,
              y: n + 0.8,
              z: c,
              vx: i * 4 + F.range(-3, 3),
              vy: F.range(3, 6),
              vz: a * 4 + F.range(-3, 3),
              gravity: 16,
              life: 0.5,
              size: 0.35,
              endSize: 0.2,
              color: 16777215,
              shape: I.PixDrop,
            });
          e.later(0.07, () => Np(e, s, n, c, Math.min(1.6, o * 0.35), 0.8));
        },
      },
      psyshock: {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.5, V.psy, I.Soft, 0, 0.2, 0.4 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 0.85, 16763120, I.Gem, e.rot[t] * 2, 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.2, 6994175, I.Ring, 0, 0.1, 0.5 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.4 && e.vfx.trail(t, n, r, 16751328, 0.3, I.Twinkle, 0.3);
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          (_p(e, t, n, r, 16763120, 10, i * 1.6, I.Shard, 0.4),
            e.vfx.ring(t, a, r, i, V.psy, 0.35, 0.15, L.Runes),
            e.vfx.flash(t, n, r, V.psy, i * 0.8, 0.1));
        },
      },
      "seismic-toss": {
        warn(e, t, n, r, i) {
          e.vfx.norm.spawn({
            x: t,
            y: n + 1,
            z: r,
            vy: 9,
            gravity: -18,
            life: 0.3,
            size: i * 0.5,
            endSize: i * 0.4,
            color: 16777215,
            shape: I.PixPuff,
          });
        },
        sky(e, t, n, r, i) {
          (e.vfx.norm.spawn({
            x: t,
            y: n + 3,
            z: r,
            vy: -20,
            life: 0.12,
            size: i * 0.7,
            endSize: i * 0.8,
            color: 16767152,
            shape: I.PixFist,
          }),
            e.later(0.12, () => {
              (mp(e, t, r, i * 1.2, 16777215, I.PixCrack, 1.2),
                e.vfx.ring(t, n, r, i, V.punch, 0.35, 0.15, L.Jagged),
                e.vfx.dust(t, n, r, 14207144, 10, i * 1.4),
                B(e, t, n + 0.8, r, I.Star, 16773280, 0.6, i, 0.2, 0, 0.4),
                e.shake(0.1, t, r));
            }));
        },
      },
      "rage-fist": {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.6, 16734778, I.Soft, 0, 0.1, 0.35 * r),
            e.pool.push(
              e.x[t],
              e.y[t],
              e.z[t],
              n * 1.15,
              16761e3,
              I.PixFist,
              Math.atan2(e.vx[t], e.vz[t]) * 0.1,
              0,
              r,
            ));
        },
        trail(e, t, n, r) {
          e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            vy: 1.2,
            life: 0.3,
            size: 0.4,
            endSize: 0.1,
            color: 16777215,
            endColor: 16743002,
            shape: I.PixDragonFire,
          });
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Star, 16765088, 0.45, 1.8, 0.16, 0, 0.4),
            vp(e, t, n, r, 16742986, 5, 4, I.Spark, 0.35, 0.25),
            e.shake(0.03, t, r));
        },
      },
      "stomping-tantrum": {
        nova(e, t, n, r, i) {
          for (let t = 0; t < 3; t++)
            e.later(t * 0.09, () => {
              let n = e.player.pos,
                r = F.range(0, z);
              (mp(
                e,
                n.x + Math.cos(r) * 0.8,
                n.z + Math.sin(r) * 0.8,
                i * (0.4 + t * 0.2),
                16777215,
                I.PixCrack,
                1.2,
              ),
                e.vfx.ring(
                  n.x,
                  n.y,
                  n.z,
                  i * (0.5 + t * 0.25),
                  t === 2 ? 14203e3 : 13146730,
                  0.3,
                  0.15,
                  L.Jagged,
                ),
                e.vfx.dust(n.x, n.y, n.z, 14207144, 6, i));
            });
          e.shake(0.12);
        },
      },
      "final-gambit": {
        warn(e, t, n, r, i, a, o) {
          (zp(e, t, n, r, o, 16765104, I.PixFist, i * 0.7, 22, 5), e.vfx.telegraph(t, n, r, i, 16742986, o));
        },
        sky(e, t, n, r, i) {
          (Hp(e, t, n, r, 2.2, 16742986, 16773328), e.vfx.flash(t, n + 1, r, 16756848, i * 1.2, 0.16));
          for (let a = 0; a < 3; a++)
            e.later(a * 0.07, () =>
              e.vfx.ring(t, n, r, i * (0.6 + a * 0.25), a === 1 ? 16773312 : 16742986, 0.4, 0.15, L.Jagged),
            );
          (mp(e, t, r, i * 1.4, 16777215, I.PixCrack, 1.8),
            _p(e, t, n, r, 16777215, 10, i * 1.4, I.PixRock, 0.45),
            e.shake(0.3, t, r));
        },
      },
      "bubble-beam": {
        draw(e, t, n, r) {
          e.pool.push(
            e.x[t],
            e.y[t] + Math.sin(e.rot[t] * 4) * 0.08,
            e.z[t],
            n * 1.05,
            16777215,
            I.PixBubble,
            0,
            0,
            r,
          );
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: 0.6,
              life: 0.4,
              size: 0.18,
              endSize: 0.25,
              color: 16777215,
              shape: I.PixBubble,
            });
        },
        hit(e, t, n, r) {
          (e.vfx.norm.spawn({
            x: t,
            y: n,
            z: r,
            life: 0.16,
            size: 0.4,
            endSize: 1.1,
            color: 16777215,
            shape: I.PixSplash,
            rot: 0,
          }),
            yp(e, t, n, r, 16777215, 4, 2.5, I.PixDrop, 0.25, 0.35),
            Ap(e, t, n, r, 0.6, 0.25));
        },
      },
      hypnosis: {
        draw(e, t, n, r) {
          (e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.5, 9075455, I.Soft, 0, 0.1, 0.3 * r),
            e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.05, 16777215, I.PixSpiral, -e.rot[t] * 5, 0, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            dp(e).spawn({
              x: t,
              y: n,
              z: r,
              life: 0.3,
              size: 0.25,
              endSize: 0.7,
              color: 12101887,
              shape: I.Ring,
              glow: 0.1,
            });
        },
        hit(e, t, n, r) {
          e.vfx.norm.spawn({
            x: t,
            y: n + 0.8,
            z: r,
            vy: 1.2,
            life: 0.8,
            size: 0.4,
            endSize: 0.7,
            color: 10148095,
            shape: I.PixSleepZ,
          });
        },
      },
      "circle-throw": {
        nova(e, t, n, r, i) {
          for (let t = 0; t < 8; t++)
            e.later(t * 0.025, () => {
              let n = e.player.pos,
                r = (t / 8) * z,
                a = n.x + Math.cos(r) * i * 0.75,
                o = n.z + Math.sin(r) * i * 0.75;
              (e.vfx.norm.spawn({
                x: a,
                y: n.y + 0.8,
                z: o,
                vx: -Math.sin(r) * 6,
                vz: Math.cos(r) * 6,
                life: 0.12,
                size: 1,
                endSize: 1,
                color: 15790335,
                shape: I.PixFist,
                rot: r,
              }),
                e.vfx.dust(a, n.y, o, 14209216, 2, 2));
            });
          e.vfx.ring(t, n, r, i, 6982360, 0.35, 0.2, L.Ripple);
        },
      },
      submission: {
        dash(e, t, n, r, i, a, o) {
          for (let s = 0; s < 8; s++) {
            let c = s / 8;
            e.later(c * 0.12, () =>
              e.vfx.norm.spawn({
                x: t + i * o * c,
                y: n + 0.8,
                z: r + a * o * c,
                vx: F.range(-2, 2),
                vy: F.range(2, 4),
                vz: F.range(-2, 2),
                gravity: 14,
                life: 0.4,
                size: 0.4,
                endSize: 0.2,
                color: 16777215,
                shape: I.PixDrop,
              }),
            );
          }
          let s = t + i * o,
            c = r + a * o;
          e.later(0.13, () => {
            let t = e.terrain.height(s, c);
            (B(e, s, t + 1, c, I.Star, 16773312, 0.6, 2.6, 0.2, 0, 0.4),
              e.vfx.ring(s, t, c, 2.6, 4885208, 0.35, 0.15, L.Ripple),
              mp(e, s, c, 2.2, 16777215, I.PixCrack, 1.1),
              e.shake(0.1, s, c));
          });
        },
      },
      slam: {
        strike(e, t, n, r, i, a, o) {
          let s = e.player.pos,
            c = t + i * o * 0.3,
            l = r + a * o * 0.3;
          (xp(
            e,
            s.x,
            s.y + 1,
            s.z,
            c,
            e.terrain.height(c, l) + 0.2,
            l,
            F.range(-1.5, 1.5),
            0.2,
            V.leafDark,
            0.16,
          ),
            e.later(0.08, () => {
              (B(e, c, n + 0.3, l, I.Star, 14221232, 0.4, o * 0.6, 0.16, 0, 0.4),
                mp(e, c, l, o * 0.45, 16777215, I.PixCrack, 1, fp(i, a)),
                yp(e, c, n + 0.3, l, 16777215, 3, 2, I.PixLeaf, 0.3, 0.4));
            }));
        },
      },
      "gastro-acid": {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.1, 14217306, I.PixToxic, 0, 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.3, 12116042, I.Soft, 0, 0, 0.2 * r));
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
              color: 14741616,
              shape: I.PixToxic,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          e.vfx.groundN.spawn({
            x: t,
            y: a + 0.09,
            z: r,
            life: 2,
            size: i * 1.5,
            endSize: i * 1.6,
            color: 9084970,
            shape: I.PixSludge,
            rot: F.range(0, z),
          });
          for (let n = 0; n < 10; n++) {
            let n = F.range(0, z),
              o = F.range(2, i * 2);
            e.vfx.norm.spawn({
              x: t,
              y: a + 0.5,
              z: r,
              vx: Math.cos(n) * o,
              vy: F.range(4, 7),
              vz: Math.sin(n) * o,
              gravity: 22,
              life: 0.6,
              size: 0.35,
              endSize: 0.2,
              color: 14741616,
              shape: I.PixToxic,
            });
          }
          for (let n = 0; n < 4; n++)
            e.later(0.15 + n * 0.15, () =>
              e.vfx.norm.spawn({
                x: t + F.range(-i, i) * 0.5,
                y: a + 0.3,
                z: r + F.range(-i, i) * 0.5,
                vy: 1.2,
                life: 0.6,
                size: 0.3,
                endSize: 0.5,
                color: 14741616,
                shape: I.PixToxic,
              }),
            );
          e.vfx.ring(t, a, r, i, 12111946, 0.35);
        },
      },
      "knock-off": {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.25, 16777215, I.PixLeaf, e.rot[t] * 4, 0, r),
            e.glow.push(e.x[t], e.y[t], e.z[t], n * 1.4, V.leafDark, I.Soft, 0, 0, 0.2 * r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.3 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              life: 0.2,
              size: 0.4,
              endSize: 0.2,
              color: 16777215,
              shape: I.PixLeaf,
              rot: F.range(0, z),
            });
        },
        hit(e, t, n, r) {
          (B(e, t, n, r, I.Star, 14221232, 0.35, 1.5, 0.14, 0, 0.4),
            vp(e, t, n, r, V.dark, 4, 3, I.Spark, 0.3, 0.25));
        },
      },
      "power-whip": {
        nova(e, t, n, r, i) {
          for (let t = 0; t < 2; t++)
            e.later(t * 0.1, () => {
              let n = e.player.pos,
                r = F.range(0, z);
              for (let a = 0; a < 4; a++) {
                let o = r + (a / 4) * z,
                  s = n.x + Math.cos(o) * i,
                  c = n.z + Math.sin(o) * i;
                xp(
                  e,
                  n.x,
                  n.y + 1,
                  n.z,
                  s,
                  e.terrain.height(s, c) + 0.3,
                  c,
                  (t ? 1 : -1) * i * 0.35,
                  0.26,
                  a % 2 ? V.leafDark : V.leaf,
                  0.18,
                );
              }
            });
          (e.vfx.ring(t, n, r, i, V.leaf, 0.35, 0.15, L.Petals),
            yp(e, t, n + 0.8, r, 16777215, 10, i * 2, I.PixLeaf, 0.45, 0.45, i),
            e.shake(0.08));
        },
      },
      brine: {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.05, 16777215, I.PixWaterBall, 0, 0, r),
            e.pool.push(e.x[t], e.y[t] + n * 0.2, e.z[t], n * 0.45, 16777215, I.PixFoam, 0, 0, r));
        },
        trail(e, t, n, r) {
          Math.random() < 0.5 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: -0.5,
              gravity: 6,
              life: 0.3,
              size: 0.2,
              endSize: 0.1,
              color: 16777215,
              shape: I.PixDrop,
              rot: 0,
            });
        },
        boom(e, t, n, r, i) {
          let a = e.terrain.height(t, r);
          Np(e, t, n, r, i * 0.75, 1);
          for (let n = 0; n < 8; n++) {
            let n = F.range(0, z),
              o = F.range(2, i * 2);
            e.vfx.norm.spawn({
              x: t,
              y: a + 0.5,
              z: r,
              vx: Math.cos(n) * o,
              vy: F.range(4, 8),
              vz: Math.sin(n) * o,
              gravity: 20,
              life: 0.55,
              size: 0.35,
              endSize: 0.2,
              color: 16777215,
              shape: I.PixSand,
            });
          }
        },
      },
      "acid-spray": {
        draw(e, t, n, r) {
          e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.05, 16777215, I.PixToxic, 0, 0, r);
        },
        trail(e, t, n, r) {
          Math.random() < 0.5 &&
            e.vfx.norm.spawn({
              x: t,
              y: n,
              z: r,
              vy: -1,
              gravity: 10,
              life: 0.3,
              size: 0.2,
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
            color: 6957706,
            shape: I.PixSludge,
            rot: F.range(0, z),
          });
          for (let n = 0; n < 10; n++) {
            let n = F.range(0, z),
              o = F.range(2, i * 2);
            e.vfx.norm.spawn({
              x: t,
              y: a + 0.5,
              z: r,
              vx: Math.cos(n) * o,
              vy: F.range(4, 7),
              vz: Math.sin(n) * o,
              gravity: 22,
              life: 0.55,
              size: 0.3,
              endSize: 0.18,
              color: 16777215,
              shape: I.PixToxic,
            });
          }
          e.vfx.ring(t, a, r, i, V.poison, 0.3);
        },
      },
      venoshock: {
        link(e, t, n, r, i, a, o, s, c) {
          (xp(e, t, n, r, i, a, o, (c % 2 ? 1 : -1) * 0.8, 0.18, c % 2 ? 8046824 : 11553504, 0.18),
            e.vfx.norm.spawn({
              x: i,
              y: a,
              z: o,
              life: 0.25,
              size: 0.6,
              endSize: 1.1,
              color: 16777215,
              shape: I.PixToxic,
            }),
            _p(e, i, a, o, 16777215, 3, 2, I.PixToxic, 0.22));
        },
      },
      whirlpool: {
        draw(e, t, n, r) {
          (e.pool.push(e.x[t], e.y[t], e.z[t], n * 1.3, 16777215, I.PixWaterSwirl, e.rot[t] * 5, 0, 0.9 * r),
            Rp(e, t, n, r, I.PixDrop, 16777215, 6, n * 0.75, !1),
            e.pool.push(e.x[t], e.y[t] + n * 0.5, e.z[t], n * 0.55, 16777215, I.PixFoam, 0, 0, r));
        },
        trail(e, t, n, r) {
          (Math.random() < 0.4 &&
            e.vfx.norm.spawn({
              x: t + F.range(-1, 1),
              y: n - 0.3,
              z: r + F.range(-1, 1),
              vy: 2,
              gravity: 8,
              life: 0.4,
              size: 0.3,
              endSize: 0.15,
              color: 16777215,
              shape: I.PixDrop,
              rot: 0,
            }),
            Math.random() < 0.15 && Ap(e, t, n - 0.4, r, 0.8, 0.35));
        },
        boom(e, t, n, r, i) {
          (e.vfx.groundN.spawn({
            x: t,
            y: e.terrain.height(t, r) + 0.09,
            z: r,
            life: 0.7,
            size: i * 1.6,
            endSize: i * 2.2,
            color: 16777215,
            shape: I.PixWaterSwirl,
            rot: F.range(0, z),
            spin: 9,
          }),
            Np(e, t, n, r, i * 0.6, 1.1),
            Pp(e, t, n, r, i, 0.45));
        },
      },
    };
  function Hp(e, t, n, r, i, a, o) {
    (e.vfx.beams.spawn(t, n + 24, r, t, n, r, i * 0.9, a, 0.3, 0.7),
      e.vfx.beams.spawn(t, n + 24, r, t, n, r, i * 0.35, wp(a, o, 0.5), 0.25, 0.85));
  }
  (Object.assign(Vp, Vf, Gf, ep, ap, up), (Vp[`giga-drain`] ??= Vp.absorb));
  installStylizedMoveVFX(Vp,key=>k.movesByKey.get(key)?.type);
  var Up = [{}],
    Wp = new Map(),
    Gp = [``];
  for (let [e, t] of Object.entries(Vp)) {
    let n = Up.indexOf(t);
    (n < 0 && ((n = Up.length), Up.push(t), Gp.push(e)), Wp.set(e, n));
  }
  function Kp(e) {
    return Wp.get(e) ?? 0;
  }
  function qp(e) {
    return Up[e] ?? Up[0];
  }
  function Jp(e) {
    return Gp[e] ?? ``;
  }
  return {Ep, Op, zp, mp, z, Rp, V, Dp, Hp, dp, yp, vp, B, _p, Cp, Sp, Tp, fp, bp, Np, Ap, Mp, kp, Jp, qp, Kp, gp, Fp, jp};
}
