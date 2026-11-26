import {LITE_SPECIES, defaultStarter, isLiteSpecies, isLiteFamily, heroAppearanceOwned} from "./lite-rules.js";
import {
  Ir as ge,
  Wt as pt,
  zr as fr,
  Ht as pe,
  Vt as ut,
  Fr as ae,
  fn as Wt,
  Yn as vt,
  jn as on,
  hn as Qt,
  jt as cn,
  kt as fn,
  Ft as oe,
  Lr as Te,
  sn as Rn,
  vr as Xn,
  br as Mt,
  or as En,
  Cr as S,
  En as O,
  Fn as ie,
  yr as cr,
  At as h,
  Bt as y,
  Ct as C,
  Gt as le,
  Jn as ye,
  Nt as Pe,
  Qt as Ge,
  Tt as nt,
  dn as Rt,
  hr as $t,
  ht as en,
  in as tn,
  jr as sn,
  nr as Cn,
  rn as Fn,
  vt as Zn,
  wt as tr,
  xn as rr,
  yn as sr
} from "./config.js";
import {gameData as k} from "./game-database.js";
import {chineseText as c} from "./chinese-text.js";

var bO = [...LITE_SPECIES],
  xO = () => ({ idx: 0, ids: [], prog: [], claimed: [], rerolls: 0 }),
  SO = {
    master: 1,
    music: 0.5,
    sfx: 1,
    cries: 0.6,
    quality: `high`,
    lock30Fps: false,
    aimMode: `auto`,
    sensitivity: 1,
    invertY: !1,
    damageNumbers: !0,
    floatText: !0,
    shakeOn: !0,
    screenShake: 1,
    fov: 70,
    showFps: !1,
    reduceFlashes: !1,
    pixel: 0,
    muteHidden: !0,
    hudScale: 1,
    hudOpacity: 1,
    bossBarOpacity: 1,
    showBanners: !0,
    showMinimap: !0,
    showLadder: !0,
    showToasts: !0,
    showStreak: !0,
    showItems: !0,
    mapScale: 1,
    mapIcons: 1,
    mapNorthUp: !1,
    fxOpacity: 1,
    ownFxOpacity: 1,
    fxGlow: 1,
    touchScale: 1,
    camDist: 9,
    calmCandies: !1,
    pickupFx: `full`,
    skipEmptyLevelUp: !1,
    hideOwnFx: !1,
    fixedStick: !1,
    padRumble: !0,
    padDead: 0.15,
    ultPose: !0,
    tours: ``,
    hintsSeen: ``,
    tips: !0,
  };
