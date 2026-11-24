import {DeviceFxThree,dt as Texture} from '../assets/three-DmSYIDKK.js';
import {formatGameTime} from './lite-rules.js';
import {createPortalScreenAnimation} from './portal-screen-atlas.js';

// These axes follow the perspective of the clock face in the 510px illustration.
const clockShader = `
uniform vec4 clockDigits;
uniform sampler2D clockAnimation;
uniform mat3 clockFrame;
uniform float clockOpen;
const vec2 digitStep=vec2(40.,28.3), digitDown=vec2(-25.,71.);
vec2 clockBasis(vec2 p,vec2 x,vec2 y){
  return vec2(p.x*y.y-p.y*y.x,x.x*p.y-x.y*p.x)/(x.x*y.y-x.y*y.x);
}
float segmentDistance(vec2 p,vec2 a,vec2 b){
  vec2 ab=b-a;
  return length(p-a-ab*clamp(dot(p-a,ab)/dot(ab,ab),0.,1.));
}
vec3 clockFace(vec3 painted,vec2 px){
  vec2 grid=clockBasis(px-vec2(171.,204.),digitStep,digitDown);
  if(abs(grid.x)<2.17 && grid.y>-.10 && grid.y<1.1){
    float dist=100.;
    if(abs(grid.x)<.22){
      dist=min(length(grid.x*digitStep+(grid.y-.32)*digitDown),
               length(grid.x*digitStep+(grid.y-.70)*digitDown));
    }else{
      float slot=grid.x<-1.2?0.:grid.x<0.?1.:grid.x<1.2?2.:3.;
      float center=slot<1.5?slot-1.72:slot-1.28;
      vec2 p=(grid.x-center)*digitStep+grid.y*digitDown;
      float mask=slot<.5?clockDigits.x:slot<1.5?clockDigits.y:slot<2.5?clockDigits.z:clockDigits.w;
      float bit=1.;
      for(int i=0;i<7;i++){
        if(mod(floor(mask/bit),2.)>.5){
          bool horizontal=i==0||i==3||i==6;
          float x=horizontal?0.:(i==1||i==2?.34:-.34);
          float y=horizontal?(i==0?0.:i==3?1.:.5):(i==1||i==5?.25:.75);
          vec2 d=p-x*digitStep-y*digitDown;
          vec2 along=horizontal?.23*digitStep:.148*digitDown;
          dist=min(dist,segmentDistance(d,-along,along));
        }
        bit*=2.;
      }
    }
    float aa=clamp(length(fwidth(px))*.36,.5,2.5);
    painted=mix(painted,vec3(.055,.08,.24),1.-smoothstep(4.7-aa,4.7+aa,dist));
    painted=mix(painted,vec3(.97,.98,1.),1.-smoothstep(3.4-aa,3.4+aa,dist));
  }
  if(clockOpen>0.){
    vec2 glass=clockBasis(px-vec2(48.,85.),vec2(265.,179.),vec2(-41.,145.));
    vec2 edge=abs(glass-.5)-vec2(.455,.415);
    float bezel=length(max(edge*vec2(1.,.5),0.));
    float reveal=smoothstep(glass.y-.03,glass.y+.03,clockOpen);
    if(bezel<.043 && reveal>0.)
      return mix(painted,texture2D(clockAnimation,(clockFrame*vec3(glass,1.)).xy).rgb,
        reveal*(1.-smoothstep(.036,.043,bezel)));
  }
  return painted;
}`;

const segmentMasks=[63,6,91,79,102,109,125,7,127,111];
export function createIllustratedClock(sprite,renderer){
  const animation=createPortalScreenAnimation({...DeviceFxThree,Texture},renderer);
  const digits={value:new DeviceFxThree.Vector4()},opening={value:0};
  let state='idle',started=null,lastSeconds=-1;
  sprite.material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{clockDigits:digits,clockOpen:opening,
      clockAnimation:{value:animation.texture},clockFrame:{value:animation.texture.matrix}});
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_pars_fragment>',
      '#include <map_pars_fragment>\n'+clockShader).replace('#include <map_fragment>',
      '#include <map_fragment>\ndiffuseColor.rgb=clockFace(diffuseColor.rgb,vec2(vMapUv.x,1.-vMapUv.y)*510.);');
  };
  function open(){if(state==='idle')state='playing';}
  function update(time,remaining){
    const seconds=Math.max(0,Math.min(5999,Math.ceil(remaining)));
    if(seconds!==lastSeconds){
      const display=formatGameTime(seconds);
      digits.value.set(segmentMasks[+display[0]],segmentMasks[+display[1]],segmentMasks[+display[3]],segmentMasks[+display[4]]);
      lastSeconds=seconds;
    }
    if(seconds===0)open();
    if(state!=='idle'){
      started??=time;
      opening.value=Math.min(1.04,(time-started)/.75);
      if(opening.value>=1.04)state='open';
      animation.frame(time-started);
    }
  }
  return {ready:animation.ready,update,open,dispose:animation.dispose,get state(){return state;},
    get seconds(){return lastSeconds;}};
}
