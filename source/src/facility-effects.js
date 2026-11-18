import {DeviceFxThree as T, F as Frustum, lt as Sphere, PostprocessingPass, RedFormat} from '../assets/three-DmSYIDKK.js';
import {createDeviceScreenFx} from './DeviceScreenFx.mjs';

export function createFacilityEffects(host, focusWorld) {
  const {renderer, composer, scene, camera, outline, outlinePass, antiAliasPass} = host;
  const fx = createDeviceScreenFx(T, renderer);
  const meshesByRoot = new Map();
  const frustum = new Frustum(), viewProjection = new T.Matrix4(), sphere = new Sphere();
  const visiblePass = new PostprocessingPass('Visible devices', null, null);
  const colourPass = new PostprocessingPass('Device screen effects', null, null);
  const source = {width: 0, height: 0, texture: null, depthTexture: null};
  const options = {focusWorld};

  // PixelOutline runs before grading. Only that preset needs this one-channel
  // exclusion mask. The supplied compositor handles its own outline after grading.
  const exclusion = new T.WebGLRenderTarget(1, 1, {
    format: RedFormat, minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthBuffer: false,
  });
  const maskScene = new T.Scene();
  maskScene.matrixWorldAutoUpdate = false;
  const maskMaterial = new T.ShaderMaterial({
    side: T.DoubleSide, depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: {sceneDepth: {value: null}, size: {value: new T.Vector2()}},
    vertexShader: 'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform sampler2D sceneDepth; uniform vec2 size;
      void main(){
        if(gl_FragCoord.z > texture2D(sceneDepth, gl_FragCoord.xy / size).r + .000002) discard;
        gl_FragColor=vec4(1.);
      }`,
  });
  const savedColour = new T.Color();
  const useMask = outline.uniforms.get('uHasDeviceMask');
  const worldMask = outline.uniforms.get('uDeviceMask');
  worldMask.value = exclusion.texture;

  function add(root) {
    if (meshesByRoot.has(root)) return;
    fx.add(root);
    const pairs = [];
    root.traverse(mesh => {
      if (!mesh.isMesh) return;
      const proxy = new T.Mesh(mesh.geometry, maskMaterial);
      // RenderPass has already updated the real mesh, including its animated parents.
      proxy.matrixWorld = mesh.matrixWorld;
      proxy.matrixAutoUpdate = proxy.matrixWorldAutoUpdate = false;
      proxy.frustumCulled = false;
      proxy.layers.enableAll();
      maskScene.add(proxy);
      if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
      pairs.push([mesh, proxy]);
    });
    meshesByRoot.set(root, pairs);
  }
  function remove(root) {
    const pairs = meshesByRoot.get(root);
    if (!pairs) return;
    fx.remove(root);
    for (const [, proxy] of pairs) maskScene.remove(proxy);
    meshesByRoot.delete(root);
  }
  function visible(mesh) {
    if (!camera.layers.test(mesh.layers)) return false;
    let node = mesh;
    while (node && node.visible && node !== scene) node = node.parent;
    if (node !== scene || !scene.visible) return false;
    sphere.copy(mesh.geometry.boundingSphere).applyMatrix4(mesh.matrixWorld);
    sphere.radius *= 1.4; // Include stars just outside the silhouette at the viewport edge.
    return frustum.intersectsSphere(sphere);
  }
  visiblePass.needsSwap = false;
  visiblePass.needsDepthTexture = true;
  visiblePass.render = (_, input) => {
    frustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    let anyVisible = false;
    for (const pairs of meshesByRoot.values()) for (const [mesh, proxy] of pairs) {
      proxy.visible = visible(mesh);
      if (proxy.visible) anyVisible = true;
    }
    colourPass.enabled = anyVisible;
    useMask.value = anyVisible && outlinePass.enabled;
    if (!useMask.value) return;
    exclusion.setSize(input.width, input.height);
    maskMaterial.uniforms.sceneDepth.value = composer.stableDepthTexture;
    maskMaterial.uniforms.size.value.set(input.width, input.height);
    const previous = renderer.getRenderTarget(), alpha = renderer.getClearAlpha();
    renderer.getClearColor(savedColour);
    try {
      renderer.setRenderTarget(exclusion);
      renderer.setClearColor(0, 0);
      renderer.clear(true, false, false);
      renderer.render(maskScene, camera);
    } finally {
      renderer.setClearColor(savedColour, alpha);
      renderer.setRenderTarget(previous);
    }
  };
  colourPass.enabled = false;
  colourPass.render = (_, input, output) => {
    source.width = input.width;
    source.height = input.height;
    source.texture = input.texture;
    // The composer's ping-pong colour targets do not retain the original scene depth.
    source.depthTexture = composer.stableDepthTexture;
    fx.composite(scene, camera, host.shared.uTime.value, source, output, options);
  };
  composer.addPass(visiblePass, composer.passes.indexOf(outlinePass));
  composer.addPass(colourPass, composer.passes.indexOf(antiAliasPass));
  function dispose() {
    composer.removePass(visiblePass);
    composer.removePass(colourPass);
    useMask.value = false;
    worldMask.value = null;
    fx.dispose();
    maskScene.clear();
    meshesByRoot.clear();
    maskMaterial.dispose();
    exclusion.dispose();
  }
  return {add, remove, dispose};
}
