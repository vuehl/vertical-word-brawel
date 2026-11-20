import {y as BufferGeometry,v as BufferAttribute,B as InstanceAttribute,H as InstancedMesh,ct as ShaderMaterial,j as DynamicDraw} from '../assets/three-DmSYIDKK.js';

const TAU=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const random=n=>{const x=Math.sin(n*127.1+43.7)*43758.5453;return x-Math.floor(x);};

function flameGeometry(){
  const geometry=new BufferGeometry(),positions=[],uv=[],indices=[],rings=12,sides=16;
  for(let j=0;j<=rings;j++)for(let i=0;i<=sides;i++){
    const angle=i/sides*TAU,latitude=(j/rings-.5)*Math.PI;
    positions.push(Math.cos(angle)*Math.cos(latitude),Math.sin(latitude),Math.sin(angle)*Math.cos(latitude));uv.push(i/sides,j/rings);
    if(j<rings&&i<sides){const k=j*(sides+1)+i;indices.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}
  }
  geometry.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));
  geometry.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));geometry.setIndex(indices);return geometry;
}

const vertex=`
attribute vec4 iFlameOrigin;attribute vec4 iFlameMotion;attribute vec4 iFlameLife;
varying vec3 vFlameBound;varying vec3 vFlameEye;varying vec4 vFlameLife;varying float vFlameCore;
void main(){
  vec3 forward=vec3(iFlameMotion.x,0.,iFlameMotion.y),side=vec3(-forward.z,0.,forward.x);
  vec3 extent=vec3(max(iFlameOrigin.w,.025),max(iFlameMotion.z*.5,.025),max(iFlameOrigin.w*(iFlameMotion.w>.5?.30:.88),.025));
  vec3 eye=cameraPosition-iFlameOrigin.xyz;
  vFlameEye=vec3(dot(eye,side),dot(eye,forward),eye.y)/extent;
  vFlameBound=position;vFlameLife=iFlameLife;vFlameCore=iFlameMotion.w;
  vec3 local=side*(position.x*extent.x)+forward*(position.y*extent.y)+vec3(0.,position.z*extent.z,0.);
  gl_Position=projectionMatrix*viewMatrix*vec4(iFlameOrigin.xyz+local,1.);
}`;

const fragment=`
varying vec3 vFlameBound;varying vec3 vFlameEye;varying vec4 vFlameLife;varying float vFlameCore;
uniform int uFireSteps;
float flameHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float flameNoise(vec3 p){
  vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(mix(flameHash(i),flameHash(i+vec3(1.,0.,0.)),f.x),mix(flameHash(i+vec3(0.,1.,0.)),flameHash(i+vec3(1.,1.,0.)),f.x),f.y),
    mix(mix(flameHash(i+vec3(0.,0.,1.)),flameHash(i+vec3(1.,0.,1.)),f.x),mix(flameHash(i+vec3(0.,1.,1.)),flameHash(i+vec3(1.,1.,1.)),f.x),f.y),f.z);
}
void main(){
  // Integrate burning density INSIDE each moving gas packet. The mesh is only
  // a bound: it has no painted surface or closed leaf-shaped flame skin.
  vec3 ray=normalize(vFlameBound-vFlameEye);
  float b=dot(vFlameEye,ray),c=dot(vFlameEye,vFlameEye)-1.;
  float disc=b*b-c;if(disc<=0.)discard;
  float root=sqrt(disc),near=max(0.,-b-root),far=-b+root;
  float stepSize=(far-near)/float(uFireSteps),p=vFlameLife.x,age=vFlameLife.w;
  float erosion=mix(.10,.82,smoothstep(.48,1.,p));
  vec4 fire=vec4(0.);
  for(int i=0;i<10;i++){
    if(i>=uFireSteps)break;
    vec3 q=vFlameEye+ray*(near+(float(i)+.5)*stepSize);
    q.x+=sin(q.y*5.-age*8.+vFlameLife.z)*.13;
    q.z+=sin(q.y*4.+age*7.+vFlameLife.z)*.10;
    vec3 flow=q*2.7+vec3(vFlameLife.z,-age*4.2,age*1.3);
    bool core=vFlameCore>.5;
    float u=q.y*.5+.5;
    if(core)flow=vec3(q.x*3.5,q.y*5.5-age*14.,q.z*3.5+vFlameLife.z);
    float noise=flameNoise(flow)*.72+flameNoise(flow*2.03+7.1)*.28;
    float taper=1.-q.y*.22;
    vec3 shape=q/vec3(.88*taper,1.,.88*taper);
    float shell=1.-dot(shape,shape);
    float density;
    if(core){
      vec2 section=vec2(q.x/max(.035,u*1.2),(q.z-u*u*.25)/(.16+u*.42));
      float fuel=smoothstep(p-.05,p+.10,u)*(1.-smoothstep(.68+noise*.16,.79+noise*.16,u));
      density=max(0.,1.-dot(section,section)+(noise-.5)*1.65-.24)*fuel;
    }else density=max(0.,shell+(noise-.5)*.65-erosion*.55);
    // Temperature follows fuel age along the stream. A density-based hot
    // spot on every packet reads as a chain of glowing balls.
    float heat=clamp(.94-(core?u*.55:p)*.82-length(q.xz)*.16+(noise-.5)*.12+q.y*.04,0.,1.);
    vec3 colour=mix(vec3(.92,.025,.002),vec3(1.,.22,.006),smoothstep(.12,.43,heat));
    colour=mix(colour,vec3(1.,.64,.04),smoothstep(.43,.75,heat));
    colour=mix(colour,vec3(1.,.96,.59),smoothstep(.76,.99,heat));
    if(!core)colour=mix(colour,vec3(.38,.07,.012),smoothstep(.76,1.,p)*.5);
    float alpha=1.-exp(-density*stepSize*4.2);
    fire.rgb+=(1.-fire.a)*colour*alpha;fire.a+=(1.-fire.a)*alpha;
  }
  float alpha=fire.a*vFlameLife.y;if(alpha<.003)discard;
  gl_FragColor=vec4(fire.rgb/max(fire.a,.001),alpha);
}`;

