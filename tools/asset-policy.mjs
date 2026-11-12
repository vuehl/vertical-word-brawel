import {paperPropNames} from '../source/src/paper-prop-names.js';

// Increment when archive selection or package assignment changes. A normal
// build then regenerates stale assets rather than combining new code/old packs.
export const assetPolicyVersion=15;
export const musicTracks=Object.freeze([]);
const procedural=new Set(paperPropNames);

// Exclusions are based on the enabled forest-only rules and procedural world,
// not merely on absence from a short playthrough. Keep the source art intact.
export function excludedAssetReason(key){
  if(key.startsWith('assets/music/'))return '当前手机版关闭背景音乐，不打包或下载录音';
  // UI creation, map icons and combat textures all resolve these numeric
  // identities to the glyph atlas. The old bitmaps have no runtime consumer.
  if(/^assets\/(?:portraits(?:-shiny)?|icons|front|pmd(?:-shiny)?)\/\d+\.png$/.test(key))return '角色图片已统一由字灵图集生成';
  const model=/^assets\/models\/([^/]+)\.glb$/.exec(key)?.[1];
  if(model&&procedural.has(model))return '已由纸张场景代码生成';
  if(model&&/^(?:tower|desert|coast|glacier|ruins|halloween)_/.test(model))return '未开放地图或关闭活动的模型';
  if(/^assets\/env\/(?:forest|sanctum)\//.test(key))return '已由桌面与纸张贴图替代';
  if(key.startsWith('assets/ui/events/'))return '当前版本活动列表为空';
  if(/^assets\/ui\/(?:avatars|frames|ranks)\//.test(key))return '旧社交头像、头像框和排行榜界面未启用';
  return null;
}
