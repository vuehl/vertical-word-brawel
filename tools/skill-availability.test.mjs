import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSkillCatalog} from './skill-catalog.mjs';
import {restoreProgress} from '../source/src/coop-resume.js';

const {ctx, config, evaluate, between} = await loadSkillCatalog();
evaluate(between('function isNewAttackOffer(', 'function Gb('));
const removed = [10, 163, 225, 257, 337, 394, 424, 50024, 50079, 50093, 50105];
const windRemoved = [52, 53, 50080, 50099];
const catalog = species => {
  const fire = species < 7;
  const c = ctx.Vb(species, config.Bt.find(s => s.id === (fire ? 4 : 16)), [fire ? 'fire' : 'flying'], () => true);
  return [...c.kit, ...c.line, ...c.shared, ...(c.any ?? [])];
};

test('removed skills cannot resolve or enter either starter family through shared or learned moves', () => {
  for (const id of removed) assert.equal(ctx.O_(id), null, String(id));
  for (const species of [4, 5, 6, 16, 17, 18, 58, 59]) {
    assert.ok(catalog(species).every(m => !removed.includes(m.id)), String(species));
  }
  for (const species of [4, 5, 6]) {
    assert.deepEqual(catalog(species).map(m => m.id).sort((a,b) => a-b), [52, 53, 83, 126, 488, 517]);
    assert.equal(ctx.formMove(403, species), null);
  }
});

test('Air Slash is a level-one wind offer across both branches with its combat behavior and name intact', () => {
  for (const species of [16, 17, 18, 58, 59]) {
    const offers = catalog(species).filter(m => m.id === 403);
    assert.equal(offers.length, 1);
    assert.equal(offers[0].level, 1);
    const move = ctx.formMove(403, species);
    assert.equal(move.name, '空气斩');
    assert.equal(move.type, 'flying');
    assert.equal(move.arch, 'boomerang');
    assert.ok(Math.abs(move.cd - 1.547) < 1e-9);
    assert.equal(move.flinch, .3);
  }
});

test('Flame Stampede is a selectable ordinary fire skill, upgrades normally and stays out of wind saves', () => {
  ctx.m=[];ctx.F={shuffle:list=>list};
  for(const species of [4,5,6,16,17,18,58,59]){
    const fire=species<7,def=ctx.formMove(488,species);
    assert.equal(Boolean(def),fire);
    assert.equal(catalog(species).some(m=>m.id===488&&m.level===1),fire);
    if(!fire)continue;
    assert.equal(def.name,'烈焰狂奔');assert.equal(def.type,'fire');assert.equal(def.fusion,undefined);
    assert.equal(typeof def.castRecipe.cast,'function');assert.ok(def.dmg>0);
    const p={speciesId:species,types:['fire'],roster:config.Bt.find(s=>s.id===4),level:1,
      freeMoveSlot:()=>0,ownedMoveIds:()=>new Set(),moves:[],vitamins:new Map(),vitaminSlots:4};
    const run={player:p,director:{normalOpening:false},meta:{inLeague:()=>true},banished:new Set(catalog(species).filter(m=>m.id!==488).map(m=>'m'+m.id))};
    assert.ok(ctx.Ub(run,3).some(o=>o.id===488));
    Object.assign(p,{moveSlots:4,capOf:()=>8,moves:[{def,level:1}]});
    assert.ok(ctx.canUpgradeMove(p,0));p.speciesId=16;assert.ok(!ctx.canUpgradeMove(p,0));
  }
  assert.equal(ctx.fS('fu-58'),-1,'The old fusion remains retired');
  assert.ok(ctx.O_(488),'Species-independent catalog lookup still resolves');
  for(const species of [1,7,25,132])assert.equal(ctx.formMove(488,species),null,'Stampede is fire-family only');
});

