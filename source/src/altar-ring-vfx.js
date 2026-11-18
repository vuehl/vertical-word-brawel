// Reserved particle glow marker: only the blue charging altar opts in.
export const ALTAR_RING_EMISSIVE=-1;
// Original atlas ring: radius 24, stroke 3, on a 64-unit cell. Keep both
// boundaries intact; only the soft halo extends beyond the existing band.
export const altarRingFragment=`
  if(vGlow < -.5){
    float radius=length(vLocalUv-.5);
    float edge=radius-24.0/64.0;
    float aa=max(fwidth(radius),.0005);
    float band=1.-smoothstep(1.5/64.0-aa,1.5/64.0+aa,abs(edge));
    float outside=max(0.,edge-1.5/64.0);
    float halo=exp(-outside*outside/0.0012)*.32;
    halo*=smoothstep(0.,aa*2.,edge)*(1.-smoothstep(.475,.495,radius));
    float alpha=max(band,halo)*vCol.a;
    if(alpha<.005)discard;
    vec3 blue=mix(vCol.rgb,vec3(.45,.94,1.),.55);
    vec3 core=mix(blue,vec3(.72,1.,1.),.55)*1.12;
    gl_FragColor=vec4(mix(blue,core,band),alpha);
    return;
  }
`;
