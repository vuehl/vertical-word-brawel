import {VFX_SCALE} from '../effects/visual-scale.js';
import {typeColors as Ni, typeNames as Pi, gameData as k} from "../data/game-database.js";
import {random as F, I, Fl, ql} from "../effects/battle-particles.js";
import {R, Tf, Ef, rf, lf} from "./enemy-population.js";
import {Jp, qp} from "../effects/move-particles.js";
import {applyShelfMaterial, moveShelfAlly} from "../world/desk-shelf.js";
import {pickupRadius, inPickupRange, pickupSpeed, pickupArrived} from "./paper-pickups.js";
import {chineseText as c, formatChineseNumber as n} from "../data/chinese-text.js";
import {X as Rr, Y as zr, b as Wr} from "../vendor/three-DmSYIDKK.js";
import {createCaptureGourd} from "./capture-gourd.js";
import {Lo} from "../ui/controls.js";
import {Xc} from "../actors/sprite-assets.js";
import {Zg} from "../data/move-attributes.js";

var Yp = 3e3,
  Xp = 0.35,
  Zp = 160,
  Qp = 36,
  $p = 48,
  em = (function (e) {
    return (
      (e[(e.Hostile = 1)] = `Hostile`),
      (e[(e.Homing = 2)] = `Homing`),
      (e[(e.Boomerang = 4)] = `Boomerang`),
      (e[(e.Arc = 8)] = `Arc`),
      (e[(e.Explode = 16)] = `Explode`),
      (e[(e.Wave = 32)] = `Wave`),
      (e[(e.Pull = 64)] = `Pull`),
      (e[(e.Mine = 128)] = `Mine`),
      (e[(e.Drain = 256)] = `Drain`),
      (e[(e.Spin = 512)] = `Spin`),
      (e[(e.Capped = 1024)] = `Capped`),
      (e[(e.Alpha = 2048)] = `Alpha`),
      (e[(e.PassThroughEnemies = 4096)] = `PassThroughEnemies`),
      e
    );
  })({}),
  tm = class {
    run;
    n = 0;
    tmpHit = [];
    tmpBoom = [];
    tmpPull = [];
    tmpBounce = [];
    alive = new Uint8Array(Yp);
    x = new Float32Array(Yp);
    y = new Float32Array(Yp);
    z = new Float32Array(Yp);
    vx = new Float32Array(Yp);
    vy = new Float32Array(Yp);
    vz = new Float32Array(Yp);
    life = new Float32Array(Yp);
    maxLife = new Float32Array(Yp);
    rad = new Float32Array(Yp);
    dmg = new Float32Array(Yp);
    pierce = new Int16Array(Yp);
    bounce = new Int16Array(Yp);
    flags = new Int32Array(Yp);
    explodeR = new Float32Array(Yp);
    explosionArtRadius = new Float32Array(Yp);
    size = new Float32Array(Yp);
    shape = new Uint8Array(Yp);
    color = new Uint32Array(Yp);
    slot = new Int8Array(Yp);
    knock = new Float32Array(Yp);
    drain = new Float32Array(Yp);
    target = new Int32Array(Yp);
    speed = new Float32Array(Yp);
    statusChance = new Float32Array(Yp);
    trail = new Float32Array(Yp);
    rot = new Float32Array(Yp);
    // The visual registry exceeds 255 entries; preserve the full effect ID.
    fx = new Uint16Array(Yp);
    types = Array(Yp);
    cls = Array(Yp);
    status = Array(Yp);
    hits = new Int32Array(Yp * 8);
    hitN = new Uint8Array(Yp);
    src = Array(Yp).fill(null);
    free = [];
    pool;
    glow;
    constructor(e) {
      ((this.run = e),
        (this.pool = new ql(e.vfx.combatLayer, e.vfx.atlas, Yp, !1, e.r.shared)),
        (this.glow = new ql(e.vfx.combatLayer, e.vfx.atlas, Yp, !0, e.r.shared)));
    }
    perSlot = new Int32Array(16);
    ownShots = 0;
    used = 0;
    fire(e) {
      let t = !!((e.flags ?? 0) & 1),
        n = e.slot ?? -1;
      if (!t && (this.used >= Yp * 0.85 || (n >= 0 && n < 16 && this.perSlot[n] >= Yp * Xp))) return -1;
      let r;
      if (this.free.length) r = this.free.pop();
      else if (this.n < Yp) r = this.n++;
      else return -1;
      (this.used++, n >= 0 && n < 16 && this.perSlot[n]++);
      let i = Math.hypot(e.dx, e.dy ?? 0, e.dz) || 1;
      return (
        (this.alive[r] = 1),
        (this.x[r] = e.x),
        (this.y[r] = e.y),
        (this.z[r] = e.z),
        (this.vx[r] = (e.dx / i) * e.speed),
        (this.vy[r] = ((e.dy ?? 0) / i) * e.speed),
        (this.vz[r] = (e.dz / i) * e.speed),
        (this.speed[r] = e.speed),
        (this.life[r] = this.maxLife[r] = e.life),
        (this.rad[r] = e.radius),
        (this.dmg[r] = e.dmg),
        (this.pierce[r] = e.pierce ?? 0),
        (this.bounce[r] = e.bounce ?? 0),
        (this.flags[r] = e.flags ?? 0),
        (this.explodeR[r] = e.explodeR ?? 0),
        (this.explosionArtRadius[r] = e.explosionArtRadius ?? this.explodeR[r]),
        (this.size[r] = e.size ?? e.radius * 2),
        (this.shape[r] = e.shape ?? I.Soft),
        (this.color[r] = e.color ?? Ni[e.type]),
        (this.slot[r] = e.slot ?? -1),
        (this.knock[r] = e.knock ?? 1.2),
        (this.drain[r] = e.drain ?? 0),
        (this.target[r] = e.target ?? -1),
        (this.statusChance[r] = e.statusChance ?? 0.15),
        (this.trail[r] = e.trail ?? 1),
        (this.rot[r] = F.range(0, 6)),
        (this.types[r] = e.type),
        (this.cls[r] = e.cls),
        (this.status[r] = e.status ?? null),
        (this.hitN[r] = 0),
        (this.fx[r] = e.fx ?? 0),
        (this.src[r] = e.from != null && e.from >= 0 ? Ef(this.run, e.from) : null),
        r
      );
    }
    enemyShot(e, t, n, r) {
      let i = this.run.enemies,
        a = i.typesOf(e)[0],
        o = i.y[e] + i.hgt[e] * 0.6;
      // Traversable props still provide cover below their tops, including
      // when the room server sends a shot along its horizontal path.
      const dx=t-i.x[e],dz=r-i.z[e],steps=Math.ceil(Math.hypot(dx,dz));
      for(let step=1;step<steps;step++){
        const u=step/steps;
        if(this.run.terrain.propTop(i.x[e]+dx*u,i.z[e]+dz*u,.2)>o+(n-o)*u)return;
      }
      (this.fire({
        x: i.x[e],
        y: o,
        z: i.z[e],
        dx: t - i.x[e],
        dy: n - o,
        dz: r - i.z[e],
        speed: 11,
        life: 3,
        radius: 0.45,
        dmg: i.dmg[e] * 0.75,
        type: a,
        cls: `special`,
        flags: 1 | (i.flags[e] & R.Alpha ? 2048 : 0),
        size: 0.9,
        shape: I.Soft,
        from: e,
      }),
        this.run.vfx.flash(i.x[e], o, i.z[e], Ni[a], 1.2, 0.12));
    }
    fromBody(e, t, n) {
      let r = this.run.enemies,
        i = this.run.player.pos,
        a = r.y[e] + Math.max(1.2, r.hgt[e] * 0.5),
        o = Math.max(4, Math.hypot(i.x - r.x[e], i.z - r.z[e]));
      return { y: a, dy: ((i.y + 0.8 - a) / o) * (Math.hypot(t, n) || 1) };
    }
    remove(e) {
      ((this.alive[e] = 0), this.free.push(e), this.used--);
      let t = this.slot[e];
      t >= 0 && t < 16 && this.perSlot[t]--;
    }
    clearHostile() {
      for (let e = 0; e < this.n; e++)
        this.alive[e] &&
          this.flags[e] & 1 &&
          (this.run.vfx.burst(this.x[e], this.y[e], this.z[e], this.color[e], 3, 2, I.Spark, 0.3, 0.2),
          this.remove(e));
    }
    impact(e) {
      (this.flags[e] & 16
        ? this.explode(e)
        : qp(this.fx[e]).hitCover
          ? qp(this.fx[e]).hit(this.run,this.x[e],this.y[e],this.z[e])
        : Jp(this.fx[e]) === 'ember'
          ? this.run.vfx.crafted.fireball.impact(this.x[e], this.y[e], this.z[e], !(this.flags[e] & 1))
          : this.run.vfx.burst(this.x[e], this.y[e], this.z[e], this.color[e], 5, 3, I.Spark, 0.35, 0.25),
        this.remove(e));
    }
    explode(e) {
      let t = this.run,
        n = this.explodeR[e],
        artRadius = this.explosionArtRadius[e],
        r = this.color[e],
        i = qp(this.fx[e]);
      (i.boom
        ? i.boom(t, this.x[e], this.y[e], this.z[e], n, r, artRadius)
        : (t.vfx.ring(this.x[e], t.terrain.height(this.x[e], this.z[e]), this.z[e], n, r, 0.4),
          t.vfx.flash(this.x[e], this.y[e], this.z[e], r, artRadius * 1.4, 0.18),
          t.vfx.burst(this.x[e], this.y[e], this.z[e], r, 14, n * 2.2, I.Soft, 0.7, 0.45)),
        t.shake(0.12, this.x[e], this.z[e]));
      for (let r of t.enemies.within(this.x[e], this.z[e], n, this.tmpBoom))
        t.combat.hit(r, this.dmg[e] * 0.85, {
          type: this.types[e],
          cls: this.cls[e],
          status: this.status[e],
          statusChance: this.statusChance[e],
          slot: this.slot[e],
          knock: this.knock[e] * 1.5,
        });
      const effect = Jp(this.fx[e]);
      t.audio.move(effect, `impact`) || t.audio.boom(Math.min(1, n / 6));
    }
    update(e) {
      try {
        this.step(e);
      } finally {
        Fl.leave();
      }
    }
    step(e) {
      let t = this.run,
        n = t.enemies,
        r = t.player,
        i = t.hideOwnFx,
        a = Zp,
        o = Math.min(1, e * Qp) * Math.min(1, $p / Math.max(1, this.ownShots)),
        s = 0;
      for (let c = 0; c < this.n; c++) {
        if (!this.alive[c]) continue;
        let l = this.flags[c];
        if ((l & 1 ? Fl.leave() : (Fl.enter(i), s++), (this.life[c] -= e), this.life[c] <= 0)) {
          (l & 16 && this.explode(c), this.remove(c));
          continue;
        }
        if (l & 2 && l & 1) {
          let t = r.pos.x - this.x[c],
            n = r.pos.y + 0.8 - this.y[c],
            i = r.pos.z - this.z[c],
            a = Math.hypot(t, n, i) || 1,
            o = this.speed[c],
            s = Math.min(1, e * 1.7);
          ((this.vx[c] += ((t / a) * o - this.vx[c]) * s),
            (this.vy[c] += ((n / a) * o * 0.4 - this.vy[c]) * s),
            (this.vz[c] += ((i / a) * o - this.vz[c]) * s));
        } else if (l & 2) {
          let t = this.target[c];
          if ((n.isAlive(t) || ((t = n.nearest(this.x[c], this.z[c], 25)), (this.target[c] = t)), t >= 0)) {
            let r = n.x[t] - this.x[c],
              i = n.y[t] + n.hgt[t] * 0.5 - this.y[c],
              a = n.z[t] - this.z[c],
              o = Math.hypot(r, i, a) || 1,
              s = this.speed[c],
              l = Math.min(1, e * 7);
            ((this.vx[c] += ((r / o) * s - this.vx[c]) * l),
              (this.vy[c] += ((i / o) * s - this.vy[c]) * l),
              (this.vz[c] += ((a / o) * s - this.vz[c]) * l));
          }
        }
        if (l & 4 && this.life[c] < this.maxLife[c] * 0.55) {
          let t = r.pos.x - this.x[c],
            n = r.pos.y + 1 - this.y[c],
            i = r.pos.z - this.z[c],
            a = Math.hypot(t, n, i) || 1,
            o = this.speed[c] * 1.2;
          if (
            ((this.vx[c] += ((t / a) * o - this.vx[c]) * Math.min(1, e * 6)),
            (this.vy[c] += ((n / a) * o - this.vy[c]) * Math.min(1, e * 6)),
            (this.vz[c] += ((i / a) * o - this.vz[c]) * Math.min(1, e * 6)),
            a < 1.2 || (Math.hypot(t, i) < 1.6 && Math.abs(n) < 4))
          ) {
            this.remove(c);
            continue;
          }
        }
        (l & 8 && (this.vy[c] -= 22 * e),
          l & 128 && ((this.vx[c] *= Math.exp(-e * 6)), (this.vz[c] *= Math.exp(-e * 6)), (this.vy[c] = 0)));
        let u = t.terrain.surface(this.x[c], this.z[c]);
        ((this.x[c] += this.vx[c] * e),
          (this.y[c] += this.vy[c] * e),
          (this.z[c] += this.vz[c] * e),
          (this.rot[c] += e * (l & 512 ? 14 : 3)));
        let d = t.terrain.surface(this.x[c], this.z[c]),
          f = !(l & 228);
        if (l & 128) this.y[c] = d + 0.35;
        else if (this.y[c] < d + 0.2) {
          if (l & 8 || l & 16) {
            (l & 16 && this.explode(c), this.remove(c));
            continue;
          }
          let t = Math.hypot(this.vx[c], this.vz[c]) * e;
          if (f && d - u > t * 0.8 + 0.05) {
            this.impact(c);
            continue;
          }
          l & 32 || (this.y[c] = d + 0.2);
        }
        if (f && t.terrain.hitProp(this.x[c], this.y[c], this.z[c], this.rad[c] * 0.5)) {
          this.impact(c);
          continue;
        }
        if (!t.terrain.inBounds(this.x[c], this.z[c], 0)) {
          this.remove(c);
          continue;
        }
        if (this.trail[c] > 0 && Math.random() < o * this.trail[c]) {
          let e = qp(this.fx[c]);
          e.trail
            ? e.trail(t, this.x[c], this.y[c], this.z[c], this.color[c], this.size[c])
            : t.vfx.trail(
                this.x[c],
                this.y[c],
                this.z[c],
                this.color[c],
                this.size[c] * 0.45,
                this.shape[c] === I.Flame ? I.Flame : I.Soft,
                0.25,
              );
        }
        if (l & 1) {
          let e = t.sanctuary;
          if (
            e &&
            (e.hitCover(this.x[c], this.y[c], this.z[c], this.rad[c]) ||
              t.terrain.height(this.x[c], this.z[c]) > this.y[c] + 0.4)
          ) {
            (t.vfx.burst(this.x[c], this.y[c], this.z[c], this.color[c], 4, 3, I.Spark, 0.35, 0.25),
              this.remove(c));
            continue;
          }
          let n = r.pos.x - this.x[c],
            i = r.pos.z - this.z[c],
            a = r.pos.y + 0.8 - this.y[c];
          if (n * n + i * i < (this.rad[c] + r.radius) ** 2 && Math.abs(a) < 1.5) {
            let e = Math.hypot(this.vx[c], this.vz[c]) || 1,
              n = this.vx[c] / e,
              i = this.vz[c] / e;
            const source = this.src[c];
            const lightShot = t.terrain.zxPaper && !(l & (1024 | 2048)) &&
              (source?.kind === 'common' || source?.kind === 'swarm' || source?.kind === 'stampede' || source?.kind === 'elite');
            (r.hurt(
              this.dmg[c],
              this.types[c],
              -1,
              r.pos.x - n * 3,
              r.pos.z - i * 3,
              !1,
              l & 1024 ? 0.15 : l & 2048 ? Tf(t) : 0,
              source ?? -1,
              l & 1024 ? { floor: 0.02 } : {},
            ) && !lightShot && r.shove(n, i, 3.5),
              t.vfx.burst(this.x[c], this.y[c], this.z[c], this.color[c], 8, 4),
              this.remove(c));
          }
          continue;
        }
        if (l & 64)
          for (let t of n.within(this.x[c], this.z[c], this.explodeR[c], this.tmpPull)) {
            let r = this.x[c] - n.x[t],
              i = this.z[c] - n.z[t],
              a = Math.hypot(r, i) || 1,
              o = n.flags[t] & 4 ? 0.5 : 9;
            ((n.kx[t] += (r / a) * o * e * 6), (n.kz[t] += (i / a) * o * e * 6));
          }
        let p = this.rad[c],
          m = n.within(this.x[c], this.z[c], p, this.tmpHit),
          h = 0;
        for (let e of m) {
          if (
            Math.abs(n.y[e] + n.hgt[e] * 0.5 - this.y[c]) > n.hgt[e] * 0.6 + p + 0.6 ||
            this.alreadyHit(c, e)
          )
            continue;
          if (l & 128) {
            (this.explode(c), this.remove(c));
            break;
          }
          if (a <= 0) break;
          (a--, this.markHit(c, e));
          let r = Math.hypot(this.vx[c], this.vz[c]) || 1;
          t.combat.hit(e, this.dmg[c], {
            type: this.types[c],
            cls: this.cls[c],
            status: this.status[c],
            statusChance: this.statusChance[c],
            slot: this.slot[c],
            knock: this.knock[c],
            dirX: this.vx[c] / r,
            dirZ: this.vz[c] / r,
            drain: this.drain[c],
          });
          let i = qp(this.fx[c]);
          if (++h <= 4) {
            if (i.hit) i.hit(t, this.x[c], this.y[c], this.z[c], this.color[c], e);
            else t.vfx.burst(this.x[c], this.y[c], this.z[c], this.color[c], 5, 4, I.Spark, 0.4, 0.25);
          }
          if (l & em.PassThroughEnemies) continue;
          if (l & em.Explode) {
            (this.explode(c), this.remove(c));
            break;
          }
          if (this.bounce[c] > 0) {
            this.bounce[c]--;
            let t = this.nextBounce(c, e);
            if (t >= 0) {
              let e = n.x[t] - this.x[c],
                r = n.z[t] - this.z[c],
                i = Math.hypot(e, r) || 1;
              ((this.vx[c] = (e / i) * this.speed[c]),
                (this.vz[c] = (r / i) * this.speed[c]),
                (this.life[c] = Math.max(this.life[c], 0.8)));
              continue;
            }
          }
          if (this.pierce[c] <= 0 && !(l & 100)) {
            this.remove(c);
            break;
          }
          this.pierce[c]--;
        }
      }
      this.ownShots = s;
    }
    nextBounce(e, t) {
      let n = this.run.enemies,
        r = -1,
        i = 196;
      for (let a of n.within(this.x[e], this.z[e], 14, this.tmpBounce)) {
        if (a === t || this.alreadyHit(e, a)) continue;
        let o = n.x[a] - this.x[e],
          s = n.z[a] - this.z[e],
          c = o * o + s * s;
        c < i && ((i = c), (r = a));
      }
      return r;
    }
    alreadyHit(e, t) {
      let n = this.hitN[e],
        r = e * 8;
      for (let e = 0; e < Math.min(n, 8); e++) if (this.hits[r + e] === t) return !0;
      return !1;
    }
    markHit(e, t) {
      ((this.hits[e * 8 + (this.hitN[e] % 8)] = t), this.hitN[e]++);
    }
    render() {
      (this.pool.begin(), this.glow.begin());
      this.run.vfx.crafted.windMoves?.render();
      this.run.vfx.crafted.windReplacements?.begin();
      this.run.vfx.crafted.windSkills?.begin();
      let e = this.run.vfx.ownOpacity,
        t = this.run.hideOwnFx;
      for (let n = 0; n < this.n; n++) {
        if (!this.alive[n] || (t && !(this.flags[n] & 1))) continue;
        if(!this.fx[n]&&!this.run.sprites.visible(this.x[n],this.y[n],this.z[n],Math.max(8,this.size[n]*2*VFX_SCALE)))continue;
        let r = !(this.flags[n] & 1);
        this.glow.fade = r ? e : 1;
        let i = r ? Math.min(this.size[n], im) : this.size[n],
          a = Math.min(1, this.life[n] * 4),
          o = this.fx[n] ? qp(this.fx[n]) : null;
        o?.draw
          ? ((this.glow.fade = 1), o.draw(this, n, i, r ? a * e : a, this.run))
          : !r && this.shape[n] === I.Soft
            ? (this.pool.push(this.x[n], this.y[n], this.z[n], i * 1.15, 2360850, I.Soft, 0, 0, 1),
              this.glow.push(this.x[n], this.y[n], this.z[n], i * 1.5, nm, I.Soft, 0, 0.3, 0.45 * a),
              this.glow.push(this.x[n], this.y[n], this.z[n], i * 0.42, rm, I.Soft, 0, 0.3, a))
            : (this.glow.push(
                this.x[n],
                this.y[n],
                this.z[n],
                i * 1.9,
                this.color[n],
                I.Soft,
                0,
                0.3,
                0.55 * a,
              ),
              this.shape[n] === I.Soft
                ? this.glow.push(this.x[n], this.y[n], this.z[n], i * 0.8, this.color[n], I.Soft, 0, 0.3, a)
                : this.shape[n] >= I.PixFlame
                  ? this.pool.push(
                      this.x[n],
                      this.y[n],
                      this.z[n],
                      i,
                      16777215,
                      this.shape[n],
                      this.rot[n],
                      0,
                      r ? e : 1,
                    )
                  : this.pool.push(
                      this.x[n],
                      this.y[n],
                      this.z[n],
                      i,
                      this.color[n],
                      this.shape[n],
                      this.rot[n],
                      0.25,
                      r ? e : 1,
                    ));
      }
      this.run.vfx.crafted.windReplacements?.end();
      this.run.vfx.crafted.windSkills?.end();
      (this.pool.end(), this.glow.end());
    }
    clear() {
      (this.alive.fill(0),
        (this.n = 0),
        (this.free.length = 0),
        (this.used = 0),
        this.perSlot.fill(0),
        this.pool.begin(),
        this.pool.end(),
        this.glow.begin(),
        this.glow.end());
    }
  },
  nm = 0xde2424,
  rm = 0xf2afa6,
  im = 7;
