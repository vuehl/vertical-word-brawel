import {y as BufferGeometry,v as BufferAttribute,B as InstanceAttribute,H as InstancedMesh,ct as ShaderMaterial,j as DynamicDraw,b as CanvasTexture,ot as SRGB} from '../assets/three-DmSYIDKK.js';
import atlas from '../public/assets/vfx/fireball.json' with {type:'json'};

const vertex=`
attribute vec4 iOrigin;attribute vec4 iFrame;attribute vec4 iHeading;
varying vec2 vUv;varying float vAlpha;varying float vShot;
void main(){
  vec4 p=viewMatrix*vec4(iOrigin.xyz,1.);
  // Orient the authored hot head along the actual projected flight direction.
  // Its circular cross section stays readable from every isometric direction.
  vec3 flight=(viewMatrix*vec4(normalize(iHeading.xyz),0.)).xyz;
  vec2 heading=flight.xy;
  heading=length(heading)>.001?normalize(heading):vec2(1.,0.);
  vec2 local=(uv-vec2(iFrame.z,.5))*vec2(iOrigin.w,iFrame.x);
  vShot=iFrame.w;
  if(vShot>.5&&vShot<1.5){p.xyz+=flight*local.x;p.xy+=vec2(-heading.y,heading.x)*local.y;}
  else p.xy+=heading*local.x+vec2(-heading.y,heading.x)*local.y;
  gl_Position=projectionMatrix*p;
  float col=mod(iFrame.y,8.),row=floor(iFrame.y/8.);
  vUv=(vec2(col,5.-row)+mix(vec2(.5/${atlas.tile}.),vec2(1.-.5/${atlas.tile}.),uv))/vec2(8.,6.);
  vAlpha=iHeading.w;
}`;
const fragment=`
uniform sampler2D map;varying vec2 vUv;varying float vAlpha;varying float vShot;
void main(){
  vec2 sampleUv=vUv;
  float edge=1.;
  if(vShot>1.5){
    // Reuse the rounded hot end of the same authored frame as a fuller core.
    // This is a second painted layer, with no lit sphere or generated fire.
    vec2 tiled=vUv*vec2(8.,6.),local=fract(tiled);
    sampleUv=(floor(tiled)+mix(vec2(.72,.37),vec2(.985,.63),local))/vec2(8.,6.);
    edge=smoothstep(0.,.16,local.x)*(1.-smoothstep(.92,1.,local.x));
    edge*=smoothstep(0.,.1,local.y)*(1.-smoothstep(.9,1.,local.y));
  }else if(vShot>.5){
    // Give the rounded painted head more room while shortening its tail.
    float x=vUv.x*8.,pad=.5/${atlas.tile}.;
    sampleUv.x=(floor(x)+pad+sqrt(clamp((fract(x)-pad)/(1.-2.*pad),0.,1.))*(1.-2.*pad))/8.;
  }
  vec4 ink=texture2D(map,sampleUv);float alpha=ink.a*vAlpha*edge;if(alpha<.008)discard;
  gl_FragColor=vec4(ink.rgb,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export class HandDrawnFireball{
  constructor(owner,scene){
    this.owner=owner;this.shots=new Map();this.events=[];this.limit=96;this.eventLimit=40;this.clock=0;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
    const texture=this.texture=new CanvasTexture(canvas);texture.colorSpace=SRGB;texture.generateMipmaps=false;texture.minFilter=texture.magFilter=1006;
    const image=new Image();
    this.ready=new Promise(resolve=>{
      const finish=ok=>{clearTimeout(timer);image.onload=image.onerror=null;this.loadError=!ok;resolve(ok);};
      const timer=setTimeout(()=>finish(false),12000);
      image.onload=()=>{if(!this.disposed){texture.image=image;texture.needsUpdate=true;this.loaded=true;}finish(true);};
      image.onerror=()=>finish(false);image.src='assets/vfx/fireball.png';
    });texture.userData.ready=this.ready;
    const geometry=new BufferGeometry();
    geometry.setAttribute('position',new BufferAttribute(new Float32Array([0,0,0,1,0,0,1,1,0,0,1,0]),3));
    geometry.setAttribute('uv',new BufferAttribute(new Float32Array([0,0,1,0,1,1,0,1]),2));geometry.setIndex([0,1,2,0,2,3]);
    this.attributes=['iOrigin','iFrame','iHeading'].map(name=>{const a=new InstanceAttribute(new Float32Array(128*4),4).setUsage(DynamicDraw);geometry.setAttribute(name,a);return a;});
    const material=new ShaderMaterial({uniforms:{map:{value:texture}},vertexShader:vertex,fragmentShader:fragment,transparent:true,depthTest:true,depthWrite:false,side:2,toneMapped:false});
    this.mesh=new InstancedMesh(geometry,material,128);this.mesh.count=0;this.mesh.visible=false;this.mesh.frustumCulled=false;this.mesh.renderOrder=7;this.mesh.name='authored-ember-fireballs';scene.add(this.mesh);
  }
  draw(pool,id,size,opacity){
    const own=!(pool.flags[id]&1);if(!this.owner.allowed(own))return;
    let e=this.shots.get(id);
    if(!e||e.token!==pool.rot[id]&&pool.life[id]>e.life){
      if(!e&&this.shots.size>=this.limit)return;
      e={pool,id,token:pool.rot[id],wake:0};this.shots.set(id,e);
    }
    Object.assign(e,{size,opacity,own,life:pool.life[id],seen:this.clock});
  }
  play(clip,x,y,z,size,own=true,dx=1,dy=0,dz=0){
    if(!this.owner.allowed(own)||this.events.length>=this.eventLimit)return;
    if(this.owner.vfx.view&&!this.owner.vfx.view.visible(x,y,z,size*2))return;
    this.events.push({clip,x,y,z,size,own,dx,dy,dz,age:0});
  }
  impact(x,y,z,own=true){this.play('hit',x,y,z,2.7,own);}
  update(dt){
    dt=Math.max(0,dt);this.clock+=dt;
    if(!this.shots.size&&!this.events.length&&!this.mesh.count)return;
    const v=this.owner.vfx,[origin,frame,heading]=this.attributes.map(a=>a.array);let count=0;
    const push=(x,y,z,width,height,index,anchorX,dx,dy,dz,alpha,kind=0)=>{
      if(count>=this.limit)return;const offset=count++*4;
      origin.set([x,y,z,width],offset);frame.set([height,index,anchorX,kind],offset);heading.set([dx,dy,dz,alpha*v.opacity*(v.calm?.8:1)],offset);
    };
    // Advance existing events before adding new wakes, so a born wake starts at frame zero.
    this.events=this.events.filter(e=>{e.age+=dt;return this.owner.allowed(e.own)&&e.age<atlas.clips[e.clip].count/(e.clip==='wake'?36:30);});
    for(const [id,e] of this.shots){
      const p=e.pool;
      if(!p.alive[id]||!this.owner.allowed(e.own)||this.clock-e.seen>.08){this.shots.delete(id);continue;}
      const age=Math.max(0,p.maxLife[id]-p.life[id]),spec=atlas.clips.shot,size=e.size;
      if(count+2>this.limit)continue;
      const index=spec.first+Math.floor(age*spec.fps)%spec.count;
      push(p.x[id],p.y[id]+.18,p.z[id],size*3.4,size*4.2,index,.72,p.vx[id],p.vy[id],p.vz[id],e.opacity,1);
      push(p.x[id],p.y[id]+.2,p.z[id],size*1.9,size*1.9,index,.5,p.vx[id],p.vy[id],p.vz[id],e.opacity,2);
      e.wake+=dt;
      if(e.wake>=.11&&dt>0){
        e.wake%=.11;const speed=Math.hypot(p.vx[id],p.vz[id])||1;
        this.play('wake',p.x[id]-p.vx[id]/speed*size*.8,p.y[id],p.z[id]-p.vz[id]/speed*size*.8,size*.95,e.own,p.vx[id],p.vy[id],p.vz[id]);
      }
    }
    // Bursts take priority over decorative wakes when a multi-shot skill fills the batch.
    for(const clip of ['hit','wake'])for(const e of this.events){
      if(e.clip!==clip)continue;const spec=atlas.clips[clip],fps=clip==='wake'?36:30;
      const alpha=(e.own?v.ownOpacity:1)*(clip==='wake'?.62:1);
      push(e.x,e.y,e.z,e.size,e.size,spec.first+Math.min(spec.count-1,Math.floor(e.age*fps)),.5,e.dx,e.dy,e.dz,alpha);
    }
    this.mesh.count=this.loaded?count:0;this.mesh.visible=this.mesh.count>0;
    for(const a of this.attributes){a.clearUpdateRanges();a.addUpdateRange(0,count*4);a.needsUpdate=true;}
  }
  setPerformance(profile){this.limit=profile.name==='流畅'?40:profile.name==='均衡'?64:96;this.eventLimit=profile.name==='流畅'?16:profile.name==='均衡'?28:40;}
  clear(){this.shots.clear();this.events.length=0;this.mesh.count=0;this.mesh.visible=false;}
  dispose(){this.disposed=true;this.clear();this.mesh.parent?.remove(this.mesh);this.mesh.geometry.dispose();this.mesh.material.dispose();this.mesh.dispose();this.texture.dispose();}
}
