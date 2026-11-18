// IDs keep items with identical display names distinct. Water Stone has a
// catalog entry but no held-item combat definition.
const itemIds = new Set([
  'max-revive', 'rare-candy', 'master-ball', 'dawn-stone', 'tm-case', 'poke-flute',
  'shiny-stone', 'dusk-stone', 'comet-shard', 'thunder-stone', 'fire-stone',
  'ice-stone', 'leaf-stone', 'revive', 'water-stone', 'expert-belt', 'assault-vest',
  'star-piece', 'stick', 'bicycle', 'full-heal', 'razor-claw', 'rocky-helmet',
  'air-balloon', 'big-root', 'smoke-ball', 'repel', 'old-rod', 'honey', 'lucky-punch',
]);
export const isActiveItem = id => itemIds.has(id);

export const facilityDwellSeconds = 1.5;
export const facilityNames = Object.freeze({
  chest: '扭蛋', freechest: '免费扭蛋', altar: '时尚小垃圾', boss: '门？', portal: '传送门',
  magnet: '磁铁', berry: 'QQ糖', ditto: '拍立得', nest: '鹌鹑蛋', bill: '订书机',
});
export const isActiveFacility = kind => Object.hasOwn(facilityNames, kind);
// The delivered GLBs use these exact display names, including the full-width question mark.
export const facilityModelFile = kind => 'devices/' + facilityNames[kind];
