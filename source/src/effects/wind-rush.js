import {y as BufferGeometry,v as BufferAttribute,B as InstanceAttribute,H as InstancedMesh,ct as ShaderMaterial,j as DynamicDraw,K as Mesh,ht as Vector3,et as PlaneGeometry} from '../vendor/three-DmSYIDKK.js';
import {speedBuff} from '../data/starter-characters.js';
import {VFX_SCALE} from './visual-scale.js';

const windRushRadius=3.4,windRushBurstRadius=5.8;
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));
function brushGeometry(){
  const p=[],uv=[],index=[],n=64;
  for(let i=0;i<=n;i++)for(let j=0;j<2;j++){p.push(0,0,0);uv.push(i/n,j);}
  for(let i=0;i<n;i++){const k=i*2;index.push(k,k+1,k+2,k+1,k+3,k+2);}
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));
  g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(index);return g;
}
function funnelGeometry(){
  const p=[],uv=[],index=[],around=72,up=32;
  for(let y=0;y<=up;y++)for(let x=0;x<=around;x++){p.push(0,0,0);uv.push(x/around,y/up);}
  for(let y=0;y<up;y++)for(let x=0;x<around;x++){
    const i=y*(around+1)+x;index.push(i,i+1,i+around+1,i+1,i+around+2,i+around+1);
  }
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));
  g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(index);return g;
}
const funnelVertex=`
uniform vec3 focus,lean;uniform float clock,radius,height;
varying vec2 vUv;varying float vFront;
void main(){
  float h=uv.y,a=uv.x*6.2831853;
  float r=radius*(.12+.88*pow(h,.80));
  r*=1.+.018*sin(3.*a+clock*2.4+h*6.);
  vec3 p=vec3(cos(a)*r,.08+h*height,sin(a)*r)+lean*h*h;
  vFront=(viewMatrix*vec4(p.x,0.,p.z,0.)).z;vUv=uv;
  gl_Position=projectionMatrix*viewMatrix*vec4(focus+p*${VFX_SCALE},1.);
}`;
const funnelFragment=`
uniform float clock,opacity,halfPass;
varying vec2 vUv;varying float vFront;
float cyclic(float phase){return abs(fract(phase+.5)-.5);}
void main(){
  if(vFront*halfPass<0.)discard;
  float h=vUv.y,a=vUv.x*6.2831853,flow=a+clock*8.7;
  float phase=flow/6.2831853-h*2.12;
  float d=cyclic(phase+.018*sin(flow*2.-h*9.));
  float pressure=.112+.024*sin(flow+h*7.)+.010*sin(flow*3.-h*5.);
  float band=1.-smoothstep(pressure*.65,pressure+.052,d);
  float veil=1.-smoothstep(pressure+.02,pressure+.15,d);
  float edge=cyclic(phase+.035+.013*sin(flow*2.-h*9.));
  float ink=1.-smoothstep(.007,.029,edge);
  float loaded=.45+.55*smoothstep(-.65,.75,sin(flow-h*6.3));
  ink*=loaded;
  float fine=1.-smoothstep(.008,.035,cyclic(phase+.29+h*.16));
  fine*=.35+.65*smoothstep(-.35,.8,sin(flow*1.4+h*4.));
  float envelope=smoothstep(.015,.13,h)*(1.-smoothstep(.77,1.,h));
  float strokes=.91+.09*sin(flow*12.+h*19.)*sin(h*31.-flow*2.);
  float alpha=(.055+.22*veil+.78*band+.34*ink+.10*fine)*envelope*strokes*opacity;
  alpha=min(.94,alpha)*(halfPass>0.?.82:1.);
  vec3 pigment=mix(vec3(.075,.48,.31),vec3(.29,.77,.57),band);
  pigment=mix(pigment,vec3(.87,.99,.91),max(ink*.94,fine*.54));
  if(alpha<.008)discard;
  gl_FragColor=vec4(pigment,alpha);
  #include <colorspace_fragment>
}`;
const mistVertex=`
uniform vec3 focus;uniform float radius;
varying vec2 q;
void main(){q=(uv-.5)*2.;gl_Position=projectionMatrix*viewMatrix*vec4(focus+vec3(q.x*radius*.64,.05,q.y*radius*.64)*${VFX_SCALE},1.);}
`;
const mistFragment=`
uniform float clock,opacity;varying vec2 q;
void main(){
  float r=length(q),a=atan(q.y,q.x);
  float curl=.5+.5*sin(r*19.-a*3.+clock*9.+.7*sin(a*5.+r*8.));
  float alpha=(.055+.12*curl)*exp(-2.7*r*r)*smoothstep(0.,.16,r)*(1.-smoothstep(.7,1.,r))*opacity;
  gl_FragColor=vec4(mix(vec3(.56,.69,.63),vec3(.83,.94,.87),curl),alpha);
  #include <colorspace_fragment>
}`;
const vertex=`
attribute vec4 originScale;attribute vec4 arc;attribute vec4 shape;attribute vec4 pigment;attribute vec4 motion;
varying vec2 vUv;varying vec4 vPigment;varying float vFront;varying float vSweep;
void main(){
  float u=uv.x,v=uv.y*2.-1.;
  float pressure=pow(max(0.,sin(3.14159265*u)),.64);
  pressure*=.88+.12*sin(5.2*u+pigment.x);
  float a=arc.x+arc.y*u+motion.x*pigment.z;
  vSweep=step(2.5,shape.w);
  if(shape.w>2.5){
    pressure*=.38+.62*smoothstep(-.6,.7,sin(u*12.56637+pigment.x));
    float r=shape.x*(.12+.88*pow(u,.80));
    vec3 drift=vec3(motion.z,0.,motion.w);
    vec3 local=vec3(cos(a)*r,arc.z+shape.y*u,sin(a)*r)+drift*u*u;
    float dr=shape.x*.704*pow(max(.001,u),-.20);
    vec3 tangent=vec3(cos(a)*dr-sin(a)*r*arc.y,shape.y,sin(a)*dr+cos(a)*r*arc.y)+2.*u*drift;
    vec2 direction=normalize((viewMatrix*vec4(tangent,0.)).xy);
    vec4 point=viewMatrix*vec4(originScale.xyz+local*${VFX_SCALE},1.);
    point.xy+=vec2(-direction.y,direction.x)*v*arc.w*pressure*${VFX_SCALE};
    gl_Position=projectionMatrix*point;
    vFront=(viewMatrix*vec4(local.x,0.,local.z,0.)).z;
    vUv=uv;vPigment=pigment;vPigment.w*=motion.y;return;
  }
  float radius=shape.x*(1.+.018*sin(a*3.+pigment.x));
  float height=arc.z+shape.y*(u-.5);
  if(shape.w>1.5){
    radius=shape.x+shape.y*u;
    a+=v*arc.w*pressure/max(.3,radius);
    height+=shape.z*sin(3.14159265*u);
  }else if(shape.w>.5){
    radius+=v*arc.w*pressure;
    height+=.025*sin(a*2.+pigment.x);
  }else{
    radius+=v*shape.z*pressure;
    height+=v*arc.w*pressure+.10*sin(u*6.4+pigment.x)+.21*pow(u,4.);
  }
  vec3 local=vec3(cos(a)*radius,height,sin(a)*radius)*originScale.w;
  vec3 world=originScale.xyz+local*${VFX_SCALE};
  vFront=(viewMatrix*vec4(local.x,0.,local.z,0.)).z;
  gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
  vUv=uv;vPigment=pigment;vPigment.w*=motion.y;
}`;
const fragment=`
uniform float halfPass;
varying vec2 vUv;varying vec4 vPigment;varying float vFront;varying float vSweep;
void main(){
  // Separate near and far sweeps while retaining the scene's real depth.
  if(vFront*halfPass<0.)discard;
  float u=vUv.x,v=vUv.y*2.-1.,seed=vPigment.x;
  float aa=max(.018,fwidth(v));
  if(vSweep>.5){
    float feather=1.-smoothstep(.45,1.,abs(v));
    float pigment=.5+.5*sin(u*10.+seed);
    float white=smoothstep(-.56,.25,v+.12*sin(u*11.+seed));
    vec3 wind=mix(vec3(.12,.65,.38),vec3(.40,.83,.62),smoothstep(-.8,.35,v));
    wind=mix(wind,vec3(.90,1.,.94),white*(.65+.35*pigment));
    float alpha=feather*vPigment.w*(.35+.65*pigment);
    if(alpha<.008)discard;
    gl_FragColor=vec4(wind,alpha);
    #include <colorspace_fragment>
    return;
  }
  float edge=1.-smoothstep(1.-aa*1.5,1.,abs(v));
  // One swept cut per mark breaks a uniform band into a long wind claw.
  // Its edge is an intentional tapered stroke, not high-frequency noise.
  float notch=max(0.,1.-abs((u-(.52+.08*sin(seed)))/.15));
  float upper=1.-.48*notch;
  edge*=1.-smoothstep(upper-aa,upper+aa,v);
  float nib=.13+.16*sin(5.8*u+seed)+.16*u;
  float width=.14+.10*sin(3.14159265*u);
  float loaded=1.-smoothstep(width-aa,width+aa,abs(v-nib));
  float hair=1.-smoothstep(.035,.035+aa,abs(v+.53+.09*sin(8.*u+seed)));
  hair*=smoothstep(.07,.20,u)*(1.-smoothstep(.70,.92,u));
  vec3 ink=mix(vec3(.09,.43,.30),vec3(.30,.75,.57),smoothstep(-.84,.42,v));
  ink=mix(ink,vec3(.61,.90,.77),.08+vPigment.y*.11);
  ink=mix(ink,vec3(.90,.99,.93),loaded*.91);
  ink=mix(ink,vec3(.78,.96,.87),hair*.80);
  float alpha=edge*vPigment.w;
  if(alpha<.01)discard;
  gl_FragColor=vec4(ink,alpha);
  #include <colorspace_fragment>
}`;

