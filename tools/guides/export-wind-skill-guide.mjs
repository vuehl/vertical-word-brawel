import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {loadSkillCatalog} from './skill-catalog.mjs';
import {formCopy, specialNames} from '../../source/src/data/form-copy.js';
import {starterEvolutionLevels, starterUltimate, windRoutes} from '../../source/src/data/starter-characters.js';
import {heroActionCatalog} from '../../source/src/actors/hero-action-catalog.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const clean = value => JSON.parse(JSON.stringify(value));
const {ctx, data, moves, config, source, evaluate, between} = await loadSkillCatalog();
const windIds = [16, 17, 18, 58, 59];
const rosterFor = id => config.Bt.find(s => s.id === (id < 7 ? 4 : 16));
const forms = windIds.map(id => {
  const level = id === 16 ? 1 : starterEvolutionLevels[[18, 59].includes(id) ? 1 : 0];
  const catalog = ctx.Vb(id, rosterFor(id), ['flying'], () => true);
  const offers = [...catalog.kit, ...catalog.line, ...catalog.shared.filter(m => m.open)];
  return {id, word: formCopy[id].word, level, route: id === 16 ? 'base' : id < 19 ? 'attack' : 'speed',
    offers: clean(offers), moveCount: new Set(offers.map(m => m.id)).size};
});
const skillIds = [...new Set(forms.flatMap(f => f.offers.map(m => m.id)))];
const windMoves = skillIds.map(id => {
  const def = clean(ctx.O_(id));
  const eligible = forms.filter(f => f.offers.some(m => m.id === id));
  return {...def, names: Object.fromEntries(eligible.map(f => [f.id, ctx.formMove(id, f.id).name])),
    forms: eligible.map(f => {
      const offer = f.offers.find(m => m.id === id);
      return {id: f.id, level: offer.level, earliest: Math.max(f.level, offer.level)};
    }), label: ctx.g_[def.arch].label, upgradeStats: clean(ctx.g_[def.arch].stats),
    material: ctx.gS(def)};
});

// Read the exact source ultimate metadata, then apply the same per-form overrides as the game.
const baseUltimate = evaluate('({' + between('    16: {\n      names: [c(`Remolino`)', '    19: {') + '})[16]');
for (const form of forms) {
  const def = starterUltimate(form.id, {16: baseUltimate}, () => {});
  form.ultimate = {name: def.names[0], desc: def.descs[0], duration: def.dur[0], type: def.type, cls: def.cls};
  const file = path.join(root, `resources/public/assets/glyphs/hero-actions/${form.id}.png`);
  const {width, height} = await sharp(file).metadata();
  const {columns, rows} = heroActionCatalog[form.id];
  const picture = await sharp(file).extract({left: 0, top: 0, width: width / columns, height: height / rows}).png().toBuffer();
  form.portrait = 'data:image/png;base64,' + picture.toString('base64');
}

const allFusions = clean(ctx.lS).map(r => ({...r, id: ctx.fS(r.key)}));
const active = moves.map(m => ctx.O_(m.id)).filter(Boolean);
const materialMoves = active.filter(m => ctx.gS(m));
const activeByKey = new Map(active.map(m => [m.key, m]));
const pairsByRecipe = new Map();
let checkedWindPairs = 0;
const materials = windMoves.filter(m => m.material);
for (let a = 0; a < materials.length; a++) for (let b = a + 1; b < materials.length; b++) {
  checkedWindPairs++;
  const left = materials[a], right = materials[b];
  const recipe = ctx._S(left, right);
  if (!recipe) continue;
  const possible = forms.filter(f => left.forms.some(m => m.id === f.id) && right.forms.some(m => m.id === f.id) && ctx._S(left, right, f.id)?.key === recipe.key);
  if (!possible.length) continue;
  if (!pairsByRecipe.has(recipe.key)) pairsByRecipe.set(recipe.key, []);
  pairsByRecipe.get(recipe.key).push({a: left.id, b: right.id, forms: possible.map(f => f.id)});
}
const firePairs = new Map();
for (const id of [4, 5, 6]) {
  const cat = ctx.Vb(id, rosterFor(id), ['fire'], () => true);
  const eligible = [...cat.kit, ...cat.line, ...cat.shared.filter(m => m.open)].map(m => ctx.O_(m.id)).filter(m => ctx.gS(m));
  for (let a = 0; a < eligible.length; a++) for (let b = a + 1; b < eligible.length; b++) {
    const r = ctx._S(eligible[a], eligible[b], id);
    if (!r) continue;
    if (!firePairs.has(r.key)) firePairs.set(r.key, new Map());
    const pair = [eligible[a].id, eligible[b].id].sort((a,b) => a-b);
    const byPair = firePairs.get(r.key), key = pair.join(':');
    if (!byPair.has(key)) byPair.set(key, {a: pair[0], b: pair[1], forms: []});
    byPair.get(key).forms.push(id);
  }
}
const originals = new Map([...specialNames.fusion].map(([a,b]) => [b,a]));
for (const recipe of allFusions) {
  recipe.originalName = originals.get(recipe.name) ?? recipe.name;
  recipe.windPairs = pairsByRecipe.get(recipe.key) ?? [];
  recipe.firePairs = [...(firePairs.get(recipe.key)?.values() ?? [])];
  recipe.wind = recipe.windPairs.length > 0;
  recipe.fire = recipe.firePairs.length > 0;
  recipe.formIds = [...new Set(recipe.windPairs.flatMap(p => p.forms))];
  recipe.materials = [...new Set((recipe.ingredientPairs ?? []).flat())].map(key => {
    const raw = data.movesByKey.get(key), def = activeByKey.get(key);
    return {key, id: raw?.id, name: ctx.formMove(raw?.id, recipe.member)?.name ?? raw?.name ?? key, type: raw?.type,
      valid: !!def && ctx.gS(def), reason: !def ? '当前未启用' : !ctx.gS(def) ? '天气或增益技能不能作材料' : ''};
  });
  recipe.availability = recipe.wind || recipe.fire ? 'playable' : recipe.materials.some(m => !m.valid) ? 'blocked' : 'retained';
  recipe.desc = recipe.desc.replaceAll('Máquina de Bill', '订书机').replaceAll('比尔的机器', '订书机');
}

