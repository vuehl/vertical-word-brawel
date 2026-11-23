import {y as BufferGeometry,v as BufferAttribute,B as InstanceAttribute,H as InstancedMesh,ct as ShaderMaterial,j as DynamicDraw} from '../assets/three-DmSYIDKK.js';
import {WindAtlasBatch} from './wind-vortex.js';

// jinhua.gif flashes into the new form at frame 126. The game clock drives
// both the effect and the actual species change, including at low frame rates.
export const EVOLUTION_REVEAL=1.8;
export const EVOLUTION_DURATION=3.3;

// Frames 92–123 have a 20 ms delay. The rest use 40 ms. Preserve those
// relative speeds while aligning frame 126 with the gameplay reveal.
function lightFrame(age,reveal,duration){
  const time=age<reveal?4.4*age/reveal:4.4+1.8*(age-reveal)/(duration-reveal);
  const frame=time<3.68?time*25:time<4.32?92+(time-3.68)*50:124+(time-4.32)*25;
  return Math.floor(frame/2+1e-6);
}

function geometry(){
  const positions=[],uv=[],parts=[],indices=[];
  const vertex=(u,v,part)=>{positions.push(0,0,0);uv.push(u,v);parts.push(part);};
  for(let ring=0;ring<2;ring++){
    const first=parts.length;
    for(let i=0;i<=128;i++){vertex(i/128,0,ring);vertex(i/128,1,ring);}
    for(let i=0;i<128;i++){const a=first+i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  for(let part=2;part<20;part++){
    const a=parts.length;vertex(0,0,part);vertex(1,0,part);vertex(0,1,part);vertex(1,1,part);
    indices.push(a,a+1,a+2,a+1,a+3,a+2);
  }
  const g=new BufferGeometry();
  g.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));
  g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));
  g.setAttribute('part',new BufferAttribute(new Float32Array(parts),1));g.setIndex(indices);return g;
}

