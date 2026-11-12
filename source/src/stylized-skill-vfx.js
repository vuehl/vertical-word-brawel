import {y as BufferGeometry,v as BufferAttribute,B as InstanceAttribute,H as InstancedMesh,ct as ShaderMaterial,j as DynamicDraw,w as Color} from '../assets/three-DmSYIDKK.js';
import {effectColors,effectShapes,PAINT_SHAPES} from './stylized-effect-atlas.js';
import {ProceduralFireJet} from './procedural-fire-jet.js';

const TAU=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
const color=new Color();
function skinGeometry(){
  const g=new BufferGeometry(),p=[],uv=[],index=[],around=40,along=24;
  for(let j=0;j<=along;j++)for(let i=0;i<=around;i++){p.push(0,0,0);uv.push(i/around,j/along);if(j<along&&i<around){const k=j*(around+1)+i;index.push(k,k+1,k+around+1,k+1,k+around+2,k+around+1);}}
  g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(index);return g;
}
const vertex=`
attribute vec4 iOrigin; attribute vec4 iForm; attribute vec4 iTime; attribute vec4 iColor;
varying vec2 vUv; varying vec4 vColor; varying vec4 vTime; varying float vMode; varying vec3 vNormal; varying vec3 vView;
const float TAU=6.2831853;
void main(){
  float u=uv.y,a=uv.x*TAU,t=iTime.x,mode=iForm.w,r=iOrigin.w;
  float growth=smoothstep(0.,.18,t),h=iForm.x*growth;
  vec3 p;vec3 normal;
  if(mode<1.5&&iTime.w>3.5){
    // Narrow foot and open crown; ribbons wrap this funnel instead of filling
    // it with an opaque cone. The whole volume gently leans as it spins.
    float twist=a+t*1.6+iTime.z;
    float radius=(.10+pow(u,.82)*r)*(1.+sin(u*11.-t*6.)*.045);
    vec2 lean=vec2(sin(t*2.1+u*3.),cos(t*1.8+u*4.))*u*u*r*.10;
    p=vec3(cos(twist)*radius+lean.x,u*h,sin(twist)*radius+lean.y);
    normal=normalize(vec3(cos(twist),-.35,sin(twist)));
  }else if(mode<1.5||mode>2.5&&mode<3.5){
    float twist=a+t*5.+u*TAU*1.45+iTime.z;
    float radius=(.14+pow(u,.72)*r)*(.93+.07*sin(t*7.+u*16.+a*3.));
    p=vec3(cos(twist)*radius+sin(t*3.+u*5.)*u*r*.09,u*h,sin(twist)*radius);
    normal=normalize(vec3(cos(twist),-.3,sin(twist)));
  }else if(mode<2.5||mode>3.5&&mode<4.5){
    float theta=a+u*5.+sin(t*5.+u*9.)*.25;
    float radius=(.08+sin(u*3.02)*r)*(.86+.14*sin(a*3.+u*19.-t*10.));
    vec2 forward=vec2(cos(iForm.y),sin(iForm.y)),side=vec2(-forward.y,forward.x);
    float tongues=.87+.13*sin(a*3.+t*5.);
    vec2 ground=forward*u*iForm.z*tongues+side*(cos(theta)*radius+sin(u*9.-t*7.)*u*r*.14);
    p=vec3(ground.x,sin(theta)*radius*.8+u*u*h,ground.y);
    normal=vec3(side.x*cos(theta),sin(theta),side.y*cos(theta));
  }else if(mode>5.5&&mode<6.5){
    float latitude=(u-.5)*3.14159;
    float wobble=1.+.07*sin(a*3.+t*13.)*sin(latitude*4.-t*7.);
    normal=vec3(cos(a)*cos(latitude),sin(latitude),sin(a)*cos(latitude));
    p=normal*r*wobble;p.y*=.86;
  }else if(mode>7.5&&iTime.w<.5){
    // Dragon cones retain their original volume and translucent material.
    float spread=cos(a)*.73,reach=u*iForm.z*(.94+.06*sin(a*4.+t*6.));
    vec2 forward=vec2(cos(iForm.y),sin(iForm.y)),side=vec2(-forward.y,forward.x);
    vec2 ground=(forward*cos(spread)+side*sin(spread))*reach;
    p=vec3(ground.x,sin(a)*(.12+u*.58)+u*.4+sin(u*12.-t*9.+a*2.)*u*.16,ground.y);
    normal=vec3(side.x*cos(a),sin(a),side.y*cos(a));
  }else if(mode>6.5){
    float twist=a+u*3.+sin(t*4.+u*9.)*.3;
    float radius=(.12+pow(1.-u,.65)*r*.7)*(.8+.2*sin(a*3.-u*13.+t*11.));
    p=vec3(cos(twist)*radius+sin(u*7.-t*8.)*u*r*.25,u*h,sin(twist)*radius);
    normal=vec3(cos(twist),.2,sin(twist));
  }else{
    float arc=(uv.x-.5)*3.8+iForm.y;
    float radius=r+(uv.y-.5)*r*.17;
    p=vec3(cos(arc)*radius,sin(uv.x*3.14159)*h+sin(uv.y*3.14159)*.15,sin(arc)*radius);
    normal=vec3(0.,1.,0.);
  }
  vUv=uv;vColor=iColor;vTime=iTime;vMode=mode;vNormal=normal;
  vView=cameraPosition-(iOrigin.xyz+p);
  gl_Position=projectionMatrix*viewMatrix*vec4(iOrigin.xyz+p,1.);
}`;
const fragment=`
varying vec2 vUv; varying vec4 vColor; varying vec4 vTime; varying float vMode; varying vec3 vNormal; varying vec3 vView;
const float TAU=6.2831853;
float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),f.x),mix(hash21(i+vec2(0.,1.)),hash21(i+vec2(1.,1.)),f.x),f.y);}
float flowNoise(vec2 p){return noise(p)*.58+noise(p*2.04+3.8)*.28+noise(p*4.1-2.1)*.14;}
void main(){
  float u=vUv.y,t=vTime.x,angle=vUv.x*TAU,alpha,highlight;
  vec3 col;
  float softEnds=smoothstep(0.,.035,u)*(1.-smoothstep(.84,1.,u));
  bool fire=vTime.w>.5&&vTime.w<1.5;
  bool water=vTime.w>1.5&&vTime.w<3.5;
  if(fire&&vMode<4.5||fire&&vMode>6.5){
    vec2 flow=vec2(angle*1.7,u*8.-t*5.7);
    float distortion=flowNoise(flow*.7+vec2(t*.45,0.));
    float burn=flowNoise(flow+vec2(distortion*2.8,distortion*.7));
    float spiral=vMode>2.5&&vMode<3.5?sin(angle*3.+u*TAU*3.8-t*10.)*.17:0.;
    float fuel=burn+(1.-u)*.24+spiral;
    float mask=smoothstep(.38,.405,fuel);
    float heat=smoothstep(.36,.84,fuel);
    vec3 red=vec3(1.,.04,.006),orange=vec3(1.,.28,.008),gold=vec3(1.,.72,.08),core=vec3(1.,.92,.4);
    col=mix(red,orange,smoothstep(.43,.455,fuel));col=mix(col,gold,smoothstep(.64,.665,fuel));col=mix(col,core,pow(heat,4.)*.34);
    col*=1.04+heat*.1;
    col=mix(vec3(.28,.075,.21),col,smoothstep(.405,.435,fuel));alpha=mask*softEnds*.94;
  }else if(water){
    vec2 flow=vec2(angle*2.+sin(u*10.-t*6.)*.65,u*12.-t*8.);
    float liquid=flowNoise(flow),crest=flowNoise(flow*1.9+vec2(liquid*1.8,t*.8));
    // Painted water: cobalt shadow, turquoise body and ivory foam ribbons.
    // No Fresnel, glass transparency or view-dependent specular highlights.
    float band=smoothstep(.45,.475,liquid),foam=smoothstep(.65,.68,crest);
    col=mix(vec3(.055,.25,.64),vec3(.04,.70,.91),band);
    col=mix(col,vec3(.78,.98,.96),foam);
    float stroke=1.-smoothstep(.012,.038,abs(liquid-.46));
    col=mix(col,vec3(.09,.21,.40),stroke*.8);
    float ends=vMode>5.5&&vMode<6.5?1.:softEnds;
    alpha=.88*ends;
  }else if(vMode<1.5&&vTime.w>3.5){
    // Three broad emerald ribbons, a sharp ivory leading edge and a faint
    // translucent wake. Open gaps reveal the orbiting leaves and inner core.
    float phase=fract((angle-u*TAU*3.15+t*10.8+vTime.z)/TAU);
    float width=.32+.045*sin(angle*2.+t*3.+u*9.);
    float ribbon=smoothstep(.08,.095,phase)*(1.-smoothstep(.12+width,.135+width,phase));
    float edge=1.-smoothstep(.012,.023,abs(phase-.135));
    float inkEdge=1.-smoothstep(.012,.024,min(abs(phase-.09),abs(phase-(.12+width))));
    float grain=flowNoise(vec2(angle*2.+t*.7,u*17.-t*4.));
    float streak=pow(max(0.,cos(angle-u*TAU*5.3+t*13.)),20.)*.19;
    float front=smoothstep(-.15,.25,dot(normalize(vNormal),normalize(vView)));
    float ends=smoothstep(0.,.045,u)*(1.-smoothstep(.91,1.,u));
    float upperFade=1.-smoothstep(.64,1.,u)*.42;
    col=mix(vec3(.025,.53,.20),vec3(.12,1.,.54),smoothstep(.26,.28,phase));
    col=mix(col,vec3(.84,1.,.94),edge*.98);
    col+=vec3(.04,.09,.06)*step(.6,grain);col=mix(col,vec3(.08,.23,.30),inkEdge*.94);
    alpha=max(ribbon,edge)*.96*ends*(.86+.14*front);
  }else if(vMode<1.5||vMode>2.5&&vMode<3.5){
    float phase=angle*3.+u*TAU*4.5-t*10.;
    float band=smoothstep(.05,.36,sin(phase+.22*sin(u*18.-t*4.)));
    float fine=smoothstep(.93,.995,sin(angle*9.-t*3.+u*8.))*.23;
    float drift=flowNoise(vec2(angle*2.,u*9.-t*4.));
    alpha=(band*.6+fine)*softEnds*(.5+drift*.7);highlight=pow(max(0.,sin(phase)),5.);
    col=mix(vColor.rgb,vec3(.86,1.,.94),highlight*.65);
  }else if(vMode<2.5||vMode>3.5&&vMode<4.5){
    float flow=sin(angle*3.+u*18.-t*13.)*.5+.5;
    float tongues=smoothstep(.25,.62,flow+(.7-u)*.4);
    alpha=tongues*softEnds*.48;highlight=(.5+.5*flow)*(1.-u*.5);col=mix(vColor.rgb,vec3(1.,.93,.74),highlight*.45);
  }else{
    alpha=sin(vUv.x*3.14159)*sin(vUv.y*3.14159);highlight=pow(sin(vUv.y*3.14159),4.);col=mix(vColor.rgb,vec3(1.,.93,.74),highlight*.5);
  }
  // Dry brush colour breakup follows the authored surface instead of screen
  // noise. Quantised pigment and an ink edge are shared by every element.
  float pigment=flowNoise(vec2(angle*6.,u*49.));
  col=floor(clamp(col,0.,1.)*7.+.5)/7.;
  col*=.95+.05*smoothstep(.35,.6,pigment);
  float contour=1.-smoothstep(.08,.24,alpha);
  col=mix(col,vec3(.14,.16,.29),contour*.85);
  alpha=smoothstep(.035,.11,alpha)*min(.96,alpha*1.8)*vTime.y*vColor.a;if(alpha<.018)discard;
  gl_FragColor=vec4(col,alpha);
}`;

