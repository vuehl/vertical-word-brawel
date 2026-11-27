import {VFX_SCALE} from './visual-scale.js';
import {comboLettering} from './combo-lettering.js';
import {w as Ei, B as gr, H as Sr, ct as Kr, et as Yr, j as ii, b as Wr, ot as pi, I as Cr} from "../vendor/three-DmSYIDKK.js";
import {createStylizedEffectAtlas, EFFECT_CELL} from "./stylized-effect-atlas.js";
import {battleParticleImages} from "../data/item-icons.js";
import {h as Zt, Lt as Ee, Mt as Ae} from "../data/config.js";
import {Tc, qc, Qc} from "../actors/sprite-assets.js";
import {altarRingFragment} from "./altar-ring-vfx.js";
import {ringEmptyPixels, ringStripGeometry, ringStripPosition, ringSquareClip} from "./ring-shader.js";
import {EnemyTelegraphs} from "../combat/enemy-telegraphs.js";
import {UpgradeEffects} from "./upgrade-effects.js";
import {ParticleBudget, CriticalImpactBudget, accumulateDamage, flushDamage, applyCrowdEffects} from "../performance/effect-budget.js";
import {StylizedSkillFX} from "./stylized-skill-vfx.js";
import {maskSceneInk} from "./scene-ink.js";

var al = {
    gb: 1,
    magma: 2,
    crystal: 3,
    metal: 4,
    holo: 5,
    shadow: 6,
    galaxy: 7,
    neon: 8,
    stone: 9,
    ink: 10,
    flame: 11,
    aurora: 12,
  },
  ol = (e) => [
    parseInt(e.slice(1, 3), 16) / 255,
    parseInt(e.slice(3, 5), 16) / 255,
    parseInt(e.slice(5, 7), 16) / 255,
  ],
  sl = (e) => e - Math.floor(e),
  cl = (e) => (e < 0 ? 0 : e > 1 ? 1 : e),
  ll = (e, t) => sl(Math.sin(e * 12.9898 + t * 78.233) * 43758.5453),
  ul = (e, t, n) => [e[0] + (t[0] - e[0]) * n, e[1] + (t[1] - e[1]) * n, e[2] + (t[2] - e[2]) * n],
  dl = (e, t) => [e[0] * t, e[1] * t, e[2] * t],
  fl = (e, t, n) => cl((0.299 * e + 0.587 * t + 0.114 * n - 0.08) / 0.84);
function pl(e, t) {
  let n = cl(t) * 3,
    r = Math.min(2, Math.floor(n));
  return ul(e[r], e[r + 1], n - r);
}
var ml = (e, t, n) => e[Math.min(n - 1, Math.floor(cl(t) * n))];
function hl(e, t, n, r, i, a, o, s) {
  let c = fl(n, r, i);
  switch (e) {
    case `gb`:
      return ml(t, c, 4);
    case `magma`: {
      let e = pl(t, c * 0.85),
        n = ll(Math.floor(a / 2), Math.floor(o / 2)),
        r = 0.75 + 0.25 * Math.sin(s * 3 + o * 0.25);
      return (
        c > 0.62 && (e = ul(e, dl(t[3], 1.25), (c - 0.62) * 2.2 * r)),
        n > 0.94 && (e = dl(t[2], 1.5 * r)),
        e
      );
    }
    case `crystal`: {
      let e = pl(t, c * 0.6 + 0.4);
      sl((a + o) * 0.035 - s * 0.45) < 0.07 && (e = ul(e, [1, 1, 1], 0.7));
      let n = ll(a, o);
      return (n > 0.985 && (e = ul(e, [1, 1, 1], 0.5 + 0.5 * Math.sin(s * 5 + n * 40))), e);
    }
    case `metal`: {
      let e = pl(t, c ** 0.9);
      return (sl((a - o * 0.5) * 0.028 - s * 0.35) < 0.09 && (e = ul(e, t[3], 0.85)), e);
    }
    case `holo`: {
      let e = c * 1.4 + (a + o) * 0.012 + s * 0.3,
        n = [
          0.6 + 0.4 * Math.cos(6.2832 * e),
          0.6 + 0.4 * Math.cos(6.2832 * (e + 0.33)),
          0.6 + 0.4 * Math.cos(6.2832 * (e + 0.66)),
        ],
        r = ul(pl(t, c), n, 0.5);
      return o % 3 == 0 ? dl(r, 0.86) : r;
    }
    case `shadow`:
      return pl(t, c * 0.62);
    case `galaxy`: {
      let e = pl(t, c * 0.72);
      e = ul(e, t[2], 0.18 * (0.5 + 0.5 * Math.sin(a * 0.06 + o * 0.04 + s * 0.4)));
      let n = ll(a, o);
      return (n > 0.972 && (e = ul(e, [1, 1, 1], 0.55 + 0.45 * Math.sin(s * 4 + n * 60))), e);
    }
    case `neon`:
      return c < 0.33 ? t[0] : c < 0.68 ? t[1] : t[2];
    case `stone`:
      return dl(pl(t, c), 0.84 + 0.16 * ll(a, o));
    case `ink`:
      return c < 0.28 ? t[0] : c < 0.55 ? t[1] : t[2];
    case `flame`: {
      let e = pl(t, c),
        n = 0.5 + 0.5 * Math.sin(o * 0.45 + s * 9 + a * 0.21);
      return ul(e, t[3], 0.22 * n * c);
    }
    case `aurora`: {
      let e = pl(t, c * 0.8),
        n = Math.max(0, Math.sin(o * 0.12 - s * 1.5 + Math.sin(a * 0.08) * 2));
      return ul(e, t[2], 0.55 * n * n * n);
    }
  }
}
function gl(e, t) {
  switch (e) {
    case `shadow`:
      return { c: t[3], glow: !0 };
    case `neon`:
      return { c: t[2], glow: !0 };
    case `flame`:
      return { c: t[2], glow: !0 };
    case `ink`:
      return { c: t[0], glow: !1 };
    default:
      return null;
  }
}
function _l(e, t, n, r = 0) {
  let i = n.map(ol),
    { data: a, width: o, height: s } = e,
    c = new Uint8Array(o * s);
  for (let e = 0; e < o * s; e++) c[e] = +(a[e * 4 + 3] >= 128);
  let l = gl(t, i);
  for (let e = 0; e < s; e++)
    for (let n = 0; n < o; n++) {
      let u = e * o + n,
        d = u * 4;
      if (c[u]) {
        let o = hl(t, i, a[d] / 255, a[d + 1] / 255, a[d + 2] / 255, n, e, r);
        ((a[d] = Math.round(cl(o[0]) * 255)),
          (a[d + 1] = Math.round(cl(o[1]) * 255)),
          (a[d + 2] = Math.round(cl(o[2]) * 255)));
      } else
        l &&
          ((n > 0 && c[u - 1]) ||
            (n < o - 1 && c[u + 1]) ||
            (e > 0 && c[u - o]) ||
            (e < s - 1 && c[u + o])) &&
          ((a[d] = Math.round(l.c[0] * 255)),
          (a[d + 1] = Math.round(l.c[1] * 255)),
          (a[d + 2] = Math.round(l.c[2] * 255)),
          (a[d + 3] = 255));
    }
}
var vl = { PixLeek: 86, PixMagnet: 87, PixShell: 88 };
function yl(e, t) {
  (e(
    vl.PixLeek,
    [
      `............GGO.`,
      `...........GLGO.`,
      `..........GLGGO.`,
      `.........GLGGO..`,
      `........GLGGO...`,
      `.......WLGGO....`,
      `......WWWGO.....`,
      `.....WWWSO......`,
      `....WWWSO.......`,
      `...WWWSO........`,
      `..WWWSO.........`,
      `.OWWSO..........`,
      `OWWSO...........`,
      `OWSO............`,
      `.OO.............`,
      `................`,
    ],
    { G: `#5ab83a`, L: `#a8e870`, W: `#fffbe8`, S: `#d8d0b0`, O: `#2a3a1a` },
  ),
    e(
      vl.PixMagnet,
      t([
        `.OOOO....OOOO...`,
        `OGGGGO..OGGGGO..`,
        `OGWGGO..OGWGGO..`,
        `ORRRRO..ORRRRO..`,
        `ORWRRO..ORWRRO..`,
        `ORRRRO..ORRRRO..`,
        `ORRRRO..ORRRRO..`,
        `ORRRROOOORRRRO..`,
        `.ORRRRRRRRRRO...`,
        `..ORRRRRRRRDO...`,
        `...OODDDDDOO....`,
        `.....OOOO.......`,
      ]),
      { G: `#c8ccd8`, W: `#ffffff`, R: `#e84a4a`, D: `#a02a2a`, O: `#3a1a1a` },
    ),
    e(
      vl.PixShell,
      t([
        `.......OO.......`,
        `......OLLO......`,
        `..O..OLPPLO..O..`,
        `.OLOOLPPPPLOOLO.`,
        `.OPLLPPDPPPLLPO.`,
        `OLPPPPDPPDPPPPLO`,
        `OPPDPPDPPDPPDPPO`,
        `OPPDPPDPPDPPDPPO`,
        `.OPDPPDPPDPPDPO.`,
        `..OOOOOOOOOOOO..`,
        `..OWWWWWWWWWWO..`,
        `...OOOOOOOOOO...`,
      ]),
      { P: `#9a6ad8`, L: `#c8a8f0`, D: `#6a3aa8`, W: `#fff0f8`, O: `#2a1440` },
    ));
}
var bl = { PixPincer: 94, PixEgg: 95 };
function xl(e, t) {
  (e(
    bl.PixPincer,
    t([
      `..OOOO......OOO.`,
      `.ORRRRO....ORRWO`,
      `ORRWWRRO..ORRWRO`,
      `ORWRRRRO..ORRRRO`,
      `ORRRRRRO.ORRRRDO`,
      `.ORRRRRRORRRRDO.`,
      `..OORRRRRRRRDO..`,
      `....ORRRRRRDDO..`,
      `....ORRRRRDDDO..`,
      `...OLLRRRDDDO...`,
      `..OLLLLDDDOO....`,
      `..OLLLLDOO......`,
      `...OOOOO........`,
    ]),
    { R: `#e8503a`, W: `#ffd0b8`, D: `#a82a1a`, L: `#f0e0c8`, O: `#3a1410` },
  ),
    e(
      bl.PixEgg,
      t([
        `......OOOO......`,
        `....OOWWWWOO....`,
        `...OWWWWWWWSO...`,
        `..OWWWBWWWWWSO..`,
        `..OWWWWWWWBWSO..`,
        `.OWWBWWWWWWWSSO.`,
        `.OWWWWWWBWWWSSO.`,
        `.OWWWWWWWWWSSSO.`,
        `.OWBWWWWWWWSSSO.`,
        `..OWWWWWBWSSSO..`,
        `..OSWWWWWSSSSO..`,
        `...OSSSSSSSSO...`,
        `....OOOOOOOO....`,
      ]),
      { W: `#fff4dc`, S: `#e8d0a8`, B: `#a8784a`, O: `#5a3a20` },
    ));
}
var Sl = { PixEgg: 102, PixStarCore: 103, PixInk: 104 };
function Cl(e, t) {
  (e(
    Sl.PixEgg,
    t([
      `......OOOO......`,
      `....OOWWWWOO....`,
      `...OWWWWWWWPO...`,
      `..OWWHWWWWWWPO..`,
      `..OWHHWWWWWWPO..`,
      `.OWWHWWWWWWWPPO.`,
      `.OWWWWWWWWWWPPO.`,
      `.OWWWWWWWWWPPPO.`,
      `.OWWWWWWWWWPPPO.`,
      `..OWWWWWWWPPPO..`,
      `..OPWWWWWPPPPO..`,
      `...OPPPPPPPPO...`,
      `....OOPPPPOO....`,
      `......OOOO......`,
    ]),
    { W: `#fff8ec`, H: `#ffffff`, P: `#f4c0c8`, O: `#7a3a4a` },
  ),
    e(
      Sl.PixStarCore,
      [
        `.......OO.......`,
        `......OYYO......`,
        `......OYYO......`,
        `.....OYYYDO.....`,
        `.....OYYYDO.....`,
        `OOOOOOYYYDOOOOOO`,
        `OYYYYYYRRYYYYDDO`,
        `.OYYYYRWRRYYYDO.`,
        `..OYYYRRRRYYDO..`,
        `...OYYYRRYYDO...`,
        `...OYYYYYYYDO...`,
        `..OYYYDOODYYDO..`,
        `..OYYDO..ODYDO..`,
        `.OYYDO....ODYDO.`,
        `.OYDO......ODDO.`,
        `.OOO........OOO.`,
      ],
      { Y: `#e8b84a`, D: `#a8742a`, R: `#ff3a4a`, W: `#ffd0d8`, O: `#4a2a10` },
    ),
    e(
      Sl.PixInk,
      t([
        `.....OO.....O...`,
        `..O.OIIO...OIO..`,
        `.OIOOIIIOO.OIO..`,
        `.OIIIIIIIIOOIO..`,
        `..OIIBIIIIIIIO..`,
        `.OIIBBIIIIIIIIO.`,
        `OIIIIIIIIIIIIIO.`,
        `OIIIIIIIIIIIIO..`,
        `.OOIIIIIIIIIIIO.`,
        `...OIIIIIIIIOO..`,
        `..OIIOOIIIIIO...`,
        `..OIO..OOIIO.O..`,
        `...O.....OO.OIO.`,
        `............OO..`,
      ]),
      { I: `#1e2440`, B: `#5a7ab8`, O: `#0a0c18` },
    ));
}
var wl = { PixPane: 110, PixCube: 111, PixLips: 112, PixFish: 113 };
function Tl(e, t) {
  (e(
    wl.PixPane,
    [
      `OOOOOOOOOOOOOOOO`,
      `OWWLLLLLLLLLLLLO`,
      `OWWLLLLLLLLLLLLO`,
      `OWLLLLLLLLLLWLLO`,
      `OLLLLLLLLLLWLLLO`,
      `OLLLLLLLLLWLLLLO`,
      `OLLLLLLLLWLLLLLO`,
      `OLLLLLLLWLLLLLLO`,
      `OLLLLLLWLLLLLLLO`,
      `OLLLLLWLLLLLLLLO`,
      `OLLLLWLLLLLLLLLO`,
      `OLLLWLLLLLLLLLLO`,
      `OLLLLLLLLLLLLLDO`,
      `OLLLLLLLLLLLLDDO`,
      `OLLLLLLLLLLLDDDO`,
      `OOOOOOOOOOOOOOOO`,
    ],
    { L: `#bfeaff`, W: `#ffffff`, D: `#8ac0e8`, O: `#5a88b8` },
  ),
    e(
      wl.PixCube,
      t([
        `......OOOO......`,
        `....OOPPPPOO....`,
        `..OOPPWWPPPPOO..`,
        `OOPPPPWWPPPPPPOO`,
        `OBOOPPPPPPPPOOPO`,
        `OBBBOOPPPPOOPPPO`,
        `OBBBBBOOOOPPPPPO`,
        `OBBLBBBOPPPPPPPO`,
        `OBBBBBBOPPPPDPPO`,
        `OBBBBBBOPPPDDPPO`,
        `.OOBBBBOPPPPOO..`,
        `...OOBBOPPOO....`,
        `.....OOOOO......`,
      ]),
      { P: `#ff8ab8`, W: `#ffe0f0`, D: `#d0508a`, B: `#5aa8f0`, L: `#bfe0ff`, O: `#2a2a50` },
    ),
    e(
      wl.PixLips,
      t([
        `...OOO....OOO...`,
        `..ORRRO..ORRRO..`,
        `.ORLLRROORRLRRO.`,
        `ORLLRRRRRRRRRRRO`,
        `ODDDDDDDDDDDDDDO`,
        `.ORRRRRRRRRRRRO.`,
        `..ORRRRLRRRRRO..`,
        `...OORRRRRROO...`,
        `.....OOOOOO.....`,
      ]),
      { R: `#ff5a8a`, L: `#ffc0d8`, D: `#a01a4a`, O: `#4a0a20` },
    ),
    e(
      wl.PixFish,
      t([
        `......OOOO......`,
        `....OOYYYYO.....`,
        `...OOOOOOOOO..OO`,
        `..ORRRRRRRRRO.OY`,
        `.ORWORRRRRRRRORY`,
        `.ORKORRRRRRRRRYY`,
        `ORRRRRRRRRRRRRYY`,
        `.ORRRRRRRRRRRORY`,
        `..ODDDDDDDDDO.OY`,
        `...OOOYYOOOO..OO`,
        `.....OYYO.......`,
        `......OO........`,
      ]),
      { R: `#ff7a3a`, Y: `#ffd84a`, W: `#ffffff`, K: `#1a1a24`, D: `#c84a1a`, O: `#4a1a0a` },
    ));
}
var El = { PixShell: 118, PixIceFeather: 119, PixScythe: 120, PixAmber: 121 };
function Dl(e, t) {
  (e(
    El.PixShell,
    t([
      `.....OOOOOO.....`,
      `...OOLLLLLLOO...`,
      `..OLLMMMMMMLLO..`,
      `.OLMMOOOOOOMMLO.`,
      `.OLMO.LLLL.OMLO.`,
      `OLMO.LMMMML.OMLO`,
      `OLMO.LMOOML.OMLO`,
      `OLMO.LMO.OL.OMLO`,
      `OLMO.LMOOO..OMLO`,
      `.OLMO.LMMMMMMLO.`,
      `.OLMMO.LLLLLLO..`,
      `..OLMMOOOOOOO...`,
      `...OOLLLLLO.....`,
      `.....OOOOO......`,
    ]),
    { L: `#f0d8a0`, M: `#b8884a`, O: `#5a3a1a` },
  ),
    e(
      El.PixIceFeather,
      t([
        `...........OO...`,
        `..........OWLO..`,
        `.........OWLLO..`,
        `........OWLLLO..`,
        `.......OWLLLDO..`,
        `......OWLLLDO...`,
        `.....OWLLLDDO...`,
        `....OWLLLDDO....`,
        `...OWLLLDDO.....`,
        `..OWLLDDDO......`,
        `..OWLDDDO.......`,
        `.OWDDDOO........`,
        `.ODOOO..........`,
        `OO..............`,
      ]),
      { W: `#ffffff`, L: `#bfeaff`, D: `#6ab8e8`, O: `#24507a` },
    ),
    e(
      El.PixScythe,
      t([
        `..OOOOOOOO......`,
        `.OWWWWWWWLOO....`,
        `OWLLLLLLLLLLOO..`,
        `.OOOOOOOLLLLLLO.`,
        `.........OOLLLLO`,
        `...........OLLLO`,
        `............OLLO`,
        `............OLLO`,
        `...........OLLLO`,
        `..........OLLLO.`,
        `.........OOOOO..`,
      ]),
      { W: `#ffffff`, L: `#a8b0c0`, O: `#3a4050` },
    ),
    e(
      El.PixAmber,
      t([
        `......OOOO......`,
        `....OOYYYYOO....`,
        `...OYWWYYYYYO...`,
        `..OYWYYYYYYYDO..`,
        `..OYYYYYYYYYDO..`,
        `.OYYYYKKYYYYDDO.`,
        `.OYYYYKKYYYDDDO.`,
        `.OYYYYYYYYYDDDO.`,
        `..OYYYYYYYDDDO..`,
        `..ODYYYYYDDDDO..`,
        `...ODDDDDDDDO...`,
        `....OODDDDOO....`,
        `......OOOO......`,
      ]),
      { Y: `#ffb84a`, W: `#ffe8b0`, D: `#c86a1a`, K: `#5a2a10`, O: `#4a220a` },
    ));
}
var Ol = class {
    s;
    constructor(e) {
      this.s = e >>> 0 || 2654435769;
    }
    next() {
      let e = (this.s = (this.s + 1831565813) >>> 0);
      return (
        (e = Math.imul(e ^ (e >>> 15), e | 1)),
        (e ^= e + Math.imul(e ^ (e >>> 7), e | 61)),
        ((e ^ (e >>> 14)) >>> 0) / 4294967296
      );
    }
    range(e, t) {
      return e + (t - e) * this.next();
    }
    int(e, t) {
      return Math.floor(this.range(e, t + 1));
    }
    pick(e) {
      return e[Math.floor(this.next() * e.length)];
    }
    chance(e) {
      return this.next() < e;
    }
    shuffle(e) {
      for (let t = e.length - 1; t > 0; t--) {
        let n = Math.floor(this.next() * (t + 1));
        [e[t], e[n]] = [e[n], e[t]];
      }
      return e;
    }
    weighted(e, t) {
      let n = 0;
      for (let r of e) n += Math.max(0, t(r));
      let r = this.next() * n;
      for (let n of e) if (((r -= Math.max(0, t(n))), r <= 0)) return n;
      return e[e.length - 1];
    }
  },
  F = new Ol((Date.now() ^ (Math.random() * 1e9)) >>> 0);
