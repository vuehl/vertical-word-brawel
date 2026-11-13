import {b as CanvasTexture,ot as SRGB,ct as ShaderMaterial} from '../assets/three-DmSYIDKK.js';
import {lampPlayerUniform,lampDistanceGLSL} from './workshop-proximity.js';

// One continuous honey-walnut tabletop. Sparse, wrapped brush shapes keep
// opposite texture edges seamless without plank seams or regular grain bands.
export function paintedPlankCanvas(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const c=canvas.getContext('2d');
  let seed=719;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  c.fillStyle='#b18b65';c.fillRect(0,0,1024,1024);
  const wrap=draw=>{
    for(const x of [-1024,0,1024])for(const y of [-1024,0,1024]){
      c.save();c.translate(x,y);draw();c.restore();
    }
  };
  for(let j=0;j<11;j++){
    const x=random()*1024,y=random()*1024,w=270+random()*520,h=14+random()*43,tilt=(random()-.5)*16;
    wrap(()=>{
      const wash=c.createLinearGradient(0,y-h,0,y+h);
      wash.addColorStop(0,'#795a3d00');wash.addColorStop(.48,j%3?'#e5c49712':'#795a3d0d');wash.addColorStop(1,'#795a3d00');
      c.fillStyle=wash;c.beginPath();c.moveTo(x,y);
      c.bezierCurveTo(x+w*.19,y-h*.82,x+w*.67,y-h+tilt,x+w,y+tilt);
      c.bezierCurveTo(x+w*.69,y+h*.67+tilt,x+w*.24,y+h*.45,x,y);c.closePath();c.fill();
    });
  }
  c.lineCap='round';
  for(let j=0;j<19;j++){
    const x=random()*1024,y=random()*1024,w=38+random()*185,bend=(random()-.5)*7;
    wrap(()=>{
      c.strokeStyle=j%4?'#79583b17':'#f0d3a71a';c.lineWidth=j%3?1.2:2;
      c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+w*.28,y+bend,x+w*.7,y+bend*.5,x+w,y+bend*.65);c.stroke();
      if(j%5===0){c.strokeStyle='#8063470d';c.lineWidth=1;c.beginPath();c.moveTo(x+w*.17,y+4);c.quadraticCurveTo(x+w*.52,y+4+bend*.5,x+w*.84,y+3+bend*.65);c.stroke();}
    });
  }
  return canvas;
}

// A single flat pigment silhouette with a narrow smooth falloff. Each prop
// receives one stamp; there is no second real-time shadow pass underneath it.
export function paintContactShadow(c,w=128,h=128){
  const image=c.createImageData(w,h),data=image.data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const qx=Math.max(Math.abs((x+.5)/w*2-1)-.58,0),qy=Math.max(Math.abs((y+.5)/h*2-1)-.58,0);
    const d=Math.hypot(qx,qy),t=Math.max(0,Math.min(1,(d-.08)/.30)),a=1-t*t*(3-2*t),i=(y*w+x)*4;
    data[i]=48;data[i+1]=65;data[i+2]=89;data[i+3]=Math.round(a*48);
  }
  c.putImageData(image,0,0);
}

export function workshopLampHalo(assets){
  if(assets.mats.has('lamp-halo'))return assets.mats.get('lamp-halo');
  const material=new ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,
    uniforms:{uHaloAlpha:{value:.27},uToyPlayer:lampPlayerUniform(assets)},
    vertexShader:`varying vec2 vUv;varying vec3 vToyLampWorld;varying vec3 vLampColor;
      void main(){
        vToyLampWorld=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
        vLampColor=instanceColor;
        vec4 mv=modelViewMatrix*instanceMatrix*vec4(0.,0.,0.,1.);
        mv.xy+=position.xy*vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));
        gl_Position=projectionMatrix*mv;vUv=uv;
      }`,
    fragmentShader:`uniform float uHaloAlpha;uniform vec3 uToyPlayer;varying vec2 vUv;varying vec3 vToyLampWorld;varying vec3 vLampColor;
      void main(){float d=length(vUv-.5);float awake=${lampDistanceGLSL};float a=(1.-smoothstep(.08,.49,d))*uHaloAlpha*awake;if(a<.003)discard;gl_FragColor=vec4(vLampColor,a);}`});
  material.name='steady-painted-lamp-halo';assets.mats.set('lamp-halo',material);return material;
}

export function createPlankTexture(){
  const texture=new CanvasTexture(paintedPlankCanvas());texture.colorSpace=SRGB;
  texture.anisotropy=4;texture.wrapS=texture.wrapT=1000;texture.generateMipmaps=true;
  texture.name='continuous-honey-walnut-desktop';return texture;
}
