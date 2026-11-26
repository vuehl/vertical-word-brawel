import {tv, nv, av, uv, ev, iv, ov} from "../combat/player.js";
import {classDamageMultiplier} from '../combat/stat-multipliers.js';
import {chineseText as c} from "../data/chinese-text.js";
import {
  jr as sn,
  kr as dn,
  Ar as m,
  Tr as tt,
  Nr as Ne,
  Bt as y,
  Dr as E,
  Or as Le,
  Pr as Ve,
  Br as v
} from "../data/config.js";
import {typeNames as Pi, gameData as k, typeColors as Ni} from "../data/game-database.js";
import {stackedItemModifier, applyItemModifiers as rv} from "../combat/item-modifiers.js";
import {g_, R_, z_, Ig, Lg, M_, F_, O_, formMove} from "../combat/skills.js";
import {P} from "../effects/scene-renderer.js";
import {Qg} from "../data/move-attributes.js";
import {createElement as X, Q, YC, ZC, Z, uw, pw, rw, $, aw, XC} from "./game-elements.js";
import {teamDetail, showTeamItem, teamOverview} from "./battle-review-ui.js";
import {gameAudio as N} from "../combat/game-audio.js";
import {Mb, Nb, Pb} from "../combat/enemies.js";
import {dS, fS, wx, lS, fusionRequiredLevel, movePool as Vb, Xb, Zb} from "../combat/upgrade-offers.js";
import {uo, Qo} from "./controls.js";
import {Nm, jm} from "../combat/field-effects.js";

var NE = (e) => Math.round(e * 10) / 10,
  PE = (e) => `${NE(e * 100)}%`;
function FE(e, t, n) {
  let [r, i] = tv[e] ?? [e, `flat`];
  if (n != null) {
    let e = (n - 1) * 100;
    return `${e >= 0 ? `+` : ``}${NE(e)}% ${r}`;
  }
  let a = t ?? 0;
  return `${a >= 0 ? `+` : ``}${i === `pctpts` || i === `mult` ? PE(a) : NE(a)} ${r}`;
}
var IE = {
  "black-sludge": (e, t) => [c(`Venenos un {pct}% más largos`, { pct: 25 * t })],
  "shell-bell": (e, t) => [c(`Recuperas el {pct}% del daño que infliges`, { pct: NE(0.8 * t) })],
  metronome: (e, t) => [
    c(`Ahora: +{pct}% de daño (sin recibir golpes {s} s)`, {
      pct: Math.round(Math.min(0.4, e.player.noHitT * 0.02) * t * 100),
      s: Math.floor(e.player.noHitT),
    }),
  ],
  "sitrus-berry": (e) => [
    e.player.sitrusCd > 0 ? c(`Recargando: {s} s`, { s: Math.ceil(e.player.sitrusCd) }) : c(`Lista`),
  ],
  "focus-band": (e, t) => [
    c(`{pct}% de aguantar un golpe letal`, { pct: Math.round(100 * (1 - 0.85 ** t)) }),
  ],
  "focus-sash": (e) => [e.player.sashUsed ? c(`Ya usada en esta fase`) : c(`Lista`)],
  "smoke-ball": () => [c(`25% de invisibilidad 1,5 s al recibir daño`)],
  eviolite: (e) => [
    e.nextEvo ? c(`Activo: +50% armadura y +25% PS`) : c(`Inactivo: ya no puedes evolucionar`),
  ],
  "max-revive": (e) => [c(`Revivir disponible: {n}`, { n: e.player.revives })],
  "master-ball": () => [c(`Captura asegurada en los Encuentros Salvajes`)],
  "thunder-stone": (e, t) => [
    c(`Rayo de {n} de daño base en cada crítico`, { n: Math.round((10 + e.player.level * 0.8) * t) }),
  ],
  "fire-stone": (e, t) => [
    c(`Explosión de {n} de daño base`, { n: Math.round(20 * t * (1 + e.player.level * 0.08)) }),
  ],
  "big-nugget": (e, t) => [
    c(`Poké Balls un {pct}% más baratas (la siguiente: {cost} ₽)`, {
      pct: Math.round(Math.min(0.4, 0.08 * t) * 100),
      cost: e.interactables.chestCost(),
    }),
  ],
  "grip-claw": (e, t) => [c(`{pct}% de enraizar en cada golpe`, { pct: NE(4 * t) })],
  "berry-juice": (e, t) => [
    c(`{pct}% por baja de curar un 2% de PS`, { pct: Math.round(Math.min(0.5, 0.05 * t) * 100) }),
  ],
  "flame-orb": (e, t) => [c(`{pct}% de quemar en cada golpe`, { pct: NE(5 * t) })],
  "toxic-orb": (e, t) => [c(`{pct}% de envenenar en cada golpe`, { pct: NE(6 * t) })],
  snowball: (e, t) => [c(`{pct}% de enfriar en cada golpe`, { pct: NE(6 * t) })],
  "binding-band": (e, t) => [c(`+{pct}% de daño a enemigos inmovilizados`, { pct: 20 * t })],
  "adrenaline-orb": (e, t) => [
    c(`Al recibir un golpe: +{spd}% velocidad y +{atk}% vel. de ataque`, { spd: 20 * t, atk: 12 * t }),
    e.player.buffs.has(`adrenaline`) ? c(`¡Activa ahora!`) : c(`Inactiva`),
  ],
  stick: (e, t) => [c(`{pct}% de golpe ×8`, { pct: 3 * t })],
  "razor-fang": (e, t) => [c(`Remata por debajo del {pct}% de PS`, { pct: 4 + 4 * t })],
  "cell-battery": (e, t) => [
    c(`Ahora: +{pct}% vel. de ataque (racha ×{streak})`, {
      pct: NE(Math.min(0.25, Math.floor(e.streak / 10) * 0.015) * t * 100),
      streak: e.streak,
    }),
  ],
  "reaper-cloth": (e, t) => [
    c(`Ahora: +{pct}% de daño ({kills} bajas)`, {
      pct: Math.round(Math.min(0.3, Math.floor(e.stats.kills / 100) * 0.01) * t * 100),
      kills: e.stats.kills,
    }),
  ],
  electirizer: (e, t) => [
    c(`{n} rayos de {dmg} de daño base cada 2,5 s`, {
      n: 2 + t,
      dmg: Math.round(16 * (1 + e.player.level * 0.07)),
    }),
  ],
  "smooth-rock": (e, t) => [
    c(t > 1 ? `+{n} rebotes (solo Proyectil y Ráfaga)` : `+{n} rebote (solo Proyectil y Ráfaga)`, { n: t }),
  ],
  "shed-shell": () => [c(`Invulnerable 0,35 s al deslizarte · recarga 0,8 s`)],
  "griseous-orb": (e, t) => [
    c(`12% por baja: sombra de {dmg} de daño base que maldice`, {
      dmg: Math.round(18 * t * (1 + e.player.level * 0.08)),
    }),
  ],
  "lustrous-orb": (e) => [
    c(`Grieta cada 8 s: {dmg} de daño base · siguiente en {s} s`, {
      dmg: Math.round(30 * (1 + e.player.level * 0.08)),
      s: Math.max(0, Math.ceil(e.player.riftT)),
    }),
  ],
  "lum-berry": (e, t) => [
    c(`Cura un {pct}% de PS cada 30 s · siguiente en {s} s`, {
      pct: 12 + 4 * (t - 1),
      s: Math.max(0, Math.ceil(e.player.lumT)),
    }),
  ],
  "ice-stone": (e, t) => [
    c(`Esquirlas de {dmg} de daño base al morir un enemigo frío`, {
      dmg: Math.round(14 * t * (1 + e.player.level * 0.08)),
    }),
  ],
  "leaf-stone": (e, t) => [
    c(`10% por baja: hojas de {dmg} de daño base y +1% de PS`, {
      dmg: Math.round(12 * t * (1 + e.player.level * 0.08)),
    }),
  ],
  revive: (e, t) => [c(`Revivir disponible: {n}`, { n: t })],
  "sun-stone": (e, t) => [
    c(`Rayo solar de {dmg} de daño base cada 6 s · siguiente en {s} s`, {
      dmg: Math.round(60 * t * (1 + e.player.level * 0.09)),
      s: Math.max(0, Math.ceil(e.player.sunT)),
    }),
  ],
  "soul-dew": () => [c(`Ultimate un 40% más rápida`)],
  "silver-wing": (e) => [
    c(`Ráfaga de {dmg} de daño base cada 5 s`, { dmg: Math.round(22 * (1 + e.player.level * 0.08)) }),
  ],
  "rainbow-wing": (e) => [e.player.rainbowUsed ? c(`Ya usada en esta zona`) : c(`Lista para renacer`)],
  "adamant-orb": (e) => [
    e.player.timeCd > 0
      ? c(`Recargando: {s} s`, { s: Math.ceil(e.player.timeCd) })
      : c(`Lista para detener el tiempo`),
  ],
  "soda-pop": (e, t) => [
    c(`Burbujas de {dmg} de daño base al deslizarte`, {
      dmg: Math.round(10 * t * (1 + e.player.level * 0.08)),
    }),
  ],
  "metal-powder": (e, t) => [
    c(`Quieto: +{arm}% armadura y +{atk}% vel. de ataque`, { arm: 30 * t, atk: 8 * t }),
    e.player.buffs.has(`metal`) ? c(`¡Activa ahora!`) : c(`Inactiva`),
  ],
  "burn-heal": (e, t) => [c(`Hasta {n} contagios de quemadura cada 0,5 s`, { n: 4 + 3 * t })],
  "ice-heal": (e, t) => [
    c(`+{pct}% al romper el hielo de un congelado`, { pct: Math.round((0.6 + 0.3 * (t - 1)) * 100) }),
  ],
  awakening: (e, t) => [
    c(`{pct}% de dormir en cada golpe`, { pct: NE(2.5 * t) }),
    c(`{pct}% de que un dormido siga durmiendo al golpearlo`, {
      pct: Math.round(Math.min(0.7, 0.25 + 0.15 * t) * 100),
    }),
  ],
  "old-rod": (e, t) => [
    c(`Magikarp de {dmg} de daño base cada 9 s`, { dmg: Math.round(9 * t * (1 + e.player.level * 0.08)) }),
    c(`{pct}% de que pique un Gyarados`, { pct: 2 + t }),
  ],
  bicycle: (e, t) => [
    c(`Ahora: +{pct}% de daño por tu velocidad`, { pct: Math.round(e.player.bikeBonus() * t * 100) }),
  ],
  "iron-ball": (e, t) => [
    c(`Onda sísmica de {dmg} de daño base al aterrizar`, {
      dmg: Math.round((10 + 0.5 * Math.max(0, e.player.stats.armor)) * t * (1 + e.player.level * 0.08)),
    }),
  ],
  "fresh-water": (e, t) => [
    c(`Chorro de {dmg} de daño base (más lo guardado: {stored} PS)`, {
      dmg: Math.round((6 + e.player.level) * t),
      stored: Math.round(e.player.freshStore),
    }),
  ],
  "full-heal": (e, t) => [
    c(`+{pct}% de daño por cada estado del enemigo (hasta +{max}%)`, { pct: 6 * t, max: 30 * t }),
  ],
  "guard-spec": (e, t) => [
    e.player.guardT > 0
      ? c(`Recargando: {s} s`, { s: Math.ceil(e.player.guardT) })
      : c(`Lista: bloquea el siguiente golpe`),
    c(`Recarga de {s} s`, { s: 14 - 3 * (t - 1) }),
  ],
  "coin-case": (e) => [
    c(`Ahora: +{pct}% de daño ({spent} ₽ gastados)`, {
      pct: Math.round(e.player.coinBonus() * 100),
      spent: Math.round(e.goldSpent),
    }),
  ],
  "thick-club": (e, t) => [
    c(`Ahora: +{pct}% de daño físico por tu armadura`, {
      pct: Math.round(Math.min(0.5, Math.max(0, e.player.stats.armor) / 200) * t * 100),
    }),
  ],
  "rage-candy-bar": (e) => [
    c(`Ahora: +{pct}% de daño por tus PS`, { pct: Math.round(e.player.rageBonus() * 100) }),
  ],
  "silph-scope": (e, t) => [
    c(`El enemigo marcado recibe +{pct}% de daño`, { pct: 40 * t }),
    e.player.scopeIdx >= 0
      ? c(`Marcado: {s} s`, { s: Math.max(0, Math.ceil(e.player.scopeT)) })
      : c(`Buscando objetivo`),
  ],
  lemonade: (e, t) => [
    c(`Alfas de apoyo: +{dmg}% de daño y +{spd}% vel. de ataque ({n} contigo)`, {
      dmg: 25 * t,
      spd: 15 * t,
      n: e.allies.list.length,
    }),
  ],
  "poke-doll": (e, t) => [c(`Pasivas de tus Alfas ×{x}`, { x: 1 + 0.5 * t })],
  "ss-ticket": (e) => [c(`Huecos de Alfas: {n}`, { n: e.allies.cap })],
  "tm-case": () => [c(`Movimientos hasta el nivel 10, fusiones hasta ★6`)],
  "max-ether": () => [c(`Vitaminas hasta el nivel 12`)],
  "secret-key": (e, t) => [c(`Altares un {pct}% más rápidos`, { pct: 30 * t })],
  "dowsing-machine": (e, t) => [c(`每个新区域额外增加 {n} 个骰子`, { n: 2 * t })],
  "gold-teeth": (e, t) => [c(`Meowth y la tragaperras: -{pct}%`, { pct: 8 * Math.min(3, t) })],
  "poke-flute": (e) => [
    c(`Ultimate un 25% más rápida`),
    e.player.buffs.has(`flute`)
      ? c(`¡Activa ahora!`)
      : c(`Al lanzar la Ultimate: movimientos listos y +30% vel. de ataque 6 s`),
  ],
};
function LE(e, t, n) {
  let r = sn.get(t);
  if (!r) return [];
  let i = [],
    a = dn[t];
  a && i.push(c(`+{pct}% daño de tipo {type}`, { pct: 30 * n, type: Pi[a] }));
  for (const mod of r.mods) {
    const {stat, add, mul} = stackedItemModifier(mod, n);
    i.push(FE(stat, add, mul));
  }
  let o = IE[t];
  return (o && i.push(...o(e, n)), i);
}
function RE(e, t) {
  let n = e.player;
  return {
    stats: n.stats,
    types: n.types,
    adaptability: n.ability === `adaptability`,
    inst: t,
    items: n.items,
    vitamins: n.vitamins,
    basis: c(`Con tus estadísticas actuales`),
  };
}
function zE(e, t, n, r) {
  let i = nv(e, 0, n);
  return (
    rv(i, uv(t).mods ?? []),
    av(i),
    {
      stats: i,
      types: e.types,
      adaptability: t === `adaptability`,
      basis: c(`Con las estadísticas de {name} al empezar la partida`, { name: r ?? e.name }),
    }
  );
}
var BE = (e) => ({
  dmg: 1 + 0.08 * (e - 1),
  cd: 1,
  count: 0,
  area: 1,
  speed: 1,
  dur: 1,
  pierce: 0,
  crit: 0,
  status: 1,
  bounce: 0,
});
function VE(e, t, n, r) {
  let i = t.stats,
    a = g_[e.arch],
    o = t.inst && t.inst.def.id === e.id ? t.inst : null,
    s = n ?? o?.level ?? 1,
    c = r ?? (n == null && o ? o.mods : BE(s)),
    l = e.dmg * 1.3 * c.dmg * (1 + (s - 1) * 0.04),
    u = t.types.includes(e.type) ? (t.adaptability ? 1.5625 : 1.25) : 1,
    d = l * classDamageMultiplier(i,e.cls) * u * (i.typeBoost[e.type] ?? 1),
    f = Math.max(1, Math.floor(e.count + c.count + (a.stats.includes(`count`) ? i.projectiles : 0))),
    p = Math.max(e.fusion ? 0.6 : 0.12, (e.cd * c.cd) / i.attackSpeed),
    m = e.fusion ? e.area * R_(c.area * i.area) : e.area * c.area * i.area,
    h = e.dur * c.dur * i.duration,
    g = e.speed * c.speed * i.projSpeed,
    _ = {
      level: s,
      base: l,
      real: d,
      stab: u,
      cd: p,
      count: f,
      pulses: e.pulses ?? 1,
      area: m,
      dur: h,
      speed: g,
      pierce: e.pierce >= 99 ? 99 : e.pierce + c.pierce,
      bounce: e.arch === `bolt` || e.arch === `barrage` ? c.bounce + i.bounces : 0,
      statusChance: e.status ? Math.min(1, e.statusChance * c.status * i.statusChance) : 0,
      crit: Math.min(1, i.critChance + e.critBonus + c.crit),
      reach: 0,
      use: null,
      dps: null,
    };
  switch (e.arch) {
    case `bolt`:
    case `drain`:
    case `homing`:
    case `orb`:
    case `boomerang`:
    case `barrage`:
    case `wave`:
      _.reach = g * h;
      break;
    case `dash`:
      _.reach = g;
      break;
    case `beam`:
      _.reach = 14 * Math.sqrt(i.area) * (1 + (c.area - 1) * 0.5);
      break;
    case `cone`:
      _.reach = m;
  }
  return ((_.use = HE(e, _)), (_.dps = _.use != null && p > 0 ? _.use / p : null), _);
}
function HE(e, t) {
  switch (e.arch) {
    case `bolt`:
    case `drain`:
    case `homing`:
    case `orb`:
    case `lob`:
    case `barrage`:
    case `smite`:
    case `meteor`:
    case `strike`:
      return t.real * t.count;
    case `dash`:
    case `boomerang`:
    case `wave`:
    case `aura`:
    case `chain`:
      return t.real;
    case `nova`:
    case `spin`:
      return t.pulses > 1 ? t.real * 0.4 * t.pulses : t.real;
    case `beam`:
      return (t.real * t.dur * (e.power >= 110 ? 1.3 : 1)) / 0.09;
    case `cone`:
      return (t.real * t.dur) / 0.1;
    case `fusion`:
      return e.fusion ? t.real * e.fusion.hits : null;
    default:
      return null;
  }
}
var UE = (e) => Math.round(e * 10) / 10,
  WE = (e) => (e >= 1e4 ? P(e) : String(e >= 100 ? Math.round(e) : UE(e))),
  GE = (e) => Math.round(e * 100) + `%`,
  KE = {
    bolt: `projectile`,
    orb: `projectile`,
    lob: `projectile`,
    barrage: `projectile`,
    homing: `projectile`,
    boomerang: `projectile`,
    drain: `projectile`,
    beam: `beam`,
    cone: `beam`,
    wave: `beam`,
    nova: `area`,
    meteor: `area`,
    smite: `area`,
    vortex: `area`,
    trap: `area`,
    chain: `area`,
    strike: `melee`,
    dash: `melee`,
    spin: `melee`,
    aura: `aura`,
    orbit: `aura`,
    trail: `aura`,
    weather: `support`,
    buff: `support`,
    random: `support`,
    fusion: `area`,
  },
  qE = (e) => KE[e],
  JE = (e) =>
    ({
      projectile: c(`Proyectiles`),
      beam: c(`Rayos y conos`),
      area: c(`Área`),
      melee: c(`Cuerpo a cuerpo`),
      aura: c(`Aura y órbitas`),
      support: c(`Clima y apoyo`),
    })[e],
  YE = [`projectile`, `beam`, `area`, `melee`, `aura`, `support`];
