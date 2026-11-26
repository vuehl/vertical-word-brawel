import {chineseText as c} from "../data/chinese-text.js";
import {random as F, I, L, Fl, Xl, eu} from "../effects/battle-particles.js";
import {Rg, ag, fg, vg, Dg, Mg, Bg, Fg, formMove, M_, I_} from "./skills.js";
import {specialNames} from "../data/form-copy.js";
import {gameStick} from "../virtual-stick/stick-config.js";
import {deskWalkInset} from "../world/desk-framing.js";
import {springShoesKey} from "../data/active-content.js";
import {rosterForMode} from "../data/lite-rules.js";
import {finalBossSpecies} from "../data/character-rules.js";
import {applyStarterSpeed, windSpeedDamageBonus, speedBuff} from "../data/starter-characters.js";
import {heroActionCatalog} from "../actors/hero-action-catalog.js";
import {playerGlyphScale, playerHeroAction} from "../actors/hero-actions.js";
import {createPlayerFootRing} from "../effects/player-foot-ring.js";
import {steerVelocity} from "../virtual-stick/stick-physics.js";
import {RenderState} from "../virtual-stick/stick-render.js";
import {ENEMY_DAMAGE_SCALE} from "../performance/spawn-budget.js";
import {moveDeskPlayer, obstacleJumpSpeed} from "../world/paper-collision.js";
import {
  vitaminKindLimit,
  Gt as le,
  Hn as de,
  Kn as Se,
  Mr as ke,
  Nr as Ne,
  Pr as Ve,
  jr as sn,
  kr as dn,
  zn as dr
} from "../data/config.js";
import {K as Tr, ct as Kr, et as Yr, ht as ti, mt as li} from "../vendor/three-DmSYIDKK.js";
import {gameData as k} from "../data/game-database.js";
import {ta, Na} from "../ui/controls.js";
import {clamp as Gs} from "../effects/scene-renderer.js";
import {Zc} from "../actors/sprite-assets.js";
import {cf, df, R, Ef} from "./enemy-population.js";
import {Kp} from "../effects/move-particles.js";
import {stackedItemModifier, applyItemModifiers as rv} from "./item-modifiers.js";

var ev = [
    { stat: `damage`, mul: 1.25 },
    { stat: `attackSpeed`, mul: 1.2 },
    { stat: `moveSpeed`, mul: 1.15 },
  ],
  tv = {
    maxHp: [c(`PS máx.`), `flat`],
    regen: [c(`Regeneración/s`), `flat`],
    armor: [c(`Armadura`), `flat`],
    evasion: [c(`Evasión`), `pctpts`],
    shieldMax: [c(`Escudo`), `flat`],
    moveSpeed: [c(`Velocidad`), `mult`],
    damage: [c(`Daño`), `mult`],
    physical: [c(`Daño físico`), `mult`],
    special: [c(`Daño especial`), `mult`],
    attackSpeed: [c(`Vel. de ataque`), `mult`],
    projectiles: [c(`Proyectiles`), `flat`],
    area: [c(`Área`), `mult`],
    duration: [c(`Duración`), `mult`],
    projSpeed: [c(`Vel. proyectil`), `mult`],
    critChance: [c(`Prob. crítico`), `pctpts`],
    critDamage: [c(`Daño crítico`), `mult`],
    lifesteal: [c(`Robo de vida`), `pctpts`],
    thorns: [c(`Espinas`), `flat`],
    knockback: [c(`Retroceso`), `mult`],
    pickupRange: [c(`Rango recogida`), `flat`],
    xpGain: [c(`Experiencia`), `mult`],
    gold: [c(`Pokédólares`), `mult`],
    luck: [c(`Suerte`), `flat`],
    difficulty: [c(`Dificultad`), `mult`],
    eliteDamage: [c(`Daño a élites`), `mult`],
    extraJumps: [c(`Saltos extra`), `flat`],
    jumpHeight: [c(`Altura salto`), `mult`],
    statusChance: [c(`Prob. de estado`), `mult`],
    statusDamage: [c(`Daño de estado`), `mult`],
    healing: [c(`Curación`), `mult`],
    superEffective: [c(`Daño muy eficaz`), `mult`],
    flinch: [c(`Prob. retroceder`), `pctpts`],
    bounces: [c(`Rebotes`), `flat`],
    enemyAmount: [c(`Cantidad enemigos`), `mult`],
    megaCrit: [c(`Prob. megacrítico`), `pctpts`],
    overheal: [c(`Sobrecuración`), `pctpts`],
    powerup: [c(`Power-ups`), `mult`],
    eliteSpawn: [c(`Aparición de élites`), `mult`],
    slam: [c(`Daño de caída`), `mult`],
  };
