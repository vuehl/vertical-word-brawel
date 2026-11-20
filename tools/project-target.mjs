import path from 'node:path';

export function gameProject(root,development){
  return development?path.join(root,'验收','开发者工程'):root;
}
