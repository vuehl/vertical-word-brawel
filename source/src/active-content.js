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
export const bossSummonSeconds = 3;
export const bossSummonUnlockSeconds = 5 * 60;
export const facilityNames = Object.freeze({
  chest: '扭蛋', freechest: '免费扭蛋', altar: '守护者祭坛', boss: '门？', portal: '传送门',
  magnet: '磁铁', berry: 'QQ糖', nest: '鹌鹑蛋', bill: '订书机',
});
export const isActiveFacility = kind => Object.hasOwn(facilityNames, kind);
// The art IDs describe the physical models. The spiral summons and the wooden door is the exit.
const doorArt = {boss: {model:'传送门', icon:'portal'}, portal: {model:'门？', icon:'boss'}};
export const facilityModelFile = kind => 'devices/' + (doorArt[kind]?.model ?? (kind === 'altar' ? '时尚小垃圾' : facilityNames[kind]));
export const facilityIconFile = kind => 'ui/devices/' + (doorArt[kind]?.icon ?? kind) + '.png';
