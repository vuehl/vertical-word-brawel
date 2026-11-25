// Desk coordinates are pixels in desk_map2.png from its top-left corner.
// Workshop and arena coordinates are world X/Z.
const maps = {
  'forest:1': {
    spawn: {x:1820, z:1320},
    facilitySites: [
      {surface:'notebook', x:856, z:1684},
      {surface:'wacom', x:2292, z:1736},
    ],
  },
  'forest:2': {spawn:{x:0, z:0}},
  'forest:3': {spawn:{x:0, z:0}},
  'workshop-preview': {spawn:{x:0, z:0}},
  'workshop-migration': {spawn:{x:0, z:0}},
};

export class MapSpawnError extends Error {
  constructor(key) {
    super('地图「' + key + '」缺少有效的角色出生点。请开发者明确指定 x、z 坐标后重新编译。');
    this.name = 'MapSpawnError';
  }
}

export function mapRulesFor(biome, arena) {
  const key = biome.mapKey ?? (biome.id + ':' + biome.zxStage);
  const rules = arena ? {spawn:arena.entry, facilitySites:arena.facilitySites} : maps[key];
  if (!Number.isFinite(rules?.spawn?.x) || !Number.isFinite(rules.spawn.z)) {
    throw new MapSpawnError(key + (arena ? ' / 竞技场' : ''));
  }
  return rules;
}
