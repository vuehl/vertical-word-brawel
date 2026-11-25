import {VFX_SCALE} from './visual-scale.js';
import {K as Mesh,et as PlaneGeometry,ct as ShaderMaterial} from '../vendor/three-DmSYIDKK.js';

// The illustrated tabletop materials ignore scene fog. Composite weather over
// the world in one draw, before the HUD, even when the camera is orthographic.
export class PaperWeather {
  constructor(scene){
    this.uniforms={kind:{value:0},amount:{value:0},clock:{value:0},aspect:{value:1},wind:{value:{x:1,y:0}}};
    this.mesh=new Mesh(new PlaneGeometry(2,2),new ShaderMaterial({
      uniforms:this.uniforms,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
      vertexShader:'varying vec2 coord;void main(){coord=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:`
        uniform float kind,amount,clock,aspect;
        uniform vec2 wind;
        varying vec2 coord;
        float hash(vec2 p){
          vec3 q=fract(p.xyx*.1031);
          q+=dot(q,q.yzx+33.33);
          return fract((q.x+q.y)*q.z);
        }
        float mist(vec2 p){
          vec2 cell=floor(p),f=fract(p);
          f=f*f*(3.-2.*f);
          return mix(mix(hash(cell),hash(cell+vec2(1.,0.)),f.x),
            mix(hash(cell+vec2(0.,1.)),hash(cell+1.),f.x),f.y);
        }
        float snow(vec2 p,vec2 heading,float stretch){
          vec2 tile=floor(p);
          vec2 flake=vec2(hash(tile),hash(tile+27.));
          vec2 d=fract(p)-mix(vec2(.26),vec2(.74),flake);
          float along=dot(d,heading)*stretch;
          float across=dot(d,vec2(-heading.y,heading.x));
          return (1.-smoothstep(.035,.092,length(vec2(along,across))))*(.45+.55*flake.x);
        }
        void main(){
          vec2 p=(.5+(coord-.5)/${VFX_SCALE})*vec2(aspect,1.);
          vec3 color;
          float alpha;
          if(kind<1.5){
            float banks=mist(p*vec2(5.,9.)-vec2(clock*.31,clock*.12));
            float ribbons=mist(p*vec2(9.,22.)+vec2(clock*.53,clock*.07));
            float vapor=smoothstep(.27,.79,banks*.72+ribbons*.28);
            color=mix(vec3(.14,.074,.23),vec3(.63,.45,.82),vapor);
            alpha=.22+.28*vapor;
          }else if(kind<2.5){
            vec2 drift=wind+vec2(0.,-.27);
            vec2 heading=drift/max(length(drift),.001);
            float flakes=snow(p*23.-drift*clock*6.9,heading,.64);
            float nearFlakes=snow(p*13.-drift*clock*5.8+63.,heading,.46);
            float gust=mist(p*vec2(5.,13.)-drift*clock*2.1);
            color=mix(vec3(.57,.76,.91),vec3(.95,.99,1.),max(flakes,nearFlakes));
            alpha=min(.92,.17+.12*gust+.47*flakes+.64*nearFlakes);
          }else{
            float rim=smoothstep(.15,.5,abs(coord.x-.5));
            float spray=mist(p*vec2(12.,8.)+vec2(clock*1.2,-clock*.7));
            color=vec3(.38,.77,.80);
            alpha=.24*rim*smoothstep(.28,.83,spray);
          }
          gl_FragColor=vec4(color,alpha*amount);
          #include <colorspace_fragment>
        }`,
    }));
    this.mesh.name='paper-scene-weather';this.mesh.frustumCulled=false;
    this.mesh.renderOrder=18;this.hide();scene.add(this.mesh);
  }
  update(kind,amount,time,aspect,angle,calm){
    const u=this.uniforms;
    this.mesh.visible=amount>0;
    u.kind.value=kind;u.amount.value=amount*(calm?.70:1);
    u.clock.value=time*(calm?.62:1);u.aspect.value=aspect;
    u.wind.value.x=Math.cos(angle);u.wind.value.y=-Math.sin(angle)*.8;
  }
  hide(){this.mesh.visible=false;}
  dispose(){this.mesh.removeFromParent();this.mesh.geometry.dispose();this.mesh.material.dispose();}
}
