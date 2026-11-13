import test from 'node:test';
import assert from 'node:assert/strict';
import {performanceProfile} from '../source/src/performance-profile.js';
import {paperBox,hitsPaperBox,resolvePaperBox} from '../source/src/paper-collision.js';
import {updatePaperVisibility} from '../source/src/paper-visibility.js';
import {separateCrowd} from '../source/src/crowd-separation.js';
import {FramePacer} from '../source/src/frame-pacing.js';
import {warmCombatShaders} from '../source/src/combat-warmup.js';
import {readRuntimeInfo} from '../platform/device.mjs';

test('frame pacing retains 60 callbacks per second under alternating 5 ms delays',()=>{
  const pacer=new FramePacer();let drawn=0;
  for(let frame=0;frame<600;frame++)drawn+=+pacer.ready(frame*1000/60+(frame%2?5:0),1000/60);
  assert.equal(drawn,600);
  pacer.reset();drawn=0;
  for(let frame=0;frame<600;frame++)drawn+=+pacer.ready(frame*1000/60+(frame%2?5:0),1000/30);
  assert.equal(drawn,300);
});

test('frame pacing respects 30/60 caps, recovers from stalls and never accumulates forced draws',()=>{
  for(const cap of [30,60])for(const hz of [60,90,120,144]){
    const pacer=new FramePacer();let drawn=0;
    for(let i=0;i<hz*10;i++)drawn+=+pacer.ready(i*1000/hz,1000/cap);
    assert.equal(drawn,cap*10);
    assert.equal(pacer.ready(20000,1000/cap),true);
    assert.ok(pacer.next>20000&&pacer.next<=20000+1000/cap+.001);
    assert.equal(pacer.ready(20001,1000/cap),false);
    for(let t=20002;t<20100;t++)assert.equal(pacer.ready(t,1000/cap,true),true);
    assert.ok(pacer.next<=20100+1000/cap);
    assert.equal(pacer.ready(20100,1000/(cap===30?60:30)),true);
    assert.equal(pacer.ready(20101,0),true);
  }
});

test('combat warmup uses the scene target and restores it before async work and errors',async()=>{
  const screen={},world={},scene={},camera={};let target=screen,finish;
  const graphics={scene,camera,composer:{inputBuffer:world},renderer:{
    getRenderTarget:()=>target,setRenderTarget:value=>target=value,
    compileAsync(s,c){assert.equal(target,world);assert.equal(s,scene);assert.equal(c,camera);return new Promise(resolve=>finish=resolve);}}};
  const pending=warmCombatShaders(graphics);assert.equal(target,screen);finish();await pending;
  graphics.renderer.compileAsync=()=>{throw Error('compile');};
  await assert.rejects(warmCombatShaders(graphics),/compile/);assert.equal(target,screen);
});

test('iOS diagnostics distinguish actual mode, unavailable flags and configured quality',()=>{
  const api={getDeviceInfo:()=>({platform:'iOS',model:'phone',system:'iOS'}),getAppBaseInfo:()=>({version:'8',SDKVersion:'3'})};
  assert.equal(readRuntimeInfo(api).highPerformance,null);
  assert.equal(readRuntimeInfo(api,{isIOSHighPerformanceMode:false}).highPerformance,false);
  const result=readRuntimeInfo(api,{isIOSHighPerformanceMode:true,isIOSHighPerformanceModePlus:true});
  assert.equal(result.highPerformance,true);assert.equal(result.highPerformancePlus,true);
  assert.equal(result.platform,'ios');assert.equal(result.model,'phone');assert.equal(result.wechatVersion,'8');
  assert.equal(readRuntimeInfo({getDeviceInfo(){throw Error();},getSystemInfoSync:()=>({platform:'android'})}).platform,'android');
});

