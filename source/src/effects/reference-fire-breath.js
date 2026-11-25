import {VFX_SCALE} from './visual-scale.js';
import {y as BufferGeometry,v as BufferAttribute,B as InstanceAttribute,H as InstancedMesh,ct as ShaderMaterial,j as DynamicDraw,b as CanvasTexture,ot as SRGB} from '../vendor/three-DmSYIDKK.js';
import atlas from '../../../resources/public/assets/vfx/fire-breath-reference.json' with {type:'json'};

export const isReferenceBreath=e=>e.key?.def?.key==='flamethrower'||String(e.key).startsWith('enemy-cone-flamethrower');
const frameEndMs=atlas.frameEndMs;
const durationMs=frameEndMs[frameEndMs.length-1];
const vertex=`
attribute vec4 iOrigin;attribute vec4 iPose;
varying vec2 vUv;varying float vAlpha;
void main(){
  vec4 p=viewMatrix*vec4(iOrigin.xyz,1.);
  vec3 forward=(viewMatrix*vec4(cos(iPose.x),0.,sin(iPose.x),0.)).xyz;
  vec2 heading=normalize(forward.xy),side=vec2(heading.y,-heading.x);
  vec2 local=(uv-vec2(${atlas.anchor[0]},${atlas.anchor[1]}))*iOrigin.w;
  // For an upward cast, place the nozzle at the leading stroke as in the GIF.
  local.y+=iPose.w*max(heading.y,0.)*(iOrigin.w/${VFX_SCALE})*(14./${atlas.tile}.);
  p.xy+=side*local.x+heading*local.y;
  vec2 cell=vec2(mod(iPose.y,${atlas.columns}.),${atlas.rows-1}.-floor(iPose.y/${atlas.columns}.));
  vUv=(cell+mix(vec2(.5/${atlas.tile}.),vec2(1.-.5/${atlas.tile}.),uv))/vec2(${atlas.columns}.,${atlas.rows}.);
  vAlpha=iPose.z;gl_Position=projectionMatrix*p;
}`;
const fragment=`
uniform sampler2D map;varying vec2 vUv;varying float vAlpha;
void main(){vec4 c=texture2D(map,vUv);c.a*=vAlpha;if(c.a<.005)discard;gl_FragColor=c;
#include <colorspace_fragment>
}`;

// One pass through the original GIF frames for each cast. The emitter keeps
// supplying position and direction while the damage cone is active.
export class ReferenceFireBreath{
  constructor(owner,scene){
    this.owner=owner;this.streams=new Map();this.clock=0;this.limit=28;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
    const texture=this.texture=new CanvasTexture(canvas);texture.colorSpace=SRGB;
    texture.generateMipmaps=false;texture.minFilter=texture.magFilter=1006;
    const image=new Image();
    this.ready=new Promise(resolve=>{
      const finish=ok=>{clearTimeout(timer);image.onload=image.onerror=null;this.loadError=!ok;resolve(ok);};
      const timer=setTimeout(()=>finish(false),12000);
      image.onload=()=>{if(!this.disposed){texture.image=image;texture.needsUpdate=true;this.loaded=true;}finish(true);};
      image.onerror=()=>finish(false);image.src='assets/vfx/fire-breath-reference.png';
    });texture.userData.ready=this.ready;
    const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array([0,0,0,1,0,0,1,1,0,0,1,0]),3));
    g.setAttribute('uv',new BufferAttribute(new Float32Array([0,0,1,0,1,1,0,1]),2));g.setIndex([0,1,2,0,2,3]);
    this.attributes=['iOrigin','iPose'].map(name=>{const a=new InstanceAttribute(new Float32Array(28*4),4).setUsage(DynamicDraw);g.setAttribute(name,a);return a;});
    const material=new ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{map:{value:texture}},transparent:true,depthTest:true,depthWrite:false,side:2,toneMapped:false});
    material.forceSinglePass=true;
    this.mesh=new InstancedMesh(g,material,28);this.mesh.count=0;this.mesh.visible=false;this.mesh.frustumCulled=false;
    // Glyph billboards render at order 1. Their visible strokes cover the nozzle.
    this.mesh.name='reference-fire-breath';this.mesh.renderOrder=.9;scene.add(this.mesh);
  }
  setPerformance(profile){this.limit=profile.name==='流畅'?10:profile.name==='均衡'?18:28;}
  update(dt,emitters){
    dt=Math.max(0,dt);this.clock+=dt;
    if(dt>0)for(const e of emitters){
      if(!isReferenceBreath(e)||!e.fireTouched||!this.owner.allowed(e.own!==false))continue;
      let s=this.streams.get(e.key);
      if(!s){if(this.streams.size>=this.limit)continue;s={start:this.clock,own:e.own!==false};this.streams.set(e.key,s);}
      else if(this.clock-s.last-dt>.10)s.start=this.clock;
      Object.assign(s,{x:e.x,y:e.y,z:e.z,angle:e.angle,size:e.artLength*1.2,last:this.clock});
    }
    const [origin,pose]=this.attributes.map(a=>a.array),v=this.owner.vfx;let count=0;
    for(const [key,s] of this.streams){
      if(!this.owner.allowed(s.own)){this.streams.delete(key);continue;}
      const elapsedMs=(this.clock-s.start)*1000+1e-6;
      if(elapsedMs>=durationMs){
        if(this.clock-s.last>.10)this.streams.delete(key);
        continue;
      }
      if(count>=this.limit)continue;
      const frame=frameEndMs.findIndex(end=>elapsedMs<end);
      const o=count++*4;
      origin.set([s.x,s.y,s.z,s.size*VFX_SCALE],o);
      pose.set([s.angle,frame,v.opacity*(s.own?v.ownOpacity:1)*(v.calm?.78:1),s.own?1:0],o);
    }
    this.mesh.count=this.loaded?count:0;this.mesh.visible=this.mesh.count>0;
    for(const a of this.attributes){a.clearUpdateRanges();a.addUpdateRange(0,count*4);a.needsUpdate=true;}
  }
  clear(){this.streams.clear();this.mesh.count=0;this.mesh.visible=false;}
  dispose(){this.disposed=true;this.clear();this.mesh.parent?.remove(this.mesh);this.mesh.geometry.dispose();this.mesh.material.dispose();this.mesh.dispose();this.texture.dispose();}
}
