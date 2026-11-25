import {FC, MC, NC} from "../combat/boss-actors.js";
import {Dt as ee, Lt as Ee, h as Zt, _n as wt} from "../data/config.js";
import {_l} from "../effects/battle-particles.js";
import {Tc} from "../actors/sprite-assets.js";
import {glyphPreview} from "../actors/zixing-glyphs.js";
import {glyphText, glyphSpeciesFromImage} from "../data/zixing-identity.js";
import {gameAudio as N} from "../combat/game-audio.js";
import {typeColors as Ni, typeNames as Pi, gameData as k} from "../data/game-database.js";
import {wx} from "../combat/upgrade-offers.js";
import {altarChargeSeconds, bossSummonUnlockSeconds, facilityIconFile, facilityNames} from "../data/active-content.js";
import {zoneDuration} from "../data/lite-rules.js";
import {paperIcon} from "./zixing-ui.js";
import {chineseText as c} from "../data/chinese-text.js";
import {BS} from "../world/facilities.js";

var IC = (e) => FC[e ?? `normal`],
  LC = null;
function RC(e, t) {
  if (t !== `m1` && t !== `m2`) return;
  let n = Ee(e, t);
  if (n) return n;
  if (!LC) {
    LC = new Map();
    for (let e of ee) LC.has(MC(e.member)) || LC.set(MC(e.member), e.member);
  }
  let r = LC.get(MC(e));
  return r ? Ee(r, t) : void 0;
}
var zC = (e) => (e ? `lk-fx lk-fx-` + e.style : ``),
  BC = new Map(),
  VC = (e) => e.member + `:` + e.n;
