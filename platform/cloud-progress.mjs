import {multiplayerConfig as config} from '../source/src/multiplayer-config.js';

let initialized, initializing;
export function initGameCloud(cloud) {
  if (initialized !== cloud || !initializing) {
    initialized = cloud;
    initializing = Promise.resolve().then(() => cloud.init({env:config.env})).catch(error => {
      if (initialized === cloud) initializing = null;
      throw error;
    });
  }
  return initializing;
}

export async function callProgress(method, data) {
  const cloud=wx.cloud;
  if(!cloud?.callContainer) throw Error('微信云存档接口不可用，请检查微信版本和网络');
  await initGameCloud(cloud);
  const res=await cloud.callContainer({config:{env:config.env},path:'/v1/progress',
    method,header:{'X-WX-SERVICE':config.service,'content-type':'application/json'},...(data ? {data} : {})});
  if(res.statusCode===409) return {conflict:true};
  if(res.statusCode!==200 || !res.data?.owner || !res.data.progress?.stages ||
     !Number.isSafeInteger(res.data.revision)) {
    throw Error(res.data?.error || '云存档服务尚未就绪（HTTP '+res.statusCode+'）');
  }
  return res.data;
}

function progressOf(p={}) {
  return {stardust:p.stardust??0,totalStardust:Math.max(p.stardust??0,p.totalStardust??0),
    lab:{...p.lab},stages:{...p.stageUnlocks,forest:p.biomes?.forest??0}};
}
function applySave(account,state) {
  if(!account)return;
  const p=account.profile,s=state.progress;
  p.stardust=s.stardust;p.totalStardust=s.totalStardust;p.lab={...s.lab};
  p.stageUnlocks={...s.stages};p.biomes={...p.biomes,forest:s.stages.forest};
  delete p.cloudSaveError;
  account.cloudOwner=state.owner;
}
const copy=value=>JSON.parse(JSON.stringify(value));
const progressRoutes=/^\/(?:profile(?:$|\/actions$)|lab\/buy$|items\/buy$|quests\/claim$|tasks\/claim$|account\/(?:reset|delete)$|runs\/[^/]+\/finish$)/;

// The on-disk proposal pairs a local settlement (including its run receipt)
// with the matching MySQL revision. It survives a lost reply or app restart.
export function progressDispatcher({load,save,call,mutationID,localRoute}) {
  let base;
  function persist(next){save(next);base=next;}
  async function completePending(){
    const pending=base.cloudPending;
    const state=await call('PUT',pending.request);
    if(state.conflict){
      const {cloudPending,...original}=base;
      persist(original);
      return false;
    }
    applySave(pending.next.accounts[pending.account],state);
    persist(pending.next);
    return true;
  }
  function cachedProfile(account,message) {
    return {status:200,data:{now:Date.now(),profile:{...account.profile,cloudSaveError:message}}};
  }
  return async function dispatch(url,method,headers,bodyText){
    base??=load();
    const key=url.pathname.slice(4);
    // This route parses its request before appending to the active run's
    // in-memory checkpoint list. No profile, receipt or disk write is involved.
    const checkpoint=method==='POST' && /^\/runs\/[^/]+\/checkpoint$/.test(key);
    const token=(headers.Authorization||headers.authorization||'').replace(/^Bearer /,'');
    const accountId=Object.values(base.accounts).find(a=>token && a.token===token)?.id;
    const sync=call && accountId && progressRoutes.test(key);
    try {
      // Read-only metadata and startup status remain available during an outage.
      if(base.cloudPending && (method!=='GET' || sync))await completePending();
      for(let attempt=0;attempt<2;attempt++){
        const account=base.accounts[accountId];
        let state;
        if(sync && account){
          state=account.cloudOwner ? await call('GET') : await call('POST',{progress:progressOf(account.profile)});
        }
        const draft=(method==='GET' && !state)||checkpoint ? base : copy(base);
        const player=draft.accounts[accountId];
        if(state)applySave(player,state);
        const before=state && JSON.stringify(progressOf(player.profile));
        const {response,dirty}=await localRoute(draft,url,method,headers,bodyText,checkpoint);
        if(response.status>=400)return response;
        const updated=draft.accounts[accountId];
        if(state && dirty && (before!==JSON.stringify(progressOf(updated?.profile)) || key==='/account/reset' || !updated)){
          const request={owner:state.owner,revision:state.revision,mutation:mutationID(),progress:progressOf(updated?.profile)};
          persist({...base,cloudPending:{request,account:accountId,next:draft}});
          if(!await completePending())continue;
        }else if(dirty || state)persist(draft);
        else base=draft;
        return response;
      }
      return {status:409,data:{error:'另一台设备刚更新了进度，请刷新后重试'}};
    }catch(error){
      const message=error?.errMsg || error?.message || '云存档连接失败';
      if(sync && key==='/profile' && method==='GET' && base.accounts[accountId])return cachedProfile(base.accounts[accountId],message);
      return {status:503,data:{error:'进度暂未确认保存：'+message}};
    }
  };
}

