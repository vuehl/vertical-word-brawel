import reference from '../../../resources/public/assets/vfx/evolution-screen.json' with {type:'json'};

// Atlas times describe the original brush animation. Gameplay uses the same
// exposures on a shorter clock, including the 20 ms frames in the charge.
export const EVOLUTION_DURATION=4.2;
export const EVOLUTION_PLAYBACK_RATE=Math.round(reference.duration*1000)/(1000*EVOLUTION_DURATION);
export const evolutionFrameTimes=reference.times.map(time=>time/EVOLUTION_PLAYBACK_RATE);
export const EVOLUTION_REVEAL=reference.reveal/EVOLUTION_PLAYBACK_RATE;
export const EVOLUTION_LANDING=evolutionFrameTimes[148];

export function evolutionFrame(seconds){
  let lo=0,hi=evolutionFrameTimes.length-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(evolutionFrameTimes[mid]<=seconds+1e-8)lo=mid;else hi=mid-1;}
  return Math.min(evolutionFrameTimes.length-2,lo);
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
  const blend=Math.max(0,Math.min(1,(seconds-evolutionFrameTimes[frame])/(evolutionFrameTimes[frame+1]-evolutionFrameTimes[frame])));
  return {glyph:reference.poses[frame],flash:reference.flashes[frame],lift:reference.liftPixels[frame]+(reference.liftPixels[next]-reference.liftPixels[frame])*blend};
}
