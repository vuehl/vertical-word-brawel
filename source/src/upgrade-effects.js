import {y as BufferGeometry,v as BufferAttribute,B as InstanceAttribute,H as InstancedMesh,ct as ShaderMaterial,j as DynamicDraw} from '../assets/three-DmSYIDKK.js';

// Reconstruct the supplied recording's gold orbit / contraction / reveal without
// baking its desk or 炎 glyph into the effect. All forms share this one batch.
function geometry(){
  const positions=[],uv=[],parts=[],indices=[];
  const vertex=(u,v,part)=>{positions.push(0,0,0);uv.push(u,v);parts.push(part);};
  for(let ring=0;ring<2;ring++){
    const first=parts.length;
    for(let i=0;i<=128;i++){vertex(i/128,0,ring);vertex(i/128,1,ring);}
    for(let i=0;i<128;i++){const a=first+i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  for(let part=2;part<19;part++){
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
        void main(){
          vUv=uv;kind=part;
          float age=effectTime.x,reveal=effectTime.y,h=originSize.w;
          float progress=clamp(age/max(reveal,.001),0.,1.);
          float ending=1.-smoothstep(reveal+.08,effectTime.z,age);
          alpha=effectTime.w*smoothstep(0.,.12,age)*ending;
          vec4 p=viewMatrix*vec4(originSize.xyz,1.);
          p.y+=h*.48;
          head=1.;depthSide=1.;
          if(part<1.5){
            float a=uv.x*TAU;
            float tilt=age*.9+part*1.8;
            float ellipse=.30+.48*abs(sin(age*.65+part*1.7));
            float radius=h*(.93-part*.06)*(1.-.74*smoothstep(.76,1.,progress));
            radius+=h*.92*smoothstep(reveal,reveal+.18,age);
            vec2 q=vec2(cos(a),sin(a)*ellipse);
            vec2 tangent=normalize(vec2(-sin(a),cos(a)*ellipse));
            vec2 normal=vec2(-tangent.y,tangent.x);
            float trail=fract(uv.x-age*(1.1+progress*.5)+part*.5);
            head=.25+.75*pow(trail,1.7);
            float width=h*(.12+.12*head);
            q=q*radius+normal*(uv.y-.5)*width;
            p.xy+=mat2(cos(tilt),sin(tilt),-sin(tilt),cos(tilt))*q;
            depthSide=sin(a);
            p.z+=sin(a)*h*.48;
            alpha*=1.-smoothstep(reveal+.05,reveal+.35,age);
            if(part>.5)alpha*=smoothstep(.12,.35,progress);
          }else if(part<17.5){
            float seed=part*2.39996;
            float life=fract(age*.65+part*.173);
            float r=h*(.65+.7*fract(part*.618));
            vec2 q=vec2(cos(seed)*r,sin(seed)*r*.65+(life-.5)*h*.65);
            float size=h*(.045+.035*fract(part*.371));
            p.xy+=q+(uv-.5)*size;
            p.z+=.2;
            alpha*=sin(life*3.14159)*.75;
          }else{
            float pulse=smoothstep(reveal-.08,reveal,age)*(1.-smoothstep(reveal,reveal+.32,age));
            p.xy+=(uv-.5)*h*4.;p.z+=h*.65;
            alpha*=pulse*(1.-calm*.82);
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
          float light,core;
          if(kind<1.5){
            float d=abs(vUv.y-.5)*2.;
            core=exp(-d*d*70.);
            light=core+exp(-d*d*12.)*.65+exp(-d*d*3.)*.16;
            light*=head;
          }else if(kind<17.5){
            vec2 q=abs(vUv-.5)*2.;
            core=pow(max(0.,1.-q.x-q.y),7.);
            light=core+pow(max(0.,1.-min(q.x,q.y)*6.-max(q.x,q.y)),2.);
          }else{
            vec2 q=(vUv-.5)*2.;
            float d=length(q);
            core=exp(-d*d*90.);
            light=core+exp(-d*d*12.)*.28+exp(-q.y*q.y*2200.-q.x*q.x*4.)*.5;
          }
          float a=clamp(light*alpha,0.,1.);
          if(a<.003)discard;
          gl_FragColor=vec4(mix(vec3(1.,.64,.12),vec3(1.,.98,.79),clamp(core,0.,1.)),a);
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
  play(actor=this.run.player,evolution=false,reveal=3.6){
    if(this.disposed||this.run.hideOwnFx)return;
    // Consecutive levels coalesce, and an evolution replaces the short pulse.
    const previous=this.events.findIndex(e=>e.actor===actor);
    if(previous>=0)this.events.splice(previous,1);
    if(this.events.length>=this.origin.count)this.events.shift();
    const height=Math.max(1.9,Math.min(2.55,this.run.sprites.get(actor.speciesId).bodyHeight()*1.3));
    this.events.push({actor,height,age:0,reveal:evolution?reveal:.9,duration:evolution?reveal+.65:1.45});
    this.update(0);
  }
  update(dt){
    if(this.run.hideOwnFx){this.clear();return;}
    const fx=this.run.vfx;
    this.mesh.material.uniforms.calm.value=fx.calm?1:0;
    this.mesh.count=0;
    for(let i=this.events.length-1;i>=0;i--){
      const e=this.events[i];e.age+=Math.max(0,dt);
      if(e.age>=e.duration||e.actor.dead){this.events.splice(i,1);continue;}
      const p=e.actor.pos,j=this.mesh.count++,scale=e.actor.renderScale??1;
      this.origin.setXYZW(j,p.x,p.y+.08,p.z,e.height*scale);
      this.timing.setXYZW(j,e.age,e.reveal,e.duration,fx.opacity*fx.ownOpacity*(fx.calm?.7:1));
    }
    this.mesh.visible=this.mesh.count>0;
    this.rearMesh.count=this.mesh.count;this.rearMesh.visible=this.mesh.visible;
    if(this.mesh.visible)this.origin.needsUpdate=this.timing.needsUpdate=true;
  }
  clear(){this.events.length=0;this.mesh.count=this.rearMesh.count=0;this.mesh.visible=this.rearMesh.visible=false;}
  dispose(){
    this.disposed=true;this.clear();this.mesh.geometry.dispose();
    for(const mesh of [this.mesh,this.rearMesh]){mesh.parent?.remove(mesh);mesh.material.dispose();mesh.dispose();}
  }
}
