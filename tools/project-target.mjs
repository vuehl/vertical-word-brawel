import path from 'node:path';

// A plugin declaration is checked by WeChat before any game code runs.
// Only the iOS power-mode build needs to request MiniGameCommon.
export function gameProject(root,development,iosPowerMode){
  if(iosPowerMode)return path.join(root,'验收',development?'开发者温控工程':'iOS温控工程');
  return development?path.join(root,'验收','开发者工程'):root;
}