function nv(e, t, n) {
  let r = e.stats,
    i = r.hp + r.atk + r.def + r.spa + r.spd + r.spe,
    a = (e) => (e / i) * 6,
    o = 1 + t * 0.12,
    s = {
      maxHp: Math.round((70 + 45 * a(r.hp)) * o),
      regen: 0.25 + 0.25 * a(r.hp),
      armor: 6 * a(r.def) + 3 * a(r.spd),
      evasion: 0.02 + 0.02 * a(r.spe),
      shieldMax: 0,
      moveSpeed: 0.92 + 0.12 * a(r.spe),
      damage: o,
      physical: 0.82 + 0.2 * a(r.atk),
      special: 0.82 + 0.2 * a(r.spa),
      attackSpeed: 1,
      projectiles: 0,
      area: 1,
      duration: 1,
      projSpeed: 1,
      critChance: 0.05,
      critDamage: 1.75,
      lifesteal: 0,
      thorns: 0,
      knockback: 1,
      pickupRange: 6,
      xpGain: 1,
      gold: 1,
      luck: 0,
      luckMult: 1,
      difficulty: 1,
      eliteDamage: 1,
      extraJumps: 0,
      jumpHeight: 1,
      statusChance: 1,
      statusDamage: 1,
      healing: 1,
      superEffective: 1,
      flinch: 0,
      bounces: 0,
      enemyAmount: 1,
      megaCrit: 0,
      overheal: 0,
      powerup: 1,
      eliteSpawn: 1,
      slam: 1,
      typeBoost: {},
    };
  for (let [e, t] of Object.entries(n)) s[e] += t;
  return s;
}
var iv = new WeakMap();
function av(e) {
  ((e.evasion = Math.min(0.6, e.evasion)),
    iv.set(e, e.critChance),
    (e.megaCrit = Math.max(0, Math.min(1, e.critChance - 1))),
    (e.critChance = Math.min(1, e.critChance)),
    (e.overheal = Math.min(1, e.overheal)),
    (e.luckMult = 1 + e.luck / 100),
    (e.attackSpeed = Math.max(0.3, e.attackSpeed)));
}
var ov = (e) => e / (e + 45),
  sv = (e, t, n, r, i) => {
    e.vfx.ring(t.pos.x, t.pos.y, t.pos.z, n, r, 0.4);
    for (let r of e.enemies.within(t.pos.x, t.pos.z, n)) i(r);
  },
  cv = {
    photosynthesis: {
      name: c(`Fotosíntesis`),
      desc: c(
        `+1.5 regeneración y +25% curación. Tus ataques Planta te curan un poco (0,4% de PS por golpe, hasta 5 veces por segundo).`,
      ),
      mods: [
        { stat: `regen`, add: 1.5 },
        { stat: `healing`, mul: 1.25 },
      ],
    },
    "torrent-shell": {
      name: c(`Caparazón Torrente`),
      desc: c(`+15 armadura y +20 escudo. Con menos del 40% de PS, +40% de daño.`),
      lowHp: 1.4,
      mods: [
        { stat: `armor`, add: 15 },
        { stat: `shieldMax`, add: 20 },
      ],
    },
    phantom: {
      name: c(`Fantasma`),
      desc: c(`Atraviesas a la horda: -20% daño recibido y +10% evasión.`),
      dmgTaken: 0.8,
      mods: [{ stat: `evasion`, add: 0.1 }],
    },
    persevere: {
      name: c(`Perseverancia`),
      desc: c(
        `+60% de experiencia. Con ella llega antes que nadie a evolucionar en un Pokémon temible (Nv. 40).`,
      ),
      mods: [{ stat: `xpGain`, mul: 1.6 }],
    },
    vampire: {
      name: c(`Vampiro`),
      desc: c(`+8% robo de vida y +20% curación.`),
      mods: [
        { stat: `lifesteal`, add: 0.08 },
        { stat: `healing`, mul: 1.2 },
      ],
    },
    "steadfast-aura": {
      name: c(`Aura Impasible`),
      desc: c(`+12% evasión. Cada esquiva te da +6% de daño durante 4 s (acumulable).`),
      mods: [{ stat: `evasion`, add: 0.12 }],
    },
    mew: {
      name: c(`Gen Ancestral`),
      desc: c(`+10% daño, velocidad, área y PS. Puede aprender ataques de cualquier tipo.`),
      mods: [
        { stat: `damage`, mul: 1.1 },
        { stat: `moveSpeed`, mul: 1.1 },
        { stat: `area`, mul: 1.1 },
        { stat: `maxHp`, mul: 1.1 },
      ],
    },
    "loyal-guard": {
      name: c(`Guardián Leal`),
      desc: c(`+10% velocidad. Cada 3 s, los enemigos cercanos quedan intimidados (hacen -40% de daño).`),
      mods: [{ stat: `moveSpeed`, mul: 1.1 }],
      tick: (e, t) => {
        e.time % 3 < 1 && sv(e, t, 5.5, 16747066, (t) => e.combat.applyStatus(t, `charm`, 1));
      },
    },
    beacon: {
      name: c(`Faro`),
      desc: c(
        `+3 rango de recogida. Los paralizados reciben +25% de daño. Cada 5 s, tu lana suelta chispas que paralizan a los cercanos.`,
      ),
      mods: [{ stat: `pickupRange`, add: 3 }],
      tick: (e, t) => {
        e.time % 5 < 1 &&
          sv(e, t, 5, 16769594, (n) =>
            e.combat.hit(n, 4 + t.level, {
              type: `electric`,
              cls: `special`,
              status: `paralysis`,
              statusChance: 0.7,
              knock: 0.2,
              silent: !0,
            }),
          );
      },
    },
    "mud-trail": {
      name: c(`Fango`),
      desc: c(`+10% PS. Al moverte dejas un rastro de barro que daña y enraiza a los enemigos.`),
      mods: [{ stat: `maxHp`, mul: 1.1 }],
    },
    "bone-keeper": {
      name: c(`Hueso Guardián`),
      desc: c(
        `+10 armadura. Tus ataques de hueso hacen +20% de daño. Con menos del 40% de PS, +35% de daño.`,
      ),
      lowHp: 1.35,
      mods: [{ stat: `armor`, add: 10 }],
    },
    blessing: {
      name: c(`Dicha`),
      desc: c(`+50% probabilidad de estados y +25 suerte (mejores objetos y ofertas).`),
      mods: [
        { stat: `statusChance`, mul: 1.5 },
        { stat: `luck`, add: 25 },
      ],
    },
    "gem-hoarder": {
      name: c(`Joyero`),
      desc: c(
        `+30% Pokédólares y +2 rango de recogida. +1% de daño por cada 25 ₽ que lleves encima (hasta +25%).`,
      ),
      mods: [
        { stat: `gold`, mul: 1.3 },
        { stat: `pickupRange`, add: 2 },
      ],
    },
    "horn-pride": {
      name: c(`Cornamenta`),
      desc: c(`+15% daño físico. Cada baja te potencia: más daño y velocidad (hasta +30%).`),
      mods: [{ stat: `physical`, mul: 1.15 }],
    },
    presage: {
      name: c(`Presagio`),
      desc: c(`+8% crítico. Tus críticos rematan a los enemigos con menos del 12% de PS (no a jefes).`),
      mods: [{ stat: `critChance`, add: 0.08 }],
    },
    "dragon-dream": {
      name: c(`Sueño de Volar`),
      desc: c(
        `+1 salto y +10% daño físico. Al caer desde lo alto aterrizas con una onda de choque. Como Salamence, por fin vuela.`,
      ),
      mods: [
        { stat: `extraJumps`, add: 1 },
        { stat: `physical`, mul: 1.1 },
      ],
    },
    "iron-body": {
      name: c(`Cuerpo Férreo`),
      desc: c(`+18 armadura. Levita con magnetismo: mantén Saltar para planear y puedes subir paredes.`),
      mods: [{ stat: `armor`, add: 18 }],
    },
    metamorph: {
      name: c(`Metamorfosis`),
      desc: c(
        `+15% experiencia y +20 escudo. Evoluciona pronto (Metapod al Nv. 8, Butterfree al Nv. 36). Como Metapod, el capullo te da +30 armadura.`,
      ),
      mods: [
        { stat: `xpGain`, mul: 1.15 },
        { stat: `shieldMax`, add: 20 },
      ],
    },
    "venom-sting": {
      name: c(`Aguijón Venenoso`),
      desc: c(
        `+10% velocidad de ataque. Tus críticos envenenan y los envenenados reciben +20% de daño. Evoluciona pronto (Kakuna al Nv. 8, Beedrill al Nv. 36); como Kakuna, +30 armadura.`,
      ),
      mods: [{ stat: `attackSpeed`, mul: 1.1 }],
    },
    tailwind: {
      name: c(`Viento Afín`),
      desc: c(
        `+12% velocidad, +20% velocidad de proyectiles y +1 salto. Como buen Volador, planeas manteniendo Saltar.`,
      ),
      mods: [
        { stat: `moveSpeed`, mul: 1.12 },
        { stat: `projSpeed`, mul: 1.2 },
        { stat: `extraJumps`, add: 1 },
      ],
    },
    "serpent-glare": {
      name: c(`Mirada Serpiente`),
      desc: c(
        `+1 regeneración (Mudar). Cada 4 s tu mirada paraliza a los enemigos que tienes delante (7 m).`,
      ),
      mods: [{ stat: `regen`, add: 1 }],
      tick: (e, t) => {
        if (e.time % 4 >= 1) return;
        let n = t.facing.x,
          r = t.facing.y,
          i = t.pos.x,
          a = t.pos.z;
        e.vfx.add.spawn({
          x: i + n * 1.2,
          y: t.pos.y + 1.4,
          z: a + r * 1.2,
          life: 0.4,
          size: 0.6,
          endSize: 1.8,
          color: 16765498,
          shape: I.Eye,
          glow: 0.3,
        });
        for (let t of e.enemies.within(i + n * 3.5, a + r * 3.5, 4.5)) {
          let o = e.enemies.x[t] - i,
            s = e.enemies.z[t] - a,
            c = Math.hypot(o, s) || 1;
          (o * n + s * r) / c > 0.45 && c < 7 && e.combat.applyStatus(t, `paralysis`, 1);
        }
      },
    },
    "sand-rush": {
      name: c(`Ímpetu Arena`),
      desc: c(`+10 armadura y +6% crítico. Con tormenta de arena, +30% velocidad.`),
      mods: [
        { stat: `armor`, add: 10 },
        { stat: `critChance`, add: 0.06 },
      ],
    },
    "lunar-blessing": {
      name: c(`Bendición Lunar`),
      desc: c(
        `+20 suerte y +1 regeneración. Tu Ultimate se carga un 30% más rápido y al lanzarla recuperas un 15% de PS.`,
      ),
      mods: [
        { stat: `luck`, add: 20 },
        { stat: `regen`, add: 1 },
      ],
    },
    chlorophyll: {
      name: c(`Clorofila`),
      desc: c(
        `+10% velocidad y +1 regeneración. Con sol, +30% velocidad y +20% de daño. Cada 6 s sueltas una nube de polen (4,5 m) que envenena.`,
      ),
      mods: [
        { stat: `moveSpeed`, mul: 1.1 },
        { stat: `regen`, add: 1 },
      ],
      tick: (e, t) => {
        if (e.time % 6 >= 1) return;
        let n = t.pos.x,
          r = t.pos.y,
          i = t.pos.z;
        for (let t = 0; t < 14; t++) {
          let a = F.range(0, Math.PI * 2),
            o = F.range(2, 6);
          e.vfx.norm.spawn({
            x: n,
            y: r + 0.8,
            z: i,
            vx: Math.cos(a) * o,
            vy: F.range(0.3, 1.2),
            vz: Math.sin(a) * o,
            drag: 2.2,
            life: 0.9,
            size: 0.3,
            endSize: 0.55,
            color: t % 2 ? 13144319 : 12118122,
            shape: I.PixSpore,
            spin: 2,
          });
        }
        sv(e, t, 4.5, 11559136, (n) =>
          e.combat.hit(n, Rg(`chlorophyll`, e, t.level), {
            type: `poison`,
            cls: `special`,
            status: `poison`,
            statusChance: 1,
            knock: 0,
            silent: !0,
          }),
        );
      },
    },
    "effect-spore": {
      name: c(`Efecto Espora`),
      desc: c(
        `+20% probabilidad de estados. Quien te toca se duerme, se paraliza o se envenena. Como Parasect, el hongo manda: +20% de daño contra enemigos con algún estado.`,
      ),
      mods: [{ stat: `statusChance`, mul: 1.2 }],
    },
    "compound-eyes": {
      name: c(`Ojos Compuestos`),
      desc: c(
        `+8% crítico y +15% probabilidad de estados. Los enemigos confundidos reciben +25% de daño. Como Venomoth, +12% velocidad de ataque.`,
      ),
      mods: [
        { stat: `critChance`, add: 0.08 },
        { stat: `statusChance`, mul: 1.15 },
      ],
    },
    "arena-trap": {
      name: c(`Trampa Arena`),
      desc: c(
        `+10 armadura. Cada 2 s el suelo tiembla a tu alrededor (4,5 m): daña y atrapa en la arena a los enemigos (enraizar). Como Dugtrio, 6 m.`,
      ),
      mods: [{ stat: `armor`, add: 10 }],
      tick: (e, t) => {
        if (e.time % 2 >= 1) return;
        let n = t.speciesId === 51 ? 6 : 4.5,
          r = t.pos.x,
          i = t.pos.z;
        e.vfx.ring(r, t.pos.y, i, n, 14200944, 0.35, 0.15, L.Jagged);
        for (let t = 0; t < 6; t++) {
          let t = F.range(0, Math.PI * 2),
            a = F.range(1, n);
          e.vfx.norm.spawn({
            x: r + Math.cos(t) * a,
            y: e.terrain.height(r + Math.cos(t) * a, i + Math.sin(t) * a) + 0.3,
            z: i + Math.sin(t) * a,
            vy: F.range(1, 2.5),
            drag: 2,
            life: 0.6,
            size: 0.45,
            endSize: 0.8,
            color: 16777215,
            shape: I.PixSand,
          });
        }
        for (let a of e.enemies.within(r, i, n))
          e.combat.hit(a, Rg(`arena-trap`, e, t.level), {
            type: `ground`,
            cls: `physical`,
            status: `root`,
            statusChance: 0.8,
            knock: 0,
            silent: !0,
          });
      },
    },
    pickup: {
      name: c(`Recogida`),
      desc: c(
        `+40% Pokédólares y +2 de recogida. Cada 100 ₽ que consigues en la partida te dan +1% de crítico (hasta +15%). Como Persian, +10% velocidad.`,
      ),
      mods: [
        { stat: `gold`, mul: 1.4 },
        { stat: `pickupRange`, add: 2 },
      ],
    },
    headache: {
      name: c(`Jaqueca`),
      desc: c(
        `+10% PS. Los golpes que recibes y el paso del tiempo cargan tu jaqueca; llena, estalla en una onda psíquica (7 m) que daña y confunde. Como Golduck, la onda es de 10 m y te cura un 8%.`,
      ),
      mods: [{ stat: `maxHp`, mul: 1.1 }],
      tick: (e, t) => t.addHeadache(1 / 14),
    },
    "anger-point": {
      name: c(`Irascible`),
      desc: c(
        `+8 armadura. Cada golpe que recibes te enfurece: +6% de daño por carga (hasta 6; como Primeape, hasta 8). La furia se va tras 5 s sin recibir daño.`,
      ),
      mods: [{ stat: `armor`, add: 8 }],
    },
    "swift-swim": {
      name: c(`Nado Rápido`),
      desc: c(
        `+10% PS y +20% velocidad de proyectiles. Con lluvia, +30% velocidad y +20% de daño. Como Poliwrath, +15% daño físico.`,
      ),
      mods: [
        { stat: `maxHp`, mul: 1.1 },
        { stat: `projSpeed`, mul: 1.2 },
      ],
    },
    carnivore: {
      name: c(`Boca Voraz`),
      desc: c(
        `+10% PS. Tus Golpes y Giros hacen +15% de daño y pueden enraizar (20%). Las bajas de enemigos enraizados te curan un 2% de PS.`,
      ),
      mods: [{ stat: `maxHp`, mul: 1.1 }],
    },
    tentacles: {
      name: c(`Tentáculos`),
      desc: c(
        `+10 armadura. Cada 2 s tus tentáculos azotan a los 2 enemigos más cercanos en 7 m (envenenan); Tentacruel azota a 4.`,
      ),
      mods: [{ stat: `armor`, add: 10 }],
      tick: (e, t) => {
        if (e.time % 2 >= 1) return;
        let n = e.enemies,
          r = t.pos.x,
          i = t.pos.y + 0.8,
          a = t.pos.z,
          o = t.speciesId === 73 ? 4 : 2,
          s = n
            .within(r, a, 7)
            .filter((e) => n.isAlive(e))
            .sort((e, t) => Math.hypot(n.x[e] - r, n.z[e] - a) - Math.hypot(n.x[t] - r, n.z[t] - a))
            .slice(0, o);
        (s.forEach((o, s) =>
          e.later(s * 0.06, () => {
            if (!n.isAlive(o)) return;
            let c = n.x[o],
              l = n.y[o] + n.hgt[o] * 0.5,
              u = n.z[o],
              d = c - r,
              f = u - a,
              p = Math.hypot(d, f) || 1,
              m = -f / p,
              h = d / p,
              g = (s % 2 ? 1 : -1) * 1.2,
              _ = r,
              v = i,
              y = a;
            for (let t = 1; t <= 7; t++) {
              let n = t / 7,
                o = Math.sin(n * Math.PI) * g,
                s = r + d * n + m * o,
                c = i + (l - i) * n + Math.sin(n * Math.PI) * 0.8,
                u = a + f * n + h * o;
              (e.vfx.beams.spawn(_, v, y, s, c, u, 0.22 * (1 - n * 0.5), t % 2 ? 8046824 : 10148080, 0.16),
                (_ = s),
                (v = c),
                (y = u));
            }
            (e.vfx.norm.spawn({
              x: c,
              y: l,
              z: u,
              life: 0.18,
              size: 0.5,
              endSize: 1.1,
              color: 16777215,
              shape: I.PixToxic,
            }),
              e.combat.hit(o, Rg(`tentacles`, e, t.level), {
                type: `poison`,
                cls: `physical`,
                status: `poison`,
                statusChance: 0.8,
                knock: 0.6,
                silent: !0,
              }));
          }),
        ),
          s.length && e.audio.move(`wrap`, `cast`, { v: 0.5 }));
      },
    },
    overgrow: {
      name: c(`Espesura`),
      desc: c(`Con menos del 40% de PS, +40% de daño. +10% daño Planta.`),
      lowHp: 1.4,
      typeBoost: { grass: 0.1 },
    },
    blaze: {
      name: c(`Mar Llamas`),
      desc: c(`Con menos del 40% de PS, +40% de daño. +10% daño Fuego.`),
      lowHp: 1.4,
      typeBoost: { fire: 0.1 },
    },
    torrent: {
      name: c(`Torrente`),
      desc: c(`Con menos del 40% de PS, +40% de daño. +10% daño Agua.`),
      lowHp: 1.4,
      typeBoost: { water: 0.1 },
    },
    swarm: {
      desc: c(`Con menos del 40% de PS, +40% de daño. +10% velocidad de ataque.`),
      lowHp: 1.4,
      mods: [{ stat: `attackSpeed`, mul: 1.1 }],
    },
    levitate: {
      name: c(`Levitación`),
      desc: c(`Flotas: mantén Saltar para planear y puedes subir paredes. +6% evasión.`),
      mods: [{ stat: `evasion`, add: 0.06 }],
    },
    "keen-eye": {
      desc: c(`+8% crítico y +2 rango de recogida.`),
      mods: [
        { stat: `critChance`, add: 0.08 },
        { stat: `pickupRange`, add: 2 },
      ],
    },
    intimidate: {
      name: c(`Intimidación`),
      desc: c(`Cada 3 s, los enemigos cercanos quedan encantados (hacen -40% daño).`),
      tick: (e, t) => {
        e.time % 3 < 1 && sv(e, t, 5, 16747098, (t) => e.combat.applyStatus(t, `charm`, 1));
      },
    },
    pressure: { desc: c(`+25% daño a élites, Alfa y jefes.`), mods: [{ stat: `eliteDamage`, mul: 1.25 }] },
    sturdy: {
      name: c(`Robustez`),
      desc: c(`Sobrevives a un golpe letal con 1 PS una vez por partida. +10 armadura.`),
      mods: [{ stat: `armor`, add: 10 }],
    },
    "run-away": {
      desc: c(`+12% velocidad de movimiento y +1 salto.`),
      mods: [
        { stat: `moveSpeed`, mul: 1.12 },
        { stat: `extraJumps`, add: 1 },
      ],
    },
    "thick-fat": {
      desc: c(`+12 armadura y +15% PS máximos.`),
      mods: [
        { stat: `armor`, add: 12 },
        { stat: `maxHp`, mul: 1.15 },
      ],
    },
    "poison-point": {
      name: c(`Punto Tóxico`),
      desc: c(`+15% PS y +10 armadura. Quien te toca se envenena y los envenenados contagian al morir.`),
      contact: `poison`,
      mods: [
        { stat: `maxHp`, mul: 1.15 },
        { stat: `armor`, add: 10 },
      ],
    },
    "shed-skin": { desc: c(`+1.5 regeneración de PS.`), mods: [{ stat: `regen`, add: 1.5 }] },
    static: {
      name: c(`Electricidad Estática`),
      desc: c(`Quien te toca queda paralizado. Cada 4 s lanzas una descarga a un enemigo.`),
      contact: `paralysis`,
      tick: (e, t) => {
        if (e.time % 4 < 1) {
          let n = e.enemies.nearest(t.pos.x, t.pos.z, 10);
          n >= 0 &&
            (e.vfx.lightning(
              t.pos.x,
              t.pos.y + 1,
              t.pos.z,
              e.enemies.x[n],
              e.enemies.y[n] + 1,
              e.enemies.z[n],
            ),
            e.combat.hit(n, 10 + t.level * 2, {
              type: `electric`,
              cls: `special`,
              status: `paralysis`,
              statusChance: 1,
            }));
        }
      },
    },
    "cute-charm": {
      name: c(`Gran Encanto`),
      desc: c(`Quien te toca queda encantado. +5% evasión.`),
      contact: `charm`,
      mods: [{ stat: `evasion`, add: 0.05 }],
    },
    "inner-focus": {
      desc: c(`+10% daño y no te pueden hacer retroceder.`),
      mods: [{ stat: `damage`, mul: 1.1 }],
    },
    guts: { name: c(`Agallas`), desc: c(`+25% daño físico.`), mods: [{ stat: `physical`, mul: 1.25 }] },
    "clear-body": {
      desc: c(`+10 armadura y +10% PS.`),
      mods: [
        { stat: `armor`, add: 10 },
        { stat: `maxHp`, mul: 1.1 },
      ],
    },
    "flash-fire": {
      name: c(`Absorbe Fuego`),
      desc: c(`+20% daño de Fuego y +15% daño de estados.`),
      mods: [{ stat: `statusDamage`, mul: 1.15 }],
    },
    "water-absorb": {
      name: c(`Absorbe Agua`),
      desc: c(`Recibes -15% daño. +0.5 regeneración.`),
      dmgTaken: 0.85,
      mods: [{ stat: `regen`, add: 0.5 }],
    },
    "volt-absorb": {
      desc: c(`Recibes -15% daño. +0.5 regeneración.`),
      dmgTaken: 0.85,
      mods: [{ stat: `regen`, add: 0.5 }],
    },
    synchronize: {
      name: c(`Sincronía`),
      desc: c(`+20% probabilidad de estados.`),
      mods: [{ stat: `statusChance`, mul: 1.2 }],
    },
    oblivious: {
      desc: c(`+15% PS y +8% evasión.`),
      mods: [
        { stat: `maxHp`, mul: 1.15 },
        { stat: `evasion`, add: 0.03 },
      ],
    },
    "natural-cure": {
      desc: c(`+1.2 regeneración y +15% curación.`),
      mods: [
        { stat: `regen`, add: 1.2 },
        { stat: `healing`, mul: 1.15 },
      ],
    },
    "hyper-cutter": {
      desc: c(`+20% daño crítico y +5% crítico.`),
      mods: [
        { stat: `critDamage`, add: 0.2 },
        { stat: `critChance`, add: 0.05 },
      ],
    },
    "beast-boost": { desc: c(`Cada baja te hace más rápido y fuerte (hasta +30%).`) },
    "rock-head": {
      desc: c(`+20% daño de embestidas y +8 armadura.`),
      mods: [
        { stat: `armor`, add: 8 },
        { stat: `knockback`, mul: 1.3 },
      ],
    },
    insomnia: { desc: c(`+10% velocidad de ataque.`), mods: [{ stat: `attackSpeed`, mul: 1.1 }] },
    "own-tempo": {
      desc: c(`+10% velocidad de ataque y +5% velocidad.`),
      mods: [
        { stat: `attackSpeed`, mul: 1.1 },
        { stat: `moveSpeed`, mul: 1.05 },
      ],
    },
    protosynthesis: { desc: c(`+15% daño. Con sol, otro +15%.`), mods: [{ stat: `damage`, mul: 1.15 }] },
    "quark-drive": {
      desc: c(`+15% daño y +10% velocidad.`),
      mods: [
        { stat: `damage`, mul: 1.15 },
        { stat: `moveSpeed`, mul: 1.1 },
      ],
    },
    "shield-dust": { desc: c(`+20 escudo regenerable.`), mods: [{ stat: `shieldMax`, add: 20 }] },
    "sand-veil": { name: c(`Velo Arena`), desc: c(`+10% evasión.`), mods: [{ stat: `evasion`, add: 0.1 }] },
    "snow-cloak": { desc: c(`+10% evasión.`), mods: [{ stat: `evasion`, add: 0.1 }] },
    limber: {
      desc: c(`+1 salto extra y +10% velocidad.`),
      mods: [
        { stat: `extraJumps`, add: 1 },
        { stat: `moveSpeed`, mul: 1.1 },
      ],
    },
    hustle: {
      name: c(`Entusiasmo`),
      desc: c(`+25% daño físico y +10% velocidad de ataque, a cambio de -8% PS.`),
      mods: [
        { stat: `physical`, mul: 1.25 },
        { stat: `attackSpeed`, mul: 1.1 },
        { stat: `maxHp`, mul: 0.92 },
      ],
    },
    rivalry: {
      name: c(`Rivalidad`),
      desc: c(`+10% daño y +25% contra élites, Alfas y jefes.`),
      mods: [
        { stat: `damage`, mul: 1.1 },
        { stat: `eliteDamage`, mul: 1.25 },
      ],
    },
    "leaf-guard": {
      desc: c(`+15 escudo y +0.5 regeneración.`),
      mods: [
        { stat: `shieldMax`, add: 15 },
        { stat: `regen`, add: 0.5 },
      ],
    },
    prankster: { desc: c(`+15% velocidad de ataque.`), mods: [{ stat: `attackSpeed`, mul: 1.15 }] },
    soundproof: { desc: c(`+15 armadura.`), mods: [{ stat: `armor`, add: 15 }] },
    "flame-body": {
      desc: c(`Quien te toca se quema. Los quemados arden más.`),
      contact: `burn`,
      mods: [{ stat: `statusDamage`, mul: 1.15 }],
    },
    "battle-armor": { desc: c(`+12 armadura.`), mods: [{ stat: `armor`, add: 12 }] },
    "shell-armor": { desc: c(`+12 armadura.`), mods: [{ stat: `armor`, add: 12 }] },
    gluttony: { name: c(`Gula`), desc: c(`+30% curación.`), mods: [{ stat: `healing`, mul: 1.3 }] },
    "big-pecks": {
      desc: c(`+10 armadura y +5% velocidad.`),
      mods: [
        { stat: `armor`, add: 10 },
        { stat: `moveSpeed`, mul: 1.05 },
      ],
    },
    healer: {
      desc: c(`Cada 6 s recuperas un 5% de PS. +20% curación.`),
      mods: [{ stat: `healing`, mul: 1.2 }],
      tick: (e, t) => {
        e.time % 6 < 1 && t.heal(t.maxHp * 0.05);
      },
    },
    "vital-spirit": {
      desc: c(`+10% velocidad de ataque y +10% PS.`),
      mods: [
        { stat: `attackSpeed`, mul: 1.1 },
        { stat: `maxHp`, mul: 1.1 },
      ],
    },
    stench: { desc: c(`+6% probabilidad de hacer retroceder.`), mods: [{ stat: `flinch`, add: 0.06 }] },
    "lightning-rod": { desc: c(`+20% daño especial.`), mods: [{ stat: `special`, mul: 1.2 }] },
    illuminate: { desc: c(`+20 suerte.`), mods: [{ stat: `luck`, add: 20 }] },
    "mold-breaker": {
      desc: c(`Ignoras escudos enemigos: +20% daño a élites.`),
      mods: [{ stat: `eliteDamage`, mul: 1.2 }],
    },
    "early-bird": {
      desc: c(`+10% velocidad de ataque y experiencia.`),
      mods: [
        { stat: `attackSpeed`, mul: 1.1 },
        { stat: `xpGain`, mul: 1.1 },
      ],
    },
    frisk: { desc: c(`+25 suerte.`), mods: [{ stat: `luck`, add: 25 }] },
    overcoat: {
      desc: c(`+10 armadura y +10 escudo.`),
      mods: [
        { stat: `armor`, add: 10 },
        { stat: `shieldMax`, add: 10 },
      ],
    },
    "iron-fist": {
      desc: c(`+20% daño físico y +20% área de golpes.`),
      mods: [{ stat: `physical`, mul: 1.2 }],
    },
    "sap-sipper": {
      desc: c(`+1 regeneración y +10% PS.`),
      mods: [
        { stat: `regen`, add: 1 },
        { stat: `maxHp`, mul: 1.1 },
      ],
    },
    "strong-jaw": { desc: c(`+25% daño físico.`), mods: [{ stat: `physical`, mul: 1.25 }] },
    "magnet-pull": { desc: c(`+4 rango de recogida.`), mods: [{ stat: `pickupRange`, add: 4 }] },
    "serene-grace": {
      desc: c(`Duplicas la probabilidad de estados.`),
      mods: [{ stat: `statusChance`, mul: 2 }],
    },
    "speed-boost": {
      name: c(`Impulso`),
      desc: c(`Tu velocidad y daño aumentan con el tiempo (hasta +30%).`),
    },
    "sand-stream": { desc: c(`Invocas una tormenta de arena permanente.`), weather: `sand` },
    drizzle: { desc: c(`Invocas lluvia permanente.`), weather: `rain` },
    drought: { desc: c(`Invocas sol permanente.`), weather: `sun` },
    "snow-warning": { desc: c(`Invocas granizo permanente.`), weather: `hail` },
    "rough-skin": {
      desc: c(`Quien te toca recibe daño (espinas +30).`),
      mods: [{ stat: `thorns`, add: 30 }],
    },
    "iron-barbs": {
      desc: c(`Quien te toca recibe daño (espinas +30).`),
      mods: [{ stat: `thorns`, add: 30 }],
    },
    "sheer-force": {
      desc: c(`+30% daño, pero sin estados.`),
      mods: [
        { stat: `damage`, mul: 1.3 },
        { stat: `statusChance`, mul: 0.2 },
      ],
    },
    "huge-power": { desc: c(`Duplicas tu daño físico.`), mods: [{ stat: `physical`, mul: 1.7 }] },
    "pure-power": { desc: c(`Duplicas tu daño físico.`), mods: [{ stat: `physical`, mul: 1.7 }] },
    technician: {
      name: c(`Experto`),
      desc: c(`+15% velocidad de ataque y +10% daño.`),
      mods: [
        { stat: `attackSpeed`, mul: 1.15 },
        { stat: `damage`, mul: 1.1 },
      ],
    },
    adaptability: {
      name: c(`Adaptable`),
      desc: c(`+25% daño con movimientos de tu tipo (la bonificación por tipo pasa de ×1,25 a ×1,56).`),
    },
    "skill-link": { desc: c(`+1 proyectil.`), mods: [{ stat: `projectiles`, add: 1 }] },
    multiscale: { name: c(`Multiescamas`), desc: c(`Con los PS al máximo recibes -50% daño.`), fullHp: 1 },
    "magic-guard": {
      name: c(`Muro Mágico`),
      desc: c(
        `Inmune al daño del suelo (lava, charcos de fuego, grietas, nubes de esporas). -30% daño de proyectiles y ataques de área.`,
      ),
      mods: [{ stat: `special`, mul: 1.1 }],
    },
    moxie: { desc: c(`Cada baja te potencia (hasta +30% daño).`) },
    "super-luck": { desc: c(`+12% crítico.`), mods: [{ stat: `critChance`, add: 0.12 }] },
    sniper: {
      name: c(`Francotirador`),
      desc: c(`+8% crítico y +50% daño crítico.`),
      mods: [
        { stat: `critChance`, add: 0.08 },
        { stat: `critDamage`, add: 0.5 },
      ],
    },
    "shadow-tag": {
      desc: c(`Al esquivar, el atacante recibe daño Fantasma.`),
      mods: [{ stat: `evasion`, add: 0.06 }],
    },
    "tough-claws": { desc: c(`+25% daño físico.`), mods: [{ stat: `physical`, mul: 1.25 }] },
    pixilate: { desc: c(`+20% daño especial.`), mods: [{ stat: `special`, mul: 1.2 }] },
    "water-veil": { desc: c(`+15 escudo.`), mods: [{ stat: `shieldMax`, add: 15 }] },
    "magma-armor": { desc: c(`+12 armadura.`), mods: [{ stat: `armor`, add: 12 }] },
    "ice-body": { name: c(`Gélido`), desc: c(`+1 regeneración.`), mods: [{ stat: `regen`, add: 1 }] },
    "suction-cups": { desc: c(`+12 armadura.`), mods: [{ stat: `armor`, add: 12 }] },
    "honey-gather": { desc: c(`+30% Pokédólares.`), mods: [{ stat: `gold`, mul: 1.3 }] },
    "cheek-pouch": { desc: c(`+30% curación.`), mods: [{ stat: `healing`, mul: 1.3 }] },
    reckless: { desc: c(`+20% daño físico.`), mods: [{ stat: `physical`, mul: 1.2 }] },
    "steam-engine": { desc: c(`+15% velocidad.`), mods: [{ stat: `moveSpeed`, mul: 1.15 }] },
    fluffy: { desc: c(`-20% daño recibido.`), dmgTaken: 0.8 },
    unaware: {
      desc: c(`+15% PS y +8 armadura.`),
      mods: [
        { stat: `maxHp`, mul: 1.15 },
        { stat: `armor`, add: 8 },
      ],
    },
    defiant: { desc: c(`Con menos del 40% de PS, +40% de daño.`), lowHp: 1.4 },
    justified: {
      desc: c(`+20% daño a élites y +5% daño.`),
      mods: [
        { stat: `eliteDamage`, mul: 1.2 },
        { stat: `damage`, mul: 1.05 },
      ],
    },
    steadfast: { desc: c(`+10% velocidad.`), mods: [{ stat: `moveSpeed`, mul: 1.1 }] },
    hydration: { desc: c(`Con lluvia te curas. +1 regeneración.`), mods: [{ stat: `regen`, add: 1 }] },
    anticipation: { desc: c(`+8% evasión.`), mods: [{ stat: `evasion`, add: 0.08 }] },
    plus: { desc: c(`+15% daño especial.`), mods: [{ stat: `special`, mul: 1.15 }] },
    minus: { desc: c(`+15% daño especial.`), mods: [{ stat: `special`, mul: 1.15 }] },
    "flower-veil": { desc: c(`+15 escudo.`), mods: [{ stat: `shieldMax`, add: 15 }] },
    "sweet-veil": { desc: c(`+15 escudo.`), mods: [{ stat: `shieldMax`, add: 15 }] },
    damp: { desc: c(`+10% área.`), mods: [{ stat: `area`, mul: 1.1 }] },
    bulletproof: { desc: c(`-15% daño recibido.`), dmgTaken: 0.85 },
  };
