export const entryControls={
  journey:[30,619,322,63],multiplayer:[30,698,155,52],lab:[196,698,156,52],
  back:[28,717,70,54],enter:[105,716,252,55],
  tiers:[[28,602,75,52],[112,602,76,52],[198,602,75,52],[282,602,76,52]],
};

// Screen artwork and native hit targets share the same safe-area transform.
export function entryLayout(v){
  const scale=Math.min(v.w/382,v.height/826,v.h/736);
  const x=v.x+(v.w-382*scale)/2;
  const y=Math.min(v.y+v.h-801*scale,Math.max(v.y-66*scale,(v.height-826*scale)/2));
  return {scale,x,y};
}
