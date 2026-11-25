import {VFX_SCALE} from '../effects/visual-scale.js';
import {h as Zt, Rr as Je, Tn as et, Un as it, gr as Yt, un as Gn} from "../data/config.js";
import {
  Y as zr,
  ft as Zr,
  ot as pi,
  K as Tr,
  ct as Kr,
  et as Yr,
  mt as li,
  w as Ei,
  I as Cr,
  M as Dr,
  y as Oi
} from "../vendor/three-DmSYIDKK.js";
import {random as F, I, Random as Ol} from "../effects/battle-particles.js";
import {R, xf} from "./enemy-population.js";
import {bw} from "../ui/game-elements.js";
import {chineseText as c} from "../data/chinese-text.js";
import {gameData as k, typeColors as Ni} from "../data/game-database.js";
import {wy, Ab} from "./enemies.js";
import {OS} from "../world/facilities.js";
import {bu} from "../world/terrain.js";
import {updateStarterSpeed, clearStarterSpeed} from "../data/starter-characters.js";
import {blinkDuration} from "../effects/ultimate-ready-timing.js";
import {readyPaletteForType} from "../effects/effect-colors.js";
import {ta, aa, Da, Na, Pa, uo} from "../ui/controls.js";
import {Rh, zh, J, Xh, Zh, Qh} from "./ultimate-moves.js";
import {Fg} from "./skills.js";

var xw = {
    forest: [`mud`, `bramble`],
    desert: [`quicksand`, `fire`],
    coast: [`mud`, `quicksand`],
    glacier: [`mud`, `bramble`],
  },
  Sw = 0.5,
  Cw = 1.5,
  ww = `
varying vec2 vUv; varying float vD;
void main(){ vUv = uv; vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
  Tw = `
uniform sampler2D map; uniform vec2 uCell; uniform float uAlpha; uniform float uRot; uniform vec3 uLight;
uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar;
varying vec2 vUv; varying float vD;
float bayer(vec2 p){ vec2 q = mod(floor(p), 4.); int i = int(q.x + q.y * 4.);
  float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
  for (int k = 0; k < 16; k++) if (k == i) return (m[k] + 0.5) / 16.; return 0.5; }
