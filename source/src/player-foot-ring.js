// One persistent ground marker. It must not use the particle pool: particle
// density, lifetime and the frame delta must never hide the player's marker.
export function createPlayerFootRing(scene,{PlaneGeometry,ShaderMaterial,Mesh}){
  const geometry=new PlaneGeometry(2.1,2.1).rotateX(-Math.PI/2);
  const material=new ShaderMaterial({
    transparent:true,depthWrite:false,
    uniforms:{dwell:{value:-1}},
    vertexShader:`uniform float dwell;
      varying vec2 vUv;
      void main(){
        vUv=uv;
        float scale=dwell<0. ? 1. : 1.75+.14*smoothstep(0.,.12,dwell);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position*scale,1.);
      }`,
    fragmentShader:`uniform float dwell;
      varying vec2 vUv;
      void main(){
        vec2 p=(vUv-.5)*2.;
        float d=length(p);
        if(dwell>=0.){
          const float tau=6.2831853;
          float edge=abs(d-.83);
          float rim=1.-smoothstep(.067,.087,edge);
          float path=1.-smoothstep(.032,.051,edge);
          float turn=fract(atan(p.x,p.y)/tau+1.);
          float written=1.-smoothstep(dwell-.003,dwell+.003,turn);
          vec2 tip=.83*vec2(sin(dwell*tau),cos(dwell*tau));
          float tipDistance=length(p-tip);
          float bead=1.-smoothstep(.061,.084,tipDistance);
          float alpha=max(rim,bead);
          if(alpha<.005)discard;
          vec3 track=mix(vec3(.24,.31,.31),vec3(.97,.92,.75),path);
          vec3 ink=mix(vec3(.035,.41,.34),vec3(.075,.61,.45),dwell);
          vec3 color=mix(track,ink,path*written);
          vec3 gold=mix(vec3(.55,.31,.10),vec3(1.,.77,.29),1.-smoothstep(.041,.063,tipDistance));
          gl_FragColor=vec4(mix(color,gold,bead),alpha*.98);
          return;
        }
        float outer=1.-smoothstep(.90,.96,d);
        float ring=smoothstep(.77,.83,d)*outer;
        float alpha=ring*.76+(1.-smoothstep(.72,.83,d))*.055;
        if(alpha<.005)discard;
        gl_FragColor=vec4(mix(vec3(.40,.79,.73),vec3(.89,1.,.94),ring*.55),alpha);
      }`
  });
  const mesh=new Mesh(geometry,material);
  mesh.name='player-foot-ring';mesh.renderOrder=.6;mesh.visible=false;scene.add(mesh);
  return mesh;
}