function CO(e) {
  return {
    v: 1,
    name: e,
    created: Date.now(),
    stardust: 0,
    totalStardust: 0,
    unlocked: [],
    league: [],
    starter: 0,
    forms: [],
    research: {},
    captured: {},
    seen: [],
    played: [],
    shinies: [],
    classics: [],
    skins: [],
    team: [],
    lab: {},
    biomes: { forest: 0 },
    quests: {},
    counters: {},
    runs: [],
    best: {},
    times: {},
    kills: {},
    medals: {},
    endless: {},
    settings: { ...SO },
    lastSpecies: 4,
    lastBiome: `forest`,
    banished: [],
    itemsOwned: [],
    itemsOff: [],
    daily: xO(),
    weekly: xO(),
    dailyStreak: { last: 0, n: 0 },
    bag: {},
    avatar: ``,
    frame: ``,
    title: ``,
    cosmetics: [],
  };
}
function wO(e) {
  let t = { ...CO(e.name ?? `Entrenador`), ...e };
  if (
    ((t.settings = { ...SO, ...(e.settings ?? {}) }),
    typeof e.settings?.ownFxOpacity != `number` && (t.settings.ownFxOpacity = t.settings.fxOpacity),
    Array.isArray(t.league) || (t.league = []),
    typeof e.starter != `number`)
  ) {
    t.starter = t.league.find((e) => bO.includes(e)) ?? defaultStarter;
    for (let e of bO)
      (t.unlocked.includes(e) || t.unlocked.push(e), t.league.includes(e) || t.league.push(e));
  }
  (Array.isArray(t.shinies) || (t.shinies = []),
    Array.isArray(t.classics) || (t.classics = []),
    Array.isArray(t.team) || (t.team = []),
    Array.isArray(t.played) || (t.played = [...new Set((t.runs ?? []).map((e) => e.species))]),
    Array.isArray(t.skins) || (t.skins = []),
    (!t.times || typeof t.times != `object`) && (t.times = {}),
    (!t.medals || typeof t.medals != `object`) && (t.medals = {}),
    (!t.kills || typeof t.kills != `object`) && (t.kills = {}),
    (!t.endless || typeof t.endless != `object`) && (t.endless = {}));
  for (let e of [`daily`, `weekly`]) {
    let n = t[e];
    (!n ||
      typeof n != `object` ||
      !Array.isArray(n.ids) ||
      !Array.isArray(n.prog) ||
      !Array.isArray(n.claimed)) &&
      (t[e] = xO());
  }
  ((!t.dailyStreak || typeof t.dailyStreak != `object`) && (t.dailyStreak = { last: 0, n: 0 }),
    (!t.bag || typeof t.bag != `object`) && (t.bag = {}),
    Array.isArray(t.cosmetics) || (t.cosmetics = []),
    (!t.events || typeof t.events != `object` || Array.isArray(t.events)) && (t.events = {}),
    Array.isArray(t.itemsOwned) || (t.itemsOwned = []),
    Array.isArray(t.itemsOff) || (t.itemsOff = []),
    typeof t.avatar != `string` && (t.avatar = ``),
    typeof t.frame != `string` && (t.frame = ``),
    typeof t.title != `string` && (t.title = ``),
    (t.biomes = { forest: 0, ...(t.biomes && typeof t.biomes == `object` ? t.biomes : {}) }));
  for (let e = 1; e < fr.length; e++)
    !(fr[e].id in t.biomes) && (t.biomes[fr[e - 1].id] ?? -1) >= 1 && (t.biomes[fr[e].id] = 0);
  return (
    ge(t.lastBiome) || (t.lastBiome = `forest`),
    t.league.length &&
      (!t.league.includes(t.lastSpecies) || !pt.has(t.lastSpecies)) &&
      (t.lastSpecies = t.league.find((e) => pt.has(e)) ?? t.league[0]),
    t
  );
}
var TO = (e) => (e.legendary || e.mythical ? 3 : Math.round(30 + Math.min(70, e.bst / 8))),
  EO = [`rare-candy`, `lucky-egg`, `amulet-coin`];