function XE(e) {
  switch (e) {
    case `beam`:
      return c(`Anchura`);
    case `cone`:
      return c(`Alcance`);
    case `wave`:
      return c(`Anchura`);
    case `orbit`:
      return c(`Radio de giro`);
    case `dash`:
      return c(`Anchura`);
    case `chain`:
      return c(`Salto entre enemigos`);
    case `bolt`:
    case `barrage`:
    case `homing`:
    case `boomerang`:
    case `drain`:
      return c(`Tamaño del proyectil`);
    default:
      return c(`Radio`);
  }
}
var ZE = (e) => (e.cls === `physical` ? c(`Físico`) : c(`Especial`));
function QE(e, t) {
  if (e.arch === `random`) return [[c(`Cambia cada`), WE(e.cd) + ` s`]];
  if (e.arch === `weather` || e.arch === `buff`)
    return [
      [c(`Recarga`), WE(VE(e, t).cd) + ` s`],
      [c(`Duración`), WE(VE(e, t).dur) + ` s`],
    ];
  let n = VE(e, t),
    r = [];
  r.push([c(`Daño`), WE(n.real) + (n.count > 1 && ![`aura`, `orbit`].includes(e.arch) ? `×` + n.count : ``)]);
  let i = t.inst && t.inst.def.id === e.id ? t.inst : null,
    a = !!e.fusion && z_((i?.mods.area ?? 1) * t.stats.area);
  return (
    r.push([c(`Recarga`), WE(n.cd) + ` s` + (e.fusion && n.cd <= 0.6 ? ` ` + c(`(mín.)`) : ``)]),
    n.reach >= 1
      ? r.push([c(`Alcance`), WE(n.reach) + ` 厘米`])
      : n.area >= 1 &&
        r.push([
          XE(e.arch) === c(`Radio`) ? c(`Radio`) : c(`Área`),
          WE(n.area) + ` 厘米` + (a ? ` ` + c(`(máx.)`) : ``),
        ]),
    e.status && e.statusChance >= 0.12 && r.push([Qg[e.status] ?? e.status, GE(n.statusChance)]),
    r
  );
}
function $E(e, t, n) {
  let r = Ig[e];
  if (!r) return [];
  let i = [[c(`Daño por golpe`), WE(Lg(e, t, n))]];
  return (
    r.n && i.push([c(`Objetivos por vez`), String(r.n)]),
    r.every && i.push([c(`Cada`), WE(r.every) + ` s`]),
    r.life && i.push([c(`Dura`), WE(r.life) + ` s`]),
    r.status && r.chance && i.push([Qg[r.status] ?? r.status, GE(r.chance)]),
    i
  );
}
function eD(e, t = 1, n = 1, r = !1) {
  let i = $E(e, t, n);
  return i.length
    ? X(
        `div`,
        {
          class: `pz-nums pz-pfacts`,
          title: c(
            r
              ? `Con tu nivel y tu zona actuales`
              : `Al empezar: nivel 1, zona 1. Crece con el nivel y la zona.`,
          ),
        },
        ...i.map(([e, t]) => X(`span`, {}, X(`i`, {}, e), t)),
      )
    : null;
}
function tD(e, t) {
  let n = [];
  if (e.arch === `random`)
    return [
      [
        c(`Cambia cada`),
        WE(t.cd * 1) + ` s`,
        c(`Se convierte en un ataque al azar de la Liga, con tus mejoras.`),
      ],
    ];
  if (e.arch === `weather` || e.arch === `buff`) {
    if (
      (n.push([c(`Recarga`), WE(t.cd) + ` s`]), n.push([c(`Duración`), WE(t.dur) + ` s`]), e.arch === `buff`)
    ) {
      for (let e of ev)
        n.push([
          e.stat === `moveSpeed` ? c(`Velocidad de movimiento`) : (tv[e.stat]?.[0] ?? e.stat),
          `+` + Math.round(((e.mul ?? 1) - 1) * 100) + `%`,
          c(`Mientras dura el potenciador.`),
        ]);
      (n.push([
        c(`Activo`),
        GE(Math.min(1, t.dur / Math.max(0.1, t.cd))) + ` ` + c(`del tiempo`),
        c(`Duración entre recarga: cuánto del tiempo lo tienes activo.`),
      ]),
        n.push([
          c(`Acumulable`),
          c(`No`),
          c(`Lanzar otro potenciador (o el mismo) solo renueva la duración: los bonos no se suman.`),
        ]));
    }
    return n;
  }
  if (
    (e.power > 0 &&
      n.push([
        c(`Potencia`),
        String(e.power),
        c(`La potencia del movimiento original: decide cuánto daño base hace.`),
      ]),
    n.push([
      c(`Daño por golpe`),
      WE(t.real),
      t.stab > 1 ? c(`Incluye ×{n} por ser de tu mismo tipo`, { n: UE(t.stab * 100) / 100 }) : void 0,
    ]),
    (e.arch === `beam` || e.arch === `cone`) && n.push([c(`Golpes`), c(`continuos mientras dura`)]),
    t.use != null &&
      (t.count > 1 || t.pulses > 1) &&
      n.push([c(`Daño por uso`), WE(t.use), c(`Sobre un solo objetivo, si todos los golpes aciertan.`)]),
    t.dps != null &&
      n.push([
        c(`Daño por segundo`),
        `≈ ` + WE(t.dps),
        c(`Contra un solo objetivo y sin críticos: una estimación para comparar movimientos.`),
      ]),
    n.push([
      e.arch === `aura` || e.arch === `trail` ? c(`Cada`) : c(`Recarga`),
      WE(t.cd) + ` s`,
      e.fusion && t.cd <= 0.6 ? c(`Una fusión no recarga en menos de 0,6 s.`) : void 0,
    ]),
    t.count > 1 && ![`aura`, `spin`, `nova`].includes(e.arch))
  ) {
    let r = [`strike`, `dash`, `smite`, `meteor`].includes(e.arch)
      ? c(`Golpes a la vez`)
      : e.arch === `orbit`
        ? c(`Objetos orbitando`)
        : e.arch === `chain`
          ? c(`Saltos`)
          : c(`Proyectiles`);
    n.push([r, String((e.arch, t.count))]);
  }
  return (
    t.pulses > 1 && n.push([c(`Ondas`), String(t.pulses)]),
    t.reach >= 1 &&
      n.push([
        e.arch === `dash` ? c(`Distancia`) : e.arch === `beam` ? c(`Longitud`) : c(`Alcance`),
        WE(t.reach) + ` 厘米`,
      ]),
    t.area >= 0.8 &&
      e.arch !== `dash` &&
      !(e.arch === `cone` && t.reach >= 1) &&
      n.push([
        XE(e.arch),
        WE(t.area) + ` 厘米`,
        e.fusion && t.area >= e.area * 3.39
          ? c(`Una fusión no crece más de ×3,4 su radio base, tengas el Área que tengas.`)
          : void 0,
      ]),
    t.dur > 0 &&
      [`beam`, `cone`, `orbit`, `trap`, `vortex`, `trail`].includes(e.arch) &&
      n.push([c(`Duración`), WE(t.dur) + ` s`]),
    e.speed > 0 &&
      [`bolt`, `orb`, `homing`, `boomerang`, `drain`, `barrage`].includes(e.arch) &&
      n.push([c(`Velocidad`), WE(t.speed) + ` 厘米/秒`]),
    t.pierce >= 99 && [`beam`, `boomerang`, `dash`, `wave`, `cone`, `spin`, `nova`].includes(e.arch)
      ? n.push([c(`Perforación`), c(`Atraviesa todo`)])
      : t.pierce > 0 && g_[e.arch].stats.includes(`pierce`) && n.push([c(`Perforación`), `+` + t.pierce]),
    t.bounce > 0 && n.push([c(`Rebotes`), String(t.bounce)]),
    e.status &&
      e.statusChance >= 0.12 &&
      n.push([
        Qg[e.status] ?? e.status,
        GE(t.statusChance),
        c(`Probabilidad de aplicar el estado en cada golpe (con tu «Prob. de estado»).`),
      ]),
    n.push([
      c(`Crítico`),
      GE(t.crit) +
        (e.critBonus > 0 ? ` · ` + c(`+{pct}% propio`, { pct: Math.round(e.critBonus * 100) }) : ``),
      c(`Probabilidad de crítico en cada golpe: la tuya más la del movimiento.`),
    ]),
    e.drain > 0 && n.push([c(`Robo de vida`), GE(e.drain), c(`Parte del daño que recuperas como PS.`)]),
    n
  );
}
var nD = {
  dmg: c(`Daño`),
  cd: c(`Recarga`),
  count: c(`Cantidad`),
  area: c(`Área`),
  speed: c(`Velocidad`),
  dur: c(`Duración`),
  pierce: c(`Perforación`),
  crit: c(`Crítico`),
  status: c(`Prob. de estado`),
  bounce: c(`Rebotes`),
};
function rD(e, t) {
  switch (e) {
    case `dmg`:
      return `+` + Math.round(0.22 * t * 100) + `%`;
    case `cd`:
      return `-` + Math.round(Math.min(0.25, 0.08 * t) * 100) + `%`;
    case `count`:
      return `+` + (t >= 1.6 ? 2 : 1);
    case `pierce`:
    case `bounce`:
      return `+` + Math.max(1, Math.round(t));
    case `area`:
    case `speed`:
      return `+` + Math.round(0.15 * t * 100) + `%`;
    case `dur`:
      return `+` + Math.round(0.2 * t * 100) + `%`;
    case `crit`:
      return `+` + Math.round(0.05 * t * 100) + `%`;
    case `status`:
      return `+` + Math.round(0.25 * t * 100) + `%`;
  }
}
function iD(e, t) {
  if (e.arch === `random` || e.arch === `weather` || e.arch === `buff`) return null;
  let n = Array.from({ length: 8 }, (n, r) => VE(e, t, r + 1)),
    r = n[n.length - 1].real || 1,
    i = t.inst && t.inst.def.id === e.id ? t.inst.level : 0;
  return X(
    `div`,
    { class: `mv-levels` },
    ...n.map((e, t) =>
      X(
        `div`,
        { class: `mv-lv` + (t + 1 === i ? ` cur` : ``) },
        X(`i`, { style: { height: Math.max(4, Math.round((e.real / r) * 52)) + `px` } }),
        X(`b`, {}, WE(e.real)),
        X(`small`, {}, String(t + 1)),
      ),
    ),
  );
}
function aD(e) {
  let t = g_[e.arch],
    n = [e.cls === `physical` ? `physical` : `special`];
  return (
    t.stats.includes(`count`) && n.push(`projectiles`),
    t.stats.includes(`area`) && n.push(`area`),
    t.stats.includes(`dur`) && n.push(`duration`),
    t.stats.includes(`speed`) && n.push(`projSpeed`),
    e.status && e.arch !== `weather` && e.arch !== `buff` && n.push(`statusChance`, `statusDamage`),
    (e.arch === `bolt` || e.arch === `barrage`) && n.push(`bounces`),
    e.arch === `weather` || e.arch === `buff`
      ? { all: [`attackSpeed`, `duration`], specific: [`duration`] }
      : {
          all: [...n, `damage`, `attackSpeed`, `critChance`, `critDamage`, `eliteDamage`, `superEffective`],
          specific: n,
        }
  );
}
var oD = {
  "smooth-rock": (e) => e.arch === `bolt` || e.arch === `barrage`,
  "black-sludge": (e) => e.status === `poison`,
  "flame-orb": (e) => e.status === `burn`,
  "binding-band": (e) =>
    e.status === `root` ||
    e.status === `stun` ||
    e.status === `paralysis` ||
    e.status === `freeze` ||
    e.status === `sleep`,
};
function sD(e) {
  let { all: t, specific: n } = aD(e),
    r = new Set(t);
  return {
    stats: t,
    specific: n,
    items: tt.filter((t) =>
      dn[t.key]
        ? dn[t.key] === e.type
        : oD[t.key]
          ? oD[t.key](e)
          : t.mods.some((e) => r.has(e.stat) && ((e.mul ?? 1) > 1 || (e.add ?? 0) > 0)),
    ),
    vits: m.filter((e) => !e.dice && (r.has(e.stat) || e.extra?.some((e) => r.has(e.stat)))),
  };
}
var cD = (e) => k.items[e]?.name ?? sn.get(e)?.name ?? e;
function lD(e, t, n) {
  if (e === `item`) {
    let e = n.items?.get(t) ?? 0;
    return X(
      `span`,
      { class: `mv-chip` + (e ? ` have` : ``), title: sn.get(t)?.desc ?? `` },
      Q(t),
      cD(t),
      e ? X(`b`, {}, `×` + e) : null,
    );
  }
  let r = Ne.get(t),
    i = n.vitamins?.get(t);
  return X(
    `span`,
    { class: `mv-chip vit` + (i ? ` have` : ``), title: r.desc },
    Q(r.icon),
    r.name,
    i ? X(`b`, {}, c(`Nv. {lvl}`, { lvl: i.level })) : null,
  );
}
function uD(e, t, n, availableItem = () => true) {
  let r = sD(e),
    i = (e) => tv[e]?.[0] ?? e;
  r.items = r.items.filter(item => availableItem(item.key));
  if (e.arch === `weather` && r.items.length + r.vits.length === 0) return null;
  let a = X(`div`, { class: `mv-sec` }, X(`small`, {}, c(`Lo que lo mejora`))),
    o = new Set(r.specific),
    s = (e) => ({
      items: r.items.filter(
        (t) =>
          !dn[t.key] &&
          !oD[t.key] &&
          t.mods.some((t) => t.stat === e && ((t.mul ?? 1) > 1 || (t.add ?? 0) > 0)),
      ),
      vits: r.vits.filter((t) => t.stat === e),
    }),
    l = r.items.filter((e) => dn[e.key] || oD[e.key]);
  if (!n) {
    a.append(X(`p`, { class: `mv-stats` }, r.stats.map(i).join(` · `)));
    let e = [],
      n = new Set(),
      o = (r, i) => {
        let a = r + i;
        n.has(a) || (n.add(a), e.push(lD(r, i, t)));
      };
    for (let e of l) o(`item`, e.key);
    for (let e of r.specific) {
      let t = s(e);
      (t.vits.forEach((e) => o(`vit`, e.key)), t.items.forEach((e) => o(`item`, e.key)));
    }
    for (let e of r.vits) t.vitamins?.has(e.key) && o(`vit`, e.key);
    for (let e of r.items) t.items?.has(e.key) && o(`item`, e.key);
    let u = e.slice(0, 10);
    return (
      u.length && a.append(X(`div`, { class: `mv-chips` }, ...u)),
      e.length > u.length &&
        a.append(
          X(
            `p`,
            { class: `mv-more` },
            c(`y {n} más: toca el movimiento para verlos todos`, { n: e.length - u.length }),
          ),
        ),
      a
    );
  }
  for (let e of r.stats) {
    let n = s(e);
    (n.items.length || n.vits.length) &&
      a.append(
        X(
          `div`,
          { class: `mv-group` },
          X(`b`, {}, i(e), o.has(e) ? X(`i`, {}, c(`específico`)) : null),
          X(
            `div`,
            { class: `mv-chips` },
            ...n.vits.map((e) => lD(`vit`, e.key, t)),
            ...n.items.map((e) => lD(`item`, e.key, t)),
          ),
        ),
      );
  }
  return (
    l.length &&
      a.append(
        X(
          `div`,
          { class: `mv-group` },
          X(`b`, {}, c(`Solo para este movimiento`), X(`i`, {}, c(`específico`))),
          X(`div`, { class: `mv-chips` }, ...l.map((e) => lD(`item`, e.key, t))),
        ),
      ),
    a
  );
}
function dD(e) {
  let t = k.moves.get(e)?.key;
  return t ? y.filter((e) => e.kit.includes(t)).map((e) => e.id) : [];
}
function fD(e, t, n = !1, r) {
  let i = VE(e, t),
    a = g_[e.arch],
    o = t.inst && t.inst.def.id === e.id ? t.inst : null,
    s = dD(e.id),
    l =
      s.length === 1
        ? c(`Exclusivo de {name}`, { name: k.get(s[0]).name })
        : s.length > 1
          ? c(`Kit de {n} miembros`, { n: s.length })
          : null,
    u = tD(e, i),
    d = X(
      `div`,
      { class: `tt-card mv-sheet` + (n ? ` full` : ``), style: { "--tc": YC(Ni[e.type]) } },
      X(
        `div`,
        { class: `tt-head` },
        ZC(e.type, 30),
        X(`div`, {}, X(`b`, {}, e.name), X(`small`, {}, `${Pi[e.type]} · ${ZE(e)} · ${a.label}`)),
      ),
      l ? X(`span`, { class: `mv-badge` }, Z(`check`, 12), l) : null,
      o
        ? X(
            `span`,
            { class: `mv-badge own` },
            e.fusion
              ? c(`Fusión ★{lvl} de ★{max}`, {
                  lvl: o.level,
                  max: Math.max(5 + +!!t.items?.has(`tm-case`), o.level),
                })
              : c(`Nivel {lvl} de {max}`, {
                  lvl: o.level,
                  max: Math.max(8 + (t.items?.has(`tm-case`) ? 2 : 0), o.level),
                }),
          )
        : null,
      X(`p`, {}, e.desc),
      X(
        `div`,
        { class: `mv-facts` },
        ...u.flatMap(([e, t, n]) => [X(`span`, { title: n ?? `` }, e), X(`b`, { title: n ?? `` }, t)]),
      ),
    );
  if (e.arch !== `random` && e.arch !== `weather` && e.arch !== `buff`) {
    let r = iD(e, t),
      i = e.fusion ? 5 : 8,
      s = VE(e, t, 1).real,
      l = VE(e, t, i).real,
      u = X(
        `div`,
        { class: `mv-sec` },
        X(`small`, {}, c(`Cómo crece por nivel`)),
        X(
          `p`,
          { class: `mv-scale` },
          c(`Daño por golpe: Nv. 1 {a} → Nv. {max} {b} (×{x}) solo por subir de nivel.`, {
            a: WE(s),
            max: i,
            b: WE(l),
            x: UE(l / (s || 1)),
          }),
        ),
      );
    if (o && e.fusion) {
      let e = o.mods,
        t = [];
      (e.dmg > 1.005 && t.push(`${nD.dmg} +${Math.round((e.dmg - 1) * 100)}%`),
        e.cd < 0.995 && t.push(`${nD.cd} -${Math.round((1 - e.cd) * 100)}%`),
        e.area > 1.005 && t.push(`${nD.area} +${Math.round((e.area - 1) * 100)}%`),
        e.count > 0 && t.push(`${nD.count} +${e.count}`),
        e.dur > 1.005 && t.push(`${nD.dur} +${Math.round((e.dur - 1) * 100)}%`),
        e.crit > 5e-4 && t.push(`${nD.crit} +${Math.round(e.crit * 100)}%`),
        u.append(
          X(
            `p`,
            { class: `mv-note` },
            t.length
              ? c(
                  `Mejoras heredadas de los dos movimientos (sumadas) y de las cartas desde la fusión: {list}`,
                  { list: t.join(`, `) },
                )
              : c(
                  `Hereda la suma de las mejoras de los dos movimientos que la forman; aún no tiene ninguna.`,
                ),
          ),
        ));
    }
    n && r && u.append(r);
    let f = a.stats;
    (n
      ? (u.append(
          X(
            `p`,
            { class: `mv-note` },
            c(
              `Cada subida de nivel del movimiento ofrece además 2 mejoras al azar (3 si es una tarjeta épica o legendaria) de esta lista, de común a legendaria:`,
            ),
          ),
        ),
        u.append(
          X(
            `div`,
            { class: `mv-ups` },
            ...f.map((e) => X(`span`, {}, X(`i`, {}, nD[e]), `${rD(e, E[0])} → ${rD(e, E[4])}`)),
          ),
        ))
      : u.append(
          X(
            `p`,
            { class: `mv-note` },
            c(`Al subirlo ofrece mejoras al azar de: {list}`, { list: f.map((e) => nD[e]).join(`, `) }),
          ),
        ),
      d.append(u));
  }
  return (
    r && d.append(X(`p`, { class: `mv-note` }, r)),
    d.append(
      X(
        `p`,
        { class: `mv-basis` },
        t.basis + `. ` + c(`Daño contra un enemigo sin ventaja ni resistencia y sin críticos.`),
      ),
    ),
    d
  );
}
function pD(e, t, n, r, i, inspect) {
  const open=()=>{
    uw();
    if(inspect)inspect(t,n(),i,e);
    else mD(t,n(),r,i);
  };
  return (
    !inspect && pw(e, () => fD(t, n(), !1, i), !1),
    e.classList.add(`mv-clickable`),
    e.hasAttribute(`tabindex`) || (e.tabIndex = 0),
    e.addEventListener(`click`, open),
    e.addEventListener(`keydown`, (a) => {
      a.key === `Enter` &&
        a.target === e &&
        (a.preventDefault(), a.stopPropagation(), open());
    }),
    e
  );
}
function mD(e, t, n, r) {
  let i = document.activeElement,
    a,
    o = !1,
    s = () => {
      o || ((o = !0), removeEventListener(`keydown`, l, !0), a?.(), u.remove(), team?.classList.remove('zx-under-team'), i?.focus?.());
    },
    l = (e) => {
      (e.stopImmediatePropagation(), e.key === `Escape` && (e.preventDefault(), N.click(), s()));
    },
    u = X(
      `div`,
      {
        class: `mp-ov mv-ov`,
        onclick: (e) => {
          e.target === u && s();
        },
      },
      X(
        `div`,
        {
          class: `mp-panel mv-panel`,
          role: `dialog`,
          "aria-label": e.name,
          style: { "--mc": YC(Ni[e.type]) },
        },
        X(
          `div`,
          { class: `mp-head` },
          X(`div`, {}, X(`b`, {}, e.name), X(`small`, {}, c(`Ficha del movimiento`))),
          X(
            `button`,
            {
              class: `btn small ghost`,
              onclick: () => {
                (N.click(), s());
              },
            },
            Z(`check`, 16),
            c(`Cerrar`),
          ),
        ),
        X(`div`, { class: `mv-scroll` }, fD(e, t, !0, r)),
      ),
    );
  const team=document.querySelector('.zx-team-overlay');
  if(team){teamDetail(u,e.name,u.querySelector('.mv-scroll'),s);team.classList.add('zx-under-team');}
  return (
    n ? (a = n(s)) : addEventListener(`keydown`, l, !0),
    document.body.append(u),
    u.querySelector(`button`)?.focus(),
    s
  );
}
var hD = (e, t, n, r = !0) =>
  X(
    `div`,
    { class: `mv-diff-row` + (r ? `` : ` bad`) },
    X(`span`, {}, e),
    X(`b`, {}, X(`s`, {}, t), ` → `, n),
  );
