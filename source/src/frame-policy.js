// Prefer WeChat's current hardware tier. The score/model rules are fallbacks
// for older clients, not a live FPS test (loading and heat can skew those).
export function deviceFramePolicy(device={}){
  const platform=String(device.platform||'').toLowerCase();
  if(platform!=='android'&&platform!=='ios')return {tier:'desktop',lock30Fps:false,source:'platform'};
  const level=Number(device.modelLevel);
  if(level===1||level===2||level===3)return {tier:['','high','medium','low'][level],lock30Fps:level!==1,source:'modelLevel'};
  const score=Number(device.benchmarkLevel);
  if(Number.isFinite(score)&&score>=1){
    const tier=score>=30?'high':score>=10?'medium':'low';
    return {tier,lock30Fps:tier!=='high',source:'benchmarkLevel'};
  }
  if(platform==='ios'){
    const model=String(device.model||'');
    const identifier=/\biPhone\s*(\d+),(\d+)\b/i.exec(model);
    const named=/\biPhone\s*(\d+)\b/i.exec(model);
    if(identifier||named){
      const generation=Number((identifier||named)[1]);
      const high=identifier?generation>=15:generation>=15||generation===14&&/\bPro\b/i.test(model);
      const tier=high?'high':generation<=11?'low':'medium';
      return {tier,lock30Fps:!high,source:'model'};
    }
    if(/\biPhone\s*SE\b/i.test(model))return {tier:'low',lock30Fps:true,source:'model'};
  }
  // Unknown mobile hardware starts conservatively; the player can override it.
  return {tier:'unknown',lock30Fps:true,source:'fallback'};
}

export function applyFrameRatePolicy(settings,device){
  if(!settings)return false;
  const beforeMode=settings.frameRateMode,beforeLock=settings.lock30Fps;
  if(settings.frameRateMode!=='auto'&&settings.frameRateMode!=='manual'){
    // Before auto-detection existed, true could only be a manual opt-in.
    settings.frameRateMode=beforeLock===true||beforeLock==='true'||beforeLock===1?'manual':'auto';
  }
  if(settings.frameRateMode==='auto')settings.lock30Fps=deviceFramePolicy(device).lock30Fps;
  return beforeMode!==settings.frameRateMode||beforeLock!==settings.lock30Fps;
}

export function setFrameRateLock(settings,enabled){
  settings.frameRateMode='manual';settings.lock30Fps=!!enabled;
}

export function resetFrameRatePolicy(settings,device){
  settings.frameRateMode='auto';applyFrameRatePolicy(settings,device);
}

export const frameRateHelp='中低端手机默认开启，高端手机默认关闭。手动调整会记住选择；开启后保留当前画质。';