function kl(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n++) ((t ^= e.charCodeAt(n)), (t = Math.imul(t, 16777619)));
  return t >>> 0;
}
var Al = new Ei(),
  jl = new Ei(),
  I = (function (e) {
    return (
      (e[(e.Soft = 0)] = `Soft`),
      (e[(e.Star = 1)] = `Star`),
      (e[(e.Spark = 2)] = `Spark`),
      (e[(e.Ring = 3)] = `Ring`),
      (e[(e.Leaf = 4)] = `Leaf`),
      (e[(e.Flame = 5)] = `Flame`),
      (e[(e.Bubble = 6)] = `Bubble`),
      (e[(e.Flake = 7)] = `Flake`),
      (e[(e.Bolt = 8)] = `Bolt`),
      (e[(e.Rock = 9)] = `Rock`),
      (e[(e.Heart = 10)] = `Heart`),
      (e[(e.Skull = 11)] = `Skull`),
      (e[(e.Note = 12)] = `Note`),
      (e[(e.Swirl = 13)] = `Swirl`),
      (e[(e.Square = 14)] = `Square`),
      (e[(e.Drop = 15)] = `Drop`),
      (e[(e.Claw = 16)] = `Claw`),
      (e[(e.Fang = 17)] = `Fang`),
      (e[(e.Fist = 18)] = `Fist`),
      (e[(e.Crescent = 19)] = `Crescent`),
      (e[(e.Cross = 20)] = `Cross`),
      (e[(e.Eye = 21)] = `Eye`),
      (e[(e.Moon = 22)] = `Moon`),
      (e[(e.Sound = 23)] = `Sound`),
      (e[(e.Feather = 24)] = `Feather`),
      (e[(e.Twinkle = 25)] = `Twinkle`),
      (e[(e.Crack = 26)] = `Crack`),
      (e[(e.Tongue = 27)] = `Tongue`),
      (e[(e.Spore = 28)] = `Spore`),
      (e[(e.Shard = 29)] = `Shard`),
      (e[(e.Palm = 30)] = `Palm`),
      (e[(e.Wisp = 31)] = `Wisp`),
      (e[(e.Gem = 32)] = `Gem`),
      (e[(e.PixFlame = 33)] = `PixFlame`),
      (e[(e.PixPuff = 34)] = `PixPuff`),
      (e[(e.PixBone = 35)] = `PixBone`),
      (e[(e.PixHorn = 36)] = `PixHorn`),
      (e[(e.PixFinger = 37)] = `PixFinger`),
      (e[(e.PixDragonFire = 38)] = `PixDragonFire`),
      (e[(e.PixSlash = 39)] = `PixSlash`),
      (e[(e.PixBolt = 40)] = `PixBolt`),
      (e[(e.PixRock = 41)] = `PixRock`),
      (e[(e.PixDrop = 42)] = `PixDrop`),
      (e[(e.PixFist = 43)] = `PixFist`),
      (e[(e.PixClaw = 44)] = `PixClaw`),
      (e[(e.PixWave = 45)] = `PixWave`),
      (e[(e.PixCrack = 46)] = `PixCrack`),
      (e[(e.PixSpike = 47)] = `PixSpike`),
      (e[(e.PixSpore = 48)] = `PixSpore`),
      (e[(e.PixBubble = 49)] = `PixBubble`),
      (e[(e.PixSleepZ = 50)] = `PixSleepZ`),
      (e[(e.PixSnow = 51)] = `PixSnow`),
      (e[(e.PixCoin = 52)] = `PixCoin`),
      (e[(e.PixCoinMid = 53)] = `PixCoinMid`),
      (e[(e.PixCoinEdge = 54)] = `PixCoinEdge`),
      (e[(e.PixKey = 55)] = `PixKey`),
      (e[(e.ItemBerry = 56)] = `ItemBerry`),
      (e[(e.ItemMagnet = 57)] = `ItemMagnet`),
      (e[(e.ItemRepel = 58)] = `ItemRepel`),
      (e[(e.ItemCandy = 59)] = `ItemCandy`),
      (e[(e.ItemNugget = 60)] = `ItemNugget`),
      (e[(e.ItemBigNugget = 61)] = `ItemBigNugget`),
      (e[(e.ItemVoltorb = 62)] = `ItemVoltorb`),
      (e[(e.PixRoot = 63)] = `PixRoot`),
      (e[(e.PixLeaf = 64)] = `PixLeaf`),
      (e[(e.PixFeather = 65)] = `PixFeather`),
      (e[(e.PixStinger = 66)] = `PixStinger`),
      (e[(e.PixStar = 67)] = `PixStar`),
      (e[(e.PixMoon = 68)] = `PixMoon`),
      (e[(e.PixWeb = 69)] = `PixWeb`),
      (e[(e.PixButterfly = 70)] = `PixButterfly`),
      (e[(e.PixFang = 71)] = `PixFang`),
      (e[(e.PixToxic = 72)] = `PixToxic`),
      (e[(e.PixSludge = 73)] = `PixSludge`),
      (e[(e.PixHeart = 74)] = `PixHeart`),
      (e[(e.PixTornado = 75)] = `PixTornado`),
      (e[(e.PixEye = 76)] = `PixEye`),
      (e[(e.PixSand = 77)] = `PixSand`),
      (e[(e.PixSparkle = 78)] = `PixSparkle`),
      (e[(e.PixPetal = 79)] = `PixPetal`),
      (e[(e.PixShroom = 80)] = `PixShroom`),
      (e[(e.PixSpoon = 81)] = `PixSpoon`),
      (e[(e.PixNote = 82)] = `PixNote`),
      (e[(e.PixSpiral = 83)] = `PixSpiral`),
      (e[(e.PixTentacle = 84)] = `PixTentacle`),
      (e[(e.PixGem = 85)] = `PixGem`),
      (e[(e.PixWaterBall = 126)] = `PixWaterBall`),
      (e[(e.PixFoam = 127)] = `PixFoam`),
      (e[(e.PixPuddle = 128)] = `PixPuddle`),
      (e[(e.PixWaterSwirl = 129)] = `PixWaterSwirl`),
      (e[(e.PixWaterArc = 130)] = `PixWaterArc`),
      (e[(e.PixSplash = 131)] = `PixSplash`),
      (e[(e.PixWaterBlob = 132)] = `PixWaterBlob`),
      (e[(e.ItemTmSwords = 133)] = `ItemTmSwords`),
      (e[(e.ItemTmAgility = 134)] = `ItemTmAgility`),
      (e[(e.ItemTmIron = 135)] = `ItemTmIron`),
      (e[(e.ItemTmThunder = 136)] = `ItemTmThunder`),
      (e[(e.ItemTmPayday = 137)] = `ItemTmPayday`),
      (e[(e.PixEgg = 138)] = `PixEgg`),
      e
    );
  })({}),
  Ml = `float wh = clamp(min(c.r, min(c.g, c.b)), 0., 1.); c *= (1. - 0.45 * wh) / (1. + vGlow * 0.5);`;
async function Nl() {
  const texture=await createStylizedEffectAtlas();
  Pl(texture.image.getContext('2d'),texture,EFFECT_CELL);
  return texture;
}
function Pl(e, t, n) {
  for (let [r, i] of battleParticleImages)
    Tc(Zt(`${i}.png`), (i) => {
      let a = i.naturalWidth,
        o = i.naturalHeight,
        s = document.createElement(`canvas`);
      ((s.width = a), (s.height = o));
      let c = s.getContext(`2d`);
      c.drawImage(i, 0, 0);
      let l;
      try {
        l = c.getImageData(0, 0, a, o).data;
      } catch {
        return;
      }
      let u = a,
        d = o,
        f = -1,
        p = -1;
      for (let e = 0; e < o; e++)
        for (let t = 0; t < a; t++)
          l[(e * a + t) * 4 + 3] > 8 &&
            ((u = Math.min(u, t)), (f = Math.max(f, t)), (d = Math.min(d, e)), (p = Math.max(p, e)));
      if (f < 0) return;
      let m = f - u + 1,
        h = p - d + 1,
        fit = (n - 4) / Math.max(m, h),
        g = fit < 1 ? fit : Math.floor(fit),
        _ = (r % 8) * n,
        v = Math.floor(r / 8) * n;
      e.clearRect(_, v, n, n);
      ((e.imageSmoothingEnabled = !0),
        e.drawImage(
          s,
          u,
          d,
          m,
          h,
          _ + Math.round((n - m * g) / 2),
          v + Math.round((n - h * g) / 2),
          m * g,
          h * g,
        ),
        (t.needsUpdate = !0));
    });
}
var Fl = {
    on: !1,
    own: !1,
    ownFade: 1,
    density: 1,
    enter(e) {
      ((this.own = !0), (this.on = e));
    },
    leave() {
      ((this.own = !1), (this.on = !1));
    },
  },
  Il = { yaw: 0 };