function gD(e, t, n, r) {
  let i = new M_(n.def);
  ((i.level = n.level), (i.mods = { ...n.mods }), F_(i, r));
  let a = VE(e, { ...t, inst: n }),
    o = VE(e, { ...t, inst: i }),
    s = [],
    l = (e, t) => Math.abs(e - t) > 1e-6;
  return (
    l(a.real, o.real) && s.push(hD(c(`Daño por golpe`), WE(a.real), WE(o.real))),
    l(a.cd, o.cd) && s.push(hD(c(`Recarga`), WE(a.cd) + ` s`, WE(o.cd) + ` s`)),
    a.count !== o.count &&
      s.push(
        hD(e.arch === `orbit` ? c(`Objetos orbitando`) : c(`Proyectiles`), String(a.count), String(o.count)),
      ),
    l(a.reach, o.reach) && o.reach >= 1 && s.push(hD(c(`Alcance`), WE(a.reach) + ` 厘米`, WE(o.reach) + ` 厘米`)),
    l(a.area, o.area) && e.area >= 0.8 && s.push(hD(XE(e.arch), WE(a.area) + ` 厘米`, WE(o.area) + ` 厘米`)),
    l(a.dur, o.dur) && e.dur > 0 && s.push(hD(c(`Duración`), WE(a.dur) + ` s`, WE(o.dur) + ` s`)),
    l(a.speed, o.speed) &&
      e.speed > 0 &&
      s.push(hD(c(`Velocidad`), WE(a.speed) + ` 厘米/秒`, WE(o.speed) + ` 厘米/秒`)),
    a.pierce !== o.pierce &&
      o.pierce < 99 &&
      s.push(hD(c(`Perforación`), String(a.pierce), String(o.pierce))),
    a.bounce !== o.bounce && s.push(hD(c(`Rebotes`), String(a.bounce), String(o.bounce))),
    l(a.crit, o.crit) && s.push(hD(c(`Crítico`), GE(a.crit), GE(o.crit))),
    l(a.statusChance, o.statusChance) &&
      e.status &&
      s.push(hD(Qg[e.status] ?? e.status, GE(a.statusChance), GE(o.statusChance))),
    s
  );
}
function _D(e, t) {
  let n = tv[e]?.[1] ?? `flat`;
  return e === `critChance`
    ? t >= 0.9999
      ? c(`100% (máx.)`)
      : GE(t)
    : e === `evasion` && t >= 0.5999
      ? c(`60% (máx.)`)
      : n === `mult` || n === `pctpts`
        ? +(t * 100).toFixed(1) + `%`
        : String(Math.abs(t) >= 100 ? Math.round(t) : UE(t));
}
function vD(e, t) {
  let n = iv.get(e);
  return n != null && n > 1.0001
    ? n >= 1.9999
      ? c(`200% (máx.)`)
      : Math.round(n * 100) + `%`
    : _D(`critChance`, t);
}
function yD(e) {
  let t = iv.get(e);
  return t == null || t <= 1.0001
    ? null
    : t > 2.0001
      ? c(
          `Tienes {pct}% en total: 100% de crítico y 100% de megacrítico, el máximo. Lo que pase del 200% no sirve de nada.`,
          { pct: Math.round(t * 100) },
        )
      : c(
          `Tienes {pct}% en total: lo que pasa del 100% ({over}%) es tu probabilidad de megacrítico, un crítico aún más fuerte.`,
          { pct: Math.round(t * 100), over: Math.round((t - 1) * 100) },
        );
}
function bD(e, t) {
  let n = Ne.get(t.vit);
  if (!n || n.stat === `difficulty` || n.dice) return null;
  let r = e.player.stats,
    i = r[n.stat],
    a = n.per * E[t.rarity],
    o = e.player.vitamins.get(t.vit)?.acc ?? 0,
    s = n.kind === `add` ? i + a : (i * (1 + n.per * o + a)) / (1 + n.per * o),
    l = tv[n.stat]?.[0] ?? n.stat;
  if (n.stat === `critChance` && i >= 0.9999) {
    let e = r.megaCrit;
    return X(
      `div`,
      { class: `mv-diff` },
      hD(tv.megaCrit[0], _D(`megaCrit`, e), _D(`megaCrit`, Math.min(1, e + a))),
      X(`small`, {}, c(`Ya tienes el 100% de crítico: lo que sube es la probabilidad de megacrítico.`)),
    );
  }
  return X(`div`, { class: `mv-diff` }, hD(l, _D(n.stat, i), _D(n.stat, s)));
}
function xD(e, t) {
  let n = SD(e, t);
  if (!n) return null;
  n.classList.add(`mv-diff-card`);
  let r = t.kind === `newMove` ? 2 : 1;
  for (let e of [...n.querySelectorAll(`.mv-diff-row`)].slice(r)) e.remove();
  return n;
}
function SD(e, t) {
  let n = e.player;
  if (t.kind === `newMove`) {
    let n = O_(t.id);
    return n
      ? X(
          `div`,
          { class: `mv-diff` },
          ...QE(n, RE(e)).map(([e, t]) =>
            X(`div`, { class: `mv-diff-row` }, X(`span`, {}, e), X(`b`, {}, t)),
          ),
        )
      : null;
  }
  if (t.kind === `upMove`) {
    let r = n.moves[t.slot];
    if (!r) return null;
    let i = gD(r.def, RE(e, r), r, t.ups);
    return i.length ? X(`div`, { class: `mv-diff` }, ...i) : null;
  }
  return bD(e, t);
}
function CD(e) {
  let t = [];
  for (let n of e.player.moves)
    n && t.push({ name: n.def.name, type: n.def.type, dmg: n.damageDone, lvl: n.level });
  e.stats.ultDamage > 0 && t.push({ name: c(`Ultimate`), dmg: e.stats.ultDamage });
  let n = Object.entries(e.stats.itemDamage)
    .filter(([, e]) => e > 0)
    .sort((e, t) => t[1] - e[1])
    .reduce((e, [, t]) => e + t, 0);
  n > 0 && t.push({ name: c(`Objetos`), dmg: n });
  let r = e.allies.list.reduce((e, t) => e + t.damage, 0);
  (r > 0 && t.push({ name: c(`Alfas de apoyo`), dmg: r }), t.sort((e, t) => t.dmg - e.dmg));
  let i = t.reduce((e, t) => e + t.dmg, 0);
  return !t.length || i <= 0
    ? null
    : X(
        `div`,
        { class: `mv-dmg` },
        ...t.map((e) => {
          let t = e.dmg / i;
          return X(
            `div`,
            { class: `mv-dmg-row`, style: { "--c": e.type ? YC(Ni[e.type]) : `var(--ink-2)` } },
            e.type ? ZC(e.type, 22) : X(`span`, { class: `mv-dmg-dot` }),
            X(
              `div`,
              {},
              X(
                `div`,
                { class: `mv-dmg-top` },
                X(`b`, {}, e.name),
                e.lvl ? X(`span`, {}, c(`Nv. {lvl}`, { lvl: e.lvl })) : null,
              ),
              X(
                `div`,
                { class: `pz-share` },
                X(`i`, { style: { width: Math.max(1, Math.round(t * 100)) + `%` } }),
              ),
              X(
                `small`,
                {},
                c(`{dmg} de daño · {pct}%`, { dmg: P(Math.round(e.dmg)), pct: Math.round(t * 100) }),
              ),
            ),
          );
        }),
      );
}
function wD(e, t, n = e.dpsLog.rates(e)) {
  let r = n.dps[t] ?? 0,
    i = Math.round(Math.min(15, Math.max(1, e.time), n.span[t] ?? 15));
  return X(
    `small`,
    {
      class: `pz-dps`,
      title: c(
        `Daño medio por segundo de este movimiento en los últimos {s} s de juego, para comparar tus ataques.`,
        { s: i },
      ),
    },
    X(`b`, {}, WE(r)),
    ` `,
    c(`daño/s`),
    ` `,
    X(`i`, {}, c(`(últimos {s} s)`, { s: i })),
  );
}
function TD(e) {
  let { totals: t, dps: n } = e.dpsLog.rates(e),
    r = [];
  (e.stats.ultimates > 0 || t[`#ult`] > 0) &&
    r.push({
      name: c(`Ultimate`),
      dmg: t[Nb],
      dps: n[Nb],
      note: e.stats.ultimates ? c(`{n} lanzadas`, { n: e.stats.ultimates }) : void 0,
    });
  for (let [n, i] of Object.entries(e.stats.forgotten))
    e.player.moves.some((e) => e?.def.key === n) ||
      r.push({ name: i.name, note: c(`olvidado`), dmg: t[n] ?? i.dmg, dps: 0, type: i.type });
  if (
    (t[`#allies`] > 0 && r.push({ name: c(`Alfas de apoyo`), dmg: t[Pb], dps: n[Pb] }),
    t[`#other`] > 0 && r.push({ name: c(`Pasiva y objetos`), dmg: t[Mb], dps: n[Mb], note: c(`el resto`) }),
    !r.length)
  )
    return null;
  let i = Math.max(1, e.stats.damage);
  return X(
    `div`,
    { class: `pz-others` },
    X(`div`, { class: `tag` }, c(`Otras fuentes de daño`)),
    ...r.map((e) =>
      X(
        `div`,
        { class: `pz-other`, style: { "--c": e.type ? YC(Ni[e.type]) : `var(--ink-2)` } },
        e.type ? ZC(e.type, 20) : X(`span`, { class: `mv-dmg-dot` }),
        X(
          `div`,
          { class: `grow` },
          X(`div`, { class: `pz-mh` }, X(`b`, {}, e.name), e.note ? X(`span`, {}, e.note) : null),
          X(
            `small`,
            {},
            c(`{dmg} de daño · {pct}%`, { dmg: P(Math.round(e.dmg)), pct: Math.round((e.dmg / i) * 100) }),
            e.dps > 0 ? ` · ` + WE(e.dps) + ` ` + c(`daño/s`) : ``,
          ),
        ),
      ),
    ),
  );
}
function ED(e, t) {
  return e.banished.has(`m` + t)
    ? X(
        `em`,
        { class: `ban-tag`, title: c(`Desterraste sus mejoras: no volverá a mejorar en esta partida.`) },
        c(`Desterrado`),
      )
    : null;
}
var DD = (e) =>
    ({
      signature: c(`Fusión de firma`),
      reaction: c(`Reacción`),
      type: c(`Fusión de tipo`),
      glitch: c(`Fallo de la máquina`),
    })[e],
  OD = { signature: 0, reaction: 1, type: 2, glitch: 3 },
  kD = (e) => c(e === `physical` ? `Físico` : `Especial`),
  AD = (e) => (dS(e) ? (O_(fS(e)) ?? null) : null),
  jD = (e) => O_(fS(e.key)),
  MD = (e) => ({ "--rc": wx[e.kind], "--t1": YC(Ni[e.type]), "--t2": YC(Ni[e.type2 ?? e.type]) });
