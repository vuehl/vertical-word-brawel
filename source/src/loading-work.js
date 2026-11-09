// Yield to the native event loop, not just the Promise microtask queue.
// Bound item count too: older device clocks can have coarse resolution.
export function waitForLoadingPaint(renderer) {
  // Native UI shares the WebGL canvas and can be throttled independently of
  // RAF. Flush it explicitly before beginning the next block of loading work.
  if(renderer){window.invalidateUI?.();window.drawUI?.(renderer,true);}
  return new Promise(resolve=>{
    let done=false;
    const finish=()=>{if(done)return;done=true;clearTimeout(timer);resolve();};
    // Two frames also cover a throttled 30 FPS UI. Hidden apps may suspend
    // animation callbacks; resuming must not leave an entry promise stuck.
    const timer=setTimeout(finish,100);
    requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(finish,0)));
  });
}

export async function runLoadingSteps(steps,{onProgress,check=()=>{},budgetMs=6,maxSteps=8}={}) {
  const began=performance.now(),stats={steps:0,yields:0,maxSliceMs:0,totalMs:0};
  let sliceAt=began,count=0;
  for(const _ of steps){
    check();stats.steps++;count++;
    const elapsed=performance.now()-sliceAt;
    stats.maxSliceMs=Math.max(stats.maxSliceMs,elapsed);
    if(elapsed>=budgetMs||count>=maxSteps){
      onProgress?.(stats);stats.yields++;
      await new Promise(resolve=>setTimeout(resolve,0));check();
      sliceAt=performance.now();count=0;
    }
  }
  check();stats.totalMs=performance.now()-began;onProgress?.(stats);
  return stats;
}
