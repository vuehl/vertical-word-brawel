// One persistent ground marker. It must not use the particle pool: particle
// density, lifetime and the frame delta must never hide the player's marker.
export function createPlayerFootRing(scene,{PlaneGeometry,ShaderMaterial,Mesh}){
  const geometry=new PlaneGeometry(2.1,2.1).rotateX(-Math.PI/2);
  const material=new ShaderMaterial({
    transparent:true,depthWrite:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;
      void main(){
        float d=length((vUv-.5)*2.);
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