function ND(e, t = 30) {
  return X(
    `span`,
    { class: `fi-types` },
    ZC(e.type, t),
    e.type2 && e.type2 !== e.type ? ZC(e.type2, t) : null,
  );
}
function catalogFusionIcon(def){
  if(def.member)return rw(def.member);
  const dual=def.type2 && def.type2!==def.type;
  const art=ND(def,dual?22:32);
  art.classList.add('zc-fusion-types');
  return art;
}
function catalogMoveMeta(move){
  const types=move.type2 && move.type2!==move.type ? Pi[move.type]+' / '+Pi[move.type2] : Pi[move.type];
  return [types,ZE(move),g_[move.arch].label].join(' · ');
}
function PD(e) {
  let t = (e) => X(`span`, { class: `fi-type`, style: { "--tc": YC(Ni[e]) } }, ZC(e, 16), Pi[e]);
  return e.kind === `glitch`
    ? X(
        `div`,
        { class: `fi-tags` },
        X(`span`, { class: `fi-type`, style: { "--tc": `#7a7498` } }, c(`Tipo al azar`)),
        X(`span`, { class: `fi-cls rand` }, c(`Físico o Especial al azar`)),
        X(`span`, { class: `fi-shape`, title: g_.fusion.desc }, g_.fusion.label),
      )
    : X(
        `div`,
        { class: `fi-tags` },
        t(e.type),
        e.type2 && e.type2 !== e.type ? t(e.type2) : null,
        X(
          `span`,
          {
            class: `fi-cls ` + e.cls,
            title:
              e.cls === `physical`
                ? c(`Lo mejora la estadística Físico`)
                : c(`Lo mejora la estadística Especial`),
          },
          kD(e.cls),
        ),
        X(`span`, { class: `fi-shape`, title: g_.fusion.desc }, g_.fusion.label),
        e.status ? X(`span`, { class: `fi-st` }, Qg[e.status] ?? e.status) : null,
      );
}
function FD(e, t, n, r) {
  return X(
    `span`,
    { class: `fu-chip` + (r ? ` have` : ``), style: { "--tc": YC(Ni[t]) } },
    ZC(t, 16),
    e,
    n ? X(`small`, {}, kD(n)) : null,
  );
}
function ID(e) {
  return X(
    `span`,
    { class: `fu-chip any`, style: { "--tc": YC(Ni[e[0]]) } },
    ...e.map((e) => ZC(e, 16)),
    c(`Ataque {type}`, { type: e.map((e) => Pi[e]).join(` / `) }),
  );
}
function LD(e, t) {
  return X(`div`, { class: `mp-nums` }, ...QE(jD(e), t).map(([e, t]) => X(`span`, {}, X(`i`, {}, e), t)));
}
function RD(e, t, n) {
  return e.kind === `glitch` || !t || !n || t.cls !== n.cls || t.cls === e.cls
    ? null
    : X(
        `p`,
        { class: `fi-warn` },
        c(`Ojo: tus dos movimientos son {a}, pero esta fusión es {b}.`, {
          a: t.cls === `physical` ? c(`Físicos`) : c(`Especiales`),
          b: e.cls === `physical` ? c(`Físico`) : c(`Especial`),
        }),
      );
}
var zD = (e) => e.arch !== `weather` && e.arch !== `buff` && e.arch !== `fusion`;
function BD(e) {
  let t = [...new Map(e.filter(zD).map((e) => [e.id, e])).values()],
    n = new Map(t.map((e) => [e.key, e])),
    r = [];
  for (let e of lS)
    if (e.ingredientPairs) {
      for (const [left, right] of e.ingredientPairs) {
        const a = n.get(left), b = n.get(right);
        if (a && b) r.push({r: e, a, b});
      }
    } else if (e.kind === `reaction` && e.pair) {
      let n = t.filter((t) => e.pair[0].includes(t.type)),
        i = t.filter((t) => e.pair[1].includes(t.type));
      n.length &&
        i.length &&
        r.push({ r: e, ta: [...new Set(n.map((e) => e.type))], tb: [...new Set(i.map((e) => e.type))] });
    } else
      e.kind === `type`
        ? t.filter((t) => t.type === e.type).length >= 2 && r.push({ r: e, ta: [e.type], tb: [e.type] })
        : e.kind === `glitch` && t.length >= 2 && r.push({ r: e });
  return r.sort((e, t) => OD[e.r.kind] - OD[t.r.kind]);
}
function VD(e, t) {
  let n = e.r,
    r =
      e.a && e.b
        ? [
            FD(e.a.name, e.a.type, e.a.cls, t.owned?.has(e.a.id)),
            X(`b`, {}, `+`),
            FD(e.b.name, e.b.type, e.b.cls, t.owned?.has(e.b.id)),
          ]
        : e.ta && e.tb
          ? [ID(e.ta), X(`b`, {}, `+`), ID(e.tb)]
          : [X(`span`, { class: `fu-chip any` }, c(`Cualquier otra pareja`))],
    i = t.made?.has(n.key);
  if(t.catalog){
    const move=jD(n);
    const recipe=X('div',{class:'fu-pair'},...r);
    const art=catalogFusionIcon(n);
    return KD(move,{text:DD(n.kind)},recipe,false,t.ctx,t,{fusion:true,art});
  }
  return pD(
    X(
      `div`,
      { class: `mp-move fi-card` + (i ? ` made` : ``), style: MD(n) },
      n.member ? X(`span`, { class: `fi-art` }, rw(n.member)) : ND(n, 26),
      X(
        `div`,
        { class: `mp-tx` },
        X(
          `div`,
          { class: `mp-top` },
          X(`b`, {}, n.name),
          X(
            `span`,
            { class: `mp-tags` },
            i ? X(`span`, { class: `mp-tag first` }, c(`Hecha`)) : null,
            X(`span`, { class: `mp-tag fi-kind` }, DD(n.kind)),
          ),
        ),
        X(`div`, { class: `fu-pair` }, ...r),
        X(`div`, { class: `fi-to` }, X(`i`, { class: `fi-arrow` }, `→`), PD(n)),
        X(`p`, { class: `mp-desc` }, n.desc),
        LD(n, t.ctx),
      ),
    ),
    jD(n),
    () => t.ctx,
    t.overlay,
    undefined,
    t.inspect,
  );
}
function HD(e, t, n) {
  return X(
    `section`,
    { class: `mp-sec fi-sec` },
    X(`div`, { class: `tag` }, c(`Fusiones posibles`)),
    X(
      `p`,
      { class: `mp-hint` },
      n ?? (t.catalog ? '两项技能达到融合等级后，可在订书机组合。' :
        `两项技能各达到 ${fusionRequiredLevel} 级后，可在订书机按指定配方、属性反应或已开放的同属性配方融合。没有对应配方的组合不能融合。`),
    ),
    e.length
      ? X(`div`, { class: `mp-grid fi-grid` }, ...e.map((e) => VD(e, t)))
      : X(`p`, { class: `mp-none` }, c(`Ninguna fusión con estos filtros.`)),
  );
}
function UD(e, t, n, r, i) {
  let a = e.r,
    o = t[0],
    s = t[1];
  return pD(
    X(
      `div`,
      { class: `mp-move fi-card` + (e.ready ? `` : ` off`) + (i ? ` made` : ``), style: MD(a) },
      a.member ? X(`span`, { class: `fi-art` }, rw(a.member)) : ND(a, 26),
      X(
        `div`,
        { class: `mp-tx` },
        X(
          `div`,
          { class: `mp-top` },
          X(`b`, {}, a.name),
          X(
            `span`,
            { class: `mp-tags` },
            i ? X(`span`, { class: `mp-tag first` }, c(`Hecha`)) : null,
            X(`span`, { class: `mp-tag fi-kind` }, DD(a.kind)),
          ),
        ),
        X(
          `div`,
          { class: `fu-pair` },
          FD(e.names[0], e.types[0], o?.cls),
          X(`b`, {}, `+`),
          FD(e.names[1], e.types[1], s?.cls),
        ),
        X(`div`, { class: `fi-to` }, X(`i`, { class: `fi-arrow` }, `→`), PD(a)),
        X(`p`, { class: `mp-desc` }, a.desc),
        RD(a, o, s),
        e.ready
          ? X(`p`, { class: `fi-ready` }, c(`Lista para la Máquina de Bill`))
          : X(`p`, { class: `fi-need` }, c(`Te falta: {list}`, { list: e.need.join(` · `) })),
        LD(a, n),
      ),
    ),
    jD(a),
    () => n,
    r,
  );
}
function WD(e) {
  return X(
    `div`,
    { class: `gl-row fi-gl`, style: MD(e) },
    ND(e, 26),
    X(`div`, {}, X(`b`, {}, e.name), PD(e), X(`p`, {}, e.desc)),
  );
}
var GD = (e) => lS.filter((t) => t.kind === e);
function KD(e, t, n, r, i, a, o = {}) {
  let s = dD(e.id),
    l = o.kit && s.length === 1,
    u = [];
  if (a.catalog) {
    const level=t?.text??'';
    const badge=l?'专属':o.evo?'进阶':'';
    const node=X('div',{class:'mp-move zc-move-row'+(o.fusion?' fi-card':'')+(r?' off':''),role:'button'},
      X('div',{class:'zc-move-stamp','data-paper-surface':'move-stamp'},o.art??ZC(e.type,32)),
      X('div',{class:'mp-tx'},
        X('div',{class:'mp-top'},X('b',{},e.name),
          X('span',{class:'zc-move-level '+(t?.cls??'')},level)),
        X('div',{class:'zc-move-meta'},X('small',{},catalogMoveMeta(e)),
          badge?X('small',{class:'zc-move-badge'},badge):null),
        X('p',{class:'mp-desc'},e.desc),n??null));
    return pD(node,e,()=>i,a.overlay,undefined,a.inspect);
  }
  return (
    l &&
      u.push(
        X(
          `span`,
          { class: `mp-badge`, title: c(`Solo {name} lo tiene en su kit.`, { name: k.get(s[0]).name }) },
          c(`Exclusivo`),
        ),
      ),
    o.evo &&
      u.push(
        X(
          `span`,
          {
            class: `mp-badge mp-badge-evo`,
            title: c(`Lo aprende al evolucionar en {name}.`, { name: k.get(o.evo).name }),
          },
          c(`Evolución`),
        ),
      ),
    pD(
      X(
        `div`,
        { class: `mp-move` + (r ? ` off` : ``), style: { "--c": YC(Ni[e.type]) } },
        ZC(e.type, 32),
        X(
          `div`,
          { class: `mp-tx` },
          X(
            `div`,
            { class: `mp-top` },
            X(`b`, {}, e.name),
            X(
              `span`,
              { class: `mp-tags` },
              ...u,
              t ? X(`span`, { class: `mp-tag ` + (t.cls ?? ``) }, t.text) : null,
            ),
          ),
          X(`small`, {}, `${Pi[e.type]} · ${ZE(e)} · ${g_[e.arch].label}`),
          X(`p`, { class: `mp-desc` }, e.desc),
          X(`div`, { class: `mp-nums` }, ...QE(e, i).map(([e, t]) => X(`span`, {}, X(`i`, {}, e), t))),
          n ?? null,
        ),
      ),
      e,
      () => i,
      a.overlay,
      undefined,
      a.inspect,
    )
  );
}
var qD = (e) => (e > 1 ? c(`Desde Nv. {n}`, { n: e }) : c(`Desde el inicio`)),
  JD = [
    [`default`, () => c(`Orden de la lista`)],
    [`dps`, () => c(`Daño por segundo`)],
    [`dmg`, () => c(`Daño por golpe`)],
    [`cd`, () => c(`Recarga (menor primero)`)],
    [`reach`, () => c(`Alcance o radio`)],
    [`level`, () => c(`Nivel necesario`)],
  ];
