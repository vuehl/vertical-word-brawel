import {gameData as k, typeColors as Ni} from "../data/game-database.js";
import {moveAvailableForSpecies, moveOfferLevel} from "../data/skill-availability.js";
import {Bt as y, Rt as Ye, Ar as m, Dr as E, Nr as Ne, wr as er, Tr as tt, jr as sn, pn as kn} from "../data/config.js";
import {O_, A_, formMove, upgradeMoveStats as P_, F_, g_, fx, Ox, baseFusionScale, mx, gx, w_, M_} from "./skills.js";
import {random as F, I} from "../effects/battle-particles.js";
import {formatChineseNumber as n, chineseText as c} from "../data/chinese-text.js";
import {springShoesKey} from "../data/active-content.js";
import {R} from "./enemy-population.js";
import {em} from "./field-effects.js";
import {j, M, ds, fs, Cs} from "./move-sounds.js";
import {Kp} from "../effects/move-particles.js";
import {H, U, W, Dh, q, kh, Lh, castWindRing} from "./ultimate-moves.js";
import {windTornadoRate,windTornadoPosition} from "./wind-tornado.js";
import {runPlan, planIncludes} from "./battle-plan.js";

var Lb = 5.2; // Half the previous player-level requirement for learnset moves.
function zb(e) {
  let t = new Map(),
    n = k.get(e),
    r = [n];
  for (; n.evoFrom != null && k.byId.has(n.evoFrom); ) ((n = k.get(n.evoFrom)), r.push(n));
  for (let e of r) for (let [n, r] of k.learnset(e.id)) t.set(n, Math.min(t.get(n) ?? 999, r));
  return t;
}
var Bb = (e) => Math.max(1, Math.ceil((e - 10) / Lb));
function Vb(e, t, n, r) {
  const available = id => moveAvailableForSpecies(id, e) && O_(id);
  let i = new Set(),
    a = [];
  t?.kit.forEach((key, slot) => {
    let n = k.movesByKey.get(key)?.id;
    n != null && available(n) && (i.add(n), a.push({ id: n, level: moveOfferLevel(e, Ye[slot]) }));
  });
  let o = (e) => !!t?.kit.includes(k.moves.get(e).key),
    s = null,
    c = [];
  if (t?.passive === `mew`)
    s = [...k.moves.values()]
      .filter((e) => e.cls !== `status` && (e.power ?? 0) >= 60 && available(e.id) && !o(e.id))
      .map((e) => ({ id: e.id, level: 1 }));
  else {
    let t = zb(e);
    c = A_(e)
      .filter((e) => available(e) && !o(e))
      .map(id => ({ id, level: moveOfferLevel(e, Bb(t.get(id) ?? 0)) }))
      .sort((e, t) => e.level - t.level);
  }
  let l = new Map();
  for (let other of y)
    other !== t &&
      k.get(other.id).types.some((e) => n.includes(e)) &&
      other.kit.forEach((t, i) => {
        let a = k.movesByKey.get(t)?.id,
          s = a == null ? void 0 : k.moves.get(a)?.type;
        if (a == null || !s || (s !== `normal` && !n.includes(s)) || !available(a) || o(a)) return;
        let c = l.get(a),
          u = moveOfferLevel(e, Ye[i]);
        c
          ? (c.from.push(other.id), (c.open ||= r(other.id)), (c.level = Math.min(c.level, u)))
          : l.set(a, { id: a, level: u, from: [other.id], open: r(other.id) });
      });
  let u = new Set(c.map((e) => e.id));
  return {
    kit: a,
    line: c,
    shared: [...l.values()]
      .filter((e) => !u.has(e.id))
      .sort((e, t) => Number(t.open) - Number(e.open) || e.level - t.level),
    any: s,
    roster: t,
  };
}
function Hb(e, t = 0, n = 0, r) {
  let i = Math.max(0, e.player.stats.luck + n),
    a = i / 100,
    o = e.player.level + i / 8 + (e.stage - 1) * 12,
    s = (e, t) => Math.max(0, Math.min(1, (o - e) / (t - e))),
    c = [
      70 / (1 + a),
      24 * (1 + 0.5 * a),
      5 * (1 + a) ** 2 * s(3, 10),
      0.9 * (1 + a) ** 3 * s(8, 18),
      0.12 * (1 + a) ** 4 * s(14, 26),
    ].map((e, n) => e * (n >= t ? 1 : 1e-4) * (r && !r[n] ? 0 : 1)),
    l = c.reduce((e, t) => e + t, 0);
  if (l <= 1e-6) return t;
  let u = Math.random() * l;
  for (let e = 0; e < 5; e++) if (((u -= c[e]), u <= 0)) return e;
  return 0;
}
function drawOfferPage(pool, count, history) {
  const shuffled = F.shuffle(pool).sort((a,b) => Number(history.previous.has(a.key)) - Number(history.previous.has(b.key)));
  const size = Math.min(count, shuffled.length);
  const page = shuffled.filter(offer => !history.seen.has(offer.key)).slice(0, size);
  let nextInCycle = page;
  if (page.length < size) {
    // Finish the old cycle before drawing the rest of this page from the next one.
    history.seen.clear();
    nextInCycle = shuffled.filter(offer => !page.includes(offer)).slice(0, size - page.length);
    page.push(...nextInCycle);
  }
  for (const offer of nextInCycle) history.seen.add(offer.key);
  history.previous = new Set(page.map(offer => offer.key));
  return F.shuffle(page);
}
function drawCategoryPage(pool, count, histories, alreadyOnPage = []) {
  const groups = new Map();
  for (const offer of pool) {
    if (!groups.has(offer.category)) groups.set(offer.category, {pool: [], slots: 0, prior: 0});
    groups.get(offer.category).pool.push(offer);
  }
  for (const offer of alreadyOnPage) {
    const group = groups.get(offer.category);
    if (group) group.prior++;
  }
  // Draw uniformly among the least-represented eligible categories on this page.
  const size = Math.min(count, pool.length);
  for (let slot = 0; slot < size; slot++) {
    const available = [...groups.values()].filter(group => group.slots < group.pool.length);
    const minimum = Math.min(...available.map(group => group.prior + group.slots));
    F.pick(available.filter(group => group.prior + group.slots === minimum)).slots++;
  }
  const page = [];
  for (const [category, group] of groups) {
    if (!group.slots) continue;
    if (!histories.has(category)) histories.set(category, {seen: new Set(), previous: new Set()});
    page.push(...drawOfferPage(group.pool, group.slots, histories.get(category)));
  }
  return F.shuffle(page);
}
function canUpgradeMove(player, slot) {
  const move = player.moves[slot];
  return slot < player.moveSlots && move && formMove(move.def.id, player.speciesId) && move.level < player.capOf(move);
}
function Ub(run, count) {
  const player = run.player, moves = [], vitamins = [];
  if (player.freeMoveSlot() >= 0) {
    const catalog = Vb(player.speciesId,player.roster,player.types,id => run.meta.inLeague(id));
    const owned = player.ownedMoveIds();
    const hasRandom = player.moves.some(move => move?.def.arch === 'random');
    const shared = catalog.shared.filter(move => move.open && !(hasRandom && O_(move.id).arch === 'random'));
    for (const {id,level} of [...catalog.kit,...catalog.line,...shared,...(catalog.any ?? [])]) {
      const key = 'm'+id;
      if (level <= player.level && !owned.has(id) && !run.banished.has(key)) {
        moves.push({kind:'newMove', id, key, rarity:0});
        owned.add(id);
      }
    }
  }
  player.moves.forEach((move,slot) => {
    if (!canUpgradeMove(player, slot)) return;
    const key = 'm'+move.def.id;
    if (!run.banished.has(key)) moves.push({kind:'upMove', slot, key});
  });
  for (const vitamin of m) {
    const key = 'v'+vitamin.key, current = player.vitamins.get(vitamin.key);
    if (run.banished.has(key) || !player.canTakeVitamin(vitamin.key)) continue;
    vitamins.push({kind:current?'upVit':'newVit', vit:vitamin.key, key, category:vitamin.category});
  }
  // Each full group of three has one move. Give an extra slot the same 1:2 odds.
  const targetMoves = Math.floor(count / 3) + Number(count % 3 > 0 && Math.random() < (count % 3) / 3);
  const moveCount = Math.min(moves.length, Math.max(targetMoves, count - vitamins.length));
  const history = run.upgradeOfferHistory ??= {
    moves: {seen:new Set(), previous:new Set()},
    vitamins: new Map(),
  };
  const offers = F.shuffle([
    ...drawOfferPage(moves, moveCount, history.moves),
    ...drawCategoryPage(vitamins, count - moveCount, history.vitamins),
  ]);
  for (const offer of offers) {
    if (offer.kind !== 'newMove') offer.rarity = Hb(run);
    if (offer.kind === 'upMove') offer.ups = P_(player.moves[offer.slot], E[offer.rarity]);
  }
  return offers;
}
function Wb(e, t) {
  let r = e.player;
  switch (t.kind) {
    case `newMove`: {
      let e = formMove(t.id, r.speciesId);
      return {
        title: e.name,
        sub: c(`Nuevo movimiento`),
        lines: [e.desc],
        icon: `type:` + e.type,
        type: e.type,
      };
    }
    case `upMove`: {
      let e = r.moves[t.slot];
      return e.def.fusion
        ? {
            title: e.def.name,
            sub: c(`Fusión ★{a} → ★{b} (máx. ★{max})`, { a: e.level, b: e.level + 1, max: r.capOf(e) }),
            lines: t.ups.map((e) => e.label),
            icon: `type:` + e.def.type,
            type: e.def.type,
          }
        : {
            title: e.def.name,
            sub: c(`Nivel {a} → {b} (máx. {max})`, { a: e.level, b: e.level + 1, max: r.moveCap }),
            lines: t.ups.map((e) => e.label),
            icon: `type:` + e.def.type,
            type: e.def.type,
          };
    }
    case `newVit`:
    case `upVit`: {
      let e = Ne.get(t.vit),
        i = r.vitamins.get(t.vit),
        a = e.per * E[t.rarity],
        o =
          e.kind === `mul` || e.stat === `critChance` || e.stat === `evasion` || e.stat === `lifesteal`
            ? `+${+(a * 100).toFixed(1)}%`
            : `+${+a.toFixed(2)}`,
        s = e.dice
          ? c(`Tira el dado: la estadística de una vitamina al azar, ×{n}`, { n: n(er * E[t.rarity], 2) })
          : `${o} ${e.desc.toLowerCase()}`;
      return {
        title: e.name,
        sub: i
          ? c(`Nivel {a} → {b} (máx. {max})`, { a: i.level, b: i.level + 1, max: r.vitCap })
          : c(`Nueva vitamina`),
        lines: e.note ? [s, e.note] : [s],
        icon: `item:` + e.icon,
      };
    }
  }
}
function Gb(e, t) {
  let n = e.player;
  switch (t.kind) {
    case `newMove`:
      if (n.ownedMoveIds().has(t.id) || !n.addMove(t.id)) return false;
      e.stats.movesLearned++;
      break;
    case `upMove`: {
      let e = n.moves[t.slot];
      if (!canUpgradeMove(n, t.slot) || (t.key && t.key !== 'm'+e.def.id)) return false;
      F_(e, t.ups);
      break;
    }
    case `newVit`:
    case `upVit`:
      return n.addVitamin(t.vit, E[t.rarity]);
  }
  n.recompute();
  return true;
}
function canOfferItem(run, key) {
  return run.player.canHold(key) && run.meta.itemInPool(key) && !run.banished.has('i' + key) &&
    (key !== springShoesKey || run.springShoesState === 'available') &&
    !(run.tower && key === 'dowsing-machine');
}
function drawItemKeys(run, count, minimumRarity = 0) {
  const eligible = tt.filter(item => canOfferItem(run, item.key));
  const preferred = eligible.filter(item => item.rarity >= minimumRarity);
  const history = run.itemOfferHistory ??= new Map();
  const page = drawCategoryPage(preferred, count, history);
  if (page.length < count) {
    const fallback = eligible.filter(item => item.rarity < minimumRarity);
    page.push(...drawCategoryPage(fallback, count - page.length, history, page));
    F.shuffle(page);
  }
  const keys = page.map(item => item.key);
  if (keys.includes(springShoesKey)) run.springShoesState = 'offered';
  return keys;
}
var Yb = {
  physical: (e) => e.cls === `physical`,
  special: (e) => e.cls === `special`,
  projectiles: (e) => g_[e.arch].stats.includes(`count`),
  projSpeed: (e) => g_[e.arch].stats.includes(`speed`),
  area: (e) => g_[e.arch].stats.includes(`area`),
  duration: (e) => g_[e.arch].stats.includes(`dur`),
};
function Xb(e, t) {
  let n = t.filter((e) => Yb[e]);
  return n.length
    ? e.player.moves.filter((e) => e && n.some((t) => Yb[t](e.def))).map((e) => e.def.name)
    : null;
}
function Zb(e) {
  let t = sn.get(e);
  return { name: k.items[e]?.name ?? t.name ?? e, desc: t.desc, rarity: t.rarity, icon: e };
}
function Qb(e, t = 0, n = 3, r = 1) {
  return F.shuffle(
    [
      (e) => ({
        label: c(`+{n}% daño`, { n: Math.round(12 * e) }),
        mods: [{ stat: `damage`, mul: 1 + 0.12 * e }],
        rarity: 0,
      }),
      (e) => ({
        label: c(`+{n}% velocidad de ataque`, { n: Math.round(10 * e) }),
        mods: [{ stat: `attackSpeed`, mul: 1 + 0.1 * e }],
        rarity: 0,
      }),
      (e) => ({
        label: c(`+{n} PS máximos`, { n: Math.round(20 * e) }),
        mods: [{ stat: `maxHp`, add: 20 * e }],
        rarity: 0,
      }),
      (e) => ({
        label: c(`+{n}% velocidad`, { n: Math.round(8 * e) }),
        mods: [{ stat: `moveSpeed`, mul: 1 + 0.08 * e }],
        rarity: 0,
      }),
      (e) => ({
        label: c(`+{n}% crítico`, { n: Math.round(6 * e) }),
        mods: [{ stat: `critChance`, add: 0.06 * e }],
        rarity: 0,
      }),
      (e) => ({
        label: c(`+{n}% área`, { n: Math.round(12 * e) }),
        mods: [{ stat: `area`, mul: 1 + 0.12 * e }],
        rarity: 0,
      }),
      (e) => ({
        label: c(`+{n}% experiencia`, { n: Math.round(15 * e) }),
        mods: [{ stat: `xpGain`, mul: 1 + 0.15 * e }],
        rarity: 0,
      }),
      (e) => ({
        label: c(`+{n} regeneración`, { n: (0.8 * e).toFixed(1) }),
        mods: [{ stat: `regen`, add: 0.8 * e }],
        rarity: 0,
      }),
      (e) => ({
        label: c(`+{n} armadura`, { n: Math.round(8 * e) }),
        mods: [{ stat: `armor`, add: 8 * e }],
        rarity: 0,
      }),
      (e) => ({
        label: c(`+{n} suerte`, { n: Math.round(15 * e) }),
        mods: [{ stat: `luck`, add: 15 * e }],
        rarity: 0,
      }),
      (e) => ({
        label: c(`+{n}% duración`, { n: Math.round(20 * e) }),
        mods: [{ stat: `duration`, mul: 1 + 0.2 * e }],
        rarity: 0,
      }),
      (e) => ({
        label: c(`+{n}% prob. de estado`, { n: Math.round(20 * e) }),
        mods: [{ stat: `statusChance`, mul: 1 + 0.2 * e }],
        rarity: 0,
      }),
    ].slice(),
  )
    .slice(0, n)
    .map((n) => {
      let i = Math.max(t, Hb(e)),
        a = n(E[i] * r);
      return ((a.rarity = i), a);
    });
}
function $b(e) {
  return drawItemKeys(e, 4).map(key => ({key, price:nx(e,key)}));
}
var ex = [80, 130, 220, 400, 750],
  tx = [1.15, 1.25, 1.4, 1.6, 2];
