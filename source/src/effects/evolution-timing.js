import reference from '../../../resources/public/assets/vfx/evolution-screen.json' with {type:'json'};

export const EVOLUTION_DURATION=Math.round(reference.duration*1000)/1000;
export const EVOLUTION_REVEAL=Math.round(reference.reveal*1000)/1000;
export const EVOLUTION_LANDING=5.28;

export function evolutionFrame(seconds){
  const {times}=reference;
  let lo=0,hi=times.length-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(times[mid]<=seconds+1e-8)lo=mid;else hi=mid-1;}
  return Math.min(times.length-2,lo);
}
export function evolutionTile(frame){
  if(frame>142)return -1;
  const frames=reference.sourceFrames;
  let lo=0,hi=frames.length-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(frames[mid]<=frame)lo=mid;else hi=mid-1;}
  return lo;
}
export function evolutionPose(seconds){
  const frame=evolutionFrame(seconds),next=Math.min(frame+1,reference.flashes.length-1);
  const blend=Math.max(0,Math.min(1,(seconds-reference.times[frame])/(reference.times[frame+1]-reference.times[frame])));
  return {flash:reference.flashes[frame],lift:reference.liftPixels[frame]+(reference.liftPixels[next]-reference.liftPixels[frame])*blend};
}
