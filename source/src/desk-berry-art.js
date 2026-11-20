export const berryLayers = {
  base: 'device-berry/device-berry_basic.png',
  rgb: 'device-berry/RGB_flash.png',
  spiral: 'device-berry/fuzzy.png',
  shine: 'device-berry/fuzzy_flash.png',
};

// All four registered images share the base silhouette. Composite in a single
// draw so the flash moves across the printed details without moving the art.
export function applyBerryLayers(material, textures, clock) {
  const flashEnabled = {value: true};
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, {
      berryRGB: {value:textures.rgb}, berrySpiral: {value:textures.spiral},
      berryShine: {value:textures.shine}, berryTime: clock, berryAvailable: flashEnabled,
    });
    shader.fragmentShader = `
      uniform sampler2D berryRGB, berrySpiral, berryShine;
      uniform float berryTime;
      uniform bool berryAvailable;
    ` + shader.fragmentShader.replace('#include <map_fragment>', `
      vec4 body = texture2D(map,vMapUv);
      vec4 rgb = texture2D(berryRGB,vMapUv);
      vec4 spiral = texture2D(berrySpiral,vMapUv);
      vec4 shine = texture2D(berryShine,vMapUv);
      // UVs cover the full 256 px sheet. Both streaks travel diagonally
      // across the painted face and clear its edges before the loop wraps.
      float axis = vMapUv.y + .32*vMapUv.x;
      // Traverse in one second and pause for 0.2 seconds before restarting.
      float sweep = min(mod(berryTime,1.2),1.0);
      float head = mix(.13,.77,sweep);
      float distanceToBand = abs(axis-head);
      float rainbow = berryAvailable ? 1.-smoothstep(.035,.115,distanceToBand) : 0.;
      float highlight = berryAvailable ? 1.-smoothstep(.018,.083,distanceToBand) : 0.;
      vec3 candy = mix(body.rgb,rgb.rgb,rgb.a*rainbow);
      candy = mix(candy,spiral.rgb,spiral.a);
      candy = mix(candy,shine.rgb,shine.a*highlight);
      diffuseColor *= vec4(candy,body.a);
    `);
  };
  return state => { flashEnabled.value = state !== 'used'; };
}
