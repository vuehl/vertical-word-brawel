import {y as BufferGeometry,v as BufferAttribute,B as InstanceAttribute,H as InstancedMesh,ct as ShaderMaterial,j as DynamicDraw,b as CanvasTexture,ot as SRGB} from '../assets/three-DmSYIDKK.js';
import atlas from '../public/assets/vfx/fire-breath.json' with {type:'json'};
import {ProceduralFireJet} from './procedural-fire-jet.js';

const vertex=`
attribute vec4 iFlameOrigin;attribute vec4 iFlameMotion;attribute vec4 iFlameLife;
varying vec2 vFrameUv;varying float vFrame;varying float vAlpha;varying float vKind;varying float vFuel;varying float vPurple;
void main(){
  vec4 p=viewMatrix*vec4(iFlameOrigin.xyz,1.);
  vKind=mod(iFlameMotion.w,4.);vPurple=step(3.5,iFlameMotion.w);vFrameUv=uv;vAlpha=iFlameLife.y;vFuel=iFlameLife.x;
  if(vKind>1.5){
    p.xy+=(uv-.5)*iFlameOrigin.w;
    vFrame=${atlas.clips.hit.first}.+min(${atlas.clips.hit.count-1}.,floor(iFlameLife.w*48.));
  }else{
    vec3 forward=(viewMatrix*vec4(iFlameMotion.x,0.,iFlameMotion.y,0.)).xyz;
    vec2 heading=length(forward.xy)>.001?normalize(forward.xy):vec2(1.,0.);
    bool core=vKind>.5;
    float extentLength=iFlameMotion.z*(core?1.:1.15);
    float width=iFlameOrigin.w*(core?3.2:2.6);
    vec2 local=(uv-vec2(.5,core?.57:.5))*vec2(extentLength,width);
    // Longitudinal foreshortening follows the unchanged world trajectory.
    // The cross section faces the camera: no 3D skin, raymarch or mesh warp.
    p.xyz+=forward*local.x;p.xy+=vec2(-heading.y,heading.x)*local.y;
    vFrame=core?5.+mod(floor(iFlameLife.w*24.+iFlameLife.z*4.),10.):5.+min(7.,floor(iFlameLife.x*8.));
  }
  gl_Position=projectionMatrix*p;
}`;
const fragment=`
uniform sampler2D map;
varying vec2 vFrameUv;varying float vFrame;varying float vAlpha;varying float vKind;varying float vFuel;varying float vPurple;
void main(){
  vec2 uv=vFrameUv;float edge=1.;
  if(vKind<.5){
    // The broad, curling end of the same drawing becomes each travelling
    // tongue. A soft crop removes its old nozzle without a rectangular seam.
    uv=mix(vec2(.52,.18),vec2(.98,.82),uv);
    edge=smoothstep(0.,.22,vFrameUv.x)*(1.-smoothstep(.96,1.,vFrameUv.x));
  }else if(vKind<1.5){
    // Preserve the old core's fuel clearing from the nozzle towards the tip.
    edge=smoothstep(vFuel-.05,vFuel+.10,uv.x);
  }
  vec2 tile=vec2(mod(vFrame,${atlas.columns}.),${atlas.rows-1}.-floor(vFrame/${atlas.columns}.));
  vec2 sampleUv=(tile+mix(vec2(.5/${atlas.tile}.),vec2(1.-.5/${atlas.tile}.),uv))/vec2(${atlas.columns}.,${atlas.rows}.);
  vec4 ink=texture2D(map,sampleUv);
  if(vKind<1.5){
    // Simplify the pigment inside each original flame, keeping its outline
    // and motion. Broad temperature fields replace thin white filigree.
    vec2 d=vec2(10.5/${atlas.columns*atlas.tile}.,10.5/${atlas.rows*atlas.tile}.);
    vec2 lo=(tile+vec2(.5/${atlas.tile}.))/vec2(${atlas.columns}.,${atlas.rows}.),hi=(tile+vec2(1.-.5/${atlas.tile}.))/vec2(${atlas.columns}.,${atlas.rows}.);
    vec4 a=texture2D(map,clamp(sampleUv+vec2(d.x,0.),lo,hi)),b=texture2D(map,clamp(sampleUv-vec2(d.x,0.),lo,hi));
    vec4 c=texture2D(map,clamp(sampleUv+vec2(0.,d.y),lo,hi)),f=texture2D(map,clamp(sampleUv-vec2(0.,d.y),lo,hi));
    vec4 g=texture2D(map,clamp(sampleUv+d,lo,hi)),h=texture2D(map,clamp(sampleUv-d,lo,hi));
    vec4 k=texture2D(map,clamp(sampleUv+vec2(d.x,-d.y),lo,hi)),l=texture2D(map,clamp(sampleUv+vec2(-d.x,d.y),lo,hi));
    float coverage=(ink.a*2.+a.a+b.a+c.a+f.a+g.a+h.a+k.a+l.a)/10.;
    vec3 broad=(ink.rgb*ink.a*2.+a.rgb*a.a+b.rgb*b.a+c.rgb*c.a+f.rgb*f.a+g.rgb*g.a+h.rgb*h.a+k.rgb*k.a+l.rgb*l.a)/max(.001,coverage*10.);
    // Merge thin internal lines into three broad, saturated paint regions.
    // Sharp colour thresholds keep the result flat instead of blurring it.
    float heat=broad.g/max(.08,broad.r);
    ink.rgb=mix(vec3(.95,.045,.006),vec3(1.,.26,.012),smoothstep(.18,.34,heat));
    ink.rgb=mix(ink.rgb,vec3(1.,.78,.12),smoothstep(.68,.84,heat));
    // Remove only isolated pinpricks; no blur is applied to the silhouette.
    ink.a=smoothstep(.22,.46,coverage);
  }
  if(vKind>1.5){
    // Sustained hits use the painted flame, keeping the large dusty blast
    // from turning each damage tick into a new explosion.
    float dust=(1.-smoothstep(.30,.46,ink.r))*smoothstep(.42,.68,ink.g/max(ink.r,.001));
    edge*=1.-dust*.85;
  }
  float alpha=ink.a*smoothstep(.04,.42,ink.a)*vAlpha*edge;if(alpha<.008)discard;
  vec3 pigment=ink.rgb;
  if(vPurple>.5){
    float heat=clamp(ink.g/max(ink.r,.001),0.,1.);
    pigment=mix(vec3(.24,.025,.58),vec3(.66,.17,.96),smoothstep(.02,.40,heat));
    pigment=mix(pigment,vec3(.94,.79,1.),smoothstep(.40,.95,heat));
    pigment*=.35+.65*max(ink.r,max(ink.g,ink.b));
  }
  gl_FragColor=vec4(pigment,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
function flameGeometry(){
  const g=new BufferGeometry();
  g.setAttribute('position',new BufferAttribute(new Float32Array([0,0,0,1,0,0,1,1,0,0,1,0]),3));
  g.setAttribute('uv',new BufferAttribute(new Float32Array([0,0,1,0,1,1,0,1]),2));g.setIndex([0,1,2,0,2,3]);return g;
}

const TAU=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const random=n=>{const x=Math.sin(n*127.1+43.7)*43758.5453;return x-Math.floor(x);};
// Other fire cones share the original simulation and budget, but retain
// their existing shader. Test/remote emitters without a move use the spray.
const painted=emitter=>!emitter.key?.def||['flamethrower','dragon-breath','heat-wave'].includes(emitter.key.def.key);

export class HandDrawnFireJet{
  constructor(owner,scene){
    this.owner=owner;this.packets=[];this.serial=0;this.spawned=0;this.expired=0;this.limit=112;this.packetLimit=112;this.rate=48;this.clock=0;
    this.hits=[];this.hitTimes=new Map();this.hitLimit=28;
    this.legacy=new ProceduralFireJet(owner,scene);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
    const texture=this.texture=new CanvasTexture(canvas);texture.colorSpace=SRGB;texture.generateMipmaps=false;texture.minFilter=texture.magFilter=1006;
    const image=new Image();
    this.ready=new Promise(resolve=>{
      const finish=ok=>{clearTimeout(timer);image.onload=image.onerror=null;this.loadError=!ok;resolve(ok);};
      const timer=setTimeout(()=>finish(false),12000);
      image.onload=()=>{if(!this.disposed){texture.image=image;texture.needsUpdate=true;this.loaded=true;}finish(true);};
      image.onerror=()=>finish(false);image.src='assets/vfx/fire-breath.png';
    });texture.userData.ready=this.ready;
    const geometry=flameGeometry(),capacity=112;
    this.attributes=['iFlameOrigin','iFlameMotion','iFlameLife'].map(name=>{
      const attribute=new InstanceAttribute(new Float32Array(capacity*4),4).setUsage(DynamicDraw);geometry.setAttribute(name,attribute);return attribute;
    });
    const material=new ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{map:{value:texture}},transparent:true,depthTest:true,depthWrite:false,side:2,toneMapped:false});
    material.forceSinglePass=true;
    this.mesh=new InstancedMesh(geometry,material,capacity);this.mesh.count=0;this.mesh.frustumCulled=false;
    this.mesh.name='authored-fire-breath';this.mesh.renderOrder=7.2;this.mesh.visible=false;scene.add(this.mesh);
    const hitGeometry=flameGeometry();
    this.hitAttributes=['iFlameOrigin','iFlameMotion','iFlameLife'].map(name=>{
      const a=new InstanceAttribute(new Float32Array(32*4),4).setUsage(DynamicDraw);hitGeometry.setAttribute(name,a);return a;
    });
    this.hitMesh=new InstancedMesh(hitGeometry,material,32);this.hitMesh.name='authored-fire-breath-hits';this.hitMesh.count=0;this.hitMesh.visible=false;this.hitMesh.frustumCulled=false;this.hitMesh.renderOrder=7.3;scene.add(this.hitMesh);
  }
  setPerformance(profile){
    this.legacy.setPerformance(profile);
    this.limit=profile.name==='流畅'?40:profile.name==='均衡'?72:112;
    this.rate=profile.name==='流畅'?28:profile.name==='均衡'?38:48;
    this.hitLimit=profile.name==='流畅'?12:profile.name==='均衡'?20:28;
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
      radius:(.38+b*.30)*scale,stretch:(.85+c*.35)*scale,lift:.45+c*.7,own:emitter.own!==false,painted:painted(emitter),purple:emitter.type==='dragon'});
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
  impact(x,y,z,own=true,critical=false,purple=false){
    if(!this.owner.allowed(own)||this.hits.length>=this.hitLimit)return;
    if(this.owner.vfx.view&&!this.owner.vfx.view.visible(x,y,z,3))return;
    const key=Math.round(x*1.5)+'/'+Math.round(z*1.5)+'/'+purple,last=this.hitTimes.get(key)??-100;
    if(this.clock-last<.14)return;
    this.hitTimes.set(key,this.clock);this.hits.push({x,y,z,own,purple,age:0,size:critical?1.65:1.2});
    this.owner.impacts++;
  }
  updateHits(dt){
    dt=Math.max(0,dt);this.hits=this.hits.filter(h=>{h.age+=dt;return h.age<atlas.clips.hit.count/48&&this.owner.allowed(h.own);});
    for(const [key,time] of this.hitTimes)if(this.clock-time>1)this.hitTimes.delete(key);
    const [origin,motion,life]=this.hitAttributes.map(a=>a.array),v=this.owner.vfx;let count=0;
    for(const h of this.hits){
      if(count>=this.hitLimit)break;const o=count++*4;
      origin.set([h.x,h.y,h.z,h.size],o);motion.set([1,0,h.size,2+(h.purple?4:0)],o);
      life.set([h.age*48/atlas.clips.hit.count,.66*v.opacity*(h.own?v.ownOpacity:1)*(v.calm?.78:1),0,h.age],o);
    }
    this.hitMesh.count=this.loaded?count:0;this.hitMesh.visible=this.hitMesh.count>0;
    for(const a of this.hitAttributes){a.clearUpdateRanges();a.addUpdateRange(0,count*4);a.needsUpdate=true;}
  }
  update(dt,emitters){
    const owner=this.owner,run=owner.run;this.clock+=Math.max(0,dt);
    this.packetLimit=Math.max(0,this.limit-emitters.length);
    if(!emitters.length&&!this.packets.length&&!this.mesh.count&&!this.legacy.mesh.count){
      if(this.hits.length||this.hitTimes.size||this.hitMesh.count)this.updateHits(dt);
      return;
    }
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
    for(const packet of this.packets){
      packet.sample=this.sample(packet);if(packet.painted&&packet.id%2!==0)continue;
      // Keep the old rolling fan, with fewer, larger overlapping tongues.
      const far=packet.painted?smooth((packet.sample.p-.52)/.30):0;
      const scale=packet.painted?1.5*(1-far*.32):1;
      // Far tongues shrink and extinguish before leaving the visual fan.
      // Their simulation and the move's damage cone are unchanged.
      const alpha=packet.sample.alpha*.88*(1-far);if(packet.painted&&alpha<.012)continue;
      instances.push({...packet.sample,radius:packet.sample.radius*scale,length:packet.sample.length*scale,alpha,dx:packet.dx,dz:packet.dz,seed:packet.seed,age:packet.age,own:packet.own,painted:packet.painted,purple:packet.purple});
    }
    // The original connecting core retains its growth, length, timing and
    // stop envelope. Only its pixels now come from the authored spray frames.
    for(const emitter of emitters){
      const authored=painted(emitter),growth=smooth(emitter.age/.24),length=emitter.length*(authored?.66:.55)*growth;
      if(length<.025)continue;
      const dx=Math.cos(emitter.angle),dz=Math.sin(emitter.angle),tail=clamp((this.clock-(emitter.fireLast??this.clock))/.10);
      instances.push({x:emitter.x+dx*length*.5,y:emitter.y+.20,z:emitter.z+dz*length*.5,radius:length*.36,
        length,dx,dz,p:tail,alpha:(authored?.86:.78)*growth*(1.-smooth((tail-.6)/.4)),seed:emitter.seed,age:emitter.age,core:1,own:emitter.own!==false,painted:authored,purple:emitter.type==='dragon'});
    }
    for(const p of instances)p.depth=(p.x-camera.x)**2+(p.y-camera.y)**2+(p.z-camera.z)**2;
    instances.sort((a,b)=>b.depth-a.depth);
    for(const [renderer,authored] of [[this,true],[this.legacy,false]]){
      const [origin,motion,life]=renderer.attributes.map(a=>a.array);let count=0;
      for(const p of instances){
        if(p.painted!==authored)continue;
        const o=count++*4,opacity=owner.vfx.opacity*(p.own?owner.vfx.ownOpacity:1)*(owner.vfx.calm?.78:1);
        origin.set([p.x,p.y,p.z,p.radius],o);motion.set([p.dx,p.dz,p.length,(p.core||0)+(p.purple?4:0)],o);
        life.set([p.p,p.alpha*opacity,p.seed,p.age],o);
      }
      renderer.mesh.count=authored&&!this.loaded?0:count;renderer.mesh.visible=renderer.mesh.count>0;
      for(const attribute of renderer.attributes){attribute.clearUpdateRanges();attribute.addUpdateRange(0,count*4);attribute.needsUpdate=true;}
    }
    this.updateHits(dt);
  }
  clear(){this.packets.length=0;this.mesh.count=0;this.mesh.visible=false;this.hits.length=0;this.hitTimes.clear();this.hitMesh.count=0;this.hitMesh.visible=false;this.legacy.clear();}
  dispose(){this.disposed=true;this.clear();this.legacy.dispose();this.mesh.parent?.remove(this.mesh);this.hitMesh.parent?.remove(this.hitMesh);this.mesh.geometry.dispose();this.hitMesh.geometry.dispose();this.mesh.material.dispose();this.mesh.dispose();this.hitMesh.dispose();this.texture.dispose();}
}
