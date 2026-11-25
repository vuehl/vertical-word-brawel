import {VFX_SCALE} from '../effects/visual-scale.js';
import {
  I as Cr,
  K as Tr,
  M as Dr,
  ct as Kr,
  et as Yr,
  y as Oi,
  D as vr,
  L as Er,
  O as kr,
  S as Nr,
  U as Fr,
  it as ri,
  gt as $r
} from "../vendor/three-DmSYIDKK.js";
import {clamp as Gs, qs} from "../effects/scene-renderer.js";
import {random as F, I, Random as Ol} from "../effects/battle-particles.js";
import {bu} from "../world/terrain.js";
import {chineseText as c} from "../data/chinese-text.js";
import {R} from "./enemy-population.js";
import {MapSpawnError} from "../world/map-rules.js";
import {Xc} from "../actors/sprite-assets.js";
import {gameData as k} from "../data/game-database.js";
import {Nt as Pe} from "../data/config.js";

var KS = Math.PI / 180,
  qS = (e, t) => ({ x: Math.cos(e * KS) * t, z: Math.sin(e * KS) * t }),
  JS = class {
    run;
    def;
    layout;
    group = new Cr();
    covers = [];
    ringR = 1 / 0;
    ringFrom = 0;
    ringT = -1;
    ringEnd;
    ringHurtT = 0;
    minionT = 10;
    berryT = 22;
    disposed = !1;
    stone;
    phase = 0;
    ringType = `grass`;
    ringHurt = 0.07;
    constructor(e, t, n) {
      ((this.run = e),
        (this.def = t),
        (this.layout = n.layout),
        (this.ringEnd = n.ringEnd),
        (this.stone = n.stone),
        e.r.scene.add(this.group));
      let r = e.terrain;
      // The illustrated final desk supplies its own shelf and boundaries.
      if (r.bossSite) return;
      for (let e of n.columns) {
        let t = r.height(e.x, e.z),
          i = { x: e.x, z: e.z, r: 1, h: t + 4.6, standY:t+4.4 },
          a = { x: e.x, z: e.z, r: 1.05, h: t + 1.3, standY:t+1.3, off: !0 };
        (r.addCollider(i), r.addCollider(a), r.reserve(e.x, e.z, 2.4));
        let o = this.addCover({
          x: e.x,
          z: e.z,
          r: 1,
          top: t + 4.4,
          breakable: !0,
          hp: 100,
          col: i,
          stub: a,
          kind: `column`,
        });
        o.group = this.model(n.pillar, e.x, e.z, F.range(0, Math.PI * 2), 1, (e) => {
          let t = e.getObjectByName(`Stub`);
          t && (t.visible = !o.alive);
        });
      }
      for (let e of this.layout.bigTrees)
        (this.model(`paper_pencils`,e.x,e.z,0,1),r.reserve(e.x, e.z, 3),
          this.addCover({
            x: e.x,
            z: e.z,
            r: 1.9,
            top: r.height(e.x, e.z) + 14,
            breakable: !1,
            hp: 1,
            kind: `tree`,
          }));
      for (let e of this.layout.lanterns)
        (this.model(`paper_lamp`,e.x,e.z,0,1),r.reserve(e.x, e.z, 1.4),
          this.addCover({
            x: e.x,
            z: e.z,
            r: 0.6,
            top: r.height(e.x, e.z) + 3,
            breakable: !1,
            hp: 1,
            kind: `lantern`,
          }));
      (this.addCover({ x: 0, z: 0, r: 3, top: r.height(0, 0) + 5.4, breakable: !1, hp: 1, kind: `shrine` }),
        r.addCollider({ x: 0, z: 0, r: 3, h: r.height(0, 0) + 5.4, standY:r.height(0,0)+5.4 }));
      let i = this.layout.entry.z - 7;
      for (let e of [-2.7, 2.7])
        (r.addCollider({ x: e, z: i, r: 0.6, h: r.height(e, i) + 6, standY:r.height(e,i)+5 }),
          this.addCover({ x: e, z: i, r: 0.5, top: r.height(e, i) + 5, breakable: !1, hp: 1, kind: `gate` }));
      (r.reserve(0, i, 4.5), this.model(n.gate, 0, i, 0, 1.1));
    }
    addCover(e, t = !0) {
      let n = { ...e, alive: t, flash: 0 };
      return (this.covers.push(n), n);
    }
    model(e, t, n, r, i, a) {
      let o = new Cr();
      return (
        o.position.set(t, this.run.terrain.height(t, n), n),
        (o.rotation.y = r),
        o.scale.setScalar(i),
        this.group.add(o),
        bu(e).then((e) => {
          e && !this.disposed && (o.add(e), a?.(e));
        }),
        o
      );
    }
    firstBlock(e, t, n, r, i, a) {
      let o = r - e,
        s = a - n,
        c = o * o + s * s || 1e-6,
        l = 1;
      for (let r of this.covers) {
        if (!r.alive) continue;
        let a = Gs(((r.x - e) * o + (r.z - n) * s) / c, 0, 1),
          u = e + o * a - r.x,
          d = n + s * a - r.z;
        if (u * u + d * d > r.r * r.r) continue;
        let f = Math.sqrt(Math.max(0, r.r * r.r - (u * u + d * d))) / Math.sqrt(c),
          p = Math.max(0, a - f);
        t + (i - t) * p < r.top && p < l && (l = p);
      }
      let u = Math.ceil(Math.sqrt(c) / 1.1);
      for (let r = 1; r < u; r++) {
        let a = r / u;
        if (a >= l) break;
        if (this.run.terrain.height(e + o * a, n + s * a) > t + (i - t) * a + 0.15) return a;
      }
      return l;
    }
    blocked(e, t, n, r, i, a) {
      return this.firstBlock(e, t, n, r, i, a) < 0.999;
    }
    playerHidden(e, t, n) {
      let r = this.run.player.pos;
      return this.blocked(e, t, n, r.x, r.y + 0.9, r.z);
    }
    hitCover(e, t, n, r, i = 3) {
      for (let a of this.covers) {
        if (!a.alive || t > a.top) continue;
        let o = e - a.x,
          s = n - a.z,
          c = a.r + r;
        if (!(o * o + s * s > c * c)) return (a.breakable && this.damage(a, i), !0);
      }
      return !1;
    }
    blast(e, t, n, r) {
      for (let i of this.covers)
        i.alive && i.breakable && (e - i.x) ** 2 + (t - i.z) ** 2 < (n + i.r) ** 2 && this.damage(i, r);
    }
    blastRing(e, t, n, r, i) {
      for (let a of this.covers) {
        if (!a.alive || !a.breakable) continue;
        let o = Math.hypot(a.x - e, a.z - t);
        o >= n && o < r && this.damage(a, i);
      }
    }
    damage(e, t) {
      ((e.hp -= t), (e.flash = 1));
      let n = this.run,
        r = n.terrain.height(e.x, e.z);
      (Math.random() < 0.5 &&
        n.vfx.burst(e.x, r + F.range(1, 3.5), e.z, this.stone, 3, 4, I.Rock, 0.4, 0.5, 14),
        !(e.hp > 0) &&
          ((e.alive = !1),
          e.col && (e.col.off = !0),
          e.stub && (e.stub.off = !1),
          n.vfx.burst(e.x, r + 2, e.z, this.stone, 26, 9, I.Rock, 0.7, 0.9, 16),
          n.vfx.dust(e.x, r, e.z, this.stone, 18, 6),
          this.onColumnBreak(e, r),
          n.shake(0.35, e.x, e.z),
          n.audio.boom(0.8),
          this.setColumn(e, !1)));
    }
    onColumnBreak(e, t) {}
    slipAt(e, t) {
      return 0;
    }
    setColumn(e, t) {
      let n = e.group;
      if (!n) return;
      let r = n.getObjectByName(`Column`),
        i = n.getObjectByName(`Stub`);
      (r && (r.visible = t), i && (i.visible = !t));
    }
    restoreCovers() {
      let e = this.run;
      for (let t of this.covers) {
        if (t.alive || t.kind !== `column`) continue;
        ((t.alive = !0),
          (t.hp = 100),
          t.col && (t.col.off = !1),
          t.stub && (t.stub.off = !0),
          this.setColumn(t, !0));
        let n = e.terrain.height(t.x, t.z);
        for (let r = 0; r < 14; r++)
          e.vfx.add.spawn({
            x: t.x + F.range(-1, 1),
            y: n + F.range(0, 4),
            z: t.z + F.range(-1, 1),
            vy: F.range(-2, 2),
            life: 0.8,
            size: 0.5,
            endSize: 0,
            color: 10157962,
            shape: I.Twinkle,
            glow: 0.9,
          });
        e.vfx.ring(t.x, n, t.z, 3, 10157962, 0.5);
      }
    }
    onPhase(e) {
      ((this.phase = e),
        e === 3 && ((this.ringFrom = this.layout.radius + 1), (this.ringT = 0), (this.ringR = this.ringFrom)),
        this.phaseChange(e));
    }
    onVictory() {
      ((this.phase = 4),
        (this.ringT = -1),
        (this.ringR = 1 / 0),
        (this.run.terrain.ringR = 1 / 0),
        this.victory());
    }
    update(e) {
      let t = this.run,
        n = t.player,
        r = n.pos;
      if (this.ringT >= 0) {
        (this.ringT < 1 &&
          ((this.ringT = Math.min(1, this.ringT + e / 9)),
          (this.ringR = this.ringFrom + (this.ringEnd - this.ringFrom) * qs(0, 1, this.ringT))),
          (t.terrain.ringR = this.ringR));
        let i = Math.hypot(r.x, r.z);
        if (i > this.ringR - 0.8) {
          ((this.ringHurtT -= e),
            this.ringHurtT <= 0 &&
              ((this.ringHurtT = 0.5),
              n.hurt(n.maxHp * this.ringHurt, this.ringType, -1),
              this.ringHit(r.x, r.y, r.z)));
          let t = Math.min(1, (i - (this.ringR - 0.8)) / 2);
          ((n.vel.x -= (r.x / i) * 30 * t * e),
            (n.vel.z -= (r.z / i) * 30 * t * e),
            i > this.ringR + 1.5 && ((r.x *= (this.ringR + 1.5) / i), (r.z *= (this.ringR + 1.5) / i)));
        }
      }
      (this.tickArena(e),
        t.boss.alive &&
          ((this.minionT -= e),
          this.minionT <= 0 &&
            ((this.minionT = [14, 14, 11, 9][this.phase] ?? 10), this.spawnMinions(2 + this.phase * 2)),
          (this.berryT -= e),
          this.berryT <= 0 && ((this.berryT = 24), this.spawnBerry())));
      for (let t of this.covers)
        if (t.flash > 0 && t.group) {
          t.flash = Math.max(0, t.flash - e * 6);
          let n = t.flash * 0.08;
          ((t.group.position.x = t.x + F.range(-n, n)), (t.group.position.z = t.z + F.range(-n, n)));
        }
    }
    spawnMinions(e) {
      let t = this.run,
        n = t.director.cards;
      if (!n.length) return;
      let r = Math.min(this.layout.radius - 3, this.ringR - 3);
      for (let i = 0; i < e; i++) {
        let e = F.range(0, Math.PI * 2),
          i = Math.cos(e) * r,
          a = Math.sin(e) * r;
        (t.enemies.spawn(F.pick(n).id, i, a, t.director.hpMult(), t.director.dmgMult(), 0),
          this.minionFx(i, t.terrain.height(i, a), a));
      }
    }
    spawnBerry() {
      let e = this.run,
        t = e.player.pos,
        n = e.terrain;
      for (let r = 0; r < 30; r++) {
        let r = F.range(0, Math.PI * 2),
          i = F.range(8, Math.min(40, this.ringR - 3)),
          a = Math.cos(r) * i,
          o = Math.sin(r) * i;
        if (Math.hypot(a - t.x, o - t.z) < 10 || !n.isFlatOpen(a, o)) continue;
        let s = n.height(a, o);
        (e.pickups.spawn(`heal`, a, s, o, 1),
          e.vfx.beams.spawn(a, s, o, a, s + 9, o, 0.8, 7012234, 1.2),
          e.vfx.ring(a, s, o, 2.5, 7012234, 0.6));
        return;
      }
    }
    confine(e, t, n, r) {
      let i = Math.min(this.layout.radius - n, this.ringR - n),
        a = Math.hypot(e, t);
      return (a > i ? ((r.x = (e / a) * i), (r.z = (t / a) * i)) : ((r.x = e), (r.z = t)), r);
    }
    dispose() {
      ((this.disposed = !0),
        (this.run.terrain.ringR = 1 / 0),
        this.group.traverse((e) => {
          e.geometry?.dispose();
          if(e.material?.userData?.owned)e.material.dispose();
        }),
        this.group.parent?.remove(this.group));
    }
  },
  YS = [30, 150, 270].map((e) => ({ ...qS(e, 27), r: 7, ramp: (e + 90) * KS })),
  XS = [0, 60, 120, 180, 240, 300].map((e) => qS(e, 15)),
  ZS = [0, 75, 105, 195, 225, 315].map((e) => qS(e, 37)),
  QS = {
    pack: `sanctum`,
    world: 150,
    radius: 48,
    plateaus: YS,
    dais: 7,
    flags: [...XS, ...ZS].map((e) => ({ ...e, r: 3 })),
    bigTrees: [qS(210, 31), qS(330, 31)],
    lanterns: [45, 135, 225, 315].map((e) => qS(e, 9.5)),
    entry: { x: 0, z: 39 },
  },
  $S = [90, 210, 330].map((e) => ({ ...qS(e, 21), a: e * KS })),
  eC = class extends JS {
    roots = [];
    brambles = [];
    spores = [];
    sporeT = 6;
    sporeHurtT = 0;
    shafts;
    shaftMat;
    constructor(e, t) {
      super(e, t, {
        layout: QS,
        columns: [...XS, ...ZS],
        pillar: `sanct_pillar`,
        gate: `sanct_gate`,
        ringEnd: 31,
        stone: 12107944,
      });
      let n = e.terrain;
      if (n.bossSite) return;
      for (let e of $S) n.reserve(e.x, e.z, 3);
      this.shaftMat = new Kr({
        transparent: !0,
        depthWrite: !1,
        blending: 2,
        side: 2,
        uniforms: { uTime: e.r.shared.uTime, uK: { value: 1 } },
        vertexShader: `varying vec2 vUv; varying float vSeed; attribute float aSeed; void main(){ vUv = uv; vSeed = aSeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: `uniform float uTime; uniform float uK; varying vec2 vUv; varying float vSeed;
        void main(){ float edge = smoothstep(0., 0.35, vUv.x) * smoothstep(1., 0.65, vUv.x);
          float fall = smoothstep(0., 0.25, vUv.y) * smoothstep(1., 0.6, vUv.y);
          float flick = 0.75 + 0.25 * sin(uTime * 0.6 + vSeed * 7.);
          gl_FragColor = vec4(vec3(0.75, 1.0, 0.7) * edge * fall * flick * 0.16 * uK, 1.); }`,
      });
      let r = [],
        i = new Ol(e.seed ^ 23130);
      for (let e = 0; e < 9; e++) {
        let t = i.range(0, Math.PI * 2),
          a = i.range(6, 38),
          o = i.range(3, 6);
        for (let i of [0, Math.PI / 2]) {
          let s = new Yr(o * VFX_SCALE, 34 * VFX_SCALE)
            .translate(0, 17 * VFX_SCALE, 0)
            .rotateZ(-0.32)
            .rotateY(i + 0.6)
            .translate(Math.cos(t) * a, n.height(Math.cos(t) * a, Math.sin(t) * a) - 1, Math.sin(t) * a);
          (s.setAttribute(`aSeed`, new Dr([, , , ,].fill(e), 1)), r.push(s));
        }
      }
      ((this.shafts = new Tr(tC(r), this.shaftMat)),
        (this.shafts.renderOrder = 9),
        this.group.add(this.shafts));
    }
    phaseSub(e) {
      return c(e === 2 ? `¡El santuario despierta!` : `¡Las zarzas cierran el claro!`);
    }
    phaseChange(e) {
      (e === 2 && this.raiseRoots(), e === 3 && this.spawnBrambles());
    }
    victory() {
      let e = this.run;
      this.spores.length = 0;
      let t = this.brambles.slice();
      this.brambles.length = 0;
      let n = t.map((e) => e.position.y);
      e.animate(
        2.2,
        (e) => {
          t.forEach((t, r) => {
            t.position.y = n[r] - e * e * 3.5;
          });
        },
        () => {
          for (let e of t) e.parent?.remove(e);
        },
      );
      for (let n of t)
        Math.random() < 0.4 &&
          e.vfx.burst(n.position.x, n.position.y + 1, n.position.z, 16756952, 6, 4, I.Leaf, 0.5, 1);
      let r = e.player.pos;
      for (let t = 0; t < 60; t++)
        e.vfx.add.spawn({
          x: r.x + F.range(-14, 14),
          y: r.y + F.range(0, 8),
          z: r.z + F.range(-14, 14),
          vy: F.range(0.5, 2),
          life: F.range(1.5, 3),
          size: 0.4,
          endSize: 0,
          color: t % 3 ? 13172586 : 16777215,
          shape: I.Twinkle,
          glow: 1.2,
        });
    }
    onColumnBreak(e, t) {
      this.run.vfx.burst(e.x, t + 2, e.z, 5963658, 10, 5, I.Leaf, 0.5, 0.8);
    }
    ringHit(e, t, n) {
      this.run.vfx.burst(e, t + 1, n, 6989898, 8, 5, I.Shard, 0.4, 0.4);
    }
    minionFx(e, t, n) {
      this.run.vfx.burst(e, t + 0.5, n, 7012234, 8, 4, I.Leaf, 0.5, 0.5);
    }
    raiseRoots() {
      let e = this.run,
        t = e.terrain;
      for (let n of $S) {
        let r = this.model(`sanct_root`, n.x, n.z, -(n.a + Math.PI / 2), 1.1, (e) => {
          for (let t of [`Pod0`, `Pod1`]) {
            let n = e.getObjectByName(t);
            n && i.pods.push(n);
          }
        });
        r.position.y -= 3.2;
        let i = { g: r, x: n.x, z: n.z, a: n.a, t: 0, pods: [], covers: [] };
        this.roots.push(i);
        let a = -Math.sin(n.a),
          o = Math.cos(n.a);
        for (let e = -4.8; e <= 4.81; e += 1.2) {
          let r = n.x + a * e * 1.1,
            s = n.z + o * e * 1.1,
            c = t.height(r, s),
            l = 0.9 + 1.9 * (1 - (e / 5.6) ** 2),
            u = { x: r, z: s, r: 0.85, h: c + l, standY:c+l, off: !0 };
          (t.addCollider(u),
            i.covers.push(
              this.addCover(
                { x: r, z: s, r: 0.8, top: c + l, breakable: !1, hp: 1, kind: `root`, col: u },
                !1,
              ),
            ));
        }
        e.vfx.telegraph(n.x, t.height(n.x, n.z), n.z, 6, 9067050, 0.9);
      }
      (e.audio.boom(1), e.shake(0.5));
    }
    spawnBrambles() {
      for (let e = 0; e < 46; e++) {
        let t = this.model(`sanct_bramble`, 0, 0, F.range(0, Math.PI * 2), F.range(1.2, 1.6));
        ((t.userData.a = (e / 46) * Math.PI * 2 + F.range(-0.03, 0.03)),
          (t.userData.s = t.scale.x),
          this.brambles.push(t));
      }
      this.placeBrambles();
    }
    placeBrambles() {
      let e = this.run.terrain;
      for (let t of this.brambles) {
        let n = t.userData.a,
          r = this.ringR + 1.2,
          i = Math.cos(n) * r,
          a = Math.sin(n) * r;
        t.position.set(i, e.height(i, a) - 0.2, a);
      }
    }
    tickArena(e) {
      let t = this.run,
        n = t.player,
        r = n.pos,
        i = t.terrain;
      for (let n of this.roots) {
        if (n.t < 1) {
          n.t = Math.min(1, n.t + e / 1.3);
          let r = 1 - (1 - n.t) ** 3;
          if (
            ((n.g.position.y = i.height(n.x, n.z) - 3.2 * (1 - r) + Math.sin(n.t * 40) * 0.05 * (1 - n.t)),
            Math.random() < 0.7 &&
              t.vfx.dust(
                n.x + F.range(-5, 5) * -Math.sin(n.a),
                i.height(n.x, n.z),
                n.z + F.range(-5, 5) * Math.cos(n.a),
                9071178,
                2,
                5,
              ),
            n.t >= 0.6)
          )
            for (let e of n.covers) e.alive || ((e.alive = !0), (e.col.off = !1));
        }
        for (let [e, r] of n.pods.entries()) r.scale.setScalar(1 + Math.sin(t.time * 3 + e * 2 + n.a) * 0.15);
      }
      if (this.ringT >= 0) {
        if (this.ringT < 1 && (this.placeBrambles(), Math.random() < e * 20)) {
          let e = F.range(0, Math.PI * 2);
          t.vfx.dust(
            Math.cos(e) * this.ringR,
            i.height(Math.cos(e) * this.ringR, Math.sin(e) * this.ringR),
            Math.sin(e) * this.ringR,
            6982218,
            3,
            4,
          );
        }
        for (let e of this.brambles)
          e.scale.setScalar(e.userData.s * (1 + Math.sin(t.time * 2 + e.userData.a * 5) * 0.03));
        if (Math.random() < e * 30) {
          let e = F.range(0, Math.PI * 2),
            n = this.ringR + 0.6;
          t.vfx.add.spawn({
            x: Math.cos(e) * n,
            y: i.height(Math.cos(e) * n, Math.sin(e) * n) + F.range(0.3, 2.5),
            z: Math.sin(e) * n,
            vy: 0.6,
            life: 0.9,
            size: 0.35,
            endSize: 0,
            color: 11557631,
            shape: I.Spore,
            glow: 0.7,
          });
        }
      }
      (this.phase >= 2 &&
        this.phase < 4 &&
        t.boss.alive &&
        ((this.sporeT -= e),
        this.sporeT <= 0 && ((this.sporeT = this.phase >= 3 ? 5 : 7), this.launchSpore())),
        (this.sporeHurtT -= e));
      for (let i = this.spores.length - 1; i >= 0; i--) {
        let a = this.spores[i];
        ((a.t -= e),
          a.t <= 0
            ? this.spores.splice(i, 1)
            : (a.t < 6.5 &&
                Math.random() < e * 8 &&
                t.vfx.norm.spawn({
                  x: a.x + F.range(-a.r, a.r) * 0.8,
                  y: a.y + F.range(0.1, 0.8),
                  z: a.z + F.range(-a.r, a.r) * 0.8,
                  vy: F.range(0.2, 0.6),
                  vx: F.range(-0.3, 0.3),
                  life: 1.4,
                  size: F.range(0.8, 1.3),
                  endSize: 1.8,
                  color: 11037400,
                  shape: I.Soft,
                }),
              a.t < 6.5 &&
                Math.random() < e * 10 &&
                t.vfx.add.spawn({
                  x: a.x + F.range(-a.r, a.r) * 0.8,
                  y: a.y + F.range(0.2, 2),
                  z: a.z + F.range(-a.r, a.r) * 0.8,
                  vy: 0.4,
                  life: 1.2,
                  size: 0.4,
                  endSize: 0,
                  color: 13667071,
                  shape: I.Spore,
                  glow: 0.6,
                }),
              a.t < 6.5 &&
                Math.random() < e * 5 &&
                t.vfx.groundN.spawn({
                  x: a.x,
                  y: a.y + 0.1,
                  z: a.z,
                  life: 0.4,
                  size: a.r * 2,
                  endSize: a.r * 2,
                  color: 8010408,
                  shape: I.Soft,
                  rot: 0,
                }),
              a.t < 6.5 &&
                (r.x - a.x) ** 2 + (r.z - a.z) ** 2 < a.r * a.r &&
                r.y - a.y < 2.5 &&
                this.sporeHurtT <= 0 &&
                ((this.sporeHurtT = 0.6), n.hurt(n.maxHp * 0.035, `poison`, -1, NaN, NaN, !0))));
      }
      this.ambience(e);
    }
    launchSpore() {
      let e = this.run,
        t = e.player.pos,
        n = e.terrain,
        r = this.roots.filter((e) => e.t >= 1);
      if (!r.length) return;
      let i = F.pick(r),
        a = i.x,
        o = i.z,
        s = n.height(a, o) + 2.4,
        c = F.range(0, Math.PI * 2),
        l = F.range(0, 4),
        u = Gs(t.x + Math.cos(c) * l, -40, 40),
        d = Gs(t.z + Math.sin(c) * l, -40, 40),
        f = n.height(u, d),
        p = 3.6,
        m = 1.1;
      (e.vfx.telegraph(u, f, d, p, 11557631, m),
        e.audio.whoosh(),
        e.animate(
          m,
          (t) => {
            let n = a + (u - a) * t,
              r = o + (d - o) * t,
              i = s + (f - s) * t + Math.sin(t * Math.PI) * 7;
            e.vfx.add.spawn({
              x: n,
              y: i,
              z: r,
              life: 0.3,
              size: 0.9,
              endSize: 0.2,
              color: 12614399,
              shape: I.Spore,
              glow: 0.8,
            });
          },
          () => {
            (e.vfx.burst(u, f + 0.6, d, 11557631, 18, 5, I.Spore, 0.6, 0.7),
              e.audio.boom(0.3),
              this.phase < 4 && this.spores.push({ x: u, z: d, y: f, r: p, t: 7 }));
          },
        ));
    }
    ambience(e) {
      if (!this.shaftMat) return;
      let t = this.run,
        n = t.r.camera.position,
        r = t.terrain;
      for (let i = 0, a = Math.floor(e * 40 + Math.random()); i < a; i++) {
        let e = n.x + F.range(-22, 22),
          i = n.z + F.range(-22, 22);
        e * e + i * i > 2116 ||
          t.vfx.add.spawn({
            x: e,
            y: r.height(e, i) + F.range(0.4, 4),
            z: i,
            vx: F.range(-0.4, 0.4),
            vy: F.range(-0.2, 0.3),
            vz: F.range(-0.4, 0.4),
            life: F.range(1.6, 3),
            size: 0.22,
            endSize: 0.05,
            color: Math.random() < 0.7 ? 13172586 : 9109464,
            shape: I.Soft,
            glow: 1.4,
          });
      }
      for (let r = 0, i = Math.floor(e * 10 + Math.random()); r < i; r++) {
        let e = n.x + F.range(-20, 20),
          r = n.z + F.range(-20, 20);
        t.vfx.norm.spawn({
          x: e,
          y: n.y + F.range(4, 12),
          z: r,
          vx: F.range(0.4, 1.4),
          vy: -1.3,
          vz: F.range(-0.5, 0.5),
          life: 6,
          size: 0.3,
          endSize: 0.3,
          color: Math.random() < 0.75 ? 5945418 : 16756936,
          shape: I.Leaf,
          spin: F.range(-3, 3),
        });
      }
      this.shaftMat.uniforms.uK.value = this.phase === 3 ? 0.55 : this.phase === 4 ? 1.5 : 1;
    }
    dispose() {
      (super.dispose(), this.shaftMat?.dispose());
    }
  };
function tC(e) {
  let t = [],
    n = [],
    r = [],
    i = [],
    a = 0;
  for (let o of e) {
    let e = o.attributes.position,
      s = o.attributes.uv,
      c = o.attributes.aSeed;
    for (let i = 0; i < e.count; i++)
      (t.push(e.getX(i), e.getY(i), e.getZ(i)), n.push(s.getX(i), s.getY(i)), r.push(c.getX(i)));
    for (let e = 0; e < o.index.count; e++) i.push(o.index.getX(e) + a);
    ((a += e.count), o.dispose());
  }
  let o = new Oi();
  return (
    o.setAttribute(`position`, new Dr(t, 3)),
    o.setAttribute(`uv`, new Dr(n, 2)),
    o.setAttribute(`aSeed`, new Dr(r, 1)),
    o.setIndex(i),
    o
  );
}
var nC = Math.PI / 180,
  rC = [0, 120, 240].map((e) => ({ ...qS(e, 27), r: 6.5, ramp: (e + 90) * nC })),
  iC = [30, 90, 150, 210, 270, 330].map((e) => qS(e, 15)),
  aC = [25, 155, 205, 270, 335].map((e) => qS(e, 37)),
  oC = {
    pack: `ruins`,
    world: 150,
    radius: 48,
    plateaus: rC,
    dais: 7,
    flags: [...iC, ...aC].map((e) => ({ ...e, r: 3.2 })),
    bigTrees: [qS(140, 33), qS(320, 33)],
    lanterns: [0, 120, 240].map((e) => qS(e, 9.5)),
    entry: { x: 0, z: 39 },
    undergrowth: 520,
  },
  sC = [60, 180, 300],
  cC = 14200954,
  lC = class extends JS {
    fissures = [];
    open = 0;
    heat = 1;
    burnT = 0;
    eruptT = 5;
    eruption = null;
    constructor(e, t) {
      (super(e, t, {
        layout: oC,
        columns: [...iC, ...aC],
        pillar: `ruin_pillar`,
        gate: `ruin_gate`,
        ringEnd: 31,
        stone: cC,
      }),
        (this.ringType = `ground`));
      let n = e.terrain;
      for (let [e, t] of sC.entries()) {
        let r = [];
        for (let n = 12; n <= 46; n += 1) {
          let i = Math.sin(n * 0.45 + e * 2.1) * 1.3 + Math.sin(n * 1.3 + e) * 0.5,
            a = t * nC,
            o = Math.cos(a) * n - Math.sin(a) * i,
            s = Math.sin(a) * n + Math.cos(a) * i;
          r.push({ x: o, z: s });
        }
        for (let e = 0; e < r.length; e += 3) n.reserve(r[e].x, r[e].z, 1.6);
        let i = this.magmaMat(),
          a = new Tr(this.ribbon(r, 2.4 * VFX_SCALE), i);
        ((a.renderOrder = 2),
          (a.visible = !1),
          this.group.add(a),
          this.fissures.push({ pts: r, mesh: a, mat: i, erupt: 0 }));
      }
    }
    magmaMat() {
      return new Kr({
        transparent: !0,
        depthWrite: !1,
        polygonOffset: !0,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        uniforms: {
          uTime: this.run.r.shared.uTime,
          uOpen: { value: 0 },
          uHeat: { value: 1 },
          uErupt: { value: 0 },
        },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: `uniform float uTime; uniform float uOpen; uniform float uHeat; uniform float uErupt; varying vec2 vUv;
        void main(){
          float along = vUv.y, c = abs(vUv.x - 0.5) * 2.;
          float edge = (0.62 + 0.22 * sin(along * 3.1) + 0.12 * sin(along * 7.7 + 1.3)) * uOpen;
          float px = floor(c * 8.) / 8.;
          if (px > edge) discard;
          float core = edge * (0.42 + 0.12 * sin(along * 5.3 + uTime * 2.));
          float flow = 0.75 + 0.25 * sin(uTime * 3. - along * 0.9);
          // Linear colours (the output is sRGB-encoded): deep red-orange magma with a yellow seam, near-black crust.
          vec3 crust = vec3(0.035, 0.014, 0.008);
          vec3 lava = mix(vec3(0.85, 0.09, 0.01), vec3(1.0, 0.42, 0.03), step(px, core * 0.5)) * flow;
          lava = mix(lava, vec3(1.0, 0.55, 0.1), uErupt * 0.7);
          vec3 col = px < core ? mix(vec3(0.06, 0.025, 0.015), lava, uHeat) : crust;
          gl_FragColor = vec4(col, 1.); }`,
      });
    }
    ribbon(e, t) {
      let n = this.run.terrain,
        r = [],
        i = [],
        a = [],
        o = 0;
      for (let s = 0; s < e.length; s++) {
        let c = e[Math.max(0, s - 1)],
          l = e[Math.min(e.length - 1, s + 1)],
          u = l.x - c.x,
          d = l.z - c.z,
          f = Math.hypot(u, d) || 1,
          p = -d / f,
          m = u / f;
        s && (o += Math.hypot(e[s].x - e[s - 1].x, e[s].z - e[s - 1].z));
        for (let a of [-1, 1]) {
          let c = e[s].x + (p * a * t) / 2,
            l = e[s].z + (m * a * t) / 2;
          (r.push(c, n.height(c, l) + 0.08, l), i.push(a < 0 ? 0 : 1, o));
        }
        if (s) {
          let e = s * 2;
          a.push(e - 2, e - 1, e, e - 1, e + 1, e);
        }
      }
      let s = new Oi();
      return (s.setAttribute(`position`, new Dr(r, 3)), s.setAttribute(`uv`, new Dr(i, 2)), s.setIndex(a), s);
    }
    phaseSub(e) {
      return c(e === 2 ? `¡Sequía! El suelo se agrieta` : `¡La tormenta de arena cierra las ruinas!`);
    }
    phaseChange(e) {
      let t = this.run;
      if (e === 2) {
        t.setBaseWeather(`sun`);
        for (let e of this.fissures) e.mesh.visible = !0;
        (t.shake(0.6),
          t.audio.boom(1),
          t.animate(1.6, (e) => {
            this.open = e * e * (3 - 2 * e);
          }));
        for (let e of this.fissures)
          for (let [n, r] of e.pts.entries())
            n % 2 == 0 &&
              t.later(n * 0.035, () => t.vfx.dust(r.x, t.terrain.height(r.x, r.z), r.z, 9067066, 3, 5));
        this.eruptT = 4;
      }
      e === 3 && t.setBaseWeather(`sand`);
    }
    victory() {
      let e = this.run;
      ((this.eruption = null),
        e.setBaseWeather(`clear`),
        e.animate(2.5, (e) => {
          this.heat = 1 - e;
        }));
      let t = e.player.pos;
      for (let n = 0; n < 50; n++)
        e.vfx.norm.spawn({
          x: t.x + F.range(-16, 16),
          y: t.y + F.range(0, 6),
          z: t.z + F.range(-16, 16),
          vx: F.range(-3, 3),
          vy: F.range(0.5, 2),
          life: F.range(1.5, 3),
          size: F.range(1, 2.5),
          endSize: 3.5,
          color: cC,
          shape: I.PixPuff,
        });
      for (let n = 0; n < 40; n++)
        e.vfx.add.spawn({
          x: t.x + F.range(-14, 14),
          y: t.y + F.range(0, 8),
          z: t.z + F.range(-14, 14),
          vy: F.range(0.5, 2),
          life: F.range(1.5, 3),
          size: 0.4,
          endSize: 0,
          color: n % 3 ? 16762986 : 16777215,
          shape: I.Twinkle,
          glow: 1.2,
        });
    }
    onColumnBreak(e, t) {
      this.run.vfx.burst(e.x, t + 1, e.z, 13138506, 10, 6, I.PixRock, 0.6, 0.8);
    }
    ringHit(e, t, n) {
      this.run.vfx.burst(e, t + 1, n, cC, 10, 6, I.PixPuff, 0.6, 0.5);
    }
    minionFx(e, t, n) {
      this.run.vfx.dust(e, t, n, cC, 10, 5);
    }
    distTo(e, t, n) {
      let r = 1e9;
      for (let i = 1; i < e.pts.length; i++) {
        let a = e.pts[i - 1],
          o = e.pts[i],
          s = o.x - a.x,
          c = o.z - a.z,
          l = Gs(((t - a.x) * s + (n - a.z) * c) / (s * s + c * c || 1), 0, 1);
        r = Math.min(r, Math.hypot(a.x + s * l - t, a.z + c * l - n));
      }
      return r;
    }
    tickArena(e) {
      let t = this.run,
        n = t.player,
        r = n.pos,
        i = t.terrain;
      for (let t of this.fissures)
        ((t.erupt = Math.max(0, t.erupt - e * 1.5)),
          (t.mat.uniforms.uOpen.value = this.open),
          (t.mat.uniforms.uHeat.value = this.heat),
          (t.mat.uniforms.uErupt.value = t.erupt));
      if (this.open > 0.3 && this.heat > 0.2) {
        for (let n = 0, r = Math.floor(e * 24 + Math.random()); n < r; n++) {
          let e = F.pick(this.fissures),
            n = F.pick(e.pts),
            r = i.height(n.x, n.z);
          t.vfx.add.spawn({
            x: n.x + F.range(-0.5, 0.5),
            y: r + 0.2,
            z: n.z + F.range(-0.5, 0.5),
            vx: F.range(-0.3, 0.3),
            vy: F.range(1.5, 3.5),
            life: F.range(0.8, 1.5),
            size: 0.16,
            endSize: 0.04,
            color: Math.random() < 0.6 ? 16752698 : 16769162,
            shape: I.Soft,
            glow: 1,
          });
        }
        ((this.burnT -= e),
          this.phase < 4 &&
            this.burnT <= 0 &&
            r.y - i.height(r.x, r.z) < 0.6 &&
            this.fissures.some((e) => this.distTo(e, r.x, r.z) < 1.05 * this.open) &&
            ((this.burnT = 0.5),
            n.hurt(n.maxHp * 0.04, `fire`, -1, NaN, NaN, !0),
            t.vfx.burst(r.x, r.y + 0.4, r.z, 16747066, 6, 4, I.PixFlame, 0.5, 0.4)));
      }
      this.phase >= 2 &&
        this.phase < 4 &&
        t.boss.alive &&
        !this.eruption &&
        ((this.eruptT -= e),
        this.eruptT <= 0 && ((this.eruptT = this.phase >= 3 ? 5 : 7), this.startEruption()));
      let a = this.eruption;
      if (a) {
        a.t += e;
        let o = a.f;
        if (a.t < 1.2) {
          if (((o.erupt = Math.min(1, o.erupt + e * 3)), Math.random() < e * 40)) {
            let e = F.pick(o.pts);
            t.vfx.norm.spawn({
              x: e.x,
              y: i.height(e.x, e.z) + 0.3,
              z: e.z,
              vy: 1.5,
              life: 0.5,
              size: 0.5,
              endSize: 0.2,
              color: 16777215,
              endColor: 14707274,
              shape: I.PixFlame,
            });
          }
        } else if (a.t < 2.5) {
          o.erupt = 1;
          for (let n = 0, r = Math.floor(e * 70 + Math.random()); n < r; n++) {
            let e = F.pick(o.pts),
              n = i.height(e.x, e.z);
            (t.vfx.norm.spawn({
              x: e.x + F.range(-0.6, 0.6),
              y: n + 0.4,
              z: e.z + F.range(-0.6, 0.6),
              vy: F.range(6, 11),
              drag: 1.2,
              life: F.range(0.4, 0.7),
              size: F.range(1.2, 1.9),
              endSize: 0.5,
              color: 16777215,
              endColor: 14707274,
              shape: I.PixFlame,
              rot: F.range(-0.2, 0.2),
            }),
              Math.random() < 0.15 &&
                t.vfx.norm.spawn({
                  x: e.x,
                  y: n + 0.5,
                  z: e.z,
                  vx: F.range(-3, 3),
                  vy: F.range(7, 12),
                  vz: F.range(-3, 3),
                  gravity: 24,
                  life: 0.9,
                  size: 0.5,
                  endSize: 0.4,
                  color: 16777215,
                  shape: I.PixRock,
                  spin: 6,
                }));
          }
          !a.hit &&
            r.y - i.height(r.x, r.z) < 2.6 &&
            this.distTo(o, r.x, r.z) < 2.3 &&
            ((a.hit = !0), n.hurt(n.maxHp * 0.09, `fire`, -1));
        } else this.eruption = null;
      }
      (this.ringT >= 0 && this.sandstorm(e), this.ambience(e));
    }
    startEruption() {
      let e = this.run,
        t = e.player.pos,
        n = this.fissures[0],
        r = 1e9;
      for (let e of this.fissures) {
        let i = this.distTo(e, t.x, t.z);
        i < r && ((r = i), (n = e));
      }
      this.eruption = { f: n, t: 0, hit: !1 };
      for (let [t, r] of n.pts.entries())
        t % 2 == 0 &&
          e.vfx.ground.spawn({
            x: r.x,
            y: e.terrain.height(r.x, r.z) + 0.12,
            z: r.z,
            life: 1.2,
            size: 4.6,
            endSize: 4.6,
            color: 16738858,
            shape: I.Soft,
            glow: 0,
            rot: 0,
          });
      (e.audio.alarm(),
        e.later(1.2, () => {
          (e.audio.boom(0.9), e.shake(0.4));
        }));
    }
    sandstorm(e) {
      let t = this.run,
        n = t.terrain,
        r = t.player.pos,
        i = Math.atan2(r.z, r.x),
        a = t.r.camera.position;
      for (let r = 0, o = Math.floor(e * 150 + Math.random()); r < o; r++) {
        let e = Math.random() < 0.6 ? i + F.range(-0.7, 0.7) : F.range(0, Math.PI * 2),
          r = this.ringR + F.range(0.4, 4),
          o = Math.cos(e) * r,
          s = Math.sin(e) * r,
          c = -Math.sin(e),
          l = Math.cos(e),
          u = n.height(o, s) + F.range(0, 6);
        (o - a.x) ** 2 + (u - a.y) ** 2 + (s - a.z) ** 2 < 36 ||
          t.vfx.norm.spawn({
            x: o,
            y: u,
            z: s,
            vx: c * 9 - Math.cos(e) * 0.8,
            vy: F.range(-0.3, 0.6),
            vz: l * 9 - Math.sin(e) * 0.8,
            life: F.range(0.8, 1.4),
            size: F.range(0.7, 1.5),
            endSize: F.range(1.8, 2.6),
            color: Math.random() < 0.7 ? cC : 12094042,
            shape: Math.random() < 0.6 ? I.PixPuff : I.Soft,
          });
      }
    }
    ambience(e) {
      let t = this.run,
        n = t.r.camera.position,
        r = t.terrain;
      for (let i = 0, a = Math.floor(e * 18 + Math.random()); i < a; i++) {
        let e = n.x + F.range(-20, 20),
          i = n.z + F.range(-20, 20);
        t.vfx.norm.spawn({
          x: e,
          y: r.height(e, i) + F.range(0.3, 5),
          z: i,
          vx: F.range(2, 4),
          vy: F.range(-0.2, 0.2),
          vz: F.range(0.5, 1.5),
          life: F.range(2, 3.5),
          size: 0.12,
          endSize: 0.12,
          color: 15784104,
          shape: I.Soft,
        });
      }
      for (let n of this.layout.lanterns) {
        if (Math.random() > e * 14) continue;
        let i = r.height(n.x, n.z) + 3.7;
        (t.vfx.norm.spawn({
          x: n.x + F.range(-0.3, 0.3),
          y: i,
          z: n.z + F.range(-0.3, 0.3),
          vy: F.range(1, 2),
          life: 0.5,
          size: 0.7,
          endSize: 0.2,
          color: 16777215,
          endColor: 14707274,
          shape: I.PixFlame,
        }),
          Math.random() < 0.4 &&
            t.vfx.add.spawn({
              x: n.x,
              y: i + 0.6,
              z: n.z,
              vx: F.range(-0.4, 0.4),
              vy: F.range(1, 2.5),
              life: 1.2,
              size: 0.12,
              endSize: 0,
              color: 16760938,
              shape: I.Soft,
              glow: 1,
            }));
      }
    }
    dispose() {
      super.dispose();
      for (let e of this.fissures) e.mat.dispose();
    }
  },
  uC = Math.PI / 180,
  dC = [30, 150, 270].map((e) => ({ ...qS(e, 29), r: 6.5, ramp: (e + 90) * uC })),
  fC = [45, 135, 225, 315].map((e) => qS(e, 19)),
  pC = fC.map((e) => ({ ...e, r: 3.4, ramp: NaN, h: 1.4 })),
  mC = [0, 60, 120, 180, 240, 300].map((e) => qS(e, 12.5)),
  hC = [10, 70, 190, 250, 330].map((e) => qS(e, 37)),
  gC = {
    pack: `stormcape`,
    world: 150,
    radius: 48,
    plateaus: [...dC, ...pC],
    dais: 7,
    flags: [...mC, ...hC].map((e) => ({ ...e, r: 3 })),
    bigTrees: [qS(200, 34), qS(340, 34)],
    lanterns: [0, 120, 240].map((e) => qS(e, 9.5)),
    entry: { x: 0, z: 39 },
    undergrowth: 300,
  },
  _C = 0.8,
  vC = 0.12,
  yC = 16769594,
  bC = class extends JS {
    rods = [];
    tide = 0;
    tideTo = 0;
    tideT = 0;
    charge = 0;
    water;
    waterMat;
    floorY;
    eye = { x: 0, z: 0, a: 0, r: 7.5, on: !1 };
    strikeT = 1;
    ambT = 0;
    constructor(e, t) {
      (super(e, t, {
        layout: gC,
        columns: [...mC, ...hC],
        pillar: `storm_pillar`,
        gate: `storm_gate`,
        ringEnd: 31,
        stone: 5922928,
      }),
        (this.ringType = `electric`));
      let n = e.terrain;
      this.floorY = n.height(0, 30);
      for (let e of fC) {
        let t = n.height(e.x, e.z),
          r = t + 6.4;
        (n.addCollider({ x: e.x, z: e.z, r: 1.7, h: t + 1.2, standY:t+1.2 }),
          n.addCollider({ x: e.x, z: e.z, r: 0.45, h: r, standY:r }),
          n.reserve(e.x, e.z, 3.6),
          this.addCover({ x: e.x, z: e.z, r: 0.45, top: r, breakable: !1, hp: 1, kind: `rod` }));
        let i = {
          x: e.x,
          z: e.z,
          y: t,
          top: r,
          charge: 0,
          active: !1,
          cd: 0,
          flash: 0,
          g: new Cr(),
          mats: [],
        };
        ((i.g = this.model(`storm_rod`, e.x, e.z, F.range(0, Math.PI * 2), 1, (e) => {
          e.traverse((e) => {
            let t = e;
            if (!t.isMesh || !/^Charge\d/.test(e.name)) return;
            let n = t.material.clone();
            ((t.material = n), (i.mats[+e.name.slice(6)] = n));
          });
        })),
          this.rods.push(i));
      }
      for (let e of [0, 2].map((e) => (e + F.int(0, 1)) % 4)) this.rods[e].active = !0;
      for (let [e, t, n, r] of [
        [60, 55, `storm_tower`, 1],
        [168, 57, `storm_tower`, 0.9],
        [300, 56, `storm_tower`, 1.05],
        [20, 60, `coast_stack`, 1.8],
        [115, 60, `coast_stack`, 1.6],
        [230, 59, `coast_stack`, 2],
        [275, 62, `coast_stack`, 1.7],
      ]) {
        let i = qS(e, t);
        this.model(n, i.x, i.z, F.range(0, Math.PI * 2), r);
      }
      ((this.waterMat = this.makeWater()),
        (this.water = new Tr(new Nr(gC.radius + 1, 64).rotateX(-Math.PI / 2), this.waterMat)),
        (this.water.position.y = this.floorY - 0.5),
        (this.water.renderOrder = 2),
        (this.water.visible = !1),
        this.group.add(this.water),
        e.setBaseWeather(`rain`));
    }
    makeWater() {
      let e = this.run.terrain,
        t = new Uint16Array(9216),
        n = gC.radius + 1;
      for (let r = 0; r < 96; r++)
        for (let i = 0; i < 96; i++)
          t[r * 96 + i] = kr.toHalfFloat(e.height((i / 95 - 0.5) * 2 * n, (r / 95 - 0.5) * 2 * n));
      let r = new vr(t, 96, 96, ri, Er);
      return (
        (r.magFilter = r.minFilter = Fr),
        (r.needsUpdate = !0),
        new Kr({
          transparent: !0,
          depthWrite: !1,
          uniforms: {
            uTime: this.run.r.shared.uTime,
            tH: { value: r },
            uR: { value: n },
            uLevel: { value: 0 },
            uCharge: { value: 0 },
            uFogColor: this.run.r.shared.uFogColor,
            uFogNear: this.run.r.shared.uFogNear,
            uFogFar: this.run.r.shared.uFogFar,
          },
          vertexShader: `varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
          fragmentShader: `
        uniform float uTime, uR, uLevel, uCharge, uFogNear, uFogFar; uniform sampler2D tH; uniform vec3 uFogColor;
        varying vec3 vW; varying float vD;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
        void main(){
          float depth = uLevel - texture2D(tH, vW.xz / (2. * uR) + 0.5).r;
          if (depth < 0.) discard;
          vec2 px = floor(vW.xz * 8.) / 8.;
          float r1 = vnoise(px * 0.8 + vec2(uTime * 0.7, uTime * 0.3)), r2 = vnoise(px * 1.2 - vec2(uTime * 0.4, -uTime * 0.6));
          vec3 col = mix(vec3(0.42, 0.86, 0.92), vec3(0.1, 0.36, 0.62), smoothstep(0., 0.9, depth));
          col = mix(col, col * 1.18, step(0.6, (r1 + r2) * 0.5));
          float foam = step(depth, 0.1 + 0.05 * sin(uTime * 2. + r1 * 6.));
          col = mix(col, vec3(1.), foam * 0.85);
          col += vec3(0.9, 1., 1.) * step(0.9, r1 * r2 * 1.9) * 0.7;
          // Electrified: jagged yellow veins that flicker, and a sickly glow.
          float vein = abs(vnoise(px * 0.35 + vec2(floor(uTime * 12.) * 3.1)) - 0.5);
          col = mix(col, vec3(1., 0.95, 0.35), uCharge * (step(vein, 0.03) + 0.25));
          gl_FragColor = vec4(mix(col, uFogColor, smoothstep(uFogNear, uFogFar, vD)), mix(0.72, 0.9, smoothstep(0., 0.6, depth)) + foam * 0.1);
          #include <colorspace_fragment>
        }`,
        })
      );
    }
    phaseSub(e) {
      return c(
        e === 2 ? `¡Marea de tormenta! El mar inunda el cabo` : `¡El ojo de la tormenta! Quédate en la calma`,
      );
    }
    phaseChange(e) {
      let t = this.run;
      (e === 2 &&
        ((this.water.visible = !0),
        (this.tideTo = _C),
        (this.tideT = 24),
        t.audio.cone(`water`, 2),
        t.shake(0.4),
        t.ui.toast(
          c(`Sube la marea: el agua te frena. Las mesetas y los islotes de los pararrayos quedan secos`),
          null,
        )),
        e === 3 &&
          ((this.eye.on = !0),
          (this.eye.x = 0),
          (this.eye.z = 0),
          (this.eye.a = F.range(0, Math.PI * 2)),
          t.ui.toast(
            c(
              `Fuera del ojo caen rayos sin parar; el Trueno Supremo solo se esquiva en el ojo o junto a un pararrayos activo`,
            ),
            null,
          )));
    }
    victory() {
      let e = this.run;
      ((this.eye.on = !1), (this.tideTo = 0), (this.charge = 0), e.setBaseWeather(`clear`));
      for (let e of this.rods) ((e.active = !1), (e.charge = 0));
      let t = e.player.pos;
      for (let n = 0; n < 40; n++)
        e.vfx.add.spawn({
          x: t.x + F.range(-14, 14),
          y: t.y + F.range(0, 8),
          z: t.z + F.range(-14, 14),
          vy: F.range(0.5, 2),
          life: F.range(1.5, 3),
          size: 0.4,
          endSize: 0,
          color: n % 3 ? yC : 16777215,
          shape: I.Twinkle,
          glow: 1.2,
        });
    }
    onColumnBreak(e, t) {
      this.run.vfx.burst(e.x, t + 1, e.z, 4870240, 10, 6, I.PixRock, 0.6, 0.8);
    }
    ringHit(e, t, n) {
      this.run.vfx.lightning(e, t + 8, n, e, t, n, yC, 0.4, 6, 0.2);
    }
    minionFx(e, t, n) {
      this.run.vfx.burst(e, t + 0.5, n, 10148095, 10, 5, I.PixDrop, 0.5, 0.5, 10);
    }
    rodNear(e, t, n = 4) {
      let r = null,
        i = n;
      for (let n of this.rods) {
        if (!n.active) continue;
        let a = Math.hypot(n.x - e, n.z - t);
        a < i && ((i = a), (r = n));
      }
      return r;
    }
    hitRod(e, t = 1) {
      let n = this.run;
      (n.vfx.lightning(
        e.x + F.range(-2, 2),
        e.top + 22,
        e.z + F.range(-2, 2),
        e.x,
        e.top,
        e.z,
        16777215,
        0.6,
        9,
        0.25,
      ),
        n.vfx.lightning(e.x, e.top + 18, e.z, e.x, e.top, e.z, yC, 0.35, 7, 0.3),
        n.vfx.flash(e.x, e.top, e.z, yC, 5, 0.2),
        n.audio.boom(0.7),
        (e.charge = Math.min(3, e.charge + t)),
        (e.flash = 1),
        n.ui.popup(
          e.x,
          e.top + 1,
          e.z,
          e.charge >= 3 ? c(`¡Sobrecarga!`) : c(`Pararrayos {n}/3`, { n: e.charge }),
          `#ffe23a`,
          1,
        ),
        e.charge >= 3 && n.later(0.45, () => this.discharge(e)));
    }
    discharge(e) {
      let t = this.run,
        n = t.boss,
        r = t.enemies,
        i = n.bossIndex;
      if (((e.charge = 0), (e.active = !1), (e.cd = 16), n.alive && n.kit)) {
        for (let a = 0; a < 4; a++)
          t.later(a * 0.08, () => {
            n.alive &&
              t.vfx.lightning(
                e.x,
                e.top,
                e.z,
                r.x[i],
                r.y[i] + 1.5,
                r.z[i],
                a % 2 ? 16777215 : yC,
                0.7,
                10,
                0.3,
              );
          });
        (t.hitstop(0.12), t.shake(0.6), n.kit.downed?.(6));
      }
      let a = this.rods.filter((t) => !t.active && t.cd <= 0 && t !== e);
      if (a.length) {
        let e = F.pick(a);
        ((e.active = !0),
          (e.flash = 1),
          t.ui.popup(e.x, e.top + 1, e.z, c(`¡Pararrayos activo!`), `#ffe23a`, 0.9));
      }
    }
    dry() {
      let e = this.run.player.pos,
        t = this.run.terrain.height(e.x, e.z);
      return t > this.floorY + this.tide + 0.05 || e.y - t > 0.6;
    }
    get level() {
      return this.tide > 0.02 ? this.floorY + this.tide : -1 / 0;
    }
    shockSea(e, t) {
      let n = this.run,
        r = n.enemies;
      n.animate(
        e,
        (e) => {
          this.charge = e;
        },
        () => {
          ((this.charge = 1),
            n.vfx.flash(0, this.floorY + 2, 0, yC, 60, 0.25),
            n.shake(0.5),
            n.audio.boom(1));
          for (let e = 0; e < 16; e++) {
            let e = F.range(0, Math.PI * 2),
              t = F.range(4, 44),
              r = Math.cos(e) * t,
              i = Math.sin(e) * t;
            n.vfx.lightning(
              r,
              this.floorY + 3,
              i,
              r + F.range(-3, 3),
              this.floorY + 0.2,
              i + F.range(-3, 3),
              yC,
              0.3,
              4,
              0.2,
            );
          }
          this.dry()
            ? n.ui.popup(
                n.player.pos.x,
                n.player.pos.y + 2.4,
                n.player.pos.z,
                c(`¡A salvo del agua!`),
                `#7aff8a`,
                0.9,
              )
            : t();
          let e = this.level;
          for (let t = 0; t < r.n; t++)
            r.alive[t] &&
              !(r.flags[t] & (R.Boss | R.Object)) &&
              r.y[t] < e + 0.3 &&
              n.combat.hit(t, r.maxHp[t] * 0.6, { type: `electric`, cls: `special`, fixed: !0, silent: !0 });
          n.later(0.5, () => {
            this.charge = 0;
          });
        },
      );
    }
    tickArena(e) {
      let t = this.run,
        n = t.player,
        r = n.pos,
        i = t.terrain;
      if (this.phase >= 2 && this.phase < 4 && ((this.tideT -= e), this.tideT <= 0)) {
        let e = this.tideTo >= _C;
        ((this.tideTo = e ? vC : _C),
          (this.tideT = e ? 7 : 24),
          t.ui.toast(c(e ? `Bajamar: el agua se retira un momento` : `¡Vuelve a subir la marea!`), null));
      }
      ((this.tide += Gs(this.tideTo - this.tide, -e * 0.25, e * 0.25)),
        (this.water.visible = this.tide > 0.02),
        (this.water.position.y = this.floorY + this.tide),
        (this.waterMat.uniforms.uLevel.value = this.floorY + this.tide),
        (this.waterMat.uniforms.uCharge.value = this.charge * (0.6 + 0.4 * Math.sin(t.time * 40))),
        this.tide > 0.25 &&
          !this.dry() &&
          ((n.arenaSlow = Math.min(n.arenaSlow, n.types.includes(`water`) ? 1.1 : 0.8)),
          n.speedNow > 1 &&
            Math.random() < e * 5 &&
            t.vfx.ring(r.x, this.floorY + this.tide + 0.03, r.z, 1.1, 9099519, 0.45, 0.3)));
      for (let n of this.rods) {
        ((n.cd = Math.max(0, n.cd - e)), (n.flash = Math.max(0, n.flash - e * 2)));
        for (let e = 0; e < 3; e++) {
          let r = n.mats[e];
          r &&
            r.emissiveIntensity !== void 0 &&
            (r.emissiveIntensity = n.charge > e ? 2.2 + Math.sin(t.time * 12) * 0.4 : n.active ? 0.35 : 0.04);
        }
        (n.active &&
          Math.random() < e * 6 &&
          t.vfx.lightning(
            n.x,
            n.top,
            n.z,
            n.x + F.range(-1.2, 1.2),
            n.top - F.range(0.5, 2),
            n.z + F.range(-1.2, 1.2),
            yC,
            0.12,
            3,
            0.1,
          ),
          n.active && t.orbitals.push(n.x, n.top + 0.4, n.z, 1 + n.flash, yC, I.Twinkle, t.time * 3, 1),
          n.active &&
            this.phase >= 1 &&
            this.phase < 4 &&
            t.vfx.staticRing(n.x, n.y + 0.05, n.z, 4, yC, 0.35 + n.charge * 0.15));
      }
      let a = this.eye;
      if (a.on && this.phase === 3) {
        ((a.a += F.range(-0.6, 0.6) * e), (a.x += Math.cos(a.a) * 2.4 * e), (a.z += Math.sin(a.a) * 2.4 * e));
        let o = Math.hypot(a.x, a.z),
          s = Math.min(30, this.ringR - a.r - 1);
        o > s && ((a.a = Math.atan2(-a.z, -a.x) + F.range(-0.5, 0.5)), (a.x *= s / o), (a.z *= s / o));
        let c = i.height(a.x, a.z);
        if ((t.vfx.staticRing(a.x, c + 0.1, a.z, a.r, 10158040, 0.8), Math.random() < e * 14)) {
          let e = F.range(0, Math.PI * 2),
            n = F.range(0, a.r);
          t.vfx.add.spawn({
            x: a.x + Math.cos(e) * n,
            y: c + F.range(0.2, 2),
            z: a.z + Math.sin(e) * n,
            vy: 0.6,
            life: 1.2,
            size: 0.2,
            endSize: 0,
            color: 14221296,
            shape: I.Twinkle,
            glow: 0.8,
          });
        }
        if (((this.strikeT -= e), this.strikeT <= 0 && t.boss.alive)) {
          this.strikeT = 0.38;
          let e = r.x + F.range(-13, 13) + n.vel.x * 0.6,
            t = r.z + F.range(-13, 13) + n.vel.z * 0.6;
          Math.hypot(e - a.x, t - a.z) > a.r + 1 &&
            Math.hypot(e, t) < this.ringR - 1 &&
            this.stormStrike(e, t);
        }
      }
      (this.ringT >= 0 && this.stormWall(e), this.ambience(e));
    }
    stormStrike(e, t) {
      let n = this.run,
        r = n.terrain,
        i = r.height(e, t),
        a = 2.6,
        o = 0.9,
        s = this.rodNear(e, t, 3.5);
      s
        ? (n.later(o, () => this.hitRod(s)), n.vfx.telegraph(s.x, s.y, s.z, 2, yC, o))
        : (n.vfx.telegraph(e, i, t, a, yC, o),
          n.later(o, () => {
            (n.vfx.lightning(e + F.range(-2, 2), i + 24, t + F.range(-2, 2), e, i, t, 16777215, 0.45, 8, 0.2),
              n.vfx.burst(e, i + 0.3, t, yC, 10, 6, I.PixBolt, 0.5, 0.4),
              n.vfx.ring(e, i, t, a, yC, 0.3));
            let o = n.player.pos;
            ((o.x - e) ** 2 + (o.z - t) ** 2 < a * a &&
              o.y - r.height(o.x, o.z) < 1.6 &&
              n.player.hurt(n.player.maxHp * 0.08, `electric`, -1, NaN, NaN, !1, 0.2),
              this.blast(e, t, a, 6));
          }));
    }
    stormWall(e) {
      let t = this.run,
        n = t.terrain,
        r = t.player.pos,
        i = Math.atan2(r.z, r.x),
        a = t.r.camera.position;
      for (let r = 0, o = Math.floor(e * 120 + Math.random()); r < o; r++) {
        let e = Math.random() < 0.6 ? i + F.range(-0.7, 0.7) : F.range(0, Math.PI * 2),
          r = this.ringR + F.range(0.3, 4),
          o = Math.cos(e) * r,
          s = Math.sin(e) * r,
          c = n.height(o, s) + F.range(0, 7);
        (o - a.x) ** 2 + (c - a.y) ** 2 + (s - a.z) ** 2 < 36 ||
          t.vfx.norm.spawn({
            x: o,
            y: c,
            z: s,
            vx: -Math.sin(e) * 6,
            vy: -14,
            vz: Math.cos(e) * 6,
            life: 0.6,
            size: 0.25,
            endSize: 0.25,
            color: 12114175,
            shape: I.Drop,
            rot: Math.PI,
          });
      }
      if (Math.random() < e * 3) {
        let e = i + F.range(-1, 1),
          r = Math.cos(e) * (this.ringR + 2),
          a = Math.sin(e) * (this.ringR + 2),
          o = n.height(r, a);
        t.vfx.lightning(r, o + 20, a, r, o, a, yC, 0.4, 7, 0.18);
      }
    }
    ambience(e) {
      let t = this.run,
        n = t.terrain;
      for (let r of this.layout.lanterns) {
        if (Math.random() > e * 4) continue;
        let i = n.height(r.x, r.z) + 3.9;
        t.vfx.lightning(
          r.x,
          i,
          r.z,
          r.x + F.range(-1.5, 1.5),
          i + F.range(-1, 1),
          r.z + F.range(-1.5, 1.5),
          yC,
          0.12,
          3,
          0.1,
        );
      }
      if (((this.ambT -= e), this.ambT <= 0 && this.phase < 4)) {
        this.ambT = F.range(2, 5);
        let e = F.range(0, Math.PI * 2),
          r = F.range(70, 95),
          i = Math.cos(e) * r,
          a = Math.sin(e) * r;
        t.vfx.lightning(
          i,
          45,
          a,
          i + F.range(-6, 6),
          n.height(i, a),
          a + F.range(-6, 6),
          14215423,
          0.8,
          9,
          0.2,
        );
      }
    }
    dispose() {
      (super.dispose(), this.waterMat.uniforms.tH.value.dispose(), this.waterMat.dispose());
    }
  },
  xC = Math.PI / 180,
  SC = [30, 150, 270].map((e) => ({ ...qS(e, 31), r: 6, ramp: (e + 90) * xC })),
  CC = [0, 60, 120, 180, 240, 300].map((e) => qS(e, 14.5)),
  wC = [25, 160, 205, 250, 335].map((e) => qS(e, 26)),
  TC = {
    pack: `frostlake`,
    world: 150,
    radius: 48,
    plateaus: SC,
    dais: 7,
    flags: [],
    bigTrees: [qS(110, 41), qS(320, 41)],
    lanterns: [0, 120, 240].map((e) => qS(e, 9.5)),
    entry: { x: 0, z: 39 },
    undergrowth: 320,
    lake: 37,
  },
  EC = 9103615,
  DC = class extends JS {
    floorY;
    spots = [];
    frost = 0;
    frostPopT = 0;
    crystals = [];
    windA = 0;
    windT = 0;
    iceMat;
    sectorMat;
    holeHurtT = 0;
    holeSaid = !1;
    auroraT = 0;
    constructor(e, t) {
      (super(e, t, {
        layout: TC,
        columns: [...CC, ...wC],
        pillar: `frost_pillar`,
        gate: `frost_gate`,
        ringEnd: 30,
        stone: 12577023,
      }),
        (this.ringType = `ice`));
      let n = e.terrain;
      this.floorY = n.height(0, 22);
      for (let [e, t, n, r] of [
        [15, 57, `glacier_spire`, 2.2],
        [75, 59, `glacier_pillar`, 1.8],
        [140, 56, `glacier_spire`, 2.5],
        [200, 58, `glacier_spire`, 2],
        [250, 57, `glacier_pillar`, 2],
        [300, 60, `glacier_spire`, 2.4],
        [345, 58, `glacier_pillar`, 1.7],
      ]) {
        let i = qS(e, t);
        this.model(n, i.x, i.z, F.range(0, Math.PI * 2), r);
      }
      this.iceMat = this.makeIce();
      let r = new Tr(new Nr(37.6, 96).rotateX(-Math.PI / 2), this.iceMat);
      ((r.position.y = this.floorY + 0.06),
        (r.renderOrder = 1),
        this.group.add(r),
        (this.sectorMat = this.makeSectors()));
      let i = new Tr(new Nr(39, 96).rotateX(-Math.PI / 2), this.sectorMat);
      ((i.position.y = this.floorY + 0.14), (i.renderOrder = 3), this.group.add(i));
    }
    heightTex() {
      let e = this.run.terrain,
        t = new Uint16Array(9216);
      for (let n = 0; n < 96; n++)
        for (let r = 0; r < 96; r++)
          t[n * 96 + r] = kr.toHalfFloat(e.height((r / 95 - 0.5) * 2 * 39, (n / 95 - 0.5) * 2 * 39));
      let n = new vr(t, 96, 96, ri, Er);
      return ((n.magFilter = n.minFilter = Fr), (n.needsUpdate = !0), n);
    }
    makeIce() {
      let e = this.run.r.shared;
      return new Kr({
        uniforms: {
          uTime: e.uTime,
          tH: { value: this.heightTex() },
          uR: { value: 39 },
          uFloor: { value: this.floorY },
          uLake: { value: 37 },
          uSpots: { value: Array.from({ length: 16 }, () => new $r(0, 0, 0, 0)) },
          uFogColor: e.uFogColor,
          uFogNear: e.uFogNear,
          uFogFar: e.uFogFar,
        },
        vertexShader: `varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `
        uniform float uTime, uR, uFloor, uLake, uFogNear, uFogFar; uniform sampler2D tH; uniform vec4 uSpots[16]; uniform vec3 uFogColor;
        varying vec3 vW; varying float vD;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
        void main(){
          if (texture2D(tH, vW.xz / (2. * uR) + 0.5).r > uFloor + 0.22) discard;
          vec2 ip = floor(vW.xz * 13.5);
          float rr = length(vW.xz);
          vec3 c = mix(vec3(0.62, 0.84, 0.98), vec3(0.42, 0.68, 0.94), smoothstep(uLake - 2., 8., rr));
          float pv = vnoise(ip * 0.02 + 4.) * 0.7 + vnoise(ip * 0.07) * 0.3;
          c *= pv > 0.62 ? 1.06 : pv < 0.38 ? 0.92 : 1.;
          // The frosted shore.
          c = mix(c, vec3(0.9, 0.95, 1.), step(uLake - 1.6 + vnoise(ip * 0.08) * 1.4, rr));
          // Fight spots: cracks (star of jagged lines) and holes (dark water with a white broken rim).
          for (int k = 0; k < 16; k++) {
            vec4 s = uSpots[k];
            if (s.z <= 0.) continue;
            vec2 d = vW.xz - s.xy; float dl = length(d);
            if (dl > s.z * 1.25) continue;
            float a = atan(d.y, d.x), jag = vnoise(vec2(a * 3. + s.x, dl * 2.)) * 0.35;
            if (s.w > 1.) {
              float open = (s.w - 1.) * s.z;
              float edge = open * (0.85 + jag);
              if (dl < edge) {
                float w = vnoise(vec2(ip * 0.15) + vec2(uTime * 0.6, uTime * 0.4));
                c = mix(vec3(0.06, 0.2, 0.42), vec3(0.14, 0.38, 0.62), step(0.6, w));
                c = mix(c, vec3(0.85, 0.95, 1.), step(edge - 0.18, dl));
              } else if (dl < edge + 0.35) c = vec3(0.97, 0.99, 1.);
            }
            // Radial cracks: eight wobbly spokes plus a ring.
            float spoke = abs(fract(a / 6.283 * 8. + vnoise(vec2(dl * 1.5, s.y)) * 0.3) - 0.5);
            float crack = step(spoke, 0.035 / max(dl, 0.3)) * step(dl, s.z * min(1., s.w + 0.4));
            crack += step(abs(dl - s.z * 0.55), 0.06) * step(0.4, vnoise(vec2(a * 5., s.x)));
            c = mix(c, vec3(0.2, 0.42, 0.72), clamp(crack, 0., 1.) * min(1., s.w * 2.));
          }
          float g = hash(ip + 0.31), tw = step(0.8, fract(g * 9.1 + uTime * (0.25 + g * 0.5)));
          c = mix(c, vec3(1.), step(0.996, g) * tw);
          gl_FragColor = vec4(mix(c, uFogColor, smoothstep(uFogNear, uFogFar, vD)), 1.);
          #include <colorspace_fragment>
        }`,
      });
    }
    makeSectors() {
      return new Kr({
        transparent: !0,
        depthWrite: !1,
        uniforms: {
          uTime: this.run.r.shared.uTime,
          uOn: { value: 0 },
          uK: { value: 0 },
          uSafe: { value: Array(9).fill(1) },
          uBurst: { value: 0 },
        },
        vertexShader: `varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `
        uniform float uTime, uOn, uK, uBurst; uniform float uSafe[9]; varying vec2 vP;
        void main(){
          if (uOn < 0.01) discard;
          float r = length(vP);
          int s = r < 8. ? 8 : int(mod(floor((atan(vP.y, vP.x) + 3.14159265) / 0.78539816), 8.));
          float safe = 0.;
          for (int k = 0; k < 9; k++) if (k == s) safe = uSafe[k];
          vec2 px = floor(vP * 6.) / 6.;
          float a = atan(vP.y, vP.x) + 3.14159265, edgeA = abs(fract(a / 0.78539816 + 0.5) - 0.5) * 0.78539816 * r;
          float edge = r < 8. ? 8. - r : min(edgeA, abs(r - 8.));
          if (safe > 0.5) {
            float rim = step(edge, 0.35);
            gl_FragColor = vec4(1., 0.86, 0.35, rim * 0.85 * uOn);
          } else {
            float pulse = 0.35 + 0.35 * sin(uTime * (8. + uK * 18.));
            vec3 c = mix(vec3(0.45, 0.8, 1.), vec3(1.), uBurst);
            gl_FragColor = vec4(c, (0.3 + pulse * 0.3 + uK * 0.3 + uBurst * 0.6 + step(edge, 0.3) * 0.4) * uOn);
          }
        }`,
      });
    }
    phaseSub(e) {
      return c(
        e === 2
          ? `¡Ventisca! El viento te empuja sobre el hielo`
          : `¡Frío Absoluto! El lago se congela por sectores`,
      );
    }
    phaseChange(e) {
      let t = this.run;
      (e === 2 && (t.setBaseWeather(`hail`), (this.windA = F.range(0, Math.PI * 2)), (this.windT = 7)),
        e === 3 &&
          t.ui.toast(c(`Frío Absoluto: cuando el lago brille, ve a un sector con borde dorado`), null));
    }
    victory() {
      let e = this.run;
      (e.setBaseWeather(`clear`), (this.frost = 0), this.sectors(!1));
      for (let e of this.crystals) this.breakCrystal(e, !1);
      for (let e of this.spots) e.t = Math.min(e.t, 3);
      let t = e.player.pos;
      for (let n = 0; n < 50; n++)
        e.vfx.add.spawn({
          x: t.x + F.range(-16, 16),
          y: t.y + F.range(0, 8),
          z: t.z + F.range(-16, 16),
          vy: F.range(0.3, 1.2),
          life: F.range(1.5, 3),
          size: 0.45,
          endSize: 0,
          color: n % 3 ? EC : 16777215,
          shape: I.Twinkle,
          glow: 1.2,
        });
    }
    onColumnBreak(e, t) {
      (this.run.vfx.burst(e.x, t + 2, e.z, 12580095, 20, 8, I.Shard, 0.7, 0.8, 14),
        this.run.audio.shot(`ice`, 0.8));
    }
    ringHit(e, t, n) {
      this.run.vfx.burst(e, t + 1, n, 16777215, 10, 6, I.PixSnow, 0.6, 0.5);
    }
    minionFx(e, t, n) {
      this.run.vfx.burst(e, t + 0.5, n, 16777215, 10, 5, I.PixSnow, 0.5, 0.5);
    }
    onLake(e, t) {
      return Math.hypot(e, t) < 37 && this.run.terrain.height(e, t) < this.floorY + 0.22;
    }
    crack(e, t, n = 2.6) {
      if (!this.onLake(e, t)) return;
      let r = this.spots.find((r) => Math.hypot(r.x - e, r.z - t) < r.r * 0.9 + n * 0.4);
      r && !r.hole
        ? ((r.hole = !0),
          (r.t = 16),
          (r.r = Math.max(r.r, n)),
          this.run.vfx.burst(r.x, this.floorY + 0.3, r.z, 14218495, 22, 7, I.Shard, 0.6, 0.6, 14),
          this.run.vfx.burst(r.x, this.floorY + 0.2, r.z, 6994175, 14, 5, I.PixDrop, 0.5, 0.5, 12),
          this.run.audio.shot(`ice`, 1))
        : r
          ? (r.t = Math.max(r.t, 12))
          : (this.spots.length >= 16 && this.spots.sort((e, t) => e.t - t.t).shift(),
            this.spots.push({ x: e, z: t, r: n, hole: !1, t: 28, open: 0 }),
            this.run.vfx.burst(e, this.floorY + 0.2, t, 16777215, 10, 5, I.Shard, 0.4, 0.4, 12));
    }
    slipAt(e, t) {
      return this.onLake(e, t) && !this.inHole(e, t) ? 0.75 : 0;
    }
    inHole(e, t) {
      return this.spots.some(
        (n) => n.hole && n.open > 0.5 && Math.hypot(n.x - e, n.z - t) < n.r * n.open * 0.85,
      );
    }
    raiseCrystals(e, t) {
      let n = this.run,
        r = n.boss,
        i = n.enemies,
        a = r.bossIndex;
      if (!r.alive) return;
      let o = [];
      for (let t = 0; t < 200 && o.length < e; t++) {
        let e = F.range(0, Math.PI * 2),
          t = F.range(13, 32),
          n = Math.cos(e) * t,
          r = Math.sin(e) * t;
        !this.onLake(n, r) ||
          o.some((e) => Math.hypot(e.x - n, e.z - r) < 12) ||
          this.covers.some((e) => e.alive && Math.hypot(e.x - n, e.z - r) < e.r + 3) ||
          o.push({ x: n, z: r });
      }
      for (let e of o) {
        let r = i.spawn(144, e.x, e.z, 1, 0, R.Object);
        if (r < 0) continue;
        ((i.hp[r] = i.maxHp[r] = Math.max(1, i.maxHp[a] * t)),
          (i.dmg[r] = 0),
          (i.speed[r] = 0),
          (i.xp[r] = 0),
          (i.radius[r] = 1.3),
          (i.hgt[r] = 3.4),
          (i.sized[r] = 1));
        let o = this.model(`frost_crystal`, e.x, e.z, F.range(0, Math.PI * 2), 1);
        ((o.position.y -= 3.6),
          n.animate(0.8, (e) => {
            o.position.y = this.floorY - 3.6 * (1 - e);
          }),
          n.vfx.burst(e.x, this.floorY + 1, e.z, 14218495, 26, 8, I.Shard, 0.7, 0.7, 12),
          this.crack(e.x, e.z, 3.2),
          this.crystals.push({
            o: { j: r, g: i.gen[r] },
            x: e.x,
            z: e.z,
            g: o,
            pulse: F.range(2.5, 4.5),
            ring: -1,
            hit: !1,
          }));
      }
      n.audio.shot(`ice`, 1);
    }
    get armoured() {
      return this.crystals.some((e) => e.o);
    }
    breakCrystal(e, t) {
      let n = this.run,
        r = n.enemies;
      (e.o && r.gen[e.o.j] === e.o.g && r.alive[e.o.j] && r.kill(e.o.j),
        (e.o = null),
        n.vfx.burst(e.x, this.floorY + 2, e.z, 14218495, 34, 11, I.Shard, 0.8, 0.8, 14),
        n.vfx.flash(e.x, this.floorY + 2, e.z, 16777215, 6, 0.2),
        n.audio.shot(`ice`, 1.2),
        n.shake(0.3, e.x, e.z),
        n.animate(
          0.5,
          (t) => {
            e.g.scale.setScalar(1 - t);
          },
          () => this.group.remove(e.g),
        ),
        t && !this.armoured
          ? n.boss.kit?.shatter?.()
          : t &&
            n.ui.popup(
              e.x,
              this.floorY + 4,
              e.z,
              c(`Quedan {n}`, { n: this.crystals.filter((e) => e.o).length }),
              `#8ae8ff`,
              1,
            ));
    }
    sectorOf(e, t) {
      return Math.hypot(e, t) < 8 ? 8 : Math.floor((Math.atan2(t, e) + Math.PI) / (Math.PI / 4)) % 8;
    }
    sectors(e, t = [], n = 0, r = 0) {
      let i = this.sectorMat.uniforms;
      ((i.uOn.value = +!!e), (i.uK.value = n), (i.uBurst.value = r));
      for (let e = 0; e < 9; e++) i.uSafe.value[e] = +!!t.includes(e);
    }
    tickArena(e) {
      let t = this.run,
        n = t.player,
        r = n.pos,
        i = t.terrain,
        a = t.boss.alive && this.phase >= 1 && this.phase < 4;
      for (let t of this.spots)
        ((t.t -= e),
          (t.open = t.hole ? Math.min(1, t.open + e * 3) * (t.t < 1.5 ? t.t / 1.5 : 1) : 0),
          t.hole && t.t <= 0 && ((t.hole = !1), (t.t = 6)));
      this.spots = this.spots.filter((e) => e.t > 0);
      let o = this.iceMat.uniforms.uSpots.value;
      for (let e = 0; e < 16; e++) {
        let t = this.spots[e];
        t ? o[e].set(t.x, t.z, t.r, t.hole ? 1 + t.open : Math.min(1, t.t / 3)) : o[e].set(0, 0, 0, 0);
      }
      let s = r.y - i.height(r.x, r.z) < 0.4;
      if (
        (this.onLake(r.x, r.z) &&
          s &&
          (this.inHole(r.x, r.z)
            ? ((n.arenaSlow = Math.min(n.arenaSlow, 0.5)),
              (this.frost = Math.min(1, this.frost + e * 0.6)),
              (this.holeHurtT -= e),
              this.holeHurtT <= 0 &&
                this.phase < 4 &&
                ((this.holeHurtT = 0.5), n.hurt(n.maxHp * 0.04, `ice`, -1, NaN, NaN, !0)),
              Math.random() < e * 8 && t.vfx.ring(r.x, this.floorY + 0.1, r.z, 1.2, 9099519, 0.4, 0.3),
              this.holeSaid ||
                ((this.holeSaid = !0), t.ui.popup(r.x, r.y + 2.4, r.z, c(`¡Agua helada!`), `#8ae8ff`, 1)))
            : ((n.arenaSlip = Math.max(n.arenaSlip, 0.75)), (this.holeSaid = !1))),
        a)
      ) {
        let i = [0.2, 0.26, 0.32][this.phase - 1] * (n.types.includes(`fire`) ? 0.5 : 1);
        ((this.frost =
          n.speedNow < 1.6 && n.pstat.frozen <= 0
            ? Math.min(1, this.frost + e * i)
            : Math.max(0, this.frost - e * 0.42)),
          (this.frostPopT -= e),
          this.frost > 0.6 &&
            this.frostPopT <= 0 &&
            ((this.frostPopT = 2.2), t.ui.popup(r.x, r.y + 2.6, r.z, c(`¡Muévete!`), `#8ae8ff`, 0.9)),
          this.frost >= 1 && ((this.frost = 0), n.inflict(`frozen`, 1.4) && t.boss.kit?.punish?.()),
          this.frost > 0.05 &&
            (t.vfx.staticRing(
              r.x,
              r.y + 0.06,
              r.z,
              0.6 + this.frost * 1.2,
              this.frost > 0.6 ? 16777215 : EC,
              0.25 + this.frost * 0.6,
            ),
            Math.random() < e * 20 * this.frost &&
              t.vfx.add.spawn({
                x: r.x + F.range(-0.7, 0.7),
                y: r.y + F.range(0.2, 1.8),
                z: r.z + F.range(-0.7, 0.7),
                life: 0.4,
                size: 0.3,
                endSize: 0.1,
                color: 16777215,
                shape: I.PixSnow,
                glow: 0.5,
              })));
      } else this.frost = Math.max(0, this.frost - e);
      let l = t.boss,
        u = t.enemies,
        d = l.bossIndex;
      for (let i of this.crystals) {
        if (i.o && !(u.gen[i.o.j] === i.o.g && u.alive[i.o.j] && u.dying[i.o.j] <= 0)) {
          this.breakCrystal(i, !0);
          continue;
        }
        if (!i.o) continue;
        let a = this.floorY + 3;
        if (
          ((i.g.rotation.y += e * 0.4),
          l.alive &&
            Math.random() < 0.7 &&
            t.vfx.beams.spawn(i.x, a, i.z, u.x[d], u.y[d] + 1.5, u.z[d], 0.35, EC, 0.06, 0.6),
          Math.random() < e * 6 &&
            t.vfx.add.spawn({
              x: i.x + F.range(-1, 1),
              y: this.floorY + F.range(0.5, 3.5),
              z: i.z + F.range(-1, 1),
              vy: 0.8,
              life: 0.6,
              size: 0.35,
              endSize: 0,
              color: 16777215,
              shape: I.Twinkle,
              glow: 1,
            }),
          (i.pulse -= e),
          i.pulse <= 0 &&
            ((i.pulse = 4.5),
            (i.ring = 1.4),
            (i.hit = !1),
            t.vfx.telegraph(i.x, this.floorY, i.z, 2, EC, 0.5)),
          i.ring > 0)
        ) {
          let a = i.ring;
          ((i.ring += e * 8), t.vfx.staticRing(i.x, this.floorY + 0.15, i.z, i.ring, 14218495, 0.9));
          let o = Math.hypot(r.x - i.x, r.z - i.z);
          (!i.hit &&
            o >= a - 0.5 &&
            o < i.ring + 0.5 &&
            ((i.hit = !0),
            s
              ? (n.hurt(n.maxHp * 0.07, `ice`, -1, i.x, i.z, !1, 0.15),
                (this.frost = Math.min(1, this.frost + 0.3)))
              : t.ui.popup(r.x, r.y + 2.4, r.z, c(`¡Esquivado!`), `#7aff8a`, 0.9)),
            i.ring > 8 && (i.ring = -1));
        }
      }
      if (((this.crystals = this.crystals.filter((e) => e.o || e.g.parent)), a && this.phase >= 2)) {
        ((this.windT -= e),
          this.windT <= 0 &&
            ((this.windT = 7),
            (this.windA += F.pick([-1, 1]) * F.range(1.2, 2.2)),
            t.ui.popup(r.x, r.y + 3, r.z, c(`¡Cambia el viento!`), `#d8f4ff`, 0.8)));
        let a = Math.cos(this.windA),
          o = Math.sin(this.windA);
        ((n.kx += a * 16 * e), (n.kz += o * 16 * e));
        let s = t.r.camera.position;
        for (let n = 0, r = Math.floor(e * 60 + Math.random()); n < r; n++) {
          let e = s.x + F.range(-18, 18) - a * 10,
            n = s.z + F.range(-18, 18) - o * 10;
          t.vfx.norm.spawn({
            x: e,
            y: i.height(e, n) + F.range(0.2, 6),
            z: n,
            vx: a * 16,
            vy: -1,
            vz: o * 16,
            life: 1.2,
            size: 0.3,
            endSize: 0.3,
            color: 16777215,
            shape: I.PixSnow,
            spin: 4,
          });
        }
      }
      (this.ringT >= 0 && this.blizzardWall(e), this.ambience(e));
    }
    blizzardWall(e) {
      let t = this.run,
        n = t.terrain,
        r = t.player.pos,
        i = Math.atan2(r.z, r.x),
        a = t.r.camera.position;
      for (let r = 0, o = Math.floor(e * 140 + Math.random()); r < o; r++) {
        let e = Math.random() < 0.6 ? i + F.range(-0.7, 0.7) : F.range(0, Math.PI * 2),
          r = this.ringR + F.range(0.3, 4),
          o = Math.cos(e) * r,
          s = Math.sin(e) * r,
          c = n.height(o, s) + F.range(0, 6);
        (o - a.x) ** 2 + (c - a.y) ** 2 + (s - a.z) ** 2 < 36 ||
          t.vfx.norm.spawn({
            x: o,
            y: c,
            z: s,
            vx: -Math.sin(e) * 10,
            vy: -1,
            vz: Math.cos(e) * 10,
            life: F.range(0.8, 1.3),
            size: F.range(0.5, 1.2),
            endSize: 1.8,
            color: 16777215,
            shape: Math.random() < 0.5 ? I.Soft : I.PixSnow,
          });
      }
    }
    ambience(e) {
      let t = this.run,
        n = t.terrain,
        r = t.r.camera.position;
      for (let r of this.layout.lanterns)
        if (Math.random() < e * 6) {
          let e = n.height(r.x, r.z) + 2.3;
          t.vfx.add.spawn({
            x: r.x + F.range(-0.3, 0.3),
            y: e,
            z: r.z + F.range(-0.3, 0.3),
            vy: 0.6,
            life: 0.8,
            size: 0.3,
            endSize: 0,
            color: EC,
            shape: I.Twinkle,
            glow: 1,
          });
        }
      for (let i = 0, a = Math.floor(e * 10 + Math.random()); i < a; i++) {
        let e = r.x + F.range(-20, 20),
          i = r.z + F.range(-20, 20);
        t.vfx.norm.spawn({
          x: e,
          y: n.height(e, i) + F.range(2, 8),
          z: i,
          vx: F.range(-0.4, 0.4),
          vy: -0.8,
          vz: F.range(-0.4, 0.4),
          life: 4,
          size: 0.18,
          endSize: 0.18,
          color: 16777215,
          shape: I.PixSnow,
        });
      }
      if (((this.auroraT -= e), this.auroraT <= 0)) {
        this.auroraT = F.range(0.4, 0.9);
        let e = F.range(0, Math.PI * 2),
          n = F.range(55, 80),
          r = Math.cos(e) * n,
          i = Math.sin(e) * n;
        t.vfx.add.spawn({
          x: r,
          y: 38 + F.range(0, 10),
          z: i,
          vx: -Math.sin(e) * 2,
          vz: Math.cos(e) * 2,
          life: 4,
          size: 6,
          endSize: 12,
          color: F.pick([5963720, 8055039, 12090111]),
          shape: I.Soft,
          glow: 0.4,
        });
      }
    }
    dispose() {
      super.dispose();
      for (let e of this.crystals)
        if (e.o) {
          let t = this.run.enemies;
          t.gen[e.o.j] === e.o.g && t.kill(e.o.j);
        }
      (this.iceMat.dispose(), this.sectorMat.dispose());
    }
  },
  OC = (e) => {
    const arena = {forest:QS, desert:oC, coast:gC, glacier:TC}[e.arena];
    if (!arena) throw new MapSpawnError('竞技场 / ' + e.arena);
    return arena;
  },
  kC = (e, t) =>
    t.arena === `desert`
      ? new lC(e, t)
      : t.arena === `coast`
        ? new bC(e, t)
        : t.arena === `glacier`
          ? new DC(e, t)
          : new eC(e, t),
  AC = `grayscale(.5) sepia(.6) hue-rotate(215deg) saturate(2.4) brightness(1.08) opacity(.8) drop-shadow(0 0 3px #b48aff)`,
  jC = (e) => `hue-rotate(${Math.round(Xc(e) * 360)}deg)`,
  MC = (e) => (k.byId.has(e) ? k.get(e).family || k.root(e).id : e);
