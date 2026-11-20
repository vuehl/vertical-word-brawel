import {y as BufferGeometry,v as BufferAttribute,B as InstanceAttribute,H as InstancedMesh,ct as ShaderMaterial,j as DynamicDraw,b as CanvasTexture,ot as SRGB} from '../assets/three-DmSYIDKK.js';
import atlas from '../public/assets/vfx/fire-family.json' with {type:'json'};
import mushroomAtlas from '../public/assets/vfx/fire-mushroom.json' with {type:'json'};

export const fireFamilyMoves=new Set(['scratch','slash','dragon-claw','fire-fang','flare-blitz','air-slash','inferno','fire-blast','fu-4']);
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const vertex=layout=>`
attribute vec4 iOrigin;attribute vec4 iFrame;attribute vec4 iStyle;attribute vec4 iPose;attribute vec4 iTween;
uniform vec3 heroPosition;
varying vec4 vScreen;varying vec4 vHero;varying vec2 vClarity;
varying vec2 vUv;varying vec2 vLocal;varying vec2 vCut;varying float vAlpha;varying float vPalette;
varying vec2 vNextUv;varying float vBlend;
void main(){
 vec2 local=(uv-iPose.xy)*vec2(iOrigin.w,iStyle.w);
 float a=iStyle.x;vec4 p=viewMatrix*vec4(iOrigin.xyz,1.);
 if(iStyle.y>.5&&iStyle.y<1.5){
  vec2 ground=vec2(local.x*cos(a)-local.y*sin(a),local.x*sin(a)+local.y*cos(a));
  p=viewMatrix*vec4(iOrigin.xyz+vec3(ground.x,0.,-ground.y),1.);
 }else if(iStyle.y>1.5){
  vec3 direction=(viewMatrix*vec4(cos(a),0.,sin(a),0.)).xyz;
  vec2 heading=length(direction.xy)>.001?normalize(direction.xy):vec2(1.,0.);
  p.xy+=heading*local.x+vec2(-heading.y,heading.x)*local.y;
 }else p.xy+=vec2(local.x*cos(a)-local.y*sin(a),local.x*sin(a)+local.y*cos(a));
 gl_Position=projectionMatrix*p;
 vScreen=gl_Position;
 vec4 heroView=viewMatrix*vec4(heroPosition,1.);vec4 heroClip=projectionMatrix*heroView;
 vHero=vec4(heroClip.xy/max(.01,heroClip.w),vec2(projectionMatrix[0][0]*1.15,projectionMatrix[1][1]*1.8)/max(.01,heroClip.w));
 vClarity=iFrame.zw;
 vec2 tile=vec2(mod(iFrame.x,${layout.columns}.),${layout.rows-1}.-floor(iFrame.x/${layout.columns}.));
 vUv=(tile+mix(vec2(.5/${layout.tile}.),vec2(1.-.5/${layout.tile}.),uv))/vec2(${layout.columns}.,${layout.rows}.);
 vec2 nextTile=vec2(mod(iTween.x,${layout.columns}.),${layout.rows-1}.-floor(iTween.x/${layout.columns}.));
 vNextUv=(nextTile+mix(vec2(.5/${layout.tile}.),vec2(1.-.5/${layout.tile}.),uv))/vec2(${layout.columns}.,${layout.rows}.);vBlend=iTween.y;
 vAlpha=iFrame.y;vPalette=iStyle.z;vLocal=uv;vCut=iPose.zw;
}`;
const fragment=`
uniform sampler2D map;uniform float crispCloud;varying vec2 vUv;varying vec2 vLocal;varying vec2 vCut;varying float vAlpha;varying float vPalette;
varying vec4 vScreen;varying vec4 vHero;varying vec2 vClarity;
varying vec2 vNextUv;varying float vBlend;
void main(){
 float lower=vCut.x+(vCut.x>0.?.13*pow(abs(vLocal.x-.5)*2.,2.):0.);
 if(vLocal.y<lower||vLocal.y>vCut.y)discard;
 vec4 ink=texture2D(map,vUv);
 if(vBlend>0.){vec4 nextInk=texture2D(map,vNextUv);float a=mix(ink.a,nextInk.a,vBlend);ink=vec4(mix(ink.rgb*ink.a,nextInk.rgb*nextInk.a,vBlend)/max(.001,a),a);}
 float density=ink.a*smoothstep(crispCloud>.5?.035:.06,crispCloud>.5?.45:.52,ink.a);
 float alpha=density*vAlpha;if(alpha<.01)discard;
 if(vCut.x>0.)alpha*=smoothstep(lower,lower+.06,vLocal.y);
 vec3 pigment=ink.rgb;float light=max(ink.r,max(ink.g,ink.b));
 if(vPalette<.5)pigment=mix(pigment,vec3(1.,.71,.22),smoothstep(.74,1.,ink.g)*.26);
 if(vPalette>4.5){
  // Keep the source's sharp leading stroke; discard its inner stars and rings.
  // Recolour only this wind layer, preserving every fire clip's original paint.
  float rim=length((vLocal-vec2(.23,.5))*vec2(1.,1.12));
  alpha*=smoothstep(.52,.62,rim)*smoothstep(.12,.42,ink.g)*pow(ink.a,.35);
  pigment=vPalette>5.5?mix(vec3(.96,.18,.025),vec3(1.,.94,.57),smoothstep(.3,.86,ink.g)):mix(vec3(.30,.70,.78),vec3(.94,1.,1.),smoothstep(.3,.86,ink.g));
 }else if(vPalette>.5){
  float heat=clamp((min(ink.r,ink.b)+ink.g)*.6,0.,1.);
  if(vPalette<1.5)pigment=mix(vec3(.30,.06,.62),vec3(.93,.76,1.),heat);
  else if(vPalette<2.5)pigment=mix(vec3(.27,.56,.70),vec3(.89,1.,1.),heat);
  else if(vPalette<3.5)pigment=mix(vec3(.95,.12,.015),vec3(1.,.93,.52),heat);
  else pigment=mix(vec3(.36,.42,.49),vec3(1.,.95,.83),heat);
  pigment*=.25+.75*light;
 }
 // Retain the library's painted shading. Only trim export haze and keep the
 // brightest pixels below excessive bloom; no posterisation or noise wipe.
 if(crispCloud>.5)pigment=ink.rgb*(crispCloud<1.5?vec3(.82,.72,.48):vec3(.96,.91,.79));
 if(crispCloud<.5&&vClarity.x>2.5&&vClarity.x<3.5){
  // Restrict the brighter edge to a narrow core; keep a strong coloured cut.
  float body=smoothstep(.20,.76,ink.g),core=smoothstep(.88,.985,ink.g);
  vec3 dark=vPalette<3.5?vec3(.46,.025,.008):vec3(.075,.18,.25);
  vec3 mid=vPalette<3.5?vec3(1.,.30,.018):vec3(.36,.67,.75);
  vec3 hot=vPalette<3.5?vec3(1.,.85,.25):vec3(.88,.97,.94);
  pigment=mix(mix(dark,mid,body),hot,core*.78);
 }else if(crispCloud<.5&&vClarity.x>.5){
  // Keep the hand-painted fissures and rim, without filling the arena yellow.
  float radius=length(vLocal-.5)*2.;
  if(vClarity.x<1.5){
   float heat=smoothstep(.28,.91,ink.g);
   pigment=mix(vec3(.31,.065,.025),vec3(1.,.48,.065),heat);
   alpha*=mix(.38,.82,heat)*mix(.55,1.,smoothstep(.25,.8,radius));
  }else alpha*=mix(.16,1.,smoothstep(.42,.83,radius));
 }
 // A soft local opening makes the hero legible even through an ultimate cap.
 // Enemy-owned effects keep their full warning visibility.
 float heroDistance=length((vScreen.xy/vScreen.w-vHero.xy)/vHero.zw);
 alpha*=mix(1.,mix(.18,1.,smoothstep(.3,1.3,heroDistance)),vClarity.y);
 gl_FragColor=vec4(pigment,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

// Authored frames use bounded atlas batches. No effect here owns a damage timer,
// a projectile trajectory, a movement speed or a collision shape.
export class HandDrawnFireFamily{
 supports(key){return fireFamilyMoves.has(key);}
 constructor(owner,scene){
  this.owner=owner;this.events=[];this.ordered=[];this.groups=[[],[]];this.keys=new Map();this.hitTimes=new Map();this.clock=0;this.limit=128;this.played=0;
  this.impactBudget=Infinity;this.impactBucket=-1;this.impactCount=0;
  const atlasTexture=(file,flag)=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
   const texture=new CanvasTexture(canvas);texture.colorSpace=SRGB;texture.generateMipmaps=false;texture.minFilter=texture.magFilter=1006;
   texture.userData.load=()=>new Promise(resolve=>{
    const image=new Image();
    const finish=ok=>{clearTimeout(timer);image.onload=image.onerror=null;resolve(ok);},timer=setTimeout(()=>finish(false),12000);
    image.onload=()=>{if(!this.disposed){
     // Wind can learn Air Slash after shader warmup allocated the 1x1 fallback.
     // Recreate GPU storage before uploading the full atlas into the same texture.
     texture.dispose();texture.image=image;texture.needsUpdate=true;this[flag]=true;
    }finish(true);};image.onerror=()=>finish(false);image.src=file;
   });
   return texture;
  };
  this.texture=atlasTexture('assets/vfx/fire-family.png','loaded');
  this.mushroomTexture=atlasTexture('assets/vfx/fire-mushroom.png','mushroomLoaded');
  const batch=(capacity,kind)=>{
   const foreground=kind===1,layout=foreground?mushroomAtlas:atlas;
   const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array([0,0,0,1,0,0,1,1,0,0,1,0]),3));g.setAttribute('uv',new BufferAttribute(new Float32Array([0,0,1,0,1,1,0,1]),2));g.setIndex([0,1,2,0,2,3]);
   const attributes=['iOrigin','iFrame','iStyle','iPose','iTween'].map(name=>{const a=new InstanceAttribute(new Float32Array(capacity*4),4).setUsage(DynamicDraw);g.setAttribute(name,a);return a;});
   const m=new ShaderMaterial({vertexShader:vertex(layout),fragmentShader:fragment,uniforms:{map:{value:foreground?this.mushroomTexture:this.texture},crispCloud:{value:foreground?1:0},heroPosition:{value:{x:0,y:0,z:0}}},transparent:true,depthWrite:false,depthTest:!foreground,side:2,toneMapped:false});m.forceSinglePass=true;
   const mesh=new InstancedMesh(g,m,capacity);mesh.name=foreground?'fire-mushroom-foreground':'authored-fire-family';mesh.count=0;mesh.visible=false;mesh.frustumCulled=false;mesh.renderOrder=foreground?1000:7.15;scene.add(mesh);return {mesh,attributes};
  };
  const normal=batch(128,0),top=batch(16,1);this.mesh=normal.mesh;this.attributes=normal.attributes;this.topMesh=top.mesh;this.topAttributes=top.attributes;
 }
 loadTexture(texture){
  return texture.userData.ready??=texture.userData.load();
 }
 get ready(){
  return this.allReady??=Promise.all([this.texture,this.mushroomTexture].map(texture=>this.loadTexture(texture))).then(results=>results.every(Boolean));
 }
 play(clip,x,y,z,size,options={}){
  const own=options.own!==false;if(!this.owner.allowed(own))return null;
  if(this.owner.vfx.view&&!this.owner.vfx.view.visible(x,y,z,size*1.5))return null;
  if(this.events.length>=this.limit){
   // Keep fresh impacts and main ultimate rings ahead of decorative residue.
   let index=this.events.findIndex(e=>e.priority===0);
   if(index<0&&options.foreground)index=this.events.findIndex(e=>!e.foreground);
   if(index<0)return null;
   const removed=this.events.splice(index,1)[0];if(removed.key)this.keys.delete(removed.key);
  }
  this.loadTexture(options.foreground?this.mushroomTexture:this.texture);
  const spec=(options.foreground?mushroomAtlas:atlas).clips[clip];
  const e={clip,x,y,z,size,age:-(options.delay||0),life:spec.count/30,own,alpha:1,angle:0,palette:0,mode:0,anchorX:.5,anchorY:.5,priority:1,cutLower:0,cutUpper:1,...options};
  this.events.push(e);this.played++;return e;
 }
 touch(key,clip,x,y,z,size,options={}){
  if(!this.owner.allowed(options.own!==false))return;
  let e=this.keys.get(key);
  if(!e){e=this.play(clip,x,y,z,size,{...options,key,loop:true});if(e)this.keys.set(key,e);}
  if(e)Object.assign(e,{x,y,z,size,seen:this.clock,...options});return e;
 }
 slashAngle(dx,dz){
  const run=this.owner.run,view=run?.r.camera.matrixWorldInverse.elements;
  if(Math.hypot(dx,dz)<.0001){dx=run?.player.facing.x??1;dz=run?.player.facing.z??0;}
  const screenX=view?dx*view[0]+dz*view[8]:dx,screenY=view?dx*view[1]+dz*view[9]:-dz;
  // The dominant crescent opens toward local +Y: its cutting edge faces -Y.
  // Align that edge to the target in camera space while retaining the drawing.
  return Math.atan2(screenY,screenX)+Math.PI/2;
 }
 impact(key,x,y,z,size=1,own=true){
  if(!this.owner.allowed(own)||this.owner.vfx.view&&!this.owner.vfx.view.visible(x,y,z,4))return;
  const cell=key==='fu-4'||key==='ultimate'||key==='inferno'?3:1;
  const id=key+'/'+Math.floor(x/cell)+'/'+Math.floor(z/cell);
  if(this.clock-(this.hitTimes.get(id)??-100)<.14)return;
  const bucket=Math.floor(this.clock/.12);
  if(bucket!==this.impactBucket){this.impactBucket=bucket;this.impactCount=0;}
  if(this.impactCount>=this.impactBudget)return;
  this.impactCount++;
  this.hitTimes.set(id,this.clock);
  if(key==='fire-fang'){
   this.play('charge',x,y,z,1.7,{own,life:.18,delay:.09,alpha:.9,fadeIn:.015,fadeOut:.12,blend:true});this.owner.impacts++;return;
  }
  if(key==='air-slash'){
   this.play('windHit',x,y+.1,z,3.1,{own,life:.20,palette:2,priority:2});this.owner.impacts++;return;
  }
  if(key==='scratch'||key==='dragon-claw'){
   this.play('scratchHit',x,y,z,2.1,{own,life:.24,palette:key==='dragon-claw'?3:4,clarity:3,angle:-.35,priority:1});this.owner.impacts++;return;
  }
  if(key==='slash'){
   const player=this.owner.run?.player.pos;
   const angle=this.slashAngle(x-(player?.x??x),z-(player?.z??z));
   this.play('blade',x,y,z,3.5,{own,life:.28,palette:4,angle});this.owner.impacts++;return;
  }
  this.play('burst',x,y,z,1.9,{own,life:.26,alpha:.9});this.owner.impacts++;
 }
 strike(key,x,y,z,dx,dz,radius){
  const angle=Math.atan2(dz,dx),size=clamp(radius*1.6,2.5,7);
  if(key==='fire-fang'){
   // One registered, camera-readable drawing: open jaws, close, then ignite.
   // Its impact stays at the strike centre for every attack direction.
   this.play('fang',x,y+.55,z,clamp(size*1.6,5.8,8.2),{life:.43,angle:-.10,priority:2,fadeIn:.035,fadeOut:.15,blend:true,bite:true});
   this.play('burst',x,y+.35,z,size*.68,{delay:.11,life:.28,alpha:.9,fadeIn:.015,fadeOut:.19,blend:true});
   this.play('shockwave',x,y+.20,z,size*.72,{delay:.12,life:.18,mode:1,height:size*.72,alpha:.68,clarity:4,scaleFrom:.25,scaleTo:1.15,fadeOut:.14,blend:true});
   this.play('curl',x,y+.45,z,size*.52,{delay:.22,life:.27,alpha:.40,fadeIn:.035,fadeOut:.20,blend:true});
  }else if(key==='scratch'||key==='dragon-claw')this.play('rake',x,y+.45,z,Math.max(5.5,size*1.55),{life:.44,angle:-.35,palette:key==='dragon-claw'?3:4,clarity:3,priority:2});
  else if(key==='slash')this.play('blade',x,y+.55,z,Math.max(7,size*1.9),{life:.48,angle:this.slashAngle(dx,dz),palette:4,priority:2});
 }
 shot(pool,id,size,opacity,key){
  if(key==='inferno'||key==='fire-blast'){this.owner.fireball.draw(pool,id,key==='inferno'?clamp(size,.8,1.1):clamp(size*1.25,1.1,1.65),opacity);return;}
  const own=!(pool.flags[id]&1),angle=Math.atan2(pool.vz[id],pool.vx[id]);
  const config=key==='air-slash'?{clip:'windCut',size:size*3.3,height:size*5.5,palette:5,mode:1,angle:-angle,cycleHz:3.0,anchorX:.72}:{clip:'seal',size:Math.max(5.8,size*5.5),palette:0,mode:0,angle:0,spin:1.7};
  const head=this.touch('shot/'+key+'/'+id,config.clip,pool.x[id],pool.y[id]+.1,pool.z[id],config.size,{...config,own,alpha:opacity,priority:2});
  if(key==='air-slash'&&head){
   const previous=head.windSample;
   // A short, clock-gated wake follows travelled positions. Paused renders
   // cannot emit residue and returning projectiles keep their actual heading.
   if(!previous||this.clock-previous.time>=.045){
    if(previous&&this.clock-previous.time<.12&&Math.hypot(head.x-previous.x,head.z-previous.z)>.15)
     this.play('windCut',previous.x,previous.y,previous.z,config.size,{height:config.height,own,life:.10,palette:5,mode:1,angle:previous.angle,anchorX:.72,alpha:opacity*.27,scaleFrom:1,scaleTo:.85,priority:0,frameStart:.2,frameEnd:.7});
    head.windSample={x:head.x,y:head.y,z:head.z,angle:config.angle,time:this.clock};
   }
  }
 }
 field(zone){
  if(zone.hideGroundVisual)return;
  // Overlapping persistent burns share a quiet ground drawing. Their actual
  // independent damage zones continue to tick in the combat system.
  const existing=this.keys.get(zone),artRadius=zone.artRadius??zone.r;
  const neighbor=!existing&&this.events.find(e=>e.clip==='crack'&&e.key&&e.key!==zone&&Math.hypot(e.x-zone.x,e.z-zone.z)<Math.min(artRadius,e.size/2)*.9);
  if(neighbor&&this.clock-neighbor.seen<.08)return;
  this.touch(zone,'crack',zone.x,zone.y+.10,zone.z,artRadius*2,{mode:1,height:artRadius*2,alpha:.52,clarity:1,cycleHz:.65,priority:0});
 }
 ring(x,y,z,radius,life=.6){
  this.play('ring',x,y+.14,z,radius*2.1,{life,loop:true,mode:1,height:radius*2.1,grow:true,alpha:.72,clarity:2,priority:2});
 }
 crack(x,y,z,size=2.5){this.play('crack',x,y+.12,z,size,{mode:1,height:size,life:.65,loop:true,alpha:.54,clarity:1,priority:0});}
 meteor(x,y,z,delay){
  this.play('meteor',x,y+12,z,20,{life:delay,anchorY:.12,fall:12,priority:2});
  this.play('seal',x,y+12,z,3.1,{life:delay,fall:12,loop:true,priority:2});
 }
 meteorImpact(x,y,z){
  this.play('meteorHit',x,y,z,8.6,{life:.64,anchorY:.22,priority:2});
  this.play('shockwave',x,y+.16,z,9,{life:.46,mode:1,height:11.5,alpha:.86,priority:1});
  this.crack(x,y,z,6);
 }
 ultimateRing(x,y,z,radius,life=.6){
  this.ring(x,y,z,radius,life);
  this.play('shockwave',x,y+.19,z,radius*2.15,{life:life*.65,mode:1,height:radius*2.15,alpha:.36,clarity:2,priority:2,delay:.07});
 }
 finale(x,y,z,radius){
  // The final strike uses the Inferno blast, not a second mushroom cloud.
  this.play('eruption',x,y+.15,z,26,{life:1.15,anchorY:.22,priority:2,foreground:true,layer:1,fadeIn:.04,fadeOut:.45,blend:true});
  this.play('pillar',x,y,z,11,{height:19,life:1.08,delay:.10,alpha:.62,anchorY:.18,priority:2,foreground:true,layer:0,fadeIn:.08,fadeOut:.5,blend:true});
  this.play('sweepRing',x,y+.2,z,radius*1.85,{life:.52,mode:1,height:radius*1.85,spin:1.1,delay:.10,alpha:.48,clarity:2,priority:2});
  this.play('shockwave',x,y+.22,z,radius*2.15,{life:.5,mode:1,height:radius*2.15,delay:.17,alpha:.4,clarity:2,priority:2});
 }
 ultimate(ctx){
  const {x,y,z,tier}=ctx;
  this.play('seal',x,y+.22,z,8,{life:.25,mode:1,height:11,priority:2,scaleFrom:1.1,scaleTo:.45});
  this.play('charge',x,y+.45,z,3.8,{life:.18,priority:2});
  this.mushroom(x,y,z,1.25+tier*.14,.10);
  this.play('sweepRing',x,y+.22,z,7.5,{delay:.14,life:.55,mode:1,height:10,spin:1.3,priority:2});
 }
 mushroom(x,y,z,life=1.4,delay=0){
  const scale=.60;
  // A narrow rising stem and a broad rolling cap share the library drawing.
  // The dedicated last scene pass cannot be covered by actors or other VFX.
  this.play('pillar',x,y,z,7.6*scale,{height:23*scale,life,delay,anchorY:.14,cutUpper:.59,frameStart:.04,frameEnd:.46,mushroomPart:'stem',foreground:true,layer:0,priority:2,fadeIn:.08,fadeOut:.35,blend:true});
  this.play('pillar',x,y+12.8*scale,z,21.2*scale,{height:24*scale,life:life-.12,delay:delay+.20,anchorY:.50,cutLower:.47,frameStart:.13,frameEnd:.46,mushroomPart:'cap',foreground:true,layer:2,priority:2,fadeIn:.12,fadeOut:.42,blend:true});
  this.play('sweepRing',x,y+10.2*scale,z,11.2*scale,{height:6.3*scale,life:1.1,delay:delay+.25,mode:1,spin:.7,priority:2,alpha:.36,scaleFrom:.65,scaleTo:1.05,fadeIn:.10,fadeOut:.5,blend:true});
 }
 fusionVortex(key,x,y,z,radius,main){
  this.owner.touch(key,{x,y,z,radius:radius*(main?1.05:.95),height:radius*3,mode:3,type:'fire',handDrawn:true,own:true});
  this.touch(key,'sweepRing',x,y+.18,z,radius*2.5,{height:radius*2.5,mode:1,spin:-1.8,priority:2,alpha:.32,clarity:2});
 }
 fusionSpoke(x,y,z,dx,dz,radius){
  this.play('wake',x+dx*radius,y+.8,z+dz*radius,6,{life:.42,mode:2,angle:Math.atan2(-dz,-dx),travelX:dx*5,travelZ:dz*5,priority:1});
 }
 fusionBurst(x,y,z,radius,main){
  this.play('eruption',x,y,z,main?12:8,{life:.65,anchorY:.2,priority:2});
  this.play('pillar',x,y,z,main?8:5,{height:main?12:8,life:.6,delay:.08,alpha:.7,anchorY:.18,priority:2});
  this.ultimateRing(x,y,z,radius*(main?1.25:1.1),.8);
 }
 fireBlast(x,y,z,radius){
  const f=this,s=clamp(radius,2.8,5.5);
  f.play('eruption',x,y,z,s*2.7,{foreground:true,life:.64,anchorY:.22,priority:2,fadeIn:.025,fadeOut:.28,blend:true});
  // Five broad flame arms preserve the original star-shaped explosion.
  for(const a of [Math.PI/2,Math.PI*.08,Math.PI*.92,Math.PI*1.27,Math.PI*1.73])f.play('wake',x,y+1.8,z,s*1.4,{height:s*.72,angle:a+Math.PI,mode:0,life:.48,delay:.055,alpha:.86,scaleFrom:.50,scaleTo:1.3,anchorX:.88,frameStart:.08,frameEnd:.46,fadeIn:.025,fadeOut:.22,blend:true,priority:2});
  f.play('shockwave',x,y+.16,z,s*2.3,{mode:1,height:s*2.3,life:.42,alpha:.45,fadeIn:.025,fadeOut:.28,scaleFrom:.5,scaleTo:1.15,blend:true});
 }
 sun(ctx,x,y,z,age,artScale=1){
  const continuing=ctx.sunArtStarted&&age>=ctx.sunArtAge;ctx.sunArtAge=age;
  if(continuing)return;ctx.sunArtStarted=true;
  const floor=this.owner.run.terrain.height(x,z);
  this.solarBlast(x,floor,z,3.2,.65);
  this.play('ring',x,floor+.15,z,9.5*artScale,{mode:1,height:9.5*artScale,life:1.8*(ctx.D||1),loop:true,alpha:.30,clarity:2,fadeIn:.15,fadeOut:.35,blend:true});
 }
 sunRain(x,sky,z,floor,startX=x,startZ=z){
  this.play('meteor',startX,sky,startZ,2.3,{height:3.5,life:.30,travelX:x-startX,travelZ:z-startZ,fall:sky-floor,anchorY:.14,frameStart:.05,frameEnd:.64,priority:1,fadeIn:.05,fadeOut:.04,blend:true});
 }
 sunImpact(x,y,z,radius){
  this.play('burst',x,y+.15,z,Math.min(3.1,radius*1.6),{life:.42,anchorY:.32,priority:1,alpha:.74,fadeIn:.05,fadeOut:.24,blend:true});
 }
 sunBurst(x,y,z,radius){
  this.solarBlast(x,y,z,radius,.80);
  this.ultimateRing(x,y,z,radius*1.35,.65);
 }
 solarBlast(x,y,z,radius,life){
  // The same burst + flame pillar as Inferno, sampled from the large atlas.
  this.play('eruption',x,y,z,Math.max(8,radius*2.4),{life,anchorY:.22,priority:2,foreground:true,layer:1,fadeIn:.04,fadeOut:.28,blend:true});
  this.play('pillar',x,y,z,Math.max(5,radius*1.5),{height:Math.max(8,radius*2.5),life:life-.05,delay:.08,alpha:.65,anchorY:.18,foreground:true,layer:0,fadeIn:.06,fadeOut:.28,blend:true});
 }
 update(dt){
  dt=Math.max(0,dt);this.clock+=dt;
  if(!this.events.length&&!this.hitTimes.size)return;
  let liveCount=0;
  for(const e of this.events){
   e.age+=dt;
   if(e.key&&e.releaseLife&&this.clock-e.seen>=.10){const overdue=this.clock-e.seen-.10;this.keys.delete(e.key);Object.assign(e,{key:null,phaseOffset:e.age-overdue,age:overdue,life:e.releaseLife,releasing:true,scaleFrom:1,scaleTo:1.16,fadeIn:0,fadeOut:e.releaseLife});}
   const live=this.owner.allowed(e.own)&&(e.key?this.clock-e.seen<.10:e.age<e.life);
   if(!live&&e.key)this.keys.delete(e.key);
   if(live)this.events[liveCount++]=e;
  }
  this.events.length=liveCount;
  for(const [key,t] of this.hitTimes)if(this.clock-t>1)this.hitTimes.delete(key);
  const v=this.owner.vfx,camera=this.owner.run?.r.camera.position;
  const hero=this.owner.run?.player.pos;
  if(hero)for(const mesh of [this.mesh,this.topMesh])Object.assign(mesh.material.uniforms.heroPosition.value,{x:hero.x,y:hero.y+1,z:hero.z});
  // Transparent quads are sorted back to front within the batch.
  const ordered=this.ordered;ordered.length=0;
  for(let i=0;i<Math.min(this.events.length,this.limit);i++)ordered.push(this.events[i]);
  if(camera)ordered.sort((a,b)=>(b.x-camera.x)**2+(b.y-camera.y)**2+(b.z-camera.z)**2-((a.x-camera.x)**2+(a.y-camera.y)**2+(a.z-camera.z)**2));
  for(const group of this.groups)group.length=0;
  for(const e of ordered)this.groups[e.foreground?1:0].push(e);
  for(const kind of [0,1]){
  const foreground=kind===1,mesh=foreground?this.topMesh:this.mesh,attributes=foreground?this.topAttributes:this.attributes;
  const origin=attributes[0].array,frame=attributes[1].array,style=attributes[2].array,pose=attributes[3].array,tween=attributes[4].array;let count=0;
  const group=this.groups[kind];if(foreground)group.sort((a,b)=>(a.layer||0)-(b.layer||0));
  for(const e of group){
   if(e.age<0)continue;
   if(count>=(foreground?16:this.limit))break;
   const spec=(foreground?mushroomAtlas:atlas).clips[e.clip],t=clamp(e.age/e.life),ease=1-(1-t)**2;
   const biteHit=e.bite?Math.max(0,1-Math.abs(e.age-.14)/.06):0;
   const growth=e.bite?1.08-.13*smooth(e.age/.14)+biteHit*.07:e.mushroomPart==='stem'?.72+.28*clamp(e.age/.18):e.mushroomPart==='cap'?.30+.70*(1-(1-clamp(e.age/.28))**3):e.grow?.18+.82*Math.sin(Math.min(1,t*1.5)*Math.PI/2):e.scaleFrom!=null?e.scaleFrom+(e.scaleTo-e.scaleFrom)*ease:1;
   const vertical=e.bite?growth*(1-biteHit*.24):e.mushroomPart==='stem'?.16+.84*(1-(1-clamp(e.age/.30))**2):e.mushroomPart==='cap'?.50+.50*(1-(1-clamp(e.age/.32))**2):growth;
   // Brief anticipation, fast closure, then a short recoil and continuous fade.
   const progress=e.bite?(e.age<.065?e.age/.065*.045:e.age<.14?.045+smooth((e.age-.065)/.075)*.365:.41+(e.age-.14)/.29*.59):e.hold?(t<.58?t/.58*.35:.35+(t-.58)/.42*.65):t;
   const start=e.frameStart||0,end=e.frameEnd??1,phase=e.frameProgress??(start+(end-start)*(e.loop?((e.age+(e.phaseOffset||0))*(e.cycleHz??1.4))%1:progress));
   const looping=e.loop&&e.frameProgress==null,position=clamp(phase)*(looping||!e.blend?spec.count:spec.count-1),index=Math.min(spec.count-1,Math.floor(position)),next=looping?(index+1)%spec.count:Math.min(spec.count-1,index+1);
   const birth=e.fadeIn?smooth(e.age/e.fadeIn):1,fade=e.fadeOut?smooth((e.life-e.age)/e.fadeOut):e.key||e.mushroomPart?1:Math.min(1,(1-t)*5);
   const alpha=e.alpha*(e.own?v.ownOpacity:1)*v.opacity*(v.calm?.76:1)*birth*fade;
   const o=count++*4;
   origin[o]=e.x+(e.travelX||0)*t+(e.releasing?(e.tailVX||0)*e.life*smooth(t):0);origin[o+1]=e.y-(e.fall||0)*t+(e.rise||0)*t;origin[o+2]=e.z+(e.travelZ||0)*t+(e.releasing?(e.tailVZ||0)*e.life*smooth(t):0);origin[o+3]=e.size*growth;
   frame[o]=spec.first+index;frame[o+1]=alpha;frame[o+2]=e.clarity||0;frame[o+3]=e.own&&(e.palette===0||e.heroOpening)?1:0;
   style[o]=e.angle+(e.spin||0)*(e.age+(e.phaseOffset||0));style[o+1]=e.mode;style[o+2]=e.palette;style[o+3]=(e.height||e.size)*vertical;
   pose[o]=e.anchorX;pose[o+1]=e.anchorY;pose[o+2]=e.cutLower;pose[o+3]=e.cutUpper;tween[o]=spec.first+next;tween[o+1]=e.blend?position-index:0;tween[o+2]=tween[o+3]=0;
  }
  mesh.count=(foreground?this.mushroomLoaded:this.loaded)?count:0;mesh.visible=mesh.count>0;
  if(count)for(const a of attributes){a.clearUpdateRanges();a.addUpdateRange(0,count*4);a.needsUpdate=true;}
  }
 }
 setPerformance(profile){this.limit=profile.name==='流畅'?48:profile.name==='均衡'?80:128;this.impactBudget=profile.fireImpactBudget??(profile.name==='流畅'?4:Infinity);}
 clear(){this.events.length=this.ordered.length=0;for(const group of this.groups)group.length=0;this.impactBucket=-1;this.impactCount=0;this.keys.clear();this.hitTimes.clear();for(const mesh of [this.mesh,this.topMesh]){mesh.count=0;mesh.visible=false;}}
 dispose(){this.disposed=true;this.clear();for(const mesh of [this.mesh,this.topMesh]){mesh.parent?.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();mesh.dispose();}this.texture.dispose();this.mushroomTexture.dispose();}
}

export function installFireFamilyVFX(registry){
 for(const key of fireFamilyMoves){
  const old=registry[key];if(!old)continue;
  const fx=r=>r.vfx.crafted.fireFamily;
  registry[key]={...old,
   draw:(p,id,size,alpha)=>fx(p.run).shot(p,id,size,alpha,key),trail:()=>{},
   cast(r,x,y,z){if(key==='inferno')fx(r).play('seal',x,y,z,5,{life:.3});else if(key==='fire-blast')fx(r).play('charge',x,y,z,3.2,{life:.2,fadeIn:.03,fadeOut:.1,blend:true});},
   strike:(r,x,y,z,dx,dz,radius)=>fx(r).strike(key,x,y,z,dx,dz,radius),
   hit:(r,x,y,z,size)=>fx(r).impact(key,x,y,z,size),
   boom(r,x,y,z,radius=3,color,artRadius=radius){
    const f=fx(r),floor=r.terrain.height(x,z);
    if(key==='fire-blast'){f.fireBlast(x,floor,z,artRadius);return;}
    f.play('eruption',x,floor,z,Math.max(8,artRadius*2.4),{life:.6,anchorY:.22,priority:2});
    f.play('pillar',x,floor,z,Math.max(5,artRadius*1.5),{height:Math.max(8,artRadius*2.5),life:.55,delay:.08,alpha:.65,anchorY:.18});
    f.ultimateRing(x,floor,z,artRadius*1.35,.55);
   },
   dash(r,x,y,z,dx,dz,length,color,artLength=length){
    fx(r).play('wake',x+dx*length*.35,y+.6,z+dz*length*.35,Math.min(16,artLength*1.7),{mode:2,angle:Math.atan2(-dz,-dx),life:.5});
    fx(r).play('curl',x,y+.6,z,4.8,{life:.4});
   },
  };
 }
 if(registry['dragon-breath'])registry['dragon-breath']={...registry['dragon-breath'],cast:()=>{},trail:()=>{},hit:(r,x,y,z)=>r.vfx.crafted.fireJet.impact(x,y,z,true,false,true)};
}
