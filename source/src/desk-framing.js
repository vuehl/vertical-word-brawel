export const deskPitch=Math.PI*.30, deskTilt=Math.sin(deskPitch);
const normalHeight=84*Math.tan(37*Math.PI/360);
export const deskPixelsPerUnit=(2347/1.81)/normalHeight;
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
  const z=clamp(focusZ+(h*((1-t)*(1-2*377/826)+t*.05)+curve*.24)/deskTilt,-halfDepth+h/deskTilt,halfDepth-h/deskTilt);
  return {x,z,w,h,distance:42*h/normal};
}