function nx(e, t) {
  return Math.round(ex[sn.get(t).rarity] * jS(e) * e.shopHeat * rx(e));
}
var rx = (e) => 1 - 0.08 * Math.min(3, e.player.items.get(`gold-teeth`) ?? 0),
  ix = [`seven`, `pikachu`, `berry`, `meowth`, `voltorb`, `gengar`, `magikarp`],
  ax = [
    [`seven`, 0.018, !0],
    [`pikachu`, 0.05, !0],
    [`berry`, 0.09, !0],
    [`meowth`, 0.1, !1],
    [`voltorb`, 0.06, !1],
    [`gengar`, 0.06, !1],
  ];
function ox(e) {
  return Math.max(5, Math.round(40 * jS(e, 2) * 1.08 ** e.slotSpins * rx(e)));
}
function sx(e) {
  let t = ox(e);
  if (e.gold < t) return null;
  ((e.gold -= t), (e.goldSpent += t), e.slotSpins++, (e.slotSpent += t));
  let n = Math.min(2, Math.max(1, e.player.stats.luckMult)),
    r = F.next(),
    i = `none`;
  for (let [t, a, o] of ax) {
    if (t === `gengar` && !cx(e)) continue;
    let s = a * (o ? n : 1);
    if (r < s) {
      i = t;
      break;
    }
    r -= s;
  }
  return (
    (e.slotPrizes[i] = (e.slotPrizes[i] ?? 0) + 1),
    { reels: i === `none` ? lx() : [i, i, i], prize: i, cost: t }
  );
}
var cx = (e) => (e.slotPrizes.gengar ?? 0) < kn.gengarMax;
function lx() {
  let e = () => (F.chance(0.3) ? `magikarp` : F.pick(ix));
  for (;;) {
    let t = e(),
      n = F.chance(0.4) ? t : e(),
      r = e();
    if (t !== n || n !== r) return F.chance(0.5) ? [t, n, r] : [r, t, n];
  }
}
function ux(e, t, n) {
  let r = t.y + 2.6;
  switch (n.prize) {
    case `seven`:
      return (
        e.ui.banner(c(`¡JACKPOT!`), c(`Tres objetos, uno de ellos épico o mejor`), `#ffc83a`, {
          species: 52,
        }),
        e.vfx.burst(t.x, r, t.z, 16765498, 60, 10, I.Star, 0.7, 1),
        e.vfx.ring(t.x, t.y, t.z, 9, 16765498, 0.8),
        e.shake(0.3, t.x, t.z),
        e.rollChestItem(!1, 3),
        e.rollChestItem(!1, 1),
        e.rollChestItem(!1, 1),
        !0
      );
    case `pikachu`:
      return (
        e.vfx.burst(t.x, r, t.z, 16769098, 30, 7, I.Spark, 0.6, 0.7),
        e.cry(25),
        e.rollChestItem(!1, 2),
        !0
      );
    case `berry`:
      return (
        e.player.heal(e.player.maxHp * 0.25),
        e.vfx.burst(t.x, r, t.z, 5933823, 18, 5, I.Heart, 0.5),
        e.rollChestItem(!1),
        !0
      );
    case `meowth`:
      return (
        e.addGold(n.cost * 2.5),
        e.vfx.burst(t.x, r, t.z, 16765498, 30, 7, I.Star, 0.5, 0.7),
        e.cry(52),
        !1
      );
    case `gengar`:
      return (
        e.curses++,
        e.tempMods.push({ stat: `enemyAmount`, mul: 1.05 }, { stat: `difficulty`, mul: 1.05 }),
        e.player.recompute(),
        e.vfx.ring(t.x, t.y, t.z, 8, 10115839, 0.8),
        e.vfx.burst(t.x, r, t.z, 10115839, 30, 6, I.Skull, 0.6, 0.9),
        e.cry(94),
        e.audio.bossStart(),
        e.shake(0.25, t.x, t.z),
        !1
      );
    case `voltorb`:
      return (e.later(0.3, () => dx(e, t)), !0);
    default:
      return !1;
  }
}
function dx(e, t) {
  let n = e.enemies,
    r = e.director,
    i = 3 + e.stage;
  (e.ui.toast(c(`¡Los Voltorb salen de la máquina!`), null),
    e.cry(100),
    e.audio.boom(0.5),
    e.vfx.flash(t.x, t.y + 1.5, t.z, 16769098, 6, 0.3));
  for (let a = 0; a < i; a++) {
    let o = (a / i) * Math.PI * 2,
      s = F.range(5, 7),
      c = t.x + Math.cos(o) * s,
      l = t.z + Math.sin(o) * s;
    if (!e.terrain.inBounds(c, l, 4)) continue;
    let u = a === 0 && e.stage >= 2,
      d = n.spawn(u ? 101 : 100, c, l, r.hpMult(), r.dmgMult(), a === 0 ? R.Elite : 0);
    d >= 0 && e.vfx.burst(c, n.y[d] + 0.6, l, 16769098, 8, 4, I.Spark, 0.4, 0.4);
  }
}
function px(e, t = 0.45) {
  return ((((e >> 16) & 255) * t) << 16) | ((((e >> 8) & 255) * t) << 8) | ((e & 255) * t);
}
function hx(e, t, n = 1) {
  return e.run.projectiles.fire({
    radius: 0.6,
    type: e.type,
    cls: e.cls,
    slot: e.slot,
    statusChance: 0,
    knock: 1,
    ...t,
    dmg: e.dmg * n,
  });
}
var _x = (e, t = {}) => ({ type: e.type2, ...t });
function bx(e, t, n, r = 0) {
  let i = F.range(0, fx),
    a = F.range(r, n);
  return { x: e + Math.cos(i) * a, z: t + Math.sin(i) * a };
}
var Sx = em,
  wx = { signature: `#ffb43a`, reaction: `#5ad0ff`, type: `#8ad85a`, glitch: `#c8a8e8` };
