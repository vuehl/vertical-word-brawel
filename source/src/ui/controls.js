import {chineseText as c} from "../data/chinese-text.js";

var Fi = new Set([`reroll`, `skip`, `banish`]),
  Ii = new Set([`KeyR`, `KeyS`, `KeyB`]),
  Li = (e, t) => Fi.has(e) === Fi.has(t),
  Ri = {
    up: `KeyW`,
    down: `KeyS`,
    left: `KeyA`,
    right: `KeyD`,
    jump: `Space`,
    dash: `ShiftLeft`,
    interact: `KeyE`,
    ult: `KeyR`,
    lock: `Mouse2`,
    aim: `KeyQ`,
    autorun: `KeyT`,
    map: `KeyM`,
    pause: `KeyP`,
    reroll: `KeyF`,
    skip: `KeyX`,
    banish: `KeyZ`,
  },
  zi = [
    `up`,
    `down`,
    `left`,
    `right`,
    `jump`,
    `dash`,
    `interact`,
    `ult`,
    `lock`,
    `aim`,
    `autorun`,
    `map`,
    `pause`,
    `reroll`,
    `skip`,
    `banish`,
  ],
  Bi = {
    jump: 0,
    dash: 1,
    interact: 2,
    ult: 3,
    lock: 5,
    aim: 4,
    confirm: 0,
    back: 1,
    reroll: 2,
    skip: 3,
    banish: 5,
  },
  Vi = [`jump`, `dash`, `interact`, `ult`, `lock`, `aim`, `confirm`, `back`, `reroll`, `skip`, `banish`],
  Hi = new Set([9, 12, 13, 14, 15]),
  Ui = new Set([`Escape`, `Enter`, `NumpadEnter`, `Tab`, `Digit1`, `Digit2`, `Digit3`, `Digit4`]),
  Wi = {},
  Gi = {},
  Ki = [];
function qi(e) {
  Ki.push(e);
}
function Ji(e, t) {
  let n = JSON.stringify([Wi, Gi]);
  ((Wi = {}), (Gi = {}));
  for (let t of zi) {
    let n = e?.[t];
    typeof n == `string` && n && n !== Ri[t] && n.length < 24 && (Wi[t] = n);
  }
  for (let e of zi) {
    if (!Fi.has(e)) continue;
    let t = Wi[e];
    t && (Ii.has(t) || zi.some((n) => n !== e && Fi.has(n) && !Wi[n] && Ri[n] === t)) && delete Wi[e];
  }
  for (let e of Vi) {
    let n = t?.[e];
    Number.isInteger(n) && n >= 0 && n < 17 && n !== Bi[e] && !Hi.has(n) && (Gi[e] = n);
  }
  if (JSON.stringify([Wi, Gi]) !== n) for (let e of Ki) e();
}
function Yi() {
  return {
    keys: Object.keys(Wi).length ? { ...Wi } : void 0,
    pad: Object.keys(Gi).length ? { ...Gi } : void 0,
  };
}
var Xi = (e) => Wi[e] ?? Ri[e],
  Zi = (e) => Gi[e] ?? Bi[e];