function lv(e) {
  let t = 0;
  for (let n = 0; n < e.length; n++) t = (t * 31 + e.charCodeAt(n)) >>> 0;
  let n = [
    { desc: c(`+10% daño.`), mods: [{ stat: `damage`, mul: 1.1 }] },
    { desc: c(`+10% velocidad de ataque.`), mods: [{ stat: `attackSpeed`, mul: 1.1 }] },
    { desc: c(`+10 armadura.`), mods: [{ stat: `armor`, add: 10 }] },
    { desc: c(`+12% PS máximos.`), mods: [{ stat: `maxHp`, mul: 1.12 }] },
    { desc: c(`+8% crítico.`), mods: [{ stat: `critChance`, add: 0.08 }] },
    { desc: c(`+10% área.`), mods: [{ stat: `area`, mul: 1.1 }] },
    { desc: c(`+10% velocidad.`), mods: [{ stat: `moveSpeed`, mul: 1.1 }] },
  ];
  return n[t % n.length];
}
Object.assign(cv, ag, fg, vg, Dg, Mg);
cv.imposter.name = specialNames.passive.get(cv.imposter.name) ?? cv.imposter.name;
cv[''] = {name: '', desc: ''};
function uv(e) {
  return cv[e] ?? lv(e);
}
var dv = { metamorph: 11, "venom-sting": 14 },
  fv = {
    "compound-eyes": { forms: [49], mods: [{ stat: `attackSpeed`, mul: 1.12 }] },
    pickup: { forms: [53], mods: [{ stat: `moveSpeed`, mul: 1.1 }] },
    "swift-swim": { forms: [62], mods: [{ stat: `physical`, mul: 1.15 }] },
  };
