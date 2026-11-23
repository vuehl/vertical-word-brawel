import {enemyWords,enemySpeciesWord} from './character-rules.js';
import {formCopy} from './form-copy.js';

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
  const meshes=[...pools.map(pool=>pool.mesh),vfx.upgrade?.mesh,vfx.upgrade?.rearMesh,crafted?.mesh,crafted?.fireJet.mesh,crafted?.fireJet.hitMesh,
    crafted?.fireJet.legacy.mesh,crafted?.fireSpin.mesh,crafted?.fireball.mesh,
    family?.mesh,family?.topMesh,
    crafted?.windVortex?.mesh,crafted?.windMoves?.mesh,crafted?.stampede?.mesh].filter(Boolean);
  const saved=meshes.map(mesh=>({mesh,visible:mesh.visible,count:mesh.count}));
  try{
    for(const {mesh} of saved){mesh.visible=true;mesh.count=Math.max(1,mesh.count);}
    run.r.render(0);
  }finally{
    for(const {mesh,visible,count} of saved){mesh.visible=visible;mesh.count=count;}
  }
}

// Only prepare CPU-side batches for the resident monster atlas. Native decode,
// texture uploads and shader compilation cannot be interrupted to meet a deadline.
export class CombatIdleWarmup {
  stable=0;
  next=0;
  cursor=0;
  disabled=false;
  afterFrame(run,gap,interval,remaining,now){
    if(this.disabled)return;
    if(gap!==1000/30||interval<=0||interval>gap*1.2||remaining<gap*.4){
      this.stable=0;
      this.next=Math.max(this.next,now+500);
      return;
    }
    if(++this.stable<6||now<this.next)return;
    this.next=now+150;
    const director=run.director;
    if(this.director!==director||this.generation!==director.cardsDrawn){
      this.director=director;
      this.generation=director.cardsDrawn;
      this.cursor=0;
    }
    const cards=director.cards,count=Math.min(3,cards.length);
    if(this.cursor>=count*enemyWords.length)return;
    const id=cards[cards.length-1-this.cursor%count].id;
    const index=Math.floor(this.cursor/count);
    const word=formCopy[id]?enemySpeciesWord(id):enemyWords[index];
    try{
      // When all speculative slots are occupied, revisit this candidate later.
      if(run.sprites.warmEnemyGlyph(id,word))this.cursor++;
    }catch(error){
      this.disabled=true;
      console.warn('战斗空闲预热已停止',error);
    }
    // A single allocation is indivisible. Back off if it exceeded its slice.
    if(performance.now()-now>2){this.next=now+2000;this.stable=0;}
  }
}
