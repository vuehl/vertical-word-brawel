import {K as Mesh,y as BufferGeometry,v as BufferAttribute,ct as ShaderMaterial,b as CanvasTexture,ot as SRGB} from '../assets/three-DmSYIDKK.js';

// Fixed world centres, viewed through the real camera. Only the narrow ribbon
// cross-section and round bulb cards face the view; nothing follows the player.
const SEGMENTS=48,WIRE_RADIUS=.065,BULB_RADIUS=.25,BULB_HEIGHT=.625;
const TILE=128,TILE_HEIGHT=144,COLORS=['#ffe0a0','#a4dfbf','#f4a5c0','#73dbe7'];
const FULL_DISTANCE=20,HIDE_DISTANCE=38;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);

export function distanceToStrand(points,x,z){
  let nearest=Infinity;
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[2]-a[2];
    const t=clamp(((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1),0,1);
    nearest=Math.min(nearest,Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t));
  }
  return nearest;
}
export function strandOpacity(distance){return 1-smooth(clamp((distance-FULL_DISTANCE)/(HIDE_DISTANCE-FULL_DISTANCE),0,1));}

function bulbAtlas(){
  const canvas=document.createElement('canvas');canvas.width=TILE*COLORS.length;canvas.height=TILE_HEIGHT;
  const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);
  COLORS.forEach((color,index)=>{
    c.save();c.translate(index*TILE,0);
    // .8 by .9 world-unit card; visible body .5 by .55, matching the old
    // .25-radius ellipsoid's apparent height at the normal camera pitch.
    const x=64,y=72,rx=40,ry=44;
    const halo=c.createRadialGradient(x,y,20,x,y,57);
    halo.addColorStop(0,color+'32');halo.addColorStop(1,color+'00');
    c.fillStyle=halo;c.beginPath();c.ellipse(x,y,57,62,0,0,Math.PI*2);c.fill();
    const glass=c.createLinearGradient(x-rx,y-ry,x+rx,y+ry);
    glass.addColorStop(0,'#fff2d7');glass.addColorStop(.28,color);glass.addColorStop(1,'#71989a');
    c.fillStyle=glass;c.strokeStyle='#3b5560';c.lineWidth=4;
    c.beginPath();c.ellipse(x,y,rx-2,ry-2,0,0,Math.PI*2);c.fill();c.stroke();
    c.fillStyle='#637570';c.fillRect(x-13,y-48,26,12);
    c.strokeStyle='#364b54';c.lineWidth=2;c.strokeRect(x-13,y-48,26,12);
    c.fillStyle='#fff8e3bb';c.beginPath();c.ellipse(x-13,y-17,8,15,-.25,0,Math.PI*2);c.fill();
    c.restore();
  });
  const texture=new CanvasTexture(canvas);texture.colorSpace=SRGB;
  texture.generateMipmaps=false;texture.minFilter=texture.magFilter=1006;texture.name='world-anchored-light-bulbs';
  return texture;
}

function makeGeometry(points,bulbs){
  const position=[],tangent=[],offset=[],uv=[],kind=[],radius=[],index=[];
  const vertex=(p,t,o,tex,k,r)=>{
    const n=position.length/3;position.push(...p);tangent.push(...t);offset.push(...o);uv.push(...tex);kind.push(k);radius.push(r);return n;
  };
  for(let i=0;i<points.length;i++){
    const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],t=b.map((v,k)=>v-a[k]);
    vertex(points[i],t,[-WIRE_RADIUS,0],[0,i/SEGMENTS],0,WIRE_RADIUS);
    vertex(points[i],t,[WIRE_RADIUS,0],[1,i/SEGMENTS],0,WIRE_RADIUS);
    if(i<points.length-1){const n=i*2;index.push(n,n+1,n+2,n+1,n+3,n+2);}
  }
  for(const bulb of bulbs){
    // Actual world-vertical stems join the optical bulb centres to the rope.
    const a=bulb.attachment,b=bulb.center,t=b.map((v,k)=>v-a[k]),r=.04;
    const n=vertex(a,t,[-r,0],[0,0],0,r);
    vertex(a,t,[r,0],[1,0],0,r);vertex(b,t,[-r,0],[0,1],0,r);vertex(b,t,[r,0],[1,1],0,r);
    index.push(n,n+1,n+2,n+1,n+3,n+2);
    const left=bulb.colorIndex/COLORS.length,right=(bulb.colorIndex+1)/COLORS.length;
    const m=vertex(b,[1,0,0],[-.4,-.45],[left,0],1,0);
    vertex(b,[1,0,0],[.4,-.45],[right,0],1,0);
    vertex(b,[1,0,0],[-.4,.45],[left,1],1,0);
    vertex(b,[1,0,0],[.4,.45],[right,1],1,0);
    index.push(m,m+1,m+2,m+1,m+3,m+2);
  }
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new BufferAttribute(new Float32Array(position),3));
  geometry.setAttribute('aTangent',new BufferAttribute(new Float32Array(tangent),3));
  geometry.setAttribute('aOffset',new BufferAttribute(new Float32Array(offset),2));
  geometry.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));
  geometry.setAttribute('aKind',new BufferAttribute(new Float32Array(kind),1));
  geometry.setAttribute('aRadius',new BufferAttribute(new Float32Array(radius),1));
  geometry.setIndex(index);geometry.computeBoundingSphere();geometry.boundingSphere.radius+=1.2;
  geometry.name='fixed-world-light-ribbon-and-bulbs';return geometry;
}