function crowdFixture(count){
  const dim=142,cell=3,rows=Array.from({length:dim*dim},()=>[]);
  for(let id=0;id<count;id++){
    const x=-.8+Math.cos(id*2.4)*(id%19)/10,z=.7+Math.sin(id*2.4)*(id%17)/10;
    rows[(Math.floor((z+210)/cell)+1)*dim+Math.floor((x+210)/cell)+1].push({id,x,z,radius:id%23===0?NaN:.6});
  }
  const actors=rows.flat(),starts=new Int32Array(dim*dim+1);let index=0;
  for(let row=0;row<rows.length;row++){starts[row]=index;index+=rows[row].length;}starts[rows.length]=index;
  return {dim,cell,starts,separationTurns:new Uint32Array(count),items:actors.map(a=>a.id),px:actors.map(a=>a.x),pz:actors.map(a=>a.z),pr:actors.map(a=>a.radius)};
}

test('sparse crowd steering remains exact, including dying actors and self exclusion',()=>{
  const grid=crowdFixture(28),id=3,x=grid.px[grid.items.indexOf(id)],z=grid.pz[grid.items.indexOf(id)];
  let sx=0,sz=0;
  for(let i=0;i<grid.items.length;i++){
    const dx=x-grid.px[i],dz=z-grid.pz[i],distance=Math.hypot(dx,dz),radius=.6+grid.pr[i];
    if(grid.items[i]!==id&&distance>Math.sqrt(1e-5)&&distance<radius){sx+=dx/distance*(radius-distance)/radius;sz+=dz/distance*(radius-distance)/radius;}
  }
  separateCrowd(grid,id,x,z,.6,64);
  assert.ok(Math.abs(grid.sepX-sx)<1e-12&&Math.abs(grid.sepZ-sz)<1e-12);
  assert.equal(grid.separationVisits,grid.separationCandidates);
});

test('dense crowd steering bounds work and rotates through every candidate without directional bias',()=>{
  const grid=crowdFixture(800),id=3,x=-.4,z=.6;
  separateCrowd(grid,id,x,z,.6,Infinity);const exact=[grid.sepX,grid.sepZ],count=grid.separationCandidates;
  const phases=Math.ceil(count/64);let sx=0,sz=0;grid.separationTurns[id]=0;
  for(let phase=0;phase<phases;phase++){
    grid.separationVisits=0;
    separateCrowd(grid,id,x,z,.6,64);
    assert.ok(grid.separationVisits<=64);sx+=grid.sepX;sz+=grid.sepZ;
  }
  assert.ok(Math.abs(sx/phases-exact[0])<1e-10&&Math.abs(sz/phases-exact[1])<1e-10);
});

