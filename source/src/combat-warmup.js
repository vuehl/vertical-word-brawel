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

// A linked program can still incur driver setup on its first instanced draw.
// Include the actual pool meshes in the existing covered entry frame. The same
// pools survive area changes, and their simulation state never advances here.
export function warmCombatDraw(run){
  const {projectiles,pickups,vfx}=run;
  const pools=[projectiles.pool,projectiles.glow,pickups.pool,pickups.glow,run.orbitals,run.orbitalsGlow,
    vfx.rings,vfx.beams,vfx.text,vfx.add,vfx.norm,vfx.ground,vfx.groundN];
  const crafted=vfx.crafted,family=crafted?.fireFamily;
  // compileAsync links programs but does not allocate instancing buffers. Draw
  // prepared skill batches once under the loading cover, including ultimates.
  const meshes=[...pools.map(pool=>pool.mesh),crafted?.mesh,crafted?.fireJet.mesh,crafted?.fireJet.hitMesh,
    crafted?.fireJet.legacy.mesh,crafted?.fireSpin.mesh,crafted?.fireball.mesh,
    family?.mesh,family?.topMesh,family?.heatMesh,family?.completionMesh,
    crafted?.windVortex?.mesh,crafted?.windMoves?.mesh].filter(Boolean);
  const saved=meshes.map(mesh=>({mesh,visible:mesh.visible,count:mesh.count}));
  try{
    for(const {mesh} of saved){mesh.visible=true;mesh.count=Math.max(1,mesh.count);}
    run.r.render(0);
  }finally{
    for(const {mesh,visible,count} of saved){mesh.visible=visible;mesh.count=count;}
  }
}