test('wind excludes fire skills while the removed cross-element fusion stays unavailable', () => {
  for (const species of [16, 17, 18, 58, 59]) {
    assert.deepEqual(catalog(species).map(m => m.id).sort((a,b) => a-b), [16,17,33,97,98,239,297,332,403,542]);
    for (const id of windRemoved) assert.equal(ctx.formMove(id, species), null, `${species}:${id}`);
  }
  for (const species of [4, 5, 6]) {
    for (const id of [52,53,50080]) assert.ok(ctx.formMove(id, species), `${species}:${id} stays enabled`);
    assert.equal(ctx.formMove(50099, species),null);
  }
  assert.equal(ctx.fS('fu-t-fire'), 50080);
  assert.equal(ctx.fS('fu-r-wildfire'), -1);
});

test('wind rejects fire fusion offers and stale confirmation callbacks but keeps both wind results', () => {
  for (const species of [16, 17, 18, 58, 59]) {
    for (const ids of [[52,53], [52,403], [53,17], [126,517], [126,403]]) {
      const defs = ids.map(id => ctx.O_(id));
      const recipe = ctx._S(...defs);
      if (ids.every(id => [52,53,126,517].includes(id))) assert.ok(recipe, 'fire recipe stays available');
      else assert.equal(recipe,null,'removed reaction has no fallback');
      assert.equal(ctx._S(...defs, species), null);
      const run = {player:{speciesId:species,roster:null,moves:defs.map(def => ({def,level:4}))}};
      assert.equal(ctx.yS(run).length, 0);
      assert.equal(ctx.bS(run,{a:0,b:1,r:recipe}), null);
      assert.equal(run.player.moves.filter(Boolean).length, 2, 'rejected fusion preserves materials');
    }
    assert.equal(ctx._S(ctx.O_(17),ctx.O_(542),species).key, 'fu-16');
    assert.equal(ctx._S(ctx.O_(16),ctx.O_(403),species).key, 'fu-t-flying');
  }
  assert.equal(ctx._S(ctx.O_(52),ctx.O_(53),4).key, 'fu-t-fire');
});

test('only four stable fusion IDs resolve, and all removed save slots reject', () => {
  const expected = new Map([['fu-4',50001],['fu-16',50006],['fu-t-fire',50080],['fu-t-flying',50088]]);
  assert.equal(ctx.lS.length,4);
  for(const [key,id] of expected){assert.equal(ctx.fS(key),id);assert.equal(ctx.O_(id).key,key);}
  for(let id=50000;id<=50105;id++) if(![...expected.values()].includes(id)) {
    assert.equal(ctx.O_(id),null,String(id));
    for(const species of [4,5,6,16,17,18,58,59]) assert.equal(ctx.formMove(id,species),null);
  }
  assert.equal(ctx.formMove(488,4).castRecipe.key,undefined,'ordinary stampede no longer depends on a retired fusion key');
});

