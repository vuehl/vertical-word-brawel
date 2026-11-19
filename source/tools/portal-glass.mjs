// Keep the supplied modules byte-identical to the GLB. The shared compositor
// normally protects dark ink by colour. Mark the two screen meshes in its mask
// so dark glass artwork reflects the same band as the rest of the screen.
export function bindPortalGlass(source) {
  const bindings = [
    ['uniform float deviceId;', 'uniform float deviceId, portalGlass;'],
    ['deviceId:1,portalSide:', 'deviceId:1,portalGlass:0,portalSide:'],
    ['mat.uniforms.portalSide.value=src.userData.portalPhase',
      "mat.uniforms.portalGlass.value=src.userData.portalPart==='screen'?1:0;mat.uniforms.portalSide.value=src.userData.portalPhase"],
    ['gl_FragColor=vec4(deviceId,.55*p.x+.45*(1.-p.y),viewDepth,creamPhase);',
      `float diagonal=.55*p.x+.45*(1.-p.y);
       gl_FragColor=vec4(deviceId,portalGlass>.5 ? -2.-diagonal : diagonal,viewDepth,creamPhase);`],
    ['if(inner&&max(max(distanceToInk.r,distanceToInk.g),distanceToInk.b)>.021){',
      `bool glass=m.g < -1.;
       if(inner&&(glass||max(max(distanceToInk.r,distanceToInk.g),distanceToInk.b)>.021)){`],
    ['float d=m.g-(', 'float d=(glass ? -2.-m.g : m.g)-('],
  ];
  for (const [from, to] of bindings) {
    if (!source.includes(from) || source.indexOf(from) !== source.lastIndexOf(from)) {
      throw Error('DeviceScreenFx glass binding changed: ' + from);
    }
    source = source.replace(from, to);
  }
  return source;
}
