import test from 'node:test';
import assert from 'node:assert/strict';
import {performanceProfile} from '../source/src/performance-profile.js';
import {paperBox,hitsPaperBox,resolvePaperBox} from '../source/src/paper-collision.js';
import {updatePaperVisibility} from '../source/src/paper-visibility.js';

test('performance presets preserve the selected quality when leaving battery saver',()=>{
  const settings={quality:'high',batterySaver:false,touchScale:.85};
  const high=performanceProfile(settings);settings.batterySaver=true;
  const saver=performanceProfile(settings);settings.batterySaver=false;
  assert.equal(performanceProfile(settings),high);assert.equal(settings.touchScale,.85);
  assert.equal(saver.bloom,false);assert.equal(saver.outline,false);
  assert.ok(high.pixelBudget>saver.pixelBudget&&high.maxPixelRatio>saver.maxPixelRatio);
  assert.equal(performanceProfile().name,'流畅');
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
