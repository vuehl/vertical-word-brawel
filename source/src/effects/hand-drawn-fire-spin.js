import {VFX_SCALE} from './visual-scale.js';
import {fireFootprints,fireFootprintGLSL,fireSurfaceGeometry} from './fire-footprint.js';
import {DeviceFxThree as T,PostprocessingPass,B as InstanceAttribute,H as InstancedMesh,ct as ShaderMaterial,j as DynamicDraw,b as CanvasTexture,ot as SRGB} from '../vendor/three-DmSYIDKK.js';
import atlas from '../../../resources/public/assets/vfx/fire-spin.json' with {type:'json'};

const clamp=x=>Math.max(0,Math.min(1,x));
const vertex=`
attribute vec4 iOrigin;attribute vec4 iFrame;attribute vec4 iStyle;
varying vec2 vUv;varying vec2 vFrameUv;varying float vAlpha;varying float vPart;varying float vPhase;
${fireFootprintGLSL}
void main(){
  vec2 local=(uv-vec2(.5,iStyle.z))*vec2(iOrigin.w,iFrame.x);
  vec3 right=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);
  // Use the camera's shared ground axes, including for off-centre vortices.
  // A separate eye-to-emitter axis would shear the footprint as it travelled.
  vec2 eye=normalize(vec2(viewMatrix[0][2],viewMatrix[2][2]));
  vec3 world;float frameIndex=iFrame.y;vec2 frameUv=uv;vPart=iFrame.z;
  if(iFrame.z<.5){
    // The reference winds down from an elliptical lip to a pointed foot.
    // The two sides carry the same animated fire painting around that lip.
    bool back=position.z>.5;
    float t=clamp((uv.y-iStyle.z)/(.84-iStyle.z),0.,1.);
    float radius=.007+.34*pow(t,1.09);
    float paintedRadius=mix(.077,.285,t);
    float lateral=(uv.x-mix(.49,.515,t))/paintedRadius;
    float x=lateral*radius;
    float depth=radius*.34*sqrt(max(0.,1.-lateral*lateral));
    if(back)depth=-depth;
    float height=.93*t+min(0.,uv.y-iStyle.z)+max(0.,uv.y-.84)*.55;
    world=iOrigin.xyz+right*(x*iOrigin.w)+vec3(eye.x*depth*iOrigin.w,height*iFrame.x,eye.y*depth*iOrigin.w);
    if(back){frameUv.x=1.-uv.x;vPart=-1.;}
  }else if(iFrame.z>3.5){
    float depth=-local.y*2.;
    world=iOrigin.xyz+right*local.x+vec3(eye.x*depth,.035,eye.y*depth);
  }else if(iFrame.z<1.5||iFrame.z>2.5){
    // The cast arc and contact patch use the same painting as sweepRing.
    world=iOrigin.xyz+fireFootprint(local,iStyle.y,${fireFootprints.sweepRing.depthRatio},${fireFootprints.sweepRing.shear});
    world.y+=.045;
  }else{
    // Keep a little height in the impact flare above its circular base.
    world=iOrigin.xyz+fireFootprint(local,0.,.74,.14);
    world.y+=.045+max(0.,local.y)*.20;
  }
  gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
  if(position.z>.5&&iFrame.z>.5)gl_Position=vec4(2.,2.,2.,1.);
  float col=mod(frameIndex,8.),row=floor(frameIndex/8.);
  vUv=(vec2(col,7.-row)+mix(vec2(.5/${atlas.tile}.),vec2(1.-.5/${atlas.tile}.),frameUv))/8.;
  vFrameUv=frameUv;vAlpha=iStyle.x;vPhase=mod(iStyle.w,5.)*(6.283185*1.2);
}`;
const fragment=`
#ifdef FIRE_OUTLINE_MASK
uniform sampler2D worldDepth;
uniform vec2 maskSize;
#endif
uniform sampler2D map;varying vec2 vUv;varying vec2 vFrameUv;varying float vAlpha;varying float vPart;varying float vPhase;
void main(){
  vec4 painted=texture2D(map,vUv);
  // Complementary pigment masks separate authored brown dust from hot fire.
  // No row is squeezed or clipped to fake ground contact; both halves keep
  // their original UVs and animation registration.
  float dust=(1.-smoothstep(.30,.46,painted.r))*smoothstep(.42,.68,painted.g/max(painted.r,.001));
  dust*=1.-smoothstep(.44,.60,vFrameUv.y);
  float part=vPart<.5?(1.-dust):vPart>3.5&&vPart<4.5?dust:1.;
  float coverage=painted.a*part;
  vec3 color=painted.rgb;
  if(vPart<-.5){
    // Back the broken brush strokes with a hot inner wall. Its upper edge
    // follows the projected rear lip and its lower edge sits behind the body.
    float y=vFrameUv.y;
    float side=abs(vFrameUv.x-.485)/.285;
    float edge=.838-.022*side*side;
    float wall=(1.-smoothstep(.90,1.,side))*smoothstep(.55,.64,y)
              *(1.-smoothstep(edge-.018,edge,y));
    float rim=coverage*smoothstep(.69,.80,y);
    // Sweep broad, tapered ribbons around the inner curve. The rearmost
    // ribbons stay orange so the painted yellow lip still reads in front.
    float x=clamp((vFrameUv.x-.485)/.285,-1.,1.);
    float turn=asin(x);
    float height=clamp((y-.58)/.25,0.,1.);
    float arc=height+.15*x*x+.12*x;
    float flow=turn+vPhase;
    float curl=arc*2.65+.23*sin(flow)+.14*sin(2.*turn-vPhase);
    float band=abs(fract(curl)-.5);
    float taper=.5+.5*cos(flow-2.3*arc);
    float ribbon=(1.-smoothstep(.055,.19,band))*smoothstep(.08,.84,taper);
    float crest=(1.-smoothstep(.018,.095,band))*smoothstep(.55,.97,taper);
    float glow=smoothstep(.06,.96,arc+.09*sin(flow));
    vec3 ember=mix(vec3(.66,.030,.003),vec3(.99,.21,.008),glow);
    ember=mix(ember,vec3(1.,.43,.028),ribbon);
    ember=mix(ember,vec3(1.,.72,.14),crest*.82);
    float under=wall*(1.-rim);
    coverage=rim+under;
    color=(painted.rgb*rim+ember*under)/max(coverage,.0001);
  }
  float alpha=coverage*vAlpha;if(alpha<.008)discard;
  #ifdef FIRE_OUTLINE_MASK
  if(vPart>.5 || gl_FragCoord.z>texture2D(worldDepth,gl_FragCoord.xy/maskSize).r+.000002)discard;
  gl_FragColor=vec4(1.,1.,1.,alpha);
  #else
  gl_FragColor=vec4(color,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #endif
}`;

