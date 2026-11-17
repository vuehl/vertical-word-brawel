// This setting belongs to the WeChat device, independently of the player's save.
// Load the official plugin only when the iOS graphics settings are opened.
export function createIOSPowerMode(wx,runtime,loadPlugin){
  let manager,pendingWrite;
  function getManager(){
    if(!manager){
      if(!runtime.miniGameCommon){
        const plugin=loadPlugin?.('MiniGameCommon',{enableRequireHostModule:true,customEnv:{wx}});
        if(plugin?.default)runtime.miniGameCommon=plugin.default();
      }
      manager=runtime.miniGameCommon?.getPowerModeManager?.();
    }
    return manager;
  }
  function call(method,options={}){
    return new Promise((resolve,reject)=>{
      const power=getManager();
      if(typeof power?.[method]!=='function')throw Error('当前微信环境未提供温控模式');
      power[method]({...options,success:resolve,fail:reject});
    });
  }
  return {
    async read(){
      // Reopening the page during a native write must read the committed mode.
      if(pendingWrite)await pendingWrite.catch(()=>{});
      const [current,local]=await Promise.all([call('getCurrentMode'),call('getLocalMode')]);
      if(![0,1].includes(current?.mode)||![0,1].includes(local?.mode))throw Error('温控状态未知');
      return {current:current.mode,local:local.mode};
    },
    async set(mode){
      if(mode!==0&&mode!==1)throw Error('温控模式无效');
      if(pendingWrite)throw Error('正在保存温控设置');
      pendingWrite=call('setLocalMode',{mode});
      try{await pendingWrite;}finally{pendingWrite=null;}
    },
  };
}