function Ll(e, t) {
  let n = Math.cos(Il.yaw),
    r = Math.sin(Il.yaw);
  return Math.atan2(-e * r - t * n, e * n - t * r);
}
var Rl = 20,
  zl = class {
    mesh;
    cap;
    limit = Infinity;
    view = null;
    n = 0;
    flat = !1;
    ownAreaLimit = Infinity;
    ownCountLimit = Infinity;
    ownArea = 0;
    ownCount = 0;
    decoration;
    px;
    py;
    pz;
    vx;
    vy;
    vz;
    life;
    max;
    s0;
    s1;
    r;
    rv;
    g;
    drag;
    c0;
    c1;
    shape;
    glow;
    fm;
    aA;
    fade = 1;
    aB;
    aC;
    constructor(e, t, n, r, i, a) {
      ((this.cap = n), (this.flat = i));
      let o = (e = 1) => new Float32Array(n * e);
      ((this.px = o()),
        (this.py = o()),
        (this.pz = o()),
        (this.vx = o()),
        (this.vy = o()),
        (this.vz = o()),
        (this.life = o()),
        (this.max = o()),
        (this.s0 = o()),
        (this.s1 = o()),
        (this.r = o()),
        (this.rv = o()),
        (this.g = o()),
        (this.drag = o()),
        (this.c0 = o(3)),
        (this.c1 = o(3)),
        (this.shape = o()),
        (this.glow = o()),
        (this.fm = o()),
        (this.decoration = o()));
      let s = new Yr(1, 1);
      (i && s.rotateX(-Math.PI / 2),
        (this.aA = new gr(o(4), 4).setUsage(ii)),
        (this.aB = new gr(o(4), 4).setUsage(ii)),
        (this.aC = new gr(o(4), 4).setUsage(ii)),
        s.setAttribute(`iA`, this.aA),
        s.setAttribute(`iB`, this.aB),
        s.setAttribute(`iC`, this.aC));
      let c = new Kr({
        transparent: !0,
        depthWrite: !1,
        blending: 1, // Opaque pigment/ink silhouettes use normal alpha, never additive washout.
        uniforms: { map: { value: t }, uFogColor: a.uFogColor, uFogNear: a.uFogNear, uFogFar: a.uFogFar },
        vertexShader: `attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; varying vec2 vUv; varying vec2 vLocalUv; varying vec4 vCol; varying float vGlow; varying float vD;
        void main(){
          float cs = cos(iC.y), sn = sin(iC.y);
          vec2 p2 = vec2(position.x*cs - ${i ? `position.z` : `position.y`}*sn, position.x*sn + ${i ? `position.z` : `position.y`}*cs) * iA.w;
          ${i ? `vec4 mv = viewMatrix * vec4(iA.xyz + vec3(p2.x, 0.0, p2.y), 1.);` : `vec4 mv = viewMatrix * vec4(iA.xyz, 1.); mv.xy += p2;`}
          vD = -mv.z;
          gl_Position = projectionMatrix * mv;
          float idx = iC.x; vec2 cell = vec2(mod(idx,8.), 17. - floor(idx/8.));
          vUv = (cell + uv) / vec2(8., 18.);
          vCol = iB; vGlow = iC.z; vLocalUv=uv;
        }`,
        fragmentShader: `uniform sampler2D map; uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar; varying vec2 vUv; varying vec2 vLocalUv; varying vec4 vCol; varying float vGlow; varying float vD;
        void main(){ ${altarRingFragment}
 vec4 t = texture2D(map, vUv); float a = t.a * vCol.a; if (a < 0.01) discard;
          vec3 c = vCol.rgb * t.rgb * (1. + min(vGlow,.15));
          ${r ? Ml : `c = min(c, vec3(0.93)); c = mix(c, uFogColor, smoothstep(uFogNear, uFogFar, vD));`}
          gl_FragColor = vec4(c, a); }`,
      });
      ((this.mesh = new Sr(s, c, n)),
        (this.mesh.frustumCulled = !1),
        (this.mesh.count = 0),
        (this.mesh.renderOrder = r ? 10 : 5),
        e.add(this.mesh));
    }
    available(x,y,z,size=0) {
      if(Fl.on||(this.view&&!this.view.visible(x,y,z,Math.max(6,size))))return 0;
      return Math.max(0,Math.min(this.cap-this.n,this.limit-this.n,this.densityBudget?.remaining(x,z)??Infinity));
    }
    spawn(e) {
      if (
        this.n >= Math.min(this.cap,this.limit) ||
        (this.view&&!this.view.visible(e.x,e.y,e.z,Math.max(6,e.size||0))) ||
        Fl.on ||
        (Fl.density < 1 && Math.random() > Fl.density)
      )
        return;
      if(this.densityBudget&&!this.densityBudget.allow(e.x,e.z))return;
      // Bound large billboard effects too. Enemy ground warning fills and
      // explicitly essential visuals remain exempt from the area budget.
      const area=(!this.flat||Fl.own)&&!e.essential?Math.max(.001,Math.min(this.flat?Infinity:Fl.own?Rl:Infinity,Math.max(e.size,e.endSize??e.size*.2))**2):0;
      if(area&&(this.ownArea+area>this.ownAreaLimit||this.ownCount>=this.ownCountLimit))return;
      let t = this.n++;
      this.decoration[t]=area;if(area){this.ownArea+=this.decoration[t];this.ownCount++;}
      ((this.px[t] = e.x),
        (this.py[t] = this.flat?Math.max(e.y,this.surface?.(e.x,e.z)??e.y):e.y),
        (this.pz[t] = e.z),
        (this.vx[t] = e.vx ?? 0),
        (this.vy[t] = e.vy ?? 0),
        (this.vz[t] = e.vz ?? 0),
        (this.life[t] = e.life),
        (this.max[t] = e.life));
      let n = !this.flat && Fl.own ? Rl : 1 / 0;
      const visualScale = e.essential ? 1 : VFX_SCALE;
      ((this.s0[t] = Math.min(e.size, n) * visualScale),
        (this.s1[t] = Math.min(e.endSize ?? e.size * 0.2, n) * visualScale),
        (this.r[t] = e.rot ?? F.range(0, 6.28)),
        (this.rv[t] = e.spin ?? 0),
        (this.g[t] = e.gravity ?? 0),
        (this.drag[t] = e.drag ?? 0));
      let r = Al.set(e.color),
        i = jl.set(e.endColor ?? e.color);
      ((this.c0[t * 3] = r.r),
        (this.c0[t * 3 + 1] = r.g),
        (this.c0[t * 3 + 2] = r.b),
        (this.c1[t * 3] = i.r),
        (this.c1[t * 3 + 1] = i.g),
        (this.c1[t * 3 + 2] = i.b),
        (this.shape[t] = e.shape ?? 0),
        (this.glow[t] = e.glow ?? 0),
        (this.fm[t] = (Fl.own ? Fl.ownFade : this.fade)*(e.opacity??1)));
    }
    cols;
    trimTo(limit) {
      while(this.n>limit)this.kill(this.n-1);
      for(let i=this.n-1;i>=0&&(this.ownArea>this.ownAreaLimit||this.ownCount>this.ownCountLimit);i--)
        if(this.decoration[i])this.kill(i);
    }
    kill(e) {
      if(this.decoration[e]){this.ownArea=Math.max(0,this.ownArea-this.decoration[e]);this.ownCount--;}
      let t = --this.n;
      if (e === t) return;
      let n = (this.cols ??= [
        this.px,
        this.py,
        this.pz,
        this.vx,
        this.vy,
        this.vz,
        this.life,
        this.max,
        this.s0,
        this.s1,
        this.r,
        this.rv,
        this.g,
        this.drag,
        this.shape,
        this.glow,
        this.fm,
        this.decoration,
      ]);
      for (let r = 0; r < n.length; r++) n[r][e] = n[r][t];
      for (let n = 0; n < 3; n++)
        ((this.c0[e * 3 + n] = this.c0[t * 3 + n]), (this.c1[e * 3 + n] = this.c1[t * 3 + n]));
    }
    update(e) {
      let t = this.aA.array,
        n = this.aB.array,
        r = this.aC.array;
      for (let t = 0; t < this.n; t++) {
        if (((this.life[t] -= e), this.life[t] <= 0)) {
          (this.kill(t), t--);
          continue;
        }
        let n = Math.exp(-this.drag[t] * e);
        ((this.vx[t] *= n),
          (this.vz[t] *= n),
          (this.vy[t] = this.vy[t] * n - this.g[t] * e),
          (this.px[t] += this.vx[t] * e),
          (this.py[t] += this.vy[t] * e),
          (this.pz[t] += this.vz[t] * e),
          (this.r[t] += this.rv[t] * e));
        if(this.surface && this.g[t]>0){const floor=this.surface(this.px[t],this.pz[t]);if(this.py[t]<floor){this.py[t]=floor;this.vy[t]=Math.abs(this.vy[t])*.22;this.vx[t]*=.65;this.vz[t]*=.65;}}
        // Gentle advected motion gives small flames, motes and smoke a soft
        // flowing silhouette instead of rigidly spinning billboard confetti.
        if(this.shape[t]===5||this.shape[t]===33||this.shape[t]===38||this.shape[t]===31){
          this.vx[t]+=Math.sin(this.life[t]*9+this.pz[t]*2)*e*.8;
          this.vz[t]+=Math.cos(this.life[t]*7+this.px[t]*2)*e*.8;
          this.vy[t]+=e*.75;
        }
      }
      for (let e = 0; e < this.n; e++) {
        let i = 1 - this.life[e] / this.max[e];
        ((t[e * 4] = this.px[e]),
          (t[e * 4 + 1] = this.py[e]),
          (t[e * 4 + 2] = this.pz[e]),
          (t[e * 4 + 3] = this.s0[e] + (this.s1[e] - this.s0[e]) * i),
          (n[e * 4] = this.c0[e * 3] + (this.c1[e * 3] - this.c0[e * 3]) * i),
          (n[e * 4 + 1] = this.c0[e * 3 + 1] + (this.c1[e * 3 + 1] - this.c0[e * 3 + 1]) * i),
          (n[e * 4 + 2] = this.c0[e * 3 + 2] + (this.c1[e * 3 + 2] - this.c0[e * 3 + 2]) * i),
          (n[e * 4 + 3] = (i < 0.1 ? i / 0.1 : 1 - Math.max(0, (i - 0.55) / 0.45) ** 1.5) * this.fm[e]),
          (r[e * 4] = this.shape[e]),
          (r[e * 4 + 1] = this.r[e]),
          (r[e * 4 + 2] = this.glow[e]));
      }
      ((this.mesh.count = this.n), (this.mesh.visible = this.n > 0));
      for (let e of [this.aA, this.aB, this.aC])
        (e.clearUpdateRanges(), e.addUpdateRange(0, this.n * 4), (e.needsUpdate = !0));
    }
    clear() {
      this.ownArea=0;this.ownCount=0;
      ((this.n = 0), (this.mesh.count = 0), (this.mesh.visible = !1));
    }
  },
  Bl = class {
    cap;
    mesh;
    n = 0;
    fade = 1;
    a0;
    a1;
    col;
    life;
    max;
    width;
    once;
    op;
    aA;
    aB;
    aC;
    constructor(e, t = 512) {
      this.cap = t;
      let n = (e = 1) => new Float32Array(t * e);
      ((this.a0 = n(3)),
        (this.a1 = n(3)),
        (this.col = n(3)),
        (this.life = n()),
        (this.max = n()),
        (this.width = n()),
        (this.once = n()),
        (this.op = n()));
      let r = new Yr(1, 1).translate(0.5, 0, 0);
      ((this.aA = new gr(n(4), 4).setUsage(ii)),
        (this.aB = new gr(n(4), 4).setUsage(ii)),
        (this.aC = new gr(n(4), 4).setUsage(ii)),
        r.setAttribute(`iA`, this.aA),
        r.setAttribute(`iB`, this.aB),
        r.setAttribute(`iC`, this.aC));
      let i = new Kr({
        transparent: !0,
        depthWrite: !1,
        side: 2,
        vertexShader: `attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; varying vec2 vUv; varying vec4 vCol;
        void main(){ vec3 a = iA.xyz, b = iB.xyz; vec3 dir = b - a; vec3 camPos = cameraPosition;
          vec3 crossView = cross(dir,camPos-mix(a,b,position.x));
          vec3 side = crossView*inversesqrt(max(dot(crossView,crossView),1.e-8))*iA.w;
          vec3 p = a + dir*position.x + side*position.y;
          gl_Position = projectionMatrix*viewMatrix*vec4(p,1.); vUv = uv; vCol = vec4(iC.rgb, iC.a * iB.w); }`,
        fragmentShader: `varying vec2 vUv; varying vec4 vCol; void main(){ float e = 1. - abs(vUv.y-0.5 + sin(vUv.x*38.)*.018)*2.;
        float tip = smoothstep(0.,0.04,vUv.x)*smoothstep(1.,0.96,vUv.x);
        if (e < 0.08) discard;
        vec3 c = vCol.rgb;
        vec3 col = mix(vec3(.13,.18,.29),mix(c,vec3(1.,.95,.83),step(.72,e)*.6),smoothstep(.15,.2,e));
        float a = smoothstep(.04,.4,e)*vCol.a*tip;
        if (a < 0.02) discard;
        gl_FragColor = vec4(col, a); }`,
      });
      ((this.mesh = new Sr(r, i, t)),
        (this.mesh.frustumCulled = !1),
        (this.mesh.count = 0),
        (this.mesh.renderOrder = 11),
        e.add(this.mesh));
    }
    spawn(e, t, n, r, i, a, o, s, c, l = 1) {
      if (this.n >= this.cap || Fl.on) return;
      let u = this.n++,
        d = Al.set(s);
      (this.a0.set([e, t, n], u * 3),
        this.a1.set([r, i, a], u * 3),
        this.col.set([d.r, d.g, d.b], u * 3),
        (this.life[u] = c),
        (this.max[u] = c),
        (this.width[u] = o * VFX_SCALE),
        (this.op[u] = l * (Fl.own ? Fl.ownFade : this.fade)),
        (this.once[u] = +(c <= 0.06)));
    }
    update(e) {
      let t = this.aA.array,
        n = this.aB.array,
        r = this.aC.array;
      for (let t = 0; t < this.n; t++)
        if (this.once[t] ? this.once[t]++ >= 2 : (this.life[t] -= e) <= 0) {
          let e = --this.n;
          if (t !== e) {
            for (let n = 0; n < 3; n++)
              ((this.a0[t * 3 + n] = this.a0[e * 3 + n]),
                (this.a1[t * 3 + n] = this.a1[e * 3 + n]),
                (this.col[t * 3 + n] = this.col[e * 3 + n]));
            ((this.life[t] = this.life[e]),
              (this.max[t] = this.max[e]),
              (this.width[t] = this.width[e]),
              (this.once[t] = this.once[e]),
              (this.op[t] = this.op[e]));
          }
          t--;
          continue;
        }
      for (let e = 0; e < this.n; e++) {
        let i = this.once[e] ? 1 : this.life[e] / this.max[e];
        ((t[e * 4] = this.a0[e * 3]),
          (t[e * 4 + 1] = this.a0[e * 3 + 1]),
          (t[e * 4 + 2] = this.a0[e * 3 + 2]),
          (t[e * 4 + 3] = this.width[e] * (0.4 + 0.6 * i)),
          (n[e * 4] = this.a1[e * 3]),
          (n[e * 4 + 1] = this.a1[e * 3 + 1]),
          (n[e * 4 + 2] = this.a1[e * 3 + 2]),
          (n[e * 4 + 3] = this.op[e]),
          (r[e * 4] = this.col[e * 3]),
          (r[e * 4 + 1] = this.col[e * 3 + 1]),
          (r[e * 4 + 2] = this.col[e * 3 + 2]),
          (r[e * 4 + 3] = Math.min(1, i * 2)));
      }
      ((this.mesh.count = this.n), (this.mesh.visible = this.n > 0));
      for (let e of [this.aA, this.aB, this.aC])
        (e.clearUpdateRanges(), e.addUpdateRange(0, this.n * 4), (e.needsUpdate = !0));
    }
    clear() {
      ((this.n = 0), (this.mesh.count = 0), (this.mesh.visible = !1));
    }
  },
  L = (function (e) {
    return (
      (e[(e.Plain = 0)] = `Plain`),
      (e[(e.Dashed = 1)] = `Dashed`),
      (e[(e.Ripple = 2)] = `Ripple`),
      (e[(e.Runes = 3)] = `Runes`),
      (e[(e.Petals = 4)] = `Petals`),
      (e[(e.Jagged = 5)] = `Jagged`),
      (e[(e.Flames = 6)] = `Flames`),
      e
    );
  })({});