test('fire vortex drops the feeding jet and its line damage', () => {
  const cast=ctx.dS('fu-4').cast.toString();
  assert.ok(!/\.cone\(|feedKey|xx\(/.test(cast));
  assert.ok(cast.includes('fusionVortex') && cast.includes('fusionBurst'));
});

test('fusion menu skips unsupported pairs and still offers the surviving fire and wind recipes', () => {
  const recipe = (a, b) => ctx._S(ctx.O_(a), ctx.O_(b));
  assert.equal(recipe(52, 33), null, 'different unrelated types have no fallback fusion');
  assert.equal(recipe(33, 98), null, 'retired normal fusion stays unavailable');
  assert.equal(recipe(82, 200), null, 'retired dragon fusion stays unavailable');
  assert.equal(recipe(52, 52), null, 'a skill cannot be both ingredients');
  assert.equal(recipe(53, 83).key, 'fu-4');
  assert.equal(recipe(52, 126).key, 'fu-t-fire');
  assert.equal(recipe(52, 403), null);
  assert.equal(recipe(16, 403).key, 'fu-t-flying');
  const run = {player: {moves: [52, 33].map(id => ({def:ctx.O_(id), level:4})), roster:null}};
  assert.equal(ctx.yS(run).length, 0);
  run.player.moves = [53, 83].map(id => ({def:ctx.O_(id), level:4}));
  assert.equal(ctx.yS(run)[0].r.key, 'fu-4');
  assert.equal(ctx.yS(run)[0].ready, true);
});

test('level-up and reroll selection can offer Air Slash only to wind', () => {
  ctx.m = [];
  ctx.F = {shuffle: list => list};
  for (const species of [4, 5, 6, 16, 17, 18, 58, 59]) {
    const p = {speciesId:species, types:[species < 7 ? 'fire' : 'flying'],
      roster:config.Bt.find(s => s.id === (species < 7 ? 4 : 16)), level:1,
      freeMoveSlot:() => 0, ownedMoveIds:() => new Set(), moves:[], vitamins:new Map(), vitaminSlots:4};
    const run = {player:p, director:{normalOpening:false}, meta:{inLeague:() => true}, banished:new Set(catalog(species).filter(m => m.id !== 403).map(m => 'm'+m.id))};
    for (let reroll = 0; reroll < 3; reroll++) {
      const offers = ctx.Ub(run, 3);
      assert.equal(offers.some(o => o.id === 403), species >= 16, String(species));
      assert.ok(offers.every(o => !removed.includes(o.id)));
    }
  }
});

test('stale wind skills cannot be offered as upgrades, including already-fused fire moves', () => {
  for (const species of [16,17,18,58,59]) {
    const p = {speciesId:species,moveSlots:4,capOf:()=>8,moves:windRemoved.map(id=>({def:ctx.O_(id)??{id},level:1}))};
    for (let slot=0;slot<p.moves.length;slot++) assert.ok(!ctx.canUpgradeMove(p,slot));
    p.speciesId=4;
    for (let slot=0;slot<p.moves.length;slot++) assert.equal(Boolean(ctx.canUpgradeMove(p,slot)),windRemoved[slot]!==50099);
  }
});

test('old wind loadouts drop all four scoped removals and recover the opening skill', () => {
  for (const species of [16,17,18,58,59,4,5,6]) {
    const opening=species<7?52:98;
    const p={speciesId:species,hp:10,maxHp:10,moves:[{def:ctx.formMove(opening,species)},null,null,null],
      pos:{set(){}},recompute(){},xpFor:()=>30,
      addMove(id){const def=ctx.formMove(id,this.speciesId),slot=this.moves.findIndex(m=>!m);if(!def||slot<0)return false;this.moves[slot]={def};return true;}};
    const run={player:p,coop:{},camTarget:{copy(){}},director:{timeline:[]},planEvolution:()=>null};
    const saved={v:3,stage:1,run:{nextEvo:null},player:{speciesId:species,level:25,hp:10},pos:[0,0,0],moves:windRemoved.map(id=>({id,level:4}))};
    restoreProgress(run,saved,{stage:1,time:60,stageTime:60});
    assert.deepEqual(p.moves.filter(Boolean).map(m=>m.def.id),species<7?[52,53,50080]:[98]);
  }
});

test('old co-op loadouts discard retired skills, preserve wind Air Slash and keep a usable opening attack', () => {
  for (const species of [4, 6, 16, 18, 59]) {
    const opening = species < 7 ? 52 : 98;
    const p = {speciesId:species, hp:10, maxHp:10, moves:[{def:ctx.formMove(opening, species)}, null, null, null],
      pos:{set(){}}, recompute(){}, xpFor:() => 30,
      addMove(id) {
        const def=ctx.formMove(id, this.speciesId), slot=this.moves.findIndex(m => !m);
        if (!def || slot < 0) return false;
        this.moves[slot]={def}; return true;
      }};
    const run={player:p, coop:{}, camTarget:{copy(){}}, director:{timeline:[]}, planEvolution:() => null};
    const data={v:3,stage:1,run:{nextEvo:null},player:{speciesId:species,level:9,hp:10},pos:[0,0,0],
      moves:[{id:10},{id:50024},{id:403,level:5,damageDone:123},{id:50105}]};
    restoreProgress(run,data,{stage:1,time:60,stageTime:60});
    const kept=p.moves.filter(Boolean);
    assert.equal(kept.length,1);
    assert.equal(kept[0].def.id,species < 7 ? opening : 403);
    if (species >= 16) {
      assert.equal(p.moves[2].level,5);
      assert.equal(p.moves[2].damageDone,123);
    }
  }
});