function makeMaterial(texture){
  const material=new ShaderMaterial({transparent:true,depthTest:true,depthWrite:false,toneMapped:false,side:2,
    uniforms:{uTexture:{value:texture},uOpacity:{value:0},uViewport:{value:{x:390,y:844}}},
    vertexShader:`attribute vec3 aTangent;attribute vec2 aOffset;attribute float aKind;attribute float aRadius;uniform vec2 uViewport;
      varying vec2 vUv;varying float vKind;varying float vCross;varying float vDepth;
      void main(){
        vec4 view=modelViewMatrix*vec4(position,1.);
        if(aKind<.5){
          vec2 along=(modelViewMatrix*vec4(aTangent,0.)).xy;
          vec2 across=vec2(-along.y,along.x)/max(length(along),.0001);
          // Retain the old ink-outline readability below a pixel in distant
          // views. The centre stays anchored and normal gameplay uses world size.
          float pixelWorld=2.*max(-view.z,.01)/(projectionMatrix[1][1]*max(uViewport.y,1.));
          view.xy+=across*sign(aOffset.x)*max(abs(aOffset.x),pixelWorld*1.2);
          vCross=aOffset.x/max(aRadius,.0001);
        }else{view.xy+=aOffset;vCross=0.;}
        vUv=uv;vKind=aKind;vDepth=-view.z;gl_Position=projectionMatrix*view;
      }`,
    fragmentShader:`uniform sampler2D uTexture;uniform float uOpacity;
      varying vec2 vUv;varying float vKind;varying float vCross;varying float vDepth;
      void main(){
        vec4 ink;
        if(vKind<.5){
          float edge=1.-smoothstep(.72,1.,abs(vCross));
          float shine=max(0.,1.-abs(vCross+.28)*1.8)*.48;
          ink=vec4(mix(vec3(.034,.054,.072),vec3(.15,.19,.20),shine),edge);
        }else{ink=texture2D(uTexture,vUv);}
        float alpha=ink.a*uOpacity*smoothstep(.8,1.6,vDepth);
        if(alpha<.004)discard;gl_FragColor=vec4(ink.rgb,alpha);
      }`
  });
  material.forceSinglePass=true;material.name='unlit-world-anchored-light-impostor';return material;
}

