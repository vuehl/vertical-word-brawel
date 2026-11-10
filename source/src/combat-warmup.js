// Compile invisible combat pools too, while the loading screen is still up.
// The scene is rendered into the composer's target, so use that color space
// for compilation. Never leave that target bound across an asynchronous wait.
export async function warmCombatShaders(graphics){
  const {renderer,scene,camera,composer}=graphics;
  const previous=renderer.getRenderTarget();
  let pending;
  try{
    renderer.setRenderTarget(composer.inputBuffer);
    pending=renderer.compileAsync(scene,camera);
  }finally{renderer.setRenderTarget(previous);}
  await pending;
}
