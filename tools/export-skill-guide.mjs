import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {setChineseText, chineseText} from '../source/src/chinese-text.js';
import {configureGlyphNames} from '../source/src/zixing-identity.js';
import {formCopy, moveCopy, specialNames} from '../source/src/form-copy.js';
import {configureStarterSpecies, starterEvolutionLevels} from '../source/src/starter-characters.js';
import {heroActionCatalog} from '../source/src/hero-action-catalog.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const json = name => JSON.parse(read(name));
const source = read('source/src/game.js').replace(/\r\n/g, '\n');
const moves = json('source/public/data/moves.json');
const species = json('source/public/data/pokemon.json');
const learnsets = json('source/public/data/learnsets.json');
setChineseText(json('source/public/text/ui.json'));
configureGlyphNames(species);
configureStarterSpecies(species);
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
});
const evaluate = code => vm.runInContext(code, ctx, {timeout: 5000});
evaluate('var ' + between('Zg = {', 'var e_ = class'));
evaluate('var ' + between('t_ = ji(', 'var M_ = class'));
evaluate('var Cx = 5e4; ' + between('function Ax(e, t)', 'var jx ='));
evaluate(between('var jx =', 'var dS ='));
evaluate(between('var dS =', 'function yS('));
evaluate('var ' + between('Lb = 5.2;', 'function Hb('));