test('performance presets preserve the selected quality when leaving battery saver',()=>{
  const settings={quality:'high',batterySaver:false,touchScale:.85};
  const high=performanceProfile(settings);settings.batterySaver=true;
  const saver=performanceProfile(settings);settings.batterySaver=false;
  assert.equal(performanceProfile(settings),high);assert.equal(settings.touchScale,.85);
  assert.equal(saver.bloom,false);assert.equal(saver.outline,false);
  assert.ok(high.pixelBudget>saver.pixelBudget&&high.maxPixelRatio>saver.maxPixelRatio);
  assert.equal(performanceProfile(),high);
});
test('rotated stationery blocks its footprint, permits rounded corner clearance and resolves embedded actors',()=>{
  for(const angle of [0,.4,Math.PI/2,-.7]){
    const box=paperBox(27,-12,6,12,3,angle);
    const world=(x,z)=>({x:box.x+box.cos*x+box.sin*z,z:box.z-box.sin*x+box.cos*z});
    for(const [x,z,hit] of [[0,0,true],[3.3,0,true],[3.8,0,false],[3.4,6.4,false],[2.9,5.9,true]]){
      const p=world(x,z);assert.equal(hitsPaperBox(box,p.x,p.z,.5),hit);
      const before={...p};resolvePaperBox(box,p,.5);
      assert.ok(!hitsPaperBox(box,p.x,p.z,.5),'Resolved circle stays outside rotated box');
      if(!hit){assert.equal(p.x,before.x);assert.equal(p.z,before.z);}
    }
  }
});
test('camera culling restores immutable instance transforms and leaves unchanged GPU buffers alone',()=>{
  const matrices=new Float32Array(48);for(let i=0;i<3;i++){matrices[i*16]=matrices[i*16+5]=matrices[i*16+10]=matrices[i*16+15]=1;matrices[i*16+12]=i*50;}
  let uploads=0;
  const attribute={array:matrices.slice(),clearUpdateRanges(){},addUpdateRange(){},set needsUpdate(v){if(v)uploads++;}};
  const mesh={count:3,visible:true,instanceMatrix:attribute,userData:{paperInstances:{total:3,matrices,bounds:new Float32Array([0,0,0,1,50,0,0,1,100,0,0,1]),selected:new Int32Array(3).fill(-1),shadow:false}}};
  const terrain={zxPaper:true,group:{children:[mesh]}};
  const frustum=(left,right)=>({planes:[{normal:{x:1,y:0,z:0},constant:-left},{normal:{x:-1,y:0,z:0},constant:right}]});
  updatePaperVisibility(terrain,frustum(-10,10));assert.equal(mesh.count,1);assert.equal(attribute.array[12],0);
  const before=uploads;updatePaperVisibility(terrain,frustum(-10,10));assert.equal(uploads,before);
  updatePaperVisibility(terrain,frustum(40,110));assert.equal(mesh.count,2);assert.equal(attribute.array[12],50);assert.equal(attribute.array[28],100);
  updatePaperVisibility(terrain,frustum(-10,110));assert.equal(mesh.count,3);assert.deepEqual(attribute.array,matrices);
  mesh.userData.paperInstances.shadow=true;updatePaperVisibility(terrain,frustum(-10,110),false);assert.equal(mesh.visible,false);
  updatePaperVisibility(terrain,frustum(-10,110),true);assert.equal(mesh.visible,true);
  updatePaperVisibility(terrain,frustum(200,210));assert.equal(mesh.visible,false);
});

test('merged stationery keeps each color attached to its transform across camera changes',()=>{
  const matrices=new Float32Array(48),colors=new Float32Array([1,0,0,0,1,0,0,0,1]);
  for(let i=0;i<3;i++){matrices[i*16]=matrices[i*16+5]=matrices[i*16+10]=matrices[i*16+15]=1;matrices[i*16+12]=i*50;}
  const attr=array=>({array:array.slice(),uploads:0,ranges:[],clearUpdateRanges(){this.ranges=[];},addUpdateRange(start,count){this.ranges.push([start,count]);},set needsUpdate(v){if(v)this.uploads++;}});
  const mesh={instanceMatrix:attr(matrices),instanceColor:attr(colors),userData:{paperInstances:{total:3,matrices,colors,bounds:new Float32Array([0,0,0,1,50,0,0,1,100,0,0,1]),selected:new Int32Array(3).fill(-1)}}};
  const terrain={zxPaper:true,group:{children:[mesh]}};
  const view=(left,right)=>({planes:[{normal:{x:1,y:0,z:0},constant:-left},{normal:{x:-1,y:0,z:0},constant:right}]});
  for(const [left,right,ids] of [[40,110,[1,2]],[90,110,[2]],[-10,10,[0]],[-10,110,[0,1,2]]]){
    updatePaperVisibility(terrain,view(left,right));assert.equal(mesh.count,ids.length);
    for(let i=0;i<ids.length;i++){
      assert.equal(mesh.instanceMatrix.array[i*16+12],ids[i]*50);
      assert.deepEqual(mesh.instanceColor.array.slice(i*3,i*3+3),colors.slice(ids[i]*3,ids[i]*3+3));
    }
    assert.deepEqual(mesh.instanceColor.ranges,[[0,ids.length*3]]);
    const before=mesh.instanceColor.uploads;updatePaperVisibility(terrain,view(left,right));assert.equal(mesh.instanceColor.uploads,before);
  }
});
