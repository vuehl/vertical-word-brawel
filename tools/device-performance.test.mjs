import test from 'node:test';
import assert from 'node:assert/strict';
import {DeviceFxThree as T} from '../source/public/assets/three-DmSYIDKK.js';
import {createDeviceScreenFx} from '../source/src/DeviceScreenFx.mjs';

function fixture(width=390,height=844){
  const scene=new T.Scene(),camera=new T.Camera(),draws=[];
  camera.near=.1;camera.far=100;camera.isOrthographicCamera=true;
  let target=null;
  const renderer={autoClear:true,getRenderTarget:()=>target,setRenderTarget:t=>{target=t;},
    getScissorTest:()=>false,setScissorTest(){},getScissor:v=>v.set(0,0,width,height),
    getViewport:v=>v.set(0,0,width,height),setScissor(){},setViewport(){},
    getClearColor:v=>v.set(0),getClearAlpha:()=>1,setClearColor(){},clear(){},
    getDrawingBufferSize:v=>v.set(width,height),render(s,c){s.updateMatrixWorld();draws.push(s);}};
  const fx=createDeviceScreenFx(T,renderer);
  function device(x,y){
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute([-.1,-.1,0,.1,-.1,0,.1,.1,0,-.1,.1,0],3));
    geo.setIndex([0,1,2,0,2,3]);
    const mesh=new T.Mesh(geo,new T.ShaderMaterial());mesh.position.set(x,y,-.5);
    mesh.userData.deviceScreenFx={version:2,supportXYZ:Array.from(geo.attributes.position.array),centerXYZ:[0,0,0]};
    scene.add(mesh);fx.add(mesh);return mesh;
  }
  const left=device(-.7,-.65),right=device(.7,.65);
  scene.updateMatrixWorld();camera.updateWorldMatrix(true,false);
  const source={width,height,texture:{},depthTexture:{}};
  const composite=options=>fx.composite(scene,camera,0,source,null,{matricesUpdated:true,...options});
  const tiles=()=>draws.find(s=>s.children[0]?.material?.uniforms.outlineTiles).children[0].material.uniforms.outlineTiles.value;
  return {scene,camera,fx,left,right,source,renderer,composite,tiles};
}

test('device compositor reuses scene matrices but standalone callers still update them',()=>{
  const f=fixture();let updates=0;
  const update=f.scene.updateMatrixWorld.bind(f.scene);
  f.scene.updateMatrixWorld=(...args)=>{updates++;return update(...args);};
  f.composite();assert.equal(updates,0,'Postprocessing must not walk the entire world again');
  f.composite({matricesUpdated:false});assert.equal(updates,1);
  updates=0;f.fx.render(f.scene,f.camera,0);
  assert.equal(updates,1,'Combined render/composite updates the world only for the beauty render');
  f.fx.dispose();
});

test('outline coverage skips empty gaps without clipping device edges at different resolutions',()=>{
  for(const [w,h,radius] of [[390,844,6],[780,1688,6],[160,320,20]]){
    const f=fixture(w,h);f.left.position.x=-1.05;
    f.scene.updateMatrixWorld();f.composite({originalOutlineRadiusPx:radius*2});
    const tex=f.tiles(),{data,width:side}=tex.image;
    const covered=(u,v)=>data[Math.min(side-1,Math.floor(v*side))*side+Math.min(side-1,Math.floor(u*side))]>0;
    assert.equal(covered(.5,.5),false,'A large union rectangle must not shade the gap between devices');
    assert.ok(data.filter(Boolean).length<data.length*.25,'Sparse devices need only a small fraction of outline searches');
    // Probe the actual projected silhouette and every direction on its outline,
    // including a partially offscreen device and radii wider than one tile.
    for(const mesh of [f.left,f.right])for(let i=0;i<=10;i++)for(let j=0;j<=10;j++){
      const u=(mesh.position.x-.1+i*.02+1)/2,v=(mesh.position.y-.1+j*.02+1)/2;
      for(let angle=0;angle<Math.PI*2;angle+=Math.PI/8){
        const x=u+radius*Math.cos(angle)/w,y=v+radius*Math.sin(angle)/h;
        if(x>=0&&x<1&&y>=0&&y<1)assert.ok(covered(x,y),'Device or outline was rejected');
      }
    }
    f.fx.dispose();
  }
});

test('coverage uploads only when visible device regions change and releases its texture',()=>{
  const f=fixture();f.composite();const tex=f.tiles(),version=tex.version;
  for(let frame=0;frame<60;frame++)f.composite();
  assert.equal(tex.version,version,'Stable camera/device placement must not upload tiles each frame');
  f.left.position.set(0,0,-.5);f.scene.updateMatrixWorld();f.composite();
  assert.equal(tex.version,version+1);
  f.left.visible=f.right.visible=false;f.composite();
  assert.equal(tex.image.data.some(Boolean),false,'Removed devices must not leave stale coverage');
  let disposed=false;tex.addEventListener('dispose',()=>{disposed=true;});f.fx.dispose();assert.ok(disposed);
});

test('entry warms hidden mask geometry variants and stars in their actual output colour space',async()=>{
  const f=fixture(),compiles=[],uploads=[],finish=[],output={width:585,height:1266},previous={loading:true};
  f.right.geometry.computeVertexNormals();f.right.visible=false;
  f.renderer.setRenderTarget(previous);
  f.renderer.compileAsync=(scene,camera)=>{
    compiles.push({scene,camera,target:f.renderer.getRenderTarget()});
    return new Promise(resolve=>finish.push(resolve));
  };
  f.renderer.initTexture=tex=>uploads.push(tex);
  const prepared=f.fx.prepare(f.camera,output);
  assert.equal(f.renderer.getRenderTarget(),previous,'Loading draws must not inherit a bound world target');
  assert.equal(compiles.length,3);
  assert.equal(compiles[0].camera,f.camera);
  assert.equal(compiles[0].target.width,585);assert.equal(compiles[0].target.height,1266);
  assert.deepEqual(compiles[0].scene.children.map(mesh=>!!mesh.geometry.attributes.normal),[false,true]);
  for(const entry of compiles.slice(1)){
    assert.equal(entry.target,output,'Screen effects must use the same output colour space as live composition');
    assert.notEqual(entry.camera,f.camera);
  }
  const star=compiles[2].scene.children[0];
  for(const name of ['position','spriteFrame','anchorUv','starData'])assert.ok(star.geometry.attributes[name]?.count>=6);
  assert.equal(uploads.length,2,'Opacity and outline tile textures upload during loading');
  finish.forEach(resolve=>resolve());await prepared;
  assert.equal(f.right.visible,false);assert.equal(f.renderer.getRenderTarget(),previous);
  f.fx.dispose();
});

test('failed shader preparation restores the loading target',async()=>{
  const f=fixture(),previous={loading:true};f.renderer.setRenderTarget(previous);
  f.renderer.compileAsync=()=>{throw Error('compile failed');};
  await assert.rejects(f.fx.prepare(f.camera,{width:100,height:200}),/compile failed/);
  assert.equal(f.renderer.getRenderTarget(),previous);f.fx.dispose();
});