// One bounded instanced draw for continuously deforming 3D skill surfaces.
// Particle emitters, impacts and damage remain independent of mesh count.
export class StylizedSkillFX{
  constructor(vfx,scene){
    this.vfx=vfx;this.entries=[];this.keys=new Map();this.clock=0;this.limit=28;this.lightSources=[];this.lastImpact=-1;this.impacts=0;this.emitted=0;this.refreshes=0;
    const geometry=skinGeometry(),capacity=32;
    this.attributes=['iOrigin','iForm','iTime','iColor'].map(name=>{const a=new InstanceAttribute(new Float32Array(capacity*4),4).setUsage(DynamicDraw);geometry.setAttribute(name,a);return a;});
    const material=new ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:true,depthTest:true,depthWrite:false,side:2});
    this.mesh=new InstancedMesh(geometry,material,capacity);this.mesh.count=0;this.mesh.frustumCulled=false;this.mesh.renderOrder=7;this.mesh.name='handcrafted-skill-volumes';scene.add(this.mesh);
    this.fireJet=new ProceduralFireJet(this,scene);this.fireEmitters=[];
  }
  attach(run){
    this.run=run;
    const surface=(x,z)=>(run.terrain?.height(x,z)||0)+.24;
    this.vfx.norm.surface=this.vfx.ground.surface=this.vfx.groundN.surface=this.vfx.rings.surface=surface;
  }
  allowed(own=true){return !this.run?.disposed&&!(own&&this.run?.hideOwnFx);}
  touch(key,config){
    if(!this.allowed(config.own!==false)||this.vfx.view&&!this.vfx.view.visible(config.x,config.y,config.z,Math.max(config.height||4,config.length||0,config.radius*2)))return null;
    let entry=this.keys.get(key);
    if(!entry){if(this.entries.length>=this.limit)return null;entry={key,age:0,emit:0,seed:(this.refreshes++*.618)%TAU,life:.14,...config};this.entries.push(entry);this.keys.set(key,entry);}
    else Object.assign(entry,config,{life:.14});
    return entry;
  }
  volume(config){const e=this.touch({},config);if(e){e.total=config.duration||1;e.life=e.total;e.finite=true;}return e;}
  cone(key,x,y,z,dx,dz,length,type='fire',radius=.9,own=true,fan=true){
    const fire=type==='fire'||type==='dragon';
    const entry=this.touch(key,{x,y,z,radius:radius*1.25,height:fire?1.25:.4,length,angle:Math.atan2(dz,dx),mode:fire?(fan?8:2):4,type,color:effectColors[type]||effectColors.normal,own});
    if(entry&&type==='fire'&&fan)entry.fireTouched=true;return entry;
  }
  tornado(key,x,y,z,radius=2,height=7,type='flying',own=true){return this.touch(key,{x,y,z,radius,height,mode:type==='fire'?3:1,type,color:type==='flying'?0x36d99b:effectColors[type]||effectColors.flying,own});}
  cast(type,x,y,z,radius=1.4){
    if(!this.allowed())return;this.vfx.ring(x,y,z,radius,effectColors[type]||effectColors.normal,.24,.7,0);
    for(let j=0;j<6;j++){const a=j/6*TAU;this.particle(type,{x:x+Math.cos(a)*radius,y:y+.2,z:z+Math.sin(a)*radius,vx:-Math.cos(a)*3,vy:1,vz:-Math.sin(a)*3,size:.24,life:.3});}
  }
  particle(type,p,normal=false){
    const pool=normal?this.vfx.norm:this.vfx.add;
    pool.spawn({color:effectColors[type]||effectColors.normal,endColor:effectColors[type]||effectColors.normal,shape:type==='fire'&&this.emitted%3?2:effectShapes[type]||2,glow:.12,endSize:0,drag:1.2,gravity:0,...p});this.emitted++;
  }
  impact(type,x,y,z,strength=1,critical=false,own=true,continuous=false){
    if(!this.allowed(own))return;
    const r=this.run;if(!r)return;
    if(r.sprites&&!r.sprites.visible(x,y,z,6))return;
    // Spatial/frame budget prevents a crowd or a DOT tick from hiding the game.
    if(this.impactClock!==this.clock){this.impactClock=this.clock;this.impactCount=0;}
    if(this.impactCount++>=(r.performance.name==='流畅'?3:7))return;
    if(continuous&&!critical){
      // Sustained burning has small rising embers, not a new impact sticker
      // every damage tick. Damage numbers and critical feedback remain live.
      for(let j=0;j<2;j++)this.particle('fire',{x,y,z,vx:(j?1:-1)*.6,vy:1.8+j*.7,vz:Math.sin(this.clock*7+j)*.7,life:.24,size:.12,endSize:0,shape:2,color:j?0xff7724:0xffd477,opacity:.75},true);
      this.impacts++;return;
    }
    const c=effectColors[type]||effectColors.normal,s=clamp(strength,.5,2.2),floor=r.terrain.height(x,z)+.24;
    this.vfx.norm.spawn({x,y,z,color:c,shape:PAINT_SHAPES.stroke,life:.18,size:1.7*s,endSize:2.2*s,rot:this.clock*1.7,opacity:.86});
    this.vfx.norm.spawn({x,y:y+.02,z,color:c,shape:1,life:.16,size:(critical?3:1.8)*s,endSize:(critical?3.7:2.3)*s,rot:.35,opacity:.95});
    this.vfx.norm.spawn({x,y:y+.04,z,color:0xfff1cf,shape:25,life:.12,size:.75*s,endSize:1.1*s,rot:.35,opacity:.95});
    this.vfx.ring(x,floor,z,1.2*s,c,.3,.2,2);
    for(let j=0;j<(critical?11:6);j++){
      const a=j/7*TAU+this.clock*2,v=(critical?7:4)*s;
      this.particle(type,{x,y,z,vx:Math.cos(a)*v,vy:1.5+Math.sin(j*4)*1.1,vz:Math.sin(a)*v,life:.22+(j%3)*.08,size:(critical?.35:.25)*s,gravity:8,spin:(j%2?1:-1)*2},true);
      this.vfx.beams.spawn(x,y,z,x+Math.cos(a)*s,y+.12,z+Math.sin(a)*s,.075*s,c,.11,.7);
    }
    this.surface(type,x,floor,z,s,critical);
    r.terrain.workshopImpulse=Math.max(r.terrain.workshopImpulse||0,critical?.65:.2);
    this.impacts++;
    if((critical||strength>1.6)&&this.clock-this.lastImpact>.16){
      this.lastImpact=this.clock;r.shake(critical?.16:.1,x,z);r.hitstop(r.meta.profile.settings.reduceFlashes?.012:critical?.035:.018);
    }
  }
  surface(type,x,y,z,radius=1,heavy=false){
    if(!this.allowed())return;
    const c=effectColors[type]||effectColors.normal;
    // Temporary pigment stains sit on the paper; airborne drops share the
    // existing bounded particle pool.
    if(type==='fire'||type==='water'||type==='ice'||type==='poison')this.vfx.groundN.spawn({x,y:y+.015,z,life:type==='fire'?.7:.9,size:radius*1.4,endSize:radius*2.5,color:c,shape:0,opacity:.18});
    this.paintSplash(type,x,y,z,radius,heavy);
    if(type==='water'||type==='ice')this.vfx.ring(x,y,z,radius*1.8,c,.65,.45,2);
    if(type==='water')this.vfx.ground.spawn({x,y:y+.05,z,life:.65,size:radius*1.2,endSize:radius*3,color:0xb1ecf4,shape:140,opacity:.25,spin:.35});
  }
  paintSplash(type,x,y,z,radius=1,heavy=false,angle){
    if(!this.allowed())return;
    const r=this.run;if(!r||this.vfx.view&&!this.vfx.view.visible(x,y,z,6))return;
    const low=r.performance.name==='流畅',limit=low?48:r.performance.name==='均衡'?96:160;
    if(this.vfx.groundN.n>=limit-3)return;
    if(this.paintClock!==this.clock){this.paintClock=this.clock;this.paintCount=0;}
    if(this.paintCount++>=(low?2:4))return;
    const c=effectColors[type]||effectColors.normal,s=clamp(radius,.45,2.1),a=angle??Math.atan2(z-r.player.pos.z,x-r.player.pos.x);
    const ink={fire:0x8e392c,water:0x244c75,grass:0x345c40,electric:0x8a6429,ice:0x387180,poison:0x59386c,ghost:0x44395c}[type]||0x4b465d;
    const pool=this.vfx.groundN,rot=a+this.clock*.6;
    pool.spawn({x,y:y+.017,z,color:ink,shape:PAINT_SHAPES.splash,life:heavy?1.15:.9,size:s*2.6,endSize:s*3.05,rot,opacity:.33});
    pool.spawn({x,y:y+.023,z,color:c,shape:PAINT_SHAPES.splash,life:heavy?1.1:.85,size:s*2.4,endSize:s*2.8,rot,opacity:heavy?.63:.49});
    if(heavy)pool.spawn({x,y:y+.03,z,color:c,shape:PAINT_SHAPES.stroke,life:.65,size:s*3.6,endSize:s*4.1,rot:a,opacity:.6});
    for(let j=0;j<(low?3:heavy?9:5);j++){
      const direction=a+(j%2?1:-1)*(.3+j*.55),velocity=(heavy?5:3.4)*(1+(j%3)*.18);
      this.vfx.norm.spawn({x,y:y+.3,z,vx:Math.cos(direction)*velocity,vy:2+(j%3)*.8,vz:Math.sin(direction)*velocity,gravity:13,drag:1.1,life:.36+(j%3)*.07,size:(.24+(j%3)*.07)*s,endSize:.07*s,color:j%4===0?ink:c,shape:PAINT_SHAPES.drop,rot:direction,spin:(j%2?1:-1)*1.2,opacity:.92});
    }
  }
  nova(type,x,y,z,radius=5){
    if(!this.allowed())return;
    const c=effectColors[type]||effectColors.normal;
    this.vfx.ring(x,y,z,radius,c,.5,.06,type==='fire'?6:2);
    this.volume({x,y:y+.27,z,radius:radius*.8,height:1.1,angle:this.clock,mode:5,type,color:c,duration:.34});
    for(let j=0;j<20;j++){const a=j/20*TAU;this.particle(type,{x,y:y+.4,z,vx:Math.cos(a)*radius*2.3,vy:1.5+(j%4)*.5,vz:Math.sin(a)*radius*2.3,life:.42+(j%3)*.08,size:.35+(j%3)*.1,gravity:6,spin:2},true);}
    this.surface(type,x,this.run.terrain.height(x,z)+.13,z,radius*.5,true);
  }
  slash(type,x,y,z,radius=2,angle=0){
    if(!this.allowed())return;
    this.volume({x,y:y+.2,z,radius,height:radius*.25,angle,mode:5,type,color:effectColors[type]||effectColors.normal,duration:.22});
    for(let j=0;j<4;j++)this.particle(type,{x,y:y+.6,z,vx:Math.cos(angle+j)*4,vy:1,vz:Math.sin(angle+j)*4,life:.24,size:.3});
    this.paintSplash(type,x,this.run.terrain.height(x,z)+.24,z,radius*.55,false,angle);
  }
  field(zone){
    if(!this.allowed()||!['fire','water','flying','poison','ice','electric','grass'].includes(zone.type))return;
    if(zone.type==='fire')this.touch(zone,{x:zone.x,y:zone.y+.24,z:zone.z,radius:zone.r*.7,height:Math.min(4,zone.r*1.55),mode:7,type:'fire',color:effectColors.fire});
    if(zone.type==='water')this.tornado(zone,zone.x,zone.y+.1,zone.z,zone.r*.7,zone.r*.7,'water');
    this.vfx.staticRing(zone.x,zone.y+.08,zone.z,zone.r,effectColors[zone.type],.25,2);
  }
  ultimate(ctx,duration){
    if(!this.allowed())return;
    const p=this.run.player,id=p.speciesId,type=ctx.type;
    this.cast(type,ctx.x,ctx.y,ctx.z,2.4);
    if([4,5,6].includes(id)){
      const d=Math.min(duration,2.8),tier=id-4;
      this.volume({x:ctx.x,y:ctx.y+.1,z:ctx.z,radius:2.3+tier*.5,height:7+tier*1.5,mode:3,type:'fire',color:effectColors.fire,duration:d});
      this.nova('fire',ctx.x,ctx.y,ctx.z,3.2+tier);
    }else if([18,59].includes(id)){
      this.volume({x:ctx.x,y:ctx.y+.1,z:ctx.z,radius:1.7,height:4.5,mode:type==='fire'?3:1,type,color:effectColors[type]||effectColors.flying,duration:.6});
    }else if(id===132){
      this.volume({x:ctx.x,y:ctx.y+.1,z:ctx.z,radius:2.2,height:4.5,mode:1,type:'psychic',color:effectColors.psychic,duration:.85});
    }
  }
  projectile(pool,id,size,opacity,type,key){
    const r=pool.run,x=pool.x[id],y=pool.y[id],z=pool.z[id],c=effectColors[type]||effectColors.normal,shape=effectShapes[type]||2;
    if(pool.flags[id]&64||/spin|tornado|whirl|storm|twister/.test(key)){
      this.tornado('projectile-'+id,x,r.terrain.height(x,z)+.1,z,Math.max(1,size*.8),Math.max(4,size*2.5),type,!(pool.flags[id]&1));return;
    }
    if(type==='water'){
      this.touch('water-orb-'+id,{x,y,z,radius:Math.max(.3,size*.58),height:size,mode:6,type,color:c,own:!(pool.flags[id]&1)});
      if(Math.random()<.35)this.particle(type,{x,y,z,vx:-pool.vx[id]*.07,vy:1.5,vz:-pool.vz[id]*.07,gravity:9,life:.32,size:.16},true);
      return;
    }
    if(type==='fire'){
      this.cone('fire-shot-'+id,x,y,z,-pool.vx[id],-pool.vz[id],Math.min(4,size*2.9),'fire',Math.max(.25,size*.43),!(pool.flags[id]&1),false);
      pool.glow.push(x,y,z,size*.65,0xffda71,0,0,.15,opacity*.7);return;
    }
    const angle=Math.atan2(-pool.vz[id]*.6,pool.vx[id]);
    pool.pool.push(x,y,z,size*.95,c,shape,angle,0,opacity);
    pool.glow.push(x,y,z,size*1.65,c,0,0,.12,opacity*.13);
    const speed=Math.hypot(pool.vx[id],pool.vz[id])||1,length=Math.min(1.9,speed*.065);
    this.vfx.beams.spawn(x-pool.vx[id]/speed*length,y,z-pool.vz[id]/speed*length,x,y,z,Math.min(.28,size*.16),c,.045,.6*opacity);
  }
  update(dt){
    const r=this.run;if(!r)return;this.clock+=Math.max(0,dt);this.lightSources.length=0;
    this.fireEmitters.length=0;
    const [a,b,c,d]=this.attributes.map(a=>a.array);let count=0;
    for(let i=this.entries.length-1;i>=0;i--){
      const e=this.entries[i];e.life-=dt;e.age+=dt;
      if(e.life<=0||!this.allowed(e.own!==false)){this.keys.delete(e.key);this.entries.splice(i,1);continue;}
      if(count+this.fireEmitters.length>=this.limit)continue;
      const fade=e.finite?clamp(e.life/.25,0,1):clamp(e.life/.1,0,1),envelope=clamp(e.age/.12,0,1)*fade;
      if(e.mode===8&&e.type==='fire'){
        this.fireEmitters.push(e);continue;
      }
      const offset=count*4;a.set([e.x,e.y,e.z,e.radius],offset);b.set([e.height||5,e.angle||0,e.length||0,e.mode],offset);
      c.set([e.age,envelope,e.seed,e.type==='fire'?1:e.type==='water'?2:e.type==='ice'?3:e.type==='flying'?4:0],offset);color.set(e.color);d.set([color.r,color.g,color.b,this.vfx.opacity*(e.own===false?1:this.vfx.ownOpacity)*(this.vfx.calm?.7:1)],offset);count++;
      if(e.type==='fire'||e.type==='electric'||e.type==='water'||e.type==='flying'&&e.mode===1)this.lightSources.push({x:e.x,y:e.y+1.7,z:e.z,color:e.color,power:(e.type==='fire'?40:e.type==='flying'?12:20)*envelope});
      e.emit+=dt;
      const cadence=r.performance.name==='流畅'?.055:.025;
      if(e.emit<cadence||dt===0)continue;e.emit%=cadence;
      if(e.mode===1&&e.type==='flying'){
        const low=r.performance.name==='流畅';
        for(let j=0;j<(low?2:3);j++){
          const h=(e.age*.54+j/3)%1,angle=e.age*10+e.seed+j*2.399,rad=(.14+Math.pow(h,.82))*e.radius;
          this.particle('flying',{x:e.x+Math.cos(angle)*rad,y:e.y+h*e.height,z:e.z+Math.sin(angle)*rad,vx:-Math.sin(angle)*4,vy:1.8,vz:Math.cos(angle)*4,life:.45,size:clamp(e.radius*.11,.17,.32),endSize:.07,shape:4,rot:angle,spin:j%2?7:-6,color:j%3===0?0xd8a84b:j%3===1?0x79a84b:0x9b7547,glow:0,opacity:.9},true);
        }
        if(e.age%.12<cadence){
          const floor=r.terrain.height(e.x,e.z)+.26;
          this.vfx.groundN.spawn({x:e.x,y:floor,z:e.z,color:0xd5d6c3,shape:140,life:.48,size:e.radius*2.5,endSize:e.radius*3.2,rot:-e.age*2,spin:-2.3,opacity:.36});
          this.vfx.norm.spawn({x:e.x+Math.cos(e.age*9)*e.radius*.45,y:floor+.2,z:e.z+Math.sin(e.age*9)*e.radius*.45,color:0xc4c4b1,shape:0,life:.4,size:e.radius*.7,endSize:e.radius*1.2,vy:.45,opacity:.18,spin:1});
        }
      }else if(e.mode===1||e.mode===3||e.mode===7){
        for(let j=0;j<3;j++){
          const h=(e.age*.65+j/3)%1,angle=e.age*8+j*2.1,rad=(.2+h*.9)*e.radius;
          this.particle(e.type,{x:e.x+Math.cos(angle)*rad,y:e.y+h*e.height,z:e.z+Math.sin(angle)*rad,vx:-Math.sin(angle)*3,vy:2.5,vz:Math.cos(angle)*3,life:.38,size:e.type==='fire'?.3:.2,spin:2,color:e.type==='fire'?0xffdc69:effectColors[e.type]},true);
        }
        if(e.age% .18<cadence)this.surface(e.type==='fire'?'fire':'flying',e.x,r.terrain.height(e.x,e.z)+.15,e.z,e.radius*.6);
      }else if(e.mode===2||e.mode===4||e.mode===8){
        const dx=Math.cos(e.angle),dz=Math.sin(e.angle),h=(e.age*2.7)%1,side=Math.sin(e.age*30)*e.radius*.4;
        for(let j=0;j<3;j++){
          const jet=e.mode===8&&e.type==='fire',q=(h+j/3)%1,angle=e.angle+(e.mode===8?(j-1)*(jet?.12:.48)+Math.sin(e.age*8+j)*.05:0),vx=Math.cos(angle),vz=Math.sin(angle);
          this.particle(e.type,{x:e.x+vx*e.length*q-vz*side*.6,y:e.y+q*q*(e.mode===8?.6:e.height),z:e.z+vz*e.length*q+vx*side*.6,vx:vx*(jet?12:6),vy:jet?.6:1.5,vz:vz*(jet?12:6),life:jet?.22:.3,size:jet?.24:e.type==='fire'?.32:.25,endSize:.04,shape:jet?PAINT_SHAPES.stroke:effectShapes[e.type]||2,rot:Math.atan2(-vz*.6,vx),spin:jet?0:.3,color:e.type==='fire'?0xffbf28:effectColors[e.type]},true);
        }
        if(e.age%.14<cadence)this.surface(e.type,e.x+dx*e.length*.8,r.terrain.height(e.x+dx*e.length*.8,e.z+dz*e.length*.8)+.16,e.z+dz*e.length*.8,e.radius*.6);
      }
    }
    this.mesh.count=count;this.mesh.visible=count>0;
    for(const attribute of this.attributes){attribute.clearUpdateRanges();attribute.addUpdateRange(0,count*4);attribute.needsUpdate=true;}
    this.fireJet.update(dt,this.fireEmitters);
  }
  setPerformance(profile,view){this.limit=profile.name==='流畅'?10:profile.name==='均衡'?18:28;this.vfx.view=view;this.fireJet.setPerformance(profile);}
  clear(){this.entries.length=0;this.keys.clear();this.lightSources.length=0;this.mesh.count=0;this.mesh.visible=false;this.paintClock=-1;this.paintCount=0;this.fireJet.clear();}
  dispose(){this.clear();this.fireJet.dispose();this.mesh.parent?.remove(this.mesh);this.mesh.geometry.dispose();this.mesh.material.dispose();this.mesh.dispose();}
}

