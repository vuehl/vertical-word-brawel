import {y as BufferGeometry,v as BufferAttribute,B as InstanceAttribute,H as InstancedMesh,ct as ShaderMaterial,j as DynamicDraw,b as CanvasTexture,ot as SRGB} from '../assets/three-DmSYIDKK.js';
import atlas from '../public/assets/vfx/fire-spin.json' with {type:'json'};

const clamp=x=>Math.max(0,Math.min(1,x));
const vertex=`
attribute vec4 iOrigin;attribute vec4 iFrame;attribute vec4 iStyle;attribute float aCrown;
varying vec2 vUv;varying vec2 vFrameUv;varying float vAlpha;varying float vPart;
void main(){
  vec2 local=(uv-vec2(.5,iStyle.z))*vec2(iOrigin.w,iFrame.x);
  vec3 right=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);
  // Use the camera's shared ground axes, including for off-centre vortices.
  // A separate eye-to-emitter axis would shear the footprint as it travelled.
  vec2 eye=normalize(vec2(viewMatrix[0][2],viewMatrix[2][2]));
  vec3 world;float frameIndex=iFrame.y;vec2 frameUv=uv;vPart=iFrame.z;
  if(aCrown>.5){
    if(iFrame.z>.5){gl_Position=vec4(0.,0.,0.,1.);vUv=vec2(0.);vFrameUv=uv;vAlpha=0.;return;}
    // The crown is the upper portion of the SAME animation pose, laid back
    // as a rigid plane. Its near edge meets the upright stem exactly at .65.
    // This opens the painted spiral from above without adding a floating ring.
    float shoulder=(.65-iStyle.z)*iFrame.x;
    float depth=-shoulder*.12-uv.y*iOrigin.w*.60;
    world=iOrigin.xyz+right*((uv.x-.5)*iOrigin.w)+vec3(eye.x*depth,shoulder*1.10,eye.y*depth);
    frameUv=vec2(uv.x,mix(.65,1.,uv.y));vPart=5.;
  }else if(iFrame.z<.5){
    // Keep the lower spiral rigid and upright in world space. The camera
    // supplies its isometric shortening; no folded bottom or row-wise warp.
    world=iOrigin.xyz+right*local.x+vec3(-eye.x*local.y*.12,local.y*1.10,-eye.y*local.y*.12);
  }else{
    float depth,height;
    if(iFrame.z>3.5){
      // The ochre dust belongs to the floor, not the upright flame card.
      // This is a rigid projection of the same registered animation frame.
      depth=-local.y*2.;height=.035;
    }else if(iFrame.z<1.5||iFrame.z>2.5){
      // Isometric orientation belongs to the ground artwork. The modest depth
      // correction opens the source arc without stretching the upright flame.
      float c=cos(iStyle.y),s=sin(iStyle.y);
      vec2 ground=vec2(local.x,-local.y*1.25);
      ground=mat2(c,-s,s,c)*ground;
      local.x=ground.x;depth=ground.y;height=.045;
    }else{
      depth=-local.y*.85;height=.045+max(0.,local.y)*.20;
    }
    world=iOrigin.xyz+right*local.x+vec3(eye.x*depth,height,eye.y*depth);
  }
  gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
  float col=mod(frameIndex,8.),row=floor(frameIndex/8.);
  vUv=(vec2(col,7.-row)+mix(vec2(.5/${atlas.tile}.),vec2(1.-.5/${atlas.tile}.),frameUv))/8.;
  vFrameUv=frameUv;vAlpha=iStyle.x;
}`;
const fragment=`
uniform sampler2D map;varying vec2 vUv;varying vec2 vFrameUv;varying float vAlpha;varying float vPart;
void main(){
  vec4 painted=texture2D(map,vUv);
  // Complementary pigment masks separate authored brown dust from hot fire.
  // No row is squeezed or clipped to fake ground contact; both halves keep
  // their original UVs and animation registration.
  float dust=(1.-smoothstep(.30,.46,painted.r))*smoothstep(.42,.68,painted.g/max(painted.r,.001));
  dust*=1.-smoothstep(.44,.60,vFrameUv.y);
  float part=vPart<.5?(1.-dust)*(1.-step(.6501,vFrameUv.y)):vPart>3.5&&vPart<4.5?dust:1.;
  float alpha=painted.a*vAlpha*part;if(alpha<.008)discard;
  gl_FragColor=vec4(painted.rgb,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

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
    const g=new BufferGeometry();
    // A rigid stem plus a horizontal crown share one instance. Every vortex
    // keeps both pieces even when optional floor layers exhaust the budget.
    const positions=[],uvs=[],crowns=[],indices=[],columns=1,levels=[0,.15,.22,.5,1],rows=levels.length-1;
    for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){
      positions.push(x/columns,levels[y],0);uvs.push(x/columns,levels[y]);crowns.push(0);
      if(x<columns&&y<rows){const n=y*(columns+1)+x;indices.push(n,n+1,n+columns+1,n+1,n+columns+2,n+columns+1);}
    }
    const capStart=positions.length/3;
    for(const [x,y] of [[0,0],[1,0],[1,1],[0,1]]){positions.push(x,y,0);uvs.push(x,y);crowns.push(1);}
    indices.push(capStart,capStart+1,capStart+2,capStart,capStart+2,capStart+3);
    g.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));
    g.setAttribute('uv',new BufferAttribute(new Float32Array(uvs),2));g.setIndex(indices);
    g.setAttribute('aCrown',new BufferAttribute(new Float32Array(crowns),1));
    this.attributes=['iOrigin','iFrame','iStyle'].map(name=>{const a=new InstanceAttribute(new Float32Array(64*4),4).setUsage(DynamicDraw);g.setAttribute(name,a);return a;});
    const material=new ShaderMaterial({uniforms:{map:{value:this.texture}},vertexShader:vertex,fragmentShader:fragment,transparent:true,depthTest:true,depthWrite:false,side:2,toneMapped:false});
    this.mesh=new InstancedMesh(g,material,64);this.mesh.count=0;this.mesh.visible=false;this.mesh.frustumCulled=false;this.mesh.renderOrder=7;this.mesh.name='authored-fire-spin';this.mesh.userData.projection='upright-spiral-with-isometric-crown';scene.add(this.mesh);
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
      position.set([e.x,e.y,e.z,width],offset);frame.set([height,index,dust?4:contact?3:clip==='vortex'?0:clip==='cast'?1:2,0],offset);
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
      push(e,'contact',size,size,.5,birth*fade*.28);
    }
    for(let i=0;i<events;i++){
      const e=this.events[i];push(e,e.clip,e.size,e.size,e.clip==='cast'?.5:.22,1);
    }
    for(let i=0;i<bodies;i++){
      const e=emitters[i],birth=clamp(e.age/.12),fade=clamp(e.life/(e.finite?(e.fadeOut||.10):.10)),growth=.72+.28*birth;
      // Frames already contain the source aspect ratio inside a square tile.
      // Uniform scale avoids the old flight-height / impact-height mismatch.
      const size=e.radius*2.4*growth;
      push(e,'vortex',size,size,.15,birth*fade);
    }
    this.mesh.count=this.loaded?count:0;this.mesh.visible=this.mesh.count>0;
    for(const attribute of this.attributes){attribute.clearUpdateRanges();attribute.addUpdateRange(0,count*4);attribute.needsUpdate=true;}
  }
  setPerformance(profile){this.limit=profile.name==='流畅'?20:profile.name==='均衡'?36:48;}
  clear(){this.events.length=0;this.mesh.count=0;this.mesh.visible=false;this.lastHit=-1;}
  dispose(){this.disposed=true;this.clear();this.mesh.parent?.remove(this.mesh);this.mesh.geometry.dispose();this.mesh.material.dispose();this.mesh.dispose();this.texture.dispose();}
}
