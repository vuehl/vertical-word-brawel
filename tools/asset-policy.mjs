import {paperPropNames} from '../source/src/paper-prop-names.js';
import {isActiveItem} from '../source/src/active-content.js';
import {heldItems, laboratory, shop, vitamins} from '../source/src/catalogs.js';
import {resolveItemIcon} from '../source/src/item-icons.js';
import itemCatalog from '../source/public/data/items.json' with {type:'json'};
import {isPlayableHeroForm} from '../source/src/starter-characters.js';

// Increment when archive selection or package assignment changes. A normal
// build then regenerates stale assets rather than combining new code/old packs.
export const assetPolicyVersion=48;
export const compressedFireAtlases=new Set(['assets/vfx/fire-spin.png','assets/vfx/fire-breath.png','assets/vfx/fireball.png']);
export const musicTracks=Object.freeze([]);
const procedural=new Set(paperPropNames);

// These item IDs occur only in filtered-out item definitions and research.
// Everything outside this reviewed list, including new artwork, ships by default.
const reviewedItemIds = new Set([
  'black-belt', 'black-glasses', 'bright-powder', 'charcoal', 'choice-scarf',
  'choice-specs', 'dragon-fang', 'exp-share', 'hard-stone', 'kings-rock',
  'lax-incense', 'light-clay', 'macho-brace', 'max-elixir', 'metal-coat',
  'miracle-seed', 'mystic-water', 'never-melt-ice', 'poison-barb', 'potion',
  'power-herb', 'pp-max', 'protector', 'quick-powder', 'sharp-beak',
  'silver-powder', 'soft-sand', 'spell-tag', 'twisted-spoon', 'white-flute',
  'white-herb', 'wise-glasses', 'zoom-lens',
]);
const reviewedIconPaths = [...reviewedItemIds].map(id => 'assets/items/'+id+'.png');
const referencedIds = [
  ...Object.keys(itemCatalog).filter(id => !reviewedItemIds.has(id) || isActiveItem(id)),
  ...heldItems.map(item => item.key), ...shop.map(item => item.key),
  ...vitamins.map(item => item.icon), ...laboratory.map(item => item.icon),
];
const referencedIcons = new Set(referencedIds.map(id =>
  'assets/'+resolveItemIcon(itemCatalog[id]?.icon || 'items/'+id+'.png')));
const excludedItemIcons = new Set(reviewedIconPaths.filter(key => !referencedIcons.has(key)));

// Changing the playable list or reusing an icon must also refresh a cached pack.
export function itemIconSelectionChanged(files) {
  return reviewedIconPaths.some(key => {
    const shouldShip = !excludedItemIcons.has(key);
    return Object.hasOwn(files,key) !== shouldShip;
  });
}

// Exclusions are based on the enabled forest-only rules and procedural world,
// not merely on absence from a short playthrough. Keep the source art intact.
export function excludedAssetReason(key){
  if(excludedItemIcons.has(key))return '已隐藏道具的专用图标，当前玩法及界面无引用';
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