function Tx(e, t) {
  let n = (e, t) => e + t - 1;
  return {
    dmg: n(e.dmg, t.dmg),
    cd: e.cd * t.cd,
    count: e.count + t.count,
    area: n(e.area, t.area),
    speed: n(e.speed, t.speed),
    dur: n(e.dur, t.dur),
    pierce: e.pierce + t.pierce,
    crit: e.crit + t.crit,
    status: n(e.status, t.status),
    bounce: e.bounce + t.bounce,
  };
}
function Ax(e, t) {
  return {
    id: t,
    key: e.key,
    name: e.name,
    type: e.type,
    type2: e.type2,
    cls: e.cls,
    arch: `fusion`,
    dmg: g_.fusion.dmg * e.power,
    cd: e.cd,
    count: 0,
    area: 5,
    speed: 1,
    dur: 1,
    pierce: 99,
    status: e.status ?? null,
    statusChance: e.status ? 0.5 : 0,
    drain: 0,
    critBonus: 0,
    flinch: 0,
    power: 100,
    desc: e.desc,
    fusion: { key: e.key, hits: e.hits, update: (t, n, r, i) => Ox(e, t, n, r, i) },
  };
}
// Only the four playable recipes are registered. IDs are permanent save identities.
var lS = [{
  "key": "fu-4",
  "member": 4,
  "ingredientPairs": [["fire-spin", "inferno"], ["fire-spin", "fire-blast"]],
  "kind": "signature",
  "name": "炼狱风暴",
  "desc": "投出火焰漩涡吸引敌人，旋涡不断变大，向外甩出螺旋火焰后爆炸。",
  "type": "fire",
  "cls": "special",
  "cd": 3.23,
  "power": 1.12,
  "hits": 5,
  "range": 14,
  "status": "burn",
  "sfx": function sfx(e) {
      fs(e, 0.16, 0.5);
    },
  "cast": function cast(e) {
      const t=e.run,n=t.player.pos,art=t.vfx.crafted.fireFamily;
      const r=Math.min(9,Math.hypot(e.tx-n.x,e.tz-n.z)),i=n.x+e.ax*r,a=n.z+e.az*r;
      const vortex=(x,z,scale,duration,main)=>{
        let damageTick=0,spokeTick=0;const key={};
        art.play('seal',x,U(t,x,z)+.15,z,6*scale,{life:.28,mode:1,height:8*scale,priority:2,visualScale:1});
        W(t,duration,(age,dt)=>{
          const phase=age/duration,baseRadius=(2.4+(main?phase*1.6:0))*scale;
          const radius=baseRadius*e.R,y=U(t,x,z);
          art.fusionVortex(key,x,y+.12,z,baseRadius*baseFusionScale,main);
          kh(t,x,z,radius+3,22*dt);
          damageTick-=dt;
          if(damageTick<=0){damageTick=.25;q(e,x,z,radius,.22,{status:'burn',statusChance:.25,knock:0,silent:Math.random()<.6});}
          if(main&&age>.9&&(spokeTick-=dt)<=0){
            spokeTick=.2;
            for(let j=0;j<3;j++){
              const angle=age*4+j/3*H,dx=Math.cos(angle),dz=Math.sin(angle);
              art.fusionSpoke(x,y,z,dx,dz,baseRadius*baseFusionScale);
              for(const target of t.enemies.within(x+dx*(radius+3),z+dz*(radius+3),2.6*e.R))
                Dh(e,target,.25,{status:'burn',statusChance:.3,dirX:dx,dirZ:dz,knock:1,silent:true});
            }
          }
        },()=>{
          const y=U(t,x,z),baseRadius=(main?5:3)*scale,radius=baseRadius*e.R;
          const artRadius=baseRadius*baseFusionScale;
          art.fusionBurst(x,y,z,artRadius,main);
          q(e,x,z,radius,main?1.8:.9,{status:'burn',statusChance:.8,knock:4});
          if(main){
            gx(e,x,z,radius*.7,2.5,.12,'burn',.5,undefined,e.type,{authoredFire:true,artRadius:artRadius*.7,visualScale:1});
          }
          t.shake(main?.25:.1,x,z);M(t.audio,main?.8:.4);fs(t.audio,.18,.6);
        });
      };
      art.play('charge',n.x,n.y+1,n.z,4,{life:.25,visualScale:1});
      t.later(.3,()=>vortex(i,a,1,2.6*e.D,true));
      for(let j=0;j<mx(e,1,2);j++){
        const angle=Math.atan2(e.az,e.ax)+(j?-1:1)*.9;
        t.later(.45+j*.1,()=>vortex(n.x+Math.cos(angle)*7,n.z+Math.sin(angle)*7,.65,1.8*e.D,false));
      }
      fs(t.audio,.14,.9,.3);ds(t.audio,8,1.2,.05,.3);
    },
  "id": 50001
}, {
  "key": "fu-16",
  "member": 16,
  "ingredientPairs": [["air-slash", "wing-attack"], ["air-slash", "aerial-ace"]],
  "kind": "signature",
  "name": "残气乱刮",
  "desc": "龙卷风向前推进并牵引敌人，锋利的羽翼从风中飞出，来回切割。",
  "type": "flying",
  "cls": "special",
  "cd": 2.4416504956396077,
  "power": 5.2915026221291805,
  "hits": 4.6,
  "range": 16,
  "status": "knock",
  "sfx": function sfx(e) {
      Cs(e, 1.6, 0.12, 0, 350);
    },
  "cast": function cast(e) {
      let t = e.run,
        n = e.x,
        r = e.z,
        i = e.ax,
        a = e.az,
        o = 1.8 * e.D,
        s = 14 * e.R,
        c = 0.22 / (1 + mx(e, 0.5, 2));
      Lh(e, i, a, s, o, 0.4, 2.1, { status: `knock`, statusChance: 0.1 });
      const rate=windTornadoRate(t.player.speciesId);
      let l = 0.1/rate,
        u = 0;
      W(t, o/rate, (d, f) => {
        if (((l -= f), l > 0)) return;
        l = c/rate;
        const {x:g,z:_}=windTornadoPosition(n,r,i,a,s,d*rate,o,t.terrain.arenaR);
        let v = U(t, g, _) + 1.4,
          y = (u++ * 2.4) % H;
        (hx(
          e,
          {
            x: g,
            y: v,
            z: _,
            dx: Math.cos(y),
            dz: Math.sin(y),
            speed: 16,
            life: 1.1,
            radius: 0.9,
            pierce: 99,
            flags: Sx.Boomerang | Sx.Spin,
            shape: I.PixFeather,
            size: 1.2,
            color: 16777215,
            fx: Kp(`wind-fusion-feather`),
            knock: 1,
          },
          0.45,
        ),
          u % 3 == 0 && j(t.audio, 800, 0.05, 0.12));
      });
    },
  "id": 50006
}, {
  "key": "fu-t-fire",
  "member": 4,
  "ingredientPairs": [["ember", "flame-charge"], ["ember", "flamethrower"]],
  "kind": "signature",
  "type": "fire",
  "cls": "special",
  "name": "灼热之阳",
  "desc": "一轮小太阳在敌人上方形成，周围降下火雨，最后炸成一圈火环。",
  "cd": 3.23,
  "power": 1.32,
  "hits": 5,
  "cast": (e) => {
        let t = e.run,
          n = e.tx,
          r = e.tz,
          i = 1.8 * e.D,
          a = 5 * e.R,
          o = 0;
        W(
          t,
          i,
          (i, s) => {
            let c = U(t, n, r) + 5;
            t.vfx.crafted.fireFamily.sun(e, n, c, r, i, baseFusionScale);
            if (((o -= s), o <= 0)) {
              o = 0.12;
              let i = bx(n, r, a, 0.5),
                s = U(t, i.x, i.z);
              (t.vfx.crafted.fireFamily.sunRain(i.x, c - 0.5, i.z, s, n, r),
                t.later(0.3, () => {
                  t.vfx.crafted.fireFamily.sunImpact(i.x, s, i.z, 1.8 * baseFusionScale);
                  q(e, i.x, i.z, 1.8 * e.R, 0.3, {
                    status: `burn`,
                    statusChance: 0.3,
                    knock: 0.3,
                    silent: !0,
                  });
                }));
            }
          },
          () => {
            let i = U(t, n, r);
            t.vfx.crafted.fireFamily.sunBurst(n, i, r, 5 * baseFusionScale);
            (q(e, n, r, a, 2, { status: `burn`, statusChance: 0.8, knock: 4 }),
              t.shake(0.25, n, r),
              M(t.audio, 0.8),
              fs(t.audio, 0.18, 0.5));
          },
        );
      },
  "sfx": (e) => fs(e, 0.1, 0.6),
  "repeats": true,
  "id": 50080
}, {
  "key": "fu-wind-spin",
  "member": 16,
  "ingredientPairs": [["quick-attack", "tackle"], ["quick-attack", "wind-ring-wave"]],
  "kind": "signature",
  "type": "flying",
  "cls": "special",
  "name": "卷着打转",
  "desc": "两道龙卷向前推进，牵引并持续击打敌人。环绕自身的风环与羽毛同时向外扩散。",
  "cd": 3.23,
  "power": 1.35,
  "hits": 5,
  "range": 16,
  "cast": e => castWindRing(e),
  "id": 50106
}], uS = new Map();
for (const recipe of lS) {
  uS.set(recipe.key, {r:recipe, id:recipe.id});
  w_.set(recipe.id, Ax(recipe, recipe.id));
}
var dS = (e) => uS.get(e)?.r,
  fS = (e) => uS.get(e)?.id ?? -1,
  mS = 1.3,
  hS = 1.7 * mS,
  gS = (e) => e.arch !== `weather` && e.arch !== `buff` && e.arch !== `fusion`;
