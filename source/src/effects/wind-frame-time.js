// GIF exposures have unequal durations (20–70 ms). Use their actual boundaries,
// including an exclusive final boundary; never advance the animation per draw.
export function windFrameAt(clip,seconds,loop=false){
  const times=clip.times;
  if(!times){
    const frame=Math.floor(Math.max(0,seconds)*clip.fps+1e-7);
    return loop?frame%clip.count:frame<clip.count?frame:-1;
  }
  let ms=Math.max(0,seconds)*1000+1e-5;
  const end=times[times.length-1];
  if(loop)ms%=end;
  if(ms<times[0]||ms>=end)return -1;
  let low=0,high=times.length-1;
  while(low+1<high){const mid=(low+high)>>1;if(times[mid]<=ms)low=mid;else high=mid;}
  return low;
}