function Qi(e, t) {
  let n = Xi(e),
    r = zi.find((n) => n !== e && Li(n, e) && Xi(n) === t);
  (r && (Wi[r] = n), (Wi[e] = t));
  for (let e of zi) Wi[e] === Ri[e] && delete Wi[e];
  for (let e of Ki) e();
  return !0;
}
function $i(e, t) {
  let n = Zi(e),
    r = (e) => (e === `confirm` || e === `back` ? 1 : Fi.has(e) ? 2 : 0),
    i = Vi.find((n) => n !== e && Zi(n) === t && r(n) === r(e));
  (i && (Gi[i] = n), (Gi[e] = t));
  for (let e of Vi) Gi[e] === Bi[e] && delete Gi[e];
  for (let e of Ki) e();
}
function ea(e) {
  if (e === `Mouse1`) return c(`Rueda`);
  if (e === `Mouse2`) return c(`Clic der.`);
  if (e === `Mouse3`) return c(`Ratón 4`);
  if (e === `Mouse4`) return c(`Ratón 5`);
  if (e === `Space`) return c(`Espacio`);
  if (e === `Enter` || e === `NumpadEnter`) return c(`Intro`);
  let t = /^Key([A-Z])$/.exec(e);
  return t || ((t = /^Digit(\d)$/.exec(e)), t)
    ? t[1]
    : ((t = /^Numpad(\d)$/.exec(e)),
      t
        ? `Num ` + t[1]
        : ({
            ShiftLeft: `Shift`,
            ShiftRight: `Shift`,
            ControlLeft: `Ctrl`,
            ControlRight: `Ctrl`,
            AltLeft: `Alt`,
            AltRight: `Alt Gr`,
            ArrowUp: `↑`,
            ArrowDown: `↓`,
            ArrowLeft: `←`,
            ArrowRight: `→`,
            Backquote: "`",
            Minus: `-`,
            Equal: `=`,
            BracketLeft: `[`,
            BracketRight: `]`,
            Semicolon: `;`,
            Quote: `'`,
            Backslash: `\\`,
            Comma: `,`,
            Period: `.`,
            Slash: `/`,
            CapsLock: `Caps`,
            Backspace: `Backspace`,
            Insert: `Ins`,
            Delete: `Del`,
            PageUp: `PgUp`,
            PageDown: `PgDn`,
          }[e] ?? e));
}
var ta = (e) => ea(Xi(e)),
  na = [
    `A`,
    `B`,
    `X`,
    `Y`,
    `LB`,
    `RB`,
    `LT`,
    `RT`,
    `Select`,
    `Start`,
    `L3`,
    `R3`,
    `↑`,
    `↓`,
    `←`,
    `→`,
    `Home`,
  ],
  ra = (e) => na[e] ?? String(e),
  ia = (e) => ra(Zi(e));
