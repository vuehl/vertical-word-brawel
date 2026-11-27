// Run collection after the caller has dropped its temporary references. Coalesce
// scene/cinematic handoffs and throttle iOS GC to avoid repeated combat stalls.
export function createMemoryCleanup(wx,device,release,{now=Date.now,schedule=setTimeout}={}){
  let lastGC=-Infinity,queued=false;
  function trim(){
    release();
    const at=now();
    if(device.platform==='ios'&&at-lastGC>=5000){
      lastGC=at;
      try{wx.triggerGC?.();}catch{}
    }
  }
  return {
    warning:trim,
    request(){
      if(queued)return;
      queued=true;
      schedule(()=>{queued=false;trim();},Math.max(0,5000-(now()-lastGC)));
    },
  };
}