void main(){
  vec2 c = vUv - 0.5; float cs = cos(uRot), sn = sin(uRot); c = vec2(c.x*cs - c.y*sn, c.x*sn + c.y*cs) + 0.5;
  if (c.x < 0. || c.y < 0. || c.x > 1. || c.y > 1.) discard;
  vec4 tx = texture2D(map, (uCell + c) * 0.5);
  if (tx.a < 0.5) discard;
  // Fades in and out with an ordered dither, like the rest of the pixel art (no soft alpha).
  if (bayer(gl_FragCoord.xy) > uAlpha) discard;
  vec3 col = tx.rgb * uLight;
  col = mix(col, uFogColor, smoothstep(uFogNear, uFogFar, vD));
  gl_FragColor = vec4(col, 1.);
}`,
  Ew = null,
  Dw = !1;
function Ow() {
  if (!Ew) {
    let e = (t) =>
      new Zr().load(
        Zt(`env/common/hazards.png`) + (t ? `&r=${t}` : ``),
        (e) => {
          (Ew !== e && ((Ew.image = e.image), (Ew.needsUpdate = !0)), (Dw = !0));
        },
        void 0,
        () => setTimeout(() => e(t + 1), Math.min(3e4, 2e3 * 2 ** Math.min(t, 4))),
      );
    ((Ew = e(0)), (Ew.magFilter = zr), (Ew.minFilter = zr), (Ew.generateMipmaps = !1), (Ew.colorSpace = pi));
  }
  return Ew;
}
var kw = class {
    run;
    list = [];
    nextT = 180;
    near = [];
    constructor(e) {
      ((this.run = e), Ow());
    }
    kinds() {
      return xw[this.run.biome.id] ?? Object.keys(bw);
    }
    schedule(e) {
      let t = this.run;
      if (
        (this.nextT -= e) > 0 ||
        !Dw ||
        ((this.nextT = F.range(45, 70)), this.list.length >= (t.stage >= 3 ? 3 : 2) || t.mewtwo.active)
      )
        return;
      let n = this.flatSpot(F.range(6, 9));
      n && this.spawn(F.pick(this.kinds()), n.x, n.z, n.r, F.range(40, 55));
    }
    flatSpot(e) {
      let t = this.run.terrain,
        n = this.run.player.pos,
        r = null;
      for (let i = 0; i < 24; i++) {
        let i = t.randomPoint(F, n.x, n.z, 8, 28),
          a = t.height(i.x, i.z),
          o = e;
        for (; o >= 4.5; ) {
          let e = t.inBounds(i.x, i.z, o + 2);
          for (let n = 0; e && n < 12; n++) {
            let r = (n / 12) * Math.PI * 2;
            for (let n of [0.5, 1])
              Math.abs(t.height(i.x + Math.cos(r) * o * n, i.z + Math.sin(r) * o * n) - a) > 1.2 && (e = !1);
          }
          if (e) break;
          --o;
        }
        if ((o >= 4.5 && (!r || o > r.r) && (r = { x: i.x, z: i.z, r: o }), r && r.r >= e)) break;
      }
      return r;
    }
    spawn(e, t, n, r, i) {
      let a = this.run,
        o = bw[e],
        s = a.terrain,
        c = new Yr(r * 2, r * 2, 18, 18).rotateX(-Math.PI / 2),
        l = c.attributes.position;
      for (let e = 0; e < l.count; e++) l.setY(e, s.height(t + l.getX(e), n + l.getZ(e)) + 0.07);
      c.computeBoundingSphere();
      let u = a.r.shared,
        d = new Kr({
          vertexShader: ww,
          fragmentShader: Tw,
          transparent: !1,
          depthWrite: !0,
          polygonOffset: !0,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
          uniforms: {
            map: { value: Ow() },
            uCell: { value: new li(o.cell % 2, 1 - Math.floor(o.cell / 2)) },
            uAlpha: { value: 0 },
            uRot: { value: F.range(0, Math.PI * 2) },
            uLight: u.uLight,
            uFogColor: u.uFogColor,
            uFogNear: u.uFogNear,
            uFogFar: u.uFogFar,
          },
        }),
        f = new Tr(c, d);
      (f.position.set(t, 0, n),
        (f.renderOrder = 0.4),
        s.group.add(f),
        this.list.push({ kind: e, x: t, z: n, r, age: 0, life: i, tick: 0.2, mesh: f, mat: d }),
        a.ui.toast(o.say(), null));
    }
    update(e) {
      let t = this.run,
        n = t.player,
        r = t.enemies;
      n.hazardSlow = 1;
      for (let i = this.list.length - 1; i >= 0; i--) {
        let a = this.list[i],
          o = bw[a.kind];
        a.age += e;
        let s = 2 + a.life;
        if (a.age >= s + 1.5) {
          this.drop(i);
          continue;
        }
        let c = a.age >= 2 && a.age < s;
        a.mat.uniforms.uAlpha.value =
          a.age < 2 ? 0.35 + 0.15 * Math.sin(a.age * 12) : a.age < s ? 1 : 1 - (a.age - s) / Cw;
        let l = t.terrain.height(a.x, a.z);
        if (a.age < 2) {
          Math.random() < e * 3 && t.vfx.ring(a.x, l, a.z, a.r, o.color, 0.6, 0.95);
          continue;
        }
        if ((this.ambient(a, e), !c)) continue;
        let u = a.x - n.pos.x,
          d = a.z - n.pos.z,
          f = Math.hypot(u, d),
          p = f < a.r && n.grounded;
        if (p && ((n.hazardSlow = Math.min(n.hazardSlow, o.slow)), o.pull && f > 0.5)) {
          let t = o.pull * e * (1 - (f / a.r) * 0.5);
          ((n.pos.x += (u / f) * t), (n.pos.z += (d / f) * t));
        }
        a.tick -= e;
        let m = a.tick <= 0;
        (m && (a.tick = Sw),
          m &&
            p &&
            o.hurt &&
            n.hurt(n.maxHp * o.hurt, o.type, -1, NaN, NaN, !0, 0, { kind: `hazard`, species: 0 }));
        for (let n of r.within(a.x, a.z, a.r, this.near))
          if (!(r.flags[n] & R.Flying)) {
            if (((r.hazSlow[n] = Math.min(r.hazSlow[n], o.slow * 0.9)), o.pull)) {
              let t = a.x - r.x[n],
                i = a.z - r.z[n],
                s = Math.hypot(t, i);
              s > 0.5 && ((r.x[n] += (t / s) * o.pull * 1.3 * e), (r.z[n] += (i / s) * o.pull * 1.3 * e));
            }
            if (m && o.bite) {
              let e = r.flags[n] & (R.Boss | R.Alpha | R.Totem | R.Summoner);
              t.combat.hit(n, r.maxHp[n] * o.bite * (e ? 0.1 : 1), {
                type: o.type ?? `normal`,
                cls: `special`,
                fixed: !0,
                noReact: !0,
                status: o.status,
                statusChance: 0.5,
                silent: !0,
              });
            }
          }
      }
    }
    ambient(e, t) {
      let n = this.run;
      if (Math.random() > t * (4 + e.r)) return;
      let r = F.range(0, Math.PI * 2),
        i = Math.sqrt(Math.random()) * e.r * 0.9,
        a = e.x + Math.cos(r) * i,
        o = e.z + Math.sin(r) * i,
        s = n.terrain.height(a, o);
      switch (e.kind) {
        case `mud`:
          n.vfx.norm.spawn({
            x: a,
            y: s + 0.15,
            z: o,
            vy: 0.4,
            life: 0.7,
            size: 0.35,
            endSize: 0.6,
            color: 6964516,
            shape: I.Bubble,
          });
          break;
        case `bramble`:
          n.vfx.add.spawn({
            x: a,
            y: s + 0.4,
            z: o,
            vy: 0.5,
            life: 1.6,
            size: 0.7,
            endSize: 1.3,
            color: 10107608,
            shape: I.Wisp,
            glow: 0.3,
          });
          break;
        case `quicksand`:
          n.vfx.norm.spawn({
            x: a,
            y: s + 0.2,
            z: o,
            vx: (e.x - a) * 0.5 - Math.sin(r) * 2,
            vz: (e.z - o) * 0.5 + Math.cos(r) * 2,
            vy: 0.2,
            life: 0.9,
            size: 0.5,
            endSize: 0.1,
            color: 14203e3,
            shape: I.Soft,
            drag: 1,
          });
          break;
        case `fire`:
          (n.vfx.add.spawn({
            x: a,
            y: s + 0.3,
            z: o,
            vy: F.range(1.5, 3),
            life: 0.7,
            size: 0.7,
            endSize: 0,
            color: 16777215,
            shape: I.PixFlame,
            glow: 0.4,
          }),
            Math.random() < 0.4 &&
              n.vfx.add.spawn({
                x: a,
                y: s + 0.5,
                z: o,
                vx: F.range(-0.5, 0.5),
                vy: F.range(2, 4),
                vz: F.range(-0.5, 0.5),
                life: 1.1,
                size: 0.2,
                endSize: 0,
                color: 16752704,
                shape: I.Spark,
                glow: 0.8,
              }));
      }
    }
    drop(e) {
      let t = this.list[e];
      (t.mesh.parent?.remove(t.mesh), t.mesh.geometry.dispose(), t.mat.dispose(), this.list.splice(e, 1));
    }
    clear() {
      for (let e = this.list.length - 1; e >= 0; e--) this.drop(e);
      this.run.player.hazardSlow = 1;
    }
  },
  Aw = 151,
  jw = 146,
  Mw = 150,
  Nw = 150,
  Pw = 660,
  Fw = 90,
  Iw = 45,
  Lw = (e, ...t) => {
    (e.tempMods.push(...t), e.player.recompute());
  },
  Rw = [
    {
      id: `horde`,
      name: c(`Pacto de la Horda`),
      boon: c(`Un objeto Épico o mejor`),
      bane: c(`+25 % de Pokémon salvajes`),
      icon: `cleanse-tag`,
      color: `#b06aff`,
      max: 2,
      take: (e) => {
        ((e.endless.curse.amount *= 1.25), e.rollChestItem(!0, 3));
      },
    },
    {
      id: `iron`,
      name: c(`Pacto de Hierro`),
      boon: c(`Un objeto Legendario`),
      bane: c(`Los salvajes tienen +35 % de PS`),
      icon: `iron`,
      color: `#8a9ab8`,
      max: 2,
      take: (e) => {
        ((e.endless.curse.hp *= 1.35), e.rollChestItem(!0, 4));
      },
    },
    {
      id: `fury`,
      name: c(`Pacto de Furia`),
      boon: c(`+25 % de daño`),
      bane: c(`Los salvajes hacen +25 % de daño`),
      icon: `muscle-band`,
      color: `#ff5a4a`,
      max: 2,
      take: (e) => {
        ((e.endless.curse.dmg *= 1.25), Lw(e, { stat: `damage`, mul: 1.25 }));
      },
    },
    {
      id: `wind`,
      name: c(`Pacto del Viento`),
      boon: c(`+15 % de velocidad y un salto más`),
      bane: c(`Los salvajes son un 12 % más rápidos`),
      icon: `quick-claw`,
      color: `#5ad8c8`,
      max: 2,
      take: (e) => {
        ((e.endless.curse.speed *= 1.12),
          Lw(e, { stat: `moveSpeed`, mul: 1.15 }, { stat: `extraJumps`, add: 1 }));
      },
    },
    {
      id: `elite`,
      name: c(`Pacto de Élite`),
      boon: c(`+30 % de experiencia y +20 de suerte`),
      bane: c(`El doble de Pokémon élite`),
      icon: `lucky-egg`,
      color: `#ffc83a`,
      max: 2,
      take: (e) => {
        ((e.endless.curse.elite *= 2), Lw(e, { stat: `xpGain`, mul: 1.3 }, { stat: `luck`, add: 20 }));
      },
    },
    {
      id: `moon`,
      name: c(`Pacto de la Luna`),
      boon: c(`Subes 3 niveles al instante`),
      bane: c(`Un Pokémon Alfa cada 90 s (antes 150 s)`),
      icon: `moon-stone`,
      color: `#8ab0ff`,
      max: 1,
      take: (e) => {
        e.endless.curse.alphaEvery = 90;
        let t = e.player;
        ((t.level += 3), (t.xpNext = t.xpFor(t.level)), (e.pendingLevels += 3), t.recompute());
      },
    },
    {
      id: `greed`,
      name: c(`Pacto Codicioso`),
      boon: c(`Pokédólares al instante y +30 % de ₽`),
      bane: c(`Las Poké Balls cuestan un 50 % más`),
      icon: `amulet-coin`,
      color: `#ffd23a`,
      max: 2,
      take: (e) => {
        ((e.endless.curse.chest *= 1.5), e.addGold(250 * e.stage), Lw(e, { stat: `gold`, mul: 1.3 }));
      },
    },
    {
      id: `glass`,
      name: c(`Pacto de Cristal`),
      boon: c(`+40 % de daño crítico y +10 % de crítico`),
      bane: c(`−20 % de PS máximos`),
      icon: `scope-lens`,
      color: `#9ae0ff`,
      max: 2,
      take: (e) => {
        Lw(
          e,
          { stat: `critDamage`, mul: 1.4 },
          { stat: `critChance`, add: 0.1 },
          { stat: `maxHp`, mul: 0.8 },
        );
      },
    },
  ],
  zw = new Map(Rw.map((e) => [e.id, e])),
  Bw = {
    top: 658466,
    bottom: 2761808,
    fog: 1841722,
    near: 14,
    far: 70,
    light: 0.55,
    sun: 9079551,
    clouds: [0.4, 0.4, 0.6],
    cover: 0.7,
    vignette: 0.7,
    tint: [0.62, 0.62, 0.9],
  },
  Vw = class {
    run;
    curse = { hp: 1, dmg: 1, speed: 1, amount: 1, elite: 1, alphaEvery: 150, chest: 1 };
    pacts = [];
    n = 1;
    at = Gn.milestone;
    beaten = 0;
    night = !1;
    wounds = !1;
    camp = 0;
    ax = 0;
    az = 0;
    ringT = 0;
    siegeOn = !1;
    shopVisit = 0;
    dropT = F.range(55, 75);
    meowthT = 210;
    meowth = null;
    meowthLeft = 0;
    bossUp = !1;
    idle = 0;
    flockT = 0;
    comet = null;
    cometT = Nw;
    portal = null;
    portalLeft = 0;
    migrateAt = Pw;
    k = 0;
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
      clouds: Bw.clouds,
      cover: 0,
      vignette: 0.4,
      tint: Bw.tint,
    };
    hazards;
    constructor(e) {
      this.run = e;
      for (let t of [Aw, jw, Mw]) e.sprites.get(t);
      this.hazards = new kw(e);
    }
    milestone(e) {
      let t = this.run,
        n = e * Gn.milestone;
      if (e === 9) return { n: e, at: n, species: Mw, kind: `mewtwo` };
      if (e % 3 == 0) return { n: e, at: n, species: e % 6 == 3 ? Aw : jw, kind: `legendary` };
      let r = e < 3 ? 0 : e < 6 ? 1 : e < 9 ? 2 : (e + t.seed) % 3,
        i = Je(t.biome.guardians?.[r] ?? [t.biome.bosses[r]]).filter((e) => k.hasSprite(e));
      return {
        n: e,
        at: n,
        species: i.length ? i[(t.seed + e) % i.length] : t.biome.bosses[0],
        kind: `guardian`,
      };
    }
    get next() {
      return { ...this.milestone(this.n), at: this.at };
    }
    update(e) {
      let t = this.run,
        n = t.time,
        r = it(n);
      (r !== t.stage && this.enterPhase(r),
        !this.night && n >= Gn.night && this.startNight(),
        !this.wounds && n >= 1800 && this.startWounds(),
        n >= this.at && !t.boss.alive && !t.mewtwo.active && t.state === `play` && this.spawnMilestone(),
        this.updateSiege(e),
        (this.dropT -= e) <= 0 && ((this.dropT = F.range(70, 95)), this.supplyDrop()),
        this.updateMigration(e),
        this.hazards.schedule(e),
        this.hazards.update(e));
      let i = this.k;
      ((this.k = this.night ? Math.min(1, this.k + e / 6) : 0), this.k !== i && t.pushLook());
    }
    get siegeMult() {
      return Yt(Math.max(this.camp, this.idle));
    }
    updateSiege(e) {
      let t = this.run,
        n = t.player.pos;
      if (t.time < et.from) {
        ((this.ax = n.x), (this.az = n.z));
        return;
      }
      Math.hypot(n.x - this.ax, n.z - this.az) > et.radius
        ? ((this.ax = n.x), (this.az = n.z), (this.camp = Math.max(0, this.camp - et.exit)))
        : (this.camp += e);
      let r = t.input,
        i =
          Math.abs(r.axis([`KeyA`, `ArrowLeft`], [`KeyD`, `ArrowRight`]) + r.stickX) +
            Math.abs(r.axis([`KeyS`, `ArrowDown`], [`KeyW`, `ArrowUp`]) + r.stickY) >
            0.1 || t.autoRun;
      this.idle = i ? Math.max(0, this.idle - e * 4) : this.idle + e;
      let a = Math.max(this.camp, this.idle) > et.grace;
      if (
        (Math.max(this.camp, this.idle) > Iw &&
          (this.flockT -= e) <= 0 &&
          ((this.flockT = 12), t.director.flock()),
        a && !this.siegeOn
          ? (t.ui.banner(
              c(`¡Asedio!`),
              c(`Si no te mueves, los salvajes resisten tus golpes. ¡Sal del círculo!`),
              `#ff5a4a`,
            ),
            t.audio.alarm())
          : !a && this.siegeOn && t.ui.toast(c(`Rompes el asedio`), null),
        (this.siegeOn = a),
        a && (this.ringT -= e) <= 0)
      ) {
        let e = 1 - this.siegeMult;
        ((this.ringT = 1.6 - e),
          t.vfx.ring(this.ax, t.terrain.height(this.ax, this.az), this.az, et.radius, 16730682, 0.9, 0.97));
      }
    }
    enterPhase(e) {
      let t = this.run;
      ((t.stage = e),
        t.director.onPhase(),
        t.minibosses.resetUsed(),
        t.ui.banner(
          c(`Fase {ph}`, { ph: e }),
          c(
            e === 2
              ? `La horda evoluciona: llegan Pokémon evolucionados`
              : `Las formas finales salen a cazar`,
          ),
          e === 2 ? `#ffb03a` : `#ff5a4a`,
        ),
        t.audio.alarm());
    }
    startWounds() {
      ((this.wounds = !0),
        this.run.ui.banner(
          c(`Heridas profundas`),
          c(`Desde ahora te curas un poco menos cada minuto`),
          `#ff7a9a`,
        ),
        this.run.audio.alarm());
    }
    startNight() {
      let e = this.run;
      ((this.night = !0),
        e.ui.banner(
          c(`¡NOCHE SIN FIN!`),
          c(`Cada minuto, los Pokémon salvajes se vuelven más fuertes`),
          `#8a8aff`,
        ),
        e.audio.alarm(),
        e.shake(0.4));
    }
    spawnMilestone() {
      let e = this.run,
        t = this.milestone(this.n),
        n = e.player.pos;
      if ((this.n++, (this.at = Math.max(this.n * Gn.milestone, e.time + 60)), t.kind === `mewtwo`)) {
        ((e.mewtwo = new Ab(e, !0, !0)), (this.bossUp = !0));
        return;
      }
      let r = e.terrain.randomPoint(F, n.x, n.z, 12, 18);
      e.bossSpawned = !0;
      let i = e.director;
      ((t.kind === `legendary`
        ? e.boss.spawn(t.species, r.x, r.z, !0, {
            hp: i.hpMult() * 2.6,
            dmg: i.dmgMult(),
            kit: !0,
            secs: wy.endlessLegendary,
          })
        : e.boss.spawn(t.species, r.x, r.z, !1, {
            hp: i.hpMult() * 0.6 * (t.n === 1 ? 0.75 : 1),
            dmg: i.dmgMult() * (t.n === 1 ? 0.7 : 1),
            secs: wy.endlessGuardian,
          })) >= 0 && (this.bossUp = !0),
        (e.audio.intensity = 1));
    }
    onMilestoneKilled() {
      this.bossUp && ((this.bossUp = !1), this.beaten++, this.run.later(1.6, () => this.offerPact()));
    }
    offerPact() {
      let e = this.run,
        t = Rw.filter((e) => this.pacts.filter((t) => t === e.id).length < e.max);
      if (!t.length) return;
      let n = F.shuffle(t.slice()).slice(0, 3);
      e.whenFree(() => {
        ((e.state = `modal`),
          e.audio.power(),
          e.ui.showPact(e, n, (t) => {
            if ((e.ui.hideModal(), e.resume(), !t)) {
              e.ui.toast(c(`Rechazas el pacto`), null);
              return;
            }
            (this.pacts.push(t.id),
              t.take(e),
              e.player.recompute(),
              e.ui.banner(t.name, `${t.boon} · ${t.bane}`, t.color));
            let n = e.player.pos;
            (e.vfx.ring(n.x, n.y, n.z, 6, 11561727, 0.6),
              e.vfx.burst(n.x, n.y + 1.2, n.z, 11561727, 30, 7, I.Twinkle, 0.6, 0.7));
          }));
      });
    }
    supplyDrop() {
      let e = this.run,
        t = e.player.pos,
        n = e.terrain;
      if (e.mewtwo.active) return;
      let r = n.randomPoint(F, t.x, t.z, 22, 38);
      if (Math.hypot(r.x - t.x, r.z - t.z) < 15) return;
      let i = Math.random(),
        a = n.height(r.x, r.z);
      if ((e.vfx.beams.spawn(r.x, a, r.z, r.x, a + 18, r.z, 0.9, 16765498, 8, 0.45), i < 0.65)) {
        let t = i < 0.15,
          n = e.interactables.spawnChest(r.x, r.z, t);
        if (!n) return;
        const a = n.group;
        if (a) {
          let t = a.position.y;
          e.animate(
            0.8,
            (e) => {
              a.position.y = t + 22 * (1 - e * e);
            },
            () => {
              ((a.position.y = t),
                e.vfx.ring(n.x, t, n.z, 3.5, 16765498, 0.5),
                e.vfx.dust(n.x, t, n.z, 15260864, 12, 4),
                e.shake(0.15, n.x, n.z),
                e.audio.boom(0.4));
            },
          );
        }
        e.ui.toast(
          c(
            t
              ? `¡Suministro! Una Super Ball ha caído del cielo`
              : `¡Suministro! Una Poké Ball ha caído del cielo`,
          ),
          t ? `great-ball` : `poke-ball`,
        );
      } else {
        let t = F.pick([`magnet`, `repel`, `heal`, `heal`]);
        (e.pickups.spawn(t, r.x, a + 16, r.z, 1),
          e.ui.toast(
            c(`¡Suministro! Algo ha caído del cielo`),
            t === `heal` ? `oran-berry` : t === `bomb` ? `poke-ball` : t,
          ));
      }
    }
    get cometHere() {
      let e = this.comet;
      return e && !e.used && !((e.charge ?? 0) > 0) ? Math.max(0, e.data.life) : null;
    }
    updateMigration(e) {
      let t = this.run;
      if (this.portal) {
        (this.portalLeft -= e) <= 0 &&
          (t.interactables.remove(this.portal),
          (this.portal = null),
          t.ui.toast(c(`El portal de migración se ha cerrado`), null));
        return;
      }
      if (t.time < this.migrateAt || t.boss.alive || t.mewtwo.active || t.state !== `play`) return;
      this.migrateAt = t.time + Pw;
      let n = t.player.pos,
        r = t.terrain.randomPoint(F, n.x, n.z, 14, 20);
      ((this.portal = t.interactables.spawnPortal(r.x, r.z)),
        (this.portalLeft = Fw),
        t.ui.banner(
          c(`¡Portal de migración!`),
          c(`Crúzalo en {n} s para llegar a tierras nuevas, con todo por descubrir`, { n: Fw }),
          `#9a6aff`,
        ));
    }
    get portalHere() {
      return this.portal ? this.portalLeft : null;
    }
    onMigrate() {
      (this.hazards.clear(),
        (this.meowth = null),
        (this.meowthLeft = 0),
        (this.portal = null),
        (this.comet = null),
        (this.cometT = Math.min(this.cometT, 45)));
      let e = this.run.player.pos;
      ((this.ax = e.x), (this.az = e.z), (this.camp = 0), (this.idle = 0));
    }
    get meowthHere() {
      return this.meowth ? this.meowthLeft : null;
    }
    atmos() {
      if (this.k <= 0) return null;
      let e = this.out,
        t = Bw;
      return (
        (e.k = this.k * this.k * (3 - 2 * this.k)),
        (e.flash = 0),
        e.top.set(t.top),
        e.bottom.set(t.bottom),
        e.fog.set(t.fog),
        e.sun.set(t.sun),
        (e.near = t.near),
        (e.far = t.far),
        (e.light = t.light),
        (e.cover = t.cover),
        (e.vignette = t.vignette),
        e
      );
    }
  },
  Hw = Math.PI / 180,
  Uw = (e, t) => ({ x: Math.cos(e * Hw) * t, z: Math.sin(e * Hw) * t }),
  Ww = { x: 0, z: 13 },
  Gw = { x: 0, z: -22 },
  Kw = { w: 5, len: 8, rise: 6 },
  qw = { x: 0, z: 22 },
  Jw = (e, t, n = 0) => Array.from({ length: e }, (r, i) => Uw(n + (i * 360) / e, t)),
  Yw = (e, t, n, r, i, a = 4) => {
    let o = [],
      s = 0;
    for (let c = t; c <= n + 0.01; c += r, s++) (s + 1) % (a + 1) && o.push({ x: c, z: e, v: (s + i) % 3 });
    return o;
  },
  Xw = (e) => e * Hw,
  Zw = [
    {
      plateaus: [
        { ...Uw(200, 17), r: 5, ramp: Xw(20), h: 1.6 },
        { ...Uw(340, 17), r: 5, ramp: Xw(160), h: 1.6 },
      ],
      columns: Jw(6, 13, 30),
      graves: [
        ...Yw(-12, -24, -16, 2.6, 0, 9),
        ...Yw(-12, 16, 24, 2.6, 1, 9),
        ...Yw(8, -25, -18, 2.6, 2, 9),
        ...Yw(8, 18, 25, 2.6, 0, 9),
      ],
      tricks: [],
      candles: Jw(4, 9, 45),
      chests: [Uw(110, 22), Uw(70, 22)],
      banners: [2, 6, 10, 14],
      flags: [],
    },
    {
      plateaus: [
        { ...Uw(150, 21), r: 4.5, ramp: Xw(330), h: 3.4 },
        { ...Uw(30, 21), r: 4.5, ramp: Xw(210), h: 3.4 },
      ],
      columns: [Uw(0, 9), Uw(180, 9)],
      graves: [
        ...Yw(-14, -22, 22, 2.4, 0),
        ...Yw(-7, -24, 24, 2.4, 1),
        ...Yw(7, -24, 24, 2.4, 2),
        ...Yw(14, -20, 20, 2.4, 0),
      ].filter((e) => Math.abs(e.x) > 4.5),
      tricks: [Uw(250, 18), Uw(290, 18), Uw(90, 12)],
      candles: Jw(4, 11, 0),
      chests: [Uw(200, 25), Uw(340, 25)],
      meowth: Uw(60, 25),
      banners: [1, 3, 5, 7, 9, 11, 13, 15],
      flags: [],
    },
    {
      plateaus: [
        { ...Uw(150, 20), r: 4, ramp: Xw(330), h: 2.2 },
        { ...Uw(30, 20), r: 4, ramp: Xw(210), h: 2.2 },
        { ...Uw(270, 14), r: 3.5, ramp: Xw(90), h: 1.6 },
      ],
      columns: Jw(8, 14, 22.5),
      graves: [...Jw(6, 24, 15).map((e, t) => ({ ...e, v: t % 3 }))],
      tricks: [Uw(200, 22), Uw(340, 22)],
      candles: Jw(4, 7, 0),
      chests: [Uw(120, 24), Uw(60, 24), Uw(0, 22)],
      bill: Uw(180, 23),
      banners: [0, 4, 8],
      flags: Jw(8, 14, 22.5).map((e) => ({ ...e, r: 2.2 })),
    },
    {
      plateaus: [
        { ...Uw(225, 18), r: 4, ramp: Xw(45), h: 2.2 },
        { ...Uw(315, 18), r: 4, ramp: Xw(135), h: 2.2 },
      ],
      columns: Jw(4, 10, 45),
      graves: [...Yw(0, -26, -16, 2.5, 0, 9), ...Yw(0, 16, 26, 2.5, 1, 9)],
      tricks: [Uw(160, 20), Uw(20, 20), Uw(270, 9)],
      candles: [...Jw(8, 18, 22.5), Uw(90, 4), Uw(270, 4)],
      chests: [Uw(100, 26), Uw(80, 26)],
      banners: [2, 6, 10, 14],
      flags: [],
    },
    {
      plateaus: Jw(4, 19, 45).map((e, t) => ({ ...e, r: 3.5, ramp: Xw(45 + t * 90 + 180), h: 1.4 })),
      columns: Jw(4, 25, 0),
      graves: Jw(8, 11, 22.5).map((e, t) => ({ ...e, v: t % 3 })),
      tricks: [Uw(135, 14), Uw(315, 14)],
      candles: Jw(4, 6, 0),
      chests: [Uw(200, 24), Uw(340, 24)],
      meowth: Uw(60, 24),
      banners: [1, 5, 9, 13],
      flags: Jw(4, 19, 45).map((e) => ({ ...e, r: 4.2 })),
    },
    {
      plateaus: [
        { ...Uw(180, 21), r: 4, ramp: Xw(0), h: 2.2 },
        { ...Uw(0, 21), r: 4, ramp: Xw(180), h: 2.2 },
      ],
      columns: Jw(6, 22, 0),
      graves: Jw(10, 9, 18).map((e, t) => ({ ...e, v: t % 3 })),
      tricks: [Uw(230, 24), Uw(310, 24)],
      candles: Jw(3, 13, 30),
      chests: [Uw(130, 25), Uw(50, 25)],
      bill: Uw(200, 17),
      altar: { x: -15, z: -12 },
      banners: [0, 2, 6, 8, 10, 14],
      flags: [],
    },
    {
      plateaus: [
        { ...Uw(135, 20), r: 4.5, ramp: Xw(315), h: 2.2 },
        { ...Uw(45, 20), r: 4.5, ramp: Xw(225), h: 2.2 },
      ],
      columns: Jw(4, 12, 0),
      graves: [...Yw(16, -22, -12, 2.6, 0, 9), ...Yw(16, 12, 22, 2.6, 2, 9)],
      tricks: [Uw(200, 24), Uw(340, 24)],
      candles: Jw(4, 16, 45),
      chests: [Uw(160, 26), Uw(20, 26)],
      meowth: Uw(110, 26),
      banners: [1, 3, 5, 7, 9, 11, 13, 15],
      flags: [],
    },
  ],
  Qw = {
    plateaus: [],
    columns: [],
    graves: [],
    tricks: [],
    candles: Jw(4, 12, 45),
    chests: [Uw(210, 10), Uw(330, 10)],
    meowth: Uw(150, 14),
    bill: Uw(30, 14),
    banners: [],
    flags: [],
  },
  $w = [
    {
      name: c(`Vestíbulo`),
      sub: c(`Una Médium te da la bienvenida: «Los espíritus no descansan esta noche...»`),
      pool: [92, 41, 104, 43],
      waves: [22, 28, 32],
      veil: 0,
      veilAny: 0,
      guardian: { id: 93, kind: `totem` },
      curve: { stage: 1, min: 0.6, step: 1.1 },
      plan: Zw[0],
    },
    {
      name: c(`Pasillo de las lápidas`),
      sub: c(`Hileras de lápidas... y alguna sonríe. ¿Truco o trato?`),
      pool: [92, 104, 109, 88, 41],
      waves: [28, 34, 38],
      veil: 0,
      veilAny: 0,
      guardian: { id: 110, kind: `summoner` },
      curve: { stage: 1, min: 3.6, step: 1.2 },
      plan: Zw[1],
    },
    {
      name: c(`Sala de la niebla`),
      sub: c(`«¡FANTASMA!» No se puede identificar... usa el Visor Silph`),
      pool: [93, 92, 42, 109, 23],
      waves: [30, 36, 42],
      veil: 0.65,
      veilAny: 0.1,
      guardian: { id: 42, kind: `totem` },
      curve: { stage: 2, min: 1.5, step: 1.2 },
      plan: Zw[2],
    },
    {
      name: `烛台长廊`,
      sub: `靠近烛台可以恢复生命并发现幽灵`,
      pool: [93, 42, 88, 89, 48, 49],
      waves: [32, 38, 44],
      veil: 0.6,
      veilAny: 0.2,
      guardian: { id: 89, kind: `totem` },
      curve: { stage: 2, min: 4.4, step: 1.3 },
      dark: !0,
      plan: Zw[3],
    },
    {
      name: c(`Zona purificada`),
      sub: c(`Quédate en el círculo sagrado: fuera, la niebla te consume`),
      pool: [96, 97, 93, 39, 35],
      waves: [34, 40, 0],
      veil: 0.5,
      veilAny: 0.1,
      guardian: { id: 97, kind: `boss` },
      curve: { stage: 3, min: 1.6, step: 1.4 },
      purified: !0,
      plan: Zw[4],
    },
    {
      name: c(`La sombra de Marowak`),
      sub: c(`Un espíritu madre llora por su cría. Enciende sus velas y dale paz`),
      pool: [104, 105, 93, 110, 42],
      waves: [36, 42, 0],
      veil: 0.55,
      veilAny: 0.15,
      guardian: { id: 105, kind: `boss` },
      curve: { stage: 3, min: 4.6, step: 1.4 },
      memorial: !0,
      plan: Zw[5],
    },
    {
      name: c(`La cima`),
      sub: c(`La campana tañe. El señor de la Torre te espera`),
      pool: [94, 93, 110, 89, 124, 97],
      waves: [38, 46, 0],
      veil: 0.5,
      veilAny: 0.15,
      guardian: { id: 94, kind: `boss` },
      curve: { stage: 3, min: 7.4, step: 1.4 },
      bell: !0,
      plan: Zw[6],
    },
  ],
  eT = [...new Set($w.flatMap((e) => [...e.pool, e.guardian.id]).concat([92, 93, 94, 105, 104, 122, 124]))],
  tT = [94, 93, 92, 105, 110, 89, 42, 97, 124, 122, 24, 49],
  nT = [94, 105, 97];
