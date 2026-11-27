export const deskPitch=Math.PI*.30, deskTilt=Math.sin(deskPitch);
const normalHeight=84*Math.tan(37*Math.PI/360);
export const deskPixelsPerUnit=(2347/1.81)/normalHeight;
export const deskWalkInset=2;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const entryHeroScale=2;
// Compensate the transparent lower margin in the warm-ink idle cels.
export const entryFootOffset=.30;
export const cameraEase=progress=>progress*progress*(3-2*progress);

// The entry pose puts the feet at (167,377) in the 382 x 826 composition.
// Use the same orthographic projection, map bounds and spawn for every frame.
export function deskFrame(aspect,halfWidth,halfDepth,focusX,focusZ,progress=1,bend=0){
  const normal=Math.min(normalHeight*Math.max(1,.46/aspect),halfDepth*2*deskTilt,halfWidth*2/aspect)/2;
  const near=Math.min(normal,4.65*entryHeroScale*Math.max(1,.46/aspect));
  const t=cameraEase(progress),h=near+(normal-near)*t,w=h*aspect;
  const curve=4*t*(1-t)*bend;
  const x=clamp(focusX+w*((1-t)*(1-2*167/382)+t*.148)+curve,-halfWidth+w,halfWidth-w);
  const viewDepth=h/deskTilt,limit=halfDepth-viewDepth;
  const targetZ=focusZ+(h*((1-t)*(1-2*377/826)+t*.05)+curve*.24)/deskTilt;
  // Reserve part of the camera travel for the last stretch to the south edge.
  // At the walk limit the frame just meets the artwork. On the return trip
  // the background immediately tracks 40% of the distance the player walks.
  const southZ=limit-.4*Math.max(0,halfDepth-deskWalkInset-focusZ);
  const blendWidth=viewDepth*.25;
  const overlap=Math.max(0,blendWidth-Math.abs(targetZ-southZ));
  const z=clamp(Math.min(targetZ,southZ)-overlap*overlap/(4*blendWidth),-limit,limit);
  return {x,z,w,h,distance:42*h/normal};
}

export const deskCombatViewScale = 0.65;

// Fit the 1170 x 2532 reference first, so the combat zoom is consistent
// even on wide screens where the artwork limits the original frame.
export function deskPlayFrame(aspect,halfWidth,halfDepth,viewScale=1){
  const referenceAspect=1170/2532;
  const halfHeight=1260/deskPixelsPerUnit*Math.max(1,referenceAspect/aspect);
  // Leave a two-pixel margin when fitting the view size to the artwork.
  const inset=2/deskPixelsPerUnit;
  const limitX=halfWidth-inset,limitZ=halfDepth-inset/deskTilt;
  const h=Math.min(halfHeight,limitX/aspect,limitZ*deskTilt)*viewScale,w=h*aspect;
  return {w,h,distance:84*h/normalHeight};
}