function Vl(e) {
  let t = (e >> 16) & 255,
    n = (e >> 8) & 255,
    r = e & 255;
  return Math.min(t, n, r) > 225 ? 14209220 : e;
}
function Hl(e) {
  let t = { h: 0, s: 0, l: 0 };
  Al.set(e).getHSL(t);
  let n = t.h * 360;
  return t.s < 0.22
    ? t.l > 0.8
      ? 2
      : 0
    : n < 22 || n >= 345
      ? 6
      : n < 42
        ? t.l < 0.55 || t.s < 0.45
          ? 5
          : 6
        : n < 68
          ? 1
          : n < 160
            ? 4
            : n < 245
              ? 2
              : 3;
}
var Ul = class {
  cols;
  cap;
  mesh;
  n = 0;
  fade = 1;
  px;
  py;
  pz;
  r0;
  r1;
  th;
  life;
  max;
  col;
  style;
  rot;
  once;
  alpha;
  hold;
  fm;
  aA;
  aB;
  aC;
  constructor(e, t = 600) {
    this.cap = t;
    let n = (e = 1) => new Float32Array(t * e);
    ((this.px = n()),
      (this.py = n()),
      (this.pz = n()),
      (this.r0 = n()),
      (this.r1 = n()),
      (this.th = n()),
      (this.life = n()),
      (this.max = n()),
      (this.col = n(3)),
      (this.style = n()),
      (this.rot = n()),
      (this.once = n()),
      (this.alpha = n()),
      (this.hold = n()),
      (this.fm = n()));
    let r = ringStripGeometry(Yr);
    ((this.aA = new gr(n(4), 4).setUsage(ii)),
      (this.aB = new gr(n(4), 4).setUsage(ii)),
      (this.aC = new gr(n(4), 4).setUsage(ii)),
      r.setAttribute(`iA`, this.aA),
      r.setAttribute(`iB`, this.aB),
      r.setAttribute(`iC`, this.aC));
    let i = new Kr({
      transparent: !0,
      depthWrite: !1,
      uniforms: { uWaveTime: { value: 0 } },
      vertexShader: `attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; varying vec2 vP; flat varying vec4 vCol; flat varying vec4 vRing;
        void main(){ ${ringStripPosition}
          gl_Position = projectionMatrix * viewMatrix * vec4(iA.xyz + vec3(vP.x, 0.0, vP.y), 1.0);
          vCol = iB; vRing = vec4(iA.w, iC.x, iC.y, iC.z); }`,
      fragmentShader: `uniform float uWaveTime; varying vec2 vP; flat varying vec4 vCol; flat varying vec4 vRing;
        const float TAU=6.2831853;
        float waveHash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
        float waveNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(waveHash(i),waveHash(i+vec2(1.,0.)),f.x),mix(waveHash(i+vec2(0.,1.)),waveHash(i+vec2(1.,1.)),f.x),f.y);}
        void main(){
          float radius=vRing.x,width=max(.045,vRing.y),style=floor(vRing.z+.5);
          float distance=length(vP),aa=max(fwidth(distance)*1.2,.012);
          ${ringSquareClip}
          ${ringEmptyPixels}
          float angle=atan(vP.y,vP.x)+vRing.w;
          float phase=angle/TAU;
          float centre=radius;
          if(style==2.)centre+=(sin(angle*7.+vRing.w+uWaveTime*3.)*.28+sin(angle*11.-uWaveTime*2.)*.12)*width;
          if(style==4.)centre+=sin(angle*6.)*width*.6;
          if(style==5.)centre+=sin(angle*13.)*width*.38;
          if(style==6.)centre+=sin(angle*9.+vRing.w*2.+uWaveTime*3.)*width*.6;
          if(style==2.||style==3.||style==6.){
            // Translucent pigment/water or warm heat sits behind a moving crest.
            // The ripple envelope stays within the original ring's extent;
            // held danger telegraphs use style 1 and retain their clear border.
            bool fire=style==6.;
            float signedDistance=distance-centre;
            vec2 flow=vec2(angle*3.+sin(distance*3.-uWaveTime*(fire?4.:2.))*.35,signedDistance/width*1.4-uWaveTime*(fire?1.6:.85));
            float liquid=waveNoise(flow)*.7+waveNoise(flow*2.1+3.7)*.3;
            float innerR=max(0.,radius-width*2.6);
            float film=smoothstep(innerR,innerR+width*.75+aa,distance)*(1.-smoothstep(width*.18,width*.6+aa,signedDistance));
            float ridge=1.-smoothstep(width*.07+aa,width*.27+aa,abs(signedDistance));
            float fine=pow(.5+.5*sin(signedDistance/width*(fire?11.:15.)+angle*(fire?5.:2.)-uWaveTime*(fire?9.:5.)+liquid*2.),12.)*film;
            float lace=ridge*smoothstep(fire?.4:.46,fire?.69:.77,liquid+.17*sin(angle*9.-uWaveTime*3.));
            float glint=ridge*smoothstep(.62,.95,sin(angle*3.-uWaveTime*1.7+liquid)*.5+.5);
            float echo=(1.-smoothstep(width*.08+aa,width*.23+aa,abs(distance-radius*.84)))*(fire?.055:.14);
            vec3 pigment=fire?mix(vCol.rgb*.43,mix(vCol.rgb,vec3(1.,.33,.025),.25),liquid):mix(vCol.rgb*.56,vCol.rgb*1.03,.3+liquid*.7);
            vec3 crestColor=fire?mix(vCol.rgb,vec3(1.,.64,.18),.42):mix(vCol.rgb,vec3(.82,.95,.9),.34);
            vec3 col=mix(pigment,crestColor,smoothstep(.24,.28,lace*.8+fine*.3));
            col=mix(col,vec3(.11,.20,.32),ridge*(1.-smoothstep(.16,.23,liquid))*.7);col=floor(col*7.+.5)/7.;
            float alpha=max(film*.22,max(ridge*.78,echo))*vCol.a;
            if(alpha<.015)discard;
            gl_FragColor=vec4(min(col,vec3(.93)),alpha);return;
          }
          float edge=abs(distance-centre);
          float band=1.-smoothstep(width*.35-aa,width*.65+aa,edge);
          if(style==1.)band*=smoothstep(.08,.16,fract(phase*14.))* (1.-smoothstep(.72,.8,fract(phase*14.)));
          float echo=0.;
          if(style==2.||style==3.)echo=(1.-smoothstep(width*.08+aa,width*.27+aa,abs(distance-radius*.84)))*.3;
          float alpha=max(band,echo)*vCol.a;
          if(alpha<.015)discard;
          vec3 cream=mix(vCol.rgb,vec3(1.,.96,.83),.4);
          vec3 col=mix(vCol.rgb*.9,cream,1.-smoothstep(0.,width*.65,edge));
          gl_FragColor=vec4(col,alpha);
        }`,
    });
    ((this.mesh = new Sr(r, i, t)),
      (this.mesh.frustumCulled = !1),
      (this.mesh.count = 0),
      (this.mesh.renderOrder = 6),
      e.add(this.mesh));
  }
  spawn(e, t, n, r, i, a, o, s, c, l = 1, u = !1) {
    if (this.n >= this.cap || (Fl.on && !u)) return;
    // Held warnings and live boundary markers must meet their gameplay radius.
    const radiusScale = u || o === 0 ? 1 : VFX_SCALE;
    let d = this.n++,
      f = Al.set(a);
    ((this.px[d] = e),
      (this.py[d] = Math.max(t,this.surface?.(e,n)??t)),
      (this.pz[d] = n),
      (this.r0[d] = r * radiusScale),
      (this.r1[d] = i * radiusScale),
      (this.th[d] = c * VFX_SCALE),
      (this.life[d] = o),
      (this.max[d] = o),
      (this.once[d] = +(o <= 0.06)),
      (this.alpha[d] = l),
      (this.hold[d] = +!!u),
      (this.fm[d] = Fl.own ? Fl.ownFade : this.fade),
      (this.col[d * 3] = f.r),
      (this.col[d * 3 + 1] = f.g),
      (this.col[d * 3 + 2] = f.b),
      (this.style[d] = s),
      (this.rot[d] = F.range(0, 6.28)));
  }
  update(e) {
    let t = this.aA.array,
      n = this.aB.array,
      r = this.aC.array;
    this.mesh.material.uniforms.uWaveTime.value+=Math.max(0,e);
    for (let t = 0; t < this.n; t++) {
      let n;
      if (((n = this.once[t] ? this.once[t]++ >= 2 : (this.life[t] -= e) <= 0), !n)) continue;
      let r = --this.n;
      if (t !== r) {
        for (let e of (this.cols ??= [
          this.px,
          this.py,
          this.pz,
          this.r0,
          this.r1,
          this.th,
          this.life,
          this.max,
          this.style,
          this.rot,
          this.once,
          this.alpha,
          this.hold,
          this.fm,
        ]))
          e[t] = e[r];
        for (let e = 0; e < 3; e++) this.col[t * 3 + e] = this.col[r * 3 + e];
      }
      t--;
    }
    for (let e = 0; e < this.n; e++) {
      let i = this.once[e] > 0,
        a = i ? 1 : 1 - this.life[e] / this.max[e],
        o = i ? 1 : 1 - (1 - a) * (1 - a);
      ((t[e * 4] = this.px[e]),
        (t[e * 4 + 1] = this.py[e]),
        (t[e * 4 + 2] = this.pz[e]),
        (t[e * 4 + 3] = this.r0[e] + (this.r1[e] - this.r0[e]) * o),
        (n[e * 4] = this.col[e * 3]),
        (n[e * 4 + 1] = this.col[e * 3 + 1]),
        (n[e * 4 + 2] = this.col[e * 3 + 2]));
      let s = this.hold[e] > 0;
      ((n[e * 4 + 3] =
        this.alpha[e] *
        (s ? 1 : this.fm[e]) *
        (i ? 1 : a < 0.08 ? a / 0.08 : s ? 1 : 1 - Math.max(0, (a - 0.45) / 0.55))),
        (r[e * 4] = this.th[e] * (i || s ? 1 : 1 - a * 0.45)),
        (r[e * 4 + 1] = this.style[e]),
        (r[e * 4 + 2] = this.rot[e]));
    }
    ((this.mesh.count = this.n), (this.mesh.visible = this.n > 0));
    for (let e of [this.aA, this.aB, this.aC])
      (e.clearUpdateRanges(), e.addUpdateRange(0, this.n * 4), (e.needsUpdate = !0));
  }
  clear() {
    ((this.n = 0), (this.mesh.count = 0), (this.mesh.visible = !1));
  }
};
function Wl(e) {
  if (e < 1e4) return Math.max(1, Math.round(e)).toString();
  for (let [t, n] of [
    [0x38d7ea4c68000, `Q`],
    [0xe8d4a51000, `T`],
    [1e9, `B`],
    [1e6, `M`],
    [1e3, `k`],
  ])
    if (e >= t) {
      let r = e / t;
      return (r < 10 && n !== `k` ? r.toFixed(1).replace(/\.0$/, ``) : Math.round(r).toString()) + n;
    }
  return Math.round(e).toString();
}
const HERO_HURT_LABEL = 2;
const CRITICAL_LABEL = 3;
const MEGA_CRITICAL_LABEL = 4;
const NORMAL_HIT_LABEL=1, EFFECTIVE_LABEL=5, RESISTED_LABEL=6;
// Each face uses lighter and darker values of the same hue.
const damagePalettes=[
  ['#59cdff','#009de0'], ['#ff6767','#ee1010'],
  ['#ffbd78','#ff8000'], ['#f0a3ff','#d51aff'],
  ['#fff08a','#ffd900'], ['#89c4ff','#168aff'],
];
// M PLUS Rounded 1c ExtraBold, fitted to the existing 64px glyph cells.
const damageContours={
  "0": [[37.5,18.8,37.5,18.8,37.5,18.8,36.1,16.8,34.3,15.6,32,15.3,32,15.3,32,15.3,29.7,15.6,27.9,16.8,26.5,18.8,26.5,18.8,26.5,18.8,25.7,20.9,25.2,23.6,24.8,27,24.7,31,24.7,31,24.7,31,24.8,35,25.2,38.4,25.7,41.1,26.5,43.2,26.5,43.2,26.5,43.2,27.9,45.2,29.7,46.4,32,46.7,32,46.7,32,46.7,34.3,46.4,36.1,45.2,37.5,43.2,37.5,43.2,37.5,43.2,38.3,41.1,38.8,38.4,39.2,35,39.3,31,39.3,31,39.3,31,39.2,27,38.8,23.6,38.3,20.9,37.5,18.8],[45.6,49.4,45.6,49.4,45.6,49.4,43.6,51.4,41.3,53,38.5,54.1,35.5,54.8,32,55,32,55,32,55,28.5,54.8,25.5,54.1,22.7,53,20.4,51.4,18.4,49.4,18.4,49.4,18.4,49.4,17.1,47.3,16,44.8,15.1,42,14.5,38.7,14.1,35,14,31,14,31,14,31,14.1,27,14.5,23.3,15.1,20,16,17.2,17.1,14.7,18.4,12.6,18.4,12.6,18.4,12.6,20.4,10.6,22.7,9,25.5,7.9,28.5,7.2,32,7,32,7,32,7,35.5,7.2,38.5,7.9,41.3,9,43.6,10.6,45.6,12.6,45.6,12.6,45.6,12.6,46.9,14.7,48,17.2,48.9,20,49.5,23.3,49.9,27,50,31,50,31,50,31,49.9,35,49.5,38.7,48.9,42,48,44.8,46.9,47.3,45.6,49.4]],
  "1": [[32.3,19,24.4,25.9,24.4,25.9,23.7,26.3,22.8,26.1,22.8,26.1,22.8,26.1,22.2,25.4,22,24.4,22,24.4,22,19.7,22,19.7,22.6,16.4,24.5,13.9,24.5,13.9,29.9,9.1,29.9,9.1,32.6,7.5,35.5,7,35.5,7,38.9,7,38.9,7,40.1,7.3,41.1,8.1,41.1,8.1,41.1,8.1,41.8,9.3,42,10.7,42,10.7,42,50.3,42,50.3,41.8,51.7,41.1,52.9,41.1,52.9,41.1,52.9,40.1,53.7,38.9,54,38.9,54,35.5,54,35.5,54,34.4,53.7,33.4,52.9,33.4,52.9,33.4,52.9,32.7,51.7,32.4,50.3,32.4,50.3,32.4,19,32.4,19,32.3,19]],
  "2": [[44.3,54,18.8,54,18.8,54,17.3,53.7,16.1,52.9,16.1,52.9,16.1,52.9,15.3,51.7,15,50.4,15,50.4,15,48.9,15,48.9,15.3,46.7,16.3,44.8,18,43.1,18,43.1,18,43.1,21.5,40.5,24.5,38,27.2,35.8,29.4,33.7,31.2,31.9,32.7,30.4,32.7,30.4,32.7,30.4,34.7,27.5,35.9,24.6,36.3,21.8,36.3,21.8,36.3,21.8,35.8,19.2,34.6,17.4,32.5,16.3,29.5,16,29.5,16,29.5,16,26.6,16.2,23.2,16.9,19.5,18.1,19.5,18.1,19.5,18.1,18.3,18.3,17.1,17.9,17.1,17.9,17.1,17.9,16.3,17,16,15.9,16,15.9,16,13.2,16,13.2,16.2,11.7,17,10.3,17,10.3,17,10.3,18.1,9.2,19.6,8.5,19.6,8.5,19.6,8.5,22.6,7.9,25.5,7.4,28.4,7.1,31.2,7,31.2,7,31.2,7,34.9,7.2,38.2,7.9,41.1,9.1,43.5,10.7,43.5,10.7,43.5,10.7,45.4,12.7,46.7,15,47.5,17.7,47.8,20.8,47.8,20.8,47.8,20.8,47.6,23.5,46.9,26.2,45.7,28.9,44.1,31.4,44.1,31.4,44.1,31.4,42.7,33.2,40.9,35.2,38.7,37.4,36.2,39.7,33.2,42.3,29.9,45.1,29.9,45.1,29.9,45.1,29.8,45.2,29.8,45.2,29.8,45.2,29.8,45.2,29.8,45.3,29.9,45.3,29.9,45.3,44.3,45.3,44.3,45.3,45.7,45.6,46.9,46.4,46.9,46.4,46.9,46.4,47.7,47.6,48,48.9,48,48.9,48,50.4,48,50.4,47.7,51.7,46.9,52.9,46.9,52.9,46.9,52.9,45.7,53.7,44.3,54,44.3,54]],
  "3": [[34.2,15.9,19.7,15.9,19.7,15.9,18.3,15.6,17.1,14.8,17.1,14.8,17.1,14.8,16.3,13.6,16,12.2,16,12.2,16,10.7,16,10.7,16.3,9.3,17.1,8.1,17.1,8.1,17.1,8.1,18.3,7.3,19.7,7,19.7,7,43.7,7,43.7,7,45.1,7.3,46.3,8.1,46.3,8.1,46.3,8.1,47.1,9.3,47.4,10.7,47.4,10.7,47.4,12.2,47.4,12.2,47,14.5,46.1,16.5,44.5,18.2,44.5,18.2,34.8,26.3,34.8,26.4,34.8,26.4,34.8,26.4,34.9,26.5,34.9,26.5,35.6,26.5,35.6,26.5,39.1,26.8,42.1,28,44.6,30,44.6,30,44.6,30,46.1,31.9,47.2,34.1,47.8,36.6,48,39.4,48,39.4,48,39.4,47.7,43,46.9,46.1,45.4,48.7,43.4,51,43.4,51,43.4,51,41.4,52.4,39.1,53.6,36.5,54.4,33.6,54.8,30.3,55,30.3,55,30.3,55,27.7,54.9,25.1,54.7,22.5,54.3,19.9,53.8,19.9,53.8,19.9,53.8,18.5,53.1,17.3,52,17.3,52,17.3,52,16.6,50.6,16.3,49,16.3,49,16.3,46.8,16.3,46.8,16.6,45.7,17.4,44.8,17.4,44.8,17.4,44.8,18.5,44.3,19.7,44.4,19.7,44.4,19.7,44.4,23.3,45.4,26.5,46,29.4,46.2,29.4,46.2,29.4,46.2,32.7,45.8,35.2,44.5,35.2,44.5,35.2,44.5,36.7,42.4,37.2,39.6,37.2,39.6,37.2,39.6,36.7,36.9,34.9,35.2,34.9,35.2,34.9,35.2,32.8,34.4,29.9,34,26,33.8,26,33.8,26,33.8,24.6,33.5,23.4,32.7,23.4,32.7,23.4,32.7,22.6,31.5,22.3,30.2,22.3,30.2,22.3,30,22.3,30,22.6,27.7,23.5,25.7,25.1,24,25.1,24,34.2,16,34.2,16,34.2,16,34.2,15.9,34.2,15.9,34.2,15.9]],
  "4": [[33.5,20.6,23.6,36.9,23.6,37,23.6,37,23.6,37,23.7,37,23.7,37,33.1,37,33.1,37,33.5,36.9,33.6,36.5,33.6,36.5,33.6,20.6,33.6,20.6,33.6,20.6,33.6,20.5,33.6,20.5,33.6,20.5,33.5,20.6,33.5,20.6,33.5,20.6],[33.1,45.8,18.2,45.8,18.2,45.8,17,45.5,15.9,44.7,15.9,44.7,15.9,44.7,15.2,43.5,15,42,15,42,15,40.8,15,40.8,15.2,38.4,15.8,36.2,16.9,34,16.9,34,31.7,10,31.7,10,34,7.8,36.8,7,36.8,7,39.7,7,39.7,7,40.9,7.3,42,8.1,42,8.1,42,8.1,42.7,9.3,42.9,10.7,42.9,10.7,42.9,36.5,42.9,36.5,43.1,36.9,43.4,37,43.4,37,45.7,37,45.7,37,47,37.3,48,38.2,48,38.2,48,38.2,48.8,39.4,49,40.8,49,40.8,49,42,49,42,48.8,43.5,48,44.7,48,44.7,48,44.7,47,45.5,45.7,45.8,45.7,45.8,43.4,45.8,43.4,45.8,43.1,45.9,42.9,46.4,42.9,46.4,42.9,51.3,42.9,51.3,42.7,52.7,42,53.9,42,53.9,42,53.9,40.9,54.7,39.7,55,39.7,55,36.8,55,36.8,55,35.6,54.7,34.6,53.9,34.6,53.9,34.6,53.9,33.9,52.7,33.6,51.3,33.6,51.3,33.6,46.4,33.6,46.4,33.5,45.9,33.1,45.8,33.1,45.8]],
  "5": [[19.5,54.1,19.5,54.1,19.5,54.1,18.1,53.5,17,52.5,17,52.5,17,52.5,16.3,51.1,16,49.5,16,49.5,16,47.5,16,47.5,16.3,46.3,17.1,45.3,17.1,45.3,17.1,45.3,18.2,44.8,19.5,44.9,19.5,44.9,19.5,44.9,22.7,45.6,25.5,46.1,27.8,46.2,27.8,46.2,27.8,46.2,31.2,45.9,33.9,45,35.8,43.4,36.9,41.1,37.3,38.3,37.3,38.3,37.3,38.3,36.9,35.4,35.7,33.4,33.7,32.2,30.8,31.8,30.8,31.8,30.8,31.8,29.5,31.9,28.3,32.2,28.3,32.2,28.3,32.2,27.7,32.5,26.7,32.8,26.7,32.8,26.7,32.8,25.6,33.3,24.9,33.6,24.9,33.6,24.9,33.6,24.2,33.8,23.3,34,23.3,34,23.3,34,22.4,34.2,21.5,34.2,21.5,34.2,19.5,34.2,19.5,34.2,18.2,34,17,33.1,17,33.1,17,33.1,16.3,31.9,16.1,30.5,16.1,30.5,17,10.7,17,10.7,17.3,9.3,18.2,8.1,18.2,8.1,18.2,8.1,19.4,7.3,20.8,7,20.8,7,42.2,7,42.2,7,43.6,7.3,44.8,8.1,44.8,8.1,44.8,8.1,45.6,9.3,45.9,10.7,45.9,10.7,45.9,12.2,45.9,12.2,45.6,13.6,44.8,14.8,44.8,14.8,44.8,14.8,43.6,15.6,42.2,15.9,42.2,15.9,27.6,15.9,27.6,15.9,27.2,16,27,16.4,27,16.4,26.6,24.6,26.6,24.6,26.7,24.7,26.7,24.7,26.7,24.7,26.8,24.7,26.8,24.7,29.9,23.7,33,23.4,33,23.4,33,23.4,36.4,23.7,39.4,24.4,41.9,25.6,44.1,27.3,44.1,27.3,44.1,27.3,45.8,29.4,47,31.9,47.8,34.9,48,38.3,48,38.3,48,38.3,47.8,41.2,47.3,43.8,46.5,46.1,45.4,48.2,43.9,50,42.1,51.5,40,52.8,37.6,53.8,34.8,54.4,31.7,54.9,28.3,55,28.3,55,28.3,55,25.4,54.9,22.5,54.6,19.5,54.1]],
  "6": [[32,30.3,32,30.3,32,30.3,29.1,30.8,26.8,32.5,26.8,32.5,26.8,32.5,25.4,35.1,24.9,38.6,24.9,38.6,24.9,38.6,25.1,41,25.8,43.1,26.9,44.9,26.9,44.9,26.9,44.9,29.1,46.6,32,47.1,32,47.1,32,47.1,35,46.6,37.3,44.9,37.3,44.9,37.3,44.9,38.3,43.2,38.9,41.1,39.2,38.6,39.2,38.6,39.2,38.6,38.7,35,37.3,32.4,37.3,32.4,37.3,32.4,35,30.8,32,30.3],[32,55,32,55,32,55,28.9,54.8,26.1,54.2,23.6,53.1,21.4,51.6,19.4,49.7,19.4,49.7,19.4,49.7,17.8,47.4,16.6,44.7,15.7,41.5,15.2,37.9,15,33.9,15,33.9,15,33.9,15.1,30.2,15.4,26.7,15.9,23.6,16.7,20.7,17.6,18.1,18.8,15.8,20.1,13.7,20.1,13.7,20.1,13.7,22,11.7,24,10,26.4,8.7,28.9,7.7,31.7,7.2,34.7,7,34.7,7,34.7,7,37.9,7.1,40.9,7.5,40.9,7.5,40.9,7.5,42.2,8,43.3,9,43.3,9,43.3,9,44,10.4,44.2,11.9,44.2,11.9,44.2,13.1,44.2,13.1,44,14.3,43.2,15.2,43.2,15.2,43.2,15.2,42.2,15.7,41,15.6,41,15.6,41,15.6,37.9,15.1,35.1,14.9,35.1,14.9,35.1,14.9,32.5,15.2,30.2,16.1,28.3,17.7,28.3,17.7,28.3,17.7,26.7,19.8,25.7,22.5,25,25.7,25,25.7,25,25.7,25,25.7,25.1,25.8,25.1,25.8,25.1,25.8,25.1,25.8,27.6,24.2,30.6,23.3,34.1,23,34.1,23,34.1,23,37.5,23.2,40.5,24,43,25.2,45.1,27,45.1,27,45.1,27,46.8,29.2,48,31.8,48.8,34.9,49,38.4,49,38.4,49,38.4,48.8,41.3,48.3,44.1,47.4,46.5,46.1,48.7,44.5,50.6,44.5,50.6,44.5,50.6,42.5,52.2,40.3,53.4,37.8,54.3,35.1,54.8,32,55]],
  "7": [[37.8,15.8,19.6,15.8,19.6,15.8,18.2,15.5,17.1,14.7,17.1,14.7,17.1,14.7,16.3,13.5,16,12.2,16,12.2,16,10.7,16,10.7,16.3,9.3,17.1,8.1,17.1,8.1,17.1,8.1,18.2,7.3,19.6,7,19.6,7,44.5,7,44.5,7,45.8,7.3,47,8.1,47,8.1,47,8.1,47.7,9.3,48,10.7,48,10.7,48,12.2,48,12.2,47.8,14.5,47.2,16.7,46.3,18.9,46.3,18.9,46.3,18.9,44.7,21.8,43.1,24.7,41.7,27.7,40.2,30.8,38.8,33.9,37.5,37.1,36.2,40.4,34.9,43.7,33.7,47.1,32.5,50.5,32.5,50.5,32.5,50.5,31.8,51.9,30.7,53,30.7,53,30.7,53,29.3,53.8,27.9,54,27.9,54,23.6,54,23.6,54,22.4,53.7,21.6,52.9,21.6,52.9,21.6,52.9,21.1,51.8,21.3,50.5,21.3,50.5,21.3,50.5,22.6,47.2,23.9,43.9,25.3,40.6,26.7,37.4,28.2,34.2,29.7,31.1,31.2,28,32.8,25,34.4,22,36.1,19.1,37.8,16.2,37.8,16.2,37.8,16.2,37.9,16.1,38,15.9,38,15.9,38,15.9,37.9,15.9,37.8,15.8,37.8,15.8]],
  "8": [[30.6,33.4,30.6,33.4,30.6,33.4,28,34.9,26.3,36.5,26.3,36.5,26.3,36.5,25.4,38.3,25.1,40.3,25.1,40.3,25.1,40.3,25.6,42.8,27,44.8,27,44.8,27,44.8,29.2,46.1,32,46.5,32,46.5,32,46.5,34.8,46.1,36.9,44.8,36.9,44.8,36.9,44.8,38.4,42.8,38.8,40.3,38.8,40.3,38.8,40.3,38.5,38.2,37.4,36.4,37.4,36.4,37.4,36.4,35.2,34.9,31.5,33.3,31.5,33.3,31.5,33.3,31.1,33.2,30.6,33.4],[32,14.5,32,14.5,32,14.5,29.6,14.8,27.7,15.9,27.7,15.9,27.7,15.9,26.5,17.6,26.2,19.7,26.2,19.7,26.2,19.7,26.5,21.5,27.4,23.1,27.4,23.1,27.4,23.1,29.2,24.5,31.9,25.7,31.9,25.7,31.9,25.7,32.4,25.8,32.8,25.7,32.8,25.7,32.8,25.7,35.7,24.1,37.4,22.1,38,19.7,38,19.7,38,19.7,37.6,17.6,36.4,15.9,36.4,15.9,36.4,15.9,34.5,14.8,32,14.5],[43.8,50.4,43.8,50.4,43.8,50.4,41.5,52,38.7,53.1,35.6,53.8,32,54,32,54,32,54,28.4,53.8,25.3,53.1,22.5,52,20.2,50.4,20.2,50.4,20.2,50.4,18.4,48.5,17.1,46.2,16.3,43.7,16,40.8,16,40.8,16,40.8,16.3,38.2,17.2,35.8,18.7,33.7,20.9,31.7,23.6,30,23.6,30,23.6,30,23.7,30,23.7,29.9,23.7,29.9,23.7,29.9,23.7,29.8,23.6,29.8,23.6,29.8,23.6,29.8,21.3,28,19.5,26.1,18.2,23.8,17.5,21.4,17.2,18.7,17.2,18.7,17.2,18.7,17.6,15.5,19,12.7,21.1,10.3,21.1,10.3,21.1,10.3,23.3,8.9,25.8,7.8,28.7,7.2,32,7,32,7,32,7,35.3,7.2,38.2,7.8,40.7,8.9,42.9,10.3,42.9,10.3,42.9,10.3,45,12.7,46.4,15.5,46.8,18.7,46.8,18.7,46.8,18.7,46.4,21.6,45.1,24.2,43,26.5,40,28.6,40,28.6,40,28.6,40,28.6,39.9,28.7,39.9,28.7,39.9,28.7,40,28.8,40,28.8,40,28.8,40,28.8,42.9,30.5,45.1,32.5,46.7,34.9,47.7,37.7,48,40.8,48,40.8,48,40.8,47.7,43.7,46.9,46.2,45.6,48.5,43.8,50.4]],
  "9": [[32.5,14.9,32.5,14.9,32.5,14.9,29.6,15.4,27.4,17,27.4,17,27.4,17,26,19.5,25.6,22.8,25.6,22.8,25.6,22.8,25.8,25.5,26.4,27.7,27.4,29.5,27.4,29.5,27.4,29.5,29.6,31.1,32.5,31.7,32.5,31.7,32.5,31.7,35.4,31.1,37.5,29.4,37.5,29.4,37.5,29.4,38.6,27.6,39.2,25.4,39.4,22.8,39.4,22.8,39.4,22.8,38.9,19.6,37.5,17,37.5,17,37.5,17,35.2,15.4,32.5,14.9],[30.4,39,30.4,39,30.4,39,27.1,38.7,24.3,38,21.8,36.7,19.7,34.9,19.7,34.9,19.7,34.9,18.1,32.6,16.9,29.9,16.2,26.7,16,23,16,23,16,23,16.3,19.5,17.1,16.4,18.5,13.7,20.4,11.3,20.4,11.3,20.4,11.3,22.8,9.4,25.6,8.1,28.9,7.3,32.5,7,32.5,7,32.5,7,35.5,7.2,38.2,7.8,40.7,8.9,42.8,10.3,44.7,12.2,44.7,12.2,44.7,12.2,46.2,14.5,47.4,17.1,48.3,20.2,48.8,23.6,49,27.5,49,27.5,49,27.5,48.9,31.3,48.6,34.8,48.1,38,47.4,41,46.6,43.6,45.5,46,44.2,48.1,42.7,49.9,41.1,51.5,39.2,52.8,37.2,53.7,34.9,54.4,32.5,54.9,29.8,55,29.8,55,29.8,55,26.6,54.9,23.3,54.4,23.3,54.4,23.3,54.4,22,53.9,21,52.9,21,52.9,21,52.9,20.3,51.6,20,50.1,20,50.1,20,48.9,20,48.9,20.3,47.7,21,46.8,21,46.8,21,46.8,22.1,46.3,23.3,46.3,23.3,46.3,23.3,46.3,26.5,46.9,29.5,47.1,29.5,47.1,29.5,47.1,32.2,46.8,34.6,45.9,36.5,44.4,36.5,44.4,36.5,44.4,37.9,42.3,38.9,39.6,39.3,36.3,39.3,36.3,39.3,36.3,39.3,36.3,39.2,36.2,39.2,36.2,39.2,36.2,39.2,36.2,36.7,37.8,33.8,38.7,30.4,39]],
  "+": [[28.1,35.3,19.9,35.3,19.9,35.3,18.8,35.1,17.9,34.4,17.9,34.4,17.9,34.4,17.2,33.5,17,32.4,17,32.4,17,31.6,17,31.6,17.2,30.5,17.9,29.6,17.9,29.6,17.9,29.6,18.8,28.9,19.9,28.7,19.9,28.7,28.1,28.7,28.1,28.7,28.5,28.6,28.6,28.2,28.6,28.2,28.6,19.9,28.6,19.9,28.8,18.8,29.4,17.9,29.4,17.9,29.4,17.9,30.3,17.2,31.4,17,31.4,17,32.6,17,32.6,17,33.7,17.2,34.6,17.9,34.6,17.9,34.6,17.9,35.2,18.8,35.4,19.9,35.4,19.9,35.4,28.2,35.4,28.2,35.5,28.6,35.9,28.7,35.9,28.7,44.1,28.7,44.1,28.7,45.2,28.9,46.1,29.6,46.1,29.6,46.1,29.6,46.8,30.5,47,31.6,47,31.6,47,32.4,47,32.4,46.8,33.5,46.1,34.4,46.1,34.4,46.1,34.4,45.2,35.1,44.1,35.3,44.1,35.3,35.9,35.3,35.9,35.3,35.5,35.4,35.4,35.8,35.4,35.8,35.4,44.1,35.4,44.1,35.2,45.2,34.6,46.1,34.6,46.1,34.6,46.1,33.7,46.8,32.6,47,32.6,47,31.4,47,31.4,47,30.3,46.8,29.4,46.1,29.4,46.1,29.4,46.1,28.8,45.2,28.6,44.1,28.6,44.1,28.6,35.8,28.6,35.8,28.5,35.4,28.1,35.3,28.1,35.3]],
  "-": [[40.1,37,23.9,37,23.9,37,22.4,36.7,21.1,35.8,21.1,35.8,21.1,35.8,20.3,34.5,20,33,20,33,20,32,20,32,20.3,30.5,21.1,29.2,21.1,29.2,21.1,29.2,22.4,28.3,23.9,28,23.9,28,40.1,28,40.1,28,41.6,28.3,42.9,29.2,42.9,29.2,42.9,29.2,43.7,30.5,44,32,44,32,44,33,44,33,43.7,34.5,42.9,35.8,42.9,35.8,42.9,35.8,41.6,36.7,40.1,37,40.1,37]],
  "×": [[14.2,42.3,14.2,42.3,24,32.4,24,32.4,24.3,32,24,31.6,24,31.6,14.2,21.7,14.2,21.7,13.3,20.4,13,18.8,13,18.8,13,18.8,13.3,17.2,14.2,15.9,14.2,15.9,15.9,14.2,15.9,14.2,17.2,13.3,18.8,13,18.8,13,18.8,13,20.4,13.3,21.7,14.2,21.7,14.2,31.6,24.1,31.6,24.1,32,24.3,32.5,24.1,32.5,24.1,42.4,14.2,42.4,14.2,43.7,13.3,45.2,13,45.2,13,45.2,13,46.8,13.3,48.2,14.2,48.2,14.2,49.8,15.9,49.8,15.9,50.7,17.2,51,18.8,51,18.8,51,18.8,50.7,20.4,49.8,21.7,49.8,21.7,39.9,31.6,39.9,31.6,39.7,32,39.9,32.4,39.9,32.4,49.8,42.3,49.8,42.3,50.7,43.6,51,45.2,51,45.2,51,45.2,50.7,46.8,49.8,48.1,49.8,48.1,48.2,49.8,48.2,49.8,46.8,50.7,45.2,51,45.2,51,45.2,51,43.7,50.7,42.4,49.8,42.4,49.8,32.5,39.9,32.5,39.9,32,39.7,31.6,39.9,31.6,39.9,21.7,49.8,21.7,49.8,20.4,50.7,18.8,51,18.8,51,18.8,51,17.2,50.7,15.9,49.8,15.9,49.8,14.2,48.1,14.2,48.1,13.3,46.8,13,45.2,13,45.2,13,45.2,13.3,43.6,14.2,42.3]]
};
function drawCutGlyphRow(ctx,glyphs,top,bottom,extraContours={},outline=true){
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.font='900 47px Arial, sans-serif';
  const face=ctx.createLinearGradient(0,8,0,55);
  face.addColorStop(0,top);
  face.addColorStop(1,bottom);
  const edges=outline===true?[[1,10,'#656565'],[0,8,'#ffffff']]:outline||[];
  const passes=[...edges,[0,0,face]];
  for(let j=0;j<glyphs.length;j++){
    ctx.save();ctx.translate(j*64,0);
    const ch=glyphs[j],contours=extraContours[ch]??damageContours[ch];
    for(const [offset,width,color] of passes){
      ctx.save();ctx.translate(0,offset);ctx.strokeStyle=ctx.fillStyle=color;ctx.lineWidth=width||1;
      if(contours){
        ctx.beginPath();
        for(const ring of contours){
          ctx.moveTo(ring[0],ring[1]);
          for(let k=2;k<ring.length;k+=2)ctx.lineTo(ring[k],ring[k+1]);
          ctx.closePath();
        }
        if(width)ctx.stroke();
        ctx.fill();
      }else{
        if(width)ctx.strokeText(ch,32,33);
        ctx.fillText(ch,32,33);
      }
      ctx.restore();
    }
    ctx.restore();
  }
}
function drawDamageRows(ctx,glyphs){
  for(const [index,[top,bottom]] of damagePalettes.entries()){
    ctx.save();ctx.translate(0,(index+1)*64);
    drawCutGlyphRow(ctx,glyphs,top,bottom);
    ctx.restore();
  }
}
const comboFaces=[
  ['#f0f4fa','#bdc8d7'],['#74ffc1','#37e4ad'],['#40ffec','#21ddd9'],['#ff9a8b','#ff7368'],
  ['#b6ffef','#74f5e1'],
];
// Crisp dark keyline and a short hard shadow, shared by every tier.
const comboOutline=[[2.2,6.8,'#17233a'],[0,4.4,'#17233a']];
const comboCell=72*.85,comboCanvasWidth=640;
const comboDigitRight=Array.from({length:10},(_,digit)=>{
  const xs=damageContours[digit].flatMap(ring=>ring.filter((_,index)=>index%2===0));
  return (Math.max(...xs)+5.5-32)/64;
});
const comboSheets=[];
const comboPulseDuration=.30;
const comboRainbowPeriod=256;
let comboRainbowStrip;
const comboSlashThemes=[
  ['#7588a3','#eef4ff'],['#2fae8f','#bdffe6'],['#6558df','#ffe735'],
  ['#ffe665','#fff8de'],['#8d73f4','#fff19a'],
];
const comboSlashShapes=[[.63,.79,.77],[.65,.83,.75],[.61,.78,.81],[.67,.84,.80]].map(([rise,tooth,cut])=>
  [[0,.52],[.055,.10],[.55,.04],[rise,-.14],[rise+.045,.20],[tooth,.035],
    [tooth+.045,.26],[1,-.05],[.935,.47],[.865,.39],[cut,.65],[cut-.065,.46],[.06,.70]]);