function rT(e, t = !1) {
  return {
    pack: `tower`,
    world: 92,
    radius: 31,
    plateaus: e.plateaus,
    dais: t ? 9 : 5.5,
    flags: e.flags,
    bigTrees: [],
    lanterns: [],
    entry: { ...Ww },
    undergrowth: t ? 60 : 150,
    tower: { wall: t ? 1.2 : 13, roof: t, stairs: t ? void 0 : { ...Gw, ...Kw } },
  };
}
var iT = Math.PI / 180,
  aT = { x: 0, z: -13 },
  oT = (e, t, n = 0) => Math.abs(e) < 5.4 + n && Math.abs(t) > 19.5 - n,
  sT = (e) => k.get(e).types.includes(`ghost`),
  cT = 4,
  lT = 6,
  uT = 5,
  dT = 9,
  fT = 3,
  pT = 1.1,
  mT = 45,
  hT = 30,
  gT = 7.5,
  _T = 0.01,
  vT = 90,
  yT = 6.5,
  bT = 0.015,
  xT = 0.012,
  ST = (e, t, n, r, i, a, o) => ({ id: e, name: t, boon: n, bane: r, icon: i, color: a, max: 99, take: o }),
  CT = [
    ST(
      `dark`,
      c(`Sin luz`),
      c(`Una Super Ball al llegar`),
      c(`Las velas no se encienden en este piso`),
      `cleanse-tag`,
      `#6a5aa8`,
      (e) => {
        e.tower.arrivalBall = !0;
      },
    ),
    ST(
      `twin`,
      c(`Fantasmas ×2`),
      c(`+20 % de experiencia el resto de la partida`),
      c(`El doble de fantasmas ocultos`),
      `reaper-cloth`,
      `#9a6aff`,
      (e) => {
        (e.tempMods.push({ stat: `xpGain`, mul: 1.2 }), e.player.recompute());
      },
    ),
    ST(
      `graves`,
      c(`Lápidas inquietas`),
      c(`Pokédólares al instante`),
      c(`Las lápidas estallan cerca de ti`),
      `dusk-stone`,
      `#b06aff`,
      (e) => {
        e.addGold(Math.max(80, 0.6 * OS(e)));
      },
    ),
    ST(
      `swift`,
      c(`Prisa espectral`),
      c(`+10 % de velocidad el resto de la partida`),
      c(`Los salvajes son un 25 % más rápidos`),
      `quick-claw`,
      `#5ad8c8`,
      (e) => {
        (e.tempMods.push({ stat: `moveSpeed`, mul: 1.1 }), e.player.recompute());
      },
    ),
    ST(
      `iron`,
      c(`Coraza de ectoplasma`),
      c(`Un objeto Épico o mejor`),
      c(`Los salvajes tienen +40 % de PS`),
      `iron`,
      `#8a9ab8`,
      (e) => {
        e.tower.afterClimb.push(() => e.rollChestItem(!0, 3));
      },
    ),
    ST(
      `hunger`,
      c(`Hambre de almas`),
      c(`+20 % de daño el resto de la partida`),
      c(`No hay curas en el suelo y las velas no curan`),
      `muscle-band`,
      `#ff5a6a`,
      (e) => {
        (e.tempMods.push({ stat: `damage`, mul: 1.2 }), e.player.recompute());
      },
    ),
  ],
  wT = {
    top: 1182246,
    bottom: 4861034,
    fog: 2891846,
    near: 22,
    far: 80,
    light: 0.78,
    sun: 13154559,
    tint: [0.84, 0.8, 1],
    vignette: 0.55,
    clouds: [0.5, 0.45, 0.65],
    cover: 0.3,
  },
  ET = {
    top: 266778,
    bottom: 1989210,
    fog: 1456704,
    near: 16,
    far: 64,
    light: 0.7,
    sun: 10158056,
    tint: [0.7, 0.96, 0.92],
    vignette: 0.62,
    clouds: [0.3, 0.55, 0.55],
    cover: 0.4,
  },
  DT = {
    top: 659510,
    bottom: 5917338,
    fog: 3813990,
    near: 40,
    far: 150,
    light: 0.85,
    sun: 15788287,
    tint: [0.9, 0.88, 1.04],
    vignette: 0.45,
    clouds: [0.55, 0.52, 0.75],
    cover: 0.2,
  },
  OT = class {
    run;
    floor = 1;
    wave = 0;
    state = `intro`;
    roof = !1;
    won = !1;
    marowak = !1;
    curses = [];
    floorCurse = null;
    reveals = 0;
    tricks = 0;
    candlesLit = 0;
    offerings = [];
    dark4 = 0;
    curse = { hp: 1, speed: 1, amount: 1 };
    arrivalBall = !1;
    stT = 0;
    waveT = 0;
    toSpawn = 0;
    burstT = 0;
    waveList = [];
    guardian = null;
    pulseT = 2;
    stragT = 1;
    callT = 0;
    stairWarn = !1;
    lastPulse = { t: -99, x: 0, z: 0 };
    candles = [];
    group = new Cr();
    colliders = [];
    bell = null;
    bellT = 0;
    stairs = null;
    upBlock = [];
    climbing = !1;
    entryStairs = !1;
    afterClimb = [];
    altar = null;
    stairsGlow = null;
    altarGlow = null;
    holy = { x: 0, z: 0, k: 0 };
    holyHurtT = 0;
    mistSaid = !1;
    graveT = 8;
    graves = [];
    graveGhosts = [];
    shafts = null;
    shaftMat = null;
    disposed = !1;
    out = {
      k: 1,
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
      for (let t of eT) k.hasSprite(t) && e.sprites.get(t);
    }
    get beyond() {
      return this.floor >= 8;
    }
    get def() {
      return $w[this.beyond ? (this.floor - 8) % $w.length : this.floor - 1];
    }
    get curveStage() {
      return this.beyond ? 4 : this.def.curve.stage;
    }
    get vmin() {
      let e = Math.min(this.wave, 2),
        t = Math.min(1, this.waveT / 60) * 0.5;
      if (this.beyond) return 21 + (this.floor - 8) * 2 + e * 0.6 + t;
      let n = this.def.curve;
      return n.min + e * n.step + t;
    }
    get bossFloor() {
      return this.beyond ? (this.floor - 7) % 5 == 0 : this.def.guardian.kind === `boss`;
    }
    where() {
      return this.roof
        ? c(`Azotea`)
        : this.beyond
          ? c(`Más Allá · Piso {n}`, { n: this.floor })
          : c(`{n}F · {name}`, { n: this.floor, name: this.def.name });
    }
    layout() {
      return rT(this.roof ? Qw : this.def.plan, this.roof);
    }
    zoneLook() {
      let e = this.roof ? DT : this.beyond ? ET : wT;
      return {
        name: this.where(),
        sky: [e.top, e.bottom],
        fog: e.fog,
        fogNear: e.near,
        fogFar: e.far,
        light: e.light,
        sun: e.sun,
        hemiGround: 2761284,
        sunDir: [0.3, 0.86, -0.4],
        sunH: this.roof ? 0.42 : 0.6,
        tint: e.tint,
        clouds: e.clouds,
        cover: e.cover,
        glow: this.beyond ? 5963736 : 11569919,
        glowK: 0.5,
        stars: 1,
        motes: null,
      };
    }
    sprites() {
      let e = this.def;
      return [...(this.beyond ? tT : e.pool), e.guardian.id, ...(e.memorial ? [104] : [])].filter((e) =>
        k.hasSprite(e),
      );
    }
    buildFloor() {
      let e = this.run,
        t = e.terrain,
        n = this.roof ? Qw : this.def.plan;
      (this.disposeFloor(),
        (this.disposed = !1),
        (this.group = new Cr()),
        e.r.scene.add(this.group),
        (this.candles = []),
        (this.colliders = []),
        (this.bell = null),
        (this.graves = []),
        (this.graveGhosts = []),
        (this.stairs = null),
        (this.altar = null),
        (this.stairsGlow = null),
        (this.altarGlow = null));
      let r = new Ol(e.seed ^ (this.floor * 7919)),
        i = 30.6;
      if (this.roof)
        for (let e = 0; e < 16; e++) {
          let n = ((e * 360) / 16) * iT;
          this.model(
            `tower_rail`,
            Math.cos(n) * 30.3,
            Math.sin(n) * 30.3,
            Math.atan2(-Math.cos(n), -Math.sin(n)),
            2,
            t.height(0, 0),
          );
        }
      else {
        for (let e = 0; e < 16; e++) {
          let r = ((e * 360) / 16) * iT,
            a = Math.cos(r) * i,
            o = Math.sin(r) * i,
            s = e === 4 || e === 12 || e % 2 ? `tower_wall_plain` : `tower_wall_bay`;
          this.model(s, a, o, Math.atan2(-Math.cos(r), -Math.sin(r)), 1, t.height(a * 0.97, o * 0.97));
          let c = r + Math.PI / 16,
            l = i / Math.cos(Math.PI / 16);
          (this.model(
            `tower_pillar`,
            Math.cos(c) * l,
            Math.sin(c) * l,
            Math.atan2(-Math.cos(c), -Math.sin(c)),
            1,
            t.height(Math.cos(c) * l * 0.96, Math.sin(c) * l * 0.96),
          ),
            n.banners.includes(e) &&
              this.model(
                `tower_banner`,
                Math.cos(r) * 30.400000000000002,
                Math.sin(r) * 30.400000000000002,
                Math.atan2(-Math.cos(r), -Math.sin(r)),
                1,
                t.height(a * 0.97, o * 0.97) + 10.2,
              ));
        }
        this.moonShafts(r);
      }
      ((this.entryStairs = this.floor > 1 || this.beyond || this.roof),
        this.entryStairs &&
          (this.model(`tower_stairs`, qw.x, qw.z, Math.PI, 1, t.height(qw.x, qw.z)),
          this.block(qw.x, qw.z + 0.9, 3.4, 60),
          this.sides(qw.z + 0.9, qw.z + 8.4),
          t.solidBoxes.push({ x0: -3.2, x1: 3.2, z0: qw.z, z1: qw.z + 9 })),
        (this.climbing = !1),
        (this.upBlock = []),
        this.roof ||
          ((this.upBlock = this.block(Gw.x, Gw.z - 0.9, 3.4, 60)),
          this.sides(Gw.z - 0.9, Gw.z - 8.4),
          t.solidBoxes.push({ x0: -3.2, x1: 3.2, z0: Gw.z - 9, z1: Gw.z })));
      let a = this.def.bell && !this.roof && !this.beyond ? aT : null,
        o = (e, t) =>
          Math.hypot(e - Ww.x, t - Ww.z) > 4.5 && !oT(e, t) && (!a || Math.hypot(e - a.x, t - a.z) > 4.5);
      for (let e of n.columns.filter((e) => o(e.x, e.z))) {
        let n = t.height(e.x, e.z);
        (t.reserve(e.x, e.z, 2),
          this.collide(e.x, e.z, 1, n + 5.5),
          this.model(`tower_column`, e.x, e.z, r.range(0, Math.PI * 2), 1, n, (e) => {
            let t = e.getObjectByName(`Stub`);
            t && (t.visible = !1);
          }));
      }
      for (let e of n.graves.filter((e) => o(e.x, e.z))) {
        let n = t.height(e.x, e.z);
        (t.reserve(e.x, e.z, 1.2),
          this.collide(e.x, e.z, 0.7, n + 1.5),
          this.graves.push(e),
          this.model(
            [`tower_grave_a`, `tower_grave_b`, `tower_grave_c`][e.v % 3],
            e.x,
            e.z,
            Math.atan2(-e.x, -e.z) + r.range(-0.25, 0.25),
            1,
            n,
            (e) => {
              let t = e.getObjectByName(`Stub`);
              t && (t.visible = !1);
            },
          ));
      }
      for (let e of n.candles.filter((e) => o(e.x, e.z)))
        this.addCandle(e.x, e.z, !!this.def.memorial && !this.roof && !this.beyond);
      if (
        (this.def.memorial &&
          !this.roof &&
          !this.beyond &&
          (t.reserve(0, 0, 3),
          this.collide(0, 0, 1.2, t.height(0, 0) + 1.6),
          this.model(`tower_marowak_shrine`, 0, 0, 0, 1.3, t.height(0, 0))),
        a)
      ) {
        let e = a.x,
          n = a.z;
        (t.reserve(e, n, 3.5),
          this.collide(e, n, 2, t.height(e, n) + 5),
          this.model(`tower_bell`, e, n, 0, 1.2, t.height(e, n), (e) => {
            this.bell = e.getObjectByName(`Bell`) ?? null;
          }));
      }
      this.def.purified &&
        !this.roof &&
        !this.beyond &&
        ((this.holy = { x: 0, z: 0, k: 0 }), (this.mistSaid = !1));
      for (let e = 0; e < 6; e++) t.reserve(Gw.x, Gw.z + e, 3.2);
      (t.reserve(0, 0, 3.4), t.reserve(qw.x, qw.z, 4));
    }
    populate(e) {
      let t = this.run,
        n = this.roof ? Qw : this.def.plan;
      if (this.roof) {
        (e.place(`tower`, 0, -20, { data: { sub: `portal`, model: `tower_portal`, h: 6.4, rot: 0 }, r: 3.4 }),
          e.place(`tower`, qw.x, qw.z - 3.5, { data: { sub: `leave`, h: 2 }, r: 3 }));
        for (let t of n.chests) e.spawnChest(t.x, t.z, !0);
      } else {
        this.stairs = e.place(`tower`, Gw.x, Gw.z, {
          data: { sub: `stairs`, model: `tower_stairs`, h: 6, rot: 0 },
          r: 3.6,
        });
        let t = n.altar ?? { x: 0, z: 0 };
        this.altar = e.place(`tower`, t.x, t.z, {
          data: { sub: `altar`, model: `tower_altar`, h: 2.6, rot: 0 },
          r: 3,
        });
        for (let t of n.tricks)
          e.place(`tower`, t.x, t.z, { data: { sub: `trick`, model: `tower_gengar_grave`, h: 2.6 }, r: 2.4 });
        for (let t of n.chests) e.spawnChest(t.x, t.z, !1);
        this.arrivalBall && ((this.arrivalBall = !1), e.spawnChest(qw.x + 4, qw.z - 5, !0));
      }
      if (n.meowth && (!this.beyond || this.floor % 2 == 0)) {
        let t = n.meowth,
          r = oT(t.x, t.z, 3);
        e.spawnNpc(`meowth`, r ? 9 * Math.sign(t.x || 1) : t.x, r ? t.z * 0.6 : t.z);
      }
      let r = n.bill ?? (this.beyond && !this.roof ? { x: -14, z: 19 } : void 0);
      (r && (!this.beyond || this.floor % 3 == 0) && e.place(`bill`, r.x, r.z),
        t.later(0.6, () => {
          ((this.stairsGlow = this.stairs?.group?.getObjectByName(`Glow`) ?? null),
            (this.altarGlow = this.altar?.group?.getObjectByName(`Glow`) ?? null),
            this.setGlow());
        }));
    }
    setGlow() {
      let e = this.state === `clear`;
      for (let t of this.upBlock) t.off = e;
      (this.stairsGlow && (this.stairsGlow.visible = e),
        this.altarGlow && (this.altarGlow.visible = e && !this.altar?.used));
    }
    model(e, t, n, r, i, a, o) {
      let s = new Cr();
      return (
        s.position.set(t, a, n),
        (s.rotation.y = r),
        s.scale.setScalar(i),
        this.group.add(s),
        bu(e).then((e) => {
          e && !this.disposed && (s.add(e), o?.(e));
        }),
        s
      );
    }
    collide(e, t, n, r) {
      let i = { x: e, z: t, r: n, h: r };
      return (this.run.terrain.addCollider(i), this.colliders.push(i), i);
    }
    sides(e, t) {
      let n = t > e ? 1.4 : -1.4;
      for (let r = e; n > 0 ? r <= t : r >= t; r += n) for (let e of [-3.5, 3.5]) this.collide(e, r, 0.9, 60);
    }
    block(e, t, n, r) {
      let i = [];
      for (let a = -n; a <= n; a += 1.4)
        i.push(this.collide(e + a, t, 0.9, this.run.terrain.height(e, t) + r));
      return i;
    }
    addCandle(e, t, n) {
      let r = this.run.terrain,
        i = r.height(e, t);
      (r.reserve(e, t, 1.4), this.collide(e, t, 0.5, i + 2.3));
      let a = { x: e, z: t, y: i, lit: 0, charge: 0, memorial: n, g: null };
      ((a.g = this.model(`tower_candelabra`, e, t, F.range(0, Math.PI * 2), n ? 1.15 : 1, i, (e) => {
        ((a.flame = e.getObjectByName(`Flame`) ?? void 0), a.flame && (a.flame.visible = a.lit > 0));
      })),
        this.candles.push(a));
    }
    moonShafts(e) {
      let t = this.run,
        n = t.terrain;
      this.shaftMat = new Kr({
        transparent: !0,
        depthWrite: !1,
        blending: 2,
        side: 2,
        uniforms: { uTime: t.r.shared.uTime },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: `uniform float uTime; varying vec2 vUv;
        void main(){ float edge = smoothstep(0., 0.3, vUv.x) * smoothstep(1., 0.7, vUv.x);
          float fall = smoothstep(0., 0.35, vUv.y) * smoothstep(1., 0.75, vUv.y);
          float flick = 0.8 + 0.2 * sin(uTime * 0.7 + vUv.x * 3.);
          gl_FragColor = vec4(vec3(0.62, 0.6, 1.0) * edge * fall * flick * 0.14, 1.); }`,
      });
      let r = [],
        i = [],
        a = [];
      for (let t = 0; t < 16; t += 2) {
        if (t === 4 || t === 12 || e.chance(0.35)) continue;
        let o = ((t * 360) / 16) * iT,
          s = Math.cos(o),
          c = Math.sin(o),
          l = -c,
          u = s,
          d = { x: s * 29.6, y: n.height(0, 0) + 9.5, z: c * 29.6 },
          f = { x: s * 19, y: n.height(s * 19, c * 19) - 0.2, z: c * 19 },
          p = 2.2 * VFX_SCALE,
          m = r.length / 3;
        for (let [e, t] of [
          [d, 1],
          [f, 0],
        ])
          for (let n of [-1, 1]) (r.push(e.x + l * p * n, e.y, e.z + u * p * n), i.push(n < 0 ? 0 : 1, t));
        a.push(m, m + 1, m + 2, m + 1, m + 3, m + 2);
      }
      let o = new Oi();
      (o.setAttribute(`position`, new Dr(r, 3)),
        o.setAttribute(`uv`, new Dr(i, 2)),
        o.setIndex(a),
        (this.shafts = new Tr(o, this.shaftMat)),
        (this.shafts.renderOrder = 9),
        this.group.add(this.shafts));
    }
    onFloor() {
      let e = this.run,
        t = this.def;
      ((this.wave = 0),
        (this.stT = 0),
        (this.waveT = 0),
        (this.state = this.roof ? `roof` : `intro`),
        (this.toSpawn = 0),
        (this.waveList = []),
        (this.guardian = null),
        (this.pulseT = 2),
        (this.stairWarn = !1),
        (this.callT = 0),
        (this.curse = { hp: 1, speed: 1, amount: 1 }));
      for (let t of this.afterClimb.splice(0)) e.later(2.5, t);
      let n = this.floorCurse;
      if (
        (n === `iron` && (this.curse.hp = 1.4),
        n === `swift` && (this.curse.speed = 1.25),
        (e.director.cards = (this.beyond ? tT : t.pool)
          .filter((e) => k.hasSprite(e))
          .map((e) => ({ id: e, cost: 1 + k.get(e).bst / 220, weight: 1 }))),
        this.roof)
      ) {
        (e.ui.banner(
          c(`¡La Torre es tuya!`),
          c(`La luna llena ilumina Pueblo Lavanda. Baja con tu victoria... o cruza la puerta del Más Allá`),
          `#c8a8ff`,
          { species: 94 },
        ),
          e.audio.victory());
        return;
      }
      let r = this.beyond
          ? c(`Más Allá · Piso {n}`, { n: this.floor })
          : c(`{n}F · {name}`, { n: this.floor, name: t.name }),
        i = this.beyond
          ? n
            ? c(`Maldición: {name}`, { name: CT.find((e) => e.id === n)?.name ?? n })
            : c(`Los pisos no acaban. ¿Hasta dónde llegarás?`)
          : t.sub;
      (e.later(0.8, () =>
        e.ui.banner(r, i, this.beyond ? `#5affd8` : `#b08aff`, {
          species: this.bossFloor ? t.guardian.id : (this.beyond ? tT : t.pool)[0],
        }),
      ),
        t.bell && !this.beyond && this.ringBell(2));
    }
    waveSize(e) {
      let t = this.run,
        n = t.player.stats,
        r = this.beyond ? Math.min(120, 46 + (this.floor - 8) * 3 + e * 6) : this.def.waves[e];
      return Math.round(r * t.diff.enemyAmount * n.enemyAmount * this.curse.amount);
    }
    startWave() {
      let e = this.run,
        t = this.wave;
      ((this.state = `wave`),
        (this.stT = 0),
        (this.waveT = 0),
        (this.waveList = []),
        (this.toSpawn = this.waveSize(t)),
        (this.burstT = 0.4),
        e.ui.toast(c(`Oleada {n} de 3`, { n: t + 1 }), null),
        e.audio.alarm(),
        t === 2 &&
          ((this.state = `guard`),
          this.bossFloor && (this.toSpawn = 0),
          e.later(2.2, () => this.spawnGuardian())));
    }
    spawnPoint(e) {
      let t = this.run.player.pos;
      for (let n = 0; n < 12; n++) {
        let n, r;
        if (e || !this.graves.length || F.chance(0.45)) {
          let e = F.range(0, Math.PI * 2),
            t = F.range(26.5, 28);
          ((n = Math.cos(e) * t), (r = Math.sin(e) * t));
        } else {
          let e = F.pick(this.graves),
            t = F.range(0, Math.PI * 2);
          ((n = e.x + Math.cos(t) * 1.6), (r = e.z + Math.sin(t) * 1.6));
        }
        if (!(Math.hypot(n - t.x, r - t.z) < 9 || oT(n, r, 0.8))) return { x: n, z: r };
      }
      let n = F.range(0, Math.PI * 2);
      return { x: t.x + Math.cos(n) * 14, z: t.z + Math.sin(n) * 14 };
    }
    spawnOne(e = 0) {
      let t = this.run,
        n = t.enemies,
        r = this.def,
        i = (this.beyond ? tT : r.pool).filter((e) => k.hasSprite(e));
      if (!i.length) return;
      let a = F.pick(i),
        o = sT(a),
        s = this.spawnPoint(o),
        c = 0.03 + 0.012 * this.floor + (this.beyond ? 0.04 : 0),
        l = n.spawn(
          a,
          s.x,
          s.z,
          t.director.hpMult(),
          t.director.dmgMult(),
          e | (F.chance(c * t.player.stats.eliteSpawn) ? R.Elite : 0),
        );
      if (l < 0) return;
      this.waveList.push([l, n.gen[l]]);
      let u = this.floorCurse === `twin` ? 2 : 1,
        d = Math.min(0.95, (o ? (this.beyond ? 0.6 : r.veil) : this.beyond ? 0.15 : r.veilAny) * u);
      (this.floor >= 3 || this.beyond) && F.chance(d) && (n.veil[l] = 1);
      let f = t.terrain.height(s.x, s.z);
      o || n.veil[l]
        ? t.vfx.add.spawn({
            x: s.x,
            y: f + 1,
            z: s.z,
            life: 0.7,
            size: 2.4,
            endSize: 0,
            color: 10124031,
            shape: I.Wisp,
            glow: 0.6,
          })
        : t.vfx.dust(s.x, f, s.z, 12103880, 6, 4);
    }
    spawnGuardian() {
      let e = this.run,
        t = this.def,
        n = e.enemies;
      if (this.state !== `guard`) return;
      let r = t.guardian.id,
        i = t.guardian.kind;
      (this.beyond &&
        (this.bossFloor
          ? ((r = nT[Math.floor((this.floor - 8) / 5) % nT.length]), (i = `boss`))
          : i === `boss` && (i = `totem`)),
        k.hasSprite(r) || (r = F.pick(this.beyond ? tT : t.pool)));
      let a = F.range(0, Math.PI * 2),
        o = Math.cos(a) * 10,
        s = Math.sin(a) * 10 - 4,
        c = -1;
      (i === `boss`
        ? ((c = e.boss.spawn(r, o, s, !1, {
            secs: wy.guardian[Math.min(2, this.curveStage - 1)] * (this.beyond ? 0.8 : 1),
          })),
          (e.bossSpawned = !0))
        : (i === `totem`
            ? e.minibosses.spawnTotem(r, { x: o, z: s })
            : e.minibosses.spawnSummoner(r, { x: o, z: s })) && (c = e.minibosses.lastIndex),
        c < 0
          ? (this.guardian = [0, -1])
          : ((this.guardian = [c, n.gen[c]]), this.def.bell && !this.beyond && this.ringBell(3)));
    }
    alive(e) {
      let t = this.run.enemies,
        n = 0;
      for (let [r, i] of e) t.gen[r] === i && t.isAlive(r) && !(t.flags[r] & R.Object) && n++;
      return n;
    }
    get left() {
      return this.toSpawn + this.alive(this.waveList) + +!!this.guardianUp;
    }
    get guardianUp() {
      let e = this.guardian,
        t = this.run.enemies;
      return !!e && t.gen[e[0]] === e[1] && t.isAlive(e[0]);
    }
    onBossKilled(e) {
      let t = this.run,
        n = t.enemies,
        r = n.species[e],
        i = n.x[e],
        a = n.y[e],
        o = n.z[e];
      if (
        (t.boss.kit && (t.boss.kit.dead = !0),
        t.projectiles.clearHostile(),
        (t.bossSpawned = !1),
        t.stats.bosses++,
        t.meta.count(`bosses`, 1),
        t.hitstop(0.5),
        t.shake(0.8),
        (t.audio.intensity = 0.3),
        r === 105 && !this.beyond)
      ) {
        ((this.marowak = !0),
          t.ui.banner(
            c(`Descansa en paz`),
            c(`El espíritu de Marowak se desvanece en paz... y un Cubone se une a ti`),
            `#bfe8ff`,
            { species: 105 },
          ));
        for (let e = 0; e < 50; e++)
          t.vfx.add.spawn({
            x: i + F.range(-1, 1),
            y: a + F.range(0, 2),
            z: o + F.range(-1, 1),
            vy: F.range(2, 6),
            life: F.range(1.2, 2.2),
            size: 0.4,
            endSize: 0,
            color: e % 3 ? 12577023 : 16777215,
            shape: I.Twinkle,
            glow: 1,
          });
        t.later(2.4, () =>
          t.allies.recruit(104, i, a, o, () => {}, c(`Cubone se queda junto a la tumba de su madre.`)),
        );
      } else
        r === 94 && !this.beyond
          ? ((this.won = !0),
            (t.regionCleared = !1),
            t.ui.banner(
              c(`¡Has vencido a Gengar!`),
              c(`La Torre Lavanda recupera la calma. La escalera lleva a la azotea`),
              `#ffd23a`,
              { species: 94 },
            ),
            this.ringBell(4))
          : t.ui.banner(c(`¡Guardián derrotado!`), c(`El piso queda en calma`), `#ffd23a`, { species: r });
      t.audio.victory();
      for (let e = 0; e < 16; e++)
        t.pickups.spawn(`coin`, i, a, o, Math.ceil(5 * this.curveStage * t.player.stats.gold));
    }
    clearFloor() {
      let e = this.run,
        t = e.player;
      ((this.state = `clear`),
        (this.stT = 0),
        (this.wave = 3),
        e.stats.stagesCleared++,
        e.splits.push(e.time),
        (e.stageCleared = !0),
        t.heal(t.maxHp * 0.3),
        e.projectiles.clearHostile(),
        this.floor === 4 && !this.beyond && this.dark4 === 0 && this.offerings.push(`dark4`),
        this.setGlow(),
        (e.pickups.magnetAll = Math.max(e.pickups.magnetAll, 8)),
        e.spawnChestAt(0, 4.5, `free`, 0, 4.5),
        e.ui.banner(
          this.beyond ? c(`¡Piso {n} superado!`, { n: this.floor }) : c(`¡{n}F superado!`, { n: this.floor }),
          this.floor === 7 && !this.beyond
            ? c(`Sube a la azotea`)
            : c(`Haz una ofrenda en el altar y sube por la escalera`),
          `#ffd23a`,
        ),
        e.audio.victory(),
        e.later(0.2, () => e.checkpoint()));
    }
    update(e) {
      let t = this.run,
        n = t.player,
        r = n.pos;
      this.stT += e;
      let i = t.terrain.arenaR - 0.4,
        a = Math.hypot(r.x, r.z);
      a > i && ((r.x *= i / a), (r.z *= i / a));
      let o = this.entryStairs && Math.abs(r.x - qw.x) < 4.6 && r.z > qw.z + 1.2,
        s = !this.roof && this.state !== `clear` && Math.abs(r.x - Gw.x) < 4.6 && r.z < Gw.z - 1.2;
      if (
        ((o || s) &&
          !n.dead &&
          ((r.z = o ? qw.z - 2.5 : Gw.z + 2.5), (r.y = t.terrain.height(r.x, r.z)), n.vel.set(0, 0, 0)),
        this.state === `intro` && this.stT >= cT)
      )
        this.startWave();
      else if (this.state === `wave` || this.state === `guard`) {
        if (
          ((this.waveT += e),
          this.spawnTick(e),
          this.toSpawn <= 0 &&
            this.alive(this.waveList) === 0 &&
            (this.state === `wave` || (this.guardian && !this.guardianUp)) &&
            (this.clearGraveGhosts(),
            this.wave++,
            this.wave >= 3
              ? this.clearFloor()
              : ((this.state = `break`),
                (this.stT = 0),
                t.ui.toast(c(`¡Oleada superada! Respira...`), null),
                n.heal(n.maxHp * 0.08))),
          (this.stragT -= e),
          this.stragT <= 0 && this.toSpawn <= 0)
        ) {
          this.stragT = 1;
          let e = t.enemies,
            n = 0;
          for (let [t, r] of this.waveList) e.gen[t] === r && e.isAlive(t) && n++;
          if (n <= 4 || this.waveT > 75)
            for (let [t, n] of this.waveList)
              e.gen[t] === n && e.isAlive(t) && e.veil[t] === 1 && this.reveal(t);
          if (n > 0 && n <= 2 && this.waveT > 100)
            for (let [n, r] of this.waveList) {
              if (
                e.gen[n] !== r ||
                !e.isAlive(n) ||
                e.flags[n] & R.Object ||
                (!t.terrain.inSolid(e.x[n], e.z[n]) && Math.hypot(e.x[n], e.z[n]) < t.terrain.arenaR)
              )
                continue;
              let i = this.spawnPoint(!1);
              ((e.x[n] = i.x),
                (e.z[n] = i.z),
                (e.y[n] = t.terrain.height(i.x, i.z)),
                t.vfx.dust(i.x, e.y[n], i.z, 12103880, 6, 4));
            }
        }
      } else this.state === `break` && this.stT >= lT && this.startWave();
      if (
        (this.state === `clear` &&
          !this.climbing &&
          !this.roof &&
          this.stairs &&
          !n.dead &&
          Math.abs(r.x - Gw.x) < 3 &&
          r.z < Gw.z - Kw.len + 1.5 &&
          r.y > Kw.rise - 1.5 &&
          ((this.climbing = !0),
          this.warnAltar()
            ? t.later(5, () => {
                this.climbing = !1;
              })
            : (this.interact(this.stairs),
              t.later(2, () => {
                this.climbing = !1;
              }))),
        this.state === `clear` &&
          !this.roof &&
          this.altar &&
          !this.altar.used &&
          ((this.callT -= e), this.callT <= 0))
      ) {
        this.callT = 1.6;
        let e = this.altar,
          n = t.terrain.height(e.x, e.z);
        t.vfx.ring(e.x, n + 0.1, e.z, 3.4, 15257855, 0.9, 0.3);
        for (let r = 0; r < 4; r++)
          t.vfx.add.spawn({
            x: e.x + F.range(-0.8, 0.8),
            y: n + 0.5,
            z: e.z + F.range(-0.8, 0.8),
            vy: F.range(3, 6),
            life: 1.3,
            size: 0.5,
            endSize: 0,
            color: 15257855,
            shape: I.Twinkle,
            glow: 1,
          });
      }
      (this.pulse(e),
        this.updateCandles(e),
        this.def.purified && !this.beyond && !this.roof && this.updateHoly(e),
        this.floorCurse === `graves` &&
          (this.state === `wave` || this.state === `guard`) &&
          this.updateGraves(e),
        this.ambience(e),
        this.updateBell(e),
        this.state === `clear` &&
          Math.random() < e * 6 &&
          this.stairs &&
          t.vfx.add.spawn({
            x: Gw.x + F.range(-2, 2),
            y: t.terrain.height(Gw.x, Gw.z) + F.range(0.5, 5),
            z: Gw.z - F.range(0, 6),
            vy: 1,
            life: 1.2,
            size: 0.35,
            endSize: 0,
            color: 12618495,
            shape: I.Twinkle,
            glow: 0.8,
          }));
    }
    clearGraveGhosts() {
      let e = this.run.enemies;
      for (let [t, n] of this.graveGhosts)
        e.gen[t] === n &&
          e.alive[t] &&
          (this.run.vfx.burst(e.x[t], e.y[t] + 1, e.z[t], 11561727, 8, 3, I.Wisp, 0.4, 0.6), e.kill(t));
      this.graveGhosts = [];
    }
    spawnTick(e) {
      let t = this.run;
      if (this.toSpawn <= 0 || ((this.burstT -= e), this.burstT > 0)) return;
      this.burstT = this.beyond ? 0.75 : 0.95;
      let n = Math.min(t.enemyCap, vT + this.floor * 4),
        r = Math.min(this.toSpawn, Math.max(2, Math.ceil(this.waveSize(this.wave) / 14)));
      for (let e = 0; e < r && t.enemies.count < n; e++) (this.spawnOne(), this.toSpawn--);
    }
    pulse(e) {
      let t = this.run,
        n = t.enemies,
        r = t.player.pos;
      if (!(this.floor >= 3 || this.beyond) || this.roof || ((this.pulseT -= e), this.pulseT > 0)) return;
      this.pulseT = uT;
      let i = dT + fT * (t.player.items.get(`silph-scope`) ?? 0);
      this.lastPulse = { t: t.time, x: r.x, z: r.z };
      let a = t.terrain.height(r.x, r.z);
      (t.vfx.ring(r.x, a, r.z, i, 9103615, 0.7, 0.35), t.vfx.ring(r.x, a, r.z, i * 0.6, 13150463, 0.5, 0.25));
      let o = 0;
      for (let e of n.within(r.x, r.z, i)) n.veil[e] === 1 && (this.reveal(e), o++);
      o && t.audio.scope();
    }
    reveal(e) {
      let t = this.run,
        n = t.enemies;
      ((n.veil[e] = 0),
        t.combat.applyStatus(e, `curse`, 0),
        (n.curse[e] = Math.max(n.curse[e], 8)),
        this.reveals++,
        t.vfx.burst(n.x[e], n.y[e] + n.hgt[e] * 0.6, n.z[e], 9103615, 10, 4, I.Twinkle, 0.4, 0.5),
        (this.reveals === 1 || Math.random() < 0.15) &&
          t.ui.popup(n.x[e], n.y[e] + n.hgt[e] + 1, n.z[e], c(`¡Revelado!`), `#8ae8ff`, 0.9),
        this.reveals === 1 &&
          t.ui.toast(
            c(`El Visor Silph revela a los fantasmas cercanos: ahora reciben más daño`),
            `silph-scope`,
          ));
    }
    litCount(e = !1) {
      return this.candles.filter((t) => t.lit > 0 && (!e || t.memorial)).length;
    }
    updateCandles(e) {
      let t = this.run,
        n = t.player,
        r = n.pos,
        i = t.enemies,
        a = this.floorCurse === `dark`;
      for (let o of this.candles) {
        let s = Math.hypot(r.x - o.x, r.z - o.z);
        if (o.lit > 0) {
          if (((o.lit -= e), o.lit <= 0)) {
            ((o.lit = 0),
              o.flame && (o.flame.visible = !1),
              t.vfx.burst(o.x, o.y + 2.2, o.z, 9075354, 6, 2, I.Soft, 0.4, 0.8));
            continue;
          }
          if (
            (Math.random() < e * 8 &&
              t.vfx.ground.spawn({
                x: o.x,
                y: o.y + 0.12,
                z: o.z,
                life: 0.3,
                size: gT * 2,
                endSize: gT * 2,
                color: 5913106,
                shape: I.Soft,
                glow: 0.1,
                rot: 0,
              }),
            Math.random() < e * 10 &&
              t.vfx.add.spawn({
                x: o.x + F.range(-0.5, 0.5),
                y: o.y + 2.2,
                z: o.z + F.range(-0.5, 0.5),
                vy: 0.8,
                life: 0.5,
                size: 0.3,
                endSize: 0,
                color: o.lit < 5 && Math.sin(t.time * 20) > 0 ? 16752704 : 16765562,
                shape: I.Soft,
                glow: 1,
              }),
            Math.random() < e * 3)
          )
            for (let e of i.within(o.x, o.z, gT)) i.veil[e] === 1 && this.reveal(e);
          s < gT && this.floorCurse !== `hunger` && !n.dead && n.heal(n.maxHp * _T * e);
        } else if (s < 2.4 && Math.abs(r.y - o.y) < 1.5 && !n.dead) {
          if (a) {
            o.charge === 0 &&
              ((o.charge = 0.01), t.ui.popup(o.x, o.y + 3, o.z, c(`¡No prende!`), `#9a8ab8`, 0.8));
            continue;
          }
          ((o.charge += e / pT),
            t.altarRing(o.x, o.y, o.z, 2.4, Math.min(1, o.charge), 16762986),
            o.charge >= 1 && this.light(o));
        } else o.charge = Math.max(0, o.charge - e);
      }
    }
    light(e) {
      let t = this.run;
      ((e.charge = 0),
        (e.lit = this.def.dark && !this.beyond ? hT : mT),
        e.flame && (e.flame.visible = !0),
        this.candlesLit++,
        this.floor === 4 && !this.beyond && this.dark4++,
        t.vfx.ring(e.x, e.y, e.z, gT, 16762986, 0.6),
        t.vfx.burst(e.x, e.y + 2.2, e.z, 16765562, 14, 4, I.Twinkle, 0.4, 0.6),
        t.audio.power(),
        this.candlesLit === 1 &&
          t.ui.toast(c(`La luz de las velas revela a los fantasmas y te cura poco a poco`), null));
    }
    updateHoly(e) {
      let t = this.run,
        n = t.player,
        r = n.pos,
        i = this.holy,
        a = t.terrain;
      i.k += e / 16;
      let o = i.k * Math.PI * 0.5,
        s = Math.cos(o) * 12,
        l = Math.sin(o) * 12;
      ((i.x += (s - i.x) * Math.min(1, e * 0.6)), (i.z += (l - i.z) * Math.min(1, e * 0.6)));
      let u = a.height(i.x, i.z);
      if (
        (Math.random() < e * 6 &&
          t.vfx.ground.spawn({
            x: i.x,
            y: u + 0.14,
            z: i.z,
            life: 0.25,
            size: yT * 2,
            endSize: yT * 2,
            color: 2775642,
            shape: I.Soft,
            glow: 0.2,
            rot: 0,
          }),
        t.vfx.staticRing(i.x, u + 0.15, i.z, yT, 10158056, 0.9),
        Math.random() < e * 14)
      ) {
        let e = F.range(0, Math.PI * 2);
        t.vfx.add.spawn({
          x: i.x + Math.cos(e) * yT,
          y: u + 0.3,
          z: i.z + Math.sin(e) * yT,
          vy: F.range(1, 2.4),
          life: 1,
          size: 0.3,
          endSize: 0,
          color: 13172720,
          shape: I.Twinkle,
          glow: 0.8,
        });
      }
      let d = this.state === `wave` || this.state === `guard`,
        f = Math.hypot(r.x - i.x, r.z - i.z) < yT;
      n.dead ||
        (f
          ? (n.heal(n.maxHp * bT * e), (n.pstat.sleep = 0))
          : d &&
            (this.mistSaid ||
              ((this.mistSaid = !0), t.ui.toast(c(`Fuera del círculo sagrado, la niebla te consume`), null)),
            Math.random() < e * 10 &&
              t.vfx.norm.spawn({
                x: r.x + F.range(-2, 2),
                y: r.y + F.range(0.2, 1.6),
                z: r.z + F.range(-2, 2),
                vy: 0.3,
                life: 1.2,
                size: 1,
                endSize: 1.8,
                color: 8018600,
                shape: I.Soft,
              }),
            (this.holyHurtT -= e),
            this.holyHurtT <= 0 &&
              ((this.holyHurtT = 0.5), n.hurt(n.maxHp * xT * 0.5, `ghost`, -1, NaN, NaN, !0))));
    }
    updateGraves(e) {
      let t = this.run,
        n = t.player.pos;
      if (
        ((this.graveT -= e),
        this.graveT > 0 ||
          !this.graves.length ||
          ((this.graveT = F.range(5, 8)), this.alive(this.graveGhosts) >= 6))
      )
        return;
      let r = this.graves.filter((e) => Math.hypot(e.x - n.x, e.z - n.z) < 14),
        i = r.length ? F.pick(r) : F.pick(this.graves),
        a = t.terrain.height(i.x, i.z),
        o = 3.2;
      (t.vfx.telegraph(i.x, a, i.z, o, 11561727, 1.1),
        t.later(1.1, () => {
          (t.vfx.burst(i.x, a + 1, i.z, 11561727, 18, 6, I.Skull, 0.5, 0.6),
            t.vfx.ring(i.x, a, i.z, o, 11561727, 0.4),
            t.audio.boom(0.5));
          let e = t.player.pos;
          (e.x - i.x) ** 2 + (e.z - i.z) ** 2 < o * o &&
            e.y - a < 2 &&
            t.player.hurt(t.player.maxHp * 0.08, `ghost`, -1, i.x, i.z, !0);
          let n = t.enemies.spawn(92, i.x, i.z, t.director.hpMult(), t.director.dmgMult(), 0);
          n >= 0 && ((t.enemies.veil[n] = 1), this.graveGhosts.push([n, t.enemies.gen[n]]));
        }));
    }
    ringBell(e) {
      let t = this.run;
      this.bellT = Math.max(this.bellT, e * 1.3);
      for (let n = 0; n < e; n++)
        t.later(n * 1.3, () => {
          (t.audio.bell(),
            t.shake(0.18),
            t.vfx.ring(aT.x, t.terrain.height(aT.x, aT.z), aT.z, 12 + n * 4, 14207231, 0.8, 0.4));
        });
    }
    updateBell(e) {
      this.bell &&
        ((this.bellT = Math.max(0, this.bellT - e)),
        (this.bell.rotation.x =
          this.bellT > 0
            ? Math.sin(this.run.time * 4.8) * 0.45 * Math.min(1, this.bellT)
            : this.bell.rotation.x * 0.9));
    }
    ambience(e) {
      let t = this.run,
        n = t.r.camera.position,
        r = t.terrain;
      for (let i = 0, a = Math.floor(e * 18 + Math.random()); i < a; i++) {
        let e = n.x + F.range(-18, 18),
          i = n.z + F.range(-18, 18);
        Math.hypot(e, i) > 29 ||
          t.vfx.add.spawn({
            x: e,
            y: r.height(e, i) + F.range(0.5, 7),
            z: i,
            vx: F.range(-0.2, 0.2),
            vy: F.range(-0.05, 0.12),
            vz: F.range(-0.2, 0.2),
            life: F.range(2.5, 4),
            size: 0.09,
            endSize: 0.04,
            color: this.beyond ? 10158056 : 14209279,
            shape: I.Soft,
            glow: 0.6,
          });
      }
      if (Math.random() < e * (this.beyond ? 2.5 : 1.2)) {
        let e = F.range(0, Math.PI * 2),
          n = 28.5;
        t.vfx.add.spawn({
          x: Math.cos(e) * n,
          y: r.height(0, 0) + F.range(1, 6),
          z: Math.sin(e) * n,
          vx: -Math.sin(e) * 1.2,
          vy: 0.2,
          vz: Math.cos(e) * 1.2,
          life: 2.6,
          size: 1.2,
          endSize: 0,
          color: this.beyond ? 5963736 : 10124031,
          shape: I.Wisp,
          glow: 0.5,
        });
      }
    }
    atmos() {
      let e = this.out,
        t = this.roof ? DT : this.beyond ? ET : wT;
      return (
        (e.k = 1),
        (e.flash = 0),
        e.top.set(t.top),
        e.bottom.set(t.bottom),
        e.fog.set(t.fog),
        (e.near = t.near),
        (e.far = t.far),
        (e.light = t.light),
        e.sun.set(t.sun),
        (e.clouds = t.clouds),
        (e.cover = t.cover),
        (e.vignette = t.vignette),
        (e.tint = t.tint),
        e
      );
    }
    label(e) {
      switch (e.data?.sub) {
        case `stairs`:
          return this.state === `clear`
            ? this.floor === 7 && !this.beyond
              ? c(`Subir a la azotea`)
              : this.beyond
                ? c(`Subir al piso {n} del Más Allá`, { n: this.floor + 1 })
                : c(`Subir al {n}F`, { n: this.floor + 1 })
            : c(`La escalera está sellada: supera las oleadas`);
        case `altar`:
          return this.state === `clear`
            ? e.used
              ? c(`Ya hiciste tu ofrenda`)
              : c(`Hacer una ofrenda · una bendición para la partida`)
            : c(`Altar de ofrendas · se abre al superar el piso`);
        case `trick`:
          return e.used ? c(`La lápida ya no sonríe`) : c(`Lápida de Gengar · ¿truco o trato?`);
        case `portal`:
          return c(`Cruzar la puerta del Más Allá`);
        case `leave`:
          return c(`Bajar de la Torre · terminar con la victoria`);
        default:
          return ``;
      }
    }
    interact(e) {
      let t = this.run;
      switch (e.data?.sub) {
        case `stairs`:
          if (this.state !== `clear`) {
            (t.ui.toast(c(`Una barrera espectral sella la escalera`), null), t.audio.deny());
            return;
          }
          if (this.warnAltar()) return;
          this.beyond ? this.pickCurse(() => void t.climb()) : t.climb();
          break;
        case `altar`:
          if (this.state !== `clear` || e.used) {
            e.used || t.audio.deny();
            return;
          }
          ((e.used = !0),
            this.setGlow(),
            this.offerings.push(String(this.floor)),
            t.offerBlessing(
              c(`Ofrenda de la Torre`),
              this.beyond ? 3 : ([0, 0, 1, 1, 2, 2, 3][this.floor - 1] ?? 2),
              3,
              1,
            ),
            t.vfx.burst(e.x, e.y + 2, e.z, 13150463, 24, 5, I.Twinkle, 0.5, 0.8));
          break;
        case `trick`:
          this.trickOrTreat(e);
          break;
        case `portal`:
          this.pickCurse(() => void t.climb());
          break;
        case `leave`:
          t.finish(!0);
      }
    }
    warnAltar() {
      return this.stairWarn || !this.altar || this.altar.used || this.state !== `clear`
        ? !1
        : ((this.stairWarn = !0),
          this.run.ui.toast(
            c(
              `Aún no has hecho tu ofrenda en el altar. Si subes ahora, la pierdes: pulsa otra vez para subir igualmente`,
            ),
            null,
          ),
          this.run.audio.deny(),
          !0);
    }
    pickCurse(e) {
      let t = this.run,
        n = F.shuffle(CT.slice()).slice(0, 2);
      ((t.state = `modal`),
        t.ui.showPact(t, n, (n) => {
          (t.ui.hideModal(),
            (this.floorCurse = n?.id ?? null),
            n && (this.curses.push(n.id), n.take(t)),
            t.resume(),
            e());
        }));
    }
    trickOrTreat(e) {
      let t = this.run;
      ((t.state = `modal`),
        t.ui.showTrade(
          t,
          {
            title: c(`¿Truco o trato?`),
            help: c(`Gengar sonríe desde la lápida. Una sola respuesta.`),
            species: 94,
            offers: [
              {
                key: `treat`,
                name: c(`Trato`),
                tag: c(`Seguro`),
                color: `#ffb04a`,
                item: `rare-candy`,
                boon: c(`Caramelos: +25 % de PS y experiencia`),
                bane: c(`Nada que temer`),
              },
              {
                key: `trick`,
                name: c(`Truco`),
                tag: c(`Arriesgado`),
                color: `#b06aff`,
                species: 94,
                boon: c(`Un premio grande... o no`),
                bane: c(`Maldición, emboscada o robo`),
              },
            ],
          },
          (n) => {
            if ((t.resume(), !n)) return;
            e.used = !0;
            let r = e.group?.getObjectByName(`Eyes`);
            r && (r.visible = !1);
            let i = e.group?.getObjectByName(`Grin`);
            if ((i && (i.visible = !1), t.cry(94), n === `treat`)) {
              let n = t.player;
              (n.heal(n.maxHp * 0.25), n.addXp(n.xpNext * 0.35));
              for (let n = 0; n < 3; n++)
                t.pickups.spawn(`candy`, e.x + F.range(-1, 1), e.y + 1, e.z + F.range(-1, 1), 1);
              (t.vfx.burst(e.x, e.y + 2, e.z, 16756810, 22, 5, I.Heart, 0.5, 0.7),
                t.ui.toast(c(`¡Trato! Gengar te da unos caramelos`), `rare-candy`));
              return;
            }
            this.tricks++;
            let a = Math.random() / Math.min(1.5, Math.sqrt(t.player.stats.luckMult));
            if (a < 0.3)
              (t.ui.banner(c(`¡Truco... con premio!`), c(`Gengar se ríe y te deja un regalo`), `#ffd23a`, {
                species: 94,
              }),
                t.rollChestItem(!0, 2));
            else if (a < 0.45) {
              let n = Math.round(Math.max(60, 0.6 * OS(t)));
              (t.addGold(n),
                t.ui.toast(c(`¡Truco! Llueven Pokédólares: +{n} ₽`, { n }), `nugget`),
                t.vfx.burst(e.x, e.y + 2, e.z, 16765498, 24, 6, I.Star, 0.5, 0.7));
            } else if (a < 0.7) this.ambush(e);
            else if (a < 0.85)
              (t.curses++,
                t.tempMods.push({ stat: `difficulty`, mul: 1.06 }),
                t.player.recompute(),
                t.ui.banner(
                  c(`¡Truco! Te ha caído una maldición`),
                  c(`+6 % de dificultad el resto de la partida`),
                  `#b06aff`,
                  { species: 94 },
                ),
                t.vfx.burst(e.x, e.y + 2.5, e.z, 11561727, 26, 6, I.Skull, 0.6, 0.8));
            else {
              let n = Math.floor(t.gold * 0.3);
              ((t.gold -= n),
                t.ui.toast(
                  n > 0
                    ? c(`¡Truco! Gengar te roba {n} ₽ y se esfuma`, { n })
                    : c(`¡Truco! Gengar busca algo que robarte... y no encuentra nada`),
                  null,
                ),
                t.vfx.burst(e.x, e.y + 2, e.z, 8014504, 16, 6, I.Wisp, 0.6, 0.7));
            }
            t.audio.bossStart();
          },
        ));
    }
    ambush(e) {
      let t = this.run,
        n = t.enemies,
        r = t.player.pos,
        i = 6 + Math.min(10, this.floor);
      (t.ui.banner(c(`¡Truco! ¡Una emboscada!`), c(`Los fantasmas salen de la lápida`), `#b06aff`, {
        species: 93,
      }),
        t.vfx.ring(e.x, e.y, e.z, 7, 10115839, 0.6));
      for (let e = 0; e < i; e++) {
        let a = (e / i) * Math.PI * 2,
          o = F.range(6, 8),
          s = r.x + Math.cos(a) * o,
          c = r.z + Math.sin(a) * o;
        if (!t.terrain.inBounds(s, c, 2)) continue;
        let l = this.floor >= 6 || this.beyond ? (e === 0 ? 94 : 93) : e === 0 ? 93 : 92,
          u = n.spawn(l, s, c, t.director.hpMult(), t.director.dmgMult(), e === 0 ? R.Elite : 0);
        u < 0 ||
          (this.floor >= 3 && (n.veil[u] = 1),
          (this.state === `wave` || this.state === `guard`) && this.waveList.push([u, n.gen[u]]),
          t.vfx.add.spawn({
            x: s,
            y: n.y[u] + 1,
            z: c,
            life: 0.7,
            size: 2.6,
            endSize: 0,
            color: 10124031,
            shape: I.Wisp,
            glow: 0.6,
          }));
      }
    }
    result() {
      return {
        floor: this.floor,
        wave: this.roof ? 3 : Math.min(3, this.wave),
        won: this.won,
        marowak: this.marowak,
        curses: this.curses.slice(),
        reveals: this.reveals,
        tricks: this.tricks,
        candles: this.candlesLit,
        offerings: this.offerings.slice(),
      };
    }
    advance() {
      this.roof
        ? ((this.roof = !1), (this.floor = 8))
        : this.floor === 7 && !this.beyond
          ? (this.roof = !0)
          : this.floor++;
    }
    disposeFloor() {
      ((this.disposed = !0), this.run.terrain);
      for (let e of this.colliders) e.off = !0;
      (this.group.traverse((e) => {
        e.geometry?.dispose();
      }),
        this.group.parent?.remove(this.group),
        this.shaftMat?.dispose(),
        (this.shaftMat = null),
        (this.shafts = null));
    }
    dispose() {
      this.disposeFloor();
    }
  },
  ultimateRechargeSeconds = 45,
  AT = 0.006,
  jT = 0.036,
  MT = 40,
  NT = class {
    run;
    charge = 0;
    readyBlinkAt = null;
    readyFlashAt = null;
    active = 0;
    uses = 0;
    killRoom = jT;
    drones;
    risers;
    denyT = 0;
    castPending = !1;
    constructor(e) {
      ((this.run = e), (this.drones = new Rh(e)), (this.risers = new zh(e)));
    }
    get quiet() {
      return !!this.run.meta.profile.settings.ultQuiet;
    }
    get ready() {
      return this.charge >= 1;
    }
    get readyPalette() {
      return readyPaletteForType(this.run.player.types?.[0]);
    }
    get def() {
      let e = this.run.player;
      return Xh(e.speciesId, e.types[0]);
    }
    get form() {
      return this.run.player.evoStage;
    }
    get tier() {
      let e = this.run.player;
      return Math.min(2, e.evoStage + e.growth);
    }
    get name() {
      return Zh(this.def, this.form);
    }
    rate() {
      let e = this.run.player;
      return (
        (e.ability === `lunar-blessing` ? 1.3 : 1) *
        (e.items.has(`soul-dew`) ? 1.4 : 1) *
        (e.items.has(`poke-flute`) ? 1.25 : 1) *
        (1 + 0.04 * this.run.meta.lab(`ult`))
      );
    }
    add(e) {
      if (this.active > 0) return;
      const wasReady = this.ready, rate = this.rate();
      this.charge = Math.min(1, this.charge + e * rate);
      if (this.readyBlinkAt == null && (1 - this.charge) * ultimateRechargeSeconds <= blinkDuration * rate) {
        this.readyBlinkAt = this.run.time;
      }
      if (this.ready && this.readyFlashAt == null) this.readyFlashAt = this.run.time;
      if (!wasReady && this.ready) {
        let e = this.run.player.pos;
        (this.run.vfx.ring(e.x, e.y, e.z, 3, this.readyPalette.ring, 0.5, 0.3),
          this.run.ui.toast(
            Da
              ? aa(c(`¡Ultimate lista! Pulsa Y: {name}`, { name: this.name }), `Y`, Pa(`R`))
              : uo
                ? c(`¡Ultimate lista! Toca su botón: {name}`, { name: this.name })
                : aa(c(`¡Ultimate lista! Pulsa R: {name}`, { name: this.name }), `R`, ta(`ult`)),
            null,
          ),
          J.sparkle(this.run.audio));
      }
    }
    onKill(e, t) {
      if (t !== 8) {
        if (e & R.Boss) this.add(0.3);
        else if (e & (R.Alpha | 12290)) this.add(0.12);
        else if (e & R.Elite) this.add(0.045);
        else {
          let e = Math.min(AT, this.killRoom);
          ((this.killRoom -= e), this.add(e));
        }
      }
    }
    onHurt(e) {
      this.add(e * 0.525);
    }
    update(e) {
      let t = this.run;
      ((this.killRoom = Math.min(jT, this.killRoom + jT * e)),
        (this.denyT = Math.max(0, this.denyT - e)),
        this.active > 0 ? (this.active = Math.max(0, this.active - e)) : this.add(e / ultimateRechargeSeconds),
        this.drones.update(e),
        this.risers.update(e));
      updateStarterSpeed(t,e,I.Soft);
      if (t.state === `play` && !t.player.dead && t.input.hit(`KeyR`)) {
        if (this.ready && this.active <= 0) this.fire();
        else {
          this.denyT = 0.4;
          t.audio.deny();
        }
      }
    }
    fire() {
      let e = this.run,
        t = e.player,
        n = this.def,
        r = this.form,
        i = this.tier,
        a = Qh(n, r);
      Na(0.8, 320);
      let o = e.aimDir(18),
        s = o.has ? o.x : t.facing.x,
        c = o.has ? o.z : t.facing.y,
        l = Math.hypot(s, c) || 1,
        u = {
          run: e,
          x: t.pos.x,
          y: t.pos.y,
          z: t.pos.z,
          ax: s / l,
          az: c / l,
          tier: i,
          form: r,
          type: n.type,
          cls: n.cls,
          dmg: MT * (1 + 0.1 * t.level) * Fg(e) * (1 + 0.15 * i),
          R: Math.sqrt(t.stats.area),
        };
      this.readyBlinkAt = this.readyFlashAt = null;
      this.castBanner = {start: performance.now(), color: this.readyPalette.base, evoStage: r};
      ((this.charge = 0),
        (this.active = a),
        e.upgradeTiming.beginUltimate(),
        this.uses++,
        e.stats.ultimates++,
        e.meta.count(`ultimates`, 1),
        t.onUltimate(),
        e.coop?.ult(Zh(n, r), a),
        (t.iframes = Math.max(t.iframes, a + 0.6)));
      e.vfx.crafted.ultimate(u,a);
      let d = this.quiet;
      ((t.ultPoseT = d ? 0 : 0.6),
        !d &&
          e.meta.profile.settings.ultPose !== !1 &&
          e.ui.ultCutIn(t.speciesId, Zh(n, r), Ni[n.type]),
        d || (e.ultLook(n.tint, a + 0.3), e.audio.duck(0.35, a + 0.6), J.start(e.audio)),
        (n.sfx ?? (() => {}))(e.audio, u));
      const sparks = [4,5,6,16].includes(t.speciesId) ? 0 : 24;
      if (sparks) e.vfx.ring(u.x, u.y, u.z, 4.5, Ni[n.type], 0.5, 0.9);
      for (let t = 0; t < sparks; t++) {
        let r = (t / 24) * Math.PI * 2,
          i = 4.5,
          a = 0.35;
        e.vfx.add.spawn({
          x: u.x + Math.cos(r) * i,
          y: u.y + 0.2 + (t % 4) * 0.6,
          z: u.z + Math.sin(r) * i,
          vx: (-Math.cos(r) * i) / a,
          vz: (-Math.sin(r) * i) / a,
          life: a,
          size: 0.45,
          endSize: 0.1,
          color: t % 3 ? Ni[n.type] : 16777215,
          shape: I.Twinkle,
          glow: 0.4,
        });
      }
      (e.shake(0.25),
        t.ability === `lunar-blessing` && t.heal(t.maxHp * 0.15),
        (this.castPending = !0),
        e.later(0.03, () => {
          ((this.castPending = !1), n.cast(u));
        }));
    }
    render() {
      (this.drones.render(), this.risers.render());
    }
    clear() {
      (clearStarterSpeed(this.run), this.drones.clear(), this.risers.clear(), (this.active = 0), (this.castPending = !1), this.run.upgradeTiming.clear());
    }
  },
  PT = { burn: 1, poison: 2, para: 4, frozen: 8, sleep: 16, wet: 32, curse: 64, slow: 128 },
  FT = { downed: 1, out: 2, bubble: 4, blink: 8, shiny: 16, spectral: 32, portal: 64, attack: 128 },
  IT = (e, t) => ((t & 15) << 12) | (e & 4095),
  LT = (e) => e & 4095,
  RT = (e) => (e >>> 12) & 15,
  zT = 11,
  BT = (e, t) => Math.max(-32768, Math.min(32767, Math.round(e * t))),
  VT = (e, t) => Math.round((Math.atan2(t, e) / (Math.PI * 2) + 1) * 256) & 255,
  // The wire format carries only 32 different enemy headings.
  enemyFacingX = Float32Array.from({length:32}, (_, i) => Math.cos(i * Math.PI / 16)),
  enemyFacingZ = Float32Array.from({length:32}, (_, i) => Math.sin(i * Math.PI / 16)),
  UT = class {
    buf = new ArrayBuffer(65536);
    dv = new DataView(this.buf);
    // Reuse the first teammate's encoded records when the second can see
    // the same enemies. Distances and reliable descriptors remain per peer.
    previousRecords = new Uint8Array(KT * zT);
    previousView = new DataView(this.previousRecords.buffer);
    previousOffsets = new Uint16Array(xf);
    head = 0;
    begin(e, t, n, r) {
      this.hasPrevious = false;
      this.bonus = Math.max(0, Math.round(t.bonus || 0));
      let i = this.dv,
        a = 0;
      if (
        (i.setUint8(a, 2),
        (a += 1),
        i.setUint8(a, +!!n | ((r & 15) << 4)),
        (a += 1),
        i.setFloat32(a, e, !0),
        (a += 4),
        i.setFloat32(a, t.x, !0),
        (a += 4),
        i.setFloat32(a, t.y, !0),
        (a += 4),
        i.setFloat32(a, t.z, !0),
        (a += 4),
        i.setInt8(a, Math.round(Math.max(-1, Math.min(1, t.aimX)) * 127)),
        (a += 1),
        i.setInt8(a, Math.round(Math.max(-1, Math.min(1, t.aimZ)) * 127)),
        (a += 1),
        i.setUint8(a, t.face & 255),
        (a += 1),
        i.setUint8(a, t.anim & 255),
        (a += 1),
        i.setUint16(a, t.species, !0),
        (a += 2),
        i.setFloat32(a, t.hpNow, !0),
        (a += 4),
        i.setFloat32(a, t.maxHp, !0),
        (a += 4),
        i.setUint16(a, Math.min(65535, t.level), !0),
        (a += 2),
        i.setUint8(a, t.flags & 255),
        (a += 1),
        i.setUint8(a, Math.round(Math.max(0, Math.min(1, t.revive)) * 255)),
        (a += 1),
        i.setUint8(a, Math.max(0, Math.min(255, Math.ceil(t.bleed)))),
        (a += 1),
        i.setUint8(a, +!!t.focus),
        (a += 1),
        t.focus && (i.setFloat32(a, t.focus.x, !0), (a += 4), i.setFloat32(a, t.focus.z, !0), (a += 4)),
        n)
      ) {
        (i.setFloat32(a, n.x, !0),
          (a += 4),
          i.setFloat32(a, n.y, !0),
          (a += 4),
          i.setFloat32(a, n.z, !0),
          (a += 4),
          i.setUint8(a, n.face & 255),
          (a += 1),
          i.setUint8(a, n.anim & 255),
          (a += 1),
          i.setFloat64(a, n.hp, !0),
          (a += 8),
          i.setFloat64(a, n.maxHp, !0),
          (a += 8),
          i.setUint8(a, n.acks.length),
          (a += 1));
        for (let [e, t] of n.acks) (i.setUint8(a, e), (a += 1), i.setUint16(a, t & 65535, !0), (a += 2));
      }
      this.head = a;
    }
    finish(ids, coop, remember = false) {
      const view = this.dv, enemies = coop.run.enemies;
      let i = this.head;
      view.setUint16(i, ids.length, true);
      i += 2;
      const start = i;
      if (remember) this.previousOffsets.fill(0);
      for (const id of ids) {
        const offset = this.hasPrevious ? this.previousOffsets[id] - 1 : -1;
        if (offset >= 0) {
          const previous = this.previousView;
          view.setUint32(i, previous.getUint32(offset));
          view.setUint32(i + 4, previous.getUint32(offset + 4));
          view.setUint16(i + 8, previous.getUint16(offset + 8));
          view.setUint8(i + 10, previous.getUint8(offset + 10));
          i += zT;
          continue;
        }
        if (remember) this.previousOffsets[id] = i - start + 1;
        const hp = enemies.hp[id] / Math.max(1e-9, enemies.maxHp[id]);
        const anim = enemies.atkAnim[id] > 0 ? 1 : enemies.frozen[id] > 0 || enemies.sleep[id] > 0 ? 2 : 0;
        view.setUint16(i, IT(id, enemies.gen[id]), true);
        view.setInt16(i + 2, BT(enemies.x[id], 20), true);
        view.setInt16(i + 4, BT(enemies.z[id], 20), true);
        view.setInt16(i + 6, BT(enemies.y[id], 20), true);
        view.setUint8(i + 8, Math.round(Math.max(0, Math.min(1, hp)) * 255));
        view.setUint8(i + 9, coop.stBits(id));
        view.setUint8(i + 10, (VT(enemies.fx[id], enemies.fz[id]) & 248) | anim);
        i += zT;
      }
      // Optional trailer after the counted enemy records; older v2 readers
      // ignore it and older senders have no bonus to display.
      if (remember && ids.length) {
        this.previousRecords.set(new Uint8Array(this.buf, start, i - start));
        this.hasPrevious = true;
      }
      if (this.bonus) { view.setFloat32(i,this.bonus,true); i+=4; }
      // Both transports take ownership of the bytes during sendSnap.
      return new Uint8Array(this.buf, 0, i);
    }
  };
