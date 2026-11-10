import test from 'node:test';
import assert from 'node:assert/strict';
import {CrowdGrid} from '../source/src/crowd-grid.js';
import {updateCrowdBudget,compactDistantEnemies} from '../source/src/crowd-budget.js';
import {ParticleBudget,accumulateDamage,flushDamage,applyCrowdEffects} from '../source/src/effect-budget.js';
import {createMutationTargets} from '../platform/mutation-targets.mjs';
import {parseHTML} from 'linkedom/worker';
import {crowdStep,separationBudget} from '../source/src/crowd-cadence.js';
import {performanceProfiles} from '../source/src/performance-profile.js';

test('high quality preserves all decorations under crowd pressure; other presets retain their caps',()=>{
  const vfx={add:{n:2400},norm:{n:1600},text:{items:Array(160).fill(1)},particleBudget:{},rings:{n:200},ground:{n:250},projectiles:{n:400}};
  applyCrowdEffects(vfx,performanceProfiles.high,600);
  assert.deepEqual([vfx.add.n,vfx.norm.n,vfx.text.items.length,vfx.particleBudget.limit],[2400,1600,160,24]);
  assert.deepEqual([vfx.rings.n,vfx.ground.n,vfx.projectiles.n],[200,250,400]);
  applyCrowdEffects(vfx,performanceProfiles.high,100);
  assert.deepEqual([vfx.add.limit,vfx.norm.limit,vfx.text.limit],[3000,1800,160]);
  applyCrowdEffects(vfx,performanceProfiles.medium,600);
  assert.deepEqual([vfx.add.limit,vfx.norm.limit,vfx.text.limit],[600,300,48]);
  applyCrowdEffects(vfx,performanceProfiles.low,1000);
  assert.deepEqual([vfx.add.limit,vfx.norm.limit,vfx.text.limit],[320,180,24]);
});

test('high quality never reduces enemy density at sustained low FPS',()=>{
  const run={performance:performanceProfiles.high,state:'play',timeScale:1,fpsCap:60,enemies:{count:420,n:0},liveCap:420,liveMax:420,liveMin:120};
  for(let t=0;t<30000;t+=100)updateCrowdBudget(run,t);
  assert.equal(run.liveCap,420);assert.equal(run.crowdSample,null);
});

test('crowd cadence keeps contact immediate and accounts for every elapsed simulation step',()=>{
  for(const profile of Object.values(performanceProfiles)){
    assert.equal(crowdStep(35,.6,1000,profile),1);
    assert.equal(crowdStep(48,4,1000,profile),1);
    assert.equal(crowdStep(100,.6,179,profile),1);
    assert.equal(crowdStep(100,.6,180,profile),2);
    for(const distance of [4,10,18,30])for(const fps of [30,60]){
      let pending=0,simulated=0;const step=crowdStep(distance*distance,.6,600,profile);
      for(let frame=1;frame<=fps*5;frame++){
        pending+=1/fps;
        if(frame%step!==0&&pending<.08&&step>1)continue;
        simulated+=pending;pending=0;
      }
      assert.ok(Math.abs(simulated+pending-5)<1e-10);
      assert.ok(pending<.08);
    }
    assert.ok(separationBudget(600,profile.enemySeparation)<=24);
    assert.equal(separationBudget(50,profile.enemySeparation),profile.enemySeparation);
  }
});

test('direct hit queries match the former two-pass query with live movement, large bodies, deaths and slot reuse',()=>{
  const count=1000,grid=new CrowdGrid(count),e={n:count};
  for(const key of ['x','z','radius','alive','dying'])e[key]=new Float32Array(count);
  let seed=721;const random=()=>((seed=Math.imul(seed,1664525)+1013904223|0)>>>0)/4294967296;
  for(let round=0;round<5;round++){
    for(let id=0;id<count;id++){e.x[id]=(random()-.5)*430;e.z[id]=(random()-.5)*430;e.radius[id]=.45+random()*3.55;e.alive[id]=random()>.2;e.dying[id]=random()<.1?.2:0;}
    grid.build(count,e.x,e.z,e.alive,e.radius,e.dying);
    // The index is a snapshot, but hits must read current actor positions/state.
    for(let id=0;id<count;id++){e.x[id]+=random()-.5;e.z[id]+=random()-.5;if(id%17===0)e.alive[id]=0;}
    for(let query=0;query<200;query++){
      const x=(random()-.5)*450,z=(random()-.5)*450,r=random()*50,out=[];
      const n=grid.query(x,z,r+4),expected=[...grid.result.slice(0,n)].filter(id=>e.alive[id]&&e.dying[id]<=0&&(e.x[id]-x)**2+(e.z[id]-z)**2<=(r+e.radius[id])**2);
      assert.deepEqual(grid.within(x,z,r,e,out),expected);
      const saved=[...out];grid.within(0,0,400,e,[]);assert.deepEqual(out,saved,'Nested queries must not overwrite outer targets');
    }
  }
});

test('native mutation targets follow text replacement and removals, including hidden HUD nodes',()=>{
  const {document,MutationObserver}=parseHTML('<html><body><section><div id="tile"><b>1</b></div><div data-ui-hidden="true"><i>old</i></div></section></body></html>');
  const target=createMutationTargets(document.documentElement),observer=new MutationObserver(()=>{});
  observer.observe(document.documentElement,{subtree:true,childList:true});
  const tile=document.querySelector('#tile'),label=tile.firstChild,hidden=document.querySelector('i');
  label.textContent='100';assert.ok(observer.takeRecords().every(record=>target(record)===label));
  hidden.textContent='new';assert.ok(observer.takeRecords().every(record=>target(record)===hidden));
  label.remove();assert.ok(observer.takeRecords().every(record=>target(record)===tile));
  const parent=tile.parentNode;tile.remove();assert.ok(observer.takeRecords().every(record=>target(record)===parent));
  observer.disconnect();
});

