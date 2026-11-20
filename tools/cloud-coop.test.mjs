import test from 'node:test';
import assert from 'node:assert/strict';
import {RelayRoom} from '../source/src/multiplayer.js';
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

test('duo clients reject oversized rooms and solo start messages before loading combat',async()=>{
  for(const [op,state,count] of [['reply','lobby',3],['room','started',3],['room','started',1]]){
    const session=new RelayRoom();
    session.socket={send:()=>true,close(){}};
    let starts=0;
    session.ev.start=()=>starts++;
    const pending=session.request('join');
    const members=Array.from({length:count},(_,slot)=>({id:String(slot),slot,ready:true}));
    session.receive(JSON.stringify({op,id:1,room:{state,members}}));
    await assert.rejects(pending,/仅支持两人/);
    assert.equal(starts,0);assert.equal(session.open,false);
  }
});

test('traffic and suspended timers do not falsely time out an active room',()=>{
  const s=new RelayRoom(),sent=[];
  s.socket={send:data=>{sent.push(JSON.parse(data));return true;},close(){}};
  s.lastHeartbeat=s.pongAt=1000;
  s.checkHeartbeat(121000); // two minutes in the background
  assert.equal(s.open,true);
  assert.equal(sent.at(-1).op,'ping');
  for(let now=131000;now<=161000;now+=10000)s.checkHeartbeat(now);
  assert.equal(s.open,true);
  s.checkHeartbeat(171000);
  assert.equal(s.open,false);

  const active=new RelayRoom();
  active.socket={send:()=>true,close(){}};
  active.pongAt=0;active.lastHeartbeat=Date.now()-10000;
  active.receive(JSON.stringify({op:'monsters'}));
  active.checkHeartbeat();
  assert.equal(active.open,true);
  active.end('',false);
});

test('a timed out request does not evict an otherwise healthy room',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const s=new RelayRoom();s.socket={send:()=>true,close(){}};
  const pending=s.request('playing');
  const rejected=assert.rejects(pending,/响应超时/);
  t.mock.timers.tick(15000);
  await rejected;
  assert.equal(s.open,true);assert.equal(s.pending.size,0);
  s.end('',false);
});

test('both offline players can recover world without a live peer response',async()=>{
  const s=new RelayRoom();s.me='me';
  s.room={party:'same-party',members:[{id:'me',slot:0},{id:'other',slot:1,offline:true}]};
  const world={stage:2,stageTime:30,time:330,x:2,z:3};
  s.socket={send(raw){
    const m=JSON.parse(raw);
    if(m.op==='world')queueMicrotask(()=>s.receive(JSON.stringify({op:'reply',id:m.id,world})));
    return true;
  },close(){}};
  assert.deepEqual(await s.currentWorld(),world);
  assert.equal(s.me,'me');
  s.end('',false);
});

test('background presence closes only the away peer link and returning clears it',()=>{
  const s=new RelayRoom();s.me='guest';s.startedSeen=true;
  s.socket={send:()=>true,close(){}};
  s.room={state:'started',members:[{id:'host',slot:0},{id:'guest',slot:1}]};
  const links=[];s.ev.link=(...args)=>links.push(args);
  s.receive(JSON.stringify({op:'room',room:{...s.room,members:[{id:'host',slot:0,away:true},{id:'guest',slot:1}]}}));
  assert.equal(s.open,true);assert.equal(s.linkState('host'),'closed');assert.equal(s.linkState('guest'),'open');
  s.receive(JSON.stringify({op:'room',room:{...s.room,members:[{id:'host',slot:0,generation:1},{id:'guest',slot:1}]}}));
  assert.deepEqual(links,[['host','closed'],['host','open']]);
  s.end('',false);
});

test('a retained running seat can resume after the other player explicitly leaves',async()=>{
  const s=new RelayRoom();s.resume={seat:'me',party:'party'};s.socket={send:()=>true,close(){}};
  const joined=s.request('join');
  s.receive(JSON.stringify({op:'reply',id:1,me:'me',room:{state:'started',running:true,party:'party',members:[{id:'me',slot:0}]}}));
  await joined;
  assert.equal(s.open,true);assert.equal(s.returning,true);s.end('',false);
});
