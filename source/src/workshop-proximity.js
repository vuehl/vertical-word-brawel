import {ht as Vector3} from '../assets/three-DmSYIDKK.js';

// One continuous distance envelope, shared by bulbs and painted halos.
// No clock, pulse, travelling wave or triggered particle burst.
export const lampDistanceGLSL='1.-smoothstep(4.,14.,length(vToyLampWorld.xz-uToyPlayer.xz))';
export function lampPlayerUniform(assets){
  return (assets.proximityUniforms??={player:{value:new Vector3()},ready:false}).player;
}
export function proximityBulb(material,assets){
  const player=lampPlayerUniform(assets),before=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.userData.proximity=true;
  material.onBeforeCompile=shader=>{
    before?.(shader);shader.uniforms.uToyPlayer=player;
    shader.vertexShader='varying vec3 vToyLampWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
      vec4 lampPoint=vec4(0.,0.,0.,1.);
      #ifdef USE_INSTANCING
        lampPoint=instanceMatrix*lampPoint;
      #endif
      vToyLampWorld=(modelMatrix*lampPoint).xyz;
    `);
    shader.fragmentShader='varying vec3 vToyLampWorld;uniform vec3 uToyPlayer;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      float awake=${lampDistanceGLSL};
      totalEmissiveRadiance*=mix(.015,1.,awake);
    `);
  };
  material.customProgramCacheKey=()=>key+'-steady-proximity-v2';return material;
}
export function updateToyProximity(run,dt){
  const assets=run.terrain?.paperAssets,p=run.player?.pos||run.terrain?.spawn,u=assets?.proximityUniforms;
  if(!u||!p)return;
  if(!u.ready){u.player.value.copy(p);u.ready=true;}
  else u.player.value.lerp(p,1-Math.exp(-Math.max(0,dt||0)*9));
  if(u.player.value.distanceToSquared(p)<1e-8)u.player.value.copy(p);
}