// The outline filter reads opaque world depth, even behind transparent fire.
function createFireOutlineMask(host,spin){
  const {composer,outline,outlinePass,camera}=host;
  const target=new T.WebGLRenderTarget(1,1,{depthBuffer:false,stencilBuffer:false,generateMipmaps:false});
  const uniforms={...spin.material.uniforms,worldDepth:{value:null},maskSize:{value:new T.Vector2()}};
  const material=new ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,defines:{FIRE_OUTLINE_MASK:1},
    uniforms,transparent:true,depthTest:false,depthWrite:false,side:2,toneMapped:false});
  material.forceSinglePass=true;
  const proxy=new InstancedMesh(spin.geometry,material,64),scene=new T.Scene();
  proxy.frustumCulled=false;scene.add(proxy);
  const pass=new PostprocessingPass('Fire silhouette',null,null),clearColor=new T.Color();
  const mask=outline.uniforms.get('uFireMask'),active=outline.uniforms.get('uHasFireMask');
  pass.needsSwap=false;pass.needsDepthTexture=true;
  pass.render=(renderer,input)=>{
    active.value=false;
    if(!outlinePass.enabled||!spin.visible||!spin.parent?.visible||!composer.stableDepthTexture)return;
    const w=Math.ceil(input.width/2),h=Math.ceil(input.height/2);
    target.setSize(w,h);uniforms.maskSize.value.set(w,h);uniforms.worldDepth.value=composer.stableDepthTexture;
    proxy.count=spin.count;
    const previous=renderer.getRenderTarget(),alpha=renderer.getClearAlpha(),auto=renderer.autoClear;
    renderer.getClearColor(clearColor);
    try{
      renderer.autoClear=false;renderer.setRenderTarget(target);renderer.setClearColor(0,0);renderer.clear(true,false,false);
      renderer.render(scene,camera);mask.value=target.texture;active.value=true;
    }finally{
      renderer.setClearColor(clearColor,alpha);renderer.autoClear=auto;renderer.setRenderTarget(previous);
    }
  };
  composer.addPass(pass,composer.passes.indexOf(outlinePass));
  return ()=>{
    composer.removePass(pass);
    if(mask.value===target.texture){active.value=false;mask.value=null;}
    target.dispose();proxy.dispose();material.dispose();
  };
}