function am(e) {
  switch (e) {
    case `fire`:
      return I.Flame;
    case `water`:
      return I.Drop;
    case `grass`:
      return I.Leaf;
    case `electric`:
      return I.Bolt;
    case `ice`:
      return I.Flake;
    case `rock`:
    case `ground`:
    case `steel`:
      return I.Rock;
    case `fairy`:
      return I.Heart;
    case `poison`:
      return I.Bubble;
    case `ghost`:
      return I.Skull;
    case `psychic`:
      return I.Swirl;
    case `bug`:
      return I.Leaf;
    case `normal`:
      return I.Star;
    case `dark`:
      return I.Swirl;
    case `flying`:
      return I.Swirl;
    case `dragon`:
      return I.Star;
    default:
      return I.Soft;
  }
}
var om = (e) => 1 + 2.9 * (e - 1) ** 3 + 1.9 * (e - 1) ** 2,
  sm = (e) => (e >= 40 ? 16734858 : e >= 12 ? 11823871 : e >= 4 ? 4901119 : 5959562),
  activePickupKinds = new Set(['xp', 'coin', 'heal', 'magnet', 'repel', 'candy']),
  cm = 2500,
  lm = [
    `xp`,
    `coin`,
    `heal`,
    `magnet`,
    `bomb`,
    `repel`,
    `candy`,
    `chestkey`,
    `tm-swords`,
    `tm-agility`,
    `tm-iron`,
    `tm-thunder`,
    `tm-payday`,
  ],
  um = {
    2: { shape: I.ItemBerry, col: 5945599, pillar: 0 },
    3: { shape: I.ItemMagnet, col: 16734810, pillar: 2.6 },
    4: { shape: I.ItemVoltorb, col: 16747066, pillar: 2.6 },
    5: { shape: I.ItemRepel, col: 11569919, pillar: 2.6 },
    6: { shape: I.ItemCandy, col: 6998271, pillar: 5 },
    7: { shape: I.PixKey, col: 16765498, pillar: 3.5 },
    8: { shape: I.ItemTmSwords, col: rf[`tm-swords`].col, pillar: 3.5 },
    9: { shape: I.ItemTmAgility, col: rf[`tm-agility`].col, pillar: 3.5 },
    10: { shape: I.ItemTmIron, col: rf[`tm-iron`].col, pillar: 3.5 },
    11: { shape: I.ItemTmThunder, col: rf[`tm-thunder`].col, pillar: 3.5 },
    12: { shape: I.ItemTmPayday, col: rf[`tm-payday`].col, pillar: 3.5 },
  },
  dm = 60,
  fm = 120,
  pm = 8,
  mm = (e) => (e === 2 ? dm : e >= 3 && e <= 5 ? fm : 1 / 0),
  hm = [I.PixCoin, I.PixCoinMid, I.PixCoinEdge, I.PixCoinMid],
  gm = class {
    run;
    n = 0;
    alive = new Uint8Array(cm);
    kind = new Uint8Array(cm);
    x = new Float32Array(cm);
    y = new Float32Array(cm);
    z = new Float32Array(cm);
    vx = new Float32Array(cm);
    vy = new Float32Array(cm);
    vz = new Float32Array(cm);
    value = new Float32Array(cm);
    attract = new Uint8Array(cm);
    attractTime = new Float32Array(cm);
    age = new Float32Array(cm);
    free = [];
    rest = new Uint8Array(cm);
    count = 0;
    trailBudget = 0;
    burstBudget = 0;
    mergeT = 0;
    pool;
    glow;
    magnetAll = 0;
    xpChain = 0;
    xpChainT = 0;
    coinSum = 0;
    coinT = 0;
    constructor(e) {
      ((this.run = e),
        (this.pool = new ql(e.r.scene, e.vfx.atlas, cm, !1, e.r.shared, 1)),
        (this.glow = new ql(e.r.scene, e.vfx.atlas, cm, !0, e.r.shared)));
      const world='iA.xyz + vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0])*p2.x + vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1])*p2.y';
      for(const pool of [this.pool,this.glow]){
        applyShelfMaterial(pool.mesh.material,e.sprites.shelfUniforms,world,'iA.xyz');
      }
    }
    spawnXp(e, t, n, r) {
      this.spawnMerged(0, e, t, n, r);
    }
    spawnCoin(e, t, n, r) {
      this.spawnMerged(1, e, t, n, r);
    }
    attractNearbyXp(radius) {
      const player = this.run.player.pos;
      for (let i = 0; i < this.n; i++) {
        if (!this.alive[i] || this.kind[i] !== 0 || this.attract[i]) continue;
        if ((this.x[i] - player.x) ** 2 + (this.z[i] - player.z) ** 2 > radius * radius) continue;
        this.rest[i] = 0;
        this.attract[i] = 1;
      }
    }
    spawnMerged(e, t, n, r, i) {
      if (this.count > (e === 0 ? this.run.performance.mergeXp*2 : this.run.performance.mergeCoins*2)) {
        let a = this.run.player.pos,
          o = -1,
          s = 16,
          c = -1,
          l = -1;
        for (let n = 0; n < 48; n++) {
          let n = (Math.random() * this.n) | 0;
          if (!this.alive[n] || this.kind[n] !== e || this.attract[n]) continue;
          let i = (this.x[n] - t) ** 2 + (this.z[n] - r) ** 2;
          i < s && ((s = i), (o = n));
          let u = (this.x[n] - a.x) ** 2 + (this.z[n] - a.z) ** 2;
          u > l && ((l = u), (c = n));
        }
        if (o >= 0) {
          this.value[o] += i;
          return;
        }
        if (c >= 0 && (this.count > 1800 || l > 3600)) {
          ((this.x[c] = t),
            (this.y[c] = n + 0.6),
            (this.z[c] = r),
            (this.vx[c] = this.vz[c] = 0),
            (this.vy[c] = 4),
            (this.age[c] = 0),
            (this.rest[c] = 0),
            (this.value[c] += i));
          return;
        }
      }
      this.spawn(e === 0 ? `xp` : `coin`, t, n, r, i);
    }
    spawn(e, t, n, r, i) {
      if (!activePickupKinds.has(e)) return;
      let a;
      if (this.free.length) a = this.free.pop();
      else if (this.n < cm) a = this.n++;
      else return;
      ((this.alive[a] = 1),
        (this.kind[a] = lm.indexOf(e)),
        (this.x[a] = t),
        (this.y[a] = n + 0.6),
        (this.z[a] = r));
      let o = F.range(0, Math.PI * 2),
        s = F.range(1, 3.5);
      ((this.vx[a] = Math.cos(o) * s),
        (this.vz[a] = Math.sin(o) * s),
        (this.vy[a] = F.range(4, 7)),
        (this.value[a] = i),
        (this.attract[a] = 0),
        (this.attractTime[a] = 0),
        (this.age[a] = 0),
        (this.rest[a] = 0),
        this.count++);
    }
    update(e) {
      let t = this.run,
        n = t.player,
        r = pickupRadius(n.stats.pickupRange),
        i = !!t.meta.profile.settings.calmCandies,
        a = t.performance.pickupSimple||t.meta.profile.settings.pickupFx === `simple`;
      ((this.trailBudget = a ? 0 : 24),
        (this.burstBudget = a ? 3 : 10),
        (this.mergeT -= e) <= 0 && ((this.mergeT = t.performance.mergeInterval), this.count > t.performance.mergeXp && this.consolidate()));
      let o = r * r;
      (this.magnetAll > 0 && (this.magnetAll -= e),
        (this.xpChainT -= e) <= 0 && (this.xpChain = 0),
        this.coinSum > 0 &&
          (this.coinT -= e) <= 0 &&
          (t.vfx.text.spawn(n.pos.x, n.pos.y + 2.4, n.pos.z, `+` + this.coinSum + `₽`, 16765498, 0.6),
          (this.coinSum = 0)));
      for (let a = 0; a < this.n; a++) {
        if (!this.alive[a]) continue;
        if (((this.age[a] += e), this.kind[a] >= 2 && this.age[a] > mm(this.kind[a]) && !this.attract[a])) {
          ((this.alive[a] = 0), this.free.push(a), this.count--);
          continue;
        }
        if (this.rest[a]) {
          let e = n.pos.x - this.x[a],
            t = n.pos.y + 0.7 - this.y[a],
            r = n.pos.z - this.z[a];
          if (
            this.age[a] <= 0.18 ||
            (!inPickupRange(e,t,r,Math.sqrt(o)) && !(this.magnetAll > 0 && this.kind[a] <= 1))
          )
            continue;
          this.rest[a] = 0;
        }
        let s = n.pos.x - this.x[a],
          c = n.pos.y + 0.7 - this.y[a],
          l = n.pos.z - this.z[a],
          u = Math.hypot(s, c, l),
          d = this.kind[a];
        if (
          (!this.attract[a] &&
            this.age[a] > 0.18 &&
            (inPickupRange(s,c,l,r) || (this.magnetAll > 0 && d <= 1)) &&
            (this.attract[a] = 1),
          this.attract[a])
        ) {
          this.attractTime[a]+=e;
          const speed=pickupSpeed(this.attractTime[a],n.speedNow);
          if(pickupArrived(u,speed,e)){this.collect(a);continue;}
          this.vx[a]=s/u*speed;this.vy[a]=c/u*speed;this.vz[a]=l/u*speed;
          this.trailBudget <= 0 ||
            (d === 0 && !i && Math.random() < 0.3
              ? (this.trailBudget--,
                t.vfx.trail(
                  this.x[a],
                  this.y[a],
                  this.z[a],
                  sm(this.value[a]),
                  0.32 + Math.min(0.3, this.value[a] * 0.01),
                  I.Twinkle,
                  0.25,
                ))
              : d === 1 &&
                Math.random() < 0.35 &&
                (this.trailBudget--,
                t.vfx.trail(this.x[a], this.y[a], this.z[a], 16762938, 0.3, I.Twinkle, 0.22)));
        } else ((this.vy[a] -= 20 * e), (this.vx[a] *= Math.exp(-e * 3)), (this.vz[a] *= Math.exp(-e * 3)));
        ((this.x[a] += this.vx[a] * e), (this.y[a] += this.vy[a] * e), (this.z[a] += this.vz[a] * e));
        let f = t.terrain.surface(this.x[a], this.z[a]) + 0.45;
        !this.attract[a] &&
          this.y[a] < f &&
          (d > 0 &&
            this.vy[a] < -4 &&
            (t.vfx.dust(this.x[a], f - 0.45, this.z[a], 15260864, d === 1 ? 2 : 5, 1.6),
            d > 1 && t.vfx.burst(this.x[a], f + 0.3, this.z[a], um[d].col, 5, 2.5, I.Twinkle, 0.35, 0.4)),
          (this.y[a] = f),
          (this.vy[a] = Math.abs(this.vy[a]) * 0.3),
          this.vy[a] < 1 &&
            this.vx[a] * this.vx[a] + this.vz[a] * this.vz[a] < 0.04 &&
            ((this.vx[a] = this.vy[a] = this.vz[a] = 0), (this.rest[a] = 1)));
      }
    }
    collect(e) {
      if(!this.alive[e])return;
      if (
        globalThis.__pbCoop &&
        __pbCoop.pickupCollected &&
        __pbCoop.pickupCollected(this.run, this, e) === false
      )
        return;
      let t = this.run,
        n = t.player;
      ((this.alive[e] = 0), this.free.push(e), this.count--);
      let r = this.value[e];
      switch (lm[this.kind[e]]) {
        case `xp`: {
          (n.addXp(r), this.xpChain++, (this.xpChainT = 0.45), t.audio.xp(this.xpChain));
          let e = sm(r),
            i = t.meta.profile.settings,
            a = r >= 12 || (i.pickupFx !== `simple` && this.burstBudget-- > 0);
          (a &&
            (r >= 12 || !i.calmCandies) &&
            t.vfx.burst(
              n.pos.x,
              n.pos.y + 1,
              n.pos.z,
              e,
              r >= 12 ? 8 : 3,
              r >= 12 ? 5 : 3,
              I.Twinkle,
              r >= 12 ? 0.5 : 0.32,
              0.3,
            ),
            (r >= 12 || (a && this.xpChain % 6 == 0 && !i.calmCandies)) &&
              t.vfx.ring(n.pos.x, n.pos.y, n.pos.z, r >= 40 ? 3 : 1.8, e, 0.3, 0.4),
            t.ui.xpGain?.(r >= 12));
          break;
        }
        case `coin`:
          (t.addGold(r),
            t.audio.coin(),
            (this.coinSum += Math.round(r)),
            (this.coinT = 0.4),
            t.meta.profile.settings.pickupFx !== `simple` &&
              this.burstBudget-- > 0 &&
              t.vfx.burst(n.pos.x, n.pos.y + 1.1, n.pos.z, 16762938, 3, 3, I.Twinkle, 0.32, 0.3));
          break;
        case `heal`:
          (t.meta.count(`berries`, 1),
            n.heal(n.maxHp * 0.25),
            t.vfx.burst(n.pos.x, n.pos.y + 1, n.pos.z, 5963658, 12, 3, I.Heart, 0.5),
            t.audio.heal());
          break;
        case `magnet`:
          ((this.magnetAll = 4 * n.stats.powerup),
            t.ui.toast(c(`¡Imán! Atraes todos los caramelos`), `magnet`),
            t.audio.power());
          break;
        case `bomb`:
          t.nuke();
          break;
        case `repel`:
          t.repel();
          break;
        case `candy`:
          (n.gainLevel(), t.ui.toast(c(`¡Caramelo Raro! Subes de nivel`), `rare-candy`), t.audio.power());
          break;
        case `chestkey`:
          (t.keys++, t.audio.power());
          break;
        case `tm-swords`:
        case `tm-agility`:
        case `tm-iron`:
        case `tm-thunder`:
        case `tm-payday`:
          lf(t, lm[this.kind[e]]);
      }
      let i = um[this.kind[e]];
      i &&
        (t.vfx.flash(n.pos.x, n.pos.y + 1, n.pos.z, i.col, 2.6, 0.2),
        t.vfx.ring(n.pos.x, n.pos.y, n.pos.z, 3.2, i.col, 0.45),
        t.vfx.burst(n.pos.x, n.pos.y + 1.2, n.pos.z, i.col, 14, 5, I.Twinkle, 0.45, 0.55, 6));
    }
    render(e) {
      (this.pool.begin(), this.glow.begin());
      let t = (2 + this.run.stage * 2) * this.run.player.stats.gold,
        n = !!this.run.meta.profile.settings.calmCandies,
        r = n || this.run.performance.pickupSimple || this.run.meta.profile.settings.pickupFx === `simple` || this.count > 400,
        i = this.run.player.pos.x,
        a = this.run.player.pos.z;
      for (let o = 0; o < this.n; o++) {
        if (!this.alive[o]) continue;
        if(!this.run.sprites.visible(this.x[o],this.y[o]+2,this.z[o],8))continue;
        let s = lm[this.kind[o]];
        if (this.kind[o] <= 1) {
          let e = this.x[o] - i,
            t = this.z[o] - a;
          if (e * e + t * t > 1e4) continue;
        }
        if (this.kind[o] >= 2 && !this.attract[o]) {
          if (mm(this.kind[o]) - this.age[o] < pm && Math.floor(e * 8) % 2 == 0) continue;
          let t = this.x[o] - i,
            n = this.z[o] - a;
          if (t * t + n * n > 1e4) continue;
        }
        let c = Math.sin(e * 4 + o) * 0.12,
          l = this.y[o] + c;
        if (s === `xp`) {
          let t = this.value[o],
            i = this.age[o],
            a = sm(t),
            s = t >= 40 ? 3 : t >= 12 ? 2 : +(t >= 4),
            c = i < 0.32 ? 0.35 + 0.65 * om(i / 0.32) : 1,
            u =
              [0.62, 0.78, 0.98, 1.25][s] *
              c *
              (n ? 0.6 : 1) *
              (1 + Math.sin(e * 5 + o * 1.3) * (n ? 0 : 0.06)),
            d = l + 0.12 + s * 0.08,
            f = Math.sin(e * 2.6 + o) * 0.28;
          if ((this.pool.push(this.x[o], d, this.z[o], u, a, I.Gem, f, 0.25), r)) {
            s >= 2 && this.glow.push(this.x[o], d, this.z[o], u * 1.8, a, I.Soft, 0, 0.3, 0.2);
            continue;
          }
          this.glow.push(
            this.x[o],
            d,
            this.z[o],
            u * (2.1 + s * 0.3),
            a,
            I.Soft,
            0,
            0.3,
            0.35 + 0.15 * Math.sin(e * 4 + o),
          );
          let p = Math.max(0, Math.sin(e * (1.6 + s * 0.5) + o * 2.17)) ** 14;
          if (
            (p > 0.05 &&
              this.glow.push(
                this.x[o] - u * 0.18,
                d + u * 0.22,
                this.z[o],
                u * 1.1 * p,
                16777215,
                I.Twinkle,
                e,
                0.6,
                p,
              ),
            !this.attract[o])
          ) {
            let e = this.x[o] - this.run.player.pos.x,
              t = this.z[o] - this.run.player.pos.z;
            e * e + t * t < 1600 &&
              this.run.sprites.shadows.push(
                this.x[o],
                this.run.terrain.surface(this.x[o], this.z[o]),
                this.z[o],
                u * 0.9,
              );
          }
        } else if (s === `coin`) {
          let n = this.value[o],
            i = n >= t * 3.5 ? 2 : +(n >= t * 1.5),
            a = l + 0.12;
          if (i) {
            let t = i === 2 ? 1 : 0.82;
            (this.pool.push(
              this.x[o],
              a,
              this.z[o],
              t,
              16777215,
              i === 2 ? I.ItemBigNugget : I.ItemNugget,
              Math.sin(e * 2.4 + o) * 0.18,
              0.4,
            ),
              this.glow.push(
                this.x[o],
                a,
                this.z[o],
                t * 2,
                16756768,
                I.Soft,
                0,
                0.3,
                0.3 + 0.12 * Math.sin(e * 4 + o),
              ));
          } else
            (this.pool.push(
              this.x[o],
              a,
              this.z[o],
              0.62,
              16777215,
              hm[Math.floor(e * 9 + o * 1.7) & 3],
              0,
              0.35,
            ),
              r || this.glow.push(this.x[o], a, this.z[o], 1.15, 16756768, I.Soft, 0, 0.3, 0.22));
          let s = r ? 0 : Math.max(0, Math.sin(e * 1.9 + o * 2.31)) ** 16;
          (s > 0.05 &&
            this.glow.push(this.x[o] - 0.12, a + 0.16, this.z[o], 0.7 * s, 16777215, I.Twinkle, e, 0.6, s),
            !r&&this.shadow(o, 0.45 + i * 0.12));
        } else {
          let t = um[this.kind[o]],
            n = this.age[o],
            r = n < 0.4 ? 0.3 + 0.7 * om(n / 0.4) : 1,
            i = l + 0.45,
            a = (s === `candy` ? 1.5 : 1.3) * r * (1 + Math.sin(e * 3 + o) * 0.04);
          (this.pool.push(this.x[o], i, this.z[o], a, 16777215, t.shape, Math.sin(e * 2.2 + o) * 0.14, 0.45),
            this.glow.push(
              this.x[o],
              i,
              this.z[o],
              a * 2.4,
              t.col,
              I.Soft,
              0,
              0.3,
              0.4 + 0.15 * Math.sin(e * 4 + o),
            ));
          for (let n = 0; n < (this.run.performance.pickupSimple?0:2); n++) {
            let r = e * 2.4 + n * Math.PI + o,
              s = 0.62 * a,
              c = 0.6 + 0.4 * Math.sin(e * 7 + n * 2 + o);
            this.glow.push(
              this.x[o] + Math.cos(r) * s,
              i + Math.sin(e * 1.7 + n * 3) * 0.3,
              this.z[o] + Math.sin(r) * s,
              0.36 * c,
              t.col,
              I.Twinkle,
              e * 3,
              0.5,
              c,
            );
          }
          if (t.pillar && !this.attract[o]&&!this.run.performance.pickupSimple) {
            let n = this.run.terrain.surface(this.x[o], this.z[o]);
            this.run.vfx.beams.spawn(
              this.x[o],
              n,
              this.z[o],
              this.x[o],
              n + t.pillar,
              this.z[o],
              0.32,
              t.col,
              0.05,
              0.16 + 0.05 * Math.sin(e * 3 + o),
            );
          }
          if(!this.run.performance.pickupSimple)this.shadow(o, 0.6 * a);
        }
      }
      (this.pool.end(), this.glow.end());
    }
    shadow(e, t) {
      if (this.attract[e]) return;
      let n = this.run.player.pos,
        r = this.x[e] - n.x,
        i = this.z[e] - n.z;
      r * r + i * i < 1600 &&
        this.run.sprites.shadows.push(
          this.x[e],
          this.run.terrain.surface(this.x[e], this.z[e]),
          this.z[e],
          t,
        );
    }
    consolidate() {
      let e = 0,
        t = 0;
      for (let n = 0; n < this.n; n++)
        this.alive[n] && !this.attract[n] && (this.kind[n] === 0 ? e++ : this.kind[n] === 1 && t++);
      let n = e > this.run.performance.mergeXp,
        r = t > this.run.performance.mergeCoins;
      if (!n && !r) return;
      let i = new Map();
      for (let e = 0; e < this.n; e++) {
        let t = this.kind[e];
        if (!this.alive[e] || this.attract[e] || this.age[e] < 1 || t > 1 || !(t === 0 ? n : r)) continue;
        let a = t + 2 * ((Math.floor(this.x[e] / 3.5) + 4096) * 8192 + Math.floor(this.z[e] / 3.5) + 4096),
          o = i.get(a);
        o === void 0
          ? i.set(a, e)
          : ((this.value[o] += this.value[e]), (this.alive[e] = 0), this.free.push(e), this.count--);
      }
    }
    clear() {
      (this.rest.fill(0),
        this.alive.fill(0),
        (this.n = 0),
        (this.free.length = 0),
        (this.count = 0),
        (this.coinSum = 0));
    }
  },
  _m = 0.6,
  vm = 1.2,
  ym = 1.65,
  bm = 2,
  xm = 0.85,
  Sm = 0.5,
  Cm = 4.55,
  wm = 1.15,
  Tm = 0.75,
  Em = (e) => e * e * (3 - 2 * e);
