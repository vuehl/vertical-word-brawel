import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {transform} from 'esbuild';
import {loadSkillCatalog} from './skill-catalog.mjs';
import {formCopy} from '../source/src/form-copy.js';

// A read-only catalog audit. No renderer, combat, saves or game build is started.
// Use --expose-gc to include an isolated V8 object-allocation estimate.
const root = path.resolve(import.meta.dirname, '..');
const {ctx, config, moves, source, evaluate} = await loadSkillCatalog();
const clean = value => JSON.parse(JSON.stringify(value));
const date = new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Shanghai', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
const families = [];
for (const [name, ids, type] of [['炎', [4,5,6], 'fire'], ['风', [16,17,18,58,59], 'flying']]) {
  const skills = new Map(), pairs = new Map(), rejected = new Map();
  for (const species of ids) {
    const catalog = ctx.Vb(species, config.Bt.find(row => row.id === ids[0]), [type], () => true);
    const offers = [...catalog.kit, ...catalog.line, ...catalog.shared.filter(m => m.open), ...(catalog.any ?? [])];
    const defs = [...new Set(offers.map(m => m.id))].map(id => ctx.formMove(id, species)).filter(Boolean);
    for (const def of defs) {
      if (!skills.has(def.id)) skills.set(def.id, {id:def.id, key:def.key, originalName:ctx.O_(def.id).name,
        name:def.name, type:def.type, material:ctx.gS(def), forms:[]});
      skills.get(def.id).forms.push({id:species, word:formCopy[species].word, name:def.name});
    }
    for (let a = 0; a < defs.length; a++) for (let b = a + 1; b < defs.length; b++) {
      const left = defs[a], right = defs[b];
      const pairKey = [left.id, right.id].sort((a,b) => a-b).join(':');
      const recipe = ctx.gS(left) && ctx.gS(right) ? ctx._S(left, right, species) : null;
      if (!recipe) {rejected.set(pairKey, {a:left.id, b:right.id}); continue;}
      if (!pairs.has(pairKey)) pairs.set(pairKey, {a:left.id, b:right.id, key:recipe.key, result:recipe.name, forms:[]});
      assert.equal(pairs.get(pairKey).key, recipe.key, 'A shared pair must agree across forms');
      pairs.get(pairKey).forms.push(species);
    }
  }
  const recipes = [...new Set([...pairs.values()].map(p => p.key))].map(key => {
    const recipe = ctx.dS(key);
    return {key, id:ctx.fS(key), name:recipe.name, kind:recipe.kind, desc:recipe.desc, cd:recipe.cd,
      pairs:[...pairs.values()].filter(p => p.key === key)};
  });
  families.push({name, forms:ids.map(id => ({id, word:formCopy[id].word})), skills:[...skills.values()], recipes,
    pairCount:pairs.size, unavailablePairs:[...rejected.values()]});
}
const keepKeys = new Set(families.flatMap(f => f.recipes.map(r => r.key)));
const unused = ctx.lS.filter(r => !keepKeys.has(r.key));
const dormant = unused.map(r => ({key:r.key, id:ctx.fS(r.key), name:r.name, kind:r.kind}));
assert.equal(new Set(ctx.lS.map(r => ctx.fS(r.key))).size, ctx.lS.length);