export function createForegroundLights(terrain){
  disposeForegroundLights(terrain);
  const state={coordinateSpace:'world',strands:[],meshes:[],materials:[],geometries:[],textures:[],texture:null,
    activeIds:[],opacity:0,hiddenReason:'not-updated',debugShowAll:false,disposed:false,
    metrics:{meshes:0,triangles:0,bulbs:0,drawcalls:0,textureWidth:TILE*COLORS.length,textureHeight:TILE_HEIGHT,
      wireRadius:WIRE_RADIUS,bulbRadius:BULB_RADIUS,bulbHeight:BULB_HEIGHT,fullDistance:FULL_DISTANCE,hideDistance:HIDE_DISTANCE}};
  terrain.workshopForegroundLights=state;
  if(terrain.play<=80){state.hiddenReason='no-authored-strands';return state;}
  const edge=terrain.workshopBoundary?.edge||terrain.play+5,inner=edge-2.1;
  state.texture=bulbAtlas();state.textures.push(state.texture);
  const recipes=[
    {id:'north-wall-arc',z1:-edge*.54,z2:-edge*.90,y1:28,y2:32,sag:20,sweep:edge*.20},
    {id:'middle-wall-arc',z1:-edge*.30,z2:edge*.12,y1:27,y2:29,sag:18,sweep:edge*.12}
  ];
  for(const recipe of recipes){
    const at=t=>[-inner+inner*2*t,recipe.y1+(recipe.y2-recipe.y1)*t-4*t*(1-t)*recipe.sag,
      recipe.z1+(recipe.z2-recipe.z1)*t+Math.sin(Math.PI*t)*recipe.sweep];
    const points=Array.from({length:SEGMENTS+1},(_,i)=>at(i/SEGMENTS)),count=Math.max(18,Math.round(edge*2/7)),bulbs=[];
    for(let i=1;i<count;i++){
      const attachment=at(i/count),drop=.50+(i%3)*.055;
      bulbs.push({id:recipe.id+'-'+i,attachment,center:[attachment[0],attachment[1]-drop,attachment[2]],radius:BULB_RADIUS,
        height:BULB_HEIGHT,drawHeight:.55,drop,color:COLORS[i%COLORS.length],colorIndex:i%COLORS.length});
    }
    const geometry=makeGeometry(points,bulbs),material=makeMaterial(state.texture),mesh=new Mesh(geometry,material);
    mesh.name='world-anchored-light-'+recipe.id;mesh.visible=false;mesh.castShadow=false;mesh.receiveShadow=false;
    mesh.renderOrder=20;mesh.matrixAutoUpdate=false;mesh.updateMatrix();mesh.userData.worldAnchoredLight=true;
    terrain.group.add(mesh);
    const strand={...recipe,points,bulbs,mesh,geometry,material,wireRadius:WIRE_RADIUS,bulbRadius:BULB_RADIUS,
      opacity:0,nearestDistance:Infinity,fullDistance:FULL_DISTANCE,hideDistance:HIDE_DISTANCE};
    state.strands.push(strand);state.meshes.push(mesh);state.materials.push(material);state.geometries.push(geometry);
    state.metrics.triangles+=geometry.index.count/3;state.metrics.bulbs+=bulbs.length;
  }
  state.metrics.meshes=state.metrics.drawcalls=state.meshes.length;
  return state;
}

function hide(state,reason){
  for(const strand of state.strands){strand.mesh.visible=false;strand.opacity=0;strand.material.uniforms.uOpacity.value=0;}
  state.activeIds.length=0;state.opacity=0;state.hiddenReason=reason;
}

export function updateForegroundLights(run,dt){
  const terrain=run.terrain,state=terrain?.workshopForegroundLights;if(!state||state.disposed)return;
  if(!run.player||run.player.dead||!terrain.group.visible){hide(state,'inactive-world');return;}
  if(!['play','paused','pause','capturing'].includes(run.state)){hide(state,'non-play-state');return;}
  if(!state.strands.length){hide(state,'no-authored-strands');return;}
  state.activeIds.length=0;state.opacity=0;
  const p=run.player.pos;
  for(const strand of state.strands){
    const viewport=strand.material.uniforms.uViewport.value,buffer=run.r?.composer?.inputBuffer;
    viewport.x=buffer?.width||390;viewport.y=buffer?.height||844;
    strand.nearestDistance=distanceToStrand(strand.points,p.x,p.z);
    const opacity=state.debugShowAll?1:strandOpacity(strand.nearestDistance);
    strand.opacity=opacity<.005?0:opacity;strand.material.uniforms.uOpacity.value=strand.opacity;
    strand.mesh.visible=strand.opacity>0;
    if(strand.mesh.visible){state.activeIds.push(strand.id);state.opacity=Math.max(state.opacity,strand.opacity);}
  }
  state.hiddenReason=state.activeIds.length?null:'outside-corridors';
}

export function disposeForegroundLights(terrain){
  const state=terrain?.workshopForegroundLights;if(!state||state.disposed)return;
  hide(state,'disposed');state.disposed=true;
  for(const mesh of state.meshes)mesh.parent?.remove(mesh);
  for(const geometry of state.geometries)geometry.dispose();
  for(const material of state.materials)material.dispose();
  for(const texture of state.textures)texture.dispose();
  terrain.workshopForegroundLights=null;
}
