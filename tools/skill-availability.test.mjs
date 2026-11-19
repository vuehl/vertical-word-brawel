import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSkillCatalog} from './skill-catalog.mjs';
import {restoreProgress} from '../source/src/coop-resume.js';

const {ctx, config, evaluate, between} = await loadSkillCatalog();
const removed = [10, 163, 225, 257, 337, 394, 424, 50024, 50079, 50093, 50105];
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
    assert.deepEqual(catalog(species).map(m => m.id).sort((a,b) => a-b), [52, 53, 83, 126, 517]);
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

test('active fusion IDs remain stable and retired slots are never reassigned', () => {
  const original = evaluate('[...jx, ...Nx, ...Ix, ...Wx, ...Xx, ...aS]');
  for (const [index, recipe] of original.entries()) {
    const id = 50000 + index + (index >= 104 ? 1 : 0);
    if (removed.includes(id)) {
      assert.equal(ctx.fS(recipe.key), -1);
      assert.equal(ctx.O_(id), null);
      assert.ok(!ctx.lS.some(r => r.key === recipe.key));
    } else {
      assert.equal(ctx.fS(recipe.key), id, recipe.key);
      assert.equal(ctx.O_(id).key, recipe.key);
    }
  }
  assert.equal(ctx.lS.length, 101);
});

test('fusion menu skips unsupported pairs and still offers the surviving fire and wind recipes', () => {
  const recipe = (a, b) => ctx._S(ctx.O_(a), ctx.O_(b));
  assert.equal(recipe(52, 33), null, 'different unrelated types have no fallback fusion');
  assert.equal(recipe(33, 98), null, 'retired normal fusion stays unavailable');
  assert.equal(recipe(82, 200), null, 'retired dragon fusion stays unavailable');
  assert.equal(recipe(52, 52), null, 'a skill cannot be both ingredients');
  assert.equal(recipe(53, 83).key, 'fu-4');
  assert.equal(recipe(52, 126).key, 'fu-t-fire');
  assert.equal(recipe(52, 403).key, 'fu-r-wildfire');
  assert.equal(recipe(16, 403).key, 'fu-t-flying');
  const run = {player: {moves: [52, 33].map(id => ({def:ctx.O_(id), level:4})), roster:null}};
  assert.equal(ctx.yS(run).length, 0);
  run.player.moves = [53, 83].map(id => ({def:ctx.O_(id), level:4}));
  assert.equal(ctx.yS(run)[0].r.key, 'fu-4');
  assert.equal(ctx.yS(run)[0].ready, true);
});

test('level-up and reroll selection can offer Air Slash only to wind', () => {
  evaluate(between('function isNewAttackOffer(', 'function Gb('));
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