// One unlit, normally blended sprite batch. The drawings supply all fire/shading;
// no procedural cone, additive particles, noise, or cross-faded double images.
export class HandDrawnFireSpin{
  constructor(owner,scene){
    this.owner=owner;this.events=[];this.limit=48;this.disposed=false;this.lastHit=-1;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
    this.texture=new CanvasTexture(canvas);this.texture.colorSpace=SRGB;
    this.texture.generateMipmaps=false;this.texture.minFilter=this.texture.magFilter=1006;
    const image=new Image();
    this.ready=new Promise(resolve=>{
      const finish=success=>{clearTimeout(timer);image.onload=image.onerror=null;if(!success)this.loadError=true;resolve(success);};
      const timer=setTimeout(()=>finish(false),12000);
      image.onload=()=>{if(!this.disposed){this.texture.image=image;this.texture.needsUpdate=true;this.loaded=true;}finish(true);};
      image.onerror=()=>finish(false);
      image.src='assets/vfx/fire-spin.png';
    });
    this.texture.userData.ready=this.ready;
    const g=fireSurfaceGeometry(24,false,16);
    this.attributes=['iOrigin','iFrame','iStyle'].map(name=>{const a=new InstanceAttribute(new Float32Array(64*4),4).setUsage(DynamicDraw);g.setAttribute(name,a);return a;});
    const material=new ShaderMaterial({uniforms:{map:{value:this.texture}},vertexShader:vertex,fragmentShader:fragment,transparent:true,depthTest:true,depthWrite:false,side:2,toneMapped:false});
    this.mesh=new InstancedMesh(g,material,64);this.mesh.count=0;this.mesh.visible=false;this.mesh.frustumCulled=false;this.mesh.renderOrder=7;this.mesh.name='authored-fire-spin';this.mesh.userData.projection='isometric-fire-funnel';scene.add(this.mesh);
  }
  play(clip,x,y,z,size,own=true){
    if(!this.owner.allowed(own)||this.events.length>=this.limit/2)return;
    if(this.owner.vfx.view&&!this.owner.vfx.view.visible(x,y,z,size))return;
    this.events.push({clip,x,y,z,size,age:0,own});
  }
  impact(x,y,z,size=1,own=true){
    if(this.owner.clock-this.lastHit<.12)return;
    this.lastHit=this.owner.clock;this.play('impact',x,y,z,Math.max(1.6,Math.min(3,size*2)),own);
  }
  update(dt,emitters){
    if(!emitters.length&&!this.events.length&&!this.mesh.count)return;
    const [position,frame,style]=this.attributes.map(a=>a.array),v=this.owner.vfx;let count=0;
    const push=(e,clip,width,height,pivot,alpha)=>{
      if(count>=this.limit)return;
      const contact=clip==='contact',dust=clip==='dust',spec=atlas.clips[contact?'cast':dust?'vortex':clip],index=spec.first+(contact?4:clip==='vortex'||dust?Math.floor(e.age*spec.fps)%spec.count:Math.min(spec.count-1,Math.floor(e.age*spec.fps)));
      const offset=count++*4;
      position.set([e.x,e.y,e.z,width*VFX_SCALE],offset);frame.set([height*VFX_SCALE,index,dust?4:contact?3:clip==='vortex'?0:clip==='cast'?1:2,0],offset);
      style.set([alpha*v.opacity*(e.own===false?1:v.ownOpacity)*(v.calm?.8:1),contact?-e.age*1.4:0,pivot,e.age],offset);
    };
    this.events=this.events.filter(e=>{
      e.age+=Math.max(0,dt);
      return e.age<atlas.clips[e.clip].count/atlas.clips[e.clip].fps&&this.owner.allowed(e.own);
    });
    // Reserve slots for complete silhouettes and hits before optional ground
    // layers. Render the floor layers first so they cannot paint over the fire.
    const bodies=Math.min(emitters.length,this.limit),events=Math.min(this.events.length,this.limit-bodies);
    let groundBudget=this.limit-bodies-events;
    for(let i=0;i<bodies&&groundBudget>0;i++,groundBudget--){
      const e=emitters[i],birth=clamp(e.age/.12),fade=clamp(e.life/(e.finite?(e.fadeOut||.10):.10)),growth=.72+.28*birth;
      const size=e.radius*2.4*growth;
      push(e,'dust',size,size,.18,birth*fade*.78);
    }
    for(let i=0;i<bodies&&groundBudget>0;i++,groundBudget--){
      const e=emitters[i],birth=clamp(e.age/.12),fade=clamp(e.life/(e.finite?(e.fadeOut||.10):.10)),size=e.radius*1.3*(.72+.28*birth);
      push(e,'contact',size,size,fireFootprints.sweepRing.pivotY,birth*fade*.28);
    }
    for(let i=0;i<events;i++){
      const e=this.events[i];push(e,e.clip,e.size,e.size,e.clip==='cast'?fireFootprints.sweepRing.pivotY:.47,1);
    }
    for(let i=0;i<bodies;i++){
      const e=emitters[i],birth=clamp(e.age/.12),fade=clamp(e.life/(e.finite?(e.fadeOut||.10):.10)),growth=.72+.28*birth;
      // Frames already contain the source aspect ratio inside a square tile.
      // Uniform scale avoids the old flight-height / impact-height mismatch.
      const size=e.radius*2.4*growth;
      push(e,'vortex',size,size,.15,birth*fade);
    }
    if(bodies&&this.loaded&&!this.releaseOutlineMask&&this.owner.run?.r?.composer){
      this.releaseOutlineMask=createFireOutlineMask(this.owner.run.r,this.mesh);
    }
    this.mesh.count=this.loaded?count:0;this.mesh.visible=this.mesh.count>0;
    for(const attribute of this.attributes){attribute.clearUpdateRanges();attribute.addUpdateRange(0,count*4);attribute.needsUpdate=true;}
  }
  setPerformance(profile){this.limit=profile.name==='流畅'?20:profile.name==='均衡'?36:48;}
  clear(){this.events.length=0;this.mesh.count=0;this.mesh.visible=false;this.lastHit=-1;}
  dispose(){this.disposed=true;this.clear();this.releaseOutlineMask?.();this.mesh.parent?.remove(this.mesh);this.mesh.geometry.dispose();this.mesh.material.dispose();this.mesh.dispose();this.texture.dispose();}
}