// World-space brush arcs give the cyclone an open centre and the same
// isometric projection/depth as the player. No screen-facing tornado card.
export class WindRushArt{
  constructor(owner){
    this.owner=owner;this.capacity=64;this.started=null;this.blast=null;this.contacts=[];
    const g=brushGeometry();
    this.attributes=['originScale','arc','shape','pigment','motion'].map(name=>{
      const a=new InstanceAttribute(new Float32Array(this.capacity*4),4).setUsage(DynamicDraw);
      g.setAttribute(name,a);return a;
    });
    this.meshes=[-1,1].map((half,i)=>{
      const material=new ShaderMaterial({uniforms:{halfPass:{value:half}},vertexShader:vertex,fragmentShader:fragment,
        transparent:true,depthTest:true,depthWrite:false,side:2,toneMapped:false});
      material.forceSinglePass=true;
      const mesh=new InstancedMesh(g,material,this.capacity);mesh.count=0;mesh.visible=false;
      // Glyph batches are transparent at order 1 and do not write depth.
      // Draw the far half before the glyph, then the near half over it.
      mesh.frustumCulled=false;mesh.renderOrder=i?8:.8;mesh.name=i?'wind-rush-front':'wind-rush-back';
      owner.mesh.parent.add(mesh);return mesh;
    });
    this.mesh=this.meshes[1];this.geometry=g;
    this.arcMeshes=[...this.meshes];this.height=3.55;
    this.uniforms={focus:{value:new Vector3()},lean:{value:new Vector3()},clock:{value:0},
      radius:{value:windRushRadius*.64},height:{value:this.height},opacity:{value:0}};
    this.funnelGeometry=funnelGeometry();
    this.funnels=[-1,1].map((half,i)=>{
      const material=new ShaderMaterial({uniforms:{...this.uniforms,halfPass:{value:half}},vertexShader:funnelVertex,fragmentShader:funnelFragment,
        transparent:true,depthTest:true,depthWrite:false,side:2,toneMapped:false});
      material.forceSinglePass=true;
      const mesh=new Mesh(this.funnelGeometry,material);mesh.visible=false;mesh.frustumCulled=false;mesh.renderOrder=i?7:.7;
      mesh.name=i?'wind-rush-low-funnel-front':'wind-rush-low-funnel-back';owner.mesh.parent.add(mesh);return mesh;
    });
    this.mist=new Mesh(new PlaneGeometry(1,1),new ShaderMaterial({uniforms:{...this.uniforms,radius:{value:windRushRadius/.64}},vertexShader:mistVertex,fragmentShader:mistFragment,
      transparent:true,depthTest:true,depthWrite:false,toneMapped:false,side:2}));
    this.mist.frustumCulled=false;this.mist.visible=false;this.mist.renderOrder=.6;this.mist.name='wind-rush-ground-mist';owner.mesh.parent.add(this.mist);
    this.mist.material.forceSinglePass=true;
    this.meshes.push(...this.funnels,this.mist);
  }
  start(){this.started=this.owner.run.time;this.blast=null;this.contacts.length=0;}
  burst(){
    if(!this.owner.allowed())return;
    const {x,y,z}=this.owner.run.visiblePlayerPosition();
    this.blast={x,y,z,start:this.owner.run.time};
  }
  hit(x,y,z){
    if(!this.owner.allowed()||this.contacts.length>=8)return;
    this.contacts.push({x,y,z,start:this.owner.run.time});
  }
  push(origin,arc,shape,pigment,motion){
    if(this.count>=this.capacity)return;
    const at=this.count++*4;
    for(const [i,data] of [origin,arc,shape,pigment,motion].entries())this.attributes[i].array.set(data,at);
  }
  update(){
    const {run,vfx}=this.owner,p=run?.player;
    const buff=p?.buffs.get(speedBuff);
    if(!buff&&this.started==null&&!this.blast&&!this.contacts.length&&!this.count)return;
    this.count=0;
    for(const m of [...this.funnels,this.mist])m.visible=false;
    if(!p||p.dead||p.speciesId!==59||!this.owner.allowed()){
      this.reset();return;
    }
    const now=run.time;
    if(buff&&!buff.windBurstDone&&this.started==null)this.started=now;
    const opacity=vfx.opacity*vfx.ownOpacity*(vfx.calm?.72:1);
    const age=this.started==null?0:Math.max(0,now-this.started);
    if(this.started!=null&&(buff||age<.10)&&!this.blast&&!buff?.windBurstDone){
      const pos=run.visiblePlayerPosition();
      const open=clamp(age/.18),remaining=buff?.t??5;
      const fade=opacity*open*clamp(remaining/.16);
      this.uniforms.focus.value.copy(pos);this.uniforms.clock.value=age;
      this.uniforms.lean.value.set(-Math.max(-.34,Math.min(.34,p.vel.x*.025)),0,-Math.max(-.34,Math.min(.34,p.vel.z*.025)));
      this.uniforms.radius.value=windRushRadius*.64*(.62+.38*open);
      this.uniforms.height.value=this.height*(.72+.28*open);this.uniforms.opacity.value=fade;
      for(const m of [...this.funnels,this.mist])m.visible=fade>0;
      const origin=[pos.x,pos.y+.08*VFX_SCALE,pos.z,1];
      // A few tapered accents leave the narrow foot; the broad flow lives
      // on the short funnel surface rather than on detached circular bands.
      for(let j=0;j<3;j++)this.push(origin,[j*2.3,2.8,.10,.09],
        [1.35+j*.73,0,0,1],[j,.8,8.7,fade*(.28-.06*j)],[age,open,0,0]);
      const lean=this.uniforms.lean.value;
      this.push(origin,[0,TAU*2.12,.08,.46],[this.uniforms.radius.value,this.uniforms.height.value,0,3],
        [.4,1,-8.7,fade*.94],[age,open,lean.x,lean.z]);
      this.push(origin,[2.2,TAU*1.85,.16,.17],[this.uniforms.radius.value*.96,this.uniforms.height.value*.94,0,3],
        [2.3,1,-8.7,fade*.51],[age,open,lean.x,lean.z]);
    }else this.started=null;
    if(this.blast){
      const e=this.blast,t=now-e.start,q=clamp(t/.58),fade=(1-q)**1.4*opacity;
      if(buff){const pos=run.visiblePlayerPosition();e.x=pos.x;e.y=pos.y;e.z=pos.z;}
      if(t>=.58)this.blast=null;
      else{
        const radius=windRushRadius+(windRushBurstRadius-windRushRadius)*(1-(1-q)**3);
        for(let j=0;j<7;j++){
          const a=j*TAU/7;
          this.push([e.x,e.y+.12*VFX_SCALE,e.z,1],[a,.98,.06,.19+.12*(1-q)], [radius,0,0,1],
            [j*1.9,.95,2.1,fade],[t,1,0,0]);
        }
        for(let j=0;j<12;j++){
          const a=j*2.399;
          this.push([e.x,e.y,e.z,1],[a,.26,.18+(j%3)*.16+q*.4,.14+.11*(1-q)],
            [windRushRadius*.72+q*(2.7+(j%3)*.35),1.7-.5*q,.35,2], [a,1,1.3,fade],[t,1,0,0]);
        }
      }
    }
    this.contacts=this.contacts.filter(e=>now-e.start<.24);
    for(const e of this.contacts){
      const t=now-e.start,q=t/.24;
      for(let j=0;j<3;j++)this.push([e.x,e.y+.65*VFX_SCALE,e.z,1],[j*2.1,.95,.25,.11],
        [.25+q*.85,.45,.04,0],[j,1,4,(1-q)*opacity],[t,1,0,0]);
    }
    for(const mesh of this.arcMeshes){mesh.count=this.count;mesh.visible=this.count>0;}
    for(const a of this.attributes){a.clearUpdateRanges();a.addUpdateRange(0,this.count*4);a.needsUpdate=true;}
  }
  reset(){this.started=null;this.blast=null;this.contacts.length=0;this.count=0;for(const m of this.meshes){m.count=0;m.visible=false;}}
  dispose(){this.reset();for(const m of this.meshes){m.removeFromParent();m.material.dispose();m.dispose?.();}this.geometry.dispose();this.funnelGeometry.dispose();this.mist.geometry.dispose();}
}