function HC(e, t, n) {
  let [r, i, a, o] = t,
    s = document.createElement(`canvas`);
  ((s.width = a), (s.height = o));
  let c = s.getContext(`2d`, { willReadFrequently: !0 });
  if (!c) return null;
  c.drawImage(e, r, i, a, o, 0, 0, a, o);
  try {
    let e = c.getImageData(0, 0, a, o);
    (_l(e, n.style, n.pal, 0), c.putImageData(e, 0, 0));
  } catch {
    return null;
  }
  return s;
}
function UC(e, t) {
  let n = `p` + e + `|` + VC(t),
    r = BC.get(n);
  return (
    r ||
      ((r = new Promise((n) =>
        Tc(
          Zt(`portraits/${e}.png`),
          (e) => {
            let r = HC(e, [0, 0, e.naturalWidth, e.naturalHeight], t);
            n(r ? r.toDataURL() : null);
          },
          void 0,
          () => n(null),
        ),
      )),
      BC.set(n, r)),
    r
  );
}
function WC(e = ``) {
  let t = document.createElement(`img`);
  return ((t.className = `pix` + e), (t.alt = ``), (t.draggable = !1), t);
}
function GC(e, t, n = e) {
  return glyphPreview(e,.75);
}
function KC(e, t, n = 3, r = `idle`, i = e) {
  return glyphPreview(e,n);
}
var qC = { stone: [-2, 0] };
function JC(e, t) {
  let n = RC(t, e);
  if (!n) return null;
  let r = WC(` av-frame`);
  r.src = Zt(`ui/frames/look-${n.style}.png`);
  let i = qC[n.style];
  return (
    i && (r.style.setProperty(`--fx`, String(i[0] / 160)), r.style.setProperty(`--fy`, String(i[1] / 160))),
    (r.onerror = () => {
      ((r.onerror = null), r.remove());
    }),
    r
  );
}
function X(e, t = {}, ...n) {
  const species=e===`img`?glyphSpeciesFromImage(t.src):null;
  let r = species===null?document.createElement(e):glyphPreview(species,.75,t.class||`pix`);
  if(species!==null){t={...t};delete t.src;delete t.class;delete t.onerror;}

  for (let [e, n] of Object.entries(t))
    if (n != null && n !== !1) {
      if (e === `class`) r.className = n;
      else if (e === `style` && typeof n == `object`)
        for (let [e, t] of Object.entries(n))
          e.startsWith(`--`) ? r.style.setProperty(e, String(t)) : (r.style[e] = t);
      else if (e.startsWith(`on`) && typeof n == `function`) {
        let t = e.slice(2).toLowerCase();
        t === `click`
          ? r.addEventListener(`click`, (e) => {
              (N.click(), n(e));
            })
          : r.addEventListener(t, n);
      } else e === `html` ? (r.innerHTML = n) : r.setAttribute(e, String(n));
    }
  for (let e of n)
    e != null && e !== !1 && r.append(e instanceof Node ? e : document.createTextNode(glyphText(String(e))));
  return (e === `button` && r.addEventListener(`mouseenter`, () => N.hover()), r);
}
var YC = (e) => `#` + e.toString(16).padStart(6, `0`);
function XC(e) {
  return X(`span`, { class: `chip`, style: { background: YC(Ni[e]) } }, Pi[e]);
}
function ZC(e, t) {
  let n = X(
    `div`,
    { class: `typeicon` },
    X(`img`, { class: `pix`, src: Zt(`ui/types/${e}.png`), alt: Pi[e], draggable: `false` }),
  );
  return (t && (n.style.width = n.style.height = t + `px`), n);
}
function Z(e, t = 20) {
  return X(`img`, {
    class: `pix uiicon`,
    src: Zt(`ui/icons/${e}.png`),
    alt: ``,
    draggable: `false`,
    style: { width: t + `px`, height: t + `px`, verticalAlign: `middle` },
  });
}
function QC(e, t = 24) {
  return X(`img`, {
    class: `pix uiicon`,
    src: Zt(`ui/ranks/${wt[e - 1].id}.png`),
    alt: wt[e - 1].name,
    title: wt[e - 1].name,
    draggable: `false`,
    style: { width: t + `px`, height: t + `px`, verticalAlign: `middle` },
  });
}
function $C(e, t, n, r = 48, i) {
  let [a, o] = (e ?? ``).split(`:`),
    s = a === `mon` ? parseInt(o, 10) : n,
    c = a === `mon` ? /([scab])$/.exec(o ?? ``)?.[1] : void 0,
    l =
      c && s
        ? { member: s, look: { s: `shiny`, c: `classic`, a: `m1`, b: `m2` }[c] }
        : !a && s
          ? NC(i, s)
          : null,
    u = l
      ? GC(s, l.look, l.member)
      : a === `tr`
        ? X(`img`, { class: `pix`, src: Zt(`ui/avatars/${o}.png`), alt: ``, draggable: `false` })
        : s
          ? rw(s)
          : Q(`poke-ball`),
    d = X(
      `span`,
      { class: `av` + (t ? ` framed` : ``) + (a === `tr` ? ` tr` : ``), style: { "--s": r + `px` } },
      X(`span`, { class: `av-pic` }, u),
    );
  if (t) {
    let e = X(`img`, { class: `av-frame`, src: Zt(`ui/frames/${t}.png`), alt: ``, draggable: `false` }),
      n = ew[t];
    (n && (e.style.setProperty(`--fx`, String(n[0] / 160)), e.style.setProperty(`--fy`, String(n[1] / 160))),
      d.append(e));
  }
  return d;
}
var ew = {
  dex: [0, 2],
  master: [0, 4],
  "mon-ace": [0, -11],
  "mon-master": [0, -15],
  top10: [0, 1.5],
  top100: [0, 2],
  top25: [0, 1],
  "type-dragon": [0, -2],
  "type-electric": [0, 3.5],
  "type-fighting": [0, 1],
  "type-fire": [0, 1.5],
  "type-flying": [0, 2.5],
  "type-ghost": [0, -1.5],
  "type-grass": [-4, 1.5],
  "type-ground": [-1, 0.5],
  "type-ice": [0, 1.5],
  "type-poison": [0, -5],
  "type-psychic": [0, 1],
  "type-rock": [0, 1],
  "type-steel": [0, -4],
  "type-water": [1, 4],
  candle: [0, 1.5],
  spectral: [0, 1],
  tower: [0, 3],
  "look-stone": [-2, 0],
};
function Q(e, t = `pix`, iconFile = k.items[e]?.icon || `items/${e}.png`) {
  let n = X(`img`, {
    class: t,
    src: Zt(iconFile),
    alt: ``,
    draggable: `false`,
  });
  return (
    (n.onerror = () => {
      ((n.onerror = null), (n.src = Zt(`items/poke-ball.png`)));
    }),
    n
  );
}
function tw(e, t = `pix`) {
  return glyphPreview(e,.75,t);
}
function nw(e, t = `pix`) {
  return glyphPreview(e,.75,t);
}
function rw(e) {
  return glyphPreview(e,.75);
}
function iw(e, t = 3, n = `idle`) {
  return glyphPreview(e,t);
}
var aw = [`var(--r0)`, `var(--r1)`, `var(--r2)`, `var(--r3)`, `var(--r4)`];
function $(e) {
  for (; e.firstChild; ) e.removeChild(e.firstChild);
  return e;
}
function ow(e, ...t) {
  for (let n of t) n != null && n !== !1 && e.append(n);
  return e;
}
var sw = null,
  cw = null,
  lw = !1;
