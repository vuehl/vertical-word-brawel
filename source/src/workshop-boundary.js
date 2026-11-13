// Compose a wall from related still-life groups and isolated props. Spend the
// remaining space on unequal gaps, rather than spacing individual toys evenly.
export function arrangeWorkshopBoundary(edge,stage,side,seed){
  let state=(seed^Math.imul(side+1,0x45d9f3b)^Math.imul(stage,0x27d4eb2d))>>>0;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const cutaway=side===2,small=edge<85;
  const recipes=cutaway?[[0,5,4],[4,0,5],[5,0,4]]:[[0,1,4],[2,5,0],[3,0,1],[0,3,2]];
  const offset=(stage+side)%recipes.length;
  const first=recipes[offset].slice(0,small?2:3),last=recipes[(offset+1)%recipes.length].slice(0,small?2:3);
  const solo=cutaway?4:[2,1,5,3][(stage+side)%4];
  const compositions=edge<60?[first,[solo]]:small?[first,[solo],last]:[first,[solo],last,[cutaway?5:4]];
  // Reverse whole groups, not their contents, so walls do not share a rhythm.
  if((stage+side)%2)compositions.reverse();
  const groups=compositions.map((variants,index)=>{
    const members=[];let cursor=0;
    for(const original of variants){
      const variant=cutaway&&original>0&&original<4?5:original;
      const w=[16,7,7,12,19,14][variant],d=variant===0?6.6:7;
      const angle=(random()-.5)*.11;
      const extent=Math.abs(Math.cos(angle))*w+Math.abs(Math.sin(angle))*d;
      if(members.length)cursor+=.8+random()*1.5;
      members.push({variant,x:cursor+extent/2,z:-edge+5+random()*1.1,angle,w,d,extent});
      cursor+=extent;
    }
    return {id:side+'-'+index,side,cluster:members.length>1,width:cursor,members};
  });
  const left=-edge+13,right=edge-13,occupied=groups.reduce((sum,g)=>sum+g.width,0);
  const remaining=right-left-occupied;
  // The broadest break sits beside a cluster; smaller breaks frame a solo.
  const weights=groups.map((_,i)=>i===0?.35+random()*.25:(i===(stage+side)%(groups.length-1)+1?2.1:1)+random()*.65);
  weights.push(.35+random()*.25);
  const total=weights.reduce((sum,w)=>sum+w,0);
  let cursor=left+remaining*weights[0]/total;
  for(let i=0;i<groups.length;i++){
    const group=groups[i];group.start=cursor;group.end=cursor+group.width;
    for(const member of group.members)member.x+=cursor;
    cursor=group.end+remaining*weights[i+1]/total;
  }
  return groups;
}