test('occupied grid queries preserve every actor and ordering across movement, death and map edges',()=>{
  const grid=new CrowdGrid(600),x=new Float32Array(600),z=x.slice(),r=x.slice().fill(.6),dying=x.slice(),alive=new Uint8Array(600);
  for(let phase=0;phase<5;phase++){
    for(let i=0;i<600;i++){
      x[i]=phase===0?Math.sin(i)*8:phase===1?Math.sin(i)*250:100+Math.sin(i)*5;
      z[i]=phase===0?Math.cos(i)*8:phase===1?Math.cos(i)*250:-100+Math.cos(i)*5;
      alive[i]=phase===4?0:+(i%7!==phase);dying[i]=i%11===0?1:0;
    }
    grid.build(600,x,z,alive,r,dying);
    if(phase===0)assert.ok(grid.buildCells<100);
    if(phase===4)assert.equal(grid.buildCells,0);
    for(const [cx,cz,reach] of [[0,0,400],[0,0,20],[100,-100,7],[-210,210,25],[900,900,1]]){
      const left=Math.max(0,Math.floor((cx-reach+210)/3)+1),right=Math.min(141,Math.floor((cx+reach+210)/3)+1);
      const top=Math.max(0,Math.floor((cz-reach+210)/3)+1),bottom=Math.min(141,Math.floor((cz+reach+210)/3)+1);
      const expected=[];
      for(let i=0;i<600;i++)if(alive[i]){const key=grid.key(x[i],z[i]),col=key%142,row=Math.floor(key/142);if(col>=left&&col<=right&&row>=top&&row<=bottom)expected.push(i);}
      expected.sort((a,b)=>grid.key(x[a],z[a])-grid.key(x[b],z[b])||a-b);
      assert.deepEqual([...grid.result.slice(0,grid.query(cx,cz,reach))],expected);
    }
  }
});

test('crowd governor reacts below 500 entities using real time, recovers slowly and respects 30 FPS',()=>{
  const run={state:'play',timeScale:1,fpsCap:60,enemies:{count:100,n:0},player:{pos:{x:0,z:0}},liveCap:180,liveMax:180,liveMin:60};
  for(let t=0;t<=4100;t+=50)updateCrowdBudget(run,t);
  assert.equal(run.crowdFps,20);assert.equal(run.liveCap,60);
  run.enemies.count=50;
  for(let t=4150;t<=8500;t+=1000/60)updateCrowdBudget(run,t);
  assert.equal(run.liveCap,60,'Recovery must not oscillate immediately');
  run.state='paused';updateCrowdBudget(run,9000);run.state='play';
  run.fpsCap=30;run.liveCap=180;
  for(let t=20000;t<25000;t+=1000/30)updateCrowdBudget(run,t);
  assert.equal(run.liveCap,180,'Selected 30 FPS is healthy');
});

test('distant compaction preserves HP, XP, population and specials without paying rewards',()=>{
  const e={n:8,count:8,mass:8,isAlive(i){return !!this.alive[i];},kill(i){this.alive[i]=0;this.count--;this.mass-=this.wt[i];}};
  for(const key of ['x','y','z','hgt','radius','hp','maxHp','xp','shield','wt','species','flags','alive','burn'])e[key]=new Float64Array(8);
  e.x.fill(90);e.hp.fill(5);e.maxHp.fill(10);e.xp.fill(3);e.wt.fill(1);e.species.fill(16);e.alive.fill(1);e.radius.fill(.6);
  e.flags[3]=4;e.burn[4]=1;e.x[5]=2;
  const run={enemies:e,player:{pos:{x:0,z:0}},sprites:{visible:x=>x<24},lockTarget:6,focusIdx:7};
  const totals=()=>['hp','maxHp','xp','wt'].map(key=>e[key].reduce((sum,v,i)=>sum+(e.alive[i]?v:0),0));
  const before=totals();assert.equal(compactDistantEnemies(run,1),2);assert.deepEqual(totals(),before);assert.equal(e.mass,8);
  for(const id of [3,4,5,6,7])assert.equal(e.alive[id],1);
});

test('decorative particle limits are spatial and reset; damage texts sum only compatible hits',()=>{
  const budget=new ParticleBudget(4);
  assert.equal(budget.remaining(0,0),4);assert.ok(budget.allow(0,0));assert.equal(budget.remaining(0,0),3);budget.next();
  assert.equal(Array.from({length:100},()=>budget.allow(0,0)).filter(Boolean).length,4);
  assert.equal(budget.remaining(0,0),0);assert.equal(budget.remaining(20,20),4);
  assert.equal(budget.allow(20,20),true);budget.next();assert.equal(budget.allow(0,0),true);
  const emitted=[],vfx={enabledText:true,text:{limit:24},number(...args){emitted.push(args);}};
  for(let i=0;i<100;i++)accumulateDamage(vfx,1,0,0,0,5,0xffffff,false);
  accumulateDamage(vfx,2,0,0,0,7,0xffffff,false);accumulateDamage(vfx,1,0,0,0,11,0xffffff,true);
  flushDamage(vfx,.1);assert.equal(emitted.length,0);flushDamage(vfx,.02);
  assert.deepEqual(emitted.map(v=>v[3]),[500,7,11]);assert.equal(vfx.damagePending.size,0);
});