// Recreate the actual active recipe fields and functions, then register them
// with the game's Ax function. Cast/update functions are never called here.
// Strings and compiled function code are shared between copies: this measures
// object/table overhead only, not a phone process or the complete game heap.
function literal(value) {
  if (typeof value === 'function') {
    const code = value.toString();
    return /^\w+\s*\(/.test(code) && !code.startsWith('function') ? 'function ' + code : code;
  }
  if (Array.isArray(value)) return '[' + value.map(literal).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).map(([key,v]) => JSON.stringify(key) + ':' + literal(v)).join(',') + '}';
  return value === undefined ? 'undefined' : JSON.stringify(value);
}
const recipeCode = recipes => literal(recipes);
const allRecipes = [...ctx.lS], keptRecipes = allRecipes.filter(r => keepKeys.has(r.key));
const allCode = recipeCode(allRecipes), keptCode = recipeCode(keptRecipes);
const compact = async code => Buffer.byteLength((await transform('globalThis.recipes=' + code, {minify:true, target:'es2017'})).code);
const codeSizes = {allRecipeLiteralBytes:await compact(allCode), keptRecipeLiteralBytes:await compact(keptCode)};
codeSizes.differenceBytes = codeSizes.allRecipeLiteralBytes - codeSizes.keptRecipeLiteralBytes;
let heap = null;
if (global.gc && unused.length) {
  const factory = (recipes, code) => new Function('g_', 'ids', `return function(){
    ${ctx.Ax.toString()}
    const lS=${code},uS=new Map(),w_=new Map();
    for(let i=0;i<lS.length;i++){const r=lS[i],id=ids[i];uS.set(r.key,{r,id});w_.set(id,Ax(r,id));}
    return {lS,uS,w_};
  }`)(ctx.g_, recipes.map(r => ctx.fS(r.key)));
  const fullFactory = factory(allRecipes, allCode), smallFactory = factory(keptRecipes, keptCode);
  const sample = make => {
    for (let i=0;i<30;i++) make();
    global.gc(); global.gc();
    const copies = new Array(300), before = process.memoryUsage().heapUsed;
    for (let i=0;i<copies.length;i++) copies[i] = make();
    global.gc(); global.gc();
    const delta = (process.memoryUsage().heapUsed-before)/copies.length;
    assert.equal(copies[0].uS.size, copies[0].lS.length);
    return delta;
  };
  const samples = Array.from({length:5}, () => ({allBytes:sample(fullFactory), keptBytes:sample(smallFactory)}));
  const differences = samples.map(s => s.allBytes-s.keptBytes).sort((a,b) => a-b);
  heap = {engine:process.version, copiesPerSample:300, samples, medianSavedBytes:differences[2],
    minSavedBytes:differences[0], maxSavedBytes:differences[4],
    scope:'孤立 V8 中配方、函数对象、融合技能对象与索引表；不含共享字符串、编译代码、普通技能、GPU、图片、微信环境。不是游戏实测。'};
}
const textures = [];
for (const name of ['fire-breath','fire-spin','fireball','fire-family','fire-mushroom','heat-wave','wind-skills','wind-moves','wind-vortex']) {
  const file = path.join(root, 'source/public/assets/vfx', name+'.png');
  const {width,height} = await sharp(file).metadata();
  textures.push({name, width, height, fileBytes:fs.statSync(file).size, rgbaBytes:width*height*4});
}
const report = {date, families, requiredLevel:evaluate('fusionRequiredLevel'), activeFusionCount:ctx.lS.length,
  reachableFusionCount:keepKeys.size, dormant, rawMoveRecords:moves.length, codeSizes, heap, textures,
  ordinaryImplementation:{id:488, name:'烈焰狂奔', evidence:'independent fireStampedeRecipe'},
  sourceSHA256:(await import('node:crypto')).createHash('sha256').update(source).digest('hex')};
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const out = path.join(root, '资料');
fs.mkdirSync(out, {recursive:true});
const files = [];
for (const family of families) {
  const byId = new Map(family.skills.map(s => [s.id,s]));
  const cards = family.recipes.map(recipe => `<section><div class="eyebrow">${recipe.kind==='signature'?'指定配方':'同属性融合'} · ${recipe.pairs.length} 组材料</div><h2>${escape(recipe.name)}</h2><p>${escape(recipe.desc)}</p><p class="muted">基础冷却 ${recipe.cd.toFixed(3).replace(/0+$/,'').replace(/\.$/,'')} 秒；实际冷却受强化与攻速影响。</p><table><thead><tr><th>材料 A</th><th>材料 B</th><th>融合结果</th></tr></thead><tbody>${recipe.pairs.map(p => `<tr><td>${escape(byId.get(p.a).name)}</td><td>${escape(byId.get(p.b).name)}</td><td>${escape(recipe.name)}</td></tr>`).join('')}</tbody></table></section>`).join('');
  const aliases = family.skills.filter(s => new Set(s.forms.map(f => f.name)).size > 1 || s.name !== s.originalName);
  const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${family.name}系当前融合技能</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f1e9;color:#252b30;font:16px/1.75 "Microsoft YaHei",sans-serif}main{max-width:960px;margin:auto;padding:44px 24px}header{border-bottom:4px solid var(--accent);padding-bottom:28px}h1{font-size:38px;margin:8px 0}h2{font-size:27px;margin:4px 0}p{margin:10px 0}.eyebrow{color:var(--accent);font-weight:bold;letter-spacing:1px}.muted,footer{color:#666;font-size:14px}section{background:#fffdf7;padding:26px;margin:24px 0;border:1px solid #ddd7c8;border-radius:12px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:11px 12px;border-bottom:1px solid #e7e1d6;text-align:left}th{background:#f2eee5}aside{padding:18px 22px;background:#eae6db;border-radius:10px}button{background:var(--accent);color:white;border:0;padding:10px 18px;border-radius:6px;cursor:pointer;font:inherit}@media(max-width:600px){main{padding:24px 14px}h1{font-size:30px}section{padding:16px}th,td{padding:9px 5px;font-size:14px}}@media print{body{background:white}button{display:none}main{padding:0}section{break-inside:avoid}h1{font-size:28px}}</style><body style="--accent:${family.name==='炎'?'#ae3e2d':'#25756d'}"><main><header><div class="eyebrow">字行 · 当前可获得配方</div><h1>${family.name}系融合技能</h1><p>${family.forms.map(f => f.word).join(' / ')} 共用 · <strong>${family.recipes.length} 种融合结果 / ${family.pairCount} 组有效材料</strong></p><p class="muted">生成日期 ${date}（北京时间）。逐形态执行游戏实际匹配函数，不收录未开放的旧配方。</p><button onclick="window.print()">打印 / 保存为 PDF</button></header><section><h2>融合条件</h2><p>两项不同的普通技能分别达到 ${report.requiredLevel} 级，在地图的「订书机」融合。消耗两项材料，生成一项融合技能。天气、增益和融合技能不能再次作材料；专属配方优先于同属性配方。</p><p>${family.name==='炎'?'当前普通技能为 6 项，包含新接入的「烈焰狂奔」。':'当前普通技能为 10 项；其中只有下列 6 项风属性技能可凑出有效配方。电光一闪（起手招随形态改名）、撞击、龙卷风没有有效搭配，高速移动是增益技，不能作材料。'}</p></section>${cards}<aside><strong>材料名称对照</strong><p>配方表按初始形态显示名称。进阶形态名称变化不影响技能编号与配方。</p>${aliases.map(s => `<p>${escape(s.originalName)}（${s.id}）：${s.forms.map(f => escape(f.word+'：'+f.name)).join('；')}</p>`).join('')}${family.name==='风'?'<p>注意：「起风」与起手显示名「连扇」不是同一技能；连扇对应电光一闪。配方中的起风是独立的风属性技能。</p>':''}</aside><footer><p>来源：source/src/game.js、skill-availability.js、form-copy.js，以及当前角色学习表。重新生成：node --expose-gc tools/export-current-fusions.mjs。</p></footer></main></body></html>`;
  const file = path.join(out, family.name+'系当前融合技能.html');
  fs.writeFileSync(file, html); files.push(file);
}
fs.writeFileSync(path.join(out,'当前融合技能与资源核算.json'), JSON.stringify(report,null,2)+'\n');
const mib = n => (n/1048576).toFixed(3);
const eagerBytes = textures.filter(t => ['fire-breath','fire-spin','fireball'].includes(t.name)).reduce((sum,t) => sum+t.rgbaBytes,0);
const notes = [
  '当前技能池状态 — '+date,
  '',
  '当前注册融合 '+report.activeFusionCount+' 种；炎、风可合成 '+keepKeys.size+' 种；无法合成的保留定义 '+dormant.length+' 种。',
  '炎系：转着烧遍、灼热之阳；风系：残气乱刮、台风。两系各 15 组有效配方。',
  '转着烧遍已去除由角色喷向旋涡的火柱及其线段伤害；保留旋涡吸附、旋转火焰、爆炸和地面燃烧。融合材料仍为火焰旋涡＋喷射火焰。',
  '旧 97 条不可合成融合的定义和施法代码已删除。旧 ID 范围保持保留，不会被新技能占用，旧配装中的已移除 ID 会被过滤。',
  '烈焰狂奔（488）拥有独立施法实现，不再从停用融合中查找。',
  '已删除 fire-completion 图集、描述文件、专用特效类、渲染批次与预热引用；大字爆炎共用爆炸已移入保留的火系效果类。',
  '喷射火焰、火球、火旋涡、角色大招、空气斩及敌人共用资源继续保留；不能按旧配方数量的比例推算总内存降幅。',
  '实际构建包与验证结果见 验收/融合技能清理；图集删除主要节省包体，未加载的图集原先也不占完整像素内存。',
  '运行内存节省量未作手机真机 A/B 测量。',
  '',
  ...dormant.map(r => r.id+'\t'+r.key+'\t'+r.name),
];
fs.writeFileSync(path.join(out,'技能池清理评估.txt'), '\uFEFF'+notes.join('\r\n')+'\r\n');
console.log(JSON.stringify({files, families:families.map(f => ({name:f.name,skills:f.skills.length,recipes:f.recipes.map(r => ({name:r.name,pairs:r.pairs.length})),pairs:f.pairCount})), dormant:dormant.length, codeSizes, heap},null,2));