// The offline calculator uses this compact pure resolver; verify it against the game's matcher.
const resolver = `function resolveRecipe(recipes,a,b){
  if(!a||!b||a.id===b.id)return null;
  const signature=recipes.find(r=>r.ingredientPairs?.some(pair=>pair.includes(a.key)&&pair.includes(b.key)));
  if(signature)return signature;
  const reaction=recipes.find(r=>r.kind==='reaction'&&((r.pair[0].includes(a.type)&&r.pair[1].includes(b.type))||(r.pair[0].includes(b.type)&&r.pair[1].includes(a.type))));
  return reaction||(a.type===b.type?recipes.find(r=>r.kind==='type'&&r.type===a.type):null)||null;
}`;
const resolveRecipe = new Function('return ' + resolver)();
let verifiedMaterialPairs = 0;
for (let a = 0; a < materialMoves.length; a++) for (let b = a; b < materialMoves.length; b++) {
  const left = materialMoves[a], right = materialMoves[b];
  assert.equal(resolveRecipe(allFusions, left, right)?.key, ctx._S(left, right)?.key, `${left.key} + ${right.key}`);
  verifiedMaterialPairs++;
}
const sources = [
  ['source/src/game.js', '技能生成、升级候选、伤害参数、被动、大招和融合匹配'],
  ['source/src/data/starter-characters.js', '两条进阶路线、单关与多关进阶等级、各形态大招与移速转伤害'],
  ['source/src/data/skill-availability.js', '当前技能与融合的启用、移除规则'],
  ['source/src/data/form-copy.js', '各形态技能显示名与融合名称'],
  ['source/src/data/config.js', '风系固定技能组和当前出战角色名单'],
  ['resources/public/data/learnsets.json', '经运行代码过滤的进化链学习表'],
  ['resources/public/data/moves.json', '普通技能原名、编号和底层属性'],
  ['resources/public/text/ui.json', '游戏中文文案'],
  ['source/src/effects/wind-move-art.js', '电光一闪、龙卷风的风系表现'],
  ['source/src/effects/wind-replacements.js', '起风与羽毛舞的特效'],
].map(([file,note]) => ({file,note,sha256:crypto.createHash('sha256').update(read(file)).digest('hex').slice(0,12)}));
const types = JSON.parse(read('resources/public/data/types.json')).names;
types.flying = '风';
const report = {forms, windMoves, allFusions, types, sources, statuses:clean(ctx.Qg),
  routes:windRoutes.map(r => ({...r, levels:starterEvolutionLevels})),
  availableMoves:materialMoves.map(({id,key,name,type}) => ({id,key,name,type})),
  fireForms:[4,5,6].map(id => ({id,word:formCopy[id].word})),
  checkedWindPairs, verifiedMaterialPairs,
  fusionKinds:Object.fromEntries(['signature','reaction','type'].map(kind => [kind,allFusions.filter(r=>r.kind===kind).length])),
  date:new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),
  rule:{requiredLevel:evaluate('fusionRequiredLevel'),ultimateRechargeSeconds:Number(source.match(/ultimateRechargeSeconds = (\d+)/)[1])},
};
assert.equal(new Set(allFusions.map(r=>r.key)).size,allFusions.length);
assert.equal(new Set(allFusions.map(r=>r.id)).size,allFusions.length);
assert.ok(allFusions.every(r=>r.name&&r.desc&&Number.isFinite(r.cd)));
assert.ok(windMoves.every(m=>m.forms.length&&Number.isFinite(m.cd)));
assert.equal(checkedWindPairs,materials.length*(materials.length-1)/2);
const destination = path.join(root,'资料','风系技能与全融合图鉴.html');
const template = read('tools/guides/wind-skill-guide-template.html');
assert.equal(template.split('/*__GUIDE_DATA__*/').length,2);
assert.equal(template.split('/*__GUIDE_RESOLVER__*/').length,2);
const html = template.replace('/*__GUIDE_DATA__*/',()=>JSON.stringify(report).replaceAll('<','\\u003c'))
  .replace('/*__GUIDE_RESOLVER__*/',()=>resolver);
fs.mkdirSync(path.dirname(destination),{recursive:true});
fs.writeFileSync(destination,html);
console.log(JSON.stringify({file:destination,bytes:Buffer.byteLength(html),forms:forms.map(f=>({word:f.word,skills:f.moveCount,ultimate:f.ultimate.name})),
  windMoves:windMoves.length,windFusions:[...pairsByRecipe].map(([key,p])=>({key,pairs:p.length})),
  checkedWindPairs,verifiedMaterialPairs,fusions:allFusions.length,kinds:report.fusionKinds,
  availability:Object.fromEntries(['playable','retained','blocked'].map(s=>[s,allFusions.filter(r=>r.availability===s).length]))},null,2));
