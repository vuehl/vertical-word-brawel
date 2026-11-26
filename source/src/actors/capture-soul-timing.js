// Shared by source-stroke removal and the matching travelling soul.
export const captureSoulTiming=Object.freeze({duration:2.02,departures:1.22,travel:.56});
export const captureSoulBirth=(index,count)=>captureSoulTiming.departures*Math.pow(index/Math.max(1,count-1),1.12);
export function removedCaptureStrokes(time,count){
  let removed=0;
  for(let i=0;i<count;i++)if(time>=captureSoulBirth(i,count))removed++;
  return removed;
}