// Existing move hooks are visual-only. Replacing them here covers ordinary
// shots, melee, zones, buffs, beams and enemy moves with the same art language.
export function installStylizedMoveVFX(registry,resolveType){
  const shared=new Map();
  for(const [key,original] of Object.entries(registry)){
    if(shared.has(original)){registry[key]=shared.get(original);continue;}
    const type=()=>resolveType(key)||'normal',fx=run=>run.vfx.crafted;
    const style={...original,
      draw(pool,id,size,alpha){fx(pool.run).projectile(pool,id,size,alpha,type(),key);},
      trail(run,x,y,z,...args){if(Math.random()>.65)return;fx(run).particle(type(),{x,y,z,vy:.8,life:.28,size:.25,spin:1.2},true);},
      hit(run,x,y,z,size=1){fx(run).impact(type(),x,y,z,clamp(size*.6,.6,1.3));},
      boom(run,x,y,z,radius=3){const t=type();fx(run).nova(t,x,y,z,radius);if(/spin|whirl|tornado|twister/.test(key))fx(run).volume({x,y:run.terrain.height(x,z)+.25,z,radius:Math.min(radius*.65,3.2),height:Math.min(radius*1.5,7),mode:t==='fire'?3:1,type:t,color:effectColors[t]||effectColors.flying,duration:.65});},
      cast(run,x,y,z){if(key!=='flamethrower')fx(run).cast(type(),x,y,z);},
      strike(run,x,y,z,dx=0,dz=-1,radius=2){fx(run).slash(type(),x,y,z,clamp(radius,.7,6),Math.atan2(dz,dx));},
      nova(run,x,y,z,radius=4){fx(run).nova(type(),x,y,z,radius);},
      dash(run,x,y,z,dx,dz,length=5){fx(run).slash(type(),x+dx,y+.1,z+dz,2,Math.atan2(dz,dx));},
      link(run,x,y,z,xx,yy,zz){run.vfx.lightning(x,y,z,xx,yy,zz,effectColors[type()]||effectColors.normal,.16,7,.16);fx(run).impact(type(),xx,yy,zz,.7);},
      beam(run,x,y,z,xx,yy,zz,width=.5){const t=type(),w=clamp(width*.4,.15,.75),c=effectColors[t]||effectColors.normal;if(t==='water'){fx(run).cone('flow-beam-'+key+Math.round(x)+'/'+Math.round(z),x,y,z,xx-x,zz-z,Math.hypot(xx-x,zz-z),t,w*.9);return;}run.vfx.beams.spawn(x,y,z,xx,yy,zz,w,c,.055,.7);run.vfx.beams.spawn(x,y,z,xx,yy,zz,w*.25,0xfff0cc,.055,.7);if(Math.random()<.4){const a=(run.time*2.4)%1;fx(run).particle(t,{x:mix(x,xx,a),y:mix(y,yy,a),z:mix(z,zz,a),vy:1,life:.22,size:.22});}},
      sky(run,x,y,z,radius=3){run.vfx.beams.spawn(x+2,y+18,z-1,x,y,z,Math.min(.6,radius*.15),effectColors[type()]||effectColors.normal,.18,.85);fx(run).nova(type(),x,y,z,radius);},
      cone(run,x,y,z,vx,vy,vz,life,length=7){const speed=Math.hypot(vx,vz)||1;fx(run).cone('enemy-cone-'+key+'-'+Math.round(x/3)+'/'+Math.round(z/3),x,y,z,vx/speed,vz/speed,length,type(),.8,false);},
      zone(run,x,y,z,radius=2){fx(run).particle(type(),{x,y:y+.2,z,vy:1.4,life:.45,size:.25},true);},
      warn(run,x,y,z,radius,col,time){run.vfx.telegraph(x,y,z,radius,effectColors[type()]||effectColors.normal,time||.4);},
      aura(run,x,y,z,radius=3,col,pulse){if(pulse)fx(run).nova(type(),x,y,z,radius);else if(Math.random()<.16)fx(run).particle(type(),{x:x+Math.cos(run.time*4)*radius,y:y+.4,z:z+Math.sin(run.time*4)*radius,vy:1,life:.45,size:.25});},
    };
    shared.set(original,style);registry[key]=style;
  }
}
