// Both markers persist independently of the combat particle budget.
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
    uniform float dwell;
    varying vec2 vUv;
    void main(){
      const float tau=6.2831853;
      vec2 p=(vUv-.5)*2.;
      float edge=abs(length(p)-.83);
      float rim=1.-smoothstep(.043,.058,edge);
      float path=1.-smoothstep(.023,.036,edge);
      float turn=fract(atan(p.x,p.y)/tau+1.);
      float written=1.-smoothstep(dwell-.003,dwell+.003,turn);
      vec2 tip=.83*vec2(sin(dwell*tau),cos(dwell*tau));
      float tipDistance=length(p-tip);
      float bead=1.-smoothstep(.045,.061,tipDistance);
      float alpha=max(rim,bead);
      if(alpha<.005)discard;
      vec3 track=mix(vec3(.17,.24,.23),vec3(.98,.94,.78),path);
      vec3 ink=mix(vec3(.025,.46,.32),vec3(.05,.68,.42),dwell);
      vec3 color=mix(track,ink,path*written);
      vec3 gold=mix(vec3(.55,.31,.10),vec3(1.,.77,.29),1.-smoothstep(.032,.048,tipDistance));
      gl_FragColor=vec4(mix(color,gold,bead),alpha*.98);
    }`, {dwell: {value: -1}});
}

export function createAltarChargeRing(parent, three, baseColor) {
  // Both the core and its halo emit light in the shader, including on the low preset without bloom.
  return groundRing(parent, three, 'altar-charge-ring', 2 / .83, `
    uniform vec3 baseColor;
    uniform float dwell, opacity;
    varying vec2 vUv;
    void main(){
      const float tau=6.2831853;
      vec2 p=(vUv-.5)*2.;
      float edge=abs(length(p)-.83);
      if(edge>.14)discard;
      float track=1.-smoothstep(.006,.022,edge);
      float core=1.-smoothstep(.012,.038,edge);
      float halo=1.-smoothstep(.012,.14,edge);
      halo*=halo;
      float turn=fract(atan(p.x,p.y)/tau+1.);
      float filled=step(.0001,dwell)*(1.-smoothstep(dwell-.004,dwell+.004,turn));
      if(dwell>=1.)filled=1.;
      vec3 coral=vec3(1.,.32,.30), lilac=vec3(.62,.25,.98);
      vec3 sky=vec3(.055,.60,1.), honey=vec3(1.,.63,.18);
      vec3 ink=mix(coral,lilac,smoothstep(.04,.35,turn));
      ink=mix(ink,sky,smoothstep(.40,.66,turn));
      ink=mix(ink,honey,smoothstep(.70,.95,turn));
      vec2 head=.83*vec2(sin(dwell*tau),cos(dwell*tau));
      float tip=(1.-smoothstep(.012,.075,length(p-head)))*smoothstep(0.,.015,dwell)*(1.-smoothstep(.985,1.,dwell));
      vec3 color=mix(baseColor,ink,filled)*(1.+.24*core+.27*filled)+vec3(.35,.35,.29)*tip;
      float alpha=(mix(.30*track+.17*halo,.81*core+.34*halo,filled)+.18*tip)*opacity;
      gl_FragColor=vec4(color,min(1.,alpha));
    }`, {baseColor:{value:baseColor}, dwell:{value:0}, opacity:{value:1}});
}