function Dm(e, t) {
  e.getObjectByName(`Lid`)?.traverse((e) => {
    let n = e,
      r = n.material;
    if (!n.isMesh || !r?.map || r.emissiveIntensity) return;
    let i = r.map.image,
      a = document.createElement(`canvas`);
    ((a.width = i.width), (a.height = i.height));
    let o = a.getContext(`2d`);
    if (!o) return;
    o.drawImage(i, 0, 0);
    let s;
    try {
      s = o.getImageData(0, 0, a.width, a.height);
    } catch {
      return;
    }
    let c = s.data;
    for (let e = 0; e < c.length; e += 4) {
      let n = c[e],
        r = c[e + 1],
        i = c[e + 2];
      t === `friend` ? ((c[e] = r), (c[e + 1] = n)) : ((c[e] = (n + i) >> 1), (c[e + 2] = n));
    }
    o.putImageData(s, 0, 0);
    let l = new Wr(a);
    ((l.flipY = r.map.flipY), (l.colorSpace = r.map.colorSpace), (l.magFilter = zr), (l.minFilter = Rr));
    let u = r.clone();
    ((u.map = l), (n.material = u));
  });
}
var Om = class {
    run;
    friend;
    active = !1;
    index = -1;
    t = 0;
    shakes = 0;
    breakAt = 0;
    ended = -1;
    scale0 = 1;
    x0 = 0;
    y0 = 0;
    z0 = 0;
    bx = 0;
    by = 0;
    bz = 0;
    hx = 0;
    hy = 0;
    hz = 0;
    gy = 0;
    landed = !1;
    ball = null;
    plain = null;
    master = null;
    onCaught = () => {};
    onBreak = () => {};
    constructor(e, t = !1) {
      ((this.run = e), (this.friend = t));
      this.plain=createCaptureGourd(t?'#73ad70':'#d99a38');
      this.master=createCaptureGourd('#a878ce');
      for(const gourd of [this.plain,this.master]){gourd.visible=false;e.r.scene.add(gourd);}
      this.ball=this.plain;
    }
    start(e, t, n, r, i = !1) {
      let a = this.run,
        o = a.enemies,
        s = a.player.pos;
      ((this.active = !0),
        (this.index = e),
        (this.ball = (i && this.master) || this.plain),
        (this.breakAt = t ? 0 : 1 + Math.floor(Math.random() * 3)),
        (this.t = 0),
        (this.shakes = 0),
        (this.ended = -1),
        (this.landed = !1),
        (this.scale0 = o.scale[e]),
        (this.x0 = o.x[e]),
        (this.y0 = o.y[e]),
        (this.z0 = o.z[e]),
        (this.bx = s.x),
        (this.by = s.y + 1.5),
        (this.bz = s.z));
      let c = s.x - this.x0,
        l = s.z - this.z0,
        u = Math.hypot(c, l) || 1,
        d = Math.min(u * 0.5, 1.1 + o.radius[e] * 0.6);
      ((this.hx = s.x + (c / u) * .9),
        (this.hz = s.z + (l / u) * .9),
        (this.gy = a.terrain.surface(this.hx, this.hz)),
        (this.hy = Math.max(this.gy + 1.4, this.y0 + o.hgt[e] * 0.6 + 0.6)),
        (this.onCaught = n),
        (this.onBreak = r),
        a.audio.ballOpen(),
        a.beginCapture(this, e, o.species[e], (o.flags[e] & R.Shiny) !== 0, i, this.hx, this.hz, this.friend),
        a.captureCam(this.hx, this.gy, this.hz));
    }
    update(e) {
      if (!this.active) return;
      let t = this.run,
        n = t.enemies,
        r = this.index,
        i = t.vfx,
        a = this.friend ? 5234810 : 16734810,
        o = this.t;
      this.t += e;
      let s = this.t,
        c = (e) => o < e && s >= e,
        l = this.hx,
        u = this.hy,
        d = this.hz,
        f = 0,
        p = 0,
        m = 0;
      if (s < _m) {
        u=this.hy;
        i.ring(l,u+.3,d,.5+s,0xffdc83,.15,.15);
      } else if (s < vm) {
        let e = (s - _m) / 0.6,
          o = Em(Math.min(1, e * 1.25));
        ((u = this.hy + Math.sin(e * Math.PI) * 0.25),
          (m = e < 0.15 ? e / 0.15 : e > 0.85 ? (1 - e) / 0.15 : 1),
          c(_m) && (t.audio.ballOpen(), i.flash(l, u, d, this.friend ? 8056992 : 16738922, 2.2, 0.18)),
          (n.flash[r] = 1),
          (n.scale[r] = Math.max(0.01, this.scale0 * (1 - o))),
          (n.x[r] = this.x0 + (this.hx - this.x0) * o),
          (n.z[r] = this.z0 + (this.hz - this.z0) * o),
        (n.y[r] = this.y0 + (this.hy + .15 - this.y0) * o),
          e < 0.85 && i.add.spawn({x:n.x[r],y:n.y[r]+.6,z:n.z[r],
            vx:(l-n.x[r])*5,vy:(u+.4-n.y[r])*5,vz:(d-n.z[r])*5,
            life:.2,size:.22,endSize:0,color:0xffdc83,shape:I.Spark,glow:.6}),
          e < 0.85 &&
            i.beams.spawn(
              l,
              u + 0.15,
              d,
              n.x[r],
              n.y[r] + n.hgt[r] * (1 - o) * 0.5,
              n.z[r],
              0.35 + 0.25 * Math.sin(s * 40),
              a,
              0.05,
            ));
      } else if (s < ym) {
        n.scale[r] = 0.01;
        u=this.hy;
      } else if (this.ended < 0) {
        u = this.hy;
        for (let e = 0; e < 3; e++) {
          let n = bm + e * xm;
          if (
            (c(n) &&
              ((this.shakes = e + 1),
              t.audio.ballShake(),
              t.ui.captureShake(this.shakes),
              t.captureZoom(2.5 - this.shakes * 0.18)),
            s >= n && s < n + Sm)
          ) {
            let t = (s - n) / Sm;
            ((p = Math.sin(t * Math.PI * 3) * 0.5 * (1 - t * 0.5) * (e % 2 ? -1 : 1)),
              Math.random() < 0.25 && i.trail(l, u + 0.5, d, 16777215, 0.25, I.Star, 0.3));
          }
          if (this.breakAt === e + 1 && s >= n + Sm + 0.12) {
            this.breakOut();
            break;
          }
        }
        this.ended < 0 && this.breakAt === 0 && s >= Cm && this.click();
      } else {
        u = this.hy;
        let e = this.breakAt ? Tm : wm;
        if (this.breakAt) {
          let e = Math.min(1, (s - this.ended) / 0.3);
          n.scale[r] = this.scale0 * (1 + Math.sin(e * Math.PI) * 0.25) * Math.max(0.01, e);
        }
        if (s - this.ended >= e) {
          this.finish();
          return;
        }
      }
      t.captureFocus(Math.min(u, this.hy) + 0.1, e);
      let h = this.ball;
      if (h) {
        ((h.visible = this.ended < 0 || !this.breakAt), h.position.set(l, u - 1.37, d));
        let e = t.r.camera.position;
        h.rotation.set(f, s < _m ? 0 : Math.atan2(e.x - l, e.z - d), p);
        let n = h.getObjectByName(`Lid`);
        n && (n.rotation.x = -1.4 * m);
      } else
        (this.ended < 0 || !this.breakAt) &&
          t.orbitals.push(l, u + 0.3, d, 0.8, this.friend ? 3852378 : 16726586, I.Soft, p, 0.2);
      (this.ended < 0 || !this.breakAt) &&
        t.orbitalsGlow.push(l, u + 0.3, d, 1.2, 16777215, I.Soft, 0, 0.2, 0.3);
    }
    click() {
      let e = this.run,
        t = e.vfx,
        n = this.hx,
        r = this.hy + 0.5,
        i = this.hz;
      ((this.ended = this.t), e.audio.ballClick(), t.flash(n, r, i, 16774064, 2.4, 0.2));
      for (let e = 0; e < 3; e++) {
        let a = -0.9 + e * 0.9;
        t.add.spawn({
          x: n,
          y: r,
          z: i,
          vx: Math.sin(a) * 2.2,
          vy: 5.5 + (e === 1 ? 0.8 : 0),
          vz: Math.cos(a) * 0.6,
          gravity: 9,
          drag: 0.6,
          life: 0.95,
          size: 0.75,
          endSize: 0.35,
          color: 16773754,
          shape: I.Star,
          glow: 1,
          spin: 4,
        });
      }
      e.ui.captureResult(!0);
    }
    breakOut() {
      let e = this.run,
        t = e.enemies,
        n = this.index,
        r = e.vfx;
      ((this.ended = this.t),
        (t.flash[n] = 0),
        (t.x[n] = this.x0),
        (t.y[n] = this.y0),
        (t.z[n] = this.z0),
        r.flash(this.hx, this.hy + 0.5, this.hz, 16777215, 3, 0.2),
        r.burst(this.hx, this.hy + 0.5, this.hz, this.friend ? 8056992 : 16738922, 12, 5, I.Star, 0.45, 0.5),
        e.audio.ballOpen(),
        e.ui.captureResult(!1));
    }
    finish() {
      let e = this.run,
        t = e.enemies,
        n = this.index;
      if (((this.active = !1), this.breakAt))
        ((t.scale[n] = this.scale0),
          this.ball && (this.ball.visible = !1),
          e.endCapture(0.1),
          this.onBreak());
      else {
        if (this.ball) {
          let t = this.ball;
          e.later(0.5, () => {
            ((t.visible = !1),
              e.vfx.burst(this.hx, this.gy + 0.4, this.hz, 16777215, 8, 3, I.Twinkle, 0.4, 0.4));
          });
        }
        (e.endCapture(0.45), this.onCaught());
      }
    }
    disposed = !1;
    dispose() {
      this.disposed = !0;
      for (const gourd of [this.plain,this.master]) { gourd?.parent?.remove(gourd); gourd?.traverse(mesh=>{mesh.geometry?.dispose();mesh.material?.dispose();}); }
      ((this.ball = this.plain = this.master = null), (this.active = !1));
    }
  },
  km = [25, 75, 150, 300, 500],
  Am = 1.2,
  jm = {
    normal: { label: c(`+10 % Pokédólares`), mods: [{ stat: `gold`, mul: 1.1 }] },
    fire: { label: c(`+15 % daño de estado`), mods: [{ stat: `statusDamage`, mul: 1.15 }] },
    water: { label: c(`+15 % curación`), mods: [{ stat: `healing`, mul: 1.15 }] },
    grass: { label: c(`+0,5 PS/s de regeneración`), mods: [{ stat: `regen`, add: 0.5 }] },
    electric: { label: c(`+5 % vel. de ataque`), mods: [{ stat: `attackSpeed`, mul: 1.05 }] },
    ice: { label: c(`+10 % duración`), mods: [{ stat: `duration`, mul: 1.1 }] },
    fighting: { label: c(`+10 % daño a élites`), mods: [{ stat: `eliteDamage`, mul: 1.1 }] },
    poison: { label: c(`+12 % prob. de estado`), mods: [{ stat: `statusChance`, mul: 1.12 }] },
    ground: { label: c(`+4 armadura`), mods: [{ stat: `armor`, add: 4 }] },
    flying: { label: c(`+5 % velocidad`), mods: [{ stat: `moveSpeed`, mul: 1.05 }] },
    psychic: { label: c(`+8 % experiencia`), mods: [{ stat: `xpGain`, mul: 1.08 }] },
    bug: { label: c(`+1 rango de recogida`), mods: [{ stat: `pickupRange`, add: 1 }] },
    rock: { label: c(`+15 PS máx.`), mods: [{ stat: `maxHp`, add: 15 }] },
    ghost: { label: c(`+3 % evasión`), mods: [{ stat: `evasion`, add: 0.03 }] },
    dragon: { label: c(`+5 % daño`), mods: [{ stat: `damage`, mul: 1.05 }] },
    dark: { label: c(`+4 % prob. de crítico`), mods: [{ stat: `critChance`, add: 0.04 }] },
    steel: { label: c(`+8 % área`), mods: [{ stat: `area`, mul: 1.08 }] },
    fairy: { label: c(`+8 suerte`), mods: [{ stat: `luck`, add: 8 }] },
  };