// One bounded draw of independently born, advected and extinguished 3D tongues.
// No texture, sprite atlas or repeating flipbook is used by the flame body.
export class ProceduralFireJet{
  constructor(owner,scene){
    this.owner=owner;this.packets=[];this.serial=0;this.spawned=0;this.expired=0;this.limit=112;this.packetLimit=112;this.rate=48;this.clock=0;
    const geometry=flameGeometry(),capacity=112;
    this.attributes=['iFlameOrigin','iFlameMotion','iFlameLife'].map(name=>{
      const attribute=new InstanceAttribute(new Float32Array(capacity*4),4).setUsage(DynamicDraw);geometry.setAttribute(name,attribute);return attribute;
    });
    const material=new ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{uFireSteps:{value:10}},transparent:true,depthTest:true,depthWrite:false,side:0});
    this.mesh=new InstancedMesh(geometry,material,capacity);this.mesh.count=0;this.mesh.frustumCulled=false;
    this.mesh.name='procedural-fire-tongues';this.mesh.renderOrder=7.2;this.mesh.visible=false;scene.add(this.mesh);
  }
  setPerformance(profile){
    this.limit=profile.name==='流畅'?40:profile.name==='均衡'?72:112;
    this.rate=profile.name==='流畅'?28:profile.name==='均衡'?38:48;
    this.mesh.material.uniforms.uFireSteps.value=profile.name==='流畅'?6:profile.name==='均衡'?8:10;
    if(this.packets.length>this.limit)this.packets.length=this.limit;
  }
  spawn(emitter,age){
    if(this.packets.length>=this.packetLimit)return;
    const n=this.serial++,a=random(n+1),b=random(n+17),c=random(n+63);
    const ignition=smooth(emitter.age/.20);
    // Fill the existing damage fan without fixed parallel fingers or empty
    // side sectors. Every packet still starts at the same small nozzle.
    const fan=((n*.61803398875)%1)*2-1;
    const spread=fan*.73*(.3+ignition*.7);
    const angle=emitter.angle+spread,scale=Math.sqrt(emitter.length/7);
    this.packets.push({id:n,age,life:.52+b*.19,seed:c*TAU,dx:Math.cos(angle),dz:Math.sin(angle),
      x:emitter.x,y:emitter.y,z:emitter.z,length:emitter.length*(.86+a*.14),
      radius:(.38+b*.30)*scale,stretch:(.85+c*.35)*scale,lift:.45+c*.7,own:emitter.own!==false});
    this.spawned++;
  }
  sample(packet){
    const p=clamp(packet.age/packet.life),grow=smooth(p/.58),shrink=1.-smooth((p-.65)/.35)*.64;
    const travel=packet.length*p*(1.3-.3*p),sway=(Math.sin(p*7.+packet.seed)-Math.sin(packet.seed))*p*.22;
    const birth=smooth(packet.age/.07),fade=1.-smooth((p-.62)/.38);
    return {p,x:packet.x+packet.dx*travel-packet.dz*sway,y:packet.y+.06+Math.pow(p,1.7)*packet.lift,
      z:packet.z+packet.dz*travel+packet.dx*sway,radius:packet.radius*(.10+grow*.90)*shrink,
      length:packet.stretch*(.45+grow*(1.20+Math.sin(p*Math.PI)*.60))*shrink,alpha:birth*fade};
  }
  update(dt,emitters){
    const owner=this.owner,run=owner.run;this.clock+=Math.max(0,dt);
    this.packetLimit=Math.max(0,this.limit-emitters.length);
    for(let i=this.packets.length-1;i>=0;i--){
      const p=this.packets[i];p.age+=Math.max(0,dt);
      if(p.age>=p.life||!owner.allowed(p.own)){this.packets.splice(i,1);this.expired++;}
    }
    if(this.packets.length>this.packetLimit){this.packets.sort((a,b)=>a.age-b.age);this.packets.length=this.packetLimit;}
    if(dt>0)for(const emitter of emitters){
      if(emitter.fireTouched){
        emitter.fireLast=this.clock;
        // Gentle pressure beats vary birth spacing; existing tongues continue
        // through each beat rather than flashing the complete jet on and off.
        const pressure=.88+.12*Math.sin(emitter.age*TAU*4.7+emitter.seed);
        const step=1./(this.rate*pressure);emitter.fireAcc=(emitter.fireAcc||0)+dt;
        let births=0;
        while(emitter.fireAcc>=step&&births++<8){emitter.fireAcc-=step;this.spawn(emitter,emitter.fireAcc);}
      }
      emitter.fireTouched=false;
    }
    const camera=run.r.camera.position,instances=[];
    for(const packet of this.packets){packet.sample=this.sample(packet);instances.push({...packet.sample,alpha:packet.sample.alpha*.88,dx:packet.dx,dz:packet.dz,seed:packet.seed,age:packet.age,own:packet.own});}
    // A continuous, noisy volume links the separately lived vortices. Its fuel
    // front grows from the nozzle and clears forwards when emission stops.
    for(const emitter of emitters){
      const growth=smooth(emitter.age/.24),length=emitter.length*.55*growth;
      if(length<.025)continue;
      const dx=Math.cos(emitter.angle),dz=Math.sin(emitter.angle),tail=clamp((this.clock-(emitter.fireLast??this.clock))/.10);
      instances.push({x:emitter.x+dx*length*.5,y:emitter.y+.20,z:emitter.z+dz*length*.5,radius:length*.36,
        length,dx,dz,p:tail,alpha:.78*growth*(1.-smooth((tail-.6)/.4)),seed:emitter.seed,age:emitter.age,core:1,own:emitter.own!==false});
    }
    for(const p of instances)p.depth=(p.x-camera.x)**2+(p.y-camera.y)**2+(p.z-camera.z)**2;
    instances.sort((a,b)=>b.depth-a.depth);
    const [origin,motion,life]=this.attributes.map(a=>a.array);
    instances.forEach((p,i)=>{
      const o=i*4,opacity=owner.vfx.opacity*(p.own?owner.vfx.ownOpacity:1)*(owner.vfx.calm?.78:1);
      origin.set([p.x,p.y,p.z,p.radius],o);motion.set([p.dx,p.dz,p.length,p.core||0],o);
      life.set([p.p,p.alpha*opacity,p.seed,p.age],o);
    });
    this.mesh.count=instances.length;this.mesh.visible=this.mesh.count>0;
    for(const attribute of this.attributes){attribute.clearUpdateRanges();attribute.addUpdateRange(0,this.mesh.count*4);attribute.needsUpdate=true;}
  }
  clear(){this.packets.length=0;this.mesh.count=0;this.mesh.visible=false;}
  dispose(){this.clear();this.mesh.parent?.remove(this.mesh);this.mesh.geometry.dispose();this.mesh.material.dispose();this.mesh.dispose();}
}
