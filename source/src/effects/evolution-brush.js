import {et as PlaneGeometry, H as InstancedMesh, B as InstanceAttribute, ct as ShaderMaterial} from '../vendor/three-DmSYIDKK.js';

// Display-space pigments. The cut to gold follows the recorded ignition,
// two frames before the new glyph is exposed at peak brightness.
export const goldPalette = `
  void goldPalette(float f, out vec3 rim, out vec3 ink, out vec3 gold, out vec3 glint) {
    float gather=smoothstep(12.,78.,f), heat=smoothstep(70.,122.,f);
    float release=step(124.,f);
    rim=mix(mix(vec3(.64,.46,.25),vec3(.58,.31,.105),gather),vec3(.68,.255,.065),heat);
    ink=mix(mix(vec3(.96,.79,.48),vec3(1.,.685,.215),gather),vec3(1.,.455,.085),heat);
    gold=mix(vec3(1.,.92,.68),vec3(1.,.785,.26),gather);
    glint=mix(vec3(1.,.97,.81),vec3(1.,.94,.69),heat);
    rim=mix(rim,vec3(.80,.46,.12),release);
    ink=mix(ink,vec3(1.,.77,.22),release);
    gold=mix(gold,vec3(1.,.925,.55),release);
    glint=mix(glint,vec3(1.,.995,.91),release);
  }
`;

export function exteriorBrush(atlas, uniforms) {
  const count=atlas.trails.length+atlas.rays.length;
  const path=new Float32Array(count*4), brush=new Float32Array(count*4);
  atlas.trails.forEach(([angle,phase,period,radius,spin,power,width],i)=>{
    path.set([angle,phase,period,radius],i*4);
    brush.set([spin,power,width,0],i*4);
  });
  atlas.rays.forEach(([angle,lag,length],i)=>{
    const offset=(atlas.trails.length+i)*4;
    path.set([angle,lag,length,0],offset);
    brush.set([0,.67,.75,1],offset);
  });
  const geometry=new PlaneGeometry(1,1,7,1);
  geometry.setAttribute('pathSeed',new InstanceAttribute(path,4));
  geometry.setAttribute('brushSeed',new InstanceAttribute(brush,4));
  const material=new ShaderMaterial({
    uniforms, transparent:true,depthTest:false,depthWrite:false,toneMapped:false,side:2,forceSinglePass:true,
    vertexShader:`
      uniform vec2 focus,span;
      uniform float frame,seconds;
      attribute vec4 pathSeed,brushSeed;
      varying vec2 pixel;
      varying float across,width,power,along;
      vec2 orbit(float q){
        float radius=pathSeed.w*pow(max(0.,1.-q),1.28)+11.;
        float angle=pathSeed.x+brushSeed.x*(.88*q+.48*q*q)+.22*seconds;
        return vec2(cos(angle),sin(angle))*radius;
      }
      void main(){
        along=uv.x;
        vec2 point,direction;
        if(brushSeed.w<.5){
          float q=fract(seconds/pathSeed.z+pathSeed.y);
          float tail=max(0.,q-6.*(.003+.0025*brushSeed.z));
          float u=mix(tail,q,along);
          point=orbit(u);
          direction=normalize(orbit(u+.0003)-orbit(u));
          power=smoothstep(0.,.68,seconds)*(1.-smoothstep(122.,125.,frame))*brushSeed.y
            *smoothstep(0.,.1,q)*(1.-smoothstep(.91,1.,q))*mix(.4,1.,smoothstep(12.,100.,frame));
          width=brushSeed.z*.85*pow(along,.72)*(1.-smoothstep(.80,1.,along));
        }else{
          float u=(frame-123.)/15.-pathSeed.y;
          float radius=35.+u*860.;
          direction=vec2(cos(pathSeed.x),sin(pathSeed.x));
          point=direction*mix(max(0.,radius-pathSeed.z),radius,along);
          power=step(124.,frame)*step(frame,139.)*step(0.,u)*.67*(1.-smoothstep(.44,.89,u));
          width=.83*sin(3.14159*along);
        }
        across=(uv.y*2.-1.)*(width+1.);
        pixel=vec2(195.,368.)+point+across*vec2(-direction.y,direction.x);
        vec2 source=vec2(pixel.x/${atlas.width}.,1.-pixel.y/${atlas.height}.);
        gl_Position=vec4(((source-vec2(${atlas.focus.join(',')}))/span+focus)*2.-1.,0.,1.);
      }`,
    fragmentShader:`
      uniform float frame,strength;
      varying vec2 pixel;
      varying float across,width,power,along;
      ${goldPalette}
      void main(){
        vec2 outside=max(max(vec2(11.,230.)-pixel,pixel-vec2(378.,505.)),0.);
        float aa=max(.26,.65*fwidth(across));
        float coverage=smoothstep(-aa,aa,width-abs(across))*smoothstep(0.,.32,width);
        float alpha=coverage*power*strength*smoothstep(0.,26.,length(outside));
        if(alpha<.003)discard;
        vec3 rim,ink,gold,glint;goldPalette(frame,rim,ink,gold,glint);
        vec3 color=mix(ink,gold,smoothstep(.18,.92,along));
        color=mix(color,glint,.85*smoothstep(.35,.85,along)*(1.-smoothstep(.05,.84,abs(across+.22))));
        gl_FragColor=vec4(color,min(1.,alpha));
      }`,
  });
  const mesh=new InstancedMesh(geometry,material,count);
  mesh.name='evolution-brush-streaks';mesh.frustumCulled=false;mesh.renderOrder=2;
  return mesh;
}
