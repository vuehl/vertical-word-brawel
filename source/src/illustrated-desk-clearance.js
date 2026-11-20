// Positions in the user's annotated full-desk reference (2026-11-17).
// Keep the original placement slots occupied in the layout generator: clearing
// a group must not move its neighbours or fill that opening with another group.
const clearedGroups=new Set([
  'grid:-2:-1','grid:-2:2','spawn:right','grid:1:2','grid:2:-2','grid:2:2'
]);
const removedMembers={
  'grid:-3:-3':['mug'],'grid:-3:-2':['mug'],'grid:-3:-1':['mug'],
  'grid:-3:0':['mug'],'grid:-3:1':['mug'],'grid:-3:2':['mug'],
  'grid:-2:-2':['crate'],
  'grid:-1:-3':['paintTube'],
  'grid:-1:1':['penCup','mug','pen'],
  'grid:-1:3':['paintTube@11,1'],
  'spawn:left':['headphones','mug'],
  'grid:0:2':['mug'],'grid:0:3':['mug'],
  'spawn:artist':['penCup','mug','paintTube@9,8'],
  'grid:1:-2':['crate','cube'],
  'grid:2:0':['paintTube@11,1'],
  'grid:3:-3':['mug'],'grid:3:-2':['succulent','mug'],
  'grid:3:-1':['planner','phone','paperNote','pen','headphones','paintTube','mug'],
  'grid:3:0':['mug'],'grid:3:1':['mug']
};
export function clearDeskGroup(id){return clearedGroups.has(id);}
export function clearDeskMember(id,kind,dx,dz){
  const members=removedMembers[id];
  return !!members&&(members.includes(kind)||members.includes(kind+'@'+dx+','+dz));
}
