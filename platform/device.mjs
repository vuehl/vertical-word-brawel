// Read once at startup. Window information alone does not identify the OS.
export function readDevice(api){
  let info;
  try{info=api.getDeviceInfo?.();}catch{}
  if(!info?.platform)try{info=api.getSystemInfoSync?.();}catch{}
  return {platform:String(info?.platform||'').toLowerCase()};
}

// Read actual runtime flags, not the requested game.json setting. Older hosts
// may omit them; keep that distinct from an explicit false value.
export function readRuntimeInfo(api,runtime={}){
  let device={},base={};
  try{device=api.getDeviceInfo?.()||{};}catch{}
  if(!device.platform)try{device=api.getSystemInfoSync?.()||{};}catch{}
  try{base=api.getAppBaseInfo?.()||device;}catch{base=device;}
  return {platform:String(device.platform||'').toLowerCase(),model:String(device.model||''),
    benchmarkLevel:Number(device.benchmarkLevel)||-1,modelLevel:0,
    system:String(device.system||''),wechatVersion:String(base.version||''),sdkVersion:String(base.SDKVersion||''),
    highPerformance:typeof runtime.isIOSHighPerformanceMode==='boolean'?runtime.isIOSHighPerformanceMode:null,
    highPerformancePlus:typeof runtime.isIOSHighPerformanceModePlus==='boolean'?runtime.isIOSHighPerformanceModePlus:null};
}

// Query while the rest of the host loads. Unsupported/failed/never-calling
// clients keep the synchronous model/score fallback and cannot block startup.
export function readDevicePerformance(api,device,timeoutMs=1500){
  if(typeof api.getDeviceBenchmarkInfo!=='function')return Promise.resolve(device);
  return new Promise(resolve=>{
    let finished=false;
    const finish=result=>{
      if(finished)return;finished=true;clearTimeout(timer);
      const score=Number(result?.benchmarkLevel),level=Number(result?.modelLevel);
      if(Number.isFinite(score)&&score>=1)device.benchmarkLevel=score;
      if(level===1||level===2||level===3)device.modelLevel=level;
      resolve(device);
    };
    const timer=setTimeout(()=>finish(),timeoutMs);
    try{api.getDeviceBenchmarkInfo({success:finish,fail:()=>finish()});}catch{finish();}
  });
}