function DO(e, t, n, r = `add`) {
  let i = e.counters;
  i[t] = r === `add` ? (i[t] ?? 0) + n : Math.max(i[t] ?? 0, n);
}
var OO = [144, 145, 146];
function kO(e, t) {
  return t === `league`
    ? pe(e.league.filter((e) => e !== 151))
    : t === `birds`
      ? OO.filter((t) => e.league.includes(t)).length
      : t.startsWith(`tier_`)
        ? (e.biomes[t.slice(5)] ?? 0)
        : (e.counters[t] ?? 0);
}
function AO(e, t) {
  let n = pt.get(t);
  return n ? ut(n).map((t) => ({ ...t, value: Math.min(t.goal, kO(e, t.counter)) })) : [];
}
function jO(e, t) {
  let n = pt.get(t);
  return n ? ut(n).every((t) => kO(e, t.counter) >= t.goal) : !1;
}
function MO(e, t) {
  if (!Array.isArray(e.seen) || !Array.isArray(e.unlocked) || !e.unlocked.length) return;
  let n = new Set(e.unlocked),
    r = new Set(e.seen);
  for (let i = 1; i <= ae.maxDex; i++) !r.has(i) && t.has(i) && n.has(t.family(i)) && e.seen.push(i);
}
function NO(e, t) {
  let n = Wt.find((e) => e.id === t);
  if (!n) return !1;
  let r = e.lab[t] ?? 0;
  if (r >= n.max) return !1;
  let i = n.cost(r);
  return e.stardust < i ? !1 : ((e.stardust -= i), (e.lab[t] = r + 1), !0);
}
function PO(e, t) {
  let n = vt.get(t);
  return !n || e.itemsOwned.includes(t) || e.stardust < n.price
    ? !1
    : ((e.stardust -= n.price), e.itemsOwned.push(t), !0);
}
function FO(e, t, n, r) {
  if (!r(t)) return !1;
  let i = e.itemsOff.includes(t);
  return n
    ? i || e.itemsOff.length >= on(e.lab) || (vt.has(t) && !e.itemsOwned.includes(t))
      ? !1
      : (e.itemsOff.push(t), !0)
    : i
      ? ((e.itemsOff = e.itemsOff.filter((e) => e !== t)), !0)
      : !1;
}
function IO(e, t) {
  let n = Qt.find((e) => e.id === t);
  return !n || e.quests[n.id] || RO(e, n) < n.goal
    ? !1
    : ((e.quests[n.id] = 1),
      (e.stardust += n.reward),
      (e.totalStardust += n.reward),
      n.title && !e.cosmetics.includes(`title:q:` + n.id) && e.cosmetics.push(`title:q:` + n.id),
      fn(n) && !e.cosmetics.includes(cn(n.look)) && e.cosmetics.push(cn(n.look)),
      !0);
}
for (let e of Qt) e.counter === `@league` && (e.goal = pt.size);
var LO = [`helix`, `dome`, `amber`];
function RO(e, t) {
  let n = Rn.filter((e) => ge(e)),
    r;
  switch (t.counter) {
    case `@hard`:
      r = n.filter((t) => (e.biomes[t] ?? 0) >= 2).length;
      break;
    case `@night`:
      r = n.filter((t) => (e.biomes[t] ?? 0) >= 3).length;
      break;
    case `@champ`:
      r = n.filter((t) => [0, 1, 2].some((n) => (e.medals[t + `-` + n] ?? 0) >= 4)).length;
      break;
    case `@legs`:
      r = n.filter(
        (t) => (e.counters[`leg_` + t] ?? 0) > 0 || (Xn(t) === 4 && (e.biomes[t] ?? 0) >= 1),
      ).length;
      break;
    case `@fossils`:
      r = LO.filter((t) => (e.counters[`fossil_` + t] ?? 0) > 0).length;
      break;
    case `@seen`:
      r = e.seen.filter((e) => Te(e)).length;
      break;
    case `@league`:
      r = pe(e.league);
      break;
    case `@items`:
      r = e.itemsOwned.filter((e) => vt.has(e)).length;
      break;
    default:
      r = fn(t) ? oe(e, t) : (e.counters[t.counter] ?? 0);
  }
  return Math.min(t.goal, r);
}
var zO = [`daily`, `weekly`];
function BO(e, t) {
  for (let n of zO) {
    let r = En(n, t);
    (e[n].idx !== r || e[n].ids.length !== 3) &&
      (e[n] = {
        idx: r,
        ids: [0, 1, 2].map((e) => Mt(n, r, e).id),
        prog: [0, 0, 0],
        claimed: [0, 0, 0, 0],
        rerolls: 0,
      });
  }
}
function VO(e, t, n = 1) {
  e.bag[t] = Math.min(9, (e.bag[t] ?? 0) + n);
}
function HO(e, t, n) {
  let r = e[t];
  if (n < 3) return { dust: O[t][n], items: [] };
  if (t === `weekly`) return { dust: 500, items: S(r.idx) };
  let i = e.dailyStreak,
    a = i.last === r.idx - 1 ? i.n + 1 : i.last === r.idx ? i.n : 1;
  return { dust: 50 * Math.min(5, a), items: [ie(r.idx)] };
}
function UO(e, t, n) {
  let r = e[t];
  if (!Number.isInteger(n) || n < 0 || n > 3 || r.claimed[n]) return !1;
  if (n === 3) return r.claimed[0] === 1 && r.claimed[1] === 1 && r.claimed[2] === 1;
  let i = cr(r.ids[n]);
  return !!i && r.prog[n] >= i.goal;
}
function WO(e, t, n, r) {
  if (!zO.includes(t) || (BO(e, r), !UO(e, t, n))) return !1;
  let i = e[t],
    a = HO(e, t, n);
  ((i.claimed[n] = 1),
    n === 3 &&
      t === `daily` &&
      (e.dailyStreak = { last: i.idx, n: e.dailyStreak.last === i.idx - 1 ? e.dailyStreak.n + 1 : 1 }),
    n < 3 && DO(e, `tasks`, 1));
  for (let t of a.items) VO(e, t);
  return ((e.stardust += a.dust), (e.totalStardust += a.dust), !0);
}
function GO(e, t, n, r) {
  if (!zO.includes(t) || !Number.isInteger(n) || n < 0 || n > 2) return !1;
  BO(e, r);
  let i = e[t],
    a = cr(i.ids[n]);
  if (i.rerolls >= 1 || i.claimed[n] || (a && i.prog[n] >= a.goal)) return !1;
  let o = i.ids[n];
  for (let e = i.rerolls + 1; e < i.rerolls + 8 && i.ids.includes(o); e++) o = Mt(t, i.idx, n, e).id;
  return !i.ids.includes(o) && ((i.ids[n] = o), (i.prog[n] = 0), i.rerolls++, !0);
}
var KO = 300,
  qO = 1e3,
  JO = 50,
  YO = null,
  XO = {
    has: (e) => k.byId.has(e),
    family: (e) => (k.byId.has(e) ? k.get(e).family || k.root(e).id : e),
    researchGoal: (e) => TO(k.get(e)),
    familyTypes: (e) => {
      if (!YO) {
        YO = new Map();
        for (let e of k.pokemon) {
          let t = XO.family(e.id);
          YO.set(t, [...new Set([...(YO.get(t) ?? []), ...e.types])]);
        }
      }
      return YO.get(e) ?? [];
    },
    legendary: (e) => k.byId.has(e) && (k.get(e).legendary || k.get(e).mythical),
  },
  ZO = class {
    backend;
    profile;
    account;
    snap = null;
    ticket = null;
    lastResearch = { families: [], looks: [] };
    saveTimer = 0;
    constructor(e) {
      ((this.backend = e),
        typeof window < `u` &&
          (window.addEventListener(`pagehide`, () => this.flush()),
          document.addEventListener(`visibilitychange`, () => {
            document.hidden && this.flush();
          })));
    }
    async load(e) {
      ((this.account = e),
        (this.profile = await this.backend.loadProfile(e)),
        BO(this.profile, this.now()),
        (this.snap = null),
        (this.ticket = null),
        this.openBiomes());
    }
    openBiomes() {
      for (let e of fr)
        !(e.id in this.profile.biomes) && this.biomeUnlockedByChain(e.id) && (this.profile.biomes[e.id] = 0);
    }
    save() {
      (clearTimeout(this.saveTimer),
        (this.saveTimer = window.setTimeout(() => this.backend.savePrefs(this.account, this.profile), 400)));
    }
    saveNow(reportError=false) {
      return (clearTimeout(this.saveTimer), this.backend.savePrefs(this.account, this.profile,reportError));
    }
    adopt(e) {
      (this.profile &&
        ((e.settings = this.profile.settings),
        (e.firstJourneyPlayed = this.profile.firstJourneyPlayed || e.firstJourneyPlayed),
        (e.collection = this.profile.collection ?? e.collection),
        (e.lastSpecies = this.profile.lastSpecies),
        (e.lastBiome = this.profile.lastBiome),
        (e.skins = this.profile.skins.filter((t) => {
          let n = Pe(t);
          return !!n && (n.look === 'shiny' || n.look === 'classic'
            ? heroAppearanceOwned(e,n.member,n.look) : Zn(e,n.member,n.look,id=>XO.family(id)));
        })),
        (e.team = (this.profile.team ?? []).filter((t) => e.league.includes(t)))),
        this.snap && this.profile && this.rebase(e),
        (this.profile = e),
        BO(e, this.now()));
      try {
        MO(e, XO);
      } catch {}
      this.openBiomes();
      this.onProfileAdopted?.();
    }
    rebase(e) {
      let t = this.profile,
        n = this.snap;
      this.snap = structuredClone(e);
      for (let [r, i] of Object.entries(t.counters)) {
        let t = i - (n.counters[r] ?? 0);
        t > 0 && (e.counters[r] = (e.counters[r] ?? 0) + t);
      }
      for (let [r, i] of Object.entries(t.research)) {
        let t = i - (n.research[r] ?? 0);
        t > 0 && (e.research[r] = (e.research[r] ?? 0) + t);
      }
      for (let r of [`seen`, `forms`, `league`, `unlocked`])
        for (let i of t[r]) !n[r].includes(i) && !e[r].includes(i) && e[r].push(i);
      for (let [r, i] of Object.entries(t.captured))
        !(r in n.captured) && !(r in e.captured) && (e.captured[r] = i);
    }
    resync(reportError = false) {
      let e = this.epoch;
      return this.backend
        .loadProfile(this.account)
        .then((t) => {
          e === this.epoch && this.queued === 0 && this.adopt(t);
        })
        .catch(error => { if (reportError) throw error; });
    }
    epoch = 0;
    now() {
      return Date.now() + (this.backend.clockSkew ?? 0);
    }
    onError = null;
    queue = Promise.resolve();
    queued = 0;
    batch = [];
    batchTimer;
    batchStart = 0;
    act(e, t) {
      this.backend.actions
        ? (this.batch.length || (this.queued++, (this.batchStart = Date.now())),
          this.epoch++,
          this.batch.push(e),
          clearTimeout(this.batchTimer),
          this.batch.length >= JO || Date.now() - this.batchStart >= qO
            ? this.flush()
            : (this.batchTimer = setTimeout(() => this.flush(), KO)))
        : this.send(t);
    }
    flush() {
      if ((clearTimeout(this.batchTimer), (this.batchTimer = void 0), !this.batch.length)) return;
      let e = this.batch;
      ((this.batch = []), this.send(() => this.backend.actions(this.account, e), !0));
    }
    send(e, t = !1) {
      (t || (this.flush(), this.queued++), this.epoch++);
      let n = !1,
        r = async () => {
          for (let t = 0; ; t++)
            try {
              return await e();
            } catch (e) {
              if (!e.offline || t >= 2) throw e;
              ((n = !0), await new Promise((e) => setTimeout(e, 1500 * (t + 1))));
            }
        };
      this.queue = this.queue
        .then(r)
        .then(
          (e) => {
            --this.queued === 0 && this.adopt(e);
          },
          (e) => {
            throw (this.queued--, e);
          },
        )
        .catch(
          (e) => (
            (n && e.status === 409) || this.onError?.(e?.message || c(`No se pudo guardar el cambio.`)),
            this.resync()
          ),
        );
    }
    lab(e) {
      return this.profile.lab[e] ?? 0;
    }
    buyLab(e) {
      return NO(this.profile, e)
        ? (this.act({ k: `lab`, id: e, lv: this.profile.lab[e] ?? 0 }, () =>
            this.backend.buyLab(this.account, e),
          ),
          !0)
        : !1;
    }
    itemInPool(e) {
      return ye(this.profile, e);
    }
    itemsReady() {
      return Rt.filter((e) => !this.profile.itemsOwned.includes(e.key) && this.profile.stardust >= e.price)
        .length;
    }
    buyItem(e) {
      return PO(this.profile, e)
        ? (this.act({ k: `item`, key: e }, () => this.backend.buyItem(this.account, e)), !0)
        : !1;
    }
    archiveItem(e, t) {
      return FO(this.profile, e, t, (e) => sn.has(e))
        ? (this.act({ k: `archive`, key: e, off: t }, () => this.backend.archiveItem(this.account, e, t)), !0)
        : !1;
    }
    labStats() {
      let e = {};
      for (let t of Wt)
        if (t.stat && t.per) {
          let n = this.lab(t.id);
          n && (e[t.stat] = (e[t.stat] ?? 0) + t.per * n);
        }
      for (let t of this.shinyPerks()) t.stat && t.add && (e[t.stat] = (e[t.stat] ?? 0) + t.add);
      return e;
    }
    shinyCount() {
      return this.profile.shinies.length;
    }
    shinyPerks() {
      return $t(this.shinyCount());
    }
    hasShinyCharm() {
      return this.shinyPerks().some((e) => e.charm);
    }
    shinyRate() {
      return this.hasShinyCharm() ? sr : 1;
    }
    shinyFlee() {
      return this.hasShinyCharm() ? rr.charm : rr.base;
    }
    shinyBond() {
      return Math.max(0, ...this.shinyPerks().map((e) => e.bond ?? 0));
    }
    skinAvailable(e) {
      return C(this.profile, e, (e) => this.family(e));
    }
    shinySkin(e) {
      return this.skinFor(e) === `shiny`;
    }
    spectralAvailable(e) {
      return nt(this.profile, e);
    }
    skinFor(e) {
      let t = le(e, (e) => this.family(e))?.id ?? e,
        n = tr(this.profile.skins, t);
      return n && this.lookAvailable(t, n) ? n : null;
    }
    lookAvailable(e, t) {
      if(t === 'shiny' || t === 'classic')return heroAppearanceOwned(this.profile,e,t);
      return Zn(this.profile, e, t, (e) => this.family(e));
    }
    setSkin(e, t) {
      (!t || this.lookAvailable(e, t)) &&
        ((this.profile.skins = this.profile.skins.filter((t) => Pe(t)?.member !== e)),
        t && this.profile.skins.push(h(e, t)),
        this.save());
    }
    inTeam(e) {
      return this.profile.team.includes(e);
    }
    teamFull() {
      return this.profile.team.length >= 6;
    }
    toggleTeam(e) {
      let t = this.profile.team;
      if (t.includes(e)) this.profile.team = t.filter((t) => t !== e);
      else if (t.length >= 6 || !this.profile.league.includes(e)) return !1;
      else t.push(e);
      return (this.save(), !0);
    }
    setTeam(e) {
      ((this.profile.team = en(this.profile, e) ?? this.profile.team), this.save());
    }
    setShinySkin(e, t) {
      this.setSkin(e, t ? `shiny` : null);
    }
    eventReady(e) {
      return Ge(this.profile, e);
    }
    async beginRun(e) {
      this.ticket = await this.backend.startRun(this.account, e);
      for (let e of this.ticket.boosts ?? [])
        ((this.profile.bag[e] = (this.profile.bag[e] ?? 1) - 1),
          this.profile.bag[e] <= 0 && delete this.profile.bag[e]);
      return ((this.snap = structuredClone(this.profile)), this.ticket);
    }
    checkpoint(e) {
      this.ticket && this.backend.checkpoint(this.account, this.ticket, e);
    }
    report(e, t, n) {
      let r = this.profile,
        i = {};
      // Local backend preserves every client progression counter, including special encounters.
      for (let t of Object.keys(r.counters)) {
        let e = (r.counters[t] ?? 0) - (n.counters[t] ?? 0);
        e > 0 && (i[t] = e);
      }
      let a = {};
      for (let [e, t] of Object.entries(r.research)) {
        let r = t - (n.research[e] ?? 0);
        r > 0 && (a[e] = r);
      }
      return {
        ...e,
        progress: {
          counters: i,
          research: a,
          seen: r.seen.filter((e) => !n.seen.includes(e)),
          league: t.league.slice(),
          shinies: t.shinies.slice(),
          classics: (t.classics ?? []).slice(),
          forms: r.forms.filter((e) => !n.forms.includes(e)),
        },
      };
    }
    keepLive(e, t) {
      this.ticket?.id &&
        this.snap &&
        this.backend.keepLive?.(this.account, this.ticket, this.report(e, t, this.snap));
    }
    hasPending(ticketId) {
      return !!this.backend.hasPending?.(this.account,ticketId);
    }
    async retryPending() {
      let e = (await this.backend.retryNow?.(this.account)) ?? { left: 0, saved: 0 };
      return (e.saved && (await this.resync()), e);
    }
    async endRun(e, t) {
      let n = this.snap ?? structuredClone(this.profile),
        r = this.report(e, t, n),
        i = this.ticket ?? { id: ``, seed: 0, ranked: !1, offline: !0 };
      ((this.ticket = null), (this.snap = null));
      try {
        let e = await this.backend.finishRun(this.account, i, r),
          t = new Set(tn(n, XO)),
          a = Fn(n, XO);
        return (
          this.adopt(e.profile),
          (this.lastResearch = {
            families: tn(this.profile, XO).filter((e) => !t.has(e)),
            looks: [...Fn(this.profile, XO)].filter((e) => !a.has(e)),
          }),
          e
        );
      } catch (e) {
        throw (this.adopt(n), e);
      }
    }
    inLeague(e) {
      return pt.has(e) && this.profile.league.includes(e);
    }
    skinMember(e) {
      let t = this.family(e);
      return pt.get(e) ?? y.find((e) => this.family(e.id) === t);
    }
    async chooseStarter(e) {
      (this.adopt(await this.backend.chooseStarter(this.account, e)),
        (this.profile.lastSpecies = e),
        this.save());
    }
    challengeProgress(e) {
      let t = AO(this.profile, e);
      return {
        parts: t,
        frac: t.length ? t.reduce((e, t) => e + t.value / t.goal, 0) / t.length : 1,
        done: t.every((e) => e.value >= e.goal),
      };
    }
    leagueReady() {
      return [...LITE_SPECIES];
    }
    joinLeague(e) {
      if(!isLiteSpecies(e))return;
      this.profile.league.includes(e) || this.profile.league.push(e);
      let t = this.family(e);
      (this.profile.unlocked.includes(t) || this.profile.unlocked.push(t),
        (this.profile.captured[t] = Date.now()),
        this.count(`captures`, 1));
    }
    family(e) {
      return XO.family(e);
    }
    isUnlocked(e) {
      return this.inLeague(e);
    }
    researchGoal(e) {
      return XO.researchGoal(e);
    }
    research(e) {
      return this.profile.research[e] ?? 0;
    }
    researchDone(e) {
      return this.research(e) >= this.researchGoal(e);
    }
    researched() {
      return tn(this.profile, XO);
    }
    researchLooks() {
      return Fn(this.profile, XO);
    }
    addResearch(e, t) {
      let n = this.family(e),
        r = 1 + this.lab(`research`) * 0.25;
      ((this.profile.research[n] = Math.min(this.researchGoal(n), this.research(n) + t * r)),
        this.profile.seen.includes(e) || this.profile.seen.push(e));
    }
    markSeen(e) {
      this.profile.seen.includes(e) || this.profile.seen.push(e);
    }
    addClassic(e) {
      if(!isLiteSpecies(e))return false;
      (this.profile.seen.includes(e) || this.profile.seen.push(e),
        Array.isArray(this.profile.classics) || (this.profile.classics = []));
      let t = !this.profile.classics.includes(e);
      return (t && (this.profile.classics.push(e), this.count(`classics`, 1)), t);
    }
    addShiny(e) {
      if(!isLiteSpecies(e))return false;
      this.profile.seen.includes(e) || this.profile.seen.push(e);
      let t = !this.profile.shinies.includes(e);
      return (t && this.profile.shinies.push(e), this.count(`shinies`, 1), t);
    }
    unlockForm(e) {
      if(!isLiteFamily(e))return false;
      return !this.profile.forms.includes(e) && (this.profile.forms.push(e), !0);
    }
    biomeUnlockedByChain(e) {
      let t = fr.findIndex((t) => t.id === e);
      return t <= 0 || (this.profile.biomes[fr[t - 1].id] ?? -1) >= 1;
    }
    biomeTier(e) {
      return ge(e) ? (this.profile.biomes[e] ?? -1) : -1;
    }
    count(e, t, n = `add`) {
      let r = this.profile.counters;
      r[e] = n === `add` ? (r[e] ?? 0) + t : Math.max(r[e] ?? 0, t);
    }
    questProgress(e) {
      return RO(this.profile, e);
    }
    claimQuest(e) {
      return IO(this.profile, e.id)
        ? (this.act({ k: `quest`, id: e.id }, () => this.backend.claimQuest(this.account, e.id)), !0)
        : !1;
    }
    claimable() {
      return Qt.filter((e) => !this.profile.quests[e.id] && this.questProgress(e) >= e.goal).length;
    }
    tasksReady() {
      BO(this.profile, this.now());
      let e = 0;
      for (let t of [`daily`, `weekly`]) for (let n = 0; n < 4; n++) UO(this.profile, t, n) && e++;
      return e;
    }
    task(e, t) {
      return cr(this.profile[e].ids[t]);
    }
    claimTask(e, t) {
      return WO(this.profile, e, t, this.now())
        ? (this.act({ k: `task`, period: e, slot: t }, () => this.backend.claimTask(this.account, e, t)), !0)
        : !1;
    }
    rerollTask(e, t) {
      return GO(this.profile, e, t, this.now())
        ? (this.send(() => this.backend.rerollTask(this.account, e, t)), !0)
        : !1;
    }
    partySize() {
      return Cn(this.profile.lab);
    }
  };

export {
  SO,
  XO,
  wO,
  ZO as PlayerProfile
};
