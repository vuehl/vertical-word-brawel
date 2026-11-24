import {formCopy, moveCopy} from '../data/form-copy.js';
import {ENEMY_DANGER_COLOR} from './enemy-telegraphs.js';
import {finalBossSpecies} from '../data/character-rules.js';
import {FOREST_COMBAT_ZONES, SINGLE_STAGE} from '../data/lite-rules.js';
import {ENEMY_HEALTH_SCALE} from '../performance/spawn-budget.js';
import {chineseText as c} from '../data/chinese-text.js';
import {Dn as T, Rr as Je} from '../data/config.js';
import {E as yr, I as Cr, K as Tr, ct as Kr, w as Ei} from '../vendor/three-DmSYIDKK.js';

const ZONE_BOSS_HEALTH_MULTIPLIER = 5;
const NORMAL_MULTI_GUARDIAN_HP = [45_000, 100_000];

export function createBossEncounters({k, F, Ni, I, Gs, em, am, R, bu, Bv, Av, Vv, Ol}) {
  var Kv = [0.66, 0.33],
    qv = 0.08,
    Jv = (e) => T.wound[e.tier] ?? 4,
    Yv = 0.5,
    Xv = (e, t) => ({ floor: t >= 0.3 ? t : t * (T.strike[e.tier] ?? 1), evade: Yv }),
    Zv = [1, 1.12, 1.3],
    Qv = class {
      run;
      i;
      phase = 1;
      immune = 0;
      dead = !1;
      phaseT = 0;
      barrierT = 0;
      barrierPopT = 0;
      barrierRate = 1;
      name;
      species;
      phaseColor = `#7aff8a`;
      cd = 2.6;
      lock = 0;
      band = [9, 15];
      speed = 4.5;
      last = ``;
      orbit = 1;
      orbitT = 3;
      hx = 0;
      hz = 0;
      constructor(e, t) {
        ((this.run = e),
          (this.i = t),
          (this.species = e.enemies.species[t]),
          (this.name = k.get(this.species).name),
          e.sanctuary || ((this.hx = e.enemies.x[t]), (this.hz = e.enemies.z[t] - 8)));
      }
      get E() {
        return this.run.enemies;
      }
      get type() {
        return this.E.typesOf(this.i)[0];
      }
      get bx() {
        return this.E.x[this.i];
      }
      get by() {
        return this.E.y[this.i];
      }
      get bz() {
        return this.E.z[this.i];
      }
      get attackTarget(){return this.run.boss.roomAim??this.run.player.pos;}
      get attackRandom(){return this.run.boss.attackRandom??F;}
      get hpFrac() {
        return this.E.hp[this.i] / this.E.maxHp[this.i];
      }
      steer(e) {
        if (this.lock > 0 || this.immune > 0) return { x: 0, z: 0, speed: 0 };
        let t = this.run.coop?.focus(this.bx, this.bz) ?? this.run.player.pos,
          n = t.x - this.bx,
          r = t.z - this.bz,
          i = Math.hypot(n, r) || 1;
        ((n /= i),
          (r /= i),
          (this.orbitT -= e),
          this.orbitT <= 0 && ((this.orbitT = F.range(2.5, 5)), (this.orbit = F.chance(0.5) ? 1 : -1)));
        let [a, o] = this.band,
          s = i > o ? 1 : i < a ? -0.8 : 0,
          c = n * s + -r * this.orbit * 0.7,
          l = r * s + n * this.orbit * 0.7,
          u = Math.hypot(c, l) || 1;
        return { x: c / u, z: l / u, speed: this.speed * (this.phase === 3 ? 1.15 : 1) };
      }
      idle(e) {
        ((this.immune = Math.max(0, this.immune - e)), (this.lock -= e), this.tickBarrier(e));
      }
      update(e) {
        ((this.immune = Math.max(0, this.immune - e)),
          (this.lock -= e),
          this.tickBarrier(e),
          this.tick(e),
          !this.run.coop?.monsters && !(this.immune > 0) &&
            ((this.cd -= e * Zv[this.phase - 1]),
            this.cd <= 0 &&
              this.lock <= 0 &&
              (this.cd = this.run.coop && !this.run.coop.bossEngages(this.i) ? 0.5 : this.attack())));
      }
      tickBarrier(e) {
        (this.immune <= 0 && (this.phaseT += e * this.barrierRate),
          (this.barrierT = Math.max(0, this.barrierT - e)),
          (this.barrierPopT -= e));
      }
      clampHp() {
        let e = this.E,
          t = this.i,
          n = e.maxHp[t],
          r = this.phase === 1 ? 1 : Kv[this.phase - 2],
          i = this.phase >= 3 ? 0 : Kv[this.phase - 1],
          a = n * (r - (r - i) * Math.min(1, this.phaseT / 18));
        if (e.hp[t] < a && a > n * i && ((e.hp[t] = a), (this.barrierT = 0.25), this.barrierPopT <= 0)) {
          this.barrierPopT = 1.6;
          let n = this.run;
          (n.ui.popup(this.bx, this.by + e.hgt[t] + 1.2, this.bz, c(`¡Barrera!`), `#9ad8ff`, 0.9),
            n.vfx.ring(this.bx, this.by, this.bz, 3.5, 10148095, 0.35));
        }
        if (this.phase >= 3) return;
        let o = n * Kv[this.phase - 1];
        e.hp[t] <= o && ((e.hp[t] = o), this.enterPhase(this.phase + 1));
      }
      enterPhase(e) {
        let t = this.run,
          n = this.E,
          r = this.i;
        ((this.phase = e),
          (this.phaseT = 0),
          (this.immune = 2.6),
          (this.lock = 2.6),
          (this.cd = 1.2),
          (n.vx[r] = n.vz[r] = n.kx[r] = n.kz[r] = 0),
          (n.flash[r] = 1),
          (n.atkAnim[r] = 0.6));
        let i = Ni[this.type];
        (t.hitstop(0.25),
          t.shake(0.7),
          t.cry(this.species),
          t.audio.bossStart(),
          t.vfx.ring(this.bx, this.by, this.bz, 12, i, 0.7),
          t.vfx.ring(this.bx, this.by, this.bz, 20, 16777215, 0.9),
          t.vfx.burst(this.bx, this.by + 1.5, this.bz, i, 40, 12, I.Star, 0.6, 0.8));
        for (let e of n.within(this.bx, this.bz, 10))
          if (e !== r) {
            let t = n.x[e] - this.bx,
              r = n.z[e] - this.bz,
              i = Math.hypot(t, r) || 1;
            ((n.kx[e] += (t / i) * 30), (n.kz[e] += (r / i) * 30));
          }
        (t.ui.banner(
          c(`Fase {p}: {name}`, { p: e, name: this.phaseNames[e - 1] }),
          t.sanctuary?.phaseSub(e) ?? ``,
          this.phaseColor,
          { species: this.species },
        ),
          t.sanctuary?.onPhase(e),
          this.onPhase(e));
      }
      hitMul() {
        return 1;
      }
      tick(e) {}
      onPhase(e) {}
      render() {}
      pick(e) {
        let t = e.filter((e) => e !== this.last);
        return ((this.last = F.pick(t.length ? t : e)), this.last);
      }
      hurt(e, t = 0, n = this.type) {
        if (this.dead) return;
        let r = this.run.player,
          i = t >= 0.3,
          a = t < 0 ? 0 : Math.max(t, qv);
        r.hurt(
          this.E.dmg[this.i] * e * this.run.diff.enemyDamage,
          n,
          -1,
          NaN,
          NaN,
          !1,
          i ? 0.6 : 0.34,
          this.i,
          a ? Xv(this.run, a) : {},
        ) &&
          t >= 0 &&
          r.wound(Jv(this.run));
      }
      groundY(e, t) {
        return this.run.terrain.height(e, t);
      }
      playerLow(e, t = 2.2) {
        return this.run.player.pos.y - e < t;
      }
      circle(e, t, n, r, i, a, o, s) {
        let c = this.run,
          l = this.groundY(e, t);
        (c.vfx.enemyCircle(e, l, t, n, a, r),
          c.later(r, () => {
            (c.vfx.burst(e, l + 0.5, t, a, 20, 8, o, 0.75, 0.6),
              c.vfx.ring(e, l, t, n, ENEMY_DANGER_COLOR, 0.4, 0.15, 0),
              c.vfx.flash(e, l + 0.8, t, a, n * 1.2, 0.15),
              c.shake(0.15, e, t),
              c.audio.boom(0.6),
              c.sanctuary?.blast(e, t, n, 25));
            let r = c.player.pos;
            ((r.x - e) ** 2 + (r.z - t) ** 2 < n * n && this.playerLow(l) && this.hurt(i), s?.());
          }));
      }
      line(e, t, n, r, i, a, o, s, c = !0, l = I.Leaf) {
        let u = this.run,
          d = u.sanctuary,
          f = this.groundY(e, t) + 1,
          p = d && c ? d.firstBlock(e, f, t, n, this.groundY(n, r) + 1, r) : 1,
          m = e + (n - e) * p,
          h = t + (r - t) * p,
          g = Math.hypot(m - e, h - t);
        u.vfx.enemyLine(e, t, m, h, i, s, a);
        u.later(a, () => {
          (u.vfx.beams.spawn(e, f, t, m, this.groundY(m, h) + 1, h, i * 1.4, s, 0.3),
            u.vfx.beams.spawn(e, f, t, m, this.groundY(m, h) + 1, h, i * 0.5, 16777215, 0.25));
          for (let n = 0; n <= g; n += 2)
            u.vfx.burst(e + ((m - e) * n) / (g || 1), f, t + ((h - t) * n) / (g || 1), s, 2, 4, l, 0.5, 0.4);
          u.audio.slash(this.type);
          let n = u.player.pos,
            r = m - e,
            a = h - t,
            c = r * r + a * a || 1,
            d = Gs(((n.x - e) * r + (n.z - t) * a) / c, 0, 1),
            p = Math.hypot(e + r * d - n.x, t + a * d - n.z);
          o > 0 && p < i + u.player.radius && this.playerLow(this.groundY(n.x, n.z), 1.3) && this.hurt(o);
        });
      }
      shot(e, t, n, r, i = {}) {
        if (this.dead) return;
        let a = this.run.projectiles.fromBody(this.i, e, t);
        this.run.projectiles.fire({
          x: this.bx,
          y: a.y,
          z: this.bz,
          dx: e,
          dy: i.dy ?? a.dy,
          dz: t,
          speed: n,
          life: i.life ?? 4,
          radius: 0.55 * (i.size ?? 1),
          dmg: this.E.dmg[this.i] * r,
          type: i.type ?? this.type,
          cls: `special`,
          flags: em.Hostile | em.Capped | (i.homing ? em.Homing : 0),
          from: this.i,
          size: 1.1 * (i.size ?? 1),
          shape: i.shape ?? I.Leaf,
          color: i.color,
        });
      }
      ringShots(e, t, n, r = 0, i = {}) {
        for (let a = 0; a < e; a++) {
          let o = (a / e) * Math.PI * 2 + r;
          this.shot(Math.cos(o), Math.sin(o), t, n, i);
        }
        (this.run.vfx.ring(this.bx, this.by, this.bz, 5, i.color ?? Ni[this.type], 0.4),
          this.run.audio.shot(this.type, 0.8));
      }
      aimAt(e, t) {
        let n = e - this.bx,
          r = t - this.bz,
          i = Math.hypot(n, r) || 1;
        return { x: n / i, z: r / i, d: i };
      }
      cataclysm(e, t, n, r, i, a, o, s, l) {
        let u = this.run,
          d = !u.sanctuary;
        (d && (l = c(`Aléjate más de {reach} m o ponte detrás de un desnivel`, { reach: 26 })),
          u.ui.banner(s, l, `#ff5a8a`, { species: this.species }),
          u.audio.alarm());
        let f = 0;
        u.animate(
          r,
          (r) => {
            ((f -= 1 / 60),
              f <= 0 &&
                ((f = 0.6 - r * 0.42),
                u.vfx.ground.spawn({
                  x: e,
                  y: this.groundY(e, n) + 0.15,
                  z: n,
                  life: 0.7,
                  size: 64,
                  endSize: 4,
                  color: o,
                  shape: I.Ring,
                  glow: 0.05,
                  rot: 0,
                })));
            for (let r = 0; r < 3; r++) {
              let i = F.range(0, Math.PI * 2),
                a = F.range(4, 9);
              u.vfx.add.spawn({
                x: e + Math.cos(i) * a,
                y: t + F.range(-1, 3),
                z: n + Math.sin(i) * a,
                vx: -Math.cos(i) * a * 1.6,
                vz: -Math.sin(i) * a * 1.6,
                life: 0.6,
                size: 0.5,
                endSize: 0.1,
                color: r ? o : 16777215,
                shape: I.Twinkle,
                glow: 1,
              });
            }
          },
          () => {
            u.vfx.flash(e, t, n, 16777215, 22, 0.3);
            for (let t = 0; t < 3; t++)
              u.later(t * 0.12, () =>
                u.vfx.ring(e, this.groundY(e, n), n, 24 + t * 12, t === 1 ? 16777215 : o, 0.6),
              );
            (u.shake(0.9), u.audio.boom(1), u.hitstop(0.12), u.sanctuary?.blast(e, n, 22, 30));
            let r = u.sanctuary,
              s = u.player.pos;
            (
              r
                ? r.playerHidden(e, t, n)
                : d && (Math.hypot(s.x - e, s.z - n) > 26 || !u.terrain.lineClear(e, t, n, s.x, s.y + 1, s.z))
            )
              ? u.ui.popup(
                  u.player.pos.x,
                  u.player.pos.y + 2.4,
                  u.player.pos.z,
                  c(`¡A cubierto!`),
                  `#7aff8a`,
                  0.9,
                )
              : this.hurt(i, a);
          },
        );
      }
    },
    $v = class extends Qv {
      float = !0;
      phaseNames = [c(`Guardián del tiempo`), c(`Viaje temporal`), c(`Distorsión temporal`)];
      band = [10, 16];
      speed = 5.2;
      storm = null;
      echoes = [];
      fade = 1;
      ultT = 9;
      attack() {
        let e = this.phase;
        switch (
          this.pick(
            e === 1 ? [`leaves`, `psychic`, `teleport`] : [`leaves`, `psychic`, `teleport`, `storm`, `echoes`],
          )
        ) {
          case `leaves`:
            return this.magicalLeaf();
          case `psychic`:
            return this.psychic();
          case `teleport`:
            return this.teleport();
          case `storm`:
            return this.leafStorm();
          default:
            return this.timeEchoes();
        }
      }
      magicalLeaf() {
        let e = this.run;
        for (let t = 0; t < 3; t++)
          e.later(t * 0.35, () => {
            let t = e.player.pos,
              n = this.aimAt(t.x, t.z),
              r = Math.atan2(n.z, n.x);
            for (let e = 0; e < 5; e++) {
              let t = r + (e - 2) * 0.22;
              this.shot(Math.cos(t), Math.sin(t), 9, 0.55, { homing: !0, color: 9109354, life: 4.5 });
            }
            ((this.E.atkAnim[this.i] = 0.4), e.audio.shot(`grass`, 0.6));
          });
        return 2.6;
      }
      psychic() {
        let e = this.run,
          t = this.attackTarget,
          n = e.boss.attackVelocity,
          r = 2 + this.phase;
        for (let e = 0; e < r; e++) {
          let r = t.x + (e === 0 ? n.x * 0.9 : F.range(-7, 7)),
            i = t.z + (e === 0 ? n.z * 0.9 : F.range(-7, 7));
          this.circle(r, i, 3.4, 1.15 + e * 0.12, 1.4, 16739032, I.Swirl);
        }
        return ((this.E.atkAnim[this.i] = 0.5), e.audio.shot(`psychic`, 0.7), 2.8);
      }
      teleport() {
        let e = this.run,
          t = this.E,
          n = this.i;
        return (
          (this.lock = 1.1),
          e.vfx.burst(this.bx, this.by + 1, this.bz, 10157962, 20, 6, I.Twinkle, 0.5, 0.5),
          e.audio.whoosh(),
          e.animate(
            0.35,
            (e) => {
              this.fade = 1 - e;
            },
            () => {
              let r = e.player.pos,
                i = Math.atan2(this.bz - r.z, this.bx - r.x) + Math.PI + F.range(-1, 1),
                a = { x: 0, z: 0 };
              (e.sanctuary?.confine(r.x + Math.cos(i) * 13, r.z + Math.sin(i) * 13, 3, a) ??
                Object.assign(a, { x: r.x + Math.cos(i) * 13, z: r.z + Math.sin(i) * 13 }),
                (t.x[n] = a.x),
                (t.z[n] = a.z),
                (t.y[n] = e.terrain.surface(a.x, a.z) + 1.1),
                e.vfx.ring(a.x, t.y[n] - 1, a.z, 4, 10157962, 0.4),
                e.animate(
                  0.25,
                  (e) => {
                    this.fade = e;
                  },
                  () => {
                    ((this.fade = 1),
                      this.ringShots(this.phase >= 3 ? 20 : 14, 8, 0.6, F.range(0, 1), { color: 9109354 }));
                  },
                ));
            },
          ),
          2.6
        );
      }
      leafStorm() {
        let e = this.run,
          t = e.player.pos,
          n = this.aimAt(t.x, t.z),
          r = Math.atan2(n.z, n.x),
          i = 0.62;
        ((this.lock = 3.9),
          e.ui.banner(c(`Tormenta Floral`), c(`¡Escóndete tras una columna!`), `#7aff8a`, {
            species: this.species,
          }));
        for (let t = 3; t < 30; t += 2.2)
          for (let n = -1; n <= 1; n += 0.25) {
            let a = r + n * i,
              o = this.bx + Math.cos(a) * t,
              s = this.bz + Math.sin(a) * t;
            e.vfx.ground.spawn({
              x: o,
              y: this.groundY(o, s) + 0.12,
              z: s,
              life: 1.4,
              size: 1.6,
              endSize: 1.6,
              color: 5963626,
              shape: I.Soft,
              glow: 0,
              rot: 0,
            });
          }
        return (
          (this.E.atkAnim[this.i] = 1.4),
          e.animate(
            1.4,
            () => {
              let t = F.range(0, Math.PI * 2),
                n = F.range(3, 6);
              e.vfx.add.spawn({
                x: this.bx + Math.cos(t) * n,
                y: this.by + F.range(0, 3),
                z: this.bz + Math.sin(t) * n,
                vx: -Math.cos(t) * n * 2,
                vz: -Math.sin(t) * n * 2,
                life: 0.5,
                size: 0.6,
                endSize: 0.1,
                color: 9109354,
                shape: I.Leaf,
                glow: 0.8,
              });
            },
            () => {
              ((this.storm = { t: 2.3, a0: r - i, a1: r + i, acc: 0 }), e.audio.cone(`grass`, 2.3));
            },
          ),
          4.6
        );
      }
      timeEchoes() {
        let e = this.run,
          t = e.player.pos,
          n = F.range(0, Math.PI * 2),
          r = this.phase >= 3 ? 4 : 3;
        for (let i = 0; i < r; i++) {
          let a = n + (i / r) * Math.PI * 2,
            o = { x: 0, z: 0 };
          e.sanctuary?.confine(t.x + Math.cos(a) * 12, t.z + Math.sin(a) * 12, 3, o);
          let s = e.sanctuary ? o.x : t.x + Math.cos(a) * 12,
            c = e.sanctuary ? o.z : t.z + Math.sin(a) * 12;
          (this.echoes.push({ x: s, z: c, t: 1.4 + i * 0.25, fired: !1, tx: t.x, tz: t.z }),
            e.vfx.ring(s, this.groundY(s, c), c, 2.5, 14199039, 0.5));
          let l = t.x - s,
            u = t.z - c,
            d = Math.hypot(l, u) || 1;
          this.line(s, c, s + (l / d) * 30, c + (u / d) * 30, 1.3, 1.4 + i * 0.25, 1.3, 14199039);
        }
        return (e.audio.shot(`psychic`, 0.6), 4);
      }
      ultimate() {
        let e = this.run,
          t = this.E,
          n = this.i;
        ((this.lock = 6.6),
          (this.cd = 3),
          (t.x[n] = 0),
          (t.z[n] = 7.5),
          (t.y[n] = e.terrain.surface(0, 7.5) + 1.1),
          e.vfx.ring(0, t.y[n] - 1, 7.5, 6, 10157962, 0.6));
        for (let t = 0; t < 6; t++)
          e.later(0.5 + t * 0.55, () => {
            let t = e.player.pos;
            this.circle(t.x, t.z, 3.6, 1.3, 1.2, 16767082, I.Ring);
          });
        e.later(0.6, () =>
          this.cataclysm(
            0,
            t.y[n] + 1,
            7.5,
            4.4,
            3,
            0.45,
            10157962,
            c(`¡Distorsión temporal!`),
            c(`Ponte a cubierto detrás de algo`),
          ),
        );
      }
      tick(e) {
        if ((this.run, this.storm)) {
          let t = this.storm;
          ((t.t -= e), (t.acc += e * 36));
          let n = 1 - t.t / 2.3;
          for (; t.acc >= 1; ) {
            t.acc--;
            let e =
              t.a0 +
              (t.a1 - t.a0) * (0.5 + 0.5 * Math.sin(n * Math.PI * 2.2 - Math.PI / 2)) +
              F.range(-0.08, 0.08);
            this.shot(Math.cos(e), Math.sin(e), 17, 0.32, {
              color: F.chance(0.3) ? 16756952 : 9109354,
              life: 2,
            });
          }
          ((this.E.atkAnim[this.i] = 0.3), t.t <= 0 && (this.storm = null));
        }
        for (let t = this.echoes.length - 1; t >= 0; t--) {
          let n = this.echoes[t];
          ((n.t -= e), n.t <= -0.4 && this.echoes.splice(t, 1));
        }
        !this.run.coop?.monsters && this.phase >= 3 &&
          this.immune <= 0 &&
          ((this.ultT -= e), this.ultT <= 0 && this.lock <= 0 && ((this.ultT = 14), this.ultimate()));
      }
      onPhase(e) {
        let t = this.run,
          n = this.E,
          r = this.i;
        (t.sanctuary?.restoreCovers(), (n.x[r] = 0), (n.z[r] = 8), (n.y[r] = t.terrain.surface(0, 8) + 1.1));
        for (let e = 0; e < 3; e++)
          t.later(e * 0.2, () => t.vfx.ring(0, n.y[r] - 1, 8, 6 + e * 6, 10157962, 0.7));
        e === 3 && (this.ultT = 2);
      }
      render() {
        let e = this.run,
          t = e.sprites.get(this.species),
          n = e.player.pos;
        for (let r of this.echoes) {
          let i = this.groundY(r.x, r.z) + 1.2,
            a = e.sprites.dirRow(n.x - r.x, n.z - r.z);
          t.push(
            r.x,
            i,
            r.z,
            `idle`,
            e.time,
            a,
            2.2,
            0.3,
            r.t < 0 ? 0.4 - r.t * 1.5 : 0.35,
            0,
            0,
            0.8,
            0.6,
            1.3,
            0.7,
            !1,
          );
        }
        this.run.enemies.scale[this.i] = 2.6 * Math.max(0.05, this.fade);
      }
    },
    ey = class extends Qv {
      float = !1;
      phaseNames = [c(`Espada Santa`), c(`Danza Espada`), c(`Juicio Sagrado`)];
      band = [5, 10];
      speed = 6;
      dash = null;
      dashes = [];
      leap = null;
      sweep = null;
      danceT = 0;
      ultT = 10;
      steer(e) {
        let t = super.steer(e);
        return (this.danceT > 0 && (t.speed *= 1.35), t);
      }
      attack() {
        switch (
          this.pick(this.phase === 1 ? [`blade`, `dash`, `kick`] : [`blade`, `dash`, `kick`, `leaves`, `dance`])
        ) {
          case `blade`:
            return this.leafBlade();
          case `dash`:
            return this.sacredSword();
          case `kick`:
            return this.closeCombat();
          case `leaves`:
            return this.razorRing();
          default:
            return this.swordsDance();
        }
      }
      leafBlade() {
        let e = this.run.player.pos,
          t = this.phase >= 3 ? 3 : 2,
          n = F.range(0, Math.PI);
        for (let r = 0; r < t; r++) {
          let i = n + (r / t) * Math.PI,
            a = Math.cos(i) * 10,
            o = Math.sin(i) * 10;
          this.line(e.x - a, e.z - o, e.x + a, e.z + o, 1.4, 0.9 + r * 0.1, 1.5, 9109354);
        }
        return ((this.E.atkAnim[this.i] = 0.5), 2.4);
      }
      sacredSword() {
        let e = this.phase;
        return ((this.lock = e * 1.15 + 0.3), this.queueDash(e), 2);
      }
      queueDash(e) {
        if (e <= 0) return;
        let t = this.run,
          n = t.player.pos,
          r = this.aimAt(n.x, n.z),
          i = Gs(r.d + 6, 10, 24);
        (this.line(this.bx, this.bz, this.bx + r.x * i, this.bz + r.z * i, 1.6, 0.65, 0, 16734810, !1),
          t.later(0.65, () => {
            ((this.dash = { t: i / 40, dx: r.x, dz: r.z, hit: !1 }),
              t.audio.whoosh(),
              t.later(i / 40 + 0.35, () => this.queueDash(e - 1)));
          }));
      }
      closeCombat() {
        let e = this.run,
          t = e.player.pos,
          n = { x: t.x, z: t.z };
        e.sanctuary?.confine(t.x, t.z, 3, n);
        let r = 1.05;
        return (
          (this.lock = 1.35),
          (this.leap = { t: 0, dur: r, x0: this.bx, z0: this.bz, x1: n.x, z1: n.z }),
          this.circle(n.x, n.z, 4.6, r, 1.7, 16747098, I.Fist),
          (this.E.atkAnim[this.i] = 0.4),
          e.audio.jump(0.6),
          2.4
        );
      }
      razorRing() {
        return (
          this.ringShots(18, 10, 0.6, 0, { shape: I.Crescent, color: 9109354 }),
          this.run.later(0.4, () =>
            this.ringShots(18, 10, 0.6, Math.PI / 18, { shape: I.Crescent, color: 13172586 }),
          ),
          2.6
        );
      }
      swordsDance() {
        let e = this.run;
        return (
          (this.danceT = 6),
          e.vfx.ring(this.bx, this.by, this.bz, 6, 16765498, 0.6),
          e.ui.toast(c(`¡{name} usa Danza Espada!`, { name: this.name }), null),
          e.audio.power(),
          1.2
        );
      }
      judgement() {
        let e = this.run,
          t = this.E,
          n = this.i;
        ((this.lock = 7),
          (this.cd = 2.5),
          (this.leap = { t: 0, dur: 1.1, x0: this.bx, z0: this.bz, x1: 0, z1: 7.5 }),
          e.ui.banner(c(`¡Juicio Sagrado!`), c(`Salta las hojas o cúbrete`), `#ff5a8a`, {
            species: this.species,
          }),
          e.audio.alarm(),
          e.later(1.2, () => {
            ((t.atkAnim[n] = 1),
              (this.sweep = {
                t: -1.2,
                a: F.range(0, Math.PI * 2),
                spd: 0.85 * (F.chance(0.5) ? 1 : -1),
                arms: 3,
                hitCd: 0,
              }));
          }));
      }
      tick(e) {
        let t = this.run,
          n = this.E,
          r = this.i,
          i = t.player.pos;
        if (this.danceT > 0) {
          this.danceT -= e;
          for (let e = 0; e < 2; e++) {
            let n = t.time * 4 + e * Math.PI;
            t.orbitals.push(
              this.bx + Math.cos(n) * 2.2,
              this.by + 1.6,
              this.bz + Math.sin(n) * 2.2,
              1.2,
              16769162,
              I.Cross,
              n,
              0.6,
            );
          }
        }
        if (this.dash) {
          let a = this.dash;
          ((a.t -= e),
            (n.kx[r] = a.dx * 40),
            (n.kz[r] = a.dz * 40),
            t.vfx.dust(this.bx, this.by, this.bz, 10143866, 2, 3),
            t.vfx.add.spawn({
              x: this.bx,
              y: this.by + 1,
              z: this.bz,
              life: 0.25,
              size: 1.6,
              endSize: 0.2,
              color: 9109354,
              shape: I.Leaf,
              glow: 0.8,
            }),
            t.sanctuary?.blast(this.bx, this.bz, 2.2, 100),
            !a.hit &&
              Math.hypot(i.x - this.bx, i.z - this.bz) < n.radius[r] + 1.4 &&
              this.playerLow(this.by) &&
              ((a.hit = !0), this.hurt(1.8)),
            a.t <= 0 && ((this.dash = null), (n.kx[r] = n.kz[r] = 0)));
        }
        if (this.leap) {
          let i = this.leap;
          i.t += e;
          let a = Math.min(1, i.t / i.dur);
          ((n.x[r] = i.x0 + (i.x1 - i.x0) * a),
            (n.z[r] = i.z0 + (i.z1 - i.z0) * a),
            (n.vx[r] = n.vz[r] = 0),
            (n.y[r] = t.terrain.surface(n.x[r], n.z[r]) + Math.sin(a * Math.PI) * 7),
            (n.air[r] = 1),
            (n.vy[r] = 0.01),
            a >= 1 &&
              ((this.leap = null),
              (n.air[r] = 0),
              t.vfx.dust(n.x[r], n.y[r], n.z[r], 13154456, 20, 8),
              t.shake(0.4, n.x[r], n.z[r])));
        }
        if (this.sweep) {
          let n = this.sweep;
          ((n.t += e), (n.hitCd -= e));
          let r = n.t > 0;
          r && (n.a += n.spd * e);
          let a = this.bx,
            o = this.bz,
            s = this.groundY(a, o) + 1;
          for (let e = 0; e < n.arms; e++) {
            let c = n.a + (e / n.arms) * Math.PI * 2,
              l = a + Math.cos(c) * 46,
              u = o + Math.sin(c) * 46,
              d = t.sanctuary ? t.sanctuary.firstBlock(a, s, o, l, s, u) : 1,
              f = a + (l - a) * d,
              p = o + (u - o) * d;
            if (!r) {
              if (Math.random() < 0.5)
                for (let e = 3; e < 46 * d; e += 3)
                  t.vfx.ground.spawn({
                    x: a + Math.cos(c) * e,
                    y: this.groundY(a + Math.cos(c) * e, o + Math.sin(c) * e) + 0.12,
                    z: o + Math.sin(c) * e,
                    life: 0.1,
                    size: 1.6,
                    endSize: 1.6,
                    color: 16767082,
                    shape: I.Soft,
                    glow: 0,
                    rot: 0,
                  });
              continue;
            }
            (t.vfx.beams.spawn(a, s, o, f, s, p, 1.3, 9109354, 0.05),
              t.vfx.beams.spawn(a, s, o, f, s, p, 0.4, 16777215, 0.05),
              Math.random() < 0.3 && t.vfx.burst(f, s, p, 9109354, 2, 4, I.Leaf, 0.5, 0.3));
            let m = i.x - a,
              h = i.z - o,
              g = m * Math.cos(c) + h * Math.sin(c),
              _ = Math.abs(-m * Math.sin(c) + h * Math.cos(c));
            n.hitCd <= 0 &&
              g > 0 &&
              g < 46 * d &&
              _ < 1.2 &&
              i.y - this.groundY(i.x, i.z) < 1.3 &&
              ((n.hitCd = 0.6), this.hurt(1.6, 0.12));
          }
          n.t > 4.8 && (this.sweep = null);
        }
        this.phase >= 3 &&
          this.immune <= 0 &&
          !this.sweep &&
          ((this.ultT -= e), this.ultT <= 0 && this.lock <= 0 && ((this.ultT = 14), this.judgement()));
      }
      onPhase(e) {
        (e === 2 && ((this.danceT = 6), this.run.vfx.ring(this.bx, this.by, this.bz, 8, 16765498, 0.7)),
          e === 3 && (this.ultT = 2));
      }
    },
    ty = class extends Qv {
      float = !1;
      phaseNames = [c(`Gracídea`), c(`Aromaterapia`), c(`Bomba Germen`)];
      band = [11, 17];
      speed = 3.8;
      flowers = [];
      wave = null;
      flareT = 10;
      attack() {
        switch (
          this.pick(
            this.phase === 1 ? [`leaves`, `seeds`, `ball`] : [`leaves`, `seeds`, `ball`, `flowers`, `seeds`],
          )
        ) {
          case `leaves`:
            return this.magicalLeaf();
          case `seeds`:
            return this.seedBombs();
          case `ball`:
            return this.energyBall();
          default:
            return this.aromatherapy();
        }
      }
      magicalLeaf() {
        let e = this.run;
        for (let t = 0; t < 2; t++)
          e.later(t * 0.4, () => {
            let t = e.player.pos,
              n = this.aimAt(t.x, t.z),
              r = Math.atan2(n.z, n.x);
            for (let e = 0; e < 7; e++) {
              let t = r + (e - 3) * 0.2;
              this.shot(Math.cos(t), Math.sin(t), 8.5, 0.5, { homing: !0, color: 9109354, life: 4.5 });
            }
            e.audio.shot(`grass`, 0.6);
          });
        return 2.4;
      }
      seedBombs() {
        let e = this.run,
          t = e.player.pos,
          n = 3 + this.phase * 2;
        for (let r = 0; r < n; r++) {
          let n = t.x + (r ? F.range(-7, 7) : 0),
            i = t.z + (r ? F.range(-7, 7) : 0),
            a = this.groundY(n, i),
            o = this.bx,
            s = this.bz,
            c = this.by + 1.2,
            l = 1.2 + r * 0.08;
          (this.circle(n, i, 2.8, l, 1.2, 10147914, I.Leaf),
            e.animate(l, (t) => {
              Math.random() < 0.6 &&
                e.vfx.add.spawn({
                  x: o + (n - o) * t,
                  y: c + (a - c) * t + Math.sin(t * Math.PI) * 8,
                  z: s + (i - s) * t,
                  life: 0.25,
                  size: 0.7,
                  endSize: 0.2,
                  color: 12118106,
                  shape: I.Spore,
                  glow: 0.6,
                });
            }));
        }
        return ((this.E.atkAnim[this.i] = 0.5), e.audio.shot(`grass`, 0.8), 3);
      }
      energyBall() {
        let e = this.run.player.pos,
          t = this.aimAt(e.x, e.z);
        return (
          this.shot(t.x, t.z, 6, 1.6, { homing: !0, shape: I.Soft, color: 10157914, size: 2.4, life: 6 }),
          (this.E.atkAnim[this.i] = 0.5),
          this.run.audio.shot(`grass`, 1),
          2.4
        );
      }
      aromatherapy() {
        let e = this.run;
        if (this.flowers.length >= 3) return 0.5;
        for (let t = this.flowers.length; t < 3; t++) {
          let t = F.range(0, Math.PI * 2),
            n = F.range(7, 14),
            r = { x: this.bx + Math.cos(t) * n, z: this.bz + Math.sin(t) * n };
          (e.sanctuary?.confine(r.x, r.z, 4, r),
            this.flowers.push({ x: r.x, z: r.z, t: 14, trample: 0 }),
            e.vfx.burst(r.x, this.groundY(r.x, r.z) + 0.5, r.z, 16747208, 16, 5, I.Heart, 0.5, 0.6));
        }
        return (
          e.ui.toast(c(`¡{name} usa Aromaterapia! Pisotea las flores`, { name: this.name }), null),
          e.audio.heal(),
          2.6
        );
      }
      seedFlare() {
        let e = this.run,
          t = this.bx,
          n = this.bz,
          r = this.by + 1;
        ((this.lock = 4.4),
          (this.E.atkAnim[this.i] = 2.6),
          e.ui.banner(c(`¡Bomba Germen!`), c(`Cúbrete o salta la onda`), `#ff5a8a`, { species: this.species }),
          e.audio.alarm(),
          e.animate(
            2.6,
            (i) => {
              for (let i = 0; i < 4; i++) {
                let a = F.range(0, Math.PI * 2),
                  o = F.range(3, 8);
                e.vfx.add.spawn({
                  x: t + Math.cos(a) * o,
                  y: r + F.range(-1, 3),
                  z: n + Math.sin(a) * o,
                  vx: -Math.cos(a) * o * 2,
                  vz: -Math.sin(a) * o * 2,
                  life: 0.5,
                  size: 0.6,
                  endSize: 0.1,
                  color: i ? 13172586 : 16777215,
                  shape: I.Spore,
                  glow: 1,
                });
              }
              Math.random() < 0.15 && e.vfx.ring(t, r - 1, n, 3 + i * 6, 13172586, 0.4);
            },
            () => {
              (e.vfx.flash(t, r, n, 16777215, 18, 0.3),
                e.shake(0.7),
                e.audio.boom(1),
                (this.wave = { r: 1, x: t, y: r, z: n, done: !1 }));
            },
          ));
      }
      tick(e) {
        let t = this.run,
          n = this.E,
          r = this.i,
          i = t.player.pos;
        for (let a = this.flowers.length - 1; a >= 0; a--) {
          let o = this.flowers[a];
          o.t -= e;
          let s = this.groundY(o.x, o.z);
          ((o.trample =
            (i.x - o.x) ** 2 + (i.z - o.z) ** 2 < 5.76 && i.y - s < 1.5
              ? o.trample + e / 1.2
              : Math.max(0, o.trample - e / 3)),
            t.auraRing(o.x, s, o.z, 2.4, 16747208),
            o.trample > 0 &&
              t.vfx.ground.spawn({
                x: o.x,
                y: s + 0.2,
                z: o.z,
                life: 0.05,
                size: 4.8 * o.trample,
                endSize: 4.8 * o.trample,
                color: 16777215,
                shape: I.Ring,
                glow: 0.4,
                rot: 0,
              }),
            Math.random() < e * 6 &&
              t.vfx.add.spawn({
                x: o.x + F.range(-2, 2),
                y: s + 0.3,
                z: o.z + F.range(-2, 2),
                vy: 1.2,
                life: 1,
                size: 0.5,
                endSize: 0.1,
                color: 16747208,
                shape: I.Heart,
                glow: 0.6,
              }));
          let c = n.maxHp[r] * (this.phase === 1 ? 1 : Kv[this.phase - 2]);
          (n.healBlock[r] <= 0 &&
            n.hp[r] < c &&
            ((n.hp[r] = Math.min(c, n.hp[r] + n.maxHp[r] * 0.004 * e)),
            Math.random() < e * 4 &&
              t.vfx.beams.spawn(o.x, s + 0.5, o.z, this.bx, this.by + 1, this.bz, 0.25, 16747208, 0.15)),
            (o.trample >= 1 || o.t <= 0) &&
              (o.trample >= 1 &&
                (t.vfx.burst(o.x, s + 0.5, o.z, 16747208, 24, 7, I.Leaf, 0.5, 0.6), t.audio.pop()),
              this.flowers.splice(a, 1)));
        }
        if (this.wave && !this.wave.done) {
          let n = this.wave,
            r = n.r;
          n.r += e * 32;
          for (let e = 0; e < 24; e++) {
            let r = (e / 24) * Math.PI * 2 + n.r * 0.1,
              i = n.x + Math.cos(r) * n.r,
              a = n.z + Math.sin(r) * n.r;
            t.vfx.add.spawn({
              x: i,
              y: this.groundY(i, a) + 0.6,
              z: a,
              vy: 2,
              life: 0.35,
              size: 1.4,
              endSize: 0.3,
              color: e % 3 ? 13172586 : 16777215,
              shape: I.Spore,
              glow: 0.9,
            });
          }
          t.vfx.ring(n.x, n.y - 1, n.z, n.r, 13172586, 0.1, 0.98);
          let a = Math.hypot(i.x - n.x, i.z - n.z);
          if (a >= r && a < n.r) {
            let e = t.sanctuary;
            e && e.playerHidden(n.x, n.y, n.z)
              ? t.ui.popup(i.x, i.y + 2.4, i.z, c(`¡A cubierto!`), `#7aff8a`, 0.9)
              : this.playerLow(this.groundY(i.x, i.z), 1.3)
                ? this.hurt(2.8, 0.4)
                : t.ui.popup(i.x, i.y + 2.4, i.z, c(`¡Esquivado!`), `#7aff8a`, 0.9);
          }
          n.r > 50 && (n.done = !0);
        }
        this.phase >= 2 &&
          this.immune <= 0 &&
          ((this.flareT -= e * (this.phase === 3 ? 1.35 : 1)),
          this.flareT <= 0 && this.lock <= 0 && ((this.flareT = 16), this.seedFlare()));
      }
      onPhase(e) {
        (e === 2 && ((this.flareT = 5), this.aromatherapy()),
          e === 3 && ((this.flareT = 3), (this.speed = 4.6), this.aromatherapy()));
      }
      render() {
        let e = this.run;
        for (let t of this.flowers) {
          let n = this.groundY(t.x, t.z);
          for (let r = 0; r < 6; r++) {
            let i = r * 1.05 + t.x,
              a = 0.6 + (r % 3) * 0.6;
            e.orbitals.push(
              t.x + Math.cos(i) * a,
              n + 0.45 + Math.sin(e.time * 3 + r) * 0.05,
              t.z + Math.sin(i) * a,
              0.7,
              r % 2 ? 16747208 : 16777215,
              I.Heart,
              0,
              0.3,
            );
          }
        }
      }
    },
    ny = class extends Qv {
      float = !1;
      phaseNames = [c(`Continente`), c(`Sequía`), c(`Tormenta del desierto`)];
      phaseColor = `#ffb04a`;
      band = [8, 14];
      speed = 4.2;
      flame = null;
      waves = [];
      pools = [];
      poolHurtT = 0;
      leap = null;
      ultT = 9;
      attack() {
        switch (
          this.pick(
            this.phase === 1
              ? [`quake`, `rocks`, `blades`, `flame`]
              : [`quake`, `rocks`, `blades`, `flame`, `solar`, `eruption`],
          )
        ) {
          case `quake`:
            return this.magnitude();
          case `rocks`:
            return this.rockSlide();
          case `blades`:
            return this.precipiceBlades();
          case `flame`:
            return this.flamethrower();
          case `solar`:
            return this.solarBeam();
          default:
            return this.eruption();
        }
      }
      onMesa() {
        let e = this.run.player.pos;
        return this.groundY(e.x, e.z) > 2.6;
      }
      magnitude() {
        let e = this.run,
          t = this.E,
          n = this.i;
        return (
          (this.lock = 1.1),
          (t.atkAnim[n] = 0.8),
          e.vfx.enemyCircle(this.bx, this.by, this.bz, 5, 13142602, 0.8),
          e.later(0.8, () => {
            (e.shake(0.45, this.bx, this.bz),
              e.audio.boom(0.9),
              e.vfx.dust(this.bx, this.by, this.bz, 14200954, 22, 9));
            for (let t = 0; t < 2; t++)
              e.later(t * 0.45, () =>
                this.waves.push({
                  x: this.bx,
                  y: this.by,
                  z: this.bz,
                  r: 1.5,
                  max: 22 + this.phase * 4,
                  speed: 20,
                  mul: 1.2,
                  minFrac: 0,
                  hit: !1,
                  ult: !1,
                }),
              );
          }),
          3
        );
      }
      rockSlide() {
        let e = this.run,
          t = e.player.pos,
          n = e.player.vel,
          r = 3 + this.phase;
        for (let i = 0; i < r; i++) {
          let r = { x: t.x + (i === 0 ? n.x : F.range(-7, 7)), z: t.z + (i === 0 ? n.z : F.range(-7, 7)) };
          e.sanctuary?.confine(r.x, r.z, 2, r);
          let a = 1.2 + i * 0.1,
            o = this.groundY(r.x, r.z);
          (this.circle(r.x, r.z, 3.2, a, 1.4, 13142106, I.PixRock, () =>
            e.vfx.dust(r.x, o, r.z, 14200954, 10, 5),
          ),
            e.vfx.norm.spawn({
              x: r.x,
              y: o + 14,
              z: r.z,
              vy: -14 / a,
              life: a,
              size: 2.6,
              endSize: 2.6,
              color: 16777215,
              shape: I.PixRock,
              spin: F.range(-3, 3),
            }));
        }
        return ((this.E.atkAnim[this.i] = 0.5), e.audio.shot(`rock`, 0.8), 2.8);
      }
      precipiceBlades() {
        let e = this.run,
          t = e.player.pos,
          n = e.sanctuary,
          r = this.aimAt(t.x, t.z),
          i = Math.atan2(r.z, r.x),
          a = this.phase >= 2 ? 3 : 1;
        ((this.lock = 0.8), (this.E.atkAnim[this.i] = 0.7));
        for (let t = 0; t < a; t++) {
          let r = i + (t - (a - 1) / 2) * 0.34,
            o = Math.cos(r),
            s = Math.sin(r),
            c = this.bx,
            l = this.bz,
            u = this.by + 1,
            d = 32 * (n ? n.firstBlock(c, u, l, c + o * 32, u, l + s * 32) : 1);
          for (let t = 2; t <= d; t += 2.2) {
            let n = c + o * t,
              i = l + s * t;
            e.vfx.groundN.spawn({
              x: n,
              y: this.groundY(n, i) + 0.09,
              z: i,
              life: 0.75,
              size: 1.9,
              endSize: 1.9,
              color: 16777215,
              shape: I.PixCrack,
              rot: r + F.range(-0.4, 0.4),
            });
          }
          let f = { done: !1 };
          e.later(0.7, () => {
            for (let t = 2; t <= d; t += 1.4)
              e.later(t / 30, () => {
                let n = c + o * t,
                  r = l + s * t,
                  i = this.groundY(n, r);
                (e.vfx.norm.spawn({
                  x: n,
                  y: i + 1.1,
                  z: r,
                  vy: 6,
                  drag: 6,
                  life: 0.65,
                  size: 2.4,
                  endSize: 2.1,
                  color: 16777215,
                  shape: I.PixSpike,
                }),
                  Math.random() < 0.5 &&
                    e.vfx.norm.spawn({
                      x: n,
                      y: i + 0.4,
                      z: r,
                      vx: F.range(-3, 3),
                      vy: F.range(4, 8),
                      vz: F.range(-3, 3),
                      gravity: 24,
                      life: 0.6,
                      size: 0.5,
                      endSize: 0.4,
                      color: 16777215,
                      shape: I.PixRock,
                      spin: 6,
                    }));
                let a = e.player.pos;
                !f.done &&
                  Math.hypot(a.x - n, a.z - r) < 1.6 &&
                  this.playerLow(this.groundY(a.x, a.z), 1.3) &&
                  ((f.done = !0), this.hurt(1.6, 0, `ground`));
              });
            (e.audio.boom(0.6), e.shake(0.2, c, l));
          });
        }
        return 3;
      }
      flamethrower() {
        let e = this.run,
          t = e.player.pos,
          n = this.aimAt(t.x, t.z),
          r = Math.atan2(n.z, n.x),
          i = 0.45;
        this.lock = 2.4;
        for (let t = 3; t < 18; t += 2)
          for (let n = -1; n <= 1; n += 0.34) {
            let a = r + n * i,
              o = this.bx + Math.cos(a) * t,
              s = this.bz + Math.sin(a) * t;
            e.vfx.ground.spawn({
              x: o,
              y: this.groundY(o, s) + 0.12,
              z: s,
              life: 0.8,
              size: 1.6,
              endSize: 1.6,
              color: 16742954,
              shape: I.Soft,
              glow: 0,
              rot: 0,
            });
          }
        return (
          (this.E.atkAnim[this.i] = 1.2),
          e.later(0.8, () => {
            ((this.flame = { t: 1.4, a0: r - i, a1: r + i, acc: 0 }), e.audio.cone(`fire`, 1.4));
          }),
          3.6
        );
      }
      solarBeam() {
        let e = this.run,
          t = e.player.pos,
          n = this.aimAt(t.x, t.z),
          r = 1.3;
        return (
          (this.lock = 1.7000000000000002),
          (this.E.atkAnim[this.i] = r),
          e.animate(r, () => {
            let t = F.range(0, Math.PI * 2),
              n = F.range(2, 5);
            e.vfx.add.spawn({
              x: this.bx + Math.cos(t) * n,
              y: this.by + F.range(1, 6),
              z: this.bz + Math.sin(t) * n,
              vx: -Math.cos(t) * n * 2,
              vy: -2,
              vz: -Math.sin(t) * n * 2,
              life: 0.5,
              size: 0.5,
              endSize: 0.1,
              color: 16770698,
              shape: I.Twinkle,
              glow: 0.9,
            });
          }),
          this.line(this.bx, this.bz, this.bx + n.x * 40, this.bz + n.z * 40, 2, r, 2, 16769136, !0, I.Twinkle),
          e.later(r, () => {
            (e.vfx.flash(this.bx, this.by + 2, this.bz, 16769136, 6, 0.2), e.shake(0.3));
          }),
          e.audio.shot(`grass`, 0.9),
          3
        );
      }
      eruption() {
        let e = this.run,
          t = e.player.pos,
          n = 5 + this.phase;
        ((this.E.atkAnim[this.i] = 0.8),
          e.vfx.burst(this.bx, this.by + 3, this.bz, 16742954, 20, 9, I.PixFlame, 0.8, 0.6));
        for (let r = 0; r < n; r++) {
          let n = { x: t.x + (r ? F.range(-12, 12) : 0), z: t.z + (r ? F.range(-12, 12) : 0) };
          e.sanctuary?.confine(n.x, n.z, 2, n);
          let i = n.x,
            a = n.z,
            o = this.groundY(i, a),
            s = this.bx,
            c = this.bz,
            l = this.by + 3,
            u = 1.3 + r * 0.12;
          (this.circle(i, a, 3, u, 1.3, 16738858, I.PixFlame, () =>
            this.pools.push({ x: i, y: o, z: a, r: 2.6, t: 4 }),
          ),
            e.animate(u, (t) => {
              Math.random() < 0.7 &&
                e.vfx.norm.spawn({
                  x: s + (i - s) * t,
                  y: l + (o - l) * t + Math.sin(t * Math.PI) * 10,
                  z: c + (a - c) * t,
                  life: 0.25,
                  size: 0.9,
                  endSize: 0.4,
                  color: 16777215,
                  endColor: 14707274,
                  shape: I.PixFlame,
                });
            }));
        }
        return (e.audio.boom(0.7), 3.2);
      }
      earthquake() {
        let e = this.run;
        ((this.lock = 7.6),
          (this.cd = 2.5),
          (this.leap = { t: 0, dur: 1, x0: this.bx, z0: this.bz, x1: 0, z1: 8.5 }),
          e.ui.banner(c(`¡Terremoto!`), c(`Sube a una meseta o salta las ondas`), `#ff5a8a`, {
            species: this.species,
          }),
          e.audio.alarm(),
          e.later(1, () => {
            ((this.E.atkAnim[this.i] = 3.4),
              e.animate(
                3.4,
                (t) => {
                  if ((Math.random() < 0.3 && e.shake(0.08 + t * 0.25), Math.random() < 0.5)) {
                    let t = F.range(0, Math.PI * 2),
                      n = F.range(5, 46),
                      r = Math.cos(t) * n,
                      i = Math.sin(t) * n;
                    e.vfx.dust(r, this.groundY(r, i), i, 14200954, 3, 3);
                  }
                  Math.random() < 0.12 &&
                    e.vfx.ground.spawn({
                      x: this.bx,
                      y: this.by + 0.15,
                      z: this.bz,
                      life: 0.7,
                      size: 60,
                      endSize: 5,
                      color: 16747066,
                      shape: I.Ring,
                      glow: 0.05,
                      rot: 0,
                    });
                },
                () => {
                  for (let t = 0; t < 3; t++)
                    e.later(t * 0.75, () => {
                      (this.waves.push({
                        x: this.bx,
                        y: this.by,
                        z: this.bz,
                        r: 2,
                        max: 54,
                        speed: 24,
                        mul: 2.6,
                        minFrac: 0.35,
                        hit: !1,
                        ult: !0,
                      }),
                        e.shake(0.8),
                        e.audio.boom(1),
                        e.hitstop(0.06),
                        e.vfx.dust(this.bx, this.by, this.bz, 14200954, 30, 12));
                    });
                },
              ));
          }));
      }
      tick(e) {
        let t = this.run,
          n = this.E,
          r = this.i,
          i = t.player.pos;
        if (this.flame) {
          let t = this.flame;
          ((t.t -= e), (t.acc += e * 28));
          let i = 1 - t.t / 1.4;
          for (; t.acc >= 1; ) {
            t.acc--;
            let e =
              t.a0 +
              (t.a1 - t.a0) * (0.5 + 0.5 * Math.sin(i * Math.PI * 2 - Math.PI / 2)) +
              F.range(-0.06, 0.06);
            this.shot(Math.cos(e), Math.sin(e), 15, 0.3, { shape: I.PixFlame, color: 16742954, life: 1.3 });
          }
          ((n.atkAnim[r] = 0.3), t.t <= 0 && (this.flame = null));
        }
        for (let n = this.waves.length - 1; n >= 0; n--) {
          let r = this.waves[n],
            a = r.r;
          ((r.r += r.speed * e), t.vfx.ring(r.x, r.y, r.z, r.r, r.ult ? 9058832 : 6965796, 0.05, 0.97));
          for (let e = 0, n = r.ult ? 10 : 6; e < n; e++) {
            let e = F.range(0, Math.PI * 2),
              n = r.x + Math.cos(e) * r.r,
              i = r.z + Math.sin(e) * r.r;
            t.vfx.norm.spawn({
              x: n,
              y: this.groundY(n, i) + 0.3,
              z: i,
              vx: Math.cos(e) * 2,
              vy: F.range(3, 6),
              vz: Math.sin(e) * 2,
              gravity: 20,
              life: 0.5,
              size: F.range(0.4, 0.8),
              endSize: 0.3,
              color: 16777215,
              shape: Math.random() < 0.6 ? I.PixRock : I.PixPuff,
            });
          }
          r.ult && t.sanctuary?.blastRing(r.x, r.z, a, r.r, 20);
          let o = Math.hypot(i.x - r.x, i.z - r.z);
          (!r.hit &&
            o >= a &&
            o < r.r &&
            ((r.hit = !0),
            r.ult && this.onMesa()
              ? t.ui.popup(i.x, i.y + 2.4, i.z, c(`¡A salvo en la meseta!`), `#7aff8a`, 0.9)
              : this.playerLow(this.groundY(i.x, i.z), 1.3)
                ? this.hurt(r.mul, r.minFrac, `ground`)
                : t.ui.popup(i.x, i.y + 2.4, i.z, c(`¡Esquivado!`), `#7aff8a`, 0.9)),
            r.r > r.max && this.waves.splice(n, 1));
        }
        this.poolHurtT -= e;
        for (let n = this.pools.length - 1; n >= 0; n--) {
          let r = this.pools[n];
          ((r.t -= e),
            r.t <= 0
              ? this.pools.splice(n, 1)
              : (Math.random() < e * 6 &&
                  t.vfx.groundN.spawn({
                    x: r.x,
                    y: r.y + 0.1,
                    z: r.z,
                    life: 0.5,
                    size: r.r * 2,
                    endSize: r.r * 2,
                    color: 6957588,
                    shape: I.Soft,
                    rot: 0,
                  }),
                Math.random() < e * 10 &&
                  t.vfx.norm.spawn({
                    x: r.x + F.range(-r.r, r.r) * 0.7,
                    y: r.y + 0.2,
                    z: r.z + F.range(-r.r, r.r) * 0.7,
                    vy: F.range(1, 2.5),
                    life: 0.5,
                    size: 0.8,
                    endSize: 0.2,
                    color: 16777215,
                    endColor: 14707274,
                    shape: I.PixFlame,
                  }),
                this.poolHurtT <= 0 &&
                  (i.x - r.x) ** 2 + (i.z - r.z) ** 2 < r.r * r.r &&
                  i.y - r.y < 1 &&
                  ((this.poolHurtT = 0.5),
                  this.dead || t.player.hurt(t.player.maxHp * 0.03, `fire`, -1, NaN, NaN, !0, 0, this.i))));
        }
        if (this.leap) {
          let i = this.leap;
          i.t += e;
          let a = Math.min(1, i.t / i.dur);
          ((n.x[r] = i.x0 + (i.x1 - i.x0) * a),
            (n.z[r] = i.z0 + (i.z1 - i.z0) * a),
            (n.vx[r] = n.vz[r] = 0),
            (n.y[r] = t.terrain.surface(n.x[r], n.z[r]) + Math.sin(a * Math.PI) * 8),
            (n.air[r] = 1),
            (n.vy[r] = 0.01),
            a >= 1 &&
              ((this.leap = null),
              (n.air[r] = 0),
              t.vfx.dust(n.x[r], n.y[r], n.z[r], 14200954, 24, 9),
              t.shake(0.5, n.x[r], n.z[r]),
              t.audio.boom(0.9)));
        }
        this.phase >= 3 &&
          this.immune <= 0 &&
          !this.leap &&
          ((this.ultT -= e), this.ultT <= 0 && this.lock <= 0 && ((this.ultT = 14), this.earthquake()));
      }
      onPhase(e) {
        let t = this.run;
        for (let n = 0; n < 3; n++)
          t.later(n * 0.2, () =>
            t.vfx.ring(this.bx, this.by, this.bz, 6 + n * 7, e === 2 ? 16765034 : 14200954, 0.7),
          );
        e === 3 && ((this.ultT = 2), (this.speed = 4.8));
      }
      render() {
        this.run.enemies.scale[this.i] = 3;
      }
    },
    ry = class extends Qv {
      float = !0;
      phaseNames = [c(`Juguetón`), c(`Metrónomo`), c(`Gen Ancestral`)];
      ultimateName = c(`¡Gen Ancestral!`);
      phaseColor = `#ff8ad8`;
      band = [9, 15];
      speed = 5.4;
      fade = 1;
      mimicT = 0;
      mimicAcc = 0;
      stones = [];
      ultT = 9;
      mines = [];
      clones = [];
      attack(serverMove,variant) {
        switch (
          serverMove??this.pick(
            this.phase === 1
              ? [`bubbles`, `psychic`, `aura`, `teleport`, `mines`]
              : [
                  `bubbles`,
                  `psychic`,
                  `aura`,
                  `teleport`,
                  `mines`,
                  `metronome`,
                  `ancient`,
                  `transform`,
                  `double`,
                ],
          )
        ) {
          case `bubbles`:
            return this.bubbles();
          case `psychic`:
            return this.psychic();
          case `aura`:
            return this.auraSphere();
          case `teleport`:
            return this.teleport();
          case `mines`:
            return this.bubbleMines();
          case `metronome`:
            return this.metronome(variant);
          case `ancient`:
            return this.ancientPower();
          case `double`:
            return this.doubleTeam();
          default:
            return this.transform();
        }
      }
      bubbleMines() {
        let e = this.run,
          t = this.attackTarget,
          n = 4 + this.phase;
        this.E.atkAnim[this.i] = 0.6;
        for (let r = 0; r < n; r++) {
          let i = (r / n) * Math.PI * 2 + this.attackRandom.range(-0.3, 0.3),
            a = this.attackRandom.range(3.5, 9),
            o = { x: t.x + Math.cos(i) * a, z: t.z + Math.sin(i) * a };
          (e.sanctuary?.confine(o.x, o.z, 2, o),
            this.mines.push({ x: o.x, z: o.z, t: 7, arm: 0.9, fuse: -1 }),
            e.vfx.add.spawn({
              x: this.bx,
              y: this.by + 1,
              z: this.bz,
              vx: (o.x - this.bx) / 0.9,
              vz: (o.z - this.bz) / 0.9,
              life: 0.9,
              size: 1.4,
              endSize: 1.7,
              color: 16751328,
              shape: I.Bubble,
              glow: 0.4,
            }));
        }
        return (
          e.ui.popup(this.bx, this.by + 4, this.bz, c(`¡Burbuja Trampa!`), `#ff9ae0`, 1),
          e.audio.shot(`water`, 0.6),
          2.6
        );
      }
      doubleTeam() {
        let e = this.run,
          t = this.attackTarget,
          n = e.boss.roomAim?.angle??this.attackRandom.range(0, Math.PI * 2),
          r = this.phase >= 3 ? 3 : 2;
        for (let i = 0; i < r; i++) {
          let a = n + (i / r) * Math.PI * 2,
            o = { x: t.x + Math.cos(a) * 11, z: t.z + Math.sin(a) * 11 };
          (e.sanctuary?.confine(o.x, o.z, 3, o),
            this.clones.push({ x: o.x, z: o.z, t: 6.5, acc: 0.8 + i * 0.35 }),
            e.vfx.burst(o.x, this.groundY(o.x, o.z) + 2, o.z, 16751328, 16, 6, I.PixSparkle, 0.5, 0.5));
        }
        return (
          e.ui.popup(this.bx, this.by + 4, this.bz, c(`¡Doble Equipo!`), `#ff9ae0`, 1),
          e.audio.power(),
          2.4
        );
      }
      bubbles() {
        let e = this.run;
        for (let t = 0; t < 3; t++)
          e.later(t * 0.45, () => {
            let n = 8 + this.phase * 2,
              r = this.attackRandom.range(0, 1);
            for (let e = 0; e < n; e++) {
              let i = (e / n) * Math.PI * 2 + r;
              this.shot(Math.cos(i), Math.sin(i), 6.5, 0.5, {
                shape: I.Bubble,
                color: 16751328,
                homing: t === 2,
                life: 4.5,
                size: 1.3,
              });
            }
            (e.vfx.ring(this.bx, this.by, this.bz, 4, 16751328, 0.4),
              (this.E.atkAnim[this.i] = 0.4),
              e.audio.shot(`psychic`, 0.5));
          });
        return 2.8;
      }
      psychic() {
        let e = this.run,
          t = this.attackTarget,
          n = e.boss.attackVelocity,
          r = 2 + this.phase;
        for (let e = 0; e < r; e++) {
          let r = t.x + (e === 0 ? n.x * 0.9 : this.attackRandom.range(-7, 7)),
            i = t.z + (e === 0 ? n.z * 0.9 : this.attackRandom.range(-7, 7));
          this.circle(r, i, 3.4, 1.15 + e * 0.12, 1.4, 16739032, I.Swirl);
        }
        return ((this.E.atkAnim[this.i] = 0.5), e.audio.shot(`psychic`, 0.7), 2.8);
      }
      auraSphere() {
        let e = this.run,
          t = this.phase >= 3 ? 4 : 3;
        for (let n = 0; n < t; n++)
          e.later(n * 0.3, () => {
            let r = this.attackTarget,
              i = this.aimAt(r.x, r.z),
              a = Math.atan2(i.z, i.x) + (n - (t - 1) / 2) * 0.5;
            (this.shot(Math.cos(a), Math.sin(a), 8, 1.1, {
              shape: I.Ring,
              color: 6990079,
              homing: !0,
              life: 4,
              size: 1.6,
            }),
              (this.E.atkAnim[this.i] = 0.3),
              e.audio.shot(`fighting`, 0.6));
          });
        return 2.6;
      }
      teleport() {
        let e = this.run,
          t = this.E,
          n = this.i;
        return (
          (this.lock = 1.1),
          e.vfx.burst(this.bx, this.by + 1, this.bz, 16751328, 20, 6, I.Bubble, 0.5, 0.5),
          e.audio.whoosh(),
          e.animate(
            0.3,
            (e) => {
              this.fade = 1 - e;
            },
            () => {
              const aim=e.boss.roomAim,r=this.attackTarget;
              const i=Math.atan2(this.bz-r.z,this.bx-r.x)+Math.PI+(aim?aim.angle/Math.PI-1:this.attackRandom.range(-1,1));
              const a=aim?{x:aim.warpX,z:aim.warpZ}:{x:r.x+Math.cos(i)*12,z:r.z+Math.sin(i)*12};
              (e.sanctuary?.confine(a.x, a.z, 3, a),
                !aim && ((t.x[n] = a.x),(t.z[n] = a.z)),
                (t.y[n] = e.terrain.surface(a.x, a.z) + 1.1),
                e.vfx.ring(a.x, t.y[n] - 1, a.z, 4, 16751328, 0.4),
                e.animate(
                  0.25,
                  (e) => {
                    this.fade = e;
                  },
                  () => {
                    ((this.fade = 1),
                      this.ringShots(this.phase >= 3 ? 18 : 12, 8, 0.6, this.attackRandom.range(0, 1), {
                        shape: I.PixStar,
                        color: 16777215,
                      }),
                      this.phase >= 2 && !this.dead && this.psychic());
                  },
                ));
            },
          ),
          this.phase >= 2 ? 3.2 : 2.6
        );
      }
      metronome(variant) {
        let e = this.run;
        ((this.lock = 1), (this.E.atkAnim[this.i] = 1));
        for (let t = 0; t < 5; t++)
          e.later(t * 0.12, () =>
            e.vfx.norm.spawn({
              x: this.bx,
              y: this.by + 3.6,
              z: this.bz,
              life: 0.13,
              size: 1.8,
              endSize: 1.8,
              color: 16777215,
              shape: I.PixFinger,
              rot: t % 2 ? 0.45 : -0.45,
            }),
          );
        e.audio.melody([523, 659, 523, 784], 0.1);
        let t = [
            [c(`Llamarada`), `#ff7a2a`, () => this.fireBlast()],
            [c(`Ventisca`), `#8ae0ff`, () => this.blizzard()],
            [c(`Trueno`), `#ffe23a`, () => this.thunder()],
            [c(`Terremoto`), `#d8b07a`, () => this.quake()],
            [c(`Rayo Solar`), `#9aff5a`, () => this.solar()],
          ],
          [n, r, i] = t[variant]??F.pick(t);
        return (
          e.later(0.65, () => {
            (e.ui.popup(this.bx, this.by + 4.6, this.bz, c(`¡{name}!`, { name: n }), r, 1), i());
          }),
          3.4
        );
      }
      fireBlast() {
        let e = this.attackTarget;
        for (let t = 0; t < 5; t++) {
          let n = (t / 5) * Math.PI * 2 - Math.PI / 2;
          this.line(
            e.x,
            e.z,
            e.x + Math.cos(n) * 9,
            e.z + Math.sin(n) * 9,
            1.2,
            0.9,
            1.3,
            16742954,
            !0,
            I.PixFlame,
          );
        }
        this.circle(e.x, e.z, 2.4, 0.9, 1.2, 16742954, I.PixFlame);
      }
      blizzard() {
        let e = this.run,
          t = this.attackTarget,
          n = this.aimAt(t.x, t.z),
          r = Math.atan2(n.z, n.x);
        for (let t = 0; t < 6; t++)
          e.later(t * 0.12, () => {
            for (let e = 0; e < 7; e++) {
              let t = r + (e - 3) * 0.13 + this.attackRandom.range(-0.05, 0.05);
              this.shot(Math.cos(t), Math.sin(t), 13, 0.4, { shape: I.PixSnow, color: 16777215, life: 2.2 });
            }
          });
        e.audio.cone(`ice`, 0.8);
      }
      thunder() {
        let e = this.run,
          t = this.attackTarget;
        for (let n = 0; n < 5; n++) {
          let r = t.x + (n ? this.attackRandom.range(-8, 8) : 0),
            i = t.z + (n ? this.attackRandom.range(-8, 8) : 0),
            a = this.groundY(r, i);
          this.circle(r, i, 3, 1 + n * 0.1, 1.4, 16769594, I.PixBolt, () =>
            e.vfx.lightning(r, a + 26, i, r, a, i, 16769594, 0.6, 9, 0.25),
          );
        }
      }
      quake() {
        let e = this.run,
          t = e.player.pos;
        (e.vfx.enemyCircle(this.bx, this.by - 1, this.bz, 5, 14200954, 0.7),
          e.later(0.7, () => {
            (e.shake(0.4), e.audio.boom(0.9));
            let n = this.bx,
              r = this.bz,
              i = 1,
              a = { done: !1 };
            e.animate(1.2, (o) => {
              let s = i;
              ((i = 1 + o * 26), e.vfx.ring(n, this.groundY(n, r), r, i, 6965796, 0.05, 0.97));
              let l = Math.hypot(t.x - n, t.z - r);
              !a.done &&
                l >= s &&
                l < i &&
                ((a.done = !0),
                this.playerLow(this.groundY(t.x, t.z), 1.3)
                  ? this.hurt(1.3, 0, `ground`)
                  : e.ui.popup(t.x, t.y + 2.4, t.z, c(`¡Esquivado!`), `#7aff8a`, 0.9));
            });
          }));
      }
      solar() {
        let e = this.run,
          t = this.attackTarget,
          n = this.aimAt(t.x, t.z);
        ((this.lock = 1.4),
          this.line(
            this.bx,
            this.bz,
            this.bx + n.x * 40,
            this.bz + n.z * 40,
            2,
            1.1,
            2,
            11599722,
            !0,
            I.Twinkle,
          ),
          e.later(1.1, () => e.vfx.flash(this.bx, this.by + 2, this.bz, 11599722, 5, 0.2)));
      }
      ancientPower() {
        let e = this.run;
        this.lock = 1.2;
        for (let e = 0; e < 10; e++) this.stones.push({ a: (e / 10) * Math.PI * 2, t: 1.1 });
        return (
          e.audio.shot(`rock`, 0.6),
          e.later(1.1, () => {
            (this.ringShots(this.phase >= 3 ? 16 : 12, 9, 0.8, this.attackRandom.range(0, 1), {
              shape: I.PixRock,
              color: 16777215,
              size: 1.3,
            }),
              e.shake(0.15));
          }),
          2.8
        );
      }
      transform() {
        let e = this.run;
        return (
          (this.mimicT = 6),
          (this.mimicAcc = 0),
          e.vfx.burst(this.bx, this.by + 1, this.bz, 16751328, 30, 7, I.PixSparkle, 0.6, 0.6),
          e.vfx.ring(this.bx, this.by - 1, this.bz, 5, 16751328, 0.5),
          e.ui.popup(this.bx, this.by + 4, this.bz, c(`¡Transformación!`), `#ff9ae0`, 1),
          e.audio.power(),
          3
        );
      }
      ultimate() {
        let e = this.run,
          t = this.E,
          n = this.i;
        ((this.lock = 6.4), (this.cd = 3));
        let r = this.hx,
          i = this.hz + 7.5;
        (!e.coop?.monsters && ((t.x[n] = r),(t.z[n] = i)),
          (t.y[n] = e.terrain.surface(r, i) + 1.1),
          e.vfx.ring(r, t.y[n] - 1, i, 6, 16751328, 0.6));
        for (let t = 0; t < 5; t++)
          e.later(0.5 + t * 0.6, () => {
            this.ringShots(10, 6, 0.5, t * 0.3, { shape: I.Bubble, color: 16751328, life: 4, size: 1.2 });
          });
        e.later(0.6, () =>
          this.cataclysm(
            r,
            t.y[n] + 1,
            i,
            4.4,
            3,
            0.45,
            16747224,
            this.ultimateName,
            c(`Ponte a cubierto detrás de algo`),
          ),
        );
      }
      tick(e) {
        let t = this.run;
        if (this.mimicT > 0) {
          if (((this.mimicT -= e), (this.mimicAcc += e), this.mimicAcc >= 0.55)) {
            this.mimicAcc = 0;
            let e = t.player.pos,
              n = this.aimAt(e.x, e.z),
              r = t.player.types[0];
            for (let e = -1; e <= 1; e++) {
              let t = Math.atan2(n.z, n.x) + e * 0.25;
              this.shot(Math.cos(t), Math.sin(t), 12, 0.5, { shape: am(r), color: Ni[r], life: 2.5, type: r });
            }
            ((this.E.atkAnim[this.i] = 0.3), t.audio.shot(r, 0.5));
          }
          this.mimicT <= 0 &&
            t.vfx.burst(this.bx, this.by + 1, this.bz, 16751328, 20, 6, I.PixSparkle, 0.5, 0.5);
        }
        for (let n = this.stones.length - 1; n >= 0; n--) {
          let r = this.stones[n];
          ((r.t -= e),
            (r.a += e * 3),
            t.orbitals.push(
              this.bx + Math.cos(r.a) * 2.6,
              this.by + 1 + Math.sin(r.a * 2) * 0.4,
              this.bz + Math.sin(r.a) * 2.6,
              1,
              16777215,
              I.PixRock,
              r.a,
              0,
            ),
            r.t <= 0 && this.stones.splice(n, 1));
        }
        let n = t.player.pos;
        for (let r = this.mines.length - 1; r >= 0; r--) {
          let i = this.mines[r],
            a = this.groundY(i.x, i.z);
          ((i.t -= e), (i.arm -= e));
          let o = Math.hypot(n.x - i.x, n.z - i.z);
          i.fuse < 0 &&
            i.arm <= 0 &&
            (o < 2.6 || i.t <= 0) &&
            ((i.fuse = 0.45), t.vfx.enemyCircle(i.x, a, i.z, 3, 16739032, 0.45), t.audio.click());
          let s = i.fuse >= 0 ? 1 + (0.45 - i.fuse) * 1.6 : 1 + Math.sin(t.time * 4 + r) * 0.06;
          (i.arm <= 0 &&
            t.orbitals.push(
              i.x,
              a + 1.1 + Math.sin(t.time * 2 + r) * 0.15,
              i.z,
              1.5 * s,
              16751328,
              I.Bubble,
              0,
              0.4,
            ),
            i.fuse >= 0 &&
              ((i.fuse -= e),
              i.fuse <= 0 &&
                (t.vfx.burst(i.x, a + 1, i.z, 16751328, 16, 6, I.Bubble, 0.6, 0.5),
                t.vfx.ring(i.x, a, i.z, 3, 16751328, 0.35),
                t.audio.boom(0.35),
                Math.hypot(n.x - i.x, n.z - i.z) < 3 && this.playerLow(a) && this.hurt(1.1),
                this.mines.splice(r, 1))));
        }
        for (let r = this.clones.length - 1; r >= 0; r--) {
          let i = this.clones[r];
          if (((i.t -= e), (i.acc -= e), i.acc <= 0 && !this.dead)) {
            i.acc = 1.2;
            let e = this.groundY(i.x, i.z) + 1.6,
              r = Math.atan2(n.z - i.z, n.x - i.x);
            for (let a = -1; a <= 1; a++)
              t.projectiles.fire({
                x: i.x,
                y: e,
                z: i.z,
                dx: Math.cos(r + a * 0.22),
                dz: Math.sin(r + a * 0.22),
                dy: (n.y + 0.8 - e) / 12,
                speed: 8.5,
                life: 3,
                radius: 0.6,
                dmg: this.E.dmg[this.i] * 0.5,
                type: `psychic`,
                cls: `special`,
                flags: em.Hostile | em.Capped,
                size: 1.3,
                shape: I.Bubble,
                color: 16751328,
                from: this.i,
              });
            t.audio.shot(`psychic`, 0.4);
          }
          i.t <= 0 &&
            (t.vfx.burst(i.x, this.groundY(i.x, i.z) + 2, i.z, 16751328, 12, 5, I.PixSparkle, 0.4, 0.4),
            this.clones.splice(r, 1));
        }
        !this.run.coop?.monsters && this.phase >= 3 &&
          this.immune <= 0 &&
          ((this.ultT -= e), this.ultT <= 0 && this.lock <= 0 && ((this.ultT = 14), this.ultimate()));
      }
      onPhase(e) {
        let t = this.run,
          n = this.E,
          r = this.i;
        ((this.mimicT = 0), (this.mines.length = 0), (this.clones.length = 0));
        let i = this.hx,
          a = this.hz + 8;
        (!t.coop?.monsters && ((n.x[r] = i), (n.z[r] = a)), (n.y[r] = t.terrain.surface(i, a) + 1.1));
        for (let e = 0; e < 3; e++)
          t.later(e * 0.2, () => t.vfx.ring(i, n.y[r] - 1, a, 6 + e * 6, 16751328, 0.7));
        (t.vfx.burst(i, n.y[r] + 1, a, 16751328, 30, 8, I.Bubble, 0.7, 0.8), e === 3 && (this.ultT = 2));
      }
      render() {
        let e = this.run,
          t = this.E,
          n = this.i;
        if (this.mimicT > 0) {
          t.scale[n] = 0.01;
          let r = e.player.pos;
          e.sprites
            .get(e.player.speciesId)
            .push(
              this.bx,
              this.by,
              this.bz,
              `walk`,
              e.time,
              e.sprites.dirRow(r.x - this.bx, r.z - this.bz),
              2.2,
              0.15,
              0,
              1,
              0,
              1.25,
              0.75,
              1.15,
              0.5,
              !1,
            );
        } else t.scale[n] = 2.6 * Math.max(0.05, this.fade);
        if (!this.clones.length) return;
        let r = e.sprites.get(this.species),
          i = e.player.pos;
        for (let t of this.clones) {
          let n = e.terrain.surface(t.x, t.z) + 1.1,
            a = Math.min(1, t.t * 2);
          r.push(
            t.x,
            n + Math.sin(e.time * 3 + t.x) * 0.15,
            t.z,
            `walk`,
            e.time,
            e.sprites.dirRow(i.x - t.x, i.z - t.z),
            2.6,
            0.15,
            1 - a * 0.8,
            1,
            0,
            1.25,
            0.8,
            1.15,
            0.4,
            !1,
          );
        }
      }
    },
    iy = class extends Qv {
      float = !0;
      phaseNames = [c(`Ave de fuego`), c(`Sequía`), c(`Fuego Sagrado`)];
      phaseColor = `#ff8a3a`;
      band = [10, 16];
      speed = 5;
      flame = null;
      dive = null;
      pools = [];
      poolHurtT = 0;
      rings = [];
      ultT = 9;
      gust = 0;
      gustAcc = 0;
      walls = [];
      attack() {
        switch (
          this.pick(
            this.phase === 1
              ? [`flame`, `heat`, `wing`, `dive`, `gust`]
              : [`flame`, `heat`, `wing`, `dive`, `gust`, `embers`, `spin`, `wall`],
          )
        ) {
          case `flame`:
            return this.flamethrower();
          case `heat`:
            return this.heatWave();
          case `wing`:
            return this.airSlash();
          case `dive`:
            return this.skyAttack();
          case `gust`:
            return this.heatGust();
          case `embers`:
            return this.embers();
          case `wall`:
            return this.fireWall();
          default:
            return this.fireSpin();
        }
      }
      heatGust() {
        let e = this.run;
        return (
          (this.lock = 2.4),
          (this.gust = 2.2),
          (this.gustAcc = 0),
          (this.E.atkAnim[this.i] = 1.2),
          e.ui.popup(this.bx, this.by + 4.6, this.bz, c(`¡Remolino Ígneo!`), `#ffb03a`, 1),
          e.audio.whoosh(),
          3.4
        );
      }
      fireWall() {
        let e = this.run,
          t = e.player.pos,
          n = this.aimAt(t.x, t.z),
          r = this.phase >= 3 ? 2 : 1,
          i = F.range(-9, 9);
        for (let a = 0; a < r; a++) {
          let r = a === 0 ? i : i > 0 ? F.range(-9, -2) : F.range(2, 9),
            o = {
              ox: t.x - n.x * 14,
              oz: t.z - n.z * 14,
              dx: n.x,
              dz: n.z,
              s: 0,
              gap: r,
              hit: !1,
              delay: 1.1 + a * 1.3,
            };
          this.walls.push(o);
          for (let t = -15; t <= 15; t += 1.5) {
            if (Math.abs(t - r) < 2.2) continue;
            let i = o.ox - n.z * t,
              a = o.oz + n.x * t;
            e.vfx.ground.spawn({
              x: i,
              y: this.groundY(i, a) + 0.12,
              z: a,
              life: o.delay,
              size: 1.8,
              endSize: 1.8,
              color: 16742954,
              shape: I.Soft,
              glow: 0,
              rot: 0,
            });
          }
        }
        return (
          (this.E.atkAnim[this.i] = 1),
          e.ui.popup(this.bx, this.by + 4.6, this.bz, c(`¡Muro de Fuego!`), `#ff7a2a`, 1),
          e.audio.cone(`fire`, 1),
          3.6 + (r - 1) * 1.2
        );
      }
      flamethrower() {
        let e = this.run,
          t = e.player.pos,
          n = this.aimAt(t.x, t.z),
          r = Math.atan2(n.z, n.x),
          i = 0.45;
        this.lock = 2.4;
        for (let t = 3; t < 18; t += 2)
          for (let n = -1; n <= 1; n += 0.34) {
            let a = r + n * i,
              o = this.bx + Math.cos(a) * t,
              s = this.bz + Math.sin(a) * t;
            e.vfx.ground.spawn({
              x: o,
              y: this.groundY(o, s) + 0.12,
              z: s,
              life: 0.8,
              size: 1.6,
              endSize: 1.6,
              color: 16742954,
              shape: I.Soft,
              glow: 0,
              rot: 0,
            });
          }
        return (
          (this.E.atkAnim[this.i] = 1.2),
          e.later(0.8, () => {
            ((this.flame = { t: 1.4, a0: r - i, a1: r + i, acc: 0 }), e.audio.cone(`fire`, 1.4));
          }),
          3.6
        );
      }
      heatWave() {
        let e = this.run;
        for (let t = 0; t < 3; t++)
          e.later(t * 0.5, () => {
            let n = e.player.pos,
              r = this.aimAt(n.x, n.z),
              i = Math.atan2(r.z, r.x),
              a = 9 + this.phase * 2;
            for (let e = 0; e < a; e++) {
              let n = i + (e / (a - 1) - 0.5) * 1.6 + (t % 2) * 0.08;
              this.shot(Math.cos(n), Math.sin(n), 11, 0.55, {
                shape: I.PixFlame,
                color: 16777215,
                life: 2.6,
                size: 1.2,
              });
            }
            ((this.E.atkAnim[this.i] = 0.4), e.audio.shot(`fire`, 0.7));
          });
        return 3;
      }
      airSlash() {
        let e = this.run.player.pos,
          t = this.phase >= 3 ? 3 : 2,
          n = F.range(0, Math.PI);
        for (let r = 0; r < t; r++) {
          let i = n + (r / t) * Math.PI,
            a = Math.cos(i) * 11,
            o = Math.sin(i) * 11;
          this.line(e.x - a, e.z - o, e.x + a, e.z + o, 1.4, 0.95 + r * 0.1, 1.5, 16751162, !0, I.PixFeather);
        }
        return ((this.E.atkAnim[this.i] = 0.5), 2.4);
      }
      skyAttack() {
        let e = this.run,
          t = e.player.pos,
          n = this.aimAt(t.x, t.z),
          r = Gs(n.d + 8, 12, 30),
          i = { x: this.bx + n.x * r, z: this.bz + n.z * r };
        return (
          e.sanctuary?.confine(i.x, i.z, 3, i),
          (this.lock = 2.2),
          (this.E.atkAnim[this.i] = 1),
          this.line(this.bx, this.bz, i.x, i.z, 1.8, 1, 0, 16756794, !1, I.PixFlame),
          e.animate(1, () => {
            Math.random() < 0.6 &&
              e.vfx.norm.spawn({
                x: this.bx + F.range(-1, 1),
                y: this.by + F.range(0, 2),
                z: this.bz + F.range(-1, 1),
                vy: 2,
                life: 0.4,
                size: 1,
                endSize: 0.3,
                color: 16777215,
                shape: I.PixFlame,
              });
          }),
          e.later(1, () => {
            ((this.dive = { t: 0, dur: 0.5, x0: this.bx, z0: this.bz, x1: i.x, z1: i.z, hit: !1, trail: 0 }),
              e.audio.whoosh(),
              e.shake(0.2));
          }),
          3.2
        );
      }
      embers() {
        let e = this.run,
          t = e.player.pos,
          n = 5 + this.phase;
        this.E.atkAnim[this.i] = 0.8;
        for (let r = 0; r < n; r++) {
          let n = { x: t.x + (r ? F.range(-11, 11) : 0), z: t.z + (r ? F.range(-11, 11) : 0) };
          e.sanctuary?.confine(n.x, n.z, 2, n);
          let i = n.x,
            a = n.z,
            o = this.groundY(i, a),
            s = 1.2 + r * 0.1;
          this.circle(i, a, 2.8, s, 1.2, 16738858, I.PixFlame, () =>
            this.pools.push({ x: i, y: o, z: a, r: 2.4, t: 4 }),
          );
          let c = e.r.camera.position,
            l = Math.hypot(i - c.x, a - c.z) || 1,
            u = ((i - c.x) / l) * 4,
            d = ((a - c.z) / l) * 4;
          e.vfx.norm.spawn({
            x: i + u,
            y: o + 18,
            z: a + d,
            vx: -u / s,
            vy: -18 / s,
            vz: -d / s,
            life: s,
            size: 1.6,
            endSize: 1.8,
            color: 16777215,
            shape: I.PixFlame,
          });
        }
        return (e.audio.boom(0.5), 3.2);
      }
      fireSpin() {
        let e = this.run,
          t = this.phase >= 3 ? 3 : 2;
        for (let n = 0; n < t; n++)
          e.later(n * 0.9, () => {
            let t = e.player.pos;
            (this.rings.push({ x: t.x, z: t.z, r: 9, t: 1.6, hit: !1 }), e.audio.cone(`fire`, 0.8));
          });
        return ((this.E.atkAnim[this.i] = 0.6), 3.4);
      }
      ultimate() {
        let e = this.run,
          t = this.E,
          n = this.i;
        ((this.lock = 6.4), (this.cd = 3));
        let r = this.hx,
          i = this.hz + 8.5,
          a = this.hx,
          o = this.hz;
        ((t.x[n] = r),
          (t.z[n] = i),
          (t.y[n] = e.terrain.surface(r, i) + 1.1),
          e.vfx.ring(r, t.y[n] - 1, i, 6, 16747066, 0.6));
        for (let t = 0; t < 4; t++) e.later(0.5 + t * 0.8, () => this.embers());
        (e.animate(5, () => {
          if (Math.random() < 0.5) {
            let t = F.range(0, Math.PI * 2),
              n = F.range(4, 40),
              r = e.terrain.height(a + Math.cos(t) * n, o + Math.sin(t) * n) + 22;
            e.vfx.norm.spawn({
              x: a + Math.cos(t) * n,
              y: r,
              z: o + Math.sin(t) * n,
              vy: -9,
              life: 2,
              size: 0.5,
              endSize: 0.2,
              color: 16777215,
              shape: I.PixFlame,
            });
          }
        }),
          e.later(0.6, () =>
            this.cataclysm(
              r,
              t.y[n] + 6,
              i,
              4.4,
              3,
              0.45,
              16742954,
              c(`¡Fuego Sagrado!`),
              c(`Ponte a cubierto detrás de algo`),
            ),
          ));
      }
      tick(e) {
        let t = this.run,
          n = this.E,
          r = this.i,
          i = t.player.pos;
        if (this.flame) {
          let t = this.flame;
          ((t.t -= e), (t.acc += e * 28));
          let i = 1 - t.t / 1.4;
          for (; t.acc >= 1; ) {
            t.acc--;
            let e =
              t.a0 +
              (t.a1 - t.a0) * (0.5 + 0.5 * Math.sin(i * Math.PI * 2 - Math.PI / 2)) +
              F.range(-0.06, 0.06);
            this.shot(Math.cos(e), Math.sin(e), 15, 0.3, { shape: I.PixFlame, color: 16777215, life: 1.3 });
          }
          ((n.atkAnim[r] = 0.3), t.t <= 0 && (this.flame = null));
        }
        if (this.dive) {
          let a = this.dive;
          a.t += e;
          let o = Math.min(1, a.t / a.dur);
          ((n.x[r] = a.x0 + (a.x1 - a.x0) * o),
            (n.z[r] = a.z0 + (a.z1 - a.z0) * o),
            (n.vx[r] = n.vz[r] = 0),
            (n.y[r] = t.terrain.surface(n.x[r], n.z[r]) + 1.1));
          for (let e = 0; e < 3; e++)
            t.vfx.norm.spawn({
              x: n.x[r] + F.range(-0.8, 0.8),
              y: n.y[r] + F.range(0, 1.5),
              z: n.z[r] + F.range(-0.8, 0.8),
              vy: 2,
              life: 0.45,
              size: 1.3,
              endSize: 0.4,
              color: 16777215,
              shape: I.PixFlame,
            });
          ((a.trail -= e),
            a.trail <= 0 &&
              ((a.trail = 0.08),
              this.pools.push({ x: n.x[r], y: this.groundY(n.x[r], n.z[r]), z: n.z[r], r: 1.8, t: 3 })),
            !a.hit &&
              Math.hypot(i.x - n.x[r], i.z - n.z[r]) < 2.6 &&
              this.playerLow(this.groundY(i.x, i.z), 1.6) &&
              ((a.hit = !0), this.hurt(1.8, 0, `fire`)),
            o >= 1 &&
              ((this.dive = null),
              t.vfx.ring(n.x[r], n.y[r] - 1, n.z[r], 4, 16747066, 0.4),
              t.shake(0.3, n.x[r], n.z[r]),
              t.audio.boom(0.7),
              this.phase >= 2 &&
                this.ringShots(this.phase >= 3 ? 16 : 12, 9, 0.55, F.range(0, 1), {
                  shape: I.PixFlame,
                  color: 16777215,
                  size: 1.1,
                })));
        }
        for (let n = this.rings.length - 1; n >= 0; n--) {
          let r = this.rings[n];
          r.t -= e;
          let a = Math.max(1.2, r.r * (r.t / 1.6));
          for (let e = 0; e < 8; e++) {
            let e = F.range(0, Math.PI * 2),
              n = r.x + Math.cos(e) * a,
              i = r.z + Math.sin(e) * a;
            t.vfx.norm.spawn({
              x: n,
              y: this.groundY(n, i) + 0.4,
              z: i,
              vy: F.range(2, 4),
              life: 0.3,
              size: 1,
              endSize: 0.3,
              color: 16777215,
              shape: I.PixFlame,
            });
          }
          t.vfx.staticRing(r.x, this.groundY(r.x, r.z), r.z, a, 16738858, 0.8);
          let o = Math.hypot(i.x - r.x, i.z - r.z);
          (!r.hit &&
            Math.abs(o - a) < 1 &&
            this.playerLow(this.groundY(i.x, i.z), 1.3) &&
            ((r.hit = !0), this.hurt(1, 0, `fire`)),
            r.t <= 0 && (this.circle(r.x, r.z, 2.2, 0.01, 1.4, 16738858, I.PixFlame), this.rings.splice(n, 1)));
        }
        if (this.gust > 0) {
          ((this.gust -= e), (this.gustAcc += e));
          let a = i.x - n.x[r],
            o = i.z - n.z[r],
            s = Math.hypot(a, o) || 1;
          s < 30 && !this.dead && ((t.player.kx += (a / s) * 30 * e), (t.player.kz += (o / s) * 30 * e));
          for (let e = 0; e < 2; e++) {
            let e = F.range(0, Math.PI * 2),
              i = F.range(2, 14);
            t.vfx.norm.spawn({
              x: n.x[r] + Math.cos(e) * i,
              y: this.groundY(n.x[r] + Math.cos(e) * i, n.z[r] + Math.sin(e) * i) + F.range(0.3, 2),
              z: n.z[r] + Math.sin(e) * i,
              vx: Math.cos(e) * 9,
              vz: Math.sin(e) * 9,
              life: 0.5,
              size: 0.7,
              endSize: 0.2,
              color: 16777215,
              shape: I.PixFeather,
            });
          }
          for (; this.gustAcc >= 0.3; ) {
            this.gustAcc -= 0.3;
            let e = t.time * 2.4;
            for (let t = 0; t < 4; t++) {
              let n = e + (t / 4) * Math.PI * 2;
              this.shot(Math.cos(n), Math.sin(n), 10, 0.45, {
                shape: I.PixFeather,
                color: 16777215,
                life: 2.4,
              });
            }
          }
          n.atkAnim[r] = 0.4;
        }
        for (let n = this.walls.length - 1; n >= 0; n--) {
          let r = this.walls[n];
          if (r.delay > 0) {
            r.delay -= e;
            continue;
          }
          if (((r.s += e * 9), r.s > 28)) {
            this.walls.splice(n, 1);
            continue;
          }
          let a = r.ox + r.dx * r.s,
            o = r.oz + r.dz * r.s;
          for (let e = -15; e <= 15; e += 1.5) {
            if (Math.abs(e - r.gap) < 2.2 || Math.random() > 0.55) continue;
            let n = a - r.dz * e,
              i = o + r.dx * e;
            t.vfx.norm.spawn({
              x: n + F.range(-0.4, 0.4),
              y: this.groundY(n, i) + F.range(0.2, 1),
              z: i + F.range(-0.4, 0.4),
              vy: F.range(2, 4),
              life: 0.35,
              size: 1.3,
              endSize: 0.4,
              color: 16777215,
              shape: I.PixFlame,
            });
          }
          let s = i.x - a,
            c = i.z - o,
            l = s * r.dx + c * r.dz,
            u = -s * r.dz + c * r.dx;
          !r.hit &&
            Math.abs(l) < 0.9 &&
            Math.abs(u) < 15 &&
            Math.abs(u - r.gap) >= 2.2 &&
            this.playerLow(this.groundY(i.x, i.z), 1.3) &&
            ((r.hit = !0), this.hurt(1.4, 0.12, `fire`));
        }
        this.poolHurtT -= e;
        for (let n = this.pools.length - 1; n >= 0; n--) {
          let r = this.pools[n];
          ((r.t -= e),
            r.t <= 0
              ? this.pools.splice(n, 1)
              : (Math.random() < e * 5 &&
                  t.vfx.groundN.spawn({
                    x: r.x,
                    y: r.y + 0.1,
                    z: r.z,
                    life: 0.5,
                    size: r.r * 2,
                    endSize: r.r * 2,
                    color: 6957588,
                    shape: I.Soft,
                    rot: 0,
                  }),
                Math.random() < e * 8 &&
                  t.vfx.norm.spawn({
                    x: r.x + F.range(-r.r, r.r) * 0.7,
                    y: r.y + 0.2,
                    z: r.z + F.range(-r.r, r.r) * 0.7,
                    vy: F.range(1, 2.5),
                    life: 0.5,
                    size: 0.8,
                    endSize: 0.2,
                    color: 16777215,
                    endColor: 14707274,
                    shape: I.PixFlame,
                  }),
                this.poolHurtT <= 0 &&
                  (i.x - r.x) ** 2 + (i.z - r.z) ** 2 < r.r * r.r &&
                  i.y - r.y < 1 &&
                  ((this.poolHurtT = 0.5),
                  this.dead || t.player.hurt(t.player.maxHp * 0.03, `fire`, -1, NaN, NaN, !0, 0, this.i))));
        }
        (Math.random() < e * 14 &&
          t.vfx.norm.spawn({
            x: n.x[r] + F.range(-1.5, 1.5),
            y: n.y[r] + F.range(0.5, 2.5),
            z: n.z[r] + F.range(-1.5, 1.5),
            vy: F.range(1, 2),
            life: 0.5,
            size: 0.9,
            endSize: 0.2,
            color: 16777215,
            shape: I.PixFlame,
          }),
          this.phase >= 3 &&
            this.immune <= 0 &&
            !this.dive &&
            ((this.ultT -= e), this.ultT <= 0 && this.lock <= 0 && ((this.ultT = 14), this.ultimate())));
      }
      onPhase(e) {
        let t = this.run;
        ((this.dive = null), (this.gust = 0), (this.walls.length = 0));
        for (let n = 0; n < 3; n++)
          t.later(n * 0.2, () =>
            t.vfx.ring(this.bx, this.by - 1, this.bz, 6 + n * 7, e === 2 ? 16765034 : 16738858, 0.7),
          );
        for (let e = 0; e < 30; e++) {
          let e = F.range(0, Math.PI * 2),
            n = F.range(4, 10);
          t.vfx.norm.spawn({
            x: this.bx,
            y: this.by + 1,
            z: this.bz,
            vx: Math.cos(e) * n,
            vy: F.range(2, 6),
            vz: Math.sin(e) * n,
            drag: 2,
            life: 0.7,
            size: 1.4,
            endSize: 0.4,
            color: 16777215,
            shape: I.PixFlame,
          });
        }
        e === 3 && ((this.ultT = 2), (this.speed = 5.6));
      }
      render() {
        this.run.enemies.scale[this.i] = 2.8;
      }
    },
    ay = class extends Qv {
      float = !0;
      phaseNames = [c(`Genético`), c(`Barrera mental`), c(`Psicoataque`)];
      phaseColor = `#c08aff`;
      band = [8, 14];
      speed = 7.2;
      fade = 1;
      evadeCd = 4;
      clones = [];
      waves = [];
      rocks = [];
      pull = 0;
      pullHurtT = 0;
      heal = null;
      healCd = 0;
      bubbles = [];
      ultT = 10;
      get arena() {
        return this.run.mewtwo;
      }
      attack() {
        let e = this.phase,
          t = [`cut`, `blink`, `shadow`, `chain`];
        switch (
          (e >= 2 && t.push(`wave`, `clones`, `kinesis`),
          e >= 3 && (t.push(`gravity`), this.healCd <= 0 && this.hpFrac < 0.3 && t.push(`recover`)),
          this.pick(t))
        ) {
          case `cut`:
            return this.psychoCut();
          case `blink`:
            return this.blinkStrike(e >= 2 ? 2 : 1);
          case `shadow`:
            return this.shadowBall();
          case `chain`:
            return this.confusion();
          case `wave`:
            return this.psywave();
          case `clones`:
            return this.illusion();
          case `kinesis`:
            return this.telekinesis();
          case `gravity`:
            return this.gravity();
          default:
            return this.recover();
        }
      }
      psychoCut(e = this.bx, t = this.bz, n = this.phase >= 3 ? 3 : 2) {
        let r = this.run;
        for (let i = 0; i < n; i++)
          r.later(i * 0.32, () => {
            if (this.dead) return;
            let n = r.player.pos,
              a = Math.atan2(n.z - t, n.x - e);
            for (let n = 0; n < 5; n++) {
              let o = a + (n - 2) * 0.2 + (i % 2) * 0.1;
              r.projectiles.fire({
                x: e,
                y: this.groundY(e, t) + 1.6,
                z: t,
                dx: Math.cos(o),
                dz: Math.sin(o),
                speed: 17,
                life: 2.2,
                radius: 0.6,
                dmg: this.E.dmg[this.i] * 0.7,
                type: `psychic`,
                cls: `special`,
                flags: em.Hostile,
                from: this.i,
                size: 1.5,
                shape: I.Crescent,
                color: 13667071,
              });
            }
            ((this.E.atkAnim[this.i] = 0.3), r.audio.slash(`psychic`));
          });
        return 2;
      }
      blinkTo(e, t, n) {
        let r = this.run,
          i = this.E,
          a = this.i;
        ((this.lock = Math.max(this.lock, 0.5)),
          r.vfx.burst(this.bx, this.by + 1, this.bz, 12618495, 16, 7, I.PixSparkle, 0.5, 0.4),
          r.vfx.ring(this.bx, this.by - 1, this.bz, 3, 12618495, 0.3),
          r.audio.whoosh(),
          r.animate(
            0.16,
            (e) => {
              this.fade = 1 - e;
            },
            () => {
              let o = this.arena.confine(e, t, 2.5, { x: 0, z: 0 });
              ((i.x[a] = o.x),
                (i.z[a] = o.z),
                (i.y[a] = r.terrain.surface(o.x, o.z) + 1.1),
                (i.vx[a] = i.vz[a] = i.kx[a] = i.kz[a] = 0),
                r.vfx.ring(o.x, i.y[a] - 1, o.z, 3.5, 12618495, 0.35),
                r.animate(
                  0.12,
                  (e) => {
                    this.fade = e;
                  },
                  () => {
                    ((this.fade = 1), n?.());
                  },
                ));
            },
          ));
      }
      blinkStrike(e) {
        let t = this.run,
          n = this.phase >= 3 ? 0.45 : 0.6,
          r = (e) => {
            let i = t.player.pos,
              a = t.player.vel,
              o =
                Math.hypot(a.x, a.z) > 2 ? Math.atan2(a.z, a.x) + F.range(-0.6, 0.6) : F.range(0, Math.PI * 2);
            this.blinkTo(i.x + Math.cos(o) * 4.5, i.z + Math.sin(o) * 4.5, () => {
              ((this.E.atkAnim[this.i] = 0.6),
                this.circle(this.bx, this.bz, 4.6, n, 1.6, 11561727, I.Swirl, () => {
                  (this.ringShots(this.phase >= 3 ? 14 : 10, 11, 0.55, F.range(0, 1), {
                    shape: I.PixSparkle,
                    color: 16777215,
                    type: `psychic`,
                  }),
                    e > 1 &&
                      t.later(0.25, () => {
                        this.dead || r(e - 1);
                      }));
                }));
            });
          };
        return ((this.lock = 1.4), r(e), 2.4 + (e - 1) * 1.1);
      }
      shadowBall() {
        let e = this.run,
          t = this.phase >= 3 ? 3 : 2;
        for (let n = 0; n < t; n++)
          e.later(n * 0.35, () => {
            let r = this.attackTarget,
              i = this.aimAt(r.x, r.z),
              a = Math.atan2(i.z, i.x) + (n - (t - 1) / 2) * 0.7;
            (this.shot(Math.cos(a), Math.sin(a), 7.5, 1.2, {
              shape: I.Swirl,
              color: 8014591,
              homing: !0,
              life: 5,
              size: 2.2,
              type: `ghost`,
            }),
              (this.E.atkAnim[this.i] = 0.4),
              e.audio.shot(`ghost`, 0.8));
          });
        return 2.2;
      }
      confusion() {
        let e = this.run,
          t = 4 + this.phase;
        for (let n = 0; n < t; n++)
          e.later(n * 0.24, () => {
            if (this.dead) return;
            let t = e.player.pos;
            this.circle(t.x, t.z, 2.6, 0.55, 0.9, 16739032, I.Swirl);
          });
        return ((this.E.atkAnim[this.i] = 0.8), e.audio.shot(`psychic`, 0.7), 2.2 + t * 0.12);
      }
      psywave() {
        let e = this.run,
          t = this.phase >= 3 ? 3 : 2;
        ((this.lock = 0.6), (this.E.atkAnim[this.i] = 1));
        for (let n = 0; n < t; n++)
          e.later(0.5 + n * 0.7, () => {
            if (this.dead) return;
            let t = e.player.pos,
              n = Math.atan2(t.z - this.bz, t.x - this.bx) + (F.chance(0.5) ? 1 : -1) * F.range(0.9, 2.2);
            (this.waves.push({ x: this.bx, z: this.bz, r: 1.5, gap: n, half: 0.42, hit: !1 }),
              e.vfx.ring(this.bx, this.by - 1, this.bz, 4, 12618495, 0.3),
              e.audio.boom(0.4));
          });
        return 2.4 + t * 0.5;
      }
      illusion() {
        let e = this.run,
          t = e.player.pos,
          n = F.range(0, Math.PI * 2),
          r = [0, 1, 2].map((e) =>
            this.arena.confine(
              t.x + Math.cos(n + (e * Math.PI * 2) / 3) * 11,
              t.z + Math.sin(n + (e * Math.PI * 2) / 3) * 11,
              3,
              { x: 0, z: 0 },
            ),
          ),
          i = F.int(0, 2);
        for (let t = 0; t < 3; t++) {
          if (t === i) continue;
          let n = r[t];
          (this.clones.push({ x: n.x, z: n.z, t: this.phase >= 3 ? 7 : 5.5, acc: 0.6 + t * 0.3 }),
            e.vfx.burst(n.x, this.groundY(n.x, n.z) + 2, n.z, 12618495, 16, 6, I.PixSparkle, 0.5, 0.5));
        }
        return (
          this.blinkTo(r[i].x, r[i].z),
          e.ui.popup(this.bx, this.by + 4, this.bz, c(`¡Ilusión!`), `#c08aff`, 1),
          e.audio.power(),
          2.6
        );
      }
      telekinesis() {
        let e = this.run,
          t = e.player.pos,
          n = this.phase >= 3 ? 10 : 8;
        for (let r = 0; r < n; r++) {
          let i = (r / n) * Math.PI * 2 + F.range(-0.2, 0.2),
            a = F.range(8, 11),
            o = this.arena.confine(t.x + Math.cos(i) * a, t.z + Math.sin(i) * a, 1, { x: 0, z: 0 }),
            s = this.groundY(o.x, o.z);
          (this.rocks.push({ x: o.x, z: o.z, y: s, t: 1.1 + r * 0.16 }),
            e.vfx.dust(o.x, s, o.z, 10128040, 6, 4));
        }
        return (
          (this.E.atkAnim[this.i] = 1),
          e.ui.popup(this.bx, this.by + 4, this.bz, c(`¡Telequinesis!`), `#c08aff`, 1),
          e.audio.shot(`rock`, 0.7),
          3 + n * 0.08
        );
      }
      gravity() {
        let e = this.run;
        return (
          (this.lock = 2.6),
          (this.pull = 2.4),
          (this.pullHurtT = 0),
          e.ui.popup(this.bx, this.by + 4, this.bz, c(`¡Gravedad!`), `#c08aff`, 1.1),
          e.audio.alarm(),
          3.4
        );
      }
      recover() {
        let e = this.run;
        return (
          (this.heal = { t: 3.4, hp0: this.E.hp[this.i] }),
          (this.lock = 3.6),
          (this.healCd = 24),
          e.ui.banner(c(`¡Recuperación!`), c(`Golpéalo fuerte para interrumpirla`), `#7aff9a`, {
            species: this.species,
          }),
          e.audio.heal(),
          4
        );
      }
      psystrike() {
        let e = this.run,
          t = this.E,
          n = this.i,
          r = this.arena,
          i = e.player.pos;
        ((this.lock = 5.4),
          (this.cd = 2.5),
          (t.x[n] = r.cx),
          (t.z[n] = r.cz),
          (t.y[n] = e.terrain.surface(r.cx, r.cz) + 3.5),
          (t.vx[n] = t.vz[n] = 0),
          (this.bubbles = []));
        for (let e = 0; this.bubbles.length < 3 && e < 80; e++) {
          let e = F.range(0, Math.PI * 2),
            t = F.range(5, r.r - 4),
            n = r.cx + Math.cos(e) * t,
            a = r.cz + Math.sin(e) * t;
          Math.hypot(n - i.x, a - i.z) < 6 ||
            this.bubbles.some((e) => Math.hypot(e.x - n, e.z - a) < 9) ||
            this.bubbles.push({ x: n, z: a });
        }
        (e.ui.banner(c(`¡Psicoataque!`), c(`Métete en una burbuja de calma`), `#ff5a8a`, {
          species: this.species,
        }),
          e.audio.alarm());
        let a = 0;
        e.animate(
          4.2,
          (i) => {
            ((a -= 1 / 60),
              a <= 0 &&
                ((a = 0.55 - i * 0.38),
                e.vfx.ground.spawn({
                  x: r.cx,
                  y: this.groundY(r.cx, r.cz) + 0.15,
                  z: r.cz,
                  life: 0.7,
                  size: r.r * 2.2,
                  endSize: 4,
                  color: 11561727,
                  shape: I.Ring,
                  glow: 0.05,
                  rot: 0,
                })));
            for (let t of this.bubbles) {
              let n = this.groundY(t.x, t.z);
              (e.vfx.staticRing(t.x, n, t.z, 2.6, 10158032, 0.9),
                e.vfx.beams.spawn(t.x, n, t.z, t.x, n + 14, t.z, 1.6, 10158032, 0.05, 0.5),
                Math.random() < 0.5 &&
                  e.vfx.add.spawn({
                    x: t.x + F.range(-2, 2),
                    y: n + 0.2,
                    z: t.z + F.range(-2, 2),
                    vy: F.range(1, 3),
                    life: 0.8,
                    size: 0.4,
                    endSize: 0,
                    color: 13172712,
                    shape: I.Twinkle,
                    glow: 1,
                  }));
            }
            for (let r = 0; r < 3; r++) {
              let i = F.range(0, Math.PI * 2),
                a = F.range(3, 7);
              e.vfx.add.spawn({
                x: t.x[n] + Math.cos(i) * a,
                y: t.y[n] + F.range(-1, 2),
                z: t.z[n] + Math.sin(i) * a,
                vx: -Math.cos(i) * a * 1.6,
                vz: -Math.sin(i) * a * 1.6,
                life: 0.6,
                size: 0.5,
                endSize: 0.1,
                color: r ? 12618495 : 16777215,
                shape: I.Twinkle,
                glow: 1,
              });
            }
          },
          () => {
            let a = this.bubbles;
            ((this.bubbles = []), e.vfx.flash(r.cx, this.groundY(r.cx, r.cz) + 2, r.cz, 16777215, 30, 0.35));
            for (let t = 0; t < 3; t++)
              e.later(t * 0.12, () =>
                e.vfx.ring(
                  r.cx,
                  this.groundY(r.cx, r.cz),
                  r.cz,
                  r.r * (0.6 + t * 0.3),
                  t === 1 ? 16777215 : 11561727,
                  0.6,
                ),
              );
            (e.shake(1),
              e.audio.boom(1),
              e.hitstop(0.12),
              a.some((e) => (i.x - e.x) ** 2 + (i.z - e.z) ** 2 < 2.6 * 2.6)
                ? e.ui.popup(i.x, i.y + 2.4, i.z, c(`¡A salvo!`), `#7aff8a`, 0.9)
                : this.hurt(3, 0.4),
              (t.y[n] = e.terrain.surface(t.x[n], t.z[n]) + 1.1));
          },
        );
      }
      tick(e) {
        let t = this.run,
          n = this.E,
          r = this.i,
          i = t.player.pos,
          a = t.player;
        if (
          ((this.evadeCd -= e),
          (this.healCd -= e),
          this.evadeCd <= 0 &&
            this.lock <= 0 &&
            this.immune <= 0 &&
            Math.hypot(i.x - this.bx, i.z - this.bz) < 3.5)
        ) {
          this.evadeCd = this.phase >= 3 ? 2.6 : 3.6;
          let e = Math.atan2(this.bz - i.z, this.bx - i.x) + F.range(-1, 1);
          this.blinkTo(i.x + Math.cos(e) * 12, i.z + Math.sin(e) * 12, () => {
            this.phase >= 2 && this.psychoCut(this.bx, this.bz, 1);
          });
        }
        for (let n = this.clones.length - 1; n >= 0; n--) {
          let r = this.clones[n];
          ((r.t -= e),
            (r.acc -= e),
            r.acc <= 0 && ((r.acc = 1.3), this.psychoCut(r.x, r.z, 1)),
            r.t <= 0 &&
              (t.vfx.burst(r.x, this.groundY(r.x, r.z) + 2, r.z, 12618495, 12, 5, I.PixSparkle, 0.4, 0.4),
              this.clones.splice(n, 1)));
        }
        for (let n = this.waves.length - 1; n >= 0; n--) {
          let r = this.waves[n];
          r.r += e * 13;
          let a = Math.ceil(r.r * 1.4);
          for (let e = 0; e < a; e++) {
            let n = (e / a) * Math.PI * 2,
              i = Math.atan2(Math.sin(n - r.gap), Math.cos(n - r.gap));
            if (Math.abs(i) < r.half) continue;
            let o = r.x + Math.cos(n) * r.r,
              s = r.z + Math.sin(n) * r.r;
            t.vfx.add.spawn({
              x: o,
              y: this.groundY(o, s) + 0.5,
              z: s,
              life: 0.07,
              size: 0.9,
              endSize: 0.7,
              color: 11561727,
              shape: I.Soft,
              glow: 0.6,
            });
          }
          for (let e of [-1, 1]) {
            let n = r.gap + e * r.half,
              i = r.x + Math.cos(n) * r.r,
              a = r.z + Math.sin(n) * r.r;
            t.vfx.add.spawn({
              x: i,
              y: this.groundY(i, a) + 0.8,
              z: a,
              life: 0.08,
              size: 1,
              endSize: 0.6,
              color: 16777215,
              shape: I.Twinkle,
              glow: 1,
            });
          }
          let o = Math.hypot(i.x - r.x, i.z - r.z),
            s = Math.atan2(i.z - r.z, i.x - r.x),
            c = Math.abs(Math.atan2(Math.sin(s - r.gap), Math.cos(s - r.gap))) < r.half;
          (!r.hit &&
            Math.abs(o - r.r) < 0.9 &&
            !c &&
            this.playerLow(this.groundY(i.x, i.z), 1.3) &&
            ((r.hit = !0), this.hurt(1.3, 0, `psychic`)),
            r.r > this.arena.r * 2 && this.waves.splice(n, 1));
        }
        for (let n = this.rocks.length - 1; n >= 0; n--) {
          let a = this.rocks[n];
          a.t -= e;
          let o = Math.min(1, (1.6 - Math.max(0, a.t)) / 0.6),
            s = a.y + 0.4 + o * 2.2 + Math.sin(t.time * 6 + n) * 0.15;
          if (
            (t.orbitals.push(a.x, s, a.z, 1.4, 16777215, I.PixRock, t.time * 2 + n, 0),
            Math.random() < e * 10 &&
              t.vfx.add.spawn({
                x: a.x + F.range(-0.6, 0.6),
                y: s,
                z: a.z + F.range(-0.6, 0.6),
                vy: -1,
                life: 0.4,
                size: 0.4,
                endSize: 0,
                color: 12618495,
                shape: I.Twinkle,
                glow: 0.8,
              }),
            a.t <= 0)
          ) {
            if (!this.dead) {
              let e = i.x - a.x,
                n = i.y + 0.9 - s,
                o = i.z - a.z;
              (t.projectiles.fire({
                x: a.x,
                y: s,
                z: a.z,
                dx: e,
                dy: n,
                dz: o,
                speed: 19,
                life: 2,
                radius: 0.7,
                dmg: this.E.dmg[r] * 0.8,
                type: `rock`,
                cls: `special`,
                flags: em.Hostile,
                from: r,
                size: 1.5,
                shape: I.PixRock,
                color: 16777215,
              }),
                t.audio.whoosh());
            }
            this.rocks.splice(n, 1);
          }
        }
        if (this.pull > 0) {
          this.pull -= e;
          let n = this.bx - i.x,
            r = this.bz - i.z,
            o = Math.hypot(n, r) || 1;
          (o > 1.5 && ((a.vel.x += (n / o) * 34 * e), (a.vel.z += (r / o) * 34 * e)),
            t.vfx.staticRing(this.bx, this.groundY(this.bx, this.bz), this.bz, 4.5, 6961919, 0.9));
          for (let e = 0; e < 4; e++) {
            let e = F.range(0, Math.PI * 2),
              n = F.range(6, 14);
            t.vfx.add.spawn({
              x: this.bx + Math.cos(e) * n,
              y: this.by + F.range(-1, 1),
              z: this.bz + Math.sin(e) * n,
              vx: -Math.cos(e) * n * 1.8,
              vz: -Math.sin(e) * n * 1.8,
              life: 0.5,
              size: 0.4,
              endSize: 0,
              color: 9071359,
              shape: I.Soft,
              glow: 0.8,
            });
          }
          ((this.pullHurtT -= e),
            o < 4.5 && this.pullHurtT <= 0 && ((this.pullHurtT = 0.4), this.hurt(0.7, -1, `psychic`)));
        }
        if (this.heal) {
          let i = this.heal,
            a = n.maxHp[r];
          ((i.t -= e),
            (n.vx[r] = n.vz[r] = 0),
            Math.random() < e * 30 &&
              t.vfx.add.spawn({
                x: this.bx + F.range(-1.5, 1.5),
                y: this.by + F.range(-0.5, 2),
                z: this.bz + F.range(-1.5, 1.5),
                vy: 2.5,
                life: 0.6,
                size: 0.5,
                endSize: 0,
                color: 8060826,
                shape: I.PixHeart,
                glow: 0.5,
              }),
            i.hp0 - n.hp[r] >= a * 0.05
              ? ((this.heal = null),
                (this.lock = 2.2),
                (this.cd = 2.4),
                (n.stun[r] = 2.2),
                (n.flash[r] = 1),
                t.ui.popup(this.bx, this.by + 4, this.bz, c(`¡Interrumpida!`), `#ffd23a`, 1.2),
                t.vfx.burst(this.bx, this.by + 1.5, this.bz, 16765498, 24, 8, I.Star, 0.6, 0.6),
                t.audio.power())
              : i.t <= 0 &&
                ((this.heal = null),
                (n.hp[r] = Math.min(a * Kv[1], n.hp[r] + a * 0.08)),
                t.vfx.ring(this.bx, this.by - 1, this.bz, 6, 8060826, 0.5),
                t.ui.popup(this.bx, this.by + 4, this.bz, c(`+PS`), `#7aff9a`, 1.2)));
        }
        (Math.random() < e * 16 &&
          t.vfx.add.spawn({
            x: n.x[r] + F.range(-1.2, 1.2),
            y: n.y[r] + F.range(0, 2.6),
            z: n.z[r] + F.range(-1.2, 1.2),
            vy: F.range(0.5, 1.5),
            life: 0.6,
            size: 0.35,
            endSize: 0,
            color: 12618495,
            shape: I.Twinkle,
            glow: 1,
          }),
          this.phase >= 3 &&
            this.immune <= 0 &&
            !this.heal &&
            ((this.ultT -= e), this.ultT <= 0 && this.lock <= 0 && ((this.ultT = 14), this.psystrike())));
      }
      onPhase(e) {
        let t = this.run,
          n = this.arena,
          r = t.player;
        ((this.clones.length = 0),
          (this.heal = null),
          (this.pull = 0),
          this.blinkTo(n.cx, n.cz),
          t.later(0.3, () => {
            t.vfx.flash(n.cx, this.groundY(n.cx, n.cz) + 2, n.cz, 12618495, 16, 0.3);
            for (let e = 0; e < 3; e++)
              t.later(e * 0.15, () =>
                t.vfx.ring(n.cx, this.groundY(n.cx, n.cz), n.cz, 8 + e * 7, e === 1 ? 16777215 : 12618495, 0.6),
              );
            let e = r.pos.x - n.cx,
              i = r.pos.z - n.cz,
              a = Math.hypot(e, i) || 1;
            a < 12 && r.shove(e / a, i / a, 16);
          }),
          n.onPhase(e),
          e === 2 && (this.speed = 7.8),
          e === 3 && ((this.ultT = 2.5), (this.speed = 8.4), (this.band = [9, 15])));
      }
      render() {
        let e = this.run;
        if (((this.run.enemies.scale[this.i] = 2.5 * Math.max(0.05, this.fade)), !this.clones.length)) return;
        let t = e.sprites.get(this.species),
          n = e.player.pos;
        for (let r of this.clones) {
          let i = e.terrain.surface(r.x, r.z) + 1.1,
            a = Math.min(1, r.t * 2);
          t.push(
            r.x,
            i + Math.sin(e.time * 3 + r.x) * 0.15,
            r.z,
            `walk`,
            e.time,
            e.sprites.dirRow(n.x - r.x, n.z - r.z),
            2.5,
            0.15,
            1 - a * 0.85,
            1,
            0,
            0.9,
            0.75,
            1.2,
            0.35,
            !1,
          );
        }
      }
    };
  function oy(e, t) {
    switch (e.enemies.species[t]) {
      case 251:
        return new $v(e, t);
      case 640:
        return new ey(e, t);
      case 492:
        return new ty(e, t);
      case 383:
        return new ny(e, t);
      case finalBossSpecies: {
        // Keep the forest sanctuary's phase, cover and attack sequence.
        const kit = new ry(e, t), form = formCopy[finalBossSpecies];
        kit.ultimateName = form.ultimate[1];
        kit.phaseNames = [form.moves['龙尾'], form.moves['魂舞烈音爆'], kit.ultimateName];
        return kit;
      }
      case 151:
        return new ry(e, t);
      case 146:
        return new iy(e, t);
      case 150:
        return new ay(e, t);
      default:
        return null;
    }
  }
  var sy = Math.PI * 2,
    cy = (e, t, n) => e.terrain.height(t, n);
  function ly(e, t, n, r, i, a, o) {
    let s = Math.hypot(r - t, i - n) || 1,
      c = Math.max(1, Math.floor(s / a));
    for (let a = 0; a <= c; a++) {
      let s = a / c,
        l = t + (r - t) * s,
        u = n + (i - n) * s;
      o(l, cy(e, l, u), u, s);
    }
  }
  function uy(e, t, n, r) {
    let i = e.r.camera.position,
      a = i.x - t,
      o = i.z - n,
      s = Math.hypot(a, o) || 1;
    return { x: t + (a / s) * r, z: n + (o / s) * r };
  }
  function dy(e, t, n, r, i, a, o, s, c = 1, l = 0) {
    e.vfx.groundN.spawn({
      x: t,
      y: n + 0.09,
      z: r,
      life: s,
      size: i,
      endSize: i,
      color: o,
      shape: a,
      rot: Math.atan2(l, c),
    });
  }
  var fy = {
      123: {
        tele(e, t, n, r, i, a) {
          ly(e, t, n, r, i, 2.6, (o, s, c) => dy(e, o, s, c, 1.3, I.PixSlash, 16777215, a, r - t, i - n));
        },
        strike(e, t, n, r, i, a, o) {
          e.vfx.beams.spawn(t, n, r, i, a, o, 0.35, 16777215, 0.18);
          let s = F.chance(0.5) ? 1 : -1;
          ly(e, t, r, i, o, 2, (t, n, r, i) =>
            e.later(i * 0.12, () => {
              (e.vfx.norm.spawn({
                x: t,
                y: n + 1.2,
                z: r,
                life: 0.26,
                size: 3.2,
                endSize: 3.8,
                color: 16777215,
                shape: I.PixSlash,
                rot: s * 0.4 + i * 0.6 * s,
              }),
                Math.random() < 0.5 &&
                  e.vfx.add.spawn({
                    x: t,
                    y: n + 1,
                    z: r,
                    vx: F.range(-3, 3),
                    vy: F.range(1, 4),
                    vz: F.range(-3, 3),
                    drag: 2,
                    life: 0.4,
                    size: 0.5,
                    endSize: 0,
                    color: 13172570,
                    shape: I.Leaf,
                    glow: 0.4,
                    spin: 8,
                  }));
            }),
          );
        },
        dash(e, t, n, r) {
          (Math.random() < 0.5 &&
            e.vfx.norm.spawn({
              x: t,
              y: n + 1,
              z: r,
              life: 0.16,
              size: 2,
              endSize: 2.4,
              color: 16777215,
              shape: I.PixSlash,
              rot: F.range(-1, 1),
            }),
            Math.random() < 0.4 &&
              e.vfx.add.spawn({
                x: t + F.range(-0.6, 0.6),
                y: n + F.range(0.4, 1.6),
                z: r + F.range(-0.6, 0.6),
                life: 0.3,
                size: 0.4,
                endSize: 0,
                color: 14221210,
                shape: I.Twinkle,
                glow: 0.5,
              }));
        },
      },
      26: {
        tele(e, t, n, r, i, a) {
          ly(e, t, n, r, i, 2.4, (t, n, r) => {
            for (let i = 0; i < 3; i++)
              e.later(F.range(0, a * 0.9), () =>
                e.vfx.norm.spawn({
                  x: t + F.range(-0.5, 0.5),
                  y: n + F.range(0.2, 0.8),
                  z: r + F.range(-0.5, 0.5),
                  life: 0.12,
                  size: 0.7,
                  endSize: 0.5,
                  color: 16777215,
                  shape: I.PixBolt,
                  rot: F.range(-0.6, 0.6),
                }),
              );
          });
        },
        strike(e, t, n, r, i, a, o) {
          (e.vfx.lightning(t, n - 0.6, r, i, a - 0.6, o, 16769354, 0.45, 10, 0.2),
            ly(e, t, r, i, o, 5, (t, n, r, i) =>
              e.later(i * 0.12, () => {
                e.vfx.lightning(
                  t + F.range(-1, 1),
                  n + 10,
                  r + F.range(-1, 1),
                  t,
                  n + 0.2,
                  r,
                  16774816,
                  0.4,
                  5,
                  0.16,
                );
                for (let i = 0; i < 3; i++)
                  e.vfx.norm.spawn({
                    x: t,
                    y: n + 7 + i * 2.2,
                    z: r,
                    vy: -46,
                    life: 0.15 + i * 0.045,
                    size: 2.4,
                    endSize: 2.4,
                    color: 16777215,
                    shape: I.PixBolt,
                  });
                (e.later(0.15, () =>
                  e.vfx.norm.spawn({
                    x: t,
                    y: n + 1.2,
                    z: r,
                    life: 0.22,
                    size: 2.6,
                    endSize: 1.8,
                    color: 16777215,
                    shape: I.PixBolt,
                  }),
                ),
                  e.vfx.flash(t, n + 0.6, r, 16769354, 1.8, 0.12),
                  dy(e, t, n, r, 1.8, I.PixCrack, 9075274, 1.2, F.range(-1, 1), 1));
              }),
            ),
            e.audio.zap());
        },
        dash(e, t, n, r) {
          (Math.random() < 0.6 &&
            e.vfx.norm.spawn({
              x: t + F.range(-0.7, 0.7),
              y: n + F.range(0.3, 1.5),
              z: r + F.range(-0.7, 0.7),
              life: 0.14,
              size: 0.9,
              endSize: 0.6,
              color: 16777215,
              shape: I.PixBolt,
              rot: F.range(-0.8, 0.8),
            }),
            Math.random() < 0.25 &&
              e.vfx.lightning(
                t,
                n + 1.2,
                r,
                t + F.range(-2, 2),
                n + F.range(0, 2),
                r + F.range(-2, 2),
                16769354,
                0.2,
                3,
                0.1,
              ));
        },
      },
      59: {
        tele(e, t, n, r, i, a) {
          ly(e, t, n, r, i, 2, (t, n, r) => {
            for (let i = 0; i < 2; i++)
              e.later(F.range(0, a * 0.9), () =>
                e.vfx.norm.spawn({
                  x: t + F.range(-0.4, 0.4),
                  y: n + 0.2,
                  z: r + F.range(-0.4, 0.4),
                  vy: F.range(1, 2),
                  life: 0.4,
                  size: 0.4,
                  endSize: 0.15,
                  color: 16777215,
                  endColor: 14707274,
                  shape: I.PixFlame,
                }),
              );
          });
        },
        strike(e, t, n, r, i, a, o) {
          (ly(e, t, r, i, o, 1.2, (t, n, r, i) =>
            e.later(i * 0.25, () => {
              (e.vfx.norm.spawn({
                x: t,
                y: n + 0.6,
                z: r,
                vx: F.range(-0.6, 0.6),
                vy: F.range(2, 4),
                vz: F.range(-0.6, 0.6),
                drag: 1.5,
                life: F.range(0.35, 0.55),
                size: 1.5,
                endSize: 0.5,
                color: 16777215,
                endColor: 14707274,
                shape: I.PixFlame,
                rot: F.range(-0.15, 0.15),
              }),
                Math.random() < 0.35 &&
                  e.vfx.norm.spawn({
                    x: t,
                    y: n + 1.4,
                    z: r,
                    vy: 1.6,
                    drag: 1.5,
                    life: 0.9,
                    size: 0.7,
                    endSize: 1.8,
                    color: 5917258,
                    endColor: 3813938,
                    shape: I.PixPuff,
                  }),
                dy(e, t, n, r, 1.6, I.Soft, 2759704, 2.4));
            }),
          ),
            e.vfx.beams.spawn(t, n - 0.3, r, i, a - 0.3, o, 0.5, 16756794, 0.2));
        },
        dash(e, t, n, r, i, a) {
          for (let o = 0; o < 2; o++)
            e.vfx.norm.spawn({
              x: t - i * 0.8 + F.range(-0.5, 0.5),
              y: n + F.range(0.3, 1.2),
              z: r - a * 0.8 + F.range(-0.5, 0.5),
              vy: 1.5,
              life: 0.35,
              size: 0.9,
              endSize: 0.3,
              color: 16777215,
              endColor: 14707274,
              shape: I.PixFlame,
            });
        },
      },
      127: {
        land(e, t, n, r, i) {
          dy(e, t, n, r, i * 1.15, I.PixCrack, 16777215, 2.2, F.range(-1, 1), 1);
          for (let i = 0; i < 14; i++) {
            let i = F.range(0, sy),
              a = F.range(3, 8);
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.5,
              z: r,
              vx: Math.cos(i) * a,
              vy: F.range(6, 11),
              vz: Math.sin(i) * a,
              gravity: 24,
              drag: 0.5,
              life: F.range(0.8, 1.1),
              size: F.range(0.8, 1.3),
              endSize: 0.6,
              color: 16777215,
              shape: I.PixRock,
              spin: F.range(-6, 6),
            });
          }
        },
        shard: I.PixRock,
      },
      62: {
        preland(e, t, n, r, i) {
          let a = uy(e, t, r, 0.6);
          e.vfx.norm.spawn({
            x: a.x,
            y: n + 11,
            z: a.z,
            vy: -7.5 / i,
            life: i,
            size: 4.4,
            endSize: 4.8,
            color: 14216447,
            shape: I.PixFist,
          });
        },
        land(e, t, n, r, i) {
          let a = uy(e, t, r, 0.6);
          (e.vfx.add.spawn({
            x: a.x,
            y: n + 3,
            z: a.z,
            life: 0.3,
            size: 3.5,
            endSize: 6.5,
            color: 16756794,
            shape: I.Star,
            glow: 0.4,
            rot: F.range(0, 1),
          }),
            e.vfx.norm.spawn({
              x: a.x,
              y: n + 3.4,
              z: a.z,
              life: 0.3,
              size: 4.8,
              endSize: 5.4,
              color: 14216447,
              shape: I.PixFist,
            }));
          for (let i = 0; i < 18; i++) {
            let i = F.range(0, sy),
              a = F.range(3, 7);
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.4,
              z: r,
              vx: Math.cos(i) * a,
              vy: F.range(5, 10),
              vz: Math.sin(i) * a,
              gravity: 22,
              life: F.range(0.6, 0.9),
              size: F.range(0.4, 0.7),
              endSize: 0.2,
              color: 16777215,
              shape: I.PixDrop,
            });
          }
          for (let a = 0; a < 6; a++) {
            let o = (a / 6) * sy;
            e.vfx.norm.spawn({
              x: t + Math.cos(o) * i * 0.6,
              y: n + 0.6,
              z: r + Math.sin(o) * i * 0.6,
              vy: 1,
              life: 0.45,
              size: 1.6,
              endSize: 1.2,
              color: 16777215,
              shape: I.PixWave,
            });
          }
          e.vfx.ring(t, n, r, i * 1.1, 6994175, 0.5);
        },
        shard: I.PixDrop,
      },
      53: {
        land(e, t, n, r, i) {
          let a = uy(e, t, r, 0.6);
          for (let t = 0; t < 3; t++)
            e.later(t * 0.06, () =>
              e.vfx.norm.spawn({
                x: a.x,
                y: n + 3.2 - t * 0.3,
                z: a.z,
                life: 0.3,
                size: 4.4 - t * 0.4,
                endSize: 4.8 - t * 0.4,
                color: 16777215,
                shape: I.PixClaw,
                rot: -0.25 + t * 0.12,
              }),
            );
          dy(e, t, n, r, i * 1.3, I.PixClaw, 5914672, 2.2, 1, 0.4);
          for (let i = 0; i < 8; i++) {
            let i = F.range(0, sy),
              a = F.range(2, 6);
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.4,
              z: r,
              vx: Math.cos(i) * a,
              vy: F.range(4, 8),
              vz: Math.sin(i) * a,
              gravity: 22,
              life: 0.7,
              size: 0.5,
              endSize: 0.3,
              color: 16777215,
              shape: I.PixRock,
              spin: F.range(-6, 6),
            });
          }
        },
        shard: I.PixClaw,
      },
      34: {
        dash(e, t, n, r, i, a) {
          (e.vfx.norm.spawn({
            x: t + i * 1.4,
            y: n + 1,
            z: r + a * 1.4,
            life: 0.05,
            size: 2.4,
            endSize: 2.4,
            color: 14199039,
            shape: I.PixHorn,
          }),
            e.vfx.beams.spawn(
              t - i * 0.5,
              n + F.range(0.4, 1.6),
              r - a * 0.5,
              t - i * 4,
              n + F.range(0.4, 1.6),
              r - a * 4,
              0.12,
              16777215,
              0.12,
            ),
            Math.random() < 0.5 &&
              e.vfx.norm.spawn({
                x: t - i,
                y: n + 0.2,
                z: r - a,
                vy: 1,
                life: 0.5,
                size: 0.6,
                endSize: 1.4,
                color: 14207144,
                shape: I.PixPuff,
                drag: 2,
              }));
        },
      },
      76: {
        tele(e, t, n, r, i, a) {
          ly(e, t, n, r, i, 3, (t, n, r) =>
            e.later(F.range(0, a * 0.8), () =>
              e.vfx.norm.spawn({
                x: t,
                y: n + 0.2,
                z: r,
                vy: 0.6,
                life: 0.5,
                size: 0.5,
                endSize: 1,
                color: 14205082,
                shape: I.PixPuff,
              }),
            ),
          );
        },
        dash(e, t, n, r, i, a) {
          for (let o = 0; o < 2; o++)
            e.vfx.norm.spawn({
              x: t - i * 0.6 + F.range(-0.8, 0.8),
              y: n + F.range(0.2, 0.9),
              z: r - a * 0.6 + F.range(-0.8, 0.8),
              vx: -i * 2,
              vy: F.range(0.6, 1.6),
              vz: -a * 2,
              drag: 2,
              life: 0.6,
              size: 0.9,
              endSize: 2,
              color: 14205082,
              endColor: 11047024,
              shape: I.PixPuff,
            });
          (Math.random() < 0.35 &&
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.3,
              z: r,
              vx: -i * 3 + F.range(-2, 2),
              vy: F.range(4, 7),
              vz: -a * 3 + F.range(-2, 2),
              gravity: 22,
              life: 0.6,
              size: 0.45,
              endSize: 0.3,
              color: 16777215,
              shape: I.PixRock,
              spin: 8,
            }),
            Math.random() < 0.5 && dy(e, t, n, r, 1.6, I.Soft, 6968384, 1.8));
        },
      },
      55: {
        tele(e, t, n, r, i, a) {
          ly(e, t, n, r, i, 3, (t, n, r, i) =>
            e.later(i * a * 0.8, () => e.vfx.ring(t, n, r, 1.3, 5949695, 0.4, 0.3)),
          );
        },
        dash(e, t, n, r, i, a) {
          e.vfx.norm.spawn({
            x: t + i * 1.2,
            y: n + 1,
            z: r + a * 1.2,
            life: 0.05,
            size: 2.4,
            endSize: 2.4,
            color: 16777215,
            shape: I.PixWave,
          });
          for (let o = 0; o < 2; o++)
            e.vfx.norm.spawn({
              x: t + F.range(-0.6, 0.6),
              y: n + F.range(0.4, 1.4),
              z: r + F.range(-0.6, 0.6),
              vx: -i * 4 + F.range(-2, 2),
              vy: F.range(2, 5),
              vz: -a * 4 + F.range(-2, 2),
              gravity: 18,
              life: 0.5,
              size: 0.45,
              endSize: 0.2,
              color: 16777215,
              shape: I.PixDrop,
            });
          Math.random() < 0.3 && e.vfx.ring(t, n, r, 1.6, 5949695, 0.4, 0.3);
        },
      },
      28: {
        tele(e, t, n, r, i, a) {
          ly(e, t, n, r, i, 2.6, (o, s, c) => dy(e, o, s, c, 1.4, I.PixClaw, 9068608, a, r - t, i - n));
        },
        strike(e, t, n, r, i, a, o) {
          (ly(e, t, r, i, o, 2.2, (t, n, r, i) =>
            e.later(i * 0.14, () => {
              (e.vfx.norm.spawn({
                x: t,
                y: n + 1.1,
                z: r,
                life: 0.26,
                size: 2.8,
                endSize: 3.2,
                color: 16777215,
                shape: I.PixClaw,
                rot: F.range(-0.3, 0.3),
              }),
                e.vfx.norm.spawn({
                  x: t,
                  y: n + 0.3,
                  z: r,
                  vx: F.range(-2, 2),
                  vy: F.range(1, 3),
                  vz: F.range(-2, 2),
                  drag: 2,
                  life: 0.6,
                  size: 0.8,
                  endSize: 1.6,
                  color: 15255696,
                  shape: I.PixPuff,
                }));
            }),
          ),
            e.vfx.beams.spawn(t, n, r, i, a, o, 0.3, 16773320, 0.16));
        },
        dash(e, t, n, r, i, a) {
          (Math.random() < 0.5 &&
            e.vfx.norm.spawn({
              x: t + i,
              y: n + 1,
              z: r + a,
              life: 0.14,
              size: 2,
              endSize: 2.2,
              color: 16777215,
              shape: I.PixClaw,
              rot: F.range(-0.5, 0.5),
            }),
            e.vfx.norm.spawn({
              x: t - i * 0.6,
              y: n + 0.3,
              z: r - a * 0.6,
              vx: -i * 2,
              vy: 1,
              vz: -a * 2,
              drag: 2,
              life: 0.5,
              size: 0.8,
              endSize: 1.6,
              color: 15255696,
              shape: I.PixPuff,
            }));
        },
      },
      106: {
        preland(e, t, n, r, i) {
          for (let a = 0; a < 6; a++) {
            let o = (a / 6) * sy,
              s = F.range(0.6, 2);
            e.vfx.beams.spawn(
              t + Math.cos(o) * s,
              n + 9,
              r + Math.sin(o) * s,
              t + Math.cos(o) * s,
              n + 3,
              r + Math.sin(o) * s,
              0.12,
              16777215,
              i,
            );
          }
        },
        land(e, t, n, r, i) {
          let a = uy(e, t, r, 0.6);
          (e.vfx.add.spawn({
            x: a.x,
            y: n + 1.6,
            z: a.z,
            life: 0.3,
            size: 3,
            endSize: 6,
            color: 16756842,
            shape: I.Star,
            glow: 0.4,
            rot: F.range(0, 1),
          }),
            dy(e, t, n, r, i * 1.2, I.PixCrack, 16777215, 2, F.range(-1, 1), 1));
          for (let i = 0; i < 10; i++) {
            let a = (i / 10) * sy;
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.4,
              z: r,
              vx: Math.cos(a) * 7,
              vy: 1,
              vz: Math.sin(a) * 7,
              drag: 3,
              life: 0.6,
              size: 1,
              endSize: 2,
              color: 15255696,
              shape: I.PixPuff,
            });
          }
        },
      },
      85: {
        tele(e, t, n, r, i, a) {
          ly(e, t, n, r, i, 3, (t, n, r, i) =>
            e.later(i * a * 0.7, () =>
              e.vfx.norm.spawn({
                x: t,
                y: n + 0.4,
                z: r,
                vy: -0.5,
                life: 0.6,
                size: 0.9,
                endSize: 0.7,
                color: 16777215,
                shape: I.PixFeather,
                rot: F.range(-1, 1),
              }),
            ),
          );
        },
        dash(e, t, n, r, i, a) {
          let o = e.time * 30;
          for (let s = 0; s < 3; s++) {
            let c = o + (s / 3) * sy;
            e.vfx.norm.spawn({
              x: t + i * 0.8 - a * Math.cos(c) * 0.9,
              y: n + 1.2 + Math.sin(c) * 0.9,
              z: r + a * 0.8 + i * Math.cos(c) * 0.9,
              life: 0.18,
              size: 0.9,
              endSize: 0.5,
              color: 16777215,
              shape: I.PixFeather,
              rot: c,
            });
          }
          e.vfx.beams.spawn(
            t - i * 0.5,
            n + 1.2,
            r - a * 0.5,
            t - i * 4,
            n + 1.2,
            r - a * 4,
            0.18,
            16773336,
            0.12,
          );
        },
      },
      105: {
        tele(e, t, n, r, i, a) {
          ly(e, t, n, r, i, 3, (o, s, c) => dy(e, o, s, c, 1.1, I.PixBone, 13154464, a, r - t, i - n));
        },
        strike(e, t, n, r, i, a, o) {
          let s = Math.hypot(i - t, o - r) || 1,
            c = (i - t) / s,
            l = (o - r) / s,
            u = 0.4,
            d = (n + a) / 2 + 0.2;
          (e.vfx.norm.spawn({
            x: t,
            y: d,
            z: r,
            vx: (c * s) / u,
            vz: (l * s) / u,
            life: u,
            size: 2.2,
            endSize: 2.2,
            color: 16777215,
            shape: I.PixBone,
            spin: 22,
          }),
            e.vfx.norm.spawn({
              x: i,
              y: d,
              z: o,
              vx: (-c * s) / u,
              vz: (-l * s) / u,
              life: u,
              size: 2.2,
              endSize: 2.2,
              color: 16777215,
              shape: I.PixBone,
              spin: -22,
            }),
            ly(e, t, r, i, o, 3, (t, n, r, i) => e.later(i * u, () => e.vfx.dust(t, n, r, 15255696, 2, 3))));
        },
        dash(e, t, n, r) {
          let i = e.time * 14;
          e.vfx.norm.spawn({
            x: t + Math.cos(i) * 1.4,
            y: n + 1.2,
            z: r + Math.sin(i) * 1.4,
            life: 0.1,
            size: 1.4,
            endSize: 1.4,
            color: 16777215,
            shape: I.PixBone,
            rot: i,
          });
        },
      },
      68: {
        land(e, t, n, r, i) {
          dy(e, t, n, r, i * 1.4, I.PixCrack, 16777215, 2.4, F.range(-1, 1), 1);
          for (let i = 0; i < 14; i++) {
            let a = (i / 14) * sy;
            e.vfx.norm.spawn({
              x: t + Math.cos(a) * 1.5,
              y: n + 0.5,
              z: r + Math.sin(a) * 1.5,
              vx: Math.cos(a) * 9,
              vy: 1.5,
              vz: Math.sin(a) * 9,
              drag: 2.5,
              life: 0.7,
              size: 1.3,
              endSize: 2.6,
              color: 15255696,
              shape: I.PixPuff,
            });
          }
          for (let i = 0; i < 8; i++) {
            let i = F.range(0, sy),
              a = F.range(3, 7);
            e.vfx.norm.spawn({
              x: t,
              y: n + 0.5,
              z: r,
              vx: Math.cos(i) * a,
              vy: F.range(5, 9),
              vz: Math.sin(i) * a,
              gravity: 24,
              life: 0.8,
              size: 0.8,
              endSize: 0.5,
              color: 16777215,
              shape: I.PixRock,
              spin: 6,
            });
          }
        },
        shard: I.PixRock,
      },
      112: {
        tele(e, t, n, r, i, a) {
          ly(e, t, n, r, i, 2, (t, n, r) =>
            e.later(F.range(0, a * 0.8), () =>
              e.vfx.norm.spawn({
                x: t,
                y: n + 0.3,
                z: r,
                vy: 2,
                life: 0.4,
                size: 0.5,
                endSize: 0.3,
                color: 13154456,
                shape: I.Shard,
                rot: F.range(-0.4, 0.4),
              }),
            ),
          );
        },
        dash(e, t, n, r, i, a) {
          for (let o = 0; o < 3; o++) {
            let o = Math.atan2(a, i) + Math.PI + F.range(-1.2, 1.2),
              s = F.range(5, 10);
            e.vfx.norm.spawn({
              x: t,
              y: n + F.range(0.5, 1.6),
              z: r,
              vx: Math.cos(o) * s,
              vy: F.range(0, 2),
              vz: Math.sin(o) * s,
              life: 0.35,
              size: 0.5,
              endSize: 0.4,
              color: 10127986,
              shape: I.Shard,
              rot: o,
            });
          }
          Math.random() < 0.5 &&
            e.vfx.norm.spawn({
              x: t - i,
              y: n + 0.3,
              z: r - a,
              vy: 1,
              drag: 2,
              life: 0.5,
              size: 0.7,
              endSize: 1.4,
              color: 15255696,
              shape: I.PixPuff,
            });
        },
      },
      31: {
        tele(e, t, n, r, i, a) {
          ly(e, t, n, r, i, 2, (t, n, r) => dy(e, t, n, r, 1.6, I.PixCrack, 16751210, a, F.range(-1, 1), 1));
        },
        strike(e, t, n, r, i, a, o) {
          (ly(e, t, r, i, o, 1.6, (t, n, r, i) =>
            e.later(i * 0.3, () => {
              for (let i = 0; i < 2; i++)
                e.vfx.norm.spawn({
                  x: t + F.range(-0.4, 0.4),
                  y: n + 0.4,
                  z: r + F.range(-0.4, 0.4),
                  vy: F.range(6, 10),
                  drag: 1.5,
                  life: F.range(0.4, 0.6),
                  size: 1.4,
                  endSize: 0.5,
                  color: 16777215,
                  endColor: 14707274,
                  shape: I.PixFlame,
                });
              (Math.random() < 0.4 &&
                e.vfx.norm.spawn({
                  x: t,
                  y: n + 0.5,
                  z: r,
                  vx: F.range(-3, 3),
                  vy: F.range(6, 10),
                  vz: F.range(-3, 3),
                  gravity: 24,
                  life: 0.8,
                  size: 0.6,
                  endSize: 0.4,
                  color: 16777215,
                  shape: I.PixRock,
                  spin: 6,
                }),
                dy(e, t, n, r, 1.6, I.Soft, 2759704, 2.4));
            }),
          ),
            e.audio.boom(0.5));
        },
        dash(e, t, n, r, i, a) {
          e.vfx.norm.spawn({
            x: t - i * 0.8 + F.range(-0.4, 0.4),
            y: n + F.range(0.4, 1.4),
            z: r - a * 0.8 + F.range(-0.4, 0.4),
            vy: 1.5,
            life: 0.4,
            size: 1,
            endSize: 0.3,
            color: 16777215,
            endColor: 14707274,
            shape: I.PixFlame,
          });
        },
      },
      142: {
        land(e, t, n, r, i) {
          dy(e, t, n, r, i * 1.2, I.PixCrack, 16777215, 2.2, F.range(-1, 1), 1);
          for (let n = 0; n < 12; n++) {
            let a = (n / 12) * sy + F.range(-0.1, 0.1),
              o = i * F.range(0.55, 0.95),
              s = t + Math.cos(a) * o,
              c = r + Math.sin(a) * o;
            e.later(n * 0.025, () =>
              e.vfx.norm.spawn({
                x: s,
                y: cy(e, s, c) + 1,
                z: c,
                vy: 5,
                drag: 6,
                life: 0.9,
                size: F.range(2, 2.8),
                endSize: 2,
                color: 16777215,
                shape: I.PixSpike,
              }),
            );
          }
          e.vfx.dust(t, n, r, 13150328, 10, 6);
        },
        shard: I.PixRock,
      },
      149: {
        tele(e, t, n, r, i, a) {
          ly(e, t, n, r, i, 3.2, (t, n, r, i) =>
            e.later(i * a * 0.7, () => e.vfx.ring(t, n, r, 1.4, ENEMY_DANGER_COLOR, 0.4, 0.3, 0)),
          );
        },
        dash(e, t, n, r, i, a) {
          for (let o = 0; o < 2; o++)
            e.vfx.norm.spawn({
              x: t - i * 0.8 + F.range(-0.6, 0.6),
              y: n + F.range(0.4, 1.6),
              z: r - a * 0.8 + F.range(-0.6, 0.6),
              vy: 1.2,
              life: 0.4,
              size: 1.2,
              endSize: 0.4,
              color: 16777215,
              shape: I.PixDragonFire,
            });
          let o = e.time * 16;
          e.vfx.norm.spawn({
            x: t + Math.cos(o) * 1.6,
            y: n + 0.6,
            z: r + Math.sin(o) * 1.6,
            vy: 1.5,
            drag: 2,
            life: 0.5,
            size: 0.9,
            endSize: 1.8,
            color: 15255696,
            shape: I.PixPuff,
          });
        },
      },
    },
    py = class {
      run;
      B;
      i;
      popT = 0;
      group = new Cr();
      disposed = !1;
      constructor(e, t, n) {
        ((this.run = e), (this.B = t), (this.i = n), e.r.scene.add(this.group));
      }
      tick(e, t) {}
      hitMul() {
        return 1;
      }
      render() {}
      dispose() {
        if (this.disposed) return;
        ((this.disposed = !0), this.run.r.scene.remove(this.group));
        let e = this.E;
        for (let t = 0; t < e.n; t++) e.alive[t] && e.flags[t] & R.Object && e.kill(t);
      }
      get E() {
        return this.run.enemies;
      }
      get bx() {
        return this.E.x[this.i];
      }
      get by() {
        return this.E.y[this.i];
      }
      get bz() {
        return this.E.z[this.i];
      }
      get live() {
        return this.B.live(this.i);
      }
      gy(e, t) {
        return this.run.terrain.height(e, t);
      }
      toPlayer() {
        let e = this.run.player.pos,
          t = e.x - this.bx,
          n = e.z - this.bz,
          r = Math.hypot(t, n) || 1;
        return { x: t / r, z: n / r, d: r };
      }
      low(e = 1.3) {
        let t = this.run.player.pos;
        return t.y - this.gy(t.x, t.z) < e;
      }
      popup(e, t, n = 1) {
        this.run.ui.popup(this.bx, this.by + this.E.hgt[this.i] + 1.2, this.bz, e, t, n);
      }
      pop(e, t, n = 0.7) {
        this.popT <= 0 && ((this.popT = n), this.popup(e, t, 0.85));
      }
      strike(e, t) {
        return this.live && this.B.strike(this.i, e, t);
      }
      selfHit(e, t = 16769594) {
        let n = this.E,
          r = this.i;
        if (!this.live) return;
        let i = n.maxHp[r] * e;
        ((n.hp[r] -= i),
          (n.flash[r] = 1),
          (n.squash[r] = 0.6),
          this.run.vfx.number(n.x[r], n.y[r] + n.hgt[r] + 0.4, n.z[r], i, t, !0),
          n.hp[r] <= 0 && this.run.combat.killEnemy(r, {}));
      }
      obj(e, t, n, r, i, a) {
        let o = this.E,
          s = o.spawn(e, t, n, 1, 0, R.Object);
        return s < 0
          ? null
          : ((o.hp[s] = o.maxHp[s] = Math.max(1, o.maxHp[this.i] * r)),
            (o.dmg[s] = 0),
            (o.speed[s] = 0),
            (o.xp[s] = 0),
            (o.radius[s] = i),
            (o.hgt[s] = a),
            (o.sized[s] = 1),
            (o.y[s] = this.gy(t, n)),
            { j: s, g: o.gen[s] });
      }
      objAlive(e) {
        let t = this.E;
        return t.gen[e.j] === e.g && t.alive[e.j] === 1 && t.dying[e.j] <= 0;
      }
      objRemove(e) {
        this.objAlive(e) && this.E.kill(e.j);
      }
      model(e, t, n, r = 1, i = F.range(0, Math.PI * 2)) {
        let a = new Cr();
        return (
          a.position.set(t, this.gy(t, n), n),
          (a.rotation.y = i),
          a.scale.setScalar(r),
          this.group.add(a),
          bu(e).then((e) => {
            e && !this.disposed && a.add(e);
          }),
          a
        );
      }
      strip(e, t, n, r, i, a, o, s = 1.2) {
        let c = Math.hypot(n - e, r - t) || 1;
        for (let l = 0; l <= c; l += s) {
          let s = e + ((n - e) * l) / c,
            u = t + ((r - t) * l) / c;
          this.run.vfx.groundN.spawn({
            x: s,
            y: this.gy(s, u) + 0.12,
            z: u,
            life: a,
            size: i * 2,
            endSize: i * 2,
            color: o,
            shape: I.Soft,
            rot: 0,
          });
        }
      }
      segDist(e, t, n, r) {
        let i = this.run.player.pos,
          a = n - e,
          o = r - t,
          s = a * a + o * o || 1,
          c = Gs(((i.x - e) * a + (i.z - t) * o) / s, 0, 1);
        return Math.hypot(e + a * c - i.x, t + o * c - i.z);
      }
    },
    my = {
      99: class extends py {
        guard = 0;
        counterCd = 0;
        name() {
          return c(`Guardia Tenaza`);
        }
        cast(e) {
          return (
            (this.guard = e ? 4 : 3.2),
            (this.B.hold = this.guard + 0.2),
            this.popup(c(`¡Guardia!`), `#ffb08a`, 1.1),
            this.run.audio.shot(`water`, 0.6),
            this.run.later(this.guard, () => {
              this.live && this.hammer(e);
            }),
            this.guard + 2.6
          );
        }
        facing() {
          let e = this.E;
          return { x: e.fx[this.i], z: e.fz[this.i] };
        }
        hitMul() {
          if (this.guard <= 0) return 1;
          let e = this.facing(),
            t = this.toPlayer(),
            n = e.x * t.x + e.z * t.z;
          return n > 0.3
            ? (this.pop(c(`¡Bloqueado!`), `#c8d8e8`), 0.15)
            : n < -0.25
              ? (this.pop(c(`¡Por la espalda!`), `#ffe23a`), 1.6)
              : 1;
        }
        tick(e, t) {
          if (((this.popT -= e), (this.counterCd -= e), !t || this.guard <= 0)) return;
          this.guard -= e;
          let n = this.E,
            r = this.i,
            i = this.toPlayer(),
            a = this.facing(),
            o = Math.atan2(a.z, a.x),
            s = Math.atan2(i.z, i.x) - o;
          for (; s > Math.PI; ) s -= Math.PI * 2;
          for (; s < -Math.PI; ) s += Math.PI * 2;
          let c = o + Gs(s, -1.5 * e, 1.5 * e);
          ((n.fx[r] = Math.cos(c)), (n.fz[r] = Math.sin(c)));
          for (let e = 0; e < 3; e++) {
            let e = c + F.range(-1, 1),
              t = n.radius[r] + 1.2;
            this.run.vfx.add.spawn({
              x: this.bx + Math.cos(e) * t,
              y: this.by + F.range(0.4, 2.4),
              z: this.bz + Math.sin(e) * t,
              life: 0.25,
              size: 0.45,
              endSize: 0.2,
              color: 16765104,
              shape: I.Square,
              glow: 0.6,
            });
          }
          if (this.counterCd <= 0 && i.d < n.radius[r] + 5 && a.x * i.x + a.z * i.z > 0.5) {
            this.counterCd = 1.8;
            let e = this.run.player.pos,
              t = e.x,
              i = e.z,
              a = this.gy(t, i);
            (this.run.vfx.enemyCircle(t, a, i, 2.6, 16738890, 0.45 * this.B.tk),
              this.run.later(0.45 * this.B.tk, () => {
                if (!this.live) return;
                ((n.atkAnim[r] = 0.4),
                  this.run.vfx.burst(t, a + 0.5, i, 10148095, 16, 7, I.PixDrop, 0.6, 0.5, 10),
                  this.run.audio.boom(0.6));
                let e = this.run.player.pos;
                (e.x - t) ** 2 + (e.z - i) ** 2 < 2.6 * 2.6 && this.low(2) && this.strike(1.3);
              }));
          }
        }
        hammer(e) {
          let t = this.run,
            n = this.toPlayer(),
            r = Math.atan2(n.z, n.x),
            i = e ? [-0.45, 0, 0.45] : [0];
          ((this.E.atkAnim[this.i] = 0.6), t.shake(0.3, this.bx, this.bz));
          for (let e of i)
            for (let n = 0; n < 6; n++) {
              let i = 3 + n * 3,
                a = this.bx + Math.cos(r + e) * i,
                o = this.bz + Math.sin(r + e) * i,
                s = this.gy(a, o),
                c = (0.7 + n * 0.12) * this.B.tk;
              (t.vfx.enemyCircle(a, s, o, 2.2, 6994175, c),
                t.later(c, () => {
                  if (!this.live) return;
                  for (let e = 0; e < 8; e++)
                    t.vfx.norm.spawn({
                      x: a + F.range(-0.6, 0.6),
                      y: s + 0.3,
                      z: o + F.range(-0.6, 0.6),
                      vx: F.range(-1, 1),
                      vy: F.range(8, 13),
                      vz: F.range(-1, 1),
                      gravity: 22,
                      life: 0.8,
                      size: 0.7,
                      endSize: 0.3,
                      color: 16777215,
                      shape: I.PixDrop,
                    });
                  (t.vfx.ring(a, s, o, 2.2, 10148095, 0.35), n === 0 && t.audio.boom(0.7));
                  let e = t.player.pos;
                  (e.x - a) ** 2 + (e.z - o) ** 2 < 2.2 * 2.2 && this.low(1.8) && this.strike(1.2);
                }));
            }
        }
      },
      101: class extends py {
        mines = [];
        roll = null;
        name() {
          return c(`Campo de Minas`);
        }
        cast(e) {
          let t = this.run,
            n = t.player.pos,
            r = e ? 9 : 6;
          (this.popup(c(`¡Campo de Minas!`), `#ff6a5a`, 1.1), (this.E.atkAnim[this.i] = 0.6));
          for (let e = 0; e < r && this.mines.length < 14; e++) {
            let i = (e / r) * Math.PI * 2 + F.range(-0.3, 0.3),
              a = F.range(4, 11),
              o = n.x + Math.cos(i) * a,
              s = n.z + Math.sin(i) * a;
            if (!t.terrain.inBounds(o, s, 3)) continue;
            let c = this.bx,
              l = this.bz,
              u = this.by + 1,
              d = this.gy(o, s);
            (t.vfx.norm.spawn({
              x: c,
              y: u,
              z: l,
              vx: (o - c) / 0.6,
              vy: (d - u) / 0.6 + 9,
              vz: (s - l) / 0.6,
              gravity: 30,
              life: 0.6,
              size: 0.9,
              endSize: 0.9,
              color: 16734794,
              shape: I.Soft,
            }),
              t.later(0.6, () => {
                this.live &&
                  (this.mines.push({
                    o: this.obj(100, o, s, 0.004, 0.7, 1),
                    x: o,
                    z: s,
                    arm: 1,
                    fuse: -1,
                    life: 16,
                  }),
                  t.vfx.dust(o, d, s, 13154456, 4, 2));
              }));
          }
          return (
            t.later(1.8, () => {
              this.live && this.startRoll();
            }),
            e ? 5.6 : 5
          );
        }
        startRoll() {
          let e = this.toPlayer(),
            t = Math.min(28, e.d + 8);
          (this.strip(this.bx, this.bz, this.bx + e.x * t, this.bz + e.z * t, 1.4, 0.7 * this.B.tk, 16738906),
            (this.B.hold = 0.8 + t / 20),
            this.run.later(0.7 * this.B.tk, () => {
              this.live &&
                ((this.roll = { t: t / 20, dx: e.x, dz: e.z }),
                this.run.audio.whoosh(),
                this.popup(c(`¡Rodar!`), `#ffb03a`, 0.9));
            }));
        }
        blow(e) {
          let t = this.run,
            n = this.gy(e.x, e.z),
            r = 3.4;
          ((e.life = 0),
            (e.fuse = -1),
            e.o && this.objRemove(e.o),
            t.vfx.flash(e.x, n + 0.8, e.z, 16777215, 6, 0.15),
            t.vfx.burst(e.x, n + 0.6, e.z, 16769594, 22, 10, I.Star, 0.7, 0.5),
            t.vfx.ring(e.x, n, e.z, r, 16738874, 0.4));
          for (let i = 0; i < 4; i++)
            t.vfx.lightning(
              e.x,
              n + 0.5,
              e.z,
              e.x + F.range(-3.4, r),
              n + 0.2,
              e.z + F.range(-3.4, r),
              16769594,
              0.2,
              4,
              0.15,
            );
          (t.shake(0.25, e.x, e.z), t.audio.boom(0.8));
          let i = t.player.pos;
          ((i.x - e.x) ** 2 + (i.z - e.z) ** 2 < r * r && this.low(2) && this.strike(1.1),
            this.live &&
              Math.hypot(this.bx - e.x, this.bz - e.z) < r + this.E.radius[this.i] &&
              (this.selfHit(0.045), this.pop(c(`¡Su propia mina!`), `#ffe23a`, 0.3)));
          for (let t of this.mines)
            t.life > 0 && t.fuse < 0 && Math.hypot(t.x - e.x, t.z - e.z) < 4.6 && (t.fuse = 0.22);
        }
        tick(e, t) {
          let n = this.run,
            r = n.player.pos,
            i = this.E;
          if (((this.popT -= e), !t)) {
            for (let e of this.mines) e.o && this.objRemove(e.o);
            ((this.mines = []), (this.roll = null));
          } else {
            if (this.roll) {
              let t = this.roll;
              ((t.t -= e),
                (i.kx[this.i] = t.dx * 20),
                (i.kz[this.i] = t.dz * 20),
                Math.random() < 0.7 &&
                  n.vfx.lightning(
                    this.bx,
                    this.by + 0.6,
                    this.bz,
                    this.bx - t.dx * 2,
                    this.by + 0.3,
                    this.bz - t.dz * 2,
                    16769594,
                    0.2,
                    3,
                    0.1,
                  ),
                Math.hypot(r.x - this.bx, r.z - this.bz) < i.radius[this.i] + 1 &&
                  this.low(2) &&
                  (this.strike(1.6, 0.1) && n.player.shove(t.dx, t.dz, 10), (t.t = Math.min(t.t, 0.1))));
              for (let e of this.mines)
                e.life > 0 &&
                  e.fuse < 0 &&
                  Math.hypot(e.x - this.bx, e.z - this.bz) < i.radius[this.i] + 1.2 &&
                  ((e.fuse = 0.12), this.pop(c(`¡Pisa una mina!`), `#ffe23a`, 0.3));
              t.t <= 0 && (this.roll = null);
            }
            for (let t of this.mines)
              t.life <= 0 ||
                ((t.life -= e),
                (t.arm -= e),
                t.o && !this.objAlive(t.o) && ((t.o = null), (t.fuse = 0.01)),
                t.fuse < 0 &&
                  t.arm <= 0 &&
                  Math.hypot(r.x - t.x, r.z - t.z) < 2.2 &&
                  ((t.fuse = 0.7),
                  n.vfx.enemyCircle(t.x, this.gy(t.x, t.z), t.z, 3.4, 16726586, 0.7),
                  n.audio.alarm()),
                t.fuse >= 0
                  ? ((t.fuse -= e), t.fuse <= 0 && this.blow(t))
                  : t.life <= 0 &&
                    (t.o && this.objRemove(t.o), n.vfx.dust(t.x, this.gy(t.x, t.z), t.z, 9079434, 4, 2)));
            this.mines = this.mines.filter((e) => e.life > 0);
          }
        }
        render() {
          let e = this.run,
            t = e.sprites.get(100);
          for (let n of this.mines) {
            let r = n.fuse >= 0 ? +(Math.sin(e.time * 40) > 0) : n.arm > 0 ? 0.3 : 0;
            t.push(
              n.x,
              this.gy(n.x, n.z),
              n.z,
              `idle`,
              e.time,
              0,
              0.9,
              0,
              0,
              1,
              0,
              1 + r * 0.6,
              1 - r * 0.4,
              1 - r * 0.4,
              r * 0.7,
            );
          }
        }
      },
      130: class extends py {
        pools = [];
        beam = null;
        recharge = 0;
        poolHurtT = 0;
        next = `pool`;
        name() {
          return this.next === `pool` ? c(`Torbellino`) : c(`Hiperrayo`);
        }
        cast(e) {
          let t = this.next;
          return (
            (this.next = t === `pool` ? `beam` : `pool`),
            t === `pool` ? this.whirl(e) : this.hyperBeam(e)
          );
        }
        whirl(e) {
          let t = this.run,
            n = t.player.pos,
            r = e ? 3 : 2;
          for (let e = 0; e < r; e++) {
            let e = F.range(0, Math.PI * 2),
              r = F.range(5, 9),
              i = n.x + Math.cos(e) * r,
              a = n.z + Math.sin(e) * r;
            t.terrain.inBounds(i, a, 6) &&
              (t.vfx.enemyCircle(i, this.gy(i, a), a, 5.5, 4892927, 0.9),
              t.later(0.9, () => {
                this.live && this.pools.push({ x: i, z: a, t: 7 });
              }));
          }
          return (this.popup(c(`¡Torbellino!`), `#6ab8ff`, 1.1), 3.2);
        }
        hyperBeam(e) {
          let t = this.run,
            n = this.toPlayer(),
            r = F.chance(0.5) ? 1 : -1,
            i = Math.atan2(n.z, n.x) - r * 1.75;
          ((this.B.hold = 4.2), this.popup(c(`¡Danza Dragón!`), `#8a7aff`, 1.1));
          for (let e = 0; e <= 1; e += 0.06) {
            let n = i + r * 3.5 * e;
            for (let e = 4; e <= 26; e += 3.5) {
              let r = this.bx + Math.cos(n) * e,
                i = this.bz + Math.sin(n) * e;
              t.vfx.ground.spawn({
                x: r,
                y: this.gy(r, i) + 0.12,
                z: i,
                life: 1.3,
                size: 1.6,
                endSize: 1.6,
                color: 16734858,
                shape: I.Soft,
                glow: 0,
                rot: 0,
              });
            }
          }
          for (let e = 0; e < 20; e++)
            t.later(e * 0.06, () => {
              this.live &&
                t.vfx.add.spawn({
                  x: this.bx + F.range(-2, 2),
                  y: this.by + F.range(0, 3),
                  z: this.bz + F.range(-2, 2),
                  vy: 3,
                  life: 0.5,
                  size: 0.6,
                  endSize: 0.1,
                  color: 9075455,
                  shape: I.Twinkle,
                  glow: 1,
                });
            });
          return (
            t.later(1.3 * this.B.tk, () => {
              this.live &&
                ((this.beam = { t: e ? 1.8 : 2.2, a0: i, dir: r, hit: !1 }),
                t.audio.cone(`dragon`, 2),
                t.shake(0.4));
            }),
            6
          );
        }
        hitMul() {
          return this.recharge > 0 ? (this.pop(c(`¡Debe recargar!`), `#ffe23a`, 1.2), 1.5) : 1;
        }
        tick(e, t) {
          let n = this.run,
            r = n.player,
            i = r.pos,
            a = this.E;
          if (((this.popT -= e), (this.recharge -= e), (this.poolHurtT -= e), !t))
            ((this.pools = []), (this.beam = null));
          else {
            for (let t of this.pools) {
              t.t -= e;
              let o = this.gy(t.x, t.z);
              for (let e = 0; e < 3; e++) {
                let r = n.time * 3 + e * 2.1 + F.range(0, 0.6),
                  i = F.range(0.8, 5.5);
                n.vfx.ground.spawn({
                  x: t.x + Math.cos(r) * i,
                  y: o + 0.15,
                  z: t.z + Math.sin(r) * i,
                  life: 0.5,
                  size: 1.1,
                  endSize: 0.4,
                  color: e ? 4892927 : 14218495,
                  shape: I.Swirl,
                  glow: 0.2,
                  rot: r,
                });
              }
              n.vfx.staticRing(t.x, o + 0.1, t.z, 5.5, 4892927, 0.6);
              let s = t.x - i.x,
                c = t.z - i.z,
                l = Math.hypot(s, c) || 1;
              if (l < 6.5 && this.low(1.5)) {
                let t = 6.5 * (1 - l / 7);
                ((r.kx += (s / l) * t * 9 * e),
                  (r.kz += (c / l) * t * 9 * e),
                  l < 1.8 &&
                    this.poolHurtT <= 0 &&
                    ((this.poolHurtT = 0.5), r.hurt(r.maxHp * 0.05, `water`, -1, NaN, NaN, !0, 0, this.i)));
              }
              if (Math.random() < e * 3)
                for (let e of a.within(t.x, t.z, 6)) {
                  if (a.flags[e] & (R.Boss | R.Object)) continue;
                  let r = t.x - a.x[e],
                    i = t.z - a.z[e],
                    o = Math.hypot(r, i) || 1;
                  ((a.kx[e] += (r / o) * 8),
                    (a.kz[e] += (i / o) * 8),
                    o < 2 &&
                      n.combat.hit(e, a.maxHp[e] * 0.25, {
                        type: `water`,
                        cls: `special`,
                        fixed: !0,
                        silent: !0,
                      }));
                }
            }
            if (((this.pools = this.pools.filter((e) => e.t > 0)), this.beam)) {
              let t = this.beam;
              t.t -= e;
              let i = 1 - Math.max(0, t.t) / 2.2,
                o = t.a0 + t.dir * 3.5 * Math.min(1, i),
                s = this.bx + Math.cos(o) * 26,
                l = this.bz + Math.sin(o) * 26,
                u = this.by + 1.2;
              (n.vfx.beams.spawn(this.bx, u, this.bz, s, this.gy(s, l) + 1, l, 2.4, 16734858, 0.06),
                n.vfx.beams.spawn(this.bx, u, this.bz, s, this.gy(s, l) + 1, l, 0.9, 16777215, 0.06),
                (a.fx[this.i] = Math.cos(o)),
                (a.fz[this.i] = Math.sin(o)),
                (a.atkAnim[this.i] = 0.2),
                !t.hit &&
                  this.segDist(this.bx, this.bz, s, l) < 1.4 + r.radius &&
                  this.low(1.6) &&
                  ((t.hit = !0), this.strike(2, 0.16)),
                t.t <= 0 &&
                  ((this.beam = null),
                  (this.recharge = 2.5),
                  (this.B.hold = 2.5),
                  this.popup(c(`¡Debe recargar!`), `#ffe23a`, 1.1)));
            }
            this.recharge > 0 &&
              Math.random() < e * 6 &&
              n.vfx.text.spawn(
                this.bx + F.range(-1, 1),
                this.by + a.hgt[this.i] + 0.5,
                this.bz,
                `…`,
                16769594,
                0.6,
              );
          }
        }
      },
      73: class extends py {
        tents = [];
        name() {
          return c(`Bosque de Tentáculos`);
        }
        cast(e) {
          let t = this.run,
            n = t.player.pos,
            r = e ? 4 : 3,
            i = F.range(0, Math.PI * 2);
          this.popup(c(`¡Tentáculos!`), `#b87aff`, 1.1);
          for (let e = 0; e < r; e++) {
            let a = i + (e / r) * Math.PI * 2;
            for (let e = 0; e < 4; e++) {
              let r = 11 - e * 2.8,
                i = n.x + Math.cos(a) * r,
                o = n.z + Math.sin(a) * r;
              if (!t.terrain.inBounds(i, o, 3)) continue;
              let s = (0.9 + e * 0.32) * this.B.tk,
                c = this.gy(i, o);
              (t.vfx.enemyCircle(i, c, o, 1.5, 12090111, s),
                t.later(s, () => {
                  if (!this.live) return;
                  (t.vfx.burst(i, c + 0.3, o, 9071178, 10, 5, I.PixRock, 0.5, 0.5, 14), t.audio.boom(0.35));
                  let e = t.player.pos;
                  ((e.x - i) ** 2 + (e.z - o) ** 2 < 2.25 &&
                    this.low(1.2) &&
                    (this.strike(1), t.player.inflict(`bound`, 1.1)),
                    this.tents.length < 16 &&
                      this.tents.push({
                        o: this.obj(72, i, o, 0.008, 0.8, 3),
                        x: i,
                        z: o,
                        t: 6,
                        lash: F.range(1, 2.4),
                        g: this.model(`tentacle`, i, o, 1),
                      }));
                }));
            }
          }
          return e ? 4.2 : 3.6;
        }
        tick(e, t) {
          let n = this.run;
          this.popT -= e;
          for (let r of this.tents) {
            ((r.t -= e), (r.lash -= e));
            let i = this.gy(r.x, r.z),
              a = Math.min(1, (6 - r.t) * 4),
              o = Math.min(1, r.t * 2);
            ((r.g.position.y = i - 3.2 * (1 - Math.min(a, o))),
              (r.g.rotation.z = Math.sin(n.time * 2.3 + r.x) * 0.12),
              r.o &&
                !this.objAlive(r.o) &&
                ((r.o = null),
                (r.t = Math.min(r.t, 0.4)),
                n.vfx.burst(r.x, i + 1.5, r.z, 10146047, 14, 6, I.PixDrop, 0.5, 0.5, 12),
                this.selfHit(0.015, 12090111),
                this.pop(c(`¡Le duele!`), `#b87aff`, 0.4)),
              t &&
                r.o &&
                r.lash <= 0 &&
                r.t > 0.8 &&
                ((r.lash = F.range(2, 2.8)),
                n.vfx.enemyCircle(r.x, i, r.z, 2.8, 12090111, 0.6 * this.B.tk),
                n.later(0.6 * this.B.tk, () => {
                  if (!this.live || !r.o) return;
                  for (let e = 0; e < 12; e++) {
                    let t = (e / 12) * Math.PI * 2;
                    n.vfx.norm.spawn({
                      x: r.x + Math.cos(t) * 2.4,
                      y: i + 0.8,
                      z: r.z + Math.sin(t) * 2.4,
                      life: 0.3,
                      size: 0.6,
                      endSize: 0.2,
                      color: 12090111,
                      shape: I.Soft,
                    });
                  }
                  let e = n.player.pos;
                  (e.x - r.x) ** 2 + (e.z - r.z) ** 2 < 2.8 * 2.8 && this.low(1.3) && this.strike(0.9);
                })),
              (r.t <= 0 || !t) && (r.o && this.objRemove(r.o), this.group.remove(r.g), (r.t = 0)));
          }
          this.tents = this.tents.filter((e) => e.t > 0);
        }
      },
      121: class extends py {
        path = [];
        run_ = null;
        dizzy = 0;
        cx = 0;
        cz = 0;
        name() {
          return c(`Giro Rápido`);
        }
        cast(e) {
          let t = this.run,
            n = t.player.pos,
            r = e ? 6 : 4;
          ((this.cx = n.x), (this.cz = n.z));
          let i = this.bx,
            a = this.bz,
            o = this.toPlayer(),
            s = o.x,
            l = o.z;
          if (Math.hypot(i - this.cx, a - this.cz) > 14) {
            let e = Math.atan2(a - this.cz, i - this.cx);
            ((i = this.cx + Math.cos(e) * 14), (a = this.cz + Math.sin(e) * 14));
          }
          this.path = [{ x: i, z: a }];
          for (let e = 0; e < r; e++) {
            let e = i - this.cx,
              t = a - this.cz,
              n = e * s + t * l,
              r = e * e + t * t - 225,
              o = -n + Math.sqrt(Math.max(0, n * n - r));
            ((i += s * o), (a += l * o), this.path.push({ x: i, z: a }));
            let c = (i - this.cx) / 15,
              u = (a - this.cz) / 15,
              d = s * c + l * u;
            ((s -= 2 * d * c), (l -= 2 * d * u));
            let f = F.range(-0.35, 0.35),
              p = Math.cos(f),
              m = Math.sin(f);
            [s, l] = [s * p - l * m, s * m + l * p];
          }
          let u = 1.2 * this.B.tk;
          for (let e = 0; e < this.path.length - 1; e++)
            this.strip(
              this.path[e].x,
              this.path[e].z,
              this.path[e + 1].x,
              this.path[e + 1].z,
              0.6,
              u + e * 0.25,
              e % 2 ? 16747224 : 16765034,
              1.6,
            );
          return (
            (this.B.hold = u + 3),
            this.popup(c(`¡Giro Rápido!`), `#ffd06a`, 1.1),
            t.later(u, () => {
              this.live && ((this.run_ = { k: 0, s: 0, hit: !1 }), t.audio.whoosh());
            }),
            u + 4.5
          );
        }
        hitMul() {
          return this.dizzy > 0 ? (this.pop(c(`¡Núcleo expuesto!`), `#ff5a8a`, 1), 1.8) : 1;
        }
        tick(e, t) {
          let n = this.run,
            r = this.E,
            i = this.i;
          if (((this.popT -= e), (this.dizzy -= e), !t)) this.run_ = null;
          else {
            if (this.run_) {
              let t = this.run_,
                a = this.path[t.k],
                o = this.path[t.k + 1];
              n.vfx.staticRing(this.cx, this.gy(this.cx, this.cz) + 0.1, this.cz, 15, 16765034, 0.5);
              let s = Math.hypot(o.x - a.x, o.z - a.z) || 1;
              t.s += e * 26;
              let l = Math.min(1, t.s / s);
              ((r.x[i] = a.x + (o.x - a.x) * l),
                (r.z[i] = a.z + (o.z - a.z) * l),
                (r.vx[i] = r.vz[i] = 0),
                (r.atkAnim[i] = 0.2));
              for (let e = 0; e < 2; e++)
                n.vfx.add.spawn({
                  x: r.x[i] + F.range(-0.8, 0.8),
                  y: r.y[i] + F.range(0.3, 1.6),
                  z: r.z[i] + F.range(-0.8, 0.8),
                  life: 0.35,
                  size: 0.6,
                  endSize: 0.1,
                  color: e ? 16765034 : 16747224,
                  shape: I.Star,
                  glow: 0.8,
                  spin: 6,
                });
              let u = n.player.pos;
              (!t.hit &&
                Math.hypot(u.x - r.x[i], u.z - r.z[i]) < r.radius[i] + 1 &&
                this.low(1.6) &&
                ((t.hit = !0), this.strike(1.4)),
                l >= 1 &&
                  (t.k++,
                  (t.s = 0),
                  (t.hit = !1),
                  n.vfx.ring(o.x, this.gy(o.x, o.z), o.z, 2.5, 16765034, 0.3),
                  n.audio.boom(0.4),
                  n.shake(0.15, o.x, o.z),
                  t.k >= this.path.length - 1 &&
                    ((this.run_ = null),
                    (this.dizzy = 2.5),
                    (this.B.hold = 2.5),
                    this.popup(c(`¡Mareado!`), `#ffd06a`, 1.1))));
            }
            if (this.dizzy > 0) {
              let t = n.time * 5;
              for (let e = 0; e < 3; e++) {
                let a = t + (e / 3) * Math.PI * 2;
                n.orbitals.push(
                  r.x[i] + Math.cos(a) * 1.2,
                  r.y[i] + r.hgt[i] + 0.4,
                  r.z[i] + Math.sin(a) * 1.2,
                  0.45,
                  16769594,
                  I.Star,
                  a,
                  0.8,
                );
              }
              Math.random() < e * 10 &&
                n.vfx.add.spawn({
                  x: r.x[i],
                  y: r.y[i] + r.hgt[i] * 0.5,
                  z: r.z[i],
                  life: 0.3,
                  size: 0.9,
                  endSize: 0.2,
                  color: 16726618,
                  shape: I.Twinkle,
                  glow: 1,
                });
            }
          }
        }
      },
      125: class extends py {
        cage = null;
        name() {
          return c(`Jaula Eléctrica`);
        }
        cast(e) {
          let t = this.run,
            n = t.player.pos,
            r = e ? 6 : 4,
            i = F.range(0, Math.PI * 2),
            a = Array.from({ length: r }, (e, a) => {
              let o = i + (a / r) * Math.PI * 2,
                s = n.x + Math.cos(o) * 8,
                c = n.z + Math.sin(o) * 8;
              return (
                t.vfx.lightning(this.bx, this.by + 2, this.bz, s, this.gy(s, c) + 2, c, 16769594, 0.3, 7, 0.25),
                { o: this.obj(81, s, c, 0.006, 0.6, 2.2), a: o }
              );
            });
          return (
            (this.cage = { posts: a, cx: n.x, cz: n.z, r: 8, t: 4.8, gap: F.int(0, r - 1), hitT: 0 }),
            this.popup(c(`¡Jaula Eléctrica!`), `#ffe23a`, 1.1),
            t.audio.shot(`electric`, 0.8),
            t.later(5, () => {
              this.live && (this.B.say(c(`Puño Trueno`)), this.B.sigLeap(this.i, 16769594, {}, e));
            }),
            8.6
          );
        }
        tick(e, t) {
          let n = this.run,
            r = this.cage,
            i = n.player;
          if (!r) return;
          ((r.t -= e), (r.hitT -= e));
          let a = r.t < 3.4;
          a && (r.r = Math.max(2.4, r.r - e * 1.7));
          let o = r.posts.map((e) => ({ po: e, x: r.cx + Math.cos(e.a) * r.r, z: r.cz + Math.sin(e.a) * r.r }));
          for (let e of o)
            if (e.po.o && this.objAlive(e.po.o)) {
              let t = this.E,
                r = e.po.o.j;
              ((t.x[r] = e.x), (t.z[r] = e.z), (t.y[r] = this.gy(e.x, e.z)));
              let i = t.y[r];
              for (let t = 0; t < 2.2; t += 0.55)
                n.orbitals.push(e.x, i + t, e.z, 0.35, 16769594, I.Square, 0, 0.9);
              n.orbitals.push(e.x, i + 2.4, e.z, 0.7, 16777215, I.Twinkle, n.time * 4, 1);
            } else e.po.o && (e.po.o = null);
          for (let e = 0; e < o.length; e++) {
            if (e === r.gap) continue;
            let t = o[e],
              s = o[(e + 1) % o.length];
            if (!t.po.o || !s.po.o) continue;
            let c = this.gy(t.x, t.z) + 1,
              l = this.gy(s.x, s.z) + 1;
            a
              ? (Math.random() < 0.7 && n.vfx.lightning(t.x, c, t.z, s.x, l, s.z, 16769594, 0.3, 6, 0.08),
                r.hitT <= 0 &&
                  this.segDist(t.x, t.z, s.x, s.z) < 0.7 + i.radius &&
                  this.low(1.3) &&
                  ((r.hitT = 0.8), this.strike(0.9), i.inflict(`para`, 1.5)))
              : Math.random() < 0.3 && this.strip(t.x, t.z, s.x, s.z, 0.4, 0.15, 16769594, 2);
          }
          if (r.t <= 0 || !t) {
            for (let e of r.posts) e.o && this.objRemove(e.o);
            this.cage = null;
          }
        }
      },
      87: class extends py {
        slide = null;
        trails = [];
        name() {
          return c(`Trineo Helado`);
        }
        cast(e) {
          return (this.next(e ? 4 : 3, e), this.popup(c(`¡Trineo Helado!`), `#9ae8ff`, 1.1), e ? 6.4 : 5.2);
        }
        next(e, t) {
          if (e <= 0 || !this.live) return;
          let n = this.toPlayer(),
            r = Math.min(24, n.d + 7),
            i = 0.65 * this.B.tk;
          (this.strip(this.bx, this.bz, this.bx + n.x * r, this.bz + n.z * r, 1.3, i, 10152191),
            (this.B.hold = i + r / 22 + 0.2),
            this.run.later(i, () => {
              this.live &&
                ((this.slide = {
                  t: r / 22,
                  dx: n.x,
                  dz: n.z,
                  left: e - 1,
                  rage: t,
                  hit: !1,
                  ax: this.bx,
                  az: this.bz,
                }),
                this.run.audio.whoosh());
            }));
        }
        tick(e, t) {
          let n = this.run,
            r = this.E,
            i = this.i,
            a = n.player,
            o = a.pos;
          if (this.slide && t) {
            let t = this.slide;
            ((t.t -= e),
              (r.kx[i] = t.dx * 22),
              (r.kz[i] = t.dz * 22),
              Math.random() < 0.8 &&
                n.vfx.norm.spawn({
                  x: this.bx,
                  y: this.by + 0.2,
                  z: this.bz,
                  vx: F.range(-2, 2),
                  vy: F.range(1, 3),
                  vz: F.range(-2, 2),
                  life: 0.4,
                  size: 0.4,
                  endSize: 0.1,
                  color: 16777215,
                  shape: I.PixSnow,
                }),
              !t.hit &&
                Math.hypot(o.x - this.bx, o.z - this.bz) < r.radius[i] + 1 &&
                this.low(1.6) &&
                ((t.hit = !0), this.strike(1.3) && a.shove(t.dx, t.dz, 10)),
              t.t <= 0 &&
                (this.trails.push({ ax: t.ax, az: t.az, bx: this.bx, bz: this.bz, t: 6, burst: 1.2 }),
                (this.slide = null),
                n.later(0.35, () => this.next(t.left, t.rage))));
          }
          for (let r of this.trails) {
            r.t -= e;
            let i = r.burst;
            ((r.burst -= e),
              Math.random() < e * 4 && this.strip(r.ax, r.az, r.bx, r.bz, 1.1, 0.4, 14219007, 1.4));
            let o = this.segDist(r.ax, r.az, r.bx, r.bz) < 1.2;
            if ((o && (a.arenaSlip = Math.max(a.arenaSlip, 0.85)), i > 0 && r.burst <= 0 && t)) {
              let e = Math.hypot(r.bx - r.ax, r.bz - r.az) || 1;
              for (let t = 0; t <= e; t += 1.4) {
                let i = r.ax + ((r.bx - r.ax) * t) / e,
                  a = r.az + ((r.bz - r.az) * t) / e;
                n.vfx.norm.spawn({
                  x: i,
                  y: this.gy(i, a),
                  z: a,
                  vy: 6,
                  gravity: 20,
                  life: 0.6,
                  size: 1.1,
                  endSize: 0.6,
                  color: 12580095,
                  shape: I.Shard,
                  rot: F.range(-0.4, 0.4),
                });
              }
              (n.audio.shot(`ice`, 0.7), o && this.low(1.3) && (this.strike(1.1), a.inflict(`frozen`, 0.9)));
            }
          }
          ((this.trails = this.trails.filter((e) => e.t > 0 && t)), t || (this.slide = null));
        }
      },
      97: class extends py {
        swing = null;
        drowsy = 0;
        tickT = 0;
        name() {
          return c(`Péndulo Hipnótico`);
        }
        cast(e) {
          let t = this.toPlayer();
          return (
            (this.swing = { t: e ? 6.5 : 5, base: Math.atan2(t.z, t.x), rage: e }),
            (this.B.hold = this.swing.t),
            this.popup(c(`¡Péndulo!`), `#c8a8ff`, 1.1),
            this.run.audio.melody([72, 67, 72, 67], 0.35),
            this.swing.t + 1.5
          );
        }
        tick(e, t) {
          let n = this.run,
            r = n.player;
          if (((this.drowsy = Math.max(0, this.drowsy - e * 0.35)), !this.swing || !t)) {
            this.swing = null;
            return;
          }
          let i = this.swing;
          ((i.t -= e), (this.tickT -= e));
          let a = this.toPlayer(),
            o = Math.atan2(a.z, a.x) - i.base;
          for (; o > Math.PI; ) o -= Math.PI * 2;
          for (; o < -Math.PI; ) o += Math.PI * 2;
          i.base += Gs(o, -0.4 * e, 0.4 * e);
          let s = Math.sin((n.time * Math.PI) / 0.8) * 0.87,
            c = i.rage ? [i.base + s, i.base - s] : [i.base + s],
            l = !1;
          for (let e of c) {
            for (let t = 2; t <= 16; t += 2.6)
              for (let r = -1; r <= 1; r += 0.5) {
                let i = e + r * 0.61,
                  a = this.bx + Math.cos(i) * t,
                  o = this.bz + Math.sin(i) * t;
                n.vfx.groundN.spawn({
                  x: a,
                  y: this.gy(a, o) + 0.12,
                  z: o,
                  life: 0.08,
                  size: 1.8,
                  endSize: 1.8,
                  color: 9067224,
                  shape: I.Soft,
                  rot: 0,
                });
              }
            let t = Math.atan2(a.z, a.x) - e;
            for (; t > Math.PI; ) t -= Math.PI * 2;
            for (; t < -Math.PI; ) t += Math.PI * 2;
            a.d < 16 && Math.abs(t) < 0.61 && (l = !0);
          }
          ((this.E.fx[this.i] = Math.cos(c[0])),
            (this.E.fz[this.i] = Math.sin(c[0])),
            Math.random() < e * 8 &&
              n.vfx.add.spawn({
                x: this.bx + Math.cos(c[0]) * 1.5,
                y: this.by + 1.5,
                z: this.bz + Math.sin(c[0]) * 1.5,
                life: 0.4,
                size: 0.5,
                endSize: 0.1,
                color: 16765034,
                shape: I.Twinkle,
                glow: 1,
              }),
            l &&
              this.tickT <= 0 &&
              ((this.tickT = 0.25),
              (this.drowsy += 0.2),
              n.vfx.text.spawn(r.pos.x + F.range(-0.4, 0.4), r.pos.y + 2.2, r.pos.z, `z`, 12101887, 0.5),
              this.drowsy >= 1 && ((this.drowsy = 0), r.inflict(`sleep`, 1.6) && this.dreamEater())),
            i.t <= 0 && (this.swing = null));
        }
        dreamEater() {
          let e = this.run,
            t = this.E,
            n = this.i,
            r = e.player.pos,
            i = F.range(0, Math.PI * 2);
          ((this.swing = null),
            (this.B.hold = 1.4),
            e.vfx.burst(this.bx, this.by + 1, this.bz, 11041535, 16, 5, I.Twinkle, 0.5, 0.4),
            (t.x[n] = r.x + Math.cos(i) * 2.5),
            (t.z[n] = r.z + Math.sin(i) * 2.5),
            (t.y[n] = this.gy(t.x[n], t.z[n])),
            e.vfx.burst(this.bx, this.by + 1, this.bz, 11041535, 16, 5, I.Twinkle, 0.5, 0.4),
            this.popup(c(`¡Comesueños!`), `#c8a8ff`, 1.1),
            e.later(0.8, () => {
              if (this.live) {
                t.atkAnim[n] = 0.5;
                for (let t = 0; t < 10; t++)
                  e.vfx.add.spawn({
                    x: r.x,
                    y: r.y + 1,
                    z: r.z,
                    vx: (this.bx - r.x) * 1.4,
                    vy: 1,
                    vz: (this.bz - r.z) * 1.4,
                    life: 0.6,
                    size: 0.5,
                    endSize: 0.2,
                    color: 13150463,
                    shape: I.Heart,
                    glow: 0.8,
                  });
                this.strike(1.4) &&
                  ((t.hp[n] = Math.min(t.maxHp[n], t.hp[n] + t.maxHp[n] * 0.04)),
                  e.vfx.heal(this.bx, this.by + 2, this.bz, t.maxHp[n] * 0.04));
              }
            }));
        }
      },
      91: class extends py {
        open = !1;
        phase = 3;
        name() {
          return c(`Clavo Cañón`);
        }
        cast(e) {
          if (this.open) return 1;
          let t = this.run,
            n = e ? 4 : 3;
          for (let e = 0; e < n; e++)
            t.later(e * 0.45, () => {
              if (!this.live || this.open) return;
              let n = e * 0.11;
              for (let e = 0; e < 14; e++)
                this.B.shot(this.i, n + (e / 14) * Math.PI * 2, 11, 0.6, { shape: I.Shard, life: 3 });
              let r = this.toPlayer(),
                i = Math.atan2(r.z, r.x);
              for (let e = -1; e <= 1; e++)
                this.B.shot(this.i, i + e * 0.12, 16, 0.7, { shape: I.Shard, life: 2.5 });
              t.audio.shot(`ice`, 0.7);
            });
          return 2.8;
        }
        hitMul() {
          return this.open
            ? (this.pop(c(`¡Abierta!`), `#ffe23a`, 1), 1.9)
            : (this.pop(c(`¡Coraza!`), `#c8d8e8`, 0.8), 0.1);
        }
        tick(e, t) {
          let n = this.run,
            r = this.E,
            i = this.i;
          ((this.popT -= e),
            t &&
              ((this.phase -= e),
              this.phase <= 0 &&
                ((this.open = !this.open),
                (this.phase = this.open ? 3.5 : 4.5),
                this.open
                  ? ((this.B.hold = 3.4),
                    this.popup(c(`¡Se abre!`), `#ffe23a`, 1.2),
                    n.vfx.flash(this.bx, this.by + 1, this.bz, 16777215, 4, 0.2))
                  : (this.popup(c(`¡Tenaza!`), `#9ae8ff`, 1.1),
                    n.audio.boom(0.6),
                    this.toPlayer().d < r.radius[i] + 2.2 &&
                      this.low(1.6) &&
                      (this.strike(1.4), n.player.inflict(`bound`, 1)))),
              this.open
                ? Math.random() < e * 14 &&
                  n.vfx.add.spawn({
                    x: this.bx + F.range(-0.6, 0.6),
                    y: this.by + r.hgt[i] * 0.5,
                    z: this.bz + F.range(-0.6, 0.6),
                    vy: 1,
                    life: 0.4,
                    size: 0.6,
                    endSize: 0.1,
                    color: 16771327,
                    shape: I.Twinkle,
                    glow: 1,
                  })
                : (n.vfx.staticRing(
                    this.bx,
                    this.by + 0.1,
                    this.bz,
                    r.radius[i] + 0.6,
                    this.phase < 1 ? 16769594 : 10152191,
                    0.7,
                  ),
                  (r.vx[i] *= 0.5),
                  (r.vz[i] *= 0.5))));
        }
      },
      124: class extends py {
        hearts = [];
        rings = [];
        next = `kiss`;
        name() {
          return this.next === `kiss` ? c(`Beso Amoroso`) : c(`Canto`);
        }
        cast(e) {
          let t = this.next;
          this.next = t === `kiss` ? `sing` : `kiss`;
          let n = this.run;
          if (((this.E.atkAnim[this.i] = 0.6), t === `kiss`)) {
            let t = e ? 5 : 3;
            for (let e = 0; e < t; e++) {
              let e = F.range(0, Math.PI * 2),
                t = this.bx + Math.cos(e) * 2,
                n = this.bz + Math.sin(e) * 2;
              this.hearts.push({ o: this.obj(124, t, n, 0.004, 0.8, 1.6), x: t, y: this.by + 1.5, z: n, t: 7 });
            }
            return (this.popup(c(`¡Beso Amoroso!`), `#ff8ac8`, 1.1), n.audio.melody([76, 79, 84], 0.12), 3.4);
          }
          for (let e = 0; e < 3; e++)
            n.later(e * 0.7, () => {
              this.live &&
                this.rings.push({ r: 1, gap: F.range(0, Math.PI * 2), hit: !1, x: this.bx, z: this.bz });
            });
          return (
            (this.B.hold = 2.2),
            this.popup(c(`¡Canto!`), `#b8a8ff`, 1.1),
            n.audio.melody([67, 71, 74, 79, 74, 71], 0.18),
            4.6
          );
        }
        tick(e, t) {
          let n = this.run,
            r = n.player,
            i = r.pos,
            a = this.E;
          for (let o of this.hearts) {
            if (((o.t -= e), o.o && !this.objAlive(o.o))) {
              ((o.o = null), (o.t = 0), n.vfx.burst(o.x, o.y, o.z, 16747208, 12, 5, I.Heart, 0.5, 0.4));
              continue;
            }
            let s = i.x - o.x,
              c = i.z - o.z,
              l = i.y + 1 - o.y,
              u = Math.hypot(s, c) || 1;
            ((o.x += (s / u) * 5.5 * e),
              (o.z += (c / u) * 5.5 * e),
              (o.y += l * e * 2),
              o.o && ((a.x[o.o.j] = o.x), (a.z[o.o.j] = o.z), (a.y[o.o.j] = o.y - 0.8)),
              n.orbitals.push(
                o.x,
                o.y + Math.sin(n.time * 6 + o.x) * 0.15,
                o.z,
                1.3,
                16747208,
                I.Heart,
                0,
                0.7,
              ),
              u < 1.1 &&
                Math.abs(l) < 1.5 &&
                ((o.t = 0),
                t && (this.strike(0.6, 0.05), r.inflict(`charm`, 2.2)),
                n.vfx.burst(o.x, o.y, o.z, 16747208, 16, 6, I.Heart, 0.5, 0.5)),
              o.t <= 0 && o.o && (this.objRemove(o.o), (o.o = null)));
          }
          this.hearts = this.hearts.filter((e) => e.t > 0);
          for (let a of this.rings) {
            let o = a.r;
            a.r += e * 7;
            let s = this.gy(a.x, a.z);
            for (let e = 0; e < 22; e++) {
              let t = (e / 22) * Math.PI * 2,
                r = t - a.gap;
              for (; r > Math.PI; ) r -= Math.PI * 2;
              for (; r < -Math.PI; ) r += Math.PI * 2;
              Math.abs(r) < 0.38 ||
                n.orbitals.push(
                  a.x + Math.cos(t) * a.r,
                  s + 0.9 + Math.sin(n.time * 8 + e) * 0.2,
                  a.z + Math.sin(t) * a.r,
                  0.55,
                  12101887,
                  I.Note,
                  0,
                  0.6,
                );
            }
            let c = Math.hypot(i.x - a.x, i.z - a.z),
              l = Math.atan2(i.z - a.z, i.x - a.x) - a.gap;
            for (; l > Math.PI; ) l -= Math.PI * 2;
            for (; l < -Math.PI; ) l += Math.PI * 2;
            !a.hit &&
              t &&
              c >= o - 0.5 &&
              c < a.r + 0.5 &&
              Math.abs(l) >= 0.38 &&
              this.low(1.3) &&
              ((a.hit = !0), this.strike(0.7, 0.05), r.inflict(`sleep`, 1.4));
          }
          if (((this.rings = this.rings.filter((e) => e.r < 24 && t)), !t)) {
            for (let e of this.hearts) e.o && this.objRemove(e.o);
            this.hearts = [];
          }
        }
      },
      131: class extends py {
        pillars = [];
        wave = null;
        name() {
          return c(`Témpanos`);
        }
        cast(e) {
          let t = this.run,
            n = t.player.pos,
            r = e ? 7 : 5,
            i = F.range(0, Math.PI * 2);
          for (let e = 0; e < r; e++) {
            let a = i + (e / r) * Math.PI * 2,
              o = n.x + Math.cos(a) * 4.6,
              s = n.z + Math.sin(a) * 4.6;
            if (!t.terrain.inBounds(o, s, 3)) continue;
            let c = this.gy(o, s),
              l = 0.6 + e * 0.08;
            (t.vfx.norm.spawn({
              x: this.bx,
              y: this.by + 2,
              z: this.bz,
              vx: (o - this.bx) / l,
              vy: (c - this.by - 2) / l + 9,
              vz: (s - this.bz) / l,
              gravity: 18,
              life: l,
              size: 1,
              endSize: 1,
              color: 16777215,
              shape: I.PixSnow,
            }),
              t.later(l, () => {
                this.live &&
                  (t.vfx.burst(o, c + 1, s, 12580095, 14, 5, I.Shard, 0.5, 0.5),
                  t.audio.shot(`ice`, 0.5),
                  this.pillars.push({
                    o: this.obj(131, o, s, 0.012, 1, 3.6),
                    x: o,
                    z: s,
                    t: 9,
                    g: this.model(`frost_pillar`, o, s, 0.8),
                  }));
              }));
          }
          return (
            this.popup(c(`¡Témpanos!`), `#9ae8ff`, 1.1),
            t.later(1.8, () => {
              this.live && this.hydroPump();
            }),
            t.later(5, () => {
              this.live && this.surf();
            }),
            (this.B.hold = 1.6),
            7.5
          );
        }
        block(e, t, n, r) {
          let i = 1,
            a = n - e,
            o = r - t,
            s = a * a + o * o || 1;
          for (let n of this.pillars) {
            if (!n.o) continue;
            let r = Gs(((n.x - e) * a + (n.z - t) * o) / s, 0, 1);
            Math.hypot(e + a * r - n.x, t + o * r - n.z) < 1.2 && r < i && (i = r);
          }
          return i;
        }
        hydroPump() {
          let e = this.run,
            t = this.toPlayer(),
            n = this.bx,
            r = this.bz,
            i = n + t.x * 34,
            a = r + t.z * 34,
            o = 1.1 * this.B.tk;
          (this.strip(n, r, i, a, 1.2, o, 4892927),
            (this.B.hold = o + 1.2),
            this.popup(c(`¡Hidrobomba!`), `#6ab8ff`, 1.1),
            e.later(o, () => {
              if (!this.live) return;
              let t = this.block(n, r, i, a),
                o = n + (i - n) * t,
                s = r + (a - r) * t;
              for (let t = 0; t < 6; t++)
                e.later(t * 0.12, () => {
                  (e.vfx.beams.spawn(n, this.by + 1.4, r, o, this.gy(o, s) + 1.2, s, 2.2, 4892927, 0.14),
                    e.vfx.beams.spawn(n, this.by + 1.4, r, o, this.gy(o, s) + 1.2, s, 0.8, 16777215, 0.12));
                });
              (e.vfx.burst(o, this.gy(o, s) + 1.2, s, 14218495, 24, 9, I.PixDrop, 0.6, 0.5, 10),
                e.audio.cone(`water`, 0.8),
                e.shake(0.3),
                t < 1
                  ? this.pop(c(`¡El hielo te cubre!`), `#7aff8a`, 0.2)
                  : this.segDist(n, r, o, s) < 1.2 + e.player.radius &&
                    this.low(1.6) &&
                    this.strike(1.8, 0.14));
            }));
        }
        surf() {
          ((this.wave = { r: this.E.radius[this.i] + 1, hit: !1, x: this.bx, z: this.bz }),
            this.popup(c(`¡Surf!`), `#6ab8ff`, 1.1),
            this.run.audio.cone(`water`, 1.2));
        }
        tick(e, t) {
          let n = this.run,
            r = n.player.pos;
          for (let r of this.pillars)
            ((r.t -= e),
              r.o &&
                !this.objAlive(r.o) &&
                ((r.o = null),
                (r.t = 0),
                n.vfx.burst(r.x, this.gy(r.x, r.z) + 1.5, r.z, 12580095, 18, 7, I.Shard, 0.6, 0.5, 12),
                n.audio.shot(`ice`, 0.6)),
              r.t <= 0 || !t
                ? (r.o && this.objRemove(r.o), (r.o = null), this.group.remove(r.g), (r.t = 0))
                : !r.g.children.length &&
                  Math.random() < 0.3 &&
                  n.vfx.add.spawn({
                    x: r.x,
                    y: this.gy(r.x, r.z) + F.range(0.2, 3.4),
                    z: r.z,
                    life: 0.3,
                    size: 1.2,
                    endSize: 1,
                    color: 12580095,
                    shape: I.Shard,
                    glow: 0.4,
                  }));
          if (((this.pillars = this.pillars.filter((e) => e.t > 0)), this.wave && t)) {
            let t = this.wave,
              i = t.r;
            t.r += e * 11;
            let a = this.gy(t.x, t.z);
            n.vfx.staticRing(t.x, a + 0.2, t.z, t.r, 6994175, 0.85);
            for (let e = 0; e < 6; e++) {
              let e = F.range(0, Math.PI * 2);
              n.vfx.norm.spawn({
                x: t.x + Math.cos(e) * t.r,
                y: a + 0.4,
                z: t.z + Math.sin(e) * t.r,
                vy: F.range(2, 4),
                gravity: 12,
                life: 0.4,
                size: 0.9,
                endSize: 0.4,
                color: 16777215,
                shape: I.PixWave,
              });
            }
            for (let e of this.pillars) {
              let r = Math.hypot(e.x - t.x, e.z - t.z);
              e.o &&
                r >= i - 1 &&
                r < t.r + 1 &&
                (this.objRemove(e.o),
                (e.o = null),
                (e.t = 0.01),
                n.vfx.burst(e.x, a + 1.5, e.z, 12580095, 18, 7, I.Shard, 0.6, 0.5, 12));
            }
            let o = Math.hypot(r.x - t.x, r.z - t.z);
            (!t.hit &&
              o >= i - 0.7 &&
              o < t.r + 0.7 &&
              ((t.hit = !0),
              this.low(1.3)
                ? this.strike(1.3, 0.1)
                : n.ui.popup(r.x, r.y + 2.4, r.z, c(`¡Esquivado!`), `#7aff8a`, 0.9)),
              t.r > 26 && (this.wave = null));
          }
          t || (this.wave = null);
        }
      },
      65: class extends py {
        marking = 0;
        markT = 0;
        marks = [];
        spoons = [];
        next = `future`;
        rage = !1;
        name() {
          return this.next === `future` ? c(`Premonición`) : c(`Telequinesis`);
        }
        cast(e) {
          let t = this.next;
          if (
            ((this.next = t === `future` ? `spoons` : `future`),
            (this.rage = e),
            (this.E.atkAnim[this.i] = 0.6),
            t === `future`)
          )
            return (
              (this.marking = 3.5),
              (this.markT = 0),
              this.popup(c(`¡Premonición!`), `#ff8ad8`, 1.1),
              this.run.audio.melody([84, 79, 74], 0.2),
              6
            );
          let n = e ? 8 : 6;
          for (let e = 0; e < n; e++)
            this.spoons.push({
              a: (e / n) * Math.PI * 2,
              t: 1.2 + e * 0.45,
              fired: !1,
              x: 0,
              z: 0,
              dx: 0,
              dz: 0,
              s: 0,
              hit: !1,
            });
          return (this.popup(c(`¡Telequinesis!`), `#ffd06a`, 1.1), 1.5 + n * 0.45 + 1);
        }
        tick(e, t) {
          let n = this.run,
            r = n.player.pos;
          if (!t) ((this.marks = []), (this.spoons = []), (this.marking = 0));
          else {
            if (
              this.marking > 0 &&
              ((this.marking -= e),
              (this.markT -= e),
              this.markT <= 0 && ((this.markT = 0.3), this.marks.push({ x: r.x, z: r.z, t: 2.2 }), this.rage))
            ) {
              let e = F.range(0, Math.PI * 2),
                t = F.range(3, 8);
              this.marks.push({ x: this.bx + Math.cos(e) * t, z: this.bz + Math.sin(e) * t, t: 2.2 });
            }
            for (let t of this.marks) {
              t.t -= e;
              let i = this.gy(t.x, t.z);
              (n.vfx.staticRing(
                t.x,
                i + 0.08,
                t.z,
                2.2 * (0.4 + 0.6 * (1 - t.t / 2.2)),
                t.t < 0.5 ? 16726666 : 16747224,
                0.8,
              ),
                Math.random() < e * 3 && n.orbitals.push(t.x, i + 0.4, t.z, 0.7, 16747224, I.Eye, 0, 0.6),
                t.t <= 0 &&
                  (n.vfx.burst(t.x, i + 0.5, t.z, 16747224, 14, 6, I.Twinkle, 0.5, 0.4),
                  n.vfx.ring(t.x, i, t.z, 2.2, 16734890, 0.3),
                  n.audio.boom(0.3),
                  (r.x - t.x) ** 2 + (r.z - t.z) ** 2 < 2.2 * 2.2 && this.low(1.6) && this.strike(0.9)));
            }
            this.marks = this.marks.filter((e) => e.t > 0);
            for (let t of this.spoons)
              if (((t.t -= e), t.fired)) {
                t.s += e * 24;
                let i = t.x + t.dx * t.s,
                  a = t.z + t.dz * t.s;
                (n.orbitals.push(i, this.gy(i, a) + 1.2, a, 1, 16777215, I.Crescent, Math.atan2(t.dz, t.dx), 1),
                  !t.hit &&
                    Math.hypot(r.x - i, r.z - a) < 1.1 &&
                    this.low(1.6) &&
                    ((t.hit = !0), this.strike(0.8)));
              } else {
                if (
                  ((t.a += e * 1.6),
                  (t.x = r.x + Math.cos(t.a) * 7),
                  (t.z = r.z + Math.sin(t.a) * 7),
                  n.orbitals.push(t.x, this.gy(t.x, t.z) + 1.4, t.z, 0.9, 16765034, I.Crescent, t.a, 0.7),
                  t.t <= 0.6 && t.t + e > 0.6)
                ) {
                  let e = Math.hypot(r.x - t.x, r.z - t.z) || 1;
                  ((t.dx = (r.x - t.x) / e),
                    (t.dz = (r.z - t.z) / e),
                    this.strip(t.x, t.z, t.x + t.dx * 14, t.z + t.dz * 14, 0.6, 0.6, 16765034));
                }
                t.t <= 0 && ((t.fired = !0), (t.t = 0.6), n.audio.whoosh());
              }
            this.spoons = this.spoons.filter((e) => !e.fired || e.s <= 14);
          }
        }
      },
    };
  function hy(e, t, n) {
    let r = my[e.enemies.species[n]];
    return r ? new r(e, t, n) : null;
  }
  var gy = { 101: [100], 73: [72], 125: [81] },
    _y = 12577023,
    vy = 10115839,
    yy = {
      105: class extends py {
        calm = 0;
        shown = 0;
        calmCd = 0;
        lamentT = 9;
        bones = [];
        waves = [];
        said = !1;
        lastPulse = -99;
        constructor(e, t, n) {
          (super(e, t, n),
            (e.enemies.veil[n] = 3),
            e.later(2.8, () =>
              e.ui.toast(
                c(`Tus ataques la atraviesan: enciende las tres velas del memorial para calmarla`),
                null,
              ),
            ));
        }
        alt = !1;
        name() {
          return this.alt ? c(`Lamento`) : c(`Huesomerang`);
        }
        cast(e) {
          return ((this.alt = !this.alt), this.alt ? this.castBone(e) : this.castWail(e));
        }
        castBone(e) {
          let t = this.run.player.pos,
            n = e ? 3 : 1;
          for (let e = 0; e < n; e++) {
            let r = (e - (n - 1) / 2) * 0.5,
              i = t.x - this.bx,
              a = t.z - this.bz,
              o = Math.hypot(i, a) || 1,
              s = Math.atan2(a, i) + r,
              c = Math.min(18, o + 4);
            this.bones.push({
              t: 0,
              x: this.bx,
              z: this.bz,
              tx: this.bx + Math.cos(s) * c,
              tz: this.bz + Math.sin(s) * c,
              hit: !1,
            });
          }
          return ((this.E.atkAnim[this.i] = 0.5), this.run.audio.whoosh(), e ? 2.8 : 3.6);
        }
        castWail(e) {
          let t = () => {
            (this.run.vfx.enemyCircle(this.bx, this.gy(this.bx, this.bz), this.bz, 3.5, _y, 0.5),
              this.waves.push({ r: -5, hit: !1 }));
          };
          return (
            t(),
            e &&
              this.run.later(0.7, () => {
                this.live && t();
              }),
            this.popup(c(`¡Lamento!`), `#bfe8ff`, 1.1),
            this.run.cry(105, 0.8),
            this.run.shake(0.25, this.bx, this.bz),
            e ? 3 : 3.8
          );
        }
        hitMul() {
          return this.calm > 0 ? 1.6 : this.shown > 0 ? 1 : (this.pop(c(`¡Intangible!`), `#bfe8ff`, 1.2), 0.06);
        }
        tick(e, t) {
          let n = this.run,
            r = n.tower,
            i = this.E,
            a = this.i;
          if (
            ((this.popT -= e),
            (this.calm = Math.max(0, this.calm - e)),
            (this.shown = Math.max(0, this.shown - e)),
            (this.calmCd = Math.max(0, this.calmCd - e)),
            !t || !r)
          )
            return;
          this.calm <= 0 &&
            this.calmCd <= 0 &&
            r.litCount(!0) >= 3 &&
            ((this.calm = 12),
            (this.calmCd = 14),
            n.ui.banner(
              c(`¡Marowak se calma!`),
              c(`Sus ojos se cierran un momento: ¡ahora puedes alcanzarla!`),
              `#ffd27a`,
              { species: 105 },
            ),
            n.vfx.ring(this.bx, this.by, this.bz, 9, 16765562, 0.8),
            this.said || ((this.said = !0), n.audio.victory()),
            n.later(12, () => {
              for (let e of r.candles)
                e.memorial && e.lit > 0 && ((e.lit = 0), e.flame && (e.flame.visible = !1));
            }));
          let o = r.lastPulse;
          if (
            (o.t > this.lastPulse &&
              n.time - o.t < 0.3 &&
              ((this.lastPulse = o.t),
              Math.hypot(o.x - this.bx, o.z - this.bz) < 12 + 3 * (n.player.items.get(`silph-scope`) ?? 0) &&
                ((this.shown = 4), this.popup(c(`¡El Visor la muestra!`), `#8ae8ff`, 0.9))),
            (i.veil[a] = this.calm > 0 || this.shown > 0 ? 0 : 3),
            this.calm > 0 && Math.random() < e * 10
              ? n.vfx.add.spawn({
                  x: this.bx + F.range(-1, 1),
                  y: this.by + F.range(0.5, 2.5),
                  z: this.bz + F.range(-1, 1),
                  vy: 0.8,
                  life: 0.8,
                  size: 0.35,
                  endSize: 0,
                  color: 16765562,
                  shape: I.Twinkle,
                  glow: 0.9,
                })
              : Math.random() < e * 6 &&
                n.vfx.add.spawn({
                  x: this.bx + F.range(-1.2, 1.2),
                  y: this.by + F.range(0.5, 3),
                  z: this.bz + F.range(-1.2, 1.2),
                  vy: 0.5,
                  life: 1,
                  size: 1,
                  endSize: 0,
                  color: _y,
                  shape: I.Wisp,
                  glow: 0.5,
                }),
            (this.lamentT -= e),
            this.lamentT <= 0 && this.calm <= 0)
          ) {
            this.lamentT = F.range(11, 15);
            let e = r.candles.filter((e) => e.memorial && e.lit > 0);
            if (e.length) {
              let t = F.pick(e);
              (n.vfx.enemyCircle(t.x, t.y, t.z, 2, _y, 1.2),
                n.later(1.2, () => {
                  this.live &&
                    ((t.lit = 0),
                    t.flame && (t.flame.visible = !1),
                    n.vfx.burst(t.x, t.y + 2.2, t.z, _y, 12, 4, I.Wisp, 0.5, 0.6),
                    n.ui.popup(t.x, t.y + 3, t.z, c(`¡Apagada!`), `#bfe8ff`, 0.9));
                }));
            }
          }
          let s = n.player.pos;
          for (let t of this.bones) {
            t.t += e / 1.7;
            let r = t.t < 0.5 ? t.t * 2 : 2 - t.t * 2,
              i = this.bx + (t.tx - this.bx) * r,
              a = this.bz + (t.tz - this.bz) * r,
              o = this.gy(i, a) + 1.2;
            (n.orbitals.push(i, o, a, 1.3, 15261951, I.PixBone, n.time * 14, 0.6),
              Math.random() < 0.5 && n.vfx.trail(i, o, a, _y, 0.4, I.Soft, 0.3),
              !t.hit &&
                Math.hypot(s.x - i, s.z - a) < 1.4 &&
                this.low(1.8) &&
                ((t.hit = !0), this.strike(0.9)));
          }
          this.bones = this.bones.filter((e) => e.t < 1);
          for (let t of this.waves) {
            let r = t.r;
            if (
              ((t.r += e * 12),
              t.r > 0.5 && n.vfx.staticRing(this.bx, this.gy(this.bx, this.bz) + 0.15, this.bz, t.r, _y, 0.85),
              t.r < 1)
            )
              continue;
            let i = Math.hypot(s.x - this.bx, s.z - this.bz);
            !t.hit &&
              i >= r - 0.6 &&
              i < t.r + 0.6 &&
              ((t.hit = !0),
              this.low(1.3)
                ? this.strike(1.1)
                : n.ui.popup(s.x, s.y + 2.4, s.z, c(`¡Esquivado!`), `#7aff8a`, 0.9));
          }
          this.waves = this.waves.filter((e) => e.r < 24);
        }
      },
      94: class extends py {
        phase = 1;
        clones = [];
        dive = 0;
        exposed = 0;
        hyp = null;
        constructor(e, t, n) {
          (super(e, t, n), e.sprites.get(94));
        }
        name() {
          return this.phase === 1 ? c(`Doble Equipo`) : this.phase === 2 ? `潜入墙壁` : c(`Comesueños`);
        }
        cast(e) {
          return this.phase === 1
            ? this.doubleTeam(e)
            : this.phase === 2
              ? this.wallDive(e)
              : Math.random() < 0.4
                ? this.doubleTeam(e)
                : this.hypnosis(e);
        }
        doubleTeam(e) {
          let t = this.run,
            n = this.E,
            r = t.player.pos,
            i = e ? 4 : 3;
          this.killClones();
          let a = Array.from({ length: i + 1 }, (e, t) => {
              let n = (t / (i + 1)) * Math.PI * 2 + F.range(-0.3, 0.3);
              return { x: r.x + Math.cos(n) * 9, z: r.z + Math.sin(n) * 9 };
            }).map((e) => {
              let n = Math.hypot(e.x, e.z),
                r = t.terrain.arenaR - 2;
              return n > r ? { x: (e.x / n) * r, z: (e.z / n) * r } : e;
            }),
            o = F.int(0, i);
          for (let e = 0; e <= i; e++) {
            let r = a[e];
            if ((t.vfx.burst(r.x, this.gy(r.x, r.z) + 1.5, r.z, vy, 14, 5, I.Wisp, 0.6, 0.5), e === o)) {
              ((n.x[this.i] = r.x), (n.z[this.i] = r.z));
              continue;
            }
            let i = n.spawn(94, r.x, r.z, 1, 1, 0);
            i < 0 ||
              ((n.veil[i] = 2),
              (n.hp[i] = n.maxHp[i] = Math.max(1, n.maxHp[this.i] * 0.012)),
              (n.dmg[i] = n.dmg[this.i] * 0.35),
              (n.xp[i] = 0),
              (n.scale[i] = n.scale[this.i]),
              (n.radius[i] = n.radius[this.i]),
              (n.hgt[i] = n.hgt[this.i]),
              (n.sized[i] = 1),
              this.clones.push([i, n.gen[i]]));
          }
          return (
            this.popup(c(`¡Doble Equipo!`), `#c8a8ff`, 1.1),
            t.audio.whoosh(),
            t.later(1.1 * this.B.tk, () => {
              if (this.live)
                for (let [t, i] of [[this.i, n.gen[this.i]], ...this.clones]) {
                  if (n.gen[t] !== i || !n.isAlive(t)) continue;
                  let a = Math.atan2(r.z - n.z[t], r.x - n.x[t]);
                  for (let n of e ? [-0.25, 0, 0.25] : [0])
                    this.B.shot(t, a + n, 11, t === this.i ? 0.9 : 0.5, { size: 1.3, shape: I.Swirl });
                }
            }),
            e ? 4.2 : 5.2
          );
        }
        killClones() {
          let e = this.E;
          for (let [t, n] of this.clones)
            e.gen[t] === n &&
              e.isAlive(t) &&
              (this.run.vfx.burst(e.x[t], e.y[t] + 1.5, e.z[t], vy, 10, 4, I.Wisp, 0.5, 0.5), e.kill(t));
          this.clones = [];
        }
        wallDive(e) {
          let t = this.run,
            n = this.E,
            r = F.range(0, Math.PI * 2),
            i = t.terrain.arenaR - 1.5,
            a = Math.cos(r) * i,
            o = Math.sin(r) * i;
          ((this.dive = 2.2 * this.B.tk),
            (this.B.hold = this.dive + 0.4),
            t.vfx.burst(this.bx, this.by + 1.5, this.bz, vy, 20, 6, I.Wisp, 0.6, 0.6),
            (n.veil[this.i] = 1));
          for (let e = 0; e < 8; e++)
            t.later(e * 0.25, () =>
              t.vfx.add.spawn({
                x: a,
                y: this.gy(a, o) + 2.6,
                z: o,
                life: 0.3,
                size: 1.1,
                endSize: 0.9,
                color: 16726634,
                shape: I.Eye,
                glow: 1,
              }),
            );
          return (
            t.later(this.dive, () => {
              if (!this.live) return;
              ((n.x[this.i] = a),
                (n.z[this.i] = o),
                (n.veil[this.i] = 0),
                (this.exposed = e ? 3.2 : 4),
                t.vfx.burst(a, this.gy(a, o) + 2, o, vy, 30, 8, I.Wisp, 0.7, 0.7),
                t.shake(0.35, a, o));
              let r = t.player.pos,
                i = Math.atan2(r.z - o, r.x - a);
              for (let e = -2; e <= 2; e++)
                this.B.shot(this.i, i + e * 0.22, 10, 0.8, { size: 1.4, shape: I.Swirl });
              this.popup(c(`¡Expuesto!`), `#ffe23a`, 1.1);
            }),
            this.dive + (e ? 3.4 : 4.4)
          );
        }
        hypnosis(e) {
          let t = this.run,
            n = t.player.pos,
            r = this.bx,
            i = this.bz,
            a = n.x - r,
            o = n.z - i,
            s = Math.hypot(a, o) || 1,
            l = r + (a / s) * 20,
            u = i + (o / s) * 20,
            d = 0.9 * this.B.tk;
          return (
            this.strip(r, i, l, u, 1.8, d, 14191359),
            (this.hyp = { t: d, ax: r, az: i, bx: l, bz: u }),
            (this.B.hold = d + 0.3),
            this.popup(c(`¡Hipnosis!`), `#d88aff`, 1.1),
            t.audio.shot(`psychic`, 0.7),
            e ? 3.4 : 4.2
          );
        }
        hitMul() {
          if (this.dive > 0) return (this.pop(c(`¡Intangible!`), `#c8a8ff`), 0.05);
          let e = this.exposed > 0 ? 1.6 : 1,
            t = this.run.tower;
          return (
            t &&
              t.candles.some((e) => e.lit > 0 && Math.hypot(e.x - this.bx, e.z - this.bz) < 7.5) &&
              (e *= 1.35),
            e
          );
        }
        tick(e, t) {
          let n = this.run,
            r = this.E,
            i = this.i,
            a = n.player;
          if (
            ((this.popT -= e),
            (this.dive = Math.max(0, this.dive - e)),
            (this.exposed = Math.max(0, this.exposed - e)),
            !t)
          ) {
            this.killClones();
            return;
          }
          let o = r.hp[i] / r.maxHp[i],
            s = o > 0.66 ? 1 : o > 0.33 ? 2 : 3;
          if (s !== this.phase) {
            this.phase = s;
            this.killClones();
            n.ui.banner(
              s === 2 ? `潜入墙壁` : c(`¡Comesueños!`),
              s === 2 ? `留意墙边的眼睛，等对手现身后反击` : c(`No dejes que te duerma: esquiva la Hipnosis`),
              `#9a5aff`,
              { species: 94 },
            );
            n.tower?.ringBell(s);
            n.audio.bossStart();
          }
          (this.exposed > 0 &&
            Math.random() < e * 12 &&
            n.vfx.add.spawn({
              x: this.bx + F.range(-1, 1),
              y: this.by + F.range(0.5, 3),
              z: this.bz + F.range(-1, 1),
              vy: 1,
              life: 0.6,
              size: 0.4,
              endSize: 0,
              color: 16769594,
              shape: I.Spark,
              glow: 0.8,
            }),
            (this.clones = this.clones.filter(([e, t]) => r.gen[e] === t && r.isAlive(e))));
          let l = this.hyp;
          if (l && ((l.t -= e), l.t <= 0)) {
            this.hyp = null;
            for (let e = 0; e <= 20; e += 1.5) {
              let t = l.ax + ((l.bx - l.ax) * e) / 20,
                r = l.az + ((l.bz - l.az) * e) / 20;
              n.vfx.add.spawn({
                x: t,
                y: this.gy(t, r) + 0.8,
                z: r,
                vy: 1,
                life: 0.6,
                size: 0.8,
                endSize: 0,
                color: 14191359,
                shape: I.Swirl,
                glow: 0.7,
              });
            }
            this.segDist(l.ax, l.az, l.bx, l.bz) < 1.8 &&
              this.low(1.6) &&
              a.inflict(`sleep`, 1.6) &&
              (n.ui.popup(a.pos.x, a.pos.y + 2.4, a.pos.z, c(`¡Dormido!`), `#d88aff`, 1),
              n.later(0.6, () => {
                if (!this.live) return;
                let e = n.player.pos,
                  t = Math.atan2(e.z, e.x) + Math.PI,
                  a = e.x + Math.cos(t) * 2,
                  o = e.z + Math.sin(t) * 2;
                ((r.x[i] = a),
                  (r.z[i] = o),
                  n.vfx.burst(a, this.gy(a, o) + 1.5, o, vy, 20, 6, I.Wisp, 0.6, 0.6),
                  n.player.pstat.sleep > 0 &&
                    (this.strike(1.5, 0.12),
                    (r.hp[i] = Math.min(r.maxHp[i], r.hp[i] + r.maxHp[i] * 0.05)),
                    this.popup(c(`¡Comesueños!`), `#ff6aa8`, 1.2),
                    n.vfx.number(r.x[i], r.y[i] + r.hgt[i] + 0.4, r.z[i], r.maxHp[i] * 0.05, 5963658, !1)));
              }));
          }
        }
        dispose() {
          this.killClones();
          super.dispose();
        }
      },
    },
    by = 16769594,
    xy = class extends Qv {
      float = !0;
      phaseNames = [c(`Ave del trueno`), c(`Marea de tormenta`), c(`Ojo de la tormenta`)];
      phaseColor = `#ffe23a`;
      band = [11, 17];
      speed = 5.6;
      ultT = 9;
      down = 0;
      stuck = 0;
      reticle = null;
      drill = null;
      orbs = [];
      rings = [];
      marked = [];
      markT = 0;
      tipShown = !1;
      constructor(e, t) {
        (super(e, t), (this.E.alt[t] = 2.4));
      }
      get S() {
        return this.run.sanctuary;
      }
      rodNear(e, t, n = 4) {
        let r = this.S;
        return r && `rodNear` in r ? r.rodNear(e, t, n) : null;
      }
      hitMul() {
        return this.down > 0 ? 1.8 : this.stuck > 0 ? 1.4 : 1;
      }
      downed(e) {
        if (this.dead) return;
        let t = this.run,
          n = this.E,
          r = this.i;
        ((this.down = e),
          (this.lock = e),
          (this.barrierRate = 2.5),
          (this.reticle = null),
          (this.drill = null),
          (this.stuck = 0),
          (n.alt[r] = 0),
          (n.y[r] = this.groundY(n.x[r], n.z[r]) + 0.4),
          t.cry(this.species),
          t.shake(0.6),
          t.hitstop(0.15),
          t.meta.count(`zapdosDown`, 1),
          t.ui.banner(
            c(`¡Zapdos derribado!`),
            c(`Su propio rayo lo tumba: ¡ahora recibe mucho más daño!`),
            `#ffe23a`,
            { species: this.species },
          ),
          t.vfx.burst(n.x[r], n.y[r] + 1, n.z[r], by, 40, 12, I.PixBolt, 0.8, 0.7),
          t.vfx.dust(n.x[r], n.y[r], n.z[r], 9079434, 20, 8));
      }
      attack() {
        let e = this.S,
          t =
            this.phase === 1
              ? [`lock`, `drill`, `wave`, `cannon`, `chain`]
              : [
                  `lock`,
                  `drill`,
                  `wave`,
                  `cannon`,
                  `chain`,
                  `bolts`,
                  ...(e && e.tide > 0.5 ? [`sea`, `sea`] : []),
                ];
        switch (this.pick(t)) {
          case `lock`:
            return this.lockOn();
          case `drill`:
            return this.drillPeck();
          case `wave`:
            return this.thunderWave();
          case `cannon`:
            return this.zapCannon();
          case `chain`:
            return this.chain();
          case `bolts`:
            return this.thunder();
          default:
            return this.electricSea();
        }
      }
      lockOn() {
        let e = this.run.player.pos;
        return (
          (this.reticle = { t: 1.8, x: e.x, z: e.z, bolts: this.phase >= 3 ? 4 : 3 }),
          this.run.ui.popup(this.bx, this.by + 4.6, this.bz, c(`¡Trueno Dirigido!`), `#ffe23a`, 1),
          this.run.audio.alarm(),
          !this.tipShown &&
            this.S &&
            ((this.tipShown = !0),
            this.run.ui.toast(c(`Ponte junto a un pararrayos activo: el rayo irá a él y no a ti`), null)),
          (this.E.atkAnim[this.i] = 1),
          4.4
        );
      }
      bolt(e, t, n, r = 0.75) {
        let i = this.run,
          a = this.groundY(e, t),
          o = 2.8,
          s = this.rodNear(e, t, 4);
        s
          ? (i.vfx.enemyCircle(s.x, s.y, s.z, 2, by, r),
            i.later(r, () => {
              this.dead ||
                (this.S?.hitRod(s),
                i.ui.popup(
                  i.player.pos.x,
                  i.player.pos.y + 2.4,
                  i.player.pos.z,
                  c(`¡Pararrayos!`),
                  `#7aff8a`,
                  0.9,
                ));
            }))
          : (i.vfx.enemyCircle(e, a, t, o, by, r),
            i.later(r, () => {
              (i.vfx.lightning(e + F.range(-3, 3), a + 26, t + F.range(-3, 3), e, a, t, 16777215, 0.6, 9, 0.25),
                i.vfx.lightning(e, a + 20, t, e, a, t, by, 0.35, 7, 0.3),
                i.vfx.burst(e, a + 0.4, t, by, 14, 7, I.PixBolt, 0.6, 0.5),
                i.vfx.ring(e, a, t, o, by, 0.35),
                i.vfx.flash(e, a + 1, t, 16777215, 4, 0.12),
                i.audio.boom(0.6),
                i.shake(0.2, e, t),
                i.sanctuary?.blast(e, t, o, 20));
              let r = i.player.pos;
              (r.x - e) ** 2 + (r.z - t) ** 2 < o * o &&
                this.playerLow(a, 1.8) &&
                (this.hurt(n), i.player.inflict(`para`, 0.8));
            }));
      }
      drillPeck() {
        let e = this.run.player.pos;
        return (
          (this.drill = {
            t: this.phase >= 3 ? 1.8 : 2.2,
            x: e.x + F.range(-6, 6),
            z: e.z + F.range(-6, 6),
            lock: 0.45,
          }),
          (this.E.alt[this.i] = 9),
          (this.lock = 3.4),
          this.run.ui.popup(this.bx, this.by + 4.6, this.bz, c(`¡Pico Taladro!`), `#ffb03a`, 1),
          this.run.audio.whoosh(),
          4.6
        );
      }
      thunderWave() {
        let e = this.phase >= 2 ? 3 : 2;
        for (let t = 0; t < e; t++)
          this.run.later(t * 0.65, () => {
            this.dead ||
              this.rings.push({ r: 1.5, gap: F.range(0, Math.PI * 2), hit: !1, x: this.bx, z: this.bz });
          });
        return ((this.E.atkAnim[this.i] = 0.8), this.run.audio.shot(`electric`, 0.9), 3);
      }
      zapCannon() {
        let e = this.phase >= 3 ? 2 : 1;
        for (let t = 0; t < e; t++)
          this.orbs.push({
            x: this.bx + F.range(-1, 1),
            y: this.by + 1.5,
            z: this.bz + F.range(-1, 1),
            t: 6 + t,
          });
        return (
          (this.E.atkAnim[this.i] = 1),
          this.run.ui.popup(this.bx, this.by + 4.6, this.bz, c(`¡Electrocañón!`), `#ffe23a`, 1),
          this.run.audio.power(),
          3
        );
      }
      chain() {
        let e = this.run,
          t = this.E,
          n = e.player.pos;
        this.marked = [];
        for (let e of t.within(n.x, n.z, 16))
          if (
            !(t.flags[e] & (R.Boss | R.Object)) &&
            (this.marked.push({ j: e, g: t.gen[e] }), this.marked.length >= 6)
          )
            break;
        return this.marked.length < 2
          ? this.thunder()
          : ((this.markT = 2),
            e.ui.popup(this.bx, this.by + 4.6, this.bz, c(`¡Voltio Cruel!`), `#ffe23a`, 1),
            e.audio.alarm(),
            3.2);
      }
      thunder() {
        let e = this.run.player.pos,
          t = 5 + this.phase;
        for (let n = 0; n < t; n++)
          this.run.later(n * 0.18, () => {
            this.dead || this.bolt(e.x + (n ? F.range(-10, 10) : 0), e.z + (n ? F.range(-10, 10) : 0), 1.2, 1);
          });
        return ((this.E.atkAnim[this.i] = 0.8), 3.4);
      }
      electricSea() {
        let e = this.S,
          t = this.run;
        return e
          ? ((this.lock = 2.6),
            (this.E.alt[this.i] = 0.4),
            t.ui.banner(
              c(`¡Mar Electrificado!`),
              c(`Sal del agua: sube a una meseta, a un islote o salta`),
              `#ffe23a`,
              { species: this.species },
            ),
            t.audio.alarm(),
            e.shockSea(1.9, () => {
              (this.hurt(1.6, 0.18, `electric`), t.player.inflict(`para`, 1.2));
            }),
            t.later(2.4, () => {
              !this.dead && this.down <= 0 && (this.E.alt[this.i] = 2.4);
            }),
            4.4)
          : this.thunder();
      }
      ultimate() {
        let e = this.run,
          t = this.E,
          n = this.i;
        ((this.lock = 6.2),
          (this.cd = 3),
          (t.x[n] = this.hx),
          (t.z[n] = this.hz + 8),
          (t.alt[n] = 7),
          e.ui.banner(
            c(`¡Trueno Supremo!`),
            c(`Métete en el ojo de la tormenta o ponte junto a un pararrayos activo`),
            `#ff5a8a`,
            { species: this.species },
          ),
          e.audio.alarm());
        let r = 0;
        e.animate(
          4.4,
          (i) => {
            ((r -= 1 / 60),
              r <= 0 &&
                ((r = 0.55 - i * 0.35),
                e.vfx.ground.spawn({
                  x: this.hx,
                  y: this.groundY(this.hx, this.hz) + 0.15,
                  z: this.hz,
                  life: 0.7,
                  size: 70,
                  endSize: 6,
                  color: by,
                  shape: I.Ring,
                  glow: 0.05,
                  rot: 0,
                })),
              Math.random() < 0.5 &&
                e.vfx.lightning(
                  t.x[n] + F.range(-8, 8),
                  t.y[n] + 12,
                  t.z[n] + F.range(-8, 8),
                  t.x[n],
                  t.y[n] + 1,
                  t.z[n],
                  by,
                  0.3,
                  6,
                  0.15,
                ));
          },
          () => {
            if (this.dead) return;
            e.vfx.flash(this.hx, 6, this.hz, 16777215, 70, 0.35);
            for (let t = 0; t < 24; t++) {
              let n = F.range(0, Math.PI * 2),
                r = F.range(3, 45),
                i = Math.cos(n) * r,
                a = Math.sin(n) * r,
                o = this.groundY(i, a);
              e.vfx.lightning(i, o + 30, a, i, o, a, t % 2 ? 16777215 : by, 0.5, 8, 0.3);
            }
            (e.shake(1), e.audio.boom(1), e.hitstop(0.12), e.sanctuary?.blast(this.hx, this.hz, 40, 30));
            let t = e.player.pos,
              n = this.S,
              r = this.rodNear(t.x, t.z, 4.5);
            r
              ? (n?.hitRod(r, 3),
                e.ui.popup(t.x, t.y + 2.4, t.z, c(`¡El pararrayos lo absorbe todo!`), `#7aff8a`, 1))
              : n && n.eye.on && Math.hypot(t.x - n.eye.x, t.z - n.eye.z) < n.eye.r
                ? e.ui.popup(t.x, t.y + 2.4, t.z, c(`¡A salvo en el ojo!`), `#7aff8a`, 1)
                : (!n && Math.hypot(t.x - this.hx, t.z - this.hz) > 26) || this.hurt(3, 0.45, `electric`);
          },
        );
      }
      tick(e) {
        let t = this.run,
          n = this.E,
          r = this.i,
          i = t.player,
          a = i.pos;
        if (((this.stuck = Math.max(0, this.stuck - e)), this.down > 0)) {
          ((this.down -= e),
            (n.alt[r] = 0),
            Math.random() < e * 14 &&
              t.vfx.lightning(
                this.bx + F.range(-1.5, 1.5),
                this.by + F.range(0.5, 2.5),
                this.bz + F.range(-1.5, 1.5),
                this.bx + F.range(-1.5, 1.5),
                this.by,
                this.bz + F.range(-1.5, 1.5),
                by,
                0.15,
                3,
                0.1,
              ));
          let i = t.time * 5;
          for (let e = 0; e < 4; e++) {
            let a = i + (e / 4) * Math.PI * 2;
            t.orbitals.push(
              this.bx + Math.cos(a) * 2,
              this.by + n.hgt[r] + 0.6,
              this.bz + Math.sin(a) * 2,
              0.6,
              by,
              I.Star,
              a,
              0.9,
            );
          }
          this.down <= 0 &&
            ((this.barrierRate = 1),
            (n.alt[r] = 2.4),
            t.ui.popup(this.bx, this.by + 4, this.bz, c(`¡Vuelve a volar!`), `#ffe23a`, 1));
        }
        if (this.reticle) {
          let n = this.reticle,
            r = this.rodNear(a.x, a.z, 4),
            i = r ? r.x : a.x,
            o = r ? r.z : a.z;
          n.t > 0 &&
            ((n.t -= e), (n.x += (i - n.x) * Math.min(1, e * 3.2)), (n.z += (o - n.z) * Math.min(1, e * 3.2)));
          let s = this.groundY(n.x, n.z);
          (t.vfx.staticRing(n.x, s + 0.12, n.z, 2.8, r ? 8060810 : 16726586, 0.9),
            t.orbitals.push(n.x, s + 0.2, n.z, 1.6, r ? 8060810 : 16726586, I.Cross, t.time * 2, 0.8),
            n.t <= 0 && ((n.t = 0.55), this.bolt(n.x, n.z, 1.5), --n.bolts <= 0 && (this.reticle = null)));
        }
        if (this.drill) {
          let o = this.drill;
          if (o.t > 0) {
            o.t -= e;
            let t = a.x - o.x,
              s = a.z - o.z,
              c = Math.hypot(t, s) || 1,
              l = Math.min(c, e * Math.min(9.5, Math.max(6, i.speedNow * 0.9)));
            ((o.x += (t / c) * l),
              (o.z += (s / c) * l),
              (n.x[r] += (o.x - n.x[r]) * Math.min(1, e * 3)),
              (n.z[r] += (o.z - n.z[r]) * Math.min(1, e * 3)));
          } else o.lock -= e;
          let s = this.groundY(o.x, o.z),
            l = o.t > 0 ? 0.6 : 1;
          if (
            (t.vfx.ground.spawn({
              x: o.x,
              y: s + 0.1,
              z: o.z,
              life: 0.05,
              size: 3.6 * l + 1,
              endSize: 3.6 * l + 1,
              color: 1052696,
              shape: I.Soft,
              glow: 0,
              rot: 0,
            }),
            t.vfx.staticRing(o.x, s + 0.12, o.z, 3.2, o.t > 0 ? 16756794 : 16726586, 0.9),
            o.t <= 0 && o.lock <= 0)
          ) {
            ((this.drill = null),
              (n.x[r] = o.x),
              (n.z[r] = o.z),
              (n.alt[r] = 0),
              (n.y[r] = s + 0.5),
              t.vfx.burst(o.x, s + 0.5, o.z, by, 26, 10, I.PixFeather, 0.7, 0.6),
              t.vfx.ring(o.x, s, o.z, 3.2, by, 0.4),
              t.vfx.dust(o.x, s, o.z, 9079434, 16, 7),
              t.shake(0.5, o.x, o.z),
              t.audio.boom(0.9),
              t.sanctuary?.blast(o.x, o.z, 3.2, 30));
            let e = t.player.pos;
            ((e.x - o.x) ** 2 + (e.z - o.z) ** 2 < 3.2 * 3.2 &&
              this.playerLow(s, 1.6) &&
              (i.slideT > 0
                ? ((i.iframes = Math.max(i.iframes, 0.4)),
                  t.ui.popup(e.x, e.y + 2.4, e.z, c(`¡Esquiva perfecta!`), `#7aff8a`, 1.1))
                : this.hurt(1.8, 0.12, `flying`)),
              this.rings.push({ r: 3.2, gap: -99, hit: !1, x: o.x, z: o.z }),
              (this.stuck = 1.6),
              (this.lock = 1.6),
              t.ui.popup(o.x, s + 4, o.z, c(`¡Clavado!`), `#ffe23a`, 1),
              t.later(1.6, () => {
                !this.dead && this.down <= 0 && (n.alt[r] = 2.4);
              }));
          }
        }
        for (let n of this.rings) {
          let r = n.r;
          n.r += e * (n.gap < -9 ? 14 : 8);
          let o = this.groundY(n.x, n.z);
          for (let e = 0; e < 26; e++) {
            let r = (e / 26) * Math.PI * 2,
              i = r - n.gap;
            for (; i > Math.PI; ) i -= Math.PI * 2;
            for (; i < -Math.PI; ) i += Math.PI * 2;
            (n.gap > -9 && Math.abs(i) < 0.36) ||
              (Math.random() < 0.5 &&
                t.vfx.add.spawn({
                  x: n.x + Math.cos(r) * n.r,
                  y: o + 0.5,
                  z: n.z + Math.sin(r) * n.r,
                  life: 0.08,
                  size: 0.7,
                  endSize: 0.5,
                  color: by,
                  shape: I.Spark,
                  glow: 1,
                  rot: r,
                }));
          }
          let s = Math.hypot(a.x - n.x, a.z - n.z),
            l = Math.atan2(a.z - n.z, a.x - n.x) - n.gap;
          for (; l > Math.PI; ) l -= Math.PI * 2;
          for (; l < -Math.PI; ) l += Math.PI * 2;
          !n.hit &&
            s >= r - 0.5 &&
            s < n.r + 0.5 &&
            (n.gap < -9 || Math.abs(l) >= 0.36) &&
            ((n.hit = !0),
            this.playerLow(this.groundY(a.x, a.z), 1.3)
              ? (this.hurt(0.8, 0, `electric`), i.inflict(`para`, 1.6))
              : t.ui.popup(a.x, a.y + 2.4, a.z, c(`¡Esquivado!`), `#7aff8a`, 0.9));
        }
        this.rings = this.rings.filter((e) => e.r < 30 && !this.dead);
        for (let n of this.orbs) {
          n.t -= e;
          let r = a.x - n.x,
            o = a.z - n.z,
            s = Math.hypot(r, o) || 1;
          ((n.x += (r / s) * 5.2 * e),
            (n.z += (o / s) * 5.2 * e),
            (n.y += (this.groundY(n.x, n.z) + 1.4 - n.y) * e * 3),
            t.orbitals.push(n.x, n.y, n.z, 2.2 + Math.sin(t.time * 20) * 0.2, by, I.Soft, 0, 1),
            Math.random() < 0.6 &&
              t.vfx.lightning(
                n.x,
                n.y,
                n.z,
                n.x + F.range(-2, 2),
                n.y + F.range(-1.5, 1.5),
                n.z + F.range(-2, 2),
                16777215,
                0.15,
                3,
                0.08,
              ));
          let l = this.rodNear(n.x, n.z, 3);
          if (l)
            ((n.t = -1),
              this.S?.hitRod(l, 2),
              t.ui.popup(l.x, l.top + 2, l.z, c(`¡El pararrayos lo absorbe!`), `#7aff8a`, 0.9));
          else if (s < 2 || n.t <= 0) {
            n.t = -1;
            let e = this.groundY(n.x, n.z),
              r = 4.5;
            (t.vfx.flash(n.x, n.y, n.z, 16777215, 10, 0.2),
              t.vfx.burst(n.x, n.y, n.z, by, 30, 11, I.PixBolt, 0.8, 0.6),
              t.vfx.ring(n.x, e, n.z, r, by, 0.4),
              t.audio.boom(0.9),
              t.shake(0.4, n.x, n.z),
              t.sanctuary?.blast(n.x, n.z, r, 40),
              (a.x - n.x) ** 2 + (a.z - n.z) ** 2 < r * r &&
                this.playerLow(e, 2.2) &&
                (this.hurt(1.6, 0.1, `electric`), i.inflict(`para`, 1.5)));
          }
        }
        if (((this.orbs = this.orbs.filter((e) => e.t > 0 && !this.dead)), this.markT > 0)) {
          this.markT -= e;
          let r = this.marked.filter((e) => n.gen[e.j] === e.g && n.isAlive(e.j));
          for (let e of r)
            t.vfx.staticRing(
              n.x[e.j],
              n.y[e.j] + 0.1,
              n.z[e.j],
              5,
              by,
              0.35 + 0.4 * Math.abs(Math.sin(t.time * 10)),
            );
          if (this.markT <= 0) {
            let e = !1;
            for (let i of r) {
              t.vfx.lightning(
                this.bx,
                this.by + 1.5,
                this.bz,
                n.x[i.j],
                n.y[i.j] + 1,
                n.z[i.j],
                by,
                0.3,
                7,
                0.25,
              );
              for (let e of r)
                e !== i &&
                  Math.hypot(n.x[e.j] - n.x[i.j], n.z[e.j] - n.z[i.j]) < 10 &&
                  t.vfx.lightning(
                    n.x[i.j],
                    n.y[i.j] + 1,
                    n.z[i.j],
                    n.x[e.j],
                    n.y[e.j] + 1,
                    n.z[e.j],
                    16777215,
                    0.25,
                    6,
                    0.25,
                  );
              Math.hypot(a.x - n.x[i.j], a.z - n.z[i.j]) < 5 &&
                ((e = !0),
                t.vfx.lightning(n.x[i.j], n.y[i.j] + 1, n.z[i.j], a.x, a.y + 1, a.z, by, 0.35, 6, 0.25));
            }
            (t.audio.boom(0.7),
              e && (this.hurt(1.1, 0, `electric`), i.inflict(`para`, 1.2)),
              (this.marked = []));
          }
        }
        (this.down <= 0 &&
          Math.random() < e * 10 &&
          t.vfx.add.spawn({
            x: this.bx + F.range(-1.5, 1.5),
            y: this.by + F.range(0.5, 2.5),
            z: this.bz + F.range(-1.5, 1.5),
            vy: -1,
            life: 0.4,
            size: 0.6,
            endSize: 0.1,
            color: by,
            shape: I.Spark,
            glow: 1,
            rot: F.range(0, 6.3),
          }),
          this.phase >= 3 &&
            this.immune <= 0 &&
            this.down <= 0 &&
            !this.drill &&
            ((this.ultT -= e), this.ultT <= 0 && this.lock <= 0 && ((this.ultT = 14), this.ultimate())));
      }
      onPhase(e) {
        let t = this.run;
        ((this.reticle = null),
          (this.drill = null),
          (this.orbs = []),
          (this.rings = []),
          (this.marked = []),
          (this.down = 0),
          (this.stuck = 0),
          (this.barrierRate = 1),
          (this.E.alt[this.i] = 2.4));
        for (let e = 0; e < 6; e++)
          t.later(e * 0.1, () => {
            let e = F.range(0, Math.PI * 2),
              n = F.range(3, 12);
            t.vfx.lightning(
              this.bx,
              this.by + 25,
              this.bz,
              this.bx + Math.cos(e) * n,
              this.groundY(this.bx, this.bz),
              this.bz + Math.sin(e) * n,
              by,
              0.5,
              8,
              0.25,
            );
          });
        e === 3 && ((this.ultT = 2.5), (this.speed = 6.2));
      }
      render() {
        this.run.enemies.scale[this.i] = 2.8;
      }
    },
    Sy = class extends Qv {
      float = !0;
      phaseNames = [c(`Ave helada`), c(`Ventisca`), c(`Frío Absoluto`)];
      phaseColor = `#8ae8ff`;
      band = [11, 17];
      speed = 5.2;
      ultT = 9;
      frozen = 0;
      beam = null;
      gust = 0;
      gustA = 0;
      armorPop = 0;
      constructor(e, t) {
        (super(e, t), (this.E.alt[t] = 2.2));
      }
      get S() {
        let e = this.run.sanctuary;
        return e && `crack` in e ? e : null;
      }
      hitMul() {
        return this.frozen > 0
          ? 1.8
          : this.S?.armoured
            ? (this.armorPop <= 0 &&
                ((this.armorPop = 1),
                this.run.ui.popup(this.bx, this.by + 4.2, this.bz, c(`¡Coraza de hielo!`), `#c8e8ff`, 0.85)),
              0.15)
            : 1;
      }
      freeze(e, t, n) {
        if (this.dead) return;
        let r = this.run,
          i = this.E,
          a = this.i;
        ((this.frozen = e),
          (this.lock = e),
          (this.barrierRate = 2.5),
          (this.beam = null),
          (this.gust = 0),
          (i.alt[a] = 0),
          (i.y[a] = this.groundY(i.x[a], i.z[a]) + 0.4),
          r.cry(this.species),
          r.shake(0.6),
          r.hitstop(0.15),
          r.ui.banner(t, n, `#8ae8ff`, { species: this.species }),
          r.vfx.burst(i.x[a], i.y[a] + 1.5, i.z[a], 14218495, 46, 12, I.Shard, 0.9, 0.8, 10),
          this.S?.crack(i.x[a], i.z[a], 3));
      }
      shatter() {
        this.freeze(6, c(`¡Coraza rota!`), c(`Articuno cae congelado: ¡ahora recibe mucho más daño!`));
      }
      punish() {
        let e = this.run.player.pos,
          t = e.x,
          n = e.z;
        this.circle(t, n, 2.2, 1, 1.2, 9103615, I.Shard, () => this.S?.crack(t, n, 2.4));
      }
      attack() {
        let e =
          this.phase === 1 ? [`beam`, `hail`, `shards`, `gust`] : [`beam`, `beam`, `hail`, `shards`, `gust`];
        switch (this.pick(e)) {
          case `beam`:
            return this.iceBeam();
          case `hail`:
            return this.hail();
          case `shards`:
            return this.iceShards();
          default:
            return this.icyWind();
        }
      }
      tracePath(e, t) {
        let n = this.run.sanctuary,
          r = [{ x: this.bx, z: this.bz }],
          i = this.bx,
          a = this.bz,
          o = e - i,
          s = t - a,
          c = !1,
          l = 60,
          u = Math.hypot(o, s) || 1;
        ((o /= u), (s /= u));
        for (let e = 0; e <= 3 && l > 0; e++) {
          let t = l,
            u = null;
          for (let e of n?.covers ?? []) {
            if (!e.alive || e.kind !== `column`) continue;
            let n = i - e.x,
              r = a - e.z,
              c = n * o + r * s,
              l = n * n + r * r - 1.15 * 1.15,
              d = c * c - l;
            if (d < 0) continue;
            let f = -c - Math.sqrt(d);
            f > 0.05 && f < t && ((t = f), (u = e));
          }
          let d = i + o * t,
            f = a + s * t,
            p = this.by + 1,
            m = n ? n.firstBlock(i, p, a, d, p, f) : 1,
            h = (n?.layout.radius ?? 60) - 1;
          if (m < 0.999 && !(u && m > 0.97)) ((d = i + (d - i) * m), (f = a + (f - a) * m), (u = null));
          else if (Math.hypot(d, f) > h) {
            let e = this.clipCircle(i, a, o, s, h);
            ((d = i + o * e), (f = a + s * e), (u = null));
          }
          if (
            (r.push({ x: d, z: f }),
            e > 0 && this.segNear(i, a, d, f, this.bx, this.bz) < this.E.radius[this.i] + 0.6 && (c = !0),
            !u)
          )
            break;
          l -= Math.hypot(d - i, f - a);
          let g = (d - u.x) / 1.15,
            _ = (f - u.z) / 1.15,
            v = o * g + s * _;
          ((o -= 2 * v * g), (s -= 2 * v * _), (i = d + o * 0.05), (a = f + s * 0.05));
        }
        return { path: r, self: c };
      }
      clipCircle(e, t, n, r, i) {
        let a = e * n + t * r,
          o = e * e + t * t - i * i;
        return -a + Math.sqrt(Math.max(0, a * a - o));
      }
      segNear(e, t, n, r, i, a) {
        let o = n - e,
          s = r - t,
          c = o * o + s * s || 1,
          l = Math.max(0, Math.min(1, ((i - e) * o + (a - t) * s) / c));
        return Math.hypot(e + o * l - i, t + s * l - a);
      }
      iceBeam() {
        let e = this.run.player.pos,
          t = this.tracePath(e.x, e.z);
        return (
          (this.beam = { t: 1.4, lock: 0.5, fire: 0.9, path: t.path, self: t.self, hit: !1 }),
          (this.lock = 3),
          (this.E.atkAnim[this.i] = 1),
          this.run.ui.popup(this.bx, this.by + 4.6, this.bz, c(`¡Rayo Hielo!`), `#8ae8ff`, 1),
          this.run.audio.power(),
          3.8
        );
      }
      hail() {
        let e = this.run,
          t = e.player.pos,
          n = 5 + this.phase * 2;
        for (let r = 0; r < n; r++)
          e.later(r * 0.22, () => {
            if (this.dead) return;
            let n = {
              x: t.x + (r ? F.range(-10, 10) : e.player.vel.x * 0.9),
              z: t.z + (r ? F.range(-10, 10) : e.player.vel.z * 0.9),
            };
            e.sanctuary?.confine(n.x, n.z, 2, n);
            let i = n.x,
              a = n.z,
              o = this.groundY(i, a),
              s = 1.4;
            (e.animate(s, (t) => {
              e.vfx.ground.spawn({
                x: i,
                y: o + 0.11,
                z: a,
                life: 0.05,
                size: 1 + t * 3.6,
                endSize: 1 + t * 3.6,
                color: 2767450,
                shape: I.Soft,
                glow: 0,
                rot: 0,
              });
            }),
              e.vfx.norm.spawn({
                x: i,
                y: o + 22,
                z: a,
                vy: -22 / s,
                life: s,
                size: 2.4,
                endSize: 2.4,
                color: 14218495,
                shape: I.Shard,
                spin: 3,
              }),
              this.circle(i, a, 2.4, s, 1.3, 9103615, I.Shard, () => {
                this.S?.crack(i, a, 2.6);
                let t = this.S,
                  n = e.player.pos;
                t && Math.hypot(n.x - i, n.z - a) < 2.4 && (t.frost = Math.min(1, t.frost + 0.25));
              }));
          });
        return ((this.E.atkAnim[this.i] = 0.8), 3.6);
      }
      iceShards() {
        let e = this.run;
        for (let t = 0; t < 3; t++)
          e.later(t * 0.45, () => {
            if (this.dead) return;
            let n = e.player.pos,
              r = this.aimAt(n.x, n.z),
              i = Math.atan2(r.z, r.x),
              a = 7 + this.phase * 2;
            for (let e = 0; e < a; e++) {
              let n = i + (e / (a - 1) - 0.5) * 1.3 + (t % 2) * 0.09;
              this.shot(Math.cos(n), Math.sin(n), 12, 0.55, {
                shape: I.Shard,
                color: 14218495,
                life: 2.8,
                size: 1.1,
              });
            }
            ((this.E.atkAnim[this.i] = 0.4), e.audio.shot(`ice`, 0.6));
          });
        return 3;
      }
      icyWind() {
        let e = this.run.player.pos,
          t = this.aimAt(e.x, e.z);
        return (
          (this.gust = 2.2),
          (this.gustA = Math.atan2(t.z, t.x)),
          (this.lock = 2.4),
          this.run.ui.popup(this.bx, this.by + 4.6, this.bz, c(`¡Viento Hielo!`), `#d8f4ff`, 1),
          this.run.audio.whoosh(),
          3.4
        );
      }
      ultimate() {
        let e = this.run,
          t = this.E,
          n = this.i,
          r = this.S;
        if (((this.lock = 7), (this.cd = 3), (t.x[n] = this.hx), (t.z[n] = this.hz + 6), (t.alt[n] = 7), !r))
          this.cataclysm(this.bx, this.by + 4, this.bz, 4.4, 3, 0.45, 9103615, c(`¡Frío Absoluto!`), ``);
        else {
          (e.ui.banner(
            c(`¡Frío Absoluto!`),
            c(`Ve a los sectores con borde dorado antes de que se congelen`),
            `#ff5a8a`,
            { species: this.species },
          ),
            e.audio.alarm());
          for (let t = 0; t < 3; t++)
            e.later(t * 2.1, () => {
              if (this.dead) return;
              let n = e.player.pos,
                i = r.sectorOf(n.x, n.z),
                a = [i === 8 ? F.int(0, 7) : F.pick([i, (i + 1) % 8, (i + 7) % 8, 8])];
              for (; a.length < 3; ) {
                let e = F.int(0, 8);
                a.includes(e) || a.push(e);
              }
              if (t > 0 && a.includes(i) && F.chance(0.7)) {
                let e = i === 8 ? F.int(0, 7) : (i + 2) % 8;
                a.includes(e) || (a[a.indexOf(i)] = e);
              }
              e.animate(
                1.5,
                (e) => r.sectors(!0, a, e),
                () => {
                  if (this.dead) {
                    r.sectors(!1);
                    return;
                  }
                  (r.sectors(!0, a, 1, 1),
                    e.vfx.flash(0, this.groundY(0, 0) + 2, 0, 14218495, 60, 0.25),
                    e.shake(0.6),
                    e.audio.boom(1),
                    e.audio.shot(`ice`, 1));
                  for (let t = 0; t < 40; t++) {
                    let t = F.range(0, Math.PI * 2),
                      n = F.range(2, 36),
                      i = Math.cos(t) * n,
                      o = Math.sin(t) * n;
                    a.includes(r.sectorOf(i, o)) ||
                      e.vfx.norm.spawn({
                        x: i,
                        y: this.groundY(i, o),
                        z: o,
                        vy: F.range(5, 9),
                        gravity: 18,
                        life: 0.7,
                        size: 1.4,
                        endSize: 0.8,
                        color: 14218495,
                        shape: I.Shard,
                        rot: F.range(-0.4, 0.4),
                      });
                  }
                  let t = e.player.pos;
                  (a.includes(r.sectorOf(t.x, t.z))
                    ? e.ui.popup(t.x, t.y + 2.4, t.z, c(`¡A salvo!`), `#7aff8a`, 0.9)
                    : (this.hurt(2.2, 0.3, `ice`), e.player.inflict(`frozen`, 0.8)),
                    e.later(0.35, () => r.sectors(!1)));
                },
              );
            });
          e.later(6.6, () => {
            !this.dead && this.frozen <= 0 && (t.alt[n] = 2.2);
          });
        }
      }
      tick(e) {
        let t = this.run,
          n = this.E,
          r = this.i,
          i = t.player,
          a = i.pos;
        ((this.armorPop -= e),
          this.frozen > 0 &&
            ((this.frozen -= e),
            (n.alt[r] = 0),
            Math.random() < e * 10 &&
              t.vfx.add.spawn({
                x: this.bx + F.range(-1.5, 1.5),
                y: this.by + F.range(0.3, 3),
                z: this.bz + F.range(-1.5, 1.5),
                life: 0.5,
                size: 0.7,
                endSize: 0.3,
                color: 14218495,
                shape: I.Shard,
                glow: 0.6,
                rot: F.range(0, 6.3),
              }),
            t.vfx.staticRing(this.bx, this.by + 0.1, this.bz, 2.6, 14218495, 0.8),
            this.frozen <= 0 &&
              ((this.barrierRate = 1),
              (n.alt[r] = 2.2),
              t.vfx.burst(this.bx, this.by + 1.5, this.bz, 14218495, 30, 10, I.Shard, 0.7, 0.6),
              t.ui.popup(this.bx, this.by + 4, this.bz, c(`¡Se descongela!`), `#8ae8ff`, 1))));
        let o = this.beam;
        if (o) {
          if (o.t > 0) {
            o.t -= e;
            let t = this.tracePath(a.x, a.z);
            ((o.path = t.path), (o.self = t.self));
          } else o.lock > 0 ? (o.lock -= e) : (o.fire -= e);
          let n = o.t <= 0 && o.lock <= 0,
            r = o.self ? 16765034 : 9103615;
          for (let e = 0; e < o.path.length - 1; e++) {
            let s = o.path[e],
              c = o.path[e + 1],
              l = Math.hypot(c.x - s.x, c.z - s.z) || 1;
            if (n) {
              let n = e === 0 ? this.by + 1.2 : this.groundY(s.x, s.z) + 1.2,
                r = this.groundY(c.x, c.z) + 1.2;
              if (
                (t.vfx.beams.spawn(s.x, n, s.z, c.x, r, c.z, 1.8, 9103615, 0.06),
                t.vfx.beams.spawn(s.x, n, s.z, c.x, r, c.z, 0.6, 16777215, 0.06),
                !o.hit &&
                  this.segNear(s.x, s.z, c.x, c.z, a.x, a.z) < 1 + i.radius &&
                  this.playerLow(this.groundY(a.x, a.z), 1.8))
              ) {
                ((o.hit = !0), this.hurt(1.5, 0.12, `ice`));
                let e = this.S;
                e && (e.frost = Math.min(1, e.frost + 0.35));
              }
              e > 0 &&
                Math.random() < 0.5 &&
                t.vfx.burst(s.x, this.groundY(s.x, s.z) + 1.2, s.z, 16777215, 3, 5, I.Shard, 0.4, 0.3);
            } else
              for (let e = 0; e < l; e += 1.4) {
                let n = s.x + ((c.x - s.x) * e) / l,
                  i = s.z + ((c.z - s.z) * e) / l;
                t.orbitals.push(
                  n,
                  this.groundY(n, i) + 0.5,
                  i,
                  o.t > 0 ? 0.35 : 0.55,
                  o.t > 0 || Math.sin(t.time * 30) > 0 ? r : 16777215,
                  I.Soft,
                  0,
                  0.9,
                );
              }
          }
          if (n && o.fire <= 0) {
            let e = o.self;
            ((this.beam = null),
              e &&
                (t.meta.count(`articunoSelf`, 1),
                this.freeze(
                  4.5,
                  c(`¡Su propio Rayo Hielo!`),
                  c(`El reflejo lo congela: ¡ahora recibe mucho más daño!`),
                )));
          }
        }
        if (this.gust > 0 && this.frozen <= 0) {
          this.gust -= e;
          let o = a.x - this.bx,
            s = a.z - this.bz,
            c = Math.hypot(o, s) || 1,
            l = Math.atan2(s, o) - this.gustA;
          for (; l > Math.PI; ) l -= Math.PI * 2;
          for (; l < -Math.PI; ) l += Math.PI * 2;
          if (c < 24 && Math.abs(l) < 0.5 && !this.dead) {
            ((i.kx += (o / c) * 34 * e), (i.kz += (s / c) * 34 * e));
            let t = this.S;
            t && (t.frost = Math.min(1, t.frost + e * 0.4));
          }
          for (let e = 0; e < 4; e++) {
            let e = this.gustA + F.range(-0.5, 0.5),
              n = F.range(2, 8);
            t.vfx.norm.spawn({
              x: this.bx + Math.cos(e) * n,
              y: this.by + F.range(-0.5, 1.5),
              z: this.bz + Math.sin(e) * n,
              vx: Math.cos(e) * 18,
              vz: Math.sin(e) * 18,
              life: 0.9,
              size: 0.5,
              endSize: 0.9,
              color: 16777215,
              shape: I.PixSnow,
            });
          }
          n.atkAnim[r] = 0.4;
        }
        (Math.random() < e * 8 &&
          this.frozen <= 0 &&
          t.vfx.add.spawn({
            x: this.bx + F.range(-1.5, 1.5),
            y: this.by + F.range(0.5, 2.5),
            z: this.bz + F.range(-1.5, 1.5),
            vy: -0.8,
            life: 0.8,
            size: 0.35,
            endSize: 0,
            color: 14218495,
            shape: I.Twinkle,
            glow: 0.9,
          }),
          this.phase >= 3 &&
            this.immune <= 0 &&
            this.frozen <= 0 &&
            ((this.ultT -= e), this.ultT <= 0 && this.lock <= 0 && ((this.ultT = 14), this.ultimate())));
      }
      onPhase(e) {
        let t = this.run;
        ((this.beam = null),
          (this.gust = 0),
          (this.frozen = 0),
          (this.barrierRate = 1),
          (this.E.alt[this.i] = 2.2));
        for (let e = 0; e < 3; e++)
          t.later(e * 0.2, () => t.vfx.ring(this.bx, this.by - 1, this.bz, 6 + e * 7, 9103615, 0.7));
        (t.later(1.4, () => {
          this.dead ||
            (this.S?.raiseCrystals(e === 2 ? 3 : 4, 0.045),
            t.ui.toast(
              c(`Articuno se cubre de hielo: rompe los cristales del lago para quitarle la coraza`),
              null,
            ));
        }),
          e === 3 && ((this.ultT = 6), (this.speed = 5.8)));
      }
      render() {
        this.run.enemies.scale[this.i] = 2.8;
      }
    };
  function Cy(e, t) {
    switch (e.enemies.species[t]) {
      case 145:
        return new xy(e, t);
      case 144:
        return new Sy(e, t);
      default:
        return null;
    }
  }
  var wy = {
      guardian: [40, 50, 60],
      legendary: 60,
      mewtwo: 60,
      totem: [18, 22, 26],
      summoner: [10, 12, 14],
      endlessGuardian: 35,
      endlessLegendary: 50,
    },
    Ty = 2.5;
  function Ey(e, t) {
    return e.combat.meter.budget(t * (1 + 0.15 * e.tier) * e.player.stats.difficulty) * ENEMY_HEALTH_SCALE;
  }
  var Dy = { guardian: [25, 30, 35], totem: [10, 12, 14], summoner: [6, 7, 8], endlessGuardian: 25 };
  function Oy(e, t, n, maxScale = 4) {
    let r = e.enemies;
    t < 0 ||
      !Number.isFinite(n) ||
      ((n = Math.min(n, r.maxHp[t] * maxScale)), n > r.maxHp[t] && (r.hp[t] = r.maxHp[t] = Math.min(n, 1e30 * ENEMY_HEALTH_SCALE)));
  }
  function ky(e, t, n) {
    let r = e.enemies;
    t < 0 ||
      !(n > 0) ||
      // Preserve the damage allowed per second when the health pool shrinks.
      ((r.capRate[t] = r.maxHp[t] / (n * ENEMY_HEALTH_SCALE)), (r.capBank[t] = r.capRate[t] * 3), (r.capT[t] = e.time));
  }
  var Ay = 12,
    jy = 20,
    My = 0.4,
    Ny = [`slams`, `ring`, `charge`, `volley`, `wave`],
    Py = [...Ny, `spiral`, `meteor`, `pools`],
    Fy = {
      volley: c(`Ráfaga`),
      wave: c(`Onda de choque`),
      spiral: c(`Torbellino`),
      meteor: c(`Lluvia del cielo`),
      pools: c(`Terreno hostil`),
    },
    Iy = class {
      run;
      bossIndex = -1;
      bossGen = 0;
      name = ``;
      t = 2;
      last = ``;
      chargeT = 0;
      cdx = 0;
      cdz = 0;
      chargeSpeed = 30;
      chargeHit = !1;
      chargeMul = 1.5;
      chargeEnd = null;
      dashFx = null;
      sigNext = !1;
      enraged = !1;
      impatient = !1;
      hold = 0;
      farT = 0;
      callT = 0;
      escorts = [];
      roars = 0;
      pools = [];
      poolHurtT = 0;
      waves = [];
      spiral = null;
      moveName = ``;
      moveT = 0;
      kit = null;
      mech = null;
      fightT = 0;
      fightSecs = 60;
      exhaustSaid = !1;
      constructor(e) {
        this.run = e;
      }
      spawn(e, t, n, r, i = {}) {
        let a = this.run;
        if (a.dragonDuel) return -1;
        (a.sprites.get(e), (this.roars = a.endless ? 0 : a.roars));
        // Players have accumulated real minutes of upgrades even though the
        // wave table runs faster. Size a timed guardian on that same clock.
        const timedGuardian = !r && i.hp == null && a.director.pace > 1;
        const guardianMinutes = timedGuardian ? a.stageTime / 60 : undefined;
        let o = 1 + Bv * this.roars,
          s =
            (i.hp ?? a.director.hpMult(r ? 0 : Ty, guardianMinutes) * (r ? 1.6 : 1) * (Av.BOSS_ZONE_HP[a.stage - 1] ?? 0.5)) * o,
          c = (i.dmg ?? a.director.dmgMult()) * (1 + Vv * this.roars),
          l = a.enemies.spawn(e, t, n, s, c, R.Boss);
        if (l < 0) {
          let r = a.enemies;
          for (let e = 0; e < r.n; e++)
            if (
              r.alive[e] &&
              !(r.flags[e] & (R.Boss | R.Alpha | R.Totem | R.Summoner | R.Capture | R.Treasure | R.Object))
            ) {
              r.kill(e);
              break;
            }
          l = a.enemies.spawn(e, t, n, s, c, R.Boss);
        }
        this.fightSecs = (i.secs ?? (r ? wy.legendary : wy.guardian[Math.min(2, a.stage - 1)])) * o;
        const zoneBoss = a.stage >= 1 && a.stage <= FOREST_COMBAT_ZONES &&
          (a.mode === SINGLE_STAGE || a.mode === 'standard' || a.mode === 'classic');
        const fixedGuardianHp = zoneBoss && timedGuardian && a.mode !== SINGLE_STAGE && a.tier === 0
          ? NORMAL_MULTI_GUARDIAN_HP[a.stage - 1] : undefined;
        if (fixedGuardianHp === undefined) {
          const damageBudget = Ey(a, this.fightSecs);
          Oy(a, l, timedGuardian ? damageBudget * 0.6 : damageBudget, timedGuardian ? 2 : 4);
        }
        if (l >= 0 && (zoneBoss || a.coop)) {
          const enemies = a.enemies;
          const baseHealth = fixedGuardianHp === undefined
            ? enemies.maxHp[l] * (zoneBoss ? ZONE_BOSS_HEALTH_MULTIPLIER : 1)
            : fixedGuardianHp * (a.coop?.hpMul ?? 1);
          const health = baseHealth * (a.coop?.bossHpMul ?? 1);
          enemies.hp[l] = enemies.maxHp[l] = Math.min(1e30 * ENEMY_HEALTH_SCALE, health);
        }
        (i.kit || ky(a, l, (a.endless ? Dy.endlessGuardian : Dy.guardian[Math.min(2, a.stage - 1)]) * o),
          (this.fightT = 0),
          (this.exhaustSaid = !1),
          (this.bossIndex = l),
          (this.roomAim=this.roomRandom=null),
          l >= 0 && (this.bossGen = a.enemies.gen[l]),
          (this.name = l >= 0 ? a.enemies.glyphWords[l] : ''),
          (this.t = 2.5),
          (this.enraged = !1),
          (this.sigNext = !1),
          (this.chargeT = 0),
          (this.moveT = 0),
          (this.dashFx = null),
          (this.chargeEnd = null),
          (this.hold = 0),
          (this.impatient = !1),
          (this.farT = 0),
          (this.callT = 1.5),
          (this.escorts = []),
          (this.pools = []),
          (this.waves = []),
          (this.spiral = null),
          (this.last = ``),
          this.mech?.dispose(),
          (this.kit = i.kit && l >= 0 ? (oy(a, l) ?? Cy(a, l)) : null));
        let u = a.tower && l >= 0 ? yy[e] : void 0;
        return (
          (this.mech = !this.kit && !r && l >= 0 ? (u ? new u(a, this, l) : hy(a, this, l)) : null),
          this.kit?.float && (a.enemies.flags[l] |= R.Flying),
          l >= 0 && a.introBoss(l, r, i.summonMode),
          a.audio.bossStart(),
          l
        );
      }
      release() {
        (this.kit && (this.kit.dead = !0), (this.kit = null), (this.bossIndex = -1));
      }
      get alive() {
        let e = this.bossIndex,
          t = this.run.enemies;
        return e >= 0 && t.gen[e] === this.bossGen && t.isAlive(e);
      }
      live(e) {
        return e === this.bossIndex && this.alive;
      }
      exhaust(e) {
        if (e !== this.bossIndex) return 1;
        let t = this.fightT - this.fightSecs * 2;
        return t > 0 ? Math.min(1e9, 2 ** (t / 20)) : 1;
      }
      get immune() {
        return !!this.kit && this.kit.immune > 0;
      }
      strike(e, t, n = qv) {
        let r = this.run,
          i = r.player,
          a = r.enemies;
        return i.hurt(
          a.dmg[e] * t * r.diff.enemyDamage,
          a.typesOf(e)[0],
          -1,
          a.x[e],
          a.z[e],
          !1,
          0.34,
          e,
          Xv(r, n),
        )
          ? (i.wound(Jv(r)), !0)
          : !1;
      }
      shot(e, t, n, r, i = {}) {
        let a = this.run,
          o = a.enemies,
          s = o.typesOf(e)[0],
          c = Math.cos(t),
          l = Math.sin(t),
          u = a.projectiles.fromBody(e, c, l);
        a.projectiles.fire({
          x: o.x[e],
          y: u.y,
          z: o.z[e],
          dx: c,
          dy: u.dy,
          dz: l,
          speed: n,
          life: i.life ?? 4,
          radius: 0.6 * (i.size ?? 1),
          dmg: o.dmg[e] * r,
          type: s,
          cls: `special`,
          flags: em.Hostile | em.Capped | (i.homing ? em.Homing : 0),
          size: 1.1 * (i.size ?? 1),
          shape: i.shape ?? I.Soft,
          from: e,
        });
      }
      tick(e) {
        let t = this.run,
          n = t.enemies,
          r = t.player,
          i = r.pos;
        if (((this.hold = Math.max(0, this.hold - e)), this.kit)) return;
        let a = this.bossIndex,
          o = this.alive;
        (this.mech && (this.mech.tick(e, o), o || (this.mech.dispose(), (this.mech = null))),
          (this.poolHurtT -= e));
        for (let s = this.pools.length - 1; s >= 0; s--) {
          let c = this.pools[s];
          ((c.t -= e),
            c.t <= 0 || !o
              ? this.pools.splice(s, 1)
              : (Math.random() < e * 5 &&
                  t.vfx.ground.spawn({
                    x: c.x,
                    y: c.y + 0.1,
                    z: c.z,
                    life: 0.6,
                    size: c.r * 2,
                    endSize: c.r * 2.1,
                    color: c.col,
                    shape: I.Soft,
                    glow: 0.15,
                    rot: 0,
                  }),
                Math.random() < e * 9 &&
                  t.vfx.add.spawn({
                    x: c.x + F.range(-c.r, c.r) * 0.7,
                    y: c.y + 0.2,
                    z: c.z + F.range(-c.r, c.r) * 0.7,
                    vy: F.range(1, 2.5),
                    life: 0.6,
                    size: 0.5,
                    endSize: 0.1,
                    color: c.col,
                    shape: I.Twinkle,
                    glow: 0.5,
                  }),
                this.poolHurtT <= 0 &&
                  (i.x - c.x) ** 2 + (i.z - c.z) ** 2 < c.r * c.r &&
                  i.y - c.y < 1 &&
                  ((this.poolHurtT = 0.5), r.hurt(r.maxHp * 0.04, n.typesOf(a)[0], -1, NaN, NaN, !0, 0, a))));
        }
        for (let n = this.waves.length - 1; n >= 0; n--) {
          let r = this.waves[n],
            s = r.r;
          if (((r.r += e * 13), r.r > r.max || !o)) {
            this.waves.splice(n, 1);
            continue;
          }
          if (
            (t.vfx.staticRing(r.x, t.terrain.height(r.x, r.z) + 0.1, r.z, r.r, r.col, 0.85, 0),
            Math.random() < e * 30)
          ) {
            let e = F.range(0, Math.PI * 2),
              n = r.x + Math.cos(e) * r.r,
              i = r.z + Math.sin(e) * r.r;
            t.vfx.dust(n, t.terrain.height(n, i), i, 13154456, 1, 2);
          }
          let l = Math.hypot(i.x - r.x, i.z - r.z);
          !r.hit &&
            l >= s - 0.6 &&
            l < r.r + 0.6 &&
            ((r.hit = !0),
            i.y - t.terrain.height(i.x, i.z) < 1.3
              ? this.strike(a, 1.3, 0.1)
              : t.ui.popup(i.x, i.y + 2.4, i.z, c(`¡Esquivado!`), `#7aff8a`, 0.9));
        }
        if (this.spiral) {
          let t = this.spiral;
          if (!o) this.spiral = null;
          else {
            for (t.t -= e, t.a += t.spin * e, t.acc += e * 9; t.acc >= 1; ) {
              t.acc--;
              for (let e = 0; e < t.arms; e++)
                this.shot(a, t.a + (e / t.arms) * Math.PI * 2, 8.5, 0.5, { life: 3.6 });
            }
            ((n.atkAnim[a] = 0.3), t.t <= 0 && (this.spiral = null));
          }
        }
        o && (this.escorts = this.escorts.filter(([e, t]) => n.gen[e] === t && n.isAlive(e)));
      }
      update(e, t, n) {
        let r = this.run,
          i = r.enemies,
          a = r.player;
        if (e !== this.bossIndex) return;
        if (
          ((this.fightT += t),
          !this.exhaustSaid &&
            this.exhaust(e) > 1 &&
            ((this.exhaustSaid = !0),
            r.ui.popup(i.x[e], i.y[e] + i.hgt[e] + 1.4, i.z[e], c(`¡Agotado!`), `#ffb347`, 1.2),
            r.ui.toast(c(`{name} está agotado: cada vez recibe más daño`, { name: this.name }), null)),
          this.kit)
        ) {
          this.kit.update(t);
          return;
        }
        !this.enraged && i.hp[e] < i.maxHp[e] * (T.fury[r.tier] ?? 0.5) && this.enrage(e);
        let o = Ni[i.typesOf(e)[0]];
        if (this.chargeT > 0) {
          if (
            ((this.chargeT -= t),
            (i.kx[e] = this.cdx * this.chargeSpeed),
            (i.kz[e] = this.cdz * this.chargeSpeed),
            this.dashFx
              ? this.dashFx(r, i.x[e], i.y[e], i.z[e], this.cdx, this.cdz, t)
              : Math.random() < 0.6 && r.vfx.dust(i.x[e], i.y[e], i.z[e], 13154456, 2, 3),
            !this.chargeHit &&
              Math.hypot(a.pos.x - i.x[e], a.pos.z - i.z[e]) < i.radius[e] + 1.3 &&
              a.pos.y - i.y[e] < 2 &&
              ((this.chargeHit = !0), this.strike(e, this.chargeMul, 0.12) && a.shove(this.cdx, this.cdz, 11)),
            this.chargeT <= 0)
          ) {
            ((this.chargeSpeed = 30), (this.dashFx = null));
            let e = this.chargeEnd;
            ((this.chargeEnd = null), e?.());
          }
          return;
        }
        if(r.coop?.monsters){this.moveT-=t;return;}
        if (((this.moveT -= t), r.coop && !r.coop.bossEngages(e))) {
          ((this.t = Math.max(this.t, 0.5)), (this.farT = 0));
          return;
        }
        if (((this.callT -= t), this.callT <= 0)) {
          this.callT = this.enraged ? 16 : 22;
          let t = (T.escorts[r.tier] ?? 0) + this.roars;
          this.escorts.length < 4 + r.stage * 2 + t * 2 &&
            this.callEscorts(e, 2 + r.stage + t, (r.stage >= 2 ? 2 : 1) + t);
        }
        this.farT =
          n > 18 && (!r.coop || r.coop.bossTargetsMe(e)) ? this.farT + t : Math.max(0, this.farT - t * 2);
        let s = n < 30 ? My * Gs((a.noHitT - Ay) / jy, 0, 1) : 0;
        if (
          (s > 0 && !this.impatient
            ? ((this.impatient = !0),
              r.ui.popup(i.x[e], i.y[e] + i.hgt[e] + 1, i.z[e], c(`¡Se impacienta!`), `#ff8a3a`, 1.2))
            : s <= 0 && (this.impatient = !1),
          (this.t -= t * (this.enraged ? 1.35 : 1) * (1 + s)),
          this.farT > 2.5 && this.t < 1.2)
        ) {
          ((this.farT = 0), (i.atkAnim[e] = 0.5), (this.t = this.sigLeap(e, o, {}, !1) - 1));
          return;
        }
        if (this.t > 0) return;
        if (this.mech && this.sigNext) {
          ((this.sigNext = !1),
            (i.atkAnim[e] = 0.5),
            this.say(this.mech.name()),
            (this.t = this.mech.cast(this.enraged)));
          return;
        }
        let l = Ly[i.species[e]];
        if (l && this.sigNext) {
          ((this.sigNext = !1), (i.atkAnim[e] = 0.5), this.say(l.name));
          let t = fy[i.species[e]] ?? {};
          this.t =
            l.kind === `cross`
              ? this.sigCross(e, l.color, t)
              : l.kind === `leap`
                ? this.sigLeap(e, l.color, t, this.enraged)
                : this.sigCharge(e, l.color, t);
          return;
        }
        this.sigNext = !0;
        const d=F.pick((this.enraged ? Py : Ny).filter(move=>move!==this.last));
        this.roomAttack(e,d);
      }
      get attackTarget(){return this.roomAim??this.run.player.pos;}
      get attackRandom(){return this.roomRandom??F;}
      beginRoomMove(command){this.roomAim=command;this.roomRandom=new Ol(command.seed);}
      get attackVelocity(){return this.roomAim?{x:this.roomAim.vx,z:this.roomAim.vz}:this.run.player.vel;}
      hasSignature(e){return !!(this.mech || Ly[this.run.enemies.species[e]]);}
      roomAttack(e,d){
        const r=this.run,i=r.enemies,o=Ni[i.typesOf(e)[0]];
        if(d==='escorts'){
          if(r.coop?.monsters && !r.coop.bossAuthority)return this.t;
          const extra=(T.escorts[r.tier]??0)+this.roars;
          if(this.escorts.length<4+r.stage*2+extra*2)this.callEscorts(e,2+r.stage+extra,(r.stage>=2?2:1)+extra);
          return this.t;
        }
        if(d==='signature'){
          i.atkAnim[e]=.5;
          if(this.mech){this.say(this.mech.name());return this.mech.cast(this.enraged);}
          const sig=Ly[i.species[e]],fx=fy[i.species[e]]??{};
          if(!sig)return 1;
          this.say(sig.name);
          if(sig.kind==='cross')return this.sigCross(e,sig.color,fx);
          if(sig.kind==='leap')return this.sigLeap(e,sig.color,fx,this.enraged);
          return this.sigCharge(e,sig.color,fx);
        }
        if(d==='far-leap')return this.sigLeap(e,o,{},false)-1;
        switch (((this.last = d), (i.atkAnim[e] = 0.5), Fy[d] && this.say(Fy[d]), d)) {
          case `slams`:
            this.t = this.slams(e, o);
            break;
          case `ring`:
            this.t = this.ring(e, o);
            break;
          case `charge`:
            this.t = this.charge(e);
            break;
          case `volley`:
            this.t = this.volley(e, o);
            break;
          case `wave`:
            this.t = this.wave(e, o);
            break;
          case `spiral`:
            this.t = this.startSpiral(e, o);
            break;
          case `meteor`:
            this.t = this.meteor(e, o);
            break;
          case `pools`:
            this.t = this.hostileGround(e, o);
        }
        return this.t;
      }
      say(e) {
        ((this.moveName = moveCopy(this.run.enemies.species[this.bossIndex], e)), (this.moveT = 2.2));
      }
      get tk() {
        return T.tele[this.run.tier] ?? 1;
      }
      enrage(e) {
        let t = this.run,
          n = t.enemies,
          r = t.player;
        ((this.enraged = !0),
          t.ui.banner(
            c(`¡Furia!`),
            c(`{name} se enfurece: ataques nuevos y más rápidos`, { name: this.name }),
            `#ff3a3a`,
            { species: n.species[e], glyph: this.name },
          ),
          (n.speed[e] *= 1.2),
          t.shake(0.5),
          t.cry(n.species[e]),
          t.vfx.ring(n.x[e], n.y[e], n.z[e], 8, 16726586, 0.6),
          t.vfx.ring(n.x[e], n.y[e], n.z[e], 14, 16777215, 0.8));
        let i = r.pos.x - n.x[e],
          a = r.pos.z - n.z[e],
          o = Math.hypot(i, a) || 1;
        (o < 10 && r.shove(i / o, a / o, 12),
          (this.chargeT = 0),
          (this.chargeEnd = null),
          (this.t = 1.4),
          (this.callT = 0.6));
      }
      callEscorts(e, t, n) {
        if (this.run.dragonDuel) return;
        let r = this.run,
          i = r.enemies,
          a = r.director,
          o = i.typesOf(e),
          s = a.cards.map((e) => e.id),
          c = s.filter((e) => k.get(e).types.some((e) => o.includes(e))),
          l = c.length ? c : s.length ? s : [i.species[e]];
        (r.vfx.ring(i.x[e], i.y[e], i.z[e], 7, 16777215, 0.5), r.cry(i.species[e]));
        for (let o = 0; o < t; o++) {
          let t = F.range(0, Math.PI * 2),
            s = i.radius[e] + F.range(3, 6),
            c = i.x[e] + Math.cos(t) * s,
            u = i.z[e] + Math.sin(t) * s;
          if (!r.terrain.inBounds(c, u, 4)) continue;
          let d = i.spawn(F.pick(l), c, u, a.hpMult(), a.dmgMult(), o < n ? R.Elite : 0);
          if (d < 0) continue;
          this.escorts.push([d, i.gen[d]]);
          let f = r.terrain.height(c, u);
          r.vfx.dust(c, f, u, 13154456, 5, 3);
        }
      }
      slams(e, t) {
        let n = this.run,
          r = n.enemies,
          i = n.player,
          a = r.typesOf(e)[0],
          o = (r, o) => {
            let s = this.attackTarget,
              c = this.attackVelocity;
            for (let l = 0; l < r; l++) {
              let r = s.x + (l === 0 ? c.x * 0.8 : this.attackRandom.range(-7, 7)),
                u = s.z + (l === 0 ? c.z * 0.8 : this.attackRandom.range(-7, 7)),
                d = n.terrain.height(r, u),
                f = 3.6;
              (n.vfx.enemyCircle(r, d, u, f, t, o),
                n.later(o, () => {
                  if (!this.live(e)) return;
                  (n.vfx.burst(r, d + 0.5, u, t, 22, 9, am(a), 0.8, 0.6),
                    n.vfx.ring(r, d, u, f, ENEMY_DANGER_COLOR, 0.4, 0.15, 0),
                    n.shake(0.2, r, u),
                    n.audio.boom(0.7));
                  let o = i.pos.x - r,
                    s = i.pos.z - u;
                  o * o + s * s < f * f && i.pos.y - d < 2 && this.strike(e, 1.6, 0.1);
                }));
            }
          };
        return (
          o(3, 1.1 * this.tk),
          this.enraged &&
            n.later(0.7, () => {
              this.live(e) && o(3, this.tk);
            }),
          this.enraged ? 3.8 : 3
        );
      }
      ring(e, t) {
        let n = this.run,
          r = n.enemies,
          i = this.enraged ? 18 : 14,
          a = this.enraged ? 3 : 1,
          o = this.attackRandom.range(0, 1);
        n.vfx.enemyCircle(r.x[e], r.y[e], r.z[e], 3, t, 0.4);
        for (let s = 0; s < a; s++)
          n.later(0.4 + s * 0.5, () => {
            if (this.live(e)) {
              for (let t = 0; t < i; t++) this.shot(e, o + ((t + s * 0.5) / i) * Math.PI * 2, 10, 0.8);
              (n.vfx.ring(r.x[e], r.y[e], r.z[e], 5, t, 0.4), n.audio.shot(r.typesOf(e)[0], 0.8));
            }
          });
        return 2.8 + (a - 1) * 0.4;
      }
      charge(e, t = this.enraged) {
        let n = this.run,
          r = n.enemies,
          i = n.player,
          a = this.attackTarget.x - r.x[e],
          o = this.attackTarget.z - r.z[e],
          s = Math.hypot(a, o) || 1,
          c = a / s,
          l = o / s,
          u = 0.75 * this.tk;
        return (
          (this.hold = u),
          (r.vx[e] = r.vz[e] = r.kx[e] = r.kz[e] = 0),
          n.vfx.enemyLine(r.x[e], r.z[e], r.x[e] + c * 22.5, r.z[e] + l * 22.5,
            r.radius[e] + 1.3, Ni[r.typesOf(e)[0]], u),
          n.later(u, () => {
            this.live(e) &&
              ((this.cdx = c),
              (this.cdz = l),
              (this.chargeSpeed = 30),
              (this.chargeHit = !1),
              (this.chargeMul = 1.5),
              (this.chargeT = 0.75),
              (this.dashFx = null),
              (this.chargeEnd = t
                ? () => {
                    this.live(e) && this.charge(e, !1);
                  }
                : null),
              n.audio.whoosh());
          }),
          t ? 4.4 : 3.2
        );
      }
      volley(e, t) {
        let n = this.run,
          r = n.enemies,
          i = n.player,
          a = this.enraged ? 4 : 3;
        n.vfx.flash(r.x[e], r.y[e] + r.hgt[e] * 0.6, r.z[e], t, 3, 0.4);
        for (let t = 0; t < a; t++)
          n.later((0.45 + t * 0.4) * this.tk, () => {
            if (!this.live(e)) return;
            let t = this.attackTarget,
              a = t.x + this.attackVelocity.x * 0.5,
              o = t.z + this.attackVelocity.z * 0.5,
              s = Math.atan2(o - r.z[e], a - r.x[e]);
            for (let t = -2; t <= 2; t++) this.shot(e, s + t * 0.17, 15, 0.6, { size: 0.9, life: 3 });
            ((r.atkAnim[e] = 0.3), n.audio.shot(r.typesOf(e)[0], 0.6));
          });
        return 2.6 + a * 0.2;
      }
      wave(e, t) {
        let n = this.run,
          r = n.enemies,
          i = this.enraged ? 3 : 2,
          a = 0.8 * this.tk;
        (n.vfx.enemyCircle(r.x[e], n.terrain.height(r.x[e], r.z[e]), r.z[e], 4.5, t, a),
          (this.hold = a + i * 0.55));
        for (let o = 0; o < i; o++)
          n.later(a + o * 0.55, () => {
            this.live(e) &&
              ((r.atkAnim[e] = 0.5),
              (r.squash[e] = 0.6),
              n.shake(0.3, r.x[e], r.z[e]),
              n.audio.boom(0.8),
              n.vfx.dust(r.x[e], r.y[e], r.z[e], 13154456, 14, 7),
              this.waves.push({ x: r.x[e], z: r.z[e], r: r.radius[e] + 0.5, max: 26, hit: !1, col: ENEMY_DANGER_COLOR }));
          });
        return 3 + i * 0.3;
      }
      startSpiral(e, t) {
        let n = this.run,
          r = n.enemies;
        return (
          n.vfx.enemyCircle(r.x[e], r.y[e], r.z[e], 4, t, 0.6),
          (this.hold = 3.2),
          n.later(0.6, () => {
            this.live(e) &&
              (this.spiral = {
                t: 2.6,
                a: this.attackRandom.range(0, Math.PI * 2),
                acc: 0,
                arms: 3,
                spin: this.attackRandom.chance(0.5) ? 1.9 : -1.9,
              });
          }),
          3.8
        );
      }
      meteor(e, t) {
        let n = this.run,
          r = n.enemies,
          i = n.player,
          a = r.typesOf(e)[0],
          o = 8 + n.stage * 2,
          s = am(a);
        for (let r = 0; r < o; r++)
          n.later(r * 0.2, () => {
            if (!this.live(e)) return;
            let a = this.attackTarget,
              o = a.x + (r % 3 == 0 ? this.attackVelocity.x * 0.9 : this.attackRandom.range(-9, 9)),
              c = a.z + (r % 3 == 0 ? this.attackVelocity.z * 0.9 : this.attackRandom.range(-9, 9));
            if (!n.terrain.inBounds(o, c, 2)) return;
            let l = n.terrain.height(o, c),
              u = 2.6,
              d = 1.1 * this.tk;
            n.vfx.enemyCircle(o, l, c, u, t, d);
            let f = n.r.camera.position,
              p = Math.hypot(o - f.x, c - f.z) || 1,
              m = ((o - f.x) / p) * 4,
              h = ((c - f.z) / p) * 4;
            (n.vfx.add.spawn({
              x: o + m,
              y: l + 18,
              z: c + h,
              vx: -m / d,
              vy: -18 / d,
              vz: -h / d,
              life: d,
              size: 1.4,
              endSize: 1.7,
              color: t,
              shape: s,
              glow: 0.7,
            }),
              n.later(d, () => {
                if (!this.live(e)) return;
                (n.vfx.burst(o, l + 0.5, c, t, 14, 7, s, 0.6, 0.5),
                  n.vfx.ring(o, l, c, u, ENEMY_DANGER_COLOR, 0.35, 0.15, 0),
                  n.audio.boom(0.4));
                let r = i.pos.x - o,
                  a = i.pos.z - c;
                r * r + a * a < u * u && i.pos.y - l < 2 && this.strike(e, 1.2);
              }));
          });
        return 2.4 + o * 0.12;
      }
      hostileGround(e, t) {
        let n = this.run,
          r = n.player;
        for (let i = 0; i < 3; i++) {
          let a = this.attackTarget,
            o = a.x + (i ? this.attackRandom.range(-6, 6) : 0),
            s = a.z + (i ? this.attackRandom.range(-6, 6) : 0);
          if (!n.terrain.inBounds(o, s, 2)) continue;
          let c = n.terrain.height(o, s),
            l = 3.4;
          (n.vfx.enemyCircle(o, c, s, l, t, this.tk),
            n.later(this.tk, () => {
              if (!this.live(e)) return;
              n.vfx.burst(o, c + 0.4, s, t, 16, 6, am(n.enemies.typesOf(e)[0]), 0.6, 0.5);
              let i = r.pos.x - o,
                a = r.pos.z - s;
              (i * i + a * a < l * l && r.pos.y - c < 2 && this.strike(e, 1),
                this.pools.push({ x: o, y: c, z: s, r: 3.1, t: 6, col: t }));
            }));
        }
        return 2.8;
      }
      lineStrike(e, t, n, r, i, a, o, s, c, l = {}) {
        let u = this.run,
          d = u.enemies,
          f = u.player,
          p = d.typesOf(c)[0],
          m = Math.hypot(n - e, r - t) || 1;
        u.vfx.enemyLine(e, t, n, r, i, s, a);
        (l.tele?.(u, e, t, n, r, a),
          u.later(a, () => {
            if (!this.live(c)) return;
            let a = u.terrain.height(e, t) + 1,
              d = u.terrain.height(n, r) + 1;
            (l.strike
              ? l.strike(u, e, a, t, n, d, r)
              : (u.vfx.beams.spawn(e, a, t, n, d, r, i * 1.4, s, 0.3),
                u.vfx.beams.spawn(e, a, t, n, d, r, i * 0.5, 16777215, 0.25)),
              u.audio.slash(p));
            let h = n - e,
              g = r - t,
              _ = Math.max(0, Math.min(1, ((f.pos.x - e) * h + (f.pos.z - t) * g) / (m * m)));
            o > 0 &&
              Math.hypot(e + h * _ - f.pos.x, t + g * _ - f.pos.z) < i + f.radius &&
              f.pos.y - u.terrain.height(f.pos.x, f.pos.z) < 1.8 &&
              this.strike(c, o);
          }));
      }
      sigCross(e, t, n = {}) {
        let r = this.run,
          i = r.enemies,
          a = this.attackTarget,
          o = this.attackRandom.range(0, Math.PI / 2);
        (this.enraged ? [Math.PI / 4, -Math.PI / 4, Math.PI / 2] : [Math.PI / 4, -Math.PI / 4]).forEach(
          (r, i) => {
            let s = o + r,
              c = Math.cos(s) * 10,
              l = Math.sin(s) * 10;
            this.lineStrike(a.x - c, a.z - l, a.x + c, a.z + l, 1.3, (1.05 + i * 0.2) * this.tk, 1.2, t, e, n);
          },
        );
        let s = a.x,
          c = a.z,
          l = this.enraged;
        return (
          r.later((1.2 + (l ? 0.2 : 0)) * this.tk, () => {
            if (!this.live(e)) return;
            let a = s - i.x[e],
              o = c - i.z[e],
              u = Math.hypot(a, o) || 1;
            ((this.cdx = a / u),
              (this.cdz = o / u),
              (this.chargeSpeed = 34),
              (this.chargeHit = !1),
              (this.chargeMul = 1.2),
              (this.chargeT = Math.min(0.7, (u + 4) / 34)),
              r.coop?.monsters?.bossSkill({dashX:this.cdx*34,dashZ:this.cdz*34,dashTime:this.chargeT}),
              (this.dashFx = n.dash ?? null),
              (this.chargeEnd = l ? () => this.shards(e, t, 10, n.shard) : null),
              r.audio.whoosh());
          }),
          l ? 3.8 : 3.2
        );
      }
      shards(e, t, n, r) {
        let i = this.run,
          a = i.enemies,
          o = a.typesOf(e)[0];
        if (this.live(e)) {
          for (let s = 0; s < n; s++) {
            let c = (s / n) * Math.PI * 2;
            i.projectiles.fire({
              x: a.x[e],
              y: a.y[e] + 0.8,
              z: a.z[e],
              dx: Math.cos(c),
              dz: Math.sin(c),
              speed: 11,
              life: 2.2,
              radius: 0.5,
              dmg: a.dmg[e] * 0.7,
              type: o,
              cls: `physical`,
              flags: em.Hostile | em.Capped,
              size: 1.1,
              shape: r ?? am(o),
              color: t,
              from: e,
            });
          }
          i.vfx.ring(a.x[e], a.y[e], a.z[e], 4, t, 0.4);
        }
      }
      sigLeap(e, t, n = {}, r = !1) {
        let i = this.run,
          a = i.enemies,
          o = i.player,
          s = this.attackTarget,
          c = a.typesOf(e)[0],
          l = a.x[e],
          u = a.z[e],
          d = s.x,
          f = s.z,
          p = i.terrain.height(d, f),
          m = 1.07 * this.tk;
        return (
          i.vfx.enemyCircle(d, p, f, 5, t, m),
          this.roomAim?.move==='signature' && i.coop?.monsters?.bossSkill({leap:[d,f,m]}),
          (a.air[e] = 1),
          (a.vy[e] = 16),
          i.audio.jump(0.5),
          n.preland &&
            i.later(m - 0.35, () => {
              this.live(e) && n.preland(i, d, p, f, 0.35);
            }),
          i.animate(
            m,
            (t) => {
              !i.coop?.monsters && this.live(e) && ((a.x[e] = l + (d - l) * t), (a.z[e] = u + (f - u) * t), (a.vx[e] = a.vz[e] = 0));
            },
            () => {
              this.live(e) &&
                (n.land ? n.land(i, d, p, f, 5) : i.vfx.burst(d, p + 0.5, f, t, 26, 10, am(c), 0.8, 0.7, 14),
                i.vfx.ring(d, p, f, 5, ENEMY_DANGER_COLOR, 0.5, 0.15, 0),
                i.vfx.dust(d, p, f, 13154456, n.land ? 8 : 20, n.land ? 5 : 8),
                i.shake(0.5, d, f),
                i.audio.boom(0.9),
                Math.hypot(o.pos.x - d, o.pos.z - f) < 5 && o.pos.y - p < 2.2 && this.strike(e, 1.8, 0.14),
                this.shards(e, t, 12, n.shard),
                r &&
                  i.later(0.35, () => {
                    this.live(e) && this.waves.push({ x: d, z: f, r: 5, max: 24, hit: !1, col: ENEMY_DANGER_COLOR });
                  }));
            },
          ),
          r ? 3.8 : 3.4
        );
      }
      sigCharge(e, t, n = {}, r = this.enraged) {
        let i = this.run,
          a = i.enemies,
          o = this.attackTarget,
          s = o.x - a.x[e],
          c = o.z - a.z[e],
          l = Math.hypot(s, c) || 1,
          u = Math.min(30, l + 8),
          d = s / l,
          f = c / l,
          p = 0.8 * this.tk;
        return (
          (this.hold = p),
          (a.vx[e] = a.vz[e] = a.kx[e] = a.kz[e] = 0),
          this.lineStrike(a.x[e], a.z[e], a.x[e] + d * u, a.z[e] + f * u, a.radius[e] + 1.3, p, 0, t, e, {
            tele: n.tele,
            strike: () => {},
          }),
          i.later(p, () => {
            this.live(e) &&
              ((this.cdx = d),
              (this.cdz = f),
              (this.chargeSpeed = 42),
              (this.chargeHit = !1),
              (this.chargeMul = 2.2),
              (this.chargeT = u / 42),
              i.coop?.monsters?.bossSkill({dashX:d*42,dashZ:f*42,dashTime:u/42}),
              (this.dashFx = n.dash ?? null),
              (this.chargeEnd = r
                ? () => {
                    this.live(e) && (this.shards(e, t, 8, n.shard), this.sigCharge(e, t, n, !1));
                  }
                : null),
              i.audio.whoosh(),
              i.shake(0.2));
          }),
          r ? 4.6 : 3
        );
      }
    },
    Ly = {
      123: { kind: `cross`, name: c(`Tijera X`), color: 13172570 },
      26: { kind: `cross`, name: c(`Rayo`), color: 16769354 },
      59: { kind: `cross`, name: c(`Lanzallamas`), color: 16742954 },
      127: { kind: `leap`, name: c(`Sísmico`), color: 13150328 },
      62: { kind: `leap`, name: c(`Puño Dinámico`), color: 6994175 },
      53: { kind: `leap`, name: c(`Cuchillada`), color: 15784080 },
      34: { kind: `charge`, name: c(`Megacuerno`), color: 13130495 },
      76: { kind: `charge`, name: c(`Rodar`), color: 13148256 },
      55: { kind: `charge`, name: c(`Acua Jet`), color: 5949695 },
      28: { kind: `cross`, name: c(`Garra Brutal`), color: 15253616 },
      106: { kind: `leap`, name: c(`Patada Salto Alta`), color: 16751210 },
      85: { kind: `charge`, name: c(`Pico Taladro`), color: 15255696 },
      105: { kind: `cross`, name: c(`Huesomerang`), color: 15788248 },
      68: { kind: `leap`, name: c(`Sumisión`), color: 16760970 },
      112: { kind: `charge`, name: c(`Taladradora`), color: 12101770 },
      31: { kind: `cross`, name: c(`Tierra Viva`), color: 16742954 },
      142: { kind: `leap`, name: c(`Roca Afilada`), color: 13148272 },
      149: { kind: `charge`, name: c(`Carga Dragón`), color: 9075455 },
    },
    Ry = 70,
    zy = 7,
    By = 26,
    Vy = 7,
    Hy = 0.95,
    Uy = 6,
    Wy = 2.5,
    Gy = class {
      run;
      t = -10;
      stage = `low`;
      k = 0;
      terrainRef = null;
      constructor(e) {
        this.run = e;
      }
      update(e) {
        let t = this.run,
          n = t.terrain;
        if (t.biome.id !== `coast` || t.sanctuary || !n.hasWater) return;
        (this.terrainRef !== n && ((this.terrainRef = n), (this.t = -10), (this.stage = `low`), (this.k = 0)),
          (this.t += e),
          this.stage === `low` && this.t >= Ry
            ? ((this.stage = `rise`),
              (this.t = 0),
              t.ui.toast(c(`¡Sube la marea! Las playas se inundan`), null),
              t.audio.cone(`water`, 1.5))
            : this.stage === `rise` && this.t >= zy
              ? ((this.stage = `high`), (this.t = 0))
              : this.stage === `high` && this.t >= By
                ? ((this.stage = `fall`),
                  (this.t = 0),
                  t.ui.toast(c(`Baja la marea: ha dejado perlas en la arena`), null))
                : this.stage === `fall` && this.t >= Vy && ((this.stage = `low`), (this.t = 0), this.pearls()),
          (this.k =
            this.stage === `rise`
              ? this.t / zy
              : this.stage === `high`
                ? 1
                : this.stage === `fall`
                  ? 1 - this.t / Vy
                  : 0));
        let r = this.k * this.k * (3 - 2 * this.k);
        if ((n.setWaterLevel(n.baseWater + Hy * r), this.stage === `rise` && Math.random() < e * 10)) {
          let e = t.player.pos,
            r = F.range(0, Math.PI * 2),
            i = F.range(4, 16),
            a = e.x + Math.cos(r) * i,
            o = e.z + Math.sin(r) * i;
          Math.abs(n.height(a, o) - n.waterLevel) < 0.3 &&
            t.vfx.ring(a, n.waterLevel + 0.03, o, 1.4, 9099519, 0.6, 0.2);
        }
      }
      pearls() {
        let e = this.run,
          t = e.terrain,
          n = e.player.pos,
          r = Math.max(1, Math.round(Wy * (e.stage >= 1 ? 2.2 ** (e.stage - 1) : 1))),
          i = 0;
        for (let a = 0; a < 200 && i < Uy; a++) {
          let a = F.range(0, Math.PI * 2),
            o = F.range(6, 30),
            s = n.x + Math.cos(a) * o,
            c = n.z + Math.sin(a) * o,
            l = t.height(s, c);
          !t.inBounds(s, c, 4) ||
            l < t.waterLevel + 0.05 ||
            l > t.waterLevel + 0.9 ||
            (e.pickups.spawnCoin(s, l + 0.3, c, r),
            e.vfx.burst(s, l + 0.4, c, 16774376, 6, 3, I.Twinkle, 0.4, 0.6),
            i++);
        }
      }
    },
    Ky = 0.45,
    qy = 0.5,
    Jy = 75,
    Yy = 420,
    Xy = 300,
    Zy = 4.2,
    Qy = 28,
    $y = 9,
    eb = 2.8,
    tb = 24,
    nb = 35,
    rb = 22,
    ib = [86, 87, 90, 91, 124],
    ab = class {
      run;
      terrainRef = null;
      at = 1 / 0;
      spout = null;
      bliz = null;
      flying = -1;
      relaunch = 0;
      look = {
        k: 0,
        flash: 0,
        top: new Ei(),
        bottom: new Ei(),
        fog: new Ei(),
        near: 0,
        far: 0,
        light: 1,
        sun: new Ei(),
        clouds: [1, 1, 1],
        cover: 0,
        vignette: 0.4,
        tint: [1, 1, 1],
      };
      get iceIdx() {
        return this.run.enemies.typeIdx.get(`ice`) ?? -1;
      }
      constructor(e) {
        this.run = e;
      }
      get kind() {
        let e = this.run.biome.id;
        return e === `coast` ? `spout` : e === `glacier` ? `blizzard` : null;
      }
      roll() {
        let e = this.run,
          t = this.kind;
        (this.clear(),
          (this.at = 1 / 0),
          t &&
            !e.sanctuary &&
            (e.endless
              ? (this.at = e.stageTime + Xy * F.range(0.6, 1.2))
              : F.chance(t === `spout` ? Ky : qy) && (this.at = F.range(Jy, Yy))));
      }
      start() {
        let e = this.kind;
        e === `spout` ? this.startSpout() : e === `blizzard` && this.startBlizzard();
      }
      update(e) {
        let t = this.run;
        (this.terrainRef !== t.terrain && ((this.terrainRef = t.terrain), this.roll()),
          t.stageTime >= this.at &&
            !t.boss.alive &&
            !t.mewtwo.active &&
            !t.events.active &&
            t.state === `play` &&
            ((this.at = t.endless ? t.stageTime + Xy * F.range(0.8, 1.3) : 1 / 0),
            (!t.endless || F.chance(0.5)) && this.start()),
          this.spout && this.tickSpout(e),
          this.bliz && this.tickBlizzard(e),
          this.tickFlight(e));
      }
      startSpout() {
        let e = this.run,
          t = e.terrain,
          n = e.player.pos,
          r = n.x + 40,
          i = n.z;
        for (let e = 0; e < 40; e++) {
          let e = F.range(0, Math.PI * 2),
            a = F.range(34, 46),
            o = n.x + Math.cos(e) * a,
            s = n.z + Math.sin(e) * a;
          if (t.inBounds(o, s, 8) && ((r = o), (i = s), t.height(o, s) < t.waterLevel)) break;
        }
        let a = n.x + F.range(-6, 6),
          o = n.z + F.range(-6, 6),
          s = Math.hypot(a - r, o - i) || 1,
          l = this.funnelMat(),
          u = new Tr(new yr(6.5, 1.3, 21, 28, 10, !0).translate(0, 10.5, 0), l);
        ((u.renderOrder = 4),
          e.r.scene.add(u),
          (this.spout = {
            x: r,
            z: i,
            dx: (a - r) / s,
            dz: (o - i) / s,
            t: Qy,
            wob: F.range(0, 10),
            caught: [],
            mesh: u,
            mat: l,
          }),
          e.ui.banner(
            c(`¡Tromba marina!`),
            c(`Atrapa a los Pokémon y te lanza por los aires: aterriza sobre la horda`),
            `#6ab8ff`,
          ),
          e.audio.alarm());
      }
      tickSpout(e) {
        let t = this.run,
          n = t.terrain,
          r = this.spout,
          i = t.enemies,
          a = t.player,
          o = a.pos;
        ((r.t -= e), (r.wob += e));
        let s = Math.sin(r.wob * 0.7) * 0.5,
          l = o.x - r.x,
          u = o.z - r.z,
          d = Math.hypot(l, u) || 1;
        ((r.dx += (l / d) * e * 0.12), (r.dz += (u / d) * e * 0.12));
        let f = Math.hypot(r.dx, r.dz) || 1;
        if (
          ((r.dx /= f),
          (r.dz /= f),
          (r.x += (r.dx - r.dz * s) * Zy * e),
          (r.z += (r.dz + r.dx * s) * Zy * e),
          !n.inBounds(r.x, r.z, 6))
        ) {
          ((r.dx = -r.x), (r.dz = -r.z));
          let e = Math.hypot(r.dx, r.dz) || 1;
          ((r.dx /= e), (r.dz /= e));
        }
        let p = n.surface(r.x, r.z),
          m = Math.min(1, r.t / 2, (Qy - r.t) / 2);
        for (let n = 0, i = Math.floor(e * 150 * m + Math.random()); n < i; n++) {
          let e = Math.random() ** 0.8 * 20,
            n = 1 + e * 0.28,
            i = t.time * 5 + e * 0.6 + F.range(0, Math.PI * 2);
          t.vfx.norm.spawn({
            x: r.x + Math.cos(i) * n,
            y: p + e,
            z: r.z + Math.sin(i) * n,
            vx: -Math.sin(i) * n * 3,
            vy: F.range(2, 5),
            vz: Math.cos(i) * n * 3,
            life: 0.5,
            size: F.range(0.6, 1.4) * (0.6 + e * 0.06),
            endSize: 1.8,
            color: F.chance(0.6) ? 14216959 : 10139856,
            shape: F.chance(0.7) ? I.Soft : I.PixDrop,
          });
        }
        if (
          (r.mesh.position.set(r.x, p - 0.3, r.z),
          r.mesh.rotation.set(Math.sin(t.time * 0.9) * 0.08, 0, Math.cos(t.time * 0.7) * 0.08),
          (r.mat.uniforms.uFade.value = m),
          Math.random() < e * 8 && t.vfx.ring(r.x, p + 0.05, r.z, $y * 0.6, 9099519, 0.6, 0.6),
          t.vfx.staticRing(r.x, p + 0.08, r.z, $y, 6994175, 0.35 * m),
          m > 0.5)
        )
          for (let t of i.within(r.x, r.z, $y)) {
            if (i.flags[t] & (R.Boss | R.Object | R.Capture | R.Treasure) || r.caught.some((e) => e.j === t))
              continue;
            let n = r.x - i.x[t],
              a = r.z - i.z[t],
              o = Math.hypot(n, a) || 1;
            if (o < eb && r.caught.length < 30 && !(i.flags[t] & 12290)) {
              r.caught.push({ j: t, g: i.gen[t], a: Math.atan2(-a, -n), h: 0, t: 0 });
              continue;
            }
            let s = (i.flags[t] & 12290 ? 4 : 10) * (1 - o / $y);
            ((i.kx[t] += (n / o) * s * e * 6), (i.kz[t] += (a / o) * s * e * 6));
          }
        for (let n = r.caught.length - 1; n >= 0; n--) {
          let a = r.caught[n];
          if (i.gen[a.j] !== a.g || !i.isAlive(a.j)) {
            r.caught.splice(n, 1);
            continue;
          }
          ((a.t += e), (a.a += e * (4 + a.t * 3)), (a.h = Math.min(12, a.h + e * 9)));
          let o = 1.5 + a.h * 0.25;
          if (
            ((i.x[a.j] = r.x + Math.cos(a.a) * o),
            (i.z[a.j] = r.z + Math.sin(a.a) * o),
            (i.y[a.j] = p + a.h),
            (i.vx[a.j] = i.vz[a.j] = 0),
            (i.stun[a.j] = Math.max(i.stun[a.j], 0.2)),
            a.t > 1.4 || r.t < 0.5)
          ) {
            let e = Math.cos(a.a),
              o = Math.sin(a.a),
              s = a.j;
            ((i.air[s] = 1),
              (i.vy[s] = 6),
              (i.kx[s] = e * 22),
              (i.kz[s] = o * 22),
              (i.stun[s] = 0),
              t.combat.hit(s, i.maxHp[s] * 0.35, { type: `flying`, cls: `physical`, fixed: !0, silent: !0 }),
              t.later(0.9, () => {
                i.isAlive(s) &&
                  i.gen[s] === a.g &&
                  (t.combat.hit(s, i.maxHp[s] * 0.45, { type: `flying`, cls: `physical`, fixed: !0 }),
                  t.vfx.dust(i.x[s], i.y[s], i.z[s], 13154456, 5, 3));
              }),
              r.caught.splice(n, 1));
          }
        }
        if (
          ((this.relaunch -= e),
          m > 0.5 &&
            this.relaunch <= 0 &&
            this.flying < 0 &&
            Math.hypot(o.x - r.x, o.z - r.z) < eb &&
            o.y - n.height(o.x, o.z) < 3 &&
            ((a.vel.y = tb),
            (a.grounded = !1),
            (a.iframes = Math.max(a.iframes, 1.2)),
            (this.flying = 0),
            (this.relaunch = 4),
            t.ui.popup(o.x, o.y + 2.6, o.z, c(`¡Por los aires!`), `#6ab8ff`, 1.1),
            t.audio.whoosh(),
            t.shake(0.3),
            t.vfx.burst(o.x, o.y + 1, o.z, 14216959, 24, 9, I.PixDrop, 0.5, 0.6, 10)),
          r.t <= 0)
        ) {
          for (let e = 0; e < 30; e++)
            t.vfx.norm.spawn({
              x: r.x + F.range(-3, 3),
              y: p + F.range(0, 14),
              z: r.z + F.range(-3, 3),
              vx: F.range(-3, 3),
              vy: F.range(-2, 1),
              vz: F.range(-3, 3),
              life: 1.2,
              size: 1.5,
              endSize: 3,
              color: 14216959,
              shape: I.Soft,
            });
          (t.r.scene.remove(r.mesh), r.mesh.geometry.dispose(), r.mat.dispose(), (this.spout = null));
        }
      }
      funnelMat() {
        let e = this.run.r.shared;
        return new Kr({
          transparent: !0,
          depthWrite: !1,
          side: 2,
          uniforms: {
            uTime: e.uTime,
            uFade: { value: 0 },
            uFogColor: e.uFogColor,
            uFogNear: e.uFogNear,
            uFogFar: e.uFogFar,
          },
          vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
          fragmentShader: `uniform float uTime, uFade, uFogNear, uFogFar; uniform vec3 uFogColor; varying vec2 vUv; varying float vD;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        void main(){
          vec2 q = floor(vec2(vUv.x * 56., vUv.y * 40.)) / vec2(56., 40.);
          float band = fract(q.x * 5. + q.y * 2.2 - uTime * 0.9);
          float band2 = fract(q.x * 3. - q.y * 1.4 - uTime * 0.6 + 0.37);
          float a = step(0.55, band) * 0.55 + step(0.7, band2) * 0.35;
          a += step(0.985, hash(q + floor(uTime * 8.))) * 0.6;
          a *= smoothstep(0., 0.12, vUv.y) * (1. - smoothstep(0.85, 1., vUv.y)) * uFade;
          if (a < 0.05) discard;
          vec3 c = mix(vec3(0.55, 0.72, 0.86), vec3(0.93, 0.97, 1.), step(0.6, band));
          gl_FragColor = vec4(mix(c, uFogColor, smoothstep(uFogNear, uFogFar, vD)), a);
          #include <colorspace_fragment>
        }`,
        });
      }
      tickFlight(e) {
        if (this.flying < 0) return;
        let t = this.run,
          n = t.player,
          r = n.pos,
          i = t.enemies;
        if (
          ((this.flying += e),
          n.vel.y > 0 && (n.iframes = Math.max(n.iframes, 0.2)),
          Math.random() < e * 20 && t.vfx.trail(r.x, r.y + 0.6, r.z, 14216959, 0.5, I.Soft, 0.4),
          this.flying > 0.4 && n.grounded)
        ) {
          this.flying = -1;
          let e = t.terrain.surface(r.x, r.z);
          (t.vfx.ring(r.x, e, r.z, 7, 6994175, 0.5),
            t.vfx.ring(r.x, e, r.z, 4.2, 9099519, 0.4),
            t.vfx.burst(r.x, e + 0.5, r.z, 14216959, 30, 11, I.PixDrop, 0.6, 0.6, 12),
            t.vfx.dust(r.x, e, r.z, 14207144, 14, 7),
            t.shake(0.6, r.x, r.z),
            t.hitstop(0.08),
            t.audio.boom(1),
            t.ui.popup(r.x, r.y + 2.6, r.z, c(`¡Aterrizaje!`), `#6ab8ff`, 1.1));
          for (let e of i.within(r.x, r.z, 7)) {
            if (i.flags[e] & (R.Object | R.Capture | R.Treasure)) continue;
            let n = i.flags[e] & R.Boss ? 0.03 : i.flags[e] & (12290 | R.Elite) ? 0.15 : 0.6,
              a = i.x[e] - r.x,
              o = i.z[e] - r.z,
              s = Math.hypot(a, o) || 1;
            t.combat.hit(e, i.maxHp[e] * n, {
              type: `water`,
              cls: `physical`,
              fixed: !0,
              knock: 8,
              dirX: a / s,
              dirZ: o / s,
            });
          }
        }
      }
      startBlizzard() {
        let e = this.run,
          t = e.enemies,
          n = e.player.pos;
        ((this.bliz = {
          t: nb,
          a: F.range(0, Math.PI * 2),
          turn: F.range(5, 8),
          k: 0,
          frost: 0,
          frostPop: 0,
          sheltered: !1,
          said: !1,
        }),
          e.ui.banner(
            c(`¡Ventisca!`),
            c(
              `El viento te empuja y casi no se ve: resguárdate tras rocas y acantilados, y no te quedes quieto`,
            ),
            `#bfeaff`,
          ),
          e.audio.alarm());
        let r = Je(ib).filter((e) => k.hasSprite(e));
        if (r.length)
          for (let i = 0; i < 4 + e.stage * 2; i++) {
            let i = F.range(0, Math.PI * 2),
              a = F.range(20, 27),
              o = n.x + Math.cos(i) * a,
              s = n.z + Math.sin(i) * a;
            e.terrain.inBounds(o, s, 5) &&
              t.spawn(F.pick(r), o, s, e.director.hpMult(), e.director.dmgMult(), 0);
          }
      }
      sheltered(e, t, n, r, i) {
        let a = this.run.terrain;
        if (!a.lineClear(e, t + 0.9, n, e - r * 5, t + 0.9, n - i * 5)) return !0;
        for (let o of a.colliders) {
          if (o.off || o.h < t + 1) continue;
          let a = o.x - e,
            s = o.z - n;
          if (a * a + s * s > 16) continue;
          let c = -(a * r + s * i),
            l = Math.abs(a * i - s * r);
          if (c > 0 && c < 3.5 && l < o.r + 0.5) return !0;
        }
        return !1;
      }
      tickBlizzard(e) {
        let t = this.run,
          n = this.bliz,
          r = t.player,
          i = r.pos,
          a = t.enemies,
          o = t.terrain;
        n.t -= e;
        let s = n.k;
        ((n.k = Math.max(0, Math.min(1, n.t > 3 ? n.k + e / 3 : n.t / 3))),
          Math.abs(n.k - s) > 0.001 && t.pushLook(),
          (n.turn -= e),
          n.turn <= 0 &&
            ((n.turn = F.range(5, 8)),
            (n.a += F.pick([-1, 1]) * F.range(1, 2.1)),
            t.ui.popup(i.x, i.y + 3, i.z, c(`¡Cambia el viento!`), `#d8f4ff`, 0.8)));
        let l = Math.cos(n.a),
          u = Math.sin(n.a),
          d = n.k,
          f = this.sheltered(i.x, i.y, i.z, l, u);
        if (
          (f &&
            !n.sheltered &&
            d > 0.5 &&
            t.ui.popup(i.x, i.y + 2.4, i.z, c(`¡A cubierto del viento!`), `#7aff8a`, 0.8),
          (n.sheltered = f),
          !f && r.grounded && ((r.kx += l * rb * d * e), (r.kz += u * rb * d * e)),
          (n.frost =
            !f && d > 0.5 && r.speedNow < 1.6 && r.pstat.frozen <= 0
              ? Math.min(1, n.frost + e * (r.types.includes(`fire`) ? 0.08 : 0.16))
              : Math.max(0, n.frost - e * 0.4)),
          (n.frostPop -= e),
          n.frost > 0.6 &&
            n.frostPop <= 0 &&
            ((n.frostPop = 2.2), t.ui.popup(i.x, i.y + 2.6, i.z, c(`¡Muévete!`), `#8ae8ff`, 0.9)),
          n.frost >= 1 && ((n.frost = 0), r.inflict(`frozen`, 1.2)),
          n.frost > 0.05 &&
            t.vfx.staticRing(
              i.x,
              i.y + 0.06,
              i.z,
              0.6 + n.frost * 1.2,
              n.frost > 0.6 ? 16777215 : 9103615,
              0.25 + n.frost * 0.6,
            ),
          d > 0.3)
        )
          for (let t = 0; t < a.n; t++)
            !a.alive[t] ||
              a.dying[t] > 0 ||
              a.flags[t] & (R.Boss | R.Object) ||
              (a.t1[t] !== this.iceIdx &&
                a.t2[t] !== this.iceIdx &&
                ((a.hazSlow[t] = Math.min(a.hazSlow[t], 1 - 0.25 * d)),
                (a.kx[t] += l * rb * 0.5 * d * e),
                (a.kz[t] += u * rb * 0.5 * d * e)));
        let p = t.r.camera.position;
        for (let n = Math.floor(e * 280 * d + Math.random()); n > 0; n--) {
          let e = p.x + F.range(-20, 20) - l * 12,
            n = p.z + F.range(-20, 20) - u * 12;
          t.vfx.norm.spawn({
            x: e,
            y: o.height(e, n) + F.range(0.2, 7),
            z: n,
            vx: l * F.range(16, 24),
            vy: F.range(-1.5, 0),
            vz: u * F.range(16, 24),
            life: F.range(0.8, 1.3),
            size: F.range(0.25, 0.55),
            endSize: 0.3,
            color: 16777215,
            shape: I.PixSnow,
            spin: 5,
          });
        }
        for (let n = Math.floor(e * 30 * d + Math.random()); n > 0; n--) {
          let e = i.x + F.range(-16, 16),
            n = i.z + F.range(-16, 16);
          t.vfx.norm.spawn({
            x: e,
            y: o.height(e, n) + 0.3,
            z: n,
            vx: l * 9,
            vy: F.range(0.2, 0.8),
            vz: u * 9,
            life: 1.4,
            size: 1.2,
            endSize: 3.5,
            color: 15923455,
            shape: I.Soft,
          });
        }
        n.t <= 0 && ((this.bliz = null), t.pushLook(), t.ui.toast(c(`La ventisca amaina`), null));
      }
      atmos() {
        let e = this.bliz;
        if (!e || e.k <= 0) return null;
        let t = this.look;
        return (
          (t.k = e.k * e.k * (3 - 2 * e.k)),
          (t.flash = 0),
          t.top.set(10137800),
          t.bottom.set(15266040),
          t.fog.set(14871798),
          t.sun.set(15266047),
          (t.near = 4),
          (t.far = 48),
          (t.light = 0.82),
          (t.clouds = [0.92, 0.95, 1]),
          (t.cover = 0.9),
          (t.vignette = 0.55),
          (t.tint = [0.94, 0.97, 1.04]),
          t
        );
      }
      get busy() {
        return !!this.bliz || !!this.spout;
      }
      clear() {
        (this.spout &&
          (this.run.r.scene.remove(this.spout.mesh),
          this.spout.mesh.geometry.dispose(),
          this.spout.mat.dispose()),
          (this.spout = null),
          (this.flying = -1),
          this.bliz && ((this.bliz = null), this.run.pushLook()));
      }
    },
    ob = {
      normal: [c(`Golpe Cuerpo`), c(`Vozarrón`)],
      fire: [c(`Envite Ígneo`), c(`Llamarada`)],
      water: [c(`Cascada`), c(`Hidrobomba`)],
      grass: [c(`Latigazo`), c(`Hoja Mágica`)],
      electric: [c(`Placaje Eléc.`), c(`Chispazo`)],
      ice: [c(`Carámbano`), c(`Ventisca`)],
      fighting: [c(`A Bocajarro`), c(`Onda Certera`)],
      poison: [c(`Puya Nociva`), c(`Bomba Lodo`)],
      ground: [c(`Terremoto`), c(`Tierra Viva`)],
      flying: [c(`Pájaro Osado`), c(`Tornado`)],
      psychic: [c(`Cabezazo Zen`), c(`Psíquico`)],
      bug: [c(`Picadura`), c(`Zumbido`)],
      rock: [c(`Avalancha`), c(`Poder Pasado`)],
      ghost: [c(`Garra Umbría`), c(`Bola Sombra`)],
      dragon: [c(`Garra Dragón`), c(`Pulso Dragón`)],
      dark: [c(`Golpe Cuerpo`), c(`Pulso Umbrío`)],
      steel: [c(`Cabeza de Hierro`), c(`Foco Resplandor`)],
      fairy: [c(`Golpe Cuerpo`), c(`Fuerza Lunar`)],
    },
    sb = class {
      run;
      list = [];
      used = new Set();
      rng;
      constructor(e) {
        ((this.run = e), (this.rng = new Ol(e.seed ^ (28903 + e.stage * 97))));
      }
      resetUsed() {
        this.used.clear();
      }
      alive(e) {
        let t = this.run.enemies;
        return t.gen[e.i] === e.gen && t.isAlive(e.i);
      }
      get(e) {
        return this.list.find((t) => t.i === e && this.run.enemies.gen[e] === t.gen) ?? null;
      }
      has(e) {
        return this.list.some((t) => t.kind === e);
      }
      get marker() {
        const {enemies,player}=this.run;
        let nearest=-1,best=Infinity;
        for(let i=0;i<enemies.n;i++){
          if(!(enemies.flags[i]&(R.Alpha|R.Totem|R.Summoner))||!enemies.isAlive(i))continue;
          const distance=(enemies.x[i]-player.pos.x)**2+(enemies.z[i]-player.pos.z)**2;
          if(distance<best){nearest=i;best=distance;}
        }
        return nearest<0?null:{x:enemies.x[nearest],z:enemies.z[nearest],i:nearest};
      }
      pick(e) {
        let t = this.run,
          n = Je(e ?? []).filter((e) => k.hasSprite(e) && !this.used.has(e)),
          r = n.length ? this.rng.pick(n) : 0;
        if (!r) {
          r = this.rng.pick(t.director.cards)?.id ?? 19;
          let e = k.evolutionsOf(r);
          e.length && k.hasSprite(e[0].id) && (r = this.rng.pick(e).id);
        }
        return (this.used.add(r), r);
      }
      family(e) {
        let t = k.get(e),
          n = k.pokemon.filter(
            (e) =>
              e.family === t.family &&
              e.evoStage < t.evoStage &&
              k.hasSprite(e.id) &&
              !(e.evoStage > 0 && e.bst < 230),
          ),
          r = this.run.stage >= 2 ? n : n.filter((e) => e.evoStage === 0);
        return (r.length ? r : n).map((e) => e.id);
      }
      make(e, t, n) {
        let r = this.run,
          i = r.enemies,
          a = k.get(t),
          o = a.types[0],
          s = ob[o] ?? ob.normal,
          c = r.director.cards.map((e) => e.id).filter((e) => k.get(e).types.some((e) => a.types.includes(e))),
          l = e === `summoner` ? this.family(t) : c,
          u = r.director.cards.map((e) => e.id),
          d = {
            kind: e,
            i: n,
            gen: i.gen[n],
            species: t,
            name: i.glyphWords[n] || a.name,
            color: Ni[o] ?? 16777215,
            t: 3,
            callT: e === `summoner` ? 1.5 : 7,
            life: 75,
            enraged: !1,
            moveName: ``,
            moveT: 0,
            phys: a.stats.spe >= 80 ? `charge` : `leap`,
            physName: s[0],
            specName: s[1],
            step: 0,
            farT: 0,
            moved: !1,
            chargeT: 0,
            cdx: 0,
            cdz: 0,
            chargeHit: !1,
            minions: [],
            calls: l.length ? l : u.length ? u : [t],
          };
        for (let e of d.calls) r.sprites.get(e);
        return ((i.flags[n] &= ~(R.Ranged | R.Charger)), d);
      }
      point(e, t) {
        let n = this.run,
          r = n.player.pos;
        for (let i = 0; i < 16; i++) {
          let i = this.rng.range(0, Math.PI * 2),
            a = this.rng.range(e, t),
            o = r.x + Math.cos(i) * a,
            s = r.z + Math.sin(i) * a;
          if (n.terrain.inBounds(o, s, 8) && (!n.terrain.inWater(o, s) || n.terrain.hasWater))
            return { x: o, z: s };
        }
        return null;
      }
      lastIndex = -1;
      spawnTotem(e, t) {
        let n = this.run;
        if (this.has(`totem`) || n.boss.alive || n.stageCleared) return !1;
        let r = t ?? this.point(20, 28);
        if (!r) return !1;
        let i = e ?? this.pick(n.biome.totems?.[n.stage - 1]);
        n.sprites.get(i);
        let a = n.enemies.spawn(i, r.x, r.z, n.director.hpMult(), n.director.dmgMult(), R.Totem);
        if (a < 0) return !1;
        (Oy(n, a, Ey(n, n.endless ? wy.totem[0] : wy.totem[Math.min(2, n.stage - 1)])),
          ky(n, a, Dy.totem[n.endless ? 0 : Math.min(2, n.stage - 1)]));
        let o = this.make(`totem`, i, a);
        (this.list.push(o), (this.lastIndex = a));
        let s = n.enemies.y[a];
        return (
          n.vfx.ring(r.x, s, r.z, 9, 14183167, 0.9),
          n.vfx.burst(r.x, s + 2, r.z, 15247615, 40, 10, I.Twinkle, 0.7, 0.8),
          n.ui.bigBanners && n.ui.bossIntro(i, false, 1.4, o.name, c(`Dominante`), o.kind),
          n.audio.alarm(),
          n.cry(i),
          !0
        );
      }
      spawnSummoner(e, t) {
        let n = this.run;
        if (this.has(`summoner`) || n.boss.alive || n.stageCleared) return !1;
        let r = t ?? this.point(34, 46);
        if (!r) return !1;
        let i = e ?? this.pick(n.biome.summoners?.[n.stage - 1]);
        n.sprites.get(i);
        let a = n.enemies.spawn(i, r.x, r.z, n.director.hpMult(), n.director.dmgMult(), R.Summoner);
        if (a < 0) return !1;
        (Oy(n, a, Ey(n, n.endless ? wy.summoner[0] : wy.summoner[Math.min(2, n.stage - 1)])),
          ky(n, a, Dy.summoner[n.endless ? 0 : Math.min(2, n.stage - 1)]),
          (n.enemies.speed[a] = 0));
        let o = this.make(`summoner`, i, a);
        (this.list.push(o), (this.lastIndex = a));
        let s = n.enemies.y[a];
        (n.vfx.ring(r.x, s, r.z, 8, 7012218, 0.9), n.vfx.dust(r.x, s, r.z, 13154456, 18, 6));
        return (
          n.ui.bigBanners && n.ui.bossIntro(i, false, 1.4, o.name, c(`Invocador`), o.kind),
          n.audio.alarm(),
          n.cry(i),
          !0
        );
      }
      update(e) {
        let t = this.run,
          n = t.enemies;
        for (let r = this.list.length - 1; r >= 0; r--) {
          let i = this.list[r];
          if (!this.alive(i)) {
            this.list.splice(r, 1);
            continue;
          }
          let a = i.i;
          if(t.coop?.monsters && i.chargeT>0)this.chargeContact(i,e);
          ((i.moveT -= e), (i.minions = i.minions.filter(([e, t]) => n.gen[e] === t && n.isAlive(e))));
          let o = i.kind === `totem` ? (i.enraged ? 16734858 : 12737279) : 5963642;
          if (
            (Math.random() < e * 4 &&
              t.vfx.ground.spawn({
                x: n.x[a],
                y: t.terrain.surface(n.x[a], n.z[a]) + 0.1,
                z: n.z[a],
                life: 1.1,
                size: n.radius[a] * 2,
                endSize: n.radius[a] * 3.4,
                color: o,
                shape: I.Ring,
                glow: 0.3,
                rot: 0,
              }),
            Math.random() < e * 14)
          ) {
            let e = F.range(0, Math.PI * 2),
              r = n.radius[a] * F.range(0.6, 1.4);
            t.vfx.add.spawn({
              x: n.x[a] + Math.cos(e) * r,
              y: n.y[a] + F.range(0, 0.6),
              z: n.z[a] + Math.sin(e) * r,
              vy: F.range(1.5, 3),
              life: 0.9,
              size: 0.45,
              endSize: 0,
              color: o,
              shape: i.kind === `totem` ? I.Flame : I.Twinkle,
              glow: 0.6,
            });
          }
          i.kind === `summoner` &&
            ((i.life -= e),
            i.life <= 0 &&
              (t.vfx.ring(n.x[a], n.y[a], n.z[a], 6, 5963642, 0.6),
              t.vfx.dust(n.x[a], n.y[a], n.z[a], 13154456, 16, 5),
              (n.dying[a] = 0.35),
              t.ui.toast(c(`{name} se ha marchado`, { name: i.name }), null),
              this.list.splice(r, 1)));
        }
      }
      act(e, t, n) {
        let r = this.get(e);
        r && (r.kind === `summoner` ? this.actSummoner(r, t, n) : this.actTotem(r, t));
      }
      roomAction(id,kind,x,z,replica){
        const mini=replica??this.get(id),r=this.run,e=r.enemies;
        if(!mini||!this.alive(mini))return;
        e.atkAnim[id]=.5;
        if(kind===6){
          const summoner=mini.kind==='summoner',limit=summoner?10+r.stage*2:10;
          if(mini.minions.length<limit)this.call(mini,Math.min(3+r.stage,limit-mini.minions.length),summoner?1:1.25,summoner?0:+(r.stage>=2));
          return;
        }
        mini.enraged=e.hp[id]<e.maxHp[id]*(T.fury[r.tier]??.5);
        this.say(mini,kind===4?mini.specName:mini.physName);
        if(kind===3)this.leap(mini,{x,z});
        if(kind===4)this.ring(mini,mini.kind==='summoner'?.6:.7);
        if(kind===5)this.slams(mini,{x,z});
        if(kind===7)this.charge(mini,{x,z});
        if((kind===3||kind===7)&&mini.enraged)r.later(kind===3?1.3:1.6,()=>{if(this.alive(mini))this.ring(mini,.6);});
      }
      chargeContact(mini,dt){
        const r=this.run,e=r.enemies,id=mini.i,p=r.player;
        mini.chargeT-=dt;
        if(Math.random()<.7)r.vfx.trail(e.x[id],e.y[id]+.8,e.z[id],mini.color,.9,am(e.typesOf(id)[0]),.35);
        if(!mini.chargeHit && Math.hypot(p.pos.x-e.x[id],p.pos.z-e.z[id])<e.radius[id]+1.2 && p.pos.y-e.y[id]<2){
          mini.chargeHit=true;
          if(this.strike(mini,1.8,.1))p.shove(mini.cdx,mini.cdz,10);
        }
      }
      actTotem(e, t) {
        let n = this.run,
          r = n.enemies,
          i = n.player,
          a = e.i;
        !e.enraged &&
          r.hp[a] < r.maxHp[a] * (T.fury[n.tier] ?? 0.5) &&
          ((e.enraged = !0),
          (r.speed[a] *= 1.2),
          n.vfx.ring(r.x[a], r.y[a], r.z[a], 7, 16734858, 0.6),
          n.cry(e.species),
          n.shake(0.3));
        if (e.chargeT > 0) {
          r.kx[a]=e.cdx*34;r.kz[a]=e.cdz*34;
          this.chargeContact(e,t);
          return;
        }
        let s = e.enraged ? 1.35 : 1;
        if (
          ((e.farT =
            Math.hypot(i.pos.x - r.x[a], i.pos.z - r.z[a]) > 16 ? e.farT + t : Math.max(0, e.farT - t * 2)),
          e.farT > 2.5 && e.t < 1.5)
        ) {
          ((e.farT = 0), (r.atkAnim[a] = 0.5), this.say(e, e.physName), (e.t = this.leap(e) - 1));
          return;
        }
        if (((e.callT -= t * s), e.callT <= 0 && ((e.callT = 13), e.minions.length < 10))) {
          (this.say(e, c(`¡Pide ayuda!`)),
            this.call(e, 3 + n.stage, 1.25, +(n.stage >= 2)),
            (e.t = Math.max(e.t, 1.6)));
          return;
        }
        if (((e.t -= t * s), e.t > 0)) return;
        r.atkAnim[a] = 0.5;
        let l = e.step++ % 3;
        l === 0
          ? (this.say(e, e.physName),
            (e.t = e.phys === `leap` ? this.leap(e) : this.charge(e)),
            e.enraged &&
              n.later(e.phys === `leap` ? 1.3 : 1.6, () => {
                this.alive(e) && this.ring(e, 0.6);
              }))
          : l === 1
            ? (this.say(e, e.specName), (e.t = this.ring(e)))
            : (this.say(e, e.physName), (e.t = this.slams(e)));
      }
      strike(e, t, n = qv) {
        let r = this.run,
          i = r.player,
          a = r.enemies,
          o = e.i;
        return i.hurt(
          a.dmg[o] * t * r.diff.enemyDamage,
          a.typesOf(o)[0],
          -1,
          a.x[o],
          a.z[o],
          !1,
          0.34,
          o,
          Xv(r, n),
        )
          ? (i.wound(Jv(r)), !0)
          : !1;
      }
      slams(e,target) {
        let t = this.run,
          n = t.enemies,
          r = t.player,
          i = n.typesOf(e.i)[0],
          a = e.enraged ? 4 : 3;
        for (let n = 0; n < a; n++) {
          let a = (target??r.pos).x + (n === 0 ? (target?0:r.vel.x*.8) : F.range(-6, 6)),
            o = (target??r.pos).z + (n === 0 ? (target?0:r.vel.z*.8) : F.range(-6, 6)),
            s = t.terrain.height(a, o),
            c = 3.2,
            l = 1.1 + n * 0.1;
          (t.vfx.enemyCircle(a, s, o, c, e.color, l),
            t.later(l, () => {
              if (!this.alive(e)) return;
              (t.vfx.burst(a, s + 0.5, o, e.color, 18, 8, am(i), 0.7, 0.5),
                t.vfx.ring(a, s, o, c, e.color, 0.35),
                t.shake(0.15, a, o),
                t.audio.boom(0.55));
              let n = r.pos.x - a,
                l = r.pos.z - o;
              n * n + l * l < c * c && r.pos.y - s < 2 && this.strike(e, 1.4);
            }));
        }
        return ((n.atkAnim[e.i] = 0.6), 3.6);
      }
      actSummoner(e, t, n) {
        let r = this.run,
          i = r.enemies,
          a = e.i;
        if (!e.moved && i.hp[a] < i.maxHp[a] * 0.5) {
          let t = this.point(22, 30);
          if (t) {
            ((e.moved = !0),
              r.vfx.dust(i.x[a], i.y[a], i.z[a], 13154456, 22, 7),
              r.vfx.ring(i.x[a], i.y[a], i.z[a], 6, 5963642, 0.6),
              (i.x[a] = t.x),
              (i.z[a] = t.z),
              (i.y[a] = r.terrain.surface(t.x, t.z)),
              (i.vx[a] = i.vz[a] = i.kx[a] = i.kz[a] = 0),
              r.vfx.dust(t.x, i.y[a], t.z, 13154456, 22, 7),
              r.ui.toast(c(`{name} se esconde en otro sitio: sigue la flecha`, { name: e.name }), null),
              this.call(e, 3 + r.stage, 1, 0),
              (e.callT = 4.5));
            return;
          }
        }
        if (((e.callT -= t), e.callT <= 0)) {
          e.callT = 4.5;
          let t = 10 + r.stage * 2;
          e.minions.length < t &&
            ((i.atkAnim[a] = 0.5),
            this.call(e, Math.min(t - e.minions.length, 3 + r.stage), 1, 0),
            Math.random() < 0.35 && r.cry(e.species));
        }
        ((e.t -= t),
          n < 10 &&
            e.t <= 0 &&
            ((i.atkAnim[a] = 0.5), this.say(e, e.specName), this.ring(e, 0.6), (e.t = 3.6)));
      }
      say(e, t) {
        ((e.moveName = moveCopy(e.species, t)), (e.moveT = 2));
      }
      call(e, t, n, r) {
        let i = this.run,
          a = i.enemies,
          o = e.i,
          s = i.director;
        i.vfx.ring(a.x[o], a.y[o], a.z[o], 7, e.kind === `totem` ? 15247615 : 9109402, 0.5);
        for (let c = 0; c < t; c++) {
          let t = F.range(0, Math.PI * 2),
            l = a.radius[o] + F.range(2.5, 5),
            u = a.x[o] + Math.cos(t) * l,
            d = a.z[o] + Math.sin(t) * l;
          if (!i.terrain.inBounds(u, d, 4)) continue;
          let f = F.pick(e.calls),
            p = a.spawn(f, u, d, s.hpMult() * n, s.dmgMult(), c < r ? R.Elite : 0);
          if (p < 0) continue;
          e.minions.push([p, a.gen[p]]);
          let m = i.terrain.height(u, d);
          (i.vfx.dust(u, m, d, 13154456, 5, 3),
            i.vfx.burst(u, m + 0.8, d, e.kind === `totem` ? 15247615 : 9109402, 6, 3, I.Twinkle, 0.4, 0.4));
        }
      }
      leap(e, target) {
        let t = this.run,
          n = t.enemies,
          r = t.player,
          i = e.i,
          a = n.typesOf(i)[0],
          o = n.x[i],
          s = n.z[i],
          c = target?.x ?? r.pos.x,
          l = target?.z ?? r.pos.z,
          u = t.terrain.height(c, l),
          d = 4.5,
          f = 1.07;
        return (
          t.vfx.enemyCircle(c, u, l, d, e.color, f),
          (n.air[i] = 1),
          (n.vy[i] = 16),
          t.audio.jump(0.5),
          t.animate(
            f,
            (t) => {
              !target && this.alive(e) &&
                ((n.x[i] = o + (c - o) * t), (n.z[i] = s + (l - s) * t), (n.vx[i] = n.vz[i] = 0));
            },
            () => {
              if (this.alive(e)) {
                (t.vfx.burst(c, u + 0.5, l, e.color, 22, 9, am(a), 0.8, 0.6, 14),
                  t.vfx.ring(c, u, l, d, e.color, 0.5),
                  t.vfx.dust(c, u, l, 13154456, 14, 7),
                  t.shake(0.35, c, l),
                  t.audio.boom(0.7),
                  Math.hypot(r.pos.x - c, r.pos.z - l) < d && r.pos.y - u < 2.2 && this.strike(e, 1.5, 0.12));
                for (let r = 0; r < 8; r++) {
                  let o = (r / 8) * Math.PI * 2;
                  t.projectiles.fire({
                    x: c,
                    y: u + 0.8,
                    z: l,
                    dx: Math.cos(o),
                    dz: Math.sin(o),
                    speed: 10,
                    life: 2,
                    radius: 0.5,
                    dmg: n.dmg[i] * 0.6,
                    type: a,
                    cls: `physical`,
                    flags: em.Hostile | em.Capped,
                    size: 1,
                    shape: am(a),
                    color: e.color,
                    from: i,
                  });
                }
              }
            },
          ),
          4.2
        );
      }
      charge(e, target) {
        let t = this.run,
          n = t.enemies,
          r = target ?? t.player.pos,
          i = e.i,
          a = r.x - n.x[i],
          o = r.z - n.z[i],
          s = Math.hypot(a, o) || 1,
          c = Math.min(24, s + 6),
          l = a / s,
          u = o / s;
        e.windupUntil = t.time + .95;
        n.vx[i] = n.vz[i] = n.kx[i] = n.kz[i] = 0;
        t.vfx.enemyLine(n.x[i], n.z[i], n.x[i] + l * c, n.z[i] + u * c,
          n.radius[i] + 1.2, e.color, .95);
        return (
          t.later(0.95, () => {
            this.alive(e) &&
              ((e.cdx = l), (e.cdz = u), (e.chargeHit = !1), (e.chargeT = c / 34), t.audio.whoosh());
          }),
          4.2
        );
      }
      ring(e, t = 0.7) {
        let n = this.run,
          r = n.enemies,
          i = e.i,
          a = r.typesOf(i)[0],
          o = e.enraged ? 16 : 12,
          s = e.enraged ? 2 : 1;
        for (let c = 0; c < s; c++)
          n.later(0.35 + c * 0.45, () => {
            if (this.alive(e)) {
              for (let s = 0; s < o; s++) {
                let l = (s / o) * Math.PI * 2 + c * 0.25,
                  u = n.projectiles.fromBody(i, Math.cos(l), Math.sin(l));
                n.projectiles.fire({
                  x: r.x[i],
                  y: u.y,
                  z: r.z[i],
                  dx: Math.cos(l),
                  dy: u.dy,
                  dz: Math.sin(l),
                  speed: 9,
                  life: 3.5,
                  radius: 0.55,
                  dmg: r.dmg[i] * t,
                  type: a,
                  cls: `special`,
                  flags: em.Hostile | em.Capped,
                  size: 1,
                  shape: I.Soft,
                  color: e.color,
                  from: i,
                });
              }
              (n.vfx.ring(r.x[i], r.y[i], r.z[i], 5, e.color, 0.4), n.audio.shot(a, 0.7));
            }
          });
        return (n.vfx.enemyCircle(r.x[i], r.y[i], r.z[i], 3, e.color, 0.35), 4.2);
      }
      onKilled(e) {
        let t = this.run,
          n = t.enemies,
          r = this.get(e);
        if (!r) return;
        this.list.splice(this.list.indexOf(r), 1);
        let i = n.x[e],
          a = n.y[e],
          o = n.z[e],
          s = t.player.stats;
        if ((t.hitstop(0.25), t.shake(0.5), r.kind === `totem`)) {
          (t.stats.totems++,
            t.ui.banner(c(`¡Dominante derrotado!`), c(`Su aura es tuya: elige una bendición`), `#c25aff`, {
              species: t.player.speciesId,
            }),
            t.spawnChestAt(i, o, `free`));
          for (let e = 0; e < 10; e++) t.pickups.spawn(`coin`, i, a, o, Math.ceil((3 + t.stage * 3) * s.gold));
          t.queueBlessing(c(`Aura del Dominante`), 1);
        } else {
          t.stats.summoners++;
          let e = 0;
          for (let [i, a] of r.minions)
            n.gen[i] === a &&
              n.isAlive(i) &&
              ((n.dying[i] = 0.35), (n.hp[i] = 0), t.combat.credit(i, {}, !1), e++);
          (t.ui.banner(
            c(`¡Invocador derrotado!`),
            e ? c(`Sus {n} esbirros se desmayan con él`, { n: e }) : c(`Se acabaron los refuerzos`),
            `#3ac85a`,
            { species: r.species },
          ),
            t.pickups.spawn(`candy`, i, a, o, 1));
          for (let e = 0; e < 8; e++) t.pickups.spawn(`coin`, i, a, o, Math.ceil((3 + t.stage * 3) * s.gold));
        }
        t.audio.power();
      }
    },
    cb = {
      fog: {
        name: c(`Niebla espectral`),
        sub: c(`Una niebla helada lo cubre todo... y algo se mueve en ella`),
        color: `#9a7aff`,
        dur: 45,
        pool: [
          [92, 41, 96],
          [93, 42, 96],
          [94, 93, 97],
        ],
        look: {
          top: 3814480,
          bottom: 6971528,
          fog: 5919348,
          near: 2,
          far: 26,
          light: 0.62,
          sun: 12101887,
          clouds: [0.55, 0.52, 0.66],
          cover: 0.6,
          vignette: 0.62,
          tint: [0.74, 0.72, 0.9],
        },
      },
      storm: {
        name: c(`Tormenta eléctrica`),
        sub: c(`Caen rayos: aléjate de las marcas amarillas`),
        color: `#ffd23a`,
        dur: 40,
        pool: [
          [100, 81, 25],
          [101, 82, 125, 26],
          [101, 82, 125, 135],
        ],
        look: {
          top: 2765894,
          bottom: 6978192,
          fog: 5661306,
          near: 22,
          far: 110,
          light: 0.58,
          sun: 13162751,
          clouds: [0.36, 0.4, 0.48],
          cover: 1,
          vignette: 0.55,
          tint: [0.62, 0.68, 0.82],
        },
      },
      meowth: {
        name: c(`Meowth dorado`),
        sub: c(`Suelta monedas con cada golpe. ¡Atrápalo antes de que escape!`),
        color: `#ffc83a`,
        dur: 25,
      },
    },
    lb = 52,
    ub = class {
      run;
      kind = null;
      left = 0;
      k = 0;
      flash = 0;
      spawnT = 0;
      spawned = 0;
      boltT = 2;
      wetT = 0;
      done = new Set();
      meowth = -1;
      meowthGen = 0;
      coinCd = 0;
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
        clouds: [1, 1, 1],
        cover: 0,
        vignette: 0.4,
        tint: [1, 1, 1],
      };
      constructor(e) {
        this.run = e;
      }
      get active() {
        return this.kind !== null;
      }
      get def() {
        return this.kind ? cb[this.kind] : null;
      }
      get blind() {
        return this.kind === `fog` && this.k > 0.5;
      }
      get marker() {
        let e = this.run.enemies,
          t = this.meowth;
        return t >= 0 && e.gen[t] === this.meowthGen && e.isAlive(t) ? { x: e.x[t], z: e.z[t], i: t } : null;
      }
      startRandom() {
        let e = this.run;
        if (this.active || e.boss.alive || e.stageCleared || e.mapEvents.busy) return !1;
        let t = Object.keys(cb).filter((e) => !this.done.has(e));
        return (
          !t.length && e.endless && (this.done.clear(), (t = Object.keys(cb))),
          !t.length || this.start(F.weighted(t, (e) => (e === `meowth` ? 0.8 : 1)))
        );
      }
      start(e) {
        let t = this.run,
          n = cb[e];
        if (!n) return false;
        (this.active && this.end(!0),
          (this.kind = e),
          (this.left = n.dur),
          (this.spawned = 0),
          (this.spawnT = 2),
          (this.boltT = 3),
          this.done.add(e));
        for (let e of this.pool()) t.sprites.get(e);
        return e === `meowth` && !this.spawnMeowth()
          ? ((this.kind = null), !1)
          : (t.ui.banner(
              c(`¡{name}!`, { name: n.name }),
              n.sub,
              n.color,
              e === `meowth` ? { species: lb } : void 0,
            ),
            t.audio.alarm(),
            e === `storm` && t.audio.boom(0.6),
            !0);
      }
      pool() {
        let e = this.def?.pool?.[Math.min(2, this.run.stage - 1)] ?? [];
        return Je(e).filter((e) => k.hasSprite(e));
      }
      end(e = !1) {
        let t = this.run;
        if (!e && this.kind) {
          let e =
            this.kind === `fog`
              ? c(`La niebla se disipa`)
              : this.kind === `storm`
                ? c(`La tormenta se aleja`)
                : ``;
          e && t.ui.toast(e, null);
        }
        ((this.kind = null), (this.left = 0));
      }
      update(e) {
        let t = this.run,
          n = this.k,
          r = this.flash;
        (this.kind
          ? ((this.left -= e),
            this.kind === `meowth`
              ? (this.updateMeowth(e), (this.k = Math.max(0, this.k - e / 3)))
              : ((this.k = Math.min(1, this.k + e / 3)),
                this.updateSpawns(e),
                this.kind === `fog`
                  ? this.fogFx(e)
                  : this.stormFx(e)),
            this.left <= 0 && this.end())
          : (this.k = Math.max(0, this.k - e / 3)),
          (this.flash = Math.max(0, this.flash - e * 5)),
          (this.k !== n || this.flash > 0 || r > 0) && t.pushLook());
      }
      atmos() {
        if (this.k <= 0 && this.flash <= 0) return null;
        let e = this.out,
          t = cb[this.lastLook];
        ((e.k = this.k * this.k * (3 - 2 * this.k)), (e.flash = this.flash));
        let n = t.look;
        return (
          e.top.set(n.top),
          e.bottom.set(n.bottom),
          e.fog.set(n.fog),
          e.sun.set(n.sun),
          (e.near = n.near),
          (e.far = n.far),
          (e.light = n.light),
          (e.clouds = n.clouds),
          (e.cover = n.cover),
          (e.vignette = n.vignette),
          (e.tint = n.tint),
          e
        );
      }
      get lastLook() {
        return (this.kind && cb[this.kind].look && (this._last = this.kind), this._last);
      }
      _last = `fog`;
      updateSpawns(e) {
        let t = this.run,
          n = t.enemies,
          r = this.pool();
        if (!r.length || this.spawned >= 30 || this.left < 6 || ((this.spawnT -= e), this.spawnT > 0)) return;
        this.spawnT = 4;
        let i = t.player.pos,
          a = 3 + t.stage;
        for (let e = 0; e < a; e++) {
          let a = F.range(0, Math.PI * 2),
            o = F.range(20, 27),
            s = i.x + Math.cos(a) * o,
            c = i.z + Math.sin(a) * o;
          if (!t.terrain.inBounds(s, c, 5)) continue;
          let u = n.spawn(F.pick(r), s, c, t.director.hpMult(), t.director.dmgMult(), 0);
          u < 0 ||
            (this.spawned++,
            this.kind === `fog` &&
              ((n.flags[u] |= R.Flying),
              (n.xp[u] *= 2),
              t.vfx.add.spawn({
                x: s,
                y: n.y[u] + 1,
                z: c,
                life: 0.6,
                size: 2.4,
                endSize: 0,
                color: 10124031,
                shape: I.Wisp,
                glow: 0.5,
              })));
        }
      }
      fogFx(e) {
        let t = this.run,
          n = t.r.camera.position,
          r = t.player.pos;
        if (Math.random() < e * 9 * this.k) {
          let e = n.x + F.range(-22, 22),
            r = n.z + F.range(-22, 22);
          t.vfx.norm.spawn({
            x: e,
            y: t.terrain.surface(e, r) + F.range(0.4, 2.2),
            z: r,
            vx: F.range(-0.6, 0.6),
            vy: 0.05,
            vz: F.range(-0.6, 0.6),
            life: 4.5,
            size: F.range(5, 8),
            endSize: 10,
            color: 9076904,
            endColor: 6971528,
            shape: I.Soft,
          });
        }
        if (Math.random() < e * 3 * this.k) {
          let e = F.range(0, Math.PI * 2),
            n = F.range(4, 12),
            i = r.x + Math.cos(e) * n,
            a = r.z + Math.sin(e) * n;
          t.vfx.add.spawn({
            x: i,
            y: t.terrain.surface(i, a) + F.range(0.5, 2),
            z: a,
            vy: 0.4,
            life: 1.6,
            size: 0.5,
            endSize: 0,
            color: 12098303,
            shape: I.Wisp,
            glow: 0.8,
          });
        }
      }
      stormFx(e) {
        let t = this.run,
          n = t.r.camera.position,
          r = t.player,
          i = t.enemies,
          a = t.biome.id !== `desert`,
          o = Math.floor((a ? 90 : 18) * e * 10 * this.k + Math.random());
        for (let e = 0; e < o; e++) {
          let e = n.x + F.range(-24, 24),
            r = n.z + F.range(-24, 24),
            i = n.y + F.range(4, 14);
          a
            ? t.vfx.norm.spawn({
                x: e,
                y: i,
                z: r,
                vx: 4,
                vy: -30,
                vz: 1,
                life: 0.5,
                size: 0.24,
                endSize: 0.24,
                color: 11059424,
                shape: I.Drop,
                rot: Math.PI,
              })
            : t.vfx.norm.spawn({
                x: e,
                y: i - 7,
                z: r,
                vx: 12,
                vy: -1,
                vz: 3,
                life: 1.3,
                size: 0.6,
                endSize: 1,
                color: 12101768,
                shape: I.Soft,
              });
        }
        if (a && (this.wetT -= e) <= 0) {
          this.wetT = 0.5;
          for (let e of i.within(r.pos.x, r.pos.z, 25)) i.wet[e] = Math.max(i.wet[e], 2);
        }
        if (((this.boltT -= e), this.boltT > 0 || this.k < 0.6)) return;
        this.boltT = F.range(0.9, 1.6);
        let s, c, l;
        if (F.chance(0.35)) {
          let e = F.range(0, Math.PI * 2),
            t = F.range(0, 3);
          ((s = r.pos.x + Math.cos(e) * t), (c = r.pos.z + Math.sin(e) * t), (l = 1.1));
        } else {
          let e = i.within(r.pos.x, r.pos.z, 26),
            t = e.length ? F.pick(e) : -1;
          (t >= 0
            ? ((s = i.x[t]), (c = i.z[t]))
            : ((s = r.pos.x + F.range(-18, 18)), (c = r.pos.z + F.range(-18, 18))),
            (l = 0.6));
        }
        let u = t.terrain.surface(s, c);
        (t.vfx.enemyCircle(s, u, c, 3, 16773754, l), t.later(l, () => this.bolt(s, u, c, 3)));
      }
      bolt(e, t, n, r) {
        let i = this.run,
          a = i.player,
          o = i.enemies;
        (i.vfx.lightning(e + F.range(-3, 3), t + 34, n + F.range(-3, 3), e, t, n, 16774824, 0.7, 9, 0.22),
          i.vfx.lightning(e + F.range(-2, 2), t + 26, n + F.range(-2, 2), e, t, n, 16775376, 0.3, 7, 0.16),
          i.vfx.flash(e, t + 1, n, 16774856, 7, 0.18),
          i.vfx.ring(e, t, n, r * 1.4, 16773754, 0.35),
          i.vfx.burst(e, t + 0.5, n, 16773754, 12, 8, I.Bolt, 0.5, 0.35),
          i.vfx.groundN.spawn({
            x: e,
            y: t + 0.08,
            z: n,
            life: 2.5,
            size: r * 1.1,
            endSize: r * 1.1,
            color: 5918816,
            shape: I.PixCrack,
            rot: F.range(0, 6.28),
          }),
          i.shake(0.25, e, n),
          i.audio.boom(0.8),
          i.audio.zap(),
          (this.flash = 1),
          Math.hypot(a.pos.x - e, a.pos.z - n) < r &&
            a.pos.y - t < 2.5 &&
            a.hurt(16 * i.director.dmgMult() * i.diff.enemyDamage, `electric`, -1, NaN, NaN, !1, 0, {
              kind: `event`,
              species: 0,
            }));
        for (let t of o.within(e, n, r + 1.5)) {
          let e = o.flags[t] & (R.Boss | R.Alpha | R.Totem | R.Summoner);
          (i.combat.hit(t, o.maxHp[t] * (e ? 0.04 : 0.3), {
            type: `electric`,
            cls: `special`,
            fixed: !0,
            noReact: !0,
          }),
            o.isAlive(t) && i.combat.applyStatus(t, `paralysis`, 0));
        }
      }
      spawnMeowth() {
        let e = this.run,
          t = e.player.pos;
        e.sprites.get(lb);
        for (let n = 0; n < 12; n++) {
          let n = F.range(0, Math.PI * 2),
            r = F.range(14, 20),
            i = t.x + Math.cos(n) * r,
            a = t.z + Math.sin(n) * r;
          if (!e.terrain.inBounds(i, a, 10)) continue;
          let o = e.enemies.spawn(lb, i, a, e.director.hpMult(), 1, R.Treasure);
          return o < 0
            ? !1
            : ((this.meowth = o),
              (this.meowthGen = e.enemies.gen[o]),
              (e.enemies.speed[o] = 7.4),
              (e.enemies.flags[o] &= ~(R.Ranged | R.Charger)),
              e.vfx.burst(i, e.enemies.y[o] + 1, a, 16765498, 30, 8, I.Star, 0.6, 0.7),
              e.cry(lb),
              !0);
        }
        return !1;
      }
      updateMeowth(e) {
        let t = this.run,
          n = t.enemies,
          r = this.meowth;
        ((this.coinCd -= e),
          this.marker
            ? (Math.random() < e * 12 &&
                t.vfx.trail(
                  n.x[r] + F.range(-0.6, 0.6),
                  n.y[r] + F.range(0.3, 1.4),
                  n.z[r] + F.range(-0.6, 0.6),
                  16765498,
                  0.5,
                  I.Twinkle,
                  0.5,
                ),
              this.left <= 0 &&
                (t.vfx.burst(n.x[r], n.y[r] + 1, n.z[r], 16765498, 24, 7, I.Star, 0.6, 0.6),
                t.vfx.dust(n.x[r], n.y[r], n.z[r], 13154456, 12, 5),
                n.kill(r),
                (this.meowth = -1),
                t.ui.toast(c(`Meowth dorado se escapa con su botín`), null)))
            : this.end(!0));
      }
      onHit(e) {
        if (e !== this.meowth || this.coinCd > 0) return;
        let t = this.run,
          n = t.enemies;
        ((this.coinCd = 0.16),
          t.pickups.spawn(
            `coin`,
            n.x[e],
            n.y[e] + 0.5,
            n.z[e],
            Math.ceil((2 + t.stage * 2) * t.player.stats.gold),
          ),
          t.audio.coin());
      }
      onKilled(e) {
        if (e !== this.meowth) return;
        let t = this.run,
          n = t.enemies,
          r = t.player.stats;
        for (let i = 0; i < 30; i++)
          t.pickups.spawn(`coin`, n.x[e], n.y[e], n.z[e], Math.ceil((4 + t.stage * 4) * r.gold));
        (t.vfx.burst(n.x[e], n.y[e] + 1, n.z[e], 16765498, 50, 12, I.Star, 0.7, 0.8),
          t.ui.banner(c(`¡Día de Pago!`), c(`Meowth dorado suelta todas sus monedas`), `#ffc83a`, {
            species: lb,
          }),
          t.audio.power(),
          (this.meowth = -1),
          this.end(!0));
      }
    };
  return {wy, ay, gy, Iy, sb, ub, Gy, ab};
}
