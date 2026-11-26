import assert from 'node:assert/strict';
import test from 'node:test';
import {drawItemKeys, Ub} from '../../source/src/combat/upgrade-offers.js';
import {heldItems, vitamins} from '../../source/src/data/catalogs.js';
import {random} from '../../source/src/effects/battle-particles.js';

const categories = ['offense', 'mobility', 'survival', 'moves', 'utility'];
const items = new Map(heldItems.map(item => [item.key, item]));
const runFixture = () => ({
  stage: 1, springShoesState: 'available', banished: new Set(),
  meta: {itemInPool: () => true},
  player: {level: 1, stats: {luck: 0}, moves: [], vitamins: new Map(),
    freeMoveSlot: () => -1, canTakeVitamin: () => true, canHold: () => true},
});

test('each reward slot draws the five categories equally despite different pool sizes', t => {
  for (const catalog of [heldItems, vitamins]) {
    assert.deepEqual(new Set(catalog.map(offer => offer.category)), new Set(categories));
  }
  const seed = random.s;
  t.after(() => {random.s = seed;});
  random.s = 20261126;
  const run = runFixture();
  for (const [source, size, draw] of [
    ['BUFF', 3, () => Ub(run, 3).map(offer => offer.category)],
    ['red die', 3, () => drawItemKeys(run, 3).map(key => items.get(key).category)],
    ['blue die', 1, () => drawItemKeys(run, 1, 1).map(key => items.get(key).category)],
    ['shop', 4, () => drawItemKeys(run, 4).map(key => items.get(key).category)],
  ]) {
    const counts = Array.from({length: size}, () => Object.fromEntries(categories.map(key => [key, 0])));
    const pages = 10000;
    for (let page = 0; page < pages; page++) {
      const offers = draw();
      assert.equal(offers.length, size);
      assert.equal(new Set(offers).size, size);
      offers.forEach((category, slot) => counts[slot][category]++);
    }
    for (const slot of counts) for (const [category, hits] of Object.entries(slot)) {
      assert.ok(Math.abs(hits / pages - 0.2) < 0.025, source + ' ' + category + ' ' + hits);
    }
  }
});

test('filtered pools fill the page once per key and keep rarity priority', () => {
  const run = runFixture();
  run.meta.itemInPool = key => ['tm-case', 'shiny-stone', 'honey', 'air-balloon'].includes(key);
  run.banished.add('iair-balloon');
  assert.deepEqual(new Set(drawItemKeys(run, 2, 4)), new Set(['tm-case', 'honey']));
  assert.deepEqual(new Set(drawItemKeys(run, 4)), new Set(['tm-case', 'shiny-stone', 'honey']));
  run.meta.itemInPool = () => false;
  assert.deepEqual(drawItemKeys(run, 3), []);

  run.player.canTakeVitamin = key => ['protein', 'calcium', 'dire-hit', 'iron'].includes(key);
  run.banished.add('vdire-hit');
  const buffs = Ub(run, 4);
  assert.deepEqual(new Set(buffs.map(offer => offer.vit)), new Set(['protein', 'calcium', 'iron']));
  assert.equal(buffs.length, 3);
});
