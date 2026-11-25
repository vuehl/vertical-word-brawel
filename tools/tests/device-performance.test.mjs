import test from 'node:test';
import assert from 'node:assert/strict';
import {DeviceFxThree as T,I as Group} from '../../source/src/vendor/three-DmSYIDKK.js';
import {createFacilityOutlineMask} from '../../source/src/effects/facility-outline-mask.js';

function fixture(t){
  const camera=new T.Camera(),outlinePass={enabled:true},depth={},draws=[];
  const enabled={value:false},mask={value:null},passes=[outlinePass];
  const composer={passes,stableDepthTexture:depth,
    addPass:(pass,index)=>passes.splice(index,0,pass),
    removePass:pass=>passes.splice(passes.indexOf(pass),1)};
  const effects=createFacilityOutlineMask({camera,composer,outlinePass,
    outline:{uniforms:new Map([['uHasDeviceMask',enabled],['uDeviceMask',mask]])}});
  t.after(()=>{if(passes.length>1)effects.dispose();});
  const world=new T.Scene(),facilities=new Group(),stand=new Group(),model=new Group();
  world.add(facilities);facilities.add(stand);stand.add(model);
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute([-.1,-.1,0,.1,-.1,0,0,.1,0],3));
  const mesh=new T.Mesh(geometry,new T.ShaderMaterial());model.add(mesh);effects.add(model);
  world.updateMatrixWorld();camera.updateMatrixWorld();
  const target={world:true};
  let current=target,colour=new T.Color(0x123456),alpha=.7;
  const renderer={getRenderTarget:()=>current,setRenderTarget:value=>{current=value;},
    getClearColor:out=>out.copy(colour),getClearAlpha:()=>alpha,
    setClearColor(value,a){colour.set(value);alpha=a;},clear(){},
    render(scene){draws.push({current,visible:scene.children.filter(child=>child.visible)});}};
  const render=(width=390,height=844)=>passes[0].render(renderer,{width,height});
  const state=()=>[current,colour.getHex(),alpha];
  return {mesh,model,facilities,world,composer,effects,enabled,mask,depth,passes,outlinePass,draws,renderer,render,state};
}

test('facility mask draws once before the outline with the existing scene depth and transforms',t=>{
  const f=fixture(t),before=f.state();
  assert.equal(f.passes[1],f.outlinePass);
  assert.equal(f.passes[0].needsSwap,false);
  f.render();
  assert.equal(f.draws.length,1);
  const [copy]=f.draws[0].visible;
  assert.ok(copy.matrix.equals(f.mesh.matrixWorld));
  assert.equal(copy.material.uniforms.sceneDepth.value,f.depth);
  assert.equal(f.enabled.value,true);
  assert.deepEqual(f.state(),before);
});

test('disabled outlines and unavailable depth skip the mask draw',t=>{
  const f=fixture(t);
  f.outlinePass.enabled=false;f.render();
  f.outlinePass.enabled=true;f.composer.stableDepthTexture=null;f.render();
  assert.equal(f.draws.length,0);
  assert.equal(f.enabled.value,false);
});

test('offstage and hidden facilities leave no active mask',t=>{
  const f=fixture(t);
  f.render();
  f.mesh.position.x=10;f.world.updateMatrixWorld();f.render();
  f.mesh.position.x=0;f.world.updateMatrixWorld();f.facilities.visible=false;f.render();
  assert.equal(f.draws.length,1);
  assert.equal(f.enabled.value,false);
});

test('the mask render target is reused at stable resolution and resized with the viewport',t=>{
  const f=fixture(t);f.render();
  const target=f.draws[0].current;
  let reallocations=0;
  target.addEventListener('dispose',()=>reallocations++);
  for(let frame=0;frame<60;frame++)f.render();
  assert.equal(reallocations,0);
  f.render(195,422);
  assert.equal(f.draws.at(-1).current,target);
  assert.equal(reallocations,1);
  assert.deepEqual([target.width,target.height],[195,422]);
});

test('removing a facility releases its copy and disposing removes the pass and target',t=>{
  const f=fixture(t);f.render();
  const target=f.draws[0].current,material=f.draws[0].visible[0].material;
  let releases=0;
  target.addEventListener('dispose',()=>releases++);
  material.addEventListener('dispose',()=>releases++);
  f.effects.remove(f.model);f.render();
  assert.equal(f.draws.length,1);
  f.effects.dispose();
  assert.equal(releases,2);
  assert.deepEqual(f.passes,[f.outlinePass]);
  assert.equal(f.mask.value,null);
});

test('a failed mask draw restores renderer state and leaves the mask disabled',t=>{
  const f=fixture(t),before=f.state();
  f.renderer.render=()=>{throw Error('render failed');};
  assert.throws(()=>f.render(),/render failed/);
  assert.deepEqual(f.state(),before);
  assert.equal(f.enabled.value,false);
});
