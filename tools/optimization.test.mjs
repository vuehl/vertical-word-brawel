import test from 'node:test';
import assert from 'node:assert/strict';
import {CrowdGrid} from '../source/src/crowd-grid.js';
import {updateCrowdBudget,compactDistantEnemies} from '../source/src/crowd-budget.js';
import {ParticleBudget,accumulateDamage,flushDamage} from '../source/src/effect-budget.js';
import {createMutationTargets} from '../platform/mutation-targets.mjs';
import {parseHTML} from 'linkedom/worker';

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
  assert.equal(Array.from({length:100},()=>budget.allow(0,0)).filter(Boolean).length,4);
  assert.equal(budget.allow(20,20),true);budget.next();assert.equal(budget.allow(0,0),true);
  const emitted=[],vfx={enabledText:true,text:{limit:24},number(...args){emitted.push(args);}};
  for(let i=0;i<100;i++)accumulateDamage(vfx,1,0,0,0,5,0xffffff,false);
  accumulateDamage(vfx,2,0,0,0,7,0xffffff,false);accumulateDamage(vfx,1,0,0,0,11,0xffffff,true);
  flushDamage(vfx,.1);assert.equal(emitted.length,0);flushDamage(vfx,.02);
  assert.deepEqual(emitted.map(v=>v[3]),[500,7,11]);assert.equal(vfx.damagePending.size,0);
});
