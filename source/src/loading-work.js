// Yield to the native event loop, not just the Promise microtask queue.
// Bound item count too: older device clocks can have coarse resolution.
export function waitForLoadingPaint(renderer) {
  // Native UI shares the WebGL canvas and can be throttled independently of
  // RAF. Flush it explicitly before beginning the next block of loading work.
  if(renderer){window.invalidateUI?.();window.drawUI?.(renderer,true);}
  return new Promise(resolve=>{
    let done=false;
    const finish=()=>{if(done)return;done=true;clearTimeout(timer);resolve();};
    // Native drawUI already submitted the frame. The DOM path needs a paint
    // between callbacks. Hidden apps can suspend either callback.
    const timer=setTimeout(finish,100);
    requestAnimationFrame(()=>{
      if(renderer && window.nativeUI)setTimeout(finish,0);
      else requestAnimationFrame(()=>setTimeout(finish,0));
    });
  });
}

// The native UI defers DOM image decoding until paint. Start just the icons
// in the entering player's visible loadout while the loading page is up.
export function prepareHudImage(image){
  if(image.complete&&image.naturalWidth)return Promise.resolve();
  if(image.decode)return image.decode();
  return new Promise((resolve,reject)=>{
    const loaded=()=>finish(true),failed=()=>finish(false);
    const finish=ok=>{
      clearTimeout(timer);
      image.removeEventListener('load',loaded);image.removeEventListener('error',failed);
      if(ok)resolve();else reject(Error('战斗图标读取失败：'+image.alt));
    };
    const timer=setTimeout(failed,12000);
    image.addEventListener('load',loaded);image.addEventListener('error',failed);
    image._loadImage?.();
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
