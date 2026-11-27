import {B as InstanceAttribute,j as DynamicDraw,ct as ShaderMaterial} from '../vendor/three-DmSYIDKK.js';
import {buildGlyphGeometry} from './glyph-geometry.js';
import {createGlyphSkeleton,glyphModels} from './glyph-skeleton.js';
import {applyShelfMaterial} from '../world/desk-shelf.js';
import {maskSceneInk} from '../effects/scene-ink.js';

const standY=.849,standZ=.528;
const vertexShader=`
attribute vec2 strokeBind;
attribute vec3 iPos; attribute vec2 iSize; attribute vec4 iFx; attribute vec4 iTint; attribute vec4 iPose;
uniform sampler2D uBones;
varying vec3 vNormal; varying float vShell; varying vec4 vTint; varying vec4 vFx; varying vec3 vLocal; varying float vDepth;
void main(){
  int bone=int(strokeBind.x)*4, row=int(iPose.x);
  mat4 skin=mat4(texelFetch(uBones,ivec2(bone,row),0),texelFetch(uBones,ivec2(bone+1,row),0),
                 texelFetch(uBones,ivec2(bone+2,row),0),texelFetch(uBones,ivec2(bone+3,row),0));
  vec3 p=(skin*vec4(position,1.)).xyz;
  vec3 n=normalize(transpose(inverse(mat3(skin)))*normal);
  float cs=cos(iPose.z),sn=sin(iPose.z);
  mat3 turn=mat3(cs,0.,-sn, 0.,1.,0., sn,0.,cs);
  // Fixed world axes. The camera can orbit this closed solid in a cinematic.
  mat3 stand=mat3(1.,0.,0., 0.,${standY},-${standZ}, 0.,${standZ},${standY});
  vec2 size=iSize*iPose.w*vec2(1.+.35*iFx.w,1.-.3*iFx.w);
  vec3 local=turn*p;
  vec3 world=iPos+stand*(local*vec3(size.x,size.y,size.x));
  vec4 mv=viewMatrix*vec4(world,1.);
  mv.z+=.25+iSize.y*.05;
  gl_Position=projectionMatrix*mv;
  if(strokeBind.x>=iPose.y)gl_Position=vec4(2.,2.,2.,1.);
  vNormal=stand*turn*n; vShell=strokeBind.y; vTint=iTint; vFx=iFx; vLocal=position; vDepth=-mv.z;
}`;

const fragmentShader=`
uniform vec3 uGlyphColor; uniform vec3 uInk; uniform vec3 uLight;
uniform float uClassic; uniform float uHero; uniform float uEnemy; uniform float uTime;
uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar;
varying vec3 vNormal; varying float vShell; varying vec4 vTint; varying vec4 vFx; varying vec3 vLocal; varying float vDepth;
vec3 encounterInk(float code){
  float pulse=.75+.25*sin(uTime*8.);
  if(code<1.5)return vec3(1.,.85,.2)*1.6*pulse;
  if(code<2.5)return vec3(1.,.15,.1)*1.6*pulse;
  if(code<3.5)return vec3(1.);
  if(code<4.5)return vec3(.3,1.,1.)*1.6*pulse;
  if(code<6.5)return (.6+.4*cos(uTime*4.+vLocal.y*40.+vec3(0.,2.1,4.2)))*1.6*pulse;
  return (code<7.5?vec3(.85,.35,1.):vec3(.35,1.,.4))*1.6*pulse;
}
void main(){
  vec3 n=normalize(vNormal);
  float light=.56+.50*max(0.,dot(n,normalize(vec3(-.4,.82,.5))));
  vec3 color=uGlyphColor;
  if(uClassic>.5)color=color.brg;
  else if(uHero>.5&&(vFx.z>8.9||(vFx.z>4.9&&vFx.z<6.5)))color=color.gbr;
  else if(uEnemy>.5&&vFx.z>4.9&&vFx.z<6.5){
    vec3 k=vec3(.57735);float a=fract(vFx.z)*6.2832;
    color=color*cos(a)+cross(k,color)*sin(a)+k*dot(k,color)*(1.-cos(a));
  }
  color*=light*uLight;
  color=mix(color,color*vTint.rgb*1.4+vTint.rgb*.12,vTint.w);
  if(vShell>.5)color=uEnemy>.5&&vFx.z>.5?encounterInk(vFx.z):uInk;
  color=mix(color,vec3(1.),clamp(vFx.x,0.,1.));
  if(vFx.y>0. && fract(sin(dot(floor(vLocal.xy*96.),vec2(12.9898,78.233)))*43758.5453)<vFx.y)discard;
  if(uEnemy>.5)color=mix(color,uFogColor,smoothstep(uFogNear,uFogFar,vDepth));
  gl_FragColor=vec4(color,1.-clamp(-vFx.y,0.,1.));
}`;

const linear=rgb=>new Float32Array(rgb.map(c=>((c/255+.055)/1.055)**2.4));
export const glyphPoseAttribute=()=>new InstanceAttribute(new Float32Array(4),4).setUsage(DynamicDraw);

export function createGlyphModel(word){
  const spec=glyphModels[word],rig=createGlyphSkeleton(word);
  const geometry=buildGlyphGeometry(spec),color={value:linear(spec.color)};
  return {geometry,rig,strokeCount:spec.strokes.length,
    // Place the existing capture particles on the actual animated model surface.
    // The caller supplies the same instance values as the vertex shader.
    capturePoint(out,x,y,bone,quad){
      let z=.059;
      const [row,,yaw,scale]=quad.pose;
      if(bone!=null){
        const data=rig.palette.image.data,j=(row*spec.strokes.length+bone)*16;
        const sx=data[j]*x+data[j+4]*y+data[j+12],sy=data[j+1]*x+data[j+5]*y+data[j+13];
        z+=data[j+14]+bone*.00012;x=sx;y=sy;
      }
      const cs=Math.cos(yaw),sn=Math.sin(yaw);
      const width=quad.size[0]*scale*(1+.35*quad.squash),height=quad.size[1]*scale*(1-.3*quad.squash);
      const dx=(cs*x+sn*z)*width,dy=y*height,dz=(cs*z-sn*x)*width;
      return out.set(quad.pos[0]+dx,quad.pos[1]+standY*dy+standZ*dz,quad.pos[2]-standZ*dy+standY*dz);
    },
    material(source,shelf,ally){
      const material=new ShaderMaterial({vertexShader,fragmentShader,transparent:true,depthWrite:true,
        uniforms:{...source.material.uniforms,uBones:{value:rig.palette},uGlyphColor:ally??color,
          uClassic:{value:Number(!ally&&source.zxOriginalGlyph&&source.id!==source.sid)},
          uHero:{value:Number(!ally&&source.zxOriginalGlyph)},uEnemy:{value:Number(!ally&&!source.zxOriginalGlyph&&!source.zxBossGlyph)},
          uInk:{value:linear(word==='龘'?[0,0,0]:[45,37,49])}}});
      maskSceneInk(material);
      applyShelfMaterial(material,shelf);
      return material;
    },
    dispose(){geometry.dispose();rig.dispose();}
  };
}