function YD(e, t, n, r) {
  let i = e.roster;
  if (!i || e.any) return [];
  let a = n.inLeague ?? (() => !0),
    o = [];
  if (i.branch && t === i.id) o.push(...i.branch.filter((e) => k.hasSprite(e)));
  else {
    let e = t;
    for (let t = 0; t < 2; t++) {
      let t = k.evolutionsOf(e)[0];
      if (!t) break;
      (o.push(t.id), (e = t.id));
    }
  }
  let s = [];
  for (let e of o) {
    let t = Vb(e, i, k.get(e).types, a),
      o = new Set(r),
      c = [...t.line, ...t.shared.filter((e) => e.open)].filter((e) =>
        o.has(e.id) || n.owned?.has(e.id) || n.banned?.has(e.id) ? !1 : (o.add(e.id), !0),
      );
    c.length && s.push({ form: e, moves: c });
  }
  return s;
}
function XD(e, t = {}) {
  let n = t.species ?? e.roster?.id ?? 0,
    r = new Set([...e.kit, ...e.line, ...e.shared.filter((e) => e.open), ...(e.any ?? [])].map((e) => e.id));
  for (let i of YD(e, n, t, new Set(r))) for (let e of i.moves) r.add(e.id);
  for (let e of t.owned ?? []) r.add(e);
  for (let e of t.banned ?? []) t.owned?.has(e) || r.delete(e);
  return [...r].map((e) => formMove(e, n)).filter((e) => !!e);
}
function ZD(e, t = {}) {
  let n = t.inLeague ?? (() => !0),
    r = t.owned ?? new Set(),
    i = t.banned ?? new Set(),
    a = (e) => !r.has(e.id) && !i.has(e.id),
    o = (e) => t.level != null && t.level < e.level,
    s = t.species ?? e.roster?.id ?? 0,
    l = t.ctx ?? zE(k.get(s || 25), e.roster?.passive ?? ``, {}),
    u = { type: null, cls: `all`, shape: `all`, sort: `default` },
    d = X(`div`, { class: `mp-body` }),
    f = X(`div`, { class: `mp-content`, style: { display: `contents` } }),
    p = X(`span`, { class: `mp-count` }),
    m = new Set([...e.kit, ...e.line, ...e.shared, ...(e.any ?? [])].map((e) => e.id));
  for (let n of YD(
    e,
    s,
    t,
    new Set([...e.kit, ...e.line, ...e.shared.filter((e) => e.open), ...(e.any ?? [])].map((e) => e.id)),
  ))
    for (let e of n.moves) m.add(e.id);
  let h = [...m].map((e) => formMove(e, s)).filter((e) => !!e),
    g = [...new Set(h.map((e) => e.type))].sort(),
    _ = new Map();
  for (let e of h) {
    let t = qE(e.arch);
    (_.has(t) || _.set(t, new Set()), _.get(t).add(e.arch));
  }
  let v = new Map(),
    y = X(
      `div`,
      { class: `mp-bar-types` },
      ...g.map((e) => {
        let t = X(
          `button`,
          {
            class: `mp-ft`,
            title: Pi[e],
            "aria-label": Pi[e],
            onclick: () => {
              ((u.type = u.type === e ? null : e), T(), ie());
            },
          },
          ZC(e, 24),
        );
        return (v.set(e, t), t);
      }),
    ),
    b = new Map(),
    x = X(
      `div`,
      { class: `mp-seg` },
      ...[
        [`all`, c(`Todos`)],
        [`physical`, c(`Físico`)],
        [`special`, c(`Especial`)],
      ].map(([e, t]) => {
        let n = X(
          `button`,
          {
            onclick: () => {
              ((u.cls = e), T(), ie());
            },
          },
          t,
        );
        return (b.set(e, n), n);
      }),
    ),
    S = X(
      `select`,
      {
        "aria-label": c(`Forma`),
        onchange: () => {
          ((u.shape = S.value), ie());
        },
      },
      X(`option`, { value: `all` }, c(`Todas`)),
      ...YE.filter((e) => _.has(e)).map((e) =>
        X(
          `optgroup`,
          { label: JE(e) },
          X(`option`, { value: `g:` + e }, c(`Todo: {name}`, { name: JE(e) })),
          ...[..._.get(e)]
            .sort((e, t) => g_[e].label.localeCompare(g_[t].label))
            .map((e) => X(`option`, { value: `a:` + e }, g_[e].label)),
        ),
      ),
    ),
    C = X(
      `select`,
      {
        "aria-label": c(`Ordenar por`),
        onchange: () => {
          ((u.sort = C.value), ie());
        },
      },
      ...JD.map(([e, t]) => X(`option`, { value: e }, t())),
    ),
    w = X(
      `button`,
      {
        class: `btn small ghost mp-reset`,
        onclick: () => {
          ((u.type = null),
            (u.cls = `all`),
            (u.shape = `all`),
            (u.sort = `default`),
            (S.value = `all`),
            (C.value = `default`),
            T(),
            ie());
        },
      },
      c(`Quitar filtros`),
    ),
    T = () => {
      (v.forEach((e, t) => e.classList.toggle(`on`, u.type === t)),
        b.forEach((e, t) => e.classList.toggle(`on`, u.cls === t)));
    },
    E = X(
      `div`,
      { class: `mp-bar` },
      y,
      x,
      X(`label`, { class: `mp-sel` }, c(`Forma`), S),
      X(`label`, { class: `mp-sel` }, c(`Orden`), C),
      w,
      p,
    );
  let group='kit';
  const showGroup=key=>!t.catalog||key===group;
  if(t.catalog){
    f.style.display='flex';
    d.append(...t.catalog({hasAny:!!e.any,bar:E,count:p,results:f,select:key=>{group=key;ie();}}));
  }else d.append(E, f);
  let ee = (e) =>
      !(
        (u.type && e.type !== u.type) ||
        (u.cls !== `all` && e.cls !== u.cls) ||
        (u.shape.startsWith(`g:`) && qE(e.arch) !== u.shape.slice(2)) ||
        (u.shape.startsWith(`a:`) && e.arch !== u.shape.slice(2))
      ),
    D = (e, t) => {
      let n = VE(O_(e.id), l);
      switch (t) {
        case `dps`:
          return -(n.dps ?? (n.real * n.count) / Math.max(0.1, n.cd));
        case `dmg`:
          return -n.real;
        case `cd`:
          return n.cd;
        case `reach`:
          return -Math.max(n.reach, n.area);
        case `level`:
          return e.level;
        default:
          return 0;
      }
    },
    O = (e) => {
      let t = e.filter((e) => {
        let t = O_(e.id);
        return !!t && ee(t);
      });
      return u.sort === "default" ? t : t.sort((e, t) => D(e, u.sort) - D(t, u.sort) || e.level - t.level);
    },
    te = (title, hint, ...children) => {
      const kit=t.catalog && group==='kit';
      return X('section',{class:'mp-sec'},
        kit?X('div',{class:'zc-move-section-title'},X('b',{},'专属招式'),X('small',{},'习得等级')):X('div',{class:'tag'},title),
        X('p',{class:'mp-hint'},kit?'升级时更容易出现，达到对应等级后可习得。':hint),...children);
    },
    ne = (e) => ({ text: t.level != null && o(e) ? c(`Desde Nv. {n}`, { n: e.level }) : qD(e.level) }),
    re = BD(XD(e, t)),
    ie = () => {
      $(f);
      if(group==='kit' && t.kitIntro)f.append(t.kitIntro);
      let r = 0,
        i = (e) => {
          r += e;
        },
        d = O(e.kit.filter(a));
      if (
        (showGroup('kit') && d.length &&
          (i(d.length),
          f.append(
            te(
              c(`Kit propio`),
              c(
                `Sus cuatro ataques de firma. Salen más a menudo que cualquier otro, cada uno a partir de su nivel.`,
              ),
              X(
                `div`,
                { class: `mp-grid` },
                ...d.map((n) =>
                  KD(
                    formMove(n.id, s),
                    t.level == null
                      ? {
                          text: e.kit[0].id === n.id ? c(`Inicial`) : t.catalog?'Lv.'+n.level:c(`Nv. {n}`, { n: n.level }),
                          cls: e.kit[0].id === n.id ? `first` : ``,
                        }
                      : o(n)
                        ? { text: c(`Desde Nv. {n}`, { n: n.level }) }
                        : null,
                    null,
                    o(n),
                    l,
                    t,
                    { kit: !0 },
                  ),
                ),
              ),
            ),
          )),
        e.any)
      ) {
        let n = showGroup('any') ? O(e.any.filter(a)) : [];
        i(n.length);
        let r = new Map();
        for (let e of n) {
          let t = formMove(e.id, s);
          r.set(t.type, [...(r.get(t.type) ?? []), t]);
        }
        n.length &&
          f.append(
            te(
              c(`Cualquier ataque`),
              c(
                `Gen Ancestral: puede aprender cualquier ataque que haga daño con potencia 60 o más, de cualquier tipo. Pasa el ratón por uno para ver su ficha y púlsalo para abrirla entera.`,
              ),
              ...[...r]
                .sort((e, t) => t[1].length - e[1].length)
                .map(([e, n]) =>
                  X(
                    `div`,
                    { class: `mp-type`, style: { "--c": YC(Ni[e]) } },
                    X(
                      `div`,
                      { class: `mp-type-h` },
                      ZC(e, 22),
                      X(`b`, {}, Pi[e]),
                      X(`small`, {}, String(n.length)),
                    ),
                    X(
                      `div`,
                      { class: `mp-chips` },
                      ...(u.sort === "default" ? n.sort((e, t) => e.name.localeCompare(t.name)) : n).map(
                        (e) => pD(X(`span`, {}, e.name), e, () => l, t.overlay, undefined, t.inspect),
                      ),
                    ),
                  ),
                ),
            ),
          );
      } else if(showGroup('line')) {
        let n = O(e.line.filter(a));
        (i(n.length),
          (n.length || (!u.type && u.cls === `all` && u.shape === `all`)) &&
            f.append(
              te(
                c(`De su línea evolutiva`),
                c(`Lo que aprende subiendo de nivel él y sus formas anteriores.`),
                n.length
                  ? X(`div`, { class: `mp-grid` }, ...n.map((e) => KD(formMove(e.id, s), ne(e), null, o(e), l, t)))
                  : X(`p`, { class: `mp-none` }, c(`No le queda ninguno por aprender.`)),
              ),
            ));
      }
      let m = new Set(
          [...e.kit, ...e.line, ...e.shared.filter((e) => e.open), ...(e.any ?? [])].map((e) => e.id),
        ),
        h = showGroup('line') ? YD(e, s, t, m) : [];
      for (let r of h) {
        let a = O(r.moves);
        if (!a.length) continue;
        i(a.length);
        let o = k.get(r.form);
        f.append(
          X(
            `section`,
            { class: `mp-sec` },
            X(
              `div`,
              { class: `mp-evo-h`, style: { "--c": YC(Ni[o.types[0]]) } },
              rw(r.form),
              X(
                `div`,
                {},
                X(`div`, { class: `tag` }, c(`Al evolucionar en {name}`, { name: o.name })),
                X(
                  `p`,
                  { class: `mp-hint` },
                  e.roster?.branch
                    ? c(
                        `Es una de las evoluciones que puedes elegir: solo se te ofrecerán estos movimientos si eliges esta.`,
                      )
                    : c(`Cuando evoluciones podrás aprender también estos.`),
                ),
              ),
            ),
            X(
              `div`,
              { class: `mp-grid` },
              ...a.map((e) =>
                KD(
                  formMove(e.id, r.form),
                  { text: c(`Evolución`) },
                  `from` in e && e.from?.length
                    ? X(
                        `div`,
                        { class: `mp-from` },
                        X(`i`, {}, c(`Lo enseña`)),
                        ...e.from
                          .filter((e) => n(e))
                          .map((e) =>
                            X(
                              `span`,
                              { class: `mp-who`, title: k.get(e).name },
                              rw(e),
                              X(`small`, {}, k.get(e).name),
                            ),
                          ),
                      )
                    : null,
                  !1,
                  l,
                  t,
                  { evo: r.form },
                ),
              ),
            ),
          ),
        );
      }
      let g = e.shared.filter(a),
        _ = O(g.filter((e) => e.open)),
        v = g.length - g.filter((e) => e.open).length;
      showGroup('shared') && e.roster &&
        g.length &&
        (i(_.length),
        f.append(
          te(
            c(`Kits de otros miembros`),
            c(
              `Los miembros de tu Liga que comparten tipo con él le enseñan sus ataques de ese tipo o de tipo Normal.`,
            ),
            _.length
              ? X(
                  `div`,
                  { class: `mp-grid` },
                  ..._.map((e) =>
                    KD(
                      O_(e.id),
                      { text: o(e) ? c(`Desde Nv. {n}`, { n: e.level }) : qD(e.level) },
                      X(
                        `div`,
                        { class: `mp-from` },
                        X(`i`, {}, c(`Lo enseña`)),
                        ...e.from
                          .filter((e) => n(e))
                          .map((e) =>
                            X(
                              `span`,
                              { class: `mp-who`, title: k.get(e).name },
                              rw(e),
                              X(`small`, {}, k.get(e).name),
                            ),
                          ),
                      ),
                      o(e),
                      l,
                      t,
                    ),
                  ),
                )
              : X(
                  `p`,
                  { class: `mp-none` },
                  g.some((e) => e.open)
                    ? c(`Ninguno cumple los filtros.`)
                    : c(`Ninguno de tu Liga le enseña nada todavía.`),
                ),
            v
              ? X(
                  `p`,
                  { class: `mp-closed` },
                  Z(`lock`, 16),
                  c(
                    `{n} movimientos más de miembros que aún no están en tu Liga. Se revelan cuando se unan.`,
                    { n: v },
                  ),
                )
              : null,
          ),
        ));
      let y = re.filter(
        (e) =>
          (!u.type || e.r.type === u.type || e.r.type2 === u.type) && (u.cls === `all` || e.r.cls === u.cls),
      );
      (showGroup('fusion') && (y.length || (!u.type && u.cls === `all`)) &&
        f.append(HD(y, { ctx: l, overlay: t.overlay, inspect:t.inspect, catalog:t.catalog, owned: new Set(t.owned ?? []), made: t.made })),
        (t.catalog ? f.children.length-(group==='kit'&&t.kitIntro?1:0) : r) ||
          f.append(
            X(
              `p`,
              { class: `mp-none` },
              u.type || u.cls !== `all` || u.shape !== `all`
                ? c(`Ningún movimiento cumple los filtros.`)
                : c(`No hay más movimientos por conseguir.`),
            ),
          ),
        (p.textContent = t.catalog ? (group==='fusion' ? y.length+' 项融合' : r+' 项招式') : c(`{n} movimientos`, { n: r })),
        (w.style.display =
          u.type || u.cls !== `all` || u.shape !== `all` || u.sort !== "default" ? `` : `none`));
    };
  return (T(), ie(), d);
}
function QD(e, t, n, r, i = {}) {
  let a = document.activeElement,
    o = () => {
      (document.removeEventListener(`keydown`, s, !0), l.remove(), a?.focus?.());
    },
    s = (e) => {
      e.key === `Escape`
        ? (e.stopPropagation(), e.preventDefault(), N.click(), o())
        : l.contains(e.target) || e.stopPropagation();
    },
    l = X(
      `div`,
      {
        class: `mp-ov`,
        onkeydown: (e) => e.stopPropagation(),
        onclick: (e) => {
          e.target === l && o();
        },
      },
      X(
        `div`,
        { class: `mp-panel`, role: `dialog`, "aria-label": e, style: { "--mc": r } },
        X(
          `div`,
          { class: `mp-head` },
          X(`div`, {}, X(`b`, {}, e), X(`small`, {}, t)),
          X(
            `button`,
            {
              class: `btn small ghost`,
              onclick: () => {
                (N.click(), o());
              },
            },
            Z(`check`, 16),
            c(`Cerrar`),
          ),
        ),
        ZD(n, i),
      ),
    );
  return (document.addEventListener(`keydown`, s, !0), document.body.append(l), o);
}
var $D = (e) => e.kit.length + (e.any?.length ?? 0) + e.line.length + e.shared.length,
  eO = null,
  tO = () => !!eO,
  nO = () => {
    eO && eO();
  };
