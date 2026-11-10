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
    system:String(device.system||''),wechatVersion:String(base.version||''),sdkVersion:String(base.SDKVersion||''),
    highPerformance:typeof runtime.isIOSHighPerformanceMode==='boolean'?runtime.isIOSHighPerformanceMode:null,
    highPerformancePlus:typeof runtime.isIOSHighPerformanceModePlus==='boolean'?runtime.isIOSHighPerformanceModePlus:null};
}
