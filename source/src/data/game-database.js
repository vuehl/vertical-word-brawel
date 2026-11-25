import {chineseText as c} from "./chinese-text.js";
import {g as qt, Lr as Te} from "./config.js";
import {configureStarterSpecies} from "./starter-characters.js";
import {configureSkillLearnsets} from "./skill-availability.js";
import {glyphWordForSpecies} from "../actors/paper-glyph-art.js";
import {configureGlyphNames, glyphText} from "./zixing-identity.js";

async function Mi(e, t) {
  let n;
  for (let r = 0; r < 6; r++) {
    r && (t?.(r), await new Promise((e) => setTimeout(e, [1e3, 2e3, 4e3, 8e3, 15e3][r - 1])));
    let i = new AbortController(),
      a = setTimeout(() => i.abort(), 4e4);
    try {
      let t = await fetch(qt(`${e}.json`) + (r ? `&r=${r}` : ``), { signal: i.signal });
      if (!t.ok) throw Error(`HTTP ${t.status}`);
      return await t.json();
    } catch (e) {
      n = e;
    } finally {
      clearTimeout(a);
    }
  }
  throw (console.warn(n), Error(c(`No se pudo cargar {name}.json`, { name: e })));
}
var Ni = {
    normal: 13157544,
    fighting: 14701114,
    flying: 11060479,
    poison: 11886816,
    ground: 14727264,
    rock: 12559962,
    bug: 11061298,
    ghost: 8022744,
    steel: 12110040,
    fire: 16742954,
    water: 3842303,
    grass: 5952074,
    electric: 16767018,
    psychic: 16734880,
    ice: 9367807,
    dragon: 8018687,
    dark: 6967368,
    fairy: 16752864,
  },
  Pi = {
    normal: `Normal`,
    fighting: `Lucha`,
    flying: `Volador`,
    poison: `Veneno`,
    ground: `Tierra`,
    rock: `Roca`,
    bug: `Bicho`,
    ghost: `Fantasma`,
    steel: `Acero`,
    fire: `Fuego`,
    water: `Agua`,
    grass: `Planta`,
    electric: `Eléctrico`,
    psychic: `Psíquico`,
    ice: `Hielo`,
    dragon: `Dragón`,
    dark: `Siniestro`,
    fairy: `Hada`,
  },
  k = new (class {
    pokemon = [];
    byId = new Map();
    moves = new Map();
    movesByKey = new Map();
    learnsets = {};
    abilities = {};
    types;
    items = {};
    sprites = {};
    typeIndex = new Map();
    evolutions = new Map();
    all = [];
    async load(e, t) {
      let n = [
          [`pokemon`, (e) => (this.all = e)],
          [
            `moves`,
            (e) => {
              for (let t of e) (this.moves.set(t.id, t), this.movesByKey.set(t.key, t));
            },
          ],
          [`learnsets`, (e) => (this.learnsets = e)],
          [`abilities`, (e) => (this.abilities = e)],
          [`types`, (e) => (this.types = e)],
          [`items`, (e) => (this.items = e)],
          [`sprites`, (e) => (this.sprites = e)],
        ],
        r = 0;
      await Promise.all(
        n.map(async ([i, a]) => {
          (a(await Mi(i, t)), e?.(++r / n.length));
        }),
      );
      Object.assign(Pi,this.types.names);
      configureStarterSpecies(this.all);
      configureSkillLearnsets(this.learnsets);
      configureGlyphNames(this.all);
      for (let e of this.all) {
        e.name=glyphWordForSpecies(e.id);
        e.flavor=glyphText(e.flavor);
        this.byId.set(e.id, e);
      }
      this.pokemon = this.all.filter((e) => Te(e.id));
      for (let e of this.pokemon)
        if (e.evoFrom != null && Te(e.evoFrom)) {
          let t = this.evolutions.get(e.evoFrom);
          (t || this.evolutions.set(e.evoFrom, (t = [])), t.push(e));
        }
      this.types?.types.forEach((e, t) => this.typeIndex.set(e, t));
    }
    get(e) {
      return this.byId.get(e);
    }
    effectiveness(e, t) {
      if (!this.types) return 1;
      let n = this.typeIndex.get(e);
      if (n == null) return 1;
      let r = 1;
      for (let e of t) {
        let t = this.typeIndex.get(e);
        if (t == null) continue;
        let i = this.types.chart[n][t];
        r *= i >= 2 ? 1.35 : i === 0 ? 0.5 : i <= 0.5 ? 0.8 : 1;
      }
      return Math.max(0.4, Math.min(1.8, r));
    }
    evolutionsOf(e) {
      return this.evolutions.get(e) ?? [];
    }
    runEvolution(e, t) {
      let n = this.evolutionsOf(e);
      if (!n.length) return null;
      let r = t ?? (n.length > 1 ? n[(Math.random() * n.length) | 0] : n[0]),
        i = this.get(e),
        a = r.evoLevel ?? (i.evoStage === 0 ? 20 : 34);
      return this.evolutionsOf(r.id).length
        ? { to: r, level: Math.max(16, Math.min(30, Math.round(8 + a))) }
        : { to: r, level: Math.max(36, Math.min(50, Math.round(22 + a * 0.6))) };
    }
    hasSprite(e) {
      let t = this.sprites[e];
      return !!(t && (t.anims || t.fallback));
    }
    hasAnimated(e) {
      return !!this.sprites[e]?.anims;
    }
    learnset(e) {
      return this.learnsets[e] ?? [];
    }
    root(e) {
      let t = this.get(e);
      for (; t.evoFrom != null && this.byId.has(t.evoFrom) && Te(t.evoFrom); ) t = this.get(t.evoFrom);
      return t;
    }
    abilityName(e) {
      return e == null ? `` : (this.abilities[e]?.name ?? ``);
    }
  })();

export {
  k as gameData,
  Ni as typeColors,
  Pi as typeNames
};
