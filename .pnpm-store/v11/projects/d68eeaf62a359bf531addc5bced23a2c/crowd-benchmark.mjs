import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {CrowdGrid} from '../source/src/crowd-grid.js';
import {separationBudget} from '../source/src/crowd-cadence.js';
const dir=process.env.POKEBONK_QA||'验收/五分钟怪群优化-20261109';fs.mkdirSync(dir,{recursive:true});
const report={note:'Identical stationary actors/queries. Node CPU benchmark; not phone FPS.',samples:[]};
for(const count of [200,600,1000]){
  const grid=new CrowdGrid(count),e={};
  for(const key of ['x','z','radius','alive','dying'])e[key]=new Float32Array(count);
  for(let i=0;i<count;i++){const a=i*2.39996,r=2+Math.sqrt(i/count)*10;e.x[i]=Math.cos(a)*r;e.z[i]=Math.sin(a)*r;e.radius[i]=i%31===0?4:.6;e.alive[i]=1;e.dying[i]=i%37===0?.2:0;}
  grid.build(count,e.x,e.z,e.alive,e.radius,e.dying);
  const output=[];
  function reference(x,z,r){output.length=0;const n=grid.query(x,z,r+4);for(let k=0;k<n;k++){const id=grid.result[k];if(!e.alive[id]||e.dying[id]>0)continue;const dx=e.x[id]-x,dz=e.z[id]-z,rr=r+e.radius[id];if(dx*dx+dz*dz<=rr*rr)output.push(id);}return output;}
  const queries=Array.from({length:1000},(_,i)=>[Math.cos(i)*8,Math.sin(i)*8,[.5,2,6,14][i%4]]);
  for(const [x,z,r] of queries){const expected=[...reference(x,z,r)];assert.deepEqual(grid.within(x,z,r,e,output),expected);}
  const time=fn=>{let sum=0;const start=performance.now();for(let pass=0;pass<10;pass++)for(const [x,z,r] of queries)sum+=fn(x,z,r).length;return {ms:performance.now()-start,sum};};
  const direct=(x,z,r)=>grid.within(x,z,r,e,output);
  time(reference);time(direct);const before=[],after=[];
  for(let trial=0;trial<5;trial++){const a=time(reference),b=time(direct);assert.equal(a.sum,b.sum);before.push(a.ms);after.push(b.ms);}
  const separation={};for(const base of [64,128]){
    const visits=budget=>{grid.separationVisits=0;grid.separationTurns.fill(0);for(let i=0;i<count;i++)grid.separate(i,e.x[i],e.z[i],e.radius[i],budget);return grid.separationVisits;};
    separation[base]={before:visits(base),after:visits(separationBudget(count,base))};
  }
  const median=a=>a.sort((a,b)=>a-b)[2];report.samples.push({count,queryCount:10000,beforeMs:median(before),afterMs:median(after),separation});
}
fs.writeFileSync(path.join(dir,'crowd-benchmark.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
