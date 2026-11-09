import {paperPropNames} from '../source/src/paper-prop-names.js';

// Increment when archive selection or package assignment changes. A normal
// build then regenerates stale assets rather than combining new code/old packs.
export const assetPolicyVersion=2;
export const musicTracks=Object.freeze(['menu','boss','ingame1','ingame2','ingame3','ingame4']);
export const musicPackage=track=>track==='menu'?'sound':'music_'+track;
const procedural=new Set(paperPropNames);

// Exclusions are based on the enabled forest-only rules and procedural world,
// not merely on absence from a short playthrough. Keep the source art intact.
export function excludedAssetReason(key){
  const model=/^assets\/models\/([^/]+)\.glb$/.exec(key)?.[1];
  if(model&&procedural.has(model))return '已由纸张场景代码生成';
  if(model&&/^(?:tower|desert|coast|glacier|ruins|halloween)_/.test(model))return '未开放地图或关闭活动的模型';
  if(/^assets\/env\/(?:forest|sanctum)\//.test(key))return '已由桌面与纸张贴图替代';
  if(key.startsWith('assets/ui/events/'))return '当前版本活动列表为空';
  if(/^assets\/ui\/(?:avatars|frames|ranks)\//.test(key))return '旧社交头像、头像框和排行榜界面未启用';
  if(key==='assets/music/halloween-menu.ogg')return '万圣节活动未开放';
  const front=/^assets\/front\/(\d+)\.png$/.exec(key);
  if(front&&Number(front[1])>151&&Number(front[1])!==201)return '当前森林玩法范围之外的备用立绘';
  return null;
}