function rO(e) {
  let t = e.player.stats,
    n = e.player.baseBlock(),
    r = (e) => {
      let [r, i] = tv[e] ?? [e, `flat`],
        a = t[e],
        o = n[e],
        s =
          e === `critChance`
            ? vD(t, a)
            : e === `evasion`
              ? _D(e, a)
              : i === `mult` || i === `pctpts`
                ? `${Math.round(a * 100)}%`
                : e === `armor`
                  ? `${Math.round(a)} (-${Math.round(ov(a) * 100)}%)`
                  : String(e === `maxHp` ? Math.round(a) : Math.round(a * 10) / 10),
        c = a - o,
        l = e === `difficulty` || Math.abs(c) < 1e-4 ? 0 : c > 0 ? 1 : -1,
        u = e === `critChance` && yD(t);
      return X(
        `div`,
        { class: u ? `warn` : l > 0 ? `up` : l < 0 ? `down` : ``, title: u || `` },
        X(`span`, {}, r),
        X(`b`, {}, s),
      );
    },
    i = (e, t) => [X(`div`, { class: `pk-gtitle` }, e), ...t.map(r)],
    a = Object.entries(t.typeBoost)
      .filter(([, e]) => e && e > 1)
      .map(([e, t]) =>
        X(
          `div`,
          { class: `up` },
          X(`span`, {}, c(`Daño {type}`, { type: Pi[e] })),
          X(`b`, {}, `+${Math.round((t - 1) * 100)}%`),
        ),
      ),
    o = yD(t);
  return X(
    `div`,
    { class: `pk-stats` },
    ...i(c(`Ataque`), [
      `damage`,
      `physical`,
      `special`,
      `attackSpeed`,
      `projectiles`,
      `area`,
      `duration`,
      `projSpeed`,
      `critChance`,
      `critDamage`,
      `statusChance`,
      `statusDamage`,
      `eliteDamage`,
      `superEffective`,
    ]),
    ...a,
    o ? X(`p`, { class: `pk-note` }, o) : null,
    ...i(c(`Defensa`), [`maxHp`, `regen`, `armor`, `evasion`, `shieldMax`, `lifesteal`, `healing`, `thorns`]),
    ...i(c(`Utilidad`), [`moveSpeed`, `pickupRange`, `xpGain`, `gold`, `luck`, `extraJumps`, `difficulty`]),
  );
}
function iO(e, t) {
  let n = Zb(t),
    r = sn.get(t),
    i = e.player.items.get(t) ?? 0,
    a = LE(e, t, i || 1),
    o = Xb(
      e,
      r.mods.map((e) => e.stat),
    );
  return X(
    `div`,
    { class: `tt-card`, style: { "--tc": aw[n.rarity] } },
    X(
      `div`,
      { class: `tt-head` },
      Q(t),
      X(
        `div`,
        {},
        X(`b`, {}, n.name),
        X(`small`, {}, `${Le[n.rarity]} · ×${i}`),
      ),
    ),
    X(`p`, {}, n.desc),
    a.length
      ? X(`div`, { class: `tt-facts`, style: { display: `block` } }, ...a.map((e) => X(`div`, {}, e)))
      : null,
    o
      ? X(
          `div`,
          { class: `affects` + (o.length ? `` : ` none`) },
          o.length ? c(`Afecta a: {list}`, { list: o.join(` · `) }) : c(`Ninguno de tus ataques lo usa`),
        )
      : null,
  );
}
function aO(e) {
  let t = e.player,
    n = Math.max(1, e.stats.damage),
    r = (e, t, ...n) =>
      X(
        `section`,
        {},
        X(`div`, { class: `pk-h` }, X(`div`, { class: `tag` }, e), t ? X(`small`, {}, t) : null),
        ...n,
      ),
    i = uv(t.ability),
    a = e.dpsLog.rates(e),
    o = t.moves.filter(Boolean).map((t) => {
      let r = t,
        i = r.damageDone / n;
      return pD(
        X(
          `div`,
          { class: `pk-move`, style: { "--c": YC(Ni[r.def.type]) } },
          ZC(r.def.type, 30),
          X(
            `div`,
            { class: `grow` },
            X(
              `div`,
              { class: `mp-top` },
              X(`b`, {}, r.def.name),
              X(`span`, { class: `mp-tag` }, c(`Nv. {lvl}`, { lvl: r.level })),
              ED(e, r.def.id),
            ),
            X(`small`, { class: `muted` }, `${ZE(r.def)} · ${g_[r.def.arch].label}`),
            X(
              `div`,
              { class: `mp-nums` },
              ...QE(r.def, RE(e, r)).map(([e, t]) => X(`span`, {}, X(`i`, {}, e), t)),
            ),
            X(`div`, { class: `pz-share` }, X(`i`, { style: { width: `${Math.round(i * 100)}%` } })),
            X(
              `small`,
              {},
              c(`{dmg} de daño · {pct}%`, { dmg: P(Math.round(r.damageDone)), pct: Math.round(i * 100) }),
            ),
            wD(e, r.def.key, a),
          ),
        ),
        r.def,
        () => RE(e, r),
      );
    }),
    s = [...t.vitamins].map(([e, t]) => {
      let n = Ne.get(e);
      if (!n) return null;
      let r = Ve(n, t);
      return X(
        `div`,
        { class: `pk-vit` },
        Q(n.icon),
        X(
          `div`,
          {},
          X(`b`, {}, c(`{name} · Nv. {lvl}`, { name: n.name, lvl: t.level })),
          X(`small`, {}, r.map((e) => FE(e.stat, e.add, e.mul)).join(` · `)),
        ),
      );
    }),
    l = [...t.items]
      .map(([e, t]) => ({ k: e, n: t, def: sn.get(e) }))
      .filter((e) => e.def)
      .sort((e, t) => t.def.rarity - e.def.rarity || Zb(e.k).name.localeCompare(Zb(t.k).name)),
    u = l.reduce((e, t) => e + t.n, 0),
    d = e.allies.list.map((e) =>
      X(
        `div`,
        { class: `pz-ally` + (e.shiny ? ` shiny` : ``), title: Nm(e.types[0], e.shiny) },
        rw(e.species),
        X(`b`, {}, e.name),
        X(`small`, {}, Nm(e.types[0], e.shiny)),
      ),
    );
  return X(
    `div`,
    { class: `pk-body` },
    r(
      c(`Movimientos`),
      c(`{n} aprendidos`, { n: t.moves.filter(Boolean).length }),
      t.ability ? X(`p`, { class: `mp-hint` }, X(`b`, {}, t.abilityName), `: `, i.desc) : null,
      X(
        `div`,
        { class: `pk-moves` },
        ...(o.length ? o : [X(`p`, { class: `mp-none` }, c(`Sin movimientos.`))]),
      ),
      TD(e),
      X(
        `p`,
        { class: `mp-hint` },
        c(
          uo
            ? `Mantén pulsado un movimiento para ver su ficha.`
            : `Pasa el ratón por un movimiento para ver su ficha; púlsalo para abrirla entera.`,
        ),
      ),
      d.length ? X(`div`, { class: `tag` }, c(`Alfas de apoyo`)) : null,
      d.length ? X(`div`, { class: `pz-team` }, ...d) : null,
    ),
    r(
      c(`Objetos y vitaminas`),
      c(`{n} objetos`, { n: u }),
      l.length
        ? X(
            `div`,
            { class: `pk-items` },
            ...l.map(({ k: t, n, def: r }) =>
              pw(
                X(
                  `button`,
                  {
                    class: `pk-item`,
                    onclick:event=>{uw();showTeamItem(event.currentTarget,iO(e,t));},
                    style: { "--rc": aw[r.rarity] },
                    title: Zb(t).name,
                    "aria-label": Zb(t).name,
                  },
                  Q(t),
                  n > 1 ? X(`b`, {}, `×${n}`) : null,
                ),
                () => iO(e, t),
                !1,
              ),
            ),
          )
        : X(`p`, { class: `mp-none` }, c(`Aún no llevas objetos.`)),
      X(`div`, { class: `tag` }, c(`{n} vitaminas`, { n: t.vitamins.size })),
      s.length
        ? X(`div`, { class: `pk-vits` }, ...s)
        : X(`p`, { class: `mp-none` }, c(`Aún no llevas vitaminas.`)),
    ),
    r(c(`Estadísticas`), c(`Verde: mejor que de base`), rO(e)),
  );
}
function oO(e) {
  if (eO) return (eO(), !1);
  let t = document.activeElement,
    n = () => {
      (removeEventListener(`keydown`, r, !0), a.remove(), source?.classList.remove("zx-under-team"), (eO = null), t?.focus?.());
    },
    r = (e) => {
      document.querySelector(`.mv-ov`) ||
        (e.stopImmediatePropagation(),
        (e.code === `Tab` || e.key === `Escape`) && (e.preventDefault(), e.repeat || (N.click(), n())));
    },
    source=e.ui.modalEl,
    a=teamOverview(e,aO(e),k.get(e.player.speciesId).types.map(type=>XC(type)),()=>{N.click();n();});
  return (
    addEventListener(`keydown`, r, !0),
    source?.classList.add("zx-under-team"),
    document.body.append(a),
    (eO = n),
    a.querySelector(`button`)?.focus(),
    !0
  );
}
function sO(e) {
  return X(`div`, { class: `pk-row` }, cO(e));
}
function cO(e) {
  return X(
    `button`,
    {
      class: `btn ghost small pk-btn`,
      title: c(`Tus movimientos, objetos, vitaminas y estadísticas sin cerrar la elección`),
      onclick: () => oO(e),
    },
    Z(`check`, 18),
    c(`Ver mi equipo`),
    uo ? null : X(`kbd`, {}, `Tab`),
  );
}
function lO(e, t, n = !0) {
  let r = new Set(Qo().filter((e) => e === `Tab` || e === `Escape`)),
    i = (e) => {
      (r.delete(e.code), t() || removeEventListener(`keyup`, i, !0));
    };
  r.size && addEventListener(`keyup`, i, !0);
  let a = (i) => {
      t()
        ? tO() ||
          (r.has(i.code)
            ? i.code === `Tab` && i.preventDefault()
            : i.code === `Tab` && i.repeat && !i.ctrlKey && !i.altKey && !i.metaKey
              ? i.preventDefault()
              : (i.code === `Tab` || (n && i.key === `Escape`)) &&
                !i.repeat &&
                !i.ctrlKey &&
                !i.altKey &&
                !i.metaKey &&
                (i.preventDefault(), i.stopPropagation(), oO(e)))
        : o();
    },
    o = () => {
      (removeEventListener(`keydown`, a, !0), removeEventListener(`keyup`, i, !0), eO && eO());
    };
  return (addEventListener(`keydown`, a, !0), o);
}
var uO = [
    [`stats`, () => c(`Estadísticas`)],
    [`status`, () => c(`Estados`)],
    [`react`, () => c(`Reacciones`)],
    [`shapes`, () => c(`Formas de ataque`)],
    [`fusion`, () => c(`Fusiones`)],
    [`misc`, () => c(`Daño y tipos`)],
  ],
  dO = [
    [`maxHp`, () => c(`Tu vida. Si llega a 0, la partida termina (salvo que tengas un Revivir).`)],
    [`regen`, () => c(`PS que recuperas cada segundo.`)],
    [
      `armor`,
      () =>
        c(`Reduce el daño que recibes: armadura ÷ (armadura + 45). Rinde cada vez menos cuanto más tienes.`),
    ],
    [`evasion`, () => c(`Probabilidad de esquivar un golpe por completo. No pasa del 60%.`)],
    [`shieldMax`, () => c(`Escudo que se regenera solo y absorbe el daño antes que tus PS.`)],
    [`moveSpeed`, () => c(`Lo rápido que corres.`)],
    [`damage`, () => c(`Multiplica el daño de todos tus ataques, sean del tipo que sean.`)],
    [
      `physical`,
      () =>
        c(
          `Multiplica solo el daño de los movimientos físicos. Cada movimiento dice si es Físico o Especial.`,
        ),
    ],
    [`special`, () => c(`Multiplica solo el daño de los movimientos especiales.`)],
    [
      `attackSpeed`,
      () =>
        c(
          `Cuanto más alta, antes se recargan tus movimientos: recarga real = recarga ÷ velocidad de ataque.`,
        ),
    ],
    [
      `projectiles`,
      () =>
        c(
          `Proyectiles extra para los movimientos que disparan varios (Proyectil, Ráfaga, Teledirigido, Órbita, Impacto celeste…). No afecta a las auras ni a las ondas.`,
        ),
    ],
    [
      `area`,
      () => c(`Tamaño de las explosiones, ondas, conos, rayos y auras. Más área, más enemigos golpeados.`),
    ],
    [
      `duration`,
      () =>
        c(
          `Cuánto duran los rayos, conos, órbitas, trampas, el clima y los estados que aplicas (quemadura, sueño, parálisis…).`,
        ),
    ],
    [`projSpeed`, () => c(`Velocidad de los proyectiles y distancia de las embestidas.`)],
    [
      `critChance`,
      () =>
        c(
          `Probabilidad de que un golpe sea crítico. Lo que pase del 100% se convierte en probabilidad de megacrítico.`,
        ),
    ],
    [
      `megaCrit`,
      () =>
        c(
          `Con más del 100% de crítico, lo que sobra es la probabilidad de que un crítico sea megacrítico (número rosa, «!!»): suma otra vez la mitad de tu bonus de crítico. Llega al 100% con un 200% de crítico.`,
        ),
    ],
    [
      `critDamage`,
      () => c(`Cuánto más daño hace un crítico. Parte de ×1,75: con +50% de daño crítico, ×2,25.`),
    ],
    [
      `statusChance`,
      () =>
        c(
          `Multiplica la probabilidad de aplicar estados (quemar, envenenar, paralizar…) con cada golpe. La probabilidad final de cada golpe no pasa del 100%.`,
        ),
    ],
    [`statusDamage`, () => c(`Multiplica el daño de las quemaduras y los venenos.`)],
    [`eliteDamage`, () => c(`Daño extra contra élites, Alfas, Dominantes, minijefes y jefes.`)],
    [
      `superEffective`,
      () => c(`Daño extra cuando el tipo de tu ataque es superefectivo contra el enemigo (×2 o más).`),
    ],
    [`lifesteal`, () => c(`Parte del daño que haces que recuperas como PS.`)],
    [`healing`, () => c(`Multiplica toda la curación que recibes.`)],
    [
      `thorns`,
      () =>
        c(
          `Daño que devuelves a quien te golpea. Con la Toxiestrella golpea a todos los que te rodean, envenena y salta también al esquivar.`,
        ),
    ],
    [
      `overheal`,
      () =>
        c(
          `La curación que te sobra con los PS llenos se guarda como PS extra dorados, hasta este porcentaje de tus PS máximos. Absorben el daño antes que el escudo y se van gastando poco a poco.`,
        ),
    ],
    [
      `powerup`,
      () =>
        c(
          `Multiplica la probabilidad de que salgan power-ups (Imán, MT, bayas…), acorta la espera entre uno y otro y alarga lo que duran.`,
        ),
    ],
    [
      `eliteSpawn`,
      () =>
        c(
          `Multiplica la probabilidad de que un Pokémon salga como élite: más peligro, más botín y más experiencia.`,
        ),
    ],
    [
      `slam`,
      () =>
        c(
          `Multiplica el daño de la caída en picado (agacharte en el aire). Cuanto más alto caigas, más daño y más área.`,
        ),
    ],
    [`knockback`, () => c(`Cuánto empujan tus golpes. Los jefes casi no se mueven.`)],
    [`pickupRange`, () => c(`Distancia a la que recoges la experiencia y el botín sin tocarlos.`)],
    [`xpGain`, () => c(`Multiplica la experiencia que ganas: subes de nivel antes.`)],
    [`gold`, () => c(`Multiplica los Pokédólares que sueltan los enemigos.`)],
    [
      `luck`,
      () =>
        c(
          `Mejora la rareza de lo que te ofrecen: cada 100 de suerte duplica más o menos las tarjetas Raras y multiplica mucho las Legendarias. También abarata las Poké Balls.`,
        ),
    ],
    [`difficulty`, () => c(`Más enemigos y más fuertes a cambio de más experiencia y dinero.`)],
    [`extraJumps`, () => c(`Saltos en el aire que puedes hacer además del primero.`)],
    [`flinch`, () => c(`Probabilidad de que un golpe haga retroceder y perder el turno a un enemigo.`)],
    [`bounces`, () => c(`Veces que rebota un proyectil de un enemigo a otro.`)],
  ],
  fO = [
    [
      `burn`,
      () =>
        c(
          `Daño continuo: cada segundo hace el 30% del golpe que lo causó (por tu «Daño de estado»), durante 3 s.`,
        ),
    ],
    [
      `poison`,
      () =>
        c(
          `Cada golpe suma una carga (hasta 10) y renueva los 5 s. Cada segundo hace el 12% del golpe × (0,6 + 0,2 por carga): con 10 cargas, ×2,6. Mientras dura, el enemigo no puede curarse.`,
        ),
    ],
    [`paralysis`, () => c(`Pierde la mitad de la velocidad y a veces se queda quieto. Dura 3 s.`)],
    [
      `freeze`,
      () =>
        c(
          `Cada golpe de frío suma una carga de enfriamiento; con 3 queda congelado 1,6 s (inmóvil y recibe +20% de daño). Mojado, se congela al instante.`,
        ),
    ],
    [`sleep`, () => c(`Se queda parado 3 s; el siguiente golpe hace ×1,8 y lo despierta.`)],
    [`confusion`, () => c(`Durante 3 s golpea y se mueve sin control, y puede dañar a otros enemigos.`)],
    [
      `wet`,
      () =>
        c(
          `Durante 5 s está empapado: prepara la reacción Electrocutado y se congela al instante con un golpe de hielo.`,
        ),
    ],
    [`curse`, () => c(`Durante 4 s recibe +25% de daño de todo.`)],
    [`healblock`, () => c(`Durante 6 s no puede curarse y pierde la mitad de su escudo.`)],
    [`charm`, () => c(`Durante 3 s hace −40% de daño y los comunes dejan de atacar.`)],
    [`root`, () => c(`Durante 2 s se mueve un 65% más lento.`)],
    [`stun`, () => c(`Se queda quieto medio segundo.`)],
    [`knock`, () => c(`Sale despedido mucho más lejos de lo normal.`)],
  ],
  pO = {
    burn: `fire`,
    poison: `poison`,
    paralysis: `electric`,
    freeze: `ice`,
    sleep: null,
    confusion: `psychic`,
    wet: `water`,
    curse: `ghost`,
    healblock: `dark`,
    charm: `fairy`,
    root: `grass`,
    stun: `rock`,
    knock: `fighting`,
  },
  mO = [
    [
      () => c(`Electrocutado`),
      () => c(`Mojado + golpe Eléctrico`),
      () => c(`Salta a hasta 12 enemigos mojados a 9 m (60% de paralizarlos); el golpe hace ×1,5.`),
      `wet`,
      `electric`,
    ],
    [
      () => c(`Vapor`),
      () => c(`Quemado + golpe de Agua`),
      () => c(`Una nube que confunde y enraíza a los de alrededor; el golpe hace ×1,4.`),
      `burn`,
      `water`,
    ],
    [
      () => c(`Incendio`),
      () => c(`Quemado + golpe de Planta o Volador`),
      () => c(`Propaga la quemadura a los enemigos a 7 m; el golpe hace ×1,3.`),
      `burn`,
      `grass`,
    ],
    [
      () => c(`Destrozo`),
      () => c(`Congelado + golpe de Lucha, Roca o Acero`),
      () => c(`Rompe el hielo: ×2,6 más esquirlas que dañan alrededor.`),
      `freeze`,
      `fighting`,
    ],
    [
      () => c(`Gas Tóxico`),
      () => c(`Envenenado + golpe de Fuego`),
      () => c(`Explota: ×1,4 más un 10% por cada carga de veneno, y envenena a los de alrededor.`),
      `poison`,
      `fire`,
    ],
    [
      () => c(`Pesadilla`),
      () => c(`Dormido + golpe Fantasma o Siniestro`),
      () => c(`×1,7 sobre el ×1,8 del sueño, y te cura un poco.`),
      `sleep`,
      `ghost`,
    ],
    [
      () => c(`Colapso Mental`),
      () => c(`Paralizado + golpe Psíquico`),
      () => c(`El golpe hace ×1,6 y lo deja confuso.`),
      `paralysis`,
      `psychic`,
    ],
    [
      () => c(`Furia Dragón`),
      () => c(`Encantado + golpe de Dragón`),
      () => c(`El golpe hace ×2.`),
      `charm`,
      `dragon`,
    ],
  ];
