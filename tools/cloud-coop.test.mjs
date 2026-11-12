import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudSocket} from '../platform/cloud-coop.mjs';

function setup(){
  const sent=[],callbacks={};
  const task={readyState:1,send({data,complete}){sent.push(data);complete?.();},close(){},
    onOpen:f=>callbacks.open=f,onError:f=>callbacks.error=f,onMessage:f=>callbacks.message=f,onClose:f=>callbacks.close=f};
  const wx={login({success}){success({code:'temporary-code'});},cloud:{
    init(){},async callContainer({data}){assert.deepEqual(data,{code:'temporary-code'});return {statusCode:200,data:{openid:'user',ticket:'ticket',connectionId:'a'.repeat(32)}};},
    async connectContainer(){return {socketTask:task};}
  }};
  let publicCalls=0;
  wx.connectSocket=()=>{publicCalls++;throw Error('unexpected public connection');};
  return {wx,task,sent,callbacks,publicCalls:()=>publicCalls};
}

test('first frame proves identity and room messages wait for authentication',async()=>{
  const {wx,callbacks,sent,publicCalls}=setup();
  let opens=0;
  const s=cloudSocket(wx,{open(){opens++;},error:assert.fail,message(){},close(){}});
  await new Promise(resolve=>setImmediate(resolve));
  callbacks.open();
  assert.deepEqual(sent.map(JSON.parse),[{op:'auth',openid:'user',ticket:'ticket'}]);
  assert.equal(s.send('create'),false);
  callbacks.message({data:'{"op":"authenticated"}'});
  assert.equal(opens,1);
  assert.ok(s.send('create'));
  assert.equal(publicCalls(),0);
  s.close();
});

test('a slow native socket sends the newest unsent snapshot for each destination',async()=>{
  const {wx,callbacks,task}=setup();
  const socket=cloudSocket(wx,{open(){},error:assert.fail,message(){},close(){}});
  await new Promise(resolve=>setImmediate(resolve));
  callbacks.open();callbacks.message({data:'{"op":"authenticated"}'});
  const writes=[];
  task.send=frame=>writes.push(frame);
  for(let seq=1;seq<=6;seq++)for(const seat of [1,2])
    socket.send(Uint8Array.of(seat,seq).buffer,true);
  socket.send('ready');
  assert.equal(writes.length,3);assert.equal(writes[2].data,'ready');
  writes[0].complete();writes[1].complete();
  assert.deepEqual(writes.slice(3).map(w=>[...new Uint8Array(w.data)]),[[1,6],[2,6]]);
  socket.close();
});

test('pre-open 1006 retries the cloud route once and a server prompt recovers a missed open event',async()=>{
  const first=setup(), second=setup(), routes=[];
  first.task.readyState=second.task.readyState=undefined;
  first.wx.cloud.connectContainer=async ({path})=>{
    routes.push(path);
    return {socketTask:routes.length===1 ? first.task : second.task};
  };
  let opens=0;
  const socket=cloudSocket(first.wx,{open(){opens++;},error:assert.fail,message:assert.fail});
  await new Promise(resolve=>setImmediate(resolve));
  first.callbacks.close({code:1006});
  await new Promise(resolve=>setImmediate(resolve));
  first.callbacks.open();
  first.callbacks.error({code:1006});
  second.callbacks.message({data:'{"op":"auth_required"}'});
  second.callbacks.open();
  assert.deepEqual(routes,Array(2).fill('/ws/'+'a'.repeat(32)));
  assert.deepEqual(first.sent,[]);
  assert.equal(second.sent.length,1);
  assert.equal(socket.send('join'),false);
  second.callbacks.message({data:'{"op":"authenticated"}'});
  assert.equal(opens,1);
  socket.close();
});

test('missing cloud API, rejected login, and failed cloud handshake surface without a public route',async()=>{
  for(const mode of ['missing','login','connect']){
    const {wx,publicCalls}=setup();
    if(mode==='missing')delete wx.cloud.connectContainer;
    if(mode==='login')wx.cloud.callContainer=async()=>({statusCode:401,data:{error:'登录凭证无效'}});
    if(mode==='connect')wx.cloud.connectContainer=async()=>{throw Error('握手失败');};
    const error=await new Promise(resolve=>cloudSocket(wx,{open:assert.fail,error:resolve}));
    assert.match(error.message,/缺少云托管|凭证无效|握手失败/);
    assert.equal(publicCalls(),0);
  }
});