export class UpgradeEffects {
  constructor(run,scene){
    this.run=run;this.events=[];
    const g=geometry(),capacity=8;
    this.light=new WindAtlasBatch(scene,capacity,'assets/vfx/evolution-light.webp',8,9,160,'evolution-light');
    this.light.mesh.renderOrder=7.1;
    this.light.mesh.material.depthTest=false;
    this.origin=new InstanceAttribute(new Float32Array(capacity*4),4).setUsage(DynamicDraw);
    this.timing=new InstanceAttribute(new Float32Array(capacity*4),4).setUsage(DynamicDraw);
    g.setAttribute('originSize',this.origin);g.setAttribute('effectTime',this.timing);
    const material=new ShaderMaterial({transparent:true,depthWrite:false,side:2,toneMapped:false,
      uniforms:{calm:{value:0},layer:{value:1}},
      vertexShader:`
        attribute vec4 originSize,effectTime;
        attribute float part;
        uniform float calm;
        varying vec2 vUv;
        varying float kind,alpha,head,depthSide;
        const float TAU=6.2831853;
        // Ellipse tilt, aspect and radius sampled in source GIF frame units.
        vec3 orbitPose(float f){
          vec3 pose=vec3(-.33,.24,1.15);
          pose=mix(pose,vec3(-.45,.30,1.02),smoothstep(36.,48.,f));
          pose=mix(pose,vec3(-1.03,.72,.66),smoothstep(48.,61.,f));
          pose=mix(pose,vec3(-.80,.51,.88),smoothstep(62.,72.,f));
          pose=mix(pose,vec3(-.40,.27,1.16),smoothstep(72.,82.,f));
          pose=mix(pose,vec3(-.92,.56,.74),smoothstep(87.,97.,f));
          pose=mix(pose,vec3(-1.18,.68,.24),smoothstep(99.,111.,f));
          return mix(pose,vec3(-1.25,.72,.30),smoothstep(117.,123.,f));
        }
        void main(){
          vUv=uv;kind=part;
          float age=effectTime.x,reveal=effectTime.y,h=originSize.w;
          float progress=clamp(age/max(reveal,.001),0.,1.);
          float seconds=progress*4.4;
          float frame=seconds<3.68?seconds*25.:seconds<4.32?92.+(seconds-3.68)*50.:124.+(seconds-4.32)*25.;
          float ending=1.-smoothstep(reveal+.08,effectTime.z,age);
          alpha=effectTime.w*smoothstep(0.,.12,age)*ending;
          vec4 p=viewMatrix*vec4(originSize.xyz,1.);
          p.y+=h*.48;
          head=1.;depthSide=1.;
          if(part<1.5){
            vec3 pose=orbitPose(frame);
            float release=smoothstep(reveal-.045,reveal+.14,age);
            float a=uv.x*TAU;
            float tilt=part<.5?pose.x:mix(.47,1.48,smoothstep(53.,81.,frame));
            float ellipse=part<.5?pose.y:mix(.36,.23,smoothstep(68.,85.,frame));
            float radius=h*mix(pose.z,part<.5?1.85:2.05,release);
            tilt=mix(tilt,-.40,release);
            ellipse=mix(ellipse,part<.5?.29:.94,release);
            vec2 q=vec2(cos(a),sin(a)*ellipse);
            vec2 tangent=normalize(vec2(-sin(a),cos(a)*ellipse));
            vec2 normal=vec2(-tangent.y,tangent.x);
            float trail=fract(uv.x-frame*.034+part*.43);
            head=smoothstep(.04,.84,trail)*(1.-smoothstep(.94,1.,trail));
            float width=h*mix(.16,.35,release);
            q=q*radius+normal*(uv.y-.5)*width;
            p.xy+=mat2(cos(tilt),sin(tilt),-sin(tilt),cos(tilt))*q;
            depthSide=sin(a);
            p.z+=sin(a)*h*.48;
            alpha*=smoothstep(16.,22.,frame)*(1.-smoothstep(reveal+.045,reveal+.22,age));
            if(part>.5)alpha*=smoothstep(30.,40.,frame);
          }else if(part<17.5){
            float seed=part*2.39996;
            float life=fract(age*.65+part*.173);
            float r=h*(.85+.8*fract(part*.618));
            vec2 q=vec2(cos(seed)*r,sin(seed)*r*.65+(life-.5)*h*.65);
            float size=h*(.055+.045*fract(part*.371));
            p.xy+=q+(uv-.5)*size;
            p.z+=.2;
            alpha*=sin(life*3.14159)*.65*smoothstep(.48,.8,age)*
              (1.-.8*smoothstep(1.2,1.6,age)*(1.-smoothstep(reveal,reveal+.3,age)));
          }else if(part<18.5){
            float pulse=smoothstep(reveal-.07,reveal,age)*(1.-smoothstep(reveal+.03,reveal+.24,age));
            float f=frame;
            float charge=exp(-pow(abs(f-90.)/2.5,2.))+exp(-pow(abs(f-102.)/2.5,2.))+exp(-pow(abs(f-120.)/3.,2.));
            pulse=max(pulse,charge*.42*(1.-calm));
            p.xy+=(uv-.5)*h*4.8;p.z+=h*.65;
            alpha*=pulse*(1.-calm*.82);
          }else{
            // Darken the desk behind the gathering light, fading before the burst.
            depthSide=-1.;
            p.xy+=(uv-.5)*h*5.8;
            alpha*=smoothstep(0.,.28,progress)*(.12+.30*smoothstep(84.,120.,frame))
              *(1.-smoothstep(reveal-.06,reveal+.045,age))*(1.-calm*.75);
          }
          gl_Position=projectionMatrix*p;
        }`,
      fragmentShader:`
        varying vec2 vUv;
        varying float kind,alpha,head,depthSide;
        uniform float layer;
        void main(){
          // Glyphs don't write depth. Split arcs around their render order so
          // the supplied orbit really passes behind and in front of any form.
          if(layer*depthSide<0.)discard;
          if(kind>18.5){
            float shade=alpha*(1.-smoothstep(.12,1.,length((vUv-.5)*2.)));
            if(shade<.003)discard;
            gl_FragColor=vec4(0.,0.,0.,shade);
            return;
          }
          float light,core;
          if(kind<1.5){
            float d=abs(vUv.y-.5)*2.;
            core=exp(-d*d*50.);
            light=core+exp(-d*d*12.)*.65+exp(-d*d*3.)*.16;
            light*=head;
          }else if(kind<17.5){
            vec2 q=abs(vUv-.5)*2.;
            core=0.;
            light=pow(max(0.,1.-min(q.x,q.y)*5.-max(q.x,q.y)),1.4);
          }else{
            vec2 q=(vUv-.5)*2.;
            float d=length(q);
            core=exp(-d*d*90.);
            light=core*3.+exp(-d*d*22.)*.8+exp(-q.y*q.y*4200.-q.x*q.x*3.)*2.;
          }
          float a=clamp(light*alpha,0.,1.);
          if(a<.003)discard;
          vec3 color=mix(vec3(1.,.75,.27),vec3(1.,1.,.88),clamp(core,0.,1.));
          if(kind>1.5&&kind<17.5)color=vec3(.87,.39,.50);
          if(kind>17.5)color=mix(vec3(1.,.83,.43),vec3(1.),clamp(light,0.,1.));
          gl_FragColor=vec4(color,a);
          #include <colorspace_fragment>
        }`,
    });
    this.mesh=new InstancedMesh(g,material,capacity);this.mesh.name='shared-upgrade-orbits';
    this.mesh.frustumCulled=false;this.mesh.renderOrder=7;
    const rearMaterial=material.clone();rearMaterial.uniforms.calm=material.uniforms.calm;rearMaterial.uniforms.layer.value=-1;
    this.rearMesh=new InstancedMesh(g,rearMaterial,capacity);this.rearMesh.name='shared-upgrade-orbits-rear';
    this.rearMesh.frustumCulled=false;this.rearMesh.renderOrder=.9;
    this.clear();scene.add(this.rearMesh,this.mesh);
  }
  prepare(){
    return this.loading??=this.light.texture.userData.load().then(loaded=>{
      if(loaded&&!this.disposed)this.run.r.renderer.initTexture(this.light.texture);
      else this.loading=null;
    });
  }
  play(actor=this.run.player,evolution=false,reveal=EVOLUTION_REVEAL){
    if(this.disposed||this.run.hideOwnFx)return;
    // Consecutive levels coalesce, and an evolution replaces the short pulse.
    const previous=this.events.findIndex(e=>e.actor===actor);
    if(previous>=0)this.events.splice(previous,1);
    if(this.events.length>=this.origin.count)this.events.shift();
    const height=Math.max(1.9,Math.min(2.55,this.run.sprites.get(actor.speciesId).bodyHeight()*1.3));
    if(evolution&&!this.light.loaded)this.prepare();
    this.events.push({actor,height,evolution,age:0,reveal:evolution?reveal:.9,duration:evolution?reveal+EVOLUTION_DURATION-EVOLUTION_REVEAL:1.45});
    this.update(0);
  }
  update(dt){
    if(this.run.hideOwnFx){this.clear();return;}
    const fx=this.run.vfx;
    this.mesh.material.uniforms.calm.value=fx.calm?1:0;
    this.mesh.count=0;
    this.light.clear();
    for(let i=this.events.length-1;i>=0;i--){
      const e=this.events[i];e.age+=Math.max(0,dt);
      if(e.age>=e.duration||e.actor.dead){this.events.splice(i,1);continue;}
      const p=e.actor.pos,j=this.mesh.count++,scale=e.actor.renderScale??1;
      this.origin.setXYZW(j,p.x,p.y+.08,p.z,e.height*scale);
      const opacity=fx.opacity*fx.ownOpacity*(fx.calm?.7:1);
      this.timing.setXYZW(j,e.age,e.reveal,e.duration,opacity);
      if(e.evolution){
        const frame=lightFrame(e.age,e.reveal,e.duration);
        if(frame<72){
          // In the padded square image the center sits 0.48 actor heights
          // above the ground, matching the procedural orbit.
          const isBurst=frame>=61&&frame<=66;
          const fade=fx.calm?(isBurst?.18:.55):1;
          this.light.push(p.x,p.y+.08,p.z,e.height*scale*4,frame,opacity*fade,.38);
        }
      }
    }
    this.light.end();
    this.mesh.visible=this.mesh.count>0;
    this.rearMesh.count=this.mesh.count;this.rearMesh.visible=this.mesh.visible;
    if(this.mesh.visible)this.origin.needsUpdate=this.timing.needsUpdate=true;
  }
  clear(){this.events.length=0;this.mesh.count=this.rearMesh.count=0;this.mesh.visible=this.rearMesh.visible=false;this.light.clear();}
  dispose(){
    this.disposed=true;this.clear();this.mesh.geometry.dispose();
    this.light.dispose();
    for(const mesh of [this.mesh,this.rearMesh]){mesh.parent?.remove(mesh);mesh.material.dispose();mesh.dispose();}
  }
}
