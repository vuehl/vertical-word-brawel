import {DeviceFxThree as T, dt as Texture, F as Frustum, lt as Sphere, PostprocessingPass} from '../vendor/three-DmSYIDKK.js';
import {createDeviceScreenFx} from './DeviceScreenFx.mjs';
import {attachPortalDock} from './PortalDock.mjs';
import earcut, {flatten} from '../vendor/earcut.js';

// The trimmed Three.js bundle omits ShapeUtils. The dock uses this one
// operation to turn the authored flash silhouettes into triangles.
const dockThree = {...T, Texture, ShapeUtils: {triangulateShape(contour, holes) {
  const rings = [contour, ...holes].map(ring => ring.map(point => [point.x, point.y]));
  const polygon = flatten(rings);
  const indices = earcut(polygon.vertices, polygon.holes);
  const faces = [];
  for (let i = 0; i < indices.length; i += 3) faces.push(indices.slice(i, i + 3));
  return faces;
}}};

export function createFacilityEffects(host, focusWorld) {
  const {renderer, composer, scene, camera, outline, outlinePass, antiAliasPass} = host;
  const fx = createDeviceScreenFx(T, renderer);
  const meshesByRoot = new Map();
  const frustum = new Frustum(), viewProjection = new T.Matrix4(), sphere = new Sphere();
  const visiblePass = new PostprocessingPass('Visible devices', null, null);
  const colourPass = new PostprocessingPass('Device screen effects', null, null);
  const source = {width: 0, height: 0, texture: null, depthTexture: null};
  const options = {focusWorld, matricesUpdated: true, originalOutlineRadiusPx: 0};

  // The device ID mask already contains the visible silhouette (> .5).
  // Prepare it before world outlines, then reuse it after colour grading.
  // This avoids submitting every device mesh to a second full-size mask.
  const useMask = outline.uniforms.get('uHasDeviceMask');
  const worldMask = outline.uniforms.get('uDeviceMask');
  worldMask.value = fx.maskTexture;

  function add(root) {
    if (meshesByRoot.has(root)) return;
    fx.add(root);
    const meshes = [];
    root.traverse(mesh => {
      if (!mesh.isMesh) return;
      if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
      meshes.push(mesh);
    });
    meshesByRoot.set(root, meshes);
  }
  function remove(root) {
    if (!meshesByRoot.has(root)) return;
    fx.remove(root);
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
    for (const meshes of meshesByRoot.values()) {
      if(meshes.some(visible)){anyVisible=true;break;}
    }
    colourPass.enabled = anyVisible;
    useMask.value = false;
    options.preparedFrame=null;
    if (!anyVisible) return;
    source.width=input.width;source.height=input.height;
    source.depthTexture=composer.stableDepthTexture;
    options.preparedFrame=fx.prepareFrame(scene,camera,host.shared.uTime.value,source,options);
    useMask.value=options.preparedFrame.active>0&&outlinePass.enabled;
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
  async function prepare() {
    await fx.prepare(camera, composer.inputBuffer);
  }
  function dispose() {
    composer.removePass(visiblePass);
    composer.removePass(colourPass);
    useMask.value = false;
    worldMask.value = null;
    fx.dispose();
    meshesByRoot.clear();
    options.preparedFrame=null;
  }
  return {add, remove, prepare, dispose, attachDock: (model, options) => attachPortalDock(dockThree, renderer, model, options)};
}