function Mm(e, t = !1, n = 1) {
  let r = jm[e]?.mods ?? [],
    i = (t ? 2 : 1) * n;
  return i === 1
    ? r
    : r.map((e) => ({
        stat: e.stat,
        add: e.add === void 0 ? void 0 : e.add * i,
        mul: e.mul === void 0 ? void 0 : 1 + (e.mul - 1) * i,
      }));
}
function Nm(e, t = !1, r = 1) {
  let i = jm[e].label,
    a = (t ? 2 : 1) * r;
  return a === 1
    ? i
    : i.replace(/(\d+(?:[.,]\d+)?)/, (e) => {
        let t = parseFloat(e.replace(`,`, `.`)) * a;
        return n(t, t % 1 ? 1 : 0);
      });
}
var Pm = class {
    run;
    list = [];
    down = -1;
    downT = 0;
    state = `idle`;
    gen = 0;
    attempts = new Map();
    releasing = -1;
    ball;
    serial = 0;
    tmp = [];
    constructor(e) {
      ((this.run = e), (this.ball = new Om(e, !0)));
    }
    get cap() {
      return this.run.meta.partySize() + (this.run.player.items.get(`ss-ticket`) ?? 0);
    }
    get team() {
      return this.list.filter((e) => !e.shiny);
    }
    get shinyAlly() {
      return this.list.find((e) => e.shiny) ?? null;
    }
    power(e) {
      let t = this.run.player.level,
        n = Math.min(3, this.run.stage),
        r = 1 + 0.25 * (this.run.player.items.get(`lemonade`) ?? 0);
      return (
        (12 + 1.1 * t) *
        (0.75 + e.bst / 800) *
        (1 + 0.25 * (n - 1)) *
        (1 + 0.1 * e.bond) *
        (e.shiny ? Am : 1) *
        r
      );
    }
    cooldown(e) {
      return (
        (e.physical ? 1.8 : 1.6) /
        Math.sqrt(this.run.player.stats.attackSpeed) /
        (1 + 0.15 * (this.run.player.items.get(`lemonade`) ?? 0))
      );
    }
    mods() {
      let e = 1 + 0.5 * (this.run.player.items.get(`poke-doll`) ?? 0);
      return this.list.flatMap((t) => Mm(t.types[0], t.shiny, e));
    }
    trim() {
      for (let e = this.list.length - 1; e >= 0 && this.team.length > this.cap; e--)
        this.list[e].shiny || this.release(e);
    }
    byslot(e) {
      return this.list.find((t) => t.slot === e);
    }
    typesFor(e) {
      return this.byslot(e)?.types ?? null;
    }
    credit(e, t) {
      let n = this.byslot(e);
      n && (n.damage += t);
    }
    intercept(e) {
      const encounter = this.run.captureEncounter;
      if (!encounter || encounter.index !== e || encounter.stage !== this.run.stage ||
          encounter.generation !== this.run.enemies.gen[e] || this.run.enemies.species[e] !== this.run.captureTarget) return false;
      if (e === this.releasing) return !1;
      if (e === this.down && this.state !== `idle`) return !0;
      if (this.state !== `idle` || this.run.state === `dead`) return !1;
      let t = this.run,
        n = t.enemies;
      ((this.down = e),
        (this.gen = n.gen[e]),
        (this.state = `down`),
        (this.downT = 8),
        (n.hp[e] = n.maxHp[e] * 0.01),
        (n.flash[e] = 1),
        (n.burn[e] = n.poison[e] = 0));
      let r = this.team.length >= this.cap,
        i = c(`Apoyo: {label}`, { label: jm[k.get(n.species[e]).types[0]].label });
      return (
        t.ui.banner(
          c(`¡{name} Alfa está debilitado!`, { name: n.glyphWords[e] }),
          i +
            ` · ` +
            c(
              r
                ? `{key} cerca: Amigo Ball para que luche contigo esta partida (tu equipo está lleno: tendrás que liberar a uno; no se une a tu Liga)`
                : `{key} cerca: Amigo Ball para que luche contigo esta partida (no se une a tu Liga)`,
              { key: Lo(`E`) },
            ),
          `#5af0ff`,
          { species: n.species[e], glyph: n.glyphWords[e] },
        ),
        t.audio.power(),
        !0
      );
    }
    isDown(e) {
      return this.state !== `idle` && e === this.down;
    }
    downSupport() {
      let e = this.down >= 0 ? this.run.enemies.species[this.down] : 0;
      return e && k.byId.has(e) ? jm[k.get(e).types[0]].label : ``;
    }
    canThrow() {
      if (this.state !== `down`) return !1;
      let e = this.run.enemies,
        t = this.run.player.pos;
      return Math.hypot(e.x[this.down] - t.x, e.z[this.down] - t.z) < 9;
    }
    throwBall() {
      if (!this.canThrow()) return;
      let e = this.run,
        t = e.enemies,
        n = this.down,
        r = this.attempts.get(this.gen) ?? 0,
        i = 0.45 + (k.get(t.species[n]).captureRate / 255) * 0.35 + r * 0.2;
      (t.para[n] > 0 || t.sleep[n] > 0 || t.frozen[n] > 0) && (i += 0.15);
      let a = e.player.items.has(`master-ball`);
      ((this.state = `throwing`),
        this.ball.start(
          n,
          a || Math.random() < Math.min(0.95, i),
          () => this.caught(),
          () => this.breakFree(),
          a,
        ));
    }
    breakFree() {
      let e = this.run,
        t = e.enemies,
        n = this.down;
      (this.attempts.set(this.gen, (this.attempts.get(this.gen) ?? 0) + 1),
        (this.state = `idle`),
        (this.down = -1),
        t.alive[n] &&
          t.gen[n] === this.gen &&
          ((t.hp[n] = t.maxHp[n] * 0.3),
          (t.stun[n] = 0),
          e.ui.toast(
            c(`¡Se ha escapado! Debilítalo otra vez: el siguiente lanzamiento será más fácil`),
            `poke-ball`,
          ),
          e.cry(t.species[n])));
    }
    dismiss() {
      this.state === `down` && this.faint();
    }
    faint() {
      let e = this.run,
        t = this.down;
      ((this.state = `idle`),
        (this.down = -1),
        e.enemies.alive[t] &&
          e.enemies.gen[t] === this.gen &&
          ((this.releasing = t), e.combat.killEnemy(t, { type: `normal` }), (this.releasing = -1)));
    }
    caught() {
      let e = this.run,
        t = e.enemies,
        n = this.down;
      ((this.state = `idle`), (this.down = -1));
      let r = t.species[n],
        i = t.x[n],
        a = t.y[n],
        o = t.z[n];
      (e.combat.credit(n, { type: `normal` }, !1),
        t.kill(n),
        e.meta.count(`alphaCaught`, 1),
        e.meta.markSeen(r),
        e.stats.allies.push(r),
        e.audio.caught(),
        e.cry(r));
      let s = this.make(r, i, a, o);
      this.team.length < this.cap
        ? this.join(s)
        : ((e.state = `modal`),
          e.ui.showParty(e, s, (t) => {
            (e.ui.hideModal(),
              t >= 0 && this.list[t]
                ? (this.release(t), this.join(s))
                : e.ui.toast(c(`{name} vuelve al bosque. ¡Hasta pronto!`, { name: s.name }), null),
              e.resume());
          }));
    }
    recruit(e, t, n, r, i, a) {
      let o = this.run,
        s = this.make(e, t, n, r);
      (o.cry(e),
        this.team.length < this.cap
          ? (this.join(s), i(!0))
          : o.state === `play`
            ? ((o.state = `modal`),
              o.ui.showParty(o, s, (e) => {
                o.ui.hideModal();
                let t = e >= 0 && !!this.list[e];
                (t
                  ? (this.release(e), this.join(s))
                  : o.ui.toast(a ?? c(`{name} vuelve a su fósil.`, { name: s.name }), null),
                  o.resume(),
                  i(t));
              }))
            : o.whenFree(() => this.recruit(e, t, n, r, i, a)));
    }
    make(e, t, n, r) {
      const terrain=this.run.terrain;
      if(terrain.blocksFacility?.(t,r,.45)){
        const free={};
        if(terrain.placeSpawn(t,r,.45,free)){t=free.x;r=free.z;n=terrain.surface(t,r);}
      }
      let i = k.get(e);
      return {
        species: e,
        name: i.name,
        types: i.types,
        bst: i.bst,
        physical: i.stats.atk >= i.stats.spa,
        slot: 10 + (this.serial++ % 100),
        x: t,
        y: n,
        z: r,
        fx: 0,
        fz: 1,
        anim: 0,
        timer: 1,
        flash: 1,
        squash: 0,
        hop: 0,
        hx: t,
        hz: r,
        tx: t,
        tz: r,
        kills: 0,
        damage: 0,
        bond: 0,
      };
    }
    join(e) {
      let t = this.run;
      (this.list.push(e), t.sprites.getAllyGlyph(e.species, t.player.speciesId), t.player.recompute());
      let n = t.meta.skinMember(e.species),
        r = n
          ? t.meta.inLeague(n.id)
            ? c(`{name} ya está en tu Liga.`, { name: k.get(n.id).name })
            : c(
                `Para jugar con {name} en la Liga: completa su reto en la Liga y captúralo cuando aparezca.`,
                { name: k.get(n.id).name },
              )
          : void 0;
      t.ui.caught(
        e.species,
        c(`¡{name} te acompaña esta partida!`, { name: e.name }),
        c(`Alfa de apoyo · {label} · no se une a tu Liga`, { label: jm[e.types[0]].label }),
        `#36c96a`,
        !1,
        r,
        !0,
      );
    }
    makeShiny(e, t, n, r) {
      let i = this.make(e, t, n, r);
      return ((i.shiny = !0), (i.bond = this.run.meta.shinyBond()), i);
    }
    setShiny(e) {
      let t = this.shinyAlly;
      (t && this.list.splice(this.list.indexOf(t), 1),
        this.list.push(e),
        this.run.sprites.getAllyGlyph(e.species, this.run.player.speciesId),
        this.run.player.recompute());
    }
    shinyLabel(e) {
      return Nm(k.get(e).types[0], !0);
    }
    release(e) {
      let t = this.run,
        n = this.list[e];
      n &&
        (this.list.splice(e, 1),
        t.vfx.burst(n.x, n.y + 1, n.z, 16777215, 20, 6, I.Star, 0.5),
        t.ui.toast(c(`{name} vuelve al bosque. ¡Gracias por tu ayuda!`, { name: n.name }), null),
        t.player.recompute());
    }
    onStage() {
      ((this.state = `idle`), (this.down = -1), (this.ball.active = !1), this.attempts.clear());
      let e = this.run.player.pos;
      this.list.forEach((t, n) => {
        ((t.x = e.x + Math.cos(n * 2.1) * 2.5),
          (t.z = e.z + Math.sin(n * 2.1) * 2.5),
          (t.y = this.run.terrain.surface(t.x, t.z)),
          (t.hop = 0));
      });
    }
    get marker() {
      return this.state === `down`
        ? { x: this.run.enemies.x[this.down], z: this.run.enemies.z[this.down], i: this.down }
        : null;
    }
    update(e) {
      let t = this.run,
        n = t.enemies;
      if (
        (this.state !== `idle` &&
          (!n.alive[this.down] || n.gen[this.down] !== this.gen) &&
          ((this.state = `idle`), (this.down = -1), (this.ball.active = !1)),
        this.state === `down`)
      ) {
        let r = this.down;
        ((this.downT -= e),
          (n.stun[r] = 0.5),
          (n.vx[r] = 0),
          (n.vz[r] = 0),
          (n.kx[r] = 0),
          (n.kz[r] = 0),
          Math.random() < e * 5 &&
            t.vfx.trail(
              n.x[r] + F.range(-1, 1),
              n.y[r] + n.hgt[r] + 0.3,
              n.z[r] + F.range(-1, 1),
              9109503,
              0.5,
              I.Star,
              0.6,
            ));
        let i = t.terrain.surface(n.x[r], n.z[r]),
          a = Math.max(0, this.downT / 8);
        (t.vfx.ground.spawn({
          x: n.x[r],
          y: i + 0.25,
          z: n.z[r],
          life: 0.05,
          size: 18,
          endSize: 18,
          color: 5959935,
          shape: I.Ring,
          glow: 0.3,
          rot: 0,
        }),
          t.vfx.ground.spawn({
            x: n.x[r],
            y: i + 0.22,
            z: n.z[r],
            life: 0.05,
            size: 18 * a,
            endSize: 18 * a,
            color: 2789536,
            shape: I.Soft,
            glow: 0,
            rot: 0,
          }),
          this.downT <= 0 && this.faint());
      }
      this.list.forEach((t, n) => this.updateAlly(t, n, e));
    }
    updateAlly(e, t, n) {
      const fromX=e.x,fromZ=e.z;
      let r = this.run,
        i = r.player,
        a = r.terrain;
      ((e.flash = Math.max(0, e.flash - n * 3)), (e.squash *= Math.exp(-n * 10)));
      let o = e.types.includes(`flying`);
      if (e.hop > 0) {
        e.hop -= n;
        let t = 1 - Math.max(0, e.hop) / 0.32;
        ((e.x = e.hx + (e.tx - e.hx) * t),
          (e.z = e.hz + (e.tz - e.hz) * t),
          moveShelfAlly(a,e,fromX,fromZ),
          (e.y = a.surface(e.x, e.z) + Math.sin(t * Math.PI) * 1.8 + (o ? 1.1 : 0)),
          (e.anim += n * 3),
          e.hop <= 0 && this.land(e));
        return;
      }
      let s = i.facing.x,
        c = i.facing.y,
        l = e.shiny ? 1.9 : ([0.75, -0.75, 0, -1.9][t] ?? 0),
        u = Math.cos(l),
        d = Math.sin(l),
        f = -(s * u - c * d),
        p = -(s * d + c * u),
        m = i.pos.x + f * 2.6,
        h = i.pos.z + p * 2.6,
        g = m - e.x,
        _ = h - e.z,
        v = Math.hypot(g, _);
      if(a.crossesNpcProp && r.time>=(e.navNext??0)){
        e.navNext=r.time+.18;
        const dir=e.navDir??={};
        e.navActive=a.crossesNpcProp(e.x,e.z,m,h,.45) && a.steerDeskEnemy(e.x,e.z,m,h,.45,dir,-1-t);
      }
      const catchUp=(v>28||Math.abs(i.pos.y-e.y)>10) &&
        !a.crossesNpcProp?.(e.x,e.z,m,h,.45);
      if (catchUp)
        (r.vfx.burst(e.x, e.y + 1, e.z, 16777215, 10, 4, I.Soft, 0.5),
          (e.x = m),
          (e.z = h),
          (e.y = a.surface(m, h)),
          r.vfx.burst(e.x, e.y + 1, e.z, 8060826, 10, 4, I.Star, 0.5));
      else if (v > 0.4) {
        let t = Math.min(v * 3, Math.max(9, i.speedNow * 1.3));
        if(a.desk2d&&e.navActive){g=e.navDir.x*v;_=e.navDir.z*v;}
        ((e.x += (g / v) * t * n),
          (e.z += (_ / v) * t * n),
          (e.fx = g / v),
          (e.fz = _ / v),
          (e.anim += n * (0.6 + t / 4)));
      }
      moveShelfAlly(a,e,fromX,fromZ,catchUp);
      let y = a.surface(e.x, e.z) + (o ? 1.1 + Math.sin(r.time * 3 + t) * 0.2 : 0);
      if (((e.y += (y - e.y) * Math.min(1, n * 12)), (e.timer -= n), e.timer > 0)) return;
      let b = r.enemies,
        x =
          r.lockTarget >= 0 &&
          b.isAlive(r.lockTarget) &&
          Math.hypot(b.x[r.lockTarget] - e.x, b.z[r.lockTarget] - e.z) < 16
            ? r.lockTarget
            : b.nearest(e.x, e.z, 14);
      if ((x >= 0 && (b.flags[x] & R.Capture || this.isDown(x)) && (x = -1), x < 0)) {
        e.timer = 0.3;
        return;
      }
      e.timer = this.cooldown(e);
      let S = b.x[x] - e.x,
        C = b.z[x] - e.z,
        w = Math.hypot(S, C) || 1;
      ((e.fx = S / w), (e.fz = C / w));
      let T = Ni[e.types[0]];
      if (e.physical) {
        let t = Math.max(0, w - 0.8);
        ((e.hop = 0.32),
          (e.hx = e.x),
          (e.hz = e.z),
          (e.tx = e.x + e.fx * t),
          (e.tz = e.z + e.fz * t),
          (e.squash = -0.5),
          r.audio.whoosh());
      } else {
        let t = i.stats,
          n = this.power(e),
          a = Zg[e.types[0]];
        (r.projectiles.fire({
          x: e.x,
          y: e.y + 0.9,
          z: e.z,
          dx: e.fx,
          dz: e.fz,
          dy: (b.y[x] + b.hgt[x] * 0.5 - e.y - 0.9) / w,
          speed: 19,
          life: 1.8,
          radius: 0.6,
          dmg: n,
          type: e.types[0],
          cls: `special`,
          flags: em.Homing | em.Explode,
          explodeR: 2.2 * Math.sqrt(t.area),
          explosionArtRadius: 2.2,
          status: a,
          statusChance: 0.2,
          size: 0.95,
          shape: am(e.types[0]),
          color: T,
          slot: e.slot,
          target: x,
          knock: 1,
        }),
          r.vfx.flash(e.x + e.fx, e.y + 0.9, e.z + e.fz, T, 1.2, 0.1),
          r.audio.shot(e.types[0], 0.35),
          (e.squash = 0.4));
      }
    }
    land(e) {
      let t = this.run,
        n = t.enemies,
        r = t.player.stats,
        i = 2.6 * Math.sqrt(r.area),
        a = this.power(e),
        o = Ni[e.types[0]],
        s = Zg[e.types[0]];
      ((e.squash = 0.6),
        t.vfx.ring(e.x, Fm(t, e), e.z, i, o, 0.35),
        t.vfx.burst(e.x, e.y + 0.6, e.z, o, 12, 6, am(e.types[0]), 0.55, 0.4),
        t.vfx.dust(e.x, Fm(t, e), e.z, 14207144, 6, 4));
      for (let r of n.within(e.x, e.z, i, this.tmp))
        n.flags[r] & R.Capture ||
          this.isDown(r) ||
          t.combat.hit(r, a, {
            type: e.types[0],
            cls: `physical`,
            status: s,
            statusChance: 0.2,
            slot: e.slot,
            knock: 2,
            silent: Math.random() < 0.3,
          });
    }
    onAllyKill(e) {
      let t = this.byslot(e);
      if (!t) return;
      t.kills++;
      let n = km.filter((e) => t.kills >= e).length;
      n > t.bond &&
        ((t.bond = n),
        this.run.ui.toast(
          c(`¡{name} confía más en ti! Vínculo {bond} (+{pct} % de daño)`, {
            name: t.name,
            bond: n,
            pct: n * 10,
          }),
          null,
        ),
        this.run.vfx.burst(t.x, t.y + 1.2, t.z, 16747224, 14, 4, I.Heart, 0.5, 0.8));
    }
    render() {
      let e = this.run,
        t = e.sprites;
      for (let n of this.list) {
        let r = t.getAllyGlyph(n.species, e.player.speciesId),
          i = n.hop > 0 || Math.hypot(n.x - e.player.pos.x, n.z - e.player.pos.z) > 3,
          a = n.shiny ? 5 + Math.min(0.99, Xc(n.species)) : 0;
        r.push(
          n.x,
          n.y,
          n.z,
          i ? `walk` : `idle`,
          n.anim,
          t.dirRow(n.fx, n.fz),
          0.65,
          n.flash,
          0,
          a,
          n.squash,
          1,
          1,
          1,
          0,
          !1,
        );
        let o = e.terrain.surface(n.x, n.z);
        (t.shadows.push(n.x, o, n.z, 1.3),
          e.vfx.ground.spawn({
            x: n.x,
            y: o + 0.08,
            z: n.z,
            life: 0.03,
            size: 1.9,
            endSize: 1.9,
            color: n.shiny ? 16751328 : 8060826,
            shape: I.Ring,
            glow: 0,
            rot: 0,
          }),
          Math.random() < 0.01 && e.vfx.trail(n.x, n.y + 1.6, n.z, 16747224, 0.4, I.Heart, 0.8),
          n.shiny &&
            Math.random() < 0.06 &&
            e.vfx.add.spawn({
              x: n.x + F.range(-0.6, 0.6),
              y: n.y + F.range(0.3, 1.6),
              z: n.z + F.range(-0.6, 0.6),
              vy: 0.5,
              life: 0.5,
              size: 0.45,
              endSize: 0,
              color: [16777215, 16773754, 16751328, 10152191][Math.floor(Math.random() * 4)],
              shape: I.Twinkle,
              glow: 1,
              spin: 4,
            }));
      }
    }
    dispose() {
      this.ball.dispose();
    }
    static supportText(e, t = !1) {
      return `${Pi[e]} · ${Nm(e, t)}`;
    }
  },
  Fm = (e, t) => e.terrain.surface(t.x, t.z);

export {
  em,
  am,
  Om,
  tm,
  gm,
  Pm,
  Nm,
  jm,
  km
};
