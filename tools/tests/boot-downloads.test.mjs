import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../../game.js',import.meta.url),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
}

function fixture(t,{joinForest=true}={}){
  let now=0,env;
  const gates=Object.fromEntries(['play','text','world','art'].map(name=>[name,deferred()]));
  const events=[],warnings=[],modals=[],drawn=[],downloads={},jobs=new Map(),timers=new Set(),intervals=new Map();
  let intervalId=0;
  const diagnostics={packs:{}};
  const GameGlobal={};
  function install(name){
    if(!jobs.has(name)){
      downloads[name]=(downloads[name]||0)+1;
      events.push('start:'+name);
      diagnostics.packs[name]={cached:false,totalMs:undefined};
      const started=now;
      jobs.set(name,gates[name].promise.then(()=>{
        diagnostics.packs[name].totalMs=now-started;
        events.push('ready:'+name);
      },error=>{jobs.delete(name);throw error;}));
    }
    return jobs.get(name);
  }
  const files={
    diagnostics,
    async loadPackage(name,progress){
      await install(name);GameGlobal.pokebonkPlayEntry={api:play};progress(100);
    },
    async init(_,progress){
      progress({name:'text',phase:'download',completed:0,total:100});
      await install('text');progress({name:'text',phase:'ready',completed:1,total:1});
    },
    prepareForest:()=>Promise.all(['world','art'].map(install)),
    preloadForest:()=>Promise.all(['world','art'].map(install)),
    async preloadDeferred(){
      events.push('deferred');diagnostics.packs.wind={cached:false};
      // A delayed update must not mutate the cold-start diagnostics snapshot.
      diagnostics.packs.text.totalMs=99999;
    },
    async cleanObsoletePacks(){events.push('cleanup');},
  };
  const play={
    async setup(){
      events.push('setup');
      return env={drawUI(){},onBootReady(){events.push('reveal');}};
    },
    async run(){
      events.push('profile');
      if(joinForest)await files.prepareForest();
      events.push('scene');
    },
  };
  const context={GameGlobal,Promise,Date:class extends Date{static now(){return now;}},
    console:{info(){},warn(...args){warnings.push(args);},error(...args){warnings.push(args);}},
    setTimeout(fn,ms){const timer=setTimeout(fn,ms);timers.add(timer);return timer;},
    clearTimeout(timer){timers.delete(timer);clearTimeout(timer);},
    setInterval(fn,ms){const id=++intervalId;intervals.set(id,{fn,ms,next:now+ms});return id;},
    clearInterval(id){intervals.delete(id);},
    wx:{
      onShow(){},getWindowInfo:()=>({windowWidth:390,windowHeight:844,pixelRatio:1}),
      createCanvas:()=>({getContext:()=>({})}),
      showModal(options){modals.push(options);},exitMiniProgram(){events.push('exit');},
    },
    require(name){
      if(name==='./files')return files;
      if(name==='./boot-screen')return async()=>({draw(value){drawn.push(value);},dispose(){events.push('dispose');}});
      throw Error(name);
    },
  };
  t.after(()=>{for(const timer of timers)clearTimeout(timer);intervals.clear();});
  vm.runInNewContext(source.replace(/start\(\);\s*$/,'globalThis.bootComplete=start();'),context);
  async function step(ms=100){
    now+=ms;
    for(const [id,interval] of [...intervals]){
      if(now<interval.next||!intervals.has(id))continue;
      interval.next=now+interval.ms;interval.fn();
    }
    env?.drawUI({resetState(){}});await flush();
  }
  return {gates,events,warnings,modals,drawn,downloads,diagnostics,
    get host(){return GameGlobal.pokebonk;},
    get activeIntervals(){return intervals.size;},
    step,
    async advance(ms){for(let elapsed=0;elapsed<ms;elapsed+=100)await step(Math.min(100,ms-elapsed));},
    async complete(){
      for(let i=0;i<20&&!GameGlobal.pokebonk?.bootDiagnostics.completed;i++){
        await step();
      }
      assert.equal(GameGlobal.pokebonk?.bootDiagnostics.completed,true,'Startup must finish');
      await context.bootComplete;
    },
    settle:()=>context.bootComplete,
  };
}

test('cold startup overlaps all required downloads and engine/profile work without revealing an incomplete scene',async t=>{
  const f=fixture(t);await flush();
  assert.deepEqual([...f.events].sort(),['start:art','start:play','start:text','start:world']);
  assert.equal(f.host.bootDiagnostics.forestPreload.status,'loading');
  f.gates.play.resolve();f.gates.text.resolve();await flush();
  assert.ok(f.events.includes('setup')&&f.events.includes('profile'),'Scene downloads must not delay engine and save preparation');
  assert.equal(f.events.includes('scene'),false);
  for(let i=0;i<4;i++)await f.step();
  assert.equal(f.drawn.includes(100),false);
  f.gates.world.resolve();await flush();
  assert.equal(f.events.includes('scene'),false,'Entry still waits for character art');
  f.gates.art.resolve();await flush();await f.complete();
  assert.deepEqual(f.downloads,{play:1,text:1,world:1,art:1});
  assert.equal(f.host.bootDiagnostics.forestPreload.status,'ready');
  assert.ok(f.events.indexOf('reveal')>f.events.indexOf('scene'));
  assert.ok(f.events.indexOf('deferred')>f.events.indexOf('reveal'));
  assert.equal(f.host.bootDiagnostics.packs.wind,undefined);
  assert.notEqual(f.host.bootDiagnostics.packs.text.totalMs,99999,'Cold timings are a snapshot, not live background diagnostics');
});

