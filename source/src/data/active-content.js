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

export const isContactFacility=kind=>['chest','freechest','magnet','ditto'].includes(kind);
export const facilityDwellSeconds = 0;
export const staplerDwellSeconds = 1;
export const staplerInteractionRadius = 2.6;
export const altarChargeSeconds = 3;
export const weatherDurationSeconds = 15;
export const bossSummonSeconds = 0;
export const bossSummonUnlockSeconds = run =>
  run?.terrain?.bossSite ? 0 : run?.biome?.id === 'forest' && run.stage === 2 ? 3 * 60 : 5 * 60;
export const facilityNames = Object.freeze({
  chest: '红骰子', freechest: '免费蓝骰子', altar: '时尚小垃圾', portal: '门', boss: '传送门',
  magnet: '磁铁', berry: 'QQ糖', ditto: '键帽挂件', nest: '弹珠', bill: '订书机',
});
export const isActiveFacility = kind => Object.hasOwn(facilityNames, kind);
// Stable facility IDs are also used by saves and co-op events.
export const illustratedFacilityFiles = Object.freeze({
  chest:'chest', freechest:'freechest', boss:'boss', portal:'portal',
  magnet:'magnet', nest:'marble', ditto:'keycap',
});
export const facilityIconFile = kind => 'ui/devices/' + (illustratedFacilityFiles[kind] ?? kind) + '.png';