function NC(e, t) {
  if (!e?.length || !t) return null;
  let n = null;
  for (let r = e.length - 1; r >= 0; r--) {
    let i = Pe(e[r]);
    if (i) {
      if (i.member === t) return i;
      !n && MC(i.member) === MC(t) && (n = i);
    }
  }
  return n;
}
function PC(e, t) {
  return e === `shiny` ? jC(t) : e === `spectral` ? AC : ``;
}
var FC = {
    normal: { id: `normal`, name: c(`Normal`), rarity: c(`Común`), color: `#9aa4b8`, tier: 0 },
    shiny: { id: `shiny`, name: c(`Variocolor`), rarity: c(`Raro`), color: `#3a8cff`, tier: 2 },
    classic: {
      id: `classic`,
      name: c(`Variocolor clásico`),
      rarity: c(`Especial`),
      color: `#ff7ac8`,
      tier: 3,
    },
    m1: { id: `m1`, name: c(`Maestría I`), rarity: c(`Épico`), color: `#a35cff`, tier: 3 },
    m2: { id: `m2`, name: c(`Maestría II`), rarity: c(`Legendario`), color: `#ffb21a`, tier: 4 },
    spectral: { id: `spectral`, name: c(`Espectral`), rarity: c(`De evento`), color: `#b48aff`, tier: 3 },
  };

export {
  FC,
  MC,
  NC,
  OC,
  kC
};
