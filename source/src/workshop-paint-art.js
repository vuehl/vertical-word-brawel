import {b as CanvasTexture,ot as SRGB,ct as ShaderMaterial} from '../assets/three-DmSYIDKK.js';
import {lampPlayerUniform,lampDistanceGLSL} from './workshop-proximity.js';

// Painted plank shapes, not a height/noise field. Opposite tile edges agree;
// broad angular grain and short tapered cracks never become periodic ripples.
export function paintedPlankCanvas(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const c=canvas.getContext('2d'),height=1024/6;
  const colors=['#a77550','#b68157','#aa7852','#b6865e','#a97750','#b17e55'];
  let seed=719;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  c.fillStyle='#674932';c.fillRect(0,0,1024,1024);
  for(let row=0;row<6;row++){
    const y=row*height;c.fillStyle=colors[row];c.fillRect(0,y+2,1024,height-3);
    // One broad wash per board, with a quiet centre and shaded lower bevel.
    const wash=c.createLinearGradient(0,y,0,y+height);
    wash.addColorStop(0,'#f5cc9330');wash.addColorStop(.18,'#f5cc9305');wash.addColorStop(.75,'#543a2800');wash.addColorStop(1,'#543a2820');
    c.fillStyle=wash;c.fillRect(0,y+3,1024,height-5);
    for(let j=0;j<8;j++){
      const x=22+random()*800,yy=y+20+random()*(height-45),w=65+random()*190,h=3+random()*10;
      c.fillStyle=j%3?'#e1b38319':'#6d492e17';
      c.beginPath();c.moveTo(x,yy);c.lineTo(x+w*.23,yy-h*.5);c.lineTo(x+w*.78,yy-h*.35);
      c.lineTo(x+w,yy+h*.15);c.lineTo(x+w*.6,yy+h*.4);c.lineTo(x+w*.18,yy+h);c.closePath();c.fill();
    }
    for(let j=0;j<2;j++){
      const x=90+random()*690,yy=y+35+random()*(height-65),w=55+random()*110;
      c.fillStyle='#714a3460';c.beginPath();c.moveTo(x,yy);c.lineTo(x+w*.3,yy-2);c.lineTo(x+w*.54,yy+1);
      c.lineTo(x+w,yy-1);c.lineTo(x+w*.68,yy+3);c.lineTo(x+w*.24,yy+2);c.closePath();c.fill();
    }
    const joint=[325,778,540,185,690,450][row];
    c.strokeStyle='#65452e9c';c.lineWidth=2.4;c.beginPath();c.moveTo(joint,y+2);c.lineTo(joint,y+height*.32);c.lineTo(joint+3,y+height*.34);c.lineTo(joint+3,y+height-1);c.stroke();
    c.strokeStyle='#e7b98155';c.lineWidth=1.3;c.beginPath();c.moveTo(joint+5,y+4);c.lineTo(joint+5,y+height-4);c.stroke();
    c.fillStyle='#654732b3';c.fillRect(0,y,1024,2.2);c.fillStyle='#e4b57d66';c.fillRect(0,y+3,1024,1.4);
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
  texture.name='hand-painted-brown-planks';return texture;
}
