// Ground markers persist independently of the combat particle budget.
function groundRing(parent, {PlaneGeometry, ShaderMaterial, Mesh}, name, diameter, fragmentShader, uniforms = {}) {
  const geometry = new PlaneGeometry(diameter, diameter).rotateX(-Math.PI / 2);
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, uniforms, fragmentShader,
    vertexShader: `varying vec2 vUv;
      void main(){
        vUv=uv;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }`,
  });
  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  mesh.renderOrder = .6;
  mesh.visible = false;
  parent.add(mesh);
  return mesh;
}
export function createPlayerFootRing(scene, three) {
  return groundRing(scene, three, 'player-foot-ring', 2.1, `
    varying vec2 vUv;
    void main(){
      float d=length((vUv-.5)*2.);
      float outer=1.-smoothstep(.90,.96,d);
      float ring=smoothstep(.77,.83,d)*outer;
      float alpha=ring*.76+(1.-smoothstep(.72,.83,d))*.055;
      if(alpha<.005)discard;
      gl_FragColor=vec4(mix(vec3(.40,.79,.73),vec3(.89,1.,.94),ring*.55),alpha);
    }`);
}

export function createFacilityDwellRing(parent, three) {
  // The track at UV radius .83 has unit world radius before the building's scale.
  return groundRing(parent, three, 'facility-dwell-ring', 2 / .83, `
    // A negative value selects the ordinary facility track.
    uniform float dwell, berryCooldown, ringOpacity;
    varying vec2 vUv;
    void main(){
      const float tau=6.2831853;
      vec2 p=(vUv-.5)*2.;
      float edge=abs(length(p)-.83);
      float rim=1.-smoothstep(.043,.058,edge);
      float path=1.-smoothstep(.023,.036,edge);
      vec3 track=mix(vec3(.23),vec3(.76),path);
      if(dwell<0.){
        if(rim<.005)discard;
        if(berryCooldown>=0.){
          vec3 candy=mix(vec3(1.),vec3(1.,.59,.16),berryCooldown);
          track=mix(vec3(.23),candy,path);
        }
        gl_FragColor=vec4(track,rim*.98*ringOpacity);
        return;
      }
      float turn=fract(atan(p.x,p.y)/tau+1.);
      float written=1.-smoothstep(dwell-.003,dwell+.003,turn);
      vec2 tip=.83*vec2(sin(dwell*tau),cos(dwell*tau));
      float tipDistance=length(p-tip);
      float bead=1.-smoothstep(.045,.061,tipDistance);
      float alpha=max(rim,bead);
      if(alpha<.005)discard;
      vec3 ink=mix(vec3(.025,.46,.32),vec3(.05,.68,.42),dwell);
      vec3 color=mix(track,ink,path*written);
      vec3 gold=mix(vec3(.55,.31,.10),vec3(1.,.77,.29),1.-smoothstep(.032,.048,tipDistance));
      gl_FragColor=vec4(mix(color,gold,bead),alpha*.98*ringOpacity);
    }`, {dwell: {value: -1}, berryCooldown: {value: -1}, ringOpacity: {value: 1}});
}
