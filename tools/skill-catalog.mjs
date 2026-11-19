import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {setChineseText, chineseText} from '../source/src/chinese-text.js';
import {configureGlyphNames} from '../source/src/zixing-identity.js';
import {moveCopy, specialNames} from '../source/src/form-copy.js';
import {configureStarterSpecies} from '../source/src/starter-characters.js';
import {retiredMoveIds, retiredFusionKeys, moveAvailableForSpecies, configureSkillLearnsets} from '../source/src/skill-availability.js';

export async function loadSkillCatalog() {
  const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
  const json = name => JSON.parse(read(name));
  const source = read('source/src/game.js').replace(/\r\n/g, '\n');
  const moves = json('source/public/data/moves.json');
  const species = json('source/public/data/pokemon.json');
  const learnsets = json('source/public/data/learnsets.json');
  setChineseText(json('source/public/text/ui.json'));
  configureGlyphNames(species);
  configureStarterSpecies(species);
  configureSkillLearnsets(learnsets);
  const config = await import('../source/src/config.js');

  // Evaluate only the game's catalog definitions and pure selection functions.
  // Combat casts remain uncalled; no game, renderer, network, or save is started.
  function between(start, end) {
    const a = source.indexOf(start);
    assert.ok(a >= 0, `Missing catalog start: ${start}`);
    const b = source.indexOf(end, a + start.length);
    assert.ok(b > a, `Missing catalog end: ${end}`);
    return source.slice(a, b);
  }
  const data = {
    moves: new Map(moves.map(m => [m.id, m])),
    movesByKey: new Map(moves.map(m => [m.key, m])),
    byId: new Map(species.map(s => [s.id, s])),
    get(id) { return this.byId.get(id); },
    learnset(id) { return learnsets[id] ?? []; },
  };
  const ctx = vm.createContext({
    c: chineseText, k: data, y: config.Bt, Ye: config.Rt,
    Gs: (x, min, max) => Math.max(min, Math.min(max, x)),
    ji: entries => Object.defineProperties({}, Object.fromEntries(
      Object.entries(entries).map(([key, get]) => [key, {get, enumerable: true}]))),
    moveCopy, specialNames, windMoveEffect: () => null,
    retiredMoveIds, retiredFusionKeys, moveAvailableForSpecies,
  });
  const evaluate = code => vm.runInContext(code, ctx, {timeout: 5000});
  evaluate('var ' + between('Zg = {', 'var e_ = class'));
  evaluate('var ' + between('t_ = ji(', 'var M_ = class'));
  evaluate('var Cx = 5e4; ' + between('function Ax(e, t)', 'var jx ='));
  evaluate(between('var jx =', 'var dS ='));
  evaluate(between('var dS =', 'function yS('));
  evaluate(between('function yS(', 'function xS('));
  evaluate('var ' + between('Lb = 5.2;', 'function Hb('));

  return {ctx, data, moves, species, learnsets, config, source, between, evaluate};
}