function _S(e, t, species) {
  if (!e || !t || !formMove(e.id, species) || !formMove(t.id, species) || e.id === t.id) return null;
  const available = recipe => recipe && moveAvailableForSpecies(fS(recipe.key), species) ? recipe : null;
  let n = lS.find(recipe => recipe.ingredientPairs?.some(([a, b]) =>
    (a === e.key && b === t.key) || (a === t.key && b === e.key)));
  if (n) return available(n);
  let r = (e, t, n) => e.pair[0].includes(t) && e.pair[1].includes(n),
    i = lS.find((n) => n.kind === `reaction` && (r(n, e.type, t.type) || r(n, t.type, e.type)));
  if (i) return available(i);
  if (e.type === t.type) {
    let t = lS.find((t) => t.kind === `type` && t.type === e.type);
    if (t) return available(t);
  }
  return null;
}
const fusionRequiredLevel = 4;
var vS = (e, t) => c(`{name} Nv. {lv}/{max}`, { name: e, lv: t, max: fusionRequiredLevel });
function yS(e) {
  let t = e.player,
    n = [],
    r = t.moves.map((e, t) => ({ m: e, i: t })).filter((e) => e.m && gS(e.m.def));
  const species = t.speciesId;
  for (let e = 0; e < r.length; e++)
    for (let t = e + 1; t < r.length; t++) {
      let i = r[e],
        a = r[t],
        o = _S(i.m.def, a.m.def, species),
        s = [];
      if (!o) continue;
      (i.m.level < fusionRequiredLevel && s.push(vS(i.m.def.name, i.m.level)),
        a.m.level < fusionRequiredLevel && s.push(vS(a.m.def.name, a.m.level)),
        n.push({
          r: o,
          a: i.i,
          b: a.i,
          ingredients: [i.m.def.id, a.m.def.id],
          names: [i.m.def.name, a.m.def.name],
          types: [i.m.def.type, a.m.def.type],
          ready: !s.length,
          need: s,
        }));
    }
  for (const i of lS.filter(recipe => recipe.ingredientPairs && recipe.member === t.roster?.id)) {
    for (const pair of i.ingredientPairs) {
      let r = pair.map((e) => formMove(k.movesByKey.get(e)?.id ?? -1, t.speciesId));
      if (r.every(Boolean) && !n.some(row => row.r === i && r.every(move => row.ingredients.includes(move.id)))) {
        let a = r
          .map((n) => {
            let r = t.moves.find((e) => e?.def.id === n.id);
            return r
              ? r.level < fusionRequiredLevel
                ? vS(n.name, r.level)
                : ``
              : t.moves.some((e) => e?.parents.includes(n.id))
                ? c(`{name} ya está dentro de otra fusión`, { name: n.name })
                : e.banished.has(`m` + n.id)
                  ? c(`{name} está desterrado`, { name: n.name })
                  : c(`Aprende {name}`, { name: n.name });
          })
          .filter(Boolean);
        n.push({
          r: i,
          a: -1,
          b: -1,
          ingredients: r.map(move => move.id),
          names: [r[0].name, r[1].name],
          types: [r[0].type, r[1].type],
          ready: !1,
          need: a,
        });
      }
    }
  }
  let a = { signature: 0, reaction: 1, type: 2, glitch: 3 };
  const plan = runPlan(e);
  const marked = offer => Number(planIncludes(plan,'fusions','m'+offer.r.id));
  return n.sort((e, t) => Number(t.ready) - Number(e.ready) || marked(t) - marked(e) || a[e.r.kind] - a[t.r.kind]);
}
function bS(e, t) {
  let n = e.player,
    r = n.moves[t.a],
    i = n.moves[t.b];
  if (!t.r || !r || !i || r.level < fusionRequiredLevel || i.level < fusionRequiredLevel ||
      _S(r.def, i.def, n.speciesId) !== t.r) return null;
  let a = formMove(fS(t.r.key), n.speciesId);
  if (!a) return null;
  let o = new M_(a);
  ((o.mods = Tx(r.mods, i.mods)),
    (o.parents = [r.def.id, i.def.id, ...r.parents, ...i.parents]),
    (o.timer = 1.2),
    n.forgetMove(t.a),
    n.forgetMove(t.b),
    (n.moves[Math.min(t.a, t.b)] = o));
  for (let n of t.r.preload ?? []) e.sprites.get(n);
  return (e.fusions.push(t.r.key), o);
}
function xS(e, t) {
  let n = yS(e);
  ((e.state = `modal`),
    e.ui.showFusion(e, n, (r) => {
      e.resume();
      let i = r == null ? null : n[r];
      i?.ready && SS(e, t, i);
    }));
}
function SS(e, t, n) {
  ((t.used = !0), e.interactables.dim(t));
  let r = e.player.pos,
    i = Ni[n.types[0]],
    a = Ni[n.types[1]],
    o = Math.atan2(-t.x, -t.z),
    s = Math.cos(o),
    l = -Math.sin(o),
    u = { x: t.x - s * hS, z: t.z - l * hS },
    d = { x: t.x + s * hS, z: t.z + l * hS },
    f = t.y + 1.5 * mS,
    p = 2.7;
  e.state = `cinematic`;
  let m = e.camYaw;
  (e.setCine({
    follow: -1,
    x: (r.x + t.x) / 2,
    y: r.y + 1.2,
    z: (r.z + t.z) / 2,
    dist: 7.5,
    pitch: 0.22,
    orbit: 0.25,
  }),
    e.audio.duck(0.3, p),
    CS(e));
  let h = (t, n, r, i, a, o, s, c, l = 0.9) => {
      let u = c * c * (3 - 2 * c),
        d = t + (i - t) * u,
        f = n + (a - n) * u + Math.sin(c * Math.PI) * 2.2,
        p = r + (o - r) * u;
      (e.vfx.add.spawn({
        x: d,
        y: f,
        z: p,
        life: 0.08,
        size: l * 1.5,
        endSize: l,
        color: px(s, 0.6),
        shape: I.Soft,
        glow: 0,
      }),
        Math.random() < 0.8 &&
          e.vfx.add.spawn({
            x: d,
            y: f,
            z: p,
            vx: F.range(-1, 1),
            vy: F.range(-1, 1),
            vz: F.range(-1, 1),
            life: 0.4,
            size: 0.35,
            endSize: 0,
            color: s,
            shape: I.Twinkle,
            glow: 0.4,
          }));
    },
    g = new Set(),
    _ = (e) => !g.has(e) && (g.add(e), !0);
  (e.vfx.ring(r.x, r.y, r.z, 2.5, i, 0.4),
    e.animate(
      p,
      (r) => {
        let o = r * p,
          s = e.player.pos;
        if (
          (o < 0.6 &&
            (h(s.x, s.y + 1, s.z, u.x, f, u.z, i, o / 0.6), h(s.x, s.y + 1, s.z, d.x, f, d.z, a, o / 0.6)),
          o >= 0.6 && _(`pods`))
        )
          for (let [t, n] of [
            [u, i],
            [d, a],
          ])
            (e.vfx.flash(t.x, f, t.z, n, 3, 0.25), e.vfx.burst(t.x, f, t.z, n, 14, 4, I.Spark, 0.5, 0.5));
        if (o >= 0.6 && o < 1.5) {
          for (let [n, r] of [
            [u, i],
            [d, a],
          ])
            (Math.random() < 0.35 && e.vfx.lightning(n.x, f, n.z, t.x, f + 0.5, t.z, r, 0.18, 4, 0.06),
              Math.random() < 0.5 &&
                e.vfx.add.spawn({
                  x: n.x + F.range(-0.4, 0.4),
                  y: f + F.range(-0.6, 0.8),
                  z: n.z + F.range(-0.4, 0.4),
                  vy: 2,
                  life: 0.4,
                  size: 0.3,
                  endSize: 0,
                  color: r,
                  shape: I.Spark,
                  glow: 0.5,
                }));
          Math.random() < 0.4 &&
            e.vfx.add.spawn({
              x: t.x,
              y: f + 0.5,
              z: t.z,
              life: 0.12,
              size: 1 + (o - 0.6) * 1.8,
              endSize: 0.6,
              color: px(16773320),
              shape: I.Soft,
              glow: 0,
            });
        }
        if (
          (o >= 1.5 && _(`flash`) && (e.vfx.flash(t.x, f + 0.5, t.z, 16777215, 5, 0.3), e.shake(0.3)),
          o >= 1.5 && o < 2 && h(t.x, f + 0.5, t.z, s.x, s.y + 1, s.z, 16771240, (o - 1.5) / 0.5, 1.2),
          o >= 2 && _(`done`))
        ) {
          (bS(e, n), e.vfx.flash(s.x, s.y + 1, s.z, 16777215, 4, 0.25));
          for (let t = 0; t < 3; t++) e.vfx.ring(s.x, s.y, s.z, 3 + t * 2, t % 2 ? a : i, 0.5 + t * 0.1);
          for (let t = 0; t < 40; t++) {
            let n = (t / 40) * Math.PI * 6,
              r = t * 0.09;
            e.vfx.add.spawn({
              x: s.x + Math.cos(n) * 0.9,
              y: s.y + r,
              z: s.z + Math.sin(n) * 0.9,
              vy: 1.5,
              life: 0.7,
              size: 0.4,
              endSize: 0,
              color: t % 2 ? a : i,
              shape: I.Twinkle,
              glow: 0.4,
            });
          }
          (e.vfx.burst(s.x, s.y + 1.5, s.z, 16771240, 30, 7, I.Star, 0.7, 0.8),
            e.player.roster?.id === n.r.member && e.cry(e.player.speciesId));
        }
      },
      () => {
        ((e.state = `play`),
          e.endCine(),
          (e.yawBack = m),
          (e.player.iframes = Math.max(e.player.iframes, 1.2)),
          e.ui.banner(
            c(`¡Fusión completada! {name}`, { name: n.r.name }),
            c(`{a} + {b} · Tienes un hueco libre para aprender otro ataque`, {
              a: n.names[0],
              b: n.names[1],
            }),
            wx[n.r.kind],
            n.r.member ? { species: n.r.member } : void 0,
          ));
      },
    ));
}
function CS(e) {
  let t = e.audio;
  (t.kt(110, 1.4, { w: `triangle`, lp: 900, to: 2.2, v: 0.08, a: 0.5 }),
    t.kt(165, 1.4, { w: `triangle`, lp: 900, to: 2.2, v: 0.06, a: 0.5, d: 0.05 }));
  for (let e = 0; e < 7; e++) t.kn(0.05, { f: 2200, q: 1.5, v: 0.05, d: 0.6 + e * 0.12, a: 0.001 });
  (t.kn(0.9, { f: 300, to: 4, q: 2, v: 0.08, d: 0.6, a: 0.6 }),
    [523, 659, 784, 1047].forEach((e, n) =>
      t.kt(e, 0.9, { w: `triangle`, v: 0.045, d: 1.5 + n * 0.05, a: 0.02 }),
    ),
    t.kt(60, 0.7, { to: 0.5, v: 0.22, d: 1.5, a: 0.003 }),
    t.kn(0.6, { ft: `lowpass`, f: 1400, to: 0.15, v: 0.16, d: 1.5 }),
    [784, 988, 1175, 1568].forEach((e, n) => t.kt(e, 0.6, { v: 0.04, d: 2 + n * 0.07, a: 0.01 })));
}
var kS = 2.2,
  AS = 1.7;
function jS(e, t = kS) {
  let n = e.endless;
  return n
    ? AS ** +Math.max(0, Math.floor((e.time - 210) / 300)) * n.curse.chest
    : t ** (Math.min(4, Math.max(1, e.stage)) - 1);
}

export {
  ex,
  jS,
  ox,
  hS,
  fusionRequiredLevel,
  yS,
  xS,
  wx,
  Ub,
  Wb,
  Gb as applyUpgrade,
  drawItemKeys,
  Zb,
  Qb,
  $b,
  tx,
  rx,
  sx,
  cx,
  ux,
  dS,
  fS,
  lS,
  Vb as movePool,
  Xb,
  ix
};