function comboSlashPath(ctx,left,width,height,variant){
  const points=comboSlashShapes[variant];
  ctx.beginPath();
  for(let i=0;i<points.length;i++)ctx[i?'lineTo':'moveTo'](left+points[i][0]*width,points[i][1]*height);
  ctx.closePath();
}
function paintComboSlash(ctx,width,height,tier,variant,age,progress){
  const kick=Math.max(0,1-age/.18),reveal=1-Math.max(0,1-age/.065)**3;
  const w=width*(.85+.15*reveal),left=-w/2;
  ctx.save();ctx.translate((variant%2?1:-1)*kick*2,-kick*2);
  ctx.save();ctx.translate(3,6);ctx.globalAlpha=.7;ctx.fillStyle='#17233a';
  comboSlashPath(ctx,left,w,height,variant);ctx.fill();ctx.restore();
  ctx.save();ctx.translate(0,3);ctx.fillStyle=comboSlashThemes[tier][1];
  comboSlashPath(ctx,left,w,height,variant);ctx.fill();ctx.restore();
  comboSlashPath(ctx,left,w,height,variant);ctx.fillStyle='#3c405a';ctx.fill();ctx.clip();
  // The filled part of the lightning is the existing right-to-left combo timer.
  const remaining=left+w*(1-progress);
  ctx.fillStyle=comboSlashThemes[tier][0];ctx.fillRect(remaining,-height*.3,w*progress,height*1.1);
  if(age<.09){
    const x=left+w*Math.min(1,age/.09);
    ctx.globalAlpha=.75*(1-age/.09);ctx.fillStyle='#fffdf0';ctx.beginPath();
    ctx.moveTo(x,-height*.3);ctx.lineTo(x+w*.12,-height*.3);
    ctx.lineTo(x-w*.04,height);ctx.lineTo(x-w*.16,height);ctx.closePath();ctx.fill();
  }
  ctx.restore();
}
function rainbowStrip(){
  if(comboRainbowStrip)return comboRainbowStrip;
  // Tile two identical cycles so the timer and glyphs can sample across the seam.
  const strip=document.createElement('canvas');
  strip.width=2*comboRainbowPeriod;strip.height=4;
  const ctx=strip.getContext('2d'),gradient=ctx.createLinearGradient(0,0,strip.width,0);
  const colors=['#ff8d84','#ffce70','#fff078','#a4ff72','#70fff1','#81c6ff','#cc96ff','#ff8bd0'];
  for(let i=0;i<=colors.length*2;i++)gradient.addColorStop(i/(colors.length*2),colors[i%colors.length]);
  ctx.fillStyle=gradient;ctx.fillRect(0,0,strip.width,strip.height);
  comboRainbowStrip=strip;
  return strip;
}
function comboSheet(tier){
  if(!comboSheets[tier]){
    const sheet=document.createElement('canvas');
    sheet.width=13*64;sheet.height=128;
    const ctx=sheet.getContext('2d'),glyphs='0123456789×连击';
    // Only the caption has a separate contour table; digits reuse damageContours.
    drawCutGlyphRow(ctx,glyphs,...comboFaces[tier],comboLettering,comboOutline);
    ctx.translate(0,64);
    // Face-only highlight: the impact never flashes the dark outline white.
    drawCutGlyphRow(ctx,glyphs,tier===4?'#ffffff':'#fff7dd',tier===4?'#ffffff':'#ffe4b6',comboLettering,false);
    comboSheets[tier]=sheet;
  }
  return comboSheets[tier];
}
let effectiveSheet;
// Reference lime face, with the original 17.6px caption height and no backing art.
class EffectiveCallout {
  static duration=.9;
  constructor(reducedMotion=false){
    this.reducedMotion=reducedMotion;
    this.canvas=document.createElement('canvas');
    this.canvas.width=224;this.canvas.height=104;
    this.width=112;this.height=52;
    this.inkBounds={left:10,top:5,right:102,bottom:38};
    this.canvas.className='zx-effective-popup';
    this.canvas.style.cssText='position:absolute;display:block;width:112px;height:52px;pointer-events:none';
    this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label','效果绝佳');
    this.canvas.textContent='效果绝佳';
    if(!effectiveSheet){
      effectiveSheet=document.createElement('canvas');
      effectiveSheet.width=256;effectiveSheet.height=64;
      const ctx=effectiveSheet.getContext('2d');
      drawCutGlyphRow(ctx,'效果绝佳','#bffd3f','#99eb25',comboLettering,comboOutline);
    }
    this.frame=-1;
  }
  paint(age){
    age=Math.max(0,age);
    const frame=Math.floor(age*30);
    if(frame===this.frame)return;
    this.frame=frame;
    const ctx=this.canvas.getContext('2d');
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    const cell=17.6*2*64/50,rise=this.reducedMotion?0:18*(1-Math.exp(-age*2.2));
    ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(EffectiveCallout.duration-age)/.28));
    ctx.translate(this.canvas.width/2,52-rise);
    ctx.drawImage(effectiveSheet,-cell*2,-cell/2,cell*4,cell);
    ctx.restore();this.canvas.dataset.frame=String(frame);
  }
}
// Wheels use an unwrapped position so another kill can retarget a roll in flight.
function comboWheelAt(wheel,time){
  const t=Math.max(0,Math.min(1,(time-wheel.start)/.10));
  return t===1?wheel.to:wheel.to-(wheel.to-wheel.from)*(1-t)**3;
}
class ComboRoller {
  constructor(label){
    this.label=label;
    this.canvas=document.createElement('canvas');
    this.canvas.width=comboCanvasWidth;this.canvas.height=216;
    this.canvas.style.width=(comboCanvasWidth/2)+'px';this.canvas.style.height='108px';
    this.canvas.style.display='block';this.canvas.setAttribute('role','img');
    label.replaceChildren(this.canvas);
    this.wheels=[];this.paintedAt=-1;this.active=false;this.frame=0;this.slashVariant=-1;
  }
  reset(){this.wheels.length=0;this.count=null;this.active=false;this.pulseStart=null;}
  scaleAt(time){
    if(this.pulseStart==null)return 1;
    const age=Math.max(0,time-this.pulseStart);
    // Retain the original 1.4x peak and resting size; sharpen only the timing.
    const peak=1.4;
    if(age<.032)return this.pulseFrom+(peak-this.pulseFrom)*(1-(1-age/.032)**3);
    if(age<.075)return peak;
    if(age<.20){
      const t=(age-.075)/.125;
      return peak+(.97-peak)*(1-(1-t)**3);
    }
    const t=Math.min(1,(age-.20)/(comboPulseDuration-.20));
    return .97+.03*t*t*(3-2*t);
  }
  setCount(count,time){
    const length=String(count).length;
    // Grow the surface to the left for long counts; never reduce glyph size.
    const canvasWidth=Math.max(comboCanvasWidth,Math.ceil((2.85+.70*(length-1)+.42)*comboCell*1.4)+38);
    if(this.canvas.width!==canvasWidth){
      this.canvas.width=canvasWidth;this.canvas.style.width=(canvasWidth/2)+'px';
      this.label.style.width=(canvasWidth/2)+'px';
      if(this.label.parentElement)this.label.parentElement.style.width=(canvasWidth/2)+'px';
      this.rainbowFaces=null;this.rainbowShade=null;
    }
    const roll=this.count!=null && count>this.count;
    if(roll || this.count==null){
      this.pulseFrom=this.scaleAt(time);
      this.pulseStart=time;
      this.slashVariant=(this.slashVariant+1)%comboSlashShapes.length;
    }else{
      this.pulseStart=null;
    }
    this.wheels.length=length;
    for(let i=0;i<length;i++){
      const place=Math.floor(count/10**i),previous=this.wheels[i];
      if(roll && previous?.to===place)continue;
      // A newly introduced leading digit rolls in from a blank cell.
      const from=roll?(previous?comboWheelAt(previous,time):place-1):place;
      this.wheels[i]={from,to:place,start:time,blank:roll&&!previous};
    }
    this.count=count;this.active=true;this.paintedAt=-1;
    this.canvas.textContent='×'+count;this.canvas.setAttribute('aria-label','连击 ×'+count);
  }
  paint(tier,time,progress){
    const rainbow=tier===4,phase=rainbow?Math.floor(time*comboRainbowPeriod/4)%comboRainbowPeriod:0;
    if(progress===this.lastProgress && (time===this.paintedAt || (!this.active && (!rainbow||phase===this.lastPhase))))return;
    this.lastProgress=progress;
    this.lastPhase=phase;
    this.paintedAt=time;this.active=false;
    const ctx=this.canvas.getContext('2d');
    const length=this.wheels.length;
    let faces;
    if(rainbow){
      if(!this.rainbowFaces){
        const layer=document.createElement('canvas');
        layer.width=this.canvas.width;layer.height=this.canvas.height;
        this.rainbowFaces=layer.getContext('2d');
        const shade=this.rainbowFaces.createLinearGradient(0,68,0,148);
        shade.addColorStop(0,'rgba(255,255,255,.10)');
        shade.addColorStop(.5,'rgba(255,255,255,0)');
        shade.addColorStop(1,'rgba(220,250,255,.025)');
        this.rainbowShade=shade;
      }
      faces=this.rainbowFaces;
      faces.clearRect(0,0,this.canvas.width,this.canvas.height);
    }
    // All tiers and digit counts use the same glyph cell, reduced by 15%.
    const lastCenter=2.85+.70*(length-1);
    const cell=comboCell;
    const units=comboWheelAt(this.wheels[0],time),whole=Math.floor(units);
    const edge=units===whole?comboDigitRight[whole%10]:Math.max(comboDigitRight[whole%10],comboDigitRight[(whole+1)%10]);
    const lineWidth=(lastCenter+edge)*cell;
    const left=(this.canvas.width-lineWidth)*.5,cy=this.canvas.height*.5;
    const pitch=.70*cell,right=left+lastCenter*cell;
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    const scale=this.scaleAt(time);
    const age=this.pulseStart==null?1:Math.max(0,time-this.pulseStart);
    const flash=Math.max(0,1-age/.065)*.12;
    this.active=this.pulseStart!=null && age<comboPulseDuration;
    const centerX=this.canvas.width*.5,width=lineWidth*scale,angle=-8*Math.PI/180;
    const cos=Math.cos(angle),sin=-Math.sin(angle),originX=this.canvas.width-19-width*cos/2;
    const halfWidth=width/2+8,above=cell*scale*.5+8,below=cell*scale*.7+8;
    // Screen-space feedback avoids only the painted combo, not its transparent canvas margin.
    this.inkBounds={left:originX-halfWidth*cos-above*sin,right:originX+halfWidth*cos+below*sin,
      top:92-halfWidth*sin-above*cos,bottom:92+halfWidth*sin+below*cos};
    // Rotate the label and timer together, reserving the right edge for the pulse.
    ctx.save();ctx.translate(originX,92);ctx.rotate(angle);
    paintComboSlash(ctx,width,cell*scale,tier,this.slashVariant,age,progress);
    ctx.scale(scale,scale);ctx.translate(-centerX,-cy);
    const wheelStep=cell*1.04;
    ctx.beginPath();ctx.rect(0,cy-wheelStep/2,this.canvas.width,wheelStep);ctx.clip();
    const sheet=comboSheet(tier);
    const glyph=(digit,x,y,size)=>{
      const dx=x-size/2,dy=y-size/2;
      ctx.drawImage(sheet,digit*64,0,64,64,dx,dy,size,size);
      if(faces)faces.drawImage(sheet,digit*64,64,64,64,dx,dy,size,size);
      else if(flash>0){
        const alpha=ctx.globalAlpha;ctx.globalAlpha=alpha*flash;
        ctx.drawImage(sheet,digit*64,64,64,64,dx,dy,size,size);
        ctx.globalAlpha=alpha;
      }
    };
    glyph(11,left+.50*cell,cy,cell);
    glyph(12,left+1.47*cell,cy,cell);
    glyph(10,left+2.24*cell,cy+2,cell*.65);
    for(let i=0;i<length;i++){
      const w=this.wheels[i],pos=comboWheelAt(w,time),base=Math.floor(pos),fraction=pos-base,x=right-i*pitch;
      if(pos!==w.to)this.active=true;
      if(!(w.blank&&base<w.to))glyph(base%10,x,cy-wheelStep*fraction,cell);
      if(fraction>0)glyph((base+1)%10,x,cy+wheelStep*(1-fraction),cell);
    }
    if(faces){
      faces.save();faces.globalCompositeOperation='source-in';
      faces.drawImage(rainbowStrip(),phase,0,comboRainbowPeriod,4,left,0,lineWidth,this.canvas.height);
      faces.globalCompositeOperation='source-atop';faces.fillStyle=this.rainbowShade;
      faces.fillRect(left,0,lineWidth,this.canvas.height);
      if(flash>0){
        faces.globalAlpha=flash;faces.fillStyle='#fff4da';
        faces.fillRect(left,0,lineWidth,this.canvas.height);
      }
      faces.restore();
      ctx.drawImage(faces.canvas,0,0);
    }
    ctx.restore();
    this.canvas.dataset.frame=String(++this.frame);
  }
}
var Gl = class {
    cap;
    limit = 240;
    view = null;
    mesh;
    glyphs = `0123456789!+-xk.₽MBTQ`;
    items = [];
    free = [];
    aA;
    aB;
    aC;
    constructor(e, t = 3e3) {
      this.cap = t;
      let n = this.glyphs.length,
        r = document.createElement(`canvas`);
      ((r.width=64*n), (r.height=64*(1+damagePalettes.length)));
      let i = r.getContext(`2d`);
      ((i.font = `900 54px Fredoka, Nunito, "Arial Rounded MT Bold", Arial, sans-serif`),
        (i.textAlign = `center`),
        (i.textBaseline = `middle`));
      for (let e = 0; e < n; e++)
        ((i.lineWidth = 12),
          (i.strokeStyle = `#1a1030`),
          (i.lineJoin = `round`),
          i.strokeText(this.glyphs[e], e * 64 + 32, 35),
          (i.fillStyle = `#fff`),
          i.fillText(this.glyphs[e], e * 64 + 32, 35));
      drawDamageRows(i,this.glyphs);
      let a = new Wr(r);
      a.colorSpace = pi;
      let o = new Yr(1, 1),
        s = (e) => new Float32Array(t * e);
      ((this.aA = new gr(s(4), 4).setUsage(ii)),
        (this.aB = new gr(s(4), 4).setUsage(ii)),
        (this.aC = new gr(s(4), 4).setUsage(ii)),
        o.setAttribute(`iA`, this.aA),
        o.setAttribute(`iB`, this.aB),
        o.setAttribute(`iC`, this.aC));
      let c = new Kr({
        transparent: !0,
        depthTest: !1,
        depthWrite: !1,
        uniforms: { map: { value: a }, G: { value:n }, rows:{value:1+damagePalettes.length} },
        vertexShader: `attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; uniform float G; uniform float rows; varying vec2 vUv; varying vec4 vCol; varying float impact;
        void main(){ vec4 mv = viewMatrix*vec4(iA.xyz,1.); float dist = -mv.z; float s = iA.w * clamp(dist*0.08, 0.6, 2.4);
          impact = iB.z;
          vec2 glyph = vec2(position.x*0.62 + iB.y*0.56, position.y);
          if(impact>.5){
            float age=iB.w;
            float kick=smoothstep(0.,.18,age), drift=smoothstep(.62,1.,age);
            glyph=vec2(position.x+iB.y,position.y);
            if(impact==2.) mv.y+=.95+.65*kick+1.28*age+.40*drift;
            else mv.xy+=vec2(.16*kick+.24*drift,.62+.57*kick+.36*drift);
          }
          mv.xy += glyph*s;
          gl_Position=projectionMatrix*mv;vUv=vec2((iB.x+uv.x)/G,(uv.y+rows-1.-impact)/rows);vCol=iC; }`,
        fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying vec4 vCol; varying float impact;
          void main(){
            vec4 t=texture2D(map,vUv);if(t.a<.05)discard;
            vec3 ink=mix(vec3(0.1,0.06,0.18),vCol.rgb,smoothstep(0.3,0.7,t.r));
            if(impact>.5){
              // Preserve the white outline while lifting the face color.
              vec3 face=mix(t.rgb,pow(max(t.rgb,vec3(0.)),vec3(.76)),smoothstep(.27,.82,max(t.r,max(t.g,t.b))));
              float peak=max(face.r,max(face.g,face.b));
              vec3 pale=mix(face,vec3(1.),.14*smoothstep(.55,.95,peak));
              // Keep the dominant channel luminous as damage concentrates the hue.
              vec3 deep=max(vec3(0.),face-(vec3(peak)-face)*.38)*.985;
              ink=mix(pale,deep,vCol.r);
            }
            gl_FragColor=vec4(ink,t.a*vCol.a);
          }`,
      });
      ((this.mesh = new Sr(o, c, t)),
        (this.mesh.frustumCulled = !1),
        (this.mesh.count = 0),
        (this.mesh.renderOrder = 50),
        e.add(this.mesh));
    }
    spawn(e, t, n, r, i, a = 0.5, impact = false, damage = 0, displayScale = 1) {
      if(this.view&&!this.view.visible(e,t,n,6))return;
      let item;
      if (this.items.length >= this.limit) {
        if (a < 0.7) return;
        item=this.items.shift();
      }
      let o = Al.set(i);
      item??=this.free.pop()??{color:{},glyphs:[]};
      const hurt=impact===HERO_HURT_LABEL;
      item.x=hurt?e:e+F.range(-.4,.4);item.y=t;item.z=hurt?n:n+F.range(-.4,.4);
      item.impact=Number(impact);item.vy=hurt?0:impact?5.2:3.2;item.text=r;
      item.life=item.max=impact===MEGA_CRITICAL_LABEL?1.04:impact===CRITICAL_LABEL?.92:hurt?.80:impact?.72:.85;item.size=a*displayScale;
      const logDamage=Math.log1p(Math.max(0,damage));
      item.color.r=impact ? logDamage/(logDamage+3.2) : o.r;item.color.g=o.g;item.color.b=o.b;
      item.glyphs.length=r.length;
      for(let j=0;j<r.length;j++)item.glyphs[j]=this.glyphs.indexOf(r[j]);
      if(impact){
        const offsets=item.offsets??=[];
        let advance=0;
        for(let j=0;j<r.length;j++){
          const width=r[j]==='1'?.44:r[j]==='-'?.48:r[j]==='.'?.27:.64;
          offsets[j]=advance+width/2;
          advance+=width;
        }
        for(let j=0;j<r.length;j++)offsets[j]-=advance/2;
      }
      this.items.push(item);
    }
    trimTo(limit){
      while(this.items.length>limit)this.free.push(this.items.shift());
    }
    update(e) {
      let t = this.aA.array,
        n = this.aB.array,
        r = this.aC.array,
        i = 0;
      for (let a = this.items.length - 1; a >= 0; a--) {
        let o = this.items[a];
        if (((o.life -= e), o.life <= 0)) {
          this.free.push(o);
          this.items.splice(a, 1);
          continue;
        }
        ((o.y += o.vy * e), (o.vy *= Math.exp(-e * 5)));
        let s = 1 - o.life / o.max,
          c = s < 0.12 ? 1 + (1 - s / 0.12) * 0.7 : 1,
          l = s > 0.7 ? 1 - (s - 0.7) / 0.3 : 1,
          u = o.text.length;
        const critical=o.impact===CRITICAL_LABEL;
        const mega=o.impact===MEGA_CRITICAL_LABEL;
        if(mega){
          const strike=Math.min(s/.10,1), settle=Math.min(Math.max((s-.10)/.17,0),1);
          c=.60+.86*strike-.42*settle;
          l=1-Math.max(0,(s-.68)/.32)**2;
        }else if(critical){
          const punch=Math.min(s/.085,1);
          const settle=Math.min(Math.max((s-.085)/.16,0),1);
          c=.66+.72*punch-.38*settle;
          l=1-Math.max(0,(s-.66)/.34)**2;
        }else if(o.impact===HERO_HURT_LABEL){
          const recoil=Math.min(s/.13,1), settle=Math.min(Math.max((s-.13)/.18,0),1);
          c=.77+.48*recoil-.25*settle;
          l=1-Math.max(0,(s-.61)/.39)**2;
        }else if(o.impact){
          // Fast compression, one overshoot, then a readable hold before release.
          c = s < .09 ? .83 + .62*(s/.09) : s < .25 ? 1.45 - .48*(s-.09)/.16
            : s < .39 ? .97 + .09*(s-.25)/.14 : 1.06;
          l = 1 - Math.max(0,(s-.67)/.33)**2;
        }
        for(let e=0;e<u && i<this.cap;e++){
          let a=o.glyphs[e];
          a < 0 ||
            ((t[i * 4] = o.x),
            (t[i * 4 + 1] = o.y),
            (t[i * 4 + 2] = o.z),
            (t[i * 4 + 3] = o.size * c * VFX_SCALE),
            (n[i * 4] = a),
            (n[i * 4 + 1] = o.impact ? o.offsets[e] : e - (u - 1) / 2),
            (n[i * 4 + 2] = o.impact),
            (n[i * 4 + 3] = s),
            (r[i * 4] = o.color.r),
            (r[i * 4 + 1] = o.color.g),
            (r[i * 4 + 2] = o.color.b),
            (r[i * 4 + 3] = l),
            i++);
        }
      }
      ((this.mesh.count = i), (this.mesh.visible = i > 0));
      for (let e of [this.aA, this.aB, this.aC])
        (e.clearUpdateRanges(), e.addUpdateRange(0, i * 4), (e.needsUpdate = !0));
    }
    clear() {
      (this.trimTo(0), (this.mesh.count = 0), (this.mesh.visible = !1));
    }
  },
  Kl = class {
    add;
    norm;
    ground;
    groundN;
    beams;
    rings;
    text;
    atlas;
    enabledText = !0;
    calm = !1;
    set fade(e) {
      ((this.fadeBase = e),
        (this.add.fade = e * this.glow),
        (this.norm.fade = this.ground.fade = this.groundN.fade = this.beams.fade = this.rings.fade = e));
      for (let t of this.faded) t.fade = e;
      this.opacity = e;
    }
    fadeBase = 1;
    glowK = 1;
    get glow() {
      return this.glowK;
    }
    set glow(e) {
      ((this.glowK = e), (this.add.fade = this.fadeBase * e));
    }
    set ownFade(e) {
      ((Fl.ownFade = e), (this.ownOpacity = e));
    }
    ownOpacity = 1;
    opacity = 1;
    faded = [];
    track(e) {
      return (this.faded.push(e), (e.fade = this.opacity), e);
    }
    constructor(scene, t, atlas, run) {
      const combat = this.combatLayer = new Cr();
      combat.addEventListener('childadded',({child})=>maskSceneInk(child.material));
      scene.add(combat);
      ((this.atlas = atlas),
        (this.add = new zl(combat, this.atlas, 3000, !0, !1, t)),
        (this.norm = new zl(combat, this.atlas, 1800, !1, !1, t)),
        (this.ground = new zl(combat, this.atlas, 1500, !0, !0, t)),
        (this.groundN = new zl(combat, this.atlas, 800, !1, !0, t)),
        (this.beams = new Bl(combat)),
        (this.rings = new Ul(combat)),
        (this.text = new Gl(combat)));
      this.crafted=new StylizedSkillFX(this,combat);
      this.upgrade=new UpgradeEffects(run,scene);
      this.danger=new EnemyTelegraphs(combat,()=>run.time,(x,z)=>run.terrain.height(x,z));
    }
    setPerformance(profile,view){
      for(const pool of [this.add,this.norm,this.ground,this.groundN,this.beams])pool.lockVisualQuality=!!profile.lockVisualQuality;
      const effectView = view && {visible: (x,y,z,radius) => view.visible(x,y,z,radius * VFX_SCALE)};
      this.crafted.setPerformance(profile,effectView);
      this.particleBudget??=new ParticleBudget();this.particleBudget.limit=profile.particleCell;
      this.criticalBudget??=new CriticalImpactBudget();
      this.criticalBudget.limit=profile.name==='流畅'?4:profile.name==='均衡'?6:8;
      this.add.densityBudget=this.norm.densityBudget=this.particleBudget;
      this.add.view=this.norm.view=this.text.view=effectView;
      applyCrowdEffects(this,profile);
    }
    update(e) {
      flushDamage(this,e);this.particleBudget?.next();this.crafted.update(e);this.danger.update();this.upgrade.update(e);
      (this.add.update(e),
        this.norm.update(e),
        this.ground.update(e),
        this.groundN.update(e),
        this.beams.update(e),
        this.rings.update(e),
        this.text.update(e));
    }
    clear() {
      this.damagePending?.clear();this.damageClock=0;this.criticalBudget?.clear();this.crafted.clear();this.danger.clear();this.upgrade.clear();
      (this.add.clear(),
        this.norm.clear(),
        this.ground.clear(),
        this.groundN.clear(),
        this.beams.clear(),
        this.rings.clear(),
        this.text.clear());
    }
    burst(e, t, n, r, i = 12, a = 6, o = 0, s = 0.5, c = 0.5, l = 0) {
      i=Math.min(Math.ceil(i),this.add.available(e,t,n,s*1.3));
      for (let u = 0; u < i; u++) {
        let i = F.range(0, Math.PI * 2),
          u = F.range(-0.3, 1),
          d = a * F.range(0.4, 1);
        this.add.spawn({
          x: e,
          y: t,
          z: n,
          vx: Math.cos(i) * d * Math.cos(u),
          vy: Math.sin(u) * d + 1,
          vz: Math.sin(i) * d * Math.cos(u),
          life: c * F.range(0.6, 1.2),
          size: s * F.range(0.6, 1.3),
          endSize: 0,
          color: r,
          endColor: r,
          shape: o,
          drag: 3,
          gravity: l,
          spin: F.range(-6, 6),
          glow: 0.3,
        });
      }
    }
    criticalImpact(x,y,z) {
      return (!this.text.view||this.text.view.visible(x,y,z,4))&&this.criticalBudget.allow(this.crafted.clock,x,z);
    }
    ring(e, t, n, r, i, a = 0.45, o = 0.15, s = Hl(i)) {
      ((i = Vl(i)),
        this.rings.spawn(e, t + 0.15, n, r * o, r * 1.05, i, a, s, Math.min(0.55, 0.3 + r * 0.03)));
    }
    staticRing(e, t, n, r, i, a = 0.7, o = Hl(i)) {
      this.rings.spawn(e, t + 0.15, n, r, r, i, 0, o, Math.min(0.4, 0.26 + r * 0.015), a);
    }
    telegraph(e, t, n, r, i, a) {
      Fl.on ||
        (this.rings.spawn(e, t + 0.14, n, r, r, i, a, 1, Math.min(0.36, 0.26 + r * 0.015), 0.85, !0),
        this.ground.spawn({
          x: e,
          y: t + 0.1,
          z: n,
          life: a,
          size: 0.2,
          endSize: r * 2,
          color: i,
          shape: 0,
          glow: 0,
          rot: 0,
          essential: true,
        }));
    }
    enemyCircle(x,y,z,radius,color,seconds) {
      return this.danger.circle(x,y,z,radius,color,seconds);
    }
    enemyLine(x,z,endX,endZ,halfWidth,color,seconds) {
      return this.danger.line(x,z,endX,endZ,halfWidth,color,seconds);
    }
    flash(e, t, n, r, i = 3, a = 0.15) {
      ((i = Math.min(i, 4.5)),
        this.calm && ((i *= 0.45), (a *= 0.6)),
        this.add.spawn({
          x: e,
          y: t,
          z: n,
          life: a,
          size: i * 0.7,
          endSize: i,
          color: r,
          shape: 0,
          glow: 0,
        }));
    }
    dust(e, t, n, r = 14207144, i = 6, a = 3) {
      i=Math.min(Math.ceil(i),this.norm.available(e,t+.2,n,1.6));
      for (let o = 0; o < i; o++) {
        let i = F.range(0, Math.PI * 2),
          o = a * F.range(0.3, 1);
        this.norm.spawn({
          x: e,
          y: t + 0.2,
          z: n,
          vx: Math.cos(i) * o,
          vy: F.range(0.5, 2),
          vz: Math.sin(i) * o,
          life: F.range(0.4, 0.8),
          size: F.range(0.5, 1),
          endSize: 1.6,
          color: r,
          shape: 0,
          drag: 4,
        });
      }
    }
    trail(e, t, n, r, i = 0.4, a = 0, o = 0.3) {
      if(!this.add.available(e,t,n,i))return;
      this.add.spawn({
        x: e,
        y: t,
        z: n,
        vx: F.range(-0.5, 0.5),
        vy: F.range(-0.5, 0.5),
        vz: F.range(-0.5, 0.5),
        life: o,
        size: i,
        endSize: 0,
        color: r,
        shape: a,
        glow: 0.4,
        spin: F.range(-4, 4),
      });
    }
    lightning(e, t, n, r, i, a, o = 16773754, s = 0.35, c = 6, l = 0.18) {
      s = Math.min(s * 0.75, 0.5);
      let u = e,
        d = t,
        f = n,
        p = Math.hypot(r - e, i - t, a - n);
      for (let m = 1; m <= c; m++) {
        let h = m / c,
          g = m === c ? 0 : p * 0.12 * VFX_SCALE,
          _ = e + (r - e) * h + F.range(-g, g),
          v = t + (i - t) * h + F.range(-g, g),
          y = n + (a - n) * h + F.range(-g, g);
        (this.beams.spawn(u, d, f, _, v, y, s, o, l), (u = _), (d = v), (f = y));
      }
    }
    number(e, t, n, r, i, a = !1, target = null) {
      if (!this.enabledText) return;
      if(target!==null){accumulateDamage(this,target,e,t,n,r,i,a);return;}
      const style=a===2?MEGA_CRITICAL_LABEL:a?CRITICAL_LABEL:i===16751162?EFFECTIVE_LABEL:
        i===11053240?RESISTED_LABEL:i===0xffffff?NORMAL_HIT_LABEL:0;
      const size=style===MEGA_CRITICAL_LABEL?.97:style===CRITICAL_LABEL?.87:style===RESISTED_LABEL?.69:style?.76:.52;
      this.text.spawn(e,t,n,(style?'-':'')+Wl(r),i,size,style,r,.5);
    }
    playerDamage(x,y,z,loss) {
      if(this.enabledText && loss>0)this.text.spawn(x,y,z,'-'+Wl(loss),0xff4948,.79,HERO_HURT_LABEL,loss,.5);
    }
    heal(e, t, n, r) {
      this.enabledText && this.text.spawn(e, t, n, `+` + Math.max(1, Math.round(r)), 3993696, 0.56);
    }
  },
  ql = class {
    cap;
    mesh;
    n = 0;
    A;
    B;
    C;
    aA;
    aB;
    aC;
    tmp = new Ei();
    constructor(e, t, n, r, i, visualScale = VFX_SCALE) {
      this.visualScale = visualScale;
      ((this.cap = n),
        (this.additive = r),
        (this.A = new Float32Array(n * 4)),
        (this.B = new Float32Array(n * 4)),
        (this.C = new Float32Array(n * 4)));
      let a = new Yr(1, 1);
      ((this.aA = new gr(this.A, 4).setUsage(ii)),
        (this.aB = new gr(this.B, 4).setUsage(ii)),
        (this.aC = new gr(this.C, 4).setUsage(ii)),
        a.setAttribute(`iA`, this.aA),
        a.setAttribute(`iB`, this.aB),
        a.setAttribute(`iC`, this.aC));
      let o = new Kr({
        transparent: !0,
        depthWrite: false,
        blending: 1, // Opaque pigment/ink silhouettes use normal alpha, never additive washout.
        uniforms: { map: { value: t }, uFogColor: i.uFogColor, uFogNear: i.uFogNear, uFogFar: i.uFogFar },
        vertexShader: `attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; varying vec2 vUv; varying vec4 vCol; varying float vGlow; varying float vD;
        void main(){ float cs = cos(iC.y), sn = sin(iC.y); vec2 p2 = vec2(position.x*cs - position.y*sn, position.x*sn + position.y*cs) * iA.w;
          vec4 mv = viewMatrix * vec4(iA.xyz, 1.); mv.xy += p2; vD = -mv.z; gl_Position = projectionMatrix * mv;
          float idx = iC.x; vec2 cell = vec2(mod(idx,8.), 17. - floor(idx/8.)); vUv = (cell + uv) / vec2(8., 18.); vCol = iB; vGlow = iC.z; }`,
        fragmentShader: `uniform sampler2D map; uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar; varying vec2 vUv; varying vec4 vCol; varying float vGlow; varying float vD;
        void main(){ vec4 t = texture2D(map, vUv); float a = t.a * vCol.a; if(a<.02)discard; vec3 c = vCol.rgb * t.rgb * (1. + min(vGlow,.15));
          ${r ? Ml : `c = min(c, vec3(0.94)); c = mix(c, uFogColor, smoothstep(uFogNear, uFogFar, vD));`} gl_FragColor = vec4(c, a); }`,
      });
      ((this.mesh = new Sr(a, o, n)),
        (this.mesh.frustumCulled = !1),
        (this.mesh.count = 0),
        (this.mesh.renderOrder = r ? 12 : 4),
        e.add(this.mesh));
    }
    fade = 1;
    additive;
    begin() {
      this.n = 0;
    }
    push(e, t, n, r, i, a, o = 0, s = 0.5, c = 1) {
      if (this.n >= this.cap || Fl.on) return;
      let l = this.n++,
        u = this.tmp.set(i);
      ((this.A[l * 4] = e),
        (this.A[l * 4 + 1] = t),
        (this.A[l * 4 + 2] = n),
        (this.A[l * 4 + 3] = r * this.visualScale),
        (this.B[l * 4] = u.r),
        (this.B[l * 4 + 1] = u.g),
        (this.B[l * 4 + 2] = u.b),
        (this.B[l * 4 + 3] = c * (Fl.own ? Fl.ownFade : this.fade)),
        (this.C[l * 4] = a),
        (this.C[l * 4 + 1] = o),
        (this.C[l * 4 + 2] = s));
    }
    end() {
      ((this.mesh.count = this.n), (this.mesh.visible = this.n > 0));
      for (let e of [this.aA, this.aB, this.aC])
        (e.clearUpdateRanges(), e.addUpdateRange(0, this.n * 4), (e.needsUpdate = !0));
    }
  },
  Jl = new Map();
function Yl(e, t) {
  if (t !== `m1` && t !== `m2`) return 0;
  let n = e * 2 + +(t === `m2`),
    r = Jl.get(n);
  if (r === void 0) {
    let i = Ee(e, t);
    ((r = i ? al[i.style] + 16 * qc(i.pal) : 0), Jl.set(n, r));
  }
  return r;
}
var Xl = (e, t) => (t === `classic` ? Qc + e : e),
  Zl = (e) => parseInt(e.slice(1), 16),
  Ql = (e) => e[Math.floor(Math.random() * e.length)],
  $l = [16743128, 8050943, 16773754, 10158e3, 12622591];
function eu(e, t, n, r, i, a, o, s = 1.6) {
  if (n !== `m1` && n !== `m2`) return;
  let c = Ae(t, n === `m1` ? 1 : 2);
  if (!c) return;
  let l = (e) => Math.random() < e * o,
    u = r + (Math.random() - 0.5) * 1.2,
    d = a + (Math.random() - 0.5) * 1.2,
    f = i + 0.2 + Math.random() * s,
    p = c.pal.map(Zl);
  switch (c.style) {
    case `magma`:
      l(5) &&
        e.spawn({
          x: u,
          y: i + 0.3 + Math.random() * s * 0.6,
          z: d,
          vy: 1.3,
          vx: (Math.random() - 0.5) * 0.4,
          life: 0.9,
          size: 0.28,
          endSize: 0,
          color: Ql([p[2], p[3]]),
          shape: I.Spark,
          glow: 1,
        });
      break;
    case `crystal`:
      l(3.5) &&
        e.spawn({
          x: u,
          y: f,
          z: d,
          vy: -0.25,
          life: 0.8,
          size: 0.4,
          endSize: 0,
          color: Ql([16777215, p[2], p[3]]),
          shape: Ql([I.Twinkle, I.Flake]),
          glow: 1,
          spin: 3,
        });
      break;
    case `galaxy`:
      l(4) &&
        e.spawn({
          x: u,
          y: f,
          z: d,
          vy: 0.2,
          life: 0.9,
          size: 0.36,
          endSize: 0,
          color: Ql([16777215, p[3], p[2]]),
          shape: I.Twinkle,
          glow: 1,
          spin: 2,
        });
      break;
    case `flame`:
      l(5) &&
        e.spawn({
          x: u,
          y: i + 0.3 + Math.random() * s * 0.5,
          z: d,
          vy: 1.4,
          life: 0.6,
          size: 0.5,
          endSize: 0,
          color: Ql([p[2], p[3]]),
          shape: I.Flame,
          glow: 0.8,
        });
      break;
    case `aurora`:
      l(3) &&
        e.spawn({
          x: u,
          y: f,
          z: d,
          vy: 0.5,
          life: 1.2,
          size: 0.6,
          endSize: 0,
          color: Ql([p[1], p[2]]),
          shape: I.Soft,
          glow: 0.7,
        });
      break;
    case `neon`:
      l(4) &&
        e.spawn({
          x: u,
          y: f,
          z: d,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.3) * 2,
          vz: (Math.random() - 0.5) * 3,
          life: 0.3,
          size: 0.3,
          endSize: 0,
          color: Ql([p[1], p[2]]),
          shape: I.Spark,
          glow: 1,
          drag: 4,
        });
      break;
    case `holo`:
      l(3.5) &&
        e.spawn({
          x: u,
          y: f,
          z: d,
          vy: 0.4,
          life: 0.6,
          size: 0.4,
          endSize: 0,
          color: Ql($l),
          shape: I.Twinkle,
          glow: 1,
          spin: 4,
        });
      break;
    case `metal`:
      l(1.5) &&
        e.spawn({
          x: u,
          y: f,
          z: d,
          life: 0.4,
          size: 0.4,
          endSize: 0,
          color: Ql([16777215, p[3]]),
          shape: I.Twinkle,
          glow: 1,
          spin: 5,
        });
      break;
    case `shadow`:
      l(3) &&
        e.spawn({
          x: u,
          y: i + 0.2 + Math.random() * s * 0.5,
          z: d,
          vy: 0.6,
          life: 1,
          size: 0.8,
          endSize: 1.3,
          color: p[1],
          shape: I.PixPuff,
          glow: 0,
        });
  }
}

export {
  Ol as Random,
  I,
  F as random,
  vl,
  L,
  bl,
  Sl,
  wl,
  El,
  Ll,
  Fl,
  ql,
  Xl,
  eu,
  _l,
  Hl,
  Yl,
  kl,
  Il,
  Kl,
  comboFaces,
  ComboRoller,
  EffectiveCallout,
  Nl
};