const clean = value => JSON.parse(JSON.stringify(value));
const fireRoster = config.Bt.find(s => s.id === 4);
const forms = [4, 5, 6].map((id, i) => ({
  id, word: formCopy[id].word, level: i ? starterEvolutionLevels[i - 1] : 1,
  catalog: clean(ctx.Vb(id, fireRoster, ['fire'], () => true)),
}));
const allFusions = clean(ctx.lS).map(r => ({...r, id: ctx.fS(r.key)}));
const availableMoves = moves.map(m => ctx.O_(m.id)).filter(Boolean).map(clean);
const fireIds = [...new Set(forms.flatMap(f => [...f.catalog.kit, ...f.catalog.line, ...f.catalog.shared].map(m => m.id)))];
const fireMoves = fireIds.map(id => {
  const def = clean(ctx.O_(id));
  return {...def, names: Object.fromEntries(forms.map(f => [f.id, moveCopy(f.id, def.name, def.key)])),
    forms: forms.flatMap(f => {
      const offer = [...f.catalog.kit, ...f.catalog.line, ...f.catalog.shared].find(m => m.id === id);
      return offer ? [{id: f.id, level: offer.level, earliest: Math.max(f.level, offer.level)}] : [];
    }),
    label: ctx.g_[def.arch].label,
  };
});
const fusionGroups = new Map();
for (let a = 0; a < fireMoves.length; a++) for (let b = a + 1; b < fireMoves.length; b++) {
  const left = fireMoves[a], right = fireMoves[b];
  if (!ctx.gS(left) || !ctx.gS(right)) continue;
  const recipe = ctx._S(left, right);
  assert.ok(recipe, `Missing fusion for ${left.key} + ${right.key}`);
  const possibleForms = forms.filter(f => left.forms.some(x => x.id === f.id) && right.forms.some(x => x.id === f.id));
  if (!possibleForms.length) continue;
  if (!fusionGroups.has(recipe.key)) fusionGroups.set(recipe.key, []);
  fusionGroups.get(recipe.key).push({a: left.id, b: right.id, forms: possibleForms.map(f => f.id)});
}
const ultStart = source.indexOf('    4: {\n      names: [c(`Llamarada Ascendente`)');
assert.ok(ultStart > 0);
const ultEnd = source.indexOf('    7: {', ultStart);
const ultimate = evaluate('({' + source.slice(ultStart, ultEnd) + '})[4]');
for (const [i, form] of forms.entries()) {
  form.ultimate = {name: formCopy[form.id].ultimate[1], desc: ultimate.descs[i], duration: ultimate.dur[i]};
  const file = path.join(root, `source/public/assets/glyphs/hero-actions/${form.id}.png`);
  const {width, height} = await sharp(file).metadata();
  const {columns, rows} = heroActionCatalog[form.id];
  const picture = await sharp(file).extract({left: 0, top: 0, width: width / columns, height: height / rows}).png().toBuffer();
  form.portrait = 'data:image/png;base64,' + picture.toString('base64');
}
const fireById = new Map(fireMoves.map(m => [m.id, m]));
const activeByKey = new Map(availableMoves.map(m => [m.key, m]));
const windRoster = config.Bt.find(s => s.id === 16);
const windSets = [16, 17, 18, 58, 59].map(id => {
  const catalog = ctx.Vb(id, windRoster, ['flying'], () => true);
  return [...catalog.kit, ...catalog.line, ...catalog.shared].map(m => ctx.O_(m.id)).filter(m => ctx.gS(m));
});
const windKeys = new Set();
for (const set of windSets) for (let a = 0; a < set.length; a++) for (let b = a + 1; b < set.length; b++) {
  windKeys.add(ctx._S(set[a], set[b]).key);
}
const originalNames = new Map();
for (const [before, after] of specialNames.fusion) originalNames.set(after, before);
for (const recipe of allFusions) {
  recipe.originalName = originalNames.get(recipe.name) ?? recipe.name;
  recipe.firePairs = fusionGroups.get(recipe.key) ?? [];
  recipe.reachable = recipe.firePairs.length ? 'fire' : windKeys.has(recipe.key) ? 'wind' : 'retained';
  recipe.materials = (recipe.moves ?? []).map(key => {
    const raw = data.movesByKey.get(key), active = activeByKey.get(key);
    return {key, id: raw?.id, name: raw?.name ?? key, type: raw?.type,
      valid: !!active && ctx.gS(active), reason: !active ? '当前未启用' : !ctx.gS(active) ? '天气或增益技不能作融合材料' : ''};
  });
  if (recipe.materials.some(m => !m.valid)) recipe.reachable = 'blocked';
  recipe.formIds = [...new Set(recipe.firePairs.flatMap(p => p.forms))];
  recipe.desc = recipe.desc.replaceAll('Máquina de Bill', '订书机').replaceAll('比尔的机器', '订书机');
}
const sources = [
  ['source/src/game.js', '技能生成、候选池、融合判定、伤害与大招实现'],
  ['source/src/starter-characters.js', '当前出战名单与 10 / 20 级进阶配置'],
  ['source/src/form-copy.js', '各形态的技能显示名与融合名称'],
  ['source/src/config.js', '炎系固定技能组、入池等级与道具'],
  ['source/public/data/learnsets.json', '进化链学习表（需经运行时筛选）'],
  ['source/public/data/moves.json', '招式基础资料'],
  ['source/public/text/ui.json', '当前中文描述'],
].map(([file, note]) => ({file, note, sha256: crypto.createHash('sha256').update(read(file)).digest('hex').slice(0,12)}));
const types = json('source/public/data/types.json').names;
types.flying = '风';
const report = {forms, fireMoves, fusionGroups: [...fusionGroups], fusionCount: allFusions.length,
  fusionKinds: Object.fromEntries(['signature', 'type', 'reaction', 'glitch'].map(kind => [kind, allFusions.filter(r => r.kind === kind).length])),
  allFusions, availableMoves: availableMoves.filter(m => ctx.gS(m)).map(({id,key,name,type}) => ({id,key,name,type})),
  types, statuses: clean(ctx.Qg), sources,
  date: new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),
  rule: {requiredLevel: evaluate('fusionRequiredLevel'), ultimateRechargeSeconds: Number(source.match(/ultimateRechargeSeconds = (\d+)/)[1])},
};
// Guard against silent omissions if the source catalog changes.
assert.equal(new Set(allFusions.map(r => r.key)).size, allFusions.length);
assert.equal(new Set(allFusions.map(r => r.id)).size, allFusions.length);
assert.ok(allFusions.every(r => r.name && r.desc && Number.isFinite(r.cd)));
assert.ok(fireMoves.every(m => m.forms.length && Number.isFinite(m.cd)));
assert.equal([...fusionGroups.values()].reduce((n, pairs) => n + pairs.length, 0), fireMoves.length * (fireMoves.length - 1) / 2);
assert.ok(allFusions.find(r => r.key === 'fu-58').firePairs.some(p => fireById.get(p.a).key === 'fire-fang' || fireById.get(p.b).key === 'fire-fang'));
if (process.argv.includes('--inspect')) {
  console.log(JSON.stringify({forms, fireMoves, fusionGroups: [...fusionGroups].map(([key, pairs]) => [key, pairs.length]),
    fusionKinds: report.fusionKinds, allFusions: allFusions.map(({key,name,kind,moves,pair,cd,member}) => ({key,name,kind,moves,pair,cd,member}))}, null, 2));
} else {
  const destination = path.join(root, '资料', '炎系技能与融合图鉴.html');
  const payload = JSON.stringify(report).replaceAll('<', '\\u003c');
  const template = read('tools/skill-guide-template.html');
  assert.equal(template.split('/*__GUIDE_DATA__*/').length, 2);
  const html = template.replace('/*__GUIDE_DATA__*/', () => payload);
  fs.mkdirSync(path.dirname(destination), {recursive:true});
  fs.writeFileSync(destination, html);
  console.log(JSON.stringify({file: destination, bytes: Buffer.byteLength(html), fireMoves: fireMoves.length,
    fusionCount: allFusions.length, fireFusions: fusionGroups.size, firePairs: [...fusionGroups.values()].reduce((n,p) => n+p.length,0),
    availability: Object.fromEntries(['fire','wind','retained','blocked'].map(key=>[key,allFusions.filter(r=>r.reachable===key).length]))}));
}
