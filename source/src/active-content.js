// IDs keep items with identical display names distinct. Water Stone has a
// catalog entry but no held-item combat definition.
export const springShoesKey = 'air-balloon';
const itemIds = new Set([
  'max-revive', 'rare-candy', 'master-ball', 'dawn-stone', 'tm-case', 'poke-flute',
  'shiny-stone', 'dusk-stone', 'comet-shard', 'thunder-stone', 'fire-stone',
  'ice-stone', 'leaf-stone', 'revive', 'water-stone', 'expert-belt', 'assault-vest',
  'star-piece', 'stick', 'bicycle', 'full-heal', 'razor-claw', 'rocky-helmet',
  springShoesKey, 'big-root', 'smoke-ball', 'repel', 'old-rod', 'honey', 'lucky-punch',
]);
export const isActiveItem = id => itemIds.has(id);

export const facilityDwellSeconds = 0;
export const altarChargeSeconds = 3;
export const bossSummonSeconds = 0;
export const bossSummonUnlockSeconds = run =>
  run?.biome?.id === 'forest' && run.stage === 2 ? 3 * 60 : 5 * 60;
export const facilityNames = Object.freeze({
  chest: '扭蛋', freechest: '免费扭蛋', altar: '时尚小垃圾', portal: '门？', boss: '传送门',
  magnet: '磁铁', berry: 'QQ糖', ditto: '拍立得', nest: '鹌鹑蛋', bill: '订书机',
});
export const isActiveFacility = kind => Object.hasOwn(facilityNames, kind);
// The art IDs describe the physical models. The countdown dock summons and the wooden door is the exit.
const doorIcons = {boss: 'portal', portal: 'boss'};
export const summonDockModel = 'devices/' + facilityNames.boss;
export const facilityIconFile = kind => 'ui/devices/' + (doorIcons[kind] ?? kind) + '.png';