function hO(e) {
  let t = [],
    n = m.filter((t) => !t.dice && (t.stat === e || t.extra?.some((t) => t.stat === e))).map((e) => e.name);
  n.length && t.push(c(`vitamina {name}`, { name: n.join(`, `) }));
  let r = tt.filter((t) => t.mods.some((t) => t.stat === e && ((t.mul ?? 1) > 1 || (t.add ?? 0) > 0))).length;
  r && t.push(r === 1 ? c(`1 objeto`) : c(`{n} objetos`, { n: r }));
  let i = Object.keys(jm)
    .filter((t) => jm[t].mods.some((t) => t.stat === e))
    .map((e) => Pi[e]);
  return (
    i.length && t.push(c(`Alfas de apoyo de tipo {type}`, { type: i.join(`, `) })),
    t.length ? c(`Lo sube: {list}`, { list: t.join(` · `) }) : null
  );
}
function gO(e, t, n, r) {
  return X(
    `div`,
    { class: `gl-row` },
    e,
    X(`div`, {}, X(`b`, {}, t), X(`p`, {}, n), r ? X(`em`, {}, r) : null),
  );
}
function _O(e) {
  let t = X(`div`, { class: `gl-body` });
  if (e === `stats`)
    (t.append(
      X(
        `p`,
        { class: `gl-intro` },
        c(
          `Todas las estadísticas de tu pausa. Los bonos del mismo origen (todos los objetos, por ejemplo) se suman entre sí; los de orígenes distintos se multiplican.`,
        ),
      ),
    ),
      t.append(X(`div`, { class: `gl-grid` }, ...dO.map(([e, t]) => gO(null, tv[e]?.[0] ?? e, t(), hO(e))))));
  else if (e === `status`)
    (t.append(
      X(
        `p`,
        { class: `gl-intro` },
        c(
          `Los estados que tus golpes aplican a los enemigos. Cada tipo suele aplicar uno; muchos movimientos aplican otro propio. Los jefes y minijefes los resisten: duran mucho menos y no se les puede bloquear para siempre.`,
        ),
      ),
    ),
      t.append(
        X(
          `div`,
          { class: `gl-grid` },
          ...fO.map(([e, t]) => {
            let n = pO[e];
            return gO(
              n ? ZC(n, 26) : Z(`check`, 22),
              Qg[e] ?? e,
              t(),
              n ? c(`Lo aplican sobre todo los movimientos de tipo {type}`, { type: Pi[n] }) : null,
            );
          }),
        ),
      ));
  else if (e === `react`)
    (t.append(
      X(
        `p`,
        { class: `gl-intro` },
        c(
          `Cuando un golpe cae sobre un enemigo que ya tiene un estado, a veces se produce una reacción con un efecto extra. Cada una tiene un breve tiempo de espera para no repetirse en cada golpe. Los multiplicadores (×1,5, ×2,6…) se aplican sobre el daño final del golpe, ya con tipo, críticos y bonos, no sobre el daño base de la ficha del movimiento; por eso las cifras de aquí parecen más altas.`,
        ),
      ),
    ),
      t.append(
        X(
          `div`,
          { class: `gl-grid` },
          ...mO.map(([e, t, n, r, i]) => {
            let a = gO(ZC(i, 26), e(), n(), null);
            return (
              a.lastElementChild.append(
                X(
                  `div`,
                  { class: `gl-combo` },
                  X(`span`, {}, Qg[r] ?? r),
                  X(`i`, {}, `+`),
                  X(`span`, {}, ZC(i, 18), Pi[i]),
                ),
                X(`p`, {}, t()),
              ),
              a
            );
          }),
        ),
      ));
  else if (e === `shapes`) {
    t.append(
      X(
        `p`,
        { class: `gl-intro` },
        c(`Cada movimiento tiene una forma, que decide cómo ataca y qué estadísticas lo mejoran.`),
      ),
    );
    for (let e of YE) {
      let n = Object.keys(g_).filter((t) => qE(t) === e);
      t.append(
        X(`div`, { class: `gl-sec` }, JE(e)),
        X(`div`, { class: `gl-grid` }, ...n.map((e) => gO(null, g_[e].label, g_[e].desc))),
      );
    }
  } else
    e === `fusion`
      ? (t.append(
          X(
            `p`,
            { class: `gl-intro` },
            c(
              `En la Máquina de Bill, dos movimientos al nivel {level} o superior se funden en uno nuevo que ocupa el hueco del primero y deja el otro libre. La fusión tiene su propio tipo y es Físico o Especial por sí misma: no hereda la categoría de los dos movimientos, así que mira su ficha antes de fundir. Se lanza sola en su recarga, sube de ★1 a ★5 con las mejoras y nunca se funde con climas, potenciadores ni otra fusión.`,
              { level: fusionRequiredLevel },
            ),
          ),
        ),
        t.append(
          X(
            `div`,
            { class: `gl-grid` },
            gO(
              null,
              DD(`signature`),
              c(
                `Dos movimientos concretos del kit de un miembro de la Liga (hay una por miembro). Vale aunque los hayas aprendido de un kit compartido. La lista de cada Pokémon está en su menú «Movimientos».`,
              ),
            ),
            gO(
              null,
              DD(`reaction`),
              c(
                `Un movimiento de cada lado de una reacción elemental: la fusión provoca esa reacción por sí sola.`,
              ),
            ),
            gO(null, DD(`type`), `两项同属性技能可匹配已开放的同属性配方。没有对应配方的组合不能融合。`),
          ),
        ),
        t.append(
          X(`div`, { class: `gl-sec` }, c(`Reacciones`)),
          X(`div`, { class: `gl-grid` }, ...GD(`reaction`).map(WD)),
        ),
        t.append(
          X(`div`, { class: `gl-sec` }, c(`Fusiones de tipo`)),
          X(`div`, { class: `gl-grid` }, ...GD(`type`).map(WD)),
        ))
      : t.append(
          X(
            `div`,
            { class: `gl-grid` },
            gO(
              null,
              c(`Mismo tipo (STAB)`),
              c(
                `Un movimiento del mismo tipo que tu Pokémon hace un 25% más de daño (un 56% más con Adaptable).`,
              ),
            ),
            gO(
              null,
              c(`Eficacia de tipo`),
              c(
                `Según el tipo del movimiento y el del enemigo: ×2 si es superefectivo, ×0,5 si resiste, ×0 si es inmune. Las flechas de color sobre los enemigos te lo recuerdan.`,
              ),
            ),
            gO(
              null,
              c(`Crítico`),
              c(
                `Con cierta probabilidad un golpe es crítico y hace ×1,75 de daño (más con tu estadística de daño crítico). Algunos movimientos tienen un crítico propio.`,
              ),
            ),
            gO(
              null,
              c(`Élite, Alfa, Dominante, jefe`),
              c(
                `Enemigos más grandes con más vida. Tu estadística «Daño a élites» actúa contra todos ellos.`,
              ),
            ),
            gO(
              null,
              c(`Clima`),
              c(`Lluvia, sol, arena, granizo… potencian ciertos tipos un 30% y debilitan otros un 25%.`),
              [`rain`, `sun`, `sand`, `hail`]
                .map((e) => `${v[e].name}: ${v[e].boost.map((e) => Pi[e]).join(`, `)}`)
                .join(` · `),
            ),
            gO(
              null,
              c(`Nivel de un movimiento`),
              c(
                `Hasta el nivel 8. Cada nivel da algo de daño base y ofrece mejoras al azar (más daño, menos recarga, más proyectiles…).`,
              ),
            ),
            gO(
              null,
              c(`Vitaminas`),
              c(
                `Mejoras de estadística que eliges al subir de nivel. Cada una sube hasta el nivel 10 y las más raras dan más.`,
              ),
            ),
            gO(
              null,
              c(`Alfas de apoyo`),
              c(
                `Un Alfa debilitado se puede capturar con un lanzamiento de Amigo Ball: lucha a tu lado esa partida y te da un bono por su tipo. No se une a tu Liga.`,
              ),
            ),
          ),
        );
  return t;
}
function vO(e = `stats`, t) {
  let n = document.activeElement,
    r,
    i = !1,
    a = () => {
      i || ((i = !0), removeEventListener(`keydown`, o, !0), r?.(), f.remove(), n?.focus?.());
    },
    o = (e) => {
      (e.stopImmediatePropagation(), e.key === `Escape` && (e.preventDefault(), N.click(), a()));
    },
    s = e,
    l = X(`div`, { style: { display: `contents` } }),
    u = X(`div`, { class: `gl-tabs` }),
    d = (e) => {
      ((s = e),
        u.querySelectorAll(`button`).forEach((e, t) => e.classList.toggle(`on`, uO[t][0] === s)),
        $(l).append(_O(e)));
    };
  uO.forEach(([e, t]) => u.append(X(`button`, { onclick: () => d(e) }, t())));
  let f = X(
    `div`,
    {
      class: `mp-ov gl-ov`,
      onclick: (e) => {
        e.target === f && a();
      },
    },
    X(
      `div`,
      { class: `mp-panel gl-panel`, role: `dialog`, "aria-label": c(`Glosario`) },
      X(
        `div`,
        { class: `mp-head` },
        X(
          `div`,
          {},
          X(`b`, {}, c(`Glosario`)),
          X(`small`, {}, c(`Qué significa cada estadística, estado y reacción`)),
        ),
        X(
          `button`,
          {
            class: `btn small ghost`,
            onclick: () => {
              (N.click(), a());
            },
          },
          Z(`check`, 16),
          c(`Cerrar`),
        ),
      ),
      u,
      l,
    ),
  );
  return (
    t ? (r = t(a)) : addEventListener(`keydown`, o, !0),
    d(s),
    document.body.append(f),
    f.querySelector(`.gl-tabs button.on`)?.focus(),
    a
  );
}
function yO(e, t = `btn small ghost gl-btn`) {
  return X(
    `button`,
    {
      class: t,
      title: c(`Qué significa cada estadística, estado y reacción`),
      onclick: () => vO(`stats`, e),
    },
    Z(`research`, 18),
    c(`Glosario`),
  );
}

export {
  uD,
  zE,
  VE,
  WE,
  tD,
  nD,
  rD,
  DD,
  kD,
  catalogFusionIcon,
  catalogMoveMeta,
  BD,
  XD,
  ZD,
  pO,
  FE,
  LE,
  RE,
  QE,
  eD,
  pD,
  _D,
  vD,
  yD,
  xD,
  CD,
  wD,
  TD,
  ED,
  PD,
  LD,
  RD,
  HD,
  UD,
  nO,
  sO,
  cO,
  lO,
  yO
};
