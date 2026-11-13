import {b as CanvasTexture,ot as SRGB,WorkshopStandardMaterial as Material,ct as ShaderMaterial} from '../assets/three-DmSYIDKK.js';
import {createPlankTexture} from './workshop-paint-art.js';
import {workshopShadowShader} from './workshop-shadows.js';

// Three painted value bands replace the physical lacquer/metal response.
// Every scenery surface shares flat pigment shading. Brush texture belongs in
// the albedo only; coordinate-based waves must never modulate the lighting.
export function stabiliseWorkshopBump(material){
  material.metalness=0;material.roughness=1;material.bumpMap=null;material.bumpScale=0;
  material.normalMap=null;material.displacementMap=null;
  material.userData.inkPaint=true;
  material.onBeforeCompile=shader=>{
    workshopShadowShader(shader);
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      float baseValue=max(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)),.015);
      float direct=dot(reflectedLight.directDiffuse,vec3(.2126,.7152,.0722))/baseValue;
      // directDiffuse includes the sun's shadow visibility. Keep the warm band
      // reachable on upward faces, and keep the weak fill inside the cool band.
      float lit=smoothstep(.10,.38,direct);
      float sunlit=smoothstep(.38,.67,direct);
      vec3 cool=vec3(.24,.34,.56),mid=vec3(.70,.76,.88),warm=vec3(1.32,1.06,.68);
      vec3 painted=mix(mix(cool,mid,lit),warm,sunlit);
      // A little neutral pigment lets pale blue paper catch amber light while
      // saturated book covers and desk pads retain their material colours.
      vec3 pigmentBase=mix(diffuseColor.rgb,vec3(baseValue),sunlit*.18);
      pigmentBase=mix(pigmentBase,vec3(.28,.39,.64)*sqrt(baseValue),(1.-lit)*.26);
      outgoingLight=pigmentBase*painted;
      // Cap the lit pigment before blending the shadow. Normalizing only after
      // the blend can make a pale surface brighter in a medium-strength shadow.
      outgoingLight*=min(1.,.94/max(max(max(outgoingLight.r,outgoingLight.g),outgoingLight.b),.001));
      vec3 projectedPigment=pigmentBase*vec3(.34,.48,.76);
      outgoingLight=mix(outgoingLight,projectedPigment,workshopProjectedShadow);
      outgoingLight+=totalEmissiveRadiance*.24;
      // Preserve hue and texture detail instead of clipping pale pigment white.
      outgoingLight*=min(1.,.94/max(max(max(outgoingLight.r,outgoingLight.g),outgoingLight.b),.001));
      #include <opaque_fragment>
    `);
  };
  material.customProgramCacheKey=()=> 'workshop-continuous-shadow-filter-v7';return material;
}

// The playfield uses its own quiet, flat texture. Curved wood knots and
// periodic light bands read as ripples when stretched across the whole desk.
export function workshopFloorTexture(assets){
  if(assets.textures.has('desk-maple'))return assets.textures.get('desk-maple');
  const texture=createPlankTexture();assets.textures.set('desk-maple',texture);return texture;
}

// Broad, deliberately drawn marks retain the handmade material identity without
// photographic pores, scratches or noisy fabric fibres at the close camera.
function paintedMaterial(name){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=768;
  const c=canvas.getContext('2d');c.fillStyle={maple:'#e7b572',linen:'#fff7e8',storybook:'#b34e45',paper:'#dcefff'}[name];c.fillRect(0,0,768,768);
  c.lineCap='round';
  if(name==='maple'){
    // Props use straight, sparse grain too, including the desktop edge and wood joinery.
    for(let j=0;j<28;j++){
      const x=12+(j*193)%590,y=10+(j*137)%748,w=55+(j*43)%140;
      c.strokeStyle=j%3?'#fff0c418':'#93663d12';c.lineWidth=j%3?2:1;
      c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.stroke();
    }
  }else if(name==='linen'){
    // Avoid repeating fine weave grids, which create moire on oblique surfaces.
    c.lineWidth=1;c.strokeStyle='#b6a58b12';
    for(let j=0;j<95;j++){const x=(j*173)%750,y=(j*113)%750;c.beginPath();c.moveTo(x,y);c.lineTo(x+5+j%8,y);c.stroke();}
  }else if(name==='storybook'){
    c.strokeStyle='#efce827d';c.lineWidth=4;c.strokeRect(32,32,704,704);c.lineWidth=1.5;c.strokeRect(43,43,682,682);
    for(const [x,y] of [[87,87],[681,87],[87,681],[681,681]]){c.fillStyle='#f3d68d';c.beginPath();for(let j=0;j<8;j++){const a=j*Math.PI/4,r=j%2?8:20;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();c.fill();}
    c.strokeStyle='#e8c57666';c.lineWidth=2;c.beginPath();c.ellipse(384,384,116,151,0,0,Math.PI*2);c.stroke();
    c.fillStyle='#ebcd83';c.beginPath();for(let j=0;j<8;j++){const a=j*Math.PI/4,r=j%2?18:48;c.lineTo(384+Math.cos(a)*r,384+Math.sin(a)*r);}c.closePath();c.fill();
  }
  // Paper has one clean pigment base. Its notebook ruling is drawn once by
  // notebook(), so a second set of curved lines cannot produce interference.
  for(let j=0;j<(name==='paper'?0:40);j++){
    const x=(j*173.7)%768,y=(j*97.3)%768,w=28+(j%7)*14;
    c.strokeStyle=j%3?'#fff4cf12':'#527ca510';c.lineWidth=2+j%3;
    c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.stroke();
    c.lineWidth=.7;c.strokeStyle='#fff9e51c';c.beginPath();c.moveTo(x+4,y+3);c.lineTo(x+w*.8,y+1);c.stroke();
  }
  return canvas;
}
export function workshopPhoto(assets,name){
  if(assets.photos.has(name))return assets.photos.get(name);
  const canvas=paintedMaterial(name);
  const t=new CanvasTexture(canvas);t.colorSpace=SRGB;t.anisotropy=4;t.generateMipmaps=true;
  if(name==='linen'){t.wrapS=t.wrapT=1000;t.repeat.set(4,4);}
  const ready=Promise.resolve(canvas);
  const record={texture:t,ready,style:'painted-toy'};assets.photos.set(name,record);assets.textures.set('photo-'+name,t);assets.photoJobs.push(ready);return record;
}
export function workshopSurface(assets,key,{color=0xffffff,photo='linen',roughness=.78,metalness=0,bump=.035}={}){
  if(assets.mats.has(key))return assets.mats.get(key);
  const map=workshopPhoto(assets,photo).texture;
  const material=stabiliseWorkshopBump(new Material({color,map,roughness:1,metalness:0}));assets.mats.set(key,material);return material;
}

// A shared back-face ink hull gives actual silhouettes a controlled pen width.
// It reuses the same geometry and instance culling as the coloured surface.
export function workshopInk(assets){
  if(assets.mats.has('ink-contour'))return assets.mats.get('ink-contour');
  const material=new ShaderMaterial({side:1,depthWrite:false,uniforms:{uInkViewport:{value:{x:780,y:1688}}},
    vertexShader:`uniform vec2 uInkViewport;
      void main(){
        vec4 local=vec4(position,1.);vec3 n=normal;
        #ifdef USE_INSTANCING
          local=instanceMatrix*local;
          vec3 lengths=vec3(dot(instanceMatrix[0].xyz,instanceMatrix[0].xyz),dot(instanceMatrix[1].xyz,instanceMatrix[1].xyz),dot(instanceMatrix[2].xyz,instanceMatrix[2].xyz));
          n=mat3(instanceMatrix)*(n/max(lengths,vec3(.00001)));
        #endif
        vec4 view=modelViewMatrix*local;vec3 vn=normalize(normalMatrix*n);
        vec4 clip=projectionMatrix*view;vec2 dir=(projectionMatrix*vec4(vn,0.)).xy;
        clip.xy+=dir/max(length(dir),.00001)*(2.8/uInkViewport)*clip.w;
        gl_Position=clip;
      }`,
    fragmentShader:`void main(){gl_FragColor=vec4(.052,.068,.102,1.);}`});
  material.name='hand-drawn-ink-contour';assets.mats.set('ink-contour',material);return material;
}
