export const blinkDuration=1.4, lineAt=.26, openAt=.36, flashAt=.48, breathPeriod=1.6;
export const flashTail=blinkDuration-flashAt;
export function readyBreathPhase(time,fullAt){
  const elapsed=fullAt==null?time:Math.max(0,time-fullAt-flashTail);
  return (elapsed%breathPeriod)/breathPeriod;
}

// Blink In's arrival cue uses the decaying one-pixel shake from PixelFX core/act.js.
// The paper camera resets its position each frame, so the offset never accumulates.
export function applyReadyShake(run){
  const start=run.ult?.readyFlashAt;
  if(start==null||!run.ult.ready||!run.meta.profile.settings.shakeOn)return;
  const remaining=.1-(run.time-start);
  if(remaining<=0||remaining>.1)return;
  const amplitude=remaining/.1,frame=Math.floor(remaining*60);
  const dx=Math.round(Math.sin(frame*2.4)*amplitude);
  const dy=Math.round(Math.cos(frame*3.7)*amplitude*.7);
  if(!dx&&!dy)return;
  const camera=run.r.camera, height=run.r.canvas.getBoundingClientRect().height;
  if(!height)return;
  const projection=camera.projectionMatrix.elements;
  const depth=projection[15]===0?camera.position.distanceTo(run.player.pos):1;
  const unit=2*depth/(projection[5]*height);
  const scale=unit*run.meta.profile.settings.screenShake;
  camera.translateX(-dx*scale);
  camera.translateY(dy*scale);
}