function WT(e, offset = 0) {
  try {
    let t = new DataView(e, offset),
      n = 0;
    if (t.getUint8(n) !== 2) return null;
    n += 1;
    let r = t.getUint8(n),
      i = r & 1,
      a = r >> 4;
    n += 1;
    let o = t.getFloat32(n, !0);
    n += 4;
    let s = t.getFloat32(n, !0),
      c = t.getFloat32(n + 4, !0),
      l = t.getFloat32(n + 8, !0);
    n += 12;
    let u = t.getInt8(n) / 127,
      d = t.getInt8(n + 1) / 127;
    n += 2;
    let f = t.getUint8(n),
      p = t.getUint8(n + 1);
    n += 2;
    let m = t.getUint16(n, !0);
    n += 2;
    let h = t.getFloat32(n, !0),
      g = t.getFloat32(n + 4, !0);
    n += 8;
    let _ = g > 0 ? Math.max(0, Math.min(1, h / g)) : 0,
      v = t.getUint16(n, !0);
    n += 2;
    let y = t.getUint8(n),
      b = t.getUint8(n + 1) / 255,
      x = t.getUint8(n + 2);
    n += 3;
    let S = null;
    (t.getUint8(n) & 1 && ((S = { x: t.getFloat32(n + 1, !0), z: t.getFloat32(n + 5, !0) }), (n += 8)),
      (n += 1));
    let C = null;
    if (i) {
      let e = t.getFloat32(n, !0),
        r = t.getFloat32(n + 4, !0),
        i = t.getFloat32(n + 8, !0);
      n += 12;
      let a = t.getUint8(n),
        o = t.getUint8(n + 1);
      n += 2;
      let s = t.getFloat64(n, !0),
        c = t.getFloat64(n + 8, !0);
      n += 16;
      let l = t.getUint8(n);
      n += 1;
      let u = [];
      for (let e = 0; e < l; e++) (u.push([t.getUint8(n), t.getUint16(n + 1, !0)]), (n += 3));
      C = { x: e, y: r, z: i, face: a, anim: o, hp: s, maxHp: c, acks: u };
    }
    let w = t.getUint16(n, !0);
    n += 2;
    const end = n + w * zT;
    if (end > t.byteLength) return null;
    const bonus = t.byteLength === end + 4 ? t.getFloat32(end,true) : 0;
    return ![s, c, l, o, h, g, bonus].every(Number.isFinite) || (S && !Number.isFinite(S.x + S.z))
      ? null
      : {
          ts: o,
          stage: a,
          player: {
            x: s,
            y: c,
            z: l,
            aimX: u,
            aimZ: d,
            face: f,
            anim: p,
            species: m,
            hp: _,
            level: v,
            flags: y,
            revive: b,
            bleed: x,
            hpNow: h,
            bonus: Math.max(0,Math.round(bonus)),
            maxHp: g,
            focus: S,
          },
          boss: C,
          view: t, enemyStart: n, enemyEnd: end,
        };
  } catch {
    return null;
  }
}
var KT = 170;

export {
  PT,
  FT,
  IT,
  LT,
  RT,
  zT,
  VT,
  enemyFacingX,
  enemyFacingZ,
  UT,
  WT,
  KT,
  Vw,
  eT,
  OT,
  NT,
  zw,
  $w
};