function uw() {
  (sw?.remove(), (sw = cw = null));
}
function dw(e, t) {
  if ((uw(), !e.isConnected)) return;
  cw = e;
  let n = (sw = X(`div`, { class: `tt`, role: `tooltip` }, t()));
  document.body.append(n);
  let r = e.getBoundingClientRect(),
    i = n.getBoundingClientRect(),
    a = r.top - i.height - 10,
    o = a < 8;
  o && (a = r.bottom + 10);
  let s = o && a + i.height > innerHeight - 8,
    c = innerWidth - r.right - 10 - 8,
    l = r.left - 10 - 8;
  if (s && Math.max(c, l) >= i.width) {
    let t = c >= i.width && (l < i.width || r.left + r.width / 2 >= innerWidth / 2);
    ((n.style.left = (t ? r.right + 10 : r.left - 10 - i.width) + `px`),
      (n.style.top =
        Math.max(8, Math.min(innerHeight - i.height - 8, r.top + r.height / 2 - i.height / 2)) + `px`),
      fw(e, n));
  } else
    ((n.style.left =
      Math.max(8, Math.min(innerWidth - i.width - 8, r.left + r.width / 2 - i.width / 2)) + `px`),
      (n.style.top = Math.max(8, Math.min(innerHeight - i.height - 8, a)) + `px`),
      n.classList.toggle(`below`, o),
      fw(e, n));
}
function fw(e, t) {
  let n = () => {
    sw === t && (e.isConnected ? requestAnimationFrame(n) : uw());
  };
  requestAnimationFrame(n);
}
function pw(e, t, n = !1) {
  lw ||
    ((lw = !0),
    addEventListener(
      `pointerdown`,
      (e) => {
        cw && !cw.contains(e.target) && uw();
      },
      !0,
    ),
    addEventListener(`wheel`, uw, { passive: !0 }),
    addEventListener(`scroll`, uw, { capture: !0, passive: !0 }),
    addEventListener(`keydown`, (e) => {
      e.key === `Escape` && uw();
    }));
  let r = 0;
  (e.addEventListener(`pointerenter`, (n) => {
    n.pointerType === `mouse` && dw(e, t);
  }),
    e.addEventListener(`pointerleave`, (t) => {
      t.pointerType === `mouse` && cw === e && uw();
    }));
  let i = !1;
  e.addEventListener(`pointerdown`, (n) => {
    n.pointerType !== `mouse` &&
      ((i = !1),
      (r = window.setTimeout(() => {
        ((i = !0), dw(e, t));
      }, 380)));
  });
  for (let t of [`pointerup`, `pointercancel`]) e.addEventListener(t, () => clearTimeout(r));
  return (
    n &&
      e.addEventListener(`click`, (n) => {
        n.pointerType !== `mouse` && (i ? (i = !1) : cw === e ? uw() : dw(e, t));
      }),
    e.addEventListener(`focus`, () => {
      // Native touch controls open their own detail view. Keyboard focus can show a web tooltip.
      if (typeof wx === "undefined" && globalThis.CSS?.supports?.("selector(:focus-visible)") && e.matches(":focus-visible")) dw(e, t);
    }),
    e.addEventListener(`blur`, () => {
      cw === e && uw();
    }),
    e
  );
}
var mw = 7500,
  hw = 2500,
  gw = 0.4,
  _w = {
    ball: {
      letter: `b`,
      kind: 'chest',
      text: () => `碰到红骰子即可按标价抽取道具。`,
    },
    freeball: {
      letter: 'u',
      kind: 'freechest',
      text: () => `碰到蓝骰子即可免费抽取一件道具。`,
    },
    altar: {
      letter: `a`,
      kind: 'altar',
      text: () => `在多肉的光圈内停留 ${altarChargeSeconds} 秒，即可选择祝福。`,
    },
    shop: {
      letter: `s`,
      icon: () => paperIcon('coin', 26, '#a47638'),
      title: () => c(`Tienda de Meowth`),
      text: () => `靠近商店即可选购道具。`,
    },
    guardian: {
      letter: `g`,
      kind: 'boss',
      text: run => run?.terrain?.bossSite ? '靠近计时装置即可召唤龘。'
        : `满 ${bossSummonUnlockSeconds(run) / 60} 分钟后，靠近装置即可召唤龘。满 ${zoneDuration() / 60} 分钟时，龘会自动现身。`,
    },
    alpha: {
      letter: `f`,
      icon: () => paperIcon('target', 26, '#b87054'),
      title: () => c(`Pokémon Alfa`),
      text: () =>
        c(
          `Es enorme y duro, pero vale la pena: al debilitarlo podrás lanzarle una Amigo Ball para que luche contigo, o soltará un premio.`,
        ),
    },
    portal: {
      letter: `p`,
      kind: 'portal',
      text: () => `靠近门即可前往下一区域或通关。`,
    },
    egg: {
      letter: `e`,
      kind: 'nest',
      text: () => `靠近即可带上弹珠，击败敌人即可释放伙伴。`,
    },
    level: {
      letter: `l`,
      icon: () => paperIcon('book', 26, '#607da0'),
      title: () => c(`Subida de nivel`),
      text: () => '选择一项强化，在本局中持续生效。',
    },
  },
  vw = {
    chest: [`ball`, 16],
    freechest: ['freeball', 16],
    cursedchest: [`ball`, 16],
    altar: [`altar`, 18],
    meowth: [`shop`, 18],
    boss: [`guardian`, 22],
    shrine: [`guardian`, 22],
    portal: [`portal`, 14],
    nest: [`egg`, 16],
  },
  yw = class {
    meta;
    on;
    seen;
    el = null;
    timers = [];
    scanT = 0;
    busyUntil = 0;
    queued = null;
    site = null;
    constructor(e) {
      this.meta = e;
      let t = e.profile;
      ((this.on = t.settings.tips !== !1 && (t.counters.runs ?? 0) < 3),
        (this.seen = new Set((t.settings.hintsSeen ?? ``).split(``))));
    }
    tick(e, t) {
      if (!this.on || e.state !== 'play' || (this.scanT -= t) > 0) return;
      this.scanT = gw;
      let nearest = null, hint = null, best = Infinity;
      for (const facility of e.interactables.list) {
        const entry = vw[BS(facility)];
        if (!entry || facility.used || !e.interactables.hasVisual(facility)) continue;
        const distance = Math.hypot(facility.x - e.player.pos.x, facility.z - e.player.pos.z);
        if (distance < entry[1] && distance < best) {
          nearest = facility;
          hint = entry[0];
          best = distance;
        }
      }
      if (this.site && this.site !== nearest) {
        this.el?.remove();
        this.el = this.site = null;
        this.busyUntil = 0;
      }
      if (this.queued && performance.now() >= this.busyUntil) {
        const event = this.queued;
        this.queued = null;
        this.show(event,null,e);
      }
      if (nearest) this.show(hint, nearest, e);
      if (nearest?.kind === 'boss' && this.site === nearest && this.el?.parentNode) {
        const title = this.el.querySelector('.zx-hint-title');
        const caption = facilityNames.boss + ' · ' + e.interactables.label(nearest);
        if (title.textContent !== caption) title.textContent = caption;
      }
    }
    show(e, site = null, run = null) {
      if (!this.on) return;
      let t = _w[e];
      if (this.seen.has(t.letter)) return;
      if (performance.now() < this.busyUntil) {
        if (!site) this.queued ??= e;
        return;
      }
      this.seen.add(t.letter);
      this.site = site;
      let n = this.meta.profile.settings;
      ((n.hintsSeen = [...this.seen].join(``)), this.meta.save(), this.el?.remove());
      let r = X(
        `div`,
        { class: 'run-hint zx-hint', 'aria-live': 'polite', 'data-kind': t.kind ?? e },
        X('div', { class: 'zx-hint-art' }, t.kind
          ? X('img', {src: Zt(facilityIconFile(t.kind)), alt: '', draggable: 'false'})
          : t.icon()),
        X('div', {class: 'zx-hint-copy'},
          X('b', {class: 'zx-hint-title'}, t.kind ? facilityNames[t.kind] : t.title()),
          X('span', {class: 'zx-hint-text'}, t.text(run))),
      );
      ((document.querySelector('.zx-hint-slot') ?? document.body).append(r),
        (this.el = r),
        (this.busyUntil = performance.now() + mw + hw),
        this.timers.push(
          window.setTimeout(() => r.classList.add(`out`), mw),
          window.setTimeout(() => {
            r.remove();
            if (this.el === r) this.el = this.site = null;
          }, 7900),
        ));
    }
    dispose() {
      for (let e of this.timers) clearTimeout(e);
      ((this.timers = []), this.el?.remove(), (this.el = null), (this.on = !1));
    }
  },
  bw = {
    mud: {
      cell: 0,
      name: () => c(`Charca de barro`),
      say: () => c(`¡Terreno hostil! Una charca de barro frena a todo el que la pisa`),
      color: 9067050,
      slow: 0.55,
      pull: 0,
      hurt: 0,
      bite: 0,
    },
    bramble: {
      cell: 1,
      name: () => c(`Zarzal venenoso`),
      say: () => c(`¡Terreno hostil! Un zarzal venenoso pincha a todo el que lo cruza`),
      color: 11553496,
      slow: 0.8,
      pull: 0,
      hurt: 0.025,
      bite: 0.05,
      type: `poison`,
      status: `poison`,
    },
    quicksand: {
      cell: 2,
      name: () => c(`Arenas movedizas`),
      say: () => c(`¡Terreno hostil! Unas arenas movedizas tragan a todo lo que se acerca`),
      color: 14200928,
      slow: 0.5,
      pull: 2.4,
      hurt: 0,
      bite: 0,
    },
    fire: {
      cell: 3,
      name: () => c(`Suelo en llamas`),
      say: () => c(`¡Terreno hostil! El suelo arde: no te quedes encima`),
      color: 16738842,
      slow: 1,
      pull: 0,
      hurt: 0.03,
      bite: 0.07,
      type: `fire`,
      status: `burn`,
    },
  };

export {
  bw,
  yw,
  X as createElement,
  Z,
  Q,
  $,
  YC,
  ZC,
  uw,
  pw,
  rw,
  aw,
  XC,
  $C,
  GC,
  ow,
  QC,
  tw
};