function pv(e, t) {
  let n = [...(uv(e).mods ?? [])];
  (e === `protosynthesis` && t.weather === `sun` && n.push({ stat: `damage`, mul: 1.15 }),
    dv[e] && t.player?.speciesId === dv[e] && n.push({ stat: `armor`, add: 30 }));
  let r = fv[e];
  r && t.player && r.forms.includes(t.player.speciesId) && n.push(...r.mods);
  let i = Bg(e)?.extraMods?.(t);
  return (i && n.push(...i), n);
}
var mv = 30,
  hv = 0.01,
  gv = 2.6,
  _v = 2,
  vv = 8,
  yv = gameStick.maxSpeed,
  bv = 0.8,
  xv = 0.35,
  Sv = 5.5,
  Cv = 0.35,
  wv = 0.35,
  Tv = (e) => Math.round(8 + e * 5.5 + e ** 1.8),
  Ev = [`fighting`, `bug`, `ghost`],
  Dv = 20,
  Ov = class {
    run;
    meta;
    data;
    speciesId;
    types;
    evoStage = 0;
    level = 1;
    xp = 0;
    xpNext = Tv(1);
    hp = 100;
    maxHp = 100;
    shield = 0;
    overheal = 0;
    ohFxT = 0;
    stats;
    moves = [null, null, null, null];
    moveSlots = 3;
    vitamins = new Map();
    chosenVitamins = new Set();
    items = new Map();
    buffs = new Map();
    ability;
    pos = new ti();
    vel = new ti();
    facing = new li(0, 1);
    radius = 0.55;
    crowdX = 0;
    crowdZ = 0;
    anchorT = 0;
    kx = 0;
    kz = 0;
    grounded = !0;
    jumpsLeft = 0;
    iframes = 0;
    flash = 0;
    renderScale = 1;
    speedNow = 0;
    motionView = new RenderState();
    animT = 0;
    attackT = 0;
    ultPoseT = 0;
    hurtT = 0;
    slideT = 0;
    slideCd = 0;
    diving = !1;
    apex = 0;
    slamCd = 0;
    diveTip = !1;
    invisT = 0;
    noHitT = 0;
    sitrusCd = 0;
    focusCd = 0;
    sashUsed = !1;
    revives = 0;
    dead = !1;
    heroPlayback;
    lastHit = null;
    sturdyUsed = !1;
    speedBoostT = 0;
    landBuffer = 0;
    climbing = !1;
    stuckT = 0;
    surfing = !1;
    wading = !1;
    hazardSlow = 1;
    pstat = { para: 0, sleep: 0, charm: 0, frozen: 0, bound: 0 };
    slip = 0;
    arenaSlip = 0;
    arenaSlow = 1;
    splashT = 0;
    skateT = 0;
    gliding = !1;
    skateMarkT = 0;
    wasIn = !1;
    wakeT = 0;
    onIceNow = !1;
    swimNow = !1;
    squash = 0;
    abilityTimer = 0;
    mudT = 0;
    growth = 0;
    auraStacks = 0;
    auraT = 0;
    headache = 0;
    angerStacks = 0;
    angerT = 0;
    timeCd = 0;
    elecT = 2.5;
    riftT = 8;
    lumT = 30;
    sunT = 6;
    windT = 5;
    rainbowUsed = !1;
    stillT = 0;
    freshStore = 0;
    freshT = 1.5;
    scopeIdx = -1;
    scopeT = 0;
    scopeFxT = 0;
    guardT = 0;
    rodT = 4;
    baseSpeed = 1;
    landCd = 0;
    burnT = 0.5;
    scaleKey = ``;
    roster;
    constructor(e, t, n) {
      ((this.run = e),
        (this.meta = n),
        (this.speciesId = t),
        (this.data = k.get(t)),
        (this.types = this.data.types),
        (this.evoStage = 0),
        (this.roster = rosterForMode(le(t, (e) => k.root(e).id), e.mode)),
        (this.ability = this.roster?.passive ?? k.abilities[this.data.abilities[0]]?.key ?? `none`),
        this.recompute(),
        (this.hp = this.maxHp));
    }
    get floats() {
      return this.ability === `levitate` || this.ability === `iron-body` || !!Bg(this.ability)?.floats;
    }
    growthStage() {
      return this.run.nextEvo ? 0 : +(this.level >= 24) + +(this.level >= 44);
    }
    checkGrowth() {
      let e = Math.max(0, this.growthStage() - this.evoStage);
      if (e <= this.growth) return;
      ((this.growth = e), this.recompute());
      let t = this.run;
      (t.vfx.ring(this.pos.x, this.pos.y, this.pos.z, 3.2, 16771178, 0.5),
        t.vfx.burst(this.pos.x, this.pos.y + 1, this.pos.z, 16771178, 22, 5, I.Star, 0.6, 0.6),
        t.ui.toast(c(`¡{name} se ha hecho más fuerte! (+12% daño y PS)`, { name: this.data.name }), null),
        t.audio.power());
    }
    baseBlock() {
      let e = nv(this.data, this.evoStage + this.growth, this.meta);
      return (av(e), e);
    }
    refreshScaling() {
      if (!this.items.has(`reaper-cloth`) && !this.items.has(`cell-battery`)) return;
      let e = `${Math.floor(this.run.stats.kills / 100)}|${Math.floor(this.run.streak / 10)}`;
      e !== this.scaleKey && ((this.scaleKey = e), this.recompute());
    }
    get abilityName() {
      return (
        cv[this.ability]?.name ?? Object.values(k.abilities).find((e) => e.key === this.ability)?.name ?? `—`
      );
    }
    setSpecies(e) {
      let t = this.hp / this.maxHp;
      this.ability=this.roster?.passive??this.ability;
      for (const [slot, move] of this.moves.entries()) if (move) {
        const def = formMove(move.def.id, e);
        if (def) move.def = def;
        else this.forgetMove(slot);
      }
      ((this.speciesId = e),
        (this.data = k.get(e)),
        (this.types = this.data.types),
        this.evoStage++,
        this.recompute(),
        (this.hp = Math.min(this.maxHp, this.maxHp * Math.max(t, 0.5) + this.maxHp * 0.3)));
    }
    recompute() {
      let e = nv(this.data, this.evoStage + this.growth, this.meta);
      this.baseSpeed = e.moveSpeed;
      let t = [],
        n = [],
        r = [],
        i = [],
        a = [];
      for (let [e, n] of this.vitamins) {
        let r = Ne.get(e);
        r && t.push(...Ve(r, n));
      }
      for (let [t, r] of this.items) {
        let i = sn.get(t);
        if (!i) continue;
        for (const mod of i.mods) n.push(stackedItemModifier(mod, r));
        let a = dn[t];
        a && (e.typeBoost[a] = (e.typeBoost[a] ?? 1) + 0.3 * r);
      }
      for (let [t, n] of Object.entries(cv[this.ability]?.typeBoost ?? {}))
        e.typeBoost[t] = (e.typeBoost[t] ?? 1) + n;
      (this.items.has(`eviolite`) &&
        k.evolutionsOf(this.speciesId).length &&
        n.push({ stat: `armor`, mul: 1.5 }, { stat: `maxHp`, mul: 1.25 }),
        i.push(...pv(this.ability, this.run)),
        this.buffs.has(`move-buff`) && a.push(...ev),
        this.buffs.has(`altar`) && a.push({ stat: `damage`, mul: 1.2 }));
      let o = this.items.get(`metal-powder`);
      (o &&
        this.buffs.has(`metal`) &&
        a.push({ stat: `armor`, mul: 1 + 0.3 * o }, { stat: `attackSpeed`, mul: 1 + 0.08 * o }),
        this.buffs.has(`flute`) && a.push({ stat: `attackSpeed`, mul: 1.3 }),
        a.push(...cf((e) => this.buffs.has(e))));
      let s = this.items.get(`adrenaline-orb`);
      s &&
        this.buffs.has(`adrenaline`) &&
        a.push({ stat: `moveSpeed`, mul: 1 + 0.2 * s }, { stat: `attackSpeed`, mul: 1 + 0.12 * s });
      let c = this.items.get(`reaper-cloth`);
      c &&
        n.push({ stat: `damage`, mul: 1 + Math.min(0.3, Math.floor(this.run.stats.kills / 100) * 0.01) * c });
      let l = this.items.get(`cell-battery`);
      l &&
        n.push({
          stat: `attackSpeed`,
          mul: 1 + Math.min(0.25, Math.floor(this.run.streak / 10) * 0.015) * l,
        });
      for (let e of this.run.tempMods) r.push(e);
      (rv(e, [t, n, r, i, a, this.run.allies ? this.run.allies.mods() : []]),
        av(e),
        this.run.endless && (e.moveSpeed = de(e.moveSpeed)));
      applyStarterSpeed(e,this.buffs,this.speciesId);
      e.damage *= 1 + windSpeedDamageBonus(this.speciesId,e.moveSpeed,this.baseSpeed);
      let u = this.maxHp;
      ((this.stats = e),
        (this.maxHp = Math.round(e.maxHp)),
        this.maxHp > u && u > 0 && (this.hp += this.maxHp - u),
        (this.hp = Math.min(this.hp, this.maxHp)),
        (this.radius = 0.5));
    }
    freeMoveSlot() {
      return this.moves.findIndex((move, slot) => slot < this.moveSlots && !move);
    }
    addMove(e) {
      let t = formMove(e, this.speciesId);
      if (!t) return !1;
      let n = this.freeMoveSlot();
      if(n<0)return false;
      this.moves[n]=new M_(t);
      if(this.run.fireTexturesPrepared){
        this.run.vfx.crafted.prepareMoveTexture(t.effectKey ?? t.key).catch(error=>console.warn('技能贴图预热失败',error));
      }
      return true;
    }
    forgetMove(e) {
      let t = this.moves[e];
      if (t && t.damageDone > 0) {
        let e = this.run.stats.forgotten;
        (e[t.def.key] ??= { name: t.def.name, type: t.def.type, dmg: 0 }).dmg += t.damageDone;
      }
      this.moves[e] = null;
    }
    hasMove(e) {
      return this.moves.some((t) => t?.def.id === e);
    }
    ownedMoveIds() {
      let e = new Set();
      for (let t of this.moves)
        if (t) {
          e.add(t.def.id);
          for (let n of t.parents) e.add(n);
        }
      return e;
    }
    canTakeVitamin(key) {
      return Ne.has(key) && (this.chosenVitamins.has(key) || this.chosenVitamins.size < vitaminKindLimit) &&
        (this.vitamins.get(key)?.level ?? 0) < this.vitCap;
    }
    addVitamin(e, t) {
      let n = this.vitamins.get(e);
      if (!this.canTakeVitamin(e)) return false;
      this.chosenVitamins.add(e);
      if (
        ((this.run.vitTaken = !0),
        n
          ? (n.level >= 10 && (n.extra ??= []).push(t), n.level++, (n.acc += t))
          : this.vitamins.set(e, (n = { level: 1, acc: t })),
        Ne.get(e)?.dice)
      ) {
        let { mod: e, def: r } = ke(t, (e) => F.pick(e));
        (n.rolls ??= []).push(e);
        let i = e.add ?? e.mul - 1,
          a = r.kind === `mul` || e.stat === `critChance` || e.stat === `evasion` || e.stat === `lifesteal`,
          o = this.run,
          s = this.pos;
        (o.ui.toast(
          c(`Dado Trucado: {v} {stat}`, {
            v: a ? `+${Math.round(i * 100)}%` : `+${+i.toFixed(1)}`,
            stat: r.desc.toLowerCase(),
          }),
          r.icon,
        ),
          o.vfx.burst(s.x, s.y + 1.6, s.z, 16777215, 12, 4, I.Star, 0.45, 0.5),
          o.vfx.ring(s.x, s.y + 0.1, s.z, 2.4, 16765498, 0.35, 0.3));
      }
      this.recompute();
      return true;
    }
    get moveCap() {
      return 8 + (this.items.has(`tm-case`) ? 2 : 0);
    }
    capOf(e) {
      return e.def.fusion ? 5 + +!!this.items.has(`tm-case`) : this.moveCap;
    }
    get vitCap() {
      return 10 + (this.items.has(`max-ether`) ? 2 : 0);
    }
    canHold(e) {
      return sn.has(e) && (e !== springShoesKey || (this.run.springShoesState !== 'claimed' && !this.items.has(e)));
    }
    copyableItemKeys() {
      return [...this.items.keys()].filter(key => key !== springShoesKey);
    }
    addItem(e) {
      return this.canHold(e)
        ? (this.items.set(e, (this.items.get(e) ?? 0) + 1),
          e === springShoesKey && (this.run.springShoesState = 'claimed'),
          (this.run.peakItems = Math.max(
            this.run.peakItems,
            [...this.items.values()].reduce((e, t) => e + t, 0),
          )),
          e === `rare-candy` && (this.gainLevel(), this.run.later(0.3, () => this.gainLevel())),
          e === `max-revive` && this.revives++,
          e === `old-rod` && (this.run.sprites.get(129), this.run.sprites.get(130)),
          this.recompute(),
          !0)
        : !1;
    }
    removeItem(e) {
      let t = this.items.get(e) ?? 0;
      if (
        (t <= 1 ? this.items.delete(e) : this.items.set(e, t - 1),
        e === `max-revive` && (this.revives = Math.max(0, this.revives - 1)),
        e === `ss-ticket` && this.run.allies.trim(),
        e === `max-ether` && !this.items.has(e))
      )
        for (let e of this.vitamins.values())
          for (; e.level > 10 && e.extra?.length; )
            ((e.acc -= e.extra.pop()), e.level--, e.rolls && e.rolls.length > e.level && e.rolls.pop());
      if (e === `tm-case` && !this.items.has(e)) for (let e of this.moves) e && I_(e, e.def.fusion ? 5 : 8);
      this.recompute();
    }
    addBuff(e, t, n) {
      (this.buffs.set(e, { t, label: n, max: t }), this.recompute());
    }
    bonusDamageMult() {
      let e = 1,
        t = this.hp / this.maxHp,
        n = cv[this.ability];
      (n?.lowHp && t < 0.4 && (e *= n.lowHp),
        this.items.has(`metronome`) &&
          (e *= 1 + Math.min(0.4, this.noHitT * 0.02) * this.items.get(`metronome`)));
      let r = this.items.get(`bicycle`);
      (r && (e *= 1 + this.bikeBonus() * r),
        this.items.has(`rage-candy-bar`) && (e *= 1 + this.rageBonus()),
        this.items.has(`coin-case`) && (e *= 1 + this.coinBonus()),
        (this.ability === `speed-boost` || this.ability === `moxie` || this.ability === `horn-pride`) &&
          (e *= 1 + Math.min(0.3, this.speedBoostT * 0.01)),
        this.auraT > 0 && (e *= 1 + this.auraStacks * 0.06),
        this.ability === `gem-hoarder` && (e *= 1 + Math.min(0.25, Math.max(0, this.run.gold) / 2500)),
        ((this.ability === `chlorophyll` && this.run.weather === `sun`) ||
          (this.ability === `swift-swim` && this.run.weather === `rain`)) &&
          (e *= 1.2),
        this.angerT > 0 && (e *= 1 + this.angerStacks * 0.06));
      let i = Bg(this.ability);
      return (i?.damageMul && (e *= i.damageMul(this.run, this)), e);
    }
    bikeBonus() {
      return Math.min(0.35, 0.5 * Math.max(0, this.stats.moveSpeed / this.baseSpeed - 1));
    }
    rageBonus() {
      return 0.6 * Gs((1 - this.hp / this.maxHp) / 0.75, 0, 1);
    }
    coinBonus() {
      return Math.min(0.3, this.run.goldSpent / 3e4);
    }
    addHeadache(e) {
      if (this.ability !== `headache` || this.dead || ((this.headache += e), this.headache < 1)) return;
      this.headache = 0;
      let t = this.run,
        n = this.speciesId === 55,
        r = n ? 10 : 7,
        i = this.pos.x,
        a = this.pos.y,
        o = this.pos.z;
      for (let e = 0; e < 3; e++)
        t.later(e * 0.08, () =>
          t.vfx.ring(i, a, o, r * (0.55 + e * 0.22), e === 1 ? 6994175 : 16739032, 0.45, 0.15, L.Runes),
        );
      t.vfx.norm.spawn({
        x: i,
        y: a + 2.6,
        z: o,
        life: 0.5,
        size: 0.6,
        endSize: 2.2,
        color: 16777215,
        shape: I.PixSpiral,
        spin: 6,
      });
      for (let e of t.enemies.within(i, o, r))
        t.combat.hit(e, (20 + this.level * 4) * Fg(t), {
          type: `psychic`,
          cls: `special`,
          status: `confusion`,
          statusChance: 1,
          knock: 4,
        });
      (n && this.heal(this.maxHp * 0.08), t.shake(0.18), t.audio.move(`psyshock`, `impact`));
    }
    xpFor(e) {
      return Math.round(Tv(e) * (this.run.endless ? Se(e) : 1));
    }
    gainLevel() {
      (this.level++,
        (this.xpNext = this.xpFor(this.level)),
        (this.xp = Math.min(this.xp, this.xpNext * 0.99)),
        this.run.queueLevelUp(),
        this.checkGrowth());
    }
    addXp(e) {
      for (this.xp += e * this.stats.xpGain * this.run.diff.xpMult; this.xp >= this.xpNext; )
        ((this.xp -= this.xpNext),
          this.level++,
          (this.xpNext = this.xpFor(this.level)),
          this.run.queueLevelUp());
      this.checkGrowth();
    }
    heal(e) {
      if (e <= 0 || this.dead) return 0;
      let t = this.hp,
        n = (this.run.endless ? dr(this.run.time / 60) : 1) * (this.woundT > 0 ? 0.5 : 1),
        r = e * this.stats.healing * n;
      ((this.hp = Math.min(this.maxHp, this.hp + r)),
        this.hp > t && this.run.meta.count(`healed`, this.hp - t),
        r > this.hp - t &&
          this.items.has(`fresh-water`) &&
          (this.freshStore = Math.min(this.maxHp * 0.4, this.freshStore + r - (this.hp - t))));
      let i = this.stats.overheal * this.maxHp;
      return (
        i > 0 &&
          r > this.hp - t &&
          this.overheal < i &&
          ((this.overheal = Math.min(i, this.overheal + r - (this.hp - t))),
          this.ohFxT <= 0 &&
            ((this.ohFxT = 0.25),
            this.run.vfx.burst(
              this.pos.x,
              this.pos.y + 1.2,
              this.pos.z,
              16767050,
              3,
              2.5,
              I.Twinkle,
              0.35,
              0.4,
            ))),
        this.hp - t
      );
    }
    leech(e) {
      let t = Math.min(e, this.leechBudget);
      t <= 0 || ((this.leechBudget -= t), (this.leechAcc += this.heal(t)));
    }
    leechAcc = 0;
    leechT = 0;
    leechBudget = 0;
    woundT = 0;
    woundPopT = 0;
    wound(e) {
      this.dead ||
        (this.woundT <= 0 &&
          this.woundPopT <= 0 &&
          ((this.woundPopT = 3),
          this.run.ui.popup(
            this.pos.x,
            this.pos.y + 2.9,
            this.pos.z,
            c(`¡Herida! Curas la mitad`),
            `#ff6a8a`,
            1,
          )),
        (this.woundT = Math.max(this.woundT, e)));
    }
    shove(e, t, n) {
      ((this.kx += e * n), (this.kz += t * n));
      let r = Math.hypot(this.kx, this.kz);
      r > 12 && ((this.kx *= 12 / r), (this.kz *= 12 / r));
    }
    hurt(e, t, n, r = NaN, i = NaN, a = !1, o = 0, s = n, l = {}) {
      let u = this.run;
      if (
        (a && this.ability === `magic-guard`) ||
        this.iframes > 0 ||
        this.dead ||
        this.invisT > 0 ||
        u.frozen ||
        u.regionCleared ||
        u.state === `transition`
      )
        return !1;
      if (F.chance(this.stats.evasion * (l.evade ?? 1)))
        return (
          u.stats.dodges++,
          (this.iframes = 0.25),
          u.vfx.text.spawn(this.pos.x, this.pos.y + 2.2, this.pos.z, `-`, 11069695, 0.5),
          u.audio.dodge(),
          u.meta.count(`dodges`, 1),
          this.ability === `steadfast-aura` &&
            ((this.auraStacks = Math.min(5, this.auraStacks + 1)), (this.auraT = 4)),
          this.ability === `shadow-tag` &&
            n >= 0 &&
            u.combat.hit(n, 60, { type: `ghost`, cls: `physical`, fixed: !0 }),
          n >= 0 && this.stats.thorns > 0 && this.vitamins.has(`sticky-barb`) && this.thorns(n),
          Bg(this.ability)?.onDodge?.(u, this, n),
          !1
        );
      let d = this.items.get(`guard-spec`);
      if (d && this.guardT <= 0 && !a)
        return (
          (this.guardT = 14 - 3 * (d - 1)),
          u.stats.dodges++,
          u.meta.count(`dodges`, 1),
          (this.iframes = 0.4),
          u.vfx.ring(this.pos.x, this.pos.y + 0.1, this.pos.z, 2.2, 10148095, 0.35, 0.3),
          u.vfx.burst(this.pos.x, this.pos.y + 1.2, this.pos.z, 14217471, 12, 4, I.Square, 0.4, 0.4),
          u.ui.popup(this.pos.x, this.pos.y + 2.4, this.pos.z, c(`¡Protección!`), `#9ad8ff`, 0.8),
          u.audio.dodge(),
          !1
        );
      let f = e;
      (t && (f *= Math.max(0.5, Math.min(1.6, k.effectiveness(t, this.types)))),
        (f *= 1 - ov(this.stats.armor)),
        cv[this.ability]?.dmgTaken && (f *= cv[this.ability].dmgTaken),
        this.ability === `magic-guard` && n < 0 && (f *= 0.7),
        this.ability === `multiscale` && this.hp >= this.maxHp - 0.5 && (f *= 0.5));
      let p = Bg(this.ability);
      // Contact and boss effects carry an enemy index. Projectiles and death bursts
      // keep a source snapshot because the enemy slot can be reused before impact.
      const source = typeof s === 'number' && s >= 0 ? Ef(u, s) : s;
      const enemyHit = source?.species > 0 && source.kind !== 'event';
      const enemyDamageScale = ENEMY_DAMAGE_SCALE *
        (u.biome.id === 'forest' && u.stage === 2 && !u.endless && !u.tower ? 1.5 : 1);
      const openingDragon = u.stage === 1 && !u.endless && !u.tower &&
        source?.species === finalBossSpecies && (source.kind === 'boss' || source.kind === 'legendary');
      if (
        (p?.hurtMod && (f = Math.max(0, p.hurtMod(u, this, f, n))),
        l.floor && (f = Math.max(f, this.maxHp * l.floor * (1 - wv * (e > 0 ? 1 - Math.min(1, f / e) : 0)))),
        o > 0 && (f = Math.min(f, this.maxHp * o)),
        (f = df(u, f) * (enemyHit ? enemyDamageScale : 1) * (openingDragon ? 0.5 : 1)),
        this.overheal > 0)
      ) {
        let e = Math.min(this.overheal, f);
        ((this.overheal -= e),
          (f -= e),
          e > 0 && u.vfx.burst(this.pos.x, this.pos.y + 1.1, this.pos.z, 16767050, 5, 4, I.Spark, 0.3, 0.3));
      }
      if (this.shield > 0) {
        let e = Math.min(this.shield, f);
        ((this.shield -= e), (f -= e));
      }
      if (
        ((this.hp -= f),
        f > 0 &&
          (this.lastHit =
            typeof source === 'object'
              ? source
              : { kind: a ? `hazard` : u.sanctuary && u.stage >= 4 ? `legendary` : `other`, species: 0 }),
        u.ult?.onHurt(f / this.maxHp),
        p?.onHurt?.(u, this, f, n),
        (this.iframes = l.ordinaryContact && u.director.normalOpening && !u.bossSpawned ? 1.25 : 0.45),
        (this.flash = 1),
        (this.hurtT = 0.3),
        (this.pstat.sleep = 0),
        (this.noHitT = 0),
        (this.squash = 0.5),
        (u.stats.damageTaken += f),
        u.stats.hits++,
        u.vfx.playerDamage(this.pos.x, this.pos.y + (this.hp<=0 && heroActionCatalog[this.speciesId] ? 4 : 2), this.pos.z, f),
        u.r.kick(0.006),
        u.shake(0.12),
        Na(0.25 + 0.6 * Math.min(1, (f / this.maxHp) * 4), 110),
        u.audio.hurt(),
        n >= 0)
      ) {
        this.stats.thorns > 0 && this.thorns(n);
        let t = cv[this.ability];
        (t?.contact && u.combat.applyStatus(n, t.contact, e * 2),
          this.ability === `effect-spore` &&
            u.combat.applyStatus(n, F.pick([`sleep`, `paralysis`, `poison`]), e * 2));
      }
      if (
        (this.ability === `headache` && this.addHeadache((f / this.maxHp) * 2.5),
        this.ability === `anger-point` && this.hp > 0)
      ) {
        let e = this.speciesId === 57 ? 8 : 6;
        (this.angerStacks < e &&
          (this.angerStacks++,
          u.vfx.add.spawn({
            x: this.pos.x,
            y: this.pos.y + 2.2,
            z: this.pos.z,
            vy: 1.5,
            life: 0.5,
            size: 0.5,
            endSize: 0.9,
            color: 16734778,
            shape: I.Cross,
            glow: 0.3,
          })),
          (this.angerT = 5));
      }
      if (
        (this.items.has(`smoke-ball`) && F.chance(0.25) && (this.invisT = 1.5),
        this.items.has(`adrenaline-orb`) && this.hp > 0 && this.addBuff(`adrenaline`, 3, c(`Adrenalina`)),
        this.items.has(`adamant-orb`) && this.timeCd <= 0 && this.hp > 0 && this.stopTime(),
        this.items.has(`sitrus-berry`) &&
          this.hp < this.maxHp * 0.3 &&
          this.sitrusCd <= 0 &&
          this.hp > 0 &&
          ((this.sitrusCd = 45),
          this.heal(this.maxHp * 0.35),
          u.ui.toast(c(`¡Baya Zidra! Recuperas PS`), `sitrus-berry`)),
        this.hp <= 0)
      ) {
        if (this.ability === `sturdy` && !this.sturdyUsed)
          return (
            (this.sturdyUsed = !0),
            (this.hp = 1),
            u.ui.toast(c(`¡Robustez! Aguantas con 1 PS`), null),
            (this.iframes = 1.5),
            !0
          );
        if (this.items.has(`focus-sash`) && !this.sashUsed)
          return (
            (this.sashUsed = !0),
            (this.hp = 1),
            u.ui.toast(c(`¡Banda Focus! Aguantas con 1 PS`), `focus-sash`),
            (this.iframes = 1.5),
            !0
          );
        if (
          this.items.has(`focus-band`) &&
          this.focusCd <= 0 &&
          F.chance(1 - 0.85 ** this.items.get(`focus-band`))
        )
          return (
            (this.focusCd = Dv),
            (this.hp = 1),
            u.ui.toast(c(`¡Cinta Focus!`), `focus-band`),
            (this.iframes = 1.5),
            !0
          );
        if (this.items.has(`rainbow-wing`) && !this.rainbowUsed)
          return ((this.rainbowUsed = !0), this.rebirth(), !0);
        if (this.items.has(`revive`))
          return (
            this.removeItem(`revive`),
            (this.hp = this.maxHp * 0.35),
            (this.iframes = 2.5),
            u.revived(`revive`),
            !0
          );
        if (this.revives > 0)
          return (
            this.removeItem(`max-revive`),
            (this.hp = this.maxHp * 0.6),
            (this.iframes = 3),
            u.revived(`max-revive`),
            !0
          );
        ((this.hp = 0), (this.dead = !0), u.onPlayerDeath());
      }
      return !0;
    }
    thorns(e) {
      let t = this.run,
        n = this.stats.thorns * (1 + this.level * 0.05),
        r = this.items.has(`rocky-helmet`) ? `rocky-helmet` : void 0;
      if (!this.vitamins.has(`sticky-barb`)) {
        t.combat.hit(e, n, { type: `steel`, cls: `physical`, fixed: !0, src: r });
        return;
      }
      let i = this.pos;
      (t.vfx.burst(i.x, i.y + 0.9, i.z, 11557608, 10, 6, I.PixSpike, 0.45, 0.35),
        t.vfx.ring(i.x, i.y + 0.1, i.z, gv, 11557608, 0.25, 0.35));
      for (let e of t.enemies.within(i.x, i.z, gv))
        t.combat.hit(e, n, {
          type: `poison`,
          cls: `physical`,
          fixed: !0,
          src: r,
          status: `poison`,
          statusChance: 0.5,
          noReact: !0,
        });
    }
    stopTime() {
      let e = this.run,
        t = e.enemies,
        n = this.pos.x,
        r = this.pos.z;
      this.timeCd = 20;
      for (let e of t.within(n, r, 22))
        t.stun[e] = Math.max(t.stun[e], 3 * (t.flags[e] & R.Boss ? 0.35 : t.flags[e] & 12290 ? 0.6 : 1));
      for (let t = 0; t < 3; t++)
        e.later(t * 0.1, () => e.vfx.ring(n, this.pos.y, r, 8 + t * 7, t === 1 ? 16777215 : 8042751, 0.7));
      (e.vfx.burst(n, this.pos.y + 1.2, r, 11065599, 24, 8, I.Star, 0.6, 0.7),
        e.ui.toast(c(`¡Diamansfera! El tiempo se detiene`), `adamant-orb`),
        e.audio.power());
    }
    rebirth() {
      let e = this.run,
        t = this.pos.x,
        n = this.pos.y,
        r = this.pos.z,
        i = 7 * Math.sqrt(this.stats.area);
      ((this.hp = this.maxHp * 0.5), (this.iframes = 3));
      for (let a = 0; a < 3; a++)
        e.later(a * 0.12, () => e.vfx.ring(t, n, r, i * (0.5 + a * 0.3), a === 1 ? 16769658 : 16738858, 0.6));
      (e.vfx.burst(t, n + 1.2, r, 16747066, 36, 9, I.Flame, 0.9, 0.8),
        e.vfx.burst(t, n + 2, r, 16773800, 20, 6, I.Feather, 0.8, 1),
        e.shake(0.3),
        e.audio.boom(0.8));
      for (let n of e.enemies.within(t, r, i))
        e.combat.hit(n, (40 + this.level * 6) * Fg(e), {
          type: `fire`,
          cls: `special`,
          status: `burn`,
          statusChance: 1,
          knock: 5,
          noReact: !0,
          src: `rainbow-wing`,
        });
      e.ui.toast(c(`¡Ala Arcoíris! Renaces entre llamas`), `rainbow-wing`);
    }
    sunbeam(e) {
      let t = this.run,
        n = t.enemies,
        r = this.pos,
        i = -1;
      for (let e of n.within(r.x, r.z, 18)) n.isAlive(e) && (i < 0 || n.hp[e] > n.hp[i]) && (i = e);
      if (i < 0) {
        this.sunT = 1;
        return;
      }
      this.sunT = 6;
      let a = n.x[i],
        o = n.y[i],
        s = n.z[i],
        c = 4.5 * Math.sqrt(this.stats.area);
      (t.vfx.lightning(a, o + 14, s, a, o + 0.5, s, 16769658, 0.5),
        t.vfx.ring(a, o, s, c, 16757818, 0.3),
        t.later(0.35, () => {
          (t.vfx.ring(a, o, s, c, 16773800, 0.45),
            t.vfx.burst(a, o + 1, s, 16747050, 24, 8, I.Flame, 0.8, 0.6),
            t.audio.boom(0.55));
          for (let r of n.within(a, s, c))
            t.combat.hit(r, 60 * e * (1 + this.level * 0.09), {
              type: `fire`,
              cls: `special`,
              status: `burn`,
              statusChance: 0.7,
              noReact: !0,
              src: `sun-stone`,
            });
        }));
    }
    gust() {
      let e = this.run,
        t = e.enemies,
        n = this.pos.x,
        r = this.pos.y,
        i = this.pos.z,
        a = 6 * Math.sqrt(this.stats.area);
      this.windT = 5;
      let o = t.within(n, i, a);
      if (!o.length) this.windT = 1;
      else {
        (e.vfx.ring(n, r + 0.3, i, a, 14676735, 0.45),
          e.vfx.burst(n, r + 1, i, 15267583, 16, a * 1.2, I.Feather, 0.6, 0.6));
        for (let r of o) {
          let a = t.x[r] - n,
            o = t.z[r] - i,
            s = Math.hypot(a, o) || 1;
          e.combat.hit(r, 22 * (1 + this.level * 0.08), {
            type: `flying`,
            cls: `special`,
            knock: 7,
            dirX: a / s,
            dirZ: o / s,
            noReact: !0,
            src: `silver-wing`,
          });
        }
      }
    }
    electirizer(e) {
      let t = this.run,
        n = t.enemies,
        r = this.pos,
        i = n
          .within(r.x, r.z, 14)
          .filter((e) => n.isAlive(e))
          .sort((e, t) => Math.hypot(n.x[e] - r.x, n.z[e] - r.z) - Math.hypot(n.x[t] - r.x, n.z[t] - r.z))
          .slice(0, 2 + e);
      if (!i.length) this.elecT = 0.5;
      else {
        this.elecT = 2.5;
        for (let e of i)
          (t.vfx.lightning(
            n.x[e],
            n.y[e] + 9,
            n.z[e],
            n.x[e],
            n.y[e] + n.hgt[e] * 0.5,
            n.z[e],
            16773242,
            0.3,
          ),
            t.vfx.ring(n.x[e], n.y[e], n.z[e], 1.6, 16769594, 0.25),
            t.combat.hit(e, 16 * (1 + this.level * 0.07), {
              type: `electric`,
              cls: `special`,
              status: `paralysis`,
              statusChance: 0.35,
              noReact: !0,
              src: `electirizer`,
            }));
        t.audio.zap();
      }
    }
    rift() {
      let e = this.run,
        t = e.enemies,
        n = this.pos,
        r = t.nearest(n.x, n.z, 16);
      if (r < 0) {
        this.riftT = 1;
        return;
      }
      this.riftT = 8;
      let i = t.x[r],
        a = t.z[r],
        o = t.y[r],
        s = 9 * Math.sqrt(this.stats.area);
      for (let e of t.within(i, a, s)) {
        let n = i - t.x[e],
          r = a - t.z[e],
          o = Math.hypot(n, r) || 1,
          s = t.flags[e] & (R.Boss | R.Summoner) ? 0.1 : t.flags[e] & 12290 ? 0.4 : 1;
        ((t.kx[e] += (n / o) * 14 * s), (t.kz[e] += (r / o) * 14 * s));
      }
      (e.vfx.ring(i, o, a, s, 14191359, 0.6),
        e.vfx.burst(i, o + 1, a, 15247615, 20, 6, I.Swirl, 0.7, 0.6),
        e.later(0.7, () => {
          let n = 4 * Math.sqrt(this.stats.area);
          (e.vfx.ring(i, o, a, n, 16777215, 0.35),
            e.vfx.burst(i, o + 1, a, 14191359, 26, 9, I.Star, 0.7, 0.5),
            e.audio.boom(0.5));
          for (let r of t.within(i, a, n))
            e.combat.hit(r, 30 * (1 + this.level * 0.08), {
              type: `dragon`,
              cls: `special`,
              noReact: !0,
              src: `lustrous-orb`,
            });
        }));
    }
    buildItems(e) {
      let t = this.run,
        n = t.enemies,
        r = this.pos;
      ((this.guardT -= e), (this.landCd -= e), (this.slamCd -= e));
      let i = this.items.get(`fresh-water`);
      if (i && (this.freshT -= e) <= 0) {
        this.freshT = 1.5;
        let e = this.freshStore >= 2 ? n.nearest(r.x, r.z, 14) : -1;
        if (e < 0) this.freshT = 0.3;
        else {
          let a = (6 + this.level) * i + this.freshStore * 2.5;
          ((this.freshStore = 0),
            t.vfx.beams.spawn(
              r.x,
              r.y + 1,
              r.z,
              n.x[e],
              n.y[e] + n.hgt[e] * 0.5,
              n.z[e],
              0.35,
              5945599,
              0.25,
            ),
            t.vfx.burst(n.x[e], n.y[e] + n.hgt[e] * 0.5, n.z[e], 12577023, 10, 4, I.Drop, 0.4, 0.4),
            t.combat.hit(e, a, {
              type: `water`,
              cls: `special`,
              status: `wet`,
              statusChance: 1,
              noReact: !0,
              src: `fresh-water`,
            }));
        }
      }
      if (this.items.has(`silph-scope`)) {
        if (
          ((this.scopeT -= e),
          this.scopeIdx >= 0 && (!n.isAlive(this.scopeIdx) || this.scopeT <= 0) && (this.scopeIdx = -1),
          this.scopeIdx < 0 && this.scopeT <= 0)
        ) {
          let e = -1;
          for (let t of n.within(r.x, r.z, 18)) n.isAlive(t) && (e < 0 || n.maxHp[t] > n.maxHp[e]) && (e = t);
          e >= 0
            ? ((this.scopeIdx = e),
              (this.scopeT = 6),
              t.vfx.ring(n.x[e], n.y[e] + 0.05, n.z[e], 1.8 + n.hgt[e] * 0.4, 16730730, 0.4, 0.3))
            : (this.scopeT = 0.5);
        }
        if (this.scopeIdx >= 0 && (this.scopeFxT -= e) <= 0) {
          let e = this.scopeIdx;
          ((this.scopeFxT = 0.25),
            t.vfx.ground.spawn({
              x: n.x[e],
              y: t.terrain.surface(n.x[e], n.z[e]) + 0.08,
              z: n.z[e],
              life: 0.3,
              size: 1.6 + n.hgt[e] * 0.5,
              endSize: 1.4 + n.hgt[e] * 0.5,
              color: 16730730,
              shape: 3,
              glow: 0.4,
              rot: t.time * 2,
            }));
        }
      }
      let a = this.items.get(`burn-heal`);
      if (a && (this.burnT -= e) <= 0) {
        this.burnT = 0.5;
        let e = 4 + 3 * a,
          i = 0.3 * this.stats.statusDamage;
        for (let a of n.within(r.x, r.z, 22)) {
          if (e <= 0) break;
          if (!n.isAlive(a) || n.burn[a] <= 0) continue;
          let r = n.within(n.x[a], n.z[a], 2.5).find((e) => e !== a && n.isAlive(e) && n.burn[e] <= 0);
          r != null &&
            (e--,
            t.combat.applyStatus(r, `burn`, (n.burnDps[a] * 0.7) / i),
            t.vfx.burst(n.x[r], n.y[r] + n.hgt[r] * 0.5, n.z[r], 16747066, 4, 2, I.Flame, 0.35, 0.35));
        }
      }
      let o = this.items.get(`old-rod`);
      if (o && (this.rodT -= e) <= 0) {
        let e = n.nearest(r.x, r.z, 12);
        e < 0 ? (this.rodT = 1) : ((this.rodT = 9), this.fish(e, o));
      }
    }
    scopeMul(e) {
      return e === this.scopeIdx && this.scopeT > 0 ? 1 + 0.4 * (this.items.get(`silph-scope`) ?? 0) : 1;
    }
    fish(e, t) {
      let n = this.run,
        r = n.enemies,
        i = r.x[e],
        a = r.z[e],
        o = r.y[e];
      F.chance(0.02 + 0.01 * t)
        ? (n.ult.risers.add(130, i, a, 1.5, 1.8),
          n.cry(130),
          n.ui.toast(c(`¡Ha picado un Gyarados!`), `old-rod`),
          n.meta.count(`gyaradosRod`, 1),
          n.later(0.4, () => {
            let e = 6 * Math.sqrt(this.stats.area);
            (n.vfx.ring(i, o, a, e, 5945599, 0.5),
              n.vfx.burst(i, o + 1.5, a, 14677247, 34, 10, I.Drop, 0.7, 0.7),
              n.shake(0.3),
              n.audio.boom(0.7));
            for (let o of r.within(i, a, e))
              n.combat.hit(o, 50 * t * (1 + this.level * 0.1), {
                type: `water`,
                cls: `physical`,
                status: `stun`,
                statusChance: 0.6,
                knock: 6,
                noReact: !0,
                src: `old-rod`,
              });
          }))
        : (n.ult.risers.add(129, i, a, 0.8, 1),
          n.later(0.25, () => {
            (n.vfx.ring(i, o, a, 2.5, 9099519, 0.35),
              n.vfx.burst(i, o + 0.8, a, 14677247, 12, 5, I.Drop, 0.4, 0.5),
              n.audio.shot(`water`, 0.5));
            for (let e of r.within(i, a, 2.5))
              n.combat.hit(e, 9 * t * (1 + this.level * 0.08), {
                type: `water`,
                cls: `physical`,
                status: `wet`,
                statusChance: 1,
                knock: 3,
                noReact: !0,
                src: `old-rod`,
              });
          }));
    }
    slam(e, t) {
      let n = this.run,
        r = this.pos.x,
        i = this.pos.z,
        a = this.stats;
      if (((this.squash = 0.9), this.slamCd > 0)) {
        (n.vfx.dust(r, e, i, 15260864, 10, 4), n.audio.land());
        return;
      }
      this.slamCd = _v;
      let o = Math.min(1, Math.max(0, t) / vv),
        s = (3.2 + 3.3 * o) * Math.sqrt(a.area),
        c = (12 + this.level * 1.5) * Fg(n) * a.slam * (1 + 2 * o),
        l = 0;
      for (let e of n.enemies.within(r, i, s))
        (l++,
          n.combat.hit(e, c, {
            type: this.types[0],
            cls: `physical`,
            knock: 3 + 3 * o,
            status: `stun`,
            statusChance: 0.35 + 0.4 * o,
            noReact: !0,
          }));
      (n.stats.slams++,
        n.meta.count(`slams`, 1),
        (this.iframes = Math.max(this.iframes, 0.3)),
        n.vfx.flash(r, e + 0.5, i, 16773840, 3 + 3 * o, 0.12),
        n.vfx.ring(r, e + 0.06, i, s, 16771248, 0.35, 0.45),
        n.vfx.ring(r, e + 0.08, i, s * 0.55, 16777215, 0.25, 0.35),
        n.later(0.08, () => n.vfx.ring(r, e + 0.05, i, s * 1.15, 13148272, 0.4, 0.2)),
        n.vfx.groundN.spawn({
          x: r,
          y: e + 0.08,
          z: i,
          life: 1.4 + o,
          size: s * 1.1,
          endSize: s * 1.1,
          color: 2759188,
          shape: I.Crack,
          rot: F.range(0, 6.28),
        }),
        n.vfx.dust(r, e, i, 14207144, 14 + Math.round(10 * o), s * 1.3),
        n.vfx.burst(r, e + 0.4, i, 12098160, 10 + Math.round(10 * o), 6 + 6 * o, I.PixRock, 0.45, 0.6, 9),
        n.shake(0.14 + 0.26 * o),
        n.r.kick(0.008 + 0.012 * o),
        Na(0.3 + 0.5 * o, 120),
        l && n.hitstop(0.04 + 0.05 * o),
        n.audio.slam(o));
    }
    quake(e) {
      let t = this.run,
        n = this.pos.x,
        r = this.pos.z,
        i = this.items.get(`iron-ball`),
        a = 4.5 * Math.sqrt(this.stats.area);
      ((this.landCd = 0.4),
        t.vfx.ring(n, e + 0.05, r, a, 13148272, 0.35, 0.25),
        t.vfx.dust(n, e, r, 12098160, 16, a * 1.2),
        t.shake(0.12),
        t.audio.boom(0.35));
      let o = (10 + 0.5 * Math.max(0, this.stats.armor)) * i * (1 + this.level * 0.08);
      for (let e of t.enemies.within(n, r, a))
        t.combat.hit(e, o, {
          type: `ground`,
          cls: `physical`,
          status: `stun`,
          statusChance: 0.25,
          knock: 3,
          noReact: !0,
          src: `iron-ball`,
        });
    }
    bubbles() {
      let e = this.run,
        t = this.pos.x,
        n = this.pos.y,
        r = this.pos.z,
        i = this.items.get(`soda-pop`),
        a = 3 * Math.sqrt(this.stats.area);
      (e.vfx.ring(t, n + 0.05, r, a, 9099519, 0.3, 0.25),
        e.vfx.burst(t, n + 0.5, r, 13627647, 14, a * 1.3, I.Bubble, 0.5, 0.5));
      for (let n of e.enemies.within(t, r, a))
        e.combat.hit(n, 10 * i * (1 + this.level * 0.08), {
          type: `water`,
          cls: `special`,
          status: `wet`,
          statusChance: 1,
          knock: 2,
          noReact: !0,
          src: `soda-pop`,
        });
    }
    onUltimate() {
      if (this.items.has(`poke-flute`)) {
        for (let e of this.moves) e && (e.timer = Math.min(e.timer, 0.05));
        this.addBuff(`flute`, 6, c(`Poké Flauta`));
      }
    }
    inflict(e, t) {
      let n = this.run,
        r = this.types;
      if (this.dead || this.invisT > 0) return !1;
      if ((e === `para` && r.includes(`electric`)) || (e === `frozen` && r.includes(`ice`)))
        return (
          n.ui.popup(this.pos.x, this.pos.y + 2.4, this.pos.z, c(`¡No le afecta!`), `#c8d8e8`, 0.8),
          !1
        );
      if (((e === `sleep` || e === `charm`) && r.includes(`psychic`) && (t *= 0.5), this.pstat[e] >= t))
        return !1;
      this.pstat[e] = t;
      let i = {
          para: c(`¡Paralizado!`),
          sleep: c(`¡Dormido!`),
          charm: c(`¡Enamorado!`),
          frozen: c(`¡Congelado!`),
          bound: c(`¡Atrapado!`),
        }[e],
        a = { para: `#ffe23a`, sleep: `#b8a8ff`, charm: `#ff8ac8`, frozen: `#8ae8ff`, bound: `#c8a8ff` }[e];
      return (
        n.ui.popup(this.pos.x, this.pos.y + 2.6, this.pos.z, i, a, 1),
        e === `frozen` &&
          (n.vfx.burst(this.pos.x, this.pos.y + 0.8, this.pos.z, 12580095, 18, 5, I.Shard, 0.5, 0.5),
          n.audio.shot(`ice`, 0.8)),
        (e === `sleep` || e === `frozen` || e === `bound`) && (this.vel.x = this.vel.z = 0),
        !0
      );
    }
    statusFx(e) {
      let t = this.run,
        n = this.pos,
        r = this.pstat;
      (r.frozen > 0
        ? (Math.random() < e * 30 &&
            t.vfx.add.spawn({
              x: n.x + F.range(-0.7, 0.7),
              y: n.y + F.range(0.1, 1.8),
              z: n.z + F.range(-0.7, 0.7),
              life: 0.35,
              size: 0.5,
              endSize: 0.2,
              color: 12580095,
              shape: I.Shard,
              glow: 0.6,
              rot: F.range(0, 6.3),
            }),
          t.vfx.staticRing(n.x, n.y + 0.05, n.z, 1.1, 9103615, 0.8))
        : r.sleep > 0 &&
          Math.random() < e * 2.5 &&
          t.vfx.text.spawn(n.x + 0.4, n.y + 2.2, n.z, `Z`, 12101887, 0.6),
        r.charm > 0 &&
          Math.random() < e * 5 &&
          t.vfx.add.spawn({
            x: n.x + F.range(-0.5, 0.5),
            y: n.y + 2,
            z: n.z + F.range(-0.5, 0.5),
            vy: 1.2,
            life: 0.7,
            size: 0.45,
            endSize: 0.2,
            color: 16747208,
            shape: I.Heart,
            glow: 0.5,
          }),
        r.para > 0 &&
          Math.random() < e * 8 &&
          t.vfx.lightning(
            n.x + F.range(-0.6, 0.6),
            n.y + 1.6,
            n.z + F.range(-0.6, 0.6),
            n.x + F.range(-0.6, 0.6),
            n.y + 0.2,
            n.z + F.range(-0.6, 0.6),
            16769594,
            0.12,
            3,
            0.1,
          ));
    }
    iceSpray(e, t) {
      let n = this.run,
        r = this.pos,
        i = this.speedNow || 1,
        a = -this.vel.x / i,
        o = -this.vel.z / i;
      for (let i = 0; i < e; i++)
        n.vfx.norm.spawn({
          x: r.x + F.range(-0.3, 0.3),
          y: r.y + 0.08,
          z: r.z + F.range(-0.3, 0.3),
          vx: a * t * F.range(0.5, 1.2) + F.range(-1.2, 1.2),
          vy: F.range(0.8, 2.4),
          vz: o * t * F.range(0.5, 1.2) + F.range(-1.2, 1.2),
          gravity: 16,
          life: F.range(0.25, 0.45),
          size: F.range(0.05, 0.1),
          endSize: 0.03,
          color: F.chance(0.6) ? 16777215 : 12577535,
          shape: I.Square,
        });
    }
    waterFx(e, t, n) {
      let r = this.run,
        i = this.pos,
        a = n + 0.04;
      if (
        (t &&
          !this.wasIn &&
          this.vel.y < 2 &&
          (r.vfx.burst(i.x, a + 0.1, i.z, 12578559, 16, 5, I.Drop, 0.35, 0.55, 14),
          r.vfx.ring(i.x, a, i.z, 2.2, 9099519, 0.5, 0.2),
          r.audio.shot(`water`, 0.5)),
        !t && this.wasIn && r.vfx.burst(i.x, i.y + 0.6, i.z, 14677247, 8, 2, I.Drop, 0.25, 0.5, 14),
        (this.wasIn = t),
        (this.swimNow = t && i.y <= n + 0.25),
        !this.swimNow)
      )
        return;
      let o = this.speedNow;
      if (
        (this.wakeT -= e) <= 0 &&
        ((this.wakeT = this.surfing ? 0.07 : 0.16),
        r.vfx.ring(i.x, a, i.z, o > 1 ? 1.3 : 0.9, 9099519, o > 1 ? 0.5 : 0.8, 0.35),
        o > 1)
      ) {
        let e = -this.vel.x / o,
          t = -this.vel.z / o,
          n = this.surfing ? 2.2 : 1.4;
        for (let o of [-1, 1])
          r.vfx.norm.spawn({
            x: i.x + e * 0.5 - t * o * 0.3,
            y: a + 0.1,
            z: i.z + t * 0.5 + e * o * 0.3,
            vx: e * 1.2 - t * o * n,
            vy: F.range(1, 2),
            vz: t * 1.2 + e * o * n,
            gravity: 9,
            life: 0.45,
            size: 0.22,
            endSize: 0.12,
            color: 12578559,
            shape: I.Drop,
          });
        this.surfing &&
          r.vfx.burst(i.x + e * 0.4, a + 0.2, i.z + t * 0.4, 10151679, 3, 3, I.PixDrop, 0.3, 0.4, 12);
      }
      Math.random() < e * 1.5 &&
        r.vfx.add.spawn({
          x: i.x + F.range(-0.4, 0.4),
          y: a,
          z: i.z + F.range(-0.4, 0.4),
          vy: 0.5,
          life: 0.5,
          size: 0.25,
          endSize: 0.1,
          color: 14677247,
          shape: I.Bubble,
          glow: 0.3,
        });
    }
    iceFx(e, t, n) {
      let r = this.run,
        i = this.pos,
        a = this.speedNow;
      if (
        ((this.onIceNow = t && this.grounded),
        (this.gliding = this.onIceNow && a > 1.2 && (!n || this.skateT > 0.35)),
        !(!this.onIceNow || a < 1))
      ) {
        for (let t = Math.floor(e * a * 4 + Math.random()); t > 0; t--) this.iceSpray(1, a * 0.35);
        if (
          (Math.random() < e * a * 0.6 &&
            r.vfx.add.spawn({
              x: i.x + F.range(-0.4, 0.4),
              y: i.y + 0.1,
              z: i.z + F.range(-0.4, 0.4),
              life: 0.25,
              size: 0.18,
              endSize: 0,
              color: 16777215,
              shape: I.Twinkle,
              glow: 0.8,
            }),
          (this.skateMarkT -= e) <= 0)
        ) {
          this.skateMarkT = 0.05;
          let e = r.terrain.surface(i.x, i.z) + 0.06;
          r.vfx.groundN.spawn({
            x: i.x,
            y: e,
            z: i.z,
            life: 1.4,
            size: 0.35,
            endSize: 0.3,
            color: 15268095,
            shape: I.Soft,
            rot: 0,
          });
        }
        if (n && a > 3) {
          let t = this.facing.x,
            n = this.facing.y,
            r = this.vel.x / a,
            i = this.vel.z / a;
          t * r + n * i < 0.5 && Math.random() < e * 12 && this.iceSpray(3, 4);
        }
        this.skateT >= 1.5 &&
          Math.random() < e * 6 &&
          r.vfx.add.spawn({
            x: i.x + F.range(-0.5, 0.5),
            y: i.y + F.range(0.3, 1.2),
            z: i.z + F.range(-0.5, 0.5),
            life: 0.3,
            size: 0.35,
            endSize: 0,
            color: 12577535,
            shape: I.Twinkle,
            glow: 0.8,
          });
      }
    }
    dragonDive(e) {
      let t = this.run,
        n = this.pos.x,
        r = this.pos.z,
        i = 4.2 * Math.sqrt(this.stats.area);
      (t.vfx.ring(n, e, r, i, 8018687, 0.45),
        t.vfx.ring(n, e, r, i * 0.6, 16777215, 0.3),
        t.vfx.dust(n, e, r, 14207144, 16, i * 1.4),
        t.vfx.burst(n, e + 0.5, r, 10124031, 16, i * 2, I.Flame, 0.6, 0.45),
        t.vfx.groundN.spawn({
          x: n,
          y: e + 0.08,
          z: r,
          life: 1.3,
          size: i * 1.3,
          endSize: i * 1.3,
          color: 2759188,
          shape: I.Crack,
          rot: F.range(0, 6.28),
        }),
        t.shake(0.22),
        t.audio.boom(0.6));
      for (let e of t.enemies.within(n, r, i))
        t.combat.hit(e, (18 + this.level * 2.4) * Fg(t), {
          type: `dragon`,
          cls: `physical`,
          knock: 3,
          status: `stun`,
          statusChance: 0.5,
        });
    }
    attackAnim() {
      this.attackT <= 0 && (this.attackT = 0.3);
    }
    onKill(e, t) {
      let n = this.run,
        r = n.enemies;
      if (this.items.has(`fire-stone`) && r.burn[e] > 0 && Math.random() < 0.5) {
        let t = r.x[e],
          i = r.z[e];
        (n.vfx.ring(t, r.y[e], i, 3.5, 16742954, 0.35),
          n.vfx.burst(t, r.y[e] + 0.5, i, 16742954, 12, 6, I.Flame, 0.6, 0.4));
        for (let e of r.within(t, i, 3.5))
          n.combat.hit(e, 20 * this.items.get(`fire-stone`) * (1 + this.level * 0.08), {
            type: `fire`,
            cls: `special`,
            status: `burn`,
            statusChance: 0.5,
            noReact: !0,
            src: `fire-stone`,
          });
      }
      if (this.ability === `poison-point` && r.poison[e] > 0) {
        let t = r.x[e],
          i = r.z[e];
        for (let e of r.within(t, i, 3)) n.combat.applyStatus(e, `poison`, 8 + this.level);
        n.vfx.burst(t, r.y[e] + 0.5, i, 12606207, 8, 4, I.Bubble, 0.5, 0.5);
      }
      let i = this.items.get(`griseous-orb`);
      if (i && F.chance(0.12)) {
        let t = r.x[e],
          a = r.z[e],
          o = r.y[e];
        (n.vfx.burst(t, o + 0.6, a, 6965928, 8, 2, I.Soft, 0.6, 0.8),
          n.later(0.6, () => {
            (n.vfx.ring(t, o, a, 3.8, 9071320, 0.35),
              n.vfx.burst(t, o + 0.6, a, 10124031, 14, 6, I.Swirl, 0.6, 0.4));
            for (let e of r.within(t, a, 3.8))
              n.combat.hit(e, 18 * i * (1 + this.level * 0.08), {
                type: `ghost`,
                cls: `special`,
                status: `curse`,
                statusChance: 0.6,
                noReact: !0,
                src: `griseous-orb`,
              });
          }));
      }
      let a = this.items.get(`ice-stone`);
      if (a && (r.frozen[e] > 0 || r.chill[e] > 0)) {
        let t = r.x[e],
          i = r.z[e],
          o = r.y[e];
        (n.vfx.burst(t, o + 0.6, i, 12580095, 12, 6, I.Shard, 0.5, 0.5),
          n.vfx.ring(t, o, i, 3.2, 10151679, 0.3));
        for (let e of r.within(t, i, 3.2))
          n.combat.hit(e, 14 * a * (1 + this.level * 0.08), {
            type: `ice`,
            cls: `special`,
            status: `freeze`,
            statusChance: 1,
            noReact: !0,
            src: `ice-stone`,
          });
      }
      let o = this.items.get(`leaf-stone`);
      if (o && F.chance(0.1)) {
        let t = r.x[e],
          i = r.z[e],
          a = r.y[e];
        (n.vfx.burst(t, a + 0.8, i, 8050778, 14, 5, I.Leaf, 0.6, 0.6),
          n.vfx.ring(t, a, i, 3.5, 5949498, 0.3));
        for (let e of r.within(t, i, 3.5))
          n.combat.hit(e, 12 * o * (1 + this.level * 0.08), {
            type: `grass`,
            cls: `physical`,
            noReact: !0,
            src: `leaf-stone`,
          });
        this.heal(this.maxHp * 0.01);
      }
      e === this.scopeIdx && ((this.scopeIdx = -1), (this.scopeT = 0));
      let s = this.items.get(`berry-juice`);
      (s && F.chance(Math.min(0.5, 0.05 * s)) && this.heal(this.maxHp * 0.02),
        this.refreshScaling(),
        (this.ability === `moxie` || this.ability === `beast-boost` || this.ability === `horn-pride`) &&
          (this.speedBoostT = Math.min(30, this.speedBoostT + 0.3)));
    }
    update(e) {
      let t = this.run,
        n = t.input,
        r = t.terrain;
      if (this.dead) {
        (this.vel.set(0, 0, 0),
          (this.crowdX = this.crowdZ = this.kx = this.kz = 0),
          t.coop && ((this.flash = Math.max(0, this.flash - e * 5)), (this.hurtT -= e)));
        return;
      }
      let i = this.stats;
      ((this.iframes -= e),
        (this.woundT -= e),
        (this.woundPopT -= e),
        (this.flash = Math.max(0, this.flash - e * 5)),
        (this.hurtT -= e),
        (this.attackT -= e),
        (this.ultPoseT -= this.run.realDt),
        (this.slideCd -= e),
        (this.invisT -= e),
        (this.noHitT += e),
        (this.sitrusCd -= e),
        (this.timeCd -= e),
        (this.focusCd -= e),
        (this.anchorT -= e),
        Fl.enter(t.hideOwnFx));
      let a = this.items.get(`electirizer`);
      (a && (this.elecT -= e) <= 0 && this.electirizer(a),
        this.items.has(`lustrous-orb`) && (this.riftT -= e) <= 0 && this.rift());
      let o = this.items.get(`sun-stone`);
      (o && (this.sunT -= e) <= 0 && this.sunbeam(o),
        this.items.has(`silver-wing`) && (this.windT -= e) <= 0 && this.gust(),
        this.buildItems(e),
        Fl.leave());
      let s = this.items.get(`lum-berry`);
      (s &&
        (this.lumT -= e) <= 0 &&
        ((this.lumT = 30),
        this.hp < this.maxHp &&
          (this.heal(this.maxHp * (0.12 + 0.04 * (s - 1))),
          t.vfx.burst(this.pos.x, this.pos.y + 1.2, this.pos.z, 10157946, 10, 3, I.Heart, 0.5, 0.5))),
        this.auraT > 0 && ((this.auraT -= e), this.auraT <= 0 && (this.auraStacks = 0)),
        this.angerT > 0 && ((this.angerT -= e), this.angerT <= 0 && (this.angerStacks = 0)),
        Fl.enter(t.hideOwnFx),
        Bg(this.ability)?.frame?.(t, this, e),
        Fl.leave(),
        (this.squash *= Math.exp(-e * 10)));
      let l = !1;
      for (const [key, buff] of this.buffs) {
        buff.t -= e;
        if (key === speedBuff && this.speciesId === 59 && !this.dead && !buff.windBurstDone && buff.t <= .38) {
          buff.windBurstDone = true;
          t.vfx.crafted.windRush?.burst();
        }
        if (buff.t <= 0) {
          this.buffs.delete(key);
          l = true;
        }
      }
      (l && this.recompute(),
        (this.hp < this.maxHp || this.items.has(`fresh-water`)) && this.heal(i.regen * e),
        (this.leechBudget = Math.min(this.maxHp * 0.08, this.leechBudget + this.maxHp * 0.05 * e)),
        (this.leechT -= e) <= 0 &&
          this.leechAcc >= 1 &&
          ((this.leechT = 0.3),
          t.vfx.heal(this.pos.x, this.pos.y + 2.2, this.pos.z, this.leechAcc),
          (this.leechAcc = 0)),
        this.overheal > 0 &&
          (this.overheal = Math.max(
            0,
            Math.min(i.overheal * this.maxHp, this.overheal - this.maxHp * hv * e),
          )),
        (this.ohFxT -= e),
        i.shieldMax > 0 &&
          this.noHitT > 3 &&
          (this.shield = Math.min(
            i.shieldMax,
            this.shield + i.shieldMax * 0.25 * e * (this.woundT > 0 ? 0.5 : 1),
          )),
        this.ability === `speed-boost` && (this.speedBoostT = Math.min(30, this.speedBoostT + e * 0.1)),
        (this.abilityTimer -= e),
        this.abilityTimer <= 0 &&
          ((this.abilityTimer = Math.max(0.5, this.abilityTimer + 1)),
          Fl.enter(t.hideOwnFx),
          cv[this.ability]?.tick?.(t, this),
          Fl.leave()));
      let u = t.camYaw,
        d = Math.max(-1, Math.min(1, n.axis([`KeyA`, `ArrowLeft`], [`KeyD`, `ArrowRight`]) + n.stickX)),
        f = Math.max(-1, Math.min(1, n.axis([`KeyS`, `ArrowDown`], [`KeyW`, `ArrowUp`]) + n.stickY));
      (t.autoRun && f < 0 && (t.autoRun = !1), f === 0 && t.autoRun && (f = 1));
      let p = -Math.sin(u),
        m = -Math.cos(u),
        h = Math.cos(u),
        g = -Math.sin(u),
        _ = p * f + h * d,
        v = m * f + g * d,
        y = Math.hypot(_, v);
      y > 0 && ((_ /= y), (v /= y));
      let b = this.pstat;
      for (let t of [`para`, `sleep`, `charm`, `frozen`, `bound`]) b[t] > 0 && (b[t] = Math.max(0, b[t] - e));
      let x = !!t.coop?.inputBlocked,
        S = b.sleep > 0 || b.frozen > 0 || b.bound > 0 || x;
      (b.charm > 0 && ((_ = -_), (v = -v)),
        S && (_ = v = 0),
        ((S && !x) || b.charm > 0 || b.para > 0) && this.statusFx(e));
      let C =
          (this.ability === `swift-swim` && t.weather === `rain`) ||
          (this.ability === `chlorophyll` && t.weather === `sun`) ||
          (this.ability === `sand-rush` && t.weather === `sand`) ||
          (this.ability === `slush-rush` && t.weather === `hail`)
            ? 1.3
            : 1,
        w = yv * i.moveSpeed * C * (1 + Math.min(0.3, this.speedBoostT * 0.01)),
        T = r.height(this.pos.x, this.pos.z),
        E = r.isLava ? -99 : r.waterAt(this.pos.x, this.pos.z),
        ee = r.frozen && T < E,
        D = !ee && T < E - 0.55;
      // 摇杆幅度决定目标速度，方向由本步采样决定。
      const stickDriven = !!t.ui.touch?.stickDriving;
      if (stickDriven && y > 0) w *= Math.min(1, y);
      if (
        ((this.wading = !ee && !D && T < E - 0.04),
        (this.slip = Math.max(ee && this.pos.y < E + 0.3 ? 1 : 0, this.arenaSlip)),
        (this.arenaSlip = 0),
        this.slip > 0.5 && y > 0 && this.grounded)
      ) {
        let t = Math.hypot(this.vel.x, this.vel.z),
          n = t > 0.5 ? (this.vel.x * _ + this.vel.z * v) / t : 1;
        this.skateT = n > 0.7 ? Math.min(1.5, this.skateT + e) : Math.max(0, this.skateT - e * 3);
      } else this.skateT = Math.max(0, this.skateT - e * (this.slip > 0.5 ? 0.6 : 4));
      if (
        (this.slip > 0 && (w *= 1 + 0.2 * this.slip + 0.3 * (this.skateT / 1.5) * this.slip),
        b.para > 0 && (w *= 0.55),
        (w *= this.arenaSlow),
        (this.arenaSlow = 1),
        (this.surfing = D && this.types.includes(`water`)),
        D ? (w *= this.surfing ? 1.35 : 0.7) : this.wading && !this.types.includes(`water`) && (w *= 0.85),
        (w *= this.hazardSlow),
        S && (y = 0),
        !S && (n.hit(`ShiftLeft`) || n.hit(`ShiftRight`) || n.hit(`ControlLeft`)))
      ) {
        if (
          !this.grounded &&
          !D &&
          !this.diving &&
          !this.climbing &&
          this.pos.y - r.height(this.pos.x, this.pos.z) > 1.2
        )
          ((this.diving = !0),
            (this.vel.y = -34),
            (this.vel.x *= 0.35),
            (this.vel.z *= 0.35),
            (this.squash = -0.7),
            t.vfx.ring(this.pos.x, this.pos.y + 0.6, this.pos.z, 1.4, 16777215, 0.25, 0.2),
            t.audio.dive());
        else if (this.grounded && this.slideCd <= 0 && y > 0) {
          ((this.slideT = 0.55),
            (this.slideCd = 0.9),
            this.items.has(`shed-shell`) &&
              ((this.slideCd = bv), (this.iframes = Math.max(this.iframes, xv))));
          let e = this.slip > 0.5 ? 2.3 : 1.9;
          ((this.vel.x = _ * w * e),
            (this.vel.z = v * w * e),
            this.slip > 0.5
              ? ((this.slideT = 0.9), this.iceSpray(10, 5))
              : D || this.wading
                ? t.vfx.burst(this.pos.x, E + 0.1, this.pos.z, 14677247, 10, 4, I.Drop, 0.3, 0.5, 12)
                : t.vfx.dust(this.pos.x, this.pos.y, this.pos.z, 15260864, 8, 4),
            t.audio.whoosh(),
            this.items.has(`soda-pop`) && this.bubbles());
        }
      }
      if (this.slideT > 0) {
        this.slideT -= e;
        let n = Math.exp(-e * (this.slip > 0.5 ? 0.7 : 2.2));
        ((this.vel.x *= n),
          (this.vel.z *= n),
          this.slip > 0.5
            ? Math.random() < 0.7 && this.iceSpray(1, 2)
            : !D &&
              !this.wading &&
              Math.random() < 0.5 &&
              t.vfx.dust(this.pos.x, this.pos.y, this.pos.z, 15260864, 1, 1.5));
      } else if (this.grounded && this.slip > 0.5) {
        let t = this.vel,
          n = Math.hypot(t.x, t.z),
          i = 1 - 0.6 * (this.slip - 0.5) * 2;
        if (y > 0) {
          let r = n < 1.5 ? 2.2 : 0;
          if (
            ((t.x += _ * (22 * i * e + r)), (t.z += v * (22 * i * e + r)), r && this.iceSpray(4, 2), n > 1)
          ) {
            let r = Math.min(1, e * (1.6 + 2.4 * i)),
              a = t.x + (_ * n - t.x) * r,
              o = t.z + (v * n - t.z) * r,
              s = Math.hypot(a, o) || 1,
              c = Math.hypot(t.x, t.z);
            ((t.x = (a / s) * c), (t.z = (o / s) * c));
          }
        } else {
          let n = Math.exp(-e * 0.35);
          ((t.x *= n), (t.z *= n));
        }
        if (!ee) {
          let n = r.normal(this.pos.x, this.pos.z);
          ((t.x += n.x * 28 * e), (t.z += n.z * 28 * e));
        }
        let a = Math.hypot(t.x, t.z),
          o = w * 1.7;
        if (a > w) {
          let n = Math.max(w, a - e * 2.5),
            r = Math.min(o, n) / a;
          ((t.x *= r), (t.z *= r));
        }
      } else if (stickDriven && !this.diving) {
        if (y > 0) {
          const speed = steerVelocity(Math.hypot(this.vel.x, this.vel.z), w, gameStick.accel, e, gameStick.stopEpsilon);
          this.vel.x = _ * speed;
          this.vel.z = v * speed;
        } else {
          this.vel.x = S ? 0 : steerVelocity(this.vel.x, 0, gameStick.decel, e, gameStick.stopEpsilon);
          this.vel.z = S ? 0 : steerVelocity(this.vel.z, 0, gameStick.decel, e, gameStick.stopEpsilon);
        }
      } else if (this.grounded) {
        let t = _ * w,
          n = v * w,
          // A speed buff should increase stride without making a turn or stop take longer.
          responseSpeed = r.desk2d ? Math.min(yv, w) : w,
          response = Math.min(1, ((y > 0 ? 70 : 40) * e) / Math.max(1, responseSpeed)) * (1 - (y > 0 ? 0.86 : 0.96) * this.slip);
        this.landBuffer > 0 && Math.hypot(this.vel.x, this.vel.z) > w
          ? ((this.vel.x *= 0.97), (this.vel.z *= 0.97))
          : ((this.vel.x += (t - this.vel.x) * Math.min(1, response * 4)),
            (this.vel.z += (n - this.vel.z) * Math.min(1, response * 4)));
      } else {
        let t = this.vel.x * _ + this.vel.z * v,
          n = Math.max(0, Math.min(w * 0.9 - t, (40 * e * w) / 8));
        ((this.vel.x += _ * n), (this.vel.z += v * n));
        let r = Math.hypot(this.vel.x, this.vel.z),
          i = w * 1.7;
        r > i && ((this.vel.x *= i / r), (this.vel.z *= i / r));
      }
      this.landBuffer -= e;
      const hasShoes=this.items.has('air-balloon');
      const probe=w*e+.04;
      const jumpTop=hasShoes && this.grounded && y>0
        ? r.propTop(this.pos.x+_*probe,this.pos.z+v*probe,this.radius) : -Infinity;
      const autoJump=jumpTop>this.pos.y+.0001;
      const baseJump=11*Math.sqrt(i.jumpHeight);
      let O=autoJump?obstacleJumpSpeed(jumpTop-this.pos.y,baseJump,mv,e):baseJump;
      hasShoes && (n.hit(`Space`) || autoJump) &&
        !S &&
        (this.grounded || (D && this.pos.y <= E + 0.35)
          ? ((this.vel.y = O),
            (this.grounded = !1),
            (this.jumpsLeft = Math.floor(i.extraJumps)),
            (this.squash = -0.5),
            t.audio.jump(),
            D || this.wading
              ? (t.vfx.burst(this.pos.x, E + 0.1, this.pos.z, 14677247, 12, 4, I.Drop, 0.3, 0.5, 14),
                t.vfx.ring(this.pos.x, E + 0.03, this.pos.z, 1.8, 9099519, 0.45, 0.2))
              : ee
                ? this.iceSpray(5, 3)
                : t.vfx.dust(this.pos.x, this.pos.y, this.pos.z, 15260864, 5, 3))
          : this.jumpsLeft > 0 &&
            (this.jumpsLeft--,
            (this.vel.y = O * 0.92),
            (this.squash = -0.5),
            t.vfx.ring(this.pos.x, this.pos.y, this.pos.z, 1.6, 16777215, 0.3),
            t.audio.jump(1.3)));
      let te = this.types.includes(`flying`) || this.floats;
      (this.diving &&
        ((this.vel.y = Math.min(this.vel.y, -34)),
        Math.random() < 0.8 &&
          t.vfx.trail(
            this.pos.x + F.range(-0.3, 0.3),
            this.pos.y + F.range(0.3, 1.4),
            this.pos.z + F.range(-0.3, 0.3),
            16777215,
            0.35,
            I.Soft,
            0.25,
          )),
        !this.grounded &&
          !this.diving &&
          te &&
          n.down(`Space`) &&
          this.vel.y < -2 &&
          ((this.vel.y = -2),
          Math.random() < 0.3 &&
            t.vfx.trail(this.pos.x, this.pos.y + 0.3, this.pos.z, 16777215, 0.4, I.Soft, 0.4)),
        (this.vel.y -= mv * e));
      let ne = r.workshopStepHeight ?? 0.6,
        re = this.radius * 0.8,
        ie = (e, t, n, i) => {
          let a = e + Math.sign(n) * re,
            o = t + Math.sign(i) * re;
          return r.height(a, o) > this.pos.y + ne || r.height(e, t) > this.pos.y + ne;
        };
      this.anchorT > 0 && ((this.crowdX *= Cv), (this.crowdZ *= Cv));
      let walkX = this.vel.x * e, walkZ = this.vel.z * e;
      if (r.zxPaper) {
        // Bodies can slow a step into the crowd. Resolve against this frame's
        // stride so pressure from the previous frame cannot steer a turn or release.
        const stride = Math.hypot(walkX, walkZ);
        if (stride > 0) {
          const dx = walkX / stride, dz = walkZ / stride;
          const opposing = -(this.crowdX * dx + this.crowdZ * dz);
          const resistance = Gs(opposing, 0, Math.min(Sv * e, stride * 0.3));
          walkX -= dx * resistance;
          walkZ -= dz * resistance;
        }
      } else {
        const pressure = Math.hypot(this.crowdX, this.crowdZ);
        const scale = pressure > Sv * e ? Sv * e / pressure : 1;
        walkX += this.crowdX * scale;
        walkZ += this.crowdZ * scale;
      }
      let se = Math.exp(-e * 9);
      ((this.kx *= se), (this.kz *= se));
      let ce = walkX + this.kx * e,
        le = walkZ + this.kz * e;
      const blizzard = t.mapEvents?.bliz;
      if (blizzard) {
        // Keep weather drift on the event. A turn can cancel it independently of combat knockback.
        if (stickDriven && y > 0) {
          blizzard.driftX = blizzard.driftZ = 0;
        } else {
          const windDt = this.grounded ? e : 0;
          blizzard.driftX = (blizzard.driftX + blizzard.windX * windDt) * se;
          blizzard.driftZ = (blizzard.driftZ + blizzard.windZ * windDt) * se;
          ce += blizzard.driftX * e;
          le += blizzard.driftZ * e;
        }
      }
      // 在碰撞查询之前钳位，补跑的第二步只能用本显示帧剩余的移动距离。
      if (stickDriven) {
        const distance = Math.hypot(ce, le);
        const limit = Math.min(gameStick.maxStepDistance, t.walkBudget ?? gameStick.maxFrameDistance);
        if (distance > limit) { ce *= limit / distance; le *= limit / distance; }
        t.walkBudget = (t.walkBudget ?? gameStick.maxFrameDistance) - Math.min(distance, limit);
      }
      this.crowdX = this.crowdZ = 0;
      let ue = this.pos.x + ce,
        de = this.pos.z + le,
        fe = this.pos.x,
        pe = this.pos.z;
      this.climbing = !1;
      let me = !1;
      (ie(ue, this.pos.z, ce, 0) ? ((this.vel.x = 0), (this.kx = 0), (me = !0)) : (this.pos.x = ue),
        ie(this.pos.x, de, 0, le) ? ((this.vel.z = 0), (this.kz = 0), (me = !0)) : (this.pos.z = de),
        me &&
          hasShoes &&
          y > 0 &&
          (Ev.some((e) => this.types.includes(e)) || this.floats) &&
          ((this.vel.y = Math.max(this.vel.y, 7.5)),
          (this.climbing = !0),
          Math.random() < 0.3 && t.vfx.dust(this.pos.x, this.pos.y, this.pos.z, 13154464, 1, 1)));
      let he = Math.hypot(this.pos.x - fe, this.pos.z - pe);
      if (!r.zxPaper && he > 1.2) {
        let e = Math.ceil(he),
          t = { x: 0, z: 0 },
          n = this.pos.x,
          i = this.pos.z;
        for (let a = 1; a < e; a++) {
          let o = fe + (n - fe) * (a / e),
            s = pe + (i - pe) * (a / e);
          if ((r.resolve(o, s, this.radius, this.pos.y, t), t.x !== o || t.z !== s)) {
            ((this.pos.x = o), (this.pos.z = s), (this.vel.x = this.vel.z = 0), (this.kx = this.kz = 0));
            break;
          }
        }
      }
      const ge = r.zxPaper
        ? moveDeskPlayer(r,fe,pe,this.pos.x,this.pos.z,this.radius,this.pos.y,{x:0,z:0})
        : r.resolve(this.pos.x,this.pos.z,this.radius,this.pos.y,{x:0,z:0});
      if (
        (r.height(ge.x, ge.z) <= this.pos.y + ne && ((this.pos.x = ge.x), (this.pos.z = ge.z)),
        y > 0 &&
          this.grounded &&
          this.slideT <= 0 &&
          Math.hypot(this.pos.x - fe, this.pos.z - pe) < w * e * 0.2)
      ) {
        if ((this.stuckT += e) > 3) {
          this.stuckT = 1.5;
          let e = !1;
          for (let t = 0; t < 8 && !e; t++)
            e = r.walkClear(
              this.pos.x,
              this.pos.z,
              Math.cos((t * Math.PI) / 4),
              Math.sin((t * Math.PI) / 4),
              4,
              this.radius,
            );
          let n =
            e || (r.zxPaper && !r.hitProp(this.pos.x,this.pos.y,this.pos.z,this.radius)) ||
            Ev.some((e) => this.types.includes(e)) || this.floats
              ? null
              : r.freeSpot(this.pos.x, this.pos.z, this.pos.y, this.radius, { x: 0, z: 0 });
          n &&
            (t.vfx.ring(this.pos.x, this.pos.y, this.pos.z, 2, 16777215, 0.3),
            (this.pos.x = n.x),
            (this.pos.z = n.z),
            (fe = n.x), (pe = n.z),
            (this.pos.y = r.height(n.x, n.z)),
            this.vel.set(0, 0, 0),
            (this.kx = this.kz = 0),
            t.vfx.ring(this.pos.x, this.pos.y, this.pos.z, 2, 16777215, 0.3),
            t.vfx.dust(this.pos.x, this.pos.y, this.pos.z, 15260864, 8, 3));
        }
      } else this.stuckT = Math.max(0, this.stuckT - e * 2);
      let _e = r.walkLim;
      const zLimit=r.deskBounds ? r.deskBounds.z-deskWalkInset : _e;
      if (
        ((this.pos.x = Gs(this.pos.x, -_e, _e)), (this.pos.z = Gs(this.pos.z, -zLimit, zLimit)), r.arenaR < 1 / 0)
      ) {
        let e = Math.hypot(this.pos.x, this.pos.z),
          t = r.arenaR - 0.3;
        e > t && ((this.pos.x *= t / e), (this.pos.z *= t / e));
      }
      if(r.zxPaper){
        // Clip only the blocked fraction of self-propelled velocity. External
        // pushes must not become player momentum on the next frame.
        if(ce && this.pos.x!==ue)this.vel.x*=Gs((this.pos.x-fe)/ce,0,1);
        if(le && this.pos.z!==de)this.vel.z*=Gs((this.pos.z-pe)/le,0,1);
      }
      const windRush = this.buffs.get(speedBuff);
      if (windRush) t.combat.windRushContacts(windRush, fe, pe);
      const platform=r.propTop(this.pos.x,this.pos.z,this.radius,this.pos.y+.0001);
      this.pos.y += this.vel.y * e;
      let ve = Math.max(r.height(this.pos.x, this.pos.z),platform);
      if (
        (D && (ve = E - (this.surfing ? 0.15 : 0.5)),
        ee && (ve = E),
        r.isLava &&
          ve < r.waterLevel + 0.1 &&
          ((ve = r.waterLevel),
          this.pos.y <= ve + 0.05 &&
            !this.types.includes(`fire`) &&
            (this.hurt(this.maxHp * 0.08, `fire`, -1, NaN, NaN, !0),
            (this.vel.y = 13),
            t.vfx.burst(this.pos.x, this.pos.y, this.pos.z, 16738842, 16, 6, I.Flame, 0.6, 0.5))),
        (this.apex = this.grounded ? this.pos.y : Math.max(this.apex, this.pos.y)),
        !this.diveTip &&
          !this.grounded &&
          this.vel.y < 0 &&
          this.pos.y - ve > 4 &&
          !(t.meta.profile.counters.slams > 0) &&
          ((this.diveTip = !0),
          t.ui.toast(
            c(`Pulsa {key} en el aire para caer en picado: cuanto más alto, más daño`, { key: ta(`dash`) }),
            null,
          )),
        this.pos.y <= ve
          ? (this.diving && ((this.diving = !1), D || this.slam(ve, this.apex - ve)),
            !this.grounded &&
              this.vel.y < -8 &&
              ((this.squash = 0.6),
              t.audio.land(),
              (this.landBuffer = 0.12),
              D || this.wading
                ? (t.vfx.burst(this.pos.x, E + 0.1, this.pos.z, 14677247, 18, 6, I.Drop, 0.35, 0.55, 14),
                  t.vfx.ring(this.pos.x, E + 0.03, this.pos.z, 2.4, 9099519, 0.5, 0.2),
                  t.audio.shot(`water`, 0.4))
                : ee
                  ? this.iceSpray(8, 4)
                  : t.vfx.dust(this.pos.x, ve, this.pos.z, 15260864, 8, 4)),
            !this.grounded && this.vel.y < -15 && this.ability === `dragon-dream` && this.dragonDive(ve),
            !this.grounded &&
              this.vel.y < -8 &&
              this.items.has(`iron-ball`) &&
              this.landCd <= 0 &&
              this.quake(ve),
            (this.pos.y = ve),
            this.vel.y < 0 && (this.vel.y = 0),
            (this.grounded = !0),
            (this.jumpsLeft = Math.floor(i.extraJumps)))
          : this.grounded && this.vel.y <= 0 && this.pos.y - ve < 0.9
            ? ((this.pos.y = ve), (this.vel.y = 0))
            : this.pos.y > ve + 0.25
              ? (this.grounded = !1)
              : this.vel.y <= 0 && ((this.pos.y = ve), (this.grounded = !0)),
        this.ability === `mud-trail` &&
          this.grounded &&
          !D &&
          this.speedNow > 1.5 &&
          (this.mudT -= e) <= 0 &&
          ((this.mudT = 0.32),
          t.zones.add({
            x: this.pos.x,
            z: this.pos.z,
            y: this.pos.y,
            r: 1.5,
            life: 2.6,
            tick: 0.2,
            dmg: Rg(`mud-trail`, t, this.level),
            type: `ground`,
            cls: `special`,
            status: `root`,
            chance: 0.3,
            slot: -1,
            color: 9071162,
            fx: Kp(`mud-trail`),
          }),
          t.vfx.groundN.spawn({
            x: this.pos.x,
            y: t.terrain.height(this.pos.x, this.pos.z) + 0.07,
            z: this.pos.z,
            life: 2.6,
            size: 2.2,
            endSize: 2.4,
            color: 6965802,
            shape: I.Soft,
            rot: F.range(0, 6.28),
          })),
        this.wading && this.grounded && this.speedNow > 1 && (this.splashT -= e) <= 0)
      ) {
        this.splashT = 0.22;
        let e = E + 0.03;
        (t.vfx.ring(this.pos.x, e, this.pos.z, 1.1, 9099519, 0.45, 0.3),
          t.vfx.burst(this.pos.x, e + 0.1, this.pos.z, 14677247, 4, 2.6, I.Drop, 0.25, 0.4, 12));
      }
      if (
        (this.waterFx(e, D, E),
        this.iceFx(e, ee || this.slip > 0.5, y > 0),
        (this.speedNow = Math.hypot(this.vel.x, this.vel.z)),
        this.items.has(`metal-powder`))
      ) {
        this.stillT = this.speedNow < 0.6 && this.grounded ? this.stillT + e : 0;
        let n = this.buffs.has(`metal`);
        !n && this.stillT >= 0.8
          ? (this.buffs.set(`metal`, { t: 1e9, label: c(`Polvo Metálico`), max: 1e9 }),
            this.recompute(),
            t.vfx.ring(this.pos.x, this.pos.y + 0.05, this.pos.z, 1.6, 13158616, 0.3, 0.25))
          : n && this.speedNow > 1.5 && (this.buffs.delete(`metal`), this.recompute());
      }
      this.speedNow > 0.5
        ? (this.facing.set(this.vel.x / this.speedNow, this.vel.z / this.speedNow),
          (this.animT += e * (0.5 + this.speedNow / 7)),
          this.grounded &&
            !D &&
            !this.wading &&
            this.slip <= 0.5 &&
            Math.random() < e * this.speedNow * 0.4 &&
            t.vfx.dust(this.pos.x, this.pos.y, this.pos.z, 15260864, 1, 1))
        : (this.animT += e * 0.6);
    }
    render(position = this.pos) {
      let e = this.run,
        evolving = e.state === 'evolving',
        evolutionGlyph = evolving ? this.evolutionGlyph : undefined,
        heroFrame = e.sprites.heroFrame(this,this.speciesId,evolving?'idle':playerHeroAction(this),(this.dead||evolving?e.realTime:e.time)*1000,evolutionGlyph?.[0]),
        t = e.sprites.getPlayerGlyph(Xl(this.speciesId, e.skinLook),this.speciesId,evolving?undefined:this.heroPose??this.firePose,heroFrame),
        n = !evolving && this.speedNow > 0.6 && !this.gliding ? `walk` : `idle`,
        r = evolving ? e.realTime*.6 : this.animT,
        i = !1,
        a = this.gliding ? 0.18 + 0.12 * (this.skateT / 1.5) : 0;
      this.swimNow && (a += Math.sin(this.run.time * 5) * 0.06);
      let o = this.facing.x,
        s = this.facing.y,
        c = 0;
      if (
        !evolving && this.attackT > 0 &&
        ((c = Math.sin((1 - this.attackT / 0.3) * Math.PI) * 0.12), this.speedNow < 0.6)
      ) {
        let t = e.lastAim;
        ((o = t.x), (s = t.z));
      }
      if (!evolving && this.ultPoseT > 0) {
        ((n = `attack`), (r = 1 - this.ultPoseT / 0.6), (i = !0));
        let t = e.lastAim;
        ((o = t.x), (s = t.z));
      }
      (!evolving && this.hurtT > 0 && ((n = `hurt`), (r = 0.6), (i = !0)), this.dead && ((n = `hurt`), (r = 1), (i = !0)));
      let l = e.sprites.dirRow(o, s),
        u = !evolving && this.iframes > 0 && Math.floor(e.time * 20) % 2 == 0,
        d = this.invisT > 0 ? 0.5 : 0,
        f = e.spectralSkin ? [0.82, 0.66, 1.35, 0.68 + 0.07 * Math.sin(e.time * 3)] : [1, 1, 1, 0];
      const glyphIndex = t.push(
        position.x,
        position.y + (this.evolutionLift ?? 0),
        position.z,
        n,
        r,
        l,
        this.renderScale * playerGlyphScale * (heroFrame?.renderScale ?? 1),
        this.dead && heroFrame ? 0 : Math.max(this.flash, u ? 0.5 : 0),
        d,
        e.shinySkin ? Zc(this.speciesId) : 0,
        heroFrame ? 0 : this.squash + c + a + (this.slideT > 0 ? 0.4 : 0),
        ...f,
        i,
        e.skinGl,
        heroFrame?.rect,
        evolutionGlyph?.[1],
        evolutionGlyph?.[2],
      );
      if (e.ult.readyBlinkAt != null && glyphIndex != null && !this.dead) {
        this.readyBatch = t;
        this.readyIndex = glyphIndex;
        this.readyFrame = heroFrame;
      } else {
        this.readyBatch = this.readyFrame = null;
      }
      let p = Math.max(e.terrain.surface(position.x, position.z),
        e.terrain.propTop(position.x,position.z,this.radius,position.y+.0001));
      (e.skinGl &&
        !this.dead &&
        eu(
          e.vfx.add,
          e.skinMember,
          e.skinLook,
          position.x,
          position.y,
          position.z,
          e.realDt,
          t.bodyHeight(this.renderScale),
        ),
        e.spectralSkin &&
          !this.dead &&
          Math.random() < 0.06 &&
          e.vfx.add.spawn({
            x: position.x + F.range(-0.6, 0.6),
            y: position.y + F.range(0.3, 1.6),
            z: position.z + F.range(-0.6, 0.6),
            vy: 0.6,
            life: 0.8,
            size: 0.7,
            endSize: 0,
            color: 11569919,
            shape: I.Wisp,
            glow: 0.6,
          }),
        e.shinySkin &&
          !this.dead &&
          Math.random() < 0.035 &&
          e.vfx.add.spawn({
            x: position.x + F.range(-0.6, 0.6),
            y: position.y + F.range(0.4, 1.8),
            z: position.z + F.range(-0.6, 0.6),
            vy: 0.5,
            life: 0.5,
            size: 0.4,
            endSize: 0,
            color: [16777215, 16773754, 16751328, 10152191][Math.floor(Math.random() * 4)],
            shape: I.Twinkle,
            glow: 1,
            spin: 4,
          }),
        // Original artwork still needs a separate contact shadow on the ground.
        e.sprites.shadows.push(position.x, p, position.z, 1.4),
        e.playerFootRing ??= e.sprites.clipFootRing(createPlayerFootRing(e.r.scene,{PlaneGeometry:Yr,ShaderMaterial:Kr,Mesh:Tr})));
      e.playerFootRing.visible=!this.dead;
      e.playerFootRing.position.set(position.x,p+.09,position.z);
    }
  };

export {
  uv,
  Ov as Player,
  tv,
  nv,
  av,
  ev,
  iv,
  ov
};
