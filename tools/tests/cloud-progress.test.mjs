import test from 'node:test';
import assert from 'node:assert/strict';
import {progressDispatcher,callProgress} from '../../platform/cloud-progress.mjs';

function server(){
  let state,drop=false;
  const receipts=new Set();
  return {
    dropNextReply(){drop=true;},
    async call(method,data){
      if(method==='POST' && !state)state={owner:'test-player',revision:1,progress:structuredClone(data.progress)};
      if(method==='PUT' && !receipts.has(data.mutation)){
        if(data.revision!==state.revision)return {conflict:true};
        state={...state,revision:state.revision+1,progress:structuredClone(data.progress)};
        receipts.add(data.mutation);
        if(drop){drop=false;throw Error('reply lost after commit');}
      }
      return structuredClone(state);
    }
  };
}
let sequence=0;
function device(cloud,amount,intercept){
  let disk={accounts:{a:{id:'a',token:'session',profile:{stardust:amount,totalStardust:amount,biomes:{forest:1},lab:{}}}},runs:{}};
  function start(){
    const dispatch=progressDispatcher({load:()=>structuredClone(disk),save:value=>disk=structuredClone(value),
      mutationID:()=>String(++sequence).padStart(32,'0'),call:intercept||cloud.call,
      async localRoute(store,url,method){
        const p=store.accounts.a.profile;
        if(method==='POST' && !store.runs[url.pathname]){
          store.runs[url.pathname]={saved:true};p.stardust+=10;p.totalStardust+=10;
        }
        return {dirty:method==='POST',response:{status:200,data:{profile:p}}};
      }});
    return (key='/profile',method='GET')=>dispatch({pathname:'/api'+key},method,{Authorization:'Bearer session'});
  }
  return {start,stored:()=>disk};
}

test('legacy migration, lost commit reply, restart and a newer save on another phone',async()=>{
  const cloud=server(),a=device(cloud,26),b=device(cloud,0);
  const first=a.start(),second=b.start();
  assert.equal((await first()).data.profile.stardust,26);
  assert.equal((await second()).data.profile.stardust,26);
  cloud.dropNextReply();
  assert.equal((await first('/runs/one/finish','POST')).status,503);
  assert.ok(a.stored().cloudPending);
  assert.equal((await second('/runs/two/finish','POST')).data.profile.stardust,46);
  const restarted=a.start();
  assert.equal((await restarted('/runs/one/finish','POST')).data.profile.stardust,46);
  assert.ok(a.stored().runs['/api/runs/one/finish'].saved);
  assert.equal(a.stored().cloudPending,undefined);
});

test('a simultaneous update is recalculated from the newer revision',async()=>{
  const cloud=server();
  const other=device(cloud,26).start();
  await other();
  let conflict=true;
  const phone=device(cloud,0,async(method,data)=>{
    if(method==='PUT' && conflict){conflict=false;await other('/runs/other/finish','POST');}
    return cloud.call(method,data);
  }).start();
  await phone();
  assert.equal((await phone('/runs/mine/finish','POST')).data.profile.stardust,46);
  assert.equal((await other()).data.profile.stardust,46);
});

test('periodic checkpoints retain their active run without serializing saved history',async()=>{
  let copies=0,saved;
  const history={toJSON(){copies++;return {large:'past run'};}};
  const base={accounts:{},runs:{past:history,current:{cps:[]}}};
  const dispatch=progressDispatcher({load:()=>base,save:value=>{saved=value;},
    async localRoute(store,url){
      if(url.pathname.endsWith('/checkpoint')){
        store.runs.current.cps.push(300);return {response:{status:204}};
      }
      return {dirty:true,response:{status:200}};
    }});
  await dispatch({pathname:'/api/runs/current/checkpoint'},'POST',{},'{}');
  assert.equal(copies,0);assert.equal(saved,undefined);
  await dispatch({pathname:'/api/profile/prefs'},'PUT',{},'{}');
  assert.equal(copies,1);assert.deepEqual(saved.runs.current.cps,[300]);
});

test('a stalled native cloud read falls back to the existing save and releases the request',async t=>{
  const previous=globalThis.wx;
  t.after(()=>{globalThis.wx=previous;});
  t.mock.timers.enable({apis:['setTimeout']});
  let started,reply;
  const begun=new Promise(resolve=>{started=resolve;});
  globalThis.wx={cloud:{init(){},callContainer(){started();return new Promise(resolve=>{reply=resolve;});}}};
  const phone=device(null,26,callProgress),request=phone.start()();
  await begun;t.mock.timers.tick(8000);
  const result=await request;
  assert.equal(result.status,200);
  assert.equal(result.data.profile.stardust,26);
  assert.match(result.data.profile.cloudSaveError,/云存档读取超时/);
  reply({statusCode:200,data:{owner:'late',revision:1,progress:{stardust:99,stages:{forest:0}}}});
  await Promise.resolve();await Promise.resolve();
  assert.equal(phone.stored().accounts.a.profile.stardust,26,'Ignore a response after the request has timed out');
});

test('a stalled native cloud write rejects without claiming success',async t=>{
  const previous=globalThis.wx;
  t.after(()=>{globalThis.wx=previous;});
  t.mock.timers.enable({apis:['setTimeout']});
  let started;
  const begun=new Promise(resolve=>{started=resolve;});
  globalThis.wx={cloud:{init(){},callContainer(){started();return new Promise(()=>{});}}};
  const rejected=assert.rejects(callProgress('PUT',{}),/云存档保存超时/);
  await begun;t.mock.timers.tick(15000);await rejected;
});

