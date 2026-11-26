import {paperPropNames} from '../../source/src/world/paper-prop-names.js';
import {isActiveItem} from '../../source/src/data/active-content.js';
import {heldItems, shop, vitamins} from '../../source/src/data/catalogs.js';
import {battleParticleImages, resolveItemIcon} from '../../source/src/data/item-icons.js';
import itemCatalog from '../../resources/public/data/items.json' with {type:'json'};
import {isPlayableHeroForm} from '../../source/src/data/starter-characters.js';

// Increment when archive selection or package assignment changes. A normal
// build then regenerates stale assets rather than combining new code/old packs.
export const assetPolicyVersion=102;
// Full RGBA wind cells use lossless encoding rather than a shared 256-colour palette.
export const windClarityAtlases=new Set(['wind-replacements','wind-moves','wind-skills','wind-vortex'].map(name=>'assets/vfx/'+name+'.png'));
export const compressedFireAtlases=new Set(['assets/vfx/fire-spin.png','assets/vfx/fire-breath.png','assets/vfx/fireball.png']);
export const musicTracks=Object.freeze([]);
const procedural=new Set(paperPropNames);
// Imported by the effect modules and compiled into the gameplay scripts.
const bundledAtlasMetadata=new Set(['fireball','fire-breath','fire-family','fire-mushroom','fire-spin','fire-storm-rings',
  'fire-breath-reference','fire-stampede','wind-replacements','wind-moves','wind-skills','wind-vortex','evolution-screen'].map(name=>'assets/vfx/'+name+'.json'));

// The portrait laboratory renders glyphs. Its legacy catalog icon fields
// and the full upstream item database do not describe the playable inventory.
const referencedIds = [
  ...Object.keys(itemCatalog).filter(isActiveItem),
  ...heldItems.map(item => item.key), ...shop.map(item => item.key),
  ...vitamins.map(item => item.icon),
];
export const requiredItemIcons = new Set([
  ...referencedIds.map(id => 'assets/'+resolveItemIcon(itemCatalog[id]?.icon || 'items/'+id+'.png')),
  ...battleParticleImages.map(([,image]) => image).filter(image => image.startsWith('items/')).map(image => 'assets/'+image+'.png'),
  'assets/items/poke-ball.png', // Capture HUD and shared fallback image.
]);

// Changing the playable list or reusing an icon must also refresh a cached pack.
export function itemIconSelectionChanged(files) {
  const installed = Object.keys(files).filter(key => key.startsWith('assets/items/'));
  return installed.length !== requiredItemIcons.size || installed.some(key => !requiredItemIcons.has(key));
}

// Exclusions are based on the enabled forest-only rules and procedural world,
// not merely on absence from a short playthrough.
export function excludedAssetReason(key){
  if(bundledAtlasMetadata.has(key))return '图集坐标已编入玩法脚本';
  if(key==='assets/models/devices/传送门.glb')return '召唤装置使用手绘时钟贴图';
  if(/^assets\/vfx\/heat-wave\.(?:png|json)$/.test(key))return '热风玩家技能已移除';
  if(/^assets\/cries\/\d+\.ogg$/.test(key))return '旧角色叫声已停用';
  if(key.startsWith('assets/env/desk2d/device-bill/')&&/[^\x00-\x7f]/.test(key))return '订书机效果参考图';
  if(key==='assets/env/desk2d/device-bill.png')return '订书机已使用分层原画';
  if(key==='assets/env/desk2d/device-altar.png'||key==='assets/env/desk2d/device-berry.png')return '已替换为分层设施图片';
  if(key.startsWith('assets/items/')&&!requiredItemIcons.has(key))return '当前玩法及界面无引用的道具图标';
  if(/^assets\/glyphs\/(?:faint_01_atlas|wind-(?:idle|walk|death)-atlas)\.png$/.test(key))return '旧版动作图集';
  if(key==='assets/glyphs/copy-strokes.png'&&!isPlayableHeroForm(132))return '隐藏字灵的笔画图集';
  const heroAction=/^assets\/glyphs\/hero-actions\/(\d+)\.png$/.exec(key);
  if(heroAction&&!isPlayableHeroForm(heroAction[1]))return '隐藏字灵的动作图集';
  if(key.startsWith('assets/music/'))return '当前手机版关闭背景音乐，不打包或下载录音';
  // UI creation, map icons and combat textures all resolve these numeric
  // identities to the glyph atlas. The old bitmaps have no runtime consumer.
  if(/^assets\/(?:portraits(?:-shiny)?|icons|front|pmd(?:-shiny)?)\/\d+\.png$/.test(key))return '角色图片已统一由字灵图集生成';
  const model=/^assets\/models\/([^/]+)\.glb$/.exec(key)?.[1];
  if(model&&procedural.has(model))return '已由纸张场景代码生成';
  if(model&&/^(?:tower|desert|coast|glacier|ruins|halloween)_/.test(model))return '未开放地图或关闭活动的模型';
  if(/^assets\/env\/(?:forest|sanctum)\//.test(key))return '已由桌面与纸张贴图替代';
  if(key.startsWith('assets/ui/events/'))return '当前版本活动列表为空';
  if(/^assets\/ui\/icons\/r-(?:gg|fire|love|lol|star|wow)\.png$/.test(key))return '仅旧公会和社交动态使用的表情';
  if(/^assets\/ui\/(?:avatars|frames|ranks)\//.test(key))return '旧社交头像、头像框和排行榜界面未启用';
  return null;
}
