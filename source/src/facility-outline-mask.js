import {DeviceFxThree as T,F as Frustum,lt as Sphere,PostprocessingPass as Pass} from '../assets/three-DmSYIDKK.js';

// The world ink pass reads depth edges. Keep the artist's own contours on
// facilities without adding a colour effect or rendering off-screen objects.
export function createFacilityOutlineMask(host){
  const scene=new T.Scene(),copies=new Map(),frustum=new Frustum(),sphere=new Sphere(),matrix=new T.Matrix4();
  const depth={value:null},size={value:new T.Vector2()};
  const material=new T.ShaderMaterial({uniforms:{sceneDepth:depth,viewport:size},
    vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform sampler2D sceneDepth;uniform vec2 viewport;
    void main(){if(gl_FragCoord.z>texture2D(sceneDepth,gl_FragCoord.xy/viewport).r+.00005)discard;
    gl_FragColor=vec4(1.);}`,side:T.DoubleSide,depthTest:false,depthWrite:false});
  const target=new T.WebGLRenderTarget(1,1,{minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:false});
  const pass=new Pass('Facility outline exclusion',null,null),clearColour=new T.Color();
  const enabled=host.outline.uniforms.get('uHasDeviceMask'),mask=host.outline.uniforms.get('uDeviceMask');
  mask.value=target.texture;
  pass.needsSwap=false;
  pass.needsDepthTexture=true;
  pass.render=(renderer,input)=>{
    enabled.value=false;
    if(!host.outlinePass.enabled)return;
    const camera=host.camera;
    frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    let visible=false;
    for(const [root,pairs] of copies){
      const active=root.visible&&root.parent?.visible&&root.parent.parent?.visible;
      for(const [mesh,copy] of pairs){
        copy.visible=active&&mesh.visible&&camera.layers.test(mesh.layers)&&
          frustum.intersectsSphere(sphere.copy(mesh.geometry.boundingSphere).applyMatrix4(mesh.matrixWorld));
        if(copy.visible){copy.matrix.copy(mesh.matrixWorld);copy.matrixWorldNeedsUpdate=true;visible=true;}
      }
    }
    if(!visible)return;
    target.setSize(input.width,input.height);size.value.set(input.width,input.height);
    depth.value=host.composer.stableDepthTexture;
    const previous=renderer.getRenderTarget(),alpha=renderer.getClearAlpha();
    renderer.getClearColor(clearColour);
    renderer.setRenderTarget(target);renderer.setClearColor(0,0);renderer.clear();renderer.render(scene,camera);
    renderer.setRenderTarget(previous);renderer.setClearColor(clearColour,alpha);
    enabled.value=true;
  };
  host.composer.addPass(pass,host.composer.passes.indexOf(host.outlinePass));
  function add(root){
    const pairs=[];
    root.traverse(mesh=>{
      if(!mesh.isMesh)return;
      if(!mesh.geometry.boundingSphere)mesh.geometry.computeBoundingSphere();
      const copy=new T.Mesh(mesh.geometry,material);copy.matrixAutoUpdate=false;copy.frustumCulled=false;
      scene.add(copy);pairs.push([mesh,copy]);
    });
    copies.set(root,pairs);
  }
  function remove(root){for(const [,copy] of copies.get(root)??[])copy.removeFromParent();copies.delete(root);}
  function dispose(){
    host.composer.removePass(pass);enabled.value=false;mask.value=null;
    copies.clear();scene.clear();material.dispose();target.dispose();
  }
  return {add,remove,dispose};
}