function aa(e, t, n) {
  return t === n
    ? e
    : e.replace(
        RegExp(`(^|[^\\p{L}\\p{N}])${t.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`)}(?![\\p{L}\\p{N}])`, `u`),
        `$1${n}`,
      );
}
var oa = 4,
  sa = 5,
  ca = 6,
  la = 7,
  ua = 8,
  da = 9,
  fa = 12,
  pa = 13,
  ma = 14,
  ha = 15,
  ga = { jump: `Space`, dash: `ShiftLeft`, interact: `KeyE`, ult: `KeyR`, aim: `KeyQ` },
  _a = new Map();
function va() {
  let e = new Map([
    [ca, `dash`],
    [la, `ult`],
  ]);
  for (let t of [`jump`, `dash`, `interact`, `ult`, `lock`, `aim`]) e.set(Zi(t), t);
  let t = Zi(`confirm`);
  (t !== Zi(`jump`) && !e.has(t) && !Hi.has(t) && e.set(t, `interact`), (_a = e));
}
(va(), qi(va));
var ya = 0.15,
  ba = 0.19;
function xa(e) {
  ((ya = Math.max(0.05, Math.min(0.4, Number.isFinite(e) ? e : 0.15))), (ba = Math.min(0.5, ya + 0.04)));
}
var Sa = 0.6,
  Ca = 2.8,
  wa = 0.38,
  Ta = 0.13,
  Ea = 0.6,
  Da = !1,
  Oa = !0;
function ka(e) {
  Oa = e;
}
var Aa = null,
  ja = -1e9,
  Ma = 0;
function Na(e, t = 120) {
  if (!Oa || !Da || document.hidden) return;
  let n = performance.now();
  if (n < Ma || n - ja < 450 || e < 0.2) return;
  ((t = Math.min(t, 350)), (ja = n), (Ma = n + t + 60));
  let r = Aa?.vibrationActuator;
  try {
    r?.playEffect?.(`dual-rumble`, {
      duration: t,
      strongMagnitude: Math.min(1, e),
      weakMagnitude: Math.min(1, e * 0.7),
    })?.catch(() => {});
  } catch {}
}
function Pa(e) {
  return ia(e === `E` ? `interact` : `ult`);
}
var Fa = [],
  Ia = null;
function La(e) {
  return (
    Fa.push(e),
    () => {
      let t = Fa.indexOf(e);
      t >= 0 && Fa.splice(t, 1);
    }
  );
}
function Ra(e) {
  if (e !== Da) {
    if (
      ((Da = e),
      document.documentElement.classList.toggle(`pad`, e),
      e || qa(null),
      Ba(),
      Ia?.disconnect(),
      (Ia = null),
      e)
    ) {
      let e = !1;
      ((Ia = new MutationObserver(() => {
        e ||
          ((e = !0),
          requestAnimationFrame(() => {
            ((e = !1), Ba());
          }));
      })),
        Ia.observe(document.body, { childList: !0, subtree: !0 }));
    }
    for (let e of Fa) e();
  }
}
function za(e) {
  for (let [t, n] of [
    [`interact`, `interact`],
    [`ult`, `ult`],
    [`dash`, `dash`],
    [`jump`, `jump`],
    [`aim`, `aim`],
    [`lock`, `lock`],
  ])
    if (e === ta(t)) return ia(n);
  return e === `Esc`
    ? ia(`back`)
    : e === `Enter` || e === `Intro` || e === c(`Intro`)
      ? ia(`confirm`)
      : e === `V`
        ? ``
        : null;
}
function Ba() {
  for (let e of document.querySelectorAll(`kbd:not([data-nokbd])`))
    if (Da) {
      let t = e.dataset.k ?? e.textContent ?? ``,
        n = za(t.trim());
      if (n === null) continue;
      (e.dataset.k === void 0 && (e.dataset.k = t), e.textContent !== n && (e.textContent = n));
      let r = n ? `` : `none`;
      e.style.display !== r && (e.style.display = r);
    } else
      e.dataset.k !== void 0 && ((e.textContent = e.dataset.k), (e.style.display = ``), delete e.dataset.k);
}
var Va = null,
  Ha = !1;
function Ua(e) {
  return (
    (Va = e),
    (Ha = !1),
    () => {
      Va === e && (Va = null);
    }
  );
}
function Ga(e) {
  let t = Ka;
  if (t instanceof HTMLInputElement && t.type === `range` && (e === `left` || e === `right`)) {
    let n = Number(t.step) || 1,
      r = Math.min(Number(t.max), Math.max(Number(t.min), Number(t.value) + (e === `right` ? n : -n)));
    ((t.value = String(r)),
      t.dispatchEvent(new Event(`input`, { bubbles: !0 })),
      t.dispatchEvent(new Event(`change`, { bubbles: !0 })));
    return;
  }
  if (t instanceof HTMLSelectElement && (e === `left` || e === `right`)) {
    ((t.selectedIndex = Math.max(
      0,
      Math.min(t.options.length - 1, t.selectedIndex + (e === `right` ? 1 : -1)),
    )),
      t.dispatchEvent(new Event(`change`, { bubbles: !0 })));
    return;
  }
  if (!t || !t.isConnected || !Za(t)) {
    qa($a());
    return;
  }
  let n = eo(t, e);
  n && qa(n);
}
var Ka = null;
function qa(e) {
  if (Ka !== e && (Ka?.classList.remove(`pad-focus`), (Ka = e), e)) {
    e.classList.add(`pad-focus`);
    try {
      e.focus({ preventScroll: !0 });
    } catch {}
    e.scrollIntoView({ block: `nearest`, inline: `nearest`, behavior: `smooth` });
  }
}
var Ja = `button, a[href], input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])`;
function Ya(e) {
  if (e.disabled) return !1;
  let t = e.getBoundingClientRect();
  return t.width > 2 && t.height > 2;
}
var Xa = [
  [0.5, 0.5],
  [0.5, 0.8],
  [0.5, 0.2],
  [0.2, 0.5],
  [0.8, 0.5],
];
function Za(e) {
  if (!Ya(e) || e.closest(`[aria-hidden="true"], .rotate-hint`)) return !1;
  let t = e.getBoundingClientRect();
  for (let [n, r] of Xa) {
    let i = t.left + t.width * n,
      a = t.top + t.height * r;
    if (i < 0 || a < 0 || i >= innerWidth || a >= innerHeight) continue;
    let o = document.elementFromPoint(i, a);
    if (o && (o === e || e.contains(o) || o.contains(e))) return !0;
  }
  let n = to(e);
  if (!n || n === document.scrollingElement) return !1;
  let r = n.getBoundingClientRect(),
    i = document.elementFromPoint(
      Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)),
      Math.min(innerHeight - 1, Math.max(0, r.top + Math.min(r.height, 40) / 2)),
    );
  return !!i && (n === i || n.contains(i));
}
function Qa() {
  let e = new Set();
  for (let t of document.body.querySelectorAll(Ja)) t.closest(`.switch[tabindex="-1"]`) || e.add(t);
  for (let t of document.body.querySelectorAll(`div, span, li, img, label, i`)) {
    if (getComputedStyle(t).cursor !== `pointer`) continue;
    let n = t.parentElement;
    (n && getComputedStyle(n).cursor === `pointer`) || e.add(t);
  }
  return [...e]
    .filter((t) => {
      for (let n = t.parentElement; n; n = n.parentElement) if (e.has(n)) return !1;
      return !0;
    })
    .filter(Za);
}
function $a() {
  let e = Qa();
  return e.length
    ? (e.find((e) => e.matches(`.cards .card`)) ??
        e.find((e) => e.matches(`.btn.green, .btn.big, .play-btn`)) ??
        e.find((e) => e.closest(`.modal, .season-modal`)) ??
        e[0])
    : null;
}
function eo(e, t) {
  let n = e.getBoundingClientRect(),
    r = n.left + n.width / 2,
    i = n.top + n.height / 2,
    a = null,
    o = 1 / 0;
  for (let s of Qa()) {
    if (s === e) continue;
    let c = s.getBoundingClientRect(),
      l = c.left + c.width / 2,
      u = c.top + c.height / 2,
      d = t === `left` || t === `right`,
      f = t === `right` ? l - r : t === `left` ? r - l : t === `down` ? u - i : i - u;
    if (f <= 4) continue;
    let p = d
        ? Math.min(n.bottom, c.bottom) - Math.max(n.top, c.top)
        : Math.min(n.right, c.right) - Math.max(n.left, c.left),
      m = Math.abs(d ? u - i : l - r);
    if (p <= 0 && m > f * 2) continue;
    let h = f + m * (p > 0 ? 0.3 : 2.5);
    h < o && ((o = h), (a = s));
  }
  return a;
}
function to(e) {
  for (let t = e?.parentElement ?? null; t; t = t.parentElement) {
    let e = getComputedStyle(t).overflowY;
    if ((e === `auto` || e === `scroll`) && t.scrollHeight > t.clientHeight + 4) return t;
  }
  return null;
}
function no(e) {
  if (
    e instanceof HTMLInputElement &&
    (e.type === `text` || e.type === `search` || e.type === `email` || e.type === `password`)
  ) {
    e.focus();
    return;
  }
  if (e instanceof HTMLSelectElement) {
    e.focus();
    try {
      e.showPicker?.();
    } catch {}
    return;
  }
  if (e instanceof HTMLTextAreaElement) {
    e.focus();
    return;
  }
  let t = e.getBoundingClientRect(),
    n = {
      bubbles: !0,
      cancelable: !0,
      clientX: t.left + t.width / 2,
      clientY: t.top + t.height / 2,
      pointerType: `mouse`,
    };
  (e.dispatchEvent(new PointerEvent(`pointerdown`, n)),
    e.dispatchEvent(new MouseEvent(`mousedown`, n)),
    e.dispatchEvent(new PointerEvent(`pointerup`, n)),
    e.dispatchEvent(new MouseEvent(`mouseup`, n)),
    e.click());
}
function ro(e) {
  (dispatchEvent(new KeyboardEvent(`keydown`, { key: e, code: e, bubbles: !0, cancelable: !0 })),
    dispatchEvent(new KeyboardEvent(`keyup`, { key: e, code: e, bubbles: !0, cancelable: !0 })));
}
function io(e) {
  let t = Qa().filter((e) => e.matches(`.st-tab, .tab, .tabs > *, .pz-tab, [role=tab]`));
  if (t.length < 2) return;
  let n =
    t[
      (Math.max(
        0,
        t.findIndex((e) => e.classList.contains(`on`) || e.getAttribute(`aria-selected`) === `true`),
      ) +
        e +
        t.length) %
        t.length
    ];
  (no(n),
    setTimeout(() => {
      Ka?.isConnected || qa($a());
    }, 50));
}
var ao = () => [
    [ia(`jump`), c(`Saltar (mantén para planear)`)],
    [ia(`dash`) + ` / LT`, c(`Deslizar (en el aire, caída en picado)`)],
    [ia(`interact`), c(`Interactuar`)],
    [ia(`ult`) + ` / RT`, c(`Ultimate`)],
    [ia(`lock`), c(`Fijar objetivo`)],
    [ia(`aim`), c(`Apuntado auto/manual`)],
    [`Start`, c(`Pausa`)],
    [`Select`, c(`Mapa de la zona`)],
    [c(`Stick derecho`), c(`Cámara`)],
    [c(`Cruceta`), c(`Zoom`)],
  ];
const uo = true;
function Io() {
  document.documentElement.classList.toggle('touch', uo);
}
function Lo(e, t = !1) {
  let n = Da
    ? c(`Pulsa {k}`, { k: Pa(e) })
    : uo
      ? c(e === `E` ? `Toca el botón de acción` : `Toca el botón de la Ultimate`)
      : c(`Pulsa {k}`, { k: ta(e === `E` ? `interact` : `ult`) });
  return t ? n[0].toLowerCase() + n.slice(1) : n;
}
const Go = 2200;
var Xo = null;
function Zo() {
  Xo?.releaseAll(!1);
}
function Qo() {
  return Xo ? Xo.heldRaw() : [];
}
function $o(e) {
  let t = e.code;
  if (t && t !== `Unidentified`) return t;
  let n = e.keyCode;
  return n >= 65 && n <= 90
    ? `Key` + String.fromCharCode(n)
    : n >= 48 && n <= 57
      ? `Digit` + String.fromCharCode(n)
      : /^[a-z]$/i.test(e.key)
        ? `Key` + e.key.toUpperCase()
        : ({
            37: `ArrowLeft`,
            38: `ArrowUp`,
            39: `ArrowRight`,
            40: `ArrowDown`,
            32: `Space`,
            27: `Escape`,
            16: `ShiftLeft`,
          }[n] ?? t);
}
var es = class {
    keys = new Set();
    pressed = new Set();
    raw = new Set();
    heldRaw() {
      return [...this.raw];
    }
    remap = new Map();
    freed = new Set();
    lockCode = `Mouse2`;
    mouseDX = 0;
    mouseDY = 0;
    wheel = 0;
    mouseDown = [!1, !1, !1];
    mouseClicked = [!1, !1, !1];
    stickX = 0;
    stickY = 0;
    sensitivity = 1;
    invertY = !1;
    el;
    lastKey = ``;
    lastKeyT = 0;
    sawRepeat = !1;
    constructor(e) {
      ((this.el = e),
        (Xo = this),
        this.rebuildBinds(),
        qi(() => {
          (this.rebuildBinds(), this.keys.clear(), this.raw.clear());
        }),
        window.addEventListener(`keydown`, (e) => {
          let t = $o(e),
            n = e.target,
            r = n?.tagName;
          if (
            n &&
            (r === `INPUT` || r === `TEXTAREA` || r === `SELECT`) &&
            t !== `Escape` &&
            n.isConnected &&
            n !== document.body
          ) {
            if (
              (r === `TEXTAREA` ||
                (r === `INPUT` && /^(text|search|email|password|url|tel|number)$/.test(n.type)) ||
                r === `SELECT`) &&
              n.getClientRects().length
            )
              return;
            n.getClientRects().length || n.blur?.();
          }
          if ((this.syncMods(e), t === `Escape` && !e.repeat))
            for (let e of [...this.raw]) /^(Shift|Control|Alt|Meta)(Left|Right)$/.test(e) || this.release(e);
          (e.key.length === 1 && t !== `Space` && !e.ctrlKey && !e.altKey && !e.metaKey && e.preventDefault(),
            !(e.metaKey && t !== `Escape`) &&
              (this.raw.add(t),
              e.repeat && (this.sawRepeat = !0),
              (this.lastKey = t),
              (this.lastKeyT = performance.now()),
              !e.repeat && t === this.lockCode
                ? (this.mouseClicked[2] = !0)
                : this.press(t)));
        }),
        window.addEventListener(`keyup`, (e) => {
          let t = $o(e);
          (this.syncMods(e), this.release(t), (t === `MetaLeft` || t === `MetaRight`) && this.releaseAll(!0));
        }));
      let t = () => {
        (this.keys.clear(),
          this.raw.clear(),
          (this.mouseDown = [!1, !1, !1]),
          (this.stickX = this.stickY = 0));
      };
      (window.addEventListener(`blur`, t),
        window.addEventListener(`focus`, t),
        window.addEventListener('pagehide', t),
        document.addEventListener('visibilitychange', t));
    }
    rebuildBinds() {
      (this.remap.clear(), this.freed.clear(), (this.lockCode = Xi(`lock`)));
      for (let e of zi) e === `lock` || Fi.has(e) || (Xi(e) !== Ri[e] && this.remap.set(Xi(e), Ri[e]));
      for (let e of zi)
        e !== `lock` && !Fi.has(e) && Xi(e) !== Ri[e] && !this.remap.has(Ri[e]) && this.freed.add(Ri[e]);
    }
    canon(e) {
      return this.remap.get(e) || (this.freed.has(e) ? null : e);
    }
    press(e) {
      let t = this.canon(e);
      t !== null && (this.keys.has(t) || this.pressed.add(t), this.keys.add(t));
    }
    release(e) {
      (this.raw.delete(e), e === this.lastKey && (this.lastKey = ``));
      let t = this.canon(e);
      (t !== null && this.keys.delete(t), this.keys.delete(e));
    }
    syncMods(e) {
      let t = (e, ...t) => {
        if (!e) for (let e of t) this.raw.has(e) && this.release(e);
      };
      (t(e.shiftKey, `ShiftLeft`, `ShiftRight`),
        t(e.ctrlKey, `ControlLeft`, `ControlRight`),
        t(e.altKey, `AltLeft`, `AltRight`));
    }
    get looking() { return uo || Da; }
    touchKey(e, t) {
      t ? (this.keys.has(e) || this.pressed.add(e), this.keys.add(e)) : this.keys.delete(e);
    }
    look(e, t) {
      if(this.fixedCamera)return;
      ((this.mouseDX += e), (this.mouseDY += t));
    }
    zoom(e) {
      if(this.fixedCamera)return;
      this.wheel += e;
    }
    releaseAll(e = !0) {
      if (e) (this.keys.clear(), this.raw.clear());
      else for (let e of [...this.raw]) e.startsWith(`Mouse`) && this.release(e);
      ((this.mouseDown = [!1, !1, !1]), (this.stickX = this.stickY = 0));
    }
    down(e) {
      return this.keys.has(e);
    }
    hit(e) {
      return this.pressed.has(e);
    }
    axis(e, t) {
      let n = 0;
      for (let t of e) this.keys.has(t) && --n;
      for (let e of t) this.keys.has(e) && (n += 1);
      return Math.max(-1, Math.min(1, n));
    }
    endFrame() {
      (this.lastKey &&
        this.sawRepeat &&
        performance.now() - this.lastKeyT > Go &&
        this.raw.has(this.lastKey) &&
        !this.lastKey.startsWith(`Mouse`) &&
        this.release(this.lastKey),
        this.pressed.clear(),
        (this.mouseDX = 0),
        (this.mouseDY = 0),
        (this.wheel = 0),
        (this.mouseClicked = [!1, !1, !1]));
    }
  };

export {
  uo,
  Lo,
  ta,
  Na,
  aa,
  Da,
  Pa,
  Qo,
  zi,
  Vi,
  Ui,
  Yi,
  Qi,
  $i,
  ia,
  Ua,
  ao,
  Xi,
  ea,
  qi,
  La,
  Ga,
  Zo,
  Ji,
  xa,
  ka,
  Io as initializeControls,
  es as GameInput
};