test('a deferred scene failure is handled and entry retries only the failed pack',async t=>{
  const f=fixture(t);await flush();
  f.gates.world.resolve();f.gates.art.reject(Error('temporary art failure'));await flush();
  assert.equal(f.host.bootDiagnostics.forestPreload.status,'error');
  assert.match(f.host.bootDiagnostics.forestPreload.error,/temporary art failure/);
  assert.equal(f.modals.length,0,'Preload failure must leave the visible entry retry flow in control');
  f.gates.art=deferred();
  f.gates.play.resolve();f.gates.text.resolve();await flush();
  assert.deepEqual(f.downloads,{play:1,text:1,world:1,art:2});
  f.gates.art.resolve();await flush();await f.complete();
  assert.equal(f.events.includes('reveal'),true);
  assert.equal(f.modals.length,0);
});

test('a menu-only launch does not wait for a pending scene preload',async t=>{
  const f=fixture(t,{joinForest:false});await flush();
  f.gates.play.resolve();f.gates.text.resolve();await flush();await f.complete();
  assert.equal(f.host.bootDiagnostics.forestPreload.status,'loading');
  assert.equal(f.events.includes('ready:world'),false);
  f.gates.world.resolve();f.gates.art.resolve();await flush();
  assert.equal(f.host.bootDiagnostics.forestPreload.status,'ready');
  assert.deepEqual(f.downloads,{play:1,text:1,world:1,art:1});
});

test('exiting after a text failure leaves no unhandled scene preload rejection',async t=>{
  const f=fixture(t);await flush();
  f.gates.play.resolve();f.gates.text.reject(Error('text unavailable'));await flush();
  assert.equal(f.modals.length,1);
  f.modals[0].success({confirm:false});await f.settle();
  f.gates.world.reject(Error('late scene failure'));f.gates.art.resolve();await flush();
  assert.equal(f.events.includes('exit'),true);
  assert.equal(f.events.includes('setup'),false);
  assert.equal(f.host.bootDiagnostics.forestPreload.status,'error');
  assert.equal(f.activeIntervals,0,'Exiting releases the progress animation');
});

test('silent cold downloads keep visible percentages moving and late real progress never reverses them',async t=>{
  const f=fixture(t);await flush();
  await f.advance(1500);
  const first=Math.floor(f.drawn.at(-1));
  assert.ok(first>0,'Progress animates before any package reports completion');
  for(let i=0;i<4;i++){
    const previous=Math.floor(f.drawn.at(-1));
    await f.advance(1000);
    assert.ok(Math.floor(f.drawn.at(-1))>previous,'An unreported download must still visibly advance');
  }
  f.host.bootStage('迟到的真实进度',1);
  await f.advance(1000);
  assert.ok(f.drawn.at(-1)>first);
  for(let i=1;i<f.drawn.length;i++){
    assert.ok(f.drawn[i]>=f.drawn[i-1],'Displayed progress is monotonic');
    assert.ok(f.drawn[i]-f.drawn[i-1]<=3.01,'Each paint advances smoothly');
  }
  assert.equal(f.events.includes('setup'),false,'Simulated progress cannot bypass package readiness');
  for(const gate of Object.values(f.gates))gate.resolve();
  await flush();await f.complete();
});

test('long waits stay below completion and startup cleans up the progress animation after revealing the scene',async t=>{
  const f=fixture(t);await flush();
  await f.advance(180000);
  assert.equal(Math.floor(f.drawn.at(-1)),99);
  assert.ok(f.drawn.every(value=>value<100),'Only a ready scene may show 100%');
  assert.equal(f.events.includes('reveal'),false);
  assert.equal(f.activeIntervals,1,'Animation remains active while loading');
  f.gates.play.resolve();f.gates.text.resolve();await flush();
  await f.advance(2000);
  assert.ok(f.drawn.every(value=>value<100),'Late, lower engine milestones cannot finish startup');
  assert.equal(f.events.includes('scene'),false);
  f.gates.world.resolve();f.gates.art.resolve();await flush();await f.complete();
  assert.equal(f.drawn.at(-1),100);
  assert.equal(f.activeIntervals,0);
  assert.equal(f.events.filter(event=>event==='dispose').length,1);
  const paintCount=f.drawn.length;
  await f.advance(2000);
  assert.equal(f.drawn.length,paintCount,'Completed startup does not leave a repaint timer behind');
});

test('a failed resource pauses animation while the retry dialog is open and retry resumes it',async t=>{
  const f=fixture(t);await flush();
  await f.advance(1000);
  f.gates.play.resolve();f.gates.text.reject(Error('text unavailable'));await flush();
  assert.equal(f.modals.length,1);
  const before=f.drawn.length;
  await f.advance(3000);
  assert.equal(f.drawn.length,before,'The error dialog freezes progress');
  f.gates.text=deferred();
  f.modals[0].success({confirm:true});await flush();
  const previous=f.drawn.at(-1);
  await f.advance(2000);
  assert.ok(f.drawn.at(-1)>previous,'Retry restarts visible progress');
  assert.equal(f.downloads.text,2,'Only the failed resource is retried');
  assert.equal(f.downloads.play,1);
  f.gates.text.resolve();f.gates.world.resolve();f.gates.art.resolve();
  await flush();await f.complete();
  assert.equal(f.activeIntervals,0);
});
